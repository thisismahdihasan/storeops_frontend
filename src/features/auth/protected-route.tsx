"use client";

import type { ReactNode } from "react";

import { isUnauthenticatedError, useCurrentSession } from "./use-current-session";

type ProtectedRouteProps = {
  children: ReactNode;
  unauthenticatedFallback?: ReactNode;
};

function UnauthenticatedState() {
  return (
    <main className="page-shell">
      <section className="surface max-w-md space-y-3 p-8" role="status">
        <p className="eyebrow">Authentication required</p>
        <h1 className="text-2xl font-semibold text-slate-950">
          Your session has ended.
        </h1>
        <p className="text-sm leading-6 text-slate-600">
          Sign-in will be available in a later phase. This state does not
          redirect automatically, which prevents route-protection loops.
        </p>
      </section>
    </main>
  );
}

function SessionCheckFailed({ onRetry }: { onRetry: () => void }) {
  return (
    <main className="page-shell">
      <section className="surface max-w-md space-y-4 p-8" role="alert">
        <p className="eyebrow">Session unavailable</p>
        <h1 className="text-2xl font-semibold text-slate-950">
          We could not confirm your session.
        </h1>
        <button
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-slate-900"
          onClick={onRetry}
          type="button"
        >
          Try again
        </button>
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
