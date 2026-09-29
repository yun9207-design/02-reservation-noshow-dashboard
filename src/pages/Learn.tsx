import React from 'react';import {useData} from '../store';import {PageHeading,Help,Button} from '../components/ui';
const scenarios=[
  {title:'1. 예약 요청 → 예약금 → 확정',page:'schedule',steps:['새 예약 요청을 만듭니다.','예약금 모의 결제를 기록합니다.','예약을 확정합니다.','같은 담당자·시간에 겹치는 예약이 차단되는지 확인합니다.']},
  {title:'2. 정상 취소와 늦은 취소 비교',page:'schedule',steps:['실습 시각과 예약 시작 시각의 차이를 봅니다.','예약을 취소합니다.','정책의 취소 기준 시간을 바꿔 결과가 달라지는지 확인합니다.','예약금이 환불 또는 차감 상태로 바뀌는지 봅니다.']},
  {title:'3. 취소 빈자리 → 대기자 제안 → 회복 예약',page:'waitlist',steps:['취소 예약 RSV-1005의 빈자리를 찾습니다.','조건이 맞는 WAIT-001 또는 WAIT-002에게 제안합니다.','수락 실습을 눌러 새 예약을 만듭니다.','예약금이 필요한 회복 예약은 예약 관리에서 모의 결제한 뒤 확정합니다.','리포트의 회복 매출이 늘어나는지 확인합니다.']},
  {title:'4. 노쇼 처리',page:'settings',steps:['설정에서 실습 시각을 예약 시작+유예시간 이후로 이동합니다.','예약 관리에서 확정 예약을 노쇼 처리합니다.','고객의 노쇼 횟수와 예약금 상태를 확인합니다.']},
  {title:'5. CSV로 외부 연동 흉내 내기',page:'import',steps:['samples/reservations.csv를 가져옵니다.','반영 전에 필수열·중복·시간 겹침 오류를 확인합니다.','invalid-reservations.csv로 오류가 전체 반영을 막는지 봅니다.']},
  {title:'6. 백업 → 변경 → 복원',page:'settings',steps:['JSON 백업을 내려받습니다.','예약 또는 정책을 변경합니다.','백업 파일을 복원해 이전 상태와 비교합니다.','왜 로컬 저장만으로 상용 서비스가 되지 않는지 생각해 봅니다.']}
];
export function Learn(){const{go}=useData();return <><PageHeading eyebrow="LEARN BY DOING" title="학습 가이드" description="버튼 위치를 외우는 게 아니라, 예약 사업에서 왜 그 단계가 필요한지 한 시나리오씩 체험합니다."/><Help title="추천 방법">한 시나리오를 끝낼 때 ‘입력된 정보 → 판단 규칙 → 바뀐 상태 → 다음 행동’을 말로 설명해 보세요. 코드보다 이 흐름을 이해하는 것이 먼저입니다.</Help><div className="cards-grid">{scenarios.map((s,i)=><article className="learn-scenario" key={i}><h3>{s.title}</h3><ol>{s.steps.map((x,j)=><li key={j}>{x}</li>)}</ol><Button variant="primary" onClick={()=>go(s.page as any)}>실습 화면 열기</Button></article>)}</div></>}
