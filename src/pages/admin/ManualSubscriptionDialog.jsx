/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react';
import { Alert, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { PAID_PLAN_CODES, PLAN_INFO, planName } from '@/constants/plans';
import { changeManualSubscription, getManualSubscription } from '@/services/auth-service';

const errors = {
  manual_subscription_account_unavailable: '활성 상태인 개인회원만 수동 구독을 시작할 수 있습니다.',
  manual_subscription_card_conflict: '카드 구독 또는 확인이 필요한 카드 결제가 있습니다. 결제 상태를 확인해 주세요.',
  manual_subscription_usage_pending: '처리 중인 월 꼬막 사용 건이 있습니다. 사용 결과를 확정한 뒤 다시 시도해 주세요.',
  manual_subscription_changed: '구독 상태가 바뀌었습니다. 창을 닫고 다시 열어 주세요.',
  manual_subscription_balance_changed: '월 꼬막 잔액이 바뀌었습니다. 창을 닫고 잔액을 다시 확인해 주세요.',
  manual_subscription_schema_required: '수동 구독 기능에 필요한 서버 설정이 아직 적용되지 않았습니다.',
  idempotency_conflict: '이전에 보낸 요청과 내용이 다릅니다. 창을 닫고 최신 구독 상태를 확인해 주세요.',
};

export default function ManualSubscriptionDialog({ member, requestKey, onClose, onDone }) {
  const [preview, setPreview] = useState(null);
  const [tier, setTier] = useState('');
  const [reason, setReason] = useState('');
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getManualSubscription(member.id).then(result => {
      if (active) setPreview(result);
    }).catch(() => {
      if (active) setError('현재 구독과 월 꼬막을 불러오지 못했습니다.');
    });
    return () => { active = false; };
  }, [member.id]);

  const ending = Boolean(preview?.subscription_id);
  const nextPoints = ending ? 0 : PLAN_INFO[tier]?.monthlyPoints;
  const submit = async () => {
    setWorking(true);
    setError('');
    try {
      const result = await changeManualSubscription(member.id, {
        plan_code: ending ? 'FREE' : tier,
        subscription_id: preview.subscription_id,
        expected_monthly_points: preview.monthly_points,
        idempotency_key: requestKey,
        reason: reason.trim(),
      });
      onDone(result);
    } catch (err) {
      setError(errors[err.response?.data?.detail] || '수동 구독을 처리하지 못했습니다.');
    } finally {
      setWorking(false);
    }
  };

  return <Dialog open onClose={() => !working && onClose()} fullWidth maxWidth="xs">
    <DialogTitle>{ending ? '수동 구독 종료' : '수동 구독 적용'}</DialogTitle>
    <DialogContent>
      <Stack spacing={2} sx={{ pt: 1 }}>
        <Typography>{member.name || member.display_name} · 고객 #{member.id}</Typography>
        {error && <Alert severity="error">{error}</Alert>}
        {!preview && !error && <CircularProgress size={24} />}
        {preview && <>
          <Typography variant="body2">현재 {planName(preview.plan_code)} · 월 꼬막 {preview.monthly_points.toLocaleString()}개</Typography>
          {ending ? <Alert severity="warning">즉시 무료 티어로 전환하고 남은 월 꼬막을 만료합니다.</Alert> : <>
            <TextField select required label="구독 티어" value={tier} disabled={working} onChange={event => setTier(event.target.value)}>
              {PAID_PLAN_CODES.map(code => <MenuItem key={code} value={code}>{planName(code)} · 월 {PLAN_INFO[code].monthlyPoints.toLocaleString()}꼬막</MenuItem>)}
            </TextField>
            <Typography variant="body2" color="text.secondary">결제를 확인한 회원에게 적용해 주세요. 월 꼬막은 관리자 종료 전까지 매월 갱신됩니다.</Typography>
          </>}
          {nextPoints != null && <Typography fontWeight={700}>처리 후 월 꼬막 {nextPoints.toLocaleString()}개</Typography>}
          <TextField required label="처리 사유" value={reason} disabled={working} multiline minRows={2}
            inputProps={{ maxLength: 500 }} onChange={event => setReason(event.target.value)} />
        </>}
      </Stack>
    </DialogContent>
    <DialogActions>
      <Button disabled={working} onClick={onClose}>닫기</Button>
      <Button variant="contained" color={ending ? 'error' : 'primary'} onClick={submit}
        disabled={working || !preview || !reason.trim() || (!ending && !tier)}>
        {working ? '처리 중…' : ending ? '즉시 종료' : '구독 적용'}
      </Button>
    </DialogActions>
  </Dialog>;
}
