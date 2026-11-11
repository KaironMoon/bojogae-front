/* eslint-disable react/prop-types */
// HTML structure copied from the insurer design reference.
import Icon from "./InsurerIcon";
import { FooterPortalLink } from "./Elements";
export default function DetailReference({ vm }) {
  return (
    <div
      className="insurer-reference-dialog flex flex-col min-h-0"
      aria-labelledby="insurer-detail-title"
    >
      <div
        id="modalHeaderBanner"
        className="px-5 sm:px-6 py-4 text-white flex items-center justify-between gap-3"
        style={{
          background: `linear-gradient(135deg, ${vm.color} 0%, #121314 100%)`,
        }}
      >
        <h2
          className="MuiTypography-root MuiTypography-h6 MuiDialogTitle-root css-7cjhhb flex items-center gap-2.5 flex-wrap m-0 p-0"
          id="insurer-detail-title"
        >
          <span
            id="modalCompanyName"
            className="MuiTypography-root MuiTypography-h6 css-1itxtsy text-lg sm:text-xl font-black tracking-tight text-white"
          >
            {vm.insurer.name}
          </span>
          <div className="MuiChip-root MuiChip-filled MuiChip-sizeSmall MuiChip-colorDefault MuiChip-filledDefault css-st0z6c px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-xs border border-white/25">
            <span
              id="modalSectorBadge"
              className="MuiChip-label MuiChip-labelSmall css-4y436t text-[11px] font-black text-white"
            >
              {vm.sector}
            </span>
          </div>
        </h2>

        <div className="flex items-center gap-2 shrink-0">
          <button
            className="px-3 py-1.5 rounded-xl bg-white text-[#121314] hover:bg-emerald-50 text-xs font-black flex items-center gap-1.5 shadow-xs transition-all"
            onClick={vm.copyAll}
            aria-label="전체 정보 복사"
          >
            <Icon name="copy" className="w-3.5 h-3.5 text-primary" />
            <span className="hidden sm:inline">전체 정보 복사</span>
          </button>
          <button
            id="modalFavBtn"
            title="즐겨찾기"
            className="w-8 h-8 rounded-xl bg-white/15 hover:bg-white/25 border border-white/25 flex items-center justify-center text-white"
            onClick={vm.toggle}
            disabled={vm.disabled}
            aria-pressed={vm.favorite}
          >
            <Icon name="star" className="w-4 h-4" />
          </button>
          <button
            tabIndex="0"
            type="button"
            aria-label="상세 정보 닫기"
            className="MuiButtonBase-root MuiIconButton-root MuiIconButton-sizeMedium css-1107e0y w-8 h-8 rounded-xl bg-black/25 hover:bg-black/45 flex items-center justify-center text-white transition-colors"
            onClick={vm.close}
          >
            <Icon name="x" className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="MuiDialogContent-root css-1ix8a p-4 sm:p-6 space-y-4 max-h-[78vh] overflow-y-auto bg-[#f4f6f8]">
        {vm.feedback}

        <div className="bg-white p-4 rounded-2xl border border-[#e6eaee] space-y-3.5">
          <div className="MuiStack-root css-sweg9x flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#f4f6f8]">
            <div className="flex items-center gap-3">
              <div id="modalLogoSlotBox" className="shrink-0">
                {vm.logo}
              </div>
              <div>
                <div
                  id="modalFullNameSub"
                  className="text-xs font-extrabold text-[#121314]"
                >
                  {vm.insurer.name}
                </div>
                <div className="text-[11px] font-medium text-[#8b95a1]">
                  공식 홈페이지 · 약관 · 청구양식 바로가기
                </div>
              </div>
            </div>

            {vm.browser}
          </div>

          <div
            id="modalTop5ButtonsBar"
            className="MuiStack-root css-17outbb grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2"
          >
            {vm.links}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#e6eaee]">
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="text-xs sm:text-sm font-black text-[#121314] flex items-center gap-1.5">
              <span className="w-6 h-6 rounded-lg bg-primary-soft text-primary flex items-center justify-center">
                <Icon name="phone-call" className="w-3.5 h-3.5" />
              </span>
              <span>핵심 연락처 및 청구 팩스</span>
            </h3>
            <span className="text-[11px] font-extrabold text-primary">
              클릭 시 번호가 즉시 복사됩니다
            </span>
          </div>
          <div
            id="modalContactsGrid"
            className="MuiBox-root css-c7fp9u grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5"
          >
            {vm.contacts}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#e6eaee] space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="MuiTypography-root MuiTypography-subtitle1 css-wa9pgr text-xs sm:text-sm font-black text-[#121314] flex items-center gap-1.5">
              <span className="w-6 h-6 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Icon name="credit-card" className="w-3.5 h-3.5" />
              </span>
              <span>카드납 정보</span>
            </h3>
            <button
              className="px-2.5 py-1 rounded-lg bg-[#f4f6f8] hover:bg-slate-200 text-[11px] font-extrabold text-[#121314] flex items-center gap-1"
              onClick={vm.copyPayment}
            >
              <Icon name="copy" className="w-3 h-3 text-primary" /> 카드납 기준
              복사
            </button>
          </div>

          <dl
            id="modalCardPaymentDl"
            className="MuiBox-root css-dpoqzr grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs"
          >
            {vm.payments}
          </dl>

          <span className="MuiTypography-root MuiTypography-caption css-1nt8e0h block text-[11px] font-semibold text-[#8b95a1]">
            상품·계약 시점에 따라 달라질 수 있으니 보험사 담당자에게 확인해
            주세요.
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#e6eaee] space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="MuiTypography-root MuiTypography-subtitle1 css-19pwusq text-xs sm:text-sm font-black text-[#121314] flex items-center gap-1.5">
              <span className="w-6 h-6 rounded-lg bg-sub-soft text-sub flex items-center justify-center">
                <Icon name="monitor-check" className="w-3.5 h-3.5" />
              </span>
              <span>설계사 업무 시스템</span>
            </h3>
            <span
              id="modalUwTimeBadge"
              className="px-2.5 py-0.5 rounded-md bg-sub-soft text-sub text-[11px] font-black"
            >
              {vm.insurer.esign_cutoff_time || "전자서명 마감 정보 준비 중"}
            </span>
          </div>

          <div
            id="modalAgentSystemsGrid"
            className="MuiStack-root css-1ov46kg grid grid-cols-1 lg:grid-cols-2 gap-3"
          >
            {vm.systems}
          </div>

          <span className="MuiTypography-root MuiTypography-caption css-np7jog block text-[11px] font-semibold text-[#8b95a1]">
            브라우저 안내는 보험사 업무 시스템에 대한 정보입니다. 미확인 항목은
            보험사 또는 소속 담당자에게 확인해 주세요.
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#e6eaee] space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-xs sm:text-sm font-black text-[#121314] flex items-center gap-1.5">
              <span className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Icon name="file-check-2" className="w-3.5 h-3.5" />
              </span>
              <span>보험금 청구 세부 기준 & 설계사 실무 메모</span>
            </h3>
            <div className="flex items-center gap-1.5">
              <span
                id="modalClaimLimitBadge"
                className="px-2.5 py-0.5 rounded-md bg-primary-soft text-primary border border-emerald-200 text-[11px] font-black"
              >
                {vm.insurer.claim_copy_limit || "사본 청구 한도 확인 필요"}
              </span>
              <button
                className="px-2.5 py-0.5 rounded-md bg-[#f4f6f8] hover:bg-slate-200 text-[#121314] text-[11px] font-extrabold flex items-center gap-1"
                onClick={vm.copyNotes}
              >
                <Icon name="copy" className="w-3 h-3 text-primary" /> 구비서류
                안내 복사
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
            <div className="lg:col-span-7 p-3 rounded-xl bg-[#f8fafc] border border-[#e6eaee] space-y-2">
              <div id="modalFeatureTags" className="flex flex-wrap gap-1">
                {vm.tags}
              </div>
              <ul
                id="modalClaimRulesList"
                className="space-y-1 text-xs text-[#4e5968] font-medium leading-relaxed"
              >
                {vm.notes}
              </ul>
              <p
                id="modalUwTipText"
                className="text-[11px] text-sub font-bold pt-1 border-t border-[#e6eaee]"
              >
                {vm.insurer.uw_tip || "실무 심사 팁 준비 중입니다."}
              </p>
            </div>
            <div className="lg:col-span-5 p-3 rounded-xl bg-[#fcfdfe] border border-[#e6eaee] flex flex-col justify-between space-y-2">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-black text-[#121314]">
                    📌 내 지점 매니저 / 전산 코드 메모
                  </label>
                  <button
                    className="px-2 py-0.5 rounded bg-primary text-white text-[10px] font-black"
                    onClick={vm.saveMemo}
                    disabled={vm.disabled || !vm.memoChanged}
                  >
                    저장
                  </button>
                </div>
                <textarea
                  id="modalAgentMemoInput"
                  rows="2"
                  placeholder="담당 지점장 연락처, 내 GA/교차 사번 등 메모..."
                  className="w-full p-2 rounded-lg border border-[#d1d6db] focus:border-primary text-xs font-semibold text-[#121314] outline-none resize-none bg-white"
                  value={vm.memo}
                  onChange={(e) => vm.setMemo(e.target.value)}
                  maxLength="1000"
                  disabled={vm.disabled}
                  aria-label="내 지점 매니저 / 전산 코드 메모"
                ></textarea>
              </div>
              <div className="flex items-center gap-1.5">
                <a
                  href="https://youtu.be/-FSahEayni4"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-1.5 px-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-[#92400e] border border-amber-200 text-[10.5px] font-extrabold text-center"
                >
                  📱 모바일팩스 청구 영상
                </a>
                <a
                  href="https://youtu.be/bvClY68_mpI"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-1.5 px-2 rounded-lg bg-sub-soft hover:bg-purple-100 text-sub border border-purple-200 text-[10.5px] font-extrabold text-center"
                >
                  💻 PC 청구 방법 영상
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="MuiPaper-root MuiAccordion-root css-26brsf bg-white rounded-2xl border border-[#e6eaee] overflow-hidden">
          <h3 className="MuiAccordion-heading css-wnfue5 m-0">
            <button
              type="button"
              id="sourceAccordionBtn"
              aria-expanded={vm.sourcesOpen}
              className="MuiButtonBase-root MuiAccordionSummary-root css-1u82dlf w-full px-4 py-3 flex items-center justify-between text-left hover:bg-[#f8fafc] transition-colors"
              onClick={() => vm.setSourcesOpen(!vm.sourcesOpen)}
            >
              <span className="MuiAccordionSummary-content css-vuxf0f flex items-center gap-2">
                <Icon name="file-check" className="w-4 h-4 text-[#8b95a1]" />
                <p className="MuiTypography-root MuiTypography-body2 css-pc1zp text-xs font-black text-[#4e5968]">
                  자료 출처·확인일
                </p>
              </span>
              <Icon
                name="chevron-down"
                className="w-4 h-4 text-[#8b95a1] transition-transform"
              />
            </button>
          </h3>
          <div
            id="sourceAccordionBody"
            className="border-t border-[#f4f6f8] px-4 py-3 bg-[#fcfdfe]"
            hidden={!vm.sourcesOpen}
          >
            <div
              id="modalSourcesList"
              className="MuiStack-root css-pb4y8c grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]"
            >
              {vm.sources}
            </div>
          </div>
        </div>
      </div>

      <div id="insurerDetailFooter"
        className="px-5 sm:px-6 py-3.5 bg-white border-t border-[#e6eaee] flex flex-wrap items-center justify-between gap-2">
        <button
          className="text-xs font-bold text-[#8b95a1] hover:text-[#121314] flex items-center gap-1"
          onClick={vm.reportError}
        >
          <Icon name="flag" className="w-3.5 h-3.5" />
          <span>정보 오류 수정 건의</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            id="insurerDetailClose"
            type="button"
            className="px-4 py-2 rounded-xl border border-[#d1d6db] hover:bg-[#f4f6f8] text-xs font-extrabold text-[#4e5968]"
            onClick={vm.close}
          >
            닫기
          </button>
          <FooterPortalLink
            id="modalFooterLcBtn"
            href={vm.lc?.link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl bg-[#121314] hover:bg-slate-800 text-white text-xs font-extrabold flex items-center gap-1.5"
          >
            <Icon name="user-check" className="w-3.5 h-3.5 text-emerald-400" />
            <span id="modalFooterLcBtnText">{vm.lc?.link.label || "LC 전용 포털"}</span>
          </FooterPortalLink>
          <FooterPortalLink
            id="modalFooterPortalBtn"
            href={vm.portal?.link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="ns-hero-cta px-5 py-2 rounded-xl text-white text-xs font-black flex items-center gap-1.5"
          >
            <Icon name="external-link" className="w-3.5 h-3.5" />
            <span id="modalFooterPortalBtnText">{vm.portal ? `${vm.portal.link.label} 바로가기` : vm.portalLabel}</span>
          </FooterPortalLink>
        </div>
      </div>
    </div>
  );
}
