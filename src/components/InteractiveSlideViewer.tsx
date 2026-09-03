import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Download,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  FileSpreadsheet,
  BookOpen,
  Loader2,
  Edit3,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Plus,
  Trash2,
  Table,
  Check,
  X,
  Stamp,
  BarChart2,
  Type,
  Palette,
  Layers,
  Move,
  ArrowUp,
  ArrowDown,
  Tag,
  PlusCircle,
  MinusCircle,
  Maximize2,
  Copy,
  Undo2,
  Redo2,
  Image as ImageIcon,
  Quote,
  CheckCircle2,
  TrendingUp,
  BarChart3,
  StickyNote,
  Sliders,
  Paintbrush,
  Heading1,
  Heading2,
  Layout,
  Minus,
  Eye,
  GripVertical,
  RotateCcw,
  Maximize,
  Sparkle,
  MousePointer
} from "lucide-react";
import {
  StructuredSlide,
  SlideDeckConfig,
  exportSlidesToPdf,
  exportSlidesToPptx,
  SlideTable,
  SlideMetric,
  FreeformElement
} from "../lib/slideGeneratorEngine";

interface InteractiveSlideViewerProps {
  slides: StructuredSlide[];
  config: SlideDeckConfig;
  onRegenerate?: () => void;
  onBack: () => void;
  onBackToChat?: () => void;
  mode?: "slide" | "document";
}

export type BulletStyle = "dot" | "check" | "number" | "arrow" | "square" | "star";

export function isLightColor(colorStr?: string): boolean {
  if (!colorStr) return true;
  let c = colorStr.trim().replace("#", "");
  if (c.length === 3) c = c.split("").map((x) => x + x).join("");
  const num = parseInt(c, 16);
  if (isNaN(num)) return true;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  return luminance > 140;
}

const FONT_FAMILIES = [
  { id: "'Space Grotesk', sans-serif", name: "Space Grotesk (Modern Tech)" },
  { id: "'Inter', sans-serif", name: "Inter (Clean UI)" },
  { id: "'Playfair Display', serif", name: "Playfair Display (Executive Editorial)" },
  { id: "'JetBrains Mono', monospace", name: "JetBrains Mono (Code/Technical)" },
  { id: "'Outfit', sans-serif", name: "Outfit (Geometric Display)" },
  { id: "system-ui, sans-serif", name: "System Sans" }
];

const STICKY_COLORS = [
  { bg: "#fef08a", text: "#854d0e", border: "#fde047", name: "Classic Yellow" },
  { bg: "#bbf7d0", text: "#166534", border: "#86efac", name: "Mint Green" },
  { bg: "#bae6fd", text: "#075985", border: "#7dd3fc", name: "Sky Blue" },
  { bg: "#fbcfe8", text: "#9d174d", border: "#f472b6", name: "Rose Pink" },
  { bg: "#e9d5ff", text: "#6b21a8", border: "#c084fc", name: "Soft Lavender" }
];

const CANVAS_THEMES = [
  { bg: "#0f172a", fg: "#f8fafc", name: "Slate Navy" },
  { bg: "#000000", fg: "#ffffff", name: "OLED Black" },
  { bg: "#1e1b4b", fg: "#f5f3ff", name: "Midnight Violet" },
  { bg: "#064e3b", fg: "#ecfdf5", name: "Deep Emerald" },
  { bg: "#451a03", fg: "#fffbeb", name: "Warm Amber" },
  { bg: "#f8fafc", fg: "#0f172a", name: "Clean Pearl Light" },
  { bg: "#fffbeb", fg: "#1c1917", name: "Warm Parchment Light" }
];

const EMOJI_STICKERS = ["⭐", "🚀", "💡", "🎯", "🔥", "📈", "🔒", "🏆", "⚡", "💎", "✅", "⚠️"];

// Helper to render bullet symbols cleanly
const RenderBulletSymbol: React.FC<{
  idx: number;
  style: BulletStyle;
  accentColor: string;
}> = ({ idx, style, accentColor }) => {
  switch (style) {
    case "check":
      return <span style={{ color: accentColor }} className="font-black text-xs shrink-0 mt-0.5 select-none">✓</span>;
    case "number":
      return <span style={{ color: accentColor }} className="font-bold text-xs shrink-0 mt-0.5 font-mono select-none">{idx + 1}.</span>;
    case "arrow":
      return <span style={{ color: accentColor }} className="font-black text-xs shrink-0 mt-0.5 select-none">➔</span>;
    case "square":
      return <span style={{ backgroundColor: accentColor }} className="w-1.5 h-1.5 rounded-xs shrink-0 mt-1.5 select-none" />;
    case "star":
      return <span style={{ color: accentColor }} className="font-black text-xs shrink-0 mt-0.5 select-none">★</span>;
    default:
      return <span style={{ backgroundColor: accentColor }} className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 select-none" />;
  }
};

// Pixel-Perfect Slide / A4 Canvas Component with Drag & Drop Freeform Elements
const SlideCard: React.FC<{
  slide: StructuredSlide;
  slideIdx: number;
  totalSlides: number;
  config: SlideDeckConfig;
  bulletStyle: BulletStyle;
  watermarkEnabled: boolean;
  watermarkType?: "text" | "image";
  watermarkText: string;
  watermarkImageUrl?: string;
  watermarkOpacity: number;
  watermarkRotation?: number;
  watermarkSize?: number;
  watermarkColor?: string;
  activeFontSize: number;
  activeTextColor: string;
  activeBgHighlight: string;
  activeAlign: "left" | "center" | "right";
  isBoldText: boolean;
  isItalicText: boolean;
  isUnderlineText: boolean;
  isStrikethroughText: boolean;
  activeFontFamily: string;
  isEditMode: boolean;
  isActiveSlide: boolean;
  selectedFreeformId: string | null;
  mode?: "slide" | "document";
  onSelectFreeform: (id: string | null) => void;
  onSelectSlide: () => void;
  onUpdateSlide: (updated: StructuredSlide) => void;
}> = ({
  slide,
  slideIdx,
  totalSlides,
  config,
  bulletStyle,
  watermarkEnabled,
  watermarkType = "text",
  watermarkText,
  watermarkImageUrl,
  watermarkOpacity,
  watermarkRotation = -30,
  watermarkSize = 1,
  watermarkColor = "#ffffff",
  activeFontSize,
  activeTextColor,
  activeBgHighlight,
  activeAlign,
  isBoldText,
  isItalicText,
  isUnderlineText,
  isStrikethroughText,
  activeFontFamily,
  isEditMode,
  isActiveSlide,
  selectedFreeformId,
  mode = "slide",
  onSelectFreeform,
  onSelectSlide,
  onUpdateSlide
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const slideCanvasRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number>(1);
  const [draggingElemId, setDraggingElemId] = useState<string | null>(null);
  const dragStartPos = useRef<{ mouseX: number; mouseY: number; initialX: number; initialY: number } | null>(null);

  const isSlideMode = mode === "slide";
  const canvasWidth = isSlideMode ? 960 : 794;
  const canvasHeight = isSlideMode ? 540 : 1123;
  const aspectRatioStr = isSlideMode ? "16 / 9" : "210 / 297";

  // ResizeObserver for responsive scaling
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        if (width > 0) {
          setScale(width / canvasWidth);
        }
      }
    });

    observer.observe(el);
    if (el.clientWidth > 0) {
      setScale(el.clientWidth / canvasWidth);
    }

    return () => observer.disconnect();
  }, [canvasWidth]);

  const isDoc = mode === "document";
  const accentColor = slide.accentColor || config.accentColor || "#4f46e5";
  const fontFamily = activeFontFamily || config.font || "'Space Grotesk', sans-serif";
  const bgColor = isDoc ? "#ffffff" : (slide.bgColor || config.bgColor || "#ffffff");
  const isBgLight = isDoc || isLightColor(bgColor);
  const fgColor = isDoc ? "#0f172a" : (slide.fgColor || config.fgColor || (isBgLight ? "#0f172a" : "#f8fafc"));
  const layoutNum = config.layoutNumber || 1;

  // Dynamic contrast-adaptive classes for cards, borders, and typography
  const cardBgClass = isBgLight
    ? "bg-slate-100/90 border border-slate-200/90 text-slate-900 shadow-2xs"
    : "bg-white/10 border border-white/10 text-white backdrop-blur-xs shadow-xs";
  const cardTitleClass = isBgLight ? "text-slate-900" : "text-white";
  const cardDescClass = isBgLight ? "text-slate-600 font-medium" : "opacity-80";
  const cardMutedClass = isBgLight ? "text-slate-500 font-semibold" : "opacity-60";
  const cardInnerClass = isBgLight ? "bg-white/90 border border-slate-200" : "bg-black/20 border border-white/10";
  const footerBgClass = isBgLight ? "bg-slate-100 text-slate-600 border-t border-slate-200" : "bg-black/40 border-t border-white/10 text-white opacity-70";

  // Highlight editable elements when in Edit Mode
  const editHighlightClass = isEditMode
    ? "hover:bg-amber-500/10 hover:outline-dashed hover:outline-1 hover:outline-amber-400 focus:bg-amber-500/20 focus:outline-2 focus:outline-amber-400 rounded px-1 transition-all cursor-text"
    : "";

  // Common formatting style generator
  const getTextFormattingStyle = () => ({
    fontSize: activeFontSize ? `${activeFontSize}px` : undefined,
    color: activeTextColor || undefined,
    backgroundColor: activeBgHighlight !== "transparent" ? activeBgHighlight : undefined,
    textAlign: activeAlign,
    fontWeight: isBoldText ? 900 : undefined,
    fontStyle: isItalicText ? "italic" : undefined,
    textDecoration: [
      isUnderlineText ? "underline" : "",
      isStrikethroughText ? "line-through" : ""
    ].filter(Boolean).join(" ") || undefined
  });

  // Handle Free Space Click to Write Anywhere on Page
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isEditMode) {
      onSelectSlide();
      return;
    }

    // Check if target is background canvas (not an existing button/input/editable text)
    const target = e.target as HTMLElement;
    const isBackground = target.getAttribute("data-is-canvas") === "true";

    if (isBackground && slideCanvasRef.current) {
      const rect = slideCanvasRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      // Calculate percentage positions relative to 960x540 canvas
      const xPercent = Math.max(3, Math.min(80, (clickX / rect.width) * 100));
      const yPercent = Math.max(3, Math.min(80, (clickY / rect.height) * 100));

      const newElement: FreeformElement = {
        id: `free-${Date.now()}`,
        type: "text",
        text: "Click to write freeform text...",
        x: xPercent,
        y: yPercent,
        fontSize: activeFontSize || 16,
        color: activeTextColor || "#ffffff",
        bgColor: activeBgHighlight !== "transparent" ? activeBgHighlight : "transparent",
        align: activeAlign,
        bold: isBoldText,
        italic: isItalicText,
        underline: isUnderlineText,
        strikethrough: isStrikethroughText
      };

      onUpdateSlide({
        ...slide,
        customElements: [...(slide.customElements || []), newElement]
      });
      onSelectFreeform(newElement.id);
    }
  };

  // Drag & Drop Handlers for Freeform Elements
  const handleStartDrag = (e: React.MouseEvent, elem: FreeformElement) => {
    if (!isEditMode) return;
    e.stopPropagation();
    onSelectFreeform(elem.id);
    setDraggingElemId(elem.id);
    dragStartPos.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      initialX: elem.x,
      initialY: elem.y
    };
  };

  useEffect(() => {
    if (!draggingElemId) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStartPos.current || !slideCanvasRef.current) return;
      const rect = slideCanvasRef.current.getBoundingClientRect();
      const deltaX = e.clientX - dragStartPos.current.mouseX;
      const deltaY = e.clientY - dragStartPos.current.mouseY;

      const deltaXPercent = (deltaX / rect.width) * 100;
      const deltaYPercent = (deltaY / rect.height) * 100;

      const newX = Math.max(0, Math.min(90, dragStartPos.current.initialX + deltaXPercent));
      const newY = Math.max(0, Math.min(90, dragStartPos.current.initialY + deltaYPercent));

      const updatedElements = (slide.customElements || []).map((el) =>
        el.id === draggingElemId ? { ...el, x: Math.round(newX * 10) / 10, y: Math.round(newY * 10) / 10 } : el
      );

      onUpdateSlide({ ...slide, customElements: updatedElements });
    };

    const handleMouseUp = () => {
      setDraggingElemId(null);
      dragStartPos.current = null;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [draggingElemId, slide, onUpdateSlide]);

  // Bullet point reordering and deletion
  const handleMoveBullet = (index: number, direction: "up" | "down") => {
    if (!slide.bulletPoints) return;
    const bullets = [...slide.bulletPoints];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= bullets.length) return;

    const temp = bullets[index];
    bullets[index] = bullets[targetIndex];
    bullets[targetIndex] = temp;
    onUpdateSlide({ ...slide, bulletPoints: bullets });
  };

  const handleDeleteBullet = (index: number) => {
    if (!slide.bulletPoints) return;
    const bullets = slide.bulletPoints.filter((_, i) => i !== index);
    onUpdateSlide({ ...slide, bulletPoints: bullets });
  };

  const handleDeleteMetric = (index: number) => {
    if (!slide.metrics) return;
    const metrics = slide.metrics.filter((_, i) => i !== index);
    onUpdateSlide({ ...slide, metrics: metrics });
  };

  const handleDeleteFreeform = (id: string) => {
    if (!slide.customElements) return;
    const elements = slide.customElements.filter((el) => el.id !== id);
    onUpdateSlide({ ...slide, customElements: elements });
    if (selectedFreeformId === id) onSelectFreeform(null);
  };

  const handleDuplicateFreeform = (elem: FreeformElement) => {
    const dup: FreeformElement = {
      ...elem,
      id: `${elem.type}-${Date.now()}`,
      x: Math.min(85, elem.x + 4),
      y: Math.min(85, elem.y + 4)
    };
    onUpdateSlide({
      ...slide,
      customElements: [...(slide.customElements || []), dup]
    });
    onSelectFreeform(dup.id);
  };

  return (
    <div
      ref={wrapperRef}
      onClick={onSelectSlide}
      className={`w-full max-w-3xl relative overflow-hidden rounded-2xl shadow-xl border shrink-0 transition-all ${
        isActiveSlide && isEditMode
          ? "border-amber-400 ring-2 ring-amber-400/40 shadow-amber-500/10"
          : "border-zinc-300/80 dark:border-zinc-800"
      }`}
      style={{ aspectRatio: aspectRatioStr }}
    >
      <div
        className="origin-top-left absolute top-0 left-0 pointer-events-auto backface-hidden"
        style={{
          width: `${canvasWidth}px`,
          height: `${canvasHeight}px`,
          transform: `scale(${scale})`,
          willChange: "transform",
          transformOrigin: "top left"
        }}
      >
        <div
          id={`slide-node-${slideIdx}`}
          ref={slideCanvasRef}
          data-slide-index={slideIdx}
          data-is-canvas="true"
          onClick={handleCanvasClick}
          className={`flex flex-col justify-between select-text relative overflow-hidden ${
            isEditMode ? "cursor-crosshair" : "cursor-default"
          }`}
          style={{
            width: `${canvasWidth}px`,
            height: `${canvasHeight}px`,
            background: bgColor,
            color: fgColor,
            fontFamily: fontFamily,
            imageRendering: "-webkit-optimize-contrast",
            textRendering: "optimizeLegibility",
            WebkitFontSmoothing: "antialiased",
            MozOsxFontSmoothing: "grayscale"
          }}
        >
          {/* Watermark Overlay */}
          {watermarkEnabled && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 overflow-hidden select-none">
              <div
                style={{
                  transform: `rotate(${watermarkRotation}deg) scale(${watermarkSize})`,
                  opacity: watermarkOpacity
                }}
                className="transition-transform duration-200"
              >
                {watermarkType === "image" && watermarkImageUrl ? (
                  <img
                    src={watermarkImageUrl}
                    alt="Watermark Stamp"
                    className="max-w-[320px] max-h-[320px] object-contain filter drop-shadow-2xl"
                  />
                ) : (
                  <div
                    className="text-5xl sm:text-7xl font-black uppercase tracking-widest border-4 px-8 py-3 rounded-2xl whitespace-nowrap shadow-2xl backdrop-blur-[1px]"
                    style={{
                      color: watermarkColor || "#ffffff",
                      borderColor: watermarkColor || "#ffffff"
                    }}
                  >
                    {watermarkText || "WATERMARK"}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Template Accent Decoration Shapes */}
          {layoutNum === 2 && (
            <div
              className="absolute right-0 top-0 bottom-0 w-3 shrink-0 h-full pointer-events-none"
              style={{ backgroundColor: accentColor }}
            />
          )}
          {layoutNum === 3 && (
            <div
              className="absolute inset-0 opacity-10 pointer-events-none"
              style={{
                background: accentColor,
                clipPath: "polygon(65% 0, 100% 0, 100% 100%, 45% 100%)"
              }}
            />
          )}

          {/* Freeform Draggable Floating Elements (Text, Sticky Notes, Badges, Quotes, Images, Dividers) */}
          {slide.customElements?.map((elem) => {
            const isSelected = selectedFreeformId === elem.id;

            return (
              <div
                key={elem.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectFreeform(elem.id);
                }}
                style={{
                  position: "absolute",
                  left: `${elem.x}%`,
                  top: `${elem.y}%`,
                  zIndex: isSelected ? 50 : 40,
                  transform: elem.rotation ? `rotate(${elem.rotation}deg)` : undefined
                }}
                className={`transition-shadow ${
                  isEditMode ? "group cursor-move" : ""
                } ${
                  isSelected && isEditMode
                    ? "ring-2 ring-amber-400 shadow-2xl rounded-xl bg-amber-500/10 p-1"
                    : "p-0.5"
                }`}
              >
                {/* Element Drag Header Bar in Edit Mode */}
                {isEditMode && (
                  <div
                    onMouseDown={(e) => handleStartDrag(e, elem)}
                    className="flex items-center justify-between gap-2 bg-zinc-900/90 text-amber-300 text-[10px] font-black uppercase px-2 py-1 rounded-t-lg select-none cursor-grab active:cursor-grabbing border-b border-amber-500/30 shadow-md"
                  >
                    <span className="flex items-center gap-1">
                      <GripVertical size={11} />
                      {elem.type.toUpperCase()}
                    </span>
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleDuplicateFreeform(elem)}
                        className="p-0.5 hover:bg-white/20 rounded cursor-pointer text-white"
                        title="Duplicate"
                      >
                        <Copy size={11} />
                      </button>
                      <button
                        onClick={() => handleDeleteFreeform(elem.id)}
                        className="p-0.5 bg-rose-600 hover:bg-rose-500 rounded cursor-pointer text-white"
                        title="Delete"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Freeform Element Content Types */}
                {elem.type === "note" ? (
                  /* Sticky Note Card */
                  <div
                    className="p-3.5 rounded-xl shadow-lg border text-xs max-w-[260px] min-w-[150px] leading-relaxed relative"
                    style={{
                      backgroundColor: elem.bgColor || "#fef08a",
                      color: elem.color || "#854d0e",
                      borderColor: elem.borderColor || "#fde047"
                    }}
                  >
                    <div
                      contentEditable={isEditMode}
                      suppressContentEditableWarning
                      onBlur={(e) => {
                        const updatedText = e.currentTarget.innerText;
                        const updated = (slide.customElements || []).map((el) =>
                          el.id === elem.id ? { ...el, text: updatedText } : el
                        );
                        onUpdateSlide({ ...slide, customElements: updated });
                      }}
                      className="outline-none font-medium"
                    >
                      {elem.text}
                    </div>
                  </div>
                ) : elem.type === "quote" ? (
                  /* Quote Box */
                  <div
                    className="p-3 bg-white/10 border-l-4 rounded-r-xl max-w-[320px] min-w-[160px] text-xs flex gap-2.5 items-start"
                    style={{ borderLeftColor: elem.color || accentColor }}
                  >
                    <Quote size={16} className="shrink-0 mt-0.5 opacity-80" style={{ color: elem.color || accentColor }} />
                    <div
                      contentEditable={isEditMode}
                      suppressContentEditableWarning
                      onBlur={(e) => {
                        const updatedText = e.currentTarget.innerText;
                        const updated = (slide.customElements || []).map((el) =>
                          el.id === elem.id ? { ...el, text: updatedText } : el
                        );
                        onUpdateSlide({ ...slide, customElements: updated });
                      }}
                      className="outline-none italic font-semibold leading-relaxed"
                      style={{ color: elem.color || "#ffffff" }}
                    >
                      {elem.text}
                    </div>
                  </div>
                ) : elem.type === "badge" ? (
                  /* Badge Tag */
                  <div
                    contentEditable={isEditMode}
                    suppressContentEditableWarning
                    onBlur={(e) => {
                      const updatedText = e.currentTarget.innerText;
                      const updated = (slide.customElements || []).map((el) =>
                        el.id === elem.id ? { ...el, text: updatedText } : el
                      );
                      onUpdateSlide({ ...slide, customElements: updated });
                    }}
                    className="px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider shadow-md outline-none whitespace-nowrap"
                    style={{
                      backgroundColor: elem.bgColor || accentColor,
                      color: elem.color || "#ffffff"
                    }}
                  >
                    {elem.text}
                  </div>
                ) : elem.type === "sticker" ? (
                  /* Emoji / Icon Sticker */
                  <div
                    contentEditable={isEditMode}
                    suppressContentEditableWarning
                    onBlur={(e) => {
                      const updatedText = e.currentTarget.innerText;
                      const updated = (slide.customElements || []).map((el) =>
                        el.id === elem.id ? { ...el, text: updatedText } : el
                      );
                      onUpdateSlide({ ...slide, customElements: updated });
                    }}
                    className="text-3xl select-none outline-none cursor-pointer"
                  >
                    {elem.text}
                  </div>
                ) : elem.type === "image" ? (
                  /* Freeform Draggable Image Element */
                  <div className="relative group max-w-[320px] rounded-xl overflow-hidden shadow-xl border border-white/30 bg-black/30 p-1">
                    <img
                      src={elem.imageUrl || elem.text}
                      alt="Freeform Visual"
                      className="w-full h-auto object-contain max-h-[220px] rounded-lg"
                    />
                  </div>
                ) : elem.type === "divider" ? (
                  /* Divider Line */
                  <div
                    className="w-48 h-1 rounded-full shadow-xs"
                    style={{ backgroundColor: elem.color || accentColor }}
                  />
                ) : (
                  /* Standard Free Text Box */
                  <div
                    contentEditable={isEditMode}
                    suppressContentEditableWarning
                    onBlur={(e) => {
                      const updatedText = e.currentTarget.innerText;
                      const updated = (slide.customElements || []).map((el) =>
                        el.id === elem.id ? { ...el, text: updatedText } : el
                      );
                      onUpdateSlide({ ...slide, customElements: updated });
                    }}
                    className="outline-none min-w-[120px] max-w-[380px] leading-snug p-1 rounded"
                    style={{
                      fontSize: elem.fontSize ? `${elem.fontSize}px` : "16px",
                      color: elem.color || "#ffffff",
                      backgroundColor: elem.bgColor !== "transparent" ? elem.bgColor : undefined,
                      textAlign: elem.align || "left",
                      fontWeight: elem.bold ? 900 : "normal",
                      fontStyle: elem.italic ? "italic" : "normal",
                      textDecoration: [
                        elem.underline ? "underline" : "",
                        elem.strikethrough ? "line-through" : ""
                      ].filter(Boolean).join(" ") || "none",
                      fontFamily: elem.fontFamily || undefined
                    }}
                  >
                    {elem.text}
                  </div>
                )}
              </div>
            );
          })}

          {/* Top Brand Accent Line */}
          <div data-is-canvas="true" className="h-1.5 w-full shrink-0" style={{ backgroundColor: accentColor }} />

          {/* Main Slide Body */}
          <div data-is-canvas="true" className="flex-1 p-8 flex flex-col justify-between relative z-10 overflow-hidden">
            {/* Slide Header */}
            <div data-is-canvas="true" className="shrink-0 mb-3">
              <div data-is-canvas="true" className="flex items-center justify-between gap-2 mb-1.5">
                <span
                  contentEditable={isEditMode}
                  suppressContentEditableWarning
                  onBlur={(e) => onUpdateSlide({ ...slide, badge: e.currentTarget.innerText })}
                  className={`text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-md text-white shadow-xs outline-none ${editHighlightClass}`}
                  style={{ backgroundColor: accentColor }}
                >
                  {slide.badge || "PRESENTATION"}
                </span>
              </div>

              {/* Title Editable Directly On Page */}
              <h2
                contentEditable={isEditMode}
                suppressContentEditableWarning
                onBlur={(e) => onUpdateSlide({ ...slide, title: e.currentTarget.innerText })}
                className={`text-2xl sm:text-3xl font-extrabold tracking-tight leading-snug line-clamp-2 outline-none ${editHighlightClass}`}
                style={{
                  fontFamily: fontFamily,
                  ...getTextFormattingStyle()
                }}
              >
                {slide.title}
              </h2>

              {/* Subtitle Editable Directly On Page */}
              {(slide.subtitle || isEditMode) && (
                <p
                  contentEditable={isEditMode}
                  suppressContentEditableWarning
                  onBlur={(e) => onUpdateSlide({ ...slide, subtitle: e.currentTarget.innerText })}
                  className={`text-xs sm:text-sm font-medium mt-0.5 opacity-80 line-clamp-1 outline-none ${editHighlightClass}`}
                  style={getTextFormattingStyle()}
                >
                  {slide.subtitle || (isEditMode ? "Click to add subtitle..." : "")}
                </p>
              )}
            </div>

            {/* Layout Content Body */}
            <div data-is-canvas="true" className="flex-1 my-2 flex flex-col justify-center overflow-hidden">
              {slide.layout === "title" ? (
                /* Cover Title Slide / Page */
                <div data-is-canvas="true" className={`${cardBgClass} rounded-2xl p-8 flex flex-col justify-between relative overflow-hidden h-full`}>
                  <div>
                    <div className="w-16 h-1.5 rounded-full mb-4" style={{ backgroundColor: accentColor }} />
                    <h1
                      contentEditable={isEditMode}
                      suppressContentEditableWarning
                      onBlur={(e) => onUpdateSlide({ ...slide, title: e.currentTarget.innerText })}
                      className={`text-4xl font-black uppercase tracking-tight mb-3 leading-tight line-clamp-2 outline-none ${cardTitleClass} ${editHighlightClass}`}
                      style={{
                        fontFamily: fontFamily,
                        ...getTextFormattingStyle()
                      }}
                    >
                      {slide.title || config.topicName}
                    </h1>
                    <p className={`text-sm font-bold mb-4 line-clamp-1 ${cardDescClass}`}>
                      Presented by {config.authorName} • {config.authorRole || "Expert"} ({config.authorOrg || "Enterprise"})
                    </p>
                  </div>

                  {(slide.definition || isEditMode) && (
                    <div className={`${cardInnerClass} border-l-4 p-4 rounded-r-xl shadow-2xs`} style={{ borderLeftColor: accentColor }}>
                      <p
                        contentEditable={isEditMode}
                        suppressContentEditableWarning
                        onBlur={(e) => onUpdateSlide({ ...slide, definition: e.currentTarget.innerText })}
                        className={`text-xs leading-relaxed max-w-3xl line-clamp-4 outline-none ${cardTitleClass} ${editHighlightClass}`}
                        style={getTextFormattingStyle()}
                      >
                        {slide.definition || (isEditMode ? "Click to edit presentation overview..." : "")}
                      </p>
                    </div>
                  )}
                </div>
              ) : slide.layout === "agenda" ? (
                /* Agenda & Roadmap */
                <div className="grid grid-cols-2 gap-3">
                  {((slide.bulletPoints && slide.bulletPoints.length > 0) ? slide.bulletPoints : [
                    "01. Core Foundations & Strategic Overview",
                    "02. Operational Framework & Pillars",
                    "03. Process Architecture & Workflows",
                    "04. Quantitative KPIs & Benchmarks",
                    "05. Risk Governance & Mitigation",
                    "06. Action Plan & Scaling Roadmap"
                  ]).slice(0, 6).map((item, idx) => (
                    <div
                      key={idx}
                      className={`${cardBgClass} p-3 rounded-xl flex items-center justify-between gap-3 group`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-black shrink-0"
                          style={{ backgroundColor: accentColor }}
                        >
                          {idx + 1}
                        </div>
                        <span
                          contentEditable={isEditMode}
                          suppressContentEditableWarning
                          onBlur={(e) => {
                            const updated = [...(slide.bulletPoints || [])];
                            updated[idx] = e.currentTarget.innerText;
                            onUpdateSlide({ ...slide, bulletPoints: updated });
                          }}
                          className={`text-xs font-bold line-clamp-2 outline-none flex-1 ${cardTitleClass} ${editHighlightClass}`}
                          style={getTextFormattingStyle()}
                        >
                          {item}
                        </span>
                      </div>
                      {isEditMode && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <button
                            onClick={() => handleMoveBullet(idx, "up")}
                            disabled={idx === 0}
                            className="p-1 bg-black/10 hover:bg-black/20 rounded disabled:opacity-30 cursor-pointer text-slate-700 dark:text-slate-300"
                          >
                            <ArrowUp size={11} />
                          </button>
                          <button
                            onClick={() => handleMoveBullet(idx, "down")}
                            disabled={idx === (slide.bulletPoints?.length || 0) - 1}
                            className="p-1 bg-black/10 hover:bg-black/20 rounded disabled:opacity-30 cursor-pointer text-slate-700 dark:text-slate-300"
                          >
                            <ArrowDown size={11} />
                          </button>
                          <button
                            onClick={() => handleDeleteBullet(idx)}
                            className="p-1 bg-rose-600/80 hover:bg-rose-600 text-white rounded cursor-pointer"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (slide.layout === "grid4" || slide.layout === "trends" || slide.layout === "risk") && slide.gridItems && slide.gridItems.length > 0 ? (
                /* 4-Card Bento Matrix Layout */
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 h-full">
                  {slide.gridItems.slice(0, 4).map((item, idx) => (
                    <div
                      key={idx}
                      className={`${cardBgClass} p-3.5 rounded-xl flex flex-col justify-between shadow-xs group relative`}
                    >
                      <div>
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-black mb-2 shadow-xs"
                          style={{ backgroundColor: accentColor }}
                        >
                          0{idx + 1}
                        </div>
                        <h4
                          contentEditable={isEditMode}
                          suppressContentEditableWarning
                          onBlur={(e) => {
                            const updated = [...(slide.gridItems || [])];
                            updated[idx].title = e.currentTarget.innerText;
                            onUpdateSlide({ ...slide, gridItems: updated });
                          }}
                          className={`text-xs font-black mb-1 line-clamp-2 outline-none ${cardTitleClass} ${editHighlightClass}`}
                          style={getTextFormattingStyle()}
                        >
                          {item.title}
                        </h4>
                        <p
                          contentEditable={isEditMode}
                          suppressContentEditableWarning
                          onBlur={(e) => {
                            const updated = [...(slide.gridItems || [])];
                            updated[idx].desc = e.currentTarget.innerText;
                            onUpdateSlide({ ...slide, gridItems: updated });
                          }}
                          className={`text-[11px] leading-relaxed line-clamp-4 outline-none ${cardDescClass} ${editHighlightClass}`}
                          style={getTextFormattingStyle()}
                        >
                          {item.desc}
                        </p>
                      </div>
                      <div className={`mt-2 pt-2 border-t border-black/5 dark:border-white/10 flex items-center justify-between text-[9px] font-bold ${cardMutedClass}`}>
                        <span>PILLAR 0{idx + 1}</span>
                        <CheckCircle2 size={10} style={{ color: accentColor }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (slide.layout === "diagram" || slide.layout === "roadmap" || slide.layout === "implementation") && slide.diagramNodes && slide.diagramNodes.length > 0 ? (
                /* 4-Step Process Pipeline Flow */
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 h-full">
                  {slide.diagramNodes.slice(0, 4).map((node, idx) => (
                    <div
                      key={idx}
                      className={`${cardBgClass} p-3 rounded-xl flex flex-col justify-between shadow-xs group relative`}
                    >
                      <div>
                        <span
                          contentEditable={isEditMode}
                          suppressContentEditableWarning
                          onBlur={(e) => {
                            const updated = [...(slide.diagramNodes || [])];
                            updated[idx].step = e.currentTarget.innerText;
                            onUpdateSlide({ ...slide, diagramNodes: updated });
                          }}
                          className="inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider text-white mb-2 shadow-xs"
                          style={{ backgroundColor: accentColor }}
                        >
                          {node.step || `STEP 0${idx + 1}`}
                        </span>
                        <h4
                          contentEditable={isEditMode}
                          suppressContentEditableWarning
                          onBlur={(e) => {
                            const updated = [...(slide.diagramNodes || [])];
                            updated[idx].title = e.currentTarget.innerText;
                            onUpdateSlide({ ...slide, diagramNodes: updated });
                          }}
                          className={`text-xs font-black mb-1 line-clamp-2 outline-none ${cardTitleClass} ${editHighlightClass}`}
                          style={getTextFormattingStyle()}
                        >
                          {node.title}
                        </h4>
                        <p
                          contentEditable={isEditMode}
                          suppressContentEditableWarning
                          onBlur={(e) => {
                            const updated = [...(slide.diagramNodes || [])];
                            updated[idx].desc = e.currentTarget.innerText;
                            onUpdateSlide({ ...slide, diagramNodes: updated });
                          }}
                          className={`text-[10.5px] leading-relaxed line-clamp-4 outline-none ${cardDescClass} ${editHighlightClass}`}
                          style={getTextFormattingStyle()}
                        >
                          {node.desc}
                        </p>
                      </div>
                      <div className={`mt-2 flex items-center justify-between text-[9px] font-bold ${cardMutedClass}`}>
                        <span>PHASE {idx + 1} OF 4</span>
                        <ChevronRight size={12} style={{ color: accentColor }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : slide.layout === "increment" && ((slide.diagramNodes && slide.diagramNodes.length > 0) || (slide.gridItems && slide.gridItems.length > 0)) ? (
                /* Ascending Maturity Staircase Diagram */
                <div className="grid grid-cols-4 gap-2.5 items-end h-full">
                  {((slide.diagramNodes && slide.diagramNodes.length > 0)
                    ? slide.diagramNodes.map((n) => ({ title: n.title, desc: n.desc, badge: n.step }))
                    : (slide.gridItems || []).map((g, i) => ({ title: g.title, desc: g.desc, badge: `LEVEL 0${i + 1}` }))
                  ).slice(0, 4).map((item, idx) => (
                    <div
                      key={idx}
                      className={`${cardBgClass} p-3 rounded-xl flex flex-col justify-between shadow-xs`}
                      style={{ minHeight: `${140 + idx * 30}px` }}
                    >
                      <div>
                        <span
                          className="inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider text-white mb-2 shadow-xs"
                          style={{ backgroundColor: accentColor }}
                        >
                          {item.badge || `LEVEL 0${idx + 1}`}
                        </span>
                        <h4 className={`text-xs font-black mb-1 line-clamp-2 ${cardTitleClass}`}>
                          {item.title}
                        </h4>
                        <p className={`text-[10px] leading-relaxed line-clamp-3 ${cardDescClass}`}>
                          {item.desc}
                        </p>
                      </div>
                      <div className="mt-2 text-[9px] font-extrabold flex items-center justify-between" style={{ color: accentColor }}>
                        <span>+{25 * (idx + 1)}% ROI</span>
                        <TrendingUp size={11} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : slide.layout === "funnel" && ((slide.diagramNodes && slide.diagramNodes.length > 0) || (slide.gridItems && slide.gridItems.length > 0)) ? (
                /* 4-Stage Progressive Value Funnel */
                <div className="space-y-2">
                  {((slide.diagramNodes && slide.diagramNodes.length > 0)
                    ? slide.diagramNodes.map((n) => ({ title: n.title, desc: n.desc, badge: n.step }))
                    : (slide.gridItems || []).map((g, i) => ({ title: g.title, desc: g.desc, badge: `STAGE 0${i + 1}` }))
                  ).slice(0, 4).map((stage, idx) => {
                    const widths = ["w-full", "w-[92%]", "w-[84%]", "w-[76%]"];
                    return (
                      <div
                        key={idx}
                        className={`mx-auto ${widths[idx]} ${cardBgClass} p-2.5 rounded-xl shadow-xs flex items-center justify-between gap-3`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <span
                            className="px-2 py-0.5 rounded text-[9px] font-black text-white shrink-0"
                            style={{ backgroundColor: accentColor }}
                          >
                            {stage.badge || `STAGE 0${idx + 1}`}
                          </span>
                          <div className="min-w-0 flex-1">
                            <h4 className={`text-xs font-black truncate ${cardTitleClass}`}>{stage.title}</h4>
                            <p className={`text-[10px] truncate ${cardDescClass}`}>{stage.desc}</p>
                          </div>
                        </div>
                        <span className="text-xs font-black shrink-0" style={{ color: accentColor }}>
                          {100 - idx * 22}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : slide.layout === "metrics" && slide.metrics && slide.metrics.length > 0 ? (
                /* Primary KPI Scorecard Layout */
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 h-full">
                  {slide.metrics.slice(0, 4).map((m, idx) => (
                    <div
                      key={idx}
                      className={`${cardBgClass} p-4 rounded-xl flex flex-col justify-between shadow-xs group relative`}
                    >
                      <div>
                        <div
                          contentEditable={isEditMode}
                          suppressContentEditableWarning
                          onBlur={(e) => {
                            const updated = [...(slide.metrics || [])];
                            updated[idx].value = e.currentTarget.innerText;
                            onUpdateSlide({ ...slide, metrics: updated });
                          }}
                          className={`text-2xl sm:text-3xl font-black mb-1.5 outline-none ${editHighlightClass}`}
                          style={{ color: accentColor, ...getTextFormattingStyle() }}
                        >
                          {m.value}
                        </div>
                        <div
                          contentEditable={isEditMode}
                          suppressContentEditableWarning
                          onBlur={(e) => {
                            const updated = [...(slide.metrics || [])];
                            updated[idx].label = e.currentTarget.innerText;
                            onUpdateSlide({ ...slide, metrics: updated });
                          }}
                          className={`text-xs font-bold mb-1 line-clamp-2 outline-none ${cardTitleClass} ${editHighlightClass}`}
                          style={getTextFormattingStyle()}
                        >
                          {m.label}
                        </div>
                        <div
                          contentEditable={isEditMode}
                          suppressContentEditableWarning
                          onBlur={(e) => {
                            const updated = [...(slide.metrics || [])];
                            updated[idx].detail = e.currentTarget.innerText;
                            onUpdateSlide({ ...slide, metrics: updated });
                          }}
                          className={`text-[10.5px] leading-relaxed line-clamp-3 outline-none ${cardDescClass} ${editHighlightClass}`}
                          style={getTextFormattingStyle()}
                        >
                          {m.detail}
                        </div>
                      </div>
                      <div className={`mt-3 pt-2 border-t border-black/5 dark:border-white/10 flex items-center justify-between text-[9px] font-bold ${cardMutedClass}`}>
                        <span>BENCHMARK 0{idx + 1}</span>
                        <BarChart3 size={11} style={{ color: accentColor }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : slide.layout === "conclusion" ? (
                /* Conclusion & Executive Next Steps */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 h-full">
                  <div className={`${cardBgClass} p-4 rounded-xl flex flex-col justify-between shadow-xs`}>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider mb-2" style={{ color: accentColor }}>
                        IMMEDIATE ACTION PLAN & NEXT STEPS:
                      </h4>
                      <ul className="space-y-2">
                        {((slide.bulletPoints && slide.bulletPoints.length > 0) ? slide.bulletPoints : [
                          "Finalize executive governance and deployment timeline.",
                          "Authorize core infrastructure setup and telemetry instrumentation.",
                          "Launch Phase 1 pilot program with target metrics review.",
                          "Establish bi-weekly stakeholder optimization briefings."
                        ]).slice(0, 4).map((pt, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs font-medium">
                            <CheckCircle2 size={13} className="shrink-0 mt-0.5" style={{ color: accentColor }} />
                            <span className={cardTitleClass}>{pt}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <p className={`text-[10px] italic mt-3 pt-2 border-t border-black/5 dark:border-white/10 ${cardMutedClass}`}>
                      All deliverables tracked against verified SLA targets.
                    </p>
                  </div>

                  <div className={`${cardBgClass} p-4 rounded-xl flex flex-col justify-between shadow-xs`}>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider mb-2" style={{ color: accentColor }}>
                        PRESENTER PROFILE & INQUIRIES:
                      </h4>
                      <p className={`text-xs leading-relaxed mb-3 ${cardTitleClass}`}>
                        {slide.definition || `Presented by ${config.authorName || "Lead Presenter"} (${config.authorRole || "Subject Matter Expert"}, ${config.authorOrg || "Enterprise Solutions"}). For questions, implementation blueprints, or custom workshops, reach out directly.`}
                      </p>
                      <div className={`p-3 rounded-lg ${cardInnerClass} space-y-1 text-[11px]`}>
                        <div className={`font-bold ${cardTitleClass}`}>{config.authorName || "Executive Presenter"}</div>
                        <div className={cardMutedClass}>{config.authorRole || "Principal Strategist"} • {config.authorOrg || "Worldilm AI"}</div>
                      </div>
                    </div>
                    <div className="mt-2 text-right">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded text-white shadow-xs" style={{ backgroundColor: accentColor }}>
                        Q&A OPEN
                      </span>
                    </div>
                  </div>
                </div>
              ) : slide.layout === "table" && slide.table && slide.table.headers && slide.table.headers.length > 0 ? (
                /* Comparison & Master Table */
                <div className={`overflow-hidden rounded-xl border ${cardBgClass} shadow-xs`}>
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr style={{ backgroundColor: accentColor, color: "#ffffff" }}>
                        {slide.table.headers.map((h, i) => (
                          <th
                            key={i}
                            contentEditable={isEditMode}
                            suppressContentEditableWarning
                            onBlur={(e) => {
                              const updatedHeaders = [...(slide.table?.headers || [])];
                              updatedHeaders[i] = e.currentTarget.innerText;
                              onUpdateSlide({ ...slide, table: { ...slide.table!, headers: updatedHeaders } });
                            }}
                            className={`p-2.5 font-bold uppercase tracking-wider text-[10px] outline-none ${editHighlightClass}`}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className={`divide-y divide-black/5 dark:divide-white/10 ${isBgLight ? "bg-white text-slate-900" : "bg-white/5 text-white"}`}>
                      {slide.table.rows.slice(0, 5).map((row, rIdx) => (
                        <tr key={rIdx} className={rIdx % 2 === 1 ? (isBgLight ? "bg-slate-50" : "bg-white/5") : ""}>
                          {row.map((cell, cIdx) => (
                            <td
                              key={cIdx}
                              contentEditable={isEditMode}
                              suppressContentEditableWarning
                              onBlur={(e) => {
                                const updatedRows = [...(slide.table?.rows || [])];
                                updatedRows[rIdx][cIdx] = e.currentTarget.innerText;
                                onUpdateSlide({ ...slide, table: { ...slide.table!, rows: updatedRows } });
                              }}
                              className={`p-2.5 font-medium text-[11px] truncate max-w-[160px] outline-none ${cardTitleClass} ${editHighlightClass}`}
                              style={getTextFormattingStyle()}
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                /* Universal Fallback: Rich Stacked View ensuring ZERO blank slides */
                <div data-is-canvas="true" className="space-y-3">
                  {(slide.definition || (isEditMode && !slide.bulletPoints?.length)) && (
                    <div
                      contentEditable={isEditMode}
                      suppressContentEditableWarning
                      onBlur={(e) => onUpdateSlide({ ...slide, definition: e.currentTarget.innerText })}
                      className={`p-3.5 ${cardBgClass} border-l-4 rounded-r-xl text-xs font-medium leading-relaxed outline-none shadow-2xs`}
                      style={{
                        borderLeftColor: accentColor,
                        ...getTextFormattingStyle()
                      }}
                    >
                      {slide.definition || `${slide.title} provides strategic operational rigor, unified framework parameters, and verifiable metrics driving maximum organizational yield.`}
                    </div>
                  )}

                  {((slide.bulletPoints && slide.bulletPoints.length > 0) || isEditMode) && (
                    <ul className="space-y-1.5">
                      {((slide.bulletPoints && slide.bulletPoints.length > 0) ? slide.bulletPoints : [
                        "Strategic Parameter: Standardized deployment adhering to verified enterprise architecture.",
                        "Operational Telemetry: Real-time observability tracking end-to-end performance benchmarks.",
                        "Compounding Value: Phased optimization accelerating organizational velocity by over 3x."
                      ]).slice(0, 6).map((pt, i) => (
                        <li key={i} className={`flex items-center justify-between gap-2 text-xs font-medium group ${cardTitleClass}`}>
                          <div className="flex items-start gap-2 flex-1 min-w-0">
                            <RenderBulletSymbol idx={i} style={bulletStyle} accentColor={accentColor} />
                            <span
                              contentEditable={isEditMode}
                              suppressContentEditableWarning
                              onBlur={(e) => {
                                const updatedBullets = [...(slide.bulletPoints || [])];
                                updatedBullets[i] = e.currentTarget.innerText;
                                onUpdateSlide({ ...slide, bulletPoints: updatedBullets });
                              }}
                              className={`line-clamp-2 outline-none flex-1 ${editHighlightClass}`}
                              style={getTextFormattingStyle()}
                            >
                              {pt}
                            </span>
                          </div>
                          {isEditMode && (
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                              <button
                                onClick={() => handleMoveBullet(i, "up")}
                                disabled={i === 0}
                                className="p-0.5 bg-black/10 hover:bg-black/20 rounded disabled:opacity-30 cursor-pointer text-slate-700 dark:text-slate-300"
                                title="Move Up"
                              >
                                <ArrowUp size={11} />
                              </button>
                              <button
                                onClick={() => handleMoveBullet(i, "down")}
                                disabled={i === (slide.bulletPoints?.length || 0) - 1}
                                className="p-0.5 bg-black/10 hover:bg-black/20 rounded disabled:opacity-30 cursor-pointer text-slate-700 dark:text-slate-300"
                                title="Move Down"
                              >
                                <ArrowDown size={11} />
                              </button>
                              <button
                                onClick={() => handleDeleteBullet(i)}
                                className="p-0.5 bg-rose-600/80 hover:bg-rose-600 text-white rounded cursor-pointer"
                                title="Delete Bullet Item"
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}

                  {slide.examples && slide.examples.length > 0 && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs space-y-1 shadow-2xs">
                      <div className="font-extrabold text-amber-600 flex items-center gap-1.5 text-[10.5px] uppercase tracking-wider">
                        <BookOpen size={13} />
                        <span>Real-World Case Study & Practical Examples:</span>
                      </div>
                      {slide.examples.slice(0, 2).map((ex, i) => (
                        <p
                          key={i}
                          contentEditable={isEditMode}
                          suppressContentEditableWarning
                          onBlur={(e) => {
                            const updatedEx = [...(slide.examples || [])];
                            updatedEx[i] = e.currentTarget.innerText;
                            onUpdateSlide({ ...slide, examples: updatedEx });
                          }}
                          className={`leading-relaxed text-[10.5px] pl-4 line-clamp-2 outline-none ${cardTitleClass} ${editHighlightClass}`}
                          style={getTextFormattingStyle()}
                        >
                          • {ex}
                        </p>
                      ))}
                    </div>
                  )}

                  {slide.metrics && slide.metrics.length > 0 && (
                    <div className="grid grid-cols-4 gap-2.5 pt-0.5">
                      {slide.metrics.slice(0, 4).map((m, i) => (
                        <div key={i} className={`${cardBgClass} p-2.5 rounded-xl relative group shadow-2xs`}>
                          {isEditMode && (
                            <button
                              onClick={() => handleDeleteMetric(i)}
                              className="absolute top-1 right-1 p-0.5 bg-rose-600 hover:bg-rose-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 cursor-pointer"
                              title="Delete Stat Card"
                            >
                              <Trash2 size={10} />
                            </button>
                          )}
                          <div
                            contentEditable={isEditMode}
                            suppressContentEditableWarning
                            onBlur={(e) => {
                              const updatedM = [...(slide.metrics || [])];
                              updatedM[i].value = e.currentTarget.innerText;
                              onUpdateSlide({ ...slide, metrics: updatedM });
                            }}
                            className={`text-base font-black outline-none ${editHighlightClass}`}
                            style={{
                              color: accentColor,
                              ...getTextFormattingStyle()
                            }}
                          >
                            {m.value}
                          </div>
                          <div
                            contentEditable={isEditMode}
                            suppressContentEditableWarning
                            onBlur={(e) => {
                              const updatedM = [...(slide.metrics || [])];
                              updatedM[i].label = e.currentTarget.innerText;
                              onUpdateSlide({ ...slide, metrics: updatedM });
                            }}
                            className={`text-xs font-bold truncate outline-none ${cardTitleClass} ${editHighlightClass}`}
                            style={getTextFormattingStyle()}
                          >
                            {m.label}
                          </div>
                          <div
                            contentEditable={isEditMode}
                            suppressContentEditableWarning
                            onBlur={(e) => {
                              const updatedM = [...(slide.metrics || [])];
                              updatedM[i].detail = e.currentTarget.innerText;
                              onUpdateSlide({ ...slide, metrics: updatedM });
                            }}
                            className={`text-[10px] truncate outline-none ${cardDescClass} ${editHighlightClass}`}
                            style={getTextFormattingStyle()}
                          >
                            {m.detail}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Strategic Takeaway Editable Directly On Page */}
            {(slide.summaryTakeaway || isEditMode) && (
              <div className={`shrink-0 mt-2 p-2.5 ${cardBgClass} rounded-xl flex items-center gap-2 text-xs shadow-2xs`}>
                <span className="font-black text-[10px] uppercase tracking-wider shrink-0" style={{ color: accentColor }}>
                  TAKEAWAY:
                </span>
                <p
                  contentEditable={isEditMode}
                  suppressContentEditableWarning
                  onBlur={(e) => onUpdateSlide({ ...slide, summaryTakeaway: e.currentTarget.innerText })}
                  className={`text-[11px] font-medium truncate flex-1 outline-none ${cardTitleClass} ${editHighlightClass}`}
                  style={getTextFormattingStyle()}
                >
                  {slide.summaryTakeaway || (isEditMode ? "Click to add strategic takeaway..." : "")}
                </p>
              </div>
            )}
          </div>

          {/* Footer Bar */}
          <div data-is-canvas="true" className={`px-8 py-3 ${footerBgClass} flex items-center justify-between text-[11px] font-bold tracking-wider shrink-0 select-none`}>
            <span>{(config.topicName || (isSlideMode ? "PRESENTATION" : "DOCUMENT")).toUpperCase()} | {isSlideMode ? "EXECUTIVE SLIDE DECK" : "A4 EXECUTIVE REPORT"}</span>
            <span>{isSlideMode ? "SLIDE" : "PAGE"} {slideIdx + 1} OF {totalSlides}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const InteractiveSlideViewer: React.FC<InteractiveSlideViewerProps> = ({
  slides: initialSlides,
  config,
  onBack,
  onBackToChat,
  mode = "slide"
}) => {
  const accentColor = config.accentColor || "#4f46e5";
  const isSlideMode = mode === "slide";
  const [slidesState, setSlidesState] = useState<StructuredSlide[]>(initialSlides);
  const [activeSlideIdx, setActiveSlideIdx] = useState<number>(0);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingPptx, setIsExportingPptx] = useState(false);
  const [showThumbnails, setShowThumbnails] = useState(true);

  // Live Inline Editing Mode Toggle
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedFreeformId, setSelectedFreeformId] = useState<string | null>(null);

  // Undo / Redo History Stack
  const [history, setHistory] = useState<StructuredSlide[][]>([initialSlides]);
  const [historyIdx, setHistoryIdx] = useState(0);

  // Active Toolbar Tab ("format" | "insert" | "theme" | "deck" | "watermark")
  const [activeToolbarTab, setActiveToolbarTab] = useState<"format" | "insert" | "theme" | "deck" | "watermark">("format");

  // Formatting Options for Active Text
  const [bulletStyle, setBulletStyle] = useState<BulletStyle>("dot");
  const [activeFontSize, setActiveFontSize] = useState<number>(16);
  const [activeTextColor, setActiveTextColor] = useState<string>("#ffffff");
  const [activeBgHighlight, setActiveBgHighlight] = useState<string>("transparent");
  const [activeAlign, setActiveAlign] = useState<"left" | "center" | "right">("left");
  const [isBoldText, setIsBoldText] = useState(false);
  const [isItalicText, setIsItalicText] = useState(false);
  const [isUnderlineText, setIsUnderlineText] = useState(false);
  const [isStrikethroughText, setIsStrikethroughText] = useState(false);
  const [activeFontFamily, setActiveFontFamily] = useState<string>(config.font || "'Space Grotesk', sans-serif");

  // Watermark Advanced Settings
  const [watermarkEnabled, setWatermarkEnabled] = useState(false);
  const [watermarkType, setWatermarkType] = useState<"text" | "image">("text");
  const [watermarkText, setWatermarkText] = useState("CONFIDENTIAL");
  const [watermarkImageUrl, setWatermarkImageUrl] = useState(
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="280" height="130" viewBox="0 0 280 130"><rect x="10" y="10" width="260" height="110" rx="16" fill="none" stroke="%23f43f5e" stroke-width="8"/><text x="140" y="78" font-family="sans-serif" font-weight="900" font-size="28" fill="%23f43f5e" text-anchor="middle" letter-spacing="3">CONFIDENTIAL</text></svg>'
  );
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.22);
  const [watermarkRotation, setWatermarkRotation] = useState(-30);
  const [watermarkSize, setWatermarkSize] = useState(1);
  const [watermarkColor, setWatermarkColor] = useState("#ffffff");

  useEffect(() => {
    setSlidesState(initialSlides);
    setHistory([initialSlides]);
    setHistoryIdx(0);
  }, [initialSlides]);

  const activeSlide = slidesState[activeSlideIdx] || slidesState[0];

  // Helper to commit changes and push history
  const updateSlidesAndHistory = (newSlides: StructuredSlide[]) => {
    setSlidesState(newSlides);
    const updatedHistory = history.slice(0, historyIdx + 1);
    updatedHistory.push(newSlides);
    setHistory(updatedHistory);
    setHistoryIdx(updatedHistory.length - 1);
  };

  const updateActiveSlide = (updater: (slide: StructuredSlide) => StructuredSlide) => {
    const next = [...slidesState];
    if (next[activeSlideIdx]) {
      next[activeSlideIdx] = updater(next[activeSlideIdx]);
      updateSlidesAndHistory(next);
    }
  };

  // Undo & Redo Handlers
  const handleUndo = () => {
    if (historyIdx > 0) {
      setHistoryIdx(historyIdx - 1);
      setSlidesState(history[historyIdx - 1]);
    }
  };

  const handleRedo = () => {
    if (historyIdx < history.length - 1) {
      setHistoryIdx(historyIdx + 1);
      setSlidesState(history[historyIdx + 1]);
    }
  };

  // Slide Deck Operations
  const handleAddSlide = (layout: StructuredSlide["layout"] = "definition") => {
    const newSlide: StructuredSlide = {
      id: Date.now(),
      slideNumber: slidesState.length + 1,
      layout,
      title: "New Custom Slide Title",
      subtitle: "Click to edit overview subtitle",
      badge: "NEW SECTION",
      bulletPoints: ["Key execution point 1", "Key execution point 2"],
      summaryTakeaway: "Strategic recommendation and key outcome"
    };
    const next = [...slidesState, newSlide];
    updateSlidesAndHistory(next);
    setActiveSlideIdx(slidesState.length);
  };

  const handleDuplicateSlide = () => {
    if (!activeSlide) return;
    const dup: StructuredSlide = {
      ...JSON.parse(JSON.stringify(activeSlide)),
      id: Date.now(),
      slideNumber: slidesState.length + 1,
      title: `${activeSlide.title} (Copy)`
    };
    const next = [...slidesState];
    next.splice(activeSlideIdx + 1, 0, dup);
    updateSlidesAndHistory(next);
    setActiveSlideIdx(activeSlideIdx + 1);
  };

  const handleDeleteActiveSlide = () => {
    if (slidesState.length <= 1) return;
    const next = slidesState.filter((_, idx) => idx !== activeSlideIdx);
    updateSlidesAndHistory(next);
    setActiveSlideIdx((prev) => Math.max(0, prev - 1));
  };

  const handleMoveSlide = (direction: "up" | "down") => {
    const targetIdx = direction === "up" ? activeSlideIdx - 1 : activeSlideIdx + 1;
    if (targetIdx < 0 || targetIdx >= slidesState.length) return;
    const next = [...slidesState];
    const temp = next[activeSlideIdx];
    next[activeSlideIdx] = next[targetIdx];
    next[targetIdx] = temp;
    updateSlidesAndHistory(next);
    setActiveSlideIdx(targetIdx);
  };

  // Insertion Helpers
  const handleAddFreeText = () => {
    const newElement: FreeformElement = {
      id: `free-${Date.now()}`,
      type: "text",
      text: "Write freeform text anywhere on page...",
      x: 35,
      y: 40,
      fontSize: activeFontSize || 16,
      color: activeTextColor || "#ffffff",
      bgColor: activeBgHighlight !== "transparent" ? activeBgHighlight : "transparent",
      align: activeAlign,
      bold: isBoldText,
      italic: isItalicText,
      underline: isUnderlineText,
      strikethrough: isStrikethroughText,
      fontFamily: activeFontFamily
    };
    updateActiveSlide((s) => ({
      ...s,
      customElements: [...(s.customElements || []), newElement]
    }));
    setSelectedFreeformId(newElement.id);
  };

  const handleAddStickyNote = (colorObj = STICKY_COLORS[0]) => {
    const newElement: FreeformElement = {
      id: `note-${Date.now()}`,
      type: "note",
      text: "📌 Key Sticky Note: Type your observations or action items here...",
      x: 30,
      y: 30,
      bgColor: colorObj.bg,
      color: colorObj.text,
      borderColor: colorObj.border
    };
    updateActiveSlide((s) => ({
      ...s,
      customElements: [...(s.customElements || []), newElement]
    }));
    setSelectedFreeformId(newElement.id);
  };

  const handleAddQuoteBox = () => {
    const newElement: FreeformElement = {
      id: `quote-${Date.now()}`,
      type: "quote",
      text: '"Execution is everything. Strategy without rapid implementation is just noise." - Executive Benchmark',
      x: 25,
      y: 35,
      color: "#ffffff"
    };
    updateActiveSlide((s) => ({
      ...s,
      customElements: [...(s.customElements || []), newElement]
    }));
    setSelectedFreeformId(newElement.id);
  };

  const handleAddBadgeCallout = () => {
    const newElement: FreeformElement = {
      id: `badge-${Date.now()}`,
      type: "badge",
      text: "★ HIGH PRIORITY MILESTONE",
      x: 10,
      y: 15,
      fontSize: 12,
      color: "#ffffff",
      bgColor: accentColor,
      bold: true
    };
    updateActiveSlide((s) => ({
      ...s,
      customElements: [...(s.customElements || []), newElement]
    }));
    setSelectedFreeformId(newElement.id);
  };

  const handleAddSticker = (emoji: string) => {
    const newElement: FreeformElement = {
      id: `sticker-${Date.now()}`,
      type: "sticker",
      text: emoji,
      x: 80,
      y: 20
    };
    updateActiveSlide((s) => ({
      ...s,
      customElements: [...(s.customElements || []), newElement]
    }));
    setSelectedFreeformId(newElement.id);
  };

  const handleAddImageElement = (customUrl?: string) => {
    const url = customUrl || prompt("Enter image URL or link:", "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600");
    if (!url) return;
    const newElement: FreeformElement = {
      id: `img-${Date.now()}`,
      type: "image",
      text: "Image Element",
      imageUrl: url,
      x: 35,
      y: 25
    };
    updateActiveSlide((s) => ({
      ...s,
      customElements: [...(s.customElements || []), newElement]
    }));
    setSelectedFreeformId(newElement.id);
  };

  const handleAddDivider = () => {
    const newElement: FreeformElement = {
      id: `divider-${Date.now()}`,
      type: "divider",
      text: "",
      x: 20,
      y: 50,
      color: accentColor
    };
    updateActiveSlide((s) => ({
      ...s,
      customElements: [...(s.customElements || []), newElement]
    }));
    setSelectedFreeformId(newElement.id);
  };

  const handleAddBulletPoint = () => {
    updateActiveSlide((s) => ({
      ...s,
      bulletPoints: [...(s.bulletPoints || []), "New strategic execution point (click to edit)"]
    }));
  };

  const handleAddMetric = () => {
    const newMetric: SlideMetric = {
      value: "+95%",
      label: "Performance Benchmark",
      detail: "Verified target metrics"
    };
    updateActiveSlide((s) => ({
      ...s,
      metrics: [...(s.metrics || []), newMetric]
    }));
  };

  const handleAddTable = () => {
    const newTable: SlideTable = {
      headers: ["Metric", "Current", "Target", "Status"],
      rows: [
        ["Performance", "82%", "99%", "Optimal"],
        ["Latency", "90ms", "<20ms", "High"]
      ]
    };
    updateActiveSlide((s) => ({ ...s, layout: "table", table: newTable }));
  };

  const handleAddTableRow = () => {
    if (!activeSlide.table) {
      handleAddTable();
      return;
    }
    const cols = activeSlide.table.headers.length || 3;
    const newRow = Array(cols).fill("New Data");
    updateActiveSlide((s) => ({
      ...s,
      table: {
        ...s.table!,
        rows: [...s.table!.rows, newRow]
      }
    }));
  };

  const handleDeleteTableRow = () => {
    if (!activeSlide.table || activeSlide.table.rows.length <= 1) return;
    const rows = activeSlide.table.rows.slice(0, -1);
    updateActiveSlide((s) => ({
      ...s,
      table: { ...s.table!, rows }
    }));
  };

  const handleAddTableCol = () => {
    if (!activeSlide.table) {
      handleAddTable();
      return;
    }
    const headers = [...activeSlide.table.headers, "New Col"];
    const rows = activeSlide.table.rows.map((r) => [...r, "Data"]);
    updateActiveSlide((s) => ({
      ...s,
      table: { headers, rows }
    }));
  };

  const handleDeleteTableCol = () => {
    if (!activeSlide.table || activeSlide.table.headers.length <= 1) return;
    const headers = activeSlide.table.headers.slice(0, -1);
    const rows = activeSlide.table.rows.map((r) => r.slice(0, -1));
    updateActiveSlide((s) => ({
      ...s,
      table: { headers, rows }
    }));
  };

  // Export handlers
  const handleDownloadPdf = async () => {
    if (isExportingPdf || isExportingPptx) return;
    setIsExportingPdf(true);
    try {
      await exportSlidesToPdf(slidesState, config, true, (mode as "slide" | "document") || "slide");
    } catch (e) {
      console.error("PDF export error:", e);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleDownloadPptx = async () => {
    if (isExportingPdf || isExportingPptx) return;
    setIsExportingPptx(true);
    try {
      await exportSlidesToPptx(slidesState, config);
    } catch (e) {
      console.error("PPTX export error:", e);
    } finally {
      setIsExportingPptx(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans overflow-hidden relative select-none">
      {/* Top Header Bar */}
      <header className="bg-white dark:bg-zinc-900 px-3 sm:px-5 py-2.5 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2 shrink-0 shadow-xs z-20">
        <div className="flex items-center gap-2.5">
          <button
            onClick={onBack}
            className="p-1 px-2.5 sm:px-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-all cursor-pointer flex items-center gap-1 text-xs font-bold border border-zinc-200 dark:border-zinc-700"
            title="Back to Details"
          >
            <ChevronLeft size={15} />
            <span>Details</span>
          </button>
          
          <button
            onClick={() => setShowThumbnails(!showThumbnails)}
            className={`p-1.5 rounded-xl border transition-all cursor-pointer hidden md:flex items-center gap-1 text-xs font-bold ${
              showThumbnails
                ? "bg-amber-500/10 border-amber-500/50 text-amber-500"
                : "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400"
            }`}
            title="Toggle Sidebar Page List"
          >
            <Layout size={14} />
            <span>Pages ({slidesState.length})</span>
          </button>

          <div>
            <div className="flex items-center gap-1.5">
              <span
                className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded flex items-center gap-1 text-white shadow-xs"
                style={{ backgroundColor: accentColor }}
              >
                <Sparkles size={10} />
                {config.category}
              </span>
              <h1 className="text-xs sm:text-sm font-extrabold text-zinc-900 dark:text-white truncate max-w-[140px] sm:max-w-xs">
                {config.topicName}
              </h1>
            </div>
          </div>
        </div>

        {/* Top Undo/Redo & Export Controls & Main Edit Mode Toggle */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Undo / Redo */}
          {isEditMode && (
            <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl border border-zinc-200 dark:border-zinc-700">
              <button
                onClick={handleUndo}
                disabled={historyIdx <= 0}
                className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-30 rounded-lg cursor-pointer text-zinc-700 dark:text-zinc-300"
                title="Undo Change"
              >
                <Undo2 size={14} />
              </button>
              <button
                onClick={handleRedo}
                disabled={historyIdx >= history.length - 1}
                className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-30 rounded-lg cursor-pointer text-zinc-700 dark:text-zinc-300"
                title="Redo Change"
              >
                <Redo2 size={14} />
              </button>
            </div>
          )}

          {/* PPTX Export */}
          <button
            onClick={handleDownloadPptx}
            disabled={isExportingPptx || isExportingPdf}
            className={`px-2.5 py-1.5 sm:px-3 bg-amber-600 hover:bg-amber-500 disabled:opacity-80 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95 ${
              isExportingPptx ? "animate-pulse ring-2 ring-amber-400" : ""
            }`}
            title="Download PowerPoint Presentation (.pptx)"
          >
            {isExportingPptx ? (
              <Loader2 size={14} className="animate-spin text-white shrink-0" />
            ) : (
              <FileSpreadsheet size={14} className="shrink-0" />
            )}
            <span className="whitespace-nowrap font-bold text-[11px] sm:text-xs">
              {isExportingPptx ? "Wait..." : "PPTX"}
            </span>
          </button>

          {/* PDF Export */}
          <button
            onClick={handleDownloadPdf}
            disabled={isExportingPdf || isExportingPptx}
            className={`px-2.5 py-1.5 sm:px-3 bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 disabled:opacity-80 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95 ${
              isExportingPdf ? "animate-pulse ring-2 ring-indigo-400" : ""
            }`}
            title="Download PDF Document File"
          >
            {isExportingPdf ? (
              <Loader2 size={14} className="animate-spin text-white shrink-0" />
            ) : (
              <Download size={14} className="shrink-0" />
            )}
            <span className="whitespace-nowrap font-bold text-[11px] sm:text-xs">
              {isExportingPdf ? "Wait..." : "PDF"}
            </span>
          </button>

          {/* Main Direct On-Page Edit Toggle */}
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={`px-3 py-1.5 sm:px-4 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-md border transition-all cursor-pointer active:scale-95 ${
              isEditMode
                ? "bg-amber-500 hover:bg-amber-400 text-zinc-950 border-amber-300 ring-2 ring-amber-400"
                : "bg-emerald-600 hover:bg-emerald-500 border-emerald-400/30"
            }`}
            title="Toggle Direct On-Page Google Docs / Canva Style Editor"
          >
            {isEditMode ? <Check size={14} className="shrink-0" /> : <Edit3 size={14} className="shrink-0" />}
            <span className="font-bold text-[11px] sm:text-xs">
              {isEditMode ? "Done Editing" : "Edit On Page"}
            </span>
          </button>
        </div>
      </header>

      {/* Workspace Area: Left Thumbnail Sidebar + Main Canvas Viewer */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Slide Filmstrip Sidebar (Hidden on mobile) */}
        {showThumbnails && (
          <aside className="w-48 sm:w-56 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 hidden md:flex flex-col shrink-0 overflow-y-auto p-2 sm:p-3 space-y-2 z-10">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800">
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Document Pages ({slidesState.length})
              </span>
              {isEditMode && (
                <button
                  onClick={() => handleAddSlide("definition")}
                  className="p-1 bg-amber-500 text-zinc-950 rounded-lg hover:bg-amber-400 font-bold cursor-pointer"
                  title="Add Page"
                >
                  <Plus size={12} />
                </button>
              )}
            </div>

            {slidesState.map((slide, idx) => (
              <div
                key={slide.id || idx}
                onClick={() => setActiveSlideIdx(idx)}
                className={`p-2 rounded-xl border text-left cursor-pointer transition-all relative group ${
                  activeSlideIdx === idx
                    ? "border-amber-400 bg-amber-500/10 ring-2 ring-amber-400/30 shadow-xs"
                    : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 bg-zinc-50 dark:bg-zinc-800/50"
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-bold text-zinc-500 dark:text-zinc-400 mb-1">
                  <span>PAGE {idx + 1}</span>
                  <span className="uppercase text-[9px] px-1 bg-zinc-200 dark:bg-zinc-700 rounded">
                    {slide.layout}
                  </span>
                </div>
                <div className="text-xs font-bold truncate text-zinc-900 dark:text-zinc-100">
                  {slide.title || "Untitled Page"}
                </div>
                {slide.subtitle && (
                  <div className="text-[10px] opacity-70 truncate">{slide.subtitle}</div>
                )}
              </div>
            ))}
          </aside>
        )}

        {/* Center Main Slide Area */}
        <main className="flex-1 overflow-y-auto bg-slate-100 dark:bg-zinc-950 p-2 sm:p-6 md:p-8 flex flex-col items-center justify-start gap-6 pb-44 relative">

          {slidesState.map((slide, slideIdx) => (
            <SlideCard
              key={slide.id || slideIdx}
              slide={slide}
              slideIdx={slideIdx}
              totalSlides={slidesState.length}
              config={config}
              bulletStyle={bulletStyle}
              watermarkEnabled={watermarkEnabled}
              watermarkType={watermarkType}
              watermarkText={watermarkText}
              watermarkImageUrl={watermarkImageUrl}
              watermarkOpacity={watermarkOpacity}
              watermarkRotation={watermarkRotation}
              watermarkSize={watermarkSize}
              watermarkColor={watermarkColor}
              activeFontSize={activeFontSize}
              activeTextColor={activeTextColor}
              activeBgHighlight={activeBgHighlight}
              activeAlign={activeAlign}
              isBoldText={isBoldText}
              isItalicText={isItalicText}
              isUnderlineText={isUnderlineText}
              isStrikethroughText={isStrikethroughText}
              activeFontFamily={activeFontFamily}
              isEditMode={isEditMode}
              isActiveSlide={activeSlideIdx === slideIdx}
              selectedFreeformId={selectedFreeformId}
              mode={mode}
              onSelectFreeform={setSelectedFreeformId}
              onSelectSlide={() => setActiveSlideIdx(slideIdx)}
              onUpdateSlide={(updated) => {
                const next = [...slidesState];
                next[slideIdx] = updated;
                updateSlidesAndHistory(next);
              }}
            />
          ))}
        </main>
      </div>

      {/* Docked Ultra-Concise Mobile-Friendly Glass Toolbar (MS Word / Google Docs / Canva Mobile Style) */}
      {isEditMode && (
        <div className="fixed bottom-2 left-1/2 -translate-x-1/2 z-50 w-[96%] max-w-4xl bg-white/90 dark:bg-zinc-900/90 text-zinc-900 dark:text-zinc-100 backdrop-blur-xl border border-white/80 dark:border-zinc-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-all">
          {/* Toolbar Tabs Header - Ultra Compact */}
          <div className="flex items-center justify-between border-b border-zinc-200/60 dark:border-zinc-800/60 px-2 py-1 bg-white/50 dark:bg-black/30 text-xs overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1 shrink-0">
              {[
                { id: "format", label: "✍️ Format", icon: Type },
                { id: "insert", label: "➕ Insert", icon: Plus },
                { id: "theme", label: "🎨 Layout", icon: Palette },
                { id: "deck", label: "📋 Slides", icon: Layers },
                { id: "watermark", label: "🛡️ Watermark", icon: Stamp }
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeToolbarTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveToolbarTab(tab.id as any)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap ${
                      isActive
                        ? "bg-amber-500 text-zinc-950 font-black shadow-xs"
                        : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                    }`}
                  >
                    <Icon size={12} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 shrink-0 pl-1">
              <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-extrabold hidden sm:inline">
                {activeSlideIdx + 1}/{slidesState.length}
              </span>
              <button
                onClick={() => setIsEditMode(false)}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-lg text-xs flex items-center gap-1 cursor-pointer shadow-xs active:scale-95"
              >
                <Check size={12} />
                <span>Done</span>
              </button>
            </div>
          </div>

          {/* Active Tab Panel Controls - Single Row Horizontally Scrollable Bar */}
          <div className="p-2 px-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar text-xs">
            {activeToolbarTab === "format" && (
              <>
                {/* Font Selector */}
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[10px] font-bold text-zinc-400">Font:</span>
                  <select
                    value={activeFontFamily}
                    onChange={(e) => setActiveFontFamily(e.target.value)}
                    className="bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs font-semibold rounded-lg px-2 py-0.5 border border-zinc-300 dark:border-zinc-700 outline-none cursor-pointer"
                  >
                    {FONT_FAMILIES.map((f) => (
                      <option key={f.id} value={f.id} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white">
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-700 shrink-0" />

                {/* Font Size Adjuster */}
                <div className="flex items-center gap-0.5 shrink-0 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5 border border-zinc-300/80 dark:border-zinc-700">
                  <button
                    onClick={() => setActiveFontSize((s) => Math.max(10, s - 2))}
                    className="px-1.5 py-0.5 text-xs font-extrabold hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded cursor-pointer"
                    title="Decrease Size"
                  >
                    A-
                  </button>
                  <span className="text-[10px] font-mono font-bold px-1">{activeFontSize}px</span>
                  <button
                    onClick={() => setActiveFontSize((s) => Math.min(64, s + 2))}
                    className="px-1.5 py-0.5 text-xs font-extrabold hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded cursor-pointer"
                    title="Increase Size"
                  >
                    A+
                  </button>
                </div>

                <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-700 shrink-0" />

                {/* Bold / Italic / Underline / Strikethrough */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setIsBoldText(!isBoldText)}
                    className={`p-1 rounded-lg text-xs transition-all cursor-pointer ${
                      isBoldText ? "bg-amber-500 text-zinc-950 font-black" : "bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-800 dark:text-zinc-200"
                    }`}
                    title="Bold"
                  >
                    <Bold size={13} />
                  </button>
                  <button
                    onClick={() => setIsItalicText(!isItalicText)}
                    className={`p-1 rounded-lg text-xs transition-all cursor-pointer ${
                      isItalicText ? "bg-amber-500 text-zinc-950 font-black" : "bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-800 dark:text-zinc-200"
                    }`}
                    title="Italic"
                  >
                    <Italic size={13} />
                  </button>
                  <button
                    onClick={() => setIsUnderlineText(!isUnderlineText)}
                    className={`p-1 rounded-lg text-xs transition-all cursor-pointer ${
                      isUnderlineText ? "bg-amber-500 text-zinc-950 font-black" : "bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-800 dark:text-zinc-200"
                    }`}
                    title="Underline"
                  >
                    <Underline size={13} />
                  </button>
                  <button
                    onClick={() => setIsStrikethroughText(!isStrikethroughText)}
                    className={`p-1 rounded-lg text-xs transition-all cursor-pointer ${
                      isStrikethroughText ? "bg-amber-500 text-zinc-950 font-black" : "bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-800 dark:text-zinc-200"
                    }`}
                    title="Strikethrough"
                  >
                    <Strikethrough size={13} />
                  </button>
                </div>

                <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-700 shrink-0" />

                {/* Text Alignment */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setActiveAlign("left")}
                    className={`p-1 rounded-lg transition-all cursor-pointer ${
                      activeAlign === "left" ? "bg-amber-500 text-zinc-950 font-black" : "bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-800 dark:text-zinc-200"
                    }`}
                    title="Align Left"
                  >
                    <AlignLeft size={13} />
                  </button>
                  <button
                    onClick={() => setActiveAlign("center")}
                    className={`p-1 rounded-lg transition-all cursor-pointer ${
                      activeAlign === "center" ? "bg-amber-500 text-zinc-950 font-black" : "bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-800 dark:text-zinc-200"
                    }`}
                    title="Align Center"
                  >
                    <AlignCenter size={13} />
                  </button>
                  <button
                    onClick={() => setActiveAlign("right")}
                    className={`p-1 rounded-lg transition-all cursor-pointer ${
                      activeAlign === "right" ? "bg-amber-500 text-zinc-950 font-black" : "bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-800 dark:text-zinc-200"
                    }`}
                    title="Align Right"
                  >
                    <AlignRight size={13} />
                  </button>
                </div>

                <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-700 shrink-0" />

                {/* Text Color Swatches */}
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[10px] font-bold text-zinc-400">Color:</span>
                  {["#ffffff", "#fbbf24", "#34d399", "#38bdf8", "#f43f5e", "#a855f7", "#000000"].map((c) => (
                    <button
                      key={c}
                      onClick={() => setActiveTextColor(c)}
                      style={{ backgroundColor: c }}
                      className={`w-3.5 h-3.5 rounded-full border border-zinc-400 cursor-pointer hover:scale-125 transition-transform ${
                        activeTextColor === c ? "ring-2 ring-amber-500 scale-125" : ""
                      }`}
                    />
                  ))}
                </div>

                <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-700 shrink-0" />

                {/* Bullet Style Picker */}
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[10px] font-bold text-zinc-400">Bullets:</span>
                  {[
                    { id: "dot", label: "• Dot" },
                    { id: "check", label: "✓ Check" },
                    { id: "number", label: "1. Num" },
                    { id: "star", label: "★ Star" }
                  ].map((b) => (
                    <button
                      key={b.id}
                      onClick={() => setBulletStyle(b.id as BulletStyle)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                        bulletStyle === b.id ? "bg-amber-500 text-zinc-950" : "bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-800 dark:text-zinc-200"
                      }`}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </>
            )}

            {activeToolbarTab === "insert" && (
              <>
                {/* Write Freeform Text Anywhere */}
                <button
                  onClick={handleAddFreeText}
                  className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-lg text-xs font-black flex items-center gap-1 cursor-pointer shadow-xs whitespace-nowrap"
                >
                  <Type size={13} />
                  <span>+ Free Text</span>
                </button>

                {/* Insert Image */}
                <label className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-extrabold flex items-center gap-1 cursor-pointer whitespace-nowrap shadow-xs">
                  <ImageIcon size={13} />
                  <span>+ Insert Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (evt) => {
                          const dataUrl = evt.target?.result as string;
                          if (dataUrl) handleAddImageElement(dataUrl);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>

                {/* Sticky Note */}
                <button
                  onClick={() => handleAddStickyNote()}
                  className="px-2 py-1 bg-yellow-400 hover:bg-yellow-300 text-zinc-950 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap"
                >
                  <StickyNote size={13} />
                  <span>+ Note</span>
                </button>

                {/* Quote Box */}
                <button
                  onClick={handleAddQuoteBox}
                  className="px-2 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap"
                >
                  <Quote size={13} />
                  <span>+ Quote</span>
                </button>

                {/* Badge Tag */}
                <button
                  onClick={handleAddBadgeCallout}
                  className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap"
                >
                  <Tag size={13} />
                  <span>+ Badge</span>
                </button>

                {/* Stat Metric */}
                <button
                  onClick={handleAddMetric}
                  className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap"
                >
                  <BarChart2 size={13} />
                  <span>+ Stat</span>
                </button>

                <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-700 shrink-0" />

                {/* Table Row & Col Controls */}
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[10px] font-bold text-zinc-400">Table:</span>
                  <button
                    onClick={handleAddTableRow}
                    className="px-2 py-0.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-0.5 cursor-pointer"
                  >
                    <PlusCircle size={11} />
                    <span>Row</span>
                  </button>
                  <button
                    onClick={handleDeleteTableRow}
                    className="px-1.5 py-0.5 bg-rose-600/20 hover:bg-rose-600/40 text-rose-500 rounded-lg text-[10px] font-bold cursor-pointer"
                  >
                    <MinusCircle size={11} />
                  </button>
                  <button
                    onClick={handleAddTableCol}
                    className="px-2 py-0.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-0.5 cursor-pointer"
                  >
                    <PlusCircle size={11} />
                    <span>Col</span>
                  </button>
                  <button
                    onClick={handleDeleteTableCol}
                    className="px-1.5 py-0.5 bg-rose-600/20 hover:bg-rose-600/40 text-rose-500 rounded-lg text-[10px] font-bold cursor-pointer"
                  >
                    <MinusCircle size={11} />
                  </button>
                </div>

                <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-700 shrink-0" />

                {/* Stickers */}
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[10px] font-bold text-zinc-400">Sticker:</span>
                  {EMOJI_STICKERS.slice(0, 5).map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleAddSticker(emoji)}
                      className="text-sm p-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded cursor-pointer transition-transform hover:scale-125"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </>
            )}

            {activeToolbarTab === "theme" && (
              <>
                {/* Canvas Background Presets */}
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[10px] font-bold text-zinc-400">Canvas:</span>
                  {CANVAS_THEMES.map((theme) => (
                    <button
                      key={theme.name}
                      onClick={() => updateActiveSlide((s) => ({ ...s, bgColor: theme.bg }))}
                      style={{ backgroundColor: theme.bg }}
                      className="w-4 h-4 rounded-full border border-zinc-400 cursor-pointer hover:scale-125 transition-transform"
                      title={theme.name}
                    />
                  ))}
                </div>

                <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-700 shrink-0" />

                {/* Slide Layout Switcher */}
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[10px] font-bold text-zinc-400">Layout:</span>
                  {[
                    { id: "title", label: "Title" },
                    { id: "agenda", label: "Agenda" },
                    { id: "definition", label: "Definition" },
                    { id: "table", label: "Table" },
                    { id: "metrics", label: "Metrics" }
                  ].map((l) => (
                    <button
                      key={l.id}
                      onClick={() => updateActiveSlide((s) => ({ ...s, layout: l.id as any }))}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
                        activeSlide?.layout === l.id ? "bg-amber-500 text-zinc-950 font-black" : "bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-800 dark:text-zinc-200"
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </>
            )}

            {activeToolbarTab === "deck" && (
              <>
                <button
                  onClick={() => handleAddSlide("definition")}
                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer whitespace-nowrap"
                >
                  <Plus size={13} />
                  <span>+ New Slide</span>
                </button>

                <button
                  onClick={handleDuplicateSlide}
                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer whitespace-nowrap"
                >
                  <Copy size={13} />
                  <span>Duplicate</span>
                </button>

                <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-700 shrink-0" />

                <button
                  onClick={() => handleMoveSlide("up")}
                  disabled={activeSlideIdx === 0}
                  className="p-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-30 rounded-lg cursor-pointer text-zinc-800 dark:text-zinc-200"
                  title="Move Up"
                >
                  <ArrowUp size={13} />
                </button>

                <button
                  onClick={() => handleMoveSlide("down")}
                  disabled={activeSlideIdx === slidesState.length - 1}
                  className="p-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-30 rounded-lg cursor-pointer text-zinc-800 dark:text-zinc-200"
                  title="Move Down"
                >
                  <ArrowDown size={13} />
                </button>

                <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-700 shrink-0" />

                <button
                  onClick={handleDeleteActiveSlide}
                  disabled={slidesState.length <= 1}
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 disabled:opacity-30 text-white font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer whitespace-nowrap"
                >
                  <Trash2 size={13} />
                  <span>Delete</span>
                </button>
              </>
            )}

            {activeToolbarTab === "watermark" && (
              <>
                {/* Watermark Toggle */}
                <button
                  onClick={() => setWatermarkEnabled(!watermarkEnabled)}
                  className={`px-2.5 py-1 text-xs font-black rounded-lg flex items-center gap-1 cursor-pointer transition-all ${
                    watermarkEnabled ? "bg-amber-500 text-zinc-950 shadow-xs" : "bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-800 dark:text-zinc-200"
                  }`}
                >
                  <Stamp size={13} />
                  <span>{watermarkEnabled ? "ON" : "OFF"}</span>
                </button>

                {watermarkEnabled && (
                  <>
                    <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-700 shrink-0" />

                    {/* Mode: Text vs Image */}
                    <div className="flex items-center gap-1 shrink-0 bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-lg border border-zinc-300 dark:border-zinc-700">
                      <button
                        onClick={() => setWatermarkType("text")}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                          watermarkType === "text" ? "bg-amber-500 text-zinc-950 font-black" : "text-zinc-600 dark:text-zinc-300"
                        }`}
                      >
                        Text
                      </button>
                      <button
                        onClick={() => setWatermarkType("image")}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                          watermarkType === "image" ? "bg-amber-500 text-zinc-950 font-black" : "text-zinc-600 dark:text-zinc-300"
                        }`}
                      >
                        Image / Stamp
                      </button>
                    </div>

                    <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-700 shrink-0" />

                    {watermarkType === "text" ? (
                      <>
                        {/* Text Input */}
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-[10px] font-bold text-zinc-400">Text:</span>
                          <input
                            type="text"
                            value={watermarkText}
                            onChange={(e) => setWatermarkText(e.target.value)}
                            placeholder="Watermark Text"
                            className="bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs font-bold rounded-lg px-2 py-0.5 outline-none border border-zinc-300 dark:border-zinc-700 w-28 sm:w-36"
                          />
                        </div>

                        {/* Color Picker */}
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-[10px] font-bold text-zinc-400">Color:</span>
                          {["#ffffff", "#f43f5e", "#10b981", "#3b82f6", "#f59e0b", "#a855f7"].map((c) => (
                            <button
                              key={c}
                              onClick={() => setWatermarkColor(c)}
                              style={{ backgroundColor: c }}
                              className={`w-3.5 h-3.5 rounded-full border border-zinc-400 cursor-pointer ${
                                watermarkColor === c ? "ring-2 ring-amber-500 scale-125" : ""
                              }`}
                            />
                          ))}
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Image Stamp Presets & Custom File Upload */}
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-[10px] font-bold text-zinc-400">Stamp:</span>
                          <button
                            onClick={() =>
                              setWatermarkImageUrl(
                                'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220" viewBox="0 0 220 220"><circle cx="110" cy="110" r="100" fill="none" stroke="%2310b981" stroke-width="8" stroke-dasharray="12 6"/><circle cx="110" cy="110" r="85" fill="none" stroke="%2310b981" stroke-width="4"/><text x="110" y="100" font-family="sans-serif" font-weight="900" font-size="20" fill="%2310b981" text-anchor="middle">OFFICIAL</text><text x="110" y="138" font-family="sans-serif" font-weight="900" font-size="28" fill="%2310b981" text-anchor="middle">APPROVED</text></svg>'
                              )
                            }
                            className="px-1.5 py-0.5 bg-emerald-600/20 text-emerald-500 hover:bg-emerald-600/30 rounded text-[10px] font-bold cursor-pointer"
                          >
                            ✓ Approved
                          </button>
                          <button
                            onClick={() =>
                              setWatermarkImageUrl(
                                'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="280" height="130" viewBox="0 0 280 130"><rect x="10" y="10" width="260" height="110" rx="16" fill="none" stroke="%23f43f5e" stroke-width="8"/><text x="140" y="78" font-family="sans-serif" font-weight="900" font-size="28" fill="%23f43f5e" text-anchor="middle" letter-spacing="3">CONFIDENTIAL</text></svg>'
                              )
                            }
                            className="px-1.5 py-0.5 bg-rose-600/20 text-rose-500 hover:bg-rose-600/30 rounded text-[10px] font-bold cursor-pointer"
                          >
                            🔒 Confidential
                          </button>
                          <button
                            onClick={() =>
                              setWatermarkImageUrl(
                                'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><polygon points="100,10 180,40 180,110 100,190 20,110 20,40" fill="none" stroke="%23f59e0b" stroke-width="8"/><text x="100" y="95" font-family="sans-serif" font-weight="900" font-size="20" fill="%23f59e0b" text-anchor="middle">VERIFIED</text><text x="100" y="130" font-family="sans-serif" font-weight="900" font-size="20" fill="%23f59e0b" text-anchor="middle">DECK</text></svg>'
                              )
                            }
                            className="px-1.5 py-0.5 bg-amber-600/20 text-amber-500 hover:bg-amber-600/30 rounded text-[10px] font-bold cursor-pointer"
                          >
                            🛡️ Verified
                          </button>

                          <label className="px-2 py-0.5 bg-indigo-600 text-white hover:bg-indigo-500 rounded text-[10px] font-extrabold cursor-pointer flex items-center gap-1">
                            <ImageIcon size={11} />
                            <span>Upload Image</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = (evt) => {
                                    const dataUrl = evt.target?.result as string;
                                    if (dataUrl) setWatermarkImageUrl(dataUrl);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                        </div>
                      </>
                    )}

                    <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-700 shrink-0" />

                    {/* Direction / Rotation Controls */}
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[10px] font-bold text-zinc-400">Direction:</span>
                      <button
                        onClick={() => setWatermarkRotation(-30)}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                          watermarkRotation === -30 ? "bg-amber-500 text-zinc-950 font-black" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                        }`}
                      >
                        ↗ Diagonal
                      </button>
                      <button
                        onClick={() => setWatermarkRotation(0)}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                          watermarkRotation === 0 ? "bg-amber-500 text-zinc-950 font-black" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                        }`}
                      >
                        ➡️ Horizontal
                      </button>
                      <button
                        onClick={() => setWatermarkRotation(-90)}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                          watermarkRotation === -90 ? "bg-amber-500 text-zinc-950 font-black" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                        }`}
                      >
                        ⬆️ Vertical
                      </button>
                      <input
                        type="range"
                        min="-90"
                        max="90"
                        value={watermarkRotation}
                        onChange={(e) => setWatermarkRotation(parseInt(e.target.value, 10))}
                        className="w-16 accent-amber-500 cursor-pointer"
                        title="Custom Angle"
                      />
                      <span className="text-[10px] font-mono font-bold text-zinc-400">{watermarkRotation}°</span>
                    </div>

                    <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-700 shrink-0" />

                    {/* Scale & Opacity Sliders */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-bold text-zinc-400">Size:</span>
                        <input
                          type="range"
                          min="0.5"
                          max="2.0"
                          step="0.1"
                          value={watermarkSize}
                          onChange={(e) => setWatermarkSize(parseFloat(e.target.value))}
                          className="w-14 accent-amber-500 cursor-pointer"
                        />
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-bold text-zinc-400">Opacity:</span>
                        <input
                          type="range"
                          min="0.05"
                          max="0.8"
                          step="0.03"
                          value={watermarkOpacity}
                          onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value))}
                          className="w-14 accent-amber-500 cursor-pointer"
                        />
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
