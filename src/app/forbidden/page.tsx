import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <main className="page-shell">
      <section className="surface max-w-md space-y-4 p-8">
        <p className="eyebrow">403</p>
        <h1 className="text-2xl font-semibold text-slate-950">
          You do not have access to this area.
        </h1>
        <p className="text-sm leading-6 text-slate-600">
          Your access is controlled by the ORDURA backend. Contact your
          workspace administrator if you believe this is incorrect.
        </p>
        <Link
          className="inline-flex rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-slate-900"
          href="/"
        >
          Return home
        </Link>
      </section>
    </main>
  );
}
