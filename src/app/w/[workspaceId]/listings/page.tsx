import type { Metadata } from "next";

import { ListingsAdminView } from "@/features/listings-management/listings-admin-view";

export const metadata: Metadata = {
  description: "Operational management of workspace listings and catalog publication",
  title: "Listings — StoreOps",
};

type ListingsAdminPageProps = {
  params: Promise<{ workspaceId: string }>;
};

export default async function ListingsAdminPage({ params }: ListingsAdminPageProps) {
  const { workspaceId } = await params;

  return <ListingsAdminView workspaceId={workspaceId} />;
}
