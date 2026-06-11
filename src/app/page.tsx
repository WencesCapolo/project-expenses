"use client";

import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import SignInForm from "@/components/SignInForm";

export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <AuthLoading>
        <p className="text-sm opacity-60">Loading…</p>
      </AuthLoading>
      <Unauthenticated>
        <SignInForm />
      </Unauthenticated>
      <Authenticated>
        <SignedIn />
      </Authenticated>
    </main>
  );
}

function SignedIn() {
  const { signOut } = useAuthActions();
  return (
    <div className="flex flex-col items-center gap-4">
      <h1 className="text-2xl font-semibold">Project Expenses</h1>
      <p className="opacity-70">You are signed in.</p>
      <button
        className="border rounded px-3 py-2 text-sm"
        onClick={() => void signOut()}
      >
        Sign out
      </button>
    </div>
  );
}
