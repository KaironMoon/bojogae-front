/* eslint-disable react/prop-types */
import { useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  TextField,
} from "@mui/material";

import { grantFreePoints } from "@/services/auth-service";

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

export default function GrantFreePointsDialog({ member, onClose, onDone }) {
  const [draft, setDraft] = useState({ amount: "", expirationDate: defaultExpirationDate(), reason: "" });
  const [requestKey] = useState(createPointRequestKey);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");

  if (!member) return null;

  const submit = async () => {
    const amount = Number(draft.amount);
    if (!Number.isInteger(amount) || amount < 1 || !draft.reason.trim() || !draft.expirationDate) {
      setError("지급 꼬막, 만료일, 지급 사유를 확인해 주세요.");
      return;
    }
    setWorking(true);
    setError("");
    try {
      const result = await grantFreePoints(member.id, {
        ...draft,
        amount,
        reason: draft.reason.trim(),
        idempotencyKey: requestKey,
      });
      onDone({ member, amount, result });
    } catch {
      setError("꼬막을 지급하지 못했습니다.");
    } finally {
      setWorking(false);
    }
  };

  return (
    <Dialog open onClose={() => !working && onClose()} fullWidth maxWidth="xs">
      <DialogTitle>꼬막 지급</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          {member.name || member.display_name} 설계사 (#{member.id})에게 지급할 꼬막을 입력하세요.
        </DialogContentText>
        <Stack spacing={2}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            autoFocus
            required
            label="지급 꼬막"
            type="number"
            value={draft.amount}
            disabled={working}
            inputProps={{ min: 1 }}
            onChange={(event) => setDraft((current) => ({ ...current, amount: event.target.value }))}
          />
          <TextField
            required
            type="date"
            label="만료일"
            value={draft.expirationDate}
            disabled={working}
            InputLabelProps={{ shrink: true }}
            helperText="선택한 날짜까지 사용 가능합니다. 한국 시간 기준 다음 날 00시에 만료됩니다."
            onChange={(event) => setDraft((current) => ({ ...current, expirationDate: event.target.value }))}
          />
          <TextField
            required
            label="지급 사유"
            multiline
            minRows={2}
            value={draft.reason}
            disabled={working}
            inputProps={{ maxLength: 500 }}
            onChange={(event) => setDraft((current) => ({ ...current, reason: event.target.value }))}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button disabled={working} onClick={onClose}>취소</Button>
        <Button disabled={working} variant="contained" onClick={submit}>
          {working ? "지급 중..." : "지급"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
