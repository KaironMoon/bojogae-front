/* eslint-disable react/prop-types */
// Layout copied from 로그인 홈페이지 개편안.html; values and actions supplied by the server-backed controller.
import { Link } from "react-router-dom";
import Icon from "./HomeIcon";
export default function HomeReference({ vm }) {
  return (
    <div id="viewHomeWorkspace" className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        <div className="lg:col-span-7 ns-card p-6 sm:p-7 bg-gradient-to-br from-[#121314] via-[#132a21] to-[#0f172a] text-white relative overflow-hidden flex flex-col justify-between">
          <div
            className="absolute -right-12 -top-12 w-60 h-60 rounded-full bg-[#03c75a]/20 blur-3xl pointer-events-none"
            aria-hidden="true"
          ></div>

          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="px-3 py-1 rounded-full bg-[#03c75a]/20 border border-[#03c75a]/50 text-emerald-300 text-xs font-black flex items-center gap-1.5">
                  <Icon
                    name="sparkles"
                    className="w-3.5 h-3.5 text-[#03c75a]"
                  />
                  <span className="">BOJOGAE AI</span>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-white/10 text-slate-200 text-[11px] font-bold">
                  총 {vm.promptCount}종 실전 보고서 프롬프트 가동 중
                </span>
              </div>
              <Link
                type="button"
                className="text-[11.5px] font-extrabold text-amber-300 hover:underline flex items-center gap-1"
                to="/proposals?tab=favorites"
              >
                ★ 내 즐겨찾기 프롬프트({vm.favoriteCount}) 바로 열기 ↗
              </Link>
            </div>

            <div className="space-y-1.5 pt-1">
              <h1 className="text-2xl sm:text-3xl lg:text-[31px] font-black tracking-tight text-white leading-tight">
                {vm.name}님, 오늘은 어떤 보고서를 만들까요?
              </h1>
              <p className="text-xs sm:text-sm font-semibold text-slate-300">
                버튼을 눌러 필요한 보고서 종류를 선택해 주세요.
              </p>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-2.5">
              <Link
                data-discover="true"
                className="ns-hero-cta px-6 py-3.5 rounded-2xl text-white text-sm font-black flex items-center gap-2 shadow-lg"
                to="/proposals?tab=all"
              >
                <Icon name="sparkles" className="w-4 h-4" />
                <span>보고서 만들기 ({vm.promptCount}종 전체 선택)</span>
                <span className="">
                  <Icon name="arrow-right" className="w-4 h-4" />
                </span>
              </Link>

              <Link
                data-discover="true"
                className="px-3.5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-extrabold flex items-center gap-1.5 transition-all"
                to="/claims/new"
              >
                <Icon name="receipt" className="w-3.5 h-3.5 text-emerald-400" />
                <span>보험금 청구</span>
                <span className="px-1.5 py-0.2 rounded bg-[#03c75a] text-white text-[9.5px] font-black">
                  모바일팩스 0꼬막
                </span>
              </Link>

              <Link
                data-discover="true"
                className="px-3.5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-extrabold flex items-center gap-1.5 transition-all"
                to="/insurers"
              >
                <Icon name="landmark" className="w-3.5 h-3.5 text-purple-300" />
                <span>보험사 정보·링크</span>
              </Link>
            </div>
          </div>

          {vm.favorites}
        </div>

        {vm.banner}
      </div>

      <div className="ns-card p-4 sm:p-5 bg-white space-y-3.5 border-l-4 border-l-[#03c75a]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-[#f1f5f9]">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="w-8 h-8 rounded-xl bg-primary-soft text-primary flex items-center justify-center shrink-0">
              <Icon name="contact-round" className="w-4 h-4" />
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm sm:text-base font-black text-[#121314]">
                  내고객·계약 업무
                </p>
                <span className="px-2 py-0.5 rounded-full bg-primary-soft text-primary text-[11px] font-black">
                  고객관리 · 할 일·방문 일정 직통 연결
                </span>
              </div>
              <p className="text-xs font-semibold text-[#64748b]">
                각 항목을 클릭하면{" "}
                <strong className="text-[#121314]">[고객관리 &gt; 내 고객]</strong>
                ,{" "}
                <strong className="text-[#121314]">[고객관리 &gt; 내 계약]</strong>
                , <strong className="text-[#121314]">[할 일·방문 일정]</strong>{" "}
                페이지의 해당 필터로 바로 이동합니다.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              data-discover="true"
              className="px-3.5 py-1.5 rounded-xl bg-[#121314] hover:bg-primary text-white text-xs font-black flex items-center gap-1 transition-colors"
              to="/crm/tasks"
            >
              <span>전체 업무</span>
              <Icon name="chevron-right" className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Link
              data-discover="true"
              className="p-3 rounded-xl bg-[#f8fafc] hover:bg-primary-soft/50 border border-[#e6eaee] hover:border-primary transition-all block"
              to="/crm/customers"
            >
              <div className="text-[11px] font-bold text-[#64748b] flex items-center justify-between">
                <span>고객관리 &gt; 내 고객</span>
                <Icon name="users" className="w-3.5 h-3.5 text-primary" />
              </div>
              <span
                id="chipTextCustomers"
                className="block text-sm sm:text-[15px] font-black text-[#121314] mt-1"
              >
                {vm.crmLabel("customers", "관리 고객 ", "명")}
              </span>
            </Link>

            <Link
              data-discover="true"
              className="p-3 rounded-xl bg-[#f8fafc] hover:bg-sub-soft/50 border border-[#e6eaee] hover:border-sub transition-all block"
              to="/crm/contracts"
            >
              <div className="text-[11px] font-bold text-[#64748b] flex items-center justify-between">
                <span>고객관리 &gt; 내 계약</span>
                <Icon name="file-check-2" className="w-3.5 h-3.5 text-sub" />
              </div>
              <span
                id="chipTextContracts"
                className="block text-sm sm:text-[15px] font-black text-[#121314] mt-1"
              >
                {vm.crmLabel("contracts", "계약 ", "건")}
              </span>
            </Link>

            <Link
              data-discover="true"
              className="p-3 rounded-xl bg-primary-soft/70 hover:bg-primary-soft border-2 border-primary transition-all block"
              to="/crm/tasks?scope=TODAY"
            >
              <div className="text-[11px] font-extrabold text-primary flex items-center justify-between">
                <span>할 일·방문 일정</span>
                <Icon name="sun" className="w-3.5 h-3.5 text-primary" />
              </div>
              <span
                id="chipTextToday"
                className="block text-sm sm:text-[15px] font-black text-primary mt-1"
              >
                {vm.crmLabel("today", "오늘 ", "건")}
              </span>
            </Link>

            <Link
              data-discover="true"
              className="p-3 rounded-xl bg-rose-50/60 hover:bg-rose-50 border border-rose-200 transition-all block"
              to="/crm/tasks?scope=OVERDUE"
            >
              <div className="text-[11px] font-extrabold text-[#f04452] flex items-center justify-between">
                <span>미처리 리터치</span>
                <Icon
                  name="alert-circle"
                  className="w-3.5 h-3.5 text-[#f04452]"
                />
              </div>
              <span
                id="chipTextOverdue"
                className="block text-sm sm:text-[15px] font-black text-[#f04452] mt-1"
              >
                {vm.crmLabel("overdue", "기한 초과 ", "건")}
              </span>
            </Link>
          </div>

          <div className="lg:col-span-5 p-3 rounded-xl bg-gradient-to-r from-[#ecfdf5] via-[#f8fafc] to-[#f5f3ff] border border-[#a7f3d0] space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-black text-[#121314] flex items-center gap-1">
                <Icon name="bell-ring" className="w-3.5 h-3.5 text-primary" />
                <span>
                  오늘·이번 주 자동 감지 고객 이벤트 (내계약·내고객 연동)
                </span>
              </span>
              <Link
                className="font-extrabold text-primary hover:underline"
                to="/crm/tasks"
              >
                일정 관리 ↗
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[11.5px]">
              {vm.events}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <Link
            className="cursor-pointer ns-card p-4 bg-white hover:border-amber-400 flex items-center justify-between group"
            to="/my-coins"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#fffbeb] border border-[#fde68a] flex items-center justify-center shrink-0">
                <img
                  src="/images/kkomak.svg"
                  width="28"
                  height="28"
                  alt=""
                  aria-hidden="true"
                />
              </div>
              <div className="">
                <span className="text-xs font-extrabold text-[#92400e] block">
                  보유 꼬막
                </span>
                <h6
                  id="homeKkomakCount"
                  className="text-2xl font-black text-[#121314]"
                >
                  {vm.number("total_points")}
                </h6>
              </div>
            </div>
            <span className="px-2 py-1 rounded-lg bg-[#fffbeb] text-[#b45309] text-[11px] font-black group-hover:bg-amber-500 group-hover:text-white transition-colors">
              내꼬막 내역 ↗
            </span>
          </Link>

          <a
            className="cursor-pointer ns-card p-4 bg-white hover:border-primary flex items-center justify-between group"
            href="#recentWorkSection"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-primary-soft text-primary flex items-center justify-center shrink-0">
                <Icon name="zap" className="w-6 h-6" />
              </div>
              <div className="">
                <span className="text-xs font-extrabold text-[#64748b] block">
                  진행 중
                </span>
                <h6
                  id="homeInProgressCount"
                  className="text-2xl font-black text-[#121314]"
                >
                  {vm.number("active_reports")}
                </h6>
              </div>
            </div>
            <span
              id="homeInProgressBadge"
              className="px-2 py-1 rounded-lg bg-[#f4f6f8] text-[#475569] text-[11px] font-extrabold group-hover:bg-primary-soft group-hover:text-primary transition-colors"
            >
              {"진행 상태 보기 ↓"}
            </span>
          </a>

          <a
            className="cursor-pointer ns-card p-4 bg-white hover:border-primary flex items-center justify-between group"
            href="#recentWorkSection"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-primary-soft text-primary flex items-center justify-center shrink-0">
                <Icon name="check-circle-2" className="w-6 h-6" />
              </div>
              <div className="">
                <span className="text-xs font-extrabold text-[#64748b] block">
                  완료한 보고서
                </span>
                <h6
                  id="homeCompletedCount"
                  className="text-2xl font-black text-[#121314]"
                >
                  {vm.number("completed_reports")}
                </h6>
              </div>
            </div>
            <span className="px-2 py-1 rounded-lg bg-primary-soft text-primary text-[11px] font-black">
              최근 작업 보기 ↓
            </span>
          </a>

          <a
            className="cursor-pointer ns-card p-4 bg-white hover:border-sub flex items-center justify-between group"
            href="#latestNewsSection"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-sub-soft text-sub flex items-center justify-center shrink-0">
                <Icon name="megaphone" className="w-6 h-6" />
              </div>
              <div className="">
                <span className="text-xs font-extrabold text-[#64748b] block">
                  새로운 소식
                </span>
                <h6 className="text-2xl font-black text-[#121314]">
                  {vm.newsCount}
                </h6>
              </div>
            </div>
            <span className="px-2 py-1 rounded-lg bg-sub-soft text-sub text-[11px] font-black">
              최신 소식 보기 ↓
            </span>
          </a>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <section className="ns-card p-5 bg-white space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-primary text-white text-[10.5px] font-black">
                    NEW ARRIVAL
                  </span>
                  <h6 className="text-base sm:text-lg font-black text-[#121314]">
                    새로 나온 보고서
                  </h6>
                </div>
                <p className="text-xs font-semibold text-[#64748b] mt-0.5">
                  최근 새롭게 등록된 보고서입니다. 클릭 시 해당 프롬프트로
                  이동합니다.
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  aria-label="새로 나온 보고서 이전 보고서"
                  className="w-8 h-8 rounded-xl border border-[#e6eaee] hover:border-primary flex items-center justify-center"
                  onClick={() => vm.slide("newReportsTrack", -1)}
                >
                  <Icon name="chevron-left" className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  aria-label="새로 나온 보고서 다음 보고서"
                  className="w-8 h-8 rounded-xl border border-[#e6eaee] hover:border-primary flex items-center justify-center"
                  onClick={() => vm.slide("newReportsTrack", 1)}
                >
                  <Icon name="chevron-right" className="w-4 h-4" />
                </button>
                <Link
                  data-discover="true"
                  className="px-2.5 py-1.5 rounded-xl bg-[#f4f6f8] hover:bg-primary-soft hover:text-primary text-xs font-extrabold text-[#334155]"
                  to="/proposals?tab=all"
                >
                  전체 보기 ({vm.promptCount}종)
                </Link>
              </div>
            </div>

            <div className="relative">
              <div
                id="newReportsTrack"
                className="flex gap-3.5 overflow-x-auto no-scrollbar scroll-smooth pb-1"
              >
                {vm.latest}
              </div>
            </div>

            {vm.dots("latest")}
          </section>

          <section className="ns-card p-5 bg-white space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-sub text-white text-[10.5px] font-black">
                    UPDATED
                  </span>
                  <h6 className="text-base sm:text-lg font-black text-[#121314]">
                    최근 업데이트된 보고서
                  </h6>
                </div>
                <p className="text-xs font-semibold text-[#64748b] mt-0.5">
                  최근 내용이 업데이트된 보고서입니다.
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  aria-label="최근 업데이트된 보고서 이전 보고서"
                  className="w-8 h-8 rounded-xl border border-[#e6eaee] hover:border-sub flex items-center justify-center"
                  onClick={() => vm.slide("updatedReportsTrack", -1)}
                >
                  <Icon name="chevron-left" className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  aria-label="최근 업데이트된 보고서 다음 보고서"
                  className="w-8 h-8 rounded-xl border border-[#e6eaee] hover:border-sub flex items-center justify-center"
                  onClick={() => vm.slide("updatedReportsTrack", 1)}
                >
                  <Icon name="chevron-right" className="w-4 h-4" />
                </button>
                <Link
                  data-discover="true"
                  className="px-2.5 py-1.5 rounded-xl bg-[#f4f6f8] hover:bg-sub-soft hover:text-sub text-xs font-extrabold text-[#334155]"
                  to="/proposals?tab=all"
                >
                  전체 보기 ({vm.promptCount}종)
                </Link>
              </div>
            </div>

            <div className="relative">
              <div
                id="updatedReportsTrack"
                className="flex gap-3.5 overflow-x-auto no-scrollbar scroll-smooth pb-1"
              >
                {vm.updated}
              </div>
            </div>

            {vm.dots("updated")}
          </section>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <section className="ns-card p-5 bg-white space-y-3.5">
            <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-3">
              <div className="">
                <div className="flex items-center gap-2">
                  <Icon name="trophy" className="w-4 h-4 text-amber-500" />
                  <h6 className="text-base sm:text-lg font-black text-[#121314]">
                    요즘 많이 사용하는 보고서
                  </h6>
                </div>
                <p className="text-xs font-semibold text-[#64748b] mt-0.5">
                  최근 30일 동안 완성된 보고서를 기준으로 집계했습니다.
                </p>
              </div>
              <Link
                data-discover="true"
                className="px-2.5 py-1.5 rounded-xl bg-[#f4f6f8] hover:bg-primary-soft hover:text-primary text-xs font-extrabold text-[#334155]"
                to="/proposals?tab=all"
              >
                전체 보기
              </Link>
            </div>

            <div className="">
              <div id="popularRankingList" className="space-y-2">
                {vm.popular}
              </div>
            </div>
          </section>

          <section className="ns-card p-5 bg-white space-y-3.5">
            <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-3">
              <div className="">
                <div className="flex items-center gap-2">
                  <Icon name="star" className="w-4 h-4 text-amber-500" />
                  <h6 className="text-base sm:text-lg font-black text-[#121314]">
                    내가 자주 만드는 보고서
                  </h6>
                </div>
                <p className="text-xs font-semibold text-[#64748b] mt-0.5">
                  내 완료 기록을 기준으로 빠르게 다시 시작할 수 있습니다.
                </p>
              </div>
              <Link
                data-discover="true"
                className="px-2.5 py-1.5 rounded-xl bg-[#f4f6f8] hover:bg-primary-soft hover:text-primary text-xs font-extrabold text-[#334155]"
                to="/proposals?tab=favorites"
              >
                즐겨찾기 보기
              </Link>
            </div>

            <div className="">
              <div id="myFrequentRankingList" className="space-y-2">
                {vm.personal}
              </div>
            </div>
          </section>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div
            id="recentWorkSection"
            className="lg:col-span-7 ns-card p-5 bg-white space-y-3.5"
          >
            <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-3">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-xl bg-primary-soft text-primary flex items-center justify-center">
                  <Icon name="history" className="w-4 h-4" />
                </span>
                <div>
                  <h6 className="text-base sm:text-lg font-black text-[#121314]">
                    최근 작업
                  </h6>
                  <p className="text-[11.5px] font-semibold text-[#64748b]">
                    클릭하면 완성된 보고서를 다시 열람하거나 같은 양식
                    프롬프트로 재시작합니다.
                  </p>
                </div>
              </div>
              <Link
                data-discover="true"
                className="px-2.5 py-1.5 rounded-xl bg-[#f4f6f8] hover:bg-primary-soft hover:text-primary text-xs font-extrabold text-[#334155]"
                to="/proposals?tab=all"
              >
                전체 보기
              </Link>
            </div>

            <div
              id="recentWorksContainer"
              className="divide-y divide-[#f1f5f9]"
            >
              {vm.recent}
            </div>
          </div>

          <div
            id="latestNewsSection"
            className="lg:col-span-5 ns-card p-5 bg-white flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3.5">
              <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-xl bg-rose-50 text-[#f04452] flex items-center justify-center">
                    <Icon name="flame" className="w-4 h-4" />
                  </span>
                  <div>
                    <h6 className="text-base sm:text-lg font-black text-[#121314]">
                      최신 소식
                    </h6>
                    <p className="text-[11.5px] font-semibold text-[#64748b]">
                      게시판 &gt; 공지사항 · 보험 지식 연동
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-rose-50 text-[#f04452] text-[10.5px] font-black">
                  BOARD
                </span>
              </div>

              <div id="latestNewsContainer" className="space-y-2.5">
                {vm.news}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#f8fafc] border border-[#e6eaee] flex items-center justify-between gap-2 text-xs">
              <div>
                <div className="font-black text-[#121314]">
                  도움말 센터 · 카카오톡 1:1 문의
                </div>
                <div className="text-[11px] font-semibold text-[#64748b]">
                  사용법 영상(FAQ) 확인 및 실시간 상담
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Link
                  type="button"
                  className="px-2.5 py-1.5 rounded-xl bg-white border border-[#d1d6db] font-extrabold text-[#121314] hover:border-primary"
                  to="/help/faq"
                >
                  FAQ
                </Link>
                <a
                  href="https://pf.kakao.com/_xjaxjmX/chat"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1.5 rounded-xl bg-[#fee500] text-[#191600] font-black"
                >
                  1:1 카톡문의 ↗
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
