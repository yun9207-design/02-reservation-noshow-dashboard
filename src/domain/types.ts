export type ReservationStatus = 'requested'|'confirmed'|'arrived'|'completed'|'cancelled'|'no_show';
export type DepositStatus = 'not_required'|'unpaid'|'paid'|'refunded'|'forfeited';
export type WaitlistStatus = 'waiting'|'offered'|'booked'|'expired'|'removed';
export type OfferStatus = 'open'|'accepted'|'declined'|'expired';
export type ReservationSource = 'manual'|'csv'|'waitlist'|'practice';
export type AuditType = 'reservation'|'deposit'|'cancel'|'noshow'|'waitlist'|'offer'|'policy'|'import'|'system';

export interface Service { id:string; name:string; durationMin:number; price:number; deposit:number; bufferMin:number; active:boolean; }
export interface Staff { id:string; name:string; serviceIds:string[]; active:boolean; }
export interface Customer { id:string; name:string; phone:string; email:string; notes:string; visitCount:number; noShowCount:number; }
export interface Reservation {
  id:string; customerId:string; serviceId:string; staffId:string; startAt:string; endAt:string;
  status:ReservationStatus; depositStatus:DepositStatus; depositAmount:number; createdAt:string; source:ReservationSource;
  note:string; cancelReason?:string; cancelledAt?:string; recoveredFromReservationId?:string; waitlistId?:string;
}
export interface WaitlistOffer { slotStart:string; slotEnd:string; staffId:string; cancelledReservationId:string; sentAt:string; expiresAt:string; status:OfferStatus; }
export interface WaitlistEntry {
  id:string; customerId:string; serviceId:string; staffId:string|null; windowStart:string; windowEnd:string;
  status:WaitlistStatus; createdAt:string; note:string; offer?:WaitlistOffer;
}
export interface Policy {
  businessName:string; openingHour:number; closingHour:number; slotMinutes:number; cancellationHours:number;
  noShowGraceMin:number; offerHoldMin:number; requireDeposit:boolean; lateCancelForfeit:boolean; noShowForfeit:boolean;
}
export interface AuditEntry { id:string; at:string; type:AuditType; entityId:string; message:string; }
export interface AppState {
  schemaVersion:1; revision:number; simulatedNow:string; services:Service[]; staff:Staff[]; customers:Customer[];
  reservations:Reservation[]; waitlist:WaitlistEntry[]; policy:Policy; audit:AuditEntry[];
}
export interface ReservationDraft { customerId:string; serviceId:string; staffId:string; startAt:string; note?:string; source?:ReservationSource; }
export interface BookingCheck { ok:boolean; reasons:string[]; endAt:string; }
export interface CancellationDecision { allowed:boolean; late:boolean; depositOutcome:'refund'|'forfeit'|'none'; message:string; hoursBefore:number; }
export interface SlotRef { reservationId:string; serviceId:string; staffId:string; startAt:string; endAt:string; }
