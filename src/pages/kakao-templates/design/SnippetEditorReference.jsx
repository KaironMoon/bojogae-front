/* eslint-disable react/prop-types */
// HTML design copied first; data and events are supplied by the controller.
import TemplateIcon from "./TemplateIcon";
export default function SnippetEditorReference({ vm }) {
  return (
    <form
      onSubmit={vm.submit}
      className="MuiBox-root css-0 flex flex-col flex-1 overflow-hidden"
    >
      <div className="bg-[#121314] text-white px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-xl bg-[#03c75a] text-white flex items-center justify-center shadow-sm">
            <TemplateIcon name="message-square-quote" className="w-5 h-5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2
                className="MuiTypography-root MuiTypography-h6 MuiDialogTitle-root css-2o971p text-base sm:text-lg font-black text-white"
                id=":r10k:"
              >
                {vm.item.id ? "상용구 수정" : "상용구 등록"}
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-white/10 text-emerald-300 text-[10.5px] font-extrabold">
                보조개톡 Windows 앱 자동 동기화
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              등록 즉시 보조개톡 PC 윈도우 앱의 상용구 목록 및 [[[제목]]] 치환
              변수로 연동됩니다.
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
            <div className="MuiFormControl-root MuiTextField-root css-1pv2xcc p-4 rounded-2xl bg-white border border-[#e6eaee] space-y-2.5 shadow-2xs">
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
                  <span className="text-[11px] font-semibold text-sub ml-1">
                    (보조개톡 앱에서 [[[제목]]] 태그로 치환됨)
                  </span>
                </label>
                <p
                  className="MuiFormHelperText-root MuiFormHelperText-sizeMedium MuiFormHelperText-contained Mui-required css-liazc4 font-bold text-[#8b95a1]"
                  id=":r10n:-helper-text"
                >{`${vm.titleLength}/100자`}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <div className="sm:col-span-4">
                  <select
                    id="modalBpCategorySelect"
                    className="reg-input w-full px-3 py-2.5 text-xs font-extrabold text-[#121314] bg-[#f8fafc]"
                    value={vm.category}
                    onChange={(e) => vm.setCategory(e.target.value)}
                    disabled={vm.busy}
                    aria-label="상용구 분류"
                  >
                    <option value="REPORT">📄 리포트·제안 전달</option>
                    <option value="CARE">🛡️ 면책·감액·상령일</option>
                    <option value="CLAIM">🏥 청구서류·미청구</option>
                    <option value="GREETING">🎂 생일·계절 안부</option>
                  </select>
                </div>
                <div className="sm:col-span-8 MuiInputBase-root MuiOutlinedInput-root css-113l0n9">
                  <input
                    aria-invalid="false"
                    aria-describedby=":r10n:-helper-text"
                    id=":r10n:"
                    required
                    type="text"
                    maxLength="100"
                    placeholder="예: 리포트전달 / 면책종료축하 / 청구서류안내"
                    className="MuiInputBase-input MuiOutlinedInput-input css-1emfee7 reg-input w-full px-3.5 py-2.5 text-sm font-extrabold text-[#121314]"
                    value={vm.title}
                    onChange={(e) => vm.setTitle(e.target.value)}
                    disabled={vm.busy}
                    autoFocus
                  />
                </div>
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
                </label>
                <p
                  className="MuiFormHelperText-root MuiFormHelperText-sizeMedium MuiFormHelperText-contained Mui-required css-liazc4 font-bold text-[#8b95a1]"
                  id=":r10o:-helper-text"
                >{`${vm.bodyLength}/5,000자`}</p>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap bg-[#f8fafc] p-2 rounded-xl border border-[#e6eaee]">
                <span className="text-[10.5px] font-extrabold text-[#4e5968] mr-0.5">
                  치환·구문 삽입:
                </span>
                <button
                  type="button"
                  className="px-2.5 py-1 rounded-lg bg-[#ecfdf5] hover:bg-[#d1fae5] text-[#00913f] border border-[#a7f3d0] text-[11px] font-black"
                  onClick={() => vm.insertText("[[[이름]]]")}
                  disabled={vm.busy}
                >
                  + [[[이름]]] (고객 실명 자동변환)
                </button>
                <button
                  type="button"
                  className="px-2 py-1 rounded-lg bg-white hover:bg-primary-soft border border-[#d1d6db] text-[11px] font-bold"
                  onClick={() =>
                    vm.insertText("[[[이름]]] 고객님 안녕하세요! 😊\n")
                  }
                  disabled={vm.busy}
                >
                  + 첫인사
                </button>
                <button
                  type="button"
                  className="px-2 py-1 rounded-lg bg-white hover:bg-primary-soft border border-[#d1d6db] text-[11px] font-bold"
                  onClick={() =>
                    vm.insertText(
                      "\n궁금하신 점은 언제든 편하게 카톡 남겨주세요!",
                    )
                  }
                  disabled={vm.busy}
                >
                  + 맺음말
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
                    "[[[이름]]] 고객님 안녕하세요! 😊\n요청하신 보장분석 및 리모델링 비교 리포트를 보내드립니다."
                  }
                  className="MuiInputBase-input MuiOutlinedInput-input MuiInputBase-inputMultiline css-1m88iit reg-input w-full p-3.5 text-[13.5px] font-semibold text-[#121314] bp-clean-text"
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
                  id="bpEmojiTriggerBtn"
                  className="MuiButtonBase-root MuiButton-root MuiButton-outlined MuiButton-outlinedPrimary MuiButton-sizeSmall css-2m4ogl px-3 py-1.5 rounded-xl border border-primary bg-primary-soft/50 hover:bg-primary-soft text-primary text-xs font-black flex items-center gap-1.5 transition-all"
                  onClick={() => vm.setEmojiOpen(!vm.emojiOpen)}
                  disabled={vm.busy}
                  aria-controls="bpEmojiPickerPopover"
                >
                  <span className="MuiButton-icon MuiButton-startIcon MuiButton-iconSizeSmall css-1siv2hp">
                    <svg
                      className="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium css-q7mezt w-4 h-4 fill-current"
                      focusable="false"
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      data-testid="EmojiEmotionsOutlinedIcon"
                    >
                      <circle cx="15.5" cy="9.5" r="1.5"></circle>
                      <circle cx="8.5" cy="9.5" r="1.5"></circle>
                      <path d="M12 18c2.28 0 4.22-1.66 5-4H7c.78 2.34 2.72 4 5 4"></path>
                      <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2M12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8"></path>
                    </svg>
                  </span>
                  <span>이모지 삽입</span>
                </button>

                <span
                  id="modalTokenHintBadge"
                  className="px-2.5 py-1 rounded-lg bg-sub-soft text-sub border border-[#ddd6fe] text-[11px] font-black"
                >{`치환태그: [[[${vm.title.trim() || "제목"}]]]`}</span>
              </div>

              <div
                id="bpEmojiPickerPopover"
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
                  id="bpEmojiGridButtons"
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
              <span>Windows 앱 치환 시뮬레이션</span>
              <span className="px-2 py-0.5 rounded bg-primary-soft text-primary text-[10.5px] font-black">
                권수경 고객님 예시
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white border-2 border-[#e6eaee] space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span
                  id="modalChipPreviewTag"
                  className="px-2.5 py-1 rounded-lg bg-sub-soft text-sub border border-[#ddd6fe] text-[11px] font-black"
                >{`[[[${vm.title.trim() || "상용구 제목"}]]]`}</span>
                <span className="text-[10.5px] font-bold text-[#8b95a1]">
                  [[[이름]]] → 권수경
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#f8fafc] border border-[#e6eaee] space-y-2.5">
                <div
                  id="modalLiveBpResolvedText"
                  className="bp-clean-text text-[13px] text-[#121314]"
                >
                  {vm.previewBusy
                    ? "미리보기 처리 중…"
                    : vm.previewError ||
                      vm.preview ||
                      "본문을 입력하면 고객명이 치환된 미리보기가 표시됩니다."}
                </div>
                <div className="pt-2 border-t border-dashed border-[#cbd5e1] text-[11.5px] font-semibold text-[#4e5968] leading-relaxed">
                  현재 선택한 서명을 함께 결합해 확인합니다. 서명은 상용구
                  본문에 저장되지 않습니다.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="MuiDialogActions-root MuiDialogActions-spacing css-8mwzdy px-6 py-4 bg-white border-t border-[#e6eaee] flex items-center justify-between shrink-0">
        <div className="text-[11px] font-bold text-[#8b95a1] hidden sm:block">
          * 저장 시 보조개톡 Windows 앱에서도 즉시 불러와 사용할 수 있습니다.
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
            id="bpModalSaveSubmitBtn"
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
