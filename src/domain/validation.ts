import { AppState } from './types';
import { repairPolicy } from './policy';
const MAX_BACKUP_CHARS=4_200_000;
function arr(v:any,name:string){if(!Array.isArray(v))throw Error(`${name} 목록 형식이 아닙니다.`);return v;}
export function parseStateWithNotes(value:unknown):{state:AppState;notes:string[]}{const v=value as any;if(!v||typeof v!=='object')throw Error('백업 데이터가 객체가 아닙니다.');if(v.schemaVersion!==1)throw Error('지원하지 않는 백업 버전입니다.');arr(v.services,'서비스');arr(v.staff,'담당자');arr(v.customers,'고객');arr(v.reservations,'예약');arr(v.waitlist,'대기');arr(v.audit,'이력');if(!v.policy||typeof v.policy!=='object')throw Error('정책이 없습니다.');if(Number.isNaN(new Date(v.simulatedNow).getTime()))throw Error('실습 시간이 올바르지 않습니다.');if(v.reservations.length>3000||v.waitlist.length>3000||v.audit.length>10000)throw Error('학습용 앱의 자료 한도를 넘었습니다.');const state=structuredClone(v) as AppState;const notes:string[]=[];
  // Unusable policy numbers (0, negative, NaN, out of range) are replaced by defaults instead of being loaded as they are;
  // slotMinutes <= 0 used to freeze the schedule screen. The rest of the data is kept and the repair is written to the audit log.
  const repaired=repairPolicy(state.policy);
  if(repaired.fixes.length){state.policy=repaired.policy;const message=`불러온 정책 값이 올바르지 않아 기본값으로 바꿨습니다: ${repaired.fixes.join(', ')}`;state.audit.unshift({id:`AUD-POLICY-${Date.now().toString(36)}`,at:state.simulatedNow,type:'policy',entityId:'policy',message});if(state.audit.length>10000)state.audit.length=10000;notes.push(message);}
  return {state,notes};}
export function parseState(value:unknown):AppState{return parseStateWithNotes(value).state;}
export function parseBackupWithNotes(raw:string){if(raw.length>MAX_BACKUP_CHARS)throw Error('백업 파일이 너무 큽니다. 4MB 이하로 줄여 주세요.');let parsed;try{parsed=JSON.parse(raw);}catch{throw Error('JSON 백업 파일을 읽지 못했습니다.');}return parseStateWithNotes(parsed);}
export function parseBackup(raw:string){return parseBackupWithNotes(raw).state;}
export function backupLimit(){return MAX_BACKUP_CHARS;}
