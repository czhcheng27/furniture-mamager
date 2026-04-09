// components/editor/inspector.tsx
"use client";

import { useStore } from "@/store/use-store";

const Inspector = () => {
  const { selectedId, items, updateItem } = useStore();

  // 找到选中的物体
  const selectedItem = items.find((item) => item.id === selectedId);

  if (!selectedItem || !selectedId) {
    return (
      <div className="p-6 text-slate-500 italic text-sm">
        Select a furniture item in the scene to edit it.
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h3 className="text-lg font-bold border-b border-slate-800 pb-2">
        Properties
      </h3>

      {/* 颜色选择: 访问路径是 material.color */}
      <div className="space-y-2">
        <label className="text-xs text-slate-400 uppercase tracking-wider">
          Material Color
        </label>
        <input
          type="color"
          value={selectedItem.material.color || "#ffffff"}
          onChange={(e) =>
            updateItem(selectedId, {
              material: { ...selectedItem.material, color: e.target.value },
            })
          }
          className="w-full h-10 bg-[#0d0f14] border border-slate-700 rounded cursor-pointer"
        />
      </div>

      {/* 旋转滑块 */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <label className="text-xs text-slate-400 uppercase tracking-wider">
            Rotation
          </label>
          <span className="text-xs text-blue-400">
            {Math.round(selectedItem.rotation * 57.3)}°
          </span>
        </div>
        <input
          type="range"
          min="0"
          max={Math.PI * 2}
          step="0.01"
          value={selectedItem.rotation}
          onChange={(e) =>
            updateItem(selectedId, { rotation: parseFloat(e.target.value) })
          }
          className="w-full accent-blue-500"
        />
      </div>

      {/* 坐标显示 (只读或手动输入) */}
      <div className="space-y-2">
        <label className="text-xs text-slate-400 uppercase tracking-wider">
          World Position (X, Y, Z)
        </label>
        <div className="grid grid-cols-3 gap-2">
          {selectedItem.position.map((v, i) => (
            <div
              key={i}
              className="bg-[#0d0f14] p-2 rounded border border-slate-800 text-center text-sm font-mono"
            >
              {v.toFixed(2)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Inspector;
