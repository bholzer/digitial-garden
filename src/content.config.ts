import { defineCollection } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { z } from 'astro/zod';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './collections/projects' }),
  schema: z.object({
    name: z.string(),
    description: z.string(),
    tags: z.array(z.string()),
    icon: z.string().optional(),
    accent: z.string().optional(),
    featured: z.boolean().default(false),
    url: z.string().url().optional(),
  }),
});

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './collections/posts' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()),
    draft: z.boolean().default(false),
  }),
});

export const collections = { projects, posts };
