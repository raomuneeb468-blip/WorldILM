import React, { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  generateStructuredSlides,
  generateFallbackSlides,
  exportSlidesToPdf,
  StructuredSlide,
  SlideDeckConfig
} from "../lib/slideGeneratorEngine";
import { InteractiveSlideViewer } from "./InteractiveSlideViewer";
import {
  FileText,
  Check,
  CheckCircle2,
  Eye,
  X,
  ArrowRight,
  ArrowLeft,
  Search,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  User,
  BookOpen,
  ListOrdered,
  AlertCircle,
  Briefcase,
  Building,
  Layers,
  Download,
  Loader2,
  Play,
  Maximize2,
  FileDown,
  ShieldCheck
} from "lucide-react";

export interface DocumentDetails {
  authorName: string;
  authorRole?: string;
  authorOrg?: string;
  topicName: string;
  subtopics: string[];
  additionalDetails: { id: string; label: string; value: string }[];
}

export interface DocumentPageContent {
  title: string;
  subtitle: string;
  bullets: string[];
  stat?: { value: string; label: string };
  badge?: string;
  type?: "title" | "grid" | "stat" | "split" | "roadmap" | "definition" | "table";
}

export interface RawDocumentData {
  t: string;
  s: string;
  bg: string;
  fg: string;
  ac: string;
  font: string;
  layout: number;
  category: "Executive Strategy" | "Tech & AI Spec" | "Academic & Research" | "Legal & Corporate" | "Business Proposal" | "Marketing & Brand" | "Finance & Audit";
}

export interface DocumentTemplate {
  id: string;
  title: string;
  category: "Executive Strategy" | "Tech & AI Spec" | "Academic & Research" | "Legal & Corporate" | "Business Proposal" | "Marketing & Brand" | "Finance & Audit";
  pagesCount: number;
  author: string;
  authorBadge: string;
  tagline: string;
  description: string;
  raw: RawDocumentData;
  pages: DocumentPageContent[];
  samplePrompt: string;
}

export const DOC_CATEGORIES = [
  "All",
  "Executive Strategy",
  "Tech & AI Spec",
  "Academic & Research",
  "Legal & Corporate",
  "Business Proposal",
  "Marketing & Brand",
  "Finance & Audit"
] as const;

// 50 Executive White Document Presets with Vibrant Accent Frames
const RAW_DOCUMENTS: RawDocumentData[] = [
  { t: "Executive Q3 Strategy", s: "A4 Report", bg: "#ffffff", fg: "#0f172a", ac: "#4f46e5", font: "'Space Grotesk', sans-serif", layout: 1, category: "Executive Strategy" },
  { t: "System Architecture Spec", s: "Whitepaper", bg: "#ffffff", fg: "#0f172a", ac: "#0284c7", font: "'JetBrains Mono', monospace", layout: 2, category: "Tech & AI Spec" },
  { t: "Empirical AI Research", s: "Academic", bg: "#ffffff", fg: "#0f172a", ac: "#7c3aed", font: "'Playfair Display', serif", layout: 3, category: "Academic & Research" },
  { t: "Master Service Agreement", s: "Legal Contract", bg: "#ffffff", fg: "#0f172a", ac: "#059669", font: "'Cormorant Garamond', serif", layout: 4, category: "Legal & Corporate" },
  { t: "Enterprise SaaS Proposal", s: "Business Doc", bg: "#ffffff", fg: "#0f172a", ac: "#0891b2", font: "'Space Grotesk', sans-serif", layout: 5, category: "Business Proposal" },
  { t: "Brand Guidelines Manual", s: "Brand Doc", bg: "#ffffff", fg: "#0f172a", ac: "#ea580c", font: "'Fraunces', serif", layout: 6, category: "Marketing & Brand" },
  { t: "Q2 Financial Audit", s: "Audit Spec", bg: "#ffffff", fg: "#0f172a", ac: "#0d9488", font: "'Sora', sans-serif", layout: 7, category: "Finance & Audit" },
  { t: "Cybersecurity Policy", s: "Compliance", bg: "#ffffff", fg: "#0f172a", ac: "#dc2626", font: "'JetBrains Mono', monospace", layout: 8, category: "Tech & AI Spec" },
  { t: "Global Market Forecast", s: "Analysis", bg: "#ffffff", fg: "#0f172a", ac: "#2563eb", font: "'Space Grotesk', sans-serif", layout: 9, category: "Executive Strategy" },
  { t: "Clinical Trial Study", s: "Research Paper", bg: "#ffffff", fg: "#0f172a", ac: "#c026d3", font: "'Cormorant Garamond', serif", layout: 10, category: "Academic & Research" },
  { t: "Non-Disclosure Agreement", s: "Legal Brief", bg: "#ffffff", fg: "#0f172a", ac: "#475569", font: "'Libre Caslon Text', serif", layout: 11, category: "Legal & Corporate" },
  { t: "Product Requirements Spec", s: "PRD", bg: "#ffffff", fg: "#0f172a", ac: "#0284c7", font: "'Unbounded', sans-serif", layout: 12, category: "Tech & AI Spec" },
  { t: "Series B Investment Memo", s: "Memo", bg: "#ffffff", fg: "#0f172a", ac: "#ca8a04", font: "'Fraunces', serif", layout: 13, category: "Business Proposal" },
  { t: "ESG Sustainability Report", s: "Annual Doc", bg: "#ffffff", fg: "#0f172a", ac: "#16a34a", font: "'Sora', sans-serif", layout: 14, category: "Executive Strategy" },
  { t: "Product Launch Playbook", s: "Marketing", bg: "#ffffff", fg: "#0f172a", ac: "#d946ef", font: "'Space Grotesk', sans-serif", layout: 15, category: "Marketing & Brand" },
  { t: "LLM Fine-Tuning Study", s: "Research", bg: "#ffffff", fg: "#0f172a", ac: "#9333ea", font: "'JetBrains Mono', monospace", layout: 1, category: "Tech & AI Spec" },
  { t: "Standard Operating Manual", s: "Operations", bg: "#ffffff", fg: "#0f172a", ac: "#334155", font: "'Space Grotesk', sans-serif", layout: 2, category: "Executive Strategy" },
  { t: "Cloud Migration Plan", s: "Engineering", bg: "#ffffff", fg: "#0f172a", ac: "#1d4ed8", font: "'Space Grotesk', sans-serif", layout: 3, category: "Tech & AI Spec" },
  { t: "Commercial Lease Terms", s: "Contract", bg: "#ffffff", fg: "#0f172a", ac: "#52525b", font: "'Cormorant Garamond', serif", layout: 4, category: "Legal & Corporate" },
  { t: "Quarterly Earnings Brief", s: "Finance", bg: "#ffffff", fg: "#0f172a", ac: "#047857", font: "'Sora', sans-serif", layout: 5, category: "Finance & Audit" },
  { t: "Customer Case Study", s: "Whitepaper", bg: "#ffffff", fg: "#0f172a", ac: "#6366f1", font: "'Space Grotesk', sans-serif", layout: 6, category: "Business Proposal" },
  { t: "Creative Content Strategy", s: "Brand Brief", bg: "#ffffff", fg: "#0f172a", ac: "#c026d3", font: "'Fraunces', serif", layout: 7, category: "Marketing & Brand" },
  { t: "Quantum Computing Paper", s: "Academic", bg: "#ffffff", fg: "#0f172a", ac: "#0891b2", font: "'JetBrains Mono', monospace", layout: 8, category: "Academic & Research" },
  { t: "Vendor Service SLA", s: "SLA Spec", bg: "#ffffff", fg: "#0f172a", ac: "#e11d48", font: "'Space Grotesk', sans-serif", layout: 9, category: "Legal & Corporate" },
  { t: "M&A Strategic Evaluation", s: "Executive Memo", bg: "#ffffff", fg: "#0f172a", ac: "#d97706", font: "'Playfair Display', serif", layout: 10, category: "Executive Strategy" },
  { t: "Data Privacy ISO Audit", s: "Compliance", bg: "#ffffff", fg: "#0f172a", ac: "#059669", font: "'JetBrains Mono', monospace", layout: 11, category: "Finance & Audit" },
  { t: "SaaS API Specifications", s: "Tech Doc", bg: "#ffffff", fg: "#0f172a", ac: "#0284c7", font: "'JetBrains Mono', monospace", layout: 12, category: "Tech & AI Spec" },
  { t: "Growth Marketing Playbook", s: "Guide", bg: "#ffffff", fg: "#0f172a", ac: "#f97316", font: "'Space Grotesk', sans-serif", layout: 13, category: "Marketing & Brand" },
  { t: "Risk Management Matrix", s: "Audit", bg: "#ffffff", fg: "#0f172a", ac: "#ef4444", font: "'Sora', sans-serif", layout: 14, category: "Finance & Audit" },
  { t: "R&D Grant Proposal", s: "Grant Spec", bg: "#ffffff", fg: "#0f172a", ac: "#8b5cf6", font: "'Space Grotesk', sans-serif", layout: 15, category: "Business Proposal" },
  { t: "Macroeconomic Analysis", s: "Report", bg: "#ffffff", fg: "#0f172a", ac: "#3b82f6", font: "'Playfair Display', serif", layout: 1, category: "Academic & Research" },
  { t: "Disaster Recovery Plan", s: "IT Spec", bg: "#ffffff", fg: "#0f172a", ac: "#d97706", font: "'JetBrains Mono', monospace", layout: 2, category: "Tech & AI Spec" },
  { t: "Intellectual Property Patent", s: "Legal Brief", bg: "#ffffff", fg: "#0f172a", ac: "#64748b", font: "'Cormorant Garamond', serif", layout: 3, category: "Legal & Corporate" },
  { t: "Procurement Guidelines", s: "Policy", bg: "#ffffff", fg: "#0f172a", ac: "#10b981", font: "'Sora', sans-serif", layout: 4, category: "Executive Strategy" },
  { t: "Public Relations Strategy", s: "PR Brief", bg: "#ffffff", fg: "#0f172a", ac: "#d946ef", font: "'Fraunces', serif", layout: 5, category: "Marketing & Brand" },
  { t: "Annual Tax & Compliance", s: "Finance Doc", bg: "#ffffff", fg: "#0f172a", ac: "#059669", font: "'Space Grotesk', sans-serif", layout: 6, category: "Finance & Audit" },
  { t: "Autonomous Systems Review", s: "Whitepaper", bg: "#ffffff", fg: "#0f172a", ac: "#06b6d4", font: "'JetBrains Mono', monospace", layout: 7, category: "Tech & AI Spec" },
  { t: "Human Resources Handbook", s: "HR Policy", bg: "#ffffff", fg: "#0f172a", ac: "#ea580c", font: "'Sora', sans-serif", layout: 8, category: "Executive Strategy" },
  { t: "Joint Venture Agreement", s: "Contract", bg: "#ffffff", fg: "#0f172a", ac: "#6366f1", font: "'Libre Caslon Text', serif", layout: 9, category: "Legal & Corporate" },
  { t: "Clinical Psychology Study", s: "Paper", bg: "#ffffff", fg: "#0f172a", ac: "#a855f7", font: "'Cormorant Garamond', serif", layout: 10, category: "Academic & Research" },
  { t: "Fintech Regulatory Spec", s: "Whitepaper", bg: "#ffffff", fg: "#0f172a", ac: "#16a34a", font: "'Space Grotesk', sans-serif", layout: 11, category: "Finance & Audit" },
  { t: "Global Expansion Strategy", s: "Report", bg: "#ffffff", fg: "#0f172a", ac: "#2563eb", font: "'Space Grotesk', sans-serif", layout: 12, category: "Executive Strategy" },
  { t: "Social Media Campaign Plan", s: "Brief", bg: "#ffffff", fg: "#0f172a", ac: "#ec4899", font: "'Fraunces', serif", layout: 13, category: "Marketing & Brand" },
  { t: "AI Ethics & Safety Charter", s: "Charter", bg: "#ffffff", fg: "#0f172a", ac: "#9333ea", font: "'Space Grotesk', sans-serif", layout: 14, category: "Tech & AI Spec" },
  { t: "Commercial Real Estate Memo", s: "Proposal", bg: "#ffffff", fg: "#0f172a", ac: "#ca8a04", font: "'Playfair Display', serif", layout: 15, category: "Business Proposal" },
  { t: "High-Frequency Trading Spec", s: "Engineering", bg: "#ffffff", fg: "#0f172a", ac: "#0284c7", font: "'JetBrains Mono', monospace", layout: 1, category: "Tech & AI Spec" },
  { t: "Hospitality Standards Manual", s: "SOP", bg: "#ffffff", fg: "#0f172a", ac: "#65a30d", font: "'Fraunces', serif", layout: 2, category: "Executive Strategy" },
  { t: "Environmental Impact Report", s: "A4 Study", bg: "#ffffff", fg: "#0f172a", ac: "#16a34a", font: "'Sora', sans-serif", layout: 3, category: "Academic & Research" },
  { t: "Software Copyright Patent", s: "Legal Brief", bg: "#ffffff", fg: "#0f172a", ac: "#475569", font: "'Libre Caslon Text', serif", layout: 4, category: "Legal & Corporate" },
  { t: "Q4 Investor Newsletter", s: "Report", bg: "#ffffff", fg: "#0f172a", ac: "#4f46e5", font: "'Space Grotesk', sans-serif", layout: 5, category: "Business Proposal" }
];

const buildDocumentTemplates = (): DocumentTemplate[] => {
  return RAW_DOCUMENTS.map((d, i) => {
    const pagesCount = 4 + (i % 8);
    const authorName = i % 3 === 0 ? "Worldilm AI Studio" : i % 2 === 0 ? "Executive Strategy Group" : "Chief Editor";

    const generateUniquePages = (docTopic: string, category: string, totalCount: number): DocumentPageContent[] => {
      const pages: DocumentPageContent[] = [];

      pages.push({
        badge: "Title Cover Page",
        type: "title",
        title: docTopic,
        subtitle: `${d.s} — Official Executive A4 Document`,
        bullets: [
          `Author & Authoring Body: ${authorName}`,
          `Document Classification: ${category}`,
          `Format Specification: A4 Portrait Report (210 x 297 mm)`
        ],
        stat: { value: `${totalCount} Pages`, label: "Complete Document" }
      });

      pages.push({
        badge: "Executive Summary",
        type: "definition",
        title: "01. Executive Summary & Core Objectives",
        subtitle: `High-level directive, strategic scope, and analytical framework for ${docTopic}.`,
        bullets: [
          "Directive 1.1: Establishment of baseline parameters and core compliance metrics",
          "Directive 1.2: Cross-departmental operational alignment and governance",
          "Directive 1.3: Risk mitigation strategies and continuous auditing mechanisms"
        ],
        stat: { value: "100%", label: "Compliance Target" }
      });

      for (let p = 3; p <= totalCount; p++) {
        pages.push({
          badge: `Section 0${p - 1}`,
          type: p % 2 === 0 ? "grid" : "table",
          title: `0${p - 1}. Strategic Section & Detailed Findings ${p - 2}`,
          subtitle: `In-depth evaluation and implementation guidelines for ${docTopic}.`,
          bullets: [
            `Key Metric A: Quantitative baseline analysis for Phase ${p - 2}`,
            `Key Metric B: Resource optimization and procedural workflow streamlining`,
            `Key Metric C: Verification and continuous monitoring protocol`
          ],
          stat: { value: `${80 + (p * 2)}%`, label: "Execution Index" }
        });
      }

      return pages;
    };

    return {
      id: `doc-${i + 1}`,
      title: d.t,
      category: d.category,
      pagesCount,
      author: authorName,
      authorBadge: "Verified A4 Preset",
      tagline: `Professional ${d.category} document preset in ${d.s} format`,
      description: `Structured executive document layout designed for formal whitepapers, reports, and strategic contracts. Uses typography in ${d.font.replace(/,.*$/, "").replace(/['"]/g, "")}.`,
      raw: d,
      pages: generateUniquePages(d.t, d.category, pagesCount),
      samplePrompt: `Generate a formal ${d.s} document for "${d.t}" with executive summary, empirical analysis, data tables, and conclusion.`
    };
  });
};

const RenderCoverContent: React.FC<{ raw: RawDocumentData }> = ({ raw }) => {
  return (
    <div
      className="w-full h-full p-3 sm:p-3.5 flex flex-col justify-between text-left select-none overflow-hidden relative bg-white border-2 rounded-xl shadow-xs"
      style={{ borderColor: raw.ac, color: "#0f172a", fontFamily: raw.font }}
    >
      {/* Top Header Ribbon */}
      <div className="space-y-1.5 z-10">
        <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
          <span
            className="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded text-white shadow-xs"
            style={{ backgroundColor: raw.ac }}
          >
            {raw.s}
          </span>
          <span className="text-[8px] font-bold text-slate-400 font-mono">A4 DOC</span>
        </div>

        <h3 className="text-[11px] sm:text-xs font-extrabold text-slate-900 tracking-tight line-clamp-2 leading-tight">
          {raw.t}
        </h3>

        {/* Interior Design Elements */}
        <div className="pt-1 space-y-1">
          <div className="h-1 w-10 rounded-full" style={{ backgroundColor: raw.ac }} />
          <p className="text-[8px] text-slate-500 font-medium line-clamp-2 leading-snug">
            Official Executive Specification • Confidential Record
          </p>
        </div>
      </div>

      {/* Decorative Bottom Bar */}
      <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[7.5px] font-bold text-slate-400 font-mono z-10">
        <span className="truncate max-w-[80px]" style={{ color: raw.ac }}>{raw.category}</span>
        <span>2026 REF</span>
      </div>
    </div>
  );
};

export interface DocumentsStudioProps {
  onBackToChat?: () => void;
  onSelectAndContinue?: (template: DocumentTemplate, details?: DocumentDetails) => void;
}

export const DocumentsStudio: React.FC<DocumentsStudioProps> = ({
  onBackToChat,
  onSelectAndContinue
}) => {
  const [step, setStep] = useState<"select" | "details" | "generating" | "pdf_ready">("select");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const [docTemplates] = useState<DocumentTemplate[]>(buildDocumentTemplates);
  const [chosenTemplate, setChosenTemplate] = useState<DocumentTemplate | null>(docTemplates[0]);

  // Preview Modal State
  const [previewModalTemplate, setPreviewModalTemplate] = useState<DocumentTemplate | null>(null);
  const [previewPageIdx, setPreviewPageIdx] = useState<number>(0);

  // Document Details Form State
  const [authorName, setAuthorName] = useState("Dr. Alex Mercer");
  const [authorRole, setAuthorRole] = useState("Chief Technology Officer");
  const [authorOrg, setAuthorOrg] = useState("Nexus Global Systems");
  const [topicName, setTopicName] = useState("Q3 Executive Strategy & System Spec");
  const [subtopics, setSubtopics] = useState<string[]>([
    "Executive Summary & Objectives",
    "Technical Architecture & Security",
    "Financial Projections & Budget",
    "Operational Execution Roadmap"
  ]);

  const [additionalDetails, setAdditionalDetails] = useState<{ id: string; label: string; value: string }[]>([
    { id: "1", label: "Confidentiality", value: "Executive Review Only" },
    { id: "2", label: "Compliance Standard", value: "ISO-27001 & SOC-2 Type II" }
  ]);

  const [showValidationErrors, setShowValidationErrors] = useState(false);

  // AI Generation State
  const [generatedPages, setGeneratedPages] = useState<StructuredSlide[]>([]);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentPhaseText, setCurrentPhaseText] = useState("Initializing A4 Document Engine...");

  // Filtered Templates
  const filteredDocs = useMemo(() => {
    return docTemplates.filter((t) => {
      const matchCat = selectedCategory === "All" || t.category === selectedCategory;
      const matchSearch =
        searchQuery.trim() === "" ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [docTemplates, selectedCategory, searchQuery]);

  const handleSelectTemplate = (tmpl: DocumentTemplate) => {
    setChosenTemplate(tmpl);
    setTopicName(tmpl.title);
    setSubtopics(tmpl.pages.slice(1, 5).map((p) => p.title.replace(/^\d+\.\s*/, "")));
    setStep("details");
  };

  // Add/Remove Subtopics
  const handleAddSubtopic = () => {
    setSubtopics([...subtopics, `Section 0${subtopics.length + 1}: Strategic Target`]);
  };

  const handleUpdateSubtopic = (index: number, val: string) => {
    const updated = [...subtopics];
    updated[index] = val;
    setSubtopics(updated);
  };

  const handleDeleteSubtopic = (index: number) => {
    if (subtopics.length <= 1) return;
    setSubtopics(subtopics.filter((_, i) => i !== index));
  };

  // Add/Remove Additional Detail Key-Values
  const handleAddDetail = () => {
    setAdditionalDetails([...additionalDetails, { id: Date.now().toString(), label: "Parameter", value: "Specification" }]);
  };

  const handleUpdateDetail = (id: string, field: "label" | "value", val: string) => {
    setAdditionalDetails(
      additionalDetails.map((d) => (d.id === id ? { ...d, [field]: val } : d))
    );
  };

  const handleDeleteDetail = (id: string) => {
    setAdditionalDetails(additionalDetails.filter((d) => d.id !== id));
  };

  // Start AI Generation and PDF Compilation
  const startAiGenerationAndPdf = () => {
    setStep("generating");
    setGenerationProgress(5);
    setCurrentPhaseText("Parsing Executive Metadata & Outline...");

    const chosen = chosenTemplate || docTemplates[0];

    const config: SlideDeckConfig = {
      topicName: topicName.trim() || "Executive Document",
      authorName: authorName.trim() || "Author",
      authorRole: authorRole.trim(),
      authorOrg: authorOrg.trim(),
      subtopics: subtopics.filter((s) => s.trim().length > 0),
      additionalDetails: additionalDetails.filter((d) => d.label.trim() && d.value.trim()),
      templateTitle: chosen.title,
      category: chosen.category,
      accentColor: chosen.raw.ac || "#6366f1",
      bgColor: chosen.raw.bg || "#ffffff",
      fgColor: chosen.raw.fg || "#0f172a",
      font: chosen.raw.font || "'Space Grotesk', sans-serif",
      layoutNumber: chosen.raw.layout || 1
    };

    setTimeout(() => {
      setGenerationProgress(35);
      setCurrentPhaseText("Structuring A4 Pages, Watermarks & Tables...");
    }, 400);

    setTimeout(() => {
      setGenerationProgress(70);
      setCurrentPhaseText("Rendering Executive Typography & Layouts...");
    }, 800);

    setTimeout(() => {
      setGenerationProgress(90);
      setCurrentPhaseText("Finalizing Document Pages & Export Engine...");

      const pages = generateFallbackSlides({
        ...config,
        targetSlideCount: chosen.pagesCount || 10,
        bgColor: "#ffffff",
        fgColor: "#0f172a"
      });
      setGeneratedPages(pages);
    }, 1200);

    setTimeout(() => {
      setGenerationProgress(100);
      setStep("pdf_ready");
    }, 1500);
  };

  // 1. GENERATING PROGRESS SCREEN
  if (step === "generating") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full bg-zinc-950 text-white p-6 relative overflow-hidden font-sans">
        <div className="max-w-md w-full bg-zinc-900/90 border border-zinc-800 rounded-3xl p-8 shadow-2xl text-center space-y-6 relative z-10 backdrop-blur-xl">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto shadow-inner">
            <FileText size={32} className="animate-pulse" />
          </div>

          <div>
            <h2 className="text-xl font-black tracking-tight text-white">
              Compiling Executive A4 Document
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Building custom pages, watermarks, data tables, and print-ready PDF layout.
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-full bg-zinc-800 h-2.5 rounded-full overflow-hidden p-0.5 border border-zinc-700/50">
              <motion.div
                className="h-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-indigo-400 rounded-full"
                animate={{ width: `${generationProgress}%` }}
                transition={{ ease: "easeOut", duration: 0.2 }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 font-bold">
              <span>{currentPhaseText}</span>
              <span>{Math.round(generationProgress)}%</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. INTERACTIVE VIEWER MODE (MODE="DOCUMENT")
  if (step === "pdf_ready" && chosenTemplate) {
    const config: SlideDeckConfig = {
      topicName: topicName.trim() || "Executive Document",
      authorName: authorName.trim() || "Author",
      authorRole: authorRole.trim(),
      authorOrg: authorOrg.trim(),
      subtopics: subtopics.filter((s) => s.trim().length > 0),
      additionalDetails: additionalDetails.filter((d) => d.label.trim() && d.value.trim()),
      templateTitle: chosenTemplate.title,
      category: chosenTemplate.category,
      accentColor: chosenTemplate.raw.ac || "#6366f1",
      bgColor: chosenTemplate.raw.bg || "#ffffff",
      fgColor: chosenTemplate.raw.fg || "#0f172a",
      font: chosenTemplate.raw.font || "'Space Grotesk', sans-serif",
      layoutNumber: chosenTemplate.raw.layout || 1
    };

    return (
      <InteractiveSlideViewer
        slides={generatedPages}
        config={config}
        onRegenerate={startAiGenerationAndPdf}
        onBack={() => setStep("details")}
        onBackToChat={onBackToChat}
        mode="document"
      />
    );
  }

  // 3. STEP 2: DETAILS FORM
  if (step === "details") {
    if (!chosenTemplate) {
      setStep("select");
      return null;
    }

    const isAuthorValid = authorName.trim().length > 0;
    const isTopicValid = topicName.trim().length > 0;
    const validSubtopics = subtopics.filter((s) => s.trim().length > 0);
    const isSubtopicsValid = validSubtopics.length > 0;
    const isFormValid = isAuthorValid && isTopicValid && isSubtopicsValid;

    const handleNextSubmit = () => {
      setShowValidationErrors(true);
      if (!isFormValid) return;
      startAiGenerationAndPdf();
    };

    return (
      <div className="flex-1 flex flex-col h-full bg-zinc-50 dark:bg-zinc-950 p-3 sm:p-6 overflow-y-auto relative font-sans">
        <div className="max-w-4xl w-full mx-auto space-y-5 sm:space-y-6 pb-28">
          {/* Header Bar */}
          <div className="border-b border-zinc-200 dark:border-zinc-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setStep("select")}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-all cursor-pointer flex items-center justify-center shadow-2xs shrink-0"
                title="Back to Document Selection"
              >
                <ArrowLeft size={18} className="stroke-[2.5]" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-950/80 border border-indigo-300/60 dark:border-indigo-800 px-2 py-0.5 rounded-md">
                    Step 2 of 2
                  </span>
                  <h1 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
                    Document Details & Outline
                  </h1>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Provide required author metadata, topic title, section outline, and optional custom parameters.
                </p>
              </div>
            </div>
          </div>

          {/* Selected Template Summary Banner */}
          <div className="bg-white dark:bg-zinc-900 border border-indigo-500/40 rounded-2xl p-3.5 sm:p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-16 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 shrink-0 relative bg-zinc-950">
                <RenderCoverContent raw={chosenTemplate.raw} />
              </div>
              <div>
                <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">
                  Selected Document Format
                </div>
                <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
                  {chosenTemplate.title}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {chosenTemplate.pagesCount} A4 Pages • {chosenTemplate.category}
                </p>
              </div>
            </div>
            <button
              onClick={() => setStep("select")}
              className="self-start sm:self-center px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Change Preset
            </button>
          </div>

          {/* Validation Errors Notice */}
          {showValidationErrors && !isFormValid && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-center gap-2.5">
              <AlertCircle size={18} className="shrink-0" />
              <div>
                <p className="font-bold">Please complete the compulsory fields before proceeding:</p>
                <ul className="list-disc list-inside mt-1 space-y-0.5 text-[11px]">
                  {!isAuthorValid && <li>Author Name is compulsory.</li>}
                  {!isTopicValid && <li>Document Topic Name is compulsory.</li>}
                  {!isSubtopicsValid && <li>At least one section in the Outline is compulsory.</li>}
                </ul>
              </div>
            </div>
          )}

          {/* SECTION 1: AUTHOR INFORMATION */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/60 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <User size={18} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-zinc-100">
                    Author & Authoring Body
                  </h3>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Specify who is authoring or issuing this official document
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md">
                Compulsory
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center justify-between">
                  <span>Author Name <span className="text-red-500">*</span></span>
                  {showValidationErrors && !isAuthorValid && (
                    <span className="text-[10px] font-semibold text-red-500">Compulsory</span>
                  )}
                </label>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="e.g. Dr. Alex Mercer / Lead Counsel"
                    className={`w-full pl-9 pr-3 py-2.5 bg-zinc-50 dark:bg-zinc-950/80 border ${
                      showValidationErrors && !isAuthorValid
                        ? "border-red-500 focus:ring-red-500"
                        : "border-zinc-200 dark:border-zinc-800 focus:ring-indigo-500"
                    } rounded-xl text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 transition-all`}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                  Role / Title <span className="text-zinc-400 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <Briefcase size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    value={authorRole}
                    onChange={(e) => setAuthorRole(e.target.value)}
                    placeholder="e.g. Chief Technology Officer"
                    className="w-full pl-9 pr-3 py-2.5 bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                  Organization / Entity <span className="text-zinc-400 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <Building size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    value={authorOrg}
                    onChange={(e) => setAuthorOrg(e.target.value)}
                    placeholder="e.g. Nexus Global Systems"
                    className="w-full pl-9 pr-3 py-2.5 bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: DOCUMENT TOPIC & OUTLINE */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/60 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <BookOpen size={18} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-zinc-100">
                    Document Topic & Section Outline
                  </h3>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Define the core topic and section headings for document pages
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md">
                Compulsory
              </span>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center justify-between">
                  <span>Document Title <span className="text-red-500">*</span></span>
                  {showValidationErrors && !isTopicValid && (
                    <span className="text-[10px] font-semibold text-red-500">Compulsory</span>
                  )}
                </label>
                <input
                  type="text"
                  value={topicName}
                  onChange={(e) => setTopicName(e.target.value)}
                  placeholder="e.g. Annual Executive Architecture & Strategy Review"
                  className={`w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-950/80 border ${
                    showValidationErrors && !isTopicValid
                      ? "border-red-500 focus:ring-red-500"
                      : "border-zinc-200 dark:border-zinc-800 focus:ring-indigo-500"
                  } rounded-xl text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 transition-all font-medium`}
                />
              </div>

              {/* Section Headings List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                    <ListOrdered size={14} className="text-indigo-500" />
                    <span>Document Outline / Headings <span className="text-red-500">*</span></span>
                  </label>
                  <button
                    onClick={handleAddSubtopic}
                    className="px-2.5 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus size={13} />
                    <span>Add Section</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {subtopics.map((sub, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="w-6 text-[11px] font-mono font-bold text-zinc-400 shrink-0 text-right">
                        0{idx + 1}.
                      </span>
                      <input
                        type="text"
                        value={sub}
                        onChange={(e) => handleUpdateSubtopic(idx, e.target.value)}
                        placeholder={`Section heading 0${idx + 1}...`}
                        className="flex-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-medium text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      {subtopics.length > 1 && (
                        <button
                          onClick={() => handleDeleteSubtopic(idx)}
                          className="p-2 text-zinc-400 hover:text-red-500 transition-colors cursor-pointer"
                          title="Remove Section"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: ADDITIONAL CUSTOM METADATA */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/60 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <Layers size={18} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-zinc-100">
                    Additional Parameters & Metadata
                  </h3>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Optional key-value parameters included on the cover page
                  </p>
                </div>
              </div>
              <button
                onClick={handleAddDetail}
                className="px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-bold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus size={13} />
                <span>Add Field</span>
              </button>
            </div>

            <div className="space-y-2">
              {additionalDetails.map((item) => (
                <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                  <input
                    type="text"
                    value={item.label}
                    onChange={(e) => handleUpdateDetail(item.id, "label", e.target.value)}
                    placeholder="Field Name (e.g. Compliance)"
                    className="col-span-5 px-3 py-2 bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-medium text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <input
                    type="text"
                    value={item.value}
                    onChange={(e) => handleUpdateDetail(item.id, "value", e.target.value)}
                    placeholder="Field Value (e.g. ISO-27001)"
                    className="col-span-6 px-3 py-2 bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-medium text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    onClick={() => handleDeleteDetail(item.id)}
                    className="col-span-1 p-2 text-zinc-400 hover:text-red-500 transition-colors cursor-pointer flex justify-center"
                    title="Delete Field"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* ACTION BUTTON BAR */}
          <div className="pt-2 flex items-center justify-between">
            <button
              onClick={() => setStep("select")}
              className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Back to Presets
            </button>

            <button
              onClick={handleNextSubmit}
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-indigo-500/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Sparkles size={16} />
              <span>Compile A4 Document</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. STEP 1: PRESET SELECTION GRID WITH PREVIEW MODAL
  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-50/50 dark:bg-zinc-950 p-3 sm:p-6 overflow-y-auto relative font-sans">
      <div className="max-w-7xl w-full mx-auto space-y-5 sm:space-y-6 pb-28">
        {/* Top Header */}
        <div className="border-b border-zinc-200 dark:border-zinc-800 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-2.5 sm:gap-3.5">
            {onBackToChat && (
              <button
                onClick={onBackToChat}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:scale-105 active:scale-95 text-zinc-700 dark:text-zinc-300 transition-all cursor-pointer flex items-center justify-center shadow-2xs shrink-0 mt-0.5"
                title="Back to Chat"
              >
                <ArrowLeft size={18} className="stroke-[2.5]" />
              </button>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <FileText size={20} />
                </span>
                <span className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Executive A4 Document Studio
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight mt-1">
                Worldilm Executive Document Studio
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Select an executive preset, customize sections & author metadata, and export crisp PDF documents.
              </p>
            </div>
          </div>
        </div>

        {/* Categories Bar & Search Input */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {DOC_CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      isActive
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64 shrink-0">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search document templates..."
                className="w-full pl-8 pr-8 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-2xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Document Templates Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 lg:gap-5">
          {filteredDocs.map((template) => {
            const isChosen = chosenTemplate?.id === template.id;
            return (
              <div
                key={template.id}
                className={`group rounded-2xl border transition-all cursor-pointer flex flex-col justify-between overflow-hidden ${
                  isChosen
                    ? "border-indigo-600 ring-2 ring-indigo-500/40 bg-white dark:bg-zinc-900 shadow-md"
                    : "border-zinc-200/80 dark:border-zinc-800 hover:border-indigo-400 bg-white dark:bg-zinc-900 hover:shadow-lg hover:-translate-y-0.5"
                }`}
              >
                {/* A4 Cover Container (A4 Aspect Ratio 210/297) */}
                <div
                  onClick={() => handleSelectTemplate(template)}
                  className="aspect-[210/297] w-full relative overflow-hidden bg-zinc-950"
                >
                  <RenderCoverContent raw={template.raw} />

                  {/* Quick Preview Overlay Button */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2 gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewModalTemplate(template);
                        setPreviewPageIdx(0);
                      }}
                      className="px-2.5 py-1.5 bg-white/90 hover:bg-white text-zinc-900 text-[10px] font-black rounded-lg shadow-md flex items-center gap-1 cursor-pointer transition-transform active:scale-95"
                    >
                      <Eye size={12} />
                      <span>Preview Pages</span>
                    </button>
                  </div>
                </div>

                {/* Template Info Card Body */}
                <div className="p-2.5 sm:p-3.5 space-y-2 border-t border-zinc-100 dark:border-zinc-800/80">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                      {template.category}
                    </span>
                    <span className="text-[9px] font-mono text-zinc-400 font-bold">
                      {template.pagesCount} Pages
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                      {template.title}
                    </h3>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-0.5 leading-relaxed">
                      {template.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between">
                    <button
                      onClick={() => handleSelectTemplate(template)}
                      className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <span>Use Preset</span>
                      <ArrowRight size={12} />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewModalTemplate(template);
                        setPreviewPageIdx(0);
                      }}
                      className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
                      title="Preview Document Pages"
                    >
                      <Eye size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* PREVIEW MODAL OVERLAY */}
      <AnimatePresence>
        {previewModalTemplate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
            >
              {/* Modal Top Bar */}
              <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">
                    {previewModalTemplate.category} Preset Preview
                  </span>
                  <h3 className="text-base font-black text-zinc-900 dark:text-zinc-100">
                    {previewModalTemplate.title}
                  </h3>
                </div>
                <button
                  onClick={() => setPreviewModalTemplate(null)}
                  className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Page Viewer */}
              <div className="p-6 bg-zinc-950 flex-1 flex flex-col items-center justify-center overflow-y-auto">
                <div className="w-[300px] h-[424px] rounded-xl border border-zinc-700 shadow-2xl overflow-hidden relative bg-white">
                  <div
                    className="w-full h-full p-5 flex flex-col justify-between text-left relative overflow-hidden"
                    style={{
                      background: previewModalTemplate.raw.bg,
                      color: previewModalTemplate.raw.fg,
                      fontFamily: previewModalTemplate.raw.font
                    }}
                  >
                    {/* Header Badge */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span
                          className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded text-white"
                          style={{ backgroundColor: previewModalTemplate.raw.ac }}
                        >
                          {previewModalTemplate.pages[previewPageIdx]?.badge || "PAGE PREVIEW"}
                        </span>
                        <span className="text-[10px] opacity-70 font-mono">
                          Page {previewPageIdx + 1} of {previewModalTemplate.pagesCount}
                        </span>
                      </div>

                      <h2 className="text-sm font-black tracking-tight leading-snug">
                        {previewModalTemplate.pages[previewPageIdx]?.title}
                      </h2>
                      <p className="text-[10px] opacity-80 leading-relaxed">
                        {previewModalTemplate.pages[previewPageIdx]?.subtitle}
                      </p>
                    </div>

                    {/* Bullets Preview */}
                    <div className="space-y-1.5 my-2">
                      {previewModalTemplate.pages[previewPageIdx]?.bullets.map((b, idx) => (
                        <div key={idx} className="flex items-start gap-1.5 text-[9px] opacity-90">
                          <span className="w-1.5 h-1.5 rounded-full bg-current mt-1 shrink-0" />
                          <span>{b}</span>
                        </div>
                      ))}
                    </div>

                    {/* Footer */}
                    <div className="pt-2 border-t border-current/20 flex items-center justify-between text-[9px] opacity-70 font-mono">
                      <span>CONFIDENTIAL DOCUMENT</span>
                      <span>A4 FORMAT</span>
                    </div>
                  </div>
                </div>

                {/* Page Navigation Controls */}
                <div className="flex items-center gap-4 mt-4">
                  <button
                    disabled={previewPageIdx === 0}
                    onClick={() => setPreviewPageIdx((p) => Math.max(0, p - 1))}
                    className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <ChevronLeft size={14} />
                    <span>Prev Page</span>
                  </button>

                  <span className="text-xs font-mono font-bold text-zinc-400">
                    {previewPageIdx + 1} / {previewModalTemplate.pagesCount}
                  </span>

                  <button
                    disabled={previewPageIdx >= previewModalTemplate.pagesCount - 1}
                    onClick={() => setPreviewPageIdx((p) => Math.min(previewModalTemplate.pagesCount - 1, p + 1))}
                    className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <span>Next Page</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>

              {/* Modal Footer Action */}
              <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900">
                <button
                  onClick={() => setPreviewModalTemplate(null)}
                  className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  Close
                </button>

                <button
                  onClick={() => {
                    handleSelectTemplate(previewModalTemplate);
                    setPreviewModalTemplate(null);
                  }}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <span>Select This Preset</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
