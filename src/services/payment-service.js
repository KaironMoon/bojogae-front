import api from '@/services/api-caller';
import * as PortOne from '@portone/browser-sdk/v2';

export async function getPaymentConfig() { return (await api.get('/api/v1/payments/config')).data; }
export async function getTerminationPreview() { return (await api.get("/api/v1/payments/subscriptions/termination-preview")).data; }
export async function getPaymentMethods() { return (await api.get('/api/v1/payments/methods')).data; }
export async function getPayments() { return (await api.get('/api/v1/payments/me')).data; }
export async function paymentPost(path, body = {}) { return (await api.post(`/api/v1/payments/${path}`, body, { timeout:60000 })).data; }
export async function openPayment(order, customer) {
  return PortOne.requestPayment({ ...order, customer, redirectUrl: `${window.location.origin}/profile?paymentReturn=1` });
}
export async function openBillingKey(request, customer, returnPath = '/profile?billingReturn=1') {
  return PortOne.requestIssueBillingKey({ ...request, customer, redirectUrl: `${window.location.origin}${returnPath}` });
}
export function paymentError(error) {
  if (['ECONNABORTED','ERR_NETWORK'].includes(error.code)) return '결제 상태를 확인 중입니다. 다시 결제하지 말고 결제 내역 확인을 눌러 주세요.';
  const code = error.response?.data?.detail;
  if (Array.isArray(code) && code.some((item) => item.loc?.includes('alias'))) return '카드 별칭을 1~50자로 입력해 주세요. 카드번호는 별칭에 입력할 수 없습니다.';
  return ({ invalid_card_alias:'카드 별칭을 1~50자로 입력해 주세요. 카드번호는 별칭에 입력할 수 없습니다.', card_verification_pending:'카드 등록 확인 결제의 승인·취소를 처리 중입니다. 결제수단 관리에서 확인해 주세요.', card_verification_consent_required:'1,000원 승인·취소 동의가 필요합니다. 카드 등록을 새로 시작해 주세요.', payment_method_not_found:'등록된 카드를 찾을 수 없습니다. 카드 목록을 새로고침해 주세요.', payment_method_in_use:'현재 결제수단은 삭제할 수 없습니다. 다른 카드를 결제수단으로 선택한 뒤 삭제해 주세요.', payment_method_pending:'결제수단 변경 결과를 확인 중입니다. 결제수단 관리에서 확인해 주세요.', payment_method_changed:'결제수단이 변경됐습니다. 다시 등록해 주세요.', billing_issue_expired:'카드 등록 시간이 만료됐습니다. 다시 등록해 주세요.', invalid_billing_key:'등록된 카드 정보를 확인할 수 없습니다. 다시 등록해 주세요.', payments_not_configured: '테스트 결제 설정을 준비 중입니다.', portone_unavailable: '결제 상태를 확인 중입니다. 다시 결제하지 말고 결제 내역 확인을 눌러 주세요.',
    portone_request_rejected:'결제 요청이 거절되었습니다. 결제 내역을 확인하거나 고객센터로 문의해 주세요.', billing_customer_missing:'등록된 결제자 정보가 부족합니다. 고객센터로 문의해 주세요.',
    subscription_retry_unavailable:'현재 상태에서는 등록된 카드로 재결제할 수 없습니다. 내역을 확인하거나 새 카드를 등록해 주세요.', billing_registration_required:'등록된 카드를 사용할 수 없습니다. 고객센터로 문의해 주세요.',
    active_subscription_required: '유료 구독 이용기간 중에 추가 충전할 수 있습니다.', subscription_already_exists: '구독이 이미 있습니다. 다음 결제부터 요금제를 변경해 주세요.',
    subscription_not_available: '현재 구독 상태에서는 변경할 수 없습니다.', schedule_change_too_late: '다음 결제까지 1시간 미만 남았습니다. 고객센터로 문의해 주세요.',
    termination_refund_pending:'이전 구독 종료·환불을 처리 중입니다. 완료 후 다시 구독할 수 있습니다.',
    refund_amount_changed: '사용 내역이 변경되어 환불 금액이 달라졌습니다. 다시 확인해 주세요.', payment_pending_review:'결제 상태를 확인 중입니다. 결제 내역을 확인해 주세요.', support_refund_required: '고객센터에서 환불을 검토합니다.', refund_pending_review: '환불 처리 중입니다. 고객센터에서 진행 상태를 확인해 주세요.', nothing_to_refund: '환불 가능한 미사용 꼬막이 없습니다.',
    upgrade_quote_expired:'견적이 만료됐거나 구독 상태가 변경됐습니다. 창을 닫고 다시 요금제를 선택해 주세요.', upgrade_confirmation_required:'업그레이드 차액을 확인하고 즉시 변경을 진행해 주세요.',
    consent_version_changed: '약관이 변경되었습니다. 새로고침 후 확인해 주세요.', payment_verification_failed: '결제 정보 확인이 필요합니다. 고객센터로 문의해 주세요.', payment_account_unavailable: '개인 활성 계정에서 결제할 수 있습니다.',
  })[code] || error.message || '결제를 처리하지 못했습니다.';
}
