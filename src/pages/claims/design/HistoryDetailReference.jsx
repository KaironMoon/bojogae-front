/* eslint-disable react/prop-types */
// Markup copied from the claim history reference.
import Icon from "./ClaimIcon";
export default function HistoryDetailReference({ vm }) {
  return (
    <div className="bg-white w-full  rounded-3xl shadow-2xl border border-[#e6eaee] overflow-hidden my-auto">
      <div className="bg-[#121314] text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="w-7 h-7 rounded-xl bg-[#03c75a] text-white font-black text-xs flex items-center justify-center">
            <Icon name="file-check-2" className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-base font-black" id="modalClientTitle">
              {vm.detail.claim.insured_name} 고객님 청구내역 상세 정보
            </h3>
            <p className="text-[11px] text-slate-400" id="modalCreatedAtSub">
              작성일시: {vm.timestamp(vm.detail.created_at)}
            </p>
          </div>
        </div>
        <button
          className="text-slate-400 hover:text-white"
          onClick={vm.close}
          aria-label="닫기"
          disabled={vm.busy}
        >
          <Icon name="x" className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 space-y-4 max-h-[78vh] overflow-y-auto bg-[#f4f6f8]">
        {vm.error}

        <div className="bg-white p-4 rounded-2xl border border-[#e6eaee] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-[#121314] flex items-center gap-1.5">
              <Icon name="user-check" className="w-4 h-4 text-primary" />
              <span>저장된 청구 공통 정보 (주민번호 뒷자리 마스킹 보관)</span>
            </span>
            <span
              id="modalActionTypeBadge"
              className="px-2.5 py-0.5 rounded-full bg-primary-soft text-primary text-[11px] font-black"
            >
              {vm.detail.save_mode === "FILE" ? "파일 저장" : "팩스 요청"}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs bg-[#f8fafc] p-3.5 rounded-xl border border-[#e6eaee]">
            <div>
              <div className="text-[10.5px] font-bold text-[#8b95a1]">
                피보험자 성명
              </div>
              <div
                id="modalInsuredName"
                className="font-black text-[#121314] mt-0.5"
              >
                {vm.detail.claim.insured_name}
              </div>
            </div>
            <div>
              <div className="text-[10.5px] font-bold text-[#8b95a1]">
                주민등록번호
              </div>
              <div className="font-extrabold text-[#121314] mt-0.5">
                {vm.detail.claim.insured_id}
              </div>
            </div>
            <div>
              <div className="text-[10.5px] font-bold text-[#8b95a1]">
                사고(진료)일자
              </div>
              <div
                id="modalAccidentDate"
                className="font-black text-primary mt-0.5"
              >
                {vm.detail.claim.accident_date}
              </div>
            </div>
            <div className="col-span-2">
              <div className="text-[10.5px] font-bold text-[#8b95a1]">
                청구 사유 / 진단명
              </div>
              <div className="font-bold text-[#121314] mt-0.5">
                {vm.detail.claim.accident_description}
              </div>
            </div>
            <div>
              <div className="text-[10.5px] font-bold text-[#8b95a1]">
                첨부 병원서류
              </div>
              <div className="font-extrabold text-sub mt-0.5">
                {vm.detail.files.length}건
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#e6eaee] space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-[#121314] flex items-center gap-1.5">
              <Icon name="building-2" className="w-4 h-4 text-sub" />
              <span>대상 보험사 및 팩스번호 (클릭 시 복사)</span>
            </span>
            <span className="text-[11px] font-bold text-[#8b95a1]">
              모바일팩스 앱에 그대로 붙여넣으세요
            </span>
          </div>
          <div id="modalInsurersList" className="space-y-2">
            {vm.deliveries}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-primary-soft/70 border border-emerald-300 flex items-start gap-3">
          <Icon
            name="sparkles"
            className="w-5 h-5 text-primary shrink-0 mt-0.5"
          />
          <div className="text-xs space-y-1">
            <div className="font-black text-[#121314]">
              1시간이 지나 전송용 흑백 PDF가 만료되었나요?
            </div>
            <p className="font-semibold text-[#4e5968] leading-relaxed">
              피보험자 인적사항·계좌·사고내용과 첨부서류를 불러옵니다. 주민번호
              나머지 자리·모든 서명·가상팩스 번호는 다시 입력하고 개인정보
              동의도 다시 확인해 주세요.
            </p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-[#e6eaee]">
          {vm.extra}
        </div>
      </div>

      <div className="px-6 py-4 bg-white border-t border-[#e6eaee] flex flex-wrap items-center justify-between gap-2">
        <button
          disabled={vm.busy}
          onClick={vm.remove}
          className="px-3 py-2 text-xs font-bold text-[#f04452]"
        >
          삭제
        </button>
        <button
          className="px-4 py-2.5 rounded-xl border border-[#d1d6db] hover:bg-[#f4f6f8] text-xs font-extrabold text-[#121314] flex items-center gap-1.5"
          onClick={vm.download}
          disabled={vm.busy}
        >
          <Icon name="file-lock-2" className="w-4 h-4 text-sub" />
          <span>보관본 다운로드 (마스킹본)</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            className="px-4 py-2.5 rounded-xl border border-[#d1d6db] text-xs font-bold text-[#4e5968]"
            onClick={vm.close}
            aria-label="닫기"
            disabled={vm.busy}
          >
            닫기
          </button>
          <button
            className="ns-hero-cta px-5 py-2.5 rounded-xl text-white text-xs font-black flex items-center gap-1.5"
            onClick={vm.reuse}
            disabled={vm.busy}
          >
            <Icon name="copy-plus" className="w-4 h-4" />
            <span>이 내용 그대로 청구서 다시 만들기 →</span>
          </button>
        </div>
      </div>
    </div>
  );
}
