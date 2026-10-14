import { ChangeDetectorRef, Component } from '@angular/core';
import { DftButton } from '../../button/button';
import { SideNav } from '../../menu-bar/side-nav';
import { StatusTag } from '../../status-tag/status-tag';
import { TopHeader } from '../../top-header/top-header';

type TocItem = { id: string; label: string };
type TocGroup = { label: string; items: TocItem[] };
type DocItem = { key: string; label: string; accept: string; hint: string; when: 'always' | 'self' | 'behalf'; group: 'support' | 'import' | 'evidence' | 'other' };

@Component({
  selector: 'app-por5-page',
  imports: [TopHeader, SideNav, DftButton, StatusTag],
  templateUrl: './por5-page.html',
  styleUrl: './por1-page.css',
})
export class Por5Page {
  protected measure: 'dumping' | 'subsidy' = 'dumping';
  protected importGoods = '';
  protected filing: 'self' | 'behalf' = 'self';
  protected behalfOf = '';
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
  protected goods = '';
  protected qty = '';
  protected importDate = '';
  protected entryNo = '';
  protected invoiceNo = '';
  protected notice = '';
  protected paidOn = '';
  protected paidAmount = '';
  protected paymentRef = '';
  protected margin: 'none' | 'lower' | '' = '';
  protected lowerRate = '';
  protected refund: 'all' | 'reduced' | '' = '';
  protected refundAmount = '';
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
    { key: 'parties', label: 'รายชื่อ ที่อยู่ และช่องทางติดต่อของผู้ที่กระทำการแทน', accept: '.png,.jpg,.jpeg,.pdf,.xls,.xlsx,.doc,.docx', hint: 'เอกสารแนบรายชื่อ ที่อยู่ โทรศัพท์ โทรสาร เว็บไซต์ และไปรษณีย์อิเล็กทรอนิกส์', when: 'behalf', group: 'support' },
    { key: 'power', label: 'หนังสือมอบอำนาจ', accept: '.png,.jpg,.jpeg,.pdf,.doc,.docx', hint: 'เฉพาะนามสกุล png, jpg, jpeg, pdf, doc, docx', when: 'behalf', group: 'support' },
    { key: 'volume', label: 'รายการและปริมาณสินค้าที่ผลิตและ/หรือจำหน่าย', accept: '.png,.jpg,.jpeg,.pdf,.doc,.docx', hint: 'เฉพาะนามสกุล png, jpg, jpeg, pdf, doc, docx', when: 'behalf', group: 'support' },
    { key: 'entry', label: 'สำเนาใบขนสินค้า', accept: '.png,.jpg,.jpeg,.pdf', hint: 'สำเนาใบขนเลขที่ที่ระบุในข้อ 2', when: 'always', group: 'import' },
    { key: 'invoice', label: 'ใบแจ้งหนี้ ใบกำกับภาษี หรือใบเสร็จรับเงิน', accept: '.png,.jpg,.jpeg,.pdf', hint: 'เอกสารเลขที่ที่ระบุในข้อ 2', when: 'always', group: 'import' },
    { key: 'payment', label: 'หลักฐานการชำระอากรตอบโต้', accept: '.png,.jpg,.jpeg,.pdf', hint: 'หลักฐานเอกสารการชำระอากรตอบโต้การทุ่มตลาดหรือการอุดหนุน', when: 'always', group: 'import' },
    { key: 'margin', label: 'พยานหลักฐานส่วนเหลื่อมหรือประโยชน์จากการอุดหนุน', accept: '.png,.jpg,.jpeg,.pdf,.xls,.xlsx,.doc,.docx', hint: 'อ้างอิงรูปแบบตามแบบ ปร. 1 ในส่วนที่เกี่ยวข้อง ตามข้อ 3', when: 'always', group: 'evidence' },
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
      label: 'ส่วนที่ 2 การนำเข้าและชำระอากร',
      items: [{ id: '2', label: 'สินค้า ใบขน และการชำระอากร' }],
    },
    {
      label: 'ส่วนที่ 3 ส่วนเหลื่อมในขณะนำเข้า',
      items: [{ id: '3', label: 'ส่วนเหลื่อมหรือประโยชน์จากการอุดหนุน' }],
    },
    {
      label: 'ส่วนที่ 4 คำขอคืนอากร',
      items: [{ id: '4', label: 'จำนวนเงินที่ขอคืน' }],
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

  protected get visibleDocs(): DocItem[] {
    const group = this.section === '2' ? 'import' : this.section === '3' ? 'evidence' : this.section === 'other' ? 'other' : 'support';
    return this.supportDocs.filter((item) => item.group === group && this.showDoc(item));
  }

  protected get activeDoc(): DocItem {
    return this.visibleDocs.find((item) => item.key === this.docKey) ?? this.visibleDocs[0] ?? this.supportDocs[0];
  }

  protected get filingLabel(): string {
    if (this.filing === 'self') return 'ยื่นคำขอในนามตนเอง';
    return this.behalfOf ? `กระทำการแทน ${this.behalfOf}` : 'กระทำการแทน';
  }

  protected get marginLabel(): string {
    if (this.margin === 'none') return 'ไม่มีส่วนเหลื่อมการทุ่มตลาด หรือประโยชน์ที่ได้รับจากการอุดหนุน';
    if (this.margin === 'lower') return this.lowerRate ? `ส่วนเหลื่อมลดลงต่ำกว่าอัตราอากร เหลือ ${this.lowerRate}` : 'ส่วนเหลื่อมลดลงต่ำกว่าอัตราอากร';
    return 'ยังไม่เลือก';
  }

  protected get refundLabel(): string {
    if (this.refund === 'all') return this.refundAmount ? `คืนทั้งหมด ${this.refundAmount} บาท` : 'คืนทั้งหมด';
    if (this.refund === 'reduced') return this.refundAmount ? `ตามจำนวนที่ลดต่ำลง ${this.refundAmount} บาท` : 'ตามจำนวนที่ลดต่ำลง';
    return 'ยังไม่เลือก';
  }

  protected open(item: TocItem): void {
    this.section = item.id;
    if (item.id === 'docs') this.docKey = this.visibleDocs[0]?.key ?? 'cert';
    if (item.id === '2') this.docKey = 'entry';
    if (item.id === '3') this.docKey = 'margin';
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
    return this.filing === 'behalf';
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
