// components/canvas/scene-content.tsx
"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { OrbitControls, Grid, ContactShadows } from "@react-three/drei";
import { Manager } from "./manager";
import { useStore } from "@/store/use-store";

export function SceneContent() {
  const { raycaster, camera, mouse, gl } = useThree();
  const addItem = useStore((state) => state.addItem);

  useEffect(() => {
    window.addEventListener("canvas-drop", handleCanvasDrop);
    return () => window.removeEventListener("canvas-drop", handleCanvasDrop);
  }, [camera, gl, raycaster, addItem]);

  const handleCanvasDrop = (e: any) => {
    const { asset, clientX, clientY } = e.detail;

    // 1. 将屏幕坐标转为标准化设备坐标 (NDC)
    const rect = gl.domElement.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((clientY - rect.top) / rect.height) * 2 + 1;

    // 2. 更新射线
    const pointer = new THREE.Vector2(x, y);
    raycaster.setFromCamera(pointer, camera);

    // 3. 计算射线与地平面 (y=0) 的交点
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const targetPos = new THREE.Vector3();

    if (raycaster.ray.intersectPlane(plane, targetPos)) {
      // 4. 在交点处添加家具
      addItem(asset, [targetPos.x, 0, targetPos.z]);
    }
  };

  return (
    <>
      {/* 1. 灯光系统 */}
      {/* 环境光：它是“无死角”的光，提供基础亮度，防止背光面全黑。 */}
      <ambientLight intensity={1.0} />
      {/* 点光源：像一个灯泡，有具体位置，能产生阴影和高光。 */}
      <pointLight position={[10, 10, 10]} intensity={1.5} />

      {/* 2. 把 3D 场景的底色直接改成和网页背景一样的深黑色 */}
      <color attach="background" args={["#090a0f"]} />

      {/* 3. 核心逻辑：Manager 会根据 Zustand 的数据渲染模型。
          每个家具自己的加载状态在 item 级别处理，避免新增模型时整组场景一起闪烁。 */}
      <Manager />

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
    </>
  );
}
