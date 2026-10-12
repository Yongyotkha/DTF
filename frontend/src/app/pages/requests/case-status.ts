import { StatusTone } from '../../status-tag/status-tag';
import { groupHead } from '../staff/staff-roster';

export type CaseStatus = 'draft' | 'review' | 'revision' | 'consult' | 'approval' | 'official' | 'cancelled';

const key = 'dft-por1-case';
const roundsKey = 'dft-por1-rounds';
const reviewUntilKey = 'dft-por1-review-until';
const approvalUntilKey = 'dft-por1-approval-until';
const approvedByKey = 'dft-por1-approved-by';
const consultKey = 'dft-por1-consult';

export type ConsultRequest = { topic: string; detail: string; when: string };
export type ConsultNote = {
  from: 'applicant' | 'officer';
  text: string;
  at: string;
  files?: { name: string; image?: string }[];
};

const threadKey = 'dft-por1-consult-thread';
const assignKey = 'dft-por1-consult-assigned';
const planKey = 'dft-por1-consult-plan';
const rosterKey = 'dft-por1-assignees';
const etrKey = 'dft-por1-etr';
const linksKey = 'dft-por1-links';
const docKey = 'dft-por1-doc-notice';
const workDraftKey = 'dft-por1-work-drafts';
const madeDocKey = 'dft-por1-made-docs';

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

/** วันที่ยื่นคำขอครั้งแรกของคำขอต้นแบบนี้ */
export const firstFiledOn = '15/05/2562';

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

export function caseStatusLabel(status: CaseStatus): string {
  if (status === 'review') return 'อยู่ระหว่างตรวจสอบ';
  if (status === 'revision') return 'กรุณาแก้ไขข้อมูล';
  if (status === 'consult' && !readConsultAssigned()) {
    const step = readConsultStep();
    if (step === 'receive' || step === 'forward') return 'รอเจ้าหน้าที่รับเรื่องมอบหมายให้ผู้อำนวยการ';
    if (step === 'group') return 'รอหัวหน้ากลุ่มมอบหมายเจ้าหน้าที่';
    return 'รอผู้อำนวยการมอบหมายกลุ่ม';
  }
  if (status === 'consult') return 'รอนัดพบเจ้าหน้าที่';
  if (status === 'approval') return 'รอผู้รับมอบหมายอนุมัติ';
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

export function readConsultAssigned(): boolean {
  const value = sessionStorage.getItem(assignKey);
  if (value === '1') return true;
  if (value === '0') return false;
  return readConsultThread().length > 0;
}

export function consultAwaitingDirector(): boolean {
  return readCaseStatus() === 'consult' && !!readConsult() && readConsultStep() === 'director';
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

export type DocFile = { name: string; title: string; sentOn: string };
export type DocAction = 'amend' | 'complete' | 'late';
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
};

export type InquiryPayFile = { name: string; title: string; sentOn: string };

/** เปิดไต่สวนมาตรา 39 หลังคณะกรรมการรับคำขอฉบับสมบูรณ์ */
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
  agendaDone: boolean;
  agendaFields: { label: string; value: string; long?: boolean }[];
  agendaFiles: { name: string; title: string; sentOn: string; docId: string }[];
  returned: boolean;
  sentBy: string;
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
    return {
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
    };
  } catch {
    return null;
  }
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
    agendaFields: Array.isArray(value.agendaFields)
      ? value.agendaFields.flatMap((field) => {
          if (!field || typeof field.label !== 'string' || !field.label) return [];
          return [{ label: field.label, value: typeof field.value === 'string' ? field.value : '', long: field.long === true }];
        })
      : [],
    agendaFiles: Array.isArray(value.agendaFiles)
      ? value.agendaFiles.flatMap((file) => {
          if (!file || typeof file.name !== 'string' || !file.name) return [];
          return [{
            name: file.name,
            title: typeof file.title === 'string' && file.title ? file.title : file.name,
            sentOn: typeof file.sentOn === 'string' ? file.sentOn : '',
            docId: typeof file.docId === 'string' ? file.docId : '',
          }];
        })
      : [],
    returned: value.returned === true || (decide === 'return' && typeof value.closeNote === 'string' && !!value.closeNote.trim() && typeof value.sentBy === 'string' && !!value.sentBy),
    sentBy: typeof value.sentBy === 'string' ? value.sentBy : '',
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

/** เริ่มคำขอต้นแบบใหม่จากหน้าเลือกแบบฟอร์ม */
export function startFilingCase(): void {
  writeCaseStatus('draft');
  writeRounds([]);
  writeReviewUntil(0);
  writeApprovalUntil(0);
  writeConsult(null);
  writeConsultThread([]);
  writeConsultPlan(null);
  sessionStorage.removeItem(consultStepKey);
  sessionStorage.removeItem(consultGroupKey);
  writeWorkAssignment(null);
  writeReceipt(null);
  writeEtrLink(null);
  writeSystemLinks([]);
  writeDocNotice(null);
  writeWorkDrafts([]);
  writeMadeDocs([]);
  sessionStorage.removeItem(assignKey);
}

export function caseStatusTone(status: CaseStatus): StatusTone {
  if (status === 'review' || status === 'consult' || status === 'approval') return 'info';
  if (status === 'revision') return 'warning';
  if (status === 'official') return 'success';
  if (status === 'cancelled') return 'danger';
  return 'neutral';
}
