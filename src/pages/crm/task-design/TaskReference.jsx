/* eslint-disable react/prop-types */
// Copied from the task HTML reference; controller supplies real data and actions.
import TemplateIcon from "./TaskIcon";
export default function TaskReference({ vm }) {
  return (
    <div className="max-w-[1340px] w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-5 pb-24">
      <div id="viewScheduleWorkspace" className="space-y-3.5">
        {vm.feedback}

        <div className="MuiStack-root css-1r40e5 ns-card p-4 bg-white flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="MuiBox-root css-0 space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded-full bg-primary-soft text-primary border border-emerald-200 text-[11px] font-black">
                TODAY&#39;S ACTION & AUTO EVENT RADAR
              </span>
              <span className="px-2 py-0.5 rounded-full bg-sub-soft text-sub text-[11px] font-extrabold">
                내고객 · 내계약 이벤트(생일·상령일·면책/감액종료) 자동 수집
              </span>
            </div>
            <div className="flex items-center gap-3 flex-wrap pt-0.5">
              <h5 className="MuiTypography-root MuiTypography-h5 css-j405rk text-xl sm:text-2xl font-black text-[#121314] tracking-tight">
                할 일·방문 일정
              </h5>
              <p className="MuiTypography-root MuiTypography-body1 css-119vns2 text-xs sm:text-[13px] font-semibold text-[#334155]">
                고객·계약에서 등록한 업무를 함께 확인합니다.{" "}
                <span className="text-primary font-extrabold">
                  (오늘의 생일·상령일·면책/감액 종료 이벤트가 상단에 자동
                  노출됩니다)
                </span>
              </p>
            </div>
          </div>

          <div className="MuiStack-root css-kvb41a flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              className="px-3.5 py-2 rounded-xl bg-sub-soft hover:bg-purple-100 text-sub border border-purple-200 text-xs font-black flex items-center gap-1.5 transition-all"
              disabled={vm.busy || !vm.data?.events.some((e) => !e.registered)}
              onClick={vm.addAll}
            >
              <TemplateIcon name="sparkles" className="w-3.5 h-3.5" />
              <span>자동 이벤트 전체 할 일로 등록</span>
            </button>

            <button
              tabIndex="0"
              type="button"
              className="MuiButtonBase-root MuiButton-root MuiButton-contained MuiButton-containedPrimary MuiButton-sizeMedium css-15diaom ns-hero-cta px-4 py-2 rounded-xl text-white text-xs font-black flex items-center gap-1.5 shadow-sm"
              disabled={vm.busy || !vm.data}
              onClick={vm.openCreate}
            >
              <TemplateIcon name="calendar-plus" className="w-3.5 h-3.5" />
              <span>업무·방문 일정 등록</span>
              <span className="MuiTouchRipple-root css-4mb1j7"></span>
            </button>
          </div>
        </div>

        <div className="ns-card p-3.5 sm:p-4 bg-gradient-to-br from-[#ecfdf5] via-[#f8fafc] to-[#f5f3ff] border border-[#03c75a]/35 space-y-2.5 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 border-b border-[#cbd5e1]/50 pb-2.5">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-[#03c75a] text-white flex items-center justify-center shrink-0 shadow-xs">
                <TemplateIcon name="bell-ring" className="w-4 h-4" />
              </span>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h6 className="text-sm sm:text-[15px] font-black text-[#121314] tracking-tight">
                    오늘 & 이번 주 놓치면 안 될 자동 고객 이벤트
                  </h6>
                  <span
                    id="autoEventTotalBadge"
                    className="px-2 py-0.5 rounded-full bg-[#121314] text-emerald-400 text-[11px] font-black"
                  >{`총 ${vm.data?.events.length ?? "—"}건 자동 감지`}</span>
                  <span className="text-[11.5px] font-bold text-[#475569] hidden xl:inline">
                    · 내고객/내계약 기준 골든타임 원클릭 할 일 등록
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 flex-wrap">
              <button
                type="button"
                id="evFilter_ALL"
                className={
                  "px-2.5 py-1 rounded-lg bg-[#121314] text-white text-[11.5px] font-black shadow-2xs transition-all" +
                  (vm.eventFilter === "ALL" ? " task-filter-active" : "")
                }
                disabled={vm.busy}
                onClick={() => vm.setEventFilter("ALL")}
                aria-pressed={vm.eventFilter === "ALL"}
              >
                {"\uc804\uccb4 \uc774\ubca4\ud2b8 (" +
                  (vm.data?.events.length ?? "—") +
                  ")"}
              </button>
              <button
                type="button"
                id="evFilter_BIRTHDAY"
                className={
                  "px-2.5 py-1 rounded-lg bg-white hover:bg-rose-50 text-[#e11d48] border border-rose-200 text-[11.5px] font-extrabold transition-all" +
                  (vm.eventFilter === "BIRTHDAY" ? " task-filter-active" : "")
                }
                disabled={vm.busy}
                onClick={() => vm.setEventFilter("BIRTHDAY")}
                aria-pressed={vm.eventFilter === "BIRTHDAY"}
              >
                {"\ud83c\udf82 \uc0dd\uc77c (" +
                  (vm.data?.events.filter((e) => e.category === "BIRTHDAY")
                    .length ?? "—") +
                  ")"}
              </button>
              <button
                type="button"
                id="evFilter_SANGNYEONG"
                className={
                  "px-2.5 py-1 rounded-lg bg-white hover:bg-amber-50 text-[#b45309] border border-amber-300 text-[11.5px] font-extrabold transition-all" +
                  (vm.eventFilter === "SANGNYEONG" ? " task-filter-active" : "")
                }
                disabled={vm.busy}
                onClick={() => vm.setEventFilter("SANGNYEONG")}
                aria-pressed={vm.eventFilter === "SANGNYEONG"}
              >
                {"\ud83d\udcc8 \uc0c1\ub839\uc77c (" +
                  (vm.data?.events.filter((e) => e.category === "SANGNYEONG")
                    .length ?? "—") +
                  ")"}
              </button>
              <button
                type="button"
                id="evFilter_EXEMPTION"
                className={
                  "px-2.5 py-1 rounded-lg bg-white hover:bg-emerald-50 text-[#00913f] border border-emerald-300 text-[11.5px] font-extrabold transition-all" +
                  (vm.eventFilter === "EXEMPTION" ? " task-filter-active" : "")
                }
                disabled={vm.busy}
                onClick={() => vm.setEventFilter("EXEMPTION")}
                aria-pressed={vm.eventFilter === "EXEMPTION"}
              >
                {"\ud83d\udee1\ufe0f \uba74\ucc45\uc885\ub8cc (" +
                  (vm.data?.events.filter((e) => e.category === "EXEMPTION")
                    .length ?? "—") +
                  ")"}
              </button>
              <button
                type="button"
                id="evFilter_REDUCTION"
                className={
                  "px-2.5 py-1 rounded-lg bg-white hover:bg-purple-50 text-[#5b21b6] border border-purple-200 text-[11.5px] font-extrabold transition-all" +
                  (vm.eventFilter === "REDUCTION" ? " task-filter-active" : "")
                }
                disabled={vm.busy}
                onClick={() => vm.setEventFilter("REDUCTION")}
                aria-pressed={vm.eventFilter === "REDUCTION"}
              >
                {"\ud83c\udf89 \uac10\uc561\uc885\ub8cc (" +
                  (vm.data?.events.filter((e) => e.category === "REDUCTION")
                    .length ?? "—") +
                  ")"}
              </button>
            </div>
          </div>

          <div
            id="autoEventsGridContainer"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5"
          >
            {vm.events}
          </div>
        </div>

        <div className="ns-card p-3 bg-white border-2 border-[#03c75a]/40">
          <form
            onSubmit={vm.quickSave}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
          >
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary-soft text-primary font-black text-xs shrink-0">
              <TemplateIcon name="zap" className="w-3.5 h-3.5" />
              <span>빠른 할 일 등록</span>
            </div>

            <select
              id="quickInlineType"
              className="px-2.5 py-1.5 rounded-xl border border-[#d1d6db] bg-[#f8fafc] text-xs font-extrabold text-[#121314] outline-none shrink-0"
              value={vm.quick.kind}
              onChange={(e) =>
                vm.setQuick({ ...vm.quick, kind: e.target.value })
              }
              aria-label="quickInlineType"
            >
              <option value="CALL">📞 재통화</option>
              <option value="VISIT">🚗 방문상담</option>
              <option value="DOCUMENT">📄 제안서·리포트</option>
              <option value="REVIEW">🎁 증권·사후관리</option>
              <option value="OTHER">📌 개인업무</option>
            </select>

            <select
              id="quickInlineCustomer"
              className="px-2.5 py-1.5 rounded-xl border border-[#d1d6db] bg-[#f8fafc] text-xs font-bold text-[#121314] outline-none shrink-0"
              value={vm.quick.customer_id}
              onChange={(e) =>
                vm.setQuick({ ...vm.quick, customer_id: e.target.value })
              }
              aria-label="quickInlineCustomer"
              required
            >
              <option value="">고객 선택</option>
              {vm.customers.map((c) => (
                <option value={c.id} key={c.id}>
                  {c.name}
                  {c.alias ? ` (${c.alias})` : ""} ·{" "}
                  {c.phone || "연락처 미등록"}
                </option>
              ))}
            </select>

            <input
              type="text"
              id="quickInlineTitle"
              placeholder="오늘 해야 할 업무 제목을 입력하고 Enter를 누르세요 (예: 오후 2시 암보험 리모델링 리포트 발송 후 통화)"
              className="flex-1 px-3 py-1.5 rounded-xl border border-[#d1d6db] focus:border-primary text-xs font-bold text-[#121314] outline-none"
              maxLength="200"
              value={vm.quick.title}
              onChange={(e) =>
                vm.setQuick({ ...vm.quick, title: e.target.value })
              }
              aria-label="quickInlineTitle"
              required
            />

            <input
              type="time"
              id="quickInlineTime"
              value={vm.quick.time}
              className="px-2.5 py-1.5 rounded-xl border border-[#d1d6db] bg-[#f8fafc] text-xs font-mono font-bold text-[#121314] outline-none shrink-0"
              onChange={(e) =>
                vm.setQuick({ ...vm.quick, time: e.target.value })
              }
              aria-label="quickInlineTime"
            />

            <button
              type="submit"
              className="px-3.5 py-1.5 rounded-xl bg-[#121314] hover:bg-primary text-white text-xs font-black shrink-0 transition-colors"
              disabled={vm.busy}
            >
              + 즉시 추가
            </button>
          </form>
        </div>

        <div className="ns-card p-3.5 bg-white space-y-2.5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            <button
              id="scopeCard_TODAY"
              className="cursor-pointer p-3 rounded-xl border-2 border-primary bg-primary-soft/50 flex items-center justify-between transition-all"
              onClick={() => vm.setScope("TODAY")}
              aria-pressed={vm.scope === "TODAY"}
              type="button"
            >
              <div>
                <div className="text-[11.5px] font-extrabold text-primary">{`오늘 할 일 (${vm.data?.today || "—"})`}</div>
                <div className="text-base sm:text-lg font-black text-[#121314] mt-0.5">
                  <span id="kpiTodayCount">{vm.data?.counts.TODAY ?? "—"}</span>
                  건
                </div>
              </div>
              <span className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center">
                <TemplateIcon name="sun" className="w-4 h-4" />
              </span>
            </button>

            <button
              id="scopeCard_UPCOMING"
              className="cursor-pointer p-3 rounded-xl border border-[#e6eaee] bg-[#f8fafc] hover:border-sub flex items-center justify-between transition-all"
              onClick={() => vm.setScope("UPCOMING")}
              aria-pressed={vm.scope === "UPCOMING"}
              type="button"
            >
              <div>
                <div className="text-[11.5px] font-extrabold text-sub">
                  예정된 업무·방문
                </div>
                <div className="text-base sm:text-lg font-black text-[#121314] mt-0.5">
                  <span id="kpiUpcomingCount">
                    {vm.data?.counts.UPCOMING ?? "—"}
                  </span>
                  건
                </div>
              </div>
              <span className="w-8 h-8 rounded-xl bg-sub-soft text-sub flex items-center justify-center">
                <TemplateIcon name="calendar-clock" className="w-4 h-4" />
              </span>
            </button>

            <button
              id="scopeCard_OVERDUE"
              className="cursor-pointer p-3 rounded-xl border border-rose-200 bg-rose-50/50 hover:border-[#f04452] flex items-center justify-between transition-all"
              onClick={() => vm.setScope("OVERDUE")}
              aria-pressed={vm.scope === "OVERDUE"}
              type="button"
            >
              <div>
                <div className="text-[11.5px] font-extrabold text-[#f04452]">
                  기한 지남 (미처리 리터치)
                </div>
                <div className="text-base sm:text-lg font-black text-[#f04452] mt-0.5">
                  <span id="kpiOverdueCount">
                    {vm.data?.counts.OVERDUE ?? "—"}
                  </span>
                  건
                </div>
              </div>
              <span className="w-8 h-8 rounded-xl bg-rose-100 text-[#f04452] flex items-center justify-center">
                <TemplateIcon name="alert-circle" className="w-4 h-4" />
              </span>
            </button>

            <button
              id="scopeCard_DONE"
              className="cursor-pointer p-3 rounded-xl border border-[#e6eaee] bg-[#f8fafc] hover:border-slate-400 flex items-center justify-between transition-all"
              onClick={() => vm.setScope("DONE")}
              aria-pressed={vm.scope === "DONE"}
              type="button"
            >
              <div>
                <div className="text-[11.5px] font-extrabold text-[#334155]">
                  완료된 업무
                </div>
                <div className="text-base sm:text-lg font-black text-[#121314] mt-0.5">
                  <span id="kpiDoneCount">{vm.data?.counts.DONE ?? "—"}</span>건
                </div>
              </div>
              <span className="w-8 h-8 rounded-xl bg-slate-200 text-[#334155] flex items-center justify-center">
                <TemplateIcon name="check-circle-2" className="w-4 h-4" />
              </span>
            </button>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 pt-2 border-t border-[#f4f6f8]">
            <div className="flex items-center gap-1.5 flex-wrap">
              <div className="MuiFormControl-root MuiTextField-root css-1vbfw84">
                <label className="sr-only" htmlFor="taskScopeSelect">
                  업무 보기
                </label>
                <select
                  id="taskScopeSelect"
                  className="px-3 py-1.5 rounded-xl border-2 border-[#03c75a] bg-white text-xs font-black text-[#121314] outline-none"
                  value={vm.scope}
                  onChange={(e) => vm.setScope(e.target.value)}
                  aria-label="taskScopeSelect"
                >
                  <option value="ALL">업무 보기: 전체 일정</option>
                  <option value="TODAY">업무 보기: 오늘 할 일</option>
                  <option value="UPCOMING">업무 보기: 예정된 할 일</option>
                  <option value="OVERDUE">업무 보기: 기한 지난 할 일</option>
                  <option value="DONE">업무 보기: 완료된 할 일</option>
                  <option value="CANCELLED">업무 보기: 취소된 할 일</option>
                </select>
              </div>

              <div className="flex items-center gap-1 flex-wrap">
                <button
                  type="button"
                  id="typeBtn_ALL"
                  className={
                    "px-2.5 py-1.5 rounded-xl bg-[#121314] text-white text-xs font-black" +
                    (vm.kind === "ALL" ? " task-filter-active" : "")
                  }
                  disabled={vm.busy}
                  onClick={() => vm.setKind("ALL")}
                  aria-pressed={vm.kind === "ALL"}
                >
                  전체 종류
                </button>
                <button
                  type="button"
                  id="typeBtn_CALL"
                  className={
                    "px-2.5 py-1.5 rounded-xl bg-[#f4f6f8] text-[#334155] hover:bg-slate-200 text-xs font-extrabold" +
                    (vm.kind === "CALL" ? " task-filter-active" : "")
                  }
                  disabled={vm.busy}
                  onClick={() => vm.setKind("CALL")}
                  aria-pressed={vm.kind === "CALL"}
                >
                  📞 재통화
                </button>
                <button
                  type="button"
                  id="typeBtn_VISIT"
                  className={
                    "px-2.5 py-1.5 rounded-xl bg-[#f4f6f8] text-[#334155] hover:bg-slate-200 text-xs font-extrabold" +
                    (vm.kind === "VISIT" ? " task-filter-active" : "")
                  }
                  disabled={vm.busy}
                  onClick={() => vm.setKind("VISIT")}
                  aria-pressed={vm.kind === "VISIT"}
                >
                  🚗 방문상담
                </button>
                <button
                  type="button"
                  id="typeBtn_PROPOSAL"
                  className={
                    "px-2.5 py-1.5 rounded-xl bg-[#f4f6f8] text-[#334155] hover:bg-slate-200 text-xs font-extrabold" +
                    (vm.kind === "DOCUMENT" ? " task-filter-active" : "")
                  }
                  disabled={vm.busy}
                  onClick={() => vm.setKind("DOCUMENT")}
                  aria-pressed={vm.kind === "DOCUMENT"}
                >
                  📄 제안·리포트
                </button>
                <button
                  type="button"
                  id="typeBtn_CARE"
                  className={
                    "px-2.5 py-1.5 rounded-xl bg-[#f4f6f8] text-[#334155] hover:bg-slate-200 text-xs font-extrabold" +
                    (vm.kind === "REVIEW" ? " task-filter-active" : "")
                  }
                  disabled={vm.busy}
                  onClick={() => vm.setKind("REVIEW")}
                  aria-pressed={vm.kind === "REVIEW"}
                >
                  🎁 생일·면책·상령일 케어
                </button>
              </div>
            </div>

            <div className="relative w-full lg:w-72">
              <TemplateIcon
                name="search"
                className="w-4 h-4 text-[#64748b] absolute left-3 top-1/2 -translate-y-1/2"
              />
              <input
                type="text"
                id="taskSearchInput"
                placeholder="고객명·업무제목·연락처·내용 검색"
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[#d1d6db] focus:border-primary text-xs font-bold text-[#121314] outline-none"
                maxLength="200"
                value={vm.query}
                onChange={(e) => vm.setQuery(e.target.value)}
                aria-label="taskSearchInput"
              />
            </div>
          </div>
        </div>

        <div className="ns-card bg-white overflow-hidden">
          <div
            id="taskTableHeader"
            className="hidden md:grid md:grid-cols-12 items-center px-4 py-2.5 bg-[#f8fafc] border-b border-[#e6eaee] text-xs font-black text-[#334155]"
          >
            <div className="col-span-1">완료 · 상태</div>
            <div className="col-span-2">예정일 · 확정시각</div>
            <div className="col-span-2">업무 종류 · 고객명</div>
            <div className="col-span-4">업무 제목 · 상세 메모</div>
            <div className="col-span-2">연락처 · 방문주소</div>
            <div className="col-span-1 text-right">업무액션</div>
          </div>

          <div id="taskListContainer" className="divide-y divide-[#f1f5f9]">
            {vm.rows}
          </div>

          <div
            id="emptyTasksBox"
            className="py-16 px-4 text-center space-y-3"
            hidden={!vm.data || vm.data.items.length > 0}
          >
            <div className="w-12 h-12 rounded-2xl bg-primary-soft text-primary flex items-center justify-center mx-auto">
              <TemplateIcon name="check-circle" className="w-6 h-6" />
            </div>
            <p className="text-base font-black text-[#121314]">
              해당하는 업무가 없습니다.
            </p>
            <p className="text-xs font-semibold text-[#64748b]">
              위쪽의 [오늘 자동 이벤트]에서 할 일을 원클릭으로 추가하거나 [+
              업무·방문 일정 등록] 버튼을 눌러 새 일정을 등록해 보세요.
            </p>
            <div className="pt-1 flex justify-center gap-2">
              <button
                type="button"
                className="ns-hero-cta px-4 py-2 rounded-xl text-white text-xs font-black"
                disabled={vm.busy || !vm.data}
                onClick={vm.openCreate}
              >
                + 업무·방문 일정 등록
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-xl border border-[#d1d6db] text-xs font-extrabold text-[#334155]"
                disabled={vm.busy}
                onClick={() => vm.setScope("ALL")}
                aria-pressed={vm.scope === "ALL"}
              >
                전체 일정 보기
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
