# PillPath Expo iPhone App

Separate native client for the redesign migration.

## Run

```bash
cd mobile
npm run ios
```

## Config

- `app.config.ts` reads the same public keys as the legacy frontend (`VITE_*`) and also accepts `EXPO_PUBLIC_*` mirrors.
- iOS associated domains are derived from `VITE_APP_SITE_URL` / `VITE_MARKETING_SITE_URL` with production fallbacks.
- `APP_ENV=mobile-dev` loads `mobile/.env.mobile-dev` and `mobile/.env.mobile-dev.local`.
- `APP_ENV=mobile-prod` loads `mobile/.env.mobile-prod` and `mobile/.env.mobile-prod.local`.
- Keep `mobile/.env.example` only as a key reference. The active profiles are `.env.mobile-*`.

## Scope

- iPhone only
- portrait only
- screen-by-screen rebuild
- existing backend reused

## Redesign Assets

Structure:

- `src/redesign/shared/` — common assets shared across screens
- `src/redesign/screens/<screen>/` — screen-specific `json`, icons, avatars, other assets

Current files:

- `src/redesign/shared/backgrounds/` — shared background assets
- `src/redesign/screens/children/child_page.json` — source-of-truth spec for the Children screen
- `src/redesign/screens/children/icons/` — action icons for the Children screen
- `src/redesign/screens/children/avatars/` — avatar illustrations for the Children screen

## Planned order

1. Auth shell
2. Children screen
3. Child profile
4. Sleep / feeding / observation
5. Pillbox
