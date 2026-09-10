import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page-shell">
      <section className="surface max-w-md space-y-4 p-8">
        <p className="eyebrow">404</p>
        <h1 className="text-2xl font-semibold text-slate-950">
          This page could not be found.
        </h1>
        <p className="text-sm leading-6 text-slate-600">
          The address may be incorrect or the page may no longer exist.
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
