# Digital Insight (Pro) — Astro + Tailwind + Decap CMS + RSS + Sitemap + Pagefind + Giscus

## Quick start

```bash
npm i
npm run dev
```

## Build & deploy (Cloudflare Pages)
- Framework: **Astro**
- Build command: `npm run build`
- Output dir: `dist`

## Features
- Content collections (`src/content/*`) with Zod schemas
- Decap CMS at `/admin` (edit `public/admin/index.html` backend settings)
- RSS at `/rss.xml`
- Sitemap via `@astrojs/sitemap`
- Search via Pagefind (UI at `/search`)
- Giscus comments in post layout (configure repo in `PostLayout.astro`)
