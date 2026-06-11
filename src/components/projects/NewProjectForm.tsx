"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Field from "@/components/ui/Field";

// Create a Project. Currency defaults to USD and split mode to Equal per
// CONTEXT.md; both are settable here. On success we navigate into the new
// Project's detail view.
export default function NewProjectForm({ onDone }: { onDone?: () => void }) {
  const router = useRouter();
  const createProject = useMutation(api.projects.create);
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [defaultSplitMode, setDefaultSplitMode] = useState<"equal" | "weighted">(
    "equal",
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setError(null);
        setPending(true);
        try {
          const projectId = await createProject({
            name: name.trim(),
            currency: currency.trim().toUpperCase() || "USD",
            defaultSplitMode,
          });
          onDone?.();
          router.push(`/projects/${projectId}`);
        } catch {
          setError("Could not create the project. Try again.");
          setPending(false);
        }
      }}
    >
      <Field label="Name" htmlFor="project-name">
        <Input
          id="project-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Lisbon trip"
          required
          autoFocus
        />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Currency" htmlFor="project-currency">
          <Input
            id="project-currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            maxLength={3}
            className="uppercase"
          />
        </Field>
        <Field label="Default split" htmlFor="project-split">
          <Select
            id="project-split"
            value={defaultSplitMode}
            onChange={(e) =>
              setDefaultSplitMode(e.target.value as "equal" | "weighted")
            }
          >
            <option value="equal">Equal</option>
            <option value="weighted">Weighted shares</option>
          </Select>
        </Field>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex justify-end gap-2">
        {onDone && (
          <Button type="button" variant="secondary" onClick={onDone}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={pending || name.trim() === ""}>
          {pending ? "Creating…" : "Create project"}
        </Button>
      </div>
    </form>
  );
}
