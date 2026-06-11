import { describe, expect, it } from "vitest";
import { splitAmount } from "./split";
import { Split } from "./types";

const equal = (...userIds: string[]): Split => ({
  mode: "equal",
  beneficiaries: userIds.map((userId) => ({ userId })),
});

const sumCents = (shares: { cents: number }[]) =>
  shares.reduce((total, share) => total + share.cents, 0);

describe("splitAmount", () => {
  it("divides evenly when the amount is divisible", () => {
    const shares = splitAmount(12000, equal("ana", "bob", "cy"));
    expect(shares).toEqual([
      { userId: "ana", cents: 4000 },
      { userId: "bob", cents: 4000 },
      { userId: "cy", cents: 4000 },
    ]);
  });

  it("hands leftover cents to earlier beneficiaries for an equal split", () => {
    const shares = splitAmount(10000, equal("ana", "bob", "cy"));
    expect(shares).toEqual([
      { userId: "ana", cents: 3334 },
      { userId: "bob", cents: 3333 },
      { userId: "cy", cents: 3333 },
    ]);
  });

  it("always sums exactly to the original amount", () => {
    for (const amount of [1, 7, 99, 100, 101, 9999, 10000, 123457]) {
      expect(sumCents(splitAmount(amount, equal("ana", "bob", "cy")))).toBe(
        amount,
      );
    }
  });

  it("divides by weighted shares", () => {
    const split: Split = {
      mode: "weighted",
      beneficiaries: [
        { userId: "ana", shares: 2 },
        { userId: "bob", shares: 1 },
        { userId: "cy", shares: 1 },
      ],
    };
    expect(splitAmount(10000, split)).toEqual([
      { userId: "ana", cents: 5000 },
      { userId: "bob", cents: 2500 },
      { userId: "cy", cents: 2500 },
    ]);
  });

  it("treats absent shares as one in weighted mode", () => {
    const split: Split = {
      mode: "weighted",
      beneficiaries: [{ userId: "ana", shares: 3 }, { userId: "bob" }],
    };
    expect(splitAmount(100, split)).toEqual([
      { userId: "ana", cents: 75 },
      { userId: "bob", cents: 25 },
    ]);
  });

  it("gives the whole amount to a single beneficiary", () => {
    expect(splitAmount(4999, equal("ana"))).toEqual([
      { userId: "ana", cents: 4999 },
    ]);
  });

  it("rejects an empty beneficiary set", () => {
    expect(() => splitAmount(100, equal())).toThrow();
  });

  it("rejects a non-integer or negative amount", () => {
    expect(() => splitAmount(10.5, equal("ana"))).toThrow();
    expect(() => splitAmount(-100, equal("ana"))).toThrow();
  });
});
