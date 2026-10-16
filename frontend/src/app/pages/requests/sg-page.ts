import { ChangeDetectorRef, Component } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DftButton } from '../../button/button';
import { SideNav } from '../../menu-bar/side-nav';
import { StatusTag } from '../../status-tag/status-tag';
import { TopHeader } from '../../top-header/top-header';
import { FilingTabs } from './filing-tabs';
import { FilledUpload } from './filled-upload';
import { fillApplicant, fillKnown, valueIsWrong, wrongHint } from './form-extract';
import { filingMeasureTitle } from './filing-intent';
import { scrollFormToTop } from './form-scroll';

type TocItem = { id: string; label: string };
type TocGroup = { label: string; items: TocItem[] };
type DocWhen = 'always' | 'self' | 'all' | 'some';
type DocItem = { key: string; label: string; accept: string; hint: string; section: string; when: DocWhen };
type Filing = 'self' | 'all' | 'some';
type Contact = { name: string; address: string; phone: string; fax: string; note: string };
type Related = { producer: string; importer: string; exporter: string; link: string; volume: string };
type ProducerStat = { name: string; cells: Record<string, string> };

@Component({
  selector: 'app-sg-page',
  imports: [TopHeader, SideNav, RouterLink, DftButton, StatusTag, FilledUpload, FilingTabs],
  templateUrl: './sg-page.html',
  styleUrl: './por1-page.css',
})
export class SgPage {
  protected readonly notice: boolean;
  protected filing: Filing = 'self';
  protected company = '';
  protected nationality = '';
  protected address = '';
  protected phone = '';
  protected fax = '';
  protected principal = '';
  protected principalAddress = '';
  protected principalPhone = '';
  protected principalFax = '';
  protected priorAid = '';
  protected tradeName = '';
  protected scienceName = '';
  protected hsCode = '';
  protected duty = '';
  protected physical = '';
  protected standard = '';
  protected process = '';
  protected channel = '';
  protected endUser = '';
  protected nonTariff = '';
  protected origin = '';
  protected exporterCountry = '';
  protected samePoint = '';
  protected differentPoint = '';
  protected unitImport = '';
  protected unitDemand = '';
  protected unitPerformance = '';
  protected trend = '';
  protected injury = '';
  protected provisional = '';
  protected advantage = '';
  protected plan = '';
  protected ack = false;
  protected signer = '';
  protected roleTitle = '';
  protected signedDate = '';
  protected reviewOpen = false;
  protected uploadOpen = false;
  protected readOn = false;
  protected docKey = 'statements';
  protected section = '1.1';
  protected files: Record<string, string[]> = {};
  protected importQty: Record<string, string> = {};
  protected importChange: Record<string, string> = {};
  protected demandQty: Record<string, string> = {};
  protected demandChange: Record<string, string> = {};
  protected industry: Record<string, string> = {};
  protected related: Related[] = [this.blankRelated()];
  protected contacts: Record<string, Contact[]> = {
    '3.1': [this.blankContact()],
    '3.2': [this.blankContact()],
    '3.3': [this.blankContact()],
    'annex-a': [this.blankContact()],
    'annex-b1': [this.blankContact()],
    'annex-b2': [this.blankContact()],
  };
  protected producers: ProducerStat[] = [{ name: '', cells: {} }];
  protected readonly years = [
    { key: 'now', label: 'ปีปัจจุบัน' },
    { key: 'y1', label: 'ปีย้อนหลังที่ 1' },
    { key: 'y2', label: 'ปีย้อนหลังที่ 2' },
    { key: 'y3', label: 'ปีย้อนหลังที่ 3' },
    { key: 'y4', label: 'ปีย้อนหลังที่ 4' },
    { key: 'y5', label: 'ปีย้อนหลังที่ 5' },
  ];
  protected readonly performanceRows = [
    { key: 'sales', label: 'ปริมาณขาย' },
    { key: 'share', label: 'ส่วนแบ่งตลาด' },
    { key: 'output', label: 'ปริมาณการผลิต' },
    { key: 'capacity', label: 'อัตราการใช้กำลังการผลิต' },
    { key: 'productivity', label: 'ผลิตภาพ' },
    { key: 'profit', label: 'กำไร/ขาดทุน' },
    { key: 'employment', label: 'จำนวนการจ้างงาน' },
    { key: 'stock', label: 'สินค้าคงเหลือ' },
    { key: 'export', label: 'การส่งออก' },
  ];
  protected readonly supportDocs: DocItem[] = [
    { key: 'statements', label: 'สำเนางบการเงินปีปัจจุบันและย้อนหลัง 5 ปี', accept: '.png,.jpg,.jpeg,.pdf', hint: 'ตรวจสอบแล้ว พร้อมรับรองสำเนาถูกต้อง จำนวน 2 ชุด', section: '1.1', when: 'always' },
    { key: 'cert', label: 'หนังสือรับรองการจดทะเบียนนิติบุคคล', accept: '.png,.jpg,.jpeg,.pdf', hint: 'เฉพาะนามสกุล png, jpg, jpeg, pdf', section: '1.1', when: 'self' },
    { key: 'goods', label: 'รายการสินค้าที่ผลิตและ/หรือจำหน่าย', accept: '.png,.jpg,.jpeg,.pdf,.xls,.xlsx,.doc,.docx', hint: 'เฉพาะนามสกุล png, jpg, jpeg, pdf, xls, xlsx, doc, docx', section: '1.1', when: 'self' },
    { key: 'catalog', label: 'ตัวอย่าง แค็ตตาล็อก หรือเอกสารโฆษณา', accept: '.png,.jpg,.jpeg,.pdf', hint: 'ประกอบลักษณะทางกายภาพของสินค้า ถ้ามี', section: '2', when: 'always' },
    { key: 'plan', label: 'เอกสารวิจัยหรือแผนแม่บทอุตสาหกรรม', accept: '.png,.jpg,.jpeg,.pdf,.doc,.docx', hint: 'แนบได้หากมีการศึกษาหรือแผนแม่บท', section: '6.2', when: 'always' },
    { key: 'aCert', label: 'หนังสือรับรองนิติบุคคลของผู้ผลิตทุกราย', accept: '.png,.jpg,.jpeg,.pdf', hint: 'ของผู้ผลิตที่ผู้ยื่นกระทำแทนทั้งหมด', section: 'annex-a', when: 'all' },
    { key: 'aFinance', label: 'งบการเงินที่ผู้สอบบัญชีรับรองของผู้ผลิตทุกราย', accept: '.png,.jpg,.jpeg,.pdf', hint: 'ของผู้ผลิตที่ผู้ยื่นกระทำแทนทั้งหมด', section: 'annex-a', when: 'all' },
    { key: 'aVolume', label: 'รายการและปริมาณสินค้าของผู้ผลิตทุกราย', accept: '.xls,.xlsx,.pdf,.doc,.docx', hint: 'ปริมาณที่ผลิตและหรือจำหน่าย', section: 'annex-a', when: 'all' },
    { key: 'aPower', label: 'หนังสือมอบอำนาจของผู้ผลิตทุกราย', accept: '.png,.jpg,.jpeg,.pdf,.doc,.docx', hint: 'ลายมือชื่อผู้มีอำนาจอยู่ในหนังสือมอบอำนาจ', section: 'annex-a', when: 'all' },
    { key: 'bCert', label: 'หนังสือรับรองนิติบุคคลของผู้ผลิตที่ถูกแทน', accept: '.png,.jpg,.jpeg,.pdf', hint: 'ของผู้ผลิตที่ให้ผู้ยื่นกระทำการแทน', section: 'annex-b1', when: 'some' },
    { key: 'bFinance', label: 'งบการเงินที่ผู้สอบบัญชีรับรองของผู้ผลิตที่ถูกแทน', accept: '.png,.jpg,.jpeg,.pdf', hint: 'ของผู้ผลิตที่ให้ผู้ยื่นกระทำการแทน', section: 'annex-b1', when: 'some' },
    { key: 'bVolume', label: 'รายการและปริมาณสินค้าของผู้ผลิตที่ถูกแทน', accept: '.xls,.xlsx,.pdf,.doc,.docx', hint: 'ปริมาณที่ผลิตและหรือจำหน่าย', section: 'annex-b1', when: 'some' },
    { key: 'bPower', label: 'หนังสือมอบอำนาจของผู้ผลิตที่ถูกแทน', accept: '.png,.jpg,.jpeg,.pdf,.doc,.docx', hint: 'ลายมือชื่อผู้มีอำนาจอยู่ในหนังสือมอบอำนาจ', section: 'annex-b1', when: 'some' },
    { key: 'b2Volume', label: 'รายการและปริมาณสินค้าของผู้ผลิตที่ไม่ได้ขอให้แทน', accept: '.xls,.xlsx,.pdf,.doc,.docx', hint: 'ของผู้ผลิตที่มิได้ขอให้กระทำการแทนทุกราย', section: 'annex-b2', when: 'some' },
    { key: 'other', label: 'เอกสารประกอบอื่น', accept: '.png,.jpg,.jpeg,.pdf,.doc,.docx', hint: 'รายละเอียดเพิ่มเติมเมื่อเนื้อที่ในแบบไม่พอ', section: 'other', when: 'always' },
  ];

  constructor(
    route: ActivatedRoute,
    private readonly view: ChangeDetectorRef,
  ) {
    this.notice = route.snapshot.data['form'] === 'notice';
  }

  protected get formCode(): string {
    return this.notice ? 'ประกาศ' : 'ยื่นคำขอ';
  }

  protected get heading(): string {
    return filingMeasureTitle('มาตราการ SG');
  }

  protected get lead(): string {
    return this.notice
      ? 'แบบคำขอท้ายประกาศกระทรวงพาณิชย์ เรื่อง หลักเกณฑ์ วิธีการ และเงื่อนไขในการยื่นคำขอให้พิจารณากำหนดมาตรการปกป้องจากการนำเข้าสินค้าที่เพิ่มขึ้น พ.ศ. 2551'
      : 'คำขอให้พิจารณาดำเนินการกำหนดมาตรการปกป้องจากการนำเข้าสินค้าที่เพิ่มขึ้น ตามพระราชบัญญัติมาตรการปกป้องจากการนำเข้าสินค้าที่เพิ่มขึ้น พ.ศ. 2550';
  }

  protected get toc(): TocGroup[] {
    const annex: TocItem[] = [];
    if (this.filing === 'all') annex.push({ id: 'annex-a', label: 'เอกสารผนวก ก. ผู้ผลิตทั้งหมด' });
    if (this.filing === 'some') {
      annex.push({ id: 'annex-b1', label: 'เอกสารผนวก ข. ผู้ผลิตที่ถูกแทน' });
      annex.push({ id: 'annex-b2', label: 'เอกสารผนวก ข. ผู้ผลิตที่ไม่ได้ขอให้แทน' });
    }
    return [
      {
        label: 'ส่วนที่ 1 ข้อมูลผู้ยื่นคำขอ',
        items: [
          { id: '1.1', label: '1.1 ผู้ยื่นคำขอ' },
          { id: '1.2', label: '1.2 ความเกี่ยวข้องกับผู้นำเข้าหรือผู้ส่งออก' },
          { id: '1.3', label: '1.3 คำขอมาตรการช่วยเหลือ' },
        ],
      },
      {
        label: 'ส่วนที่ 2 รายละเอียดของสินค้า',
        items: [{ id: '2', label: 'เปรียบเทียบสินค้าที่ถูกพิจารณา' }],
      },
      {
        label: 'ส่วนที่ 3 ผู้ผลิต ผู้ส่งออก และผู้นำเข้า',
        items: [
          { id: '3.1', label: '3.1 ผู้ผลิตหรือผู้ส่งออกจากต่างประเทศ' },
          { id: '3.2', label: '3.2 ผู้นำเข้าในประเทศ' },
          { id: '3.3', label: '3.3 สมาคมหรือกลุ่มผู้ใช้สินค้า' },
        ],
      },
      {
        label: 'ส่วนที่ 4 แนวโน้มการนำเข้าและความต้องการใช้',
        items: [
          { id: '4.1', label: '4.1 ปริมาณการนำเข้า' },
          { id: '4.2', label: '4.2 ความต้องการใช้ภายในประเทศ' },
          { id: '4.3', label: '4.3 แนวโน้มการเพิ่มขึ้น' },
        ],
      },
      {
        label: 'ส่วนที่ 5 ผลการดำเนินงานของอุตสาหกรรมภายใน',
        items: [
          { id: '5.1', label: '5.1 ตารางผลประกอบการ' },
          { id: '5.2', label: '5.2 ผลกระทบต่ออุตสาหกรรม' },
          { id: '5.3', label: '5.3 มาตรการปกป้องชั่วคราว' },
        ],
      },
      {
        label: 'ส่วนที่ 6 แผนปรับตัว',
        items: [
          { id: '6.1', label: '6.1 ข้อได้เปรียบหรือเสียเปรียบ' },
          { id: '6.2', label: '6.2 แผนปรับปรุง' },
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

  protected get contactRows(): Contact[] {
    return this.contacts[this.section] ?? [];
  }

  protected get filingLabel(): string {
    if (this.filing === 'all') return 'กระทำแทนผู้ผลิตทั้งหมด';
    if (this.filing === 'some') return 'กระทำการแทนผู้ผลิตบางส่วน';
    return 'ยื่นคำขอโดยผู้ผลิตรายเดียว';
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

  protected yearValue(map: Record<string, string>, year: string): string {
    return map[year] ?? '';
  }

  protected setYear(map: 'importQty' | 'importChange' | 'demandQty' | 'demandChange', year: string, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this[map] = { ...this[map], [year]: value };
  }

  protected industryValue(metric: string, year: string): string {
    return this.industry[`${metric}|${year}`] ?? '';
  }

  protected setIndustry(metric: string, year: string, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.industry = { ...this.industry, [`${metric}|${year}`]: value };
  }

  protected producerValue(index: number, metric: string, year: string): string {
    return this.producers[index]?.cells[`${metric}|${year}`] ?? '';
  }

  protected setProducerName(index: number, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.producers = this.producers.map((row, i) => (i === index ? { ...row, name: value } : row));
  }

  protected setProducer(index: number, metric: string, year: string, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.producers = this.producers.map((row, i) =>
      i === index ? { ...row, cells: { ...row.cells, [`${metric}|${year}`]: value } } : row,
    );
  }

  protected addProducer(): void {
    this.producers = [...this.producers, { name: '', cells: {} }];
  }

  protected removeProducer(index: number): void {
    if (this.producers.length < 2) return;
    this.producers = this.producers.filter((_, i) => i !== index);
  }

  protected addRelated(): void {
    this.related = [...this.related, this.blankRelated()];
  }

  protected setRelated(index: number, field: keyof Related, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.related = this.related.map((row, i) => (i === index ? { ...row, [field]: value } : row));
  }

  protected removeRelated(index: number): void {
    if (this.related.length < 2) return;
    this.related = this.related.filter((_, i) => i !== index);
  }

  protected addContact(): void {
    const rows = this.contacts[this.section];
    if (!rows) return;
    this.contacts = { ...this.contacts, [this.section]: [...rows, this.blankContact()] };
  }

  protected setContact(index: number, field: keyof Contact, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    const rows = this.contacts[this.section] ?? [];
    this.contacts = {
      ...this.contacts,
      [this.section]: rows.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    };
  }

  protected removeContact(index: number): void {
    const rows = this.contacts[this.section] ?? [];
    if (rows.length < 2) return;
    this.contacts = { ...this.contacts, [this.section]: rows.filter((_, i) => i !== index) };
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
    return this.filing === 'some';
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

  private blankContact(): Contact {
    return { name: '', address: '', phone: '', fax: '', note: '' };
  }

  private blankRelated(): Related {
    return { producer: '', importer: '', exporter: '', link: '', volume: '' };
  }

  private keepSection(): void {
    const ids = this.toc.flatMap((group) => group.items.map((row) => row.id));
    if (!ids.includes(this.section)) this.section = '1.1';
    this.view.detectChanges();
  }
}
