/* eslint-disable react/prop-types */
// HTML structure copied from the insurer design reference.
import Icon from "./InsurerIcon";
import { Logo, Sector, PortalLink } from "./Elements";
export default function CardReference({ item, vm }) {
  const incall = item.incallMonitor || "미확인",
    cardType = item.cardType || "미확인";
  return (
    <article className="ns-card ns-card-interactive bg-white overflow-hidden flex flex-col justify-between">
      <div>
        <div
          className="h-1.5 w-full"
          style={{ backgroundColor: item.ciColor }}
        ></div>
        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2.5">
            <button
              className="flex items-center gap-3 cursor-pointer group min-w-0 text-left"
              onClick={vm.open}
              aria-label={item.name + " 자세히 보기"}
              type="button"
            >
              <Logo insurer={item.raw} />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className="text-[15px] font-black text-[#121314] group-hover:text-primary transition-colors truncate">
                    {item.name}
                  </h3>
                  <Sector kind={item.raw.kind} />
                </div>
                <p className="text-[11px] font-bold text-[#8b95a1] truncate mt-0.5 flex items-center gap-1">
                  <span className="truncate">{item.portalName}</span>
                  <span className="px-1.5 py-0.2 rounded bg-slate-100 text-[#4e5968] text-[9.5px] font-extrabold shrink-0">
                    {item.browserLabel}
                  </span>
                </p>
              </div>
            </button>

            <button
              title="즐겨찾기 등록/해제"
              className={`w-8 h-8 rounded-xl border ${item.fav ? "bg-[#fffbeb] border-[#fde68a] text-amber-500" : "border-[#e6eaee] text-slate-300 hover:text-amber-400"} flex items-center justify-center shrink-0 transition-colors`}
              onClick={vm.toggle}
              disabled={vm.disabled}
              aria-label={item.name + " 즐겨찾기"}
              aria-pressed={item.fav}
            >
              <Icon
                name="star"
                className={`w-4 h-4 ${item.fav ? "fill-amber-400 text-amber-500" : ""}`}
              />
            </button>
          </div>

          <div className="p-2.5 rounded-2xl bg-[#f8fafc] border border-[#e6eaee] space-y-1 text-xs">
            <button
              className="flex items-center justify-between px-1.5 py-1 rounded-lg hover:bg-white cursor-pointer group transition-colors text-left w-full"
              onClick={() => vm.copy(item.callCenter)}
              disabled={!item.callCenter || item.callCenter === "미확인"}
              type="button"
            >
              <span className="text-[11px] font-bold text-[#8b95a1] flex items-center gap-1.5">
                <Icon name="phone" className="w-3 h-3 text-primary" /> 고객센터
              </span>
              <span className="font-extrabold text-[#121314] group-hover:text-primary flex items-center gap-1">
                {item.callCenter}
                <Icon
                  name="copy"
                  className="w-3 h-3 text-[#8b95a1] opacity-70"
                />
              </span>
            </button>
            <button
              className="flex items-center justify-between px-1.5 py-1 rounded-lg hover:bg-white cursor-pointer group transition-colors text-left w-full"
              onClick={() => vm.copy(incall)}
              disabled={!incall || incall === "미확인"}
              type="button"
            >
              <span className="text-[11px] font-bold text-[#8b95a1] flex items-center gap-1.5">
                <Icon
                  name="phone-incoming"
                  className="w-3 h-3 text-emerald-600"
                />{" "}
                인콜 모니터링
              </span>
              <span className="font-extrabold text-[#121314] group-hover:text-primary flex items-center gap-1">
                {incall}
                <Icon
                  name="copy"
                  className="w-3 h-3 text-[#8b95a1] opacity-70"
                />
              </span>
            </button>
            <button
              className="flex items-center justify-between px-1.5 py-1 rounded-lg hover:bg-white cursor-pointer group transition-colors text-left w-full"
              onClick={() => vm.copy(item.agentDesk)}
              disabled={!item.agentDesk || item.agentDesk === "미확인"}
              type="button"
            >
              <span className="text-[11px] font-bold text-[#8b95a1] flex items-center gap-1.5">
                <Icon name="headphones" className="w-3 h-3 text-sub" /> 전산
                헬프데스크
              </span>
              <span className="font-extrabold text-sub flex items-center gap-1">
                {item.agentDesk}
                <Icon
                  name="copy"
                  className="w-3 h-3 text-[#8b95a1] opacity-70"
                />
              </span>
            </button>
            <button
              className="flex items-center justify-between px-1.5 py-1 rounded-lg hover:bg-white cursor-pointer group transition-colors text-left w-full"
              onClick={() => vm.copy(item.claimFax)}
              disabled={!item.claimFax || item.claimFax === "미확인"}
              type="button"
            >
              <span className="text-[11px] font-bold text-[#8b95a1] flex items-center gap-1.5">
                <Icon name="printer" className="w-3 h-3 text-amber-600" />{" "}
                보험금 청구 팩스
              </span>
              <span className="font-bold text-[#4e5968] group-hover:text-[#121314] flex items-center gap-1">
                {item.claimFax}
                <Icon
                  name="copy"
                  className="w-3 h-3 text-[#8b95a1] opacity-70"
                />
              </span>
            </button>
            <div className="flex items-center justify-between px-1.5 pt-1 border-t border-[#e6eaee] text-[10.5px]">
              <span className="font-bold text-[#8b95a1]">카드납 구분</span>
              <span className="font-extrabold text-primary">{cardType}</span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-1 pt-0.5">
            <div className="flex items-center gap-1 flex-wrap">
              <PortalLink
                href={item.homeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2 py-0.5 rounded-md bg-[#f4f6f8] hover:bg-slate-200 text-[#4e5968] text-[10.5px] font-extrabold flex items-center gap-0.5"
              >
                <span>홈페이지</span>
                <Icon name="arrow-up-right" className="w-2.5 h-2.5" />
              </PortalLink>
              <PortalLink
                href={item.claimGuideUrl || item.claimUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2 py-0.5 rounded-md bg-primary-soft hover:bg-emerald-100 text-primary text-[10.5px] font-extrabold flex items-center gap-0.5"
              >
                <span>청구안내</span>
                <Icon name="arrow-up-right" className="w-2.5 h-2.5" />
              </PortalLink>
              <PortalLink
                href={item.disclosureUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2 py-0.5 rounded-md bg-sub-soft hover:bg-purple-100 text-sub text-[10.5px] font-extrabold flex items-center gap-0.5"
              >
                <span>약관확인</span>
                <Icon name="arrow-up-right" className="w-2.5 h-2.5" />
              </PortalLink>
              <PortalLink
                href={item.claimFormUrl || item.claimUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2 py-0.5 rounded-md bg-amber-50 hover:bg-amber-100 text-[#92400e] text-[10.5px] font-extrabold flex items-center gap-0.5"
              >
                <span>청구양식</span>
                <Icon name="arrow-up-right" className="w-2.5 h-2.5" />
              </PortalLink>
            </div>
          </div>
        </div>
      </div>

      <div className="p-3 pt-0 grid grid-cols-12 gap-2">
        <button
          className="col-span-5 py-2.5 px-2.5 rounded-xl bg-[#f4f6f8] hover:bg-slate-200 text-[#121314] text-xs font-extrabold flex items-center justify-center gap-1 transition-colors"
          onClick={vm.open}
          aria-label={item.name + " 자세히 보기"}
        >
          <Icon name="info" className="w-3.5 h-3.5 text-sub" />
          <span>자세히 보기</span>
        </button>
        <PortalLink
          href={item.portalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="col-span-7 py-2.5 px-3 rounded-xl bg-primary hover:bg-[#00b04e] text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-2xs transition-all"
        >
          <span>GA/교차 전산</span>
          <Icon name="external-link" className="w-3.5 h-3.5" />
        </PortalLink>
      </div>
    </article>
  );
}
