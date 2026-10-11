import { StatusTone } from '../../status-tag/status-tag';

export type CaseStatus = 'draft' | 'review' | 'revision' | 'consult' | 'approval' | 'official' | 'cancelled';

const key = 'dft-por1-case';
const roundsKey = 'dft-por1-rounds';
const reviewUntilKey = 'dft-por1-review-until';
const approvalUntilKey = 'dft-por1-approval-until';
const consultKey = 'dft-por1-consult';

export type ConsultRequest = { topic: string; detail: string; when: string };
export type ConsultNote = {
  from: 'applicant' | 'officer';
  text: string;
  at: string;
  files?: { name: string; image?: string }[];
};

const threadKey = 'dft-por1-consult-thread';

/** ระยะรอผลตรวจสอบหลังยื่นแต่ละครั้ง */
export const reviewWaitMs = 60_000;

export type RoundState = 'review' | 'revision';
export type RoundFinding = { place: string; title: string; detail: string; action: 'เพิ่มเอกสาร' | 'ปรับข้อมูล' };
export type RoundFile = { group: string; name: string; saved: string };
export type FilingRound = {
  round: number;
  submittedOn: string;
  state: RoundState;
  company: string;
  measure: string;
  signer: string;
  files: RoundFile[];
  findings: RoundFinding[];
};

/** เลขที่อ้างอิงระหว่างยื่นคำขอ ยังไม่ใช่เลข Case ID */
export const filingRefId = 'REF256205150001';

/** หน่วยงานที่รับผิดชอบคำขอต้นแบบนี้ หลังมอบหมายแล้วผู้ยื่นเห็นชื่อนี้ */
export const filingUnit = 'กองปกป้องและตอบโต้ทางการค้า';
export const filingOfficer = 'เจ้าหน้าที่ผู้รับผิดชอบคำขอ';

export function readCaseStatus(): CaseStatus {
  const value = sessionStorage.getItem(key);
  if (value === 'review' || value === 'revision' || value === 'consult' || value === 'approval' || value === 'official' || value === 'cancelled') return value;
  return 'draft';
}

export function writeCaseStatus(status: CaseStatus): void {
  sessionStorage.setItem(key, status);
}

export function caseStatusLabel(status: CaseStatus): string {
  if (status === 'review') return 'อยู่ระหว่างตรวจสอบ';
  if (status === 'revision') return 'กรุณาแก้ไขข้อมูล';
  if (status === 'consult') return 'รอนัดพบเจ้าหน้าที่';
  if (status === 'approval') return 'รอเจ้าหน้าที่อนุมัติ';
  if (status === 'official') return 'ยื่นแบบ';
  if (status === 'cancelled') return 'ยกเลิก';
  return 'ร่าง';
}

export function readRounds(): FilingRound[] {
  try {
    const value = JSON.parse(sessionStorage.getItem(roundsKey) || '[]') as FilingRound[];
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function writeRounds(rounds: FilingRound[]): void {
  sessionStorage.setItem(roundsKey, JSON.stringify(rounds));
}

export function readReviewUntil(): number {
  const value = Number(sessionStorage.getItem(reviewUntilKey) || '0');
  return Number.isFinite(value) ? value : 0;
}

export function writeReviewUntil(at: number): void {
  if (at > 0) sessionStorage.setItem(reviewUntilKey, String(at));
  else sessionStorage.removeItem(reviewUntilKey);
}

export function readApprovalUntil(): number {
  const value = Number(sessionStorage.getItem(approvalUntilKey) || '0');
  return Number.isFinite(value) ? value : 0;
}

export function writeApprovalUntil(at: number): void {
  if (at > 0) sessionStorage.setItem(approvalUntilKey, String(at));
  else sessionStorage.removeItem(approvalUntilKey);
}

export function readConsult(): ConsultRequest | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(consultKey) || 'null') as ConsultRequest | null;
    if (!value || !value.topic) return null;
    return value;
  } catch {
    return null;
  }
}

export function writeConsult(request: ConsultRequest | null): void {
  if (!request) sessionStorage.removeItem(consultKey);
  else sessionStorage.setItem(consultKey, JSON.stringify(request));
}

export function readConsultThread(): ConsultNote[] {
  try {
    const value = JSON.parse(sessionStorage.getItem(threadKey) || '[]') as ConsultNote[];
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function writeConsultThread(notes: ConsultNote[]): void {
  if (!notes.length) sessionStorage.removeItem(threadKey);
  else sessionStorage.setItem(threadKey, JSON.stringify(notes));
}

/** เริ่มคำขอต้นแบบใหม่จากหน้าเลือกแบบฟอร์ม */
export function startFilingCase(): void {
  writeCaseStatus('draft');
  writeRounds([]);
  writeReviewUntil(0);
  writeApprovalUntil(0);
  writeConsult(null);
  writeConsultThread([]);
}

export function caseStatusTone(status: CaseStatus): StatusTone {
  if (status === 'review' || status === 'consult' || status === 'approval') return 'info';
  if (status === 'revision') return 'warning';
  if (status === 'official') return 'success';
  if (status === 'cancelled') return 'danger';
  return 'neutral';
}
