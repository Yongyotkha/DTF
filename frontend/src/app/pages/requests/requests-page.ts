import { Component, HostListener, OnDestroy, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AskAiState } from '../../ask-ai/ask-ai';
import { DftButton } from '../../button/button';
import { SideNav } from '../../menu-bar/side-nav';
import { Tabs } from '../../tabs/tabs';
import { TopHeader } from '../../top-header/top-header';
import { RequestForm, formOf, purposeOf, requestForms, requestMeasures } from './form-catalog';
import { caseStatusLabel, caseStatusTone, filingRefId, readCaseStatus, readRounds, startFilingCase } from './case-status';
import { readFilingIntent, saveFilingIntent } from './filing-intent';
import { archiveCases, draftCases, ListedCase, RequestStep } from './request-cases';
import { StatusTag } from '../../status-tag/status-tag';

type RequestRow = ListedCase & { ready: boolean; filing: boolean };

const filingSteps = ['ยื่นคำขอ', 'ตรวจสอบข้อมูล', 'เปิดการไต่สวน', 'ผลการไต่สวนชั้นต้น', 'รับฟังความคิดเห็น', 'ร่างผลการไต่สวน', 'ประกาศผลชั้นที่สุด'];

function filingProgress(current: number): RequestStep[] {
  return filingSteps.map((name, index) => ({
    name,
    state: index < current ? 'done' : index === current ? 'current' : 'todo',
    date: index === 0 && current > 0 ? '15/05/2562 10:00' : undefined,
  }));
}

@Component({
  selector: 'app-requests-page',
  imports: [TopHeader, SideNav, DftButton, Tabs, StatusTag],
  templateUrl: './requests-page.html',
  styleUrls: ['../../data-table/data-table.css', './requests-page.css'],
})
export class RequestsPage implements OnDestroy {
  protected readonly measures = requestMeasures;
  protected readonly forms = requestForms;
  protected measure = 'มาตราการ AD';
  protected readonly picked = signal<Readonly<Record<string, readonly string[]>>>({});
  protected choosing = false;
  protected filingStep: 'forms' | 'method' = 'forms';
  protected filingMethod: 'system' | 'upload' | '' = '';
  protected readonly filingMethods: { value: 'system' | 'upload'; label: string; summary: string }[] = [
    { value: 'system', label: 'กรอกข้อมูลผ่านทางระบบ', summary: 'กรอกแบบฟอร์มออนไลน์ทีละช่องผ่านเว็บไซต์' },
    { value: 'upload', label: 'อัปโหลดไฟล์', summary: 'แนบไฟล์แบบฟอร์มที่จัดทำไว้แล้วเข้าสู่ระบบ' },
  ];
  protected listTab = 0;
  protected readonly openRows = signal<ReadonlySet<string>>(new Set());

  private opener: HTMLElement | null = null;

  constructor(
    private readonly router: Router,
    private readonly askAi: AskAiState,
    route: ActivatedRoute,
  ) {
    route.queryParamMap.subscribe((params) => {
      this.listTab = params.get('tab') === 'draft' ? 1 : 0;
      const next = params.get('choose') === '1';
      if (next && params.get('method') === '1') {
        const intent = readFilingIntent();
        if (intent?.codes.length) {
          this.measure = intent.measure;
          this.picked.set({ [intent.measure]: [...intent.codes] });
          this.filingMethod = 'upload';
          this.filingStep = 'method';
        }
      }
      if (next && !this.choosing) setTimeout(() => document.getElementById('chooser-close')?.focus({ preventScroll: true }), 0);
      if (!next && this.choosing) setTimeout(() => this.opener?.focus(), 0);
      this.choosing = next;
      document.body.classList.toggle('chooser-open', next);
    });
  }

  ngOnDestroy(): void {
    document.body.classList.remove('chooser-open');
  }

  protected get tabLabels(): string[] {
    return [`รายการยื่นคำขอ (${this.filedRows.length})`, `ฉบับร่าง (${this.draftRows.length})`];
  }

  protected get filedRows(): RequestRow[] {
    const status = readCaseStatus();
    const archive = archiveCases.map((item) => this.asRow(item));
    if (status === 'draft') return archive;
    return [this.filingRow(status), ...archive];
  }

  protected get draftRows(): RequestRow[] {
    const drafts = draftCases.map((item) => this.asRow(item));
    return readCaseStatus() === 'draft' ? [this.filingRow('draft'), ...drafts] : drafts;
  }

  protected dateOnly(value: string): string {
    return value.trim().split(/\s+/)[0] || '—';
  }

  protected get visibleRows(): RequestRow[] {
    return this.listTab === 1 ? this.draftRows : this.filedRows;
  }

  private filingRow(status: ReturnType<typeof readCaseStatus>): RequestRow {
    const rounds = readRounds();
    const submitted = status !== 'draft' && status !== 'cancelled';
    return {
      id: 'filing',
      code: filingRefId,
      goods: 'เหล็กแผ่นรีดร้อน จากเวียดนามและอียิปต์',
      kind: 'ยื่นแทนผู้ผลิตบางส่วน',
      status: caseStatusLabel(status),
      tone: caseStatusTone(status),
      created: '15/05/2562 10:00',
      round: submitted ? (rounds.at(-1)?.round ?? 1) : null,
      waiting: status === 'revision',
      draft: status === 'draft',
      ready: status !== 'cancelled',
      filing: true,
      steps: filingProgress(status === 'draft' || status === 'cancelled' ? 0 : 1),
      documents: [],
    };
  }

  private asRow(item: ListedCase): RequestRow {
    return { ...item, ready: true, filing: false };
  }

  protected setListTab(index: number): void {
    this.listTab = index;
    void this.router.navigate(['/requests'], {
      queryParams: index === 1 ? { tab: 'draft' } : {},
      replaceUrl: true,
    });
  }

  protected toggleRow(id: string, event: Event): void {
    event.stopPropagation();
    this.openRows.update((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  protected openRow(row: RequestRow, event?: Event): void {
    event?.stopPropagation();
    if (!row.ready) return;
    if (row.filing) {
      void this.router.navigate(['/requests', 'por-1']);
      return;
    }
    void this.router.navigate(['/requests', row.code]);
  }

  protected openRowKey(event: KeyboardEvent, row: RequestRow): void {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    this.openRow(row);
  }

  protected openChooser(event?: Event): void {
    const host = event?.currentTarget as HTMLElement | undefined;
    this.opener = host?.querySelector('button') ?? host ?? null;
    this.choosing = true;
    void this.router.navigate(['/requests'], { queryParams: { choose: '1' } });
  }

  protected openForm(code: string): void {
    const form = formOf(code) ?? this.forms.find((item) => !!item.route);
    const route = form?.route;
    if (!route) {
      this.closeChooser();
      return;
    }
    if (form?.code === 'ปร. 1') startFilingCase();
    this.choosing = false;
    document.body.classList.remove('chooser-open');
    void this.router.navigateByUrl(route);
  }

  protected closeChooser(): void {
    this.choosing = false;
    this.filingStep = 'forms';
    this.filingMethod = '';
    void this.router.navigate(['/requests']);
  }

  protected pickMeasure(value: string): void {
    this.measure = value;
  }

  protected isPicked(code: string): boolean {
    return (this.picked()[this.measure] ?? []).includes(code);
  }

  protected canContinue(): boolean {
    return (this.picked()[this.measure] ?? []).length > 0;
  }

  protected continueFiling(): void {
    this.filingStep = 'method';
  }

  protected backToForms(): void {
    this.filingStep = 'forms';
  }

  protected pickFilingMethod(value: 'system' | 'upload'): void {
    this.filingMethod = value;
  }

  protected confirmMethod(): void {
    const picked = this.picked()[this.measure] ?? [];
    if (this.filingMethod === 'upload') {
      saveFilingIntent({ measure: this.measure, codes: picked });
      this.choosing = false;
      document.body.classList.remove('chooser-open');
      void this.router.navigate(['/requests', 'upload']);
      return;
    }
    if (this.filingMethod !== 'system') return;
    const form = this.forms.find((item) => picked.includes(item.code) && item.route)
      ?? this.forms.find((item) => item.route);
    if (form) this.openForm(form.code);
  }

  protected setPicked(code: string, picked: boolean): void {
    this.picked.update((current) => {
      const list = current[this.measure] ?? [];
      const has = list.includes(code);
      if (picked === has) return current;
      const next = picked ? [...list, code] : list.filter((item) => item !== code);
      return { ...current, [this.measure]: next };
    });
  }

  protected purpose(form: RequestForm) {
    return purposeOf(form, this.measure);
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (!this.choosing || this.askAi.mode() !== 'closed') return;
    this.closeChooser();
  }

  protected openMenu(label: string): void {
    if (label === 'ยื่นคำขอ') {
      this.choosing = true;
      void this.router.navigate(['/requests'], { queryParams: { choose: '1' } });
      return;
    }
    if (label === 'รายการยื่นคำขอ') this.closeChooser();
  }
}
