/* eslint-disable react/prop-types */
// HTML design copied first; data and events are supplied by the controller.
import TemplateIcon from "./TemplateIcon";
export default function SnippetReference({ vm }) {
  return (
    <main className="max-w-[1340px] w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-6 pb-24">
      <div id="viewBoilerplateWorkspace" className="space-y-4">
        {vm.feedback}

        <div className="ns-card p-4 sm:p-5 bg-white flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-primary-soft text-primary border border-emerald-200 text-[11px] font-black">
                BOJOGAETALK SMART BOILERPLATE STUDIO
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-sub-soft text-sub border border-[#ddd6fe] text-[11px] font-extrabold">
                🖥️ 보조개톡 Windows 전용 앱 실시간 동기화
              </span>
            </div>
            <div className="flex items-center gap-3 flex-wrap pt-0.5">
              <h5 className="MuiTypography-root MuiTypography-h5 css-j405rk text-xl sm:text-2xl font-black text-[#121314] tracking-tight">
                카톡 상용구 관리
              </h5>
              <p className="text-xs sm:text-[13.5px] font-semibold text-[#4e5968]">
                웹에서 등록·수정한 상용구는{" "}
                <strong className="text-primary font-extrabold">
                  PC용 [보조개톡 Windows 앱]에 즉시 동기화
                </strong>
                되며, 우측 시뮬레이터에서 치환 결과(
                <code className="px-1.5 py-0.5 rounded bg-sub-soft text-sub font-black">
                  [[[상용구 제목]]]
                </code>
                ,{" "}
                <code className="px-1.5 py-0.5 rounded bg-primary-soft text-primary font-black">
                  [[[이름]]]
                </code>
                )를 미리 테스트할 수 있습니다.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              className="px-3.5 py-2.5 rounded-xl bg-[#f4f6f8] hover:bg-slate-200 text-[#121314] border border-[#e6eaee] text-xs font-extrabold flex items-center gap-1.5 transition-all"
              onClick={vm.openGuide}
            >
              <TemplateIcon name="monitor" className="w-4 h-4 text-sub" />
              <span>보조개톡 Windows 앱 연동 안내</span>
            </button>
            <button
              tabIndex="0"
              type="button"
              className="MuiButtonBase-root MuiButton-root MuiButton-contained MuiButton-containedPrimary css-15diaom ns-hero-cta px-4 py-2.5 rounded-xl text-white text-xs font-black flex items-center gap-1.5 shadow-sm"
              onClick={() => vm.openCreate()}
              disabled={vm.busy || !vm.page}
            >
              <TemplateIcon name="plus-circle" className="w-4 h-4" />
              <span>상용구 등록</span>
            </button>
          </div>
        </div>

        <div className="ns-card p-3.5 sm:p-4 bg-gradient-to-r from-[#ecfdf5] via-white to-[#f5f3ff] border border-[#a7f3d0] grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white/90 border border-[#e6eaee]">
            <span className="w-7 h-7 rounded-xl bg-[#03c75a] text-white font-black text-xs flex items-center justify-center shrink-0">
              1
            </span>
            <div className="text-xs space-y-0.5">
              <div className="font-black text-[#121314]">
                웹에서 상용구 등록 · 편집
              </div>
              <p className="text-[11.5px] font-semibold text-[#4e5968] leading-snug">
                자주 쓰는 리포트 전달, 면책/감액 종료 안내, 청구서류 문구를
                이곳에서 등록합니다.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white/90 border border-[#e6eaee]">
            <span className="w-7 h-7 rounded-xl bg-[#6b38fb] text-white font-black text-xs flex items-center justify-center shrink-0">
              2
            </span>
            <div className="text-xs space-y-0.5">
              <div className="font-black text-[#121314]">
                우측 시뮬레이터로 치환 미리보기
              </div>
              <p className="text-[11.5px] font-semibold text-[#4e5968] leading-snug">
                <code className="text-primary font-bold">[[[이름]]]</code>과{" "}
                <code className="text-sub font-bold">[[[상용구 제목]]]</code>이
                서명과 합쳐져 어떻게 보이는지 웹에서 미리 검증합니다.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#121314] text-white">
            <span className="w-7 h-7 rounded-xl bg-[#fee500] text-[#191600] font-black text-xs flex items-center justify-center shrink-0">
              톡
            </span>
            <div className="text-xs space-y-0.5">
              <div className="font-black text-emerald-400">
                실제 발송은 [보조개톡 Windows 앱]에서!
              </div>
              <p className="text-[11.5px] font-medium text-slate-300 leading-snug">
                PC에 설치된 보조개톡 윈도우 앱을 켜면 이곳에 저장한 상용구가
                자동으로 불러와져 발송됩니다.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div className="lg:col-span-7 space-y-4">
            <div className="ns-card p-3.5 bg-white space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    id="bpCat_ALL"
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${vm.category === "ALL" ? "bg-[#121314] text-white" : "bg-[#f4f6f8] text-[#4e5968] hover:bg-primary-soft"}`}
                    onClick={() => vm.setCategory("ALL")}
                    aria-pressed={vm.category === "ALL"}
                  >
                    전체 (
                    <span id="bpCountAll">{vm.page?.counts?.ALL ?? "—"}</span>)
                  </button>
                  <button
                    type="button"
                    id="bpCat_REPORT"
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${vm.category === "REPORT" ? "bg-[#121314] text-white" : "bg-[#f4f6f8] text-[#4e5968] hover:bg-primary-soft"}`}
                    onClick={() => vm.setCategory("REPORT")}
                    aria-pressed={vm.category === "REPORT"}
                  >
                    📄 리포트·제안 전달
                  </button>
                  <button
                    type="button"
                    id="bpCat_CARE"
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${vm.category === "CARE" ? "bg-[#121314] text-white" : "bg-[#f4f6f8] text-[#4e5968] hover:bg-primary-soft"}`}
                    onClick={() => vm.setCategory("CARE")}
                    aria-pressed={vm.category === "CARE"}
                  >
                    🛡️ 면책·감액·상령일
                  </button>
                  <button
                    type="button"
                    id="bpCat_CLAIM"
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${vm.category === "CLAIM" ? "bg-[#121314] text-white" : "bg-[#f4f6f8] text-[#4e5968] hover:bg-primary-soft"}`}
                    onClick={() => vm.setCategory("CLAIM")}
                    aria-pressed={vm.category === "CLAIM"}
                  >
                    🏥 청구서류·미청구 안내
                  </button>
                  <button
                    type="button"
                    id="bpCat_GREETING"
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${vm.category === "GREETING" ? "bg-[#121314] text-white" : "bg-[#f4f6f8] text-[#4e5968] hover:bg-primary-soft"}`}
                    onClick={() => vm.setCategory("GREETING")}
                    aria-pressed={vm.category === "GREETING"}
                  >
                    🎂 생일·계절 안부
                  </button>
                </div>

                <div className="relative w-full sm:w-56 shrink-0">
                  <TemplateIcon
                    name="search"
                    className="w-3.5 h-3.5 text-primary absolute left-3 top-1/2 -translate-y-1/2"
                  />
                  <input
                    type="text"
                    id="bpSearchInput"
                    placeholder="상용구 제목·본문 검색"
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl border-2 border-[#03c75a] text-xs font-bold text-[#121314] outline-none"
                    value={vm.query}
                    onChange={(e) => vm.setQuery(e.target.value)}
                    aria-label="상용구 제목·본문 검색"
                  />
                </div>
              </div>
            </div>

            {vm.list}

            <div
              id="emptyBoilerplateBox"
              className="ns-card p-12 bg-white text-center space-y-3"
              hidden={!vm.page || vm.page.items.length > 0}
            >
              <div className="w-12 h-12 rounded-2xl bg-primary-soft text-primary flex items-center justify-center mx-auto">
                <TemplateIcon name="message-square-quote" className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-base font-black text-[#121314]">
                  {vm.query || vm.category !== "ALL"
                    ? "해당 조건에 맞는 상용구가 없습니다."
                    : "등록된 상용구가 없습니다."}
                </p>
                <p className="text-xs font-semibold text-[#8b95a1]">
                  보조개톡 Windows 앱에서 불러와 사용할 상용구를 등록해 보세요.
                </p>
              </div>
              <div className="pt-1 flex justify-center gap-2">
                <button
                  type="button"
                  className="ns-hero-cta px-5 py-2.5 rounded-xl text-white text-xs font-black"
                  onClick={() => vm.openCreate()}
                  disabled={vm.busy || !vm.page}
                >
                  + 첫 상용구 등록하기
                </button>
              </div>
            </div>

            <div className="ns-card p-4 bg-white space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <TemplateIcon name="sparkles" className="w-4 h-4 text-sub" />
                  <span className="text-xs font-black text-[#121314]">
                    1초 완성! 상황별 추천 상용구 프리셋
                  </span>
                </div>
                <span className="text-[11px] font-bold text-sub">
                  클릭 시 [상용구 등록] 모달에 자동 입력됩니다
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <button
                  type="button"
                  className="p-3 rounded-xl bg-[#f8fafc] hover:bg-primary-soft/60 border border-[#e6eaee] hover:border-primary text-left transition-all flex items-center justify-between"
                  onClick={() =>
                    vm.openPreset(
                      "리포트전달",
                      "[[[이름]]] 고객님 안녕하세요! 😊\n요청하신 기존 보험 보장분석 및 가성비 리모델링 비교 리포트를 정리해 보내드립니다.\n\n천천히 살펴보시고 궁금하신 점이나 조정하고 싶은 담보가 있으시면 편하게 말씀해 주세요!",
                      "REPORT",
                    )
                  }
                >
                  <div>
                    <div className="font-black text-[#121314]">
                      📄 AI 리포트·제안서 전달 안내
                    </div>
                    <div className="text-[11px] font-semibold text-[#8b95a1] mt-0.5">
                      <code className="text-sub">[[[리포트전달]]]</code> ·
                      고객명 자동치환 포함
                    </div>
                  </div>
                  <span className="px-2 py-1 rounded-lg bg-white border border-[#d1d6db] text-[10.5px] font-black text-primary shrink-0">
                    + 쓰기
                  </span>
                </button>

                <button
                  type="button"
                  className="p-3 rounded-xl bg-[#f8fafc] hover:bg-primary-soft/60 border border-[#e6eaee] hover:border-primary text-left transition-all flex items-center justify-between"
                  onClick={() =>
                    vm.openPreset(
                      "면책종료축하",
                      "[[[이름]]] 고객님! 기쁜 소식 전해드립니다 🎉\n지난번 가입하신 건강보험의 90일 암 면책기간이 오늘부로 무사히 종료되어, 이제부터 100% 정상 보장이 개시되었습니다!\n\n늘 건강하시고 든든한 하루 보내세요 😊",
                      "CARE",
                    )
                  }
                >
                  <div>
                    <div className="font-black text-[#121314]">
                      🛡️ 90일 암 면책기간 종료 축하
                    </div>
                    <div className="text-[11px] font-semibold text-[#8b95a1] mt-0.5">
                      <code className="text-sub">[[[면책종료축하]]]</code> ·
                      내계약 알림 연동용
                    </div>
                  </div>
                  <span className="px-2 py-1 rounded-lg bg-white border border-[#d1d6db] text-[10.5px] font-black text-primary shrink-0">
                    + 쓰기
                  </span>
                </button>

                <button
                  type="button"
                  className="p-3 rounded-xl bg-[#f8fafc] hover:bg-primary-soft/60 border border-[#e6eaee] hover:border-primary text-left transition-all flex items-center justify-between"
                  onClick={() =>
                    vm.openPreset(
                      "상령일안내",
                      "[[[이름]]] 고객님 안녕하세요!\n다가오는 이달 중순은 고객님의 보험나이 1세가 증가하는 [상령일]입니다 📈\n\n상령일 이후에는 동일 보장이라도 월 보험료가 약 5~10% 인상되오니, 부족했던 암 주요치료비나 간병인 담보가 있으시다면 이번 주 내로 미리 점검해 보시는 것을 추천드립니다.",
                      "CARE",
                    )
                  }
                >
                  <div>
                    <div className="font-black text-[#121314]">
                      📈 상령일(보험나이+1세) 도래 안내
                    </div>
                    <div className="text-[11px] font-semibold text-[#8b95a1] mt-0.5">
                      <code className="text-sub">[[[상령일안내]]]</code> ·
                      추가계약 유도용
                    </div>
                  </div>
                  <span className="px-2 py-1 rounded-lg bg-white border border-[#d1d6db] text-[10.5px] font-black text-primary shrink-0">
                    + 쓰기
                  </span>
                </button>

                <button
                  type="button"
                  className="p-3 rounded-xl bg-[#f8fafc] hover:bg-primary-soft/60 border border-[#e6eaee] hover:border-primary text-left transition-all flex items-center justify-between"
                  onClick={() =>
                    vm.openPreset(
                      "청구서류안내",
                      "[[[이름]]] 고객님! 병원 진료 후 보험금 청구 시 아래 서류를 스마트폰 사진으로 찍어 이 카톡방에 보내주시면 빠르게 대행 접수해 드립니다 🏥\n\n1. 진료비 계산서·영수증\n2. 진료비 세부내역서\n3. 처방전 또는 진단코드 확인서 (통원/약제비 청구 시)",
                      "CLAIM",
                    )
                  }
                >
                  <div>
                    <div className="font-black text-[#121314]">
                      🏥 보험금 청구 필요서류 안내
                    </div>
                    <div className="text-[11px] font-semibold text-[#8b95a1] mt-0.5">
                      <code className="text-sub">[[[청구서류안내]]]</code> ·
                      영수증 사진 요청용
                    </div>
                  </div>
                  <span className="px-2 py-1 rounded-lg bg-white border border-[#d1d6db] text-[10.5px] font-black text-primary shrink-0">
                    + 쓰기
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 lg:sticky lg:top-16">
            <div className="ns-card bg-white border border-[#e6eaee] overflow-hidden shadow-md">
              <div className="bg-[#121314] text-white px-4 py-3 flex items-center justify-between border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="relative w-7 h-7 rounded-lg bg-[#26292e] border border-white/15 flex items-center justify-center font-black text-xs text-white">
                    <span>:)</span>
                    <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#fee500] text-[#191600] text-[8px] font-black flex items-center justify-center">
                      톡
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black tracking-tight">
                        보조개톡 (Windows 앱) 화면 시뮬레이터
                      </span>
                      <span className="px-1.5 py-0.2 rounded bg-purple-500/30 text-purple-200 border border-purple-400/40 text-[9.5px] font-black">
                        WEB PREVIEW ONLY
                      </span>
                    </div>
                    <div className="text-[10.5px] text-slate-400">
                      PC 윈도우 앱에서 상용구가 치환·결합되는 모습을 미리
                      테스트합니다
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-4 py-2 bg-[#fffbeb] border-b border-[#fde68a] flex items-center justify-between text-[11px]">
                <span className="font-extrabold text-[#92400e] flex items-center gap-1">
                  <TemplateIcon name="info" className="w-3.5 h-3.5" />
                  <span>
                    웹에서는 <strong>미리보기 시뮬레이션</strong>만 작동하며,
                    실제 발송은 Windows 앱에서 진행됩니다.
                  </span>
                </span>
              </div>

              <div className="p-4 space-y-3 bg-white">
                <div className="flex items-center justify-between bg-[#f8fafc] px-3 py-2 rounded-xl border border-[#e6eaee] text-xs">
                  <span className="font-black text-[#121314] flex items-center gap-1.5">
                    <TemplateIcon
                      name="user-check"
                      className="w-3.5 h-3.5 text-primary"
                    />
                    <span>시뮬레이션 테스트 고객:</span>
                  </span>
                  <select
                    id="simCustomerNameSelect"
                    className="px-2.5 py-1 rounded-lg border border-[#d1d6db] bg-white font-black text-primary text-xs outline-none"
                    value={vm.customerName}
                    onChange={(e) => vm.setCustomerName(e.target.value)}
                    aria-label="미리보기 고객"
                  >
                    <option value="권수경">권수경 고객님</option>
                    <option value="임지현">임지현 팀장님</option>
                    <option value="배상훈">배상훈 지점장님</option>
                    <option value="문승욱">문승욱 고객님</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <div className="text-[11px] font-extrabold text-[#4e5968]">
                    윈도우 앱 치환 변수 버튼 테스트 (클릭 시 아래 에디터에 삽입)
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      className="px-2.5 py-1.5 rounded-xl bg-[#ecfdf5] hover:bg-[#d1fae5] text-[#00913f] border border-[#a7f3d0] text-[11.5px] font-black flex items-center gap-1 transition-colors"
                      onClick={() => vm.insertText("[[[이름]]]")}
                    >
                      <span>[[[이름]]] → 고객 이름</span>
                    </button>
                    <button
                      type="button"
                      className="px-2.5 py-1.5 rounded-xl bg-[#f5f3ff] hover:bg-[#ede9fe] text-[#6b38fb] border border-[#ddd6fe] text-[11.5px] font-black flex items-center gap-1 transition-colors"
                      onClick={vm.insertSelected}
                      disabled={!vm.selectedId}
                    >
                      <span id="purpleChipBtnLabel">
                        [[[상용구 제목]]] → 상용구 본문
                      </span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2 pt-0.5">
                  <div className="flex items-center gap-1.5">
                    <select
                      id="btBoilerplateDropdown"
                      className="flex-1 h-[36px] px-3 rounded-[12px] border-2 border-[#03c75a] bg-[#ecfdf5]/40 text-xs font-black text-[#121314] outline-none"
                      value={vm.selectedId}
                      onChange={(e) => vm.setSelectedId(e.target.value)}
                      aria-label="미리보기 상용구"
                    >
                      <option value="">상용구 선택</option>
                      {vm.options.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.title}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="h-[36px] px-3.5 rounded-[12px] bg-[#121314] hover:bg-primary text-white text-xs font-black shrink-0 transition-colors"
                      onClick={vm.insertSelected}
                      disabled={!vm.selectedId}
                    >
                      넣기 테스트
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <select
                      id="btSigDropdown"
                      className="flex-1 h-[36px] px-3 rounded-[12px] border border-[#d1d6db] bg-[#f8fafc] text-xs font-bold text-[#121314] outline-none"
                      value={vm.signatureId}
                      onChange={(e) => vm.setSignatureId(e.target.value)}
                      aria-label="결합할 서명"
                    >
                      <option value="">서명 없음</option>
                      {vm.signatures.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.title}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="h-[36px] px-3 rounded-[12px] border border-[#d1d6db] hover:border-primary bg-white text-[#121314] text-xs font-extrabold shrink-0 flex items-center gap-1 transition-colors"
                      onClick={() => vm.insertText("😊")}
                    >
                      <span>😊 이모지</span>
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border-2 border-[#e6eaee] focus-within:border-[#03c75a] bg-[#f8fafc] overflow-hidden transition-colors">
                  <div className="px-3.5 py-2 bg-white border-b border-[#f1f5f9] flex items-center justify-between text-[11px]">
                    <span className="font-extrabold text-[#4e5968]">
                      시뮬레이션 입력창 (치환 태그 조합 테스트)
                    </span>
                    <button
                      type="button"
                      className="text-[#8b95a1] hover:text-[#f04452] font-bold"
                      onClick={() => vm.setText("")}
                    >
                      초기화
                    </button>
                  </div>

                  <textarea
                    id="btMainMessageTextarea"
                    rows="4"
                    className="w-full p-3.5 bg-white bp-clean-text text-[13px] outline-none resize-none"
                    value={vm.text}
                    onChange={(e) => vm.setText(e.target.value)}
                    ref={vm.messageRef}
                    maxLength="5000"
                    aria-label="시뮬레이션 입력창"
                  ></textarea>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#ecfdf5]/60 border-2 border-dashed border-[#03c75a] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-md bg-[#03c75a] text-white text-[10px] font-black flex items-center gap-1">
                      <TemplateIcon name="eye" className="w-3 h-3" /> Windows 앱
                      발송 시 최종 치환 결과 미리보기
                    </span>
                    <span
                      id="simTargetBadge"
                      className="text-[11px] font-black text-[#00913f]"
                    >{`대상: ${vm.customerName} 고객님`}</span>
                  </div>
                  <div
                    id="btResolvedFinalBox"
                    className="p-3 rounded-xl bg-white border border-[#a7f3d0] bp-clean-text text-[12.5px]"
                  >
                    {vm.previewBusy
                      ? "미리보기 처리 중…"
                      : vm.previewError ||
                        vm.preview ||
                        "상용구 또는 메시지를 입력해 주세요."}
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-2 pt-1">
                  <button
                    type="button"
                    className="col-span-5 py-2.5 px-3 rounded-xl bg-white hover:bg-[#f4f6f8] border-2 border-[#121314] text-[#121314] text-xs font-black flex items-center justify-center gap-1.5 transition-colors"
                    onClick={vm.copyPreview}
                    disabled={!vm.preview || vm.previewBusy}
                  >
                    <TemplateIcon name="copy" className="w-3.5 h-3.5" />
                    <span>결과 문구 복사</span>
                  </button>
                  <button
                    type="button"
                    className="col-span-7 ns-hero-cta py-2.5 px-3 rounded-xl text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-md"
                    onClick={vm.openGuide}
                  >
                    <TemplateIcon name="monitor" className="w-3.5 h-3.5" />
                    <span>보조개톡 Windows 앱 연동 안내</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
