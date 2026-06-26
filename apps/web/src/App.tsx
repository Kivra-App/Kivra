import { motion } from "framer-motion";
import {
  Apple,
  ArrowRight,
  Braces,
  Github,
  Monitor,
  SquareTerminal,
  Workflow,
  Wrench
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { LandingHeroDemo } from "@/components/landing-hero-demo";
import { NodeViewMockup } from "@/components/node-view-mockup";

const releaseUrl = "https://github.com/Kivra-App/Kivra/releases";
const latestReleaseUrl = "https://github.com/Kivra-App/Kivra/releases/latest";

type language = "en" | "ko";

const copy = {
  en: {
    appTitle: "Kivra",
    badge: "Developer memory for local projects.",
    caption: "File-aware project memory.",
    currentRelease: "Current release.",
    currentReleaseDetail:
      "Kivra is currently distributed for macOS on Apple Silicon.",
    currentReleaseMeta: "macOS (Apple Silicon) · GitHub Releases",
    download: "Download",
    downloadForMac: "Download for macOS",
    features: [
      { text: "Capture project context.", title: "Remember" },
      { text: "Visualize relationships.", title: "Understand" },
      { text: "Find previous solutions.", title: "Reuse" }
    ],
    footerCopyright: "Copyright 2026 Sangmin Park",
    footerLicense: "Licensed under AGPL-3.0.",
    footerTagline: "Developer memory for local projects.",
    github: "GitHub",
    heroSubtextLine1: "Git remembers code.",
    heroSubtextLine2: "Kivra remembers why.",
    heroTitleLine1: "Remember everything",
    heroTitleLine2: "your project has already taught you.",
    integrations: ["Desktop", "VS Code", "JetBrains", "Terminal"],
    license: "License",
    mockup: {
      caption: "Captured knowledge",
      fileMemory:
        "This file keeps imports, runtime entry points, errors, and notes connected in one place.",
      graph: "Graph",
      noteA: "Import paths, runtime entry, and error notes stay connected.",
      noteB: "Resolution notes remain searchable at the file level.",
      preview: "Preview",
      search: "Search files and folders"
    },
    navGithub: "GitHub",
    previewLabel: "Kivra product preview",
    releaseAsset: "Kivra_0.1.0_macOS_arm64.dmg",
    releasePlatformLabel: "Platform",
    releasePlatformValue: "macOS",
    releaseSourceLabel: "Distribution",
    releaseSourceValue: "GitHub Releases",
    releaseVersionLabel: "Version",
    releaseVersionValue: "0.1.0",
    releaseLabel: "Current release target"
  },
  ko: {
    appTitle: "Kivra",
    badge: "로컬 프로젝트를 위한 개발자 메모리.",
    caption: "파일 단위로 기억하는 프로젝트 메모리.",
    currentRelease: "현재 릴리즈.",
    currentReleaseDetail:
      "현재 Kivra는 Apple Silicon 기반 macOS용으로 배포됩니다.",
    currentReleaseMeta: "macOS (Apple Silicon) · GitHub Releases",
    download: "다운로드",
    downloadForMac: "macOS 다운로드",
    features: [
      { text: "프로젝트 맥락을 캡처합니다.", title: "Remember" },
      { text: "관계를 시각화합니다.", title: "Understand" },
      { text: "이전 해결책을 다시 찾습니다.", title: "Reuse" }
    ],
    footerCopyright: "Copyright 2026 Sangmin Park",
    footerLicense: "AGPL-3.0 라이선스로 배포됩니다.",
    footerTagline: "로컬 프로젝트를 위한 개발자 메모리.",
    github: "GitHub",
    heroSubtextLine1: "Git은 코드를 기억합니다.",
    heroSubtextLine2: "Kivra는 이유를 기억합니다.",
    heroTitleLine1: "프로젝트가 이미 가르쳐준 것들을",
    heroTitleLine2: "끝까지 기억하세요.",
    integrations: ["Desktop", "VS Code", "JetBrains", "Terminal"],
    license: "라이선스",
    mockup: {
      caption: "캡처된 지식",
      fileMemory:
        "이 파일은 import, runtime entry, error, note를 한 흐름으로 연결해 둡니다.",
      graph: "그래프",
      noteA: "import 경로, runtime entry, error note가 서로 연결된 상태로 남습니다.",
      noteB: "해결 노트는 파일 단위로 계속 검색할 수 있습니다.",
      preview: "프리뷰",
      search: "파일 및 폴더 검색"
    },
    navGithub: "GitHub",
    previewLabel: "Kivra 제품 미리보기",
    releaseAsset: "Kivra_0.1.0_macOS_arm64.dmg",
    releasePlatformLabel: "플랫폼",
    releasePlatformValue: "macOS",
    releaseSourceLabel: "배포 위치",
    releaseSourceValue: "GitHub Releases",
    releaseVersionLabel: "버전",
    releaseVersionValue: "0.1.0",
    releaseLabel: "현재 릴리즈 타깃"
  }
} satisfies Record<
  language,
  {
    appTitle: string;
    badge: string;
    caption: string;
    currentRelease: string;
    currentReleaseDetail: string;
    currentReleaseMeta: string;
    download: string;
    downloadForMac: string;
    features: Array<{ text: string; title: string }>;
    footerCopyright: string;
    footerLicense: string;
    footerTagline: string;
    github: string;
    heroSubtextLine1: string;
    heroSubtextLine2: string;
    heroTitleLine1: string;
    heroTitleLine2: string;
    integrations: string[];
    license: string;
    mockup: {
      caption: string;
      fileMemory: string;
      graph: string;
      noteA: string;
      noteB: string;
      preview: string;
      search: string;
    };
    navGithub: string;
    previewLabel: string;
    releaseAsset: string;
    releasePlatformLabel: string;
    releasePlatformValue: string;
    releaseSourceLabel: string;
    releaseSourceValue: string;
    releaseVersionLabel: string;
    releaseVersionValue: string;
    releaseLabel: string;
  }
>;

const featureIcons = [SquareTerminal, Workflow, ArrowRight] as const;
const integrationIcons = [Monitor, Braces, Wrench, SquareTerminal] as const;

export const App = () => {
  const [lang, setLang] = useState<language>(() => {
    if (typeof window === "undefined") {
      return "en";
    }

    const stored = window.localStorage.getItem("kivra-web-lang");

    if (stored === "ko" || stored === "en") {
      return stored;
    }

    return navigator.language.toLowerCase().startsWith("ko") ? "ko" : "en";
  });

  const t = copy[lang];

  useEffect(() => {
    window.localStorage.setItem("kivra-web-lang", lang);
    document.documentElement.lang = lang;
    document.title = lang === "ko" ? "Kivra | 개발자 메모리" : "Kivra | Developer Memory";
  }, [lang]);

  const features = useMemo(
    () =>
      t.features.map((feature, index) => ({
        ...feature,
        icon: featureIcons[index]
      })),
    [t.features]
  );
  const integrations = useMemo(
    () =>
      t.integrations.map((label, index) => ({
        icon: integrationIcons[index],
        label
      })),
    [t.integrations]
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/88 backdrop-blur">
        <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="text-lg font-semibold tracking-tight">{t.appTitle}</div>
          <nav className="flex items-center gap-2">
            <LanguageToggle
              current={lang}
              onChange={setLang}
            />
            <LinkButton href={latestReleaseUrl} variant="primary">
              {t.download}
            </LinkButton>
            <LinkButton href={releaseUrl} variant="ghost">
              <Github className="h-4 w-4" />
              {t.navGithub}
            </LinkButton>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto grid min-h-[calc(100vh-72px)] max-w-[1440px] gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(520px,1.1fr)] lg:items-center lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="max-w-[560px]"
          >
            <div className="text-sm text-muted-foreground">{t.badge}</div>
            <h1 className="mt-5 text-5xl font-semibold leading-[1.02] tracking-tight sm:text-6xl">
              {t.heroTitleLine1}
              <br />
              {t.heroTitleLine2}
            </h1>
            <p className="mt-6 max-w-[48ch] text-lg leading-8 text-muted-foreground">
              {t.heroSubtextLine1}
              <br />
              {t.heroSubtextLine2}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <LinkButton href={latestReleaseUrl} variant="primary">
                <Apple className="h-4 w-4" />
                {t.downloadForMac}
              </LinkButton>
              <LinkButton href={releaseUrl} variant="ghost">
                <Github className="h-4 w-4" />
                {t.github}
              </LinkButton>
            </div>
          </motion.div>

          <LandingHeroDemo />
        </section>

        <section className="mx-auto max-w-[1440px] px-4 pb-6 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.38, ease: "easeOut" }}
          >
            <NodeViewMockup labels={t.mockup} language={lang} />
          </motion.div>
        </section>

        <section className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
          <div className="border-t border-border/80 pt-7">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
              <div className="grid gap-5 md:grid-cols-3">
                {features.map((feature, index) => (
                  <motion.article
                    key={feature.title}
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.4 }}
                    transition={{ duration: 0.28, delay: index * 0.05, ease: "easeOut" }}
                    className="flex items-start gap-3"
                  >
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-border/80 bg-card">
                      <feature.icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{feature.title}</div>
                      <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                        {feature.text}
                      </p>
                    </div>
                  </motion.article>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2 lg:max-w-[360px] lg:justify-end">
              {integrations.map((integration) => (
                <div
                  key={integration.label}
                  className="inline-flex h-8 items-center gap-2 rounded-md border border-border/80 bg-background px-3 text-xs text-muted-foreground"
                >
                  <integration.icon className="h-3.5 w-3.5" />
                  <span>{integration.label}</span>
                </div>
              ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1440px] px-4 pb-10 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.45 }}
            transition={{ duration: 0.34, ease: "easeOut" }}
            className="pb-8"
          >
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(340px,420px)] lg:items-center">
              <div className="max-w-2xl">
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t.releaseLabel}
                </div>
                <div className="mt-3 text-lg font-semibold">{t.currentRelease}</div>
                <div className="mt-2 text-sm leading-6 text-muted-foreground">
                  {t.currentReleaseDetail}
                </div>
              </div>
              <div className="rounded-lg border border-border/80 bg-card p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold">{t.currentReleaseMeta}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {t.releaseAsset}
                    </div>
                  </div>
                  <Apple className="h-5 w-5 shrink-0 text-muted-foreground" />
                </div>
                <div className="mt-4 grid gap-2">
                  <ReleaseMetaRow
                    label={t.releaseVersionLabel}
                    value={t.releaseVersionValue}
                  />
                  <ReleaseMetaRow
                    label={t.releasePlatformLabel}
                    value={t.releasePlatformValue}
                  />
                  <ReleaseMetaRow
                    label={t.releaseSourceLabel}
                    value={t.releaseSourceValue}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </section>
      </main>

      <footer className="mx-auto grid max-w-[1440px] gap-5 border-t border-border/80 px-4 py-8 text-sm text-muted-foreground sm:px-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start lg:px-8">
        <div>
          <div className="font-medium text-foreground">{t.appTitle}</div>
          <div className="mt-1">{t.footerTagline}</div>
          <div className="mt-3 max-w-[520px] text-xs leading-5">{t.footerLicense}</div>
        </div>
        <div className="flex flex-col gap-3 lg:items-end">
          <div className="flex flex-wrap items-center gap-4">
            <a href={releaseUrl} className="hover:text-foreground">
              {t.github}
            </a>
            <a
              href="https://github.com/Kivra-App/Kivra/blob/main/LICENSE"
              className="hover:text-foreground"
            >
              {t.license}
            </a>
          </div>
          <div className="text-xs">{t.footerCopyright}</div>
        </div>
      </footer>
    </div>
  );
};

const LinkButton = ({
  children,
  href,
  variant
}: {
  children: ReactNode;
  href: string;
  variant: "ghost" | "primary";
}) => (
  <a
    href={href}
    className={[
      "inline-flex h-11 items-center gap-2 rounded-md px-4 text-sm font-medium transition",
      variant === "primary"
        ? "bg-primary text-primary-foreground hover:opacity-92"
        : "border border-border/80 bg-card hover:bg-muted"
    ].join(" ")}
  >
    {children}
  </a>
);

const ReleaseMetaRow = ({
  label,
  value
}: {
  label: string;
  value: string;
}) => (
  <div className="flex items-center justify-between gap-4 rounded-md border border-border/80 bg-background px-3 py-2 text-xs">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-medium text-foreground">{value}</span>
  </div>
);

const LanguageToggle = ({
  current,
  onChange
}: {
  current: language;
  onChange: (value: language) => void;
}) => (
  <div className="hidden items-center gap-2 rounded-md border border-border/80 bg-card p-1 sm:flex">
    {(["ko", "en"] as const).map((value) => (
      <button
        key={value}
        type="button"
        className={[
          "rounded px-2.5 py-1 text-xs font-medium transition",
          current === value
            ? "bg-muted text-foreground"
            : "text-muted-foreground hover:text-foreground"
        ].join(" ")}
        onClick={() => onChange(value)}
      >
        {value.toUpperCase()}
      </button>
    ))}
  </div>
);
