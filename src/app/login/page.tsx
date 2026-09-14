import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { StoreOpsLogo } from "@/components/brand/storeops-logo";
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
        <div className="space-y-3 text-center">
          <div className="flex justify-center">
            <Link
              href="/"
              className="inline-flex rounded-md focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="StoreOps Home"
            >
              <StoreOpsLogo variant="full" height={32} priority />
            </Link>
          </div>
          <div className="space-y-1.5">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Sign in to your account
            </h1>
            <p className="text-sm text-muted-foreground">
              Enter your email and password to access your workspaces.
            </p>
          </div>
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
