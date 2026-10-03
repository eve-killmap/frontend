import { useEffect, useMemo, useRef, useState } from "react";

const C = {
  slate: "#7c8b99",
  violet: "#8b5cf6",
  amber: "#d97706",
  yellow: "#ca8a04",
  emerald: "#059669",
  cyan: "#0891b2",
  rose: "#f43f5e",
} as const;

type Color = keyof typeof C;
type Kind = "live" | "static" | "read" | "ops";

const LT: Record<Color, string> = {
  slate: "#a8b6c2",
  violet: "#b49bfb",
  amber: "#f0b429",
  yellow: "#e5c235",
  emerald: "#3fbd8a",
  cyan: "#31c3dc",
  rose: "#fb7185",
};

const KIND: Record<Kind, { color: string; marker: string; label: string }> = {
  live: { color: "#a78bfa", marker: "url(#t-live)", label: "Live kill path" },
  static: {
    color: "#fb7185",
    marker: "url(#t-static)",
    label: "Static SDE path",
  },
  read: {
    color: "#34d399",
    marker: "url(#t-read)",
    label: "Read path (API → client)",
  },
  ops: {
    color: "#8b9bab",
    marker: "url(#t-ops)",
    label: "Maintenance · schedulers",
  },
};

const CANVAS_BG = "#0e1a24";
const FONT_UI = "var(--font-condensed), sans-serif";
const FONT_MONO = "var(--font-space-mono), monospace";

const LANES = [
  { x: 32, w: 224, label: "Sources" },
  { x: 412, w: 496, label: "Pipelines" },
  { x: 1124, w: 600, label: "Stores" },
  { x: 1900, w: 660, label: "API · WebSocket" },
  { x: 2716, w: 620, label: "Client" },
];
const CANVAS_W = 3368;

type Group = { id: string; label?: string; nodes: [string, string][] };
type BandSpec = {
  id: string;
  lane: number;
  track: "live" | "static" | "span" | "ops";
  title: string;
  sub?: string;
  color: Color;
  kind: Kind;
  cols: number;
  dashed?: boolean;
  full?: boolean;
  groups: Group[];
};

const BANDS: BandSpec[] = [
  {
    id: "SRC",
    lane: 0,
    track: "live",
    title: "External sources",
    color: "slate",
    kind: "live",
    cols: 1,
    groups: [
      {
        id: "src.live",
        label: "upstream feeds",
        nodes: [
          ["zkb", "zKB R2Z2 feed"],
          ["zkbh", "zKB daily history"],
          ["esi", "EVE ESI"],
        ],
      },
    ],
  },
  {
    id: "SDESRC",
    lane: 0,
    track: "static",
    title: "Static source",
    color: "slate",
    kind: "static",
    cols: 1,
    groups: [
      {
        id: "src.sde",
        label: "ccp export",
        nodes: [
          ["sde", "CCP SDE build"],
          ["sdestatic", "client-extracted static"],
        ],
      },
    ],
  },
  {
    id: "ING",
    lane: 1,
    track: "live",
    title: "Kill Ingestor",
    sub: "process-kills · always-on asyncio",
    color: "violet",
    kind: "live",
    cols: 2,
    groups: [
      {
        id: "ing.tasks",
        label: "concurrent tasks",
        nodes: [
          ["live", "live_listener"],
          ["xcheck", "crosscheck"],
          ["resolve", "entity_backlog"],
          ["warsch", "war_scheduler"],
          ["facsch", "faction_scheduler"],
          ["corpsch", "corporation_refresh"],
          ["hbsch", "heartbeat"],
        ],
      },
      {
        id: "ing.mv",
        label: "rollups · leaderboards · view refresh",
        nodes: [
          ["mvfast", "fast_refresh · 30 min"],
          ["mvslow", "slow_refresh · daily"],
          ["rollup", "rollups.py · dirty UTC days"],
          ["lboard", "leaderboard.py · top 50 · all | players"],
        ],
      },
      {
        id: "ing.infra",
        label: "shared infrastructure",
        nodes: [
          ["esicl", "esi.py · token bucket · 3-tier queue"],
          ["dbpy", "db.py · idempotent · schema.sql"],
          ["zkbpy", "zkb.py · parse_zkb"],
          ["strm", "stream.py"],
          ["metr", "metrics.py"],
          ["cfg", "config.py"],
        ],
      },
    ],
  },
  {
    id: "SDEP",
    lane: 1,
    track: "static",
    title: "SDE Pipeline",
    sub: "process-sde · offline run",
    color: "violet",
    kind: "static",
    cols: 2,
    groups: [
      {
        id: "sdep.stages",
        label: "stages",
        nodes: [
          ["fetch", "fetch_sde.py"],
          ["sdeload", "sde.py load"],
          ["proc", "process.py"],
        ],
      },
      {
        id: "sdep.gen",
        label: "generators",
        nodes: [
          ["gmap", "generate_map.py"],
          ["gsys", "generate_system.py"],
          ["gtype", "generate_type_data.py"],
          ["gslug", "slug_index.py"],
          ["gsysidx", "systems_index.py"],
        ],
      },
      {
        id: "sdep.out",
        label: "outputs",
        nodes: [
          ["o1", "New Eden 2D + 3D"],
          ["oanok", "Anoikis map · wormhole class + effect"],
          ["oabys", "Abyssal · Tutorials maps"],
          ["o2", "system/<id>.json · wormhole data"],
          ["o3", "slug + systems idx"],
          ["o4", "type/*.json · published only"],
          ["o5", "locales/*"],
          ["o6", "brotli .br siblings"],
        ],
      },
    ],
  },
  {
    id: "PG",
    lane: 2,
    track: "live",
    title: "PostgreSQL",
    sub: "shared kills DB · 5 materialized views",
    color: "amber",
    kind: "live",
    cols: 3,
    groups: [
      {
        id: "pg.kills",
        label: "kill data",
        nodes: [
          ["kills", "kills"],
          ["katt", "kill_attackers"],
          ["knp", "kills_no_positions"],
          ["zkbmeta", "zkb_metadata"],
          ["types", "types · from process-sde"],
        ],
      },
      {
        id: "pg.ent",
        label: "entities · resolved at ingest",
        nodes: [
          ["chars", "characters"],
          ["corps", "corporations"],
          ["alli", "alliances"],
          ["facs", "factions"],
          ["wars", "wars"],
          ["backlog", "entity_resolve_backlog"],
        ],
      },
      {
        id: "pg.mv",
        label: "state · rollups · views",
        nodes: [
          ["pdata", "processed_data · table"],
          ["lstate", "live_state · table"],
          ["rstate", "rollup_state · watermark"],
          ["skd", "system_kills_daily"],
          ["ekd", "entity_kills_daily"],
          ["elb", "entity_leaderboard · kind × role × window × scope"],
          ["mvkps", "mv_kills_per_system · all-time"],
          ["mvfar", "mv_farthest_kill_per_system"],
          ["mvamc", "mv_alliance_member_count"],
        ],
      },
      {
        id: "pg.facets",
        label: "faceted filtering & search",
        nodes: [
          ["kfacets", "kill_facets · inverted index"],
          ["trgm", "pg_trgm name/ticker idx"],
          ["mvship", "mv_ship_search"],
          ["mvweap", "mv_weapon_search"],
        ],
      },
    ],
  },
  {
    id: "REDIS",
    lane: 2,
    track: "live",
    title: "Redis",
    sub: "stream + cache",
    color: "yellow",
    kind: "live",
    cols: 3,
    groups: [
      {
        id: "redis.stream",
        label: "stream",
        nodes: [["rlive", "kills:live stream"]],
      },
      {
        id: "redis.cache",
        label: "cache · pub/sub",
        nodes: [
          ["rcache", "query + binary cache"],
          ["rinval", "cache:invalidate"],
        ],
      },
    ],
  },
  {
    id: "NGX",
    lane: 2,
    track: "static",
    title: "nginx",
    sub: "static host + edge proxy",
    color: "rose",
    kind: "static",
    cols: 3,
    groups: [
      {
        id: "ngx.static",
        label: "served static",
        nodes: [
          ["nsys", "system/<id>.json"],
          ["nuni", "universe · 4 map families"],
          ["ncon", "constellations"],
          ["nreg", "regions"],
          ["nslug", "slug + systems idx"],
          ["ntype", "type/*.json"],
          ["nloc", "locales/*"],
          ["nbundle", "app bundle"],
        ],
      },
      {
        id: "ngx.edge",
        label: "edge",
        nodes: [
          ["nproxy", "reverse proxy → FastAPI"],
          ["nbr", "brotli_static · gzip · ETag"],
        ],
      },
    ],
  },
  {
    id: "API",
    lane: 3,
    track: "live",
    title: "FastAPI Backend",
    sub: "uvicorn workers · read-only",
    color: "emerald",
    kind: "read",
    cols: 3,
    groups: [
      {
        id: "api.kills",
        label: "kill endpoints",
        nodes: [
          ["epbin", "/systems/{id}/kills"],
          ["epraw", "/kills/details/raw"],
          ["epproc", "/kills/details/processed"],
        ],
      },
      {
        id: "api.stats",
        label: "stats · universe · sovereignty",
        nodes: [
          ["eprank", "/stats/system-rankings"],
          ["eplb", "/stats/leaderboards · window · role · scope"],
          ["ephist", "/stats/global-kills histogram"],
          ["epcomp", "computed_at on rollup reads"],
          ["epfar", "/systems/{id}/farthest_kill"],
          ["epnames", "POST /universe/names"],
          ["epsov", "/systems/{id}/sov · ADM"],
          ["epsovmap", "/universe/sov map"],
        ],
      },
      {
        id: "api.filter",
        label: "filtering · autocomplete · wars",
        nodes: [
          ["epsk", "/stats/system-kills?f="],
          ["epfil", "/systems/{id}/kills/filtered"],
          ["epauto", "/autocomplete/* · entities·types·ships·weapons"],
          ["epwars", "/wars/search · /wars/details"],
        ],
      },
      {
        id: "api.ws",
        label: "live websocket",
        nodes: [
          ["bcast", "broadcaster · leader · sov refresh"],
          ["wsg", "/ws/global/kills"],
          ["wss", "/ws/systems/{id}/kills"],
          ["wspay", "payload · faction · facet ids · zkb"],
        ],
      },
      {
        id: "api.cache",
        label: "caching & edge",
        nodes: [
          ["qcache", "query + binary cache"],
          ["sflight", "single-flight"],
          ["cwarm", "cache warming · leader · rankings · boards"],
          ["etag", "weak ETag · Cache-Control · Vary"],
          ["apinval", "invalidation subscriber"],
          ["health", "/health · /health/detail"],
          ["enc", "binary_encoder · numpy · compression"],
        ],
      },
    ],
  },
  {
    id: "FE",
    lane: 4,
    track: "span",
    title: "Frontend",
    sub: "Vite · React Router · React Three Fiber",
    color: "cyan",
    kind: "read",
    cols: 3,
    groups: [
      {
        id: "fe.static",
        label: "built from static files",
        nodes: [
          ["fscene", "scene graph · LOD celestials"],
          ["fmap", "Map view · 2D/3D morph"],
          ["froute", "routing · search"],
          ["ffilt", "filters · brackets"],
          ["flab", "labels"],
        ],
      },
      {
        id: "fe.api",
        label: "built from api responses",
        nodes: [
          ["fdec", "binary decoder"],
          ["foct", "octree"],
          ["ftrav", "traverser"],
          ["finst", "instances · clusters · labels"],
          ["ffeed", "kill-feed store"],
          ["fflash", "feed · flashes"],
          ["fhover", "hover card"],
          ["frank", "rank UI · header · camera fit"],
          ["flb", "leaderboards dialog → filter"],
          ["fbuild", "filter builder · war browser"],
          ["fshare", "shareable ?f= links"],
        ],
      },
      {
        id: "fe.shared",
        label: "shared systems",
        nodes: [
          ["forig", "floating-origin"],
          ["fplay", "playback"],
          ["fstore", "Zustand stores"],
        ],
      },
    ],
  },
  {
    id: "OPS",
    lane: 0,
    track: "ops",
    title: "Operational",
    sub: "all services",
    color: "slate",
    kind: "ops",
    cols: 5,
    dashed: true,
    full: true,
    groups: [
      {
        id: "ops.all",
        nodes: [
          ["ops1", "YAML config precedence"],
          ["ops2", "input caps · WS origin allow-list"],
          ["ops3", "health · liveness · leader election"],
          ["ops4", "backfill.py · entities_backfill.py"],
          ["ops5", "Prometheus eve_killmap_*"],
        ],
      },
    ],
  },
];

type TrunkSpec = [string, string, Kind, string, 1?];

export const TRUNKS: TrunkSpec[] = [
  ["src.live", "ing.tasks", "live", "R2Z2 wss feed", 1],
  ["ing.tasks", "pg.kills", "live", "SQL INSERT · ON CONFLICT", 1],
  ["ing.tasks", "pg.ent", "live", "ESI names at ingest"],
  ["ing.tasks", "pg.facets", "live", "facet rows per kill"],
  ["ing.tasks", "redis.stream", "live", "XADD kills:live", 1],
  ["ing.mv", "pg.mv", "ops", "rollups · boards · REFRESH MV"],
  ["ing.mv", "redis.cache", "ops", "PUBLISH cache:invalidate"],
  ["src.sde", "sdep.stages", "static", "latest build"],
  ["sdep.out", "ngx.static", "static", "JSON + .br"],
  ["sdep.gen", "pg.kills", "static", "upsert type metadata"],
  ["pg.kills", "api.kills", "read", "SELECT → binary", 1],
  ["pg.ent", "api.kills", "read", "enrich processed details"],
  ["pg.mv", "api.stats", "read", "rankings · boards · histogram"],
  ["pg.ent", "api.stats", "read", "board names"],
  ["pg.facets", "api.filter", "read", "f= DSL · trigram"],
  ["redis.stream", "api.ws", "read", "XREAD BLOCK", 1],
  ["redis.cache", "api.cache", "read", "cache hit · SUBSCRIBE"],
  ["src.live", "api.stats", "read", "ESI sovereignty (leader)"],
  ["api.kills", "fe.api", "read", "binary payload", 1],
  ["api.ws", "fe.api", "read", "live WS fan-out", 1],
  ["api.stats", "fe.api", "read", "JSON · computed_at"],
  ["api.filter", "fe.api", "read", "filters · autocomplete"],
  ["ngx.static", "fe.static", "static", "app bundle · universe JSON", 1],
];

const ARROW_PAD = 16;
const OFF_LINE = 12;
const MIN_SLACK = 6;

const TIGHTEN = { ov: 2, detail: 1.5 } as const;
const spaces = (s: string) => (s.match(/ /g) || []).length;

type LabelBox = { x: number; y: number; w: number; h?: number };

type Placeable = {
  label: string;
  vert: [number, number, number] | null;
  xy: number;
  xFrom: number;
  xTo: number;
  ey: number;
  eLeft: number;
  eRight: number;
  rotated?: boolean;
  lw: number;
  lbx: number;
  ly: number;
  rx: number;
  ry: number;
};

function placeLabels(
  trunks: Placeable[],
  boxes: LabelBox[],
  cfg: {
    width: (label: string) => number;
    rowH: number;
    step: number;
    minVert: number;
  },
) {
  trunks.forEach((t) => {
    const w = cfg.width(t.label);
    if (t.vert && t.vert[2] >= Math.max(cfg.minVert, w * 0.55)) {
      t.rotated = true;
      t.lw = w;
      t.rx = t.vert[0];
      t.ry = t.vert[1];
      boxes.push({ x: t.rx - 8, y: t.ry, w: 16, h: w });
    }
  });

  trunks
    .filter((t) => !t.rotated)
    .sort((p, q) => p.ey - q.ey)
    .forEach((t) => {
      const w = cfg.width(t.label);
      const overlap = (x: number, y: number) =>
        boxes.reduce((sum, b) => {
          const bh = b.h || cfg.rowH;
          const ox = Math.min(x + w, b.x + b.w + 6) - Math.max(x, b.x - 6);
          const oy =
            Math.min(y + cfg.rowH / 2, b.y + bh / 2) -
            Math.max(y - cfg.rowH / 2, b.y - bh / 2);
          return ox > 0 && oy > 0 ? sum + ox * oy : sum;
        }, 0);

      const runs =
        t.xy === t.ey
          ? [{ y: t.xy, x0: t.xFrom, x1: t.eRight, cap: t.eRight - ARROW_PAD }]
          : [
              { y: t.xy, x0: t.xFrom, x1: t.xTo, cap: t.xTo },
              {
                y: t.ey,
                x0: t.eLeft,
                x1: t.eRight,
                cap: t.eRight - ARROW_PAD,
              },
            ];
      const middle = (r: (typeof runs)[0]) =>
        Math.max(r.x0, Math.min(r.x0 + (r.x1 - r.x0 - w) / 2, r.cap - w));
      runs.sort((p, q) => q.cap - q.x0 - (p.cap - p.x0));

      const ranked: { x: number; y: number; d: number }[] = [];
      runs.forEach((r, i) => {
        const room = r.cap - r.x0 - w;
        if (room < MIN_SLACK) return;
        const mid = middle(r);
        for (let d = 0; d <= room + cfg.step; d += cfg.step) {
          for (const x of d ? [mid - d, mid + d] : [mid]) {
            if (x >= r.x0 && x <= r.cap - w)
              ranked.push({ x, y: r.y, d: d + i });
          }
        }
      });
      ranked.sort((p, q) => p.d - q.d);
      const cands: [number, number][] = ranked.map((c) => [c.x, c.y]);

      const wide = runs[0];
      const away = (wide.y === t.xy ? t.ey : t.xy) > wide.y ? -1 : 1;
      const beside = (t.xFrom + t.eRight - w) / 2;
      for (const k of [1, 2])
        cands.push(
          [beside, wide.y + away * OFF_LINE * k],
          [beside, wide.y - away * OFF_LINE * k],
        );
      cands.push([middle(wide), wide.y]);

      let [x, y] = cands[cands.length - 1];
      let least = Infinity;
      for (const [cx, cy] of cands) {
        const over = overlap(cx, cy);
        if (over < least) {
          least = over;
          x = cx;
          y = cy;
          if (over === 0) break;
        }
      }
      t.lbx = x;
      t.ly = y;
      t.lw = w;
      boxes.push({ x, y, w, h: cfg.rowH });
    });
}

const OV_LANES = [
  { x: 10, w: 126, label: "Sources" },
  { x: 246, w: 142, label: "Pipelines" },
  { x: 498, w: 132, label: "Stores" },
  { x: 740, w: 134, label: "API · WS" },
  { x: 984, w: 126, label: "Client" },
];
const OV_W = 1120,
  OV_H = 342;

const OV_BOXES: [string, number, number, string, string, Color][] = [
  ["zkb", 0, 32, "zKillboard", "R2Z2 feed", "slate"],
  ["esi", 0, 142, "EVE ESI", "killmails", "slate"],
  ["sde", 0, 264, "CCP SDE", "static export", "slate"],
  ["ingest", 1, 80, "Kill Ingestor", "always-on", "violet"],
  ["sdep", 1, 264, "SDE Parser", "process SDE data", "violet"],
  ["pg", 2, 54, "PostgreSQL", "kills · entities", "amber"],
  ["redis", 2, 126, "Redis", "stream · cache", "yellow"],
  ["ngx", 2, 252, "nginx", "edge proxy", "rose"],
  ["api", 3, 90, "FastAPI", "REST · WebSocket", "emerald"],
  ["fe", 4, 96, "Frontend", "React · R3F", "cyan"],
];

const OV_TRUNKS: [string, string, Kind, string, 1?][] = [
  ["zkb", "ingest", "live", "R2Z2", 1],
  ["esi", "ingest", "live", "ESI"],
  ["sde", "sdep", "static", "SDE"],
  ["ingest", "pg", "live", "kills", 1],
  ["ingest", "redis", "live", "XADD", 1],
  ["sdep", "pg", "static", "types"],
  ["sdep", "ngx", "static", "JSON + .br"],
  ["pg", "api", "read", "read", 1],
  ["redis", "api", "read", "stream", 1],
  ["api", "fe", "read", "REST + WS", 1],
  ["ngx", "fe", "static", "app bundle", 1],
];

type OvNode = {
  id: string;
  lane: number;
  title: string;
  sub: string;
  color: Color;
  x: number;
  y: number;
  w: number;
  h: number;
  cy: number;
  left: number;
  right: number;
  titleSize: number;
  subSize: number;
};
type OvTrunk = {
  a: string;
  b: string;
  kind: Kind;
  label: string;
  flow: boolean;
  id: number;
  d: string;
  vert: [number, number, number];
  xy: number;
  xFrom: number;
  xTo: number;
  ey: number;
  eLeft: number;
  eRight: number;
  rotated?: boolean;
  lw: number;
  lbx: number;
  ly: number;
  rx: number;
  ry: number;
};

function buildOverview() {
  const nodes: Record<string, OvNode> = {};
  OV_BOXES.forEach(([id, lane, y, title, sub, color]) => {
    const L = OV_LANES[lane];
    const inner = L.w - 20;
    const fit = (s: string, size: number, per: number) =>
      Math.min(size, (inner / (s.length * per)) * size);
    nodes[id] = {
      id,
      lane,
      title,
      sub,
      color,
      x: L.x,
      y,
      w: L.w,
      h: 54,
      cy: y + 27,
      left: L.x,
      right: L.x + L.w,
      titleSize: fit(title, 17, 8.2),
      subSize: fit(sub, 11.5, 6.9),
    };
  });

  const raw = OV_TRUNKS.map(([a, b, kind, label, flow], i) => ({
    a,
    b,
    kind,
    label,
    flow: !!flow,
    id: i,
    A: nodes[a],
    B: nodes[b],
    skip: nodes[b].lane - nodes[a].lane,
  }));

  const port: Record<number, { out?: number; in?: number }> = {};
  const fan = (
    key: "out" | "in",
    list: typeof raw,
    sortKey: (p: (typeof raw)[0], q: (typeof raw)[0]) => number,
  ) => {
    list.sort(sortKey).forEach((t, k) => {
      const gr = key === "out" ? t.A : t.B;
      const spread =
        list.length > 1 ? Math.max(20, (gr.h - 14) / (list.length - 1)) : 0;
      (port[t.id] ||= {})[key] = Math.round(
        gr.cy + (k - (list.length - 1) / 2) * spread,
      );
    });
  };
  const outs: Record<string, typeof raw> = {},
    ins: Record<string, typeof raw> = {};
  raw.forEach((t) => {
    (outs[t.a] ||= []).push(t);
    (ins[t.b] ||= []).push(t);
  });
  Object.values(outs).forEach((l) => fan("out", l, (p, q) => p.B.cy - q.B.cy));
  Object.values(ins).forEach((l) => fan("in", l, (p, q) => p.A.cy - q.A.cy));

  const corridor = (li: number) => ({
    a: OV_LANES[li].x + OV_LANES[li].w,
    b: OV_LANES[li + 1].x,
  });
  const reqs: Record<number, typeof raw> = {};
  raw.forEach((t) => {
    (reqs[t.skip === 1 ? t.A.lane : t.B.lane - 1] ||= []).push(t);
  });
  const chanX: Record<number, number> = {};
  Object.keys(reqs).forEach((k) => {
    const co = corridor(+k);
    const list = reqs[+k].sort((p, q) => port[p.id].out! - port[q.id].out!);
    const step =
      list.length > 1
        ? Math.min(18, (co.b - co.a - 30) / (list.length - 1))
        : 0;
    list.forEach((t, i) => {
      chanX[t.id] = Math.round(co.a + 14 + i * step);
    });
  });

  const trunks: OvTrunk[] = raw.map((t) => {
    const y1 = port[t.id].out!,
      y2 = port[t.id].in!,
      mx = chanX[t.id];
    return {
      ...t,
      d: `M${t.A.right} ${y1} H${mx} V${y2} H${t.B.left - 3}`,
      vert: [mx, (y1 + y2) / 2, Math.abs(y2 - y1)],
      xy: y1,
      xFrom: t.A.right + 5,
      xTo: mx - 4,
      ey: y2,
      eLeft: mx + 4,
      eRight: t.B.left - 3,
      lw: 0,
      lbx: 0,
      ly: 0,
      rx: 0,
      ry: 0,
    };
  });

  const obstacles: LabelBox[] = Object.values(nodes).map((n) => ({
    x: n.x,
    y: n.cy,
    w: n.w,
    h: n.h,
  }));
  placeLabels(trunks, obstacles, {
    width: (s) => s.length * 7.1 + 10 - spaces(s) * TIGHTEN.ov,
    rowH: 17,
    step: 10,
    minVert: 58,
  });

  const up: Record<string, string[]> = {},
    down: Record<string, string[]> = {};
  trunks.forEach((t) => {
    (down[t.a] ||= []).push(t.b);
    (up[t.b] ||= []).push(t.a);
  });

  return { nodes, trunks, up, down };
}

export function StackOverviewDiagram() {
  const g = useMemo(buildOverview, []);
  const [hover, setHover] = useState<string | null>(null);
  const [off, setOff] = useState<Partial<Record<Kind, boolean>>>({});
  const [playing, setPlaying] = useState(true);

  const hot = useMemo(() => {
    if (!hover) return null;
    const set = new Set<string>([hover]);
    const walk = (m: Record<string, string[]>, k: string) =>
      (m[k] || []).forEach((n) => {
        if (!set.has(n)) {
          set.add(n);
          walk(m, n);
        }
      });
    walk(g.up, hover);
    walk(g.down, hover);
    return set;
  }, [hover, g]);

  const on = (k: Kind) => !off[k];

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        {(Object.keys(KIND) as Kind[]).map((k) => (
          <button
            key={k}
            type="button"
            aria-pressed={on(k)}
            onClick={() => setOff((o) => ({ ...o, [k]: !o[k] }))}
            className={`flex cursor-pointer items-center gap-1.5 border px-2.5 py-1 text-2xs transition-colors ${
              on(k) ? "text-fg-strong" : "text-fg-faint border-border"
            }`}
            style={
              on(k)
                ? {
                    borderColor: `${KIND[k].color}66`,
                    background: `${KIND[k].color}1a`,
                  }
                : undefined
            }
          >
            <span className="size-2.5" style={{ background: KIND[k].color }} />
            {KIND[k].label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          className="text-fg-faint hover:text-capsuleer border-border hover:border-capsuleer/50 cursor-pointer border px-2.5 py-1 text-2xs transition-colors"
        >
          {playing ? "Pause flow" : "Play flow"}
        </button>
      </div>

      <div className="border-border bg-panel border p-0.5">
        <svg
          viewBox={`0 0 ${OV_W} ${OV_H}`}
          role="img"
          aria-label="EVE Killmap stack overview: sources, pipelines, stores, API and client, with the data flow between them"
          className="block h-auto w-full"
          style={{ fontFamily: FONT_UI }}
        >
          <defs>
            {(Object.keys(KIND) as Kind[]).map((k) => (
              <marker
                key={k}
                id={`ov-${k}`}
                markerWidth="8"
                markerHeight="8"
                refX="6.2"
                refY="3"
                orient="auto"
              >
                <path d="M0,0 L6.4,3 L0,6 Z" fill={KIND[k].color} />
              </marker>
            ))}
          </defs>

          {OV_LANES.map((l) => (
            <g key={l.label}>
              <text
                x={l.x}
                y={18}
                fontSize={10}
                fontWeight={600}
                letterSpacing="2.4"
                fill="#7d8e9c"
              >
                {l.label.toUpperCase()}
              </text>
              <rect x={l.x} y={24} width={l.w} height={2} fill="#28404f" />
            </g>
          ))}

          {g.trunks.map((t) => {
            const visible = on(t.kind);
            const isHot = !!hot && hot.has(t.a) && hot.has(t.b);
            return (
              <g key={t.id}>
                <path
                  d={t.d}
                  fill="none"
                  stroke={KIND[t.kind].color}
                  strokeWidth={isHot ? 2.6 : 1.8}
                  strokeLinejoin="round"
                  markerEnd={`url(#ov-${t.kind})`}
                  opacity={!visible ? 0.05 : hot ? (isHot ? 1 : 0.07) : 0.75}
                />
                {t.flow && playing && visible && (
                  <rect
                    x={-2.5}
                    y={-2.5}
                    width={5}
                    height={5}
                    fill={KIND[t.kind].color}
                    opacity={0}
                  >
                    <set
                      attributeName="opacity"
                      to={String(hot ? (isHot ? 1 : 0.08) : 0.95)}
                      begin={`${(t.id % 4) * 0.5}s`}
                      fill="freeze"
                    />
                    <animateMotion
                      dur="2.8s"
                      begin={`${(t.id % 4) * 0.5}s`}
                      repeatCount="indefinite"
                      path={t.d}
                    />
                  </rect>
                )}
              </g>
            );
          })}

          {Object.values(g.nodes).map((n) => {
            const isHot = !!hot && hot.has(n.id);
            return (
              <g
                key={n.id}
                opacity={hot ? (isHot ? 1 : 0.18) : 1}
                onMouseEnter={() => setHover(n.id)}
                onMouseLeave={() => setHover(null)}
              >
                <rect
                  x={n.x}
                  y={n.y}
                  width={n.w}
                  height={n.h}
                  fill={isHot ? `${C[n.color]}30` : "#12202b"}
                />
                <rect
                  x={n.x}
                  y={n.y}
                  width={3}
                  height={n.h}
                  fill={`${C[n.color]}${isHot ? "ff" : "aa"}`}
                />
                <text
                  x={n.x + 12}
                  y={n.y + 24}
                  fontSize={n.titleSize}
                  fontWeight={600}
                  fill={isHot || !hot ? "#e8eff5" : "#9fb0bd"}
                >
                  {n.title}
                </text>
                <text
                  x={n.x + 12}
                  y={n.y + 40}
                  fontSize={n.subSize}
                  fill="#8fa2b0"
                  style={{ fontFamily: FONT_MONO }}
                >
                  {n.sub}
                </text>
              </g>
            );
          })}

          {g.trunks.map((t) => {
            const visible = on(t.kind);
            const isHot = !!hot && hot.has(t.a) && hot.has(t.b);
            return (
              <g
                key={`label-${t.id}`}
                opacity={!visible ? 0.04 : hot ? (isHot ? 1 : 0.06) : 0.85}
                transform={
                  t.rotated
                    ? `translate(${t.rx} ${t.ry}) rotate(-90)`
                    : undefined
                }
              >
                <rect
                  x={t.rotated ? -t.lw / 2 : t.lbx}
                  y={t.rotated ? -7.5 : t.ly - 7.5}
                  width={t.lw}
                  height={15}
                  fill={CANVAS_BG}
                />
                <text
                  x={t.rotated ? -t.lw / 2 + 4 : t.lbx + 4}
                  y={t.rotated ? 4 : t.ly + 4}
                  fontSize={12}
                  fill={KIND[t.kind].color}
                  style={{ fontFamily: FONT_MONO, wordSpacing: -TIGHTEN.ov }}
                >
                  {t.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="text-fg-subtle text-2xs mt-3 flex flex-wrap gap-4">
        {(Object.keys(KIND) as Kind[]).map((k) => (
          <span key={k} className="flex items-center gap-1.5">
            <span
              className="inline-block w-5 border-t-2"
              style={{ borderColor: KIND[k].color }}
            />
            {KIND[k].label}
          </span>
        ))}
      </div>
      <p className="text-fg-subtle text-2xs mt-2 leading-relaxed">
        Hover any box to isolate the path it sits on. nginx is the edge: it
        serves the app bundle and the universe / system JSON produced by the SDE
        Parser, and reverse-proxies REST and WebSocket traffic to FastAPI.
      </p>
    </div>
  );
}

const MONO = /[/_:{}*<>?=.]/;
const ROW_H = 21,
  COL_GAP = 8,
  PAD = 12,
  TITLE_H = 22,
  GRP_H = 18;

type LaidNode = {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  mono: boolean;
  band: string;
  group: string;
  color: Color;
};
type LaidGroup = {
  id: string;
  band: string;
  lane: number;
  left: number;
  right: number;
  cy: number;
  y0: number;
  y1: number;
};
type LaidBand = BandSpec & { x: number; y: number; w: number; h: number };
type Rule = { x: number; y: number; w: number; band: string };
type GroupLabel = {
  x: number;
  y: number;
  label: string;
  fill: string;
  band: string;
  group: string;
};
type Trunk = {
  a: string;
  b: string;
  kind: Kind;
  label: string;
  flow: boolean;
  id: number;
  d: string;
  anchor: "start" | "middle";
  lx: number;
  ly: number;
  lw: number;
  lbx: number;
  vert: [number, number, number] | null;
  rotated: boolean;
  rx: number;
  ry: number;
  xy: number;
  xFrom: number;
  xTo: number;
  ey: number;
  eLeft: number;
  eRight: number;
};

export function buildGraph() {
  const nodes: Record<string, LaidNode> = {};
  const groups: Record<string, LaidGroup> = {};
  const bands: LaidBand[] = [];
  const groupLabels: GroupLabel[] = [];
  const rules: Rule[] = [];

  const layoutBand = (b: BandSpec, y: number) => {
    const lane = LANES[b.lane];
    const bx = b.full ? LANES[0].x : lane.x;
    const bw = b.full ? CANVAS_W - LANES[0].x * 2 : lane.w;
    const innerX = bx + PAD,
      innerW = bw - PAD * 2;
    const cellW = (innerW - (b.cols - 1) * COL_GAP) / b.cols;
    let cy = y + TITLE_H;
    b.groups.forEach((g, gi) => {
      if (gi > 0) cy += 4;
      rules.push({ x: innerX, y: cy, w: innerW, band: b.id });
      if (g.label) {
        groupLabels.push({
          x: innerX,
          y: cy + 14,
          label: g.label.toUpperCase(),
          fill: LT[b.color],
          band: b.id,
          group: g.id,
        });
        cy += GRP_H;
      } else cy += 6;
      let col = 0;
      const y0 = cy;
      g.nodes.forEach(([id, label]) => {
        const mono = MONO.test(label);
        const need = Math.ceil(
          (label.length * (mono ? 6.5 : 6.2) + 20) / cellW,
        );
        const span = Math.max(1, Math.min(b.cols, need));
        if (col + span > b.cols) {
          col = 0;
          cy += ROW_H;
        }
        nodes[id] = {
          id,
          label,
          x: innerX + col * (cellW + COL_GAP),
          y: cy,
          w: span * cellW + (span - 1) * COL_GAP,
          h: ROW_H - 3,
          mono,
          band: b.id,
          group: g.id,
          color: b.color,
        };
        col += span;
        if (col >= b.cols) {
          col = 0;
          cy += ROW_H;
        }
      });
      if (col > 0) cy += ROW_H;
      groups[g.id] = {
        id: g.id,
        band: b.id,
        lane: b.lane,
        left: bx,
        right: bx + bw,
        cy: (y0 + cy - 3) / 2,
        y0,
        y1: cy - 3,
      };
    });
    const h = cy - y + PAD - 2;
    bands.push({ ...b, x: bx, y, w: bw, h });
    return y + h;
  };

  const laneCursor: Record<number, number> = {};
  BANDS.filter((b) => b.track === "live").forEach((b) => {
    laneCursor[b.lane] = layoutBand(
      b,
      laneCursor[b.lane] == null ? 46 : laneCursor[b.lane] + 12,
    );
  });
  const liveBottom = Math.max(...Object.values(laneCursor));

  const staticCursor: Record<number, number> = {};
  BANDS.filter((b) => b.track === "static").forEach((b) => {
    staticCursor[b.lane] = layoutBand(
      b,
      staticCursor[b.lane] == null
        ? liveBottom + 46
        : staticCursor[b.lane] + 12,
    );
  });
  const staticBottom = Math.max(...Object.values(staticCursor));

  const feBottom0 = layoutBand(
    BANDS.find((b) => b.track === "span")!,
    46,
  );
  const dy = Math.max(0, Math.round((staticBottom - feBottom0) / 2));
  if (dy) {
    Object.values(nodes).forEach((n) => {
      if (n.band === "FE") n.y += dy;
    });
    rules.forEach((r) => {
      if (r.band === "FE") r.y += dy;
    });
    groupLabels.forEach((l) => {
      if (l.band === "FE") l.y += dy;
    });
    Object.values(groups).forEach((gr) => {
      if (gr.band === "FE") {
        gr.cy += dy;
        gr.y0 += dy;
        gr.y1 += dy;
      }
    });
    bands.forEach((bb) => {
      if (bb.id === "FE") bb.y += dy;
    });
  }
  const feBottom = feBottom0 + dy;
  const opsBottom = layoutBand(
    BANDS.find((b) => b.track === "ops")!,
    Math.max(staticBottom + 46, feBottom + 24),
  );
  const H = opsBottom + 18;

  const raw = TRUNKS.map(([a, b, kind, label, flow], i) => {
    const A = groups[a],
      B = groups[b];
    return A && B
      ? { a, b, kind, label, flow: !!flow, A, B, id: i, skip: B.lane - A.lane }
      : null;
  }).filter((t): t is NonNullable<typeof t> => !!t);

  const corridor = (li: number) => ({
    a: LANES[li].x + LANES[li].w,
    b: LANES[li + 1].x,
  });

  const port: Record<number, { out?: number; in?: number }> = {};
  const fan = (
    key: "out" | "in",
    list: typeof raw,
    sortKey: (p: (typeof raw)[0], q: (typeof raw)[0]) => number,
  ) => {
    list.sort(sortKey).forEach((t, k) => {
      const gr = key === "out" ? t.A : t.B;
      const extent = Math.max(0, gr.y1 - gr.y0 - 10);
      const spread =
        list.length > 1 ? Math.min(13, extent / (list.length - 1)) : 0;
      (port[t.id] ||= {})[key] = Math.round(
        gr.cy + (k - (list.length - 1) / 2) * spread,
      );
    });
  };
  const outs: Record<string, typeof raw> = {},
    ins: Record<string, typeof raw> = {};
  raw.forEach((t) => {
    (outs[t.a] ||= []).push(t);
    (ins[t.b] ||= []).push(t);
  });
  Object.values(outs).forEach((l) => fan("out", l, (p, q) => p.B.cy - q.B.cy));
  Object.values(ins).forEach((l) => fan("in", l, (p, q) => p.A.cy - q.A.cy));

  const blockedOf = (t: (typeof raw)[0]) =>
    bands.some(
      (bb) =>
        bb.lane > t.A.lane &&
        bb.lane < t.B.lane &&
        !bb.full &&
        port[t.id].out! > bb.y - 12 &&
        port[t.id].out! < bb.y + bb.h + 12,
    );
  const reqs: Record<
    number,
    { t: (typeof raw)[0]; role: "mx" | "c1" | "c2" }[]
  > = {};
  const need = (li: number, t: (typeof raw)[0], role: "mx" | "c1" | "c2") => {
    (reqs[li] ||= []).push({ t, role });
  };
  raw.forEach((t) => {
    if (t.skip === 1) need(t.A.lane, t, "mx");
    else if (t.skip > 1) {
      if (blockedOf(t)) need(t.A.lane, t, "c1");
      need(t.B.lane - 1, t, "c2");
    }
  });
  const chanX: Record<number, Partial<Record<"mx" | "c1" | "c2", number>>> = {};
  Object.keys(reqs).forEach((k) => {
    const li = +k;
    const co = corridor(li);
    const list = reqs[li].sort((p, q) => port[p.t.id].out! - port[q.t.id].out!);
    const step =
      list.length > 1
        ? Math.max(22, (co.b - co.a - 40) / (list.length - 1))
        : 0;
    list.forEach((r, i) => {
      const x = Math.round(
        list.length > 1
          ? Math.min(co.a + 20 + i * step, co.b - 20)
          : co.a + (co.b - co.a) / 2,
      );
      (chanX[r.t.id] ||= {})[r.role] = x;
    });
  });

  const trunks: Trunk[] = raw.map((t) => {
    const { A, B } = t;
    const y1 = port[t.id].out!,
      y2 = port[t.id].in!;
    let d: string, lx: number, ly: number;
    const anchor: "start" | "middle" = "start";
    let vert: [number, number, number] | null = null;
    let firstV = 0,
      lastV = 0;
    const stub = [A.right + 5, y1];
    if (t.skip === 1) {
      const mx = chanX[t.id].mx!;
      firstV = lastV = mx;
      d = `M${A.right} ${y1} H${mx} V${y2} H${B.left - 3}`;
      lx = stub[0];
      ly = stub[1];
      vert = [mx, (y1 + y2) / 2, Math.abs(y2 - y1)];
    } else if (t.skip > 1) {
      const c2 = chanX[t.id].c2!;
      firstV = lastV = c2;
      if (!blockedOf(t)) {
        d = `M${A.right} ${y1} H${c2} V${y2} H${B.left - 3}`;
        lx = stub[0];
        ly = stub[1];
      } else {
        const c1 = chanX[t.id].c1!;
        firstV = c1;
        const hw = (t.kind === "static" ? staticBottom : liveBottom) + 30;
        d = `M${A.right} ${y1} H${c1} V${hw} H${c2} V${y2} H${B.left - 3}`;
        lx = stub[0];
        ly = stub[1];
        vert = [c1, (y1 + hw) / 2, Math.abs(hw - y1)];
      }
    } else {
      const x1 = A.right - PAD - 2,
        mx = A.right + 16;
      firstV = lastV = mx;
      d = `M${x1} ${y1} H${mx} V${y2} H${x1}`;
      lx = mx + 6;
      ly = (y1 + y2) / 2;
      vert = [mx, (y1 + y2) / 2, Math.abs(y2 - y1)];
    }
    return {
      ...t,
      d,
      lx,
      ly,
      anchor,
      vert,
      xy: y1,
      xFrom: A.right + 5,
      xTo: firstV - 4,
      ey: y2,
      eLeft: lastV + 4,
      eRight: B.left - 3,
      lw: 0,
      lbx: 0,
      rotated: false,
      rx: 0,
      ry: 0,
    };
  });

  const boxes: LabelBox[] = [];
  placeLabels(trunks, boxes, {
    width: (s) => s.length * 5.6 + 8 - spaces(s) * TIGHTEN.detail,
    rowH: 14,
    step: 14,
    minVert: 60,
  });

  const gUp: Record<string, string[]> = {},
    gDown: Record<string, string[]> = {};
  trunks.forEach((t) => {
    (gDown[t.a] ||= []).push(t.b);
    (gUp[t.b] ||= []).push(t.a);
  });

  return { nodes, groups, bands, groupLabels, rules, trunks, gUp, gDown, H };
}

export function StackDetailedDiagram() {
  const g = useMemo(buildGraph, []);
  const [hover, setHover] = useState<string | null>(null);
  const [off, setOff] = useState<Partial<Record<Kind, boolean>>>({});
  const [playing, setPlaying] = useState(true);
  const [fit, setFit] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);
  const [frameW, setFrameW] = useState(0);

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setFrameW(el.clientWidth));
    ro.observe(el);
    setFrameW(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const scale = fit && frameW ? Math.min(1, (frameW - 2) / CANVAS_W) : 1;

  const hot = useMemo(() => {
    if (!hover) return null;
    const start = g.nodes[hover]?.group ?? hover;
    const set = new Set<string>([start]);
    const walk = (m: Record<string, string[]>, k: string) =>
      (m[k] || []).forEach((n) => {
        if (!set.has(n)) {
          set.add(n);
          walk(m, n);
        }
      });
    walk(g.gUp, start);
    walk(g.gDown, start);
    return set;
  }, [hover, g]);

  const on = (k: Kind) => !off[k];
  const bandHot = (id: string) =>
    !hot ||
    Object.values(g.groups).some((gr) => gr.band === id && hot.has(gr.id));

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        {(Object.keys(KIND) as Kind[]).map((k) => (
          <button
            key={k}
            type="button"
            aria-pressed={on(k)}
            onClick={() => setOff((o) => ({ ...o, [k]: !o[k] }))}
            className={`flex cursor-pointer items-center gap-1.5 border px-2.5 py-1 text-2xs transition-colors ${
              on(k) ? "text-fg-strong" : "text-fg-faint border-border"
            }`}
            style={
              on(k)
                ? {
                    borderColor: `${KIND[k].color}66`,
                    background: `${KIND[k].color}1a`,
                  }
                : undefined
            }
          >
            <span className="size-2.5" style={{ background: KIND[k].color }} />
            {KIND[k].label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          className="text-fg-faint hover:text-capsuleer border-border hover:border-capsuleer/50 cursor-pointer border px-2.5 py-1 text-2xs transition-colors"
        >
          {playing ? "Pause flow" : "Play flow"}
        </button>
        <button
          type="button"
          aria-pressed={fit}
          onClick={() => setFit((f) => !f)}
          className={`border-border hover:border-capsuleer/50 cursor-pointer border px-2.5 py-1 text-2xs transition-colors ${
            fit
              ? "text-capsuleer border-capsuleer/50"
              : "text-fg-faint hover:text-capsuleer"
          }`}
        >
          {fit ? "Actual size" : "Fit width"}
        </button>
      </div>

      <div
        ref={frameRef}
        className="border-border bg-panel max-h-[74vh] overflow-auto border"
      >
        <div
          style={{
            width: Math.round(CANVAS_W * scale),
            height: Math.round(g.H * scale),
            overflow: "hidden",
          }}
        >
          <div style={{ transform: `scale(${scale})`, transformOrigin: "0 0" }}>
            <svg
              width={CANVAS_W}
              height={g.H}
              viewBox={`0 0 ${CANVAS_W} ${g.H}`}
              role="img"
              aria-label="EVE Killmap comprehensive stack: sources, ingestion and SDE pipelines, PostgreSQL and Redis stores, nginx edge, FastAPI backend and the frontend client, with the data flow between them"
              className="block"
              style={{ fontFamily: FONT_UI }}
            >
              <defs>
                {(Object.keys(KIND) as Kind[]).map((k) => (
                  <marker
                    key={k}
                    id={`t-${k}`}
                    markerWidth="8"
                    markerHeight="8"
                    refX="6.2"
                    refY="3"
                    orient="auto"
                  >
                    <path d="M0,0 L6.4,3 L0,6 Z" fill={KIND[k].color} />
                  </marker>
                ))}
              </defs>

              {LANES.map((l) => (
                <g key={l.label}>
                  <text
                    x={l.x}
                    y={26}
                    fontSize={11}
                    fontWeight={600}
                    letterSpacing="2.6"
                    fill="#7d8e9c"
                  >
                    {l.label.toUpperCase()}
                  </text>
                  <rect x={l.x} y={32} width={l.w} height={2} fill="#28404f" />
                </g>
              ))}

              {g.bands.map((b) => (
                <g
                  key={b.id}
                  opacity={on(b.kind) ? (bandHot(b.id) ? 1 : 0.35) : 0.3}
                >
                  <rect
                    x={b.x}
                    y={b.y}
                    width={b.w}
                    height={b.h}
                    fill={b.dashed ? "none" : `${C[b.color]}10`}
                    stroke={LT[b.color]}
                    strokeWidth={b.dashed ? 1 : 1.5}
                    strokeDasharray={b.dashed ? "5 5" : undefined}
                  />
                  <text
                    x={b.x + PAD}
                    y={b.y + 17}
                    fontSize={12.5}
                    fontWeight={600}
                    letterSpacing="1.4"
                    fill={LT[b.color]}
                  >
                    {b.title.toUpperCase()}
                    {b.sub && (
                      <tspan
                        fontSize={11}
                        fontWeight={400}
                        letterSpacing="0"
                        fill="#8296a4"
                        dx="8"
                      >
                        · {b.sub}
                      </tspan>
                    )}
                  </text>
                </g>
              ))}

              {g.rules.map((r) => (
                <rect
                  key={`${r.band}-${r.y}`}
                  x={r.x}
                  y={r.y}
                  width={r.w}
                  height={1}
                  fill={
                    LT[g.bands.find((b) => b.id === r.band)?.color || "slate"]
                  }
                  opacity={hot ? 0.12 : 0.3}
                />
              ))}
              {g.groupLabels.map((l) => (
                <text
                  key={l.group}
                  x={l.x}
                  y={l.y}
                  fontSize={9.5}
                  fontWeight={600}
                  letterSpacing="1.5"
                  fill={l.fill}
                  opacity={hot ? (hot.has(l.group) ? 0.95 : 0.15) : 0.7}
                >
                  {l.label}
                </text>
              ))}

              {g.trunks.map((t) => {
                const visible = on(t.kind);
                const isHot = !!hot && hot.has(t.a) && hot.has(t.b);
                const op = !visible ? 0.05 : hot ? (isHot ? 1 : 0.06) : 0.75;
                return (
                  <g key={t.id}>
                    <path
                      d={t.d}
                      fill="none"
                      stroke={KIND[t.kind].color}
                      strokeWidth={isHot ? 2.6 : 1.8}
                      strokeLinejoin="round"
                      opacity={op}
                      markerEnd={KIND[t.kind].marker}
                    />
                    {t.flow && playing && visible && (
                      <rect
                        x={-2.5}
                        y={-2.5}
                        width={5}
                        height={5}
                        fill={KIND[t.kind].color}
                        opacity={0}
                      >
                        <set
                          attributeName="opacity"
                          to={String(hot ? (isHot ? 1 : 0.08) : 0.95)}
                          begin={`${(t.id % 4) * 0.5}s`}
                          fill="freeze"
                        />
                        <animateMotion
                          dur="2.8s"
                          begin={`${(t.id % 4) * 0.5}s`}
                          repeatCount="indefinite"
                          path={t.d}
                        />
                      </rect>
                    )}
                  </g>
                );
              })}

              {Object.values(g.nodes).map((n) => {
                const isHot = !!hot && hot.has(n.group);
                const isSelf = hover === n.id;
                return (
                  <g
                    key={n.id}
                    opacity={hot ? (isHot ? 1 : 0.16) : 1}
                    onMouseEnter={() => setHover(n.id)}
                    onMouseLeave={() => setHover(null)}
                  >
                    <rect
                      x={n.x}
                      y={n.y}
                      width={n.w}
                      height={n.h}
                      fill={
                        isSelf
                          ? `${C[n.color]}3d`
                          : isHot
                            ? `${C[n.color]}20`
                            : "#12202b"
                      }
                    />
                    <rect
                      x={n.x}
                      y={n.y}
                      width={2}
                      height={n.h}
                      fill={`${C[n.color]}${isHot ? "ff" : "aa"}`}
                    />
                    <text
                      x={n.x + 10}
                      y={n.y + n.h / 2 + 4}
                      fontSize={n.mono ? 11 : 12}
                      fill={isHot || !hot ? "#dbe6ee" : "#9fb0bd"}
                      style={{ fontFamily: n.mono ? FONT_MONO : FONT_UI }}
                    >
                      {n.label}
                    </text>
                  </g>
                );
              })}

              {g.trunks.map((t) => {
                const visible = on(t.kind);
                const isHot = !!hot && hot.has(t.a) && hot.has(t.b);
                return (
                  <g
                    key={`label-${t.id}`}
                    opacity={!visible ? 0.04 : hot ? (isHot ? 1 : 0.05) : 0.85}
                    transform={
                      t.rotated
                        ? `translate(${t.rx} ${t.ry}) rotate(-90)`
                        : undefined
                    }
                  >
                    <rect
                      x={t.rotated ? -t.lw / 2 : t.lbx}
                      y={t.rotated ? -7 : t.ly - 7}
                      width={t.lw}
                      height={14}
                      fill={CANVAS_BG}
                    />
                    <text
                      x={
                        t.rotated
                          ? -t.lw / 2 + 4
                          : t.anchor === "start"
                            ? t.lbx + 4
                            : t.lx
                      }
                      y={t.rotated ? 3.5 : t.ly + 4}
                      textAnchor={
                        t.rotated || t.anchor === "start" ? "start" : "middle"
                      }
                      fontSize={9.5}
                      fill={KIND[t.kind].color}
                      style={{
                        fontFamily: FONT_MONO,
                        wordSpacing: -TIGHTEN.detail,
                      }}
                    >
                      {t.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </div>

      <div className="text-fg-subtle text-2xs mt-3 flex flex-wrap gap-4">
        {(Object.keys(KIND) as Kind[]).map((k) => (
          <span key={k} className="flex items-center gap-1.5">
            <span
              className="inline-block w-5 border-t-2"
              style={{ borderColor: KIND[k].color }}
            />
            {KIND[k].label}
          </span>
        ))}
      </div>
      <p className="text-fg-subtle text-2xs mt-2 leading-relaxed">
        Hover any item to isolate the stages it touches. nginx is the edge: it
        serves the app bundle and the universe / system JSON produced by
        process-sde, and reverse-proxies REST and WebSocket traffic to FastAPI.
        Entity names are resolved at ingest, so the read path is pure SQL.
      </p>
    </div>
  );
}
