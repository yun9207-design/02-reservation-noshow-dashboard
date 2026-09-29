import { Policy } from './types';

// One definition of "a usable policy value", shared by the Policies screen, engine.updatePolicy,
// backup restore and localStorage loading. Values outside these ranges (0, negative, NaN, Infinity, huge numbers)
// used to be saved as-is; slotMinutes <= 0 made candidateSlots loop forever.
export type PolicyField = 'slotMinutes' | 'openingHour' | 'closingHour' | 'cancellationHours' | 'noShowGraceMin' | 'offerHoldMin';
export interface PolicyProblem { field: PolicyField | 'hours'; message: string; }
interface Limit { label: string; min: number; max: number; integer: boolean; minExclusive?: boolean; }

export const POLICY_LIMITS: Record<PolicyField, Limit> = {
  slotMinutes: { label: '기본 슬롯(분)', min: 5, max: 240, integer: true },
  openingHour: { label: '영업 시작 시', min: 0, max: 23, integer: true },
  closingHour: { label: '영업 종료 시', min: 1, max: 24, integer: true },
  cancellationHours: { label: '취소 기준 시간', min: 0, max: 8760, integer: false },
  noShowGraceMin: { label: '노쇼 유예(분)', min: 0, max: 1440, integer: false },
  offerHoldMin: { label: '빈자리 제안 홀드(분)', min: 0, max: 10080, integer: false, minExclusive: true }
};
// Same numbers as the seed policy (src/data/seed.ts); a test keeps the two in sync.
export const POLICY_DEFAULTS: Record<PolicyField, number> = { slotMinutes: 30, openingHour: 9, closingHour: 19, cancellationHours: 24, noShowGraceMin: 10, offerHoldMin: 20 };
const FIELDS = Object.keys(POLICY_LIMITS) as PolicyField[];
export const HOURS_ORDER_MESSAGE = '영업 시작 시간은 종료 시간보다 빨라야 합니다.';

export function policyFieldOk(field: PolicyField, value: unknown): boolean {
  const l = POLICY_LIMITS[field];
  if (typeof value !== 'number' || !Number.isFinite(value)) return false;
  if (l.integer && !Number.isInteger(value)) return false;
  if (l.minExclusive ? value <= l.min : value < l.min) return false;
  return value <= l.max;
}
function rangeText(l: Limit) {
  const kind = l.integer ? '정수' : '숫자';
  return l.minExclusive ? `0보다 크고 ${l.max} 이하의 ${kind}를 입력하세요.` : `${l.min} 이상 ${l.max} 이하의 ${kind}를 입력하세요.`;
}
export function policyProblems(policy: unknown): PolicyProblem[] {
  const p = (policy && typeof policy === 'object' ? policy : {}) as Record<string, unknown>;
  const problems: PolicyProblem[] = [];
  for (const f of FIELDS) if (!policyFieldOk(f, p[f])) problems.push({ field: f, message: `${POLICY_LIMITS[f].label}: ${rangeText(POLICY_LIMITS[f])}` });
  if (policyFieldOk('openingHour', p.openingHour) && policyFieldOk('closingHour', p.closingHour) && (p.openingHour as number) >= (p.closingHour as number)) problems.push({ field: 'hours', message: HOURS_ORDER_MESSAGE });
  return problems;
}
function show(v: unknown) { return typeof v === 'number' ? String(v) : v === undefined || v === null ? '없음' : JSON.stringify(v); }
// Replaces only the invalid numeric values with the defaults; everything else in the policy is kept as it is.
export function repairPolicy(policy: Policy): { policy: Policy; fixes: string[] } {
  const src = (policy && typeof policy === 'object' ? policy : {}) as unknown as Record<string, unknown>;
  const fixed: Record<string, unknown> = { ...src };
  const fixes: string[] = [];
  for (const f of FIELDS) if (!policyFieldOk(f, src[f])) { fixed[f] = POLICY_DEFAULTS[f]; fixes.push(`${POLICY_LIMITS[f].label} ${show(src[f])} → ${POLICY_DEFAULTS[f]}`); }
  if ((fixed.openingHour as number) >= (fixed.closingHour as number)) {
    fixes.push(`영업시간 ${fixed.openingHour}~${fixed.closingHour} → ${POLICY_DEFAULTS.openingHour}~${POLICY_DEFAULTS.closingHour}`);
    fixed.openingHour = POLICY_DEFAULTS.openingHour; fixed.closingHour = POLICY_DEFAULTS.closingHour;
  }
  return { policy: fixed as unknown as Policy, fixes };
}
