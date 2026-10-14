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
