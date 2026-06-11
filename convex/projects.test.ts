// @vitest-environment edge-runtime
import { expect, test } from "vitest";
import { api } from "./_generated/api";
import { actingAs } from "./testing";

const modules = import.meta.glob("./**/*.*s");

test("creating a project makes the creator a participant", async () => {
  const { userId, as } = await actingAs(modules, "ana@example.com");

  const projectId = await as.mutation(api.projects.create, { name: "Office Trip" });
  const participants = await as.query(api.participants.list, { projectId });

  expect(participants.map((p) => p.userId)).toContain(userId);
});
