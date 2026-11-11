# 내정보 시안 적용

`docs/design_improve/내정보 개편안.html`의 본문, 이메일 인증 팝업, 브라우저 알림 확인 팝업 구조와 utility class를 React로 옮겼다. `profile-source.css`는 원본 스타일을 `.profile-design`으로 제한한 것이다. 공통 MUI 테마가 팝업 테두리·모서리·폰트를 덮어쓰지 않도록 integration CSS를 적용한다.

- 프로필·GA 자동완성·이메일 인증·알림 분류는 기존 서버 API에 연결한다. 로컬 저장은 하지 않는다.
- 결제는 기존 PlanSection/PaymentSection의 서버 검증과 동의 절차를 유지한다. 시안의 임의 카드번호 입력·가상 충전·인증코드 자동입력·타이머·계정 역할 전환은 사용하지 않는다.
- 본문은 실제 구독·선택 카드·다음 결제 일정으로 표시한다. 유료 충전 상품은 노출하지 않고 내꼬막 이용 내역으로 연결한다. 기존 추천인과 탈퇴 기능은 하단에 보존한다.
- 실제 지원하지 않는 알림 테스트는 준비중으로 표시한다.
- 아이콘은 시안의 Lucide SVG 노드를 복사했으며 ProfileIcon.jsx에 라이선스를 보존한다.

클래스 변경 후 프런트 루트에서 다음 명령으로 utility CSS를 갱신한다.

```sh
npx --yes --package tailwindcss@3.4.17 tailwindcss -c src/pages/profile/design/tailwind.config.cjs -i src/pages/profile/design/profile-input.css -o src/pages/profile/design/profile-utilities.css --minify
```

검증은 실제 App의 ThemeProvider와 레이아웃에서 격리된 브라우저/API fixture로 수행한다. 실제 결제·이메일 발송·계정 정보 변경 없이 화면과 요청 payload를 검사한다.
