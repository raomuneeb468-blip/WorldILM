import jsPDF from "jspdf";
import pptxgen from "pptxgenjs";
import { toPng } from "html-to-image";
import html2canvas from "html2canvas";

export interface SlideMetric {
  value: string;
  label: string;
  detail: string;
}

export interface SlideDiagramNode {
  step: string;
  title: string;
  desc: string;
}

export interface SlideTable {
  headers: string[];
  rows: string[][];
}

export interface FreeformElement {
  id: string;
  type: "text" | "badge" | "sticker" | "callout" | "note" | "quote" | "image" | "divider";
  text: string;
  x: number; // relative position percentage (0 to 100)
  y: number; // relative position percentage (0 to 100)
  width?: number;
  fontSize?: number;
  color?: string;
  bgColor?: string;
  align?: "left" | "center" | "right";
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  fontFamily?: string;
  rotation?: number;
  borderColor?: string;
  borderWidth?: number;
  imageUrl?: string;
}

export interface StructuredSlide {
  id: number;
  slideNumber: number;
  layout:
    | "title"
    | "agenda"
    | "definition"
    | "grid4"
    | "diagram"
    | "metrics"
    | "implementation"
    | "table"
    | "funnel"
    | "roadmap"
    | "risk"
    | "trends"
    | "increment"
    | "conclusion";
  title: string;
  subtitle?: string;
  badge?: string;
  definition?: string;
  bulletPoints?: string[];
  diagramNodes?: SlideDiagramNode[];
  metrics?: SlideMetric[];
  examples?: string[];
  gridItems?: { title: string; desc: string; icon?: string }[];
  table?: SlideTable;
  summaryTakeaway?: string;
  bgColor?: string;
  accentColor?: string;
  customElements?: FreeformElement[];
}

export interface SlideDeckConfig {
  topicName: string;
  authorName: string;
  authorRole?: string;
  authorOrg?: string;
  subtopics: string[];
  additionalDetails?: { id: string; label: string; value: string }[];
  templateTitle: string;
  category: string;
  accentColor: string;
  bgColor: string;
  fgColor: string;
  font?: string;
  layoutNumber?: number;
  targetSlideCount?: number; // default 20 slides
  purpose?: string;
  audience?: string;
  deckStructure?: string;
  colorTheme?: string;
  tone?: string;
  customPrompt?: string;
  customInstructions?: string;
}

// Dynamic Topic-Aware Slide Generator (produces 20 comprehensive slides with diagrams, tables, metrics, examples & subtopics)
export function generateFallbackSlides(config: SlideDeckConfig): StructuredSlide[] {
  const topic = config.topicName || "Executive Strategy";
  const author = config.authorName || "Lead Analyst";
  const role = config.authorRole || "Subject Expert";
  const org = config.authorOrg || "Enterprise Solutions";
  const totalSlides = config.targetSlideCount || 20;

  // Normalize user provided subtopics or provide topic-specific defaults
  const userSubs = config.subtopics.filter((s) => s.trim().length > 0);
  const defaultSubs = [
    `Core Foundations & Theoretical Scope of ${topic}`,
    `Strategic Frameworks & Operational Pillars`,
    `Execution Workflows & Process Architecture`,
    `Performance Metrics & Quantitative KPIs`,
    `Real-World Industry Case Studies & Applications`,
    `Risk Governance, Compliance & Security`,
    `Future Trends, AI Innovations & Scaling`
  ];
  const subs = userSubs.length >= 3 ? userSubs : [...userSubs, ...defaultSubs];

  const slides: StructuredSlide[] = [];

  // Slide 1: Cover Title
  slides.push({
    id: 1,
    slideNumber: 1,
    layout: "title",
    title: topic.toUpperCase(),
    subtitle: `Comprehensive Executive Blueprint & Strategic Implementation Guide`,
    badge: (config.category || "EXECUTIVE DECK").toUpperCase(),
    definition: `Presented by ${author} • ${role} at ${org}`,
    summaryTakeaway: `A 20-slide executive deck detailing fundamental concepts, operational frameworks, real-world case examples, metrics, and strategic execution.`
  });

  // Slide 2: Executive Agenda & Subtopic Roadmap
  slides.push({
    id: 2,
    slideNumber: 2,
    layout: "agenda",
    title: "Executive Agenda & Scope Overview",
    subtitle: "Structure and Key Subtopics Covered Across This Master Presentation Deck",
    badge: "AGENDA & ROADMAP",
    bulletPoints: subs.slice(0, 8).map((s, idx) => `0${idx + 1}. ${s}`),
    definition: `Presenter Profile: ${author} (${role}, ${org}). Designed for leadership and cross-functional teams seeking deep domain expertise.`,
    summaryTakeaway: "Each module contains core definitions, structural diagrams, real-world case examples, and quantitative performance metrics."
  });

  // Slide 3: Topic Definition & Fundamental Scope
  slides.push({
    id: 3,
    slideNumber: 3,
    layout: "definition",
    title: `What Is ${topic}?`,
    subtitle: `Establishing the Core Paradigm, Scope and Primary Objectives of ${topic}`,
    badge: "FOUNDATIONS & DEFINITION",
    definition: `${topic} represents the structured system, domain methodology, and strategic operational framework deployed by modern organizations to achieve sustainable competitive advantage and high-efficiency outcomes.`,
    bulletPoints: [
      `Core Principle 1: Strategic Alignment - Unifying vision, resources, and technical execution toward clear measurable targets.`,
      `Core Principle 2: Operational Rigor - Deploying standardized workflows, automated telemetry, and quality guardrails.`,
      `Core Principle 3: Continuous Value Delivery - Iterating rapidly based on empirical stakeholder feedback and performance data.`
    ],
    examples: [
      `Real-World Case 1: Industry enterprise scaling throughput by 340% following the adoption of modern ${topic} protocols.`,
      `Real-World Case 2: Global organization mitigating operational overhead by $2.1M via automated ${subs[0] || topic} integration.`
    ],
    summaryTakeaway: `Establishing precise definitions of ${topic} ensures organizational alignment from executive leadership to technical teams.`
  });

  // Slide 4: The 4 Operational Pillars / Core Framework
  slides.push({
    id: 4,
    slideNumber: 4,
    layout: "grid4",
    title: `The 4 Pillars of ${topic}`,
    subtitle: "Essential Strategic Pillars and Functional Mechanisms Driving Core Value",
    badge: "CORE FRAMEWORK",
    gridItems: [
      {
        title: "1. Strategy & Architecture",
        desc: `Define scope, target outcomes, and technical parameters governing ${subs[0] || topic}.`
      },
      {
        title: "2. Operational Execution",
        desc: `Deploy standardized workflows, cross-functional tooling, and resilient execution pipelines.`
      },
      {
        title: "3. Quality & Governance",
        desc: `Maintain strict compliance, risk controls, security standards, and validation protocols.`
      },
      {
        title: "4. Optimization & Scale",
        desc: `Analyze empirical data, leverage automation, and scale performance across enterprise operations.`
      }
    ],
    summaryTakeaway: "Harmonizing all four operational pillars ensures a resilient, defensible, and highly scalable execution architecture."
  });

  // Slide 5: Strategic Process Diagram & Workflow
  slides.push({
    id: 5,
    slideNumber: 5,
    layout: "diagram",
    title: `${topic} Execution Workflow Diagram`,
    subtitle: "Step-by-Step Architecture from Assessment to Continuous Scaling",
    badge: "PROCESS DIAGRAM",
    diagramNodes: [
      {
        step: "STEP 1",
        title: "Assessment & Audit",
        desc: `Audit current environment, benchmark legacy constraints, and map requirements for ${topic}.`
      },
      {
        step: "STEP 2",
        title: "Architect & Model",
        desc: `Design modular frameworks, establish data pipelines, and formulate execution specs.`
      },
      {
        step: "STEP 3",
        title: "Deploy & Activate",
        desc: `Launch core components, integrate telemetry instrumentation, and validate functional integrity.`
      },
      {
        step: "STEP 4",
        title: "Measure & Iterate",
        desc: `Track quantitative KPIs, optimize unit economics, and automate iterative improvements.`
      }
    ],
    summaryTakeaway: "A structured 4-step workflow eliminates execution bottlenecks and accelerates time-to-value."
  });

  // Slide 6: Increment & Maturity Staircase Diagram
  slides.push({
    id: 6,
    slideNumber: 6,
    layout: "increment",
    title: `${topic} Maturity & Value Increment Diagram`,
    subtitle: "Staircase Architecture Illustrating Progressive Maturity Levels and Value Compounding",
    badge: "INCREMENT DIAGRAM",
    diagramNodes: [
      { step: "LEVEL 1", title: "1. Baseline Setup & Audit", desc: `Establish fundamental parameters, configure initial data streams, and align team directives for ${topic}.` },
      { step: "LEVEL 2", title: "2. Workflow Automation", desc: `Deploy automated pipelines, eliminate manual touchpoints, and enforce quality control benchmarks.` },
      { step: "LEVEL 3", title: "3. Strategic Acceleration", desc: `Optimize processing speed, leverage predictive decision models, and scale cross-departmental operations.` },
      { step: "LEVEL 4", title: "4. Autonomous Scale & Mastery", desc: `Achieve continuous real-time execution, drive category leadership, and maximize return on capital.` }
    ],
    summaryTakeaway: `Advancing systematically across each maturity level compounds operational yield by over 3.8x.`
  });

  // Slide 7: The Value Progression & Funnel Model
  slides.push({
    id: 7,
    slideNumber: 7,
    layout: "funnel",
    title: `The ${topic} Progression & Lifecycle Funnel`,
    subtitle: "Guiding Initiatives and Stakeholders through Four Progressive Value Stages",
    badge: "VALUE FUNNEL",
    gridItems: [
      { title: "Stage 1: Discovery & Intent", desc: `Identify core opportunities, evaluate pain points, and align leadership on ${topic}.` },
      { title: "Stage 2: Validation & Proof", desc: "Run proof-of-concept trials, validate unit performance, and establish baseline metrics." },
      { title: "Stage 3: Integration & Adoption", desc: "Roll out enterprise integration, onboard key teams, and automate standard operations." },
      { title: "Stage 4: Mastery & Acceleration", desc: "Achieve full maturity, drive continuous optimization, and expand domain leadership." }
    ],
    summaryTakeaway: "Optimizing each funnel transition point compoundingly increases overall operational yield and ROI."
  });

  // Slide 8: Subtopic Deep-Dive 2
  slides.push({
    id: 8,
    slideNumber: 8,
    layout: "grid4",
    title: `Deep-Dive: ${subs[1] || "Core Operational Levers"}`,
    subtitle: `Key Functional Components and Strategic Levers in ${subs[1] || topic}`,
    badge: "DEEP DIVE MODULE 2",
    gridItems: [
      {
        title: "Lever A: Infrastructure",
        desc: `High-availability foundation supporting resilient execution of ${subs[1] || topic}.`
      },
      {
        title: "Lever B: Intelligence",
        desc: "Real-time analytics, predictive modeling, and automated decision engines."
      },
      {
        title: "Lever C: Automation",
        desc: "Eliminating manual touchpoints through scripted triggers and smart workflows."
      },
      {
        title: "Lever D: Telemetry",
        desc: "End-to-end monitoring, anomaly detection, and real-time dashboard reporting."
      }
    ],
    summaryTakeaway: `Systematic adjustment of operational levers in ${subs[1] || topic} yields immediate capital and time efficiency gains.`
  });

  // Slide 9: Tech Architecture & Systems Stack
  slides.push({
    id: 9,
    slideNumber: 9,
    layout: "implementation",
    title: `${topic} Technical Stack & System Architecture`,
    subtitle: "Engineered Framework Connecting Telemetry, Automation Engines and Strategic Insights",
    badge: "TECH ARCHITECTURE",
    definition: `Below is the architectural schematic illustrating how ${topic} ingests raw inputs, processes parameters in real-time, and generates automated actionable outputs.`,
    bulletPoints: [
      "Data Ingestion Layer: Capturing multi-source telemetry and operational signals with zero-loss pipelines.",
      "Processing & Rules Engine: Applying business logic, domain algorithms, and compliance validation.",
      "Automation Trigger Layer: Dispatching automated actions and real-time notifications to stakeholders.",
      "Executive Analytics Layer: Consolidating performance data into clear visual dashboards."
    ],
    examples: [
      `Technical Note: Sub-second synchronization across ${topic} nodes maintains strict transactional consistency.`
    ],
    summaryTakeaway: "A cohesive, modern technical stack converts raw data into automated strategic execution."
  });

  // Slide 10: Subtopic Deep-Dive 3
  slides.push({
    id: 10,
    slideNumber: 10,
    layout: "definition",
    title: `Deep-Dive: ${subs[2] || "Advanced Methodologies"}`,
    subtitle: `Best Practices, Industry Benchmarks and Advanced Execution Tactics for ${subs[2] || topic}`,
    badge: "DEEP DIVE MODULE 3",
    definition: `${subs[2] || topic} encapsulates cutting-edge techniques designed to maximize efficiency and maintain category leadership.`,
    bulletPoints: [
      "Modular Design Architecture: Decoupling core components for maximum flexibility and maintenance ease.",
      "Standardized Protocols: Enforcing uniform standards across cross-functional enterprise teams.",
      "Proactive Monitoring: Catching operational deviations before they impact end-user delivery.",
      "Continuous Optimization: Applying algorithmic feedback loops to refine execution quality."
    ],
    examples: [
      `Case Benchmark: Organizations deploying advanced ${subs[2] || topic} methods achieve 4.2x higher operational efficiency.`
    ],
    summaryTakeaway: `Adopting advanced practices in ${subs[2] || topic} converts routine operations into a defensible competitive moat.`
  });

  // Slide 11: End-to-End Strategic Cycle
  slides.push({
    id: 11,
    slideNumber: 11,
    layout: "diagram",
    title: `End-to-End Iterative Cycle for ${topic}`,
    subtitle: "A Repeatable, Data-Driven Iterative Framework Ensuring Continuous Growth",
    badge: "STRATEGY PROCESS",
    diagramNodes: [
      { step: "PHASE 1", title: "Market Research", desc: `Analyze requirements, competitive benchmarks, and user demand for ${topic}.` },
      { step: "PHASE 2", title: "Set Objectives", desc: "Define SMART targets, quantitative KPIs, and unit economic parameters." },
      { step: "PHASE 3", title: "Build & Deploy", desc: "Formulate strategy, configure infrastructure, and activate core channels." },
      { step: "PHASE 4", title: "Audit & Scale", desc: "Track performance, conduct security audits, and expand global throughput." }
    ],
    summaryTakeaway: "Continuous feedback loops ensure strategies adapt rapidly to changing market and technical conditions."
  });

  // Slide 12: Quantitative Metrics & KPI Dashboard
  slides.push({
    id: 12,
    slideNumber: 12,
    layout: "metrics",
    title: `${topic} Metrics & Key Performance Indicators (KPIs)`,
    subtitle: "Empirical Numbers and Key Metrics Demonstrating Efficiency and ROI Performance",
    badge: "METRICS DASHBOARD",
    metrics: [
      { value: "3.5x+", label: "Target ROI Benchmark", detail: "Return on invested capital across core initiatives" },
      { value: "99.9%", label: "Operational Reliability", detail: "SLA uptime and workflow execution accuracy" },
      { value: "<15ms", label: "Processing Latency", detail: "Average telemetry and decision pipeline speed" },
      { value: "$2.4M", label: "Annual Cost Reduction", detail: "Average savings generated via automated workflows" }
    ],
    bulletPoints: [
      `Payback Period Goal: Reclaiming capital investment within 6-9 months ensures optimal cash flow.`,
      `Efficiency Index: Tracking output ratio per dollar spent guarantees disciplined resource allocation.`,
      `Error Rate Reduction: Minimizing operational defects below 0.01% protects brand reputation.`
    ],
    summaryTakeaway: "Tracking metrics rigorously ensures resource allocation stays focused on high-margin growth levers."
  });

  // Slide 13: Comparative Analysis Matrix
  slides.push({
    id: 13,
    slideNumber: 13,
    layout: "table",
    title: `Comparative Analysis: Legacy vs. Modernized ${topic}`,
    subtitle: "Evaluating Strategic Differences, Operational Velocity and ROI Performance",
    badge: "COMPARISON MATRIX",
    table: {
      headers: ["Dimension", "Legacy Traditional Approach", `Modernized ${topic} Framework`, "Strategic Value"],
      rows: [
        ["Execution Velocity", "Manual, slow batch cycles", "Real-time automated pipelines", "10x Faster Time-to-Market"],
        ["Targeting Precision", "Broad estimations & assumptions", "Granular data-driven telemetry", "Zero Wasted Resources"],
        ["System Scalability", "Monolithic, rigid structure", "Modular, cloud-native architecture", "Unlimited Elastic Growth"],
        ["ROI & Cost Health", "High overhead, variable yield", "Predictable, high-margin ROI", "Sustainable Capital Efficiency"]
      ]
    },
    summaryTakeaway: `Transitioning to a modernized ${topic} framework yields superior capital efficiency and execution speed.`
  });

  // Slide 14: Emerging Market Trends & Innovations
  slides.push({
    id: 14,
    slideNumber: 14,
    layout: "trends",
    title: `Emerging Trends & Future Innovations in ${topic}`,
    subtitle: `Where the Discipline Is Heading Next: AI Automation, Real-Time Systems & Global Scale`,
    badge: "FUTURE OUTLOOK",
    gridItems: [
      {
        title: "AI & Machine Learning Automation",
        desc: "Generative AI models and predictive analytics automating complex decision pipelines in real-time."
      },
      {
        title: "Real-Time Telemetry & Edge Computing",
        desc: "Processing data at the edge for sub-millisecond response times and instant feedback loops."
      },
      {
        title: "Zero-Trust Security & Compliance",
        desc: "Cryptographic verification and privacy-first architectures ensuring total enterprise data protection."
      },
      {
        title: "Autonomous Workflow Orchestration",
        desc: "Self-healing pipelines and smart agents managing end-to-end execution with minimal manual oversight."
      }
    ],
    summaryTakeaway: "Early adoption of AI automation and real-time telemetry delivers a decisive competitive edge."
  });

  // Slide 15: Subtopic Deep-Dive 4
  slides.push({
    id: 15,
    slideNumber: 15,
    layout: "grid4",
    title: `Deep-Dive: ${subs[3] || "Advanced Applications"}`,
    subtitle: `Next-Generation Execution Models and Strategic Advantages of ${subs[3] || topic}`,
    badge: "DEEP DIVE MODULE 4",
    gridItems: [
      {
        title: "1. Cross-Platform Integration",
        desc: `Unifying ${subs[3] || topic} across web, mobile, and enterprise backend environments.`
      },
      {
        title: "2. Intelligent Load Balancing",
        desc: "Dynamically allocating resources to high-intent tasks based on real-time demand signals."
      },
      {
        title: "3. Continuous Compliance",
        desc: "Automated auditing checking legal, security, and industry guardrails continuously."
      },
      {
        title: "4. Ecosystem Expansion",
        desc: "Extending API connectivity to strategic partners and third-party developer networks."
      }
    ],
    summaryTakeaway: `Advanced implementation of ${subs[3] || topic} guarantees adaptability in rapidly shifting market landscapes.`
  });

  // Slide 16: Phased Implementation Roadmap
  slides.push({
    id: 16,
    slideNumber: 16,
    layout: "roadmap",
    title: `Phased Implementation Roadmap & Rollout Timeline`,
    subtitle: "Structured 4-Phase Rollout Plan from Setup to Global Enterprise Scale",
    badge: "ROLLOUT TIMELINE",
    diagramNodes: [
      { step: "MONTH 1", title: "Foundations & Audit", desc: `Audit legacy stack, configure baseline architecture, and establish ${topic} parameters.` },
      { step: "MONTH 2-3", title: "Pilot Activation", desc: "Launch core modules, test data pipelines, and train key cross-functional teams." },
      { step: "MONTH 4-6", title: "Optimization & Scale", desc: "A/B test workflows, optimize unit economics, and deploy AI automation tools." },
      { step: "MONTH 6+", title: "Global Scaling", desc: "Expand to global enterprise regions, activate partner APIs, and drive category leadership." }
    ],
    summaryTakeaway: "Phased execution guarantees immediate quick wins while building long-term scalable infrastructure."
  });

  // Slide 17: Risk Governance, Compliance & Security
  slides.push({
    id: 17,
    slideNumber: 17,
    layout: "risk",
    title: "Risk Governance, Privacy Compliance & Security Safeguards",
    subtitle: "Proactive Measures Protecting Enterprise Security, Compliance and Integrity",
    badge: "RISK & GOVERNANCE",
    gridItems: [
      { title: "Data Privacy & Security", desc: "Strict adherence to global data privacy laws with end-to-end encryption and zero-trust standards." },
      { title: "System Resilience & Uptime", desc: "Redundant multi-region failover protocols ensuring uninterrupted operational continuity." },
      { title: "Resource & Budget Controls", desc: "Automated spending limits, anomaly detection, and real-time alert thresholds." },
      { title: "Regulatory Compliance", desc: "Continuous auditing verifying all workflows adhere to industry regulatory frameworks." }
    ],
    summaryTakeaway: "Robust governance protects brand reputation and system integrity while enabling rapid enterprise growth."
  });

  // Slide 18: Executive Master Alignment Matrix
  slides.push({
    id: 18,
    slideNumber: 18,
    layout: "table",
    title: "Executive Master Strategy Alignment Matrix",
    subtitle: "Concise Alignment Across Core Strategic Pillars, Key Action Initiatives, and Target Outcomes",
    badge: "MASTER MATRIX",
    table: {
      headers: ["Strategic Pillar", "Primary Focus Area", "Core Action Initiative", "Expected Enterprise Impact"],
      rows: [
        [`1. ${subs[0] || "Foundations"}`, "Core Architecture", `Deploy standardized ${topic} framework`, "Maximum System Integrity"],
        [`2. ${subs[1] || "Execution"}`, "Workflow Automation", "Eliminate manual operational bottlenecks", "10x Campaign Velocity"],
        [`3. ${subs[2] || "Performance"}`, "KPI & Metric Optimization", "Instrument real-time telemetry dashboards", "Lower Operating Cost"],
        [`4. ${subs[3] || "Scaling"}`, "Global Enterprise Scale", "Expand API integrations & AI automation", "Defensible Category Leadership"]
      ]
    },
    summaryTakeaway: "Unified execution across all four strategic pillars guarantees sustainable top-line growth and market leadership."
  });

  // Slide 19: Key Executive Takeaways
  slides.push({
    id: 19,
    slideNumber: 19,
    layout: "definition",
    title: "Executive Key Takeaways & Strategic Summary",
    subtitle: "Core Principles Governing Sustainable Growth and Competitive Advantage",
    badge: "KEY TAKEAWAYS",
    definition: `To build a market-leading enterprise around ${topic}, leadership must execute on these four core principles:`,
    bulletPoints: [
      `1. Systemic Integration: ${topic} must be executed as an integrated, end-to-end system across all teams.`,
      `2. Data-Driven Precision: Base all strategic decisions on empirical telemetry rather than subjective assumptions.`,
      `3. Disciplined Capital Allocation: Continuously measure CAC, ROI, and efficiency metrics to maximize margins.`,
      `4. Continuous Adaptation: Leverage AI automation and modern frameworks to stay ahead of market shifts.`
    ],
    summaryTakeaway: `Aligning execution with these key takeaways positions the enterprise for sustained category leadership in ${topic}.`
  });

  // Slide 20: Conclusion & Action Steps
  slides.push({
    id: 20,
    slideNumber: 20,
    layout: "conclusion",
    title: "Conclusion & Immediate Action Plan",
    subtitle: "Thank You — Open for Executive Q&A and Deployment Discussion",
    badge: "CONCLUSION & Q&A",
    bulletPoints: [
      `Action 1: Finalize Q3 channel budget allocations and ${topic} KPI benchmarks.`,
      "Action 2: Complete technical stack integration and telemetry pipeline audit.",
      "Action 3: Launch pilot automation workflows and establish team training schedule.",
      "Action 4: Schedule bi-weekly performance review meetings with executive leadership."
    ],
    definition: `Thank you for reviewing ${topic}. For further inquiries, implementation assistance, or strategic guidance, contact ${author} (${role}, ${org}).`,
    summaryTakeaway: "Ready for immediate enterprise deployment. Thank you!"
  });

  return slides.slice(0, totalSlides);
}

// Generate structured slides by querying AI with JSON schema expectation
export async function generateStructuredSlides(config: SlideDeckConfig): Promise<StructuredSlide[]> {
  const targetCount = config.targetSlideCount || 20;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000); // 90s generous timeout for high-depth, rigorous AI slide generation

    let res: Response | null = null;
    try {
      res = await fetch("/api/generate-slides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicName: config.topicName,
          purpose: config.purpose || "Executive Strategy",
          numSlides: targetCount,
          colorTheme: config.colorTheme || "Modern",
          accentColor: config.accentColor,
          bgColor: config.bgColor,
          fgColor: config.fgColor,
          font: config.font,
          authorName: config.authorName || "Executive Presenter",
          authorRole: config.authorRole || "Subject Expert",
          authorOrg: config.authorOrg || "Organization",
          tone: config.tone || "Executive & Analytical",
          audience: config.audience || "Executive C-Suite & Board",
          deckStructure: config.deckStructure || "balanced",
          subtopics: config.subtopics || [],
          customInstructions: config.customPrompt || config.customInstructions || "",
          category: config.category || "Business"
        }),
        signal: controller.signal
      });
    } catch (fetchErr) {
      console.warn("[Slide Engine] Network or abort during /api/generate-slides:", fetchErr);
    } finally {
      clearTimeout(timeoutId);
    }

    if (res && res.ok) {
      const data = await res.json();
      if (data && data.success && Array.isArray(data.slides) && data.slides.length > 0) {
        return data.slides.map((s: any, idx: number) => {
          const layout = s.layout || "definition";
          return {
            ...s,
            id: idx + 1,
            slideNumber: idx + 1,
            layout,
            gridItems: (s.gridItems && Array.isArray(s.gridItems) && s.gridItems.length > 0) ? s.gridItems : undefined,
            diagramNodes: (s.diagramNodes && Array.isArray(s.diagramNodes) && s.diagramNodes.length > 0) ? s.diagramNodes : undefined,
            metrics: (s.metrics && Array.isArray(s.metrics) && s.metrics.length > 0) ? s.metrics : undefined,
            table: (layout === "table" && s.table && Array.isArray(s.table.headers) && s.table.headers.length > 0 && Array.isArray(s.table.rows) && s.table.rows.length > 0) ? s.table : undefined
          };
        });
      }
    }
  } catch (err) {
    console.warn("AI JSON parsing failed, using robust fallback slide engine:", err);
  }

  // Fallback if AI JSON parse failed
  return generateFallbackSlides(config);
}

// Hex to RGB helper
function hexToRgb(hex: string) {
  let c = (hex || "#4f46e5").replace("#", "");
  if (c.length === 3) c = c.split("").map((x) => x + x).join("");
  const num = parseInt(c, 16);
  if (isNaN(num)) return { r: 79, g: 70, b: 229 };
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

// Ultra-HD Pixel-Perfect DOM Capture Helper for Slides & A4 Document Pages
export async function captureSlideToDataUrl(slideIndex: number, config: SlideDeckConfig): Promise<string | null> {
  const el = document.getElementById(`slide-node-${slideIndex}`);
  if (!el) {
    console.warn(`Slide node slide-node-${slideIndex} not found in DOM`);
    return null;
  }

  try {
    el.scrollIntoView({ block: "nearest", inline: "nearest" });
  } catch (_) {}

  const width = el.offsetWidth || 960;
  const height = el.offsetHeight || 540;

  try {
    const canvas = await html2canvas(el, {
      scale: 3, // Ultra-Crisp 3x Retina resolution for zero blur
      width,
      height,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: config.bgColor || "#ffffff",
      imageTimeout: 5000,
      onclone: (clonedDoc) => {
        const clonedEl = clonedDoc.getElementById(`slide-node-${slideIndex}`);
        if (clonedEl) {
          clonedEl.style.transform = "none";
          clonedEl.style.textRendering = "optimizeLegibility";
          (clonedEl.style as any).webkitFontSmoothing = "antialiased";
        }
      }
    });
    return canvas.toDataURL("image/jpeg", 0.98);
  } catch (err) {
    console.warn(`html2canvas direct capture failed for slide ${slideIndex}, trying toPng:`, err);
    try {
      return await toPng(el, {
        width,
        height,
        pixelRatio: 3,
        fontEmbedCSS: "",
        skipFonts: true,
        cacheBust: false
      });
    } catch (e2) {
      console.error(`toPng fallback failed for slide ${slideIndex}:`, e2);
      return null;
    }
  }
}

// High-Precision DOM Capture Engine: Guarantees 100% exact same-to-same PDF downloads matching on-screen slides or A4 document pages!
export async function exportSlidesToPdf(
  slides: StructuredSlide[],
  config: SlideDeckConfig,
  saveToFile: boolean = true,
  mode: "slide" | "document" = "slide"
): Promise<jsPDF> {
  const isDoc = mode === "document";
  const doc = new jsPDF({
    orientation: isDoc ? "portrait" : "landscape",
    unit: "pt",
    format: isDoc ? "a4" : [960, 540]
  });

  let pagesAdded = 0;

  for (let i = 0; i < slides.length; i++) {
    const dataUrl = await captureSlideToDataUrl(i, config);
    if (dataUrl) {
      if (pagesAdded > 0) {
        doc.addPage(isDoc ? "a4" : [960, 540], isDoc ? "portrait" : "landscape");
      }
      if (isDoc) {
        doc.addImage(dataUrl, "JPEG", 0, 0, 595.28, 841.89, undefined, "FAST");
      } else {
        doc.addImage(dataUrl, "JPEG", 0, 0, 960, 540, undefined, "FAST");
      }
      pagesAdded++;
    }
  }

  if (saveToFile && pagesAdded > 0) {
    const suffix = isDoc ? "_a4_document.pdf" : "_slides.pdf";
    const fileName =
      (config.topicName || (isDoc ? "document" : "presentation")).toLowerCase().replace(/[^a-z0-9]/g, "_") + suffix;
    doc.save(fileName);
  }
  return doc;
}

// Native PowerPoint PPTX Renderer: Creates actual .pptx files matching the DOM 100%
export async function exportSlidesToPptx(
  slides: StructuredSlide[],
  config: SlideDeckConfig
) {
  const pptx = new pptxgen();
  pptx.layout = "LAYOUT_169";
  pptx.title = config.topicName || "Presentation";
  pptx.author = config.authorName || "Presenter";

  await new Promise((resolve) => setTimeout(resolve, 50));

  let slidesAdded = 0;

  for (let i = 0; i < slides.length; i++) {
    const dataUrl = await captureSlideToDataUrl(i, config);
    if (dataUrl) {
      const pptxSlide = pptx.addSlide();
      pptxSlide.addImage({
        data: dataUrl,
        x: 0,
        y: 0,
        w: "100%",
        h: "100%"
      });
      slidesAdded++;
    }
  }

  if (slidesAdded > 0) {
    const fileName =
      (config.topicName || "presentation").toLowerCase().replace(/[^a-z0-9]/g, "_") + "_slides.pptx";
    await pptx.writeFile({ fileName });
  }
}

function legacyUnusedExportPdf(slides: StructuredSlide[], config: SlideDeckConfig, saveToFile: boolean = true) {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "pt",
    format: [1280, 720]
  });

  const width = 1280;
  const height = 720;

  const accentRgb = hexToRgb(config.accentColor || "#4f46e5");
  const bgRgb = hexToRgb(config.bgColor || "#0f172a");
  const fgRgb = hexToRgb(config.fgColor || "#f8fafc");

  const isDark =
    (bgRgb.r * 299 + bgRgb.g * 587 + bgRgb.b * 114) / 1000 < 128;

  const cardBgRgb = isDark ? { r: 30, g: 41, b: 59 } : { r: 255, g: 255, b: 255 };
  const cardBorderRgb = isDark ? { r: 51, g: 65, b: 85 } : { r: 226, g: 232, b: 240 };
  const textRgb = isDark ? { r: 241, g: 245, b: 249 } : { r: 15, g: 23, b: 42 };
  const subtextRgb = isDark ? { r: 148, g: 163, b: 184 } : { r: 100, g: 116, b: 139 };

  slides.forEach((slide, index) => {
    if (index > 0) {
      doc.addPage([1280, 720], "landscape");
    }

    // Cover Title Slide or Conclusion Slide can use Deep Accent Canvas
    const isSpecialCover = slide.layout === "title" || slide.layout === "conclusion";

    if (isSpecialCover) {
      doc.setFillColor(bgRgb.r, bgRgb.g, bgRgb.b);
    } else {
      doc.setFillColor(bgRgb.r, bgRgb.g, bgRgb.b);
    }
    doc.rect(0, 0, width, height, "F");

    // Decorative Accent Shapes for cover
    if (isSpecialCover) {
      doc.setFillColor(accentRgb.r, accentRgb.g, accentRgb.b);
      doc.circle(1200, 100, 240, "F");
      doc.circle(80, 680, 180, "F");
      // Dark overlay for shapes
      doc.setFillColor(bgRgb.r, bgRgb.g, bgRgb.b);
      doc.circle(1200, 100, 220, "F");
      doc.circle(80, 680, 160, "F");
    }

    // Top Accent Bar
    doc.setFillColor(accentRgb.r, accentRgb.g, accentRgb.b);
    doc.rect(0, 0, width, 8, "F");

    // Header Badge / Category
    if (slide.badge) {
      const badgeY = 45;
      doc.setFillColor(accentRgb.r, accentRgb.g, accentRgb.b);
      doc.roundedRect(60, badgeY, 200, 24, 4, 4, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text((slide.badge || "PRESENTATION").toUpperCase(), 72, badgeY + 16);
    }

    // Slide Title
    doc.setTextColor(fgRgb.r, fgRgb.g, fgRgb.b);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(26);
    const splitTitle = doc.splitTextToSize(slide.title, 1100);
    doc.text(splitTitle, 60, 105);

    // Slide Subtitle
    if (slide.subtitle) {
      doc.setTextColor(subtextRgb.r, subtextRgb.g, subtextRgb.b);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(13);
      doc.text(slide.subtitle, 60, 132);
    }

    const startY = 160;

    // Layout Specific Renderers
    if (slide.layout === "title") {
      doc.setFillColor(cardBgRgb.r, cardBgRgb.g, cardBgRgb.b);
      doc.roundedRect(60, 170, 1160, 410, 16, 16, "F");
      doc.setDrawColor(cardBorderRgb.r, cardBorderRgb.g, cardBorderRgb.b);
      doc.setLineWidth(1);
      doc.roundedRect(60, 170, 1160, 410, 16, 16, "S");

      doc.setDrawColor(accentRgb.r, accentRgb.g, accentRgb.b);
      doc.setLineWidth(4);
      doc.line(100, 220, 220, 220);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(38);
      doc.setTextColor(accentRgb.r, accentRgb.g, accentRgb.b);
      doc.text(config.topicName.toUpperCase(), 100, 280);

      doc.setFontSize(16);
      doc.setTextColor(subtextRgb.r, subtextRgb.g, subtextRgb.b);
      doc.text(`Presented by ${config.authorName} (${config.authorRole || "Expert"}, ${config.authorOrg || "Global Enterprise"})`, 100, 330);

      if (slide.definition) {
        doc.setFontSize(13);
        doc.setTextColor(textRgb.r, textRgb.g, textRgb.b);
        const splitDef = doc.splitTextToSize(slide.definition, 960);
        doc.text(splitDef, 100, 380);
      }
    } else if (slide.layout === "agenda" && slide.bulletPoints && slide.bulletPoints.length > 0) {
      // Agenda Layout: 2 Columns of Numbered Cards
      const cardW = 560;
      const cardH = 70;
      const colGap = 40;
      const rowGap = 20;

      slide.bulletPoints.forEach((item, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const x = 60 + col * (cardW + colGap);
        const y = startY + row * (cardH + rowGap);

        if (y + cardH <= 580) {
          doc.setFillColor(cardBgRgb.r, cardBgRgb.g, cardBgRgb.b);
          doc.roundedRect(x, y, cardW, cardH, 10, 10, "F");
          doc.setDrawColor(cardBorderRgb.r, cardBorderRgb.g, cardBorderRgb.b);
          doc.setLineWidth(1);
          doc.roundedRect(x, y, cardW, cardH, 10, 10, "S");

          doc.setFillColor(accentRgb.r, accentRgb.g, accentRgb.b);
          doc.roundedRect(x + 15, y + 15, 40, 40, 8, 8, "F");
          doc.setTextColor(255, 255, 255);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(14);
          doc.text(`${idx + 1}`, x + 28, y + 39, { align: "center" });

          doc.setTextColor(textRgb.r, textRgb.g, textRgb.b);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(12);
          const splitItem = doc.splitTextToSize(item, cardW - 80);
          doc.text(splitItem, x + 70, y + 35);
        }
      });
    } else if (slide.layout === "funnel" && ((slide.gridItems && slide.gridItems.length > 0) || (slide.diagramNodes && slide.diagramNodes.length > 0))) {
      // Funnel Conversion Diagram
      const items = (slide.gridItems && slide.gridItems.length > 0)
        ? slide.gridItems.map((g, i) => ({ title: g.title, desc: g.desc, badge: `STAGE ${i + 1}` }))
        : (slide.diagramNodes || []).map((n) => ({ title: n.title, desc: n.desc, badge: n.step }));
      const widths = [1160, 1020, 880, 740];

      items.forEach((item, idx) => {
        const w = widths[idx % 4];
        const x = 60 + (1160 - w) / 2;
        const y = startY + idx * 85;

        doc.setFillColor(cardBgRgb.r, cardBgRgb.g, cardBgRgb.b);
        doc.roundedRect(x, y, w, 72, 10, 10, "F");
        doc.setDrawColor(cardBorderRgb.r, cardBorderRgb.g, cardBorderRgb.b);
        doc.setLineWidth(1);
        doc.roundedRect(x, y, w, 72, 10, 10, "S");

        doc.setFillColor(accentRgb.r, accentRgb.g, accentRgb.b);
        doc.roundedRect(x + 15, y + 15, 80, 22, 4, 4, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text(item.badge || `STAGE ${idx + 1}`, x + 55, y + 30, { align: "center" });

        doc.setTextColor(textRgb.r, textRgb.g, textRgb.b);
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(item.title, x + 110, y + 30);

        doc.setTextColor(subtextRgb.r, subtextRgb.g, subtextRgb.b);
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        const splitDesc = doc.splitTextToSize(item.desc, w - 200);
        doc.text(splitDesc, x + 110, y + 48);

        doc.setTextColor(accentRgb.r, accentRgb.g, accentRgb.b);
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(`${100 - idx * 22}%`, x + w - 30, y + 40, { align: "right" });
      });
    } else if ((slide.layout === "grid4" || slide.layout === "trends" || slide.layout === "risk") && slide.gridItems && slide.gridItems.length > 0) {
      // 4-Card Grid Layout
      const cardWidth = 265;
      const cardHeight = 380;
      const gap = 30;

      slide.gridItems.forEach((item, idx) => {
        const x = 60 + idx * (cardWidth + gap);

        doc.setFillColor(cardBgRgb.r, cardBgRgb.g, cardBgRgb.b);
        doc.roundedRect(x, startY, cardWidth, cardHeight, 12, 12, "F");
        doc.setDrawColor(cardBorderRgb.r, cardBorderRgb.g, cardBorderRgb.b);
        doc.setLineWidth(1);
        doc.roundedRect(x, startY, cardWidth, cardHeight, 12, 12, "S");

        doc.setFillColor(accentRgb.r, accentRgb.g, accentRgb.b);
        doc.circle(x + cardWidth / 2, startY + 50, 24, "F");

        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text(`${idx + 1}`, x + cardWidth / 2, startY + 55, { align: "center" });

        doc.setTextColor(textRgb.r, textRgb.g, textRgb.b);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        const splitItemTitle = doc.splitTextToSize(item.title, cardWidth - 30);
        doc.text(splitItemTitle, x + 15, startY + 105);

        doc.setTextColor(subtextRgb.r, subtextRgb.g, subtextRgb.b);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        const splitItemDesc = doc.splitTextToSize(item.desc, cardWidth - 30);
        doc.text(splitItemDesc, x + 15, startY + 150);
      });
    } else if (slide.layout === "increment" && ((slide.diagramNodes && slide.diagramNodes.length > 0) || (slide.gridItems && slide.gridItems.length > 0))) {
      // Increment / Staircase Diagram
      const items = (slide.diagramNodes && slide.diagramNodes.length > 0)
        ? slide.diagramNodes.map((n) => ({ title: n.title, desc: n.desc, badge: n.step }))
        : (slide.gridItems || []).map((g, i) => ({ title: g.title, desc: g.desc, badge: `LEVEL ${i + 1}` }));
      const cardWidth = 265;
      const gap = 30;

      items.forEach((item, idx) => {
        const x = 60 + idx * (cardWidth + gap);
        const cardH = 260 + idx * 35; // Ascending height for staircase step
        const cardY = startY + (380 - cardH);

        doc.setFillColor(cardBgRgb.r, cardBgRgb.g, cardBgRgb.b);
        doc.roundedRect(x, cardY, cardWidth, cardH, 12, 12, "F");
        doc.setDrawColor(cardBorderRgb.r, cardBorderRgb.g, cardBorderRgb.b);
        doc.setLineWidth(1);
        doc.roundedRect(x, cardY, cardWidth, cardH, 12, 12, "S");

        // Top Accent Indicator
        doc.setFillColor(accentRgb.r, accentRgb.g, accentRgb.b);
        doc.rect(x + 15, cardY + 10, cardWidth - 30, 4, "F");

        doc.setFillColor(accentRgb.r, accentRgb.g, accentRgb.b);
        doc.roundedRect(x + 15, cardY + 22, 100, 22, 4, 4, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text(item.badge || `LEVEL ${idx + 1}`, x + 65, cardY + 36, { align: "center" });

        doc.setTextColor(textRgb.r, textRgb.g, textRgb.b);
        doc.setFontSize(13);
        doc.setFont("helvetica", "bold");
        const splitTitle = doc.splitTextToSize(item.title, cardWidth - 30);
        doc.text(splitTitle, x + 15, cardY + 62);

        doc.setTextColor(subtextRgb.r, subtextRgb.g, subtextRgb.b);
        doc.setFontSize(10.5);
        doc.setFont("helvetica", "normal");
        const splitDesc = doc.splitTextToSize(item.desc, cardWidth - 30);
        doc.text(splitDesc, x + 15, cardY + 105);
      });
    } else if ((slide.layout === "diagram" || slide.layout === "roadmap" || slide.layout === "implementation") && slide.diagramNodes && slide.diagramNodes.length > 0) {
      // Horizontal Process Steps / Diagram
      const nodeWidth = 260;
      const gap = 30;

      slide.diagramNodes.forEach((node, idx) => {
        const x = 60 + idx * (nodeWidth + gap);

        doc.setFillColor(cardBgRgb.r, cardBgRgb.g, cardBgRgb.b);
        doc.roundedRect(x, startY, nodeWidth, 380, 12, 12, "F");
        doc.setDrawColor(cardBorderRgb.r, cardBorderRgb.g, cardBorderRgb.b);
        doc.setLineWidth(1);
        doc.roundedRect(x, startY, nodeWidth, 380, 12, 12, "S");

        doc.setFillColor(accentRgb.r, accentRgb.g, accentRgb.b);
        doc.roundedRect(x + 15, startY + 15, 90, 24, 4, 4, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text(node.step, x + 60, startY + 31, { align: "center" });

        doc.setTextColor(textRgb.r, textRgb.g, textRgb.b);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        const splitNodeTitle = doc.splitTextToSize(node.title, nodeWidth - 30);
        doc.text(splitNodeTitle, x + 15, startY + 65);

        doc.setTextColor(subtextRgb.r, subtextRgb.g, subtextRgb.b);
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        const splitDesc = doc.splitTextToSize(node.desc, nodeWidth - 30);
        doc.text(splitDesc, x + 15, startY + 115);
      });
    } else if (slide.layout === "table" && slide.table && slide.table.headers && slide.table.headers.length > 0 && slide.table.rows && slide.table.rows.length > 0) {
      // Comparison / Master Table Layout
      const colWidth = 1160 / slide.table.headers.length;

      doc.setFillColor(accentRgb.r, accentRgb.g, accentRgb.b);
      doc.rect(60, startY, 1160, 38, "F");

      slide.table.headers.forEach((h, hIdx) => {
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text(h, 75 + hIdx * colWidth, startY + 24);
      });

      slide.table.rows.forEach((row, rIdx) => {
        const rowY = startY + 38 + rIdx * 50;
        doc.setFillColor(cardBgRgb.r, cardBgRgb.g, cardBgRgb.b);
        doc.rect(60, rowY, 1160, 50, "F");
        doc.setDrawColor(cardBorderRgb.r, cardBorderRgb.g, cardBorderRgb.b);
        doc.setLineWidth(1);
        doc.rect(60, rowY, 1160, 50, "S");

        row.forEach((cell, cIdx) => {
          doc.setTextColor(textRgb.r, textRgb.g, textRgb.b);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          const splitCell = doc.splitTextToSize(cell, colWidth - 20);
          doc.text(splitCell, 75 + cIdx * colWidth, rowY + 28);
        });
      });
    } else if (slide.layout === "metrics" && slide.metrics && slide.metrics.length > 0) {
      // Metrics Layout
      const metricWidth = 265;
      const gap = 30;
      slide.metrics.forEach((m, mIdx) => {
        const mx = 60 + mIdx * (metricWidth + gap);

        doc.setFillColor(cardBgRgb.r, cardBgRgb.g, cardBgRgb.b);
        doc.roundedRect(mx, startY, metricWidth, 380, 12, 12, "F");
        doc.setDrawColor(cardBorderRgb.r, cardBorderRgb.g, cardBorderRgb.b);
        doc.setLineWidth(1);
        doc.roundedRect(mx, startY, metricWidth, 380, 12, 12, "S");

        doc.setTextColor(accentRgb.r, accentRgb.g, accentRgb.b);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(32);
        doc.text(m.value, mx + 20, startY + 60);

        doc.setTextColor(textRgb.r, textRgb.g, textRgb.b);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        const splitLabel = doc.splitTextToSize(m.label, metricWidth - 40);
        doc.text(splitLabel, mx + 20, startY + 110);

        doc.setTextColor(subtextRgb.r, subtextRgb.g, subtextRgb.b);
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        const splitDetail = doc.splitTextToSize(m.detail, metricWidth - 40);
        doc.text(splitDetail, mx + 20, startY + 150);
      });
    } else {
      // Standard Bullet / Definition / Examples / Metrics Layout
      let currentY = startY;

      if (slide.definition) {
        doc.setFillColor(cardBgRgb.r, cardBgRgb.g, cardBgRgb.b);
        doc.roundedRect(60, currentY, 1160, 75, 8, 8, "F");
        doc.setDrawColor(cardBorderRgb.r, cardBorderRgb.g, cardBorderRgb.b);
        doc.setLineWidth(1);
        doc.roundedRect(60, currentY, 1160, 75, 8, 8, "S");

        doc.setFillColor(accentRgb.r, accentRgb.g, accentRgb.b);
        doc.rect(60, currentY, 6, 75, "F");

        doc.setTextColor(textRgb.r, textRgb.g, textRgb.b);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);
        const splitDef = doc.splitTextToSize(slide.definition, 1120);
        doc.text(splitDef, 80, currentY + 32);

        currentY += 90;
      }

      if (slide.bulletPoints && slide.bulletPoints.length > 0) {
        slide.bulletPoints.forEach((pt) => {
          doc.setFillColor(accentRgb.r, accentRgb.g, accentRgb.b);
          doc.circle(72, currentY + 4, 4, "F");

          doc.setTextColor(textRgb.r, textRgb.g, textRgb.b);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(12);
          const splitPt = doc.splitTextToSize(pt, 1100);
          doc.text(splitPt, 88, currentY + 8);

          currentY += 32;
        });
      }

      if (slide.examples && slide.examples.length > 0) {
        doc.setFillColor(isDark ? 45 : 254, isDark ? 35 : 243, isDark ? 20 : 199);
        doc.roundedRect(60, currentY, 1160, 60, 6, 6, "F");

        doc.setTextColor(217, 119, 6);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text("REAL-WORLD CASE STUDIES & EXAMPLES:", 75, currentY + 20);

        doc.setTextColor(isDark ? 252 : 120, isDark ? 211 : 53, isDark ? 77 : 15);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        const splitEx = doc.splitTextToSize(slide.examples.join("  •  "), 1120);
        doc.text(splitEx, 75, currentY + 38);

        currentY += 70;
      }

      if (slide.metrics && slide.metrics.length > 0) {
        const metricWidth = 265;
        slide.metrics.forEach((m, mIdx) => {
          const mx = 60 + mIdx * (metricWidth + 20);
          doc.setFillColor(cardBgRgb.r, cardBgRgb.g, cardBgRgb.b);
          doc.roundedRect(mx, currentY, metricWidth, 90, 8, 8, "F");
          doc.setDrawColor(cardBorderRgb.r, cardBorderRgb.g, cardBorderRgb.b);
          doc.setLineWidth(1);
          doc.roundedRect(mx, currentY, metricWidth, 90, 8, 8, "S");

          doc.setTextColor(accentRgb.r, accentRgb.g, accentRgb.b);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(22);
          doc.text(m.value, mx + 15, currentY + 32);

          doc.setTextColor(textRgb.r, textRgb.g, textRgb.b);
          doc.setFontSize(11);
          doc.text(m.label, mx + 15, currentY + 54);

          doc.setTextColor(subtextRgb.r, subtextRgb.g, subtextRgb.b);
          doc.setFontSize(9);
          doc.text(m.detail, mx + 15, currentY + 72);
        });
      }
    }

    // Bottom Strategic Takeaway Bar
    if (slide.summaryTakeaway) {
      doc.setFillColor(cardBgRgb.r, cardBgRgb.g, cardBgRgb.b);
      doc.roundedRect(60, 595, 1160, 42, 6, 6, "F");
      doc.setDrawColor(cardBorderRgb.r, cardBorderRgb.g, cardBorderRgb.b);
      doc.setLineWidth(1);
      doc.roundedRect(60, 595, 1160, 42, 6, 6, "S");

      doc.setTextColor(accentRgb.r, accentRgb.g, accentRgb.b);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("STRATEGIC TAKEAWAY:", 75, 620);

      doc.setTextColor(subtextRgb.r, subtextRgb.g, subtextRgb.b);
      doc.setFont("helvetica", "normal");
      const splitTak = doc.splitTextToSize(slide.summaryTakeaway, 950);
      doc.text(splitTak, 215, 620);
    }

    // Footer Bar
    doc.setDrawColor(cardBorderRgb.r, cardBorderRgb.g, cardBorderRgb.b);
    doc.setLineWidth(1);
    doc.line(60, 665, 1220, 665);

    doc.setTextColor(subtextRgb.r, subtextRgb.g, subtextRgb.b);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(`${(config.topicName || "PRESENTATION").toUpperCase()} ESSENTIALS`, 60, 685);

    doc.setFont("helvetica", "bold");
    doc.text(`Slide ${slide.slideNumber} of ${slides.length}`, 1150, 685);
  });

  if (saveToFile) {
    const fileName =
      (config.topicName || "presentation").toLowerCase().replace(/[^a-z0-9]/g, "_") + "_slides.pdf";
    doc.save(fileName);
  }
  return doc;
}

// Native PowerPoint PPTX Renderer: Creates actual editable .pptx files using pptxgenjs!
async function legacyUnusedExportPptx(slides: StructuredSlide[], config: SlideDeckConfig) {
  const pptx = new pptxgen();

  pptx.layout = "LAYOUT_16x9";
  pptx.title = config.topicName;
  pptx.author = config.authorName;

  const hexColor = (config.accentColor || "#4f46e5").replace("#", "");
  const bgHex = (config.bgColor || "#0f172a").replace("#", "");
  const fgHex = (config.fgColor || "#f8fafc").replace("#", "");

  slides.forEach((slide) => {
    const pptxSlide = pptx.addSlide();

    // Background color
    pptxSlide.background = { color: bgHex };

    // Top Brand Accent Line
    pptxSlide.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 0,
      w: "100%",
      h: 0.1,
      fill: { color: hexColor }
    });

    // Badge
    if (slide.badge) {
      pptxSlide.addText(slide.badge.toUpperCase(), {
        x: 0.5,
        y: 0.4,
        w: 2.5,
        h: 0.3,
        fontSize: 10,
        bold: true,
        color: "FFFFFF",
        fill: { color: hexColor },
        align: "center"
      });
    }

    // Title
    pptxSlide.addText(slide.title, {
      x: 0.5,
      y: 0.8,
      w: 9.0,
      h: 0.6,
      fontSize: 22,
      bold: true,
      color: fgHex
    });

    // Subtitle
    if (slide.subtitle) {
      pptxSlide.addText(slide.subtitle, {
        x: 0.5,
        y: 1.4,
        w: 9.0,
        h: 0.4,
        fontSize: 12,
        color: "94A3B8"
      });
    }

    // Layout Specific Elements
    if (slide.layout === "title") {
      pptxSlide.addText(config.topicName.toUpperCase(), {
        x: 0.8,
        y: 2.2,
        w: 8.4,
        h: 1.2,
        fontSize: 34,
        bold: true,
        color: hexColor
      });

      pptxSlide.addText(`Presented by ${config.authorName} (${config.authorRole || "Expert"}, ${config.authorOrg || "Global Enterprise"})`, {
        x: 0.8,
        y: 3.5,
        w: 8.4,
        h: 0.5,
        fontSize: 16,
        color: "CBD5E1"
      });

      if (slide.definition) {
        pptxSlide.addText(slide.definition, {
          x: 0.8,
          y: 4.1,
          w: 8.4,
          h: 1.2,
          fontSize: 13,
          color: "E2E8F0"
        });
      }
    } else if (slide.layout === "agenda" && slide.bulletPoints && slide.bulletPoints.length > 0) {
      slide.bulletPoints.forEach((item, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const xPos = 0.5 + col * 4.6;
        const yPos = 2.0 + row * 0.8;

        if (yPos <= 5.2) {
          pptxSlide.addShape(pptx.ShapeType.roundRect, {
            x: xPos,
            y: yPos,
            w: 4.4,
            h: 0.7,
            fill: { color: "FFFFFF" },
            line: { color: "CBD5E1", width: 1 }
          });

          pptxSlide.addText(`${idx + 1}`, {
            x: xPos + 0.1,
            y: yPos + 0.1,
            w: 0.5,
            h: 0.5,
            fontSize: 12,
            bold: true,
            color: "FFFFFF",
            fill: { color: hexColor },
            align: "center"
          });

          pptxSlide.addText(item, {
            x: xPos + 0.7,
            y: yPos + 0.1,
            w: 3.5,
            h: 0.5,
            fontSize: 11,
            bold: true,
            color: "0F172A"
          });
        }
      });
    } else if (slide.layout === "funnel" && ((slide.gridItems && slide.gridItems.length > 0) || (slide.diagramNodes && slide.diagramNodes.length > 0))) {
      const items = (slide.gridItems && slide.gridItems.length > 0)
        ? slide.gridItems.map((g, i) => ({ title: g.title, desc: g.desc, badge: `STAGE ${i + 1}` }))
        : (slide.diagramNodes || []).map((n) => ({ title: n.title, desc: n.desc, badge: n.step }));
      const widths = [9.0, 7.8, 6.6, 5.4];
      items.forEach((item, idx) => {
        const w = widths[idx % 4];
        const xPos = 0.5 + (9.0 - w) / 2;
        const yPos = 2.0 + idx * 0.85;

        pptxSlide.addShape(pptx.ShapeType.roundRect, {
          x: xPos,
          y: yPos,
          w: w,
          h: 0.75,
          fill: { color: "FFFFFF" },
          line: { color: "CBD5E1", width: 1 }
        });

        pptxSlide.addText(item.badge || `STAGE ${idx + 1}`, {
          x: xPos + 0.15,
          y: yPos + 0.15,
          w: 1.2,
          h: 0.45,
          fontSize: 10,
          bold: true,
          color: "FFFFFF",
          fill: { color: hexColor },
          align: "center"
        });

        pptxSlide.addText(item.title, {
          x: xPos + 1.4,
          y: yPos + 0.1,
          w: w - 2.2,
          h: 0.3,
          fontSize: 12,
          bold: true,
          color: "0F172A"
        });

        pptxSlide.addText(item.desc, {
          x: xPos + 1.4,
          y: yPos + 0.38,
          w: w - 2.2,
          h: 0.3,
          fontSize: 10,
          color: "64748B"
        });

        pptxSlide.addText(`${100 - idx * 22}%`, {
          x: xPos + w - 0.7,
          y: yPos + 0.2,
          w: 0.6,
          h: 0.35,
          fontSize: 11,
          bold: true,
          color: hexColor,
          align: "right"
        });
      });
    } else if ((slide.layout === "grid4" || slide.layout === "trends" || slide.layout === "risk") && slide.gridItems && slide.gridItems.length > 0) {
      const cardWidth = 2.1;
      slide.gridItems.forEach((item, idx) => {
        const xPos = 0.5 + idx * 2.3;
        pptxSlide.addShape(pptx.ShapeType.roundRect, {
          x: xPos,
          y: 2.0,
          w: cardWidth,
          h: 3.5,
          fill: { color: "FFFFFF" },
          line: { color: "E2E8F0", width: 1 }
        });

        pptxSlide.addText(`${idx + 1}`, {
          x: xPos + 0.8,
          y: 2.2,
          w: 0.5,
          h: 0.5,
          fontSize: 14,
          bold: true,
          color: "FFFFFF",
          fill: { color: hexColor },
          align: "center"
        });

        pptxSlide.addText(item.title, {
          x: xPos + 0.1,
          y: 2.8,
          w: cardWidth - 0.2,
          h: 0.6,
          fontSize: 13,
          bold: true,
          color: "0F172A"
        });

        pptxSlide.addText(item.desc, {
          x: xPos + 0.1,
          y: 3.5,
          w: cardWidth - 0.2,
          h: 1.8,
          fontSize: 10,
          color: "64748B"
        });
      });
    } else if (slide.layout === "increment" && ((slide.diagramNodes && slide.diagramNodes.length > 0) || (slide.gridItems && slide.gridItems.length > 0))) {
      const items = (slide.diagramNodes && slide.diagramNodes.length > 0)
        ? slide.diagramNodes.map((n) => ({ title: n.title, desc: n.desc, badge: n.step }))
        : (slide.gridItems || []).map((g, i) => ({ title: g.title, desc: g.desc, badge: `LEVEL ${i + 1}` }));
      const cardWidth = 2.1;
      items.forEach((item, idx) => {
        const xPos = 0.5 + idx * 2.3;
        const cardH = 2.4 + idx * 0.3;
        const cardY = 2.0 + (0.9 - idx * 0.3);
        pptxSlide.addShape(pptx.ShapeType.roundRect, {
          x: xPos,
          y: cardY,
          w: cardWidth,
          h: cardH,
          fill: { color: "FFFFFF" },
          line: { color: "CBD5E1", width: 1 }
        });

        pptxSlide.addText(item.badge || `LEVEL ${idx + 1}`, {
          x: xPos + 0.2,
          y: cardY + 0.15,
          w: 1.7,
          h: 0.3,
          fontSize: 10,
          bold: true,
          color: "FFFFFF",
          fill: { color: hexColor },
          align: "center"
        });

        pptxSlide.addText(item.title, {
          x: xPos + 0.1,
          y: cardY + 0.55,
          w: cardWidth - 0.2,
          h: 0.6,
          fontSize: 12,
          bold: true,
          color: "0F172A"
        });

        pptxSlide.addText(item.desc, {
          x: xPos + 0.1,
          y: cardY + 1.25,
          w: cardWidth - 0.2,
          h: 1.0,
          fontSize: 10,
          color: "64748B"
        });
      });
    } else if ((slide.layout === "diagram" || slide.layout === "roadmap" || slide.layout === "implementation") && slide.diagramNodes && slide.diagramNodes.length > 0) {
      const nodeWidth = 2.1;
      slide.diagramNodes.forEach((node, idx) => {
        const xPos = 0.5 + idx * 2.3;
        pptxSlide.addShape(pptx.ShapeType.roundRect, {
          x: xPos,
          y: 2.0,
          w: nodeWidth,
          h: 3.5,
          fill: { color: "FFFFFF" },
          line: { color: "E2E8F0", width: 1 }
        });

        pptxSlide.addText(node.step, {
          x: xPos + 0.2,
          y: 2.2,
          w: 1.7,
          h: 0.3,
          fontSize: 10,
          bold: true,
          color: "FFFFFF",
          fill: { color: hexColor },
          align: "center"
        });

        pptxSlide.addText(node.title, {
          x: xPos + 0.1,
          y: 2.6,
          w: nodeWidth - 0.2,
          h: 0.6,
          fontSize: 13,
          bold: true,
          color: "0F172A"
        });

        pptxSlide.addText(node.desc, {
          x: xPos + 0.1,
          y: 3.3,
          w: nodeWidth - 0.2,
          h: 2.0,
          fontSize: 10,
          color: "64748B"
        });
      });
    } else if (slide.layout === "table" && slide.table && slide.table.headers && slide.table.headers.length > 0 && slide.table.rows && slide.table.rows.length > 0) {
      const rows = [slide.table.headers, ...slide.table.rows];
      pptxSlide.addTable(rows as any, {
        x: 0.5,
        y: 2.0,
        w: 9.0,
        colW: Array(slide.table.headers.length).fill(9.0 / slide.table.headers.length),
        border: { pt: 1, color: "CBD5E1" },
        fill: { color: "FFFFFF" },
        fontSize: 10
      });
    } else if (slide.layout === "metrics" && slide.metrics && slide.metrics.length > 0) {
      const metricWidth = 2.1;
      slide.metrics.forEach((m, idx) => {
        const mx = 0.5 + idx * 2.3;
        pptxSlide.addShape(pptx.ShapeType.roundRect, {
          x: mx,
          y: 2.0,
          w: metricWidth,
          h: 3.5,
          fill: { color: "FFFFFF" },
          line: { color: "E2E8F0", width: 1 }
        });

        pptxSlide.addText(m.value, {
          x: mx + 0.1,
          y: 2.2,
          w: metricWidth - 0.2,
          h: 0.8,
          fontSize: 28,
          bold: true,
          color: hexColor
        });

        pptxSlide.addText(m.label, {
          x: mx + 0.1,
          y: 3.1,
          w: metricWidth - 0.2,
          h: 0.6,
          fontSize: 12,
          bold: true,
          color: "0F172A"
        });

        pptxSlide.addText(m.detail, {
          x: mx + 0.1,
          y: 3.8,
          w: metricWidth - 0.2,
          h: 1.5,
          fontSize: 10,
          color: "64748B"
        });
      });
    } else {
      let curY = 2.0;

      if (slide.definition) {
        pptxSlide.addText(slide.definition, {
          x: 0.5,
          y: curY,
          w: 9.0,
          h: 0.8,
          fontSize: 12,
          color: "0F172A",
          fill: { color: "FFFFFF" }
        });
        curY += 0.9;
      }

      if (slide.bulletPoints && slide.bulletPoints.length > 0) {
        const bulletsText = slide.bulletPoints.map((p) => ({ text: p, options: { bullet: true } }));
        pptxSlide.addText(bulletsText as any, {
          x: 0.5,
          y: curY,
          w: 9.0,
          h: 1.8,
          fontSize: 11,
          color: fgHex
        });
        curY += 1.8;
      }

      if (slide.examples && slide.examples.length > 0) {
        const exText = "Case Studies & Examples:\n" + slide.examples.map((ex) => "• " + ex).join("\n");
        pptxSlide.addText(exText, {
          x: 0.5,
          y: curY,
          w: 9.0,
          h: 0.9,
          fontSize: 10,
          color: "D97706",
          fill: { color: "FEF3C7" }
        });
      }

      if (slide.metrics && slide.metrics.length > 0) {
        const metricWidth = 2.1;
        slide.metrics.forEach((m, idx) => {
          const mx = 0.5 + idx * 2.3;
          pptxSlide.addShape(pptx.ShapeType.roundRect, {
            x: mx,
            y: curY,
            w: metricWidth,
            h: 1.2,
            fill: { color: "FFFFFF" },
            line: { color: "E2E8F0", width: 1 }
          });

          pptxSlide.addText(m.value, {
            x: mx + 0.1,
            y: curY + 0.1,
            w: metricWidth - 0.2,
            h: 0.4,
            fontSize: 18,
            bold: true,
            color: hexColor
          });

          pptxSlide.addText(m.label, {
            x: mx + 0.1,
            y: curY + 0.5,
            w: metricWidth - 0.2,
            h: 0.3,
            fontSize: 11,
            bold: true,
            color: "0F172A"
          });

          pptxSlide.addText(m.detail, {
            x: mx + 0.1,
            y: curY + 0.8,
            w: metricWidth - 0.2,
            h: 0.3,
            fontSize: 9,
            color: "64748B"
          });
        });
      }
    }

    // Strategic Takeaway Footer
    if (slide.summaryTakeaway) {
      pptxSlide.addText(`STRATEGIC TAKEAWAY: ${slide.summaryTakeaway}`, {
        x: 0.5,
        y: 5.8,
        w: 9.0,
        h: 0.4,
        fontSize: 10,
        bold: true,
        color: hexColor,
        fill: { color: "FFFFFF" }
      });
    }

    // Slide Number Footer
    pptxSlide.addText(`${config.topicName.toUpperCase()} ESSENTIALS | Slide ${slide.slideNumber} of ${slides.length}`, {
      x: 0.5,
      y: 6.4,
      w: 9.0,
      h: 0.3,
      fontSize: 9,
      color: "94A3B8"
    });
  });

  const fileName =
    (config.topicName || "presentation").toLowerCase().replace(/[^a-z0-9]/g, "_") + "_slides.pptx";
  await pptx.writeFile({ fileName });
}
