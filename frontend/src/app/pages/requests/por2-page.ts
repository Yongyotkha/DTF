import { ChangeDetectorRef, Component } from '@angular/core';
import { DftButton } from '../../button/button';
import { FilingTabs } from './filing-tabs';
import { FilledUpload } from './filled-upload';
import { fillApplicant, fillKnown, valueIsWrong, wrongHint } from './form-extract';
import { SideNav } from '../../menu-bar/side-nav';
import { StatusTag } from '../../status-tag/status-tag';
import { StepsMenuSection } from '../../steps-menu/steps-menu';
import { TopHeader } from '../../top-header/top-header';
import { filingMeasureTitle } from './filing-intent';
import { scrollFormToTop } from './form-scroll';

type DocItem = { key: string; title: string; hint?: string; required?: boolean; excel?: boolean };

type Applicant = {
  open: boolean;
  filing: '' | 'self' | 'behalf';
  behalf: string;
  specify: string;
  name: string;
  nation: string;
  address: string;
  province: string;
  district: string;
  subdistrict: string;
  phone: string;
  fax: string;
  email: string;
  foreign: boolean;
  files: Record<string, string>;
};

const behalfLeft = [
  { value: 'government', label: 'รัฐบาลของประเทศแหล่งกำเนิดหรือประเทศผู้ส่งออก' },
  { value: 'partial', label: 'ผู้ผลิตภายในประเทศบางส่วน' },
  { value: 'exporter', label: 'ผู้ส่งออกจากต่างประเทศ' },
  { value: 'other', label: 'บุคคลอื่นตามที่รัฐมนตรีว่าการกระทรวงพาณิชย์ประกาศกำหนด' },
];

const behalfRight = [
  { value: 'all', label: 'ผู้ผลิตภายในประเทศทั้งหมด' },
  { value: 'foreign', label: 'ผู้ผลิตในต่างประเทศ' },
  { value: 'importer', label: 'ผู้นำเข้าในประเทศ' },
];

const mainDocs: DocItem[] = [
  { key: 'proxy', title: 'ผู้ยื่นคำขอกระทำการแทน', excel: true },
  { key: 'cert', title: '(1) หนังสือรับรองบริษัท', required: true },
  { key: 'finance', title: '(2) งบการเงินที่ผู้สอบบัญชีรับอนุญาตรับรอง', required: true },
  { key: 'power', title: '(3) หนังสือมอบอำนาจ' },
  { key: 'goods', title: '(4) รายการและปริมาณสินค้าที่ผลิตและ/หรือจำหน่าย' },
];

const foreignDocs: DocItem[] = [
  {
    key: 'legal',
    title: 'หลักฐานรับรองการเป็นนิติบุคคล',
    hint: '(รับรองโดยโนตารีพับบลิค สถานกงสุลไทย หรือสถานเอกอัครราชทูตไทยประจำประเทศนั้น)',
  },
  { key: 'passport', title: 'สำเนาหนังสือเดินทางของผู้มีอำนาจกระทำการแทนที่ลงชื่อในคำขอ' },
];

function blankApplicant(open = true): Applicant {
  return {
    open,
    filing: '',
    behalf: '',
    specify: '',
    name: '',
    nation: '',
    address: '',
    province: '',
    district: '',
    subdistrict: '',
    phone: '',
    fax: '',
    email: '',
    foreign: false,
    files: {},
  };
}

@Component({
  selector: 'app-por2-page',
  imports: [TopHeader, SideNav, DftButton, StatusTag, FilledUpload, FilingTabs],
  templateUrl: './por2-page.html',
  styleUrl: './por1-page.css',
})
export class Por2Page {
  protected readonly filingTitle = filingMeasureTitle();
  protected measure = '';
  protected role = '';
  protected step = 'มาตรการและประเภทการยื่น';
  protected goods = '';
  protected notice = '';
  protected readonly changeReasons = [
    { key: 'normal', label: 'มูลค่าปกติ' },
    { key: 'injury', label: 'ความเสียหายของอุตสาหกรรมภายใน' },
    { key: 'exportPrice', label: 'ราคาส่งออก' },
    { key: 'benefit', label: 'ประโยชน์ที่ได้รับจากการอุดหนุน' },
  ] as const;
  protected reasons: Record<string, boolean> = { normal: false, injury: false, exportPrice: false, benefit: false };
  protected aim = '';
  protected evidence = [
    'พยานหลักฐานและข้อมูลรายละเอียดการเปลี่ยนแปลง-1.pdf',
    'พยานหลักฐานและข้อมูลรายละเอียดการเปลี่ยนแปลง-2.pdf',
  ];
  protected evidenceReady = true;
  protected ack = false;
  protected signer = '';
  protected roleTitle = '';
  protected signedOn = '';
  protected reviewOpen = false;
  protected uploadOpen = false;
  protected readOn = false;
  protected readonly behalfLeft = behalfLeft;
  protected readonly behalfRight = behalfRight;
  protected readonly mainDocs = mainDocs;
  protected readonly foreignDocs = foreignDocs;
  protected applicants: Applicant[] = [
    {
      ...blankApplicant(true),
      filing: 'behalf',
      behalf: 'other',
      foreign: true,
      files: {
        proxy: 'ผู้ยื่นคำขอกระทำการแทน.xls',
        cert: 'หนังสือรับรองบริษัท.pdf',
        finance: 'งบการเงินที่ผู้สอบบัญชีรับอนุญาตรับรอง.pdf',
        power: 'หนังสือมอบอำนาจ.pdf',
        goods: 'รายการและปริมาณสินค้าที่ผลิตและ/หรือจำหน่าย.pdf',
        legal: 'หลักฐานรับรองการเป็นนิติบุคคล.pdf',
        passport: 'สำเนาหนังสือเดินทางของผู้มีอำนาจกระทำการแทนที่ลงชื่อในคำขอ.pdf',
      },
    },
    blankApplicant(false),
    blankApplicant(false),
  ];
  protected readonly menu: StepsMenuSection[] = [
    {
      title: '1. ผู้ยื่นคำขอและมาตรการ',
      items: [
        { label: 'มาตรการและประเภทการยื่น', state: 'onclick' },
        { label: 'ข้อมูลและเอกสารประกอบ', state: 'default' },
      ],
    },
    {
      title: '2. รายการที่ขอให้ทบทวน',
      items: [{ label: 'สินค้า ประกาศ และเหตุที่เปลี่ยนแปลง', state: 'default' }],
    },
    {
      title: '3. วัตถุประสงค์การทบทวน',
      items: [{ label: 'วัตถุประสงค์และพยานหลักฐาน', state: 'default' }],
    },
    {
      title: '4. คำรับรอง',
      items: [{ label: 'คำรับรองและลงนาม', state: 'default' }],
    },
  ];

  constructor(private readonly view: ChangeDetectorRef) {}

  protected openFilledUpload(): void {
    this.uploadOpen = true;
  }
  protected readSpots: { contact: string[]; body: string[] } = { contact: ['ข้อมูลและเอกสารประกอบ'], body: ['สินค้า ประกาศ และเหตุที่เปลี่ยนแปลง'] };

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


  protected open(label: string, event?: Event): void {
    this.show(label);
    this.view.detectChanges();
    scrollFormToTop(event);
  }

  protected filled(label: string): boolean {
    const labels = this.labels();
    return labels.indexOf(label) <= labels.indexOf(this.step);
  }

  protected addApplicant(): void {
    this.applicants = [...this.applicants, blankApplicant(true)];
  }

  protected removeApplicant(index: number): void {
    if (this.applicants.length < 2) return;
    this.applicants = this.applicants.filter((_, item) => item !== index);
  }

  protected toggleApplicant(index: number): void {
    this.applicants = this.applicants.map((person, item) => (item === index ? { ...person, open: !person.open } : person));
  }

  protected setApplicant(index: number, patch: Partial<Applicant>): void {
    this.applicants = this.applicants.map((person, item) => (item === index ? { ...person, ...patch } : person));
  }

  protected pickFile(index: number, key: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    const name = input.files?.[0]?.name;
    if (!name) return;
    const person = this.applicants[index];
    this.setApplicant(index, { files: { ...person.files, [key]: name } });
  }

  protected clearFile(index: number, key: string): void {
    const files = { ...this.applicants[index].files };
    delete files[key];
    this.setApplicant(index, { files });
  }

  protected fileIcon(name: string): string {
    return name.endsWith('.xls') || name.endsWith('.xlsx') ? 'assets/icons/por2-xls.svg' : 'assets/icons/por2-pdf.svg';
  }

  protected toggleReason(key: string, checked: boolean): void {
    this.reasons = { ...this.reasons, [key]: checked };
  }

  protected addEvidence(event: Event): void {
    const input = event.target as HTMLInputElement;
    const name = input.files?.[0]?.name;
    if (!name) return;
    this.evidence = [...this.evidence, name];
    input.value = '';
  }

  protected removeEvidence(index: number): void {
    this.evidence = this.evidence.filter((_, item) => item !== index);
  }

  protected behalfChosen(value: string): boolean {
    return this.applicants[0]?.filing === 'behalf' && this.applicants[0]?.behalf === value;
  }

  private labels(): string[] {
    return this.menu.flatMap((section) => section.items.map((item) => item.label));
  }

  private show(label: string): void {
    const labels = this.labels();
    const index = labels.indexOf(label);
    let cursor = 0;
    for (const section of this.menu) {
      for (const item of section.items) {
        item.state = cursor < index ? 'success' : cursor === index ? 'onclick' : 'default';
        cursor += 1;
      }
    }
    this.step = label;
  }
}
