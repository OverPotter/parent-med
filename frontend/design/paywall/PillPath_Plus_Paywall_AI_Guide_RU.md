# PillPath Plus Paywall — полный гайд для ИИ / разработчика

Версия: русский paywall  
Trial: 7 дней бесплатно  
Месячный план: $5.99 / месяц  
Годовой план: $49.99 / год  
Годовой эквивалент: $4.17 / месяц  
Основной стиль: мягкий premium health-tech, семейный, спокойный, доверительный.

---

## 1. Главная задача

Собрать iOS paywall для приложения **PillPath Plus** в стиле бренда PillPath.

Экран должен продавать Plus как спокойное семейное рабочее пространство для ухода за ребенком: дети, лекарства, напоминания, записи, семейная координация.

Дизайн должен быть Apple-compliant:

- цена должна быть видимой и понятной;
- trial должен быть явно объяснен;
- автопродление должно быть указано;
- должны быть Restore Purchases, Terms of Use, Privacy Policy;
- желательно добавить Manage Subscription;
- нельзя использовать фейковые таймеры, срочность, скрытую цену или манипулятивный текст.

---

## 2. Общая структура экрана

```text
Root: ScrollView / VStack

1. Hero image — верхняя картинка, 40% высоты экрана
2. Logo row — PillPath + Plus badge
3. Headline
4. Subheadline
5. Pricing cards — Monthly + Annual
6. CTA button
7. Legal subscription text
8. Trust row
9. Footer links
```

Экран должен быть iPhone-first. На маленьких экранах допустим вертикальный scroll.

---

## 3. Цветовая система

### 3.1 Основные цвета бренда

```css
Primary Pink: #F45BA6
Primary Purple: #8B5CF6
Primary Gradient: linear-gradient(90deg, #F45BA6 0%, #8B5CF6 100%)
```

Использовать именно эту розово-фиолетовую палитру, как в логотипе PillPath.  
Не использовать зеленый цвет для CTA, selected state, checkmark, discount badge или основного акцента.

---

### 3.2 Фон экрана

```css
Main Background: #EBE4FF
Soft Pink Background: #FFF4FA
Soft Violet Background: #F3E8FF

Screen Background Gradient:
linear-gradient(180deg, #FFF4FA 0%, #F3E8FF 48%, #EBE4FF 100%)
```

Фон должен быть мягким, воздушным, без неона и агрессивной насыщенности.

---

### 3.3 Текстовые цвета

```css
Text Primary: #1E1B2E
Text Secondary: #4B5563
Text Muted: #64748B
```

Использование:

- `#1E1B2E` — заголовки, цены, важный текст;
- `#4B5563` — подзаголовки, описания;
- `#64748B` — legal, secondary captions, вспомогательные подписи.

---

### 3.4 Карточки

```css
Card Background: rgba(255, 255, 255, 0.86)
Card Border: #E9D5FF
Card Radius: 24px
Card Shadow: 0px 10px 30px rgba(139, 92, 246, 0.08)
```

Карточки должны быть светлыми, мягкими, слегка glassmorphism, но без сильной прозрачности.

---

### 3.5 Выбранное состояние

```css
Selected Border: #F45BA6
Selected Background: rgba(244, 91, 166, 0.05)
Selected Shadow: 0px 12px 30px rgba(244, 91, 166, 0.15)
Selected Checkmark Fill: #F45BA6
Selected Checkmark Icon: #FFFFFF
Disabled / Unselected: #CBD5E1
```

Годовой план выбран по умолчанию.

---

## 4. Hero image

Hero — верхняя большая картинка с семьей.

### 4.1 Размеры

```text
Width: 100% / Fill
Height: 40% of screen
Recommended fixed fallback: 330–360 px for iPhone 844–932 px height
Content mode: Cover
Mask: Rectangle
Corner radius: 0
```

Hero не должен быть в полукруге, овале или отдельной карточке.  
Картинка должна идти full-width и выглядеть как естественное начало экрана.

---

### 4.2 Overlay/fade

Снизу hero нужно добавить плавное затухание в фон.

```css
Hero Bottom Fade:
linear-gradient(180deg, rgba(255,255,255,0) 0%, #FFF4FA 65%, #EBE4FF 100%)
```

Цель: убрать резкий край между картинкой и фоном.

---

### 4.3 Содержание картинки

Внутри hero:

- семья: мама, папа, ребенок, бабушка;
- домашняя теплая сцена;
- у семьи телефоны / семейная координация;
- аптечка / pill organizer на столе;
- UI-иконки: календарь, таблетки, напоминания, чек-лист;
- иконка PillPath как светящийся объект на столе;
- натуральная одежда: бежевый, мягкий зеленый, голубой, светло-розовый;
- розово-фиолетовые акценты только в интерфейсных элементах.

Запреты:

- не вставлять текст внутрь картинки;
- не делать всю одежду фиолетовой;
- не использовать агрессивный неон;
- не делать медицинский стиль холодным или пугающим.

---

## 5. Типографика

Основной шрифт:

```text
Plus Jakarta Sans
```

Fallback:

```text
SF Pro Display / SF Pro Text / System Font
```

### 5.1 Размеры шрифтов

```css
Headline:
font-size: 28–30px;
font-weight: 700;
line-height: 34–38px;
color: #1E1B2E;
text-align: center;

Subheadline:
font-size: 16px;
font-weight: 400;
line-height: 24px;
color: #4B5563;
text-align: center;

Plan Title:
font-size: 17px;
font-weight: 700;
line-height: 22px;
color: #1E1B2E;

Price:
font-size: 28–32px;
font-weight: 800;
line-height: 36px;
color: #1E1B2E;

Price Suffix:
font-size: 17px;
font-weight: 600;
line-height: 22px;
color: #1E1B2E;

Caption:
font-size: 14px;
font-weight: 400;
line-height: 20px;
color: #64748B;

CTA Text:
font-size: 18px;
font-weight: 700;
line-height: 24px;
color: #FFFFFF;

Legal Text:
font-size: 13px;
font-weight: 400;
line-height: 18px;
color: #64748B;

Footer Links:
font-size: 13–14px;
font-weight: 500;
line-height: 18px;
color: #F45BA6;
```

---

## 6. Отступы и размеры

```css
Screen horizontal padding: 20px;
Hero height: 330–360px or 40vh;
Hero -> Logo block: 20px;
Logo -> Headline: 14px;
Headline -> Subheadline: 12px;
Subheadline -> Pricing Cards: 24px;
Between Pricing Cards: 16px;
Pricing Cards -> CTA: 24px;
CTA -> Legal: 16px;
Legal -> Trust Row: 20px;
Trust Row -> Footer: 16px;
Bottom safe area padding: 20–28px;
```

На маленьких экранах можно уменьшить вертикальные отступы на 10–15%, но нельзя уменьшать legal до нечитаемого размера.

---

## 7. Тексты paywall на русском

### 7.1 Logo row

```text
PillPath    Plus
```

Plus должен быть бейджем справа от логотипа.

---

### 7.2 Headline

```text
Забота о семье
в одном спокойном месте
```

Можно в одну строку, если ширина позволяет:

```text
Забота о семье в одном спокойном месте
```

---

### 7.3 Subheadline

```text
PillPath Plus помогает вашей семье координировать детей, лекарства, напоминания и записи вместе.
```

---

### 7.4 Monthly card

```text
Месячный план
$5.99 / месяц
Гибкая оплата
```

---

### 7.5 Annual card

```text
Годовой план
$49.99 / год
Только $4.17 / месяц
Списывается раз в год
```

Badge:

```text
Выгоднее
```

---

### 7.6 CTA

```text
Попробовать 7 дней бесплатно
```

Альтернатива, если кнопка не помещается:

```text
Начать 7 дней бесплатно
```

---

### 7.7 Legal text

```text
7 дней бесплатно, затем $5.99/месяц или $49.99/год.
Подписка продлевается автоматически, если не отменить минимум за 24 часа до окончания периода.
```

---

### 7.8 Trust row

```text
Безопасно и конфиденциально | Для всей семьи | Надёжно и удобно
```

---

### 7.9 Footer links

```text
Восстановить покупки | Условия использования | Политика конфиденциальности | Управление подпиской
```

Если не помещается в одну строку, перенести на две строки.

---

## 8. Pricing cards — точная спецификация

### 8.1 Container

```css
Pricing Container:
display: flex;
flex-direction: row;
gap: 16px;
padding-left: 20px;
padding-right: 20px;
width: 100%;
```

---

### 8.2 Общий стиль карточек

```css
Plan Card:
height: 150–170px;
width: calc((100% - 16px) / 2);
border-radius: 24px;
padding: 18px;
background: rgba(255, 255, 255, 0.86);
border: 1.5px solid #E9D5FF;
box-shadow: 0px 8px 24px rgba(139, 92, 246, 0.06);
text-align: center;
```

---

### 8.3 Monthly card — невыбранная

```css
Monthly Card:
background: rgba(255, 255, 255, 0.86);
border: 1.5px solid #E9D5FF;
box-shadow: 0px 8px 24px rgba(139, 92, 246, 0.06);
transform: scale(1.0);
```

Radio:

```css
Unselected Radio:
width: 24px;
height: 24px;
border-radius: 999px;
border: 2px solid #E9D5FF;
background: transparent;
```

---

### 8.4 Annual card — выбранная по умолчанию

```css
Annual Card Selected:
background: rgba(244, 91, 166, 0.05);
border: 2px solid #F45BA6;
box-shadow: 0px 12px 30px rgba(244, 91, 166, 0.15);
transform: scale(1.02);
```

Selected check:

```css
Selected Check Circle:
width: 28px;
height: 28px;
border-radius: 999px;
background: #F45BA6;
color: #FFFFFF;
icon: check;
```

Badge:

```css
Annual Badge:
position: top-right;
top: -10px;
right: 12px;
padding: 6px 10px;
border-radius: 12px;
background: linear-gradient(90deg, #F45BA6 0%, #8B5CF6 100%);
color: #FFFFFF;
font-size: 12px;
font-weight: 700;
text: "Выгоднее";
```

---

## 9. CTA button — точная спецификация

```css
CTA Button:
width: calc(100% - 40px);
height: 58px;
margin-left: 20px;
margin-right: 20px;
border-radius: 29px;
background: linear-gradient(90deg, #F45BA6 0%, #8B5CF6 100%);
box-shadow: 0px 12px 30px rgba(139, 92, 246, 0.25);
color: #FFFFFF;
font-size: 18px;
font-weight: 700;
line-height: 24px;
text-align: center;
```

Pressed state:

```css
CTA Pressed:
opacity: 0.9;
transform: scale(0.98);
```

Disabled state:

```css
CTA Disabled:
background: #CBD5E1;
box-shadow: none;
color: #FFFFFF;
```

Текст кнопки:

```text
Попробовать 7 дней бесплатно
```

---

## 10. Legal block

```css
Legal Block:
width: 100%;
padding-left: 28px;
padding-right: 28px;
text-align: center;
font-size: 13px;
font-weight: 400;
line-height: 18px;
color: #64748B;
```

Текст:

```text
7 дней бесплатно, затем $5.99/месяц или $49.99/год.
Подписка продлевается автоматически, если не отменить минимум за 24 часа до окончания периода.
```

Важно: этот текст нельзя делать слишком мелким или прятать внизу без видимости.

---

## 11. Trust row

```css
Trust Row:
display: flex;
flex-direction: row;
justify-content: center;
align-items: center;
gap: 12–16px;
padding-left: 20px;
padding-right: 20px;
```

Каждый item:

```css
Trust Item:
display: flex;
flex-direction: row;
align-items: center;
gap: 6px;

Icon size: 20px;
Icon color: #F45BA6;
Text color: #4B5563;
Text font-size: 13–14px;
Text font-weight: 500;
```

Divider:

```css
Divider:
width: 1px;
height: 18–20px;
background: #E9D5FF;
```

Тексты:

```text
Безопасно и конфиденциально
Для всей семьи
Надёжно и удобно
```

---

## 12. Footer links

```css
Footer Links:
display: flex;
flex-wrap: wrap;
justify-content: center;
row-gap: 8px;
column-gap: 12px;
padding-left: 20px;
padding-right: 20px;
font-size: 13px;
font-weight: 500;
line-height: 18px;
color: #F45BA6;
```

Links:

```text
Восстановить покупки
Условия использования
Политика конфиденциальности
Управление подпиской
```

Если footer не помещается в одну строку, он должен переноситься на две строки, а не уменьшаться до нечитаемого размера.

---

## 13. RevenueCat / локализованные цены

В preview можно показывать:

```text
$5.99 / месяц
$49.99 / год
$4.17 / месяц
```

Но в финальной интеграции желательно использовать переменные RevenueCat, чтобы цены были точными и локализованными.

```text
{{ product.price }}
{{ product.price_per_month }}
{{ product.price_per_period }}
{{ product.relative_discount }}
```

Логика:

```text
Default selected package: Annual
Monthly package: $5.99 / month
Annual package: $49.99 / year
Trial duration: 7 days
CTA starts trial for selected package
After trial, selected package renews automatically
```

Если RevenueCat не может посчитать `$4.17 / month`, использовать локализованную annual price / 12.

---

## 14. Apple compliance

Обязательно:

- Показывать цену выбранного тарифа заметно.
- Показывать длительность подписки: месяц / год.
- Trial объяснить явно: 7 дней бесплатно, затем цена.
- Автопродление объяснить читаемо.
- Добавить Restore Purchases.
- Добавить Terms of Use.
- Добавить Privacy Policy.
- Добавить Manage Subscription, если доступно через RevenueCat Customer Center.

Запрещено:

- fake timer;
- “только сегодня”;
- фейковый дефицит;
- скрытая цена;
- текст мелким шрифтом, который невозможно прочитать;
- имитация Apple purchase sheet;
- misleading free wording;
- агрессивный discount pressure.

---

## 15. Готовый промпт для ИИ-интегратора

```text
Build the PillPath Plus iOS paywall exactly according to this spec.
Use a soft premium family health-tech style based on the PillPath app icon palette.
The primary gradient must be pink to purple: #F45BA6 -> #8B5CF6.
Do not use green for the CTA, selected state, checkmark, discount badge, or premium accents.

Screen layout:
- Hero image at top, 40% screen height, full width, cover, no rounded mask.
- Add bottom fade from transparent to #FFF4FA to #EBE4FF.
- Main background gradient: #FFF4FA -> #F3E8FF -> #EBE4FF.
- Logo row: PillPath + Plus badge.
- Headline: “Забота о семье в одном спокойном месте”.
- Subheadline: “PillPath Plus помогает вашей семье координировать детей, лекарства, напоминания и записи вместе.”
- Pricing cards side by side: Monthly and Annual.
- Monthly: $5.99 / месяц, “Гибкая оплата”.
- Annual: $49.99 / год, “Только $4.17 / месяц”, “Списывается раз в год”.
- Annual selected by default with border #F45BA6, light pink tint, badge “Выгоднее”.
- CTA: “Попробовать 7 дней бесплатно”, 58px height, radius 29px, gradient #F45BA6 -> #8B5CF6.
- Legal text: “7 дней бесплатно, затем $5.99/месяц или $49.99/год. Подписка продлевается автоматически, если не отменить минимум за 24 часа до окончания периода.”
- Trust row: “Безопасно и конфиденциально | Для всей семьи | Надёжно и удобно”.
- Footer links: “Восстановить покупки | Условия использования | Политика конфиденциальности | Управление подпиской”.

Use RevenueCat localized pricing variables where possible instead of hardcoding final prices.
Keep all subscription terms visible and Apple-compliant.
```

---

## 16. Чеклист перед релизом

- [ ] Hero занимает около 40% экрана.
- [ ] Hero не обрезает лица и важные элементы.
- [ ] Внизу hero есть мягкий fade в фон.
- [ ] CTA использует градиент `#F45BA6 -> #8B5CF6`.
- [ ] Нет зеленых кнопок и зеленого selected state.
- [ ] Годовой план выбран по умолчанию.
- [ ] Цены читаемые.
- [ ] Trial описан явно.
- [ ] Legal текст не спрятан и читается.
- [ ] Restore Purchases работает.
- [ ] Terms of Use открывает правильную ссылку.
- [ ] Privacy Policy открывает правильную ссылку.
- [ ] Manage Subscription открывает Customer Center / управление подпиской.
- [ ] RevenueCat sandbox test проходит.
- [ ] На маленьком iPhone footer не обрезается.
- [ ] На русском тексты не налезают друг на друга.

