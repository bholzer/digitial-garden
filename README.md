# Personal Garden

Brennan Holzer's personal website and digital garden. Built with Astro 5, Tailwind CSS v4, and TypeScript.

## Project Structure

```text
collections/
├── posts/              # Blog posts (Markdown/MDX)
└── projects/           # Project entries (Markdown)
src/
├── components/         # Reusable UI components (Header, Footer, SummaryCard)
├── data/               # Shared data (socials.ts)
├── layouts/            # BaseLayout — shared HTML shell for all pages
├── pages/
│   ├── index.astro     # Home page (featured projects & posts)
│   ├── about.astro     # Bio, skills, and interests
│   ├── posts/          # Post listing and detail pages
│   └── projects/       # Project gallery
├── styles/
│   └── global.css      # Tailwind v4 entry point and theme tokens
└── utils/
    └── stagger.ts      # Parametric animation delay helper
```

## Development

```sh
npm install           # Install dependencies
npm run dev           # Start dev server at localhost:4321
npm run build         # Production build to ./dist/
npm run preview       # Preview production build locally
```
