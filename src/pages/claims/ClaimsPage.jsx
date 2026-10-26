import { useEffect, useRef, useState } from 'react';
import { Link, useBlocker, useLocation, useNavigate } from 'react-router-dom';
import { Alert, Box, Button, Checkbox, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Divider, FormControlLabel, Grid,
  MenuItem, Paper, Stack, Step, StepLabel, Stepper, TextField, Typography } from '@mui/material';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import SignaturePad from './SignaturePad';
import ClaimPdfResult from './ClaimPdfResult';
import ClaimPdfPreview from './ClaimPdfPreview';
import ClaimHistory from './ClaimHistory';
import ClaimFaxDestinations from './ClaimFaxDestinations';
import ClaimCustomerDialog from './ClaimCustomerDialog';
import { claimError, claimTemplateUrl, generateClaimPdf, getClaimInsurers, saveClaimRequest, downloadOriginalClaim } from '@/services/claim-service';
import { activeClaimPayload, claimInputErrors, claimErrorStep, claimNeedsGuardian, claimHasGuardian,
  formatClaimInput, formatClaimInputEdit, isFormattedClaimField } from '@/services/claim-validation';

const EMPTY = {
  insured_name: '', insured_id: '', insured_phone: '', insured_signature: '', beneficiary_same: true,
  beneficiary_name: '', beneficiary_id: '', beneficiary_phone: '', beneficiary_signature: '',
  insured_guardian_name: '', insured_guardian_relationship: '', insured_guardian_phone: '',
  beneficiary_guardian_name: '', beneficiary_guardian_relationship: '', beneficiary_guardian_phone: '',
  insured_guardian_enabled: false, beneficiary_guardian_enabled: false,
  insured_guardian_signature: '', beneficiary_guardian_signature: '',
  notice_target: 'insured', planner_name: '', planner_phone: '', accident_type: '질병', accident_date: '',
  accident_description: '', bank_name: '', account_number: '', account_holder: '', consent: false,
};
const STEPS = ['보험사 선택', '인적사항·서명', '사고·계좌·첨부', 'PDF 확인'];
const FIELD_GRID = {
  display: 'grid', gap: 2,
  gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(3, minmax(0, 1fr))' },
};

export default function ClaimsPage() {
  const navigate = useNavigate();
  const view = useLocation().pathname === '/claims/history' ? 'history' : 'create';
  const [insurers, setInsurers] = useState([]);
  const [selected, setSelected] = useState([]);
  const [faxNumbers, setFaxNumbers] = useState({});
  const [payload, setPayload] = useState(EMPTY);
  const [files, setFiles] = useState([]);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [results, setResults] = useState([]);
  const [leavingStep, setLeavingStep] = useState(false);
  const [progress, setProgress] = useState('');
  const [saved, setSaved] = useState(null);
  const [customerTarget, setCustomerTarget] = useState(null);
  const [customerNotice, setCustomerNotice] = useState('');
  const [partyRevision, setPartyRevision] = useState({ insured: 0, beneficiary: 0 });
  const downloadOnlyInsurers = insurers.filter(item => selected.includes(item.id) && item.fax_enabled === false);
  const requestKey = useRef(null);
  const pending = useRef(null);
  const form = useRef(null);
  const hasOriginals = view === 'create' && step === 3 && results.length > 0;
  const blocker = useBlocker(({ currentLocation, nextLocation }) =>
    hasOriginals && currentLocation.pathname !== nextLocation.pathname);
  useEffect(() => {
    if (!hasOriginals) return;
    const warnBeforeUnload = event => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warnBeforeUnload);
    return () => window.removeEventListener('beforeunload', warnBeforeUnload);
  }, [hasOriginals]);
  function cancelLeave() {
    setLeavingStep(false);
    if (blocker.state === 'blocked') blocker.reset();
  }
  function confirmLeave() {
    invalidate();
    setLeavingStep(false);
    if (blocker.state === 'blocked') {
      // The history route can reuse this component: discard the original source too.
      setPayload(EMPTY); setFiles([]); setSelected([]); setFaxNumbers({}); setStep(0);
      blocker.proceed();
    } else setStep(2);
  }
  function previousStep() {
    if (hasOriginals) setLeavingStep(true);
    else setStep(s => s - 1);
  }
  useEffect(() => {
    const controller = new AbortController();
    getClaimInsurers(controller.signal).then(setInsurers).catch(async e => {
      if (!controller.signal.aborted) setError(await claimError(e));
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => { controller.abort(); pending.current?.abort(); };
  }, []);
  function invalidate() {
    setResults([]); setSaved(null); setError(''); requestKey.current = null;
  }
  function update(key, value) {
    invalidate(); setPayload(previous => ({ ...previous, [key]: value }));
    setFieldErrors(previous => ({ ...previous, [key]: undefined }));
  }
  function loadCustomer(customer) {
    const party = customerTarget;
    const values = {
      [`${party}_name`]: customer.name,
      [`${party}_id`]: formatClaimInput(`${party}_id`, customer.resident_number),
      [`${party}_phone`]: formatClaimInput(`${party}_phone`, customer.phone),
      [`${party}_signature`]: '', [`${party}_guardian_enabled`]: false,
      ...Object.fromEntries(['name', 'relationship', 'phone', 'signature'].map(key => [`${party}_guardian_${key}`, ''])),
      consent: false,
    };
    invalidate();
    setPayload(previous => ({ ...previous, ...values }));
    setFieldErrors(previous => Object.fromEntries(Object.entries(previous).filter(([key]) => !(key in values))));
    // Remount pads to cancel pending image uploads belonging to the previous customer.
    setPartyRevision(previous => ({ ...previous, [party]: previous[party] + 1 }));
    setCustomerNotice(`${party === 'insured' ? '피보험자' : '수익자'} 고객 정보를 불러왔습니다. 주민등록번호 나머지 자리와 서명을 입력해 주세요. 기존 법정대리인 정보·서명과 동의 확인은 초기화했습니다.`);
    setCustomerTarget(null);
  }
  function field(key, label, options = {}) {
    const formatted = isFormattedClaimField(key);
    return <TextField fullWidth size="small" name={key} label={label} value={payload[key]} disabled={busy}
      error={Boolean(fieldErrors[key])} helperText={fieldErrors[key]}
      onBlur={e => setFieldErrors(previous => ({ ...previous,
        [key]: claimInputErrors({ ...payload, [key]: e.target.value })[key] }))}
      onChange={e => {
        if (!formatted) { update(key, e.target.value); return; }
        const input = e.target;
        const edit = formatClaimInputEdit(key, input.value, payload[key], input.selectionStart ?? input.value.length,
          e.nativeEvent.inputType);
        update(key, edit.value);
        requestAnimationFrame(() => {
          if (input === document.activeElement) input.setSelectionRange(edit.selectionStart, edit.selectionStart);
        });
      }} autoComplete="off" InputLabelProps={{ shrink: true }} {...options}
      {...(formatted ? { type: 'tel', inputProps: { ...options.inputProps, inputMode: 'numeric', maxLength: undefined } } : {})} />;
  }
  function guardianFields(party, label) {
    const automatic = claimNeedsGuardian(payload[`${party}_id`]);
    const active = claimHasGuardian(payload, party);
    return <Stack spacing={2}>
      <FormControlLabel label={`${label} 법정대리인 정보 추가`} control={<Checkbox checked={active} disabled={busy || automatic}
        onChange={event => update(`${party}_guardian_enabled`, event.target.checked)} />} />
      {active && <Stack spacing={2} sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
      <Typography fontWeight={700}>{label} 법정대리인 정보</Typography>
      <Typography variant="body2" color="text.secondary">{automatic ? `${label}가 만 14세 미만이므로 ` : ''}법정대리인 정보를 입력해 주세요. 보험사 원본의 해당 칸과 서명된 별지에 반영합니다.</Typography>
      <Box sx={FIELD_GRID}>
        {field(`${party}_guardian_name`, `${label} 법정대리인 성명`, { required: true, inputProps: { maxLength: 40 } })}
        {field(`${party}_guardian_relationship`, `${label} 법정대리인 관계`, { required: true, placeholder: '예: 부, 모, 후견인', inputProps: { maxLength: 30 } })}
        {field(`${party}_guardian_phone`, `${label} 법정대리인 연락처`, { required: true, type: 'tel' })}
      </Box>
      <SignaturePad key={`${party}-${partyRevision[party]}`} label={`${label} 법정대리인 서명`} value={payload[`${party}_guardian_signature`]} disabled={busy}
        onChange={value => update(`${party}_guardian_signature`, value)} />
      {fieldErrors[`${party}_guardian_signature`] && <Alert severity="error">{fieldErrors[`${party}_guardian_signature`]}</Alert>}
      </Stack>}
    </Stack>;
  }
  function next() {
    setError('');
    if (step === 0 && !selected.length) { setError('보험사를 한 곳 이상 선택해 주세요.'); return; }
    if (step === 1 && !validate(1)) return;
    if (!form.current.reportValidity()) return;
    setStep(step + 1);
  }
  function validate(stage) {
    const errors = claimInputErrors(payload, stage);
    setFieldErrors(errors);
    if (!Object.keys(errors).length) return true;
    setError(Object.values(errors)[0]);
    setStep(claimErrorStep(errors));
    return false;
  }
  async function generate() {
    if (!selected.length) { setError('보험사를 한 곳 이상 선택해 주세요.'); setStep(0); return; }
    if (!validate(2)) return;
    if (!form.current.reportValidity()) return;
    invalidate(); setBusy(true);
    const controller = new AbortController(); pending.current = controller;
    const generated = []; const failures = [];
    for (const id of selected) {
      const company = insurers.find(item => item.id === id);
      setProgress(`${company.name} PDF 생성 중 (${generated.length + failures.length + 1}/${selected.length})`);
      try {
        const result = await generateClaimPdf(id, activeClaimPayload(payload), files, controller.signal);
        if (controller.signal.aborted) return;
        generated.push({ ...result, id, name: company.name });
      } catch (e) {
        if (controller.signal.aborted) return;
        failures.push(`${company.name}: ${await claimError(e)}`);
      }
    }
    setResults(generated); setStep(3); setBusy(false); setProgress('');
    if (failures.length) setError(failures.join('\n'));
  }
  async function save(mode) {
    if (busy) return;
    if (mode === 'FAX' && downloadOnlyInsurers.length) {
      setError(`${downloadOnlyInsurers.map(item => item.name).join(', ')}은 다운로드만 지원합니다. 팩스 발송 대상에서 제외해 주세요.`);
      return;
    }
    if (results.length !== selected.length) {
      setError('선택한 보험사의 PDF를 모두 생성한 후 다시 시도해 주세요.'); return;
    }
    setBusy(true); setError('');
    requestKey.current ||= { mode, key: crypto.randomUUID() };
    if (requestKey.current.mode !== mode) requestKey.current = { mode, key: crypto.randomUUID() };
    try {
      const result = await saveClaimRequest(requestKey.current.key, selected, activeClaimPayload(payload), files, faxNumbers, mode);
      setSaved(result);
      if (mode === 'FILE') {
        try { await downloadOriginalClaim(requestKey.current.key, selected, activeClaimPayload(payload), files); }
        catch (e) { setError(`청구서는 저장되었습니다. 다운로드를 다시 시도해 주세요. ${await claimError(e)}`); }
      }
    } catch (e) { setError(await claimError(e)); } finally { setBusy(false); }
  }
  function reuse(detail, attachments) {
    invalidate();
    const claim = { ...detail.claim };
    for (const key of Object.keys(EMPTY)) if (key.endsWith('_signature')) claim[key] = '';
    for (const party of ['insured', 'beneficiary']) {
      claim[`${party}_id`] = formatClaimInput(`${party}_id`, String(claim[`${party}_id`] || '').replace(/\D/g, '').slice(0, 7));
    }
    setPayload({ ...EMPTY, ...claim, consent: false,
      insured_guardian_enabled: Boolean(claim.insured_guardian_name),
      beneficiary_guardian_enabled: Boolean(claim.beneficiary_guardian_name) });
    setSelected(detail.deliveries.map(item => item.insurer_id));
    // A virtual number may belong to a previous claim or have expired.
    setFaxNumbers({});
    setFiles(attachments); setFieldErrors({}); setCustomerNotice(''); setStep(0); navigate('/claims/new');
  }
  return <Box sx={{ maxWidth: 1100, mx: 'auto', p: { xs: 2, md: 3 } }}>
    {view === 'history' ? <ClaimHistory onReuse={reuse} /> : <Stack spacing={3} component="form" ref={form} onSubmit={e => e.preventDefault()}>
      <Box><Typography variant="h4" fontWeight={800}>보험금 청구서 만들기</Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>공통 정보를 입력하면 보험사별 청구서를 만들 수 있습니다.</Typography></Box>
      <Alert severity="info">파일만 저장하면 서명·첨부가 포함된 발송용 원본을 다운로드합니다. 청구내역에는 본문 주민번호를 마스킹하고 당시 서명·동의 표시를 유지한 보관본과 첨부 원본을 저장합니다. 팩스 발송은 현재 서비스 미연결로 실패 이력만 남으며 비용은 차감되지 않습니다.</Alert>
      <Stepper activeStep={step} alternativeLabel>{STEPS.map(title => <Step key={title}><StepLabel>{title}</StepLabel></Step>)}</Stepper>
      {error && <Alert severity="error" sx={{ whiteSpace: 'pre-line' }}>{error}</Alert>}
      {saved && <Alert severity={saved.fax_history?.some(item => item.status === 'FAILED') ? 'warning' : 'success'} role="status" action={<Button component={Link} to="/claims/history" color="inherit" size="small">청구내역 보기</Button>}>
        청구 요청 {saved.id}번이 저장되었습니다. {saved.save_mode === 'FILE' ? '파일 다운로드를 요청했습니다.' : '팩스 발송 결과는 청구내역의 발송 이력에서 확인해 주세요.'}
      </Alert>}
      {loading ? <CircularProgress aria-label="보험사 불러오는 중" /> : <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
        {step === 0 && <Stack spacing={2} role="group" aria-label="청구할 보험사">
          <Typography variant="h6" fontWeight={700}>청구할 보험사를 선택해 주세요</Typography>
          <Typography variant="body2" color="text.secondary">확인된 {insurers.length}개 양식을 지원합니다. 여러 보험사를 함께 선택할 수 있습니다.</Typography>
          {downloadOnlyInsurers.length > 0 && <Alert severity="info">{downloadOnlyInsurers.map(item => item.name).join(', ')}은 다운로드만 지원합니다. 팩스를 발송하려면 해당 보험사를 선택 해제해 주세요.</Alert>}
          {['DAMAGE', 'LIFE'].map(kind => <Box key={kind}>
            <Typography fontWeight={700} sx={{ mb: 1 }}>{kind === 'DAMAGE' ? '손해보험·공제' : '생명보험'}</Typography>
            <Grid container spacing={1}>{insurers.filter(item => item.kind === kind).map(item => <Grid item xs={12} sm={6} md={4} key={item.id}>
              <Paper variant="outlined" sx={{ px: 1, bgcolor: selected.includes(item.id) ? '#eef4ff' : 'white' }}>
                <FormControlLabel sx={{ width: '100%', m: 0 }} label={`${item.name}${item.fax_enabled === false ? ' · 다운로드 전용' : ''}`} control={<Checkbox checked={selected.includes(item.id)} disabled={busy}
                  onChange={event => { invalidate(); setSelected(previous => event.target.checked
                    ? [...previous, item.id] : previous.filter(id => id !== item.id));
                    setFaxNumbers(previous => { const next = { ...previous }; delete next[item.id]; return next; }); }} />} />
              </Paper>
            </Grid>)}</Grid>
          </Box>)}
        </Stack>}
        {step === 1 && <Stack spacing={2.5}>
          {downloadOnlyInsurers.some(item => item.id === '13') && <Alert severity="info">동양생명은 공식 양식에 따라 주민번호 뒤 5자리를 가려 표시합니다. 미성년자 청구 시 친권자 전원의 서명이 필요할 수 있으므로, 추가 친권자·수익자 서명과 신분확인 정보는 원본 양식을 확인하고 별도로 보완해 주세요.</Alert>}
          {customerNotice && <Alert severity="info" onClose={() => setCustomerNotice('')}>{customerNotice}</Alert>}
          <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
            <Typography variant="h6" fontWeight={700}>피보험자</Typography>
            <Button variant="outlined" disabled={busy} onClick={() => setCustomerTarget('insured')}>피보험자 · 내 고객 불러오기</Button>
          </Stack>
          <Box sx={FIELD_GRID}>
            {field('insured_name', '이름', { required: true, inputProps: { maxLength: 40 } })}
            {field('insured_id', '주민등록번호', { required: true, placeholder: '앞 6자리-뒤 7자리', inputProps: { pattern: '[0-9]{6}-?[0-9]{7}', maxLength: 14 } })}
            {field('insured_phone', '휴대전화', { required: true, type: 'tel' })}
          </Box>
          <SignaturePad key={`insured-${partyRevision.insured}`} label="피보험자 서명" value={payload.insured_signature} disabled={busy} onChange={value => update('insured_signature', value)} />
          {claimNeedsGuardian(payload.insured_id) && <Typography variant="caption">만 14세 미만은 법정대리인 서명을 필수로 받습니다. 본인 서명은 가능한 경우에만 추가해 주세요.</Typography>}
          {guardianFields('insured', '피보험자')}
          <Divider />
          <FormControlLabel label="보험금 수익자가 피보험자와 같습니다" control={<Checkbox checked={payload.beneficiary_same} disabled={busy} onChange={e => update('beneficiary_same', e.target.checked)} />} />
          {!payload.beneficiary_same && <>
            <Button variant="outlined" sx={{ alignSelf: 'flex-start' }} disabled={busy} onClick={() => setCustomerTarget('beneficiary')}>수익자 · 내 고객 불러오기</Button>
            <Box sx={FIELD_GRID}>
              {field('beneficiary_name', '수익자 이름', { required: true })}
              {field('beneficiary_id', '수익자 주민등록번호', { required: true, inputProps: { pattern: '[0-9]{6}-?[0-9]{7}', maxLength: 14 } })}
              {field('beneficiary_phone', '수익자 휴대전화', { required: true, type: 'tel' })}
            </Box>
            {guardianFields('beneficiary', '수익자')}
            <SignaturePad key={`beneficiary-${partyRevision.beneficiary}`} label="수익자 서명" value={payload.beneficiary_signature} disabled={busy} onChange={value => update('beneficiary_signature', value)} />
            {claimNeedsGuardian(payload.beneficiary_id) && <Typography variant="caption">만 14세 미만은 법정대리인 서명을 필수로 받습니다. 본인 서명은 가능한 경우에만 추가해 주세요.</Typography>}
          </>}
          {field('notice_target', '보상 안내를 받을 사람', { select: true, children: [<MenuItem key="insured" value="insured">피보험자</MenuItem>, <MenuItem key="planner" value="planner">설계사</MenuItem>] })}
          {payload.notice_target === 'planner' && <Box sx={{ ...FIELD_GRID, gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(2, minmax(0, 1fr))' } }}>
            {field('planner_name', '설계사 이름', { required: true })}
            {field('planner_phone', '설계사 연락처', { required: true, type: 'tel' })}
          </Box>}
        </Stack>}
        {step === 2 && <Stack spacing={2.5}>
          <Typography variant="h6" fontWeight={700}>사고 정보와 지급 계좌</Typography>
          <Box sx={{ ...FIELD_GRID, gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(2, minmax(0, 1fr))' } }}>
            {field('accident_type', '사고 유형', { select: true, children: ['질병', '상해', '교통사고'].map(v => <MenuItem key={v} value={v}>{v}</MenuItem>) })}
            {field('accident_date', '사고일 / 최초 진료일', { type: 'date', required: true, InputLabelProps: { shrink: true } })}
            {field('accident_description', '사고 경위', { multiline: true, minRows: 3, required: true, inputProps: { maxLength: 500 }, sx: { gridColumn: '1 / -1' } })}
          </Box>
          <Box sx={FIELD_GRID}>
            {field('bank_name', '은행명', { required: true })}
            {field('account_number', '계좌번호', { required: true, inputProps: { maxLength: 30 } })}
            {field('account_holder', '예금주', { required: true })}
          </Box>
          <Divider />
          <Box><Typography fontWeight={700} sx={{ mb: 1 }}>청구 서류 첨부</Typography>
            <Button variant="outlined" component="label" disabled={busy}>PDF·사진 추가<input type="file" hidden multiple accept="application/pdf,image/png,image/jpeg,image/webp"
              onChange={e => {
                const added = [...e.target.files]; e.target.value = '';
                if ([...files, ...added].length > 25 || [...files, ...added].reduce((s, f) => s+f.size, 0) > 20*1024*1024) {
                  setError('첨부는 25개 파일, 합계 20MB까지 가능합니다.'); return;
                }
                invalidate(); setFiles(old => [...old, ...added]);
              }} /></Button>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>청구서 포함 최종 50쪽·20MB까지. PDF는 암호를 해제해서 첨부해 주세요.</Typography>
            <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 1 }}>{files.map((f, i) => <Chip key={`${f.name}-${i}`} label={f.name} disabled={busy} onDelete={() => { invalidate(); setFiles(old => old.filter((_, n) => n !== i)); }} />)}</Stack>
          </Box>
          <Alert severity="warning">입력하지 않은 직업·주소 등의 칸은 비워 두며 일부 항목은 ‘자료첨부’로 표시됩니다. 생성 후 빠진 내용을 확인해 주세요.</Alert>
          <Box><Typography fontWeight={700}>보험사 양식·동의서 확인</Typography>
            <Stack direction="row" gap={1} flexWrap="wrap" sx={{ my: 1 }}>{selected.map(id => <Button key={id} size="small" href={claimTemplateUrl(id)} target="_blank" rel="noopener noreferrer">{insurers.find(i => i.id === id)?.name} 양식 보기</Button>)}</Stack>
            <FormControlLabel label="선택한 보험사의 필수 개인정보 동의서를 확인했으며, 서명자의 동의에 따라 PDF에 동의 표시와 서명을 반영합니다." control={<Checkbox checked={payload.consent} disabled={busy} onChange={e => update('consent', e.target.checked)} />} />
          </Box>
        </Stack>}
        {step === 3 && <Stack spacing={2}>
          <Typography variant="h6" fontWeight={700}>생성된 PDF {results.length}건</Typography>
          <Typography variant="body2" color="text.secondary">보험사별 내용을 확인한 뒤 파일만 저장 또는 팩스 발송을 선택하세요. 보험사별 PDF를 각각 다운로드할 수 있으며, 파일 공유를 지원하는 모바일에서는 공유하기를 사용할 수 있습니다. 입력을 수정하면 다시 생성해야 합니다.</Typography>
          <Typography variant="body2" color="text.secondary">파일만 저장할 때는 수신 팩스 번호를 입력하지 않아도 됩니다.</Typography>
          {downloadOnlyInsurers.length > 0 && <Alert severity="info">{downloadOnlyInsurers.map(item => item.name).join(', ')}이 선택되어 팩스 발송을 사용할 수 없습니다. 파일만 저장으로 다운로드해 주세요.</Alert>}
          <Alert severity="warning">발송용 원본에는 주민등록번호 등 개인정보와 서명이 포함됩니다. 원본은 이 작성 화면에서 다운로드해 주세요. 청구내역에서는 본문 주민번호를 마스킹하고 당시 서명·동의 표시를 유지한 보관본을 제공합니다. 재작성 시에는 서명과 동의를 다시 받아야 합니다. 첨부파일은 원본으로 보관합니다.</Alert>
          {results.map(result => <Stack key={result.id} spacing={1.5}>
            <Typography fontWeight={700}>{result.name} PDF · {result.pages}쪽</Typography>
            <ClaimPdfPreview blob={result.blob} name={result.name} />
          </Stack>)}
          <ClaimFaxDestinations insurers={insurers.filter(item => selected.includes(item.id))} numbers={faxNumbers}
            disabled={busy || Boolean(saved)} onChange={(id, value) => {
              requestKey.current = null; setFaxNumbers(previous => ({ ...previous, [id]: value }));
            }} renderAction={insurer => {
              const result = results.find(item => item.id === insurer.id);
              return result ? <ClaimPdfResult result={result} disabled={busy} />
                : <Alert severity="warning">PDF를 생성하지 못했습니다. 이전 단계에서 다시 생성해 주세요.</Alert>;
            }} />
          {!results.length && <Alert severity="warning">생성된 PDF가 없습니다. 이전 단계에서 내용을 확인해 주세요.</Alert>}
        </Stack>}
      </Paper>}
      {busy && <Stack direction="row" spacing={1} alignItems="center" role="status"><CircularProgress size={20} /><Typography>{progress || '청구 요청 저장 중'}</Typography></Stack>}
      <Stack direction="row" justifyContent="space-between" spacing={2}>
        <Button disabled={step === 0 || busy} onClick={previousStep}>이전</Button>
        {step < 2 ? <Button variant="contained" disabled={busy || loading} onClick={next}>다음</Button>
          : step === 2 ? <Button variant="contained" disabled={busy} startIcon={<DescriptionOutlinedIcon />} onClick={generate}>PDF 생성</Button>
            : <Stack direction="row" gap={1} flexWrap="wrap">
              {saved ? <Button variant="outlined" disabled={busy} onClick={async () => {
                setBusy(true); setError('');
                try { await downloadOriginalClaim(requestKey.current.key, selected, activeClaimPayload(payload), files); } catch (e) { setError(await claimError(e)); }
                finally { setBusy(false); }
              }}>발송용 원본 다운로드</Button> : <>
                <Button variant="outlined" startIcon={<DownloadOutlinedIcon />}
                  disabled={busy || !results.length || results.length !== selected.length} onClick={() => save('FILE')}>파일만 저장</Button>
                <Button variant="contained" disabled={busy || !results.length || results.length !== selected.length || downloadOnlyInsurers.length > 0}
                  onClick={() => save('FAX')}>팩스 발송</Button>
              </>}
            </Stack>}
      </Stack>
    </Stack>}
    <Dialog open={leavingStep || blocker.state === 'blocked'} onClose={cancelLeave}
      aria-labelledby="claim-leave-title" aria-describedby="claim-leave-description">
      <DialogTitle id="claim-leave-title">원본 PDF를 받으셨나요?</DialogTitle>
      <DialogContent><DialogContentText id="claim-leave-description">
        이 화면을 벗어나면 주민등록번호가 마스킹되지 않은 원본 PDF를 더 이상 다운로드하거나 공유할 수 없습니다. 필요한 파일을 먼저 다운로드하거나 공유해 주세요.
      </DialogContentText></DialogContent>
      <DialogActions>
        <Button onClick={cancelLeave} autoFocus>머무르기</Button>
        <Button onClick={confirmLeave} color="warning">나가기</Button>
      </DialogActions>
    </Dialog>
    {view === 'create' && customerTarget && <ClaimCustomerDialog
      label={customerTarget === 'insured' ? '피보험자' : '수익자'}
      onClose={() => setCustomerTarget(null)} onSelect={loadCustomer} />}
  </Box>;
}
