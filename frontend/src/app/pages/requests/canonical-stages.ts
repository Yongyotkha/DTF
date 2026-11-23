/**
 * Canonical case stages — source of truth from real AD/AC/SG folders
 * (AD1046, AD1006, AD1024, AD1054, AD1005, AD1047, AC1001…).
 *
 * Case → Edition → Stage → SubStage
 * Parallel lanes: PartyLane / AgencyLane under a stage.
 */

/** Measure family on the case folder */
export type CaseMeasure = 'AD' | 'AC' | 'SG' | 'CVD';

/** One investigation / review round under a case number */
export type EditionType = 'original' | 'ssr' | 'interim' | 'standing' | 'ac' | 'sg';

export type StageStatus = 'locked' | 'active' | 'done' | 'skipped';

export type StageTiming = 'sequential' | 'parallel' | 'optional';

/** Where work lives before / after e-TR sync */
export type StageSystem = 'm1' | 'etr' | 'both';

/** High-level phase shown on case list / stepper */
export type PhaseCode =
  | 'pre_file'
  | 'request'
  | 'support_check'
  | 'doc_review'
  | 'open_agenda'
  | 'open_notice'
  | 'questionnaire'
  | 'verify'
  | 'analysis'
  | 'prelim'
  | 'draft_final'
  | 'final'
  | 'post';

/** Maps to por1 review tabs */
export type UiReviewTab =
  | 'form'
  | 'assign'
  | 'docs'
  | 'inquiry'
  | 'prelim'
  | 'draftFinal'
  | 'finalResult'
  | 'measures'
  | 'link'
  | null;

export type AttachmentTypeCode = 'poa' | 'fs' | 't8' | 'annex' | 'encl' | 'noncon' | 'other';

export type PartyRole =
  | 'domestic'
  | 'importer'
  | 'exporter'
  | 'association'
  | 'embassy'
  | 'customs'
  | 'factory_dept'
  | 'steel_institute'
  | 'industry_council'
  | 'oie'
  | 'trade_negotiate'
  | 'applicant'
  | 'other';

export type SubStageDef = {
  code: string;
  label: string;
  timing: StageTiming;
  /** Gate text — when this sub-stage is complete */
  gate: string;
  docs: string[];
  parties?: PartyRole[];
};

export type StageDef = {
  code: string;
  phase: PhaseCode;
  label: string;
  shortLabel: string;
  timing: StageTiming;
  system: StageSystem;
  /** Sync e-TR when this stage completes with open decision */
  etrCreateCase?: boolean;
  uiTab: UiReviewTab;
  /** Edition types that include this stage by default */
  editions: EditionType[];
  /** Can skip for some edition types */
  skippableFor?: EditionType[];
  subs: SubStageDef[];
};

export type AttachmentTypeDef = {
  code: AttachmentTypeCode;
  label: string;
  requiredOnRequest: boolean;
};

export type PartyRoleDef = {
  code: PartyRole;
  label: string;
};

export type PhaseDef = {
  code: PhaseCode;
  label: string;
  /** Label when edition is sunset / SSR review */
  reviewLabel?: string;
};

/* ─── catalogs ─── */

export const attachmentTypes: AttachmentTypeDef[] = [
  { code: 'poa', label: 'หนังสือมอบอำนาจ', requiredOnRequest: true },
  { code: 'fs', label: 'งบการเงิน', requiredOnRequest: true },
  { code: 't8', label: 'ตารางข้อมูล 8.1–8.8', requiredOnRequest: true },
  { code: 'annex', label: 'ภาคผนวก', requiredOnRequest: true },
  { code: 'encl', label: 'สิ่งที่ส่งมาด้วย', requiredOnRequest: true },
  { code: 'noncon', label: 'ฉบับเปิดเผย (non-confidential)', requiredOnRequest: false },
  { code: 'other', label: 'อื่น ๆ', requiredOnRequest: false },
];

export const partyRoles: PartyRoleDef[] = [
  { code: 'applicant', label: 'ผู้ยื่นคำขอ' },
  { code: 'domestic', label: 'อุตสาหกรรมภายใน / ผู้ผลิตในประเทศ' },
  { code: 'importer', label: 'ผู้นำเข้า' },
  { code: 'exporter', label: 'ผู้ส่งออก / ผู้ผลิตต่างประเทศ' },
  { code: 'association', label: 'สมาคม' },
  { code: 'embassy', label: 'สถานทูต / สคต.' },
  { code: 'customs', label: 'กรมศุลกากร' },
  { code: 'factory_dept', label: 'กรมโรงงานอุตสาหกรรม' },
  { code: 'steel_institute', label: 'สถาบันเหล็กและเหล็กกล้าแห่งประเทศไทย' },
  { code: 'industry_council', label: 'สภาอุตสาหกรรมแห่งประเทศไทย' },
  { code: 'oie', label: 'สำนักงานเศรษฐกิจอุตสาหกรรม (สศอ.)' },
  { code: 'trade_negotiate', label: 'กรมเจรจาการค้าระหว่างประเทศ (สนค.)' },
  { code: 'other', label: 'อื่น ๆ' },
];

export const phases: PhaseDef[] = [
  { code: 'pre_file', label: 'ก่อนยื่น', reviewLabel: 'ก่อนยื่นคำขอทบทวน' },
  { code: 'request', label: 'คำขอ', reviewLabel: 'คำขอทบทวน' },
  { code: 'support_check', label: 'ตรวจประกอบคำขอ' },
  { code: 'doc_review', label: 'ตรวจเอกสาร / มอบหมาย' },
  { code: 'open_agenda', label: 'วาระเปิดไต่สวน', reviewLabel: 'วาระเปิดทบทวน' },
  { code: 'open_notice', label: 'ประกาศเปิดไต่สวน', reviewLabel: 'ประกาศเปิดทบทวน' },
  { code: 'questionnaire', label: 'แบบสอบถาม' },
  { code: 'verify', label: 'ตรวจสถานประกอบการ' },
  { code: 'analysis', label: 'ข้อมูลประกอบผล' },
  { code: 'prelim', label: 'ผลขั้นต้น' },
  { code: 'draft_final', label: 'ร่างผลสิ้นสุด', reviewLabel: 'ร่างผลการทบทวน' },
  { code: 'final', label: 'ผลสิ้นสุด', reviewLabel: 'ผลการทบทวน' },
  { code: 'post', label: 'หลังผล / ทบทวนมาตรา' },
];

const allEditions: EditionType[] = ['original', 'ssr', 'interim', 'standing', 'ac', 'sg'];
const investigationLike: EditionType[] = ['original', 'ssr', 'interim', 'standing'];
const openFlow: EditionType[] = ['original', 'ssr', 'interim', 'ac', 'sg'];

export const canonicalStages: StageDef[] = [
  {
    code: 'S00',
    phase: 'pre_file',
    label: 'ก่อนยื่น',
    shortLabel: 'ก่อนยื่น',
    timing: 'optional',
    system: 'm1',
    uiTab: null,
    editions: allEditions,
    subs: [
      { code: 'S00.1', label: 'หารือก่อนยื่น', timing: 'optional', gate: 'บันทึกหารือครบ', docs: ['บันทึกหารือ'] },
      { code: 'S00.2', label: 'ร่างคำขอ / ปร.3', timing: 'optional', gate: 'ผู้ยื่นยืนยันส่ง', docs: ['ร่างแบบคำขอ', 'เอกสารประกอบร่าง'] },
    ],
  },
  {
    code: 'S01',
    phase: 'request',
    label: 'คำขอ',
    shortLabel: 'คำขอ',
    timing: 'sequential',
    system: 'm1',
    uiTab: 'form',
    editions: allEditions,
    subs: [
      { code: 'S01.1', label: 'ยื่นครั้งแรก', timing: 'sequential', gate: 'ได้ request_no', docs: ['แบบคำขอ', 'ของแนบมาตรฐาน'], parties: ['applicant'] },
      { code: 'S01.2', label: 'แจ้งให้แก้ไข', timing: 'sequential', gate: 'ส่งหนังสือถึงผู้ยื่น', docs: ['หนังสือแจ้งแก้ไข'] },
      { code: 'S01.3', label: 'ขอขยายเวลา', timing: 'optional', gate: 'บันทึกกำหนดส่งใหม่', docs: ['คำขอขยายเวลา', 'หนังสืออนุญาต'] },
      { code: 'S01.4', label: 'Sup / แก้ไขครั้งที่ N', timing: 'sequential', gate: 'รับไฟล์ครบรอบนั้น', docs: ['คำขอเวอร์ชันใหม่', 'ของแนบที่แก้'] },
      { code: 'S01.5', label: 'ฉบับเปิดเผย', timing: 'sequential', gate: 'มีคู่ปกปิด+เปิดเผย', docs: ['ฉบับปกปิด', 'ฉบับเปิดเผย'] },
    ],
  },
  {
    code: 'S02',
    phase: 'support_check',
    label: 'ตรวจประกอบคำขอ',
    shortLabel: 'ตรวจประกอบ',
    timing: 'parallel',
    system: 'm1',
    uiTab: 'docs',
    editions: investigationLike,
    subs: [
      {
        code: 'S02.1',
        label: 'สถานะผู้ผลิต',
        timing: 'parallel',
        gate: 'ได้รับคำตอบหน่วยงานครบหรือปิดรอบ',
        docs: ['หนังสือขอข้อมูล', 'คำตอบหน่วยงาน'],
        parties: ['factory_dept', 'steel_institute', 'industry_council'],
      },
      {
        code: 'S02.2',
        label: 'สถิตินำเข้า',
        timing: 'parallel',
        gate: 'ได้รับสถิติที่ใช้ในวาระ',
        docs: ['บันทึก/หนังสือขอข้อมูล', 'ไฟล์สถิติ'],
        parties: ['customs'],
      },
      {
        code: 'S02.3',
        label: 'ตรวจสอบพิกัด',
        timing: 'parallel',
        gate: 'มีความเห็นพิกัด',
        docs: ['หนังสือส่งตรวจพิกัด', 'ความเห็นหน่วยงาน'],
        parties: ['customs', 'steel_institute'],
      },
      {
        code: 'S02.4',
        label: 'ขอข้อมูลผู้ผลิต–ปริมาณผลิต',
        timing: 'parallel',
        gate: 'ได้รับคำตอบหรือหมดเขต',
        docs: ['หนังสือขอข้อมูลบริษัท/หน่วยงาน', 'แบบตอบกลับ'],
        parties: ['domestic', 'factory_dept', 'steel_institute', 'industry_council', 'oie'],
      },
    ],
  },
  {
    code: 'S03',
    phase: 'doc_review',
    label: 'ตรวจเอกสาร / มอบหมาย / พิจารณารับคำขอ',
    shortLabel: 'ตรวจเอกสาร',
    timing: 'sequential',
    system: 'm1',
    uiTab: 'assign',
    editions: allEditions,
    subs: [
      { code: 'S03.1', label: 'มอบหมายงาน', timing: 'sequential', gate: 'มีเจ้าของเคส/กลุ่ม', docs: ['ใบมอบหมาย'] },
      { code: 'S03.2', label: 'ตรวจสอบเอกสารคำขอ', timing: 'sequential', gate: 'complete หรือ return', docs: ['บันทึกตรวจเอกสาร', 'รายการแก้ไข'] },
      { code: 'S03.3', label: 'พิจารณารับคำขอฉบับสมบูรณ์', timing: 'sequential', gate: 'take หรือ return', docs: ['บันทึก/มติรับคำขอ'] },
    ],
  },
  {
    code: 'S04',
    phase: 'open_agenda',
    label: 'วาระเปิด',
    shortLabel: 'วาระเปิด',
    timing: 'sequential',
    system: 'm1',
    uiTab: 'inquiry',
    editions: openFlow,
    subs: [
      { code: 'S04.1', label: 'ร่างวาระเปิด', timing: 'sequential', gate: 'ร่างพร้อมเสนอ', docs: ['ร่างวาระ', 'ตารางนำเข้า/ความเสียหาย'] },
      { code: 'S04.2', label: 'อนุไต่สวน', timing: 'sequential', gate: 'มติอนุ', docs: ['วาระอนุ', 'PPT', 'มติ', 'รายงานประชุม'] },
      { code: 'S04.3', label: 'ทตอ.', timing: 'sequential', gate: 'มติ ทตอ. รับคำขอ', docs: ['วาระ ทตอ.', 'PPT', 'Chairman’s Note', 'มติ', 'รายงานประชุม'] },
    ],
  },
  {
    code: 'S05',
    phase: 'open_notice',
    label: 'ประกาศเปิด + แจ้งเปิด',
    shortLabel: 'ประกาศเปิด',
    timing: 'sequential',
    system: 'both',
    etrCreateCase: true,
    uiTab: 'inquiry',
    editions: openFlow,
    subs: [
      { code: 'S05.1', label: 'Pre-notify', timing: 'sequential', gate: 'ส่งแล้ว', docs: ['หนังสือ pre-notify'] },
      { code: 'S05.2', label: 'ค่าธรรมเนียม', timing: 'sequential', gate: 'รับทราบหลักฐานชำระ', docs: ['แจ้งชำระ', 'หลักฐานชำระ', 'บันทึกรับทราบ'] },
      { code: 'S05.3', label: 'มติเปิด / ไม่เปิด', timing: 'sequential', gate: 'open หรือ close', docs: ['มติ ทตอ.'] },
      { code: 'S05.4', label: 'ร่างประกาศ + กม.ตรวจ', timing: 'sequential', gate: 'กม.ผ่าน', docs: ['ร่างประกาศกรม', 'บันทึก กม.'] },
      { code: 'S05.5', label: 'ลงนาม + ราชกิจจา', timing: 'sequential', gate: 'ลงราชกิจจานุเบกษา', docs: ['ประกาศตัวจริง', 'หนังสือส่งราชกิจจา'] },
      {
        code: 'S05.6',
        label: 'หนังสือแจ้งผู้เกี่ยวข้อง',
        timing: 'sequential',
        gate: 'ส่งครบชุด',
        docs: ['หนังสือแจ้ง'],
        parties: ['embassy', 'customs', 'domestic', 'association', 'exporter', 'importer'],
      },
      { code: 'S05.7', label: 'หนังสือพิมพ์ + ฉบับเปิดเผยเว็บ', timing: 'sequential', gate: 'เผยแพร่แล้ว', docs: ['ข่าวหนังสือพิมพ์', 'ไฟล์เว็บ Thaitr'] },
    ],
  },
  {
    code: 'S06',
    phase: 'questionnaire',
    label: 'แบบสอบถาม (QN)',
    shortLabel: 'แบบสอบถาม',
    timing: 'parallel',
    system: 'etr',
    uiTab: 'inquiry',
    editions: openFlow,
    subs: [
      { code: 'S06.1', label: 'จัดชุด QN', timing: 'parallel', gate: 'ชุดพร้อมส่ง', docs: ['QN Domestic', 'QN Importer', 'QN Exporter'], parties: ['domestic', 'importer', 'exporter'] },
      { code: 'S06.2', label: 'ส่ง QN + แจ้งเปิด', timing: 'parallel', gate: 'ส่งแล้วตาม party', docs: ['หนังสือส่ง QN'], parties: ['domestic', 'importer', 'exporter'] },
      { code: 'S06.3', label: 'ขยายเวลา QN', timing: 'optional', gate: 'บันทึก due ใหม่', docs: ['คำขอขยาย', 'หนังสืออนุญาต'] },
      { code: 'S06.4', label: 'รับคำตอบ (+ Sup QN)', timing: 'parallel', gate: 'รับครบหรือปิดรอบ', docs: ['คำตอบ QN', 'Sup QN'] },
      { code: 'S06.5', label: 'ความเห็นต่อการเปิด', timing: 'optional', gate: 'รับ/หมดเขต', docs: ['ความเห็นสมาคม/ผู้มีส่วนได้เสีย'], parties: ['association'] },
    ],
  },
  {
    code: 'S07',
    phase: 'verify',
    label: 'Verify',
    shortLabel: 'Verify',
    timing: 'parallel',
    system: 'etr',
    uiTab: 'inquiry',
    editions: openFlow,
    subs: [
      { code: 'S07.1', label: 'ติดต่อบริษัท', timing: 'sequential', gate: 'นัดหมาย', docs: ['หนังสือ/อีเมลติดต่อ'] },
      { code: 'S07.2', label: 'ขออนุมัติไป verify', timing: 'sequential', gate: 'อนุมัติ', docs: ['บันทึกขออนุมัติ'] },
      { code: 'S07.3', label: 'แจ้งเตรียมเอกสาร', timing: 'sequential', gate: 'ส่งแล้ว', docs: ['หนังสือแจ้งเตรียมเอกสาร', 'รายการเอกสาร'] },
      { code: 'S07.4', label: 'เอกสารประกอบ verify', timing: 'sequential', gate: 'รับไฟล์', docs: ['เอกสารบริษัท'] },
      { code: 'S07.5', label: 'เคลียร์เงิน', timing: 'optional', gate: 'ปิดเบิก', docs: ['เอกสารเคลียร์เงิน'] },
      { code: 'S07.6', label: 'รายงาน verify', timing: 'sequential', gate: 'รายงานอนุมัติ', docs: ['รายงาน verify'] },
    ],
  },
  {
    code: 'S08',
    phase: 'analysis',
    label: 'ข้อมูลประกอบผล',
    shortLabel: 'วิเคราะห์',
    timing: 'parallel',
    system: 'both',
    uiTab: 'inquiry',
    editions: investigationLike,
    skippableFor: ['ac', 'sg'],
    subs: [
      { code: 'S08.1', label: 'ผลกระทบ', timing: 'parallel', gate: 'ได้รับความเห็น', docs: ['หนังสือขอ/ตอบ สนค. สถาบันเหล็ก สศอ.'], parties: ['trade_negotiate', 'steel_institute', 'oie'] },
      { code: 'S08.2', label: 'แผนปรับตัว', timing: 'optional', gate: 'รับแผนหรือไม่ใช้', docs: ['แผนปรับตัว'] },
      { code: 'S08.3', label: 'Working paper', timing: 'parallel', gate: 'อัปเดตต่อเนื่อง', docs: ['working paper'] },
    ],
  },
  {
    code: 'S09',
    phase: 'prelim',
    label: 'ผลขั้นต้น',
    shortLabel: 'ผลขั้นต้น',
    timing: 'optional',
    system: 'etr',
    uiTab: 'prelim',
    editions: ['original'],
    skippableFor: ['ssr', 'interim', 'ac', 'sg'],
    subs: [
      { code: 'S09.1', label: 'วาระอนุ ผลขั้นต้น', timing: 'sequential', gate: 'มติอนุ', docs: ['วาระ', 'มติ', 'รายงาน'] },
      { code: 'S09.2', label: 'วาระ ทตอ. ผลขั้นต้น', timing: 'sequential', gate: 'มติ ทตอ.', docs: ['วาระ', 'มติ', 'รายงาน'] },
      { code: 'S09.3', label: 'ประกาศหลักประกันอากร + แจ้ง', timing: 'sequential', gate: 'ประกาศ+แจ้งครบ', docs: ['ประกาศหลักประกัน', 'หนังสือแจ้ง'] },
      { code: 'S09.4', label: 'ประกาศกรม + แจ้ง', timing: 'sequential', gate: 'ประกาศ+แจ้งครบ', docs: ['ประกาศกรม', 'หนังสือแจ้ง', 'Disclosure'] },
      { code: 'S09.5', label: 'แถลงการณ์หลังประกาศ', timing: 'optional', gate: 'รายงานแถลงการณ์หรือข้าม', docs: ['หนังสือขอจัด', 'รายงานแถลงการณ์'] },
    ],
  },
  {
    code: 'S10',
    phase: 'draft_final',
    label: 'ร่างผลสิ้นสุด / Disclosure / Hearing',
    shortLabel: 'ร่างผล',
    timing: 'sequential',
    system: 'etr',
    uiTab: 'draftFinal',
    editions: openFlow,
    subs: [
      { code: 'S10.1', label: 'ร่างผล — อนุ', timing: 'sequential', gate: 'มติอนุ', docs: ['วาระร่างผล', 'มติ', 'รายงาน'] },
      { code: 'S10.2', label: 'ร่างผล — ทตอ.', timing: 'sequential', gate: 'มติ ทตอ.', docs: ['วาระร่างผล', 'มติ', 'รายงาน'] },
      { code: 'S10.3', label: 'Disclosure', timing: 'sequential', gate: 'แจ้งผู้มีส่วนได้เสีย', docs: ['Disclosure ปกปิด', 'Disclosure เปิดเผย', 'หนังสือแจ้ง'] },
      { code: 'S10.4', label: 'Hearing / Comment', timing: 'optional', gate: 'รายงาน hearing หรือข้าม', docs: ['แบบตอบรับ', 'ความเห็น', 'รายงาน hearing'] },
    ],
  },
  {
    code: 'S10F',
    phase: 'final',
    label: 'ผลสิ้นสุด',
    shortLabel: 'ผลสิ้นสุด',
    timing: 'sequential',
    system: 'etr',
    uiTab: 'finalResult',
    editions: openFlow,
    subs: [
      { code: 'S10.5', label: 'ผลสิ้นสุด — อนุ', timing: 'sequential', gate: 'มติอนุ', docs: ['วาระผล', 'มติ', 'รายงาน'] },
      { code: 'S10.6', label: 'ผลสิ้นสุด — ทตอ.', timing: 'sequential', gate: 'มติ ทตอ.', docs: ['วาระผล', 'มติ', 'รายงาน'] },
      { code: 'S10.7', label: 'ประกาศ ทตอ. + ประกาศกรม', timing: 'sequential', gate: 'ลงราชกิจจา', docs: ['ประกาศ ทตอ.', 'ประกาศกรม'] },
      {
        code: 'S10.8',
        label: 'หนังสือแจ้งผล + Disclosure สุดท้าย',
        timing: 'sequential',
        gate: 'แจ้งครบ',
        docs: ['หนังสือแจ้ง', 'Disclosure'],
        parties: ['embassy', 'customs', 'domestic', 'importer', 'exporter', 'association'],
      },
    ],
  },
  {
    code: 'S11',
    phase: 'post',
    label: 'หลังผล',
    shortLabel: 'หลังผล',
    timing: 'optional',
    system: 'both',
    uiTab: 'measures',
    editions: allEditions,
    subs: [
      { code: 'S11.1', label: 'ทบทวน ม.56–59 / คืนอากร', timing: 'optional', gate: 'ปิดเรื่องนั้น', docs: ['วาระ', 'มติ', 'หนังสือแจ้ง'] },
      { code: 'S11.2', label: 'ยุติเคส / ปิด edition', timing: 'optional', gate: 'สถานะปิด', docs: ['บันทึกปิด'] },
      { code: 'S11.3', label: 'ศาล / ข้อร้องเรียนหลังมาตรการ', timing: 'optional', gate: 'นอก flow หลัก', docs: ['เอกสารคดี'] },
    ],
  },
];

/* ─── runtime progress shapes ─── */

export type SubStageProgress = {
  code: string;
  status: StageStatus;
  doneAt?: string;
  note?: string;
};

export type StageProgress = {
  code: string;
  status: StageStatus;
  openDecision?: 'open' | 'close';
  subs: SubStageProgress[];
};

export type DocumentVersion = {
  id: string;
  stageCode: 'S01' | 'S06';
  round: number;
  kind: 'original' | 'fix' | 'sup' | 'noncon' | 'response';
  label: string;
  submittedOn?: string;
  folder?: string;
};

export type PartyLane = {
  id: string;
  stageCode: string;
  role: PartyRole;
  name: string;
  status: 'not_started' | 'sent' | 'replied' | 'accepted' | 'need_more' | 'closed';
  dueOn?: string;
};

export type EditionRecord = {
  id: string;
  caseNo: string;
  type: EditionType;
  label: string;
  requestNo?: string;
  etrCaseId?: string;
  /** Active sub-stage cursor, e.g. S05.3 */
  cursor: string;
  stages: StageProgress[];
  versions: DocumentVersion[];
  lanes: PartyLane[];
};

export type CaseRecord = {
  caseNo: string;
  measure: CaseMeasure;
  goods: string;
  origins: string[];
  editions: EditionRecord[];
};

/* ─── helpers ─── */

export function stageByCode(code: string): StageDef | undefined {
  return canonicalStages.find((stage) => stage.code === code);
}

export function subStageByCode(code: string): { stage: StageDef; sub: SubStageDef } | undefined {
  for (const stage of canonicalStages) {
    const sub = stage.subs.find((item) => item.code === code);
    if (sub) return { stage, sub };
  }
  return undefined;
}

export function stagesForEdition(type: EditionType): StageDef[] {
  return canonicalStages.filter((stage) => {
    if (!stage.editions.includes(type)) return false;
    if (stage.skippableFor?.includes(type) && stage.timing === 'optional') return false;
    return true;
  });
}

export function phaseLabel(code: PhaseCode, edition: EditionType = 'original'): string {
  const row = phases.find((item) => item.code === code);
  if (!row) return code;
  const reviewLike = edition === 'ssr' || edition === 'interim';
  return reviewLike && row.reviewLabel ? row.reviewLabel : row.label;
}

/** High-level names for full stage bar (S00–S11 present for edition) */
export function editionPhaseNames(type: EditionType): string[] {
  return stagesForEdition(type).map((stage) => phaseLabel(stage.phase, type));
}

/**
 * Condensed stepper labels for case list / public timeline.
 * Keep wording stable — archiveCases + stageResult depend on these strings.
 */
export function caseListPhaseNames(type: EditionType): string[] {
  if (type === 'ssr' || type === 'interim') {
    return [
      'ยื่นคำขอทบทวน',
      'ตรวจสอบคำขอ',
      'เปิดการทบทวน',
      'แบบสอบถาม',
      'รับฟังความคิดเห็น',
      'ร่างผลการทบทวน',
      'ประกาศผลการทบทวน',
    ];
  }
  if (type === 'ac') {
    return ['ยื่นคำขอ', 'เปิดการไต่สวน', 'แบบสอบถาม', 'ร่างผลการไต่สวน', 'ประกาศผลชั้นที่สุด'];
  }
  return [
    'ยื่นคำขอ',
    'ตรวจสอบข้อมูล',
    'เปิดการไต่สวน',
    'ผลการไต่สวนชั้นต้น',
    'รับฟังความคิดเห็น',
    'ร่างผลการไต่สวน',
    'ประกาศผลชั้นที่สุด',
  ];
}

/** Maps case-list milestone → canonical stage codes */
export const caseListMilestoneToStages: Record<string, string[]> = {
  ยื่นคำขอ: ['S00', 'S01'],
  ยื่นคำขอทบทวน: ['S00', 'S01'],
  ตรวจสอบข้อมูล: ['S02', 'S03'],
  ตรวจสอบคำขอ: ['S02', 'S03'],
  เปิดการไต่สวน: ['S04', 'S05'],
  เปิดการทบทวน: ['S04', 'S05'],
  แบบสอบถาม: ['S06', 'S07'],
  ผลการไต่สวนชั้นต้น: ['S09'],
  รับฟังความคิดเห็น: ['S10.3', 'S10.4'],
  ร่างผลการไต่สวน: ['S10'],
  ร่างผลการทบทวน: ['S10'],
  ประกาศผลชั้นที่สุด: ['S10F'],
  ประกาศผลการทบทวน: ['S10F'],
};

export function uiTabsForStages(type: EditionType): UiReviewTab[] {
  const tabs: UiReviewTab[] = [];
  for (const stage of stagesForEdition(type)) {
    if (stage.uiTab && !tabs.includes(stage.uiTab)) tabs.push(stage.uiTab);
  }
  return tabs;
}

export function stagesOnUiTab(tab: Exclude<UiReviewTab, null>, type: EditionType = 'original'): StageDef[] {
  return stagesForEdition(type).filter((stage) => stage.uiTab === tab);
}

export function emptyStageProgress(stage: StageDef, status: StageStatus = 'locked'): StageProgress {
  return {
    code: stage.code,
    status,
    subs: stage.subs.map((sub, index) => ({
      code: sub.code,
      status: status === 'active' && index === 0 ? 'active' : 'locked',
    })),
  };
}

export function createEditionProgress(input: {
  id: string;
  caseNo: string;
  type: EditionType;
  label: string;
  requestNo?: string;
}): EditionRecord {
  const stages = stagesForEdition(input.type).map((stage, index) =>
    emptyStageProgress(stage, index === 0 ? 'active' : 'locked'),
  );
  const first = stages[0];
  const cursor = first?.subs.find((sub) => sub.status === 'active')?.code ?? first?.code ?? 'S00';
  return {
    id: input.id,
    caseNo: input.caseNo,
    type: input.type,
    label: input.label,
    requestNo: input.requestNo,
    cursor,
    stages,
    versions: [],
    lanes: [],
  };
}

/** Flow edges for docs / UI diagrams */
export const stageFlowEdges: { from: string; to: string; when?: string }[] = [
  { from: 'S00', to: 'S01' },
  { from: 'S01', to: 'S02', when: 'parallel after submit' },
  { from: 'S01', to: 'S03' },
  { from: 'S02', to: 'S03', when: 'support checks feed doc review' },
  { from: 'S03', to: 'S01', when: 'return → fix request' },
  { from: 'S03', to: 'S04', when: 'take' },
  { from: 'S04', to: 'S05' },
  { from: 'S05', to: 'END', when: 'close' },
  { from: 'S05', to: 'S06', when: 'open + e-TR Create Case' },
  { from: 'S06', to: 'S07', when: 'parallel' },
  { from: 'S06', to: 'S08', when: 'parallel' },
  { from: 'S07', to: 'S08', when: 'parallel' },
  { from: 'S06', to: 'S09' },
  { from: 'S07', to: 'S09' },
  { from: 'S08', to: 'S09' },
  { from: 'S09', to: 'S10', when: 'or skip prelim' },
  { from: 'S06', to: 'S10', when: 'skip prelim' },
  { from: 'S10', to: 'S10F' },
  { from: 'S10F', to: 'S11' },
];

/** Map current por1 inquiry sub-steps → canonical codes */
export const inquiryStepToCanonical: Record<string, string> = {
  prepare: 'S04.1',
  draftAgenda: 'S04.1',
  subAgenda: 'S04.2',
  agenda: 'S04.3',
  decide: 'S04.3',
  letter: 'S03.3',
  prenotify: 'S05.1',
  fee: 'S05.2',
  proof: 'S05.2',
  vote: 'S05.3',
  notice: 'S05.4',
  sign: 'S05.5',
  letters: 'S05.6',
  news: 'S05.7',
  hearing: 'S05.7',
  questions: 'S06.1',
  visit: 'S07.1',
};

export const prelimStepToCanonical: Record<string, string> = {
  sub: 'S09.1',
  tdc: 'S09.2',
  bond: 'S09.3',
  bondLetters: 'S09.3',
  dept: 'S09.4',
  deptLetters: 'S09.4',
  hearing: 'S09.5',
};

export const draftStepToCanonical: Record<string, string> = {
  sub: 'S10.1',
  tdc: 'S10.2',
  letters: 'S10.3',
  hearing: 'S10.4',
};

export const finalStepToCanonical: Record<string, string> = {
  sub: 'S10.5',
  tdc: 'S10.6',
  duty: 'S10.7',
  dutyLetters: 'S10.8',
  dept: 'S10.7',
  deptLetters: 'S10.8',
};

/** Sample editions seeded from real folders on One Touch */
export const sampleEditions: EditionRecord[] = [
  createEditionProgress({ id: 'ad1046-original', caseNo: 'AD1046', type: 'original', label: 'ไต่สวนครั้งแรก', requestNo: 'R6201' }),
  createEditionProgress({ id: 'ad1046-standing', caseNo: 'AD1046', type: 'standing', label: 'ปร.1 แบบขอยืน' }),
  createEditionProgress({ id: 'ad1005-ssr4', caseNo: 'AD1005', type: 'ssr', label: 'ทบทวนครั้งที่ 4 (SSR4)' }),
  createEditionProgress({ id: 'ad1006-ssr5', caseNo: 'AD1006', type: 'ssr', label: 'ทบทวนครั้งที่ 5' }),
  createEditionProgress({ id: 'ad1024-ssr', caseNo: 'AD1024', type: 'ssr', label: 'ทบทวน CRSS' }),
  createEditionProgress({ id: 'ad1054-original', caseNo: 'AD1054', type: 'original', label: 'ไต่สวนครั้งแรก PET' }),
  createEditionProgress({ id: 'ad1047-original', caseNo: 'AD1047', type: 'original', label: 'ไต่สวนครั้งแรก' }),
  createEditionProgress({ id: 'ac1001', caseNo: 'AC1001', type: 'ac', label: 'ไต่สวน AC' }),
];
