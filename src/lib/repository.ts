import { AppState } from '../domain/types';import { makeSeed } from '../data/seed';import { parseState } from '../domain/validation';
export const STORAGE_KEY='reservation-noshow-lab:state:v1';export type StorageLike=Pick<Storage,'getItem'|'setItem'|'removeItem'>;
export type LoadResult={state:AppState;mode:'persistent'|'session'|'recovery';notice:string;raw:string|null};
export interface Repository{load:()=>LoadResult;save:(s:AppState)=>void;replace:(s:AppState)=>void;raw:()=>string|null;}
export class LocalRepository implements Repository{
  private expected:string|null=null;private blocked=false;private session:AppState|null=null;
  constructor(private storage:StorageLike|null){}
  raw(){try{return this.storage?.getItem(STORAGE_KEY)??null}catch{return null}}
  load():LoadResult{if(!this.storage){this.session??=makeSeed();return{state:this.session,mode:'session',notice:'브라우저 저장이 불가능합니다. 현재 탭에서만 사용됩니다. JSON 백업을 권장합니다.',raw:null};}let raw:string|null;try{raw=this.storage.getItem(STORAGE_KEY);}catch{this.storage=null;return this.load();}this.expected=raw;this.blocked=false;if(!raw)return{state:makeSeed(),mode:'persistent',notice:'',raw:null};try{return{state:parseState(JSON.parse(raw)),mode:'persistent',notice:'',raw};}catch(e){this.blocked=true;return{state:makeSeed(),mode:'recovery',notice:`저장 자료를 읽지 못해 원본을 덮어쓰지 않았습니다. 설정에서 원본을 내려받고 복원 또는 초기화하세요. ${(e as Error).message}`,raw};}}
  save(state:AppState){if(this.blocked)throw Error('복구 모드입니다. 손상된 원본을 백업한 뒤 복원 또는 초기화하세요.');if(!this.storage){this.session=structuredClone(state);return;}const current=this.storage.getItem(STORAGE_KEY);if(current!==this.expected)throw Error('다른 탭에서 자료가 변경되었습니다. 새로고침 후 다시 작업하세요.');const raw=JSON.stringify(state);try{this.storage.setItem(STORAGE_KEY,raw);}catch{throw Error('브라우저 저장 용량 또는 권한 문제로 반영하지 못했습니다. 기존 자료는 유지됩니다. JSON 백업 후 공간을 확보하세요.');}this.expected=raw;}
  replace(state:AppState){const clean=parseState(state);if(!this.storage){this.session=clean;this.blocked=false;return;}const raw=JSON.stringify(clean);const before=this.storage.getItem(STORAGE_KEY);try{this.storage.setItem(STORAGE_KEY,raw);}catch{if(before!==null){try{this.storage.setItem(STORAGE_KEY,before);}catch{}}throw Error('백업은 정상 자료이지만 브라우저 저장 공간이 부족하거나 권한이 없어 복원하지 못했습니다. 기존 자료는 유지됩니다.');}this.expected=raw;this.blocked=false;}
}
export function browserRepository(){try{const s=window.localStorage;const p='reservation-noshow-lab:probe';s.setItem(p,'ok');s.removeItem(p);return new LocalRepository(s);}catch{return new LocalRepository(null);}}
