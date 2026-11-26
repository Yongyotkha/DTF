import { AgendaItem, CommentRow, DESK_TODAY, GZ_NOTICE, GazetteRow, Invitee, KIT_ROOT, Meeting, MeetingWork, SAMPLE_ROOT, SeatLayout, VisitRow, attendeesOf, daysFromToday, shortDate } from './bureau-store';

/**
 * ตัวช่วยร่างเอกสารของ บท.
 * ยังไม่ได้เชื่อมโมเดลภาษา: "AI ช่วยร่าง" สร้างเอกสารจากข้อมูลประชุม วาระ ผู้เข้าร่วม และสิ่งที่ บท. ทำในระบบ ตามรูปแบบเอกสารฉบับจริง
 * จุดต่อกับโมเดลจริงคือฟังก์ชัน ai* (คืน Promise) เปลี่ยนเฉพาะกลุ่มนี้เมื่อมี API
 */

export type StepDocDef = { key: string; label: string; optional?: boolean; upload?: boolean; sample?: string };

const KIT = (name: string) => `${KIT_ROOT}${name}`;
const AD = (path: string) => `${SAMPLE_ROOT}${path}`;

/** เอกสารของแต่ละขั้นประชุม (ทำในระบบ / AI ช่วยร่าง / อัปโหลด) — ขั้นที่ไม่มีเอกสารเป็นแค่สถานะ */
export const STEP_DOCS: Record<string, StepDocDef[]> = {
  receive: [],
  agenda: [{ key: 'agenda', label: 'ระเบียบวาระการประชุม', sample: KIT('7. วาระ 1-2-4.docx') }],
  chair: [
    { key: 'chair', label: 'บันทึกขออนุมัติวันประชุมและขอเวลาประธาน', sample: KIT('2. บันทึก เสนอปลัด ขอเวลาประธาน คปป..docx') },
    { key: 'chairSigned', label: 'บันทึกที่ลงนามแล้ว (สแกนกลับ)', optional: true, upload: true },
  ],
  room: [{ key: 'room', label: 'บันทึกขอใช้ห้องประชุมและจัดเตรียมอาหารว่าง', sample: KIT('3. ขอใช้ห้องประชุม คปป.4-69.doc') }],
  invite: [
    { key: 'invite', label: 'หนังสือเชิญประชุม', sample: KIT('4. หนังสือครุฑ.docx') },
    { key: 'inviteMemo', label: 'บันทึกเชิญประชุม (ภายในกระทรวง)', optional: true, sample: KIT('4. บันทึกปลัด.docx') },
  ],
  brief: [
    { key: 'brief', label: 'Chairman’s note และร่างมติ', sample: AD('draft/sub-6 Chairman อนุไต่สวน.docx') },
    { key: 'seatDraft', label: 'ร่างผังที่นั่ง', optional: true },
  ],
  book: [
    { key: 'book', label: 'เล่มวาระการประชุม (หน้าปก สารบัญ ระเบียบวาระ เอกสารประกอบ)', sample: KIT('7. หน้าปก 4-2569.docx') },
    { key: 'cover', label: 'หนังสือส่งเล่มวาระให้หน่วยงานที่เกี่ยวข้อง', optional: true },
  ],
  allow: [
    { key: 'allow', label: 'บันทึกขออนุมัติเบี้ยประชุม', sample: KIT('6. ขอเบิกค่าเบี้ยปรระชุมคปป..docx') },
    { key: 'parking', label: 'บันทึกขอที่จอดรถ', optional: true, sample: KIT('5. บันทึกที่จอดรถคปป..docx') },
  ],
  rsvp: [],
  seat: [{ key: 'seat', label: 'ผังที่นั่ง ป้ายชื่อ และใบลงชื่อผู้เข้าร่วมประชุม', sample: KIT('9. ผังที่นั่ง + รายชื่อประชุม คปป. 4-69.pdf') }],
  transcript: [{ key: 'resolution', label: 'ร่างมติที่ประชุม (ถอดเทปเฉพาะประธานและมติ)', sample: KIT('11. มติ คปป 4-69.docx') }],
  sign: [{ key: 'signed', label: 'มติที่ประธานเห็นชอบและกรมลงนามแล้ว (สแกนกลับ)', upload: true }],
  circulate: [
    { key: 'minutes', label: 'รายงานการประชุม', sample: KIT('12. รายงาน คปป. 4-69.docx') },
    { key: 'circular', label: 'หนังสือส่งรายงานการประชุมให้กรรมการรับรอง' },
  ],
  comments: [{ key: 'fixlist', label: 'สรุปความเห็นกรรมการและข้อความที่แก้ไข (ลงวาระที่ 2 ครั้งถัดไป)', optional: true }],
  reports: [
    { key: 'report', label: 'บันทึกเสนอกรม รายงานมติและผลการประชุม', sample: AD('draft/sub-5 รายงานอนุไต่ฯ 31 สค 64.docx') },
    { key: 'reportSigned', label: 'บันทึกที่ลงนามแล้ว (สแกนกลับ)', optional: true, upload: true },
  ],
  clearbreak: [{ key: 'snack', label: 'รายชื่อเคลียร์เบรก (เบิกค่าอาหารว่าง)', sample: KIT('13. เบิกค่าอาหารว่าง ประชุม คปป. (4-69).docx') }],
  claim: [{ key: 'claim', label: 'บันทึกเบิกเบี้ยประชุมตามรายชื่อผู้เข้าร่วมจริง', sample: KIT('6. ขอเบิกค่าเบี้ยปรระชุมคปป..docx') }],
};

const DUTY = (name: string) => AD(`final/duty/${name}`);
const DEPT = (name: string) => AD(`final/dept/${name}`);

/** เอกสารของแต่ละขั้นในการส่งประกาศลงราชกิจจานุเบกษา (ตามลำดับขั้นใน gazetteSteps) */
export function gazetteDocs(kind: string, index: number): StepDocDef[] {
  if (kind === GZ_NOTICE) {
    return ([
      [{ key: 'gz-legal', label: 'บันทึกส่งร่างประกาศให้ กม. ตรวจ', sample: DUTY('1 บันทึกถึง กม  ตรวจประกาศ.docx') }],
      [{ key: 'gz-print', label: 'ร่างประกาศ ทตอ. ฉบับพิมพ์ให้ผู้มีอำนาจลงนาม', sample: DUTY('ประกาศ ทตอ-เหล็กรีดร้อนเวียดนาม อียิปต์ final.docx') }, { key: 'gz-memo', label: 'บันทึกเสนอลงนามประกาศ', optional: true, sample: DUTY('3. บันทึกอธิบดี เสนอปลัด รมวลงนามประกาศทตอ.docx') }],
      [{ key: 'gz-signed', label: 'ประกาศ ทตอ. ฉบับที่ลงนามแล้ว (สแกน)', upload: true }],
      [{ key: 'gz-send', label: 'หนังสือนำส่งประกาศลงราชกิจจานุเบกษา', sample: DUTY('5.1 บันทึกเสนออธิบดีลงนามส่งราชกิจจา.docx') }],
      [{ key: 'gz-published', label: 'ประกาศที่ลงในราชกิจจานุเบกษา (PDF)', upload: true }],
    ] as StepDocDef[][])[index] ?? [];
  }
  return ([
    [{ key: 'gz-legal', label: 'บันทึกส่งร่างประกาศกรมให้ กม. ตรวจ', sample: DEPT('1 บันทึกถึง กม  ตรวจประกาศ.docx') }],
    [{ key: 'gz-approve', label: 'บันทึกเสนอหัวหน้ากลุ่มและ ผอ. อนุมัติ ส่งอธิบดีลงนาม', sample: DEPT('1. บันทึก ถึง อธ ลงนามประกาศกรมชั้นที่สุด.docx') }],
    [{ key: 'gz-signed', label: 'ประกาศกรมฉบับที่อธิบดีลงนามแล้ว', upload: true }],
    [{ key: 'gz-send', label: 'หนังสือนำส่งประกาศกรมลงราชกิจจานุเบกษา', sample: DEPT('2. หนังสือถึงเลขาธิการครม.docx') }],
    [],
    [],
    [],
    [{ key: 'gz-notify', label: 'หนังสือแจ้งประกาศผลถึงผู้มีส่วนได้เสีย', sample: AD('final/deptLetters/3.หนังสือผู้นำเข้าส่งประกาศกรม.docx') }],
    [{ key: 'gz-published', label: 'ประกาศกรมที่ลงในราชกิจจานุเบกษา (PDF)', upload: true }],
  ] as StepDocDef[][])[index] ?? [];
}

/** เอกสารของการ Visit แยกตามขั้น */
export const VISIT_DOCS: Record<string, StepDocDef[]> = {
  pulled: [],
  no: [],
  sent: [{ key: 'visit-send', label: 'บันทึกส่งเอกสารเบิกเงินคลัง', sample: AD('visit/expense/11 บันทึกส่งเอกสารเบิกและคืนเงินยืม.docx') }],
  cleared: [
    { key: 'visit-clear', label: 'สรุปค่าใช้จ่ายและเคลียร์เงินยืม', sample: AD('visit/expense/8 สรุปค่าใช้จ่าย.docx') },
    { key: 'visit-proof', label: 'ใบเสร็จและหลักฐานการจ่ายเงิน', upload: true },
  ],
};

export const REF_REPORTS: { name: string; href: string; from: string }[] = [
  { name: 'รายงานการประชุม ทตอ. HR 9 พ.ย. 2563', href: AD('agenda/tdc/6. รายงานการประชุม HR 9 พย 63.docx'), from: 'AD1046 · ทตอ.' },
  { name: 'มติคณะกรรมการ ทตอ. HR', href: AD('agenda/tdc/5. มติคณะกรรมการ ทตอ.docx'), from: 'AD1046 · ทตอ.' },
  { name: 'มติ คปป. ครั้งที่ 4/2569', href: KIT('11. มติ คปป 4-69.docx'), from: 'ตัวอย่างฉบับจริง · คปป.' },
  { name: 'รายงาน คปป. ครั้งที่ 4/2569', href: KIT('12. รายงาน คปป. 4-69.docx'), from: 'ตัวอย่างฉบับจริง · คปป.' },
];

const OFFICE = 'กรมการค้าต่างประเทศ กองปกป้องและตอบโต้ทางการค้า (กลุ่ม บท.)';
const today = () => shortDate(DESK_TODAY);
const when = (meeting: Meeting) => (meeting.on ? `วันที่ ${shortDate(meeting.on)} เวลา ${meeting.time}` : 'วัน เวลา (ยังไม่กำหนด)');
const where = (meeting: Meeting) => meeting.place || '(ยังไม่กำหนดสถานที่)';
const isElectronic = (text: string) => /อิเล็กทรอนิกส์/.test(text);
const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
export const money = (value: number) => value.toLocaleString('th-TH');

export const esc = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// ───────────────────────── ส่วนประกอบเอกสาร (HTML สำหรับ editor) ─────────────────────────

const p = (html: string, style = '') => `<p style="margin:0;${style}">${html || '<br>'}</p>`;
const blank = () => p('');
const para = (text: string) => p(esc(text), 'text-indent:2.5em');
const line = (text: string) => p(esc(text));
const bold = (text: string) => p(`<strong>${esc(text)}</strong>`);
const center = (text: string, size = 16) => p(`<strong>${esc(text)}</strong>`, `text-align:center;font-size:${size}pt`);
const sign = (name: string, role = '') => [blank(), p(`(${esc(name)})`, 'padding-left:50%;text-align:center'), role ? p(esc(role), 'padding-left:50%;text-align:center') : ''].join('');
const cell = 'border:1px solid #0E2346;padding:4px 6px;vertical-align:top';

function table(head: string[], rows: string[][]): string {
  const th = head.map((value) => `<td style="${cell}"><strong>${esc(value)}</strong></td>`).join('');
  const body = rows.map((row) => `<tr>${row.map((value) => `<td style="${cell}">${esc(value)}</td>`).join('')}</tr>`).join('');
  return `<table class="amend-table" style="border-collapse:collapse;width:100%"><tbody><tr>${th}</tr>${body}</tbody></table>`;
}

function memo(subject: string, to: string): string {
  return [
    center('บันทึกข้อความ', 20),
    p(`<strong>ส่วนราชการ</strong> ${esc(OFFICE)}`),
    p(`<strong>ที่</strong> พณ 0804/........&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<strong>วันที่</strong> ${esc(today())}`),
    p(`<strong>เรื่อง</strong> ${esc(subject)}`),
    blank(),
    p(`<strong>เรียน</strong> ${esc(to)}`),
    blank(),
  ].join('');
}

function letter(subject: string, to: string, attach = ''): string {
  return [
    p('ที่ พณ 0804/ว........', 'text-align:left'),
    p('กรมการค้าต่างประเทศ<br>563 ถนนนนทบุรี ตำบลบางกระสอ<br>อำเภอเมืองนนทบุรี จังหวัดนนทบุรี 11000', 'padding-left:55%'),
    blank(),
    p(esc(today()), 'padding-left:45%'),
    blank(),
    p(`<strong>เรื่อง</strong> ${esc(subject)}`),
    p(`<strong>เรียน</strong> ${esc(to)}`),
    attach ? p(`<strong>สิ่งที่ส่งมาด้วย</strong> ${esc(attach)}`) : '',
    blank(),
  ].join('');
}

function dueText(row: AgendaItem): string {
  if (!row.due) return '';
  const days = daysFromToday(row.due);
  return `ครบกำหนดตามกฎหมาย ${shortDate(row.due)}${days !== null ? (days >= 0 ? ` (อีก ${days} วัน)` : ` (เลยกำหนด ${-days} วัน)`) : ''}`;
}

function fileCount(row: AgendaItem): string {
  return row.files.length ? `${row.files.length} ไฟล์ (${row.files.map((file) => (file.role === 'agenda' ? 'วาระอนุ' : 'PowerPoint')).join(', ')})` : 'ยังไม่มีไฟล์';
}

/** ข้อความที่เสนอที่ประชุม ตามขั้นตอนของเรื่อง */
export function askOf(row: AgendaItem): string {
  const text = `${row.stage} ${row.title}`;
  if (/ชั้นที่สุด/.test(text)) return 'เสนอที่ประชุมพิจารณาให้ความเห็นชอบผลการไต่สวนชั้นที่สุด';
  if (/ร่างผล/.test(text)) return 'เสนอที่ประชุมพิจารณาให้ความเห็นชอบร่างผลการพิจารณา ก่อนเสนอผู้มีอำนาจในขั้นต่อไป';
  if (/คำขอ/.test(text)) return 'เสนอที่ประชุมพิจารณาคำขอ และให้ความเห็นว่าจะดำเนินการต่อหรือไม่';
  if (/ทบทวน/.test(text)) return 'เสนอที่ประชุมพิจารณาการทบทวนตามที่กลุ่มเสนอ';
  return 'เสนอที่ประชุมเพื่อพิจารณา';
}

export function resolutionOf(row: AgendaItem): string {
  const text = `${row.stage} ${row.title}`;
  if (/ชั้นที่สุด/.test(text)) return `ที่ประชุมพิจารณาแล้ว มีมติเห็นชอบผลการไต่สวนชั้นที่สุด ตามที่ ${row.group} เสนอ`;
  if (/ร่างผล/.test(text)) return `ที่ประชุมพิจารณาแล้ว มีมติเห็นชอบร่างผลการพิจารณา ตามที่ ${row.group} เสนอ และให้ดำเนินการในขั้นตอนต่อไป`;
  if (/คำขอ/.test(text)) return `ที่ประชุมพิจารณาแล้ว มีมติเห็นชอบให้ดำเนินการตามคำขอ ตามที่ ${row.group} เสนอ`;
  return `ที่ประชุมพิจารณาแล้ว มีมติเห็นชอบตามที่ ${row.group} เสนอ`;
}

export type DocCtx = { meeting: Meeting; items: AgendaItem[]; prev?: Meeting; next?: Meeting; work: MeetingWork; comments: CommentRow[] };

/** ตรวจข้อมูลที่ขาดหรือน่าสังเกต ใช้เป็น "ข้อสังเกตจาก AI" */
export function checkMeeting(ctx: DocCtx): string[] {
  const out: string[] = [];
  const { meeting, items } = ctx;
  if (!meeting.on) out.push('ยังไม่ได้กำหนดวันประชุม ระบุได้ที่ขั้น “ยืนยันวันที่ อัปโหลดเอกสารที่สแกนกลับ และจองห้องประชุม”');
  if (!items.length) out.push('ยังไม่มีวาระที่รับเข้า');
  const noFile = items.map((row, index) => ({ row, no: index + 1 })).filter((entry) => !entry.row.files.some((file) => file.role === 'agenda'));
  if (noFile.length) out.push(`วาระข้อ 3.${noFile.map((entry) => entry.no).join(', 3.')} ยังไม่มีไฟล์วาระที่ ผอ. อนุมัติ`);
  items
    .map((row, index) => ({ row, no: index + 1, days: row.due ? daysFromToday(row.due) : null }))
    .filter((entry) => entry.days !== null && entry.days <= 45)
    .forEach((entry) => {
      const gap = entry.days as number;
      out.push(`วาระข้อ 3.${entry.no} ${gap >= 0 ? `ครบกำหนดตามกฎหมายอีก ${gap} วัน` : `เลยกำหนดตามกฎหมายแล้ว ${-gap} วัน`} ไม่ควรเลื่อนไปประชุมครั้งถัดไป`);
    });
  const sorted = [...items].filter((row) => row.due).sort((a, b) => (daysFromToday(a.due) ?? 0) - (daysFromToday(b.due) ?? 0));
  if (sorted.length > 1 && sorted[0] && items.indexOf(sorted[0]) > 0) out.push(`เรื่องที่ใกล้ครบกำหนดที่สุดคือวาระข้อ 3.${items.indexOf(sorted[0]) + 1} ควรเรียงขึ้นมาก่อน (ปุ่ม “จัดลำดับตามวันครบกำหนด”)`);
  return out;
}

export type BriefText = { note: string; resolution: string };
export type MinuteText = { chair: string; resolution: string };

export function templateBrief(row: AgendaItem): BriefText {
  return { note: `เรื่อง: ${row.title}\nกลุ่มเจ้าของเรื่อง: ${row.group} · มาตรการ: ${row.measure} · ขั้นตอน: ${row.stage}\n${askOf(row)}`, resolution: resolutionOf(row) };
}

export async function aiBrief(row: AgendaItem): Promise<BriefText> {
  await delay(500);
  const lines = [`เรื่อง: ${row.title}`, `กลุ่มเจ้าของเรื่อง: ${row.group} · มาตรการ: ${row.measure} · ขั้นตอน: ${row.stage}`, `ผลิตภัณฑ์: ${row.product}`, '', 'ประเด็นที่ประธานควรทราบ', `- ${askOf(row)}`];
  if (row.due) lines.push(`- ${dueText(row)}`);
  lines.push(`- เอกสารประกอบ: ${fileCount(row)}`);
  if (row.sentAt) lines.push(`- กลุ่มส่งวาระเมื่อ ${row.sentAt}`);
  lines.push('', 'ข้อควรระวัง', '- ตรวจว่ากรรมการได้รับวาระและ PowerPoint ก่อนประชุม', '- หากมีความเห็นต่าง ให้บันทึกเหตุผลลงรายงานการประชุม');
  return { note: lines.join('\n'), resolution: resolutionOf(row) };
}

export function templateMinute(row: AgendaItem, brief?: BriefText): MinuteText {
  return { chair: '', resolution: brief?.resolution || resolutionOf(row) };
}

/** ถอดเทปเฉพาะประธานและมติ — ใช้ร่างมติจากบรีฟประธานเป็นตั้งต้น */
export async function aiMinute(row: AgendaItem, brief?: BriefText): Promise<MinuteText> {
  await delay(500);
  const chair = `ประธานฯ สรุปว่า ${row.group} ได้นำเสนอ${row.stage ? `${row.stage} ` : ''}เรื่อง${row.product} แล้ว ${askOf(row).replace('เสนอที่ประชุม', 'ขอให้ที่ประชุม')} หากไม่มีกรรมการท่านใดมีความเห็นเพิ่มเติม ขอให้ที่ประชุมมีมติตามที่ฝ่ายเลขานุการเสนอ`;
  return { chair, resolution: brief?.resolution || resolutionOf(row) };
}

// ───────────────────────── ผังที่นั่ง ─────────────────────────

export const SEAT_LAYOUTS: { id: SeatLayout; label: string }[] = [
  { id: 'u', label: 'โต๊ะรูปตัวยู' },
  { id: 'oval', label: 'โต๊ะวงรี' },
  { id: 'class', label: 'โต๊ะหัวห้อง และแถวตามขวาง' },
];

export type Pt = { x: number; y: number };
export type SeatShape = { tag: 'ellipse' | 'rect' | 'path'; attrs: Record<string, string | number> };
export type SeatGeometry = { w: number; h: number; pts: Pt[]; shapes: SeatShape[] };

/** ลำดับตำแหน่งจากกลางออกไปสลับขวา-ซ้าย (ประธานอยู่กลาง ที่นั่งถัดไปอยู่ขวามือและซ้ายมือสลับกัน) */
function fan(n: number, wrap: boolean): number[] {
  const mid = wrap ? 0 : Math.floor((n - 1) / 2);
  const out = [mid];
  for (let k = 1; out.length < n && k <= n + 1; k += 1) {
    for (const raw of [mid + k, mid - k]) {
      const value = wrap ? ((raw % n) + n) % n : raw;
      if (out.length < n && value >= 0 && value < n && !out.includes(value)) out.push(value);
    }
  }
  return out;
}

function along(path: Pt[], count: number): Pt[] {
  const lengths = path.slice(1).map((point, index) => Math.hypot(point.x - (path[index] as Pt).x, point.y - (path[index] as Pt).y));
  const total = lengths.reduce((sum, value) => sum + value, 0);
  return Array.from({ length: count }, (_, index) => {
    let rest = ((index + 0.5) / count) * total;
    for (let segment = 0; segment < lengths.length; segment += 1) {
      const size = lengths[segment] as number;
      if (rest <= size || segment === lengths.length - 1) {
        const from = path[segment] as Pt;
        const to = path[segment + 1] as Pt;
        const ratio = size ? Math.min(1, rest / size) : 0;
        return { x: Math.round(from.x + (to.x - from.x) * ratio), y: Math.round(from.y + (to.y - from.y) * ratio) };
      }
      rest -= size;
    }
    return path[0] as Pt;
  });
}

/** ตำแหน่งที่นั่งตามหมายเลข (pts[0] คือที่นั่งหมายเลข 1 ซึ่งเป็นประธาน) */
export function seatGeometry(layout: SeatLayout, count: number): SeatGeometry {
  const n = Math.max(count, 1);
  if (layout === 'oval') {
    const cx = 280;
    const cy = 180;
    const pts = fan(n, true).map((ring) => {
      const angle = (-90 + (ring * 360) / n) * (Math.PI / 180);
      return { x: Math.round(cx + 190 * Math.cos(angle)), y: Math.round(cy + 112 * Math.sin(angle)) };
    });
    return { w: 560, h: 360, pts, shapes: [{ tag: 'ellipse', attrs: { cx, cy, rx: 140, ry: 74 } }] };
  }
  if (layout === 'u') {
    const slots = along([{ x: 38, y: 330 }, { x: 38, y: 40 }, { x: 522, y: 40 }, { x: 522, y: 330 }], n);
    return { w: 560, h: 360, pts: fan(n, false).map((slot) => slots[slot] as Pt), shapes: [{ tag: 'path', attrs: { d: 'M70 330 V72 H490 V330' } }] };
  }
  const head = Math.min(3, n);
  const headX = [280, 360, 200];
  const pts: Pt[] = Array.from({ length: head }, (_, index) => ({ x: headX[index] as number, y: 84 }));
  const rest = n - head;
  const perRow = Math.min(6, Math.max(rest, 1));
  const rows = Math.ceil(rest / perRow);
  for (let index = 0; index < rest; index += 1) {
    const row = Math.floor(index / perRow);
    const col = index % perRow;
    const inRow = Math.min(perRow, rest - row * perRow);
    const gap = 400 / Math.max(inRow, 1);
    pts.push({ x: Math.round(80 + gap * (col + 0.5)), y: 160 + row * 62 });
  }
  const shapes: SeatShape[] = [{ tag: 'rect', attrs: { x: 170, y: 26, width: 220, height: 28, rx: 6 } }];
  for (let row = 0; row < rows; row += 1) shapes.push({ tag: 'rect', attrs: { x: 60, y: 160 + row * 62 + 22, width: 440, height: 14, rx: 6 } });
  return { w: 560, h: Math.max(360, 160 + rows * 62 + 24), pts, shapes };
}

function rank(role: string, index: number): number {
  if (/^ประธาน/.test(role)) return index / 1000;
  if (/รองประธาน|ปลัด/.test(role)) return 1 + index / 1000;
  if (/ผู้ช่วยเลขานุการ|ผู้ช่วยเลขา/.test(role)) return 3 + index / 1000;
  if (/เลขานุการ/.test(role)) return 2 + index / 1000;
  return 4 + index / 1000;
}

/** ผู้ที่ต้องมีที่นั่งในห้อง (ไม่รวมผู้ที่แจ้งไม่มา และผู้ที่เข้าร่วมผ่านสื่ออิเล็กทรอนิกส์) */
export function seatAttendees(invitees: Invitee[]): Invitee[] {
  return invitees.filter((row) => row.rsvp !== 'no' && !isElectronic(`${row.role} ${row.by}`));
}

export function onlineAttendees(invitees: Invitee[]): Invitee[] {
  return invitees.filter((row) => row.rsvp !== 'no' && isElectronic(`${row.role} ${row.by}`));
}

export async function aiSeat(invitees: Invitee[]): Promise<{ order: string[]; notes: string[] }> {
  await delay(600);
  const seated = seatAttendees(invitees);
  const order = seated.map((row, index) => ({ row, score: rank(row.role, index) })).sort((a, b) => a.score - b.score).map((entry) => entry.row.id);
  const notes = ['ประธานนั่งกึ่งกลาง รองประธานและเลขานุการอยู่ใกล้ประธาน ผู้ช่วยเลขานุการอยู่ถัดไป ที่เหลือเรียงตามลำดับในรายชื่อ'];
  const online = onlineAttendees(invitees).length;
  if (online) notes.push(`ผู้เข้าร่วมผ่านสื่ออิเล็กทรอนิกส์ ${online} คน ไม่จัดที่นั่งในห้อง`);
  const absent = invitees.filter((row) => row.rsvp === 'no').length;
  if (absent) notes.push(`ตัดผู้แจ้งไม่มา ${absent} คนออกจากผัง`);
  return { order, notes };
}

export function seatSvg(layout: SeatLayout, count: number): string {
  const geo = seatGeometry(layout, count);
  const shapes = geo.shapes.map((shape) => {
    const attrs = Object.entries(shape.attrs).map(([key, value]) => `${key}="${value}"`).join(' ');
    return shape.tag === 'path' ? `<path ${attrs} fill="none" stroke="#E6F1F9" stroke-width="30"/>` : `<${shape.tag} ${attrs} fill="#E6F1F9" stroke="#D3D4D6"/>`;
  }).join('');
  const dots = geo.pts.map((pt, index) => `<circle cx="${pt.x}" cy="${pt.y}" r="15" fill="#0E2346"/><text x="${pt.x}" y="${pt.y + 5}" text-anchor="middle" font-size="14" fill="#FFFFFF">${index + 1}</text>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${geo.w} ${geo.h}" width="100%" style="max-width:${geo.w}px">${shapes}${dots}</svg>`;
}

// ───────────────────────── เอกสารการประชุม ─────────────────────────

function payable(ctx: DocCtx, list: Invitee[]): Invitee[] {
  return list.filter((row) => !ctx.work.skipPay.includes(row.id));
}

function seatRows(ctx: DocCtx): Invitee[] {
  const seated = seatAttendees(ctx.meeting.invitees);
  const order = ctx.work.seat?.order ?? [];
  const map = new Map(seated.map((row) => [row.id, row]));
  return [...order.filter((id) => map.has(id)), ...seated.map((row) => row.id).filter((id) => !order.includes(id))].map((id) => map.get(id) as Invitee);
}

function seatBlock(ctx: DocCtx, final: boolean): string {
  const rows = seatRows(ctx);
  const layout = ctx.work.seat?.layout ?? 'u';
  const online = onlineAttendees(ctx.meeting.invitees);
  return [
    center(final ? 'ผังที่นั่งและรายชื่อผู้เข้าร่วมประชุม' : 'ร่างผังที่นั่ง', 18),
    p(esc(`${ctx.meeting.name} · ${when(ctx.meeting)} · ${where(ctx.meeting)}`), 'text-align:center'),
    p(`รูปแบบโต๊ะ: ${esc(SEAT_LAYOUTS.find((entry) => entry.id === layout)?.label ?? '')}`, 'text-align:center'),
    p(seatSvg(layout, rows.length), 'text-align:center'),
    blank(),
    table(['ที่นั่ง', 'ตำแหน่ง', 'สถานะ', 'ลงชื่อ'], rows.map((row, index) => [String(index + 1), row.role, row.rsvp === 'proxy' ? 'ส่งผู้แทน' : row.rsvp === 'come' ? 'มา' : 'รอตอบรับ', ''])),
    online.length ? [blank(), bold('ผู้เข้าร่วมผ่านสื่ออิเล็กทรอนิกส์ (ไม่จัดที่นั่ง)'), ...online.map((row, index) => line(`${index + 1}. ${row.role}`))].join('') : '',
  ].join('');
}

function agendaBlock(ctx: DocCtx): string {
  const { meeting, items, prev } = ctx;
  return [
    center(`ระเบียบวาระการประชุม${meeting.name}`, 18),
    p(esc(when(meeting)), 'text-align:center'),
    p(esc(`ณ ${where(meeting)}`), 'text-align:center'),
    blank(),
    bold('วาระที่ 1 เรื่องที่ประธานแจ้งให้ที่ประชุมทราบ'),
    bold(`วาระที่ 2 รับรองรายงานการประชุม${prev ? prev.name : 'ครั้งที่ผ่านมา'}`),
    bold('วาระที่ 3 เรื่องเพื่อพิจารณา'),
    ...(items.length ? items.flatMap((row, index) => [
      p(esc(`3.${index + 1} ${row.title}`), 'padding-left:2em'),
      p(esc(`${row.group} · ${row.measure}${row.due ? ` · ${dueText(row)}` : ''}`), 'padding-left:4em'),
      p(esc(`${askOf(row)} · เอกสารประกอบ: ${fileCount(row)}`), 'padding-left:4em'),
    ]) : [p('(ยังไม่มีวาระที่รับเข้า)', 'padding-left:2em')]),
    bold('วาระที่ 4 เรื่องอื่น ๆ (ถ้ามี)'),
  ].join('');
}

function briefBlock(ctx: DocCtx): string {
  return ctx.items.map((row, index) => {
    const brief = ctx.work.briefs[row.id] ?? templateBrief(row);
    return [
      index ? '<div class="word-page-break" data-page-break="1" contenteditable="false"></div>' : '',
      center(`Chairman’s Note วาระที่ 3.${index + 1}`, 18),
      p(esc(row.title), 'text-align:center'),
      blank(),
      ...brief.note.split('\n').map((text) => line(text)),
      blank(),
      bold('ร่างมติ'),
      para(brief.resolution),
    ].join('');
  }).join('') || line('(ยังไม่มีวาระที่รับเข้า)');
}

function minuteOf(ctx: DocCtx, row: AgendaItem): MinuteText {
  return ctx.work.minutes?.[row.id] ?? templateMinute(row, ctx.work.briefs[row.id]);
}

export function meetingDocHtml(key: string, ctx: DocCtx): string {
  const { meeting, items, prev, work } = ctx;
  const name = meeting.name;
  const guests = Number(work.guests) || meeting.invitees.length;
  const chairTo = meeting.body === 'tdc' || meeting.body === 'cpp' ? 'ปลัดกระทรวงพาณิชย์' : 'อธิบดีกรมการค้าต่างประเทศ';
  const attended = attendeesOf(meeting);
  const absent = meeting.invitees.filter((row) => row.rsvp === 'no' || (work.noShow ?? []).includes(row.id));
  switch (key) {
    case 'agenda':
      return agendaBlock(ctx);
    case 'chair': {
      const urgent = items.filter((row) => row.due && (daysFromToday(row.due) ?? 999) <= 45);
      return [
        memo(`ขออนุมัติจัดการประชุมและขอเวลา${meeting.chair}เป็นประธานการประชุม${name}`, chairTo),
        para(`ด้วยกลุ่ม บท. กำหนดจัดการประชุม${name} ใน${when(meeting)} ณ ${where(meeting)} มีระเบียบวาระเพื่อพิจารณา ${items.length} เรื่อง ดังนี้`),
        ...items.map((row, index) => p(esc(`3.${index + 1} ${row.title}`), 'padding-left:2.5em')),
        para(urgent.length ? `ทั้งนี้ มี ${urgent.length} เรื่องที่ใกล้ครบกำหนดตามกฎหมาย จึงขอเรียนเพื่อโปรดพิจารณากำหนดเวลาให้ทันตามกำหนด` : 'ทั้งนี้ ไม่มีเรื่องที่ใกล้ครบกำหนดตามกฎหมายภายใน 45 วัน'),
        para(`จึงเรียนมาเพื่อโปรดพิจารณาอนุมัติ และขอเวลา${meeting.chair}เป็นประธานการประชุมตามวันและเวลาข้างต้น`),
        sign(meeting.signer),
      ].join('');
    }
    case 'room':
      return [
        memo(`ขอใช้ห้องประชุมและขอจัดเตรียมอาหารว่างสำหรับการประชุม${name}`, 'ผู้อำนวยการสำนักบริหารกลาง (ผ่านผู้อำนวยการกองปกป้องและตอบโต้ทางการค้า)'),
        para(`กลุ่ม บท. ขอใช้ ${where(meeting)} สำหรับการประชุม${name} ใน${when(meeting)} มีผู้เข้าร่วมประชุมประมาณ ${guests} คน`),
        para(work.snack ? `และขอจัดเตรียมอาหารว่างและเครื่องดื่มสำหรับผู้เข้าร่วมประชุม จำนวน ${guests} ชุด` : 'ไม่ขอจัดเตรียมอาหารว่างและเครื่องดื่ม'),
        para(isElectronic(meeting.place) ? 'การประชุมมีผู้เข้าร่วมผ่านสื่ออิเล็กทรอนิกส์ จึงขอให้ตรวจสอบระบบภาพและเสียงก่อนวันประชุม' : 'ขอให้จัดเตรียมไมโครโฟน เครื่องฉายภาพ และป้ายชื่อตามผังที่นั่งก่อนเวลาประชุมอย่างน้อย 30 นาที'),
        para('จึงเรียนมาเพื่อโปรดพิจารณาอนุเคราะห์'),
        sign(meeting.signer),
      ].join('');
    case 'invite':
      return [
        letter(`เชิญประชุม${name}`, 'ท่านกรรมการและผู้เกี่ยวข้อง (ตามรายชื่อแนบท้าย)', '1. ระเบียบวาระการประชุม  2. เอกสารประกอบการประชุม'),
        para(`ด้วยกรมการค้าต่างประเทศ กำหนดจัดการประชุม${name} ใน${when(meeting)} ณ ${where(meeting)} โดยมี${meeting.chair}เป็นประธาน เพื่อพิจารณาเรื่องสำคัญ ${items.length} เรื่อง รายละเอียดปรากฏตามระเบียบวาระที่แนบ`),
        para(isElectronic(meeting.place) ? 'ผู้ที่ประสงค์เข้าร่วมผ่านสื่ออิเล็กทรอนิกส์ โปรดแจ้งอีเมลเพื่อรับลิงก์เข้าประชุม' : 'โปรดมาถึงสถานที่ประชุมก่อนเวลาอย่างน้อย 15 นาที เพื่อลงทะเบียน'),
        para('หากไม่สามารถเข้าร่วมได้ โปรดแจ้งตอบรับหรือส่งผู้แทนมายังกลุ่ม บท. ก่อนวันประชุมอย่างน้อย 3 วันทำการ'),
        para('จึงเรียนมาเพื่อโปรดเข้าร่วมประชุมตามวันและเวลาดังกล่าว'),
        p('ขอแสดงความนับถือ', 'padding-left:50%;text-align:center'),
        sign(meeting.signer),
        blank(),
        bold('รายชื่อผู้รับหนังสือเชิญ'),
        ...meeting.invitees.map((row, index) => line(`${index + 1}. ${row.role}`)),
      ].join('');
    case 'inviteMemo':
      return [
        memo(`เชิญประชุม${name}`, chairTo),
        para(`กรมการค้าต่างประเทศ กำหนดจัดการประชุม${name} ใน${when(meeting)} ณ ${where(meeting)} จึงขอเรียนเชิญเข้าร่วมประชุมตามระเบียบวาระที่แนบ`),
        para('จึงเรียนมาเพื่อโปรดทราบและเข้าร่วมประชุม'),
        sign(meeting.signer),
      ].join('');
    case 'brief':
      return [center('ชุดเอกสารบรีฟประธาน', 20), p(esc(`${name} · ${when(meeting)}`), 'text-align:center'), blank(), briefBlock(ctx)].join('');
    case 'seatDraft':
      return seatBlock(ctx, false);
    case 'seat':
      return seatBlock(ctx, true);
    case 'book': {
      const skip = work.bookSkip;
      return [
        blank(), blank(), blank(),
        center('เล่มระเบียบวาระการประชุม', 22),
        center(name, 20),
        p(esc(when(meeting)), 'text-align:center'),
        p(esc(`ณ ${where(meeting)}`), 'text-align:center'),
        blank(),
        p('กรมการค้าต่างประเทศ กระทรวงพาณิชย์', 'text-align:center'),
        '<div class="word-page-break" data-page-break="1" contenteditable="false"></div>',
        center('สารบัญ', 18),
        table(['วาระ', 'เรื่อง', 'กลุ่มเจ้าของเรื่อง'], items.map((row, index) => [`3.${index + 1}`, row.title, row.group])),
        '<div class="word-page-break" data-page-break="1" contenteditable="false"></div>',
        agendaBlock(ctx),
        '<div class="word-page-break" data-page-break="1" contenteditable="false"></div>',
        center('เอกสารประกอบระเบียบวาระ', 18),
        ...items.flatMap((row, index) => [
          bold(`วาระที่ 3.${index + 1} ${row.title}`),
          ...(row.files.filter((file) => !skip.includes(`${row.id}:${file.role}`)).map((file) => p(esc(`- ${file.name} (${file.role === 'agenda' ? 'วาระอนุ' : 'PowerPoint'})`), 'padding-left:2em'))),
        ]),
        work.bookRefs.length ? [blank(), bold('รายงานและมติเดิมที่อ้างอิง'), ...REF_REPORTS.filter((row) => work.bookRefs.includes(row.name)).map((row) => p(esc(`- ${row.name} (${row.from})`), 'padding-left:2em'))].join('') : '',
      ].join('');
    }
    case 'cover':
      return [
        letter(`ส่งเล่มระเบียบวาระและเอกสารประกอบการประชุม${name}`, 'หน่วยงานที่เกี่ยวข้อง (ตามรายชื่อแนบท้าย)', 'เล่มระเบียบวาระการประชุม จำนวน 1 เล่ม'),
        para(`ตามที่กรมการค้าต่างประเทศได้เชิญประชุม${name} ใน${when(meeting)} ณ ${where(meeting)} นั้น กลุ่ม บท. ขอส่งเล่มระเบียบวาระและเอกสารประกอบการประชุม ประกอบด้วยหน้าปก สารบัญ ระเบียบวาระ และเอกสารประกอบ ${items.length} วาระ มาพร้อมหนังสือนี้`),
        para('จึงเรียนมาเพื่อโปรดทราบและเตรียมข้อมูลเข้าร่วมประชุม'),
        p('ขอแสดงความนับถือ', 'padding-left:50%;text-align:center'),
        sign(meeting.signer),
      ].join('');
    case 'allow': {
      const rate = Number(work.rate);
      const list = payable(ctx, meeting.invitees);
      return [
        memo(`ขออนุมัติเบิกจ่ายเบี้ยประชุม${name}`, 'อธิบดีกรมการค้าต่างประเทศ (ผ่านผู้อำนวยการกองปกป้องและตอบโต้ทางการค้า)'),
        para(`ตามที่กรมฯ กำหนดจัดการประชุม${name} ใน${when(meeting)} กลุ่ม บท. ขออนุมัติเบิกจ่ายเบี้ยประชุมให้กรรมการและผู้เข้าร่วมประชุมที่มีสิทธิ์ จำนวน ${list.length} คน`),
        para(rate > 0 ? `อัตราคนละ ${money(rate)} บาท เป็นเงินรวมทั้งสิ้น ${money(rate * list.length)} บาท` : 'อัตราคนละ ........ บาท เป็นเงินรวมทั้งสิ้น ........ บาท (ระบุอัตราตามระเบียบ)'),
        table(['ที่', 'ตำแหน่ง', 'จำนวนเงิน (บาท)'], list.map((row, index) => [String(index + 1), row.role, rate > 0 ? money(rate) : ''])),
        para('จำนวนผู้มีสิทธิ์เบิกจะปรับตามรายชื่อผู้เข้าร่วมประชุมจริง ก่อนส่งเบิกหลังประชุม'),
        para('จึงเรียนมาเพื่อโปรดพิจารณาอนุมัติ'),
        sign(meeting.signer),
      ].join('');
    }
    case 'parking':
      return [
        memo(`ขออนุเคราะห์ที่จอดรถสำหรับผู้เข้าร่วมประชุม${name}`, 'ผู้อำนวยการสำนักบริหารกลาง'),
        para(`ด้วยกรมฯ จัดการประชุม${name} ใน${when(meeting)} ณ ${where(meeting)} ผู้เข้าร่วมประชุมประมาณ ${guests} คน จึงขออนุเคราะห์ที่จอดรถสำหรับผู้เข้าร่วมประชุม และแจ้งเจ้าหน้าที่รักษาความปลอดภัยล่วงหน้า`),
        para('จึงเรียนมาเพื่อโปรดพิจารณา'),
        sign(meeting.signer),
      ].join('');
    case 'resolution':
      return [
        center(`มติที่ประชุม${name}`, 18),
        p(esc(`${when(meeting)} ณ ${where(meeting)}`), 'text-align:center'),
        blank(),
        bold('วาระที่ 1 เรื่องที่ประธานแจ้งให้ที่ประชุมทราบ'),
        para('มติ ที่ประชุมรับทราบ'),
        bold(`วาระที่ 2 รับรองรายงานการประชุม${prev ? prev.name : 'ครั้งที่ผ่านมา'}`),
        para(ctx.comments.some((row) => row.status === 'carried') ? 'มติ ที่ประชุมรับรองรายงานการประชุม โดยมีการแก้ไขตามที่กรรมการเสนอ' : 'มติ ที่ประชุมรับรองรายงานการประชุมโดยไม่มีการแก้ไข'),
        bold('วาระที่ 3 เรื่องเพื่อพิจารณา'),
        ...items.flatMap((row, index) => {
          const minute = minuteOf(ctx, row);
          return [p(`<strong>${esc(`3.${index + 1} ${row.title}`)}</strong>`, 'padding-left:2em'), minute.chair ? para(`ประธาน: ${minute.chair}`) : '', para(`มติ ${minute.resolution}`)];
        }),
        bold('วาระที่ 4 เรื่องอื่น ๆ'),
        para('มติ ไม่มี'),
        blank(),
        p('ผู้จดมติ ฝ่ายเลขานุการ (กลุ่ม บท.)', 'padding-left:50%;text-align:center'),
      ].join('');
    case 'minutes': {
      const online = onlineAttendees(attended);
      const inRoom = attended.filter((row) => !online.includes(row));
      const groups = [...new Set(items.map((row) => row.group))];
      return [
        center(`รายงานการประชุม${name}`, 18),
        p(esc(`${when(meeting)} ณ ${where(meeting)}`), 'text-align:center'),
        blank(),
        bold('ผู้มาประชุม'),
        ...inRoom.map((row, index) => line(`${index + 1}. ${row.role}${row.rsvp === 'proxy' ? ' (ผู้แทน)' : ''}`)),
        online.length ? bold('ผู้เข้าร่วมประชุมผ่านสื่ออิเล็กทรอนิกส์') : '',
        ...online.map((row, index) => line(`${index + 1}. ${row.role}`)),
        bold('ผู้ไม่มาประชุม'),
        ...(absent.length ? absent.map((row, index) => line(`${index + 1}. ${row.role}${row.by ? ` (${row.by})` : ''}`)) : [line('- ไม่มี')]),
        bold('ผู้เข้าร่วมประชุม'),
        ...groups.map((group, index) => line(`${index + 1}. เจ้าหน้าที่ ${group} (ผู้นำเสนอ)`)),
        blank(),
        para(`เริ่มประชุมเวลา ${work.startAt || meeting.time}`),
        bold('วาระที่ 1 เรื่องที่ประธานแจ้งให้ที่ประชุมทราบ'),
        para('ประธานแจ้งให้ที่ประชุมทราบถึงองค์ประชุม และเปิดการประชุม'),
        para('มติ ที่ประชุมรับทราบ'),
        bold(`วาระที่ 2 รับรองรายงานการประชุม${prev ? prev.name : 'ครั้งที่ผ่านมา'}`),
        para(`ฝ่ายเลขานุการได้ส่งรายงานการประชุม${prev ? prev.name : 'ครั้งที่ผ่านมา'} ให้กรรมการพิจารณาล่วงหน้าแล้ว`),
        para('มติ ที่ประชุมรับรองรายงานการประชุม'),
        bold('วาระที่ 3 เรื่องเพื่อพิจารณา'),
        ...items.flatMap((row, index) => {
          const minute = minuteOf(ctx, row);
          return [
            p(`<strong>${esc(`3.${index + 1} ${row.title}`)}</strong>`, 'padding-left:2em'),
            para(`ฝ่ายเลขานุการ (${row.group}) นำเสนอ${row.stage}${row.product ? ` สินค้า${row.product}` : ''} มาตรการ ${row.measure} ${askOf(row)}`),
            minute.chair ? para(minute.chair) : '',
            para(`มติ ${minute.resolution}`),
          ];
        }),
        bold('วาระที่ 4 เรื่องอื่น ๆ'),
        para('ไม่มี'),
        para(`เลิกประชุมเวลา ${work.endAt || '........ น.'}`),
        blank(),
        p('ผู้จดรายงานการประชุม<br>ฝ่ายเลขานุการ (กลุ่ม บท.)', 'padding-left:50%;text-align:center'),
        blank(),
        p(`ผู้ตรวจรายงานการประชุม<br>${esc(meeting.signer)}`, 'padding-left:50%;text-align:center'),
      ].join('');
    }
    case 'circular': {
      const days = work.replyDays || '7';
      return [
        letter(`ขอส่งรายงานการประชุม${name} เพื่อพิจารณารับรอง`, 'ท่านกรรมการ (ตามรายชื่อแนบท้าย)', `รายงานการประชุม${name}`),
        para(`ตามที่กรมการค้าต่างประเทศได้จัดการประชุม${name} เมื่อ${when(meeting)} ณ ${where(meeting)} นั้น ฝ่ายเลขานุการได้จัดทำรายงานการประชุมและประธานเห็นชอบแล้ว จึงขอส่งรายงานการประชุมมาเพื่อโปรดพิจารณา`),
        para(`หากท่านประสงค์จะแก้ไขรายงานการประชุม โปรดแจ้งฝ่ายเลขานุการ (กลุ่ม บท.) ภายใน ${days} วันทำการ นับแต่วันที่ได้รับหนังสือนี้ ทั้งทางอีเมลและหนังสือ หากพ้นกำหนดจะถือว่าท่านรับรองรายงานการประชุมดังกล่าว และจะเสนอรับรองในวาระที่ 2 ของการประชุมครั้งถัดไป`),
        para('จึงเรียนมาเพื่อโปรดพิจารณา'),
        p('ขอแสดงความนับถือ', 'padding-left:50%;text-align:center'),
        sign(meeting.signer),
        blank(),
        bold('รายชื่อกรรมการผู้รับรายงาน'),
        ...attended.map((row, index) => line(`${index + 1}. ${row.role}`)),
      ].join('');
    }
    case 'fixlist':
      return [
        center(`สรุปความเห็นกรรมการต่อรายงานการประชุม${name}`, 18),
        p(esc(`เสนอรับรองในวาระที่ 2 ${ctx.next ? ctx.next.name : 'การประชุมครั้งถัดไป'}`), 'text-align:center'),
        blank(),
        ctx.comments.length
          ? table(['ที่', 'ผู้ให้ความเห็น', 'อ้างอิง', 'ข้อความเดิม', 'ข้อความหลังแก้ไข', 'กลุ่มที่แก้'], ctx.comments.map((row, index) => [String(index + 1), row.by, row.ref, row.before, row.after, row.group]))
          : para('กรรมการไม่มีความเห็นแก้ไข รายงานผ่านการรับรองในวาระที่ 2 ของการประชุมครั้งถัดไป'),
      ].join('');
    case 'report':
      return [
        memo(`รายงานผลการประชุม${name}`, chairTo),
        para(`ตามที่กรมฯ ได้จัดการประชุม${name} เมื่อ${when(meeting)} ณ ${where(meeting)} มีผู้เข้าร่วมประชุม ${attended.length} คน ที่ประชุมได้พิจารณาเรื่องสำคัญ ${items.length} เรื่อง มีมติดังนี้`),
        ...items.map((row, index) => p(esc(`3.${index + 1} ${row.title} — ${minuteOf(ctx, row).resolution}`), 'padding-left:2.5em')),
        para('ฝ่ายเลขานุการได้จัดส่งมติที่ประชุมให้กลุ่มเจ้าของเรื่องดำเนินการในขั้นตอนต่อไปแล้ว และจะเสนอรายงานการประชุมฉบับสมบูรณ์หลังกรรมการรับรอง'),
        para('จึงเรียนมาเพื่อโปรดทราบ'),
        sign(meeting.signer),
      ].join('');
    case 'snack': {
      const rate = Number(work.snackRate);
      return [
        memo(`ขอเบิกค่าอาหารว่างและเครื่องดื่ม การประชุม${name}`, 'อธิบดีกรมการค้าต่างประเทศ (ผ่านผู้อำนวยการกองปกป้องและตอบโต้ทางการค้า)'),
        para(`ตามที่กรมฯ ได้จัดการประชุม${name} เมื่อ${when(meeting)} มีผู้เข้าร่วมประชุมจริง ${attended.length} คน ขอเบิกค่าอาหารว่างและเครื่องดื่ม${rate > 0 ? ` อัตราคนละ ${money(rate)} บาท เป็นเงิน ${money(rate * attended.length)} บาท` : ' (ระบุอัตราตามระเบียบ)'}`),
        table(['ที่', 'ผู้เข้าร่วมประชุม', 'ลายมือชื่อ'], attended.map((row, index) => [String(index + 1), row.role, ''])),
        para('จึงเรียนมาเพื่อโปรดพิจารณาอนุมัติ'),
        sign(meeting.signer),
      ].join('');
    }
    case 'claim': {
      const rate = Number(work.rate);
      const list = payable(ctx, attended);
      return [
        memo(`ขอเบิกเงินเบี้ยประชุม${name}`, 'อธิบดีกรมการค้าต่างประเทศ (ผ่านผู้อำนวยการกองปกป้องและตอบโต้ทางการค้า)'),
        para(`ตามที่ได้รับอนุมัติให้เบิกจ่ายเบี้ยประชุม${name} แล้วนั้น การประชุมจัดขึ้นเมื่อ${when(meeting)} มีผู้มีสิทธิ์รับเบี้ยประชุมที่เข้าร่วมประชุมจริง ${list.length} คน`),
        para(rate > 0 ? `อัตราคนละ ${money(rate)} บาท เป็นเงินรวมทั้งสิ้น ${money(rate * list.length)} บาท` : 'อัตราคนละ ........ บาท (ระบุตามที่ได้รับอนุมัติ)'),
        table(['ที่', 'ตำแหน่ง', 'จำนวนเงิน (บาท)', 'ลายมือชื่อผู้รับเงิน'], list.map((row, index) => [String(index + 1), row.role, rate > 0 ? money(rate) : '', ''])),
        para('จึงเรียนมาเพื่อโปรดพิจารณาอนุมัติเบิกจ่าย'),
        sign(meeting.signer),
      ].join('');
    }
  }
  return blank();
}

export function meetingNotes(key: string, ctx: DocCtx): string[] {
  const notes = ['agenda', 'chair', 'invite', 'brief', 'book'].includes(key) ? checkMeeting(ctx) : [];
  const attended = attendeesOf(ctx.meeting);
  if ((key === 'allow' || key === 'claim') && !(Number(ctx.work.rate) > 0)) notes.push('ยังไม่ได้ระบุอัตราเบี้ยประชุม ระบุในช่องด้านบนแล้วกด AI ช่วยร่างอีกครั้ง');
  if (key === 'snack' && !(Number(ctx.work.snackRate) > 0)) notes.push('ยังไม่ได้ระบุอัตราค่าอาหารว่าง');
  if ((key === 'minutes' || key === 'claim' || key === 'snack') && attended.length) notes.push(`ใช้รายชื่อผู้มาประชุมจริง ${attended.length} คน จากสถานะตอบรับและการบันทึกผู้ไม่มาในวันประชุม`);
  if (key === 'resolution' || key === 'minutes') {
    const missing = ctx.items.filter((row) => !ctx.work.minutes?.[row.id]?.chair).length;
    if (missing) notes.push(`ยังไม่มีถ้อยคำประธาน ${missing} วาระ ใช้ร่างมติจากบรีฟประธานแทน ตรวจกับเทปบันทึกการประชุมก่อนบันทึก`);
  }
  if (key === 'fixlist' && ctx.comments.some((row) => row.heavy)) notes.push('มีกรรมการที่แก้ไขหลายจุด พิจารณาส่งส่วนที่แก้กลับให้ท่านรับทราบ');
  return notes;
}

export async function aiMeetingDoc(key: string, ctx: DocCtx): Promise<{ html: string; notes: string[] }> {
  await delay(2200);
  return { html: meetingDocHtml(key, ctx), notes: meetingNotes(key, ctx) };
}

// ───────────────────────── เอกสารประกาศ ─────────────────────────

export function gazetteDocHtml(key: string, row: GazetteRow): string {
  const notice = row.kind === GZ_NOTICE;
  switch (key) {
    case 'gz-legal':
      return [
        memo(`ขอให้ตรวจร่าง${notice ? 'ประกาศคณะกรรมการพิจารณามาตรการตอบโต้การทุ่มตลาดและการอุดหนุน' : 'ประกาศกรมการค้าต่างประเทศ'}`, 'ผู้อำนวยการกองกฎหมาย'),
        para(`ด้วย ${row.group} ได้จัดทำร่าง${row.title} ตามมติที่ประชุม เพื่อประกาศในราชกิจจานุเบกษา`),
        para('กลุ่ม บท. จึงขอส่งร่างประกาศดังกล่าวมาเพื่อโปรดตรวจสอบความถูกต้องตามแบบและถ้อยคำทางกฎหมาย และแจ้งผลกลับภายใน 3 วันทำการ'),
        para('จึงเรียนมาเพื่อโปรดพิจารณา'),
        sign('ผู้อำนวยการกองปกป้องและตอบโต้ทางการค้า'),
      ].join('');
    case 'gz-print':
      return [
        center(notice ? 'ประกาศคณะกรรมการพิจารณามาตรการตอบโต้การทุ่มตลาดและการอุดหนุน' : 'ประกาศกรมการค้าต่างประเทศ', 18),
        center(row.title.replace(/^ประกาศ (ทตอ\.|กรมการค้าต่างประเทศ)\s*/, 'เรื่อง ')),
        blank(),
        para('โดยที่คณะกรรมการได้พิจารณาผลการไต่สวนแล้ว เห็นว่ามีการทุ่มตลาดและการทุ่มตลาดเป็นเหตุให้เกิดความเสียหายอย่างสำคัญแก่อุตสาหกรรมภายใน จึงเห็นสมควรเรียกเก็บอากรตอบโต้การทุ่มตลาด'),
        para('อาศัยอำนาจตามความในพระราชบัญญัติการตอบโต้การทุ่มตลาดและการอุดหนุนซึ่งสินค้าจากต่างประเทศ พ.ศ. 2542 จึงออกประกาศไว้ ดังต่อไปนี้'),
        para('ข้อ 1 ............................................................'),
        para('ข้อ 2 ............................................................'),
        para('ข้อ 3 ประกาศนี้ให้ใช้บังคับตั้งแต่วันถัดจากวันประกาศในราชกิจจานุเบกษาเป็นต้นไป'),
        blank(),
        p('ประกาศ ณ วันที่ ........................', 'padding-left:45%'),
        sign(notice ? 'ประธานกรรมการพิจารณามาตรการตอบโต้การทุ่มตลาดและการอุดหนุน' : 'อธิบดีกรมการค้าต่างประเทศ'),
      ].join('');
    case 'gz-memo':
      return [
        memo(`เสนอลงนามใน${row.title}`, 'ปลัดกระทรวงพาณิชย์ (ผ่านอธิบดีกรมการค้าต่างประเทศ)'),
        para(`ตามที่คณะกรรมการได้มีมติตามผลการพิจารณาของ ${row.group} และกองกฎหมายได้ตรวจร่างประกาศแล้ว กรมฯ จึงขอเสนอร่าง${row.title} เพื่อโปรดลงนาม`),
        para('จึงเรียนมาเพื่อโปรดพิจารณาลงนาม'),
        sign('อธิบดีกรมการค้าต่างประเทศ'),
      ].join('');
    case 'gz-approve':
      return [
        memo(`เสนอลงนามใน${row.title}`, 'อธิบดีกรมการค้าต่างประเทศ (ผ่านหัวหน้ากลุ่มและผู้อำนวยการกองปกป้องและตอบโต้ทางการค้า)'),
        para(`${row.group} ได้จัดทำร่าง${row.title} และกองกฎหมายได้ตรวจแล้ว จึงขอเสนอเพื่อโปรดลงนาม และเห็นควรส่งลงประกาศในราชกิจจานุเบกษาต่อไป`),
        para('จึงเรียนมาเพื่อโปรดพิจารณา'),
        sign('ผู้อำนวยการกองปกป้องและตอบโต้ทางการค้า'),
      ].join('');
    case 'gz-send':
      return [
        letter(`ขอส่ง${row.title} เพื่อลงประกาศในราชกิจจานุเบกษา`, 'เลขาธิการคณะรัฐมนตรี', `${row.title} จำนวน 1 ฉบับ`),
        para(`ด้วยกรมการค้าต่างประเทศ ได้ออก${row.title} ซึ่งลงนามเรียบร้อยแล้ว จึงขอส่งประกาศดังกล่าวมาเพื่อโปรดดำเนินการลงประกาศในราชกิจจานุเบกษาต่อไป`),
        para(`เลขหนังสือ e-Office: ${row.no || '(ออกเลขเมื่อบันทึกขั้นนี้)'}`),
        para('จึงเรียนมาเพื่อโปรดดำเนินการ'),
        p('ขอแสดงความนับถือ', 'padding-left:50%;text-align:center'),
        sign('อธิบดีกรมการค้าต่างประเทศ'),
      ].join('');
    case 'gz-notify':
      return [
        letter(`แจ้ง${row.title}`, 'ผู้มีส่วนได้เสีย (ผู้ส่งออก ผู้นำเข้า อุตสาหกรรมภายใน สมาคม และสถานทูต ตามรายชื่อแนบท้าย)', `${row.title} จำนวน 1 ฉบับ`),
        para(`ด้วยกรมการค้าต่างประเทศได้ออก${row.title} และนำส่งลงประกาศในราชกิจจานุเบกษาแล้ว จึงขอแจ้งมาเพื่อโปรดทราบ รายละเอียดปรากฏตามสิ่งที่ส่งมาด้วย และเผยแพร่ทางเว็บไซต์ของกองปกป้องและตอบโต้ทางการค้า`),
        para('จึงเรียนมาเพื่อโปรดทราบ'),
        p('ขอแสดงความนับถือ', 'padding-left:50%;text-align:center'),
        sign('อธิบดีกรมการค้าต่างประเทศ'),
      ].join('');
  }
  return blank();
}

export async function aiGazetteDoc(key: string, row: GazetteRow): Promise<{ html: string; notes: string[] }> {
  await delay(2200);
  const notes = [`ร่างจากข้อมูลประกาศ “${row.title}” ของ ${row.group}`];
  if (key === 'gz-print') notes.push('เนื้อหาข้อ 1–2 (อัตราอากร ผู้ผลิต/ผู้ส่งออก) ให้ยึดตามมติที่ประชุมและร่างของกลุ่ม ระบบไม่เติมตัวเลขให้');
  return { html: gazetteDocHtml(key, row), notes };
}

// ───────────────────────── เอกสาร Visit ─────────────────────────

export function visitDocHtml(key: string, row: VisitRow): string {
  if (key === 'visit-send') {
    return [
      memo(`ขอส่งเอกสารเบิกจ่ายเงิน การ${row.title}`, 'ผู้อำนวยการกองคลัง'),
      para(`ด้วย ${row.group} ได้รับอนุมัติให้${row.title}${row.abroad ? ' (ต่างประเทศ)' : ''} ${row.need}`),
      para(`กลุ่ม บท. ได้ออกเลขเอกสารเบิกในระบบ e-Office เลขที่ ${row.no || '........'} แล้ว จึงขอส่งเอกสารเบิกจ่ายเงินมาเพื่อโปรดดำเนินการ`),
      para('จึงเรียนมาเพื่อโปรดพิจารณา'),
      sign('ผู้อำนวยการกองปกป้องและตอบโต้ทางการค้า'),
    ].join('');
  }
  return [
    center(`สรุปค่าใช้จ่ายการ${row.title}`, 18),
    blank(),
    table(['รายการ', 'จำนวนเงิน (บาท)'], [['เงินที่ได้รับอนุมัติ/ยืม', row.spent && row.left ? money((Number(row.spent.replace(/,/g, '')) || 0) + (Number(row.left.replace(/,/g, '')) || 0)) : '........'], ['ใช้จ่ายจริง', row.spent || '........'], ['เงินเหลือส่งคืน', row.left || '........']]),
    blank(),
    para(`เลขเอกสาร e-Office ${row.no || '........'} ส่งกองคลังเมื่อ ${row.sentAt ? shortDate(row.sentAt) : '........'}`),
    para(`เอกสารประกอบ: ${row.attach || 'ใบเสร็จรับเงินและหลักฐานการจ่ายเงิน (แนบในระบบ)'}`),
    sign(`เจ้าหน้าที่ ${row.group}`),
  ].join('');
}

export async function aiVisitDoc(key: string, row: VisitRow): Promise<{ html: string; notes: string[] }> {
  await delay(2200);
  const notes = key === 'visit-clear' && !row.spent ? ['ยังไม่ได้กรอกยอดใช้ไปและเงินเหลือคืน กรอกในช่องด้านบนแล้วกด AI ช่วยร่างอีกครั้ง'] : [];
  return { html: visitDocHtml(key, row), notes };
}

// ───────────────────────── ไฟล์ Word ─────────────────────────

/** ห่อเนื้อหาจาก editor เป็นไฟล์ที่เปิดด้วย Word ได้ */
export function wordHtml(title: string, body: string): string {
  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" lang="th">
<head>
<meta charset="utf-8">
<title>${esc(title)}</title>
<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View></w:WordDocument></xml><![endif]-->
<style>
  @page { size: A4; margin: 2.54cm; }
  body { margin: 0 auto; max-width: 210mm; color: #0E2346; font-family: 'TH SarabunPSK', 'TH Sarabun New', Sarabun, sans-serif; font-size: 16pt; line-height: 1.15; }
  p { margin: 0 0 0.35em; }
  table { border-collapse: collapse; width: 100%; }
  td, th { border: 1px solid #0E2346; padding: 4px 8px; vertical-align: top; }
  .word-page-break { page-break-after: always; height: 0; }
</style>
</head>
<body>
${body || '<p><br></p>'}
</body>
</html>`;
}
