export const brand = {
  accent: "#03C75A",
  accentHover: "#00A84B",
  accentInk: "#006E43",
  tint: "#ECFDF5",
  tintHover: "#D1FAE5",
  canvas: "#F4F6F8",
  ink: "#17232E",
  muted: "#53616E",
  line: "#E6EAEE",
  disabled: "#E6EAEE",
  deep: "#075A3E",
};

export const brandCssVariables = Object.fromEntries(
  Object.entries(brand).map(([key, value]) => [
    `--bojogae-${key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)}`,
    value,
  ]),
);
