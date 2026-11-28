import { useState } from "react";
import { Box, Paper, Tab, Tabs } from "@mui/material";
import CreditScoreOutlinedIcon from "@mui/icons-material/CreditScoreOutlined";
import AdminPaymentHistory from "./AdminPaymentHistory";
import FaxRefundReviewQueue from "./FaxRefundReviewQueue";
import PaymentReviewQueue from "./PaymentReviewQueue";
import PaymentSupportPanel from "./PaymentSupportPanel";
import { AdminPageContainer, AdminPageHeader } from "./components/AdminPageShell";

const PAYMENT_TABS = [
  { key: "orders", label: "전체 결제내역" },
  { key: "fax", label: "팩스 꼬막 반환 검토" },
  { key: "terminations", label: "구독 종료·탈퇴 검토" },
  { key: "lookup", label: "고객 결제 직접 조회" },
];

export default function PaymentSupportPage() {
  const [activeTab, setActiveTab] = useState("orders");

  return (
    <AdminPageContainer maxWidth={1360}>
      <AdminPageHeader
        icon={CreditScoreOutlinedIcon}
        title="결제·환불 처리"
        description="전체 결제내역과 결제 취소, 팩스 꼬막 반환, 구독 종료 검토 건을 항목별로 처리합니다."
      />

      <Paper variant="outlined" sx={{ borderRadius: 3, mb: 2.5, px: 1.5, bgcolor: "#FFFFFF" }}>
        <Tabs
          value={activeTab}
          onChange={(_e, next) => setActiveTab(next)}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="결제·환불 처리 탭"
          sx={{
            "& .MuiTab-root": { minHeight: 48, fontWeight: 750, fontSize: 13.5 },
          }}
        >
          {PAYMENT_TABS.map((tab) => (
            <Tab key={tab.key} value={tab.key} label={tab.label} />
          ))}
        </Tabs>
      </Paper>

      <Box>
        {activeTab === "orders" && <AdminPaymentHistory />}
        {activeTab === "fax" && <FaxRefundReviewQueue />}
        {activeTab === "terminations" && <PaymentReviewQueue />}
        {activeTab === "lookup" && <PaymentSupportPanel />}
      </Box>
    </AdminPageContainer>
  );
}
