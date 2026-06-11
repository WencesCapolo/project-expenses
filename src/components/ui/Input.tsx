import { InputHTMLAttributes } from "react";

// Text input primitive — shared border, radius, focus ring across forms.
export default function Input({
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`h-10 w-full rounded-[var(--radius)] border border-border bg-surface px-3 text-sm placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${className}`}
      {...props}
    />
  );
}
