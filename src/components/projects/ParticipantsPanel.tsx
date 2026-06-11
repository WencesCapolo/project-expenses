"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { convexErrorMessage } from "@/lib/convexError";

// Membership management for a single Project: list members, add an existing
// User by email, remove an uninvolved member. (#6)
export default function ParticipantsPanel({
  projectId,
}: {
  projectId: Id<"projects">;
}) {
  const participants = useQuery(api.participants.list, { projectId });
  const addParticipant = useMutation(api.participants.add);
  const removeParticipant = useMutation(api.participants.remove);

  const [email, setEmail] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [rowError, setRowError] = useState<{ userId: string; message: string } | null>(
    null,
  );
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAddError(null);
    setAdding(true);
    try {
      await addParticipant({ projectId, email: email.trim().toLowerCase() });
      setEmail("");
    } catch (err) {
      setAddError(convexErrorMessage(err, "No se pudo agregar al participante."));
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(userId: Id<"users">) {
    setRowError(null);
    setRemovingId(userId);
    try {
      await removeParticipant({ projectId, userId });
    } catch (err) {
      setRowError({
        userId,
        message: convexErrorMessage(err, "No se pudo quitar al participante."),
      });
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <Card className="space-y-4">
      <h2 className="font-medium">Participantes</h2>

      <form className="flex gap-2" onSubmit={handleAdd}>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="ej. dev@empresa.com"
          aria-label="Correo del participante"
          required
        />
        <Button type="submit" disabled={adding || email.trim() === ""}>
          {adding ? "Agregando…" : "Agregar"}
        </Button>
      </form>
      {addError && <p className="text-sm text-danger">{addError}</p>}

      {participants === undefined ? (
        <p className="text-sm text-muted">Cargando…</p>
      ) : (
        <ul className="divide-y divide-border">
          {participants.map((p) => (
            <li key={p.participantId} className="py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {p.name ?? p.email ?? "Usuario desconocido"}
                  </p>
                  {p.name && p.email && (
                    <p className="truncate text-sm text-muted">{p.email}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={removingId === p.userId}
                  onClick={() => handleRemove(p.userId)}
                >
                  {removingId === p.userId ? "Quitando…" : "Quitar"}
                </Button>
              </div>
              {rowError?.userId === p.userId && (
                <p className="mt-1 text-sm text-danger">{rowError.message}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
