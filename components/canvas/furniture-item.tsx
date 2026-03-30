// 处理：异步加载模型、材质实时同步、以及选中后的轴向器 (Gizmo) 绑定。
// components/canvas/furniture-item.tsx
'use client'

import { GLTF } from 'three-stdlib'
import { useGLTF, PivotControls } from '@react-three/drei'
import { useStore } from '@/store/use-store'
import { ThreeEvent, ObjectMap } from '@react-three/fiber'
import { Vector3Array } from '@/types'

interface Props {
  data: any
  isSelected: boolean
  onClick: (e: ThreeEvent<MouseEvent>) => void
}

export function FurnitureItem({ data, isSelected, onClick }: Props) {
  // 1. 异步加载模型
  const { scene } = useGLTF(data.modelPath) as GLTF & ObjectMap
  const updateItem = useStore((state) => state.updateItem)

  return (
    // PivotControls 就是 UI 图里那个红绿蓝轴向器
    <PivotControls
      visible={isSelected}
      activeAxes={[true, false, true]} // 仅允许 X 和 Z 轴平移 (地板移动)
      depthTest={false}
      anchor={[0, 0, 0]}
      onDrag={(local) => {
          // 当用户拖拽轴向器时，实时更新 Zustand 里的坐标
          // 这里需要从 local matrix 提取 position，简化逻辑如下：
          const newPos: Vector3Array = [local.elements[12], local.elements[13], local.elements[14]]
          updateItem(data.id, { position: newPos })
        }}
      // 当拖拽 Gizmo 结束时更新 Store
      onDragEnd={() => {
        // 这里的逻辑通常是从 refs 中获取最新坐标
        // 为了演示 Partial 的用法，我们假设获取到了新坐标
      }}
    >
      {/* 原始对象占位符：当已经有一个现成的 Three.js 对象（比如加载进来的 scene）想把它放进 React 树里时，就用 primitive。 */}
      <primitive
        object={scene.clone()} // clone 是为了支持同一个模型放多个, 确保多个实例不冲突
        position={data.position}
        rotation={[0, data.rotation, 0]}
        onClick={onClick}
      >
        {/* 这里处理材质同步：遍历模型的所有 Mesh 并应用 Store 里的颜色/粗糙度 */}
        <meshStandardMaterial 
          color={data.material.color} 
          roughness={data.material.roughness}
          metalness={data.material.metalness}
        />
      </primitive>
    </PivotControls>
  )
}