import assert from "node:assert/strict";
import { test } from "node:test";
import { boardToCsv } from "./csv.js";
import type { Board } from "./types.js";

function sampleBoard(): Board {
  return {
    name: "Sprint 14",
    lists: [{ id: "list1", name: "Backlog", archived: false }],
    cards: [
      {
        id: "card1",
        name: "Rework the login form",
        listId: "list1",
        description: "Uses the old form styles.",
        due: "2026-09-05T00:00:00.000Z",
        labels: ["frontend", "blocked"],
        archived: false,
      },
    ],
  };
}

test("writes a header row followed by one row per card", () => {
  const csv = boardToCsv(sampleBoard());
  const lines = csv.split("\r\n");

  assert.equal(lines[0], "list,card,description,due,labels,archived");
  assert.equal(
    lines[1],
    "Backlog,Rework the login form,Uses the old form styles.,2026-09-05T00:00:00.000Z,frontend; blocked,false",
  );
  assert.equal(lines[2], "");
  assert.equal(lines.length, 3);
});

test("looks up list names by id and leaves unknown lists blank", () => {
  const board = sampleBoard();
  board.cards[0].listId = "missing-list";
  const csv = boardToCsv(board);

  assert.ok(csv.startsWith("list,card,description,due,labels,archived\r\n,Rework"));
});

test("quotes fields containing commas, quotes, or newlines", () => {
  const board = sampleBoard();
  board.cards[0].name = 'Say "hi", then\nfollow up';
  const csv = boardToCsv(board);

  assert.ok(csv.includes('"Say ""hi"", then\nfollow up"'));
});

test("leaves due blank and labels empty when a card has none", () => {
  const board = sampleBoard();
  board.cards[0].due = null;
  board.cards[0].labels = [];
  const csv = boardToCsv(board);
  const [, dataLine] = csv.split("\r\n");

  assert.equal(
    dataLine,
    "Backlog,Rework the login form,Uses the old form styles.,,,false",
  );
});
