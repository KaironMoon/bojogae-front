import apiCaller from "@/services/api-caller";


async function getTemplateDemoDefaults() {
  const response = await apiCaller.get("/api/v1/admin/template-demo/defaults");
  return response.data;
}

async function runTemplateDemo({ pdf, prompt, shellHtml, contentTemplate, jsonSchema }) {
  const form = new FormData();
  form.append("pdf", pdf);
  form.append("prompt", prompt);
  form.append("shell_html", shellHtml);
  form.append("content_template", contentTemplate);
  form.append("json_schema", jsonSchema);
  const response = await apiCaller.post("/api/v1/admin/template-demo/run", form, {
    headers: { "content-type": "multipart/form-data" },
    timeout: 600000,
  });
  return response.data;
}

async function previewTemplateDemo({ shellHtml, contentTemplate, sampleData }) {
  const form = new FormData();
  form.append("shell_html", shellHtml);
  form.append("content_template", contentTemplate);
  form.append("sample_data", sampleData);
  const response = await apiCaller.post("/api/v1/admin/template-demo/preview", form, {
    headers: { "content-type": "multipart/form-data" },
  });
  return response.data;
}

export { getTemplateDemoDefaults, previewTemplateDemo, runTemplateDemo };
