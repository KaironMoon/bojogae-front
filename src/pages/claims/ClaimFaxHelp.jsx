import { useState } from 'react';
import { ClickAwayListener, IconButton, Tooltip } from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

export default function ClaimFaxHelp() {
  const [open, setOpen] = useState(false);
  return <ClickAwayListener onClickAway={() => setOpen(false)}>
    <span><Tooltip open={open} disableHoverListener disableFocusListener disableTouchListener
      title="다운로드 혹은 공유하기를 눌러 모바일 팩스로 발송하면 무료로 발송할수 있습니다">
      <IconButton size="small" aria-label="모바일 팩스 무료 발송 안내" aria-expanded={open}
        onPointerEnter={event => { if (event.pointerType === 'mouse') setOpen(true); }}
        onPointerLeave={event => { if (event.pointerType === 'mouse') setOpen(false); }}
        onFocus={() => setOpen(true)} onBlur={() => setOpen(false)}
        onKeyDown={event => { if (event.key === 'Escape') setOpen(false); }}
        onClick={() => setOpen(true)}><HelpOutlineIcon fontSize="small" /></IconButton>
    </Tooltip></span>
  </ClickAwayListener>;
}
