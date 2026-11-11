# 내꼬막 시안 이식

`docs/design_improve/내꼬막 개편안.html`의 본문, 잔액 상세 및 거래 상세 팝업 마크업을 먼저 복사하고 React 데이터·이벤트 바인딩을 추가했다. `WalletReference`, `BalanceReference`, `TransactionReference`는 시안의 요소 순서와 utility class를 유지한다. 원본 아이콘 노드는 시안의 Lucide 렌더러에서 가져왔다.

- `wallet-source.css`: 시안의 CSS를 `.kkomak-design` 범위로 제한.
- `wallet-utilities.css`: 복사한 클래스의 정적 CSS. 앱 전역 Tailwind나 CDN 런타임을 추가하지 않는다.
- `wallet-integration.css`: scoped reset, MUI Dialog/Pagination 연결 및 접근성 보완.
- `MyCoinsPage.jsx`: 서버 데이터, 검색, 페이지 이동, CSV 다운로드 및 팝업 상태.

시안 샘플과 의도적으로 다른 부분:

- 사용자 지시에 따라 유료 충전 상품과 충전 버튼을 숨김.
- 구독 관리와 결제·환불 내역은 원래 실제 라우트로 이동.
- 샘플 숫자·만료일·예약 토글을 실제 서버 값으로 교체. 만료일 순서 및 FREE/PAID 동률 우선순위도 서버 계산.
- 문서 생성 예상 횟수는 실제 유료 프롬프트 가격의 최소·최대값을 기준으로 서버 계산.
- 그룹 지급·무료체험·반환 등 실제 지급 유형별 만료일을 표시. 모든 지급이 당월 소멸하거나 12개월 보존된다고 표시하지 않음.
- 거래 반환 신청은 준비중 상태. 클릭만으로 꼬막을 복원하는 시뮬레이션을 이식하지 않음.
- 검색/카테고리는 전체 거래에 서버 적용 후 페이지 분할. 거래 후 잔액은 검색 전 원장 기준을 보존.
- 엑셀 내보내기는 현재 조건의 전체 원장을 UTF-8 BOM CSV로 다운로드.

클래스 변경 후 프런트 레포 루트에서 재생성:

```sh
npx --yes --package tailwindcss@3.4.17 tailwindcss -c src/pages/groups/kkomak/tailwind.config.cjs -i src/pages/groups/kkomak/wallet-input.css -o src/pages/groups/kkomak/wallet-utilities.css --minify
```

백엔드 `/api/v1/points/me/ledger` 확장과 `/api/v1/points/me/ledger/export`가 함께 필요하다. 기존 테이블을 조회하므로 SQL 마이그레이션은 없다.
