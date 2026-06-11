import { Infer } from "convex/values";
import { Id } from "../_generated/dataModel";
import { MutationCtx, QueryCtx } from "../_generated/server";
import { splitValidator } from "./validators";

type Ctx = QueryCtx | MutationCtx;
type Split = Infer<typeof splitValidator>;

const PERIOD_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

// A Period is a calendar month tagged "YYYY-MM". CONTEXT.md → Period.
export function assertPeriod(period: string): void {
  if (!PERIOD_PATTERN.test(period)) {
    throw new Error(`Period must be in YYYY-MM format, got "${period}"`);
  }
}

export function assertPositiveCents(amountCents: number): void {
  if (!Number.isInteger(amountCents) || amountCents <= 0) {
    throw new Error("Amount must be a positive whole number of cents");
  }
}

async function participantIds(
  ctx: Ctx,
  projectId: Id<"projects">,
): Promise<Set<string>> {
  const members = await ctx.db
    .query("participants")
    .withIndex("by_project", (q) => q.eq("projectId", projectId))
    .collect();
  return new Set(members.map((member) => member.userId));
}

// Every User referenced by an Expense/Income (its actor and Beneficiaries)
// must already be a Participant of the Project. Guards against splitting a
// cost onto someone who isn't in the Project.
export async function assertUsersAreParticipants(
  ctx: Ctx,
  projectId: Id<"projects">,
  userIds: Id<"users">[],
): Promise<void> {
  const participants = await participantIds(ctx, projectId);
  for (const userId of userIds) {
    if (!participants.has(userId)) {
      throw new Error("All actors and beneficiaries must be project participants");
    }
  }
}

export function assertHasBeneficiaries(split: Split): void {
  if (split.beneficiaries.length === 0) {
    throw new Error("At least one beneficiary is required");
  }
}
