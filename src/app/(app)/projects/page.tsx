import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

// Projects home. Listing and creation land here in a later slice (#5);
// for now this establishes the shell's primary view and nav target.
export default function ProjectsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        description="Shared expense workspaces you belong to."
        action={<Button disabled>New project</Button>}
      />
      <Card>
        <p className="text-sm text-muted">
          No projects yet. Project creation and listing arrive in the next
          slice. Open a sample detail view:{" "}
          <Link href="/projects/sample" className="text-primary underline">
            /projects/sample
          </Link>
          .
        </p>
      </Card>
    </div>
  );
}
