import type { Metadata } from "next";
import { Suspense } from "react";

import { ThemeToggle } from "@/components/theme-toggle";
import { RegisterForm } from "@/features/auth/register-form";

export const metadata: Metadata = {
  title: "Create an account — StoreOps",
  description: "Create your account to access StoreOps.",
};

export default function RegisterPage() {
  return (
    <main className="page-shell relative">
      <div className="absolute right-6 top-6">
        <ThemeToggle />
      </div>

      <div className="surface w-full max-w-md space-y-6 p-8">
        <div className="space-y-1.5 text-center">
          <p className="eyebrow">StoreOps</p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Create your account
          </h1>
          <p className="text-sm text-muted-foreground">
            Get started with your StoreOps production workflow.
          </p>
        </div>

        <Suspense
          fallback={
            <div className="py-8 text-center text-sm text-muted-foreground">
              Loading form…
            </div>
          }
        >
          <RegisterForm />
        </Suspense>
      </div>
    </main>
  );
}
