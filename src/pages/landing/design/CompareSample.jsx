// Structure copied from the public-home HTML design reference.

export default function CompareSample() {
  return (
    <div className="p-5 rounded-2xl bg-white border border-[#e6eaee] space-y-3">
      <div className="font-black text-sm">
        3사 핵심 담보 및 감액 조건 한눈에 비교 (56세/여/간호사)
      </div>
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="p-3 rounded-xl bg-sky-50 border-2 border-sky-500">
          <strong>신한라이프 (81,077원)</strong>
          <br />
          일반암 3천+특정암 3천
          <br />
          <span className="text-primary font-black">
            1년 감액 없음(즉시 100%)
          </span>
        </div>
        <div className="p-3 rounded-xl bg-[#f8fafc] border">
          <strong>삼성생명 (83,858원)</strong>
          <br />
          간편 3.10.5 유병자 유리
          <br />
          가족결합 최대 10% 할인
        </div>
        <div className="p-3 rounded-xl bg-[#f8fafc] border">
          <strong>삼성화재 (89,220원)</strong>
          <br />
          순환계 수술 1회당 1천만
          <br />
          병원동행 서비스 20회
        </div>
      </div>
    </div>
  );
}
