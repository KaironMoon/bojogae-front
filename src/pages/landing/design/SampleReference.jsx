/* eslint-disable react/prop-types */
// Structure copied from the public-home HTML design reference.
import Icon from "./LandingIcon";
export default function SampleReference({ vm }) {
  return (
    <div className="bg-white w-full  rounded-3xl shadow-2xl border border-[#e6eaee] overflow-hidden flex flex-col max-h-[90vh]">
      <div className="bg-[#121314] text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded bg-[#03c75a] text-white text-xs font-black">
            SAMPLE PREVIEW
          </span>
          <h3 id="sampleModalTitle" className="text-base font-black">
            {vm.sampleTitle}
          </h3>
        </div>
        <button
          type="button"
          className="text-slate-400 hover:text-white"
          aria-label="닫기"
          onClick={vm.close}
        >
          <Icon name="x" className="w-5 h-5" />
        </button>
      </div>
      <div
        id="sampleModalBody"
        className="p-6 overflow-y-auto space-y-4 bg-[#f8fafc] text-xs"
      >
        <p className="text-[#8b95a1]">
          디자인 시안의 예시 데이터입니다. 실제 상품 조건과 다를 수 있습니다.
        </p>
        {vm.sampleBody}
      </div>
      <div className="px-6 py-4 bg-white border-t border-[#e6eaee] flex items-center justify-between">
        <span className="text-xs font-bold text-[#8b95a1]">
          무료 체험 가입 시 내 고객의 PDF로 즉시 생성해 보실 수 있습니다.
        </span>
        <button
          type="button"
          className="ns-hero-cta px-5 py-2.5 rounded-xl text-white text-xs font-black"
          onClick={() => vm.login("trial")}
        >
          내 제안서로 무료 생성해보기 →
        </button>
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
