import { ChangeDetectorRef, Component } from '@angular/core';
import { DftButton } from '../../button/button';
import { SideNav } from '../../menu-bar/side-nav';
import { StatusTag } from '../../status-tag/status-tag';
import { TopHeader } from '../../top-header/top-header';

type TocItem = { id: string; label: string };
type TocGroup = { label: string; items: TocItem[] };
type DocWhen = 'always' | 'self' | 'all' | 'part' | 'proxy' | 'foreign';
type DocItem = { key: string; label: string; accept: string; hint: string; when: DocWhen; group: 'support' | 'evidence' | 'other' };

@Component({
  selector: 'app-por3a-page',
  imports: [TopHeader, SideNav, DftButton, StatusTag],
  templateUrl: './por3a-page.html',
  styleUrl: './por1-page.css',
})
export class Por3aPage {
  protected measure: 'dumping' | 'subsidy' = 'dumping';
  protected filing: 'self' | 'all' | 'part' = 'self';
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
  protected priorApplicant: 'yes' | 'no' | '' = '';
  protected goods = '';
  protected notice = '';
  protected agreementNo = '';
  protected stopReason = '';
  protected evidenceReady = false;
  protected ack = false;
  protected signer = '';
  protected signerPrint = '';
  protected roleTitle = '';
  protected signedDate = '';
  protected reviewOpen = false;
  protected docKey = 'cert';
  protected section = '1.1';
  protected files: Record<string, string[]> = {};
  protected readonly supportDocs: DocItem[] = [
    { key: 'cert', label: 'หนังสือรับรองบริษัท', accept: '.png,.jpg,.jpeg,.pdf', hint: 'เฉพาะนามสกุล png, jpg, jpeg, pdf', when: 'always', group: 'support' },
    { key: 'finance', label: 'งบการเงินที่ผู้สอบบัญชีรับอนุญาตรับรอง', accept: '.png,.jpg,.jpeg,.pdf,.doc,.docx', hint: 'เฉพาะนามสกุล png, jpg, jpeg, pdf, doc, docx', when: 'always', group: 'support' },
    { key: 'goods', label: 'รายการสินค้าที่ผลิตและ/หรือจำหน่าย', accept: '.png,.jpg,.jpeg,.pdf,.doc,.docx', hint: 'เฉพาะนามสกุล png, jpg, jpeg, pdf, doc, docx', when: 'self', group: 'support' },
    { key: 'annexA', label: 'เอกสารผนวก ก. รายชื่อผู้ผลิตทั้งหมด', accept: '.png,.jpg,.jpeg,.pdf,.xls,.xlsx,.doc,.docx', hint: 'ระบุรายชื่อ ที่อยู่ โทรศัพท์ โทรสาร เว็บไซต์ และไปรษณีย์อิเล็กทรอนิกส์ ตามแบบ ปร. 1 โดยอนุโลม', when: 'all', group: 'support' },
    { key: 'annexB1', label: 'เอกสารผนวก ข. ส่วนที่ 1 ผู้ผลิตที่ขอให้กระทำการแทน', accept: '.png,.jpg,.jpeg,.pdf,.xls,.xlsx,.doc,.docx', hint: 'รายชื่อ ที่อยู่ และช่องทางติดต่อของผู้ผลิตที่ได้ขอให้กระทำการแทน', when: 'part', group: 'support' },
    { key: 'annexB2', label: 'เอกสารผนวก ข. ส่วนที่ 2 ผู้ผลิตที่มิได้ขอให้กระทำการแทน', accept: '.png,.jpg,.jpeg,.pdf,.xls,.xlsx,.doc,.docx', hint: 'รายชื่อ ที่อยู่ ช่องทางติดต่อ และรายการปริมาณสินค้าของผู้ผลิตที่มิได้ขอให้กระทำการแทน', when: 'part', group: 'support' },
    { key: 'power', label: 'หนังสือมอบอำนาจ', accept: '.png,.jpg,.jpeg,.pdf,.doc,.docx', hint: 'เฉพาะนามสกุล png, jpg, jpeg, pdf, doc, docx', when: 'proxy', group: 'support' },
    { key: 'volume', label: 'รายการและปริมาณสินค้าที่ผลิตและ/หรือจำหน่าย', accept: '.png,.jpg,.jpeg,.pdf,.doc,.docx', hint: 'ของผู้ผลิตที่เกี่ยวข้องตามประเภทการยื่น', when: 'proxy', group: 'support' },
    { key: 'legal', label: 'หลักฐานรับรองการเป็นนิติบุคคลในต่างประเทศ', accept: '.png,.jpg,.jpeg,.pdf', hint: 'รับรองโดยโนตารีพับบลิค สถานกงสุลไทย หรือสถานเอกอัครราชทูตไทย', when: 'foreign', group: 'support' },
    { key: 'passport', label: 'สำเนาหนังสือเดินทางของผู้มีอำนาจกระทำการแทน', accept: '.png,.jpg,.jpeg,.pdf', hint: 'เฉพาะนามสกุล png, jpg, jpeg, pdf', when: 'foreign', group: 'support' },
    { key: 'evidence', label: 'พยานหลักฐานหากยุติการใช้บังคับความตกลง', accept: '.png,.jpg,.jpeg,.pdf,.xls,.xlsx,.doc,.docx', hint: 'อ้างอิงรูปแบบตามแบบ ปร. 1 ในส่วนที่เกี่ยวข้อง', when: 'always', group: 'evidence' },
    { key: 'other', label: 'เอกสารประกอบอื่น', accept: '.png,.jpg,.jpeg,.pdf,.doc,.docx', hint: 'ภาคผนวกหรือเอกสารเพิ่มเติม', when: 'always', group: 'other' },
  ];
  protected readonly toc: TocGroup[] = [
    {
      label: 'ส่วนที่ 1 ผู้ยื่นคำขอ',
      items: [
        { id: '1.1', label: '1.1 ประเภทของการยื่นคำขอ' },
        { id: '1.2', label: '1.2 ข้อมูลผู้ยื่นคำขอ' },
        { id: '1.3', label: '1.3 สถานะผู้ยื่นคำขอ' },
        { id: 'docs', label: 'เอกสารประกอบ' },
      ],
    },
    {
      label: 'ส่วนที่ 2 ทบทวนการใช้ความตกลงต่อไป',
      items: [{ id: '2', label: 'สินค้า ประกาศ และความตกลง' }],
    },
    {
      label: 'ส่วนที่ 3 เหตุหากยุติความตกลง',
      items: [{ id: '3', label: 'เหตุผลและพยานหลักฐาน' }],
    },
    {
      label: 'ส่วนที่ 4 คำรับรองและลงนาม',
      items: [{ id: '9', label: 'คำรับรองและลงนาม' }],
    },
    {
      label: 'เอกสารอื่น ๆ ที่แนบประกอบ',
      items: [{ id: 'other', label: 'ภาคผนวก และเอกสารประกอบอื่น' }],
    },
  ];

  constructor(private readonly view: ChangeDetectorRef) {}

  protected get visibleDocs(): DocItem[] {
    const group = this.section === '3' ? 'evidence' : this.section === 'other' ? 'other' : 'support';
    return this.supportDocs.filter((item) => item.group === group && this.showDoc(item));
  }

  protected get activeDoc(): DocItem {
    return this.visibleDocs.find((item) => item.key === this.docKey) ?? this.visibleDocs[0];
  }

  protected open(item: TocItem): void {
    this.section = item.id;
    if (item.id === 'docs') this.docKey = this.visibleDocs[0]?.key ?? 'cert';
    if (item.id === '3') this.docKey = 'evidence';
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
    if (item.when === 'all') return this.filing === 'all';
    if (item.when === 'part') return this.filing === 'part';
    if (item.when === 'proxy') return this.filing === 'all' || this.filing === 'part';
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

  protected isPdf(name: string): boolean {
    return name.toLowerCase().endsWith('.pdf');
  }
}
