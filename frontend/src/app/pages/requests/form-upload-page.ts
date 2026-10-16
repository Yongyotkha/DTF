import { Component, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DftButton } from '../../button/button';
import { SideNav } from '../../menu-bar/side-nav';
import { DftModal } from '../../modal/modal';
import { StatusTag, StatusTone } from '../../status-tag/status-tag';
import { TopHeader } from '../../top-header/top-header';
import { filingRefId, startFilingCase, writeCaseStatus } from './case-status';
import { clearFilingIntent, readFilingIntent, saveFilingIntent } from './filing-intent';
import { scrollFormToTop } from './form-scroll';
import { RequestForm, formOf, measureOf, purposeOf } from './form-catalog';

const maxBytes = 20 * 1024 * 1024;
const formAccept = /\.(pdf|docx?)$/i;
const extraAccept = /\.(pdf|docx?|png|jpe?g)$/i;

@Component({
  selector: 'app-form-upload-page',
  imports: [TopHeader, SideNav, RouterLink, DftButton, StatusTag, DftModal],
  templateUrl: './form-upload-page.html',
  styleUrl: './form-upload-page.css',
})
export class FormUploadPage {
  private readonly measure: string;
  protected readonly measureLabel: string;
  protected readonly forms: RequestForm[];
  protected readonly current = signal('');
  protected readonly files = signal<Record<string, string>>({});
  protected readonly extras = signal<Record<string, string[]>>({});
  protected readonly over = signal('');
  protected historyOpen = false;
  protected historyFull = false;
  protected historyTab: 'activity' | 'version' = 'activity';
  protected notice = false;
  protected readonly refId = filingRefId;

  constructor(private readonly router: Router) {
    const nav = this.router.getCurrentNavigation();
    const state = (nav?.extras.state ?? history.state) as { measure?: string; codes?: string[] } | null;
    const intent = readFilingIntent();
    this.measure = state?.measure || intent?.measure || '';
    const codes = (state?.codes?.length ? state.codes : intent?.codes) ?? [];
    this.measureLabel = measureOf(this.measure).label;
    this.forms = codes.map((code) => formOf(code)).filter((form): form is RequestForm => !!form);
    this.current.set(this.forms[0]?.code ?? '');
    if (!this.forms.length) {
      void this.router.navigate(['/requests'], { queryParams: { choose: '1' } });
    }
  }

  protected active(): RequestForm | null {
    return this.forms.find((item) => item.code === this.current()) ?? this.forms[0] ?? null;
  }

  protected open(code: string, event?: Event): void {
    this.current.set(code);
    scrollFormToTop(event);
  }

  protected filled(code: string): boolean {
    return !!this.files()[code];
  }

  protected purpose(form: RequestForm) {
    return purposeOf(form, this.measure);
  }

  protected downloadBlank(event: Event, form: RequestForm): void {
    event.preventDefault();
    const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><title>แบบฟอร์ม ${form.code}</title></head><body><p><strong>แบบฟอร์ม ${form.code}</strong></p><p>${form.title}</p></body></html>`;
    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `แบบฟอร์ม ${form.code}.doc`;
    link.click();
    URL.revokeObjectURL(url);
  }

  protected allowDrop(event: DragEvent, key: string): void {
    event.preventDefault();
    this.over.set(key);
  }

  protected setFormFile(code: string, list: FileList | null): void {
    this.over.set('');
    const file = list?.[0];
    if (!file) return;
    if (!formAccept.test(file.name) || file.size > maxBytes) return;
    this.files.update((current) => ({ ...current, [code]: file.name }));
  }

  protected clearFormFile(code: string, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.files.update((current) => {
      const next = { ...current };
      delete next[code];
      return next;
    });
  }

  protected extraNames(code: string): string[] {
    return this.extras()[code] ?? [];
  }

  protected addExtras(code: string, list: FileList | null): void {
    if (!list?.length) return;
    const names = Array.from(list)
      .filter((file) => extraAccept.test(file.name) && file.size <= maxBytes)
      .map((file) => file.name);
    if (!names.length) return;
    this.extras.update((current) => ({ ...current, [code]: [...(current[code] ?? []), ...names] }));
  }

  protected removeExtra(code: string, index: number): void {
    this.extras.update((current) => ({
      ...current,
      [code]: (current[code] ?? []).filter((_, item) => item !== index),
    }));
  }

  protected get canSubmit(): boolean {
    return this.forms.every((form) => !!this.files()[form.code]);
  }

  protected saveDraft(): void {
    saveFilingIntent({ measure: this.measure, codes: this.forms.map((form) => form.code) });
    writeCaseStatus('draft');
    this.notice = true;
  }

  protected finishNotice(): void {
    this.notice = false;
    void this.router.navigate(['/requests'], { queryParams: { tab: 'draft' } });
  }

  protected closeHistory(): void {
    this.historyOpen = false;
    this.historyFull = false;
  }

  protected get historyItems(): { phase: string; title: string; when: string; detail: string; tone: StatusTone; label: string }[] {
    const codes = this.forms.map((form) => form.code).join(', ') || '—';
    if (this.historyTab === 'version') {
      return [{ phase: 'ฉบับร่าง', title: 'ยังไม่มีการยื่น', when: '—', detail: 'บันทึกเป็นร่างก่อนยื่นตรวจสอบ', tone: 'neutral', label: 'ร่าง' }];
    }
    return [{ phase: 'ยื่นคำขอ', title: 'สร้างร่างอัปโหลดไฟล์', when: 'วันนี้', detail: `แบบฟอร์ม ${codes}`, tone: 'neutral', label: 'ร่าง' }];
  }

  protected submit(): void {
    if (!this.canSubmit) return;
    if (this.forms.some((form) => form.code === 'ปร. 1')) startFilingCase();
    clearFilingIntent();
    void this.router.navigate(['/requests']);
  }

  protected openMenu(label: string): void {
    if (label === 'รายการยื่นคำขอ') void this.router.navigate(['/requests']);
  }
}
