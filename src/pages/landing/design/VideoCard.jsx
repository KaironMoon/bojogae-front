/* eslint-disable react/prop-types */
// Structure copied from the public-home HTML design reference.
import Icon from "./LandingIcon";
export default function VideoCard({ v, vm }) {
  return (
    <div className="ns-card ns-card-hover overflow-hidden bg-white flex flex-col justify-between group">
      <a
        href={`https://youtu.be/${v.videoId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="block relative aspect-video bg-black overflow-hidden"
      >
        <img
          src={`https://i.ytimg.com/vi/${v.videoId}/hq720.jpg`}
          alt={`${v.title}`}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-[#ff0033] text-white flex items-center justify-center shadow-lg">
            <Icon name="play" className="w-5 h-5 fill-current ml-0.5" />
          </div>
        </div>
        <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/75 text-white text-[10px] font-black">
          {v.badge}
        </span>
        <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/85 text-white font-mono text-[10px] font-bold">
          {v.duration}
        </span>
      </a>
      <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
        <div className="text-xs font-black text-[#121314] line-clamp-2 leading-snug">
          {v.title}
        </div>
        <div className="flex items-center gap-1.5">
          <a
            href={`https://youtu.be/${v.videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-1.5 rounded-lg bg-[#ff0033] hover:bg-rose-600 text-white text-[11px] font-black text-center"
          >
            ▶ 바로 실행
          </a>
          <button
            type="button"
            className="px-2.5 py-1.5 rounded-lg bg-[#f4f6f8] hover:bg-[#121314] hover:text-white text-[#4e5968] text-[11px] font-extrabold"
            onClick={() => vm.openVideo(v.id)}
          >
            요약
          </button>
        </div>
      </div>
    </div>
  );
}
