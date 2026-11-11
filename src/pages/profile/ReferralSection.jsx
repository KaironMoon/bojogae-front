import { useCallback, useEffect, useState } from 'react';
import { Alert, CircularProgress, Dialog } from '@mui/material';
import ProfileIcon from './design/ProfileIcon';
import { Link } from 'react-router-dom';
import { getReferral, referralError, registerReferral, saveReferralAlias } from '@/services/referral-service';

const date = value => new Date(value).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });

export default function ReferralSection() {
  const [data, setData] = useState(null);
  const [alias, setAlias] = useState('');
  const [referrer, setReferrer] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const load = useCallback(async () => {
    const result = await getReferral();
    setData(result);
    setAlias(result.alias || '');
  }, []);
  useEffect(() => {
    let active = true;
    getReferral().then(result => {
      if (active) { setData(result); setAlias(result.alias || ''); }
    }).catch(e => { if (active) setError(referralError(e)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  const perform = async action => {
    setBusy(true); setError(''); setMessage('');
    try { await action(); await load(); return true; }
    catch (e) { setError(referralError(e)); await load().catch(() => {}); return false; }
    finally { setBusy(false); }
  };
  if (data && !data.eligible) return null;
  const feedback = <>{error && <Alert severity="error">{error}</Alert>}{message && <Alert severity="success">{message}</Alert>}</>;
  const closeConfirm = () => { if (!busy) setConfirmOpen(false); };
  return <section id="referral" className="ns-card profile-account-section">
    <header className="profile-account-heading"><span className="profile-account-icon"><ProfileIcon name="user-check" /></span><div><h2>추천인 정보</h2><p>내 추천 정보를 공유하고, 나를 소개해 준 추천인을 등록하세요.</p></div></header>
    {loading && <CircularProgress size={24} aria-label="추천인 정보 조회 중" />}
    {!confirmOpen && feedback}
    {data?.eligible && <div className="profile-referral-grid">
      <div className="profile-account-panel">
        <div className="profile-panel-heading"><ProfileIcon name="id-card"/><h3>다른 사람에게 알려줄 내 추천 정보</h3></div>
        <div className="profile-referral-email"><span>기본 추천 이메일</span><strong>{data.email}</strong></div>
        <p className="profile-account-description">이메일 또는 아래 추천용 닉네임을 알려주세요. 추천용 닉네임은 프로필 닉네임과 별개이며 직접 변경할 수 있습니다. 변경해도 이미 등록된 추천 관계는 유지됩니다.</p>
        <div className="profile-account-field"><label htmlFor="referral-alias">내 추천용 닉네임 (선택)</label><div className="ns-input-box profile-account-input"><ProfileIcon name="smile"/><input id="referral-alias" value={alias} onChange={e => setAlias(e.target.value)} disabled={busy} maxLength={30} aria-describedby="referral-alias-help" /></div><p id="referral-alias-help">한글·영문·숫자·점·밑줄·하이픈 2~30자. 영문은 소문자로 저장하며, 비워서 저장하면 이메일만 사용합니다.</p></div>
        <button type="button" className="profile-account-button profile-account-secondary" disabled={busy || alias.trim() === (data.alias || '')} onClick={() => perform(async () => {
          await saveReferralAlias(alias); setMessage('추천용 닉네임을 저장했습니다.');
        })}><ProfileIcon name="save"/>추천용 닉네임 저장</button>
      </div>
      <div className="profile-account-panel">
        <div className="profile-panel-heading"><ProfileIcon name="user-check"/><h3>추천인 등록</h3>{data.registered && <span className="profile-account-badge">등록 완료</span>}</div>
        {data.registered ? <div className="profile-referral-complete" role="status"><strong>추천인 등록이 완료되었습니다.</strong><p>보너스 {data.referral.bonus_amount}꼬막</p><p>유효기간: {date(data.referral.bonus_expires_at)} (한국 시간)</p><span>등록한 추천인은 변경할 수 없습니다.</span></div> : <>
          <p className="profile-account-description">나를 소개해 준 분의 이메일 또는 추천용 닉네임을 입력해 주세요.</p>
          <div className="profile-account-field"><label htmlFor="referral-referrer">추천용 닉네임 (기본값은 이메일)</label><div className="ns-input-box profile-account-input"><ProfileIcon name="user"/><input id="referral-referrer" value={referrer} disabled={busy} onChange={e => setReferrer(e.target.value)} maxLength={254} aria-describedby="referral-referrer-help" /></div></div>
          <div id="referral-referrer-help" className="profile-account-note"><ProfileIcon name="sparkles"/><p>등록하면 내 계정에 50꼬막이 지급되며 30일간 사용할 수 있습니다. 추천인은 한 번만 등록할 수 있고 등록 후 변경할 수 없습니다.</p></div>
          <button type="button" className="profile-account-button ns-hero-cta" disabled={busy || !referrer.trim()} onClick={() => {setError('');setMessage('');setConfirmOpen(true);}}><ProfileIcon name="user-check"/>{busy ? '처리 중…' : '추천인 등록'}</button>
        </>}
      </div>
    </div>}
    {data?.eligible && <footer className="profile-account-footer"><Link to="/my-coins"><ProfileIcon name="credit-card"/>내꼬막에서 지급·사용 내역 확인 <span aria-hidden="true">↗</span></Link></footer>}
    {!data && !loading && <button type="button" className="profile-account-button profile-account-secondary" disabled={busy} onClick={() => perform(load)}>다시 불러오기</button>}
    <Dialog open={confirmOpen} onClose={closeConfirm} maxWidth={false} aria-labelledby="referral-confirm-title" slotProps={{paper:{className:'profile-design profile-modal'}}}>
      <div className="profile-dialog-shell"><header><div><ProfileIcon name="user-check"/><h2 id="referral-confirm-title">추천인 등록 확인</h2></div><button type="button" aria-label="닫기" disabled={busy} onClick={closeConfirm}><ProfileIcon name="x"/></button></header>
      <div className="profile-dialog-body profile-account-dialog-body">{feedback}<div className="profile-referral-email"><span>등록할 추천인</span><strong>{referrer.trim()}</strong></div><div className="profile-account-note"><ProfileIcon name="sparkles"/><p>추천인을 등록하면 50꼬막이 지급되며 30일간 사용할 수 있습니다. 등록 후에는 추천인을 변경할 수 없습니다.</p></div><p className="profile-account-description">위 정보로 추천인을 등록하시겠습니까?</p>
      <div className="profile-dialog-actions"><button type="button" disabled={busy} onClick={closeConfirm}>취소</button><button type="button" className="ns-hero-cta profile-account-confirm" disabled={busy} onClick={async () => {
        const succeeded = await perform(async () => {await registerReferral(referrer);setReferrer('');setMessage('추천인을 등록하고 보너스 50꼬막을 지급했습니다.');});
        if(succeeded)setConfirmOpen(false);
      }}>{busy ? '처리 중…' : '추천인 등록'}</button></div></div></div>
    </Dialog>
  </section>;
}
