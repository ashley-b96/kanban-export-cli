import type { Board, Card, List } from "./types.js";

// Trello's board export ("Print and Export" -> "Export as JSON") is the
// only shape this reads for now. It is a big flat JSON object, not a
// stream, so there is no reason to parse it incrementally.

interface RawTrelloLabel {
  name?: string;
  color?: string;
}

interface RawTrelloCard {
  id: string;
  name: string;
  desc?: string;
  idList: string;
  due?: string | null;
  closed?: boolean;
  labels?: RawTrelloLabel[];
}

interface RawTrelloList {
  id: string;
  name: string;
  closed?: boolean;
}

interface RawTrelloBoard {
  name?: string;
  lists?: RawTrelloList[];
  cards?: RawTrelloCard[];
}

export class TrelloParseError extends Error {}

export function parseTrelloExport(raw: string): Board {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    throw new TrelloParseError(
      `input is not valid JSON: ${(err as Error).message}`,
    );
  }

  if (typeof data !== "object" || data === null) {
    throw new TrelloParseError("expected a JSON object at the top level");
  }

  const board = data as RawTrelloBoard;
  if (!Array.isArray(board.lists) || !Array.isArray(board.cards)) {
    throw new TrelloParseError(
      "expected a Trello board export with 'lists' and 'cards' arrays",
    );
  }

  const lists: List[] = board.lists.map((l) => ({
    id: l.id,
    name: l.name,
    archived: l.closed ?? false,
  }));

  const cards: Card[] = board.cards.map((c) => ({
    id: c.id,
    name: c.name,
    listId: c.idList,
    description: c.desc ?? "",
    due: c.due ?? null,
    labels: (c.labels ?? []).map((label) => label.name || label.color || "?"),
    archived: c.closed ?? false,
  }));

  return {
    name: board.name ?? "untitled board",
    lists,
    cards,
  };
}
