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
type DocWhen = 'always' | 'self' | 'all' | 'some' | 'power' | 'dumping' | 'subsidy' | 'completion';
type DocItem = { key: string; label: string; accept: string; hint: string; section: string; when: DocWhen };
type PartyRow = { name: string; address: string; phone: string; fax: string; web: string; email: string };
type Filing = 'self' | 'all' | 'some';

@Component({
  selector: 'app-por6-page',
  imports: [TopHeader, SideNav, RouterLink, DftButton, StatusTag, FilledUpload, FilingTabs],
  templateUrl: './por6-page.html',
  styleUrl: './por1-page.css',
})
export class Por6Page {
  protected readonly filingTitle = filingMeasureTitle('มาตราการ AC');
  protected measure: 'dumping' | 'subsidy' = 'dumping';
  protected filing: Filing = 'self';
  protected power = false;
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
  protected priorAid = '';
  protected adapt = '';
  protected notice = '';
  protected noticeDate = '';
  protected subjectGoods = '';
  protected subjectHs = '';
  protected country = '';
  protected subjectParties = '';
  protected currency = '';
  protected exchange = '';
  protected exchangeSource = '';
  protected tradePattern = '';
  protected modes: Record<string, boolean> = {};
  protected modifyWhere: 'origin' | 'other' = 'origin';
  protected modifyCountry = '';
  protected transitCountry = '';
  protected lowRateNames = '';
  protected completeWhere: 'thailand' | 'other' = 'thailand';
  protected completeCountry = '';
  protected assembleWhere: 'thailand' | 'other' = 'thailand';
  protected assembleCountry = '';
  protected consideredGoods = '';
  protected consideredHs = '';
  protected valueAdded = '';
  protected otherMode = '';
  protected economy = '';
  protected priceEffect = '';
  protected volumeEffect = '';
  protected dumpingProof = '';
  protected subsidyProof = '';
  protected compare: Record<string, { left: string; right: string }> = {};
  protected grantor = '';
  protected grantorId = '';
  protected companyAttorney = '';
  protected attorney = '';
  protected attorneyId = '';
  protected scopes: Record<string, boolean> = { file: true, amend: true, contact: true, process: true };
  protected scopeOther = '';
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
  protected parties: Record<string, PartyRow[]> = {
    '3.1': [this.blankParty()],
    '5.1': [this.blankParty()],
    '5.2': [this.blankParty()],
    '5.3': [this.blankParty()],
    'annex-a': [this.blankParty()],
    'annex-b1': [this.blankParty()],
    'annex-b2': [this.blankParty()],
  };
  protected readonly modeOptions = [
    { key: 'modify', label: '(1) แก้ไขดัดแปลงสินค้าที่ถูกใช้มาตรการเพียงเล็กน้อย โดยไม่มีผลต่อลักษณะหรือคุณสมบัติที่สำคัญ' },
    { key: 'transit', label: '(2) ส่งสินค้าที่ถูกใช้มาตรการจากประเทศที่ถูกใช้มาตรการมาประเทศไทยโดยผ่านประเทศอื่น' },
    { key: 'lowrate', label: '(3) ส่งผ่านผู้ผลิตหรือผู้ส่งออกที่ไม่ถูกเรียกเก็บ หรือถูกเรียกเก็บในอัตราที่ต่ำกว่า' },
    { key: 'complete', label: '(4) นำสินค้าที่ยังทำไม่สำเร็จมาทำให้สำเร็จในประเทศไทยหรือในประเทศอื่น' },
    { key: 'assemble', label: '(5) นำส่วนประกอบหรือชิ้นส่วนมาประกอบเป็นสินค้าที่เหมือนกับสินค้าที่ถูกใช้มาตรการ' },
    { key: 'other', label: '(6) รูปแบบอื่น' },
  ];
  protected readonly compareRows = [
    '1. ชื่อสินค้า ชื่อทางการค้า และชื่อทางวิทยาศาสตร์',
    '2. พิกัดอัตราศุลกากร และอัตราอากรขาเข้า',
    '3. ลักษณะทางกายภาพและโครงสร้าง',
    '4. ลักษณะทางเคมี',
    '5. มาตรฐานทางอุตสาหกรรม',
    '6. ขั้นตอนและกระบวนการผลิต',
    '7. ต้นทุนในการผลิตหรือดัดแปลงสินค้า',
    '8. ผู้ใช้สินค้าขั้นสุดท้าย',
    '9. การนำสินค้าไปใช้ขั้นสุดท้าย',
    '10. ความสามารถของการใช้สินค้าทดแทนกัน',
    '11. ความต้องการและความคาดหวังของลูกค้า',
    '12. ช่องทางการจัดจำหน่าย',
    '13. การทำการตลาดของสินค้า',
    '14. ราคาสินค้า',
    '15. การกำหนดราคาสินค้า',
    '16. มาตรการนำเข้าที่มิใช่ภาษี',
    '17. ประเทศแหล่งกำเนิด',
    '18. ประเทศผู้ส่งออก',
    '19. ข้อเปรียบเทียบอื่น',
  ];
  protected readonly scopeOptions = [
    { key: 'file', label: 'ยื่นคำขอและเอกสารประกอบคำขอ' },
    { key: 'amend', label: 'เปลี่ยนแปลงหรือแก้ไขข้อความหรือเอกสารตามคำขอ' },
    { key: 'contact', label: 'ให้ข้อมูลเพิ่มเติมและติดต่อประสานงานกับเจ้าหน้าที่' },
    { key: 'process', label: 'ดำเนินการแทนตลอดกระบวนการยื่นคำขอและกระบวนการไต่สวน' },
    { key: 'other', label: 'อื่น ๆ' },
  ];
  protected readonly supportDocs: DocItem[] = [
    { key: 'cert', label: 'หนังสือรับรองบริษัท', accept: '.png,.jpg,.jpeg,.pdf', hint: 'เฉพาะนามสกุล png, jpg, jpeg, pdf', section: '1.1', when: 'self' },
    { key: 'goodsList', label: 'รายการสินค้าที่ผลิตและ/หรือจำหน่าย', accept: '.png,.jpg,.jpeg,.pdf,.xls,.xlsx,.doc,.docx', hint: 'เฉพาะนามสกุล png, jpg, jpeg, pdf, xls, xlsx, doc, docx', section: '1.1', when: 'self' },
    { key: 'adapt', label: 'หลักฐานการปรับตัวและการดูแลผู้ใช้สินค้า', accept: '.png,.jpg,.jpeg,.pdf,.doc,.docx', hint: 'เอกสารหลักฐานประกอบข้อ 1.3', section: '1.3', when: 'always' },
    { key: 'trade', label: 'ตารางปริมาณและมูลค่าการนำเข้า', accept: '.xls,.xlsx,.pdf', hint: 'เปรียบเทียบก่อนและหลังการใช้มาตรการ', section: '3.2', when: 'always' },
    { key: 'modeProof', label: 'หลักฐานรูปแบบการหลบเลี่ยง', accept: '.png,.jpg,.jpeg,.pdf,.xls,.xlsx,.doc,.docx', hint: 'เอกสารที่น่าเชื่อถือของรูปแบบที่เลือกในข้อ 3.3', section: '3.3', when: 'always' },
    { key: 'valueAdded', label: 'ตารางคำนวณมูลค่าเพิ่มหรือสัดส่วนชิ้นส่วน', accept: '.xls,.xlsx,.pdf', hint: 'มูลค่าเพิ่มน้อยกว่าร้อยละ 25 และชิ้นส่วนไม่ต่ำกว่าร้อยละ 60 ตามรูปแบบที่เลือก', section: '3.3', when: 'completion' },
    { key: 'economy', label: 'หลักฐานเหตุผลทางเศรษฐกิจ', accept: '.png,.jpg,.jpeg,.pdf,.xls,.xlsx,.doc,.docx', hint: 'เอกสารสนับสนุนข้อ 3.4', section: '3.4', when: 'always' },
    { key: 'price', label: 'หลักฐานการบั่นทอนด้านราคา', accept: '.xls,.xlsx,.pdf', hint: 'เอกสารเปรียบเทียบราคา', section: '3.5', when: 'always' },
    { key: 'qty', label: 'หลักฐานการบั่นทอนด้านปริมาณ', accept: '.xls,.xlsx,.pdf', hint: 'เอกสารเปรียบเทียบปริมาณ', section: '3.5', when: 'always' },
    { key: 'dumping', label: 'หลักฐานการทุ่มตลาด', accept: '.png,.jpg,.jpeg,.pdf,.xls,.xlsx,.doc,.docx', hint: 'มูลค่าปกติ ราคาส่งออกหรือราคาขาย และปัจจัยที่ปรับเทียบ', section: '3.6', when: 'dumping' },
    { key: 'subsidy', label: 'หลักฐานการอุดหนุนที่ยังมีอยู่', accept: '.png,.jpg,.jpeg,.pdf,.xls,.xlsx,.doc,.docx', hint: 'เอกสารที่แสดงว่าประโยชน์จากการอุดหนุนยังมีอยู่', section: '3.6', when: 'subsidy' },
    { key: 'support', label: 'ข้อมูลสนับสนุนอื่น', accept: '.png,.jpg,.jpeg,.pdf,.doc,.docx', hint: 'เอกสารอื่นที่เกี่ยวข้องกับการหลบเลี่ยง', section: '3.7', when: 'always' },
    { key: 'catalog', label: 'ตัวอย่าง แค็ตตาล็อก หรือเอกสารโฆษณา', accept: '.png,.jpg,.jpeg,.pdf', hint: 'ประกอบลักษณะทางกายภาพของสินค้า', section: '4', when: 'always' },
    { key: 'aCert', label: 'หนังสือรับรองบริษัทของผู้ผลิตทุกราย', accept: '.png,.jpg,.jpeg,.pdf', hint: 'ของผู้ผลิตที่ผู้ยื่นกระทำการแทนทั้งหมด', section: 'annex-a', when: 'all' },
    { key: 'aPower', label: 'หนังสือมอบอำนาจของผู้ผลิตทุกราย', accept: '.png,.jpg,.jpeg,.pdf,.doc,.docx', hint: 'ของผู้ผลิตที่ผู้ยื่นกระทำการแทนทั้งหมด', section: 'annex-a', when: 'all' },
    { key: 'aVolume', label: 'รายการและปริมาณสินค้าของผู้ผลิตทุกราย', accept: '.xls,.xlsx,.pdf,.doc,.docx', hint: 'ปริมาณที่ผลิตและหรือจำหน่าย', section: 'annex-a', when: 'all' },
    { key: 'bCert', label: 'หนังสือรับรองบริษัทของผู้ผลิตที่ถูกแทน', accept: '.png,.jpg,.jpeg,.pdf', hint: 'ของผู้ผลิตที่ได้ขอให้กระทำการแทน', section: 'annex-b1', when: 'some' },
    { key: 'bPower', label: 'หนังสือมอบอำนาจของผู้ผลิตที่ถูกแทน', accept: '.png,.jpg,.jpeg,.pdf,.doc,.docx', hint: 'ของผู้ผลิตที่ได้ขอให้กระทำการแทน', section: 'annex-b1', when: 'some' },
    { key: 'bVolume', label: 'รายการและปริมาณสินค้าของผู้ผลิตที่ถูกแทน', accept: '.xls,.xlsx,.pdf,.doc,.docx', hint: 'ปริมาณที่ผลิตและหรือจำหน่าย', section: 'annex-b1', when: 'some' },
    { key: 'b2Volume', label: 'รายการและปริมาณสินค้าของผู้ผลิตที่ไม่ได้ขอให้แทน', accept: '.xls,.xlsx,.pdf,.doc,.docx', hint: 'ของผู้ผลิตที่มิได้ขอให้กระทำการแทนทุกราย', section: 'annex-b2', when: 'some' },
    { key: 'poaSigned', label: 'หนังสือมอบอำนาจฉบับลงนาม', accept: '.png,.jpg,.jpeg,.pdf', hint: 'ลงชื่อ ปิดอากรแสตมป์ และประทับตรานิติบุคคล', section: 'annex-c', when: 'power' },
    { key: 'poaCert', label: 'หนังสือรับรองนิติบุคคลหรือสมาคม', accept: '.png,.jpg,.jpeg,.pdf', hint: 'ออกให้ไม่เกิน 3 เดือนนับถึงวันที่ยื่นคำขอ', section: 'annex-c', when: 'power' },
    { key: 'poaId', label: 'สำเนาบัตรหรือหนังสือเดินทางของผู้มอบอำนาจ', accept: '.png,.jpg,.jpeg,.pdf', hint: 'คนต่างด้าวใช้สำเนาหนังสือเดินทาง', section: 'annex-c', when: 'power' },
    { key: 'poaWitness', label: 'สำเนาบัตรหรือหนังสือเดินทางของพยาน', accept: '.png,.jpg,.jpeg,.pdf', hint: 'คนต่างด้าวใช้สำเนาหนังสือเดินทาง', section: 'annex-c', when: 'power' },
    { key: 'other', label: 'เอกสารประกอบอื่น', accept: '.png,.jpg,.jpeg,.pdf,.doc,.docx', hint: 'ภาคผนวกหรือเอกสารเพิ่มเติม', section: 'other', when: 'always' },
  ];

  constructor(private readonly view: ChangeDetectorRef) {}

  protected get completion(): boolean {
    return !!this.modes['complete'] || !!this.modes['assemble'];
  }

  protected get toc(): TocGroup[] {
    const annex: TocItem[] = [];
    if (this.filing === 'all') annex.push({ id: 'annex-a', label: 'เอกสารผนวก ก. ผู้ผลิตทั้งหมด' });
    if (this.filing === 'some') {
      annex.push({ id: 'annex-b1', label: 'เอกสารผนวก ข. ผู้ผลิตที่ถูกแทน' });
      annex.push({ id: 'annex-b2', label: 'เอกสารผนวก ข. ผู้ผลิตที่ไม่ได้ขอให้แทน' });
    }
    if (this.power) annex.push({ id: 'annex-c', label: 'เอกสารผนวก ค. หนังสือมอบอำนาจ' });
    return [
      {
        label: 'ส่วนที่ 1 ข้อมูลทั่วไป',
        items: [
          { id: '1.1', label: '1.1 ผู้ยื่นคำขอ' },
          { id: '1.2', label: '1.2 คำขอมาตรการช่วยเหลือ' },
          { id: '1.3', label: '1.3 การปรับตัว' },
        ],
      },
      {
        label: 'ส่วนที่ 2 มาตรการที่มีการหลบเลี่ยง',
        items: [{ id: '2', label: 'ประกาศ สินค้า ประเทศ และผู้ถูกใช้มาตรการ' }],
      },
      {
        label: 'ส่วนที่ 3 การหลบเลี่ยงมาตรการตอบโต้',
        items: [
          { id: '3.1', label: '3.1 ผู้ถูกกล่าวหา' },
          { id: '3.2', label: '3.2 การเปลี่ยนรูปแบบทางการค้า' },
          { id: '3.3', label: '3.3 รูปแบบการหลบเลี่ยง' },
          { id: '3.4', label: '3.4 เหตุผลทางเศรษฐกิจ' },
          { id: '3.5', label: '3.5 การบั่นทอนราคาและปริมาณ' },
          { id: '3.6', label: '3.6 หลักฐานการทุ่มตลาดหรือการอุดหนุน' },
          { id: '3.7', label: '3.7 หลักฐานสนับสนุนอื่น' },
        ],
      },
      {
        label: 'ส่วนที่ 4 รายละเอียดสินค้าที่ถูกพิจารณา',
        items: [{ id: '4', label: this.completion ? '4.2 เปรียบเทียบสินค้าที่ทำให้สำเร็จหรือประกอบ' : '4.1 เปรียบเทียบสินค้าที่ถูกพิจารณา' }],
      },
      {
        label: 'ส่วนที่ 5 ผู้มีส่วนได้เสียอื่น',
        items: [
          { id: '5.1', label: '5.1 ผู้นำเข้า' },
          { id: '5.2', label: '5.2 ผู้ใช้สินค้า' },
          { id: '5.3', label: '5.3 ผู้ซื้อจากผู้ยื่น' },
        ],
      },
      ...(annex.length ? [{ label: 'เอกสารผนวก', items: annex }] : []),
      {
        label: 'คำรับรองและลงนาม',
        items: [{ id: '9', label: 'คำรับรองและลงนาม' }],
      },
      {
        label: 'เอกสารอื่น ๆ ที่แนบประกอบ',
        items: [{ id: 'other', label: 'ภาคผนวก และเอกสารประกอบอื่น' }],
      },
    ];
  }

  protected get visibleDocs(): DocItem[] {
    return this.supportDocs.filter((item) => this.showDoc(item));
  }

  protected get activeDoc(): DocItem {
    return this.visibleDocs.find((item) => item.key === this.docKey) ?? this.visibleDocs[0] ?? this.supportDocs[0];
  }

  protected get partyRows(): PartyRow[] {
    return this.parties[this.section] ?? [];
  }

  protected get filingLabel(): string {
    if (this.filing === 'all') return 'กระทำการแทนผู้ผลิตทั้งหมด';
    if (this.filing === 'some') return 'กระทำการแทนผู้ผลิตบางส่วน';
    return 'ยื่นคำขอในนามตนเอง';
  }

  protected get compareTitle(): string {
    return this.completion
      ? 'สินค้าที่ทำให้สำเร็จหรือประกอบเป็นสินค้าที่เหมือนกับสินค้าที่ถูกใช้มาตรการ'
      : 'สินค้าที่ถูกพิจารณา';
  }

  protected openFilledUpload(): void {
    this.uploadOpen = true;
  }
  protected readSpots: { contact: string[]; body: string[] } = { contact: ['1.1'], body: ['2'] };

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


  protected setFiling(value: Filing): void {
    this.filing = value;
    this.keepSection();
  }

  protected setPower(value: boolean): void {
    this.power = value;
    this.keepSection();
  }

  protected toggleMode(key: string, checked: boolean): void {
    this.modes = { ...this.modes, [key]: checked };
    this.view.detectChanges();
  }

  protected toggleScope(key: string, checked: boolean): void {
    this.scopes = { ...this.scopes, [key]: checked };
  }

  protected setCompare(row: string, side: 'left' | 'right', event: Event): void {
    const value = (event.target as HTMLTextAreaElement).value;
    const current = this.compare[row] ?? { left: '', right: '' };
    this.compare = { ...this.compare, [row]: { ...current, [side]: value } };
  }

  protected addParty(): void {
    const rows = this.parties[this.section];
    if (!rows) return;
    this.parties = { ...this.parties, [this.section]: [...rows, this.blankParty()] };
  }

  protected setParty(index: number, field: keyof PartyRow, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    const rows = this.parties[this.section] ?? [];
    this.parties = {
      ...this.parties,
      [this.section]: rows.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    };
  }

  protected removeParty(index: number): void {
    const rows = this.parties[this.section] ?? [];
    if (rows.length < 2) return;
    this.parties = { ...this.parties, [this.section]: rows.filter((_, i) => i !== index) };
  }

  protected open(item: TocItem, event?: Event): void {
    this.section = item.id;
    this.docKey = this.visibleDocs[0]?.key ?? this.docKey;
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
    if (item.section !== this.section) return false;
    if (item.when === 'always') return true;
    if (item.when === 'self') return this.filing === 'self';
    if (item.when === 'all') return this.filing === 'all';
    if (item.when === 'some') return this.filing === 'some';
    if (item.when === 'power') return this.power;
    if (item.when === 'dumping') return this.measure === 'dumping';
    if (item.when === 'subsidy') return this.measure === 'subsidy';
    return this.completion;
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

  private blankParty(): PartyRow {
    return { name: '', address: '', phone: '', fax: '', web: '', email: '' };
  }

  private keepSection(): void {
    const ids = this.toc.flatMap((group) => group.items.map((row) => row.id));
    if (!ids.includes(this.section)) this.section = '1.1';
    this.view.detectChanges();
  }
}
