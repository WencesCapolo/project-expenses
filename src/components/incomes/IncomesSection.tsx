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
import IncomeForm from "@/components/incomes/IncomeForm";
import AttachmentList from "@/components/attachments/AttachmentList";

type SplitMode = "equal" | "weighted";

function currentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

// Incomes for one Project, scoped to a selected month. Register, edit and
// delete are all available — nothing is frozen. CONTEXT.md → Income, Period.
export default function IncomesSection({
  projectId,
  currency,
  defaultSplitMode,
}: {
  projectId: Id<"projects">;
  currency: string;
  defaultSplitMode: SplitMode;
}) {
  const [period, setPeriod] = useState(currentPeriod);
  const [editing, setEditing] = useState<"new" | Id<"incomes"> | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);

  const participants = useQuery(api.participants.list, { projectId });
  const incomes = useQuery(api.incomes.listByPeriod, { projectId, period });
  const remove = useMutation(api.incomes.remove);

  const nameByUser = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of participants ?? []) {
      map.set(p.userId, p.name ?? p.email ?? "Usuario desconocido");
    }
    return map;
  }, [participants]);

  async function handleDelete(income: Doc<"incomes">) {
    setRowError(null);
    try {
      await remove({ incomeId: income._id });
    } catch (err) {
      setRowError(convexErrorMessage(err, "No se pudo eliminar el ingreso."));
    }
  }

  const canAdd = participants !== undefined && participants.length > 0;

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-medium">Ingresos</h2>
        <div className="flex items-center gap-2">
          <Input
            type="month"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            aria-label="Mes"
            className="w-auto"
          />
          {editing === null && (
            <Button size="sm" disabled={!canAdd} onClick={() => setEditing("new")}>
              Agregar ingreso
            </Button>
          )}
        </div>
      </div>

      {editing === "new" && participants && (
        <Card className="bg-surface-muted">
          <IncomeForm
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

      {incomes === undefined ? (
        <p className="text-sm text-muted">Cargando…</p>
      ) : incomes.length === 0 ? (
        <p className="text-sm text-muted">Sin ingresos para {period}.</p>
      ) : (
        <ul className="divide-y divide-border">
          {incomes.map((income) =>
            editing === income._id && participants ? (
              <li key={income._id} className="py-3">
                <Card className="bg-surface-muted">
                  <IncomeForm
                    projectId={projectId}
                    currency={currency}
                    defaultSplitMode={defaultSplitMode}
                    participants={participants}
                    defaultPeriod={period}
                    income={income}
                    onDone={() => setEditing(null)}
                  />
                </Card>
              </li>
            ) : (
              <li key={income._id} className="py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{income.title}</p>
                    <p className="truncate text-sm text-muted">
                      {nameByUser.get(income.recipientId) ?? "Desconocido"} recibió ·{" "}
                      {income.split.mode === "equal" ? "Equitativo" : "Ponderado"}{" "}
                      · {income.split.beneficiaries.length} beneficiarios
                    </p>
                    {income.description && (
                      <p className="truncate text-sm text-muted">
                        {income.description}
                      </p>
                    )}
                    {income.attachments.length > 0 && (
                      <div className="mt-2">
                        <AttachmentList storageIds={income.attachments} />
                      </div>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-sm font-medium tabular-nums">
                      {formatCents(income.amountCents, currency)}
                    </span>
                  </div>
                </div>
                <div className="mt-2 flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={editing !== null}
                    onClick={() => setEditing(income._id)}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={editing !== null}
                    onClick={() => handleDelete(income)}
                  >
                    Eliminar
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
