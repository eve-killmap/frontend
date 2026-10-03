import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import { resetCameraFn } from "@/lib/camera-functions";

export function ResetCamera() {
  return (
    <Button
      variant="outline"
      size="lg"
      onClick={() => resetCameraFn?.()}
      className="btn-glass"
      title="Reset Camera"
    >
      <RotateCcw />
      <span className="btn-label">Reset Camera</span>
    </Button>
  );
}
