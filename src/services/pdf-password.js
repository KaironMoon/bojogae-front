let pdfLibrary;

const isPdfFile = (file) => /\.pdf$/i.test(file?.name || "");
const PDF_READ_ERROR = "PDF를 읽지 못했습니다. 파일을 확인하고 다시 첨부해 주세요.";
const PDF_HEADER = [0x25, 0x50, 0x44, 0x46, 0x2d]; // %PDF-

export function hasPdfHeader(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.length < PDF_HEADER.length) return false;
  const limit = Math.min(bytes.length - PDF_HEADER.length, 1024);
  for (let offset = 0; offset <= limit; offset += 1) {
    if (
      bytes[offset] === PDF_HEADER[0]
      && bytes[offset + 1] === PDF_HEADER[1]
      && bytes[offset + 2] === PDF_HEADER[2]
      && bytes[offset + 3] === PDF_HEADER[3]
      && bytes[offset + 4] === PDF_HEADER[4]
    ) {
      return true;
    }
  }
  return false;
}

function isCorruptPdfError(error) {
  return error?.name === "InvalidPDFException" || error?.name === "FormatError";
}

function isWorkerLoadError(error) {
  const message = String(error?.message || "");
  return /worker/i.test(message) || /dynamically imported module|failed to fetch|loading chunk/i.test(message);
}

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
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!hasPdfHeader(bytes)) {
    throw new Error("invalid_pdf_header");
  }
  let pdf;
  try {
    pdf = await preloadPdfLibrary();
  } catch {
    // 워커·라이브러리 로드 실패는 파일 자체 손상이 아니므로 제출 시 백엔드 검증에 맡긴다.
    return false;
  }
  const task = pdf.getDocument({ data: bytes, isEvalSupported: false });
  try {
    return await new Promise((resolve, reject) => {
      task.onPassword = () => resolve(true);
      task.promise.then(
        () => resolve(false),
        (error) => {
          if (!isCorruptPdfError(error) && isWorkerLoadError(error)) {
            resolve(false);
            return;
          }
          reject(error);
        },
      );
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
