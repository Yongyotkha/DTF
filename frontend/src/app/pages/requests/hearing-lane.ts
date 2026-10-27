export type HearingStep = 'ask' | 'booked' | 'approved' | 'done' | 'skip';

export type HearingLane = {
  caseCode: string;
  by: string;
  ask: string;
  step: HearingStep;
  when: string;
  place: string;
  summary: string;
};

const key = 'dft-hearing-lane';

export function readHearing(): HearingLane | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(key) || 'null') as HearingLane | null;
    if (!value || typeof value.ask !== 'string' || !value.caseCode) return null;
    return value;
  } catch {
    return null;
  }
}

export function writeHearing(value: HearingLane | null): void {
  if (!value) sessionStorage.removeItem(key);
  else sessionStorage.setItem(key, JSON.stringify(value));
}

export function hearingStatus(step: HearingStep): string {
  if (step === 'ask') return 'ส่งคำขอ hearing แล้ว รอเจ้าหน้าที่นัดหรือไม่จัด';
  if (step === 'booked') return 'นัด hearing แล้ว รอคณะกรรมการอนุมัติ';
  if (step === 'approved') return 'คณะกรรมการอนุมัติแล้ว รอเจ้าหน้าที่สรุปประเด็น';
  if (step === 'done') return 'สรุปประเด็นแล้ว ส่งกลับเข้าผล';
  return 'ไม่จัด hearing ส่งกลับเข้าผล';
}
