import { Hyperlink, Section } from "./info-common";
import { LicenseNotice } from "./license-notice";
import mitLicense from "@/LICENSE?raw";
import thirdPartyNotices from "@/THIRD-PARTY-NOTICES?raw";

export function LegalTab() {
  return (
    <div className="space-y-8">
      <Section title="Third-Party Code">
        <div className="space-y-3 text-fg-faint text-sm">
          <Hyperlink href="https://verite.space">
            <div className="text-fg-secondary hover:text-capsuleer transition-colors text-sm font-medium">
              EVE Daily Sov Maps · verite.space
            </div>
          </Hyperlink>
          <p>
            Original source code Copyright (c) 2007, [AEGL, UNL] Paladin Vent.
            Additional authors of the original code include [CE] Mirida
            (Multithreading), [FREEE] Verite Rendition (Various, General Upkeep:
            Aug 2007 to Present), and [MOP] Calistra &quot;Draekas&quot;
            Darkwater (Multiple-Instance Name placement).
          </p>
          <LicenseNotice label="BSD 3-Clause" text={thirdPartyNotices} />
        </div>
      </Section>

      <Section title="Copyright &amp; Licensing">
        <div className="space-y-3 text-fg-faint text-sm">
          <p>
            EVE Online and the EVE logo are registered trademarks of CCP hf.
            (Fenris Creations). All rights reserved worldwide. All artwork,
            screenshots, characters, vehicles, storylines, world facts, and
            other recognizable features of the intellectual property relating to
            EVE Online are likewise the intellectual property of CCP hf.
          </p>
          <p>
            CCP hf. has granted permission to EVE Killmap to use EVE Online and
            all associated logos and designs for promotional and informational
            purposes on its website but does not endorse, and is not in any way
            affiliated with, EVE Killmap. CCP hf. is in no way responsible for
            the content on or functioning of this website, nor can it be liable
            for any damage arising from the use of this website.
          </p>
        </div>
      </Section>

      <Section title="Open Source Software">
        <div className="space-y-3 text-fg-faint text-sm">
          <p>
            EVE Killmap is built entirely on open-source software. See the Tech
            Stack tab for the full list of technologies used across the SDE
            parser, kill ingestor, backend, and frontend.
          </p>
          <p>
            EVE Killmap (its frontend, backend, SDE processor, and kill
            ingestor) is open source under the MIT License. © 2026 magicmq /
            James Makbema.
          </p>
          <LicenseNotice label="MIT License" text={mitLicense} />
        </div>
      </Section>
    </div>
  );
}
