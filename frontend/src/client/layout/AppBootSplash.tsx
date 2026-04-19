import { BrandWordmark } from "@shared/components/BrandWordmark";
import { useI18n } from "@shared/hooks/useI18n";

type AppBootSplashProps = {
  className?: string;
  isClosing?: boolean;
};

function joinClasses(...parts: Array<string | null | undefined | false>) {
  return parts.filter(Boolean).join(" ");
}

export function AppBootSplash({ className, isClosing = false }: AppBootSplashProps) {
  const { copy } = useI18n();

  return (
    <div
      className={joinClasses(
        "app-boot-splash soft-app-bg",
        isClosing && "app-boot-splash--closing",
        className
      )}
    >
      <div className="app-boot-splash__glow app-boot-splash__glow--primary" aria-hidden="true" />
      <div className="app-boot-splash__glow app-boot-splash__glow--secondary" aria-hidden="true" />
      <div className="app-boot-splash__content">
        <img src="/pwa-icon.png" alt="" className="app-boot-splash__logo" aria-hidden="true" />
        <BrandWordmark className="app-boot-splash__wordmark" ariaLabel={copy.common.brandName} />
      </div>
    </div>
  );
}
