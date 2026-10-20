import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DftButton } from '../../button/button';
import { FilingTabs } from './filing-tabs';
import { FilledUpload } from './filled-upload';
import { fillApplicant, fillKnown, valueIsWrong, wrongHint } from './form-extract';
import { SideNav } from '../../menu-bar/side-nav';
import { StatusTag } from '../../status-tag/status-tag';
import { TopHeader } from '../../top-header/top-header';
import { cvdChosen, filingMeasureTitle, readFilingIntent } from './filing-intent';
import { scrollFormToTop } from './form-scroll';

type TocItem = { id: string; label: string };
type TocGroup = { label: string; items: TocItem[] };
type DocItem = { key: string; title: string; hint: string; accept: string };
type Applicant = {
  name: string;
  nation: string;
  address: string;
  phone: string;
  fax: string;
  email: string;
  agent: string;
  agentPhone: string;
  agentFax: string;
  agentEmail: string;
};

const fileHint = 'เฉพาะนามสกุล png, jpg, jpeg, pdf, doc, docx';
const listHint = 'เฉพาะนามสกุล png, jpg, jpeg, pdf, doc, docx, xls, xlsx';
const fileAccept = '.png,.jpg,.jpeg,.pdf,.doc,.docx';
const listAccept = '.png,.jpg,.jpeg,.pdf,.doc,.docx,.xls,.xlsx';

function blankApplicant(): Applicant {
  return {
    name: '',
    nation: '',
    address: '',
    phone: '',
    fax: '',
    email: '',
    agent: '',
    agentPhone: '',
    agentFax: '',
    agentEmail: '',
  };
}

@Component({
  selector: 'app-por3a-page',
  imports: [NgTemplateOutlet, TopHeader, SideNav, RouterLink, DftButton, StatusTag, FilledUpload, FilingTabs],
  templateUrl: './por3a-page.html',
  styleUrl: './por1-page.css',
})
export class Por3aPage {
  protected readonly filingTitle = filingMeasureTitle();
  protected filing: 'self' | 'all' | 'part' = 'self';
  protected agreement: 'dumping' | 'subsidy' = 'subsidy';
  protected applicants: Applicant[] = [blankApplicant()];
  protected priorApplicant: 'yes' | 'no' | '' = '';
  protected goods = '';
  protected party = '';
  protected agreementNo = '';
  protected agreeDay = '';
  protected agreeMonth = '';
  protected agreeYear = '';
  protected stopReason = '';
  protected evidenceReady = false;
  protected ack = false;
  protected signer = '';
  protected signerPrint = '';
  protected roleTitle = '';
  protected signedDay = '';
  protected signedMonth = '';
  protected signedYear = '';
  protected reviewOpen = false;
  protected uploadOpen = false;
  protected readOn = false;
  protected section = '1.1';
  protected files: Record<string, string[]> = {};
  protected readonly toc: TocGroup[] = [
    {
      label: 'ส่วนที่ 1 ผู้ยื่นคำขอ',
      items: [
        { id: '1.1', label: '1.1 ประเภทของการยื่นคำขอ' },
        { id: '1.2', label: '1.2 ข้อมูลและเอกสารประกอบ' },
        { id: '1.3', label: '1.3 สถานะผู้ยื่นคำขอ' },
      ],
    },
    {
      label: 'ส่วนที่ 2 ความตกลงที่ขอทบทวน',
      items: [{ id: '2', label: 'สินค้าและความตกลง' }],
    },
    {
      label: 'ส่วนที่ 3 เหตุหากยกเลิกความตกลง',
      items: [{ id: '3', label: 'เหตุผลและพยานหลักฐาน' }],
    },
    {
      label: 'ส่วนที่ 4 คำรับรองและลงนาม',
      items: [{ id: '9', label: 'คำรับรองและลงนาม' }],
    },
  ];

  constructor(private readonly view: ChangeDetectorRef) {
    const measure = readFilingIntent()?.measure;
    this.agreement = cvdChosen() || measure === 'มาตราการ CVD' ? 'subsidy' : 'dumping';
  }

  protected openFilledUpload(): void {
    this.uploadOpen = true;
  }
  protected readSpots: { contact: string[]; body: string[] } = { contact: ['1.2'], body: ['2', '3'] };

  protected applyRead(): void {
    const host = this as unknown as { applicants?: object[] };
    if (host.applicants?.length) {
      fillApplicant(host.applicants[0]);
      host.applicants = [...host.applicants];
    }
    fillKnown(this);
    const bag = this as unknown as Record<string, unknown>;
    if (typeof bag['goods'] === 'string' && typeof bag['notice'] !== 'string') bag['goods'] = 'เหล็กแผ่น';
    if (bag['measure'] === '') bag['measure'] = 'dumping';
    if (bag['filing'] === '') bag['filing'] = 'self';
    this.readOn = true;
    this.view.detectChanges();
  }

  protected bad(key: string): boolean {
    if (!this.readOn) return false;
    const people = (this as unknown as { applicants?: Record<string, string>[] }).applicants;
    const person = people?.[0];
    const picked = person && Object.prototype.hasOwnProperty.call(person, key) ? person[key] : (this as unknown as Record<string, unknown>)[key];
    return valueIsWrong(key, String(picked ?? ''));
  }

  protected readHint(key: string): string {
    return this.bad(key) ? wrongHint(key) : '';
  }

  protected badSection(id: string): boolean {
    const contact = this.bad('phone') || this.bad('email') || this.bad('agentPhone');
    const body = this.bad('notice') || this.bad('stopReason') || this.bad('tradeName') || this.bad('goods');
    if (this.readSpots.contact.includes(id)) return contact;
    if (this.readSpots.body.includes(id)) return body;
    return false;
  }

  protected get sectionIssue(): string {
    const bag = this as unknown as { section?: string; step?: string };
    const id = bag.section ?? bag.step ?? '';
    if (!this.badSection(id)) return '';
    if (this.readSpots.contact.includes(id)) return 'อ่านเบอร์โทรและอีเมลจากไฟล์ได้ไม่ถูกต้อง';
    return 'ข้อมูลส่วนนี้ไม่ตรงกับไฟล์ต้นฉบับ';
  }


  protected get supportDocs(): DocItem[] {
    if (this.filing === 'self') {
      return [
        { key: 'cert', title: '(1) หนังสือรับรองบริษัท', hint: fileHint, accept: fileAccept },
        { key: 'finance', title: '(2) งบการเงินที่ผู้สอบบัญชีรับอนุญาตรับรอง', hint: fileHint, accept: fileAccept },
        { key: 'goodsList', title: '(3) รายการสินค้าที่ผลิตและ/หรือจำหน่าย', hint: fileHint, accept: fileAccept },
      ];
    }
    if (this.filing === 'all') {
      return [
        { key: 'annexA', title: 'เอกสารผนวก ก. รายชื่อผู้ผลิตทั้งหมด', hint: `ระบุรายชื่อ ที่อยู่ โทรศัพท์ โทรสาร เว็บไซต์ และไปรษณีย์อิเล็กทรอนิกส์ ตามแบบ ปร. 1 โดยอนุโลม · ${listHint}`, accept: listAccept },
        { key: 'cert', title: '(1) หนังสือรับรองบริษัท', hint: fileHint, accept: fileAccept },
        { key: 'finance', title: '(2) งบการเงินที่ผู้สอบบัญชีรับอนุญาตรับรอง', hint: fileHint, accept: fileAccept },
        { key: 'power', title: '(3) หนังสือมอบอำนาจ', hint: fileHint, accept: fileAccept },
        { key: 'volume', title: '(4) รายการและปริมาณสินค้าที่ผลิตและ/หรือจำหน่าย ของผู้ผลิตทุกราย', hint: fileHint, accept: fileAccept },
      ];
    }
    return [
      { key: 'annexB1', title: 'เอกสารผนวก ข. ส่วนที่ 1 ผู้ผลิตที่ขอให้กระทำการแทน', hint: `รายชื่อ ที่อยู่ และช่องทางติดต่อ · ${listHint}`, accept: listAccept },
      { key: 'cert', title: '(1) หนังสือรับรองบริษัท', hint: fileHint, accept: fileAccept },
      { key: 'finance', title: '(2) งบการเงินที่ผู้สอบบัญชีรับอนุญาตรับรอง', hint: fileHint, accept: fileAccept },
      { key: 'power', title: '(3) หนังสือมอบอำนาจ', hint: fileHint, accept: fileAccept },
      { key: 'volume', title: '(4) รายการและปริมาณสินค้าที่ผลิตและ/หรือจำหน่าย ของผู้ผลิตที่ได้ขอให้กระทำการแทน', hint: fileHint, accept: fileAccept },
      { key: 'annexB2', title: 'เอกสารผนวก ข. ส่วนที่ 2 ผู้ผลิตที่มิได้ขอให้กระทำการแทน', hint: `รายชื่อ ที่อยู่ และช่องทางติดต่อ · ${listHint}`, accept: listAccept },
      { key: 'volumeOther', title: 'รายการและปริมาณสินค้าที่ผลิตและ/หรือจำหน่าย ของผู้ผลิตที่มิได้ขอให้กระทำการแทน', hint: fileHint, accept: fileAccept },
    ];
  }

  protected open(item: TocItem, event?: Event): void {
    this.section = item.id;
    this.view.detectChanges();
    scrollFormToTop(event);
  }

  protected current(item: TocItem): boolean {
    return this.section === item.id;
  }

  protected filled(item: TocItem): boolean {
    const ids = this.toc.flatMap((group) => group.items.map((row) => row.id));
    return ids.indexOf(item.id) <= ids.indexOf(this.section);
  }

  protected chooseFiling(value: 'self' | 'behalf'): void {
    if (value === 'self') {
      this.filing = 'self';
      return;
    }
    if (this.filing === 'self') this.filing = 'all';
  }

  protected addApplicant(): void {
    this.applicants = [...this.applicants, blankApplicant()];
  }

  protected removeApplicant(index: number): void {
    if (this.applicants.length < 2) return;
    this.applicants = this.applicants.filter((_, item) => item !== index);
  }

  protected setApplicant(index: number, patch: Partial<Applicant>): void {
    this.applicants = this.applicants.map((person, item) => (item === index ? { ...person, ...patch } : person));
  }

  protected namesOf(key: string): string[] {
    return this.files[key] ?? [];
  }

  protected pick(key: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    const name = input.files?.[0]?.name;
    if (!name) return;
    this.files = { ...this.files, [key]: [...this.namesOf(key), name] };
    input.value = '';
  }

  protected removeListed(key: string, name: string, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.files = { ...this.files, [key]: this.namesOf(key).filter((item) => item !== name) };
  }

  protected get filingLabel(): string {
    if (this.filing === 'self') return 'ยื่นคำขอในนามของตนเอง';
    if (this.filing === 'all') return 'กระทำการแทนผู้ผลิตทั้งหมด';
    return 'กระทำการแทนผู้ผลิตบางส่วน';
  }
}
