import { ReactNode } from "react";

type Tone = "primary" | "success" | "danger" | "muted";

const TONES: Record<Tone, string> = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  danger: "bg-danger/10 text-danger",
  muted: "bg-surface-muted text-muted",
};

// A tinted circle holding a glyph or initial. The shared leading visual for
// list rows (movements, projects) so direction/identity reads at a glance.
export default function IconBadge({
  tone = "muted",
  children,
  className = "",
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base font-medium ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
