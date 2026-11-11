/* eslint-disable react/prop-types */
// Structure copied from the claim creation reference.
import Icon from "./ClaimIcon";
export default function ClaimReference({ vm }) {
  return (
    <form
      id="claimMainForm"
      className="MuiStack-root css-1orv6po space-y-5 claim-create"
      ref={vm.form}
      onSubmit={(e) => e.preventDefault()}
    >
      <div className="ns-card p-5 sm:p-6 bg-white flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="MuiBox-root css-0 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full bg-primary-soft text-primary border border-emerald-200 text-[11px] font-black">
              ONE-STOP CLAIM GENERATOR
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-sub-soft text-sub text-[11px] font-extrabold">
              {vm.insurers.length}개 보험사 양식 동시 자동완성
            </span>
          </div>
          <h4 className="MuiTypography-root MuiTypography-h4 css-u89f7c text-2xl sm:text-3xl font-black text-[#121314] tracking-tight">
            보험금 청구서 만들기
          </h4>
          <p className="MuiTypography-root MuiTypography-body1 css-14cwalk text-xs sm:text-sm font-semibold text-[#4e5968]">
            공통 정보를 한 번만 입력하면 선택한 여러 보험사별 청구서 PDF를
            동시에 자동 생성합니다.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="px-3.5 py-2 rounded-2xl bg-primary-soft/70 border border-emerald-200 flex items-center gap-2">
            <span className="w-7 h-7 rounded-xl bg-primary text-white flex items-center justify-center">
              <Icon name="smartphone" className="w-4 h-4" />
            </span>
            <div className="text-xs">
              <div className="font-black text-[#121314]">
                다운로드 · 모바일 공유(모바일팩스)
              </div>
              <div className="text-[11px] font-extrabold text-primary">
                무료 (0꼬막)
              </div>
            </div>
          </div>
          <div className="px-3.5 py-2 rounded-2xl bg-[#fffbeb] border border-[#fde68a] flex items-center gap-2">
            <span className="w-7 h-7 rounded-xl bg-amber-500 text-white flex items-center justify-center">
              <Icon name="printer" className="w-4 h-4" />
            </span>
            <div className="text-xs">
              <div className="font-black text-[#121314]">
                PC 다이렉트 웹팩스 발송
              </div>
              <div className="text-[11px] font-extrabold text-[#92400e]">
                보험사별 장수 따라 꼬막 차감 (실패 시 자동반환)
              </div>
            </div>
          </div>
        </div>
      </div>

      {vm.feedback}
      <div
        className="MuiPaper-root MuiPaper-elevation MuiPaper-rounded MuiPaper-elevation0 MuiAlert-root MuiAlert-colorInfo MuiAlert-standardInfo MuiAlert-standard css-1e6coiq ns-card p-4 sm:p-5 bg-white border-l-4 border-l-primary"
        role="alert"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="MuiAlert-icon css-131is6g w-8 h-8 rounded-xl bg-primary-soft text-primary flex items-center justify-center shrink-0 mt-0.5">
              <Icon name="info" className="w-4 h-4" />
            </div>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs sm:text-sm font-black text-[#121314]">
                  청구서 보관 · 마스킹 · 팩스 과금 안내
                </span>
                <span className="px-2 py-0.5 rounded-md bg-primary-soft text-primary text-[11px] font-black">
                  1시간 임시 보관
                </span>
                <span className="px-2 py-0.5 rounded-md bg-sub-soft text-sub text-[11px] font-extrabold">
                  다운로드·공유 무료
                </span>
                <span className="px-2 py-0.5 rounded-md bg-amber-50 text-[#92400e] text-[11px] font-extrabold">
                  발송 실패 시 100% 자동 반환
                </span>
              </div>

              <div className="MuiAlert-message css-127h8j3 text-xs text-[#4e5968] leading-relaxed font-medium">
                다운로드나 공유하기를 누르면 청구내역에 저장하고,{" "}
                <strong>PC 전송용 흑백 통합본</strong>과{" "}
                <strong>모바일 전송용 흑백 분할본</strong>을{" "}
                <strong>1시간 임시 보관</strong>합니다. 청구내역에서 PC는
                다운로드, 모바일은 공유하기를 이용할 수 있습니다. 이후 발송용
                원본은 삭제되고, 마스킹 보관본과 첨부서류는 청구내역에 남습니다.{" "}
                <span className="text-[#f04452] font-bold">
                  첨부서류의 개인정보는 자동 마스킹되지 않습니다.
                </span>{" "}
                팩스 발송 결과는 청구내역의 발송 이력에서 확인할 수 있습니다.
                결과 확인이 필요한 건은 확인 전까지 다시 발송하지 마세요.{" "}
                <strong>다운로드·공유하기는 무료</strong>이며,{" "}
                <strong>
                  실제 팩스 발송은 보험사별 장수에 따라 꼬막이 차감
                </strong>
                됩니다. 최종 발송 실패 시 해당 요금을 반환합니다.
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="MuiStepper-root MuiStepper-horizontal MuiStepper-alternativeLabel css-14fmjab ns-card p-4 sm:p-5 bg-white">
        <div
          className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3"
          id="stepperHeaderContainer"
        >
          {vm.stepper}
        </div>
      </div>

      {vm.step === 0 && (
        <div id="stepPanel1" className="space-y-4">
          <div
            id="noInsurerErrorAlert"
            className="MuiPaper-root MuiAlert-root MuiAlert-standardError css-1ml9mpj flex p-4 rounded-2xl bg-rose-50 border border-rose-200 text-[#f04452] items-center justify-between gap-3"
            role="alert"
            hidden={vm.selected.length > 0}
          >
            <div className="flex items-center gap-2.5">
              <Icon name="alert-circle" className="w-5 h-5 shrink-0" />
              <div className="MuiAlert-message css-127h8j3 text-xs sm:text-sm font-black">
                보험사를 한 곳 이상 선택해 주세요.
              </div>
            </div>
            <button
              type="button"
              className="px-3 py-1.5 rounded-xl bg-[#f04452] text-white text-xs font-black shrink-0"
              onClick={vm.selectPopular}
              disabled={vm.busy}
            >
              KB·삼성·현대 선택
            </button>
          </div>

          <div
            id="selectedInsurersTray"
            className="ns-card p-4 bg-primary-soft/60 border-2 border-primary"
            hidden={vm.selected.length === 0}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-primary text-white flex items-center justify-center">
                  <Icon name="check-check" className="w-3.5 h-3.5" />
                </span>
                <span className="text-xs sm:text-sm font-black text-[#121314]">
                  선택된 청구 대상 보험사
                </span>
                <span
                  id="selectedInsurerCountBadge"
                  className="px-2.5 py-0.5 rounded-full bg-primary text-white text-xs font-black"
                >
                  {vm.selected.length}곳 선택됨
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="px-2.5 py-1 rounded-lg bg-white border border-emerald-300 text-primary text-[11px] font-extrabold hover:bg-emerald-50"
                  onClick={vm.selectPopular}
                  disabled={vm.busy}
                >
                  + 인기 3개사(KB·삼성·현대) 선택
                </button>
                <button
                  type="button"
                  className="px-2.5 py-1 rounded-lg bg-white border border-[#d1d6db] text-[#8b95a1] hover:text-[#f04452] text-[11px] font-bold"
                  onClick={vm.clear}
                  disabled={vm.busy}
                >
                  전체 해제
                </button>
              </div>
            </div>
            <div
              id="selectedInsurerChipsBox"
              className="selected-insurer-tray flex flex-wrap gap-1.5"
            >
              {vm.chips}
            </div>
          </div>

          <div className="MuiPaper-root MuiPaper-outlined MuiPaper-rounded css-1vto3e6 ns-card p-5 sm:p-6 bg-white">
            <div
              className="MuiStack-root css-1ov46kg space-y-5"
              role="group"
              aria-label="청구할 보험사"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-[#e6eaee]">
                <div>
                  <h6 className="MuiTypography-root MuiTypography-h6 css-1o0hktf text-base sm:text-lg font-black text-[#121314]">
                    청구할 보험사를 선택해 주세요
                  </h6>
                  <p className="MuiTypography-root MuiTypography-body2 css-pc1zp text-xs font-semibold text-[#8b95a1] mt-0.5">
                    확인된 {vm.insurers.length}개 양식을 지원합니다. 여러
                    보험사를 함께 선택해 한 번에 청구서를 만들 수 있습니다.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center bg-[#f4f6f8] p-1 rounded-xl border border-[#e6eaee]">
                    <button
                      type="button"
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold ${vm.sector === "ALL" ? "bg-[#121314] text-white" : "text-[#4e5968]"}`}
                      onClick={() => vm.setSector("ALL")}
                      aria-pressed={vm.sector === "ALL"}
                    >
                      전체 ({vm.count("ALL")})
                    </button>
                    <button
                      type="button"
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold ${vm.sector === "DAMAGE" ? "bg-[#121314] text-white" : "text-[#4e5968]"}`}
                      onClick={() => vm.setSector("DAMAGE")}
                      aria-pressed={vm.sector === "DAMAGE"}
                    >
                      손해보험·공제 ({vm.count("DAMAGE")})
                    </button>
                    <button
                      type="button"
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold ${vm.sector === "LIFE" ? "bg-[#121314] text-white" : "text-[#4e5968]"}`}
                      onClick={() => vm.setSector("LIFE")}
                      aria-pressed={vm.sector === "LIFE"}
                    >
                      생명보험 ({vm.count("LIFE")})
                    </button>
                  </div>

                  <div className="ns-search-bar flex items-center rounded-xl px-3 py-1.5 w-full sm:w-64">
                    <Icon
                      name="search"
                      className="w-4 h-4 text-primary mr-2 shrink-0"
                    />
                    <input
                      type="text"
                      id="claimInsurerSearchInput"
                      placeholder="보험사명 빠른 검색 (예: KB, 삼성, 라이나)"
                      className="w-full text-xs font-bold text-[#121314] placeholder:text-[#8b95a1] outline-none bg-transparent"
                      value={vm.query}
                      onChange={(e) => vm.setQuery(e.target.value)}
                      aria-label="보험사명 빠른 검색"
                    />
                    <button
                      type="button"
                      className="text-[#8b95a1] hover:text-[#121314]"
                      onClick={() => vm.setQuery("")}
                      aria-label="보험사 검색 초기화"
                    >
                      <Icon name="x" className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              <div
                id="nonLifeSectionWrap"
                className="MuiBox-root css-0 space-y-3"
                hidden={vm.sector === "LIFE"}
              >
                <div className="flex items-center justify-between">
                  <p className="MuiTypography-root MuiTypography-body1 css-d0hz46 text-sm font-black text-[#121314] flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary"></span>
                    <span>손해보험·공제</span>
                    <span className="px-2 py-0.5 rounded-full bg-primary-soft text-primary text-[11px] font-black">
                      {vm.count("DAMAGE")}개 기관
                    </span>
                  </p>
                  <span className="text-[11px] font-bold text-[#8b95a1]">
                    보험사별 공식 청구 양식 지원
                  </span>
                </div>
                <div
                  id="nonLifeGridContainer"
                  className="MuiGrid-root MuiGrid-container MuiGrid-spacing-xs-1 css-1l2r9m5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5"
                >
                  {vm.insurerCards("DAMAGE")}
                </div>
              </div>

              <div
                id="lifeSectionWrap"
                className="MuiBox-root css-0 space-y-3 pt-2"
                hidden={vm.sector === "DAMAGE"}
              >
                <div className="flex items-center justify-between">
                  <p className="MuiTypography-root MuiTypography-body1 css-d0hz46 text-sm font-black text-[#121314] flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-sub"></span>
                    <span>생명보험</span>
                    <span className="px-2 py-0.5 rounded-full bg-sub-soft text-sub text-[11px] font-black">
                      {vm.count("LIFE")}개 기관
                    </span>
                  </p>
                </div>
                <div
                  id="lifeGridContainer"
                  className="MuiGrid-root MuiGrid-container MuiGrid-spacing-xs-1 css-1l2r9m5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5"
                >
                  {vm.insurerCards("LIFE")}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {vm.step === 1 && (
        <div id="stepPanel2" className="space-y-4">
          <div className="ns-card p-5 sm:p-6 bg-white space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-[#e6eaee]">
              <div>
                <span className="px-2.5 py-0.5 rounded-md bg-primary-soft text-primary text-[11px] font-black">
                  STEP 2 OF 4
                </span>
                <h5 className="text-lg font-black text-[#121314] mt-1">
                  피보험자(치료받은 분) 인적사항 및 자필 전자서명
                </h5>
                <p className="text-xs font-semibold text-[#8b95a1]">
                  선택한 보험사들의 청구서 양식에 공통으로 자동 기입됩니다.
                </p>
              </div>
              <button
                type="button"
                className="px-3.5 py-2 rounded-xl bg-sub-soft hover:bg-purple-100 text-sub border border-purple-200 text-xs font-black flex items-center gap-1.5"
                onClick={vm.openCustomer}
                disabled={vm.busy}
              >
                <Icon name="user-check" className="w-4 h-4" />
                <span>내 고객 정보 자동채우기</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-7 space-y-4">{vm.partyFields}</div>

              <div className="lg:col-span-5 p-4 rounded-2xl bg-[#fcfdfe] border border-[#e6eaee] space-y-3">
                {vm.signature}
                <p className="text-xs text-[#8b95a1]">
                  서명은 각 보험사 청구서의 서명란에 반영됩니다. 직접 서명하거나
                  이미지를 업로드해 주세요.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {vm.step === 2 && (
        <div id="stepPanel3" className="space-y-4">
          <div className="ns-card p-5 sm:p-6 bg-white space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-[#e6eaee]">
              <div>
                <span className="px-2.5 py-0.5 rounded-md bg-primary-soft text-primary text-[11px] font-black">
                  STEP 3 OF 4
                </span>
                <h5 className="text-lg font-black text-[#121314] mt-1">
                  사고(진료) 내역 · 보험금 수령 계좌 · 병원 서류 첨부
                </h5>
                <p className="text-xs font-semibold text-[#8b95a1]">
                  영수증/세부내역서 사진이나 PDF를 첨부하면 각 보험사 청구서
                  뒤에 자동으로 병합됩니다.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-6 space-y-4">{vm.accidentFields}</div>

              <div className="lg:col-span-6 p-4 rounded-2xl bg-[#fcfdfe] border border-[#e6eaee] space-y-3">
                {vm.attachments}
              </div>
            </div>
          </div>
        </div>
      )}

      {vm.step === 3 && (
        <div id="stepPanel4" className="space-y-4">
          <div className="ns-card p-5 sm:p-6 bg-white space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#e6eaee]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-primary text-white text-[11px] font-black">
                    STEP 4 OF 4
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md bg-amber-50 text-[#92400e] border border-amber-200 text-[11px] font-extrabold">
                    다운로드·공유 저장 후 원본 1시간 보관
                  </span>
                </div>
                <h5 className="text-lg sm:text-xl font-black text-[#121314] mt-1">
                  보험사별 청구서 PDF 생성 완료 — 확인 및 발송 방식을 선택하세요
                </h5>
                <p className="text-xs font-semibold text-[#4e5968]">
                  생성된 PDF를 확인해 주세요. 다운로드·공유 시 전송용 흑백
                  파일을 준비합니다.
                </p>
              </div>

              <div className="flex items-center gap-2">{vm.downloadAll}</div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
              <div
                className="lg:col-span-7 space-y-3"
                id="step4GeneratedCardsList"
              >
                {vm.generatedActions}
              </div>

              <div className="lg:col-span-5 flex flex-col gap-3">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-[#ecfdf5] via-white to-[#f5f3ff] border-2 border-[#03c75a] shadow-xs space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-xl bg-[#03c75a] text-white flex items-center justify-center shrink-0 shadow-2xs">
                        <Icon name="smartphone" className="w-4 h-4" />
                      </span>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-black text-[#121314]">
                            모바일팩스 무료 발송 꿀팁
                          </span>
                          <span className="px-2 py-0.2 rounded-full bg-[#03c75a] text-white text-[10px] font-black">
                            꼬막 차감 0 · 무료
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs font-bold text-[#4e5968] leading-relaxed">
                    스마트폰(모바일)으로 보조개에 접속해{" "}
                    <strong className="text-[#121314] underline decoration-[#03c75a] decoration-2">
                      [보험금 청구 &gt; 청구내역]
                    </strong>
                    으로 이동한 뒤,{" "}
                    <strong className="text-primary">[공유하기]</strong>를 눌러{" "}
                    <strong>‘모바일팩스’ 앱</strong>으로 전송하면{" "}
                    <strong className="text-primary">
                      꼬막 차감 없이 100% 무료로 팩스 발송
                    </strong>
                    이 가능합니다!
                  </p>

                  <a
                    href="https://youtu.be/-FSahEayni4"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-3.5 rounded-xl bg-[#121314] hover:bg-[#f04452] text-white text-xs font-black flex items-center justify-between gap-2 transition-all shadow-xs group"
                  >
                    <span className="flex items-center gap-2 truncate">
                      <span className="w-5 h-5 rounded-md bg-[#f04452] group-hover:bg-white group-hover:text-[#f04452] text-white flex items-center justify-center shrink-0 transition-colors">
                        <Icon name="play" className="w-3 h-3 fill-current" />
                      </span>
                      <span className="truncate">
                        [보조개AI 유튜브] 모바일에서 무료 팩스 보내기 영상 보기
                      </span>
                    </span>
                    <Icon
                      name="external-link"
                      className="w-3.5 h-3.5 shrink-0 opacity-80"
                    />
                  </a>
                </div>

                <div className="claim-preview p-4 rounded-2xl bg-[#1e293b] text-white flex-1 flex flex-col space-y-3">
                  <h3 className="text-xs font-black text-emerald-400">
                    보험금 청구서 A4 흑백 통합본 미리보기
                  </h3>
                  {vm.previews}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="MuiStack-root css-1w57jtv ns-card p-4 bg-white/95 backdrop-blur-md border border-[#e6eaee] sticky bottom-4 z-10 flex items-center justify-between gap-3 shadow-xl">
        {vm.footer}
      </div>
    </form>
  );
}
