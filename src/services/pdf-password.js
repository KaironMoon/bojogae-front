let pdfLibrary;

// Parse locally: no upload, rendering, or password guessing during selection.
export async function needsPdfPassword(file) {
  pdfLibrary ||= Promise.all([
    import("pdfjs-dist"),
    import("pdfjs-dist/build/pdf.worker.min.mjs?url"),
  ]).then(([pdf, worker]) => {
    pdf.GlobalWorkerOptions.workerSrc = worker.default;
    return pdf;
  });
  const { getDocument } = await pdfLibrary;
  const task = getDocument({ data: new Uint8Array(await file.arrayBuffer()), isEvalSupported: false });
  try {
    return await new Promise((resolve, reject) => {
      task.onPassword = () => resolve(true);
      task.promise.then(() => resolve(false), reject);
    });
  } finally {
    await task.destroy();
  }
}
