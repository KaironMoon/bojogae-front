import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Box, CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import ClaimPdfPreview from '@/pages/claims/ClaimPdfPreview';

// eslint-disable-next-line react-refresh/only-export-components
function PreviewCheck() {
  const [file, setFile] = useState(null);
  return <Box sx={{ p: 2, maxWidth: 900, mx: 'auto' }}>
    <label>검증할 PDF <input type="file" accept="application/pdf" onChange={event => setFile(event.target.files[0] || null)} /></label>
    {file && <ClaimPdfPreview blob={file} name={file.name} />}
  </Box>;
}

createRoot(document.getElementById('root')).render(<ThemeProvider theme={createTheme()}><CssBaseline /><PreviewCheck /></ThemeProvider>);
