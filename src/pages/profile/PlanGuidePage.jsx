import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Dialog } from "@mui/material";
import { useAuth } from "@/auth/AuthContext";
import {
  PLAN_INFO,
  PLAN_DOCUMENT_ESTIMATES,
  PLAN_USAGE_NOTE,
} from "@/constants/plans";
import {
  createGroupInquiry,
  groupInquiryError,
} from "@/services/group-inquiry-service";
import PricingReference from "./pricing-design/PricingReference";
import SubscribeReference from "./pricing-design/SubscribeReference";
import GroupReference from "./pricing-design/GroupReference";
import "./pricing-design/source.css";
import "./pricing-design/utilities.css";
import "./pricing-design/integration.css";
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
export default function PlanGuidePage() {
  const { user } = useAuth(),
    navigate = useNavigate();
  const [modal, setModal] = useState(null),
    [code, setCode] = useState("STANDARD"),
    [values, setValues] = useState(empty),
    [busy, setBusy] = useState(false),
    [feedback, setFeedback] = useState(null);
  const personal = user?.role === "USER" && !user.group_id,
    current = personal && user.plan_code === code,
    canApply = personal && (current || code !== "FREE");
  const close = () => {
    if (!busy) setModal(null);
  };
  const vm = {
    personal,
    plans: PLAN_INFO,
    estimates: PLAN_DOCUMENT_ESTIMATES,
    usageNote: PLAN_USAGE_NOTE,
    code,
    plan: PLAN_INFO[code],
    canApply,
    close,
    busy,
    values,
    feedback,
    actionLabel: (c) =>
      personal && user.plan_code === c
        ? "현재 요금제 관리"
        : c === "FREE"
          ? "무료로 시작하기"
          : `${PLAN_INFO[c].name} 가입 신청`,
    openPlan: (c) => {
      setCode(c);
      setModal("plan");
    },
    openInquiry: () => {
      setValues(empty);
      setFeedback(null);
      setModal("group");
    },
    update: (key, value) => setValues((v) => ({ ...v, [key]: value })),
    proceedLabel: current ? "내 구독 관리로 이동" : "신청 진행하기",
    notice: !canApply ? (
      <Alert severity="info">
        {user?.group_id
          ? "단체회원의 이용 조건은 소속 단체에서 확인해 주세요."
          : !personal
            ? "개인 요금제는 일반 회원 계정에서 신청할 수 있습니다."
            : "무료체험은 최초 가입 시 제공됩니다. 현재 구독은 내 정보에서 확인해 주세요."}
      </Alert>
    ) : (
      <p className="text-xs text-[#4e5968]">
        {current
          ? "현재 이용 중인 요금제입니다."
          : "다음 화면에서 구독 조건과 결제 정보를 확인합니다. 이 단계에서는 결제되지 않습니다."}
      </p>
    ),
    proceed: () => {
      if (canApply)
        navigate(
          current ? "/profile#plan" : `/profile?choosePlan=${code}#plan`,
        );
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
  };
  return (
    <>
      <div className="pricing-design">
        <PricingReference vm={vm} />
      </div>
      <Dialog
        open={!!modal}
        onClose={close}
        maxWidth={false}
        aria-label={
          modal === "plan"
            ? "요금제 신청"
            : modal === "group"
              ? "단체 도입 문의"
              : "문의 접수 완료"
        }
        slotProps={{
          paper: {
            className: `pricing-design pricing-dialog ${modal === "group" ? "group-dialog" : ""}`,
          },
        }}
      >
        {modal === "plan" ? (
          <SubscribeReference vm={vm} />
        ) : modal === "group" ? (
          <GroupReference vm={vm} />
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
