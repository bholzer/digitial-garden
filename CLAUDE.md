# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Start dev server at localhost:4321
- `npm run build` — Production build to `./dist/`
- `npm run preview` — Preview production build locally

## Architecture

Astro 5 site using Tailwind CSS v4 (via `@tailwindcss/vite` plugin). TypeScript in strict mode.

**Layout structure:** Pages use `BaseLayout.astro` which provides the HTML shell, includes `Header` and `Footer` components, and accepts a `pageTitle` prop. Pages pass content via Astro's `<slot />`.

**Styling:** Tailwind v4 is configured through `src/styles/global.css` and loaded via the Vite plugin in `astro.config.mjs`. No Tailwind config file — v4 uses CSS-based configuration. Theme tokens (colors, fonts) are defined in `global.css` under `@theme`.

**Content collections:** Defined in `src/content.config.ts`. Content lives in `collections/` (not `src/content/`).
- `projects` — Markdown files in `collections/projects/`. Schema: name, description, tags, icon, accent, featured, stage (Prototype/Live/Complete), activity (Active/Paused/Archived), url.
- `posts` — Markdown/MDX files in `collections/posts/`. Schema: title, description, date, tags, draft, featured.

**Shared data:** `src/data/socials.ts` exports social links used across the site (Footer, homepage).

**Utilities:** `src/utils/stagger.ts` exports `createStagger(ms)` for parametric animation delays across pages.

**Pages:** Home (`/`), Posts (`/posts`), Projects (`/projects`), About (`/about`). Post detail pages at `/posts/[slug]`.
