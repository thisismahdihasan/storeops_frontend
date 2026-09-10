"use client";

import { useEffect } from "react";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error("Unhandled application error", error);
  }, [error]);

  return (
    <main className="page-shell">
      <section className="surface max-w-md space-y-4 p-8" role="alert">
        <p className="eyebrow">Application error</p>
        <h1 className="text-2xl font-semibold text-slate-950">
          Something went wrong.
        </h1>
        <p className="text-sm leading-6 text-slate-600">
          Please try again. If the problem continues, contact your workspace
          administrator.
        </p>
        <button
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-slate-900"
          onClick={reset}
          type="button"
        >
          Try again
        </button>
      </section>
    </main>
  );
}
