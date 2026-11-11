/* eslint-disable react/prop-types */
// Structure copied from the public-home HTML design reference.
import Icon from "./LandingIcon";
export default function HomeReference({ vm }) {
  return (
    <div id="top" className="flex-1">
      <header className="bg-white/95 backdrop-blur-md border-b border-[#e6eaee] sticky top-0 z-40">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <a href="#top" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-10 h-10 rounded-xl bg-[#2b282c] flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <img
                src="/bojogae-icon.png"
                alt="BOJOGAE"
                className="w-full h-full object-contain rounded-xl p-0.5"
              />
              <svg viewBox="0 0 48 48" className="w-8 h-8" hidden>
                <path
                  d="M13 18.5 L18.5 22 L13 25.5"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="33.5" cy="22" r="2.7" fill="#ffffff" />
                <circle cx="11" cy="29.5" r="2.8" fill="#ff8a75" />
                <circle cx="37" cy="29.5" r="2.8" fill="#ff8a75" />
                <path
                  d="M17.5 30.5 Q24 36 30.5 30.5"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-black tracking-tight text-[#121314]">
                  BOJOGAE
                </span>
              </div>
              <span className="block text-[10.5px] font-bold text-[#8b95a1] -mt-0.5">
                보조개AI 개인비서
              </span>
            </div>
          </a>

          <nav className="hidden lg:flex items-center gap-6 text-xs sm:text-sm font-extrabold text-[#4e5968]">
            <a
              href="#features"
              className="hover:text-primary transition-colors"
            >
              핵심 기능 (8대 무기)
            </a>
            <a
              href="#demo-preview"
              className="hover:text-primary transition-colors flex items-center gap-1"
            >
              <span className="w-2 h-2 rounded-full bg-[#ff0033]"></span> 시연
              영상
            </a>
            <a
              href="#power-suites"
              className="hover:text-primary transition-colors"
            >
              보조개톡·청구·CRM
            </a>
            <a
              href="#benefits"
              className="hover:text-primary transition-colors"
            >
              도입 효과
            </a>
            <a href="#reviews" className="hover:text-primary transition-colors">
              설계사 후기
            </a>
            <a href="#pricing" className="hover:text-primary transition-colors">
              요금 안내
            </a>
          </nav>

          <div className="flex items-center gap-2.5 shrink-0">
            <label className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#f4f6f8] hover:bg-slate-200 cursor-pointer select-none text-[11px] font-bold text-[#4e5968]">
              <input
                type="checkbox"
                id="chkRememberLoginRedirect"
                className="w-3.5 h-3.5 accent-[#03c75a] rounded cursor-pointer"
                onChange={vm.skipLanding}
                disabled={vm.preferenceBusy}
              />
              <span>다음부터 로그인 화면으로</span>
            </label>

            <button
              type="button"
              className="px-3.5 py-2 rounded-xl border border-[#d1d6db] hover:border-[#121314] bg-white text-xs font-black text-[#121314] transition-colors"
              onClick={() => vm.login("personal")}
            >
              로그인
            </button>

            <button
              type="button"
              className="ns-hero-cta px-4 py-2 rounded-xl text-white text-xs font-black flex items-center gap-1.5"
              onClick={() => vm.login("trial")}
            >
              <span>무료 시작 (20회)</span>
              <Icon name="arrow-right" className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden bg-gradient-to-b from-[#0f171e] via-[#121d24] to-[#121314] text-white py-12 sm:py-16 lg:py-20 border-b border-white/10">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[#03c75a]/15 blur-3xl pointer-events-none"></div>
        <div className="absolute top-1/3 -right-24 w-96 h-96 rounded-full bg-[#6b38fb]/15 blur-3xl pointer-events-none"></div>

        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-extrabold text-emerald-300">
                <span className="w-2 h-2 rounded-full bg-[#03c75a] animate-ping"></span>
                <span>
                  수십 장의 복잡한 보험 제안서, 1~2분 만에 고객 맞춤 리포트로
                </span>
              </div>

              <h1 className="hero-two-line-title font-black tracking-tight">
                <span className="block sm:whitespace-nowrap">
                  복잡한 제안서는{" "}
                  <span className="text-[#03c75a] underline decoration-emerald-500/40 underline-offset-8">
                    보조개 AI
                  </span>
                  에게 맡기고,
                </span>
                <span className="block sm:whitespace-nowrap mt-1">
                  설계사님은{" "}
                  <span className="bg-gradient-to-r from-emerald-300 via-teal-200 to-amber-200 bg-clip-text text-transparent">
                    상담과 계약
                  </span>
                  에만 집중하세요.
                </span>
              </h1>

              <p className="text-sm sm:text-base font-semibold text-slate-300 leading-relaxed">
                어려운 약관과 복잡한 담보 표에 지친 고객의 마음을 엽니다. AI가
                핵심만 짚어낸{" "}
                <strong className="text-white">고객 맞춤형 요약 페이지</strong>
                부터{" "}
                <strong className="text-emerald-300">
                  5년치 미청구 보험금 찾기, 알릴의무 고지 추출, 40개 보험사 무료
                  모바일팩스 청구, 보조개톡 카톡 자동화, 상령일·면책종료
                  고객관리
                </strong>
                까지 한곳에서 끝내세요.
              </p>

              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="px-2.5 py-1 rounded-lg bg-white/10 text-xs font-bold text-white flex items-center gap-1">
                  <Icon
                    name="file-spreadsheet"
                    className="w-3.5 h-3.5 text-emerald-400"
                  />{" "}
                  제안서 1장 요약·비교
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-white/10 text-xs font-bold text-white flex items-center gap-1">
                  <Icon
                    name="search-check"
                    className="w-3.5 h-3.5 text-amber-400"
                  />{" "}
                  건강e음 미청구·고지추출
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-white/10 text-xs font-bold text-white flex items-center gap-1">
                  <Icon
                    name="smartphone"
                    className="w-3.5 h-3.5 text-emerald-400"
                  />{" "}
                  40개사 청구서·모바일팩스 무료
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-white/10 text-xs font-bold text-white flex items-center gap-1">
                  <Icon
                    name="message-circle"
                    className="w-3.5 h-3.5 text-yellow-300"
                  />{" "}
                  보조개톡 무료 자동발송
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-white/10 text-xs font-bold text-white flex items-center gap-1">
                  <Icon
                    name="bell-ring"
                    className="w-3.5 h-3.5 text-purple-300"
                  />{" "}
                  상령일·면책·감액·생일 알림
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <button
                  type="button"
                  className="ns-hero-cta px-7 py-4 rounded-2xl text-white text-sm sm:text-base font-black flex items-center justify-center gap-2 shadow-xl"
                  onClick={() => vm.login("trial")}
                >
                  <Icon name="sparkles" className="w-5 h-5" />
                  <span>1달 무료 체험 시작하기 (20회 무료)</span>
                </button>

                <button
                  className="px-6 py-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm sm:text-base font-extrabold flex items-center justify-center gap-2 transition-all"
                  onClick={() => vm.openVideo(6)}
                  type="button"
                >
                  <span className="w-6 h-6 rounded-full bg-[#ff0033] text-white flex items-center justify-center">
                    <Icon
                      name="play"
                      className="w-3.5 h-3.5 fill-current ml-0.5"
                    />
                  </span>
                  <span>제안서 만들기 영상 보기</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-300 pt-1">
                <span className="flex items-center gap-1.5">
                  <Icon
                    name="check-circle-2"
                    className="w-4 h-4 text-[#03c75a]"
                  />{" "}
                  카드 등록 없음 (자동결제 0원)
                </span>
                <span className="flex items-center gap-1.5">
                  <Icon
                    name="check-circle-2"
                    className="w-4 h-4 text-[#03c75a]"
                  />{" "}
                  약 20번 문서 생성 가능 (20회 무료)
                </span>
                <span className="flex items-center gap-1.5">
                  <Icon
                    name="check-circle-2"
                    className="w-4 h-4 text-[#03c75a]"
                  />{" "}
                  최초 30일 한정 전 기능 개방
                </span>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="rounded-3xl bg-[#18222c] border-2 border-white/15 shadow-2xl overflow-hidden">
                <div className="px-4 py-3 bg-[#0f151b] border-b border-white/10 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                    <span className="w-3 h-3 rounded-full bg-amber-400"></span>
                    <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                    <span className="ml-2 text-xs font-mono font-bold text-slate-300">
                      bojogae.net · AI 제안서 요약 생성기
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[11px] font-black flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#03c75a] animate-ping"></span>
                    AI 요약 엔진 정상 가동 중
                  </span>
                </div>

                <div className="p-2 bg-[#131b23] border-b border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px] font-extrabold">
                  <button
                    type="button"
                    id="heroTab_video"
                    className={`py-2 px-2.5 rounded-xl flex items-center justify-center gap-1 ${vm.tab === "video" ? "bg-[#03c75a] text-white font-black" : "bg-white/5 hover:bg-white/10 text-slate-300"}`}
                    onClick={() => vm.setTab("video")}
                    aria-pressed={vm.tab === "video"}
                  >
                    <Icon name="play-circle" className="w-3.5 h-3.5" /> 제안서
                    영상 실행
                  </button>
                  <button
                    type="button"
                    id="heroTab_onepage"
                    className={`py-2 px-2.5 rounded-xl flex items-center justify-center gap-1 ${vm.tab === "onepage" ? "bg-[#03c75a] text-white font-black" : "bg-white/5 hover:bg-white/10 text-slate-300"}`}
                    onClick={() => vm.setTab("onepage")}
                    aria-pressed={vm.tab === "onepage"}
                  >
                    📄 1장 요약 결과물
                  </button>
                  <button
                    type="button"
                    id="heroTab_compare"
                    className={`py-2 px-2.5 rounded-xl flex items-center justify-center gap-1 ${vm.tab === "compare" ? "bg-[#03c75a] text-white font-black" : "bg-white/5 hover:bg-white/10 text-slate-300"}`}
                    onClick={() => vm.setTab("compare")}
                    aria-pressed={vm.tab === "compare"}
                  >
                    ⚖️ 3사 비교표
                  </button>
                  <button
                    type="button"
                    id="heroTab_remodel"
                    className={`py-2 px-2.5 rounded-xl flex items-center justify-center gap-1 ${vm.tab === "remodel" ? "bg-[#03c75a] text-white font-black" : "bg-white/5 hover:bg-white/10 text-slate-300"}`}
                    onClick={() => vm.setTab("remodel")}
                    aria-pressed={vm.tab === "remodel"}
                  >
                    🔄 리모델링 진단
                  </button>
                </div>

                <div
                  id="heroPanel_video"
                  className="p-4 sm:p-5 space-y-4"
                  hidden={vm.tab !== "video"}
                >
                  <div className="relative rounded-2xl overflow-hidden aspect-video bg-black border border-white/15 group">
                    <img
                      id="heroVideoThumb"
                      src="https://i.ytimg.com/vi/Ij6LjBcz0TQ/hq720.jpg"
                      alt="보험 가입제안서 요약 보고서 생성 영상"
                      className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-300"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/20 flex flex-col items-center justify-center p-4 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <a
                          href="https://youtu.be/Ij6LjBcz0TQ"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#ff0033] hover:bg-rose-600 text-white flex items-center justify-center shadow-2xl ring-8 ring-white/20 hover:scale-110 transition-all cursor-pointer"
                        >
                          <Icon
                            name="play"
                            className="w-8 h-8 sm:w-9 sm:h-9 fill-current ml-1"
                          />
                        </a>
                        <div className="space-y-1">
                          <span className="px-2.5 py-0.5 rounded-full bg-[#03c75a] text-white text-[10.5px] font-black">
                            1~2분 완성 · 실제 작동 시연 영상
                          </span>
                          <h3
                            id="heroVideoTitleText"
                            className="text-sm sm:text-base font-black text-white"
                          >
                            보험 가입제안서 요약 보고서 생성 (2:05)
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          <a
                            href="https://youtu.be/Ij6LjBcz0TQ"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3.5 py-1.5 rounded-xl bg-white text-[#121314] hover:bg-emerald-300 text-xs font-black flex items-center gap-1 shadow-md"
                          >
                            <span>유튜브 영상 바로 재생 ↗</span>
                          </a>
                          <button
                            type="button"
                            className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold border border-white/20"
                            onClick={() => vm.openVideo(6)}
                          >
                            3단계 요약 모달 보기
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                      <div className="text-emerald-400 font-black">
                        1. 제안서 업로드
                      </div>
                      <div className="text-[11px] text-slate-300 mt-0.5">
                        30~50페이지 원본 PDF
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                      <div className="text-emerald-400 font-black">
                        2. AI 자동 분석
                      </div>
                      <div className="text-[11px] text-slate-300 mt-0.5">
                        핵심 보장과 보험료 추출
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                      <div className="text-emerald-400 font-black">
                        3. 맞춤 페이지 완성
                      </div>
                      <div className="text-[11px] text-slate-300 mt-0.5">
                        카카오톡 상담에 바로 활용
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  id="heroPanel_onepage"
                  className="p-4 sm:p-5 space-y-3"
                  hidden={vm.tab !== "onepage"}
                >
                  <div className="p-4 rounded-2xl bg-white text-[#121314] space-y-3 shadow-inner">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                      <div>
                        <span className="px-2 py-0.5 rounded bg-[#121314] text-amber-300 text-[10px] font-black">
                          고객님 전용 1장 핵심요약
                        </span>
                        <h4 className="text-sm sm:text-base font-black mt-1">
                          KB 고당지 맞춤 3.5.5 간편건강보험 [핵심요약]
                        </h4>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] font-bold text-[#8b95a1]">
                          20년납 100세만기
                        </div>
                        <div className="text-base sm:text-lg font-black text-primary">
                          월 149,372원
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200">
                        <div className="font-bold text-[#92400e] text-[11px]">
                          01. 일반암 / 유사암 진단비
                        </div>
                        <div className="font-black text-sm text-[#121314] mt-0.5">
                          2,000만 / 400만
                        </div>
                        <div className="text-[10px] text-[#4e5968]">
                          8대 납입면제 + 유사암 납입지원
                        </div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
                        <div className="font-bold text-primary text-[11px]">
                          02. 비급여 암 통합치료비 Plus
                        </div>
                        <div className="font-black text-sm text-primary mt-0.5">
                          연간 1억 한도
                        </div>
                        <div className="text-[10px] text-[#4e5968]">
                          표적·면역·양성자·로봇수술 포함
                        </div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-purple-50/70 border border-purple-200">
                        <div className="font-bold text-sub text-[11px]">
                          03. 신특정순환계 통합치료비
                        </div>
                        <div className="font-black text-sm text-sub mt-0.5">
                          연간 5,000만 한도
                        </div>
                        <div className="text-[10px] text-[#4e5968]">
                          검사·혈전용해·수술·중환자실
                        </div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-sky-50/70 border border-sky-200">
                        <div className="font-bold text-sky-700 text-[11px]">
                          04. 입원 간병인 사용일당
                        </div>
                        <div className="font-black text-sm text-sky-800 mt-0.5">
                          일반 15만 / 상급 20만
                        </div>
                        <div className="text-[10px] text-[#4e5968]">
                          181일 이후도 10만원 계속 지원
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] font-bold text-[#8b95a1]">
                        담당 컨설턴트: 김성춘 (010-9729-9649)
                      </span>
                      <button
                        type="button"
                        className="px-3 py-1.5 rounded-lg bg-[#121314] text-white text-xs font-black"
                        onClick={() => vm.openSample("summary")}
                      >
                        크게 보기 ↗
                      </button>
                    </div>
                  </div>
                </div>

                <div
                  id="heroPanel_compare"
                  className="p-4 sm:p-5 space-y-3"
                  hidden={vm.tab !== "compare"}
                >
                  <div className="p-4 rounded-2xl bg-white text-[#121314] space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <div>
                        <span className="px-2 py-0.5 rounded bg-sub text-white text-[10px] font-black">
                          보험사 2~5곳 정밀 비교
                        </span>
                        <h4 className="text-sm font-black mt-1">
                          3사 보험 상세 정밀 비교 제안서 (56세/여/간호사)
                        </h4>
                      </div>
                      <button
                        type="button"
                        className="px-2.5 py-1 rounded-lg bg-sub-soft text-sub text-[11px] font-black"
                        onClick={() => vm.openSample("compare")}
                      >
                        전체 비교표 ↗
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-2.5 rounded-xl bg-sky-50 border-2 border-sky-500">
                        <span className="px-1.5 py-0.2 rounded bg-rose-500 text-white text-[9.5px] font-black">
                          최저가·감액無
                        </span>
                        <div className="font-black text-[#121314] mt-1">
                          신한라이프
                        </div>
                        <div className="text-sm font-black text-sky-700">
                          81,077원
                        </div>
                        <div className="text-[10px] text-[#4e5968] mt-1">
                          일반암 3천+유방암 3천
                          <br />
                          <strong>1년 감액 없음(100%)</strong>
                        </div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-[#f8fafc] border border-[#e6eaee]">
                        <span className="px-1.5 py-0.2 rounded bg-slate-700 text-white text-[9.5px] font-black">
                          가족결합 10%
                        </span>
                        <div className="font-black text-[#121314] mt-1">
                          삼성생명
                        </div>
                        <div className="text-sm font-black text-[#121314]">
                          83,858원
                        </div>
                        <div className="text-[10px] text-[#4e5968] mt-1">
                          간편(3.10.5) 심사유리
                          <br />
                          1년 이내 50% 감액
                        </div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-[#f8fafc] border border-[#e6eaee]">
                        <span className="px-1.5 py-0.2 rounded bg-orange-600 text-white text-[9.5px] font-black">
                          수술비 회당지급
                        </span>
                        <div className="font-black text-[#121314] mt-1">
                          삼성화재
                        </div>
                        <div className="text-sm font-black text-[#121314]">
                          89,220원
                        </div>
                        <div className="text-[10px] text-[#4e5968] mt-1">
                          순환계 수술 1회당 1천만
                          <br />
                          유사암 납입지원 4.3만
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  id="heroPanel_remodel"
                  className="p-4 sm:p-5 space-y-3"
                  hidden={vm.tab !== "remodel"}
                >
                  <div className="p-4 rounded-2xl bg-white text-[#121314] space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <div>
                        <span className="px-2 py-0.5 rounded bg-primary text-white text-[10px] font-black">
                          Before & After 종합진단
                        </span>
                        <h4 className="text-sm font-black mt-1">
                          고객님 보험 리모델링 진단 리포트 [1/4 ~ 4/4]
                        </h4>
                      </div>
                      <button
                        type="button"
                        className="px-2.5 py-1 rounded-lg bg-primary-soft text-primary text-[11px] font-black"
                        onClick={() => vm.openSample("remodel")}
                      >
                        4페이지 전체보기 ↗
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 text-xs">
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
                        <div className="text-[10.5px] font-bold text-[#f04452]">
                          기존 납입 중 정리 대상 (49년납 덫)
                        </div>
                        <div className="text-base font-black text-[#f04452] mt-0.5">
                          월 121,500원
                        </div>
                        <div className="text-[10px] text-[#4e5968] mt-0.5">
                          완납된 우량계약 3건(암 1.1억)은 100% 유지!
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-primary-soft border-2 border-primary">
                        <div className="text-[10.5px] font-black text-primary">
                          신규 3사 맞춤 포트폴리오
                        </div>
                        <div className="text-base font-black text-primary mt-0.5">
                          월 191,041원
                        </div>
                        <div className="text-[10px] text-[#121314] font-bold mt-0.5">
                          비통치 1억 + 순통치 5천 + 간병 20만 구축!
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-14 sm:py-16 bg-white border-b border-[#e6eaee]">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="px-3 py-1 rounded-full bg-primary-soft text-primary text-xs font-black tracking-wider">
              ONE SIMPLE FLOW
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#121314]">
              올리고, 이해하고, 마음을 움직이세요.
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-[#4e5968]">
              보조개가 복잡한 문서를 고객과의 대화로 바꾸는 4단계 과정입니다.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="ns-card ns-card-hover p-6 bg-[#f8fafc] flex flex-col justify-between space-y-4">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-lg bg-[#121314] text-emerald-400 font-mono text-xs font-black">
                    01 · UPLOAD
                  </span>
                  <Icon name="file-up" className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-base font-black text-[#121314]">
                  수십 장의 제안서를 그대로 올리세요
                </h3>
                <p className="text-xs font-semibold text-[#4e5968] leading-relaxed">
                  30~50페이지 원본 PDF를 다시 읽고 옮겨 적을 필요가 없습니다.
                  보조개가 제안서의 구조부터 파악합니다.
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-white border border-[#e6eaee] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-rose-50 text-[#f04452] font-black text-[10px]">
                    PDF
                  </span>
                  <span className="font-extrabold text-[#121314]">
                    고객 맞춤 제안서
                  </span>
                </div>
                <span className="text-[11px] font-bold text-primary">
                  42p · 준비 완료
                </span>
              </div>
            </div>

            <div className="ns-card ns-card-hover p-6 bg-[#f8fafc] flex flex-col justify-between space-y-4">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-lg bg-[#121314] text-emerald-400 font-mono text-xs font-black">
                    02 · ANALYZE
                  </span>
                  <Icon name="cpu" className="w-5 h-5 text-sub" />
                </div>
                <h3 className="text-base font-black text-[#121314]">
                  설명해야 할 핵심만 AI가 골라냅니다
                </h3>
                <p className="text-xs font-semibold text-[#4e5968] leading-relaxed">
                  암·뇌·심장 3대 진단비, 수술비, 보험료와 갱신 주기를 고객이
                  이해하기 쉬운 순서로 재구성합니다.
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-white border border-[#e6eaee] flex flex-wrap gap-1.5">
                <span className="px-2 py-0.5 rounded bg-primary-soft text-primary text-[10.5px] font-black">
                  3대 진단비
                </span>
                <span className="px-2 py-0.5 rounded bg-sub-soft text-sub text-[10.5px] font-black">
                  수술·치료비
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 text-[10.5px] font-black">
                  갱신 주기
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-100 text-[#121314] text-[10.5px] font-black">
                  월 보험료
                </span>
              </div>
            </div>

            <div className="ns-card ns-card-hover p-6 bg-[#f8fafc] flex flex-col justify-between space-y-4">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-lg bg-[#121314] text-emerald-400 font-mono text-xs font-black">
                    03 · BRIEF
                  </span>
                  <Icon
                    name="layout-template"
                    className="w-5 h-5 text-primary"
                  />
                </div>
                <h3 className="text-base font-black text-[#121314]">
                  고객 눈높이의 한 장 브리핑으로
                </h3>
                <p className="text-xs font-semibold text-[#4e5968] leading-relaxed">
                  복잡한 담보표 대신 중요한 보장과 체크포인트가 또렷한 고객
                  맞춤형 요약 페이지가 완성됩니다.
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-primary-soft/60 border border-emerald-200 flex items-center justify-between text-xs">
                <span className="font-extrabold text-[#121314]">
                  고객님을 위한 보장 브리핑
                </span>
                <span className="px-2 py-0.5 rounded bg-primary text-white text-[10px] font-black">
                  든든해요
                </span>
              </div>
            </div>

            <div className="ns-card ns-card-hover p-6 bg-[#f8fafc] flex flex-col justify-between space-y-4">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-lg bg-[#121314] text-emerald-400 font-mono text-xs font-black">
                    04 · CONNECT
                  </span>
                  <Icon name="send" className="w-5 h-5 text-amber-500" />
                </div>
                <h3 className="text-base font-black text-[#121314]">
                  카톡으로 보내고 상담에 집중하세요
                </h3>
                <p className="text-xs font-semibold text-[#4e5968] leading-relaxed">
                  비대면으로 바로 공유하고, 고객의 질문과 상담에 집중하세요.
                  이해하기 쉬운 설명이 소개 계약으로 이어집니다.
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-[#fee500]/30 border border-amber-300 flex items-center justify-between text-xs">
                <span className="font-extrabold text-[#121314]">
                  💬 맞춤 보장 브리핑 링크
                </span>
                <span className="px-2 py-0.5 rounded bg-[#121314] text-[#fee500] text-[10px] font-black">
                  전송 완료
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-16 sm:py-20 bg-[#0f172a] text-white">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-black">
                <span>ALL-IN-ONE 8 WEAPONS</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
                모든 요금제에서 100% 개방되는{" "}
                <span className="text-[#03c75a]">보조개 8대 실전 무기</span>
              </h2>
              <p className="text-xs sm:text-sm font-semibold text-slate-300">
                단순 요약을 넘어 미청구 보험금 발굴, 알릴의무 고지 추출,
                리모델링 비교, 무료 모바일팩스 청구, 보조개톡 자동화까지 하나로
                통합했습니다.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <span className="px-3 py-2 rounded-xl bg-white/10 text-xs font-extrabold text-emerald-300 border border-white/10">
                AI 보고서 생성(01~06): 문서 생성 이용량 적용
              </span>
              <span className="px-3 py-2 rounded-xl bg-[#03c75a]/20 text-xs font-black text-white border border-[#03c75a]">
                🎁 모바일 웹팩스(07) & 보조개톡(08): 전 회원 무료
              </span>
            </div>
          </div>

          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
            id="eightWeaponsGrid"
          >
            {vm.weapons}
          </div>
        </div>
      </section>

      <section
        id="demo-preview"
        className="py-16 sm:py-20 bg-white border-b border-[#e6eaee]"
      >
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 text-[#ff0033] border border-rose-200 text-xs font-black">
                <Icon name="youtube" className="w-3.5 h-3.5" />
                <span>LIVE VIDEO SHOWCASE (@bojogae-ai)</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-[#121314]">
                백 마디 말보다 확실한{" "}
                <span className="text-primary">
                  보조개 AI 실전 작동 영상 10선
                </span>
              </h2>
              <p className="text-xs sm:text-sm font-semibold text-[#4e5968]">
                제안서 요약 보고서 생성부터 리모델링 보고서, 미청구 보험금 찾기,
                무료 모바일팩스 전송까지 클릭 즉시 영상으로 확인해 보세요.
              </p>
            </div>

            <a
              href="https://www.youtube.com/@bojogae-ai"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-[#121314] hover:bg-primary text-white text-xs font-black flex items-center gap-2 shrink-0 transition-colors"
            >
              <svg viewBox="0 0 40 40" className="w-4 h-4 rounded bg-[#2b282c]">
                <path
                  d="M11 16 L15 18.5 L11 21"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="28" cy="18.5" r="2.3" fill="#ffffff" />
                <circle cx="9.5" cy="24.5" r="2.4" fill="#ff8a75" />
                <circle cx="30.5" cy="24.5" r="2.4" fill="#ff8a75" />
                <path
                  d="M14.5 25.5 Q20 30 25.5 25.5"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                />
              </svg>
              <span>보조개 AI 공식 유튜브 채널 바로가기 ↗</span>
            </a>
          </div>

          <div
            id="homeYoutubeGrid"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4"
          >
            {vm.videos}
          </div>
        </div>
      </section>

      <section
        id="power-suites"
        className="py-16 sm:py-20 bg-[#f4f6f8] border-b border-[#e6eaee]"
      >
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-3xl mx-auto space-y-2">
            <span className="px-3 py-1 rounded-full bg-sub-soft text-sub text-xs font-black">
              NEW POWER SUITES
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-[#121314]">
              제안서 생성 그 이상,{" "}
              <span className="text-sub">설계사의 하루 업무 전체</span>를
              자동화합니다
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-[#4e5968]">
              타사 서비스 여러 개를 따로 구독할 필요 없이 보조개 하나로 카톡
              발송, 보험금 청구, 고객·계약 스케줄 관리까지 완벽하게 해결하세요.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="ns-card p-6 sm:p-7 bg-white flex flex-col justify-between space-y-5 border-2 border-transparent hover:border-primary">
              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="px-3 py-1 rounded-full bg-[#fee500] text-[#191600] text-xs font-black flex items-center gap-1.5">
                    <Icon name="message-circle" className="w-3.5 h-3.5" />
                    <span>01 · 보조개톡 (KAKAO AUTO SENDER)</span>
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-primary-soft text-primary text-xs font-black">
                    전 회원 무료
                  </span>
                </div>
                <h3 className="text-xl font-black text-[#121314]">
                  PC 카카오톡 대량 안부·리포트 자동 발송 도우미
                </h3>
                <p className="text-xs sm:text-sm font-semibold text-[#4e5968] leading-relaxed">
                  내고객에 등록된 <strong>카톡대화명</strong>으로 PC 카카오톡
                  친구를 자동 매칭하여, 그룹별 안부 인사·명절 카드·생일
                  축하·상용구와 내 명함 서명을 원클릭 또는 예약 전송합니다.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#f8fafc] border border-[#e6eaee] space-y-2.5 text-xs">
                <div className="flex items-center justify-between font-black text-[#121314]">
                  <span>
                    🟢 보조개 내고객 1,355명 · 🔗 카톡대화명 자동 연결
                  </span>
                  <span className="text-primary">예약 발송 지원</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[11px] font-bold text-[#4e5968]">
                  <div className="p-2 rounded-lg bg-white border border-[#e6eaee]">
                    ✓ 그룹별 일괄전송
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-[#e6eaee]">
                    ✓ 상용구·명함서명 치환
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-[#e6eaee]">
                    ✓ 이미지+텍스트 동시발송
                  </div>
                </div>
              </div>
            </div>

            <div className="ns-card p-6 sm:p-7 bg-white flex flex-col justify-between space-y-5 border-2 border-transparent hover:border-primary">
              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="px-3 py-1 rounded-full bg-primary-soft text-primary text-xs font-black flex items-center gap-1.5">
                    <Icon name="receipt" className="w-3.5 h-3.5" />
                    <span>02 · 40개 보험사 원스톱 보험금 청구</span>
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-primary text-white text-xs font-black">
                    모바일팩스 발송 무료
                  </span>
                </div>
                <h3 className="text-xl font-black text-[#121314]">
                  한 번 입력으로 여러 보험사 청구서 자동 완성 & 팩스 전송
                </h3>
                <p className="text-xs sm:text-sm font-semibold text-[#4e5968] leading-relaxed">
                  손해보험·공제 19곳 + 생명보험 21곳 총{" "}
                  <strong>40개 보험사 공식 청구서 양식</strong>을 지원합니다.
                  스마트폰에서 [청구내역 → 공유하기]로 모바일팩스 앱을 통해
                  보내면 <strong>이용량 차감 없이 100% 무료</strong>로
                  발송됩니다.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#f8fafc] border border-[#e6eaee] flex items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="font-black text-[#121314]">
                    1단계 보험사 복수선택 → 2단계 전자서명 → 3단계 영수증첨부 →
                    4단계 팩스전송
                  </div>
                  <div className="text-[11px] font-semibold text-[#8b95a1]">
                    저장 후 1시간 임시보관 및 주민번호 자동 마스킹 보관본 제공
                  </div>
                </div>
                <button
                  type="button"
                  className="px-3.5 py-2 rounded-xl bg-[#ff0033] text-white font-black shrink-0 flex items-center gap-1"
                  onClick={() => vm.openVideo(2)}
                >
                  <Icon name="play" className="w-3.5 h-3.5 fill-current" />{" "}
                  무료팩스 영상
                </button>
              </div>
            </div>

            <div className="ns-card p-6 sm:p-7 bg-white flex flex-col justify-between space-y-5 border-2 border-transparent hover:border-sub">
              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="px-3 py-1 rounded-full bg-sub-soft text-sub text-xs font-black flex items-center gap-1.5">
                    <Icon name="bell-ring" className="w-3.5 h-3.5" />
                    <span>03 · 내고객 · 내계약 · 할 일 자동 스케줄러</span>
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-[#b45309] text-xs font-black">
                    상령일·면책·감액·생일 자동계산
                  </span>
                </div>
                <h3 className="text-xl font-black text-[#121314]">
                  놓치기 쉬운 고객 터치 골든타임을 자동으로 브리핑
                </h3>
                <p className="text-xs sm:text-sm font-semibold text-[#4e5968] leading-relaxed">
                  고객의 생년월일과 청약 완료된 계약 성립일·보장개시일만 입력해
                  두세요.{" "}
                  <strong>
                    ① 상령일(생일+6개월), ② 암 면책기간(90일) 종료일, ③
                    감액기간(1~2년) 종료일, ④ 고객 생일
                  </strong>
                  을 계산해 [할 일·방문 일정] 상단에 자동으로 띄워줍니다.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-black text-center">
                <div className="p-2.5 rounded-xl bg-amber-50 text-[#b45309] border border-amber-200">
                  📈 상령일 도래 알림
                </div>
                <div className="p-2.5 rounded-xl bg-primary-soft text-primary border border-emerald-200">
                  🛡️ 90일 면책종료
                </div>
                <div className="p-2.5 rounded-xl bg-sub-soft text-sub border border-purple-200">
                  🎉 1~2년 감액종료
                </div>
                <div className="p-2.5 rounded-xl bg-rose-50 text-[#f04452] border border-rose-200">
                  🎂 생일·주변고객지도
                </div>
              </div>
            </div>

            <div className="ns-card p-6 sm:p-7 bg-white flex flex-col justify-between space-y-5 border-2 border-transparent hover:border-sub">
              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="px-3 py-1 rounded-full bg-slate-100 text-[#121314] text-xs font-black flex items-center gap-1.5">
                    <Icon
                      name="landmark"
                      className="w-3.5 h-3.5 text-primary"
                    />
                    <span>04 · 40개 보험사 전산 · 업무 정보 허브</span>
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-[#4e5968] text-xs font-extrabold">
                    생명 21 · 손해 14 · 공제 5
                  </span>
                </div>
                <h3 className="text-xl font-black text-[#121314]">
                  GA/교차 설계사 전산 포털 & 콜센터·카드납·청구팩스 총집합
                </h3>
                <p className="text-xs sm:text-sm font-semibold text-[#4e5968] leading-relaxed">
                  매번 찾느라 시간 뺏기던 40개 보험사별{" "}
                  <strong>
                    GA/LC 설계사 업무 시스템 바로가기,
                    고객센터·인콜모니터링·전산헬프데스크·청구팩스 번호 원클릭
                    복사, 초회/계속분 카드납 제휴 정보, 약관·청구양식 링크
                  </strong>
                  를 한눈에 제공합니다.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#f8fafc] border border-[#e6eaee] flex items-center justify-between text-xs">
                <span className="font-bold text-[#4e5968]">
                  고객센터 · 인콜 모니터링 · 전산 헬프데스크 · 보험금 청구 팩스
                  원클릭 복사
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-[#121314] text-emerald-400 font-black text-[11px]">
                  40개사 완비
                </span>
              </div>
            </div>
          </div>

          <div className="ns-card p-6 bg-white space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#f1f5f9] pb-3">
              <div>
                <span className="text-[11px] font-black text-primary">
                  7-STEP SALES PIPELINE
                </span>
                <h3 className="text-base sm:text-lg font-black text-[#121314]">
                  보험영업 7단계 프로세스 vs 보조개 AI 적용 무기
                </h3>
              </div>
              <span className="text-xs font-bold text-[#8b95a1]">
                가망고객 발굴부터 사후관리·소개 창출까지 빈틈없는 파이프라인
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-2.5 text-xs">
              <div className="p-3 rounded-2xl bg-[#f8fafc] border border-[#e6eaee] space-y-1">
                <span className="px-2 py-0.5 rounded bg-[#121314] text-white text-[10px] font-black">
                  STEP 01
                </span>
                <div className="font-black text-[#121314] pt-1">
                  가망고객 발굴
                </div>
                <div className="text-[11px] font-bold text-primary">
                  고객관리 / 내고객
                </div>
                <div className="text-[10.5px] text-[#8b95a1]">
                  부재·보류 DB 그룹 분류
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-[#f8fafc] border border-[#e6eaee] space-y-1">
                <span className="px-2 py-0.5 rounded bg-[#121314] text-white text-[10px] font-black">
                  STEP 02
                </span>
                <div className="font-black text-[#121314] pt-1">
                  접근·상담약속(TA)
                </div>
                <div className="text-[11px] font-bold text-primary">
                  할 일·방문 일정 & 지도
                </div>
                <div className="text-[10.5px] text-[#8b95a1]">
                  주변 고객 지도·길찾기
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-[#f8fafc] border border-[#e6eaee] space-y-1">
                <span className="px-2 py-0.5 rounded bg-[#03c75a] text-white text-[10px] font-black">
                  STEP 03
                </span>
                <div className="font-black text-[#121314] pt-1">
                  상담정보 수집(AP)
                </div>
                <div className="text-[11px] font-bold text-primary">
                  미청구 보험금·고지추출
                </div>
                <div className="text-[10.5px] text-[#8b95a1]">
                  건강e음 기반 오프닝 무기
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-[#f8fafc] border border-[#e6eaee] space-y-1">
                <span className="px-2 py-0.5 rounded bg-[#03c75a] text-white text-[10px] font-black">
                  STEP 04
                </span>
                <div className="font-black text-[#121314] pt-1">
                  보장분석·맞춤제안
                </div>
                <div className="text-[11px] font-bold text-primary">
                  보장분석·상품비교·1장요약
                </div>
                <div className="text-[10.5px] text-[#8b95a1]">
                  2~5개 보험사 정밀비교
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-[#f8fafc] border border-[#e6eaee] space-y-1">
                <span className="px-2 py-0.5 rounded bg-[#03c75a] text-white text-[10px] font-black">
                  STEP 05
                </span>
                <div className="font-black text-[#121314] pt-1">
                  청약·계약체결(PT)
                </div>
                <div className="text-[11px] font-bold text-primary">
                  리모델링 종합 리포트
                </div>
                <div className="text-[10.5px] text-[#8b95a1]">
                  전/후 누적보장 완벽비교
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-[#f8fafc] border border-[#e6eaee] space-y-1">
                <span className="px-2 py-0.5 rounded bg-sub text-white text-[10px] font-black">
                  STEP 06
                </span>
                <div className="font-black text-[#121314] pt-1">
                  증권전달·내용확인
                </div>
                <div className="text-[11px] font-bold text-sub">
                  고객관리 / 내계약
                </div>
                <div className="text-[10.5px] text-[#8b95a1]">
                  면책·감액·상령일 등록
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-[#f8fafc] border border-[#e6eaee] space-y-1">
                <span className="px-2 py-0.5 rounded bg-sub text-white text-[10px] font-black">
                  STEP 07
                </span>
                <div className="font-black text-[#121314] pt-1">
                  사후관리·소개창출
                </div>
                <div className="text-[11px] font-bold text-sub">
                  무료 모바일팩스 & 보조개톡
                </div>
                <div className="text-[10.5px] text-[#8b95a1]">
                  평생 고객 감동 시스템
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="benefits"
        className="py-16 sm:py-20 bg-white border-b border-[#e6eaee]"
      >
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-3xl mx-auto space-y-2">
            <span className="px-3 py-1 rounded-full bg-primary-soft text-primary text-xs font-black">
              WHY BOJOGAE?
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-[#121314]">
              왜 잘 팔리는 설계사는{" "}
              <span className="text-primary">‘보조개’</span>를 쓸까요?
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-[#4e5968]">
              수많은 보장 내용과 깨알 같은 글씨로 가득한 설계서는 고객을
              망설이게 합니다.
              <br />
              보조개는 설계사의 시간 비용을 없애고, 고객에게는 “당장 계약하고
              싶은 확신”을 선물합니다.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            <div className="lg:col-span-5 ns-card p-6 sm:p-7 bg-rose-50/50 border-rose-200 flex flex-col justify-between space-y-5">
              <div className="space-y-2">
                <span className="px-2.5 py-1 rounded-lg bg-rose-100 text-[#f04452] text-xs font-black">
                  기존의 힘든 영업 방식
                </span>
                <h3 className="text-xl font-black text-[#121314] flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#f04452] text-white text-xs flex items-center justify-center">
                    ✕
                  </span>
                  <span>보조개를 쓰기 전</span>
                </h3>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-4 rounded-2xl bg-white border border-rose-200 space-y-1">
                  <div className="font-black text-sm text-[#f04452]">
                    야근을 부르는 제안서 수작업
                  </div>
                  <p className="text-[#4e5968] font-semibold leading-relaxed">
                    고객 1명을 위해 30~50장짜리 설계서를 뜯어보며 엑셀·PPT로
                    재가공하느라 매일 밤 11시 퇴근.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-rose-200 space-y-1">
                  <div className="font-black text-sm text-[#f04452]">
                    복잡한 약관 표에 지쳐 읽지 않는 고객
                  </div>
                  <p className="text-[#4e5968] font-semibold leading-relaxed">
                    카톡으로 원본 PDF를 보내도 글씨가 작고 어려워 읽지 않고
                    “생각해 볼게요”라며 상담 단절.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-rose-200 space-y-1">
                  <div className="font-black text-sm text-[#f04452]">
                    고지 누락 불안감 & 청구 대행에 뺏기는 시간
                  </div>
                  <p className="text-[#4e5968] font-semibold leading-relaxed">
                    5년치 진료기록 일일이 대조하다 실수하고, 보험사마다 다른
                    청구서 양식 뽑아 팩스 보내느라 진땀.
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 ns-card p-6 sm:p-7 bg-gradient-to-br from-[#ecfdf5] via-white to-[#f5f3ff] border-2 border-[#03c75a] flex flex-col justify-between space-y-5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="space-y-1">
                  <span className="px-2.5 py-1 rounded-lg bg-primary text-white text-xs font-black">
                    AI 실무 자동화 도입 후
                  </span>
                  <h3 className="text-xl font-black text-[#121314] flex items-center gap-2 pt-1">
                    <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center">
                      ✓
                    </span>
                    <span>보조개 AI와 함께하는 상위 1% 영업 공식</span>
                  </h3>
                </div>
                <span className="px-3 py-1.5 rounded-xl bg-[#121314] text-emerald-400 text-xs font-black">
                  업무시간 90% 단축
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                <div className="p-4 rounded-2xl bg-white border border-emerald-200 space-y-1.5 shadow-2xs">
                  <div className="font-black text-sm text-primary">
                    ✓ 거절했던 가망고객 재성약
                  </div>
                  <p className="text-[#4e5968] font-semibold leading-relaxed">
                    스마트폰에서 한눈에 읽히는 맞춤형 페이지로 “이해하기 너무
                    쉽다”며 상담 신청 역주행.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-emerald-200 space-y-1.5 shadow-2xs">
                  <div className="font-black text-sm text-primary">
                    ✓ 고객 감동이 부르는 자발적 소개
                  </div>
                  <p className="text-[#4e5968] font-semibold leading-relaxed">
                    미청구 보험금을 찾아주고 깔끔한 리포트를 보내주니 고객이
                    가족·지인에게 그대로 공유하며 소개 계약 연결.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-emerald-200 space-y-1.5 shadow-2xs">
                  <div className="font-black text-sm text-sub">
                    ✓ AI 초고속 핵심 요약 & 3사 비교
                  </div>
                  <p className="text-[#4e5968] font-semibold leading-relaxed">
                    암·뇌·심장 3대 진단비, 수술비, 특약 갱신 주기를 AI가 스캔해
                    설계사가 브리핑하기 가장 편한 순서로 재배열.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-emerald-200 space-y-1.5 shadow-2xs">
                  <div className="font-black text-sm text-sub">
                    ✓ 비대면 카톡 발송 & 무료 모바일팩스
                  </div>
                  <p className="text-[#4e5968] font-semibold leading-relaxed">
                    보조개톡 자동발송과 40개 보험사 무료 모바일팩스 청구로 대면
                    만남을 꺼리던 고객과도 긴밀하게 소통.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="reviews"
        className="py-16 sm:py-20 bg-[#f4f6f8] border-b border-[#e6eaee]"
      >
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="px-3 py-1 rounded-full bg-sub-soft text-sub text-xs font-black">
              FIELD REVIEWS
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#121314]">
              현장 GA 설계사·지점장님들의 생생한 후기
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-[#4e5968]">
              신입 설계사 조기 정착부터 베테랑 설계사의 리모델링 클로징까지
              현장이 증명합니다.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
            <div className="ns-card p-6 bg-white flex flex-col justify-between space-y-4">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-amber-500 font-black">★★★★★ 5.0</span>
                  <span className="px-2 py-0.5 rounded bg-primary-soft text-primary font-black text-[10.5px]">
                    리모델링·3사비교
                  </span>
                </div>
                <h3 className="text-sm font-black text-[#121314]">
                  “3사 비교표와 리모델링 전후 비교표 보여주니 그 자리에서
                  사인하셨어요”
                </h3>
                <p className="text-[#4e5968] font-semibold leading-relaxed">
                  예전에는 밤새 엑셀로 비교표 만들었는데, 보조개에 PDF 3개
                  넣으니 1분 만에 신한·삼성·KB 비교 리포트가 딱 나옵니다.
                  고객님이 너무 깔끔하다고 남편 보험까지 맡기셨습니다.
                </p>
              </div>
              <div className="pt-3 border-t border-[#f1f5f9] flex items-center justify-between font-bold text-[#8b95a1]">
                <span>현대홈쇼핑 GA · 강대한지점 팀장</span>
                <span className="text-[#121314]">스탠다드 이용 중</span>
              </div>
            </div>

            <div className="ns-card p-6 bg-white flex flex-col justify-between space-y-4">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-amber-500 font-black">★★★★★ 5.0</span>
                  <span className="px-2 py-0.5 rounded bg-sub-soft text-sub font-black text-[10.5px]">
                    미청구 보험금·무료팩스
                  </span>
                </div>
                <h3 className="text-sm font-black text-[#121314]">
                  “건강e음 미청구 보험금 찾기로 거절 고객 DB를 살려냈습니다”
                </h3>
                <p className="text-[#4e5968] font-semibold leading-relaxed">
                  초회 면담 때 건강e음 기록으로 숨은 보험금 찾아드리고,
                  보조개에서 바로 3개 보험사 청구서 만들어 모바일팩스로 무료
                  전송해 드리니 신뢰도가 급상승했습니다.
                </p>
              </div>
              <div className="pt-3 border-t border-[#f1f5f9] flex items-center justify-between font-bold text-[#8b95a1]">
                <span>대형 GA · 8년차 베테랑 FC</span>
                <span className="text-[#121314]">프로 이용 중</span>
              </div>
            </div>

            <div className="ns-card p-6 bg-white flex flex-col justify-between space-y-4">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-amber-500 font-black">★★★★★ 5.0</span>
                  <span className="px-2 py-0.5 rounded bg-amber-50 text-[#b45309] font-black text-[10.5px]">
                    사무실 그룹 도입
                  </span>
                </div>
                <h3 className="text-sm font-black text-[#121314]">
                  “신입 설계사 교육 기간이 3개월에서 1주로 줄었습니다”
                </h3>
                <p className="text-[#4e5968] font-semibold leading-relaxed">
                  지점 단위로 도입했는데, 신입 설계사들도 건강e음 고지사항 자동
                  추출과 제안서 1장 요약 덕분에 고지위반 걱정 없이 첫 달부터
                  자신감 있게 상담하고 있습니다.
                </p>
              </div>
              <div className="pt-3 border-t border-[#f1f5f9] flex items-center justify-between font-bold text-[#8b95a1]">
                <span>GA 사업단 지점장 (설계사 35명)</span>
                <span className="text-[#121314]">사무실 그룹 플랜</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="pricing"
        className="py-16 sm:py-20 bg-white border-b border-[#e6eaee]"
      >
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-3xl mx-auto space-y-2">
            <span className="px-3 py-1 rounded-full bg-primary-soft text-primary text-xs font-black">
              TRANSPARENT PRICING & COST SAVING
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-[#121314]">
              부담 없는 요금, 압도적인 가성비
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-[#4e5968]">
              어떤 요금제를 선택하셔도 8대 실전 무기, 무료 모바일팩스 청구,
              보조개톡, 고객·계약 관리 기능을 100% 동일하게 이용하실 수
              있습니다.
            </p>
          </div>

          <div className="ns-card p-6 sm:p-8 bg-gradient-to-br from-[#121314] via-[#192129] to-[#0f291e] text-white border-2 border-[#03c75a]/40 shadow-2xl space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-5">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-black">
                  <span>💡 왜 여러 서비스를 따로 결제하시나요?</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  타사 서비스 3종을 따로 조합해 쓰는 것보다{" "}
                  <span className="text-[#03c75a]">
                    보조개 하나로 최대 80% 절감
                  </span>
                  하세요!
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 font-semibold">
                  범용 AI 유료 구독 + 보장분석·청구 솔루션 + 카톡 자동발송
                  프로그램을 각각 결제하면 매달 10만 원 이상이 고정 지출됩니다.
                </p>
              </div>
              <div className="px-4 py-3 rounded-2xl bg-[#03c75a]/20 border border-[#03c75a] text-right shrink-0">
                <div className="text-[11px] font-bold text-emerald-300">
                  연간 고정비 절감 효과
                </div>
                <div className="text-xl sm:text-2xl font-black text-white">
                  연 최대 134만 원 절약
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              <div className="lg:col-span-5 p-5 sm:p-6 rounded-2xl bg-white/5 border border-rose-500/30 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 text-xs font-black">
                      기존 개별 서비스 3종 조합 시
                    </span>
                    <span className="text-xs font-bold text-slate-400">
                      매달 고정 지출 부담
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                      <div>
                        <div className="font-black text-white">
                          ① 범용 AI 유료 구독 (제미나이 프로·GPT 등)
                        </div>
                        <div className="text-[11px] text-slate-400">
                          보험 전용 서식 없음 · 프롬프트 직접 입력 필요
                        </div>
                      </div>
                      <span className="font-mono font-black text-rose-300 shrink-0">
                        월 29,000원
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                      <div>
                        <div className="font-black text-white">
                          ② 타사 보장분석·청구 솔루션 A사 (인*아이 등)
                        </div>
                        <div className="text-[11px] text-slate-400">
                          단순 분석 위주 · 요금제별 차등 과금
                        </div>
                      </div>
                      <span className="font-mono font-black text-rose-300 shrink-0">
                        월 38,000~103,000원
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                      <div>
                        <div className="font-black text-white">
                          ③ 타사 고객관리·카톡 발송 솔루션 B사 (보*어 등)
                        </div>
                        <div className="text-[11px] text-slate-400">
                          카톡 안부 발송 및 청구서 기능 별도 결제
                        </div>
                      </div>
                      <span className="font-mono font-black text-rose-300 shrink-0">
                        월 29,000원
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-500/40 flex items-center justify-between">
                  <span className="text-xs font-extrabold text-rose-200">
                    3종 합산 매월 고정 지출
                  </span>
                  <div className="text-right">
                    <span className="text-lg sm:text-xl font-black text-rose-400 line-through">
                      월 96,000원 ~ 161,000원
                    </span>
                    <div className="text-[10.5px] text-slate-400">
                      프로그램 3개를 따로 로그인·관리하는 불편함까지
                    </div>
                  </div>
                </div>
              </div>

              <div className="hidden lg:flex lg:col-span-1 items-center justify-center">
                <div className="w-11 h-11 rounded-full bg-[#03c75a] text-white flex items-center justify-center shadow-lg">
                  <Icon name="arrow-right" className="w-6 h-6" />
                </div>
              </div>

              <div className="lg:col-span-6 p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-[#03c75a]/20 via-white/10 to-[#6b38fb]/20 border-2 border-[#03c75a] flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="px-3 py-1 rounded-lg bg-[#03c75a] text-white text-xs font-black">
                      ✓ 보조개 AI 하나로 통합 사용 시
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-[#121314] text-xs font-black">
                      8대 무기 + 보조개톡 + 무료 모바일팩스 전부 포함
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                    <div className="p-3.5 rounded-xl bg-[#121314]/80 border border-white/15 space-y-1">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-black">
                        -80% 비용 절감
                      </span>
                      <div className="font-bold text-slate-300 pt-1">
                        최소 비용 시작 (베이직)
                      </div>
                      <div className="text-xs text-slate-400 line-through">
                        타사 조합 96,000원
                      </div>
                      <div className="text-lg font-black text-white">
                        월 19,000원
                      </div>
                      <div className="text-[10.5px] text-emerald-400 font-bold">
                        매월 77,000원 절약!
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#03c75a]/25 border-2 border-[#03c75a] space-y-1">
                      <span className="px-2 py-0.5 rounded bg-[#03c75a] text-white text-[10px] font-black">
                        BEST 추천 · -76% 절감
                      </span>
                      <div className="font-bold text-white pt-1">
                        주력 플랜 (스탠다드)
                      </div>
                      <div className="text-xs text-slate-300 line-through">
                        타사 조합 120,000원
                      </div>
                      <div className="text-lg font-black text-emerald-300">
                        월 29,000원
                      </div>
                      <div className="text-[10.5px] text-white font-bold">
                        월 약 50번 문서 생성 가능 + 무료 팩스/카톡
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#121314]/80 border border-white/15 space-y-1">
                      <span className="px-2 py-0.5 rounded bg-purple-500/30 text-purple-300 text-[10px] font-black">
                        -70% 비용 절감
                      </span>
                      <div className="font-bold text-slate-300 pt-1">
                        대용량 헤비유저 (프로)
                      </div>
                      <div className="text-xs text-slate-400 line-through">
                        타사 조합 161,000원
                      </div>
                      <div className="text-lg font-black text-white">
                        월 49,000원
                      </div>
                      <div className="text-[10.5px] text-purple-300 font-bold">
                        매월 112,000원 절약!
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-black/40 border border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Icon
                      name="check-circle-2"
                      className="w-4 h-4 text-[#03c75a] shrink-0"
                    />
                    <span className="font-bold text-slate-200">
                      AI 보고서 6종 + 무료 모바일팩스 청구 + 보조개톡 +
                      내고객·내계약 알림까지 추가 비용 0원!
                    </span>
                  </div>
                  <button
                    type="button"
                    className="px-3.5 py-1.5 rounded-lg bg-[#03c75a] hover:bg-[#00b04e] text-white font-black shrink-0"
                    onClick={() => vm.login("trial")}
                  >
                    먼저 30일 무료 체험 →
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-stretch">
            <div className="ns-card p-5 bg-[#f8fafc] flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded bg-slate-200 text-[#4e5968] text-[10.5px] font-black">
                    첫 시작 체험
                  </span>
                  <span className="text-[10.5px] font-bold text-[#8b95a1]">
                    카드 등록 불필요
                  </span>
                </div>
                <h3 className="text-lg font-black text-[#121314]">무료체험</h3>
                <div>
                  <span className="text-2xl font-black text-[#121314]">
                    0원
                  </span>
                  <span className="text-xs font-bold text-[#8b95a1]">
                    {" "}
                    / 30일
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-[#e6eaee] text-xs font-extrabold text-[#121314]">
                  30일간 약 20번 문서 생성 가능
                </div>
                <ul className="space-y-1.5 text-xs font-semibold text-[#4e5968] pt-1">
                  <li>✓ 가입 즉시 문서 생성 체험</li>
                  <li>✓ 제안서 분석·보고서 생성 체험</li>
                  <li>✓ 모바일 웹팩스 무료 & 보조개톡 무료</li>
                  <li>✓ 카드 등록 없이 30일 무료체험</li>
                </ul>
              </div>
              <button
                type="button"
                className="w-full py-2.5 rounded-xl bg-white border-2 border-[#121314] hover:bg-[#121314] hover:text-white text-xs font-black transition-colors"
                onClick={() => vm.login("trial")}
              >
                무료로 시작하기 →
              </button>
            </div>

            <div className="ns-card p-5 bg-white flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded bg-primary-soft text-primary text-[10.5px] font-black">
                    가볍게 시작
                  </span>
                  <span className="text-[10.5px] font-bold text-[#8b95a1]">
                    1건당 약 633원
                  </span>
                </div>
                <h3 className="text-lg font-black text-[#121314]">베이직</h3>
                <div>
                  <span className="text-2xl font-black text-[#121314]">
                    19,000원
                  </span>
                  <span className="text-xs font-bold text-[#8b95a1]">
                    {" "}
                    / 월
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#fffbeb] border border-[#fde68a] text-xs font-extrabold text-[#92400e]">
                  월 약 30번 문서 생성 가능
                </div>
                <ul className="space-y-1.5 text-xs font-semibold text-[#4e5968] pt-1">
                  <li>✓ 월 약 30번 문서 생성 가능</li>
                  <li>✓ 8대 실전 무기 무제한 개방</li>
                  <li>✓ 쉬운 설명 변환 & 보고서 아카이빙</li>
                  <li>✓ 모바일 웹팩스 무료 & 보조개톡 무료</li>
                </ul>
              </div>
              <button
                type="button"
                className="w-full py-2.5 rounded-xl bg-[#121314] hover:bg-primary text-white text-xs font-black transition-colors"
                onClick={() => vm.login("personal", "BASIC")}
              >
                베이직 가입 신청 →
              </button>
            </div>

            <div className="ns-card p-5 bg-primary-soft/40 border-2 border-[#03c75a] flex flex-col justify-between space-y-4 relative shadow-lg">
              <span className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full bg-[#03c75a] text-white text-[10px] font-black shadow-xs">
                🔥 설계사 68% 선택
              </span>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded bg-primary text-white text-[10.5px] font-black">
                    가장 선호
                  </span>
                  <span className="text-[10.5px] font-extrabold text-primary">
                    1건당 약 580원
                  </span>
                </div>
                <h3 className="text-lg font-black text-[#121314]">스탠다드</h3>
                <div>
                  <span className="text-2xl font-black text-primary">
                    29,000원
                  </span>
                  <span className="text-xs font-bold text-[#4e5968]">
                    {" "}
                    / 월
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-emerald-300 text-xs font-black text-primary">
                  월 약 50번 문서 생성 가능
                </div>
                <ul className="space-y-1.5 text-xs font-bold text-[#121314] pt-1">
                  <li>✓ 월 약 50번 문서 생성 가능</li>
                  <li>✓ 8대 실전 무기 무제한 개방</li>
                  <li>✓ 쉬운 설명 변환 & 보고서 아카이빙</li>
                  <li>✓ 모바일 웹팩스 무료 & 보조개톡 무료</li>
                </ul>
              </div>
              <button
                type="button"
                className="ns-hero-cta w-full py-2.5 rounded-xl text-white text-xs font-black"
                onClick={() => vm.login("personal", "STANDARD")}
              >
                스탠다드 가입 신청 →
              </button>
            </div>

            <div className="ns-card p-5 bg-white flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded bg-sub-soft text-sub text-[10.5px] font-black">
                    많이 사용하는 분께
                  </span>
                  <span className="text-[10.5px] font-extrabold text-sub">
                    1건당 490원(최저가)
                  </span>
                </div>
                <h3 className="text-lg font-black text-[#121314]">프로</h3>
                <div>
                  <span className="text-2xl font-black text-[#121314]">
                    49,000원
                  </span>
                  <span className="text-xs font-bold text-[#8b95a1]">
                    {" "}
                    / 월
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-sub-soft/50 border border-purple-200 text-xs font-black text-sub">
                  월 약 100번 문서 생성 가능
                </div>
                <ul className="space-y-1.5 text-xs font-semibold text-[#4e5968] pt-1">
                  <li>✓ 월 약 100번 문서 생성 가능</li>
                  <li>✓ 대량 DB 상담·리모델링 설계사 추천</li>
                  <li>✓ 쉬운 설명 변환 & 보고서 아카이빙</li>
                  <li>✓ 모바일 웹팩스 무료 & 보조개톡 무료</li>
                </ul>
              </div>
              <button
                type="button"
                className="w-full py-2.5 rounded-xl bg-[#121314] hover:bg-sub text-white text-xs font-black transition-colors"
                onClick={() => vm.login("personal", "PRO")}
              >
                프로 가입 신청 →
              </button>
            </div>

            <div className="ns-card p-5 bg-[#121314] text-white flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded bg-amber-500 text-[#121314] text-[10.5px] font-black">
                    지점 · 본부 · GA
                  </span>
                  <span className="text-[10.5px] font-bold text-amber-300">
                    단체 할인 적용
                  </span>
                </div>
                <h3 className="text-lg font-black text-white">사무실 그룹</h3>
                <div>
                  <span className="text-xl font-black text-emerald-400">
                    별도 문의
                  </span>
                  <span className="text-xs font-bold text-slate-400">
                    {" "}
                    / 단체 할인
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/10 border border-white/15 text-xs font-extrabold text-amber-300">
                  🏢 지점 공용/개별 이용량 풀 지원
                </div>
                <ul className="space-y-1.5 text-xs font-semibold text-slate-300 pt-1">
                  <li>✓ 사번 기반 그룹 로그인 지원</li>
                  <li>✓ 지점장 관리자 대시보드 제공</li>
                  <li>✓ 단체 맞춤형 운영 및 방문/LIVE 특강</li>
                  <li>✓ 소속 설계사 전원 8대 무기 개방</li>
                </ul>
              </div>
              <button
                type="button"
                className="w-full py-2.5 rounded-xl bg-white hover:bg-amber-400 text-[#121314] text-xs font-black transition-colors"
                onClick={vm.openInquiry}
              >
                단체 도입 문의 →
              </button>
            </div>
          </div>

          {/* Paid top-up promotion intentionally hidden. */}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="ns-card p-4 bg-[#f8fafc] space-y-1">
              <div className="font-black text-[#121314] flex items-center gap-1.5">
                <Icon name="coins" className="w-4 h-4 text-primary" />
                <span>이용량 차감 기준 (리포트 & 팩스)</span>
              </div>
              <p className="text-[#4e5968] font-semibold leading-relaxed">
                AI 보고서 생성 시 <strong>요금제별 이용량</strong>이 적용되며
                열람·편집·저장은 무료입니다. 보험금 청구 팩스는{" "}
                <strong>스마트폰 모바일팩스 연동 발송 시 무료</strong>이며, PC
                다이렉트 웹팩스 발송 시에만 이용량이 차감됩니다.
              </p>
            </div>

            <div className="ns-card p-4 bg-[#f8fafc] space-y-1">
              <div className="font-black text-[#121314] flex items-center gap-1.5">
                <Icon name="calendar-clock" className="w-4 h-4 text-sub" />
                <span>월간 구독 이용기간</span>
              </div>
              <p className="text-[#4e5968] font-semibold leading-relaxed">
                월간 구독 이용량은 해당 이용기간 종료 시 만료됩니다. 문서 생성
                횟수는 기본 기준에 따른 예상치입니다.
              </p>
            </div>

            <div className="ns-card p-4 bg-[#f8fafc] space-y-1">
              <div className="font-black text-[#121314] flex items-center gap-1.5">
                <Icon name="building-2" className="w-4 h-4 text-amber-600" />
                <span>사무실 그룹(GA 지점·사업단) 도입</span>
              </div>
              <p className="text-[#4e5968] font-semibold leading-relaxed">
                지점·사업단 단위 도입 시 사번 기반 그룹 로그인과 지점장 관리자
                대시보드, 단체 할인을 제공합니다.{" "}
                <button
                  type="button"
                  className="text-primary font-black underline"
                  onClick={vm.openInquiry}
                >
                  단체 도입 문의하기 ↗
                </button>
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-br from-[#121314] via-[#172620] to-[#0f291e] text-white">
        <div className="max-w-[960px] mx-auto px-4 sm:px-6 text-center space-y-6">
          <span className="px-3 py-1 rounded-full bg-white/10 text-emerald-300 text-xs font-black tracking-wider">
            YOUR NEXT PROPOSAL
          </span>
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
            다음 제안서는 보조개와 시작하세요.
          </h2>
          <p className="text-sm sm:text-base font-semibold text-slate-300">
            정리는 AI에게 맡기고, 설계사님은 고객의 마음에 집중하세요.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              className="w-full sm:w-auto ns-hero-cta px-8 py-4 rounded-2xl text-white text-sm sm:text-base font-black shadow-xl"
              onClick={() => vm.login("trial")}
            >
              1달 무료 체험 시작 (20회 제공)
            </button>
            <button
              type="button"
              className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm sm:text-base font-extrabold transition-all"
              onClick={vm.openInquiry}
            >
              단체 도입 문의
            </button>
          </div>
        </div>
      </section>

      <footer className="bg-white border-t border-[#e6eaee] py-10 text-xs text-[#8b95a1]">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#f1f5f9]">
            <a href="#top" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#2b282c] flex items-center justify-center">
                <svg viewBox="0 0 40 40" className="w-6 h-6">
                  <path
                    d="M11 16 L15 18.5 L11 21"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="28" cy="18.5" r="2.3" fill="#ffffff" />
                  <circle cx="9.5" cy="24.5" r="2.4" fill="#ff8a75" />
                  <circle cx="30.5" cy="24.5" r="2.4" fill="#ff8a75" />
                  <path
                    d="M14.5 25.5 Q20 30 25.5 25.5"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <span className="font-black text-sm text-[#121314]">
                보조개 · 보험설계사를 조력하는 AI 개인비서
              </span>
            </a>

            <div className="flex flex-wrap items-center gap-4 font-extrabold text-[#4e5968]">
              <button
                type="button"
                className="hover:text-primary"
                onClick={() => vm.login("group")}
              >
                단체 로그인
              </button>
              <button
                type="button"
                className="hover:text-primary"
                onClick={() => vm.login("personal")}
              >
                개인 로그인
              </button>
              <a href="#pricing" className="hover:text-primary">
                이용 요금
              </a>
              <a href="/terms" className="hover:text-primary">
                서비스이용약관
              </a>
              <a href="/privacy" className="hover:text-primary">
                개인정보처리방침
              </a>
              <a
                href="https://pf.kakao.com/_xjaxjmX/chat"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary font-black hover:underline"
              >
                카카오톡 1:1 문의 ↗
              </a>
            </div>
          </div>

          <div className="space-y-1.5 text-[11.5px] leading-relaxed">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-bold text-[#4e5968]">
              <span>상호: 마음 AI</span>
              <span>대표자: 김성춘</span>
              <span>사업자등록번호: 621-58-01016</span>
              <span>
                연락처:{" "}
                <a
                  href="tel:01097299649"
                  className="text-primary font-extrabold hover:underline"
                >
                  010-9729-9649
                </a>
              </span>
            </div>
            <div>
              주소: 서울특별시 도봉구 노해로67길 2, B2호(창동, 한국빌딩)
            </div>
            <div>
              모든 거래에 대한 책임과 환불, 민원 등은 마음 AI에서 진행합니다.
            </div>
            <div>
              민원담당자: 김성춘 · 연락처:{" "}
              <a href="tel:01097299649" className="font-bold text-[#4e5968]">
                010-9729-9649
              </a>
            </div>
            <div className="pt-2 font-extrabold text-[#4e5968]">
              © 2026 BOJOGAE. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
