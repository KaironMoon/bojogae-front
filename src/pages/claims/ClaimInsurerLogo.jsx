/* eslint-disable react/prop-types */
import { Box } from '@mui/material';

export default function ClaimInsurerLogo({ insurer }) {
  const logo = insurer.logo;
  if (!logo) return null;
  return <Box component="svg" viewBox={logo.view_box} aria-hidden="true"
    sx={{ width: 76, height: 30, flexShrink: 0 }}>
    <image href={logo.path} width={logo.width} height={logo.height} />
  </Box>;
}
