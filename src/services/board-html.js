import DOMPurify from "dompurify";

const BLOCKED_TAGS = ["script", "style", "iframe", "object", "embed", "form", "input", "button", "video", "audio"];
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
const BOARD_IMAGE_SRC = /^(?:https?:\/\/[^/\s]+)?(\/api\/v1\/board-images\/[a-f0-9]{32})$/;

// 서버에 저장된 게시판 이미지만 남기고, 개발 환경처럼 API 주소가 다를 때는 절대 주소로 바꾼다.
export function sanitizeBoardHtml(html) {
  const clean = DOMPurify.sanitize(html || "", { FORBID_TAGS: BLOCKED_TAGS, FORBID_ATTR: ["srcset"] });
  const container = document.createElement("div");
  container.innerHTML = clean;
  container.querySelectorAll("img").forEach((image) => {
    const match = (image.getAttribute("src") || "").match(BOARD_IMAGE_SRC);
    if (!match) {
      image.remove();
      return;
    }
    image.setAttribute("src", `${API_BASE_URL}${match[1]}`);
    image.setAttribute("loading", "lazy");
  });
  container.querySelectorAll("a[href]").forEach((anchor) => {
    anchor.setAttribute("target", "_blank");
    anchor.setAttribute("rel", "noopener noreferrer nofollow");
  });
  return container.innerHTML;
}

export function plainTextToHtml(text) {
  const escape = (value) => value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return (text || "").split("\n").map((line) => `<p>${line ? escape(line) : "<br>"}</p>`).join("");
}

export function htmlHasText(html) {
  const container = document.createElement("div");
  container.innerHTML = DOMPurify.sanitize(html || "");
  if (container.querySelector("img")) return true;
  return Boolean(container.textContent.replace(/\u00a0/g, " ").trim());
}
