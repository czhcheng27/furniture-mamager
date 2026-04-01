"use client";

import { useStore } from "@/store/use-store";

const JsonPanel = () => {
  // 1. 订阅整个 items 数组的变化
  const items = useStore((state) => state.items);
  const selectedId = useStore((state) => state.selectedId);

  return (
    <div className="group h-full bg-[#0d0f14]/80 backdrop-blur-xl border border-slate-800 rounded-xl overflow-hidden flex flex-col shadow-2xl">
      {/* 头部状态条 */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900/50 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
            Scene Config Snapshot
          </span>
        </div>
        <span className="text-[10px] text-slate-600 font-mono">
          Objects: {items.length} | Selected: {selectedId ? "True" : "None"}
        </span>
      </div>

      {/* 代码预览区 */}
      <div className="flex-1 p-4 overflow-y-auto font-mono text-[11px] leading-relaxed">
        {items.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-700 italic">
            // No objects in scene. Click an asset to start.
          </div>
        ) : (
          <pre className="text-blue-400">
            <span className="text-slate-500">{"{"}</span>
            {"\n  "}
            <span className="text-purple-400">"scene_items"</span>: [
            {items.map((item, index) => (
              <div
                key={item.id}
                className={`pl-4 ${selectedId === item.id ? "bg-blue-500/10 border-l border-blue-500" : ""}`}
              >
                <span className="text-slate-500">{"{"}</span>
                {"\n    "}
                <span className="text-amber-400">"id"</span>:{" "}
                <span className="text-green-400">"{item.id}"</span>,{"\n    "}
                <span className="text-amber-400">"name"</span>:{" "}
                <span className="text-green-400">"{item.name}"</span>,{"\n    "}
                <span className="text-amber-400">"pos"</span>:{" "}
                <span className="text-white">
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
