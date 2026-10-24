import { Injectable, signal } from '@angular/core';
import { filingRefId } from '../pages/requests/case-status';

/**
 * Context the filing page is allowed to publish.
 * Values stay in this tab. Do not put credentials, emails, phone numbers,
 * addresses, or financial figures here. File entries are names and counts only.
 *
 * MockFilingGuide is the prototype adapter. A server model can replace `guide`
 * later without changing the page or the chat storage contract.
 */
export type GuideField = {
  id: string;
  label: string;
  hint?: string;
};

export type GuideAttachment = {
  label: string;
  required: boolean;
  count: number;
  names: string[];
};

export type FilingSnapshot = {
  measureType: string;
  formType: string;
  requestId: string;
  currentSection: string;
  anchor: string;
  promptKey: string;
  currentField: string;
  currentSectionTitle: string;
  focus: string;
  nextSectionTitle: string;
  nextJump: string;
  formData: Record<string, string>;
  validationErrors: GuideField[];
  missingRequiredFields: GuideField[];
  checkedFields: string[];
  fieldsChecked: boolean;
  sectionRequired: boolean;
  attachmentMetadata: GuideAttachment[];
  completionStatus: string;
};

export type GuideReply = {
  title: string;
  text: string;
  jumps?: { id: string; label: string }[];
};

export interface FilingGuide {
  reply(text: string, snapshot: FilingSnapshot): GuideReply | null;
}

@Injectable({ providedIn: 'root' })
export class FilingAiContext {
  readonly snapshot = signal<FilingSnapshot | null>(null);
  private jump: ((id: string) => void) | null = null;

  set(snapshot: FilingSnapshot, jump: (id: string) => void): void {
    this.snapshot.set(snapshot);
    this.jump = jump;
  }

  clear(): void {
    this.snapshot.set(null);
    this.jump = null;
  }

  go(id: string): void {
    this.jump?.(id);
  }
}

const questionBank: Record<string, string[]> = {
  '1:part-1-1': ['ตรวจสอบข้อมูลผู้ยื่นที่กรอกไว้', 'หนังสือรับรองและงบการเงินต้องแนบไหม', 'ตัวอย่างการกรอกข้อมูลผู้ยื่น', 'หลังข้อมูลผู้ยื่นต้องทำอะไรต่อ'],
  '1:part-1-2': ['ตรวจสอบความเกี่ยวข้องกับผู้นำเข้า', 'ส่วนนี้ต้องแนบเอกสารเพิ่มไหม', 'ตัวอย่างการกรอกความเกี่ยวข้อง', 'หลังข้อ 1.2 ต้องทำอะไรต่อ'],
  '1:part-1-3': ['ตรวจสอบคำขอมาตรการช่วยเหลือ', 'ข้อ 1.3 ต้องแนบเอกสารอะไร', 'ตัวอย่างการกรอกมาตรการช่วยเหลือ', 'หลังข้อ 1.3 ต้องทำอะไรต่อ'],
  '2': ['ตรวจสอบรายละเอียดสินค้าที่กรอกไว้', 'ส่วนที่ 2 ต้องแนบเอกสารอะไร', 'ตัวอย่างการกรอกชื่อและลักษณะสินค้า', 'หลังส่วนที่ 2 ต้องทำอะไรต่อ'],
  '3': ['ตรวจสอบรายชื่อในส่วนนี้', 'ส่วนที่ 3 ต้องแนบเอกสารอะไร', 'ตัวอย่างการกรอกรายชื่อผู้ผลิตหรือผู้ส่งออก', 'หลังส่วนที่ 3 ต้องทำอะไรต่อ'],
  '4': ['ตรวจสอบมูลค่าปกติในข้อนี้', 'ส่วนที่ 4 ต้องแนบเอกสารอะไร', 'ตัวอย่างการกรอกมูลค่าปกติ', 'หลังข้อนี้ของส่วนที่ 4 ต้องทำอะไรต่อ'],
  '5': ['ตรวจสอบราคาส่งออกที่กรอกไว้', 'ส่วนที่ 5 ต้องแนบเอกสารอะไร', 'ตัวอย่างการกรอกราคาส่งออก', 'หลังส่วนที่ 5 ต้องทำอะไรต่อ'],
  '6': ['ตรวจสอบส่วนเหลื่อมที่กรอกไว้', 'ส่วนที่ 6 ต้องแนบเอกสารอะไร', 'ตัวอย่างการกรอกส่วนเหลื่อม', 'หลังส่วนที่ 6 ต้องทำอะไรต่อ'],
  '7.1': ['ตรวจสอบเอกสารโครงการอุดหนุน', 'ส่วนที่ 7 ต้องแนบเมื่อมาตรการใด', 'ตัวอย่างการกรอกการอุดหนุน', 'หลังข้อ 7.1 ต้องทำอะไรต่อ'],
  '7.2': ['ตรวจสอบคำอธิบายการอุดหนุน', 'ข้อ 7.2 ต้องแนบเอกสารอะไร', 'ตัวอย่างการอธิบายการอุดหนุน', 'หลังข้อ 7.2 ต้องทำอะไรต่อ'],
  '8.1': ['ตรวจสอบข้อมูลการนำเข้าในข้อ 8.1', 'ข้อ 8.1 ต้องแนบเอกสารอะไร', 'ตัวอย่างการกรอกข้อมูลการนำเข้า', 'หลังข้อ 8.1 ต้องทำอะไรต่อ'],
  '8.2': ['ตรวจสอบผลกระทบด้านราคา', 'ข้อ 8.2 ต้องแนบหลักฐานอะไร', 'ตัวอย่างการอธิบายการตัดราคา', 'หลังข้อ 8.2 ต้องทำอะไรต่อ'],
  '8.3': ['ตรวจสอบสภาวะของผู้ยื่นคำขอ', 'ข้อ 8.3 ต้องแนบเอกสารอะไร', 'ตัวอย่างการกรอกสภาวะอุตสาหกรรม', 'หลังข้อ 8.3 ต้องทำอะไรต่อ'],
  '8.4': ['ตรวจสอบปัจจัยอื่นที่กรอกไว้', 'ข้อ 8.4 ต้องแนบเอกสารอะไร', 'ตัวอย่างการกรอกปัจจัยอื่น', 'หลังข้อ 8.4 ต้องทำอะไรต่อ'],
  '8.5': ['ตรวจสอบสรุปความเสียหาย', 'ข้อ 8.5 ต้องแนบเอกสารอะไร', 'ตัวอย่างการสรุปความเสียหาย', 'หลังข้อ 8.5 ต้องทำอะไรต่อ'],
  '8.6': ['ตรวจสอบข้อมูลผู้ซื้อ', 'ข้อ 8.6 ต้องแนบหลักฐานอะไร', 'ตัวอย่างการกรอกข้อมูลผู้ซื้อ', 'หลังข้อ 8.6 ต้องทำอะไรต่อ'],
  '8.7': ['ตรวจสอบแนวโน้มความเสียหาย', 'ข้อ 8.7 ต้องแนบเอกสารอะไร', 'ตัวอย่างการกรอกแนวโน้ม', 'หลังข้อ 8.7 ต้องทำอะไรต่อ'],
  '8.8': ['ตรวจสอบความประสงค์ให้ไต่สวน', 'ข้อ 8.8 ต้องแนบหลักฐานอะไร', 'ตัวอย่างการกรอกอุปสรรคอุตสาหกรรม', 'หลังข้อ 8.8 ต้องทำอะไรต่อ'],
  '9': ['ตรวจสอบคำรับรองและหนังสือนำส่ง', 'ส่วนนี้ต้องแนบไฟล์อะไร', 'ตัวอย่างคำรับรองและหนังสือนำส่ง', 'หลังส่วนนี้ต้องทำอะไรต่อ'],
  other: ['ตรวจสอบเอกสารอื่นที่แนบไว้', 'เอกสารอื่นข้อไหนเป็นเอกสารบังคับ', 'ตัวอย่างเอกสารที่แนบเพิ่มได้', 'หลังเอกสารอื่นต้องทำอะไรต่อ'],
};

export function guideQuestions(snapshot: FilingSnapshot): string[] {
  const known = questionBank[snapshot.promptKey] ?? questionBank[snapshot.currentSection];
  if (known) return known;
  const title = snapshot.currentSectionTitle;
  return [`ตรวจสอบข้อมูลใน${title}`, `เอกสารของ${title}มีอะไรบ้าง`, `ตัวอย่างการกรอก${title}`, `หลัง${title}ต้องทำอะไรต่อ`];
}

export function guideWelcome(snapshot: FilingSnapshot): string {
  return `คุณกำลังกรอก${snapshot.currentSectionTitle} ของแบบ ${snapshot.formType} ฉันช่วยตรวจสอบความครบถ้วนของ${snapshot.focus}และแนะนำเอกสารประกอบได้`;
}

function caveat(snapshot: FilingSnapshot): string {
  return `คำแนะนำนี้เป็นตัวอย่างจากต้นแบบ ยังไม่เชื่อมต่อโมเดล ไม่ได้แก้ข้อมูลในแบบ และไม่ใช่การยืนยันผลตามกฎหมาย ที่มา: คู่มือ e-TR สำหรับผู้ประกอบการ และ Flow Module 1 อ้างอิงโครงสร้างแบบ ${snapshot.formType} ที่เปิดอยู่ในหน้านี้`;
}

function intentOf(text: string, snapshot: FilingSnapshot): 'review' | 'documents' | 'example' | 'next' | null {
  const index = guideQuestions(snapshot).indexOf(text);
  if (index === 0) return 'review';
  if (index === 1) return 'documents';
  if (index === 2) return 'example';
  if (index === 3) return 'next';
  return null;
}

function fileLine(file: GuideAttachment): string {
  if (file.count === 0) {
    return file.required ? `เอกสารบังคับ «${file.label}» ยังไม่เห็นไฟล์ในรายการของส่วนนี้` : `เอกสารแนะนำ «${file.label}» ยังไม่มีไฟล์ จึงยังไม่ถือว่าขาดเอกสารบังคับ`;
  }
  const shown = file.names.join(', ');
  const more = file.count > file.names.length ? ` และอีก ${file.count - file.names.length} ไฟล์` : '';
  const kind = file.required ? 'เอกสารบังคับ' : 'เอกสารแนะนำ';
  return `${kind} «${file.label}» มีรายชื่อไฟล์ ${file.count} รายการ (${shown}${more}) ยังไม่ได้อ่านเนื้อหา จึงยังยืนยันว่าเอกสารครบหรือถูกต้องไม่ได้`;
}

function reviewText(snapshot: FilingSnapshot): { text: string; jumps: { id: string; label: string }[] } {
  const where = `${snapshot.formType} · มาตรการ ${snapshot.measureType} · ${snapshot.requestId} · ${snapshot.currentSectionTitle} · สถานะ${snapshot.completionStatus}`;
  const lines = [`กำลังตรวจ${where}`, `ช่องที่โฟกัส: ${snapshot.currentField || 'ยังไม่ได้เลือกช่อง'}`];
  if (!snapshot.sectionRequired) {
    lines.push(`ส่วนนี้ไม่ใช่ส่วนบังคับของมาตรการ ${snapshot.measureType} ตามโครงสร้างแบบที่เปิดอยู่ จึงไม่นับช่องในส่วนนี้เป็นช่องบังคับ`);
  } else if (!snapshot.fieldsChecked) {
    lines.push('ส่วนนี้ยังไม่ได้ส่งรายการชื่อช่องมาให้ตรวจ จึงยังสรุปความครบถ้วนไม่ได้');
  } else {
    lines.push(`ตรวจเฉพาะชื่อช่องเหล่านี้: ${snapshot.checkedFields.join(', ') || 'ไม่มีรายการ'}`);
    if (snapshot.missingRequiredFields.length) {
      lines.push(`ช่องบังคับที่ยังว่าง: ${snapshot.missingRequiredFields.map((field) => field.label).join(', ')}`);
    } else {
      lines.push('จากชื่อช่องที่ส่งมาให้ตรวจ ไม่พบช่องบังคับที่ว่างในส่วนนี้');
    }
  }
  if (snapshot.validationErrors.length) {
    lines.push(`รูปแบบที่ควรแก้: ${snapshot.validationErrors.map((field) => `${field.label} (${field.hint || 'ตรวจรูปแบบ'})`).join(', ')}`);
  } else if (snapshot.fieldsChecked) {
    lines.push('ไม่พบรูปแบบที่ตรวจได้ว่าไม่ถูกต้อง จากรายการที่ส่งมา');
  }
  if (snapshot.formData['marketEconomy']) {
    lines.push(`ข้อมูลที่หน้านี้อนุญาตให้ใช้: ประเทศผู้ส่งออก${snapshot.formData['marketEconomy']} จึงไม่นับวิธีคำนวณข้อ 4.5 เป็นช่องบังคับ`);
  }
  const files = snapshot.attachmentMetadata;
  if (files.length && files.length <= 4) lines.push(files.map(fileLine).join('\n'));
  else if (files.length) {
    const present = files.filter((file) => file.count > 0).length;
    lines.push(`ส่วนนี้มีรายการเอกสาร ${files.length} กลุ่ม มีไฟล์อย่างน้อย 1 รายการ ${present} กลุ่ม ยังไม่ได้อ่านเนื้อหา จึงยังยืนยันความครบถ้วนของเอกสารไม่ได้`);
  }
  lines.push(caveat(snapshot));
  const jumps = [...snapshot.missingRequiredFields, ...snapshot.validationErrors].slice(0, 4).map((field) => ({ id: field.id, label: `ไปที่ ${field.label}` }));
  return { text: lines.join('\n\n'), jumps };
}

function documentText(snapshot: FilingSnapshot): { text: string; jumps: { id: string; label: string }[] } {
  const lines = [`เอกสารของ${snapshot.currentSectionTitle} ในแบบ ${snapshot.formType}`];
  if (snapshot.currentSection === '9') {
    lines.push('รูปลายเซ็นแนบที่ช่องในส่วนนี้ คำรับรองและหนังสือนำส่งเป็นเอกสารที่ระบบสร้างจากข้อมูลในแบบ ไม่มีช่องอัปโหลดหนังสือนำส่ง');
  } else if (!snapshot.attachmentMetadata.length) {
    lines.push('ส่วนนี้ยังไม่ได้ส่งรายการเอกสารมาให้ตรวจ จึงยังแนะนำสถานะไฟล์ไม่ได้');
  } else if (snapshot.attachmentMetadata.length > 4) {
    const required = snapshot.attachmentMetadata.filter((file) => file.required);
    const present = snapshot.attachmentMetadata.filter((file) => file.count > 0).length;
    lines.push(`แยกตามที่หน้านี้กำหนด: เอกสารบังคับ ${required.length} กลุ่ม เอกสารแนะนำ ${snapshot.attachmentMetadata.length - required.length} กลุ่ม`);
    lines.push(`เห็นรายชื่อไฟล์ใน ${present} กลุ่มจาก ${snapshot.attachmentMetadata.length} กลุ่ม ยังไม่ได้อ่านเนื้อหา จึงยังยืนยันว่าเอกสารครบหรือถูกต้องไม่ได้`);
  } else {
    lines.push(snapshot.attachmentMetadata.map(fileLine).join('\n'));
  }
  lines.push(caveat(snapshot));
  const empty = snapshot.attachmentMetadata.find((file) => file.required && file.count === 0);
  const jumps = empty ? [{ id: `nav:${snapshot.currentSection}|${snapshot.anchor}::${empty.label}`, label: `ไปที่ ${empty.label}` }] : [];
  return { text: lines.join('\n\n'), jumps };
}

function exampleText(snapshot: FilingSnapshot): string {
  const samples: Record<string, string> = {
    '2': `ในส่วนนี้ให้ระบุชื่อและลักษณะสินค้าที่ถูกพิจารณา เช่น ชนิด ขนาด อัตราอากร และแหล่งกำเนิด แล้วระบุช่องทางจำหน่ายกับผู้ใช้สินค้า เลขที่อ้างอิงบนหน้านี้คือ ${filingRefId} เหล็กแผ่นรีดร้อน คำแนะนำนี้ไม่ได้คัดลอกข้อความในช่อง`,
    '1:part-1-1': 'ให้ระบุผู้ยื่น มาตรการ สัญชาติ ที่อยู่ โทรศัพท์ และผู้รับมอบอำนาจเมื่อยื่นแทนผู้ผลิตรายอื่น แล้วแนบหนังสือรับรอง งบการเงิน และหนังสือมอบอำนาจตามรายการบนหน้านี้',
    '9': 'ระบบใส่ข้อความคำรับรองตั้งต้นจากแบบ ปร.1 ผู้ยื่นแก้ไขในช่องได้ หรือกดให้ AI ร่างแนวทางจากชื่อผู้ยื่นและผู้ลงนาม หนังสือนำส่งอยู่หน้าเดียวกันนี้ และสร้างจากข้อมูลในแบบ',
  };
  const sample = samples[snapshot.promptKey] ?? samples[snapshot.currentSection] ?? `ให้กรอกตามหัวข้อของ${snapshot.currentSectionTitle} คำแนะนำนี้บอกโครงสร้างของส่วน ไม่ได้นำข้อความที่กรอกไว้มาแสดง`;
  return `${sample}\n\n${caveat(snapshot)}`;
}

function nextText(snapshot: FilingSnapshot): { text: string; jumps: { id: string; label: string }[] } {
  const text = snapshot.nextJump
    ? `ขั้นตอนถัดไปในสารบัญของแบบ ${snapshot.formType} คือ ${snapshot.nextSectionTitle}\n\n${caveat(snapshot)}`
    : `ส่วนนี้เป็นรายการสุดท้ายในสารบัญ ขั้นต่อไปคือตรวจความครบถ้วนแล้วบันทึกร่างหรือยื่นคำขอจากปุ่มบนหัวหน้า\n\n${caveat(snapshot)}`;
  const jumps = snapshot.nextJump ? [{ id: snapshot.nextJump, label: `ไปที่ ${snapshot.nextSectionTitle}` }] : [];
  return { text, jumps };
}

export const mockFilingGuide: FilingGuide = {
  reply(text: string, snapshot: FilingSnapshot): GuideReply | null {
    const intent = intentOf(text, snapshot);
    if (!intent) return null;
    if (intent === 'review') {
      const review = reviewText(snapshot);
      return { title: text, text: review.text, jumps: review.jumps };
    }
    if (intent === 'documents') {
      const docs = documentText(snapshot);
      return { title: text, text: docs.text, jumps: docs.jumps };
    }
    if (intent === 'example') return { title: text, text: exampleText(snapshot) };
    const next = nextText(snapshot);
    return { title: text, text: next.text, jumps: next.jumps };
  },
};
