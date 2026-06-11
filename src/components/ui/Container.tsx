import { ReactNode } from "react";

// Centered, width-capped content column. Shared horizontal rhythm for every page.
export default function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-3xl px-4 sm:px-6 ${className}`}>
      {children}
    </div>
  );
}
