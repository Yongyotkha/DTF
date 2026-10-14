import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { DftButton } from '../../button/button';
import { FileField } from '../../fields/file-field';
import { SideNav } from '../../menu-bar/side-nav';
import { TopHeader } from '../../top-header/top-header';
import { startFilingCase } from './case-status';
import { clearFilingIntent, readFilingIntent } from './filing-intent';
import { RequestForm, formOf, measureOf, purposeOf } from './form-catalog';

@Component({
  selector: 'app-form-upload-page',
  imports: [TopHeader, SideNav, DftButton, FileField],
  templateUrl: './form-upload-page.html',
  styleUrl: './form-upload-page.css',
})
export class FormUploadPage {
  private readonly measure: string;
  protected readonly measureLabel: string;
  protected readonly forms: RequestForm[];
  protected readonly files: Record<string, string> = {};

  constructor(private readonly router: Router) {
    const intent = readFilingIntent();
    this.measure = intent?.measure ?? '';
    this.measureLabel = measureOf(this.measure).label;
    this.forms = (intent?.codes ?? []).map((code) => formOf(code)).filter((form): form is RequestForm => !!form);
    if (!this.forms.length) {
      void this.router.navigate(['/requests'], { queryParams: { choose: '1' } });
    }
  }

  protected purpose(form: RequestForm) {
    return purposeOf(form, this.measure);
  }

  protected setFile(code: string, name: string): void {
    this.files[code] = name;
  }

  protected get canSubmit(): boolean {
    return this.forms.every((form) => !!this.files[form.code]);
  }

  protected back(): void {
    void this.router.navigate(['/requests'], { queryParams: { choose: '1', method: '1' } });
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
