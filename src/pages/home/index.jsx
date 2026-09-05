import { Box, Paper, Typography } from "@mui/material";

const Home = () => {
  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 2 }}>홈</Typography>
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
        <Typography color="text.secondary">보조개 서비스에 로그인되었습니다.</Typography>
      </Paper>
    </Box>
  );
};

export default Home;
