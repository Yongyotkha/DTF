import { Component, computed, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { Conversation } from '../../ask-ai/ai-api';
import { AiThread, AskAiState, formatSize } from '../../ask-ai/ai-state';
import { DftModal } from '../../modal/modal';
import { SideNav } from '../../menu-bar/side-nav';
import { TopHeader } from '../../top-header/top-header';

type SearchKind = 'all' | 'chats' | 'documents' | 'images';
type Hit = { kind: 'chat' | 'document' | 'image'; id: string; conversationId: string; title: string; preview: string };

function dayLabel(stamp: number): string {
  const date = new Date(stamp);
  const start = (value: Date) => new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();
  const diff = start(new Date()) - start(date);
  if (diff === 0) return 'วันนี้';
  if (diff === 86400000) return 'เมื่อวาน';
  return new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

@Component({
  selector: 'app-ai-workspace-page',
  imports: [TopHeader, SideNav, AiThread, DftModal],
  templateUrl: './ai-workspace-page.html',
  styleUrl: './ai-workspace-page.css',
})
export class AiWorkspacePage {
  protected readonly query = signal('');
  protected readonly filter = signal<SearchKind>('all');
  protected readonly filters: SearchKind[] = ['all', 'chats', 'documents', 'images'];
  protected readonly filterLabel: Record<SearchKind, string> = { all: 'ทั้งหมด', chats: 'แชท', documents: 'เอกสาร', images: 'รูปภาพ' };
  protected readonly pane = signal<'history' | 'chat' | 'sources'>('chat');
  protected readonly historyOpen = signal(true);
  protected readonly sourcesOpen = signal(true);
  protected readonly archiveOpen = signal(false);
  protected readonly editing = signal('');
  protected readonly draftTitle = signal('');
  protected readonly sourceQuery = signal('');
  protected readonly sourceFilter = signal<'all' | 'documents' | 'images'>('all');
  protected readonly formatSize = formatSize;

  protected readonly groups = computed(() => {
    const items = this.chat.conversations().filter((item) => !item.archived).sort((a, b) => b.updated - a.updated);
    const grouped = new Map<string, Conversation[]>();
    for (const item of items) grouped.set(dayLabel(item.updated), [...(grouped.get(dayLabel(item.updated)) ?? []), item]);
    return [...grouped.entries()];
  });
  protected readonly archived = computed(() => this.chat.conversations().filter((item) => item.archived).sort((a, b) => b.updated - a.updated));
  protected readonly hits = computed(() => this.search(this.query(), this.filter()));
  protected readonly visibleSources = computed(() => {
    const query = this.sourceQuery().trim().toLowerCase();
    const filter = this.sourceFilter();
    return this.chat.sources().filter((file) => {
      if (filter === 'images' && file.kind !== 'image') return false;
      if (filter === 'documents' && file.kind === 'image') return false;
      return !query || file.name.toLowerCase().includes(query);
    });
  });

  constructor(
    private readonly router: Router,
    private readonly sanitizer: DomSanitizer,
    protected readonly chat: AskAiState,
  ) {}

  protected openMenu(label: string): void {
    if (label === 'ยื่นคำขอ') void this.router.navigate(['/requests'], { queryParams: { choose: '1' } });
    if (label === 'รายการยื่นคำขอ') void this.router.navigate(['/requests']);
  }

  protected shrink(mode: 'floating' | 'expanded'): void {
    this.chat.mode.set(mode);
    void this.router.navigateByUrl(this.chat.returnPath() || '/requests');
  }

  protected parts(text: string): { text: string; hit: boolean }[] {
    const query = this.query().trim();
    if (!query) return [{ text, hit: false }];
    const lower = text.toLowerCase();
    const needle = query.toLowerCase();
    const pieces: { text: string; hit: boolean }[] = [];
    let index = 0;
    while (index < text.length) {
      const at = lower.indexOf(needle, index);
      if (at < 0) {
        pieces.push({ text: text.slice(index), hit: false });
        break;
      }
      if (at > index) pieces.push({ text: text.slice(index, at), hit: false });
      pieces.push({ text: text.slice(at, at + needle.length), hit: true });
      index = at + needle.length;
    }
    return pieces;
  }

  protected openConversation(id: string): void {
    this.chat.activeId.set(id);
    this.chat.viewingId.set(null);
    this.pane.set('chat');
  }

  protected openHit(hit: Hit): void {
    this.chat.activeId.set(hit.conversationId);
    if (hit.kind === 'chat') {
      this.chat.viewingId.set(null);
      this.pane.set('chat');
      return;
    }
    this.chat.viewingId.set(hit.id);
    this.chat.zoom.set(1);
    this.sourcesOpen.set(true);
    this.pane.set('sources');
  }

  protected startRename(item: Conversation): void {
    this.editing.set(item.id);
    this.draftTitle.set(item.title);
  }

  protected saveRename(): void {
    this.chat.rename(this.editing(), this.draftTitle());
    this.editing.set('');
  }

  protected confirm(event: Event): void {
    const label = (event.target as HTMLElement).closest('button')?.textContent?.trim();
    if (label === 'ลบข้อมูล') this.chat.confirmRemove();
    else if (label === 'ยกเลิก' || label === '✕') this.chat.deleteId.set('');
  }

  protected frame(url: string): SafeResourceUrl | null {
    if (!url.startsWith('data:')) return null;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  protected zoomBy(step: number): void {
    this.chat.zoom.update((value) => Math.min(3, Math.max(0.5, Math.round((value + step) * 100) / 100)));
  }

  protected kindLabel(kind: string): string {
    if (kind === 'image') return 'รูปภาพ';
    if (kind === 'sheet') return 'ตาราง';
    if (kind === 'pdf') return 'PDF';
    return 'เอกสาร';
  }

  private search(query: string, filter: SearchKind): Hit[] {
    const needle = query.trim().toLowerCase();
    if (!needle) return [];
    const hits: Hit[] = [];
    for (const conversation of this.chat.conversations()) {
      const message = conversation.lines.find((line) => line.text.toLowerCase().includes(needle));
      if ((filter === 'all' || filter === 'chats') && (conversation.title.toLowerCase().includes(needle) || message)) {
        hits.push({ kind: 'chat', id: conversation.id, conversationId: conversation.id, title: conversation.title, preview: message?.text ?? conversation.title });
      }
      for (const source of conversation.sources) {
        const image = source.kind === 'image';
        const wanted = filter === 'all' || (filter === 'images' && image) || (filter === 'documents' && !image);
        if (wanted && source.name.toLowerCase().includes(needle)) {
          hits.push({ kind: image ? 'image' : 'document', id: source.id, conversationId: conversation.id, title: source.name, preview: conversation.title });
        }
      }
    }
    return hits;
  }
}
