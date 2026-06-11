"use client";

import { useMemo, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Doc, Id } from "../../../convex/_generated/dataModel";
import type { ParticipantView } from "../../../convex/participants";
import { splitAmount } from "@/lib/money/split";
import { formatAmount, formatCents, parseAmountToCents } from "@/lib/money/currency";
import { convexErrorMessage } from "@/lib/convexError";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Field from "@/components/ui/Field";

type SplitMode = "equal" | "weighted";

interface Row {
  userId: Id<"users">;
  label: string;
  included: boolean;
  shares: string; // major-unit text; only meaningful when weighted
}

function buildRows(
  participants: ParticipantView[],
  expense: Doc<"expenses"> | undefined,
): Row[] {
  return participants.map((p) => {
    const onExpense = expense?.split.beneficiaries.find(
      (b) => b.userId === p.userId,
    );
    return {
      userId: p.userId,
      label: p.name ?? p.email ?? "Unknown user",
      included: expense ? onExpense !== undefined : true,
      shares: onExpense?.shares ? String(onExpense.shares) : "1",
    };
  });
}

// Create or edit an Expense. The split and Beneficiary set are snapshotted on
// submit; the Payer is a Beneficiary by default but may be unchecked. The
// per-Beneficiary preview reuses the same largest-remainder split the backend
// stores. CONTEXT.md → Expense, Split Rule. (#7)
export default function ExpenseForm({
  projectId,
  currency,
  defaultSplitMode,
  participants,
  defaultPeriod,
  expense,
  onDone,
}: {
  projectId: Id<"projects">;
  currency: string;
  defaultSplitMode: SplitMode;
  participants: ParticipantView[];
  defaultPeriod: string;
  expense?: Doc<"expenses">;
  onDone: () => void;
}) {
  const create = useMutation(api.expenses.create);
  const update = useMutation(api.expenses.update);

  const [title, setTitle] = useState(expense?.title ?? "");
  const [note, setNote] = useState(expense?.note ?? "");
  const [amount, setAmount] = useState(
    expense ? formatAmount(expense.amountCents) : "",
  );
  const [payerId, setPayerId] = useState<Id<"users"> | "">(
    expense?.payerId ?? participants[0]?.userId ?? "",
  );
  const [period, setPeriod] = useState(expense?.period ?? defaultPeriod);
  const [mode, setMode] = useState<SplitMode>(
    expense?.split.mode ?? defaultSplitMode,
  );
  const [rows, setRows] = useState<Row[]>(() =>
    buildRows(participants, expense),
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const amountCents = parseAmountToCents(amount);
  const included = rows.filter((r) => r.included);

  // Live per-beneficiary breakdown, recomputed from the same logic the backend
  // uses. Empty when the amount or shares are not yet valid to split.
  const preview = useMemo(() => {
    if (amountCents === null || included.length === 0) return null;
    const beneficiaries = included.map((r) => ({
      userId: r.userId,
      shares: mode === "weighted" ? Number(r.shares) : undefined,
    }));
    if (
      mode === "weighted" &&
      beneficiaries.some((b) => !Number.isInteger(b.shares) || (b.shares ?? 0) <= 0)
    ) {
      return null;
    }
    try {
      const shares = splitAmount(amountCents, { mode, beneficiaries });
      return new Map(shares.map((s) => [s.userId, s.cents]));
    } catch {
      return null;
    }
  }, [amountCents, included, mode]);

  function setRow(userId: Id<"users">, patch: Partial<Row>) {
    setRows((prev) =>
      prev.map((r) => (r.userId === userId ? { ...r, ...patch } : r)),
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (payerId === "") {
      setError("Choose a payer.");
      return;
    }
    if (amountCents === null) {
      setError("Enter a positive amount (up to two decimals).");
      return;
    }
    if (included.length === 0) {
      setError("Select at least one beneficiary.");
      return;
    }
    const beneficiaries = included.map((r) => ({
      userId: r.userId,
      shares: mode === "weighted" ? Number(r.shares) : undefined,
    }));
    if (
      mode === "weighted" &&
      beneficiaries.some((b) => !Number.isInteger(b.shares) || (b.shares ?? 0) <= 0)
    ) {
      setError("Weighted shares must be positive whole numbers.");
      return;
    }

    const split = { mode, beneficiaries };
    setPending(true);
    try {
      if (expense) {
        await update({
          expenseId: expense._id,
          title: title.trim(),
          note: note.trim() || undefined,
          amountCents,
          payerId,
          split,
          period,
          attachments: expense.attachments,
        });
      } else {
        await create({
          projectId,
          title: title.trim(),
          note: note.trim() || undefined,
          amountCents,
          payerId,
          split,
          period,
          attachments: [],
        });
      }
      onDone();
    } catch (err) {
      setError(convexErrorMessage(err, "Could not save the expense."));
      setPending(false);
    }
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <Field label="Title" htmlFor="expense-title">
        <Input
          id="expense-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Dinner"
          required
          autoFocus
        />
      </Field>

      <Field label="Note (optional)" htmlFor="expense-note">
        <Input
          id="expense-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Anything worth remembering"
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label={`Amount (${currency})`} htmlFor="expense-amount">
          <Input
            id="expense-amount"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            required
          />
        </Field>
        <Field label="Payer" htmlFor="expense-payer">
          <Select
            id="expense-payer"
            value={payerId}
            onChange={(e) => setPayerId(e.target.value as Id<"users">)}
          >
            {participants.map((p) => (
              <option key={p.userId} value={p.userId}>
                {p.name ?? p.email ?? "Unknown user"}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Month" htmlFor="expense-month">
          <Input
            id="expense-month"
            type="month"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            required
          />
        </Field>
      </div>

      <Field label="Split" htmlFor="expense-split-mode">
        <Select
          id="expense-split-mode"
          value={mode}
          onChange={(e) => setMode(e.target.value as SplitMode)}
        >
          <option value="equal">Equal</option>
          <option value="weighted">Weighted shares</option>
        </Select>
      </Field>

      <fieldset className="rounded-[var(--radius)] border border-border p-3">
        <legend className="px-1 text-sm font-medium">Beneficiaries</legend>
        <ul className="divide-y divide-border">
          {rows.map((row) => (
            <li
              key={row.userId}
              className="flex items-center justify-between gap-3 py-2"
            >
              <label className="flex min-w-0 items-center gap-2">
                <input
                  type="checkbox"
                  checked={row.included}
                  onChange={(e) =>
                    setRow(row.userId, { included: e.target.checked })
                  }
                />
                <span className="truncate text-sm">{row.label}</span>
              </label>
              <div className="flex items-center gap-3">
                {mode === "weighted" && row.included && (
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={row.shares}
                    onChange={(e) =>
                      setRow(row.userId, { shares: e.target.value })
                    }
                    aria-label={`Shares for ${row.label}`}
                    className="h-8 w-16 rounded-[var(--radius)] border border-border bg-surface px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                )}
                {row.included && preview?.has(row.userId) && (
                  <span className="w-24 text-right text-sm text-muted">
                    {formatCents(preview.get(row.userId)!, currency)}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </fieldset>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : expense ? "Save changes" : "Add expense"}
        </Button>
      </div>
    </form>
  );
}
