// 主编辑器入口 (将 Editor UI 与 3D Canvas 组合)
"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Braces, ChevronDown, ChevronUp } from "lucide-react";
import Inspector from "@/components/editor/inspector";
import JsonPanel from "@/components/editor/json-panel";
import Sidebar from "@/components/editor/sidebar";
import { useStore } from "@/store/use-store";

// 【关键】使用 dynamic 且禁用 ssr
const Scene = dynamic(() => import("@/components/canvas/scene"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[#090a0f]">
      <div className="text-blue-500 animate-pulse font-mono text-sm tracking-widest">
        INITIALIZING 3D ENGINE...
      </div>
    </div>
  ),
});

export default function Home() {
  const [isJsonExpanded, setIsJsonExpanded] = useState(false);
  const items = useStore((state) => state.items);
  const selectedId = useStore((state) => state.selectedId);
  const selectedItem = items.find((item) => item.id === selectedId);

  return (
    // 全屏容器，禁止滚动
    <main className="h-screen w-screen flex flex-col bg-[#0d0f14] text-slate-200 overflow-hidden">
      {/* 顶部 Header (Toolbar 占位) */}
      <header className="relative z-30 h-12 shrink-0 border-b border-slate-800 bg-[#151921]">
        <div className="flex h-full items-center justify-between px-6">
          <div className="font-bold tracking-tighter text-xl">
            FURNITURE <span className="text-blue-500">3D</span>
          </div>
          <div className="flex gap-4">
            <div className="h-8 w-24 bg-slate-800 rounded animate-pulse" />{" "}
            {/* 按钮占位 */}
          </div>
        </div>

        <div className="pointer-events-none absolute inset-y-0 left-64 right-80 flex items-center justify-center">
          <div className="pointer-events-auto relative flex w-full justify-center px-6">
            <button
              type="button"
              onClick={() => setIsJsonExpanded((value) => !value)}
              className="flex h-10 w-full max-w-2xl items-center justify-between gap-3 rounded-2xl border border-slate-700/80 bg-[#0f131b]/92 px-4 text-left shadow-[0_14px_40px_rgba(0,0,0,0.3)] backdrop-blur-xl transition hover:border-sky-400/45 hover:bg-[#131926]"
              aria-expanded={isJsonExpanded}
              aria-label={isJsonExpanded ? "Collapse JSON panel" : "Expand JSON panel"}
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-cyan-400/35 bg-cyan-500/10 text-cyan-200 shadow-[0_0_18px_rgba(34,211,238,0.15)]">
                  <Braces className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-200">
                    Scene JSON
                  </div>
                  <div className="truncate text-[11px] text-slate-400">
                    {selectedItem
                      ? `Selected: ${selectedItem.name}`
                      : items.length > 0
                        ? `${items.length} objects in scene`
                        : "Live scene data preview"}
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <div className="inline-flex items-center rounded-full border border-cyan-400/30 bg-cyan-500/12 px-2.5 py-1 text-[10px] font-semibold text-cyan-100">
                  {items.length}
                </div>
                {isJsonExpanded ? (
                  <ChevronUp className="h-4 w-4 text-slate-300" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-slate-300" />
                )}
              </div>
            </button>

            {isJsonExpanded ? (
              <div className="absolute left-1/2 top-[calc(100%+0.75rem)] h-[22rem] w-full max-w-4xl -translate-x-1/2">
                <JsonPanel
                  isExpanded={isJsonExpanded}
                  onToggleExpand={() => setIsJsonExpanded((value) => !value)}
                />
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {/* 主工作区 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 左侧：资产库 */}
        <aside className="w-64 border-r border-slate-800 bg-[#151921]">
          <Sidebar />
        </aside>

        <div className="flex min-w-0 flex-1 overflow-hidden">
          {/* 中间：3D 核心区 */}
          <section className="flex min-w-0 flex-1 flex-col bg-[#090a0f]">
            <div className="relative flex-1">
              <Scene />
            </div>
          </section>

          {/* 右侧：属性面板 */}
          <aside className="flex w-80 flex-col overflow-hidden border-l border-slate-800 bg-[#151921]">
            <div className="min-h-0 flex-1 overflow-y-auto">
              <Inspector />
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
