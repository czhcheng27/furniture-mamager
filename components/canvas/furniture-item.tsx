// 处理：异步加载模型、材质实时同步、以及选中后的轴向器 (Gizmo) 绑定
// components/canvas/furniture-item.tsx
"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { GLTF } from "three-stdlib";
import { useGLTF, PivotControls } from "@react-three/drei";
import { useStore } from "@/store/use-store";
import { ThreeEvent, ObjectMap, useThree } from "@react-three/fiber";
import { FurnitureItem as FurnitureItemData } from "@/types";
import { FURNITURE_ASSETS } from "@/constants/assets";

interface Props {
  data: FurnitureItemData;
  isSelected: boolean;
  onClick: (e: ThreeEvent<MouseEvent>) => void;
}

export function FurnitureItem({ data, isSelected, onClick }: Props) {
  const { scene: globalScene } = useThree();
  const { scene } = useGLTF(data.modelPath) as GLTF & ObjectMap;
  const updateItem = useStore((state) => state.updateItem);

  // 1. 模型克隆与材质同步 (保持你原有逻辑)
  const clonedScene = useMemo(() => scene.clone(), [scene]);

  // 1. 在组件内先计算家具的局部包围盒尺寸
  const assetInfo = FURNITURE_ASSETS.find(
    (a) => a.modelPath === data.modelPath,
  );
  const s = assetInfo?.initialScale ?? 1;
  const bounds = useMemo(() => {
    clonedScene.updateMatrixWorld(true);

    const box = new THREE.Box3().setFromObject(clonedScene);

    return {
      size: box.getSize(new THREE.Vector3()).multiplyScalar(s),
      floorOffsetY: -box.min.y * s,
    };
  }, [clonedScene, s]);

  const [x, y, z] = data.position;

  const pivotMatrix = useMemo(() => {
    const matrix = new THREE.Matrix4();
    matrix.setPosition(x, y, z);
    return matrix;
  }, [x, y, z]);

  useEffect(() => {
    clonedScene.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;

      const materials = Array.isArray(child.material)
        ? child.material
        : [child.material];

      materials.forEach((material) => {
        if (!(material instanceof THREE.MeshStandardMaterial)) return;

        const isInitialColor =
          data.material.color === assetInfo?.defaultProperties.color;

        material.color.set(
          material.map && isInitialColor ? "#ffffff" : data.material.color,
        );
        material.roughness = data.material.roughness;
        material.metalness = data.material.metalness;
        material.needsUpdate = true;
      });
    });
  }, [assetInfo, clonedScene, data.material]);

  // 材质同步 useEffect 略（保持你原有的逻辑不变）
  useEffect(() => {
    /* ... 你原有的材质同步逻辑 ... */
  }, [clonedScene, data.material, assetInfo]);

  // --- 核心修改：不规则边界检测逻辑 ---
  const handleDrag = (local: THREE.Matrix4) => {
    const nextPosition = new THREE.Vector3();
    local.decompose(nextPosition, new THREE.Quaternion(), new THREE.Vector3());

    const roomModel = globalScene.getObjectByName("room-model-container");
    if (!roomModel) return;

    // 计算四个角的偏移量（根据缩放后的尺寸）
    const halfW = bounds.size.x / 2;
    const halfD = bounds.size.z / 2;

    // 定义 5 个探测点：中心 + 四个角
    const probePoints = [
      [0, 0],
      [halfW, halfD],
      [-halfW, halfD],
      [halfW, -halfD],
      [-halfW, -halfD],
    ];

    let allOnFloor = true;
    let groundY = nextPosition.y;

    for (const [offX, offZ] of probePoints) {
      const rayOrigin = new THREE.Vector3(
        nextPosition.x + offX,
        10,
        nextPosition.z + offZ,
      );
      const raycaster = new THREE.Raycaster(
        rayOrigin,
        new THREE.Vector3(0, -1, 0),
      );

      const intersects = raycaster.intersectObject(roomModel, true);

      // 关键修复：严格过滤“地板”
      // 1. 法线必须垂直向上 (y > 0.9)
      // 2. 碰撞点的高度必须在一个合理范围内（比如 y < 2），防止撞到天花板或高处的装饰
      const floorHit = intersects.find(
        (hit) => hit.face && hit.face.normal.y > 0.9 && hit.point.y < 1.0,
      );

      if (!floorHit) {
        allOnFloor = false;
        break;
      }

      // 以中心点的 y 值为准进行贴地
      if (offX === 0 && offZ === 0) {
        groundY = floorHit.point.y;
      }
    }

    // 只有 5 个点全部通过检测，才更新位置
    if (allOnFloor) {
      updateItem(data.id, {
        position: [nextPosition.x, groundY, nextPosition.z],
      });
    } else {
      // 拦截移动：此时家具已经触碰到不规则边界
      console.log("拦截：部分家具区域已超出地板或撞墙");
    }
  };

  return (
    <PivotControls
      matrix={pivotMatrix}
      visible={isSelected}
      activeAxes={[true, false, true]} // 仅允许 X 和 Z 轴平移 (地板移动)
      depthTest={false}
      anchor={[0, 0, 0]}
      disableAxes={!isSelected} // 未选中时禁用轴交互
      disableRotations
      autoTransform={false} // 必须为 false，我们手动控制同步
      onDrag={handleDrag}
    >
      <group>
        {/* 原始对象占位符：当已经有一个现成的 Three.js 对象（比如加载进来的 scene）想把它放进 React 树里时，就用 primitive。 */}
        <primitive
          object={clonedScene} // clone 是为了支持同一个模型放多个, 确保多个实例不冲突
          position={[0, bounds.floorOffsetY, 0]}
          scale={[s, s, s]} // 应用预设缩放
          rotation={[0, data.rotation, 0]}
          onClick={(e: ThreeEvent<MouseEvent>) => {
            e.stopPropagation();
            onClick(e);
          }}
        />
      </group>
    </PivotControls>
  );
}
