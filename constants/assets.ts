// 定义所有可供选择的家具元数据 (GLB路径、默认属性)
// constants/assets.ts

import { AssetDefinition } from "@/types";

export const FURNITURE_ASSETS: AssetDefinition[] = [
  {
    id: "asset-sofa-01",
    type: "sofa",
    label: "Modern Sofa",
    thumbnail: "🛋️",
    modelPath: "/models/sofa.glb",
    initialScale: 1,
    defaultProperties: { color: "#ffffff", roughness: 0.9, metalness: 0.1 },
  },
  {
    id: "asset-lamp-01",
    type: "lamp",
    label: "Floor Lamp",
    thumbnail: "💡",
    modelPath: "/models/lamp.glb",
    initialScale: 1,
    defaultProperties: { color: "#ffffff", roughness: 0.2, metalness: 0.8 },
  },
  {
    id: "asset-table-01",
    type: "table",
    label: "Dining Table",
    thumbnail: "🪑",
    modelPath: "/models/table.glb",
    initialScale: 0.001,
    defaultProperties: { color: "#ffffff", roughness: 0.4, metalness: 0.0 },
  },
];
