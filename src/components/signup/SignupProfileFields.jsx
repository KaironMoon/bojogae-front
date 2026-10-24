/* eslint-disable react/prop-types */
import { Autocomplete, Stack, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import api from '@/services/api-caller';

export default function SignupProfileFields({ value, onChange, disabled = false, nameKey = 'name', nameLabel = '이름', phoneKey = 'phone', branchRequired = false, onGroupCheckChange }) {
  const [options, setOptions] = useState([]);
  const [searchError, setSearchError] = useState(false);
  const [branchFocused, setBranchFocused] = useState(false);
  const affiliation = value.affiliation || '';
  const branchName = value.branch_name || '';
  const [groupCheck, setGroupCheck] = useState({ key: '', status: 'idle' });
  const groupKey = JSON.stringify([affiliation.trim(), branchName.trim()]);
  const shouldCheckGroup = branchRequired && !disabled && Boolean(affiliation.trim() && branchName.trim());
  const groupStatus = shouldCheckGroup ? (groupCheck.key === groupKey ? groupCheck.status : 'checking') : 'idle';

  useEffect(() => {
    if (!shouldCheckGroup) return undefined;
    let active = true;
    setGroupCheck({ key: groupKey, status: 'checking' });
    const [ga, branch] = JSON.parse(groupKey);
    const timer = setTimeout(() => {
      api.get('/api/v1/groups/availability', { affiliation: ga, branch_name: branch }).then(({ data }) => {
        if (active) setGroupCheck({ key: groupKey, status: data.available ? 'available' : 'duplicate' });
      }).catch(() => { if (active) setGroupCheck({ key: groupKey, status: 'failed' }); });
    }, 300);
    return () => { active = false; clearTimeout(timer); };
  }, [groupKey, shouldCheckGroup]);

  useEffect(() => { onGroupCheckChange?.(groupStatus); }, [groupStatus, onGroupCheckChange]);
  useEffect(() => {
    let active = true;
    setOptions([]); setSearchError(false);
    if (!affiliation.trim() || disabled) return undefined;
    const timer = setTimeout(() => {
      api.get('/api/v1/ga-companies', { q: affiliation.trim() }).then(({ data }) => {
        if (active) setOptions([...new Set(data.map((item) => item.display_name))]);
      }).catch(() => { if (active) setSearchError(true); });
    }, 250);
    return () => { active = false; clearTimeout(timer); };
  }, [affiliation, disabled]);
  const change = (key, next) => onChange({ ...value, [key]: next });
  return <Stack spacing={2}>
    <Autocomplete freeSolo options={options} inputValue={affiliation} value={affiliation}
      disabled={disabled} filterOptions={(items) => items}
      onInputChange={(_, next) => change('affiliation', next)}
      onChange={(_, next) => change('affiliation', next || '')}
      renderInput={(params) => <TextField {...params} label="GA 소속" required
        inputProps={{ ...params.inputProps, maxLength: 100 }}
        helperText={searchError ? '자동완성을 불러오지 못했습니다. 회사명을 직접 입력해 주세요.' : '예: 현대홈쇼핑, 에이플러스 · 목록에 없는 회사도 직접 입력할 수 있습니다.'} />} />
    <TextField label={branchRequired ? "지점명" : "지점명 (선택)"} required={branchRequired} error={groupStatus === 'duplicate'} value={branchName} disabled={disabled}
      onChange={(event) => change('branch_name', event.target.value)}
      onFocus={() => setBranchFocused(true)} onBlur={() => setBranchFocused(false)}
      inputProps={{ maxLength: 150 }}
      helperText={branchFocused ? '지점명을 모르시면 활동 지역을 입력해 주세요. 예: 서울 강남, 부산' : '예: 강대한 지점, 브릿지 사업단'} />
    {branchRequired && groupStatus !== 'idle' && <Typography variant="caption" role="status" aria-live="polite" color={groupStatus === 'duplicate' ? 'error' : 'text.secondary'}>
      {{ checking: '같은 GA 소속·지점명의 조직이 있는지 확인 중입니다.',
        available: '등록 가능한 GA 소속·지점명입니다.',
        duplicate: '같은 GA 소속·지점명의 조직이 이미 등록되어 있거나 신청 중입니다.',
        failed: '중복 여부를 확인하지 못했습니다. 제출할 때 다시 확인합니다.' }[groupStatus]}
    </Typography>}
    <TextField label={nameLabel} required value={value[nameKey] || ''} disabled={disabled}
      onChange={(event) => change(nameKey, event.target.value)} inputProps={{ maxLength: 100, autoComplete: 'name' }} />
    <TextField label="전화번호" type="tel" required value={value[phoneKey] || ''} disabled={disabled}
      onChange={(event) => change(phoneKey, event.target.value)} inputProps={{ maxLength: 30, autoComplete: 'tel' }} helperText="연락받을 수 있는 전화번호를 입력해 주세요." />
  </Stack>;
}
