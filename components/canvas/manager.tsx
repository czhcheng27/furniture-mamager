// 这是整个系统的**“渲染引擎”**。它的唯一任务是：观察 items 数组，并为每一个 JSON 对象生成一个对应的 3D 组件。监听 Store，循环渲染。
// components/canvas/manager.tsx
"use client";

import { Suspense } from "react";
import { useStore } from "@/store/use-store";
import { FurnitureItem } from "./furniture-item";
import { FurnitureLoadingItem } from "./furniture-loading-item";

export function Manager() {
  // 1. 只选择 items 数组，避免不必要的重绘
  const items = useStore((state) => state.items);
  const selectedId = useStore((state) => state.selectedId);
  const selectItem = useStore((state) => state.selectItem);

  return (
    <group>
      {items.map((item) => (
        <Suspense
          key={item.id}
          fallback={
            <FurnitureLoadingItem
              data={item}
              isSelected={selectedId === item.id}
              onClick={(e) => {
                e.stopPropagation();
                selectItem(item.id);
              }}
            />
          }
        >
          <FurnitureItem
            data={item}
            isSelected={selectedId === item.id}
            onClick={(e) => {
              e.stopPropagation(); // 防止点击家具时触发地面的点击事件
              selectItem(item.id);
            }}
          />
        </Suspense>
      ))}
    </group>
  );
}
