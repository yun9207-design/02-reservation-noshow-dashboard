# Architecture

`src/domain/`에는 화면과 독립적인 비즈니스 규칙을 둡니다.

- `types.ts`: 데이터 구조
- `rules.ts`: 충돌, 취소, 노쇼, 대기자 매칭 같은 판단 함수
- `engine.ts`: 상태를 실제로 변경하는 명령
- `metrics.ts`: 보고 지표
- `validation.ts`: 백업 검증

`src/lib/`는 저장과 외부 입력 어댑터입니다.

- `repository.ts`: localStorage / session fallback
- `csv.ts`: CSV 입력 검사
- `files.ts`: 파일 읽기/다운로드

`src/pages/`는 사용자가 업무 흐름을 조작하는 화면입니다.

나중에 백엔드를 붙일 때 목표는 UI와 domain 규칙을 버리지 않고, `repository`와 외부 입력/실행 어댑터를 서버 기반으로 교체하는 것입니다.
