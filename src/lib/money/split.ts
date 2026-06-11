import { Beneficiary, Share, Split, SplitMode } from "./types";

const ABSENT_SHARES_COUNT = 1;

function weightOf(beneficiary: Beneficiary, mode: SplitMode): number {
  if (mode === "equal") {
    return ABSENT_SHARES_COUNT;
  }
  return beneficiary.shares ?? ABSENT_SHARES_COUNT;
}

function assertSplittable(amountCents: number, split: Split): void {
  if (!Number.isInteger(amountCents) || amountCents < 0) {
    throw new Error("Amount must be a non-negative integer number of cents");
  }
  if (split.beneficiaries.length === 0) {
    throw new Error("Cannot split an amount with no beneficiaries");
  }
}

// Beneficiary indices ordered by who most deserves a leftover cent: largest
// fractional remainder first, ties broken by the beneficiaries' own order
// (the stable Participant order from CONTEXT.md). For an equal split every
// remainder is identical, so distribution falls back to that stable order.
function leftoverPriority(
  amountCents: number,
  weights: number[],
  totalWeight: number,
): number[] {
  const fractionalRemainder = weights.map((w) => (amountCents * w) % totalWeight);
  return weights
    .map((_, index) => index)
    .sort((a, b) => fractionalRemainder[b] - fractionalRemainder[a] || a - b);
}

// Divide an amount across its beneficiaries using the largest-remainder method,
// so the shares always sum exactly to the amount (no lost or phantom cents).
// See CONTEXT.md → Split Rule.
export function splitAmount(amountCents: number, split: Split): Share[] {
  assertSplittable(amountCents, split);

  const { beneficiaries, mode } = split;
  const weights = beneficiaries.map((b) => weightOf(b, mode));
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  if (totalWeight <= 0) {
    throw new Error("Total split weight must be positive");
  }

  const cents = weights.map((w) => Math.floor((amountCents * w) / totalWeight));
  const distributed = cents.reduce((sum, c) => sum + c, 0);
  let leftoverCents = amountCents - distributed;

  for (const index of leftoverPriority(amountCents, weights, totalWeight)) {
    if (leftoverCents === 0) {
      break;
    }
    cents[index] += 1;
    leftoverCents -= 1;
  }

  return beneficiaries.map((beneficiary, index) => ({
    userId: beneficiary.userId,
    cents: cents[index],
  }));
}
