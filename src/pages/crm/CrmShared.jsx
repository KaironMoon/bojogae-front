import { CustomerModal, CustomerField } from "./CustomerReference";
/* eslint-disable react/prop-types, react-refresh/only-export-components */
import ContractDesignIcon from "./ContractDesignIcon";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  MenuItem,
  Pagination,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Link } from "react-router-dom";
import {
  crmGet,
  crmPost,
  crmDelete,
  crmUpload,
  attachmentUrl,
  crmError,
} from "@/services/crm-service";
import { hasLocation, naverLinks } from "./crm-utils";
import CrmLocationPicker from "./CrmLocationPicker";

export function useCrm(path, params = {}) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const serial = JSON.stringify(params);
  const generation = useRef(0);
  const reload = useCallback(async () => {
    const request = ++generation.current;
    setLoading(true);
    setError("");
    try {
      const result = await crmGet(path, JSON.parse(serial));
      if (request === generation.current) setData(result);
    } catch (e) {
      if (request === generation.current) {
        setData(null);
        setError(crmError(e));
      }
    } finally {
      if (request === generation.current) setLoading(false);
    }
  }, [path, serial]);
  useEffect(() => {
    if (path) reload();
    else setData(null);
    return () => {
      generation.current += 1;
    };
  }, [path, reload]);
  return { data, error, loading, reload };
}
export function Page({ title, description, actions, headerClassName, badges, children }) {
  return (
    <Box sx={{ p: { xs: 1.5, md: 3 }, maxWidth: 1400, mx: "auto" }}>
      <Stack
        className={headerClassName}
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        gap={2}
        mb={3}
      >
        <Box>
          {badges}
          <div className="crm-page-title-line"><Typography variant="h5" fontWeight={800}>
            {title}
          </Typography>
          {description && (
            <Typography color="text.secondary" mt={0.5}>
              {description}
            </Typography>
          )}</div>
        </Box>
        <Stack direction="row" gap={1} flexWrap="wrap">
          {actions}
        </Stack>
      </Stack>
      {children}
    </Box>
  );
}
export function State({ resource }) {
  return (
    <>
      {resource.loading && <CircularProgress size={22} sx={{ m: 1 }} />}
      {resource.error && (
        <Alert severity="warning" sx={{ my: 2 }}>
          {resource.error}
          <Button onClick={resource.reload}>새로고침</Button>
        </Alert>
      )}
    </>
  );
}
export function Panel({ children, ...props }) {
  return (
    <Paper
      variant="outlined"
      sx={{ p: 2, borderRadius: 2.5, mb: 2 }}
      {...props}
    >
      {children}
    </Paper>
  );
}
export function Pages({ data, onChange }) {
  return data && data.total > data.page_size ? (
    <Pagination
      sx={{ my: 2 }}
      page={data.page}
      count={Math.ceil(data.total / data.page_size)}
      onChange={(_, page) => onChange(page)}
    />
  ) : null;
}
export function Empty({ children = "등록된 항목이 없습니다." }) {
  return (
    <Typography color="text.secondary" sx={{ py: 3 }}>
      {children}
    </Typography>
  );
}
export function Field({
  label,
  value,
  onChange,
  options,
  type = "text",
  ...props
}) {
  return (
    <TextField
      fullWidth
      size="small"
      label={label}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      select={!!options}
      type={options ? undefined : type}
      {...(["date", "datetime-local"].includes(type)
        ? { InputLabelProps: { shrink: true } }
        : {})}
      {...props}
    >
      {options &&
        Object.entries(options).map(([key, text]) => (
          <MenuItem key={key} value={key}>
            {text}
          </MenuItem>
        ))}
    </TextField>
  );
}
export function Editor({
  title,
  titleId,
  contractLayout = false,
  contractTaskLayout = false,
  customerLayout = false,
  open,
  onClose,
  onSubmit,
  children,
  busy,
  error,
}) {
  if (customerLayout) return <CustomerModal open={open} title={title} titleId={titleId} onClose={onClose} onSubmit={onSubmit} busy={busy} error={error}>{children}</CustomerModal>;
  return (
    <Dialog
      open={open}
      aria-labelledby={titleId}
      onClose={busy ? undefined : onClose}
      fullWidth
      maxWidth="md"
      slotProps={contractLayout || contractTaskLayout ? { paper: { className: `crm-contract-dialog${contractTaskLayout ? " crm-contract-task-dialog" : ""}` } } : undefined}
    >
      <Box
        component="form"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        {contractLayout || contractTaskLayout ? <div className="crm-contract-dialog-header">
          <span className="crm-contract-dialog-icon"><ContractDesignIcon name="bell" /></span>
          <div>
            <div className="crm-contract-dialog-heading">
              <DialogTitle id={titleId} className="css-2o971p">{title}</DialogTitle>
              {contractLayout && <span>성립일·생년월일을 바탕으로 참고일 자동 산출</span>}
            </div>
            <Typography variant="caption">{contractTaskLayout ? "고객에게 연락할 날짜와 업무 내용을 확인해 주세요." : "계약일과 생년월일을 바탕으로 고객에게 연락할 참고일을 확인하세요."}</Typography>
          </div>
          <IconButton aria-label="닫기" onClick={onClose} disabled={busy}><ContractDesignIcon name="close" /></IconButton>
        </div> : <DialogTitle id={titleId}>{title}</DialogTitle>}
        <DialogContent>
          <Stack gap={2} pt={1}>
            {error && <Alert severity="error">{error}</Alert>}
            {children}
          </Stack>
        </DialogContent>
        <DialogActions>
          {contractLayout && <span className="crm-contract-dialog-footer-note">💡 저장 시 상령일, 면책기간 종료일(90일), 감액기간 종료일(1~2년), 생일 참고일이 자동 계산됩니다.</span>}
          <Button disabled={busy} onClick={onClose}>
            취소
          </Button>
          <Button variant="contained" disabled={busy} type="submit">
            {busy ? "저장 중…" : "저장"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
export function useSave(onSave, onClose) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const save = async (payload) => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await onSave(payload);
      onClose();
    } catch (e) {
      setError(crmError(e));
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, save };
}
export const emptyLocation = () => ({
  address: "",
  lat: null,
  lng: null,
  accuracy: "NONE",
});
export function LocationFields({ value, onChange, addressId, customerDesign = false, compact = false }) {
  const [mapOpen, setMapOpen] = useState(false);
  const [pendingAddress, setPendingAddress] = useState(null);
  const AddressField = customerDesign ? CustomerField : Field;
  return (
    <>
      <Stack direction={{ xs: "column", sm: "row" }} gap={1}>
        <AddressField
          id={addressId} label={compact ? undefined : "주소"} inputProps={compact ? { "aria-label": "주소" } : undefined} placeholder={compact ? "도로명 주소 입력 또는 우측 [빠른 주소 확정] 클릭" : customerDesign ? "우측 [주소 검색]을 누르거나 도로명 주소를 입력하세요" : undefined}
          value={value.address}
          onChange={(address) => {
            if (address === value.address) return;
            if (value.lat != null && value.lng != null) {
              setPendingAddress(address);
            } else {
              onChange({ ...emptyLocation(), address });
            }
          }}
          helperText={compact ? undefined : "주소 검색 시 좌표도 함께 저장합니다. 정확한 위치가 다르면 지도에서 핀을 움직여 주세요."}
        />
        <Button onClick={() => setMapOpen(true)} sx={{ minWidth: 100, alignSelf: { sm: "flex-start" }, height: 40 }}>
          {customerDesign && !compact && <ContractDesignIcon name="search" />}{compact ? "📍 빠른 주소 확정" : "주소 검색"}
        </Button>
      </Stack>
      {mapOpen && <CrmLocationPicker customerDesign={customerDesign} value={value} onClose={() => setMapOpen(false)} onSelect={(location) => {
        onChange(location);
        setMapOpen(false);
      }} />}
      <Dialog slotProps={customerDesign ? { paper: { className: "crm-customer-dialog crm-customer-location-dialog" } } : undefined} open={pendingAddress !== null} onClose={() => setPendingAddress(null)} fullWidth maxWidth="xs" aria-labelledby="crm-address-edit-title">
        <DialogTitle id="crm-address-edit-title">주소를 수정할까요?</DialogTitle>
        <DialogContent>주소를 수정하면 지정한 지도 위치가 해제됩니다.</DialogContent>
        <DialogActions>
          <Button autoFocus onClick={() => setPendingAddress(null)}>취소</Button>
          <Button onClick={() => {
            onChange({ ...emptyLocation(), address: pendingAddress });
            setPendingAddress(null);
          }}>수정</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
export function CustomerPicker({
  value,
  onChange,
  label = "고객",
  allowEmpty = false,
  searchId,
  selectId,
  compact = false,
  disabled = false,
}) {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const sequence = useRef(0);
  async function search() {
    const request = ++sequence.current;
    setError("");
    try {
      const result = await crmGet("/customers", { q: query, page_size: 100 });
      if (request === sequence.current) setItems(result.items);
    } catch (e) {
      if (request === sequence.current) setError(crmError(e));
    }
  }
  return (
    <Stack gap={1} className="crm-customer-picker">
      <Stack direction="row" gap={1}>
        <Field id={searchId} label={compact ? undefined : `${label} 검색`} inputProps={{ "aria-label": `${label} 검색` }} placeholder={compact ? `${label} 검색` : undefined} disabled={disabled} value={query} onChange={setQuery} />
        <Button onClick={search} disabled={disabled} sx={{ minWidth: 90 }}>
          검색
        </Button>
      </Stack>
      {error && <Alert severity="warning">{error}</Alert>}
      <Field
        id={selectId} label={compact ? undefined : `${label} 선택`} disabled={disabled}
        SelectProps={compact ? { native: false, displayEmpty: true, inputProps: { "aria-label": `${label} 선택` } } : undefined}
        value={value || ""}
        onChange={(v) => onChange(v ? Number(v) : null)}
        options={{
          "": allowEmpty ? "직접 입력 / 미연결" : "선택하세요",
          ...(value && !items.some((r) => r.id === value)
            ? { [value]: `연결 고객 #${value}` }
            : {}),
          ...Object.fromEntries(
            items.map((r) => [
              r.id,
              `${r.name}${r.alias ? ` (${r.alias})` : ""} · ${r.phone || r.location.address}`,
            ]),
          ),
        }}
      />
    </Stack>
  );
}
export function ContractPicker({ customerId, value, onChange }) {
  const resource = useCrm(customerId ? "/contracts" : null, {
    customer_id: customerId,
    page_size: 100,
  });
  return (
    <Field
      label="관련 계약 (선택)"
      value={value || ""}
      options={{
        "": "계약 연결 안 함",
        ...Object.fromEntries(
          (resource.data?.items || []).map((r) => [
            r.id,
            `${r.insurer} · ${r.product}`,
          ]),
        ),
        ...(value && !resource.data?.items.some((r) => r.id === value)
          ? { [value]: `연결 계약 #${value}` }
          : {}),
      }}
      onChange={(v) => onChange(v ? Number(v) : null)}
    />
  );
}
export function Attachments({ customerId, contractId, disabled = false }) {
  const target = { customer_id: customerId, contract_id: contractId };
  const resource = useCrm("/attachments", target);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [remove, setRemove] = useState(null);
  async function upload(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 10485760) {
      setError("10MB 이하 파일을 선택해 주세요.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      await crmUpload(file, target);
      resource.reload();
    } catch (err) {
      setError(crmError(err));
    } finally {
      setBusy(false);
    }
  }
  async function archive() {
    setBusy(true);
    try {
      await crmDelete(`/attachments/${remove.id}`);
      setRemove(null);
      resource.reload();
    } catch (e) {
      setError(crmError(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Panel>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography fontWeight={700}>관련 문서</Typography>
        <Button component="label" disabled={disabled || busy}>
          파일 첨부
          <input
            type="file"
            hidden
            accept="application/pdf,image/png,image/jpeg"
            onChange={upload}
          />
        </Button>
      </Stack>
      <Typography variant="caption">PDF·PNG·JPG, 파일당 10MB 이하</Typography>
      <State resource={resource} />
      {error && <Alert severity="error">{error}</Alert>}
      {resource.data?.items.map((r) => (
        <Stack
          key={r.id}
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Button href={attachmentUrl(r.id)}>{r.filename}</Button>
          <Button
            disabled={disabled || busy}
            color="inherit"
            onClick={() => setRemove(r)}
          >
            보관
          </Button>
        </Stack>
      ))}
      <Dialog open={!!remove} onClose={() => !busy && setRemove(null)}>
        <DialogTitle>문서를 보관할까요?</DialogTitle>
        <DialogContent>{remove?.filename}</DialogContent>
        <DialogActions>
          <Button onClick={() => setRemove(null)}>취소</Button>
          <Button disabled={busy} onClick={archive}>
            보관
          </Button>
        </DialogActions>
      </Dialog>
    </Panel>
  );
}
export function Directions({ location, origin, label = "길찾기" }) {
  const [open, setOpen] = useState(false);
  const [webLink, setWebLink] = useState("");
  const [linkError, setLinkError] = useState("");
  const [mode, setMode] = useState("car");
  const [useOrigin, setUseOrigin] = useState(true);
  const [resolved, setResolved] = useState(null);
  const locationKey = JSON.stringify(location);
  const useAddress = location?.accuracy !== "EXACT" && Boolean(location?.address?.trim());
  const destination = resolved?.key === locationKey ? resolved.location : useAddress ? null : location;
  const valid = hasLocation(destination);
  const links = valid
    ? naverLinks(destination, mode, useOrigin ? origin : undefined)
    : null;
  const mobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
  const android = /Android/i.test(navigator.userAgent);
  const destinationKey = JSON.stringify(destination);
  const originKey = JSON.stringify(useOrigin ? origin : null);
  useEffect(() => {
    const addressOnly = JSON.parse(locationKey || "null");
    if (!open || (hasLocation(addressOnly) && addressOnly.accuracy === "EXACT") || !addressOnly?.address?.trim()) return;
    let active = true;
    setLinkError("");
    crmPost("/maps/geocode", { query: addressOnly.address }).then((result) => {
      if (!active) return;
      if (result.items[0]) setResolved({ key: locationKey, location: result.items[0] });
      else setLinkError("주소를 찾지 못했습니다. 고객 주소를 확인해 주세요.");
    }).catch((error) => { if (active) setLinkError(crmError(error)); });
    return () => { active = false; };
  }, [open, locationKey]);
  const close = () => { setOpen(false); setResolved(null); setWebLink(""); setLinkError(""); };
  useEffect(() => {
    if (!open || mobile || !valid) return;
    let disposed = false;
    setWebLink("");
    setLinkError("");
    crmPost("/maps/navigation-link", {
      destination: JSON.parse(destinationKey),
      origin: originKey ? JSON.parse(originKey) : null,
      mode,
    })
      .then((data) => {
        if (!disposed) setWebLink(data.web);
      })
      .catch((e) => {
        if (!disposed) setLinkError(crmError(e));
      });
    return () => {
      disposed = true;
    };
  }, [open, mobile, valid, destinationKey, originKey, mode]);
  return (
    <>
      <Button size="small" disabled={!valid && !location?.address?.trim()} onClick={() => setOpen(true)}>
        {label}
      </Button>
      <Dialog
        open={open}
        onClose={close}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>네이버 지도 길찾기</DialogTitle>
        <DialogContent>
          <Stack gap={2}>
            {!valid && !linkError && <Typography>주소로 위치를 찾는 중입니다.</Typography>}
            {linkError && <Alert severity="warning">{linkError}</Alert>}
            {destination?.accuracy === "APPROXIMATE" && (
              <Alert severity="warning">
                대략 위치입니다. 목적지가 실제 방문 장소인지 확인해 주세요.
              </Alert>
            )}
            <Typography>{location?.address || "지정한 방문 위치"}</Typography>
            <Field
              label="이동 방식"
              value={mode}
              onChange={setMode}
              options={{ car: "자동차", walk: "도보", public: "대중교통" }}
            />
            {hasLocation(origin) && (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={useOrigin}
                    onChange={(e) => setUseOrigin(e.target.checked)}
                  />
                }
                label="검색 기준 위치에서 출발"
              />
            )}
            <Typography variant="body2">
              {hasLocation(origin) && useOrigin
                ? "검색 기준 위치"
                : "네이버 지도에서 확인한 현재 위치"}
              에서 출발합니다.
            </Typography>
            {links && (
              <>
                <Button
                  variant="contained"
                  disabled={!mobile && !webLink}
                  href={
                    mobile ? (android ? links.android : links.app) : webLink
                  }
                  target={mobile ? undefined : "_blank"}
                  rel="noopener noreferrer"
                >
                  네이버 지도에서 열기
                </Button>
                {mobile && (
                  <Button
                    href={android ? links.androidStore : links.iosStore}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    앱이 열리지 않나요? 설치하기
                  </Button>
                )}
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={close}>닫기</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
export function CustomerLink({ id, name }) {
  return (
    <Button size="small" component={Link} to={`/crm/customers/${id}`}>
      {name || `고객 #${id}`}
    </Button>
  );
}
export function StatusChip({ label, warning = false }) {
  return (
    <Chip size="small" label={label} color={warning ? "warning" : "default"} />
  );
}
