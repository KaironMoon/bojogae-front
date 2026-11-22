import { useCallback, useEffect, useRef, useState } from "react";
import { createPdfPasswordTracker, preloadPdfLibrary } from "@/services/pdf-password";

export default function usePdfPasswords(files) {
  const trackerRef = useRef(null);
  if (!trackerRef.current) {
    trackerRef.current = createPdfPasswordTracker();
  }
  const mountedRef = useRef(true);
  const [, setRevision] = useState(0);

  const notify = useCallback(() => {
    if (mountedRef.current) {
      setRevision((value) => value + 1);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    preloadPdfLibrary().catch(() => {});
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const tracker = trackerRef.current;
    tracker.prune(files);
    for (const file of files) {
      tracker.inspect(file, notify);
    }
  }, [files, notify]);

  const stateFor = useCallback((file) => trackerRef.current.stateFor(file), []);

  const setPassword = useCallback((file, password) => {
    trackerRef.current.setPassword(file, password);
    notify();
  }, [notify]);

  const setFileError = useCallback((file, message) => {
    trackerRef.current.setFileError(file, message);
    notify();
  }, [notify]);

  const ensureChecked = useCallback(
    (targetFiles) => trackerRef.current.ensureChecked(targetFiles, notify),
    [notify],
  );

  return { stateFor, setPassword, setFileError, ensureChecked };
}
