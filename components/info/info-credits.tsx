import { Hyperlink, Section } from "./info-common";

export function CreditsTab() {
  return (
    <div className="space-y-8">
      <Section title="Developers">
        <div className="bg-panel-elevated border-l-2 border-capsuleer/30 px-5 py-4 max-w-md">
          <div className="flex items-start justify-start gap-2">
            <img
              src="https://images.evetech.net/characters/90721071/portrait?size=128"
              alt=""
              className="w-16 h-16 rounded-xl bg-elevated-subtle shrink-0"
            />
            <div className="flex flex-col gap-1">
              <div className="text-foreground text-base font-semibold">
                magicmq / James Makbema
              </div>
              <div className="text-fg-muted text-sm">
                Casual capsuleer and hobbyist developer
              </div>
            </div>
          </div>
          <div className="text-fg-faint text-sm mt-3">
            Built EVE Killmap as a personal project to explore PvP kill data in
            a spatially accurate, immersive 3D environment, going beyond the
            list-based and 2D interfaces available elsewhere.
          </div>
        </div>
      </Section>

      <Section title="External Code">
        <div className="space-y-0">
          <div className="py-2 border-b border-border/30">
            <Hyperlink href="https://verite.space">
              <div className="text-fg-secondary hover:text-capsuleer transition-colors text-sm font-medium">
                EVE Daily Sov Maps · verite.space
              </div>
            </Hyperlink>
            <div className="text-fg-faint text-sm mt-1">
              Code originally written for the EVE Daily Sov Maps project
              (verite.space, formerly sov.space) was adapted and extended for
              generation of the sovereignty overlay in the map view of EVE
              Killmap.
            </div>
            <div className="text-fg-subtle text-sm mt-2 italic">
              Copyright and license information for this code can be found on
              the Legal / Copyright tab.
            </div>
          </div>
        </div>
      </Section>

      <Section title="Coding Agents">
        <div className="space-y-0">
          <div className="py-2 border-b border-border/30">
            <Hyperlink href="https://claude.com/claude-code">
              <div className="text-fg-secondary hover:text-capsuleer transition-colors text-sm font-medium">
                Claude Code · Anthropic
              </div>
            </Hyperlink>
            <div className="text-fg-faint text-sm mt-1">
              Used extensively throughout the project (across the SDE parser,
              kill ingestor, backend, and frontend) for implementation,
              refactoring, debugging, and code review.
            </div>
          </div>
          <div className="py-2 border-b border-border/30">
            <Hyperlink href="https://chatgpt.com/">
              <div className="text-fg-secondary hover:text-capsuleer transition-colors text-sm font-medium">
                ChatGPT · OpenAI
              </div>
            </Hyperlink>
            <div className="text-fg-faint text-sm mt-1">
              Used in the early stages of the project for prototyping and early
              implementation. Also used for architectural design, code review,
              and debugging.
            </div>
          </div>
        </div>
      </Section>

      <Section title="Data Sources">
        <div className="space-y-0">
          <div className="py-2 border-b border-border/30">
            <Hyperlink href="https://eveonline.com">
              <div className="text-fg-secondary hover:text-capsuleer transition-colors text-sm font-medium">
                EVE Online · CCP hf. (Fenris Creations)
              </div>
            </Hyperlink>
            <div className="text-fg-faint text-sm mt-1">
              Universe data, the Static Data Export (SDE), the EVE Swagger
              Interface (ESI) API, and all in-game imagery and assets.
            </div>
          </div>
          <div className="py-2 border-b border-border/30">
            <Hyperlink href="https://developers.eveonline.com/docs/services/esi/overview/">
              <div className="text-fg-secondary hover:text-capsuleer transition-colors text-sm font-medium">
                EVE Swagger Interface (ESI)
              </div>
            </Hyperlink>
            <div className="text-fg-faint text-sm mt-1">
              Resolving kill positions and sovereignty, and (historically)
              entity names. Provided by CCP/FC.
            </div>
          </div>
          <div className="py-2 border-b border-border/30">
            <Hyperlink href="https://zkillboard.com">
              <div className="text-fg-secondary hover:text-capsuleer transition-colors text-sm font-medium">
                zKillboard
              </div>
            </Hyperlink>
            <div className="text-fg-faint text-sm mt-1">
              The source of all kill data, via its public R2Z2 API. Also polled
              for statistics displayed on the stats page in the system view.
              Created and maintained by Squizz Caphinator.
            </div>
          </div>
          <div className="py-2 border-b border-border/30">
            <Hyperlink href="https://everef.net">
              <div className="text-fg-secondary hover:text-capsuleer transition-colors text-sm font-medium">
                EVERef
              </div>
            </Hyperlink>
            <div className="text-fg-faint text-sm mt-1">
              Historical killmail archives used to backfill the database with
              kills predating this project.
            </div>
          </div>
        </div>
      </Section>

      <Section title="Fonts">
        <div className="space-y-0">
          {[
            {
              name: "Barlow",
              copyright: "2017",
              author: "The Barlow Project Authors",
              license: "SIL Open Font License 1.1",
              href: "https://github.com/jpt/barlow",
            },
            {
              name: "Barlow Condensed",
              copyright: "2017",
              author: "The Barlow Project Authors",
              license: "SIL Open Font License 1.1",
              href: "https://github.com/jpt/barlow",
            },
            {
              name: "Space Mono",
              copyright: "2016",
              author: "The Space Mono Project Authors",
              license: "SIL Open Font License 1.1",
              href: "https://github.com/googlefonts/spacemono",
            },
            {
              name: "Triglavian Font",
              copyright: "2018",
              author: "Reddit user Nickosaurus",
              license: "No license specified",
              href: "https://www.dropbox.com/s/kg0k1m804kbczmm/triglavian-completed.otf",
            },
          ].map(({ name, copyright, author, license, href }) => (
            <div
              key={name}
              className="py-2 border-b border-border/30 last:border-0"
            >
              <Hyperlink href={href}>
                <div className="text-fg-secondary hover:text-capsuleer transition-colors text-sm font-medium">
                  {name}
                </div>
              </Hyperlink>
              <div className="text-fg-faint text-sm mt-1">
                Copyright {copyright} · {author} · {license}
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
