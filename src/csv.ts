import type { Board } from "./types.js";

const COLUMNS = ["list", "card", "description", "due", "labels", "archived"];

// RFC 4180: quote a field if it contains a comma, quote, or newline, and
// double up any quotes inside it.
function escapeField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function boardToCsv(board: Board): string {
  const listNames = new Map(board.lists.map((l) => [l.id, l.name]));
  const rows = [COLUMNS.join(",")];

  for (const card of board.cards) {
    const fields = [
      listNames.get(card.listId) ?? "",
      card.name,
      card.description,
      card.due ?? "",
      card.labels.join("; "),
      String(card.archived),
    ];
    rows.push(fields.map(escapeField).join(","));
  }

  return rows.join("\r\n") + "\r\n";
}
