# App Store Review Notes

Используйте этот текст в **App Store Connect → TestFlight / App Review → Notes for Review**.

## 0) Fill Before Submit

- Укажите реальный контакт для команды App Review в секции `Contact For Review Team`.
- Проверьте, что demo-аккаунт активен и не требует дополнительных шагов.

## 1) Demo Access (Multi-Region)

- RU demo login: `appreview-demo-ru`
- RU demo password: `PillPathReview2026!`
- EN demo login: `appreview-demo-en`
- EN demo password: `PillPathReview2026!`
- 2FA: `No`
- Supported locales in this build: `ru`, `en`
- Regions for review: `RU`, `US`, `EU`

Если демо-аккаунт блокируется или истекает, используйте резервный:

- Backup login: `appreview-demo-ru`
- Backup password: `PillPathReview2026!`

## 2) How To Verify Core Flows

1. Открыть приложение и выполнить вход через один из Demo Access аккаунтов.
2. Перейти в раздел `Дети` и открыть профиль ребенка.
3. Перейти в `Наблюдения` и проверить карточки активного эпизода.
4. Перейти в `Таблетница` и проверить планы приёма.
5. Перейти в `Аптечка` и проверить список лекарств/статусы.
6. Перейти в `Семья` и открыть приглашения.
7. Перейти в `Настройки` и открыть юридические страницы:
   - Privacy Policy
   - Terms of Use
   - Support / Contact

## 3) Account Deletion

Удаление аккаунта доступно в приложении:

1. `Настройки`
2. `Удалить аккаунт`
3. Подтверждение действия

## 4) Legal Links

- Privacy Policy: `/legal/privacy`
- Terms of Use: `/legal/terms`
- Support / Contact: `/legal/support` (внутри приложения также доступна форма `Feedback`)
- Требование для submit: тексты/ссылки должны покрывать RU/US/EU политику обработки данных.

## 5) Medical Disclaimer

Приложение не является медицинским устройством и не заменяет консультацию врача.
Дисклеймер и юридическая информация доступны внутри приложения в разделе Legal.

## 6) Push Notifications (Current Build)

- В текущей iOS-сборке используются native push notifications через `APNs` и Capacitor Push Notifications.
- Основные пользовательские сценарии приложения можно проверить без push-разрешения.
- Если push в review-окружении недоступен, это не блокирует проверку auth, children, illness, pillbox, family и legal flows.

## 7) Contact For Review Team

- Name: `SET_BEFORE_SUBMIT`
- Email: `SET_BEFORE_SUBMIT`
- Telegram/Phone (optional): `SET_BEFORE_SUBMIT`

## 8) Notes

- Это iPhone-приложение с public website для landing, invite links и legal pages. Основной продуктовый сценарий проходит внутри iOS app.
- Если ревью требует отдельный test user или reset демо-данных, напишите на контакт выше.
- Публикация планируется не только в RU, но и в US/EU, поэтому ревью может использовать любой из demo-аккаунтов выше.
