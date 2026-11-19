const fields = {
  "[소속]": ["affiliation", "소속"], "현대홈쇼핑 GA": ["affiliation", "소속"],
  "[지점]": ["branch_name", "지점"], "강대한지점": ["branch_name", "지점"],
  "[이름]": ["name", "이름"], "김성춘": ["name", "이름"],
  "[전화번호]": ["phone", "전화번호"], "010-9729-9649": ["phone", "전화번호"],
};
const placeholders = /(?<!\[)\[(?:소속|지점|이름|전화번호)\](?!\])/g;
const examplesAndPlaceholders = /현대홈쇼핑 GA|강대한지점|김성춘|010-9729-9649|(?<!\[)\[(?:소속|지점|이름|전화번호)\](?!\])/g;
const pattern = (options) => options.examples === false ? placeholders : examplesAndPlaceholders;

export class SignatureProfileError extends Error {
  constructor(message) { super(message); this.name = "SignatureProfileError"; }
}

export function hasSignatureFields(text, options = {}) {
  return [...text.matchAll(pattern(options))].length > 0;
}

export function personalizeSignature(text, profile, options = {}) {
  const missing = [...new Set([...text.matchAll(pattern(options))].flatMap(([token]) => {
    const [field, label] = fields[token];
    return typeof profile?.[field] === "string" && profile[field].trim() ? [] : [label];
  }))];
  if (missing.length) throw new SignatureProfileError(`${missing.join("·")} 정보가 없습니다. 내 정보에 등록한 뒤 다시 넣어 주세요.`);
  return text.replace(pattern(options), (token) => profile[fields[token][0]].trim());
}
