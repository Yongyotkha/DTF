import { Injectable, signal } from '@angular/core';

export type ChatRole = 'user' | 'ai' | 'note';

export type ChatFile = {
  name: string;
  url: string;
  image: boolean;
};

export type ChatSource = {
  label: string;
  sourceId?: string;
};

export type ChatLine = {
  id: number;
  role: ChatRole;
  text: string;
  time: string;
  title?: string;
  sources?: ChatSource[];
  files?: ChatFile[];
};

export type SourceKind = 'pdf' | 'doc' | 'sheet' | 'image';

export type SourceFile = {
  id: string;
  name: string;
  url: string;
  kind: SourceKind;
  size: number;
  selected: boolean;
};

export type Conversation = {
  id: string;
  title: string;
  created: number;
  updated: number;
  archived: boolean;
  lines: ChatLine[];
  sources: SourceFile[];
};

/**
 * Storage contract for the assistant. MemoryAiApi keeps data in this tab only.
 * It does not call the network and must not be treated as access control.
 *
 * The server has to scope every call to the signed-in user and organization:
 * GET    /api/ai/conversations
 * POST   /api/ai/conversations
 * PATCH  /api/ai/conversations/:id
 * DELETE /api/ai/conversations/:id
 * POST   /api/ai/conversations/:id/messages
 * POST   /api/ai/conversations/:id/sources
 * DELETE /api/ai/conversations/:id/sources/:sourceId
 * GET    /api/ai/search?q=&type=all|chats|documents|images
 * POST   /api/ai/conversations/:id/reply
 */
export interface AiApi {
  list(): Conversation[];
  create(): string;
  rename(id: string, title: string): void;
  setArchived(id: string, archived: boolean): void;
  remove(id: string): void;
  addLines(id: string, lines: ChatLine[]): void;
  addSources(id: string, sources: SourceFile[]): void;
  setSourceSelected(id: string, sourceId: string, selected: boolean): void;
  removeSource(id: string, sourceId: string): void;
}

let conversationSeq = 0;
let lineSeq = 0;
let sourceSeq = 0;

export function nextLineId(): number {
  lineSeq += 1;
  return lineSeq;
}

export function nextSourceId(): string {
  sourceSeq += 1;
  return `s${sourceSeq}`;
}

function blank(): Conversation {
  conversationSeq += 1;
  const now = Date.now();
  return { id: `c${conversationSeq}`, title: 'บทสนทนาใหม่', created: now, updated: now, archived: false, lines: [], sources: [] };
}

@Injectable({ providedIn: 'root' })
export class MemoryAiApi implements AiApi {
  readonly conversations = signal<Conversation[]>([blank()]);
  readonly activeId = signal(this.conversations()[0].id);

  list(): Conversation[] {
    return this.conversations();
  }

  active(): Conversation {
    return this.conversations().find((item) => item.id === this.activeId()) ?? this.conversations()[0];
  }

  create(): string {
    const item = blank();
    this.conversations.update((list) => [item, ...list]);
    this.activeId.set(item.id);
    return item.id;
  }

  rename(id: string, title: string): void {
    const next = title.trim();
    if (!next) return;
    this.patch(id, (item) => ({ ...item, title: next.slice(0, 80), updated: Date.now() }));
  }

  setArchived(id: string, archived: boolean): void {
    this.patch(id, (item) => ({ ...item, archived, updated: Date.now() }));
  }

  remove(id: string): void {
    const remaining = this.conversations().filter((item) => item.id !== id);
    if (remaining.length === 0) {
      const item = blank();
      this.conversations.set([item]);
      this.activeId.set(item.id);
      return;
    }
    this.conversations.set(remaining);
    if (this.activeId() === id) this.activeId.set(remaining[0].id);
  }

  addLines(id: string, lines: ChatLine[]): void {
    this.patch(id, (item) => {
      const hasUser = item.lines.some((line) => line.role === 'user');
      const firstUser = lines.find((line) => line.role === 'user');
      const title = !hasUser && firstUser ? firstUser.text.slice(0, 48) : item.title;
      return { ...item, title, updated: Date.now(), lines: [...item.lines, ...lines] };
    });
  }

  addSources(id: string, sources: SourceFile[]): void {
    this.patch(id, (item) => ({ ...item, updated: Date.now(), sources: [...item.sources, ...sources] }));
  }

  setSourceSelected(id: string, sourceId: string, selected: boolean): void {
    this.patch(id, (item) => ({
      ...item,
      sources: item.sources.map((source) => (source.id === sourceId ? { ...source, selected } : source)),
    }));
  }

  removeSource(id: string, sourceId: string): void {
    this.patch(id, (item) => ({ ...item, sources: item.sources.filter((source) => source.id !== sourceId) }));
  }

  private patch(id: string, recipe: (item: Conversation) => Conversation): void {
    this.conversations.update((list) => list.map((item) => (item.id === id ? recipe(item) : item)));
  }
}
