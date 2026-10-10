import { Component, ElementRef, Injectable, WritableSignal, computed, effect, signal, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { ChatLine, ChatSource, Conversation, MemoryAiApi, SourceFile, SourceKind, nextLineId, nextSourceId } from './ai-api';

export type ChatMode = 'closed' | 'floating' | 'expanded';
export type AnswerScope = 'thread' | 'sources' | 'page';

export type PendingFile = {
  name: string;
  url: string;
  image: boolean;
  size: number;
  kind: SourceKind;
  status: 'reading' | 'ready' | 'error';
  message: string;
};

export type PageContext = {
  route: string;
  title: string;
  requestId: string;
  enabled: boolean;
};

type Scripted = { title: string; text: string; sources?: ChatSource[] };

export const guidePrompts = ['ขั้นตอนการยื่นคำขอคืออะไร?', 'สถานะในแต่ละขั้นตอนหมายถึงอะไร?', 'เอกสารที่ต้องเตรียมมีอะไรบ้าง?', 'วิธีแก้ไขคำขอหลังยื่นแล้ว?'];

const scriptedAnswers: Record<string, Scripted> = {
  'AD คืออะไร': {
    title: 'AD คืออะไร?',
    text: 'AD ย่อมาจาก Anti-Dumping (การทุ่มตลาด) เป็นมาตรการทางการค้าที่ใช้ปกป้องอุตสาหกรรมภายในประเทศ จากการนำเข้าสินค้าที่การทุ่มตลาด โดยกรมการค้าต่างประเทศ (DFT) เป็นหน่วยงานที่รับผิดชอบการไต่สวนและดำเนินการตามมาตรการนี้',
    sources: [{ label: 'คู่มือการยื่นขอไต่สวนการทุ่มตลาด (PDF)' }, { label: 'เว็บไซต์กรมการค้าต่างประเทศ' }],
  },
  'ขั้นตอนการยื่นคำขอคืออะไร?': {
    title: 'ขั้นตอนการยื่นคำขอคืออะไร?',
    text: 'เปิดเมนูคำขอ แล้วกดยื่นคำขอ จากนั้นเลือกมาตรการและแบบฟอร์ม เช่น ปร.1 หรือ ปร.2 ระบบจะพาไปกรอกข้อมูลและแนบเอกสารตามแบบนั้น',
  },
  'สถานะในแต่ละขั้นตอนหมายถึงอะไร?': {
    title: 'สถานะในแต่ละขั้นตอนหมายถึงอะไร?',
    text: 'กางแถวของคำขอในรายการ จะเห็นขั้นที่ยื่นแล้ว ขั้นที่กำลังตรวจสอบ และขั้นที่ยังไม่ถึง เช่น เปิดการไต่สวนและผลการไต่สวนชั้นต้น',
  },
  'เอกสารที่ต้องเตรียมมีอะไรบ้าง?': {
    title: 'เอกสารที่ต้องเตรียมมีอะไรบ้าง?',
    text: 'เตรียมแบบคำขอ หนังสือรับรองนิติบุคคล และเอกสารประกอบตามประเภทมาตรการที่ยื่น ระบบจะบอกเอกสารที่ต้องแนบในแต่ละแบบ',
  },
  'วิธีแก้ไขคำขอหลังยื่นแล้ว?': {
    title: 'วิธีแก้ไขคำขอหลังยื่นแล้ว?',
    text: 'เปิดรายการยื่นคำขอ แล้วเลือกคำขอที่ต้องการแก้ หากเปลี่ยนผู้ที่ดำเนินการแทนบริษัท ใช้เมนูแก้ไขผู้กระทำแทน',
  },
};

const maxBytes = 20 * 1024 * 1024;

export function sourceKind(name: string): SourceKind | null {
  if (/\.pdf$/i.test(name)) return 'pdf';
  if (/\.docx?$/i.test(name)) return 'doc';
  if (/\.xlsx?$/i.test(name)) return 'sheet';
  if (/\.(png|jpe?g)$/i.test(name)) return 'image';
  return null;
}

export function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function clock(): string {
  return new Intl.DateTimeFormat('th-TH', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date());
}

function pageTitle(path: string): { title: string; requestId: string } {
  const requestId = /^\/requests\/(?!por-|draft|chat)([^/]+)$/.exec(path)?.[1] ?? '';
  if (path.startsWith('/home')) return { title: 'หน้าแรก', requestId };
  if (path.startsWith('/requests/por-')) return { title: 'แบบคำขอ', requestId: '' };
  if (path.startsWith('/requests/draft')) return { title: 'ฉบับร่าง', requestId: '' };
  if (requestId) return { title: 'รายละเอียดคำขอ', requestId };
  if (path.startsWith('/requests')) return { title: 'รายการยื่นคำขอ', requestId: '' };
  if (path.startsWith('/profile')) return { title: 'ข้อมูลบริษัท', requestId: '' };
  if (path.startsWith('/ai-workspace')) return { title: 'DFT AI Workspace', requestId: '' };
  if (/^\/(staff|director|head|officer)/.test(path)) return { title: 'หน้าหลักเจ้าหน้าที่', requestId: '' };
  return { title: 'หน้าปัจจุบัน', requestId: '' };
}

@Injectable({ providedIn: 'root' })
export class AskAiState {
  readonly mode = signal<ChatMode>('closed');
  readonly question = signal('');
  readonly pending = signal<PendingFile[]>([]);
  readonly capturing = signal(false);
  readonly replying = signal(false);
  readonly notice = signal('');
  readonly scope = signal<AnswerScope>('thread');
  readonly page = signal<PageContext>({ route: '', title: '', requestId: '', enabled: true });
  readonly viewingId = signal<string | null>(null);
  readonly zoom = signal(1);
  readonly deleteId = signal('');
  readonly returnPath = signal('/requests');
  readonly conversations: WritableSignal<Conversation[]>;
  readonly activeId: WritableSignal<string>;

  private replyTimer = 0;

  constructor(private readonly api: MemoryAiApi) {
    this.conversations = this.api.conversations;
    this.activeId = this.api.activeId;
  }

  readonly lines = computed(() => this.api.active().lines);
  readonly sources = computed(() => this.api.active().sources);
  readonly viewing = computed(() => this.sources().find((source) => source.id === this.viewingId()) ?? null);

  show(): void {
    this.mode.set('floating');
  }

  expand(): void {
    this.mode.set('expanded');
  }

  minimize(): void {
    this.mode.set('floating');
  }

  close(): void {
    this.mode.set('closed');
  }

  setPage(path: string): void {
    const next = pageTitle(path);
    this.page.update((current) => ({ ...current, route: path, title: next.title, requestId: next.requestId }));
  }

  attach(file: File): void {
    const kind = sourceKind(file.name);
    if (!kind) {
      this.notice.set('รองรับเฉพาะ PDF, DOC, DOCX, XLS, XLSX, PNG, JPG และ JPEG');
      return;
    }
    if (file.size > maxBytes) {
      this.notice.set('ไฟล์ใหญ่เกิน 20 MB');
      return;
    }
    this.notice.set('');
    const item: PendingFile = { name: file.name, url: '', image: kind === 'image', size: file.size, kind, status: 'reading', message: 'กำลังอ่านไฟล์' };
    this.pending.update((list) => [...list, item]);
    if (kind === 'doc' || kind === 'sheet') {
      this.finishPending(item, { status: 'ready', message: 'พร้อมส่ง · ยังไม่ส่งขึ้นเซิร์ฟเวอร์ และยังเปิดตัวอย่างในเบราว์เซอร์ไม่ได้' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => this.finishPending(item, { url: String(reader.result), status: 'ready', message: 'พร้อมส่ง · ยังไม่ส่งขึ้นเซิร์ฟเวอร์' });
    reader.onerror = () => this.finishPending(item, { status: 'error', message: 'อ่านไฟล์ไม่สำเร็จ' });
    reader.readAsDataURL(file);
  }

  dropPending(file: PendingFile): void {
    this.pending.update((list) => list.filter((item) => item !== file));
  }

  ask(text: string): void {
    this.question.set(text);
    this.send();
  }

  send(): void {
    if (this.replying()) return;
    const text = this.question().trim();
    const files = this.pending();
    const ready = files.filter((file) => file.status === 'ready');
    if (files.some((file) => file.status === 'reading')) return;
    if (!text && ready.length === 0) return;
    const selected = this.sources().filter((source) => source.selected);
    if (this.scope() === 'sources' && selected.length === 0 && ready.length === 0) {
      this.notice.set('เลือกเอกสารในแผงแหล่งข้อมูลก่อน หรือเปลี่ยนขอบเขตเป็นทั้งบทสนทนา');
      return;
    }
    if (this.scope() === 'page' && !this.page().enabled) {
      this.notice.set('เปิดใช้บริบทหน้านี้ก่อน หรือเปลี่ยนขอบเขต');
      return;
    }
    this.notice.set('');
    const conversationId = this.activeId();
    const time = clock();
    const user: ChatLine = {
      id: nextLineId(),
      role: 'user',
      text: text || ready.map((file) => file.name).join(', '),
      time,
      files: ready.map((file) => ({ name: file.name, url: file.url, image: file.image })),
    };
    const attached = ready.map((file) => this.toSource(file));
    this.api.addLines(conversationId, [user]);
    this.api.addSources(conversationId, attached);
    this.question.set('');
    this.pending.set([]);
    this.replying.set(true);
    const page = this.page();
    const scope = this.scope();
    window.clearTimeout(this.replyTimer);
    this.replyTimer = window.setTimeout(() => {
      const reply = this.replyFor(text, attached, selected, scope, page);
      this.api.addLines(conversationId, [{ id: nextLineId(), role: 'ai', time: clock(), ...reply }]);
      this.replying.set(false);
    }, 400);
  }

  stop(): void {
    if (!this.replying()) return;
    window.clearTimeout(this.replyTimer);
    this.replying.set(false);
    this.api.addLines(this.activeId(), [{ id: nextLineId(), role: 'note', text: 'หยุดการตอบแล้ว', time: clock() }]);
  }

  retry(lineId: number): void {
    const lines = this.lines();
    const index = lines.findIndex((line) => line.id === lineId);
    const previous = [...lines.slice(0, index)].reverse().find((line) => line.role === 'user');
    if (!previous) return;
    this.ask(previous.text);
  }

  openCitation(source: ChatSource): boolean {
    const found = source.sourceId ? this.sources().find((file) => file.id === source.sourceId) : this.sources().find((file) => file.name === source.label);
    if (!found) {
      this.notice.set('ยังไม่มีเอกสารนี้ในรายการที่อัปโหลด');
      return false;
    }
    this.notice.set('');
    this.viewingId.set(found.id);
    this.zoom.set(1);
    return true;
  }

  create(): void {
    this.api.create();
    this.viewingId.set(null);
    this.notice.set('');
  }

  rename(id: string, title: string): void {
    this.api.rename(id, title);
  }

  archive(id: string): void {
    const current = this.conversations().find((item) => item.id === id);
    if (current) this.api.setArchived(id, !current.archived);
  }

  askRemove(id: string): void {
    this.deleteId.set(id);
  }

  confirmRemove(): void {
    const id = this.deleteId();
    if (!id) return;
    if (this.viewing() && this.activeId() === id) this.viewingId.set(null);
    this.api.remove(id);
    this.deleteId.set('');
  }

  setSourceSelected(sourceId: string, selected: boolean): void {
    this.api.setSourceSelected(this.activeId(), sourceId, selected);
  }

  removeSource(sourceId: string): void {
    if (this.viewingId() === sourceId) this.viewingId.set(null);
    this.api.removeSource(this.activeId(), sourceId);
  }

  private finishPending(item: PendingFile, patch: Partial<PendingFile>): void {
    this.pending.update((list) => list.map((entry) => (entry === item ? { ...entry, ...patch } : entry)));
  }

  private toSource(file: PendingFile): SourceFile {
    return { id: nextSourceId(), name: file.name, url: file.url, kind: file.kind, size: file.size, selected: false };
  }

  private replyFor(text: string, files: SourceFile[], selected: SourceFile[], scope: AnswerScope, page: PageContext): Scripted {
    const names = [...files.map((file) => file.name), ...selected.map((file) => file.name)];
    if (files.length > 0 || (scope === 'sources' && selected.length > 0)) {
      return {
        title: text || 'ไฟล์ที่แนบ',
        text: `รับไฟล์ไว้ในบทสนทนานี้แล้ว แต่ยังไม่อ่านเนื้อหาเอกสารหรือรูปภาพ การวิเคราะห์ไฟล์ต้องใช้บริการฝั่งเซิร์ฟเวอร์ที่ยังไม่ได้เชื่อมต่อ${names.length ? ` (${[...new Set(names)].join(', ')})` : ''}`,
        sources: files.map((file) => ({ label: file.name, sourceId: file.id })),
      };
    }
    const known = scriptedAnswers[text];
    const base = known ?? { title: text, text: 'ยังไม่มีคำตอบจากคลังคำถามช่วยใช้งานสำหรับข้อความนี้ และยังไม่ได้เชื่อมต่อโมเดล' };
    if (scope === 'page' && page.enabled) {
      const where = page.requestId ? `${page.title} · ${page.requestId}` : page.title;
      return { ...base, text: `${base.text}\n\nใช้บริบทเฉพาะชื่อหน้า «${where}» ไม่ได้ส่งเนื้อหาในฟอร์ม` };
    }
    return base;
  }
}

@Component({
  selector: 'app-ai-thread',
  templateUrl: './ai-thread.html',
  styleUrl: './ai-thread.css',
})
export class AiThread {
  private readonly log = viewChild<ElementRef<HTMLElement>>('log');
  protected readonly prompts = guidePrompts;
  protected readonly marks = signal<Readonly<Record<number, 'up' | 'down'>>>({});
  protected readonly dragging = signal(false);
  protected readonly lastAiId = computed(() => [...this.chat.lines()].reverse().find((line) => line.role === 'ai')?.id ?? 0);
  protected readonly follow = computed(() => {
    const title = [...this.chat.lines()].reverse().find((line) => line.role === 'ai')?.title ?? '';
    return guidePrompts.filter((prompt) => prompt !== title).slice(0, 2);
  });

  constructor(
    private readonly router: Router,
    protected readonly chat: AskAiState,
  ) {
    effect(() => {
      this.chat.lines();
      this.chat.replying();
      queueMicrotask(() => {
        const el = this.log()?.nativeElement;
        if (el) el.scrollTop = el.scrollHeight;
      });
    });
  }

  protected mark(id: number, value: 'up' | 'down'): void {
    this.marks.update((current) => {
      const next = { ...current };
      if (next[id] === value) delete next[id];
      else next[id] = value;
      return next;
    });
  }

  protected async copy(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      this.chat.notice.set('คัดลอกไม่สำเร็จ');
    }
  }

  protected cite(source: ChatSource): void {
    const opened = this.chat.openCitation(source);
    if (opened && !this.router.url.split('?')[0].startsWith('/ai-workspace')) void this.router.navigate(['/ai-workspace']);
  }

  protected onKey(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.chat.send();
    }
  }

  protected onFiles(event: Event): void {
    const input = event.target as HTMLInputElement;
    for (const file of input.files ?? []) this.chat.attach(file);
    input.value = '';
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    for (const file of event.dataTransfer?.files ?? []) this.chat.attach(file);
  }

  protected async capture(): Promise<void> {
    const media = navigator.mediaDevices;
    if (!media?.getDisplayMedia) {
      this.chat.notice.set('เบราว์เซอร์นี้ยังจับภาพหน้าจอไม่ได้');
      return;
    }
    let stream: MediaStream;
    try {
      stream = await media.getDisplayMedia({ video: true, audio: false });
    } catch {
      return;
    }
    const video = document.createElement('video');
    video.srcObject = stream;
    video.muted = true;
    this.chat.capturing.set(true);
    try {
      await video.play();
      await new Promise((resolve) => setTimeout(resolve, 250));
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      canvas.getContext('2d')?.drawImage(video, 0, 0);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (blob) this.chat.attach(new File([blob], 'ภาพหน้าจอ.png', { type: 'image/png' }));
    } finally {
      stream.getTracks().forEach((track) => track.stop());
      this.chat.capturing.set(false);
    }
  }
}
