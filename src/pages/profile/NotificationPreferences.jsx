import { useEffect, useState } from 'react';
import { Alert, FormControlLabel, Stack, Switch, Typography } from '@mui/material';
import api from '@/services/api-caller';
import ProfileIcon from './design/ProfileIcon';

const labels = {
  REPORT: '보고서 완료·실패', BILLING: '정기결제 실패', APPROVAL: '승인 요청·처리 결과',
  INQUIRY: '문의·건의 답변', REFUND: '환불 처리 결과', NOTICE: '새 공지',
};

const details = {
 REPORT:['file-check-2','AI 리포트 생성 완료 또는 오류 발생 시 즉시 알림'],
 BILLING:['credit-card','월간 구독 카드 한도초과·오류 시 서비스 중단 방지 알림'],
 APPROVAL:['user-check','조직/지점 가입 승인 및 권한 변경 처리 알림'],
 INQUIRY:['message-square-more','문서 개선 건의 및 1:1 문의 관리자 답변 등록 알림'],
 REFUND:['rotate-ccw','오류 건 꼬막 반환 및 결제 취소 처리 완료 알림'],
 NOTICE:['megaphone','신규 프롬프트 출시 및 중요 업데이트 공지 알림'],
};
// eslint-disable-next-line react/prop-types
export default function NotificationPreferences({design = false}) {
  const [preferences, setPreferences] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    api.get('/api/v1/notification-channels').then(async ({ data }) => {
      if (!data.common_enabled) return;
      const response = await api.get('/api/v1/notification-preferences');
      if (active) setPreferences(response.data.preferences.filter((p) => p.channel === 'WEB_PUSH'));
    }).catch(() => { if (active) setError('알림 분류 설정을 불러오지 못했습니다.'); });
    return () => { active = false; };
  }, []);
  async function change(item, checked) {
    setBusy(true); setError('');
    try {
      const { data } = await api.put('/api/v1/notification-preferences', {
        preferences: [{ category: item.category, channel: 'WEB_PUSH', enabled: checked }],
      });
      setPreferences(data.preferences.filter((p) => p.channel === 'WEB_PUSH'));
    } catch { setError('알림 분류 설정을 저장하지 못했습니다.'); }
    finally { setBusy(false); }
  }
  if (design) return <div className="space-y-2.5">
    <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-[11.5px] font-bold text-[#8b95a1]">분류 설정은 알림을 허용한 모든 브라우저에 적용됩니다.</p><span className="text-[11px] font-extrabold text-[#8b95a1] flex items-center gap-1"><ProfileIcon name="volume-2" className="w-3 h-3"/>알림 테스트 발송 · 준비중</span></div>
    <div className="space-y-2 pt-1">{Object.entries(labels).map(([category,label]) => {
      const item=preferences?.find(p=>p.category===category);const enabled=Boolean(item?.enabled);
      return <label key={category} className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${enabled ? 'bg-[#f8fafc] border-[#e6eaee] hover:border-primary' : 'bg-slate-50/60 border-[#f4f6f8] opacity-60'}`}>
      <div className="flex items-center gap-3 min-w-0"><span className={`w-8 h-8 rounded-xl ${enabled ? 'bg-primary-soft text-primary' : 'bg-slate-200 text-[#8b95a1]'} flex items-center justify-center shrink-0`}><ProfileIcon name={details[category][0]} className="w-4 h-4"/></span><div className="min-w-0"><span className="text-xs sm:text-sm font-black text-[#121314] block">{label}</span><span className="text-[11px] font-semibold text-[#8b95a1] block">{details[category][1]}</span></div></div>
      <span className={`ns-switch-track ${enabled ? 'checked' : ''}`}><input type="checkbox" className="sr-only" aria-label={label} checked={enabled} disabled={busy || !item} onChange={e=>change(item,e.target.checked)}/><span className="ns-switch-thumb"/></span>
      </label>;
    })}</div>{!preferences && !error && <p className="text-xs text-[#8b95a1]">알림 분류 설정이 준비되지 않았습니다.</p>}{error && <Alert severity="error">{error}</Alert>}
  </div>;
  return <Stack sx={{ mt: 2 }}>
    {preferences && <>
      <Typography variant="body2" color="text.secondary">분류 설정은 알림을 허용한 모든 브라우저에 적용됩니다.</Typography>
      {preferences.map((item) => <FormControlLabel key={item.category} label={labels[item.category]}
        control={<Switch checked={item.enabled} disabled={busy} onChange={(_, checked) => change(item, checked)} />} />)}
    </>}
    {error && <Alert severity="error">{error}</Alert>}
  </Stack>;
}
