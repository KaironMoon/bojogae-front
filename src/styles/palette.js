// Shared with the Windows sender's apricot theme.
export const brand = {
  accent: "#E88068",
  accentHover: "#DE745D",
  accentInk: "#9B4532",
  tint: "#FCEDE7",
  tintHover: "#F8E1D7",
  canvas: "#FBF8F5",
  ink: "#352F2D",
  muted: "#7D716A",
  line: "#EBE2DC",
  disabled: "#F0EBE7",
  deep: "#763827",
};

export const brandCssVariables = Object.fromEntries(
  Object.entries(brand).map(([key, value]) => [
    `--bojogae-${key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)}`,
    value,
  ]),
);
