/* eslint-disable react/prop-types */
import { useState } from "react";
import { Alert, Box, Button, Checkbox, Divider, FormControlLabel, MenuItem, Paper, Stack, TextField, Typography } from "@mui/material";
import PromptInputForm from "@/pages/components/PromptInputForm";

const TYPES = { file: "파일 (PDF / HTML)", text: "텍스트", number: "숫자", select: "선택 목록" };

export default function InputSchemaEditor({ value = [], onChange, disabled }) {
  const [preview, setPreview] = useState(false);
  const [previewValues, setPreviewValues] = useState({});
  const [previewUploads, setPreviewUploads] = useState({});
  const update = (index, patch) => onChange(value.map((field, i) => i === index ? { ...field, ...patch } : field));
  const move = (index, offset) => {
    const next = [...value];
    [next[index], next[index + offset]] = [next[index + offset], next[index]];
    onChange(next);
  };
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack spacing={2}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography fontWeight={750}>입력 UI 설정</Typography>
          <Button size="small" onClick={() => setPreview(!preview)}>{preview ? "설정 편집" : "화면 미리보기"}</Button>
        </Stack>
        <Alert severity="info">
          문서 만들기에서 받을 자료를 순서대로 추가하세요. 설정이 없으면 기본 PDF 업로드를 사용합니다.
          항목 키와 이름은 입력값·PDF 구분과 함께 LLM에 전달됩니다. 본문에서 해당 키를 언급해 활용 방법을 지시할 수 있습니다.
        </Alert>
        {preview ? <PromptInputForm fields={value} values={previewValues} uploads={previewUploads}
          onValue={(key, next) => setPreviewValues({ ...previewValues, [key]: next })}
          onFiles={(key, next) => setPreviewUploads({ ...previewUploads, [key]: next })} /> : <>
          {value.map((field, index) => (
            <Box key={index} sx={{ border: 1, borderColor: "divider", borderRadius: 1, p: 1.5 }}>
              <Stack spacing={1.5}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography variant="body2" sx={{ flex: 1 }}>항목 {index + 1}</Typography>
                  <Button size="small" disabled={disabled || index === 0} onClick={() => move(index, -1)}>위로</Button>
                  <Button size="small" disabled={disabled || index === value.length - 1} onClick={() => move(index, 1)}>아래로</Button>
                  <Button size="small" color="error" disabled={disabled} onClick={() => onChange(value.filter((_, i) => i !== index))}>삭제</Button>
                </Stack>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                  <TextField size="small" fullWidth label="항목 이름" value={field.label} disabled={disabled} onChange={(e) => update(index, { label: e.target.value })} inputProps={{ maxLength: 100 }} />
                  <TextField size="small" fullWidth label="항목 키" helperText="영문 소문자로 시작, 숫자·밑줄 허용" value={field.key} disabled={disabled} onChange={(e) => update(index, { key: e.target.value })} inputProps={{ maxLength: 50 }} />
                  <TextField select size="small" fullWidth label="입력 방식" value={field.type} disabled={disabled} onChange={(e) => update(index, { type: e.target.value, required_group: ["file", "text"].includes(e.target.value) ? field.required_group || "" : "" })}>
                    {Object.entries(TYPES).map(([key, label]) => <MenuItem key={key} value={key}>{label}</MenuItem>)}
                  </TextField>
                </Stack>
                <TextField size="small" label="도움말" value={field.help} disabled={disabled} onChange={(e) => update(index, { help: e.target.value })} inputProps={{ maxLength: 500 }} />
                {field.type === "select" && <TextField size="small" multiline minRows={2} label="선택지 (한 줄에 하나)" value={(field.options || []).join("\n")} disabled={disabled} onChange={(e) => update(index, { options: e.target.value.split("\n") })} />}
                {field.type === "file" && <TextField select size="small" label="허용 파일 형식" value={(field.file_types || ["pdf"]).join(",")} disabled={disabled} onChange={(e) => update(index, { file_types: e.target.value.split(",") })}>
                  <MenuItem value="pdf">PDF</MenuItem><MenuItem value="html">HTML</MenuItem><MenuItem value="pdf,html">PDF / HTML</MenuItem>
                </TextField>}
                {field.type === "file" && <TextField select size="small" label="최대 파일 개수" value={field.max_files} disabled={disabled} onChange={(e) => update(index, { max_files: Number(e.target.value) })}>
                  {[1, 2, 3, 4, 5].map((count) => <MenuItem key={count} value={count}>{count}개</MenuItem>)}
                </TextField>}
                <FormControlLabel control={<Checkbox checked={field.required} disabled={disabled} onChange={(e) => update(index, { required: e.target.checked, required_group: e.target.checked ? "" : field.required_group || "" })} />} label="필수 입력" />
                {["file", "text"].includes(field.type) && <TextField size="small" label="하나 이상 필수 그룹" value={field.required_group || ""} disabled={disabled || field.required}
                  helperText="대체 가능한 항목 두 개 이상에 같은 영문 키를 입력하세요. 예: proposal_source. 개별 필수는 해제하세요."
                  onChange={(e) => update(index, { required_group: e.target.value })} />}
              </Stack>
            </Box>
          ))}
          <Button variant="outlined" disabled={disabled || value.length >= 20} onClick={() => {
            let number = value.length + 1;
            while (value.some((field) => field.key === `field_${number}`)) number += 1;
            onChange([...value, { key: `field_${number}`, label: "", type: "text", required: false, help: "", options: [], max_files: 1 }]);
          }}>입력 항목 추가 ({value.length}/20)</Button>
        </>}
        <Divider />
        <Typography variant="caption" color="text.secondary">입력 UI를 변경하고 저장하면 새 프롬프트 버전이 생성됩니다. 버전 복원 시 입력 UI도 함께 복원됩니다.</Typography>
      </Stack>
    </Paper>
  );
}
