import { AppState, BookingCheck, CancellationDecision, Reservation, ReservationDraft, Service, SlotRef, WaitlistEntry } from './types';
export function money(n:number){return new Intl.NumberFormat('ko-KR').format(n)+'원';}
export function dt(iso:string){const d=new Date(iso);return Number.isNaN(d.getTime())?'잘못된 날짜':new Intl.DateTimeFormat('ko-KR',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}).format(d);}
export function dayKey(iso:string){const d=new Date(iso);const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return `${y}-${m}-${day}`;}
export function localInput(iso:string){const d=new Date(iso);const pad=(n:number)=>String(n).padStart(2,'0');return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;}
export function addMinutes(iso:string,min:number){return new Date(new Date(iso).getTime()+min*60000).toISOString();}
export function getService(state:AppState,id:string){const x=state.services.find(s=>s.id===id);if(!x)throw Error('서비스를 찾을 수 없습니다.');return x;}
export function getReservation(state:AppState,id:string){const x=state.reservations.find(r=>r.id===id);if(!x)throw Error('예약을 찾을 수 없습니다.');return x;}
export function isOccupying(r:Reservation){return !['cancelled','no_show'].includes(r.status);}
export function overlaps(aStart:string,aEnd:string,bStart:string,bEnd:string){return new Date(aStart)<new Date(bEnd)&&new Date(bStart)<new Date(aEnd);}
export function bookingCheck(state:AppState,draft:ReservationDraft,ignoreId?:string):BookingCheck{
  const reasons:string[]=[];const service=state.services.find(s=>s.id===draft.serviceId);const staff=state.staff.find(s=>s.id===draft.staffId);const start=new Date(draft.startAt);
  const endAt=service?addMinutes(draft.startAt,service.durationMin+service.bufferMin):draft.startAt;
  if(!service||!service.active)reasons.push('선택한 서비스가 비활성 또는 존재하지 않습니다.');
  if(!staff||!staff.active)reasons.push('선택한 담당자가 비활성 또는 존재하지 않습니다.');
  if(service&&staff&&!staff.serviceIds.includes(service.id))reasons.push('담당자가 이 서비스를 제공하도록 설정되어 있지 않습니다.');
  if(Number.isNaN(start.getTime()))reasons.push('예약 시작 시간이 올바르지 않습니다.');
  else {const h=start.getHours()+start.getMinutes()/60;const eh=new Date(endAt).getHours()+new Date(endAt).getMinutes()/60;if(h<state.policy.openingHour||eh>state.policy.closingHour)reasons.push('영업시간 밖이거나 종료 시간이 영업 종료를 넘습니다.');}
  const conflict=state.reservations.find(r=>r.id!==ignoreId&&r.staffId===draft.staffId&&isOccupying(r)&&overlaps(draft.startAt,endAt,r.startAt,r.endAt));
  if(conflict)reasons.push(`담당자 일정이 ${conflict.id} 예약과 겹칩니다.`);
  return {ok:reasons.length===0,reasons,endAt};
}
export function cancellationDecision(state:AppState,r:Reservation,at=state.simulatedNow):CancellationDecision{
  if(['cancelled','completed','no_show'].includes(r.status))return {allowed:false,late:false,depositOutcome:'none',message:'이미 종료된 예약은 취소할 수 없습니다.',hoursBefore:0};
  const hours=(new Date(r.startAt).getTime()-new Date(at).getTime())/3600000;const late=hours<state.policy.cancellationHours;
  let depositOutcome:'refund'|'forfeit'|'none'='none';
  if(r.depositStatus==='paid')depositOutcome=late&&state.policy.lateCancelForfeit?'forfeit':'refund';
  return {allowed:true,late,depositOutcome,message:late?`예약 ${state.policy.cancellationHours}시간 이내 취소입니다.`:'정상 취소 가능 구간입니다.',hoursBefore:hours};
}
export function canMarkNoShow(state:AppState,r:Reservation,at=state.simulatedNow){
  if(!['requested','confirmed'].includes(r.status))return false;const cutoff=new Date(r.startAt).getTime()+state.policy.noShowGraceMin*60000;return new Date(at).getTime()>=cutoff;
}
export function cancelledSlot(r:Reservation):SlotRef|null{return r.status==='cancelled'?{reservationId:r.id,serviceId:r.serviceId,staffId:r.staffId,startAt:r.startAt,endAt:r.endAt}:null;}
export function waitlistMatches(state:AppState,slot:SlotRef){return state.waitlist.filter(w=>w.status==='waiting'&&w.serviceId===slot.serviceId&&(!w.staffId||w.staffId===slot.staffId)&&new Date(w.windowStart)<=new Date(slot.startAt)&&new Date(w.windowEnd)>=new Date(slot.endAt));}
export function offerExpired(w:WaitlistEntry,now:string){return !!w.offer&&w.offer.status==='open'&&new Date(now)>new Date(w.offer.expiresAt);}
export function activeReservationsOn(state:AppState,date:string){return state.reservations.filter(r=>dayKey(r.startAt)===date&&!['cancelled'].includes(r.status)).sort((a,b)=>a.startAt.localeCompare(b.startAt));}
export function candidateSlots(state:AppState,date:string,staffId:string,serviceId:string){
  const service=state.services.find(s=>s.id===serviceId);if(!service)return [] as string[];const result:string[]=[];const [y,m,d]=date.split('-').map(Number);
  for(let min=state.policy.openingHour*60;min+(service.durationMin+service.bufferMin)<=state.policy.closingHour*60;min+=state.policy.slotMinutes){const start=new Date(y,m-1,d,Math.floor(min/60),min%60);const iso=start.toISOString();if(bookingCheck(state,{customerId:'candidate',serviceId,staffId,startAt:iso}).ok)result.push(iso);}return result;
}
export function serviceLabel(state:AppState,id:string){return state.services.find(s=>s.id===id)?.name??id;}
export function customerLabel(state:AppState,id:string){return state.customers.find(c=>c.id===id)?.name??id;}
export function staffLabel(state:AppState,id:string){return state.staff.find(s=>s.id===id)?.name??id;}
export function depositFor(service:Service,state:AppState){return state.policy.requireDeposit?service.deposit:0;}
