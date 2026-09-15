import assert from "node:assert/strict";
import { test } from "node:test";
import { parseJiraExport, JiraParseError } from "./jira.js";

function sampleExport(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
    issues: [
      {
        id: "10001",
        key: "PROJ-1",
        fields: {
          summary: "Rework the login form",
          description: "Uses the old form styles.",
          status: { name: "In Progress" },
          duedate: "2026-09-05",
          labels: ["frontend", "blocked"],
          resolution: null,
          project: { name: "Sprint 14" },
        },
      },
      {
        id: "10002",
        key: "PROJ-2",
        fields: {
          summary: "Ship the old widget",
          status: { name: "Done" },
          resolution: { name: "Fixed" },
        },
      },
    ],
    ...overrides,
  });
}

test("parses issues into the normalized shape, deriving lists from statuses", () => {
  const board = parseJiraExport(sampleExport());

  assert.equal(board.name, "Sprint 14");
  assert.deepEqual(board.lists, [
    { id: "In Progress", name: "In Progress", archived: false },
    { id: "Done", name: "Done", archived: false },
  ]);

  const [card1, card2] = board.cards;
  assert.equal(card1.id, "PROJ-1");
  assert.equal(card1.listId, "In Progress");
  assert.equal(card1.description, "Uses the old form styles.");
  assert.equal(card1.due, "2026-09-05");
  assert.equal(card1.archived, false);
  assert.deepEqual(card1.labels, ["frontend", "blocked"]);

  assert.equal(card2.listId, "Done");
  assert.equal(card2.description, "");
  assert.equal(card2.due, null);
  assert.equal(card2.archived, true);
  assert.deepEqual(card2.labels, []);
});

test("falls back to 'No Status' for issues without a status", () => {
  const board = parseJiraExport(
    JSON.stringify({ issues: [{ id: "1", key: "PROJ-1", fields: {} }] }),
  );
  assert.deepEqual(board.lists, [
    { id: "No Status", name: "No Status", archived: false },
  ]);
  assert.equal(board.cards[0].listId, "No Status");
});

test("defaults a missing board name to 'untitled board'", () => {
  const board = parseJiraExport(
    JSON.stringify({ issues: [{ id: "1", key: "PROJ-1", fields: {} }] }),
  );
  assert.equal(board.name, "untitled board");
});

test("rejects input that is not valid JSON", () => {
  assert.throws(() => parseJiraExport("{not json"), JiraParseError);
});

test("rejects JSON that is not an object", () => {
  assert.throws(() => parseJiraExport("[]"), JiraParseError);
  assert.throws(() => parseJiraExport("null"), JiraParseError);
  assert.throws(() => parseJiraExport('"a board"'), JiraParseError);
});

test("rejects an object missing an issues array", () => {
  assert.throws(
    () => parseJiraExport(JSON.stringify({ name: "No issues" })),
    JiraParseError,
  );
});
