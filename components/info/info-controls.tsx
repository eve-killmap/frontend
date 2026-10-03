import { Section } from "./info-common";
import { cn } from "@/lib/ui/cn";

interface PanelEntry {
  label: string;
  desc: string;
}

const MAP_PANELS: PanelEntry[] = [
  {
    label: "Search",
    desc: "Jump to any solar system by name; selecting one opens its 3D view",
  },
  {
    label: "Top Systems",
    desc: "The top 10 systems by kill volume, across day, week, month, 6 month, year, and all-time windows",
  },
  {
    label: "Leaderboards",
    desc: "Top characters, corporations, alliances, factions, ships, and weapons by kills or losses across the same windows, with or without NPCs; click an entry to filter the map by it",
  },
  {
    label: "Filter",
    desc: "Narrow the map by victim or attacker character, corporation, alliance, or faction, and by ship, weapon, or war",
  },
  {
    label: "Share",
    desc: "Create a link that reopens the map with your current filter, or export the view as a PNG",
  },
  {
    label: "Settings",
    desc: "Color mode, overlay (sovereignty or hot areas) and its opacity, point size, jump lines, labels, and the live kill feed",
  },
  {
    label: "Reset Camera",
    desc: "Return the map to its default position and zoom",
  },
  { label: "About", desc: "The page you are viewing right now" },
];

const SYSTEM_PANELS: PanelEntry[] = [
  {
    label: "Filter",
    desc: "Narrow kills by character, corporation, alliance, or faction, and by ship, weapon, or war, or to within range of a single object in the system",
  },
  {
    label: "Camera",
    desc: "Preset views: reset, side view (X/Z plane), and vertical view (top-down). Camera position persists across visits to the same system",
  },
  {
    label: "Playback",
    desc: "Replay kills chronologically with adjustable speed, visible time window, kill fade, and timeline scrubbing",
  },
  {
    label: "Settings",
    desc: "Kill colors, kill and cluster opacity, object visibility, rendering settings, and the live kill feed",
  },
  {
    label: "Stats",
    desc: "Monthly activity, timezone distribution, fleet size, top ship types, and recent kill lists (via zKillboard)",
  },
  {
    label: "Share",
    desc: "Create a link that reopens this system with your current view, settings, and filter, or export the view as a PNG and the filtered kills as a CSV",
  },
  { label: "About", desc: "The page you are viewing right now" },
];

function PanelList({ panels }: { panels: PanelEntry[] }) {
  return (
    <div className="grid md:grid-cols-2 gap-3">
      {panels.map(({ label, desc }) => (
        <div
          key={label}
          className="bg-panel-elevated border-l-2 border-capsuleer/40 px-3 py-2.5"
        >
          <div className="text-fg-secondary text-sm font-medium">{label}</div>
          <div className="text-fg-faint text-xs mt-0.5">{desc}</div>
        </div>
      ))}
    </div>
  );
}

export function ControlsTab() {
  return (
    <div className="space-y-8">
      <div className="grid md:grid-cols-2 gap-8">
        <Section title="Map View">
          <CtrlRow
            visual={
              <>
                <MouseIcon left />
                <span className="text-fg-faint text-xs">Left drag</span>
              </>
            }
            label="Pan the map"
          />
          <CtrlRow
            visual={
              <>
                <MouseIcon wheel />
                <span className="text-fg-faint text-xs">Scroll</span>
              </>
            }
            label="Zoom in / out"
          />
          <CtrlRow
            visual={
              <>
                <MouseIcon left />
                <span className="text-fg-faint text-xs">Click system</span>
              </>
            }
            label="Open that system's 3D kill view"
          />
        </Section>

        <Section title="System View (Mouse)">
          <CtrlRow
            visual={
              <>
                <MouseIcon left />
                <span className="text-fg-faint text-xs">Left drag</span>
              </>
            }
            label="Orbit camera around the system"
          />
          <CtrlRow
            visual={
              <>
                <MouseIcon right />
                <span className="text-fg-faint text-xs">Right drag</span>
              </>
            }
            label="Pan / strafe camera"
          />
          <CtrlRow
            visual={
              <>
                <MouseIcon wheel />
                <span className="text-fg-faint text-xs">Scroll</span>
              </>
            }
            label="Zoom in / out"
          />
          <CtrlRow
            visual={
              <>
                <MouseIcon left />
                <span className="text-fg-faint text-xs">Hover kill</span>
              </>
            }
            label="Show kill details card"
          />
        </Section>
      </div>

      <Section title="System View (Keyboard)">
        <div className="grid md:grid-cols-2 gap-x-8">
          <div>
            <CtrlRow
              visual={
                <>
                  <Key>W</Key>
                  <span className="text-fg-subtle text-xs mx-1">/</span>
                  <Key>↑</Key>
                </>
              }
              label="Pan forward"
            />
            <CtrlRow
              visual={
                <>
                  <Key>S</Key>
                  <span className="text-fg-subtle text-xs mx-1">/</span>
                  <Key>↓</Key>
                </>
              }
              label="Pan backward"
            />
          </div>
          <div>
            <CtrlRow
              visual={
                <>
                  <Key>A</Key>
                  <span className="text-fg-subtle text-xs mx-1">/</span>
                  <Key>←</Key>
                </>
              }
              label="Pan left"
            />
            <CtrlRow
              visual={
                <>
                  <Key>D</Key>
                  <span className="text-fg-subtle text-xs mx-1">/</span>
                  <Key>→</Key>
                </>
              }
              label="Pan right"
            />
          </div>
        </div>
        <p className="text-fg-subtle text-xs mt-2 italic">
          Pan speed scales with zoom distance. Keys are ignored when focus is in
          an input field.
        </p>
      </Section>

      <Section title="Command Palette">
        <div className="grid md:grid-cols-2 gap-x-8">
          <div>
            <CtrlRow
              visual={
                <>
                  <Key wide>Ctrl</Key>
                  <span className="text-fg-subtle text-xs mx-1">/</span>
                  <Key>⌘</Key>
                  <span className="text-fg-subtle text-xs mx-1">+</span>
                  <Key>K</Key>
                </>
              }
              label="Open or close the palette"
            />
            <CtrlRow
              visual={
                <>
                  <Key>↑</Key>
                  <Key>↓</Key>
                </>
              }
              label="Move between rows"
            />
          </div>
          <div>
            <CtrlRow visual={<Key wide>↵</Key>} label="Run the selected row" />
            <CtrlRow visual={<Key wide>Esc</Key>} label="Close the palette" />
          </div>
        </div>
        <p className="text-fg-subtle text-xs mt-2 italic">
          Jump to any system, switch maps, change colour mode or overlay, run
          camera presets, toggle playback and settings, or open any panel on the
          current page. Rows show the current state where it applies.
        </p>
      </Section>

      <Section title="Map View Panels">
        <PanelList panels={MAP_PANELS} />
        <p className="text-fg-subtle text-xs mt-2 italic">
          Two toggles sit beside the map links: 2D / 3D layout (New Eden) and
          the Triglavian font (Abyssal Deadspace). Overlays live in Settings.
        </p>
      </Section>

      <Section title="System View Panels">
        <PanelList panels={SYSTEM_PANELS} />
      </Section>
    </div>
  );
}

function MouseIcon({
  left,
  right,
  wheel,
}: {
  left?: boolean;
  right?: boolean;
  wheel?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 24 36"
      width="20"
      height="30"
      fill="none"
      className="shrink-0"
    >
      <rect
        x="2"
        y="8"
        width="20"
        height="26"
        rx="10"
        stroke="rgba(255,255,255,0.3)"
        strokeWidth="1.5"
      />
      <path
        d="M2 22 L2 15 Q2 8 12 8 L12 22 Z"
        fill={left ? "rgba(192,138,30,0.5)" : "rgba(255,255,255,0.05)"}
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="1"
      />
      <path
        d="M22 22 L22 15 Q22 8 12 8 L12 22 Z"
        fill={right ? "rgba(192,138,30,0.5)" : "rgba(255,255,255,0.02)"}
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="1"
      />
      <line
        x1="12"
        y1="8"
        x2="12"
        y2="22"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="1"
      />
      <rect
        x="9"
        y="11"
        width="6"
        height="9"
        rx="3"
        fill={wheel ? "rgba(56,182,255,0.65)" : "rgba(255,255,255,0.14)"}
        stroke="rgba(255,255,255,0.25)"
        strokeWidth="0.75"
      />
    </svg>
  );
}

function Key({
  children,
  wide,
}: {
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center border border-border bg-panel-elevated text-fg-strong text-2xs font-mono min-h-5 px-1.5 select-none",
        wide ? "min-w-12" : "min-w-5",
      )}
      style={{
        boxShadow:
          "0 1px 2px rgba(0,0,0,0.5), inset 0 -1px 0 rgba(255,255,255,0.05)",
      }}
    >
      {children}
    </span>
  );
}

function CtrlRow({
  visual,
  label,
}: {
  visual: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex items-center gap-4 py-1.5 border-b border-border/20 last:border-0">
      <div className="flex items-center gap-1.5 w-44 shrink-0">{visual}</div>
      <span className="text-fg-muted text-sm">{label}</span>
    </div>
  );
}
