/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";

export default function ErrorNoticeDialog({
  open,
  message = "",
  title = "확인이 필요합니다",
  onClose,
  action = null,
  confirmLabel = "확인",
}) {
  const [dismissedMessage, setDismissedMessage] = useState("");

  useEffect(() => {
    if (!message) setDismissedMessage("");
  }, [message]);

  const controlledOpen = typeof open === "boolean" ? open : Boolean(message) && dismissedMessage !== message;
  const visible = controlledOpen && Boolean(message);

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else if (message) {
      setDismissedMessage(message);
    }
  };

  return (
    <Dialog
      open={visible}
      onClose={handleClose}
      fullWidth
      maxWidth="xs"
      sx={{ zIndex: (theme) => theme.zIndex.modal + 20 }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          fontWeight: 850,
          pb: 1,
        }}
      >
        <ErrorOutlineRoundedIcon sx={{ color: "#E11D48" }} />
        <span>{title}</span>
      </DialogTitle>
      <DialogContent>
        <Box
          role="alert"
          sx={{
            mt: 0.5,
            p: 1.75,
            borderRadius: 2,
            bgcolor: "#FFF1F2",
            border: "1px solid #FECDD3",
            color: "#9F1239",
          }}
        >
          <Typography
            variant="body2"
            sx={{
              fontWeight: 650,
              whiteSpace: "pre-line",
              overflowWrap: "anywhere",
              lineHeight: 1.6,
            }}
          >
            {message}
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        {action}
        <Button
          variant="contained"
          onClick={handleClose}
          autoFocus
          sx={{
            bgcolor: "#0F172A",
            fontWeight: 800,
            "&:hover": { bgcolor: "#1E293B" },
          }}
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
