import { z, defineCollection } from 'astro:content';

const baseFields = {
  title: z.string(),
  slug: z.string().optional(),
  excerpt: z.string().max(200).optional(),
  publishDate: z.string().or(z.date()),
  updatedDate: z.string().or(z.date()).optional(),
  author: z.string().default('Digital Insight'),
  tags: z.array(z.string()).default([]),
  topics: z.array(z.string()).default([]),
  coverImage: z.string().optional(),
  ogImage: z.string().optional(),
  canonicalUrl: z.string().url().optional(),
  seo: z.object({
    title: z.string().optional(),
    description: z.string().optional()
  }).optional()
};

const news = defineCollection({ type: 'content', schema: z.object({
  ...baseFields,
  type: z.literal('news').default('news')
})});

const cases = defineCollection({ type: 'content', schema: z.object({
  ...baseFields,
  type: z.literal('case').default('case')
})});

const guides = defineCollection({ type: 'content', schema: z.object({
  ...baseFields,
  type: z.literal('guide').default('guide'),
  read: z.string().optional()
})});

const resources = defineCollection({ type: 'content', schema: z.object({
  ...baseFields,
  type: z.literal('resource').default('resource'),
  kind: z.string().default('Template')
})});

export const collections = { news, cases, guides, resources };
