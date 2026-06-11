"use client";

import { useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import Button from "@/components/ui/Button";
import { convexErrorMessage } from "@/lib/convexError";

const ACCEPT = "image/*,application/pdf";

// Reusable attachment uploader for item forms (Expense, and later Income /
// Settlement). Owns nothing persistent: it uploads files to Convex storage and
// reports the resulting storage ids through `onChange`; the parent form stores
// them on the item. CONTEXT.md → Expense/Income (optional attached bills).
export default function AttachmentsField({
  value,
  onChange,
  disabled,
}: {
  value: Id<"_storage">[];
  onChange: (ids: Id<"_storage">[]) => void;
  disabled?: boolean;
}) {
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList) {
    setError(null);
    setUploading(true);
    try {
      const uploaded: Id<"_storage">[] = [];
      for (const file of Array.from(files)) {
        const uploadUrl = await generateUploadUrl();
        const res = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });
        if (!res.ok) {
          throw new Error("Upload failed");
        }
        const { storageId } = (await res.json()) as { storageId: Id<"_storage"> };
        uploaded.push(storageId);
      }
      onChange([...value, ...uploaded]);
    } catch (err) {
      setError(convexErrorMessage(err, "Could not upload one or more files."));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function remove(id: Id<"_storage">) {
    onChange(value.filter((existing) => existing !== id));
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        disabled={disabled || uploading}
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            void handleFiles(e.target.files);
          }
        }}
        className="text-sm file:mr-3 file:rounded-[var(--radius)] file:border file:border-border file:bg-surface file:px-3 file:py-1.5 file:text-sm hover:file:bg-surface-muted"
      />
      {uploading && <p className="text-sm text-muted">Uploading…</p>}
      {error && <p className="text-sm text-danger">{error}</p>}
      {value.length > 0 && (
        <ul className="flex flex-col gap-1">
          {value.map((id, index) => (
            <li
              key={id}
              className="flex items-center justify-between gap-3 text-sm"
            >
              <span className="truncate text-muted">Attachment {index + 1}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={disabled || uploading}
                onClick={() => remove(id)}
              >
                Remove
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
