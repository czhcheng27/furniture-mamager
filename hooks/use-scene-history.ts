"use client";

import { useEffect } from "react";
import type { TemporalState } from "zundo";
import { shallow } from "zustand/shallow";
import { useStoreWithEqualityFn } from "zustand/traditional";
import { type SceneHistoryState, useStore } from "@/store/use-store";

type SceneTemporalState = TemporalState<SceneHistoryState>;

// zundo 挂在 useStore.temporal 上的是一个“额外的 vanilla store”。
// 这里包一层 React hook，让组件可以像订阅普通 Zustand 一样订阅历史状态。
export function useTemporalStore<T>(
  selector: (state: SceneTemporalState) => T,
  equality?: (left: T, right: T) => boolean,
) {
  return useStoreWithEqualityFn(useStore.temporal, selector, equality);
}

const isEditableElement = (element: Element | null) => {
  if (!(element instanceof HTMLElement)) {
    return false;
  }

  // 原生颜色选择器会吃键盘事件，避免在调色时误触 undo/redo。
  if (element instanceof HTMLInputElement && element.type === "color") {
    return true;
  }

  if (element.isContentEditable || element.closest("[contenteditable='true']")) {
    return true;
  }

  const tagName = element.tagName.toLowerCase();
  return tagName === "input" || tagName === "select" || tagName === "textarea";
};

const shouldIgnoreShortcuts = (target: EventTarget | null) => {
  const targetElement = target instanceof Element ? target : null;
  const activeElement =
    typeof document === "undefined" ? null : document.activeElement;

  // 只要当前焦点在可编辑区域，就把快捷键留给输入控件自己处理。
  return isEditableElement(targetElement) || isEditableElement(activeElement);
};

export function useSceneHistory() {
  const { pastDepth, futureDepth, redo: baseRedo, undo: baseUndo } =
    useTemporalStore(
      (state) => ({
        pastDepth: state.pastStates.length,
        futureDepth: state.futureStates.length,
        redo: state.redo,
        undo: state.undo,
      }),
      shallow,
    );

  return {
    // 现在按钮是否可用，完全以两个历史栈的真实长度为准。
    canRedo: futureDepth > 0,
    canUndo: pastDepth > 0,
    redo: baseRedo,
    undo: baseUndo,
  };
}

export function useSceneHistoryShortcuts() {
  const { canRedo, canUndo, redo, undo } = useSceneHistory();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // 只接管常见编辑器快捷键：Ctrl/Cmd+Z、Ctrl/Cmd+Shift+Z、Ctrl/Cmd+Y。
      if ((!event.ctrlKey && !event.metaKey) || event.altKey) {
        return;
      }

      if (shouldIgnoreShortcuts(event.target)) {
        return;
      }

      const key = event.key.toLowerCase();
      const isUndo = key === "z" && !event.shiftKey;
      const isRedo =
        (key === "z" && event.shiftKey) || (key === "y" && !event.shiftKey);

      if (!isUndo && !isRedo) {
        return;
      }

      // 拦住浏览器默认行为，统一交给场景历史处理。
      event.preventDefault();

      if (isUndo) {
        if (canUndo) {
          undo();
        }
        return;
      }

      if (canRedo) {
        redo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canRedo, canUndo, redo, undo]);
}
