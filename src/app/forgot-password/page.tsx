import type { Metadata } from "next";
import { Suspense } from "react";

import { ThemeToggle } from "@/components/theme-toggle";
import { ForgotPasswordForm } from "@/features/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Reset password — StoreOps",
  description: "Reset your StoreOps account password.",
};

export default function ForgotPasswordPage() {
  return (
    <main className="page-shell relative">
      <div className="absolute right-6 top-6">
        <ThemeToggle />
      </div>

      <div className="surface w-full max-w-md space-y-6 p-8">
        <div className="space-y-1.5 text-center">
          <p className="eyebrow">StoreOps</p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Account recovery
          </h1>
          <p className="text-sm text-muted-foreground">
            Follow the steps below to securely reset your password.
          </p>
        </div>

        <Suspense
          fallback={
            <div className="py-8 text-center text-sm text-muted-foreground">
              Loading form…
            </div>
          }
        >
          <ForgotPasswordForm />
        </Suspense>
      </div>
    </main>
  );
}
