import assert from "node:assert/strict";
import { test } from "node:test";
import { filterBoard } from "./filter.js";
import type { Board } from "./types.js";

function sampleBoard(): Board {
  return {
    name: "Sprint 14",
    lists: [
      { id: "list1", name: "Backlog", archived: false },
      { id: "list2", name: "Done", archived: false },
    ],
    cards: [
      {
        id: "card1",
        name: "Rework the login form",
        listId: "list1",
        description: "",
        due: null,
        labels: ["frontend", "blocked"],
        archived: false,
      },
      {
        id: "card2",
        name: "Ship the old widget",
        listId: "list2",
        description: "",
        due: null,
        labels: ["backend"],
        archived: false,
      },
    ],
  };
}

test("returns the board unchanged when no filter is given", () => {
  const board = sampleBoard();
  assert.equal(filterBoard(board, {}), board);
});

test("filters cards by list name, case-insensitively", () => {
  const filtered = filterBoard(sampleBoard(), { list: "backlog" });
  assert.deepEqual(
    filtered.cards.map((c) => c.id),
    ["card1"],
  );
  assert.deepEqual(filtered.lists, sampleBoard().lists);
});

test("filters cards by label, case-insensitively", () => {
  const filtered = filterBoard(sampleBoard(), { label: "BLOCKED" });
  assert.deepEqual(
    filtered.cards.map((c) => c.id),
    ["card1"],
  );
});

test("combines list and label filters", () => {
  const filtered = filterBoard(sampleBoard(), { list: "Done", label: "blocked" });
  assert.deepEqual(filtered.cards, []);
});

test("a list name with no matching list yields no cards", () => {
  const filtered = filterBoard(sampleBoard(), { list: "Nope" });
  assert.deepEqual(filtered.cards, []);
});
