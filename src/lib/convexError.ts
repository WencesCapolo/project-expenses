import { ConvexError } from "convex/values";

// Backend mutations throw ConvexError with a structured { code, message }
// payload (convex/lib/errors.ts). Unlike a plain Error — whose text Convex
// strips to "Server Error" in production — the `data` payload survives to the
// client in every environment, so the precise reason is always available.
// Falls back to a caller-supplied message when the error is not one of ours.
// CONTEXT.md → issue #12.
export function convexErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ConvexError) {
    const data: unknown = err.data;
    if (
      typeof data === "object" &&
      data !== null &&
      "message" in data &&
      typeof (data as { message: unknown }).message === "string"
    ) {
      return (data as { message: string }).message;
    }
  }
  return fallback;
}
