import { localDateTime } from "../crm-utils";
const kinds = {
  CALL: "📞 재통화",
  VISIT: "🚗 방문상담",
  DOCUMENT: "📄 제안·리포트",
  REVIEW: "🎁 이벤트케어",
  OTHER: "📌 기타 업무",
};
export default function TaskRows({ items, busy, onOpen, onAction, onCopy }) {
  return items.map((t) => {
    const done = t.status === "DONE",
      cancelled = t.status === "CANCELLED",
      time = t.due_at ? localDateTime(t.due_at).slice(11, 16) : "";
    const badge =
      t.kind === "VISIT"
        ? "bg-sub-soft text-sub border-purple-200"
        : t.kind === "DOCUMENT"
          ? "bg-sky-50 text-sky-700 border-sky-200"
          : t.kind === "REVIEW"
            ? "bg-[#fffbeb] text-[#b45309] border-[#fde68a]"
            : "bg-primary-soft text-primary border-emerald-200";
    return (
      <div
        key={t.id}
        className={`slim-task-row ${done ? "done-row" : ""} px-3.5 sm:px-4 py-3`}
      >
        <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-2">
          <div className="md:col-span-1 flex items-center gap-2">
            <input
              type="checkbox"
              checked={done}
              disabled={busy}
              onChange={() => onAction(t, done ? "PENDING" : "DONE")}
              aria-label={`${t.title} 완료 전환`}
              className="w-4 h-4 accent-[#03c75a] rounded cursor-pointer shrink-0"
            />
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-black ${done || cancelled ? "bg-slate-200 text-[#475569]" : "bg-primary-soft text-primary"}`}
            >
              {done ? "완료" : cancelled ? "취소" : "예정"}
            </span>
          </div>
          <div className="md:col-span-2 text-xs pl-6 md:pl-0">
            <div>
              {t.is_overdue ? (
                <>
                  <span className="px-2 py-0.5 rounded bg-[#f04452] text-white text-[11px] font-black mr-1">
                    기한지남
                  </span>
                  <span className="font-mono font-black text-[#f04452]">
                    {t.due_date}
                  </span>
                </>
              ) : t.is_today && !done && !cancelled ? (
                <>
                  <span className="px-2 py-0.5 rounded bg-primary text-white text-[11px] font-black mr-1">
                    오늘
                  </span>
                  <span className="font-mono font-black text-primary">
                    {time || "시간미정"}
                  </span>
                </>
              ) : (
                <span className="font-mono font-bold text-[#121314]">
                  {t.due_date}
                </span>
              )}
            </div>
            <div className="text-[11px] font-mono text-[#64748b] mt-0.5">
              {t.due_date}
              {time && ` · ${time}`}
            </div>
          </div>
          <div className="md:col-span-2 flex items-center gap-1.5 flex-wrap pl-6 md:pl-0">
            <span
              className={`px-2.5 py-0.5 rounded-md border text-[11px] font-black ${badge}`}
            >
              {kinds[t.kind]}
            </span>
            <button
              type="button"
              onClick={() => onOpen(t)}
              className="font-black text-xs sm:text-[13px] text-[#121314] hover:text-primary"
            >
              {t.customer_name}
              {t.customer_alias && ` (${t.customer_alias})`}
            </button>
          </div>
          <div className="md:col-span-4 min-w-0 pl-6 md:pl-0">
            <button
              type="button"
              onClick={() => onOpen(t)}
              className={`block w-full text-left text-xs sm:text-[13.5px] font-black ${done ? "line-through text-[#64748b]" : "text-[#121314] hover:text-primary"} truncate`}
            >
              {t.title}
            </button>
            <p className="text-[11.5px] font-semibold text-[#475569] truncate mt-0.5">
              {t.note || "메모 없음"}{" "}
              <span className="text-[10.5px] text-sub font-bold ml-1">
                (
                {t.auto_event_key || t.contract_reminder_key
                  ? "자동 이벤트"
                  : t.contract_id
                    ? "내계약"
                    : "직접 등록"}
                )
              </span>
            </p>
          </div>
          <div className="md:col-span-2 text-xs pl-6 md:pl-0 space-y-0.5">
            {t.customer_phone ? (
              <button
                type="button"
                onClick={() => onCopy(t.customer_phone)}
                className="font-mono font-extrabold text-[#121314] hover:text-primary flex items-center gap-1"
              >
                📞 {t.customer_phone}
              </button>
            ) : (
              <span className="text-[#64748b] text-[11px]">연락처 미등록</span>
            )}
            <div className="text-[11px] text-[#64748b] truncate">
              {t.location?.address || t.customer_location?.address || ""}
            </div>
          </div>
          <div className="md:col-span-1 flex items-center justify-end gap-1 pl-6 md:pl-0">
            <button
              type="button"
              onClick={() => onOpen(t)}
              className="px-3 py-1.5 rounded-lg bg-[#f4f6f8] hover:bg-[#03c75a] hover:text-white text-[#121314] text-xs font-extrabold transition-colors whitespace-nowrap"
            >
              상세·수정
            </button>
          </div>
        </div>
      </div>
    );
  });
}
