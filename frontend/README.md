# Parent Med Frontend (PWA)

Фронтенд по правилам AGENT.md: Vite, React, TypeScript, PWA, Tailwind, Zustand, TanStack Query.

## Стек

- **Сборка**: Vite (не CRA)
- **PWA**: vite-plugin-pwa (manifest, service worker, установка на устройство)
- **TypeScript**: strict, без any. Алиасы: `@/`, `@shared/`, `@admin/`, `@client/`
- **Роутинг**: React Router; разветвление по роли (admin/client) в `App.tsx`
- **Стейт**: Zustand (тема, семья, роль), TanStack Query (запросы к API)
- **Стили**: Tailwind; темы через CSS-переменные и `data-theme` (светлая/тёмная)

## Структура `src/`

- `shared/` — api (axios с baseURL, interceptors: Bearer, 401), типы, компоненты, store
- `admin/` — страницы и layout админки (MVP: заглушка)
- `client/` — страницы и layout для пользователя (семья, дети, аптечка, эпизоды болезни)

## Запуск

```bash
# из корня репозитория
cd frontend
npm install
npm run dev
```

- Приложение: <http://localhost:5173>
- Прокси к API: `/api` → `http://localhost:8000` (запустите бэкенд отдельно)

## Сборка PWA

```bash
npm run build
npm run preview
```

После сборки в `dist/` — статика и service worker для установки на устройство.
