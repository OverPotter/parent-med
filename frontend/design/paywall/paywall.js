import React, { useState } from "react";
import "./PillPathPaywall.css";

export default function PillPathPaywall() {
  const [selectedPlan, setSelectedPlan] = useState("annual");

  const plans = {
    monthly: {
      title: "Месячный план",
      price: "$5.99",
      period: "/ месяц",
      subtitle: "Гибкая оплата",
    },
    annual: {
      title: "Годовой план",
      price: "$49.99",
      period: "/ год",
      subtitle: "Только $4.17 / месяц",
      note: "Списывается раз в год",
      badge: "Выгоднее",
    },
  };

  return (
    <main className="paywall">
      <section className="hero">
        <img
          src="/images/pillpath-family-hero.png"
          alt="PillPath family care"
          className="heroImage"
        />
        <div className="heroFade" />
      </section>

      <section className="content">
        <div className="brandRow">
          <span className="brandText">Pill<span>Path</span></span>
          <span className="plusBadge">Plus</span>
        </div>

        <h1>Забота о семье<br />в одном спокойном месте</h1>

        <p className="subtitle">
          PillPath Plus помогает вашей семье координировать детей, лекарства,
          напоминания и записи вместе.
        </p>

        <div className="plans">
          <PlanCard
            plan={plans.monthly}
            selected={selectedPlan === "monthly"}
            onClick={() => setSelectedPlan("monthly")}
          />

          <PlanCard
            plan={plans.annual}
            selected={selectedPlan === "annual"}
            onClick={() => setSelectedPlan("annual")}
          />
        </div>

        <button className="cta">
          Попробовать 7 дней бесплатно
        </button>

        <p className="legal">
          7 дней бесплатно, затем $5.99/месяц или $49.99/год.
          <br />
          Подписка продлевается автоматически, если не отменить минимум за 24 часа
          до окончания периода.
        </p>

        <div className="trustRow">
          <TrustItem icon="🔒" text="Безопасно и конфиденциально" />
          <TrustItem icon="👨‍👩‍👧" text="Для всей семьи" />
          <TrustItem icon="🛡️" text="Надёжно и удобно" />
        </div>

        <footer className="footerLinks">
          <button>Восстановить покупки</button>
          <span>|</span>
          <button>Условия использования</button>
          <span>|</span>
          <button>Политика конфиденциальности</button>
          <span>|</span>
          <button>Управление подпиской</button>
        </footer>
      </section>
    </main>
  );
}

function PlanCard({ plan, selected, onClick }) {
  return (
    <button
      className={`planCard ${selected ? "selected" : ""}`}
      onClick={onClick}
      type="button"
    >
      {plan.badge && <div className="cardBadge">{plan.badge}</div>}

      <h2>{plan.title}</h2>

      <div className="priceRow">
        <span className="price">{plan.price}</span>
        <span className="period">{plan.period}</span>
      </div>

      <p className="planSubtitle">{plan.subtitle}</p>

      {plan.note && <p className="planNote">{plan.note}</p>}

      <div className={`radio ${selected ? "active" : ""}`}>
        {selected && "✓"}
      </div>
    </button>
  );
}

function TrustItem({ icon, text }) {
  return (
    <div className="trustItem">
      <span>{icon}</span>
      <p>{text}</p>
    </div>
  );
}