import { defineCollection, z } from "astro:content";

/** Base fields shared by posts */
const BasePost = z.object({
  title: z.string(),
  description: z.string().optional(),
  // accept either publishDate or date, string or Date
  publishDate: z.union([z.string(), z.date()]).optional(),
  date: z.union([z.string(), z.date()]).optional(),
  tags: z.array(z.string()).optional(),
});

/** Structured source link for News */
const SourceLink = z.object({
  title: z.string().optional(),
  url: z.string().url(),
});

export const collections = {
  news: defineCollection({
    type: "content",
    schema: () =>
      BasePost.extend({
        sources: z
          .union([
            z.array(SourceLink),
            // back-compat: array of strings -> [{ url }]
            z.array(z.string()).transform((arr) =>
              arr
                .map((u) => (typeof u === "string" ? u.trim() : ""))
                .filter(Boolean)
                .map((url) => ({ url }))
            ),
            // back-compat: single string -> [{ url }]
            z.string().transform((s) => {
              const url = (s || "").trim();
              return url ? [{ url }] : [];
            }),
          ])
          .optional(),
      }),
  }),

  cases: defineCollection({ type: "content", schema: () => BasePost }),
  guides: defineCollection({ type: "content", schema: () => BasePost }),
  resources: defineCollection({ type: "content", schema: () => BasePost }),
};
