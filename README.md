# Personal Garden

Brennan Holzer's personal website and digital garden. Built with Astro 5, Tailwind CSS v4, and TypeScript.

## Project Structure

```text
src/
├── components/       # Reusable UI components (Header, Footer, SummaryCard)
├── layouts/          # BaseLayout — shared HTML shell for all pages
├── pages/
│   ├── index.astro   # Home page
│   ├── about.astro   # About page
│   └── posts/        # Blog post listing and individual post pages
└── styles/
    └── global.css    # Tailwind v4 entry point
```

## Development

```sh
npm install           # Install dependencies
npm run dev           # Start dev server at localhost:4321
npm run build         # Production build to ./dist/
npm run preview       # Preview production build locally
```
