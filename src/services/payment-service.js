import api from '@/services/api-caller';
import * as PortOne from '@portone/browser-sdk/v2';

export async function getPaymentConfig() { return (await api.get('/api/v1/payments/config')).data; }
export async function getTerminationPreview() { return (await api.get("/api/v1/payments/subscriptions/termination-preview")).data; }
export async function getPayments() { return (await api.get('/api/v1/payments/me')).data; }
export async function paymentPost(path, body = {}) { return (await api.post(`/api/v1/payments/${path}`, body, { timeout:60000 })).data; }
export async function openPayment(order, customer) {
  return PortOne.requestPayment({ ...order, customer, redirectUrl: `${window.location.origin}/profile?paymentReturn=1` });
}
export async function openBillingKey(request, customer) {
  return PortOne.requestIssueBillingKey({ ...request, customer, redirectUrl: `${window.location.origin}/profile?billingReturn=1` });
}
export function paymentError(error) {
  if (['ECONNABORTED','ERR_NETWORK'].includes(error.code)) return '결제 상태를 확인 중입니다. 다시 결제하지 말고 결제 내역 확인을 눌러 주세요.';
  const code = error.response?.data?.detail;
  return ({ payments_not_configured: '테스트 결제 설정을 준비 중입니다.', portone_unavailable: '결제 상태를 확인 중입니다. 다시 결제하지 말고 결제 내역 확인을 눌러 주세요.',
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
