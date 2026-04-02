// components/editor/sidebar/index.tsx
"use client";

import { Plus } from "lucide-react";
import { FURNITURE_ASSETS } from "@/constants/assets";
import { useStore } from "@/store/use-store";

const Sidebar = () => {
  const addItem = useStore((state) => state.addItem);

  return (
    <div className="p-4 flex flex-col h-full">
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">
        Assets Library
      </h3>

      <div className="grid grid-cols-1 gap-3 overflow-y-auto pr-2 custom-scrollbar">
        {FURNITURE_ASSETS.map((asset) => (
          <button
            key={asset.id}
            draggable
            // 拖拽开始：将资产数据存入 dataTransfer
            onDragStart={(e) => {
              // 这里的 key "furniture-data" 是我们自定义的协议
              e.dataTransfer.setData("furniture-data", JSON.stringify(asset));
              // 设置拖拽效果
              e.dataTransfer.effectAllowed = "move";
            }}
            onClick={() => {
              // 默认添加到房间中心点 [0, 0, 0]
              addItem(asset, [0, 0, 0]);
            }}
            className="group relative flex items-center gap-3 p-3 rounded-xl bg-[#1c212c] border border-slate-800 hover:border-blue-500/50 hover:bg-[#232936] transition-all text-left"
          >
            {/* 缩略图占位 */}
            <div className="h-12 w-12 rounded-lg bg-[#0d0f14] flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              {asset.thumbnail}
            </div>

            {/* 信息 */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate">
                {asset.label}
              </p>
              <p className="text-[10px] text-slate-500 uppercase">
                {asset.type}
              </p>
            </div>

            {/* 添加按钮图标 */}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-blue-600 rounded-full p-1">
              <Plus className="w-3 h-3 text-white" />
            </div>
          </button>
        ))}
      </div>

      {/* 底部提示 */}
      <div className="mt-auto pt-4 border-t border-slate-800/50">
        <p className="text-[10px] text-slate-600 leading-relaxed">
          Click an asset to add it to the scene center.
        </p>
      </div>
    </div>
  );
};

export default Sidebar;
