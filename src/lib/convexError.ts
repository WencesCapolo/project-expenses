// Convex wraps a thrown Error as "... Uncaught Error: <message>\n    at ...".
// This pulls the original domain message back out so the UI can show the
// backend's reason (bad amount, non-participant, …) instead of the wrapper.
//
// NOTE: in production Convex strips plain-Error messages to "Server Error";
// the fallback is shown then. Moving backend throws to ConvexError (issue #12)
// makes these reasons reliable in all environments.
export function convexErrorMessage(err: unknown, fallback: string): string {
  const raw = err instanceof Error ? err.message : String(err);
  const match = raw.match(/Uncaught Error:\s*([^\n]*?)(?:\s+at\s|\n|$)/);
  const message = match?.[1]?.trim();
  return message && message !== "Server Error" ? message : fallback;
}
