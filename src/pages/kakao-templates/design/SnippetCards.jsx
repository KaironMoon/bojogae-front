/* eslint-disable react/prop-types */
import TemplateIcon from "./TemplateIcon";
const categories = {
  REPORT: [
    "📄 리포트·제안 전달",
    "bg-primary-soft text-primary border-emerald-200",
  ],
  CARE: ["🛡️ 면책·감액·상령일", "bg-sub-soft text-sub border-[#ddd6fe]"],
  CLAIM: ["🏥 청구서류·미청구", "bg-amber-50 text-amber-700 border-amber-200"],
  GREETING: ["🎂 생일·계절 안부", "bg-rose-50 text-rose-600 border-rose-200"],
};
export default function SnippetCards({
  items,
  selectedId,
  busy,
  onSelect,
  onPreview,
  onEdit,
  onDelete,
  onCopy,
}) {
  return (
    <div className="space-y-3">
      {items.map((item) => {
        const [label, badge] = categories[item.category] || categories.REPORT;
        return (
          <article
            key={item.id}
            className={`ns-card snippet-item p-5 bg-white border-2 transition-all ${String(selectedId) === String(item.id) ? "is-selected" : "hover:border-primary"}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#f1f5f9]">
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <span
                  className={`px-2 py-0.5 rounded-md border text-[10.5px] font-black ${badge}`}
                >
                  {label}
                </span>
                <h2 className="text-[15px] font-black text-[#121314] tracking-tight">
                  <button
                    type="button"
                    onClick={() => onSelect(String(item.id))}
                  >
                    {item.title}
                  </button>
                </h2>
                <button
                  type="button"
                  onClick={() => onCopy(`[[[${item.title}]]]`)}
                  title="클릭하여 치환 태그 복사"
                  className="px-2 py-0.5 rounded-lg bg-[#f5f3ff] hover:bg-[#ede9fe] text-[#6b38fb] border border-[#ddd6fe] text-[11px] font-black transition-colors"
                >
                  {`[[[${item.title}]]]`} 복사
                </button>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => onPreview(item)}
                  className="px-2.5 py-1.5 rounded-xl bg-[#121314] hover:bg-primary text-white text-xs font-black flex items-center gap-1 transition-colors"
                >
                  <TemplateIcon
                    name="eye"
                    className="w-3.5 h-3.5 text-emerald-400"
                  />
                  시뮬레이터 미리보기
                </button>
                <button
                  type="button"
                  disabled={busy}
                  aria-label={`${item.title} 수정`}
                  onClick={() => onEdit(item)}
                  className="px-2.5 py-1.5 rounded-xl bg-primary-soft hover:bg-emerald-100 text-primary text-xs font-black flex items-center gap-1"
                >
                  <TemplateIcon name="edit-3" className="w-3.5 h-3.5" />
                  수정
                </button>
                <button
                  type="button"
                  disabled={busy}
                  aria-label={`${item.title} 삭제`}
                  onClick={() => onDelete(item)}
                  className="px-2 py-1.5 rounded-xl hover:bg-rose-50 text-[#8b95a1] hover:text-[#f04452] text-xs font-bold"
                >
                  삭제
                </button>
              </div>
            </div>
            <div className="mt-3 p-4 rounded-xl bg-[#f8fafc] border border-[#e6eaee] bp-clean-text">
              {item.body}
            </div>
            <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-[#8b95a1]">
              <span
                className={
                  item.body.includes("[[[이름]]]")
                    ? "text-[#00913f] font-extrabold"
                    : ""
                }
              >
                {item.body.includes("[[[이름]]]")
                  ? "✓ [[[이름]]] 고객 실명 자동치환 포함"
                  : "일반 상용구"}
              </span>
              <span>
                {Array.from(item.body).length} / 5,000자 ·{" "}
                {item.updated_at
                  ? `저장일 ${new Date(item.updated_at).toLocaleDateString("ko-KR")}`
                  : "저장일 미확인"}
              </span>
            </div>
          </article>
        );
      })}
    </div>
  );
}
