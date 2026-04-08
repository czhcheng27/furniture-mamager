// components/editor/sidebar/index.tsx
"use client";

import { Armchair, LampFloor, Table2 } from "lucide-react";
import { FURNITURE_ASSETS } from "@/constants/assets";
import { useStore } from "@/store/use-store";

const ASSET_ICONS = {
  sofa: Armchair,
  lamp: LampFloor,
  table: Table2,
} as const;

const Sidebar = () => {
  const addItem = useStore((state) => state.addItem);

  return (
    <div className="flex h-full flex-col p-4">
      <h3 className="mb-6 text-xs font-bold uppercase tracking-widest text-slate-500">
        Assets Library
      </h3>

      <div className="grid grid-cols-2 gap-3 overflow-y-auto pr-2 custom-scrollbar">
        {FURNITURE_ASSETS.map((asset) => {
          const Icon =
            ASSET_ICONS[asset.type as keyof typeof ASSET_ICONS] ?? Armchair;

          return (
            <button
              key={asset.id}
              type="button"
              title={asset.label}
              aria-label={asset.label}
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
            className="group grid aspect-square w-full min-w-0 grid-rows-[1fr_auto] overflow-hidden rounded-2xl border border-slate-800 bg-[#1c212c] p-3 text-center transition-all hover:border-blue-500/50 hover:bg-[#232936]"
          >
            {/* 缩略图占位 */}
            <div className="flex items-center justify-center self-center">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-slate-700/80 bg-[#0d0f14] text-slate-100 transition-all group-hover:scale-110 group-hover:border-blue-400/50 group-hover:text-blue-300">
                <Icon className="h-8 w-8" strokeWidth={1.8} />
              </div>
            </div>

            {/* 信息 */}
            <div className="flex h-6 items-end justify-center overflow-hidden">
              <p className="max-w-full truncate px-1 text-[10px] font-semibold leading-4 text-slate-200">
                {asset.label}
              </p>
            </div>
            </button>
          );
        })}
      </div>

      {/* 底部提示 */}
      <div className="mt-auto pt-4 border-t border-slate-800/50">
        <p className="text-[10px] text-slate-600 leading-relaxed">
          Drag or click a card to place it in the scene.
        </p>
      </div>
    </div>
  );
};

export default Sidebar;
