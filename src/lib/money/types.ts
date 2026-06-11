// Pure domain types for money math. Deliberately free of Convex/React types
// so the split and settlement logic stays testable in isolation.
// See CONTEXT.md → Split Rule, Beneficiary, Balance.

export type SplitMode = "equal" | "weighted";

export interface Beneficiary {
  userId: string;
  // Used only when mode is "weighted"; absent shares count as one.
  shares?: number;
}

export interface Split {
  mode: SplitMode;
  beneficiaries: Beneficiary[];
}

// One beneficiary's portion of an amount, in integer cents.
export interface Share {
  userId: string;
  cents: number;
}
