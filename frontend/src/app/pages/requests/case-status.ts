import { StatusTone } from '../../status-tag/status-tag';
import { groupHead } from '../staff/staff-roster';

/** Re-export case lifecycle catalog for staff / por1 consumers */
export {
  canonicalStages,
  createEditionProgress,
  stagesForEdition,
  stagesOnUiTab,
  inquiryStepToCanonical,
  prelimStepToCanonical,
  draftStepToCanonical,
  finalStepToCanonical,
  attachmentTypes,
  partyRoles,
  sampleEditions,
} from './canonical-stages';
export type {
  CaseRecord,
  EditionRecord,
  EditionType,
  StageDef,
  StageProgress,
  StageStatus,
  UiReviewTab,
} from './canonical-stages';

export type CaseStatus = 'draft' | 'review' | 'revision' | 'consult' | 'approval' | 'official' | 'cancelled';

const key = 'dft-por1-case';
const filerKey = 'dft-por1-filer';
const roundsKey = 'dft-por1-rounds';
const reviewUntilKey = 'dft-por1-review-until';
const approvalUntilKey = 'dft-por1-approval-until';
const approvedByKey = 'dft-por1-approved-by';
const consultKey = 'dft-por1-consult';
const consultJobKey = 'dft-por1-consult-jobs';
const filingGateKey = 'dft-por1-filing-gate';

export type ConsultWay = 'phone' | 'online' | 'onsite';
export type ConsultSlot = { date: string; time: string; endTime: string };
export type ConsultRequest = {
  topic: string;
  detail: string;
  when: string;
  slots?: ConsultSlot[];
  channel?: ConsultWay;
  contactName?: string;
  contactPhone?: string;
  by?: string;
  at?: string;
};

export const minConsultSlots = 3;
export const maxConsultSlots = 8;

export function defaultConsultSlots(): ConsultSlot[] {
  const shift = (days: number): string => {
    const now = new Date();
    now.setDate(now.getDate() + days);
    return `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear() + 543}`;
  };
  return [
    { date: shift(1), time: '09:00', endTime: '10:00' },
    { date: shift(2), time: '13:00', endTime: '14:00' },
    { date: shift(3), time: '15:00', endTime: '16:00' },
  ];
}

export function nextConsultSlot(slots: ConsultSlot[]): ConsultSlot {
  const shift = (days: number): string => {
    const now = new Date();
    now.setDate(now.getDate() + days);
    return `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear() + 543}`;
  };
  return { date: shift(slots.length + 1), time: '10:00', endTime: '11:00' };
}

export function normalizeConsultSlot(slot: Partial<ConsultSlot> | null | undefined): ConsultSlot {
  return {
    date: slot?.date?.trim() || '',
    time: slot?.time?.trim() || '',
    endTime: slot?.endTime?.trim() || '',
  };
}
export type ConsultNote = {
  from: 'applicant' | 'officer';
  text: string;
  at: string;
  files?: { name: string; image?: string }[];
};

/** ผลแจ้งผู้ยื่น/ผู้ขอ จากงานขอคำปรึกษาหรืองานอื่น */
export type ApplicantNotice = {
  id: string;
  kind: string;
  text: string;
  by: string;
  at: string;
};

const threadKey = 'dft-por1-consult-thread';
const noticeKey = 'dft-por1-applicant-notices';
const assignKey = 'dft-por1-consult-assigned';
const planKey = 'dft-por1-consult-plan';
const rosterKey = 'dft-por1-assignees';
const etrKey = 'dft-por1-etr';
const linksKey = 'dft-por1-links';
const docKey = 'dft-por1-doc-notice';
const noteKey = 'dft-por1-notes';
const noteReadKey = 'dft-por1-note-reads';
const laterPhaseKey = 'dft-por1-later-phase';
const workDraftKey = 'dft-por1-work-drafts';
const madeDocKey = 'dft-por1-made-docs';
const flowFileKey = 'dft-por1-flow-file';

/** เลข Ref Case ID (eTR) ที่ระบบ eTR ส่งกลับ ยังไม่ใช่เลข Case ID ของคดี */
export type EtrLink = {
  caseId: string;
  saraban: string;
  sentBy: string;
  sentAt: string;
  backAt: string;
};

/** หนึ่งรายการในประวัติเชื่อมโยงระบบ */
export type SystemLink = {
  id: string;
  at: string;
  system: string;
  title: string;
  detail: string;
  state: 'success' | 'error' | 'wait';
  mode: 'auto' | 'retry' | 'manual';
  refNo: string;
  error: string;
  log: { at: string; text: string }[];
};

export type AssignReply = 'pending' | 'accept' | 'return';

export type PersonHand = { name: string; group: string; reply: AssignReply; reason: string };

/** ผอ. มอบหมายให้หัวหน้ากลุ่มได้มากกว่า 1 กลุ่ม แล้วหัวหน้ากลุ่มส่งต่อรายบุคคลในกลุ่มนั้น */
export type GroupTask = { group: string; head: string; reply: AssignReply; reason: string };

export type AssignFile = { name: string; title: string };

/** ใบมอบหมายหนึ่งขั้น ผู้รับเห็นใบที่ส่งถึงตนเอง */
export type AssignSlip = {
  at: string;
  from: string;
  to: string;
  group: string;
  receipt: 'accept' | 'return';
  kind: 'report' | 'forward';
  assignedOn: string;
  dueOn: string;
  dueTime: string;
  remind: boolean;
  order: string;
  files: AssignFile[];
};

export type WorkAssignment = {
  people: string[];
  groups: string[];
  note: string;
  order: string;
  assignedOn: string;
  dueOn: string;
  reply: AssignReply;
  reason: string;
  groupTasks: GroupTask[];
  hands: PersonHand[];
  slips: AssignSlip[];
};

export type OfficeEvent = { at: string; text: string };
export type OfficeLink = { no: string; at: string; events: OfficeEvent[] };

export type ReceiptRecord = {
  deptNo: string;
  deptDate: string;
  deptTime: string;
  sarabanNo: string;
  sarabanDate: string;
  sarabanTime: string;
  letterNo: string;
  letterDate: string;
  subject: string;
  links: OfficeLink[];
};

const receiptKey = 'dft-por1-receipt';

export type ConsultChannel = 'chat' | 'phone' | 'email' | 'other';
export type ConsultPlan = {
  channels: ConsultChannel[];
  phone: string;
  email: string;
  other: string;
};

/** ระยะรอผลตรวจสอบหลังยื่นแต่ละครั้ง */
export const reviewWaitMs = 10_000;

export type RoundState = 'review' | 'revision';
export type RoundFinding = { place: string; title: string; detail: string; action: 'เพิ่มเอกสาร' | 'ปรับข้อมูล' };
export type RoundFile = { group: string; name: string; saved: string };
export type RoundAnswer = { group: string; label: string; value: string };
export type FilingRound = {
  round: number;
  submittedOn: string;
  /** ชื่อโฟลเดอร์รอบยื่น แบบแฟ้มจริง เช่น 1. 15 พค 63 */
  folder?: string;
  state: RoundState;
  company: string;
  measure: string;
  signer: string;
  files: RoundFile[];
  findings: RoundFinding[];
  answers?: RoundAnswer[];
};

/** เลขที่อ้างอิงเคส รูปแบบ R6201 รันต่อเนื่อง (R6201, R6202, …) */
export function formatFilingRef(seq: number): string {
  return `R${seq}`;
}

export const filingRefStart = 6201;
export const filingRefId = formatFilingRef(filingRefStart);

const activeRefKey = 'dft-por1-ref';
const refSeqKey = 'dft-filing-ref-seq';

export function parseFilingRefSeq(ref: string): number | null {
  const match = /^R(\d+)$/i.exec(ref.trim());
  if (!match) return null;
  const seq = Number(match[1]);
  return Number.isFinite(seq) ? seq : null;
}

/** ค่าถัดไปที่จะออกเลขใหม่ (ยังไม่จอง) */
export function peekNextFilingRefSeq(): number {
  if (typeof sessionStorage === 'undefined') return filingRefStart + 1;
  const raw = Number(sessionStorage.getItem(refSeqKey) || '');
  if (Number.isFinite(raw) && raw > filingRefStart) return raw;
  return filingRefStart + 1;
}

/** จองเลขถัดไปแล้วคืนค่า เช่น R6202 */
export function nextFilingRefId(): string {
  const seq = peekNextFilingRefSeq();
  if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(refSeqKey, String(seq + 1));
  return formatFilingRef(seq);
}

/** ดันตัวนับให้สูงกว่าเลขที่ใช้อยู่แล้ว (หลัง seed รายการเคส) */
export function ensureFilingRefSeqAtLeast(seq: number): void {
  if (typeof sessionStorage === 'undefined') return;
  if (!Number.isFinite(seq) || seq < filingRefStart) return;
  const next = peekNextFilingRefSeq();
  if (seq + 1 > next) sessionStorage.setItem(refSeqKey, String(seq + 1));
}

export function readActiveFilingRef(): string {
  if (typeof sessionStorage === 'undefined') return filingRefId;
  return sessionStorage.getItem(activeRefKey)?.trim() || filingRefId;
}

export function writeActiveFilingRef(ref: string): void {
  if (typeof sessionStorage === 'undefined') return;
  const id = ref.trim();
  if (!id) sessionStorage.removeItem(activeRefKey);
  else sessionStorage.setItem(activeRefKey, id);
}

/** วันที่ยื่นคำขอครั้งแรกของคำขอต้นแบบนี้ */
export const firstFiledOn = '15/05/2563';

/** วันที่ยื่นแบบทางการ (สถานะยื่นแบบ) — จุดเริ่มนับกำหนด 4 เดือน */
const officialOnKey = 'dft-por1-official-on';

export function readOfficialOn(): string {
  if (typeof sessionStorage === 'undefined') return '';
  const value = sessionStorage.getItem(officialOnKey)?.trim() || '';
  return /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(value) ? value : '';
}

export function writeOfficialOn(value: string): void {
  if (typeof sessionStorage === 'undefined') return;
  const day = value.trim().split(' ')[0] || '';
  if (!/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(day)) sessionStorage.removeItem(officialOnKey);
  else sessionStorage.setItem(officialOnKey, day);
}

/** นับเดือนจากวันที่แบบ วว/ดด/ปปปป โดยไม่ข้ามวันสิ้นเดือน */
export function addThaiMonths(value: string, months: number): string {
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value.trim());
  if (!match) return '';
  const day = Number(match[1]);
  const startMonth = Number(match[2]) - 1;
  const yearText = Number(match[3]);
  const christian = yearText > 2400 ? yearText - 543 : yearText;
  const shifted = startMonth + months;
  const nextYear = christian + Math.floor(shifted / 12);
  const nextMonth = ((shifted % 12) + 12) % 12;
  const lastDay = new Date(nextYear, nextMonth + 1, 0).getDate();
  const nextDay = Math.min(day, lastDay);
  const shownYear = yearText > 2400 ? nextYear + 543 : nextYear;
  return `${String(nextDay).padStart(2, '0')}/${String(nextMonth + 1).padStart(2, '0')}/${shownYear}`;
}

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

export function readFilingFiler(): string {
  return sessionStorage.getItem(filerKey)?.trim() || '';
}

export function writeFilingFiler(username: string): void {
  const id = username.trim();
  if (!id) sessionStorage.removeItem(filerKey);
  else sessionStorage.setItem(filerKey, id);
}

/** คำปรึกษาที่ปิดแล้วและยื่นแบบแล้ว ส่งกลับผู้อำนวยการให้มอบหมายรอบใหม่ */
export function releaseFilingToDirector(): boolean {
  if (sessionStorage.getItem('dft-por1-filing-assign') === 'open') return false;
  if (sessionStorage.getItem('dft-por1-filing-assign') === 'wait') return true;
  if (readCaseStatus() !== 'official') return false;
  if (readFilingGate()?.state === 'pending') return false;
  let jobs: { delivery?: string }[] = [];
  try {
    const value = JSON.parse(sessionStorage.getItem(consultJobKey) || '[]') as { delivery?: string }[];
    jobs = Array.isArray(value) ? value : [];
  } catch {
    jobs = [];
  }
  const closed = !!sessionStorage.getItem('dft-por1-consult-closed');
  const settled = jobs.length > 0 && jobs.every((job) => job?.delivery === 'close' || job?.delivery === 'board');
  if (!closed && !settled) return false;
  sessionStorage.setItem('dft-por1-filing-assign', 'wait');
  sessionStorage.setItem('dft-por1-await-official', '0');
  sessionStorage.removeItem(consultJobKey);
  sessionStorage.removeItem('dft-por1-consult-closed');
  writeEofficeDirectorHandoff(null);
  return true;
}

const eofficeDirectorKey = 'dft-por1-eoffice-director';

/** มอบหมายของผู้อำนวยการทำใน e-Office แล้วดึงกลับมาแสดงในระบบนี้ */
export type EofficeDirectorHandoff = {
  state: 'idle' | 'sent' | 'assigned' | 'error';
  mode: 'auto' | 'manual';
  sentAt: string;
  pulledAt: string;
  refNo: string;
  groups: string[];
  detail: string;
  error: string;
};

export function emptyEofficeDirectorHandoff(): EofficeDirectorHandoff {
  return { state: 'idle', mode: 'auto', sentAt: '', pulledAt: '', refNo: '', groups: [], detail: '', error: '' };
}

export function readEofficeDirectorHandoff(): EofficeDirectorHandoff {
  try {
    const value = JSON.parse(sessionStorage.getItem(eofficeDirectorKey) || 'null') as Partial<EofficeDirectorHandoff> | null;
    if (!value) return emptyEofficeDirectorHandoff();
    const state = value.state === 'sent' || value.state === 'assigned' || value.state === 'error' ? value.state : 'idle';
    const mode = value.mode === 'manual' ? 'manual' : 'auto';
    return {
      state,
      mode,
      sentAt: typeof value.sentAt === 'string' ? value.sentAt : '',
      pulledAt: typeof value.pulledAt === 'string' ? value.pulledAt : '',
      refNo: typeof value.refNo === 'string' ? value.refNo : '',
      groups: Array.isArray(value.groups) ? value.groups.filter((item): item is string => typeof item === 'string' && !!item) : [],
      detail: typeof value.detail === 'string' ? value.detail : '',
      error: typeof value.error === 'string' ? value.error : '',
    };
  } catch {
    return emptyEofficeDirectorHandoff();
  }
}

export function writeEofficeDirectorHandoff(value: EofficeDirectorHandoff | null): void {
  if (!value || value.state === 'idle') sessionStorage.removeItem(eofficeDirectorKey);
  else sessionStorage.setItem(eofficeDirectorKey, JSON.stringify(value));
}

/** ส่งงานมอบหมายผู้อำนวยการเข้า e-Office (prototype) */
export function sendDirectorWorkToEoffice(opts: { at: string; mode?: 'auto' | 'manual'; reason?: string }): EofficeDirectorHandoff {
  const refNo = `EO-DIR-${filingRefId.slice(-6)}`;
  const next: EofficeDirectorHandoff = {
    state: 'sent',
    mode: opts.mode || 'auto',
    sentAt: opts.at,
    pulledAt: '',
    refNo,
    groups: [],
    detail: opts.reason?.trim() || `ส่งคำขอ ${filingRefId} ให้ผู้อำนวยการมอบหมายใน e-Office`,
    error: '',
  };
  writeEofficeDirectorHandoff(next);
  writeConsultStep('director');
  return next;
}

/** ดึงผลการมอบหมายจาก e-Office กลับมา (prototype) */
export function pullDirectorAssignFromEoffice(at: string): EofficeDirectorHandoff {
  const current = readEofficeDirectorHandoff();
  if (current.state !== 'sent' && current.state !== 'assigned' && current.state !== 'error') {
    return { ...emptyEofficeDirectorHandoff(), state: 'error', error: 'ยังไม่มีการส่งงานเข้า e-Office' };
  }
  const groups = current.groups.length ? current.groups : ['กลุ่มงานมาตรการตอบโต้การทุ่มตลาด (AD)'];
  const next: EofficeDirectorHandoff = {
    ...current,
    state: 'assigned',
    pulledAt: at,
    groups,
    detail: `e-Office มอบหมายแล้ว: ${groups.join(', ')}`,
    error: '',
  };
  writeEofficeDirectorHandoff(next);
  writeConsultStep('group');
  writeConsultGroup(groups[0] || '');
  if (sessionStorage.getItem('dft-por1-filing-assign') === 'wait') {
    sessionStorage.setItem('dft-por1-filing-assign', 'open');
  }
  return next;
}

export function readApprovedBy(): string {
  return sessionStorage.getItem(approvedByKey) || '';
}

export function writeApprovedBy(name: string): void {
  if (name) sessionStorage.setItem(approvedByKey, name);
  else sessionStorage.removeItem(approvedByKey);
}

/** ผู้ที่กดรับเรื่องแล้ว ทั้งรายบุคคลและหัวหน้ากลุ่ม */
export function acceptedAssignees(value: WorkAssignment): string[] {
  const names = [
    ...value.hands.filter((hand) => hand.reply === 'accept').map((hand) => hand.name),
    ...value.groupTasks.filter((task) => task.reply === 'accept').map((task) => task.head),
  ].filter((name) => !!name);
  return [...new Set(names)];
}

export type FilingGate = { state: 'pending' | 'rejected'; at: string; owners: string[]; by?: string; reason?: string };

export function readFilingGate(): FilingGate | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(filingGateKey) || 'null') as FilingGate | null;
    if (!value || (value.state !== 'pending' && value.state !== 'rejected') || !Array.isArray(value.owners)) return null;
    return value;
  } catch {
    return null;
  }
}

export function writeFilingGate(gate: FilingGate | null): void {
  if (!gate) sessionStorage.removeItem(filingGateKey);
  else sessionStorage.setItem(filingGateKey, JSON.stringify(gate));
}

/** เจ้าหน้าที่ที่ได้รับมอบหมายในคำขอปรึกษา หรือหัวหน้ากลุ่มถ้ากลุ่มนั้นทำงานเอง */
export function consultFilingOwners(): string[] {
  let jobs: { group?: string; officers?: { name?: string }[] }[] = [];
  try {
    const value = JSON.parse(sessionStorage.getItem(consultJobKey) || '[]') as { group?: string; officers?: { name?: string }[] }[];
    jobs = Array.isArray(value) ? value : [];
  } catch {
    jobs = [];
  }
  const names: string[] = [];
  for (const job of jobs) {
    const officers = (job.officers ?? []).map((officer) => officer.name || '').filter((name) => !!name);
    if (officers.length) names.push(...officers);
    else if (job.group) {
      const head = groupHead(job.group);
      if (head) names.push(head);
    }
  }
  return [...new Set(names)];
}

export function caseStatusLabel(status: CaseStatus): string {
  if (status === 'review') return 'อยู่ระหว่างตรวจสอบ';
  if (status === 'revision') return 'ให้แก้ไข';
  if (status === 'consult' && readFilingGate()?.state === 'rejected') return 'ยังไม่ผ่าน';
  if (status === 'consult' && !readConsultAssigned()) {
    const step = readConsultStep();
    if (step === 'receive' || step === 'forward') return 'รอเจ้าหน้าที่รับเรื่องมอบหมายให้ผู้อำนวยการ';
    if (step === 'group') return 'รอหัวหน้ากลุ่มมอบหมายเจ้าหน้าที่';
    if (step === 'director') return 'รอผู้อำนวยการมอบหมายกลุ่ม';
    return 'รอผู้อำนวยการมอบหมายกลุ่ม';
  }
  if (status === 'consult') return 'รอนัดพบเจ้าหน้าที่';
  if (status === 'approval') return readFilingGate()?.state === 'pending' ? 'ส่งมาขออนุมัติ' : 'รอผู้รับมอบหมายอนุมัติ';
  if (status === 'official') return 'ยื่นแบบ';
  if (status === 'cancelled') return 'ยกเลิก';
  return 'ร่าง';
}

/** สถานะที่ผู้ยื่นเห็นในรายการ ต้องตรงกับ badge ในหน้ารายละเอียด */
export function applicantFilingLabel(status = readCaseStatus()): { label: string; tone: StatusTone } {
  // สถานะคำขอที่ยื่น/รออนุมัติแล้ว ชนะผลตรวจเก่า — ไม่ให้แท็กค้างที่ "ให้แก้ไข"
  if (status === 'official') {
    if (sessionStorage.getItem('dft-por1-await-official') === '1') {
      return { label: 'รอผู้ยื่นยื่นแบบทางการ', tone: 'warning' };
    }
    return { label: caseStatusLabel(status), tone: caseStatusTone(status) };
  }
  if (status === 'approval') {
    return { label: caseStatusLabel(status), tone: caseStatusTone(status) };
  }
  const flow = readFlowFile();
  if (flow?.state === 'fix') return { label: 'ให้แก้ไข', tone: 'warning' };
  if (flow?.state === 'checking' || flow?.state === 'receive') return { label: 'ตรวจสอบคำขอ', tone: 'info' };
  if (sessionStorage.getItem('dft-por1-await-official') === '1') return { label: 'รอผู้ยื่นยื่นแบบทางการ', tone: 'warning' };
  return { label: caseStatusLabel(status), tone: caseStatusTone(status) };
}

/** สถานะชั้นเสริม (ปรึกษา / อนุมัติยื่นแบบ) แสดงคู่กับสถานะคำขอ */
export function applicantOptionTags(status = readCaseStatus()): { label: string; tone: StatusTone }[] {
  const tags: { label: string; tone: StatusTone }[] = [];
  const main = applicantFilingLabel(status).label;
  const gate = readFilingGate();
  if (gate?.state === 'pending' && main !== 'ส่งมาขออนุมัติ') tags.push({ label: 'รออนุมัติยื่นแบบ', tone: 'info' });
  if (gate?.state === 'rejected') tags.push({ label: 'ยื่นแบบยังไม่ผ่าน', tone: 'danger' });
  if (sessionStorage.getItem('dft-por1-await-official') === '1' && main !== 'รอผู้ยื่นยื่นแบบทางการ') {
    tags.push({ label: 'รอผู้ยื่นยื่นแบบทางการ', tone: 'warning' });
  }
  const open = openConsultRound(readConsultRounds());
  if (open) {
    const assigned = open.assigned || readConsultAssigned();
    tags.push({
      label: assigned ? `ปรึกษา รอบ #${open.no}` : `รอรับปรึกษา #${open.no}`,
      tone: 'info',
    });
  } else if (sessionStorage.getItem('dft-por1-need-consult') === '1') {
    tags.push({ label: 'แนะนำขอปรึกษาใหม่', tone: 'warning' });
  }
  return tags.filter((tag) => tag.label !== main);
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
  syncActiveRoundRequest(request);
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
  syncActiveRoundNotes(notes);
}

/** บันทึกส่วนตัวในรอบปรึกษา — เห็นเฉพาะผู้เขียน */
export type ConsultPrivateNote = {
  id: string;
  at: string;
  authorId: string;
  author: string;
  text: string;
};

/** หนึ่งรอบขอปรึกษา (แชท + สรุป + note ส่วนตัว) */
export type ConsultRound = {
  id: string;
  no: number;
  request: ConsultRequest;
  notes: ConsultNote[];
  privateNotes: ConsultPrivateNote[];
  assigned: boolean;
  status: 'open' | 'closed';
  closedAt: string;
};

const consultRoundsKey = 'dft-por1-consult-rounds';

function parseConsultRounds(raw: unknown): ConsultRound[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item, index) => {
    if (!item || typeof item !== 'object') return [];
    const row = item as Partial<ConsultRound>;
    const request = row.request && typeof row.request.topic === 'string' ? row.request : null;
    if (!request?.topic) return [];
    const notes = Array.isArray(row.notes) ? row.notes.filter((note): note is ConsultNote => !!note && (note.from === 'applicant' || note.from === 'officer') && typeof note.at === 'string') : [];
    const privateNotes = Array.isArray(row.privateNotes)
      ? row.privateNotes.flatMap((note) => {
          if (!note || typeof note.id !== 'string' || typeof note.text !== 'string' || !note.text.trim()) return [];
          return [{
            id: note.id,
            at: typeof note.at === 'string' ? note.at : '',
            authorId: typeof note.authorId === 'string' ? note.authorId : '',
            author: typeof note.author === 'string' && note.author ? note.author : 'ผู้ใช้',
            text: note.text.trim(),
          }];
        })
      : [];
    return [{
      id: typeof row.id === 'string' && row.id ? row.id : `consult-round-${index + 1}`,
      no: typeof row.no === 'number' && row.no > 0 ? row.no : index + 1,
      request,
      notes,
      privateNotes,
      assigned: !!row.assigned,
      status: row.status === 'closed' ? 'closed' : 'open',
      closedAt: typeof row.closedAt === 'string' ? row.closedAt : '',
    }];
  });
}

function migrateConsultRounds(): ConsultRound[] {
  const legacy = readConsult();
  if (!legacy) return [];
  const notes = readConsultThread();
  const closed = !!sessionStorage.getItem('dft-por1-consult-closed');
  let closedAt = '';
  try {
    const value = JSON.parse(sessionStorage.getItem('dft-por1-consult-closed') || 'null') as { at?: string } | null;
    closedAt = value?.at || '';
  } catch {
    closedAt = '';
  }
  const round: ConsultRound = {
    id: 'consult-round-1',
    no: 1,
    request: legacy,
    notes,
    privateNotes: [],
    assigned: readConsultAssigned(),
    status: closed ? 'closed' : 'open',
    closedAt,
  };
  writeConsultRounds([round]);
  return [round];
}

export function readConsultRounds(): ConsultRound[] {
  try {
    const raw = sessionStorage.getItem(consultRoundsKey);
    if (!raw) return migrateConsultRounds();
    const rounds = parseConsultRounds(JSON.parse(raw));
    return rounds.length ? rounds : migrateConsultRounds();
  } catch {
    return migrateConsultRounds();
  }
}

export function writeConsultRounds(rounds: ConsultRound[]): void {
  if (!rounds.length) sessionStorage.removeItem(consultRoundsKey);
  else sessionStorage.setItem(consultRoundsKey, JSON.stringify(rounds));
}

export function activeConsultRound(rounds = readConsultRounds()): ConsultRound | null {
  return [...rounds].reverse().find((round) => round.status === 'open') || rounds.at(-1) || null;
}

export function openConsultRound(rounds: ConsultRound[]): ConsultRound | null {
  return [...rounds].reverse().find((round) => round.status === 'open') || null;
}

function syncActiveRoundRequest(request: ConsultRequest | null): void {
  const rounds = readConsultRounds();
  if (!rounds.length) return;
  const open = openConsultRound(rounds);
  const target = open || rounds.at(-1);
  if (!target) return;
  if (!request) {
    writeConsultRounds(rounds.map((round) => (round.id === target.id ? { ...round, status: 'closed' as const, closedAt: round.closedAt || '' } : round)));
    return;
  }
  writeConsultRounds(rounds.map((round) => (round.id === target.id ? { ...round, request } : round)));
}

function syncActiveRoundNotes(notes: ConsultNote[]): void {
  const rounds = readConsultRounds();
  if (!rounds.length) return;
  const open = openConsultRound(rounds);
  const target = open || rounds.at(-1);
  if (!target) return;
  writeConsultRounds(rounds.map((round) => (round.id === target.id ? { ...round, notes } : round)));
}

export function upsertConsultRound(input: {
  request: ConsultRequest;
  notes?: ConsultNote[];
  assigned?: boolean;
}): ConsultRound {
  const rounds = readConsultRounds().map((round) => (
    round.status === 'open'
      ? { ...round, status: 'closed' as const, closedAt: round.closedAt || input.request.at || '' }
      : round
  ));
  const next: ConsultRound = {
    id: `consult-round-${Date.now()}`,
    no: (rounds.at(-1)?.no || 0) + 1,
    request: input.request,
    notes: input.notes || [],
    privateNotes: [],
    assigned: !!input.assigned,
    status: 'open',
    closedAt: '',
  };
  const list = [...rounds, next];
  writeConsultRounds(list);
  sessionStorage.setItem(consultKey, JSON.stringify(input.request));
  if (!next.notes.length) sessionStorage.removeItem(threadKey);
  else sessionStorage.setItem(threadKey, JSON.stringify(next.notes));
  sessionStorage.setItem(assignKey, next.assigned ? '1' : '0');
  return next;
}

export function patchConsultRound(id: string, patch: Partial<ConsultRound>): ConsultRound[] {
  const rounds = readConsultRounds().map((round) => (round.id === id ? { ...round, ...patch, id: round.id, no: round.no } : round));
  writeConsultRounds(rounds);
  const active = openConsultRound(rounds) || rounds.find((round) => round.id === id) || rounds.at(-1) || null;
  if (active) {
    sessionStorage.setItem(consultKey, JSON.stringify(active.request));
    if (!active.notes.length) sessionStorage.removeItem(threadKey);
    else sessionStorage.setItem(threadKey, JSON.stringify(active.notes));
    sessionStorage.setItem(assignKey, active.assigned ? '1' : '0');
  }
  return rounds;
}

export function closeActiveConsultRound(at: string): ConsultRound[] {
  const rounds = readConsultRounds().map((round) => (
    round.status === 'open' ? { ...round, status: 'closed' as const, closedAt: at } : round
  ));
  writeConsultRounds(rounds);
  return rounds;
}

export function readApplicantNotices(): ApplicantNotice[] {
  try {
    const value = JSON.parse(sessionStorage.getItem(noticeKey) || '[]') as ApplicantNotice[];
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function writeApplicantNotices(notes: ApplicantNotice[]): void {
  if (!notes.length) sessionStorage.removeItem(noticeKey);
  else sessionStorage.setItem(noticeKey, JSON.stringify(notes));
}

export function readConsultAssigned(): boolean {
  const value = sessionStorage.getItem(assignKey);
  if (value === '1') return true;
  if (value === '0') return false;
  return readConsultThread().length > 0;
}

export function consultAwaitingDirector(): boolean {
  // ชั้นปรึกษาแยกจากสถานะคำขอ — ดูจากคำขอปรึกษาที่เปิดอยู่
  return !!readConsult() && readConsultStep() === 'director' && !!openConsultRound(readConsultRounds());
}

/** ตัด e-Office ชั่วคราว — มอบหมายในระบบตาม Task Management */
export function directorWorkNeedsEoffice(): boolean {
  return false;
}

export type ConsultStep = 'receive' | 'forward' | 'director' | 'group' | 'member';

const consultStepKey = 'dft-por1-consult-step';
const consultGroupKey = 'dft-por1-consult-group';

export function readConsultStep(): ConsultStep {
  const value = sessionStorage.getItem(consultStepKey);
  if (value === 'receive' || value === 'forward' || value === 'director' || value === 'group' || value === 'member') return value;
  if (sessionStorage.getItem(assignKey) === '1') return 'member';
  return 'receive';
}

export function writeConsultStep(step: ConsultStep): void {
  sessionStorage.setItem(consultStepKey, step);
}

export function readConsultGroup(): string {
  return sessionStorage.getItem(consultGroupKey) || '';
}

export function writeConsultGroup(name: string): void {
  if (!name) sessionStorage.removeItem(consultGroupKey);
  else sessionStorage.setItem(consultGroupKey, name);
}

export function writeConsultAssigned(assigned: boolean): void {
  sessionStorage.setItem(assignKey, assigned ? '1' : '0');
  const rounds = readConsultRounds();
  if (!rounds.length) return;
  const open = openConsultRound(rounds);
  const target = open || rounds.at(-1);
  if (!target || target.assigned === assigned) return;
  writeConsultRounds(rounds.map((round) => (round.id === target.id ? { ...round, assigned } : round)));
}

export function readConsultPlan(): ConsultPlan | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(planKey) || 'null') as ConsultPlan | null;
    if (!value || !Array.isArray(value.channels) || !value.channels.length) return null;
    return value;
  } catch {
    return null;
  }
}

export function writeConsultPlan(plan: ConsultPlan | null): void {
  if (!plan) sessionStorage.removeItem(planKey);
  else sessionStorage.setItem(planKey, JSON.stringify(plan));
}

export function readWorkAssignment(): WorkAssignment {
  try {
    const value = JSON.parse(sessionStorage.getItem(rosterKey) || 'null') as WorkAssignment | null;
    if (!value) return emptyAssignment();
    return {
      people: Array.isArray(value.people) ? value.people : [],
      groups: Array.isArray(value.groups) ? value.groups : [],
      note: typeof value.note === 'string' ? value.note : '',
      order: typeof value.order === 'string' ? value.order : '',
      assignedOn: typeof value.assignedOn === 'string' ? value.assignedOn : '',
      dueOn: typeof value.dueOn === 'string' ? value.dueOn : '',
      reply: value.reply === 'accept' || value.reply === 'return' ? value.reply : 'pending',
      reason: typeof value.reason === 'string' ? value.reason : '',
      groupTasks: readGroupTasks(value),
      hands: readHands(value.hands),
      slips: readSlips(value.slips),
    };
  } catch {
    return emptyAssignment();
  }
}

function readGroupTasks(value: WorkAssignment): GroupTask[] {
  if (Array.isArray(value.groupTasks)) {
    return value.groupTasks.flatMap((item) => {
      if (!item || typeof item.group !== 'string' || !item.group) return [];
      const reply: AssignReply = item.reply === 'accept' || item.reply === 'return' ? item.reply : 'pending';
      return [{ group: item.group, head: typeof item.head === 'string' && item.head ? item.head : groupHead(item.group), reply, reason: typeof item.reason === 'string' ? item.reason : '' }];
    });
  }
  return (Array.isArray(value.groups) ? value.groups : []).flatMap((group) => {
    const head = groupHead(group);
    return head ? [{ group, head, reply: 'pending' as const, reason: '' }] : [];
  });
}

function readHands(value: unknown): PersonHand[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item.name !== 'string' || !item.name) return [];
    const reply: AssignReply = item.reply === 'accept' || item.reply === 'return' ? item.reply : 'pending';
    return [{ name: item.name, group: typeof item.group === 'string' ? item.group : '', reply, reason: typeof item.reason === 'string' ? item.reason : '' }];
  });
}

function readSlips(value: unknown): AssignSlip[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item, index) => {
    if (!item || typeof item.to !== 'string' || !item.to || typeof item.from !== 'string' || !item.from) return [];
    const files = Array.isArray(item.files)
      ? item.files.flatMap((file: { name?: string; title?: string }) => {
          if (!file || typeof file.name !== 'string' || !file.name) return [];
          return [{ name: file.name, title: typeof file.title === 'string' && file.title ? file.title : file.name }];
        })
      : [];
    return [{
      at: typeof item.at === 'string' && item.at ? item.at : String(index),
      from: item.from,
      to: item.to,
      group: typeof item.group === 'string' ? item.group : '',
      receipt: item.receipt === 'return' ? 'return' as const : 'accept' as const,
      kind: item.kind === 'report' ? 'report' as const : 'forward' as const,
      assignedOn: typeof item.assignedOn === 'string' ? item.assignedOn : '',
      dueOn: typeof item.dueOn === 'string' ? item.dueOn : '',
      dueTime: typeof item.dueTime === 'string' ? item.dueTime : '',
      remind: item.remind === true,
      order: typeof item.order === 'string' ? item.order : '',
      files,
    }];
  });
}

function emptyAssignment(): WorkAssignment {
  return {
    people: [],
    groups: [],
    note: '',
    order: '',
    assignedOn: '',
    dueOn: '',
    reply: 'pending',
    reason: '',
    groupTasks: [],
    hands: [],
    slips: [],
  };
}

export function assignmentStepLabel(value: WorkAssignment): string {
  const tasks = value.groupTasks;
  if (!tasks.length) return 'รอมอบหมาย';
  if (tasks.some((task) => task.reply === 'pending')) return 'รอหัวหน้ากลุ่ม';
  if (tasks.every((task) => task.reply === 'return')) return 'หัวหน้ากลุ่มส่งคืน';
  const open = tasks.filter((task) => task.reply === 'accept');
  const hands = value.hands.filter((hand) => open.some((task) => task.group === hand.group));
  if (!hands.length) return tasks.some((task) => task.reply === 'return') ? 'มีการส่งคืน' : 'รอส่งต่อรายบุคคล';
  if (hands.some((hand) => hand.reply === 'pending')) return 'รอรับเรื่องรายบุคคล';
  if (hands.every((hand) => hand.reply === 'accept') && tasks.every((task) => task.reply === 'accept')) return 'รับเรื่องแล้ว';
  return 'มีการส่งคืน';
}

export function assignmentStepTone(value: WorkAssignment): StatusTone {
  const tasks = value.groupTasks;
  if (tasks.some((task) => task.reply === 'return') || value.hands.some((hand) => hand.reply === 'return')) return 'danger';
  if (tasks.length > 0 && tasks.every((task) => task.reply === 'accept') && value.hands.length > 0 && value.hands.every((hand) => hand.reply === 'accept')) return 'success';
  return 'warning';
}

export function assignmentReplyLabel(reply: AssignReply): string {
  if (reply === 'accept') return 'รับเรื่องแล้ว';
  if (reply === 'return') return 'ส่งคืน';
  return 'รอรับเรื่อง';
}

export function assignmentReplyTone(reply: AssignReply): StatusTone {
  if (reply === 'accept') return 'success';
  if (reply === 'return') return 'danger';
  return 'warning';
}

export function writeWorkAssignment(value: WorkAssignment | null): void {
  if (!value || (!value.people.length && !value.groups.length)) sessionStorage.removeItem(rosterKey);
  else sessionStorage.setItem(rosterKey, JSON.stringify(value));
}

export function readReceipt(): ReceiptRecord | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(receiptKey) || 'null') as ReceiptRecord | null;
    if (!value || typeof value.sarabanNo !== 'string') return null;
    const links = Array.isArray(value.links)
      ? value.links.filter((item) => item && typeof item.no === 'string' && typeof item.at === 'string')
      : [];
    return { ...value, links };
  } catch {
    return null;
  }
}

export function writeReceipt(value: ReceiptRecord | null): void {
  if (!value) sessionStorage.removeItem(receiptKey);
  else sessionStorage.setItem(receiptKey, JSON.stringify(value));
}

export function readEtrLink(): EtrLink | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(etrKey) || 'null') as EtrLink | null;
    if (!value || typeof value.caseId !== 'string' || !value.caseId) return null;
    return {
      caseId: value.caseId,
      saraban: typeof value.saraban === 'string' ? value.saraban : '',
      sentBy: typeof value.sentBy === 'string' ? value.sentBy : '',
      sentAt: typeof value.sentAt === 'string' ? value.sentAt : '',
      backAt: typeof value.backAt === 'string' ? value.backAt : '',
    };
  } catch {
    return null;
  }
}

export function writeEtrLink(link: EtrLink | null): void {
  if (!link) sessionStorage.removeItem(etrKey);
  else sessionStorage.setItem(etrKey, JSON.stringify(link));
}

export function readSystemLinks(): SystemLink[] {
  try {
    const value = JSON.parse(sessionStorage.getItem(linksKey) || '[]') as SystemLink[];
    if (!Array.isArray(value)) return [];
    return value.flatMap((item) => {
      if (!item || typeof item.id !== 'string' || !item.id || typeof item.title !== 'string') return [];
      const state = item.state === 'error' || item.state === 'wait' ? item.state : 'success';
      const mode = item.mode === 'retry' || item.mode === 'manual' ? item.mode : 'auto';
      return [{
        id: item.id,
        at: typeof item.at === 'string' ? item.at : '',
        system: typeof item.system === 'string' && item.system ? item.system : 'eTR',
        title: item.title,
        detail: typeof item.detail === 'string' ? item.detail : '',
        state,
        mode,
        refNo: typeof item.refNo === 'string' ? item.refNo : '',
        error: typeof item.error === 'string' ? item.error : '',
        log: Array.isArray(item.log)
          ? item.log.filter((entry) => entry && typeof entry.at === 'string' && typeof entry.text === 'string')
          : [],
      }];
    });
  } catch {
    return [];
  }
}

export function writeSystemLinks(rows: SystemLink[]): void {
  if (!rows.length) sessionStorage.removeItem(linksKey);
  else sessionStorage.setItem(linksKey, JSON.stringify(rows));
}

export type DocFile = {
  name: string;
  title: string;
  sentOn: string;
  href?: string;
  /** ฉบับร่าง หรือ ฉบับสมบูรณ์ */
  edition?: 'draft' | 'final';
  /** สถานะการส่งให้ผู้ยื่น (ระดับไฟล์ — แถวจะทับด้วยท่อถ้ามี) */
  delivery?: 'pending' | 'sent';
};
export type DocAction = 'amend' | 'complete' | 'late';

/**
 * ท่ออนุมัติมาตรฐาน (Approval Lane)
 * เจ้าหน้าที่ → หัวหน้ากลุ่ม → ผู้อำนวยการ → e-Office → ประทับตรา → ออกเลข → แนบไฟล์กลับ → อนุมัติ → ส่งให้ผู้ยื่น
 */
export type ApprovalLaneStage =
  | 'draft'
  | 'to-head'
  | 'to-director'
  | 'eoffice'
  | 'stamped'
  | 'numbered'
  | 'attach'
  | 'done'
  | 'delivered'
  | 'returned'
  | 'cancelled';

/** เอกสารในท่ออนุมัติ */
export type ApprovalLaneDoc = {
  version: number;
  title: string;
  at: string;
  source: 'created' | 'ai' | 'upload' | 'numbered';
  html?: string;
  fileName?: string;
};

export type ApprovalLaneHistoryEntry = {
  at: string;
  by: string;
  action: string;
};

/** ท่ออนุมัติหนึ่งรายการ — ใช้ซ้ำได้ทุกเรื่อง (แจ้งผล / เสนออนุมัติ / ฯลฯ) */
export type ApprovalLane = {
  id: string;
  kind: string;
  title: string;
  stage: ApprovalLaneStage;
  stages: ApprovalLaneStage[];
  sarabanNo: string;
  history: ApprovalLaneHistoryEntry[];
  docs: ApprovalLaneDoc[];
};

/** ขั้นมาตรฐานเต็มท่อ */
export const APPROVAL_LANE_FULL: ApprovalLaneStage[] = [
  'draft',
  'to-head',
  'to-director',
  'eoffice',
  'stamped',
  'numbered',
  'attach',
  'done',
  'delivered',
];

/** แจ้งผลการตรวจ — เต็มท่อ */
export const NOTICE_LANE_STAGES: ApprovalLaneStage[] = [...APPROVAL_LANE_FULL];

/** เสนออนุมัติวาระ — เต็มท่อ */
export const AGENDA_APPROVAL_LANE_STAGES: ApprovalLaneStage[] = [...APPROVAL_LANE_FULL];

export function approvalLaneStageLabel(stage: ApprovalLaneStage): string {
  if (stage === 'draft') return 'ร่างเอกสาร';
  if (stage === 'to-head') return 'รอหัวหน้ากลุ่ม';
  if (stage === 'to-director') return 'รอผู้อำนวยการ';
  if (stage === 'eoffice') return 'ส่ง e-Office';
  if (stage === 'stamped') return 'ประทับตรา / ลงนาม';
  if (stage === 'numbered') return 'ออกเลขสารบรรณ';
  if (stage === 'attach') return 'แนบไฟล์ที่ออกเลขแล้ว';
  if (stage === 'done') return 'อนุมัติแล้ว';
  if (stage === 'delivered') return 'ส่งแล้ว';
  if (stage === 'returned') return 'ส่งกลับแก้ไข';
  if (stage === 'cancelled') return 'ยกเลิกแล้ว';
  return stage;
}

export function approvalLaneStageTone(
  stage: ApprovalLaneStage,
): 'info' | 'warning' | 'success' | 'danger' | 'neutral' {
  if (stage === 'cancelled') return 'danger';
  if (stage === 'returned') return 'warning';
  if (stage === 'delivered') return 'success';
  if (stage === 'done' || stage === 'attach' || stage === 'numbered' || stage === 'stamped') return 'success';
  if (stage === 'draft') return 'info';
  return 'warning';
}

/** รายการยังเปิดค้าง — ยังไม่อนุมัติ/ส่ง หรือปฏิเสธ */
export function isApprovalItemOpen(stage: ApprovalLaneStage | string | undefined | null): boolean {
  return stage !== 'done' && stage !== 'delivered' && stage !== 'cancelled' && stage !== 'returned';
}

/** สร้างรายการใหม่ได้เมื่อไม่มีรายการเปิดค้าง */
export function canCreateApprovalItem(
  stages: Array<ApprovalLaneStage | string | undefined | null>,
): boolean {
  return !stages.some((stage) => isApprovalItemOpen(stage));
}

/** ไฟล์เก็บเพิ่มหลังอนุมัติแล้ว (อัปโหลดได้หลายไฟล์) */
export type ApprovalKeptFile = {
  id: string;
  name: string;
  title: string;
  at?: string;
  /** ไฟล์ตัวอย่างจริงใต้ assets — เปิดดู/โหลดได้ */
  href?: string;
  /** ฉบับร่าง / ฉบับสมบูรณ์ */
  edition?: 'draft' | 'final';
  editionLabel?: string;
  editionTone?: 'info' | 'warning' | 'success' | 'danger' | 'neutral';
  /** รอส่ง / ส่งแล้ว */
  delivery?: 'pending' | 'sent';
  deliveryLabel?: string;
  deliveryTone?: 'info' | 'warning' | 'success' | 'danger' | 'neutral';
};

/** แถวกลางสำหรับตารางรายการอนุมัติ (ใช้ร่วมหลายหน้า) */
export type ApprovalListRow = {
  id: string;
  title: string;
  date: string;
  statusLabel: string;
  statusTone: 'info' | 'warning' | 'success' | 'danger' | 'neutral';
  stage: ApprovalLaneStage;
  meta?: string;
  canEdit?: boolean;
  canReview?: boolean;
  canCancel?: boolean;
  /** อนุมัติแล้ว — เปิดให้อัปโหลดไฟล์สมบูรณ์ได้หลายไฟล์ */
  canUpload?: boolean;
  /** อนุมัติแล้ว + มีไฟล์สมบูรณ์ — ยืนยันส่งให้ผู้ยื่นได้ */
  canDeliver?: boolean;
  keptFiles?: ApprovalKeptFile[];
};

export function toApprovalListRow(input: {
  id: string;
  title: string;
  date: string;
  stage: ApprovalLaneStage;
  meta?: string;
  canEdit?: boolean;
  canReview?: boolean;
  canCancel?: boolean;
  canUpload?: boolean;
  canDeliver?: boolean;
  keptFiles?: ApprovalKeptFile[];
  statusLabel?: string;
  statusTone?: ApprovalListRow['statusTone'];
}): ApprovalListRow {
  return {
    id: input.id,
    title: input.title,
    date: input.date,
    stage: input.stage,
    meta: input.meta,
    canEdit: input.canEdit === true,
    canReview: input.canReview === true,
    canCancel: input.canCancel === true,
    canUpload: input.canUpload === true,
    canDeliver: input.canDeliver === true,
    keptFiles: input.keptFiles?.length
      ? input.keptFiles.map((file) => ({
          ...file,
          editionLabel: file.editionLabel || (file.edition === 'final' ? 'ฉบับสมบูรณ์' : file.edition === 'draft' ? 'ฉบับร่าง' : undefined),
          editionTone: file.editionTone || (file.edition === 'final' ? 'success' : file.edition === 'draft' ? 'neutral' : undefined),
          deliveryLabel: file.deliveryLabel || (file.delivery === 'sent' ? 'ส่งแล้ว' : file.delivery === 'pending' ? 'รอส่ง' : undefined),
          deliveryTone: file.deliveryTone || (file.delivery === 'sent' ? 'success' : file.delivery === 'pending' ? 'warning' : undefined),
        }))
      : undefined,
    statusLabel: input.statusLabel || approvalLaneStageLabel(input.stage),
    statusTone: input.statusTone || approvalLaneStageTone(input.stage),
  };
}

/** ป้ายสถานะสั้นสำหรับหน้าจอรายการอนุมัติ */
export function approvalListStatusLabel(stage: ApprovalLaneStage): string {
  if (stage === 'delivered') return 'ส่งแล้ว';
  if (stage === 'done') return 'อนุมัติแล้ว';
  if (stage === 'cancelled') return 'ปฏิเสธแล้ว';
  if (stage === 'returned') return 'ส่งกลับแก้ไข';
  if (stage === 'draft') return 'ร่างเอกสาร';
  if (stage === 'to-head') return 'รอหัวหน้ากลุ่ม';
  if (stage === 'to-director') return 'รอผู้อำนวยการ';
  return approvalLaneStageLabel(stage);
}

/** ขั้นถัดไปในท่อ (ข้าม returned/cancelled) */
export function nextApprovalLaneStage(
  stages: ApprovalLaneStage[],
  current: ApprovalLaneStage,
): ApprovalLaneStage | null {
  const flow = stages.filter((s) => s !== 'returned' && s !== 'cancelled');
  if (current === 'returned' || current === 'cancelled') return flow[0] || null;
  const at = flow.findIndex((s) => s === current);
  if (at < 0) return flow[0] || null;
  return flow[at + 1] || null;
}

export function emptyApprovalLane(
  kind: string,
  title: string,
  stages: ApprovalLaneStage[] = APPROVAL_LANE_FULL,
  id = `lane-${Date.now()}`,
): ApprovalLane {
  return {
    id,
    kind,
    title,
    stage: 'draft',
    stages: [...stages],
    sarabanNo: '',
    history: [],
    docs: [],
  };
}

/**
 * ท่อแจ้งผลการตรวจ = Approval Lane
 * ค่าเก่า: head-ok → to-director · signed → eoffice · sent → done
 */
export type NoticePipe = ApprovalLaneStage;

/** หนึ่งเหตุการณ์ใน timeline แจ้งผลการตรวจ */
export type NoticeHistoryEntry = {
  at: string;
  by: string;
  action: string;
};

/** เวอร์ชันหนังสือแจ้งผลที่สร้างในระบบ (แนวเดียวกับร่างวาระ) */
export type NoticeLetterVersion = {
  version: number;
  title: string;
  at: string;
  html: string;
  source: 'upload' | 'created' | 'ai';
  fileName?: string;
  /** ฉบับร่าง หรือ ฉบับสมบูรณ์ */
  edition?: 'draft' | 'final';
};

/** หนึ่งรายการแจ้งผลการตรวจ (สร้างได้หลายรายการ ไม่ต้องรอรายการก่อนหน้า) */
export type NoticeItem = {
  id: string;
  title: string;
  action: DocAction;
  noticedOn: string;
  dueOn: string;
  note: string;
  files: DocFile[];
  letter: WorkField[];
  /** ประวัติเวอร์ชันหนังสือแจ้งผล (สร้าง / AI / อัปโหลด) */
  letterVersions?: NoticeLetterVersion[];
  gaps: DocGap[];
  sarabanNo: string;
  pipe: NoticePipe;
  pipeAt: string;
  reportBy: string;
  headBy: string;
  officeRef: string;
  /** สถานะลิงก์ e-Office: idle | sent | synced | error | manual */
  eofficeLink?: 'idle' | 'sent' | 'synced' | 'error' | 'manual';
  history: NoticeHistoryEntry[];
  sent: boolean;
  sentBy: string;
  /** ไฟล์เก็บเพิ่มหลังอนุมัติแล้ว (หลายไฟล์ได้) */
  keptFiles?: DocFile[];
};

export type ReplyFile = { name: string; title: string; group: 'closed' | 'open' | 'extra' | 'extend' };

/** ผู้ยื่นส่งกลับหลังได้รับแจ้งแก้ไข ตามคู่มือ e-TR */
export type ApplicantReply = {
  kind: 'fix' | 'extend';
  at: string;
  reason: string;
  newDue: string;
  letterDate: string;
  letterNo: string;
  letterTo: string;
  letterSubject: string;
  letterBody: string;
  files: ReplyFile[];
};

export type DocGap = { place: string; title: string; detail: string };

/** หนึ่งรอบที่แจ้งแล้วและผู้ยื่นส่งกลับมา */
export type NoticePass = {
  action: DocAction;
  noticedOn: string;
  dueOn: string;
  note: string;
  sentBy: string;
  sarabanNo: string;
  reply: ApplicantReply | null;
};

/** ผลการตรวจเอกสาร 3 รายการ แล้วยังขอข้อมูลเพิ่ม */
export type DocNotice = {
  action: DocAction;
  noticedOn: string;
  dueOn: string;
  note: string;
  files: DocFile[];
  letter: WorkField[];
  gaps: DocGap[];
  sarabanNo: string;
  reply: ApplicantReply | null;
  passes: NoticePass[];
  committee: CommitteeRecord | null;
  inquiry: InquiryRecord | null;
  sent: boolean;
  sentBy: string;
  /** สถานะท่ออนุมัติหนังสือแจ้ง */
  pipe: NoticePipe;
  pipeAt: string;
  /** เจ้าหน้าที่ผู้รายงานผลถึงหัวหน้ากลุ่ม */
  reportBy: string;
  headBy: string;
  officeRef: string;
  /** ประวัติการกระทำของรายการแจ้งผล (วันที่เวลา · ผู้กระทำ · เรื่อง) */
  history: NoticeHistoryEntry[];
  /** รายการแจ้งผลทั้งหมด (หลายรายการพร้อมกันได้) */
  items: NoticeItem[];
  /** รายการที่กำลังเปิดแก้ไข / เดินท่อ */
  activeId: string;
};

export type InquiryPayFile = { name: string; title: string; sentOn: string };

export type InquiryQuestionId = 'importer' | 'domestic' | 'exporter';

export type InquiryLoopKind = 'form' | 'docs' | 'extend-ask' | 'extend-reply' | 'answer' | 'revise' | 'revised';

/** เอกสารหนึ่งฉบับในวงรอบแบบสอบถาม สร้างซ้ำได้จนกว่าจะผ่าน */
export type InquiryLoopDoc = {
  kind: InquiryLoopKind;
  at: string;
  docId: string;
  round: number;
};

/** แบบสอบถามหลังเปิดไต่สวน: ผู้นำเข้า อุตสาหกรรมภายใน ผู้ส่งออก */
export type InquiryQuestion = {
  id: InquiryQuestionId;
  sent: boolean;
  revise: boolean;
  received: boolean;
  passed: boolean;
  formDocId: string;
  answerDocId: string;
  reviseDocId: string;
  papers: InquiryLoopDoc[];
};

export type InquiryIssued = { party: string; name: string; title: string; sentOn: string; docId: string };

export function defaultInquiryQuestions(): InquiryQuestion[] {
  return [
    { id: 'importer', sent: false, revise: false, received: false, passed: false, formDocId: '', answerDocId: '', reviseDocId: '', papers: [] },
    { id: 'domestic', sent: false, revise: false, received: false, passed: false, formDocId: '', answerDocId: '', reviseDocId: '', papers: [] },
    { id: 'exporter', sent: false, revise: false, received: false, passed: false, formDocId: '', answerDocId: '', reviseDocId: '', papers: [] },
  ];
}

function readInquiryQuestions(value: unknown): InquiryQuestion[] {
  const saved = Array.isArray(value) ? value : [];
  return defaultInquiryQuestions().map((item) => {
    const found = saved.find((row) => row && typeof row === 'object' && (row as { id?: string }).id === item.id) as Partial<InquiryQuestion> | undefined;
    if (!found) return { ...item };
    const text = (value: unknown) => typeof value === 'string' ? value : '';
    const kinds = new Set(['form', 'docs', 'extend-ask', 'extend-reply', 'answer', 'revise', 'revised']);
    const papers = Array.isArray(found.papers)
      ? found.papers.flatMap((paper) => {
          if (!paper || typeof paper !== 'object') return [];
          const row = paper as Partial<InquiryLoopDoc>;
          if (typeof row.kind !== 'string' || !kinds.has(row.kind) || typeof row.docId !== 'string' || !row.docId) return [];
          return [{ kind: row.kind as InquiryLoopKind, at: text(row.at), docId: row.docId, round: typeof row.round === 'number' ? row.round : 1 }];
        })
      : [];
    const formDocId = text(found.formDocId);
    const answerDocId = text(found.answerDocId);
    const reviseDocId = text(found.reviseDocId);
    if (!papers.length && formDocId) papers.push({ kind: 'form', at: '', docId: formDocId, round: 1 });
    if (answerDocId && !papers.some((paper) => paper.docId === answerDocId)) papers.push({ kind: 'answer', at: '', docId: answerDocId, round: 1 });
    if (reviseDocId && !papers.some((paper) => paper.docId === reviseDocId)) papers.push({ kind: 'revise', at: '', docId: reviseDocId, round: 1 });
    const passed = found.passed === true || (found.received === true && papers.some((paper) => paper.kind === 'answer' || paper.kind === 'revised'));
    return {
      id: item.id,
      sent: papers.some((paper) => paper.kind === 'form') || found.sent === true,
      revise: papers.some((paper) => paper.kind === 'revise') && !passed,
      received: passed,
      passed,
      formDocId: papers.filter((paper) => paper.kind === 'form').at(-1)?.docId || formDocId,
      answerDocId: papers.filter((paper) => paper.kind === 'answer' || paper.kind === 'revised').at(-1)?.docId || answerDocId,
      reviseDocId: papers.filter((paper) => paper.kind === 'revise').at(-1)?.docId || reviseDocId,
      papers,
    };
  });
}

/** เปิดไต่สวนมาตรา 39 หลังคณะกรรมการรับคำขอฉบับสมบูรณ์ */
export type InquiryAgendaFile = {
  name: string;
  title: string;
  sentOn: string;
  docId: string;
  /** Real sample under assets/samples — open/download without stub HTML */
  href?: string;
  /** draft | sub | tdc — which agenda lane owns the file */
  lane?: 'draft' | 'sub' | 'tdc';
  /** เวอร์ชันเอกสารร่างวาระ (เก็บประวัติ) */
  version?: number;
  /** ที่มาของไฟล์ */
  source?: 'sample' | 'upload' | 'created' | 'ai';
};

/** ประวัติเวอร์ชันเอกสารร่างวาระ (แก้ไขได้แบบ Word) */
export type DraftAgendaVersion = {
  version: number;
  title: string;
  at: string;
  html: string;
  source: 'upload' | 'created' | 'ai';
  fileName?: string;
};

/** ไฟล์แนบเพิ่มในรอบเสนออนุมัติ (นอกเหนือจากวาระที่ผูก) */
export type ApprovalSubmitAttachment = {
  id: string;
  name: string;
  title: string;
  at: string;
  /** ไฟล์ตัวอย่างจริงใต้ assets */
  href?: string;
  /** ฉบับร่าง / ฉบับสมบูรณ์ — เสนออนุมัติใช้ฉบับร่างที่ส่งขออนุมัติ */
  edition?: 'draft' | 'final';
};

/** รอบเสนออนุมัติ — เอกสารขออนุมัติ บันทึกเสนอ ผูกวาระอย่างน้อย 1 ไฟล์ */
export type ApprovalSubmitRound = {
  round: number;
  title: string;
  at: string;
  html: string;
  source: 'upload' | 'created' | 'ai';
  fileName?: string;
  agendaVersions: number[];
  /** ไฟล์แนบเพิ่ม (อัปโหลดเองในหน้ารอบเสนอ) */
  attachments?: ApprovalSubmitAttachment[];
  /** ท่ออนุมัติมาตรฐานของรอบนี้ */
  laneStage?: ApprovalLaneStage;
  sarabanNo?: string;
  laneHistory?: ApprovalLaneHistoryEntry[];
  /** สถานะลิงก์ e-Office ของรอบเสนอ */
  eofficeLink?: 'idle' | 'sent' | 'synced' | 'error' | 'manual';
};

export type InquiryRecord = {
  agendaAt: string;
  agenda: string;
  decide: 'take' | 'return' | '';
  feeAmount: string;
  feeDue: string;
  feeSent: boolean;
  payFiles: InquiryPayFile[];
  paySent: boolean;
  payAck: boolean;
  open: 'open' | 'close' | '';
  openAt: string;
  caseId: string;
  closeNote: string;
  /** ร่างวาระเปิด (คู่ขนาน/ก่อนอนุ) */
  draftAgendaDone: boolean;
  /** วาระอนุไต่สวน */
  subAgendaDone: boolean;
  /** วาระ ทตอ. */
  agendaDone: boolean;
  agendaFields: { label: string; value: string; long?: boolean }[];
  agendaFiles: InquiryAgendaFile[];
  returned: boolean;
  sentBy: string;
  noticeOn: string;
  noticeSent: boolean;
  hearing: '' | 'hold' | 'skip';
  hearingOn: string;
  hearingPlace: string;
  hearingDocId: string;
  noticeFiles: InquiryIssued[];
  questions: InquiryQuestion[];
};

/** ผลการพิจารณาของคณะกรรมการ หลังคำขอครบถ้วนถูกต้อง */
export type CommitteeRecord = {
  at: string;
  result: 'take' | 'reject';
  fee: 'pay' | 'skip' | '';
  note: string;
  embassyOn: string;
  embassyFile: string;
  embassyFiles: { name: string; title: string; sentOn: string; docId: string }[];
  embassyLetter: WorkField[];
  embassyNotice: boolean;
  sent: boolean;
  sentBy: string;
};

export function readDocNotice(): DocNotice | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(docKey) || 'null') as DocNotice | null;
    if (!value || (value.action !== 'amend' && value.action !== 'complete' && value.action !== 'late')) return null;
    const files = Array.isArray(value.files)
      ? value.files.flatMap((file) => {
          if (!file || typeof file.name !== 'string' || !file.name) return [];
          return [{ name: file.name, title: typeof file.title === 'string' && file.title ? file.title : file.name, sentOn: typeof file.sentOn === 'string' ? file.sentOn : '' }];
        })
      : [];
    const base: DocNotice = {
      action: value.action,
      noticedOn: typeof value.noticedOn === 'string' ? value.noticedOn : '',
      dueOn: typeof value.dueOn === 'string' ? value.dueOn : '',
      note: typeof value.note === 'string' ? value.note : '',
      files,
      letter: Array.isArray(value.letter)
        ? value.letter.flatMap((field) => {
            if (!field || typeof field.label !== 'string' || !field.label) return [];
            return [{ label: field.label, value: typeof field.value === 'string' ? field.value : '', long: field.long === true }];
          })
        : [],
      gaps: Array.isArray(value.gaps)
        ? value.gaps.flatMap((gap) => {
            if (!gap || typeof gap.title !== 'string') return [];
            return [{
              place: typeof gap.place === 'string' ? gap.place : '',
              title: gap.title,
              detail: typeof gap.detail === 'string' ? gap.detail : '',
            }];
          })
        : [],
      sarabanNo: typeof value.sarabanNo === 'string' ? value.sarabanNo : '',
      reply: readApplicantReply(value.reply),
      passes: Array.isArray(value.passes)
        ? value.passes.flatMap((pass) => {
            if (!pass || (pass.action !== 'amend' && pass.action !== 'complete' && pass.action !== 'late')) return [];
            return [{
              action: pass.action,
              noticedOn: typeof pass.noticedOn === 'string' ? pass.noticedOn : '',
              dueOn: typeof pass.dueOn === 'string' ? pass.dueOn : '',
              note: typeof pass.note === 'string' ? pass.note : '',
              sentBy: typeof pass.sentBy === 'string' ? pass.sentBy : '',
              sarabanNo: typeof pass.sarabanNo === 'string' ? pass.sarabanNo : '',
              reply: readApplicantReply(pass.reply),
            }];
          })
        : [],
      committee: readCommittee(value.committee),
      inquiry: readInquiry(value.inquiry),
      sent: value.sent === true,
      sentBy: typeof value.sentBy === 'string' ? value.sentBy : '',
      pipe: readNoticePipe(value),
      pipeAt: typeof (value as { pipeAt?: string }).pipeAt === 'string' ? (value as { pipeAt: string }).pipeAt : '',
      reportBy: typeof (value as { reportBy?: string }).reportBy === 'string' ? (value as { reportBy: string }).reportBy : '',
      headBy: typeof (value as { headBy?: string }).headBy === 'string' ? (value as { headBy: string }).headBy : '',
      officeRef: typeof (value as { officeRef?: string }).officeRef === 'string' ? (value as { officeRef: string }).officeRef : '',
      history: readNoticeHistory((value as { history?: unknown }).history),
      items: [],
      activeId: '',
    };
    return hydrateDocNoticeItems(base, (value as { items?: unknown }).items, (value as { activeId?: unknown }).activeId);
  } catch {
    return null;
  }
}

/** เติม items จาก session (หรือ migrate จากฟิลด์เดี่ยว) แล้วคืน DocNotice */
export function hydrateDocNoticeItems(base: DocNotice, rawItems: unknown, rawActiveId: unknown): DocNotice {
  const items = readNoticeItems(rawItems);
  if (items.length) {
    const activeId = typeof rawActiveId === 'string' && items.some((item) => item.id === rawActiveId)
      ? rawActiveId
      : items[items.length - 1].id;
    return { ...base, items, activeId };
  }
  const hasLegacy = base.files.length > 0 || base.pipe !== 'draft' || base.sent || !!base.note || !!base.sarabanNo;
  if (!hasLegacy) return { ...base, items: [], activeId: '' };
  const migrated = noticeItemFromLegacy(base);
  return { ...base, items: [migrated], activeId: migrated.id };
}

function noticeItemFromLegacy(value: DocNotice): NoticeItem {
  const title = value.files[0]?.title || value.letter.find((field) => field.label === 'เรื่อง')?.value || 'หนังสือแจ้งผลการตรวจ';
  return {
    id: `notice-${value.sarabanNo || value.noticedOn || 'legacy'}-${value.pipe}`,
    title,
    action: value.action,
    noticedOn: value.noticedOn,
    dueOn: value.dueOn,
    note: value.note,
    files: value.files.map((file) => ({ ...file })),
    letter: value.letter.map((field) => ({ ...field })),
    letterVersions: [],
    gaps: value.gaps.map((gap) => ({ ...gap })),
    sarabanNo: value.sarabanNo,
    pipe: value.pipe,
    pipeAt: value.pipeAt,
    reportBy: value.reportBy,
    headBy: value.headBy,
    officeRef: value.officeRef,
    history: value.history.map((item) => ({ ...item })),
    sent: value.sent,
    sentBy: value.sentBy,
    keptFiles: [],
  };
}

function readNoticeLetterVersions(value: unknown): NoticeLetterVersion[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((row) => {
    if (!row || typeof row !== 'object') return [];
    const item = row as Partial<NoticeLetterVersion>;
    if (typeof item.version !== 'number') return [];
    const source = item.source === 'ai' || item.source === 'upload' || item.source === 'created' ? item.source : 'created';
    const edition = item.edition === 'final' ? 'final' : 'draft';
    return [{
      version: item.version,
      title: typeof item.title === 'string' && item.title ? item.title : `หนังสือแจ้งผล · เวอร์ชัน ${item.version}`,
      at: typeof item.at === 'string' ? item.at : '',
      html: typeof item.html === 'string' ? item.html : '',
      source,
      fileName: typeof item.fileName === 'string' ? item.fileName : undefined,
      edition,
    }];
  });
}

function readNoticeItems(value: unknown): NoticeItem[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((row) => {
    if (!row || typeof row !== 'object') return [];
    const item = row as Partial<NoticeItem>;
    if (typeof item.id !== 'string' || !item.id) return [];
    if (item.action !== 'amend' && item.action !== 'complete' && item.action !== 'late') return [];
    const files = Array.isArray(item.files)
      ? item.files.flatMap((file) => {
          if (!file || typeof file.name !== 'string' || !file.name) return [];
          return [{
            name: file.name,
            title: typeof file.title === 'string' && file.title ? file.title : file.name,
            sentOn: typeof file.sentOn === 'string' ? file.sentOn : '',
            href: typeof (file as { href?: unknown }).href === 'string' ? (file as { href: string }).href : undefined,
            edition: (file as { edition?: unknown }).edition === 'final' || (file as { edition?: unknown }).edition === 'draft'
              ? (file as { edition: 'draft' | 'final' }).edition
              : undefined,
            delivery: (file as { delivery?: unknown }).delivery === 'sent' || (file as { delivery?: unknown }).delivery === 'pending'
              ? (file as { delivery: 'pending' | 'sent' }).delivery
              : undefined,
          }];
        })
      : [];
    return [{
      id: item.id,
      title: typeof item.title === 'string' && item.title ? item.title : (files[0]?.title || 'หนังสือแจ้งผลการตรวจ'),
      action: item.action,
      noticedOn: typeof item.noticedOn === 'string' ? item.noticedOn : '',
      dueOn: typeof item.dueOn === 'string' ? item.dueOn : '',
      note: typeof item.note === 'string' ? item.note : '',
      files,
      letter: Array.isArray(item.letter)
        ? item.letter.flatMap((field) => {
            if (!field || typeof field.label !== 'string' || !field.label) return [];
            return [{ label: field.label, value: typeof field.value === 'string' ? field.value : '', long: field.long === true }];
          })
        : [],
      letterVersions: readNoticeLetterVersions(item.letterVersions),
      gaps: Array.isArray(item.gaps)
        ? item.gaps.flatMap((gap) => {
            if (!gap || typeof gap.title !== 'string') return [];
            return [{ place: typeof gap.place === 'string' ? gap.place : '', title: gap.title, detail: typeof gap.detail === 'string' ? gap.detail : '' }];
          })
        : [],
      sarabanNo: typeof item.sarabanNo === 'string' ? item.sarabanNo : '',
      pipe: readNoticePipe({ pipe: item.pipe, sent: item.sent === true }),
      pipeAt: typeof item.pipeAt === 'string' ? item.pipeAt : '',
      reportBy: typeof item.reportBy === 'string' ? item.reportBy : '',
      headBy: typeof item.headBy === 'string' ? item.headBy : '',
      officeRef: typeof item.officeRef === 'string' ? item.officeRef : '',
      eofficeLink: readEofficeLink(item.eofficeLink),
      history: readNoticeHistory(item.history),
      sent: item.sent === true || item.pipe === 'done' || item.pipe === 'delivered',
      sentBy: typeof item.sentBy === 'string' ? item.sentBy : '',
      keptFiles: Array.isArray(item.keptFiles)
        ? item.keptFiles.flatMap((file) => {
            if (!file || typeof file.name !== 'string' || !file.name) return [];
            return [{
              name: file.name,
              title: typeof file.title === 'string' && file.title ? file.title : file.name,
              sentOn: typeof file.sentOn === 'string' ? file.sentOn : '',
              href: typeof (file as { href?: unknown }).href === 'string' ? (file as { href: string }).href : undefined,
              edition: (file as { edition?: unknown }).edition === 'final' || (file as { edition?: unknown }).edition === 'draft'
                ? (file as { edition: 'draft' | 'final' }).edition
                : undefined,
              delivery: (file as { delivery?: unknown }).delivery === 'sent' || (file as { delivery?: unknown }).delivery === 'pending'
                ? (file as { delivery: 'pending' | 'sent' }).delivery
                : undefined,
            }];
          })
        : [],
    }];
  });
}

function readEofficeLink(value: unknown): NoticeItem['eofficeLink'] {
  if (value === 'idle' || value === 'sent' || value === 'synced' || value === 'error' || value === 'manual') {
    return value;
  }
  return undefined;
}

const APPROVAL_LANE_STAGE_SET = new Set<string>([
  'draft',
  'to-head',
  'to-director',
  'eoffice',
  'stamped',
  'numbered',
  'attach',
  'done',
  'delivered',
  'returned',
  'cancelled',
]);

/** แปลงสถานะท่อเก่า → Approval Lane */
export function migrateNoticePipe(raw: string, sent = false): NoticePipe {
  if (raw === 'head-ok') return 'to-director';
  if (raw === 'signed') return 'eoffice';
  if (raw === 'sent') return 'done';
  if (APPROVAL_LANE_STAGE_SET.has(raw)) return raw as NoticePipe;
  return sent ? 'done' : 'draft';
}

function readNoticePipe(value: DocNotice | { sent?: boolean; pipe?: string }): NoticePipe {
  const raw = typeof value.pipe === 'string' ? value.pipe : '';
  return migrateNoticePipe(raw, value.sent === true);
}

function readNoticeHistory(value: unknown): NoticeHistoryEntry[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((row) => {
    if (!row || typeof row !== 'object') return [];
    const item = row as Partial<NoticeHistoryEntry>;
    if (typeof item.action !== 'string' || !item.action.trim()) return [];
    return [{
      at: typeof item.at === 'string' ? item.at : '',
      by: typeof item.by === 'string' && item.by.trim() ? item.by.trim() : '—',
      action: item.action.trim(),
    }];
  });
}

export type CaseNoteFile = { name: string; title: string };

/** บันทึกข้อความในเคส เห็นได้เฉพาะผู้เขียน หรือทุกคนที่เปิดเคสนี้ */
export type CaseNote = {
  id: string;
  at: string;
  authorId: string;
  author: string;
  scope: 'self' | 'case';
  text: string;
  files: CaseNoteFile[];
};

export function readCaseNotes(): CaseNote[] {
  try {
    const value = JSON.parse(sessionStorage.getItem(noteKey) || '[]') as CaseNote[];
    if (!Array.isArray(value)) return [];
    return value.flatMap((item) => {
      if (!item || typeof item.id !== 'string' || typeof item.text !== 'string' || !item.text.trim()) return [];
      const scope = item.scope === 'case' ? 'case' : 'self';
      return [{
        id: item.id,
        at: typeof item.at === 'string' ? item.at : '',
        authorId: typeof item.authorId === 'string' ? item.authorId : '',
        author: typeof item.author === 'string' && item.author ? item.author : 'เจ้าหน้าที่',
        scope,
        text: item.text.trim(),
        files: Array.isArray(item.files)
          ? item.files.flatMap((file) => {
              if (!file || typeof file.name !== 'string' || !file.name) return [];
              return [{ name: file.name, title: typeof file.title === 'string' && file.title ? file.title : file.name }];
            })
          : [],
      }];
    });
  } catch {
    return [];
  }
}

export function writeCaseNotes(rows: CaseNote[]): void {
  if (!rows.length) sessionStorage.removeItem(noteKey);
  else sessionStorage.setItem(noteKey, JSON.stringify(rows));
}

export function readNoteReads(username: string): string[] {
  try {
    const value = JSON.parse(sessionStorage.getItem(noteReadKey) || '{}') as Record<string, unknown>;
    const rows = value?.[username];
    return Array.isArray(rows) ? rows.filter((item) => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

export type LaterPhase = {
  visit: boolean;
  prelim: boolean;
  draftFinal: boolean;
  finalResult: boolean;
  measures: boolean;
  marks: Record<string, string>;
  notes: Record<string, string>;
};

export function readLaterPhase(): LaterPhase {
  const empty: LaterPhase = { visit: false, prelim: false, draftFinal: false, finalResult: false, measures: false, marks: {}, notes: {} };
  try {
    const value = JSON.parse(sessionStorage.getItem(laterPhaseKey) || 'null') as Partial<LaterPhase> | null;
    if (!value || typeof value !== 'object') return empty;
    const marks = value.marks && typeof value.marks === 'object' ? value.marks : {};
    const notes = value.notes && typeof value.notes === 'object' ? value.notes : {};
    const textMap = (raw: object) => Object.fromEntries(Object.entries(raw).filter((entry) => typeof entry[0] === 'string' && typeof entry[1] === 'string'));
    return {
      visit: value.visit === true,
      prelim: value.prelim === true,
      draftFinal: value.draftFinal === true,
      finalResult: value.finalResult === true,
      measures: value.measures === true,
      marks: textMap(marks),
      notes: textMap(notes),
    };
  } catch {
    return empty;
  }
}

export function writeLaterPhase(phase: LaterPhase): void {
  sessionStorage.setItem(laterPhaseKey, JSON.stringify(phase));
}

export function writeNoteReads(username: string, ids: string[]): void {
  if (!username) return;
  const current = (() => {
    try {
      const value = JSON.parse(sessionStorage.getItem(noteReadKey) || '{}') as Record<string, string[]>;
      return value && typeof value === 'object' ? value : {};
    } catch {
      return {};
    }
  })();
  current[username] = ids;
  sessionStorage.setItem(noteReadKey, JSON.stringify(current));
}

export function writeDocNotice(notice: DocNotice | null): void {
  if (!notice) sessionStorage.removeItem(docKey);
  else sessionStorage.setItem(docKey, JSON.stringify(notice));
}

function readApplicantReply(value: ApplicantReply | null | undefined): ApplicantReply | null {
  if (!value || (value.kind !== 'fix' && value.kind !== 'extend')) return null;
  const groups = new Set(['closed', 'open', 'extra', 'extend']);
  return {
    kind: value.kind,
    at: typeof value.at === 'string' ? value.at : '',
    reason: typeof value.reason === 'string' ? value.reason : '',
    newDue: typeof value.newDue === 'string' ? value.newDue : '',
    letterDate: typeof value.letterDate === 'string' ? value.letterDate : '',
    letterNo: typeof value.letterNo === 'string' ? value.letterNo : '',
    letterTo: typeof value.letterTo === 'string' ? value.letterTo : '',
    letterSubject: typeof value.letterSubject === 'string' ? value.letterSubject : '',
    letterBody: typeof value.letterBody === 'string' ? value.letterBody : '',
    files: Array.isArray(value.files)
      ? value.files.flatMap((file) => {
          if (!file || typeof file.name !== 'string' || !file.name || !groups.has(file.group)) return [];
          return [{ name: file.name, title: typeof file.title === 'string' && file.title ? file.title : file.name, group: file.group }];
        })
      : [],
  };
}

function readCommittee(value: CommitteeRecord | null | undefined): CommitteeRecord | null {
  if (!value || (value.result !== 'take' && value.result !== 'reject')) return null;
  const fee = value.fee === 'pay' || value.fee === 'skip' ? value.fee : '';
  return {
    at: typeof value.at === 'string' ? value.at : '',
    result: value.result,
    fee,
    note: typeof value.note === 'string' ? value.note : '',
    embassyOn: typeof value.embassyOn === 'string' ? value.embassyOn : '',
    embassyFile: typeof value.embassyFile === 'string' ? value.embassyFile : '',
    embassyFiles: Array.isArray(value.embassyFiles)
      ? value.embassyFiles.flatMap((file) => {
          if (!file || typeof file.name !== 'string' || !file.name) return [];
          return [{
            name: file.name,
            title: typeof file.title === 'string' && file.title ? file.title : file.name,
            sentOn: typeof file.sentOn === 'string' ? file.sentOn : '',
            docId: typeof file.docId === 'string' ? file.docId : '',
          }];
        })
      : (typeof value.embassyFile === 'string' && value.embassyFile ? [{ name: value.embassyFile, title: value.embassyFile, sentOn: '', docId: '' }] : []),
    embassyLetter: Array.isArray(value.embassyLetter)
      ? value.embassyLetter.flatMap((field) => {
          if (!field || typeof field.label !== 'string' || !field.label) return [];
          return [{ label: field.label, value: typeof field.value === 'string' ? field.value : '', long: field.long === true }];
        })
      : [],
    embassyNotice: value.embassyNotice === true,
    sent: value.sent === true,
    sentBy: typeof value.sentBy === 'string' ? value.sentBy : '',
  };
}

function readInquiry(value: InquiryRecord | null | undefined): InquiryRecord | null {
  if (!value || typeof value !== 'object') return null;
  const decide = value.decide === 'take' || value.decide === 'return' ? value.decide : '';
  const open = value.open === 'open' || value.open === 'close' ? value.open : '';
  const payFiles = Array.isArray(value.payFiles)
    ? value.payFiles.flatMap((file) => {
        if (!file || typeof file.name !== 'string' || !file.name) return [];
        return [{ name: file.name, title: typeof file.title === 'string' && file.title ? file.title : file.name, sentOn: typeof file.sentOn === 'string' ? file.sentOn : '' }];
      })
    : [];
  if (!decide && !open && value.feeSent !== true && !payFiles.length && !(typeof value.agenda === 'string' && value.agenda.trim())) return null;
  return {
    agendaAt: typeof value.agendaAt === 'string' ? value.agendaAt : '',
    agenda: typeof value.agenda === 'string' ? value.agenda : '',
    decide,
    feeAmount: typeof value.feeAmount === 'string' ? value.feeAmount : '',
    feeDue: typeof value.feeDue === 'string' ? value.feeDue : '',
    feeSent: value.feeSent === true,
    payFiles,
    paySent: value.paySent === true,
    payAck: value.payAck === true,
    open,
    openAt: typeof value.openAt === 'string' ? value.openAt : '',
    caseId: typeof value.caseId === 'string' ? value.caseId : '',
    closeNote: typeof value.closeNote === 'string' ? value.closeNote : '',
    agendaDone: value.agendaDone === true || decide !== '' || value.feeSent === true || open !== '',
    draftAgendaDone: value.draftAgendaDone === true || value.subAgendaDone === true || value.agendaDone === true || decide !== '' || value.feeSent === true || open !== '',
    subAgendaDone: value.subAgendaDone === true || value.agendaDone === true || decide !== '' || value.feeSent === true || open !== '',
    agendaFields: Array.isArray(value.agendaFields)
      ? value.agendaFields.flatMap((field) => {
          if (!field || typeof field.label !== 'string' || !field.label) return [];
          return [{ label: field.label, value: typeof field.value === 'string' ? field.value : '', long: field.long === true }];
        })
      : [],
    agendaFiles: Array.isArray(value.agendaFiles)
      ? value.agendaFiles.flatMap((file) => {
          if (!file || typeof file.name !== 'string' || !file.name) return [];
          const lane = file.lane === 'draft' || file.lane === 'sub' || file.lane === 'tdc' ? file.lane : undefined;
          return [{
            name: file.name,
            title: typeof file.title === 'string' && file.title ? file.title : file.name,
            sentOn: typeof file.sentOn === 'string' ? file.sentOn : '',
            docId: typeof file.docId === 'string' ? file.docId : '',
            href: typeof file.href === 'string' && file.href ? file.href : undefined,
            lane,
          }];
        })
      : [],
    returned: value.returned === true || (decide === 'return' && typeof value.closeNote === 'string' && !!value.closeNote.trim() && typeof value.sentBy === 'string' && !!value.sentBy),
    sentBy: typeof value.sentBy === 'string' ? value.sentBy : '',
    noticeOn: typeof value.noticeOn === 'string' ? value.noticeOn : '',
    noticeSent: value.noticeSent === true,
    hearing: value.hearing === 'hold' || value.hearing === 'skip' ? value.hearing : '',
    hearingOn: typeof value.hearingOn === 'string' ? value.hearingOn : '',
    hearingPlace: typeof value.hearingPlace === 'string' ? value.hearingPlace : '',
    hearingDocId: typeof value.hearingDocId === 'string' ? value.hearingDocId : '',
    noticeFiles: Array.isArray(value.noticeFiles)
      ? value.noticeFiles.flatMap((file) => {
          if (!file || typeof file.party !== 'string' || !file.party || typeof file.docId !== 'string') return [];
          return [{
            party: file.party,
            name: typeof file.name === 'string' && file.name ? file.name : file.party,
            title: typeof file.title === 'string' && file.title ? file.title : file.party,
            sentOn: typeof file.sentOn === 'string' ? file.sentOn : '',
            docId: file.docId,
          }];
        })
      : [],
    questions: readInquiryQuestions(value.questions),
  };
}

export type WorkField = { label: string; value: string; long?: boolean };
export type WorkDraft = { title: string; file: string; fields: WorkField[] };

export function readWorkDrafts(): WorkDraft[] {
  try {
    const value = JSON.parse(sessionStorage.getItem(workDraftKey) || '[]') as WorkDraft[];
    if (!Array.isArray(value)) return [];
    return value.flatMap((item) => {
      if (!item || typeof item.title !== 'string' || !Array.isArray(item.fields)) return [];
      return [{
        title: item.title,
        file: typeof item.file === 'string' ? item.file : '',
        fields: item.fields.flatMap((field) => {
          if (!field || typeof field.label !== 'string') return [];
          return [{ label: field.label, value: typeof field.value === 'string' ? field.value : '', long: field.long === true }];
        }),
      }];
    });
  } catch {
    return [];
  }
}

export function writeWorkDrafts(rows: WorkDraft[]): void {
  if (!rows.length) sessionStorage.removeItem(workDraftKey);
  else sessionStorage.setItem(workDraftKey, JSON.stringify(rows));
}

export type MadeDoc = { id: string; kind: string; at: string; fields: WorkField[] };

export function readMadeDocs(): MadeDoc[] {
  try {
    const value = JSON.parse(sessionStorage.getItem(madeDocKey) || '[]') as MadeDoc[];
    if (!Array.isArray(value)) return [];
    return value.flatMap((item) => {
      if (!item || typeof item.id !== 'string' || typeof item.kind !== 'string' || !Array.isArray(item.fields)) return [];
      return [{
        id: item.id,
        kind: item.kind,
        at: typeof item.at === 'string' ? item.at : '',
        fields: item.fields.flatMap((field) => {
          if (!field || typeof field.label !== 'string') return [];
          return [{ label: field.label, value: typeof field.value === 'string' ? field.value : '', long: field.long === true }];
        }),
      }];
    });
  } catch {
    return [];
  }
}

export function writeMadeDocs(rows: MadeDoc[]): void {
  if (!rows.length) sessionStorage.removeItem(madeDocKey);
  else sessionStorage.setItem(madeDocKey, JSON.stringify(rows));
}

export function consultChannelLabel(plan: ConsultPlan | null): string {
  if (!plan) return 'แชทในระบบ';
  return plan.channels
    .map((channel) => {
      if (channel === 'chat') return 'แชทในระบบ';
      if (channel === 'phone') return plan.phone ? `โทรศัพท์ ${plan.phone}` : 'โทรศัพท์';
      if (channel === 'email') return plan.email ? `อีเมล ${plan.email}` : 'อีเมล';
      return plan.other || 'ช่องทางอื่น';
    })
    .join(' · ');
}

export type FlowCheckItem = { label: string; pass: boolean; detail: string; note: string; place?: string };
export type FlowFile = { state: 'checking' | 'receive' | 'fix'; passed: boolean; items: FlowCheckItem[]; round: number; until?: number };

/** ผลตรวจก่อนส่งต่อเจ้าหน้าที่ ผู้ยื่นไม่เห็นว่าระบบตรวจ */
export function writeFlowFile(value: FlowFile | null): void {
  if (!value) sessionStorage.removeItem(flowFileKey);
  else sessionStorage.setItem(flowFileKey, JSON.stringify(value));
}

export function readFlowFile(): FlowFile | null {
  const raw = sessionStorage.getItem(flowFileKey);
  if (!raw) return null;
  if (raw === 'receive') return { state: 'receive', passed: true, items: [], round: 1 };
  try {
    const parsed = JSON.parse(raw) as FlowFile;
    if (parsed?.state === 'checking' || parsed?.state === 'receive' || parsed?.state === 'fix') return parsed;
  } catch {
    return null;
  }
  return null;
}

/** เริ่มคำขอต้นแบบใหม่จากหน้าเลือกแบบฟอร์ม — ล้าง state เดิมทั้งชุดเพื่อ demo */
export function startFilingCase(filer = ''): void {
  const doomed: string[] = [];
  for (let i = 0; i < sessionStorage.length; i += 1) {
    const name = sessionStorage.key(i);
    if (name?.startsWith('dft-por1-')) doomed.push(name);
  }
  for (const name of doomed) sessionStorage.removeItem(name);
  writeCaseStatus('draft');
  writeFilingFiler(filer);
  writeActiveFilingRef(nextFilingRefId());
}

export function caseStatusTone(status: CaseStatus): StatusTone {
  if (status === 'consult' && readFilingGate()?.state === 'rejected') return 'danger';
  if (status === 'approval' && readFilingGate()?.state === 'pending') return 'warning';
  if (status === 'review' || status === 'consult' || status === 'approval') return 'info';
  if (status === 'revision') return 'warning';
  if (status === 'official') return 'success';
  if (status === 'cancelled') return 'danger';
  return 'neutral';
}
