import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

import { useAuth } from "@/auth/AuthContext";
import ProposalPopupNoticeDialog from "@/pages/proposals/ProposalPopupNoticeDialog";
import {
  filterVisibleTodayNotices,
  getActivePopupNotices,
  hideNoticesForToday,
  resolvePopupPageKey,
} from "@/services/proposal-popup-notice-service";

export default function PagePopupNoticeHost() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const pageKey = resolvePopupPageKey(pathname);
  const [notices, setNotices] = useState([]);
  const [open, setOpen] = useState(false);
  const checkedPagesRef = useRef(new Set());

  useEffect(() => {
    checkedPagesRef.current = new Set();
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id || user.status !== "ACTIVE" || !pageKey || pageKey === "proposals") {
      return undefined;
    }
    if (checkedPagesRef.current.has(pageKey)) {
      return undefined;
    }
    let active = true;
    getActivePopupNotices(pageKey)
      .then((res) => {
        if (!active) return;
        checkedPagesRef.current.add(pageKey);
        const visible = filterVisibleTodayNotices(user.id, res?.items || []);
        if (visible.length > 0) {
          setNotices(visible);
          setOpen(true);
        }
      })
      .catch(() => {
        // Popup notices are optional; ignore fetch failures silently.
      });
    return () => {
      active = false;
    };
  }, [pageKey, user?.id, user?.status]);

  const handleClose = () => setOpen(false);
  const handleHideToday = (ids) => {
    if (user?.id) {
      hideNoticesForToday(user.id, ids);
    }
    setOpen(false);
  };

  return (
    <ProposalPopupNoticeDialog
      open={open}
      notices={notices}
      onClose={handleClose}
      onHideToday={handleHideToday}
    />
  );
}
