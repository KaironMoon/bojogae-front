import { useEffect, useState } from "react";
import { previewTemplate } from "@/services/kakao-template-service";
export default function useTemplatePreview(payload, revision = 0) {
  const key = JSON.stringify({ payload, revision });
  const [state, setState] = useState({ key: "", text: "", error: "" });
  useEffect(() => {
    const controller = new AbortController();
    const value = JSON.parse(key).payload;
    if (!value.text.trim()) {
      setState({ key, text: "", error: "" });
      return () => controller.abort();
    }
    const timer = setTimeout(() => {
      previewTemplate(value, controller.signal)
        .then((data) => {
          if (!controller.signal.aborted)
            setState({ key, text: data.text, error: "" });
        })
        .catch((error) => {
          if (!controller.signal.aborted)
            setState({
              key,
              text: "",
              error:
                typeof error.response?.data?.detail === "string" &&
                error.response.status === 422
                  ? error.response.data.detail
                  : "미리보기를 불러오지 못했습니다. 서버 업데이트 상태를 확인해 주세요.",
            });
        });
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [key]);
  return {
    preview: state.key === key ? state.text : "",
    previewError: state.key === key ? state.error : "",
    previewBusy: Boolean(payload.text.trim()) && state.key !== key,
  };
}
