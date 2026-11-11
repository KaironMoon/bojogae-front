/* eslint-disable react/prop-types */
// HTML structure copied from the insurer design reference.
import Icon from "./InsurerIcon";
import { Logo, Sector, PortalLink } from "./Elements";
export default function RowReference({ item, vm }) {
  const incall = item.incallMonitor || "미확인",
    cardType = item.cardType || "미확인";
  return (
    <tr className="hover:bg-primary-soft/30 transition-colors">
      <td className="p-3 text-center">
        <button
          className="text-amber-500"
          onClick={vm.toggle}
          disabled={vm.disabled}
          aria-label={item.name + " 즐겨찾기"}
          aria-pressed={item.fav}
        >
          <Icon
            name="star"
            className={`w-4 h-4 mx-auto ${item.fav ? "fill-amber-400 text-amber-500" : "text-slate-300"}`}
          />
        </button>
      </td>
      <td className="p-3">
        <button
          className="flex items-center gap-3 cursor-pointer text-left"
          onClick={vm.open}
          aria-label={item.name + " 자세히 보기"}
          type="button"
        >
          <Logo insurer={item.raw} />
          <div>
            <div className="font-black text-[#121314] hover:text-primary">
              {item.name}
            </div>
            <div className="text-[10.5px] text-[#8b95a1]">{item.fullName}</div>
          </div>
        </button>
      </td>
      <td className="p-3">
        <Sector kind={item.raw.kind} />
      </td>
      <td className="p-3">
        <div className="font-extrabold text-[#121314]">{item.portalName}</div>
        <div className="text-[10.5px] text-[#8b95a1]">{item.browserLabel}</div>
      </td>
      <td className="p-3">
        <div className="flex flex-col gap-0.5">
          <button
            className="cursor-pointer font-extrabold text-[#121314] hover:text-primary text-left"
            onClick={() => vm.copy(item.callCenter)}
            disabled={!item.callCenter || item.callCenter === "미확인"}
            type="button"
          >
            고객센터: {item.callCenter}
          </button>
          <button
            className="cursor-pointer text-[11px] font-bold text-emerald-700 text-left"
            onClick={() => vm.copy(incall)}
            disabled={!incall || incall === "미확인"}
            type="button"
          >
            인콜모니터링: {incall}
          </button>
          <button
            className="cursor-pointer text-[11px] font-bold text-sub text-left"
            onClick={() => vm.copy(item.agentDesk)}
            disabled={!item.agentDesk || item.agentDesk === "미확인"}
            type="button"
          >
            헬프데스크: {item.agentDesk}
          </button>
        </div>
      </td>
      <td className="p-3">
        <div className="flex flex-col gap-0.5">
          <button
            className="cursor-pointer font-extrabold text-[#121314] hover:text-primary underline decoration-dotted text-left"
            onClick={() => vm.copy(item.claimFax)}
            disabled={!item.claimFax || item.claimFax === "미확인"}
            type="button"
          >
            {item.claimFax}
          </button>
          <span className="text-[10.5px] font-bold text-primary">
            카드납: {cardType}
          </span>
        </div>
      </td>
      <td className="p-3 text-right">
        <div className="inline-flex items-center gap-1.5">
          <button
            className="px-2.5 py-1.5 rounded-lg bg-[#f4f6f8] hover:bg-slate-200 text-[#121314] font-extrabold"
            onClick={vm.open}
            aria-label={item.name + " 자세히 보기"}
          >
            자세히 보기
          </button>
          <PortalLink
            href={item.disclosureUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1.5 rounded-lg bg-sub-soft text-sub font-extrabold"
          >
            약관
          </PortalLink>
          <PortalLink
            href={item.portalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg bg-primary text-white font-black inline-flex items-center gap-1"
          >
            전산 <Icon name="external-link" className="w-3 h-3" />
          </PortalLink>
        </div>
      </td>
    </tr>
  );
}
