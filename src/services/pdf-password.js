let pdfLibrary;

const isPdfFile = (file) => /\.pdf$/i.test(file?.name || "");
const PDF_READ_ERROR = "PDF를 읽지 못했습니다. 파일을 확인하고 다시 첨부해 주세요.";

export function preloadPdfLibrary() {
  pdfLibrary ||= Promise.all([
    import("pdfjs-dist"),
    import("pdfjs-dist/build/pdf.worker.min.mjs?url"),
  ])
    .then(([pdf, worker]) => {
      pdf.GlobalWorkerOptions.workerSrc = worker.default;
      return pdf;
    })
    .catch((error) => {
      pdfLibrary = null;
      throw error;
    });
  return pdfLibrary;
}

// Parse locally: no upload, rendering, or password guessing during selection.
export async function needsPdfPassword(file) {
  const { getDocument } = await preloadPdfLibrary();
  const task = getDocument({ data: new Uint8Array(await file.arrayBuffer()), isEvalSupported: false });
  try {
    return await new Promise((resolve, reject) => {
      task.onPassword = () => resolve(true);
      task.promise.then(() => resolve(false), reject);
    });
  } finally {
    await task.destroy().catch(() => {});
  }
}

export function createPdfPasswordTracker(inspectFn = needsPdfPassword) {
  const states = new Map();
  const inFlight = new Map();

  const stateFor = (file) => states.get(file) || (isPdfFile(file) ? { checking: true, password: "" } : {});

  const setPassword = (file, password) => {
    const current = stateFor(file);
    states.set(file, { ...current, password, serverError: "" });
  };

  const setFileError = (file, message) => {
    const current = stateFor(file);
    states.set(file, { ...current, encrypted: true, serverError: message });
  };

  const inspect = (file, onUpdate) => {
    if (!isPdfFile(file)) return Promise.resolve({});
    const existing = states.get(file);
    if (existing && !existing.checking) return Promise.resolve(existing);
    if (inFlight.has(file)) return inFlight.get(file);

    if (!existing) {
      states.set(file, { checking: true, password: "" });
    }
    const promise = Promise.resolve()
      .then(() => inspectFn(file))
      .then(
        (encrypted) => {
          const latest = states.get(file) || { password: "" };
          const next = { ...latest, checking: false, encrypted: Boolean(encrypted) };
          states.set(file, next);
          onUpdate?.();
          return next;
        },
        () => {
          const next = { checking: false, error: PDF_READ_ERROR };
          states.set(file, next);
          onUpdate?.();
          return next;
        },
      )
      .finally(() => {
        inFlight.delete(file);
      });

    inFlight.set(file, promise);
    return promise;
  };

  const prune = (files) => {
    const keep = new Set(files.filter(isPdfFile));
    for (const file of states.keys()) {
      if (!keep.has(file)) states.delete(file);
    }
  };

  const ensureChecked = async (files, onUpdate) => {
    const pdfs = files.filter(isPdfFile);
    await Promise.all(pdfs.map((file) => inspect(file, onUpdate)));
    return new Map(pdfs.map((file) => [file, stateFor(file)]));
  };

  return { stateFor, setPassword, setFileError, inspect, prune, ensureChecked };
}
