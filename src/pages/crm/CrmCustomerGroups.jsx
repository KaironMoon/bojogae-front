/* eslint-disable react/prop-types */
import { useState } from "react";
import {
  Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  List, ListItem, ListItemText, Stack, Typography,
} from "@mui/material";
import { crmDelete, crmError, crmGet, crmPost, crmPut } from "@/services/crm-service";
import { Empty, Field, State, useCrm } from "./CrmShared";

const path = "/customer-groups";

export default function CrmCustomerGroups({ selectedCustomers, onClose }) {
  const groups = useCrm(path);
  const [pending, setPending] = useState(selectedCustomers);
  const [draft, setDraft] = useState(null);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function openEditor(id) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const group = id ? await crmGet(`${path}/${id}`) : { name: "", customers: [] };
      const customers = new Map(group.customers.map((customer) => [customer.id, customer]));
      for (const customer of pending) {
        if (!customers.has(customer.id)) customers.set(customer.id, customer);
      }
      setDraft({ ...group, customers: [...customers.values()] });
    } catch (e) {
      setError(crmError(e));
    } finally {
      setBusy(false);
    }
  }

  async function save(remove = false) {
    setBusy(true);
    setError("");
    try {
      const groupPath = `${path}/${draft.id}`;
      const data = { name: draft.name.trim(), customer_ids: draft.customers.map((customer) => customer.id) };
      if (remove) await crmDelete(groupPath, { version: draft.version });
      else if (draft.id) await crmPut(groupPath, { ...data, version: draft.version });
      else await crmPost(path, data);
      if (!remove) setPending([]);
      setNotice(remove ? "고객 그룹을 삭제했습니다." : "고객 그룹을 저장했습니다.");
      setDraft(null);
      setConfirmDelete(false);
      groups.reload();
    } catch (e) {
      setError(crmError(e));
    } finally {
      setBusy(false);
    }
  }

  function backToList() {
    setDraft(null);
    setConfirmDelete(false);
    setError("");
    groups.reload();
  }

  return (
    <Dialog open fullWidth maxWidth="sm" onClose={busy ? undefined : onClose}>
      <DialogTitle>{draft ? (draft.id ? "고객 그룹 수정" : "새 고객 그룹") : "고객 그룹 관리"}</DialogTitle>
      <Box component="form" sx={{ display: "flex", flexDirection: "column", minHeight: 0 }} onSubmit={(event) => {
        event.preventDefault();
        if (draft && !busy && !confirmDelete && draft.name.trim()) save();
      }}>
        <DialogContent dividers>
          <Stack gap={1.5}>
            {error && <Alert severity="error">{error}</Alert>}
            {notice && <Alert severity="success">{notice}</Alert>}
            {draft ? (
              <>
                <Field label="그룹 이름" required value={draft.name}
                  inputProps={{ maxLength: 100 }} disabled={busy || confirmDelete}
                  onChange={(name) => setDraft({ ...draft, name })} />
                <Typography variant="subtitle2">소속 고객 {draft.customers.length}명</Typography>
                {draft.customers.length ? (
                  <List dense disablePadding aria-label="소속 고객">
                    {draft.customers.map((customer) => (
                      <ListItem key={customer.id} disableGutters secondaryAction={
                        <Button size="small" disabled={busy || confirmDelete}
                          aria-label={`${customer.name} 그룹에서 제외`}
                          onClick={() => setDraft({
                            ...draft,
                            customers: draft.customers.filter((member) => member.id !== customer.id),
                          })}>제외</Button>
                      }>
                        <ListItemText primary={customer.name} sx={{ overflowWrap: "anywhere" }}
                          secondary={[customer.alias, customer.archived && "보관 고객"].filter(Boolean).join(" · ")} />
                      </ListItem>
                    ))}
                  </List>
                ) : <Typography variant="body2" color="text.secondary">내고객 목록에서 고객을 선택해 그룹에 추가할 수 있습니다.</Typography>}
                {confirmDelete && <Alert severity="warning">이 그룹을 삭제할까요? 소속 고객 정보는 유지됩니다.</Alert>}
              </>
            ) : (
              <>
                {pending.length > 0 && <Alert severity="info">선택한 고객 {pending.length}명을 추가할 그룹을 고르거나 새 그룹을 만드세요.</Alert>}
                <State resource={groups} />
                {groups.data?.items.map((group) => (
                  <Button key={group.id} variant="outlined" disabled={busy || groups.loading}
                    sx={{ justifyContent: "space-between", textAlign: "left", gap: 1, overflowWrap: "anywhere" }}
                    onClick={() => openEditor(group.id)}>
                    <span>{group.name}</span>
                    <Typography component="span" variant="body2" sx={{ flexShrink: 0 }}>{group.customer_count}명</Typography>
                  </Button>
                ))}
                {groups.data?.items.length === 0 && <Empty>등록된 고객 그룹이 없습니다.</Empty>}
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          {draft ? (
            <>
              <Button disabled={busy} onClick={confirmDelete ? () => setConfirmDelete(false) : backToList}>
                {confirmDelete ? "삭제 취소" : "그룹 목록"}
              </Button>
              {draft.id && (
                <Button color="error" disabled={busy}
                  onClick={() => confirmDelete ? save(true) : setConfirmDelete(true)}>
                  {confirmDelete ? "삭제 확인" : "그룹 삭제"}
                </Button>
              )}
              {!confirmDelete && <Button variant="contained" type="submit" disabled={busy || !draft.name.trim()}>저장</Button>}
            </>
          ) : (
            <>
              <Button disabled={busy} onClick={onClose}>닫기</Button>
              <Button variant="contained" disabled={busy || groups.loading || !!groups.error}
                onClick={() => openEditor()}>새 그룹</Button>
            </>
          )}
        </DialogActions>
      </Box>
    </Dialog>
  );
}
