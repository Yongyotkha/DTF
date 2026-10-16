import { ChangeDetectorRef, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DftButton } from '../../button/button';
import { FilingTabs } from './filing-tabs';
import { FilledUpload } from './filled-upload';
import { fillApplicant, fillKnown, valueIsWrong, wrongHint } from './form-extract';
import { SideNav } from '../../menu-bar/side-nav';
import { StatusTag } from '../../status-tag/status-tag';
import { TopHeader } from '../../top-header/top-header';
import { filingMeasureTitle } from './filing-intent';
import { scrollFormToTop } from './form-scroll';

type TocItem = { id: string; label: string };
type TocGroup = { label: string; items: TocItem[] };
type DocItem = { key: string; label: string; accept: string; hint: string; when: 'always' | 'self' | 'behalf' | 'foreign'; group: 'support' | 'ship' | 'evidence' | 'other' };
type ShipRow = { period: string; qty: string; value: string };

@Component({
  selector: 'app-por4-page',
  imports: [TopHeader, SideNav, RouterLink, DftButton, StatusTag, FilledUpload, FilingTabs],
  templateUrl: './por4-page.html',
  styleUrl: './por1-page.css',
})
export class Por4Page {
  protected readonly filingTitle = filingMeasureTitle();
  protected measure: 'dumping' | 'subsidy' = 'dumping';
  protected stake = '';
  protected filing: 'self' | 'behalf' = 'self';
  protected behalfKind: 'producer' | 'exporter' | '' = '';
  protected company = '';
  protected nationality = '';
  protected address = '';
  protected phone = '';
  protected fax = '';
  protected email = '';
  protected agent = '';
  protected agentPhone = '';
  protected agentFax = '';
  protected agentEmail = '';
  protected foreign = false;
  protected shippedInPoi: 'yes' | 'no' | '' = '';
  protected related: 'yes' | 'no' | '' = '';
  protected producer = '';
  protected goods = '';
  protected notice = '';
  protected evidenceReady = false;
  protected ack = false;
  protected signer = '';
  protected signerPrint = '';
  protected roleTitle = '';
  protected signedDate = '';
  protected reviewOpen = false;
  protected uploadOpen = false;
  protected readOn = false;
  protected docKey = 'cert';
  protected section = '1.1';
  protected files: Record<string, string[]> = {};
  protected ships: ShipRow[] = [{ period: '', qty: '', value: '' }];
  protected readonly supportDocs: DocItem[] = [
    { key: 'cert', label: 'หนังสือรับรองบริษัท', accept: '.png,.jpg,.jpeg,.pdf', hint: 'เฉพาะนามสกุล png, jpg, jpeg, pdf', when: 'always', group: 'support' },
    { key: 'finance', label: 'งบการเงินที่ผู้สอบบัญชีรับอนุญาตรับรอง', accept: '.png,.jpg,.jpeg,.pdf,.doc,.docx', hint: 'เฉพาะนามสกุล png, jpg, jpeg, pdf, doc, docx', when: 'always', group: 'support' },
    { key: 'goods', label: 'รายการสินค้าที่ผลิตและ/หรือจำหน่าย', accept: '.png,.jpg,.jpeg,.pdf,.doc,.docx', hint: 'เฉพาะนามสกุล png, jpg, jpeg, pdf, doc, docx', when: 'self', group: 'support' },
    { key: 'parties', label: 'รายชื่อ ที่อยู่ และช่องทางติดต่อของผู้ที่กระทำการแทน', accept: '.png,.jpg,.jpeg,.pdf,.xls,.xlsx,.doc,.docx', hint: 'เอกสารแนบรายชื่อ ที่อยู่ โทรศัพท์ โทรสาร เว็บไซต์ และไปรษณีย์อิเล็กทรอนิกส์', when: 'behalf', group: 'support' },
    { key: 'power', label: 'หนังสือมอบอำนาจ', accept: '.png,.jpg,.jpeg,.pdf,.doc,.docx', hint: 'เฉพาะนามสกุล png, jpg, jpeg, pdf, doc, docx', when: 'behalf', group: 'support' },
    { key: 'volume', label: 'รายการและปริมาณสินค้าที่ผลิตและ/หรือจำหน่าย', accept: '.png,.jpg,.jpeg,.pdf,.doc,.docx', hint: 'เฉพาะนามสกุล png, jpg, jpeg, pdf, doc, docx', when: 'behalf', group: 'support' },
    { key: 'legal', label: 'หลักฐานรับรองการเป็นนิติบุคคลในต่างประเทศ', accept: '.png,.jpg,.jpeg,.pdf', hint: 'รับรองโดยโนตารีพับบลิค สถานกงสุลไทย หรือสถานเอกอัครราชทูตไทย', when: 'foreign', group: 'support' },
    { key: 'passport', label: 'สำเนาหนังสือเดินทางของผู้มีอำนาจกระทำการแทน', accept: '.png,.jpg,.jpeg,.pdf', hint: 'เฉพาะนามสกุล png, jpg, jpeg, pdf', when: 'foreign', group: 'support' },
    { key: 'ship', label: 'หลักฐานปริมาณและมูลค่าการส่งสินค้ามายังประเทศไทย', accept: '.png,.jpg,.jpeg,.pdf,.xls,.xlsx,.doc,.docx', hint: 'ข้อมูลหลังช่วงเวลาที่ใช้ไต่สวน', when: 'always', group: 'ship' },
    { key: 'margin', label: 'พยานหลักฐานอัตราส่วนเหลื่อมการทุ่มตลาดหรือการอุดหนุน', accept: '.png,.jpg,.jpeg,.pdf,.xls,.xlsx,.doc,.docx', hint: 'อ้างอิงรูปแบบตามแบบ ปร. 1 ในส่วนที่เกี่ยวข้อง', when: 'always', group: 'evidence' },
    { key: 'other', label: 'เอกสารประกอบอื่น', accept: '.png,.jpg,.jpeg,.pdf,.doc,.docx', hint: 'ภาคผนวกหรือเอกสารเพิ่มเติม', when: 'always', group: 'other' },
  ];
  protected readonly toc: TocGroup[] = [
    {
      label: 'ส่วนที่ 1 ผู้ยื่นคำขอ',
      items: [
        { id: '1.1', label: '1.1 ผู้ยื่นคำขอ' },
        { id: '1.2', label: '1.2 ประเภทของการยื่นคำขอ' },
        { id: '1.3', label: '1.3 ข้อมูลผู้ยื่นคำขอ' },
        { id: 'docs', label: 'เอกสารประกอบ' },
      ],
    },
    {
      label: 'ส่วนที่ 2 ฐานะผู้ยื่นคำขอ',
      items: [{ id: '2', label: '2.1 และ 2.2 ฐานะตามช่วงไต่สวน' }],
    },
    {
      label: 'ส่วนที่ 3 ปริมาณและมูลค่าการส่งออก',
      items: [{ id: '3', label: 'ข้อมูลหลังช่วงเวลาไต่สวน' }],
    },
    {
      label: 'ส่วนที่ 4 คำขอทบทวนผู้ส่งออกรายใหม่',
      items: [{ id: '4', label: 'สินค้า ประกาศ และพยานหลักฐาน' }],
    },
    {
      label: 'ส่วนที่ 5 คำรับรองและลงนาม',
      items: [{ id: '9', label: 'คำรับรองและลงนาม' }],
    },
    {
      label: 'เอกสารอื่น ๆ ที่แนบประกอบ',
      items: [{ id: 'other', label: 'ภาคผนวก และเอกสารประกอบอื่น' }],
    },
  ];

  constructor(private readonly view: ChangeDetectorRef) {}

  protected openFilledUpload(): void {
    this.uploadOpen = true;
  }
  protected readSpots: { contact: string[]; body: string[] } = { contact: ['1.3'], body: ['4'] };

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


  protected get visibleDocs(): DocItem[] {
    const group = this.section === '3' ? 'ship' : this.section === '4' ? 'evidence' : this.section === 'other' ? 'other' : 'support';
    return this.supportDocs.filter((item) => item.group === group && this.showDoc(item));
  }

  protected get activeDoc(): DocItem {
    return this.visibleDocs.find((item) => item.key === this.docKey) ?? this.visibleDocs[0] ?? this.supportDocs[0];
  }

  protected get filingLabel(): string {
    if (this.filing === 'self') return 'ยื่นคำขอในนามตนเอง';
    if (this.behalfKind === 'producer') return 'กระทำการแทนผู้ผลิตในต่างประเทศ';
    if (this.behalfKind === 'exporter') return 'กระทำการแทนผู้ส่งออกจากต่างประเทศ';
    return 'กระทำการแทน';
  }

  protected statusLabel(value: 'yes' | 'no' | ''): string {
    if (value === 'yes') return 'เป็น';
    if (value === 'no') return 'ไม่เป็น';
    return 'ยังไม่เลือก';
  }

  protected open(item: TocItem, event?: Event): void {
    this.section = item.id;
    if (item.id === 'docs') this.docKey = this.visibleDocs[0]?.key ?? 'cert';
    if (item.id === '3') this.docKey = 'ship';
    if (item.id === '4') this.docKey = 'margin';
    if (item.id === 'other') this.docKey = 'other';
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

  protected showDoc(item: DocItem): boolean {
    if (item.when === 'always') return true;
    if (item.when === 'self') return this.filing === 'self';
    if (item.when === 'behalf') return this.filing === 'behalf';
    return this.foreign;
  }

  protected namesOf(key: string): string[] {
    return this.files[key] ?? [];
  }

  protected openDoc(key: string): void {
    this.docKey = key;
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

  protected addShip(): void {
    this.ships = [...this.ships, { period: '', qty: '', value: '' }];
  }

  protected removeShip(index: number): void {
    if (this.ships.length < 2) return;
    this.ships = this.ships.filter((_, n) => n !== index);
  }

  protected setShip(index: number, key: 'period' | 'qty' | 'value', event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.ships = this.ships.map((row, n) => (n === index ? { ...row, [key]: value } : row));
  }
}
