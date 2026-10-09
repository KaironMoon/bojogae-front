import { useEffect, useState } from 'react';
import { Alert, FormControlLabel, Stack, Switch, Typography } from '@mui/material';
import api from '@/services/api-caller';

const labels = {
  REPORT: '보고서 완료·실패', BILLING: '정기결제 실패', APPROVAL: '승인 요청·처리 결과',
  INQUIRY: '문의·건의 답변', REFUND: '환불 처리 결과', NOTICE: '새 공지',
};

export default function NotificationPreferences() {
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
  return <Stack sx={{ mt: 2 }}>
    {preferences && <>
      <Typography variant="body2" color="text.secondary">분류 설정은 알림을 허용한 모든 브라우저에 적용됩니다.</Typography>
      {preferences.map((item) => <FormControlLabel key={item.category} label={labels[item.category]}
        control={<Switch checked={item.enabled} disabled={busy} onChange={(_, checked) => change(item, checked)} />} />)}
    </>}
    {error && <Alert severity="error">{error}</Alert>}
  </Stack>;
}
