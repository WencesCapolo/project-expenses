"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import ParticipantsPanel from "@/components/projects/ParticipantsPanel";
import ExpensesSection from "@/components/expenses/ExpensesSection";

// Project detail. Reads projects.get, which also enforces the viewer is a
// Participant. Money views (expenses, incomes, settlements, balance) mount
// here in later slices.
export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const project = useQuery(api.projects.get, {
    projectId: projectId as Id<"projects">,
  });

  return (
    <div className="space-y-6">
      <Link href="/projects" className="text-sm text-muted hover:text-foreground">
        ← Back to projects
      </Link>

      {project === undefined ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : project === null ? (
        <Card>
          <p className="text-sm text-muted">
            Project not found, or you don&apos;t have access.
          </p>
        </Card>
      ) : (
        <>
          <PageHeader
            title={project.name}
            description={`${project.currency} · Default split: ${
              project.defaultSplitMode === "equal" ? "Equal" : "Weighted shares"
            }`}
          />
          <ParticipantsPanel projectId={project._id} />
          <ExpensesSection
            projectId={project._id}
            currency={project.currency}
            defaultSplitMode={project.defaultSplitMode}
          />
          <Card>
            <p className="text-sm text-muted">
              Incomes, settlements and balance arrive in later slices.
            </p>
          </Card>
        </>
      )}
    </div>
  );
}
