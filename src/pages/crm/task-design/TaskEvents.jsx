/* eslint-disable react/prop-types */
import Icon from "./TaskIcon";
const styles = {
  BIRTHDAY: [
    "🎂 생일",
    "border-t-[#f04452]",
    "bg-rose-50 text-[#e11d48] border-rose-200",
  ],
  SANGNYEONG: [
    "📈 상령일",
    "border-t-[#f59e0b]",
    "bg-[#fffbeb] text-[#b45309] border-amber-300",
  ],
  EXEMPTION: [
    "🛡️ 면책종료",
    "border-t-[#03c75a]",
    "bg-primary-soft text-primary border-emerald-200",
  ],
  REDUCTION: [
    "✨ 감액종료",
    "border-t-[#6b38fb]",
    "bg-sub-soft text-sub border-purple-200",
  ],
};
export default function TaskEvents({ items, busy, onAdd, onCopy, onGuide }) {
  return items.length ? (
    items.map((e) => {
      const [label, accent, badge] = styles[e.category];
      return (
        <div
          key={e.key}
          className={`event-radar-card border-t-[3px] ${accent} border border-[#e2e8f0] p-3 flex flex-col justify-between gap-2`}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-1.5">
              <span
                className={`px-2 py-0.5 rounded-md text-[11px] font-black border ${badge}`}
              >
                {label} {e.days === 0 ? "D-Day" : `D-${e.days}`}
              </span>
              <span className="text-[11px] font-mono font-extrabold text-[#475569] bg-[#f8fafc] px-2 py-0.5 rounded-md border border-[#e2e8f0]">
                {e.date}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-6 h-6 rounded-lg bg-[#121314] text-white font-black text-xs flex items-center justify-center shrink-0">
                  {e.customer_name[0]}
                </span>
                <span className="text-[14px] font-black text-[#121314] truncate">
                  {e.customer_name}
                </span>
                <span className="text-[11px] font-bold text-[#64748b]">
                  고객
                </span>
              </div>
              <button
                type="button"
                disabled={!e.phone}
                onClick={() => onCopy(e.phone)}
                className="px-2 py-0.5 rounded-md bg-[#f8fafc] hover:bg-primary-soft text-[#121314] hover:text-primary border border-[#e2e8f0] text-[11px] font-mono font-extrabold shrink-0"
              >
                📞 {e.phone || "미등록"}
              </button>
            </div>
            <div className="p-2.5 rounded-xl bg-[#f8fafc] border border-[#eef2f6] space-y-0.5">
              <div className="text-[12.5px] font-black text-[#121314] leading-snug">
                {e.title}
              </div>
              <p className="text-[11px] font-semibold text-[#475569] leading-snug">
                {e.contract_id ? "내계약 참고일" : "내고객 생년월일"} 자동 감지
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 pt-0.5">
            {e.registered ? (
              <span className="flex-1 py-1.5 px-2.5 rounded-lg bg-primary-soft border border-emerald-300 text-[#00913f] text-[11.5px] font-black text-center flex items-center justify-center gap-1">
                <Icon name="check-circle-2" className="w-3.5 h-3.5" />할 일
                등록됨
              </span>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={() => onAdd([e.key])}
                className="flex-1 py-1.5 px-2.5 rounded-lg bg-[#03c75a] hover:bg-[#00b04e] text-white text-[11.5px] font-black shadow-2xs flex items-center justify-center gap-1 transition-all"
              >
                <Icon name="plus-circle" className="w-3.5 h-3.5" />+ 내 할 일
                등록
              </button>
            )}
            <button
              type="button"
              onClick={onGuide}
              className="px-2.5 py-1.5 rounded-lg bg-[#fffbeb] hover:bg-amber-100 text-[#b45309] border border-amber-300 text-[11.5px] font-black shrink-0 flex items-center gap-1 transition-colors"
            >
              <Icon name="message-circle" className="w-3.5 h-3.5" />
              카톡
            </button>
          </div>
        </div>
      );
    })
  ) : (
    <p className="text-xs font-bold text-[#64748b] py-4 col-span-full">
      이번 주에 해당하는 자동 이벤트가 없습니다.
    </p>
  );
}
