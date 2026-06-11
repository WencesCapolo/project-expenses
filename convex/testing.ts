import { convexTest } from "convex-test";
import schema from "./schema";

type Modules = Record<string, () => Promise<unknown>>;

// Spin up a test backend and act as a freshly-created, signed-in User.
// getAuthUserId reads the part of `identity.subject` before "|", so a subject
// of `${userId}|session` authenticates the request as that User.
export async function actingAs(modules: Modules, email: string) {
  const t = convexTest(schema, modules);
  const userId = await t.run((ctx) => ctx.db.insert("users", { email }));
  return { t, userId, as: t.withIdentity({ subject: `${userId}|session` }) };
}
