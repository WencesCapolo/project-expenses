import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";

// Project detail. Expenses, incomes, settlements and balance views mount here
// in later slices. For now it proves nav into and back out of a Project.
export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  return (
    <div className="space-y-6">
      <Link href="/projects" className="text-sm text-muted hover:text-foreground">
        ← Back to projects
      </Link>
      <PageHeader title="Project" description={`Detail view for "${projectId}".`} />
      <Card>
        <p className="text-sm text-muted">
          Project content (expenses, incomes, settlements, balance) arrives in
          later slices.
        </p>
      </Card>
    </div>
  );
}
