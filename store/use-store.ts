import { nanoid } from "nanoid";
import { temporal } from "zundo";
import { create, type StoreApi } from "zustand";
import { FurnitureItem, SceneStore, Vector3Array } from "@/types";

// Undo/Redo 只追踪场景数据，不追踪 action 函数本身。
// 这里把历史快照明确收窄成 items + selectedId，确保历史栈只保存必要数据。
export type SceneHistoryState = Pick<SceneStore, "items" | "selectedId">;

// 定义 zundo 内部 commit 函数的类型，用于将状态正式推入历史栈
type SceneHistoryCommit = (
  // 执行当前这次 set 之前的 Store 状态
  pastState: SceneHistoryState,
  // 执行完这次 set 之后的最新状态
  // 更新模式标志
  // set(state, false) 是合并更新（默认，只改动你传的字段）
  // set(state, true) 是替换更新（整个 Store 被你传的对象完全替换）
  replace: Parameters<StoreApi<SceneStore>["setState"]>[1],
  currentState: SceneHistoryState,
  // 增量/变动部分: 这次更新具体改了哪些字段，比如只改了 selectedId，那么 deltaState 可能就是 { selectedId: 'xxx' }
  deltaState?: Partial<SceneHistoryState> | null,
) => void;

type QueuedSceneHistory = {
  pastState: SceneHistoryState; // 这一批连续操作的“起点”
  replace: Parameters<StoreApi<SceneStore>["setState"]>[1];
  currentState: SceneHistoryState;
  deltaState?: Partial<SceneHistoryState> | null;
};

// 连续拖拽/滑杆更新时，不希望每一帧都进入历史栈。
// 这里用一个很短的窗口，把密集更新合并成 1 条 undo 记录。
const HISTORY_MERGE_WINDOW_MS = 200;

// 深度比较三维向量是否相等
const areVector3ArraysEqual = (current: Vector3Array, next: Vector3Array) =>
  current[0] === next[0] && current[1] === next[1] && current[2] === next[2];

// 比较材质属性是否完全一致
const areMaterialsEqual = (
  current: FurnitureItem["material"],
  next: FurnitureItem["material"],
) =>
  current.color === next.color &&
  current.roughness === next.roughness &&
  current.metalness === next.metalness &&
  current.textureUrl === next.textureUrl;

// 判断一次 update 是否为“空操作”
const isItemUpdateNoop = (
  item: FurnitureItem,
  updates: Partial<FurnitureItem>,
) => {
  // updateItem 经常会被高频调用；如果值根本没变，直接跳过 set，
  // 避免生成空渲染，也避免 zundo 收到“看起来像变更”的更新。
  const changedKeys = Object.keys(updates) as Array<keyof FurnitureItem>;

  if (changedKeys.length === 0) {
    return true;
  }

  return changedKeys.every((key) => {
    const nextValue = updates[key];

    if (nextValue === undefined) {
      return item[key] === undefined;
    }

    if (key === "position") {
      return areVector3ArraysEqual(item.position, nextValue as Vector3Array);
    }

    if (key === "material") {
      return areMaterialsEqual(
        item.material,
        nextValue as FurnitureItem["material"],
      );
    }

    return Object.is(item[key], nextValue);
  });
};

export const useStore = create<SceneStore>()(
  temporal(
    (set) => ({
      items: [],
      selectedId: null,

      addItem: (asset, position: Vector3Array) =>
        set((state) => {
          const newItem: FurnitureItem = {
            id: nanoid(),
            assetId: asset.id,
            name: asset.label,
            modelPath: asset.modelPath,
            position,
            rotation: 0,
            material: {
              ...asset.defaultProperties,
            },
          };

          return {
            items: [...state.items, newItem],
            selectedId: newItem.id,
          };
        }),

      updateItem: (id, updates: Partial<FurnitureItem>) =>
        set((state) => {
          const currentItem = state.items.find((item) => item.id === id);

          // 找不到目标，或者更新前后完全一样时，直接返回原 state。
          if (!currentItem || isItemUpdateNoop(currentItem, updates)) {
            return state;
          }

          return {
            items: state.items.map((item) =>
              item.id === id ? { ...item, ...updates } : item,
            ),
          };
        }),

      selectItem: (id) =>
        set((state) => {
          // 单纯重复选中同一个对象，不要触发 store 更新。
          if (state.selectedId === id) {
            return state;
          }

          return { selectedId: id };
        }),

      removeItem: (id) =>
        set((state) => {
          const hasItem = state.items.some((item) => item.id === id);

          // 删除一个不存在的对象时，保持 state 引用不变。
          if (!hasItem) {
            return state;
          }

          return {
            items: state.items.filter((item) => item.id !== id),
            selectedId: state.selectedId === id ? null : state.selectedId,
          };
        }),
    }),
    {
      // 历史快照里保留 selectedId，是为了在 undo/redo 时顺便恢复选中态。
      partialize: (state) => ({
        items: state.items,
        selectedId: state.selectedId,
      }),
      // 这里判断 items 引用变了才记历史。如果是单纯 selectItem，引用不变，不进历史。
      equality: (pastState, currentState) =>
        pastState.items === currentState.items,
      limit: 100,
      // 这里只做一件事：把高频更新合并成“停下来之后的一次提交”。
      // 按钮亮不亮、能不能撤销，完全只看 zundo 自己的 pastStates / futureStates。
      handleSet: (commit) => {
        const commitSceneHistory = commit as unknown as SceneHistoryCommit;
        let queuedHistory: QueuedSceneHistory | null = null;
        let timer: ReturnType<typeof setTimeout> | null = null;

        return (pastState, replace, currentState, deltaState) => {
          if (timer) {
            clearTimeout(timer);
          }

          // 第一次动作：记录下最原始的 pastState (模型还没动的位置)
          if (!queuedHistory) {
            queuedHistory = {
              pastState: pastState as SceneHistoryState,
              replace,
              currentState: currentState as SceneHistoryState,
              deltaState,
            };
          } else {
            // 连续操作过程中，只更新 currentState，模型当前最新的位置。
            queuedHistory.currentState = currentState as SceneHistoryState;
            queuedHistory.deltaState = deltaState;
            queuedHistory.replace = replace;
          }

          timer = setTimeout(() => {
            if (!queuedHistory) {
              return;
            }

            commitSceneHistory(
              queuedHistory.pastState,
              queuedHistory.replace,
              queuedHistory.currentState,
              queuedHistory.deltaState,
            );
            queuedHistory = null;
            timer = null;
          }, HISTORY_MERGE_WINDOW_MS);
        };
      },
    },
  ),
);
