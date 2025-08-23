import rss from "@astrojs/rss";
import { getCollection } from "astro:content";

export async function GET(context) {
  const news = await getCollection("news");
  const guides = await getCollection("guides");
  const cases = await getCollection("cases");

  const items = [...news, ...guides, ...cases]
    .map((e) => {
      const d = e.data || {};
      const title = d.title || (e.slug && e.slug.replace(/[-_]/g, " "));
      const desc = d.description || d.excerpt || "";
      const rawDate = d.publishDate || d.date || null;
      const pubDate = rawDate ? new Date(rawDate) : undefined;
      const link = `${context.site}${e.collection}/${e.slug}/`;
      return { title, description: desc, pubDate, link };
    })
    .filter((i) => i.title || i.description);

  return rss({
    title: "Digital Insight",
    description: "News, cases, and guides",
    site: context.site,
    items,
  });
}
