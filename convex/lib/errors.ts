import { ConvexError } from "convex/values";

// A user-facing failure with a stable machine code and a Spanish message.
// Unlike a plain Error, a ConvexError's `data` payload survives to the client
// in production (Convex strips plain Error text to "Server Error"), so the UI
// can show the real reason in every environment. CONTEXT.md → issue #12.
export interface AppErrorData {
  code: string;
  message: string;
  [key: string]: string;
}

export function appError(code: string, message: string): ConvexError<AppErrorData> {
  return new ConvexError({ code, message });
}
