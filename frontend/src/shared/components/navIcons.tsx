import type { ReactNode } from "react";

function EmojiNavIcon({ symbol }: { symbol: string }) {
  return (
    <span
      aria-hidden="true"
      className="inline-flex h-4 min-w-4 items-center justify-center text-[0.95rem] leading-none"
    >
      {symbol}
    </span>
  );
}

export function renderNavIcon(to: string): ReactNode {
  if (to === "/home") {
    return <EmojiNavIcon symbol="🏠" />;
  }

  if (to === "/illnesses/active") {
    return <EmojiNavIcon symbol="🩺" />;
  }

  if (to === "/children") {
    return <EmojiNavIcon symbol="👦👧" />;
  }

  if (to === "/medicine-cabinet") {
    return <EmojiNavIcon symbol="🧰" />;
  }

  if (to === "/pillbox") {
    return <EmojiNavIcon symbol="💊" />;
  }

  return <EmojiNavIcon symbol="⋯" />;
}
