import { nanoid } from "nanoid";
import { temporal } from "zundo";
import { create, type StoreApi } from "zustand";
import { FurnitureItem, SceneStore, Vector3Array } from "@/types";

// Undo/Redo 只追踪场景数据，不追踪 action 函数本身。
// 这里把历史快照明确收窄 Pick 出 items + selectedId，确保历史栈（Undo Stack）只占用必要的内存。
export type SceneHistoryState = Pick<SceneStore, "items" | "selectedId">;

// 定义 zundo 内部 commit 函数的类型，用于将状态正式推入历史栈
type SceneHistoryCommit = (
  pastState: SceneHistoryState,
  replace: Parameters<StoreApi<SceneStore>["setState"]>[1],
  currentState: SceneHistoryState,
  deltaState?: Partial<SceneHistoryState> | null,
) => void;

// 待处理的历史记录结构，用于实现“防抖/合并”逻辑
type PendingSceneHistory = {
  commit: SceneHistoryCommit;
  pastState: SceneHistoryState; // 这一批连续操作的“起点”
  replace: Parameters<StoreApi<SceneStore>["setState"]>[1];
  currentState: SceneHistoryState;
  deltaState?: Partial<SceneHistoryState> | null;
  timer: ReturnType<typeof setTimeout>;
};

// 连续拖拽/滑杆更新时，不希望每一帧都进入历史栈。
// 这里用一个很短的窗口，把密集更新合并成 1 条 undo 记录。
const HISTORY_MERGE_WINDOW_MS = 200;
const historyBatchListeners = new Set<() => void>();

// 这两个模块级变量只服务于 zundo 的“批量提交”。
let pendingSceneHistory: PendingSceneHistory | null = null; // 暂存这一批操作的起点/终点；
let hasPendingSceneHistory = false; // 标志位，反映是否有尚未入栈的修改，让 UI 可以在真正落栈前就先显示 canUndo=true。

const notifyHistoryBatchListeners = () => {
  historyBatchListeners.forEach((listener) => listener());
};

const setPendingSceneHistoryFlag = (nextValue: boolean) => {
  if (hasPendingSceneHistory === nextValue) {
    return;
  }

  hasPendingSceneHistory = nextValue;
  notifyHistoryBatchListeners();
};

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

export const flushSceneHistory = () => {
  // 安全检查：如果仓库里根本没东西（没有正在进行的合并操作），直接返回
  if (!pendingSceneHistory) {
    return;
  }

  // 解构提取：把之前在 handleSet 里存下的“家底”都拿出来
  // commit 就是 Zundo 的入栈钥匙
  // pastState 是用户动第一下之前的状态（起跑点）
  // currentState 是当前最新的状态（终点）
  const { commit, currentState, deltaState, pastState, replace, timer } =
    pendingSceneHistory;

  clearTimeout(timer);

  // 清空暂存区：把模块全局变量置为空，释放内存，也标志着这一批操作结束了
  pendingSceneHistory = null;

  setPendingSceneHistoryFlag(false);
  commit(pastState, replace, currentState, deltaState);
};

// 订阅暂存状态的变化，通常用于 UI 亮起/变灰 Undo 按钮
export const subscribeSceneHistoryBatch = (listener: () => void) => {
  historyBatchListeners.add(listener);

  return () => {
    historyBatchListeners.delete(listener);
  };
};

export const getHasPendingSceneHistory = () => hasPendingSceneHistory;

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
      // 自定义历史记录入栈的行为
      /**
       *
       * @param commit Zundo 提供的**“入栈触发器”**。如果不调用它，这次修改就不会出现在 Undo 列表里。
       * @param pastState：执行这次修改之前的状态快照。
       * @param replace：传给 setState 的第二个参数，控制这次历史记录是“新增一条”还是“替换掉上一条”。默认是 false（新增），如果传 true 就会把上一条历史记录覆盖掉。
       * @param currentState：执行这次修改之后的状态快照（即最新的状态）。
       * @param deltaState：本次修改引起的状态变化（currentState 和 pastState 的差异）。注意这个值可能是 undefined 或 null，具体取决于 zundo 内部的实现细节。
       */
      handleSet: (commit) => (pastState, replace, currentState, deltaState) => {
        if (pendingSceneHistory) {
          // 这一批还没真正入栈时，后续连续更新只刷新“终点”和计时器。
          clearTimeout(pendingSceneHistory.timer);
          pendingSceneHistory.currentState = currentState;
          pendingSceneHistory.deltaState = deltaState;
          pendingSceneHistory.replace = replace;
        } else {
          // 仓库是空的, 说明这是连续操作的第一笔，这是这一批更新的第一下，先记住最早的 pastState。
          // 后面无论拖了多少次，undo 都会回到这个起点。
          setPendingSceneHistoryFlag(true);
          pendingSceneHistory = {
            commit: commit as unknown as SceneHistoryCommit, // 把入栈的权力存起来
            currentState: currentState as SceneHistoryState, // 当前位置
            deltaState,
            pastState: pastState as SceneHistoryState, // 把“最初的起点”记住！撤销就要回到这
            replace,
            timer: setTimeout(() => {
              flushSceneHistory();
            }, HISTORY_MERGE_WINDOW_MS),
          };
          return;
        }

        // 每次新输入都会重置窗口；用户停下来 200ms 后才真正提交。
        pendingSceneHistory.timer = setTimeout(() => {
          flushSceneHistory();
        }, HISTORY_MERGE_WINDOW_MS);
      },
    },
  ),
);
