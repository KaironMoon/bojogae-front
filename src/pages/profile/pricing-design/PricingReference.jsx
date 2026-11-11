/* eslint-disable react/prop-types */
// Copied from the pricing HTML design; application data and actions are bound separately.
import Icon from "./PricingIcon";
export default function PricingReference({ vm }) {
  return (
    <main className="MuiBox-root css-1rylx60 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div
        id="viewPricingContent"
        className="MuiStack-root css-6222vs space-y-7 sm:space-y-9"
      >
        <header className="MuiPaper-root MuiPaper-outlined MuiPaper-rounded css-17o6koo ns-card p-6 sm:p-8 bg-white relative overflow-hidden">
          <div className="absolute -right-12 -top-12 w-64 h-64 rounded-full bg-gradient-to-br from-[#03c75a]/10 to-[#6b38fb]/10 blur-2xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="MuiStack-root css-66wmgz space-y-2.5 max-w-2xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="MuiTypography-root MuiTypography-overline css-erkcr px-3 py-1 rounded-full bg-primary-soft text-primary border border-emerald-200 text-xs font-black tracking-wide">
                  개인회원 · GA 지점 요금제
                </span>
                <span className="px-3 py-1 rounded-full ai-pill-badge text-white text-xs font-black flex items-center gap-1">
                  <Icon name="sparkles" className="w-3.5 h-3.5" /> 모든 플랜 8대
                  실전 무기 100% 개방
                </span>
              </div>

              <h1 className="MuiTypography-root MuiTypography-body1 css-bbwd96 text-2xl sm:text-4xl font-black text-[#121314] tracking-tight leading-tight">
                요금 안내
              </h1>

              <p className="MuiTypography-root MuiTypography-body1 css-9io8id text-sm sm:text-base font-semibold text-[#4e5968] leading-relaxed">
                보험 제안서 분석과 보고서 생성에 사용할 요금제를 확인해 보세요.
                <br className="hidden sm:inline" />
                <strong className="text-[#121314]">
                  어떤 요금제를 선택하셔도 보조개의 8대 핵심 실무 기능과
                  스마트폰 모바일팩스 무료 청구·카톡 자동발송(보조개톡)을 모두
                  이용
                </strong>
                하실 수 있습니다.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:min-w-[360px] shrink-0">
              <div className="p-3.5 rounded-2xl bg-[#f8fafc] border border-[#e6eaee] flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-[#8b95a1]">
                    리포트 생성 · PC 웹팩스
                  </span>
                  <span className="w-6 h-6 rounded-lg bg-[#fffbeb] text-amber-600 flex items-center justify-center font-black text-xs">
                    <Icon name="file-text" className="w-3.5 h-3.5" />
                  </span>
                </div>
                <div className="text-base sm:text-lg font-black text-[#121314] mt-1">
                  요금제별 문서 생성
                </div>
                <span className="text-[10.5px] font-semibold text-[#8b95a1]">
                  PC 웹팩스 직접 발송 유료
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-primary-soft/60 border border-emerald-200 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-primary">
                    회원 공통 무료 특전
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-primary text-white text-[9.5px] font-black">
                    무료
                  </span>
                </div>
                <div className="text-sm sm:text-base font-black text-[#121314] mt-1">
                  모바일팩스 & 보조개톡
                </div>
                <span className="text-[10.5px] font-bold text-[#4e5968]">
                  모바일 웹팩스 발송 시 무료
                </span>
              </div>
            </div>
          </div>
        </header>

        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-[#121314]">
                나에게 맞는 요금제 선택
              </h2>
              <span className="text-xs font-bold text-[#8b95a1]">
                · 모든 유료 플랜은 언제든 해지 및 변경 가능합니다
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-extrabold text-primary bg-primary-soft px-3 py-1.5 rounded-full border border-emerald-200">
              <Icon name="calculator" className="w-3.5 h-3.5" />
              <span>
                월 예상 생성 · 베이직 30번 · 스탠다드 50번 · 프로 100번
              </span>
            </div>
          </div>

          <div className="MuiBox-root css-o5s4km grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 items-stretch">
            <article
              className="MuiPaper-root MuiPaper-outlined MuiPaper-rounded css-1ft4zqn ns-plan-card p-5 sm:p-6 bg-white"
              aria-labelledby="plan-FREE"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-lg bg-[#f4f6f8] text-[#4e5968] text-[11px] font-extrabold">
                    첫 시작 체험
                  </span>
                  <span className="text-[11px] font-bold text-[#8b95a1]">
                    카드 등록 불필요
                  </span>
                </div>

                <div className="MuiStack-root css-1mxbm47">
                  <h2
                    className="MuiTypography-root MuiTypography-h6 css-1wnzn0r text-xl font-black text-[#121314]"
                    id="plan-FREE"
                  >
                    무료체험
                  </h2>
                  <p className="text-xs font-semibold text-[#8b95a1] mt-0.5">
                    카드 등록 없이 30일 무료체험
                  </p>
                </div>

                <p className="MuiTypography-root MuiTypography-body1 css-720qvj flex items-baseline gap-1">
                  <span className="MuiTypography-root MuiTypography-body1 css-q7gxgf text-3xl font-black text-[#121314]">
                    {vm.plans.FREE.price}
                  </span>
                  <span className="MuiTypography-root MuiTypography-body2 css-pc1zp text-xs font-bold text-[#8b95a1]">
                    / 30일
                  </span>
                </p>

                <div className="p-3 rounded-2xl bg-[#f8fafc] border border-[#e6eaee] space-y-1">
                  <div className="text-xs font-bold text-[#4e5968]">
                    30일 무료 체험
                  </div>
                  <p className="MuiTypography-root MuiTypography-body2 css-76jb0x text-xs font-black text-primary">
                    {vm.estimates.FREE}
                  </p>
                </div>

                <hr className="MuiDivider-root MuiDivider-fullWidth css-k3eyz3 border-[#f4f6f8]" />

                <ul className="space-y-2.5 text-xs font-semibold text-[#4e5968]">
                  <li className="flex items-start gap-2">
                    <Icon
                      name="check"
                      className="w-4 h-4 text-primary shrink-0 mt-0.5"
                    />
                    <span>{vm.estimates.FREE}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon
                      name="check"
                      className="w-4 h-4 text-primary shrink-0 mt-0.5"
                    />
                    <span>보험 제안서 분석·보고서 생성 체험</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon
                      name="check"
                      className="w-4 h-4 text-primary shrink-0 mt-0.5"
                    />
                    <span>모바일 웹팩스 발송 무료 & 보조개톡 무료</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon
                      name="check"
                      className="w-4 h-4 text-primary shrink-0 mt-0.5"
                    />
                    <span className="MuiTypography-root MuiTypography-body2 css-19q9c7c">
                      카드 등록 없이 30일 무료체험
                    </span>
                  </li>
                </ul>
              </div>

              <div className="pt-6 mt-6">
                <button
                  className="w-full py-3 px-4 rounded-xl bg-[#f4f6f8] hover:bg-slate-200 text-[#121314] text-xs font-black flex items-center justify-center gap-1.5 transition-all"
                  onClick={() => vm.openPlan("FREE")}
                  type="button"
                >
                  <span>{vm.actionLabel("FREE")}</span>
                  <Icon name="arrow-right" className="w-3.5 h-3.5" />
                </button>
              </div>
            </article>

            <article
              className="MuiPaper-root MuiPaper-outlined MuiPaper-rounded css-1ft4zqn ns-plan-card p-5 sm:p-6 bg-white"
              aria-labelledby="plan-BASIC"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-lg bg-[#f4f6f8] text-[#4e5968] text-[11px] font-extrabold">
                    가볍게 시작
                  </span>
                  <span className="text-[11px] font-extrabold text-[#8b95a1]">
                    1건당 약 633원
                  </span>
                </div>

                <div className="MuiStack-root css-1mxbm47">
                  <h2
                    className="MuiTypography-root MuiTypography-h6 css-1wnzn0r text-xl font-black text-[#121314]"
                    id="plan-BASIC"
                  >
                    베이직
                  </h2>
                  <p className="MuiTypography-root MuiTypography-body2 css-19q9c7c text-xs font-semibold text-[#8b95a1] mt-0.5">
                    보험 제안서 분석·보고서 생성 월간 구독권
                  </p>
                </div>

                <p className="MuiTypography-root MuiTypography-body1 css-720qvj flex items-baseline gap-1">
                  <span className="MuiTypography-root MuiTypography-body1 css-q7gxgf text-3xl font-black text-[#121314]">
                    {vm.plans.BASIC.price}
                  </span>
                  <span className="MuiTypography-root MuiTypography-body2 css-pc1zp text-xs font-bold text-[#8b95a1]">
                    / 월
                  </span>
                </p>

                <div className="p-3 rounded-2xl bg-[#fffbeb] border border-[#fde68a] space-y-1">
                  <div className="text-xs font-bold text-[#4e5968]">
                    월간 문서 생성
                  </div>
                  <p className="MuiTypography-root MuiTypography-body2 css-76jb0x text-xs font-black text-[#92400e]">
                    {vm.estimates.BASIC}
                  </p>
                </div>

                <hr className="MuiDivider-root MuiDivider-fullWidth css-k3eyz3 border-[#f4f6f8]" />

                <ul className="space-y-2.5 text-xs font-semibold text-[#4e5968]">
                  <li className="flex items-start gap-2">
                    <Icon
                      name="check"
                      className="w-4 h-4 text-primary shrink-0 mt-0.5"
                    />
                    <span className="font-extrabold text-[#121314]">
                      {vm.estimates.BASIC}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon
                      name="check"
                      className="w-4 h-4 text-primary shrink-0 mt-0.5"
                    />
                    <span>보험 제안서 분석·보고서 생성</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon
                      name="check"
                      className="w-4 h-4 text-primary shrink-0 mt-0.5"
                    />
                    <span>쉬운 설명 자동 변환 & 아카이빙</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon
                      name="check"
                      className="w-4 h-4 text-primary shrink-0 mt-0.5"
                    />
                    <span>모바일 웹팩스 발송 무료 & 보조개톡 무료</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6 mt-6">
                <button
                  className="w-full py-3 px-4 rounded-xl bg-[#e9ecef] hover:bg-[#121314] hover:text-white text-[#121314] text-xs font-black flex items-center justify-center gap-1.5 transition-all"
                  onClick={() => vm.openPlan("BASIC")}
                  type="button"
                >
                  <span>{vm.actionLabel("BASIC")}</span>
                  <Icon name="arrow-right" className="w-3.5 h-3.5" />
                </button>
              </div>
            </article>

            <article
              className="MuiPaper-root MuiPaper-outlined MuiPaper-rounded css-1ft4zqn ns-plan-card ns-plan-featured p-5 sm:p-6 bg-white"
              aria-labelledby="plan-STANDARD"
            >
              <div className="absolute -top-3 right-5 px-3 py-0.5 rounded-full bg-primary text-white text-[10.5px] font-black shadow-md flex items-center gap-1">
                <Icon name="flame" className="w-3 h-3 fill-current" /> 설계사
                68% 선택
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-lg bg-primary-soft text-primary border border-emerald-200 text-[11px] font-black">
                    가장 선호
                  </span>
                  <span className="text-[11px] font-extrabold text-primary">
                    1건당 약 580원
                  </span>
                </div>

                <div className="MuiStack-root css-1mxbm47">
                  <h2
                    className="MuiTypography-root MuiTypography-h6 css-1wnzn0r text-xl font-black text-[#121314]"
                    id="plan-STANDARD"
                  >
                    스탠다드
                  </h2>
                  <p className="MuiTypography-root MuiTypography-body2 css-19q9c7c text-xs font-semibold text-[#8b95a1] mt-0.5">
                    보험 제안서 분석·보고서 생성 월간 구독권
                  </p>
                </div>

                <p className="MuiTypography-root MuiTypography-body1 css-720qvj flex items-baseline gap-1">
                  <span className="MuiTypography-root MuiTypography-body1 css-q7gxgf text-3xl font-black text-primary">
                    {vm.plans.STANDARD.price}
                  </span>
                  <span className="MuiTypography-root MuiTypography-body2 css-pc1zp text-xs font-bold text-[#8b95a1]">
                    / 월
                  </span>
                </p>

                <div className="p-3 rounded-2xl bg-primary-soft/80 border border-emerald-300 space-y-1">
                  <div className="text-xs font-bold text-[#4e5968]">
                    월간 문서 생성
                  </div>
                  <p className="MuiTypography-root MuiTypography-body2 css-76jb0x text-xs font-black text-[#121314]">
                    {vm.estimates.STANDARD}
                  </p>
                </div>

                <hr className="MuiDivider-root MuiDivider-fullWidth css-k3eyz3 border-[#e6eaee]" />

                <ul className="space-y-2.5 text-xs font-semibold text-[#121314]">
                  <li className="flex items-start gap-2">
                    <Icon
                      name="check-circle-2"
                      className="w-4 h-4 text-primary shrink-0 mt-0.5"
                    />
                    <span className="font-black">{vm.estimates.STANDARD}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon
                      name="check-circle-2"
                      className="w-4 h-4 text-primary shrink-0 mt-0.5"
                    />
                    <span>보험 제안서 분석·보고서 생성</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon
                      name="check-circle-2"
                      className="w-4 h-4 text-primary shrink-0 mt-0.5"
                    />
                    <span>쉬운 설명 자동 변환 & 아카이빙</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon
                      name="check-circle-2"
                      className="w-4 h-4 text-primary shrink-0 mt-0.5"
                    />
                    <span>모바일 웹팩스 발송 무료 & 보조개톡 무료</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6 mt-6">
                <button
                  className="ns-hero-cta w-full py-3.5 px-4 rounded-xl text-white text-xs font-black flex items-center justify-center gap-1.5"
                  onClick={() => vm.openPlan("STANDARD")}
                  type="button"
                >
                  <span>{vm.actionLabel("STANDARD")}</span>
                  <Icon name="arrow-right" className="w-4 h-4" />
                </button>
              </div>
            </article>

            <article
              className="MuiPaper-root MuiPaper-outlined MuiPaper-rounded css-1ft4zqn ns-plan-card p-5 sm:p-6 bg-white"
              aria-labelledby="plan-PRO"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-lg bg-sub-soft text-sub border border-purple-200 text-[11px] font-black">
                    많이 사용하는 분께
                  </span>
                  <span className="text-[11px] font-extrabold text-sub">
                    1건당 490원(최저가)
                  </span>
                </div>

                <div className="MuiStack-root css-1mxbm47">
                  <h2
                    className="MuiTypography-root MuiTypography-h6 css-1wnzn0r text-xl font-black text-[#121314]"
                    id="plan-PRO"
                  >
                    프로
                  </h2>
                  <p className="MuiTypography-root MuiTypography-body2 css-19q9c7c text-xs font-semibold text-[#8b95a1] mt-0.5">
                    보험 제안서 분석·보고서 생성 월간 구독권
                  </p>
                </div>

                <p className="MuiTypography-root MuiTypography-body1 css-720qvj flex items-baseline gap-1">
                  <span className="MuiTypography-root MuiTypography-body1 css-q7gxgf text-3xl font-black text-[#121314]">
                    {vm.plans.PRO.price}
                  </span>
                  <span className="MuiTypography-root MuiTypography-body2 css-pc1zp text-xs font-bold text-[#8b95a1]">
                    / 월
                  </span>
                </p>

                <div className="p-3 rounded-2xl bg-sub-soft/70 border border-purple-200 space-y-1">
                  <div className="text-xs font-bold text-[#4e5968]">
                    월간 문서 생성
                  </div>
                  <p className="MuiTypography-root MuiTypography-body2 css-76jb0x text-xs font-black text-[#121314]">
                    {vm.estimates.PRO}
                  </p>
                </div>

                <hr className="MuiDivider-root MuiDivider-fullWidth css-k3eyz3 border-[#f4f6f8]" />

                <ul className="space-y-2.5 text-xs font-semibold text-[#4e5968]">
                  <li className="flex items-start gap-2">
                    <Icon
                      name="check"
                      className="w-4 h-4 text-sub shrink-0 mt-0.5"
                    />
                    <span className="font-extrabold text-[#121314]">
                      {vm.estimates.PRO}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon
                      name="check"
                      className="w-4 h-4 text-sub shrink-0 mt-0.5"
                    />
                    <span>보험 제안서 분석·보고서 생성</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon
                      name="check"
                      className="w-4 h-4 text-sub shrink-0 mt-0.5"
                    />
                    <span>쉬운 설명 자동 변환 & 아카이빙</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon
                      name="check"
                      className="w-4 h-4 text-sub shrink-0 mt-0.5"
                    />
                    <span>대량 DB 상담·리모델링 설계사 추천</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6 mt-6">
                <button
                  className="w-full py-3 px-4 rounded-xl bg-[#121314] hover:bg-sub text-white text-xs font-black flex items-center justify-center gap-1.5 transition-all"
                  onClick={() => vm.openPlan("PRO")}
                  type="button"
                >
                  <span>{vm.actionLabel("PRO")}</span>
                  <Icon name="arrow-right" className="w-3.5 h-3.5" />
                </button>
              </div>
            </article>

            <article
              className="MuiPaper-root MuiPaper-outlined MuiPaper-rounded css-1ft4zqn ns-plan-card ns-plan-dark p-5 sm:p-6"
              aria-labelledby="plan-GROUP"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-lg bg-white/10 text-emerald-400 border border-white/15 text-[11px] font-black">
                    지점·본부·GA
                  </span>
                  <span className="text-[11px] font-bold text-slate-400">
                    단체 할인 적용
                  </span>
                </div>

                <div className="MuiStack-root css-1mxbm47">
                  <h2
                    className="MuiTypography-root MuiTypography-h6 css-1wnzn0r text-xl font-black text-white"
                    id="plan-GROUP"
                  >
                    사무실 그룹
                  </h2>
                  <p className="text-xs font-semibold text-slate-400 mt-0.5">
                    GA 지점·본부 단위 통합 운영 플랜
                  </p>
                </div>

                <p className="MuiTypography-root MuiTypography-body1 css-720qvj flex items-baseline gap-1.5">
                  <span className="MuiTypography-root MuiTypography-body1 css-q7gxgf text-3xl font-black text-white">
                    별도 문의
                  </span>
                  <span className="MuiTypography-root MuiTypography-body2 css-pc1zp text-xs font-bold text-slate-400">
                    / 단체 할인
                  </span>
                </p>

                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-emerald-400">
                      🏢 지점 공용/개별 이용량 풀
                    </span>
                    <span className="text-[10px] font-black text-slate-300">
                      맞춤 설계
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-200">
                    인원수별 최대 할인 & 지점 브랜딩
                  </p>
                </div>

                <hr className="MuiDivider-root MuiDivider-fullWidth css-k3eyz3 border-white/10" />

                <ul className="space-y-2.5 text-xs font-semibold text-slate-300">
                  <li className="flex items-start gap-2">
                    <Icon
                      name="check"
                      className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5"
                    />
                    <span className="text-white font-bold">
                      사번 기반 그룹 로그인 지원
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon
                      name="check"
                      className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5"
                    />
                    <span className="text-white font-bold">
                      지점장 관리자 대시보드 제공
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon
                      name="check"
                      className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5"
                    />
                    <span>단체 맞춤형 운영 지원 및 방문/LIVE 특강</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon
                      name="check"
                      className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5"
                    />
                    <span>소속 설계사 전원 8대 무기 무제한 개방</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6 mt-6">
                <button
                  className="w-full py-3.5 px-4 rounded-xl bg-white hover:bg-emerald-400 hover:text-[#121314] text-[#121314] text-xs font-black flex items-center justify-center gap-1.5 transition-all"
                  onClick={vm.openInquiry}
                >
                  <span>단체 도입 문의</span>
                  <Icon name="arrow-right" className="w-4 h-4" />
                </button>
              </div>
            </article>
          </div>
        </div>

        {/* Additional paid top-up product hidden at user request. */}

        <section
          id="weaponsSection"
          className="ns-card p-6 sm:p-8 bg-[#0f172a] text-white space-y-6 relative overflow-hidden"
        >
          <div className="absolute inset-0 opacity-15 pointer-events-none"></div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-5">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#03c75a]/20 border border-[#03c75a]/40 text-emerald-300 text-xs font-black mb-2">
                <Icon name="zap" className="w-3.5 h-3.5" /> ALL-IN-ONE 8 WEAPONS
                INCLUDED
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                모든 요금제에 기본 탑재된{" "}
                <span className="text-[#03c75a]">‘실시간 8대 실전 무기’</span>
              </h2>
              <p className="text-xs sm:text-sm font-medium text-slate-300 mt-1">
                무료체험부터 프로·그룹 요금제까지 기능 차등 없이 8가지 핵심 실무
                자동화 도구를 모두 사용하실 수 있습니다.
              </p>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-white/10 border border-white/15 text-xs font-bold text-slate-200 shrink-0">
              💡 01~06번 리포트{" "}
              <strong className="text-amber-300">문서 생성 이용량 적용</strong>{" "}
              · 07번{" "}
              <strong className="text-emerald-300">
                모바일 웹팩스 발송 시 무료
              </strong>{" "}
              (PC 웹팩스는 이용량 차감) · 08번{" "}
              <strong className="text-emerald-300">무료</strong>
            </div>
          </div>

          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white text-[#121314] rounded-2xl p-5 pt-11 relative shadow-lg hover:-translate-y-1 transition-all flex flex-col justify-between">
              <div className="weapon-flag bg-[#ea580c]">01</div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-black leading-snug">
                    5년치 청구가능
                    <br />
                    보험금 자동 확인
                  </h3>
                  <div className="w-11 h-11 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                    <Icon name="file-search-2" className="w-6 h-6" />
                  </div>
                </div>
                <p className="text-xs font-semibold text-[#4e5968] leading-relaxed">
                  “건강e음” 진료기록과 보장분석표 대조로 고객도 몰랐던{" "}
                  <strong>숨은 미청구 보험금과 예상 수령액을 즉시 추출</strong>
                  합니다.
                </p>
              </div>
              <div className="mt-4 pt-2.5 border-t border-[#f4f6f8] flex items-center justify-between text-[11px] font-extrabold">
                <span className="text-orange-600">상담 오프닝 최강 무기</span>
                <span className="px-2 py-0.5 rounded bg-[#fffbeb] text-[#92400e] border border-[#fde68a]">
                  문서 생성 이용량 적용
                </span>
              </div>
            </div>

            <div className="bg-white text-[#121314] rounded-2xl p-5 pt-11 relative shadow-lg hover:-translate-y-1 transition-all flex flex-col justify-between">
              <div className="weapon-flag bg-[#f59e0b]">02</div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-black leading-snug">
                    알릴의무
                    <br />
                    1분 완성
                  </h3>
                  <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                    <Icon name="clipboard-check" className="w-6 h-6" />
                  </div>
                </div>
                <p className="text-xs font-semibold text-[#4e5968] leading-relaxed">
                  세부 진료기록 PDF 하나로{" "}
                  <strong>
                    3개월·1년·5년 고지 대상 항목만 정확하게 자동 필터링
                  </strong>
                  하여 직권해지·분쟁을 차단합니다.
                </p>
              </div>
              <div className="mt-4 pt-2.5 border-t border-[#f4f6f8] flex items-center justify-between text-[11px] font-extrabold">
                <span className="text-amber-600">고지 누락 분쟁 0건</span>
                <span className="px-2 py-0.5 rounded bg-[#fffbeb] text-[#92400e] border border-[#fde68a]">
                  문서 생성 이용량 적용
                </span>
              </div>
            </div>

            <div className="bg-white text-[#121314] rounded-2xl p-5 pt-11 relative shadow-lg hover:-translate-y-1 transition-all flex flex-col justify-between">
              <div className="weapon-flag bg-[#03c75a]">03</div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-black leading-snug">
                    3분 보장분석
                    <br />
                    <span className="text-xs font-bold text-[#8b95a1]">
                      (문제점 정밀 진단)
                    </span>
                  </h3>
                  <div className="w-11 h-11 rounded-2xl bg-primary-soft text-primary flex items-center justify-center shrink-0">
                    <Icon name="shield-alert" className="w-6 h-6" />
                  </div>
                </div>
                <p className="text-xs font-semibold text-[#4e5968] leading-relaxed">
                  기존 보유 보험의{" "}
                  <strong>
                    누락된 보장 공백, 중복 가입, 갱신형 폭탄 특약을 3분 만에
                    자동 분석
                  </strong>
                  해 리모델링 명분을 만듭니다.
                </p>
              </div>
              <div className="mt-4 pt-2.5 border-t border-[#f4f6f8] flex items-center justify-between text-[11px] font-extrabold">
                <span className="text-primary">보장 문제점 원클릭 진단</span>
                <span className="px-2 py-0.5 rounded bg-[#fffbeb] text-[#92400e] border border-[#fde68a]">
                  문서 생성 이용량 적용
                </span>
              </div>
            </div>

            <div className="bg-white text-[#121314] rounded-2xl p-5 pt-11 relative shadow-lg hover:-translate-y-1 transition-all flex flex-col justify-between">
              <div className="weapon-flag bg-[#10b981]">04</div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-black leading-snug">
                    보험사 상품별
                    <br />
                    비교 분석
                  </h3>
                  <div className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                    <Icon name="columns-3" className="w-6 h-6" />
                  </div>
                </div>
                <p className="text-xs font-semibold text-[#4e5968] leading-relaxed">
                  <strong>
                    2~5개 보험사 가입제안서의 가격 및 핵심 담보를 나란히 자동
                    비교 요약
                  </strong>
                  하여 고객이 스스로 비교우위를 선택하게 합니다.
                </p>
              </div>
              <div className="mt-4 pt-2.5 border-t border-[#f4f6f8] flex items-center justify-between text-[11px] font-extrabold">
                <span className="text-teal-600">엑셀 수작업 비교표 종결</span>
                <span className="px-2 py-0.5 rounded bg-[#fffbeb] text-[#92400e] border border-[#fde68a]">
                  문서 생성 이용량 적용
                </span>
              </div>
            </div>

            <div className="bg-white text-[#121314] rounded-2xl p-5 pt-11 relative shadow-lg hover:-translate-y-1 transition-all flex flex-col justify-between">
              <div className="weapon-flag bg-[#0284c7]">05</div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-black leading-snug">
                    복잡한 제안서
                    <br />
                    1장 요약
                  </h3>
                  <div className="w-11 h-11 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                    <Icon name="file-text" className="w-6 h-6" />
                  </div>
                </div>
                <p className="text-xs font-semibold text-[#4e5968] leading-relaxed">
                  깨알 같은 수십 장의 원수사 가입제안서를{" "}
                  <strong>
                    고객이 스마트폰에서 한눈에 이해하는 직관적인 A4 카드형
                    리포트
                  </strong>
                  로 변환합니다.
                </p>
              </div>
              <div className="mt-4 pt-2.5 border-t border-[#f4f6f8] flex items-center justify-between text-[11px] font-extrabold">
                <span className="text-sky-600">53종 특화 프롬프트 제공</span>
                <span className="px-2 py-0.5 rounded bg-[#fffbeb] text-[#92400e] border border-[#fde68a]">
                  문서 생성 이용량 적용
                </span>
              </div>
            </div>

            <div className="bg-white text-[#121314] rounded-2xl p-5 pt-11 relative shadow-lg hover:-translate-y-1 transition-all flex flex-col justify-between">
              <div className="weapon-flag bg-[#2563eb]">06</div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-black leading-snug">
                    리모델링
                    <br />
                    종합 리포트
                  </h3>
                  <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Icon name="bar-chart-big" className="w-6 h-6" />
                  </div>
                </div>
                <p className="text-xs font-semibold text-[#4e5968] leading-relaxed">
                  해지할 기존 보험과 새로 설계한 보험의{" "}
                  <strong>
                    Before / After 월 보험료 및 보장 시뮬레이션을 한눈에 비교
                  </strong>
                  해 클로징을 끝냅니다.
                </p>
              </div>
              <div className="mt-4 pt-2.5 border-t border-[#f4f6f8] flex items-center justify-between text-[11px] font-extrabold">
                <span className="text-blue-600">전후 비교 그래프 자동생성</span>
                <span className="px-2 py-0.5 rounded bg-[#fffbeb] text-[#92400e] border border-[#fde68a]">
                  문서 생성 이용량 적용
                </span>
              </div>
            </div>

            <div className="bg-white text-[#121314] rounded-2xl p-5 pt-11 relative shadow-lg border-2 border-emerald-400 hover:-translate-y-1 transition-all flex flex-col justify-between">
              <div className="weapon-flag bg-[#03c75a]">07</div>
              <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-primary text-white text-[10px] font-black">
                ★ 모바일 발송 무료
              </span>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-black leading-snug">
                    모바일 웹팩스
                    <br />
                    무료 청구
                  </h3>
                  <div className="w-11 h-11 rounded-2xl bg-primary-soft text-primary flex items-center justify-center shrink-0">
                    <Icon name="send" className="w-6 h-6" />
                  </div>
                </div>
                <p className="text-xs font-semibold text-[#4e5968] leading-relaxed">
                  40개 보험사 청구서 자동 작성 후{" "}
                  <strong>
                    스마트폰 모바일 웹팩스로 발송 시 추가 비용 없이 무료
                  </strong>
                  로 접수됩니다.{" "}
                  <span className="text-[#8b95a1]">
                    (단, PC 다이렉트 웹팩스 발송 시 이용량 차감)
                  </span>
                </p>
              </div>
              <div className="mt-4 pt-2.5 border-t border-[#f4f6f8] flex items-center justify-between text-[11px] font-extrabold">
                <span className="text-primary">모바일 발송 무료</span>
                <span className="px-2 py-0.5 rounded bg-amber-50 text-[#92400e] border border-amber-200 font-bold">
                  PC 웹팩스는 차감
                </span>
              </div>
            </div>

            <div className="bg-white text-[#121314] rounded-2xl p-5 pt-11 relative shadow-lg border-2 border-[#fee500] hover:-translate-y-1 transition-all flex flex-col justify-between">
              <div className="weapon-flag bg-[#f04452]">08</div>
              <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-[#fee500] text-[#191600] text-[10px] font-black">
                ★ 전 회원 무료
              </span>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-black leading-snug">
                    카톡 사후관리
                    <br />
                    자동화 (보조개톡)
                  </h3>
                  <div className="w-11 h-11 rounded-2xl bg-[#fee500] text-[#191600] flex items-center justify-center shrink-0 font-black text-xs">
                    TALK
                  </div>
                </div>
                <p className="text-xs font-semibold text-[#4e5968] leading-relaxed">
                  리포트 전송부터 정기 안부 발송까지,{" "}
                  <strong>
                    보조개톡 PC 프로그램으로 고객 소통과 사후관리를 완벽하게
                    시스템화
                  </strong>
                  합니다.
                </p>
              </div>
              <div className="mt-4 pt-2.5 border-t border-[#f4f6f8] flex items-center justify-between text-[11px] font-extrabold">
                <span className="text-[#f04452]">보조개톡 앱 무료 제공</span>
                <span className="px-2 py-0.5 rounded bg-rose-50 text-[#f04452] font-black">
                  전 회원 무료
                </span>
              </div>
            </div>
          </div>

          <div className="relative z-10 p-4 sm:p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 grid grid-cols-1 lg:grid-cols-11 gap-4 items-center">
            <div className="lg:col-span-4 flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-400/30 text-rose-300 flex items-center justify-center shrink-0">
                <Icon name="alert-triangle" className="w-5 h-5" />
              </span>
              <div>
                <div className="text-xs font-black text-rose-300">
                  기존 수작업의 한계
                </div>
                <div className="text-xs sm:text-sm font-bold text-white mt-0.5">
                  매일 2~3시간 야근 · 복잡한 엑셀 비교 · 불안한 고지 실수
                </div>
              </div>
            </div>

            <div className="lg:col-span-3 flex items-center justify-center">
              <div className="px-4 py-1.5 rounded-full bg-gradient-to-r from-[#03c75a] to-[#6b38fb] text-white text-xs font-black flex items-center gap-2 shadow-md">
                <span>AI 실무 자동화 도입</span>
                <Icon name="arrow-right" className="w-4 h-4" />
              </div>
            </div>

            <div className="lg:col-span-4 flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 flex items-center justify-center shrink-0">
                <Icon name="check-circle-2" className="w-5 h-5" />
              </span>
              <div>
                <div className="text-xs font-black text-emerald-300">
                  보조개 프로세스 혁신
                </div>
                <div className="text-xs sm:text-sm font-bold text-white mt-0.5">
                  1분 원클릭 요약 · 안전한 분쟁 차단 · 상담 성공률 폭발
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="ns-card p-6 sm:p-8 bg-white space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-[#f04452] text-[11px] font-black">
                COST COMPARISON
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-[#121314] mt-1">
                여러 유료 솔루션을 따로 결제하지 마세요.{" "}
                <span className="text-primary">최대 80% 고정비 절감!</span>
              </h2>
            </div>
            <span className="text-xs font-bold text-[#8b95a1]">
              설계사 실무 3대 툴 개별 구독 시 월 고정 지출 비교
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
            <div className="lg:col-span-5 p-5 rounded-2xl bg-[#f8fafc] border border-[#e6eaee] flex flex-col justify-between space-y-4">
              <div>
                <span className="px-2.5 py-1 rounded-md bg-slate-200 text-[#4e5968] text-xs font-extrabold">
                  기존 3개 서비스 따로 구독 시
                </span>
                <div className="mt-4 space-y-2.5 text-xs sm:text-sm font-bold text-[#4e5968]">
                  <div className="flex items-center justify-between py-2 border-b border-[#e6eaee]">
                    <span>• 범용 AI 유료 구독 (제미나이 프로 등)</span>
                    <span className="font-extrabold text-[#121314]">
                      월 29,000원
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-[#e6eaee]">
                    <span>• 타사 보장분석·비교 솔루션 A사</span>
                    <span className="font-extrabold text-[#121314]">
                      월 38,000 ~ 103,000원
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-[#e6eaee]">
                    <span>• 타사 고객관리·카톡 발송 솔루션 B사</span>
                    <span className="font-extrabold text-[#121314]">
                      월 29,000원
                    </span>
                  </div>
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between">
                <span className="text-xs font-black text-[#f04452]">
                  매월 합산 고정 지출
                </span>
                <span className="text-base sm:text-lg font-black text-[#f04452] line-through">
                  월 96,000원 ~ 161,000원
                </span>
              </div>
            </div>

            <div className="lg:col-span-2 flex flex-col items-center justify-center py-2">
              <div className="w-12 h-12 rounded-2xl bg-primary-soft text-primary flex items-center justify-center font-black shadow-xs">
                VS
              </div>
              <span className="text-[11px] font-black text-primary mt-1.5 text-center">
                보조개 하나로
                <br />
                올인원 통합!
              </span>
            </div>

            <div className="lg:col-span-5 p-5 rounded-2xl bg-primary-soft/50 border-2 border-primary flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-md bg-primary text-white text-xs font-black">
                    보조개 올인원 구독 시
                  </span>
                  <span className="text-xs font-black text-primary">
                    비교 예시 기준 비용 절감
                  </span>
                </div>

                <div className="mt-4 space-y-2.5 text-xs sm:text-sm">
                  <div className="p-3 rounded-xl bg-white border border-emerald-200 flex items-center justify-between">
                    <div>
                      <div className="font-black text-[#121314]">
                        최소 비용 시작 (베이직)
                      </div>
                      <div className="text-[11px] font-semibold text-[#8b95a1]">
                        기존 96,000원 ➔ 19,000원
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-primary text-white text-xs font-black">
                      -80% 절감
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-emerald-200 flex items-center justify-between">
                    <div>
                      <div className="font-black text-[#121314]">
                        대용량 헤비유저 (프로)
                      </div>
                      <div className="text-[11px] font-semibold text-[#8b95a1]">
                        기존 161,000원 ➔ 49,000원
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-sub text-white text-xs font-black">
                      -70% 절감
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#121314] text-white flex items-center justify-between">
                <span className="text-xs font-extrabold text-emerald-400">
                  8대 실전 무기 + 웹팩스 + 보조개톡
                </span>
                <span className="text-base sm:text-lg font-black">
                  월 19,000원부터
                </span>
              </div>
            </div>
          </div>
        </section>

        <section
          className="MuiPaper-root MuiPaper-outlined MuiPaper-rounded css-56oyh4 ns-card p-6 bg-white"
          aria-labelledby="plan-usage-note"
        >
          <div className="MuiStack-root css-16yfybm space-y-4">
            <div className="MuiStack-root css-w6mnnp flex items-start gap-3">
              <div className="MuiBox-root css-rz3xeu w-9 h-9 rounded-xl bg-primary-soft text-primary flex items-center justify-center shrink-0 mt-0.5">
                <Icon name="info" className="w-5 h-5" />
              </div>
              <div className="MuiBox-root css-0 space-y-1">
                <h2
                  className="MuiTypography-root MuiTypography-body1 css-12zrezq text-base font-black text-[#121314]"
                  id="plan-usage-note"
                >
                  이용 안내
                </h2>
                <p className="MuiTypography-root MuiTypography-body2 css-1d8v1kv text-xs sm:text-sm font-semibold text-[#4e5968]">
                  {vm.usageNote}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              <div className="p-4 rounded-2xl bg-[#f8fafc] border border-[#e6eaee] space-y-1.5">
                <div className="text-xs font-black text-[#121314] flex items-center gap-1.5">
                  <Icon name="coins" className="w-4 h-4 text-amber-500" />
                  <span>1. 보고서와 팩스 이용 기준</span>
                </div>
                <p className="text-xs text-[#4e5968] leading-relaxed font-medium">
                  보고서 생성에 요금제별 이용량이 적용됩니다. 생성된 보고서
                  열람·편집·저장은 무료입니다. 모바일팩스 연동 발송은 무료이며
                  PC 웹팩스 직접 발송은 유료입니다.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#f8fafc] border border-[#e6eaee] space-y-1.5">
                <div className="text-xs font-black text-[#121314] flex items-center gap-1.5">
                  <Icon
                    name="calendar-clock"
                    className="w-4 h-4 text-primary"
                  />
                  <span>2. 월간 구독 이용기간</span>
                </div>
                <p className="text-xs text-[#4e5968] leading-relaxed font-medium">
                  월간 구독은 결제 승인 후 한 달간 이용할 수 있습니다. 남은 월
                  이용량은 다음 이용기간으로 이월되지 않습니다.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#f8fafc] border border-[#e6eaee] space-y-1.5">
                <div className="text-xs font-black text-[#121314] flex items-center gap-1.5">
                  <Icon name="rotate-ccw" className="w-4 h-4 text-sub" />
                  <span>3. 오류·환불 및 구독 해지</span>
                </div>
                <p className="text-xs text-[#4e5968] leading-relaxed font-medium">
                  보고서 생성 오류로 사용 처리된 이용량은 복구됩니다. 환불 처리
                  상태는 요청하기 메뉴에서 확인할 수 있습니다. 개인 정기결제는
                  내 정보의 월간 구독권에서 해지할 수 있습니다.
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 pt-4 text-xs font-bold">
            <a href="/refund-requests" className="text-sub underline">
              환불 요청 내역
            </a>
            {vm.personal && (
              <a href="/profile#plan" className="text-primary underline">
                내 구독 관리
              </a>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
