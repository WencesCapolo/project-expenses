import { Infer } from "convex/values";
import { Id } from "../_generated/dataModel";
import { MutationCtx } from "../_generated/server";
import {
  assertHasBeneficiaries,
  assertPeriod,
  assertPositiveCents,
  assertUsersAreParticipants,
} from "./guards";
import { splitValidator } from "./validators";

type Split = Infer<typeof splitValidator>;

// Shared validation for an Expense or Income: the amount, period, and split
// must be well-formed, and the actor (Payer or Recipient) plus every
// Beneficiary must already be Participants of the Project.
// CONTEXT.md → Expense, Income.
export async function assertValidItem(
  ctx: MutationCtx,
  input: {
    projectId: Id<"projects">;
    amountCents: number;
    period: string;
    actorId: Id<"users">;
    split: Split;
  },
): Promise<void> {
  assertPositiveCents(input.amountCents);
  assertPeriod(input.period);
  assertHasBeneficiaries(input.split);
  const userIds = [
    input.actorId,
    ...input.split.beneficiaries.map((beneficiary) => beneficiary.userId),
  ];
  await assertUsersAreParticipants(ctx, input.projectId, userIds);
}
