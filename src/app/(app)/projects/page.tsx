"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import NewProjectForm from "@/components/projects/NewProjectForm";

// Projects home: the Projects the signed-in User participates in, plus a
// create affordance. listMine already scopes to the current User. (#5)
export default function ProjectsPage() {
  const projects = useQuery(api.projects.listMine);
  const [creating, setCreating] = useState(false);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        description="Shared expense workspaces you belong to."
        action={
          !creating && (
            <Button onClick={() => setCreating(true)}>New project</Button>
          )
        }
      />

      {creating && (
        <Card>
          <NewProjectForm onDone={() => setCreating(false)} />
        </Card>
      )}

      {projects === undefined ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : projects.length === 0 ? (
        !creating && (
          <Card>
            <p className="text-sm text-muted">
              No projects yet. Create one to start tracking shared expenses.
            </p>
          </Card>
        )
      ) : (
        <ul className="space-y-3">
          {projects.map((project) => (
            <li key={project._id}>
              <Link href={`/projects/${project._id}`} className="block">
                <Card className="transition-colors hover:border-primary">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium">{project.name}</span>
                    <span className="text-sm text-muted">
                      {project.currency} ·{" "}
                      {project.defaultSplitMode === "equal"
                        ? "Equal"
                        : "Weighted"}
                    </span>
                  </div>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
