# Retro Arcade

A no-account classic and retro browser gaming website. The project combines original browser-playable arcade mini-games with a curated discovery shelf for DOS, handheld-era, indie HTML5, and emulator resources.

## Features

- Responsive retro-inspired game library with search, category filters, and platform filters
- Original browser games: Pixel Snake, Neon Pong, Brick Buster, and Space Pixels
- Favorites and recently played stored locally in the browser; no account required
- Curated links to browser game libraries, DOS resources, and emulator documentation
- Keyboard and touch-friendly play controls
- No commercial ROMs or BIOS files bundled with the site

## Development

The website is built with React, TypeScript, and Vite. Run `npm install` then `npm run dev` to start the development server, or `npm run build` to produce the static site in `dist/`.

## Hosting

The project is designed for free static hosting. GitHub Pages can publish the built `dist/` folder using the included Actions workflow. AppDeploy is also used for a hosted preview/deployment.

## Legal note

Emulator support does not grant permission to distribute copyrighted game images, ROMs, or BIOS files. External resources open separately and remain governed by their respective owners' terms and licenses.


## Expanded open-source game library

Retro Arcade now includes an embedded, MIT-licensed copy of [Neon Fist](https://github.com/developerrutu/neon-fist), a browser-based 1v1 fighting game. Its source and MIT license are preserved under `public/games/neon-fist/`; the embedded build disables service-worker registration and telemetry/network logging so it can run as a static no-account game.

The library also includes embedded play links to [GH Arcade](https://github.com/TMHSDigital/GH-Arcade), an MIT-licensed browser arcade collection with Breakout, Snake, Pong, Stack, Astro Blaster, Maze, Pinball, Runner, Star Siege and Neon Hop. These hosted games load in an iframe when their host permits embedding; each card offers a separate-tab fallback.

### Game-source credits

- **Neon Fist** — Copyright (c) 2026 Rutu; MIT License. Source: https://github.com/developerrutu/neon-fist
- **GH Arcade** — Copyright (c) 2026 TM Hospitality Strategies; MIT License. Source: https://github.com/TMHSDigital/GH-Arcade

ContraRun (Apache-2.0) was also reviewed as a potential Contra-style alternative, but it has no confirmed hosted play URL in the repository, so it is not advertised as an embedded game yet. No Contra ROM or original Konami assets are included.
