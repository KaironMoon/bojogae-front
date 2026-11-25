/* eslint-disable react/prop-types */
import { useEffect, useMemo, useRef, useState } from "react";
import { Autocomplete, Box, Button, CircularProgress, Stack, TextField, Typography } from "@mui/material";
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
    <Box>
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
              label="연결할 고객 (선택)"
              placeholder="고객 이름, 카톡대화명, 연락처로 검색 또는 선택"
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <>
                    <PersonOutlineRoundedIcon
                      sx={{
                        fontSize: 19,
                        color: value ? "#006E43" : "text.secondary",
                        ml: 0.5,
                        mr: 0.25,
                        flexShrink: 0,
                      }}
                    />
                    {params.InputProps.startAdornment}
                  </>
                ),
                endAdornment: (
                  <>
                    {loading ? <CircularProgress size={16} color="inherit" /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  bgcolor: value ? "rgba(236, 253, 245, 0.35)" : "#FFFFFF",
                },
              }}
            />
          )}
        />
        {value && (
          <Button
            component={Link}
            to={`/crm/customers/${value}`}
            variant="outlined"
            size="small"
            endIcon={<OpenInNewRoundedIcon sx={{ fontSize: 15 }} />}
            sx={{
              height: 40,
              px: 1.5,
              borderRadius: "12px",
              flexShrink: 0,
              whiteSpace: "nowrap",
              bgcolor: "#ECFDF5",
              borderColor: "rgba(3, 199, 90, 0.4)",
              color: "#006E43",
              fontWeight: 750,
              "&:hover": { bgcolor: "#D1FAE5", borderColor: "#006E43" },
            }}
          >
            고객 문서함
          </Button>
        )}
      </Stack>

      <Box
        sx={{
          mt: 1,
          px: 1.5,
          py: 1.15,
          borderRadius: "12px",
          bgcolor: value ? "rgba(236, 253, 245, 0.65)" : "#F8FAFC",
          border: "1px solid",
          borderColor: value ? "rgba(3, 199, 90, 0.32)" : "#E6EAEE",
          display: "flex",
          alignItems: "flex-start",
          gap: 1.15,
          transition: "background-color 150ms ease, border-color 150ms ease",
        }}
      >
        <Box
          sx={{
            width: 26,
            height: 26,
            borderRadius: "8px",
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
            mt: 0.1,
            bgcolor: value ? "#D1FAE5" : "#ECFDF5",
            color: "#006E43",
            border: "1px solid rgba(3, 199, 90, 0.22)",
          }}
        >
          {value ? <CheckRoundedIcon sx={{ fontSize: 16 }} /> : <AutoAwesomeRoundedIcon sx={{ fontSize: 15 }} />}
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          {!value ? (
            <>
              <Stack direction="row" alignItems="center" gap={0.6} flexWrap="wrap">
                <Typography sx={{ fontSize: 12.5, fontWeight: 800, color: "#121314" }}>
                  고객을 연결해 두면 문서 관리가 훨씬 편해져요
                </Typography>
                <Box
                  component="span"
                  sx={{
                    px: 0.75,
                    py: 0.15,
                    borderRadius: "6px",
                    bgcolor: "#ECFDF5",
                    color: "#006E43",
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
                    bgcolor: "#ECFDF5",
                    color: "#006E43",
                    fontSize: 11,
                    fontWeight: 750,
                  }}
                >
                  문서 모아보기
                </Box>
              </Stack>
              <Typography variant="caption" sx={{ display: "block", color: "#4E5968", lineHeight: 1.5, mt: 0.35 }}>
                보고서 목록에서 누구의 제안서·보고서인지 한눈에 구분할 수 있고, 고객 상세(고객 문서함)에서 해당 고객의 제안서·보고서만 따로 모아 보거나 계약에 바로 연결할 수 있어요.
              </Typography>
            </>
          ) : (
            <>
              <Typography sx={{ fontSize: 12.5, fontWeight: 800, color: "#006E43" }}>
                {selectedCustomer?.name
                  ? `${formatCustomerShortName(selectedCustomer)} 고객의 문서로 연결됩니다`
                  : "선택한 고객의 문서로 연결됩니다"}
              </Typography>
              <Typography variant="caption" sx={{ display: "block", color: "#4E5968", lineHeight: 1.5, mt: 0.25 }}>
                생성 후 보고서 목록에 고객 이름이 함께 표시되며, 우측 [고객 문서함]에서 이 고객의 제안서·보고서만 따로 모아 볼 수 있어요.
              </Typography>
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
}
