# PWA Exit Plan

План ухода от `PWA/web-app/desktop` режима без поломки `iOS` приложения.

## Goal

Целевая модель продукта:

- `iOS app` — единственный полноценный клиент продукта
- `website` — только landing, legal, support, invite preview и handoff в приложение
- `PWA`, browser-install, desktop-style client и web-push — убрать

Главная цель:

`убрать PWA/web-product слой так, чтобы не сломать iOS runtime, deep links, invite flow, подписки, native push и legal/public website`

## Core Principle

Двигаться не через резкое удаление всего web, а поэтапно:

1. Отделить `public website` от `product app`
2. Перевести UX в `app-first`
3. Только потом выключить `PWA`
4. Удалять остатки web-product слоя только после iOS QA

## Target Architecture

### 1. iOS App

Единственный полноценный продуктовый клиент:

- auth
- family
- children
- pillbox
- settings
- billing/subscription
- push notifications
- export/share

### 2. Public Website

Остаются только публичные entry points:

- landing
- legal
- support/contact
- invite preview / invite explanation
- App Store redirect / open-in-app handoff

Для handoff в `App Store` нужен отдельный frontend env:

- `VITE_APP_STORE_URL`
- текущий URL: `https://apps.apple.com/app/id6762408566`
- используется как fallback CTA для пользователей, у которых приложение ещё не установлено

### 3. What Must Be Removed

Убрать:

- `PWA manifest`
- `service worker`
- `workbox`
- browser installability
- standalone-PWA режим
- web push
- desktop/web full-client mode

## Product Rules

### Website must not behave like full product

Сайт не должен оставаться второй полноценной версией приложения.

### Invite links must still work

Если пользователь открывает ссылку:

- при установленном приложении ссылка должна открывать `iOS app`
- если приложение не установлено, ссылка должна вести на сайт
- сайт должен объяснить, что происходит, и дать CTA:
  - `Open App`
  - `Download on the App Store`

### Avoid broken hybrid auth

Не использовать модель:

- “зарегистрироваться на сайте можно”
- “войти потом можно только в приложении”

Это создаёт плохой UX и support-нагрузку.

Если web auth не нужен как fallback-канал, лучше:

- не делать полноценную web-регистрацию
- делать только app-handoff flow

## Execution Plan

## Phase 0. Freeze The Target

Зафиксировать source of truth:

- `iOS` — единственный product client
- `website` — только gateway/public layer
- `PWA` и desktop-mode больше не являются целевыми режимами

Результат фазы:

- команда принимает это как продуктовый контракт

## Phase 1. Identify Critical iOS Dependencies

Перед удалением любого web/PWA кода проверить и выделить всё, что нельзя сломать:

- `RevenueCat`
- `StoreKit` purchase flow
- `APNs`
- secure token storage
- native deep links
- universal links
- password autofill
- native file share/export
- invite token handoff

Нужно явно выписать, какие участки кода сейчас общие для web и iOS:

- auth routes
- invite routes
- legal routes
- runtime bootstrap
- analytics bootstrap
- push sync

Результат фазы:

- список “не трогать без отдельной проверки”

## Phase 2. Split Public Website And Product App

Разделить маршруты на две категории.

### Public Website Routes

Оставить публичными:

- `/`
- `/legal`
- `/legal/privacy`
- `/legal/terms`
- `/legal/support`
- invite preview route
- при необходимости отдельные handoff routes вроде `/open-app` или `/download`

### Native Product Routes

Полноценный продуктовый runtime должен жить только в приложении:

- `/auth`
- `/family`
- `/children`
- `/pillbox`
- `/settings`
- остальные внутренние экраны

На web эти product routes не должны продолжать работать как полноценное приложение в браузере.

## Phase 3. Rework Auth And Invite Into App-First Flows

### Invite Flow

Целевое поведение:

- universal link пытается открыть app
- если app нет, открывается сайт
- сайт показывает:
  - кто приглашает
  - в какую семью зовут
  - что дальше произойдёт
  - CTA в App Store / Open App

### Auth Flow

Определить один из двух режимов:

- либо web login/register полностью убрать
- либо оставить только как временный migration fallback

Для целевой `iOS-only` модели предпочтительно:

- убрать полноценный web auth flow
- оставить только handoff в приложение

## Phase 4. Disable PWA Infrastructure

После того как public website и app-first UX готовы:

- удалить `vite-plugin-pwa`
- удалить `manifest.webmanifest`
- удалить `registerSW(...)`
- удалить service worker
- удалить workbox-конфиг
- удалить install/PWA copy
- удалить standalone-mode логику, если она нужна только для PWA

Важно:

- обычный web build для landing/public pages должен остаться

## Phase 5. Remove Web Push

После подтверждения, что native push полностью рабочий:

- удалить `serviceWorker + PushManager + Notification` ветки
- оставить только native `APNs` flow
- удалить `PWA` device labels и web subscription paths
- обновить privacy/legal тексты, где есть `web/PWA mode`

## Phase 6. Simplify Runtime Bootstrap

Упростить frontend runtime так, чтобы осталось только два режима:

- `native app runtime`
- `public website runtime`

Нужно убрать:

- `standalone PWA` ветки
- browser-as-installed-app режим
- лишние web mobile shell эвристики, если они были нужны только для PWA

## Phase 7. Preserve Deep Links And Handoff

Не трогать без проверки:

- `apple-app-site-association`
- `Associated Domains`
- universal links
- custom scheme `pillpath://...`

Нужно сохранить сценарии:

- ссылка открывает app
- если app не установлен, открывается сайт
- после установки пользователь может дойти до нужного сценария

## Phase 8. Rework Landing Into iOS-Only Product Site

Landing должен явно говорить:

- продукт работает через `iPhone app`
- основной CTA — `Download on App Store`
- secondary CTA — `Open App`

Убрать все намёки на:

- PWA-install
- browser-install
- “use without App Store”
- desktop-client mode

## Phase 9. Remove Full Web Product Mode

Только после прохождения iOS QA:

- убрать полноценные browser product flows
- убрать desktop assumptions
- убрать web-client сценарии, которые больше не нужны

Результат:

- сайт остаётся только gateway/public surface
- весь продуктовый usage идёт через `iOS`

## Release Strategy

## Stage A. App-First, Nothing Deleted Yet

Сначала:

- меняем UX landing/auth/invite
- переводим public flows в gateway mode
- но старый PWA/web слой ещё физически не удаляем

Цель:

- не ломать работающий iOS runtime

## Stage B. PWA Off

После проверки:

- удаляем service worker
- удаляем manifest
- удаляем web push
- убираем installability

Но:

- public website остаётся

## Stage C. Web Product Off

Финальная стадия:

- убираем полноценные browser product flows
- оставляем только website/gateway layer

## Mandatory QA After Each Stage

После каждой стадии обязательно проверить:

- login/logout в iOS
- invite link -> app
- invite link -> website fallback
- App Store / install / open-app handoff
- subscription purchase flow
- restore purchases
- APNs push open navigation
- legal/support pages
- password autofill
- deep links after cold start
- export/share
- account deletion / recovery flows, если они остаются публичными

## Main Risks

### 1. Breaking Universal Link Fallback

Можно случайно удалить web surface, который нужен как fallback для пользователей без app.

### 2. Breaking Invite Flows

Если убрать web слишком рано, invite links станут непонятными или тупиковыми.

### 3. Breaking Shared Runtime

Сейчас часть bootstrap/navigation/push логики общая между web и iOS.

Резкая чистка может поломать native behavior.

### 4. Leaving Product In A Broken Hybrid State

Самый плохой промежуточный вариант:

- сайт ещё позволяет часть auth/invite действий
- но дальше пользователь не понимает, как попасть в app

### 5. Outdated Legal / Privacy Copy

После удаления PWA/web push надо обновить тексты, где ещё говорится про:

- `PWA`
- `browser install`
- `web push`

## Recommended Decision

Для текущего продукта рекомендуется:

- убрать `PWA`
- не убирать `website`
- убрать полноценный `web product`
- сохранить `website` как public gateway в приложение

Итоговая модель:

`website = landing + legal + invite preview + app handoff`

`iOS app = единственный полноценный клиент`
