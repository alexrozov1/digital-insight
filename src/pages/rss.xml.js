import rss from "@astrojs/rss";
import { getCollection } from "astro:content";

export async function GET(context) {
  const news = await getCollection("news");

  return rss({
    title: "Digital Insight – News",
    description: "Latest news and insights on analytics, media buying, and digital tools.",
    site: context.site,
    items: news.map((post) => ({
      title: post.data.title,
      description: post.data.excerpt || post.data.title,
      pubDate: new Date(post.data.date || post.data.publishDate || Date.now()),
      link: `/news/${post.slug}/`,
    })),
  });
}
