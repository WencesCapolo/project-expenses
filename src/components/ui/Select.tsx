import { SelectHTMLAttributes } from "react";

// Native select styled to match Input. Children are the <option>s.
export default function Select({
  className = "",
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`h-10 w-full rounded-[var(--radius)] border border-border bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}
