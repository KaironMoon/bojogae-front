/* eslint-disable react/prop-types */
// Structure copied from the public-home HTML design reference.
import Icon from "./LandingIcon";
export default function WeaponCard({ w, vm }) {
  return (
    <div className="p-5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#03c75a] flex flex-col justify-between space-y-4 transition-all">
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span
            className={`px-2.5 py-0.5 rounded-lg ${w.badgeColor} text-white font-mono text-xs font-black`}
          >
            무기 {w.num}
          </span>
          <span className="text-[11px] font-extrabold text-emerald-300">
            {w.cost}
          </span>
        </div>
        <h3 className="text-base font-black text-white">{w.title}</h3>
        <p className="text-xs font-semibold text-slate-300 leading-relaxed">
          {w.desc}
        </p>
      </div>
      <div className="pt-3 border-t border-white/10 flex items-center justify-between">
        <button
          type="button"
          className="text-xs font-black text-emerald-400 hover:underline flex items-center gap-1"
          onClick={() => vm.openVideo(w.ytIndex)}
        >
          <Icon name="play-circle" className="w-3.5 h-3.5" /> 작동 영상 보기
        </button>
        <button
          type="button"
          className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-[#03c75a] text-white text-[11px] font-bold transition-colors"
          onClick={() => vm.login("trial")}
        >
          무료 체험 →
        </button>
      </div>
    </div>
  );
}
