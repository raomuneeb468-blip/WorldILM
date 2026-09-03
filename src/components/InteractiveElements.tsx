import React, { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  BarChart2,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  LayoutGrid,
  TrendingUp,
  Workflow,
  Share2,
  SlidersHorizontal,
  Eye,
  EyeOff,
  Sparkles,
  Info,
  List,
  Grid,
  FileSpreadsheet,
  Columns,
  Check,
  ChevronDown,
  Clock,
  X,
  Plus
} from "lucide-react";

export interface ParsedBlock {
  type: "markdown" | "table" | "diagram";
  id: string;
  rawText?: string;
  headers?: string[];
  rows?: string[][];
  code?: string;
  lang?: string;
}

// -----------------------------------------------------------------
// 1. Helper: Elegant Badge and Cell Content Formatter
// -----------------------------------------------------------------
const renderCellContent = (text: string) => {
  if (text === undefined || text === null || text.trim() === "") {
    return <span className="text-zinc-400 dark:text-zinc-600 italic">empty</span>;
  }
  // Strip raw asterisks as the user requested bolding to be handled by the UI
  const clean = text.trim().replace(/\*\*/g, "").replace(/\*/g, "");
  const lower = clean.toLowerCase();

  // Color Coding for typical statuses/categorical metrics (Notion/Claude-style) - borderless soft chips
  if (["yes", "true", "completed", "active", "paid", "success", "high", "online", "resolved", "verified"].includes(lower)) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        {clean}
      </span>
    );
  }

  if (["no", "false", "inactive", "failed", "critical", "cancelled", "offline", "error", "blocked"].includes(lower)) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-500/10 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
        {clean}
      </span>
    );
  }

  if (["pending", "warning", "medium", "processing", "hold", "draft", "in_progress", "review"].includes(lower)) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
        {clean}
      </span>
    );
  }

  if (["low", "info", "new", "sent", "shipped", "open", "normal"].includes(lower)) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-sky-500/10 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300">
        <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
        {clean}
      </span>
    );
  }

  // E-mail Address Check
  if (clean.includes("@") && clean.includes(".")) {
    return (
      <span className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline cursor-pointer tracking-tight">
        {clean}
      </span>
    );
  }

  // Numeric detection
  const cleanNum = clean.replace(/[^0-9.-]/g, "");
  const isNum = !isNaN(parseFloat(cleanNum)) && cleanNum !== "";
  if (isNum) {
    return <span className="text-zinc-900 dark:text-zinc-100 font-semibold tracking-tight text-xs sm:text-sm whitespace-nowrap">{clean}</span>;
  }

  return <span className="text-zinc-800 dark:text-zinc-200 font-normal sm:font-medium leading-relaxed [word-break:normal] [overflow-wrap:break-word] hyphens-none">{clean}</span>;
};

// -----------------------------------------------------------------
// 2. Interactive Premium Table (Claude/ChatGPT Inspired)
// -----------------------------------------------------------------
export function InteractiveTable({
  headers,
  rows,
  onShowToast,
}: {
  headers: string[];
  rows: string[][];
  onShowToast: (msg: string) => void;
  key?: any;
}) {
  const [sortCol, setSortCol] = useState<number | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showSearch, setShowSearch] = useState<boolean>(false);
  const [copiedType, setCopiedType] = useState<string | null>(null);

  const copyCSV = () => {
    const csvContent = [
      headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(","),
      ...rows.map((row) => row.map((cell) => `"${(cell || "").replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    navigator.clipboard.writeText(csvContent).then(() => {
      setCopiedType("csv");
      setTimeout(() => setCopiedType(null), 1800);
    });
  };

  const copyMD = () => {
    let md = "| " + headers.join(" | ") + " |\n";
    md += "| " + headers.map(() => "---").join(" | ") + " |\n";
    rows.forEach((row) => {
      md += "| " + row.join(" | ") + " |\n";
    });

    navigator.clipboard.writeText(md).then(() => {
      setCopiedType("md");
      setTimeout(() => setCopiedType(null), 1800);
    });
  };

  const handleSort = (colIdx: number) => {
    if (sortCol === colIdx) {
      if (sortDir === "asc") {
        setSortDir("desc");
      } else {
        setSortCol(null);
        setSortDir("asc");
      }
    } else {
      setSortCol(colIdx);
      setSortDir("asc");
    }
  };

  // Filter rows based on search
  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return rows;
    const q = searchQuery.toLowerCase();
    return rows.filter((row) =>
      row.some((cell) => (cell || "").toLowerCase().includes(q))
    );
  }, [rows, searchQuery]);

  // Sort rows based on sortCol & sortDir
  const sortedRows = useMemo(() => {
    if (sortCol === null) return filteredRows;
    return [...filteredRows].sort((a, b) => {
      const valA = (a[sortCol] || "").trim().replace(/\*\*/g, "");
      const valB = (b[sortCol] || "").trim().replace(/\*\*/g, "");

      const numA = parseFloat(valA.replace(/[^0-9.-]/g, ""));
      const numB = parseFloat(valB.replace(/[^0-9.-]/g, ""));

      if (!isNaN(numA) && !isNaN(numB)) {
        return sortDir === "asc" ? numA - numB : numB - numA;
      }
      return sortDir === "asc"
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    });
  }, [filteredRows, sortCol, sortDir]);

  return (
    <div className="group/table relative my-4 w-full max-w-full rounded-2xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-950/60 shadow-2xs overflow-hidden select-text">
      {/* Floating Action Bar (ChatGPT / Claude Style) */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-zinc-50/80 dark:bg-zinc-900/80 border-b border-zinc-200/80 dark:border-zinc-800/80 text-xs text-zinc-500 dark:text-zinc-400">
        <div className="flex items-center gap-2">
          {rows.length > 3 && (
            <div className="relative flex items-center">
              {showSearch ? (
                <div className="flex items-center gap-1 bg-transparent rounded-md px-2 py-0.5 border-none">
                  <Search className="w-3 h-3 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Filter table..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent border-none outline-none text-xs text-zinc-800 dark:text-zinc-200 w-28 sm:w-36"
                    autoFocus
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowSearch(false);
                      setSearchQuery("");
                    }}
                    className="ml-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowSearch(true)}
                  className="flex items-center gap-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 py-1 px-1.5 rounded transition-colors cursor-pointer"
                  title="Search table"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-medium hidden sm:inline">Search</span>
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={copyMD}
            className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
            title="Copy table as Markdown"
          >
            <AnimatePresence mode="wait" initial={false}>
              {copiedType === "md" ? (
                <motion.span
                  key="check-md"
                  initial={{ scale: 0.2, opacity: 0 }}
                  animate={{ scale: [1.3, 1], opacity: 1 }}
                  exit={{ scale: 0.2, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[2.5]" />
                </motion.span>
              ) : (
                <motion.span key="copy-md" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center">
                  <Copy className="w-3.5 h-3.5" />
                </motion.span>
              )}
            </AnimatePresence>
            <span>Markdown</span>
          </button>
          <button
            onClick={copyCSV}
            className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
            title="Copy table as CSV"
          >
            <AnimatePresence mode="wait" initial={false}>
              {copiedType === "csv" ? (
                <motion.span
                  key="check-csv"
                  initial={{ scale: 0.2, opacity: 0 }}
                  animate={{ scale: [1.3, 1], opacity: 1 }}
                  exit={{ scale: 0.2, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[2.5]" />
                </motion.span>
              ) : (
                <motion.span key="copy-csv" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center">
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                </motion.span>
              )}
            </AnimatePresence>
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Structured Clean Table */}
      <div className="overflow-x-auto w-full custom-scrollbar select-text">
        <table className="w-full min-w-[550px] border-collapse text-left text-xs sm:text-sm">
          <thead className="bg-zinc-100/80 dark:bg-zinc-800/60 border-b border-zinc-200/80 dark:border-zinc-800">
            <tr>
              {headers.map((header, idx) => {
                const isSorted = sortCol === idx;
                return (
                  <th
                    key={idx}
                    onClick={() => handleSort(idx)}
                    className="py-3 px-4 text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 font-sans border-b border-zinc-200/80 dark:border-zinc-800 bg-zinc-100/80 dark:bg-zinc-800/60 select-none cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors align-middle whitespace-nowrap tracking-tight"
                  >
                    <div className="flex items-center gap-1.5 font-bold">
                      <span>{header}</span>
                      {isSorted ? (
                        <ChevronDown
                          className={`w-3.5 h-3.5 text-zinc-800 dark:text-zinc-200 transition-transform ${
                            sortDir === "asc" ? "rotate-180" : ""
                          }`}
                        />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-zinc-400 opacity-0 group-hover/table:opacity-50 transition-opacity" />
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60 bg-transparent">
            {sortedRows.length > 0 ? (
              sortedRows.map((row, rowIdx) => (
                <tr
                  key={rowIdx}
                  className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors"
                >
                  {row.map((cell, colIdx) => (
                    <td
                      key={colIdx}
                      className="py-3 px-4 text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 align-top [word-break:normal] [overflow-wrap:break-word] hyphens-none leading-relaxed"
                    >
                      {renderCellContent(cell)}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={headers.length || 1}
                  className="py-6 px-4 text-center text-xs text-zinc-400 dark:text-zinc-500 italic bg-transparent"
                >
                  No matching records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------
// 2. Interactive SVG Flowcharts, Mindmaps & Diagrams Renderer
// -----------------------------------------------------------------
interface GraphNode {
  id: string;
  label: string;
  shape?: "rectangle" | "diamond" | "circle" | "ellipse";
  color?: string;
}

interface GraphEdge {
  source: string;
  target: string;
  label?: string;
}

export function InteractiveDiagram({
  code,
  onShowToast,
}: {
  code: string;
  onShowToast: (msg: string) => void;
  key?: any;
}) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [highlightedNode, setHighlightedNode] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"flow" | "circular" | "grid">("flow");
  const svgContainerRef = useRef<HTMLDivElement>(null);

  // 1. Parse code to build connections
  const { nodes, edges } = useMemo(() => {
    const nodesMap: Record<string, GraphNode> = {};
    const edgesList: GraphEdge[] = [];
    const lines = code.split("\n");

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("//")) return;

      // Custom shape configurations: A [label|shape|color]
      const labelMatch = trimmed.match(/^([\w-]+)\s*\[(.*?)\]$/);
      if (labelMatch) {
        const id = labelMatch[1].trim();
        const configStr = labelMatch[2].trim();
        const parts = configStr.split("|");
        const label = parts[0] || id;
        const shape = (parts[1] || "rectangle") as any;
        const color = parts[2] || undefined;
        nodesMap[id] = { id, label, shape, color };
        return;
      }

      // Connections: A -> B or A -> B: connection description
      if (trimmed.includes("->")) {
        const parts = trimmed.split("->");
        const sourcePart = parts[0].trim();
        let targetPart = parts[1].trim();
        let edgeLabel = "";

        if (targetPart.includes(":")) {
          const subParts = targetPart.split(":");
          targetPart = subParts[0].trim();
          edgeLabel = subParts[1].trim();
        }

        // Inline shape parsing for source (e.g. A[label] -> B)
        const srcMatch = sourcePart.match(/^([\w-]+)\s*\[(.*?)\]$/);
        const srcId = srcMatch ? srcMatch[1].trim() : sourcePart;
        const srcLabel = srcMatch ? srcMatch[2].split("|")[0].trim() : sourcePart;

        const destMatch = targetPart.match(/^([\w-]+)\s*\[(.*?)\]$/);
        const destId = destMatch ? destMatch[1].trim() : targetPart;
        const destLabel = destMatch ? destMatch[2].split("|")[0].trim() : targetPart;

        if (!nodesMap[srcId]) {
          nodesMap[srcId] = { id: srcId, label: srcLabel, shape: "rectangle" };
        }
        if (!nodesMap[destId]) {
          nodesMap[destId] = { id: destId, label: destLabel, shape: "rectangle" };
        }

        edgesList.push({ source: srcId, target: destId, label: edgeLabel });
      } else {
        // Standalone node
        const cleanId = trimmed.replace(/[^a-zA-Z0-9_-]/g, "");
        if (cleanId && !nodesMap[cleanId]) {
          nodesMap[cleanId] = { id: cleanId, label: trimmed, shape: "rectangle" };
        }
      }
    });

    const finalNodes = Object.values(nodesMap);
    // If no nodes parsed, return a default hierarchy placeholder
    if (finalNodes.length === 0) {
      return {
        nodes: [
          { id: "start", label: "Start Flow", shape: "circle" },
          { id: "proc", label: "Analyze Input", shape: "rectangle" },
          { id: "decision", label: "Valid Data?", shape: "diamond" },
          { id: "success", label: "Output Created", shape: "ellipse" },
        ],
        edges: [
          { source: "start", target: "proc", label: "Trigger" },
          { source: "proc", target: "decision" },
          { source: "decision", target: "success", label: "Yes" },
        ],
      };
    }

    return { nodes: finalNodes, edges: edgesList };
  }, [code]);

  // 2. Perform layout mathematics (Flow BFS / Circular / Grid layouts)
  const { positions, width, height } = useMemo(() => {
    const nodeIds = nodes.map((n) => n.id);
    const canvasWidth = 620;
    const positionsMap: Record<string, { x: number; y: number }> = {};
    let canvasHeight = 360;

    if (viewMode === "flow") {
      // Top-Down BFS layout
      const inDegree: Record<string, number> = {};
      const adj: Record<string, string[]> = {};

      nodeIds.forEach((id) => {
        inDegree[id] = 0;
        adj[id] = [];
      });

      edges.forEach((edge) => {
        if (adj[edge.source]) adj[edge.source].push(edge.target);
        if (inDegree[edge.target] !== undefined) inDegree[edge.target]++;
      });

      const queue: string[] = [];
      const nodeLayers: Record<string, number> = {};

      nodeIds.forEach((id) => {
        if (inDegree[id] === 0) {
          queue.push(id);
          nodeLayers[id] = 0;
        }
      });

      while (queue.length > 0) {
        const u = queue.shift()!;
        const currentLayer = nodeLayers[u] || 0;
        (adj[u] || []).forEach((v) => {
          nodeLayers[v] = Math.max(nodeLayers[v] || 0, currentLayer + 1);
          queue.push(v);
        });
      }

      // Fallback for circular components or unassigned layers
      nodeIds.forEach((id) => {
        if (nodeLayers[id] === undefined) {
          nodeLayers[id] = 1;
        }
      });

      // Group nodes by layers
      const layerGroups: Record<number, string[]> = {};
      nodeIds.forEach((id) => {
        const l = nodeLayers[id];
        if (!layerGroups[l]) layerGroups[l] = [];
        layerGroups[l].push(id);
      });

      const rowHeight = 90;
      const colWidth = 140;

      Object.keys(layerGroups).forEach((lStr) => {
        const layer = parseInt(lStr);
        const ids = layerGroups[layer];
        const totalRowWidth = (ids.length - 1) * colWidth;
        const startX = (canvasWidth - totalRowWidth) / 2;

        ids.forEach((id, idx) => {
          positionsMap[id] = {
            x: startX + idx * colWidth,
            y: 50 + layer * rowHeight,
          };
        });
      });

      const maxLayer = Math.max(...Object.values(nodeLayers), 0);
      canvasHeight = 100 + maxLayer * rowHeight;
    } else if (viewMode === "circular") {
      // Circular Layout
      const radius = 110;
      const centerX = canvasWidth / 2;
      const centerY = 180;
      nodes.forEach((n, idx) => {
        const angle = (idx / nodes.length) * 2 * Math.PI;
        positionsMap[n.id] = {
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle),
        };
      });
      canvasHeight = 360;
    } else {
      // Grid Layout
      const colsCount = Math.ceil(Math.sqrt(nodes.length));
      const colW = canvasWidth / (colsCount + 1);
      const rowH = 80;
      nodes.forEach((n, idx) => {
        const col = idx % colsCount;
        const row = Math.floor(idx / colsCount);
        positionsMap[n.id] = {
          x: colW + col * colW,
          y: 60 + row * rowH,
        };
      });
      canvasHeight = 100 + Math.ceil(nodes.length / colsCount) * rowH;
    }

    return { positions: positionsMap, width: canvasWidth, height: canvasHeight };
  }, [nodes, edges, viewMode]);

  // Drag and pan support
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetCanvas = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setHighlightedNode(null);
    onShowToast("Diagram alignment reset!");
  };

  const downloadSVG = () => {
    if (!svgContainerRef.current) return;
    const svgEl = svgContainerRef.current.querySelector("svg");
    if (!svgEl) return;
    
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const svgUrl = URL.createObjectURL(svgBlob);
    const downloadLink = document.createElement("a");
    downloadLink.href = svgUrl;
    downloadLink.download = "workflow_diagram.svg";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    onShowToast("SVG vector diagram downloaded successfully! 🎨");
  };

  // Node styles getter
  const getNodeColor = (node: GraphNode) => {
    if (node.id === highlightedNode) return "stroke-indigo-600 fill-indigo-50/40 dark:fill-indigo-950/20";
    if (node.color) {
      if (node.color === "red") return "stroke-red-500 fill-red-50/20 dark:fill-red-950/10";
      if (node.color === "green") return "stroke-emerald-500 fill-emerald-50/20 dark:fill-emerald-950/10";
      if (node.color === "purple") return "stroke-purple-500 fill-purple-50/20 dark:fill-purple-950/10";
    }
    return "stroke-zinc-300 dark:stroke-zinc-700 fill-white dark:fill-zinc-900";
  };

  return (
    <div className="my-6 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden bg-white dark:bg-zinc-950 shadow-sm relative">
      {/* Top Header bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 select-none">
        <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 font-sans uppercase tracking-wider">
          <Workflow size={13} className="text-indigo-500" />
          <span>Vector Architecture Board</span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Layout Mode Selectors */}
          <div className="flex border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden text-[10px] font-bold bg-white dark:bg-zinc-900">
            {(["flow", "circular", "grid"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-2 py-1 uppercase tracking-wide transition-colors cursor-pointer ${
                  viewMode === mode
                    ? "bg-indigo-600 text-white"
                    : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          <button
            onClick={downloadSVG}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-300 rounded-lg transition-all cursor-pointer"
          >
            <Download size={12} />
            <span>SVG</span>
          </button>

          <button
            onClick={resetCanvas}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded-lg transition-colors cursor-pointer"
            title="Reset Canvas"
          >
            <RefreshCw size={12} />
          </button>
        </div>
      </div>

      {/* Control Buttons inside Canvas Area */}
      <div className="absolute right-3 top-14 z-20 flex flex-col gap-1 bg-white/90 dark:bg-zinc-950/90 border border-zinc-200 dark:border-zinc-800 rounded-lg p-1 shadow-md select-none">
        <button
          onClick={() => setZoom((z) => Math.min(z + 0.15, 2.5))}
          className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-zinc-600 dark:text-zinc-300 cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn size={14} />
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(z - 0.15, 0.5))}
          className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-zinc-600 dark:text-zinc-300 cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut size={14} />
        </button>
        <button
          onClick={() => setPan({ x: 0, y: 0 })}
          className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-zinc-600 dark:text-zinc-300 cursor-pointer"
          title="Recenter View"
        >
          <LayoutGrid size={14} />
        </button>
      </div>

      {/* SVG Canvas Workspace */}
      <div
        ref={svgContainerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`w-full overflow-hidden relative select-none ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
        style={{ height: `${height}px`, minHeight: "260px" }}
      >
        <svg
          className="w-full h-full"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "center center",
            transition: isDragging ? "none" : "transform 0.15s ease-out",
          }}
        >
          {/* Arrow markers */}
          <defs>
            <marker
              id="arrow"
              viewBox="0 0 10 10"
              refX="18"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#94a3b8" />
            </marker>
            <marker
              id="arrow-active"
              viewBox="0 0 10 10"
              refX="18"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#4f6bf0" />
            </marker>
          </defs>

          {/* Render connecting edges first (underneath nodes) */}
          {edges.map((edge, idx) => {
            const from = positions[edge.source];
            const to = positions[edge.target];
            if (!from || !to) return null;

            const isEdgeHighlighted =
              highlightedNode === edge.source || highlightedNode === edge.target;

            // Simple Bézier path calculations for elegant curves
            const dx = to.x - from.x;
            const dy = to.y - from.y;
            const cx1 = from.x + dx * 0.25;
            const cy1 = from.y + dy * 0.75;
            const cx2 = from.x + dx * 0.75;
            const cy2 = from.y + dy * 0.25;

            const pathD = `M ${from.x},${from.y} C ${cx1},${cy1} ${cx2},${cy2} ${to.x},${to.y}`;

            return (
              <g key={idx}>
                <path
                  d={pathD}
                  fill="none"
                  stroke={isEdgeHighlighted ? "#6366f1" : "#cbd5e1"}
                  strokeWidth={isEdgeHighlighted ? "2.5" : "1.8"}
                  className="dark:stroke-zinc-800 transition-all duration-300"
                  markerEnd={isEdgeHighlighted ? "url(#arrow-active)" : "url(#arrow)"}
                />
                {edge.label && (
                  <g>
                    <rect
                      x={(from.x + to.x) / 2 - 25}
                      y={(from.y + to.y) / 2 - 8}
                      width="50"
                      height="15"
                      rx="4"
                      fill="#ffffff"
                      stroke="#f1f5f9"
                      className="dark:fill-zinc-950 dark:stroke-zinc-850"
                    />
                    <text
                      x={(from.x + to.x) / 2}
                      y={(from.y + to.y) / 2 + 3}
                      fill="#94a3b8"
                      fontSize="8"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {edge.label}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Render node circles, diamonds, or cards */}
          {nodes.map((node) => {
            const pos = positions[node.id];
            if (!pos) return null;

            const isCurrentHighlighted = highlightedNode === node.id;

            return (
              <g
                key={node.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                onClick={(e) => {
                  e.stopPropagation();
                  setHighlightedNode(highlightedNode === node.id ? null : node.id);
                }}
                className="group cursor-pointer select-none"
              >
                {/* Visual shapes */}
                {node.shape === "circle" ? (
                  <circle
                    cx="0"
                    cy="0"
                    r="24"
                    className={`${getNodeColor(node)} stroke-[2.2] transition-all duration-300`}
                    filter={isCurrentHighlighted ? "drop-shadow(0 0 4px rgba(79, 107, 240, 0.4))" : ""}
                  />
                ) : node.shape === "diamond" ? (
                  <polygon
                    points="0,-24 28,0 0,28 -28,0"
                    className={`${getNodeColor(node)} stroke-[2.2] transition-all duration-300`}
                    filter={isCurrentHighlighted ? "drop-shadow(0 0 4px rgba(79, 107, 240, 0.4))" : ""}
                  />
                ) : node.shape === "ellipse" ? (
                  <ellipse
                    cx="0"
                    cy="0"
                    rx="32"
                    ry="20"
                    className={`${getNodeColor(node)} stroke-[2.2] transition-all duration-300`}
                    filter={isCurrentHighlighted ? "drop-shadow(0 0 4px rgba(79, 107, 240, 0.4))" : ""}
                  />
                ) : (
                  // Default elegant rectangle card
                  <rect
                    x="-42"
                    y="-16"
                    width="84"
                    height="32"
                    rx="8"
                    className={`${getNodeColor(node)} stroke-[2.2] transition-all duration-300`}
                    filter={isCurrentHighlighted ? "drop-shadow(0 0 5px rgba(79, 107, 240, 0.4))" : ""}
                  />
                )}

                {/* Node labels */}
                <text
                  x="0"
                  y="4"
                  textAnchor="middle"
                  fill="currentColor"
                  className="text-zinc-800 dark:text-zinc-200 text-[10.5px] font-extrabold tracking-tight select-none pointer-events-none"
                >
                  {node.label.length > 13 ? node.label.substring(0, 11) + ".." : node.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Info helper tag */}
      <div className="absolute left-3 bottom-3 text-[10px] text-zinc-400 font-bold select-none pointer-events-none">
        💡 Drag to pan • Scroll to zoom • Click nodes to trace path
      </div>
    </div>
  );
}

// -----------------------------------------------------------------
// 3. Message Parsing Splitter Engine
// -----------------------------------------------------------------
export function parseMessageBlocks(text: string): ParsedBlock[] {
  if (!text) return [];
  const blocks: ParsedBlock[] = [];
  const lines = text.split("\n");

  let blockIdx = 0;
  let currentMarkdownLines: string[] = [];
  let inTable = false;
  let tableLines: string[] = [];

  let inCodeBlock = false;
  let codeBlockLang = "";
  let codeBlockLines: string[] = [];

  const pushMarkdown = () => {
    if (currentMarkdownLines.length > 0) {
      blocks.push({
        type: "markdown",
        id: "md_" + (blockIdx++),
        rawText: currentMarkdownLines.join("\n"),
      });
      currentMarkdownLines = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // 1. Code Blocks
    if (trimmed.startsWith("```")) {
      if (inCodeBlock) {
        // Close code block
        inCodeBlock = false;
        if (["diagram", "js-diagram", "chart", "mermaid"].includes(codeBlockLang)) {
          pushMarkdown();
          blocks.push({
            type: "diagram",
            id: "diag_" + (blockIdx++),
            code: codeBlockLines.join("\n"),
            lang: codeBlockLang,
          });
        } else {
          // Keep normal code block as markdown
          currentMarkdownLines.push("```" + codeBlockLang);
          currentMarkdownLines.push(...codeBlockLines);
          currentMarkdownLines.push("```");
        }
        codeBlockLines = [];
        codeBlockLang = "";
      } else {
        // Open code block
        pushMarkdown();
        inCodeBlock = true;
        codeBlockLang = trimmed.substring(3).trim().toLowerCase();
        codeBlockLines = [];
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      continue;
    }

    // 2. Table identification
    const isTableLine = trimmed.startsWith("|") && trimmed.endsWith("|") && trimmed.length > 1;

    if (isTableLine) {
      if (!inTable) {
        // Look ahead to check if the next line is a divider line, e.g. |---|
        const nextLine = lines[i + 1];
        const isNextSeparator =
          nextLine &&
          nextLine.trim().startsWith("|") &&
          nextLine.trim().includes("-") &&
          nextLine.trim().endsWith("|");

        if (isNextSeparator) {
          pushMarkdown();
          inTable = true;
          tableLines = [line];
        } else {
          currentMarkdownLines.push(line);
        }
      } else {
        tableLines.push(line);
      }
      continue;
    } else {
      if (inTable) {
        inTable = false;
        const parsed = parseMarkdownTable(tableLines);
        if (parsed) {
          blocks.push({
            type: "table",
            id: "tbl_" + (blockIdx++),
            headers: parsed.headers,
            rows: parsed.rows,
          });
        } else {
          // fallback to standard markdown lines
          currentMarkdownLines.push(...tableLines);
        }
        tableLines = [];
      }
      currentMarkdownLines.push(line);
    }
  }

  // Handle leftovers
  if (inTable) {
    const parsed = parseMarkdownTable(tableLines);
    if (parsed) {
      blocks.push({
        type: "table",
        id: "tbl_" + (blockIdx++),
        headers: parsed.headers,
        rows: parsed.rows,
      });
    } else {
      currentMarkdownLines.push(...tableLines);
    }
  }

  if (inCodeBlock) {
    currentMarkdownLines.push("```" + codeBlockLang);
    currentMarkdownLines.push(...codeBlockLines);
  }

  pushMarkdown();
  return blocks;
}

function parseMarkdownTable(lines: string[]) {
  if (lines.length < 2) return null;

  const parseRow = (l: string) => {
    const parts = l.split("|");
    return parts.slice(1, parts.length - 1).map((x) => x.trim());
  };

  const headers = parseRow(lines[0]);
  const rows: string[][] = [];

  for (let i = 2; i < lines.length; i++) {
    const rowRaw = lines[i].trim();
    if (rowRaw) {
      rows.push(parseRow(rowRaw));
    }
  }

  return { headers, rows };
}
