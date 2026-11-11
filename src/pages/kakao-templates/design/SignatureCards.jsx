/* eslint-disable react/prop-types */
import TemplateIcon from "./TemplateIcon";
export default function SignatureCards({
  items,
  selectedId,
  busy,
  onSelect,
  onEdit,
  onDelete,
  onCopy,
}) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <article
          key={item.id}
          className={`ns-card snippet-item p-5 bg-white border-2 transition-all ${String(selectedId) === String(item.id) ? "is-selected" : "hover:border-primary"}`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#f1f5f9]">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <span
                className={`w-7 h-7 rounded-xl ${String(selectedId) === String(item.id) ? "bg-primary text-white" : "bg-[#f4f6f8] text-[#121314]"} flex items-center justify-center`}
              >
                <TemplateIcon name="pen-tool" className="w-3.5 h-3.5" />
              </span>
              <h2 className="text-[15px] font-black text-[#121314] tracking-tight">
                <button type="button" onClick={() => onSelect(String(item.id))}>
                  {item.title}
                </button>
              </h2>
              {String(selectedId) === String(item.id) && (
                <span className="px-2 py-0.5 rounded-md bg-sub-soft text-sub border border-[#ddd6fe] text-[10.5px] font-black">
                  우측 보조개톡 선택됨
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => onCopy(item.body)}
                className="px-2.5 py-1.5 rounded-xl bg-[#f4f6f8] hover:bg-slate-200 text-[#4e5968] text-xs font-extrabold flex items-center gap-1"
              >
                <TemplateIcon name="copy" className="w-3.5 h-3.5" />
                복사
              </button>
              <button
                type="button"
                disabled={busy}
                aria-label={`${item.title} 수정`}
                onClick={() => onEdit(item)}
                className="px-3 py-1.5 rounded-xl bg-primary-soft hover:bg-emerald-100 text-primary text-xs font-black flex items-center gap-1"
              >
                <TemplateIcon name="edit-3" className="w-3.5 h-3.5" />
                수정
              </button>
              <button
                type="button"
                disabled={busy}
                aria-label={`${item.title} 삭제`}
                onClick={() => onDelete(item)}
                className="px-2.5 py-1.5 rounded-xl hover:bg-rose-50 text-[#8b95a1] hover:text-[#f04452] text-xs font-bold"
              >
                삭제
              </button>
            </div>
          </div>
          <div className="mt-3 p-4 rounded-xl bg-[#f8fafc] border border-[#e6eaee] sig-clean-text">
            {item.body}
          </div>
          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-[#8b95a1]">
            <span>
              본문 길이:{" "}
              <strong className="text-[#4e5968]">
                {Array.from(item.body).length}
              </strong>{" "}
              / 5,000자
            </span>
            <span>
              최근 저장일:{" "}
              {item.updated_at
                ? new Date(item.updated_at).toLocaleDateString("ko-KR")
                : "미확인"}
            </span>
          </div>
        </article>
      ))}
    </div>
  );
}
