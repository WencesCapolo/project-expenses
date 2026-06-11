"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

// Reusable read-only view of an item's attachments. Resolves storage ids to
// served URLs and links each one; opening in a new tab covers both preview
// (browser renders PDFs/images inline) and download. Shared by Expense, and
// later Income / Settlement displays. CONTEXT.md → Expense/Income.
export default function AttachmentList({
  storageIds,
}: {
  storageIds: Id<"_storage">[];
}) {
  const resolved = useQuery(
    api.files.urls,
    storageIds.length > 0 ? { storageIds } : "skip",
  );

  if (storageIds.length === 0) return null;
  if (resolved === undefined) {
    return <p className="text-sm text-muted">Cargando adjuntos…</p>;
  }

  return (
    <ul className="flex flex-wrap gap-2">
      {resolved.map((item, index) =>
        item.url ? (
          <li key={item.storageId}>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-[var(--radius)] border border-border px-2 py-1 text-sm text-primary hover:bg-surface-muted"
            >
              Adjunto {index + 1} ↗
            </a>
          </li>
        ) : null,
      )}
    </ul>
  );
}
