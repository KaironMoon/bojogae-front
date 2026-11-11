import { useLocation, useNavigate } from "react-router-dom";
import api from "@/services/api-caller";
import { Alert, Box, CircularProgress, Dialog } from "@mui/material";
import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/auth/AuthContext";
import {
  getMyProfile,
  requestEmailChange,
  updateMyProfile,
  verifyEmailChangeCode,
} from "@/services/profile-service";
import { requestOwnPasswordReset } from "@/services/group-service";
import PlanSection from "@/pages/profile/PlanSection";
import ReferralSection from "@/pages/profile/ReferralSection";
import {
  disableBrowserPush,
  enableBrowserPush,
  getBrowserPushState,
} from "@/services/web-push-service";

import ProfileReference from './design/ProfileReference';
import EmailReference from './design/EmailReference';
import PushReference from './design/PushReference';
import ProfileIcon from './design/ProfileIcon';
import { AccountWithdrawal, WithdrawalNotice } from './design/AccountWithdrawal';
import './design/profile-utilities.css';
import './design/profile-source.css';
import './design/profile-integration.css';

const emptyProfile = { email: "", name: "", nickname: "", phone: "", affiliation: "", branch_name: "" };

const errorMessages = {
  invalid_profile_input: "GA 소속·이름·전화번호와 입력 형식을 확인해 주세요.",
  payment_method_pending: "결제수단 변경 결과 확인이 필요합니다. 결제수단 관리에서 확인한 후 다시 시도해 주세요.",
  withdrawal_schema_required: "탈퇴 자료 파기 설정이 준비되지 않았습니다. 고객센터로 문의해 주세요.",
  withdraw_failed: "탈퇴하지 못했습니다. 잠시 후 다시 시도해 주세요.",
  password_reset_unavailable: "등록한 이메일이 있는 그룹 회원만 비밀번호를 재설정할 수 있습니다.",
  email_unchanged: "현재 사용 중인 이메일입니다.",
  email_already_in_use: "이미 다른 계정에서 사용 중인 이메일입니다.",
  email_resend_too_soon: "인증메일은 60초 후에 다시 요청할 수 있습니다.",
  email_delivery_failed: "인증메일을 보내지 못했습니다. 잠시 후 다시 시도해 주세요.",
  invalid_verification_code: "인증번호가 올바르지 않습니다.",
  verification_locked: "인증번호 입력 횟수를 초과했습니다. 인증메일을 다시 요청해 주세요.",
  verification_expired: "인증이 만료되었습니다. 이메일 변경을 다시 요청해 주세요.",
};

function requestErrorCode(error) {
  return error.response?.data?.detail || "unknown";
}

function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [billingRevision,setBillingRevision] = useState(0);
  const [modal, setModal] = useState(null);
  const [balance,setBalance] = useState(null);
  const [gaOpen,setGaOpen] = useState(false);
  const [gaOptions,setGaOptions] = useState([]);
  const [gaError,setGaError] = useState(false);
  const [gaIndex,setGaIndex] = useState(-1);
  const [profile, setProfile] = useState(emptyProfile);
  const [savedEmail, setSavedEmail] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [requestToken, setRequestToken] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const refreshBilling = useCallback(async () => { await refreshUser(); setBillingRevision(value => value + 1); }, [refreshUser]);
  const contactSaved = useCallback((updated) => {
    setProfile((value) => ({ ...value, name:updated.name || '', phone:updated.phone || '', email:updated.pending_email || updated.email || '' }));
    setSavedEmail(updated.email || '');
    setPendingEmail(updated.pending_email || '');
    setRequestToken(''); setCode('');
    setMessage(updated.pending_email ? '결제자 정보를 저장했습니다. 변경한 이메일은 아래에서 인증해 주세요.' : '결제자 정보를 내정보에 저장했습니다.');
  }, []);
  const [pushState, setPushState] = useState(null);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushMessage, setPushMessage] = useState("");
  const [pushError, setPushError] = useState("");

  useEffect(() => {
    getMyProfile()
      .then((data) => {
        setProfile({
          email: data.pending_email || data.email || "",
          name: data.name || "",
          nickname: data.nickname || "",
          phone: data.phone || "",
          affiliation: data.affiliation || "",
          branch_name: data.branch_name || "",
        });
        setSavedEmail(data.email || "");
        setPendingEmail(data.pending_email || "");
      })
      .catch(() => setError("profile_load_failed"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!loading && location.hash === '#email-verification') {
      document.getElementById('email-verification')?.scrollIntoView({ block:'center' });
    }
  }, [loading, location.hash]);

  useEffect(() => {
    getBrowserPushState()
      .then(setPushState)
      .catch(() => setPushState({ supported: true, configured: false, permission: typeof Notification === "undefined" ? "unsupported" : Notification.permission, subscribed: false }));
  }, []);

  useEffect(() => {
    let active = true;
    api.get('/api/v1/points/me').then(({data}) => {if(active)setBalance(data.total_points);}).catch(() => {});
    return () => {active=false;};
  }, []);
  useEffect(() => {
    let active = true;
    setGaOptions([]); setGaError(false); setGaIndex(-1);
    const timer=setTimeout(() => {
      if(!profile.affiliation.trim()) return;
      api.get('/api/v1/ga-companies',{q:profile.affiliation.trim()}).then(({data}) => {
        if(active)setGaOptions([...new Set(data.map(item => item.display_name))]);
      }).catch(() => {if(active)setGaError(true);});
    },250);
    return () => {active=false;clearTimeout(timer);};
  },[profile.affiliation]);
  useEffect(() => {
    const params=new URLSearchParams(location.search);
    if (['paymentReturn','billingReturn','signupPlan','mobilpayIssue'].some(key => params.has(key))) setModal('billing');
  },[location.search]);

  const updateField = (field) => (event) => {
    setProfile((value) => ({ ...value, [field]: event.target.value }));
    setMessage("");
    setError("");
    if (field === "email") {
      setRequestToken("");
      setCode("");
    }
  };

  const withdraw = async () => {
    setSaving(true); setError("");
    try {
      await api.delete('/api/v1/users/me/account');
      await refreshUser();
      navigate('/', { replace:true });
    } catch (requestError) { setError(requestError.response?.data?.detail || 'withdraw_failed'); }
    finally { setSaving(false); }
  };

  const saveProfile = async () => {
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const updated = await updateMyProfile({
        name: profile.name || null,
        nickname: profile.nickname || null,
        phone: profile.phone || null,
        affiliation: profile.affiliation,
        branch_name: profile.branch_name || null,
      });
      setProfile((value) => ({
        ...value,
        name: updated.name || "",
        nickname: updated.nickname || "",
        phone: updated.phone || "",
        affiliation: updated.affiliation || "",
        branch_name: updated.branch_name || "",
      }));
      await refreshUser();
      setMessage("내 정보가 저장되었습니다.");
    } catch (requestError) {
      setError(Array.isArray(requestError.response?.data?.detail) ? "invalid_profile_input" : "profile_save_failed");
    } finally {
      setSaving(false);
    }
  };

  const sendEmailChange = async () => {
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const result = await requestEmailChange(profile.email);
      setRequestToken(result.request_token);
      setCode("");
      setMessage("새 이메일로 인증메일을 보냈습니다.");
    } catch (requestError) {
      setError(requestErrorCode(requestError));
    } finally {
      setSaving(false);
    }
  };

  const confirmEmailCode = async () => {
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const updated = await verifyEmailChangeCode(requestToken, code);
      setSavedEmail(updated.email || "");
      setPendingEmail(updated.pending_email || "");
      setProfile((value) => ({ ...value, email: updated.pending_email || updated.email || "" }));
      setRequestToken("");
      setCode("");
      await refreshUser();
      setMessage("이메일이 변경되었습니다.");
      setModal(null);
    } catch (requestError) {
      setError(requestErrorCode(requestError));
    } finally {
      setSaving(false);
    }
  };

  const changePushSubscription = async () => {
    setPushBusy(true);
    setPushMessage("");
    setPushError("");
    try {
      const next = pushState?.subscribed
        ? await disableBrowserPush()
        : await enableBrowserPush(pushState?.publicKey);
      setPushState(next);
      setModal(null);
      setPushMessage(next.subscribed ? "이 브라우저에서 알림을 받습니다." : "이 브라우저의 알림을 해제했습니다.");
    } catch (pushRequestError) {
      const code = pushRequestError.response?.data?.detail || pushRequestError.message;
      setPushError(code === "browser_push_permission_denied"
        ? "브라우저에서 알림 권한이 차단되었습니다. 브라우저 사이트 설정에서 권한을 허용해주세요."
        : "브라우저 알림 설정을 변경하지 못했습니다. 잠시 후 다시 시도해주세요.");
      getBrowserPushState().then(setPushState).catch(() => {});
    } finally {
      setPushBusy(false);
    }
  };

  if (loading) {
    return <Box sx={{ minHeight: 420, display: "grid", placeItems: "center" }}><CircularProgress /></Box>;
  }

  const resetOwnPassword = async () => {
    setSaving(true); setError(""); setMessage("");
    try {
      await requestOwnPasswordReset();
      setMessage("등록한 이메일로 비밀번호 재설정 링크를 요청했습니다. 이메일을 확인해 주세요. 재요청은 1분 후 가능합니다.");
    } catch (requestError) {
      setError(errorMessages[requestErrorCode(requestError)] || "재설정 이메일을 요청하지 못했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const emailChanged = profile.email.trim().toLowerCase() !== savedEmail.toLowerCase();

  const closeModal = () => { if (!saving && !pushBusy) setModal(null); };
  const feedback = <>{message && <Alert severity="success">{message}</Alert>}{error && <Alert severity="error">{errorMessages[error] || (error === 'profile_load_failed' ? '내 정보를 불러오지 못했습니다.' : '요청을 처리하지 못했습니다. 다시 시도해 주세요.')}</Alert>}</>;
  const pushFeedback = <>{pushMessage && <Alert severity="success">{pushMessage}</Alert>}{pushError && <Alert severity="error">{pushError}</Alert>}{pushState && !pushState.supported && <Alert severity="info">이 브라우저에서는 Web Push를 사용할 수 없습니다.</Alert>}{pushState?.supported && !pushState.configured && <Alert severity="warning">브라우저 알림 서버 설정이 아직 완료되지 않았습니다.</Alert>}{pushState?.permission === 'denied' && <Alert severity="warning">브라우저 사이트 설정에서 알림 권한을 허용해 주세요.</Alert>}</>;
  const selectGa = value => {setProfile(p => ({...p,affiliation:value}));setGaOpen(false);setMessage('');setError('');};
  const gaKeyDown = event => {
    if(event.key === 'Escape')setGaOpen(false);
    if(event.key === 'ArrowDown' || event.key === 'ArrowUp') {event.preventDefault();setGaOpen(true);setGaIndex(i=>Math.max(0,Math.min(gaOptions.length-1,i+(event.key==='ArrowDown'?1:-1))));}
    if(event.key === 'Enter' && gaOpen && gaOptions[gaIndex]) {event.preventDefault();selectGa(gaOptions[gaIndex]);}
  };
  const vm = {user,profile,savedEmail,pendingEmail,saving,code,setCode,requestToken,emailChanged,
    updateField,saveProfile,sendEmailChange,confirmEmailCode,resetOwnPassword,feedback,pushFeedback,
    pushState,pushBusy,balance,billingRevision,modal,setModal,closeModal,navigate,gaOpen,setGaOpen,gaOptions,gaError,gaIndex,gaKeyDown,selectGa,
    openBilling:()=>setModal('billing'), confirmPush:async()=>{await changePushSubscription();},
    saveDisabled:saving || !profile.name.trim() || !profile.affiliation.trim() || !/^\+?[\d\s()-]{8,30}$/.test(profile.phone.trim()),
    extraSections:<><ReferralSection key={savedEmail}/>{user?.role === 'USER' && !user?.group_id && <AccountWithdrawal onWithdraw={()=>{setError('');setMessage('');setModal('withdraw');}} onBilling={()=>setModal('billing')}/>}</>};
  return <><div className="profile-design profile-page"><ProfileReference vm={vm}/></div>
    <Dialog open={Boolean(modal)} onClose={closeModal} maxWidth={false} aria-label={{email:'새 이메일 주소 인증 및 변경',push:'브라우저 알림 설정',billing:'월간 구독권 · 결제수단 관리',withdraw:'회원 탈퇴 확인'}[modal]} slotProps={{paper:{className:`profile-design profile-modal ${modal === 'billing' ? 'profile-billing-modal' : ''}`}}}>
      {modal === 'email' && <EmailReference vm={vm}/>}
      {modal === 'push' && <PushReference vm={vm}/>}
      {['billing','withdraw'].includes(modal) && <div className={`profile-dialog-shell ${modal === 'withdraw' ? 'profile-withdrawal-dialog' : ''}`}><header><div><ProfileIcon name={modal === 'billing' ? 'credit-card' : 'shield-alert'} className="w-4 h-4"/><h2>{modal === 'billing' ? '월간 구독권 · 결제수단 관리' : '회원 탈퇴 확인'}</h2></div><button type="button" aria-label="닫기" disabled={saving} onClick={closeModal}><ProfileIcon name="x"/></button></header><div className="profile-dialog-body">
      {modal === 'billing' ? <PlanSection sectionId="profile-plan-management" onChanged={refreshBilling} onContactSaved={contactSaved}/> : <>{feedback}<WithdrawalNotice/><div className="profile-dialog-actions"><button type="button" disabled={saving} onClick={closeModal}>취소</button><button type="button" disabled={saving} className="profile-danger" onClick={withdraw}>회원 탈퇴</button></div></>}
      </div></div>}
    </Dialog>
  </>;
}
export default ProfilePage;
