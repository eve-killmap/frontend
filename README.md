# EVE Killmap Frontend

The frontend for [EVE Killmap](https://eve-killmap.com), a tool for spatial visualization of kills in EVE Online. Since November 2015, every killmail has carried the coordinates of the kill. EVE Killmap places each one at that exact spot inside a to-scale rendering of the solar system it happened in, with celestials and other objects placed at their real in-game positions. Around that sits a map of the whole universe that can be colored by activity, security or sovereignty, a live feed of kills as they are posted, filters by character, corporation, alliance, faction, ship, weapon or war, playback over any time range, and per-system statistics.

This repository contains the frontend, a single-page app built with Vite, React, TypeScript, and three.js. It talks to the [backend](https://github.com/eve-killmap/backend), which serves the HTTP API and the live-kill WebSocket. [process-kills](https://github.com/eve-killmap/process-kills) polls and processes kills from zKillboard, and [process-sde](https://github.com/eve-killmap/process-sde) processes the EVE Static Data Export (SDE) into compact JSON files that are served to the frontend via CDN.

Node 20 or newer is required to run it locally. `npm install` then `npm run dev` starts the dev server, and `npm run typecheck`, `npm run lint`, `npm test` and `npm run build` are the checks that must pass before a change is merged. Note that CORS is configured on the public API to only accept requests from `eve-killmap.com`, so to make API requests, you must also run the backend locally and point `lib/net/endpoints.ts` at it.

## Bugs and feature requests

Report bugs and request features on the [issues page](https://github.com/eve-killmap/frontend/issues).

Suggestions and feedback are always welcome. This repository serves as the single entry point for reporting bugs and requesting features. Report problems here, even if they turn out to be in the backend, the ingest pipeline, or SDE processing.

When reporting bugs, be sure to include the following:

- What you did
- What you expected to happen
- What actually happened
- Browser and operating system
- Screenshot/video, if applicable
- Page URL or share link (captures the system, filters, and time range)

When requesting features, be sure to include the following:

- The current problem you are trying to solve or the question you want the site to answer
- How the feature would be useful to other users

## Credits

### Data Sources

**zKillboard** - The source of all kill data, via its public R2Z2 API. Also polled for statistics displayed on the stats page in the system view. Many thanks to Squizz Caphinator for maintaining this invaluable resource: without it, EVE Killmap would not be possible.

**CCP hf. (Fenris Creations)** - Universe data, the SDE, the EVE Swagger Interface (ESI) API, and all in-game imagery and assets.

**EVERef** - Used to backfill the database with historical killmail data from before EVE Killmap existed.

### External Code

**EVE Daily Sov Maps/verite.space** - Code originally written for the EVE Daily Sov Maps project (verite.space, formerly sov.space) was adapted and extended to generate the sovereignty overlay in EVE Killmap's map view. The copyright notice for this code can be found in the [THIRD-PARTY-NOTICES file](./THIRD-PARTY-NOTICES).

### Copyrighted Content

EVE Online and the EVE logo are registered trademarks of CCP hf. (Fenris Creations). All rights reserved worldwide. All artwork, screenshots, characters, vehicles, storylines, world facts, and other recognizable features of the intellectual property relating to EVE Online are likewise the intellectual property of CCP hf.

CCP hf. has granted permission to EVE Killmap to use EVE Online and all associated logos and designs for promotional and informational purposes on its website but does not endorse, and is not in any way affiliated with, EVE Killmap. CCP hf. is in no way responsible for the content on or functioning of this website, nor can it be liable for any damage arising from the use of this website.

### Fonts

**Barlow** - Copyright 2017 · The Barlow Project Authors · SIL Open Font License 1.1

**Barlow Condensed** - Copyright 2017 · The Barlow Project Authors · SIL Open Font License 1.1

**Space Mono** - Copyright 2016 · The Space Mono Project Authors · SIL Open Font License 1.1

**Triglavian Font** - Copyright 2018 · Reddit user Nickosaurus · No license specified

## Open Source Software

EVE Killmap (its frontend, backend, SDE processor, and kill ingestor) is open source under the MIT License. © 2026 magicmq / James Makbema. The full license text can be found in the [LICENSE file](./LICENSE).
