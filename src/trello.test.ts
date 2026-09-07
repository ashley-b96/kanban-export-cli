import assert from "node:assert/strict";
import { test } from "node:test";
import { parseTrelloExport, TrelloParseError } from "./trello.js";

function sampleExport(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
    name: "Sprint 14",
    lists: [
      { id: "list1", name: "Backlog", closed: false },
      { id: "list2", name: "Done", closed: true },
    ],
    cards: [
      {
        id: "card1",
        name: "Rework the login form",
        idList: "list1",
        desc: "Uses the old form styles.",
        due: "2026-09-05T00:00:00.000Z",
        closed: false,
        labels: [{ name: "frontend", color: "blue" }, { color: "red" }, {}],
      },
      {
        id: "card2",
        name: "Ship the old widget",
        idList: "list2",
        closed: true,
      },
    ],
    ...overrides,
  });
}

test("parses lists and cards into the normalized shape", () => {
  const board = parseTrelloExport(sampleExport());

  assert.equal(board.name, "Sprint 14");
  assert.deepEqual(board.lists, [
    { id: "list1", name: "Backlog", archived: false },
    { id: "list2", name: "Done", archived: true },
  ]);

  const [card1, card2] = board.cards;
  assert.equal(card1.id, "card1");
  assert.equal(card1.listId, "list1");
  assert.equal(card1.description, "Uses the old form styles.");
  assert.equal(card1.due, "2026-09-05T00:00:00.000Z");
  assert.equal(card1.archived, false);
  assert.deepEqual(card1.labels, ["frontend", "red", "?"]);

  assert.equal(card2.description, "");
  assert.equal(card2.due, null);
  assert.equal(card2.archived, true);
  assert.deepEqual(card2.labels, []);
});

test("defaults a missing board name to 'untitled board'", () => {
  const board = parseTrelloExport(sampleExport({ name: undefined }));
  assert.equal(board.name, "untitled board");
});

test("rejects input that is not valid JSON", () => {
  assert.throws(() => parseTrelloExport("{not json"), TrelloParseError);
});

test("rejects JSON that is not an object", () => {
  assert.throws(() => parseTrelloExport("[]"), TrelloParseError);
  assert.throws(() => parseTrelloExport("null"), TrelloParseError);
  assert.throws(() => parseTrelloExport('"a board"'), TrelloParseError);
});

test("rejects an object missing lists or cards", () => {
  assert.throws(
    () => parseTrelloExport(JSON.stringify({ name: "No lists", cards: [] })),
    TrelloParseError,
  );
  assert.throws(
    () => parseTrelloExport(JSON.stringify({ name: "No cards", lists: [] })),
    TrelloParseError,
  );
});
