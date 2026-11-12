# Review of revamp_2026

Reviewed at commit d353a70 (Expo SDK 58.0.20, RN 0.88.0). Web build served from `expo export` and driven with headless Chromium (Playwright, 390x844 viewport), seeded through the onboarding "Explore a sample closet" path.

## Tooling results

| Check | Result |
|---|---|
| `npm install` | PASS (lockfile gets modified by install; not committed) |
| `npm run typecheck` | PASS, no errors |
| `npm run lint` | PASS, no warnings |
| `npx expo-doctor` | FAIL 19/20: installed packages are behind the SDK 58 expected patch versions (see F1) |
| `npx expo export --platform web` | PASS, all routes bundled |

## Route results (web)

| Route | Result | Notes |
|---|---|---|
| `onboarding/index` | PASS | Root `/` redirects here when not onboarded |
| `onboarding/location` | PASS | Native location prompt not testable |
| `onboarding/city` | PASS | Rendered only; city search is a network call, not exercised |
| `onboarding/first-items` | PASS | "Explore a sample closet" seeds 9 items, 7 outfits, lands on Home |
| `(tabs)/index` | PASS | "Weather offline" fallback path shown (no location set; no weather network from the container) |
| `(tabs)/closet` | PASS | 9 items, filters render |
| `(tabs)/outfits` | PASS | |
| `(tabs)/calendar` | PASS | Month grid, logged-day count updates after logging |
| `(tabs)/profile` | PASS | Theme and units persist across reload (verified in persisted store) |
| `camera` | PASS (partial) | Permission-denied state renders; capture is native-only, static review below |
| `processing` | PASS (partial) | Visited directly with no capture; see F4 |
| `upload-failed` | PASS | |
| `item/new` | PASS | Form renders (no photo when opened directly) |
| `item/[id]` | PASS | |
| `item/[id]/edit` | PASS | Rename saves; delete shows confirm dialog |
| delete + undo | PASS | Soft delete sets `pendingDelete`; undo restores the item and outfit links |
| `outfit/[id]` | PASS | Missing id shows "This outfit was deleted." |
| `builder` / `pick` | PASS | Slot pick, Done, Save outfit, tag sheet, Done saves and opens outfit detail |
| `search` | PASS | "navy" matches 2 items; no-match empty state shown |
| `log` | PASS | Logging an outfit updates calendar |
| `recommendations` | PASS | Renders with offline-weather fallback |
| `tags` | PASS | Counts render, add tag opens |
| `location` | PASS | Renders; geocoding not exercised |
| unknown URL (`/nope`) | FAIL, fixed | See F2 |

No console errors or page errors on any route. The only warning is `[expo-notifications] Listening to push token changes is not yet fully supported on web`.

## Findings

| # | Severity | Finding | Where | Status |
|---|---|---|---|---|
| F1 | Low | `expo-doctor` reports 20 packages behind the SDK 58 expected patch versions (e.g. expo 58.0.20 vs 58.0.24, expo-router 58.0.27 vs 58.0.31) and `react-native-safe-area-context` 5.10.1 vs ~5.11.1 (minor). `package.json` ranges (`~58.0.20`) would accept newer patches, so `npx expo install --fix` should be enough. | `package.json` | Follow-up Q1. Not changed: acceptance forbids dependency changes beyond what doctor requires and a bump needs a native rebuild check. |
| F2 | Low | Unknown routes rendered a blank screen (no `+not-found`). Repro: open `/nope`. | `src/app/` | Fixed: `src/app/+not-found.tsx` redirects to `/`. Verified on web. |
| F3 | Low | No `Notifications.setNotificationHandler`, so the daily reminder will not display if it fires while the app is in the foreground (iOS/Android). | `src/lib/notifications.ts` | Follow-up Q2. Needs device check and docs lookup for v58 handler shape. |
| F4 | Low | `/processing` with no capture calls `router.back()`; on a cold deep link with no history this has nowhere to go. | `src/app/processing.tsx:38-41` | Follow-up (fold into Q2 or ignore). |
| F5 | Info | README says media library "needs full photo-library access"; the code requests write-only (`requestPermissionsAsync(true)`). Cosmetic doc mismatch. | `README.md`, `src/components/ShareSheet.tsx:41` | Not fixed |

## Static review of native-only code (not runnable here)

- `camera.tsx`: permission states handled (granted, can ask, denied); capture errors alert; busy guard prevents double shots. No issues found.
- `capture.ts`: gallery picker uses `mediaTypes: ['images']`, the current form. OK.
- `notifications.ts`: skips on web, cancels then reschedules, DAILY trigger uses `SchedulableTriggerInputTypes`. See F3.
- `photos.ts`: uses the `Directory`/`File` API from expo-file-system v58; 30 s timeout via AbortController. Native file writes unverified.
- `ShareSheet.tsx`: `Asset.create` after write-only permission; failures alert. Unverified on device.

## Not tested

Native camera, location permission, geocoding/weather network calls, notification scheduling, media library save, share sheet, background-removal service (env var unset), dark-mode visual correctness (only the persisted setting was checked), tablet/wide layouts.

## Proposed follow-up quests

- **Q1** Run `npx expo install --fix`, rebuild a dev client, and smoke-test camera/notifications/media library on a device.
- **Q2** Add a foreground notification handler and device-test the morning reminder; harden `/processing` for no-history entry.
- **Q3** Add Playwright smoke tests for the web routes above to the repo so this review can be re-run.
