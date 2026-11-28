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

function cleanCellLabel(text) {
  return String(text || "").replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

function extractTableBlock(tableEl) {
  const rowsAll = Array.from(tableEl.querySelectorAll("tr"));
  const hasMerge = rowsAll.some((tr) =>
    Array.from(tr.cells).some((cell) => cell.colSpan > 1 || cell.rowSpan > 1),
  );

  if (hasMerge || rowsAll.length === 0) {
    return {
      type: "table",
      kind: "scroll",
      tableHtml: tableEl.outerHTML,
      headers: [],
      rows: [],
    };
  }

  const theadRow = tableEl.querySelector("thead tr");
  const firstRow = rowsAll[0];
  const firstRowAllTh = firstRow && firstRow.cells.length > 0 && Array.from(firstRow.cells).every((c) => c.tagName === "TH");

  if (theadRow || firstRowAllTh) {
    const headerRowEl = theadRow || firstRow;
    const headers = Array.from(headerRowEl.cells).map((cell) => cleanCellLabel(cell.textContent));
    const bodyRows = rowsAll
      .filter((tr) => tr !== headerRowEl)
      .map((tr) => Array.from(tr.cells).map((cell) => cell.innerHTML))
      .filter((cells) => cells.length > 0);
    return {
      type: "table",
      kind: bodyRows.length > 0 && headers.length > 0 ? "columns" : "scroll",
      tableHtml: tableEl.outerHTML,
      headers,
      rows: bodyRows,
    };
  }

  const isKeyValue = rowsAll.every(
    (tr) => tr.cells.length === 2 && tr.cells[0].tagName === "TH" && tr.cells[1].tagName === "TD",
  );
  if (isKeyValue) {
    const kvRows = rowsAll.map((tr) => ({
      label: cleanCellLabel(tr.cells[0].textContent),
      html: tr.cells[1].innerHTML,
    }));
    return {
      type: "table",
      kind: "kv",
      tableHtml: tableEl.outerHTML,
      headers: [],
      rows: kvRows,
    };
  }

  return {
    type: "table",
    kind: "scroll",
    tableHtml: tableEl.outerHTML,
    headers: [],
    rows: [],
  };
}

function splitNodeByTables(node, blocks) {
  if (node.nodeType === 1 && node.tagName === "TABLE") {
    blocks.push(extractTableBlock(node));
    return;
  }
  if (node.nodeType === 1 && node.querySelector("table")) {
    let bufferHtml = "";
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === 1 && (child.tagName === "TABLE" || child.querySelector("table"))) {
        if (bufferHtml.trim()) {
          blocks.push({ type: "html", html: bufferHtml });
          bufferHtml = "";
        }
        splitNodeByTables(child, blocks);
      } else {
        bufferHtml += child.nodeType === 1 ? child.outerHTML : child.textContent;
      }
    }
    if (bufferHtml.trim()) {
      blocks.push({ type: "html", html: bufferHtml });
    }
    return;
  }
  const chunk = node.nodeType === 1 ? node.outerHTML : node.textContent;
  if (chunk && chunk.trim()) {
    const last = blocks[blocks.length - 1];
    if (last?.type === "html") {
      last.html += chunk;
    } else {
      blocks.push({ type: "html", html: chunk });
    }
  }
}

export function parseBoardContentBlocks(sanitizedHtml) {
  const container = document.createElement("div");
  container.innerHTML = sanitizedHtml || "";

  const images = [];
  container.querySelectorAll("img").forEach((img) => {
    const src = img.getAttribute("src") || "";
    if (!src) return;
    const index = images.length;
    images.push({
      src,
      alt: img.getAttribute("alt") || "",
    });
    img.setAttribute("data-board-img-index", String(index));
    img.classList.add("board-zoomable-img");
  });

  const blocks = [];
  for (const child of Array.from(container.childNodes)) {
    splitNodeByTables(child, blocks);
  }

  return { blocks, images };
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

export function extractFirstExternalLink(html) {
  if (!html) return null;
  const container = document.createElement("div");
  container.innerHTML = DOMPurify.sanitize(html, { FORBID_TAGS: BLOCKED_TAGS });
  for (const anchor of container.querySelectorAll("a[href]")) {
    const href = (anchor.getAttribute("href") || "").trim();
    if (/^https?:\/\//i.test(href)) {
      return {
        href,
        text: anchor.textContent.replace(/\u00a0/g, " ").trim() || href,
      };
    }
  }
  return null;
}
