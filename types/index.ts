// 定义 FurnitureItem, SceneConfig, AssetDef 等接口
// types/index.ts

export type Vector3Array = [number, number, number];

export interface FurnitureMaterial {
  color: string;
  roughness: number;
  metalness: number;
  textureUrl?: string; // AI 生成贴图留位
}

export interface FurnitureItem {
  id: string;            // 唯一 ID (uuid)
  name: string;          // 显示名
  modelPath: string;     // GLB 路径
  position: Vector3Array;
  rotation: number;      // Y 轴旋转
  material: FurnitureMaterial;
}

export interface SceneStore {
  items: FurnitureItem[];
  selectedId: string | null;
  
  // Actions
  addItem: (asset: any, position: Vector3Array) => void;
  updateItem: (id: string, updates: Partial<FurnitureItem>) => void;
  removeItem: (id: string) => void;
  selectItem: (id: string | null) => void;
}