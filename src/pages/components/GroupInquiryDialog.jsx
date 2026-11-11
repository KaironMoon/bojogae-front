import { useState } from "react";
import { Alert, Box, Button, Checkbox, CircularProgress, Dialog, DialogContent, FormControlLabel, IconButton, Stack, TextField, Typography } from "@mui/material";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { createGroupInquiry, groupInquiryError } from "@/services/group-inquiry-service";

const emptyInquiry = {
  organizationName: "",
  contactName: "",
  phone: "",
  email: "",
  privacyAgreed: false,
  website: "",
};

export default function GroupInquiryDialog({ open, onClose }) { // eslint-disable-line react/prop-types
  const [values, setValues] = useState(emptyInquiry);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);

  const update = (field) => (event) => setValues(current => ({
    ...current,
    [field]: field === "privacyAgreed" ? event.target.checked : event.target.value,
  }));
  const close = () => {
    if (working) return;
    onClose();
    window.setTimeout(() => { setValues(emptyInquiry); setError(""); setComplete(false); }, 200);
  };
  const submit = async (event) => {
    event.preventDefault();
    setWorking(true); setError("");
    try {
      await createGroupInquiry(values);
      setComplete(true);
    } catch (requestError) {
      setError(groupInquiryError(requestError));
    } finally {
      setWorking(false);
    }
  };

  return (
    <Dialog aria-labelledby="group-inquiry-title" open={open} onClose={close} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 4, overflow: "visible" } }}>
      <IconButton aria-label="닫기" onClick={close} sx={{ position: "absolute", right: 12, top: 12, zIndex: 1 }}><CloseRoundedIcon /></IconButton>
      <DialogContent sx={{ p: { xs: 3, sm: 5 } }}>
        {complete ? (
          <Stack alignItems="center" spacing={2.2} sx={{ py: 3, textAlign: "center" }}>
            <Box className="success-mark"><CheckRoundedIcon /></Box>
            <Typography id="group-inquiry-title" variant="h4" fontWeight={850}>문의가 접수되었습니다</Typography>
            <Typography color="text.secondary">담당자가 내용을 확인한 뒤 남겨주신 연락처로 안내해 드리겠습니다.</Typography>
            <Button variant="contained" onClick={close} sx={{ mt: 1, px: 5, minHeight: 48, borderRadius: 3, fontWeight: 800 }}>확인</Button>
          </Stack>
        ) : (
          <Stack component="form" spacing={2} onSubmit={submit}>
            <Box><Typography color="primary" fontWeight={800} fontSize={13}>GROUP PLAN</Typography><Typography id="group-inquiry-title" variant="h4" fontWeight={850} sx={{ mt: .5 }}>단체 도입 문의</Typography><Typography color="text.secondary" sx={{ mt: 1 }}>사무실 운영 환경에 맞는 이용 방법과 단체 요금을 안내해 드립니다.</Typography></Box>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField label="단체명" value={values.organizationName} onChange={update("organizationName")} required inputProps={{ maxLength: 150 }} />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField label="담당자" value={values.contactName} onChange={update("contactName")} required fullWidth inputProps={{ maxLength: 100 }} />
              <TextField label="전화번호" type="tel" value={values.phone} onChange={update("phone")} required fullWidth inputProps={{ maxLength: 30, autoComplete: "tel" }} />
            </Stack>
            <TextField label="이메일" type="email" value={values.email} onChange={update("email")} required inputProps={{ maxLength: 320, autoComplete: "email" }} />
            <Box sx={{ position: "absolute", left: -10000, width: 1, height: 1, overflow: "hidden" }} aria-hidden="true"><TextField label="웹사이트" value={values.website} onChange={update("website")} tabIndex={-1} autoComplete="off" /></Box>
            <FormControlLabel control={<Checkbox checked={values.privacyAgreed} onChange={update("privacyAgreed")} required />} label={<Typography variant="body2" color="text.secondary">상담을 위한 개인정보 수집·이용에 동의합니다.</Typography>} />
            <Button type="submit" variant="contained" disabled={working || !values.privacyAgreed} endIcon={working ? null : <ArrowForwardRoundedIcon />} sx={{ minHeight: 54, borderRadius: 3, fontWeight: 850 }}>{working ? <CircularProgress size={23} color="inherit" /> : "문의 접수하기"}</Button>
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  );
}
