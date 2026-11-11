/* eslint-disable react/prop-types */
import Icon from "./FaqIcon";
export default function ContactModal({ vm }) {
  return (
    <div className="bg-white w-full  rounded-3xl shadow-2xl border border-[#e6eaee] overflow-hidden">
      <div className="bg-[#121314] text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-xl bg-[#fee500] text-[#191600] flex items-center justify-center font-black">
            <Icon name="message-circle" className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-base font-black">카카오톡 1:1 문의하기</h3>
            <p className="text-[11px] text-slate-400">
              공식 채널: https://pf.kakao.com/_xjaxjmX/chat
            </p>
          </div>
        </div>
        <button
          type="button"
          className="text-slate-400 hover:text-white"
          onClick={vm.closeContact}
          aria-label="닫기"
        >
          <Icon name="x" className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 space-y-4 text-xs">
        <div className="p-4 rounded-2xl bg-[#fee500]/25 border-2 border-[#fee500] flex items-center justify-between gap-3">
          <div>
            <div className="font-black text-sm text-[#121314]">
              보조개 카카오톡 채널 실시간 1:1 채팅
            </div>
            <p className="text-[11px] font-semibold text-[#4e5968] mt-0.5">
              아래 문의 양식을 복사해 카카오톡 채팅창에 붙여넣으시면 가장 빠르게
              확인됩니다.
            </p>
          </div>
          <a
            href="https://pf.kakao.com/_xjaxjmX/chat"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 rounded-xl bg-[#fee500] hover:bg-[#fdd800] text-[#191600] font-black shrink-0 shadow-xs"
          >
            카카오톡 채널 열기 ↗
          </a>
        </div>

        <div className="space-y-2.5">
          <div>
            <label className="block font-black text-[#121314] mb-1">
              문의 유형 선택
            </label>
            <select
              id="inquiryTypeSelect"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#d1d6db] font-extrabold text-[#121314] outline-none"
              value={vm.inquiryType}
              onChange={(e) => vm.changeInquiry(e.target.value)}
              aria-label="문의 유형 선택"
            >
              <option value="REPORT">
                📄 보고서 생성 오류 / 수치 확인 요청
              </option>
              <option value="BILLING">
                💳 정기결제 / 꼬막 충전 / 영수증 문의
              </option>
              <option value="FAX">📠 보험금 청구서 / 팩스 발송 문의</option>
              <option value="GROUP">
                🏢 사무실 그룹(GA 지점·사업단) 단체 도입 문의
              </option>
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-black text-[#121314]">
                문의 내용 (민감정보·카드번호·비밀번호는 제외해 주세요)
              </label>
              <button
                type="button"
                className="text-primary font-black hover:underline"
                onClick={() => vm.copy(vm.inquiryText)}
              >
                양식 복사하기
              </button>
            </div>
            <textarea
              id="inquiryBodyTextarea"
              rows="5"
              className="w-full p-3.5 rounded-xl border border-[#d1d6db] focus:border-primary font-semibold text-[#121314] leading-relaxed outline-none"
              value={vm.inquiryText}
              onChange={(e) => vm.setInquiryText(e.target.value)}
              maxLength="4000"
              aria-label="문의 내용"
            ></textarea>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            className="px-4 py-2.5 rounded-xl border border-[#d1d6db] font-bold text-[#4e5968]"
            onClick={vm.closeContact}
            aria-label="닫기"
          >
            닫기
          </button>
          <a
            href="https://pf.kakao.com/_xjaxjmX/chat"
            target="_blank"
            rel="noopener noreferrer"
            className="ns-hero-cta px-5 py-2.5 rounded-xl text-white font-black"
            onClick={() => vm.copy(vm.inquiryText)}
          >
            양식 복사 후 카카오톡 채널 열기 ↗
          </a>
        </div>
      </div>
    </div>
  );
}
