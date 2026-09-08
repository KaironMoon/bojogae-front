import { Fragment, useState } from 'react';
import { Box, Chip, Collapse, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

const sources = { ADMIN: '관리자 지급', REFUND: '사용 포인트 반환', PURCHASE: '구매', SUBSCRIPTION: '정액제', MIGRATION: '이관' };
const statuses = { AVAILABLE: '사용 가능', EXPIRING: '만료 임박', EXPIRED: '만료', DEPLETED: '소진' };
const date = (value) => value ? new Date(value).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }) : '만료 없음';

// eslint-disable-next-line react/prop-types
export default function PointGrantsTable({ items }) {
  const [expanded, setExpanded] = useState(null);
  return <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
    <Table size="small" sx={{ minWidth: 850 }} aria-label="지급 건별 포인트 구성">
      <TableHead sx={{ bgcolor: '#f8fafc' }}><TableRow>
        {['상세', '구분', '지급 출처', '지급량', '사용 가능', '예약 중', '만료일 (한국 시간)', '상태'].map(label => <TableCell key={label} sx={{ whiteSpace: 'nowrap', fontWeight: 750 }}>{label}</TableCell>)}
      </TableRow></TableHead>
      <TableBody>
        {/* eslint-disable-next-line react/prop-types */}
        {items.map(g => <Fragment key={g.id}>
          <TableRow sx={{ bgcolor: g.grant_status === 'EXPIRING' ? '#fffbeb' : undefined }}>
            <TableCell><IconButton size="small" aria-label={`지급 ${g.id} 상세`} aria-expanded={expanded === g.id} onClick={() => setExpanded(expanded === g.id ? null : g.id)}>{expanded === g.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}</IconButton></TableCell>
            <TableCell><Chip size="small" variant="outlined" color={g.point_type === 'FREE' ? 'success' : 'primary'} label={g.point_type === 'FREE' ? '무료' : '유료'} /></TableCell>
            <TableCell>{sources[g.source] || g.source}</TableCell>
            {[g.amount, g.available_amount, g.reserved_amount].map((v, i) => <TableCell key={i} align="right" sx={{ fontVariantNumeric: 'tabular-nums', fontWeight: i === 1 ? 800 : 400 }}>{v.toLocaleString()}P</TableCell>)}
            <TableCell sx={{ whiteSpace: 'nowrap' }}>{date(g.expires_at)}</TableCell>
            <TableCell><Chip size="small" label={statuses[g.grant_status]} color={g.grant_status === 'EXPIRING' ? 'warning' : 'default'} /></TableCell>
          </TableRow>
          <TableRow><TableCell colSpan={8} sx={{ py: 0, borderBottom: expanded === g.id ? undefined : 0 }}>
            <Collapse in={expanded === g.id} unmountOnExit><Box sx={{ py: 2 }}>
              <Typography variant="body2">지급 #{g.id} · 지급일 {date(g.created_at)}</Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>사유: {g.reason || '기록 없음'}</Typography>
              {g.reference_id && <Typography variant="body2">{g.reference_type === 'POINT_USAGE' ? '원 사용 내역' : '연결 내역'} #{g.reference_id}</Typography>}
            </Box></Collapse>
          </TableCell></TableRow>
        </Fragment>)}
      </TableBody>
    </Table>
  </TableContainer>;
}
