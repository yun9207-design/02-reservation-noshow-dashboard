# Claude project instructions

이 프로젝트는 예약·노쇼·취소 빈자리 회복 비즈니스를 배우기 위한 실습형 웹앱입니다.

작업 전 `README.md`, `AGENTS.md`, `docs/BUSINESS_FLOW.md`, `docs/DATA_MODEL.md`, `docs/FEATURE_MATRIX.md`를 읽으세요.

원칙:
1. 기존 기능을 삭제하거나 단순 UI로 후퇴시키지 않습니다.
2. 실제 연동이 없는 기능은 반드시 ‘모의’로 유지합니다.
3. UI보다 업무 흐름과 데이터 연결을 우선합니다.
4. 예약 중복, 취소 정책, 노쇼, 대기자 제안 수락 전에 재검사를 보존합니다.
5. localStorage 오류나 복원 실패에서 기존 데이터를 손상시키지 않습니다.
6. 한 번에 P0/P1/P2 전체를 재작성하지 말고 작은 변경 단위로 검증합니다.
7. push 전 diff, tests, build, secrets 여부를 확인합니다.
