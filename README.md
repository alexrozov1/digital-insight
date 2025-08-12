# Digital Insight (Astro + Tailwind)

A minimal, content-first site for digital analytics: news, cases, guides, and resources.

## Quick start

1) Install deps
```bash
npm i
```

2) Run dev server
```bash
npm run dev
```

3) Build
```bash
npm run build
```

4) Preview
```bash
npm run preview
```

## Deploy (Cloudflare Pages)

Framework: **Astro**  
Build command: `npm run build`  
Output dir: `dist`

## Customize

- Edit layout in `src/layouts/BaseLayout.astro`
- Landing page in `src/pages/index.astro`
- Section pages in `src/pages/{news,cases,guides,resources}.astro`
- Global styles in `src/styles/global.css`
