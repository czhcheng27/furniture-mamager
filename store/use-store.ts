// 状态定义与操作 (addItem, updateItem, selectItem)
// store/use-store.ts
import { create } from 'zustand';
import { nanoid } from 'nanoid'; 
import { SceneStore, FurnitureItem, Vector3Array } from '@/types';

export const useStore = create<SceneStore>((set) => ({
  items: [],
  selectedId: null,

  // 1. 添加家具：显式声明返回类型和数据结构
  addItem: (asset, position: Vector3Array) => set((state) => {
    const newItem: FurnitureItem = {
      id: nanoid(),
      name: asset.label,
      modelPath: asset.modelPath,
      position: position,
      rotation: 0,
      material: { 
        // 展开配置表里的默认属性，确保类型符合 FurnitureMaterial
        ...asset.defaultProperties 
      },
    };

    return {
      items: [...state.items, newItem],
      selectedId: newItem.id, // 添加后默认选中
    };
  }),

  // 2. 更新属性：利用 Partial<FurnitureItem> 实现局部更新
  updateItem: (id, updates: Partial<FurnitureItem>) => set((state) => ({
    items: state.items.map((item) => 
      item.id === id ? { ...item, ...updates } : item
    )
  })),

  selectItem: (id) => set({ selectedId: id }),

  removeItem: (id) => set((state) => ({
    items: state.items.filter((item) => item.id !== id),
    selectedId: state.selectedId === id ? null : state.selectedId
  })),
}));