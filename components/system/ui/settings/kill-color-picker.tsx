import React, { CSSProperties, useEffect, useState } from "react";
import { Sketch, hexToHsva, HsvaColor } from "@uiw/react-color";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { KILL_COLOR_PRESETS } from "@/lib/system/kill-color-presets";
import { useFrameCoalesced } from "@/hooks/use-frame-coalesced";

const PICKER_WIDTH = 220;

const SKETCH_STYLE = {
  "--sketch-background": "var(--color-panel)",
  "--sketch-box-shadow": "none",
  "--sketch-swatch-border-top": "1px solid var(--border)",
  "--sketch-swatch-box-shadow": "0 0 0 1px rgba(255,255,255,0.12) inset",
  borderRadius: 0,
} as CSSProperties;

interface KillColorPickerProps {
  color: string;
  onChange: (hex: string) => void;
  enabled: boolean;
  children: React.ReactElement;
}

export function KillColorPicker({
  color,
  onChange,
  enabled,
  children,
}: KillColorPickerProps) {
  const [open, setOpen] = useState(false);
  const [hsva, setHsva] = useState<HsvaColor>(() => hexToHsva(color));
  useEffect(() => {
    if (!enabled) setOpen(false);
  }, [enabled]);

  const push = useFrameCoalesced(onChange);

  const onOpenChange = (next: boolean) => {
    if (next) setHsva(hexToHsva(color));
    setOpen(next);
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 bg-panel border-border"
        side="right"
        align="start"
        hideWhenDetached
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Sketch
          color={hsva}
          presetColors={KILL_COLOR_PRESETS as string[]}
          disableAlpha
          width={PICKER_WIDTH}
          style={SKETCH_STYLE}
          onChange={(c) => {
            setHsva(c.hsva);
            push(c.hex.toLowerCase());
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
