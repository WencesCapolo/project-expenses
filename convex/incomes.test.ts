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

test("registers and lists an income for its period", async () => {
  const { as, projectId, anaId, bobId } = await projectWithAnaAndBob();

  await as.mutation(api.incomes.create, {
    projectId,
    title: "Client payment",
    description: "March sprint invoice",
    amountCents: 12000,
    recipientId: anaId,
    split: equalSplit(anaId, bobId),
    period: "2026-06",
    attachments: [],
  });

  const june = await as.query(api.incomes.listByPeriod, { projectId, period: "2026-06" });
  const may = await as.query(api.incomes.listByPeriod, { projectId, period: "2026-05" });
  expect(june).toHaveLength(1);
  expect(may).toHaveLength(0);
});

test("rejects a recipient who is not a participant", async () => {
  const { t, as, projectId, anaId } = await projectWithAnaAndBob();
  const strangerId = await t.run((db) => db.db.insert("users", { email: "stranger@example.com" }));

  await expect(
    as.mutation(api.incomes.create, {
      projectId,
      title: "Client payment",
      description: "March sprint invoice",
      amountCents: 12000,
      recipientId: strangerId,
      split: equalSplit(anaId),
      period: "2026-06",
      attachments: [],
    }),
  ).rejects.toThrow();
});

test("rejects a beneficiary who is not a participant", async () => {
  const { t, as, projectId, anaId } = await projectWithAnaAndBob();
  const strangerId = await t.run((db) => db.db.insert("users", { email: "stranger@example.com" }));

  await expect(
    as.mutation(api.incomes.create, {
      projectId,
      title: "Client payment",
      description: "March sprint invoice",
      amountCents: 12000,
      recipientId: anaId,
      split: equalSplit(anaId, strangerId),
      period: "2026-06",
      attachments: [],
    }),
  ).rejects.toThrow();
});

test("rejects a non-positive amount", async () => {
  const { as, projectId, anaId } = await projectWithAnaAndBob();
  await expect(
    as.mutation(api.incomes.create, {
      projectId,
      title: "Client payment",
      description: "March sprint invoice",
      amountCents: 0,
      recipientId: anaId,
      split: equalSplit(anaId),
      period: "2026-06",
      attachments: [],
    }),
  ).rejects.toThrow();
});

test("rejects an empty beneficiary set", async () => {
  const { as, projectId, anaId } = await projectWithAnaAndBob();
  await expect(
    as.mutation(api.incomes.create, {
      projectId,
      title: "Client payment",
      description: "March sprint invoice",
      amountCents: 1000,
      recipientId: anaId,
      split: { mode: "equal", beneficiaries: [] },
      period: "2026-06",
      attachments: [],
    }),
  ).rejects.toThrow();
});

test("rejects a malformed period", async () => {
  const { as, projectId, anaId } = await projectWithAnaAndBob();
  await expect(
    as.mutation(api.incomes.create, {
      projectId,
      title: "Client payment",
      description: "March sprint invoice",
      amountCents: 1000,
      recipientId: anaId,
      split: equalSplit(anaId),
      period: "2026-13",
      attachments: [],
    }),
  ).rejects.toThrow();
});

test("cannot remove a participant who appears in an income", async () => {
  const { as, projectId, anaId, bobId } = await projectWithAnaAndBob();

  await as.mutation(api.incomes.create, {
    projectId,
    title: "Client payment",
    description: "March sprint invoice",
    amountCents: 12000,
    recipientId: anaId,
    split: equalSplit(anaId, bobId),
    period: "2026-06",
    attachments: [],
  });

  await expect(
    as.mutation(api.participants.remove, { projectId, userId: bobId }),
  ).rejects.toThrow();
});
