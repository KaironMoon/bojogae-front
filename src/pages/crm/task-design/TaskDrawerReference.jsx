/* eslint-disable react/prop-types */
// Copied from the task HTML reference; controller supplies real data and actions.
import TemplateIcon from "./TaskIcon";
export default function TaskDrawerReference({ vm }) {
  return (
    <form
      onSubmit={vm.submit}
      className="bg-white w-full max-w-xl h-full shadow-2xl border-l border-[#e6eaee] flex flex-col justify-between overflow-hidden "
    >
      <div className="bg-[#121314] text-white px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div
            id="tDrawerBadge"
            className="px-3 py-2 rounded-xl bg-[#03c75a] text-white font-black text-xs shrink-0"
          >
            {vm.kindLabel}
          </div>
          <div className="min-w-0">
            <h3 id="tDrawerTitle" className="text-base font-black truncate">
              업무 상세 및 처리 상태 변경
            </h3>
            <p
              id="tDrawerSub"
              className="text-[11px] text-emerald-400 font-mono mt-0.5"
            >{`고객: ${vm.item.customer_name} · ${vm.item.due_date}`}</p>
          </div>
        </div>
        <button
          type="button"
          className="w-8 h-8 rounded-xl bg-white/10 hover:bg-rose-500 text-white flex items-center justify-center"
          disabled={vm.busy}
          onClick={vm.close}
        >
          <TemplateIcon name="x" className="w-4 h-4" />
        </button>
      </div>

      <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4 bg-[#f8fafc] text-xs">
        {vm.feedback}

        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            className="p-3 rounded-2xl bg-primary-soft hover:bg-emerald-100 border border-emerald-200 text-primary font-black flex flex-col items-center gap-1"
            disabled={vm.busy}
            onClick={() => vm.action("DONE")}
          >
            <TemplateIcon name="check-circle-2" className="w-4 h-4" />
            <span>즉시 완료 처리</span>
          </button>
          <button
            type="button"
            className="p-3 rounded-2xl bg-[#fffbeb] hover:bg-amber-100 border border-[#fde68a] text-[#b45309] font-black flex flex-col items-center gap-1"
            disabled={vm.busy}
            onClick={() => vm.action("POSTPONE")}
          >
            <TemplateIcon name="calendar-arrow-up" className="w-4 h-4" />
            <span>내일로 미루기(+1일)</span>
          </button>
          <button
            type="button"
            className="p-3 rounded-2xl bg-sub-soft hover:bg-purple-100 border border-purple-200 text-sub font-black flex flex-col items-center gap-1"
            disabled={vm.busy}
            onClick={vm.guide}
          >
            <TemplateIcon name="message-circle" className="w-4 h-4" />
            <span>보조개톡 발송</span>
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#e6eaee] space-y-3 shadow-2xs">
          <div>
            <label className="block font-bold text-[#64748b] mb-1">
              업무 제목 *
            </label>
            <input
              type="text"
              id="tDrawerTitleInput"
              className="reg-input w-full px-3.5 py-2 font-black text-[#121314]"
              maxLength="200"
              value={vm.form.title}
              onChange={(e) => vm.setField("title", e.target.value)}
              aria-label="tDrawerTitleInput"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="block font-bold text-[#64748b] mb-1">
                예정일 *
              </label>
              <input
                type="date"
                id="tDrawerDateInput"
                className="reg-input w-full px-3 py-2 font-mono font-bold"
                value={vm.form.due_date}
                onChange={(e) => vm.setField("due_date", e.target.value)}
                aria-label="tDrawerDateInput"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-[#64748b] mb-1">
                확정 시각
              </label>
              <input
                type="time"
                id="tDrawerTimeInput"
                className="reg-input w-full px-3 py-2 font-mono font-bold"
                value={vm.form.time}
                onChange={(e) => vm.setField("time", e.target.value)}
                aria-label="tDrawerTimeInput"
              />
            </div>
            <div>
              <label className="block font-bold text-[#64748b] mb-1">
                처리 상태
              </label>
              <select
                id="tDrawerStatusSelect"
                className="reg-input w-full px-3 py-2 font-black text-primary"
                value={vm.form.status}
                onChange={(e) => vm.setField("status", e.target.value)}
                aria-label="tDrawerStatusSelect"
              >
                <option value="PENDING">예정</option>
                <option value="DONE">완료</option>
                <option value="CANCELLED">취소</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-[#64748b] mb-1">
              업무 내용 및 상담 결과 메모
            </label>
            <textarea
              id="tDrawerContentInput"
              rows="4"
              className="reg-input w-full p-3.5 font-semibold text-[#121314] leading-relaxed"
              maxLength="5000"
              value={vm.form.note}
              onChange={(e) => vm.setField("note", e.target.value)}
              aria-label="tDrawerContentInput"
            ></textarea>
          </div>
        </div>

        {vm.location}
      </div>

      <div className="px-6 py-4 border-t border-[#e6eaee] bg-white flex items-center justify-between shrink-0">
        <button
          type="button"
          className="px-3.5 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-[#f04452] text-xs font-extrabold"
          disabled={vm.busy}
          onClick={vm.remove}
        >
          일정 삭제
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="px-4 py-2.5 rounded-xl border border-[#d1d6db] text-xs font-extrabold text-[#334155]"
            disabled={vm.busy}
            onClick={vm.close}
          >
            닫기
          </button>
          <button
            type="submit"
            className="ns-hero-cta px-6 py-2.5 rounded-xl text-white text-xs font-black"
            disabled={vm.busy}
          >
            변경사항 저장
          </button>
        </div>
      </div>
    </form>
  );
}
