/**
 * การแจ้งและตอบกลับแบบสอบถามรายราย ใช้ร่วมกันสองมุมมอง
 * - ผู้ตอบที่มีบัญชีในระบบ: ได้รับแจ้งและตอบกลับในระบบ
 * - ผู้ตอบที่ไม่สะดวกใช้ระบบ: เจ้าหน้าที่แจ้งนอกระบบ แล้วอัปโหลดไฟล์ที่ได้รับกลับเข้าเคส
 * เก็บใน localStorage ให้หน้าเจ้าหน้าที่กับหน้าผู้มีส่วนได้เสียเห็นข้อมูลชุดเดียวกัน
 */
export type QnParty = 'importer' | 'domestic' | 'exporter';
export type QnVia = 'system' | 'outside';
export type QnStep = 'send' | 'extend-ask' | 'extend-grant' | 'extend-deny' | 'reply' | 'revise' | 'accept';
export type QnState = 'draft' | 'waiting' | 'extend' | 'replied' | 'revise' | 'done';

export type QnEvent = {
  id: string;
  step: QnStep;
  by: 'officer' | 'stakeholder';
  via: QnVia;
  at: string;
  note: string;
  files: string[];
  /** วันครบกำหนดใหม่ที่เกิดจากการส่ง ขอปรับปรุง หรืออนุมัติขยายเวลา */
  due?: string;
  /** ช่องทางที่ใช้เมื่อแจ้งนอกระบบ เช่น ไปรษณีย์ อีเมล */
  medium?: string;
};

export type QnThread = {
  id: string;
  caseId: string;
  party: QnParty;
  name: string;
  /** เลขบัญชีผู้ใช้ในระบบ ว่าง = ยังไม่มีบัญชี แจ้งได้เฉพาะนอกระบบ */
  username: string;
  via: QnVia;
  dueOn: string;
  events: QnEvent[];
};

export const qnPartyLabel: Record<QnParty, string> = {
  importer: 'ผู้นำเข้า/ผู้ใช้',
  domestic: 'อุตสาหกรรมภายใน',
  exporter: 'ผู้ส่งออก',
};

/** ผู้ตอบตัวอย่าง: แต่ละกลุ่มมีทั้งรายที่ใช้ระบบและรายที่ไม่ใช้ระบบ */
export const qnDemoRecipients: { slug: string; party: QnParty; name: string; username: string; via: QnVia }[] = [
  { slug: 'thaisteel', party: 'importer', name: 'บริษัท ไทยสตีล อิมปอร์ต จำกัด', username: '1000000000123', via: 'system' },
  { slug: 'thaweechok', party: 'importer', name: 'ทวีโชคพาณิช', username: '', via: 'outside' },
  { slug: 'ssi', party: 'domestic', name: 'บริษัท สหวิริยาสตีลอินดัสตรี จำกัด (มหาชน)', username: '1000000000127', via: 'system' },
  { slug: 'gsteel', party: 'domestic', name: 'บริษัท จี สตีล จำกัด (มหาชน)', username: '', via: 'outside' },
  { slug: 'fhs', party: 'exporter', name: 'Formosa Ha Tinh Steel Corporation (FHS)', username: '', via: 'outside' },
  { slug: 'ezdk', party: 'exporter', name: 'Al Ezz Dekheila Steel Company – Alexandria (EZDK)', username: '', via: 'outside' },
];

const key = 'dft-qn-exchange';

export function qnToday(): string {
  return qnAddDays('', 0);
}

export function qnAddDays(value: string, days: number): string {
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value.trim());
  const base = match ? new Date(Number(match[3]) - 543, Number(match[2]) - 1, Number(match[1])) : new Date();
  base.setDate(base.getDate() + days);
  return `${String(base.getDate()).padStart(2, '0')}/${String(base.getMonth() + 1).padStart(2, '0')}/${base.getFullYear() + 543}`;
}

export function readQn(): QnThread[] {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]') as QnThread[];
    return Array.isArray(value) ? value.filter((row) => row?.id && row.caseId && row.name && Array.isArray(row.events)) : [];
  } catch {
    return [];
  }
}

function writeQn(rows: QnThread[]): void {
  localStorage.setItem(key, JSON.stringify(rows));
}

export function qnForCase(caseId: string): QnThread[] {
  return readQn().filter((row) => row.caseId === caseId);
}

/** รายการที่ผู้ใช้คนนี้ต้องตอบในระบบ ไม่รวมรายที่ยังไม่ส่งและรายที่เจ้าหน้าที่แจ้งนอกระบบ */
export function qnForUser(username: string): QnThread[] {
  if (!username) return [];
  return readQn().filter((row) => row.username === username && row.via === 'system' && row.events.length > 0);
}

/** ใส่ผู้ตอบตัวอย่างของเคส ถ้าเคสนี้ยังไม่มีรายการ */
export function qnSeed(caseId: string): void {
  if (!caseId) return;
  const rows = readQn();
  if (rows.some((row) => row.caseId === caseId)) return;
  const added: QnThread[] = qnDemoRecipients.map((row) => ({
    id: `${caseId}:${row.slug}`,
    caseId,
    party: row.party,
    name: row.name,
    username: row.username,
    via: row.via,
    dueOn: '',
    events: [],
  }));
  writeQn([...rows, ...added]);
}

export function qnReset(caseId: string): void {
  writeQn(readQn().filter((row) => row.caseId !== caseId));
}

export function qnSetVia(id: string, via: QnVia): void {
  writeQn(readQn().map((row) => (row.id === id && !row.events.length ? { ...row, via: via === 'system' && !row.username ? 'outside' : via } : row)));
}

export type QnAct = { step: QnStep; by: QnEvent['by']; via: QnVia; at: string; note: string; files?: string[]; due?: string; medium?: string };

export function qnAct(id: string, act: QnAct): void {
  const rows = readQn().map((row) => {
    if (row.id !== id) return row;
    const event: QnEvent = {
      id: `${id}:${row.events.length + 1}`,
      step: act.step,
      by: act.by,
      via: act.via,
      at: act.at,
      note: act.note,
      files: act.files ?? [],
      ...(act.due ? { due: act.due } : {}),
      ...(act.medium ? { medium: act.medium } : {}),
    };
    return {
      ...row,
      via: act.step === 'send' ? act.via : row.via,
      dueOn: act.due && ['send', 'revise', 'extend-grant'].includes(act.step) ? act.due : row.dueOn,
      events: [...row.events, event],
    };
  });
  writeQn(rows);
}

export function qnState(row: QnThread): QnState {
  const last = row.events.at(-1);
  if (!last) return 'draft';
  const lastAt = (step: QnStep) => row.events.map((event) => event.step).lastIndexOf(step);
  if (last.step === 'accept') return 'done';
  if (last.step === 'reply') return 'replied';
  if (last.step === 'extend-ask') return 'extend';
  return lastAt('revise') > lastAt('reply') ? 'revise' : 'waiting';
}

export function qnStateLabel(state: QnState): string {
  if (state === 'draft') return 'ยังไม่ส่ง';
  if (state === 'waiting') return 'รอตอบ';
  if (state === 'revise') return 'รอตอบฉบับปรับปรุง';
  if (state === 'extend') return 'ขอขยายเวลา รอพิจารณา';
  if (state === 'replied') return 'ตอบแล้ว รอตรวจ';
  return 'ผ่านแล้ว';
}

export function qnStateTone(state: QnState): 'success' | 'warning' | 'info' | 'neutral' {
  if (state === 'done') return 'success';
  if (state === 'draft') return 'neutral';
  if (state === 'replied') return 'info';
  return 'warning';
}

export function qnStepLabel(step: QnStep): string {
  if (step === 'send') return 'ส่งแบบสอบถาม';
  if (step === 'extend-ask') return 'ขอขยายเวลา';
  if (step === 'extend-grant') return 'อนุมัติขยายเวลา';
  if (step === 'extend-deny') return 'ไม่อนุมัติขยายเวลา';
  if (step === 'reply') return 'ส่งคำตอบ';
  if (step === 'revise') return 'ขอให้ปรับปรุง';
  return 'ตรวจแล้วผ่าน';
}

export function qnViaLabel(via: QnVia): string {
  return via === 'system' ? 'ในระบบ' : 'นอกระบบ';
}

/** ผู้ทำรายการ เช่น "เจ้าหน้าที่ · ในระบบ" หรือ "เจ้าหน้าที่บันทึกแทน · ไปรษณีย์" */
export function qnWho(event: QnEvent): string {
  if (event.via === 'system') return event.by === 'officer' ? 'เจ้าหน้าที่ · ในระบบ' : 'ผู้ตอบ · ในระบบ';
  return `เจ้าหน้าที่บันทึก · นอกระบบ${event.medium ? ` (${event.medium})` : ''}`;
}

export const qnFormRoot = 'assets/samples/ad1046/qn/';
