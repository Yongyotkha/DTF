import { StatusTone } from '../../status-tag/status-tag';

export type CaseStatus = 'draft' | 'review' | 'cancelled';

const key = 'dft-por1-case';

/** เลขที่อ้างอิงระหว่างยื่นคำขอ ยังไม่ใช่เลข Case ID */
export const filingRefId = 'REF256205150001';

export function readCaseStatus(): CaseStatus {
  const value = sessionStorage.getItem(key);
  if (value === 'review' || value === 'cancelled') return value;
  return 'draft';
}

export function writeCaseStatus(status: CaseStatus): void {
  sessionStorage.setItem(key, status);
}

export function caseStatusLabel(status: CaseStatus): string {
  if (status === 'review') return 'ตรวจสอบคำขอ';
  if (status === 'cancelled') return 'ยกเลิก';
  return 'ร่าง';
}

export function caseStatusTone(status: CaseStatus): StatusTone {
  if (status === 'review') return 'info';
  if (status === 'cancelled') return 'danger';
  return 'neutral';
}
