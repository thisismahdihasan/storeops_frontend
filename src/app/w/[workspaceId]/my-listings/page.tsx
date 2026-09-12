import { redirect } from "next/navigation";

type MyListingsPageProps = {
  params: Promise<{ workspaceId: string }>;
};

export default async function MyListingsPage({ params }: MyListingsPageProps) {
  const { workspaceId } = await params;
  redirect(`/w/${workspaceId}/listing`);
}
