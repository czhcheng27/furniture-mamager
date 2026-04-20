// 主编辑器入口 (将 Editor UI 与 3D Canvas 组合)
"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Braces, ChevronDown, ChevronUp, X } from "lucide-react";
import HistoryControls from "@/components/editor/history-controls";
import Inspector from "@/components/editor/inspector";
import JsonPanel from "@/components/editor/json-panel";
import Sidebar from "@/components/editor/sidebar";
import { useSceneHistoryShortcuts } from "@/hooks/use-scene-history";
import { cn } from "@/lib/utils";
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

type MobilePanel = "assets" | "json" | "inspector" | null;

export default function Home() {
  const [isJsonExpanded, setIsJsonExpanded] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>(null);
  const items = useStore((state) => state.items);
  const selectedId = useStore((state) => state.selectedId);
  const selectedItem = items.find((item) => item.id === selectedId);
  const hasSelection = Boolean(selectedItem);

  useSceneHistoryShortcuts();

  const toggleMobilePanel = (panel: Exclude<MobilePanel, null>) => {
    setMobilePanel((current) => (current === panel ? null : panel));
  };

  const mobilePanelTitle =
    mobilePanel === "assets"
      ? "Assets Library"
      : mobilePanel === "json"
        ? "Scene JSON"
        : "Inspector";

  const mobilePanelSubtitle =
    mobilePanel === "assets"
      ? "Tap an asset to add it into the scene."
      : mobilePanel === "json"
        ? "Live scene data preview."
        : hasSelection
          ? `Editing ${selectedItem?.name}`
          : "Select an object in the scene to inspect it.";

  return (
    // 全屏容器，禁止滚动
    <main className="flex h-dvh min-h-dvh w-full flex-col overflow-hidden bg-[#0d0f14] text-slate-200">
      {/* 顶部 Header (Toolbar 占位) */}
      <header className="relative z-30 shrink-0 border-b border-slate-800 bg-[#151921]">
        <div className="flex items-center justify-between gap-3 px-4 py-3 xl:h-12 xl:px-6 xl:py-0">
          <div className="min-w-0">
            <div className="font-bold tracking-tighter text-lg sm:text-xl">
              FURNITURE <span className="text-blue-500">3D</span>
            </div>
            <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500 xl:hidden">
              {selectedItem
                ? `Editing ${selectedItem.name}`
                : items.length > 0
                  ? `${items.length} objects in scene`
                  : "Responsive workspace"}
            </div>
          </div>

          <div className="flex items-center gap-2 xl:gap-3">
            <div className="inline-flex items-center rounded-full border border-cyan-400/30 bg-cyan-500/12 px-3 py-1 text-[10px] font-semibold text-cyan-100">
              {items.length}
              <span className="ml-1 hidden sm:inline">Objects</span>
            </div>
            <div className="hidden max-w-[14rem] items-center rounded-full border border-slate-700 bg-slate-900/75 px-3 py-1 text-[10px] font-semibold text-slate-300 md:inline-flex xl:hidden">
              <span className="truncate">
                {selectedItem?.name ?? "No selection"}
              </span>
            </div>
            <HistoryControls />
          </div>
        </div>

        <div className="pointer-events-none absolute inset-y-0 left-64 right-80 hidden items-center justify-center xl:flex">
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
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* 左侧：资产库 */}
        <aside className="hidden w-64 border-r border-slate-800 bg-[#151921] xl:block">
          <Sidebar />
        </aside>

        <div className="relative flex min-w-0 flex-1 overflow-hidden">
          {/* 中间：3D 核心区 */}
          <section className="flex min-w-0 flex-1 flex-col bg-[#090a0f]">
            <div className="relative flex-1">
              <Scene />
            </div>
          </section>

          {/* 右侧：属性面板 */}
          <aside className="hidden w-80 flex-col overflow-hidden border-l border-slate-800 bg-[#151921] xl:flex">
            <div className="min-h-0 flex-1 overflow-y-auto">
              <Inspector />
            </div>
          </aside>
        </div>
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-4 pb-4 xl:hidden">
        <div className="pointer-events-auto mx-auto max-w-md rounded-[1.75rem] border border-slate-700/80 bg-[#0f131b]/92 p-2 shadow-[0_18px_50px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <div className="grid grid-cols-5 gap-2">
            <HistoryControls mode="mobile" />
            {(["assets", "json", "inspector"] as const).map((panel) => (
              <button
                key={panel}
                type="button"
                onClick={() => toggleMobilePanel(panel)}
                className={cn(
                  "rounded-2xl border px-3 py-3 text-center text-[11px] font-semibold tracking-wide transition",
                  mobilePanel === panel
                    ? "border-sky-400/50 bg-sky-500/15 text-sky-100 shadow-[0_0_24px_rgba(56,189,248,0.14)]"
                    : "border-slate-700 bg-[#171c25] text-slate-300 hover:border-slate-500 hover:bg-[#1c2330]",
                )}
              >
                {panel === "assets"
                  ? "Assets"
                  : panel === "json"
                    ? "JSON"
                    : "Inspector"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {mobilePanel ? (
        <div className="fixed inset-0 z-40 xl:hidden">
          <button
            type="button"
            aria-label="Close mobile panel"
            className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
            onClick={() => setMobilePanel(null)}
          />

          <div
            className={cn(
              "absolute flex flex-col overflow-hidden bg-[#151921] shadow-[0_24px_80px_rgba(0,0,0,0.55)]",
              mobilePanel === "json"
                ? "inset-x-4 bottom-24 top-20 rounded-[1.75rem] border border-slate-700/80 md:inset-x-10 md:bottom-8 md:top-20"
                : "inset-x-0 bottom-0 top-[18vh] rounded-t-[1.75rem] border-t border-slate-700/80 md:bottom-6 md:top-16 md:w-[26rem] md:rounded-[1.75rem] md:border md:border-slate-700/80 " +
                    (mobilePanel === "assets"
                      ? "md:left-6 md:right-auto"
                      : "md:left-auto md:right-6"),
            )}
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-800 bg-[#171c25] px-4 py-4">
              <div className="min-w-0">
                <div className="text-sm font-bold tracking-wide text-slate-100">
                  {mobilePanelTitle}
                </div>
                <div className="mt-1 text-[11px] text-slate-400">
                  {mobilePanelSubtitle}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobilePanel(null)}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-700 bg-[#0f131b] text-slate-200 transition hover:border-slate-500 hover:text-white"
                aria-label="Close panel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-hidden">
              {mobilePanel === "assets" ? (
                <div className="h-full">
                  <Sidebar onAssetAdded={() => setMobilePanel(null)} />
                </div>
              ) : null}

              {mobilePanel === "json" ? (
                <div className="h-full p-4">
                  <JsonPanel
                    isExpanded
                    onToggleExpand={() => setMobilePanel(null)}
                  />
                </div>
              ) : null}

              {mobilePanel === "inspector" ? (
                <div className="h-full overflow-y-auto">
                  <Inspector />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
