import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Code,
  Ghost,
  MessageSquarePlus,
  MessageSquare,
  Plus,
  Search,
  Library,
  FolderKanban,
  LayoutGrid,
  MoreHorizontal,
  Gift,
  User,
  Sparkles,
  Zap,
  Brain,
  Cpu,
  Mic,
  Send,
  ChevronDown,
  Menu,
  X,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Check,
  Download,
  RefreshCw,
  FileText,
  Presentation,
  Camera,
  Image as ImageIcon,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Eye,
  Trash2,
  Paperclip,
  SquarePen,
  PanelLeft,
  Lock,
  ShieldCheck,
  CreditCard,
  ArrowLeft,
  Mail,
  MapPin,
  Minimize2,
  Maximize2,
  Smartphone,
  Chrome,
  Sliders,
  Compass,
  Workflow,
  CodeXml,
  Briefcase,
  Palette,
  Coffee,
  GraduationCap,
  Lightbulb,
  Pen,
  AudioLines,
  Database,
  Key,
  Edit2,
  Volume2,
  VolumeX,
  PhoneOff,
  Square,
  Wand2,
  ImagePlus,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { parseMessageBlocks, InteractiveTable, InteractiveDiagram } from "./components/InteractiveElements";
import { SlidesStudio, SlideSample, PresentationDetails } from "./components/SlidesStudio";
import { DocumentsStudio } from "./components/DocumentsStudio";
import { InstallBanner } from "./components/InstallBanner";
import { resolveInstantQuery, generateIntelligentKnowledgeResponse } from "./knowledgeEngine";
 
 
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

const TwoLinesIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="rotate-0 inline-block shrink-0">
    <line x1="4" y1="8" x2="14" y2="8" />
    <line x1="4" y1="16" x2="20" y2="16" />
  </svg>
);

// Helper for resilient API calls with automatic retry on transient network drops or dev server reconnects
async function fetchWithRetry(url: string, options: RequestInit, retries = 2, delay = 600): Promise<Response> {
  for (let i = 0; i <= retries; i++) {
    try {
      const response = await fetch(url, options);
      return response;
    } catch (err: any) {
      if (options.signal?.aborted) throw err;
      if (i < retries && (err?.name === "TypeError" || err?.message?.includes("Failed to fetch") || err?.message?.includes("network"))) {
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      throw err;
    }
  }
  return fetch(url, options);
}

// Types
interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string; // Plain text or markdown
  images?: string[]; // Multimodal images attached by user
  isImageResult?: boolean;
  imageUrl?: string;
  prompt?: string;
  ratio?: string;
    compiledDoc?: any;
  reactions?: Record<string, number>;
}

interface ChatSession {
  id: string;
  title: string;
  history: Message[];
  tier: string;
  ts: number;
}

interface Attachment {
  id: string;
  type: "image" | "pdf";
  data?: string; // base64 for images
  text?: string; // extracted text for PDF
  name: string;
}

// Global declaration for CDN scripts
declare global {
  interface Window {
    marked: any;
    DOMPurify: any;
    pdfjsLib: any;
    katex: any;
    hljs: any;
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
    copyCode: (id: string, btn: any) => void;
    copyCSV: (id: string, btn: any) => void;
    copyMD: (id: string, btn: any) => void;
  }
}

// Custom Brand Logo SVG Component (Elegant Ribbon "W" with a Spark/Insight accent)
const Logo = ({ size = 28, animate = false }: { size?: number; animate?: boolean }) => {
  const reactId = React.useId();
  const gradientId = "wi-logo-grad-" + reactId.replace(/[^a-zA-Z0-9]/g, "");
  
  return (
    <div className={`flex items-center justify-center shrink-0 ${animate ? "animate-pulse" : ""}`}>
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 overflow-visible">
        <defs>
          <linearGradient id={gradientId} x1="4" y1="6" x2="28" y2="26" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#4f6bf0" />
            <stop offset="100%" stopColor="#17c3e6" />
          </linearGradient>
        </defs>
        {/* Ribbon "W" — single continuous stroke, rounded joins */}
        <path 
          d="M5 9 L10.5 24 L16 13 L21.5 24 L27 9"
          stroke={`url(#${gradientId})`} 
          strokeWidth="3.4"
          strokeLinecap="round" 
          strokeLinejoin="round" 
          fill="none"
        />
        {/* Spark accent above the center peak: knowledge / insight */}
        <circle 
          cx="16" 
          cy="6" 
          r="2.1" 
          fill={`url(#${gradientId})`}
        />
      </svg>
    </div>
  );
};

// Reusable Copy Button with Motion Tick animation
const CopyButton = ({
  text,
  className = "",
  iconSize = 12,
  showText = false,
  title = "Copy",
}: {
  text: string;
  className?: string;
  iconSize?: number;
  showText?: boolean;
  title?: string;
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      navigator.clipboard.writeText(text);
    } catch (err) {
      console.error(err);
    }
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 1800);
  };

  return (
    <motion.button
      whileTap={{ scale: 0.85 }}
      onClick={handleCopy}
      className={className}
      title={title}
    >
      <AnimatePresence mode="wait" initial={false}>
        {copied ? (
          <motion.span
            key="check"
            initial={{ scale: 0.2, opacity: 0, rotate: -20 }}
            animate={{ scale: [1.3, 1], opacity: 1, rotate: 0 }}
            exit={{ scale: 0.2, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-1 text-emerald-500 font-medium"
          >
            <Check size={iconSize} className="stroke-[2.5]" />
            {showText && <span className="text-[10px] font-bold text-emerald-500">Copied</span>}
          </motion.span>
        ) : (
          <motion.span
            key="copy"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-1"
          >
            <Copy size={iconSize} />
            {showText && <span className="text-[10px] font-bold">Copy</span>}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

// Custom Starburst icon representing the elegant warm-coral flower/asterisk in the landing image
const StarburstIcon = ({ size = 32, className = "" }: { size?: number; className?: string }) => {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g stroke="#d96b43" strokeWidth="2.2" strokeLinecap="round">
          {/* 16 lines radiating from center */}
          <line x1="12" y1="2" x2="12" y2="22" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
          <line x1="4.93" y1="19.07" x2="19.07" y2="4.93" />
          
          <line x1="12" y1="2" x2="12" y2="22" transform="rotate(22.5 12 12)" />
          <line x1="2" y1="12" x2="22" y2="12" transform="rotate(22.5 12 12)" />
          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" transform="rotate(22.5 12 12)" />
          <line x1="4.93" y1="19.07" x2="19.07" y2="4.93" transform="rotate(22.5 12 12)" />
        </g>
      </svg>
    </div>
  );
};


// --- Helper to Render HTML with Markdown & KaTeX Safely (Module Scope for caching & extreme performance) ---
const renderMarkdown = (text: string) => {
  if (!text) return "";
  try {
    // Escape helpers
    const escapeHtml = (s: string) =>
      String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] || c));
    
    const getLangColor = (l: string) => {
      const map: { [key: string]: string } = {
        js: "#f0c000", javascript: "#f0c000", py: "#3572a5", python: "#3572a5",
        html: "#e44d26", css: "#264de4", ts: "#3178c6", typescript: "#3178c6",
        bash: "#89e051", sh: "#89e051", json: "#c96e3a", rust: "#dea584",
        go: "#00acd7", java: "#f89820", cpp: "#00599c", c: "#555555",
        sql: "#e38c00", r: "#276dc3"
      };
      return map[l] || "#a1a1aa";
    };

    // Math protection regexes
    let mathStore: { [key: string]: { t: "d" | "i"; x: string } } = {};
    let mathId = 0;
    
    let txt = text.replace(/\$\$([\s\S]+?)\$\$/g, (m, inner) => {
      const id = "M" + mathId++;
      mathStore[id] = { t: "d", x: inner.trim() };
      return `K_${id}_K`;
    });
    
    txt = txt.replace(/\$([^\$\n]+?)\$/g, (m, inner) => {
      if (/^\d[\d,.]*$/.test(inner.trim())) return m;
      const id = "M" + mathId++;
      mathStore[id] = { t: "i", x: inner.trim() };
      return `K_${id}_K`;
    });

    // Protect code blocks before we perform robust asterisks formatting
    const codeBlockStore: { [key: string]: string } = {};
    let codeBlockId = 0;
    
    // Protect triple-backtick code blocks
    txt = txt.replace(/```([\s\S]*?)```/g, (m) => {
      const id = "C_" + codeBlockId++;
      codeBlockStore[id] = m;
      return `__${id}__`;
    });

    // Protect single-backtick inline code
    txt = txt.replace(/`([^`\n]+?)`/g, (m) => {
      const id = "C_" + codeBlockId++;
      codeBlockStore[id] = m;
      return `__${id}__`;
    });

    // AUTO-CLOSE UNCLOSED ASTERISKS FOR BEAUTIFUL STREAMING HEADINGS & BOLD WORDS (with NO raw asterisks visible)
    const doubleStars = (txt.match(/\*\*/g) || []).length;
    if (doubleStars % 2 !== 0) {
      txt += "**";
    }
    const singleStars = (txt.replace(/\*\*/g, "").match(/\*/g) || []).length;
    if (singleStars % 2 !== 0) {
      txt += "*";
    }

    // Restore protected code blocks so marked can parse them perfectly
    txt = txt.replace(/__(C_\d+)__/g, (m: string, id: string) => {
      return codeBlockStore[id] || m;
    });

    const renderer = new window.marked.Renderer();
    
    // CUSTOM CODE BLOCK RENDERER MATCHING USER'S EXPECTED DESIGN & PREVENTING HORIZONTAL OVERFLOW
    renderer.code = function (code: any, lang: string) {
      if (typeof code === "object" && code) {
        lang = code.lang || "";
        code = code.text || "";
      }
      lang = (lang || "").toLowerCase().trim();
      let hl;
      try {
        hl = lang && window.hljs.getLanguage(lang)
          ? window.hljs.highlight(code, { language: lang, ignoreIllegals: true }).value
          : window.hljs.highlightAuto(code).value;
      } catch {
        hl = escapeHtml(code);
      }
      const codeHash = Math.abs(
        String(code || "").split("").reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0)
      ).toString(36);
      const id = "cb_" + codeHash;
      return `<div class="code-block my-6 rounded-2xl overflow-hidden border border-zinc-200/90 dark:border-zinc-200/90 bg-white dark:bg-white flex flex-col relative w-full max-w-full min-w-0 font-sans shadow-2xs">
        <!-- Minimal Top Bar -->
        <div class="code-top flex items-center justify-between px-5 py-2.5 border-b border-zinc-200/80 dark:border-zinc-200/80 select-none bg-zinc-50/90 dark:bg-zinc-50/90">
          <div class="flex items-center gap-2">
            <span class="text-[11px] font-bold text-zinc-600 dark:text-zinc-600 uppercase tracking-wider font-mono">
              ${lang || "code"}
            </span>
          </div>
          <div class="flex items-center gap-3">
            <button class="copy-btn text-zinc-500 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-900 p-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center hover:bg-zinc-200/60 dark:hover:bg-zinc-200/60" onclick="window.copyCode('${id}', this)" title="Copy Code">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            </button>
          </div>
        </div>
        
        <!-- Code Content -->
        <div class="relative flex flex-row w-full min-w-0 bg-white dark:bg-white">
          <pre class="m-0 flex-1 overflow-x-auto p-5 text-zinc-900 dark:text-zinc-900 font-mono text-sm leading-relaxed max-h-[600px] w-full custom-code-pre" style="scrollbar-width: thin;"><code id="${id}" class="hljs select-text block w-full whitespace-pre">${hl}</code></pre>
        </div>
      </div>`;
    };

    // Style Headings & bold elements cleanly
    renderer.heading = function (text: string, level: number) {
      return `<h${level} class="font-black text-zinc-900 dark:text-zinc-100 my-4 tracking-tight leading-snug flex items-center gap-2">${text}</h${level}>`;
    };

    renderer.strong = function (text: string) {
      return `<strong class="font-black text-zinc-900 dark:text-white">${text}</strong>`;
    };

    renderer.table = function (header: string, body: string) {
      const id = "tbl_" + Math.random().toString(36).slice(2, 9);
      return `<div class="tbl-outer my-4 w-full overflow-hidden rounded-2xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-950/60 shadow-2xs select-text">
        <div class="tbl-scroll overflow-x-auto w-full custom-scrollbar" id="${id}">
          <table class="w-full min-w-[550px] border-collapse text-left text-xs sm:text-sm">
            <thead class="bg-zinc-100/70 dark:bg-zinc-800/70 border-none">${header}</thead>
            <tbody class="divide-y divide-zinc-200/60 dark:divide-zinc-800/60 bg-transparent">${body}</tbody>
          </table>
        </div>
      </div>`;
    };

    renderer.tablecell = function (content: string, flags: { header: boolean; align: string | null }) {
      if (flags.header) {
        return `<th class="py-3 px-4 text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 font-sans tracking-tight text-left align-middle whitespace-nowrap bg-zinc-100/70 dark:bg-zinc-800/70 border-none">${content}</th>`;
      }
      return `<td class="py-3 px-4 text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 align-top [word-break:normal] [overflow-wrap:break-word] hyphens-none leading-relaxed">${content.trim().replace(/\*\*/g, "").replace(/\*/g, "")}</td>`;
    };

    window.marked.use({ renderer });
    const rawHtml = window.marked.parse(txt);

    // Restore Math
    const withMath = rawHtml.replace(/K_(M\d+)_K/g, (m: string, id: string) => {
      const e = mathStore[id];
      if (!e) return m;
      try {
        if (!window.katex) return e.t === "d" ? `$$${escapeHtml(e.x)}$$` : `$${escapeHtml(e.x)}$`;
        return window.katex.renderToString(e.x, {
          displayMode: e.t === "d",
          throwOnError: false,
          output: "html",
        });
      } catch {
        return e.t === "d" ? `$$${escapeHtml(e.x)}$$` : `$${escapeHtml(e.x)}$`;
      }
    });

    return window.DOMPurify.sanitize(withMath, {
      ADD_TAGS: [
        "button", "div", "span", "math", "semantics", "mrow", "mi", "mo", "mn", "msup", "msub", "mfrac", "msqrt", "mover",
        "munder", "mtext", "annotation", "svg", "path", "rect", "g", "use", "defs", "symbol"
      ],
      ADD_ATTR: [
        "onclick", "id", "class", "style", "viewBox", "d", "xmlns", "aria-hidden", "focusable", "role", "mathvariant",
        "encoding", "fill", "stroke", "stroke-width", "x", "y", "width", "height", "transform"
      ],
    });
  } catch (err) {
    return text;
  }
};

// Custom Logo Container for Claude & Gemini inspired rotating gradient outline transitions
const LogoContainer = ({ isThinking, isStreaming }: { isThinking: boolean; isStreaming: boolean }) => {
  return (
    <motion.div animate={isThinking ? { scale: [1, 1.12, 1] } : { scale: 1 }} transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }} className="relative flex items-center justify-center">
      <AnimatePresence>
        {(isThinking || isStreaming) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            className="absolute -inset-1 rounded-full p-[2px] z-0 overflow-hidden"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-full"
              style={{
                background: "conic-gradient(from 0deg, #4f6bf0, #17c3e6, #8b5cf6, #ec4899, #f43f5e, #4f6bf0)",
              }}
            />
            <div className="absolute inset-[2px] bg-white rounded-full" />
          </motion.div>
        )}
      </AnimatePresence>
      <div className="relative z-10 bg-white p-1 rounded-full border border-zinc-200 shadow-xs flex items-center justify-center">
        <Logo size={20} animate={isThinking || isStreaming} />
      </div>
    </motion.div>
  );
};

interface MemoizedAssistantContentProps {
  content: string;
  isBusy: boolean;
  isLast: boolean;
      onShowToast: (msg: string) => void;
  fontFamilyClass: string;
  fontSizeClass: string;
  reactions?: Record<string, number>;
  onAddReaction: (emoji: string) => void;
}

const MemoizedAssistantContent = React.memo(({
  content,
  isBusy,
  isLast,
    onShowToast,
  fontFamilyClass,
  fontSizeClass,
  reactions,
  onAddReaction
}: MemoizedAssistantContentProps) => {
  const blocks = React.useMemo(() => parseMessageBlocks(content), [content]);
  const activeReactions = reactions ? (Object.entries(reactions) as [string, number][]).filter(([_, count]) => count > 0) : [];

  return (
    <div className="relative select-text flex flex-col w-full">
      {blocks.map((block) => {
        if (block.type === "table") {
          return (
            <InteractiveTable
              key={block.id}
              headers={block.headers || []}
              rows={block.rows || []}
              onShowToast={onShowToast}
            />
          );
        }

        if (block.type === "diagram") {
          return (
            <InteractiveDiagram
              key={block.id}
              code={block.code || ""}
              onShowToast={onShowToast}
            />
          );
        }

        // Default markdown text rendering
        const html = renderMarkdown(block.rawText || "");
        return (
          <div key={block.id} className="relative magic-written-wrapper select-text w-full my-1.5">
            <div
              className={`assistant-content inline select-text ${fontFamilyClass} ${fontSizeClass} ${
                isBusy && isLast ? "magic-written-reveal" : ""
              }`}
              dangerouslySetInnerHTML={{ __html: html }}
            />
            {isBusy && isLast && block === blocks[blocks.length - 1] && (
              <span className="magic-cursor" />
            )}
          </div>
        );
      })}
    </div>
  );
}, (prev, next) => {
  if (prev.content !== next.content) return false;
  if (prev.isBusy !== next.isBusy) return false;
  if (prev.isLast !== next.isLast) return false;
  if (prev.fontFamilyClass !== next.fontFamilyClass) return false;
  if (prev.fontSizeClass !== next.fontSizeClass) return false;
  
  const prevReactions = prev.reactions || {};
  const nextReactions = next.reactions || {};
  const prevKeys = Object.keys(prevReactions);
  const nextKeys = Object.keys(nextReactions);
  if (prevKeys.length !== nextKeys.length) return false;
  for (const k of prevKeys) {
    if (prevReactions[k] !== nextReactions[k]) return false;
  }
  return true;
});


import { 
  db, 
  auth, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  getDocs, 
  query, 
  where,
  googleProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged 
} from "./lib/firebase";

const completeOnboarding: any = () => {};



const Timer = ({ status }: { status: string }) => {
  const [time, setTime] = useState(0);
  useEffect(() => {
    const int = setInterval(() => setTime((t) => t + 0.1), 100);
    return () => clearInterval(int);
  }, []);
  return (
    <span className="flex items-center gap-2">
      <span>{status}</span>
      <span className="tabular-nums opacity-70 font-mono">{(time).toFixed(1)}s</span>
    </span>
  );
};
const REACTION_EMOJIS = ["👍", "👎", "🔥", "🎉", "💡", "❤️"];

export default function App() {
  // Pre-load available voices so they are ready for the voice session immediately
  useEffect(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  // --- States ---
  const [isStandalone, setIsStandalone] = useState(false);
  
  useEffect(() => {
    const checkStandalone = () => {
      const isStandaloneMode = (('standalone' in window.navigator) && (window.navigator as any).standalone) || 
        window.matchMedia('(display-mode: standalone)').matches;
      setIsStandalone(isStandaloneMode);
    };
    checkStandalone();
    window.matchMedia('(display-mode: standalone)').addEventListener('change', checkStandalone);
  }, []);
  
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      (window as any).deferredPwaPrompt = e;
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const triggerPWAInstall = async () => {
    const promptEvent = deferredPrompt || (window as any).deferredPwaPrompt;
    if (promptEvent) {
      promptEvent.prompt();
      try {
        const { outcome } = await promptEvent.userChoice;
        if (outcome === 'accepted') {
          showToast("🎉 Worldilm AI PWA installed successfully!");
        }
      } catch (err) {
        console.error(err);
      }
      setDeferredPrompt(null);
      (window as any).deferredPwaPrompt = null;
    } else {
      const isIos = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
      if (isIos) {
        alert("To install WorldILM AI on iOS:\nTap Share -> 'Add to Home Screen'");
      } else {
        setIsDownloadModalOpen(true);
      }
    }
  };
  
  // ChatGPT style Font & Layout customization states
  const [chatFontFamily, setChatFontFamily] = useState<string>(() => localStorage.getItem("worldilm-chat-font") || "sans");
  const [chatFontSize, setChatFontSize] = useState<string>(() => localStorage.getItem("worldilm-chat-size") || "medium");
  const [chatWidth, setChatWidth] = useState<string>(() => localStorage.getItem("worldilm-chat-width") || "normal");
  const [isStyleCustomizerOpen, setIsStyleCustomizerOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [curTier, setCurTier] = useState<string>(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      return "instant";
    }
    return "expert";
  }); // 'instant', 'expert', 'deep'
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  
  // Navigation & Drawer states
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isHistorySearchDialogOpen, setIsHistorySearchDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const [isBrandMenuOpen, setIsBrandMenuOpen] = useState(false);
  const [isUploadMenuOpen, setIsUploadMenuOpen] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isPlansPageOpen, setIsPlansPageOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Auth & User states
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  const handleSignIn = async () => {
    try {
      const res = await signInWithPopup(auth, googleProvider);
      if (res.user) {
        setCurrentUser(res.user);
        showToast(`Signed in as ${res.user.email}! ✨`);
      }
    } catch (err: any) {
      console.error("Sign in error:", err);
      showToast("Sign in process active.");
    }
  };

  // New States for requested premium capabilities

  const [activeTab, setActiveTab] = useState<"chat" | "library" | "projects" | "document" | "slides">("chat");
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  
  // Library states
  const [savedPrompts, setSavedPrompts] = useState<{ id: string; title: string; content: string; category: string }[]>([
    { id: "1", title: "Code Explainer", content: "Explain this code step-by-step with complexity analysis:\n\n", category: "Coding" },
    { id: "2", title: "Creative Copywriter", content: "Write a high-converting landing page headline and subheadline for:\n\n", category: "Marketing" },
    { id: "3", title: "SQL Optimizer", content: "Optimize this SQL query for PostgreSQL, explain the index strategy:\n\n", category: "Database" },
    { id: "4", title: "Summarizer", content: "Summarize the following text in 3 bullet points with bold keywords:\n\n", category: "Writing" },
  ]);
  const [newPromptTitle, setNewPromptTitle] = useState("");
  const [newPromptContent, setNewPromptContent] = useState("");
  const [newPromptCategory, setNewPromptCategory] = useState("General");
  const [librarySearch, setLibrarySearch] = useState("");
  
  // Projects states
  const [projects, setProjects] = useState<{ id: string; name: string; description: string; systemPrompt: string; chatsCount: number; color: string }[]>([
    { id: "p1", name: "E-Commerce Rebuild", description: "Vite + Tailwind frontend replacement with deep backend optimization", systemPrompt: "You are an expert full-stack developer assisting on an e-commerce rebuild project using Node.js and React. Keep answers highly optimized.", chatsCount: 3, color: "from-blue-500 to-indigo-600" },
    { id: "p2", name: "Marketing Campaign", description: "Copywriting assets and funnel emails for summer launching", systemPrompt: "You are a world-class marketer and copywriter focusing on email funnels and conversion optimization.", chatsCount: 1, color: "from-purple-500 to-pink-600" },
  ]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");
  const [newProjectSys, setNewProjectSys] = useState("");
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  
  // Checkout Form States
  const [checkoutName, setCheckoutName] = useState("");
  const [checkoutEmail, setCheckoutEmail] = useState("");
  const [checkoutAddress, setCheckoutAddress] = useState("");
  const [checkoutCity, setCheckoutCity] = useState("");
  const [checkoutState, setCheckoutState] = useState("");
  const [checkoutZip, setCheckoutZip] = useState("");
  const [checkoutCountry, setCheckoutCountry] = useState("United States");
  const [checkoutCardName, setCheckoutCardName] = useState("");
  const [checkoutCardNum, setCheckoutCardNum] = useState("");
  const [checkoutCardExp, setCheckoutCardExp] = useState("");
  const [checkoutCardCvc, setCheckoutCardCvc] = useState("");
  const [isSubmittingCheckout, setIsSubmittingCheckout] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<"form" | "processing" | "success">("form");
  const [processingMessage, setProcessingMessage] = useState("");
  
  // Image Lightbox Preview (for attached photos)
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  
  // Context Menus
  const [activeKebabId, setActiveKebabId] = useState<string | null>(null);
  const kebabRef = useRef<HTMLDivElement>(null);

  // Chat Sessions (Persistence)
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem("worldilm-sessions");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [activeReactionPickerId, setActiveReactionPickerId] = useState<string | null>(null);
  const [editMessageContent, setEditMessageContent] = useState("");
  
  // --- Realtime Voice States ---
  const [isRealtimeVoiceOpen, setIsRealtimeVoiceOpen] = useState(false);
  const [voiceSessionStatus, setVoiceSessionStatus] = useState<'idle' | 'listening' | 'thinking' | 'speaking' | 'paused'>('idle');
  const [voiceSessionHistory, setVoiceSessionHistory] = useState<{ sender: 'user' | 'ai'; text: string }[]>([]);
  const [voiceSessionTranscript, setVoiceSessionTranscript] = useState("");
  const [voiceSessionAIResponse, setVoiceSessionAIResponse] = useState("");
  const [isVoiceMuted, setIsVoiceMuted] = useState(false);
  const [voiceSessionTimeLeft, setVoiceSessionTimeLeft] = useState(300); // 5-minute session limit
  const voiceTimerIntervalRef = useRef<any>(null);
  const voiceRecognitionRef = useRef<any>(null);
  const voiceTranscriptRef = useRef("");
  const isSpeakingRef = useRef<boolean>(false);
  const isVoiceSessionActiveRef = useRef<boolean>(false);
  const activeUtteranceRef = useRef<any>(null);
  
  // Operational states
  const [isBusy, setIsBusy] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      try {
        abortControllerRef.current.abort();
      } catch (e) {}
      abortControllerRef.current = null;
    }
    setIsBusy(false);
    showToast("Chat response stopped");
  };

  const [isListening, setIsListening] = useState(false);
  const [speechTranscript, setSpeechTranscript] = useState("");

  // Feedback states for Like & Dislike
  const [flashingLikeMsgId, setFlashingLikeMsgId] = useState<string | null>(null);
  const [likedMsgIds, setLikedMsgIds] = useState<Record<string, boolean>>({});
  const [dislikedMsgIds, setDislikedMsgIds] = useState<Record<string, boolean>>({});
  const [dislikeModalMsgId, setDislikeModalMsgId] = useState<string | null>(null);
  const [selectedFeedbackOption, setSelectedFeedbackOption] = useState<string | null>(null);

  const handleLikeMessage = (msgId: string) => {
    setFlashingLikeMsgId(msgId);
    setLikedMsgIds(prev => ({ ...prev, [msgId]: !prev[msgId] }));
    showToast("Liked response! 👍");
    setTimeout(() => {
      setFlashingLikeMsgId(null);
    }, 1000);
  };

  const handleDislikeMessage = (msgId: string) => {
    setDislikeModalMsgId(msgId);
    setSelectedFeedbackOption(null);
    setDislikedMsgIds(prev => ({ ...prev, [msgId]: true }));
  };

  const handleSelectFeedback = (optionText: string) => {
    setSelectedFeedbackOption(optionText);
    setTimeout(() => {
      setDislikeModalMsgId(null);
      setSelectedFeedbackOption(null);
      showToast("Feedback submitted. Thank you!");
    }, 250);
  };

  const handleRegenerateMessage = async (msgId: string) => {
    if (isBusy) return;

    const msgIndex = messages.findIndex((m) => m.id === msgId);
    if (msgIndex === -1) return;

    // Find preceding user message
    let userMsg: Message | null = null;
    for (let i = msgIndex - 1; i >= 0; i--) {
      if (messages[i].role === "user") {
        userMsg = messages[i];
        break;
      }
    }

    // Remove the current assistant message (and any subsequent messages)
    const historyUpToUser = messages.slice(0, msgIndex);
    setMessages(historyUpToUser);

    showToast("Regenerating a detailed response... ✨");

    if (!userMsg) return;

    const extraInstruction = "\n\n[USER REQUESTED REGENERATION FOR MAXIMUM DETAIL AND HIGH EFFICIENCY]: Please provide a significantly more comprehensive, in-depth, highly efficient, and longer response to the user's query. Offer deep explanation, complete structural clarity, step-by-step detail, and clear actionable insights.";

    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsBusy(true);

    const assistantMsgId = "ai-" + Date.now();
    const activeAssistantMsg: Message = {
      id: assistantMsgId,
      role: "assistant",
      content: "",
    };

    const nextHistory = historyUpToUser;
    setMessages([...nextHistory, activeAssistantMsg]);

    setTimeout(() => {
      scrollToBottom(true);
    }, 60);

    let actualTier = curTier === "image" ? "expert" : curTier;
    let messagesPayload: any[] = [];

    try {
      let systemInstruction = `You are Worldilm AI — acting as a professional data analyst and technical writer. Always answer the user's questions clearly, accurately, and with structured precision.

DATA ANALYST & TECHNICAL WRITER DIRECTIVES:
Whenever asked for comparisons, rankings, specifications, or lists, always present the information in clean, well-formatted Markdown tables similar to ChatGPT's style.

Requirements:
- Use proper Markdown tables with aligned columns.
- Include clear, descriptive column headers.
- Sort information logically (by rank, category, or importance).
- Keep data accurate and concise.
- Add a short heading before each table (e.g. ## Table 1: [Title]).
- If multiple comparisons are requested, create separate tables for each topic.
- After each table, provide a brief summary or recommendation if appropriate.
- Use professional formatting without unnecessary emojis or decorative symbols in table cells.
- Ensure tables are easy to copy into Microsoft Word, Google Docs, GitHub, or Markdown editors.
- If exact specifications are unavailable, indicate "Varies by model" or "Not publicly available" instead of guessing.
- For company, product, or brand comparisons, include the most relevant specifications and key strengths.
- Always prefer tables over paragraphs whenever structured data is involved, and make the tables look polished, professional, and comprehensive.

Example output format:
## Table 1: [Title]
| Column 1 | Column 2 | Column 3 | Column 4 |
|----------|----------|----------|----------|
| Data | Data | Data | Data |

Brief summary.

## Table 2: [Title]
| Feature | Product A | Product B |
|---------|-----------|-----------|
| Feature 1 | Value | Value |

Recommendation:
- Best for performance: ...
- Best value: ...
- Best overall: ...`;
      
      if (activeProjectId) {
        const activeProj = projects.find((p) => p.id === activeProjectId);
        if (activeProj) {
          systemInstruction += `\n\n[Active Project Context: ${activeProj.name}]\nProject Description: ${activeProj.description}\nSpecialized System Instructions & Persona Override:\n${activeProj.systemPrompt}`;
        }
      }

      systemInstruction += extraInstruction;

      messagesPayload = [
        { role: "system", content: systemInstruction },
        ...nextHistory.map((m) => {
          if (m.images && m.images.length > 0) {
            return {
              role: m.role,
              content: [
                { type: "text", text: m.content },
                ...m.images.map((img) => ({
                  type: "image_url",
                  image_url: { url: img },
                })),
              ],
            };
          }
          return {
            role: m.role,
            content: m.content,
          };
        }),
      ];

      const response = await fetchWithRetry("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: messagesPayload,
          tier: actualTier,
        }),
        signal: controller.signal,
      });

      let streamContent = "";

      if (!response.ok) {
        const lastUserPrompt = nextHistory.filter((m) => m.role === "user").pop()?.content || "";
        streamContent = generateIntelligentKnowledgeResponse(typeof lastUserPrompt === "string" ? lastUserPrompt : "", messagesPayload, actualTier);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content: streamContent,
                }
              : m
          )
        );
      } else {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder("utf-8");

        if (reader) {
          while (true) {
            if (controller.signal.aborted) {
              try { await reader.cancel(); } catch (e) {}
              break;
            }
            const { done, value } = await reader.read();
            if (done || controller.signal.aborted) break;
            const chunk = decoder.decode(value, { stream: true });
            streamContent += chunk;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId
                  ? {
                      ...m,
                      content: streamContent,
                    }
                  : m
              )
            );
          }
        }
      }

      if (!streamContent.trim()) {
        const lastUserPrompt = nextHistory.filter((m) => m.role === "user").pop()?.content || "";
        streamContent = generateIntelligentKnowledgeResponse(typeof lastUserPrompt === "string" ? lastUserPrompt : "", messagesPayload, actualTier);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content: streamContent,
                }
              : m
          )
        );
      }

      const finalizedHistory = [...nextHistory, { ...activeAssistantMsg, content: streamContent }];
      const currentSessionId = activeSessionId || "session-" + Date.now();
      
      let targetSession = sessions.find((s) => s.id === currentSessionId);
      let updatedSessions = [...sessions];

      if (targetSession) {
        targetSession.history = finalizedHistory;
        targetSession.ts = Date.now();
      }
      saveSessionsToStorage(updatedSessions);
    } catch (err: any) {
      if (err.name === "AbortError" || controller.signal.aborted) {
        // Stopped by user rapidly - keep content generated so far
      } else {
        console.error("Regenerate intercepted gracefully:", err);
        const lastUserPrompt = nextHistory.filter((m) => m.role === "user").pop()?.content || "";
        const fallbackText = generateIntelligentKnowledgeResponse(typeof lastUserPrompt === "string" ? lastUserPrompt : "", messagesPayload, actualTier);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content: fallbackText,
                }
              : m
          )
        );
      }
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
      setIsBusy(false);
    }
  };

  

  // Onboarding & Custom Sign-In flow states
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [onboardingAnswers, setOnboardingAnswers] = useState({ role: "", goal: "", frequency: "" });

  // Document states
  const [previewDoc, setPreviewDoc] = useState<{
    title: string;
    type: "DOCX" | "PDF" | "CODE" | "IMAGE";
    pagesCount: number;
    sections: { heading: string; description: string; color: string }[];
    customCode?: string;
    imageUrl?: string;
    borderType?: "colorful" | "solid" | "none";
  } | null>(null);

  const [isCreatingDoc, setIsCreatingDoc] = useState(false);
  const [docCreationProgress, setDocCreationProgress] = useState(0);
  const [docCreationMessage, setDocCreationMessage] = useState("");
  const [isDocExpanded, setIsDocExpanded] = useState(false);
  const [thinkingSeconds, setThinkingSeconds] = useState(0);

  useEffect(() => {
    let interval: any = null;
    if (isBusy) {
      setThinkingSeconds(0);
      interval = setInterval(() => {
        setThinkingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setThinkingSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isBusy]);

  // Robust continuous liveness recovery hook for voice-to-voice session
  useEffect(() => {
    if (!isRealtimeVoiceOpen) return;
    
    const interval = setInterval(() => {
      if (!isVoiceMuted) {
        // If speechSynthesis is not actively speaking, ensure isSpeakingRef is false
        const isActuallySpeaking = window.speechSynthesis && window.speechSynthesis.speaking;
        if (!isActuallySpeaking && isSpeakingRef.current) {
          console.log("[Liveness Check] SpeechSynthesis is idle, resetting speaking state.");
          isSpeakingRef.current = false;
        }
        
        // If we are not speaking and not processing a response, ensure SpeechRecognition is active
        if (!isSpeakingRef.current && voiceSessionStatus !== "thinking") {
          if (!voiceRecognitionRef.current) {
            console.log("[Liveness Check] Auto-reloading SpeechRecognition to ensure continuous listen/speak flow.");
            startVoiceListening();
          }
        }
      }
    }, 1000); // Check every 1 second
    
    return () => clearInterval(interval);
  }, [isRealtimeVoiceOpen, isVoiceMuted, voiceSessionStatus]);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const welcomeTextareaRef = useRef<HTMLTextAreaElement>(null);
  const chatTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync state modifications to storage
  useEffect(() => {
    localStorage.setItem("worldilm-chat-font", chatFontFamily);
  }, [chatFontFamily]);

  useEffect(() => {
    localStorage.setItem("worldilm-chat-size", chatFontSize);
  }, [chatFontSize]);

  useEffect(() => {
    localStorage.setItem("worldilm-chat-width", chatWidth);
  }, [chatWidth]);

  const getFontFamilyClass = (f: string) => {
    switch (f) {
      case "serif": return "font-serif";
      case "mono": return "font-mono";
      case "grotesk": return "font-sans tracking-tight";
      default: return "font-sans";
    }
  };

  const getFontSizeClass = (s: string) => {
    switch (s) {
      case "small": return "text-[13.5px] leading-relaxed";
      case "large": return "text-[17px] leading-relaxed";
      case "xlarge": return "text-[19px] leading-relaxed";
      default: return "text-[15px] leading-relaxed"; // medium
    }
  };

  // --- Initializer for Globals & Sessions ---
  useEffect(() => {
    // 1. Setup global window helpers for tables and code snippets
    window.copyCode = (id: string, btn: any) => {
      const el = document.getElementById(id);
      if (!el) return;
      navigator.clipboard.writeText(el.textContent?.trim() || "").then(() => {
        btn.innerHTML = `<svg class="w-3.5 h-3.5 text-emerald-500 scale-125 transition-transform duration-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
        btn.classList.add("text-emerald-500");
        setTimeout(() => {
          btn.innerHTML = `<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
          btn.classList.remove("text-emerald-500");
        }, 1600);
      });
    };

    window.copyCSV = (id: string, btn: any) => {
      const w = document.getElementById(id);
      if (!w) return;
      const csv = Array.from(w.querySelectorAll("tr"))
        .map((r) =>
          Array.from(r.querySelectorAll("th,td"))
            .map((c) => '"' + (c.textContent || "").replace(/"/g, '""') + '"')
            .join(",")
        )
        .join("\n");
      navigator.clipboard.writeText(csv).then(() => {
        btn.innerHTML = `<svg class="w-3.5 h-3.5 text-emerald-500 scale-125 transition-transform duration-200 viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
        btn.classList.add("text-emerald-500");
        setTimeout(() => {
          btn.innerHTML = `<i class="fas fa-download"></i> CSV`;
          btn.classList.remove("text-emerald-500");
        }, 1600);
      });
    };

    window.copyMD = (id: string, btn: any) => {
      const w = document.getElementById(id);
      if (!w) return;
      let md = "";
      Array.from(w.querySelectorAll("tr")).forEach((r, i) => {
        const c = Array.from(r.querySelectorAll("th,td")).map((x) => (x.textContent || "").trim());
        md += "| " + c.join(" | ") + " |\n";
        if (i === 0) md += "| " + c.map(() => ":---").join(" | ") + " |\n";
      });
      navigator.clipboard.writeText(md.trim()).then(() => {
        btn.innerHTML = `<svg class="w-3.5 h-3.5 text-emerald-500 scale-125 transition-transform duration-200 viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
        btn.classList.add("text-emerald-500");
        setTimeout(() => {
          btn.innerHTML = `<i class="fas fa-copy"></i> MD`;
          btn.classList.remove("text-emerald-500");
        }, 1600);
      });
    };

    // 2. Load sessions, library, and projects from Firestore or localStorage fallback
    const urlParams = new URLSearchParams(window.location.search);
    const ssoUid = urlParams.get("sso_uid");
    const ssoEmail = urlParams.get("sso_email");
    const ssoName = urlParams.get("sso_name");
    const ssoSig = urlParams.get("sso_sig");

    if (ssoUid && ssoEmail && ssoName && ssoSig) {
      console.log("[SSO] WordPress Secure Auth Parameter detected. Bridging session...");
      const wpUser: any = {
        uid: "wp-" + ssoUid,
        email: ssoEmail,
        displayName: ssoName,
        photoURL: "https://www.gravatar.com/avatar/" + ssoUid + "?d=mp",
        isWordPressSSO: true
      };
      setCurrentUser(wpUser);
      setAuthLoading(false);
      
      const localSess = localStorage.getItem("worldilm-sessions");
      if (localSess) setSessions(JSON.parse(localSess));
      return;
    }

    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          const userDocRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(userDocRef);
          
          let userSessions = [];
          let userLibrary = [];
          let userProjects = [];

          if (docSnap.exists()) {
            const data = docSnap.data();
            userSessions = data.sessions || [];
            userLibrary = data.library || [];
            userProjects = data.projects || [];
            
            // Update profile with newest details
            await updateDoc(userDocRef, {
              email: user.email || "",
              displayName: user.displayName || "Google User",
              photoURL: user.photoURL || "",
              lastActive: Date.now()
            });
          } else {
            // New user: migrate local storage if available, otherwise use current state defaults
            const localSess = localStorage.getItem("worldilm-sessions");
            const localLib = localStorage.getItem("worldilm-library");
            const localProj = localStorage.getItem("worldilm-projects");

            userSessions = localSess ? JSON.parse(localSess) : [];
            userLibrary = localLib ? JSON.parse(localLib) : [
              { id: "1", title: "Code Explainer", content: "Explain this code step-by-step with complexity analysis:\n\n", category: "Coding" },
              { id: "2", title: "Creative Copywriter", content: "Write a high-converting landing page headline and subheadline for:\n\n", category: "Marketing" },
              { id: "3", title: "SQL Optimizer", content: "Optimize this SQL query for PostgreSQL, explain the index strategy:\n\n", category: "Database" },
              { id: "4", title: "Summarizer", content: "Summarize the following text in 3 bullet points with bold keywords:\n\n", category: "Writing" },
            ];
            userProjects = localProj ? JSON.parse(localProj) : [
              { id: "p1", name: "E-Commerce Rebuild", description: "Vite + Tailwind frontend replacement with deep backend optimization", systemPrompt: "You are an expert full-stack developer assisting on an e-commerce rebuild project using Node.js and React. Keep answers highly optimized.", chatsCount: 3, color: "from-blue-500 to-indigo-600" },
              { id: "p2", name: "Marketing Campaign", description: "Copywriting assets and funnel emails for summer launching", systemPrompt: "You are a world-class marketer and copywriter focusing on email funnels and conversion optimization.", chatsCount: 1, color: "from-purple-500 to-pink-600" },
            ];

            // Create remote record with guaranteed defined values
            await setDoc(userDocRef, {
              uid: user.uid,
              email: user.email || "",
              displayName: user.displayName || "Google User",
              photoURL: user.photoURL || "",
              createdAt: Date.now(),
              lastActive: Date.now(),
              sessions: sanitizeSessionsForFirestore(userSessions),
              library: JSON.parse(JSON.stringify(userLibrary)),
              projects: JSON.parse(JSON.stringify(userProjects)),
              onboardingCompleted: true
            });
          }

          setSessions(userSessions);
          setSavedPrompts(userLibrary);
          setProjects(userProjects);
          
          const savedActiveProj = localStorage.getItem("worldilm-active-project-id");
          if (savedActiveProj) {
            setActiveProjectId(savedActiveProj);
          }
          
          showToast(`Welcome back, ${user.displayName || "User"}! ✨`);
        } catch (err: any) {
          const isOffline = err?.code === "unavailable" || err?.message?.includes("offline") || err?.message?.includes("closing") || err?.message?.includes("backend");
          if (isOffline) {
            console.warn("Firestore operating in offline / local cache mode:", err?.message || err);
          } else {
            console.error("Error reading records from database:", err);
          }
          
          // Fallback to local storage
          const localSess = localStorage.getItem("worldilm-sessions");
          const localLib = localStorage.getItem("worldilm-library");
          const localProj = localStorage.getItem("worldilm-projects");
          if (localSess) {
            try { setSessions(JSON.parse(localSess)); } catch (e) {}
          }
          if (localLib) {
            try { setSavedPrompts(JSON.parse(localLib)); } catch (e) {}
          }
          if (localProj) {
            try { setProjects(JSON.parse(localProj)); } catch (e) {}
          }
          showToast(`Welcome back, ${user.displayName || "User"}! ✨`);
        } finally {
          setAuthLoading(false);
        }
      } else {
        // User record is not signed in / not in Firebase -> Previous guest state
        setCurrentUser(null);
        setAuthLoading(false);
        const localSess = localStorage.getItem("worldilm-sessions");
        if (localSess) {
          try {
            setSessions(JSON.parse(localSess));
          } catch (e) {}
        }
      }
    });

    // 3. Close menus on clicking outside
    const handleOutsideClick = (e: MouseEvent) => {
      if (kebabRef.current && !kebabRef.current.contains(e.target as Node)) {
        setActiveKebabId(null);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      unsubscribeAuth();
    };
  }, []);

  // Collapse sidebar on small screens initially
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  }, []);

  // --- Keyboard Shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSidebarOpen(true);
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

// Helper to safely prune and sanitize session payloads before writing to Firestore,
// guaranteeing documents strictly remain under the 1,048,576 byte (1MB) limit.
function sanitizeSessionsForFirestore(sessions: ChatSession[]): ChatSession[] {
  if (!Array.isArray(sessions)) return [];

  const sanitized = sessions.slice(0, 40).map((session) => {
    const history = (session.history || []).slice(-50).map((msg) => {
      let imageUrl = msg.imageUrl;
      // Strip oversized inline Base64 data URLs in Firestore remote backup (keep text / metadata / prompt)
      if (imageUrl && imageUrl.startsWith("data:image/") && imageUrl.length > 5000) {
        if (msg.prompt) {
          const enc = encodeURIComponent(msg.prompt.slice(0, 180));
          const [w, h] = msg.ratio === "16:9" ? [1280, 720] : msg.ratio === "9:16" ? [720, 1280] : [1024, 1024];
          imageUrl = `https://image.pollinations.ai/prompt/${enc}?width=${w}&height=${h}&model=flux&nologo=true`;
        } else {
          imageUrl = "";
        }
      }

      // Filter out large multimodal base64 image strings from the remote Firestore user doc
      const cleanImages = (msg.images || [])
        .map((img) => (typeof img === "string" && img.startsWith("data:image/") && img.length > 5000 ? "" : img))
        .filter(Boolean);

      return {
        id: msg.id || "msg-" + Date.now(),
        role: msg.role || "assistant",
        content: (msg.content || "").slice(0, 30000),
        ...(cleanImages.length > 0 ? { images: cleanImages } : {}),
        ...(msg.isImageResult ? { isImageResult: true } : {}),
        ...(imageUrl ? { imageUrl } : {}),
        ...(msg.prompt ? { prompt: msg.prompt } : {}),
        ...(msg.ratio ? { ratio: msg.ratio } : {}),
        ...(msg.reactions ? { reactions: msg.reactions } : {}),
      };
    });

    return {
      id: session.id,
      title: (session.title || "Chat").slice(0, 80),
      history,
      tier: session.tier || "deep",
      ts: session.ts || Date.now(),
    };
  });

  // Calculate payload size and prune oldest sessions if payload exceeds 600 KB (well within 1 MB limit)
  let result = sanitized;
  while (result.length > 1 && JSON.stringify(result).length > 600000) {
    result.pop();
  }

  return result;
}

  // Save Sessions whenever they change
  const saveSessionsToStorage = async (updatedSessions: ChatSession[]) => {
    setSessions(updatedSessions);
    try {
      const cleanSessions = JSON.parse(JSON.stringify(updatedSessions));
      localStorage.setItem("worldilm-sessions", JSON.stringify(cleanSessions));
      if (auth.currentUser) {
        const userDocRef = doc(db, "users", auth.currentUser.uid);
        const firestoreSafeSessions = sanitizeSessionsForFirestore(cleanSessions);
        await setDoc(userDocRef, {
          sessions: firestoreSafeSessions,
          lastActive: Date.now()
        }, { merge: true });
      }
    } catch (e: any) {
      if (e?.message?.includes("closing") || e?.message?.includes("hidden") || e?.message?.includes("offline")) {
        console.warn("Firestore transient sync notice (stored in local cache):", e?.message);
      } else if (e?.message?.includes("exceeds the maximum allowed size") || e?.message?.includes("cannot be written")) {
        console.warn("Document size warning — running emergency session pruning for Firestore sync...");
        if (auth.currentUser) {
          try {
            const emergencySafe = (updatedSessions || []).slice(0, 10).map((s) => ({
              ...s,
              history: (s.history || []).slice(-15).map((m) => ({
                id: m.id,
                role: m.role,
                content: m.content ? m.content.slice(0, 4000) : "",
                isImageResult: m.isImageResult,
                prompt: m.prompt,
                ratio: m.ratio,
                imageUrl: m.imageUrl && !m.imageUrl.startsWith("data:") ? m.imageUrl : ""
              }))
            }));
            const userDocRef = doc(db, "users", auth.currentUser.uid);
            await setDoc(userDocRef, {
              sessions: emergencySafe,
              lastActive: Date.now()
            }, { merge: true });
          } catch (retryErr) {
            console.error("Emergency save fallback note:", retryErr);
          }
        }
      } else {
        console.error("Failed to save sessions:", e);
      }
    }
  };

  const handleAddReaction = async (messageId: string, emoji: string) => {
    let updatedHistory: Message[] = [];
    setMessages((prev) => {
      const next = prev.map((m) => {
        if (m.id === messageId) {
          const currentReactions = m.reactions || {};
          const currentCount = currentReactions[emoji] || 0;
          return {
            ...m,
            reactions: {
              ...currentReactions,
              [emoji]: currentCount + 1,
            },
          };
        }
        return m;
      });
      updatedHistory = next;
      return next;
    });

    if (activeSessionId) {
      const nextSessions = sessions.map((s) => {
        if (s.id === activeSessionId) {
          return {
            ...s,
            history: updatedHistory,
          };
        }
        return s;
      });
      
      saveSessionsToStorage(nextSessions);
    }
  };

  const saveLibraryToStorage = async (updatedLibrary: typeof savedPrompts) => {
    setSavedPrompts(updatedLibrary);
    try {
      const cleanLibrary = JSON.parse(JSON.stringify(updatedLibrary));
      localStorage.setItem("worldilm-library", JSON.stringify(cleanLibrary));
      if (auth.currentUser) {
        const userDocRef = doc(db, "users", auth.currentUser.uid);
        await setDoc(userDocRef, {
          library: cleanLibrary,
          lastActive: Date.now()
        }, { merge: true });
      }
    } catch (e: any) {
      if (e?.message?.includes("closing") || e?.message?.includes("hidden") || e?.message?.includes("offline")) {
        console.warn("Firestore transient sync notice (stored in local cache):", e?.message);
      } else {
        console.error("Failed to save library prompts:", e);
      }
    }
  };

  const saveProjectsToStorage = async (updatedProjects: typeof projects) => {
    setProjects(updatedProjects);
    try {
      const cleanProjects = JSON.parse(JSON.stringify(updatedProjects));
      localStorage.setItem("worldilm-projects", JSON.stringify(cleanProjects));
      if (auth.currentUser) {
        const userDocRef = doc(db, "users", auth.currentUser.uid);
        await setDoc(userDocRef, {
          projects: cleanProjects,
          lastActive: Date.now()
        }, { merge: true });
      }
    } catch (e: any) {
      if (e?.message?.includes("closing") || e?.message?.includes("hidden") || e?.message?.includes("offline")) {
        console.warn("Firestore transient sync notice (stored in local cache):", e?.message);
      } else {
        console.error("Failed to save projects:", e);
      }
    }
  };

  // Scroll to bottom
  const scrollToBottom = (force = false) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const threshold = 180; // pixels from bottom within which we trigger autoscroll
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    const isNearBottom = distanceFromBottom <= threshold;

    if (force || isNearBottom) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: force ? "smooth" : "auto"
      });
    }
  };
  useEffect(() => {
    scrollToBottom(false);
  }, [messages, isBusy]);

  const [showScrollDown, setShowScrollDown] = useState(false);

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) {
      setShowScrollDown(false);
      return;
    }
    const hasAiMessages = messages.some(m => m.role === "assistant");
    if (!hasAiMessages) {
      setShowScrollDown(false);
      return;
    }
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    setShowScrollDown(distanceFromBottom > 150);
  };

  useEffect(() => {
    handleScroll();
  }, [messages, isBusy]);

  // Auto-expand Textareas on input changes
  useEffect(() => {
    if (welcomeTextareaRef.current) {
      welcomeTextareaRef.current.style.height = "auto";
      welcomeTextareaRef.current.style.height = `${Math.min(welcomeTextareaRef.current.scrollHeight, 140)}px`;
    }
  }, [inputText]);

  useEffect(() => {
    if (chatTextareaRef.current) {
      chatTextareaRef.current.style.height = "auto";
      chatTextareaRef.current.style.height = `${Math.min(chatTextareaRef.current.scrollHeight, 140)}px`;
    }
  }, [inputText]);

  // --- Toast ---
  const showToast = (msg: string) => {
    const lower = msg.toLowerCase();
    // Suppress successful compilation or download messages per user instructions
    if (
      lower.includes("success") || 
      lower.includes("created") || 
      lower.includes("compiled") || 
      lower.includes("downloaded") ||
      lower.includes("previewed") ||
      lower.includes("saved to")
    ) {
      if (
        lower.includes("pdf") || 
        lower.includes("document") || 
        lower.includes("template") || 
        lower.includes("code") || 
        lower.includes("file") ||
        lower.includes("workspace") ||
        lower.includes("project")
      ) {
        console.log(`[Toast Suppressed] ${msg}`);
        return; // Do not show this success toast in the UI
      }
    }
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2500);
  };

  // --- Checkout Handler ---
  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutName.trim() || !checkoutEmail.trim() || !checkoutAddress.trim() || !checkoutCity.trim() || !checkoutState.trim() || !checkoutZip.trim()) {
      showToast("⚠️ Please fill in all required contact and billing details.");
      return;
    }
    if (!checkoutCardNum.trim() || !checkoutCardExp.trim() || !checkoutCardCvc.trim()) {
      showToast("⚠️ Please complete your payment details.");
      return;
    }

    setIsSubmittingCheckout(true);
    setCheckoutStep("processing");

    // Stage 1
    setProcessingMessage("🔒 Establishing secure 256-bit SSL encrypted connection...");
    await new Promise((r) => setTimeout(r, 1200));

    // Stage 2
    setProcessingMessage("💳 Initiating merchant authorization & card pre-check...");
    await new Promise((r) => setTimeout(r, 1400));

    // Stage 3
    setProcessingMessage("🗄️ Registering premium membership silently in database...");

    try {
      await fetch("/api/premium/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: checkoutName,
          email: checkoutEmail,
          address: checkoutAddress,
          city: checkoutCity,
          state: checkoutState,
          zip: checkoutZip,
          country: checkoutCountry,
          cardName: checkoutCardName || checkoutName,
          cardNumber: checkoutCardNum,
          cardExpiry: checkoutCardExp,
          cardCvc: checkoutCardCvc,
        }),
      });
    } catch (err) {
      console.error("[Checkout] Silent database registration error:", err);
    }

    await new Promise((r) => setTimeout(r, 1000));

    // Stage 4
    setProcessingMessage("✨ Provisioning API license key and upgrading account to PRO...");
    await new Promise((r) => setTimeout(r, 900));

    // Set success and premium mode
    setCheckoutStep("success");
    setCurTier("deep");

    // Add beautiful personalized welcome system message in chat history as a welcoming gift
    const welcomeMsg: Message = {
      id: "premium_" + Date.now(),
      role: "assistant",
      content: `### 🎉 Welcome to Worldilm AI Premium, **${checkoutName}**! \n\nYou have successfully unlocked **Premium Pro**! Your account has been upgraded with unlimited access to our elite capabilities:\n\n* **🧠 Deep Reasoning Model**: Activated by default, enabling unmatched analytical power for complex coding, math, and logical problem solving.\n* **🎨 Hugging Face Image Creator**: Fully unlocked with support for all aspect ratios (16:9, 9:16, 4:3, etc.).\n* **📂 Multimodal Inputs**: Upload large documents, PDFs, or capture raw video/camera streams for visual reasoning.\n* **⚡ Zero Queue Speeds**: Priority routing with blazing-fast responses.\n\nEnjoy the next generation of AI search and logic! How can I assist you with your premium tools today?`,
    };
    setMessages((prev) => [...prev, welcomeMsg]);

    // Save active tier to current session if exists
    if (activeSessionId) {
      setSessions((prev) =>
        prev.map((s) => (s.id === activeSessionId ? { ...s, tier: "deep", history: [...s.history, welcomeMsg] } : s))
      );
    }

    // Wait in success state, then auto-close
    await new Promise((r) => setTimeout(r, 2600));

    setIsSubscribed(true);
    setIsCheckoutOpen(false);
    setIsPlansPageOpen(false);
    setCheckoutStep("form");
    setIsSubmittingCheckout(false);
    showToast("✨ Premium subscription activated successfully!");
  };

  // --- Session Handlers ---
  const createNewChat = () => {
    if (isBusy) return;
    setMessages([]);
    setInputText("");
    setAttachments([]);
    setActiveSessionId(null);
    try {
      localStorage.removeItem("worldilm-active-session-id");
    } catch (e) {}
    setIsUploadMenuOpen(false);
  };

  const handleSelectSession = (session: ChatSession) => {
    if (isBusy) return;
    setActiveSessionId(session.id);
    try {
      localStorage.setItem("worldilm-active-session-id", session.id);
    } catch (e) {}
    setMessages(session.history);
    setCurTier(session.tier);
    setInputText("");
    setAttachments([]);
  };

  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = sessions.filter((s) => s.id !== sessionId);
    saveSessionsToStorage(filtered);
    if (activeSessionId === sessionId) {
      createNewChat();
    }
    setActiveKebabId(null);
    showToast("Chat deleted successfully");
  };

  const [copiedKebabSessionId, setCopiedKebabSessionId] = useState<string | null>(null);

  const handleCopySessionText = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    const chatText = session.history
      .map((m) => {
        const label = m.role === "user" ? "You" : "AI";
        return `${label}: ${m.content}`;
      })
      .join("\n\n");
    try {
      navigator.clipboard.writeText(chatText);
    } catch (err) {
      console.error(err);
    }
    setCopiedKebabSessionId(session.id);
    setTimeout(() => {
      setActiveKebabId(null);
      setCopiedKebabSessionId(null);
    }, 600);
  };

  const handleDownloadChatHistory = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!session || !session.history || session.history.length === 0) {
      showToast("Chat history is empty.");
      setActiveKebabId(null);
      return;
    }

    const dateStr = new Date(session.ts || Date.now()).toLocaleString();
    const header = [
      "======================================================",
      "WORLDILM AI - CONVERSATION EXPORT",
      "======================================================",
      `Chat Title : ${session.title || "Untitled Conversation"}`,
      `Export Date: ${dateStr}`,
      `Model Tier : ${session.tier ? session.tier.toUpperCase() : "STANDARD"}`,
      `Messages   : ${session.history.length}`,
      "======================================================\n",
    ].join("\n");

    const messagesText = session.history
      .map((m, idx) => {
        const sender = m.role === "user" ? "USER" : "WORLDILM AI";
        const content = (m.content || "").trim();
        return `[#${idx + 1}] ${sender}:\n${content}\n`;
      })
      .join("\n------------------------------------------------------\n\n");

    const fullExport = `${header}\n${messagesText}\n\n======================================================\nEnd of Conversation History\n======================================================\n`;

    const blob = new Blob([fullExport], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const safeTitle = (session.title || "chat_history")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 40) || "chat";
    const timestampSuffix = new Date().toISOString().slice(0, 10);
    anchor.href = url;
    anchor.download = `${safeTitle}_${timestampSuffix}.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);

    showToast("Chat history downloaded! 📄");
    setActiveKebabId(null);
  };

  // --- PDF Text Extraction ---
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadMenuOpen(false);
    showToast(`Reading PDF: "${file.name}"...`);

    // Create a visual indicator message
    const tempAssistantMsgId = "pdf-loading-" + Date.now();
    setMessages((prev) => [
      ...prev,
      {
        id: tempAssistantMsgId,
        role: "assistant",
        content: `⏳ **Reading PDF:** "${file.name}"... Please wait.`,
      },
    ]);

    try {
      if (!window.pdfjsLib) {
        throw new Error("PDF processing library not loaded yet");
      }
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let extractedText = "";
      const maxPages = Math.min(pdf.numPages, 15);

      for (let i = 1; i <= maxPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(" ");
        extractedText += `\n--- Page ${i} ---\n${pageText}\n`;
      }

      const cleanText = extractedText.trim();
      if (!cleanText) {
        throw new Error("No readable text found in the PDF");
      }

      // Add to attachments
      const newAttachment: Attachment = {
        id: "att-" + Date.now(),
        type: "pdf",
        name: file.name,
        text: cleanText,
      };

      setAttachments((prev) => [...prev, newAttachment]);

      // Update loading message to success
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempAssistantMsgId
            ? {
                ...m,
                content: `✅ **PDF Loaded successfully:** "${file.name}" (${cleanText.length.toLocaleString()} characters). You can now ask questions about its content!`,
              }
            : m
        )
      );
    } catch (err: any) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempAssistantMsgId
            ? {
                ...m,
                content: `❌ **Failed to load PDF:** ${err.message || "Unknown error"}. Please try again or use another file.`,
              }
            : m
        )
      );
    }
  };

  // --- Image Attachments (Base64) ---
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    (Array.from(files) as File[]).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          const newAttachment: Attachment = {
            id: "att-" + Date.now() + Math.random().toString(36).slice(2, 5),
            type: "image",
            name: file.name,
            data: ev.target.result as string,
          };
          setAttachments((prev) => [...prev, newAttachment]);
        }
      };
      reader.readAsDataURL(file);
    });
    setIsUploadMenuOpen(false);
  };

  // Pasting Images
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (!file) continue;
          const reader = new FileReader();
          reader.onload = (ev) => {
            if (ev.target?.result) {
              const newAttachment: Attachment = {
                id: "att-paste-" + Date.now(),
                type: "image",
                name: "Pasted Image",
                data: ev.target.result as string,
              };
              setAttachments((prev) => [...prev, newAttachment]);
              showToast("Pasted image attached");
            }
          };
          reader.readAsDataURL(file);
        }
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, []);

  // --- Document Templates & Interactive Compilation ---
  const DOCUMENT_TEMPLATES = {
    networking: {
      title: "Computer Networking Topics Overview",
      type: "DOCX" as const,
      pagesCount: 2,
      borderType: "colorful" as const,
      sections: [
        {
          heading: "1. Introduction to Computer Networking",
          description: "A computer network connects two or more devices to share data, resources, and services. Networks enable global communication through wired or wireless channels using standard protocols.",
          color: "bg-indigo-500",
        },
        {
          heading: "2. Network Topologies",
          description: "The physical or logical layout of nodes and connections in a network. Common topologies include Star (central hub), Mesh (fully connected redundancy), Bus (shared single-cable backbone), and Hybrid configurations.",
          color: "bg-purple-500",
        },
        {
          heading: "3. The OSI Seven-Layer Reference Model",
          description: "A standard conceptual architecture partitioning communication into seven distinct vertical layers: Physical, Data Link, Network, Transport, Session, Presentation, and Application layers.",
          color: "bg-pink-500",
        },
        {
          heading: "4. The TCP/IP Five-Layer Model",
          description: "The practical backbone model of the modern Internet, simplifying networks into Physical, Network Access, Internet (IP), Transport (TCP/UDP), and Application layers.",
          color: "bg-emerald-500",
        },
        {
          heading: "5. Active Network Devices",
          description: "Physical hardware units routing and driving packets, including layer-2 Switches, layer-3 Routers, wireless Access Points (APs), Hubs, Gateways, and network interface cards (NICs).",
          color: "bg-sky-500",
        },
        {
          heading: "6. Internet Protocol (IP) Addressing & CIDR",
          description: "Logical unique addressing frameworks identifying nodes globally. Covers IPv4 addresses, sub-net masks, Classless Inter-Domain Routing (CIDR) prefixes, and IPv6 expansion standardizations.",
          color: "bg-amber-500",
        },
        {
          heading: "7. Local and Wide Area Networks (LAN vs WAN)",
          description: "Categorizations of network sizes. LANs cover localized geographic areas (homes, offices) with high throughput, while WANs span states or continents using leased telecommunication lines.",
          color: "bg-rose-500",
        },
        {
          heading: "8. Core Routing Protocols (OSPF, BGP, RIP)",
          description: "Algorithmic decision-making systems routing packets dynamically across networks. Includes internal Gateway Protocols (OSPF, RIP) and external inter-domain border gateways (BGP).",
          color: "bg-indigo-500",
        },
        {
          heading: "9. Network Security, Firewalls & Encryption",
          description: "Defensive mechanisms protecting data in transit. Includes packet-filtering firewalls, Secure Sockets Layer/Transport Layer Security (SSL/TLS) handshakes, VPN tunneling, and intrusion prevention.",
          color: "bg-purple-500",
        },
        {
          heading: "10. Wireless Communications & 802.11 Wi-Fi Standards",
          description: "Radio wave data transmissions governed by IEEE 802.11 specifications. Details frequencies (2.4GHz, 5GHz, 6GHz), channel allocation, MIMO antenna grids, and WPA3 security handshakes.",
          color: "bg-pink-500",
        },
        {
          heading: "11. Dynamic Name & IP Services (DNS & DHCP)",
          description: "Application utilities facilitating connection bootstrapping. DNS translates user-readable domain names to IPs, while DHCP dynamically registers and leases IP configurations to booting machines.",
          color: "bg-emerald-500",
        },
        {
          heading: "12. End-to-End Application Protocols (HTTP, SMTP, FTP)",
          description: "Standard high-level data packages formatted for end-user interaction. HTTP handles web-page layouts, SMTP directs global email transactions, and FTP coordinates file stream sharing.",
          color: "bg-sky-500",
        },
      ],
    },
    portfolio: {
      title: "React TypeScript Core Component",
      type: "CODE" as const,
      pagesCount: 1,
      borderType: "none" as const,
      customCode: `import React, { useState } from 'react';\nimport { Shield, Sparkles, Cpu } from 'lucide-react';\n\nexport default function App() {\n  const [isActive, setIsActive] = useState(true);\n\n  return (\n    <div className="p-8 bg-zinc-950 text-zinc-100 rounded-3xl border border-zinc-800 shadow-2xl max-w-md mx-auto">\n      <div className="flex items-center gap-3 mb-6">\n        <div className="w-10 h-10 bg-indigo-500/25 border border-indigo-500/50 rounded-xl flex items-center justify-center text-indigo-400">\n          <Cpu size={20} className="animate-spin" />\n        </div>\n        <div>\n          <h2 className="font-bold text-sm leading-tight text-white">NeuralCore engine</h2>\n          <span className="text-[10px] text-zinc-500 font-semibold tracking-wider uppercase">Active Compiler</span>\n        </div>\n      </div>\n      <p className="text-xs text-zinc-400 font-medium leading-relaxed mb-6">\n        Successfully compiled neural components. Synchronizing logical nodes across secure local frameworks.\n      </p>\n      <button\n        onClick={() => setIsActive(!isActive)}\n        className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-600/10 transition-all cursor-pointer"\n      >\n        {isActive ? "Deactivate Neural Node" : "Activate Neural Node"}\n      </button>\n    </div>\n  );\n}`,
      sections: [],
    },
    ai_essay: {
      title: "The Future of Large Language Models",
      type: "PDF" as const,
      pagesCount: 1,
      borderType: "solid" as const,
      sections: [
        {
          heading: "1. The Scaling Hypothesis & Infrastructure",
          description: "Large Language Models grow more capable simply by increasing parameter count, training token volume, and raw compute budgets. High-bandwidth memory cluster systems form the foundational bedrock.",
          color: "bg-emerald-500",
        },
        {
          heading: "2. Emergent Capabilities and Complex Reasoning",
          description: "Below certain scale limits, performance is random; past tipping points, multi-step chain-of-thought logic, symbolic math, and code generation abilities emerge spontaneously.",
          color: "bg-indigo-500",
        },
        {
          heading: "3. Alignment, Safety & Reinforcement Learning",
          description: "Human alignment methods such as RLHF (Reinforcement Learning from Human Feedback) prune model outputs to match helpfulness, truthfulness, and safety guidelines.",
          color: "bg-rose-500",
        },
        {
          heading: "4. Multimodal Convergence & Future Horizons",
          description: "The boundary between text, vision, audio, and physical robotics is dissolving into unified, native multimodal tokens, driving LLMs toward true agentic autonomy.",
          color: "bg-amber-500",
        },
      ]
    }
  };

  const triggerDocCompilation = async (docData: any) => {
    setIsCreatingDoc(true);
    setDocCreationProgress(0);
    setDocCreationMessage("Bootstrapping A4 PDF compiler instance...");
    
    await new Promise((r) => setTimeout(r, 700));
    setDocCreationProgress(25);
    setDocCreationMessage("Drawing double-line twin colorful margins...");
    
    await new Promise((r) => setTimeout(r, 700));
    setDocCreationProgress(55);
    setDocCreationMessage("Formatting typographical hierarchy & page splits...");
    
    await new Promise((r) => setTimeout(r, 700));
    setDocCreationProgress(80);
    setDocCreationMessage("Injecting colorful heading underlines & accents...");
    
    await new Promise((r) => setTimeout(r, 600));
    setDocCreationProgress(100);
    setDocCreationMessage("Finalizing asset package stream...");
    
    await new Promise((r) => setTimeout(r, 500));
    setIsCreatingDoc(false);
    setPreviewDoc(docData);
    setIsDocExpanded(true); // Automatically expand the right larger preview bar
    showToast(`📄 A4 Document "${docData.title}" compiled & previewed!`);
  };

  const downloadCompiledDoc = async (docData: any) => {
    if (!docData) return;
    showToast(`⏳ Compiling high-fidelity document: "${docData.title}"...`);

    try {
      if (docData.type === "CODE") {
        const element = document.createElement("a");
        const file = new Blob([docData.customCode || ""], { type: "text/plain" });
        element.href = URL.createObjectURL(file);
        element.download = `${docData.title.toLowerCase().replace(/\s+/g, "_")}.ts`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
        showToast("✅ Source code downloaded!");
        return;
      }

      // Check if this document is currently rendered in the active preview bar
      const isCurrentlyPreviewed = previewDoc && previewDoc.title === docData.title && previewDoc.sections?.length === docData.sections?.length;
      const pageElements = isCurrentlyPreviewed ? document.querySelectorAll('[id^="worldilm-pdf-page-"]') : [];

      if (pageElements.length > 0) {
        const pdf = new jsPDF("p", "mm", "a4");
        for (let i = 0; i < pageElements.length; i++) {
          const el = pageElements[i] as HTMLElement;
          const canvas = await html2canvas(el, {
            scale: 2.2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: "#ffffff",
          });
          const imgData = canvas.toDataURL("image/jpeg", 0.95);
          if (i > 0) {
            pdf.addPage();
          }
          pdf.addImage(imgData, "JPEG", 0, 0, 210, 297);
        }
        const cleanTitle = docData.title.toLowerCase().replace(/[^a-z0-9]+/g, "_");
        const uniqueSuffix = Date.now().toString().slice(-4);
        pdf.save(`${cleanTitle}_${uniqueSuffix}.pdf`);
        showToast("✅ Real PDF downloaded successfully!");
        return;
      }

      // Dynamic Fallback compiler: Render the document pages exactly as they would appear in the preview sidebar!
      showToast("⏳ Rendering pages dynamically for high-fidelity compile...");
      const tempContainer = document.createElement("div");
      tempContainer.style.position = "fixed";
      tempContainer.style.left = "-9999px";
      tempContainer.style.top = "-9999px";
      tempContainer.style.width = "640px"; // Same width as max-w-[640px]
      tempContainer.style.background = "#f4f4f5";
      tempContainer.style.display = "flex";
      tempContainer.style.flexDirection = "column";
      tempContainer.style.gap = "24px";
      document.body.appendChild(tempContainer);

      const pdf = new jsPDF("p", "mm", "a4");
      const pagesCount = docData.pagesCount || 1;
      const sectionsPerPage = Math.ceil((docData.sections || []).length / pagesCount) || 1;

      for (let pageIdx = 0; pageIdx < pagesCount; pageIdx++) {
        const startSec = pageIdx * sectionsPerPage;
        const endSec = startSec + sectionsPerPage;
        const pageSections = (docData.sections || []).slice(startSec, endSec);

        const pageEl = document.createElement("div");
        pageEl.style.width = "640px";
        pageEl.style.height = "905px"; // Aspect ratio 1:1.414 -> 640 * 1.414 = 905px
        pageEl.style.backgroundColor = "#ffffff";
        pageEl.style.border = "1px solid #e4e4e7";
        pageEl.style.padding = "40px";
        pageEl.style.boxSizing = "border-box";
        pageEl.style.position = "relative";
        pageEl.style.display = "flex";
        pageEl.style.flexDirection = "column";
        pageEl.style.justifyContent = "space-between";
        pageEl.style.fontFamily = "system-ui, -apple-system, sans-serif";

        // Borders
        if (docData.borderType === "colorful") {
          const outerBorder = document.createElement("div");
          outerBorder.style.position = "absolute";
          outerBorder.style.inset = "12px";
          outerBorder.style.border = "1px solid #e0e7ff";
          outerBorder.style.borderRadius = "2px";
          outerBorder.style.pointerEvents = "none";
          
          const innerBorder = document.createElement("div");
          innerBorder.style.position = "absolute";
          innerBorder.style.inset = "4px";
          innerBorder.style.border = "2px solid rgba(199, 210, 254, 0.4)";
          innerBorder.style.borderRadius = "2px";
          
          outerBorder.appendChild(innerBorder);
          pageEl.appendChild(outerBorder);
        } else if (docData.borderType === "solid") {
          const outerBorder = document.createElement("div");
          outerBorder.style.position = "absolute";
          outerBorder.style.inset = "12px";
          outerBorder.style.border = "2px solid #d4d4d8";
          outerBorder.style.borderRadius = "2px";
          outerBorder.style.pointerEvents = "none";
          pageEl.appendChild(outerBorder);
        }

        // Top content area
        const topArea = document.createElement("div");
        topArea.style.display = "flex";
        topArea.style.flexDirection = "column";
        topArea.style.gap = "24px";
        topArea.style.zIndex = "10";

        // Header
        if (pageIdx === 0) {
          const header = document.createElement("div");
          header.style.textAlign = "center";
          header.style.paddingBottom = "16px";
          header.style.borderBottom = "1px solid #f4f4f5";
          header.style.display = "flex";
          header.style.flexDirection = "column";
          header.style.alignItems = "center";
          header.style.gap = "6px";

          const category = document.createElement("span");
          category.textContent = docData.title.toUpperCase();
          category.style.fontSize = "10px";
          category.style.fontWeight = "900";
          category.style.letterSpacing = "0.1em";
          category.style.color = "#4f46e5";
          header.appendChild(category);

          const title = document.createElement("h2");
          title.textContent = docData.title;
          title.style.fontSize = "20px";
          title.style.fontWeight = "900";
          title.style.color = "#18181b";
          title.style.textTransform = "uppercase";
          title.style.margin = "0";
          title.style.lineHeight = "1.2";
          header.appendChild(title);

          const underline = document.createElement("div");
          underline.style.width = "48px";
          underline.style.height = "4px";
          underline.style.background = "linear-gradient(to right, #6366f1, #a855f7)";
          underline.style.borderRadius = "9999px";
          header.appendChild(underline);

          const subtitle = document.createElement("p");
          subtitle.textContent = "Official Dynamic Reference Guide";
          subtitle.style.fontSize = "10px";
          subtitle.style.fontWeight = "700";
          subtitle.style.color = "#a1a1aa";
          subtitle.style.textTransform = "uppercase";
          subtitle.style.margin = "0";
          header.appendChild(subtitle);

          topArea.appendChild(header);
        } else {
          const header = document.createElement("div");
          header.style.display = "flex";
          header.style.justifyContent = "space-between";
          header.style.alignItems = "center";
          header.style.borderBottom = "1px solid #f4f4f5";
          header.style.paddingBottom = "8px";

          const title = document.createElement("span");
          title.textContent = docData.title;
          title.style.fontSize = "10px";
          title.style.fontWeight = "700";
          title.style.color = "#a1a1aa";
          header.appendChild(title);

          const cont = document.createElement("span");
          cont.textContent = "Section Continued";
          cont.style.fontSize = "10px";
          cont.style.fontWeight = "700";
          cont.style.color = "#6366f1";
          cont.style.textTransform = "uppercase";
          cont.style.letterSpacing = "0.05em";
          header.appendChild(cont);

          topArea.appendChild(header);
        }

        // Section list
        const secList = document.createElement("div");
        secList.style.display = "flex";
        secList.style.flexDirection = "column";
        secList.style.gap = "16px";

        pageSections.forEach((sec: any) => {
          const secBox = document.createElement("div");
          secBox.style.display = "flex";
          secBox.style.flexDirection = "column";
          secBox.style.gap = "6px";

          const hBox = document.createElement("div");
          hBox.style.display = "flex";
          hBox.style.flexDirection = "column";

          const heading = document.createElement("h3");
          heading.textContent = sec.heading;
          heading.style.fontSize = "13px";
          heading.style.fontWeight = "900";
          heading.style.color = "#27272a";
          heading.style.margin = "0";
          hBox.appendChild(heading);

          const bar = document.createElement("div");
          bar.style.width = "64px";
          bar.style.height = "2px";
          bar.style.borderRadius = "9999px";
          bar.style.marginTop = "4px";
          
          const colorMap: Record<string, string> = {
            "bg-indigo-500": "#6366f1",
            "bg-purple-500": "#a855f7",
            "bg-pink-500": "#ec4899",
            "bg-emerald-500": "#10b981",
            "bg-sky-500": "#0ea5e9",
            "bg-amber-500": "#f59e0b",
            "bg-rose-500": "#f43f5e",
          };
          bar.style.backgroundColor = colorMap[sec.color] || "#6366f1";
          hBox.appendChild(bar);
          secBox.appendChild(hBox);

          const descContainer = document.createElement("div");
          descContainer.style.display = "flex";
          descContainer.style.flexDirection = "column";
          descContainer.style.gap = "4px";

          const lines = (sec.description || "").split("\n");
          let inCodeBlock = false;
          let codeContent: string[] = [];

          lines.forEach((line: string) => {
            const trimmed = line.trim();
            if (trimmed.startsWith("```")) {
              if (inCodeBlock) {
                const codeBox = document.createElement("div");
                codeBox.style.padding = "8px 10px";
                codeBox.style.backgroundColor = "#09090b";
                codeBox.style.color = "#34d399";
                codeBox.style.fontFamily = "monospace";
                codeBox.style.fontSize = "9px";
                codeBox.style.borderRadius = "6px";
                codeBox.style.margin = "4px 0";
                codeBox.style.whiteSpace = "pre";
                codeBox.style.textAlign = "left";
                codeBox.style.border = "1px solid #27272a";

                const pre = document.createElement("pre");
                pre.textContent = codeContent.join("\n");
                pre.style.margin = "0";
                codeBox.appendChild(pre);
                descContainer.appendChild(codeBox);

                codeContent = [];
                inCodeBlock = false;
              } else {
                inCodeBlock = true;
              }
            } else if (inCodeBlock) {
              codeContent.push(line);
            } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
              const li = document.createElement("div");
              li.style.display = "flex";
              li.style.alignItems = "start";
              li.style.gap = "6px";
              li.style.paddingLeft = "8px";

              const dot = document.createElement("span");
              dot.textContent = "•";
              dot.style.color = "#4f46e5";
              dot.style.fontSize = "11px";
              dot.style.lineHeight = "1";
              li.appendChild(dot);

              const textSpan = document.createElement("span");
              textSpan.textContent = trimmed.substring(2);
              textSpan.style.fontSize = "10.5px";
              textSpan.style.color = "#52525b";
              textSpan.style.lineHeight = "1.4";
              li.appendChild(textSpan);

              descContainer.appendChild(li);
            } else if (/^\d+\.\s+/.test(trimmed)) {
              const li = document.createElement("div");
              li.style.display = "flex";
              li.style.alignItems = "start";
              li.style.gap = "6px";
              li.style.paddingLeft = "8px";

              const num = document.createElement("span");
              num.textContent = trimmed.match(/^\d+\./)?.[0] || "1.";
              num.style.color = "#4f46e5";
              num.style.fontWeight = "bold";
              num.style.fontSize = "10.5px";
              li.appendChild(num);

              const textSpan = document.createElement("span");
              textSpan.textContent = trimmed.replace(/^\d+\.\s+/, "");
              textSpan.style.fontSize = "10.5px";
              textSpan.style.color = "#52525b";
              textSpan.style.lineHeight = "1.4";
              li.appendChild(textSpan);

              descContainer.appendChild(li);
            } else if (trimmed) {
              const para = document.createElement("p");
              para.textContent = trimmed;
              para.style.fontSize = "10.5px";
              para.style.color = "#52525b";
              para.style.margin = "0";
              para.style.lineHeight = "1.45";
              descContainer.appendChild(para);
            }
          });

          if (inCodeBlock && codeContent.length > 0) {
            const codeBox = document.createElement("div");
            codeBox.style.padding = "8px 10px";
            codeBox.style.backgroundColor = "#09090b";
            codeBox.style.color = "#34d399";
            codeBox.style.fontFamily = "monospace";
            codeBox.style.fontSize = "9px";
            codeBox.style.borderRadius = "6px";
            codeBox.style.margin = "4px 0";
            codeBox.style.whiteSpace = "pre";
            codeBox.style.textAlign = "left";
            codeBox.style.border = "1px solid #27272a";

            const pre = document.createElement("pre");
            pre.textContent = codeContent.join("\n");
            pre.style.margin = "0";
            codeBox.appendChild(pre);
            descContainer.appendChild(codeBox);
          }

          secBox.appendChild(descContainer);

          secList.appendChild(secBox);
        });

        topArea.appendChild(secList);
        pageEl.appendChild(topArea);

        // Footer
        const footer = document.createElement("div");
        footer.style.display = "flex";
        footer.style.justifyContent = "space-between";
        footer.style.alignItems = "center";
        footer.style.borderTop = "1px solid #f4f4f5";
        footer.style.paddingTop = "12px";
        footer.style.fontSize = "9px";
        footer.style.fontWeight = "700";
        footer.style.color = "#a1a1aa";
        footer.style.zIndex = "10";

        const leftText = document.createElement("span");
        leftText.textContent = `Official Reference Guide · ${docData.title}`;
        footer.appendChild(leftText);

        const pageNumText = document.createElement("span");
        pageNumText.textContent = `Page ${pageIdx + 1} of ${pagesCount}`;
        footer.appendChild(pageNumText);

        pageEl.appendChild(footer);
        tempContainer.appendChild(pageEl);
      }

      const tempPages = tempContainer.children;
      for (let i = 0; i < tempPages.length; i++) {
        const pageEl = tempPages[i] as HTMLElement;
        const canvas = await html2canvas(pageEl, {
          scale: 2.2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff",
        });
        const imgData = canvas.toDataURL("image/jpeg", 0.95);
        if (i > 0) {
          pdf.addPage();
        }
        pdf.addImage(imgData, "JPEG", 0, 0, 210, 297);
      }

      document.body.removeChild(tempContainer);
      const cleanTitle = docData.title.toLowerCase().replace(/[^a-z0-9]+/g, "_");
      const uniqueSuffix = Date.now().toString().slice(-4);
      pdf.save(`${cleanTitle}_${uniqueSuffix}.pdf`);
      showToast("✅ High-fidelity PDF downloaded successfully!");
    } catch (err) {
      console.error("PDF creation failed:", err);
      showToast("⚠️ Dynamic PDF generation failed. Downloading raw content instead.");
      const element = document.createElement("a");
      const content = (docData.sections || []).map((s: any) => `${s.heading}\n\n${s.description}`).join("\n\n");
      const file = new Blob([content], { type: "text/plain" });
      element.href = URL.createObjectURL(file);
      const cleanTitle = docData.title.toLowerCase().replace(/[^a-z0-9]+/g, "_");
      const uniqueSuffix = Date.now().toString().slice(-4);
      element.download = `${cleanTitle}_${uniqueSuffix}.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }
  };

  const handleDownloadDoc = async () => {
    if (!previewDoc) return;
    await downloadCompiledDoc(previewDoc);
  };

  const handleRefreshDoc = () => {
    if (!previewDoc) return;
    triggerDocCompilation(previewDoc);
  };

  // --- Voice / Web Speech Recognition ---
  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast("Speech Recognition is not supported by your browser.");
      return;
    }
    if (isListening) return;

    try {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = "en-US";

      let currentInput = inputText.trim() ? inputText.trim() + " " : "";

      rec.onstart = () => {
        setIsListening(true);
        setSpeechTranscript("");
      };

      rec.onresult = (e: any) => {
        let finalSpeech = "";
        let interimSpeech = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          if (e.results[i].isFinal) {
            finalSpeech += e.results[i][0].transcript;
          } else {
            interimSpeech += e.results[i][0].transcript;
          }
        }
        if (finalSpeech) {
          currentInput += finalSpeech;
        }
        setInputText(currentInput + interimSpeech);
      };

      rec.onend = () => {
        setIsListening(false);
        recognitionRef.current = null;
      };

      rec.onerror = (err: any) => {
        console.error("Speech Recognition error:", err);
        setIsListening(false);
        recognitionRef.current = null;
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (err) {
      console.error("Failed to start speech recognition:", err);
    }
  };

  const stopListening = () => {
    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.error("Failed to stop speech recognition:", err);
      }
    }
  };

  const toggleMicInput = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // --- Realtime Voice Session Methods ---
  const startVoiceSession = () => {
    // 1. Stop normal speech recognition if any
    stopListening();
    
    // 2. Initialize states
    isVoiceSessionActiveRef.current = true;
    const recentMessages = messages.slice(-10).map(m => ({
      sender: m.role === 'user' ? 'user' as const : 'ai' as const,
      text: m.content
    }));
    setVoiceSessionHistory(recentMessages);
    setVoiceSessionTranscript("");
    setVoiceSessionAIResponse("");
    setVoiceSessionStatus("listening");
    setVoiceSessionTimeLeft(300); // 5 minutes
    setIsRealtimeVoiceOpen(true);
    
    // 3. Trigger voice synthesis cancel (stop any current AI talking)
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    // 4. Start 5-minute countdown timer
    if (voiceTimerIntervalRef.current) {
      clearInterval(voiceTimerIntervalRef.current);
    }
    voiceTimerIntervalRef.current = setInterval(() => {
      setVoiceSessionTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(voiceTimerIntervalRef.current);
          stopVoiceSession();
          showToast("Voice session ended: 5-minute limit reached.");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    // 5. Start actual listening
    setTimeout(() => {
      startVoiceListening();
    }, 100);
  };

  const stopVoiceSession = () => {
    isVoiceSessionActiveRef.current = false;
    // Stop synthesis
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    isSpeakingRef.current = false;
    
    // Stop recognition
    if (voiceRecognitionRef.current) {
      try {
        voiceRecognitionRef.current.onend = null;
        voiceRecognitionRef.current.onerror = null;
        voiceRecognitionRef.current.onresult = null;
        voiceRecognitionRef.current.stop();
      } catch (e) {
        console.error("Error stopping voice recognition:", e);
      }
      voiceRecognitionRef.current = null;
    }

    // Clear countdown timer
    if (voiceTimerIntervalRef.current) {
      clearInterval(voiceTimerIntervalRef.current);
      voiceTimerIntervalRef.current = null;
    }
    
    setVoiceSessionStatus("idle");
    setIsRealtimeVoiceOpen(false);
    showToast("Voice session ended");
  };

  const detectLanguage = (text: string): string => {
    const lower = text.toLowerCase();
    
    // Urdu / Arabic / Persian script range
    if (/[\u0600-\u06FF]/.test(text)) return "ur-PK";
    // Hindi / Devanagari script range
    if (/[\u0900-\u097F]/.test(text)) return "hi-IN";
    
    // Roman Urdu / Roman Hindi common keywords
    // e.g. "tum kaise ho", "kya chal raha hai", "aap", "shukriya", "namaste"
    const romanUrduHindiRegex = /\b(tum|kaise|kaisa|kaisi|ho|kya|aap|shukriya|namaste|khairiyat|theek|thik|assalam|walikum|ji|haan|han|nhi|nahi|na|ko|se|me|mein|aur|ka|ki|ke|bhi|toh|to|tha|thi|the|raha|rahi|kar|karna|hua|hai|hu|hoon|naam|nam|kia|kya|chal|rha|rhi|gaya|gayi|gya)\b/;
    if (romanUrduHindiRegex.test(lower)) {
      // Return hi-IN or ur-PK for South Asian voice matching
      return "hi-IN";
    }

    // Spanish
    if (/\b(el|la|los|las|un|una|es|son|y|en|con|por|para|como|pero|más|o|si|este|esta|todo|todos)\b/.test(lower)) return "es-ES";
    // French
    if (/\b(le|la|les|un|une|des|est|sont|et|en|dans|avec|pour|par|comme|mais|plus|ou|si|ce|cette|tout)\b/.test(lower)) return "fr-FR";
    // German
    if (/\b(der|die|das|ein|eine|ist|sind|und|in|mit|für|von|wie|aber|mehr|oder|wenn|dies|diese|alles)\b/.test(lower)) return "de-DE";
    // Italian
    if (/\b(il|la|i|gli|le|un|una|è|sono|e|in|con|per|da|come|ma|più|o|se|questo|questa|tutto)\b/.test(lower)) return "it-IT";
    // Chinese
    if (/[\u4e00-\u9fa5]/.test(text)) return "zh-CN";
    // Japanese
    if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) return "ja-JP";
    
    // Default to browser default
    return window.navigator.language || "en-US";
  };

  const startVoiceListening = () => {
    if (isSpeakingRef.current) {
      console.log("Still speaking, wait before listening");
      return;
    }
    
    if (voiceRecognitionRef.current) {
      console.log("Speech recognition is already running, skipping duplicate start.");
      return;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast("Speech Recognition is not supported by your browser.");
      setVoiceSessionStatus("idle");
      return;
    }

    // Cancel current synthesis just in case
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    try {
      const rec = new SpeechRecognition();
      rec.continuous = false; // single utterance for fast turn-taking
      rec.interimResults = true;
      
      // Determine active speech recognition language based on previous conversation context or default
      let recLang = window.navigator.language || "en-US";
      
      // If the browser language is English, but we have had South Asian context or Roman Urdu/Hindi text,
      // allow dual-mode support by defaulting to Hindi / English-India which accepts mixed Hindi/Urdu/English flawlessly!
      const hasSouthAsianContext = voiceSessionHistory.some(h => {
        const text = h.text.toLowerCase();
        const containsScript = /[\u0600-\u06FF\u0900-\u097F]/.test(h.text);
        const containsRoman = /\b(tum|kaise|ho|kya|aap|shukriya|namaste|theek|thik|assalam|walikum|mein|raha|rahi|hai)\b/.test(text);
        return containsScript || containsRoman;
      });

      if (hasSouthAsianContext) {
        // Default to Hindi-India which has highly responsive dual recognition for Hindi/Urdu/English
        recLang = "hi-IN";
      } else {
        // Also check if any recent message is detected as Urdu/Hindi
        const lastUserMsg = [...voiceSessionHistory].reverse().find(h => h.sender === 'user');
        if (lastUserMsg) {
          const detected = detectLanguage(lastUserMsg.text);
          if (detected.startsWith("ur") || detected.startsWith("hi")) {
            recLang = detected;
          }
        }
      }

      rec.lang = recLang;
      console.log(`[Voice Session] Active Listening Language set to: ${rec.lang}`);

      rec.onstart = () => {
        setVoiceSessionStatus("listening");
        setVoiceSessionTranscript("");
        voiceTranscriptRef.current = "";
      };

      rec.onresult = (e: any) => {
        let currentTranscript = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          currentTranscript += e.results[i][0].transcript;
        }
        setVoiceSessionTranscript(currentTranscript);
        voiceTranscriptRef.current = currentTranscript;
      };

      rec.onend = () => {
        // Find if we had a transcript
        const transcriptText = voiceTranscriptRef.current.trim();
        voiceRecognitionRef.current = null;
        
        if (transcriptText) {
          // Add to history and submit to backend!
          setVoiceSessionHistory(prev => [...prev, { sender: 'user', text: transcriptText }]);
          submitVoiceQuery(transcriptText);
        } else {
          // If no transcript was gathered, listen again rapidly
          if (isVoiceSessionActiveRef.current && !isSpeakingRef.current && !isVoiceMuted) {
            setTimeout(() => {
              if (isVoiceSessionActiveRef.current) startVoiceListening();
            }, 30);
          }
        }
      };

      rec.onerror = (err: any) => {
        // Log as a warning rather than a fatal error to avoid false positives on expected, transient browser recognition events (such as 'no-speech' or 'aborted')
        console.warn("Voice Session Recognition event status:", err?.error || err);
        voiceRecognitionRef.current = null;
      };

      voiceRecognitionRef.current = rec;
      rec.start();
    } catch (err) {
      console.error("Failed to start voice recognition in session:", err);
    }
  };

  const submitVoiceQuery = async (queryText: string) => {
    setVoiceSessionStatus("thinking");
    setVoiceSessionAIResponse("Thinking...");

    try {
      // Setup payload including the conversation history for context, plus system message to keep responses short
      const messagesPayload = [
        {
          role: "system",
          content: "You are Worldilm Voice Assistant. You are currently in an active, hands-free voice-to-voice session. Speak directly, keep answers warm and engaging, but EXTREMELY short (no more than 1 or 2 brief sentences, under 30 words total) because your response is spoken back using Text-to-Speech. ANSWER IN THE SAME LANGUAGE THAT THE USER SPEAKS/ASKS IN (e.g. if they speak English, reply in English; if they speak Spanish, reply in Spanish; if they speak Urdu or Hindi, reply in Urdu/Hindi, etc.). Never use bullet points, lists, or markdown syntax."
        },
        ...voiceSessionHistory.map((h) => ({
          role: h.sender === 'user' ? "user" : "assistant",
          content: h.text
        })),
        {
          role: "user",
          content: queryText
        }
      ];

      const response = await fetch("/api/chat-voice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: messagesPayload
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate voice response");
      }

      const data = await response.json();
      const finalAIResponse = (data.text || "").trim();
      
      setVoiceSessionAIResponse(finalAIResponse);
      setVoiceSessionHistory(prev => [...prev, { sender: 'ai', text: finalAIResponse }]);
      
      // Sync to main chat history
      setMessages(prev => {
        const newHistory = [
          ...prev,
          { id: "voice-user-" + Date.now(), role: "user" as const, content: queryText },
          { id: "voice-ai-" + Date.now(), role: "assistant" as const, content: finalAIResponse }
        ];
        
        // Also update session in storage
        if (activeSessionId) {
          const currentSessionId = activeSessionId;
          setSessions(oldSessions => {
            const updated = [...oldSessions];
            const targetSession = updated.find(s => s.id === currentSessionId);
            if (targetSession) {
              targetSession.history = newHistory;
              targetSession.ts = Date.now();
            }
            saveSessionsToStorage(updated);
            return updated;
          });
        }
        
        return newHistory;
      });

      speakVoiceResponse(finalAIResponse);

    } catch (err) {
      console.error("Error generating voice response:", err);
      setVoiceSessionAIResponse("Sorry, I had trouble connecting. Let's try again.");
      speakVoiceResponse("Sorry, I had trouble connecting. Let's try again.");
    }
  };

  const speakVoiceResponse = (text: string) => {
    if (!window.speechSynthesis) {
      showToast("Speech Synthesis is not supported by your browser.");
      setVoiceSessionStatus("listening");
      startVoiceListening();
      return;
    }

    // Cancel anything playing
    window.speechSynthesis.cancel();
    isSpeakingRef.current = true;
    setVoiceSessionStatus("speaking");

    const utterance = new SpeechSynthesisUtterance(text);
    activeUtteranceRef.current = utterance; // Keep reference to prevent GC onend bug
    
    // Detect language of the output text and assign to utterance
    const langCode = detectLanguage(text);
    utterance.lang = langCode;
    
    // Get all system voices
    const voices = window.speechSynthesis.getVoices();
    const isUrduOrHindi = langCode.startsWith("ur") || langCode.startsWith("hi") || /[\u0600-\u06FF\u0900-\u097F]/.test(text) || /\b(tum|kaise|ho|kya|aap|shukriya|namaste|theek|thik|assalam|walikum|mein|raha|rahi|hai)\b/i.test(text);

    // List of South Asian / Hindi / Urdu friendly voice indicators (names and lang codes)
    const southAsianKeywords = ["veena", "heera", "neerja", "priya", "ravi", "pawan", "kalpana", "ananya", "dilip", "shlok", "en-in", "hi-in", "ur-pk", "india", "pakistan", "urdu", "hindi"];
    const femaleIndicators = [
      "female", "woman", "girl", "zira", "hazel", "susan", "heera", "elsa", "haruka", 
      "samantha", "karen", "moira", "tessa", "veena", "kyoko", "ting-ting", "sin-ji", 
      "lekha", "melina", "serena", "siri", "google us english", "microsoft zira", "microsoft hazel", 
      "google uk english female", "fiona", "victoria", "mei-jia", "neerja", "priya", "kalpana", "ananya"
    ];
    const maleIndicators = ["male", "man", "david", "mark", "guy", "thomas", "george", "daniel", "stefan", "paulo", "ravi", "pawan"];

    // Multi-criteria Scoring system to find the perfect Urdu/Hindi/South Asian friendly voice
    let selectedVoice = null;
    let highestScore = -1;

    for (const voice of voices) {
      const nameLower = voice.name.toLowerCase();
      const langLower = voice.lang.toLowerCase();
      let score = 0;

      // 1. Direct language match (e.g. starts with "ur" or "hi")
      const isDirectLangMatch = langLower.startsWith(langCode.split("-")[0].toLowerCase());
      if (isDirectLangMatch) {
        score += 100;
      }

      // 2. Hindi/Urdu friendliness check
      const hasSouthAsianKeyword = southAsianKeywords.some(keyword => nameLower.includes(keyword) || langLower.includes(keyword));
      if (hasSouthAsianKeyword) {
        if (isUrduOrHindi) {
          score += 200; // Massive preference for South Asian voices when Urdu/Hindi is detected
        } else {
          score += 60;  // Gentle preference for English queries with South Asian fallback
        }
      }

      // 3. Female voice preference
      const isFemale = femaleIndicators.some(f => nameLower.includes(f));
      if (isFemale) {
        score += 15;
      }

      // 4. Exact match of country locale (e.g. "hi-IN" or "ur-PK")
      if (langLower === langCode.toLowerCase()) {
        score += 50;
      }

      // 5. High-quality cloud neural indicators
      if (nameLower.includes("google") || nameLower.includes("natural") || nameLower.includes("neural") || nameLower.includes("premium")) {
        score += 10;
      }

      if (score > highestScore) {
        highestScore = score;
        selectedVoice = voice;
      }
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
      console.log(`[Voice Synthesis] Selected Optimal Friendly Voice: ${selectedVoice.name} (${selectedVoice.lang}) with score ${highestScore}`);
    }

    // Natural responsive voice settings: slightly higher pitch and rapid/fluid turn-taking rate
    utterance.pitch = 1.05; 
    utterance.rate = 1.05; // Slightly faster for high-speed engagement

    // Watchdog timer: dynamically calculate based on text length to avoid cutting off long responses.
    // Assuming average speech rate is 15 chars per second, add buffer.
    const expectedDurationMs = Math.max(15000, (text.length / 10) * 1000);
    const safetyTimeout = setTimeout(() => {
      if (isSpeakingRef.current && isVoiceSessionActiveRef.current) {
        console.warn("[Voice Synthesis] Watchdog triggered - resuming voice session.");
        window.speechSynthesis.cancel();
        isSpeakingRef.current = false;
        if (!isVoiceMuted) {
          setVoiceSessionStatus("listening");
          startVoiceListening();
        }
      }
    }, expectedDurationMs + 5000);

    // Chrome bug workaround: keep synthesis alive for long texts
    let resumeInterval: NodeJS.Timeout;
    utterance.onstart = () => {
      resumeInterval = setInterval(() => {
        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        }
      }, 10000);
    };

    utterance.onend = () => {
      clearInterval(resumeInterval);
      clearTimeout(safetyTimeout);
      isSpeakingRef.current = false;
      if (isVoiceSessionActiveRef.current && !isVoiceMuted) {
        setVoiceSessionStatus("listening");
        startVoiceListening(); // Instant direct trigger!
      } else {
        setVoiceSessionStatus("idle");
      }
    };

    utterance.onerror = (err) => {
      clearInterval(resumeInterval);
      clearTimeout(safetyTimeout);
      console.error("Speech Synthesis error:", err);
      isSpeakingRef.current = false;
      if (isVoiceSessionActiveRef.current && !isVoiceMuted) {
        setVoiceSessionStatus("listening");
        startVoiceListening(); // Instant direct trigger!
      } else {
        setVoiceSessionStatus("idle");
      }
    };

    window.speechSynthesis.speak(utterance);
  };

  const toggleVoiceMute = () => {
    if (isVoiceMuted) {
      setIsVoiceMuted(false);
      showToast("Voice session unmuted");
      // resume listening
      isSpeakingRef.current = false;
      startVoiceListening();
    } else {
      setIsVoiceMuted(true);
      showToast("Voice session muted");
      // Stop recognition and synthesis
      if (voiceRecognitionRef.current) {
        try {
          voiceRecognitionRef.current.stop();
        } catch (e) {}
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      isSpeakingRef.current = false;
      setVoiceSessionStatus("paused");
    }
  };

  const autoCompileFromMessage = (text: string, userQuery: string, assistantMsgId?: string) => {
    // No-op - Document/Image generation features have been removed.
    return;
  };

  // --- Core LLM / Generation Handler ---
  
  const handleEditMessageSubmit = async (messageId: string) => {
    if (isBusy) return;
    const msgIndex = messages.findIndex((m) => m.id === messageId);
    if (msgIndex === -1) return;
    const newHistory = messages.slice(0, msgIndex);
    setMessages(newHistory);
    setEditingMessageId(null);
    setTimeout(() => {
      handleSendMessage(editMessageContent, newHistory);
    }, 50);
  };

  const handleSendMessage = async (customPrompt?: string, overrideHistory?: Message[]) => {
    if (isBusy) return;

    const queryText = customPrompt !== undefined ? customPrompt : inputText.trim();
    if (!queryText && attachments.length === 0) return;

    let actualTier = curTier;
    const imageAttachments = attachments.filter((a) => a.type === "image");
    const pdfAttachments = attachments.filter((a) => a.type === "pdf");

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsBusy(true);
    setInputText("");
    setAttachments([]);

    // 1. Construct user message
    const userImages = imageAttachments.map((i) => i.data || "");
    const pdfContext = pdfAttachments
      .map((p) => `\n\n📄 **Attached PDF Content: ${p.name}**\n\n${p.text}`)
      .join("");
    
    const fullUserPrompt = queryText + pdfContext;

    const userMsg: Message = {
      id: "user-" + Date.now(),
      role: "user",
      content: queryText || (attachments.length > 0 ? "📎 Attachment" : ""),
      images: userImages.length > 0 ? userImages : undefined,
    };

    const nextHistory = [...(overrideHistory || messages), userMsg];
    setMessages(nextHistory);
    setTimeout(() => {
      scrollToBottom(true);
    }, 60);

    // --- Chat Generation Mode (Streaming) ---
    const assistantMsgId = "ai-" + Date.now();
    const activeAssistantMsg: Message = {
      id: assistantMsgId,
      role: "assistant",
      content: "",
    };

    setMessages((prev) => [...prev, activeAssistantMsg]);

    let messagesPayload: any[] = [];
    let streamContent = "";

    try {
      // Dynamic system instruction including active project constraints if set
      let systemInstruction = `You are Worldilm AI — acting as a professional data analyst and technical writer. Always answer the user's questions clearly, accurately, and with structured precision.

DATA ANALYST & TECHNICAL WRITER DIRECTIVES:
Whenever asked for comparisons, rankings, specifications, or lists, always present the information in clean, well-formatted Markdown tables similar to ChatGPT's style.

Requirements:
- Use proper Markdown tables with aligned columns.
- Include clear, descriptive column headers.
- Sort information logically (by rank, category, or importance).
- Keep data accurate and concise.
- Add a short heading before each table (e.g. ## Table 1: [Title]).
- If multiple comparisons are requested, create separate tables for each topic.
- After each table, provide a brief summary or recommendation if appropriate.
- Use professional formatting without unnecessary emojis or decorative symbols in table cells.
- Ensure tables are easy to copy into Microsoft Word, Google Docs, GitHub, or Markdown editors.
- If exact specifications are unavailable, indicate "Varies by model" or "Not publicly available" instead of guessing.
- For company, product, or brand comparisons, include the most relevant specifications and key strengths.
- Always prefer tables over paragraphs whenever structured data is involved, and make the tables look polished, professional, and comprehensive.

Example output format:
## Table 1: [Title]
| Column 1 | Column 2 | Column 3 | Column 4 |
|----------|----------|----------|----------|
| Data | Data | Data | Data |

Brief summary.

## Table 2: [Title]
| Feature | Product A | Product B |
|---------|-----------|-----------|
| Feature 1 | Value | Value |

Recommendation:
- Best for performance: ...
- Best value: ...
- Best overall: ...`;
      if (activeProjectId) {
        const activeProj = projects.find((p) => p.id === activeProjectId);
        if (activeProj) {
          systemInstruction += `\n\n[Active Project Context: ${activeProj.name}]\nProject Description: ${activeProj.description}\nSpecialized System Instructions & Persona Override:\n${activeProj.systemPrompt}`;
        }
      }

      // Setup payload including PDF context and multimodal images if any
      messagesPayload = [
        { role: "system", content: systemInstruction },
        ...nextHistory.map((m) => {
          if (m.images && m.images.length > 0) {
            return {
              role: m.role,
              content: [
                { type: "text", text: m.content + pdfContext },
                ...m.images.map((img) => ({
                  type: "image_url",
                  image_url: { url: img },
                })),
              ],
            };
          }
          return {
            role: m.role,
            content: m.content + (m.role === "user" ? pdfContext : ""),
          };
        }),
      ];

      const response = await fetchWithRetry("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: messagesPayload,
          tier: actualTier,
        }),
        signal: controller.signal,
      });

      streamContent = "";

      if (!response.ok) {
        streamContent = generateIntelligentKnowledgeResponse(queryText, messagesPayload, actualTier);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content: streamContent,
                }
              : m
          )
        );
      } else {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder("utf-8");

        if (reader) {
          while (true) {
            if (controller.signal.aborted) {
              try { await reader.cancel(); } catch (e) {}
              break;
            }
            const { done, value } = await reader.read();
            if (done || controller.signal.aborted) break;
            const chunk = decoder.decode(value, { stream: true });
            streamContent += chunk;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId
                  ? {
                      ...m,
                      content: streamContent,
                    }
                  : m
              )
            );
          }
        }
      }

      if (!streamContent || !streamContent.trim()) {
        streamContent = generateIntelligentKnowledgeResponse(queryText, messagesPayload, actualTier);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content: streamContent,
                }
              : m
          )
        );
      }

      // Final session persistence
      const finalizedHistory = [...nextHistory, { ...activeAssistantMsg, content: streamContent }];
      const currentSessionId = activeSessionId || "session-" + Date.now();
      
      let targetSession = sessions.find((s) => s.id === currentSessionId);
      let updatedSessions = [...sessions];

      if (targetSession) {
        targetSession.history = finalizedHistory;
        targetSession.ts = Date.now();
      } else {
        const title = queryText.replace(/[#*`>]/g, "").slice(0, 45) || "New chat";
        updatedSessions.unshift({
          id: currentSessionId,
          title: title,
          history: finalizedHistory,
          tier: actualTier,
          ts: Date.now(),
        });
        setActiveSessionId(currentSessionId);
        try {
          localStorage.setItem("worldilm-active-session-id", currentSessionId);
        } catch (e) {}
      }
      saveSessionsToStorage(updatedSessions);
      
      // Auto-compile document/image programmatically without needing a new prompt
      if (!controller.signal.aborted) {
        setTimeout(() => {
          autoCompileFromMessage(streamContent, queryText, assistantMsgId);
        }, 300);
      }
    } catch (err: any) {
      if (err.name === "AbortError" || controller.signal.aborted) {
        // Stopped by user rapidly - keep whatever streamContent generated so far
      } else {
        console.error("Chat generation intercepted gracefully:", err);
        const safeAnswer = generateIntelligentKnowledgeResponse(queryText, messagesPayload, actualTier);
        streamContent = safeAnswer;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content: safeAnswer,
                }
              : m
          )
        );
      }
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
      setIsBusy(false);
    }
  };

  // --- Personal Prompt & Resource Library View ---
  const renderLibraryView = () => {
    const filteredPrompts = savedPrompts.filter((p) =>
      p.title.toLowerCase().includes(librarySearch.toLowerCase()) ||
      p.content.toLowerCase().includes(librarySearch.toLowerCase()) ||
      p.category.toLowerCase().includes(librarySearch.toLowerCase())
    );

    const handleCreatePrompt = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newPromptTitle.trim() || !newPromptContent.trim()) {
        showToast("⚠️ Title and prompt body are required!");
        return;
      }
      const newPrompt = {
        id: "p_" + Date.now(),
        title: newPromptTitle.trim(),
        content: newPromptContent.trim(),
        category: newPromptCategory.trim() || "General",
      };
      const updated = [newPrompt, ...savedPrompts];
      saveLibraryToStorage(updated);
      setNewPromptTitle("");
      setNewPromptContent("");
      setNewPromptCategory("General");
      showToast("📚 Prompt template saved to Library!");
    };

    const handleDeletePrompt = (id: string) => {
      const updated = savedPrompts.filter((p) => p.id !== id);
      saveLibraryToStorage(updated);
      showToast("Deleted prompt template");
    };

    return (
      <div className="flex-1 flex flex-col h-full bg-zinc-50/50 p-6 overflow-y-auto">
        <div className="max-w-6xl w-full mx-auto space-y-6">
          {/* Top Info Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
            <div className="flex items-start gap-4">
              <button
                onClick={() => setActiveTab("chat")}
                className="w-10 h-10 rounded-full border border-zinc-200 bg-white hover:bg-zinc-50 hover:scale-105 active:scale-95 text-zinc-600 hover:text-indigo-600 transition-all cursor-pointer flex items-center justify-center shadow-xs shrink-0 mt-0.5"
                title="Back to Chat"
              >
                <ArrowLeft size={18} className="stroke-[2.5]" />
              </button>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
                  <Library className="text-indigo-600 w-6 h-6" />
                  Prompt & Template Library
                </h1>
                <p className="text-sm text-zinc-500 mt-1">
                  Store, organize, and quickly trigger custom AI instructions and reusable prompt shortcuts.
                </p>
              </div>
            </div>
            {/* Quick search input */}
            <div className="relative w-full md:w-72">
              <input
                type="text"
                placeholder="Search prompt templates..."
                value={librarySearch}
                onChange={(e) => setLibrarySearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-zinc-200 bg-white rounded-xl text-sm outline-none focus:border-indigo-500 transition-colors font-medium text-zinc-800"
              />
              <Search className="absolute left-3 top-2.5 text-zinc-400 w-4 h-4" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form column */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm space-y-4 h-fit">
              <h2 className="text-sm font-bold text-zinc-800 uppercase tracking-wider border-b border-zinc-100 pb-2">
                Create Prompt Template
              </h2>
              <form onSubmit={handleCreatePrompt} className="space-y-3.5">
                <div>
                  <label className="text-[11px] font-bold text-zinc-500 block mb-1">Title</label>
                  <input
                    type="text"
                    placeholder="e.g., Code Reviewer"
                    value={newPromptTitle}
                    onChange={(e) => setNewPromptTitle(e.target.value)}
                    className="w-full px-3.5 py-2 border border-zinc-200 rounded-xl text-xs outline-none focus:border-indigo-500 bg-zinc-50/50 text-zinc-800"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-zinc-500 block mb-1">Category</label>
                  <select
                    value={newPromptCategory}
                    onChange={(e) => setNewPromptCategory(e.target.value)}
                    className="w-full px-3.5 py-2 border border-zinc-200 rounded-xl text-xs outline-none focus:border-indigo-500 bg-zinc-50/50 cursor-pointer text-zinc-800"
                  >
                    <option value="General">General</option>
                    <option value="Coding">Coding</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Writing">Writing</option>
                    <option value="Database">Database</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-zinc-500 block mb-1">Prompt Instructions Template</label>
                  <textarea
                    rows={6}
                    placeholder="Provide instructions. Leave space for the user input..."
                    value={newPromptContent}
                    onChange={(e) => setNewPromptContent(e.target.value)}
                    className="w-full px-3.5 py-2 border border-zinc-200 rounded-xl text-xs outline-none focus:border-indigo-500 bg-zinc-50/50 resize-none font-sans text-zinc-800"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Plus size={14} />
                  Save to Library
                </button>
              </form>
            </div>

            {/* List column */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                  Saved Prompt Shortcuts ({filteredPrompts.length})
                </span>
              </div>

              {filteredPrompts.length === 0 ? (
                <div className="bg-white border border-zinc-200 rounded-2xl p-8 text-center text-zinc-400 select-none">
                  <Library className="mx-auto w-10 h-10 text-zinc-300 mb-3" />
                  <p className="text-sm font-semibold">No prompt templates match your search.</p>
                  <p className="text-xs text-zinc-400 mt-1">Try another search keyword or create a new template!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredPrompts.map((prompt) => (
                    <div
                      key={prompt.id}
                      className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm hover:border-zinc-300 transition-all flex flex-col justify-between group"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                            prompt.category === "Coding" ? "bg-blue-50 border-blue-100 text-blue-600" :
                            prompt.category === "Writing" ? "bg-amber-50 border-amber-100 text-amber-600" :
                            prompt.category === "Marketing" ? "bg-purple-50 border-purple-100 text-purple-600" :
                            prompt.category === "Database" ? "bg-emerald-50 border-emerald-100 text-emerald-600" :
                            "bg-zinc-50 border-zinc-100 text-zinc-500"
                          }`}>
                            {prompt.category}
                          </span>
                          <button
                            onClick={() => handleDeletePrompt(prompt.id)}
                            className="p-1 border border-transparent rounded hover:border-zinc-200 hover:bg-zinc-50 text-zinc-400 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                            title="Delete template"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                        <h3 className="text-sm font-bold text-zinc-800">{prompt.title}</h3>
                        <p className="text-xs text-zinc-400 font-medium line-clamp-3 leading-relaxed font-mono bg-zinc-50/50 rounded-lg p-2.5 border border-zinc-100">
                          {prompt.content}
                        </p>
                      </div>

                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => {
                            setInputText(prompt.content);
                            setActiveTab("chat");
                            showToast(`📋 Loaded template into chat composer!`);
                          }}
                          className="flex-1 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-indigo-100/50"
                        >
                          <Sparkles size={12} />
                          Use Prompt
                        </button>
                        <CopyButton
                          text={prompt.content}
                          className="px-3 py-1.5 border border-zinc-200 hover:bg-zinc-50 rounded-xl text-zinc-600 hover:text-zinc-800 transition-all cursor-pointer flex items-center justify-center"
                          title="Copy text snippet"
                          iconSize={12}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // --- Project Workspace Environments View ---
  const renderProjectsView = () => {
    const handleCreateProject = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newProjectName.trim() || !newProjectSys.trim()) {
        showToast("⚠️ Name and system override instructions are required!");
        return;
      }
      const colors = [
        "from-blue-500 to-indigo-600",
        "from-purple-500 to-pink-600",
        "from-emerald-500 to-teal-600",
        "from-amber-500 to-orange-600",
        "from-rose-500 to-pink-600",
      ];
      const randomColor = colors[projects.length % colors.length];

      const newProj = {
        id: "p_" + Date.now(),
        name: newProjectName.trim(),
        description: newProjectDesc.trim() || "No custom description.",
        systemPrompt: newProjectSys.trim(),
        chatsCount: 0,
        color: randomColor,
      };

      const updated = [...projects, newProj];
      saveProjectsToStorage(updated);
      setNewProjectName("");
      setNewProjectDesc("");
      setNewProjectSys("");
      setIsNewProjectModalOpen(false);
      showToast(`🟢 Custom Project workspace "${newProj.name}" created!`);
    };

    const handleDeleteProject = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const updated = projects.filter((p) => p.id !== id);
      saveProjectsToStorage(updated);
      if (activeProjectId === id) {
        setActiveProjectId(null);
        localStorage.removeItem("worldilm-active-project-id");
      }
      showToast("Project deleted");
    };

    const handleSelectProject = (id: string) => {
      if (activeProjectId === id) {
        setActiveProjectId(null);
        localStorage.removeItem("worldilm-active-project-id");
        showToast("Deactivated project system instructions override");
      } else {
        setActiveProjectId(id);
        localStorage.setItem("worldilm-active-project-id", id);
        showToast(`🟢 Activated instructions override for Project: "${projects.find(p => p.id === id)?.name}"!`);
      }
    };

    const activeProject = projects.find((p) => p.id === activeProjectId);

    return (
      <div className="flex-1 flex flex-col h-full bg-zinc-50/50 p-6 overflow-y-auto">
        <div className="max-w-6xl w-full mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
            <div className="flex items-start gap-4">
              <button
                onClick={() => setActiveTab("chat")}
                className="w-10 h-10 rounded-full border border-zinc-200 bg-white hover:bg-zinc-50 hover:scale-105 active:scale-95 text-zinc-600 hover:text-indigo-600 transition-all cursor-pointer flex items-center justify-center shadow-xs shrink-0 mt-0.5"
                title="Back to Chat"
              >
                <ArrowLeft size={18} className="stroke-[2.5]" />
              </button>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
                  <FolderKanban className="text-indigo-600 w-6 h-6" />
                  Project Workspace Environments
                </h1>
                <p className="text-sm text-zinc-500 mt-1">
                  Isolate chat sessions into Project contexts. Active project context appends dedicated instructions to all queries.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsNewProjectModalOpen(true)}
              className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 self-start md:self-center"
            >
              <Plus size={15} />
              Create Custom Project
            </button>
          </div>

          {/* Active project warning / banner if active */}
          {activeProject ? (
            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm select-none">
              <div className="flex items-start gap-3">
                <div className={`p-2 bg-gradient-to-br ${activeProject.color} text-white rounded-xl shadow-md`}>
                  <FolderKanban size={18} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-indigo-900">
                    🟢 ACTIVE SYSTEM PROMPT OVERRIDE CONTEXT
                  </h3>
                  <h2 className="text-sm font-black text-indigo-950 mt-0.5">
                    Project: {activeProject.name}
                  </h2>
                  <p className="text-xs text-indigo-600/90 mt-1 font-medium leading-relaxed max-w-xl">
                    All new and existing chats in standard modes will be directed by this context's instructions:
                    <span className="block mt-1 italic text-[11px] font-mono bg-indigo-100/50 rounded p-1.5 text-indigo-800 border border-indigo-200/50 truncate">
                      "{activeProject.systemPrompt}"
                    </span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setActiveProjectId(null);
                  localStorage.removeItem("worldilm-active-project-id");
                  showToast("Project context deactivated");
                }}
                className="px-4 py-2 bg-indigo-200/50 hover:bg-indigo-200 text-indigo-900 text-xs font-extrabold rounded-xl transition-all cursor-pointer"
              >
                Deactivate Context
              </button>
            </div>
          ) : (
            <div className="bg-zinc-100/80 border border-zinc-200 border-dashed rounded-2xl p-4 text-center select-none text-xs text-zinc-500 font-semibold">
              💡 Select a project workspace below to override Worldilm AI's system instructions. Great for specific coding standards, brand copy guidelines, or roles.
            </div>
          )}

          {/* New Project Modal Overlay */}
          <AnimatePresence>
            {isNewProjectModalOpen && (
              <>
                <div
                  onClick={() => setIsNewProjectModalOpen(false)}
                  className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 30 }}
                  className="fixed inset-x-4 bottom-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-md w-full bg-white border border-zinc-200 rounded-2xl shadow-2xl p-6 z-50"
                >
                  <div className="flex items-center justify-between border-b border-zinc-100 pb-3 mb-4">
                    <h2 className="text-base font-bold text-zinc-800 flex items-center gap-1.5">
                      <FolderKanban size={16} className="text-indigo-600" />
                      Create Custom Project Context
                    </h2>
                    <button
                      onClick={() => setIsNewProjectModalOpen(false)}
                      className="p-1 border border-zinc-200 hover:bg-zinc-50 rounded-lg text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer"
                    >
                      <X size={15} />
                    </button>
                  </div>

                  <form onSubmit={handleCreateProject} className="space-y-4">
                    <div>
                      <label className="text-[11px] font-bold text-zinc-500 block mb-1">Project Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g., Marketing Copywriter"
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-xl text-xs outline-none focus:border-indigo-500 bg-zinc-50/50 text-zinc-850"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-zinc-500 block mb-1">Short Description</label>
                      <input
                        type="text"
                        placeholder="e.g., Summer campaign launch email copy"
                        value={newProjectDesc}
                        onChange={(e) => setNewProjectDesc(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-xl text-xs outline-none focus:border-indigo-500 bg-zinc-50/50 text-zinc-850"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-zinc-500 block mb-1">
                        System Instructions Override *
                      </label>
                      <textarea
                        required
                        rows={5}
                        placeholder="e.g., You are Worldilm's head copywriter. Maintain an exciting, persuasive voice. Focus on benefits over features."
                        value={newProjectSys}
                        onChange={(e) => setNewProjectSys(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-xl text-xs outline-none focus:border-indigo-500 bg-zinc-50/50 resize-none font-sans text-zinc-850"
                      />
                    </div>
                    <div className="flex gap-2.5 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsNewProjectModalOpen(false)}
                        className="flex-1 py-2 border border-zinc-200 hover:bg-zinc-50 text-zinc-600 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md hover:shadow-lg transition-all cursor-pointer"
                      >
                        Create Workspace
                      </button>
                    </div>
                  </form>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Projects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map((proj) => {
              const isActive = proj.id === activeProjectId;
              return (
                <div
                  key={proj.id}
                  onClick={() => handleSelectProject(proj.id)}
                  className={`border rounded-2xl overflow-hidden shadow-sm bg-white hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group relative ${
                    isActive ? "border-indigo-500 ring-2 ring-indigo-100" : "border-zinc-200/85 hover:border-zinc-300"
                  }`}
                >
                  {/* Color Banner */}
                  <div className={`bg-gradient-to-r ${proj.color} h-2 w-full`} />

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-zinc-400 font-mono tracking-wider">
                          PROJECT ENVIRONMENT
                        </span>
                        
                        <div className="flex gap-1 items-center">
                          <button
                            onClick={(e) => handleDeleteProject(proj.id, e)}
                            className="p-1 border border-transparent rounded hover:border-zinc-100 hover:bg-zinc-50 text-zinc-400 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                            title="Delete project workspace"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>

                      <h3 className="text-base font-bold text-zinc-800">{proj.name}</h3>
                      <p className="text-xs text-zinc-400 font-medium mt-1 mb-3 line-clamp-2">
                        {proj.description}
                      </p>

                      <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-3 mb-4">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                          System Instructions Override:
                        </span>
                        <p className="text-xs text-zinc-600/90 font-medium font-mono line-clamp-3 leading-relaxed">
                          {proj.systemPrompt}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-zinc-100 pt-3.5 mt-2 select-none">
                      <span className="text-[10px] text-zinc-400 font-extrabold bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded-full uppercase">
                        {proj.chatsCount} Chats
                      </span>

                      <button
                        className={`text-xs font-extrabold px-3.5 py-1.5 rounded-xl border transition-all flex items-center gap-1 ${
                          isActive
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                            : "bg-white text-zinc-600 border-zinc-200 group-hover:border-zinc-300 group-hover:bg-zinc-50"
                        }`}
                      >
                        {isActive ? (
                          <>
                            <Check size={12} strokeWidth={3} />
                            <span>Active Context</span>
                          </>
                        ) : (
                          <span>Activate Context</span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // --- AI Presentation Slides Studio View ---
  const renderSlidesView = () => {
    return (
      <SlidesStudio
        onBackToChat={() => setActiveTab("chat")}
        onSelectAndContinue={(slide: SlideSample, details?: PresentationDetails) => {
          let promptText = `Generate a professional presentation deck based on the "${slide.title}" layout template (${slide.slidesCount} slides, category "${slide.category}").`;
          if (details) {
            promptText += `\n\nPRESENTATION SPECIFICATIONS & DETAILS:`;
            promptText += `\n- Presentation Topic: ${details.topicName}`;
            promptText += `\n- Author / Presenter: ${details.authorName}${details.authorRole ? ` (${details.authorRole})` : ''}${details.authorOrg ? `, ${details.authorOrg}` : ''}`;
            if (details.subtopics && details.subtopics.length > 0) {
              promptText += `\n- Key Subtopics / Agenda Section:\n  * ` + details.subtopics.filter(s => s.trim()).join('\n  * ');
            }
            if (details.additionalDetails && details.additionalDetails.length > 0) {
              const validExtras = details.additionalDetails.filter(d => d.label.trim() && d.value.trim());
              if (validExtras.length > 0) {
                promptText += `\n- Custom Specifications & Additional Requirements:`;
                validExtras.forEach(d => {
                  promptText += `\n  * ${d.label}: ${d.value}`;
                });
              }
            }
          } else {
            promptText += ` Focus breakdown: ${slide.description}. ${slide.samplePrompt}`;
          }
          handleSendMessage(promptText);
          setActiveTab("chat");
          showToast(`Generating presentation for: ${details?.topicName || slide.title}`);
        }}
      />
    );
  };

  // --- AI Document & PDF Studio View ---
  const renderDocumentsView = () => {
    return (
      <DocumentsStudio
        onBackToChat={() => setActiveTab("chat")}
        onSelectAndContinue={(tmpl, details) => {
          let promptText = `Generate an executive A4 document based on "${tmpl.title}" layout template (${tmpl.pagesCount} pages, category "${tmpl.category}").`;
          if (details) {
            promptText += `\n\nDOCUMENT SPECIFICATIONS & OUTLINE:`;
            promptText += `\n- Topic Name: ${details.topicName}`;
            promptText += `\n- Author: ${details.authorName}${details.authorRole ? ` (${details.authorRole})` : ''}${details.authorOrg ? `, ${details.authorOrg}` : ''}`;
            if (details.subtopics && details.subtopics.length > 0) {
              promptText += `\n- Section Outline:\n  * ` + details.subtopics.filter(s => s.trim()).join('\n  * ');
            }
          }
          handleSendMessage(promptText);
          setActiveTab("chat");
          showToast(`Generating document for: ${details?.topicName || tmpl.title}`);
        }}
      />
    );
  };

  // --- Apps & Tools Extended Extensions Hub View ---
  const renderAppsView = () => {
    return (
      <div className="flex-1 flex flex-col h-full bg-zinc-50/50 p-6 overflow-y-auto">
        <div className="max-w-6xl w-full mx-auto space-y-6">
          {/* Header */}
          <div className="border-b border-zinc-200 pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <button
                onClick={() => setActiveTab("chat")}
                className="w-10 h-10 rounded-full border border-zinc-200 bg-white hover:bg-zinc-50 hover:scale-105 active:scale-95 text-zinc-600 hover:text-indigo-600 transition-all cursor-pointer flex items-center justify-center shadow-xs shrink-0 mt-0.5"
                title="Back to Chat"
              >
                <ArrowLeft size={18} className="stroke-[2.5]" />
              </button>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
                  <LayoutGrid className="text-indigo-600 w-6 h-6" />
                  AI Tools & Application Hub
                </h1>
                <p className="text-sm text-zinc-500 mt-1">
                  Supercharge your creative workflow with specialized tools and custom extensions seamlessly built into the workspace.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* 1. Image Creator Card */}
            <div className="bg-white border border-zinc-200/90 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
              <div>
                {/* Decorative Cover */}
                <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 h-28 w-full flex items-center justify-center relative select-none">
                  <div className="absolute inset-0 bg-black/15 group-hover:bg-black/5 transition-all" />
                  <ImageIcon size={44} className="text-white/95 animate-pulse" />
                  <span className="absolute bottom-2.5 right-2.5 text-[9px] font-black text-emerald-400 bg-zinc-950/70 backdrop-blur-md border border-emerald-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    PRO UNLOCKED
                  </span>
                </div>

                <div className="p-5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">
                      GRAPHIC ENGINE
                    </span>
                    <span className="text-[9px] font-black text-white bg-indigo-600 px-1.5 py-0.5 rounded-full uppercase">
                      READY
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-zinc-800">
                    Hugging Face Image Creator
                  </h3>
                  <p className="text-xs text-zinc-400 font-semibold leading-relaxed">
                    Generate spectacular, high-fidelity artwork, photorealistic product concepts, wallpapers, and banners directly inside your chat stream. Supports five aspect ratios.
                  </p>
                  
                  <div className="space-y-1 pt-1.5">
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-bold">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      Multi-aspect ratio outputs (1:1, 16:9, etc.)
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-bold">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      One-click rapid image regeneration
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-bold">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      Lossless high-quality PNG downloads
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 border-t border-zinc-100 select-none">
                <button
                  onClick={() => {
                    setCurTier("image");
                    setActiveTab("chat");
                    createNewChat();
                    showToast("🎨 Hugging Face Image Creator Activated! Define your creative prompt below.");
                  }}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Sparkles size={13} />
                  Choose Tool
                </button>
              </div>
            </div>

            {/* 2. Handwritten to Plain Text Card */}
            <div className="bg-white border border-zinc-200/90 rounded-2xl shadow-sm flex flex-col justify-between group opacity-85 hover:opacity-100 transition-all">
              <div>
                {/* Decorative Cover */}
                <div className="bg-gradient-to-br from-rose-500 via-red-500 to-orange-500 h-28 w-full flex items-center justify-center relative select-none">
                  <div className="absolute inset-0 bg-black/15" />
                  <FileText size={44} className="text-white/95" />
                  <span className="absolute bottom-2.5 right-2.5 text-[9px] font-black text-rose-300 bg-zinc-950/70 backdrop-blur-md border border-rose-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    UPCOMING
                  </span>
                </div>

                <div className="p-5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">
                      OCR UTILITY
                    </span>
                    <span className="text-[9px] font-black text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-full uppercase">
                      SOON
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-zinc-800">
                    Handwritten to Plain Text
                  </h3>
                  <p className="text-xs text-zinc-400 font-semibold leading-relaxed">
                    Instantly scan, extract, and convert physical handwritten drafts, post-it notes, and class whiteboards into elegant, structured markdown text with deep AI vision layout parsing.
                  </p>
                  
                  <div className="space-y-1 pt-1.5">
                    <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-bold">
                      <div className="w-1.5 h-1.5 rounded-full bg-zinc-350" />
                      Messy handwriting recognition alignment
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-bold">
                      <div className="w-1.5 h-1.5 rounded-full bg-zinc-350" />
                      Dynamic structured table conversion
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 border-t border-zinc-100 select-none">
                <button
                  disabled
                  className="w-full py-2 bg-zinc-100 border border-zinc-200 text-zinc-400 rounded-xl text-xs font-bold transition-all cursor-not-allowed flex items-center justify-center gap-1.5"
                >
                  <Lock size={12} />
                  Coming Soon
                </button>
              </div>
            </div>

            {/* 3. Real-time Document Analysis Card */}
            <div className="bg-white border border-zinc-200/90 rounded-2xl shadow-sm flex flex-col justify-between group opacity-75">
              <div>
                {/* Decorative Cover */}
                <div className="bg-gradient-to-br from-indigo-900 via-slate-800 to-zinc-900 h-28 w-full flex items-center justify-center relative select-none">
                  <div className="absolute inset-0 bg-black/10" />
                  <Sparkles size={44} className="text-white/95" />
                  <span className="absolute bottom-2.5 right-2.5 text-[9px] font-black text-zinc-400 bg-zinc-950/70 backdrop-blur-md border border-zinc-700 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    PIPELINE
                  </span>
                </div>

                <div className="p-5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                      DATA INSIGHTS
                    </span>
                    <span className="text-[9px] font-black text-zinc-500 bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded-full uppercase">
                      LATER
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-zinc-800">
                    Real-time Data Analyzer
                  </h3>
                  <p className="text-xs text-zinc-400 font-semibold leading-relaxed">
                    Upload huge CSV datasets, spreadsheets, or financial sheets to automatically produce professional trend reports, statistical charting, and scatter graphs with a simple click.
                  </p>
                </div>
              </div>

              <div className="p-5 border-t border-zinc-100 select-none">
                <button
                  disabled
                  className="w-full py-2 bg-zinc-100 border border-zinc-200 text-zinc-400 rounded-xl text-xs font-bold transition-all cursor-not-allowed flex items-center justify-center gap-1.5"
                >
                  <Lock size={12} />
                  Coming Soon
                </button>
              </div>
            </div>

            {/* 4. A4 Document Creator & PDF Compiler */}
            <div className="bg-white border border-indigo-200 ring-2 ring-indigo-50/50 rounded-2xl shadow-md hover:shadow-lg transition-all flex flex-col justify-between group">
              <div>
                {/* Decorative Cover */}
                <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 h-28 w-full flex items-center justify-center relative select-none">
                  <div className="absolute inset-0 bg-black/15 group-hover:bg-black/5 transition-all" />
                  <FileText size={44} className="text-white/95 animate-pulse" />
                  <span className="absolute bottom-2.5 right-2.5 text-[9px] font-black text-emerald-400 bg-zinc-950/70 backdrop-blur-md border border-emerald-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                    LIVE UNLOCKED
                  </span>
                </div>

                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">
                      DOCUMENT ENGINE
                    </span>
                    <span className="text-[9px] font-black text-white bg-indigo-600 px-1.5 py-0.5 rounded-full uppercase">
                      ACTIVE
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-zinc-800">
                    A4 Document Creator & PDF Compiler
                  </h3>
                  <p className="text-xs text-zinc-400 font-semibold leading-relaxed">
                    Create and compile pristine A4 documents, source code notebooks, and official reports featuring elegant twin colorful borders and PDF-exact dimensions.
                  </p>

                  <div className="space-y-3 pt-2">
                    {/* Template Selection */}
                    <div>
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider block mb-1">
                        Select Template Canvas
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => {
                            triggerDocCompilation(DOCUMENT_TEMPLATES.networking);
                            setActiveTab("chat");
                          }}
                          className="p-2 border border-zinc-200 hover:border-indigo-400 bg-zinc-50/50 hover:bg-indigo-50/30 rounded-xl text-left transition-all cursor-pointer"
                        >
                          <span className="text-[10px] font-black text-zinc-700 block">Networking</span>
                          <span className="text-[9px] text-zinc-400 font-semibold block mt-0.5">2 Pages · Twin Border</span>
                        </button>
                        <button
                          onClick={() => {
                            triggerDocCompilation(DOCUMENT_TEMPLATES.portfolio);
                            setActiveTab("chat");
                          }}
                          className="p-2 border border-zinc-200 hover:border-indigo-400 bg-zinc-50/50 hover:bg-indigo-50/30 rounded-xl text-left transition-all cursor-pointer"
                        >
                          <span className="text-[10px] font-black text-zinc-700 block">Code Portfolio</span>
                          <span className="text-[9px] text-zinc-400 font-semibold block mt-0.5">1 Page · Syntax Editor</span>
                        </button>
                        <button
                          onClick={() => {
                            triggerDocCompilation(DOCUMENT_TEMPLATES.ai_essay);
                            setActiveTab("chat");
                          }}
                          className="p-2 border border-zinc-200 hover:border-indigo-400 bg-zinc-50/50 hover:bg-indigo-50/30 rounded-xl text-left transition-all cursor-pointer col-span-2"
                        >
                          <span className="text-[10px] font-black text-zinc-700 block">AI Reasoning Essay</span>
                          <span className="text-[9px] text-zinc-400 font-semibold block mt-0.5">1 Page · Slate Border</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 border-t border-zinc-100 select-none">
                <button
                  onClick={() => {
                    triggerDocCompilation(DOCUMENT_TEMPLATES.networking);
                    setActiveTab("chat");
                  }}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <FileText size={13} />
                  Compile Default Template
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  };

  // --- Style Customizer View ---
  const renderStyleCustomizerView = () => {
    return (
      <div className="flex-1 flex flex-col h-full bg-[#fbfbfa] dark:bg-zinc-950 p-6 sm:p-8 md:p-12 select-none overflow-y-auto">
        <div className="max-w-3xl mx-auto w-full space-y-8 animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between pb-6 border-b border-zinc-200/50 dark:border-zinc-800/40">
            <div>
              <h2 className="text-2xl font-serif font-normal text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
                <Palette size={24} className="text-indigo-500" />
                Workspace Customizer
              </h2>
              <p className="text-xs text-zinc-400 font-semibold mt-1">
                Personalize your reading experience, typography, and viewport layout.
              </p>
            </div>
            <button
              onClick={() => {
                setIsStyleCustomizerOpen(false);
                setActiveTab("chat");
              }}
              className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200/70 dark:bg-zinc-900 dark:hover:bg-zinc-850 text-xs font-semibold text-zinc-650 dark:text-zinc-350 border border-zinc-200/40 dark:border-zinc-800 rounded-xl transition-all cursor-pointer"
            >
              Back to Chat
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            {/* Left Column: Settings */}
            <div className="md:col-span-7 space-y-6">
              {/* 1. Typography Font Family */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 rounded-2xl p-5 shadow-3xs space-y-3">
                <label className="text-[11px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">
                  Typography Font Family
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "sans", name: "Inter (Sans)", desc: "Modern & Clean" },
                    { id: "serif", name: "Playfair (Serif)", desc: "Elegant Editorial" },
                    { id: "mono", name: "Fira (Mono)", desc: "Tech Developer" },
                  ].map((font) => (
                    <button
                      key={font.id}
                      onClick={() => {
                        setChatFontFamily(font.id);
                        showToast(`Typography set to ${font.name}`);
                      }}
                      className={`p-3 border rounded-xl text-left transition-all cursor-pointer flex flex-col gap-1.5 ${
                        chatFontFamily === font.id
                          ? "border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/20"
                          : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-transparent"
                      }`}
                    >
                      <span className={`text-xs font-bold text-zinc-800 dark:text-zinc-200 ${
                        font.id === "sans" ? "font-sans" : font.id === "serif" ? "font-serif" : "font-mono"
                      }`}>
                        {font.name}
                      </span>
                      <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-semibold leading-none">
                        {font.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Text Sizing */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 rounded-2xl p-5 shadow-3xs space-y-3">
                <label className="text-[11px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">
                  Text Scale
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: "small", name: "Small", sub: "13px" },
                    { id: "medium", name: "Medium", sub: "15px" },
                    { id: "large", name: "Large", sub: "17px" },
                    { id: "xlarge", name: "Extra", sub: "19px" },
                  ].map((sz) => (
                    <button
                      key={sz.id}
                      onClick={() => {
                        setChatFontSize(sz.id);
                        showToast(`Text size set to ${sz.name}`);
                      }}
                      className={`p-2.5 border rounded-xl text-center transition-all cursor-pointer ${
                        chatFontSize === sz.id
                          ? "border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/20"
                          : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-transparent"
                      }`}
                    >
                      <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block">
                        {sz.name}
                      </span>
                      <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-semibold block mt-0.5 leading-none">
                        {sz.sub}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Reading Width Limit */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 rounded-2xl p-5 shadow-3xs space-y-3">
                <label className="text-[11px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">
                  Reading Max-Width
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "normal", name: "Standard", desc: "Centered (768px)" },
                    { id: "wide", name: "Comfortable", desc: "Extended (1024px)" },
                    { id: "full", name: "Full Screen", desc: "No Limit (100%)" },
                  ].map((w) => (
                    <button
                      key={w.id}
                      onClick={() => {
                        setChatWidth(w.id);
                        showToast(`Chat width set to ${w.name}`);
                      }}
                      className={`p-3 border rounded-xl text-left transition-all cursor-pointer flex flex-col gap-1.5 ${
                        chatWidth === w.id
                          ? "border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/20"
                          : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-transparent"
                      }`}
                    >
                      <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                        {w.name}
                      </span>
                      <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-semibold leading-none">
                        {w.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Live Interactive Preview */}
            <div className="md:col-span-5 space-y-4">
              <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                Live Preview
              </span>

              <div className="bg-[#f3f2ef] dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 rounded-2xl p-5 shadow-inner min-h-[220px] flex flex-col justify-between">
                <div className="space-y-3">
                  {/* User mock query */}
                  <div className="flex justify-end">
                    <div className="bg-zinc-205 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-250 rounded-2xl rounded-tr-none px-3.5 py-2 text-xs font-medium max-w-[85%] select-text">
                      How's the weather on Kepler-452b?
                    </div>
                  </div>

                  {/* Assistant mock reply */}
                  <div className="flex gap-2.5 items-start">
                    <div className="w-6 h-6 rounded-lg bg-white border border-zinc-200 flex items-center justify-center shrink-0 shadow-xs">
                      <Logo size={14} />
                    </div>
                    <div className={`bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 rounded-2xl rounded-tl-none px-4 py-3 select-text border border-zinc-200/45 dark:border-zinc-850/50 shadow-3xs max-w-[90%]
                      ${chatFontFamily === "sans" ? "font-sans" : chatFontFamily === "serif" ? "font-serif" : "font-mono"}
                      ${
                        chatFontSize === "small"
                          ? "text-xs"
                          : chatFontSize === "large"
                          ? "text-[16px]"
                          : chatFontSize === "xlarge"
                          ? "text-[18px]"
                          : "text-[14px]"
                      }
                    `}>
                      Kepler-452b, located 1,400 light-years away, orbits a G2-class star similar to our Sun. 
                      <p className="mt-2 text-zinc-400 dark:text-zinc-500 text-[10px] font-mono leading-none">
                        Rendered in {chatFontFamily === "sans" ? "Inter" : chatFontFamily === "serif" ? "Playfair" : "Fira Mono"} @ {chatFontSize}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-200/50 dark:border-zinc-800/50 flex justify-between items-center text-[10px] text-zinc-400 font-semibold select-none">
                  <span>Layout width: {chatWidth}</span>
                  <span className="text-indigo-600">Active Preset</span>
                </div>
              </div>

              {/* Direct reset button */}
              <button
                onClick={() => {
                  setChatFontFamily("sans");
                  setChatFontSize("medium");
                  setChatWidth("normal");
                  showToast("Settings reset to defaults");
                }}
                className="w-full py-2 bg-zinc-200/50 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-850 text-zinc-600 dark:text-zinc-400 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Reset Default Typography
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // --- Search Filtering ---
  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Left out the blocking loading page for ultra-rapid startup
  
  
  

  return (
    <div className="flex h-[100dvh] w-screen overflow-hidden bg-white dark:bg-zinc-950 text-zinc-900 select-none font-sans">
      
      {/* --- CLOSED SIDEBAR (LEFT RAIL) FOR DESKTOP --- */}
      {!isSidebarOpen && (
        <aside className="hidden lg:flex flex-col items-center justify-between w-[56px] bg-zinc-50/90 dark:bg-zinc-950 border-r border-zinc-200/85 dark:border-zinc-900 h-full py-4 select-none shrink-0 transition-all duration-200 ease-in-out z-40">
          {/* Top Section */}
          <div className="flex flex-col items-center gap-[14px] w-full">
            {/* Toggle Sidebar Button - Open option in a vertical side bar line top */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-zinc-200/45 text-zinc-500 hover:text-zinc-800 dark:hover:bg-zinc-800/40 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors cursor-pointer group relative"
              title="Expand sidebar"
            >
              <PanelLeft size={19} strokeWidth={1.5} />
            </button>

            {/* New Chat */}
            <button
              onClick={() => {
                createNewChat();
                showToast("New chat created");
              }}
              className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-zinc-200/45 text-zinc-500 hover:text-zinc-800 dark:hover:bg-zinc-800/40 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors cursor-pointer"
              title="New chat"
            >
              <Plus size={19} strokeWidth={1.5} />
            </button>

            {/* Chat History & Search on-screen button */}
            <button
              onClick={() => setIsHistorySearchDialogOpen((prev) => !prev)}
              className={`w-9 h-9 flex items-center justify-center rounded-xl transition-colors cursor-pointer ${
                isHistorySearchDialogOpen
                  ? "bg-zinc-200/50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 font-semibold"
                  : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-200/45 dark:hover:bg-zinc-800/40"
              }`}
              title="Chat History & Search"
            >
              <Search size={19} strokeWidth={1.5} />
            </button>

            {/* Library / Artifacts */}
            <button
              onClick={() => {
                setActiveTab("library");
                setIsStyleCustomizerOpen(false);
              }}
              className={`w-9 h-9 flex items-center justify-center rounded-xl transition-colors cursor-pointer ${
                activeTab === "library" && !isStyleCustomizerOpen
                  ? "bg-zinc-200/50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 font-semibold"
                  : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-200/45 dark:hover:bg-zinc-800/40"
              }`}
              title="Artifacts"
            >
              <Library size={19} strokeWidth={1.5} />
            </button>

            {/* Projects / Workspace */}
            <button
              onClick={() => {
                setActiveTab("projects");
                setIsStyleCustomizerOpen(false);
              }}
              className={`w-9 h-9 flex items-center justify-center rounded-xl transition-colors cursor-pointer ${
                activeTab === "projects" && !isStyleCustomizerOpen
                  ? "bg-zinc-200/50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 font-semibold"
                  : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-200/45 dark:hover:bg-zinc-800/40"
              }`}
              title="Workspace Projects"
            >
              <Workflow size={19} strokeWidth={1.5} />
            </button>

            {/* Code Workspace */}
            <button
              onClick={() => {
                setIsPlansPageOpen(true);
                setIsStyleCustomizerOpen(false);
              }}
              className={`w-9 h-9 flex items-center justify-center rounded-xl transition-colors cursor-pointer ${
                isPlansPageOpen
                  ? "bg-zinc-200/50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 font-semibold"
                  : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-200/45 dark:hover:bg-zinc-800/40"
              }`}
              title="Interactive Code Editor (Upgrade Plan)"
            >
              <Code size={19} strokeWidth={1.5} />
            </button>

            {/* Slides Presentation */}
            <button
              onClick={() => {
                setActiveTab("slides");
                setIsStyleCustomizerOpen(false);
              }}
              className={`w-9 h-9 flex items-center justify-center rounded-xl transition-colors cursor-pointer ${
                activeTab === "slides" && !isStyleCustomizerOpen
                  ? "bg-amber-100/70 dark:bg-amber-950/70 text-amber-600 dark:text-amber-300 font-semibold"
                  : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-200/45 dark:hover:bg-zinc-800/40"
              }`}
              title="Slides Studio"
            >
              <Presentation size={19} strokeWidth={1.5} />
            </button>

            {/* Documents Hub */}
            <button
              onClick={() => {
                setActiveTab("document");
                setIsStyleCustomizerOpen(false);
              }}
              className={`w-9 h-9 flex items-center justify-center rounded-xl transition-colors cursor-pointer ${
                activeTab === "document" && !isStyleCustomizerOpen
                  ? "bg-emerald-100/70 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-300 font-semibold"
                  : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-200/45 dark:hover:bg-zinc-800/40"
              }`}
              title="Documents & PDF Hub"
            >
              <FileText size={19} strokeWidth={1.5} />
            </button>
          </div>

          {/* Bottom Section */}
          <div className="flex flex-col items-center w-full gap-[14px]">
            {/* Theme Customizer */}
            <button
              onClick={() => {
                setIsStyleCustomizerOpen((prev) => !prev);
              }}
              className={`w-9 h-9 flex items-center justify-center rounded-xl transition-colors cursor-pointer ${
                isStyleCustomizerOpen
                  ? "bg-zinc-200/50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 font-semibold"
                  : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-200/45 dark:hover:bg-zinc-800/40"
              }`}
              title="Theme Customizer"
            >
              <Palette size={19} strokeWidth={1.5} />
            </button>

            {/* Download App */}
            <button
              onClick={triggerPWAInstall}
              className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-zinc-200/45 text-zinc-500 hover:text-zinc-800 dark:hover:bg-zinc-800/40 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors cursor-pointer relative"
              title="Download PWA App"
            >
              <Download size={19} strokeWidth={1.5} />
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-[#fbfbfa] dark:border-zinc-950 animate-pulse" />
            </button>

            {/* Profile Avatar / Login */}
            {currentUser ? (
              currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName || "User"}
                  className="w-8 h-8 rounded-full border border-zinc-200/80 hover:scale-105 transition-all cursor-pointer shadow-xs select-none"
                  referrerPolicy="no-referrer"
                  title={`Signed in as ${currentUser.displayName}`}
                  onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                />
              ) : (
                <div
                  onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                  className="w-8 h-8 rounded-full bg-zinc-950 text-white flex items-center justify-center text-xs font-semibold tracking-wide hover:scale-105 transition-all cursor-pointer shadow-xs select-none hover:bg-zinc-800"
                  title={`Signed in as ${currentUser.displayName}`}
                >
                  {(currentUser.displayName || currentUser.email || "GU").substring(0, 2).toUpperCase()}
                </div>
              )
            ) : (
              <button
                onClick={handleSignIn}
                className="w-8 h-8 rounded-full bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 flex items-center justify-center text-[10px] font-bold tracking-wide hover:scale-105 transition-all cursor-pointer shadow-xs select-none border border-zinc-850"
                title="Sign In / Login"
              >
                In
              </button>
            )}
          </div>
        </aside>
      )}

      {/* --- MOBILE/TABLET SIDEBAR DRAWER OVERLAY --- */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.35 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black z-50 lg:hidden block"
          />
        )}
      </AnimatePresence>

      {/* --- SIDEBAR --- */}
      <aside
        className={`fixed inset-y-0 left-0 lg:static z-50 w-[260px] bg-[#fbfbfa] dark:bg-zinc-950 border-r border-zinc-200/50 dark:border-zinc-850 flex flex-col h-full transform transition-all duration-220 ease-out shrink-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:hidden"
        }`}
      >
        {/* Top bar logo & actions */}
        <div className="flex items-center justify-between px-3.5 pt-4 pb-2">
          <div className="flex items-center gap-2 select-none">
            <Logo size={22} />
            <span className="font-semibold text-[18px] tracking-tight text-zinc-800 dark:text-zinc-200 font-sans">Worldilm AI</span>
          </div>
          
          <div className="flex items-center gap-1.5">
            {/* Search Toggle */}
            <button
              onClick={() => setIsSearchOpen((prev) => !prev)}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-200/40 dark:hover:bg-zinc-850 transition-colors text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
              title="Search chats"
            >
              <Search size={16} strokeWidth={1.8} />
            </button>

            {/* Collapse Sidebar (PanelLeft icon!) */}
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-200/40 dark:hover:bg-zinc-850 transition-colors text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
              title="Collapse sidebar"
            >
              <PanelLeft size={17} strokeWidth={1.8} />
            </button>
          </div>
        </div>

        {/* Search bar inside sidebar */}
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-3 pb-2 overflow-hidden"
            >
              <input
                type="text"
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-1.5 border border-zinc-200/60 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-xs outline-none focus:border-zinc-300 dark:focus:border-zinc-750 font-medium text-zinc-800 dark:text-zinc-250 placeholder-zinc-400 shadow-3xs"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* New Chat Button */}
        <div className="px-3.5 py-1.5">
          <button
            onClick={() => {
              createNewChat();
              showToast("New chat created");
              if (window.innerWidth < 1024) setIsSidebarOpen(false);
            }}
            className="w-full flex items-center justify-between px-3.5 py-2 border border-zinc-200/60 dark:border-zinc-800 rounded-xl text-[13px] font-medium bg-[#f3f2ef]/45 dark:bg-zinc-900 hover:bg-[#e8e7e3]/60 dark:hover:bg-zinc-850/80 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer shadow-3xs"
          >
            <div className="flex items-center gap-2 font-semibold">
              <Plus size={15} strokeWidth={2.2} className="text-zinc-800 dark:text-zinc-200" />
              New chat
            </div>
          </button>
        </div>

        {/* Sidebar Nav */}
        <nav className="px-2.5 py-1 flex flex-col gap-0.5">
          {/* Chats */}
          <button
            onClick={() => {
              setActiveTab("chat");
              setIsStyleCustomizerOpen(false);
              if (window.innerWidth < 1024) setIsSidebarOpen(false);
            }}
            className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-[13px] transition-all text-left cursor-pointer ${
              activeTab === "chat" && !isStyleCustomizerOpen
                ? "bg-zinc-200/50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 font-semibold"
                : "hover:bg-zinc-200/30 dark:hover:bg-zinc-900/40 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            <MessageSquare size={16} strokeWidth={1.5} className="text-zinc-500 shrink-0" />
            Chats
          </button>

          {/* Projects */}
          <button
            onClick={() => {
              setActiveTab("projects");
              setIsStyleCustomizerOpen(false);
              if (window.innerWidth < 1024) setIsSidebarOpen(false);
            }}
            className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-[13px] transition-all text-left cursor-pointer ${
              activeTab === "projects" && !isStyleCustomizerOpen
                ? "bg-zinc-200/50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 font-semibold"
                : "hover:bg-zinc-200/30 dark:hover:bg-zinc-900/40 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            <FolderKanban size={16} strokeWidth={1.5} className="text-zinc-500 shrink-0" />
            Projects
          </button>

          {/* Artifacts */}
          <button
            onClick={() => {
              setActiveTab("library");
              setIsStyleCustomizerOpen(false);
              if (window.innerWidth < 1024) setIsSidebarOpen(false);
            }}
            className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-[13px] transition-all text-left cursor-pointer ${
              activeTab === "library" && !isStyleCustomizerOpen
                ? "bg-zinc-200/50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 font-semibold"
                : "hover:bg-zinc-200/30 dark:hover:bg-zinc-900/40 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            <Library size={16} strokeWidth={1.5} className="text-zinc-500 shrink-0" />
            Artifacts
          </button>

          {/* Code (with Upgrade pill!) */}
          <button
            onClick={() => {
              setIsPlansPageOpen(true);
              setIsStyleCustomizerOpen(false);
              if (window.innerWidth < 1024) setIsSidebarOpen(false);
            }}
            className={`flex items-center justify-between px-3 py-1.5 rounded-xl text-[13px] transition-all text-left cursor-pointer ${
              isPlansPageOpen
                ? "bg-zinc-200/50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 font-semibold"
                : "hover:bg-zinc-200/30 dark:hover:bg-zinc-900/40 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Code size={16} strokeWidth={1.5} className="text-zinc-500 shrink-0" />
              Code
            </div>
            <span className="text-[9px] font-medium text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100/60 dark:border-indigo-900 px-1.5 py-0.5 rounded-md">
              Upgrade
            </span>
          </button>

          {/* Slides */}
          <button
            onClick={() => {
              setActiveTab("slides");
              setIsStyleCustomizerOpen(false);
              if (window.innerWidth < 1024) setIsSidebarOpen(false);
            }}
            className={`flex items-center justify-between px-3 py-1.5 rounded-xl text-[13px] transition-all text-left cursor-pointer ${
              activeTab === "slides" && !isStyleCustomizerOpen
                ? "bg-amber-100/60 dark:bg-amber-950/50 text-amber-900 dark:text-amber-100 font-semibold"
                : "hover:bg-zinc-200/30 dark:hover:bg-zinc-900/40 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Presentation size={16} strokeWidth={1.5} className="text-amber-500 shrink-0" />
              Slides
            </div>
            <span className="text-[9px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-amber-200/60 dark:border-amber-900 px-1.5 py-0.5 rounded-md">
              Deck
            </span>
          </button>

          {/* Documents */}
          <button
            onClick={() => {
              setActiveTab("document");
              setIsStyleCustomizerOpen(false);
              if (window.innerWidth < 1024) setIsSidebarOpen(false);
            }}
            className={`flex items-center justify-between px-3 py-1.5 rounded-xl text-[13px] transition-all text-left cursor-pointer ${
              activeTab === "document" && !isStyleCustomizerOpen
                ? "bg-emerald-100/60 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-100 font-semibold"
                : "hover:bg-zinc-200/30 dark:hover:bg-zinc-900/40 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <FileText size={16} strokeWidth={1.5} className="text-emerald-500 shrink-0" />
              Documents
            </div>
            <span className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-900 px-1.5 py-0.5 rounded-md">
              PDF
            </span>
          </button>

          {/* Customize */}
          <button
            onClick={() => {
              setIsStyleCustomizerOpen((prev) => !prev);
              if (window.innerWidth < 1024) setIsSidebarOpen(false);
            }}
            className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-[13px] transition-all text-left cursor-pointer ${
              isStyleCustomizerOpen
                ? "bg-zinc-200/50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 font-semibold"
                : "hover:bg-zinc-200/30 dark:hover:bg-zinc-900/40 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            <Palette size={16} strokeWidth={1.5} className="text-zinc-500 shrink-0" />
            Customize
          </button>
        </nav>

        {/* Products Header & Options */}
        <div className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 tracking-wider px-5 mt-4 mb-1 select-none">
          Products
        </div>
        <nav className="px-2.5 flex flex-col">
          {/* Design Item */}
          <button
            onClick={() => {
              setIsStyleCustomizerOpen(true);
              showToast("Theme design customized");
            }}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-[13px] hover:bg-zinc-200/30 dark:hover:bg-zinc-900/40 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 text-left cursor-pointer transition-all"
          >
            <Sparkles size={16} strokeWidth={1.5} className="text-zinc-500 shrink-0" />
            Design
          </button>
        </nav>

        {/* Recents Section */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between px-5 mt-4 mb-1 select-none">
            <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 tracking-wider uppercase">
              Recents
            </span>
            <button
              onClick={() => setIsSearchOpen((prev) => !prev)}
              className="p-0.5 rounded hover:bg-zinc-200/50 dark:hover:bg-zinc-850 text-zinc-400 dark:text-zinc-500 hover:text-zinc-650 dark:hover:text-zinc-300 cursor-pointer"
              title="Filter/Search"
            >
              <Sliders size={12} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-2 space-y-0.5 pb-4 custom-scrollbar">
            {filteredSessions.length === 0 ? (
              <div className="py-8 px-4 text-center select-none text-zinc-400 dark:text-zinc-500">
                <MessageSquare size={20} className="mx-auto opacity-35 mb-2" />
                <p className="text-[11px] font-medium leading-relaxed">
                  No recent chats yet. <br /> Type a prompt to begin.
                </p>
              </div>
            ) : (
              filteredSessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => {
                    handleSelectSession(session);
                    if (window.innerWidth < 1024) setIsSidebarOpen(false);
                  }}
                  className={`group relative flex items-center justify-between px-3 py-1.5 rounded-xl text-[13px] transition-all text-left cursor-pointer ${
                    activeSessionId === session.id
                      ? "bg-zinc-200/60 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100 font-semibold shadow-3xs"
                      : "hover:bg-zinc-200/30 dark:hover:bg-zinc-900/30 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                  }`}
                >
                  <span className="truncate pr-4 flex-1 select-none font-medium">
                    {session.title}
                  </span>

                  {/* Kebab Button (Permanently visible) */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveKebabId((prev) => (prev === session.id ? null : session.id));
                    }}
                    className="w-5.5 h-5.5 opacity-70 hover:opacity-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-700/80 rounded flex items-center justify-center transition-all cursor-pointer text-zinc-600 dark:text-zinc-400 shrink-0 ml-1"
                    title="Chat options"
                  >
                    <MoreHorizontal size={14} />
                  </button>

                  {/* Context Menu Dropdown */}
                  {activeKebabId === session.id && (
                    <div
                      ref={kebabRef}
                      className="absolute right-2 top-8 z-50 w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl p-1 animate-fadeIn select-none"
                    >
                      <button
                        onClick={(e) => handleCopySessionText(session, e)}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 text-left text-xs font-semibold rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors cursor-pointer"
                      >
                        {copiedKebabSessionId === session.id ? (
                          <Check size={12} className="text-emerald-500 scale-125 transition-transform stroke-[2.5]" />
                        ) : (
                          <Copy size={12} />
                        )}
                        {copiedKebabSessionId === session.id ? "Copied!" : "Copy chat text"}
                      </button>
                      <button
                        onClick={(e) => handleDownloadChatHistory(session, e)}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 text-left text-xs font-semibold rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors cursor-pointer"
                      >
                        <Download size={12} />
                        Download chat history
                      </button>
                      <button
                        onClick={(e) => handleDeleteSession(session.id, e)}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 text-left text-xs font-semibold rounded-lg hover:bg-[#fff5f5] dark:hover:bg-[#381a1a] text-rose-600 hover:text-rose-700 dark:text-rose-400 transition-colors cursor-pointer"
                      >
                        <Trash2 size={12} />
                        Delete chat
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sidebar bottom profile & settings dropdown trigger */}
        <div className="relative border-t border-zinc-200/50 dark:border-zinc-800/80 p-3 select-none bg-transparent">
          
          {/* Popover Profile Menu */}
          <AnimatePresence>
            {isProfileMenuOpen && (
              <>
                {/* Overlay to close menu */}
                <div
                  className="fixed inset-0 z-45 cursor-default"
                  onClick={() => setIsProfileMenuOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.12 }}
                  className="absolute bottom-16 left-3 right-3 z-50 bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 rounded-xl shadow-xl p-1.5 select-none flex flex-col gap-1"
                >
                  <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800/80 mb-0.5">
                    <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Account</p>
                    <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate mt-0.5">
                      {currentUser ? (currentUser.email || currentUser.displayName || "raomuneeb468@gmail.com") : "Guest User"}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      setIsPlansPageOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs font-semibold rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 transition-colors cursor-pointer"
                  >
                    <Gift size={15} className="text-[#4f6bf0] shrink-0" />
                    <span>Claim offer / Upgrade</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      triggerPWAInstall();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs font-semibold rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 transition-colors cursor-pointer"
                  >
                    <Smartphone size={15} className="text-indigo-600 shrink-0" />
                    <span>Download Mobile App</span>
                  </button>

                  {currentUser ? (
                    <button
                      onClick={async () => {
                        setIsProfileMenuOpen(false);
                        try {
                          await signOut(auth);
                          setCurrentUser(null);
                          showToast("Signed out successfully! 👋");
                        } catch (e) {
                          console.error(e);
                        }
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs font-semibold rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 hover:text-rose-700 dark:text-rose-400 transition-colors cursor-pointer"
                    >
                      <Lock size={15} className="text-rose-500 shrink-0" />
                      <span>Sign out</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        handleSignIn();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs font-semibold rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-indigo-600 hover:text-indigo-700 transition-colors cursor-pointer"
                    >
                      <Lock size={15} className="text-indigo-500 shrink-0" />
                      <span>Sign in / Login</span>
                    </button>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Profile row resembling Claude's exactly */}
          <div
            onClick={() => setIsProfileMenuOpen((prev) => !prev)}
            className="flex items-center justify-between p-1.5 rounded-xl hover:bg-zinc-200/40 dark:hover:bg-zinc-850 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {currentUser ? (
                currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || "User"}
                    className="w-8 h-8 rounded-full border border-zinc-200/80 shrink-0 object-cover shadow-3xs"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-zinc-950 text-white flex items-center justify-center font-semibold text-[11px] shrink-0 select-none shadow-3xs">
                    {(currentUser.displayName || currentUser.email || "GU").substring(0, 2).toUpperCase()}
                  </div>
                )
              ) : (
                <div className="w-8 h-8 rounded-full bg-zinc-950 text-white flex items-center justify-center font-semibold text-[11px] shrink-0 select-none shadow-3xs">
                  GU
                </div>
              )}
              
              <div className="flex flex-col select-none leading-none min-w-0">
                <span className="text-[12px] font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                  {currentUser ? (currentUser.email || currentUser.displayName || "User") : "Guest"}
                </span>
                {currentUser ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsPlansPageOpen(true);
                      setIsProfileMenuOpen(false);
                    }}
                    className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1 flex items-center gap-1 hover:underline cursor-pointer text-left"
                  >
                    <Sparkles size={10} className="text-emerald-500 shrink-0" />
                    Free Offer Active
                  </button>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsPlansPageOpen(true);
                      setIsProfileMenuOpen(false);
                    }}
                    className="text-[10px] text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 font-medium mt-1 hover:underline cursor-pointer text-left"
                  >
                    Free plan
                  </button>
                )}
              </div>
            </div>

            {/* Right-aligned icon: Download icon triggers PWA app install */}
            {!isStandalone && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  triggerPWAInstall();
                }}
                className="w-7 h-7 flex items-center justify-center hover:bg-zinc-200/60 dark:hover:bg-zinc-700 rounded-lg text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer transition-colors"
                title="Download PWA App"
              >
                <Download size={14} strokeWidth={1.8} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* --- MAIN AREA --- */}
      <main className="flex-1 flex flex-col h-full bg-white dark:bg-zinc-950 relative overflow-x-hidden">
        
        {/* Floating Top Elements (Absolute position so NO header bar takes layout space; chat starts at very top) */}
        {!(activeTab !== "chat" || isStyleCustomizerOpen) && (
          <div className="absolute top-3 left-3 right-3 sm:left-4 sm:right-4 flex items-center justify-between z-20 select-none pointer-events-none">
            {/* Left element: Floating pill background around Logo & WorldILM AI (+ toggle on mobile if collapsed) */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md rounded-full border-0 shadow-none pointer-events-auto">
              {!isSidebarOpen && (
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="lg:hidden p-1 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 rounded-full transition-all cursor-pointer flex items-center justify-center hover:scale-105 active:scale-95"
                  title="Open sidebar"
                >
                  <PanelLeft size={17} strokeWidth={1.8} />
                </button>
              )}
              
              {/* Logo and WorldILM AI title */}
              <div className="flex items-center gap-2 select-none">
                <Logo size={22} />
                <span className="font-semibold text-sm tracking-tight text-zinc-800 dark:text-zinc-200 font-sans">
                  WorldILM AI
                </span>
              </div>
            </div>

            {/* Right element: Floating pill background around Free Offer / Login */}
            <div className="flex items-center gap-2 pointer-events-auto">
              {currentUser ? (
                <button
                  onClick={() => setIsPlansPageOpen(true)}
                  className="flex items-center gap-2 px-3.5 py-1.5 bg-white/70 dark:bg-zinc-950/70 hover:bg-white/85 dark:hover:bg-zinc-900/85 backdrop-blur-md rounded-full border-0 shadow-none select-none cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Gift size={16} className="text-[#4f6bf0] shrink-0" />
                  <span className="text-xs font-extrabold bg-gradient-to-r from-[#4f6bf0] to-[#17c3e6] bg-clip-text text-transparent tracking-wide">
                    Free Offer
                  </span>
                </button>
              ) : (
                <button
                  onClick={handleSignIn}
                  className="px-4 py-1.5 bg-zinc-950/70 hover:bg-zinc-950/90 dark:bg-zinc-100/70 dark:hover:bg-zinc-100/90 backdrop-blur-md text-white dark:text-zinc-950 rounded-full border-0 text-xs font-semibold shadow-none transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                >
                  Login
                </button>
              )}
            </div>
          </div>
        )}

        {/* Body content */}
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto relative">
          
          {isStyleCustomizerOpen ? (
            renderStyleCustomizerView()
          ) : activeTab === "library" ? (
            renderLibraryView()
          ) : activeTab === "projects" ? (
            renderProjectsView()
          ) : activeTab === "slides" ? (
            renderSlidesView()
          ) : activeTab === "document" ? (
            renderDocumentsView()
          ) : (
            <div className="flex-1 flex flex-row min-w-0 h-full relative overflow-hidden">
              <div className={`flex-1 flex flex-col min-w-0 h-full relative ${previewDoc && !isDocExpanded ? "hidden md:flex" : ""}`}>
              {/* Active project context banner */}
              {activeProjectId && (
                <div className="bg-indigo-50 border-b border-indigo-100 px-4 py-2 flex items-center justify-between select-none">
                  <div className="flex items-center gap-2 text-xs text-indigo-700 font-semibold">
                    <FolderKanban size={13} className="text-indigo-600 animate-pulse" />
                    <span>
                      Active Project Context: <strong className="text-indigo-800">{projects.find(p => p.id === activeProjectId)?.name}</strong>
                    </span>
                    <span className="text-[10px] bg-indigo-100 border border-indigo-200 text-indigo-600 px-1.5 py-0.5 rounded-full uppercase font-bold">
                      Override Active
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setActiveProjectId(null);
                      localStorage.removeItem("worldilm-active-project-id");
                      showToast("Project context deactivated");
                    }}
                    className="text-[10px] text-zinc-500 hover:text-indigo-600 font-bold hover:underline cursor-pointer"
                  >
                    Deactivate Override
                  </button>
                </div>
              )}

              {/* Welcome Screen (Zero message state) */}
              {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 select-none max-w-4xl mx-auto w-full relative">

              {/* Centered Heading with Logo */}
              <div className="flex flex-col items-center justify-center text-center select-none mt-8 sm:mt-12 mb-4 sm:mb-6 max-w-xl mx-auto">
                <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-bold text-zinc-900 dark:text-zinc-50 font-sans tracking-tight leading-snug">
                  How can I assist you?
                </h1>
              </div>

              {/* Center Prompt input inside Welcome */}
              <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-[24px] shadow-md p-4 flex flex-col gap-3 transition-all focus-within:border-zinc-300 dark:focus-within:border-zinc-700 relative">
                {isBusy && (
                  <div className="absolute inset-0 rounded-[24px] pointer-events-none p-[2px] z-0">
                    <div className="absolute inset-0 rounded-[24px] overflow-hidden">
                      <div className="absolute -inset-[20px] gemini-thinking-border" />
                    </div>
                    <div className="absolute inset-[2px] bg-white dark:bg-zinc-900 rounded-[22px] z-10 pointer-events-none" />
                  </div>
                )}
                <div className="relative z-20 flex flex-col gap-3 w-full">
                
                {/* Active attachments display inside welcome input */}
                {attachments.length > 0 && (
                  <div className="flex gap-2 flex-wrap pb-1.5 border-b border-zinc-100">
                    {attachments.map((att) => (
                      <div
                        key={att.id}
                        className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-50 border border-zinc-200 rounded-full text-xs font-bold text-zinc-500"
                      >
                        {att.type === "image" ? (
                          <img
                            src={att.data}
                            alt="Attachment preview"
                            className="w-5 h-5 rounded object-cover"
                          />
                        ) : (
                          <FileText size={12} className="text-indigo-500" />
                        )}
                        <span className="truncate max-w-40">{att.name}</span>
                        <button
                          onClick={() => setAttachments((prev) => prev.filter((a) => a.id !== att.id))}
                          className="hover:text-rose-500 cursor-pointer ml-1"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <textarea
                  ref={welcomeTextareaRef}
                  rows={1}
                  value={inputText}
                  onChange={(e) => {
                    setInputText(e.target.value);
                    if (welcomeTextareaRef.current) {
                      welcomeTextareaRef.current.style.height = "auto";
                      welcomeTextareaRef.current.style.height = `${welcomeTextareaRef.current.scrollHeight}px`;
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      if (isBusy) {
                        showToast("Worldilm AI is currently responding. Please wait a moment...");
                        return;
                      }
                      handleSendMessage();
                    }
                  }}
                  placeholder="How can I help you today?"
                  className="w-full text-[#1b1a18] bg-transparent outline-none border-none py-1 px-1.5 text-[15px] sm:text-[16px] font-normal placeholder-zinc-400/95 resize-none h-auto max-h-[140px] leading-relaxed overflow-y-auto custom-scrollbar-textarea font-sans"
                  autoFocus
                />

                <div className="flex items-center justify-between pt-1 border-t border-zinc-100/50">
                  {/* Left Controls: Plus Menu Button */}
                  <div className="flex items-center gap-2 relative">
                    <div className="relative">
                      <button
                        onClick={() => setIsUploadMenuOpen((prev) => !prev)}
                        className="w-9 h-9 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer rounded-xl"
                        title="Attach files or capture image"
                      >
                        <Plus size={20} strokeWidth={2.2} />
                      </button>

                      <AnimatePresence>
                        {isUploadMenuOpen && (
                          <>
                            <div
                              onClick={() => setIsUploadMenuOpen(false)}
                              className="fixed inset-0 z-10"
                            />
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: 10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: 10 }}
                              className="absolute bottom-11 left-0 z-20 w-44 bg-white border border-zinc-200 rounded-xl shadow-xl p-1"
                            >
                              <button
                                onClick={() => {
                                  fileInputRef.current?.click();
                                  setIsUploadMenuOpen(false);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg hover:bg-zinc-50 text-zinc-700 hover:text-zinc-950 transition-colors cursor-pointer"
                              >
                                <ImageIcon size={16} className="text-indigo-500" />
                                Upload Image
                              </button>
                              <button
                                onClick={() => {
                                  cameraInputRef.current?.click();
                                  setIsUploadMenuOpen(false);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg hover:bg-zinc-50 text-zinc-700 hover:text-zinc-950 transition-colors cursor-pointer"
                              >
                                <Camera size={16} className="text-sky-500" />
                                Camera Capture
                              </button>
                              <button
                                onClick={() => {
                                  pdfInputRef.current?.click();
                                  setIsUploadMenuOpen(false);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg hover:bg-zinc-50 text-zinc-700 hover:text-zinc-950 transition-colors cursor-pointer"
                              >
                                <FileText size={16} className="text-rose-500" />
                                Upload PDF
                              </button>
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Right Controls: Model Select pill + Mic + Wave Lines + Send */}
                  <div className="flex items-center gap-2">
                    {/* Model Selector pill matching image */}
                    <div className="relative">
                      <button
                        onClick={() => setIsModelMenuOpen((prev) => !prev)}
                        className="flex items-center gap-1.5 px-2 py-1.5 bg-transparent hover:bg-zinc-100/60 dark:hover:bg-zinc-800/60 rounded-xl text-sm font-bold text-zinc-700 dark:text-zinc-200 hover:text-zinc-900 dark:hover:text-white transition-colors select-none cursor-pointer shrink-0 border-none shadow-none"
                      >
                        <span className="capitalize">{curTier === "deep" ? "Deep Think" : curTier === "expert" ? "Expert" : "Instant"}</span>
                        {curTier === "deep" && (
                          <span className="px-1.5 py-0.5 text-[9px] font-extrabold text-white bg-gradient-to-r from-[#4f6bf0] to-[#17c3e6] rounded-md uppercase tracking-wider leading-none shadow-xs">
                            PRO
                          </span>
                        )}
                        <ChevronDown size={14} className="text-zinc-500 shrink-0 stroke-[2.2]" />
                      </button>

                      <AnimatePresence>
                        {isModelMenuOpen && (
                          <>
                            <div
                              onClick={() => setIsModelMenuOpen(false)}
                              className="fixed inset-0 z-10"
                            />
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: 10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: 10 }}
                              className="absolute bottom-12 right-[-8px] sm:right-0 z-20 w-64 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-1.5 overflow-hidden"
                            >
                              {[
                                { id: "instant", name: "Instant", v: "1.5 Flash" },
                                { id: "expert", name: "Expert", v: "2.5 Pro" },
                                { id: "deep", name: "Deep Think", v: "3.0 Pro", pro: true },
                              ].map((tier) => (
                                <button
                                  key={tier.id}
                                  onClick={() => {
                                    if (tier.id === "deep" && !isSubscribed) {
                                      setIsPlansPageOpen(true);
                                      setIsCheckoutOpen(false);
                                      setIsModelMenuOpen(false);
                                      return;
                                    }
                                    setCurTier(tier.id);
                                    setIsModelMenuOpen(false);
                                    showToast(`${tier.name} activated`);
                                  }}
                                  className={`w-full flex items-center justify-between p-2 text-left rounded-xl transition-all cursor-pointer ${
                                    curTier === tier.id 
                                      ? "bg-zinc-100 dark:bg-zinc-800" 
                                      : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                                  }`}
                                >
                                  <div className="flex flex-col">
                                    <span className="text-[11px] font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight flex items-center gap-1.5">
                                      {tier.name}
                                    </span>
                                    <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-tighter">{tier.v}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {tier.pro && (
                                      <span className="px-1.5 py-0.5 text-[8px] font-extrabold text-white bg-gradient-to-r from-[#4f6bf0] to-[#17c3e6] rounded-md uppercase tracking-wider leading-none shadow-xs">
                                        PRO
                                      </span>
                                    )}
                                    {curTier === tier.id && (
                                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                    )}
                                  </div>
                                </button>
                              ))}
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Microphone input trigger */}
                    <button
                      onClick={toggleMicInput}
                      className={`p-2 rounded-xl transition-all cursor-pointer ${
                        isListening
                          ? "bg-rose-50 text-rose-500 ring-2 ring-rose-100 animate-pulse scale-105"
                          : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      }`}
                      title="Voice Input"
                    >
                      <Mic size={20} strokeWidth={2.0} />
                    </button>

                    {/* Dynamic Stop / Send / Realtime Voice Toggle */}
                    {isBusy ? (
                      <button
                        onClick={handleStopGeneration}
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 flex items-center justify-center shadow-xs transition-all cursor-pointer shrink-0 active:scale-90"
                        title="Stop response"
                      >
                        <Square size={13} fill="currentColor" strokeWidth={0} />
                      </button>
                    ) : inputText.trim() || attachments.length > 0 ? (
                      <button
                        onClick={() => handleSendMessage()}
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-zinc-950 hover:bg-zinc-800 text-white flex items-center justify-center shadow-xs transition-all cursor-pointer shrink-0 active:scale-95"
                        title="Send Message"
                      >
                        <ArrowUp size={18} strokeWidth={2.5} />
                      </button>
                    ) : (
                      <button
                        onClick={() => startVoiceSession()}
                        className="p-2 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
                        title="Realtime Voice Session"
                      >
                        <AudioLines size={20} strokeWidth={2.0} />
                      </button>
                    )}
                  </div>
                </div>
                </div>
              </div>

              {/* Suggestion Pills underneath the Prompt Card */}
              <div className="flex gap-2 flex-wrap justify-center mt-6 w-full max-w-2xl select-none">
                {[
                  { label: "Code", icon: <CodeXml size={13} className="text-zinc-500 shrink-0" />, prompt: "Write a high-performance binary search algorithm in TypeScript" },
                  { label: "Write", icon: <Pen size={12} className="text-zinc-500 shrink-0" />, prompt: "Draft a professional introductory outreach email to a partner" },
                  { label: "Learn", icon: <GraduationCap size={13} className="text-zinc-500 shrink-0" />, prompt: "Explain quantum computing in simple terms for a beginner" },
                  { label: "Life stuff", icon: <Coffee size={13} className="text-zinc-500 shrink-0" />, prompt: "Suggest a 15-minute quick home workout routine" },
                ].map((p, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setInputText(p.prompt);
                      showToast(`Preset: ${p.label}`);
                      if (welcomeTextareaRef.current) {
                        welcomeTextareaRef.current.focus();
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-zinc-200/80 bg-white hover:bg-zinc-50 rounded-full text-xs font-semibold text-zinc-650 transition-all shadow-xs cursor-pointer hover:scale-[1.01]"
                  >
                    {p.icon}
                    <span>{p.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            // --- Active Chat Layout ---
            <div className="flex-1 flex flex-col min-h-0 relative">
              
              {/* Message List */}
              <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto px-2.5 pt-14 pb-4 sm:px-4 md:px-8 select-text"
              >
                <div className={`${
                  chatWidth === "normal"
                    ? "max-w-3xl"
                    : chatWidth === "wide"
                    ? "max-w-5xl"
                    : "max-w-none px-4"
                } mx-auto space-y-5 sm:space-y-8 pb-40 transition-all duration-300`}>
                  {messages.map((m, idx) => (
                    <div
                      key={m.id}
                      className={`flex flex-col gap-2.5 w-full max-w-full min-w-0 ${m.role === "user" ? "items-end" : "items-start"}`}
                    >
                      {/* Message Content Bubble */}
                      {m.role === "user" ? (
                        <div className="flex flex-col items-end gap-1 max-w-[95%] sm:max-w-[85%] group w-full min-w-0">
                          {editingMessageId === m.id ? (
                            <div className="w-full flex flex-col gap-2 bg-zinc-50 border border-zinc-200 rounded-2xl p-3 shadow-sm min-w-[280px]">
                              <textarea
                                className="w-full bg-transparent border-none outline-none resize-none text-sm text-zinc-800"
                                value={editMessageContent}
                                onChange={(e) => setEditMessageContent(e.target.value)}
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleEditMessageSubmit(m.id);
                                  }
                                }}
                              />
                              <div className="flex justify-end gap-2">
                                <button onClick={() => setEditingMessageId(null)} className="text-xs text-zinc-500 hover:text-zinc-700 px-2 py-1 cursor-pointer">Cancel</button>
                                <button onClick={() => handleEditMessageSubmit(m.id)} className="bg-zinc-900 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer">Send</button>
                              </div>
                            </div>
                          ) : (
                            <>

                          <div className="bg-zinc-100 text-zinc-800 px-4 py-3 rounded-2xl shadow-sm text-sm font-medium leading-relaxed break-words whitespace-pre-wrap relative group">
                            {/* Attached user images */}
                            {m.images && m.images.length > 0 && (
                              <div className="flex gap-2 flex-wrap mb-2">
                                {m.images.map((img, idx) => (
                                  <img
                                    key={idx}
                                    src={img}
                                    alt="Attached User Asset"
                                    className="max-h-40 max-w-64 rounded-lg object-cover border border-zinc-200 cursor-pointer"
                                    onClick={() => setLightboxImg(img)}
                                    referrerPolicy="no-referrer"
                                  />
                                ))}
                              </div>
                            )}
                            {m.content}
                          </div>

                          {/* Static User Actions */}
                          <div className="flex items-center gap-1.5 mt-1 select-none">
                            <CopyButton
                              text={m.content}
                              showText={true}
                              iconSize={11}
                              className="text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 p-1 cursor-pointer flex items-center gap-1 transition-colors"
                              title="Copy"
                            />
                            <button
                              onClick={() => {
                                setEditingMessageId(m.id);
                                setEditMessageContent(m.content);
                              }}
                              className="text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 p-1 cursor-pointer flex items-center gap-1 transition-colors"
                              title="Edit & Resend"
                            >
                              <Edit2 size={11} />
                              <span className="text-[10px] font-bold">Edit</span>
                            </button>
                          </div>
</>
)}</div>) : isBusy && idx === messages.length - 1 && !m.content ? (
                        // Clean, elegant thinking phase: only the animated logo with conic moving gradient border, status transition, and seconds timer
                        <div className="flex gap-3 items-center py-2 px-1 select-none">
                          {/* Moving colorful logo */}
                          <div className="relative shrink-0 w-8 h-8 flex items-center justify-center">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                              className="absolute inset-0 rounded-full p-[2px]"
                              style={{
                                background: "conic-gradient(from 0deg, #4f6bf0, #17c3e6, #8b5cf6, #ec4899, #f43f5e, #4f6bf0)",
                              }}
                            >
                              <div className="w-full h-full bg-white rounded-full" />
                            </motion.div>
                            <div className="relative z-10 flex items-center justify-center">
                              <Logo size={18} />
                            </div>
                          </div>

                          {/* Transitioning status text & thinkingSeconds */}
                          <div className="flex items-center gap-1.5">
                            <AnimatePresence mode="wait">
                              <motion.span
                                key={[
                                  "Analyzing...",
                                  "Thinking...",
                                  "Structuring thoughts...",
                                  "Drafting response...",
                                  "Injecting details...",
                                  "Refining layout...",
                                  "Finalizing touches..."
                                ][Math.min(Math.floor(thinkingSeconds / 2.5), 6)]}
                                initial={{ opacity: 0, x: -6 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 6 }}
                                transition={{ duration: 0.25 }}
                                className="text-zinc-600 dark:text-zinc-300 font-medium text-xs sm:text-sm tracking-tight font-sans"
                              >
                                {[
                                  "Analyzing...",
                                  "Thinking...",
                                  "Structuring thoughts...",
                                  "Drafting response...",
                                  "Injecting details...",
                                  "Refining layout...",
                                  "Finalizing touches..."
                                ][Math.min(Math.floor(thinkingSeconds / 2.5), 6)]}
                              </motion.span>
                            </AnimatePresence>
                            
                            <span className="text-[11px] sm:text-xs text-zinc-400 dark:text-zinc-500 font-mono font-bold">
                              ({thinkingSeconds}s)
                            </span>
                          </div>
                        </div>
                      ) : (
                        // Assistant message layout (Claude & Gemini style, logo on top with colored motion border, response exactly below)
                        <div className="flex flex-col gap-3.5 items-start w-full group select-text">
                          
                          {/* Top row with Logo and Brand name */}
                          <div className="flex items-center gap-3 select-none">
                            {isBusy && idx === messages.length - 1 ? (
                              <div className="flex gap-3 items-center select-none">
                                {/* Moving colorful logo */}
                                <div className="relative shrink-0 w-8 h-8 flex items-center justify-center">
                                  <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                    className="absolute inset-0 rounded-full p-[2px]"
                                    style={{
                                      background: "conic-gradient(from 0deg, #4f6bf0, #17c3e6, #8b5cf6, #ec4899, #f43f5e, #4f6bf0)",
                                    }}
                                  >
                                    <div className="w-full h-full bg-white rounded-full" />
                                  </motion.div>
                                  <div className="relative z-10 flex items-center justify-center">
                                    <Logo size={18} />
                                  </div>
                                </div>

                                {/* Transitioning status text & thinkingSeconds */}
                                <div className="flex items-center gap-1.5">
                                  <AnimatePresence mode="wait">
                                    <motion.span
                                      key={[
                                        "Analyzing...",
                                        "Thinking...",
                                        "Structuring thoughts...",
                                        "Drafting response...",
                                        "Injecting details...",
                                        "Refining layout...",
                                        "Finalizing touches..."
                                      ][Math.min(Math.floor(thinkingSeconds / 2.5), 6)]}
                                      initial={{ opacity: 0, x: -6 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      exit={{ opacity: 0, x: 6 }}
                                      transition={{ duration: 0.25 }}
                                      className="text-zinc-600 dark:text-zinc-300 font-medium text-xs sm:text-sm tracking-tight font-sans"
                                    >
                                      {[
                                        "Analyzing...",
                                        "Thinking...",
                                        "Structuring thoughts...",
                                        "Drafting response...",
                                        "Injecting details...",
                                        "Refining layout...",
                                        "Finalizing touches..."
                                      ][Math.min(Math.floor(thinkingSeconds / 2.5), 6)]}
                                    </motion.span>
                                  </AnimatePresence>
                                  
                                  <span className="text-[11px] sm:text-xs text-zinc-400 dark:text-zinc-500 font-mono font-bold">
                                    ({thinkingSeconds}s)
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <>
                                <LogoContainer
                                  isThinking={false}
                                  isStreaming={false}
                                />
                                <div className="flex flex-col">
                                  <span className="text-xs font-extrabold text-zinc-800 dark:text-zinc-100 uppercase tracking-wider font-sans leading-none">
                                    Worldilm AI
                                  </span>
                                </div>
                              </>
                            )}
                          </div>

                          {/* Response container starts exactly below the Logo row */}
                          <div className="flex-1 w-full min-w-0 select-text assistant-content mt-1 leading-loose text-zinc-800 dark:text-zinc-100">
                            {m.content ? (
                              // Render Standard Text using highly optimized Memoized Component (inline reactions included)
                              <MemoizedAssistantContent
                                content={m.content}
                                isBusy={isBusy}
                                isLast={idx === messages.length - 1}
                                
                                onShowToast={showToast}
                                fontFamilyClass={getFontFamilyClass(chatFontFamily)}
                                fontSizeClass={getFontSizeClass(chatFontSize)}
                                reactions={m.reactions}
                                onAddReaction={(e) => handleAddReaction(m.id, e)}
                              />
                            ) : (
                              // Pulse streaming thinking indicators (no duplicate logo)
                              <div className="flex items-center gap-3 py-1 select-none">
                                <div className="flex flex-col items-start gap-1">
                                  <span className="text-xs font-extrabold text-zinc-800 tracking-tight flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                                    <span>
                                      {[
                                        "⚡ Analyzing request constraints...",
                                        "🔍 Retrieving weight parameters...",
                                        "⚙️ Structuring layout blocks...",
                                        "📚 Drafting textual content...",
                                        "🖌️ Injecting vector detailing...",
                                        "📄 Aligning A4 margins...",
                                        "✨ Finalizing aesthetic touches..."
                                      ][Math.min(Math.floor(thinkingSeconds / 2.5), 6)]}
                                    </span>
                                  </span>
                                  <span className="text-[10px] text-zinc-400 font-bold leading-none pl-4">
                                    Compiling solution • {thinkingSeconds}s elapsed
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Compiled PDF / Document Attachment Block */}
                            {m.compiledDoc && (
                              <div className="mt-4 p-4 rounded-2xl border border-indigo-100 bg-indigo-50/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4 max-w-2xl select-none animate-fadeIn">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-11 h-11 rounded-xl bg-indigo-100/50 text-indigo-600 flex items-center justify-center shadow-xs shrink-0">
                                    <FileText size={20} className="stroke-[2.2]" />
                                  </div>
                                  <div className="min-w-0">
                                    <span className="block text-sm font-bold text-zinc-800 truncate tracking-tight">
                                      {m.compiledDoc.title}
                                    </span>
                                    <span className="block text-[10.5px] text-indigo-600 font-extrabold uppercase tracking-wider mt-0.5">
                                      {m.compiledDoc.type === "CODE"
                                        ? "Compiled React/TS Component"
                                        : `A4 Premium PDF • ${m.compiledDoc.sections?.length || 0} sections • ${m.compiledDoc.pagesCount || 1} ${m.compiledDoc.pagesCount === 1 ? 'page' : 'pages'}`
                                      }
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <button
                                    onClick={() => {
                                      setPreviewDoc(m.compiledDoc);
                                      setIsDocExpanded(true);
                                      showToast("🔍 Opened preview in right sidebar");
                                    }}
                                    className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
                                  >
                                    <Eye size={13} />
                                    <span>Preview</span>
                                  </button>
                                  
                                  <button
                                    onClick={() => downloadCompiledDoc(m.compiledDoc)}
                                    className="flex items-center gap-1.5 px-3.5 py-2 border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 rounded-xl text-xs font-bold shadow-xs hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
                                  >
                                    <Download size={13} />
                                    <span>Download</span>
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Feedbacks Action row */}
                            {m.content && !m.isImageResult && (
                              <div className="flex items-center gap-1.5 mt-3 select-none relative opacity-100">
                                <CopyButton
                                  text={m.content}
                                  iconSize={12}
                                  className="w-7 h-7 flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer rounded-lg"
                                  title="Copy response"
                                />
                                <motion.button
                                  whileTap={{ scale: 0.85 }}
                                  onClick={() => handleLikeMessage(m.id)}
                                  className={`w-7 h-7 flex items-center justify-center transition-all cursor-pointer ${
                                    flashingLikeMsgId === m.id
                                      ? "text-sky-500 dark:text-sky-400 scale-125 transition-transform"
                                      : likedMsgIds[m.id]
                                      ? "text-sky-500 dark:text-sky-400"
                                      : "text-zinc-400 hover:text-sky-500 dark:hover:text-sky-400"
                                  }`}
                                  title="Good response"
                                >
                                  <ThumbsUp size={12} />
                                </motion.button>
                                <motion.button
                                  whileTap={{ scale: 0.85 }}
                                  onClick={() => handleDislikeMessage(m.id)}
                                  className={`w-7 h-7 flex items-center justify-center transition-all cursor-pointer rounded-lg ${
                                    dislikedMsgIds[m.id]
                                      ? "text-rose-500 dark:text-rose-400"
                                      : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                                  }`}
                                  title="Bad response"
                                >
                                  <ThumbsDown size={12} />
                                </motion.button>
                                <motion.button
                                  whileTap={{ scale: 0.85 }}
                                  onClick={() => handleRegenerateMessage(m.id)}
                                  className="w-7 h-7 flex items-center justify-center text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer rounded-lg"
                                  title="Regenerate longer, detailed response"
                                >
                                  <RefreshCw size={12} />
                                </motion.button>
                              </div>
                            )}

                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Thinking breaths during long streams */}
                  {isBusy && messages[messages.length - 1]?.role === "user" && (
                    <div className="flex gap-3 items-center py-2 px-1 select-none">
                      {/* Moving colorful logo */}
                      <div className="relative shrink-0 w-8 h-8 flex items-center justify-center">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          className="absolute inset-0 rounded-full p-[2px]"
                          style={{
                            background: "conic-gradient(from 0deg, #4f6bf0, #17c3e6, #8b5cf6, #ec4899, #f43f5e, #4f6bf0)",
                          }}
                        >
                          <div className="w-full h-full bg-white rounded-full" />
                        </motion.div>
                        <div className="relative z-10 flex items-center justify-center">
                          <Logo size={18} />
                        </div>
                      </div>

                      {/* Transitioning status text & thinkingSeconds */}
                      <div className="flex items-center gap-1.5">
                        <AnimatePresence mode="wait">
                          <motion.span
                            key={[
                              "Analyzing...",
                              "Thinking...",
                              "Structuring thoughts...",
                              "Drafting response...",
                              "Injecting details...",
                              "Refining layout...",
                              "Finalizing touches..."
                            ][Math.min(Math.floor(thinkingSeconds / 2.5), 6)]}
                            initial={{ opacity: 0, x: -6 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 6 }}
                            transition={{ duration: 0.25 }}
                            className="text-zinc-600 dark:text-zinc-300 font-medium text-xs sm:text-sm tracking-tight font-sans"
                          >
                            {[
                              "Analyzing...",
                              "Thinking...",
                              "Structuring thoughts...",
                              "Drafting response...",
                              "Injecting details...",
                              "Refining layout...",
                              "Finalizing touches..."
                            ][Math.min(Math.floor(thinkingSeconds / 2.5), 6)]}
                          </motion.span>
                        </AnimatePresence>
                        
                        <span className="text-[11px] sm:text-xs text-zinc-400 dark:text-zinc-500 font-mono font-bold">
                          ({thinkingSeconds}s)
                        </span>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Composer input inside chat body */}
              <div className="absolute bottom-0 left-0 right-0 z-10 px-4 pb-4 pt-12 bg-gradient-to-t from-white via-white/95 to-transparent dark:from-zinc-950 dark:via-zinc-950/95 dark:to-transparent select-none pointer-events-none">
                <div className={`${
                  chatWidth === "normal"
                    ? "max-w-3xl"
                    : chatWidth === "wide"
                    ? "max-w-5xl"
                    : "max-w-full"
                } w-full mx-auto pointer-events-auto relative`}>
                  
                  {/* Scroll Down Button */}
                  {showScrollDown && (
                    <motion.button
                      initial={{ opacity: 0, y: 10, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.9 }}
                      onClick={() => scrollToBottom(true)}
                      className="absolute -top-12 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-transparent hover:bg-zinc-200/30 dark:hover:bg-zinc-800/30 border border-zinc-300/40 dark:border-zinc-700/40 backdrop-blur-xs flex items-center justify-center cursor-pointer hover:scale-110 transition-all text-zinc-700 dark:text-zinc-200 z-50 pointer-events-auto"
                      title="Scroll to bottom"
                    >
                      <ArrowDown size={18} className="stroke-[2.5]" />
                    </motion.button>
                  )}
                  <div className="w-full bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl shadow-md p-3 sm:p-4 flex flex-col gap-1.5 transition-all focus-within:border-zinc-350 dark:focus-within:border-zinc-700 relative">
                    {isBusy && (
                      <div className="absolute inset-0 rounded-3xl pointer-events-none p-[2px] z-0">
                        <div className="absolute inset-0 rounded-3xl overflow-hidden">
                          <div className="absolute -inset-[20px] gemini-thinking-border" />
                        </div>
                        <div className="absolute inset-[2px] bg-white dark:bg-zinc-900 rounded-[22px] z-10 pointer-events-none" />
                      </div>
                    )}
                    <div className="relative z-20 flex flex-col gap-1.5 w-full">
                      {/* Active attachments display inside chat input */}
                  {attachments.length > 0 && (
                    <div className="flex gap-2 flex-wrap pb-1.5 border-b border-zinc-100">
                      {attachments.map((att) => (
                        <div
                          key={att.id}
                          className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-50 border border-zinc-200 rounded-full text-xs font-bold text-zinc-500"
                        >
                          {att.type === "image" ? (
                            <img
                              src={att.data}
                              alt="Attachment preview"
                              className="w-5 h-5 rounded object-cover"
                            />
                          ) : (
                            <FileText size={12} className="text-indigo-500" />
                          )}
                          <span className="truncate max-w-40">{att.name}</span>
                          <button
                            onClick={() => setAttachments((prev) => prev.filter((a) => a.id !== att.id))}
                            className="hover:text-rose-500 cursor-pointer ml-1"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <textarea
                    ref={chatTextareaRef}
                    rows={1}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        if (isBusy) {
                          showToast("Worldilm AI is currently responding. Please wait a moment...");
                          return;
                        }
                        handleSendMessage();
                      }
                    }}
                    placeholder="Ask Worldilm AI anything..."
                    className="w-full text-zinc-800 bg-transparent outline-none border-none py-1.5 px-1.5 text-sm sm:text-[15px] font-medium placeholder-zinc-400 resize-none h-auto max-h-[140px] leading-relaxed overflow-y-auto custom-scrollbar-textarea"
                  />

                  <div className="flex items-center justify-between pt-1.5">
                    {/* Left Controls: Plus & Model Selection */}
                    <div className="flex items-center gap-2 relative">
                      {/* Plus Trigger Button */}
                      <div className="relative">
                        <button
                          onClick={() => setIsUploadMenuOpen((prev) => !prev)}
                          className="w-9 h-9 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer rounded-xl"
                          title="Attach file"
                        >
                          <Plus size={20} strokeWidth={2.2} />
                        </button>

                        <AnimatePresence>
                          {isUploadMenuOpen && (
                            <>
                              <div
                                onClick={() => setIsUploadMenuOpen(false)}
                                className="fixed inset-0 z-10"
                              />
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                className="absolute bottom-11 left-0 z-20 w-44 bg-white border border-zinc-200 rounded-xl shadow-xl p-1"
                              >
                                <button
                                  onClick={() => {
                                    fileInputRef.current?.click();
                                    setIsUploadMenuOpen(false);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg hover:bg-zinc-50 text-zinc-700 hover:text-zinc-950 transition-colors cursor-pointer"
                                >
                                  <ImageIcon size={16} className="text-indigo-500" />
                                  Upload Image
                                </button>
                                <button
                                  onClick={() => {
                                    cameraInputRef.current?.click();
                                    setIsUploadMenuOpen(false);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg hover:bg-zinc-50 text-zinc-700 hover:text-zinc-950 transition-colors cursor-pointer"
                                >
                                  <Camera size={16} className="text-sky-500" />
                                  Camera Capture
                                </button>
                                <button
                                  onClick={() => {
                                    pdfInputRef.current?.click();
                                    setIsUploadMenuOpen(false);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg hover:bg-zinc-50 text-zinc-700 hover:text-zinc-950 transition-colors cursor-pointer"
                                >
                                  <FileText size={16} className="text-rose-500" />
                                  Upload PDF
                                </button>
                              </motion.div>
                            </>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Model Selector Trigger */}
                      <div className="relative">
                        <button
                          onClick={() => setIsModelMenuOpen((prev) => !prev)}
                          className="flex items-center gap-1.5 px-2 py-1.5 bg-transparent hover:bg-zinc-100/60 dark:hover:bg-zinc-800/60 rounded-xl text-sm font-bold text-zinc-700 dark:text-zinc-200 hover:text-zinc-900 dark:hover:text-white transition-colors select-none cursor-pointer shrink-0 border-none shadow-none"
                        >
                          <span className="capitalize">{curTier === "deep" ? "Deep Think" : curTier === "expert" ? "Expert" : "Instant"}</span>
                          {curTier === "deep" && (
                            <span className="px-1.5 py-0.5 text-[9px] font-extrabold text-white bg-gradient-to-r from-[#4f6bf0] to-[#17c3e6] rounded-md uppercase tracking-wider leading-none shadow-xs">
                              PRO
                            </span>
                          )}
                          <ChevronDown size={14} className="text-zinc-500 shrink-0 stroke-[2.2]" />
                        </button>

                        <AnimatePresence>
                          {isModelMenuOpen && (
                            <>
                              <div
                                onClick={() => setIsModelMenuOpen(false)}
                                className="fixed inset-0 z-10"
                              />
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                className="absolute bottom-12 left-[-8px] sm:left-0 z-20 w-64 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-1.5 overflow-hidden"
                              >
                                {[
                                  { id: "instant", name: "Instant", v: "1.5 Flash" },
                                  { id: "expert", name: "Expert", v: "2.5 Pro" },
                                  { id: "deep", name: "Deep Think", v: "3.0 Pro", pro: true },
                                ].map((tier) => (
                                  <button
                                    key={tier.id}
                                    onClick={() => {
                                      if (tier.id === "deep" && !isSubscribed) {
                                        setIsPlansPageOpen(true);
                                        setIsCheckoutOpen(false);
                                        setIsModelMenuOpen(false);
                                        return;
                                      }
                                      setCurTier(tier.id);
                                      setIsModelMenuOpen(false);
                                      showToast(`${tier.name} activated`);
                                    }}
                                    className={`w-full flex items-center justify-between p-2 text-left rounded-xl transition-all cursor-pointer ${
                                      curTier === tier.id 
                                        ? "bg-zinc-100 dark:bg-zinc-800" 
                                        : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                                    }`}
                                  >
                                    <div className="flex flex-col">
                                      <span className="text-[11px] font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight flex items-center gap-1.5">
                                        {tier.name}
                                      </span>
                                      <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-tighter">{tier.v}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {tier.pro && (
                                        <span className="px-1.5 py-0.5 text-[8px] font-extrabold text-white bg-gradient-to-r from-[#4f6bf0] to-[#17c3e6] rounded-md uppercase tracking-wider leading-none shadow-xs">
                                          PRO
                                        </span>
                                      )}
                                      {curTier === tier.id && (
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                      )}
                                    </div>
                                  </button>
                                ))}
                              </motion.div>
                            </>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    {/* Right Controls: Mic & Send */}
                    <div className="flex items-center gap-2">
                      {/* Mic input trigger */}
                      <button
                        onClick={toggleMicInput}
                        className={`p-2 rounded-xl transition-all cursor-pointer ${
                          isListening
                            ? "bg-rose-50 text-rose-500 ring-2 ring-rose-100 animate-pulse scale-105"
                            : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        }`}
                        title="Toggle Voice Input"
                      >
                        <Mic size={20} strokeWidth={2.0} />
                      </button>

                      {/* Dynamic Stop / Send / Realtime Voice Toggle */}
                      {isBusy ? (
                        <button
                          onClick={handleStopGeneration}
                          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 flex items-center justify-center shadow-xs transition-all cursor-pointer shrink-0 active:scale-90"
                          title="Stop response"
                        >
                          <Square size={13} fill="currentColor" strokeWidth={0} />
                        </button>
                      ) : inputText.trim() || attachments.length > 0 ? (
                        <button
                          onClick={() => handleSendMessage()}
                          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-zinc-950 hover:bg-zinc-800 text-white flex items-center justify-center shadow-xs transition-all cursor-pointer shrink-0 active:scale-95"
                          title="Send Message"
                        >
                          <ArrowUp size={18} strokeWidth={2.5} />
                        </button>
                      ) : (
                        <button
                          onClick={() => startVoiceSession()}
                          className="p-2 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
                          title="Realtime Voice Session"
                        >
                          <AudioLines size={20} strokeWidth={2.0} />
                        </button>
                      )}
                    </div>
                  </div>
                  </div>
                </div>

                <div className="text-[10px] text-zinc-400 font-medium text-center mt-2 select-none">
                  Worldilm AI can make mistakes. Verify important info.
                </div>
              </div>
            </div>

            </div>
          )}

          </div>

          {/* --- DOCUMENT PREVIEW SIDE-BY-SIDE PANE --- */}
          {previewDoc && (
            <div className={`h-full border-l border-zinc-200/85 bg-zinc-50/50 flex flex-col transition-all duration-300 relative shrink-0 ${
              isDocExpanded ? "w-full" : "w-full md:w-[50%]"
            }`}>
              {/* Right Column Header */}
              <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-zinc-200 select-none shrink-0 shadow-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText size={16} className="text-indigo-600 shrink-0" />
                  <span className="font-bold text-xs sm:text-sm text-zinc-700 truncate">
                    {previewDoc.title}
                  </span>
                  <span className="text-[10px] font-bold text-white uppercase bg-indigo-600 rounded-full px-1.5 py-0.5 tracking-wider shrink-0 select-none">
                    {previewDoc.type}
                  </span>
                </div>
                <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                  <button
                    onClick={handleDownloadDoc}
                    className="w-8 h-8 rounded-lg hover:bg-zinc-100 flex items-center justify-center text-zinc-500 hover:text-zinc-800 transition-colors cursor-pointer"
                    title="Download Document"
                  >
                    <Download size={14} />
                  </button>
                  <button
                    onClick={handleRefreshDoc}
                    className="w-8 h-8 rounded-lg hover:bg-zinc-100 flex items-center justify-center text-zinc-500 hover:text-zinc-800 transition-colors cursor-pointer"
                    title="Recompile Document"
                  >
                    <RefreshCw size={13} />
                  </button>
                  <button
                    onClick={() => setIsDocExpanded(!isDocExpanded)}
                    className="w-8 h-8 rounded-lg hover:bg-zinc-100 flex items-center justify-center text-zinc-500 hover:text-zinc-800 transition-colors cursor-pointer"
                    title={isDocExpanded ? "Collapse View" : "Expand View"}
                  >
                    {isDocExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                  </button>
                  <button
                    onClick={() => setPreviewDoc(null)}
                    className="w-8 h-8 rounded-lg hover:bg-zinc-100 flex items-center justify-center text-zinc-500 hover:text-rose-600 transition-colors cursor-pointer"
                    title="Close Preview"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>

              {/* Scrollable Document Content */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 flex flex-col items-center gap-6 scroll-smooth select-text custom-scrollbar-textarea">
                {previewDoc.type === "CODE" ? (
                  <div className="w-full max-w-[840px] bg-zinc-950 rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden flex flex-col font-mono text-xs select-text">
                    <div className="flex items-center justify-between px-4 py-3 bg-zinc-900 border-b border-zinc-800 select-none">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1.5">
                          <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                          <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                          <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                        </div>
                        <span className="text-zinc-400 font-bold text-xs ml-2">
                          {previewDoc.title}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded uppercase font-bold">
                        TypeScript · React
                      </span>
                    </div>
                    
                    <div className="flex-1 p-4 bg-zinc-950 overflow-x-auto text-zinc-100 leading-relaxed text-left flex">
                      <div className="text-zinc-600 text-right pr-4 border-r border-zinc-800 select-none space-y-0.5 font-semibold">
                        {Array.from({ length: (previewDoc.customCode || "").split("\n").length }).map((_, lineIdx) => (
                          <div key={lineIdx}>{lineIdx + 1}</div>
                        ))}
                      </div>
                      <pre className="pl-4 whitespace-pre text-emerald-400/95 font-medium leading-relaxed font-mono">
                        {previewDoc.customCode}
                      </pre>
                    </div>
                  </div>
                ) : (
                  Array.from({ length: previewDoc.pagesCount }).map((_, pageIdx) => {
                    const sectionsPerPage = Math.ceil(previewDoc.sections.length / previewDoc.pagesCount);
                    const startSec = pageIdx * sectionsPerPage;
                    const endSec = startSec + sectionsPerPage;
                    const pageSections = previewDoc.sections.slice(startSec, endSec);

                    return (
                      <div
                        key={pageIdx}
                        id={`worldilm-pdf-page-${pageIdx}`}
                        className="w-full max-w-[640px] aspect-[1/1.414] bg-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-zinc-200/80 rounded-sm relative flex flex-col justify-between p-8 sm:p-10 select-text shrink-0"
                      >
                        {/* Colorful twin borders */}
                        {previewDoc.borderType === "colorful" && (
                          <div className="absolute inset-3 border border-indigo-100 rounded-xs pointer-events-none">
                            <div className="absolute inset-1 border-2 border-indigo-200/40 rounded-xs" />
                          </div>
                        )}
                        {previewDoc.borderType === "solid" && (
                          <div className="absolute inset-3 border-2 border-zinc-300 rounded-xs pointer-events-none" />
                        )}

                        <div className="space-y-6 z-10">
                          {/* Header */}
                          {pageIdx === 0 ? (
                            <div className="text-center pb-4 border-b border-zinc-100 space-y-1.5 pt-2">
                              <span className="text-[10px] font-black tracking-widest text-indigo-600 uppercase block">
                                WORLDILM AI DOCUMENT HUB
                              </span>
                              <h2 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight uppercase leading-none">
                                {previewDoc.title}
                              </h2>
                              <div className="w-12 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 mx-auto rounded-full" />
                              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                                Official Reference Guide · Compiled Draft
                              </p>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between border-b border-zinc-100 pb-2 pt-2">
                              <span className="text-[10px] font-bold text-zinc-400 tracking-wider">
                                {previewDoc.title}
                              </span>
                              <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">
                                Section Continued
                              </span>
                            </div>
                          )}

                          {/* Section list */}
                          <div className="space-y-4">
                            {pageSections.map((sec, secIdx) => (
                              <div key={secIdx} className="space-y-1.5">
                                <div className="flex flex-col">
                                  <h3 className="text-xs sm:text-sm font-black text-zinc-800 tracking-tight">
                                    {sec.heading}
                                  </h3>
                                  <div className={`w-16 h-[2px] rounded-full mt-1 ${sec.color || "bg-indigo-500"}`} />
                                </div>
                                <p className="text-[11px] sm:text-xs text-zinc-500 font-medium leading-relaxed">
                                  {sec.description}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between border-t border-zinc-100 pt-3 text-[9px] text-zinc-400 font-bold select-none z-10">
                          <span>Confidential · Generated by Worldilm AI</span>
                          <span>
                            Page {pageIdx + 1} of {previewDoc.pagesCount}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

        </div>
      )}

        </div>
      </main>

      {/* --- HIDDEN INPUTS FOR UPLOADS --- */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleImageFileChange}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleImageFileChange}
      />
      <input
        ref={pdfInputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handlePdfUpload}
      />


      {/* --- MOVIE GRAPHICS COMPILER OVERLAY --- */}
      <AnimatePresence>
        {isCreatingDoc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-zinc-950/98 z-[99999] flex flex-col items-center justify-center p-6 text-center select-none font-sans"
          >
            {/* Spinning Neon 3D Circular Grids */}
            <div className="relative w-40 h-40 mb-10 flex items-center justify-center">
              {/* Outer pulsing ring */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                className="absolute inset-0 border-2 border-indigo-500/25 border-t-indigo-500 rounded-full"
              />
              {/* Middle reverse spinning ring */}
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                className="absolute inset-4 border-2 border-purple-500/20 border-b-purple-500 rounded-full"
              />
              {/* Inner glowing core */}
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-[0_0_40px_rgba(99,102,241,0.5)] border border-indigo-400"
              >
                <FileText size={28} className="text-white" />
              </motion.div>
              {/* Rotating particle orbits */}
              <span className="absolute top-2 left-1/2 w-2.5 h-2.5 bg-indigo-400 rounded-full shadow-[0_0_10px_#6366f1] animate-ping" />
              <span className="absolute bottom-2 left-1/2 w-2.5 h-2.5 bg-purple-400 rounded-full shadow-[0_0_10px_#a855f7] animate-ping [animation-delay:0.75s]" />
            </div>

            {/* Typography */}
            <h2 className="text-2xl font-black text-white tracking-tight uppercase mb-2">
              Compiling Document Canvas
            </h2>
            <div className="flex items-center gap-2.5 justify-center mb-8">
              <span className="text-xs font-black text-indigo-400 uppercase tracking-widest">
                A4 PDF Engine
              </span>
              <span className="w-1.5 h-1.5 bg-zinc-600 rounded-full" />
              <span className="text-xs font-black text-purple-400 uppercase tracking-widest font-mono">
                {docCreationProgress}% Complete
              </span>
            </div>

            {/* Custom Progress Bar */}
            <div className="w-full max-w-sm h-1.5 bg-zinc-800 rounded-full overflow-hidden mb-6 border border-zinc-750">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${docCreationProgress}%` }}
                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
              />
            </div>

            {/* Dynamic Console step terminal logs */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 max-w-md w-full min-h-24 flex flex-col justify-center text-left">
              <span className="text-[10px] font-bold text-zinc-500 font-mono tracking-wider uppercase block mb-1.5">
                Compiler Core Outputs
              </span>
              <p className="text-xs font-semibold text-zinc-300 font-mono leading-relaxed animate-pulse">
                &gt; {docCreationMessage}
              </p>
            </div>
            
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-8 animate-pulse">
              Compiling in seconds... Please do not close your session
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- CUSTOM STATIC TOAST --- */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-[9999] bg-white border border-zinc-200/80 rounded-xl px-4 py-3 shadow-xl flex items-center gap-2 select-none font-sans"
          >
            <Sparkles size={14} className="text-indigo-500 animate-pulse" />
            <span className="text-xs font-bold text-zinc-800 leading-none">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- LIGHTBOX PORTAL OVERLAY --- */}
      <AnimatePresence>
        {lightboxImg && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxImg(null)}
            className="fixed inset-0 bg-black/90 z-[9999] flex items-center justify-center cursor-zoom-out p-4"
          >
            <button
              onClick={() => setLightboxImg(null)}
              className="absolute top-6 right-6 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white cursor-pointer transition-colors"
            >
              <X size={20} />
            </button>
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              src={lightboxImg}
              alt="Expanded Zoom view"
              className="max-w-full max-h-[90vh] rounded-xl object-contain shadow-2xl border border-white/5"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- PLANS PAGE MODAL OVERLAY --- */}
      <AnimatePresence>
        {isPlansPageOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="fixed inset-0 bg-white z-[999] flex flex-col h-full w-full overflow-y-auto select-none"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-zinc-100 max-w-6xl mx-auto w-full select-none shrink-0">
              <div className="flex items-center gap-2.5">
                <Logo size={28} />
                <span className="font-bold text-lg text-zinc-900 tracking-tight">Worldilm AI</span>
              </div>
              <button
                onClick={() => {
                  setIsPlansPageOpen(false);
                  if (!isSubscribed) {
                    setCurTier("expert");
                  }
                }}
                className="w-10 h-10 border border-zinc-200 rounded-xl hover:bg-zinc-100 transition-colors text-zinc-600 cursor-pointer flex items-center justify-center font-bold"
                title="Back to Chat"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content Container */}
            {isCheckoutOpen ? (
              // --- SECURE TRUSTABLE CHECKOUT VIEW ---
              <div className="flex-1 max-w-5xl mx-auto w-full px-4 md:px-6 py-6 md:py-10 flex flex-col items-center">
                
                {checkoutStep === "processing" ? (
                  // --- PROCESSING STEP VIEW ---
                  <div className="flex-1 flex flex-col items-center justify-center py-20 text-center select-none max-w-md">
                    <div className="relative mb-8">
                      <div className="w-16 h-16 rounded-full border-4 border-zinc-100 border-t-indigo-600 animate-spin" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Lock size={18} className="text-indigo-600 animate-pulse" />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-zinc-900 tracking-tight">Securing Your Connection</h3>
                    <p className="text-xs font-semibold text-zinc-400 mt-2 tracking-wide uppercase">PCI-DSS Secure Processing</p>
                    
                    <div className="mt-8 p-4 bg-zinc-50 border border-zinc-200/60 rounded-2xl w-full">
                      <p className="text-xs font-semibold text-zinc-600 animate-pulse">
                        {processingMessage}
                      </p>
                    </div>
                  </div>
                ) : checkoutStep === "success" ? (
                  // --- SUCCESS STEP VIEW ---
                  <div className="flex-1 flex flex-col items-center justify-center py-16 text-center select-none max-w-md">
                    <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mb-6 shadow-md animate-bounce">
                      <Check size={28} strokeWidth={3} />
                    </div>
                    <h3 className="text-2xl font-extrabold text-zinc-900 tracking-tight">Payment Approved!</h3>
                    <p className="text-sm font-semibold text-emerald-600 mt-1.5">Premium Subscription Activated</p>
                    
                    <div className="mt-8 p-6 bg-emerald-50/50 border border-emerald-100 rounded-2xl w-full">
                      <p className="text-xs font-semibold text-zinc-600 leading-relaxed">
                        Welcome to <strong>Worldilm AI Premium Pro</strong>, {checkoutName}! Your exclusive Reasoning engine is now fully provisioned and active. Enjoy unlimited access.
                      </p>
                    </div>
                    <p className="text-[10px] font-bold text-zinc-400 mt-6 animate-pulse">Returning you to workspace...</p>
                  </div>
                ) : (
                  // --- BILLING AND CARD FORM VIEW ---
                  <div className="w-full">
                    {/* Back button */}
                    <button
                      type="button"
                      onClick={() => setIsCheckoutOpen(false)}
                      className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-800 transition-colors bg-zinc-50 border border-zinc-200 rounded-full mb-8 cursor-pointer select-none"
                    >
                      <ArrowLeft size={12} />
                      Back to Plans
                    </button>

                    <form onSubmit={handleCheckoutSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                      {/* Left Column: Form Details */}
                      <div className="lg:col-span-7 space-y-6">
                        
                        {/* Section 1: Billing Account Info */}
                        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
                          <div className="flex items-center gap-2 mb-4 select-none pb-3 border-b border-zinc-100">
                            <div className="w-6 h-6 rounded-md bg-zinc-100 text-zinc-600 flex items-center justify-center">
                              <User size={12} />
                            </div>
                            <h3 className="text-sm font-bold text-zinc-900">1. Contact & Billing Address</h3>
                          </div>

                          <div className="space-y-4 select-text">
                            <div>
                              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                                Account Email Address
                              </label>
                              <div className="relative">
                                <input
                                  type="email"
                                  required
                                  value={checkoutEmail}
                                  onChange={(e) => setCheckoutEmail(e.target.value)}
                                  placeholder="you@example.com"
                                  className="w-full pl-9 pr-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-800 placeholder-zinc-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                                />
                                <Mail size={13} className="absolute left-3.5 top-3.5 text-zinc-400" />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                                  Full Name
                                </label>
                                <input
                                  type="text"
                                  required
                                  value={checkoutName}
                                  onChange={(e) => setCheckoutName(e.target.value)}
                                  placeholder="Muneeb"
                                  className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-800 placeholder-zinc-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                                  Country / Region
                                </label>
                                <select
                                  value={checkoutCountry}
                                  onChange={(e) => setCheckoutCountry(e.target.value)}
                                  className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                                >
                                  <option value="United States">United States</option>
                                  <option value="United Kingdom">United Kingdom</option>
                                  <option value="Canada">Canada</option>
                                  <option value="Germany">Germany</option>
                                  <option value="Australia">Australia</option>
                                  <option value="Pakistan">Pakistan</option>
                                  <option value="United Arab Emirates">United Arab Emirates</option>
                                  <option value="Saudi Arabia">Saudi Arabia</option>
                                </select>
                              </div>
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                                Billing Address
                              </label>
                              <div className="relative">
                                <input
                                  type="text"
                                  required
                                  value={checkoutAddress}
                                  onChange={(e) => setCheckoutAddress(e.target.value)}
                                  placeholder="123 Luxury Avenue, Penthouse B"
                                  className="w-full pl-9 pr-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-800 placeholder-zinc-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                                />
                                <MapPin size={13} className="absolute left-3.5 top-3.5 text-zinc-400" />
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                              <div className="col-span-1">
                                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                                  City
                                </label>
                                <input
                                  type="text"
                                  required
                                  value={checkoutCity}
                                  onChange={(e) => setCheckoutCity(e.target.value)}
                                  placeholder="Beverly Hills"
                                  className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-800 placeholder-zinc-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                                />
                              </div>
                              <div className="col-span-1">
                                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                                  State
                                </label>
                                <input
                                  type="text"
                                  required
                                  value={checkoutState}
                                  onChange={(e) => setCheckoutState(e.target.value)}
                                  placeholder="CA"
                                  className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-800 placeholder-zinc-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                                />
                              </div>
                              <div className="col-span-1">
                                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                                  ZIP / Postal
                                </label>
                                <input
                                  type="text"
                                  required
                                  value={checkoutZip}
                                  onChange={(e) => setCheckoutZip(e.target.value)}
                                  placeholder="90210"
                                  className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-800 placeholder-zinc-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Section 2: Credit Card Payment Info */}
                        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
                          <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-100 select-none">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-md bg-zinc-100 text-zinc-600 flex items-center justify-center">
                                <CreditCard size={12} />
                              </div>
                              <h3 className="text-sm font-bold text-zinc-900">2. Secure Card Information</h3>
                            </div>
                            <div className="flex gap-1">
                              <span className="text-[9px] font-bold text-zinc-400 border border-zinc-200 rounded px-1.5 py-0.5 bg-zinc-50 select-none">VISA</span>
                              <span className="text-[9px] font-bold text-zinc-400 border border-zinc-200 rounded px-1.5 py-0.5 bg-zinc-50 select-none">MC</span>
                              <span className="text-[9px] font-bold text-zinc-400 border border-zinc-200 rounded px-1.5 py-0.5 bg-zinc-50 select-none">AMEX</span>
                            </div>
                          </div>

                          <div className="space-y-4 select-text">
                            <div>
                              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                                Cardholder Name
                              </label>
                              <input
                                type="text"
                                required
                                value={checkoutCardName}
                                onChange={(e) => setCheckoutCardName(e.target.value)}
                                placeholder="Name on card"
                                className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-800 placeholder-zinc-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                                Card Number
                              </label>
                              <div className="relative">
                                <input
                                  type="text"
                                  required
                                  maxLength={19}
                                  value={checkoutCardNum}
                                  onChange={(e) => {
                                    const raw = e.target.value.replace(/\D/g, "");
                                    const formatted = raw.match(/.{1,4}/g)?.join(" ") || raw;
                                    setCheckoutCardNum(formatted);
                                  }}
                                  placeholder="4111 2222 3333 4444"
                                  className="w-full pl-9 pr-12 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono font-semibold tracking-wider text-zinc-800 placeholder-zinc-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                                />
                                <CreditCard size={13} className="absolute left-3.5 top-3.5 text-zinc-400" />
                                <div className="absolute right-3.5 top-2.5 select-none">
                                  {checkoutCardNum.startsWith("4") ? (
                                    <span className="text-[9px] font-black text-blue-600 bg-blue-50 border border-blue-200 px-1 rounded">VISA</span>
                                  ) : checkoutCardNum.startsWith("5") ? (
                                    <span className="text-[9px] font-black text-amber-600 bg-amber-50 border border-amber-200 px-1 rounded">MC</span>
                                  ) : (
                                    <Lock size={13} className="text-emerald-500 mt-1" />
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                                  Expiration Date
                                </label>
                                <input
                                  type="text"
                                  required
                                  maxLength={5}
                                  value={checkoutCardExp}
                                  onChange={(e) => {
                                    const raw = e.target.value.replace(/\D/g, "");
                                    let val = raw;
                                    if (raw.length > 2) {
                                      val = raw.substring(0, 2) + "/" + raw.substring(2, 4);
                                    }
                                    setCheckoutCardExp(val);
                                  }}
                                  placeholder="MM/YY"
                                  className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono font-semibold text-zinc-800 placeholder-zinc-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                                  CVC Code
                                </label>
                                <input
                                  type="password"
                                  required
                                  maxLength={4}
                                  value={checkoutCardCvc}
                                  onChange={(e) => setCheckoutCardCvc(e.target.value.replace(/\D/g, ""))}
                                  placeholder="•••"
                                  className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono font-semibold tracking-widest text-zinc-800 placeholder-zinc-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                      </div>

                      {/* Right Column: Order Summary */}
                      <div className="lg:col-span-5 space-y-6">
                        <div className="bg-zinc-900 border border-zinc-800 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-2xl rounded-full" />
                          
                          <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-4 select-none pb-2 border-b border-zinc-800">
                            Order Summary
                          </h3>

                          <div className="space-y-4 select-none">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <span className="text-xs font-bold block text-zinc-100">Worldilm AI Premium Pro</span>
                                <span className="text-[10px] text-zinc-400 font-medium">Monthly recurring billing plan</span>
                              </div>
                              <span className="text-xs font-extrabold text-zinc-100">$23.00</span>
                            </div>

                            <div className="space-y-2 py-3 border-t border-b border-zinc-800 select-none">
                              <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-400">
                                <span>Normal Tier Price</span>
                                <span>$79.00</span>
                              </div>
                              <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-400">
                                <span>Special Founders Discount (70% Off)</span>
                                <span>-$56.00</span>
                              </div>
                              <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-400">
                                <span>VAT / Sales Tax</span>
                                <span>$0.00</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-2 select-none">
                              <span className="text-xs font-extrabold text-zinc-200 uppercase tracking-wider">Total Amount</span>
                              <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black text-indigo-400">$23</span>
                                <span className="text-[10px] text-zinc-400 font-semibold">/ month</span>
                              </div>
                            </div>

                            <div className="mt-6 space-y-2.5 pt-4 border-t border-zinc-800 select-none">
                              {[
                                "Unlimited access to Deep Search Reasoning Mode",
                                "Full Document Studio & Presentation slides compiler",
                                "Advanced Multimodal Camera & PDF document analysis",
                                "Priority queue access (ultra high-speed zero latency)"
                              ].map((feat, i) => (
                                <div key={i} className="flex items-center gap-2">
                                  <div className="w-4 h-4 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0">
                                    <Check size={9} strokeWidth={3} />
                                  </div>
                                  <span className="text-[10px] font-semibold text-zinc-300">
                                    {feat}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="mt-8 select-none">
                            <button
                              type="submit"
                              className="w-full py-4 px-4 bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white rounded-xl text-xs font-extrabold transition-all text-center shadow-lg hover:scale-[1.01] active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
                            >
                              <Lock size={12} strokeWidth={2.5} />
                              Secure Complete Payment — $23.00
                            </button>
                          </div>
                        </div>

                        <div className="bg-zinc-50 border border-zinc-200/60 rounded-2xl p-5 space-y-3.5 select-none">
                          <div className="flex items-start gap-3">
                            <ShieldCheck size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                            <div>
                              <span className="text-xs font-bold text-zinc-800 block">PCI-DSS Compliant</span>
                              <span className="text-[10px] text-zinc-500 leading-snug block font-medium mt-0.5">
                                Your full card digits are fully tokenized. Payment processing uses TLS 1.3 military-grade secure transport protocols.
                              </span>
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <Lock size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                            <div>
                              <span className="text-xs font-bold text-zinc-800 block">Satisfaction Guaranteed</span>
                              <span className="text-[10px] text-zinc-500 leading-snug block font-medium mt-0.5">
                                If you are not completely satisfied, cancel your Premium subscription anytime with a single click.
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </form>
                  </div>
                )}

              </div>
            ) : (
              // --- STANDARD PLANS VIEW ---
              <div className="flex-1 max-w-5xl mx-auto w-full px-6 py-10 md:py-16 flex flex-col items-center justify-center">
                <div className="text-center max-w-2xl mb-12 select-none">
                  <span className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-widest bg-indigo-50 border border-indigo-100 rounded-full px-3 py-1">
                    Pricing Plans
                  </span>
                  <h2 className="text-3xl md:text-4.5xl font-extrabold text-zinc-900 mt-4 tracking-tight leading-tight">
                    Choose the plan that powers your imagination
                  </h2>
                  <p className="text-sm md:text-base font-medium text-zinc-500 mt-3.5 leading-relaxed">
                    Join millions of users with a free account, or supercharge your productivity with elite, state-of-the-art models.
                  </p>
                </div>

                {/* Plans Columns */}
                <div className="flex justify-center w-full max-w-xl select-text">
                  
                  {/* --- PREMIUM PLAN CARD --- */}
                  <div className="w-full border-2 border-indigo-500 bg-zinc-900 text-white rounded-3xl p-8 flex flex-col justify-between transition-all hover:shadow-2xl relative overflow-hidden group shadow-indigo-100/30">
                    {/* Decorative Glow */}
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500 to-cyan-400 opacity-20 blur-xl rounded-full" />
                    
                    {/* Promo Badge */}
                    <div className="absolute top-4 right-4 select-none">
                      <span className="text-[10px] font-extrabold text-indigo-100 bg-indigo-600/80 border border-indigo-400/30 rounded-full px-3 py-1 uppercase tracking-wider animate-pulse">
                        70% OFF
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-4 select-none">
                        <span className="text-base font-extrabold text-indigo-400">Worldilm AI Premium</span>
                        <Sparkles size={14} className="text-indigo-400 animate-pulse" />
                      </div>
                      <p className="text-xs font-semibold text-zinc-400 leading-relaxed mb-6 select-none">
                        Unlock elite multi-modal reasoning, interactive slide decks, and zero latency.
                      </p>
                      <div className="flex items-baseline gap-1.5 mb-8 select-none">
                        <span className="text-5xl font-extrabold tracking-tight text-white">$23</span>
                        <span className="text-xs font-bold text-zinc-400">/ month</span>
                        <span className="text-[10px] text-indigo-300 font-extrabold border border-indigo-500/50 rounded px-1 ml-1.5">
                          REGULAR $79
                        </span>
                      </div>

                      <div className="w-full h-[1px] bg-zinc-800 my-6 select-none" />

                      {/* Features list */}
                      <div className="space-y-3.5">
                        {[
                          "Unlimited high-speed intelligent search answers",
                          "Unlimited access to Deep Search / Deep reasoning model",
                          "Full Interactive Presentation & Slide Deck Studio",
                          "Custom A4 PDF Document & Reference Engine",
                          "Advanced Multimodal inputs (complex high-res image analysis)",
                          "Full camera capture, environment stream, and PDF prompt analysis",
                          "High priority response queue (zero queuing, instant answers)",
                          "Early beta access to upcoming custom toolkits & founding member badge",
                          "Founding member priority client support directly from founding desk"
                        ].map((feat, idx) => (
                          <div key={idx} className="flex items-start gap-2.5">
                            <div className="w-5 h-5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 flex items-center justify-center shrink-0 mt-0.5">
                              <Check size={12} strokeWidth={2.5} />
                            </div>
                            <span className="text-xs font-semibold text-zinc-200 leading-snug">
                              {feat}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-8 pt-4 select-none">
                      <button
                        type="button"
                        onClick={() => {
                          setCheckoutEmail("raomuneeb468@gmail.com");
                          setCheckoutName("Muneeb");
                          setIsCheckoutOpen(true);
                        }}
                        className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white rounded-2xl text-xs font-extrabold transition-all text-center shadow-lg hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                      >
                        Upgrade to Premium Pro ($23/mo)
                      </button>
                    </div>
                  </div>

                </div>

                {/* Secure note */}
                <div className="mt-12 text-center text-[11px] font-bold text-zinc-400 select-none max-w-md leading-relaxed">
                  <p>🔒 256-bit Secure Sockets Layer encrypted transaction processing. Cancel anytime.</p>
                  <p className="mt-1">Founded & built by Mr. Muneeb. Thank you for supporting independent AI innovation! ❤️</p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- DOWNLOAD MOBILE APP MODAL --- */}
      <AnimatePresence>
        {isDownloadModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDownloadModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative bg-white rounded-3xl shadow-2xl border border-zinc-100 max-w-md w-full overflow-hidden z-10 flex flex-col"
            >
              {/* Top Banner Graphic */}
              <div className="bg-gradient-to-r from-[#4f6bf0] to-[#17c3e6] p-6 text-white text-center select-none relative">
                <button
                  onClick={() => setIsDownloadModalOpen(false)}
                  className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-1.5 transition-all cursor-pointer flex items-center justify-center"
                  title="Close"
                >
                  <X size={14} />
                </button>
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xs">
                  <Logo size={28} />
                </div>
                <h3 className="text-xl font-extrabold tracking-tight">Install Worldilm AI App</h3>
                <p className="text-[11px] text-white/90 font-semibold mt-1 max-w-xs mx-auto leading-relaxed">
                  Add Worldilm AI directly to your home screen or desktop as a fast Progressive Web App (PWA)!
                </p>
              </div>

              {/* Content Body */}
              <div className="p-6 space-y-5">
                {/* PWA Direct Installation Box */}
                <div className="bg-sky-50/60 rounded-2xl p-5 border border-sky-100 flex flex-col items-center text-center gap-3 select-none">
                  <span className="text-xs font-extrabold text-sky-950">
                    Instant Progressive Web App (PWA)
                  </span>
                  <p className="text-[11px] text-zinc-600 leading-relaxed font-medium">
                    Enjoy a full-screen, native-feeling app experience on mobile or desktop with instant access from your home screen.
                  </p>
                  <button
                    onClick={async () => {
                      const promptEvent = deferredPrompt || (window as any).deferredPwaPrompt;
                      if (promptEvent) {
                        promptEvent.prompt();
                        try {
                          const { outcome } = await promptEvent.userChoice;
                          if (outcome === 'accepted') {
                            showToast("🎉 Worldilm AI PWA installed successfully!");
                            setIsDownloadModalOpen(false);
                          }
                        } catch (err) {
                          console.error(err);
                        }
                      } else {
                        const isIos = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
                        if (isIos) {
                          alert("To install Worldilm AI on iOS Safari:\n\n1. Tap the Share icon at the bottom\n2. Select 'Add to Home Screen'");
                        } else {
                          showToast("💡 Click the 'Install' or 'Add to Home Screen' option in your browser menu!");
                        }
                      }
                    }}
                    className="w-full py-3 bg-gradient-to-r from-[#4f6bf0] to-[#17c3e6] hover:opacity-90 text-white rounded-xl text-xs font-extrabold transition-all shadow-md shadow-[#4f6bf0]/25 active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Download size={15} />
                    <span>Install PWA Application</span>
                  </button>
                </div>

                <div className="text-center select-none pt-1">
                  <button
                    onClick={() => setIsDownloadModalOpen(false)}
                    className="text-[11px] font-bold text-zinc-400 hover:text-zinc-600 underline cursor-pointer"
                  >
                    Continue using web workspace
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- REALTIME VOICE CALL OVERLAY --- */}
      <AnimatePresence>
        {isRealtimeVoiceOpen && (
          <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-zinc-950/20 backdrop-blur-sm select-none">
            {/* Backdrop click ends session */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/15"
              onClick={() => stopVoiceSession()}
            />

            {/* Main Floating Motion Card with Premium White Design */}
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 380 }}
              className="relative bg-white text-zinc-800 rounded-[32px] p-6 sm:p-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.12)] border border-zinc-200/90 max-w-sm w-full overflow-hidden flex flex-col items-center justify-between text-center min-h-[460px] z-10"
            >
              {/* Top Row: Timer Badge Only (No end/close icons here, fully matching intent) */}
              <div className="flex items-center justify-center w-full mb-2">
                {/* 5 Minute Timer Limit Badge */}
                <div className="flex items-center gap-2 px-3.5 py-1.5 bg-zinc-50 border border-zinc-200/80 rounded-full text-zinc-600">
                  <div className={`w-2 h-2 rounded-full ${voiceSessionStatus === "listening" ? "bg-emerald-500 animate-ping" : voiceSessionStatus === "speaking" ? "bg-sky-500 animate-pulse" : "bg-zinc-400"}`} />
                  <span className="text-[11px] font-bold tracking-wider font-mono">
                    {(() => {
                      const m = Math.floor(voiceSessionTimeLeft / 60);
                      const s = voiceSessionTimeLeft % 60;
                      return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
                    })()} / 05:00
                  </span>
                </div>
              </div>

              {/* Central Audio Visualization Area */}
              <div className="flex-1 flex flex-col items-center justify-center my-4 w-full">
                {/* Title */}
                <h3 className="text-3xl font-black tracking-tight text-zinc-900 mb-1.5">
                  Speak Now
                </h3>
                
                {/* Subtitle with current status */}
                <p className="text-xs text-sky-600 font-extrabold tracking-widest uppercase mb-6 animate-pulse">
                  {voiceSessionStatus === "listening" && "Listening..."}
                  {voiceSessionStatus === "thinking" && "Processing..."}
                  {voiceSessionStatus === "speaking" && "Speaking..."}
                  {voiceSessionStatus === "paused" && "Muted"}
                  {voiceSessionStatus === "idle" && "Connected"}
                </p>

                {/* Glowing Circular Assistant Orb */}
                <div className="relative w-36 h-36 flex items-center justify-center mb-6">
                  {/* Outer breathing background circle */}
                  <div className={`absolute inset-0 rounded-full bg-sky-500/5 border border-sky-500/10 transition-all duration-700 ${
                    voiceSessionStatus === "speaking" ? "scale-135 opacity-100" : "scale-105 opacity-60"
                  }`} />
                  <div className={`absolute inset-0 rounded-full bg-indigo-500/5 border border-indigo-500/5 transition-all duration-700 ${
                    voiceSessionStatus === "speaking" ? "scale-120 opacity-100" : "scale-100 opacity-40"
                  }`} />

                  {/* Glass Orb containing visual indicator */}
                  <div className="w-26 h-26 rounded-full bg-gradient-to-tr from-white to-zinc-50 p-[1px] shadow-md border border-zinc-200 flex items-center justify-center relative z-10">
                    <div className="absolute inset-0 rounded-full bg-zinc-50/40 backdrop-blur-md" />
                    
                    <div className="relative z-10 flex items-center justify-center">
                      {voiceSessionStatus === "speaking" ? (
                        <div className="flex gap-1.5 items-end justify-center h-10">
                          {[0, 1, 2, 3, 4].map((i) => (
                            <div
                              key={i}
                              className="w-1.5 bg-gradient-to-t from-sky-500 to-indigo-500 rounded-full"
                              style={{
                                height: "100%",
                                animation: "pulseWave 1s ease-in-out infinite alternate",
                                animationDelay: `${i * 0.12}s`,
                              }}
                            />
                          ))}
                        </div>
                      ) : voiceSessionStatus === "thinking" ? (
                        <div className="w-8 h-8 border-2 border-sky-500/20 border-t-sky-500 rounded-full animate-spin" />
                      ) : voiceSessionStatus === "listening" ? (
                        <div className="w-12 h-12 rounded-full bg-sky-500/10 border border-sky-500/20 flex items-center justify-center animate-pulse">
                          <Mic size={22} className="text-sky-600" />
                        </div>
                      ) : (
                        <VolumeX size={24} className="text-zinc-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Transcripts Area - Compact Scrolling Pane inside Card */}
                <div className="w-full bg-zinc-50/80 border border-zinc-200/90 rounded-2xl p-4 min-h-24 max-h-32 overflow-y-auto flex flex-col justify-center items-center shadow-inner">
                  {voiceSessionTranscript ? (
                    <div className="space-y-1 w-full text-center">
                      <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest block">You Spoke</span>
                      <p className="text-xs font-semibold text-zinc-700 leading-normal italic">
                        "\"${voiceSessionTranscript}\""
                      </p>
                    </div>
                  ) : voiceSessionAIResponse ? (
                    <div className="space-y-1 w-full text-center">
                      <span className="text-[10px] font-black uppercase text-sky-600 tracking-widest block">Assistant</span>
                      <p className="text-xs font-semibold text-zinc-800 leading-normal">
                        {voiceSessionAIResponse}
                      </p>
                    </div>
                  ) : (
                    <p className="text-[11px] text-zinc-400 font-medium leading-relaxed italic">
                      "Speak naturally. I am listening..."
                    </p>
                  )}
                </div>
              </div>

              {/* Bottom Row Controls */}
              <div className="w-full flex items-center justify-center gap-4 mt-4 shrink-0">
                {/* Mute Microphone */}
                <button
                  onClick={() => toggleVoiceMute()}
                  className={`w-11 h-11 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
                    isVoiceMuted
                      ? "bg-rose-50 border-rose-200 text-rose-500 hover:bg-rose-100"
                      : "bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-800"
                  }`}
                  title={isVoiceMuted ? "Unmute Microphone" : "Mute Microphone"}
                >
                  {isVoiceMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>

                {/* Terminate Session Button - Strictly text-based with NO phone or end icons as requested */}
                <button
                  onClick={() => stopVoiceSession()}
                  className="px-6 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs tracking-wider uppercase transition-all shadow-md active:scale-97 cursor-pointer border border-rose-500/10"
                  title="End Session"
                >
                  End Session
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- ON-SCREEN CHAT HISTORY & SEARCH DIALOG --- */}
      <AnimatePresence>
        {isHistorySearchDialogOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsHistorySearchDialogOpen(false)}
              className="absolute inset-0 bg-zinc-950/40 backdrop-blur-xs"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="relative w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] z-55"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 select-none">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <Search size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-100">
                      Search Chat History
                    </h3>
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
                      Find and resume your previous discussions
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsHistorySearchDialogOpen(false)}
                  className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Search input */}
              <div className="p-4 border-b border-zinc-100 dark:border-zinc-800/80">
                <div className="relative">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Search titles, prompts, or messages..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-semibold text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                    autoFocus
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-zinc-400 hover:text-zinc-600 cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Sessions List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar min-h-[250px]">
                {filteredSessions.length === 0 ? (
                  <div className="py-12 text-center select-none">
                    <MessageSquare size={32} className="mx-auto text-zinc-300 dark:text-zinc-700 mb-2 stroke-[1.25]" />
                    <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500">
                      No matching chats found
                    </p>
                    <p className="text-[10px] text-zinc-400/80 mt-1">
                      Try searching with a different keyword
                    </p>
                  </div>
                ) : (
                  filteredSessions.map((session) => (
                    <div
                      key={session.id}
                      onClick={() => {
                        handleSelectSession(session);
                        setIsHistorySearchDialogOpen(false);
                      }}
                      className={`flex items-center justify-between px-3.5 py-3 rounded-2xl cursor-pointer transition-all ${
                        activeSessionId === session.id
                          ? "bg-indigo-50 dark:bg-indigo-950/55 border border-indigo-100/40 dark:border-indigo-900/40 text-zinc-900 dark:text-zinc-100 font-semibold"
                          : "hover:bg-zinc-50 dark:hover:bg-zinc-850/60 text-zinc-650 dark:text-zinc-350 border border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <MessageSquare size={14} className="text-zinc-400 dark:text-zinc-500 shrink-0" />
                        <span className="truncate text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                          {session.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 ml-2">
                        {session.model && (
                          <span className="text-[9px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-1.5 py-0.5 rounded uppercase">
                            {session.model}
                          </span>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadChatHistory(session, e);
                          }}
                          className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                          title="Download chat history"
                        >
                          <Download size={12} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSession(session.id, e);
                          }}
                          className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-md text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                          title="Delete chat"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      

      {/* Mobile-friendly Dislike Feedback Modal */}
      {dislikeModalMsgId && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 sm:p-6 max-w-xs sm:max-w-sm w-full shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                  <ThumbsDown size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">
                    Feedback
                  </h3>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    What went wrong with this response?
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDislikeModalMsgId(null)}
                className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400 flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <X size={14} />
              </button>
            </div>

            <div className="space-y-2 pt-1">
              {[
                "Not good material",
                "Inaccurate information",
                "Formatting & styling issues",
                "Too long / Too concise",
                "Did not follow instructions",
                "Other issues"
              ].map((reason) => {
                const isSelected = selectedFeedbackOption === reason;
                return (
                  <button
                    key={reason}
                    onClick={() => handleSelectFeedback(reason)}
                    className={`w-full p-3 rounded-xl border text-left text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-600 dark:text-indigo-300 shadow-2xs scale-[1.01]"
                        : "bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <span>{reason}</span>
                    {isSelected ? (
                      <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-2xs shrink-0">
                        <Check size={12} className="stroke-[3]" />
                      </div>
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-zinc-300 dark:border-zinc-600 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <InstallBanner />
    </div>
  );
}
