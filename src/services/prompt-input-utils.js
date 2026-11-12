export function fileTypeLabel(field) {
  return (field.file_types || ["pdf", "image", "html", "excel"]).map((type) => type === "image" ? "이미지" : type === "excel" ? "엑셀" : type.toUpperCase()).join(" / ");
}

export function fileAccept(field) {
  return (field.file_types || ["pdf", "image", "html", "excel"]).flatMap((type) => type === "excel" ? [".xlsx", ".xls"] : type === "html" ? [".html", ".htm"] : type === "image" ? [".jpg", ".jpeg", ".png", ".webp"] : [".pdf"]).join(",");
}

export function acceptsFile(field, file) {
  const extension = file.name.toLowerCase().split(".").pop();
  return (field.file_types || ["pdf", "image", "html", "excel"]).includes(["xlsx", "xls"].includes(extension) ? "excel" : extension === "htm" ? "html" : ["jpg", "jpeg", "png", "webp"].includes(extension) ? "image" : extension);
}

export function missingInputGroup(fields, values, uploads) {
  for (const group of new Set(fields.map((field) => field.required_group).filter(Boolean))) {
    const members = fields.filter((field) => field.required_group === group);
    if (!members.some((field) => field.type === "file" ? uploads[field.key]?.length : String(values[field.key] ?? "").trim())) {
      return `${members.map((field) => field.label).join(" / ")} 중 하나 이상 입력해 주세요.`;
    }
  }
  return "";
}
