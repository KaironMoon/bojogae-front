import { useEffect, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { Dialog, Alert } from "@mui/material";
import {
  shouldSkipLanding,
  skipLandingFromNowOn,
} from "@/auth/landing-preference-storage";
import {
  createGroupInquiry,
  groupInquiryError,
} from "@/services/group-inquiry-service";
import HomeReference from "./design/HomeReference";
import WeaponCard from "./design/WeaponCard";
import VideoCard from "./design/VideoCard";
import VideoReference from "./design/VideoReference";
import SampleReference from "./design/SampleReference";
import InquiryReference from "./design/InquiryReference";
import SummarySample from "./design/SummarySample";
import CompareSample from "./design/CompareSample";
import RemodelSample from "./design/RemodelSample";
import weapons from "./design/weapons.json";
import videos from "./design/videos.json";
import "./design/source.css";
import "./design/utilities.css";
import "./design/integration.css";
const empty = {
  organizationName: "",
  headcount: "",
  contactName: "",
  phone: "",
  email: "",
  message: "",
  privacyAgreed: false,
  website: "",
};
export default function LandingPage() {
  const navigate = useNavigate(),
    [params] = useSearchParams();
  const [tab, setTab] = useState("video"),
    [modal, setModal] = useState(null),
    [video, setVideo] = useState(videos[5]),
    [sample, setSample] = useState("summary"),
    [values, setValues] = useState(empty),
    [busy, setBusy] = useState(false),
    [feedback, setFeedback] = useState(null),
    [skip, setSkip] = useState(false),
    [preferenceBusy, setPreferenceBusy] = useState(true);
  useEffect(() => {
    let live = true;
    Promise.resolve(shouldSkipLanding())
      .then((v) => {
        if (live) setSkip(v);
      })
      .catch(() => {})
      .finally(() => {
        if (live) setPreferenceBusy(false);
      });
    return () => {
      live = false;
    };
  }, []);
  const close = () => {
    if (!busy) setModal(null);
  };
  const login = (mode, plan) =>
    navigate(
      mode === "trial"
        ? "/login?method=personal&plan=FREE"
        : `/login?method=${mode}${plan ? `&plan=${plan}` : ""}`,
    );
  const vm = {
    tab,
    setTab,
    video,
    values,
    busy,
    preferenceBusy,
    feedback,
    close,
    login,
    openVideo: (id) => {
      setVideo(videos.find((v) => v.id === id) || videos[5]);
      setModal("video");
    },
    openSample: (key) => {
      setSample(key);
      setModal("sample");
    },
    openInquiry: () => {
      setValues(empty);
      setFeedback(null);
      setModal("inquiry");
    },
    update: (key, value) => setValues((v) => ({ ...v, [key]: value })),
    skipLanding: async () => {
      setPreferenceBusy(true);
      try {
        await skipLandingFromNowOn();
        navigate("/login", { replace: true });
      } catch {
        setFeedback(
          <Alert severity="error">
            로그인 화면 설정을 저장하지 못했습니다.
          </Alert>,
        );
      } finally {
        setPreferenceBusy(false);
      }
    },
    submit: async (e) => {
      e.preventDefault();
      setBusy(true);
      setFeedback(null);
      try {
        await createGroupInquiry(values);
        setModal("complete");
      } catch (error) {
        setFeedback(<Alert severity="error">{groupInquiryError(error)}</Alert>);
      } finally {
        setBusy(false);
      }
    },
    sampleBody:
      sample === "summary" ? (
        <SummarySample />
      ) : sample === "compare" ? (
        <CompareSample />
      ) : (
        <RemodelSample />
      ),
    sampleTitle:
      sample === "summary"
        ? "가입제안서 1장 요약 샘플"
        : sample === "compare"
          ? "3사 보험 상세 비교 샘플"
          : "보험 리모델링 전/후 진단 샘플",
  };
  vm.weapons = weapons.map((w) => <WeaponCard key={w.num} w={w} vm={vm} />);
  vm.videos = videos.map((v) => <VideoCard key={v.id} v={v} vm={vm} />);
  if (params.get("error") || params.get("passwordChanged"))
    return <Navigate to={`/login?${params.toString()}`} replace />;
  if (skip) return <Navigate to="/login" replace />;
  return (
    <>
      <div className="landing-design">
        {!modal && feedback}
        <HomeReference vm={vm} />
      </div>
      <Dialog
        open={!!modal}
        onClose={close}
        maxWidth={false}
        aria-label={
          modal === "inquiry"
            ? "단체 도입 문의"
            : modal === "video"
              ? "시연 영상"
              : modal === "sample"
                ? "리포트 샘플"
                : "문의 접수 완료"
        }
        slotProps={{
          paper: {
            className: `landing-design landing-dialog ${modal === "inquiry" ? "group-dialog" : ""}`,
          },
        }}
      >
        {modal === "video" ? (
          <VideoReference vm={vm} />
        ) : modal === "sample" ? (
          <SampleReference vm={vm} />
        ) : modal === "inquiry" ? (
          <InquiryReference vm={vm} />
        ) : modal === "complete" ? (
          <div className="p-6 space-y-4">
            <h2 className="text-xl font-black">문의가 접수되었습니다</h2>
            <p>담당자가 확인 후 연락드리겠습니다.</p>
            <button
              className="px-4 py-2 rounded-xl border border-[#d1d6db]"
              onClick={close}
            >
              닫기
            </button>
          </div>
        ) : null}
      </Dialog>
    </>
  );
}
