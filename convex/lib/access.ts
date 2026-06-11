import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "../_generated/dataModel";
import { MutationCtx, QueryCtx } from "../_generated/server";

type Ctx = QueryCtx | MutationCtx;

// The signed-in User, or an error if the request is unauthenticated.
export async function requireUserId(ctx: Ctx): Promise<Id<"users">> {
  const userId = await getAuthUserId(ctx);
  if (userId === null) {
    throw new Error("Not authenticated");
  }
  return userId;
}

// The signed-in User, guaranteed to be a Participant of the given Project.
// Permissions are flat in v1: any Participant may act within their Projects.
// See CONTEXT.md → Participant.
export async function requireParticipant(
  ctx: Ctx,
  projectId: Id<"projects">,
): Promise<Id<"users">> {
  const userId = await requireUserId(ctx);
  const membership = await ctx.db
    .query("participants")
    .withIndex("by_project_user", (q) =>
      q.eq("projectId", projectId).eq("userId", userId),
    )
    .unique();
  if (membership === null) {
    throw new Error("Not a participant of this project");
  }
  return userId;
}
