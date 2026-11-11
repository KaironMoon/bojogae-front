/* eslint-disable react/prop-types */
// Structure copied from the signature HTML reference.
import TemplateIcon from "./TemplateIcon";
export default function SignatureReference({ vm }) {
  return (
    <main className="max-w-[1340px] w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-6 pb-24">
      <div id="viewSignatureWorkspace" className="space-y-4">
        {vm.feedback}

        <div className="ns-card p-4 sm:p-5 bg-white flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-primary-soft text-primary border border-emerald-200 text-[11px] font-black">
                BOJOGAETALK AUTO-SIGNATURE STUDIO
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-sub-soft text-sub border border-[#ddd6fe] text-[11px] font-extrabold">
                💬 보조개톡 발송 시 메시지 끝부분 자동 결합
              </span>
            </div>
            <div className="flex items-center gap-3 flex-wrap pt-0.5">
              <h5 className="MuiTypography-root MuiTypography-h5 css-j405rk text-xl sm:text-2xl font-black text-[#121314] tracking-tight">
                카톡 서명 관리
              </h5>
              <p className="text-xs sm:text-[13.5px] font-semibold text-[#4e5968]">
                보조개톡 우측 메시지 작성 패널에서 선택하여{" "}
                <strong className="text-primary font-extrabold">
                  발송 문구 맨 끝에 자동으로 붙이는 꼬리말(명함·연락처·인사말)
                </strong>
                을 관리합니다.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              tabIndex="0"
              type="button"
              className="MuiButtonBase-root MuiButton-root MuiButton-contained MuiButton-containedPrimary css-15diaom ns-hero-cta px-4 py-2.5 rounded-xl text-white text-xs font-black flex items-center gap-1.5 shadow-sm"
              onClick={() => vm.openCreate()}
              disabled={vm.busy || !vm.page}
            >
              <TemplateIcon name="plus-circle" className="w-4 h-4" />
              <span>서명 등록</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div className="lg:col-span-7 space-y-4">
            <div className="ns-card p-3.5 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-[#121314]">
                  등록된 내 서명 목록
                </span>
                <span
                  id="sigCountBadge"
                  className="px-2 py-0.5 rounded-full bg-primary-soft text-primary text-xs font-black"
                >{`${vm.page?.counts?.ALL ?? "—"}개`}</span>
                <span className="text-[11px] font-semibold text-[#8b95a1] hidden sm:inline">
                  · 카드를 클릭하면 우측 보조개톡 메시지 작성창 하단에 즉시
                  결합됩니다
                </span>
              </div>

              <div className="relative w-full sm:w-60">
                <TemplateIcon
                  name="search"
                  className="w-3.5 h-3.5 text-primary absolute left-3 top-1/2 -translate-y-1/2"
                />
                <input
                  type="text"
                  id="sigSearchInput"
                  placeholder="서명 제목 또는 본문 검색"
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border-2 border-[#03c75a] text-xs font-bold text-[#121314] outline-none"
                  value={vm.query}
                  onChange={(e) => vm.setQuery(e.target.value)}
                  aria-label="서명 제목·본문 검색"
                />
              </div>
            </div>

            {vm.list}

            <div
              id="emptySignatureBox"
              className="ns-card p-12 bg-white text-center space-y-3"
              hidden={!vm.page || vm.page.items.length > 0}
            >
              <div className="w-12 h-12 rounded-2xl bg-primary-soft text-primary flex items-center justify-center mx-auto">
                <TemplateIcon name="pen-tool" className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-base font-black text-[#121314]">
                  등록된 서명이 없습니다.
                </p>
                <p className="text-xs font-semibold text-[#8b95a1]">
                  보조개톡 메시지 발송 시 끝에 자동으로 붙일 나만의 서명을
                  등록해 보세요.
                </p>
              </div>
              <div className="pt-1 flex justify-center gap-2">
                <button
                  type="button"
                  className="ns-hero-cta px-5 py-2.5 rounded-xl text-white text-xs font-black"
                  onClick={() => vm.openCreate()}
                  disabled={vm.busy || !vm.page}
                >
                  + 첫 서명 등록하기
                </button>
              </div>
            </div>

            <div className="ns-card p-4 bg-white space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <TemplateIcon name="sparkles" className="w-4 h-4 text-sub" />
                  <span className="text-xs font-black text-[#121314]">
                    1초 완성! 추천 서명 프리셋
                  </span>
                </div>
                <span className="text-[11px] font-bold text-sub">
                  클릭 시 [서명 등록] 모달에 자동 입력됩니다
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <button
                  type="button"
                  className="p-3 rounded-xl bg-[#f8fafc] hover:bg-primary-soft/60 border border-[#e6eaee] hover:border-primary text-left transition-all flex items-center justify-between"
                  onClick={() =>
                    vm.openPreset(
                      "현대홈쇼핑",
                      "──────────────\n🏢 현대홈쇼핑 GA 강대한지점\n👩‍💼 담당 컨설턴트: 김성춘 팀장\n📞 직통 문의: 010-9729-9649\n💬 언제든 편하게 카톡 남겨주세요!",
                    )
                  }
                >
                  <div>
                    <div className="font-black text-[#121314]">
                      🪪 표준 명함·연락처형
                    </div>
                    <div className="text-[11px] font-semibold text-[#8b95a1] mt-0.5">
                      소속 GA · 지점 · 이름 · 전화번호
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
                      "보험금 청구·케어 전용",
                      "──────────────\n🏥 5년치 숨은 미청구 보험금 찾기 & 청구 대행\n📑 진료비영수증·세부내역서 사진만 찍어 보내주세요!\n👩‍💼 현대홈쇼핑 GA 김성춘 (☎ 010-9729-9649)",
                    )
                  }
                >
                  <div>
                    <div className="font-black text-[#121314]">
                      🏥 보험금 청구·케어 유도형
                    </div>
                    <div className="text-[11px] font-semibold text-[#8b95a1] mt-0.5">
                      영수증 사진 접수 및 미청구 안내
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
                      "생일·면책종료 감성 안부형",
                      "──────────────\n🍀 고객님의 건강과 행복한 일상을 늘 응원합니다.\n보장 관련 궁금하신 점은 언제든 연락 주세요 😊\n- 내 손안의 보험비서 김성춘 드림 (010-9729-9649) -",
                    )
                  }
                >
                  <div>
                    <div className="font-black text-[#121314]">
                      🍀 생일·면책종료 감성 안부형
                    </div>
                    <div className="text-[11px] font-semibold text-[#8b95a1] mt-0.5">
                      따뜻한 인사말 + 한 줄 연락처
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
                      "기존고객 안내·배려형",
                      "──────────────\n🏢 현대홈쇼핑 GA 강대한지점 김성춘 (010-9729-9649)\n※ 본 메시지는 기존 상담 고객님께 발송되는 안내톡입니다.\n(안내를 원치 않으시면 언제든 말씀해 주세요)",
                    )
                  }
                >
                  <div>
                    <div className="font-black text-[#121314]">
                      🛡️ 기존고객 배려·준법 안내형
                    </div>
                    <div className="text-[11px] font-semibold text-[#8b95a1] mt-0.5">
                      리터치 발송 시 민원 예방 문구
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
                <div className="flex items-center gap-2">
                  <div className="relative w-7 h-7 rounded-lg bg-[#26292e] border border-white/15 flex items-center justify-center font-black text-xs text-white">
                    <span>:)</span>
                    <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#fee500] text-[#191600] text-[8px] font-black flex items-center justify-center">
                      톡
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black tracking-tight">
                        보조개톡
                      </span>
                      <span className="px-1.5 py-0.2 rounded bg-[#03c75a]/20 text-emerald-300 border border-emerald-400/30 text-[9px] font-black">
                        KAKAO AUTO SENDER
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      우측 3열 패널: 메시지 작성 및 서명 자동 결합 미리보기
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-full bg-[#fffbeb] text-[#92400e] border border-[#fde68a] text-[10px] font-black">
                    {vm.balance == null
                      ? "🐚 잔액 조회 불가"
                      : `🐚 꼬막 ${vm.balance.toLocaleString("ko-KR")}`}
                  </span>
                </div>
              </div>

              <div className="p-4 space-y-3 bg-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <TemplateIcon
                      name="message-square-text"
                      className="w-4 h-4 text-primary"
                    />
                    <span className="text-xs font-black text-[#121314]">
                      메시지 작성 · 서명 결합 시뮬레이터
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-[#8b95a1]">
                    WEB PREVIEW ONLY
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="text-[11px] font-extrabold text-[#4e5968]">
                    치환 변수 원클릭 삽입 (클릭 시 커서 위치에 삽입)
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
                      <span>[[[상용구 제목]]] → 상용구 본문</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2 pt-0.5">
                  <div className="flex items-center gap-1.5">
                    <select
                      id="btBoilerplateSelect"
                      className="flex-1 h-[36px] px-3 rounded-[12px] border border-[#d1d6db] focus:border-primary bg-[#f8fafc] text-xs font-bold text-[#121314] outline-none"
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
                      넣기
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <div className="relative flex-1">
                      <select
                        id="btSignatureSelect"
                        className="w-full h-[36px] px-3 rounded-[12px] border-2 border-[#03c75a] bg-[#ecfdf5]/40 text-xs font-black text-[#121314] outline-none"
                        value={vm.signatureId}
                        onChange={(e) => vm.setSignatureId(e.target.value)}
                        aria-label="미리보기 서명"
                      >
                        <option value="">서명 없음</option>
                        {vm.signatures.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.title}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      className="h-[36px] px-3 rounded-[12px] border border-[#d1d6db] hover:border-primary bg-white text-[#121314] text-xs font-extrabold shrink-0 flex items-center gap-1 transition-colors"
                      onClick={() => vm.insertText("😊")}
                    >
                      <span>😊 이모지 삽입</span>
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border-2 border-[#e6eaee] focus-within:border-[#03c75a] bg-[#f8fafc] overflow-hidden transition-colors">
                  <div className="px-3.5 py-2 bg-white border-b border-[#f1f5f9] flex items-center justify-between text-[11px]">
                    <span className="font-extrabold text-[#4e5968]">
                      메시지 본문 입력칸
                    </span>
                    <span className="font-bold text-sub">
                      발송 시 아래 [서명]이 끝에 자동 결합됨
                    </span>
                  </div>

                  <textarea
                    id="btMessageEditor"
                    rows="4"
                    className="w-full p-3.5 bg-white text-[13px] leading-relaxed font-semibold text-[#121314] outline-none resize-none"
                    value={vm.text}
                    onChange={(e) => vm.setText(e.target.value)}
                    ref={vm.messageRef}
                    maxLength="5000"
                    aria-label="시뮬레이션 입력창"
                  ></textarea>

                  <div
                    id="btSignatureAttachedBox"
                    className="p-3.5 bg-[#ecfdf5]/70 border-t-2 border-dashed border-[#03c75a]"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-[#03c75a] text-white text-[10px] font-black flex items-center gap-1">
                        <TemplateIcon name="link" className="w-3 h-3" /> 발송 시
                        본문 끝에 자동 부착되는 서명
                      </span>
                      <span
                        id="btAttachedSigTitle"
                        className="text-[11px] font-black text-[#00913f]"
                      >{`서명: ${vm.selectedSignature?.title || "서명 없음"}`}</span>
                    </div>
                    <div
                      id="btAttachedSigBody"
                      className="sig-clean-text text-[13px] text-[#121314]"
                    >
                      {vm.selectedSignature?.body ||
                        "결합할 서명을 선택해 주세요."}
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#f4f6f8] border border-[#e6eaee] space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-black text-[#121314]">
                      📨 실제 고객(예: 권수경) 발송 시 최종 결합 문구
                    </span>
                    <button
                      type="button"
                      className="text-primary font-black hover:underline"
                      onClick={vm.copyPreview}
                      disabled={!vm.preview || vm.previewBusy}
                    >
                      전체 복사
                    </button>
                  </div>
                  <div
                    id="btFinalResolvedPreview"
                    className="p-3 rounded-xl bg-white border border-[#e6eaee] sig-clean-text text-[12.5px]"
                  >
                    {vm.previewBusy
                      ? "미리보기 처리 중…"
                      : vm.previewError ||
                        vm.preview ||
                        "메시지를 입력하면 서명이 결합된 결과가 표시됩니다."}
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-2 pt-1">
                  <button
                    type="button"
                    className="col-span-4 py-3 px-3 rounded-xl bg-white hover:bg-[#f4f6f8] border-2 border-[#121314] text-[#121314] text-xs font-black flex items-center justify-center gap-1 transition-colors"
                    onClick={vm.openGuide}
                  >
                    <span>발송 안내</span>
                  </button>
                  <button
                    type="button"
                    className="col-span-8 ns-hero-cta py-3 px-4 rounded-xl text-white text-xs sm:text-[13px] font-black flex items-center justify-center gap-1.5 shadow-lg"
                    onClick={vm.openGuide}
                  >
                    <span>Windows 앱 연동 안내</span>
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
