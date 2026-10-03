import { Hyperlink, Section, SubSection } from "./info-common";

export function AboutTab() {
  return (
    <div className="space-y-8">
      <Section title="What is EVE Killmap?">
        <div className="space-y-3 text-fg-muted text-sm">
          <p>
            <span>EVE Online</span> is a massively-multiplayer online game set
            in a single shared universe of tens of thousands of star systems.
            When a ship is destroyed, the game records a <span>killmail</span>:
            a public record of the victim, the ships involved, the attackers,
            and, since 2015, the 3D coordinates of the kill.
          </p>
          <p>
            EVE Killmap reads that positional data and renders each kill in an
            interactive 3D scene, placed at the real in-game coordinates where
            it occurred, inside the actual solar system it happened in. It is a
            3D kill visualization tool, but also a broader set of views for
            exploring where and how kills happen across the game.
          </p>
          <p>
            Kills are fetched from the backend and organized into an{" "}
            <span>octree</span> on the client. A per-frame traversal algorithm
            dynamically collapses nearby kills into aggregate cluster spheres or
            expands them into individual markers based on their projected
            on-screen size, handling tens of thousands of kills at interactive
            framerates.
          </p>
          <p>
            The app covers all regions of space accessible to players:{" "}
            <span>New Eden</span>, including Jove and developer-only space,{" "}
            <span>Anoikis</span>, <span>Abyssal Deadspace</span>, and{" "}
            <span>Tutorial Systems</span>. Each system renders its celestial
            objects (star, planets, moons, asteroid belts, and stargates) as 3D
            LOD models at real in-game position and scale.
          </p>
        </div>
      </Section>

      <Section title="Features">
        <div className="space-y-6">
          <SubSection title="3D System View">
            <p className="text-fg-muted text-sm">
              Each solar system is an interactive 3D scene with its star,
              planets, moons, asteroid belts, and stargates at real in-game
              position and scale. Kills appear at their exact coordinates;
              nearby kills collapse into cluster spheres and expand into
              individual markers as the camera moves. Hovering a kill shows the
              victim, the final blow, ship types, and a link to the killmail on
              zKillboard, and a playback control scrubs through kills over any
              time range.
            </p>
          </SubSection>
          <SubSection title="Universe Map">
            <p className="text-fg-muted text-sm">
              A map of <span>New Eden</span> that morphs between a 2D layout and
              true 3D positions. Systems can be colored by security status, kill
              activity, region, or sovereignty, and ranked by kill volume across
              several time windows. A search box jumps to any system, and
              selecting one opens its 3D view.
            </p>
          </SubSection>
          <SubSection title="Live Feed">
            <p className="text-fg-muted text-sm">
              Kills stream in over a WebSocket as they happen in-game, appearing
              alongside the historical data. A global feed covers all of New
              Eden, and each system view carries its own feed for that system.
            </p>
          </SubSection>
          <SubSection title="Filtering & Sharing">
            <p className="text-fg-muted text-sm">
              A filter builder narrows the data by victim or attacker character,
              corporation, alliance, or faction, and by ship, weapon, or war.
              The same filters apply on both the universe map and inside a
              system; a war browser looks up specific conflicts; and any filter
              can be captured in a shareable link.
            </p>
          </SubSection>
          <SubSection title="Statistics">
            <p className="text-fg-muted text-sm">
              Each system has a statistics view with charts covering kill
              volume, activity over time, and the ships and entities involved.
              Universe-wide rankings list the most and least active systems.
              Statistics are fetched from zKillboard.
            </p>
          </SubSection>
        </div>
      </Section>

      <Section title="Background">
        <div className="space-y-3 text-fg-muted text-sm">
          <p>
            Killmails are public, and third-party sites have collected them for
            years. CCP (Fenris Creations) began attaching location data to
            killmails in 2015. Precisely, this change occurred on November 3,
            2015. Fun fact:{" "}
            <Hyperlink href="https://zkillboard.com/kill/49967198/">
              <strong className="text-fg-strong hover:text-capsuleer transition-colors">
                this killmail
              </strong>
            </Hyperlink>{" "}
            is the first ever killmail to include position data.
            Congratulations, Jeshi McNamara!
          </p>
          <p>
            zKillboard does include positional data in killmails, however, it
            lacks a built-in map view or spatial visualization. An extensive web
            search of third-party tools revealed no existing project that
            rendered kill positions in 3D space. This seemed like a fun
            opportunity for me to build something new for the EVE community.
          </p>
          <p>
            When I began this project in late 2025, my primary goals were to:
          </p>
          <ul className="list-disc list-inside ml-4">
            <li>
              Generate accurate 3D scenes of all EVE solar systems, including
              accurate placement of celestial objects.
            </li>
            <li>
              Accurately render kills at their true in-game coordinates within
              each solar system.
            </li>
            <li>
              Handle large volumes of kill data (tens of thousands) while
              maintaining interactive framerates.
            </li>
            <li>
              Provide rich contextual information about each kill, including
              ship types, timestamps, and involved parties.
            </li>
            <li>
              Write scalable backend infrastructure to continuously ingest new
              kills and serve data efficiently to the frontend.
            </li>
          </ul>
          <p>
            So far, all of these goals have been achieved, however, as I
            continue to develop the project, I am always considering ways to
            enhance existing features and add new ones. Suggestions and feedback
            are always welcome!
          </p>
          <p>
            For technical details about how the project is built, see the Tech
            Stack tab.
          </p>
        </div>
      </Section>
    </div>
  );
}
