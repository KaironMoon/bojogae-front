import api from "@/services/api-caller";
const base = "/api/v1/crm";
export const crmGet = async (path, params, config) =>
  (await api.get(base + path, params, config)).data;
export const crmPost = async (path, data, config) =>
  (await api.post(base + path, data, config)).data;
export const crmPut = async (path, data) =>
  (await api.put(base + path, data)).data;
export const crmDelete = async (path) => (await api.delete(base + path)).data;
export const attachmentUrl = (id) =>
  `${api.baseUrl}${base}/attachments/${id}/download`;
export const crmUpload = async (file, target) => {
  const data = new FormData();
  data.append("file", file);
  Object.entries(target).forEach(([key, value]) => {
    if (value) data.append(key, value);
  });
  return crmPost("/attachments", data);
};
const errors = {
  crm_schema_required:
    "고객·계약관리 DB 준비가 필요합니다. 작성된 SQL의 적용 여부를 확인해 주세요.",
  crm_unavailable: "고객·계약관리가 현재 비활성화되어 있습니다.",
  crm_not_found: "항목을 찾을 수 없거나 접근 권한이 없습니다.",
  crm_version_conflict:
    "다른 곳에서 수정한 내용이 있습니다. 새로고침한 뒤 다시 확인해 주세요.",
  crm_record_archived: "보관된 항목에는 새 기록을 추가할 수 없습니다.",
  crm_contract_customer_mismatch: "이 고객에게 연결된 계약을 선택해 주세요.",
  crm_origin_immutable: "기존 보험·신규 계약 등록 구분은 변경할 수 없습니다.",
  crm_use_status_event: "계약 상태와 성립일은 상태 변경에서 수정해 주세요.",
  crm_invalid_transition:
    "허용되지 않는 상태 변경입니다. 정정이 필요하면 정정 항목을 선택해 주세요.",
  crm_place_search_unavailable:
    "장소명 검색 설정이 준비되지 않았습니다. 검색 API 키와 백엔드 재시작 여부를 확인해 주세요.",
  crm_place_search_budget_exhausted:
    "장소명 검색의 무료 사용 한도에 도달했습니다. 주소 입력이나 지도 선택을 이용해 주세요.",
  crm_map_address_filter_required:
    "조회할 주소가 50개를 넘습니다. 상담 단계·태그·보험사 등의 조건을 좁혀 주세요.",
  crm_maps_unavailable:
    "지도 설정이 준비되지 않았습니다. 주소 입력과 목록은 계속 사용할 수 있습니다.",
  crm_map_budget_exhausted:
    "지도 검색 사용 한도에 도달했습니다. 잠시 후 다시 확인해 주세요.",
  crm_maps_provider_error:
    "주소 검색을 완료하지 못했습니다. 주소를 확인해 주세요.",
  crm_narrow_search: "검색 대상이 많습니다. 반경이나 필터를 좁혀 주세요.",
  crm_attachment_size: "첨부파일은 10MB 이하로 선택해 주세요.",
  crm_attachment_type: "PDF, PNG, JPG 파일만 첨부할 수 있습니다.",
  crm_import_review_required:
    "가져올 내용을 검토한 뒤 확인 항목을 선택해 주세요.",
  crm_import_file_size: "2MB 이하의 파일을 선택해 주세요.",
  crm_import_file_type: "엑셀(.xlsx), CSV 또는 지원되는 표 파일을 선택해 주세요.",
  crm_import_invalid_file: "파일을 읽지 못했습니다. 내려받은 양식으로 작성한 엑셀 또는 CSV 파일인지 확인해 주세요.",
  crm_import_invalid_headers: "첫 줄의 항목명이 비어 있거나 중복되었습니다. 양식의 항목명을 유지해 주세요.",
  crm_import_formula_unsupported: "엑셀 수식은 가져올 수 없습니다. 수식 결과를 값으로 붙여넣은 뒤 올려 주세요.",
  crm_import_html_unsupported:
    "지원하는 고객 데이터 형식이 없습니다. 표를 탭 구분 텍스트로 붙여넣어 주세요.",
  crm_import_row_limit: "한 번에 1~5,000행을 가져올 수 있습니다.",
};
export function crmError(error) {
  const detail = error.response?.data?.detail;
  if (Array.isArray(detail))
    return detail
      .map((v) => `${v.loc?.slice(1).join(".")}: ${v.msg}`)
      .join(" / ");
  return (
    errors[detail] ||
    (error.response?.status === 422
      ? "입력한 항목을 확인해 주세요."
      : "처리하지 못했습니다. 잠시 후 다시 시도해 주세요.")
  );
}
