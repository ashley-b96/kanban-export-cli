#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { parseTrelloExport, TrelloParseError } from "./trello.js";
import { boardToCsv } from "./csv.js";
import type { Board } from "./types.js";

function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    process.stdin.on("data", (chunk) => chunks.push(chunk));
    process.stdin.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    process.stdin.on("error", reject);
  });
}

function printSummary(board: Board): void {
  console.log(board.name);
  for (const list of board.lists) {
    const cards = board.cards.filter((c) => c.listId === list.id && !c.archived);
    const suffix = list.archived ? " (archived)" : "";
    console.log(`\n${list.name}${suffix} - ${cards.length} card(s)`);
    for (const card of cards) {
      const due = card.due ? ` [due ${card.due.slice(0, 10)}]` : "";
      const labels = card.labels.length ? ` {${card.labels.join(", ")}}` : "";
      console.log(`  - ${card.name}${due}${labels}`);
    }
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const asJson = args.includes("--json");
  const asCsv = args.includes("--csv");
  const fileArg = args.find((a) => !a.startsWith("-"));

  if (asJson && asCsv) {
    console.error("kanban-export: --json and --csv can't be used together");
    process.exitCode = 1;
    return;
  }

  const raw =
    fileArg && fileArg !== "-"
      ? readFileSync(fileArg, "utf8")
      : await readStdin();

  const board = parseTrelloExport(raw);

  if (asJson) {
    console.log(JSON.stringify(board, null, 2));
  } else if (asCsv) {
    process.stdout.write(boardToCsv(board));
  } else {
    printSummary(board);
  }
}

main().catch((err) => {
  if (err instanceof TrelloParseError) {
    console.error(`kanban-export: ${err.message}`);
  } else {
    console.error(err);
  }
  process.exitCode = 1;
});
