/* eslint-disable react/prop-types */
// HTML structure copied from the insurer design reference.
import Icon from "./InsurerIcon";
export default function DirectoryReference({ vm }) {
  return (
    <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div id="viewAppWorkspace" className="space-y-5">
        {vm.feedback}

        <div className="ns-card p-5 sm:p-6 bg-white flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-primary-soft text-primary border border-emerald-200">
                INSURER PORTAL & HELPDESK
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-sub-soft text-sub">
                생명·손해·공제 40개 기관 통합
              </span>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="MuiTypography-root MuiTypography-h5 css-j405rk text-2xl sm:text-3xl font-black text-[#121314] tracking-tight">
                보험사 정보·링크
              </h1>
              <span className="text-xs font-bold text-[#8b95a1]">
                설계사 전산(GA/LC) · 콜센터 · 인콜모니터링 · 청구팩스 · 카드납 ·
                약관 통합 허브
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href="https://youtu.be/-FSahEayni4"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-[#fffbeb] hover:bg-amber-100 border border-[#fde68a] text-[#92400e] text-xs font-extrabold flex items-center gap-1.5 transition-all"
            >
              <Icon name="smartphone" className="w-4 h-4 text-amber-600" />
              <span>모바일 팩스 청구 영상</span>
              <Icon name="external-link" className="w-3 h-3 opacity-60" />
            </a>
            <a
              href="https://youtu.be/bvClY68_mpI"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-sub-soft hover:bg-purple-100 border border-purple-200 text-sub text-xs font-extrabold flex items-center gap-1.5 transition-all"
            >
              <Icon name="monitor-play" className="w-4 h-4" />
              <span>PC 청구 가이드 영상</span>
              <Icon name="external-link" className="w-3 h-3 opacity-60" />
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          <a
            href="https://www.hira.or.kr/rb/diag/selectMyDiagInfmList.do?pgmid=HIRAA070001000600"
            target="_blank"
            rel="noopener noreferrer"
            className="ns-card ns-card-interactive p-3.5 bg-white flex items-center justify-between gap-2.5 group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-primary-soft text-primary flex items-center justify-center shrink-0">
                <Icon name="stethoscope" className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-black text-[#121314] group-hover:text-primary truncate">
                  건강e음 (5년 진료기록)
                </div>
                <div className="text-[10.5px] font-bold text-[#8b95a1] truncate">
                  심평원 내 진료정보 열람 공식
                </div>
              </div>
            </div>
            <Icon
              name="external-link"
              className="w-3.5 h-3.5 text-[#8b95a1] group-hover:text-primary shrink-0"
            />
          </a>

          <a
            href="https://www.hira.or.kr/npay/index.do"
            target="_blank"
            rel="noopener noreferrer"
            className="ns-card ns-card-interactive p-3.5 bg-white flex items-center justify-between gap-2.5 group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-sub-soft text-sub flex items-center justify-center shrink-0">
                <Icon name="receipt-text" className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-black text-[#121314] group-hover:text-sub truncate">
                  심평원 비급여 진료비 조회
                </div>
                <div className="text-[10.5px] font-bold text-[#8b95a1] truncate">
                  병원별 비급여 가격 공식 조회
                </div>
              </div>
            </div>
            <Icon
              name="external-link"
              className="w-3.5 h-3.5 text-[#8b95a1] group-hover:text-sub shrink-0"
            />
          </a>

          <a
            href="https://cont.insure.or.kr/cont_web/intro.do"
            target="_blank"
            rel="noopener noreferrer"
            className="ns-card ns-card-interactive p-3.5 bg-white flex items-center justify-between gap-2.5 group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Icon name="search-check" className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-black text-[#121314] group-hover:text-amber-600 truncate">
                  내보험찾아줌 (숨은보험금)
                </div>
                <div className="text-[10.5px] font-bold text-[#8b95a1] truncate">
                  가입내역·미청구 보험금 조회
                </div>
              </div>
            </div>
            <Icon
              name="external-link"
              className="w-3.5 h-3.5 text-[#8b95a1] shrink-0"
            />
          </a>

          <a
            href="https://kpub.knia.or.kr/"
            target="_blank"
            rel="noopener noreferrer"
            className="ns-card ns-card-interactive p-3.5 bg-white flex items-center justify-between gap-2.5 group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                <Icon name="shield-check" className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-black text-[#121314] group-hover:text-sky-600 truncate">
                  손해보험협회 공시실
                </div>
                <div className="text-[10.5px] font-bold text-[#8b95a1] truncate">
                  손보 전 상품 약관·보험료 비교
                </div>
              </div>
            </div>
            <Icon
              name="external-link"
              className="w-3.5 h-3.5 text-[#8b95a1] shrink-0"
            />
          </a>

          <a
            href="https://pub.insure.or.kr"
            target="_blank"
            rel="noopener noreferrer"
            className="ns-card ns-card-interactive p-3.5 bg-white flex items-center justify-between gap-2.5 group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <Icon name="heart-handshake" className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-black text-[#121314] group-hover:text-rose-600 truncate">
                  생명보험협회 공시실
                </div>
                <div className="text-[10.5px] font-bold text-[#8b95a1] truncate">
                  생보 전 상품 약관·공시이율
                </div>
              </div>
            </div>
            <Icon
              name="external-link"
              className="w-3.5 h-3.5 text-[#8b95a1] shrink-0"
            />
          </a>
        </div>

        <div className="ns-card p-4 sm:p-5 bg-white space-y-3.5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                className={
                  "sector-tab px-3.5 py-2 rounded-xl text-xs font-black bg-[#121314] text-white flex items-center gap-1.5 transition-all" +
                  (vm.kind === "all" ? " is-active" : "")
                }
                onClick={() => vm.setKind("all")}
                aria-pressed={vm.kind === "all"}
              >
                <span>전체 기관</span>
                <span
                  className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]"
                  id="countAllBadge"
                >
                  {vm.counts.all ?? "—"}
                </span>
              </button>
              <button
                className={
                  "sector-tab px-3.5 py-2 rounded-xl text-xs font-extrabold bg-[#fffbeb] text-[#92400e] border border-[#fde68a] flex items-center gap-1.5 transition-all" +
                  (vm.kind === "favorites" ? " is-active" : "")
                }
                onClick={() => vm.setKind("favorites")}
                aria-pressed={vm.kind === "favorites"}
              >
                <Icon
                  name="star"
                  className="w-3.5 h-3.5 fill-amber-400 text-amber-500"
                />
                <span>즐겨찾기</span>
                <span
                  className="px-1.5 py-0.2 rounded-full bg-amber-200/70 text-[10px]"
                  id="countFavBadge"
                >
                  {vm.counts.favorites ?? "—"}
                </span>
              </button>
              <button
                className={
                  "sector-tab px-3.5 py-2 rounded-xl text-xs font-bold bg-[#f4f6f8] text-[#4e5968] hover:text-[#121314] flex items-center gap-1.5 transition-all" +
                  (vm.kind === "non_life" ? " is-active" : "")
                }
                onClick={() => vm.setKind("non_life")}
                aria-pressed={vm.kind === "non_life"}
              >
                <span>손해보험</span>
                <span className="px-1.5 py-0.2 rounded-full bg-black/10 text-[10px]">
                  {vm.counts.non_life ?? "—"}
                </span>
              </button>
              <button
                className={
                  "sector-tab px-3.5 py-2 rounded-xl text-xs font-bold bg-[#f4f6f8] text-[#4e5968] hover:text-[#121314] flex items-center gap-1.5 transition-all" +
                  (vm.kind === "life" ? " is-active" : "")
                }
                onClick={() => vm.setKind("life")}
                aria-pressed={vm.kind === "life"}
              >
                <span>생명보험</span>
                <span className="px-1.5 py-0.2 rounded-full bg-black/10 text-[10px]">
                  {vm.counts.life ?? "—"}
                </span>
              </button>
              <button
                className={
                  "sector-tab px-3.5 py-2 rounded-xl text-xs font-bold bg-[#f4f6f8] text-[#4e5968] hover:text-[#121314] flex items-center gap-1.5 transition-all" +
                  (vm.kind === "other" ? " is-active" : "")
                }
                onClick={() => vm.setKind("other")}
                aria-pressed={vm.kind === "other"}
              >
                <span>공제·우체국·기타</span>
                <span className="px-1.5 py-0.2 rounded-full bg-black/10 text-[10px]">
                  {vm.counts.other ?? "—"}
                </span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="ns-search-bar flex-1 sm:w-80 flex items-center rounded-xl px-3.5 py-2">
                <Icon
                  name="search"
                  className="w-4 h-4 text-primary mr-2 shrink-0"
                />
                <input
                  type="text"
                  id="insurerSearchInput"
                  placeholder="보험사명, 전산명(KB스마트비서, 하이포털), 전화번호 검색..."
                  className="w-full text-xs font-semibold text-[#121314] placeholder:text-[#8b95a1] outline-none bg-transparent"
                  value={vm.query}
                  onChange={(e) => vm.setQuery(e.target.value)}
                  maxLength="100"
                  aria-label="보험사명, 전산명, 전화번호 검색"
                />
                <button className="text-[#8b95a1] hover:text-[#121314]">
                  <Icon name="x" className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center bg-[#f4f6f8] p-1 rounded-xl border border-[#e6eaee] shrink-0">
                <button
                  id="viewBtnGrid"
                  className="px-2.5 py-1.5 rounded-lg bg-white text-[#121314] shadow-2xs text-xs font-extrabold flex items-center gap-1"
                  onClick={() => vm.setView("card")}
                  aria-pressed={vm.view === "card"}
                >
                  <Icon
                    name="layout-grid"
                    className="w-3.5 h-3.5 text-primary"
                  />
                  <span className="hidden sm:inline">카드뷰</span>
                </button>
                <button
                  id="viewBtnTable"
                  className="px-2.5 py-1.5 rounded-lg text-[#8b95a1] hover:text-[#121314] text-xs font-bold flex items-center gap-1"
                  onClick={() => vm.setView("table")}
                  aria-pressed={vm.view === "table"}
                >
                  <Icon name="table-2" className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">일람표</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#f4f6f8] overflow-x-auto">
            <div className="flex items-center gap-1" id="initialFilterBar">
              {vm.initials}
            </div>
            <span
              id="filteredResultCount"
              className="text-[11px] font-extrabold text-[#8b95a1] shrink-0"
            >
              {vm.loading
                ? "불러오는 중…"
                : `총 ${vm.visible.length}개 기관 표시 중`}
            </span>
          </div>
        </div>

        <div
          id="insurerGridContainer"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5"
          hidden={vm.view !== "card"}
        >
          {vm.cards}
        </div>

        <div
          id="insurerTableContainer"
          className="ns-card bg-white overflow-hidden"
          hidden={vm.view !== "table"}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead className="bg-[#f8fafc] border-b border-[#e6eaee] text-[#4e5968] font-black text-left">
                <tr>
                  <th className="p-3.5 text-center w-12">즐겨찾기</th>
                  <th className="p-3.5">보험사 로고 영역 · 사명</th>
                  <th className="p-3.5">구분</th>
                  <th className="p-3.5">GA/교차 · LC 업무 시스템</th>
                  <th className="p-3.5">
                    고객센터 / 인콜모니터링 / 헬프데스크
                  </th>
                  <th className="p-3.5">보험금 청구 팩스 / 카드납</th>
                  <th className="p-3.5 text-right">전산 · 공시실 · 상세보기</th>
                </tr>
              </thead>
              <tbody
                id="insurerTableBody"
                className="divide-y divide-[#f4f6f8] font-medium"
              >
                {vm.rows}
              </tbody>
            </table>
          </div>
        </div>

        {vm.empty}
      </div>
    </main>
  );
}
