import { ReactNode } from "react";

// Bordered surface block — the default container for grouped content.
export default function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[var(--radius)] border border-border bg-surface p-5 ${className}`}
    >
      {children}
    </div>
  );
}
