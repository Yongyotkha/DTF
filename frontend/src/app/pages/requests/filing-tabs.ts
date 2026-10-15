import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { purposeOf, requestForms, type RequestForm } from './form-catalog';
import { readFilingIntent } from './filing-intent';

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

  constructor(private readonly router: Router) {
    const intent = readFilingIntent();
    const chosen = new Set(intent?.codes ?? []);
    this.measure = intent?.measure ?? '';
    this.forms = requestForms.filter((form) => chosen.has(form.code) && !!form.route);
    this.path = this.router.url.split('?')[0];
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
    void this.router.navigateByUrl(route).then(() => window.scrollTo(0, 0));
  }
}
