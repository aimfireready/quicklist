# QuickList — Implementation Plan

## Overview

A simple, no-login CRUD tool for managing a sortable list of text items.
Each list is identified by a UUID in the URL, enabling shareable links and
multiple simultaneous browser tabs with different lists.

**Tech stack:** Vue.js 3 (Composition API) + Bootstrap 5

---

## Data Storage Options

### Option A: localStorage (Browser-Only)

| Aspect | Detail |
|---|---|
| **How it works** | Each list is stored as a JSON blob keyed by its UUID in the browser's `localStorage`. |
| **Persistence** | Per-browser, per-device only. Clearing browser data destroys lists. |
| **Shareability** | None. A URL opened on another device/browser shows an empty list. |
| **Capacity** | ~5–10 MB total across all keys (browser-dependent). |
| **Complexity** | Minimal — no server, no dependencies, purely static files. |
| **Multi-tab** | Works via `storage` event listener for cross-tab sync on the same browser. |
| **Cost** | Free (static hosting on GitHub Pages, Netlify, etc.). |

### Option B: Firebase Firestore (Managed Cloud, No Custom Backend)

| Aspect | Detail |
|---|---|
| **How it works** | Each list is a Firestore document keyed by UUID. Items are stored as an ordered array field. |
| **Persistence** | Cloud-based. Data survives device changes, browser clears. |
| **Shareability** | Full — anyone with the URL sees the same data. |
| **Capacity** | 1 MB per document (plenty for text lists). Free tier: 1 GB stored, 50K reads/day. |
| **Complexity** | Moderate — requires Firebase project setup, SDK integration, security rules. |
| **Multi-tab** | Real-time listeners provide automatic cross-tab and cross-device sync. |
| **Cost** | Free tier is generous for personal use. No server to manage. |

### Option C: Supabase (Managed Postgres, No Custom Backend)

| Aspect | Detail |
|---|---|
| **How it works** | A `lists` table and an `items` table in Supabase-hosted PostgreSQL. The Vue app talks directly to Supabase via its JS client. |
| **Persistence** | Cloud-based. Same benefits as Firebase. |
| **Shareability** | Full — URL-based access works across devices. |
| **Capacity** | Free tier: 500 MB database, unlimited API requests. |
| **Complexity** | Moderate — requires Supabase project, table setup, Row Level Security policies. |
| **Multi-tab** | Supabase Realtime channels provide cross-tab/device sync. |
| **Cost** | Free tier is generous. No server to manage. |

---

## Comparison: No-Backend vs. Laravel/MySQL Backend

| Criteria | A: localStorage | B: Firebase | C: Supabase | D: Laravel/MySQL |
|---|---|---|---|---|
| **Shareability** | None | Full | Full | Full |
| **Setup effort** | Trivial | Moderate | Moderate | High (server, PHP, DB, deployment) |
| **Ongoing maintenance** | None | Minimal | Minimal | Moderate (OS updates, SSL, backups) |
| **Hosting cost** | Free | Free tier | Free tier | $5–12/mo (VPS) or shared hosting |
| **Offline support** | Native | SDK offline mode | Limited | None without extra work |
| **Real-time sync** | Same-browser only | Built-in | Built-in | Requires Pusher/WebSockets |
| **Data ownership** | User's browser | Google Cloud | AWS (Supabase) | Full ownership |
| **Scalability** | N/A | Automatic | Automatic | Manual scaling |
| **Custom logic** | JS only | Cloud Functions | Edge Functions | Full server-side control |
| **Migration path** | Hard to migrate from | Moderate vendor lock-in | Postgres = portable | Full control |

**Recommendation for personal use:** **Option B (Firebase)** or **Option A (localStorage)**.
- If you only need this on your own devices and don't need to share links → **localStorage** is simplest.
- If you want shareable URLs that work across devices → **Firebase Firestore** is the least operational overhead.
- Laravel/MySQL makes sense only if you plan to add authentication, complex business logic, or want full data ownership on your own server.

---

## Proposed Architecture (Applies to All Options)

```
URL format:  https://quicklist.example.com/#/{uuid}
             https://quicklist.example.com/              (generates new UUID, redirects)
```

### Frontend Structure (Single-Page App)

```
quicklist/
├── index.html              # Entry point, loads Bootstrap 5 + Vue 3 via CDN
├── app.js                  # Vue app: router, state, CRUD logic
├── style.css               # Minimal custom styles (if any beyond Bootstrap)
└── storage/
    ├── localStorage.js     # Option A adapter
    ├── firebase.js         # Option B adapter
    └── supabase.js         # Option C adapter
```

### Core Features

1. **List identification** — UUID v4 in the URL hash (`/#/{uuid}`)
2. **Create item** — Text input (supports multi-line via textarea), appended to list
3. **Read items** — Rendered as an ordered list with item text displayed
4. **Update item** — Inline editing (click to edit, Enter/blur to save)
5. **Delete item** — Delete button per item with confirmation
6. **Reorder items** — Drag-and-drop sorting (using SortableJS or vuedraggable)
7. **New list** — Button/link to generate a fresh UUID and navigate to it
8. **Auto-save** — Changes persist immediately (no explicit "Save" button)
9. **Multi-tab** — Each tab operates on the UUID in its own URL independently

### UI Layout (Bootstrap 5)

```
┌─────────────────────────────────────────┐
│  QuickList                [+ New List]  │  ← Navbar
├─────────────────────────────────────────┤
│                                         │
│  ┌─ Add Item ────────────────────────┐  │
│  │ [Multi-line textarea         ]    │  │
│  │                        [Add]      │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌─ Items ───────────────────────────┐  │
│  │ ☰  Item text here...    [✎] [✕]  │  │  ← drag handle, edit, delete
│  │ ☰  Another item...      [✎] [✕]  │  │
│  │ ☰  Third item            [✎] [✕]  │  │
│  └───────────────────────────────────┘  │
│                                         │
│  List URL: https://.../#/abc-123        │  ← copyable link
└─────────────────────────────────────────┘
```

---

## Implementation Steps

1. **Project scaffolding** — Create `index.html` with Bootstrap 5 and Vue 3 loaded via CDN. No build tooling needed for this scope.
2. **Vue app setup** — Initialize Vue app with Composition API. Implement hash-based routing (read UUID from `window.location.hash`, generate one if missing).
3. **Storage adapter interface** — Define a simple adapter pattern (`load(uuid)`, `save(uuid, items)`) so the backend can be swapped.
4. **localStorage adapter** — Implement first adapter for immediate development/testing.
5. **CRUD operations** — Add item, display items, inline edit, delete with confirmation.
6. **Drag-and-drop sorting** — Integrate SortableJS (or vuedraggable) for reordering.
7. **UI polish** — Responsive Bootstrap layout, copy-link button, empty-state messaging.
8. **Firebase adapter** (if chosen) — Add Firestore integration as an alternative storage adapter.

---

## Questions for You

Before I begin coding, please confirm:

1. **Which storage option** do you want me to implement? (I can start with localStorage and add Firebase/Supabase later, or go straight to one.)
2. **CDN-only or build tooling?** I'm proposing CDN-only (no npm/Vite/Webpack) to keep it dead simple. Is that acceptable?
3. **Any preferences on drag-and-drop library?** SortableJS is lightweight and well-maintained.
