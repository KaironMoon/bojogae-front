/* eslint-disable react/prop-types */
// Structure and utility classes copied from 内정보 HTML; interactions use server APIs.
import ProfileIcon from "./ProfileIcon";
export default function EmailReference({vm}) { return <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-[#e6eaee] overflow-hidden">
            <div className="bg-[#121314] text-white px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-xl bg-[#03c75a] text-white flex items-center justify-center"><ProfileIcon name="mail-check" className="w-4 h-4" /></span>
                    <h3 className="text-base font-black">새 이메일 주소 인증 및 변경</h3>
                </div>
                <button className="text-slate-400 hover:text-white" onClick={vm.closeModal} aria-label="닫기" type="button"><ProfileIcon name="x" className="w-4 h-4" /></button>
            </div>

            <div className="p-6 space-y-4 text-xs">{vm.feedback}
                <div className="p-3.5 rounded-2xl bg-[#f8fafc] border border-[#e6eaee]">
                    <div className="font-bold text-[#8b95a1]">현재 인증된 이메일</div>
                    <div id="modalCurrentEmailText" className="font-black text-[#121314] text-sm mt-0.5">{vm.savedEmail || "등록된 이메일 없음"}</div>
                </div>

                <div >
                    <label className="block font-black text-[#121314] mb-1.5">변경할 새 이메일 주소 *</label>
                    <div className="flex gap-2">
                        <input type="email" id="newEmailModalInput" placeholder="new_email@bojogae.net" value={vm.profile.email} className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#d1d6db] focus:border-primary font-bold text-[#121314] outline-none" onChange={vm.updateField("email")} disabled={vm.saving} aria-label="변경할 새 이메일 주소" />
                        <button type="button" className="px-3.5 py-2.5 rounded-xl bg-primary text-white font-black shrink-0 hover:bg-[#00b04e]" onClick={vm.sendEmailChange} disabled={vm.saving || !vm.emailChanged || !vm.profile.email}>
                            인증번호 발송
                        </button>
                    </div>
                </div>

                <div id="verifyCodeBox" className="p-4 rounded-2xl bg-primary-soft/60 border border-emerald-200 space-y-2.5" hidden={!vm.requestToken}>
                    <div className="flex items-center justify-between">
                        <span className="font-black text-[#121314]">이메일로 발송된 6자리 인증코드 입력</span>
                        <span className="font-mono font-black text-[#f04452]">인증번호</span>
                    </div>
                    <input type="text" id="emailVerifyCodeInput" maxLength="6" value={vm.code} className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-300 bg-white font-mono font-black text-base tracking-widest text-center text-[#121314] outline-none" onChange={e => vm.setCode(e.target.value.replace(/\D/g, "").slice(0,6))} inputMode="numeric" autoComplete="one-time-code" aria-label="6자리 인증번호" />
                    <p className="text-[11px] font-semibold text-[#4e5968]">이메일로 받은 인증번호를 입력해 주세요. 인증 완료 후 이메일이 변경됩니다.</p>
                </div>

                <div className="flex items-center gap-2 pt-2">
                    <button type="button" className="flex-1 py-3 rounded-xl border border-[#d1d6db] font-extrabold text-[#4e5968]" onClick={vm.closeModal}>취소</button>
                    <button type="button" className="flex-1 ns-hero-cta py-3 rounded-xl text-white font-black" onClick={vm.confirmEmailCode} disabled={vm.saving || !vm.requestToken || vm.code.length !== 6}>인증 완료 및 이메일 변경</button>
                </div>
            </div>
        </div>; }
