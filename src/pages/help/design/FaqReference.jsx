/* eslint-disable react/prop-types */
// Markup copied from the FAQ design reference; live answers come from the API.
import Icon from "./FaqIcon";
export default function FaqReference({ vm }) {
  return (
    <main className="MuiBox-root css-carmk4 max-w-[1280px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-24">
      {vm.feedback}
      <div id="viewFaqWorkspace" className="space-y-7">
        <div className="ns-card p-6 sm:p-8 bg-gradient-to-br from-[#121314] via-[#182229] to-[#0f291e] text-white relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center relative z-10">
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="MuiTypography-root MuiTypography-overline css-1pestxu px-3 py-1 rounded-full bg-[#03c75a] text-white text-xs font-black tracking-wide">
                  도움말 센터
                </span>
                <span className="px-3 py-1 rounded-full bg-white/10 text-emerald-300 text-xs font-extrabold flex items-center gap-1.5">
                  <Icon
                    name="sparkles"
                    className="w-3.5 h-3.5 text-emerald-400"
                  />
                  보조개 AI 공식 유튜브(@bojogae-ai) 10개 실전 영상 완벽 연동
                </span>
              </div>

              <div>
                <h1 className="MuiTypography-root MuiTypography-h4 css-u89f7c text-2xl sm:text-4xl font-black tracking-tight text-white">
                  FAQ · 자주 묻는 질문
                </h1>
                <p className="MuiTypography-root MuiTypography-body1 css-96gejc text-xs sm:text-sm font-semibold text-slate-300 mt-2 leading-relaxed">
                  보조개 이용 중 궁금한 내용을 찾아보세요. 아래 보조개 AI
                  유튜브에 등록된 10개 기능별 가이드 영상과 상세 Q&A로 즉시
                  해결하실 수 있습니다.
                </p>
              </div>

              <div className="MuiFormControl-root MuiFormControl-fullWidth MuiTextField-root css-1vbfw84 pt-1">
                <label
                  className="MuiFormLabel-root MuiInputLabel-root css-o03sps sr-only"
                  data-shrink="true"
                  htmlFor=":rp7:"
                  id=":rp7:-label"
                >
                  궁금한 내용을 검색해 보세요
                </label>
                <div className="MuiInputBase-root MuiOutlinedInput-root MuiInputBase-colorPrimary MuiInputBase-fullWidth MuiInputBase-formControl MuiInputBase-adornedStart css-1x1bpw2 relative flex items-center bg-white rounded-2xl border-2 border-[#03c75a] shadow-lg overflow-hidden">
                  <div className="MuiInputAdornment-root MuiInputAdornment-positionStart css-1f6kg7i pl-4 pr-2 text-[#03c75a] flex items-center">
                    <Icon name="search" className="w-5 h-5" />
                  </div>
                  <input
                    aria-invalid="false"
                    id=":rp7:"
                    placeholder="보고서, 꼬막, 결제, 모바일팩스, 미청구 보험금, 고지사항 등 검색"
                    type="search"
                    maxLength="200"
                    className="MuiInputBase-input MuiOutlinedInput-input MuiInputBase-inputAdornedStart css-i0v610 w-full py-3.5 pr-24 text-xs sm:text-sm font-extrabold text-[#121314] outline-none bg-transparent"
                    value={vm.query}
                    onChange={(e) => vm.search(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute right-2.5 px-3 py-1.5 rounded-xl bg-[#121314] hover:bg-primary text-white text-xs font-black transition-colors"
                    onClick={() => vm.search("")}
                  >
                    초기화
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap text-xs">
                <span className="text-slate-400 font-bold mr-1">
                  인기 검색어:
                </span>
                <button
                  type="button"
                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-[#03c75a] text-white font-bold transition-colors"
                  onClick={() => vm.search("모바일")}
                >
                  #모바일팩스 무료
                </button>
                <button
                  type="button"
                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-[#03c75a] text-white font-bold transition-colors"
                  onClick={() => vm.search("미청구")}
                >
                  #미청구 보험금찾기
                </button>
                <button
                  type="button"
                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-[#03c75a] text-white font-bold transition-colors"
                  onClick={() => vm.search("고지사항")}
                >
                  #고지사항 자동추출
                </button>
                <button
                  type="button"
                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-[#03c75a] text-white font-bold transition-colors"
                  onClick={() => vm.search("리모델링")}
                >
                  #리모델링 보고서
                </button>
                <button
                  type="button"
                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-[#03c75a] text-white font-bold transition-colors"
                  onClick={() => vm.search("꼬막")}
                >
                  #꼬막·결제
                </button>
                <button
                  type="button"
                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-[#03c75a] text-white font-bold transition-colors"
                  onClick={() => vm.search("환불")}
                >
                  #오류 꼬막 반환
                </button>
              </div>
            </div>

            <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
              <a
                href="https://www.youtube.com/@bojogae-ai"
                target="_blank"
                rel="noopener noreferrer"
                className="cursor-pointer p-4 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 flex items-center justify-between gap-3 transition-all group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="relative w-12 h-12 rounded-2xl bg-[#2b282c] border-2 border-white/25 flex items-center justify-center shadow-lg shrink-0 group-hover:scale-105 transition-transform">
                    <img
                      src="/bojogae-icon.png"
                      alt="BOJOGAE 로고"
                      className="w-full h-full object-contain rounded-xl p-0.5"
                    />

                    <svg hidden viewBox="0 0 48 48" className="w-10 h-10">
                      <path
                        d="M13 18.5 L18.5 22 L13 25.5"
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth="3.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                      <circle cx="33.5" cy="22" r="2.7" fill="#ffffff" />

                      <circle cx="11" cy="29.5" r="2.8" fill="#ff8a75" />
                      <circle cx="37" cy="29.5" r="2.8" fill="#ff8a75" />

                      <path
                        d="M17.5 30.5 Q24 36 30.5 30.5"
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth="3.2"
                        strokeLinecap="round"
                      />
                    </svg>

                    <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-md bg-[#ff0033] text-white flex items-center justify-center shadow-md border border-white">
                      <Icon
                        name="play"
                        className="w-2.5 h-2.5 fill-current ml-0.5"
                      />
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/25 text-emerald-300 text-[10px] font-black">
                        BOJOGAE OFFICIAL
                      </span>
                      <span className="text-[10.5px] font-mono text-slate-300">
                        @bojogae-ai
                      </span>
                    </div>
                    <div className="text-sm sm:text-base font-black text-white mt-0.5">
                      보조개 AI 공식 유튜브 바로가기
                    </div>
                    <div className="text-[11px] text-slate-300">
                      클릭 시 보조개 공식 유튜브 채널이 새 탭에서 열립니다
                    </div>
                  </div>
                </div>
                <Icon
                  name="external-link"
                  className="w-4 h-4 text-slate-300 group-hover:text-white shrink-0"
                />
              </a>

              <a
                href="https://pf.kakao.com/_xjaxjmX/chat"
                target="_blank"
                rel="noopener noreferrer"
                className="cursor-pointer p-4 rounded-2xl bg-[#fee500] hover:bg-[#fdd800] text-[#191600] flex items-center justify-between gap-3 transition-all shadow-md"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-[#191600] text-[#fee500] flex items-center justify-center shrink-0">
                    <Icon name="message-circle" className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="px-2 py-0.5 rounded bg-[#191600]/10 text-[#191600] text-[10px] font-black">
                      pf.kakao.com/_xjaxjmX/chat
                    </span>
                    <div className="text-sm sm:text-base font-black mt-0.5">
                      카카오톡 채널 1:1 실시간 문의
                    </div>
                    <div className="text-[11px] font-bold opacity-80">
                      클릭 시 보조개 카카오톡 상담창으로 즉시 이동
                    </div>
                  </div>
                </div>
                <Icon name="external-link" className="w-5 h-5 shrink-0" />
              </a>
            </div>
          </div>
        </div>

        <div className="ns-card p-5 sm:p-6 bg-white space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#f1f5f9] pb-4">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-2xl bg-[#2b282c] flex items-center justify-center shrink-0 shadow-xs">
                <img
                  src="/bojogae-icon.png"
                  alt="BOJOGAE"
                  className="w-full h-full object-contain rounded-2xl p-0.5"
                />
                <svg hidden viewBox="0 0 48 48" className="w-8 h-8">
                  <path
                    d="M13 18.5 L18.5 22 L13 25.5"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="33.5" cy="22" r="2.7" fill="#ffffff" />
                  <circle cx="11" cy="29.5" r="2.8" fill="#ff8a75" />
                  <circle cx="37" cy="29.5" r="2.8" fill="#ff8a75" />
                  <path
                    d="M17.5 30.5 Q24 36 30.5 30.5"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base sm:text-lg font-black text-[#121314]">
                    보조개 AI 유튜브 · 기능별 10대 실전 영상 가이드
                  </h2>
                  <a
                    href="https://www.youtube.com/@bojogae-ai"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-0.5 rounded-full bg-primary-soft hover:bg-emerald-100 text-primary border border-emerald-200 text-[11px] font-black flex items-center gap-1"
                  >
                    <span>@bojogae-ai 채널 전체보기 ↗</span>
                  </a>
                </div>
                <p className="text-xs font-semibold text-[#4e5968] mt-0.5">
                  썸네일이나 <strong>[바로 실행]</strong>을 클릭하면 오류 없이{" "}
                  <strong>YouTube 영상이 새 탭에서 즉시 재생</strong>되며,{" "}
                  <strong>[3단계 요약]</strong>을 누르면 핵심 요약을 볼 수
                  있습니다.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                id="ytSortLatest"
                className={`px-3 py-1.5 rounded-xl text-xs font-black ${vm.sort === "latest" ? "bg-[#121314] text-white" : "bg-white text-[#4e5968]"}`}
                onClick={() => vm.setSort("latest")}
                aria-pressed={vm.sort === "latest"}
              >
                기본순
              </button>
              <button
                type="button"
                id="ytSortPopular"
                className={`px-3 py-1.5 rounded-xl text-xs font-black ${vm.sort === "popular" ? "bg-[#121314] text-white" : "bg-white text-[#4e5968]"}`}
                onClick={() => vm.setSort("popular")}
                aria-pressed={vm.sort === "popular"}
              >
                추천순
              </button>
            </div>
          </div>

          <div
            id="youtubeGalleryGrid"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4"
          >
            {vm.videos}
          </div>
        </div>

        <div className="ns-card p-4 sm:p-5 bg-white flex flex-col gap-3.5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div
              className="flex items-center gap-1.5 flex-wrap"
              id="faqCategoryTabs"
            >
              <button
                type="button"
                id="faqCat_ALL"
                className={`px-3.5 py-2 rounded-xl text-xs font-black ${vm.category === "ALL" ? "bg-[#121314] text-white" : "bg-[#f4f6f8] text-[#4e5968]"}`}
                onClick={() => vm.setCategory("ALL")}
                aria-pressed={vm.category === "ALL"}
              >
                전체 질문 {vm.counts.ALL}
              </button>
              <button
                type="button"
                id="faqCat_REPORT"
                className={`px-3.5 py-2 rounded-xl text-xs font-black ${vm.category === "REPORT" ? "bg-[#121314] text-white" : "bg-[#f4f6f8] text-[#4e5968]"}`}
                onClick={() => vm.setCategory("REPORT")}
                aria-pressed={vm.category === "REPORT"}
              >
                📄 보고서 생성·공유 {vm.counts.REPORT}
              </button>
              <button
                type="button"
                id="faqCat_CLAIM"
                className={`px-3.5 py-2 rounded-xl text-xs font-black ${vm.category === "CLAIM" ? "bg-[#121314] text-white" : "bg-[#f4f6f8] text-[#4e5968]"}`}
                onClick={() => vm.setCategory("CLAIM")}
                aria-pressed={vm.category === "CLAIM"}
              >
                📠 보험금 청구·모바일팩스 {vm.counts.CLAIM}
              </button>
              <button
                type="button"
                id="faqCat_KKOMAK"
                className={`px-3.5 py-2 rounded-xl text-xs font-black ${vm.category === "KKOMAK" ? "bg-[#121314] text-white" : "bg-[#f4f6f8] text-[#4e5968]"}`}
                onClick={() => vm.setCategory("KKOMAK")}
                aria-pressed={vm.category === "KKOMAK"}
              >
                🐚 꼬막·요금·환불 {vm.counts.KKOMAK}
              </button>
              <button
                type="button"
                id="faqCat_CRM"
                className={`px-3.5 py-2 rounded-xl text-xs font-black ${vm.category === "CRM" ? "bg-[#121314] text-white" : "bg-[#f4f6f8] text-[#4e5968]"}`}
                onClick={() => vm.setCategory("CRM")}
                aria-pressed={vm.category === "CRM"}
              >
                👥 고객·계약·보조개톡·문의 {vm.counts.CRM}
              </button>
            </div>

            <div className="MuiStack-root css-15uutn0 flex items-center justify-between sm:justify-end gap-3 shrink-0">
              <p
                id="faqCountStatusText"
                className="MuiTypography-root MuiTypography-body2 css-pc1zp text-xs font-black text-primary bg-primary-soft px-3 py-1.5 rounded-xl border border-emerald-200"
                role="status"
                aria-live="polite"
              >
                {vm.status}
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-xl border border-[#d1d6db] hover:border-primary text-xs font-extrabold text-[#121314] bg-white"
                  onClick={() => vm.expandAll(true)}
                >
                  모두 펼치기
                </button>
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-xl border border-[#d1d6db] hover:border-[#121314] text-xs font-extrabold text-[#4e5968] bg-white"
                  onClick={() => vm.expandAll(false)}
                >
                  모두 접기
                </button>
              </div>
            </div>
          </div>
        </div>

        <div
          id="faqAccordionListContainer"
          className="MuiStack-root css-wu34vq space-y-3"
        >
          {vm.answers}
        </div>

        <div className="MuiPaper-root MuiPaper-outlined MuiPaper-rounded css-17rn2vr ns-card p-6 sm:p-7 bg-gradient-to-r from-[#ecfdf5] via-white to-[#f5f3ff] border-2 border-[#03c75a]">
          <div className="MuiStack-root css-16yfybm flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="MuiBox-root css-0 flex items-start sm:items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#2b282c] flex items-center justify-center shrink-0 shadow-md">
                <img
                  src="/bojogae-icon.png"
                  alt="BOJOGAE"
                  className="w-full h-full object-contain rounded-2xl p-1"
                />
                <svg hidden viewBox="0 0 48 48" className="w-11 h-11">
                  <path
                    d="M13 18.5 L18.5 22 L13 25.5"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="33.5" cy="22" r="2.7" fill="#ffffff" />
                  <circle cx="11" cy="29.5" r="2.8" fill="#ff8a75" />
                  <circle cx="37" cy="29.5" r="2.8" fill="#ff8a75" />
                  <path
                    d="M17.5 30.5 Q24 36 30.5 30.5"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="MuiTypography-root MuiTypography-body1 css-10w9sjd text-base sm:text-lg font-black text-[#121314]">
                    찾는 답변이 없으신가요?
                  </p>
                  <span className="px-2.5 py-0.5 rounded-full bg-primary text-white text-[10.5px] font-black">
                    카카오톡 실시간 상담
                  </span>
                </div>
                <p className="MuiTypography-root MuiTypography-body2 css-1ozkr9j text-xs sm:text-sm font-semibold text-[#4e5968]">
                  카카오톡 채널(
                  <span className="font-mono font-bold text-[#121314]">
                    pf.kakao.com/_xjaxjmX/chat
                  </span>
                  )로 문의해 주세요. 이용하신 메뉴와 상황을 남겨주시면 빠르게
                  도와드립니다.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
              <button
                type="button"
                onClick={vm.openContact}
                className="px-4 py-2.5 rounded-xl border border-[#d1d6db] bg-white text-xs font-bold"
              >
                문의 양식 작성·복사
              </button>

              <a
                href="https://pf.kakao.com/_xjaxjmX/chat"
                target="_blank"
                rel="noopener noreferrer"
                data-discover="true"
                className="MuiButtonBase-root MuiButton-root MuiButton-contained MuiButton-containedPrimary MuiButton-sizeMedium css-onp4ut ns-hero-cta px-6 py-3 rounded-xl text-white text-xs sm:text-sm font-black flex items-center gap-2 shadow-md"
              >
                <Icon name="message-circle" className="w-4 h-4" />
                <span>1:1 문의하기</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
