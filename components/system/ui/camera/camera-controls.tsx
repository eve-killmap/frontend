import React from "react";
import { RotateCcw, MoveHorizontal, MoveVertical, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  resetCameraFn,
  horizCameraFn,
  vertCameraFn,
} from "@/lib/camera-functions";
import { useDismissablePanel } from "@/hooks/use-dismissable-panel";

interface CameraControlsProps {
  open: boolean;
  onToggle: () => void;
}

export const CameraControls = React.memo(function CameraControls({
  open,
  onToggle,
}: CameraControlsProps) {
  const ref = useDismissablePanel(open, onToggle);

  return (
    <div ref={ref} className="relative pointer-events-auto">
      <Button
        variant="outline"
        size="lg"
        onClick={onToggle}
        aria-expanded={open}
        className="btn-glass"
        title="Camera"
      >
        <Camera />
        <span className="btn-label">Camera</span>
      </Button>
      <div
        className={`flex items-center gap-2 absolute top-full left-1/2 mt-2 -translate-x-1/2 max-w-[calc(100vw-2rem)] flex-wrap ${open ? "" : "hidden"}`}
      >
        <Button
          variant="outline"
          size="lg"
          onClick={() => {
            resetCameraFn?.();
            onToggle();
          }}
          className="btn-glass"
        >
          <RotateCcw />
          Reset Camera
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={() => {
            horizCameraFn?.();
            onToggle();
          }}
          className="btn-glass"
        >
          <MoveHorizontal />
          Side View
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={() => {
            vertCameraFn?.();
            onToggle();
          }}
          className="btn-glass"
        >
          <MoveVertical />
          Vertical View
        </Button>
      </div>
    </div>
  );
});
