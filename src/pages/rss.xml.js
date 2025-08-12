import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const all = [
    ...(await getCollection('news')),
    ...(await getCollection('cases')),
    ...(await getCollection('guides')),
    ...(await getCollection('resources'))
  ].sort((a,b) => new Date(b.data.publishDate) - new Date(a.data.publishDate));

  return rss({
    title: 'Digital Insight',
    description: 'News, cases, and resources in digital analytics.',
    site: context.site,
    items: all.map((p) => ({
      title: p.data.title,
      pubDate: new Date(p.data.publishDate),
      description: p.data.excerpt,
      link: `/${p.collection}/${p.slug}/`
    }))
  });
}
