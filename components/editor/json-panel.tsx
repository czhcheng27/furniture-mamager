"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useStore } from "@/store/use-store";

interface JsonPanelProps {
  isExpanded: boolean;
  onToggleExpand: () => void;
}

const JsonPanel = ({ isExpanded, onToggleExpand }: JsonPanelProps) => {
  // 1. 订阅整个 items 数组的变化
  const items = useStore((state) => state.items);
  const selectedId = useStore((state) => state.selectedId);
  const selectedItem = items.find((item) => item.id === selectedId);

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-700/80 bg-[#0d0f14]/88 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
      {/* 头部状态条 */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-700/80 bg-gradient-to-r from-[#05070b]/95 via-[#111827]/95 to-[#08111f]/95 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-emerald-400/35 bg-emerald-500/12 shadow-[0_0_20px_rgba(16,185,129,0.18)]">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-200">
              Scene Config Snapshot
            </div>
            <div className="text-[11px] text-slate-400">
              Live scene data preview
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/12 px-3 py-1 text-[10px] font-semibold text-cyan-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <span className="text-cyan-200/70">Objects</span>
            <span>{items.length}</span>
          </div>
          <div
            className={`inline-flex max-w-[12rem] items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] ${
              selectedItem
                ? "border-blue-400/35 bg-blue-500/12 text-blue-100"
                : "border-slate-600/80 bg-slate-800/70 text-slate-300"
            }`}
          >
            <span className="shrink-0 opacity-80">Selected</span>
            <span className="truncate">{selectedItem?.name ?? "None"}</span>
          </div>
          <button
            type="button"
            onClick={onToggleExpand}
            className="inline-flex items-center gap-2 rounded-full border border-slate-600/80 bg-slate-900/80 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-100 transition hover:border-sky-400/50 hover:bg-slate-800 hover:text-sky-100"
            aria-label={isExpanded ? "Collapse JSON panel" : "Expand JSON panel"}
          >
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronUp className="h-3.5 w-3.5" />
            )}
            <span>{isExpanded ? "Collapse" : "Expand"}</span>
          </button>
        </div>
      </div>

      {/* 代码预览区 */}
      <div className="min-h-0 flex-1 overflow-y-auto p-4 font-mono text-[11px] leading-relaxed">
        {items.length === 0 ? (
          <div className="flex h-full items-center justify-center text-slate-500 italic">
            {"// No objects in scene. Click an asset to start."}
          </div>
        ) : (
          <pre className="text-blue-300">
            <span className="text-slate-500">{"{"}</span>
            {"\n  "}
            <span className="text-fuchsia-300">{'"scene_items"'}</span>: [
            {items.map((item, index) => (
              <div
                key={item.id}
                className={`pl-4 ${
                  selectedId === item.id
                    ? "border-l border-sky-400 bg-sky-500/10"
                    : ""
                }`}
              >
                <span className="text-slate-500">{"{"}</span>
                {"\n    "}
                <span className="text-amber-300">{'"id"'}</span>:{" "}
                <span className="text-emerald-300">{`"${item.id}"`}</span>,
                {"\n    "}
                <span className="text-amber-300">{'"name"'}</span>:{" "}
                <span className="text-emerald-300">{`"${item.name}"`}</span>,
                {"\n    "}
                <span className="text-amber-300">{'"pos"'}</span>:{" "}
                <span className="text-slate-100">
                  [{item.position.map((n) => n.toFixed(2)).join(", ")}]
                </span>
                {index < items.length - 1 ? (
                  <span className="text-slate-500">{"\n  },"}</span>
                ) : (
                  <span className="text-slate-500">{"\n  }"}</span>
                )}
              </div>
            ))}
            ]{"\n"}
            <span className="text-slate-500">{"}"}</span>
          </pre>
        )}
      </div>
    </div>
  );
};

export default JsonPanel;
