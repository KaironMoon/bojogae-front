/* eslint-disable react/prop-types */
// Structure copied from the public-home HTML design reference.
import Icon from "./LandingIcon";
export default function InquiryReference({ vm }) {
  return (
    <div className="bg-white w-full  rounded-3xl shadow-2xl border border-[#e6eaee] overflow-hidden">
      <div className="bg-[#121314] text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon name="building-2" className="w-5 h-5 text-amber-400" />
          <h3 className="text-base font-black">
            사무실 그룹 (GA 지점·사업단) 단체 도입 문의
          </h3>
        </div>
        <button
          type="button"
          className="text-slate-400 hover:text-white"
          aria-label="닫기"
          onClick={vm.close}
          disabled={vm.busy}
        >
          <Icon name="x" className="w-5 h-5" />
        </button>
      </div>
      <form className="p-6 space-y-3.5 text-xs" onSubmit={vm.submit}>
        {vm.feedback}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-black text-[#121314] mb-1">
              소속 GA / 지점명 *
            </label>
            <input
              type="text"
              required
              placeholder="예: 현대홈쇼핑 GA 강대한지점"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#d1d6db] font-bold"
              value={vm.values.organizationName}
              onChange={(e) => vm.update("organizationName", e.target.value)}
              disabled={vm.busy}
              aria-label="소속 GA / 지점명"
              maxLength="100"
            />
          </div>
          <div>
            <label className="block font-black text-[#121314] mb-1">
              도입 예정 설계사 인원 *
            </label>
            <input
              type="text"
              required
              placeholder="예: 25명"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#d1d6db] font-bold"
              value={vm.values.headcount}
              onChange={(e) => vm.update("headcount", e.target.value)}
              disabled={vm.busy}
              aria-label="도입 예정 설계사 인원"
              maxLength="100"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-black text-[#121314] mb-1">
              담당자 성함/직책 *
            </label>
            <input
              type="text"
              required
              placeholder="예: 홍길동 지점장"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#d1d6db] font-bold"
              value={vm.values.contactName}
              onChange={(e) => vm.update("contactName", e.target.value)}
              disabled={vm.busy}
              aria-label="담당자 성함/직책"
              maxLength="100"
            />
          </div>
          <div>
            <label className="block font-black text-[#121314] mb-1">
              연락처 *
            </label>
            <input
              type="tel"
              required
              placeholder="010-0000-0000"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#d1d6db] font-mono font-bold"
              value={vm.values.phone}
              onChange={(e) => vm.update("phone", e.target.value)}
              disabled={vm.busy}
              aria-label="연락처"
              maxLength="100"
            />
          </div>
        </div>
        <div>
          <label className="block font-black text-[#121314] mb-1">
            문의사항 (사번 로그인·공용 이용량·특강 요청 등)
          </label>
          <textarea
            rows="3"
            placeholder="단체 요금제 견적 및 지점 방문/줌 특강 안내를 희망합니다."
            className="w-full p-3.5 rounded-xl border border-[#d1d6db] font-semibold"
            value={vm.values.message}
            onChange={(e) => vm.update("message", e.target.value)}
            disabled={vm.busy}
            aria-label="문의사항"
            maxLength="4000"
          ></textarea>
        </div>
        <label className="block font-bold text-[#121314]">
          이메일 *
          <input
            type="email"
            required
            maxLength={320}
            value={vm.values.email}
            onChange={(e) => vm.update("email", e.target.value)}
            disabled={vm.busy}
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#d1d6db]"
          />
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            required
            checked={vm.values.privacyAgreed}
            onChange={(e) => vm.update("privacyAgreed", e.target.checked)}
            disabled={vm.busy}
          />
          상담을 위한 개인정보 수집·이용에 동의합니다.
        </label>
        <div className="flex items-center justify-between pt-2">
          <a
            href="https://pf.kakao.com/_xjaxjmX/chat"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary font-black hover:underline flex items-center gap-1"
          >
            💬 카카오톡 채널로 바로 문의하기 ↗
          </a>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="px-4 py-2.5 rounded-xl border border-[#d1d6db] font-bold text-[#4e5968]"
              aria-label="닫기"
              onClick={vm.close}
              disabled={vm.busy}
            >
              닫기
            </button>
            <button
              type="submit"
              className="ns-hero-cta px-5 py-2.5 rounded-xl text-white font-black"
              disabled={vm.busy}
            >
              단체 문의 접수하기
            </button>
          </div>
        </div>
      </form>

    </div>
  );
}
