// 기존 이름 필드(150자)와 호환하며 GA·지점 원문은 각각 별도 필드로 전달합니다.
export const groupDisplayName = ({ affiliation = '', branch_name = '' }) =>
  [affiliation.trim(), (branch_name || '').trim()].filter(Boolean).join(' · ').slice(0, 150);
