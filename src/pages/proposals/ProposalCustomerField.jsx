/* eslint-disable react/prop-types */
import { useEffect, useMemo, useRef, useState } from "react";
import { Autocomplete, Box, Button, CircularProgress, Paper, Stack, TextField, Typography } from "@mui/material";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import { Link } from "react-router-dom";
import { crmError, crmGet } from "@/services/crm-service";
import {
  formatCustomerOptionLabel,
  formatCustomerShortName,
  mergeCustomerOptions,
} from "./proposal-customer-utils";

export default function ProposalCustomerField({
  value,
  onChange,
  disabled = false,
  onCustomersLoaded,
}) {
  const [items, setItems] = useState([]);
  const [resolvedById, setResolvedById] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const requestedIds = useRef(new Set());
  const onCustomersLoadedRef = useRef(onCustomersLoaded);
  onCustomersLoadedRef.current = onCustomersLoaded;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFetchError("");
    const timer = window.setTimeout(async () => {
      try {
        const result = await crmGet("/customers", {
          q: searchQuery.trim() || undefined,
          page_size: 50,
        });
        if (cancelled) return;
        const list = result?.items || [];
        setItems(list);
        if (list.length) {
          setResolvedById((current) => {
            const next = { ...current };
            for (const customer of list) {
              if (customer?.id) next[customer.id] = customer;
            }
            return next;
          });
          onCustomersLoadedRef.current?.(list);
        }
      } catch (err) {
        if (!cancelled) {
          setItems([]);
          setFetchError(crmError(err));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [searchQuery]);

  useEffect(() => {
    if (!value || resolvedById[value] || requestedIds.current.has(value)) return undefined;
    requestedIds.current.add(value);
    let cancelled = false;
    crmGet(`/customers/${value}`)
      .then((customer) => {
        if (cancelled || !customer?.id) return;
        setResolvedById((current) => ({ ...current, [customer.id]: customer }));
        onCustomersLoadedRef.current?.([customer]);
      })
      .catch(() => {
        // 선택 고객 상세 조회 실패 시 기본 라벨("고객 #ID")을 유지한다.
      });
    return () => {
      cancelled = true;
    };
  }, [value, resolvedById]);

  const selectedCustomer = useMemo(() => {
    if (!value) return null;
    return resolvedById[value] || { id: value, name: `고객 #${value}` };
  }, [resolvedById, value]);

  const options = useMemo(
    () => mergeCustomerOptions(items, selectedCustomer),
    [items, selectedCustomer],
  );

  return (
    <Paper
      variant="outlined"
      sx={{
        p: { xs: 1.5, sm: 1.75 },
        borderRadius: "14px",
        bgcolor: value ? "#F0FDF4" : "#F4F7FA",
        borderColor: value ? "rgba(3, 199, 90, 0.38)" : "#DDE5ED",
        transition: "background-color 150ms ease, border-color 150ms ease",
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        gap={1}
        flexWrap="wrap"
        sx={{ mb: 1.1 }}
      >
        <Stack direction="row" alignItems="center" spacing={0.75}>
          <PersonOutlineRoundedIcon sx={{ fontSize: 18, color: value ? "#006E43" : "#4E5968" }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#121314" }}>
            연결할 고객
          </Typography>
          <Box
            component="span"
            sx={{
              px: 0.75,
              py: 0.15,
              borderRadius: "6px",
              bgcolor: "#FFFFFF",
              border: "1px solid #DCE3EA",
              color: "#64748B",
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            선택 사항
          </Box>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Box
            component="span"
            sx={{
              px: 0.75,
              py: 0.15,
              borderRadius: "6px",
              bgcolor: value ? "#DCFCE7" : "#ECFDF5",
              color: "#006E43",
              border: "1px solid rgba(3, 199, 90, 0.24)",
              fontSize: 11,
              fontWeight: 750,
            }}
          >
            고객별 구분
          </Box>
          <Box
            component="span"
            sx={{
              px: 0.75,
              py: 0.15,
              borderRadius: "6px",
              bgcolor: value ? "#DCFCE7" : "#ECFDF5",
              color: "#006E43",
              border: "1px solid rgba(3, 199, 90, 0.24)",
              fontSize: 11,
              fontWeight: 750,
            }}
          >
            문서 모아보기
          </Box>
        </Stack>
      </Stack>

      <Stack direction="row" spacing={1} alignItems="center">
        <Autocomplete
          fullWidth
          size="small"
          disabled={disabled}
          open={open}
          onOpen={() => setOpen(true)}
          onClose={() => setOpen(false)}
          options={options}
          value={selectedCustomer}
          loading={loading}
          filterOptions={(opts) => opts}
          getOptionLabel={formatCustomerOptionLabel}
          isOptionEqualToValue={(a, b) => a?.id === b?.id}
          onInputChange={(_, nextInput, reason) => {
            if (reason === "input") setSearchQuery(nextInput);
            else if (reason === "clear" || reason === "reset") setSearchQuery("");
          }}
          onChange={(_, nextCustomer) => onChange(nextCustomer ? nextCustomer.id : null)}
          noOptionsText={
            loading
              ? "고객 목록을 불러오는 중..."
              : open && fetchError
                ? fetchError
                : searchQuery.trim()
                  ? "일치하는 고객이 없습니다."
                  : "등록된 내 고객이 없습니다."
          }
          renderOption={(props, option) => {
            const { key, ...rest } = props;
            const sub = option.phone || option.location?.address || "연락처·주소 미등록";
            return (
              <Box component="li" key={key || option.id} {...rest} sx={{ display: "flex", alignItems: "center", gap: 1.25, py: 0.75 }}>
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: "8px",
                    bgcolor: "#ECFDF5",
                    color: "#006E43",
                    fontWeight: 800,
                    fontSize: 12.5,
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                  }}
                >
                  {(option.name || "고").slice(0, 1)}
                </Box>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="body2" noWrap sx={{ fontWeight: 700, color: "#121314" }}>
                    {option.name}
                    {option.alias ? (
                      <Box component="span" sx={{ ml: 0.5, color: "text.secondary", fontWeight: 500 }}>
                        ({option.alias})
                      </Box>
                    ) : null}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block", lineHeight: 1.25 }}>
                    {sub}
                  </Typography>
                </Box>
              </Box>
            );
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="고객 이름, 카톡대화명, 연락처로 검색 또는 선택"
              inputProps={{
                ...params.inputProps,
                "aria-label": "연결할 고객 (선택)",
              }}
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loading ? <CircularProgress size={16} color="inherit" /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  bgcolor: "#FFFFFF",
                  borderRadius: "10px",
                },
              }}
            />
          )}
        />
        {value && (
          <Button
            component={Link}
            to={`/crm/customers/${value}?tab=files`}
            variant="outlined"
            size="small"
            endIcon={<OpenInNewRoundedIcon sx={{ fontSize: 15 }} />}
            sx={{
              height: 40,
              px: 1.5,
              borderRadius: "10px",
              flexShrink: 0,
              whiteSpace: "nowrap",
              bgcolor: "#FFFFFF",
              borderColor: "rgba(3, 199, 90, 0.45)",
              color: "#006E43",
              fontWeight: 750,
              "&:hover": { bgcolor: "#ECFDF5", borderColor: "#006E43" },
            }}
          >
            고객 문서함
          </Button>
        )}
      </Stack>

      <Stack direction="row" spacing={0.75} alignItems="flex-start" sx={{ mt: 1 }}>
        {value ? (
          <CheckRoundedIcon sx={{ fontSize: 15, color: "#006E43", mt: "2px", flexShrink: 0 }} />
        ) : (
          <AutoAwesomeRoundedIcon sx={{ fontSize: 14, color: "#006E43", mt: "2px", flexShrink: 0 }} />
        )}
        <Typography variant="caption" sx={{ color: "#4E5968", lineHeight: 1.5 }}>
          {!value ? (
            "고객을 연결해 두면 보고서 목록에서 누구의 제안서·보고서인지 한눈에 구분할 수 있고, 고객 상세의 [문서] 탭에서 해당 고객의 문서만 따로 모아 보거나 계약에 바로 연결할 수 있어요."
          ) : (
            <>
              <Box component="strong" sx={{ color: "#006E43", fontWeight: 800 }}>
                {selectedCustomer?.name
                  ? `${formatCustomerShortName(selectedCustomer)} 고객의 문서로 연결됩니다.`
                  : "선택한 고객의 문서로 연결됩니다."}
              </Box>
              {" 생성 후 보고서 목록에 고객 이름이 함께 표시되며, 우측 [고객 문서함]을 누르면 해당 고객의 문서 탭으로 바로 이동해요."}
            </>
          )}
        </Typography>
      </Stack>
    </Paper>
  );
}
