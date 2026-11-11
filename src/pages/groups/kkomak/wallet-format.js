export const number = value => Number.isFinite(value) ? value.toLocaleString('ko-KR') : '—';
export const amount = value => Number.isFinite(value) ? `${number(value)}꼬막` : '조회 불가';
export const date = value => value ? new Date(value).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }) : '만료일 없음';
export function reportCount(wallet) {
  if (wallet.report_count_min == null) return '—';
  return wallet.report_count_min === wallet.report_count_max ? number(wallet.report_count_min) : `${number(wallet.report_count_min)}~${number(wallet.report_count_max)}`;
}
export function reportCost(wallet) {
  if (wallet.report_cost_min == null) return '문서 유형별 꼬막 차감';
  return `문서 1건 = ${wallet.report_cost_min === wallet.report_cost_max ? number(wallet.report_cost_min) : `${number(wallet.report_cost_min)}~${number(wallet.report_cost_max)}`}꼬막 · 유료 문서 기준`;
}
