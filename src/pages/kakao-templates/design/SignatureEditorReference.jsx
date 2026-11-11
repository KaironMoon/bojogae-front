/* eslint-disable react/prop-types */
// Structure copied from the signature HTML reference.
import TemplateIcon from "./TemplateIcon";
export default function SignatureEditorReference({ vm }) {
  return (
    <form
      onSubmit={vm.submit}
      className="MuiBox-root css-0 flex flex-col flex-1 overflow-hidden"
    >
      <div className="bg-[#121314] text-white px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-xl bg-[#03c75a] text-white flex items-center justify-center shadow-sm">
            <TemplateIcon name="pen-tool" className="w-5 h-5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2
                className="MuiTypography-root MuiTypography-h6 MuiDialogTitle-root css-2o971p text-base sm:text-lg font-black text-white"
                id=":r10k:"
              >
                {vm.item.id ? "서명 수정" : "서명 등록"}
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-white/10 text-emerald-300 text-[10.5px] font-extrabold">
                보조개톡 서명 콤보박스 실시간 연동
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              보조개톡 우측 패널에서 선택 시 메시지 맨 끝에 자동으로 결합될
              꼬리말을 입력하세요.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="text-slate-400 hover:text-white"
          onClick={vm.onClose}
          disabled={vm.busy}
          aria-label="닫기"
        >
          <TemplateIcon name="x" className="w-5 h-5" />
        </button>
      </div>

      <div className="MuiDialogContent-root css-1nbx5hx p-4 sm:p-6 overflow-y-auto flex-1 bg-[#f8fafc]">
        {vm.feedback}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div className="lg:col-span-7 MuiStack-root css-159oxo3 space-y-4 text-xs">
            <div className="MuiFormControl-root MuiTextField-root css-1pv2xcc p-4 rounded-2xl bg-white border border-[#e6eaee] space-y-1.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <label
                  className="MuiFormLabel-root MuiInputLabel-root Mui-required css-8ya4fc font-black text-[#121314] text-xs"
                  htmlFor=":r10n:"
                  id=":r10n:-label"
                >
                  제목
                  <span
                    aria-hidden="true"
                    className="MuiFormLabel-asterisk MuiInputLabel-asterisk css-12fvayo text-[#f04452]"
                  >
                    {" "}
                    *
                  </span>
                  <span className="text-[11px] font-semibold text-[#8b95a1] ml-1">
                    (보조개톡 서명 드롭다운에 표시될 이름)
                  </span>
                </label>
                <p
                  className="MuiFormHelperText-root MuiFormHelperText-sizeMedium MuiFormHelperText-contained Mui-required css-liazc4 font-bold text-[#8b95a1]"
                  id=":r10n:-helper-text"
                >{`${vm.titleLength}/100자`}</p>
              </div>
              <div className="MuiInputBase-root MuiOutlinedInput-root css-113l0n9">
                <input
                  aria-invalid="false"
                  aria-describedby=":r10n:-helper-text"
                  id=":r10n:"
                  required
                  type="text"
                  maxLength="100"
                  placeholder="예: 현대홈쇼핑 / 보험금 청구 안내용"
                  className="MuiInputBase-input MuiOutlinedInput-input css-1emfee7 reg-input w-full px-3.5 py-2.5 text-sm font-extrabold text-[#121314]"
                  value={vm.title}
                  onChange={(e) => vm.setTitle(e.target.value)}
                  disabled={vm.busy}
                  autoFocus
                />
              </div>
            </div>

            <div className="MuiFormControl-root MuiTextField-root css-1pv2xcc p-4 rounded-2xl bg-white border border-[#e6eaee] space-y-2.5 shadow-2xs relative">
              <div className="flex items-center justify-between">
                <label
                  className="MuiFormLabel-root MuiInputLabel-root Mui-required css-8ya4fc font-black text-[#121314] text-xs"
                  htmlFor=":r10o:"
                  id=":r10o:-label"
                >
                  본문
                  <span
                    aria-hidden="true"
                    className="MuiFormLabel-asterisk MuiInputLabel-asterisk css-12fvayo text-[#f04452]"
                  >
                    {" "}
                    *
                  </span>
                  <span className="text-[11px] font-semibold text-[#8b95a1] ml-1">
                    (메시지 맨 끝에 자동으로 붙을 문구)
                  </span>
                </label>
                <p
                  className="MuiFormHelperText-root MuiFormHelperText-sizeMedium MuiFormHelperText-contained Mui-required css-liazc4 font-bold text-[#8b95a1]"
                  id=":r10o:-helper-text"
                >{`${vm.bodyLength}/5,000자`}</p>
              </div>

              <div className="flex items-center gap-1 flex-wrap bg-[#f8fafc] p-2 rounded-xl border border-[#e6eaee]">
                <span className="text-[10.5px] font-extrabold text-[#4e5968] mr-1">
                  빠른 삽입:
                </span>
                <button
                  type="button"
                  className="px-2 py-1 rounded-lg bg-white hover:bg-primary-soft border border-[#d1d6db] text-[11px] font-bold"
                  onClick={() =>
                    vm.insertText(vm.personalize("──────────────\n"))
                  }
                  disabled={vm.busy}
                >
                  ─ 구분선
                </button>
                <button
                  type="button"
                  className="px-2 py-1 rounded-lg bg-white hover:bg-primary-soft border border-[#d1d6db] text-[11px] font-bold"
                  onClick={() =>
                    vm.insertText(
                      vm.personalize("🏢 현대홈쇼핑 GA 강대한지점\n"),
                    )
                  }
                  disabled={vm.busy}
                >
                  + 소속·지점
                </button>
                <button
                  type="button"
                  className="px-2 py-1 rounded-lg bg-white hover:bg-primary-soft border border-[#d1d6db] text-[11px] font-bold"
                  onClick={() =>
                    vm.insertText(vm.personalize("👩‍💼 담당 설계사: 김성춘\n"))
                  }
                  disabled={vm.busy}
                >
                  + 내 이름
                </button>
                <button
                  type="button"
                  className="px-2 py-1 rounded-lg bg-white hover:bg-primary-soft border border-[#d1d6db] text-[11px] font-bold"
                  onClick={() =>
                    vm.insertText(
                      vm.personalize("📞 직통 연락처: 010-9729-9649\n"),
                    )
                  }
                  disabled={vm.busy}
                >
                  + 내 전화번호
                </button>
              </div>

              <div className="MuiInputBase-root MuiOutlinedInput-root MuiInputBase-multiline css-15co1e4">
                <textarea
                  aria-invalid="false"
                  aria-describedby=":r10o:-helper-text"
                  id=":r10o:"
                  required
                  maxLength="5000"
                  placeholder={
                    "──────────────\n🏢 현대홈쇼핑 GA 강대한지점\n👩‍💼 김성춘 컨설턴트 (☎ 010-9729-9649)\n💬 보험금 청구·보장점검 언제든 편하게 문의주세요!"
                  }
                  className="MuiInputBase-input MuiOutlinedInput-input MuiInputBase-inputMultiline css-1m88iit reg-input w-full p-3.5 text-[13.5px] font-semibold text-[#121314] sig-clean-text"
                  value={vm.body}
                  onChange={(e) => vm.setBody(e.target.value)}
                  disabled={vm.busy}
                  ref={vm.bodyRef}
                  rows="7"
                ></textarea>
              </div>

              <div className="MuiBox-root css-0 flex items-center justify-between pt-1">
                <button
                  tabIndex="0"
                  type="button"
                  aria-expanded={vm.emojiOpen}
                  id="emojiTriggerBtn"
                  className="MuiButtonBase-root MuiButton-root MuiButton-outlined MuiButton-outlinedPrimary MuiButton-sizeSmall css-2m4ogl px-3 py-1.5 rounded-xl border border-primary bg-primary-soft/50 hover:bg-primary-soft text-primary text-xs font-black flex items-center gap-1.5 transition-all"
                  onClick={() => vm.setEmojiOpen(!vm.emojiOpen)}
                  disabled={vm.busy}
                  aria-controls="emojiPickerPopover"
                >
                  <span className="MuiButton-icon MuiButton-startIcon MuiButton-iconSizeSmall css-1siv2hp">
                    <svg
                      className="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium css-q7mezt w-4 h-4 fill-current"
                      focusable="false"
                      aria-hidden="true"
                      data-testid="EmojiEmotionsOutlinedIcon"
                      viewBox="0 0 24 24"
                    >
                      <circle cx="15.5" cy="9.5" r="1.5"></circle>
                      <circle cx="8.5" cy="9.5" r="1.5"></circle>
                      <path d="M12 18c2.28 0 4.22-1.66 5-4H7c.78 2.34 2.72 4 5 4"></path>
                      <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2M12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8"></path>
                    </svg>
                  </span>
                  <span>이모지 삽입</span>
                </button>

                <span className="text-[11px] text-[#8b95a1] font-semibold">
                  기본 서명은 Windows 앱에서 설정합니다.
                </span>
              </div>

              <div
                id="emojiPickerPopover"
                className="p-3 rounded-2xl bg-white border-2 border-primary shadow-xl space-y-2 z-20"
                hidden={!vm.emojiOpen}
              >
                <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-1.5">
                  <span className="text-[11px] font-black text-primary">
                    😊 클릭하면 본문 커서 위치에 이모지가 삽입됩니다
                  </span>
                  <button
                    type="button"
                    className="text-[#8b95a1] hover:text-[#121314] font-bold"
                    onClick={() => vm.setEmojiOpen(!vm.emojiOpen)}
                    disabled={vm.busy}
                  >
                    닫기 ✕
                  </button>
                </div>
                <div
                  className="grid grid-cols-8 gap-1.5 text-base text-center"
                  id="emojiGridButtons"
                >
                  {vm.emojis.map((emoji) => (
                    <button
                      type="button"
                      key={emoji}
                      aria-label={`이모지 ${emoji}`}
                      disabled={vm.busy}
                      onClick={() => vm.insertText(emoji)}
                      className="p-1 rounded-lg hover:bg-primary-soft"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-2.5 text-xs">
            <div className="font-black text-[#121314] flex items-center justify-between">
              <span>보조개톡 메시지창 결합 미리보기</span>
              <span
                id="modalTitlePreviewBadge"
                className="px-2 py-0.5 rounded bg-sub-soft text-sub text-[10.5px] font-black"
              >
                {vm.title.trim() || "제목 미입력"}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white border-2 border-[#e6eaee] space-y-3 shadow-xs">
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded bg-[#ecfdf5] text-[#00913f] border border-[#a7f3d0] text-[10px] font-black">
                  [[[이름]]] → 권수경
                </span>
                <span className="text-[11px] font-bold text-[#8b95a1]">
                  본문 + 서명 자동 결합
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#f8fafc] border border-[#e6eaee] space-y-2">
                <div className="text-[13px] font-semibold text-[#4e5968] leading-relaxed">
                  권수경 고객님 안녕하세요! 요청하신 보장분석 리포트
                  전달드립니다 😊
                </div>
                <div
                  id="modalLiveSigPreviewText"
                  className="pt-2 border-t-2 border-dashed border-[#03c75a] sig-clean-text text-[13px] text-[#121314]"
                >
                  {vm.body || "서명 본문을 입력해 주세요."}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="MuiDialogActions-root MuiDialogActions-spacing css-8mwzdy px-6 py-4 bg-white border-t border-[#e6eaee] flex items-center justify-between shrink-0">
        <div className="text-[11px] font-bold text-[#8b95a1] hidden sm:block">
          * 제목과 본문을 모두 입력하면 우측 [저장] 버튼이 활성화됩니다.
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            tabIndex="0"
            type="button"
            className="MuiButtonBase-root MuiButton-root MuiButton-text MuiButton-textPrimary MuiButton-sizeMedium css-1t2wubw px-5 py-2.5 rounded-xl border border-[#d1d6db] hover:bg-[#f4f6f8] text-xs font-extrabold text-[#4e5968]"
            onClick={vm.onClose}
            disabled={vm.busy}
            aria-label="취소"
          >
            취소
          </button>
          <button
            id="modalSaveSubmitBtn"
            type="submit"
            disabled={!vm.canSave}
            className="MuiButtonBase-root MuiButton-root MuiButton-contained MuiButton-containedPrimary MuiButton-sizeMedium css-15diaom ns-hero-cta px-6 py-2.5 rounded-xl text-white text-xs font-black disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
          >
            {vm.busy ? "저장 중…" : "저장"}
          </button>
        </div>
      </div>
    </form>
  );
}
