import React,{createContext,useContext,useMemo,useState} from 'react';import { AppState } from './domain/types';import { browserRepository } from './lib/repository';import { makeSeed } from './data/seed';
export type Page='dashboard'|'schedule'|'reservations'|'waitlist'|'customers'|'policies'|'import'|'reports'|'learn'|'settings';
type Toast={message:string;error?:boolean}|null;
type Ctx={state:AppState;page:Page;go:(p:Page)=>void;query:string;setQuery:(s:string)=>void;help:boolean;setHelp:(b:boolean)=>void;toast:Toast;storage:{mode:string;notice:string;raw:string|null};run:(fn:(s:AppState)=>AppState,success?:string)=>boolean;replace:(s:AppState,msg?:string)=>boolean;reset:()=>void;raw:()=>string|null};
const Context=createContext<Ctx|null>(null);const repo=typeof window!=='undefined'?browserRepository():null;
export function DataProvider({children}:{children:React.ReactNode}){const initial=useMemo(()=>repo!.load(),[]);const [state,setState]=useState(initial.state);const [page,setPage]=useState<Page>('dashboard');const [query,setQuery]=useState('');const [help,setHelp]=useState(true);const [toast,setToast]=useState<Toast>(null);const [storage,setStorage]=useState({mode:initial.mode,notice:initial.notice,raw:initial.raw});
  function say(message:string,error=false){setToast({message,error});window.setTimeout(()=>setToast(null),3600);}
  function run(fn:(s:AppState)=>AppState,success='저장했습니다.'){try{const next=fn(state);repo!.save(next);setState(next);setStorage(x=>({...x,raw:repo!.raw()}));say(success);return true;}catch(e){say((e as Error).message,true);return false;}}
  function replace(next:AppState,msg='자료를 복원했습니다.'){try{repo!.replace(next);setState(next);setStorage(x=>({...x,mode:'persistent',notice:'',raw:repo!.raw()}));say(msg);return true;}catch(e){say((e as Error).message,true);return false;}}
  function reset(){replace(makeSeed(),'가상 실습 자료로 초기화했습니다.');}
  return <Context.Provider value={{state,page,go:setPage,query,setQuery,help,setHelp,toast,storage,run,replace,reset,raw:()=>repo!.raw()}}>{children}</Context.Provider>}
export function useData(){const c=useContext(Context);if(!c)throw Error('DataProvider가 필요합니다.');return c;}
