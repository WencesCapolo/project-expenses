"use client";

import Dialog from "@/components/ui/Dialog";
import Button from "@/components/ui/Button";

// Destructive-action confirmation built on Dialog. Surfaces an optional error
// (e.g. a server guard rejecting the delete) without closing the prompt.
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Eliminar",
  pending = false,
  error,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  pending?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Dialog open={open} onClose={onCancel} title={title}>
      <p className="text-sm text-muted">{message}</p>
      {error && <p className="mt-3 text-sm text-danger">{error}</p>}
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel} disabled={pending}>
          Cancelar
        </Button>
        <Button variant="danger" onClick={onConfirm} disabled={pending}>
          {pending ? "Eliminando…" : confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}
