import React, { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  generateStructuredSlides,
  generateFallbackSlides,
  exportSlidesToPdf,
  StructuredSlide,
  SlideDeckConfig
} from "../lib/slideGeneratorEngine";
import { InteractiveSlideViewer } from "./InteractiveSlideViewer";
import {
  Presentation,
  Check,
  CheckCircle2,
  Eye,
  X,
  ArrowRight,
  ArrowLeft,
  Search,
  Sparkles,
  Monitor,
  Smartphone,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  User,
  BookOpen,
  ListOrdered,
  AlertCircle,
  Building,
  Briefcase,
  Layers,
  Download,
  Code,
  Copy,
  RotateCcw,
  FileText,
  Loader2,
  Play,
  ExternalLink,
  Maximize2,
  Paperclip,
  Upload,
  FileUp,
  File,
  Sliders,
  Wand2,
  Palette,
  Send
} from "lucide-react";

export interface UploadedDeckSourceFile {
  id: string;
  name: string;
  size: number;
  type: string;
  content: string;
}

export interface PresentationDetails {
  authorName: string;
  authorRole?: string;
  authorOrg?: string;
  topicName: string;
  subtopics: string[];
  additionalDetails: { id: string; label: string; value: string }[];
}

export interface SlidePage {
  title: string;
  subtitle: string;
  bullets: string[];
  stat?: { value: string; label: string };
  badge?: string;
  type?: "title" | "grid" | "stat" | "split" | "roadmap";
}

export type SlideContent = SlidePage;

export interface RawDeckData {
  t: string;
  s: string;
  bg: string;
  fg: string;
  ac: string;
  font: string;
  layout: number;
  category: "Pitch Deck" | "Tech & AI" | "Business" | "Minimalist" | "Creative" | "Dark Luxury" | "Marketing" | "Education" | "Portfolio";
}

export interface SlideTemplate {
  id: string;
  title: string;
  category: "Pitch Deck" | "Tech & AI" | "Business" | "Minimalist" | "Creative" | "Dark Luxury" | "Marketing" | "Education" | "Portfolio";
  slidesCount: number;
  author: string;
  authorBadge: string;
  tagline: string;
  description: string;
  raw: RawDeckData;
  slides: SlidePage[];
  samplePrompt: string;
}

export type SlideSample = SlideTemplate;

export const CATEGORIES = [
  "All",
  "Pitch Deck",
  "Tech & AI",
  "Business",
  "Minimalist",
  "Creative",
  "Dark Luxury",
  "Marketing",
  "Education",
  "Portfolio"
] as const;

// 50 Deck Concepts from user dataset
const RAW_DECKS: RawDeckData[] = [
  { t: "Architecture Portfolio", s: "Folio", bg: "#d1502c", fg: "#fff2e8", ac: "#1a1512", font: "'Archivo Black', sans-serif", layout: 1, category: "Portfolio" },
  { t: "Product Launch", s: "Deck", bg: "#0a0a0a", fg: "#eaff5c", ac: "#ffffff", font: "'Unbounded', sans-serif", layout: 2, category: "Tech & AI" },
  { t: "Market Analysis '26", s: "Report", bg: "#6b74c9", fg: "#0d0e1f", ac: "#ffffff", font: "'Space Grotesk', sans-serif", layout: 3, category: "Business" },
  { t: "Static", s: "Countdown", bg: "#f1ede2", fg: "#1a1a1a", ac: "#c94f2f", font: "'JetBrains Mono', monospace", layout: 4, category: "Minimalist" },
  { t: "Remote Learning Plan", s: "Education", bg: "linear-gradient(160deg,#7d6bd0,#3a3560)", fg: "#ffffff", ac: "#ffce54", font: "'Sora', sans-serif", layout: 5, category: "Education" },
  { t: "Team Bulletin", s: "Internal", bg: "#f4c94b", fg: "#241d0a", ac: "#d94f6c", font: "'Fraunces', serif", layout: 6, category: "Business" },
  { t: "Markus Willems, Design", s: "Portfolio", bg: "#111111", fg: "#f4f2ec", ac: "#ef4a3d", font: "'Big Shoulders Display', cursive", layout: 7, category: "Dark Luxury" },
  { t: "Startup", s: "Pitch", bg: "linear-gradient(135deg,#dfe9ff,#b9c9ff)", fg: "#2a3563", ac: "#5a6bd8", font: "'Space Grotesk', sans-serif", layout: 8, category: "Pitch Deck" },
  { t: "Company Culture", s: "Handbook", bg: "#8a5a2e", fg: "#fbead2", ac: "#ffffff", font: "'Zilla Slab', serif", layout: 9, category: "Business" },
  { t: "Tone of Voice Guidelines", s: "Brand", bg: "#c94b2d", fg: "#fdece2", ac: "#1a1310", font: "'Fraunces', serif", layout: 10, category: "Minimalist" },
  { t: "Made in the '90s", s: "Retro", bg: "#bfe3dd", fg: "#173430", ac: "#e2622f", font: "'Bricolage Grotesque', sans-serif", layout: 11, category: "Creative" },
  { t: "Pitch Deck", s: "Template", bg: "#2451e0", fg: "#eaf0ff", ac: "#ffffff", font: "'Space Grotesk', sans-serif", layout: 12, category: "Pitch Deck" },
  { t: "Short Film Festival", s: "Program", bg: "#3b3f45", fg: "#f2efe8", ac: "#e8b64a", font: "'DM Serif Display', serif", layout: 13, category: "Portfolio" },
  { t: "Sales Pitch", s: "Q3", bg: "#efe7db", fg: "#20201c", ac: "#c9663f", font: "'Cormorant Garamond', serif", layout: 14, category: "Pitch Deck" },
  { t: "Engineering Team Meeting", s: "Weekly", bg: "linear-gradient(135deg,#1c1030,#3a1a4a)", fg: "#f6eaff", ac: "#c86bf2", font: "'Unbounded', sans-serif", layout: 15, category: "Tech & AI" },
  { t: "Annual Report", s: "Finance", bg: "#101820", fg: "#eef3f6", ac: "#33c2a4", font: "'Playfair Display', serif", layout: 3, category: "Business" },
  { t: "Wedding Day", s: "Invitation", bg: "#fbf6ee", fg: "#2b2620", ac: "#a9714b", font: "'Instrument Serif', serif", layout: 4, category: "Minimalist" },
  { t: "Music Festival '26", s: "Lineup", bg: "#ff5c39", fg: "#1a0d05", ac: "#111111", font: "'Anton', sans-serif", layout: 1, category: "Creative" },
  { t: "Fashion Lookbook", s: "SS26", bg: "#efe9e2", fg: "#141210", ac: "#000000", font: "'Libre Caslon Text', serif", layout: 8, category: "Marketing" },
  { t: "Nonprofit Impact", s: "Report", bg: "#245c4a", fg: "#eafaf3", ac: "#f2c14e", font: "'Sora', sans-serif", layout: 9, category: "Education" },
  { t: "Real Estate Listing", s: "Property", bg: "#1b1b1b", fg: "#f1f1ec", ac: "#c9a24b", font: "'Zilla Slab', serif", layout: 13, category: "Business" },
  { t: "Coffee Roasters Co", s: "Brand", bg: "#3b2416", fg: "#f3e2c8", ac: "#e2ac5f", font: "'Fraunces', serif", layout: 6, category: "Marketing" },
  { t: "Fitness Program", s: "8-Week", bg: "#eaff5c", fg: "#141b06", ac: "#111111", font: "'Archivo Black', sans-serif", layout: 2, category: "Marketing" },
  { t: "Travel Itinerary", s: "Kyoto", bg: "linear-gradient(160deg,#f3d9c4,#e7a97c)", fg: "#3a1d0e", ac: "#ffffff", font: "'Cormorant Garamond', serif", layout: 5, category: "Portfolio" },
  { t: "Restaurant Menu", s: "Tasting", bg: "#171310", fg: "#f4ede2", ac: "#c9663f", font: "'DM Serif Display', serif", layout: 14, category: "Marketing" },
  { t: "Tech Conference '26", s: "Summit", bg: "#0d0f16", fg: "#e6f0ff", ac: "#4f8bff", font: "'Space Grotesk', sans-serif", layout: 12, category: "Tech & AI" },
  { t: "Podcast Launch", s: "Episode 01", bg: "#4a2ea3", fg: "#f1ecff", ac: "#f2c14e", font: "'Sora', sans-serif", layout: 15, category: "Creative" },
  { t: "Art Exhibition", s: "Gallery", bg: "#f4f2ec", fg: "#161513", ac: "#c94b2d", font: "'Playfair Display', serif", layout: 4, category: "Minimalist" },
  { t: "Yoga Retreat", s: "Bali", bg: "linear-gradient(160deg,#e3ded1,#c7bfa8)", fg: "#33301f", ac: "#6b6045", font: "'Instrument Serif', serif", layout: 8, category: "Portfolio" },
  { t: "Book Club Picks", s: "Autumn", bg: "#efe7db", fg: "#20201c", ac: "#5a4632", font: "'Libre Caslon Text', serif", layout: 9, category: "Minimalist" },
  { t: "Wine Tasting Notes", s: "Vintage", bg: "#3a0d16", fg: "#f7e5e5", ac: "#d99a3a", font: "'DM Serif Display', serif", layout: 10, category: "Dark Luxury" },
  { t: "Space Mission Log", s: "Orbit-9", bg: "#05070f", fg: "#dfe8ff", ac: "#5cf2c8", font: "'JetBrains Mono', monospace", layout: 3, category: "Tech & AI" },
  { t: "Ocean Conservation", s: "Field Notes", bg: "#0d3b4a", fg: "#e2f5f7", ac: "#5cd9e8", font: "'Sora', sans-serif", layout: 6, category: "Education" },
  { t: "Vintage Radio Hour", s: "Broadcast", bg: "#e7dcc4", fg: "#2b2110", ac: "#7a3b23", font: "'Zilla Slab', serif", layout: 14, category: "Creative" },
  { t: "Neon Nightlife", s: "After Dark", bg: "#0a0a0f", fg: "#ffffff", ac: "#ff2fb0", font: "'Unbounded', sans-serif", layout: 15, category: "Dark Luxury" },
  { t: "Botanical Garden", s: "Seasonal Guide", bg: "#eef0e2", fg: "#1e2a15", ac: "#4c7a3d", font: "'Fraunces', serif", layout: 11, category: "Minimalist" },
  { t: "Skateboard Co", s: "Drop 04", bg: "#eaff5c", fg: "#111111", ac: "#000000", font: "'Anton', sans-serif", layout: 1, category: "Creative" },
  { t: "Jazz Night", s: "Live Session", bg: "#171012", fg: "#f2e8d8", ac: "#c9a24b", font: "'Playfair Display', serif", layout: 13, category: "Dark Luxury" },
  { t: "Studio Halden", s: "Architecture", bg: "#c3c8bd", fg: "#181a15", ac: "#3a3f33", font: "'Big Shoulders Display', cursive", layout: 7, category: "Minimalist" },
  { t: "Culinary School", s: "Prospectus", bg: "#efe7db", fg: "#20201c", ac: "#b8482f", font: "'Cormorant Garamond', serif", layout: 4, category: "Education" },
  { t: "Portfolio 2026", s: "Photography", bg: "#0b0b0b", fg: "#f1f1ec", ac: "#ffffff", font: "'Instrument Serif', serif", layout: 13, category: "Portfolio" },
  { t: "Climate Report", s: "Q2 Findings", bg: "#101d16", fg: "#e6f5ea", ac: "#78d99a", font: "'Space Grotesk', sans-serif", layout: 3, category: "Business" },
  { t: "Crypto Whitepaper", s: "v2.0", bg: "#0d0d12", fg: "#e6e6f5", ac: "#8f7cf2", font: "'JetBrains Mono', monospace", layout: 12, category: "Tech & AI" },
  { t: "Museum Tour", s: "Modern Wing", bg: "#f4f2ec", fg: "#161513", ac: "#c9663f", font: "'DM Serif Display', serif", layout: 8, category: "Education" },
  { t: "Concept EV", s: "Car Launch", bg: "linear-gradient(150deg,#151515,#2a2a2a)", fg: "#f2f2f2", ac: "#4fd1ff", font: "'Unbounded', sans-serif", layout: 2, category: "Tech & AI" },
  { t: "Fleur", s: "Perfume", bg: "#f6ece7", fg: "#3a231e", ac: "#b3644c", font: "'Instrument Serif', serif", layout: 10, category: "Dark Luxury" },
  { t: "Streetwear Drop", s: "Capsule 03", bg: "#111111", fg: "#eaff5c", ac: "#ffffff", font: "'Archivo Black', sans-serif", layout: 1, category: "Creative" },
  { t: "Meditation App", s: "Onboarding", bg: "linear-gradient(160deg,#dce9e4,#a9c9be)", fg: "#1c3a30", ac: "#3d6b57", font: "'Sora', sans-serif", layout: 5, category: "Minimalist" },
  { t: "Robotics Lab", s: "R&D Update", bg: "#0d0f12", fg: "#e8ebee", ac: "#f2a13b", font: "'Space Grotesk', sans-serif", layout: 12, category: "Tech & AI" },
  { t: "Class of 2026", s: "Graduation", bg: "#1a1033", fg: "#f1ecff", ac: "#f2c14e", font: "'Playfair Display', serif", layout: 15, category: "Education" }
];

// Helper to convert RawDeckData to full SlideTemplate object
const buildSlideTemplates = (): SlideTemplate[] => {
  return RAW_DECKS.map((d, i) => {
    const slidesCount = 10 + (i % 12);
    const authorName = i % 3 === 0 ? "Worldilm AI Studio" : i % 2 === 0 ? "Pitch Design Studio" : "Creative Director";

    // Generate unique and distinct content for ALL slides in the deck
    const generateUniqueSlides = (deckTopic: string, category: string, totalCount: number): SlideContent[] => {
      const slides: SlideContent[] = [];

      const slideTopics = [
        {
          badge: "Title Cover",
          type: "title" as const,
          title: deckTopic,
          subtitle: `${d.s} — Complete Strategic Presentation Deck`,
          bullets: [
            `Author & Lead Presenter: ${authorName}`,
            `Category Architecture: ${category}`,
            `Design System: Custom typography in ${d.font.replace(/,.*$/, "").replace(/['"]/g, "")}`
          ],
          stat: { value: `${totalCount} Slides`, label: "Complete Deck" }
        },
        {
          badge: "Executive Agenda",
          type: "grid" as const,
          title: "01. Executive Agenda & Strategic Pillars",
          subtitle: `Key focus areas, methodology, and target outcomes for ${deckTopic}.`,
          bullets: [
            "Pillar A: Market Intelligence & Audience Positioning",
            "Pillar B: Technological Innovation & Scalable Architecture",
            "Pillar C: Operational Efficiency & Performance Tracking"
          ],
          stat: { value: `${88 + (i % 10)}%`, label: "Target Efficiency" }
        },
        {
          badge: "Market Dynamics",
          type: "stat" as const,
          title: "02. Global Market Landscape & Addressable Opportunity",
          subtitle: "Quantitative analysis of addressable market size and core growth vectors.",
          bullets: [
            "Expanding addressable market driven by digital transformation demand",
            "High-margin customer segments seeking integrated enterprise solutions",
            "Favorable regulatory tailwinds accelerating market adoption"
          ],
          stat: { value: `$${(i * 2.4 + 4.5).toFixed(1)}B`, label: "Addressable TAM" }
        },
        {
          badge: "Problem Statement",
          type: "split" as const,
          title: "03. Core Industry Friction & Operational Challenges",
          subtitle: "Current systemic bottlenecks preventing optimal performance in legacy workflows.",
          bullets: [
            "Fragmented data silos leading to increased operational latency",
            "High maintenance overhead and lack of real-time visibility",
            "Scalability ceilings in existing traditional infrastructure"
          ],
          stat: { value: `${60 + (i % 25)}%`, label: "Cost Inefficiency" }
        },
        {
          badge: "Solution Architecture",
          type: "grid" as const,
          title: "04. Proprietary Solution & Core Capabilities",
          subtitle: `Engineered framework providing transformative results for ${deckTopic}.`,
          bullets: [
            "Automated pipeline orchestrating complex enterprise workflows",
            "Real-time analytics engine with predictive decision intelligence",
            "Seamless multi-platform integration with zero-downtime deployment"
          ],
          stat: { value: `${3.5 + (i % 4) * 0.5}x`, label: "Throughput Boost" }
        },
        {
          badge: "Product Deep-Dive",
          type: "stat" as const,
          title: "05. Key Feature Suite & Technological Moats",
          subtitle: "Differentiated functional capabilities providing long-term competitive protection.",
          bullets: [
            "Enterprise-grade encryption and end-to-end security compliance",
            "Low-latency response times optimized for high-concurrency environments",
            "Customizable user controls with granular role-based access"
          ],
          stat: { value: "99.99%", label: "Platform Availability" }
        },
        {
          badge: "Business Model",
          type: "split" as const,
          title: "06. Monetization Strategy & Unit Economics",
          subtitle: "Scalable revenue engine backed by strong customer retention metrics.",
          bullets: [
            "Recurring SaaS subscription models tailored for mid-market and enterprise",
            "High expansion revenue driven by feature tier upgrades and volume API usage",
            "Healthy gross margin profile with attractive payback periods"
          ],
          stat: { value: `$${120 + i * 15}K`, label: "Average Contract (ACV)" }
        },
        {
          badge: "Go-To-Market",
          type: "roadmap" as const,
          title: "07. Go-To-Market Strategy & Acquisition Channels",
          subtitle: "Multi-pronged customer acquisition strategy maximizing brand penetration.",
          bullets: [
            "Direct enterprise sales force targeting strategic high-value accounts",
            "Inbound content marketing and developer-led community adoption",
            "Strategic partner ecosystem and cloud marketplace co-selling"
          ],
          stat: { value: `${30 + (i % 20)}%`, label: "MoM Growth Target" }
        },
        {
          badge: "Competitive Edge",
          type: "grid" as const,
          title: "08. Competitive Matrix & Strategic Positioning",
          subtitle: "How our platform outperforms traditional alternatives across key metrics.",
          bullets: [
            "Speed to Value: Deployed in days rather than quarters",
            "Cost Efficiency: 50% lower total cost of ownership (TCO)",
            "User Satisfaction: Superior UX with industry-leading NPS ratings"
          ],
          stat: { value: "+72 NPS", label: "Customer Advocacy" }
        },
        {
          badge: "Financial Forecast",
          type: "stat" as const,
          title: "09. 3-Year Financial Forecast & Revenue Trajectory",
          subtitle: "Projected revenue milestones, EBITDA margins, and capital requirements.",
          bullets: [
            "Year 1: Foundation building and core market penetration",
            "Year 2: Scaled expansion across adjacent industry verticals",
            "Year 3: Global commercial dominance and ecosystem expansion"
          ],
          stat: { value: `$${(i * 3.5 + 8.0).toFixed(1)}M`, label: "ARR Forecast Horizon" }
        },
        {
          badge: "Execution Timeline",
          type: "roadmap" as const,
          title: "10. Implementation Roadmap & Milestones",
          subtitle: "Phased deployment schedule ensuring structured progress and risk mitigation.",
          bullets: [
            "Phase 1 (Months 1-3): Platform onboarding & infrastructure alignment",
            "Phase 2 (Months 4-6): Feature rollout & stakeholder feedback loops",
            "Phase 3 (Months 7-12): Global scale-out & continuous performance optimization"
          ],
          stat: { value: "3 Phases", label: "Structured Rollout" }
        },
        {
          badge: "Governance & Risk",
          type: "split" as const,
          title: "11. Security Protocols & Operational Governance",
          subtitle: "Comprehensive risk management framework protecting data and business continuity.",
          bullets: [
            "SOC2 Type II, GDPR, and HIPAA compliant data governance",
            "Continuous automated vulnerability audits and failover redundancies",
            "Dedicated compliance team ensuring active regulatory adherence"
          ],
          stat: { value: "Zero Failures", label: "Audit Benchmark" }
        },
        {
          badge: "Leadership Team",
          type: "grid" as const,
          title: "12. Organizational Structure & Leadership Pillars",
          subtitle: "Cross-functional team of industry veterans and technical visionaries.",
          bullets: [
            "Executive Leadership: Decades of domain expertise and successful exits",
            "Engineering & Product: Top-tier talent from global technology leaders",
            "Advisory Board: Key industry figures guiding strategic expansion"
          ],
          stat: { value: "45+ Specialists", label: "Global Team" }
        },
        {
          badge: "Investment Thesis",
          type: "stat" as const,
          title: "13. Capital Allocation & Strategic Return on Investment",
          subtitle: "Clear capital deployment plan maximizing long-term shareholder value.",
          bullets: [
            "40% Allocated to Product R&D and AI Engine Optimization",
            "35% Allocated to Go-To-Market Expansion & Enterprise Sales",
            "25% Allocated to Strategic Operations & Global Infrastructure"
          ],
          stat: { value: `${250 + (i % 10) * 20}%`, label: "Projected ROI" }
        },
        {
          badge: "Future Horizons",
          type: "split" as const,
          title: "14. Long-Term Vision & Next-Generation Capabilities",
          subtitle: `Building the future of ${deckTopic} with continuous innovation.`,
          bullets: [
            "Autonomous self-healing workflows powered by agentic AI",
            "Global ecosystem integrations creating compounding network effects",
            "Sustained market leadership through continuous product iteration"
          ],
          stat: { value: "2026-2030", label: "Innovation Era" }
        },
        {
          badge: "Executive Summary",
          type: "title" as const,
          title: "15. Action Plan & Next Steps",
          subtitle: "Key takeaways and actionable next steps to initiate strategic alignment.",
          bullets: [
            "Confirm timeline & resource allocation for Phase 1 execution",
            "Schedule kickoff workshop with core engineering & business leads",
            "Finalize partnership agreements and compliance sign-offs"
          ],
          stat: { value: "Ready to Launch", label: "Execution Status" }
        }
      ];

      for (let j = 0; j < totalCount; j++) {
        if (j < slideTopics.length) {
          slides.push(slideTopics[j]);
        } else {
          const extraIdx = j + 1;
          const types: ("grid" | "stat" | "split" | "roadmap")[] = ["grid", "stat", "split", "roadmap"];
          const currentType = types[j % types.length];
          slides.push({
            badge: `Strategic Topic ${extraIdx}`,
            type: currentType,
            title: `${extraIdx < 10 ? "0" + extraIdx : extraIdx}. Strategic Pillar & Performance Benchmark ${extraIdx}`,
            subtitle: `Deep-dive insights and actionable strategy for ${deckTopic} (Section ${extraIdx}).`,
            bullets: [
              `Quantitative performance metric #${extraIdx} optimized for scale`,
              `Automated operational workflow supporting multi-region deployment`,
              `Continuous monitoring and feedback integration across teams`
            ],
            stat: { value: `${extraIdx * 12}%`, label: `Benchmark ${extraIdx}` }
          });
        }
      }

      return slides;
    };

    return {
      id: `deck-${i + 1}`,
      title: d.t,
      category: d.category,
      slidesCount,
      author: authorName,
      authorBadge: i % 4 === 0 ? "Featured" : i % 3 === 0 ? "Trending" : "Pro Deck",
      tagline: `${d.s} • ${slidesCount} Slides`,
      description: `Tailored ${d.category.toLowerCase()} presentation deck with editable layouts, signature typography, and custom visual styling.`,
      raw: d,
      samplePrompt: `Generate a complete presentation deck for "${d.t}" with executive summaries, strategy pillars, quantitative metrics, and milestone roadmap.`,
      slides: generateUniqueSlides(d.t, d.category, slidesCount)
    };
  });
};

const ALL_SLIDE_TEMPLATES = buildSlideTemplates();

// React renderer for 15 layout covers
const RenderCoverContent: React.FC<{ raw: RawDeckData }> = ({ raw }) => {
  const { t, s, bg, fg, ac, font, layout } = raw;

  switch (layout) {
    case 1:
      // Bold flat color block, big title bottom-left, label top
      return (
        <div
          className="w-full h-full p-3 sm:p-4 flex flex-col justify-between relative overflow-hidden select-none"
          style={{ background: bg, color: fg }}
        >
          <div
            className="text-[9px] sm:text-[11px] font-mono uppercase tracking-widest font-extrabold"
            style={{ color: ac }}
          >
            {s}
          </div>
          <div
            className="text-base sm:text-xl font-black uppercase tracking-tight leading-none mt-auto"
            style={{ fontFamily: font }}
          >
            {t}
          </div>
        </div>
      );

    case 2:
      // Near-black, neon accent card center-right
      return (
        <div
          className="w-full h-full p-3 sm:p-4 flex flex-col justify-between relative overflow-hidden select-none"
          style={{ background: bg, color: fg }}
        >
          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-1/4 h-2/3 rounded-lg shadow-md" style={{ background: ac }} />
          <div className="mt-auto z-10">
            <div className="text-sm sm:text-lg font-extrabold uppercase leading-tight" style={{ fontFamily: font }}>
              {t}
            </div>
            <div className="text-[9px] sm:text-[10px] opacity-70 mt-1">{s}</div>
          </div>
        </div>
      );

    case 3:
      // Split diagonal two-tone with circle badge
      return (
        <div
          className="w-full h-full p-3 sm:p-4 flex flex-col justify-between relative overflow-hidden select-none"
          style={{ background: bg, color: fg }}
        >
          <div
            className="absolute inset-0 opacity-15"
            style={{
              background: ac,
              clipPath: "polygon(58% 0, 100% 0, 100% 100%, 32% 100%)"
            }}
          />
          <div className="flex items-center justify-between z-10">
            <span className="text-[9px] sm:text-[10px] font-mono opacity-80 uppercase">{s}</span>
            <div className="w-4 h-4 rounded-full border-2" style={{ borderColor: ac }} />
          </div>
          <div className="text-sm sm:text-lg font-bold leading-tight mt-auto z-10" style={{ fontFamily: font }}>
            {t}
          </div>
        </div>
      );

    case 4:
      // Minimal cream centered mono, progress bar
      return (
        <div
          className="w-full h-full p-3 sm:p-4 flex flex-col justify-between relative overflow-hidden select-none"
          style={{ background: bg, color: fg }}
        >
          <div className="text-[9px] sm:text-[10px] opacity-60 font-mono uppercase">{s}</div>
          <div className="my-auto text-center px-2">
            <div className="text-xs sm:text-base font-extrabold tracking-tight" style={{ fontFamily: font }}>
              {t}
            </div>
            <div className="w-1/2 h-1 bg-black/10 mx-auto mt-2 rounded-full overflow-hidden">
              <div className="w-2/3 h-full" style={{ background: ac }} />
            </div>
          </div>
        </div>
      );

    case 5:
      // Photo-like gradient, overlay bottom title
      return (
        <div
          className="w-full h-full p-3 sm:p-4 flex flex-col justify-end relative overflow-hidden select-none"
          style={{ background: bg, color: fg }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="relative z-10">
            <div className="text-sm sm:text-lg font-extrabold leading-tight" style={{ fontFamily: font }}>
              {t}
            </div>
            <div className="text-[9px] sm:text-[10px] font-mono font-bold mt-1" style={{ color: ac }}>
              {s}
            </div>
          </div>
        </div>
      );

    case 6:
      // Pastel with floating shapes collage
      return (
        <div
          className="w-full h-full p-3 sm:p-4 flex flex-col justify-between relative overflow-hidden select-none"
          style={{ background: bg, color: fg }}
        >
          <div className="absolute top-2 left-3 w-7 h-7 rounded-full opacity-80" style={{ background: ac }} />
          <div className="absolute top-4 right-4 w-6 h-6 rounded-md opacity-20 rotate-12" style={{ background: fg }} />
          <div className="mt-auto z-10">
            <div className="text-sm sm:text-lg font-bold leading-tight" style={{ fontFamily: font }}>
              {t}
            </div>
            <div className="text-[9px] opacity-70 mt-0.5">{s}</div>
          </div>
        </div>
      );

    case 7:
      // Huge stacked type, dot accent
      return (
        <div
          className="w-full h-full p-3 sm:p-4 flex flex-col justify-between relative overflow-hidden select-none"
          style={{ background: bg, color: fg }}
        >
          <div className="flex items-center justify-between z-10">
            <span className="text-[9px] font-mono opacity-70 uppercase">{s}</span>
            <div className="w-3 h-3 rounded-full" style={{ background: ac }} />
          </div>
          <div className="text-base sm:text-xl font-black uppercase leading-none mt-auto z-10" style={{ fontFamily: font }}>
            {t}
          </div>
        </div>
      );

    case 8:
      // Soft gradient blob, centered word, small tag
      return (
        <div
          className="w-full h-full p-3 sm:p-4 flex flex-col justify-between relative overflow-hidden select-none"
          style={{ background: bg, color: fg }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-1/2 h-1/2 rounded-full blur-sm opacity-30" style={{ background: ac }} />
          </div>
          <div className="my-auto text-center z-10 px-1">
            <div className="text-sm sm:text-lg font-extrabold leading-tight" style={{ fontFamily: font }}>
              {t}
            </div>
          </div>
          <div className="text-[9px] opacity-60 font-mono z-10">{s}</div>
        </div>
      );

    case 9:
      // Warm photo rows, bottom-left white title chip
      return (
        <div
          className="w-full h-full p-2.5 sm:p-3 flex flex-col justify-end relative overflow-hidden select-none"
          style={{ background: bg }}
        >
          <div className="bg-white text-zinc-900 p-2 sm:p-3 rounded-lg max-w-[85%] shadow-md z-10">
            <div className="text-xs sm:text-sm font-bold leading-tight" style={{ fontFamily: font }}>
              {t}
            </div>
            <div className="text-[8px] sm:text-[9px] font-mono font-bold mt-1" style={{ color: ac }}>
              {s}
            </div>
          </div>
        </div>
      );

    case 10:
      // Dark bg, big outlined circle, quote-style centered
      return (
        <div
          className="w-full h-full p-3 sm:p-4 flex flex-col justify-between relative overflow-hidden select-none"
          style={{ background: bg, color: fg }}
        >
          <div
            className="absolute inset-0 m-auto w-3/4 h-3/4 rounded-full border border-dashed opacity-40"
            style={{ borderColor: ac }}
          />
          <div className="my-auto text-center italic z-10 px-2">
            <div className="text-xs sm:text-base font-bold leading-tight" style={{ fontFamily: font }}>
              "{t}"
            </div>
          </div>
          <div className="text-[9px] opacity-60 font-mono z-10">{s}</div>
        </div>
      );

    case 11:
      // Mosaic grid squares with floating title card
      return (
        <div
          className="w-full h-full p-3 sm:p-4 flex flex-col justify-center relative overflow-hidden select-none"
          style={{ background: bg, color: fg }}
        >
          <div className="border border-white/20 p-2.5 sm:p-3 rounded-md bg-black/20 backdrop-blur-xs z-10 max-w-[80%]">
            <div className="text-xs sm:text-base font-bold leading-tight" style={{ fontFamily: font }}>
              {t}
            </div>
            <div className="text-[9px] font-mono font-bold mt-1" style={{ color: ac }}>
              {s}
            </div>
          </div>
        </div>
      );

    case 12:
      // Colored bg + browser/phone mockup window beside title
      return (
        <div
          className="w-full h-full p-3 sm:p-4 flex items-center justify-between relative overflow-hidden select-none"
          style={{ background: bg, color: fg }}
        >
          <div className="w-1/2 pr-1 z-10">
            <div className="text-[8px] font-mono opacity-70 mb-1">{s}</div>
            <div className="text-xs sm:text-base font-extrabold leading-tight" style={{ fontFamily: font }}>
              {t}
            </div>
          </div>
          <div className="w-1/3 h-3/4 bg-white/90 rounded-md p-1.5 shadow-md flex flex-col justify-around z-10">
            <div className="w-full h-1.5 bg-zinc-300 rounded-xs" />
            <div className="w-3/4 h-1.5 bg-zinc-300 rounded-xs" />
            <div className="w-1/2 h-1.5 rounded-xs" style={{ background: ac }} />
          </div>
        </div>
      );

    case 13:
      // Duotone style, bottom title with thin accent line
      return (
        <div
          className="w-full h-full p-3 sm:p-4 flex flex-col justify-end relative overflow-hidden select-none"
          style={{ background: bg, color: fg }}
        >
          <div className="w-1/4 h-0.5 mb-2" style={{ background: ac }} />
          <div className="text-xs sm:text-base font-serif italic leading-tight" style={{ fontFamily: font }}>
            {t}
          </div>
          <div className="text-[9px] opacity-60 font-mono mt-1">{s}</div>
        </div>
      );

    case 14:
      // Cream bg with abstract circle shape & side title
      return (
        <div
          className="w-full h-full p-3 sm:p-4 flex flex-col justify-between relative overflow-hidden select-none"
          style={{ background: bg, color: fg }}
        >
          <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-1/2 h-full rounded-full opacity-80" style={{ background: ac }} />
          <div className="text-[9px] font-mono opacity-70 z-10">{s}</div>
          <div className="text-xs sm:text-base font-bold leading-tight mt-auto z-10 max-w-[65%]" style={{ fontFamily: font }}>
            {t}
          </div>
        </div>
      );

    case 15:
    default:
      // Dark gradient with soft ambient glow & spaced title
      return (
        <div
          className="w-full h-full p-3 sm:p-4 flex flex-col justify-between relative overflow-hidden select-none"
          style={{ background: bg, color: fg }}
        >
          <div className="text-[9px] font-mono opacity-70 z-10">{s}</div>
          <div className="text-xs sm:text-base font-extrabold tracking-tight leading-tight mt-auto z-10" style={{ fontFamily: font }}>
            {t}
          </div>
        </div>
      );
  }
};

const isLightColor = (colorStr: string): boolean => {
  if (!colorStr) return false;
  const str = colorStr.toLowerCase();
  if (
    str.includes("fff") ||
    str.includes("f4") ||
    str.includes("f5") ||
    str.includes("f8") ||
    str.includes("fbe") ||
    str.includes("fde") ||
    str.includes("ea") ||
    str.includes("ee") ||
    str.includes("ef") ||
    str.includes("white")
  ) {
    return true;
  }
  if (str.startsWith("#") && str.length === 7) {
    const r = parseInt(str.slice(1, 3), 16);
    const g = parseInt(str.slice(3, 5), 16);
    const b = parseInt(str.slice(5, 7), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 150;
  }
  return false;
};

const getVisibleAccentColor = (ac: string): string => {
  if (!ac) return "#d97706";
  const clean = ac.trim().toLowerCase();
  if (
    clean === "#ffffff" ||
    clean === "#fff" ||
    clean === "rgb(255,255,255)" ||
    clean === "white"
  ) {
    return "#d97706"; // warm amber fallback for light paper slides
  }
  return ac;
};

const PROMPT_PRESETS = [
  {
    label: "Series A Pitch",
    icon: "💼",
    purpose: "Investor Pitch Deck",
    tone: "Visionary & High-Growth",
    audience: "Investors & Venture Capitalists",
    slides: 20,
    accent: "#4f46e5",
    prompt: "Create a 20-slide Tier-1 Series A Investor Pitch Deck on Autonomous Cloud Security & Threat Remediation. Include TAM/SAM/SOM market sizing, proprietary neural core architecture diagram, unit economics & CAC/LTV payback, conversion funnel, 4-quarter enterprise roadmap, and competitive moat matrix."
  },
  {
    label: "AI Architecture",
    icon: "🏗️",
    purpose: "Technical Architecture & Deep-Dive",
    tone: "Technical & Precise",
    audience: "Technical Architects & Engineering",
    slides: 20,
    accent: "#0891b2",
    prompt: "Build an in-depth 20-slide Technical Architecture Blueprint for Enterprise MLOps & LLM Orchestration Engine. Cover distributed vector retrieval pipelines, low-latency inferencing clusters, multi-tier data security boundaries, failure recovery workflows, and latency benchmarks."
  },
  {
    label: "B2B SaaS GTM",
    icon: "🚀",
    purpose: "Product Launch & GTM",
    tone: "Executive & Analytical",
    audience: "Enterprise Buyers & Commercial Clients",
    slides: 20,
    accent: "#059669",
    prompt: "Develop a rigorous 20-slide B2B SaaS Go-To-Market and Commercial Expansion Deck. Include ideal customer profile (ICP) segmentation, multi-channel inbound/outbound conversion funnels, sales velocity scorecards, enterprise pricing tiers, and global scaling milestones."
  },
  {
    label: "Board Review & OKRs",
    icon: "📊",
    purpose: "Board of Directors Review",
    tone: "Executive & Analytical",
    audience: "Executive C-Suite & Board",
    slides: 20,
    accent: "#d97706",
    prompt: "Generate a 20-slide Executive Board of Directors Review Deck covering Q4 Financial Performance, ARR Expansion, Net Revenue Retention (NRR), Unit Economics, Enterprise Risk Governance, and Strategic OKR Roadmap for FY2027."
  },
  {
    label: "Cyber Resilience",
    icon: "🛡️",
    purpose: "Executive Strategy & Pitch",
    tone: "Technical & Precise",
    audience: "Executive C-Suite & Board",
    slides: 20,
    accent: "#e11d48",
    prompt: "Design a comprehensive 20-slide Zero-Trust Cybersecurity & SOC-2 Compliance Deck. Cover endpoint telemetry architectures, zero-trust network boundaries, threat incident response playbooks, risk mitigation matrices, and compliance audit schedules."
  },
  {
    label: "Biotech Breakthrough",
    icon: "🧬",
    purpose: "Executive Strategy & Pitch",
    tone: "Visionary & High-Growth",
    audience: "Investors & Venture Capitalists",
    slides: 20,
    accent: "#7c3aed",
    prompt: "Create an authoritative 20-slide Presentation on AI-Accelerated Molecular Drug Discovery & Precision Therapeutics. Include clinical trial milestone pathways, target engagement metrics, regulatory approval roadmaps, and intellectual property defensibility."
  },
  {
    label: "Clean Energy Grid",
    icon: "⚡",
    purpose: "Market Research & KPIs",
    tone: "Executive & Analytical",
    audience: "Executive C-Suite & Board",
    slides: 20,
    accent: "#059669",
    prompt: "Design a 20-slide Industrial Decarbonization & Grid-Scale Battery Energy Storage Strategy Deck. Detail carbon offset quantitative metrics, levelized cost of storage (LCOS), regulatory compliance mandates, and deployment timeline across utility hubs."
  },
  {
    label: "FinTech Banking",
    icon: "🏦",
    purpose: "Executive Strategy & Pitch",
    tone: "Executive & Analytical",
    audience: "Enterprise Buyers & Commercial Clients",
    slides: 20,
    accent: "#334155",
    prompt: "Construct a 20-slide Next-Generation Digital Banking & Instant Settlement Platform Deck. Cover core ledger architecture, cross-border payment latency benchmarks, fraud detection neural networks, and liquidity risk controls."
  }
];

const PALETTE_SWATCHES = [
  { name: "Indigo Tech", color: "#4f46e5" },
  { name: "Emerald Growth", color: "#059669" },
  { name: "Crimson Executive", color: "#e11d48" },
  { name: "Amber Capital", color: "#d97706" },
  { name: "Cyber Cyan", color: "#0891b2" },
  { name: "Royal Violet", color: "#7c3aed" },
  { name: "Titanium Slate", color: "#334155" },
  { name: "Midnight Gold", color: "#b45309" },
  { name: "Forest Teal", color: "#0f766e" },
  { name: "Rose Quartz", color: "#be185d" }
];

const AI_THINKING_PHASES = [
  "Structuring high-concept executive narrative & strategic thesis...",
  "Calculating domain quantitative benchmarks & financial metrics...",
  "Synthesizing 4-pillar bento frameworks & organizational pillars...",
  "Engineering multi-tier process diagrams & progressive roadmaps...",
  "Formulating comparative matrices, risk governance & mitigation controls...",
  "Polishing high-DPI vector canvas typography & palette harmony..."
];

export interface SlidesStudioProps {
  onSelectAndContinue: (slide: SlideTemplate, details?: PresentationDetails) => void;
  onBackToChat: () => void;
}

export const SlidesStudio: React.FC<SlidesStudioProps> = ({
  onSelectAndContinue,
  onBackToChat
}) => {
  const [step, setStep] = useState<"select" | "details" | "generating" | "pdf_ready">("select");
  const [searchQuery, setSearchQuery] = useState("");
  const [chosenSlideId, setChosenSlideId] = useState<string | null>(null);

  // Details Form State
  const [authorName, setAuthorName] = useState("");
  const [authorRole, setAuthorRole] = useState("");
  const [authorOrg, setAuthorOrg] = useState("");
  const [topicName, setTopicName] = useState("");
  const [subtopics, setSubtopics] = useState<string[]>([
    "Executive Overview & Core Objectives",
    "Market Analysis & Key Innovation Pillars",
    "Strategic Implementation & Roadmap"
  ]);
  const [additionalDetails, setAdditionalDetails] = useState<
    { id: string; label: string; value: string }[]
  >([]);
  const [showValidationErrors, setShowValidationErrors] = useState(false);

  // Custom Prompt, Purpose, Slide Count, and Color Theme State
  const [customPrompt, setCustomPrompt] = useState("");
  const [purpose, setPurpose] = useState("Executive Strategy & Pitch");
  const [tone, setTone] = useState("Executive & Analytical");
  const [audience, setAudience] = useState("Executive C-Suite & Board");
  const [deckStructure, setDeckStructure] = useState("balanced");
  const [targetSlideCount, setTargetSlideCount] = useState<number>(20);
  const [customAccentColor, setCustomAccentColor] = useState<string>("#4f46e5");
  const [customBgTheme, setCustomBgTheme] = useState<"white" | "dark" | "warm" | "navy">("white");
  const [showAdvancedCustomizer, setShowAdvancedCustomizer] = useState(false);

  // Custom Create Prompt Bar Modal & File Attachment State
  const [isCustomCreateModalOpen, setIsCustomCreateModalOpen] = useState(false);
  const [uploadedDeckFiles, setUploadedDeckFiles] = useState<UploadedDeckSourceFile[]>([]);
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const customFileInputRef = useRef<HTMLInputElement>(null);

  // Process uploaded files for slide generation
  const handleProcessUploadedFiles = async (files: FileList | File[]) => {
    const newFilesList: UploadedDeckSourceFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileId = `deck_file_${Date.now()}_${i}`;
      let fileContent = "";

      const isTextFile =
        file.type.startsWith("text/") ||
        file.name.endsWith(".txt") ||
        file.name.endsWith(".md") ||
        file.name.endsWith(".markdown") ||
        file.name.endsWith(".csv") ||
        file.name.endsWith(".json") ||
        file.name.endsWith(".ts") ||
        file.name.endsWith(".js") ||
        file.name.endsWith(".py") ||
        file.name.endsWith(".html") ||
        file.name.endsWith(".xml") ||
        file.name.endsWith(".yaml") ||
        file.name.endsWith(".yml");

      if (isTextFile) {
        try {
          fileContent = await file.text();
        } catch (err) {
          console.warn("Could not read text of file:", file.name, err);
          fileContent = `[Attached text file: ${file.name} (${Math.round(file.size / 1024)} KB)]`;
        }
      } else {
        fileContent = `[Source document attached: ${file.name}, format: ${file.type || "document/binary"}, size: ${Math.round(file.size / 1024)} KB]`;
      }

      newFilesList.push({
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type || "application/octet-stream",
        content: fileContent
      });
    }

    setUploadedDeckFiles((prev) => [...prev, ...newFilesList]);
  };

  const handleRemoveUploadedFile = (id: string) => {
    setUploadedDeckFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const formatDeckFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleTriggerCustomCreate = () => {
    let effectiveTopic = topicName.trim();
    if (!effectiveTopic) {
      if (customPrompt.trim()) {
        effectiveTopic = customPrompt.trim().split("\n")[0].slice(0, 65).replace(/^[#*-.\s]+/, "");
      } else if (uploadedDeckFiles.length > 0) {
        effectiveTopic = uploadedDeckFiles[0].name.replace(/\.[^/.]+$/, "").replace(/[-_]+/g, " ");
      } else {
        effectiveTopic = "Executive Strategy & Action Plan";
      }
    }

    let combinedInstructions = customPrompt.trim();
    if (uploadedDeckFiles.length > 0) {
      const fileSnippets = uploadedDeckFiles
        .map((f) => {
          const trimmedContent = f.content.length > 6000 ? f.content.substring(0, 6000) + "\n...[truncated]" : f.content;
          return `\n\n--- ATTACHED SOURCE FILE: ${f.name} (${formatDeckFileSize(f.size)}) ---\n${trimmedContent}`;
        })
        .join("\n");
      combinedInstructions += `\n\nSOURCE REFERENCE MATERIALS & ATTACHED DOCUMENTS:\n${fileSnippets}`;
    }

    const overrideConfig: Partial<SlideDeckConfig> = {
      topicName: effectiveTopic,
      authorName: authorName.trim() || "Worldilm AI Presenter",
      authorRole: authorRole.trim() || "Lead Presentation Strategist",
      authorOrg: authorOrg.trim() || "Worldilm AI Studio",
      targetSlideCount: targetSlideCount,
      purpose: purpose,
      tone: tone,
      audience: audience,
      deckStructure: deckStructure,
      accentColor: customAccentColor,
      customPrompt: customPrompt.trim(),
      customInstructions: combinedInstructions
    };

    setIsCustomCreateModalOpen(false);
    startAiGenerationAndPdf(overrideConfig);
  };

  // AI Code Generation State
  const [generationProgress, setGenerationProgress] = useState<number>(0);
  const [thinkingPhaseIndex, setThinkingPhaseIndex] = useState<number>(0);
  const [generatingStatus, setGeneratingStatus] = useState<string>("");
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generatedSlides, setGeneratedSlides] = useState<StructuredSlide[]>([]);

  // Preview Modal state
  const [previewTemplate, setPreviewTemplate] = useState<SlideTemplate | null>(null);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [previewPageIndex, setPreviewPageIndex] = useState<number>(0);

  // Filter by search query
  const filteredSlides = useMemo(() => {
    if (!searchQuery.trim()) return ALL_SLIDE_TEMPLATES;
    const q = searchQuery.toLowerCase();
    return ALL_SLIDE_TEMPLATES.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.tagline.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Currently chosen template
  const chosenTemplate = useMemo(() => {
    if (!chosenSlideId) return null;
    if (chosenSlideId === "custom-create") {
      return {
        id: "custom-create",
        title: "Custom Create",
        category: "Tech & AI" as const,
        slidesCount: targetSlideCount || 20,
        author: authorName || "Worldilm AI Studio",
        authorBadge: "AI Custom",
        tagline: `AI Custom Deck • ${targetSlideCount || 20} Slides`,
        description: "Custom presentation deck generated from your prompt, topic, and requirements.",
        raw: {
          t: "Custom Create",
          s: "AI Deck",
          bg: "linear-gradient(135deg, #4f46e5, #06b6d4)",
          fg: "#ffffff",
          ac: "#38bdf8",
          font: "'Space Grotesk', sans-serif",
          layout: 15,
          category: "Tech & AI" as const
        },
        slides: [],
        samplePrompt: customPrompt || "Custom presentation deck"
      };
    }
    return ALL_SLIDE_TEMPLATES.find((t) => t.id === chosenSlideId) || null;
  }, [chosenSlideId, targetSlideCount, authorName, customPrompt]);

  // Sync author name with chosen template if author is empty
  useEffect(() => {
    if (chosenTemplate && !authorName) {
      setAuthorName(chosenTemplate.author || "");
    }
  }, [chosenTemplate]);

  // Handlers for Subtopics
  const handleAddSubtopic = () => {
    setSubtopics((prev) => [...prev, ""]);
  };

  const handleRemoveSubtopic = (index: number) => {
    if (subtopics.length <= 1) return;
    setSubtopics((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubtopicChange = (index: number, val: string) => {
    setSubtopics((prev) => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
  };

  // Handlers for Additional Details
  const handleAddCustomDetail = () => {
    setAdditionalDetails((prev) => [
      ...prev,
      { id: Math.random().toString(36).substring(2, 9), label: "", value: "" }
    ]);
  };

  const handleRemoveCustomDetail = (id: string) => {
    setAdditionalDetails((prev) => prev.filter((item) => item.id !== id));
  };

  const handleCustomDetailChange = (
    id: string,
    field: "label" | "value",
    val: string
  ) => {
    setAdditionalDetails((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: val } : item))
    );
  };

  // Toggle selection
  const handleToggleChoose = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (id === "custom-create") {
      setChosenSlideId("custom-create");
      setIsCustomCreateModalOpen(true);
      return;
    }
    if (chosenSlideId === id) {
      setChosenSlideId(null);
    } else {
      setChosenSlideId(id);
    }
  };

  // Open Preview Modal
  const handleOpenPreview = (template: SlideTemplate, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setPreviewTemplate(template);
    setPreviewPageIndex(0);
  };

  // Generate AI Structured Slides & compile to PDF
  const startAiGenerationAndPdf = async (customConfigOverride?: Partial<SlideDeckConfig>) => {
    const template = chosenTemplate || ALL_SLIDE_TEMPLATES[0];
    if (!chosenSlideId) {
      setChosenSlideId(template.id);
    }
    setStep("generating");
    setGenerationProgress(0);
    setThinkingPhaseIndex(0);
    setGenerationError(null);

    const bgMap = {
      white: "#ffffff",
      dark: "#0a0a0f",
      warm: "#fbf6ee",
      navy: "#0d1b2a"
    };

    const fgMap = {
      white: "#0f172a",
      dark: "#f8fafc",
      warm: "#2b2620",
      navy: "#f1f5f9"
    };

    const finalBg = customConfigOverride?.bgColor || (customBgTheme ? bgMap[customBgTheme] : template.raw.bg || "#ffffff");
    const finalFg = customConfigOverride?.fgColor || (customBgTheme ? fgMap[customBgTheme] : template.raw.fg || "#0f172a");
    const finalAccent = customConfigOverride?.accentColor || customAccentColor || template.accentColor || template.raw.ac || "#4f46e5";

    const config: SlideDeckConfig = {
      topicName: customConfigOverride?.topicName || topicName.trim() || customPrompt.trim() || "Executive Strategic Deck",
      authorName: customConfigOverride?.authorName || authorName.trim() || "Worldilm AI Presenter",
      authorRole: customConfigOverride?.authorRole || authorRole.trim() || "Lead Strategist",
      authorOrg: customConfigOverride?.authorOrg || authorOrg.trim() || "Worldilm AI",
      subtopics: customConfigOverride?.subtopics || subtopics.filter((s) => s.trim().length > 0),
      additionalDetails: additionalDetails.filter((d) => d.label.trim() && d.value.trim()),
      templateTitle: template.title,
      category: template.category,
      accentColor: finalAccent,
      bgColor: finalBg,
      fgColor: finalFg,
      purpose: customConfigOverride?.purpose || purpose,
      tone: customConfigOverride?.tone || tone,
      audience: customConfigOverride?.audience || audience,
      deckStructure: customConfigOverride?.deckStructure || deckStructure,
      targetSlideCount: customConfigOverride?.targetSlideCount || targetSlideCount,
      customPrompt: customConfigOverride?.customPrompt || customPrompt.trim(),
      customInstructions: customConfigOverride?.customInstructions || customPrompt.trim()
    };

    let isAsyncDone = false;
    let slidesResult: StructuredSlide[] | null = null;

    // Start background generation logic
    generateStructuredSlides(config)
      .then((res) => {
        slidesResult = res;
        isAsyncDone = true;
      })
      .catch((err) => {
        console.error("Slide generation error:", err);
        slidesResult = generateFallbackSlides(config);
        isAsyncDone = true;
      });

    // Smoothly progress timer from 0 to 100% slowly
    const progressInterval = setInterval(() => {
      setGenerationProgress((prev) => {
        if (isAsyncDone) {
          if (prev >= 98) {
            clearInterval(progressInterval);
            if (slidesResult) setGeneratedSlides(slidesResult);
            setTimeout(() => {
              setStep("pdf_ready");
            }, 300);
            return 100;
          }
          return Math.min(100, prev + 12);
        }
        // Advance smoothly from 0% up to 92%
        if (prev < 88) {
          return prev + 1.2;
        } else if (prev < 95) {
          return prev + 0.3;
        }
        return prev;
      });
    }, 85);

    // Rotate text status phases every 1.6s
    const phaseInterval = setInterval(() => {
      setThinkingPhaseIndex((prev) => (prev + 1) % AI_THINKING_PHASES.length);
    }, 1600);
  };

  // Close preview on ESC and navigate with Arrow keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!previewTemplate) return;
      if (e.key === "Escape") {
        setPreviewTemplate(null);
      } else if (e.key === "ArrowLeft") {
        setPreviewPageIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === "ArrowRight") {
        setPreviewPageIndex((prev) => Math.min(previewTemplate.slides.length - 1, prev + 1));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewTemplate]);

  if (step === "generating") {
    const currentPhaseText = AI_THINKING_PHASES[thinkingPhaseIndex % AI_THINKING_PHASES.length];

    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full bg-slate-100 dark:bg-zinc-950 p-6 relative font-sans">
        <div className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col items-center text-center relative overflow-hidden">
          
          {/* Subtle Ambient Background Glows */}
          <div className="absolute -top-16 -left-16 w-48 h-48 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-cyan-500/10 dark:bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Thinking Logo with Revolving Animated Rings (Chat Thinking Style) */}
          <div className="relative w-24 h-24 flex items-center justify-center mb-6">
            {/* Outer revolving line ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2.2, ease: "linear" }}
              className="absolute inset-0 rounded-full border-2 border-transparent border-t-indigo-600 border-r-cyan-400 p-1"
            />
            {/* Inner counter-revolving line ring */}
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ repeat: Infinity, duration: 3.5, ease: "linear" }}
              className="absolute -inset-1.5 rounded-full border border-transparent border-b-purple-500 border-l-pink-500 opacity-70"
            />
            {/* Pulsing glow background */}
            <motion.div
              animate={{ scale: [0.92, 1.08, 0.92], opacity: [0.4, 0.7, 0.4] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="absolute inset-2 rounded-full bg-gradient-to-tr from-indigo-500/20 to-cyan-500/20 blur-sm"
            />
            {/* Center Logo Icon */}
            <div className="relative z-10 w-16 h-16 bg-white dark:bg-zinc-900 rounded-2xl flex items-center justify-center shadow-lg border border-zinc-200 dark:border-zinc-800 text-indigo-600 dark:text-indigo-400">
              <Presentation size={30} className="stroke-[2.2]" />
            </div>
          </div>

          <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight mb-1 flex items-center gap-2">
            <Sparkles size={18} className="text-indigo-500 animate-pulse" />
            <span>Generating Presentation</span>
          </h2>

          {/* Smooth Text Phase Transitions */}
          <div className="h-10 flex items-center justify-center my-2 w-full overflow-hidden relative">
            <AnimatePresence mode="wait">
              <motion.p
                key={thinkingPhaseIndex}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
                className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 font-semibold tracking-wide"
              >
                {currentPhaseText}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Smooth 0% to 100% Progress Bar */}
          <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-3 rounded-full overflow-hidden relative mt-4 shadow-inner border border-zinc-200/60 dark:border-zinc-700/60">
            <motion.div
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-indigo-600 via-cyan-500 to-indigo-500 rounded-full"
              style={{ width: `${Math.min(100, Math.round(generationProgress))}%` }}
              transition={{ ease: "easeOut", duration: 0.1 }}
            />
          </div>

          <div className="mt-3 w-full flex items-center justify-between text-xs font-mono font-bold text-zinc-500 dark:text-zinc-400">
            <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-sans font-semibold">
              <Loader2 size={13} className="animate-spin" />
              <span>AI Studio Engine</span>
            </span>
            <span>{Math.min(100, Math.round(generationProgress))}%</span>
          </div>

        </div>
      </div>
    );
  }

  if (step === "pdf_ready") {
    const template = chosenTemplate || ALL_SLIDE_TEMPLATES[0];
    const bgMap = {
      white: "#ffffff",
      dark: "#0a0a0f",
      warm: "#fbf6ee",
      navy: "#0d1b2a"
    };
    const fgMap = {
      white: "#0f172a",
      dark: "#f8fafc",
      warm: "#2b2620",
      navy: "#f1f5f9"
    };

    const finalBg = customBgTheme ? bgMap[customBgTheme] : (template.raw.bg || "#ffffff");
    const finalFg = customBgTheme ? fgMap[customBgTheme] : (template.raw.fg || "#0f172a");
    const finalAccent = customAccentColor || template.accentColor || template.raw.ac || "#4f46e5";

    const config: SlideDeckConfig = {
      topicName: topicName.trim() || customPrompt.trim() || "Executive Strategic Deck",
      authorName: authorName.trim() || "Presenter",
      authorRole: authorRole.trim() || "Lead Strategist",
      authorOrg: authorOrg.trim() || "Worldilm AI",
      subtopics: subtopics.filter((s) => s.trim().length > 0),
      additionalDetails: additionalDetails.filter((d) => d.label.trim() && d.value.trim()),
      templateTitle: template.title,
      category: template.category,
      accentColor: finalAccent,
      bgColor: finalBg,
      fgColor: finalFg,
      font: template.raw.font || "'Space Grotesk', sans-serif",
      layoutNumber: template.raw.layout || 1
    };

    return (
      <InteractiveSlideViewer
        slides={generatedSlides}
        config={config}
        onRegenerate={startAiGenerationAndPdf}
        onBack={() => {
          if (chosenTemplate) {
            setStep("details");
          } else {
            setStep("select");
          }
        }}
        mode="slide"
      />
    );
  }

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
      // Auto-fill smart defaults if empty so user can generate instantly
      if (!topicName.trim()) {
        setTopicName(chosenTemplate?.title || customPrompt.trim() || "Executive Strategic Deck");
      }
      if (!authorName.trim()) {
        setAuthorName("Worldilm AI Presenter");
      }
      if (validSubtopics.length === 0) {
        setSubtopics([
          "Strategic Architecture & Core Foundations",
          "Market Dynamics & Competitive Moat",
          "Operational Framework & Process Architecture",
          "Quantitative Telemetry & Expected Yield"
        ]);
      }
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
                title="Back to Slide Selection"
              >
                <ArrowLeft size={18} className="stroke-[2.5]" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-950/80 border border-indigo-300/60 dark:border-indigo-800 px-2 py-0.5 rounded-md">
                    Step 2 of 2
                  </span>
                  <h1 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
                    Presentation Details & Agenda
                  </h1>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Provide required author details, topic name, subtopics, and optional custom details.
                </p>
              </div>
            </div>
          </div>

          {/* Selected Template Summary Banner */}
          <div className="bg-white dark:bg-zinc-900 border border-indigo-500/40 rounded-2xl p-3.5 sm:p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-16 h-11 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 shrink-0 relative bg-zinc-950">
                <RenderCoverContent raw={chosenTemplate.raw} />
              </div>
              <div>
                <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">
                  Selected Slide Layout
                </div>
                <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
                  {chosenTemplate.title}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {chosenTemplate.slidesCount} Slides • {chosenTemplate.category}
                </p>
              </div>
            </div>
            <button
              onClick={() => setStep("select")}
              className="self-start sm:self-center px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Change Layout
            </button>
          </div>

          {/* Validation Errors Notice */}
          {showValidationErrors && !isFormValid && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-center gap-2.5">
              <AlertCircle size={18} className="shrink-0" />
              <div>
                <p className="font-bold">Please fill in all compulsory fields before proceeding:</p>
                <ul className="list-disc list-inside mt-1 space-y-0.5 text-[11px]">
                  {!isAuthorValid && <li>Author Name is compulsory.</li>}
                  {!isTopicValid && <li>Topic Name is compulsory.</li>}
                  {!isSubtopicsValid && <li>At least one subtopic name in the Agenda section is compulsory.</li>}
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
                    Author Details
                  </h3>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Specify who is presenting or authoring this presentation
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md">
                Compulsory
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Author Name */}
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
                    placeholder="e.g. Dr. Alex Rivera / John Doe"
                    className={`w-full pl-9 pr-3 py-2.5 bg-zinc-50 dark:bg-zinc-950/80 border ${
                      showValidationErrors && !isAuthorValid
                        ? "border-red-500 focus:ring-red-500"
                        : "border-zinc-200 dark:border-zinc-800 focus:ring-indigo-500"
                    } rounded-xl text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 transition-all`}
                  />
                </div>
              </div>

              {/* Author Role */}
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
                    placeholder="e.g. Head of AI / Chief Architect"
                    className="w-full pl-9 pr-3 py-2.5 bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>
              </div>

              {/* Organization */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                  Organization / Company <span className="text-zinc-400 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <Building size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    value={authorOrg}
                    onChange={(e) => setAuthorOrg(e.target.value)}
                    placeholder="e.g. Worldilm Innovations"
                    className="w-full pl-9 pr-3 py-2.5 bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: TOPIC & SUBTOPICS SECTION */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/60 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <BookOpen size={18} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-zinc-100">
                    Topic & Subtopics
                  </h3>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Define the primary topic name and subtopic breakdown
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md">
                Compulsory
              </span>
            </div>

            <div className="space-y-4">
              {/* Topic Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center justify-between">
                  <span>Presentation Topic Name <span className="text-red-500">*</span></span>
                  {showValidationErrors && !isTopicValid && (
                    <span className="text-[10px] font-semibold text-red-500">Compulsory</span>
                  )}
                </label>
                <div className="relative">
                  <BookOpen size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    value={topicName}
                    onChange={(e) => setTopicName(e.target.value)}
                    placeholder="e.g. Next-Gen Artificial Intelligence & Autonomous Agents"
                    className={`w-full pl-9 pr-3 py-2.5 bg-zinc-50 dark:bg-zinc-950/80 border ${
                      showValidationErrors && !isTopicValid
                        ? "border-red-500 focus:ring-red-500"
                        : "border-zinc-200 dark:border-zinc-800 focus:ring-indigo-500"
                    } rounded-xl text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 transition-all`}
                  />
                </div>
              </div>

              {/* Subtopics Section */}
              <div className="space-y-2.5 border-t border-zinc-100 dark:border-zinc-800/60 pt-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                      <ListOrdered size={14} className="text-indigo-500" />
                      <span>Subtopics / Agenda Names <span className="text-red-500">*</span></span>
                    </label>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      At least one subtopic is mandatory. Click <strong className="text-indigo-600 dark:text-indigo-400">+ Add Subtopic</strong> to add more.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddSubtopic}
                    className="px-2.5 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>Add Subtopic</span>
                  </button>
                </div>

                {showValidationErrors && !isSubtopicsValid && (
                  <p className="text-[11px] font-semibold text-red-500">
                    Please enter at least one valid subtopic name.
                  </p>
                )}

                <div className="space-y-2">
                  {subtopics.map((subtopic, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[11px] font-bold flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>
                      <input
                        type="text"
                        value={subtopic}
                        onChange={(e) => handleSubtopicChange(index, e.target.value)}
                        placeholder={`Subtopic ${index + 1} name (e.g. Market Analysis & Neural Core)`}
                        className="flex-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      />
                      <button
                        type="button"
                        disabled={subtopics.length <= 1}
                        onClick={() => handleRemoveSubtopic(index)}
                        className={`p-2 rounded-lg border text-zinc-400 transition-colors ${
                          subtopics.length <= 1
                            ? "opacity-30 cursor-not-allowed border-zinc-200 dark:border-zinc-800"
                            : "hover:text-red-500 hover:bg-red-500/10 border-zinc-200 dark:border-zinc-800 cursor-pointer"
                        }`}
                        title="Remove Subtopic"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: ADDITIONAL DETAILS (+ OPTION) */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/60 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <Layers size={18} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-zinc-100">
                    Additional Details
                  </h3>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Add extra custom fields according to your specific needs
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleAddCustomDetail}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs"
              >
                <Plus size={14} />
                <span>Add Custom Field</span>
              </button>
            </div>

            {additionalDetails.length === 0 ? (
              <div className="p-4 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-950/40">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  No custom details added. Click <strong className="text-indigo-600 dark:text-indigo-400">+ Add Custom Field</strong> if you wish to provide additional context (e.g. Target Audience, Key Takeaways, Tone, Language).
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {additionalDetails.map((item) => (
                  <div key={item.id} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-zinc-50 dark:bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800">
                    <input
                      type="text"
                      value={item.label}
                      onChange={(e) => handleCustomDetailChange(item.id, "label", e.target.value)}
                      placeholder="Field Name (e.g. Target Audience)"
                      className="w-full sm:w-1/3 px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <input
                      type="text"
                      value={item.value}
                      onChange={(e) => handleCustomDetailChange(item.id, "value", e.target.value)}
                      placeholder="Field Value (e.g. Executive Board & Investors)"
                      className="flex-1 px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomDetail(item.id)}
                      className="p-2 self-end sm:self-center text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg border border-zinc-200 dark:border-zinc-800 transition-colors cursor-pointer"
                      title="Remove Field"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 4: AI CUSTOMIZATION, PURPOSE & COLOR THEME */}
          <div className="bg-gradient-to-br from-indigo-50/70 via-white to-cyan-50/40 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-900 border border-indigo-500/30 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-indigo-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-xs">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-zinc-100">
                    AI Custom Instructions & Deck Theme
                  </h3>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Customize the tone, slide count, color palette, and prompt for Gemini AI
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md">
                Customizable
              </span>
            </div>

            {/* Custom Prompt Textarea */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                Custom Instructions / AI Prompt <span className="text-zinc-400 font-normal">(Optional)</span>
              </label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Give specific instructions for the AI (e.g. 'Focus heavily on unit economics in slide 4, provide a multi-tier technical architecture diagram in slide 7, and highlight our Series A runway')..."
                rows={2}
                className="w-full p-3 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-zinc-400 resize-none transition-all"
              />
            </div>

            {/* Purpose, Slide Count & Tone */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                  Purpose / Goal
                </label>
                <select
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full px-2.5 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  <option value="Executive Strategy & Pitch">Executive Strategy & Pitch</option>
                  <option value="Investor Pitch Deck">Investor Pitch Deck</option>
                  <option value="Technical Architecture & Deep-Dive">Technical Architecture</option>
                  <option value="Product Launch & GTM">Product Launch & GTM</option>
                  <option value="Board Review">Board Review</option>
                  <option value="Academic & Training">Academic & Training</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                  Number of Slides
                </label>
                <select
                  value={targetSlideCount}
                  onChange={(e) => setTargetSlideCount(Number(e.target.value))}
                  className="w-full px-2.5 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  <option value={10}>10 Slides (Concise)</option>
                  <option value={15}>15 Slides (Standard)</option>
                  <option value={20}>20 Slides (Full Deck)</option>
                  <option value={25}>25 Slides (Deep Dive)</option>
                  <option value={30}>30 Slides (Master Blueprint)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                  Tone
                </label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full px-2.5 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  <option value="Executive & Analytical">Executive & Analytical</option>
                  <option value="Visionary & High-Growth">Visionary & High-Growth</option>
                  <option value="Technical & Precise">Technical & Precise</option>
                  <option value="Minimalist & Modern">Minimalist & Modern</option>
                </select>
              </div>
            </div>

            {/* Background Theme & Accent Color */}
            <div className="pt-2 border-t border-indigo-100 dark:border-zinc-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                  Slide Canvas Theme:
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { id: "white", name: "Clean White", bg: "#ffffff", border: "#e2e8f0" },
                    { id: "dark", name: "Titanium Dark", bg: "#0a0a0f", border: "#27272a" },
                    { id: "navy", name: "Midnight Navy", bg: "#0d1b2a", border: "#1e293b" },
                    { id: "warm", name: "Warm Paper", bg: "#fbf6ee", border: "#e7e5e4" }
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setCustomBgTheme(t.id as any)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                        customBgTheme === t.id
                          ? "ring-2 ring-indigo-500 border-indigo-500 shadow-xs font-black"
                          : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-400"
                      }`}
                      style={{ backgroundColor: t.bg, color: t.id === "white" || t.id === "warm" ? "#0f172a" : "#f8fafc" }}
                    >
                      <span className="w-2.5 h-2.5 rounded-full border border-black/20" style={{ backgroundColor: t.bg }} />
                      <span>{t.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                  Primary Accent Color:
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { name: "Indigo", color: "#4f46e5" },
                    { name: "Emerald", color: "#059669" },
                    { name: "Ruby", color: "#e11d48" },
                    { name: "Amber", color: "#d97706" },
                    { name: "Cyan", color: "#0891b2" },
                    { name: "Purple", color: "#7c3aed" },
                    { name: "Slate", color: "#334155" }
                  ].map((c) => (
                    <button
                      key={c.color}
                      type="button"
                      onClick={() => setCustomAccentColor(c.color)}
                      className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer ${
                        customAccentColor === c.color ? "scale-125 border-zinc-900 dark:border-white shadow-xs" : "border-transparent hover:scale-110"
                      }`}
                      style={{ backgroundColor: c.color }}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Bottom Action Bar for Step 2 */}
        <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 max-w-md w-[92%] sm:w-full bg-white/85 dark:bg-zinc-900/85 text-zinc-900 dark:text-zinc-100 backdrop-blur-xl border border-white/60 dark:border-zinc-700/60 p-2 sm:p-2.5 rounded-2xl shadow-2xl flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setStep("select")}
            className="px-3 py-1.5 text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer flex items-center gap-1"
          >
            <ArrowLeft size={13} />
            <span>Back</span>
          </button>

          <button
            type="button"
            onClick={handleNextSubmit}
            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
          >
            <Sparkles size={14} />
            <span>Generate Presentation</span>
            <ArrowRight size={14} className="stroke-[2.5]" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-50 dark:bg-zinc-950 p-3 sm:p-6 overflow-y-auto relative font-sans">
      <div className="max-w-7xl w-full mx-auto space-y-4 sm:space-y-6 pb-28">

        {/* Top Header */}
        <div className="border-b border-zinc-200 dark:border-zinc-800/80 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5 sm:gap-3.5">
            <button
              onClick={onBackToChat}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:scale-105 active:scale-95 text-zinc-700 dark:text-zinc-300 transition-all cursor-pointer flex items-center justify-center shadow-2xs shrink-0 mt-0.5"
              title="Back to Chat"
            >
              <ArrowLeft size={18} className="stroke-[2.5]" />
            </button>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Presentation className="text-indigo-500 w-6 h-6 sm:w-7 sm:h-7 shrink-0" />
                  <span>Worldilm Presentation Studio</span>
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 rounded-md">
                  Gemini 3.7 Flash Engine
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Generate 100% complete, rich executive decks with custom prompts, colors, purpose, and diagrams.
              </p>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-72">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search slide templates..."
              className="w-full pl-8 pr-8 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Slide Templates Grid with Custom Create as the Premier First Card */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 lg:gap-5 pt-1">
          {/* Concise Custom Create Slide Card */}
          {(!searchQuery || "custom create".includes(searchQuery.toLowerCase())) && (
            <div
              onClick={() => handleToggleChoose("custom-create")}
              className={`group relative rounded-xl sm:rounded-2xl overflow-hidden border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                chosenSlideId === "custom-create"
                  ? "border-indigo-500 ring-2 sm:ring-4 ring-indigo-500/20 shadow-xl scale-[1.01]"
                  : "border-indigo-200/80 dark:border-indigo-900/50 hover:border-indigo-400 bg-white dark:bg-zinc-900 hover:shadow-lg hover:-translate-y-0.5"
              }`}
            >
              {/* Colorful Cover Container (16:10 Aspect Ratio matching template slides) */}
              <div className="aspect-[16/10] w-full relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-cyan-600 p-3 sm:p-4 flex flex-col justify-between select-none">
                <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-cyan-400/25 blur-xl pointer-events-none" />
                <div className="absolute -left-6 -top-6 w-24 h-24 rounded-full bg-purple-500/20 blur-xl pointer-events-none" />

                {/* Top Label */}
                <div className="flex items-center justify-between z-10">
                  <span className="text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-200 bg-black/25 px-2 py-0.5 rounded-md border border-white/10">
                    AI Studio
                  </span>
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-white/15 backdrop-blur-xs border border-white/20 flex items-center justify-center text-white shadow-2xs">
                    <Sparkles size={13} className="text-cyan-200" />
                  </div>
                </div>

                {/* Center / Bottom Title */}
                <div className="mt-auto z-10">
                  <div className="text-sm sm:text-lg font-black uppercase tracking-tight text-white leading-tight font-sans">
                    Custom Create
                  </div>
                  <div className="text-[8px] sm:text-[10px] text-cyan-100/90 font-medium mt-0.5">
                    AI Deck
                  </div>
                </div>

                {/* Selection Checkbox Overlay */}
                <div
                  className={`absolute top-2 right-2 z-20 w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center transition-all ${
                    chosenSlideId === "custom-create"
                      ? "bg-white text-indigo-700 shadow-md scale-110"
                      : "bg-black/30 text-white/70 group-hover:bg-black/50 group-hover:text-white"
                  }`}
                >
                  <Check size={13} className="stroke-[3]" />
                </div>
              </div>

              {/* Card Info Footer */}
              <div className="bg-white dark:bg-zinc-900 p-2 sm:p-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-1">
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] sm:text-xs font-bold text-zinc-900 dark:text-zinc-100 block truncate">
                    Custom Create
                  </span>
                  <span className="text-[8px] sm:text-[10px] text-indigo-600 dark:text-indigo-400 font-medium block truncate">
                    Prompt • {targetSlideCount || 20} slides
                  </span>
                </div>

                <button
                  onClick={(e) => handleToggleChoose("custom-create", e)}
                  className={`px-2 py-1 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    chosenSlideId === "custom-create"
                      ? "bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow-2xs"
                      : "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white"
                  }`}
                >
                  {chosenSlideId === "custom-create" ? "Selected" : "Select"}
                </button>
              </div>
            </div>
          )}
          {filteredSlides.map((template) => {
            const isChosen = chosenSlideId === template.id;

            return (
              <div
                key={template.id}
                onClick={() => handleToggleChoose(template.id)}
                className={`group relative rounded-xl sm:rounded-2xl overflow-hidden border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                  isChosen
                    ? "border-indigo-500 ring-2 sm:ring-4 ring-indigo-500/20 shadow-xl scale-[1.01]"
                    : "border-zinc-200/80 dark:border-zinc-800 hover:border-indigo-400 bg-white dark:bg-zinc-900 hover:shadow-lg hover:-translate-y-0.5"
                }`}
              >
                {/* Colorful Cover Container (16:10 Aspect Ratio) */}
                <div className="aspect-[16/10] w-full relative overflow-hidden">
                  <RenderCoverContent raw={template.raw} />

                  {/* Quick Preview Button Overlay */}
                  <button
                    onClick={(e) => handleOpenPreview(template, e)}
                    className="absolute top-2 left-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity px-2 py-0.5 rounded-md bg-black/60 hover:bg-black/80 text-white text-[9px] sm:text-[11px] font-semibold flex items-center gap-1 backdrop-blur-md cursor-pointer shadow-xs"
                    title="Quick Preview"
                  >
                    <Eye size={11} />
                    <span className="hidden sm:inline">Preview</span>
                  </button>

                  {/* Selection Checkbox Overlay */}
                  <div
                    className={`absolute top-2 right-2 z-20 w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center transition-all ${
                      isChosen
                        ? "bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow-md scale-110"
                        : "bg-black/40 text-white/60 group-hover:bg-black/60 group-hover:text-white"
                    }`}
                  >
                    <Check size={13} className="stroke-[3]" />
                  </div>
                </div>

                {/* Card Info Footer - Compact & Mobile Friendly */}
                <div className="bg-white dark:bg-zinc-900 p-2 sm:p-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-1">
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] sm:text-xs font-bold text-zinc-800 dark:text-zinc-200 block truncate">
                      {template.title}
                    </span>
                    <span className="text-[8px] sm:text-[10px] text-zinc-400 dark:text-zinc-500 block truncate">
                      {template.raw.s} • {template.slidesCount} slides
                    </span>
                  </div>

                  <button
                    onClick={(e) => handleToggleChoose(template.id, e)}
                    className={`px-2 py-1 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-bold transition-all cursor-pointer shrink-0 ${
                      isChosen
                        ? "bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow-2xs"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-indigo-600 hover:text-white"
                    }`}
                  >
                    {isChosen ? "Selected" : "Select"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Bottom Sticky Action Bar when a Slide is Chosen */}
      <AnimatePresence>
        {chosenTemplate && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 max-w-md w-[92%] sm:w-full bg-white/85 dark:bg-zinc-900/85 text-zinc-900 dark:text-zinc-100 backdrop-blur-xl border border-white/60 dark:border-zinc-700/60 p-2 sm:p-2.5 rounded-2xl shadow-2xl flex items-center justify-between gap-2"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-md">
                <Check size={16} className="stroke-[3]" />
              </div>
              <div className="min-w-0">
                <div className="text-[9px] uppercase font-bold text-indigo-600 dark:text-indigo-400 tracking-wider truncate">
                  Slide Selected
                </div>
                <h4 className="text-xs sm:text-sm font-extrabold text-zinc-900 dark:text-white truncate">
                  {chosenTemplate.title}
                </h4>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setChosenSlideId(null)}
                className="px-2 py-1 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (chosenSlideId === "custom-create") {
                    setIsCustomCreateModalOpen(true);
                  } else if (chosenTemplate) {
                    setStep("details");
                    setShowValidationErrors(false);
                  }
                }}
                className="px-3.5 py-2 sm:px-5 sm:py-2.5 bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-extrabold text-xs rounded-lg sm:rounded-xl shadow-lg hover:shadow-indigo-500/25 transition-all cursor-pointer flex items-center gap-1.5 scale-105 active:scale-95"
              >
                <span>{chosenSlideId === "custom-create" ? "Open Prompt Bar" : "Continue"}</span>
                <ArrowRight size={14} className="stroke-[2.5]" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FULL-SCREEN SLIDE PREVIEW MODAL (Strictly 16:9 Widescreen, Pure White Slide Canvas, Custom Front-Page Colors & Typography) */}
      <AnimatePresence>
        {previewTemplate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-2 sm:p-5"
            onClick={() => setPreviewTemplate(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden shadow-2xl relative"
            >
              {/* Modal Top Header Bar */}
              <div className="px-3.5 sm:px-6 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/30">
                    <Presentation size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs sm:text-sm font-extrabold text-zinc-900 dark:text-zinc-100 truncate">
                        {previewTemplate.title}
                      </h3>
                      <span className="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-md font-bold truncate max-w-[140px]">
                        {previewTemplate.raw.font.replace(/,.*$/, "").replace(/['"]/g, "")}
                      </span>
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                      {previewTemplate.slidesCount} Widescreen Slides • {previewTemplate.category}
                    </p>
                  </div>
                </div>

                {/* Right Header Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      handleToggleChoose(previewTemplate.id);
                      setPreviewTemplate(null);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                      chosenSlideId === previewTemplate.id
                        ? "bg-indigo-600 text-white"
                        : "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-600 hover:text-white border border-indigo-500/30"
                    }`}
                  >
                    <Check size={14} className="stroke-[2.5]" />
                    <span>{chosenSlideId === previewTemplate.id ? "Selected" : "Select Slide"}</span>
                  </button>

                  <button
                    onClick={() => setPreviewTemplate(null)}
                    className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 flex items-center justify-center transition-colors cursor-pointer"
                    title="Close Preview (ESC)"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Slide Canvas Container (Strictly 16:9 Widescreen with Exact Deck Color Palette) */}
              <div className="flex-1 bg-slate-100 dark:bg-zinc-950 p-2 sm:p-5 overflow-y-auto flex items-center justify-center relative">
                {(() => {
                  const raw = previewTemplate.raw;
                  const isFirstSlide = previewPageIndex === 0;
                  const currentSlide = previewTemplate.slides[previewPageIndex] || previewTemplate.slides[0];
                  const accentColor = getVisibleAccentColor(raw.ac);
                  const fontFamily = raw.font;
                  const fgLight = isLightColor(raw.fg);

                  // Dynamic inner panel styling matching deck brightness
                  const cardBg = fgLight ? "bg-white/10 border-white/20" : "bg-black/10 border-black/15";
                  const highlightBg = fgLight ? "bg-white/15 border-white/25" : "bg-black/15 border-black/20";

                  return (
                    <div className="w-full max-w-4xl aspect-[16/9] transition-all duration-200">
                      {/* SLIDE CANVAS PAPER CARD - EXACT DECK COLOR SCHEME */}
                      <div
                        className="w-full h-full rounded-xl sm:rounded-2xl shadow-2xl p-3 sm:p-5 md:p-6 flex flex-col justify-between border border-white/10 relative overflow-hidden select-none"
                        style={{ background: raw.bg, color: raw.fg, fontFamily }}
                      >
                        {/* SLIDE 1: EXACT FRONT COVER LAYOUT FROM GALLERY */}
                        {isFirstSlide ? (
                          <div className="w-full h-full flex flex-col justify-between overflow-hidden relative">
                            <RenderCoverContent raw={raw} />
                          </div>
                        ) : (
                          /* SUBSEQUENT SLIDES: SAME COLOR SCHEME, CHANGED CONTENT (Grid/Stat/Split/Roadmap) */
                          <>
                            {/* Top Decorative Accent Line */}
                            <div
                              className="absolute top-0 left-0 right-0 h-1 sm:h-1.5"
                              style={{ backgroundColor: accentColor }}
                            />

                            {/* Slide Header Row */}
                            <div className="flex items-center justify-between border-b border-current/15 pb-1.5 sm:pb-2 mt-0.5 shrink-0">
                              <div className="flex items-center gap-2">
                                <span
                                  className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border"
                                  style={{
                                    backgroundColor: `${accentColor}20`,
                                    color: accentColor,
                                    borderColor: `${accentColor}40`
                                  }}
                                >
                                  {currentSlide.badge || "Slide Preview"}
                                </span>
                                <span className="text-[10px] font-semibold opacity-70 uppercase tracking-widest hidden sm:inline">
                                  {raw.s}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="text-[9px] sm:text-[10px] font-mono font-bold opacity-80 bg-current/10 border border-current/15 px-2 py-0.5 rounded-md">
                                  Slide {previewPageIndex + 1} of {previewTemplate.slides.length}
                                </span>
                              </div>
                            </div>

                            {/* Slide Content Body (Strictly scaled for 16:9 fitting) */}
                            <div className="my-auto py-1 sm:py-2 space-y-1.5 sm:space-y-2.5 flex-1 flex flex-col justify-center min-h-0 overflow-hidden">
                              {/* Title & Subtitle */}
                              <div>
                                <h2 className="text-sm sm:text-base md:text-xl font-black tracking-tight leading-tight line-clamp-2">
                                  {currentSlide.title}
                                </h2>
                                <p className="text-[10px] sm:text-xs md:text-sm font-medium opacity-75 mt-0.5 line-clamp-1">
                                  {currentSlide.subtitle}
                                </p>
                              </div>

                              {/* Variant 1: Title Overview */}
                              {currentSlide.type === "title" && (
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 pt-1">
                                  <div className={`sm:col-span-2 space-y-1.5 p-2.5 sm:p-3 rounded-xl border ${cardBg}`}>
                                    <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider opacity-70 block">
                                      Deck Highlights & Author
                                    </span>
                                    <ul className="space-y-1">
                                      {currentSlide.bullets.map((b, idx) => (
                                        <li key={idx} className="flex items-center gap-2 text-[10px] sm:text-xs md:text-sm font-medium">
                                          <span
                                            className="w-1.5 h-1.5 rounded-full shrink-0"
                                            style={{ backgroundColor: accentColor }}
                                          />
                                          <span className="truncate">{b}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>

                                  {currentSlide.stat && (
                                    <div className={`p-2.5 sm:p-3 rounded-xl border flex flex-col justify-between ${highlightBg}`}>
                                      <span className="text-[9px] font-bold uppercase tracking-wider opacity-70">
                                        {currentSlide.stat.label}
                                      </span>
                                      <div className="text-xl sm:text-2xl md:text-3xl font-black my-0.5" style={{ color: accentColor }}>
                                        {currentSlide.stat.value}
                                      </div>
                                      <span className="text-[9px] opacity-70 font-semibold truncate">
                                        {previewTemplate.category}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Variant 2: 3-Pillar Grid */}
                              {currentSlide.type === "grid" && (
                                <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5 pt-0.5">
                                  {currentSlide.bullets.map((pillar, idx) => (
                                    <div key={idx} className={`p-2 sm:p-3 rounded-xl border ${cardBg} flex flex-col justify-between`}>
                                      <div className="flex items-center justify-between mb-1">
                                        <span
                                          className="w-4 h-4 sm:w-5 sm:h-5 rounded-md text-[9px] sm:text-[10px] font-bold flex items-center justify-center text-white shrink-0"
                                          style={{ backgroundColor: accentColor }}
                                        >
                                          0{idx + 1}
                                        </span>
                                        <Sparkles size={12} style={{ color: accentColor }} />
                                      </div>
                                      <p className="text-[10px] sm:text-xs md:text-sm font-bold leading-tight line-clamp-3">
                                        {pillar}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Variant 3: Quantitative Metric & Stat */}
                              {currentSlide.type === "stat" && (
                                <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-0.5 items-stretch">
                                  {currentSlide.stat && (
                                    <div className={`p-2.5 sm:p-3 rounded-xl border flex flex-col justify-between ${highlightBg}`}>
                                      <span className="text-[9px] font-extrabold uppercase tracking-widest opacity-70">
                                        {currentSlide.stat.label}
                                      </span>
                                      <div className="text-2xl sm:text-3xl md:text-4xl font-black my-1" style={{ color: accentColor }}>
                                        {currentSlide.stat.value}
                                      </div>
                                      <span className="text-[9px] opacity-75 font-medium truncate">
                                        Target Performance Metric
                                      </span>
                                    </div>
                                  )}

                                  <div className={`col-span-2 p-2.5 sm:p-3 rounded-xl border ${cardBg} flex flex-col justify-center`}>
                                    <ul className="space-y-1 sm:space-y-1.5">
                                      {currentSlide.bullets.map((b, idx) => (
                                        <li key={idx} className="flex items-start gap-1.5 text-[10px] sm:text-xs md:text-sm font-medium leading-tight">
                                          <CheckCircle2 size={14} className="shrink-0 mt-0.5" style={{ color: accentColor }} />
                                          <span className="line-clamp-2">{b}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                              )}

                              {/* Variant 4: Split & Roadmap */}
                              {(currentSlide.type === "split" || currentSlide.type === "roadmap") && (
                                <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-0.5 items-stretch">
                                  <div className={`p-2.5 sm:p-3 rounded-xl border flex flex-col justify-between ${highlightBg}`}>
                                    <div>
                                      <span className="text-[9px] font-bold uppercase tracking-wider opacity-70 block mb-0.5">
                                        Strategic Focus
                                      </span>
                                      <h4 className="text-xs sm:text-sm font-black truncate">
                                        {currentSlide.badge}
                                      </h4>
                                    </div>
                                    {currentSlide.stat && (
                                      <div className="mt-2 pt-1.5 border-t border-current/15">
                                        <div className="text-lg sm:text-xl font-extrabold" style={{ color: accentColor }}>
                                          {currentSlide.stat.value}
                                        </div>
                                        <span className="text-[9px] opacity-70 font-bold uppercase block truncate">
                                          {currentSlide.stat.label}
                                        </span>
                                      </div>
                                    )}
                                  </div>

                                  <div className={`col-span-2 p-2.5 sm:p-3 rounded-xl border ${cardBg} flex flex-col justify-center`}>
                                    <ul className="space-y-1 sm:space-y-1.5">
                                      {currentSlide.bullets.map((b, idx) => (
                                        <li key={idx} className="flex items-start gap-1.5 text-[10px] sm:text-xs md:text-sm font-medium leading-snug">
                                          <span
                                            className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5"
                                            style={{ backgroundColor: accentColor }}
                                          />
                                          <span className="line-clamp-2">{b}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Slide Footer Row */}
                            <div className="border-t border-current/15 pt-1.5 flex items-center justify-between text-[9px] sm:text-[10px] opacity-75 font-medium shrink-0">
                              <span className="truncate max-w-[200px] font-semibold">
                                {raw.t}
                              </span>
                              <span className="font-mono text-[9px] uppercase font-bold opacity-80">
                                Worldilm Presentation Studio
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Modal Bottom Filmstrip & Slide Controls */}
              <div className="px-3 sm:px-6 py-2.5 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2 shrink-0">
                <button
                  onClick={() => setPreviewPageIndex((prev) => Math.max(0, prev - 1))}
                  disabled={previewPageIndex === 0}
                  className="px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 text-zinc-800 dark:text-zinc-200 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs shrink-0"
                >
                  <ChevronLeft size={16} />
                  <span className="hidden sm:inline">Prev Slide</span>
                </button>

                {/* Horizontal Filmstrip Slide Thumbnails */}
                <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-1 px-1 max-w-xl no-scrollbar">
                  {previewTemplate.slides.map((s, idx) => {
                    const isActive = idx === previewPageIndex;
                    return (
                      <button
                        key={idx}
                        onClick={() => setPreviewPageIndex(idx)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                          isActive
                            ? "bg-gradient-to-r from-indigo-600 to-cyan-500 text-white border-indigo-500 shadow-xs scale-105"
                            : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        }`}
                      >
                        <span className="font-mono">S{idx + 1}</span>
                        <span className="hidden md:inline text-[9px] opacity-90 truncate max-w-[70px]">
                          {s.badge || `Slide ${idx + 1}`}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setPreviewPageIndex((prev) => Math.min(previewTemplate.slides.length - 1, prev + 1))}
                  disabled={previewPageIndex === previewTemplate.slides.length - 1}
                  className="px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 text-zinc-800 dark:text-zinc-200 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs shrink-0"
                >
                  <span className="hidden sm:inline">Next Slide</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CUSTOM CREATE PROMPT BAR & FILE UPLOAD MODAL */}
      <AnimatePresence>
        {isCustomCreateModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-5 overflow-y-auto"
            onClick={() => setIsCustomCreateModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl relative my-auto"
            >
              {/* Modal Top Header Bar */}
              <div className="px-4 sm:px-6 py-3.5 border-b border-zinc-200 dark:border-zinc-800 bg-gradient-to-r from-zinc-50 via-white to-indigo-50/40 dark:from-zinc-950 dark:via-zinc-900 dark:to-indigo-950/20 flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white flex items-center justify-center shrink-0 shadow-md">
                    <Sparkles size={20} className="stroke-[2.5]" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm sm:text-base font-black text-zinc-900 dark:text-zinc-100 truncate">
                        Custom AI Presentation Builder
                      </h3>
                      <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-950/80 border border-indigo-300/60 dark:border-indigo-800 px-2 py-0.5 rounded-md shrink-0">
                        {targetSlideCount || 20} Slides
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                      Write your prompt and upload source files to generate your slide deck
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsCustomCreateModalOpen(false)}
                  className="w-8 h-8 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                  title="Close"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal Body: Scrollable Chatbox & Configuration */}
              <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
                
                {/* 1. Prompt Chatbox Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                      <span>Presentation Prompt & Topic Description</span>
                      <span className="text-indigo-600 dark:text-indigo-400">*</span>
                    </label>
                    <span className="text-[10px] text-zinc-400">
                      {customPrompt.length > 0 ? `${customPrompt.length} chars` : "Detailed instructions"}
                    </span>
                  </div>

                  <div className="relative rounded-2xl border-2 border-indigo-500/30 focus-within:border-indigo-600 dark:focus-within:border-indigo-400 bg-zinc-50/80 dark:bg-zinc-950/80 transition-all p-3 shadow-inner">
                    <textarea
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      placeholder="Describe what you want to create (e.g. 'Build a 20-slide investor deck on Autonomous Drone Delivery with unit economics, market size TAM, system architecture, and 5-year financial projections...')"
                      rows={4}
                      className="w-full bg-transparent border-0 resize-none text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none leading-relaxed"
                    />

                    {/* Quick Inspiration Blueprint Pills */}
                    <div className="pt-2 mt-1 border-t border-zinc-200/60 dark:border-zinc-800/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                      <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
                        <Sparkles size={11} className="text-indigo-500" />
                        <span>Ideas:</span>
                      </span>
                      {[
                        {
                          label: "🚀 Series A Pitch Deck",
                          prompt:
                            "Create a 20-slide Series A investor pitch deck for our B2B AI workspace platform. Include market opportunity ($48B TAM), problem & solution architecture, product traction metrics (+340% YoY ARR), unit economics (LTV/CAC 4.2x), competitive moat, team credentials, and 5-year financial projections with $15M raise allocation."
                        },
                        {
                          label: "🧠 AI Architecture",
                          prompt:
                            "Generate a comprehensive 20-slide technical deep-dive presentation on Enterprise LLM Agentic Architecture. Cover multi-agent orchestration, retrieval-augmented generation (RAG) vector pipelines, evaluation telemetry, latency SLA benchmarks, and security guardrails."
                        },
                        {
                          label: "📈 B2B SaaS GTM",
                          prompt:
                            "Create a high-impact 20-slide Go-To-Market strategy deck for scaling an enterprise SaaS product from $5M to $25M ARR. Detail target ICP personas, inbound/outbound conversion funnels, sales cycle acceleration, pricing tiers, and quarterly OKRs."
                        },
                        {
                          label: "🏢 Board Executive Review",
                          prompt:
                            "Produce an executive board meeting slide deck reviewing Q3 performance, strategic risk matrix, cross-functional engineering deliverables, capital efficiency benchmarks, and Q4 annual operating plan (AOP) priorities."
                        },
                        {
                          label: "🔬 Clinical Research Briefing",
                          prompt:
                            "Formulate an authoritative 20-slide scientific & clinical presentation deck reviewing Phase II trial endpoints, patient cohort pharmacology, mechanism of action (MoA), regulatory compliance pathways, and commercial rollout roadmap."
                        }
                      ].map((item, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setCustomPrompt(item.prompt)}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-indigo-500 text-zinc-700 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 whitespace-nowrap transition-colors cursor-pointer shrink-0 shadow-2xs"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 2. File Upload & Source Attachment Dropzone */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                      <Paperclip size={14} className="text-indigo-600 dark:text-indigo-400" />
                      <span>Upload Files & Source Documents</span>
                      <span className="text-[10px] font-normal text-zinc-400">(Optional)</span>
                    </label>
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                      PDF, Word, TXT, CSV, MD, JSON, Images
                    </span>
                  </div>

                  {/* Hidden File Input */}
                  <input
                    type="file"
                    ref={customFileInputRef}
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleProcessUploadedFiles(e.target.files);
                      }
                    }}
                    multiple
                    accept=".pdf,.doc,.docx,.txt,.md,.markdown,.csv,.json,.ts,.js,.py,.html,.xml,.yaml,.yml,.png,.jpg,.jpeg,.xlsx,.pptx"
                    className="hidden"
                  />

                  {/* Drag and Drop Zone */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingFiles(true);
                    }}
                    onDragLeave={() => setIsDraggingFiles(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingFiles(false);
                      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                        handleProcessUploadedFiles(e.dataTransfer.files);
                      }
                    }}
                    onClick={() => customFileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-4 sm:p-5 text-center cursor-pointer transition-all ${
                      isDraggingFiles
                        ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 scale-[1.01]"
                        : "border-zinc-200 dark:border-zinc-800 hover:border-indigo-400 dark:hover:border-indigo-600 bg-zinc-50/50 dark:bg-zinc-950/50 hover:bg-zinc-50 dark:hover:bg-zinc-950"
                    }`}
                  >
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                        <FileUp size={20} />
                      </div>
                      <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                        <span>Click to attach files or drag & drop documents here</span>
                      </div>
                      <p className="text-[10px] text-zinc-400">
                        Upload notes, research summaries, financial data, or outlines for the AI to analyze
                      </p>
                    </div>
                  </div>

                  {/* Active Uploaded Files List */}
                  {uploadedDeckFiles.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {uploadedDeckFiles.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between gap-2 p-2.5 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/30 text-zinc-900 dark:text-zinc-100"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText size={16} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                            <div className="min-w-0">
                              <div className="text-xs font-bold truncate">{file.name}</div>
                              <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">
                                {formatDeckFileSize(file.size)} • Extracted
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveUploadedFile(file.id);
                            }}
                            className="p-1 rounded-lg hover:bg-red-500/10 text-zinc-400 hover:text-red-500 transition-colors cursor-pointer"
                            title="Remove file"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. Slide Deck Settings & Customization */}
                <div className="bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-4 space-y-4">
                  {/* Slide Count Selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center justify-between">
                      <span>Target Slide Count</span>
                      <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                        {targetSlideCount} Widescreen Slides
                      </span>
                    </label>
                    <div className="grid grid-cols-6 gap-1.5">
                      {[5, 10, 15, 20, 25, 30].map((count) => (
                        <button
                          key={count}
                          type="button"
                          onClick={() => setTargetSlideCount(count)}
                          className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                            targetSlideCount === count
                              ? "bg-indigo-600 text-white border-indigo-600 shadow-md scale-105"
                              : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-indigo-400"
                          }`}
                        >
                          {count}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Color Theme Selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                      Color Palette & Theme Accent
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {[
                        { color: "#4f46e5", name: "Indigo Tech" },
                        { color: "#10b981", name: "Emerald Growth" },
                        { color: "#e11d48", name: "Crimson Bold" },
                        { color: "#d97706", name: "Amber Strategy" },
                        { color: "#06b6d4", name: "Cyber Cyan" },
                        { color: "#334155", name: "Slate Minimal" }
                      ].map((th) => (
                        <button
                          key={th.color}
                          type="button"
                          onClick={() => setCustomAccentColor(th.color)}
                          className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                            customAccentColor === th.color
                              ? "border-indigo-600 bg-white dark:bg-zinc-900 ring-2 ring-indigo-500/20 shadow-xs"
                              : "border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60 hover:border-zinc-300"
                          }`}
                        >
                          <span
                            className="w-5 h-5 rounded-full shadow-xs shrink-0 flex items-center justify-center text-white text-[10px]"
                            style={{ backgroundColor: th.color }}
                          >
                            {customAccentColor === th.color && <Check size={12} className="stroke-[3]" />}
                          </span>
                          <span className="text-[9px] font-bold text-zinc-700 dark:text-zinc-300 truncate w-full text-center">
                            {th.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Canvas Background Mode */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                      Canvas Background Style
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { id: "white", name: "Clean White" },
                        { id: "dark", name: "Dark Titanium" },
                        { id: "warm", name: "Warm Paper" },
                        { id: "navy", name: "Midnight Navy" }
                      ].map((bg) => (
                        <button
                          key={bg.id}
                          type="button"
                          onClick={() => setCustomBgTheme(bg.id as any)}
                          className={`py-1.5 px-2 rounded-xl text-[10px] font-bold border transition-all cursor-pointer text-center ${
                            customBgTheme === bg.id
                              ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                              : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300"
                          }`}
                        >
                          {bg.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Optional Presenter Details */}
                  <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-800/60">
                    <button
                      type="button"
                      onClick={() => setShowAdvancedCustomizer((prev) => !prev)}
                      className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Sliders size={13} />
                      <span>{showAdvancedCustomizer ? "Hide Presenter & Tone Options" : "Add Presenter Details & Tone (Optional)"}</span>
                    </button>

                    {showAdvancedCustomizer && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-3"
                      >
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400">Presenter Name</label>
                          <input
                            type="text"
                            value={authorName}
                            onChange={(e) => setAuthorName(e.target.value)}
                            placeholder="e.g. Sarah Connor"
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400">Presenter Role</label>
                          <input
                            type="text"
                            value={authorRole}
                            onChange={(e) => setAuthorRole(e.target.value)}
                            placeholder="e.g. Chief Strategist"
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400">Organization</label>
                          <input
                            type="text"
                            value={authorOrg}
                            onChange={(e) => setAuthorOrg(e.target.value)}
                            placeholder="e.g. Worldilm AI"
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs"
                          />
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>

              </div>

              {/* Modal Footer Actions */}
              <div className="px-4 sm:px-6 py-3.5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex items-center justify-between gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsCustomCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleTriggerCustomCreate}
                  className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg hover:shadow-indigo-500/25 transition-all cursor-pointer flex items-center gap-2 scale-105 active:scale-95"
                >
                  <Sparkles size={16} className="animate-pulse" />
                  <span>Create {targetSlideCount || 20}-Slide Deck</span>
                  <ArrowRight size={14} className="stroke-[2.5]" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
