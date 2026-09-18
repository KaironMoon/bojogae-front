import apiCaller from '@/services/api-caller';

const paths = { refund: 'refund-requests', suggestion: 'document-suggestions' };
const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
const prefix = (kind, admin) => `/api/v1/${admin ? 'admin/' : ''}${paths[kind]}`;

export async function createRefund(generationId, content) {
  return (await apiCaller.post(prefix('refund', false), { generation_id: generationId, content })).data;
}

export async function createSuggestion({ kind, title, content, generation, files }) {
  const form = new FormData();
  form.append('kind', kind);
  form.append('title', title);
  form.append('content', content);
  if (generation) form.append('generation_id', generation.id);
  files.forEach(file => form.append('files', file));
  return (await apiCaller.post(prefix('suggestion', false), form, { timeout: 120000 })).data;
}

export async function listRequests(kind, page, admin = false) {
  return (await apiCaller.get(prefix(kind, admin), { page })).data;
}

export async function getRequest(kind, id, admin = false) {
  return (await apiCaller.get(`${prefix(kind, admin)}/${id}`)).data;
}

export async function decideRequest(kind, id, state, response) {
  const payload = kind === 'refund' ? { action: state, response } : { status: state, response };
  return (await apiCaller.post(`${prefix(kind, true)}/${id}/decision`, payload)).data;
}

export function suggestionFileUrl(id, fileId, admin = false) {
  return `${baseUrl}${prefix('suggestion', admin)}/${id}/${fileId ? `files/${fileId}` : 'document'}/download`;
}

export function requestError(error) {
  const messages = {
    generation_not_found: '선택한 문서를 연결할 수 없습니다. 본인의 생성 문서를 다시 선택해주세요.',
    generation_not_refundable: '환불을 요청할 수 없는 생성 건입니다. 과금 및 반환 상태를 확인해주세요.',
    refund_already_requested: '이미 환불을 요청한 문서입니다. 환불 요청 내역을 확인해주세요.',
    refund_already_decided: '이미 처리된 환불 요청입니다. 새로고침해주세요.',
    points_already_refunded: '이미 포인트가 반환된 생성 건입니다. 환불 처리로 접수 상태를 정리해주세요.',
    invalid_suggestion_transition: '현재 상태에서는 선택한 처리로 변경할 수 없습니다. 새로고침해주세요.',
    suggestion_completion_schema_required: '건의사항 완료 처리 기능의 DB 설정이 필요합니다. 관리자에게 문의해주세요.',
    suggestion_already_decided: '이미 처리된 건의사항입니다. 새로고침해주세요.',
    invalid_suggestion: '제목과 내용을 입력해주세요.',
    invalid_file_count: '첨부파일은 최대 5개까지 가능합니다.',
    file_too_large: '파일당 최대 10MB까지 첨부할 수 있습니다.',
    empty_file: '빈 파일은 첨부할 수 없습니다.',
    request_not_found: '접수 내역을 찾을 수 없습니다.',
    document_requests_schema_required: '접수 기능을 준비 중입니다. 관리자에게 문의해주세요.',
  };
  return messages[error.response?.data?.detail] || '요청을 처리하지 못했습니다. 다시 시도해주세요.';
}
