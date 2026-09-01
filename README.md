# kanban-export-cli

A Trello board export is a wall of JSON: every card, every list, every
checklist item, all flattened into one object with Trello's internal ids.
Useful for backups, useless for actually looking at what's on the board.
This turns that dump into something readable, either as plain text or as
a smaller, normalized JSON shape you can feed into something else.

It's a small TypeScript library (`parseTrelloExport`) with a CLI on top.
No dependencies beyond TypeScript itself to build it.

## Usage

Export a board from Trello (Menu -> Print and Export -> Export as JSON),
then run it through the CLI either as a file argument or piped in on stdin:

```sh
kanban-export board.json

cat board.json | kanban-export
curl -s https://trello.example/board.json | kanban-export -
```

Output looks like:

```
Sprint 14

Backlog - 12 card(s)
  - Rework the login form {frontend, blocked}
  - Investigate flaky export test [due 2026-09-05]

In Progress - 3 card(s)
  - Add stdin support to the CLI
```

Pass `--json` to get the normalized shape instead of the text summary:

```sh
kanban-export board.json --json
```

```json
{
  "name": "Sprint 14",
  "lists": [{ "id": "abc123", "name": "Backlog", "archived": false }],
  "cards": [
    {
      "id": "def456",
      "name": "Rework the login form",
      "listId": "abc123",
      "description": "",
      "due": null,
      "labels": ["frontend", "blocked"],
      "archived": false
    }
  ]
}
```

Archived cards are dropped from the text summary but kept in the `--json`
output, since "was this ever on the board" is sometimes exactly what you
want to know.

## Library

```ts
import { parseTrelloExport } from "kanban-export-cli";

const board = parseTrelloExport(jsonString);
// board.lists, board.cards - see src/types.ts
```

## Building

```sh
npm install
npm run build
```

## Status

Only reads Trello's export format right now. See the roadmap for what's
planned - other export formats, CSV output, and filtering by list or label.
