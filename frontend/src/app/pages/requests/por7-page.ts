import { ChangeDetectorRef, Component } from '@angular/core';
import { DftButton } from '../../button/button';
import { FilingTabs } from './filing-tabs';
import { FilledUpload } from './filled-upload';
import { SideNav } from '../../menu-bar/side-nav';
import { StatusTag } from '../../status-tag/status-tag';
import { TopHeader } from '../../top-header/top-header';
import { filingMeasureTitle } from './filing-intent';

type TocItem = { id: string; label: string };
type TocGroup = { label: string; items: TocItem[] };
type DocItem = { key: string; label: string; accept: string; hint: string; when: 'always' | 'self' | 'behalf' | 'foreign'; group: 'support' | 'evidence' | 'other' };

@Component({
  selector: 'app-por7-page',
  imports: [TopHeader, SideNav, DftButton, StatusTag, FilledUpload, FilingTabs],
  templateUrl: './por7-page.html',
  styleUrl: './por1-page.css',
})
export class Por7Page {
  protected readonly filingTitle = filingMeasureTitle('มาตราการ AC');
  protected measure: 'dumping' | 'subsidy' = 'dumping';
  protected stakeholder = '';
  protected filing: 'self' | 'behalf' = 'self';
  protected party = '';
  protected otherParty = '';
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
  protected goods = '';
  protected notice = '';
  protected reason = '';
  protected evidenceReady = false;
  protected ack = false;
  protected signer = '';
  protected signerPrint = '';
  protected roleTitle = '';
  protected signedDate = '';
  protected reviewOpen = false;
  protected uploadOpen = false;
  protected filledName = '';
  protected docKey = 'cert';
  protected section = '1.1';
  protected files: Record<string, string[]> = {};
  protected readonly parties = [
    { value: 'government', label: 'รัฐบาลของประเทศแหล่งกำเนิดหรือประเทศผู้ส่งออก' },
    { value: 'all-domestic', label: 'ผู้ผลิตภายในประเทศทั้งหมด' },
    { value: 'some-domestic', label: 'ผู้ผลิตภายในประเทศบางส่วน' },
    { value: 'foreign-producer', label: 'ผู้ผลิตในต่างประเทศ' },
    { value: 'foreign-exporter', label: 'ผู้ส่งออกจากต่างประเทศ' },
    { value: 'domestic-assembler', label: 'ผู้ประกอบสินค้าในประเทศ' },
    { value: 'foreign-assembler', label: 'ผู้ประกอบสินค้าในต่างประเทศ' },
    { value: 'importer', label: 'ผู้นำเข้าในประเทศ' },
    { value: 'other', label: 'บุคคลอื่นตามที่รัฐมนตรีว่าการกระทรวงพาณิชย์ประกาศกำหนด' },
  ];
  protected readonly supportDocs: DocItem[] = [
    { key: 'cert', label: 'หนังสือรับรองบริษัท', accept: '.png,.jpg,.jpeg,.pdf', hint: 'เฉพาะนามสกุล png, jpg, jpeg, pdf', when: 'always', group: 'support' },
    { key: 'goods', label: 'รายการสินค้าที่ผลิตและ/หรือจำหน่าย', accept: '.png,.jpg,.jpeg,.pdf,.doc,.docx', hint: 'เฉพาะนามสกุล png, jpg, jpeg, pdf, doc, docx', when: 'self', group: 'support' },
    { key: 'parties', label: 'รายชื่อ ที่อยู่ และช่องทางติดต่อของผู้ที่กระทำการแทน', accept: '.png,.jpg,.jpeg,.pdf,.xls,.xlsx,.doc,.docx', hint: 'เอกสารแนบรายชื่อ ที่อยู่ โทรศัพท์ โทรสาร เว็บไซต์ และไปรษณีย์อิเล็กทรอนิกส์', when: 'behalf', group: 'support' },
    { key: 'power', label: 'หนังสือมอบอำนาจ', accept: '.png,.jpg,.jpeg,.pdf,.doc,.docx', hint: 'เฉพาะนามสกุล png, jpg, jpeg, pdf, doc, docx', when: 'behalf', group: 'support' },
    { key: 'volume', label: 'รายการและปริมาณสินค้าที่ผลิตและ/หรือจำหน่าย', accept: '.png,.jpg,.jpeg,.pdf,.doc,.docx', hint: 'เฉพาะนามสกุล png, jpg, jpeg, pdf, doc, docx', when: 'behalf', group: 'support' },
    { key: 'legal', label: 'หลักฐานรับรองการเป็นนิติบุคคลในต่างประเทศ', accept: '.png,.jpg,.jpeg,.pdf', hint: 'รับรองโดยโนตารีพับบลิค สถานกงสุลไทย หรือสถานเอกอัครราชทูตไทยประจำประเทศนั้น', when: 'foreign', group: 'support' },
    { key: 'passport', label: 'สำเนาหนังสือเดินทางของผู้มีอำนาจกระทำการแทนที่ลงชื่อในคำขอ', accept: '.png,.jpg,.jpeg,.pdf', hint: 'เฉพาะนามสกุล png, jpg, jpeg, pdf', when: 'foreign', group: 'support' },
    { key: 'proof', label: 'พยานหลักฐานเหตุให้ทบทวนเพื่อยุติการขยายการเรียกเก็บอากร', accept: '.png,.jpg,.jpeg,.pdf,.xls,.xlsx,.doc,.docx', hint: 'อ้างอิงรูปแบบตามแบบ ปร. 6 ในส่วนที่เกี่ยวข้อง', when: 'always', group: 'evidence' },
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
      label: 'ส่วนที่ 2 คำขอทบทวนเพื่อยุติ',
      items: [{ id: '2', label: 'สินค้า ประกาศ และเหตุแห่งการทบทวน' }],
    },
    {
      label: 'ส่วนที่ 3 คำรับรองและลงนาม',
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

  protected get visibleDocs(): DocItem[] {
    const group = this.section === '2' ? 'evidence' : this.section === 'other' ? 'other' : 'support';
    return this.supportDocs.filter((item) => item.group === group && this.showDoc(item));
  }

  protected get activeDoc(): DocItem {
    return this.visibleDocs.find((item) => item.key === this.docKey) ?? this.visibleDocs[0] ?? this.supportDocs[0];
  }

  protected get filingLabel(): string {
    if (this.filing === 'self') return 'ยื่นคำขอในนามตนเอง';
    const party = this.parties.find((item) => item.value === this.party)?.label;
    if (this.party === 'other' && this.otherParty) return `กระทำการแทน ${this.otherParty}`;
    return party ? `กระทำการแทน ${party}` : 'กระทำการแทน';
  }

  protected get goodsLabel(): string {
    return this.goods || 'ยังไม่ระบุ';
  }

  protected open(item: TocItem): void {
    this.section = item.id;
    if (item.id === 'docs') this.docKey = this.visibleDocs[0]?.key ?? 'cert';
    if (item.id === '2') this.docKey = 'proof';
    if (item.id === 'other') this.docKey = 'other';
    this.view.detectChanges();
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
}
