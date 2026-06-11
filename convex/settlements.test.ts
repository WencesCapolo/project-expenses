// @vitest-environment edge-runtime
import { expect, test } from "vitest";
import { api } from "./_generated/api";
import { actingAs } from "./testing";

const modules = import.meta.glob("./**/*.*s");

async function projectWithAnaAndBob() {
  const ctx = await actingAs(modules, "ana@example.com");
  const projectId = await ctx.as.mutation(api.projects.create, { name: "Trip" });
  const bobId = await ctx.t.run((db) => db.db.insert("users", { email: "bob@example.com" }));
  await ctx.as.mutation(api.participants.add, { projectId, email: "bob@example.com" });
  return { ...ctx, projectId, anaId: ctx.userId, bobId };
}

test("records and lists a settlement", async () => {
  const { as, projectId, anaId, bobId } = await projectWithAnaAndBob();

  await as.mutation(api.settlements.create, {
    projectId,
    fromUserId: bobId,
    toUserId: anaId,
    amountCents: 4000,
    period: "2026-06",
    attachments: [],
  });

  const list = await as.query(api.settlements.listByPeriod, { projectId, period: "2026-06" });
  expect(list).toHaveLength(1);
  expect(list[0].amountCents).toBe(4000);
});

test("rejects a settlement from a participant to themselves", async () => {
  const { as, projectId, anaId } = await projectWithAnaAndBob();

  await expect(
    as.mutation(api.settlements.create, {
      projectId,
      fromUserId: anaId,
      toUserId: anaId,
      amountCents: 4000,
      period: "2026-06",
      attachments: [],
    }),
  ).rejects.toThrow();
});
