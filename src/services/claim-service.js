import apiCaller from './api-caller';

export async function getClaimInsurers(signal) {
  return (await apiCaller.get('/api/v1/claims/insurers', {}, { signal })).data.items;
}

export function claimTemplateUrl(id) {
  return `${apiCaller.baseUrl}/api/v1/claims/insurers/${id}/template`;
}

export async function generateClaimPdf(id, payload, files, signal) {
  const form = new FormData();
  form.append('insurer_id', id);
  form.append('payload', JSON.stringify(payload));
  files.forEach(file => form.append('files', file));
  const response = await apiCaller.post('/api/v1/claims/pdf', form, { responseType: 'blob', signal, timeout: 120000 });
  const receipt = response.headers['x-claim-receipt'];
  if (!receipt) throw new Error('생성 확인 정보를 받지 못했습니다. 서버 연결을 확인해 주세요.');
  return { blob: response.data, receipt, pages: Number(response.headers['x-claim-pages']) };
}

export async function simulateClaimSend(receipts) {
  return (await apiCaller.post('/api/v1/claims/simulate-send', { receipts })).data;
}

export async function claimError(error) {
  let data = error?.response?.data;
  if (data instanceof Blob) {
    try { data = JSON.parse(await data.text()); } catch { data = null; }
  }
  return typeof data?.detail === 'string' ? data.detail : error?.message || '청구서를 처리하지 못했습니다.';
}
