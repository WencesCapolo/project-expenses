"use client";

import { ReactNode } from "react";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";

// Gate for the authenticated area. Unauthenticated visitors never see app
// content — they are bounced to the landing route. (proxy.ts enforces the
// same boundary server-side so gated data is never sent in the first place.)
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AuthLoading>
        <div className="flex min-h-full items-center justify-center">
          <p className="text-sm text-muted">Cargando…</p>
        </div>
      </AuthLoading>
      <Unauthenticated>
        <RedirectToHome />
      </Unauthenticated>
      <Authenticated>
        <AppShell>{children}</AppShell>
      </Authenticated>
    </>
  );
}

function RedirectToHome() {
  return redirect("/");
}
