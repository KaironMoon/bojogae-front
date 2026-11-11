// Structure copied from the public-home HTML design reference.

export default function SummarySample() {
  return (
    <div className="p-5 rounded-2xl bg-white border border-[#e6eaee] space-y-3">
      <div className="flex items-center justify-between border-b pb-3">
        <div>
          <span className="px-2 py-0.5 rounded bg-primary text-white text-[10px] font-black">
            고객님 맞춤 1장 브리핑
          </span>
          <h4 className="text-base font-black mt-1">
            KB 고당지 맞춤 3.5.5 간편건강보험 (20년납 100세만기)
          </h4>
        </div>
        <div className="text-right font-black text-lg text-primary">
          월 149,372원
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-3.5 rounded-xl bg-[#f8fafc] border">
          <strong className="text-primary">
            01. 암 진단 및 비급여 암 통합치료비 Plus
          </strong>
          <br />
          일반암 2,000만 / 유사암 400만 / 비급여 암통합치료비 연간 1억 한도
        </div>
        <div className="p-3.5 rounded-xl bg-[#f8fafc] border">
          <strong className="text-sub">02. 뇌·심장 2대 질환 및 납입지원</strong>
          <br />
          뇌혈관·허혈성심장 각 1,000만 / 유사암 진단 시 보험료 납입지원 총
          730만원
        </div>
        <div className="p-3.5 rounded-xl bg-[#f8fafc] border">
          <strong className="text-amber-700">
            03. 신특정순환계질환 통합치료비 III Plus
          </strong>
          <br />
          검사(CT/MRI)부터 혈전용해·수술·중환자실까지 연간 5,000만원 한도
        </div>
        <div className="p-3.5 rounded-xl bg-[#f8fafc] border">
          <strong className="text-sky-700">
            04. 입원 간병인 사용일당 풀케어
          </strong>
          <br />
          일반병원 15만 / 상급종합 20만 / 간호간병 7만
        </div>
      </div>
    </div>
  );
}
