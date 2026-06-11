import { Infer } from "convex/values";
import { Id } from "../_generated/dataModel";
import { MutationCtx, QueryCtx } from "../_generated/server";
import { splitValidator } from "./validators";
import { appError } from "./errors";

type Ctx = QueryCtx | MutationCtx;
type Split = Infer<typeof splitValidator>;

const PERIOD_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

// A Period is a calendar month tagged "YYYY-MM". CONTEXT.md → Period.
export function assertPeriod(period: string): void {
  if (!PERIOD_PATTERN.test(period)) {
    throw appError("INVALID_PERIOD", "El mes debe tener el formato AAAA-MM.");
  }
}

export function assertPositiveCents(amountCents: number): void {
  if (!Number.isInteger(amountCents) || amountCents <= 0) {
    throw appError("INVALID_AMOUNT", "El monto debe ser positivo.");
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
      throw appError(
        "NOT_PARTICIPANTS",
        "Todos los actores y beneficiarios deben ser participantes del proyecto.",
      );
    }
  }
}

export function assertHasBeneficiaries(split: Split): void {
  if (split.beneficiaries.length === 0) {
    throw appError("NO_BENEFICIARIES", "Se requiere al menos un beneficiario.");
  }
}
