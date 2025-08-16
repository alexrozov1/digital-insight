import { defineCollection, z } from "astro:content";

/**
 * Common fields shared by all collections.
 * - Accept either `date` or `publishDate` (both optional)
 * - Optional `excerpt`, `tags`, `topics`, `type`, `seo`
 */
const baseFields = {
  title: z.string(),
  date: z.string().optional(),
  publishDate: z.string().optional(),
  excerpt: z.string().optional(),
  tags: z.array(z.string()).optional(),
  topics: z.array(z.string()).optional(),
  type: z.string().optional(),
  seo: z.any().optional(),
};

const news = defineCollection({
  type: "content",
  schema: z.object(baseFields),
});

const cases = defineCollection({
  type: "content",
  schema: z.object(baseFields),
});

const guides = defineCollection({
  type: "content",
  schema: z.object(baseFields),
});

const resources = defineCollection({
  type: "content",
  schema: z.object(baseFields),
});

export const collections = { news, cases, guides, resources };
