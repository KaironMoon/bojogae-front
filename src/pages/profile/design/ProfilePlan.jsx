/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { getMyPlan } from '@/services/profile-service';
import { getPaymentConfig, getPayments, getPaymentMethods } from '@/services/payment-service';
import { planName } from '@/constants/plans';
import ProfileIcon from './ProfileIcon';
const date = value => value ? new Date(value).toLocaleDateString('ko-KR', {timeZone:'Asia/Seoul'}) : '예정 없음';
export default function ProfilePlan({onManage, onWallet}) {
 const {user} = useAuth();
 const [data,setData]=useState(null);const [error,setError]=useState('');
 const restricted=user?.role !== 'USER' || Boolean(user?.group_id);
 useEffect(()=>{let active=true;(async()=>{try{const [config,plan]=await Promise.all([getPaymentConfig(),getMyPlan()]);let billing=null,methods=null;
 if(config.enabled && config.eligible){[billing,methods]=await Promise.all([getPayments(),getPaymentMethods()]);}
 if(active)setData({config,plan,billing,methods});}catch{if(active)setError('구독 정보를 불러오지 못했습니다. 새로고침해 주세요.');}})();return()=>{active=false;};},[]);
 const sub=data?.billing?.subscription;const card=data?.methods?.cards?.find(c=>c.selected);const product=data?.config?.products?.[sub?.current_plan_code || data?.plan?.plan_code];
 return <section id="plan" className="ns-card p-6 bg-white space-y-4">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#f4f6f8]">
 <div className="flex items-center gap-2.5"><span className="w-8 h-8 rounded-xl bg-primary-soft text-primary flex items-center justify-center"><ProfileIcon name="credit-card" className="w-4 h-4" /></span><div><h2 className="text-base sm:text-lg font-black text-[#121314]">월간 구독권</h2><p className="text-xs font-semibold text-[#8b95a1]">나의 정기결제 플랜 상태 및 결제수단 관리</p></div></div>
 <button type="button" onClick={onManage} className="px-3.5 py-1.5 rounded-xl bg-[#121314] hover:bg-primary text-white text-xs font-black flex items-center gap-1.5 transition-colors"><ProfileIcon name="sparkles" className="w-3.5 h-3.5 text-emerald-400"/>요금제 변경 · 결제수단 관리</button></div>
 {error && <p role="alert" className="text-xs text-[#f04452]">{error}</p>}
 {restricted ? <div className="p-4 rounded-2xl bg-[#f8fafc] border border-[#e6eaee] flex items-start gap-3" role="status"><span className="w-8 h-8 rounded-xl bg-sub-soft text-sub flex items-center justify-center shrink-0"><ProfileIcon name="shield-alert" className="w-4 h-4"/></span><div><div className="flex items-center gap-2"><span className="text-xs font-black">관리자 / 그룹 계정 안내</span><span className="px-2 rounded bg-sub-soft text-sub text-[10px] font-black">{user?.group_id ? 'GROUP MODE' : 'ADMIN MODE'}</span></div><p className="text-xs font-semibold text-[#4e5968] mt-0.5">{user?.group_id ? '그룹 계정은 그룹 관리에서 이용 내역을 확인합니다. 개인 정기결제는 그룹에 속하지 않은 일반 회원 계정에서 이용할 수 있습니다.' : '관리자 계정은 개인 정기결제 대상이 아닙니다. 빌링 테스트는 그룹에 속하지 않은 일반 회원 계정으로 로그인해 진행해 주세요.'}</p></div></div>
 : !data ? <p role="status" className="text-xs">구독 정보 조회 중…</p> : <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
 <div className="p-4 rounded-2xl bg-primary-soft/50 border-2 border-primary flex flex-col justify-between gap-2"><span className="text-xs font-extrabold text-primary">{data.plan.is_manual_subscription ? '수동 구독' : sub?.is_active ? '구독 중' : planName(data.plan.plan_code)}</span><div><div className="text-lg font-black">{product?.name || planName(data.plan.plan_code)}</div><p className="text-xs font-bold text-[#4e5968]">이용기간 종료: {date(sub?.period_end || data.plan.current_period_end)}</p></div><button type="button" onClick={onManage} className="w-full py-2 rounded-xl bg-white border border-emerald-300 text-primary text-xs font-black">구독 관리</button></div>
 <div className="p-4 rounded-2xl bg-[#f8fafc] border border-[#e6eaee] flex flex-col justify-between gap-2"><div className="flex items-center justify-between"><span className="text-xs font-black text-[#4e5968]">등록된 정기결제 카드</span><ProfileIcon name="credit-card" className="w-4 h-4 text-[#8b95a1]"/></div><div><p className="text-sm font-black">{card ? `${card.alias || card.name}${card.number ? ` (${card.number})` : ''}` : '등록된 결제수단 없음'}</p><p className="text-[11px] font-semibold text-[#8b95a1]">{card?.unavailable ? '카드 상태 확인 필요' : card ? '선택된 자동결제 카드' : '결제수단 관리에서 확인해 주세요.'}</p></div><Link to="/payment-methods" className="block text-center w-full py-2 rounded-xl bg-white border border-[#d1d6db] text-[#121314] text-xs font-extrabold">결제 카드 관리</Link></div>
 <div className="p-4 rounded-2xl bg-[#fffbeb] border border-[#fde68a] flex flex-col justify-between gap-2"><span className="text-xs font-black text-[#92400e]">다음 결제 일정 · 이용 내역</span><div><p className="text-sm font-black">{date(data.methods?.next_payment_at)}</p><p className="text-[11px] font-semibold text-[#92400e]">잔여 이용량과 사용 내역을 확인하세요.</p></div><button type="button" onClick={onWallet} className="w-full py-2 rounded-xl bg-[#121314] text-white text-xs font-black">내꼬막 이용 내역 보기</button></div>
 </div>}
 </section>;
}
