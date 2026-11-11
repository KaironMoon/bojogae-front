/* eslint-disable react/prop-types */
// Copied from the pricing HTML design; application data and actions are bound separately.
import Icon from "./PricingIcon";
export default function GroupReference({ vm }) {
  return (
    <div className="bg-white w-full  rounded-3xl shadow-2xl border border-[#e6eaee] overflow-hidden">
      <div className="bg-[#121314] text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-emerald-500 text-[#121314] text-[10px] font-black">
            GA ENTERPRISE
          </span>
          <h3 className="text-base font-black">
            사무실 그룹 (지점·본부·GA) 단체 도입 문의
          </h3>
        </div>
        <button
          className="text-slate-400 hover:text-white"
          onClick={vm.close}
          type="button"
          aria-label="닫기"
          disabled={vm.busy}
        >
          <Icon name="x" className="w-4 h-4" />
        </button>
      </div>

      <form className="p-6 space-y-3.5 text-xs" onSubmit={vm.submit}>
        {vm.feedback}
        <p className="text-[#4e5968] font-semibold">
          지점·본부·GA 단위 도입 시{" "}
          <strong>
            사번 기반 그룹 로그인, 지점장 관리자 대시보드, 단체 할인 및 실무
            자동화 무료 특강
          </strong>
          을 지원해 드립니다.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-black text-[#121314] mb-1">
              소속 GA / 지점명 *
            </label>
            <input
              type="text"
              placeholder="예: 현대홈쇼핑 수도GA3-3지점"
              className="w-full px-3 py-2.5 rounded-xl border border-[#d1d6db] focus:border-primary outline-none"
              value={vm.values.organizationName}
              onChange={(e) => vm.update("organizationName", e.target.value)}
              maxLength="150"
              disabled={vm.busy}
              aria-label="소속 GA / 지점명"
              required={true}
            />
          </div>
          <div>
            <label className="block font-black text-[#121314] mb-1">
              사용 예정 인원수 *
            </label>
            <input
              type="text"
              placeholder="예: 설계사 25명"
              className="w-full px-3 py-2.5 rounded-xl border border-[#d1d6db] focus:border-primary outline-none"
              value={vm.values.headcount}
              onChange={(e) => vm.update("headcount", e.target.value)}
              maxLength="100"
              disabled={vm.busy}
              aria-label="사용 예정 인원수"
              required={true}
            />
          </div>
          <div>
            <label className="block font-black text-[#121314] mb-1">
              담당자 성함 / 직책 *
            </label>
            <input
              type="text"
              placeholder="예: 김성춘 지점장"
              className="w-full px-3 py-2.5 rounded-xl border border-[#d1d6db] focus:border-primary outline-none"
              value={vm.values.contactName}
              onChange={(e) => vm.update("contactName", e.target.value)}
              maxLength="100"
              disabled={vm.busy}
              aria-label="담당자 성함 / 직책"
              required={true}
            />
          </div>
          <div>
            <label className="block font-black text-[#121314] mb-1">
              연락처 *
            </label>
            <input
              type="tel"
              placeholder="010-0000-0000"
              className="w-full px-3 py-2.5 rounded-xl border border-[#d1d6db] focus:border-primary outline-none"
              value={vm.values.phone}
              onChange={(e) => vm.update("phone", e.target.value)}
              maxLength="30"
              disabled={vm.busy}
              aria-label="연락처"
              required={true}
            />
          </div>
        </div>

        <div>
          <label className="block font-black text-[#121314] mb-1">
            문의 내용 (특강 요청 / 단체 견적 등)
          </label>
          <textarea
            rows="3"
            placeholder="지점 단체 도입 견적 및 실무 자동화 특강 일정을 문의합니다."
            className="w-full p-3 rounded-xl border border-[#d1d6db] focus:border-primary outline-none resize-none"
            value={vm.values.message}
            onChange={(e) => vm.update("message", e.target.value)}
            maxLength="4000"
            disabled={vm.busy}
            aria-label="문의 내용"
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
            className="w-full px-3 py-2.5 rounded-xl border border-[#d1d6db]"
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
        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            className="px-4 py-2.5 rounded-xl border border-[#d1d6db] font-bold text-[#4e5968]"
            onClick={vm.close}
            type="button"
            aria-label="닫기"
            disabled={vm.busy}
          >
            닫기
          </button>
          <button
            className="ns-hero-cta px-5 py-2.5 rounded-xl text-white font-black"
            type="submit"
            disabled={vm.busy}
          >
            단체 도입 문의 등록
          </button>
        </div>
      </form>
    </div>
  );
}
