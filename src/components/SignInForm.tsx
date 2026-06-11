"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import Card from "@/components/ui/Card";
import Field from "@/components/ui/Field";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

type Flow = "signIn" | "signUp";

const COPY = {
  signIn: {
    heading: "Iniciar sesión",
    submit: "Iniciar sesión",
    toggle: "¿No tienes cuenta? Regístrate",
    error: "No se pudo iniciar sesión. Revisa tu correo y contraseña.",
  },
  signUp: {
    heading: "Crear cuenta",
    submit: "Registrarse",
    toggle: "¿Ya tienes cuenta? Inicia sesión",
    error: "No se pudo crear la cuenta. Ese correo quizás ya está en uso.",
  },
} as const;

// Email + password entry for the Convex Auth Password provider. One form
// covers both flows: the `flow` field tells the backend whether to create an
// account or authenticate an existing one. On success the provider sets the
// session and the surrounding <Authenticated> gate routes into the app.
export default function SignInForm() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<Flow>("signIn");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    const data = new FormData(event.currentTarget);
    data.set("flow", flow);
    try {
      await signIn("password", data);
    } catch {
      setError(COPY[flow].error);
      setPending(false);
    }
  }

  function toggleFlow() {
    setError(null);
    setFlow((current) => (current === "signIn" ? "signUp" : "signIn"));
  }

  const copy = COPY[flow];

  return (
    <Card className="w-full max-w-sm space-y-5">
      <h1 className="text-xl font-semibold">{copy.heading}</h1>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <Field label="Correo electrónico" htmlFor="auth-email">
          <Input
            id="auth-email"
            type="email"
            name="email"
            placeholder="tu@correo.com"
            autoComplete="email"
            required
            autoFocus
          />
        </Field>

        <Field label="Contraseña" htmlFor="auth-password">
          <Input
            id="auth-password"
            type="password"
            name="password"
            placeholder="••••••••"
            autoComplete={flow === "signIn" ? "current-password" : "new-password"}
            required
          />
        </Field>

        {error && <p className="text-sm text-danger">{error}</p>}

        <Button type="submit" disabled={pending}>
          {pending ? "Procesando…" : copy.submit}
        </Button>
      </form>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="self-start px-0"
        onClick={toggleFlow}
      >
        {copy.toggle}
      </Button>
    </Card>
  );
}
