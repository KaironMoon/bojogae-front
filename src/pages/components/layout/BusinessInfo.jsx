import { Box } from "@mui/material";

function BusinessInfo() {
  return (
    <Box
      component="section"
      aria-label="사업자 정보"
      sx={{ gridColumn: "1 / -1", mt: 1.5, fontSize: "0.8125rem", lineHeight: 1.8, overflowWrap: "anywhere" }}
    >
      <Box sx={{ display: "flex", flexWrap: "wrap", columnGap: 2 }}>
        <span>상호: 마음 AI</span>
        <span>대표자: 김성춘</span>
        <span>사업자등록번호: 621-58-01016</span>
      </Box>
      <Box>주소: 서울특별시 도봉구 노해로67길 2, B2호(창동, 한국빌딩)</Box>
    </Box>
  );
}

export default BusinessInfo;
