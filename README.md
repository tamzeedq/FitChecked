# FitChecked

FitChecked is a local-first wardrobe app. You photograph your clothes, build and tag outfits, get weather-aware daily suggestions, and log what you wore on a calendar. Everything is stored on the device. There is no account and no backend.

The UI is built from the "Linen" design handoff: Plus Jakarta Sans, a sage/linen palette, and light and dark themes.

Stack: Expo SDK 58, expo-router (typed routes), TypeScript, React Native 0.88, zustand.

## Getting started

```sh
npm install
npx expo start
```

From the Expo CLI you can open the app in Expo Go, a simulator or emulator, or the web (`w`). Most screens work in Expo Go and on the web. Some features need a development build:

- **Camera capture** (`expo-camera`) needs a physical device. Choosing photos from the library works everywhere.
- **Daily outfit reminders** (`expo-notifications`) are skipped on the web, and Expo Go has limited notification support.
- **Saving shared outfit images** (`expo-media-library`) needs full photo-library access.

To make a development build:

```sh
npx expo run:ios
npx expo run:android
```

### Optional: background removal

Set `EXPO_PUBLIC_BG_REMOVAL_URL` (for example in `.env`) to turn on background removal for new photos. The contract is documented in `src/lib/photos.ts`:

- Request: `POST` `multipart/form-data` with the field `image` (a JPEG).
- Response: JSON `{ image: <base64 PNG>, category?: string, color?: string, tags?: string[] }`.

`category` and `color` fill in the item form when they match a known category or color. Requests time out after 30 seconds, and a failure opens the `upload-failed` screen. If the variable is not set, processing is skipped and the original photo is kept.

## Scripts

| Command | What it does |
|---|---|
| `npm start` | `expo start` |
| `npm run ios` / `android` / `web` | Start and open on that platform |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | `expo lint` (on the first run, it offers to set up ESLint) |

## Screens and routes

All routes are under `src/app`.

| Route | Screen |
|---|---|
| `onboarding/index` | Welcome |
| `onboarding/location` | Location priming (for local weather) |
| `onboarding/city` | Choose a city by hand if location is declined |
| `onboarding/first-items` | Add your first items, or "Explore a sample closet" |
| `(tabs)/index` | Home: today's weather and outfit suggestion |
| `(tabs)/closet` | Closet grid of items, with filters |
| `(tabs)/outfits` | Saved outfits |
| `(tabs)/calendar` | Wear calendar and log history |
| `(tabs)/profile` | Profile and settings: name, weather location and units, morning suggestion reminder, tags and categories, theme, export |
| `camera` | Full-screen capture (always black) |
| `processing` | Background removal in progress |
| `upload-failed` | Background removal failed: retry, or keep the original |
| `item/new` | New item form after capture |
| `item/[id]` | Item detail |
| `item/[id]/edit` | Edit item |
| `outfit/[id]` | Outfit detail, with sharing |
| `builder` | Outfit builder (slot layout) |
| `pick` | Choose pieces for the builder, or for logging single pieces |
| `search` | Search items and outfits |
| `log` | Log what you wore today or on another day |
| `recommendations` | "Ideas for today", filtered by occasion |
| `tags` | Manage tag groups |
| `location` | Change the weather location |

The root layout (`src/app/_layout.tsx`) opens camera, processing, upload-failed, item/new, item edit, builder and log as full-screen modals. All other routes are pushed onto the stack.

## Architecture

```
src/
  app/         expo-router routes
  components/  shared UI (ui.tsx primitives, Garment tiles, Collage, sheets, dialogs, UndoToast)
  data/        store.ts (zustand), types.ts, sample.ts (sample closet and default tag groups)
  lib/         weather, recommend, photos, capture, notifications, dates, color, usePicks
  theme/       tokens.ts, fonts.ts, index.tsx (useTheme)
```

### State: local-first

`src/data/store.ts` is a single zustand store that the `persist` middleware saves to AsyncStorage under the key `fitchecked`. It holds items, outfits, wear logs, tags, and settings. Temporary state, such as the open undo window, is not persisted.

- **Soft delete with undo.** Deleting an item marks it `deletedAt` and shows a 5-second undo toast. Selectors such as the live-items list hide deleted items.
- **Outfit deletion keeps history.** If an outfit was ever logged, deleting it archives it instead of removing it, so the calendar still shows it. An outfit that was never logged is removed.
- **Sample closet.** "Explore a sample closet" in onboarding fills the store from `src/data/sample.ts`.

### Theme

`src/theme/tokens.ts` defines the Linen light (`linen`) and dark (`linenDark`) tokens: colors, radii, shadows and type scale. `useTheme()` in `src/theme/index.tsx` resolves the Theme setting in Profile: System (labeled "Auto"), Light or Dark. System follows the OS appearance.

The font is Plus Jakarta Sans, loaded through `@expo-google-fonts/plus-jakarta-sans` (`src/theme/fonts.ts`).

### Icons (deviation from the handoff)

The handoff specifies Material Symbols Rounded. The app uses Material Icons from `@expo/vector-icons` instead, through the `Icon` wrapper in `src/components/ui.tsx`. Symbol names map to the closest glyphs, so:

- Glyphs use the filled Material Icons style throughout, not the outlined Rounded style.
- Some names are aliased. For example, `rainy` maps to `umbrella`, and `sunny` maps to `wb-sunny`.

### Weather and recommendations

`src/lib/weather.ts` uses [Open-Meteo](https://open-meteo.com/) for the forecast and for city geocoding. No API key is needed. The location comes from the device (`expo-location`) or from a city you choose.

`src/lib/recommend.ts` scores saved outfits against tags for the weather and the season, the chosen occasion, and how recently each outfit was worn. When the app is offline or has no weather, suggestions use the season and your recent wear only, and the app tells you so.

### Photos

`src/lib/capture.ts` and `src/lib/photos.ts` copy captured or picked photos into the app's document directory, so clearing the cache does not remove them. They then run optional background removal (see above) before the new-item form opens.
