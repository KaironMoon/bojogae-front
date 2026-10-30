# Bojogae Frontend

React와 Vite 기반 프런트엔드이며 pnpm으로 패키지를 관리합니다.

## Theme

Windows 발송기와 같은 살구 코랄 테마를 사용합니다. 공통 색상은
`src/styles/palette.js`에서 관리하고, MUI 테마와 랜딩 CSS가 함께 사용합니다.
메인 색은 `#E88068`, 배경은 `#FBF8F5`, 본문은 `#352F2D`입니다.
작은 강조 글자와 포커스에는 진한 코랄 `#9B4532`를 사용합니다.

## Development

```bash
pnpm install
pnpm dev
```

## Validation

```bash
pnpm lint
pnpm build
```
