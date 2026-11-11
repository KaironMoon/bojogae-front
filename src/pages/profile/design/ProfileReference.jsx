/* eslint-disable react/prop-types */
// Structure and utility classes copied from 내정보 HTML; interactions use server APIs.
import ProfileIcon from "./ProfileIcon";
import ProfilePlan from "./ProfilePlan";
import NotificationPreferences from "../NotificationPreferences";
export default function ProfileReference({vm}) { return <main className="MuiBox-root css-h616tu max-w-[1280px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-20"><div id="viewProfileWorkspace" className="space-y-6">{vm.feedback}

                
                <div className="ns-card p-6 bg-white flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                    <div className="flex items-start sm:items-center gap-4">
                        
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#03c75a] to-[#008a60] text-white font-black text-2xl flex items-center justify-center shadow-md shrink-0 relative">
                            <span id="headerAvatarInitial">{vm.profile.name.slice(0,1) || '나'}</span>
                            <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-md bg-[#121314] text-emerald-400 text-[9px] font-black border border-white">{vm.user?.role === 'ADMIN' ? 'AD' : 'MY'}</span>
                        </div>

                        <div className="MuiStack-root css-1eintue space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="px-2.5 py-0.5 rounded-full bg-primary-soft text-primary border border-emerald-200 text-[11px] font-black">
                                    MY ACCOUNT & BILLING
                                </span>
                                <span id="headerBadgeAffiliation" className="px-2.5 py-0.5 rounded-full bg-sub-soft text-sub text-[11px] font-extrabold">{[vm.profile.affiliation, vm.profile.branch_name].filter(Boolean).join(' · ') || '소속을 입력해 주세요'}</span>
                            </div>
                            <div className="flex items-center gap-2.5 flex-wrap">
                                <h1 className="MuiTypography-root MuiTypography-h4 css-1j5jexe text-2xl sm:text-3xl font-black text-[#121314] tracking-tight">
                                    내 정보
                                </h1>
                                <span id="headerAgentSummary" className="text-sm font-extrabold text-primary">{`${vm.profile.name || '이름 미입력'} 설계사님${vm.profile.phone ? ` (${vm.profile.phone})` : ''}`}</span>
                            </div>
                            <p className="MuiTypography-root MuiTypography-body1 css-9tyrba text-xs sm:text-sm font-semibold text-[#4e5968]">
                                이메일은 필수이며, 변경하려면 새 이메일 인증이 필요합니다. 입력하신 소속·지점·연락처는 생성되는 리포트 하단 표기에 활용됩니다.
                            </p>
                        </div>
                    </div>

                    
                    <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                        <button className="cursor-pointer px-4 py-3 rounded-2xl bg-[#fffbeb] hover:bg-amber-100 border border-[#fde68a] flex items-center gap-3 transition-all" type="button" onClick={() => vm.navigate('/my-coins')}>
                            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center text-lg shadow-2xs">🐚</div>
                            <div >
                                <div className="text-[11px] font-extrabold text-[#92400e]">현재 보유 꼬막 (내꼬막)</div>
                                <div className="text-base font-black text-[#121314]">{vm.balance == null ? '조회 불가' : `${vm.balance.toLocaleString('ko-KR')} 꼬막`} <span className="text-[11px] font-bold text-amber-700 underline ml-1">내역 보기 ↗</span></div>
                            </div>
                        </button>
                    </div>
                </div>

                
                <ProfilePlan key={vm.billingRevision} onManage={vm.openBilling} onWallet={() => vm.navigate('/my-coins')} />

                
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                    
                    <div className="lg:col-span-7 MuiPaper-root MuiPaper-elevation MuiPaper-rounded MuiPaper-elevation0 css-1d1px1e ns-card p-6 bg-white">
                        <div className="MuiStack-root css-ctinhq space-y-5">

                            <div className="flex items-center justify-between pb-3 border-b border-[#f4f6f8]">
                                <div className="flex items-center gap-2.5">
                                    <span className="w-8 h-8 rounded-xl bg-primary-soft text-primary flex items-center justify-center">
                                        <ProfileIcon name="id-card" className="w-4 h-4" />
                                    </span>
                                    <div >
                                        <h2 className="text-base sm:text-lg font-black text-[#121314]">설계사 소속 · 기본 정보 수정</h2>
                                        <p className="text-xs font-semibold text-[#8b95a1]">리포트 하단 푸터 및 고객 안내용 프로필 정보입니다.</p>
                                    </div>
                                </div>
                                <span className="px-2.5 py-1 rounded-lg bg-[#f4f6f8] text-[#4e5968] text-[11px] font-extrabold">* 필수 입력</span>
                            </div>

                            
                            <div className="MuiStack-root css-1ov46kg space-y-4">

                                
                                <div className="MuiAutocomplete-root MuiAutocomplete-hasClearIcon css-1hdoajr relative">
                                    <div className="MuiFormControl-root MuiFormControl-fullWidth MuiTextField-root css-1vbfw84">
                                        <label className="MuiFormLabel-root MuiInputLabel-root css-o03sps block text-xs font-black text-[#121314] mb-1.5" htmlFor=":r5t:" id=":r5t:-label">
                                            GA 소속 <span aria-hidden="true" className="MuiFormLabel-asterisk css-12fvayo text-[#f04452]">*</span>
                                        </label>
                                        <div className="MuiInputBase-root MuiOutlinedInput-root MuiAutocomplete-inputRoot css-w2usau ns-input-box flex items-center px-3.5 py-2.5">
                                            <ProfileIcon name="building-2" className="w-4 h-4 text-primary mr-2.5 shrink-0" />
                                            <input aria-invalid="false" aria-describedby=":r5t:-helper-text" autoComplete="off" id=":r5t:" required type="text" className="MuiInputBase-input MuiOutlinedInput-input MuiAutocomplete-input css-lx0elr w-full text-xs sm:text-sm font-extrabold text-[#121314] outline-none bg-transparent" role="combobox" maxLength="100" value={vm.profile.affiliation} onChange={vm.updateField("affiliation")} disabled={vm.saving} onFocus={() => vm.setGaOpen(true)} onBlur={() => vm.setGaOpen(false)} onKeyDown={vm.gaKeyDown} aria-expanded={vm.gaOpen} aria-controls="profile-ga-options" aria-autocomplete="list" aria-activedescendant={vm.gaIndex >= 0 ? `profile-ga-${vm.gaIndex}` : undefined} />
                                            <div className="MuiAutocomplete-endAdornment css-iuka1o flex items-center gap-1">
                                                <button tabIndex="-1" type="button" aria-label="Clear" title="지우기" className="MuiButtonBase-root MuiIconButton-root MuiAutocomplete-clearIndicator css-1o3l9i0 w-6 h-6 rounded-lg hover:bg-[#f4f6f8] text-[#8b95a1] hover:text-[#121314] flex items-center justify-center" onClick={() => vm.updateField('affiliation')({target:{value:''}})}>
                                                    <ProfileIcon name="x" className="w-3.5 h-3.5" />
                                                </button>
                                                <button type="button" className="w-6 h-6 rounded-lg hover:bg-[#f4f6f8] text-[#4e5968] flex items-center justify-center" onClick={() => vm.setGaOpen(!vm.gaOpen)} aria-label="소속 목록 보기">
                                                    <ProfileIcon name="chevron-down" className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                        <p className="MuiFormHelperText-root css-liazc4 text-[11px] font-semibold text-[#8b95a1] mt-1" id=":r5t:-helper-text">
                                            예: 현대홈쇼핑, 에이플러스 · 목록에 없는 회사도 직접 입력할 수 있습니다.
                                        </p>
                                    </div>

                                    
                                    {vm.gaOpen && <div id="profile-ga-options" role="listbox" className="absolute left-0 right-0 top-[76px] z-30 bg-white rounded-2xl border-2 border-primary shadow-xl p-2 max-h-52 overflow-y-auto space-y-1">{vm.gaOptions.map((option,index) => <button type="button" role="option" aria-selected={vm.gaIndex === index} id={`profile-ga-${index}`} key={option} onMouseDown={e => e.preventDefault()} onClick={() => vm.selectGa(option)} className={`w-full text-left p-2 rounded-xl text-xs font-bold ${vm.gaIndex === index ? "bg-primary-soft text-primary" : "hover:bg-primary-soft"}`}>{option}</button>)}{!vm.gaOptions.length && <p className="p-2 text-xs text-[#8b95a1]">{vm.gaError ? "자동완성을 불러오지 못했습니다. 직접 입력해 주세요." : "목록에 없는 회사도 직접 입력할 수 있습니다."}</p>}</div>}
                                </div>

                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="MuiFormControl-root MuiTextField-root css-1pv2xcc">
                                        <label className="MuiFormLabel-root MuiInputLabel-root css-o03sps block text-xs font-black text-[#121314] mb-1.5" htmlFor=":r60:" id=":r60:-label">
                                            지점명 (선택)
                                        </label>
                                        <div className="MuiInputBase-root MuiOutlinedInput-root css-113l0n9 ns-input-box flex items-center px-3.5 py-2.5">
                                            <ProfileIcon name="map-pin" className="w-4 h-4 text-[#8b95a1] mr-2 shrink-0" />
                                            <input aria-invalid="false" aria-describedby=":r60:-helper-text" id=":r60:" type="text" maxLength="150" className="MuiInputBase-input MuiOutlinedInput-input css-1emfee7 w-full text-xs sm:text-sm font-bold text-[#121314] outline-none bg-transparent" value={vm.profile.branch_name} onChange={vm.updateField("branch_name")} disabled={vm.saving} />
                                        </div>
                                        <p className="MuiFormHelperText-root css-liazc4 text-[11px] font-semibold text-[#8b95a1] mt-1" id=":r60:-helper-text">
                                            예: 강대한 지점, 브릿지 사업단
                                        </p>
                                    </div>

                                    <div className="MuiFormControl-root MuiTextField-root css-1pv2xcc">
                                        <label className="MuiFormLabel-root MuiInputLabel-root css-o03sps block text-xs font-black text-[#121314] mb-1.5" htmlFor=":r61:" id=":r61:-label">
                                            이름 <span aria-hidden="true" className="MuiFormLabel-asterisk css-12fvayo text-[#f04452]">*</span>
                                        </label>
                                        <div className="MuiInputBase-root MuiOutlinedInput-root css-113l0n9 ns-input-box flex items-center px-3.5 py-2.5">
                                            <ProfileIcon name="user" className="w-4 h-4 text-primary mr-2 shrink-0" />
                                            <input aria-invalid="false" autoComplete="name" id=":r61:" required type="text" maxLength="100" className="MuiInputBase-input MuiOutlinedInput-input css-1emfee7 w-full text-xs sm:text-sm font-extrabold text-[#121314] outline-none bg-transparent" value={vm.profile.name} onChange={vm.updateField("name")} disabled={vm.saving} />
                                        </div>
                                        <p className="text-[11px] font-semibold text-[#8b95a1] mt-1">리포트 담당 설계사 실명 표기</p>
                                    </div>
                                </div>

                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="MuiFormControl-root MuiTextField-root css-1pv2xcc">
                                        <label className="MuiFormLabel-root MuiInputLabel-root css-o03sps block text-xs font-black text-[#121314] mb-1.5" htmlFor=":r62:" id=":r62:-label">
                                            전화번호 <span aria-hidden="true" className="MuiFormLabel-asterisk css-12fvayo text-[#f04452]">*</span>
                                        </label>
                                        <div className="MuiInputBase-root MuiOutlinedInput-root css-113l0n9 ns-input-box flex items-center px-3.5 py-2.5">
                                            <ProfileIcon name="phone" className="w-4 h-4 text-primary mr-2 shrink-0" />
                                            <input aria-invalid="false" aria-describedby=":r62:-helper-text" autoComplete="tel" id=":r62:" required type="tel" maxLength="30" className="MuiInputBase-input MuiOutlinedInput-input css-1emfee7 w-full text-xs sm:text-sm font-extrabold text-[#121314] outline-none bg-transparent font-mono" value={vm.profile.phone} onChange={vm.updateField("phone")} disabled={vm.saving} />
                                        </div>
                                        <p className="MuiFormHelperText-root css-liazc4 text-[11px] font-semibold text-[#8b95a1] mt-1" id=":r62:-helper-text">
                                            연락받을 수 있는 전화번호를 입력해 주세요.
                                        </p>
                                    </div>

                                    <div className="MuiFormControl-root MuiFormControl-fullWidth MuiTextField-root css-1vbfw84">
                                        <label className="MuiFormLabel-root MuiInputLabel-root css-o03sps block text-xs font-black text-[#121314] mb-1.5" htmlFor=":r63:" id=":r63:-label">
                                            닉네임 (선택)
                                        </label>
                                        <div className="MuiInputBase-root MuiOutlinedInput-root css-10lgqqs ns-input-box flex items-center px-3.5 py-2.5">
                                            <ProfileIcon name="smile" className="w-4 h-4 text-[#8b95a1] mr-2 shrink-0" />
                                            <input aria-invalid="false" id=":r63:" type="text" maxLength="50" className="MuiInputBase-input MuiOutlinedInput-input css-1emfee7 w-full text-xs sm:text-sm font-bold text-[#121314] outline-none bg-transparent" value={vm.profile.nickname} onChange={vm.updateField("nickname")} disabled={vm.saving} />
                                        </div>
                                        <p className="text-[11px] font-semibold text-[#8b95a1] mt-1">게시판 및 커뮤니티 활동 시 표시</p>
                                    </div>
                                </div>
                            </div>

                            
                            <button tabIndex="0" type="button" className="MuiButtonBase-root MuiButton-root MuiButton-contained MuiButton-containedPrimary MuiButton-sizeLarge css-1p08or7 ns-hero-cta w-full py-3.5 px-6 rounded-2xl text-white text-sm font-black flex items-center justify-center gap-2 shadow-lg" onClick={vm.saveProfile} disabled={vm.saveDisabled}>
                                <span className="MuiButton-icon MuiButton-startIcon MuiButton-iconSizeLarge css-j2as55">
                                    <ProfileIcon name="save" className="w-4 h-4" />
                                </span>
                                <span >정보 저장</span>
                            </button>

                            
                            <div className="MuiBox-root css-1iot13w pt-4 border-t border-[#e6eaee]">
                                <div className="MuiStack-root css-1ov46kg p-4 rounded-2xl bg-[#f8fafc] border border-[#e6eaee] space-y-2.5" id="email-verification">
                                    <div className="flex items-center justify-between">
                                        <label className="MuiFormLabel-root MuiInputLabel-root css-o03sps text-xs font-black text-[#121314] flex items-center gap-1.5" htmlFor=":r65:" id=":r65:-label">
                                            <ProfileIcon name="mail-check" className="w-4 h-4 text-primary" />
                                            <span >이메일 <span aria-hidden="true" className="MuiFormLabel-asterisk css-12fvayo text-[#f04452]">*</span></span>
                                        </label>
                                        <span className="px-2 py-0.5 rounded-full bg-primary-soft text-primary border border-emerald-200 text-[10.5px] font-black flex items-center gap-1">{vm.savedEmail && !vm.pendingEmail ? "✓ 인증됨" : "인증 필요"}</span>
                                    </div>

                                    <div className="MuiFormControl-root MuiFormControl-fullWidth MuiTextField-root css-1vbfw84">
                                        <div className="flex flex-col sm:flex-row gap-2">
                                            <div className="MuiInputBase-root MuiOutlinedInput-root css-10lgqqs ns-input-box flex-1 flex items-center px-3.5 py-2.5 bg-white">
                                                <input aria-invalid="false" aria-describedby=":r65:-helper-text" id=":r65:" required type="email" className="MuiInputBase-input MuiOutlinedInput-input css-1emfee7 w-full text-xs sm:text-sm font-extrabold text-[#121314] outline-none bg-transparent" value={vm.profile.email} onChange={vm.updateField("email")} disabled={vm.saving} />
                                            </div>
                                            <button type="button" className="px-4 py-2.5 rounded-xl bg-[#121314] hover:bg-sub text-white text-xs font-black shrink-0 flex items-center justify-center gap-1.5 transition-colors" onClick={() => vm.setModal("email")}>
                                                <ProfileIcon name="send" className="w-3.5 h-3.5 text-emerald-400" />
                                                <span >새 이메일 인증·변경</span>
                                            </button>
                                        </div>
                                        <p className="MuiFormHelperText-root css-liazc4 text-[11px] font-semibold text-[#8b95a1] mt-1.5" id=":r65:-helper-text">{vm.pendingEmail ? `인증 대기: ${vm.pendingEmail}. 인증 전에는 기존 이메일이 유지됩니다.` : vm.savedEmail ? "현재 인증된 이메일입니다. 변경하려면 새 이메일 인증이 필요합니다." : "등록된 이메일이 없습니다. 이메일 인증을 완료해 주세요."}</p>
                                    </div>
                                {vm.user?.group_id && vm.savedEmail && <button type="button" className="text-xs text-sub font-bold" onClick={vm.resetOwnPassword} disabled={vm.saving}>등록 이메일로 비밀번호 재설정</button>}</div>
                            </div>

                        </div>
                    </div>

                    
                    <div className="lg:col-span-5 space-y-5">

                        
                        <div className="ns-card p-5 bg-[#121314] text-white space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-black text-emerald-400 flex items-center gap-1.5">
                                    <ProfileIcon name="sparkles" className="w-3.5 h-3.5" />
                                    <span >생성 보고서 하단 설계사 표기 미리보기</span>
                                </span>
                                <span className="px-2 py-0.5 rounded bg-white/10 text-[10px] font-bold text-slate-300">실시간 연동</span>
                            </div>
                            <div className="p-3.5 rounded-xl bg-white text-[#121314] flex items-center justify-between gap-2 text-xs shadow-md">
                                <div className="min-w-0">
                                    <div className="text-[10px] font-extrabold text-primary" id="previewCardAffiliation">{[vm.profile.affiliation, vm.profile.branch_name].filter(Boolean).join(' · ') || '소속 미입력'}</div>
                                    <div className="font-black text-sm text-[#121314] truncate mt-0.5" id="previewCardNamePhone">{`담당 컨설턴트: ${vm.profile.name || '이름 미입력'} ☎ ${vm.profile.phone || '전화번호 미입력'}`}</div>
                                </div>
                                <span className="px-2 py-1 rounded-lg bg-[#f4f6f8] text-[#4e5968] text-[10px] font-extrabold shrink-0" id="previewCardNick">{`닉네임: ${vm.profile.nickname || '미입력'}`}</span>
                            </div>
                        </div>

                        
                        <div className="MuiPaper-root MuiPaper-elevation MuiPaper-rounded MuiPaper-elevation0 css-67fwvi ns-card p-6 bg-white">
                            <div className="MuiStack-root css-18f2e6m space-y-4">

                                
                                <div className="MuiStack-root css-1hrnwp9 flex items-start justify-between gap-3 pb-4 border-b border-[#f4f6f8]">
                                    <div className="flex items-start gap-3">
                                        <div data-enabled={Boolean(vm.pushState?.subscribed)} id="notifStatusIconBox" className="MuiBox-root css-neszmk w-10 h-10 rounded-2xl bg-primary-soft text-primary flex items-center justify-center shrink-0">
                                            <ProfileIcon name="bell-ring" className="w-5 h-5" />
                                        </div>
                                        <div className="MuiBox-root css-0">
                                            <div className="flex items-center gap-2">
                                                <p className="MuiTypography-root MuiTypography-body1 css-12zrezq text-base font-black text-[#121314]">
                                                    브라우저 알림
                                                </p>
                                                <span data-enabled={Boolean(vm.pushState?.subscribed)} id="notifMasterStatusBadge" className="px-2 py-0.5 rounded-full bg-primary-soft text-primary text-[10.5px] font-black">{vm.pushState?.subscribed ? '알림 허용됨' : '알림 꺼짐'}</span>
                                            </div>
                                            <p className="MuiTypography-root MuiTypography-body2 css-15bh5wv text-xs font-semibold text-[#4e5968] mt-1 leading-relaxed">
                                                보고서 처리 결과, 결제 실패, 승인 요청과 답변을 이 브라우저로 알려드립니다.
                                            </p>
                                        </div>
                                    </div>

                                    <button id="masterNotifToggleBtn" tabIndex="0" type="button" className="MuiButtonBase-root MuiButton-root MuiButton-outlined MuiButton-outlinedInherit MuiButton-sizeMedium css-1gugw2a px-3 py-2 rounded-xl border border-[#d1d6db] hover:border-[#f04452] hover:text-[#f04452] text-xs font-extrabold text-[#4e5968] shrink-0 transition-colors" onClick={() => vm.setModal("push")} disabled={vm.pushBusy || !vm.pushState?.supported || !vm.pushState?.configured || vm.pushState?.permission === "denied"}>{vm.pushBusy ? "처리 중…" : vm.pushState?.subscribed ? "알림 해제" : "알림 받기"}</button>
                                </div>

                                
                                <NotificationPreferences design />{vm.pushFeedback}

                            </div>
                        </div>

                    </div>

                </div>{vm.extraSections}</div></main>; }
