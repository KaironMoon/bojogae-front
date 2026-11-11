/* eslint-disable react/prop-types */
// Markup copied from the FAQ design reference; live answers come from the API.
import Icon from "./FaqIcon";
export default function VideoModal({ vm }) {
  return (
    <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-[#e6eaee] overflow-hidden flex flex-col max-h-[93vh]">
      <div className="bg-[#121314] text-white px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <span
            id="vModalNumBadge"
            className="px-2.5 py-1 rounded-xl bg-[#ff0033] text-white font-black text-xs shrink-0"
          >
            {"VIDEO " + vm.video.num}
          </span>
          <div className="min-w-0">
            <h3
              id="vModalTitle"
              className="text-base sm:text-lg font-black truncate"
            >
              {vm.video.title}
            </h3>
            <p id="vModalSub" className="text-[11px] text-slate-400">
              {"재생시간 " + vm.video.duration}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <a
            id="vModalHeaderYtBtn"
            href={vm.video.watchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-1.5 rounded-xl bg-[#ff0033] hover:bg-rose-600 text-white text-xs font-black flex items-center gap-1.5 shadow-sm"
          >
            <Icon name="play" className="w-3.5 h-3.5 fill-current" />
            <span>유튜브에서 바로 실행 ↗</span>
          </a>
          <button
            type="button"
            className="text-slate-400 hover:text-white ml-1"
            aria-label="닫기"
            onClick={vm.close}
          >
            <Icon name="x" className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 bg-[#f8fafc] text-xs">
        <div className="rounded-2xl overflow-hidden bg-[#0f172a] border-2 border-[#121314] shadow-xl relative aspect-video group">
          <img
            id="vModalThumbImg"
            src={vm.video.thumbUrl}
            alt={vm.video.title}
            className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-300"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/30 flex flex-col items-center justify-center p-6 text-center">
            <a
              id="vModalCenterPlayLink"
              href={vm.video.watchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group/btn flex flex-col items-center gap-3 cursor-pointer"
            >
              <div className="w-20 h-20 rounded-full bg-[#ff0033] group-hover/btn:bg-rose-600 text-white flex items-center justify-center shadow-2xl ring-8 ring-white/20 group-hover/btn:scale-110 transition-all">
                <Icon name="play" className="w-9 h-9 fill-current ml-1" />
              </div>
              <div className="px-5 py-2.5 rounded-2xl bg-black/80 backdrop-blur-md border border-white/20 text-white font-black text-sm sm:text-base flex items-center gap-2 shadow-lg">
                <span>클릭하여 YouTube 영상 바로 재생하기</span>
                <Icon
                  name="external-link"
                  className="w-4 h-4 text-emerald-400"
                />
              </div>
            </a>
          </div>

          <div className="absolute top-3 left-3 px-3 py-1 rounded-lg bg-black/75 backdrop-blur-xs text-white text-[11px] font-black flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#03c75a] animate-pulse"></span>
            <span>BOJOGAE AI 공식 유튜브 (@bojogae-ai)</span>
          </div>
          <div
            id="vModalDurationBadge"
            className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-black/85 text-white font-mono text-xs font-black"
          >
            {vm.video.duration}
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#121314] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <Icon name="link" className="w-4 h-4 text-emerald-400 shrink-0" />
            <span
              id="vModalUrlText"
              className="text-xs font-mono text-emerald-300 truncate"
            >
              {vm.video.watchUrl}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1"
              onClick={() => vm.copy(vm.video.watchUrl)}
            >
              <Icon name="copy" className="w-3.5 h-3.5" /> 영상 링크 복사
            </button>
            <a
              id="vModalDirectWatchLink"
              href={vm.video.watchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-[#03c75a] hover:bg-[#00b04e] text-white text-xs font-black flex items-center gap-1"
            >
              <span>새 탭에서 영상 재생 ↗</span>
            </a>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#e6eaee] space-y-2.5 shadow-2xs">
          <div className="font-black text-[#121314] text-sm flex items-center gap-1.5">
            <Icon name="check-square" className="w-4 h-4 text-primary" />
            <span>이 영상의 핵심 활용 3단계 요약</span>
          </div>
          <div
            id="vModalStepsList"
            className="space-y-2 text-[#4e5968] font-semibold leading-relaxed"
          >
            {vm.video.steps.map((s) => (
              <div
                key={s}
                className="p-2.5 rounded-xl bg-[#f8fafc] border border-[#e6eaee] text-xs font-bold text-[#121314]"
              >
                {s}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            className="px-3.5 py-2 rounded-xl border border-[#d1d6db] bg-white hover:bg-[#f4f6f8] font-extrabold text-[#121314] flex items-center gap-1"
            onClick={() => vm.moveVideo(-1)}
          >
            <Icon name="chevron-left" className="w-4 h-4" /> 이전 영상
          </button>
          <button
            type="button"
            className="px-4 py-2 rounded-xl bg-primary-soft text-primary border border-emerald-200 font-black"
            onClick={vm.related}
          >
            관련 FAQ 질문·답변 펼치기 ↓
          </button>
          <button
            type="button"
            className="px-3.5 py-2 rounded-xl border border-[#d1d6db] bg-white hover:bg-[#f4f6f8] font-extrabold text-[#121314] flex items-center gap-1"
            onClick={() => vm.moveVideo(1)}
          >
            다음 영상 <Icon name="chevron-right" className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="px-6 py-3 border-t border-[#e6eaee] flex justify-end shrink-0">
        <button
          onClick={vm.close}
          className="px-4 py-2 rounded-xl border border-[#d1d6db] text-xs font-bold"
        >
          닫기
        </button>
      </div>
    </div>
  );
}
