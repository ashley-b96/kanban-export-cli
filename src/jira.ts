import type { Board, Card, List } from "./types.js";

// Jira has no single "export the board" button like Trello does. What
// people actually have on hand is a dump of the REST search response
// (GET /rest/api/2/search, or the equivalent from the issue navigator's
// "Export" menu) - a flat array of issues, not a board. Lists don't exist
// as their own entity, so they're reconstructed from the distinct status
// names seen across the issues, in the order they first appear.

interface RawJiraStatus {
  name?: string;
}

interface RawJiraProject {
  name?: string;
}

interface RawJiraFields {
  summary?: string;
  description?: string | null;
  status?: RawJiraStatus;
  duedate?: string | null;
  labels?: string[];
  resolution?: unknown;
  project?: RawJiraProject;
}

interface RawJiraIssue {
  id: string;
  key: string;
  fields?: RawJiraFields;
}

interface RawJiraExport {
  issues?: RawJiraIssue[];
}

export class JiraParseError extends Error {}

export function parseJiraExport(raw: string): Board {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    throw new JiraParseError(
      `input is not valid JSON: ${(err as Error).message}`,
    );
  }

  if (typeof data !== "object" || data === null) {
    throw new JiraParseError("expected a JSON object at the top level");
  }

  const search = data as RawJiraExport;
  if (!Array.isArray(search.issues)) {
    throw new JiraParseError(
      "expected a Jira search export with an 'issues' array",
    );
  }

  const lists: List[] = [];
  const listIds = new Set<string>();
  const cards: Card[] = [];
  let boardName: string | undefined;

  for (const issue of search.issues) {
    const fields: RawJiraFields = issue.fields ?? {};
    const statusName = fields.status?.name ?? "No Status";

    if (!listIds.has(statusName)) {
      listIds.add(statusName);
      lists.push({ id: statusName, name: statusName, archived: false });
    }

    boardName ??= fields.project?.name;

    cards.push({
      id: issue.key || issue.id,
      name: fields.summary ?? "",
      listId: statusName,
      description: fields.description ?? "",
      due: fields.duedate ?? null,
      labels: fields.labels ?? [],
      // Jira doesn't have a "closed" flag on an issue; a resolution being
      // set is the closest equivalent to Trello's archived card.
      archived: fields.resolution != null,
    });
  }

  return {
    name: boardName ?? "untitled board",
    lists,
    cards,
  };
}
