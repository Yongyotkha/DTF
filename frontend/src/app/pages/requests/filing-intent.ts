import { Router } from '@angular/router';
import { inject } from '@angular/core';
import { requestMeasures } from './form-catalog';

const key = 'dft-filing-intent';

export type FilingIntent = {
  measure: string;
  codes: readonly string[];
};

export function saveFilingIntent(intent: FilingIntent): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(intent));
  } catch {
    /* private browsing */
  }
}

export function readFilingIntent(): FilingIntent | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const value = JSON.parse(raw) as FilingIntent;
    if (!value?.measure || !Array.isArray(value.codes)) return null;
    return value;
  } catch {
    return null;
  }
}

export function clearFilingIntent(): void {
  try {
    sessionStorage.removeItem(key);
  } catch {
    /* private browsing */
  }
}

export function cvdChosen(): boolean {
  const router = inject(Router);
  return router.parseUrl(router.url).queryParams['measure'] === 'cvd';
}

export function filingMeasureTitle(fallback = 'มาตราการ AD'): string {
  const measure = readFilingIntent()?.measure || fallback;
  const label = requestMeasures.find((item) => item.value === measure)?.label ?? 'การทุ่มตลาด (AD)';
  return `ยื่นคำขอ ${label}`;
}

export function goToFormUpload(router: Router, code: string): void {
  const intent = readFilingIntent();
  const measure = intent?.measure || 'มาตราการ AD';
  const codes = intent?.codes?.length ? [...intent.codes] : [code];
  saveFilingIntent({ measure, codes });
  void router.navigateByUrl('/requests/upload', { state: { measure, codes } });
}
