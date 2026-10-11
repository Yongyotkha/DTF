import { Component, HostListener, OnDestroy, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AskAiState } from '../../ask-ai/ask-ai';
import { DftButton } from '../../button/button';
import { SideNav } from '../../menu-bar/side-nav';
import { Tabs } from '../../tabs/tabs';
import { TopHeader } from '../../top-header/top-header';
import { RequestForm, purposeOf, requestForms, requestMeasures } from './form-catalog';
import { caseStatusLabel, caseStatusTone, filingRefId, readCaseStatus } from './case-status';
import { StatusTag } from '../../status-tag/status-tag';

type RequestStep = {
  name: string;
  state: 'done' | 'current' | 'todo';
  date?: string;
};

type RequestRow = {
  id: string;
  code: string;
  goods: string;
  kind: string;
  status: string;
  created: string;
  ready: boolean;
  steps: RequestStep[];
};

const stepNames = ['ยื่นคำขอ', 'ตรวจสอบข้อมูล', 'เปิดการไต่สวน', 'ผลการไต่สวนชั้นต้น', 'ยื่นรับฟังความคิดเห็น', 'ร่างผลการไต่สวน', 'ประกาศผลชั้นที่สุด'];
const stepDate = 'วันที่ 15 มกราคม 2567 เวลา 16:30';

function requestSteps(current: number): RequestStep[] {
  return stepNames.map((name, index) => ({
    name,
    state: index < current ? 'done' : index === current ? 'current' : 'todo',
    date: index <= current && index < 2 ? stepDate : undefined,
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
  protected readonly tabs = ['รายการยื่นคำขอ', 'ฉบับร่าง'];
  protected measure = 'มาตราการ AD';
  protected choosing = false;
  protected detailCode = '';
  protected listTab = 0;
  protected page = 1;
  protected readonly openRows = signal<ReadonlySet<string>>(new Set(['row-1', 'row-2']));
  private readonly rows: RequestRow[] = [
    { id: 'row-1', code: filingRefId, goods: 'เหล็กแผ่นรีดร้อน', kind: 'ยื่นแทนผู้ผลิตบางส่วน', status: 'ยื่นคำขอ', created: '15/05/2562 10:00', ready: true, steps: requestSteps(0) },
    { id: 'row-2', code: 'AD0012', goods: 'text', kind: 'ยื่นในนามของตนเอง', status: 'ยื่นรับฟังความคิดเห็น', created: '22/09/2569 10:20', ready: false, steps: requestSteps(1) },
  ];

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

  protected get visibleRows(): RequestRow[] {
    if (this.page !== 1) return [];
    const status = readCaseStatus();
    const current = { ...this.rows[0], status: caseStatusLabel(status), ready: status !== 'cancelled' };
    if (this.listTab === 1) return status === 'draft' ? [current] : [];
    return status === 'draft' ? [this.rows[1]] : [current, this.rows[1]];
  }

  protected get caseTone() {
    return caseStatusTone(readCaseStatus());
  }

  protected get caseLabel(): string {
    return caseStatusLabel(readCaseStatus());
  }

  protected setListTab(index: number): void {
    this.listTab = index;
    void this.router.navigate(['/requests'], {
      queryParams: index === 1 ? { tab: 'draft' } : {},
      replaceUrl: true,
    });
  }

  protected shiftPage(step: number): void {
    this.page = Math.min(2, Math.max(1, this.page + step));
  }

  protected toggleRow(id: string): void {
    this.openRows.update((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  protected openCase(): void {
    void this.router.navigate(['/requests', 'AD1120']);
  }

  protected openDraft(): void {
    void this.router.navigate(['/requests', 'draft', 'A4']);
  }

  protected openChooser(event?: Event): void {
    const host = event?.currentTarget as HTMLElement | undefined;
    this.opener = host?.querySelector('button') ?? host ?? null;
    this.choosing = true;
    void this.router.navigate(['/requests'], { queryParams: { choose: '1' } });
  }

  protected openForm(code: string): void {
    if (code === 'ปร. 1') {
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
