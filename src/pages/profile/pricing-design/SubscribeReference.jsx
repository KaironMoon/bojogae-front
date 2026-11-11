/* eslint-disable react/prop-types */
// Copied from the pricing HTML design; application data and actions are bound separately.
import Icon from "./PricingIcon";
export default function SubscribeReference({ vm }) {
  return (
    <div className="bg-white w-full  rounded-3xl shadow-2xl border border-[#e6eaee] overflow-hidden">
      <div className="bg-[#121314] text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-[#03c75a] text-white font-black text-xs flex items-center justify-center">
            ✓
          </span>
          <h3
            className="text-base font-black"
            id="subModalTitle"
          >{`${vm.plan.name} 요금제 신청`}</h3>
        </div>
        <button
          className="text-slate-400 hover:text-white"
          onClick={vm.close}
          aria-label="닫기"
          type="button"
        >
          <Icon name="x" className="w-4 h-4" />
        </button>
      </div>

      <div className="p-6 space-y-4">
        {vm.notice}
        <div className="p-4 rounded-2xl bg-primary-soft/60 border border-emerald-200 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[#4e5968]">선택한 상품</span>
            <span
              id="subModalPlanName"
              className="font-black text-[#121314] text-sm"
            >
              {vm.plan.name}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[#4e5968]">결제 금액</span>
            <span
              id="subModalPrice"
              className="font-black text-primary text-base"
            >{`${vm.plan.price} / ${vm.plan.priceUnit}`}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[#4e5968]">
              예상 문서 생성 횟수
            </span>
            <span id="subModalClams" className="font-extrabold text-[#92400e]">
              {vm.estimates[vm.code]}
            </span>
          </div>
        </div>

        <div className="space-y-2 text-xs text-[#4e5968] font-medium bg-[#f8fafc] p-3.5 rounded-2xl border border-[#e6eaee]">
          <div className="font-black text-[#121314] mb-1">
            ✅ 포함되는 공통 서비스
          </div>
          <div>• 실시간 8대 실전 무기 (53종 프롬프트 전체)</div>
          <div>• 40개 보험사 모바일 웹팩스 발송 무료 (PC 웹팩스는 유료)</div>
          <div>• 보조개톡(카톡 사후관리 자동발송 프로그램) 무료 이용</div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button
            className="flex-1 py-3 rounded-xl border border-[#d1d6db] hover:bg-[#f4f6f8] text-xs font-extrabold text-[#4e5968]"
            onClick={vm.close}
            aria-label="닫기"
            type="button"
          >
            닫기
          </button>
          <button
            className="flex-1 ns-hero-cta py-3 rounded-xl text-white text-xs font-black"
            onClick={vm.proceed}
            disabled={!vm.canApply}
            type="button"
          >
            {vm.proceedLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
