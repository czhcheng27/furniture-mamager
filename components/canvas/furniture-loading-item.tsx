"use client";

import { Html } from "@react-three/drei";
import { ThreeEvent, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { FURNITURE_ASSETS } from "@/constants/assets";
import { FurnitureItem as FurnitureItemData } from "@/types";

interface Props {
  data: FurnitureItemData;
  isSelected: boolean;
  onClick: (e: ThreeEvent<MouseEvent>) => void;
}

// 预设不同家具类型的“替身”尺寸 [宽, 高, 深]
const PLACEHOLDER_DIMENSIONS: Record<string, [number, number, number]> = {
  sofa: [1.8, 0.7, 0.8],
  table: [1.5, 0.36, 0.9],
  lamp: [0.42, 1.3, 0.42],
  default: [0.9, 0.65, 0.9],
};

export function FurnitureLoadingItem({ data, isSelected, onClick }: Props) {
  const spinnerRef = useRef<THREE.Group>(null);
  const shellRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Mesh>(null);

  // 获取资产类型（如 'sofa'）
  const assetType = useMemo(
    () => FURNITURE_ASSETS.find((asset) => asset.id === data.assetId)?.type,
    [data.assetId],
  );

  // 根据类型提取具体的 [width, height, depth]
  const [width, height, depth] = useMemo(
    () =>
      PLACEHOLDER_DIMENSIONS[assetType ?? "default"] ??
      PLACEHOLDER_DIMENSIONS.default,
    [assetType],
  );

  // 计算地面光环的半径，取宽深最大值的 1.1 倍 (0.55 * 2)
  const ringOuterRadius = Math.max(width, depth) * 0.55;

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime(); // 获取从开始到现在的时间（秒）
    const pulse = 1 + Math.sin(t * 4) * 0.08;

    // 1. 旋转动画：让 spinnerRef 绕着 Y 轴转，给用户“系统正在处理”的反馈
    if (spinnerRef.current) {
      spinnerRef.current.rotation.y = t * 1.4;
    }

    // 2. 悬浮动画：让蓝色方块上下轻微浮动（sin函数），增加灵动感
    if (shellRef.current) {
      shellRef.current.position.y = height * 0.5 + Math.sin(t * 3) * 0.04;
    }

    // 3. 呼吸效果：让地上的光环 (halo) 像呼吸一样忽大忽小 (pulse)
    if (haloRef.current) {
      haloRef.current.scale.setScalar(pulse); // xyz 同步缩放
      const mat = haloRef.current.material;
      if (mat instanceof THREE.MeshBasicMaterial) {
        mat.opacity = isSelected ? 0.92 : 0.72;
      }
    }
  });

  return (
    // 1. 全局定位：把这整套 Loading 效果放在家具该在的位置
    <group position={data.position}>
      {/* 2. 动画组：useFrame 让这个组旋转，里面的所有东西就一起转 */}
      <group ref={spinnerRef}>
        {/* 实体：地面的光环。底部呼吸环 (ringGeometry) */}
        <mesh
          ref={haloRef}
          position={[0, 0.015, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          renderOrder={550} // 强制渲染顺序。确保这个光环在地面网格（Grid）之上，不会被地板“吃掉”。
        >
          {/* 形状：圆环。args：[内径, 外径, 分段数] */}
          <ringGeometry args={[ringOuterRadius * 0.68, ringOuterRadius, 48]} />
          {/* 材质：发亮但不反光的颜色 */}
          <meshBasicMaterial
            color={isSelected ? "#38bdf8" : "#7dd3fc"}
            transparent
            opacity={isSelected ? 0.92 : 0.72}
            side={THREE.DoubleSide} // 正反两面都渲染
          />
        </mesh>

        {/* 4. 实体：半透明的方块。半透明核心 (boxGeometry) */}
        <mesh
          ref={shellRef}
          position={[0, height * 0.5, 0]} // 抬高一半高度，使其立于地面
          onClick={(e) => {
            e.stopPropagation();
            onClick(e);
          }} // 允许加载时选中
        >
          {/* 形状：立方体。boxGeometry args：[宽, 高, 深] */}
          <boxGeometry args={[width, height, depth]} />
          {/* 材质：有金属感和透明度的专业皮肤 */}
          <meshStandardMaterial
            color={isSelected ? "#38bdf8" : "#1d4ed8"}
            transparent
            opacity={0.78}
            metalness={0.18} // 给一点金属质感，反射环境光
            roughness={0.24} // 比较光滑，会有高光点
          />
        </mesh>

        {/* 外层全息线框 (wireframe) */}
        <mesh position={[0, height * 0.5, 0]} rotation={[0, Math.PI / 6, 0]}>
          {/* 1.01：比内层稍微大一点点，防止两个面完全重叠导致闪烁（Z-Fighting）。 */}
          <boxGeometry args={[width * 1.01, height * 1.01, depth * 1.01]} />
          {/* 只渲染结构线条 */}
          <meshBasicMaterial
            color={isSelected ? "#e0f2fe" : "#93c5fd"}
            transparent
            opacity={0.5}
            wireframe // 这是 3D 里最常用的“黑科技感”表达方式，只显示三角形边框。
          />
        </mesh>
      </group>

      <Html
        center // 自动居中对齐坐标点
        position={[0, height + 0.22, 0]} // 放在方块头顶 22cm 处
        style={{ pointerEvents: "none" }} // 鼠标穿透，点击文字等于点击背景
      >
        <div
          style={{
            border: "1px solid rgba(56, 189, 248, 0.35)",
            background: "rgba(2, 6, 23, 0.86)",
            borderRadius: "999px",
            color: "#e0f2fe",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            fontSize: "10px",
            fontWeight: 700,
            letterSpacing: "0.18em",
            padding: "6px 10px",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
            boxShadow: "0 10px 28px rgba(2, 132, 199, 0.18)",
          }}
        >
          Loading model...
        </div>
      </Html>
    </group>
  );
}
