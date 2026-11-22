# Bojogae Frontend

React와 Vite 기반 프런트엔드이며 pnpm으로 패키지를 관리합니다.

## Theme

Windows 발송기와 같은 살구 코랄 테마를 사용합니다. 공통 색상은
`src/styles/palette.js`에서 관리하고, MUI 테마와 랜딩 CSS가 함께 사용합니다.
메인 색은 `#E88068`, 배경은 `#FBF8F5`, 본문은 `#352F2D`입니다.
작은 강조 글자와 포커스에는 진한 코랄 `#9B4532`를 사용합니다.

## Development

다른 PC(집·회사)에서 별도 브랜치 없이 `main`을 `git pull` 한 뒤 아래 명령으로 백엔드·DB·Redis·S3·워커까지 한 번에 실행할 수 있습니다.

```bash
pnpm install
pnpm dev:stack
```

프런트엔드만 단독 실행할 때는 `pnpm dev`를, 중지/상태 확인/서버 데이터 동기화는 각각 `pnpm stop:stack`, `pnpm status:stack`, `pnpm sync:server`를 사용하세요.

## Validation

```bash
pnpm lint
pnpm build
```

## Environment Isolation

개발 환경의 개인/PC별 API 주소가 다를 경우 추적 파일(`.env.development`)을 수정하지 말고
`.env.development.local.example`을 `.env.development.local`로 복사해 오버라이드하세요(`.gitignore`의 `*.local`로 제외됩니다).
