---
name: Digital Garden (this site)
description: A digital garden for my notes and projects.
tags:
  - Astro
  - TypeScript
icon: mdi:cube-outline
accent: "#7c6bea"
featured: true
stage: Live
activity: Active
github: https://github.com/bholzer/digitial-garden
---

This is the site you're on. It's a place for me to keep track of what I'm working on and thinking about, with the ability to share it when I want to.

## Why a digital garden

A blog implies polish and a publishing cadence. A portfolio implies finished work. Neither fits how I think about this space. A digital garden is something in between — a living collection of notes, projects, and ideas at various stages of completeness. Things grow here over time rather than getting published and forgotten.

## How it's organized

The site is built around a few concepts:

- **Posts** — writings on specific topics, organized into subdirectories by theme when it makes sense.
- **Projects** — things I'm building, with their own detail pages for context, architecture notes, and status.
- **Hubs** — topic landing pages that pull together related posts and projects. A hub for rocketry, for example, links out to everything I've written and built in that space.

Not everything belongs to a hub. Not everything is a project. Some posts are standalone. The structure is flexible on purpose.

## Tech stack

- **Astro** — static site generator with a framework-like feel. Fast, content-focused, and easy to add interactivity where I want it.
- **Tailwind CSS v4** — CSS-based configuration, no config file. Theme tokens defined in a single stylesheet.
- **Content collections** — Astro's built-in system for typed frontmatter and file-based content. Markdown and MDX for posts, Markdown for projects.
- **TypeScript** — strict mode throughout.

I've used 11ty in the past and considered it again here. It's a solid tool, but Astro gives me more of a framework experience — component-based layouts, scoped styles, and the island architecture for sprinkling in interactivity without shipping a full JS bundle. It feels more flexible for a site that might grow in unexpected directions.

## What's next

This site will keep evolving as I do. More hubs, more projects, more writing. The structure itself will probably change as I figure out what works and what doesn't. That's the point.
