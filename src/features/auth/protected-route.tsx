"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";

import { isUnauthenticatedError, useCurrentSession } from "./use-current-session";

type ProtectedRouteProps = {
  children: ReactNode;
  unauthenticatedFallback?: ReactNode;
};

function UnauthenticatedState() {
  return (
    <main className="page-shell">
      <section className="surface max-w-md space-y-4 p-8" role="status">
        <p className="eyebrow">Authentication required</p>
        <h1 className="text-2xl font-semibold text-foreground">
          Your session has ended.
        </h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Please sign in to access your StoreOps workspace.
        </p>
        <Button nativeButton={false} render={<Link href="/login" />}>
          Sign in
        </Button>
      </section>
    </main>
  );
}

function SessionCheckFailed({ onRetry }: { onRetry: () => void }) {
  return (
    <main className="page-shell">
      <section className="surface max-w-md space-y-4 p-8" role="alert">
        <p className="eyebrow">Session unavailable</p>
        <h1 className="text-2xl font-semibold text-foreground">
          We could not confirm your session.
        </h1>
        <Button onClick={onRetry} type="button">
          Try again
        </Button>
      </section>
    </main>
  );
}

export function ProtectedRoute({
  children,
  unauthenticatedFallback,
}: ProtectedRouteProps) {
  const sessionQuery = useCurrentSession();

  if (sessionQuery.isPending) {
    return <main className="page-shell">Checking your session…</main>;
  }

  if (sessionQuery.isError) {
    if (isUnauthenticatedError(sessionQuery.error)) {
      return unauthenticatedFallback ?? <UnauthenticatedState />;
    }

    return <SessionCheckFailed onRetry={() => void sessionQuery.refetch()} />;
  }

  return children;
}
