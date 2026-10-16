import { useEffect, useState } from "react";
import { needsPdfPassword } from "@/services/pdf-password";

const isPdf = (file) => /\.pdf$/i.test(file.name);

export default function usePdfPasswords(files) {
  const [states, setStates] = useState(new Map());
  useEffect(() => {
    let active = true;
    const pdfs = files.filter(isPdf);
    setStates((current) => new Map(pdfs.map((file) => [file, current.get(file) || { checking: true, password: "" }])));
    for (const file of pdfs) {
      if (states.has(file) && !states.get(file).checking) continue;
      needsPdfPassword(file).then(
        (encrypted) => {
          if (active) setStates((current) => new Map(current).set(file, { ...current.get(file), checking: false, encrypted }));
        },
        () => {
          if (active) setStates((current) => new Map(current).set(file, { checking: false, error: "PDF를 읽지 못했습니다. 파일을 확인하고 다시 첨부해 주세요." }));
        },
      );
    }
    return () => { active = false; };
    // Only selection changes trigger inspection; typing a password must not reparse PDFs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files]);

  const stateFor = (file) => states.get(file) || (isPdf(file) ? { checking: true } : {});
  const setPassword = (file, password) => setStates((current) => new Map(current).set(file, {
    ...current.get(file), password, serverError: "",
  }));
  const setFileError = (file, message) => setStates((current) => new Map(current).set(file, {
    ...current.get(file), encrypted: true, serverError: message,
  }));
  return { stateFor, setPassword, setFileError };
}
