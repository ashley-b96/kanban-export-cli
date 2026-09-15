# kanban-export-cli

A Trello board export is a wall of JSON: every card, every list, every
checklist item, all flattened into one object with Trello's internal ids.
Useful for backups, useless for actually looking at what's on the board.
This turns that dump into something readable, either as plain text or as
a smaller, normalized JSON shape you can feed into something else.

It's a small TypeScript library (`parseTrelloExport`, `parseJiraExport`)
with a CLI on top. No dependencies beyond TypeScript itself to build it.

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

Pass `--csv` to get one row per card instead, list name included, ready to
open in a spreadsheet:

```sh
kanban-export board.json --csv
```

```
list,card,description,due,labels,archived
Backlog,Rework the login form,Uses the old form styles.,2026-09-05T00:00:00.000Z,frontend; blocked,false
```

Pass `--list=NAME` and/or `--label=NAME` to only look at part of the board.
Both match case-insensitively and combine (a card has to satisfy both if
both are given), and work with `--json` and `--csv` as well as the default
summary:

```sh
kanban-export board.json --list=Backlog
kanban-export board.json --label=blocked --csv
```

Jira exports are also supported. There's no single "export the board"
button in Jira like Trello has, but a dump of the search API response
(`GET /rest/api/2/search`, or the issue navigator's own JSON export)
works. Pass `--format=jira` to read it:

```sh
kanban-export jira-issues.json --format=jira
```

Jira has no separate "list" entity, so lists are reconstructed from the
distinct issue statuses seen in the export, in the order they first
appear, and a card counts as archived if it has a resolution set.

## Library

```ts
import { parseTrelloExport, parseJiraExport, filterBoard } from "kanban-export-cli";

const board = filterBoard(parseTrelloExport(jsonString), { label: "blocked" });
// board.lists, board.cards - see src/types.ts
```

## Building

```sh
npm install
npm run build
```

Run the tests with:

```sh
npm test
```

## Status

Reads Trello and Jira exports, with filtering by list or label. An npm
publish with a compiled dist is still planned.
