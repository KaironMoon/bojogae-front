/* eslint-disable react/prop-types */
import { useState } from "react";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import TableViewOutlinedIcon from "@mui/icons-material/TableViewOutlined";
import {
  Box,
  Button,
  Chip,
  Collapse,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

const VOUCHER_COLUMNS = [
  "날짜",
  "구분(입금/출금)",
  "거래처",
  "적요",
  "공급가액",
  "부가세",
  "합계금액",
  "계정과목코드",
  "계정과목명",
  "상대계정코드",
  "상대계정명",
  "증빙구분",
  "부가세구분",
];

const STANDARD_CODES = [
  { group: "수입", code: "401", name: "사업수입(모집수당 등)", example: "보험설계사 모집·유지·시책 수당 (3.3% 원천징수)", companyOnly: false },
  { group: "수입", code: "404", name: "용역매출(SaaS·수수료)", example: "SaaS 구독(꼬막)·B2B 이용료·PG 매출", companyOnly: true },
  { group: "자산", code: "103", name: "보통예금(현금성)", example: "수당 입금·계좌이체·현금영수증 결제 상대계정", companyOnly: false },
  { group: "부채", code: "253", name: "미지급금(신용카드)", example: "신용카드 결제 경비 상대계정", companyOnly: false },
  { group: "자산", code: "136", name: "선납세금(3.3% 원천세)", example: "기납부 3.3% 원천징수 소득세·지방소득세", companyOnly: false },
  { group: "비용", code: "811", name: "복리후생비", example: "직원·보조원 식대, 회식, 경조사비", companyOnly: false },
  { group: "비용", code: "812", name: "여비교통비", example: "KTX·SRT·택시·버스 등 고객 미팅 이동 교통비", companyOnly: false },
  { group: "비용", code: "813", name: "접대비", example: "고객·거래처 식사, 카페 상담, 선물, 경조사 화환", companyOnly: false },
  { group: "비용", code: "814", name: "통신비", example: "업무용 휴대폰 요금, 인터넷, 팩스 통신비", companyOnly: false },
  { group: "비용", code: "819", name: "임차료", example: "사무실 월세·관리비·공유오피스 임차료", companyOnly: false },
  { group: "비용", code: "822", name: "차량유지비", example: "주유비, 하이패스, 차량 정비·주차·세차비", companyOnly: false },
  { group: "비용", code: "825", name: "교육훈련비", example: "보험연수원 보수교육, 세미나, 직무 강의", companyOnly: false },
  { group: "비용", code: "826", name: "도서인쇄비", example: "제안서 인쇄·제본, 업무 도서 구입", companyOnly: false },
  { group: "비용", code: "830", name: "소모품비", example: "사무용지, 토너, 문구류, 소액 비품", companyOnly: false },
  { group: "비용", code: "831", name: "지급수수료", example: "보조개·AI API 이용료, 서버비, PG·세무 수수료", companyOnly: false },
  { group: "비용", code: "833", name: "광고선전비", example: "네이버·메타·구글·당근 온라인 홍보비", companyOnly: false },
  { group: "비용", code: "839", name: "기타필요경비", example: "기타 업무 관련 잡비", companyOnly: false },
];

export default function TaxAccountingFormatGuide({ isCompany = false, compact = false }) {
  const [expanded, setExpanded] = useState(false);

  const visibleCodes = isCompany
    ? STANDARD_CODES
    : STANDARD_CODES.filter((row) => !row.companyOnly);

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 3, bgcolor: "#F8FAFC" }}>
      <Stack spacing={1.5}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <TableViewOutlinedIcon color="success" />
            <Typography variant="subtitle1" fontWeight={800}>
              더존(Smart A / WEHAGO T) · 세무사랑Pro 공통 전표 업로드 포맷 & 표준 계정코드표
            </Typography>
          </Stack>
          <Button
            size="small"
            variant="outlined"
            endIcon={expanded ? <ExpandLessRoundedIcon /> : <ExpandMoreRoundedIcon />}
            onClick={() => setExpanded((prev) => !prev)}
            sx={{ bgcolor: "#fff", flexShrink: 0 }}
          >
            {expanded ? "표준 계정과목 코드표 접기" : "표준 계정과목 코드표 보기"}
          </Button>
        </Stack>

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Chip
            size="small"
            color="success"
            variant="outlined"
            label="① 더존 · 세무사랑 공통 전표 업로드 표준 (.xlsx) — 세무사무소 100% 호환"
            sx={{ bgcolor: "#fff", fontWeight: 700 }}
          />
          {!isCompany && (
            <Chip
              size="small"
              color="primary"
              variant="outlined"
              label="② 홈택스 제출용 간편장부 표준 (.xlsx) — 설계사 직접 신고용"
              sx={{ bgcolor: "#fff", fontWeight: 700 }}
            />
          )}
        </Stack>

        {!compact && (
          <Typography variant="caption" color="text.secondary">
            전표 업로드 시트(`더존_세무사랑_전표업로드`)는 프로그램 일괄등록이 바로 인식하도록 1행 순수 컬럼 헤더로만 구성됩니다.
          </Typography>
        )}

        <Box>
          <Typography variant="caption" fontWeight={700} color="#334155" sx={{ display: "block", mb: 0.75 }}>
            전표 엑셀 표준 13개 컬럼 구조 (1행 헤더 그대로 매핑)
          </Typography>
          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
            {VOUCHER_COLUMNS.map((col, idx) => (
              <Chip
                key={col}
                size="small"
                label={`${idx + 1}. ${col}`}
                sx={{ bgcolor: "#fff", border: "1px solid #CBD5E1", fontSize: 11.5, fontWeight: 600 }}
              />
            ))}
          </Stack>
        </Box>

        <Collapse in={expanded}>
          <Paper variant="outlined" sx={{ mt: 1, borderRadius: 2, overflow: "hidden", bgcolor: "#fff" }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "#F1F5F9" }}>
                  <TableCell sx={{ fontWeight: 800 }}>구분</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>표준코드</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>표준 계정과목명</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>실무 적용 예시 (더존 Smart A · 세무사랑Pro 공통)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {visibleCodes.map((row) => (
                  <TableRow key={row.code}>
                    <TableCell>{row.group}</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: "#006E43" }}>{row.code}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{row.name}</TableCell>
                    <TableCell>{row.example}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </Collapse>
      </Stack>
    </Paper>
  );
}
