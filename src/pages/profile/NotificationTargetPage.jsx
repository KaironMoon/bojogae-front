import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Alert, Box, Button, Typography } from '@mui/material';
import api from '@/services/api-caller';

export default function NotificationTargetPage() {
  const { notificationId } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    sessionStorage.removeItem('bojogae.notificationTarget');
    api.get(`/api/v1/notifications/${encodeURIComponent(notificationId)}/target`).then(({ data }) => {
      if (!active) return;
      const target = new URL(data.url, window.location.origin);
      if (target.origin !== window.location.origin) throw new Error('invalid_target');
      navigate(target.pathname + target.search, { replace: true });
    }).catch(() => { if (active) setError('대상이 삭제되었거나 접근 권한이 없습니다. 현재 계정과 처리 내역을 확인해 주세요.'); });
    return () => { active = false; };
  }, [notificationId, navigate]);
  return <Box sx={{ p: 3 }}>
    {error ? <><Alert severity="info">{error}</Alert><Button component={Link} to="/home">홈으로</Button></>
      : <Typography>알림 대상을 확인하고 있습니다…</Typography>}
  </Box>;
}
