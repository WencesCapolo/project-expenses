"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { useAuthActions } from "@convex-dev/auth/react";
import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";

// Persistent chrome for every authenticated view: brand returns to the
// Projects home, sign-out is always reachable from the header.
export default function AppShell({ children }: { children: ReactNode }) {
  const { signOut } = useAuthActions();

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-10 border-b border-border bg-surface/80 backdrop-blur">
        <Container className="flex h-14 items-center justify-between">
          <Link
            href="/projects"
            className="font-semibold tracking-tight hover:opacity-80"
          >
            Convolution.Expenses
          </Link>
          <Button variant="ghost" size="sm" onClick={() => void signOut()}>
            Cerrar sesión
          </Button>
        </Container>
      </header>
      <main className="flex-1 py-8">
        <Container>{children}</Container>
      </main>
    </div>
  );
}
