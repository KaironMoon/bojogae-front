/* eslint-disable react/prop-types */
import { Link } from "react-router-dom";
import { promptPreviewImageUrl } from "@/services/prompt-service";
import { useState } from "react";
export default function ReportCard({ prompt, updated, onPreview }) {
  const [failed, setFailed] = useState(false);
  const image = prompt.preview_images?.[0];
  return (
    <article className="report-fan-card min-w-[235px] sm:min-w-[250px] max-w-[250px] rounded-2xl border border-[#e6eaee] hover:border-primary bg-white overflow-hidden flex flex-col justify-between transition-all hover:shadow-md shrink-0">
      <button
        type="button"
        onClick={() => onPreview(prompt)}
        aria-label={`${prompt.title} 미리보기`}
        className="h-34 bg-gradient-to-br from-[#f1f5f9] via-[#ecfdf5]/50 to-[#f5f3ff]/60 relative flex items-center justify-center overflow-hidden border-b border-[#f1f5f9]"
      >
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="fan-sheet fan-sheet-left w-18 h-24 rounded-lg bg-white border border-slate-200 shadow-sm p-1.5 absolute transform -translate-x-3 -rotate-6 opacity-85" />
          <div className="fan-sheet fan-sheet-right w-18 h-24 rounded-lg bg-white border border-slate-200 shadow-sm p-1.5 absolute transform translate-x-3 rotate-6 opacity-85" />
          <div className="fan-sheet fan-sheet-center w-24 h-26 rounded-xl bg-white border-2 border-[#cbd5e1] shadow-md p-2 relative z-10 flex flex-col justify-between">
            {image && !failed ? (
              <img
                className="w-full h-full object-contain"
                src={promptPreviewImageUrl(
                  prompt.id,
                  prompt.preview_image_revision,
                  image.id,
                )}
                onError={() => setFailed(true)}
                alt=""
              />
            ) : (
              <>
                <div className="h-3.5 rounded bg-[#121314] px-1.5 flex items-center justify-between text-[7.5px] font-black text-emerald-400">
                  <span>BOJOGAE AI</span>
                  <span>REPORT</span>
                </div>
                <div className="text-[8.5px] font-black text-[#121314] leading-tight line-clamp-2 my-1">
                  {prompt.title}
                </div>
                <div className="text-[7px] font-bold text-primary border-t border-slate-100 pt-0.5 text-right">
                  {image ? "이미지 확인 불가" : "보고서 안내"}
                </div>
              </>
            )}
          </div>
        </div>
      </button>
      <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2.5">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span
              className={`px-2 py-0.5 rounded-md text-[10.5px] font-black ${updated ? "bg-sub-soft text-sub" : "bg-primary-soft text-primary"}`}
            >
              {updated ? "업데이트" : "신규"}
            </span>
            <button
              type="button"
              onClick={() => onPreview(prompt)}
              className="text-[11px] font-extrabold text-sub hover:underline"
            >
              미리보기
            </button>
          </div>
          <p
            className="text-xs sm:text-[13.5px] font-black text-[#121314] line-clamp-2 min-h-[38px] leading-snug"
            title={prompt.title}
          >
            {prompt.title}
          </p>
        </div>
        <div className="pt-2 border-t border-[#f1f5f9] flex items-center justify-between">
          <span className="px-2 py-0.5 rounded-md bg-[#fffbeb] text-[#b45309] border border-[#fde68a] text-[11px] font-black">
            🐚 {prompt.point_cost}꼬막
          </span>
          <Link
            to={`/proposals?promptId=${prompt.id}`}
            className="px-3 py-1 rounded-lg bg-primary-soft hover:bg-[#03c75a] text-primary hover:text-white text-xs font-black transition-colors"
          >
            만들기
          </Link>
        </div>
      </div>
    </article>
  );
}
