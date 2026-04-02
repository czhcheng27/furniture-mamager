// 定义 FurnitureItem, SceneConfig, AssetDef 等接口
// types/index.ts

export type Vector3Array = [number, number, number];

// 基础材质定义
export interface FurnitureMaterial {
  color: string;
  roughness: number;
  metalness: number;
  textureUrl?: string; // AI 生成贴图留位
}

// 资产定义（静态数据：货架上的商品）
export interface AssetDefinition {
  id: string; // 资产 ID，如 'sofa-model-v1'
  type: string;
  label: string;
  thumbnail: string;
  modelPath: string;
  initialScale: number;
  defaultProperties: FurnitureMaterial; // 复用材质接口
}

// 家具项定义（动态数据：场景里的实例）
export interface FurnitureItem {
  id: string; // 唯一 ID (nanoid)
  assetId: string; // 关联到它是哪个资产
  name: string; // 显示名
  modelPath: string; // GLB 路径
  position: Vector3Array;
  rotation: number; // Y 轴旋转
  material: FurnitureMaterial; // 当前实例的材质状态
}

export interface SceneStore {
  items: FurnitureItem[];
  selectedId: string | null;

  // Actions
  addItem: (asset: AssetDefinition, position: Vector3Array) => void;
  updateItem: (id: string, updates: Partial<FurnitureItem>) => void;
  removeItem: (id: string) => void;
  selectItem: (id: string | null) => void;
}
