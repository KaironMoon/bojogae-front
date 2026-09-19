/* eslint-disable react/prop-types */
import { useState } from "react";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import { Box, Chip, Collapse, List, ListItemButton, ListItemText, Stack, Typography } from "@mui/material";

function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function CategoryBranch({ name, description, nested = false, children }) {
  const [expanded, setExpanded] = useState(true);
  return (
    <Box>
      <ListItemButton onClick={() => setExpanded((value) => !value)} aria-expanded={expanded} sx={{ pl: nested ? 4 : 2 }}>
        <ListItemText
          primary={<Typography fontWeight={nested ? 400 : 750}>{name}</Typography>}
          secondary={description}
        />
        <ExpandMoreRoundedIcon fontSize="small" sx={{ ml: 1, color: "text.secondary", transform: expanded ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 150ms" }} />
      </ListItemButton>
      <Collapse in={expanded}>{children}</Collapse>
    </Box>
  );
}

function PromptCategoryList({ prompts, categories, selectedId, onSelect }) {
  const assignedIds = new Set();
  const groups = categories.map((root) => {
    const children = (root.children || []).map((child) => {
      const items = prompts.filter((prompt) => (prompt.categories || []).some((category) => category.id === child.id));
      items.forEach((prompt) => assignedIds.add(prompt.id));
      return { ...child, items };
    }).filter((child) => child.items.length);
    return { ...root, children, count: new Set(children.flatMap((child) => child.items.map((prompt) => prompt.id))).size };
  }).filter((root) => root.children.length);
  const unassigned = prompts.filter((prompt) => !assignedIds.has(prompt.id));

  const renderPrompts = (items, nested = true) => (
    <List disablePadding>
      {items.map((prompt) => (
        <ListItemButton
          key={prompt.id}
          selected={selectedId === prompt.id}
          onClick={() => onSelect(prompt.id)}
          sx={{ pl: nested ? 6 : 4, opacity: prompt.is_deleted ? 0.62 : 1 }}
        >
          <ListItemText
            sx={{ minWidth: 0 }}
            primary={(
              <Stack direction="row" gap={1} alignItems="center">
                <Typography title={prompt.title} noWrap sx={{ fontSize: 14, flex: 1, minWidth: 0 }}>{prompt.title}</Typography>
                {prompt.is_default_favorite && <Chip label="기본" size="small" color="primary" variant="outlined" />}
                {prompt.is_deleted && <Chip label="삭제됨" size="small" />}
              </Stack>
            )}
            secondary={`v${prompt.current_version_no} · ${formatDate(prompt.updated_at)}`}
          />
        </ListItemButton>
      ))}
    </List>
  );

  return (
    <Box>
      {groups.map((root) => (
        <CategoryBranch
          key={root.id}
          name={`${root.name} (#${root.sort_order})`}
          description={`소분류 ${root.children.length}개 · 프롬프트 ${root.count}개`}
        >
          {root.children.map((child) => (
            <CategoryBranch
              key={child.id}
              nested
              name={`${child.name} (#${child.sort_order})`}
              description={`프롬프트 ${child.items.length}개`}
            >
              {renderPrompts(child.items)}
            </CategoryBranch>
          ))}
        </CategoryBranch>
      ))}
      {unassigned.length > 0 && (
        <CategoryBranch name="미분류" description={`프롬프트 ${unassigned.length}개`}>
          {renderPrompts(unassigned, false)}
        </CategoryBranch>
      )}
    </Box>
  );
}

export default PromptCategoryList;
