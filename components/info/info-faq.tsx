import { useState } from "react";
import { Hyperlink, Section } from "./info-common";
import { ChevronDown } from "lucide-react";

export function FAQTab() {
  return (
    <Section title="Frequently Asked Questions">
      <FAQItem question="How can I report a bug or request a feature?">
        <p>
          Thanks for your interest in contributing! To report a bug or request a
          feature, please open an issue on the{" "}
          <Hyperlink href="https://github.com/eve-killmap/frontend/issues">
            <strong className="text-fg-strong hover:text-capsuleer transition-colors">
              frontend GitHub repository
            </strong>
          </Hyperlink>
          . Please include as much detail as possible, including screenshots,
          steps to reproduce, and any other relevant information. If you have a
          feature request, please describe the desired functionality and how it
          would improve the user experience.
        </p>
      </FAQItem>
      <FAQItem question="What kills are included in the data?">
        <p>
          Every kill that occurred on or after November 03, 2015 at 12:39 UST is
          included, as long as the kill was posted to zKillboard. CCP/FC doesn't
          make killmails public; they must be shared by an involved player. The
          backend portion of EVE Killmap continuously fetches kills as they are
          posted to zKillboard. It also performs cross-checking of database
          numbers with daily kill totals in order to fetch kills that are posted
          many days/months/years after they occurred.
        </p>
      </FAQItem>
      <FAQItem question="Why do numbers on EVE Killmap disagree with zKillboard?">
        <div className="space-y-2">
          <p>Three reasons:</p>
          <ul className="list-disc list-outside pl-4 space-y-1">
            <li>
              EVE Killmap only includes kills that contain position data. Some
              kills posted to zKillboard do not include position data, even ones
              that occurred recently. Why they lack position data isn't entirely
              clear, but it seems to occur most often with anchorable/deployable
              structures. For example,{" "}
              <Hyperlink href="https://zkillboard.com/kill/138374251/">
                <strong className="text-fg-strong hover:text-capsuleer transition-colors">
                  mobile warp disruptors
                </strong>
              </Hyperlink>
              ,{" "}
              <Hyperlink href="https://zkillboard.com/kill/138400543/">
                <strong className="text-fg-strong hover:text-capsuleer transition-colors">
                  mobile tractor units
                </strong>
              </Hyperlink>
              , and{" "}
              <Hyperlink href="https://zkillboard.com/kill/138395829/">
                <strong className="text-fg-strong hover:text-capsuleer transition-colors">
                  rookie ships
                </strong>
              </Hyperlink>{" "}
              are frequent culprits.
            </li>
            <li>
              As stated in the previous FAQ item, CCP/FC began including
              position data in killmails on November 03, 2015 at 12:39 UST.
              Kills that occured before that date are not included in the EVE
              Killmap data set.
            </li>
            <li>
              Some data on EVE Killmap is refreshed periodically (once every 30
              minutes, for example). For that reason, you may see data that's
              slightly out of date from time to time.
            </li>
          </ul>
        </div>
      </FAQItem>
      <FAQItem question="Why is the Hot Areas overlay empty when I open the map?">
        <p>
          Hot Areas is painted only from kills your browser has received over
          the live kill feed since you opened EVE Killmap, inside a rolling
          one-hour window. It is not seeded from history, so it starts empty and
          fills as kills arrive. Leave the page open, or navigate between the
          map and system views, and it keeps accumulating.
        </p>
      </FAQItem>
      <FAQItem question="The system view is very laggy. What can I do to optimize performance?">
        <div className="space-y-2">
          <p>
            I've tried to optimize the system view as best as possible, but
            with, at most, hundreds of thousands of kills being displayed
            on-screen at once, some form of lag is expected. This can be
            particularly noticeable when zoomed into areas of very high kill
            density (such as Jita IV-4, the Nourvukaiken gate in Tama, etc.).
            Performance will also inevitably be worse in systems where kill
            density is relatively evenly spaced out. The common denominator is
            that in these situations, kills cluster poorly.
          </p>
          <p>Here are a few things you can do to improve performance:</p>
          <ul className="list-disc list-outside pl-4 space-y-1">
            <li>
              <span>Filter kills</span>: Narrow the time range, only show
              certain ship types, or only show kills within range of a single
              object in the solar system. This is the single most effective way
              to reduce lag. Fewer kills on-screen means fewer instances to
              render each frame.
            </li>
            <li>
              <span>Zoom in</span>: The octree clustering collapses distant
              kills into single spheres. Zooming into a specific area of
              interest lets more of the scene stay clustered, reducing the
              number of individual kill markers being rendered.
            </li>
            <li>
              <span>Use a Chromium-based browser</span>: Google Chrome,
              Microsoft Edge, Opera/Opera GX, and other Chromium-based browsers
              typically have the best WebGL performance. WebGL performance is
              notoriously poor on Firefox. In my own testing, frame rates
              typically average 20-30fps higher on Google Chrome compared to
              Firefox.
            </li>
            <li>
              <span>Enable hardware acceleration</span>: Make sure GPU hardware
              acceleration is enabled in your browser settings. Without it,
              WebGL rendering falls back to software and will be significantly
              slower.
            </li>
            <li>
              <span>Close other tabs and applications</span>: The system view is
              GPU- and CPU-intensive. Freeing up system resources by closing
              unused tabs and background applications can noticeably improve
              framerates.
            </li>
          </ul>
        </div>
      </FAQItem>
      <FAQItem question="Where does the kill data come from?">
        <p>
          Kill data primarily comes from zKillboard's{" "}
          <Hyperlink href="https://github.com/zKillboard/zKillboard/wiki/API-(R2Z2)">
            <strong className="text-fg-strong hover:text-capsuleer transition-colors">
              R2Z2 kill API
            </strong>
          </Hyperlink>
          . The backend kill ingestor script uses the R2Z2 API to pull kill as
          they are uploaded to zKillboard. When a kill is pulled, it's
          permanently stored into a PostgreSQL database, along with metadata for
          characters, corporations, alliances, and wars associated with the
          kill. In the event that this system misses any uploaded kills, the
          kill ingestor system performs daily cross-checking and fetches any
          missed kills directly from ESI (Eve Online's public API).
        </p>
      </FAQItem>
      <FAQItem question="Why is November 03, 2015 the earliest date I can select in the settings?">
        <p>
          CCP/FC did not begin attaching position data to killmails until
          November 3, 2015. Therefore, any kills that occurred before that date
          lack the necessary data to be shown here. This is a limitation of the
          available data rather than EVE Killmap itself.
        </p>
      </FAQItem>
      <FAQItem question="Some data appears to be stale or missing. Why is that?">
        <p>
          The backend kill processing script juggles a lot of data and performs
          many tasks. One such task is updating the database with the latest
          kill data. Character, corporation, alliance, and war metadata also
          require regular updates. This metadata is pulled from zKillboard and
          ESI at regular intervals, in order to maintain politeness to the APIs.
          As a consequence, you may occasionally see stale or missing data.
        </p>
      </FAQItem>
      <FAQItem question="Some warpable in-game objects/locations aren't rendered in the system view. Why is that?">
        <div className="space-y-2">
          <p>
            EVE Killmap is able to render all objects that CCP/FC includes in
            the Static Data Export (SDE). This includes celestials (stars,
            planets, moons, asteroid belts), stargates, and NPC stations. You
            will also see disrupted stargates and Upwell Moon Mining Beacons.
            These aren't published in the SDE, but they are included in
            client-side static data, so these data are extracted from the game
            files and processed by the SDE parser script alongside the regular
            SDE data. Other warpable structures, such as Jove Observatories and
            Encounter Surveillance Systems, are streamed to the client when the
            player enters a system. They aren't included in the SDE or
            client-side static data, so they can't be rendered here.
          </p>
          <p>
            Warp-in points for stars, planets, moons, and asteroid belts are
            also rendered, however, their position is not included in the SDE.
            CCP/FC generates these positions algorithmically based on some
            star/planet/moon properties.{" "}
            <Hyperlink href="https://developers.eveonline.com/docs/guides/useful-formulae/">
              <strong className="text-fg-strong hover:text-capsuleer transition-colors">
                Visit this page
              </strong>
            </Hyperlink>{" "}
            for the formulae and parameters used to calculate warp-in points.
          </p>
        </div>
      </FAQItem>
      <FAQItem question="Why are some kills shown as clusters instead of individual markers?">
        <p>
          EVE Killmap organizes all kills in the current system into an octree.
          On each frame, a traversal algorithm projects every octree node onto
          the screen and checks its size. When a node projects to less than 8
          pixels, all the kills it contains are collapsed into a single cluster
          sphere; its opacity scales with the log of the kill count so dense
          areas stand out more. As you zoom in, nodes grow past the threshold
          and expand back into individual kill markers. Clustering kills is a
          necessary step in order to maintain performance at interactive
          framerates.
        </p>
      </FAQItem>
      <FAQItem question="How are you able to render orbit rings for planets and moons exactly as they appear in-game?">
        <div className="space-y-2">
          <p>
            Great question! The SDE provides the 3D position of each celestial
            at epoch but no explicit orbit data. From that one position, the
            full orbit ring can be reconstructed using two{" "}
            <Hyperlink href="https://en.wikipedia.org/wiki/Quaternions_and_spatial_rotation">
              <strong className="text-fg-strong hover:text-capsuleer transition-colors">
                quaternion
              </strong>
            </Hyperlink>{" "}
            rotations.
          </p>
          <p>
            Radius is the 3D distance from the parent body to the celestial.
            Orientation is the harder part. The direction vector from parent to
            celestial lies in the orbital plane, and because EVE&apos;s SDE
            positions already encode inclination (a tilted orbit produces a
            correspondingly tilted 3D position), that direction alone is enough
            to reconstruct the correct plane. A flat ring geometry is first
            rotated so its local radial axis aligns with the parent → celestial
            direction, then rotated a further 90° around that axis to tilt the
            ring from perpendicular into the orbital plane. The resulting ring
            passes exactly through the celestial&apos;s SDE position.
          </p>
          <pre className="bg-elevated-subtle text-2xs font-mono text-fg-muted p-3 overflow-x-auto">
            {`center    = np.array(star_or_planet_pos)   # parent body (from SDE)
celestial = np.array(planet_or_moon_pos)   # celestial position (from SDE)

# 1. Orbit radius: straight 3D distance
diff       = celestial - center
radius     = np.linalg.norm(diff)
radial_dir = diff / radius        # unit vector: parent → celestial

# 2. Rotate the reference axis (-1,0,0) onto radial_dir.
#    Aligns the ring's local frame with the radial direction.
q_align = quaternion_between_vectors((-1, 0, 0), radial_dir)

# 3. Tilt the ring 90° around the radial axis so it lies in the
#    orbital plane rather than perpendicular to it.
q_tilt  = quaternion_from_axis_angle((-1, 0, 0), math.pi / 2)

# 4. Combined orientation (q_align applied first, then q_tilt)
q_final = q_align * q_tilt

# Result: a ring of 'radius' centered at 'center', oriented by 'q_final'.
# It passes exactly through 'celestial', matching the in-game orbit ring.`}
          </pre>
          <p>
            A fragment shader then draws the ring with a thin, anti-aliased
            bright core (using{" "}
            <code className="text-fg-secondary bg-elevated-subtle px-0.5">
              fwidth
            </code>{" "}
            for pixel-perfect width) surrounded by a soft exponential glow, and
            fades the ring out as the camera approaches to avoid z-fighting with
            the planet mesh.
          </p>
        </div>
      </FAQItem>
    </Section>
  );
}

function FAQItem({
  question,
  children,
}: {
  question: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="border-b border-border/40 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 py-3 text-left cursor-pointer group"
        aria-expanded={open}
      >
        <span className="text-fg-secondary group-hover:text-fg-strong transition-colors text-sm font-medium leading-snug">
          {question}
        </span>
        <ChevronDown
          size={15}
          className={`shrink-0 text-fg-subtle group-hover:text-fg-muted transition-all duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <div className="pb-3 text-fg-muted text-sm">{children}</div>}
    </div>
  );
}
