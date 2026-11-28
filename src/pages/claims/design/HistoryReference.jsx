/* eslint-disable react/prop-types */
// Markup copied from the claim history reference.
import MobileCollapsibleInfo from "@/components/MobileCollapsibleInfo";

import Icon from "./ClaimIcon";
export default function HistoryReference({ vm }) {
  return (
    <div
      id="viewHistoryWorkspace"
      className="MuiStack-root css-1ov46kg space-y-5"
    >
      <MobileCollapsibleInfo
        title="청구내역"
        badge="안내·무료팩스"
        sx={{ mb: 0 }}
        action={(
          <button
            type="button"
            className="ns-hero-cta px-2.5 py-1.5 rounded-full text-white text-[11px] font-black flex items-center gap-1"
            onClick={vm.create}
            disabled={vm.busy}
          >
            <Icon name="plus-circle" className="w-3.5 h-3.5" />
            <span>새 청구서</span>
          </button>
        )}
      >
        <div className="space-y-4">
          <div className="ns-card p-5 sm:p-6 bg-white flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-primary-soft text-primary border border-emerald-200 text-[11px] font-black">
                  CLAIM ARCHIVE & FAX DISPATCH
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-sub-soft text-sub text-[11px] font-extrabold">
                  청구서 보관함
                </span>
              </div>
              <div className="MuiStack-root css-95g4uk flex items-center gap-3 flex-wrap">
                <h4 className="MuiTypography-root MuiTypography-h4 css-u89f7c text-2xl sm:text-3xl font-black text-[#121314] tracking-tight">
                  청구내역
                </h4>
                <span className="text-xs font-bold text-[#8b95a1]">
                  생성한 보험금 청구서 다운로드 · 모바일 무료 팩스 공유 · 발송 이력
                  관리
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                tabIndex="0"
                type="button"
                className="MuiButtonBase-root MuiButton-root MuiButton-text MuiButton-textPrimary MuiButton-sizeMedium css-1t2wubw px-4 py-2.5 rounded-xl border border-[#d1d6db] hover:border-primary hover:bg-primary-soft/50 text-xs font-extrabold text-[#121314] flex items-center gap-1.5 transition-all"
                onClick={vm.refresh}
                disabled={vm.busy}
              >
                <Icon name="refresh-cw" className="w-3.5 h-3.5 text-primary" />
                <span>새로고침</span>
              </button>
              <button
                type="button"
                className="ns-hero-cta px-4 py-2.5 rounded-xl text-white text-xs font-black flex items-center gap-1.5"
                onClick={vm.create}
                disabled={vm.busy}
              >
                <Icon name="plus-circle" className="w-4 h-4" />
                <span>+ 새 보험금 청구서 만들기</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
            <div
              className="lg:col-span-7 MuiPaper-root MuiAlert-root MuiAlert-standardInfo css-1e6coiq ns-card p-4 sm:p-5 bg-white border-l-4 border-l-primary flex flex-col justify-between"
              role="alert"
            >
              <div className="flex items-start gap-3">
                <div className="MuiAlert-icon css-131is6g w-8 h-8 rounded-xl bg-primary-soft text-primary flex items-center justify-center shrink-0 mt-0.5">
                  <Icon name="clock" className="w-4 h-4" />
                </div>
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs sm:text-sm font-black text-[#121314]">
                      흑백 PDF 다운로드·공유
                    </span>
                    <span className="px-2 py-0.5 rounded bg-primary-soft text-primary text-[10.5px] font-black">
                      기간 제한 없이 보관
                    </span>
                  </div>
                  <div className="MuiAlert-message css-127h8j3 text-xs text-[#4e5968] leading-relaxed font-medium">
                    다운로드·공유 파일은 주민등록번호와 서명을 포함한 흑백 PDF입니다.
                    PC 통합본 다운로드와
                    모바일 8MB 미만 분할본 공유를 이용할 수 있습니다.
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-[#f4f6f8] flex flex-wrap items-center justify-between gap-2 text-[11px]">
                <span className="font-bold text-[#8b95a1]">
                  💡 <strong>[상세 보기 · 같은 내용으로 작성]</strong>을
                  누르면 저장된 인적사항·서명·첨부서류를 불러와 새 청구서를 작성할 수 있습니다.
                </span>
              </div>
            </div>

            <div className="lg:col-span-5 ns-card p-4 sm:p-5 bg-gradient-to-br from-[#ecfdf5] via-white to-[#f5f3ff] border-2 border-[#03c75a] flex flex-col justify-between gap-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-xs font-black text-[#121314]">
                    <span className="w-6 h-6 rounded-lg bg-[#03c75a] text-white flex items-center justify-center">
                      <Icon name="smartphone" className="w-3.5 h-3.5" />
                    </span>
                    <span>모바일에서 [공유하기]로 무료 팩스 보내기</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#03c75a] text-white text-[10px] font-black">
                    꼬막 차감 0 · 무료
                  </span>
                </div>
                <p className="text-xs font-bold text-[#4e5968] leading-relaxed">
                  스마트폰으로 이 페이지(<strong>청구내역</strong>)에 접속해{" "}
                  <strong>[팩스번호 복사]</strong> 후{" "}
                  <strong>[모바일 분할본 공유]</strong>를 눌러{" "}
                  <strong>‘모바일팩스’ 앱</strong>으로 보내면 꼬막 차감 없이 무료
                  발송됩니다!
                </p>
              </div>

              <a
                href="https://youtu.be/-FSahEayni4"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-3.5 rounded-xl bg-[#121314] hover:bg-[#f04452] text-white text-xs font-black flex items-center justify-between gap-2 transition-all group"
              >
                <span className="flex items-center gap-2 truncate">
                  <span className="w-5 h-5 rounded-md bg-[#f04452] group-hover:bg-white group-hover:text-[#f04452] text-white flex items-center justify-center shrink-0">
                    <Icon name="play" className="w-3 h-3 fill-current" />
                  </span>
                  <span className="truncate">
                    [보조개AI 유튜브] 모바일 무료 팩스 발송 영상 보기
                  </span>
                </span>
                <Icon name="external-link" className="w-3.5 h-3.5 shrink-0" />
              </a>
            </div>
          </div>
        </div>
      </MobileCollapsibleInfo>

      <div className="ns-card p-4 bg-white flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 ${vm.status === "all" ? "bg-[#121314] text-white" : "bg-[#f4f6f8] text-[#4e5968]"}`}
            onClick={() => vm.setStatus("all")}
            aria-pressed={vm.status === "all"}
          >
            <span>전체 내역</span>
            <span
              id="badgeCountAll"
              className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]"
            >
              {vm.counts?.all ?? "—"}
            </span>
          </button>
          <button
            className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 ${vm.status === "active1h" ? "bg-[#121314] text-white" : "bg-[#f4f6f8] text-[#4e5968]"}`}
            onClick={() => vm.setStatus("active1h")}
            aria-pressed={vm.status === "active1h"}
          >
            <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
            <span>청구서 보관</span>
            <span
              id="badgeCountActive"
              className="px-1.5 py-0.2 rounded-full bg-primary text-white text-[10px]"
            >
              {vm.counts?.active1h ?? "—"}
            </span>
          </button>
          <button
            className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 ${vm.status === "success" ? "bg-[#121314] text-white" : "bg-[#f4f6f8] text-[#4e5968]"}`}
            onClick={() => vm.setStatus("success")}
            aria-pressed={vm.status === "success"}
          >
            <span>팩스 발송 성공</span>
            <span
              id="badgeCountSuccess"
              className="px-1.5 py-0.2 rounded-full bg-black/10 text-[10px]"
            >
              {vm.counts?.success ?? "—"}
            </span>
          </button>
          <button
            className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 ${vm.status === "saved" ? "bg-[#121314] text-white" : "bg-[#f4f6f8] text-[#4e5968]"}`}
            onClick={() => vm.setStatus("saved")}
            aria-pressed={vm.status === "saved"}
          >
            <span>파일 저장 · 미전송</span>
            <span
              id="badgeCountSaved"
              className="px-1.5 py-0.2 rounded-full bg-black/10 text-[10px]"
            >
              {vm.counts?.saved ?? "—"}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="ns-search-bar flex-1 sm:w-80 flex items-center rounded-xl px-3.5 py-2">
            <Icon
              name="search"
              className="w-4 h-4 text-primary mr-2 shrink-0"
            />
            <input
              type="text"
              id="historySearchInput"
              placeholder="고객명, 보험사명, 사고일, 팩스번호 검색"
              className="w-full text-xs font-bold text-[#121314] placeholder:text-[#8b95a1] outline-none bg-transparent"
              value={vm.query}
              onChange={(e) => vm.setQuery(e.target.value)}
              maxLength="200"
              aria-label="고객명·보험사·사고일·팩스번호 검색"
            />
            <button
              className="text-[#8b95a1] hover:text-[#121314]"
              onClick={() => vm.setQuery("")}
              aria-label="검색 초기화"
            >
              <Icon name="x" className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {vm.feedback}
      <div id="claimHistoryListContainer" className="space-y-3.5">
        {vm.cards}
      </div>

      {vm.pagination}
    </div>
  );
}
