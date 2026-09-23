import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogContent,
  FormControlLabel,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import ForumRoundedIcon from "@mui/icons-material/ForumRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";

import { createGroupInquiry, groupInquiryError } from "@/services/group-inquiry-service";
import { shouldSkipLanding, skipLandingFromNowOn } from "@/auth/landing-preference-storage";
import "./landing.css";
import "./landing-reveal.css";
import "./landing-motion.css";
import "./landing-original.css";
import "./landing-preference.css";


const flowSteps = [
  {
    number: "01",
    icon: UploadFileRoundedIcon,
    eyebrow: "UPLOAD",
    title: "수십 장의 제안서를\n그대로 올리세요",
    description: "30~50페이지 원본 PDF를 다시 읽고 옮겨 적을 필요가 없습니다. 보조개가 제안서의 구조부터 파악합니다.",
    visual: "upload",
  },
  {
    number: "02",
    icon: AutoAwesomeRoundedIcon,
    eyebrow: "ANALYZE",
    title: "설명해야 할 핵심만\nAI가 골라냅니다",
    description: "암·뇌·심장 3대 진단비, 수술비, 보험료와 갱신 주기를 고객이 이해하기 쉬운 순서로 재구성합니다.",
    visual: "analyze",
  },
  {
    number: "03",
    icon: DescriptionRoundedIcon,
    eyebrow: "BRIEF",
    title: "고객 눈높이의\n한 장 브리핑으로",
    description: "복잡한 담보표 대신 중요한 보장과 체크포인트가 또렷한 고객 맞춤형 요약 페이지가 완성됩니다.",
    visual: "brief",
  },
  {
    number: "04",
    icon: SendRoundedIcon,
    eyebrow: "CONNECT",
    title: "카톡으로 보내고\n상담에 집중하세요",
    description: "비대면으로 바로 공유하고, 고객의 질문과 상담에 집중하세요. 이해하기 쉬운 설명이 소개 계약으로 이어집니다.",
    visual: "share",
  },
];

const reviews = [
  {
    before: "그동안 카톡으로 제안서 보내면 90%는 읽씹이었어요. 근데 보조개로 요약한 맞춤형 페이지를 딱 보내니까 ",
    highlight: "‘팀장님, 이전 보험이랑 비교해서 보장이 훨씬 좋네요!’",
    after: "라며 먼저 전화가 오더라고요. 거절했던 고객 4명을 비대면으로만 살려냈습니다.",
    initials: "김영",
    name: "김영우 설계사 (경력 4년차)",
    detail: "대형 GA 리치앤코 소속",
  },
  {
    before: "서류 요약하느라 매일 2시간씩 쓰던 시간을 완전히 상담과 DB 분석에 쏟고 있습니다. 무엇보다 ",
    highlight: "고객이 이해를 잘하니까 계약 끝나고 본인 남편, 친동생 제안서도 봐달라고 소개",
    after: "를 연달아 주셨어요. 월 29,000원은 계약 1건 수수료로도 수십 배 남습니다.",
    initials: "이수",
    name: "이수진 팀장 (MDRT 달성)",
    detail: "생명/손해보험 교차 설계사",
  },
  {
    before: "신인 설계사 시절에는 고객이 약관 질문하면 당황해서 말이 꼬였는데, 보조개 요약본에는 ",
    highlight: "‘고객에게 말할 핵심 멘트와 체크포인트’",
    after: "까지 짚어줘서 너무 든든합니다. 지점 전체 동료들에게도 무조건 쓰라고 추천하고 다녀요.",
    initials: "박민",
    name: "박민혁 지점장",
    detail: "글로벌금융판매 지점 운영",
  },
];

const plans = [
  { name: "1달 무료 체험", code: "FREE", price: "0원", unit: "30일", tag: "20회 무료", features: ["AI 요약 보고서 20회", "카드 등록 없이 시작", "월별 리셋·재지급 없음"] },
  { name: "베이직", code: "BASIC", price: "19,000원", unit: "월", tag: "가볍게 시작", features: ["매월 30P 지급", "쉬운 설명 자동 변환", "생성 보고서 아카이빙"] },
  { name: "스탠다드", code: "STANDARD", price: "29,000원", unit: "월", tag: "가장 선호", featured: true, features: ["매월 50P 지급", "쉬운 설명 자동 변환", "생성 보고서 아카이빙"] },
  { name: "프로", price: "49,000원", unit: "월", tag: "준비 중", comingSoon: true, features: ["프로 전용 부가 기능", "월 지급 포인트 추후 안내"] },
  { name: "사무실 그룹", price: "별도 문의", unit: "단체 할인", tag: "지점 · 본부 · GA", dark: true, features: ["사번 기반 그룹 로그인", "지점장 관리자 대시보드", "단체 맞춤형 운영 지원"] },
];

const faqs = [
  ["어떤 보험사의 제안서든 요약이 가능한가요?", "국내 손해보험 및 생명보험사의 표준 상품설명서와 제안서 PDF를 지원합니다."],
  ["고객 개인정보나 민감한 정보는 안전한가요?", "암호화 통신을 통해 분석하며, 제안서의 민감한 개인 식별 정보는 AI 학습용으로 영구 저장하지 않습니다."],
  ["체험판 1달 20회 생성 후 자동으로 결제되나요?", "아닙니다. 카드 등록 없이 1달 동안 20회를 사용할 수 있고, 기간 종료 후 자동 결제나 월별 리셋·재지급은 없습니다. 유료 전환은 직접 선택합니다."],
  ["사무실 그룹(GA 지점 등) 단위로 도입하려면 어떻게 하나요?", "단체 문의를 남겨주시면 사번 기반 그룹 로그인과 단체 운영 방식에 맞춰 안내해 드립니다."],
];

const emptyInquiry = {
  organizationName: "",
  contactName: "",
  phone: "",
  email: "",
  privacyAgreed: false,
  website: "",
};

const landingVideoUrl = import.meta.env.VITE_LANDING_VIDEO_URL
  || "https://assets.mixkit.co/videos/preview/mixkit-software-developer-working-on-code-screen-close-up-1728-large.mp4";

function ProductVisual({ type }) { // eslint-disable-line react/prop-types
  if (type === "upload") return (
    <div className="flow-visual upload-visual">
      <div className="file-sheet back" /><div className="file-sheet middle" />
      <div className="file-sheet front"><span>PDF</span><strong>고객 맞춤 제안서</strong><small>42 pages</small></div>
      <div className="upload-drop"><UploadFileRoundedIcon /><span>분석 준비 완료</span></div>
    </div>
  );
  if (type === "analyze") return (
    <div className="flow-visual analyze-visual">
      <div className="scan-line" />
      {["3대 진단비", "수술비", "갱신 주기", "월 보험료"].map((item, index) => (
        <div className="analysis-row" key={item}><span>{item}</span><i style={{ width: `${88 - index * 12}%` }} /></div>
      ))}
      <div className="ai-chip"><AutoAwesomeRoundedIcon /> AI 핵심 분석 중</div>
    </div>
  );
  if (type === "brief") return (
    <div className="flow-visual brief-visual">
      <div className="brief-header"><span>고객님을 위한 보장 브리핑</span><i /></div>
      <div className="brief-score"><strong>든든해요</strong><span>핵심 보장 균형</span></div>
      <div className="brief-bars"><i /><i /><i /></div>
      <div className="brief-note"><CheckRoundedIcon /> 꼭 확인할 내용까지 한눈에</div>
    </div>
  );
  return (
    <div className="flow-visual share-visual">
      <div className="phone-frame"><div className="phone-notch" /><div className="chat-bubble">고객님 제안서에서<br />꼭 보실 내용만 정리했어요.</div><div className="chat-card"><TaskAltRoundedIcon /><span>맞춤 보장 브리핑</span></div></div>
      <div className="sent-badge"><SendRoundedIcon /> 전송 완료</div>
    </div>
  );
}

function InquiryDialog({ open, onClose }) { // eslint-disable-line react/prop-types
  const [values, setValues] = useState(emptyInquiry);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);

  const update = (field) => (event) => setValues(current => ({
    ...current,
    [field]: field === "privacyAgreed" ? event.target.checked : event.target.value,
  }));
  const close = () => {
    if (working) return;
    onClose();
    window.setTimeout(() => { setValues(emptyInquiry); setError(""); setComplete(false); }, 200);
  };
  const submit = async (event) => {
    event.preventDefault();
    setWorking(true); setError("");
    try {
      await createGroupInquiry(values);
      setComplete(true);
    } catch (requestError) {
      setError(groupInquiryError(requestError));
    } finally {
      setWorking(false);
    }
  };

  return (
    <Dialog open={open} onClose={close} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 4, overflow: "visible" } }}>
      <IconButton aria-label="닫기" onClick={close} sx={{ position: "absolute", right: 12, top: 12, zIndex: 1 }}><CloseRoundedIcon /></IconButton>
      <DialogContent sx={{ p: { xs: 3, sm: 5 } }}>
        {complete ? (
          <Stack alignItems="center" spacing={2.2} sx={{ py: 3, textAlign: "center" }}>
            <Box className="success-mark"><CheckRoundedIcon /></Box>
            <Typography variant="h4" fontWeight={850}>문의가 접수되었습니다</Typography>
            <Typography color="text.secondary">담당자가 내용을 확인한 뒤 남겨주신 연락처로 안내해 드리겠습니다.</Typography>
            <Button variant="contained" onClick={close} sx={{ mt: 1, px: 5, minHeight: 48, borderRadius: 3, fontWeight: 800 }}>확인</Button>
          </Stack>
        ) : (
          <Stack component="form" spacing={2} onSubmit={submit}>
            <Box><Typography color="primary" fontWeight={800} fontSize={13}>GROUP PLAN</Typography><Typography variant="h4" fontWeight={850} sx={{ mt: .5 }}>단체 도입 문의</Typography><Typography color="text.secondary" sx={{ mt: 1 }}>사무실 운영 환경에 맞는 이용 방법과 단체 요금을 안내해 드립니다.</Typography></Box>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField label="단체명" value={values.organizationName} onChange={update("organizationName")} required inputProps={{ maxLength: 150 }} />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField label="담당자" value={values.contactName} onChange={update("contactName")} required fullWidth inputProps={{ maxLength: 100 }} />
              <TextField label="전화번호" type="tel" value={values.phone} onChange={update("phone")} required fullWidth inputProps={{ maxLength: 30, autoComplete: "tel" }} />
            </Stack>
            <TextField label="이메일" type="email" value={values.email} onChange={update("email")} required inputProps={{ maxLength: 320, autoComplete: "email" }} />
            <Box sx={{ position: "absolute", left: -10000, width: 1, height: 1, overflow: "hidden" }} aria-hidden="true"><TextField label="웹사이트" value={values.website} onChange={update("website")} tabIndex={-1} autoComplete="off" /></Box>
            <FormControlLabel control={<Checkbox checked={values.privacyAgreed} onChange={update("privacyAgreed")} required />} label={<Typography variant="body2" color="text.secondary">상담을 위한 개인정보 수집·이용에 동의합니다.</Typography>} />
            <Button type="submit" variant="contained" disabled={working || !values.privacyAgreed} endIcon={working ? null : <ArrowForwardRoundedIcon />} sx={{ minHeight: 54, borderRadius: 3, fontWeight: 850 }}>{working ? <CircularProgress size={23} color="inherit" /> : "문의 접수하기"}</Button>
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);
  const pageRef = useRef(null);
  const authRedirect = searchParams.get("error") || searchParams.get("passwordChanged");

  useEffect(() => {
    const elements = pageRef.current?.querySelectorAll("[data-reveal]") || [];
    if (!window.IntersectionObserver || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      elements.forEach(element => { element.dataset.revealed = "true"; });
      return undefined;
    }
    pageRef.current?.classList.add("reveal-ready");
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) entry.target.dataset.revealed = "true"; });
    }, { threshold: 0.13 });
    elements.forEach(element => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const page = pageRef.current;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!page || reducedMotion) return undefined;

    const flow = page.querySelector(".flow-section");
    const steps = [...page.querySelectorAll(".flow-step")];
    const heroProduct = page.querySelector(".hero-product");
    const finalCta = page.querySelector(".final-cta");
    let frame = 0;

    const updateScrollMotion = () => {
      frame = 0;
      if (flow) {
        const rect = flow.getBoundingClientRect();
        const travel = Math.max(rect.height - window.innerHeight * 0.45, 1);
        const progress = Math.min(1, Math.max(0, (window.innerHeight * 0.55 - rect.top) / travel));
        flow.style.setProperty("--flow-progress", String(progress));
      }

      let activeStep = null;
      let nearestDistance = Number.POSITIVE_INFINITY;
      steps.forEach(step => {
        const rect = step.getBoundingClientRect();
        const distance = Math.abs(rect.top + rect.height / 2 - window.innerHeight * 0.52);
        if (distance < nearestDistance && rect.bottom > 0 && rect.top < window.innerHeight) {
          activeStep = step;
          nearestDistance = distance;
        }
      });
      steps.forEach(step => { step.dataset.active = step === activeStep ? "true" : "false"; });

      if (heroProduct) {
        const heroRect = heroProduct.getBoundingClientRect();
        heroProduct.style.setProperty("--scroll-lift", `${Math.max(-24, Math.min(24, -heroRect.top * 0.045))}px`);
      }
      if (finalCta) {
        const ctaRect = finalCta.getBoundingClientRect();
        finalCta.style.setProperty("--cta-drift", `${Math.max(-50, Math.min(50, (window.innerHeight - ctaRect.top) * 0.06))}px`);
      }
    };
    const requestScrollMotion = () => {
      if (!frame) frame = window.requestAnimationFrame(updateScrollMotion);
    };

    const pointerFine = window.matchMedia("(pointer: fine)").matches;
    const tilt = (event) => {
      if (!heroProduct || !pointerFine) return;
      const rect = heroProduct.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      heroProduct.style.setProperty("--tilt-x", `${-y * 5}deg`);
      heroProduct.style.setProperty("--tilt-y", `${x * 7}deg`);
    };
    const resetTilt = () => {
      heroProduct?.style.setProperty("--tilt-x", "0deg");
      heroProduct?.style.setProperty("--tilt-y", "0deg");
    };

    window.addEventListener("scroll", requestScrollMotion, { passive: true });
    window.addEventListener("resize", requestScrollMotion);
    heroProduct?.addEventListener("pointermove", tilt);
    heroProduct?.addEventListener("pointerleave", resetTilt);
    updateScrollMotion();

    return () => {
      window.removeEventListener("scroll", requestScrollMotion);
      window.removeEventListener("resize", requestScrollMotion);
      heroProduct?.removeEventListener("pointermove", tilt);
      heroProduct?.removeEventListener("pointerleave", resetTilt);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    const counters = [...(pageRef.current?.querySelectorAll("[data-count]") || [])];
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!window.IntersectionObserver || reducedMotion) return undefined;
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting || entry.target.dataset.counted) return;
        entry.target.dataset.counted = "true";
        const target = Number(entry.target.dataset.count);
        const decimals = Number(entry.target.dataset.decimals || 0);
        const start = performance.now();
        const duration = 1250;
        const tick = (now) => {
          const elapsed = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - elapsed, 4);
          entry.target.textContent = (target * eased).toLocaleString("ko-KR", {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          });
          if (elapsed < 1) window.requestAnimationFrame(tick);
        };
        window.requestAnimationFrame(tick);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.6 });
    counters.forEach(counter => observer.observe(counter));
    return () => observer.disconnect();
  }, []);

  if (authRedirect) return <Navigate to={`/login?${searchParams.toString()}`} replace />;
  if (shouldSkipLanding()) return <Navigate to="/login" replace />;
  const goLogin = (method = "personal", plan) => navigate(plan ? `/login?method=${method}&plan=${plan}` : `/login?method=${method}`);
  const skipLanding = () => {
    skipLandingFromNowOn();
    navigate("/login", { replace: true });
  };

  return (
    <Box ref={pageRef} className="landing-page">
      <header className="landing-header">
        <a className="brand" href="#top" aria-label="보조개 홈"><span className="brand-mark landing-brand-mark"><span className="brand-full">BOJOGAE</span><span className="brand-mobile">B</span></span><span>보조개<small>AI 개인비서</small></span></a>
        <nav aria-label="랜딩페이지 메뉴"><a href="#features">핵심 기능</a><a href="#demo-preview">시연 영상</a><a href="#benefits">도입 효과</a><a href="#reviews">설계사 후기</a><a href="#pricing">요금 안내</a></nav>
        <div className="header-actions"><button className="skip-landing-button" onClick={skipLanding}>다음부터 로그인 화면으로</button><button className="pill-button" aria-label="기존 회원 로그인" onClick={() => navigate("/login")}>로그인 <ArrowForwardRoundedIcon /></button></div>
      </header>

      <main id="top">
        <section className="hero-section">
          <div className="hero-orb orb-one" /><div className="hero-orb orb-two" />
          <div className="hero-copy" data-reveal>
            <div className="eyebrow-pill"><span /> 수십 장의 복잡한 보험 제안서, 1~2분 만에 고객 맞춤 리포트로</div>
            <h1>복잡한 제안서는 <em>보조개 AI</em>에게 맡기고,<br />설계사님은 <strong>상담과 계약</strong>에만 집중하세요.</h1>
            <p>어려운 약관과 복잡한 담보 표에 지친 고객의 마음을 엽니다. AI가 핵심만 짚어낸 <b>고객 맞춤형 요약 페이지</b>로 비대면 상담 거절률은 낮추고, 자발적인 소개 계약을 만들어냅니다.</p>
            <div className="hero-actions"><button className="primary-cta" onClick={() => goLogin("personal", "FREE")}>1달 무료 체험 시작하기 (20회 무료) <ArrowForwardRoundedIcon /></button><a className="secondary-cta" href="#demo-preview">작동 영상 및 데모 보기 <KeyboardArrowDownRoundedIcon /></a></div>
            <div className="hero-trust"><span><CheckRoundedIcon /> 카드 등록 없음</span><span><CheckRoundedIcon /> 20회 무료</span><span><LockRoundedIcon /> 최초 30일 한정</span></div>
          </div>
          <div id="demo-preview" className="hero-product demo-window" data-reveal>
            <div className="demo-window-bar"><span className="traffic-lights"><i /><i /><i /></span><span>bojogae.net · AI 제안서 요약 생성기</span><b><i /> AI 요약 엔진 정상 가동 중</b></div>
            <div className="demo-video-wrap">
              <video controls playsInline preload="metadata" poster="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1200&q=80">
                <source src={landingVideoUrl} type="video/mp4" />
                사용 중인 브라우저가 비디오 태그를 지원하지 않습니다.
              </video>
              <div className="demo-video-badge"><b>1~2분 완성</b><span>제안서 PDF 업로드부터 맞춤 요약 페이지 완성까지</span></div>
            </div>
            <div className="demo-steps">
              <div><b>1</b><span><strong>제안서 파일 업로드</strong><small>30~50페이지 원본 PDF</small></span></div>
              <div><b>2</b><span><strong>AI 자동 분석</strong><small>핵심 보장과 보험료 추출</small></span></div>
              <div><b>3</b><span><strong>맞춤 페이지 완성</strong><small>카카오톡 상담에 바로 활용</small></span></div>
            </div>
          </div>
          <a href="#proof" className="scroll-cue"><span>SCROLL TO EXPLORE</span><i /></a>
        </section>

        <section id="proof" className="proof-section" aria-label="서비스 이용 지표">
          <div className="proof-heading" data-reveal><span>PROVEN BY TOP AGENTS</span><h2>현직 보험설계사님들이 이미 보조개와 함께 뛰고 있습니다</h2></div>
          <div className="proof-grid">
            <article data-reveal><strong className="blue"><span data-count="3850">3,850</span><sup>+</sup></strong><b>누적 활성 설계사 회원</b><small>전국 대형 GA 및 원수사</small></article>
            <article data-reveal><strong><span data-count="54200">54,200</span><sup>+</sup></strong><b>생성된 AI 요약 브리핑</b><small>매일 1,200건 이상 생성</small></article>
            <article data-reveal><strong className="blue"><span data-count="85">85</span><sup>% ↓</sup></strong><b>제안서 준비 시간 단축</b><small>평균 40분 → 단 3분</small></article>
            <article data-reveal><strong className="amber"><span data-count="4.9" data-decimals="1">4.9</span><sup>/ 5.0</sup></strong><b>설계사 실사용 만족도</b><small>소개 계약 창출율 +42%</small></article>
          </div>
        </section>

        <div className="capability-marquee" aria-hidden="true"><div className="marquee-track">{["PDF UPLOAD", "AI ANALYSIS", "CUSTOMER BRIEF", "MOBILE SHARE", "MORE CONVERSATION", "PDF UPLOAD", "AI ANALYSIS", "CUSTOMER BRIEF", "MOBILE SHARE", "MORE CONVERSATION"].map((item, index) => <span key={`${item}-${index}`}><i />{item}</span>)}</div></div>

        <section id="flow" className="flow-section">
          <div className="section-heading" data-reveal><span>ONE SIMPLE FLOW</span><h2>올리고, 이해하고,<br />마음을 움직이세요.</h2><p>보조개가 복잡한 문서를 고객과의 대화로 바꾸는 과정입니다.</p></div>
          <div className="flow-list">
            <div className="flow-line" aria-hidden="true"><i /></div>
            {flowSteps.map(step => { const Icon = step.icon; return (
              <article className="flow-step" key={step.number} data-step={step.number} data-reveal>
                <div className="flow-copy"><span className="step-number">{step.number}</span><div className="step-icon"><Icon /></div><small>{step.eyebrow}</small><h3>{step.title.split("\n").map((line, index) => <span key={line}>{line}{index === 0 && <br />}</span>)}</h3><p>{step.description}</p></div>
                <ProductVisual type={step.visual} />
              </article>
            ); })}
          </div>
        </section>

        <section id="features" className="original-benefit-section">
          <div className="original-section-heading" data-reveal><span>WHY BOJOGAE?</span><h2>왜 잘 팔리는 설계사는 <em>‘보조개’</em>를 쓸까요?</h2><p>수많은 보장 내용과 깨알 같은 글씨로 가득한 설계서는 고객을 망설이게 합니다.<br />보조개는 설계사의 시간 비용을 없애고, 고객에게는 “당장 계약하고 싶은 확신”을 선물합니다.</p></div>
          <div className="before-after-grid">
            <article className="comparison-card before-card" data-reveal><span className="comparison-label">기존의 힘든 영업 방식</span><h3><i>×</i> 보조개를 쓰기 전</h3><ul><li><b>야근을 부르는 제안서 작업</b><p>고객 1명을 위해 30~50장짜리 설계서를 뜯어보며 PPT로 재가공하느라 밤 11시 퇴근.</p></li><li><b>비대면 상담의 허탈한 거절</b><p>PDF 전체를 카톡으로 보내면 고객은 “내용이 너무 어려워서 나중에 볼게요”라며 연락 두절.</p></li><li><b>단발성 계약에 그침</b><p>설계 내용이 와닿지 않아 계약 후 지인 소개나 가족 추가 계약으로 이어지지 않음.</p></li></ul></article>
            <article className="comparison-card after-card" data-reveal><span className="comparison-label">보조개 도입 후 실적 혁신</span><h3><i>✓</i> 보조개와 함께한 후</h3><ul><li><b>상담 준비 1~2분 컷</b><p>업로드 후 핵심 요약, 기존 계약 대비 개선점, 추천 플랜이 알기 쉬운 맞춤 페이지로 자동 생성.</p></li><li><b>거절했던 가망고객 재성약</b><p>스마트폰에서 쉽게 읽히는 맞춤형 페이지로 “이해하기 너무 쉽다”며 상담 신청 역주행.</p></li><li><b>고객 감동이 부르는 소개</b><p>고객이 가족과 지인에게 그대로 공유하면서 새로운 소개 계약으로 자연스럽게 연결.</p></li></ul></article>
          </div>
          <div id="benefits" className="original-feature-grid">
            <article data-reveal><div className="original-feature-icon blue"><AutoAwesomeRoundedIcon /></div><h3>AI 초고속 핵심 요약</h3><p>암·뇌·심장 3대 진단비, 수술비, 특약 갱신 주기를 AI가 스캔해 설계사가 설명하기 편한 순서대로 재배열합니다.</p></article>
            <article data-reveal><div className="original-feature-icon indigo"><ForumRoundedIcon /></div><h3>비대면 카톡 발송 최적화</h3><p>모바일 화면에 최적화된 리포트를 생성하여 전화나 대면 만남을 꺼리던 고객과도 비대면 상담을 이어갈 수 있습니다.</p></article>
            <article data-reveal><div className="original-feature-icon green"><GroupsRoundedIcon /></div><h3>소개 전환율 극대화</h3><p>고객이 가족이나 지인에게 “이 설계사가 정리해 준 거 봐봐”라며 링크나 이미지를 그대로 전달할 수 있습니다.</p></article>
          </div>
        </section>

        <section id="reviews" className="review-section">
          <div className="section-heading light" data-reveal><span>REAL REVIEWS</span><h2>“보조개 도입 후 상담의 질과<br />통장 잔고가 달라졌습니다”</h2><p>현직 설계사님들이 직접 경험하고 남겨주신 솔직한 평가입니다.</p></div>
          <div className="review-grid">{reviews.map(review => <article key={review.name} data-reveal><div className="review-rating">★★★★★ <span>평점 5.0</span></div><p>“{review.before}<strong>{review.highlight}</strong>{review.after}”</p><footer><span className="review-avatar">{review.initials}</span><div><b>{review.name}</b><small>{review.detail}</small></div></footer></article>)}</div>
        </section>

        <section id="pricing" className="pricing-section">
          <div className="section-heading" data-reveal><span>PRICING PLAN</span><h2>부담 없는 요금으로<br />나만의 AI 영업 비서를 두세요</h2><p>1달간 20회 무료 체험으로 먼저 효과를 검증해보세요. 유료 전환은 직접 선택합니다.</p></div>
          <div className="pricing-grid">{plans.map(plan => <article key={plan.name} className={`${plan.featured ? "featured" : ""} ${plan.dark ? "dark" : ""} ${plan.comingSoon ? "coming-soon" : ""}`} data-reveal><span className="plan-tag">{plan.tag}</span><h3>{plan.name}</h3><div className="plan-price"><strong>{plan.price}</strong><small>/ {plan.unit}</small></div><ul>{plan.features.map(feature => <li key={feature}><CheckRoundedIcon />{feature}</li>)}</ul><button disabled={plan.comingSoon} onClick={() => plan.dark ? setInquiryOpen(true) : goLogin("personal", plan.code)}>{plan.comingSoon ? "출시 준비 중" : plan.dark ? "단체 도입 문의" : plan.code === "FREE" ? "무료로 시작" : `${plan.name} 가입 신청`}{!plan.comingSoon && <ArrowForwardRoundedIcon />}</button></article>)}</div>
        </section>

        <section className="faq-section"><div className="faq-heading" data-reveal><span>FAQ</span><h2>자주 묻는 질문</h2><p>보조개 서비스 이용에 관해 궁금한 점을 확인하세요.</p></div><div className="faq-list">{faqs.map(([question, answer], index) => <article key={question} className={openFaq === index ? "open" : ""} data-reveal><button onClick={() => setOpenFaq(openFaq === index ? -1 : index)} aria-expanded={openFaq === index}><span>{question}</span><i>+</i></button><div><p>{answer}</p></div></article>)}</div></section>

        <section className="final-cta" data-reveal><div><span>YOUR NEXT PROPOSAL</span><h2>다음 제안서는<br />보조개와 시작하세요.</h2><p>정리는 AI에게 맡기고, 설계사님은 고객의 마음에 집중하세요.</p></div><div className="final-actions"><button onClick={() => goLogin("personal", "FREE")}>1달 무료 체험 시작 (20회 제공) <ArrowForwardRoundedIcon /></button><button className="outline" onClick={() => setInquiryOpen(true)}>단체 도입 문의</button></div></section>
      </main>

      <footer className="landing-footer"><a className="brand footer-brand" href="#top"><span className="brand-mark">B</span><span>보조개<small>보험설계사를 조력하는 AI 개인비서</small></span></a><div><button onClick={() => goLogin("group")}>단체 로그인</button><button onClick={() => goLogin()}>개인 로그인</button><a href="#pricing">이용 요금</a><Link to="/terms">서비스이용약관</Link><Link to="/privacy">개인정보처리방침</Link></div><p>© 2026 BOJOGAE. All rights reserved.</p></footer>
      <InquiryDialog open={inquiryOpen} onClose={() => setInquiryOpen(false)} />
    </Box>
  );
}
