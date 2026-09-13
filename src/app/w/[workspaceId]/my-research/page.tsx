import { redirect } from "next/navigation";

type MyResearchPageProps = {
  params: Promise<{ workspaceId: string }>;
};

export default async function MyResearchPage({ params }: MyResearchPageProps) {
  const { workspaceId } = await params;
  redirect(`/w/${workspaceId}/research`);
}
