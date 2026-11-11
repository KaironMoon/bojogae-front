/* eslint-disable react/prop-types */
// Copied popup structure from 내꼬막 개편안.html; no simulation actions.
import WalletIcon from './WalletIcon';
import { amount, date } from './wallet-format';
export default function TransactionReference({transaction, onClose}) { return <div className="wallet-transaction-content bg-white w-full max-w-md rounded-3xl shadow-2xl border border-[#e6eaee] overflow-hidden">
            <div className="bg-[#121314] text-white px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <WalletIcon name="file-text" className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-base font-black">꼬막 거래 상세 내역</h3>
                </div>
                <button type="button" aria-label="닫기" className="wallet-transaction-close text-slate-400 hover:text-white" onClick={onClose}><WalletIcon name="x" className="w-4 h-4" /></button>
            </div>

            <div className="p-6 space-y-4 text-xs">
                <div className="p-4 rounded-2xl bg-[#f8fafc] border border-[#e6eaee] space-y-2.5">
                    <div className="flex items-center justify-between">
                        <span className="font-bold text-[#8b95a1]">거래 일시</span>
                        <span id="txModalDate" className="font-mono font-bold text-[#121314]">{date(transaction.occurred_at)}</span>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                        <span className="font-bold text-[#8b95a1] shrink-0">거래 내역</span>
                        <span id="txModalDesc" className="font-black text-[#121314] text-right">{transaction.description}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="font-bold text-[#8b95a1]">변동 수량</span>
                        <span id="txModalDelta" className={`font-black text-sm ${transaction.credit ? "text-primary" : "text-[#f04452]"}`}>{transaction.credit ? `+${amount(transaction.credit)}` : `−${amount(transaction.debit)}`}</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-[#e6eaee]">
                        <span className="font-bold text-[#8b95a1]">거래 후 잔여 꼬막</span>
                        <span id="txModalAfter" className="font-black text-[#121314] text-sm">{amount(transaction.balance_after)}</span>
                    </div>
                </div>

                <div id="txRefundGuideBox" className="p-3.5 rounded-2xl bg-[#fffbeb] border border-[#fde68a] space-y-2" hidden={transaction.category !== 'DOC'}>
                    <div className="font-black text-[#92400e]">💡 문서 생성 오류로 꼬막이 차감되었나요?</div>
                    <p className="text-[11px] font-semibold text-[#4e5968] leading-relaxed">PDF 인식 오류나 AI 응답 실패로 정상적인 보고서가 생성되지 않은 경우의 <strong>사용 꼬막 반환({amount(transaction.debit)} 복원)</strong> 요청 기능은 준비중입니다.</p>
                </div>

                <div className="flex items-center gap-2 pt-1">
                    <button type="button" id="txRefundActionBtn" className="flex-1 py-2.5 rounded-xl bg-[#f4f6f8] hover:bg-rose-50 hover:text-[#f04452] border border-[#d1d6db] font-black text-[#121314] transition-colors" disabled={true} hidden={transaction.category !== 'DOC'}>사용 꼬막 반환 요청 · 준비중</button>
                    <button type="button" className="flex-1 ns-hero-cta py-2.5 rounded-xl text-white font-black" onClick={onClose}>
                        확인
                    </button>
                </div>
            </div>
        </div>; }
