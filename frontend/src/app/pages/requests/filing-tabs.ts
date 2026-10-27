import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { formCodeIn } from './case-form';
import { purposeOf, requestForms, type RequestForm } from './form-catalog';
import { readFilingIntent } from './filing-intent';
import { findListedCase } from './request-cases';

@Component({
  selector: 'app-filing-tabs',
  templateUrl: './filing-tabs.html',
  styleUrl: './filing-tabs.css',
})
export class FilingTabs {
  protected readonly forms: RequestForm[];
  protected readonly selected: number;
  private readonly measure: string;
  private readonly path: string;
  private readonly viewQuery: { case: string; view: string } | null;
  private readonly subsidyQuery: { measure: string } | null;

  constructor(private readonly router: Router) {
    const url = this.router.parseUrl(this.router.url);
    const caseCode = String(url.queryParams['case'] ?? '');
    const viewing = url.queryParams['view'] === '1' && /^[A-Za-z0-9]+$/.test(caseCode);
    this.viewQuery = viewing ? { case: caseCode, view: '1' } : null;
    const measure = url.queryParams['measure'];
    this.subsidyQuery = measure === 'cvd' || measure === 'ad' ? { measure } : null;
    this.path = this.router.url.split('?')[0];
    if (viewing) {
      const item = findListedCase(caseCode);
      const codes = new Set((item?.documents ?? []).map((file) => formCodeIn(file)).filter((code): code is string => !!code));
      this.measure = '';
      this.forms = requestForms.filter((form) => codes.has(form.code) && !!form.route);
    } else {
      const intent = readFilingIntent();
      const chosen = new Set(intent?.codes ?? []);
      this.measure = intent?.measure ?? '';
      this.forms = requestForms.filter((form) => chosen.has(form.code) && !!form.route);
    }
    const index = this.forms.findIndex((form) => form.route === this.path);
    this.selected = index < 0 ? 0 : index;
  }

  protected name(form: RequestForm): string {
    return purposeOf(form, this.measure).label;
  }

  protected get shown(): boolean {
    return this.forms.length > 1 && this.forms.some((form) => form.route === this.path);
  }

  protected open(index: number): void {
    const route = this.forms[index]?.route;
    if (!route || route === this.path) return;
    const params = { ...(this.viewQuery ?? {}), ...(this.subsidyQuery ?? {}) };
    const go = Object.keys(params).length
      ? this.router.navigate([route], { queryParams: params })
      : this.router.navigateByUrl(route);
    void go.then(() => window.scrollTo(0, 0));
  }
}
