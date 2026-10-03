import { Switch } from "@/components/ui/switch";
import { useGlobalSettingsStore } from "@/stores/global-settings-store";

export function TriglavianFontToggle() {
  const triglavianFont = useGlobalSettingsStore((s) => s.triglavianFont);
  const setTriglavianFont = useGlobalSettingsStore((s) => s.setTriglavianFont);

  return (
    <div className="flex items-center gap-2 px-3 select-none whitespace-nowrap">
      <span
        className={`text-xs font-mono ${!triglavianFont ? "text-capsuleer" : "text-fg-muted"}`}
      >
        Latin Font
      </span>
      <Switch
        checked={triglavianFont}
        onCheckedChange={setTriglavianFont}
        className="cursor-pointer"
        aria-label="Toggle Triglavian font"
      />
      <span
        className={`text-xs font-mono ${triglavianFont ? "text-capsuleer" : "text-fg-muted"}`}
      >
        Trig Font
      </span>
    </div>
  );
}
