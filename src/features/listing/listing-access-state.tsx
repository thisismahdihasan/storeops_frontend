import Link from "next/link";
import { AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

type ListingAccessStateProps = {
  description?: string;
  title?: string;
  workspaceId: string;
};

export function ListingAccessState({
  description = "This workflow is available only to members with the explicit Lister role.",
  title = "Lister access required",
  workspaceId,
}: ListingAccessStateProps) {
  return (
    <main className="mx-auto max-w-lg p-4 sm:p-6">
      <section className="rounded-xl border border-destructive/20 bg-card p-6 text-center">
        <AlertCircle className="mx-auto size-8 text-destructive" />
        <h1 className="mt-3 text-xl font-semibold">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        <Button
          className="mt-4"
          nativeButton={false}
          render={<Link href={`/w/${workspaceId}`} />}
          variant="outline"
        >
          Back to workspace
        </Button>
      </section>
    </main>
  );
}
