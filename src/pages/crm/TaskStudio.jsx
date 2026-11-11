import { useEffect, useState } from "react";
import { Alert, Dialog, Drawer } from "@mui/material";
import { crmGet, crmPost, crmPut, crmError } from "@/services/crm-service";
import { LocationFields, emptyLocation } from "./CrmShared";
import { localDateTime } from "./crm-utils";
import TaskReference from "./task-design/TaskReference";
import TaskEditorReference from "./task-design/TaskEditorReference";
import TaskDrawerReference from "./task-design/TaskDrawerReference";
import TaskRows from "./task-design/TaskRows";
import TaskEvents from "./task-design/TaskEvents";
import "./task-design/task-utilities.css";
import "./task-design/task-source.css";
import "./task-design/task-integration.css";
const labels = {
  CALL: "재통화",
  VISIT: "방문상담",
  DOCUMENT: "제안·리포트",
  REVIEW: "이벤트케어",
  OTHER: "기타 업무",
};
const payload = (form) => ({
  customer_id: Number(form.customer_id),
  contract_id: form.contract_id || null,
  kind: form.kind,
  title: form.title.trim(),
  note: form.note,
  due_date: form.due_date,
  due_at: form.time ? `${form.due_date}T${form.time}:00+09:00` : null,
  status: form.status,
  location: form.location || emptyLocation(),
});
const errorMessage = (e) =>
  e.response?.data?.detail === "crm_event_expired"
    ? "고객·계약 정보가 변경되었습니다. 화면을 새로 불러와 주세요."
    : crmError(e);
export default function TaskStudio() {
  const customerId = new URLSearchParams(window.location.search).get(
    "customer_id",
  );
  const [data, setData] = useState(null),
    [scope, setScope] = useState(customerId ? "ALL" : "TODAY"),
    [kind, setKind] = useState("ALL"),
    [query, setQuery] = useState(""),
    [search, setSearch] = useState(""),
    [eventFilter, setEventFilter] = useState("ALL"),
    [revision, setRevision] = useState(0);
  const [customers, setCustomers] = useState([]),
    [quick, setQuick] = useState({
      kind: "CALL",
      customer_id: customerId || "",
      title: "",
      time: "",
    }),
    [item, setItem] = useState(null),
    [form, setForm] = useState(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [removing, setRemoving] = useState(false),
    [guide, setGuide] = useState(false);
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [scope, kind, search, customerId]);
  useEffect(() => {
    const timer = setTimeout(() => setSearch(query.trim()), 250);
    return () => clearTimeout(timer);
  }, [query]);
  useEffect(() => {
    let active = true;
    setData(null);
    crmGet("/tasks/workspace", {
      scope,
      kind,
      page,
      q: search,
      customer_id: customerId || undefined,
    })
      .then((result) => {
        if (active) setData(result);
      })
      .catch((e) => {
        if (active) setError(errorMessage(e));
      });
    return () => {
      active = false;
    };
  }, [scope, kind, search, customerId, revision, page]);
  const customerQuery = form?.customerQuery || "";
  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      crmGet("/customers", { q: customerQuery, page_size: 100 })
        .then((result) => {
          if (active) setCustomers(result.items);
        })
        .catch((e) => {
          if (active) setError(errorMessage(e));
        });
    }, 200);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [customerQuery]);
  const run = async (action) => {
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
      setRevision((r) => r + 1);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  const close = () => {
    if (!busy) {
      setForm(null);
      setItem(null);
      setRemoving(false);
      setError("");
    }
  };
  const openCreate = () => {
    setItem(null);
    setError("");
    setNotice("");
    setForm({
      customerQuery: "",
      customer_id: customerId || "",
      kind: "CALL",
      title: "",
      note: "",
      due_date: data.today,
      time: "",
      status: "PENDING",
      location: emptyLocation(),
    });
  };
  const open = (item) => {
    setItem(item);
    setError("");
    setNotice("");
    setForm({
      ...item,
      customerQuery: "",
      time: item.due_at ? localDateTime(item.due_at).slice(11, 16) : "",
    });
  };
  const save = (event) => {
    event.preventDefault();
    run(async () => {
      if (item)
        await crmPut(`/tasks/${item.id}`, {
          ...payload(form),
          version: item.version,
        });
      else await crmPost("/tasks", payload(form));
      setForm(null);
      setItem(null);
      setNotice("일정을 저장했습니다.");
    });
  };
  const action = (target, command) =>
    run(async () => {
      await crmPost(`/tasks/${target.id}/action`, {
        version: target.version,
        command,
      });
      setForm(null);
      setItem(null);
      setRemoving(false);
      setNotice(
        command === "ARCHIVE" ? "일정을 삭제했습니다." : "일정을 변경했습니다.",
      );
    });
  const add = (keys) =>
    run(async () => {
      const result = await crmPost("/tasks/events", { keys });
      setNotice(`${result.created}건의 자동 이벤트를 할 일로 등록했습니다.`);
    });
  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setNotice("연락처를 복사했습니다.");
    } catch {
      setError("클립보드 권한을 확인해 주세요.");
    }
  };
  const feedback = (
    <>
      {error && <Alert severity="error">{error}</Alert>}
      {notice && (
        <Alert severity="success" onClose={() => setNotice("")}>
          {notice}
        </Alert>
      )}
    </>
  );
  const vm = {
    busy,
    data,
    scope,
    setScope,
    kind,
    setKind,
    query,
    setQuery,
    eventFilter,
    setEventFilter,
    quick,
    setQuick,
    customers,
    openCreate,
    addAll: () =>
      add(data.events.filter((e) => !e.registered).map((e) => e.key)),
    quickSave: (e) => {
      e.preventDefault();
      if (!data) return;
      run(async () => {
        await crmPost(
          "/tasks",
          payload({
            ...quick,
            due_date: data.today,
            note: "",
            status: "PENDING",
          }),
        );
        setQuick({ ...quick, title: "" });
        setNotice("오늘 할 일을 등록했습니다.");
      });
    },
    feedback: !form && feedback,
    events: data ? (
      <TaskEvents
        items={data.events.filter(
          (e) => eventFilter === "ALL" || e.category === eventFilter,
        )}
        busy={busy}
        onAdd={add}
        onCopy={copy}
        onGuide={() => setGuide(true)}
      />
    ) : (
      <p role="status">자동 이벤트를 불러오는 중…</p>
    ),
    rows: data ? (
      <>
        <TaskRows
          items={data.items}
          busy={busy}
          onOpen={open}
          onAction={action}
          onCopy={copy}
        />
        {(data.total > 50 || page > 1) && (
          <div className="task-pagination">
            <button
              disabled={page <= 1 || busy}
              onClick={() => setPage((p) => p - 1)}
            >
              이전
            </button>
            <span>
              {page} / {Math.max(1, Math.ceil(data.total / 50))}
            </span>
            <button
              disabled={page * 50 >= data.total || busy}
              onClick={() => setPage((p) => p + 1)}
            >
              다음
            </button>
          </div>
        )}
      </>
    ) : (
      <p role="status" className="p-4">
        {error ? "목록을 불러오지 못했습니다." : "일정을 불러오는 중…"}
      </p>
    ),
  };
  const editorVm = form
    ? {
        busy,
        form,
        item,
        customers,
        close,
        submit: save,
        feedback,
        kindLabel: labels[form.kind],
        setField: (key, value) => setForm((f) => ({ ...f, [key]: value })),
        preset: (kind, title) => setForm((f) => ({ ...f, kind, title })),
        searchCustomers: () =>
          setForm((f) => ({ ...f, customerQuery: f.customerQuery.trim() })),
        action: (command) => action(item, command),
        remove: () => setRemoving(true),
        guide: () => setGuide(true),
        location:
          form.kind === "VISIT" ? (
            <div className="task-location">
              <LocationFields
                value={form.location || emptyLocation()}
                onChange={(location) => setForm((f) => ({ ...f, location }))}
              />
            </div>
          ) : null,
      }
    : null;
  return (
    <>
      <div className="task-design task-page">
        <TaskReference vm={vm} />
      </div>
      <Dialog
        open={Boolean(form && !item)}
        onClose={close}
        maxWidth={false}
        aria-labelledby=":rnn:"
        slotProps={{ paper: { className: "task-design task-modal" } }}
      >
        {form && !item && <TaskEditorReference vm={editorVm} />}
      </Dialog>
      <Drawer
        anchor="right"
        open={Boolean(form && item)}
        onClose={close}
        slotProps={{ paper: { className: "task-design task-drawer" } }}
      >
        {form && item && <TaskDrawerReference vm={editorVm} />}
      </Drawer>
      <Dialog
        open={removing}
        onClose={() => !busy && setRemoving(false)}
        slotProps={{ paper: { className: "task-design task-confirm" } }}
      >
        <h2>일정 삭제</h2>
        <div className="p-5 space-y-4">
          <p>‘{item?.title}’ 일정을 삭제할까요?</p>
          {error && <Alert severity="error">{error}</Alert>}
          <div className="flex justify-end gap-2">
            <button
              className="px-4 py-2 border rounded-xl"
              disabled={busy}
              onClick={() => setRemoving(false)}
            >
              취소
            </button>
            <button
              className="px-4 py-2 rounded-xl bg-[#f04452] text-white"
              disabled={busy}
              onClick={() => action(item, "ARCHIVE")}
            >
              삭제
            </button>
          </div>
        </div>
      </Dialog>
      <Dialog
        open={guide}
        onClose={() => setGuide(false)}
        slotProps={{ paper: { className: "task-design task-confirm" } }}
      >
        <h2>보조개톡 발송 안내</h2>
        <div className="p-5 space-y-4">
          <p>
            웹에서 보조개톡을 실행하는 기능은 준비 중입니다. Windows 보조개톡
            앱에서 고객을 선택해 발송해 주세요.
          </p>
          <button
            className="px-4 py-2 bg-[#121314] text-white rounded-xl"
            onClick={() => setGuide(false)}
          >
            확인
          </button>
        </div>
      </Dialog>
    </>
  );
}
