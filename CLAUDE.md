# Claude project instructions

이 프로젝트는 예약·노쇼·취소 빈자리 회복 비즈니스를 배우기 위한 실습형 웹앱입니다.

작업 전 `README.md`, `AGENTS.md`, `docs/BUSINESS_FLOW.md`, `docs/DATA_MODEL.md`, `docs/FEATURE_MATRIX.md`를 읽으세요.

새 세션에서는 그보다 먼저 `PROJECT_STATE.md`와 `BUSINESS_MODEL.md`를 읽고 현재 상태, 알려진 위험, 다음 작업을 확인하세요.

원칙:
1. 기존 기능을 삭제하거나 단순 UI로 후퇴시키지 않습니다.
2. 실제 연동이 없는 기능은 반드시 ‘모의’로 유지합니다.
3. UI보다 업무 흐름과 데이터 연결을 우선합니다.
4. 예약 중복, 취소 정책, 노쇼, 대기자 제안 수락 전에 재검사를 보존합니다.
5. localStorage 오류나 복원 실패에서 기존 데이터를 손상시키지 않습니다.
6. 한 번에 P0/P1/P2 전체를 재작성하지 말고 작은 변경 단위로 검증합니다.
7. push 전 diff, tests, build, secrets 여부를 확인합니다.
8. 현재 선택된 저장소 안에서만 작업합니다. 다른 번호(01, 03 …)의 프로젝트나 상위 폴더를 탐색하거나 수정하지 않습니다.
9. P0는 한 번에 하나만 진행합니다. 다음 P0는 이전 P0가 검증되어 push된 뒤에 시작합니다.
10. 고치기 전에 문제를 먼저 재현하고(실패하는 테스트), 고친 뒤에는 회귀 테스트를 남깁니다.
11. commit/push는 검증한 diff를 보고하고 사용자 승인을 받은 뒤에 합니다.
12. 소스의 기준은 GitHub `main`이고 실제 배포 대상은 Vercel입니다. GitHub Pages workflow는 만들지 않습니다.
13. P0 하나를 마칠 때마다 `PROJECT_STATE.md`를 갱신합니다.
