/* eslint-disable react/prop-types */
// Structure copied from the public-home HTML design reference.
import Icon from "./LandingIcon";
export default function VideoReference({ vm }) {
  return (
    <div className="bg-white w-full  rounded-3xl shadow-2xl border border-[#e6eaee] overflow-hidden flex flex-col max-h-[92vh]">
      <div className="bg-[#121314] text-white px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            id="pvModalBadge"
            className="px-2.5 py-1 rounded-xl bg-[#ff0033] text-white text-xs font-black shrink-0"
          >
            VIDEO {vm.video.num}
          </span>
          <h3
            id="pvModalTitle"
            className="text-base sm:text-lg font-black truncate"
          >
            {vm.video.title} ({vm.video.duration})
          </h3>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <a
            id="pvModalTopLink"
            href={`https://youtu.be/${vm.video.videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-1.5 rounded-xl bg-[#ff0033] hover:bg-rose-600 text-white text-xs font-black flex items-center gap-1"
          >
            <Icon name="play" className="w-3.5 h-3.5 fill-current" />
            <span>유튜브 새 탭 바로 실행 ↗</span>
          </a>
          <button
            type="button"
            className="text-slate-400 hover:text-white"
            aria-label="닫기"
            onClick={vm.close}
          >
            <Icon name="x" className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="p-5 sm:p-6 overflow-y-auto space-y-4 bg-[#f8fafc] text-xs">
        <div className="relative rounded-2xl overflow-hidden aspect-video bg-black border-2 border-[#121314] shadow-xl group">
          <img
            id="pvModalThumb"
            src={`https://i.ytimg.com/vi/${vm.video.videoId}/hq720.jpg`}
            alt=""
            className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center p-6 text-center">
            <a
              id="pvModalCenterLink"
              href={`https://youtu.be/${vm.video.videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-3 cursor-pointer"
            >
              <div className="w-20 h-20 rounded-full bg-[#ff0033] hover:bg-rose-600 text-white flex items-center justify-center shadow-2xl ring-8 ring-white/20 hover:scale-110 transition-all">
                <Icon name="play" className="w-9 h-9 fill-current ml-1" />
              </div>
              <span className="px-5 py-2.5 rounded-2xl bg-black/85 text-white font-black text-sm sm:text-base border border-white/20">
                클릭하여 YouTube에서 고화질 전체 영상 바로 재생 ↗
              </span>
            </a>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#e6eaee] space-y-2">
          <div className="font-black text-[#121314] text-sm">
            핵심 작동 프로세스 요약
          </div>
          <div
            id="pvModalSteps"
            className="space-y-1.5 text-[#4e5968] font-semibold"
          >
            {vm.video.steps.map((step, i) => (
              <div
                key={step}
                className="p-2.5 rounded-xl bg-[#f8fafc] border border-[#e6eaee] font-bold text-[#121314]"
              >
                {i + 1}. {step}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="px-6 py-3 border-t border-[#e6eaee] bg-white flex justify-end shrink-0">
        <button
          type="button"
          onClick={vm.close}
          className="px-4 py-2 rounded-xl border border-[#d1d6db] text-[#4e5968] font-bold"
        >
          닫기
        </button>
      </div>
    </div>
  );
}
