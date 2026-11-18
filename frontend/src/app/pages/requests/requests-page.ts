import { Component, HostListener, OnDestroy, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Accounts, secondApplicant } from '../../accounts';
import { AskAiState } from '../../ask-ai/ask-ai';
import { DftButton } from '../../button/button';
import { InputField } from '../../input-field/input-field';
import { SideNav } from '../../menu-bar/side-nav';
import { Tabs } from '../../tabs/tabs';
import { TopHeader } from '../../top-header/top-header';
import { RequestForm, FilingKind, formOf, formsForKind, measureNoteFor, measuresForKind, purposeOf, requestForms, requestMeasures } from './form-catalog';
import { applicantFilingLabel, applicantOptionTags, filingRefId, readCaseStatus, readFilingFiler, startFilingCase, writeFilingFiler } from './case-status';
import { readFilingIntent, saveFilingIntent } from './filing-intent';
import { joinedCaseIds } from './interest-invite';
import { allowedCaseIds, isActingAgent } from './proxy-grant';
import { archiveCases, caseBrief, caseKey, caseNumberLabel, draftCases, findListedCase, latestDate, ListedCase } from './request-cases';
import { StatusTag, StatusTone } from '../../status-tag/status-tag';

type RequestTag = { label: string; tone: StatusTone };
type RequestRow = ListedCase & { ready: boolean; filing: boolean; result: string; updated: string; tags: RequestTag[] };

const applicantRoles = new Set(['corporate', 'individual', 'association']);

@Component({
  selector: 'app-requests-page',
  imports: [TopHeader, SideNav, DftButton, Tabs, StatusTag, InputField],
  templateUrl: './requests-page.html',
  styleUrl: './requests-page.css',
})
export class RequestsPage implements OnDestroy {
  protected readonly measures = requestMeasures;
  protected readonly forms = requestForms;
  protected measure = 'มาตรการ AD';
  protected filingKind: FilingKind | '' = '';
  protected filingCaseId = '';
  protected caseQuery = '';

  protected get visibleMeasures() {
    return this.filingKind ? measuresForKind(this.filingKind) : this.measures;
  }

  protected get visibleForms(): RequestForm[] {
    if (!this.filingKind) return [];
    return formsForKind(this.measure, this.filingKind);
  }
  protected readonly picked = signal<Readonly<Record<string, readonly string[]>>>({});
  protected choosing = false;
  protected filingStep: 'kind' | 'case' | 'forms' | 'method' = 'kind';
  protected filingMethod: 'system' | 'upload' | '' = '';
  protected readonly filingKinds: { value: FilingKind; label: string; summary: string }[] = [
    { value: 'new', label: 'ยื่นมาตรการใหม่', summary: 'ยังไม่มีมาตรการกับสินค้านี้ หรือต้องการเปิดมาตรการครั้งแรก' },
    { value: 'review', label: 'ทบทวน', summary: 'มีมาตรการใช้อยู่แล้ว และต้องการทบทวน ปรับเงื่อนไข หรือขอคืนอากร' },
  ];
  protected readonly filingMethods: { value: 'system' | 'upload'; label: string; summary: string }[] = [
    { value: 'system', label: 'กรอกข้อมูลผ่านทางระบบ', summary: 'กรอกแบบฟอร์มออนไลน์ทีละช่องผ่านเว็บไซต์' },
    { value: 'upload', label: 'อัปโหลดไฟล์', summary: 'แนบไฟล์แบบฟอร์มที่จัดทำไว้แล้วเข้าสู่ระบบ' },
  ];
  protected listTab = 0;

  private opener: HTMLElement | null = null;

  constructor(
    private readonly router: Router,
    private readonly askAi: AskAiState,
    private readonly accounts: Accounts,
    route: ActivatedRoute,
  ) {
    route.queryParamMap.subscribe((params) => {
      this.listTab = params.get('tab') === 'draft' ? 1 : 0;
      const next = params.get('choose') === '1';
      if (next && params.get('method') === '1') {
        const intent = readFilingIntent();
        if (intent?.codes.length) {
          this.measure = intent.measure;
          this.filingKind = intent.kind === 'review' ? 'review' : 'new';
          this.filingCaseId = intent.caseId || '';
          this.picked.set({ [intent.measure]: [...intent.codes] });
          this.filingMethod = 'upload';
          this.filingStep = 'method';
        }
      }
      if (next && !this.choosing) {
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
    const rows = this.visibleCases(archiveCases).map((item) => this.asRow(item));
    const live = this.liveFilingRow();
    if (!live || live.draft) return rows;
    return [live, ...rows];
  }

  protected get draftRows(): RequestRow[] {
    const live = this.liveFilingRow();
    const ownDraft = live?.draft ? [live] : [];
    if (isActingAgent(this.accounts.username) || this.accounts.role === 'interest' || this.ownFilings().length) return ownDraft;
    return [...ownDraft, ...draftCases.map((item) => this.asRow(item))];
  }

  private liveFilingRow(): RequestRow | null {
    if (!applicantRoles.has(this.accounts.role)) return null;
    if (!sessionStorage.getItem('dft-por1-case')) return null;
    const mine = this.accounts.username.trim();
    let filer = readFilingFiler();
    if (!filer && mine) {
      writeFilingFiler(mine);
      filer = mine;
    }
    if (filer && mine && filer !== mine) return null;
    const status = readCaseStatus();
    const created = sessionStorage.getItem('dft-por1-action-on') || '';
    const waiting = sessionStorage.getItem('dft-por1-await-official') === '1';
    const shown = applicantFilingLabel(status);
    const tags = applicantOptionTags(status);
    const item: ListedCase = {
      id: 'live-por1',
      code: '—',
      ref: filingRefId,
      goods: 'เหล็กแผ่นรีดร้อนจากเวียดนามและอียิปต์',
      countries: ['เวียดนาม', 'อียิปต์'],
      kind: 'แบบ ปร.1',
      measure: 'AD (ตอบโต้การทุ่มตลาด)',
      status: shown.label,
      tone: shown.tone,
      created,
      round: 1,
      waiting: waiting || status === 'revision' || status === 'consult' || status === 'approval' || shown.label === 'ให้แก้ไข' || tags.length > 0,
      draft: status === 'draft',
      steps: [{ name: shown.label, state: 'current', date: created }],
      applicant: this.accounts.displayName || secondApplicant.name,
      filer: filer || mine || secondApplicant.username,
      documents: ['แบบ ปร.1 คำขอเหล็กแผ่นรีดร้อนจากเวียดนามและอียิปต์'],
    };
    return { ...this.asRow(item), filing: true, ready: status !== 'cancelled', tags };
  }

  private ownFilings(): ListedCase[] {
    return archiveCases.filter((item) => item.filer === this.accounts.username);
  }

  private visibleCases(rows: ListedCase[]): ListedCase[] {
    const allow = allowedCaseIds(this.accounts.username);
    let next = allow ? rows.filter((item) => allow.has(item.id) || allow.has(item.code)) : rows;
    const own = this.ownFilings();
    if (own.length) return own;
    if (this.accounts.role === 'corporate') next = next.filter((item) => !item.filer);
    if (this.accounts.role !== 'interest') return next;
    const joined = joinedCaseIds(this.accounts.username);
    if (!joined) return next;
    return next.filter((item) => joined.has(item.id) || joined.has(item.code));
  }

  protected dateOnly(value: string): string {
    return value.trim().split(/\s+/)[0] || '—';
  }

  protected caseNo(row: ListedCase): string {
    return caseNumberLabel(row);
  }

  protected get visibleRows(): RequestRow[] {
    return this.listTab === 1 ? this.draftRows : this.filedRows;
  }

  private asRow(item: ListedCase): RequestRow {
    const tags: RequestTag[] = [];
    if (item.waiting && item.status !== 'ให้แก้ไข' && !/ปรึกษา|อนุมัติ|ยื่นแบบ/u.test(item.status)) {
      tags.push({ label: 'มีงานรอดำเนินการ', tone: 'info' });
    }
    return { ...item, ready: true, filing: false, result: caseBrief(item), updated: latestDate(item), tags };
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
    if (row.id === 'live-por1') {
      void this.router.navigate(['/requests', 'por-1']);
      return;
    }
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
    void this.router.navigate(['/requests', caseKey(row)]);
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
    this.filingStep = 'kind';
    this.filingKind = '';
    this.filingCaseId = '';
    this.caseQuery = '';
    this.filingMethod = '';
    this.picked.set({});
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
    if (form?.code === 'ปร. 1') startFilingCase(this.accounts.username);
    this.choosing = false;
    document.body.classList.remove('chooser-open');
    void this.router.navigate([route], {
      queryParams: this.measure === 'มาตรการ CVD' ? { measure: 'cvd' } : this.measure === 'มาตรการ AD' ? { measure: 'ad' } : {},
    });
  }

  protected closeChooser(): void {
    this.choosing = false;
    this.filingStep = 'kind';
    this.filingKind = '';
    this.filingCaseId = '';
    this.caseQuery = '';
    this.filingMethod = '';
    void this.router.navigate(['/requests']);
  }

  protected pickFilingKind(value: FilingKind): void {
    this.filingKind = value;
    if (value !== 'review') this.filingCaseId = '';
  }

  protected canContinueKind(): boolean {
    return this.filingKind === 'new' || this.filingKind === 'review';
  }

  protected continueKind(): void {
    if (!this.canContinueKind() || !this.filingKind) return;
    if (this.filingKind !== 'review') this.filingCaseId = '';
    this.goToFormsStep();
  }

  protected backToKind(): void {
    this.filingStep = 'kind';
    this.filingMethod = '';
  }

  /** เคสที่ประกาศผลแล้วเท่านั้น จึงยื่นทบทวน/คืนอากรได้ */
  private isAnnouncedCase(item: ListedCase): boolean {
    return /ประกาศผลชั้นที่สุด|ประกาศผลการทบทวน/u.test(item.status);
  }

  private caseMatchesMeasure(item: ListedCase, measure: string): boolean {
    const raw = `${item.measure} ${item.kind}`.toUpperCase();
    if (measure === 'มาตรการ CVD') return /CVD|อุดหนุน/u.test(raw);
    if (measure === 'มาตรการ SG') return /SG|ปกป้อง/u.test(raw);
    if (measure === 'มาตรการ AC') return /AC|หลบเลี่ยง/u.test(raw);
    return /AD|ทุ่มตลาด|มาตรา\s*5[6-9]/u.test(raw) || (!/CVD|SG|AC|อุดหนุน|ปกป้อง|หลบเลี่ยง/u.test(raw) && caseNumberLabel(item).startsWith('AD'));
  }

  protected get reviewCaseOptions(): ListedCase[] {
    const seen = new Set<string>();
    const rows: ListedCase[] = [];
    for (const item of this.visibleCases(archiveCases)) {
      const code = caseNumberLabel(item);
      if (code === '—' || seen.has(code)) continue;
      if (!this.isAnnouncedCase(item)) continue;
      if (!this.caseMatchesMeasure(item, this.measure)) continue;
      seen.add(code);
      rows.push(item);
    }
    return rows;
  }

  protected get filteredReviewCases(): ListedCase[] {
    const query = this.caseQuery.trim().toLowerCase();
    if (!query) return this.reviewCaseOptions;
    return this.reviewCaseOptions.filter((item) => {
      const hay = [caseNumberLabel(item), item.ref, item.goods, item.measure, item.status, item.countries.join(' ')].join(' ').toLowerCase();
      return hay.includes(query);
    });
  }

  protected get selectedReviewCase(): ListedCase | null {
    if (!this.filingCaseId) return null;
    return findListedCase(this.filingCaseId) ?? this.reviewCaseOptions.find((item) => caseNumberLabel(item) === this.filingCaseId) ?? null;
  }

  protected get chosenFormLabel(): string {
    const codes = this.chosenCodes();
    return codes.length ? codes.join(', ') : '';
  }

  protected pickReviewCase(code: string): void {
    this.filingCaseId = code;
  }

  protected canContinueCase(): boolean {
    return !!this.filingCaseId && this.reviewCaseOptions.some((item) => caseNumberLabel(item) === this.filingCaseId);
  }

  protected continueCase(): void {
    if (!this.canContinueCase()) return;
    const picked = this.chosenCodes();
    saveFilingIntent(this.intentPayload(picked));
    const form = this.visibleForms.find((item) => picked.includes(item.code) && item.route);
    if (form) {
      this.openForm(form.code);
      return;
    }
    this.filingMethod = '';
    this.filingStep = 'method';
  }

  protected backFromCase(): void {
    this.filingStep = 'forms';
    this.filingMethod = '';
  }

  private goToFormsStep(): void {
    const options = this.filingKind ? measuresForKind(this.filingKind) : this.measures;
    if (!options.some((item) => item.value === this.measure)) {
      this.measure = options[0]?.value ?? this.measure;
    }
    this.filingStep = 'forms';
  }

  private goToCaseStep(): void {
    this.caseQuery = '';
    if (this.filingCaseId && !this.reviewCaseOptions.some((item) => caseNumberLabel(item) === this.filingCaseId)) {
      this.filingCaseId = '';
    }
    this.filingStep = 'case';
  }

  private intentPayload(codes: readonly string[]) {
    return {
      measure: this.measure,
      codes,
      kind: this.filingKind || undefined,
      caseId: this.filingKind === 'review' ? this.filingCaseId || undefined : undefined,
    } as const;
  }

  protected pickMeasure(value: string): void {
    this.measure = value;
  }

  protected chosenCodes(): string[] {
    return [...(this.picked()[this.measure] ?? [])];
  }

  protected isPicked(code: string): boolean {
    return (this.picked()[this.measure] ?? []).includes(code);
  }

  protected togglePicked(code: string, event?: Event): void {
    event?.preventDefault();
    this.setPicked(code, !this.isPicked(code));
  }

  protected pickedCount(measure: string): number {
    if (!this.filingKind) return 0;
    const allowed = new Set(formsForKind(measure, this.filingKind).map((item) => item.code));
    return (this.picked()[measure] ?? []).filter((code) => allowed.has(code)).length;
  }

  protected canContinue(): boolean {
    return this.chosenCodes().length > 0;
  }

  protected continueFiling(): void {
    const picked = this.chosenCodes();
    if (!picked.length || !this.filingKind) return;
    if (this.filingKind === 'review') {
      saveFilingIntent(this.intentPayload(picked));
      this.goToCaseStep();
      return;
    }
    saveFilingIntent(this.intentPayload(picked));
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
    this.filingMethod = '';
  }

  protected pickFilingMethod(value: 'system' | 'upload'): void {
    this.filingMethod = value;
  }

  protected confirmMethod(): void {
    const picked = this.picked()[this.measure] ?? [];
    if (this.filingMethod === 'upload') {
      saveFilingIntent(this.intentPayload(picked));
      this.choosing = false;
      document.body.classList.remove('chooser-open');
      void this.router.navigateByUrl('/requests/upload', { state: { measure: this.measure, codes: [...picked], caseId: this.filingCaseId || undefined } });
      return;
    }
    if (!this.canConfirmMethod()) return;
    saveFilingIntent(this.intentPayload(picked));
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

  protected get measureNote(): string {
    return measureNoteFor(this.measure, this.filingKind);
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (!this.choosing || this.askAi.mode() !== 'closed') return;
    this.closeChooser();
  }

  protected openMenu(label: string): void {
    if (label === 'ยื่นคำขอ') {
      this.openChooser();
      return;
    }
    if (label === 'รายการยื่นคำขอ') this.closeChooser();
  }

  protected get chooserTitle(): string {
    if (this.filingStep === 'kind') return 'เลือกประเภทการยื่นคำขอ';
    if (this.filingStep === 'case') return 'เลือก Case ID ที่จะทบทวน';
    if (this.filingStep === 'forms') {
      return this.filingKind === 'review' ? 'เลือกแบบฟอร์มทบทวน' : 'เลือกแบบฟอร์มยื่นมาตรการใหม่';
    }
    return 'คุณต้องการยื่นแบบฟอร์มอย่างไร?';
  }

  protected get chooserNote(): string {
    if (this.filingStep === 'kind') return 'เลือกประเภทให้ตรงกับสถานะมาตรการของคุณ แล้วระบบจะแสดงแบบฟอร์มที่เกี่ยวข้อง';
    if (this.filingStep === 'case') {
      const forms = this.chosenFormLabel;
      return forms
        ? `แสดงเฉพาะเคสที่ประกาศผลแล้วในมาตรการที่เลือก · แบบ ${forms}`
        : 'แสดงเฉพาะเคสที่ประกาศผลแล้วในมาตรการที่เลือก';
    }
    if (this.filingStep === 'forms') {
      return this.filingKind === 'review'
        ? 'เลือกมาตรการและแบบ ปร. ก่อน แล้วจึงเลือก Case ID ที่ประกาศผลแล้ว'
        : 'เลือกมาตรการแล้วเลือกแบบเปิดมาตรการครั้งแรก';
    }
    return 'เลือกกรอกข้อมูลผ่านระบบ หรืออัปโหลดไฟล์เข้าสู่ระบบ';
  }
}
