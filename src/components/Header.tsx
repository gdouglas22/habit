import type { ReactNode } from "react";

// "Пятница / Сегодня" style screen header used across diary screens.
export function Header({
  eyebrow,
  title,
  right,
}: {
  eyebrow: string;
  title: string;
  right?: ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        marginBottom: 16,
      }}
    >
      <div>
        <div
          style={{
            fontSize: 13,
            fontWeight: 800,
            color: "var(--hint)",
            textTransform: "capitalize",
          }}
        >
          {eyebrow}
        </div>
        <div
          style={{
            fontSize: 28,
            fontWeight: 900,
            color: "var(--text)",
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
          }}
        >
          {title}
        </div>
      </div>
      {right}
    </div>
  );
}
