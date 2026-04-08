# TODO: Переход к App Store версии (после фикса критических багов)

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
  - Шаблон: `APP_STORE_REVIEW_NOTES.md` (заполнить `TBD_*` перед отправкой в review).
- [ ] Подготовить multi-region legal baseline для RU/US/EU:
  - [x] Актуализировать Privacy Policy/Terms под US + EU (включая GDPR-блоки).
    - Примечание: обновлены in-app документы `/legal/privacy` и `/legal/terms` (редакция от 08.04.2026) под модель публикации от физлица и бесплатного сервиса.
  - [x] Проверить, что consent-тексты и ссылки корректны для EN локали.
  - [x] Подготовить EN demo-аккаунт для App Review.

## 3. Push-уведомления для iOS app (нативный канал)
- [ ] Перейти с web-push сценария на APNs через Capacitor Push Notifications.
  - Блокер: для APNs на реальном устройстве нужен платный Apple Developer Program (не Personal Team).
- [x] Добавить регистрацию device token на backend.
- [x] Обновить backend-модель подписок под native-токены (если нужно).
- [ ] Проверить end-to-end: разрешение, получение, открытие deep-link из push.

## 4. Безопасность и хранение сессии
- [x] Убрать хранение refresh/access токена из web storage для iOS-сборки.
- [x] Перенести токены в secure storage/keychain.
- [ ] Проверить куки/токены в iOS-контейнере и сценарии истечения сессии.

## 5. Полировка UX под мобильное нативное ощущение
- [x] Проверить safe areas, клавиатуру, навигацию, back-жесты.
- [x] Добавить обработку offline/slow network состояний.
- [ ] Проверить accessibility: динамический текст, контраст, VoiceOver.  
  - Статус: в работе. Добавлены skip-link, локализованные aria-label для навигации, усилен контраст muted-текста, добавлен `prefers-reduced-motion`, улучшены touch-target шрифты в mobile-header/auth. Нужен финальный ручной VoiceOver-прогон критических экранов на устройстве.
- [ ] Обновить иконки/launch screen/скриншоты под требования App Store.
  - Статус: в работе. Обновлены app icon и Splash imageset под текущий бренд; финальный пакет App Store скриншотов/маркетинговых ассетов остается перед релизом.

## 6. Тестирование перед публикацией
- [ ] Smoke + regression на реальных iOS устройствах.
- [ ] Crash-free прогон TestFlight (внутренние тестеры).
- [ ] Проверка аналитики/логов/ошибок на stage и prod.
- [ ] Проверка локализаций (RU/EN) и всех критических user flows.
- [ ] Проверка регионального поведения для RU/US/EU (legal ссылки, тексты consent, формат дат/времени).

## 7. Публикация в App Store Connect
- [ ] Создать app record и заполнить метаданные.
- [ ] Заполнить App Privacy (data collection/use).
- [ ] Установить age rating.
- [ ] Загрузить сборку через Xcode / Transporter.
- [ ] Подготовить App Review Notes (как войти, как проверить ключевые функции).
- [ ] Отправить в review.

## 8. После релиза
- [ ] Мониторинг crash/error rate первые 72 часа.
- [ ] Обработка review feedback от Apple (если будет rejection).
- [ ] Подготовить план быстрых hotfix-релизов.
