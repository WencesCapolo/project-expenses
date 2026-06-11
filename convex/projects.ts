import { v } from "convex/values";
import { Doc } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { requireParticipant, requireUserId } from "./lib/access";

const DEFAULT_CURRENCY = "USD";
const splitModeValidator = v.union(v.literal("equal"), v.literal("weighted"));

// Any signed-in User may start a Project; the creator becomes its first
// Participant. CONTEXT.md → Project, Participant.
export const create = mutation({
  args: {
    name: v.string(),
    currency: v.optional(v.string()),
    defaultSplitMode: v.optional(splitModeValidator),
  },
  handler: async (ctx, { name, currency, defaultSplitMode }) => {
    const userId = await requireUserId(ctx);
    const projectId = await ctx.db.insert("projects", {
      name,
      currency: currency ?? DEFAULT_CURRENCY,
      defaultSplitMode: defaultSplitMode ?? "equal",
      createdBy: userId,
    });
    await ctx.db.insert("participants", { projectId, userId });
    return projectId;
  },
});

// The Projects the signed-in User participates in.
export const listMine = query({
  args: {},
  handler: async (ctx): Promise<Doc<"projects">[]> => {
    const userId = await requireUserId(ctx);
    const memberships = await ctx.db
      .query("participants")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const projects = await Promise.all(
      memberships.map((membership) => ctx.db.get(membership.projectId)),
    );
    return projects.filter((project) => project !== null);
  },
});

export const get = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    await requireParticipant(ctx, projectId);
    return ctx.db.get(projectId);
  },
});
