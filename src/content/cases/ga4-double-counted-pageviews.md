---
title: "Case: Fixing double-counted pageviews in GA4"
excerpt: "Diagnosing inflated pageviews from duplicate GTM triggers + SPA routing, then validating the fix."
publishDate: "2025-08-14"
tags: ["Advanced","Playbook"]
topics: ["GA4","GTM","QA"]
type: "case"
seo:
  title: "Fixing double-counted GA4 pageviews"
  description: "Step-by-step: GTM triggers, SPA router, and GA4 debug comparisons."
---

## Symptoms
- Pageviews ~1.6x baseline after SPA migration.
- DebugView shows duplicate `page_view` on route change.

## Checks
1. GTM preview: multiple tags firing on `historyChange` and on a custom event.
2. Router: both `pushState` listener and route hook send events.

## Fix
- Emit exactly **one** `page_view` per route.
- Debounce history changes; dedupe if same path within 500ms.

## Validate
- Compare 7‑day pre/post; <5% drift accepted.
- Segment by route group to detect regressions.
