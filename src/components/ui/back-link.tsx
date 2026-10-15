import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { Button } from "./button";

type BackLinkProps = {
  children: ReactNode;
  href: string;
};

export function BackLink({ children, href }: BackLinkProps) {
  return (
    <Button
      className="border-primary/25 bg-primary/5 text-primary hover:border-primary/40 hover:bg-primary/10 hover:text-primary focus-visible:border-primary focus-visible:ring-primary/30 dark:bg-primary/15 dark:hover:bg-primary/25"
      nativeButton={false}
      render={<Link href={href} />}
      size="sm"
      variant="outline"
    >
      <ArrowLeft className="size-3.5" />
      {children}
    </Button>
  );
}
