/* eslint-disable react/prop-types */
// Markup copied from docs/design_improve/내꼬막 개편안.html; sample data/actions bound below.
import { Link } from 'react-router-dom';
import WalletIcon from './WalletIcon';
import { amount, number, date, reportCount, reportCost } from './wallet-format';
const filterClass = active => `px-3.5 py-2 rounded-xl text-xs font-black transition-all ${active ? 'bg-[#121314] text-white' : 'bg-[#f4f6f8] text-[#4e5968] hover:bg-slate-200'}`;
export default function WalletReference({ wallet, detail, rows, pagination, category, query, onQuery, onCategory, onBalance, onExport, exporting }) {
return <main className="MuiBox-root css-1rylx60 max-w-[1280px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-20">

            
            <div id="viewKkomakWorkspace" className="MuiPaper-root MuiPaper-elevation MuiPaper-rounded MuiPaper-elevation1 css-1tr048b space-y-6">
                <div className="MuiStack-root css-1ov46kg space-y-6">

                    
                    <div className="ns-card p-6 bg-white flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="px-2.5 py-0.5 rounded-full bg-[#fffbeb] text-[#b45309] border border-[#fde68a] text-[11px] font-black flex items-center gap-1">
                                    <span >🐚</span> KKOMAK WALLET &amp; LEDGER
                                </span>
                                <span className="px-2.5 py-0.5 rounded-full bg-primary-soft text-primary text-[11px] font-extrabold">
                                    {reportCost(wallet)}
                                </span>
                            </div>

                            <div className="flex items-center gap-3 flex-wrap">
                                <h5 className="MuiTypography-root MuiTypography-h5 css-j405rk text-2xl sm:text-3xl font-black text-[#121314] tracking-tight">
                                    내꼬막
                                </h5>
                                <span className="text-xs sm:text-sm font-extrabold text-[#4e5968]">
                                    나의 꼬막 잔액 구성 및 실시간 충전·사용 원장
                                </span>
                            </div>

                            <p className="MuiTypography-root MuiTypography-body2 css-pc1zp text-xs sm:text-sm font-semibold text-[#4e5968] leading-relaxed">
                                꼬막 증가·사용 내역과 합산 잔액을 확인할 수 있습니다. 잔여 꼬막의 구성은 사용 가능 꼬막 옆 상세에서 확인해 주세요. 예약 중인 꼬막은 사용 가능 잔액에서 제외됩니다.
                            </p>
                        </div>

                        
                        <div className="MuiTypography-root MuiTypography-body2 css-zglo0v flex flex-wrap items-center gap-2 shrink-0">
                            <Link to="/profile#plan" data-discover="true" className="px-4 py-2.5 rounded-xl bg-[#f4f6f8] hover:bg-primary-soft hover:text-primary text-[#121314] text-xs font-extrabold flex items-center gap-1.5 border border-[#e6eaee] transition-colors">
                                <WalletIcon name="credit-card" className="w-3.5 h-3.5 text-primary" />
                                <span >구독 관리</span>
                            </Link>
                            <span className="text-[#d1d6db] hidden sm:inline">·</span>
                            <Link to="/payment-history" data-discover="true" className="px-4 py-2.5 rounded-xl bg-[#f4f6f8] hover:bg-sub-soft hover:text-sub text-[#121314] text-xs font-extrabold flex items-center gap-1.5 border border-[#e6eaee] transition-colors">
                                <WalletIcon name="receipt" className="w-3.5 h-3.5 text-sub" />
                                <span >결제·환불 내역</span>
                            </Link>
                            
                        </div>
                    </div>

                    
                    <div className="MuiPaper-root MuiPaper-outlined MuiPaper-rounded css-fwbcl7 ns-card p-6 bg-white border-2 border-[#03c75a]/30 relative overflow-hidden">
                        <div className="grid grid-cols-1 gap-6 items-center">

                            
                            <div className="flex flex-col justify-between p-5 rounded-2xl bg-gradient-to-br from-[#121314] via-[#1c242b] to-[#0f291e] text-white shadow-lg">
                                <div className="flex items-center justify-between">
                                    <p className="MuiTypography-root MuiTypography-body1 css-10w9sjd text-xs font-extrabold text-emerald-300 flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-[#03c75a] animate-pulse"></span>
                                        <span >사용 가능 꼬막</span>
                                    </p>
                                    <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-[11px] font-bold text-amber-300">
                                        문서 약 <strong id="possibleReportCountText">{reportCount(wallet)}</strong>회 생성 가능
                                    </span>
                                </div>

                                <div className="MuiStack-root css-14w6tlm flex items-center justify-between gap-3 my-4">
                                    <div className="flex items-center gap-3">
                                        
                                        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center shrink-0">
                                            <img src="/images/kkomak.svg" width="26" height="26" alt="" aria-hidden="true" />
                                            
                                        </div>
                                        <div >
                                            <h5 id="mainAvailableKkomakText" className="MuiTypography-root MuiTypography-h5 css-zlve59 text-3xl sm:text-4xl font-black tracking-tight text-white">{amount(wallet.total_points)}</h5>
                                            <p className="text-[11px] font-semibold text-slate-300 mt-0.5">
                                                총 보유 <span id="totalRawKkomakText">{number(wallet.gross_points)}</span>꼬막 (예약 제외 <span id="reservedKkomakInline">{number(wallet.reserved_points)}</span>꼬막)
                                            </p>
                                        </div>
                                    </div>

                                    
                                    <button onClick={onBalance} tabIndex="0" type="button" aria-label="잔여 꼬막 상세" className="MuiButtonBase-root MuiButton-root MuiButton-text MuiButton-textPrimary MuiButton-sizeSmall css-l4i30l px-3.5 py-2 rounded-xl bg-[#03c75a] hover:bg-[#00b04e] text-white text-xs font-black flex items-center gap-1 shrink-0 shadow-md transition-all">
                                        <span >상세</span>
                                        <WalletIcon name="chevron-right" className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-300">
                                    <span >가장 빠른 소멸 예정: <strong >{wallet.next_expiration ? `${date(wallet.next_expiration)} (${amount(wallet.next_expiration_points)})` : "예정 없음"}</strong></span>
                                    <button type="button" onClick={onBalance} className="text-emerald-400 font-extrabold hover:underline">구성비 보기 ↗</button>
                                </div>
                            </div>

                            
                            {/* 잔액 구성 요약 카드 3개: 사용자 요청으로 임시 숨김
                            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                                
                                <div onClick={onBalance} role="button" tabIndex={0} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onBalance(); } }} className="cursor-pointer p-4 rounded-2xl bg-[#f8fafc] hover:bg-primary-soft/40 border border-[#e6eaee] hover:border-primary transition-all flex flex-col justify-between">
                                    <div className="flex items-center justify-between">
                                        <span className="px-2 py-0.5 rounded-md bg-primary-soft text-primary text-[10.5px] font-black">유효기간 순 차감</span>
                                        <WalletIcon name="calendar-clock" className="w-4 h-4 text-primary" />
                                    </div>
                                    <div className="my-2.5">
                                        <div className="text-xs font-bold text-[#4e5968]">월 구독 · 서비스 꼬막</div>
                                        <div id="subBucketText" className="text-xl font-black text-[#121314] mt-0.5">{amount(wallet.service_points)}</div>
                                    </div>
                                    <div className="text-[11px] font-semibold text-[#8b95a1]">
                                        지급 유형별 만료일 확인
                                    </div>
                                </div>

                                
                                <div onClick={onBalance} role="button" tabIndex={0} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onBalance(); } }} className="cursor-pointer p-4 rounded-2xl bg-[#fffbeb]/70 hover:bg-[#fffbeb] border border-[#fde68a] transition-all flex flex-col justify-between">
                                    <div className="flex items-center justify-between">
                                        <span className="px-2 py-0.5 rounded-md bg-amber-200/80 text-[#92400e] text-[10.5px] font-black">지급별 유효기간</span>
                                        <WalletIcon name="coins" className="w-4 h-4 text-amber-600" />
                                    </div>
                                    <div className="my-2.5">
                                        <div className="text-xs font-bold text-[#92400e]">추가 충전 · 반환 꼬막</div>
                                        <div id="bonusBucketText" className="text-xl font-black text-[#121314] mt-0.5">{amount(wallet.additional_points)}</div>
                                    </div>
                                    <div className="text-[11px] font-extrabold text-amber-700 underline">
                                        보유 꼬막 유효기간 확인하기
                                    </div>
                                </div>

                                
                                <div onClick={onBalance} role="button" tabIndex={0} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onBalance(); } }} className="cursor-pointer p-4 rounded-2xl bg-[#f8fafc] hover:bg-sub-soft/40 border border-[#e6eaee] hover:border-sub transition-all flex flex-col justify-between">
                                    <div className="flex items-center justify-between">
                                        <span className="px-2 py-0.5 rounded-md bg-sub-soft text-sub text-[10.5px] font-black">잔액 제외 항목</span>
                                        <WalletIcon name="hourglass" className="w-4 h-4 text-sub" />
                                    </div>
                                    <div className="my-2.5">
                                        <div className="text-xs font-bold text-[#4e5968]">현재 예약 중인 꼬막</div>
                                        <div id="reservedBucketText" className="text-xl font-black text-[#121314] mt-0.5">{amount(wallet.reserved_points)}</div>
                                    </div>
                                    <div className="text-[11px] font-extrabold text-sub">
                                        문서 생성·발송 처리 대기
                                    </div>
                                </div>
                            </div>
                            */}

                        </div>
                    </div>

                    
                    <div className="MuiPaper-root MuiPaper-elevation MuiPaper-rounded MuiPaper-elevation0 MuiAlert-root MuiAlert-colorInfo MuiAlert-standardInfo MuiAlert-standard css-1e6coiq p-4 rounded-2xl bg-[#f8fafc] border border-[#e6eaee] flex flex-col sm:flex-row sm:items-center justify-between gap-3" role="alert">
                        <div className="flex items-start sm:items-center gap-3">
                            <div className="MuiAlert-icon css-131is6g w-9 h-9 rounded-xl bg-primary-soft text-primary flex items-center justify-center shrink-0">
                                <svg className="MuiSvgIcon-root MuiSvgIcon-fontSizeInherit css-1l6e05h w-5 h-5 fill-current" focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="InfoOutlinedIcon">
                                    <path d="M11,9H13V7H11M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20, 12C20,16.41 16.41,20 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10, 10 0 0,0 12,2M11,17H13V11H11V17Z"></path>
                                </svg>
                            </div>
                            <div className="MuiAlert-message css-127h8j3 text-xs font-semibold text-[#4e5968] leading-relaxed">
                                개인 월 구독 꼬막은 결제 승인 후 지급되며 해당 구독 이용기간 종료 시 미사용분이 소멸하고 이월되지 않습니다. 업그레이드 추가 지급분도 같은 종료일에 소멸합니다. 무료체험은 가입 시 200꼬막을 한 번 지급하며 30일간 사용할 수 있습니다.
                            </div>
                        </div>
                        <button type="button" onClick={onBalance} className="px-3 py-2 rounded-xl bg-white border border-[#d1d6db] hover:border-primary text-[#121314] text-xs font-extrabold shrink-0">
                            차감 우선순위 안내
                        </button>
                    </div>

                    
                    <div className="ns-card bg-white overflow-hidden">

                        
                        <div className="p-4 sm:p-5 border-b border-[#e6eaee] flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <button type="button" onClick={() => onCategory('ALL')} id="filterTab_ALL" className={filterClass(category === 'ALL')} aria-pressed={category === 'ALL'}>
                                    전체 내역 (<span id="count_ALL">{number(detail.category_counts?.ALL)}</span>)
                                </button>
                                <button type="button" onClick={() => onCategory('PLUS')} id="filterTab_PLUS" className={filterClass(category === 'PLUS')} aria-pressed={category === 'PLUS'}>
                                    충전·지급·반환 (+<span id="count_PLUS">{number(detail.category_counts?.PLUS)}</span>)
                                </button>
                                <button type="button" onClick={() => onCategory('DOC')} id="filterTab_DOC" className={filterClass(category === 'DOC')} aria-pressed={category === 'DOC'}>
                                    문서 생성 차감 (<span id="count_DOC">{number(detail.category_counts?.DOC)}</span>)
                                </button>
                                <button type="button" onClick={() => onCategory('FAX')} id="filterTab_FAX" className={filterClass(category === 'FAX')} aria-pressed={category === 'FAX'}>
                                    팩스 발송 (<span id="count_FAX">{number(detail.category_counts?.FAX)}</span>)
                                </button>
                                <button type="button" onClick={() => onCategory('EXPIRE')} id="filterTab_EXPIRE" className={filterClass(category === 'EXPIRE')} aria-pressed={category === 'EXPIRE'}>
                                    유효기간 만료 (<span id="count_EXPIRE">{number(detail.category_counts?.EXPIRE)}</span>)
                                </button>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="relative flex-1 sm:w-64">
                                    <WalletIcon name="search" className="w-4 h-4 text-[#8b95a1] absolute left-3.5 top-1/2 -translate-y-1/2" />
                                    <input type="text" id="txSearchInput" placeholder="내역 검색 (예: 리모델링, 종합건강, 팩스)" className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-[#d1d6db] focus:border-primary text-xs font-bold text-[#121314] outline-none" value={query} onChange={event => onQuery(event.target.value)} aria-label="내역 검색" />
                                </div>
                                <button type="button" onClick={onExport} disabled={exporting} aria-label="엑셀 내보내기" className="px-3 py-2 rounded-xl border border-[#d1d6db] hover:border-[#121314] text-xs font-extrabold text-[#4e5968] flex items-center gap-1.5 shrink-0">
                                    <WalletIcon name="file-spreadsheet" className="w-3.5 h-3.5 text-primary" />
                                    <span className="hidden sm:inline">엑셀 내보내기</span>
                                </button>
                            </div>
                        </div>

                        
                        <div className="MuiTableContainer-root css-1skybqp overflow-x-auto">
                            <table className="MuiTable-root css-vzkx5t w-full text-left border-collapse" aria-label="꼬막 입출금 내역">
                                <thead className="MuiTableHead-root css-1xhptir bg-[#f8fafc] border-b border-[#e6eaee]">
                                    <tr className="MuiTableRow-root MuiTableRow-head css-108w8ac">
                                        <th className="MuiTableCell-root MuiTableCell-head MuiTableCell-sizeSmall css-18vrj9i py-3.5 px-4 text-xs font-black text-[#4e5968] whitespace-nowrap" scope="col">
                                            일시 (한국 시간)
                                        </th>
                                        <th className="MuiTableCell-root MuiTableCell-head MuiTableCell-sizeSmall css-3jadv6 py-3.5 px-4 text-xs font-black text-[#4e5968]" scope="col">
                                            내역 <span className="text-[11px] font-semibold text-[#8b95a1] ml-1">(행을 클릭하면 거래 상세를 확인할 수 있습니다)</span>
                                        </th>
                                        <th className="MuiTableCell-root MuiTableCell-head MuiTableCell-alignRight MuiTableCell-sizeSmall css-1p88ca3 py-3.5 px-4 text-xs font-black text-primary text-right whitespace-nowrap" scope="col">
                                            충전·지급
                                        </th>
                                        <th className="MuiTableCell-root MuiTableCell-head MuiTableCell-alignRight MuiTableCell-sizeSmall css-1p88ca3 py-3.5 px-4 text-xs font-black text-[#f04452] text-right whitespace-nowrap" scope="col">
                                            사용·소진
                                        </th>
                                        <th className="MuiTableCell-root MuiTableCell-head MuiTableCell-alignRight MuiTableCell-sizeSmall css-1p88ca3 py-3.5 px-4 text-xs font-black text-[#121314] text-right whitespace-nowrap" scope="col">
                                            거래 후 잔여 꼬막
                                        </th>
                                    </tr>
                                </thead>
                                <tbody id="kkomakTableBody" className="MuiTableBody-root css-y6j1my divide-y divide-[#f4f6f8] text-xs">{rows}</tbody>
                            </table>
                        </div>

                        
                        <div className="p-4 sm:p-5 bg-[#f8fafc] border-t border-[#e6eaee] flex flex-col sm:flex-row items-center justify-between gap-3">
                            <div className="text-xs font-bold text-[#8b95a1]">
                                현재 <strong id="currentPageIndicator" className="text-[#121314]">{detail.page}</strong> / {Math.max(1, detail.total_pages)} 페이지 · 총 <strong id="totalTxCountIndicator" className="text-[#121314]">{number(detail.total)}</strong>건의 꼬막 거래 기록
                            </div>

                            {pagination}
                        </div>

                    </div>

                </div>
            </div>

            
            

        </main>;
}
