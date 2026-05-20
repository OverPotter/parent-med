`redesighn/` stores raw redesign source files and assets used as handoff material.

Structure:
- `screens/children/child_page.json` — source spec for the children screen
- `screens/children/avatars/` — child avatar assets used by the redesign
- `shared/icons/` — shared action icons
- `shared/backgrounds/` — shared background assets
- `references/` — static reference screenshots and non-production source images

Rules:
- keep asset paths inside this folder relative, never absolute `Downloads/...`
- keep screen-specific assets under `screens/<screen-name>/`
- keep reusable assets under `shared/`
