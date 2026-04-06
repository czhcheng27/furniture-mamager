// 负责初始化 Canvas（画布）、配置灯光、相机以及放置那个监听数据的 Manager
// components/canvas/scene.tsx
"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { SceneContent } from "./scene-content"; // 抽离内部逻辑方便使用 hooks

export default function Scene() {
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const rawData = e.dataTransfer.getData("furniture-data");
    if (!rawData) return;
    const asset = JSON.parse(rawData);

    // 发送一个自定义事件，让 Canvas 内部的 Raycaster 去计算位置
    // 这样比在外部算坐标要精准得多（考虑了透视相机、轨道控制器角度等）
    const dropEvent = new CustomEvent("canvas-drop", {
      detail: {
        asset,
        clientX: e.clientX,
        clientY: e.clientY,
      },
    });
    window.dispatchEvent(dropEvent);
  };

  return (
    // 外层容器：负责接收 HTML 拖拽
    <div
      className="relative w-full h-full"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      <Canvas
        shadows="soft" // 阴影总开关：没有它，物体就像悬浮在空中，没有真实感。
        // 设置相机初始位置：从侧上方俯瞰
        camera={{ position: [5, 5, 5], fov: 45 }}
        // WebGL 渲染器配置
        gl={{
          antialias: true, // 开启抗锯齿
          powerPreference: "high-performance",
          preserveDrawingBuffer: true,
        }}
      >
        <Suspense fallback={null}>
          <SceneContent />
        </Suspense>
      </Canvas>
    </div>
  );
}
