import Link from "next/link";

// ─── Landing page data ──────────────────────────────────────

const FEATURES = [
  {
    icon: "📊",
    title: "운영 대시보드",
    description:
      "승인, 예외, 리스크를 한 화면에서 읽고 바로 처리합니다. 숫자가 아닌 행동 중심의 관제 화면.",
    color: "bg-brand-soft",
  },
  {
    icon: "⚡",
    title: "자동화 워크플로",
    description:
      "결재, 알림, 문서 발송을 조건 기반으로 자동 실행합니다. 반복 업무를 줄이고 예외에 집중하세요.",
    color: "bg-status-info-bg",
  },
  {
    icon: "📱",
    title: "직원 셀프서비스",
    description:
      "출퇴근, 휴가 신청, 전자 서명까지 모바일에서 한 손으로 끝냅니다. 메뉴 탐색 없이 홈에서 바로.",
    color: "bg-status-warning-bg",
  },
  {
    icon: "👥",
    title: "People Hub",
    description:
      "사람 기준으로 근태, 휴가, 문서, 승인 신호를 연결합니다. 디렉터리가 아닌 운영 허브.",
    color: "bg-brand-soft",
  },
  {
    icon: "💰",
    title: "급여 · 정산",
    description:
      "급여 계산부터 마감, 명세서 발행까지 한 흐름으로 처리합니다. 변동 사항을 놓치지 않습니다.",
    color: "bg-status-info-bg",
  },
  {
    icon: "📈",
    title: "리포트 · 인사이트",
    description:
      "인원 현황, 근태 트렌드, 이직률, 급여 분포를 자동 집계합니다. 데이터 기반 의사결정.",
    color: "bg-status-warning-bg",
  },
];

const ROLES = [
  {
    icon: "⚙️",
    title: "Platform Operator",
    description: "SaaS 운영팀이 테넌트, 과금, 지원, 보안을 관리하는 백오피스",
    modules: ["테넌트 관리", "과금", "지원", "모니터링", "감사"],
    avatarBg: "bg-[#ede9fe]",
  },
  {
    icon: "🏢",
    title: "Tenant Admin",
    description: "고객사 HR팀이 전사 인사 운영을 관리하는 관리자 콘솔",
    modules: ["인사", "근태", "휴가", "결재", "문서", "급여", "평가", "채용"],
    avatarBg: "bg-brand-soft",
  },
  {
    icon: "👤",
    title: "Tenant Employee",
    description:
      "직원 개인이 출퇴근, 요청, 서명, 일정을 직접 처리하는 셀프서비스",
    modules: ["출퇴근", "요청", "서명", "일정", "문서", "내 정보"],
    avatarBg: "bg-[#fef3c7]",
  },
];

// ─── Navigation hub data (permission layers) ────────────────

interface ModuleLink {
  name: string;
  description: string;
  href: string;
  icon: string;
}

interface PermissionLayer {
  id: string;
  title: string;
  description: string;
  badgeColor: string;
  modules: ModuleLink[];
}

const PERMISSION_LAYERS: PermissionLayer[] = [
  {
    id: "admin",
    title: "HR 관리자",
    description:
      "인사, 근태, 휴가, 결재, 급여, 성과 등 HR 업무 전반을 관리합니다.",
    badgeColor: "bg-brand text-white",
    modules: [
      {
        name: "대시보드",
        description: "HR 현황 요약 및 KPI",
        href: "/admin",
        icon: "grid",
      },
      {
        name: "인사 관리",
        description: "직원 디렉토리 및 검색",
        href: "/admin/people",
        icon: "users",
      },
      {
        name: "조직도",
        description: "부서별 트리 구조",
        href: "/admin/org-chart",
        icon: "sitemap",
      },
      {
        name: "인사 변동",
        description: "입사, 이동, 퇴사 이력",
        href: "/admin/people/changes",
        icon: "timeline",
      },
      {
        name: "근태 관리",
        description: "출결 현황 및 교대 관리",
        href: "/admin/attendance",
        icon: "clock",
      },
      {
        name: "휴가 관리",
        description: "휴가 정책, 캘린더, 승인",
        href: "/admin/leave",
        icon: "calendar",
      },
      {
        name: "결재 관리",
        description: "승인 요청 및 워크플로우",
        href: "/admin/workflow",
        icon: "check-circle",
      },
      {
        name: "문서 관리",
        description: "템플릿, 발송, 보관함",
        href: "/admin/documents",
        icon: "file-text",
      },
      {
        name: "급여 관리",
        description: "급여 규칙, 마감, 명세서",
        href: "/admin/payroll",
        icon: "dollar",
      },
      {
        name: "성과 관리",
        description: "목표, 평가, 1:1",
        href: "/admin/performance",
        icon: "target",
      },
      {
        name: "채용 관리",
        description: "공고, 파이프라인, 온보딩",
        href: "/admin/recruiting",
        icon: "briefcase",
      },
      {
        name: "리포트",
        description: "인사이트 및 예약 리포트",
        href: "/admin/reports",
        icon: "bar-chart",
      },
      {
        name: "설정",
        description: "회사, 역할, 권한, 감사",
        href: "/admin/settings",
        icon: "settings",
      },
    ],
  },
  {
    id: "employee",
    title: "직원 포탈",
    description:
      "출퇴근 기록, 휴가 신청, 알림 확인, 개인 프로필 관리를 제공합니다.",
    badgeColor: "bg-status-info-solid text-white",
    modules: [
      {
        name: "근무 스케줄",
        description: "출퇴근 체크 및 주간 일정",
        href: "/employee/schedule",
        icon: "clock",
      },
      {
        name: "신청",
        description: "휴가, 근태 정정 신청",
        href: "/employee/requests",
        icon: "send",
      },
      {
        name: "프로필",
        description: "기본정보 및 휴가 잔여",
        href: "/employee/profile",
        icon: "user",
      },
    ],
  },
  {
    id: "platform",
    title: "플랫폼 운영",
    description:
      "테넌트 관리, 빌링, 서포트 등 SaaS 플랫폼 운영 전반을 담당합니다.",
    badgeColor: "bg-surface-inverse text-white",
    modules: [
      {
        name: "운영 대시보드",
        description: "전체 시스템 현황 및 KPI",
        href: "/platform",
        icon: "monitor",
      },
      {
        name: "테넌트 관리",
        description: "고객사 목록 및 상세",
        href: "/platform/tenants",
        icon: "building",
      },
    ],
  },
];

// ─── Icon component for hub module links ────────────────────

const ICON_PATHS: Record<string, string> = {
  grid: "M3 3h7v7H3V3zm11 0h7v7h-7V3zm0 11h7v7h-7v-7zm-11 0h7v7H3v-7z",
  users:
    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m16-4a4 4 0 0 0 0-8m2 12v-2a4 4 0 0 0-3-3.87M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0z",
  sitemap:
    "M12 2v6m0 0H6m6 0h6M6 8v4a2 2 0 0 0 2 2h1m3-6v4a2 2 0 0 1-2 2h-1m5-6v4a2 2 0 0 0 2 2M4 18h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4z",
  timeline: "M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z",
  clock: "M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z",
  calendar:
    "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z",
  "check-circle": "M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z",
  "file-text":
    "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-2 0v6h6M16 13H8m8 4H8m2-8H8",
  dollar: "M12 1v22m5-18H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H7",
  target:
    "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zm0-6a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm0-2a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  briefcase:
    "M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zM16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2",
  "bar-chart": "M12 20V10m6 10V4M6 20v-4",
  settings:
    "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm9.4-2.5a1.6 1.6 0 0 0 .3-1.8l-1.2-2a1.6 1.6 0 0 0-1.7-.7l-.5.1a8 8 0 0 0-1.2-.7V6.8a1.6 1.6 0 0 0-1.2-1.5l-2.2-.4a1.6 1.6 0 0 0-1.6.7l-.3.5a8 8 0 0 0-1.4 0l-.3-.5a1.6 1.6 0 0 0-1.6-.7l-2.2.4A1.6 1.6 0 0 0 5 6.8v.6a8 8 0 0 0-1.2.7l-.5-.1a1.6 1.6 0 0 0-1.7.7l-1.2 2a1.6 1.6 0 0 0 .3 1.8l.4.4a8 8 0 0 0 0 1.4l-.4.4a1.6 1.6 0 0 0-.3 1.8l1.2 2a1.6 1.6 0 0 0 1.7.7l.5-.1a8 8 0 0 0 1.2.7v.6a1.6 1.6 0 0 0 1.2 1.5l2.2.4a1.6 1.6 0 0 0 1.6-.7l.3-.5a8 8 0 0 0 1.4 0l.3.5a1.6 1.6 0 0 0 1.6.7l2.2-.4a1.6 1.6 0 0 0 1.2-1.5v-.6a8 8 0 0 0 1.2-.7l.5.1a1.6 1.6 0 0 0 1.7-.7l1.2-2a1.6 1.6 0 0 0-.3-1.8l-.4-.4a8 8 0 0 0 0-1.4l.4-.4z",
  send: "M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z",
  user: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2m8-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  monitor:
    "M8 21h8m-4-4v4M2 4h20v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4zm0 0a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2",
  building:
    "M3 21h18M3 7v14M21 7v14M6 11h2m4 0h2m4 0h-2M6 15h2m4 0h2m4 0h-2M6 7h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v1a2 2 0 0 0 2 2z",
};

function ModuleIcon({ name }: { name: string }) {
  const path = ICON_PATHS[name] ?? ICON_PATHS["grid"];
  return (
    <svg
      className="h-5 w-5 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={path} />
    </svg>
  );
}

// ─── Page component ─────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between px-sp-6 py-sp-4">
          <span className="text-2xl font-bold text-text-primary">
            Flow<span className="text-brand">HR</span>
          </span>
          <div className="flex items-center gap-sp-6">
            <a
              href="#features"
              className="hidden text-md font-medium text-text-secondary transition-colors duration-fast hover:text-brand sm:inline"
            >
              기능
            </a>
            <a
              href="#roles"
              className="hidden text-md font-medium text-text-secondary transition-colors duration-fast hover:text-brand sm:inline"
            >
              역할별 화면
            </a>
            <a
              href="#hub"
              className="hidden text-md font-medium text-text-secondary transition-colors duration-fast hover:text-brand sm:inline"
            >
              모듈 허브
            </a>
            <Link
              href="/login"
              className="rounded-md bg-brand px-sp-5 py-sp-2 text-md font-semibold text-text-inverse transition-colors duration-fast hover:bg-brand-hover"
            >
              로그인
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-sp-6 pb-sp-12 pt-[80px] text-center md:pt-[120px]">
        <div className="mx-auto max-w-[720px]">
          <span className="inline-block rounded-full bg-brand-soft px-sp-4 py-sp-2 text-sm font-medium text-brand-text">
            ✦ HR 운영의 새로운 기준
          </span>
          <h1 className="mt-sp-6 text-[36px] font-bold leading-tight text-text-primary md:text-[52px]">
            사람 중심으로
            <br />
            <span className="text-brand">HR 운영</span>을 재설계하다
          </h1>
          <p className="mt-sp-6 text-lg leading-relaxed text-text-secondary md:text-xl">
            근태, 휴가, 결재, 문서, 급여, 평가, 채용까지. 하나의 플랫폼에서 모든
            HR 업무를 처리하세요.
          </p>
          <div className="mt-sp-10">
            <Link
              href="/login"
              className="inline-flex items-center gap-sp-2 rounded-lg bg-brand px-sp-8 py-sp-4 text-lg font-semibold text-text-inverse shadow-md transition-all duration-normal hover:-translate-y-0.5 hover:bg-brand-hover hover:shadow-lg"
            >
              시작하기
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M4 10H16M16 10L11 5M16 10L11 15"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
            <p className="mt-sp-4 text-sm text-text-tertiary">
              무료 체험 14일 · 카드 등록 없음
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="bg-surface-canvas px-sp-6 py-[80px] md:py-[100px]"
      >
        <div className="mx-auto max-w-[1280px]">
          <div className="mb-sp-12 text-center">
            <h2 className="text-3xl font-bold text-text-primary md:text-4xl">
              핵심 기능
            </h2>
            <p className="mt-sp-3 text-lg text-text-secondary">
              HR 운영에 필요한 모든 기능을 하나의 플랫폼에서
            </p>
          </div>
          <div className="grid gap-sp-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-border bg-surface-primary p-sp-8 shadow-xs transition-all duration-normal hover:-translate-y-1 hover:shadow-md"
              >
                <div
                  className={`mb-sp-4 flex h-12 w-12 items-center justify-center rounded-lg text-2xl ${feature.color}`}
                >
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-text-primary">
                  {feature.title}
                </h3>
                <p className="mt-sp-2 text-md leading-relaxed text-text-secondary">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles Section */}
      <section id="roles" className="px-sp-6 py-[80px] md:py-[100px]">
        <div className="mx-auto max-w-[1280px]">
          <div className="mb-sp-12 text-center">
            <h2 className="text-3xl font-bold text-text-primary md:text-4xl">
              역할별 최적화 화면
            </h2>
            <p className="mt-sp-3 text-lg text-text-secondary">
              로그인 권한에 따라 자동으로 맞춤 화면으로 이동합니다
            </p>
          </div>
          <div className="grid gap-sp-6 sm:grid-cols-2 lg:grid-cols-3">
            {ROLES.map((role) => (
              <div
                key={role.title}
                className="rounded-xl border border-border bg-surface-primary p-sp-8 shadow-xs text-center"
              >
                <div
                  className={`mx-auto mb-sp-4 flex h-16 w-16 items-center justify-center rounded-full text-[28px] ${role.avatarBg}`}
                >
                  {role.icon}
                </div>
                <h3 className="text-xl font-semibold text-text-primary">
                  {role.title}
                </h3>
                <p className="mt-sp-2 text-md leading-relaxed text-text-secondary">
                  {role.description}
                </p>
                <div className="mt-sp-4 flex flex-wrap justify-center gap-sp-2">
                  {role.modules.map((mod) => (
                    <span
                      key={mod}
                      className="rounded-full bg-surface-secondary px-sp-3 py-0.5 text-xs text-text-secondary"
                    >
                      {mod}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-surface-canvas px-sp-6 py-[60px] text-center md:py-[80px]">
        <div className="mx-auto max-w-[600px]">
          <h2 className="text-3xl font-bold text-text-primary">
            지금 시작하세요
          </h2>
          <p className="mt-sp-3 text-lg text-text-secondary">
            14일 무료 체험으로 FlowHR의 모든 기능을 경험해보세요.
          </p>
          <Link
            href="/login"
            className="mt-sp-8 inline-flex items-center gap-sp-2 rounded-lg bg-brand px-sp-8 py-sp-4 text-lg font-semibold text-text-inverse shadow-md transition-all duration-normal hover:-translate-y-0.5 hover:bg-brand-hover hover:shadow-lg"
          >
            무료로 시작하기
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M4 10H16M16 10L11 5M16 10L11 15"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>
      </section>

      {/* Navigation Hub Section */}
      <section
        id="hub"
        className="border-t border-border bg-surface-canvas px-sp-6 py-[60px] md:py-[80px]"
      >
        <div className="mx-auto max-w-content">
          <div className="mb-sp-8 text-center">
            <h2 className="text-3xl font-bold text-text-primary md:text-4xl">
              네비게이션 허브
            </h2>
            <p className="mt-sp-3 text-lg text-text-secondary">
              역할별 모듈에 빠르게 접근하세요. 로그인 후 권한에 맞는 화면으로
              이동합니다.
            </p>
          </div>

          <div className="flex flex-col gap-sp-8">
            {PERMISSION_LAYERS.map((layer) => (
              <div key={layer.id}>
                <div className="mb-sp-4 flex items-center gap-sp-3">
                  <span
                    className={`inline-flex rounded-full px-sp-3 py-sp-1 text-xs font-semibold ${layer.badgeColor}`}
                  >
                    {layer.title}
                  </span>
                  <span className="text-sm text-text-secondary">
                    {layer.description}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-sp-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {layer.modules.map((mod) => (
                    <Link
                      key={mod.href}
                      href={mod.href}
                      className="group flex items-start gap-sp-3 rounded-lg border border-border bg-surface-primary p-sp-4 shadow-xs transition-all hover:border-brand hover:shadow-sm"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-surface-secondary text-text-secondary transition-colors group-hover:bg-brand-soft group-hover:text-brand">
                        <ModuleIcon name={mod.icon} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-text-primary group-hover:text-brand">
                          {mod.name}
                        </p>
                        <p className="mt-sp-1 text-xs text-text-tertiary">
                          {mod.description}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-surface-primary px-sp-6 py-sp-10">
        <div className="mx-auto max-w-[1280px] text-center">
          <span className="text-lg font-bold text-text-primary">
            Flow<span className="text-brand">HR</span>
          </span>
          <p className="mt-sp-2 text-sm text-text-tertiary">
            &copy; {new Date().getFullYear()} FlowHR. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
