/* eslint-disable react/prop-types */
// Markup copied from the FAQ design reference; live answers come from the API.
import Icon from "./FaqIcon";
export default function VideoCard({ v, vm }) {
  return (
    <div className="yt-card rounded-2xl border border-[#e6eaee] bg-white overflow-hidden flex flex-col justify-between group">
      <a
        href={`https://youtu.be/${v.videoId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="block relative aspect-video bg-[#0f172a] overflow-hidden cursor-pointer"
      >
        <img
          src={`${v.thumbUrl}`}
          alt={`${v.title}`}
          loading="lazy"
          className="yt-thumb-img w-full h-full object-cover transition-transform duration-300"
        />

        <div className="yt-play-overlay opacity-0 group-hover:opacity-100 transition-opacity bg-black/45 absolute inset-0 flex flex-col items-center justify-center gap-1.5">
          <div className="w-12 h-12 rounded-full bg-[#ff0033] text-white flex items-center justify-center shadow-xl">
            <Icon name="play" className="w-5 h-5 fill-current ml-0.5" />
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-black/80 text-white text-[10.5px] font-black">
            YouTube 바로 재생 ↗
          </span>
        </div>

        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-xs text-white text-[10px] font-black">
          {v.badge}
        </span>

        <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/85 text-white font-mono text-[10.5px] font-bold">
          {v.duration}
        </span>

        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/25">
          <div className="h-full bg-[#ff0033]"></div>
        </div>
      </a>

      <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2.5">
        <div>
          <a
            href={`https://youtu.be/${v.videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-xs sm:text-[13px] font-black text-[#121314] group-hover:text-primary leading-snug line-clamp-2 transition-colors"
            title={`${v.title}`}
          >
            {v.title}
          </a>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#8b95a1] mt-1.5">
            <span>재생시간 {v.duration}</span>
            <span>·</span>
            <span>공식 가이드</span>
          </div>
        </div>

        <div className="pt-2 border-t border-[#f1f5f9] flex items-center justify-between gap-1.5">
          <a
            href={`https://youtu.be/${v.videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-1.5 px-2.5 rounded-lg bg-[#ff0033] hover:bg-rose-600 text-white text-[11px] font-black flex items-center justify-center gap-1 transition-colors"
          >
            <Icon name="play" className="w-3 h-3 fill-current" />
            <span>바로 실행</span>
          </a>
          <button
            type="button"
            className="py-1.5 px-2.5 rounded-lg bg-[#f4f6f8] hover:bg-[#121314] hover:text-white text-[#4e5968] text-[11px] font-extrabold transition-colors"
            onClick={() => vm.openVideo(v.id)}
          >
            3단계 요약
          </button>
        </div>
      </div>
    </div>
  );
}
