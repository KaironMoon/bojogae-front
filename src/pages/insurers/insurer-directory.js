export const external = { target: "_blank", rel: "noopener noreferrer" };
export const categories = [
  { value: "all", label: "전체 기관" },
  { value: "favorites", label: "즐겨찾기" },
  { value: "non_life", label: "손해보험" },
  { value: "life", label: "생명보험" },
  { value: "other", label: "공제·우체국·기타" },
];
export const kindLabel = { life: "생명보험", non_life: "손해보험", other: "공제·기타" };

const initials = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ";
export const initialFilters = [..."ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎ"];
const doubledInitials = { ㄲ: "ㄱ", ㄸ: "ㄷ", ㅃ: "ㅂ", ㅆ: "ㅅ", ㅉ: "ㅈ" };
const latinInitials = {
  A: "ㅇ", B: "ㅂ", C: "ㅅ", D: "ㄷ", E: "ㅇ", F: "ㅇ", G: "ㅈ", H: "ㅇ", I: "ㅇ",
  J: "ㅈ", K: "ㅋ", L: "ㅇ", M: "ㅇ", N: "ㅇ", O: "ㅇ", P: "ㅍ", Q: "ㅋ", R: "ㅇ",
  S: "ㅇ", T: "ㅌ", U: "ㅇ", V: "ㅂ", W: "ㄷ", X: "ㅇ", Y: "ㅇ", Z: "ㅈ",
};
const initialOverrides = { "non-life-aig": "ㅇ", "non-life-axa": "ㅇ", "life-aia": "ㅇ", "other-the-k": "ㄷ" };

export function initialFor(insurer) {
  const name = insurer.name.trim().normalize("NFC");
  const first = name.charCodeAt(0) - 0xac00;
  const extracted = first >= 0 && first < 11172 ? initials[Math.floor(first / 588)] : latinInitials[name[0]?.toUpperCase()];
  const initial = insurer.initial_consonant || initialOverrides[insurer.id] || extracted;
  return doubledInitials[initial] || initial;
}

const colors = {
  kb: "#D97706", samsung: "#0052A4", hyundai: "#F37321", db: "#00843D", meritz: "#E60012",
  hanwha: "#F37321", shinhan: "#0046FF", heungkuk: "#C80064", lina: "#0072CE", kyobo: "#5B113B",
  aia: "#D31145", nh: "#009A44", lotte: "#E51A36", hana: "#008485", miraeasset: "#F58220",
  dongyang: "#006DAA", chubb: "#245B9B", post: "#D33139", mg: "#0091CF", cu: "#0082BF",
};

export function ciColor(insurer) {
  return /^#[\da-f]{6}$/i.test(insurer.ci_color) ? insurer.ci_color : colors[insurer.id.split("-").at(-1)] || "#03C75A";
}

export const videos = [
  ["모바일 팩스 청구 영상", "https://youtu.be/-FSahEayni4"],
  ["PC 청구 가이드 영상", "https://youtu.be/bvClY68_mpI"],
];

export const institutions = [
  ["건강e음", "5년 진료기록 열람", "https://www.hira.or.kr/rb/diag/selectMyDiagInfmList.do?pgmid=HIRAA070001000600"],
  ["심평원 비급여 진료비 조회", "병원별 비급여 비용 비교", "https://www.hira.or.kr/npay/index.do"],
  ["내보험찾아줌", "숨은보험금 확인", "https://cont.insure.or.kr/cont_web/intro.do"],
  ["손해보험협회 공시실", "손해보험 상품 공시", "https://kpub.knia.or.kr/"],
  ["생명보험협회 공시실", "생명보험 상품 공시", "https://pub.insure.or.kr"],
];

const contactLabels = ["고객센터", "인콜 모니터링", "전산 헬프데스크", "보험금 청구 팩스"];
const linkLabels = ["공식 홈페이지", "보험금 청구 안내", "약관 확인", "보험금 청구양식", "치아보험 청구양식"];

export function contactsFor(insurer) {
  const entries = [{ ...insurer.customer_service, label: contactLabels[0] }, ...(insurer.contacts || [])];
  const primary = contactLabels.map(label => entries.find(entry => entry.label === label) || { label });
  return [...primary, ...entries.filter(entry => !primary.includes(entry))];
}

export function linksFor(insurer) {
  const entries = [{ ...insurer.website, label: linkLabels[0] }, { ...insurer.claim, label: linkLabels[1] }, ...(insurer.links || [])];
  const primary = linkLabels.map(label => entries.find(entry => entry.label === label) || { label });
  return [...primary, ...entries.filter(entry => !primary.includes(entry))];
}

export function portalFor(insurer) {
  return insurer.systems.find(system => /GA|교차/i.test(system.link.label))
    || insurer.systems.find(system => !/\bLC\b|전속/i.test(system.link.label));
}

export function sourcesFor(insurer) {
  const entries = [
    ["홈페이지", insurer.website], ["로고", insurer.logo], ["브라우저", insurer.browser],
    ["고객센터", insurer.customer_service], ["청구 안내", insurer.claim],
    ...[...insurer.contacts, ...insurer.links, ...insurer.card_payment, ...insurer.notes].map(entry => [entry.label, entry]),
  ];
  for (const system of insurer.systems) {
    entries.push([system.link.label, system.link], ["브라우저", system.browser],
      ["프로그램", system.security_program], ["로그인", system.login]);
  }

  const grouped = new Map();
  for (const [label, evidence] of entries) {
    if (!evidence?.source_url) continue;
    const key = `${evidence.source_url}|${evidence.checked_at}`;
    if (!grouped.has(key)) grouped.set(key, { ...evidence, labels: new Set() });
    grouped.get(key).labels.add(label);
  }
  return [...grouped.values()].map(entry => ({ ...entry, label: [...entry.labels].join(" · ") }));
}
