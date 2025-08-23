import { defineCollection, z } from "astro:content";

/**
 * Shared fields
 */
const BasePost = z.object({
  title: z.string(),
  description: z.string().optional(),
  // Allow either "publishDate" or "date" (string or Date) for compatibility
  publishDate: z.union([z.string(), z.date()]).optional(),
  date: z.union([z.string(), z.date()]).optional(),
  tags: z.array(z.string()).optional(),
});

/**
 * Structured source link (used by News)
 */
const SourceLink = z.object({
  title: z.string().optional(),
  url: z.string().url(),
});

/**
 * Collections
 * - news: supports "sources" as an array of {title,url}, or legacy string(s)
 * - cases, guides, resources: simple posts
 */
export const collections = {
  news: defineCollection({
    type: "content",
    schema: () =>
      BasePost.extend({
        sources: z
          .union([
            z.array(SourceLink),
            // backward-compat: array of strings -> map to {url}
            z.array(z.string()).transform((arr) =>
              arr
                .map((url) => (typeof url === "string" ? url.trim() : ""))
                .filter(Boolean)
                .map((url) => ({ url }))
            ),
            // single string -> [{url}]
            z.string().transform((str) => {
              const url = (str || "").trim();
              return url ? [{ url }] : [];
            }),
          ])
          .optional(),
      }),
  }),

  cases: defineCollection({
    type: "content",
    schema: () => BasePost,
  }),

  guides: defineCollection({
    type: "content",
    schema: () => BasePost,
  }),

  resources: defineCollection({
    type: "content",
    schema: () => BasePost,
  }),
};
