# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Start dev server at localhost:4321
- `npm run build` — Production build to `./dist/`
- `npm run preview` — Preview production build locally

## Architecture

Astro 5 site using Tailwind CSS v4 (via `@tailwindcss/vite` plugin). TypeScript in strict mode.

**Layout structure:** Pages use `BaseLayout.astro` which provides the HTML shell, includes `Header` and `Footer` components, and accepts a `pageTitle` prop. Pages pass content via Astro's `<slot />`.

**Styling:** Tailwind v4 is configured through `src/styles/global.css` (just `@import "tailwindcss"`) and loaded via the Vite plugin in `astro.config.mjs`. No Tailwind config file — v4 uses CSS-based configuration.

**Note:** `src/pages/about.astro` does not yet use `BaseLayout` — it has its own inline HTML structure.
