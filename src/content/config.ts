import { defineCollection, z } from "astro:content";

const DateLike = z.union([z.string(), z.date()]); // accept ISO string OR Date

const baseFields = {
  title: z.string(),
  date: DateLike.optional(),
  publishDate: DateLike.optional(),
  excerpt: z.string().optional(),
  tags: z.array(z.string()).optional(),
  topics: z.array(z.string()).optional(),
  type: z.string().optional(),
  seo: z.any().optional(),
};

const news = const SourceLink = z.object({ title: z.string().optional(), url: z.string().url() });

defineCollection({ type: "content", schema: z.object(baseFields) });
const cases = defineCollection({ type: "content", schema: z.object(baseFields) });
const guides = defineCollection({ type: "content", schema: z.object(baseFields) });
const resources = defineCollection({ type: "content", schema: z.object(baseFields) });

export const collections = { news, cases, guides, resources };
