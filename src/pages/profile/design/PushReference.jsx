/* eslint-disable react/prop-types */
// Structure and utility classes copied from 内정보 HTML; interactions use server APIs.
import ProfileIcon from "./ProfileIcon";
export default function PushReference({vm}) { return <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-[#e6eaee] overflow-hidden">
            <div className="bg-[#121314] text-white px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <ProfileIcon name="bell-off" className="w-4 h-4 text-rose-400" />
                    <h3 className="text-base font-black" id="notifModalHeaderTitle">{vm.pushState?.subscribed ? '브라우저 푸시 알림 해제 확인' : '브라우저 푸시 알림 허용'}</h3>
                </div>
                <button className="text-slate-400 hover:text-white" onClick={vm.closeModal} aria-label="닫기"><ProfileIcon name="x" className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-4 text-xs">{vm.pushFeedback}
                <p id="notifModalBodyDesc" className="text-[#4e5968] font-semibold leading-relaxed">{vm.pushState?.subscribed ? '이 브라우저의 알림을 해제하시면 보고서 생성 완료·실패, 정기결제 실패, 환불 처리 결과 등의 실시간 푸시 알림을 받으실 수 없습니다. 계속하시겠습니까?' : '이 브라우저에서 보고서 처리 결과와 결제·승인·문의 알림을 받습니다. 브라우저의 알림 권한을 허용해 주세요.'}</p>
                <div className="flex items-center gap-2 pt-2">
                    <button type="button" className="flex-1 py-2.5 rounded-xl border border-[#d1d6db] font-bold text-[#4e5968]" onClick={vm.closeModal} aria-label="취소">취소</button>
                    <button type="button" id="notifModalConfirmBtn" className="flex-1 py-2.5 rounded-xl bg-[#f04452] hover:bg-rose-600 text-white font-black" onClick={vm.confirmPush} disabled={vm.pushBusy}>{vm.pushBusy ? "처리 중…" : vm.pushState?.subscribed ? "알림 해제하기" : "알림 허용하기"}</button>
                </div>
            </div>
        </div>; }
