# FuelPulse — Petrol Station Tracker Analysis

## Purpose

A crowdsourced, real-time map of petrol station status in **Lagos, Nigeria**. It solves the fuel-crisis pain points: opaque pump prices, hourly availability swings, ghost stations (listed on maps but permanently closed), and poor last-mile GPS. Community members report price/availability/queue data; the app aggregates it into a live map with trust scores. A second "Fleet Dashboard" targets logistics managers (depot-centric routing, analytics, CSV export).

## Architecture

```
Frontend: React 19 + Vite 7 (SPA)
Map:      Leaflet + react-leaflet (CARTO basemap)
Backend:  Firebase Firestore (real-time) + Firebase Auth + Storage
Deploy:   Netlify (static) + Netlify Function traffic-proxy.js
Mobile:   Capacitor 8 wrapper → native Android, OTA via Capgo
```

**Data model** (Firestore, see `firestore.rules`):
- `stations/{id}` — denormalized live state: `status`, `prices.{fuelType}`, `availability.{fuelType}`, `queue.{fuelType}`, `confirmations[]`, `flags[]`, `hasPhoto`, trust fields
- `stations/{id}/reports` — every user submission, weighted audit log
- `stations/{id}/reviews`, `stations/{id}/priceHistory`, `stations/{id}/pings`, `stations/{id}/price_verifications`
- `users/{uid}` — role (`admin`/`manager`/`user`), `priceAlerts`

**Key flow** — `subscribeToStations` (`src/services/stationService.js:12`) does a full-collection `onSnapshot`, then derives `queueStatus`, `freshnessStatus`, `trustLevel` client-side, and hard-filters to a Lagos bounding box (6.2–6.8 lat, 2.5–4.5 lng). Reports go through `updateStationStatus`, which uses a **weighted consensus system** (`verificationService.js`): photo=1.0, logged-in=0.6, guest=0.2 weight; a single change requires threshold 0.7 or a 1.0-weight report.

**Monolith caveat**: `src/App.jsx` is 1000+ lines holding global state, modals, and business logic; `MapContainer.jsx` is 37KB. The components folder is well-split, but the service layer carries most real logic.

## Strengths

- **Real trust/anti-spam engineering**: weighted report consensus, duplicate-report detection, rate limiting, freshness decay (queue ≤4h), photo evidence gating — unusually sophisticated for this scale
- **Resilient geo layer**: Google Distance Matrix via Netlify proxy with graceful Haversine/Lagos-speed fallback; OSM geocode fallback
- **RBAC enforced at DB level** with field-level restrictions (users can only touch status/queue/availability keys)
- **Good UX for weak-GPS reality**: meter-precision distances, manual map pinning, ±accuracy telemetry
- **Full product surface**: PWA + Capacitor Android + Capgo OTA, alerts, reviews, fleet tools, price history

## Weaknesses

- **Security rules holes** (`firestore.rules:41-44`): reports subcollection allows **unauthenticated create** with **no field/rate validation** — anyone can spam or write arbitrary data; `activity` allows open create
- **Firebase config committed** (`src/services/firebase.js:9-14`) with real API keys; `.env.example` exists but the app hardcodes config instead of reading `VITE_*` vars
- **Client does N+1 reads**: `calculateConsensusValue` and rate-limit checks read per-station subcollections in loops (scales badly); consensus should live in Firestore/cloud functions
- **Unbounded subscriptions**: `subscribeToStations` snapshots the *entire* stations collection and every full `stations` read in rate-limit logic downloads all docs
- **Dead/legacy code**: `waitTime` "legacy, unused", commented-out decay logic, unused `initData`-style seeds in App.jsx, `calc-distances.js`/`fix-*.js` one-off scripts at repo root
- **No tests** — zero test framework; only ad-hoc scripts (`test-navigation.js`, `verify-filters.js`) and lint output files committed
- **Performance risk**: `subscribeToStationPhotos` requires a composite index that silently fails to `[]`; report writes are non-transactional (parallel `updateDoc` + `addDoc`)
- **Duplicate report/consensus for queue**: queue status only reflects `queueStatus` derived from max queue minutes, while `status` is set from availability consensus — occasional inconsistency

## Missing Features / Gaps

- **Backend authority**: no cloud functions (or scheduled triggers) for consensus aggregation, alert triggering, or data cleanup — price alerts only fire when another user submits a report
- **Admin controls**: no moderation UI for flagging abusive reports; "promote user" tool is ad-hoc (`promote-admin.mjs`)
- **Schema/migration tooling**: no versioning; manual `.mjs` fix scripts in root are the only "migrations"
- **Monitoring/analytics**: no error tracking (Sentry), no Firebase Analytics beyond manual `activity` logging, no deployment pipelines/CI
- **Geo features not implemented despite roadmap claims**: traffic integration exists only as fallback; offline neighborhoods, SMS bridge not built
- **Photos OCR** is "mock" (`CHANGELOG`: AI price extraction) — placeholder logic
- **Auth limitation**: email/password only — no Google/phone OAuth
- **Live visitor count** (`getLiveVisitors`) reads stale pings never cleaned (TTL-less `pings` subcollection)

The core concept is strong and the consensus/trust engine is genuinely well-designed; the biggest liabilities are the permissive Firestore rules, client-side scaling, and the absence of server-side authority and tests.
