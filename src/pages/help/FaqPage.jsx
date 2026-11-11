import { useEffect, useState } from "react";
import { Alert, Button, Dialog, Snackbar } from "@mui/material";
import { faqError, listFaqs } from "@/services/faq-service";
import FaqReference from "./design/FaqReference";
import VideoCard from "./design/VideoCard";
import VideoModal from "./design/VideoModal";
import Icon from "./design/FaqIcon";
import ContactModal from "./design/ContactModal";
import videos from "./design/videos.json";
import "./design/source.css";
import "./design/utilities.css";
import "./design/integration.css";
const categories = {
  ALL: "전체",
  REPORT: "보고서 생성·공유",
  CLAIM: "보험금 청구·모바일팩스",
  KKOMAK: "꼬막·요금·환불",
  CRM: "고객·계약·보조개톡·문의",
};
// Display filters only; FAQ content and visibility remain server-managed.
const categoryOf = ({ question }) =>
  /꼬막|요금|환불|결제|구독/.test(question)
    ? "KKOMAK"
    : /청구|팩스/.test(question)
      ? "CLAIM"
      : /고객|계약|카톡|보조개톡|문의/.test(question)
        ? "CRM"
        : "REPORT";
export default function FaqPage() {
  const templates = {
    REPORT:
      "[보고서 생성 문의]\n- 이용한 메뉴: \n- 문서 제목 / 생성 시각: \n- 발생한 상황 및 오류 메시지: ",
    BILLING: "[결제 문의]\n- 결제 일시 / 요금제: \n- 문의 내용: ",
    FAX: "[보험금 청구·팩스 문의]\n- 청구내역 번호: \n- 발생한 상황: ",
    GROUP: "[단체 도입 문의]\n- 소속 / 도입 인원: \n- 문의 내용: ",
  };
  const [contact, setContact] = useState(false),
    [inquiryType, setInquiryType] = useState("REPORT"),
    [inquiryText, setInquiryText] = useState(templates.REPORT);
  const [query, setQuery] = useState(""),
    [category, setCategory] = useState("ALL"),
    [expanded, setExpanded] = useState([]),
    [data, setData] = useState({ items: [] }),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [reload, setReload] = useState(0),
    [sort, setSort] = useState("latest"),
    [video, setVideo] = useState(null),
    [toast, setToast] = useState("");
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    const timer = setTimeout(() => {
      listFaqs(query)
        .then((result) => {
          if (active) setData(result);
        })
        .catch((e) => {
          if (active) setError(faqError(e));
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 200);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, reload]);
  const items = data.items.filter(
      (x) => category === "ALL" || categoryOf(x) === category,
    ),
    counts = Object.fromEntries(
      Object.keys(categories).map((c) => [
        c,
        `(${data.items.filter((x) => c === "ALL" || categoryOf(x) === c).length})`,
      ]),
    );
  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setToast("복사했습니다.");
    } catch {
      setToast("복사하지 못했습니다. 내용을 직접 선택해 복사해 주세요.");
    }
  };
  const vm = {
    openContact: () => setContact(true),
    closeContact: () => setContact(false),
    inquiryType,
    inquiryText,
    setInquiryText,
    changeInquiry: (type) => {
      setInquiryType(type);
      setInquiryText(templates[type]);
    },
    query,
    category,
    setCategory,
    counts,
    sort,
    setSort,
    video,
    copy,
    close: () => setVideo(null),
    openVideo: (id) => setVideo(videos.find((v) => v.id === id)),
    search: (q) => {
      setQuery(q);
      setExpanded([]);
    },
    expandAll: (on) => setExpanded(on ? items.map((x) => x.id) : []),
    status: loading
      ? "불러오는 중…"
      : error
        ? "조회 실패"
        : `전체 ${items.length}개`,
    feedback: error ? (
      <Alert
        severity="error"
        action={
          <Button onClick={() => setReload((v) => v + 1)}>다시 시도</Button>
        }
      >
        {error}
      </Alert>
    ) : null,
    moveVideo: (dir) =>
      setVideo(
        videos[
          (videos.findIndex((v) => v.id === video.id) + dir + videos.length) %
            videos.length
        ],
      ),
    related: () => {
      const c = video.id <= 2 ? "CLAIM" : "REPORT";
      setVideo(null);
      setCategory(c);
      setQuery("");
      setExpanded(
        data.items.filter((x) => categoryOf(x) === c).map((x) => x.id),
      );
      setTimeout(
        () =>
          document
            .getElementById("faqCategoryTabs")
            ?.scrollIntoView({ behavior: "smooth" }),
        100,
      );
    },
  };
  vm.videos = [...videos]
    .sort((a, b) => (sort === "popular" ? b.views - a.views : a.id - b.id))
    .map((v) => <VideoCard key={v.id} v={v} vm={vm} />);
  vm.answers = loading ? (
    <p role="status" className="ns-card p-6">
      FAQ 불러오는 중…
    </p>
  ) : error ? null : items.length ? (
    items.map((item) => {
      const open = expanded.includes(item.id);
      return (
        <div
          key={item.id}
          className="faq-accordion ns-card bg-white overflow-hidden"
        >
          <h3 className="MuiAccordion-heading">
            <button
              type="button"
              id={`faq-${item.id}-heading`}
              aria-controls={`faq-${item.id}-answer`}
              aria-expanded={open}
              onClick={() =>
                setExpanded((v) =>
                  open ? v.filter((id) => id !== item.id) : [...v, item.id],
                )
              }
              className={`w-full px-5 py-4 text-left flex items-center justify-between gap-4 ${open ? "bg-primary-soft" : "hover:bg-[#f8fafc]"}`}
            >
              <span className="flex items-center gap-2.5 flex-wrap min-w-0">
                <span className="w-6 h-6 rounded-lg bg-primary-soft text-primary font-black text-xs flex items-center justify-center">
                  Q
                </span>
                <span className="px-2 py-0.5 rounded-md bg-sub-soft text-sub text-[10.5px] font-black">
                  {categories[categoryOf(item)]}
                </span>
                <span className="text-xs sm:text-sm font-black text-[#121314]">
                  {item.question}
                </span>
              </span>
              <Icon
                name="chevron-down"
                className={`w-5 h-5 shrink-0 ${open ? "rotate-180 text-primary" : "text-[#8b95a1]"}`}
              />
            </button>
          </h3>
          <div
            id={`faq-${item.id}-answer`}
            role="region"
            aria-labelledby={`faq-${item.id}-heading`}
            hidden={!open}
            className="px-5 pb-5 pt-2 border-t border-[#f1f5f9] space-y-3.5"
          >
            <p className="faq-answer text-xs sm:text-sm text-[#4e5968] leading-relaxed">
              {item.answer}
            </p>
            <div className="pt-3 border-t border-[#f4f6f8] flex justify-end">
              <button
                onClick={() => copy(item.answer)}
                className="px-2.5 py-1.5 rounded-lg bg-[#f4f6f8] text-[#4e5968] text-xs font-bold flex items-center gap-1"
              >
                <Icon name="copy" />
                답변 복사
              </button>
            </div>
          </div>
        </div>
      );
    })
  ) : (
    <div className="ns-card p-12 text-center space-y-3">
      <h2 className="font-black">
        {query ? "검색 결과가 없습니다." : "등록된 FAQ가 없습니다."}
      </h2>
      <p>다른 검색어로 찾아보거나 1:1 문의를 이용해 주세요.</p>
      <button
        onClick={() => {
          vm.search("");
          setCategory("ALL");
        }}
        className="px-4 py-2 rounded-xl bg-primary text-white"
      >
        전체 FAQ 다시 보기
      </button>
    </div>
  );
  return (
    <>
      <div className="faq-design">
        <FaqReference vm={vm} />
      </div>
      <Dialog
        open={!!video}
        onClose={vm.close}
        maxWidth={false}
        aria-label="영상 3단계 요약"
        slotProps={{ paper: { className: "faq-design pricing-dialog" } }}
      >
        {video && <VideoModal vm={vm} />}
      </Dialog>
      <Dialog
        open={contact}
        onClose={vm.closeContact}
        maxWidth={false}
        aria-label="카카오톡 문의 양식"
        slotProps={{
          paper: { className: "faq-design pricing-dialog contact-dialog" },
        }}
      >
        <ContactModal vm={vm} />
      </Dialog>
      <Snackbar
        open={!!toast}
        message={toast}
        autoHideDuration={3000}
        onClose={() => setToast("")}
      />
    </>
  );
}
