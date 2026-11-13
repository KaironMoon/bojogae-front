export const loginBackground =
  "radial-gradient(circle at 15% 20%, rgba(3, 199, 90, .18), transparent 34%), radial-gradient(circle at 85% 80%, rgba(107, 56, 251, .20), transparent 30%), var(--bojogae-canvas)";

export const loginCardSx = {
  width: "100%",
  p: { xs: 2.5, sm: 4 },
  border: "1px solid",
  borderColor: "divider",
  borderRadius: 4,
  boxShadow: "0 24px 70px rgba(31, 45, 61, .10)",
};

export const loginTabsSx = {
  mb: 1,
  "& .MuiTab-root": { minWidth: 0, px: 0.5, wordBreak: "keep-all", fontSize: { xs: 12, sm: 14 } },
};

export const loginProviders = [
  {
    id: "google",
    name: "Google",
    mark: "G",
    background: "#ffffff",
    color: "#202124",
    border: "#dadce0",
    markColor: "#4285f4",
  },
  {
    id: "kakao",
    name: "카카오",
    mark: "K",
    background: "#fee500",
    color: "#191919",
    border: "#fee500",
    markColor: "#191919",
  },
  {
    id: "naver",
    name: "네이버",
    mark: "N",
    background: "#03A94D",
    color: "#ffffff",
    border: "#03A94D",
    markColor: "#ffffff",
  },
];
