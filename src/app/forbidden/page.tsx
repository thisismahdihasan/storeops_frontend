import Link from "next/link";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

export default function ForbiddenPage() {
  return (
    <main className="page-shell relative">
      <div className="absolute right-6 top-6">
        <ThemeToggle />
      </div>

      <section className="surface max-w-md space-y-4 p-8">
        <p className="eyebrow">403</p>
        <h1 className="text-2xl font-semibold text-foreground">
          You do not have access to this area.
        </h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Your access is controlled by the StoreOps backend. Contact your
          workspace administrator if you believe this is incorrect.
        </p>
        <Button nativeButton={false} render={<Link href="/" />}>
          Return home
        </Button>
      </section>
    </main>
  );
}
