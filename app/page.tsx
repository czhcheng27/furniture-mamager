// 主编辑器入口 (将 Editor UI 与 3D Canvas 组合)
"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import Inspector from "@/components/editor/inspector";
import JsonPanel from "@/components/editor/json-panel";
import Sidebar from "@/components/editor/sidebar";

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

  return (
    // 全屏容器，禁止滚动
    <main className="h-screen w-screen flex flex-col bg-[#0d0f14] text-slate-200 overflow-hidden">
      {/* 顶部 Header (Toolbar 占位) */}
      <header className="h-12 border-b border-slate-800 flex items-center px-6 justify-between bg-[#151921]">
        <div className="font-bold tracking-tighter text-xl">
          FURNITURE <span className="text-blue-500">3D</span>
        </div>
        <div className="flex gap-4">
          <div className="h-8 w-24 bg-slate-800 rounded animate-pulse" />{" "}
          {/* 按钮占位 */}
        </div>
      </header>

      {/* 主工作区 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 左侧：资产库 */}
        <aside className="w-64 border-r border-slate-800 bg-[#151921]">
          <Sidebar />
        </aside>

        {/* 中间：3D 核心区 */}
        <section className="relative flex-1 bg-[#090a0f] flex flex-col">
          <div className="flex-1 relative">
            <Scene />
          </div>

          {/* 底部：JSON 面板 (悬浮效果) */}
          <div
            className={`absolute inset-x-6 bottom-6 z-10 transition-all duration-300 ease-out ${
              isJsonExpanded ? "top-6" : "h-40"
            }`}
          >
            <JsonPanel
              isExpanded={isJsonExpanded}
              onToggleExpand={() => setIsJsonExpanded((value) => !value)}
            />
          </div>
        </section>

        {/* 右侧：属性面板 */}
        <aside className="w-80 border-l border-slate-800 bg-[#151921]">
          <Inspector />
        </aside>
      </div>
    </main>
  );
}
