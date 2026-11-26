import { Injectable } from '@angular/core';

/**
 * ข้อมูลงานของกลุ่ม บท. (ฝ่ายเลขานุการการประชุม) — จำลองจากเอกสารจริงของ ปค.
 * - แผนการจัดประชุม ทตอ./คปป. update 12.9.68 (ระเบียบวาระ กลุ่มเจ้าของเรื่อง วันครบกำหนด)
 * - ขั้นตอนการจัดการประชุม และชุดเอกสารจริง คปป. ครั้งที่ 4/2569
 * - Flow_Module1: ส่งประชุมและอนุมัติ (บท. ทำงานต่อจากผู้อำนวยการอนุมัติ)
 */

export const DESK_TODAY = '28/08/2568';
export const DESK_TODAY_LABEL = '28 ส.ค. 2568';

export type BodyId = 'tech' | 'sub' | 'tdc' | 'cpp';
export type MeetingState = 'plan' | 'prep' | 'held' | 'closed';
export type ItemStatus = 'plan' | 'sent' | 'queued' | 'done';
export type Rsvp = 'wait' | 'come' | 'no' | 'proxy';

export const BODY_LABEL: Record<BodyId, string> = {
  tech: 'อนุฯ เทคนิค',
  sub: 'อนุฯ ไต่สวน',
  tdc: 'ทตอ.',
  cpp: 'คปป./อนุฯ ไต่สวน SG',
};

/** อนุกรรมการเทคนิคแยกตามกลุ่มสินค้า (ใน Flow เรียก "อนุเหล็ก" ฯลฯ) — กลุ่มสินค้านอกจากเหล็กเป็นข้อมูลจำลอง */
export const TECH_SECTORS = [
  { id: 'steel', label: 'เหล็ก' },
  { id: 'chem', label: 'เคมีภัณฑ์และพลาสติก' },
  { id: 'metal', label: 'อะลูมิเนียมและโลหะอื่น' },
  { id: 'tex', label: 'สิ่งทอและอื่น ๆ' },
];

export type StepDef = { id: string; label: string; hint: string; by: string; kit: string[]; doc?: string };

/** ก่อนประชุม — ตามลำดับใน Flow */
export const PREP_STEPS: StepDef[] = [
  { id: 'receive', label: 'อัปโหลดวาระที่ ผอ. อนุมัติแล้ว จากกลุ่ม', hint: 'กลุ่มสรุปส่งข้อมูล ผ่านหัวหน้ากลุ่มและ ผอ. อนุมัติ แล้วกรมกับรองเซ็นนอกระบบ กลุ่มอัปโหลดฉบับที่เซ็น บท. รับเข้าวาระที่เมนูวาระที่ส่งเข้ามา', by: 'บท.', kit: [] },
  { id: 'agenda', label: 'รวบรวมและลำดับหัวข้อการประชุม', hint: 'เรียงตามระเบียบวาระ ให้ AI ช่วยพิจารณา สืบค้นข้อมูล และร่างเอกสาร', by: 'บท.', kit: ['7. วาระ 1-2-4.docx', 'ระเบียบวาระ คปป. 4-2569.pdf'], doc: 'ระเบียบวาระการประชุม' },
  { id: 'chair', label: 'ขออนุมัติวันจัดประชุมและขอเวลาประธาน', hint: 'ทำเรื่องผ่าน e-Office และส่งแบบเอกสารฉบับจริงให้เซ็น', by: 'บท.', kit: ['2. บันทึก เสนอปลัด ขอเวลาประธาน คปป..docx'], doc: 'บันทึกขอเวลาประธาน' },
  { id: 'room', label: 'ยืนยันวันที่ อัปโหลดเอกสารที่สแกนกลับ และจองห้องประชุม', hint: 'อัปโหลดเอกสารที่เซ็นแล้วเข้าระบบ ทำเอกสารจองห้องและขอจัดเตรียมอาหารว่าง (e-Office)', by: 'บท.', kit: ['3. ขอใช้ห้องประชุม คปป.4-69.doc'], doc: 'หนังสือขอใช้ห้องประชุม' },
  { id: 'invite', label: 'ส่งหนังสือเชิญหน่วยงานที่เกี่ยวข้อง', hint: 'รองรับทั้งอีเมลและฉบับจริง (e-Office)', by: 'บท.', kit: ['4. หนังสือครุฑ.docx', '4. บันทึกปลัด.docx'], doc: 'หนังสือเชิญประชุม' },
  { id: 'brief', label: 'เอกสารบรีฟประธานและร่างผังที่นั่ง', hint: 'Chairman’s note ร่างมติ Info และร่างผัง พิมพ์หรือส่งอีเมลให้กรรมการได้', by: 'บท.', kit: ['9. chairman\'s note คปป. 4-69.pdf', '9. ร่างมติ คปป. 4-69.pdf', '9. Info.pdf'], doc: 'ชุดเอกสารบรีฟประธาน' },
  { id: 'book', label: 'ทำเล่มวาระและหนังสือส่งเล่มให้หน่วยงานที่เกี่ยวข้อง', hint: 'หน้าปก ระเบียบวาระ เอกสารประกอบ ดึงรายงานเก่ามาใส่เพื่ออ้างอิง ให้ AI ช่วยร่าง (e-Office)', by: 'บท.', kit: ['7. หน้าปก 4-2569.docx', '9. หน้ารวมวาระ คปป. 4-2569.pdf'], doc: 'เล่มวาระการประชุม' },
  { id: 'allow', label: 'ทำเอกสารขออนุมัติเบี้ยประชุม', hint: 'เอกสารเบิกค่าตอบแทนกรรมการและที่จอดรถ (e-Office)', by: 'บท.', kit: ['6. ขอเบิกค่าเบี้ยปรระชุมคปป..docx', '5. บันทึกที่จอดรถคปป..docx'], doc: 'ชุดเอกสารขออนุมัติเบี้ยประชุม' },
  { id: 'rsvp', label: 'ติดตามการตอบรับ มา/ไม่มา', hint: 'ช่วงใกล้วันประชุม บท. กดสถานะรายคน ถ้าไม่เคยมีชื่อในระบบระบุเองได้', by: 'บท.', kit: [] },
  { id: 'seat', label: 'Confirm ผังที่นั่งและรายชื่อผู้เข้าร่วมประชุม', hint: 'ผังที่นั่ง ป้ายชื่อ ใบเซ็นชื่อ', by: 'บท.', kit: ['9. ผังที่นั่ง + รายชื่อประชุม คปป. 4-69.pdf'], doc: 'ผังที่นั่งและรายชื่อผู้เข้าร่วม' },
];

/** หลังประชุม */
export const POST_STEPS: StepDef[] = [
  { id: 'transcript', label: 'ถอดเทปเฉพาะประธานและมติที่ประชุม ส่งให้ประธานเห็นชอบ', hint: 'ร่างมติและบันทึกคำของประธาน', by: 'บท.', kit: ['11. มติ คปป 4-69.docx'], doc: 'ร่างมติที่ประชุม' },
  { id: 'sign', label: 'ส่งฉบับจริงให้กรมเซ็น และสแกนกลับเข้าระบบ', hint: 'เก็บไฟล์ที่ลงนามไว้กับการประชุมครั้งนี้ (e-Office)', by: 'บท.', kit: [] },
  { id: 'circulate', label: 'ส่งเอกสารที่ประธานเซ็นให้กรรมการรับรอง', hint: 'ทั้งอีเมลและฉบับจริง ให้แจ้งแก้ไขภายใน 3–7 วันทำการ', by: 'บท.', kit: ['12. รายงาน คปป. 4-69.docx'], doc: 'รายงานการประชุม' },
  { id: 'comments', label: 'รวบรวมความเห็นกรรมการ ส่งกลุ่มแก้ และลงวาระรับรองรายงานครั้งถัดไป', hint: 'ดูรายการความเห็นด้านล่าง ข้อความเดิมและข้อความหลังแก้จะไปลงวาระที่ 2 ถ้ากรรมการแก้เยอะ เลือกได้ว่าจะส่งส่วนที่แก้กลับให้ท่านรับทราบหรือไม่', by: 'บท.', kit: [] },
  { id: 'reports', label: 'รวบรวมรายงานจากกลุ่ม และเสนอกรม', hint: 'สรุปรายงานการประชุม ส่งมติก่อน แล้วค่อยส่งรายงาน สแกนไฟล์ที่เซ็นกลับเข้าระบบ (e-Office)', by: 'บท.', kit: [] },
  { id: 'clearbreak', label: 'จัดทำรายชื่อเคลียร์เบรก', hint: 'รายชื่ออาหารว่างตามผู้เข้าร่วมจริง ใช้เคลียร์ค่าอาหารว่าง', by: 'บท.', kit: ['13. เบิกค่าอาหารว่าง ประชุม คปป. (4-69).docx'], doc: 'รายชื่อเคลียร์เบรก' },
  { id: 'claim', label: 'เอารายชื่อเข้าร่วมจริงมาเบิกค่าเบี้ยประชุม', hint: 'ใช้รายชื่อที่กดมาจริงจากขั้นติดตามการตอบรับ (e-Office)', by: 'บท.', kit: [] },
];

/** ขั้นที่ต้องทำก่อน ตามลูกศรใน flow */
export const STEP_AFTER: Record<string, string[]> = {
  agenda: ['receive'],
  chair: ['agenda'],
  room: ['chair'],
  invite: ['room'],
  brief: ['invite'],
  book: ['brief'],
  allow: ['book'],
  rsvp: ['invite'],
  seat: ['rsvp'],
  sign: ['transcript'],
  circulate: ['sign'],
  comments: ['circulate'],
  reports: ['transcript'],
  clearbreak: ['comments'],
  claim: ['allow', 'reports'],
};

export type InviteChannel = 'email' | 'paper' | 'both';
export type Invitee = { id: string; role: string; rsvp: Rsvp; by: string; channel?: InviteChannel; sentAt?: string };
/** เอกสารของขั้นเตรียมประชุม — ร่างในระบบ (system) หรือไฟล์ที่ บท. แนบเอง (upload) */
export type MadeDoc = { step: string; name: string; href: string; at: string; key?: string; source?: 'system' | 'upload' };

export type SeatLayout = 'u' | 'oval' | 'class';
export type SeatPlan = { layout: SeatLayout; order: string[]; by: 'list' | 'ai' | 'manual' };

/** ข้อมูลที่ บท. ทำในระบบ ทั้งก่อนและหลังประชุม (บรีฟ ผังที่นั่ง เบี้ยประชุม มติรายวาระ ผู้มาจริง ฯลฯ) */
export type MeetingWork = {
  docs: Record<string, string>;
  briefs: Record<string, { note: string; resolution: string }>;
  seat?: SeatPlan;
  rate: string;
  skipPay: string[];
  guests: string;
  snack: boolean;
  bookSkip: string[];
  bookRefs: string[];
  /** มติและถ้อยคำประธานรายวาระ (ถอดเทป) */
  minutes?: Record<string, { chair: string; resolution: string }>;
  /** ผู้ตอบรับแต่ไม่ได้มาจริงในวันประชุม */
  noShow?: string[];
  snackRate?: string;
  startAt?: string;
  endAt?: string;
  replyDays?: string;
};

export function workOf(meeting: Meeting): MeetingWork {
  if (!meeting.work) meeting.work = { docs: {}, briefs: {}, rate: '', skipPay: [], guests: '', snack: true, bookSkip: [], bookRefs: [] };
  return meeting.work;
}

/**
 * เอกสารของแต่ละขั้น เก็บเป็นเวอร์ชันแบบหน้าร่างเอกสารฝั่งเจ้าหน้าที่
 * created = สร้างในระบบ, ai = AI ช่วยร่าง, upload = อัปเดตไฟล์, sample = แฟ้มเคส (ไฟล์จริงที่จำลองไว้)
 */
export type DeskSource = 'created' | 'ai' | 'upload' | 'sample';
export type DeskDoc = { version: number; title: string; at: string; source: DeskSource; html: string; href: string; fileName: string; final: boolean };

/** ผู้ที่มาประชุมจริง (ตอบรับมา/ส่งผู้แทน และไม่ถูกบันทึกว่าไม่มา) */
export function attendeesOf(meeting: Meeting): Invitee[] {
  const noShow = meeting.work?.noShow ?? [];
  return meeting.invitees.filter((row) => (row.rsvp === 'come' || row.rsvp === 'proxy') && !noShow.includes(row.id));
}
export type Meeting = {
  id: string;
  body: BodyId;
  /** เฉพาะอนุเทคนิค — กลุ่มสินค้า เช่น เหล็ก */
  sector?: string;
  no: string;
  name: string;
  month: string;
  on: string;
  time: string;
  place: string;
  chair: string;
  signer: string;
  state: MeetingState;
  steps: Record<string, string>;
  invitees: Invitee[];
  made: MadeDoc[];
  work?: MeetingWork;
};

export type ItemFile = { role: 'agenda' | 'ppt'; name: string; title: string; href: string; at: string };
export type AgendaItem = {
  id: string;
  caseKey: string;
  caseCode: string;
  meetingIds: string[];
  slot: number;
  title: string;
  product: string;
  measure: string;
  stage: string;
  group: string;
  due: string;
  status: ItemStatus;
  sentAt: string;
  sentBy: string;
  files: ItemFile[];
  live?: boolean;
  /** บท. อัปโหลดเอง (ไม่ได้ส่งมาจากกลุ่ม) */
  manual?: boolean;
};

export type CommentRow = {
  id: string;
  meetingId: string;
  by: string;
  ref: string;
  text: string;
  group: string;
  status: 'new' | 'sent' | 'fixed' | 'carried';
  before: string;
  after: string;
  heavy: boolean;
  notify: boolean | null;
};

export type GazetteStep = { label: string; at: string };
export type GazetteFile = { name: string; href: string };
export type GazetteRow = { id: string; caseCode: string; kind: string; title: string; group: string; steps: GazetteStep[]; files: GazetteFile[]; no: string; hasDept: '' | 'yes' | 'no'; deptId: string };

export const GZ_NOTICE = 'ประกาศ ทตอ.';
export const GZ_DEPT = 'ประกาศกรม';

/** ขั้นของประกาศ ทตอ. และประกาศกรม ตาม flow ของ บท. */
export function gazetteSteps(kind: string, dates: string[] = []): GazetteStep[] {
  const labels = kind === GZ_NOTICE
    ? ['ส่งร่างประกาศให้ กม. ตรวจ (e-Office)', 'พิมพ์ให้ผู้มีอำนาจลงนามนอกระบบ', 'อัปโหลดฉบับที่ลงนามกลับเข้าระบบ', 'ทำหนังสือส่งราชกิจจานุเบกษา ออกเลขหนังสือ (e-Office)', 'ลงประกาศในราชกิจจานุเบกษา']
    : ['ส่งร่างประกาศให้ กม. ตรวจ (e-Office)', 'หัวหน้ากลุ่มและ ผอ. อนุมัติ (e-Office)', 'อธิบดีลงนามในประกาศ (e-Office)', 'ทำหนังสือส่งราชกิจจานุเบกษา ออกเลขหนังสือ (e-Office)', 'งานสารบรรณลงทะเบียนรับเลข (e-Office)', 'เก็บรวบรวมข้อมูลเข้า e-TR', 'เผยแพร่บนเว็บไซต์กอง (ThaiTR)', 'แจ้งอีเมลประกาศผลถึงผู้มีส่วนได้เสีย (e-Office)', 'ลงประกาศในราชกิจจานุเบกษา'];
  return labels.map((label, index) => ({ label, at: dates[index] ?? '' }));
}

/** ลงรับหนังสือเข้า บท. แล้วส่งมอบให้กลุ่มเจ้าของเรื่อง */
export type SarabanState = 'wait' | 'synced' | 'manual';
export type FilingRow = { id: string; no: string; saraban: SarabanState; sarabanAt: string; at: string; from: string; letterNo: string; letterDate: string; subject: string; group: string; handedAt: string };

export type VisitRow = { id: string; caseCode: string; title: string; group: string; need: string; at: string; abroad: boolean; pulledAt: string; no: string; sentAt: string; clearedAt: string; spent: string; left: string; attach: string };

export const VISIT_STEPS = [
  { id: 'pulled', label: 'ดึงคำขอเบิกคลังจาก e-Office', hint: 'บท. กดดึงข้อมูลที่กลุ่มบันทึกไว้ใน e-Office' },
  { id: 'no', label: 'ออกเลขเอกสารเบิกคลังใน e-Office', hint: 'ผอ. อนุมัติแล้ว กลุ่มส่งให้ บท. ไปออกเลข' },
  { id: 'sent', label: 'ส่งเข้ากรมคลัง', hint: 'ส่งเอกสารเบิกพร้อมเลข e-Office' },
  { id: 'cleared', label: 'เคลียร์ค่าใช้จ่าย', hint: 'ระบุว่าใช้ไปเท่าไร เหลือเท่าไร และแนบเอกสาร' },
] as const;

export const KIT_ROOT = 'assets/samples/bureau/kit/';
export const SAMPLE_ROOT = 'assets/samples/ad1046/';

export const GROUPS = ['ปค./กลุ่ม 1', 'ปค./กลุ่ม 2', 'ปค./กลุ่ม 3', 'ปค./กลุ่ม 4', 'ปค./กลุ่ม 5', 'ปค./กลุ่ม 6', 'ปค./กลุ่ม 8', 'บร./AC1', 'บร./AC2', 'บร./AC3'];

const SEATS = [
  'ประธาน ทตอ. (รัฐมนตรีว่าการกระทรวงพาณิชย์)',
  'ปลัดกระทรวงพาณิชย์',
  'อธิบดีกรมการค้าต่างประเทศ (เลขานุการ)',
  'รองอธิบดีกรมการค้าต่างประเทศ (ผู้ช่วยเลขานุการ)',
  'ผู้แทนสำนักงานเศรษฐกิจอุตสาหกรรม',
  'ผู้แทนกรมศุลกากร',
  'ผู้แทนกระทรวงการคลัง',
  'ผู้แทนกรมการค้าภายใน',
  'ผู้ทรงคุณวุฒิ ด้านเศรษฐศาสตร์',
  'ผู้ทรงคุณวุฒิ ด้านการบริหารธุรกิจ',
  'ผู้ทรงคุณวุฒิ ด้านกฎหมาย',
];

function seats(rsvp: Rsvp = 'wait'): Invitee[] {
  return SEATS.map((role, index) => ({ id: `s${index + 1}`, role, rsvp, by: '' }));
}

const TECH_INSTITUTE: Record<string, string> = {
  'เหล็ก': 'ผู้แทนสถาบันเหล็กและเหล็กกล้าแห่งประเทศไทย',
  'เคมีภัณฑ์และพลาสติก': 'ผู้แทนสถาบันพลาสติก',
  'อะลูมิเนียมและโลหะอื่น': 'ผู้แทนสถาบันวิจัยโลหะและวัสดุ',
  'สิ่งทอและอื่น ๆ': 'ผู้แทนสถาบันพัฒนาอุตสาหกรรมสิ่งทอ',
};

/** ผู้เข้าร่วมของอนุกรรมการเทคนิค ตามกลุ่มสินค้า */
export function techRoles(sector: string): string[] {
  return [
    `ประธานอนุกรรมการเทคนิค ด้าน${sector}`,
    'ผู้แทนกรมการค้าต่างประเทศ (เลขานุการ)',
    'ผู้แทนสำนักงานเศรษฐกิจอุตสาหกรรม',
    'ผู้แทนกรมโรงงานอุตสาหกรรม',
    'ผู้แทนกรมศุลกากร',
    TECH_INSTITUTE[sector] ?? 'ผู้แทนสถาบันที่เกี่ยวข้อง',
    `ผู้ทรงคุณวุฒิ ด้านเทคนิค${sector}`,
  ];
}

/** รายชื่อกรรมการอนุกรรมการพิจารณาการไต่สวน ตามรายงานการประชุม 5/2568 (ระบุตำแหน่ง ไม่ระบุชื่อบุคคล) */
function subRoster(rsvp: Rsvp = 'wait'): Invitee[] {
  const rows: [string, Rsvp, string][] = [
    ['ประธาน: อธิบดีกรมการค้าต่างประเทศ', rsvp, ''],
    ['รองประธาน: รองอธิบดีกรมการค้าต่างประเทศ', rsvp, ''],
    ['ผู้แทนสำนักงานนโยบายและยุทธศาสตร์การค้า (ผู้อำนวยการกองนโยบายและยุทธศาสตร์การค้าสินค้าอุตสาหกรรมและธุรกิจบริการ)', rsvp, ''],
    ['ผู้แทนกระทรวงอุตสาหกรรม (หัวหน้ากลุ่มอุตสาหกรรมเครื่องมือแพทย์ สุขภาพและโลหะพื้นฐาน)', rsvp, ''],
    ['ผู้แทนสำนักงานคณะกรรมการส่งเสริมการลงทุน (ผู้อำนวยการกองส่งเสริมการลงทุน 3)', rsvp, ''],
    ['ผู้ทรงคุณวุฒิด้านการค้าระหว่างประเทศ', rsvp, ''],
    ['ผู้ทรงคุณวุฒิด้านวิศวกรรม', rsvp, ''],
    ['ผู้ทรงคุณวุฒิด้านการบัญชี', rsvp, ''],
    ['เลขานุการ: รักษาราชการแทนผู้อำนวยการกองปกป้องและตอบโต้ทางการค้า', rsvp, ''],
    ['ผู้ช่วยเลขานุการ: ผู้อำนวยการกองบริหารการนำเข้าและรับรองถิ่นกำเนิด', rsvp, ''],
    ['ผู้แทนสำนักงานคณะกรรมการการแข่งขันทางการค้า (ผ่านสื่ออิเล็กทรอนิกส์)', rsvp, 'ผ่านสื่ออิเล็กทรอนิกส์'],
    ['ผู้แทนสำนักงานคณะกรรมการกฤษฎีกา (ผ่านสื่ออิเล็กทรอนิกส์)', rsvp, 'ผ่านสื่ออิเล็กทรอนิกส์'],
    ['ผู้ทรงคุณวุฒิด้านกฎหมาย (ผ่านสื่ออิเล็กทรอนิกส์)', rsvp, 'ผ่านสื่ออิเล็กทรอนิกส์'],
    ['ผู้แทนกรมศุลกากร', 'no', 'ลาประชุม'],
    ['ผู้ทรงคุณวุฒิด้านเศรษฐศาสตร์', 'no', 'ลาประชุม'],
  ];
  return rows.map(([role, state, by], index) => ({ id: `s${index + 1}`, role, rsvp: state, by }));
}

function techSeats(sector: string, rsvp: Rsvp = 'wait'): Invitee[] {
  return techRoles(sector).map((role, index) => ({ id: `s${index + 1}`, role, rsvp, by: '' }));
}

function steps(done: Record<string, string> = {}): Record<string, string> {
  return { ...done };
}

const PLACE_SUB = 'ห้องประชุม 1601 ชั้น 16 กรมการค้าต่างประเทศ';
const PLACE_TDC = 'ห้องประชุมกิติยากรวรลักษณ์ ชั้น 4 สำนักงานปลัดกระทรวงพาณิชย์ (และผ่านสื่ออิเล็กทรอนิกส์)';

function meeting(partial: Partial<Meeting> & Pick<Meeting, 'id' | 'body' | 'no' | 'name' | 'month'>): Meeting {
  return {
    on: '',
    time: '09.30 น.',
    place: partial.body === 'sub' || partial.body === 'tech' ? PLACE_SUB : PLACE_TDC,
    chair: partial.body === 'tech' ? `ประธานอนุกรรมการเทคนิค ด้าน${partial.sector ?? ''}` : partial.body === 'sub' ? 'อธิบดีกรมการค้าต่างประเทศ' : 'รัฐมนตรีว่าการกระทรวงพาณิชย์',
    signer: partial.body === 'sub' || partial.body === 'tech' ? 'ผู้อำนวยการกองปกป้องและตอบโต้ทางการค้า' : 'รองอธิบดีกรมการค้าต่างประเทศ',
    state: 'plan',
    steps: {},
    invitees: [],
    made: [],
    ...partial,
  };
}

function item(partial: Partial<AgendaItem> & Pick<AgendaItem, 'id' | 'caseKey' | 'meetingIds' | 'slot' | 'title' | 'product' | 'measure' | 'stage' | 'group' | 'due'>): AgendaItem {
  return { caseCode: '', status: 'plan', sentAt: '', sentBy: '', files: [], ...partial };
}

// ───────────── ไฟล์ที่ บท. อัปโหลดเอง เก็บใน IndexedDB (href ขึ้นต้นด้วย idb:) ─────────────

const FILE_DB = 'dft-bureau-files';

function openFileDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(FILE_DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore('files');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function putUploaded(key: string, blob: Blob): Promise<void> {
  const db = await openFileDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction('files', 'readwrite');
    tx.objectStore('files').put(blob, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getUploaded(key: string): Promise<Blob | undefined> {
  const db = await openFileDb();
  return new Promise((resolve, reject) => {
    const request = db.transaction('files').objectStore('files').get(key);
    request.onsuccess = () => resolve(request.result as Blob | undefined);
    request.onerror = () => reject(request.error);
  });
}

const INBOX_ROOT = 'assets/samples/bureau/inbox/';

/** ไฟล์ที่กลุ่มส่งมา — ถ้าไม่ระบุที่อยู่ จะใช้ไฟล์ในโฟลเดอร์ inbox ชื่อเดียวกัน */
function sample(role: 'agenda' | 'ppt', name: string, title: string, at: string, href = ''): ItemFile {
  return { role, name, title, href, at };
}

function inboxFile(role: 'agenda' | 'ppt', name: string, title: string, at: string): ItemFile {
  return sample(role, name, title, at, `${INBOX_ROOT}${name}`);
}

function seedMeetings(): Meeting[] {
  return [
    meeting({ id: 'tdc-4-68', body: 'tdc', no: '4/2568', name: 'ทตอ. ครั้งที่ 4/2568', month: 'ส.ค. 2568', on: '07/08/2568', state: 'held', time: '10.00 น.', place: PLACE_SUB, steps: steps({ ...(Object.fromEntries(PREP_STEPS.map((step) => [step.id, '05/08/2568'])) as Record<string, string>), transcript: '11/08/2568', sign: '14/08/2568', circulate: '18/08/2568' }), invitees: seats('come').map((row, index) => (index === 6 ? { ...row, rsvp: 'no' as Rsvp } : row)) }),
    meeting({ id: 'cpp-aug68', body: 'cpp', no: 'ส.ค. 2568', name: 'คปป./อนุฯ ไต่สวน SG (8 ส.ค. 2568)', month: 'ส.ค. 2568', on: '08/08/2568', state: 'closed', time: '14.30 น.', steps: steps(Object.fromEntries([...PREP_STEPS, ...POST_STEPS].map((step) => [step.id, '20/08/2568'])) as Record<string, string>), invitees: seats('come') }),
    meeting({ id: 'sub-4-68', body: 'sub', no: '4/2568', name: 'อนุฯ ไต่สวน ครั้งที่ 4/2568', month: 'มิ.ย. 2568', on: '16/06/2568', state: 'closed', steps: steps(Object.fromEntries([...PREP_STEPS, ...POST_STEPS].map((step) => [step.id, '16/06/2568'])) as Record<string, string>), invitees: subRoster('come') }),
    meeting({ id: 'sub-5-68', body: 'sub', no: '5/2568', name: 'อนุฯ ไต่สวน ครั้งที่ 5/2568', month: 'ก.ค. 2568', on: '14/07/2568', state: 'closed', time: '13.30 น.', steps: steps(Object.fromEntries([...PREP_STEPS, ...POST_STEPS].map((step) => [step.id, '14/07/2568'])) as Record<string, string>), invitees: subRoster('come') }),
    meeting({ id: 'sub-6-68', body: 'sub', no: '6/2568', name: 'อนุฯ ไต่สวน ครั้งที่ 6/2568', month: 'ก.ย. 2568', on: '04/09/2568', state: 'prep', invitees: seats() }),
    meeting({ id: 'tdc-5-68', body: 'tdc', no: '5/2568', name: 'ทตอ. ครั้งที่ 5/2568', month: 'ก.ย. 2568', on: '15/09/2568', state: 'prep', time: '13.30 น.', invitees: seats() }),
    meeting({ id: 'sub-7-68', body: 'sub', no: '7/2568', name: 'อนุฯ ไต่สวน ครั้งที่ 7/2568', month: 'ต.ค. 2568' }),
    meeting({ id: 'tdc-6-68', body: 'tdc', no: '6/2568', name: 'ทตอ. ครั้งที่ 6/2568', month: 'ต.ค. 2568' }),
    meeting({ id: 'sub-8-68', body: 'sub', no: '8/2568', name: 'อนุฯ ไต่สวน ครั้งที่ 8/2568', month: 'พ.ย. 2568' }),
    meeting({ id: 'tdc-7-68', body: 'tdc', no: '7/2568', name: 'ทตอ. ครั้งที่ 7/2568', month: 'พ.ย. 2568' }),
    meeting({ id: 'cpp-nov68', body: 'cpp', no: 'พ.ย. 2568', name: 'คปป./อนุฯ ไต่สวน SG (พ.ย. 2568)', month: 'พ.ย. 2568' }),
    meeting({ id: 'sub-9-68', body: 'sub', no: '9/2568', name: 'อนุฯ ไต่สวน ครั้งที่ 9/2568', month: 'ธ.ค. 2568' }),
    meeting({ id: 'tdc-8-68', body: 'tdc', no: '8/2568', name: 'ทตอ. ครั้งที่ 8/2568', month: 'ธ.ค. 2568' }),
    meeting({ id: 'cpp-jan69', body: 'cpp', no: 'ม.ค. 2569', name: 'คปป./อนุฯ ไต่สวน SG (ม.ค. 2569)', month: 'ม.ค. 2569' }),
    techMeeting('เหล็ก', 2, 2568, 'ก.ค. 2568', { on: '17/07/2568', state: 'closed', closed: true }),
    techMeeting('เคมีภัณฑ์และพลาสติก', 1, 2568, 'ก.ค. 2568', { on: '10/07/2568', state: 'closed', closed: true }),
    techMeeting('เหล็ก', 3, 2568, 'ก.ย. 2568', { on: '01/09/2568', state: 'prep' }),
    techMeeting('เคมีภัณฑ์และพลาสติก', 2, 2568, 'ก.ย. 2568', { on: '02/09/2568', state: 'prep' }),
    techMeeting('เหล็ก', 4, 2568, 'ต.ค. 2568'),
    techMeeting('อะลูมิเนียมและโลหะอื่น', 1, 2568, 'ต.ค. 2568'),
    techMeeting('เหล็ก', 5, 2568, 'พ.ย. 2568'),
    techMeeting('เคมีภัณฑ์และพลาสติก', 3, 2568, 'พ.ย. 2568'),
    techMeeting('สิ่งทอและอื่น ๆ', 1, 2568, 'พ.ย. 2568'),
    ...history67(),
    ...future69(),
  ];
}

const SECTOR_SLUG: Record<string, string> = Object.fromEntries(TECH_SECTORS.map((row) => [row.label, row.id]));

/** ประชุมอนุกรรมการเทคนิค — รหัสและชื่อเป็นไปตามกลุ่มสินค้า */
function techMeeting(sector: string, no: number, year: number, month: string, extra: { on?: string; state?: MeetingState; closed?: boolean } = {}): Meeting {
  const { closed, ...rest } = extra;
  const on = rest.on ?? '';
  const done = Object.fromEntries([...PREP_STEPS, ...POST_STEPS].map((step) => [step.id, on])) as Record<string, string>;
  const prepared = rest.state === 'prep' || closed;
  return meeting({
    id: `tech-${SECTOR_SLUG[sector] ?? 'x'}-${no}-${year % 100}`,
    body: 'tech', sector, no: `${no}/${year}`, name: `${BODY_LABEL.tech} ${sector} ครั้งที่ ${no}/${year}`, month,
    ...rest,
    ...(closed ? { steps: steps(done) } : {}),
    invitees: prepared ? techSeats(sector, closed ? 'come' : 'wait') : [],
  });
}

/** ปี 2567 — ประชุมที่เสร็จสิ้นแล้ว (ข้อมูลตัวอย่างเพื่อดูภาพรวมแผนย้อนหลัง) */
function history67(): Meeting[] {
  const rows: Meeting[] = [];
  const closed = (id: string, body: BodyId, name: string, month: number, day: number): Meeting => {
    const on = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/2567`;
    return meeting({ id, body, no: name, name, month: `${MONTHS_TH[month - 1]} 2567`, on, state: 'closed', time: body === 'cpp' ? '14.30 น.' : body === 'tdc' ? '13.30 น.' : '09.30 น.', steps: steps(Object.fromEntries([...PREP_STEPS, ...POST_STEPS].map((step) => [step.id, on])) as Record<string, string>), invitees: seats('come') });
  };
  [[2, 6], [5, 8], [8, 7], [11, 6]].forEach(([month, day], index) => {
    rows.push(closed(`sub-${index + 1}-67`, 'sub', `อนุฯ ไต่สวน ครั้งที่ ${index + 1}/2567`, month ?? 1, (day ?? 1) - 2));
    rows.push(closed(`tdc-${index + 1}-67`, 'tdc', `ทตอ. ครั้งที่ ${index + 1}/2567`, month ?? 1, day ?? 1));
  });
  const techClosed = (sector: string, no: number, month: number, day: number): Meeting => techMeeting(sector, no, 2567, `${MONTHS_TH[month - 1]} 2567`, { on: `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/2567`, state: 'closed', closed: true });
  [[2, 3], [5, 5], [8, 4], [11, 3]].forEach(([month, day], index) => rows.push(techClosed('เหล็ก', index + 1, month ?? 1, day ?? 1)));
  [[5, 6], [11, 4]].forEach(([month, day], index) => rows.push(techClosed('เคมีภัณฑ์และพลาสติก', index + 1, month ?? 1, day ?? 1)));
  rows.push(closed('cpp-mar67', 'cpp', 'คปป./อนุฯ ไต่สวน SG (มี.ค. 2567)', 3, 14));
  rows.push(closed('cpp-sep67', 'cpp', 'คปป./อนุฯ ไต่สวน SG (ก.ย. 2567)', 9, 12));
  return rows;
}

/** ปี 2569 — แผนล่วงหน้า (ยังไม่กำหนดวัน) ม.ค. มีประชุมในแผน 2568 อยู่แล้ว */
function future69(): Meeting[] {
  const rows: Meeting[] = [];
  MONTHS_TH.forEach((label, index) => {
    const no = index + 1;
    rows.push(meeting({ id: `sub-${no}-69`, body: 'sub', no: `${no}/2569`, name: `อนุฯ ไต่สวน ครั้งที่ ${no}/2569`, month: `${label} 2569` }));
    rows.push(meeting({ id: `tdc-${no}-69`, body: 'tdc', no: `${no}/2569`, name: `ทตอ. ครั้งที่ ${no}/2569`, month: `${label} 2569` }));
  });
  const techPlan: [string, number[]][] = [['เหล็ก', [1, 3, 5, 7, 9, 11]], ['เคมีภัณฑ์และพลาสติก', [2, 5, 8, 11]], ['อะลูมิเนียมและโลหะอื่น', [3, 9]], ['สิ่งทอและอื่น ๆ', [6]]];
  techPlan.forEach(([sector, months]) => months.forEach((month, index) => rows.push(techMeeting(sector, index + 1, 2569, `${MONTHS_TH[month - 1]} 2569`))));
  [4, 7, 10].forEach((month) => {
    const label = MONTHS_TH[month - 1] ?? '';
    rows.push(meeting({ id: `cpp-${month}-69`, body: 'cpp', no: `${label} 2569`, name: `คปป./อนุฯ ไต่สวน SG (${label} 2569)`, month: `${label} 2569` }));
  });
  return rows;
}

const T_OPEN = 'ระเบียบวาระ';

function hist(id: string, caseKey: string, tdcId: string, subId: string, title: string, product: string, measure: string, stage: string, group: string, sent: string): AgendaItem {
  return item({ id, caseKey, meetingIds: subId ? [subId, tdcId] : [tdcId], slot: 1, title, product, measure, stage, group, due: '', status: 'done', sentAt: `${sent} · 10:00 น.`, sentBy: group });
}

function seedItems(): AgendaItem[] {
  const done = (id: string, rest: Parameters<typeof item>[0]) => item({ ...rest, id, status: 'done', sentAt: '01/07/2568 · 11:00 น.', sentBy: rest.group, files: [sample('agenda', `วาระ ${rest.title.slice(0, 24)}.docx`, T_OPEN, '01/08/2568'), sample('ppt', `PPT ${rest.group}.pptx`, 'PowerPoint', '01/08/2568')] });
  return [
    // ทตอ. 4/2568 (7 ส.ค. 2568) — ประชุมแล้ว
    done('z1', { id: 'z1', caseKey: 'crc-coat-cn-kr', meetingIds: ['sub-5-68', 'tdc-4-68'], slot: 2, title: 'การพิจารณาคำขอให้ทบทวนอัตราอากรตอบโต้การทุ่มตลาด เหล็กแผ่นรีดเย็นชุบหรือเคลือบด้วยโลหะเจือของอะลูมิเนียมและสังกะสีแบบจุ่มร้อน จากจีนและเกาหลี', product: 'เหล็กแผ่นรีดเย็นชุบ/เคลือบโลหะเจือ Al-Zn แบบจุ่มร้อน', measure: 'AD ม.56', stage: 'คำขอให้ทบทวน', group: 'ปค./กลุ่ม 6', due: '' }),
    done('z2', { id: 'z2', caseKey: 'ss-cn', meetingIds: ['sub-5-68'], slot: 3, title: 'ร่างผลการทบทวนการเรียกเก็บอากรตอบโต้การทุ่มตลาดต่อไป ม.57 เหล็กกล้าไร้สนิมรีดเย็น จากจีน', product: 'เหล็กกล้าไร้สนิมรีดเย็น ชนิดม้วน แผ่น และแผ่นแถบ', measure: 'AD ม.57', stage: 'ร่างผลทบทวน', group: 'ปค./กลุ่ม 4', due: '19/11/2568' }),
    done('z3', { id: 'z3', caseKey: 'ss-vn', meetingIds: ['sub-5-68'], slot: 4, title: 'ร่างผลการไต่สวนชั้นที่สุด การทุ่มตลาดเหล็กกล้าไร้สนิมรีดเย็น จากเวียดนาม', product: 'เหล็กกล้าไร้สนิมรีดเย็น ชนิดม้วน แผ่น และแผ่นแถบ', measure: 'AD ไต่สวน', stage: 'ร่างผลชั้นที่สุด', group: 'ปค./กลุ่ม 1', due: '26/09/2568' }),
    done('z4', { id: 'z4', caseKey: 'al-cn', meetingIds: ['sub-5-68'], slot: 5, title: 'ร่างผลการไต่สวนชั้นที่สุด การทุ่มตลาดอะลูมิเนียมอัดขึ้นรูป จากจีน', product: 'อะลูมิเนียมอัดขึ้นรูป', measure: 'AD ไต่สวน', stage: 'ร่างผลชั้นที่สุด', group: 'ปค./กลุ่ม 2', due: '16/12/2568' }),
    // คปป. ส.ค. 2568
    done('c1', { id: 'c1', caseKey: 'sg-pp', meetingIds: ['cpp-aug68'], slot: 1, title: 'การพิจารณาคำขอให้ดำเนินการกำหนดมาตรการปกป้องจากการนำเข้าสินค้าโพลิโพรพิลีนที่เพิ่มขึ้น', product: 'โพลิโพรพิลีน', measure: 'SG ไต่สวน', stage: 'พิจารณาคำขอ', group: 'ปค./กลุ่ม 3', due: '' }),

    // อนุฯ ไต่สวน 6/2568 และ ทตอ. 5/2568
    item({ id: 'i3', caseKey: 'crc-cn-vn-tw', meetingIds: ['sub-6-68', 'tdc-5-68', 'tech-steel-3-68'], slot: 1, title: 'ร่างผลการทบทวนการเรียกเก็บอากรตอบโต้การทุ่มตลาดต่อไป ม.57 เหล็กแผ่นรีดเย็น จากจีน เวียดนาม และไต้หวัน', product: 'เหล็กแผ่นรีดเย็นชนิดเป็นม้วนและไม่เป็นม้วน', measure: 'AD ม.57', stage: 'ร่างผลทบทวน', group: 'ปค./กลุ่ม 5', due: '24/01/2569', status: 'sent', sentAt: '25/08/2568 · 14:10 น.', sentBy: 'เจ้าหน้าที่ ปค./กลุ่ม 5', files: [inboxFile('agenda', 'วาระอนุฯ ร่างผลทบทวน เหล็กแผ่นรีดเย็น (กลุ่ม 5).docx', 'วาระอนุฯ ไต่สวน', '25/08/2568'), inboxFile('ppt', 'PPT อนุฯ ร่างผลทบทวน เหล็กแผ่นรีดเย็น ส่ง บท..pdf', 'PowerPoint ส่ง บท.', '25/08/2568')] }),
    item({ id: 'i4', caseKey: 'ad1046-hr', caseCode: 'AD1046', meetingIds: ['sub-6-68', 'tdc-5-68', 'tech-steel-3-68'], slot: 2, title: 'ร่างผลการไต่สวนการทุ่มตลาด เหล็กแผ่นรีดร้อน จากเวียดนามและอียิปต์', product: 'เหล็กแผ่นรีดร้อน', measure: 'AD ไต่สวน', stage: 'ร่างผลไต่สวน', group: 'ปค./กลุ่ม 1', due: '', status: 'sent', sentAt: '26/08/2568 · 10:45 น.', sentBy: 'เจ้าหน้าที่ ปค./กลุ่ม 1', files: [sample('agenda', 'sub-2 วาระ 3.1 ร่างผลอนุไต่สวน HR VN EG.docx', 'วาระอนุฯ ไต่สวน (ร่างผล)', '26/08/2568', `${SAMPLE_ROOT}draft/sub-2 วาระ 3.1 ร่างผลอนุไต่สวน HR VN EG.docx`), sample('ppt', 'sub-3 Power point อนุไต่สวน ร่างผล.pdf', 'PowerPoint ส่ง บท.', '26/08/2568', `${SAMPLE_ROOT}draft/sub-3 Power point อนุไต่สวน ร่างผล.pdf`)] }),
    item({ id: 'i5', caseKey: 'ss-vn', meetingIds: ['sub-6-68', 'tdc-5-68', 'tech-steel-3-68'], slot: 3, title: 'ผลการไต่สวนชั้นที่สุด การทุ่มตลาดเหล็กกล้าไร้สนิมรีดเย็น จากเวียดนาม', product: 'เหล็กกล้าไร้สนิมรีดเย็น ชนิดม้วน แผ่น และแผ่นแถบ', measure: 'AD ไต่สวน', stage: 'ผลชั้นที่สุด', group: 'ปค./กลุ่ม 1', due: '26/09/2568' }),
    done('ac-sub5', { id: 'ac-sub5', caseKey: 'ac-gl-coat-cn', meetingIds: ['sub-5-68'], slot: 1, title: 'การพิจารณาคำขอให้ดำเนินการตอบโต้การหลบเลี่ยงมาตรการตอบโต้การทุ่มตลาด เหล็กแผ่นรีดเย็นเคลือบสังกะสีแบบจุ่มร้อนชนิดเป็นม้วนและไม่เป็นม้วน จากจีน เพื่อขยายไปยังเคลือบสังกะสีผสมอะลูมิเนียมและแมกนีเซียม ของผู้ผลิต 10 ราย', product: 'เหล็กแผ่นรีดเย็นเคลือบสังกะสีแบบจุ่มร้อน', measure: 'AC', stage: 'พิจารณาคำขอ (อนุฯ)', group: 'ปค./กลุ่ม 6', due: '' }),
    item({ id: 'ac3', caseKey: 'ac3-gi', meetingIds: ['tdc-5-68', 'tech-steel-3-68'], slot: 4, title: 'คำขอให้พิจารณาตอบโต้การหลบเลี่ยงมาตรการ AD เหล็กแผ่นรีดเย็นเคลือบสังกะสีแบบจุ่มร้อน จากจีน (ขยายไปยังเคลือบสังกะสีผสมอะลูมิเนียมและแมกนีเซียม ผู้ผลิต 10 ราย) — ไม่เข้าอนุฯ 6/68 เข้าเฉพาะ ทตอ. 5/68', product: 'เหล็กแผ่นรีดเย็นเคลือบสังกะสีแบบจุ่มร้อน', measure: 'AC', stage: 'คำขอ', group: 'บร./AC3', due: '', status: 'sent', sentAt: '27/08/2568 · 16:05 น.', sentBy: 'เจ้าหน้าที่ บร./AC3', files: [inboxFile('agenda', 'วาระ ทตอ. คำขอหลบเลี่ยง เหล็กเคลือบสังกะสี (AC3).docx', 'วาระ ทตอ.', '27/08/2568'), inboxFile('ppt', 'PPT ทตอ. คำขอหลบเลี่ยง AC3 ส่ง บท..pdf', 'PowerPoint ส่ง บท.', '27/08/2568')] }),
    item({ id: 'ac1', caseKey: 'ac1-hr', meetingIds: ['tdc-5-68', 'tech-steel-3-68'], slot: 5, title: 'คำขอให้พิจารณาตอบโต้การหลบเลี่ยงมาตรการ AD เหล็กแผ่นรีดร้อน จากจีน (ขยายไปยังเหล็กแผ่นรีดร้อนเจือและไม่เจือ หน้ากว้าง ผู้ผลิต 7 ราย)', product: 'เหล็กแผ่นรีดร้อน', measure: 'AC', stage: 'คำขอ', group: 'บร./AC1', due: '', status: 'sent', sentAt: '27/08/2568 · 15:20 น.', sentBy: 'เจ้าหน้าที่ บร./AC1', files: [inboxFile('agenda', 'วาระ ทตอ. คำขอหลบเลี่ยง เหล็กรีดร้อน (AC1).docx', 'วาระ ทตอ.', '27/08/2568'), inboxFile('ppt', 'PPT ทตอ. คำขอหลบเลี่ยง AC1 ส่ง บท..pdf', 'PowerPoint ส่ง บท.', '27/08/2568')] }),
    item({ id: 'ac2', caseKey: 'ac2-pipe', meetingIds: ['tdc-5-68'], slot: 6, title: 'ผลการไต่สวนการหลบเลี่ยงมาตรการ AD หลอดและท่อทำด้วยเหล็กหรือเหล็กกล้า จากจีน (Youfa Group ส่งออกผ่าน Tianjin Tianyingtai Steel Pipe Co., Ltd.)', product: 'หลอดและท่อทำด้วยเหล็กหรือเหล็กกล้า', measure: 'AC', stage: 'ผลไต่สวน', group: 'บร./AC2', due: '19/09/2568' }),

    // ต.ค. 2568
    item({ id: 'o1', caseKey: 'citric-cn', meetingIds: ['sub-7-68', 'tdc-6-68'], slot: 1, title: 'ร่างผลการทบทวนการเรียกเก็บอากรตอบโต้การทุ่มตลาดต่อไป ม.57 กรดซิทริก จากจีน', product: 'กรดซิทริก', measure: 'AD ม.57', stage: 'ร่างผลทบทวน', group: 'ปค./กลุ่ม 3', due: '14/01/2569' }),
    item({ id: 'o2', caseKey: 'ss-cn', meetingIds: ['sub-7-68', 'tdc-6-68', 'tech-steel-4-68'], slot: 2, title: 'ผลการทบทวนต่ออายุมาตรการ AD ม.57 เหล็กกล้าไร้สนิมรีดเย็น จากจีน', product: 'เหล็กกล้าไร้สนิมรีดเย็น ชนิดม้วน แผ่น และแผ่นแถบ', measure: 'AD ม.57', stage: 'ผลทบทวน', group: 'ปค./กลุ่ม 4', due: '19/11/2568' }),
    item({ id: 'o3', caseKey: 'al-cn', meetingIds: ['sub-7-68', 'tdc-6-68', 'tech-metal-1-68'], slot: 3, title: 'ผลการไต่สวนชั้นที่สุด การทุ่มตลาดอะลูมิเนียมอัดขึ้นรูป จากจีน', product: 'อะลูมิเนียมอัดขึ้นรูป', measure: 'AD ไต่สวน', stage: 'ผลชั้นที่สุด', group: 'ปค./กลุ่ม 2', due: '16/12/2568' }),
    item({ id: 'o4', caseKey: 'seah-fsi', meetingIds: ['sub-7-68', 'tdc-6-68', 'tech-steel-4-68'], slot: 4, title: 'ขอเปลี่ยนชื่อบริษัท SeAH FS Co., Ltd. เป็น SeAH FSI Co., Ltd. ในประกาศ ทตอ. ผลทบทวน ม.56 และ ม.57 หลอดและท่อทำด้วยเหล็กหรือเหล็กกล้า จากจีนและเกาหลี พ.ศ. 2566', product: 'หลอดและท่อทำด้วยเหล็กหรือเหล็กกล้า', measure: 'AD ไต่สวน', stage: 'เปลี่ยนชื่อบริษัท', group: 'ปค./กลุ่ม 1', due: '' }),
    // พ.ย. 2568
    item({ id: 'n1', caseKey: 'pipe-vn', meetingIds: ['sub-8-68', 'tdc-7-68', 'tech-steel-5-68'], slot: 1, title: 'ร่างผลการทบทวนต่ออายุมาตรการ AD ม.57 หลอดและท่อทำด้วยเหล็กหรือเหล็กกล้า จากเวียดนาม', product: 'หลอดและท่อทำด้วยเหล็กหรือเหล็กกล้า', measure: 'AD ม.57', stage: 'ร่างผลทบทวน', group: 'ปค./กลุ่ม 8', due: '06/02/2569' }),
    item({ id: 'n2', caseKey: 'crc-cn-vn-tw', meetingIds: ['sub-8-68', 'tdc-7-68', 'tech-steel-5-68'], slot: 2, title: 'ผลการทบทวนการเรียกเก็บอากรตอบโต้การทุ่มตลาดต่อไป ม.57 เหล็กแผ่นรีดเย็น จากจีน เวียดนาม และไต้หวัน', product: 'เหล็กแผ่นรีดเย็นชนิดเป็นม้วนและไม่เป็นม้วน', measure: 'AD ม.57', stage: 'ผลทบทวน', group: 'ปค./กลุ่ม 5', due: '24/01/2569' }),
    item({ id: 'n3', caseKey: 'citric-cn', meetingIds: ['sub-8-68', 'tdc-7-68', 'tech-chem-3-68'], slot: 3, title: 'ผลการทบทวนการเรียกเก็บอากรตอบโต้การทุ่มตลาดต่อไป ม.57 กรดซิทริก จากจีน', product: 'กรดซิทริก', measure: 'AD ม.57', stage: 'ผลทบทวน', group: 'ปค./กลุ่ม 3', due: '14/01/2569' }),
    item({ id: 'n4', caseKey: 'sg-pp', meetingIds: ['cpp-nov68', 'tech-chem-3-68'], slot: 1, title: 'การพิจารณาร่างผลการไต่สวน SG สินค้าโพลิโพรพิลีน', product: 'โพลิโพรพิลีน', measure: 'SG ไต่สวน', stage: 'ร่างผลไต่สวน', group: 'ปค./กลุ่ม 3', due: '' }),
    // ธ.ค. 2568
    item({ id: 'd1', caseKey: 'ss-jp-kr-tw', meetingIds: ['sub-9-68', 'tdc-8-68'], slot: 1, title: 'คำขอให้ทบทวนต่ออายุมาตรการ AD ม.57 เหล็กกล้าไร้สนิมรีดเย็น จากญี่ปุ่น เกาหลีใต้ และไต้หวัน', product: 'เหล็กกล้าไร้สนิมรีดเย็น ชนิดม้วน แผ่น และแผ่นแถบ', measure: 'AD ม.57', stage: 'คำขอให้ทบทวน', group: 'ปค./กลุ่ม 4', due: '17/02/2569' }),
    item({ id: 'd2', caseKey: 'ac2-crc', meetingIds: ['tdc-8-68'], slot: 2, title: 'ร่างผลการไต่สวน AC เหล็กแผ่นรีดเย็น จากจีน (ขยายการเรียกเก็บอากรไปยังเหล็กแผ่นรีดเย็นเจืออื่น ๆ ผู้ผลิต 3 ราย)', product: 'เหล็กแผ่นรีดเย็นชนิดเป็นม้วนและไม่เป็นม้วน', measure: 'AC', stage: 'ร่างผลไต่สวน', group: 'บร./AC2', due: '26/03/2569' }),
    item({ id: 'j1', caseKey: 'sg-pp', meetingIds: ['cpp-jan69'], slot: 1, title: 'การพิจารณาผลการไต่สวน SG สินค้าโพลิโพรพิลีน', product: 'โพลิโพรพิลีน', measure: 'SG ไต่สวน', stage: 'ผลไต่สวน', group: 'ปค./กลุ่ม 3', due: '28/02/2569' }),

    // ───── มาตรการอื่นให้ครบตาม Flow (ข้อมูลจำลอง) ─────
    item({ id: 'c1', caseKey: 'cvd-hr-id', meetingIds: ['sub-6-68', 'tdc-5-68', 'tech-steel-3-68'], slot: 7, title: 'ร่างผลการไต่สวนการอุดหนุน (CVD) เหล็กแผ่นรีดร้อน จากอินโดนีเซีย', product: 'เหล็กแผ่นรีดร้อน', measure: 'CVD ไต่สวน', stage: 'ร่างผลไต่สวน', group: 'ปค./กลุ่ม 2', due: '' }),
    item({ id: 'a58', caseKey: 'pet-film-cn', meetingIds: ['sub-6-68', 'tdc-5-68', 'tech-chem-2-68'], slot: 8, title: 'การพิจารณาคำขอทบทวนตาม ม.58 ฟิล์มโพลีเอสเตอร์ จากจีน', product: 'ฟิล์มโพลีเอสเตอร์', measure: 'AD ม.58', stage: 'คำขอให้ทบทวน', group: 'ปค./กลุ่ม 3', due: '' }),
    item({ id: 'a59', caseKey: 'foil-cn', meetingIds: ['sub-7-68', 'tdc-6-68', 'tech-metal-1-68'], slot: 5, title: 'การพิจารณาคำขอทบทวนตาม ม.59 (ผู้นำเข้าเป็นผู้ยื่น) อะลูมิเนียมฟอยล์ จากจีน', product: 'อะลูมิเนียมฟอยล์', measure: 'AD ม.59', stage: 'คำขอให้ทบทวน', group: 'ปค./กลุ่ม 2', due: '' }),
    item({ id: 'a56', caseKey: 'wire-cn', meetingIds: ['sub-7-68', 'tdc-6-68', 'tech-steel-4-68'], slot: 6, title: 'การพิจารณาคำขอให้ทบทวนอัตราอากรตอบโต้การทุ่มตลาด ม.56 ลวดเหล็กกล้า จากจีน', product: 'ลวดเหล็กกล้า', measure: 'AD ม.56', stage: 'คำขอให้ทบทวน', group: 'ปค./กลุ่ม 6', due: '' }),
    item({ id: 'cv56', caseKey: 'cvd-ss-id', meetingIds: ['sub-7-68', 'tdc-6-68', 'tech-steel-4-68'], slot: 7, title: 'การพิจารณาคำขอทบทวนมาตรการอากรตอบโต้การอุดหนุน ม.56 เหล็กกล้าไร้สนิมรีดเย็น จากอินโดนีเซีย', product: 'เหล็กกล้าไร้สนิมรีดเย็น', measure: 'CVD ม.56', stage: 'คำขอให้ทบทวน', group: 'ปค./กลุ่ม 4', due: '' }),
    item({ id: 'cv57', caseKey: 'cvd-tex-in', meetingIds: ['sub-8-68', 'tdc-7-68', 'tech-tex-1-68'], slot: 4, title: 'ร่างผลการทบทวนการเรียกเก็บอากรตอบโต้การอุดหนุนต่อไป ม.57 ผ้าทอจากเส้นใยสังเคราะห์ จากอินเดีย', product: 'ผ้าทอจากเส้นใยสังเคราะห์', measure: 'CVD ม.57', stage: 'ร่างผลทบทวน', group: 'ปค./กลุ่ม 5', due: '' }),
    item({ id: 'cv58', caseKey: 'cvd-pet-in', meetingIds: ['sub-8-68', 'tdc-7-68', 'tech-chem-3-68'], slot: 5, title: 'การพิจารณาคำขอทบทวนตาม ม.58 มาตรการอากรตอบโต้การอุดหนุน ฟิล์มโพลีเอสเตอร์ จากอินเดีย', product: 'ฟิล์มโพลีเอสเตอร์', measure: 'CVD ม.58', stage: 'คำขอให้ทบทวน', group: 'ปค./กลุ่ม 3', due: '' }),
    item({ id: 'cv59', caseKey: 'cvd-tube-vn', meetingIds: ['sub-9-68', 'tdc-8-68'], slot: 3, title: 'การพิจารณาคำขอทบทวนตาม ม.59 (ผู้นำเข้าเป็นผู้ยื่น) มาตรการอากรตอบโต้การอุดหนุน หลอดและท่อเหล็กกล้า จากเวียดนาม', product: 'หลอดและท่อทำด้วยเหล็กหรือเหล็กกล้า', measure: 'CVD ม.59', stage: 'คำขอให้ทบทวน', group: 'ปค./กลุ่ม 8', due: '' }),
    item({ id: 'p3', caseKey: 'cvd-al-cn', meetingIds: ['sub-4-69', 'tdc-4-69'], slot: 1, title: 'คำขอให้ไต่สวนการอุดหนุน (CVD) อะลูมิเนียมอัดขึ้นรูป จากจีน (ผู้ผลิตในประเทศอยู่ระหว่างพิจารณาร่างคำขอ)', product: 'อะลูมิเนียมอัดขึ้นรูป', measure: 'CVD ไต่สวน', stage: 'คำขอ', group: 'ปค./กลุ่ม 2', due: '' }),

    // ปี 2567 — ประวัติ (ประชุมเสร็จแล้ว)
    hist('h1', 'crc-cn-vn-tw', 'tdc-2-67', 'sub-2-67', 'คำขอให้ทบทวนการเรียกเก็บอากรตอบโต้การทุ่มตลาดต่อไป ม.57 เหล็กแผ่นรีดเย็น จากจีน เวียดนาม และไต้หวัน', 'เหล็กแผ่นรีดเย็นชนิดเป็นม้วนและไม่เป็นม้วน', 'AD ม.57', 'คำขอให้ทบทวน', 'ปค./กลุ่ม 5', '08/05/2567'),
    hist('h2', 'ss-cn', 'tdc-3-67', 'sub-3-67', 'คำขอให้ทบทวนการเรียกเก็บอากรตอบโต้การทุ่มตลาดต่อไป ม.57 เหล็กกล้าไร้สนิมรีดเย็น จากจีน', 'เหล็กกล้าไร้สนิมรีดเย็น ชนิดม้วน แผ่น และแผ่นแถบ', 'AD ม.57', 'คำขอให้ทบทวน', 'ปค./กลุ่ม 4', '07/08/2567'),
    hist('h3', 'citric-cn', 'tdc-4-67', 'sub-4-67', 'คำขอให้ทบทวนการเรียกเก็บอากรตอบโต้การทุ่มตลาดต่อไป ม.57 กรดซิทริก จากจีน', 'กรดซิทริก', 'AD ม.57', 'คำขอให้ทบทวน', 'ปค./กลุ่ม 3', '06/11/2567'),
    hist('h4', 'sg-pp', 'cpp-sep67', '', 'การพิจารณารับคำขอให้ดำเนินการมาตรการปกป้องฯ โพลิโพรพิลีน', 'โพลิโพรพิลีน', 'SG ไต่สวน', 'รับคำขอ', 'ปค./กลุ่ม 3', '12/09/2567'),

    // ปี 2569 — แผนล่วงหน้า
    item({ id: 'p1', caseKey: 'pet-cn-vn', meetingIds: ['sub-2-69', 'tdc-2-69'], slot: 1, title: 'คำขอให้ไต่สวนการทุ่มตลาด PET จากจีนและเวียดนาม (ผู้ผลิตในประเทศอยู่ระหว่างพิจารณาร่างคำขอ)', product: 'PET', measure: 'AD ไต่สวน', stage: 'คำขอ', group: 'ปค./กลุ่ม 5', due: '' }),
    item({ id: 'p2', caseKey: 'phenolic-cn', meetingIds: ['sub-3-69', 'tdc-3-69'], slot: 1, title: 'คำขอให้ไต่สวนการทุ่มตลาด ฟีนอลิกเรซิน จากจีน (ผู้ผลิตในประเทศอยู่ระหว่างพิจารณาร่างคำขอ)', product: 'ฟีนอลิกเรซิน', measure: 'AD ไต่สวน', stage: 'คำขอ', group: 'ปค./กลุ่ม 4', due: '' }),
  ];
}

function seedComments(): CommentRow[] {
  return [
    { id: 'k1', meetingId: 'tdc-4-68', by: 'ผู้ทรงคุณวุฒิ ด้านกฎหมาย', ref: 'วาระ 3 ย่อหน้าที่ 2', text: 'ขอให้แก้ถ้อยคำเกี่ยวกับมติให้ตรงกับที่ประชุมตกลง', group: 'ปค./กลุ่ม 1', status: 'new', before: 'ที่ประชุมมีมติเห็นชอบร่างผลการไต่สวนชั้นที่สุด ตามที่เสนอ', after: 'ที่ประชุมมีมติเห็นชอบร่างผลการไต่สวนชั้นที่สุด โดยให้ปรับถ้อยคำในส่วนอัตราอากรตามความเห็นของคณะกรรมการ', heavy: false, notify: null },
    { id: 'k2', meetingId: 'tdc-4-68', by: 'ผู้แทนสำนักงานเศรษฐกิจอุตสาหกรรม', ref: 'วาระ 4 ตารางอัตราอากร', text: 'ขอให้ระบุที่มาของตัวเลขส่วนต่างราคาให้ชัดเจน', group: 'ปค./กลุ่ม 2', status: 'new', before: 'ส่วนต่างราคาที่คำนวณได้ร้อยละ 6.20', after: 'ส่วนต่างราคาที่คำนวณได้ร้อยละ 6.20 (คำนวณจากราคาส่งออกถัวเฉลี่ยถ่วงน้ำหนัก ตามตารางแนบท้าย)', heavy: false, notify: null },
    { id: 'k3', meetingId: 'tdc-4-68', by: 'ผู้ทรงคุณวุฒิ ด้านเศรษฐศาสตร์', ref: 'วาระ 2 หน้า 5', text: 'แก้ไขหลายจุดในส่วนผลกระทบต่ออุตสาหกรรมต่อเนื่อง', group: 'ปค./กลุ่ม 4', status: 'new', before: 'ผลกระทบต่ออุตสาหกรรมต่อเนื่องอยู่ในระดับต่ำ', after: 'ผลกระทบต่ออุตสาหกรรมต่อเนื่องอยู่ในระดับต่ำถึงปานกลาง และปรับตารางต้นทุน 3 จุดตามที่กรรมการเสนอ', heavy: true, notify: null },
  ];
}

function seedGazette(): GazetteRow[] {
  const duty = `${SAMPLE_ROOT}final/duty/`;
  const dept = `${SAMPLE_ROOT}final/dept/`;
  return [
    {
      id: 'g1', caseCode: 'AD1046', kind: GZ_NOTICE, title: 'ประกาศ ทตอ. ผลการไต่สวนการทุ่มตลาด เหล็กแผ่นรีดร้อน จากเวียดนามและอียิปต์', group: 'ปค./กลุ่ม 1', no: '', hasDept: 'yes', deptId: 'g2',
      steps: gazetteSteps(GZ_NOTICE, ['22/11/2564', '24/11/2564', '25/11/2564', '26/11/2564', '01/12/2564']),
      files: [{ name: '2. ประกาศ ทตอ-เหล็กรีดร้อนเวียดนาม อียิปต์.docx', href: `${duty}2. ประกาศ ทตอ-เหล็กรีดร้อนเวียดนาม อียิปต์.docx` }, { name: '5.1 บันทึกเสนออธิบดีลงนามส่งราชกิจจา.docx', href: `${duty}5.1 บันทึกเสนออธิบดีลงนามส่งราชกิจจา.docx` }],
    },
    {
      id: 'g2', caseCode: 'AD1046', kind: GZ_DEPT, title: 'ประกาศกรมการค้าต่างประเทศ ผลการไต่สวนชั้นที่สุด เหล็กแผ่นรีดร้อน จากเวียดนามและอียิปต์', group: 'ปค./กลุ่ม 1', no: '', hasDept: '', deptId: '',
      steps: gazetteSteps(GZ_DEPT, ['10/12/2564', '14/12/2564', '27/12/2564', '28/12/2564', '28/12/2564', '29/12/2564', '29/12/2564', '29/12/2564', '13/01/2565']),
      files: [{ name: 'ประกาศกรมการค้าต่างประเทศ.pdf', href: `${dept}ประกาศกรมการค้าต่างประเทศ.pdf` }, { name: 'หนังสือนำส่งราชกิจจานุเบกษา.pdf', href: `${dept}หนังสือนำส่งราชกิจจานุเบกษา.pdf` }, { name: 'ประกาศกรมฯ ลงราชกิจจานุเบกษา.PDF', href: `${dept}ประกาศกรมฯ ลงราชกิจจานุเบกษา.PDF` }],
    },
    {
      id: 'g3', caseCode: '', kind: GZ_NOTICE, title: 'ประกาศ ทตอ. ผลการไต่สวนการทุ่มตลาด ลวดเหล็กกล้า จากจีน (ตามมติ ทตอ. ครั้งที่ 3/2568)', group: 'ปค./กลุ่ม 1', no: '', hasDept: '', deptId: '',
      steps: gazetteSteps(GZ_NOTICE, ['14/08/2568']),
      files: [],
    },
    {
      id: 'g4', caseCode: '', kind: GZ_DEPT, title: 'ประกาศกรมการค้าต่างประเทศ ผลการไต่สวนชั้นที่สุด ผ้าทอจากเส้นใยสังเคราะห์ จากอินเดีย (ตามมติ ทตอ. ครั้งที่ 2/2568)', group: 'ปค./กลุ่ม 4', no: '', hasDept: '', deptId: '',
      steps: gazetteSteps(GZ_DEPT, ['11/08/2568', '14/08/2568', '19/08/2568']),
      files: [],
    },
  ];
}

function seedFilings(): FilingRow[] {
  return [
    { id: 'f-seed-5', no: '', saraban: 'wait', sarabanAt: '', at: '28/08/2568', from: 'สำนักงานเลขานุการ ทตอ.', letterNo: 'พณ 0603/ว 211', letterDate: '27/08/2568', subject: 'แจ้งมติ ทตอ. ครั้งที่ 4/2568 เพื่อดำเนินการตามมติ', group: 'ปค./กลุ่ม 8', handedAt: '' },
    { id: 'f-seed-4', no: 'สบ.1703/2568', saraban: 'synced', sarabanAt: '27/08/2568', at: '27/08/2568', from: 'กรมศุลกากร', letterNo: 'กค 0518/4412', letterDate: '26/08/2568', subject: 'ขอข้อมูลสถิติการนำเข้าเหล็กรีดร้อนเพื่อประกอบการไต่สวน', group: 'ปค./กลุ่ม 2', handedAt: '' },
    { id: 'f-seed-3', no: 'สบ.1702/2568', saraban: 'manual', sarabanAt: '27/08/2568', at: '27/08/2568', from: 'ผู้ประกอบการ (ผู้นำเข้า)', letterNo: 'ลว.2708/01', letterDate: '27/08/2568', subject: 'ขอให้จัดการรับฟังความคิดเห็น กรณีทบทวนมาตรการ AD ม.57', group: 'ปค./กลุ่ม 5', handedAt: '' },
    { id: 'f-seed-1', no: '', saraban: 'wait', sarabanAt: '', at: '26/08/2568', from: 'ผู้ประกอบการ (ผู้ผลิตในประเทศ)', letterNo: 'ปค.0601/1123', letterDate: '25/08/2568', subject: 'ขอให้ไต่สวนการเลี่ยงมาตรการ AD เหล็กโครงสร้างรูปพรรณ', group: 'บร./AC1', handedAt: '' },
    { id: 'f-seed-2', no: 'สบ.1700/2568', saraban: 'synced', sarabanAt: '22/08/2568', at: '22/08/2568', from: 'สำนักงานเศรษฐกิจอุตสาหกรรม', letterNo: 'อก.0310/905', letterDate: '20/08/2568', subject: 'ขอความเห็นประกอบการพิจารณาร่างผลทบทวน ม.57', group: 'ปค./กลุ่ม 4', handedAt: '24/08/2568' },
  ];
}

function seedVisits(): VisitRow[] {
  const base = { abroad: false, pulledAt: '', no: '', sentAt: '', clearedAt: '', spent: '', left: '', attach: '' };
  return [
    { ...base, id: 'v1', caseCode: 'AD1046', title: 'Visit ที่ทำการอุตสาหกรรมภายใน เหล็กแผ่นรีดร้อน', group: 'ปค./กลุ่ม 1', need: 'เบิกค่าใช้จ่ายเดินทางและที่พัก (AI ช่วยคำนวณจากกลุ่ม) ส่งคลัง', at: '20/08/2568' },
    { ...base, id: 'v2', caseCode: '', title: 'Visit ผู้ผลิตในประเทศ เหล็กโครงสร้างรูปตัว H', group: 'ปค./กลุ่ม 8', need: 'เบิกค่าใช้จ่ายเดินทางและที่พัก ส่งคลัง', at: '22/08/2568', pulledAt: '22/08/2568' },
    { ...base, id: 'v3', caseCode: '', title: 'Visit ผู้ผลิตในประเทศ อะลูมิเนียมอัดขึ้นรูป', group: 'ปค./กลุ่ม 2', need: 'เบิกค่าใช้จ่ายเดินทางและที่พัก ส่งคลัง', at: '30/07/2568', pulledAt: '30/07/2568', no: 'eO-2568-0412', sentAt: '31/07/2568', clearedAt: '12/08/2568', spent: '18,450', left: '1,550', attach: 'ใบเสร็จค่าที่พัก.pdf, ใบเสร็จค่าน้ำมัน.pdf' },
    { ...base, id: 'v4', caseCode: '', title: 'Visit ผู้ผลิตต่างประเทศ เหล็กแผ่นรีดร้อน (เวียดนาม)', group: 'บร./AC1', need: 'เบิกคลังรวมตั๋วเครื่องบิน หนังสือเดินทางและวีซ่า (สล. พาดำเนินการ)', at: '25/08/2568', abroad: true, pulledAt: '26/08/2568', no: 'eO-2568-0431', sentAt: '27/08/2568' },
  ];
}

type DeskState = {
  rev: number;
  meetings: Meeting[];
  items: AgendaItem[];
  comments: CommentRow[];
  gazette: GazetteRow[];
  visits: VisitRow[];
  liveQueued: string;
  seq: number;
  filings: FilingRow[];
  desk: Record<string, DeskDoc[]>;
};

/** ไฟล์จริงที่ใช้จำลองเอกสารของการประชุมและประกาศที่ทำเสร็จแล้ว */
function sampleDoc(version: number, title: string, href: string, at: string): DeskDoc {
  return { version, title, at, source: 'sample', html: '', href, fileName: href.slice(href.lastIndexOf('/') + 1), final: true };
}

function seedDesk(): Record<string, DeskDoc[]> {
  const kit = (name: string) => `${KIT_ROOT}${name}`;
  const ad = (path: string) => `${SAMPLE_ROOT}${path}`;
  const desk: Record<string, DeskDoc[]> = {};
  const put = (key: string, title: string, href: string, at: string) => { desk[key] = [...(desk[key] ?? []), sampleDoc((desk[key]?.length ?? 0) + 1, title, href, at)]; };
  // ทตอ. 4/2568 — เตรียมประชุมครบ ประชุมแล้ว ทำมติ ส่งลงนาม และส่งรายงานให้กรรมการรับรองแล้ว
  put('tdc-4-68:agenda', 'ระเบียบวาระ ทตอ. 4/2568', ad('draft/tdc-2 วาระ 3.1 ร่างผล ทตอ. HR VN EG.docx'), '01/08/2568');
  put('tdc-4-68:chair', 'บันทึกเสนอปลัดขอเวลาประธาน ทตอ. 4/2568', kit('2. บันทึก เสนอปลัด ขอเวลาประธาน คปป..docx'), '01/08/2568');
  put('tdc-4-68:room', 'ขอใช้ห้องประชุม ทตอ. 4/2568', kit('3. ขอใช้ห้องประชุม คปป.4-69.doc'), '02/08/2568');
  put('tdc-4-68:invite', 'หนังสือเชิญประชุม (ครุฑ) ทตอ. 4/2568', kit('4. หนังสือครุฑ.docx'), '02/08/2568');
  put('tdc-4-68:inviteMemo', 'บันทึกเชิญปลัดกระทรวง', kit('4. บันทึกปลัด.docx'), '02/08/2568');
  put('tdc-4-68:brief', 'Chairman’s note ทตอ. 4/2568', ad('draft/tdc-5 Chairman ทตอ ร่างผล.docx'), '04/08/2568');
  put('tdc-4-68:book', 'หน้าปกเล่มวาระ ทตอ. 4/2568', kit('7. หน้าปก 4-2569.docx'), '04/08/2568');
  put('tdc-4-68:allow', 'ขอเบิกค่าเบี้ยประชุม ทตอ. 4/2568', kit('6. ขอเบิกค่าเบี้ยปรระชุมคปป..docx'), '05/08/2568');
  put('tdc-4-68:parking', 'บันทึกขอที่จอดรถ ทตอ. 4/2568', kit('5. บันทึกที่จอดรถคปป..docx'), '05/08/2568');
  put('tdc-4-68:seat', 'ผังที่นั่งและรายชื่อผู้เข้าร่วม ทตอ. 4/2568', kit('9. ผังที่นั่ง + รายชื่อประชุม คปป. 4-69.pdf'), '05/08/2568');
  put('tdc-4-68:resolution', 'มติ ทตอ. 4/2568 (ถอดเทปประธานและมติ)', ad('draft/tdc-4 มติ ทตอ. 9 กย 64.docx'), '11/08/2568');
  put('tdc-4-68:signed', 'มติ ทตอ. 4/2568 ฉบับที่ประธานเห็นชอบและลงนาม', ad('draft/tdc-4 มติ ทตอ. 9 กย 64.docx'), '14/08/2568');
  put('tdc-4-68:minutes', 'รายงานการประชุม ทตอ. 4/2568', ad('draft/tdc-6 รายงาน ทตอ 9 กย 64.docx'), '18/08/2568');
  // อนุฯ ไต่สวน 5/2568 — ปิดงานแล้ว
  put('sub-5-68:agenda', 'ระเบียบวาระอนุฯ ไต่สวน 5/2568', ad('draft/sub-2 วาระ 3.1 ร่างผลอนุไต่สวน HR VN EG.docx'), '07/07/2568');
  put('sub-5-68:chair', 'บันทึกเสนอขอเวลาประธานอนุฯ', ad('draft/sub-1 บันทึกเสนอเข้าอนุฯ ร่างผล.docx'), '07/07/2568');
  put('sub-5-68:brief', 'Chairman’s note อนุฯ ไต่สวน 5/2568', ad('draft/sub-6 Chairman อนุไต่สวน.docx'), '10/07/2568');
  put('sub-5-68:resolution', 'มติคณะอนุฯ ไต่สวน 5/2568', ad('draft/sub-4 มติคณะอนุฯ ไต่สวน 31 สค 64.docx'), '15/07/2568');
  put('sub-5-68:signed', 'มติคณะอนุฯ ไต่สวน 5/2568 ฉบับลงนาม', ad('draft/sub-4 มติคณะอนุฯ ไต่สวน 31 สค 64.docx'), '17/07/2568');
  put('sub-5-68:minutes', 'รายงานการประชุมอนุฯ ไต่สวน 5/2568', ad('draft/sub-5 รายงานอนุไต่ฯ 31 สค 64.docx'), '21/07/2568');
  put('sub-4-68:resolution', 'มติคณะกรรมการ (ตัวอย่าง AD1046)', ad('agenda/tdc/5. มติคณะกรรมการ ทตอ.docx'), '17/06/2568');
  put('sub-4-68:minutes', 'รายงานการประชุม (ตัวอย่าง AD1046)', ad('agenda/tdc/6. รายงานการประชุม HR 9 พย 63.docx'), '20/06/2568');
  // คปป. ส.ค. 2568 — ชุดเอกสารจริงของ คปป.
  put('cpp-aug68:agenda', 'ระเบียบวาระ คปป.', kit('ระเบียบวาระ คปป. 4-2569.pdf'), '01/08/2568');
  put('cpp-aug68:brief', 'Chairman’s note คปป.', kit('9. chairman\'s note คปป. 4-69.pdf'), '06/08/2568');
  put('cpp-aug68:book', 'หน้ารวมวาระ คปป.', kit('9. หน้ารวมวาระ คปป. 4-2569.pdf'), '06/08/2568');
  put('cpp-aug68:seat', 'ผังที่นั่ง + รายชื่อประชุม คปป.', kit('9. ผังที่นั่ง + รายชื่อประชุม คปป. 4-69.pdf'), '07/08/2568');
  put('cpp-aug68:resolution', 'มติ คปป.', kit('11. มติ คปป 4-69.docx'), '12/08/2568');
  put('cpp-aug68:minutes', 'รายงาน คปป.', kit('12. รายงาน คปป. 4-69.docx'), '15/08/2568');
  put('cpp-aug68:snack', 'เบิกค่าอาหารว่าง ประชุม คปป.', kit('13. เบิกค่าอาหารว่าง ประชุม คปป. (4-69).docx'), '20/08/2568');
  // ประกาศของเคส AD1046
  const duty = 'final/duty/';
  const dept = 'final/dept/';
  put('gz:g1:0:gz-legal', 'บันทึกถึง กม. ตรวจร่างประกาศ ทตอ.', ad(`${duty}1 บันทึกถึง กม  ตรวจประกาศ.docx`), '22/11/2564');
  put('gz:g1:1:gz-print', 'ประกาศ ทตอ. ฉบับพิมพ์ลงนาม', ad(`${duty}ประกาศ ทตอ-เหล็กรีดร้อนเวียดนาม อียิปต์ final.docx`), '24/11/2564');
  put('gz:g1:1:gz-memo', 'บันทึกอธิบดีเสนอปลัด/รมว. ลงนามประกาศ ทตอ.', ad(`${duty}3. บันทึกอธิบดี เสนอปลัด รมวลงนามประกาศทตอ.docx`), '24/11/2564');
  put('gz:g1:2:gz-signed', 'ประกาศ ทตอ. ฉบับลงนาม', ad(`${duty}2. ประกาศ ทตอ-เหล็กรีดร้อนเวียดนาม อียิปต์.docx`), '25/11/2564');
  put('gz:g1:3:gz-send', 'บันทึกเสนออธิบดีลงนามส่งราชกิจจานุเบกษา', ad(`${duty}5.1 บันทึกเสนออธิบดีลงนามส่งราชกิจจา.docx`), '26/11/2564');
  put('gz:g1:3:gz-send', 'หนังสือถึงเลขาธิการคณะรัฐมนตรี', ad(`${duty}5.2  หนังสือถึงเลขาธิการครม.pdf`), '26/11/2564');
  put('gz:g1:4:gz-published', 'ประกาศที่ลงราชกิจจานุเบกษา', ad(`${duty}T_0055.PDF`), '01/12/2564');
  put('gz:g2:0:gz-legal', 'บันทึกถึง กม. ตรวจร่างประกาศกรม', ad(`${dept}1 บันทึกถึง กม  ตรวจประกาศ.docx`), '10/12/2564');
  put('gz:g2:1:gz-approve', 'บันทึกถึงอธิบดีลงนามประกาศกรม', ad(`${dept}1. บันทึก ถึง อธ ลงนามประกาศกรมชั้นที่สุด.docx`), '14/12/2564');
  put('gz:g2:2:gz-signed', 'ประกาศกรมการค้าต่างประเทศ (ลงนามแล้ว)', ad(`${dept}ประกาศกรมการค้าต่างประเทศ.pdf`), '27/12/2564');
  put('gz:g2:3:gz-send', 'หนังสือนำส่งราชกิจจานุเบกษา', ad(`${dept}หนังสือนำส่งราชกิจจานุเบกษา.pdf`), '28/12/2564');
  put('gz:g2:7:gz-notify', 'หนังสือแจ้งผู้นำเข้า ส่งประกาศกรม', ad('final/deptLetters/3.หนังสือผู้นำเข้าส่งประกาศกรม.docx'), '29/12/2564');
  put('gz:g2:7:gz-notify', 'หนังสือแจ้งอุตสาหกรรมภายใน ส่งประกาศกรม', ad('final/deptLetters/4.หนังสืออุตในส่งประกาศกรม.docx'), '29/12/2564');
  put('gz:g2:8:gz-published', 'ประกาศกรมฯ ลงราชกิจจานุเบกษา', ad(`${dept}ประกาศกรมฯ ลงราชกิจจานุเบกษา.PDF`), '13/01/2565');
  // Visit ที่เคลียร์แล้ว
  put('visit:v3:sent:visit-send', 'บันทึกส่งเอกสารเบิกและคืนเงินยืม', ad('visit/expense/11 บันทึกส่งเอกสารเบิกและคืนเงินยืม.docx'), '31/07/2568');
  put('visit:v3:cleared:visit-clear', 'สรุปค่าใช้จ่าย', ad('visit/expense/8 สรุปค่าใช้จ่าย.docx'), '12/08/2568');
  put('visit:v3:cleared:visit-proof', 'ใบเบิกค่าใช้จ่ายในการเดินทางไปราชการ', ad('visit/expense/9 ใบเบิกค่าใช้จ่ายในการเดินทางไปราชการ.docx'), '12/08/2568');
  put('visit:v4:sent:visit-send', 'บันทึกขออนุมัติเดินทางไปตรวจสอบข้อเท็จจริง', ad('visit/expense/1 บันทึกขออนุมัติเดินทางไปตรวจสอบข้อเท็จจริง.docx'), '27/08/2568');
  return desk;
}

const STORE_KEY = 'dft-bureau-desk-v1';
const REV = 11;

export function toDays(text: string): number | null {
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(text.trim());
  if (!match) return null;
  return Date.UTC(Number(match[3]) - 543, Number(match[2]) - 1, Number(match[1])) / 86400000;
}

export function daysFromToday(text: string): number | null {
  const a = toDays(text);
  const b = toDays(DESK_TODAY);
  return a === null || b === null ? null : Math.round(a - b);
}

export const MONTHS_TH = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

export function shortDate(text: string): string {
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(text.trim());
  if (!match) return text || '—';
  return `${Number(match[1])} ${MONTHS_TH[Number(match[2]) - 1]} ${match[3]}`;
}

export function monthKey(label: string): number {
  const match = /^(\S+)\s+(\d{4})$/.exec(label.trim());
  const index = match ? MONTHS_TH.indexOf(match[1] ?? '') : -1;
  return match && index >= 0 ? Number(match[2]) * 12 + index : 0;
}

export function monthLabelOf(date: string): string {
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(date.trim());
  return match ? `${MONTHS_TH[Number(match[2]) - 1] ?? ''} ${match[3]}` : '';
}

export function validDate(date: string): boolean {
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(date.trim());
  if (!match) return false;
  const day = Number(match[1]);
  const month = Number(match[2]);
  return month >= 1 && month <= 12 && day >= 1 && day <= 31;
}

/** ปีที่วางแผนได้ (พ.ศ.) */
export const PLAN_YEARS = [2567, 2568, 2569];

/** 12 เดือนของปี (ม.ค. – ธ.ค.) */
export function planMonths(year: number): string[] {
  return MONTHS_TH.map((label) => `${label} ${year}`);
}

export type MeetingPatch = { name: string; on: string; time: string; place: string; chair: string; signer: string; sector?: string };
export type ItemPatch = { title: string; group: string; measure: string; due: string; product: string; stage: string };

@Injectable({ providedIn: 'root' })
export class BureauStore {
  private state: DeskState = this.load();

  get meetings(): Meeting[] { return this.state.meetings; }
  get items(): AgendaItem[] { return this.syncLive(); }
  get comments(): CommentRow[] { return this.state.comments; }
  get gazette(): GazetteRow[] { return this.state.gazette; }
  get filings(): FilingRow[] { return this.state.filings; }
  get visits(): VisitRow[] { return this.state.visits; }

  meetingById(id: string): Meeting | undefined {
    return this.state.meetings.find((row) => row.id === id);
  }

  itemsOf(meetingId: string): AgendaItem[] {
    return this.items.filter((row) => row.meetingIds.includes(meetingId)).sort((a, b) => a.slot - b.slot);
  }

  prepDone(meeting: Meeting): number {
    return PREP_STEPS.filter((step) => !!meeting.steps[step.id]).length;
  }

  postDone(meeting: Meeting): number {
    return POST_STEPS.filter((step) => !!meeting.steps[step.id]).length;
  }

  reset(): void {
    try { localStorage.removeItem(STORE_KEY); } catch { /* ignore */ }
    this.state = this.fresh();
  }

  // ───────────── เอกสารรายขั้น (เวอร์ชัน) ─────────────

  desk(key: string): DeskDoc[] {
    return this.state.desk[key] ?? [];
  }

  setDesk(key: string, docs: DeskDoc[]): void {
    this.state.desk[key] = docs;
    this.save();
  }

  /** มีเอกสารฉบับสมบูรณ์อย่างน้อย 1 ฉบับ */
  deskFinal(key: string): boolean {
    return this.desk(key).some((row) => row.final);
  }

  // ───────────── กติกาของขั้นตอนประชุม ─────────────

  commentsOf(meetingId: string): CommentRow[] {
    return this.state.comments.filter((row) => row.meetingId === meetingId);
  }

  pendingComments(meetingId: string): number {
    return this.commentsOf(meetingId).filter((row) => row.status !== 'carried').length;
  }

  stepBlock(meeting: Meeting, stepId: string): string {
    if (stepId === 'receive' && !this.itemsOf(meeting.id).some((row) => row.status === 'queued' || row.status === 'done')) return 'ยังไม่มีวาระที่รับเข้า ไปรับจากเมนูวาระที่ส่งเข้ามาก่อน';
    const all = [...PREP_STEPS, ...POST_STEPS];
    const need = (STEP_AFTER[stepId] ?? []).map((id) => all.find((row) => row.id === id)).find((row) => !!row && !meeting.steps[row.id]);
    if (need) return `ต้องทำขั้น “${need.label}” ก่อน`;
    if (stepId === 'rsvp' && meeting.invitees.some((row) => row.rsvp === 'wait')) return 'ยังมีผู้ที่รอตอบรับ';
    const pending = this.pendingComments(meeting.id);
    if (stepId === 'comments' && pending) return `ยังมีความเห็น ${pending} รายการที่ยังไม่ลงวาระครั้งถัดไป`;
    return '';
  }

  /** ยกเลิกการทำเสร็จของขั้น และขั้นที่ต้องทำต่อจากขั้นนั้น */
  undoStep(meeting: Meeting, stepId: string): void {
    const next = { ...meeting.steps };
    const drop = new Set([stepId]);
    for (let again = true; again;) {
      again = false;
      for (const [id, needs] of Object.entries(STEP_AFTER)) {
        if (!drop.has(id) && needs.some((need) => drop.has(need))) { drop.add(id); again = true; }
      }
    }
    drop.forEach((id) => delete next[id]);
    meeting.steps = next;
    if (drop.has('invite')) meeting.invitees.forEach((row) => { row.sentAt = ''; });
    this.save();
  }

  markHeld(meeting: Meeting): boolean {
    if (meeting.state !== 'prep' || !PREP_STEPS.every((step) => !!meeting.steps[step.id])) return false;
    meeting.state = 'held';
    this.itemsOf(meeting.id).forEach((row) => { if (row.status === 'queued') row.status = 'done'; });
    this.save();
    return true;
  }

  closeMeeting(meeting: Meeting): boolean {
    if (meeting.state !== 'held' || !POST_STEPS.every((step) => !!meeting.steps[step.id])) return false;
    meeting.state = 'closed';
    this.save();
    return true;
  }

  /** ประชุมครั้งถัดไปของคณะเดียวกัน (ที่ความเห็นต่อรายงานจะไปลงวาระที่ 2) */
  nextMeetingOf(meeting: Meeting): Meeting | undefined {
    const index = this.state.meetings.findIndex((row) => row.id === meeting.id);
    return this.state.meetings.slice(index + 1).find((row) => row.body === meeting.body && row.sector === meeting.sector && row.state !== 'closed' && row.state !== 'held');
  }

  prevMeetingOf(meeting: Meeting): Meeting | undefined {
    const index = this.state.meetings.findIndex((row) => row.id === meeting.id);
    return this.state.meetings.slice(0, Math.max(index, 0)).reverse().find((row) => row.body === meeting.body && row.sector === meeting.sector && (row.state === 'held' || row.state === 'closed'));
  }

  advanceComment(row: CommentRow): void {
    if (row.status === 'new') row.status = 'sent';
    else if (row.status === 'sent') row.status = 'fixed';
    else if (row.status === 'fixed') {
      row.status = 'carried';
      if (row.heavy && row.notify === null) row.notify = true;
    }
    this.save();
  }

  // ───────────── ประกาศ ─────────────

  gazetteById(id: string): GazetteRow | undefined {
    return this.state.gazette.find((row) => row.id === id);
  }

  gazetteBlock(row: GazetteRow): string {
    const step = row.steps.find((entry) => !entry.at);
    if (!step || !step.label.startsWith('ทำหนังสือส่งราชกิจจานุเบกษา')) return '';
    if (row.kind === GZ_NOTICE) {
      if (!row.hasDept) return 'ตอบก่อนว่ามีประกาศกรมตามมาไหม (ที่ขั้นอัปโหลดฉบับที่ลงนาม)';
      const dept = this.gazetteById(row.deptId);
      if (row.hasDept === 'yes' && dept && !dept.steps[2]?.at) return 'รออธิบดีลงนามประกาศกรมที่ตามมา (ดูรายการประกาศกรมของเคสนี้)';
    }
    return '';
  }

  gazetteNext(row: GazetteRow): boolean {
    const step = row.steps.find((entry) => !entry.at);
    if (!step || this.gazetteBlock(row)) return false;
    step.at = DESK_TODAY;
    if (step.label.startsWith('ทำหนังสือส่งราชกิจจานุเบกษา') && !row.no) row.no = this.nextNo();
    this.save();
    return true;
  }

  gazetteUndo(row: GazetteRow, index: number): void {
    row.steps.forEach((step, at) => { if (at >= index) step.at = ''; });
    if (!row.steps.some((step) => step.label.startsWith('ทำหนังสือส่งราชกิจจานุเบกษา') && step.at)) row.no = '';
    this.save();
  }

  answerDept(row: GazetteRow, yes: boolean): void {
    if (yes) this.addDeptAnnouncement(row);
    else { row.hasDept = 'no'; this.save(); }
  }

  // ───────────── Visit ─────────────

  visitById(id: string): VisitRow | undefined {
    return this.state.visits.find((row) => row.id === id);
  }

  visitAt(row: VisitRow, stepId: string): string {
    return ({ pulled: row.pulledAt, no: row.no ? `เลข ${row.no}` : '', sent: row.sentAt, cleared: row.clearedAt } as Record<string, string>)[stepId] ?? '';
  }

  visitDone(row: VisitRow): number {
    return [row.pulledAt, row.no, row.sentAt, row.clearedAt].filter(Boolean).length;
  }

  visitNext(row: VisitRow, cleared?: { spent: string; left: string; attach: string }): boolean {
    if (!row.pulledAt) row.pulledAt = DESK_TODAY;
    else if (!row.no) row.no = this.nextNo();
    else if (!row.sentAt) row.sentAt = DESK_TODAY;
    else if (!row.clearedAt && cleared) Object.assign(row, cleared, { clearedAt: DESK_TODAY });
    else return false;
    this.save();
    return true;
  }

  visitUndo(row: VisitRow, stepId: string): void {
    const order = ['pulled', 'no', 'sent', 'cleared'];
    const from = order.indexOf(stepId);
    if (from <= 0) row.pulledAt = '';
    if (from <= 1) row.no = '';
    if (from <= 2) row.sentAt = '';
    if (from <= 3) { row.clearedAt = ''; row.spent = ''; row.left = ''; row.attach = ''; }
    this.save();
  }

  save(): void {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(this.state)); } catch { /* ignore */ }
  }

  /** บท. อัปโหลดวาระเอง — ถ้าเลือกประชุมไว้ รับเข้าระเบียบวาระของประชุมนั้นเลย */
  addManualItem(patch: { title: string; group: string; measure: string; product: string; stage: string; due: string; meetingId: string; files: ItemFile[] }): void {
    const id = `m${Date.now().toString(36)}`;
    const now = new Date();
    const slot = patch.meetingId ? this.itemsOf(patch.meetingId).length + 1 : 99;
    this.state.items.push(item({
      id, caseKey: `manual-${id}`, meetingIds: patch.meetingId ? [patch.meetingId] : [], slot, title: patch.title.trim(), product: patch.product.trim(), measure: patch.measure,
      stage: patch.stage.trim() || 'วาระที่ บท. อัปโหลด', group: patch.group, due: patch.due.trim(), status: patch.meetingId ? 'queued' : 'sent',
      sentAt: `${DESK_TODAY} · ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} น.`, sentBy: 'เจ้าหน้าที่ บท. (อัปโหลดเอง)', files: patch.files, manual: true,
    }));
    this.save();
  }

  /** เพิ่มหรือเปลี่ยนไฟล์ของวาระที่มีอยู่ (แทนที่ไฟล์ชนิดเดียวกัน) */
  attachFiles(itemId: string, files: ItemFile[]): void {
    const row = this.state.items.find((entry) => entry.id === itemId);
    if (!row || row.live || !files.length) return;
    const roles = new Set(files.map((file) => file.role));
    row.files = [...row.files.filter((file) => !roles.has(file.role)), ...files].sort((a, b) => (a.role === b.role ? 0 : a.role === 'agenda' ? -1 : 1));
    if (row.status === 'plan') {
      const now = new Date();
      row.status = 'sent';
      row.sentBy = 'เจ้าหน้าที่ บท. (อัปโหลดเอง)';
      row.sentAt = `${DESK_TODAY} · ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} น.`;
      row.manual = true;
    }
    this.save();
  }

  /** ลงรับหนังสือ — ถ้ากรอกเลขจากระบบสารบรรณมาด้วยจะเป็นแบบกรอกเอง ไม่งั้นรอ sync */
  addFiling(patch: { at: string; from: string; letterNo: string; letterDate: string; subject: string; group: string; no: string }): void {
    const no = patch.no.trim();
    this.state.filings.unshift({ id: `f${Date.now()}`, no, saraban: no ? 'manual' : 'wait', sarabanAt: no ? DESK_TODAY : '', at: patch.at, from: patch.from.trim(), letterNo: patch.letterNo.trim(), letterDate: patch.letterDate.trim(), subject: patch.subject.trim(), group: patch.group, handedAt: '' });
    this.save();
  }

  /** จำลองการดึงเลขที่ บท. ออกไว้ในระบบสารบรรณ ให้รายการที่ยังรอเลข */
  syncSaraban(id?: string): number {
    let count = 0;
    for (const row of [...this.state.filings].reverse()) {
      if (row.saraban !== 'wait' || (id && row.id !== id)) continue;
      row.no = this.nextSabanNo();
      row.saraban = 'synced';
      row.sarabanAt = DESK_TODAY;
      count += 1;
    }
    if (count) this.save();
    return count;
  }

  setSarabanNo(id: string, no: string): boolean {
    const row = this.state.filings.find((entry) => entry.id === id);
    const value = no.trim();
    if (!row || !value) return false;
    row.no = value;
    row.saraban = 'manual';
    row.sarabanAt = DESK_TODAY;
    this.save();
    return true;
  }

  sarabanTaken(no: string, exceptId = ''): boolean {
    const value = no.trim();
    return !!value && this.state.filings.some((row) => row.id !== exceptId && row.no === value);
  }

  private nextSabanNo(): string {
    const used = this.state.filings.map((row) => /^สบ\.(\d+)\/2568$/.exec(row.no)).filter((match): match is RegExpExecArray => !!match).map((match) => Number(match[1]));
    return `สบ.${(used.length ? Math.max(...used) : 1699) + 1}/2568`;
  }

  handFiling(id: string): void {
    const row = this.state.filings.find((entry) => entry.id === id);
    if (!row || row.handedAt || !row.no) return;
    row.handedAt = DESK_TODAY;
    this.save();
  }

  /** ประกาศ ทตอ. มีประกาศกรมตามมา — เปิดรายการประกาศกรมให้ติดตามต่อ */
  addDeptAnnouncement(row: GazetteRow): void {
    if (row.deptId && this.state.gazette.some((entry) => entry.id === row.deptId)) return;
    const id = `g${Date.now()}`;
    this.state.gazette.push({ id, caseCode: row.caseCode, kind: GZ_DEPT, title: row.title.replace(/^ประกาศ ทตอ\.\s*/, 'ประกาศกรมการค้าต่างประเทศ '), group: row.group, no: '', hasDept: '', deptId: '', steps: gazetteSteps(GZ_DEPT), files: [] });
    row.hasDept = 'yes';
    row.deptId = id;
    this.save();
  }

  nextNo(): string {
    this.state.seq += 1;
    this.save();
    return `eO-2568-${String(412 + this.state.seq).padStart(4, '0')}`;
  }

  /** บท. รับวาระเข้าระเบียบวาระของการประชุม */
  queue(itemId: string, meetingId = ''): void {
    const row = this.state.items.find((entry) => entry.id === itemId);
    if (!row) return;
    if (meetingId && !row.meetingIds.includes(meetingId)) row.meetingIds = [meetingId, ...row.meetingIds];
    row.status = 'queued';
    if (row.live) this.state.liveQueued = meetingId || row.meetingIds[0] || '';
    this.save();
  }

  unqueue(itemId: string): void {
    const row = this.state.items.find((entry) => entry.id === itemId);
    if (!row) return;
    row.status = row.files.length ? 'sent' : 'plan';
    if (row.live) this.state.liveQueued = '';
    this.save();
  }

  addPlan(partial: { title: string; group: string; meetingId: string; due: string; product: string; measure: string }): void {
    const target = this.meetingById(partial.meetingId);
    const slot = Math.max(0, ...this.itemsOf(partial.meetingId).map((row) => row.slot)) + 1;
    this.state.items.push(item({
      id: `p${Date.now()}`, caseKey: `p${Date.now()}`, meetingIds: [partial.meetingId], slot, title: partial.title, product: partial.product || partial.title, measure: partial.measure, stage: 'แผนวาระ', group: partial.group, due: partial.due, sentBy: target ? `บท. กรอกแทน ${partial.group}` : '',
    }));
    this.save();
  }

  move(meetingId: string, itemId: string, delta: number): void {
    const list = this.itemsOf(meetingId);
    const index = list.findIndex((row) => row.id === itemId);
    const other = list[index + delta];
    const row = list[index];
    if (!row || !other) return;
    const slot = row.slot;
    row.slot = other.slot;
    other.slot = slot;
    this.save();
  }

  /** ชื่อประชุมที่แนะนำเมื่อเพิ่มประชุมใหม่ */
  suggestName(body: BodyId, month: string, sector = ''): string {
    const label = body === 'tech' ? `${BODY_LABEL.tech} ${sector}`.trim() : BODY_LABEL[body];
    const year = month.split(' ')[1] ?? '';
    if (body === 'cpp') return `${label} (${month})`;
    const used = this.state.meetings
      .filter((row) => row.body === body && (body !== 'tech' || row.sector === sector))
      .map((row) => /ครั้งที่\s*(\d+)\/(\d{4})/.exec(row.name))
      .filter((match): match is RegExpExecArray => !!match && match[2] === year)
      .map((match) => Number(match[1]));
    return `${label} ครั้งที่ ${(used.length ? Math.max(...used) : 0) + 1}/${year}`;
  }

  addMeeting(body: BodyId, month: string, patch: MeetingPatch): string {
    const id = `m${Date.now()}`;
    const on = patch.on.trim();
    const sector = body === 'tech' ? (patch.sector ?? TECH_SECTORS[0]?.label ?? '') : undefined;
    const base = meeting({ id, body, sector, no: patch.name, name: patch.name.trim(), month: monthLabelOf(on) || month });
    this.state.meetings.push({ ...base, on, time: patch.time.trim() || base.time, place: patch.place.trim() || base.place, chair: patch.chair.trim() || base.chair, signer: patch.signer.trim() || base.signer });
    this.sortMeetings();
    this.save();
    return id;
  }

  updateMeeting(id: string, patch: MeetingPatch): void {
    const row = this.meetingById(id);
    if (!row) return;
    const on = patch.on.trim();
    row.name = patch.name.trim() || row.name;
    row.on = on;
    row.month = monthLabelOf(on) || row.month;
    row.time = patch.time.trim() || row.time;
    row.place = patch.place.trim() || row.place;
    row.chair = patch.chair.trim() || row.chair;
    row.signer = patch.signer.trim() || row.signer;
    this.sortMeetings();
    this.save();
  }

  /** ว่างถ้าลบได้ ไม่เช่นนั้นคืนเหตุผล */
  removeMeetingBlock(id: string): string {
    const row = this.meetingById(id);
    if (!row) return 'ไม่พบการประชุม';
    if (row.state !== 'plan') return 'ลบได้เฉพาะประชุมที่ยังอยู่ในแผน (ยังไม่เริ่มเตรียม)';
    const blocked = this.state.items.some((entry) => entry.meetingIds.length === 1 && entry.meetingIds[0] === id && entry.status !== 'plan');
    return blocked ? 'มีวาระที่กลุ่มส่งมาแล้วหรือรับเข้าวาระแล้ว ให้ย้ายวาระไปประชุมอื่นก่อน' : '';
  }

  removeMeeting(id: string): void {
    if (this.removeMeetingBlock(id)) return;
    this.state.items = this.state.items
      .map((entry) => (entry.meetingIds.includes(id) ? { ...entry, meetingIds: entry.meetingIds.filter((value) => value !== id) } : entry))
      .filter((entry) => entry.live || entry.meetingIds.length > 0 || entry.status !== 'plan');
    this.state.meetings = this.state.meetings.filter((row) => row.id !== id);
    this.save();
  }

  updateItem(id: string, patch: ItemPatch): void {
    const row = this.state.items.find((entry) => entry.id === id);
    if (!row || row.live) return;
    row.title = patch.title.trim() || row.title;
    row.group = patch.group;
    row.measure = patch.measure;
    row.due = patch.due.trim();
    row.product = patch.product.trim() || row.product;
    row.stage = patch.stage.trim() || row.stage;
    this.save();
  }

  removeItemBlock(id: string): string {
    const row = this.state.items.find((entry) => entry.id === id);
    if (!row) return 'ไม่พบวาระ';
    if (row.live) return 'เป็นเคสจากหน้าเจ้าหน้าที่ แก้ไขไม่ได้ที่นี่';
    if (row.status !== 'plan') return 'กลุ่มส่งวาระมาแล้ว ถอดจากเมนูวาระที่ส่งเข้ามาก่อน';
    return '';
  }

  removeItem(id: string): void {
    if (this.removeItemBlock(id)) return;
    this.state.items = this.state.items.filter((entry) => entry.id !== id);
    this.save();
  }

  moveItemTo(id: string, from: string, to: string): void {
    const row = this.state.items.find((entry) => entry.id === id);
    if (!row || !to || from === to || row.live) return;
    const slot = Math.max(0, ...this.itemsOf(to).map((entry) => entry.slot)) + 1;
    row.meetingIds = [...row.meetingIds.filter((value) => value !== from && value !== to), to];
    row.slot = slot;
    this.save();
  }

  private sortMeetings(): void {
    this.state.meetings.sort((a, b) => {
      const gap = monthKey(a.month) - monthKey(b.month);
      if (gap) return gap;
      const left = toDays(a.on);
      const right = toDays(b.on);
      return left !== null && right !== null ? left - right : 0;
    });
  }

  private syncLive(): AgendaItem[] {
    const live = readLivePack();
    const index = this.state.items.findIndex((row) => row.live);
    if (!live) {
      if (index >= 0) this.state.items.splice(index, 1);
      return this.state.items;
    }
    const queued = this.state.liveQueued;
    const next = item({
      id: 'live-ad1046', caseKey: 'ad1046', caseCode: 'AD1046', meetingIds: queued ? [queued] : [], slot: 99,
      title: 'การพิจารณาคำขอเปิดการไต่สวนการทุ่มตลาด เหล็กแผ่นรีดร้อน จากเวียดนามและอียิปต์', product: 'เหล็กแผ่นรีดร้อน', measure: 'AD ไต่สวน', stage: 'พิจารณาคำขอเปิดไต่สวน', group: 'ปค./กลุ่ม 1',
      due: '', status: live.sent ? (queued ? 'queued' : 'sent') : 'plan', sentAt: live.at, sentBy: live.by, files: live.files, live: true,
    });
    if (index >= 0) this.state.items[index] = next;
    else this.state.items.unshift(next);
    return this.state.items;
  }

  private load(): DeskState {
    try {
      const raw = JSON.parse(localStorage.getItem(STORE_KEY) || 'null') as DeskState | null;
      if (raw && raw.rev === REV && Array.isArray(raw.meetings) && Array.isArray(raw.items)) return { ...raw, desk: raw.desk ?? {} };
    } catch { /* ignore */ }
    return this.fresh();
  }

  private fresh(): DeskState {
    return { rev: REV, meetings: seedMeetings(), items: seedItems(), comments: seedComments(), gazette: seedGazette(), visits: seedVisits(), liveQueued: '', seq: 0, filings: seedFilings(), desk: seedDesk() };
  }
}

/** แพ็กวาระ+PPT ที่เจ้าหน้าที่ส่งจากหน้า POR-1 (เคส AD1046) */
function readLivePack(): { sent: boolean; at: string; by: string; files: ItemFile[] } | null {
  try {
    const sentRaw = sessionStorage.getItem('dft-por1-meeting-pack-sent');
    const filesRaw = sessionStorage.getItem('dft-por1-meeting-pack');
    const sent = sentRaw ? (JSON.parse(sentRaw) as { sent?: boolean; at?: string; by?: string }) : null;
    const rows = filesRaw ? (JSON.parse(filesRaw) as { role?: string; name?: string; title?: string; href?: string; at?: string }[]) : [];
    if (!sent?.sent || !Array.isArray(rows)) return null;
    const files: ItemFile[] = rows
      .filter((file) => (file.role === 'agenda' || file.role === 'ppt') && file.name)
      .map((file) => ({ role: file.role as 'agenda' | 'ppt', name: file.name ?? '', title: file.title ?? '', href: file.href ?? '', at: file.at ?? '' }));
    return { sent: true, at: sent.at ?? '', by: sent.by ?? 'เจ้าหน้าที่กลุ่ม', files };
  } catch {
    return null;
  }
}
