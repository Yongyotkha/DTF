import { ChangeDetectorRef, Component } from '@angular/core';
import { DftButton } from '../../button/button';
import { SideNav } from '../../menu-bar/side-nav';
import { StatusTag } from '../../status-tag/status-tag';
import { StepsMenuSection } from '../../steps-menu/steps-menu';
import { TopHeader } from '../../top-header/top-header';
@Component({
  selector: 'app-por3-page',
  imports: [TopHeader, SideNav, DftButton, StatusTag],
  templateUrl: './por3-page.html',
  styleUrl: './por3-page.css',
})
export class Por3Page {
  protected measure: 'dumping' | 'subsidy' = 'dumping';
  protected filing: 'self' | 'all' | 'part' = 'self';
  protected step = '1.1 ประเภทของการยื่นคำขอ';
  protected reviewOpen = false;
  protected goods = '';
  protected notice = '';
  protected stopReason = '';
  protected evidence: string[] = [];
  protected stopFiles: string[] = [];
  protected otherFiles: string[] = [];
  protected evidenceReady = false;
  protected stopReady = false;
  protected ack = false;
  protected signer = '';
  protected roleTitle = '';
  protected signedOn = '';
  protected applicants = [this.blank()];
  protected readonly mainDocs = [
    { key: 'cert', title: '(1) หนังสือรับรองบริษัท', required: true },
    { key: 'finance', title: '(2) งบการเงินที่ผู้สอบบัญชีรับอนุญาตรับรอง', required: true },
    { key: 'power', title: '(3) หนังสือมอบอำนาจ', required: false },
    { key: 'goods', title: '(4) รายการและปริมาณสินค้าที่ผลิตและ/หรือจำหน่าย', required: false },
  ];
  protected readonly foreignDocs = [
    { key: 'legal', title: 'หลักฐานรับรองการเป็นนิติบุคคล', hint: '(รับรองโดยโนตารีพับบลิค สถานกงสุลไทย หรือสถานเอกอัครราชทูตไทยประจำประเทศนั้น)' },
    { key: 'passport', title: 'สำเนาหนังสือเดินทางของผู้มีอำนาจกระทำการแทนที่ลงชื่อในคำขอ', hint: '' },
  ];
  protected readonly menu: StepsMenuSection[] = [
    { title: 'ส่วนที่ 1 ข้อมูลผู้ยื่นคำขอ', items: [
      { label: '1.1 ประเภทของการยื่นคำขอ', state: 'onclick' },
      { label: '1.2 ข้อมูลและเอกสารประกอบ', state: 'default' },
      { label: '1.3 ผู้ยื่นคำขอ', state: 'default' },
    ]},
    { title: 'ส่วนที่ 2 ทบทวนการเรียกเก็บอากร', items: [
      { label: 'พิจารณาทบทวนการเรียกเก็บอากรตอบโต้การทุ่มตลาดหรือการอุดหนุน', state: 'default' },
    ]},
    { title: 'ส่วนที่ 3 ยุติการเรียกเก็บอากร', items: [
      { label: 'ยุติการเรียกเก็บอากรตอบโต้การทุ่มตลาดหรือการอุดหนุน', state: 'default' },
    ]},
    { title: 'ส่วนที่ 4 คำรับรองและลงนาม', items: [
      { label: 'คำรับรองและลงนาม', state: 'default' },
    ]},
    { title: 'ส่วนที่ 5 เอกสารอื่น ๆ ที่แนบประกอบ', items: [
      { label: 'เอกสารประกอบอื่นๆ', state: 'default' },
    ]},
  ];
  constructor(private readonly view: ChangeDetectorRef) {}
  private blank(open = true) {
    return { open, name: '', nation: '', address: '', province: '', district: '', subdistrict: '', phone: '', fax: '', email: '', foreign: false, files: {} as Record<string, string> };
  }
  protected open(label: string): void {
    const labels = this.labels();
    const index = labels.indexOf(label);
    let n = 0;
    for (const section of this.menu) {
      for (const item of section.items) {
        item.state = n < index ? 'success' : n === index ? 'onclick' : 'default';
        n += 1;
      }
    }
    this.step = label;
    this.view.detectChanges();
    requestAnimationFrame(() => {
      const el = document.getElementById('por3-step') ?? document.querySelector('.form');
      if (!(el instanceof HTMLElement)) return;
      const pin = document.querySelector('.review-pin');
      const offset = 65 + (pin instanceof HTMLElement ? pin.offsetHeight : 0);
      window.scrollTo({ top: Math.max(0, el.getBoundingClientRect().top + window.scrollY - offset) });
    });
  }
  protected filled(label: string): boolean {
    const labels = this.labels();
    return labels.indexOf(label) <= labels.indexOf(this.step);
  }
  protected addApplicant(): void { this.applicants = [...this.applicants, this.blank(true)]; }
  protected removeApplicant(i: number): void {
    if (this.applicants.length < 2) return;
    this.applicants = this.applicants.filter((_, n) => n !== i);
  }
  protected toggleApplicant(i: number): void {
    this.applicants = this.applicants.map((p, n) => n === i ? { ...p, open: !p.open } : p);
  }
  protected setApplicant(i: number, patch: Partial<(typeof this.applicants)[number]>): void {
    this.applicants = this.applicants.map((p, n) => n === i ? { ...p, ...patch } : p);
  }
  protected setField(i: number, key: 'name' | 'nation' | 'address' | 'province' | 'district' | 'subdistrict' | 'phone' | 'fax' | 'email' | 'foreign', event: Event): void {
    const el = event.target as HTMLInputElement | HTMLSelectElement;
    const value = key === 'foreign' ? (el as HTMLInputElement).checked : el.value;
    this.setApplicant(i, { [key]: value });
  }
  protected pickFile(i: number, key: string, event: Event): void {
    const name = (event.target as HTMLInputElement).files?.[0]?.name;
    if (!name) return;
    this.setApplicant(i, { files: { ...this.applicants[i].files, [key]: name } });
  }
  protected clearFile(i: number, key: string): void {
    const files = { ...this.applicants[i].files };
    delete files[key];
    this.setApplicant(i, { files });
  }
  protected addNamed(key: 'evidence' | 'stopFiles' | 'otherFiles', event: Event): void {
    const input = event.target as HTMLInputElement;
    const name = input.files?.[0]?.name;
    if (!name) return;
    this[key] = [...this[key], name];
    input.value = '';
  }
  protected removeNamed(key: 'evidence' | 'stopFiles' | 'otherFiles', i: number): void {
    this[key] = this[key].filter((_, n) => n !== i);
  }
  private labels(): string[] { return this.menu.flatMap((s) => s.items.map((i) => i.label)); }
}
