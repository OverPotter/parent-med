# PillPath Expo iPhone App

Separate native client for the redesign migration.

## Run

```bash
cd expo-ios
npm run ios
```

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
