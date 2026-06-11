// @vitest-environment edge-runtime
import { expect, test } from "vitest";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { actingAs } from "./testing";

const modules = import.meta.glob("./**/*.*s");

async function projectWithAnaAndBob() {
  const ctx = await actingAs(modules, "ana@example.com");
  const projectId = await ctx.as.mutation(api.projects.create, { name: "Trip" });
  const bobId = await ctx.t.run((db) => db.db.insert("users", { email: "bob@example.com" }));
  await ctx.as.mutation(api.participants.add, { projectId, email: "bob@example.com" });
  return { ...ctx, projectId, anaId: ctx.userId, bobId };
}

const equalSplit = (...userIds: Id<"users">[]) => ({
  mode: "equal" as const,
  beneficiaries: userIds.map((userId) => ({ userId })),
});

test("registers and lists an expense for its period", async () => {
  const { as, projectId, anaId, bobId } = await projectWithAnaAndBob();

  await as.mutation(api.expenses.create, {
    projectId,
    title: "Hotel",
    amountCents: 12000,
    payerId: anaId,
    split: equalSplit(anaId, bobId),
    period: "2026-06",
    attachments: [],
  });

  const june = await as.query(api.expenses.listByPeriod, { projectId, period: "2026-06" });
  const may = await as.query(api.expenses.listByPeriod, { projectId, period: "2026-05" });
  expect(june).toHaveLength(1);
  expect(may).toHaveLength(0);
});

test("rejects a beneficiary who is not a participant", async () => {
  const { t, as, projectId, anaId } = await projectWithAnaAndBob();
  const strangerId = await t.run((db) => db.db.insert("users", { email: "stranger@example.com" }));

  await expect(
    as.mutation(api.expenses.create, {
      projectId,
      title: "Hotel",
      amountCents: 12000,
      payerId: anaId,
      split: equalSplit(anaId, strangerId),
      period: "2026-06",
      attachments: [],
    }),
  ).rejects.toThrow();
});

test("rejects a non-positive amount", async () => {
  const { as, projectId, anaId } = await projectWithAnaAndBob();
  await expect(
    as.mutation(api.expenses.create, {
      projectId,
      title: "Hotel",
      amountCents: 0,
      payerId: anaId,
      split: equalSplit(anaId),
      period: "2026-06",
      attachments: [],
    }),
  ).rejects.toThrow();
});

test("rejects an empty beneficiary set", async () => {
  const { as, projectId, anaId } = await projectWithAnaAndBob();
  await expect(
    as.mutation(api.expenses.create, {
      projectId,
      title: "Hotel",
      amountCents: 1000,
      payerId: anaId,
      split: { mode: "equal", beneficiaries: [] },
      period: "2026-06",
      attachments: [],
    }),
  ).rejects.toThrow();
});

test("rejects a malformed period", async () => {
  const { as, projectId, anaId } = await projectWithAnaAndBob();
  await expect(
    as.mutation(api.expenses.create, {
      projectId,
      title: "Hotel",
      amountCents: 1000,
      payerId: anaId,
      split: equalSplit(anaId),
      period: "2026-13",
      attachments: [],
    }),
  ).rejects.toThrow();
});
