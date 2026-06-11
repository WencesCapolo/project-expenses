import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import { MutationCtx, mutation, query } from "./_generated/server";
import { requireParticipant } from "./lib/access";

export interface ParticipantView {
  participantId: Id<"participants">;
  userId: Id<"users">;
  name?: string;
  email?: string;
}

async function findUserByEmail(
  ctx: MutationCtx,
  email: string,
): Promise<Doc<"users">> {
  const user = await ctx.db
    .query("users")
    .withIndex("email", (q) => q.eq("email", email))
    .unique();
  if (user === null) {
    throw new Error(`No user found with email ${email}`);
  }
  return user;
}

async function existingMembership(
  ctx: MutationCtx,
  projectId: Id<"projects">,
  userId: Id<"users">,
) {
  return ctx.db
    .query("participants")
    .withIndex("by_project_user", (q) =>
      q.eq("projectId", projectId).eq("userId", userId),
    )
    .unique();
}

// Add an existing User to a Project by email. Idempotent: adding someone who
// is already a Participant is a no-op. CONTEXT.md → Participant (1:1 with User).
export const add = mutation({
  args: { projectId: v.id("projects"), email: v.string() },
  handler: async (ctx, { projectId, email }) => {
    await requireParticipant(ctx, projectId);
    const user = await findUserByEmail(ctx, email);
    const already = await existingMembership(ctx, projectId, user._id);
    if (already !== null) {
      return already._id;
    }
    return ctx.db.insert("participants", { projectId, userId: user._id });
  },
});

export const list = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }): Promise<ParticipantView[]> => {
    await requireParticipant(ctx, projectId);
    const memberships = await ctx.db
      .query("participants")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect();
    return Promise.all(
      memberships.map(async (membership) => {
        const user = await ctx.db.get(membership.userId);
        return {
          participantId: membership._id,
          userId: membership.userId,
          name: user?.name,
          email: user?.email,
        };
      }),
    );
  },
});

async function appearsInAnyItem(
  ctx: MutationCtx,
  projectId: Id<"projects">,
  userId: Id<"users">,
): Promise<boolean> {
  const beneficiaryIncludes = (split: { beneficiaries: { userId: string }[] }) =>
    split.beneficiaries.some((beneficiary) => beneficiary.userId === userId);

  const expenses = await ctx.db
    .query("expenses")
    .withIndex("by_project", (q) => q.eq("projectId", projectId))
    .collect();
  if (expenses.some((e) => e.payerId === userId || beneficiaryIncludes(e.split))) {
    return true;
  }

  const incomes = await ctx.db
    .query("incomes")
    .withIndex("by_project", (q) => q.eq("projectId", projectId))
    .collect();
  if (incomes.some((i) => i.recipientId === userId || beneficiaryIncludes(i.split))) {
    return true;
  }

  const settlements = await ctx.db
    .query("settlements")
    .withIndex("by_project", (q) => q.eq("projectId", projectId))
    .collect();
  return settlements.some(
    (s) => s.fromUserId === userId || s.toUserId === userId,
  );
}

// A Participant can only be removed once they no longer appear in any item,
// so no Expense, Income, or Settlement is left pointing at a non-member.
// CONTEXT.md → Participant (no removal with outstanding involvement).
export const remove = mutation({
  args: { projectId: v.id("projects"), userId: v.id("users") },
  handler: async (ctx, { projectId, userId }) => {
    await requireParticipant(ctx, projectId);
    const membership = await existingMembership(ctx, projectId, userId);
    if (membership === null) {
      return;
    }
    if (await appearsInAnyItem(ctx, projectId, userId)) {
      throw new Error(
        "Cannot remove a participant who still appears in project items",
      );
    }
    await ctx.db.delete(membership._id);
  },
});
