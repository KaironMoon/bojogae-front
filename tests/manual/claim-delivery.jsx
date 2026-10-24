import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import ClaimsPage from '@/pages/claims/ClaimsPage';
import apiCaller from '@/services/api-caller';

// Browser fixtures only: never connect to a database or fax provider.
const insurers = [
  { id: '10', name: '가상팩스 보험사', kind: 'LIFE', pages: 1, use_virtual_fax: true, fax_numbers: [] },
  { id: '35', name: '공용팩스 보험사', kind: 'LIFE', pages: 1, use_virtual_fax: false, fax_numbers: ['021234567'] },
];
const now = '2026-10-24T05:00:00Z';
const canvas = document.createElement('canvas'); canvas.width = 200; canvas.height = 80;
const context = canvas.getContext('2d'); context.lineWidth = 5;
context.beginPath(); context.moveTo(20, 60); context.lineTo(60, 20); context.lineTo(100, 60); context.lineTo(170, 25); context.stroke();
const claim = {
  insured_name: '테스트', insured_id: '9001011234567', insured_phone: '01012345678',
  beneficiary_same: true, accident_date: '2026-10-01', accident_type: '질병', accident_description: '검증용 청구',
  bank_name: '테스트은행', account_holder: '테스트', account_number: '123456789', consent: true,
  insured_signature: canvas.toDataURL('image/png'),
};
const documents = [{ id: 1, created_at: now, save_mode: 'FILE', sent: false, charged: false, claim,
  files: [], fax_history: [], deliveries: insurers.map((i, n) => ({
    id: n + 1, insurer_id: i.id, insurer_name: i.name, pages: 1, status: 'STORED',
  })) },
  { id: 2, created_at: now, save_mode: 'FAX', sent: true, charged: false, claim, files: [],
    deliveries: [{ id: 3, insurer_id: '35', insurer_name: insurers[1].name, pages: 1, status: 'SUCCESS' }],
    fax_history: [
      { id: 2, insurer_name: insurers[1].name, fax_number: '021234567', requested_at: now, completed_at: now, status: 'SUCCESS' },
      { id: 1, insurer_name: insurers[1].name, fax_number: '021234567', requested_at: now, completed_at: now, status: 'FAILED', failure_reason: '검증용 실패 사유' },
    ] },
];
// A valid, empty one-page PDF for preview/download interaction.
const lines = ['%PDF-1.4\n']; const offsets = [];
for (const [n, body] of ['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
  '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 400] >>'].entries()) {
  offsets.push(lines.join('').length); lines.push(`${n + 1} 0 obj\n${body}\nendobj\n`);
}
const xref = lines.join('').length;
lines.push('xref\n0 4\n0000000000 65535 f \n');
offsets.forEach(offset => lines.push(`${String(offset).padStart(10, '0')} 00000 n \n`));
lines.push(`trailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
const pdf = new Blob(lines, { type: 'application/pdf' });
window.claimDeliveryRequests = [];
apiCaller.axiosInstance.defaults.adapter = async config => {
  const path = new URL(config.url, location.origin).pathname;
  const response = data => ({ data: structuredClone(data), status: 200, statusText: 'OK', headers: {}, config });
  if (path.endsWith('/insurers')) return response({ items: insurers });
  if (path.endsWith('/pdf')) return { ...response(null), data: pdf, headers: { 'x-claim-receipt': 'fixture', 'x-claim-pages': '1' } };
  if (path.endsWith('/requests') && config.method === 'get') return response({
    items: documents.map(d => ({ ...d, insured_name: d.claim.insured_name, accident_date: d.claim.accident_date })), page: 1, total_pages: 1,
  });
  if (path.endsWith('/requests') && config.method === 'post') {
    const input = JSON.parse(config.data.get('payload')); window.claimDeliveryRequests.push(input);
    const document = { id: documents.length + 1, created_at: now, save_mode: input.save_mode,
      claim: input.claim, files: [], sent: false, charged: false, fax_history: [],
      deliveries: insurers.filter(i => input.insurer_ids.includes(i.id)).map((i, n) => ({
        id: n + 10, insurer_id: i.id, insurer_name: i.name, pages: 1, status: 'STORED',
      })) };
    documents.push(document); return response(document);
  }
  const document = documents.find(d => d.id === Number(path.split('/requests/')[1]?.split('/')[0]));
  if (!document) throw new Error('Unknown fixture request');
  if (path.endsWith('/download')) return { ...response(null), data: pdf, headers: { 'content-disposition': "attachment; filename*=UTF-8''test.pdf" } };
  if (path.endsWith('/fax')) {
    const input = JSON.parse(config.data); window.claimDeliveryRequests.push(input);
    document.deliveries.forEach(d => {
      d.status = 'FAILED';
      document.fax_history.unshift({ id: document.fax_history.length + 1, insurer_name: d.insurer_name,
        fax_number: input.fax_numbers[d.insurer_id] || '021234567', requested_at: now, completed_at: now,
        status: 'FAILED', failure_reason: '팩스 발송 서비스가 연결되지 않았습니다.' });
    });
    return response(document);
  }
  return response(document);
};
createRoot(document.getElementById('root')).render(<MemoryRouter initialEntries={['/claims/history']}>
  <ThemeProvider theme={createTheme()}><CssBaseline /><ClaimsPage /></ThemeProvider>
</MemoryRouter>);
