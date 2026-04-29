# PillPath Paywall — точная разметка кнопок и ссылок

Файл можно дать ИИ/разработчику как спецификацию для сборки paywall в React.

---

## 1. Основной CTA

### Назначение
Главная кнопка запуска подписки / триала.

### Текст кнопки

```text
Попробовать 7 дней бесплатно
```

### Позиция

```text
Расположение: сразу после блока тарифов
Отступ сверху от тарифов: 24px
Отступ слева/справа от экрана: 20px
Ширина: 100%
Высота: 60px
```

### CSS

```css
.paywall-cta {
  width: 100%;
  height: 60px;

  border: none;
  border-radius: 999px;

  background: linear-gradient(90deg, #F45BA6 0%, #8B5CF6 100%);
  color: #FFFFFF;

  font-family: "Plus Jakarta Sans", system-ui, sans-serif;
  font-size: 20px;
  font-weight: 800;
  line-height: 24px;
  letter-spacing: -0.2px;

  box-shadow: 0px 14px 34px rgba(139, 92, 246, 0.28);

  display: flex;
  align-items: center;
  justify-content: center;

  cursor: pointer;
  transition: transform 0.18s ease, opacity 0.18s ease;
}

.paywall-cta:active {
  transform: scale(0.98);
  opacity: 0.92;
}
```

---

## 2. Контейнер тарифов

### Позиция

```text
Расположение: после заголовка и подзаголовка
Отступ сверху: 24px
Отступ снизу до CTA: 24px
Отступ слева/справа: 20px
```

### Layout

```css
.paywall-plans {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;

  width: 100%;
  margin-top: 24px;
  margin-bottom: 24px;
}
```

---

## 3. Кнопка тарифа: Месячный план

### Текст внутри

```text
Месячный план
$5.99 / месяц
Гибкая оплата
```

### Состояние
Не выбран по умолчанию.

### CSS карточки

```css
.plan-card {
  position: relative;

  min-height: 172px;
  padding: 22px 12px 18px;

  border-radius: 28px;
  border: 1.5px solid #E9D5FF;

  background: rgba(255, 255, 255, 0.82);
  box-shadow: 0px 10px 30px rgba(139, 92, 246, 0.08);

  font-family: "Plus Jakarta Sans", system-ui, sans-serif;
  color: #1E1B2E;
  text-align: center;

  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border 0.2s ease;
}
```

### CSS текста

```css
.plan-title {
  margin: 18px 0 14px;

  font-size: 18px;
  font-weight: 700;
  line-height: 22px;
  color: #1E1B2E;
}

.plan-price-row {
  display: flex;
  justify-content: center;
  align-items: baseline;
  gap: 5px;
  white-space: nowrap;
}

.plan-price {
  font-size: 26px;
  font-weight: 800;
  line-height: 32px;
  letter-spacing: -0.7px;
  color: #1E1B2E;
}

.plan-period {
  font-size: 15px;
  font-weight: 600;
  line-height: 20px;
  color: #1E1B2E;
}

.plan-subtitle {
  margin: 10px 0 0;

  font-size: 14px;
  font-weight: 400;
  line-height: 19px;
  color: #4B5563;
}
```

---

## 4. Кнопка тарифа: Годовой план

### Текст внутри

```text
Выгоднее
Годовой план
$49.99 / год
Только $4.17 / месяц
Списывается раз в год
```

### Состояние
Выбран по умолчанию.

### CSS выбранной карточки

```css
.plan-card.selected {
  transform: scale(1.03);

  border: 2px solid #F45BA6;
  background: rgba(244, 91, 166, 0.055);

  box-shadow: 0px 14px 34px rgba(244, 91, 166, 0.16);
}
```

### Badge “Выгоднее”

```css
.plan-badge {
  position: absolute;
  top: 12px;
  right: 12px;

  padding: 7px 12px;
  border-radius: 999px;

  background: linear-gradient(90deg, #F45BA6 0%, #8B5CF6 100%);
  color: #FFFFFF;

  font-size: 13px;
  font-weight: 700;
  line-height: 16px;

  box-shadow: 0px 8px 18px rgba(244, 91, 166, 0.22);
}
```

### Note под ценой

```css
.plan-note {
  margin: 7px 0 0;

  font-size: 13px;
  font-weight: 400;
  line-height: 18px;
  color: #64748B;
}
```

---

## 5. Radio / check внутри тарифа

### Позиция

```text
Расположение: внизу по центру каждой карточки
Отступ сверху от текста: 18px
Размер: 30px × 30px
```

### CSS

```css
.plan-radio {
  width: 30px;
  height: 30px;

  margin: 18px auto 0;

  border-radius: 50%;
  border: 3px solid #EAD6F3;

  display: flex;
  align-items: center;
  justify-content: center;

  color: transparent;
  font-size: 18px;
  font-weight: 800;
}

.plan-radio.active {
  background: #F45BA6;
  border-color: #F45BA6;
  color: #FFFFFF;
}
```

---

## 6. Legal text под CTA

### Текст

```text
7 дней бесплатно, затем $5.99/месяц или $49.99/год.
Подписка продлевается автоматически, если не отменить минимум за 24 часа до окончания периода.
```

### Позиция

```text
Сразу под CTA
Отступ сверху: 18–20px
Отступ слева/справа: 20px
Выравнивание: по центру
```

### CSS

```css
.paywall-legal {
  margin: 20px auto 22px;
  max-width: 640px;

  font-size: 14px;
  font-weight: 400;
  line-height: 22px;

  color: #64748B;
  text-align: center;
}
```

---

## 7. Secondary actions

### Текст кнопок

```text
Восстановить покупки
Управление подпиской
```

### Позиция

```text
Под legal text
В одной строке
Выравнивание по центру
Отступ между кнопками: 12px
```

### CSS

```css
.secondary-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;

  margin-top: 10px;
  margin-bottom: 14px;
}

.secondary-actions button {
  border: none;
  background: transparent;
  padding: 0;

  font-family: "Plus Jakarta Sans", system-ui, sans-serif;
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;

  color: #F45BA6;
  cursor: pointer;
}

.secondary-actions .divider {
  color: rgba(244, 91, 166, 0.45);
}
```

---

## 8. Footer legal links

### Текст

```text
Условия использования
Политика конфиденциальности
```

### Позиция

```text
Самый низ paywall
Под secondary actions
Выравнивание по центру
```

### CSS

```css
.footer-links {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;

  margin-top: 8px;
  padding-bottom: 24px;
}

.footer-links button {
  border: none;
  background: transparent;
  padding: 0;

  font-family: "Plus Jakarta Sans", system-ui, sans-serif;
  font-size: 13px;
  font-weight: 500;
  line-height: 18px;

  color: #F45BA6;
  cursor: pointer;
}

.footer-links .divider {
  color: rgba(244, 91, 166, 0.45);
}
```

---

## 9. React JSX для кнопок и тарифов

```jsx
<div className="paywall-plans">
  <button
    className={`plan-card ${selectedPlan === "monthly" ? "selected" : ""}`}
    onClick={() => setSelectedPlan("monthly")}
    type="button"
  >
    <h2 className="plan-title">Месячный план</h2>

    <div className="plan-price-row">
      <span className="plan-price">$5.99</span>
      <span className="plan-period">/ месяц</span>
    </div>

    <p className="plan-subtitle">Гибкая оплата</p>

    <div className={`plan-radio ${selectedPlan === "monthly" ? "active" : ""}`}>
      {selectedPlan === "monthly" ? "✓" : ""}
    </div>
  </button>

  <button
    className={`plan-card ${selectedPlan === "annual" ? "selected" : ""}`}
    onClick={() => setSelectedPlan("annual")}
    type="button"
  >
    <div className="plan-badge">Выгоднее</div>

    <h2 className="plan-title">Годовой план</h2>

    <div className="plan-price-row">
      <span className="plan-price">$49.99</span>
      <span className="plan-period">/ год</span>
    </div>

    <p className="plan-subtitle">Только $4.17 / месяц</p>
    <p className="plan-note">Списывается раз в год</p>

    <div className={`plan-radio ${selectedPlan === "annual" ? "active" : ""}`}>
      {selectedPlan === "annual" ? "✓" : ""}
    </div>
  </button>
</div>

<button className="paywall-cta" type="button">
  Попробовать 7 дней бесплатно
</button>

<p className="paywall-legal">
  7 дней бесплатно, затем $5.99/месяц или $49.99/год.
  <br />
  Подписка продлевается автоматически, если не отменить минимум за 24 часа до окончания периода.
</p>

<div className="secondary-actions">
  <button type="button">Восстановить покупки</button>
  <span className="divider">|</span>
  <button type="button">Управление подпиской</button>
</div>

<div className="footer-links">
  <button type="button">Условия использования</button>
  <span className="divider">|</span>
  <button type="button">Политика конфиденциальности</button>
</div>
```

---

## 10. Логика выбора

```jsx
const [selectedPlan, setSelectedPlan] = useState("annual");
```

```text
По умолчанию выбран: annual
CTA должен запускать покупку выбранного тарифа.
Если выбран monthly → покупка monthly product.
Если выбран annual → покупка annual product.
```

---

## 11. Цвета

```css
Pink: #F45BA6
Purple: #8B5CF6
Main text: #1E1B2E
Secondary text: #4B5563
Muted text: #64748B
Border: #E9D5FF
Card background: rgba(255, 255, 255, 0.82)
Selected card background: rgba(244, 91, 166, 0.055)
CTA gradient: linear-gradient(90deg, #F45BA6 0%, #8B5CF6 100%)
```
