// @vitest-environment edge-runtime
import { expect, test } from "vitest";
import { api } from "./_generated/api";
import { actingAs } from "./testing";

const modules = import.meta.glob("./**/*.*s");

test("adding a participant by email is idempotent", async () => {
  const { t, as } = await actingAs(modules, "ana@example.com");
  const projectId = await as.mutation(api.projects.create, { name: "Trip" });
  await t.run((ctx) => ctx.db.insert("users", { email: "bob@example.com" }));

  await as.mutation(api.participants.add, { projectId, email: "bob@example.com" });
  await as.mutation(api.participants.add, { projectId, email: "bob@example.com" });

  const list = await as.query(api.participants.list, { projectId });
  expect(list.filter((p) => p.email === "bob@example.com")).toHaveLength(1);
});

test("adding a participant by an unknown email is rejected", async () => {
  const { as } = await actingAs(modules, "ana@example.com");
  const projectId = await as.mutation(api.projects.create, { name: "Trip" });

  await expect(
    as.mutation(api.participants.add, { projectId, email: "ghost@example.com" }),
  ).rejects.toThrow();
});

test("cannot remove a participant who appears in an expense", async () => {
  const { t, as, userId: anaId } = await actingAs(modules, "ana@example.com");
  const projectId = await as.mutation(api.projects.create, { name: "Trip" });
  const bobId = await t.run((db) => db.db.insert("users", { email: "bob@example.com" }));
  await as.mutation(api.participants.add, { projectId, email: "bob@example.com" });
  await as.mutation(api.expenses.create, {
    projectId,
    title: "Hotel",
    amountCents: 10000,
    payerId: anaId,
    split: { mode: "equal", beneficiaries: [{ userId: anaId }, { userId: bobId }] },
    period: "2026-06",
    attachments: [],
  });

  await expect(
    as.mutation(api.participants.remove, { projectId, userId: bobId }),
  ).rejects.toThrow();
});

test("removes a participant who appears in no items", async () => {
  const { t, as } = await actingAs(modules, "ana@example.com");
  const projectId = await as.mutation(api.projects.create, { name: "Trip" });
  const bobId = await t.run((db) => db.db.insert("users", { email: "bob@example.com" }));
  await as.mutation(api.participants.add, { projectId, email: "bob@example.com" });

  await as.mutation(api.participants.remove, { projectId, userId: bobId });

  const list = await as.query(api.participants.list, { projectId });
  expect(list.map((p) => p.email)).not.toContain("bob@example.com");
});
