import { Component, HostListener, OnDestroy, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AskAiState } from '../../ask-ai/ask-ai';
import { DftButton } from '../../button/button';
import { SideNav } from '../../menu-bar/side-nav';
import { Tabs } from '../../tabs/tabs';
import { TopHeader } from '../../top-header/top-header';
import { RequestForm, formOf, formsFor, purposeOf, requestForms, requestMeasures } from './form-catalog';
import { startFilingCase } from './case-status';
import { readFilingIntent, saveFilingIntent } from './filing-intent';
import { archiveCases, draftCases, ListedCase } from './request-cases';
import { StatusTag } from '../../status-tag/status-tag';

type RequestRow = ListedCase & { ready: boolean; filing: boolean };

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

  protected get visibleForms(): RequestForm[] {
    return formsFor(this.measure);
  }
  protected readonly picked = signal<Readonly<Record<string, readonly string[]>>>({});
  protected choosing = false;
  protected filingStep: 'forms' | 'method' = 'forms';
  protected filingMethod: 'system' | 'upload' | '' = '';
  protected readonly filingMethods: { value: 'system' | 'upload'; label: string; summary: string }[] = [
    { value: 'system', label: 'กรอกข้อมูลผ่านทางระบบ', summary: 'กรอกแบบฟอร์มออนไลน์ทีละช่องผ่านเว็บไซต์' },
    { value: 'upload', label: 'อัปโหลดไฟล์', summary: 'แนบไฟล์แบบฟอร์มที่จัดทำไว้แล้วเข้าสู่ระบบ' },
  ];
  protected listTab = 0;

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
      if (next && !this.choosing) {
        this.pickLoneForm();
        setTimeout(() => document.getElementById('chooser-close')?.focus({ preventScroll: true }), 0);
      }
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
    return archiveCases.map((item) => this.asRow(item));
  }

  protected get draftRows(): RequestRow[] {
    return draftCases.map((item) => this.asRow(item));
  }

  protected dateOnly(value: string): string {
    return value.trim().split(/\s+/)[0] || '—';
  }

  protected get visibleRows(): RequestRow[] {
    return this.listTab === 1 ? this.draftRows : this.filedRows;
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

  protected openRow(row: RequestRow, event?: Event): void {
    event?.stopPropagation();
    if (!row.ready) return;
    if (row.draft || row.status === 'ร่าง' || row.status === 'ฉบับร่าง') {
      const form = this.formFor(row);
      if (form?.route) {
        void this.router.navigateByUrl(form.route);
        return;
      }
    }
    if (row.filing) {
      const intent = readFilingIntent();
      if (intent?.codes.length) {
        void this.router.navigateByUrl('/requests/upload', {
          state: { measure: intent.measure, codes: [...intent.codes] },
        });
        return;
      }
      void this.router.navigate(['/requests', 'por-1']);
      return;
    }
    void this.router.navigate(['/requests', row.code]);
  }

  private formFor(row: RequestRow): RequestForm | null {
    const raw = `${row.kind} ${row.code}`.replace(/^แบบ\s*/u, '');
    const match = raw.match(/ปร\.?\s*[0-9ก-ฮ]*/u)?.[0] ?? row.code;
    const code = match.replace(/^(ปร\.)(\S)/u, '$1 $2').trim();
    return formOf(code) ?? formOf(row.code);
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
    this.pickLoneForm();
  }

  private pickLoneForm(): void {
    const forms = this.visibleForms;
    if (forms.length !== 1 || this.isPicked(forms[0].code)) return;
    this.setPicked(forms[0].code, true);
  }

  protected chosenCodes(): string[] {
    const picked = this.picked()[this.measure] ?? [];
    if (picked.length) return [...picked];
    const forms = this.visibleForms;
    return forms.length === 1 ? [forms[0].code] : [];
  }

  protected isPicked(code: string): boolean {
    return this.chosenCodes().includes(code);
  }

  protected canContinue(): boolean {
    return this.chosenCodes().length > 0;
  }

  protected continueFiling(): void {
    const picked = this.chosenCodes();
    if (!picked.length) return;
    saveFilingIntent({ measure: this.measure, codes: picked });
    const form = this.visibleForms.find((item) => picked.includes(item.code) && item.route);
    if (form) {
      this.openForm(form.code);
      return;
    }
    this.filingMethod = '';
    this.filingStep = 'method';
  }

  protected canConfirmMethod(): boolean {
    if (this.filingMethod === 'upload') return true;
    if (this.filingMethod !== 'system') return false;
    const picked = this.picked()[this.measure] ?? [];
    return this.visibleForms.some((item) => picked.includes(item.code) && !!item.route);
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
      void this.router.navigateByUrl('/requests/upload', { state: { measure: this.measure, codes: [...picked] } });
      return;
    }
    if (!this.canConfirmMethod()) return;
    saveFilingIntent({ measure: this.measure, codes: picked });
    const form = this.visibleForms.find((item) => picked.includes(item.code) && item.route);
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
