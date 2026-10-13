/* eslint-disable react/prop-types */
import { Box, IconButton, List, ListItem, ListItemText, Paper, Stack, Tooltip, Typography } from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import RemoveRoundedIcon from "@mui/icons-material/RemoveRounded";
import ArrowUpwardRoundedIcon from "@mui/icons-material/ArrowUpwardRounded";
import ArrowDownwardRoundedIcon from "@mui/icons-material/ArrowDownwardRounded";

export default function CommonPromptSelector({ items, value, disabled, onChange }) {
  function move(index, offset) {
    const next = [...value];
    [next[index], next[index + offset]] = [next[index + offset], next[index]];
    onChange(next);
  }
  const available = items.filter(item => !value.includes(item.id));
  return (
    <Box>
      <Typography variant="subtitle1" fontWeight={700}>공통 프롬프트</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>본문 뒤에 적용 목록의 순서대로 추가합니다. 공통 본문을 수정하면 다음 실행부터 반영됩니다.</Typography>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
        <Paper variant="outlined" sx={{ flex: 1, minWidth: 0, p: 1.5 }}>
          <Typography fontWeight={600}>사용 가능</Typography>
          <List>
            {available.map(item => (
              <ListItem key={item.id} disableGutters secondaryAction={
                <IconButton disabled={disabled} aria-label={`${item.title} 적용`} onClick={() => onChange([...value, item.id])}><AddRoundedIcon /></IconButton>
              }>
                <Tooltip title={item.body}><ListItemText primary={item.title} primaryTypographyProps={{ sx: { overflowWrap: "anywhere" } }} /></Tooltip>
              </ListItem>
            ))}
          </List>
          {!available.length && <Typography variant="body2" color="text.secondary">추가할 공통 프롬프트가 없습니다.</Typography>}
        </Paper>
        <Typography aria-hidden="true" sx={{ alignSelf: "center", fontSize: 24 }}>↔</Typography>
        <Paper variant="outlined" sx={{ flex: 1, minWidth: 0, p: 1.5 }}>
          <Typography fontWeight={600}>적용 순서 ({value.length}/5)</Typography>
          <List>
            {value.map((id, index) => {
              const item = items.find(row => row.id === id);
              const title = item?.title || "삭제된 공통 프롬프트";
              return (
                <ListItem key={id} disableGutters sx={{ display: "flex", gap: 1 }}>
                  <Tooltip title={item?.body || "적용 목록에서 제외해 주세요."}>
                    <ListItemText primary={`${index + 1}. ${title}`} primaryTypographyProps={{ sx: { overflowWrap: "anywhere" } }} />
                  </Tooltip>
                  <Stack direction="row" flexShrink={0}>
                    <IconButton size="small" disabled={disabled || index === 0} aria-label={`${title} 위로`} onClick={() => move(index, -1)}><ArrowUpwardRoundedIcon fontSize="small" /></IconButton>
                    <IconButton size="small" disabled={disabled || index === value.length - 1} aria-label={`${title} 아래로`} onClick={() => move(index, 1)}><ArrowDownwardRoundedIcon fontSize="small" /></IconButton>
                    <IconButton size="small" disabled={disabled} aria-label={`${title} 제외`} onClick={() => onChange(value.filter(itemId => itemId !== id))}><RemoveRoundedIcon fontSize="small" /></IconButton>
                  </Stack>
                </ListItem>
              );
            })}
          </List>
          {!value.length && <Typography variant="body2" color="text.secondary">공통 프롬프트 없이 개별 본문만 사용합니다.</Typography>}
        </Paper>
      </Stack>
    </Box>
  );
}
