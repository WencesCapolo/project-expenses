import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUserId } from "./lib/access";

// A short-lived URL the client POSTs a bill/receipt to. The returned storage
// id is then stored in an item's `attachments`. CONTEXT.md → Expense/Income.
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireUserId(ctx);
    return ctx.storage.generateUploadUrl();
  },
});

// Resolve storage ids to served URLs for display/download.
export const urls = query({
  args: { storageIds: v.array(v.id("_storage")) },
  handler: async (ctx, { storageIds }) => {
    await requireUserId(ctx);
    return Promise.all(
      storageIds.map(async (storageId) => ({
        storageId,
        url: await ctx.storage.getUrl(storageId),
      })),
    );
  },
});
