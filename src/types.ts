export interface Card {
  id: string;
  name: string;
  listId: string;
  description: string;
  due: string | null;
  labels: string[];
  archived: boolean;
}

export interface List {
  id: string;
  name: string;
  archived: boolean;
}

export interface Board {
  name: string;
  lists: List[];
  cards: Card[];
}
