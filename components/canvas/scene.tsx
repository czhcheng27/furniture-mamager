// 负责初始化 Canvas（画布）、配置灯光、相机以及放置那个监听数据的 Manager
// components/canvas/scene.tsx
"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, ContactShadows } from "@react-three/drei";
import { Manager } from "./manager";
import { Suspense } from "react";

export default function Scene() {
  return (
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
      {/* 1. 灯光系统 */}
      {/* 环境光：它是“无死角”的光，提供基础亮度，防止背光面全黑。 */}
      <ambientLight intensity={1.0} />
      {/* 点光源：像一个灯泡，有具体位置，能产生阴影和高光。 */}
      <pointLight position={[10, 10, 10]} intensity={1.5} />

      {/* 2. 把 3D 场景的底色直接改成和网页背景一样的深黑色 */}
      <color attach="background" args={["#090a0f"]} />

      {/* 3. 核心逻辑：Manager 会根据 Zustand 的数据渲染模型 */}
      {/* 等待状态机：3D 模型和环境贴图体积很大。当它们还在下载时，Suspense 保证页面不崩溃，显示一个 fallback。 */}
      <Suspense fallback={null}>
        {/* 逻辑调度员：负责把 Zustand 里的数据变成 3D 实体。 */}
        <Manager />
      </Suspense>

      {/* 4. 辅助视觉：地板网格 */}
      <Grid
        infiniteGrid
        fadeDistance={30} // 渐变距离：网格不会在远处生硬地切断，而是在 30 个单位之外慢慢变淡直到透明，视觉上更自然
        sectionColor="green" // 大网格颜色：（每 10 个小格一条深色线）。这里用的 #2d3449 是深蓝色调
        cellColor="red" // 小网格颜色：稍微浅一点或深一点的 #1e2330，形成明暗对比
      />

      {/* 5. 软阴影：让家具“坐”在地上 */}
      <ContactShadows
        opacity={0.4} // 阴影的透明度
        scale={20} // 阴影投射的覆盖范围
        blur={2.4} // 模糊度：数值越高，阴影边缘越柔和，看起来像是在散射光照射下的效果
        far={4.5} // 检测距离：它决定了物体离地面多高时还能产生阴影。如果 far 太小，沙发离地 1 厘米阴影就消失了。
        color="#000000" // 阴影颜色：通常用黑色，但在某些特殊美术风格里可以调成深蓝色或深棕色。
      />

      {/* 6. 鼠标控制器：允许左键旋转、右键平移、滚轮缩放视图 */}
      <OrbitControls makeDefault minDistance={2} maxDistance={15} />
    </Canvas>
  );
}
