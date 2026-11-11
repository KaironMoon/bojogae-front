import { useEffect, useState } from "react";
import { Alert, Button, Snackbar } from "@mui/material";
import { useAuth } from "@/auth/AuthContext";
import {
  getInsurerPreferences,
  getInsurers,
  insurerError,
  saveInsurerPreference,
} from "@/services/insurer-service";
import { initialFilters, initialFor } from "./insurer-directory";
import DirectoryReference from "./design/DirectoryReference";
import CardReference from "./design/CardReference";
import RowReference from "./design/RowReference";
import InsurerDetail from "./design/InsurerDetail";
import { cardData } from "./design/data";
import "./design/utilities.css";
import "./design/source.css";
import "./design/integration.css";
function DirectoryWorkspace() {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("all");
  const [initial, setInitial] = useState("");
  const [view, setView] = useState("card");
  const [preferences, setPreferences] = useState({});
  const [preferenceStatus, setPreferenceStatus] = useState("loading");
  const [preferenceRetry, setPreferenceRetry] = useState(0);
  const [savingPreference, setSavingPreference] = useState(false);
  const [directory, setDirectory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [selected, setSelected] = useState(null);

  const [notice, setNotice] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(false);
    const timer = setTimeout(
      async () => {
        try {
          const result = await getInsurers(query.trim(), controller.signal);
          if (!controller.signal.aborted) setDirectory(result);
        } catch {
          if (!controller.signal.aborted) setError(true);
        } finally {
          if (!controller.signal.aborted) setLoading(false);
        }
      },
      query.trim() ? 250 : 0,
    );
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, retry]);

  useEffect(() => {
    const controller = new AbortController();
    getInsurerPreferences(controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        setPreferences(result);
        setPreferenceStatus("ready");
      })
      .catch(() => {
        if (!controller.signal.aborted) setPreferenceStatus("error");
      });
    return () => controller.abort();
  }, [preferenceRetry]);

  const preferenceDisabled = preferenceStatus !== "ready" || savingPreference;

  async function updatePreference(id, update) {
    if (preferenceDisabled) return;
    setSavingPreference(true);
    try {
      const result = await saveInsurerPreference(id, update);
      setPreferences((previous) => ({ ...previous, [id]: result }));
      if ("memo" in update)
        setNotice({ severity: "success", message: "메모를 저장했습니다." });
    } catch (error) {
      setNotice({ severity: "error", message: insurerError(error) });
    } finally {
      setSavingPreference(false);
    }
  }

  function toggleFavorite(id) {
    updatePreference(id, { favorite: !preferences[id]?.favorite });
  }

  function openDetails(insurer) {
    setNotice(null);
    setSelected(insurer);
  }

  function closeDetails() {
    setNotice(null);
    setSelected(null);
  }

  async function copy(value, label) {
    try {
      await navigator.clipboard.writeText(value);
      setNotice({ severity: "success", message: `${label} 복사 완료` });
    } catch {
      setNotice({
        severity: "error",
        message: "복사하지 못했습니다. 표시된 내용을 직접 복사해 주세요.",
      });
    }
  }

  const items = directory?.items || [];
  const counts = {
    ...directory?.counts,
    all: items.length,
    favorites: items.filter((item) => preferences[item.id]?.favorite).length,
  };
  const visible = items.filter(
    (item) =>
      (kind === "all" ||
        (kind === "favorites"
          ? preferences[item.id]?.favorite
          : item.kind === kind)) &&
      (!initial || initialFor(item) === initial),
  );

  const feedback = (
    <>
      {preferenceStatus === "error" && (
        <Alert
          severity="error"
          action={
            <Button
              onClick={() => {
                setPreferenceStatus("loading");
                setPreferenceRetry((v) => v + 1);
              }}
            >
              다시 시도
            </Button>
          }
        >
          즐겨찾기와 개인 메모를 불러오지 못했습니다.
        </Alert>
      )}
      {error && (
        <Alert
          severity="error"
          action={
            <Button onClick={() => setRetry((v) => v + 1)}>다시 시도</Button>
          }
        >
          보험사 정보를 불러오지 못했습니다.
        </Alert>
      )}
    </>
  );
  const itemVm = (insurer) => ({
    open: () => openDetails(insurer),
    toggle: () => toggleFavorite(insurer.id),
    disabled: preferenceDisabled,
    copy: (value) => {
      if (value && value !== "미확인") copy(value, "연락처");
    },
  });
  const vm = {
    kind,
    setKind,
    query,
    setQuery,
    view,
    setView,
    counts: loading || error ? {} : counts,
    visible,
    loading,
    feedback,
    initials: ["", ...initialFilters].map((letter) => (
      <button
        type="button"
        key={letter}
        aria-pressed={initial === letter}
        onClick={() => setInitial(letter)}
        className={`w-7 h-7 rounded-lg text-[11px] font-black shrink-0 ${initial === letter ? "bg-primary text-white" : "bg-[#f4f6f8] text-[#8b95a1] hover:text-primary"}`}
      >
        {letter || "전체"}
      </button>
    )),
    cards:
      !loading &&
      !error &&
      visible.map((insurer) => (
        <CardReference
          key={insurer.id}
          item={cardData(insurer, Boolean(preferences[insurer.id]?.favorite))}
          vm={itemVm(insurer)}
        />
      )),
    rows:
      !loading &&
      !error &&
      visible.map((insurer) => (
        <RowReference
          key={insurer.id}
          item={cardData(insurer, Boolean(preferences[insurer.id]?.favorite))}
          vm={itemVm(insurer)}
        />
      )),
    empty: loading ? (
      <p role="status" className="reference-empty">
        보험사 정보를 불러오는 중입니다.
      </p>
    ) : !error && !visible.length ? (
      <p className="ns-card reference-empty">
        {kind === "favorites" && !query && !initial
          ? "즐겨찾기한 보험사가 없습니다."
          : "검색 조건에 맞는 보험사가 없습니다."}
      </p>
    ) : null,
  };
  return (
    <>
      <div className="insurer-design insurer-reference-page">
        <DirectoryReference vm={vm} />
      </div>
      {selected && (
        <InsurerDetail
          key={selected.id}
          insurer={selected}
          favorite={Boolean(preferences[selected.id]?.favorite)}
          memo={preferences[selected.id]?.memo || ""}
          disabled={preferenceDisabled}
          close={closeDetails}
          toggle={() => toggleFavorite(selected.id)}
          save={(memo) => updatePreference(selected.id, { memo })}
          copy={copy}
          notice={notice}
        />
      )}{" "}
      {!selected && notice && (
        <Snackbar
          key={notice.message}
          open
          autoHideDuration={2700}
          onClose={() => setNotice(null)}
        >
          <Alert
            severity={notice.severity}
            variant="filled"
            onClose={() => setNotice(null)}
          >
            {notice.message}
          </Alert>
        </Snackbar>
      )}
    </>
  );
}
export default function InsurersPage() {
  const { user } = useAuth();
  return <DirectoryWorkspace key={user.id} />;
}
