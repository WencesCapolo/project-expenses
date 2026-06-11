"use client";

import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { redirect } from "next/navigation";
import SignInForm from "@/components/SignInForm";

// Landing route. Signed-in Users are sent into the app shell at /projects;
// signed-out visitors see the sign-in form. Avoids a flash via AuthLoading.
export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <AuthLoading>
        <p className="text-sm text-muted">Cargando…</p>
      </AuthLoading>
      <Unauthenticated>
        <SignInForm />
      </Unauthenticated>
      <Authenticated>
        <RedirectToProjects />
      </Authenticated>
    </main>
  );
}

function RedirectToProjects() {
  return redirect("/projects");
}
