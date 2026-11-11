/* eslint-disable react/prop-types */
import Icon from "./ClaimIcon";
export default function HistoryCard({ item, vm }) {
  return (
    <div
      className={`MuiPaper-root css-hzme58 ns-card ns-card-hover p-5 bg-white ${item.original_available ? "border-2 border-primary" : ""}`}
    >
      <div className="space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#f4f6f8]">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl font-black text-sm flex items-center justify-center shrink-0 ${item.deliveries.some((d) => d.status === "SUCCESS") ? "bg-primary text-white" : "bg-primary-soft text-primary"}`}
            >
              {item.insured_name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="css-fzdqdf text-sm sm:text-base font-black text-[#121314]">
                  {item.insured_name} ·{" "}
                  <span className="font-bold text-[#4e5968] text-xs sm:text-sm">
                    {vm.timestamp(item.created_at)}
                  </span>
                </p>
                <span className="px-2 py-0.5 rounded-md bg-[#f4f6f8] text-[#4e5968] text-[11px] font-extrabold">
                  보험사 {item.deliveries.length}곳
                </span>
              </div>
              <p className="css-zglo0v text-xs font-bold text-[#8b95a1] mt-0.5">
                사고일{" "}
                <strong className="text-[#121314]">{item.accident_date}</strong>{" "}
                · {item.save_mode === "FILE" ? "파일 저장" : "팩스 요청"}
              </p>
            </div>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${item.original_available ? "bg-primary-soft text-primary border border-emerald-300" : "bg-[#f4f6f8] text-[#8b95a1]"}`}
          >
            {item.original_available
              ? "전송용 흑백 원본 보관 중"
              : "전송용 1시간 만료 · 마스킹 보관본 유지 중"}
          </span>
        </div>
        <div className="space-y-2" aria-label="보험사별 팩스 전송 상태">
          {item.deliveries.map((d) => (
            <div
              key={d.id}
              className={`css-1u64yn7 p-3 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border ${d.status === "SUCCESS" ? "bg-primary-soft border-emerald-200" : "bg-[#f8fafc] border-[#e6eaee]"}`}
            >
              <div className="flex items-center gap-2.5 flex-wrap">
                <span
                  className={`w-2 h-2 rounded-full ${d.status === "SUCCESS" ? "bg-primary" : "bg-slate-400"}`}
                />
                <p className="text-xs sm:text-sm font-black text-[#121314]">
                  {d.insurer_name}
                </p>
                {vm.deliveryStatus(d)}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <div
                  className={`bg-white px-2.5 py-1 rounded-xl border ${d.fax_type === "VIRTUAL" ? "border-purple-200 text-sub" : "border-[#d1d6db]"}`}
                >
                  {vm.faxNumber(d)}
                </div>
                {item.original_available && vm.original(item, d)}
              </div>
            </div>
          ))}
        </div>
        <div className="css-kvb41a pt-2 border-t border-[#f4f6f8] flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              disabled={vm.busy}
              onClick={() => vm.open(item.id)}
              className="px-3.5 py-2 rounded-xl bg-primary-soft text-primary border border-emerald-200 text-xs font-black flex items-center gap-1.5"
            >
              <Icon name="copy-plus" />
              상세 보기 · 같은 내용으로 작성
            </button>
            <button
              disabled={vm.busy}
              onClick={() => vm.download(item.id)}
              className="px-3.5 py-2 rounded-xl bg-[#f4f6f8] text-[#121314] text-xs font-bold flex items-center gap-1.5"
            >
              <Icon name="file-lock-2" className="text-sub" />
              보관본 다운로드
            </button>
          </div>
          <button
            disabled={vm.busy}
            onClick={() => vm.remove(item.id, item.insured_name)}
            className="px-3 py-2 rounded-xl text-[#f04452] text-xs font-bold flex items-center gap-1"
          >
            <Icon name="trash-2" />
            삭제
          </button>
        </div>
      </div>
    </div>
  );
}
