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
import SettlementForm from "@/components/settlements/SettlementForm";
import AttachmentList from "@/components/attachments/AttachmentList";

function currentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

// Settlements for one Project, scoped to a selected month. Record and delete
// are available — nothing is frozen. CONTEXT.md → Settlement, Period.
export default function SettlementsSection({
  projectId,
  currency,
}: {
  projectId: Id<"projects">;
  currency: string;
}) {
  const [period, setPeriod] = useState(currentPeriod);
  const [adding, setAdding] = useState(false);
  const [rowError, setRowError] = useState<string | null>(null);

  const participants = useQuery(api.participants.list, { projectId });
  const settlements = useQuery(api.settlements.listByPeriod, {
    projectId,
    period,
  });
  const remove = useMutation(api.settlements.remove);

  const nameByUser = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of participants ?? []) {
      map.set(p.userId, p.name ?? p.email ?? "Usuario desconocido");
    }
    return map;
  }, [participants]);

  async function handleDelete(settlement: Doc<"settlements">) {
    setRowError(null);
    try {
      await remove({ settlementId: settlement._id });
    } catch (err) {
      setRowError(convexErrorMessage(err, "No se pudo eliminar la liquidación."));
    }
  }

  // A Settlement needs two distinct Participants to transfer between.
  const canAdd = participants !== undefined && participants.length >= 2;

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-medium">Liquidaciones</h2>
        <div className="flex items-center gap-2">
          <Input
            type="month"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            aria-label="Mes"
            className="w-auto"
          />
          {!adding && (
            <Button size="sm" disabled={!canAdd} onClick={() => setAdding(true)}>
              Registrar liquidación
            </Button>
          )}
        </div>
      </div>

      {adding && participants && (
        <Card className="bg-surface-muted">
          <SettlementForm
            projectId={projectId}
            currency={currency}
            participants={participants}
            defaultPeriod={period}
            onDone={() => setAdding(false)}
          />
        </Card>
      )}

      {rowError && <p className="text-sm text-danger">{rowError}</p>}

      {settlements === undefined ? (
        <p className="text-sm text-muted">Cargando…</p>
      ) : settlements.length === 0 ? (
        <p className="text-sm text-muted">Sin liquidaciones para {period}.</p>
      ) : (
        <ul className="divide-y divide-border">
          {settlements.map((settlement) => (
            <li key={settlement._id} className="py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {nameByUser.get(settlement.fromUserId) ?? "Desconocido"} →{" "}
                    {nameByUser.get(settlement.toUserId) ?? "Desconocido"}
                  </p>
                  {settlement.note && (
                    <p className="truncate text-sm text-muted">
                      {settlement.note}
                    </p>
                  )}
                  {settlement.attachments.length > 0 && (
                    <div className="mt-2">
                      <AttachmentList storageIds={settlement.attachments} />
                    </div>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-sm font-medium tabular-nums">
                    {formatCents(settlement.amountCents, currency)}
                  </span>
                </div>
              </div>
              <div className="mt-2 flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(settlement)}
                >
                  Eliminar
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
