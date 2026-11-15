import api from "@/services/api-caller";

const publicPath = "/api/v1/talk/releases";
const adminPath = "/api/v1/admin/talk/releases";

export const talkReleaseFiles = [
  { kind: "installer", label: "설치형", extension: "EXE", description: "설치 마법사를 따라 보조개톡을 설치합니다." },
  { kind: "portable", label: "무설치형", extension: "ZIP", description: "압축을 모두 푼 뒤 bojogaetalk.exe를 실행합니다." },
];

export async function listTalkReleases({ admin = false, signal } = {}) {
  const response = await api.get(admin ? adminPath : publicPath, {}, { signal });
  return response.data;
}

export function talkDownloadUrl(id, kind) {
  return `${api.baseUrl.replace(/\/$/, "")}${publicPath}/${id}/${kind}`;
}

export async function saveTalkRelease(draft, id) {
  const fields = { notes: draft.notes, is_public: draft.is_public };
  if (id) return (await api.patch(`${adminPath}/${id}`, fields)).data;
  const form = new FormData();
  form.set("version", draft.version.trim());
  form.set("notes", fields.notes);
  form.set("is_public", String(fields.is_public));
  for (const { kind } of talkReleaseFiles) form.set(kind, draft[kind]);
  return (await api.post(adminPath, form, { timeout: 180000 })).data;
}

export function talkReleaseError(error) {
  const messages = {
    talk_release_schema_required: "보조개톡 배포 DB 설정이 필요합니다.",
    talk_version_exists: "이미 등록된 버전입니다. 다른 버전 번호를 입력해 주세요.",
    invalid_talk_file_type: "설치형 EXE와 무설치형 ZIP을 확인해 주세요.",
    invalid_talk_installer: "Windows 설치 실행 파일(EXE)을 선택해 주세요.",
    invalid_talk_portable: "bojogaetalk.exe와 support 폴더가 들어 있는 무설치형 ZIP을 선택해 주세요.",
    talk_file_too_large: "파일당 최대 50 MiB까지 등록할 수 있습니다.",
    talk_release_not_found: "등록된 버전을 찾을 수 없습니다.",
  };
  return messages[error.response?.data?.detail] || "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.";
}

const dateFormat = new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeZone: "Asia/Seoul" });

export function formatTalkReleaseDate(date) {
  return dateFormat.format(new Date(date));
}

export function formatTalkFileSize(bytes) {
  return bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MiB`
    : `${Math.ceil(bytes / 1024)} KiB`;
}
