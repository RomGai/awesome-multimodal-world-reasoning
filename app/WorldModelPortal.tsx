"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import rawWorks from "./data/works.generated.json";
import rawEvaluationResources from "./data/evaluation-resources.generated.json";
import siteMeta from "./data/site-meta.json";
import { buildPaginationItems } from "./pagination.mjs";
import { matchesSelection } from "./matching.mjs";

type Language = "en" | "zh";
type PortalView = "works" | "evaluation";
type MatchMode = "any" | "all" | "exact";
type SortOrder = "newest" | "oldest";
type PageSize = 10 | 20 | 50 | 100;
type PrimaryRole = "TI" | "SS" | "AC";
type CollapsibleFilterSection = "types" | "primary" | "details";
type ResearchParadigm = "generative-interactive" | "latent-predictive" | "mllm-integrated";
type RoleTag =
  | "TI-I" | "TI-G" | "TI-M"
  | "SS-G" | "SS-P" | "SS-C" | "SS-E"
  | "AC-V" | "AC-R" | "AC-D" | "AC-N" | "AC-T";
type LinkKind = "paper" | "official" | "code" | "project" | "blog";

type Work = {
  id: string;
  name: string;
  title: string;
  venue: string;
  date: string;
  year: number;
  roles: RoleTag[];
  paradigms: ResearchParadigm[];
  keywords: Record<Language, string[]>;
  summary?: Record<Language, string>;
  applications: string;
  links: Partial<Record<LinkKind, string>>;
};

type EvaluationResource = {
  id: string;
  name: string;
  title: string;
  venue: string;
  date: string;
  year: number;
  focus: PrimaryRole[];
  keywords: Record<Language, string[]>;
  resourceType: string;
  target: string;
  scale: string;
  task: string;
  dimensions: string;
  links: Partial<Record<LinkKind, string>>;
};

const works = rawWorks as Work[];
const evaluationResources = rawEvaluationResources as EvaluationResource[];
const PAGE_SIZE_OPTIONS: PageSize[] = [10, 20, 50, 100];
const DEFAULT_PAGE_SIZE: PageSize = 10;
const DEFAULT_MATCH_MODE: MatchMode = "all";
const MATCH_MODE_OPTIONS: MatchMode[] = ["all", "any", "exact"];
const publicBasePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");

const paradigmLabels: Record<ResearchParadigm, Record<Language, string>> = {
  "generative-interactive": {
    en: "Generative & Interactive",
    zh: "生成式与交互式",
  },
  "latent-predictive": {
    en: "Latent-Dynamics & Predictive-State",
    zh: "潜在动力学与预测状态",
  },
  "mllm-integrated": {
    en: "(M)LLM-Integrated",
    zh: "（多模态）大语言模型集成",
  },
};

const cardParadigmLabels: Record<ResearchParadigm, Record<Language, string>> = {
  "generative-interactive": {
    en: "Generative & Interactive WMs",
    zh: "生成式与交互式 WM",
  },
  "latent-predictive": {
    en: "Latent-Dynamics & Predictive-State WMs",
    zh: "潜在动力学与预测状态 WM",
  },
  "mllm-integrated": {
    en: "(M)LLM-Integrated WMs",
    zh: "（多模态）大语言模型集成 WM",
  },
};

const roleGroups: Record<PrimaryRole, { label: Record<Language, string>; roles: RoleTag[] }> = {
  TI: {
    label: { en: "Temporal & Imaginative", zh: "时序与想象" },
    roles: ["TI-I", "TI-G", "TI-M"],
  },
  SS: {
    label: { en: "Structured State", zh: "结构化状态" },
    roles: ["SS-G", "SS-P", "SS-C", "SS-E"],
  },
  AC: {
    label: { en: "Action Coupled", zh: "动作耦合" },
    roles: ["AC-V", "AC-R", "AC-D", "AC-N", "AC-T"],
  },
};

const roleLabels: Record<RoleTag, Record<Language, string>> = {
  "TI-I": { en: "Interactive or Imagined Rollout", zh: "交互式或想象式展开" },
  "TI-G": { en: "Generation / Prediction", zh: "生成 / 预测" },
  "TI-M": { en: "Persistent Memory", zh: "持久记忆" },
  "SS-G": { en: "Geometric State", zh: "几何状态" },
  "SS-P": { en: "Physical State", zh: "物理状态" },
  "SS-C": { en: "Causal State", zh: "因果状态" },
  "SS-E": { en: "Entity / Relational State", zh: "实体 / 关系状态" },
  "AC-V": { en: "VLA", zh: "视觉-语言-动作" },
  "AC-R": { en: "Robot", zh: "机器人" },
  "AC-D": { en: "Driving", zh: "驾驶" },
  "AC-N": { en: "Navigation", zh: "导航" },
  "AC-T": { en: "Tool / Software", zh: "工具 / 软件" },
};

const copy = {
  en: {
    companion: "A Survey of World Models in Multimodal Reasoning",
    titleA: "From Language to",
    titleB: "World States",
    works: "indexed works",
    years: "year span",
    roles: "role tags",
    catalog: "Research index",
    filters: "Filters",
    search: "Keyword search",
    searchPlaceholder: "(methods, venues, or topics)",
    primary: "Primary roles",
    detail: "Detailed roles",
    match: "Matching mode",
    any: "Any",
    all: "All",
    exact: "Exact",
    clear: "Clear filters",
    result: "works found",
    sort: "Sort by date",
    newest: "Newest first",
    oldest: "Oldest first",
    empty: "No work matches this combination.",
    reset: "Reset the index",
    roleHint: "Select a role on any card to filter the full index.",
    dataNote: "Data is generated locally from Table 2 and the survey bibliography.",
    identity: "World-State Portal",
  },
  zh: {
    companion: "多模态推理中的世界模型综述",
    titleA: "从语言轨迹走向",
    titleB: "世界状态",
    works: "项收录工作",
    years: "年时间跨度",
    roles: "个次级角色",
    catalog: "研究索引",
    filters: "筛选",
    search: "关键词搜索",
    searchPlaceholder: "（方法、会议或主题）",
    primary: "三类主角色",
    detail: "详细次级角色",
    match: "匹配模式",
    any: "任一",
    all: "全部",
    exact: "完全一致",
    clear: "清除筛选",
    result: "项工作",
    sort: "按时间排序",
    newest: "最新优先",
    oldest: "最早优先",
    empty: "没有工作符合当前筛选组合。",
    reset: "重置索引",
    roleHint: "点击任意卡片上的角色，即可筛选整个索引。",
    dataNote: "数据由 Table 2 与综述参考文献在本地生成。",
    identity: "世界状态门户",
  },
} as const;

const portalViewCopy = {
  works: {
    en: {
      button: "Research Works",
      countLabel: "indexed works",
      catalog: "Research index",
      searchPlaceholder: "(methods, venues, or topics)",
      primary: "Primary roles",
      detail: "Detailed roles",
      result: "works found",
      empty: "No work matches this combination.",
      reset: "Reset the index",
      roleHint: "Select a role on any card to filter the full index.",
      dataNote: "Data is generated locally from Table 2 and the survey bibliography.",
      paginationLabel: "Research index pages",
      perPageLabel: "Works per page",
    },
    zh: {
      button: "研究工作",
      countLabel: "项收录工作",
      catalog: "研究索引",
      searchPlaceholder: "（方法、会议或主题）",
      primary: "三类主角色",
      detail: "详细次级角色",
      result: "项工作",
      empty: "没有工作符合当前筛选组合。",
      reset: "重置索引",
      roleHint: "点击任意卡片上的角色，即可筛选整个索引。",
      dataNote: "数据由 Table 2 与综述参考文献在本地生成。",
      paginationLabel: "研究索引分页",
      perPageLabel: "每页工作数量",
    },
  },
  evaluation: {
    en: {
      button: "Evaluation Resources",
      countLabel: "indexed works",
      catalog: "Research index",
      searchPlaceholder: "(name, venue, and domain)",
      primary: "Evaluation focus",
      detail: "",
      result: "resources found",
      empty: "No evaluation resource matches this combination.",
      reset: "Reset the resource index",
      roleHint: "Select a focus or domain on any card to filter the resource index.",
      dataNote: "Data is generated locally from Table 3 and the survey bibliography.",
      paginationLabel: "Research index pages",
      perPageLabel: "Resources per page",
    },
    zh: {
      button: "评估资源",
      countLabel: "项收录工作",
      catalog: "研究索引",
      searchPlaceholder: "（名称、会议和领域）",
      primary: "评估焦点",
      detail: "",
      result: "项资源",
      empty: "没有评估资源符合当前筛选组合。",
      reset: "重置资源索引",
      roleHint: "点击任意卡片上的焦点或领域，即可筛选整个资源索引。",
      dataNote: "数据由 Table 3 与综述参考文献在本地生成。",
      paginationLabel: "研究索引分页",
      perPageLabel: "每页资源数量",
    },
  },
} as const;

const linkLabels: Record<LinkKind, Record<Language, string>> = {
  paper: { en: "Paper", zh: "论文" },
  official: { en: "Official release", zh: "官方发布" },
  code: { en: "Code", zh: "代码" },
  project: { en: "Project", zh: "项目主页" },
  blog: { en: "Blog", zh: "Blog" },
};

const primaryRoles = Object.keys(roleGroups) as PrimaryRole[];
const allRoles = Object.keys(roleLabels) as RoleTag[];
const researchParadigms = Object.keys(paradigmLabels) as ResearchParadigm[];
const linkOrder: LinkKind[] = ["paper", "official", "code", "project", "blog"];
const resourceIcons: Record<string, string> = {
  arxiv: "ai ai-arxiv",
  github: "fab fa-github",
  email: "fas fa-envelope",
};

function toggleItem<T>(items: T[], item: T) {
  return items.includes(item) ? items.filter((value) => value !== item) : [...items, item];
}

function primaryFor(role: RoleTag) {
  return role.slice(0, 2) as PrimaryRole;
}

export default function WorldModelPortal() {
  const [view, setView] = useState<PortalView>("works");
  const [language, setLanguage] = useState<Language>("en");
  const [query, setQuery] = useState("");
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");
  const [selectedPrimary, setSelectedPrimary] = useState<PrimaryRole[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<RoleTag[]>([]);
  const [selectedParadigms, setSelectedParadigms] = useState<ResearchParadigm[]>([]);
  const [matchMode, setMatchMode] = useState<MatchMode>(DEFAULT_MATCH_MODE);
  const [codeOrProjectOnly, setCodeOrProjectOnly] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [pageSize, setPageSize] = useState<PageSize>(DEFAULT_PAGE_SIZE);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState("");
  const [expandedWorkId, setExpandedWorkId] = useState<string | null>(null);
  const [collapsedFilterSections, setCollapsedFilterSections] = useState<Record<CollapsibleFilterSection, boolean>>({
    types: false,
    primary: false,
    details: false,
  });
  const [ready, setReady] = useState(false);
  const paginationInitialized = useRef(false);
  const t = copy[language];
  const viewText = portalViewCopy[view][language];
  const paginationCopy = language === "en"
    ? { previous: "Previous", next: "Next", page: "Page", of: "of", perPage: "Per page", jump: "Go to", go: "Go", jumpLabel: "Go to a specific page" }
    : { previous: "上一页", next: "下一页", page: "第", of: "页，共", perPage: "每页", jump: "跳转至", go: "跳转", jumpLabel: "跳转至指定页" };
  const summaryCopy = language === "en"
    ? { open: "Summary", close: "Close", label: "Summary", attribution: "Summarized by GPT-5.6 Sol", placeholder: "Summary placeholder — a concise overview of this work will be added here." }
    : { open: "总结", close: "收起", label: "总结", attribution: "由 GPT-5.6 Sol 总结", placeholder: "总结占位——后续将在这里补充该工作的核心内容简介。" };
  const resourceDetailCopy = language === "en"
    ? { open: "Details", close: "Close", label: "Resource details", type: "Resource type", target: "Evaluation target", scale: "Scale", task: "Task", dimensions: "Main dimensions / metrics" }
    : { open: "详情", close: "收起", label: "资源详情", type: "资源类型", target: "评估对象", scale: "规模", task: "任务", dimensions: "主要维度 / 指标" };
  const footerCopy = language === "en"
    ? { copyright: "© 2026 A Survey of World Models in Multimodal Reasoning. All rights reserved.", descriptor: "Survey literature & evaluation index" }
    : { copyright: "© 2026《多模态推理中的世界模型综述》。保留所有权利。", descriptor: "综述文献与评估资源索引" };
  const yearCopy = language === "en"
    ? { label: "Year range", from: "From", to: "To", separator: "to" }
    : { label: "年份范围", from: "起始年", to: "结束年", separator: "至" };
  const linkFilterCopy = language === "en"
    ? { label: "Link availability", button: "Code or Project", aria: "Show only entries with a Code or Project link" }
    : { label: "资源入口", button: "代码或项目页", aria: "仅显示包含代码或项目页链接的条目" };
  const paradigmFilterCopy = language === "en"
    ? { label: "World Model Types", aria: "World model type filters" }
    : { label: "世界模型类型", aria: "世界模型类型筛选" };
  const collapseCopy = language === "en"
    ? { collapse: "Collapse", expand: "Show all" }
    : { collapse: "收起", expand: "展开全部" };
  const toggleFilterSection = (section: CollapsibleFilterSection) => {
    setCollapsedFilterSections((current) => ({ ...current, [section]: !current[section] }));
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const savedLanguage = window.localStorage.getItem("wm-index-language");
    const initialView: PortalView = params.get("view") === "evaluation" ? "evaluation" : "works";
    const validYears = new Set((initialView === "evaluation" ? evaluationResources : works).map((item) => String(item.year)));
    setView(initialView);
    const initialLanguage = params.get("lang") === "zh" || (!params.has("lang") && savedLanguage === "zh") ? "zh" : "en";
    setLanguage(initialLanguage);
    setQuery(params.get("q") ?? "");
    setYearFrom(validYears.has(params.get("from") ?? "") ? params.get("from") ?? "" : "");
    setYearTo(validYears.has(params.get("to") ?? "") ? params.get("to") ?? "" : "");
    setSelectedPrimary((params.get("groups")?.split(",").filter((item): item is PrimaryRole => primaryRoles.includes(item as PrimaryRole))) ?? []);
    setSelectedRoles(initialView === "works"
      ? (params.get("roles")?.split(",").filter((item): item is RoleTag => allRoles.includes(item as RoleTag))) ?? []
      : []);
    setSelectedParadigms(initialView === "works"
      ? (params.get("paradigms")?.split(",").filter((item): item is ResearchParadigm => researchParadigms.includes(item as ResearchParadigm))) ?? []
      : []);
    const requestedMatchMode = params.get("match");
    setMatchMode(requestedMatchMode === "any" || requestedMatchMode === "exact" ? requestedMatchMode : DEFAULT_MATCH_MODE);
    setCodeOrProjectOnly(params.get("links") === "code-project");
    setSortOrder(params.get("sort") === "oldest" ? "oldest" : "newest");
    const requestedPageSize = Number.parseInt(params.get("perPage") ?? "", 10);
    setPageSize(PAGE_SIZE_OPTIONS.includes(requestedPageSize as PageSize) ? requestedPageSize as PageSize : DEFAULT_PAGE_SIZE);
    setCurrentPage(Math.max(1, Number.parseInt(params.get("page") ?? "1", 10) || 1));
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!paginationInitialized.current) {
      paginationInitialized.current = true;
      return;
    }
    setCurrentPage(1);
    setExpandedWorkId(null);
  }, [codeOrProjectOnly, language, matchMode, pageSize, query, ready, selectedParadigms, selectedPrimary, selectedRoles, sortOrder, view, yearFrom, yearTo]);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem("wm-index-language", language);
    const params = new URLSearchParams();
    if (view === "evaluation") params.set("view", "evaluation");
    if (language === "zh") params.set("lang", "zh");
    if (query) params.set("q", query);
    if (yearFrom) params.set("from", yearFrom);
    if (yearTo) params.set("to", yearTo);
    if (selectedPrimary.length) params.set("groups", selectedPrimary.join(","));
    if (selectedRoles.length) params.set("roles", selectedRoles.join(","));
    if (selectedParadigms.length) params.set("paradigms", selectedParadigms.join(","));
    if (matchMode !== DEFAULT_MATCH_MODE) params.set("match", matchMode);
    if (codeOrProjectOnly) params.set("links", "code-project");
    if (sortOrder === "oldest") params.set("sort", "oldest");
    if (pageSize !== DEFAULT_PAGE_SIZE) params.set("perPage", String(pageSize));
    if (currentPage > 1) params.set("page", String(currentPage));
    const nextUrl = `${window.location.pathname}${params.size ? `?${params}` : ""}`;
    window.history.replaceState(null, "", nextUrl);
  }, [codeOrProjectOnly, currentPage, language, query, selectedParadigms, selectedPrimary, selectedRoles, matchMode, pageSize, sortOrder, ready, view, yearFrom, yearTo]);

  const yearOptions = useMemo(() => {
    const items = view === "works" ? works : evaluationResources;
    return [...new Set(items.map((item) => item.year))].sort((a, b) => a - b);
  }, [view]);
  const yearRangeLabel = yearOptions.length
    ? `${yearCopy.label} (${yearOptions[0]}–${yearOptions[yearOptions.length - 1]})`
    : yearCopy.label;

  const filteredWorks = useMemo(() => {
    const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
    return works
      .filter((work) => {
        const haystack = [
          work.name,
          work.title,
          work.venue,
          work.date,
          work.applications,
          work.summary?.en ?? "",
          work.summary?.zh ?? "",
          ...work.keywords.en,
          ...work.keywords.zh,
          ...work.roles.flatMap((role) => [role, roleLabels[role].en, roleLabels[role].zh]),
          ...work.paradigms.flatMap((paradigm) => [
            paradigm,
            paradigmLabels[paradigm].en,
            paradigmLabels[paradigm].zh,
          ]),
        ].join(" ").toLowerCase();
        if (!terms.every((term) => haystack.includes(term))) return false;
        if (yearFrom && work.year < Number(yearFrom)) return false;
        if (yearTo && work.year > Number(yearTo)) return false;
        if (codeOrProjectOnly && !work.links.code && !work.links.project) return false;

        const workPrimaryRoles = [...new Set(work.roles.map(primaryFor))];
        if (!matchesSelection(workPrimaryRoles, selectedPrimary, matchMode)) return false;
        if (!matchesSelection(work.roles, selectedRoles, matchMode)) return false;
        if (!matchesSelection(work.paradigms, selectedParadigms, matchMode)) return false;

        return true;
      })
      .sort((a, b) => sortOrder === "newest" ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date));
  }, [codeOrProjectOnly, matchMode, query, selectedParadigms, selectedPrimary, selectedRoles, sortOrder, yearFrom, yearTo]);

  const filteredResources = useMemo(() => {
    const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
    return evaluationResources
      .filter((resource) => {
        const haystack = [
          resource.name,
          resource.title,
          resource.venue,
          resource.date,
          resource.resourceType,
          resource.target,
          resource.scale,
          resource.task,
          resource.dimensions,
          ...resource.keywords.en,
          ...resource.keywords.zh,
          ...resource.focus.flatMap((group) => [group, roleGroups[group].label.en, roleGroups[group].label.zh]),
        ].join(" ").toLowerCase();
        if (!terms.every((term) => haystack.includes(term))) return false;
        if (yearFrom && resource.year < Number(yearFrom)) return false;
        if (yearTo && resource.year > Number(yearTo)) return false;
        if (codeOrProjectOnly && !resource.links.code && !resource.links.project) return false;

        if (!matchesSelection(resource.focus, selectedPrimary, matchMode)) return false;

        return true;
      })
      .sort((a, b) => sortOrder === "newest" ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date));
  }, [codeOrProjectOnly, matchMode, query, selectedPrimary, sortOrder, yearFrom, yearTo]);

  const filteredItems: Array<Work | EvaluationResource> = view === "works" ? filteredWorks : filteredResources;
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const paginationItems = useMemo(
    () => buildPaginationItems(totalPages, currentPage),
    [currentPage, totalPages],
  );
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [currentPage, filteredItems, pageSize]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const goToPage = (page: number) => {
    setCurrentPage(Math.min(Math.max(page, 1), totalPages));
    setExpandedWorkId(null);
    document.getElementById("results-heading")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const submitPageInput = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const requestedPage = Number.parseInt(pageInput, 10);
    if (!Number.isFinite(requestedPage)) return;
    goToPage(requestedPage);
    setPageInput("");
  };

  const hasFilters = Boolean(query || yearFrom || yearTo || selectedPrimary.length || selectedRoles.length || selectedParadigms.length || codeOrProjectOnly);
  const clearFilters = () => {
    setQuery("");
    setYearFrom("");
    setYearTo("");
    setSelectedPrimary([]);
    setSelectedRoles([]);
    setSelectedParadigms([]);
    setMatchMode(DEFAULT_MATCH_MODE);
    setCodeOrProjectOnly(false);
  };
  const switchView = (nextView: PortalView) => {
    if (nextView === view) return;
    setView(nextView);
    clearFilters();
    setCurrentPage(1);
    setExpandedWorkId(null);
  };
  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="World Model Index home">
          <span className="brandMark" aria-hidden="true"><i className="fas fa-book-open" /></span>
          <span>Survey Index</span>
        </a>
        <button
          className="languageButton"
          type="button"
          onClick={() => setLanguage(language === "en" ? "zh" : "en")}
          aria-label={language === "en" ? "切换到中文" : "Switch to English"}
        >
          {language === "en" ? "中文" : "EN"}
        </button>
      </header>

      <section className="hero" id="top">
        <div className="heroCopy">
          <p className="eyebrow"><span />{t.companion}</p>
          <h1>
            <span className="titleLine">{t.titleA}</span>
            <span className="titleLine titleAccent">{t.titleB}</span>
          </h1>
          <nav className="heroLinks" aria-label="Survey resources">
            {siteMeta.resources.map((resource) => (
              <a
                className={`heroLink resource-${resource.kind} ${resource.placeholder ? "isPlaceholder" : ""}`}
                href={resource.href}
                key={resource.kind}
                onClick={(event) => resource.placeholder && event.preventDefault()}
                aria-label={`${resource.label}${resource.placeholder ? " link placeholder" : ""}`}
                title={resource.placeholder ? `${resource.label} link will be added later` : resource.label}
              >
                <i className={resourceIcons[resource.kind]} aria-hidden="true" />
                <span className="resourceLabel">{resource.label}</span>
              </a>
            ))}
            {(["works", "evaluation"] as PortalView[]).map((portalView) => (
              <button
                className={`heroLink viewLink view-${portalView} ${view === portalView ? "active" : ""}`}
                type="button"
                key={portalView}
                aria-pressed={view === portalView}
                onClick={() => switchView(portalView)}
              >
                <i className={portalView === "works" ? "fas fa-book" : "fas fa-clipboard-check"} aria-hidden="true" />
                <span className="resourceLabel">{portalViewCopy[portalView][language].button}</span>
              </button>
            ))}
          </nav>
          <div className="stats" aria-label="Index statistics">
            <div className="workStat"><strong>{view === "works" ? works.length : evaluationResources.length}</strong><span>{viewText.countLabel}</span></div>
            {primaryRoles.map((group) => (
              <div className={`heroRole role-${group.toLowerCase()}`} key={group}>
                <strong>{group}</strong>
                <span>{roleGroups[group].label[language]}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="logoStage" role="img" aria-label={t.identity}>
          <div className="logoFrame">
            <img className="logoArtwork" src={`${publicBasePath}/world-state-portal-compact-v4.png`} alt="" />
          </div>
        </div>
      </section>

      <section className="catalog" aria-labelledby="catalog-heading">
        <aside className="filters">
          <div className="filterHeading">
            <div><h2 id="catalog-heading">{t.filters}</h2></div>
            <button type="button" className="clearFiltersButton" onClick={clearFilters} disabled={!hasFilters}>{t.clear}</button>
          </div>

          <label className="filterBlock searchBlock">
            <span>{t.search}</span>
            <div className="searchField"><span aria-hidden="true">⌕</span><input value={query} placeholder={viewText.searchPlaceholder} onChange={(event) => setQuery(event.target.value)} /></div>
          </label>

          <div className="filterBlock yearFilterBlock">
            <div className="filterLabel yearFilterLabel"><span>{yearRangeLabel}</span></div>
            <div className="yearRangeControls">
              <select
                value={yearFrom}
                aria-label={yearCopy.from}
                onChange={(event) => {
                  const nextYear = event.target.value;
                  setYearFrom(nextYear);
                  if (nextYear && yearTo && Number(nextYear) > Number(yearTo)) setYearTo(nextYear);
                }}
              >
                <option value="">{yearCopy.from}</option>
                {yearOptions.map((year) => <option key={year} value={year}>{year}</option>)}
              </select>
              <span aria-hidden="true">{yearCopy.separator}</span>
              <select
                value={yearTo}
                aria-label={yearCopy.to}
                onChange={(event) => {
                  const nextYear = event.target.value;
                  setYearTo(nextYear);
                  if (nextYear && yearFrom && Number(nextYear) < Number(yearFrom)) setYearFrom(nextYear);
                }}
              >
                <option value="">{yearCopy.to}</option>
                {yearOptions.map((year) => <option key={year} value={year}>{year}</option>)}
              </select>
            </div>
          </div>

          {view === "evaluation" && (
            <div className="filterBlock">
              <div className="filterLabel primaryFilterLabel">
                <span>{viewText.primary}</span>
              </div>
              <div className="primaryList">
                {primaryRoles.map((group) => (
                  <button
                    className={`primaryOption role-${group.toLowerCase()} ${selectedPrimary.includes(group) ? "active" : ""}`}
                    key={group}
                    type="button"
                    aria-pressed={selectedPrimary.includes(group)}
                    onClick={() => setSelectedPrimary(toggleItem(selectedPrimary, group))}
                  >
                    <strong>{group}</strong><span>{roleGroups[group].label[language]}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {view === "works" && (
            <div className="filterBlock paradigmFilterBlock">
              <div className="filterLabel paradigmFilterLabel">
                <span>{paradigmFilterCopy.label}</span>
                <button
                  type="button"
                  className="filterCollapseButton"
                  aria-expanded={!collapsedFilterSections.types}
                  aria-controls="world-model-type-options"
                  aria-label={`${collapsedFilterSections.types ? collapseCopy.expand : collapseCopy.collapse} ${paradigmFilterCopy.label}`}
                  onClick={() => toggleFilterSection("types")}
                >
                  <span aria-hidden="true">{collapsedFilterSections.types ? "+" : "−"}</span>
                </button>
              </div>
              <div id="world-model-type-options" className="paradigmFilters" aria-label={paradigmFilterCopy.aria} hidden={collapsedFilterSections.types}>
                {researchParadigms.map((paradigm) => (
                  <button
                    type="button"
                    key={paradigm}
                    className={`paradigmOption paradigm-${paradigm} ${selectedParadigms.includes(paradigm) ? "active" : ""}`}
                    aria-pressed={selectedParadigms.includes(paradigm)}
                    onClick={() => setSelectedParadigms(toggleItem(selectedParadigms, paradigm))}
                  >
                    <strong>{paradigmLabels[paradigm][language]}</strong>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="filterBlock matchBlock">
            <span>{t.match}</span>
            <div className="segmented">
              {MATCH_MODE_OPTIONS.map((mode) => (
                <button type="button" key={mode} className={matchMode === mode ? "active" : ""} onClick={() => setMatchMode(mode)}>{t[mode]}</button>
              ))}
            </div>
          </div>

          <div className="filterBlock availabilityBlock">
            <span>{linkFilterCopy.label}</span>
            <button
              type="button"
              className={`availabilityToggle ${codeOrProjectOnly ? "active" : ""}`}
              aria-label={linkFilterCopy.aria}
              aria-pressed={codeOrProjectOnly}
              onClick={() => setCodeOrProjectOnly((value) => !value)}
            >
              <span aria-hidden="true">{codeOrProjectOnly ? "✓" : "+"}</span>
              {linkFilterCopy.button}
            </button>
          </div>

          {view === "works" && (
            <div className="filterBlock">
              <div className="filterLabel primaryFilterLabel">
                <span>{viewText.primary}</span>
                <button
                  type="button"
                  className="filterCollapseButton"
                  aria-expanded={!collapsedFilterSections.primary}
                  aria-controls="primary-role-options"
                  aria-label={`${collapsedFilterSections.primary ? collapseCopy.expand : collapseCopy.collapse} ${viewText.primary}`}
                  onClick={() => toggleFilterSection("primary")}
                >
                  <span aria-hidden="true">{collapsedFilterSections.primary ? "+" : "−"}</span>
                </button>
              </div>
              <div id="primary-role-options" className="primaryList" hidden={collapsedFilterSections.primary}>
                {primaryRoles.map((group) => (
                  <button
                    className={`primaryOption role-${group.toLowerCase()} ${selectedPrimary.includes(group) ? "active" : ""}`}
                    key={group}
                    type="button"
                    aria-pressed={selectedPrimary.includes(group)}
                    onClick={() => setSelectedPrimary(toggleItem(selectedPrimary, group))}
                  >
                    <strong>{group}</strong><span>{roleGroups[group].label[language]}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {view === "works" && (
            <div className="filterBlock">
              <div className="filterLabel detailFilterLabel">
                <span>{viewText.detail}</span>
                <button
                  type="button"
                  className="filterCollapseButton"
                  aria-expanded={!collapsedFilterSections.details}
                  aria-controls="detailed-role-options"
                  aria-label={`${collapsedFilterSections.details ? collapseCopy.expand : collapseCopy.collapse} ${viewText.detail}`}
                  onClick={() => toggleFilterSection("details")}
                >
                  <span aria-hidden="true">{collapsedFilterSections.details ? "+" : "−"}</span>
                </button>
              </div>
              <div id="detailed-role-options" className="roleFilters" hidden={collapsedFilterSections.details}>
                {allRoles.map((role) => (
                  <button
                    type="button"
                    key={role}
                    className={`roleFilter role-${primaryFor(role).toLowerCase()} ${selectedRoles.includes(role) ? "active" : ""}`}
                    aria-pressed={selectedRoles.includes(role)}
                    onClick={() => setSelectedRoles(toggleItem(selectedRoles, role))}
                    title={roleLabels[role][language]}
                  >
                    <strong>{role}</strong><span>{roleLabels[role][language]}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

        </aside>

        <div className="results">
          <div className="resultsHeader">
            <div>
              <h2 id="results-heading">{viewText.catalog}</h2>
              <p>{filteredItems.length} {viewText.result}</p>
            </div>
            <label className="sortControl"><span>{t.sort}</span><select value={sortOrder} onChange={(event) => setSortOrder(event.target.value as SortOrder)}><option value="newest">{t.newest}</option><option value="oldest">{t.oldest}</option></select></label>
          </div>

          {filteredItems.length ? (
            <div className="workGrid">
              {paginatedItems.map((item, index) => {
                const isExpanded = expandedWorkId === item.id;
                if (!("roles" in item)) {
                  const resource = item;
                  return (
                    <article
                      className={`workCard evaluationCard ${isExpanded ? "expanded" : ""}`}
                      key={resource.id}
                      style={{ "--delay": `${Math.min(index, 10) * 24}ms` } as React.CSSProperties}
                    >
                      <div
                        className="cardMain"
                        onClick={(event) => {
                          if ((event.target as HTMLElement).closest("a, button")) return;
                          setExpandedWorkId(isExpanded ? null : resource.id);
                        }}
                      >
                        <div className="cardLead">
                          <div className="cardMeta"><time dateTime={resource.date}>{resource.date}</time><span aria-hidden="true">·</span><span>{resource.venue || "—"}</span></div>
                          <h3>{resource.name}</h3>
                          {resource.title !== resource.name && <p className="resourcePaperTitle">{resource.title}</p>}
                        </div>
                        <div className="cardTaxonomy">
                          <div className="cardRoles" aria-label={language === "en" ? "Evaluation focus" : "评估焦点"}>
                            {resource.focus.map((focus) => (
                              <button
                                type="button"
                                key={focus}
                                className={`cardRole role-${focus.toLowerCase()} ${selectedPrimary.includes(focus) ? "active" : ""}`}
                                onClick={() => setSelectedPrimary(toggleItem(selectedPrimary, focus))}
                                title={roleGroups[focus].label[language]}
                              >{focus}</button>
                            ))}
                          </div>
                        </div>
                        <div className="cardFooter">
                          <div className="cardLinks">
                            {linkOrder.map((kind) => {
                              const url = resource.links[kind];
                              return url ? <a key={kind} href={url} target="_blank" rel="noreferrer">{linkLabels[kind][language]}<span aria-hidden="true">↗</span></a> : null;
                            })}
                          </div>
                          <button
                            type="button"
                            className="summaryToggle"
                            aria-expanded={isExpanded}
                            aria-controls={`details-${resource.id}`}
                            onClick={() => setExpandedWorkId(isExpanded ? null : resource.id)}
                          >{isExpanded ? resourceDetailCopy.close : resourceDetailCopy.open}<span aria-hidden="true">{isExpanded ? "−" : "+"}</span></button>
                        </div>
                      </div>
                      {isExpanded && (
                        <div className="cardSummary resourceDetails" id={`details-${resource.id}`} role="region" aria-label={`${resource.name} ${resourceDetailCopy.label}`}>
                          <div className="summaryHeading"><span className="summaryLabel">{resourceDetailCopy.label}</span></div>
                          <div className="resourceDetailGrid">
                            {[
                              [resourceDetailCopy.type, resource.resourceType],
                              [resourceDetailCopy.target, resource.target],
                              [resourceDetailCopy.scale, resource.scale],
                              [resourceDetailCopy.task, resource.task],
                              [resourceDetailCopy.dimensions, resource.dimensions],
                            ].map(([label, value]) => (
                              <div className="resourceDetail" key={label}>
                                <span>{label}</span>
                                <p>{value || "—"}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </article>
                  );
                }

                const work = item;
                return (
                  <article
                    className={`workCard ${isExpanded ? "expanded" : ""}`}
                    key={work.id}
                    style={{ "--delay": `${Math.min(index, 10) * 24}ms` } as React.CSSProperties}
                  >
                    <div
                      className="cardMain"
                      onClick={(event) => {
                        if ((event.target as HTMLElement).closest("a, button")) return;
                        setExpandedWorkId(isExpanded ? null : work.id);
                      }}
                    >
                      <div className="cardLead">
                        <div className="cardMeta"><time dateTime={work.date}>{work.date}</time><span aria-hidden="true">·</span><span>{work.venue || "—"}</span></div>
                        <h3>{work.title}</h3>
                      </div>
                      <div className="cardTaxonomy">
                        <div className="cardRoles" aria-label="Functional roles">
                          {work.roles.map((role) => (
                            <button
                              type="button"
                              key={role}
                              className={`cardRole role-${primaryFor(role).toLowerCase()} ${selectedRoles.includes(role) ? "active" : ""}`}
                              onClick={() => setSelectedRoles(toggleItem(selectedRoles, role))}
                              title={roleLabels[role][language]}
                            >{role}</button>
                          ))}
                        </div>
                        <div className="cardParadigms" aria-label={paradigmFilterCopy.aria}>
                          {work.paradigms.map((paradigm) => (
                            <button
                              type="button"
                              key={paradigm}
                              className={`cardParadigm paradigm-${paradigm} ${selectedParadigms.includes(paradigm) ? "active" : ""}`}
                              aria-pressed={selectedParadigms.includes(paradigm)}
                              onClick={() => setSelectedParadigms(toggleItem(selectedParadigms, paradigm))}
                            >{`#${cardParadigmLabels[paradigm][language]}`}</button>
                          ))}
                        </div>
                      </div>
                      <div className="cardFooter">
                        <div className="cardLinks">
                          {linkOrder.map((kind) => {
                            const url = work.links[kind];
                            return url ? <a key={kind} href={url} target="_blank" rel="noreferrer">{linkLabels[kind][language]}<span aria-hidden="true">↗</span></a> : null;
                          })}
                        </div>
                        <button
                          type="button"
                          className="summaryToggle"
                          aria-expanded={isExpanded}
                          aria-controls={`summary-${work.id}`}
                          onClick={() => setExpandedWorkId(isExpanded ? null : work.id)}
                        >{isExpanded ? summaryCopy.close : summaryCopy.open}<span aria-hidden="true">{isExpanded ? "−" : "+"}</span></button>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="cardSummary" id={`summary-${work.id}`} role="region" aria-label={`${work.name} ${summaryCopy.label}`}>
                        <div className="summaryHeading">
                          <span className="summaryLabel">{summaryCopy.label}</span>
                          {work.summary && (
                            <span className="summaryAttribution">
                              <i className="fas fa-robot" aria-hidden="true" />
                              <span>{summaryCopy.attribution}</span>
                            </span>
                          )}
                        </div>
                        <p>{work.summary?.[language] ?? summaryCopy.placeholder}</p>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="emptyState"><span>∅</span><h3>{viewText.empty}</h3><button type="button" onClick={clearFilters}>{viewText.reset}</button></div>
          )}

          {filteredItems.length > 0 && (
            <nav className="pagination" aria-label={viewText.paginationLabel}>
              <div className="paginationMeta">
                <p>{paginationCopy.page} {currentPage} {paginationCopy.of} {totalPages}</p>
                <label className="pageSizeControl">
                  <span>{paginationCopy.perPage}</span>
                  <select
                    value={pageSize}
                    aria-label={viewText.perPageLabel}
                    onChange={(event) => setPageSize(Number(event.target.value) as PageSize)}
                  >
                    {PAGE_SIZE_OPTIONS.map((size) => <option key={size} value={size}>{size}</option>)}
                  </select>
                </label>
              </div>
              <div className="paginationControls">
                <button type="button" className="paginationArrow" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>{paginationCopy.previous}</button>
                <div className="paginationPages">
                  {paginationItems.map((item) => typeof item === "number" ? (
                    <button
                      type="button"
                      key={item}
                      className={item === currentPage ? "active" : ""}
                      aria-current={item === currentPage ? "page" : undefined}
                      aria-label={`${paginationCopy.page} ${item}`}
                      onClick={() => goToPage(item)}
                    >{item}</button>
                  ) : (
                    <span className="paginationEllipsis" aria-hidden="true" key={item}>…</span>
                  ))}
                </div>
                <button type="button" className="paginationArrow" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>{paginationCopy.next}</button>
                <form className="pageJump" aria-label={paginationCopy.jumpLabel} onSubmit={submitPageInput}>
                  <label>
                    <span>{paginationCopy.jump}</span>
                    <input
                      type="number"
                      min="1"
                      max={totalPages}
                      step="1"
                      inputMode="numeric"
                      required
                      value={pageInput}
                      placeholder={`1–${totalPages}`}
                      aria-label={paginationCopy.jumpLabel}
                      onChange={(event) => setPageInput(event.target.value)}
                    />
                  </label>
                  <button type="submit">{paginationCopy.go}</button>
                </form>
              </div>
            </nav>
          )}
        </div>
      </section>

      <footer><p>{footerCopy.copyright}</p><p>{footerCopy.descriptor}</p></footer>
    </main>
  );
}
