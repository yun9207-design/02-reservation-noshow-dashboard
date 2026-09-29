import { AppState, Reservation, WaitlistEntry } from '../domain/types';
function at(base:Date,day:number,h:number,m=0){const d=new Date(base.getFullYear(),base.getMonth(),base.getDate()+day,h,m,0,0);return d.toISOString();}
function end(start:string,min:number){return new Date(new Date(start).getTime()+min*60000).toISOString();}
export function makeSeed(base=new Date()):AppState{
  const simulated=new Date(base.getFullYear(),base.getMonth(),base.getDate(),12,10,0,0).toISOString();
  const services=[
    {id:'SVC-CUT',name:'헤어 컷',durationMin:60,price:55000,deposit:10000,bufferMin:10,active:true},
    {id:'SVC-COLOR',name:'컬러',durationMin:120,price:120000,deposit:30000,bufferMin:15,active:true},
    {id:'SVC-CARE',name:'두피 케어',durationMin:45,price:45000,deposit:10000,bufferMin:10,active:true}
  ];
  const staff=[
    {id:'ST-A',name:'민지 실장',serviceIds:['SVC-CUT','SVC-COLOR','SVC-CARE'],active:true},
    {id:'ST-B',name:'도윤 디자이너',serviceIds:['SVC-CUT','SVC-COLOR'],active:true}
  ];
  const customers=[
    {id:'CUS-001',name:'김하늘',phone:'010-0000-1001',email:'haneul@example.test',notes:'오전 선호',visitCount:4,noShowCount:0},
    {id:'CUS-002',name:'박서준',phone:'010-0000-1002',email:'seojun@example.test',notes:'',visitCount:2,noShowCount:1},
    {id:'CUS-003',name:'이수아',phone:'010-0000-1003',email:'sua@example.test',notes:'컬러 상담',visitCount:1,noShowCount:0},
    {id:'CUS-004',name:'최민호',phone:'010-0000-1004',email:'minho@example.test',notes:'퇴근 후 선호',visitCount:7,noShowCount:0},
    {id:'CUS-005',name:'정유진',phone:'010-0000-1005',email:'yujin@example.test',notes:'',visitCount:0,noShowCount:0},
    {id:'CUS-006',name:'윤지민',phone:'010-0000-1006',email:'jimin@example.test',notes:'취소 자리 알림 희망',visitCount:3,noShowCount:0},
    {id:'CUS-007',name:'한예린',phone:'010-0000-1007',email:'yerin@example.test',notes:'',visitCount:5,noShowCount:0},
    {id:'CUS-008',name:'오지후',phone:'010-0000-1008',email:'jihoo@example.test',notes:'',visitCount:1,noShowCount:0}
  ];
  const rs=(id:string,c:string,s:string,st:string,start:string,dur:number,status:Reservation['status'],dep:Reservation['depositStatus'],amount:number,source:Reservation['source']='practice',note=''):Reservation=>({id,customerId:c,serviceId:s,staffId:st,startAt:start,endAt:end(start,dur),status,depositStatus:dep,depositAmount:amount,createdAt:at(base,-3,14),source,note});
  const reservations:Reservation[]=[
    rs('RSV-1001','CUS-001','SVC-CUT','ST-A',at(base,0,9),70,'completed','paid',10000),
    rs('RSV-1002','CUS-002','SVC-CUT','ST-B',at(base,0,10,30),70,'confirmed','paid',10000,'practice','노쇼 처리 가능 시간 테스트'),
    rs('RSV-1003','CUS-003','SVC-COLOR','ST-A',at(base,0,11,0),135,'confirmed','paid',30000),
    rs('RSV-1004','CUS-005','SVC-CARE','ST-A',at(base,0,13,30),55,'requested','unpaid',10000),
    rs('RSV-1005','CUS-004','SVC-CUT','ST-A',at(base,0,15,30),70,'cancelled','refunded',10000,'practice','취소 빈자리·대기자 매칭 실습'),
    rs('RSV-1006','CUS-007','SVC-CUT','ST-B',at(base,0,16,0),70,'confirmed','paid',10000),
    rs('RSV-1007','CUS-008','SVC-COLOR','ST-A',at(base,1,10,0),135,'confirmed','paid',30000),
    rs('RSV-1008','CUS-001','SVC-CARE','ST-A',at(base,1,14,0),55,'confirmed','paid',10000)
  ];
  reservations[4].cancelReason='일정 변경';reservations[4].cancelledAt=at(base,-1,16);
  const waitlist:WaitlistEntry[]=[
    {id:'WAIT-001',customerId:'CUS-006',serviceId:'SVC-CUT',staffId:'ST-A',windowStart:at(base,0,14,30),windowEnd:at(base,0,18,0),status:'waiting',createdAt:at(base,-2,18),note:'오늘 오후 취소 자리 원함'},
    {id:'WAIT-002',customerId:'CUS-005',serviceId:'SVC-CUT',staffId:null,windowStart:at(base,0,15,0),windowEnd:at(base,0,18,0),status:'waiting',createdAt:at(base,-1,9),note:'담당자 무관'},
    {id:'WAIT-003',customerId:'CUS-003',serviceId:'SVC-COLOR',staffId:'ST-A',windowStart:at(base,1,9,0),windowEnd:at(base,1,13,0),status:'waiting',createdAt:at(base,-1,11),note:'내일 오전'}
  ];
  return {schemaVersion:1,revision:1,simulatedNow:simulated,services,staff,customers,reservations,waitlist,policy:{businessName:'느린살롱 예약 실습점',openingHour:9,closingHour:19,slotMinutes:30,cancellationHours:24,noShowGraceMin:10,offerHoldMin:20,requireDeposit:true,lateCancelForfeit:true,noShowForfeit:true},audit:[{id:'AUD-SEED',at:simulated,type:'system',entityId:'seed',message:'가상 예약 운영 자료를 불러왔습니다.'}]};
}
