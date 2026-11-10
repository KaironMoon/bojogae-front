export const reportGradient = "linear-gradient(135deg, #03C75A 0%, #00A84B 50%, #008A60 100%)";

export const reportHero = {
  position: "relative",
  isolation: "isolate",
  overflow: "hidden",
  color: "#00100A",
  background: reportGradient,
  boxShadow: "0 10px 24px -4px rgba(3, 199, 90, 0.38), 0 4px 10px -2px rgba(3, 199, 90, 0.2)",
  "&:hover": { background: reportGradient, filter: "brightness(1.06)" },
  "&.Mui-focusVisible": { outline: "2px solid #006E43", outlineOffset: 2 },
  "&::after": {
    content: '""', position: "absolute", inset: 0, zIndex: -1, pointerEvents: "none",
    background: "linear-gradient(115deg, transparent 32%, #fff7 50%, transparent 68%)",
    transform: "translateX(-100%)", animation: "nsShine 3.8s ease-in-out infinite",
  },
  "&.Mui-disabled": {
    background: "#E6EAEE", color: "#586674", boxShadow: "none",
    "&::after": { animation: "none" },
  },
  "@keyframes nsShine": { "0%, 18%": { transform: "translateX(-100%)" }, "64%, 100%": { transform: "translateX(100%)" } },
  "@media (prefers-reduced-motion: reduce)": { "&::after": { animation: "none" } },
};

export const reportHeroIcon = {
  width: 28, height: 28, borderRadius: "10px", display: "grid",
  placeItems: "center", bgcolor: "#FFFFFF60", flexShrink: 0,
};

export const reportHeroBadge = {
  fontSize: 9, fontWeight: 900, letterSpacing: ".04em", lineHeight: 1.4,
  px: 0.5, borderRadius: 0.75, bgcolor: "#FFFFFF90", whiteSpace: "nowrap",
};
