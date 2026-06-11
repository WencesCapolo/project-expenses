// @vitest-environment edge-runtime
import { expect, test } from "vitest";
import { api } from "./_generated/api";
import { actingAs } from "./testing";

const modules = import.meta.glob("./**/*.*s");

test("forPeriod suggests the minimal transfers that zero the month", async () => {
  const { t, as, userId: anaId } = await actingAs(modules, "ana@example.com");
  const projectId = await as.mutation(api.projects.create, { name: "Trip" });
  const bobId = await t.run((db) => db.db.insert("users", { email: "bob@example.com" }));
  await as.mutation(api.participants.add, { projectId, email: "bob@example.com" });

  await as.mutation(api.expenses.create, {
    projectId,
    title: "Hotel",
    amountCents: 12000,
    payerId: anaId,
    split: { mode: "equal", beneficiaries: [{ userId: anaId }, { userId: bobId }] },
    period: "2026-06",
    attachments: [],
  });

  const balance = await as.query(api.balances.forPeriod, { projectId, period: "2026-06" });

  expect(balance.transfers).toEqual([
    { fromUserId: bobId, toUserId: anaId, amountCents: 6000 },
  ]);
  // Applying the suggested transfers leaves nobody owing anybody.
  const settled = new Map(balance.net.map((p) => [p.userId, p.cents]));
  for (const transfer of balance.transfers) {
    settled.set(transfer.fromUserId, (settled.get(transfer.fromUserId) ?? 0) + transfer.amountCents);
    settled.set(transfer.toUserId, (settled.get(transfer.toUserId) ?? 0) - transfer.amountCents);
  }
  for (const cents of settled.values()) {
    expect(cents).toBe(0);
  }
});
