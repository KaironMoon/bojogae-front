export function fileTypeLabel(field) {
  return (field.file_types || ["pdf", "image", "html"]).map((type) => type === "image" ? "이미지" : type.toUpperCase()).join(" / ");
}

export function fileAccept(field) {
  return (field.file_types || ["pdf", "image", "html"]).flatMap((type) => type === "html" ? [".html", ".htm"] : type === "image" ? [".jpg", ".jpeg", ".png", ".webp"] : [".pdf"]).join(",");
}

export function acceptsFile(field, file) {
  const extension = file.name.toLowerCase().split(".").pop();
  return (field.file_types || ["pdf", "image", "html"]).includes(extension === "htm" ? "html" : ["jpg", "jpeg", "png", "webp"].includes(extension) ? "image" : extension);
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
