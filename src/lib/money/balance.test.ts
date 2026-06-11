import { describe, expect, it } from "vitest";
import {
  PeriodLedger,
  netBalances,
  suggestedTransfers,
} from "./balance";
import { Split } from "./types";

const equal = (...userIds: string[]): Split => ({
  mode: "equal",
  beneficiaries: userIds.map((userId) => ({ userId })),
});

const emptyLedger = (): PeriodLedger => ({
  expenses: [],
  incomes: [],
  settlements: [],
});

const totalAcross = (net: Map<string, number>) =>
  [...net.values()].reduce((sum, cents) => sum + cents, 0);

describe("netBalances", () => {
  it("credits the payer and debits the beneficiaries of an expense", () => {
    const ledger = emptyLedger();
    ledger.expenses.push({
      amountCents: 12000,
      payerId: "ana",
      split: equal("ana", "bob", "cy"),
    });

    const net = netBalances(ledger);
    expect(net.get("ana")).toBe(8000);
    expect(net.get("bob")).toBe(-4000);
    expect(net.get("cy")).toBe(-4000);
  });

  it("mirrors an expense for an income (recipient owes the group)", () => {
    const ledger = emptyLedger();
    ledger.incomes.push({
      amountCents: 12000,
      recipientId: "ana",
      split: equal("ana", "bob", "cy"),
    });

    const net = netBalances(ledger);
    expect(net.get("ana")).toBe(-8000);
    expect(net.get("bob")).toBe(4000);
    expect(net.get("cy")).toBe(4000);
  });

  it("reduces debt by the amount of a settlement", () => {
    const ledger = emptyLedger();
    ledger.expenses.push({
      amountCents: 12000,
      payerId: "ana",
      split: equal("ana", "bob", "cy"),
    });
    ledger.settlements.push({
      fromUserId: "bob",
      toUserId: "ana",
      amountCents: 4000,
    });

    const net = netBalances(ledger);
    expect(net.get("ana")).toBe(4000);
    expect(net.get("bob")).toBe(0);
    expect(net.get("cy")).toBe(-4000);
  });

  it("always nets to zero across all participants", () => {
    const ledger: PeriodLedger = {
      expenses: [
        { amountCents: 10000, payerId: "ana", split: equal("ana", "bob", "cy") },
        { amountCents: 7333, payerId: "bob", split: equal("bob", "cy") },
      ],
      incomes: [
        { amountCents: 4500, recipientId: "cy", split: equal("ana", "bob", "cy") },
      ],
      settlements: [{ fromUserId: "cy", toUserId: "ana", amountCents: 1200 }],
    };
    expect(totalAcross(netBalances(ledger))).toBe(0);
  });
});

describe("suggestedTransfers", () => {
  it("collapses an expense into minimal payments to the payer", () => {
    const ledger = emptyLedger();
    ledger.expenses.push({
      amountCents: 12000,
      payerId: "ana",
      split: equal("ana", "bob", "cy"),
    });

    expect(suggestedTransfers(ledger)).toEqual([
      { fromUserId: "bob", toUserId: "ana", amountCents: 4000 },
      { fromUserId: "cy", toUserId: "ana", amountCents: 4000 },
    ]);
  });

  it("returns nothing when the period is already square", () => {
    const ledger = emptyLedger();
    ledger.expenses.push({
      amountCents: 9000,
      payerId: "ana",
      split: equal("ana", "bob", "cy"),
    });
    ledger.settlements.push({
      fromUserId: "bob",
      toUserId: "ana",
      amountCents: 3000,
    });
    ledger.settlements.push({
      fromUserId: "cy",
      toUserId: "ana",
      amountCents: 3000,
    });

    expect(suggestedTransfers(ledger)).toEqual([]);
  });

  it("matches the largest debtor against the largest creditor", () => {
    // ana paid 6000 for everyone; bob paid 300 only for himself + cy.
    const ledger: PeriodLedger = {
      expenses: [
        { amountCents: 6000, payerId: "ana", split: equal("ana", "bob", "cy") },
        { amountCents: 300, payerId: "bob", split: equal("bob", "cy") },
      ],
      incomes: [],
      settlements: [],
    };

    // Paying a transfer moves the debtor's net up and the creditor's down,
    // exactly like recording a settlement. Applying them all must zero the net.
    const settled = netBalances(ledger);
    for (const transfer of suggestedTransfers(ledger)) {
      settled.set(
        transfer.fromUserId,
        (settled.get(transfer.fromUserId) ?? 0) + transfer.amountCents,
      );
      settled.set(
        transfer.toUserId,
        (settled.get(transfer.toUserId) ?? 0) - transfer.amountCents,
      );
    }
    for (const cents of settled.values()) {
      expect(cents).toBe(0);
    }
  });
});
