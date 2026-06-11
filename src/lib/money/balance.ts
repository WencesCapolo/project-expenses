import { Split } from "./types";
import { splitAmount } from "./split";

// A cost fronted by one Payer for a set of Beneficiaries. CONTEXT.md → Expense.
export interface ExpenseEntry {
  amountCents: number;
  payerId: string;
  split: Split;
}

// Money from outside the group held by one Recipient. CONTEXT.md → Income.
export interface IncomeEntry {
  amountCents: number;
  recipientId: string;
  split: Split;
}

// An actual transfer clearing debt. CONTEXT.md → Settlement.
export interface SettlementEntry {
  fromUserId: string;
  toUserId: string;
  amountCents: number;
}

// Everything belonging to one Project + Period, the input to a Balance.
export interface PeriodLedger {
  expenses: ExpenseEntry[];
  incomes: IncomeEntry[];
  settlements: SettlementEntry[];
}

// A suggested payment to move the Balance toward zero.
export interface Transfer {
  fromUserId: string;
  toUserId: string;
  amountCents: number;
}

// Net position per Participant in cents: positive means they are owed money
// (a creditor), negative means they owe money (a debtor). The sum across all
// Participants is always zero. CONTEXT.md → Balance.
export function netBalances(ledger: PeriodLedger): Map<string, number> {
  const net = new Map<string, number>();
  const credit = (userId: string, cents: number) =>
    net.set(userId, (net.get(userId) ?? 0) + cents);

  for (const expense of ledger.expenses) {
    credit(expense.payerId, expense.amountCents);
    for (const share of splitAmount(expense.amountCents, expense.split)) {
      credit(share.userId, -share.cents);
    }
  }

  for (const income of ledger.incomes) {
    credit(income.recipientId, -income.amountCents);
    for (const share of splitAmount(income.amountCents, income.split)) {
      credit(share.userId, share.cents);
    }
  }

  for (const settlement of ledger.settlements) {
    credit(settlement.fromUserId, settlement.amountCents);
    credit(settlement.toUserId, -settlement.amountCents);
  }

  return net;
}

interface Position {
  userId: string;
  cents: number;
}

function sortedByAmountThenUser(positions: Position[]): Position[] {
  return [...positions].sort(
    (a, b) => b.cents - a.cents || a.userId.localeCompare(b.userId),
  );
}

function partition(net: Map<string, number>): {
  debtors: Position[];
  creditors: Position[];
} {
  const debtors: Position[] = [];
  const creditors: Position[] = [];
  for (const [userId, cents] of net) {
    if (cents < 0) {
      debtors.push({ userId, cents: -cents });
    } else if (cents > 0) {
      creditors.push({ userId, cents });
    }
  }
  return {
    debtors: sortedByAmountThenUser(debtors),
    creditors: sortedByAmountThenUser(creditors),
  };
}

// Greedily match the largest debtor against the largest creditor to produce a
// minimal set of transfers that zeroes everyone out. Deterministic: ties are
// broken by userId so the same Balance always yields the same suggestions.
// CONTEXT.md → Balance (minimal transfers).
export function minimalTransfers(net: Map<string, number>): Transfer[] {
  const { debtors, creditors } = partition(net);
  const transfers: Transfer[] = [];

  let debtorIndex = 0;
  let creditorIndex = 0;
  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];
    const amountCents = Math.min(debtor.cents, creditor.cents);

    transfers.push({
      fromUserId: debtor.userId,
      toUserId: creditor.userId,
      amountCents,
    });

    debtor.cents -= amountCents;
    creditor.cents -= amountCents;
    if (debtor.cents === 0) {
      debtorIndex += 1;
    }
    if (creditor.cents === 0) {
      creditorIndex += 1;
    }
  }

  return transfers;
}

// Convenience: the suggested transfers for a Period's ledger. This is what the
// Settle button computes. CONTEXT.md → Balance.
export function suggestedTransfers(ledger: PeriodLedger): Transfer[] {
  return minimalTransfers(netBalances(ledger));
}
