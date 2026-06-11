"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";

// Minimal email + password form for the Password provider.
// Toggles between sign-in and sign-up via the `flow` field.
export default function SignInForm() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <form
      className="flex flex-col gap-3 w-full max-w-sm"
      onSubmit={async (e) => {
        e.preventDefault();
        setError(null);
        setPending(true);
        const data = new FormData(e.currentTarget);
        data.set("flow", flow);
        try {
          await signIn("password", data);
        } catch {
          setError(
            flow === "signIn"
              ? "Could not sign in. Check your credentials."
              : "Could not sign up. The email may already be in use.",
          );
        } finally {
          setPending(false);
        }
      }}
    >
      <h1 className="text-xl font-semibold">
        {flow === "signIn" ? "Sign in" : "Create account"}
      </h1>
      <input
        className="border rounded px-3 py-2"
        type="email"
        name="email"
        placeholder="Email"
        autoComplete="email"
        required
      />
      <input
        className="border rounded px-3 py-2"
        type="password"
        name="password"
        placeholder="Password"
        autoComplete={flow === "signIn" ? "current-password" : "new-password"}
        required
      />
      <button
        className="bg-foreground text-background rounded px-3 py-2 disabled:opacity-50"
        type="submit"
        disabled={pending}
      >
        {flow === "signIn" ? "Sign in" : "Sign up"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="button"
        className="text-sm underline self-start"
        onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
      >
        {flow === "signIn"
          ? "Need an account? Sign up"
          : "Have an account? Sign in"}
      </button>
    </form>
  );
}
