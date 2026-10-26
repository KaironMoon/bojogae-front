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

export async function saveClaimRequest(requestKey, insurerIds, claim, files, faxNumbers = {}, saveMode = 'FILE') {
  const form = new FormData();
  form.append('payload', JSON.stringify({ request_key: requestKey, insurer_ids: insurerIds, claim,
    fax_numbers: saveMode === 'FAX' ? faxNumbers : {}, save_mode: saveMode }));
  files.forEach(file => form.append('files', file));
  return (await apiCaller.post('/api/v1/claims/requests', form, { timeout: 300000 })).data;
}

export async function getClaimRequests(page = 1, signal) {
  return (await apiCaller.get('/api/v1/claims/requests', { page }, { signal })).data;
}

export async function getClaimRequest(id, signal) {
  return (await apiCaller.get(`/api/v1/claims/requests/${id}`, {}, { signal })).data;
}

export async function deleteClaimRequest(id) {
  await apiCaller.delete(`/api/v1/claims/requests/${id}`);
}

export async function getClaimFile(requestId, fileId, pdf = false, signal) {
  return (await apiCaller.get(`/api/v1/claims/requests/${requestId}/files/${fileId}`, { pdf },
    { responseType: 'blob', signal })).data;
}

export async function sendClaimFax(requestId, requestKey, faxNumbers) {
  return (await apiCaller.post(`/api/v1/claims/requests/${requestId}/fax`, {
    request_key: requestKey, fax_numbers: faxNumbers,
  }, { timeout: 120000 })).data;
}

export function downloadClaimBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = filename;
  document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function downloadClaimDocument(requestId) {
  const response = await apiCaller.get(`/api/v1/claims/requests/${requestId}/download`, {}, { responseType: 'blob', timeout: 120000 });
  const encoded = response.headers['content-disposition']?.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  const filename = encoded ? decodeURIComponent(encoded) : `청구서_${requestId}.${response.data.type === 'application/pdf' ? 'pdf' : 'zip'}`;
  downloadClaimBlob(response.data, filename);
}

export async function downloadOriginalClaim(requestKey, insurerIds, claim, files) {
  for (const insurerId of insurerIds) {
    const form = new FormData();
    form.append('payload', JSON.stringify({ request_key: requestKey, insurer_ids: [insurerId], claim, save_mode: 'FILE' }));
    files.forEach(file => form.append('files', file));
    const response = await apiCaller.post('/api/v1/claims/original-download', form,
      { responseType: 'blob', timeout: 300000 });
    const encoded = response.headers['content-disposition']?.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
    downloadClaimBlob(response.data, encoded ? decodeURIComponent(encoded) : `발송용_청구서_${insurerId}.pdf`);
  }
}

export async function getClaimOriginal(requestId, deliveryId, signal) {
  const response = await apiCaller.get(`/api/v1/claims/requests/${requestId}/originals/${deliveryId}`, {},
    { responseType: 'blob', signal, timeout: 120000 });
  const encoded = response.headers['content-disposition']?.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  return new File([response.data], encoded ? decodeURIComponent(encoded) : '발송용_청구서.pdf', { type: 'application/pdf' });
}
