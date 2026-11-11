/* eslint-disable react/prop-types */
import ProfileIcon from './ProfileIcon';

export function AccountWithdrawal({onWithdraw, onBilling}) {
  return <section className="ns-card profile-account-section profile-withdrawal">
    <header className="profile-account-heading"><span className="profile-account-icon profile-account-icon-danger"><ProfileIcon name="shield-alert"/></span><div><h2>회원 탈퇴</h2><p>계정 이용 종료 전에 구독 상태와 보관 중인 자료를 확인해 주세요.</p></div></header>
    <div className="profile-withdrawal-content"><div className="profile-account-note profile-account-note-neutral"><ProfileIcon name="credit-card"/><div><strong>구독만 종료하고 싶으신가요?</strong><p>구독 관리에서 자동 갱신을 해지할 수 있습니다. 계정을 유지하려면 구독 해지를 이용해 주세요.</p></div><button type="button" className="profile-account-button profile-account-secondary" onClick={onBilling}>구독 관리</button></div>
    <div className="profile-withdrawal-action"><p className="profile-account-description">회원 탈퇴 시 계정이 즉시 닫히고 자동 갱신이 중단됩니다. 업로드 원본·보고서·공유 이미지 등 자료는 파기되며 복구할 수 없습니다.</p><button type="button" className="profile-account-button profile-account-danger-outline" onClick={onWithdraw}>회원 탈퇴</button></div></div>
  </section>;
}

export function WithdrawalNotice() {
  return <div className="profile-withdrawal-notice">
    <div className="profile-account-note profile-account-note-danger"><ProfileIcon name="shield-alert"/><div><strong>탈퇴 후에는 자료를 복구할 수 없습니다.</strong><p>계정을 즉시 탈퇴하고 로그인과 자동 갱신을 중단합니다. 업로드 원본·보고서·공유 이미지 등 자료는 파기됩니다.</p></div></div>
    <div className="profile-account-panel"><h3>거래 기록 보관 및 환불 안내</h3><p className="profile-account-description">결제·환불에 필요한 최소 식별 정보와 거래 기록은 법정 기간 동안 보관합니다.</p><p className="profile-account-description">결제 후 7일 이내에 해당 결제로 제공된 이용량을 전혀 사용하지 않은 경우 전액 환불하며, 그 외에는 관계 법령에 따라 관리자 검토 후 결정됩니다.</p></div>
  </div>;
}
