# GitHub + Vercel guide

권장 저장소: `02-reservation-noshow-dashboard`

1. 이 폴더의 내용물을 GitHub 저장소 루트에 올립니다.
2. `README.md`, `AGENTS.md`, `CLAUDE.md`, `package.json`, `src/`, `tests/`, `docs/`가 루트에서 보여야 합니다.
3. Vercel에서 GitHub 저장소를 Import합니다.
4. Application Preset이 Vite로 잡히는지 확인합니다.
5. Deploy 후 대표 `.vercel.app` 주소를 사용합니다.
6. 이후 `main` push -> GitHub Actions 검사 -> Vercel 자동 재배포 흐름을 사용합니다.

현재 저장소에는 GitHub Pages 배포 workflow가 없습니다. Vercel을 배포 플랫폼으로 사용합니다.
