import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Capacitor } from "@capacitor/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { registerSW } from "virtual:pwa-register";
import { appLog } from "@shared/utils/appLog";
import App from "./App";
import "./index.css";
import "./styles/app-shell.css";
import "./styles/auth-v3.css";
import "./styles/dropdown.css";
import "./styles/header-nav.css";
import "./styles/landing.css";
import "./styles/soft-controls.css";
import "./styles/soft-surfaces.css";
import "./styles/visual-system.css";

function loadOptionalWebFonts() {
  if (typeof document === "undefined" || Capacitor.isNativePlatform()) {
    return;
  }

  if (document.querySelector('link[data-pm-web-fonts="true"]')) {
    return;
  }

  const preconnect = document.createElement("link");
  preconnect.rel = "preconnect";
  preconnect.href = "https://fonts.googleapis.com";
  preconnect.setAttribute("data-pm-web-fonts", "true");
  document.head.appendChild(preconnect);

  const preconnectStatic = document.createElement("link");
  preconnectStatic.rel = "preconnect";
  preconnectStatic.href = "https://fonts.gstatic.com";
  preconnectStatic.crossOrigin = "anonymous";
  preconnectStatic.setAttribute("data-pm-web-fonts", "true");
  document.head.appendChild(preconnectStatic);

  const stylesheet = document.createElement("link");
  stylesheet.rel = "stylesheet";
  stylesheet.href =
    "https://fonts.googleapis.com/css2?family=Manrope:wght@700;800&family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Sora:wght@600;700;800&display=swap";
  stylesheet.setAttribute("data-pm-web-fonts", "true");
  document.head.appendChild(stylesheet);
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60 * 1000, retry: 1 },
  },
});

loadOptionalWebFonts();

if (!Capacitor.isNativePlatform()) {
  registerSW({
    immediate: true,
  });
}

appLog.info(
  `Старт UI: ${import.meta.env.MODE}, host=${typeof window !== "undefined" ? window.location.host : ""}`
);

if (typeof window !== "undefined") {
  window.addEventListener("error", (event) => {
    const source = event.filename ? ` @ ${event.filename}:${event.lineno}:${event.colno}` : "";
    appLog.error(`Runtime error: ${event.message}${source}`, event.error);
  });
  window.addEventListener("unhandledrejection", (event) => {
    appLog.error("Unhandled promise rejection", event.reason);
  });
}

createRoot(document.getElementById("root")!).render(
  Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios" ? (
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  ) : (
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </StrictMode>
  )
);
