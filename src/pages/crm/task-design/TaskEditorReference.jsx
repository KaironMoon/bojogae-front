/* eslint-disable react/prop-types */
// Copied from the task HTML reference; controller supplies real data and actions.
import TemplateIcon from "./TaskIcon";
export default function TaskEditorReference({ vm }) {
  return (
    <form
      onSubmit={vm.submit}
      className="MuiBox-root css-0 flex flex-col flex-1 overflow-hidden"
    >
      <div className="bg-[#121314] text-white px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-xl bg-[#03c75a] text-white flex items-center justify-center shadow-sm">
            <TemplateIcon name="calendar-plus" className="w-5 h-5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2
                className="MuiTypography-root MuiTypography-h6 MuiDialogTitle-root css-2o971p text-base sm:text-lg font-black text-white"
                id=":rnn:"
              >
                업무·방문 일정 등록
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-white/10 text-emerald-300 text-[10.5px] font-extrabold">
                내고객 연동 스케줄러
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              고객 검색·선택 후 재통화, 방문상담, 제안서 전달, 생일·면책종료
              안부 일정을 등록합니다.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="text-slate-400 hover:text-white"
          disabled={vm.busy}
          onClick={vm.close}
        >
          <TemplateIcon name="x" className="w-5 h-5" />
        </button>
      </div>

      <div className="MuiDialogContent-root css-1nbx5hx p-4 sm:p-6 overflow-y-auto flex-1 bg-[#f8fafc]">
        {vm.feedback}
        <div className="MuiStack-root css-sg6wi7 space-y-4 text-xs">
          <div className="MuiStack-root css-1821gv5 p-4 rounded-2xl bg-white border border-[#e6eaee] space-y-3 shadow-2xs">
            <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-2">
              <span className="font-black text-[#121314] flex items-center gap-1.5">
                <TemplateIcon
                  name="user-search"
                  className="w-4 h-4 text-primary"
                />
                <span>1. 대상 고객 검색 및 선택</span>
              </span>
              <span className="text-[11px] font-bold text-primary">
                내고객 DB 실시간 연동
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
              <div className="sm:col-span-5 MuiStack-root css-5ax1kt">
                <label
                  className="MuiFormLabel-root MuiInputLabel-root css-1jp6w1s block font-black text-[#121314] mb-1"
                  htmlFor=":rno:"
                  id=":rno:-label"
                >
                  고객 검색
                </label>
                <div className="flex gap-1.5">
                  <div className="MuiFormControl-root MuiFormControl-fullWidth MuiTextField-root css-1vbfw84 flex-1">
                    <div className="MuiInputBase-root MuiOutlinedInput-root css-10lgqqs">
                      <input
                        aria-invalid="false"
                        id=":rno:"
                        type="text"
                        value={vm.form.customerQuery}
                        placeholder="고객명 또는 연락처"
                        className="MuiInputBase-input MuiOutlinedInput-input MuiInputBase-inputSizeSmall css-69z80b reg-input w-full px-3 py-2 font-extrabold text-[#121314]"
                        maxLength="200"
                        onChange={(e) =>
                          vm.setField("customerQuery", e.target.value)
                        }
                        aria-label=":rno:"
                      />
                    </div>
                  </div>
                  <button
                    tabIndex="0"
                    type="button"
                    className="MuiButtonBase-root MuiButton-root MuiButton-text MuiButton-textPrimary css-19610t3 px-3.5 py-2 rounded-xl bg-[#121314] hover:bg-primary text-white font-black shrink-0 transition-colors"
                    disabled={vm.busy}
                    onClick={vm.searchCustomers}
                  >
                    검색
                    <span className="MuiTouchRipple-root css-4mb1j7"></span>
                  </button>
                </div>
              </div>

              <div className="sm:col-span-7 MuiFormControl-root MuiFormControl-fullWidth MuiTextField-root css-1vbfw84">
                <label
                  className="MuiFormLabel-root MuiInputLabel-root css-1jp6w1s block font-black text-[#121314] mb-1"
                  htmlFor=":rnq:"
                  id=":rnq:-label"
                >
                  고객 선택
                </label>
                <div className="MuiInputBase-root MuiOutlinedInput-root MuiSelect-root css-10lgqqs">
                  <select
                    id=":rnq:"
                    className="MuiSelect-select reg-input w-full px-3 py-2 font-extrabold text-[#121314]"
                    value={vm.form.customer_id}
                    onChange={(e) => vm.setField("customer_id", e.target.value)}
                    aria-label=":rnq:"
                    required
                  >
                    <option value="">고객 선택</option>
                    {vm.customers.map((c) => (
                      <option value={c.id} key={c.id}>
                        {c.name}
                        {c.alias ? ` (${c.alias})` : ""} ·{" "}
                        {c.phone || "연락처 미등록"}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#e6eaee] space-y-3.5 shadow-2xs">
            <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-2">
              <span className="font-black text-[#121314] flex items-center gap-1.5">
                <TemplateIcon
                  name="clipboard-check"
                  className="w-4 h-4 text-sub"
                />
                <span>2. 업무 종류 및 제목</span>
              </span>
              <span className="text-[11px] font-bold text-[#f04452]">
                * 업무 제목 필수
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-4 MuiFormControl-root MuiFormControl-fullWidth MuiTextField-root css-1vbfw84">
                <label
                  className="MuiFormLabel-root MuiInputLabel-root css-1jp6w1s block font-black text-[#121314] mb-1"
                  htmlFor=":rns:"
                  id=":rns:-label"
                >
                  업무 종류
                </label>
                <div className="MuiInputBase-root MuiOutlinedInput-root MuiSelect-root css-10lgqqs">
                  <select
                    id=":rns:"
                    className="MuiSelect-select reg-input w-full px-3 py-2 font-black text-primary bg-primary-soft/40"
                    value={vm.form.kind}
                    onChange={(e) => vm.setField("kind", e.target.value)}
                    aria-label=":rns:"
                  >
                    <option value="CALL">📞 재통화</option>
                    <option value="VISIT">🚗 방문상담</option>
                    <option value="DOCUMENT">📄 제안·리포트 전달</option>
                    <option value="REVIEW">
                      🎁 생일·면책·감액·상령일 케어
                    </option>
                    <option value="CLAIM" disabled>
                      🧾 보험금 청구 지원 (준비 중)
                    </option>
                    <option value="OTHER">📌 기타 업무</option>
                  </select>
                </div>
              </div>

              <div className="sm:col-span-8 MuiFormControl-root MuiFormControl-fullWidth MuiTextField-root css-1vbfw84">
                <label
                  className="MuiFormLabel-root MuiInputLabel-root Mui-required css-1fvttug block font-black text-[#121314] mb-1"
                  htmlFor=":rnu:"
                  id=":rnu:-label"
                >
                  업무 제목
                  <span
                    aria-hidden="true"
                    className="MuiFormLabel-asterisk MuiInputLabel-asterisk css-12fvayo text-[#f04452]"
                  >
                    {" "}
                    *
                  </span>
                </label>
                <div className="MuiInputBase-root MuiOutlinedInput-root css-10lgqqs">
                  <input
                    aria-invalid="false"
                    id=":rnu:"
                    required
                    type="text"
                    placeholder="업무 제목을 입력하거나 아래 빠른 템플릿 칩을 클릭하세요"
                    className="MuiInputBase-input MuiOutlinedInput-input MuiInputBase-inputSizeSmall css-69z80b reg-input w-full px-3.5 py-2 font-extrabold text-[#121314]"
                    maxLength="200"
                    value={vm.form.title}
                    onChange={(e) => vm.setField("title", e.target.value)}
                    aria-label=":rnu:"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              <span className="text-[11px] font-bold text-[#64748b] mr-1">
                빠른 제목 입력:
              </span>
              <button
                type="button"
                className="px-2.5 py-1 rounded-lg bg-[#f4f6f8] hover:bg-primary-soft hover:text-primary font-bold text-[11px]"
                disabled={vm.busy}
                onClick={() =>
                  vm.preset(
                    "CALL",
                    "부재중 고객 리터치 재통화 및 상담 약속(TA) 잡기",
                  )
                }
              >
                📞 부재중 재통화
              </button>
              <button
                type="button"
                className="px-2.5 py-1 rounded-lg bg-[#f4f6f8] hover:bg-primary-soft hover:text-primary font-bold text-[11px]"
                disabled={vm.busy}
                onClick={() =>
                  vm.preset(
                    "DOCUMENT",
                    "보조개 AI 보장분석·리모델링 리포트 카톡 발송 및 브리핑",
                  )
                }
              >
                📄 AI 리포트 브리핑
              </button>
              <button
                type="button"
                className="px-2.5 py-1 rounded-lg bg-[#f4f6f8] hover:bg-primary-soft hover:text-primary font-bold text-[11px]"
                disabled={vm.busy}
                onClick={() =>
                  vm.preset(
                    "VISIT",
                    "청약서 자필서명 및 건강e음 미청구 보험금 현장 확인 방문",
                  )
                }
              >
                🚗 청약·방문 미팅
              </button>
              <button
                type="button"
                className="px-2.5 py-1 rounded-lg bg-[#f4f6f8] hover:bg-primary-soft hover:text-primary font-bold text-[11px]"
                disabled={vm.busy}
                onClick={() =>
                  vm.preset(
                    "REVIEW",
                    "암 90일 면책기간 종료 및 100% 보장 개시 축하 연락",
                  )
                }
              >
                🛡️ 면책종료 축하
              </button>
              <button
                type="button"
                className="px-2.5 py-1 rounded-lg bg-[#f4f6f8] hover:bg-primary-soft hover:text-primary font-bold text-[11px]"
                disabled={vm.busy}
                onClick={() =>
                  vm.preset(
                    "REVIEW",
                    "상령일(보험나이 +1세) 도래 전 부족 담보 보완 안내",
                  )
                }
              >
                📈 상령일 도래 안내
              </button>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#e6eaee] space-y-3.5 shadow-2xs">
            <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-2">
              <span className="font-black text-[#121314] flex items-center gap-1.5">
                <TemplateIcon name="clock" className="w-4 h-4 text-primary" />
                <span>3. 예정 일시 및 처리 상태</span>
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="px-2 py-0.5 rounded bg-[#f4f6f8] hover:bg-primary-soft text-[10.5px] font-bold"
                  disabled={vm.busy}
                  onClick={() => vm.setField("time", "10:00")}
                >
                  오전 10:00
                </button>
                <button
                  type="button"
                  className="px-2 py-0.5 rounded bg-[#f4f6f8] hover:bg-primary-soft text-[10.5px] font-bold"
                  disabled={vm.busy}
                  onClick={() => vm.setField("time", "14:00")}
                >
                  오후 2:00
                </button>
                <button
                  type="button"
                  className="px-2 py-0.5 rounded bg-[#f4f6f8] hover:bg-primary-soft text-[10.5px] font-bold"
                  disabled={vm.busy}
                  onClick={() => vm.setField("time", "16:30")}
                >
                  오후 4:30
                </button>
              </div>
            </div>

            <div className="MuiStack-root css-lgk7oi grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="MuiFormControl-root MuiFormControl-fullWidth MuiTextField-root css-1vbfw84">
                <label
                  className="MuiFormLabel-root MuiInputLabel-root Mui-required css-1jp6w1s block font-black text-[#121314] mb-1"
                  htmlFor=":rnv:"
                  id=":rnv:-label"
                >
                  예정일
                  <span
                    aria-hidden="true"
                    className="MuiFormLabel-asterisk MuiInputLabel-asterisk css-12fvayo text-[#f04452]"
                  >
                    {" "}
                    *
                  </span>
                </label>
                <div className="MuiInputBase-root MuiOutlinedInput-root css-10lgqqs">
                  <input
                    aria-invalid="false"
                    id=":rnv:"
                    required
                    type="date"
                    value={vm.form.due_date}
                    className="MuiInputBase-input MuiOutlinedInput-input MuiInputBase-inputSizeSmall css-69z80b reg-input w-full px-3 py-2 font-mono font-extrabold text-[#121314]"
                    onChange={(e) => vm.setField("due_date", e.target.value)}
                    aria-label=":rnv:"
                  />
                </div>
              </div>

              <div className="MuiFormControl-root MuiFormControl-fullWidth MuiTextField-root css-1vbfw84">
                <label
                  className="MuiFormLabel-root MuiInputLabel-root css-1jp6w1s block font-black text-[#121314] mb-1"
                  htmlFor=":ro0:"
                  id=":ro0:-label"
                >
                  확정 시각 (선택)
                </label>
                <div className="MuiInputBase-root MuiOutlinedInput-root css-10lgqqs">
                  <input
                    aria-invalid="false"
                    id=":ro0:"
                    type="time"
                    value={vm.form.time}
                    className="MuiInputBase-input MuiOutlinedInput-input MuiInputBase-inputSizeSmall css-69z80b reg-input w-full px-3 py-2 font-mono font-bold text-[#121314]"
                    onChange={(e) => vm.setField("time", e.target.value)}
                    aria-label=":ro0:"
                  />
                </div>
              </div>

              <div className="MuiFormControl-root MuiFormControl-fullWidth MuiTextField-root css-1vbfw84">
                <label
                  className="MuiFormLabel-root MuiInputLabel-root css-1jp6w1s block font-black text-[#121314] mb-1"
                  htmlFor=":ro1:"
                  id=":ro1:-label"
                >
                  처리 상태
                </label>
                <div className="MuiInputBase-root MuiOutlinedInput-root MuiSelect-root css-10lgqqs">
                  <select
                    id=":ro1:"
                    className="MuiSelect-select reg-input w-full px-3 py-2 font-extrabold text-[#121314]"
                    value={vm.form.status}
                    onChange={(e) => vm.setField("status", e.target.value)}
                    aria-label=":ro1:"
                  >
                    <option value="PENDING">예정</option>
                    <option value="IN_PROGRESS" disabled>
                      진행 중 (준비 중)
                    </option>
                    <option value="DONE">완료</option>
                    <option value="CANCELLED">취소</option>
                    <option value="POSTPONED" disabled>
                      보류·연기 (준비 중)
                    </option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#e6eaee] space-y-2 shadow-2xs">
            <div className="MuiFormControl-root MuiFormControl-fullWidth MuiTextField-root css-1vbfw84">
              <label
                className="MuiFormLabel-root MuiInputLabel-root css-1fvttug block font-black text-[#121314] mb-1.5"
                htmlFor=":ro3:"
                id=":ro3:-label"
              >
                업무 내용
              </label>
              <div className="MuiInputBase-root MuiOutlinedInput-root MuiInputBase-multiline css-z1cnhb">
                <textarea
                  aria-invalid="false"
                  id=":ro3:"
                  rows="3"
                  placeholder="통화 핵심 포인트, 방문 시 지참할 서류(가입제안서, 청구서 등), 고객 요청사항을 메모하세요."
                  className="MuiInputBase-input MuiOutlinedInput-input MuiInputBase-inputMultiline MuiInputBase-inputSizeSmall css-qnslt2 reg-input w-full p-3.5 font-semibold text-[#121314]"
                  maxLength="5000"
                  value={vm.form.note}
                  onChange={(e) => vm.setField("note", e.target.value)}
                  aria-label=":ro3:"
                ></textarea>
              </div>
            </div>
          </div>
        </div>
        {vm.location}
      </div>

      <div className="MuiDialogActions-root MuiDialogActions-spacing css-8mwzdy px-6 py-4 bg-white border-t border-[#e6eaee] flex items-center justify-between shrink-0">
        <div className="text-[11px] font-bold text-[#64748b] hidden sm:block">
          💡 등록된 업무는 고객 상세 화면의 상담 타임라인에도 함께 연동됩니다.
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            tabIndex="0"
            type="button"
            className="MuiButtonBase-root MuiButton-root MuiButton-text MuiButton-textPrimary MuiButton-sizeMedium css-1t2wubw px-5 py-2.5 rounded-xl border border-[#d1d6db] hover:bg-[#f4f6f8] text-xs font-extrabold text-[#334155]"
            disabled={vm.busy}
            onClick={vm.close}
          >
            취소
          </button>
          <button
            tabIndex="0"
            type="submit"
            className="MuiButtonBase-root MuiButton-root MuiButton-contained MuiButton-containedPrimary MuiButton-sizeMedium css-15diaom ns-hero-cta px-6 py-2.5 rounded-xl text-white text-xs font-black shadow-md"
            disabled={vm.busy}
          >
            저장
            <span className="MuiTouchRipple-root css-4mb1j7"></span>
          </button>
        </div>
      </div>
    </form>
  );
}
