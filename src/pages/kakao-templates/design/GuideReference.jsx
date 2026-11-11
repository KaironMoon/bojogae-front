/* eslint-disable react/prop-types */
// HTML design copied first; data and events are supplied by the controller.
import TemplateIcon from "./TemplateIcon";
export default function GuideReference({ onClose }) {
  return (
    <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-[#e6eaee] overflow-hidden">
      <div className="bg-[#121314] text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-xl bg-[#03c75a] text-white flex items-center justify-center">
            <TemplateIcon name="monitor" className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-base font-black">
              보조개톡 Windows 전용 앱 연동 안내
            </h3>
            <p className="text-[11px] text-slate-400">
              웹에서 등록한 상용구·서명을 PC 카카오톡으로 자동 발송합니다
            </p>
          </div>
        </div>
        <button
          type="button"
          className="text-slate-400 hover:text-white"
          onClick={onClose}
          aria-label="닫기"
        >
          <TemplateIcon name="x" className="w-4 h-4" />
        </button>
      </div>

      <div className="p-6 space-y-4 text-xs">
        <div className="p-4 rounded-2xl bg-[#fffbeb] border border-[#fde68a] space-y-1">
          <div className="font-black text-[#92400e] text-sm">
            ⚠️ 실제 카톡 발송은 Windows 전용 앱에서 진행됩니다!
          </div>
          <p className="text-[#4e5968] font-semibold leading-relaxed">
            현재 보고 계신 웹 화면은 상용구와 서명을 편리하게 등록·수정하고 치환
            결과를 시뮬레이션하는 관리 페이지입니다.
          </p>
        </div>

        <div className="space-y-2.5">
          <div className="p-3.5 rounded-2xl bg-[#f8fafc] border border-[#e6eaee] flex items-start gap-3">
            <span className="w-6 h-6 rounded-lg bg-[#121314] text-white font-black flex items-center justify-center shrink-0">
              1
            </span>
            <div>
              <div className="font-black text-[#121314]">
                PC 카카오톡 로그인 후 [보조개톡 Windows 앱] 실행
              </div>
              <div className="text-[11px] text-[#4e5968] mt-0.5">
                보조개 웹 계정과 동일한 계정으로 로그인하면 내고객 및
                상용구·서명이 자동 연동됩니다.
              </div>
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-[#f8fafc] border border-[#e6eaee] flex items-start gap-3">
            <span className="w-6 h-6 rounded-lg bg-[#03c75a] text-white font-black flex items-center justify-center shrink-0">
              2
            </span>
            <div>
              <div className="font-black text-[#121314]">
                우측 3열 패널에서 상용구 [넣기] 및 서명 선택
              </div>
              <div className="text-[11px] text-[#4e5968] mt-0.5">
                선택한 친구/고객에게{" "}
                <code className="text-primary font-bold">[[[이름]]]</code>과{" "}
                <code className="text-sub font-bold">[[[상용구 제목]]]</code>이
                자동 치환되어 발송됩니다.
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            className="ns-hero-cta px-6 py-2.5 rounded-xl text-white font-black"
            onClick={onClose}
          >
            확인했습니다
          </button>
        </div>
      </div>
    </div>
  );
}
