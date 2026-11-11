/* eslint-disable react/prop-types */
import { useState } from "react";
import { Dialog, DialogActions, DialogContent, DialogTitle, Tab, Tabs, Button } from "@mui/material";
import ArrowOutwardRoundedIcon from "@mui/icons-material/ArrowOutwardRounded";
import PlayCircleOutlineRoundedIcon from "@mui/icons-material/PlayCircleOutlineRounded";
import { PLAN_INFO } from "@/constants/plans";

const videos = [
  ["bvClY68_mpI", "보조개의 보험금 청구 보조개 하나면 끝", "2:49", ["청구할 보험사를 선택합니다.", "청구인 정보를 입력하고 서명과 서류를 첨부합니다.", "완성된 청구서를 확인하고 제출 방식을 선택합니다."]],
  ["-FSahEayni4", "보험금 청구 모바일 팩스로 무료 전송하기", "2:55", ["스마트폰에서 청구내역을 엽니다.", "보험사 팩스번호를 복사합니다.", "분할본을 공유해 모바일팩스 앱에서 발송합니다."]],
  ["uXAGJpEYbXA", "여러 신규 보험들 1장 요약 보고서 생성", "2:13", ["신규 제안서 PDF를 올립니다.", "핵심 담보와 보험료를 한곳에 모읍니다.", "한 장 요약을 고객에게 공유합니다."]],
  ["vSfzo202ik4", "청구 서류로 보험금 예상 수령액 계산 및 청구 가능 보험사 안내", "2:46", ["보장분석표와 청구 서류를 첨부합니다.", "보험사별 예상 지급액과 청구 가능성을 검토합니다.", "실제 청구 기준을 보험사에 확인합니다."]],
  ["wkNfG7Eq6QI", "리모델링 보고서 생성", "5:31", ["기존 보장분석과 새 제안서를 첨부합니다.", "유지할 계약과 정리할 계약을 구분합니다.", "변경 전후의 보험료와 보장을 비교합니다."]],
  ["Ij6LjBcz0TQ", "보험 가입제안서 요약 보고서 생성", "2:05", ["보험사 가입제안서 PDF를 올립니다.", "진단비·수술비와 주요 특약을 정리합니다.", "고객에게 보여줄 한 장 요약을 확인합니다."]],
  ["xLiUCLmdJuo", "보험사(상품) 비교 (2개 ~ 5개)", "2:04", ["비교할 제안서 PDF를 올립니다.", "보험료와 주요 담보를 나란히 놓고 확인합니다.", "비교 결과를 상담에 활용합니다."]],
  ["22iWHQN5RTU", "건강e음 상세 진료기록을 이용한 고지사항 자동 추출", "1:34", ["건강e음 진료기록을 첨부합니다.", "기간별 고지 검토 항목을 확인합니다.", "청약 전 원본 기록과 보험사의 질문을 대조합니다."]],
  ["wKmUOAe5aEk", "보장분석 보고서 생성", "1:48", ["기존 보장분석 PDF를 올립니다.", "보장 공백과 중복 항목을 확인합니다.", "검토 결과를 리모델링 상담에 활용합니다."]],
  ["Rj5UliTZ88A", "건강e음 진료기록으로 미청구 보험금찾기", "2:02", ["진료기록과 가입 보험 자료를 준비합니다.", "미청구 가능성이 있는 진료 항목을 확인합니다.", "보험사 기준과 필요한 청구 서류를 확인합니다."]],
];
const videoUrl = (id) => `https://youtu.be/${id}`;
const external = { target: "_blank", rel: "noopener noreferrer" };
const channelUrl = "https://www.youtube.com/@bojogae-ai";
const contactUrl = "https://pf.kakao.com/_xjaxjmX/chat";
export function ContactLink() {
  return <a href={contactUrl} {...external}>카카오톡 1:1 문의</a>;
}
const featured = videos[5];
export function ProposalVideoLink({ className, children }) {
  return <a className={className} href={videoUrl(featured[0])} {...external}>{children}</a>;
}
const tabs = ["제안서 영상 실행", "1장 요약 결과물", "3사 비교표", "리모델링 진단"];

function VideoPreview({ video, priority = false }) {
  const [id, title, duration] = video;
  const [failed, setFailed] = useState(false);
  return <a className="home-video-thumb" href={videoUrl(id)} {...external} aria-label={`${title} 영상 보기 (새 창)`}>
    {!failed && <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" loading={priority ? "eager" : "lazy"}
      width="480" height="360" onError={() => setFailed(true)} />}
    <PlayCircleOutlineRoundedIcon aria-hidden="true" />
    <span>{duration}</span>
  </a>;
}

const examples = [
  null,
  { title: "가입제안서 1장 요약", columns: ["보장 항목", "가입 금액", "확인할 내용"],
    rows: [["암 진단비", "2,000만 원", "유사암 보장 한도"], ["뇌혈관 질환", "1,000만 원", "보장 범위"], ["질병 수술비", "50만 원", "수술 종류별 지급 기준"]] },
  { title: "보험사 3사 비교", columns: ["비교 항목", "보험사 A", "보험사 B", "보험사 C"],
    rows: [["월 보험료", "81,000원", "92,000원", "87,000원"], ["암 진단비", "2,000만 원", "3,000만 원", "2,000만 원"], ["납입 기간", "20년", "20년", "25년"]] },
  { title: "리모델링 전후 진단", columns: ["비교 항목", "현재 계약", "조정 후"],
    rows: [["월 보험료", "168,000원", "149,000원"], ["뇌혈관 질환", "500만 원", "1,000만 원"], ["질병 수술비", "30만 원", "50만 원"]] },
];

function ReportSample({ sample }) {
  return <div className="home-report-sample">
    <p>예시 데이터 · 실제 가입 조건과 다를 수 있습니다.</p>
    <table aria-label={sample.title}>
      <thead><tr>{sample.columns.map(label => <th scope="col" key={label}>{label}</th>)}</tr></thead>
      <tbody>{sample.rows.map(([label, ...cells]) => <tr key={label}><th scope="row">{label}</th>
        {cells.map((cell, index) => <td key={sample.columns[index + 1]}>{cell}</td>)}</tr>)}</tbody>
    </table>
  </div>;
}

export function HeroShowcase() {
  const [tab, setTab] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const sample = examples[tab];
  return <section className="home-showcase" aria-label="보조개 제안서 생성 미리보기">
    <header><span className="home-window-lights" aria-hidden="true"><i /><i /><i /></span>
      <span>bojogae.net · AI 제안서 요약 생성기</span><small>시연 화면 · AI 요약 엔진 정상 가동 중</small></header>
    <Tabs value={tab} onChange={(_, value) => setTab(value)} variant="scrollable" scrollButtons="auto"
      aria-label="제안서 미리보기 종류" className="home-showcase-tabs">
      {tabs.map((label, index) => <Tab key={label} label={label} id={`home-demo-tab-${index}`}
        aria-controls={`home-demo-panel-${index}`} />)}
    </Tabs>
    <div role="tabpanel" id={`home-demo-panel-${tab}`} aria-labelledby={`home-demo-tab-${tab}`} className="home-showcase-panel">
      {sample ? <>
        <h2>{sample.title}</h2>
        <ReportSample sample={sample} />
        <button type="button" className="home-button home-button--light" onClick={() => setExpanded(true)}>크게 보기</button>
      </> : <>
        <div className="home-hero-video-preview">
          <VideoPreview video={featured} priority />
          <div className="home-hero-video-caption">
            <strong>{featured[1]} ({featured[2]})</strong>
            <div>
              <ProposalVideoLink className="home-button home-button--light">유튜브 바로 재생 <ArrowOutwardRoundedIcon /></ProposalVideoLink>
              <button type="button" className="home-button home-video-guide-button" onClick={() => setGuideOpen(true)}>3단계 요약</button>
            </div>
          </div>
        </div>
        <ol className="home-preview-steps">
          <li><strong>제안서 업로드</strong><span>보험사 가입제안서 PDF</span></li>
          <li><strong>AI 자동 분석</strong><span>핵심 보장과 보험료 정리</span></li>
          <li><strong>맞춤 페이지 완성</strong><span>고객 상담 자료로 활용</span></li>
        </ol>
      </>}
    </div>
    {sample && <Dialog open={expanded} onClose={() => setExpanded(false)} fullWidth maxWidth="sm" aria-labelledby="home-sample-title">
      <DialogTitle id="home-sample-title">{sample.title}</DialogTitle>
      <DialogContent><ReportSample sample={sample} /></DialogContent>
      <DialogActions><Button onClick={() => setExpanded(false)}>닫기</Button></DialogActions>
    </Dialog>}
    <VideoGuideDialog video={guideOpen ? featured : null} onClose={() => setGuideOpen(false)} titleId="home-featured-guide-title" />
  </section>;
}

function VideoGuideDialog({ video, onClose, titleId }) {
  return <Dialog open={Boolean(video)} onClose={onClose} fullWidth maxWidth="sm" aria-labelledby={titleId}>
    {video && <>
      <DialogTitle id={titleId}>{video[1]}</DialogTitle>
      <DialogContent><ol>{video[3].map(step => <li key={step}>{step}</li>)}</ol></DialogContent>
      <DialogActions><Button onClick={onClose}>닫기</Button><Button variant="contained" href={videoUrl(video[0])} {...external}>영상 보기</Button></DialogActions>
    </>}
  </Dialog>;
}

export function VideoGallery() {
  const [guide, setGuide] = useState(null);
  return <section id="demo-preview" className="home-block" aria-labelledby="home-video-title">
    <div className="home-section-heading home-section-heading--split">
      <div><h2 id="home-video-title">보조개 사용법을 영상으로 확인하세요</h2><p>제안서 요약부터 모바일 팩스 발송까지, 실제 화면으로 따라 할 수 있습니다.</p></div>
      <a href={channelUrl} {...external} className="home-button home-button--light">보조개AI 유튜브 <ArrowOutwardRoundedIcon /></a>
    </div>
    <div className="home-gallery">
      {videos.map(video => <article key={video[0]}>
        <VideoPreview video={video} />
        <div><h3>{video[1]}</h3><button type="button" onClick={() => setGuide(video)}>3단계 요약</button></div>
      </article>)}
    </div>
    <VideoGuideDialog video={guide} onClose={() => setGuide(null)} titleId="home-video-guide-title" />
  </section>;
}

const features = [
  ["5년치 미청구 보험금 확인", "진료기록과 보장분석표를 대조해 놓친 청구 항목을 찾습니다.", 9],
  ["알릴의무 고지사항 정리", "상세 진료기록에서 기간별 고지 검토 대상을 정리합니다.", 7],
  ["정밀 보장분석", "기존 보험의 보장 공백, 중복 가입, 갱신형 특약을 확인합니다.", 8],
  ["보험사 상품 비교", "2~5개 제안서의 보험료와 핵심 담보를 나란히 비교합니다.", 6],
  ["복잡한 제안서 1장 요약", "여러 장의 보험 제안서를 고객이 읽기 쉬운 한 장으로 정리합니다.", 2],
  ["리모델링 종합 리포트", "기존 계약과 새 설계의 보험료와 보장 차이를 비교합니다.", 4],
  ["모바일 웹팩스 무료 청구", "완성한 청구서를 스마트폰 모바일팩스 앱으로 무료 발송할 수 있습니다. PC 웹팩스 직접 발송은 유료입니다.", 1],
  ["카톡 사후관리 자동화", "보조개톡으로 안부 메시지, 상용구, 보고서 이미지를 관리하고 발송합니다.", null],
];

export function FeatureShowcase() {
  return <section className="home-block home-features" id="features" aria-labelledby="home-feature-title">
    <div className="home-section-heading"><h2 id="home-feature-title">설계사를 위한 8대 실무 기능</h2><p>고객 상담 준비부터 보험금 청구와 사후관리까지 한곳에서 이어가세요.</p></div>
    <div className="home-feature-grid">
      {features.map(([title, description, video], index) => <article key={title}>
        <span className="home-feature-number">{String(index + 1).padStart(2, "0")}</span>
        <h3>{title}</h3><p>{description}</p>
        <div><span>{index < 6 ? "문서 생성 이용량 적용" : index === 6 ? "모바일 발송 무료" : "전 회원 무료"}</span>
          {video !== null && <a href={videoUrl(videos[video][0])} {...external} aria-label={`${title} 시연 영상 (새 창)`}>시연 영상 <ArrowOutwardRoundedIcon /></a>}</div>
      </article>)}
    </div>
  </section>;
}

const suites = [
  ["보조개톡", "카카오톡 고객 사후관리", "고객 그룹과 상용구를 활용해 안부 메시지와 보고서를 Windows용 보조개톡에서 보내세요."],
  ["보험금 청구", "여러 보험사 청구서를 한 번에", "보험사별 청구 양식을 작성하고 전자서명과 증빙을 첨부하세요. 스마트폰 모바일팩스는 무료입니다."],
  ["고객관리", "놓치기 쉬운 연락 시점을 한눈에", "내고객과 내계약에서 생일·상령일·면책 및 감액 기간 종료 참고일을 확인하세요."],
  ["보험사 정보·링크", "설계사 전산과 청구 연락처 찾기", "보험사별 전산 포털, 고객센터, 청구 팩스번호, 카드납 정보와 출처를 확인할 수 있습니다."],
];
const pipeline = [
  ["가망고객 발굴", "고객·그룹 정리"], ["상담 약속", "할 일·방문 일정"], ["상담정보 수집", "미청구 보험금·고지사항"],
  ["맞춤 제안", "보장분석·상품 비교"], ["계약 상담", "리모델링 보고서"],
  ["증권 확인", "내계약·알림일"], ["사후관리", "보조개톡·보험금 청구"],
];

export function PowerSuites() {
  return <section className="home-block" id="power-suites" aria-labelledby="home-suite-title">
    <div className="home-section-heading"><h2 id="home-suite-title">보고서 작성부터 고객 사후관리까지</h2></div>
    <div className="home-suite-grid">
      {suites.map(([label, title, description]) => <article key={label}><span>{label}</span><h3>{title}</h3><p>{description}</p></article>)}
    </div>
    <div className="home-pipeline"><h3>보험영업 7단계에서 쓰는 보조개 기능</h3>
      <ol>{pipeline.map(([title, description]) => <li key={title}><strong>{title}</strong><span>{description}</span></li>)}</ol>
    </div>
  </section>;
}

export function CostComparison() {
  const scenarios = [
    ["BASIC", "96,000원", "80%", "77,000원"],
    ["STANDARD", "120,000원", "76%", "91,000원"],
    ["PRO", "161,000원", "70%", "112,000원"],
  ];
  return <div className="home-cost-comparison">
    <h3>개별 구독 비용과 보조개 월 요금 비교</h3>
    <p>범용 AI, 보장분석, 고객관리 서비스를 각각 구독하는 상황을 가정한 예시입니다.</p>
    <div className="home-cost-grid">
      <div><h4>서비스 3종을 따로 구독할 때</h4>
        <dl><dt>범용 AI</dt><dd>월 29,000원</dd><dt>보장분석·청구</dt><dd>월 38,000~103,000원</dd><dt>고객관리·카톡 발송</dt><dd>월 29,000원</dd></dl>
        <strong>가정 합계 월 96,000~161,000원</strong>
      </div>
      <div><h4>보조개 월 요금</h4><strong className="home-cost-annual">비교 예시 기준 연 최대 약 134만 원 절약</strong><ul>
        {scenarios.map(([code, separate, saving, monthlySaving]) => <li key={code}><strong>{PLAN_INFO[code].name}</strong><span><s>{separate}</s> → <b>{PLAN_INFO[code].price}</b></span><small>약 {saving} 절감 · 월 {monthlySaving} 절약</small></li>)}
      </ul></div>
    </div>
  </div>;
}
