import { ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild, inject } from '@angular/core';
import { DftButton } from '../../button/button';
import { DftModal } from '../../modal/modal';
import { StatusTag, StatusTone } from '../../status-tag/status-tag';
import { TextEditorToolbar } from '../../text-editor-toolbar/text-editor-toolbar';
import { StepDocDef } from './bureau-draft';
import { downloadDeskDoc, viewDeskDoc, viewHref } from './bureau-files';
import { BureauStore, DESK_TODAY, DeskDoc, DeskSource, putUploaded } from './bureau-store';

/** ตัวสร้างเนื้อหาให้ปุ่ม AI ช่วยร่าง ของเอกสารแต่ละชนิด */
export type DeskMaker = { ai: () => Promise<{ html: string; notes: string[] }>; busyText: string };

const ZOOM_STEPS = [50, 75, 100, 125, 150, 200];
const FONT = 'TH SarabunPSK';
const MARKS = ['bold', 'italic', 'underline', 'strikeThrough', 'subscript', 'superscript', 'insertOrderedList', 'insertUnorderedList', 'justifyLeft', 'justifyCenter', 'justifyRight', 'justifyFull'];

/**
 * พื้นที่เอกสารของหนึ่งขั้น — รูปแบบเดียวกับหน้าร่างเอกสารฝั่งเจ้าหน้าที่
 * สร้างในระบบ / AI ช่วยร่าง / อัปเดตไฟล์ เก็บเป็นเวอร์ชัน ตั้งสถานะร่างหรือสมบูรณ์ได้ และแก้ไขในหน้าเอกสารแบบ Word
 */
@Component({
  selector: 'app-bureau-doc-desk',
  imports: [DftButton, DftModal, StatusTag, TextEditorToolbar],
  templateUrl: './bureau-desk.html',
  styleUrls: ['./bureau-desk.css'],
})
export class BureauDocDesk implements OnChanges {
  @Input({ required: true }) deskKey!: string;
  @Input({ required: true }) def!: StepDocDef;
  @Input() detail = '';
  @Input() locked = false;
  @Input() maker?: DeskMaker;
  @Output() changed = new EventEmitter<void>();

  @ViewChild('editor') private editorRef?: ElementRef<HTMLDivElement>;
  @ViewChild('stage') private stageRef?: ElementRef<HTMLDivElement>;

  private readonly store = inject(BureauStore);
  private readonly cdr = inject(ChangeDetectorRef);

  protected readonly fontName = FONT;
  protected open = false;
  protected active = 0;
  protected zoom = 100;
  protected full = false;
  protected aiBusy = false;
  protected confirm: '' | 'create' | 'ai' = '';
  protected notes: string[] = [];
  protected saved = '';
  protected empty = true;
  protected frames: { n: number; top: number; height: number }[] = [];
  protected marks: Record<string, boolean> = {};
  protected fontSize = '16pt';
  protected lineHeight = '1.15';
  protected color = '#0E2346';
  protected highlight = 'transparent';
  private raf = 0;
  private fit = 1;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['deskKey'] && !changes['deskKey'].firstChange) {
      this.open = false;
      this.full = false;
      this.notes = [];
      this.saved = '';
      this.confirm = '';
    }
  }

  protected get docs(): DeskDoc[] {
    return this.store.desk(this.deskKey);
  }

  protected get latest(): number {
    return this.docs.reduce((max, row) => Math.max(max, row.version), 0);
  }

  protected get activeDoc(): DeskDoc | undefined {
    return this.docs.find((row) => row.version === this.active);
  }

  protected get canEditor(): boolean {
    return this.open || this.docs.some((row) => row.source === 'created' || row.source === 'ai');
  }

  protected get confirmDetail(): string {
    const mode = this.confirm === 'ai' ? `ให้ AI ช่วยร่าง${this.def.label}` : `สร้าง${this.def.label}ใหม่ (หน้าว่าง)`;
    return `มี${this.def.label}เวอร์ชัน ${this.latest} อยู่แล้ว การ${mode}จะบันทึกเป็นเวอร์ชัน ${this.latest + 1} โดยเก็บเวอร์ชันเดิมไว้ครบ`;
  }

  protected get finalCount(): number {
    return this.docs.filter((row) => row.final).length;
  }

  protected sourceLabel(source: DeskSource): string {
    return { ai: 'AI ช่วยร่าง', upload: 'อัปเดตไฟล์', created: 'สร้างในระบบ', sample: 'แฟ้มเคส' }[source];
  }

  protected sourceTone(source: DeskSource): StatusTone {
    return ({ ai: 'info', upload: 'warning', created: 'neutral', sample: 'success' } as Record<DeskSource, StatusTone>)[source];
  }

  protected atLabel(at: string): string {
    const raw = (at || '').trim();
    if (!raw) return '—';
    return /\d{1,2}:\d{2}/.test(raw) ? raw : `${raw} 09:00 น.`;
  }

  private stamp(): string {
    const now = new Date();
    return `${DESK_TODAY} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} น.`;
  }

  private write(docs: DeskDoc[]): void {
    this.store.setDesk(this.deskKey, docs);
    this.changed.emit();
  }

  private patch(version: number, change: Partial<DeskDoc>): void {
    this.write(this.docs.map((row) => (row.version === version ? { ...row, ...change } : row)));
  }

  // ───────────────────────── สร้าง / AI / อัปโหลด ─────────────────────────

  protected requestCreate(): void {
    if (this.locked) return;
    if (this.docs.length) { this.confirm = 'create'; return; }
    this.commit();
  }

  protected requestAi(): void {
    if (this.locked || this.aiBusy || !this.maker) return;
    if (this.open && this.active) { void this.fillAi(); return; }
    if (this.docs.length) { this.confirm = 'ai'; return; }
    this.commit();
    void this.fillAi();
  }

  protected onConfirm(choice: string): void {
    const mode = this.confirm;
    this.confirm = '';
    if (choice !== 'ยืนยัน' || !mode) return;
    this.commit();
    if (mode === 'ai') void this.fillAi();
  }

  private commit(): void {
    const version = this.latest + 1;
    const doc: DeskDoc = { version, title: `${this.def.label} · เวอร์ชัน ${version}`, at: this.stamp(), source: 'created', html: `<p style="font-family:${FONT}"><br></p>`, href: '', fileName: `${this.def.label}-v${version}.doc`, final: false };
    this.write([...this.docs, doc]);
    this.openEditor(version);
  }

  private async fillAi(): Promise<void> {
    const maker = this.maker;
    const version = this.active;
    if (!maker || !version) return;
    this.aiBusy = true;
    this.saved = '';
    this.cdr.markForCheck();
    try {
      const result = await maker.ai();
      this.patch(version, { html: result.html, source: 'ai', at: this.stamp() });
      this.notes = result.notes;
      this.saved = 'AI ช่วยร่างแล้ว ตรวจและแก้ไขในหน้าเอกสารก่อนบันทึก';
      if (this.open && this.active === version) this.fill();
    } finally {
      this.aiBusy = false;
      this.cdr.markForCheck();
    }
  }

  protected async upload(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';
    if (this.locked || !files.length) return;
    let next = [...this.docs];
    let version = this.latest;
    for (const [index, file] of files.entries()) {
      version += 1;
      const key = `desk-${this.deskKey}-${Date.now().toString(36)}-${index}`;
      await putUploaded(key, file);
      next = [...next, { version, title: file.name.replace(/\.[^.]+$/, ''), at: this.stamp(), source: 'upload', html: '', href: `idb:${key}`, fileName: file.name, final: true }];
    }
    this.write(next);
    this.saved = `อัปเดตไฟล์แล้ว ${files.length} ไฟล์ (ตั้งเป็นฉบับสมบูรณ์ กดที่สถานะเพื่อสลับเป็นร่างได้)`;
    this.cdr.markForCheck();
  }

  // ───────────────────────── ตารางไฟล์ ─────────────────────────

  protected rename(row: DeskDoc, title: string): void {
    this.patch(row.version, { title: title.trim() || row.fileName });
  }

  protected toggleFinal(row: DeskDoc): void {
    if (this.locked) return;
    this.patch(row.version, { final: !row.final });
  }

  protected openRow(row: DeskDoc): void {
    if (row.source === 'created' || row.source === 'ai') {
      this.openEditor(row.version);
      return;
    }
    viewDeskDoc(row);
  }

  protected viewRow(row: DeskDoc): void {
    viewDeskDoc(row);
  }

  protected downloadRow(row: DeskDoc): void {
    if (this.open && this.active === row.version) this.capture();
    downloadDeskDoc(this.docs.find((entry) => entry.version === row.version) ?? row);
  }

  protected remove(row: DeskDoc): void {
    if (this.locked) return;
    if (this.active === row.version) this.open = false;
    this.write(this.docs.filter((entry) => entry.version !== row.version));
  }

  protected viewSample(): void {
    if (this.def.sample) void viewHref(this.def.sample, this.def.sample.slice(this.def.sample.lastIndexOf('/') + 1));
  }

  protected get sampleName(): string {
    const href = this.def.sample ?? '';
    return href.slice(href.lastIndexOf('/') + 1).replace(/\.(docx?|pdf)$/i, '').replace(/^\d+(\.\d+)?\.?\s*/, '');
  }

  // ───────────────────────── หน้าเอกสาร (Word) ─────────────────────────

  protected pickTab(tab: 'files' | 'editor'): void {
    if (tab === 'files') { this.closeEditor(); return; }
    if (this.open) return;
    const editable = [...this.docs].reverse().find((row) => row.source === 'created' || row.source === 'ai');
    if (editable) this.openEditor(editable.version);
  }

  private openEditor(version: number): void {
    this.active = version;
    this.open = true;
    this.zoom = 100;
    this.fill();
  }

  private fill(tries = 0): void {
    setTimeout(() => {
      const el = this.editorRef?.nativeElement;
      if (!el) {
        if (tries < 10) this.fill(tries + 1);
        return;
      }
      el.innerHTML = this.activeDoc?.html ?? '';
      this.empty = !el.textContent?.trim() && !el.querySelector('svg,table,img');
      this.layout();
      this.cdr.markForCheck();
    }, tries ? 50 : 0);
  }

  private capture(): void {
    const el = this.editorRef?.nativeElement;
    const doc = this.activeDoc;
    if (!el || !doc) return;
    this.empty = !el.textContent?.trim() && !el.querySelector('svg,table,img');
    const html = el.innerHTML;
    if (html !== doc.html) this.store.setDesk(this.deskKey, this.docs.map((row) => (row.version === doc.version ? { ...row, html } : row)));
  }

  protected onInput(): void {
    this.capture();
    this.refreshMarks();
    this.layout();
  }

  protected saveDraft(): void {
    this.capture();
    if (this.active) this.patch(this.active, { final: false, at: this.stamp() });
    this.saved = 'บันทึกร่างแล้ว';
  }

  protected saveFinal(): void {
    this.capture();
    if (this.active) this.patch(this.active, { final: true, at: this.stamp() });
    this.saved = `บันทึก${this.def.label}เป็นฉบับสมบูรณ์แล้ว`;
    this.open = false;
    this.full = false;
  }

  protected closeEditor(): void {
    if (this.open) this.capture();
    this.open = false;
    this.full = false;
  }

  protected downloadActive(): void {
    const doc = this.activeDoc;
    if (doc) this.downloadRow(doc);
  }

  protected zoomBy(dir: 1 | -1): void {
    const at = ZOOM_STEPS.indexOf(this.zoom);
    this.zoom = ZOOM_STEPS[Math.min(ZOOM_STEPS.length - 1, Math.max(0, (at < 0 ? 2 : at) + dir))] ?? 100;
    this.layout();
  }

  protected get canZoomIn(): boolean {
    return this.zoom < (ZOOM_STEPS[ZOOM_STEPS.length - 1] ?? 200);
  }

  protected get canZoomOut(): boolean {
    return this.zoom > (ZOOM_STEPS[0] ?? 50);
  }

  protected get zoomCss(): number {
    return (this.zoom / 100) * this.fit;
  }

  protected toggleFull(): void {
    this.full = !this.full;
    this.layout();
  }

  private mm(mm: number): number {
    return Math.round((mm * 96) / 25.4);
  }

  /** เส้นแบ่งหน้า A4 ตามความสูงเนื้อหา */
  protected layout(): void {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = requestAnimationFrame(() => {
      this.raf = 0;
      const stage = this.stageRef?.nativeElement;
      const sheet = this.editorRef?.nativeElement.closest('.word-print-sheet') as HTMLElement | null;
      if (!stage || !sheet) return;
      const paper = this.mm(210);
      this.fit = Math.max(1, Math.min(1.5, (stage.clientWidth - 56) / paper));
      const pageH = this.mm(297);
      const count = Math.max(1, Math.ceil(Math.max(pageH, sheet.offsetHeight) / pageH));
      this.frames = Array.from({ length: count }, (_, i) => ({ n: i + 1, top: sheet.offsetTop + i * pageH, height: pageH }));
      this.cdr.markForCheck();
    });
  }

  private exec(command: string, value?: string): void {
    this.editorRef?.nativeElement.focus();
    document.execCommand('styleWithCSS', false, 'true');
    document.execCommand(command, false, value);
    this.onInput();
  }

  protected format(command: string, value?: string): void {
    this.exec(command, value);
  }

  protected setFontSize(size: string): void {
    this.fontSize = size;
    const root = this.editorRef?.nativeElement;
    root?.focus();
    document.execCommand('styleWithCSS', false, 'false');
    document.execCommand('fontSize', false, '7');
    root?.querySelectorAll('font[size="7"]').forEach((node) => {
      const span = document.createElement('span');
      span.style.fontSize = size;
      span.innerHTML = node.innerHTML;
      node.replaceWith(span);
    });
    this.onInput();
  }

  protected setColor(color: string): void {
    this.color = color;
    this.exec('foreColor', color);
  }

  protected setHighlight(color: string): void {
    this.highlight = color;
    this.exec('hiliteColor', color);
  }

  protected setLineHeight(value: string): void {
    this.lineHeight = value;
    const root = this.editorRef?.nativeElement;
    const sel = window.getSelection();
    if (!root || !sel?.rangeCount) return;
    const range = sel.getRangeAt(0);
    const blocks = Array.from(root.querySelectorAll('p,div,li,h1,h2,h3,td')).filter((el) => range.intersectsNode(el));
    (blocks.length ? blocks : [root]).forEach((el) => { (el as HTMLElement).style.lineHeight = value; });
    this.onInput();
  }

  protected insertTable(): void {
    this.exec('insertHTML', '<table class="amend-table" style="border-collapse:collapse;width:100%"><tbody><tr><td style="border:1px solid #0E2346;padding:4px 6px">หัวข้อ</td><td style="border:1px solid #0E2346;padding:4px 6px">รายละเอียด</td></tr><tr><td style="border:1px solid #0E2346;padding:4px 6px">&nbsp;</td><td style="border:1px solid #0E2346;padding:4px 6px">&nbsp;</td></tr></tbody></table><p><br></p>');
  }

  protected insertHr(): void {
    this.exec('insertHorizontalRule');
  }

  protected insertPageBreak(): void {
    this.exec('insertHTML', `<div class="word-page-break" data-page-break="1" contenteditable="false"></div><p style="font-family:${FONT};margin:0"><br></p>`);
  }

  protected refreshMarks(): void {
    const next: Record<string, boolean> = {};
    for (const command of MARKS) {
      try { next[command] = document.queryCommandState(command); } catch { next[command] = false; }
    }
    this.marks = next;
  }
}
