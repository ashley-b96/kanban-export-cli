import type { Board } from "./types.js";

export interface FilterOptions {
  list?: string;
  label?: string;
}

// Matches are case-insensitive and exact, not substring - "backlog" should
// mean the Backlog list, not accidentally pull in "Backlog (old)" too.
export function filterBoard(board: Board, options: FilterOptions): Board {
  if (!options.list && !options.label) {
    return board;
  }

  const listIds = options.list
    ? new Set(
        board.lists
          .filter((l) => l.name.toLowerCase() === options.list!.toLowerCase())
          .map((l) => l.id),
      )
    : null;

  const label = options.label?.toLowerCase();

  const cards = board.cards.filter((card) => {
    if (listIds && !listIds.has(card.listId)) {
      return false;
    }
    if (label && !card.labels.some((l) => l.toLowerCase() === label)) {
      return false;
    }
    return true;
  });

  return { ...board, cards };
}
