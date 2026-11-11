/* eslint-disable react/prop-types */
import { useState } from "react";
import { Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import CalculateOutlinedIcon from "@mui/icons-material/CalculateOutlined";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import FaxOutlinedIcon from "@mui/icons-material/FaxOutlined";
import ForumOutlinedIcon from "@mui/icons-material/ForumOutlined";
import MonitorHeartOutlinedIcon from "@mui/icons-material/MonitorHeartOutlined";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import SwapHorizRoundedIcon from "@mui/icons-material/SwapHorizRounded";
import { Link } from "react-router-dom";

import { useAuth } from "@/auth/AuthContext";
import { PLAN_DOCUMENT_ESTIMATES, PLAN_INFO, PLAN_USAGE_NOTE, SIGNUP_PLAN_CODES } from "@/constants/plans";
import GroupInquiryDialog from "@/pages/components/GroupInquiryDialog";
import "./plan-guide.css";

const personalFeatures = [
  "보험 제안서 분석·보고서 생성", "쉬운 설명 자동 변환", "생성 보고서 보관", "모바일 웹팩스 발송·보조개톡 무료",
];
const planDetails = {
  FREE: { badge: "첫 시작 체험", aside: "카드 등록 불필요", features: ["보험 제안서 분석·보고서 생성 체험", "모바일 웹팩스 발송·보조개톡 무료", PLAN_INFO.FREE.summary] },
  BASIC: { badge: "가볍게 시작", aside: "1건당 약 633원", features: personalFeatures },
  STANDARD: { badge: "꾸준한 이용", aside: "1건당 약 580원", features: personalFeatures },
  PRO: { badge: "사용량이 많은 분", aside: "1건당 약 490원", features: [...personalFeatures, "대량 고객 상담·리모델링에 적합"] },
  GROUP: { name: "사무실 그룹", price: "별도 문의", priceUnit: "단체 할인", badge: "지점·본부·GA", aside: "단체 맞춤 요금", description: "GA 지점·본부 통합 운영 플랜", estimate: "인원과 운영 방식에 맞춘 이용 조건", features: ["사번 기반 그룹 로그인", "지점장 관리자 대시보드", "단체 맞춤형 운영 지원"] },
};

const features = [
  [SearchRoundedIcon, "5년치 청구 가능 보험금 확인", "건강e음 진료기록과 보장분석표를 대조해 놓친 청구 항목을 찾습니다."],
  [FactCheckOutlinedIcon, "알릴의무 1분 완성", "진료기록에서 3개월·1년·5년 고지 대상 항목을 정리합니다."],
  [MonitorHeartOutlinedIcon, "3분 보장분석", "보장 공백, 중복 가입, 갱신형 특약을 확인합니다."],
  [SwapHorizRoundedIcon, "보험사 상품별 비교 분석", "여러 보험사의 가입제안서에서 보험료와 핵심 담보를 비교합니다."],
  [DescriptionRoundedIcon, "복잡한 제안서 1장 요약", "여러 장의 가입제안서를 고객에게 설명하기 쉬운 보고서로 정리합니다."],
  [AutoAwesomeRoundedIcon, "리모델링 종합 리포트", "기존 보험과 새 설계의 보장과 보험료를 한눈에 비교합니다."],
  [FaxOutlinedIcon, "모바일 웹팩스 무료 청구", "청구서를 작성하고 스마트폰 웹팩스로 무료 발송하세요. PC 웹팩스 직접 발송은 유료입니다.", "모바일 발송 무료"],
  [ForumOutlinedIcon, "카톡 사후관리 자동화", "보조개톡으로 고객 안내와 정기 안부 발송을 관리하세요.", "전 회원 무료"],
];

function PlanCard({ code, user, isPersonalMember, onInquiry }) {
  const plan = { ...PLAN_INFO[code], ...planDetails[code] };
  const current = isPersonalMember && user.plan_code === code;
  return (
    <Paper component="article" variant="outlined" aria-labelledby={`plan-${code}`}
      className={`plan-guide__card plan-guide__card--${code.toLowerCase()}`}>
      <div className="plan-guide__card-top">
        <Chip size="small" label={plan.badge} className="plan-guide__plan-badge" />
        {plan.aside && <span>{plan.aside}</span>}
      </div>
      {code === "STANDARD" && <span className="plan-guide__recommendation">추천 요금제</span>}
      <Typography id={`plan-${code}`} component="h2" className="plan-guide__card-title">{plan.name}</Typography>
      <p className="plan-guide__description">{plan.description || plan.summary}</p>
      <p className="plan-guide__price"><strong>{plan.price}</strong><span> / {plan.priceUnit}</span></p>
      <div className="plan-guide__estimate">
        <strong>{plan.estimate || PLAN_DOCUMENT_ESTIMATES[code]}</strong>
        <span>{code === "GROUP" ? "소속 인원과 운영 환경에 맞춰 안내" : code === "FREE" ? "가입일부터 30일간 이용" : "월간 기본 이용량 기준"}</span>
      </div>
      <ul className="plan-guide__checklist">
        {plan.features.map(feature => <li key={feature}><CheckRoundedIcon aria-hidden="true" />{feature}</li>)}
      </ul>
      {code === "GROUP" ? (
        <Button className="plan-guide__cta" variant="contained" onClick={onInquiry} endIcon={<ArrowForwardRoundedIcon />}>단체 도입 문의</Button>
      ) : isPersonalMember && (current || code !== "FREE") ? (
        <Button className="plan-guide__cta" component={Link} to={current ? "/profile#plan" : `/profile?choosePlan=${code}#plan`}
          variant={code === "STANDARD" || code === "PRO" ? "contained" : "outlined"} endIcon={<ArrowForwardRoundedIcon />}>
          {current ? "현재 요금제 관리" : `${plan.name} 가입 신청`}
        </Button>
      ) : null}
    </Paper>
  );
}

export default function PlanGuidePage() {
  const { user } = useAuth();
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const isPersonalMember = user?.role === "USER" && !user.group_id;

  return (
    <Box className="plan-guide">
      <div className="plan-guide__workspace">
        <Paper component="header" variant="outlined" className="plan-guide__surface plan-guide__hero css-17o6koo">
          <div>
            <Stack direction="row" useFlexGap flexWrap="wrap" gap={1}>
              <Chip size="small" label="개인회원 · GA 지점 요금제" className="plan-guide__green-chip" />
              <Chip size="small" icon={<AutoAwesomeRoundedIcon />} label="모든 플랜 8대 실무 기능" className="plan-guide__violet-chip" />
            </Stack>
            <Typography className="css-bbwd96" component="h1">요금 안내</Typography>
            <p>보험 제안서 분석과 보고서 생성에 맞는 요금제를 찾아보세요.</p>
            <p><strong>모든 요금제에서 8대 실무 기능, 모바일 웹팩스 무료 발송, 보조개톡을 이용할 수 있습니다.</strong></p>
          </div>
          <div className="plan-guide__hero-facts">
            <div><span>AI 보고서 · PC 웹팩스 <DescriptionRoundedIcon /></span><strong>요금제별 문서 생성</strong><small>PC 웹팩스 직접 발송은 유료</small></div>
            <div><span>회원 공통 무료 혜택 <ForumOutlinedIcon /></span><strong>모바일팩스 · 보조개톡</strong><small>모바일 웹팩스 연동 발송 무료</small></div>
          </div>
        </Paper>

        <section aria-labelledby="plan-selection-title">
          <div className="plan-guide__section-heading plan-guide__selection-heading">
            <div>
              <Typography component="h2" id="plan-selection-title">나에게 맞는 요금제 선택</Typography>
              <p>내 구독 관리에서 요금제를 변경하거나 해지할 수 있습니다.</p>
            </div>
            <span className="plan-guide__count-summary"><CalculateOutlinedIcon />월 예상 생성 · 베이직 30번 · 스탠다드 50번 · 프로 100번</span>
          </div>
          <Box className="plan-guide__plans css-o5s4km">
            {[...SIGNUP_PLAN_CODES, "GROUP"].map(code => (
              <PlanCard key={code} code={code} user={user} isPersonalMember={isPersonalMember} onInquiry={() => setInquiryOpen(true)} />
            ))}
          </Box>
        </section>

        <section aria-labelledby="plan-features-title" className="plan-guide__features">
          <Chip size="small" label="전 회원 공통" className="plan-guide__green-chip" />
          <Typography component="h2" id="plan-features-title">보험 상담을 돕는 8대 실무 기능</Typography>
          <p>청구 가능성 확인부터 가입제안서 분석, 팩스 발송, 고객 사후관리까지 이어집니다.</p>
          <div className="plan-guide__feature-grid">
            {features.map(([Icon, title, description, badge], index) => (
              <article className="plan-guide__feature" key={title}>
                <div><span>{String(index + 1).padStart(2, "0")}</span><Icon aria-hidden="true" /></div>
                <Typography component="h3">{title}</Typography>
                <p>{description}</p>
                <small>{badge || "문서 생성 이용량 적용"}</small>
              </article>
            ))}
          </div>
          <div className="plan-guide__workflow">
            <div><strong>기존 수작업</strong><span>자료 수집, 엑셀 비교, 고지 항목 확인</span></div>
            <ArrowForwardRoundedIcon aria-hidden="true" />
            <div><strong>보조개로 정리</strong><span>보고서 요약, 고지 항목 점검, 상담 자료 준비</span></div>
          </div>
        </section>

        <Paper component="section" aria-labelledby="plan-comparison-title" variant="outlined" className="plan-guide__surface">
          <div className="plan-guide__section-heading">
            <span className="plan-guide__comparison-label">구독료 비교</span>
            <Typography component="h2" id="plan-comparison-title">서비스를 따로 구독할 때와 비교</Typography>
            <p>범용 AI, 보장분석, 고객관리 서비스를 각각 구독하는 경우를 가정한 예시입니다.</p>
          </div>
          <div className="plan-guide__comparison">
            <div>
              <Typography component="h3">기존 서비스 3종 개별 구독</Typography>
              <dl><dt>범용 AI</dt><dd>월 29,000원</dd><dt>보장분석·비교</dt><dd>월 38,000~103,000원</dd><dt>고객관리·카톡 발송</dt><dd>월 29,000원</dd></dl>
              <strong className="plan-guide__comparison-total">가정 합계 월 96,000~161,000원</strong>
            </div>
            <ArrowForwardRoundedIcon className="plan-guide__comparison-arrow" aria-hidden="true" />
            <div>
              <Typography component="h3">보조개 올인원 구독</Typography>
              <ul>
                <li><span><strong>베이직</strong><small>96,000원 → {PLAN_INFO.BASIC.price}</small></span><b>약 80% 절감</b></li>
                <li><span><strong>프로</strong><small>161,000원 → {PLAN_INFO.PRO.price}</small></span><b>약 70% 절감</b></li>
              </ul>
            </div>
          </div>
        </Paper>

        <Paper component="section" variant="outlined" aria-labelledby="plan-usage-note" className="plan-guide__surface css-56oyh4">
          <div className="plan-guide__section-heading">
            <Typography id="plan-usage-note" component="h2">이용 안내</Typography>
            <p>{PLAN_USAGE_NOTE}</p>
            {user?.group_id && <p>단체회원의 이용 조건은 소속 단체에 문의해 주세요.</p>}
          </div>
          <div className="plan-guide__usage">
            <div><h3>보고서와 팩스 이용 기준</h3><p>보고서 생성에 이용량이 적용됩니다. 생성된 보고서의 열람·편집·저장은 무료입니다. 모바일 웹팩스 연동 발송은 무료이며 PC 웹팩스 직접 발송은 유료입니다.</p></div>
            <div><h3>월 이용기간</h3><p>월간 구독은 결제 승인 후 한 달간 이용할 수 있습니다. 남은 월 이용량은 다음 이용기간으로 이월되지 않습니다.</p></div>
            <div><h3>오류와 환불</h3><p>보고서 생성 오류로 사용 처리된 이용량은 복구됩니다. 환불 처리 상태는 요청하기 메뉴에서 확인할 수 있습니다.</p><Button component={Link} to="/refund-requests" size="small">환불 요청 내역</Button></div>
          </div>
          {isPersonalMember && <Button component={Link} to="/profile#plan" endIcon={<ArrowForwardRoundedIcon />}>내 구독 관리</Button>}
        </Paper>
      </div>
      {inquiryOpen && <GroupInquiryDialog open onClose={() => setInquiryOpen(false)} />}
    </Box>
  );
}
