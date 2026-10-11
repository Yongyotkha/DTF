import { Component, HostListener, OnDestroy, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AskAiState } from '../../ask-ai/ask-ai';
import { DftButton } from '../../button/button';
import { SideNav } from '../../menu-bar/side-nav';
import { Tabs } from '../../tabs/tabs';
import { TopHeader } from '../../top-header/top-header';
import { RequestForm, purposeOf, requestForms, requestMeasures } from './form-catalog';
import { caseStatusLabel, caseStatusTone, filingRefId, readCaseStatus, readRounds, startFilingCase } from './case-status';
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
  styleUrl: './requests-page.css',
})
export class RequestsPage implements OnDestroy {
  protected readonly measures = requestMeasures;
  protected readonly forms = requestForms;
  protected measure = 'มาตราการ AD';
  protected choosing = false;
  protected detailCode = '';
  protected listTab = 0;
  protected query = '';
  protected statusFilter = '';
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
      if (next && !this.choosing) setTimeout(() => document.getElementById('chooser-close')?.focus(), 0);
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

  protected get statusOptions(): string[] {
    const source = this.listTab === 1 ? this.draftRows : this.filedRows;
    return [...new Set(source.map((row) => row.status))];
  }

  protected get visibleRows(): RequestRow[] {
    const source = this.listTab === 1 ? this.draftRows : this.filedRows;
    const query = this.query.trim().toLowerCase();
    return source.filter((row) => {
      const statusOk = !this.statusFilter || row.status === this.statusFilter;
      const text = `${row.code} ${row.goods}`.toLowerCase();
      return statusOk && (!query || text.includes(query));
    });
  }

  protected get filedCount(): number {
    return this.filedRows.length;
  }

  protected get reviewCount(): number {
    return this.filedRows.filter((row) => row.status === 'อยู่ระหว่างตรวจสอบ').length;
  }

  protected get waitingCount(): number {
    return this.filedRows.filter((row) => row.waiting).length;
  }

  protected meta(row: RequestRow): string {
    const parts = [row.created ? `สร้างเมื่อ ${row.created}` : '', row.round ? `ยื่นครั้งที่ ${row.round}` : ''].filter(Boolean);
    return parts.join(' · ');
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
    this.statusFilter = '';
    void this.router.navigate(['/requests'], {
      queryParams: index === 1 ? { tab: 'draft' } : {},
      replaceUrl: true,
    });
  }

  protected toggleRow(id: string): void {
    this.openRows.update((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  protected openRow(row: RequestRow): void {
    if (!row.ready) return;
    if (row.filing) {
      void this.router.navigate(['/requests', 'por-1']);
      return;
    }
    void this.router.navigate(['/requests', row.code]);
  }

  protected openChooser(event?: Event): void {
    const host = event?.currentTarget as HTMLElement | undefined;
    this.opener = host?.querySelector('button') ?? host ?? null;
    this.choosing = true;
    void this.router.navigate(['/requests'], { queryParams: { choose: '1' } });
  }

  protected openForm(code: string): void {
    if (code === 'ปร. 1') {
      startFilingCase();
      this.choosing = false;
      void this.router.navigate(['/requests', 'por-1']);
      return;
    }
    if (code === 'ปร. 2') {
      this.choosing = false;
      void this.router.navigate(['/requests', 'por-2']);
      return;
    }
    this.closeChooser();
  }

  protected closeChooser(): void {
    this.choosing = false;
    void this.router.navigate(['/requests']);
  }

  protected pickMeasure(value: string): void {
    this.measure = value;
    this.detailCode = '';
  }

  protected purpose(form: RequestForm) {
    return purposeOf(form, this.measure);
  }

  protected toggleDetail(code: string): void {
    this.detailCode = this.detailCode === code ? '' : code;
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
