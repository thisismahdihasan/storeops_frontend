import type { Metadata } from "next";

import { ThemeToggle } from "@/components/theme-toggle";
import { InviteCard } from "@/features/invite/invite-card";

export const metadata: Metadata = {
  title: "Join Workspace — StoreOps",
  description: "Accept your StoreOps workspace invitation.",
};

type InvitePageProps = {
  params: Promise<{
    token: string;
  }>;
};

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;

  return (
    <main className="page-shell relative">
      <div className="absolute right-6 top-6">
        <ThemeToggle />
      </div>

      <InviteCard token={token} />
    </main>
  );
}
