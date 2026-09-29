# Test report · initial build

## 자동 테스트
`npm test` 기준 41개 테스트를 작성했고, 제작 환경에서 41/41 통과했습니다.

검증 범위:
- 예약 충돌·영업시간·담당자 서비스
- 예약금·확정·도착·완료·취소·노쇼
- 정상/늦은 취소 예약금 처리
- 대기자 조건 매칭, 제안, 수락, 거절, 만료
- 수락 전 재검사
- CSV 파싱·중복·겹침 검사
- 백업 구조 검증
- 저장소 동시 탭 감지와 quota 실패 시 기존 자료 보존
- 지표 계산과 감사 이력

## 빌드
제작 환경에서 portable `npm run build`와 동일한 빌드 스크립트로 `preview.html`을 생성했습니다. TypeScript `transpileModule` 단계의 구문 진단을 통과했습니다.

## 아직 재현해야 할 것
- 깨끗한 clone에서 `npm install`/`npm ci`
- 전체 React TypeScript typecheck
- Vite build
- GitHub Actions 실제 실행
- Vercel 실제 배포
- Chrome/Edge에서 주요 UI 시나리오

이 항목들은 GitHub에 올린 뒤 Claude/Codex가 첫 점검에서 재현하도록 `docs/AI_NEXT_TASK.md`에 적었습니다.
