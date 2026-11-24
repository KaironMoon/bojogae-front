/* eslint-disable react/prop-types */
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  MenuItem,
  Pagination,
  CircularProgress,
  TextField,
} from "@mui/material";

import { getPointGrants, grantFreePoints, recoverFreePoints } from "@/services/auth-service";

function defaultExpirationDate() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());
  const year = Number(parts.find((part) => part.type === "year").value);
  const month = Number(parts.find((part) => part.type === "month").value);
  const day = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return `${year}-${String(month).padStart(2, "0")}-${day}`;
}

export function createPointRequestKey() {
  if (typeof globalThis.crypto?.randomUUID === "function") return globalThis.crypto.randomUUID();
  return `point-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function canManageManualSubscription(user) {
  return Boolean(
    user && (user.manual_subscription_id || (!user.group_id && user.role === "USER" && user.status === "ACTIVE")),
  );
}

const recoveryErrors = {
  purchased_points_not_recoverable: '구매 꼬막은 회수할 수 없습니다.',
  point_grant_not_found: '지급 건을 찾을 수 없습니다.',
  point_grant_not_available: '만료되었거나 회수할 수 없는 지급 건입니다.',
  point_recovery_usage_pending: '처리 중인 사용 건이 있습니다. 사용 결과가 확정된 뒤 다시 시도해 주세요.',
  point_recovery_insufficient_balance: '잔여 꼬막이 부족합니다. 회수 모드를 다시 열어 잔액을 확인해 주세요.',
  idempotency_conflict: '요청 내용이 변경되었습니다. 창을 닫고 다시 시도해 주세요.',
  point_recovery_schema_required: '회수 기능에 필요한 DB 설정이 아직 적용되지 않았습니다.',
};

export default function GrantFreePointsDialog({ member, onClose, onDone }) {
  const [mode, setMode] = useState('GRANT');
  const [draft, setDraft] = useState({ amount: '', expirationDate: defaultExpirationDate(), reason: '', grantId: '' });
  const [requestKey, setRequestKey] = useState(createPointRequestKey);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const [grants, setGrants] = useState(null);
  const [page, setPage] = useState(1);
  const [loadError, setLoadError] = useState('');
  const submitting = useRef(false);
  const recovering = mode === 'RECOVER';
  const memberId = member?.id;

  useEffect(() => {
    if (!recovering || !memberId) return;
    let active = true;
    setGrants(null);
    setLoadError('');
    getPointGrants(memberId, page, 'ACTIVE').then(result => {
      if (active) setGrants(result);
    }).catch(() => {
      if (active) setLoadError('회수 대상 지급 건을 불러오지 못했습니다.');
    });
    return () => { active = false; };
  }, [memberId, recovering, page]);

  if (!member) return null;
  const candidates = (grants?.items || []).filter(g => g.point_type === 'FREE' && g.source !== 'PURCHASE' && g.available_amount > 0);
  const selected = candidates.find(g => g.id === draft.grantId);
  const changeDraft = patch => {
    setDraft(current => ({ ...current, ...patch }));
    setRequestKey(createPointRequestKey());
    setError('');
  };
  const changeMode = next => {
    setMode(next);
    setPage(1);
    changeDraft({ amount: '', reason: '', grantId: '' });
  };

  const submit = async () => {
    if (submitting.current) return;
    const amount = Number(draft.amount);
    if (!Number.isSafeInteger(amount) || amount < 1 || amount > 10000000 || !draft.reason.trim()
        || (recovering ? !selected || selected.reserved_amount > 0 || amount > selected.available_amount : !draft.expirationDate)) {
      setError(recovering ? '회수할 지급 건, 회수 수량, 회수 사유를 확인해 주세요.' : '지급 꼬막, 만료일, 지급 사유를 확인해 주세요.');
      return;
    }
    submitting.current = true;
    setWorking(true);
    setError('');
    try {
      const request = { amount, reason: draft.reason.trim(), idempotencyKey: requestKey };
      const result = recovering
        ? await recoverFreePoints(member.id, { ...request, grantId: draft.grantId })
        : await grantFreePoints(member.id, { ...request, expirationDate: draft.expirationDate });
      onDone({ member, amount, result, action: mode });
    } catch (error) {
      setError(recoveryErrors[error.response?.data?.detail] || (recovering ? '꼬막을 회수하지 못했습니다. 연결 오류라면 같은 내용으로 다시 시도해 주세요.' : '꼬막을 지급하지 못했습니다.'));
    } finally {
      submitting.current = false;
      setWorking(false);
    }
  };

  return (
    <Dialog open onClose={() => !working && onClose()} fullWidth maxWidth="sm">
      <DialogTitle>꼬막 지급·회수</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>{member.name || member.display_name} · 고객 #{member.id}</DialogContentText>
        <Stack spacing={2}>
          <TextField select label="처리 구분" value={mode} disabled={working} onChange={event => changeMode(event.target.value)}>
            <MenuItem value="GRANT">지급</MenuItem><MenuItem value="RECOVER">회수</MenuItem>
          </TextField>
          {error && <Alert severity="error">{error}</Alert>}
          {recovering && <>
            <Alert severity="info">지급 꼬막의 사용 가능한 잔여분만 회수할 수 있습니다. 구매 꼬막은 회수할 수 없습니다. 처리 중인 사용 건이 있는 지급 건은 결과 확정 후 회수해 주세요.</Alert>
            {loadError ? <Alert severity="error">{loadError}</Alert> : !grants ? <CircularProgress size={24} /> : <>
              <TextField select required label="회수할 지급 건" value={draft.grantId} disabled={working} onChange={event => changeDraft({ grantId: event.target.value, amount: '' })}>
                {candidates.map(g => <MenuItem key={g.id} value={g.id} disabled={g.reserved_amount > 0}>
                  #{g.id} · {g.reason || g.source} · 잔여 {g.available_amount.toLocaleString()}꼬막{g.reserved_amount > 0 ? ' (사용 처리 중)' : ''}
                </MenuItem>)}
              </TextField>
              {!candidates.length && <Alert severity="info">이 페이지에 회수 가능한 지급 건이 없습니다.</Alert>}
              {grants.total_pages > 1 && <Pagination page={page} count={grants.total_pages} disabled={working} onChange={(_, next) => { setPage(next); changeDraft({ grantId: '', amount: '' }); }} />}
            </>}
          </>}
          <TextField required label={recovering ? '회수 꼬막' : '지급 꼬막'} type="number" value={draft.amount} disabled={working}
            inputProps={{ min: 1, max: recovering ? selected?.available_amount || 10000000 : 10000000, step: 1 }}
            onChange={event => changeDraft({ amount: event.target.value })} />
          {!recovering && <TextField required type="date" label="만료일" value={draft.expirationDate} disabled={working}
            InputLabelProps={{ shrink: true }} helperText="선택한 날짜까지 사용 가능합니다. 한국 시간 기준 다음 날 00시에 만료됩니다."
            onChange={event => changeDraft({ expirationDate: event.target.value })} />}
          <TextField required label={recovering ? '회수 사유' : '지급 사유'} multiline minRows={2} value={draft.reason} disabled={working}
            inputProps={{ maxLength: 500 }} onChange={event => changeDraft({ reason: event.target.value })} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button disabled={working} onClick={onClose}>취소</Button>
        <Button disabled={working || (recovering && (!selected || selected.reserved_amount > 0))} color={recovering ? 'error' : 'primary'} variant="contained" onClick={submit}>
          {working ? '처리 중...' : recovering ? '회수' : '지급'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
