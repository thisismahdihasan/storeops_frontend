import type { Metadata } from "next";
import { Suspense } from "react";

import { ThemeToggle } from "@/components/theme-toggle";
import { LoginForm } from "@/features/auth/login-form";

export const metadata: Metadata = {
  title: "Sign in — StoreOps",
  description: "Sign in to access your StoreOps workflow.",
};

export default function LoginPage() {
  return (
    <main className="page-shell relative">
      <div className="absolute right-6 top-6">
        <ThemeToggle />
      </div>

      <div className="surface w-full max-w-md space-y-6 p-8">
        <div className="space-y-1.5 text-center">
          <p className="eyebrow">StoreOps</p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Sign in to your account
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter your email and password to access your workspaces.
          </p>
        </div>

        <Suspense
          fallback={
            <div className="py-8 text-center text-sm text-muted-foreground">
              Loading form…
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
