import { useState } from "react";
import { Section, SubSection, Hyperlink } from "./info-common";
import {
  StackOverviewDiagram,
  StackDetailedDiagram,
} from "./info-stack-flow-diagram";
import { Button } from "../ui/button";

const REPOS: { label: string; repo: string }[] = [
  { label: "SDE Parser", repo: "process-sde" },
  { label: "Kill Ingestor", repo: "process-kills" },
  { label: "FastAPI Backend", repo: "backend" },
  { label: "Frontend", repo: "frontend" },
];

function RepoLink({ label, repo }: { label: string; repo: string }) {
  return (
    <Button asChild variant="outline" size="sm" className="btn-glass text-xs">
      <a
        href={`https://github.com/eve-killmap/${repo}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <svg
          viewBox="0 0 16 16"
          fill="currentColor"
          aria-hidden
          className="size-4 shrink-0"
        >
          <path d="M6.766 11.328c-2.063-.25-3.516-1.734-3.516-3.656 0-.781.281-1.625.75-2.188-.203-.515-.172-1.609.063-2.062.625-.078 1.468.25 1.968.703.594-.187 1.219-.281 1.985-.281.765 0 1.39.094 1.953.265.484-.437 1.344-.765 1.969-.687.218.422.25 1.515.046 2.047.5.593.766 1.39.766 2.203 0 1.922-1.453 3.375-3.547 3.64.531.344.89 1.094.89 1.954v1.625c0 .468.391.734.86.547C13.781 14.359 16 11.53 16 8.03 16 3.61 12.406 0 7.984 0 3.563 0 0 3.61 0 8.031a7.88 7.88 0 0 0 5.172 7.422c.422.156.828-.125.828-.547v-1.25c-.219.094-.5.156-.75.156-1.031 0-1.64-.562-2.078-1.609-.172-.422-.36-.672-.719-.719-.187-.015-.25-.093-.25-.187 0-.188.313-.328.625-.328.453 0 .844.281 1.25.86.313.452.64.655 1.031.655s.641-.14 1-.5c.266-.265.47-.5.657-.656" />
        </svg>
        View the {label} source code
      </a>
    </Button>
  );
}

export function StackTab() {
  const [showDetailed, setShowDetailed] = useState(false);
  return (
    <div className="space-y-8">
      <Section title="Architecture">
        <div className="flex items-start justify-between gap-4 mb-4">
          <p className="text-fg-muted text-sm">
            EVE Killmap is four separate projects working in concert: an offline{" "}
            <span>SDE Parser</span>, an always-running{" "}
            <span>Kill Ingestor</span>, a <span>FastAPI backend</span>, and this{" "}
            <span>frontend</span>, backed by PostgreSQL, Redis, and nginx. Below
            is a high-level diagram of how they interact. Toggle for a detailed
            view.
          </p>
          <button
            onClick={() => setShowDetailed((v) => !v)}
            className="shrink-0 text-fg-faint hover:text-capsuleer transition-colors text-2xs border border-border hover:border-capsuleer/50 px-2.5 py-1 cursor-pointer"
          >
            {showDetailed ? "Overview" : "Detailed"}
          </button>
        </div>
        {showDetailed ? <StackDetailedDiagram /> : <StackOverviewDiagram />}
      </Section>

      <Section title="How It Works">
        <div className="space-y-6">
          <SubSection title="SDE Parser">
            <p className="text-fg-muted text-sm">
              An offline ETL script run whenever CCP publishes a new Static Data
              Export. It downloads and extracts the SDE, loads thousands of raw
              JSONL records into in-memory dicts, then drives a generation
              pipeline: per-system celestial files; universe maps for New Eden
              (in both 2D and true 3D), Anoikis, Abyssal Deadspace, and Tutorial
              space; slug and system indexes for URL routing and search;
              localized label data; and filtered item-type metadata (written
              both as static JSON and upserted into PostgreSQL). Output is
              versioned by SDE build number, written only when content changes,
              and optionally Brotli-precompressed for nginx.
            </p>
          </SubSection>
          <SubSection title="Kill Ingestor">
            <p className="text-fg-muted text-sm">
              An always-running async service of concurrent tasks. A{" "}
              <span>live listener</span> advances zKillboard's real-time R2Z2
              stream one killmail at a time and inserts each kill (kills with a
              position go to the main tables; kills without one are recorded
              separately), resolving character, corporation, and alliance names
              via ESI <em>at ingestion</em> and storing them in reference
              tables, so the backend never resolves names at request time. A{" "}
              <span>daily cross-checker</span> diffs the database against
              zKillboard day-totals and backfills anything missed; a{" "}
              <span>refresh scheduler</span> runs a fast cycle every 30 minutes
              and a slow cycle daily at EVE downtime: the fast cycle rolls each
              UTC day that received new kills into per-system and per-entity
              daily rollups, rewrites the five windowed{" "}
              <span>entity leaderboards</span> (characters, corporations,
              alliances, factions, ships, and weapons, as attacker and as
              victim, with and without NPC entities), and refreshes the small
              materialized views; the slow cycle rewrites the all-time boards
              and the slow-changing views; both publish invalidations so the
              backend drops stale caches; and separate schedulers backfill{" "}
              <span>war</span>, <span>faction</span>, and{" "}
              <span>corporation</span> data on slower cadences. All ESI traffic
              shares one priority-aware, token-bucket rate-limited client, and
              every insert is idempotent. After each successful insert the
              listener publishes the kill to a Redis stream. Each insert also
              updates the <span>kill_facets</span> inverted index that powers
              filtering.
            </p>
          </SubSection>
          <SubSection title="PostgreSQL">
            <p className="text-fg-muted text-sm">
              The shared kill database. The <span>kills</span> fact table stores
              each victim's ship, system, 3D position, and timestamp, with a
              companion <span>kill_attackers</span> table. Kills lacking a
              position are recorded separately; a killmail published without one
              never gains it. Entity reference tables (
              <span>characters, corporations, alliances, factions,</span> and{" "}
              <span>wars</span>) are populated at ingestion so names resolve
              with pure SQL. Bookkeeping tables track per-day ingestion and the
              live resume sequence. The kills table is physically clustered by{" "}
              <span>solar_system_id</span> weekly. Two incrementally maintained
              rollup tables, <span>system_kills_daily</span> and{" "}
              <span>entity_kills_daily</span>, aggregate kills per UTC day and
              feed the top-system rankings and the{" "}
              <span>entity_leaderboard</span> table (one board per kind, role,
              window, and scope, top 50, stamped with{" "}
              <code className="text-fg-secondary">computed_at</code>); a{" "}
              <span>rollup_state</span> watermark records how far the rollups
              have caught up. Five materialized views cover all-time kills per
              system, the farthest kill per system, alliance member counts, and
              ship/weapon search. A billion-row <span>kill_facets</span>{" "}
              inverted index, one row per kill × facet (victim/attacker
              character, corporation, alliance, or faction; ship; weapon; war),
              powers faceted kill filtering, while <span>pg_trgm</span> trigram
              indexes on entity name/ticker columns and a weekly{" "}
              <span>mv_weapon_search</span> materialized view back type-ahead
              autocomplete.
            </p>
          </SubSection>
          <SubSection title="Redis">
            <p className="text-fg-muted text-sm">
              Redis plays three roles. It carries the <span>kills:live</span>{" "}
              stream that the ingestor appends each clean kill to and the
              backend tails for live delivery; it backs the backend's{" "}
              <span>response and ESI cache</span>; and it carries a{" "}
              <span>cache-invalidation</span> pub/sub channel: after the
              ingestor refreshes its ranking views it publishes an invalidation
              so every backend worker drops the affected cached responses.
            </p>
          </SubSection>
          <SubSection title="FastAPI Backend">
            <p className="text-fg-muted text-sm">
              A stateless, read-only query layer running as multiple workers;
              one elected leader tails the live stream and refreshes sovereignty
              while every worker serves requests and fans out live kills over
              WebSockets. The highest-volume route returns a compact{" "}
              <span>custom binary format</span> (columnar, delta-encoded with
              zigzag + LEB128 varints), decoded by a matching client decoder.
              Kill details are enriched from SQL (names, corporations,
              alliances, war info); ESI is used only for{" "}
              <span>sovereignty</span>. Rankings and the{" "}
              <code className="text-fg-secondary">/stats/leaderboards</code>{" "}
              boards (window × role × scope) come straight from the rollup
              tables, with names resolved in SQL; rollup-backed responses carry
              a <code className="text-fg-secondary">computed_at</code>{" "}
              watermark, and the leader pre-warms every board combination. Hot
              responses are Redis-cached and carry{" "}
              <code className="text-fg-secondary">ETag</code> /{" "}
              <code className="text-fg-secondary">Cache-Control</code> headers,
              with single-flight locks and
              <code className="text-fg-secondary"> since</code>-poll
              short-circuiting. Faceted filtering compiles a compact filter DSL
              to SQL over <span>kill_facets</span> (ids OR within a condition,
              conditions AND via the most-selective driver plus{" "}
              <code className="text-fg-secondary">EXISTS</code> subqueries),
              serving both per-system filtered aggregates (
              <code className="text-fg-secondary">/stats/system-kills?f=</code>)
              and per-system id-set masks (
              <code className="text-fg-secondary">
                /systems/{"{id}"}/kills/filtered
              </code>
              ). Trigram-backed{" "}
              <code className="text-fg-secondary">/autocomplete/*</code> and war
              lookup (<code className="text-fg-secondary">/wars/search</code>,{" "}
              <code className="text-fg-secondary">/wars/details</code>) complete
              the filter and war features.
            </p>
          </SubSection>
          <SubSection title="Frontend">
            <p className="text-fg-muted text-sm">
              Built on Vite and React Router with React Three Fiber for WebGL
              rendering. Kill data is fetched once, decoded from the binary
              format, and organized into an <span>octree</span>; a per-frame
              traversal collapses distant kills into cluster spheres and expands
              nearby ones into individual markers via fixed-capacity instanced
              meshes. The New Eden map morphs smoothly between 2D and true 3D
              layouts. A <span>floating-origin</span> technique preserves
              float32 GPU precision at astronomical-unit scale. Static universe
              data (system layouts, maps, indexes, type metadata, locales) is
              served by nginx; live and detailed kill data comes from the API,
              reverse-proxied through the same nginx. Faceted kill filtering (a
              shared filter builder across the map and system views), a war
              browser, a leaderboards dialog that turns any entry into a map
              filter, and explicit shareable filter links let users slice the
              kill data and share a view.
            </p>
          </SubSection>
        </div>
      </Section>

      <Section title="Source Code">
        <p className="text-fg-muted text-sm mb-3">
          Each of the four projects lives in its own repository.
        </p>
        <div className="flex flex-wrap gap-2">
          {REPOS.map(({ label, repo }) => (
            <RepoLink key={repo} label={label} repo={repo} />
          ))}
        </div>
      </Section>

      <Section title="Technologies">
        <div className="space-y-4">
          <SubSection title="Shared infrastructure">
            <Technologies
              technologies={[
                {
                  name: "Python 3.12+",
                  role: "SDE parser, kill ingestor, backend",
                  href: "https://python.org",
                },
                {
                  name: "PostgreSQL",
                  role: "Kills, entities, types, materialized views",
                  href: "https://postgresql.org",
                },
                {
                  name: "Redis",
                  role: "Live stream, response cache, cache-invalidation bus",
                  href: "https://redis.io",
                },
                {
                  name: "nginx",
                  role: "Static hosting (bundle + SDE JSON, Brotli/gzip) + API reverse proxy",
                  href: "https://nginx.org",
                },
                {
                  name: "PyYAML",
                  role: "Layered YAML configuration",
                  href: "https://pyyaml.org",
                },
                {
                  name: "python-dotenv",
                  role: "Environment/secret loading",
                  href: "https://github.com/theskumar/python-dotenv",
                },
                {
                  name: "JSON",
                  role: "Static data interchange format",
                  href: "https://www.json.org",
                },
                {
                  name: "Uptime Kuma",
                  role: "Full stack status monitoring",
                  href: "https://uptimekuma.co/",
                },
              ]}
            />
          </SubSection>
          <SubSection title="SDE Parser">
            <Technologies
              technologies={[
                {
                  name: "psycopg2",
                  role: "PostgreSQL driver (type-data upsert)",
                  href: "https://www.psycopg.org",
                },
                {
                  name: "Brotli",
                  role: "Precompression of generated JSON",
                  href: "https://github.com/google/brotli",
                },
              ]}
            />
          </SubSection>
          <SubSection title="Kill Ingestor">
            <Technologies
              technologies={[
                {
                  name: "psycopg2",
                  role: "PostgreSQL driver",
                  href: "https://www.psycopg.org",
                },
                {
                  name: "requests",
                  role: "Synchronous HTTP to ESI",
                  href: "https://requests.readthedocs.io/en/latest",
                },
                {
                  name: "aiohttp",
                  role: "Async HTTP for live polling",
                  href: "https://docs.aiohttp.org",
                },
                {
                  name: "redis-py",
                  role: "Redis stream publisher + invalidation",
                  href: "https://redis.io/docs/latest/develop/clients/redis-py/",
                },
              ]}
            />
          </SubSection>
          <SubSection title="FastAPI Backend">
            <Technologies
              technologies={[
                {
                  name: "FastAPI",
                  role: "Async REST + WebSocket API",
                  href: "https://fastapi.tiangolo.com",
                },
                {
                  name: "uvicorn",
                  role: "ASGI server",
                  href: "https://www.uvicorn.dev",
                },
                {
                  name: "pydantic",
                  role: "Validation and response models",
                  href: "https://pydantic.dev",
                },
                {
                  name: "asyncpg",
                  role: "Async PostgreSQL driver",
                  href: "https://magicstack.github.io/asyncpg/current",
                },
                {
                  name: "redis-py",
                  role: "Stream consumer + response cache + invalidation subscriber",
                  href: "https://redis.io/docs/latest/develop/clients/redis-py/",
                },
                {
                  name: "websockets",
                  role: "WebSocket transport",
                  href: "https://websockets.readthedocs.io",
                },
                {
                  name: "cachetools",
                  role: "In-memory caching",
                  href: "https://cachetools.readthedocs.io",
                },
                {
                  name: "aiohttp",
                  role: "Async HTTP to ESI (sovereignty)",
                  href: "https://docs.aiohttp.org",
                },
              ]}
            />
          </SubSection>
          <SubSection title="Frontend">
            <Technologies
              technologies={[
                {
                  name: "TypeScript",
                  role: "Language and type system",
                  href: "https://www.typescriptlang.org",
                },
                {
                  name: "React",
                  role: "UI library",
                  href: "https://react.dev",
                },
                {
                  name: "React Router",
                  role: "Client-side routing",
                  href: "https://reactrouter.com/",
                },
                {
                  name: "Vite",
                  role: "Dev server and build tool",
                  href: "https://vite.dev/",
                },
                {
                  name: "ESLint",
                  role: "Linting (typescript-eslint + react-hooks)",
                  href: "https://eslint.org",
                },
                {
                  name: "Prettier",
                  role: "Code formatting",
                  href: "https://prettier.io",
                },
                {
                  name: "Three.js",
                  role: "WebGL 3D rendering",
                  href: "https://threejs.org",
                },
                {
                  name: "React Three Fiber",
                  role: "React renderer for Three.js",
                  href: "https://r3f.docs.pmnd.rs/",
                },
                {
                  name: "Drei",
                  role: "R3F helpers and abstractions",
                  href: "https://drei.docs.pmnd.rs",
                },
                {
                  name: "Troika Three Text",
                  role: "GPU 3D text/labels",
                  href: "https://protectwise.github.io/troika/troika-three-text",
                },
                {
                  name: "Zustand",
                  role: "Client state management",
                  href: "https://zustand.docs.pmnd.rs",
                },
                {
                  name: "Zod",
                  role: "Runtime schema validation (API, WebSocket, share links)",
                  href: "https://zod.dev",
                },
                {
                  name: "Tailwind CSS",
                  role: "Styling utilities",
                  href: "https://tailwindcss.com",
                },
                {
                  name: "Radix UI",
                  role: "Headless UI primitives",
                  href: "https://radix-ui.com",
                },
                {
                  name: "Plotly.js",
                  role: "Interactive statistics charts",
                  href: "https://plotly.com/javascript",
                },
                {
                  name: "@uiw/react-color",
                  role: "Kill-color pickers",
                  href: "https://uiwjs.github.io/react-color/",
                },
                {
                  name: "cmdk",
                  role: "Command palette / search",
                  href: "https://cmdk.paco.me",
                },
                {
                  name: "lucide-react",
                  role: "In-app icons",
                  href: "https://lucide.dev/guide/react/",
                },
                {
                  name: "react-spinners",
                  role: "Loading spinners",
                  href: "https://www.npmjs.com/package/react-spinners",
                },
              ]}
            />
          </SubSection>
        </div>
      </Section>
    </div>
  );
}

function Technologies({
  technologies,
}: {
  technologies: { name: string; role: string; href: string }[];
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
      {technologies.map(({ name, role, href }) => (
        <Hyperlink key={name} href={href}>
          <div className="group bg-panel-elevated border-l-2 border-capsuleer/30 hover:border-capsuleer/60 px-3 py-2 transition-colors">
            <div className="text-fg-secondary group-hover:text-fg-strong transition-colors text-xs font-medium">
              {name}
            </div>
            <div className="text-fg-subtle group-hover:text-fg-muted transition-colors text-3xs">
              {role}
            </div>
          </div>
        </Hyperlink>
      ))}
    </div>
  );
}
