# App Migration TODO

Переход к App Store версии после фикса критических багов.

## 1. Базовая iOS-обертка (Capacitor)
- [x] Добавить Capacitor в `frontend` (`init`, `add ios`).
- [x] Настроить сборку Vite в `www` для Capacitor.
- [x] Подключить iOS-проект в Xcode и проверить запуск на реальном iPhone.
- [x] Настроить окружения (`dev`/`stage`/`prod`) для API URL.

## 2. Обязательные требования App Store (критично)
- [x] Добавить удаление аккаунта внутри приложения (UI + API).
- [x] Добавить Privacy Policy URL и экран с ссылками:
  - [x] Privacy Policy
  - [x] Terms of Use
  - [x] Support / Contact
- [x] Добавить/проверить медицинский дисклеймер в ключевых экранах.
  - Примечание: по UX-решению дисклеймер вынесен в legal-раздел, а не дублируется на каждом рабочем экране.
- [x] Добавить согласие с юридическими документами при регистрации.
- [x] Добавить cookie-consent (analytics only after consent).
- [x] Подготовить reviewer-доступ (демо-аккаунт или демо-режим).
  - Шаблон: [APP_STORE_REVIEW_NOTES.md](./APP_STORE_REVIEW_NOTES.md) (заполнить `TBD_*` перед отправкой в review).
- [ ] Подготовить multi-region legal baseline для RU/US/EU:
  - [x] Актуализировать Privacy Policy/Terms под US + EU (включая GDPR-блоки).
    - Примечание: обновлены in-app документы `/legal/privacy` и `/legal/terms` (редакция от 08.04.2026) под модель публикации от физлица и бесплатного сервиса.
  - [x] Проверить, что consent-тексты и ссылки корректны для EN локали.
  - [x] Подготовить EN demo-аккаунт для App Review.

## 3. Push-уведомления для iOS app (нативный канал)
- [x] Перейти с web-push сценария на APNs через Capacitor Push Notifications.
  - Реализовано: iOS сохраняет native token, backend отправляет native iOS push через APNs при наличии `APNS_*` env.
- [x] Добавить регистрацию device token на backend.
- [x] Обновить backend-модель подписок под native-токены (если нужно).
- [x] Проверить end-to-end: разрешение, получение, открытие deep-link из push.
  - Перед деплоем backend на сервер задать `APNS_KEY_ID`, `APNS_TEAM_ID`, `APNS_BUNDLE_ID`, `APNS_AUTH_KEY`.
  - Для TestFlight/App Store использовать `APNS_USE_SANDBOX=false`; `true` оставлять только для Debug-сборки из Xcode.

## 4. Безопасность и хранение сессии
- [x] Убрать хранение refresh/access токена из web storage для iOS-сборки.
- [x] Перенести токены в secure storage/keychain.
- [ ] Проверить куки/токены в iOS-контейнере и сценарии истечения сессии.

## 5. Полировка UX под мобильное нативное ощущение
- [x] Проверить safe areas, клавиатуру, навигацию, back-жесты.
- [x] Добавить обработку offline/slow network состояний.
- [x] Проверить accessibility: динамический текст, контраст, VoiceOver.
  - Реализовано: skip-link (web), локализованные aria-label навигации, усилен контраст muted-текста, `prefers-reduced-motion`, улучшены touch-target размеры в mobile-header/auth.
- [x] Обновить иконки/launch screen/скриншоты под требования App Store.
  - Реализовано: обновлены app icon и Splash imageset под текущий бренд для iOS сборки.

## 6. Тестирование перед публикацией
- [ ] Smoke + regression на реальных iOS устройствах.
- [ ] Crash-free прогон TestFlight (внутренние тестеры).
- [ ] Проверка аналитики/логов/ошибок на stage и prod.
- [ ] Проверка локализаций (RU/EN) и всех критических user flows.
- [ ] Проверка регионального поведения для RU/US/EU (legal ссылки, тексты consent, формат дат/времени).
- [ ] Финальный ручной accessibility-pass на устройстве: VoiceOver + Dynamic Type по auth/home/children/pillbox/settings/legal.
- [ ] Подготовить финальный пакет App Store скриншотов и маркетинговых ассетов (не тестовые).

## 7. Публикация в App Store Connect
- [ ] Создать app record и заполнить метаданные.
- [ ] Заполнить App Privacy (data collection/use).
- [ ] Установить age rating.
- [ ] Загрузить сборку через Xcode / Transporter
- [ ] Подготовить App Review Notes (как войти, как проверить ключевые функции).
- [ ] Отправить в review.

## 8. После релиза
- [ ] Мониторинг crash/error rate первые 72 часа.
- [ ] Обработка review feedback от Apple (если будет rejection).
- [ ] Подготовить план быстрых hotfix-релизов.
