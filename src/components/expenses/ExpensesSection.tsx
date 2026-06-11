"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Doc, Id } from "../../../convex/_generated/dataModel";
import { formatCents } from "@/lib/money/currency";
import { convexErrorMessage } from "@/lib/convexError";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import ExpenseForm from "@/components/expenses/ExpenseForm";
import AttachmentList from "@/components/attachments/AttachmentList";

type SplitMode = "equal" | "weighted";

function currentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

// Expenses for one Project, scoped to a selected month. Register, edit and
// delete are all available — nothing is frozen. CONTEXT.md → Expense, Period.
export default function ExpensesSection({
  projectId,
  currency,
  defaultSplitMode,
}: {
  projectId: Id<"projects">;
  currency: string;
  defaultSplitMode: SplitMode;
}) {
  const [period, setPeriod] = useState(currentPeriod);
  const [editing, setEditing] = useState<"new" | Id<"expenses"> | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);

  const participants = useQuery(api.participants.list, { projectId });
  const expenses = useQuery(api.expenses.listByPeriod, { projectId, period });
  const remove = useMutation(api.expenses.remove);

  const nameByUser = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of participants ?? []) {
      map.set(p.userId, p.name ?? p.email ?? "Unknown user");
    }
    return map;
  }, [participants]);

  async function handleDelete(expense: Doc<"expenses">) {
    setRowError(null);
    try {
      await remove({ expenseId: expense._id });
    } catch (err) {
      setRowError(convexErrorMessage(err, "Could not delete the expense."));
    }
  }

  const canAdd = participants !== undefined && participants.length > 0;

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-medium">Expenses</h2>
        <div className="flex items-center gap-2">
          <Input
            type="month"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            aria-label="Month"
            className="w-auto"
          />
          {editing === null && (
            <Button size="sm" disabled={!canAdd} onClick={() => setEditing("new")}>
              Add expense
            </Button>
          )}
        </div>
      </div>

      {editing === "new" && participants && (
        <Card className="bg-surface-muted">
          <ExpenseForm
            projectId={projectId}
            currency={currency}
            defaultSplitMode={defaultSplitMode}
            participants={participants}
            defaultPeriod={period}
            onDone={() => setEditing(null)}
          />
        </Card>
      )}

      {rowError && <p className="text-sm text-danger">{rowError}</p>}

      {expenses === undefined ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : expenses.length === 0 ? (
        <p className="text-sm text-muted">No expenses for {period}.</p>
      ) : (
        <ul className="divide-y divide-border">
          {expenses.map((expense) =>
            editing === expense._id && participants ? (
              <li key={expense._id} className="py-3">
                <Card className="bg-surface-muted">
                  <ExpenseForm
                    projectId={projectId}
                    currency={currency}
                    defaultSplitMode={defaultSplitMode}
                    participants={participants}
                    defaultPeriod={period}
                    expense={expense}
                    onDone={() => setEditing(null)}
                  />
                </Card>
              </li>
            ) : (
              <li key={expense._id} className="py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {expense.title}
                    </p>
                    <p className="truncate text-sm text-muted">
                      {nameByUser.get(expense.payerId) ?? "Unknown"} paid ·{" "}
                      {expense.split.mode === "equal" ? "Equal" : "Weighted"} ·{" "}
                      {expense.split.beneficiaries.length} beneficiaries
                    </p>
                    {expense.note && (
                      <p className="truncate text-sm text-muted">{expense.note}</p>
                    )}
                    {expense.attachments.length > 0 && (
                      <div className="mt-2">
                        <AttachmentList storageIds={expense.attachments} />
                      </div>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-sm font-medium tabular-nums">
                      {formatCents(expense.amountCents, currency)}
                    </span>
                  </div>
                </div>
                <div className="mt-2 flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={editing !== null}
                    onClick={() => setEditing(expense._id)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={editing !== null}
                    onClick={() => handleDelete(expense)}
                  >
                    Delete
                  </Button>
                </div>
              </li>
            ),
          )}
        </ul>
      )}
    </Card>
  );
}
