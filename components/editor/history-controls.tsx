"use client";

import { Redo2, Undo2 } from "lucide-react";
import { useSceneHistory } from "@/hooks/use-scene-history";
import { cn } from "@/lib/utils";

interface HistoryControlsProps {
  mode?: "desktop" | "mobile";
}

const DESKTOP_BUTTON_BASE =
  "inline-flex h-9 items-center gap-2 rounded-full border px-4 text-[11px] font-semibold tracking-[0.18em] uppercase transition";

const MOBILE_BUTTON_BASE =
  "inline-flex items-center justify-center rounded-2xl border px-3 py-3 text-center transition";

export default function HistoryControls({
  mode = "desktop",
}: HistoryControlsProps) {
  const { canRedo, canUndo, redo, undo } = useSceneHistory();

  const desktopButtonClass = (enabled: boolean) =>
    cn(
      DESKTOP_BUTTON_BASE,
      enabled
        ? "border-slate-700 bg-slate-900/75 text-slate-100 hover:border-sky-400/45 hover:bg-[#131926] hover:text-sky-100"
        : "cursor-not-allowed border-slate-800 bg-slate-900/35 text-slate-600",
    );

  const mobileButtonClass = (enabled: boolean) =>
    cn(
      MOBILE_BUTTON_BASE,
      enabled
        ? "border-slate-700 bg-[#171c25] text-slate-300 hover:border-slate-500 hover:bg-[#1c2330]"
        : "cursor-not-allowed border-slate-800 bg-[#131720] text-slate-600",
    );

  if (mode === "mobile") {
    return (
      <>
        <button
          type="button"
          onClick={undo}
          disabled={!canUndo}
          aria-label="Undo"
          title="Undo"
          className={mobileButtonClass(canUndo)}
        >
          <Undo2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={redo}
          disabled={!canRedo}
          aria-label="Redo"
          title="Redo"
          className={mobileButtonClass(canRedo)}
        >
          <Redo2 className="h-4 w-4" />
        </button>
      </>
    );
  }

  return (
    <div className="hidden items-center gap-2 xl:flex">
      <button
        type="button"
        onClick={undo}
        disabled={!canUndo}
        aria-label="Undo"
        className={desktopButtonClass(canUndo)}
      >
        <Undo2 className="h-4 w-4" />
        <span>Undo</span>
      </button>
      <button
        type="button"
        onClick={redo}
        disabled={!canRedo}
        aria-label="Redo"
        className={desktopButtonClass(canRedo)}
      >
        <Redo2 className="h-4 w-4" />
        <span>Redo</span>
      </button>
    </div>
  );

}
