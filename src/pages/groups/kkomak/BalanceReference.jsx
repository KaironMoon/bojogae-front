/* eslint-disable react/prop-types */
// Copied popup structure from 내꼬막 개편안.html; no simulation actions.
import WalletIcon from './WalletIcon';
import { amount } from './wallet-format';
export default function BalanceReference({wallet, onClose}) { return <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-[#e6eaee] overflow-hidden">
            <div className="bg-[#121314] text-white px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-lg">🐚</span>
                    <div >
                        <h3 className="text-base font-black">잔여 꼬막 상세 구성</h3>
                        <p className="text-[11px] text-slate-400">유효기간이 짧은 꼬막부터 자동으로 먼저 차감됩니다.</p>
                    </div>
                </div>
                <button type="button" aria-label="닫기" className="text-slate-400 hover:text-white" onClick={onClose}><WalletIcon name="x" className="w-4 h-4" /></button>
            </div>

            <div className="p-6 space-y-4 text-xs">
                
                <div className="p-4 rounded-2xl bg-primary-soft/60 border-2 border-primary flex items-center justify-between">
                    <div >
                        <div className="font-bold text-[#4e5968]">현재 사용 가능 꼬막 합계</div>
                        <div id="modalTotalAvailableText" className="text-2xl font-black text-primary mt-0.5">{amount(wallet.total_points)}</div>
                    </div>
                    <div className="text-right">
                        <div className="text-[11px] font-bold text-[#8b95a1]">총 보유: <span id="modalRawTotalText" className="text-[#121314] font-black">{amount(wallet.gross_points)}</span></div>
                        <div className="text-[11px] font-bold text-sub">예약 중 제외: <span id="modalReservedText" className="font-black">{amount(wallet.reserved_points)}</span></div>
                    </div>
                </div>

                
                {/* 유효기간별 상세 내역: 사용자 요청으로 임시 숨김
                <div className="space-y-2.5">
                    <div className="font-black text-[#121314] flex items-center justify-between">
                        <span >보유 꼬막 유효기간별 상세 내역</span>
                    </div>

                    {bucketRows}

                    

                    <div className="p-3.5 rounded-2xl bg-sub-soft/40 border border-purple-200 flex items-center justify-between">
                        <div >
                            <div className="flex items-center gap-1.5">
                                <span className="px-2 py-0.5 rounded bg-sub text-white text-[10px] font-black">잔액 제외</span>
                                <span className="font-black text-[#121314] text-sm">예약 중인 꼬막 (생성·발송 처리 대기)</span>
                            </div>
                            <div className="text-[11px] font-semibold text-[#4e5968] mt-1">AI 문서 생성 또는 PC 팩스 발송 진행 중 임시 홀딩된 수량</div>
                        </div>
                        <div className="text-right shrink-0">
                            <div id="modalReservedBucketAmount" className="text-base font-black text-sub">{amount(wallet.reserved_points)}</div>
                            <div className="text-[10px] font-bold text-sub">처리 결과에 따라 반환</div>
                        </div>
                    </div>
                </div>
                */}

                <div className="flex items-center justify-end pt-2">
                    
                    <button type="button" className="ns-hero-cta px-6 py-2.5 rounded-xl text-white font-black" onClick={onClose}>
                        확인
                    </button>
                </div>
            </div>
        </div>; }
