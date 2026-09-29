import { AppState, AuditEntry, AuditType, Customer, DepositStatus, OfferStatus, Policy, Reservation, ReservationSource, ReservationStatus, Service, Staff, WaitlistEntry, WaitlistOffer, WaitlistStatus } from './types';
import { POLICY_LIMITS, PolicyField, repairPolicy } from './policy';
import { backupLimit } from './validation';

// Strict validation for JSON backups that a user picks for restore (and for LocalRepository.replace).
// Everything is checked BEFORE anything is stored: structure, field types, allowed status values, duplicate IDs,
// references between records, real calendar dates and size limits. The result is a freshly built AppState that only contains known fields.
// The six numeric policy values keep the P0-1 behaviour: unusable values are replaced by defaults (and reported) instead of rejecting the backup.
// Not checked on purpose: business-state combinations (for example deposit vs. reservation status) and overlapping reservations,
// because states written by the app itself can already contain them and a backup made by the app must always be restorable.

export const BACKUP_LIMITS = { services: 100, staff: 100, customers: 5000, reservations: 3000, waitlist: 3000, audit: 10000 } as const;
export const RESTORE_CONFIRM_TEXT = '복원';
// A UTF-8 file can use up to 3 bytes per counted character; anything bigger is refused before it is even read.
export const MAX_BACKUP_BYTES = backupLimit() * 3;
const MAX_SHOWN_ERRORS = 100;

const RESERVATION_STATUS = ['requested', 'confirmed', 'arrived', 'completed', 'cancelled', 'no_show'] as const satisfies readonly ReservationStatus[];
const DEPOSIT_STATUS = ['not_required', 'unpaid', 'paid', 'refunded', 'forfeited'] as const satisfies readonly DepositStatus[];
const WAITLIST_STATUS = ['waiting', 'offered', 'booked', 'expired', 'removed'] as const satisfies readonly WaitlistStatus[];
const OFFER_STATUS = ['open', 'accepted', 'declined', 'expired'] as const satisfies readonly OfferStatus[];
const SOURCE = ['manual', 'csv', 'waitlist', 'practice'] as const satisfies readonly ReservationSource[];
const AUDIT_TYPE = ['reservation', 'deposit', 'cancel', 'noshow', 'waitlist', 'offer', 'policy', 'import', 'system'] as const satisfies readonly AuditType[];

export interface BackupInspection { ok: boolean; errors: string[]; totalErrors: number; state?: AppState; notes: string[]; }
type Obj = Record<string, unknown>;
const isObj = (x: unknown): x is Obj => !!x && typeof x === 'object' && !Array.isArray(x);

class Issues { list: string[] = []; total = 0; add(message: string) { this.total++; if (this.list.length < MAX_SHOWN_ERRORS) this.list.push(message); } }
function show(v: unknown) { let s: string; try { s = v === undefined ? '없음' : JSON.stringify(v) ?? String(v); } catch { s = String(v); } return s.length > 40 ? s.slice(0, 37) + '…' : s; }
function tag(kind: string, index: number, o: unknown) { const id = isObj(o) && typeof o.id === 'string' && o.id ? ` (${o.id.length > 40 ? o.id.slice(0, 37) + '…' : o.id})` : ''; return `${kind} ${index + 1}번째${id}`; }

function str(o: Obj, k: string, at: string, c: Issues, max = 5000, nonEmpty = false): string {
  const v = o[k];
  if (typeof v !== 'string') { c.add(`${at}: ${k}는 문자열이어야 합니다 (현재 ${show(v)}).`); return ''; }
  if (nonEmpty && !v.trim()) { c.add(`${at}: ${k}가 비어 있습니다.`); return v; }
  if (v.length > max) { c.add(`${at}: ${k}가 너무 깁니다 (최대 ${max}자).`); return v.slice(0, max); }
  return v;
}
function optStr(o: Obj, k: string, at: string, c: Issues, max = 5000): string | undefined { return o[k] === undefined ? undefined : str(o, k, at, c, max); }
function num(o: Obj, k: string, at: string, c: Issues, r: { min?: number; max?: number; integer?: boolean } = {}): number {
  const v = o[k];
  if (typeof v !== 'number' || !Number.isFinite(v)) { c.add(`${at}: ${k}는 유한한 숫자여야 합니다 (현재 ${show(v)}).`); return 0; }
  if (r.integer && !Number.isInteger(v)) c.add(`${at}: ${k}는 정수여야 합니다 (현재 ${show(v)}).`);
  else if ((r.min !== undefined && v < r.min) || (r.max !== undefined && v > r.max)) c.add(`${at}: ${k}는 ${r.min ?? '-∞'} 이상 ${r.max ?? '∞'} 이하여야 합니다 (현재 ${show(v)}).`);
  return v;
}
function bool(o: Obj, k: string, at: string, c: Issues): boolean {
  if (typeof o[k] !== 'boolean') { c.add(`${at}: ${k}는 true 또는 false여야 합니다 (현재 ${show(o[k])}).`); return false; }
  return o[k] as boolean;
}
function oneOf<T extends string>(o: Obj, k: string, list: readonly T[], at: string, c: Issues): T {
  const v = o[k];
  if (typeof v !== 'string' || !(list as readonly string[]).includes(v)) { c.add(`${at}: ${k} 값 ${show(v)}은(는) 허용되지 않습니다 (허용: ${list.join(', ')}).`); return list[0]; }
  return v as T;
}
const ISO = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/;
export function validIso(x: unknown): x is string {
  if (typeof x !== 'string') return false;
  const m = ISO.exec(x);
  if (!m) return false;
  if (Number(m[4]) > 23 || Number(m[5]) > 59 || Number(m[6]) > 59) return false;
  const day = `${m[1]}-${m[2]}-${m[3]}`;
  const d = new Date(`${day}T12:00:00Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== day) return false; // 2026-02-30, month 13, ...
  return Number.isFinite(Date.parse(x));
}
function date(o: Obj, k: string, at: string, c: Issues): string {
  const v = o[k];
  if (!validIso(v)) { c.add(`${at}: ${k}는 실제로 존재하는 시각(예: 2026-09-29T09:00:00.000Z)이어야 합니다 (현재 ${show(v)}).`); return typeof v === 'string' ? v : ''; }
  return v;
}
function optDate(o: Obj, k: string, at: string, c: Issues): string | undefined { return o[k] === undefined ? undefined : date(o, k, at, c); }
function id(o: Obj, at: string, c: Issues): string { return str(o, 'id', at, c, 200, true); }
function before(a: string, b: string) { return validIso(a) && validIso(b) && Date.parse(a) < Date.parse(b); }
function unique(ids: string[], kind: string, c: Issues) {
  const seen = new Map<string, number>();
  for (const v of ids) if (v) seen.set(v, (seen.get(v) ?? 0) + 1);
  for (const [v, n] of seen) if (n > 1) c.add(`${kind} ID ${show(v)}가 ${n}번 중복됩니다.`);
}
function list(v: unknown, name: string, limit: number, c: Issues, unusable: Set<string>, key: string): unknown[] {
  if (!Array.isArray(v)) { c.add(`${name} 목록이 배열이 아닙니다.`); unusable.add(key); return []; }
  if (v.length > limit) { c.add(`${name}가 너무 많습니다: ${v.length}개 (최대 ${limit}개).`); unusable.add(key); return []; }
  return v;
}

function parseService(o: unknown, i: number, c: Issues): Service {
  const at = tag('서비스', i, o);
  if (!isObj(o)) { c.add(`${at}: 객체가 아닙니다.`); return { id: '', name: '', durationMin: 0, price: 0, deposit: 0, bufferMin: 0, active: false }; }
  return { id: id(o, at, c), name: str(o, 'name', at, c, 200, true), durationMin: num(o, 'durationMin', at, c, { min: 1, max: 1440 }), price: num(o, 'price', at, c, { min: 0, max: 1e9 }), deposit: num(o, 'deposit', at, c, { min: 0, max: 1e9 }), bufferMin: num(o, 'bufferMin', at, c, { min: 0, max: 1440 }), active: bool(o, 'active', at, c) };
}
function parseStaff(o: unknown, i: number, c: Issues): Staff {
  const at = tag('담당자', i, o);
  if (!isObj(o)) { c.add(`${at}: 객체가 아닙니다.`); return { id: '', name: '', serviceIds: [], active: false }; }
  let serviceIds: string[] = [];
  if (!Array.isArray(o.serviceIds)) c.add(`${at}: serviceIds는 배열이어야 합니다 (현재 ${show(o.serviceIds)}).`);
  else if (o.serviceIds.length > BACKUP_LIMITS.services) c.add(`${at}: serviceIds가 너무 많습니다.`);
  else serviceIds = o.serviceIds.map((x, n) => { if (typeof x !== 'string' || !x) { c.add(`${at}: serviceIds[${n}]는 비어 있지 않은 문자열이어야 합니다 (현재 ${show(x)}).`); return ''; } return x; });
  return { id: id(o, at, c), name: str(o, 'name', at, c, 200, true), serviceIds, active: bool(o, 'active', at, c) };
}
function parseCustomer(o: unknown, i: number, c: Issues): Customer {
  const at = tag('고객', i, o);
  if (!isObj(o)) { c.add(`${at}: 객체가 아닙니다.`); return { id: '', name: '', phone: '', email: '', notes: '', visitCount: 0, noShowCount: 0 }; }
  // visitCount / noShowCount only have to be finite numbers: a customer CSV can already put any number there.
  return { id: id(o, at, c), name: str(o, 'name', at, c, 200, true), phone: str(o, 'phone', at, c, 200), email: str(o, 'email', at, c, 320), notes: str(o, 'notes', at, c), visitCount: num(o, 'visitCount', at, c), noShowCount: num(o, 'noShowCount', at, c) };
}
function parseReservation(o: unknown, i: number, c: Issues): Reservation {
  const at = tag('예약', i, o);
  const empty: Reservation = { id: '', customerId: '', serviceId: '', staffId: '', startAt: '', endAt: '', status: 'requested', depositStatus: 'not_required', depositAmount: 0, createdAt: '', source: 'manual', note: '' };
  if (!isObj(o)) { c.add(`${at}: 객체가 아닙니다.`); return empty; }
  const r: Reservation = { id: id(o, at, c), customerId: str(o, 'customerId', at, c, 200, true), serviceId: str(o, 'serviceId', at, c, 200, true), staffId: str(o, 'staffId', at, c, 200, true), startAt: date(o, 'startAt', at, c), endAt: date(o, 'endAt', at, c), status: oneOf(o, 'status', RESERVATION_STATUS, at, c), depositStatus: oneOf(o, 'depositStatus', DEPOSIT_STATUS, at, c), depositAmount: num(o, 'depositAmount', at, c, { min: 0, max: 1e9 }), createdAt: date(o, 'createdAt', at, c), source: oneOf(o, 'source', SOURCE, at, c), note: str(o, 'note', at, c) };
  if (validIso(r.startAt) && validIso(r.endAt) && !before(r.startAt, r.endAt)) c.add(`${at}: endAt은 startAt보다 뒤여야 합니다.`);
  const reason = optStr(o, 'cancelReason', at, c); if (reason !== undefined) r.cancelReason = reason;
  const cancelledAt = optDate(o, 'cancelledAt', at, c); if (cancelledAt !== undefined) r.cancelledAt = cancelledAt;
  const from = optStr(o, 'recoveredFromReservationId', at, c, 200); if (from !== undefined) r.recoveredFromReservationId = from;
  const wid = optStr(o, 'waitlistId', at, c, 200); if (wid !== undefined) r.waitlistId = wid;
  return r;
}
function parseOffer(o: unknown, at: string, c: Issues): WaitlistOffer | undefined {
  if (o === undefined) return undefined;
  const a = `${at}의 제안(offer)`;
  if (!isObj(o)) { c.add(`${a}: 객체가 아닙니다.`); return undefined; }
  const offer: WaitlistOffer = { slotStart: date(o, 'slotStart', a, c), slotEnd: date(o, 'slotEnd', a, c), staffId: str(o, 'staffId', a, c, 200, true), cancelledReservationId: str(o, 'cancelledReservationId', a, c, 200, true), sentAt: date(o, 'sentAt', a, c), expiresAt: date(o, 'expiresAt', a, c), status: oneOf(o, 'status', OFFER_STATUS, a, c) };
  if (validIso(offer.slotStart) && validIso(offer.slotEnd) && !before(offer.slotStart, offer.slotEnd)) c.add(`${a}: slotEnd는 slotStart보다 뒤여야 합니다.`);
  return offer;
}
function parseWaitlist(o: unknown, i: number, c: Issues): WaitlistEntry {
  const at = tag('대기자', i, o);
  const empty: WaitlistEntry = { id: '', customerId: '', serviceId: '', staffId: null, windowStart: '', windowEnd: '', status: 'waiting', createdAt: '', note: '' };
  if (!isObj(o)) { c.add(`${at}: 객체가 아닙니다.`); return empty; }
  let staffId: string | null = null;
  if (o.staffId === null) staffId = null; else staffId = str(o, 'staffId', at, c, 200, true);
  const w: WaitlistEntry = { id: id(o, at, c), customerId: str(o, 'customerId', at, c, 200, true), serviceId: str(o, 'serviceId', at, c, 200, true), staffId, windowStart: date(o, 'windowStart', at, c), windowEnd: date(o, 'windowEnd', at, c), status: oneOf(o, 'status', WAITLIST_STATUS, at, c), createdAt: date(o, 'createdAt', at, c), note: str(o, 'note', at, c) };
  if (validIso(w.windowStart) && validIso(w.windowEnd) && !before(w.windowStart, w.windowEnd)) c.add(`${at}: windowEnd는 windowStart보다 뒤여야 합니다.`);
  const offer = parseOffer(o.offer, at, c);
  if (offer) w.offer = offer;
  // The engine keeps these in step: an entry is "offered" exactly while its offer is open, and "booked" only after the offer was accepted.
  if (w.status === 'offered' && (!offer || offer.status !== 'open')) c.add(`${at}: status가 offered이면 상태가 open인 제안(offer)이 있어야 합니다.`);
  if (offer && offer.status === 'open' && w.status !== 'offered') c.add(`${at}: 제안(offer)이 open이면 status는 offered여야 합니다 (현재 ${show(w.status)}).`);
  if (w.status === 'booked' && (!offer || offer.status !== 'accepted')) c.add(`${at}: status가 booked이면 수락된(accepted) 제안(offer)이 있어야 합니다.`);
  return w;
}
function parseAudit(o: unknown, i: number, c: Issues): AuditEntry {
  const at = tag('감사 이력', i, o);
  if (!isObj(o)) { c.add(`${at}: 객체가 아닙니다.`); return { id: '', at: '', type: 'system', entityId: '', message: '' }; }
  return { id: id(o, at, c), at: date(o, 'at', at, c), type: oneOf(o, 'type', AUDIT_TYPE, at, c), entityId: str(o, 'entityId', at, c, 200), message: str(o, 'message', at, c) };
}

function parsePolicy(v: unknown, c: Issues): { policy: Policy; fixes: string[] } | null {
  const at = '정책(policy)';
  if (!isObj(v)) { c.add(`${at}이 객체가 아닙니다.`); return null; }
  const fixed = repairPolicy(v as unknown as Policy);
  const p = fixed.policy;
  return { policy: { businessName: str(v, 'businessName', at, c, 200), openingHour: p.openingHour, closingHour: p.closingHour, slotMinutes: p.slotMinutes, cancellationHours: p.cancellationHours, noShowGraceMin: p.noShowGraceMin, offerHoldMin: p.offerHoldMin, requireDeposit: bool(v, 'requireDeposit', at, c), lateCancelForfeit: bool(v, 'lateCancelForfeit', at, c), noShowForfeit: bool(v, 'noShowForfeit', at, c) }, fixes: fixed.fixes };
}

export function validateState(value: unknown): BackupInspection {
  const c = new Issues();
  const notes: string[] = [];
  if (!isObj(value)) { c.add('백업 데이터가 객체가 아닙니다.'); return { ok: false, errors: c.list, totalErrors: c.total, notes }; }
  if (value.schemaVersion !== 1) c.add(`지원하지 않는 백업 버전입니다 (schemaVersion ${show(value.schemaVersion)}, 필요: 1).`);
  const revision = num(value, 'revision', '백업', c, { min: 0, integer: true });
  const simulatedNow = date(value, 'simulatedNow', '백업', c);
  const unusable = new Set<string>();
  const services = list(value.services, '서비스', BACKUP_LIMITS.services, c, unusable, 'services').map((o, i) => parseService(o, i, c));
  const staff = list(value.staff, '담당자', BACKUP_LIMITS.staff, c, unusable, 'staff').map((o, i) => parseStaff(o, i, c));
  const customers = list(value.customers, '고객', BACKUP_LIMITS.customers, c, unusable, 'customers').map((o, i) => parseCustomer(o, i, c));
  const reservations = list(value.reservations, '예약', BACKUP_LIMITS.reservations, c, unusable, 'reservations').map((o, i) => parseReservation(o, i, c));
  const waitlist = list(value.waitlist, '대기자', BACKUP_LIMITS.waitlist, c, unusable, 'waitlist').map((o, i) => parseWaitlist(o, i, c));
  const audit = list(value.audit, '감사 이력', BACKUP_LIMITS.audit, c, unusable, 'audit').map((o, i) => parseAudit(o, i, c));
  const parsedPolicy = parsePolicy(value.policy, c);

  unique(services.map(x => x.id), '서비스', c); unique(staff.map(x => x.id), '담당자', c); unique(customers.map(x => x.id), '고객', c);
  unique(reservations.map(x => x.id), '예약', c); unique(waitlist.map(x => x.id), '대기자', c); unique(audit.map(x => x.id), '감사 이력', c);

  const ids = (a: { id: string }[]) => new Set(a.map(x => x.id).filter(Boolean));
  const serviceIds = ids(services), staffIds = ids(staff), customerIds = ids(customers), reservationIds = ids(reservations), waitlistIds = ids(waitlist);
  const ref = (set: Set<string>, key: string, target: string, at: string, field: string, label: string) => { if (target && !unusable.has(key) && !set.has(target)) c.add(`${at}: ${field} ${show(target)}에 해당하는 ${label}이(가) 백업에 없습니다.`); };
  staff.forEach((s, i) => s.serviceIds.forEach(sid => ref(serviceIds, 'services', sid, tag('담당자', i, s), 'serviceIds', '서비스')));
  reservations.forEach((r, i) => {
    const at = tag('예약', i, r);
    ref(customerIds, 'customers', r.customerId, at, 'customerId', '고객'); ref(serviceIds, 'services', r.serviceId, at, 'serviceId', '서비스'); ref(staffIds, 'staff', r.staffId, at, 'staffId', '담당자');
    if (r.recoveredFromReservationId !== undefined) { if (r.recoveredFromReservationId === r.id) c.add(`${at}: recoveredFromReservationId가 자기 자신입니다.`); else ref(reservationIds, 'reservations', r.recoveredFromReservationId, at, 'recoveredFromReservationId', '원본 예약'); }
    if (r.waitlistId !== undefined) ref(waitlistIds, 'waitlist', r.waitlistId, at, 'waitlistId', '대기자');
  });
  waitlist.forEach((w, i) => {
    const at = tag('대기자', i, w);
    ref(customerIds, 'customers', w.customerId, at, 'customerId', '고객'); ref(serviceIds, 'services', w.serviceId, at, 'serviceId', '서비스');
    if (w.staffId !== null) ref(staffIds, 'staff', w.staffId, at, 'staffId', '담당자');
    if (w.offer) { ref(staffIds, 'staff', w.offer.staffId, `${at}의 제안(offer)`, 'staffId', '담당자'); ref(reservationIds, 'reservations', w.offer.cancelledReservationId, `${at}의 제안(offer)`, 'cancelledReservationId', '취소된 원본 예약'); }
  });

  if (c.total > 0 || !parsedPolicy) return { ok: false, errors: c.list, totalErrors: c.total, notes };
  const state: AppState = { schemaVersion: 1, revision, simulatedNow, services, staff, customers, reservations, waitlist, policy: parsedPolicy.policy, audit };
  if (parsedPolicy.fixes.length) {
    const message = `불러온 정책 값이 올바르지 않아 기본값으로 바꿨습니다: ${parsedPolicy.fixes.join(', ')}`;
    state.audit.unshift({ id: `AUD-POLICY-${Date.now().toString(36)}`, at: simulatedNow, type: 'policy', entityId: 'policy', message });
    if (state.audit.length > BACKUP_LIMITS.audit) state.audit.length = BACKUP_LIMITS.audit;
    notes.push(message);
  }
  return { ok: true, errors: [], totalErrors: 0, state, notes };
}

export function inspectBackup(raw: unknown): BackupInspection {
  const fail = (m: string): BackupInspection => ({ ok: false, errors: [m], totalErrors: 1, notes: [] });
  if (typeof raw !== 'string') return fail('백업 내용을 읽지 못했습니다.');
  if (raw.length > backupLimit()) return fail(`백업 파일이 너무 큽니다 (${raw.length.toLocaleString('ko-KR')}자, 한도 ${backupLimit().toLocaleString('ko-KR')}자). 약 4MB 이하로 줄여 주세요.`);
  if (!raw.trim()) return fail('빈 파일입니다.');
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { return fail('JSON 문법이 올바르지 않아 읽을 수 없습니다. 이 앱에서 내려받은 백업 파일을 선택하세요.'); }
  return validateState(parsed);
}
export function backupTooLarge(bytes: number) { return bytes > MAX_BACKUP_BYTES; }
// The final restore button is only usable for a valid backup AND the exact confirmation word.
export function canConfirmRestore(result: BackupInspection | null | undefined, typed: string) { return !!result && result.ok && !!result.state && typed === RESTORE_CONFIRM_TEXT; }

export interface RestoreRow { label: string; current: number; next: number; }
export interface RestoreSummary { rows: RestoreRow[]; reservationStatus: RestoreRow[]; waitlistStatus: RestoreRow[]; onlyInCurrent: RestoreRow[]; onlyInBackup: RestoreRow[]; policyChanges: string[]; clock: { current: string; next: string }; }
const RES_LABEL: Record<ReservationStatus, string> = { requested: '요청', confirmed: '확정', arrived: '도착', completed: '완료', cancelled: '취소', no_show: '노쇼' };
const WAIT_LABEL: Record<WaitlistStatus, string> = { waiting: '대기', offered: '제안 중', booked: '예약 회복', expired: '만료', removed: '제거' };
const POLICY_FLAGS: [keyof Policy, string][] = [['requireDeposit', '예약금 사용'], ['lateCancelForfeit', '늦은 취소 시 차감'], ['noShowForfeit', '노쇼 시 차감']];
// What replacing the current data with the backup will change; shown in the restore preview before anything is written.
export function describeRestore(current: AppState, next: AppState): RestoreSummary {
  const count = <T>(a: T[]) => a.length;
  const rows: RestoreRow[] = [
    { label: '서비스', current: count(current.services), next: count(next.services) }, { label: '담당자', current: count(current.staff), next: count(next.staff) },
    { label: '고객', current: count(current.customers), next: count(next.customers) }, { label: '예약', current: count(current.reservations), next: count(next.reservations) },
    { label: '대기자', current: count(current.waitlist), next: count(next.waitlist) }, { label: '감사 이력', current: count(current.audit), next: count(next.audit) }
  ];
  const reservationStatus = (Object.keys(RES_LABEL) as ReservationStatus[]).map(s => ({ label: `예약 ${RES_LABEL[s]}`, current: current.reservations.filter(r => r.status === s).length, next: next.reservations.filter(r => r.status === s).length }));
  const waitlistStatus = (Object.keys(WAIT_LABEL) as WaitlistStatus[]).map(s => ({ label: `대기자 ${WAIT_LABEL[s]}`, current: current.waitlist.filter(w => w.status === s).length, next: next.waitlist.filter(w => w.status === s).length }));
  const diff = (a: { id: string }[], b: { id: string }[]) => { const bs = new Set(b.map(x => x.id)); return a.filter(x => !bs.has(x.id)).length; };
  const onlyInCurrent: RestoreRow[] = [{ label: '고객', current: diff(current.customers, next.customers), next: 0 }, { label: '예약', current: diff(current.reservations, next.reservations), next: 0 }, { label: '대기자', current: diff(current.waitlist, next.waitlist), next: 0 }];
  const onlyInBackup: RestoreRow[] = [{ label: '고객', current: 0, next: diff(next.customers, current.customers) }, { label: '예약', current: 0, next: diff(next.reservations, current.reservations) }, { label: '대기자', current: 0, next: diff(next.waitlist, current.waitlist) }];
  const policyChanges: string[] = [];
  if (current.policy.businessName !== next.policy.businessName) policyChanges.push(`사업장 이름 ${JSON.stringify(current.policy.businessName)} → ${JSON.stringify(next.policy.businessName)}`);
  for (const f of Object.keys(POLICY_LIMITS) as PolicyField[]) if (current.policy[f] !== next.policy[f]) policyChanges.push(`${POLICY_LIMITS[f].label} ${current.policy[f]} → ${next.policy[f]}`);
  for (const [f, label] of POLICY_FLAGS) if (current.policy[f] !== next.policy[f]) policyChanges.push(`${label} ${current.policy[f] ? '켬' : '끔'} → ${next.policy[f] ? '켬' : '끔'}`);
  return { rows, reservationStatus, waitlistStatus, onlyInCurrent, onlyInBackup, policyChanges, clock: { current: current.simulatedNow, next: next.simulatedNow } };
}
