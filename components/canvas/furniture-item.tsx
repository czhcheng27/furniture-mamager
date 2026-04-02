// 处理：异步加载模型、材质实时同步、以及选中后的轴向器 (Gizmo) 绑定。
// components/canvas/furniture-item.tsx
"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { GLTF } from "three-stdlib";
import { useGLTF, PivotControls } from "@react-three/drei";
import { useStore } from "@/store/use-store";
import { ThreeEvent, ObjectMap } from "@react-three/fiber";
import { FurnitureItem as FurnitureItemData, Vector3Array } from "@/types";
import { FURNITURE_ASSETS } from "@/constants/assets";

interface Props {
  data: FurnitureItemData;
  isSelected: boolean;
  onClick: (e: ThreeEvent<MouseEvent>) => void;
}

export function FurnitureItem({ data, isSelected, onClick }: Props) {
  // 1. 异步加载模型
  const { scene } = useGLTF(data.modelPath) as GLTF & ObjectMap;
  const updateItem = useStore((state) => state.updateItem);

  // 1. 使用 useMemo 克隆模型，确保同一个模型多次添加不冲突，且引用稳定
  const clonedScene = useMemo(() => {
    const clone = scene.clone();
    // 初始材质处理：如果这里不处理，后面 useEffect 会刷黑
    return clone;
  }, [scene]);

  // 从配置常量中找到该资产的初始缩放比例
  const assetInfo = FURNITURE_ASSETS.find(
    (a) => a.modelPath === data.modelPath,
  );
  const s = assetInfo?.initialScale ?? 1;
  const [x, y, z] = data.position;
  const pivotMatrix = useMemo(() => {
    const matrix = new THREE.Matrix4();
    matrix.setPosition(x, y, z);
    return matrix;
  }, [x, y, z]);

  // 2. 材质同步逻辑
  useEffect(() => {
    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.material) {
          const mat = mesh.material as THREE.MeshStandardMaterial;

          // 核心修复：如果是初始默认色，不覆盖（保护贴图）；如果是用户改过，再应用
          const isInitial =
            data.material.color === assetInfo?.defaultProperties.color;
          if (mat.map && isInitial) {
            mat.color.set("#ffffff");
          } else {
            mat.color.set(data.material.color);
          }

          mat.roughness = data.material.roughness;
          mat.metalness = data.material.metalness;
        }
      }
    });
  }, [clonedScene, data.material, assetInfo]);

  return (
    <PivotControls
      matrix={pivotMatrix}
      visible={isSelected}
      activeAxes={[true, false, true]} // 仅允许 X 和 Z 轴平移 (地板移动)
      depthTest={false}
      anchor={[0, 0, 0]}
      disableAxes={!isSelected} // 未选中时禁用轴交互
      disableRotations
      autoTransform={false}
      onDrag={(local) => {
        const nextPosition = new THREE.Vector3();
        local.decompose(
          nextPosition,
          new THREE.Quaternion(),
          new THREE.Vector3(),
        );

        const newPos: Vector3Array = [
          nextPosition.x,
          nextPosition.y,
          nextPosition.z,
        ];

        updateItem(data.id, { position: newPos });
      }}
    >
      <group>
        {/* 原始对象占位符：当已经有一个现成的 Three.js 对象（比如加载进来的 scene）想把它放进 React 树里时，就用 primitive。 */}
        <primitive
          object={clonedScene} // clone 是为了支持同一个模型放多个, 确保多个实例不冲突
          position={[0, 0, 0]}
          scale={[s, s, s]} // 应用预设缩放
          rotation={[0, data.rotation, 0]}
          onClick={(e: ThreeEvent<MouseEvent>) => {
            e.stopPropagation();
            onClick(e);
          }}
        ></primitive>
      </group>
    </PivotControls>
  );
}
