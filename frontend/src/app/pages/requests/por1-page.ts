import { NgTemplateOutlet } from '@angular/common';
import { Component } from '@angular/core';
import { DftButton } from '../../button/button';
import { SideNav } from '../../menu-bar/side-nav';
import { TopHeader } from '../../top-header/top-header';

type Section = { id: string; label: string; child: boolean };

type GoodsRow = { producer: string; goods: string; made: string; sold: string; unit: string };
type MakerRow = { name: string; address: string; phone: string; fax: string; web: string; email: string };
type PartyBlock = { key: string; title: string; nameLabel: string; wrapped: boolean; rows: MakerRow[] };

function emptyParty(): MakerRow {
  return { name: '', address: '', phone: '', fax: '', web: '', email: '' };
}
type DocFile = { name: string; saved: string };
type DocTarget = 'goods' | 'export' | 'margin' | 'subsidy' | 'explain' | 'import' | 'factor' | 'summary' | 'trend' | 'intent';

function seedDoc(): DocFile[] {
  return [{ name: 'file name.pdf', saved: '29/09/2569' }];
}
type CostRow = { item: string; amount: string; percent: string };

function emptyCost(): CostRow {
  return { item: '', amount: '', percent: '' };
}

const sections: Section[] = [
  { id: '1', label: '1. ข้อมูลผู้ยื่นคำขอ', child: false },
  { id: '2', label: '2. รายละเอียด', child: false },
  { id: '3', label: '3. ข้อมูลเกี่ยวกับผู้ผลิตหรือผู้ส่งออก', child: false },
  { id: '4', label: '4. มูลค่าปกติ', child: false },
  { id: '5', label: '5. ราคาส่งออก', child: false },
  { id: '6', label: '6. ส่วนเหลื่อมการทุ่มตลาด', child: false },
  { id: '7', label: '7. การอุดหนุน', child: false },
  { id: '7.1', label: '7.1 เอกสารเกี่ยวกับโครงการอุดหนุน', child: true },
  { id: '7.2', label: '7.2 อธิบายการอุดหนุน', child: true },
  { id: '7.3', label: '7.3 การอุดหนุนเจาะจง', child: true },
  { id: '7.4', label: '7.4 ประโยชน์ที่ผู้ส่งออก', child: true },
  { id: '8', label: '8. การประเมินความเสียหายของอุตสาหกรรมภายใน', child: false },
  { id: '8.1', label: '8.1 ข้อมูลการนำเข้าสินค้าที่ถูกพิจารณา', child: true },
  { id: '8.2', label: '8.2 ผลกระทบด้านราคา', child: true },
  { id: '8.3', label: '8.3 สภาวะของผู้ยื่นคำขอ', child: true },
  { id: '8.4', label: '8.4 ข้อมูลเกี่ยวกับปัจจัยอื่นๆ', child: true },
  { id: '8.5', label: '8.5 สรุปสินค้าที่ถูกพิจารณา', child: true },
  { id: '8.6', label: '8.6 ข้อมูลผู้ซื้อ', child: true },
  { id: '8.7', label: '8.7 ข้อมูลแนวโน้มที่จะเกิดขึ้น', child: true },
  { id: '8.8', label: '8.8 ประสงค์ให้พิจารณาไต่สวน', child: true },
  { id: '9', label: '9. คำรับรองและลงนาม', child: false },
];

@Component({
  selector: 'app-por1-page',
  imports: [TopHeader, SideNav, DftButton, NgTemplateOutlet],
  templateUrl: './por1-page.html',
  styleUrl: './por1-page.css',
})
export class Por1Page {
  protected readonly sections = sections;
  protected section = '1';
  protected measure = '';
  protected filing: 'self' | 'all' | 'part' = 'self';
  protected nationality = 'ไทย';
  protected readonly nationalities = ['ไทย'];
  protected company = '';
  protected address = '';
  protected phone = '';
  protected fax = '';
  protected email = '';
  protected agent = '';
  protected agentPhone = '';
  protected agentFax = '';
  protected agentEmail = '';
  protected goods: GoodsRow[] = [{ producer: '', goods: '', made: '', sold: '', unit: '' }];
  protected makers: MakerRow[] = [emptyParty()];
  protected readonly parties: PartyBlock[] = [
    { key: 'producers', title: 'รายชื่อผู้ผลิต', nameLabel: 'รายชื่อผู้ผลิต', wrapped: false, rows: [emptyParty()] },
    { key: 'exporters', title: 'รายชื่อผู้ส่งออก', nameLabel: 'รายชื่อผู้ส่งออก', wrapped: false, rows: [emptyParty()] },
    { key: 'importers', title: 'รายชื่อผู้นำเข้า', nameLabel: 'รายชื่อผู้นำเข้า', wrapped: false, rows: [emptyParty()] },
    {
      key: 'users',
      title: 'รายชื่อสมาคมหรือกลุ่มอุตสาหกรรมผู้ใช้',
      nameLabel: 'รายชื่อสมาคม/กลุ่มอุตสาหกรรมผู้ใช้',
      wrapped: true,
      rows: [emptyParty()],
    },
  ];
  protected readonly files: Record<string, string> = {};
  protected exampleOpen = false;
  protected market = '';
  protected trade = '';
  protected special = '';
  protected method = '';
  protected exportCountry = 'ไทย';
  protected compareCountry = 'ไทย';
  protected currency = '';
  protected factoryNote = '';
  protected thirdReason = '';
  protected originDetail = '';
  protected thaiDetail = '';
  protected specialDetail = '';
  protected compareReason = '';
  protected originPeriod = '';
  protected thaiPeriod = '';
  protected originCosts: CostRow[] = [emptyCost()];
  protected thaiCosts: CostRow[] = [emptyCost()];
  protected docs: DocFile[] = [{ name: 'file name.pdf', saved: '29/09/2569' }];
  protected exportDetail = '';
  protected exportDocs: DocFile[] = [{ name: 'file name.pdf', saved: '29/09/2569' }];
  protected marginDocs: DocFile[] = [{ name: 'file name.pdf', saved: '29/09/2569' }];
  protected subsidyDocs: DocFile[] = [{ name: 'file name.pdf', saved: '29/09/2569' }];
  protected explainDetail = '';
  protected explainDocs: DocFile[] = [{ name: 'file name.pdf', saved: '29/09/2569' }];
  protected readonly conditions = [
    { key: 'sales', label: 'ยอดจำหน่ายภายในประเทศ' },
    { key: 'priceFactors', label: 'ปัจจัยที่มีผลกระทบต่อราคา' },
    { key: 'profit', label: 'กำไร (ขาดทุน) จากการขายในประเทศ' },
    { key: 'output', label: 'ผลผลิต' },
    { key: 'share', label: 'ส่วนแบ่งตลาด' },
    { key: 'productivity', label: 'ผลิตภาพ' },
    { key: 'capacity', label: 'กำลังการผลิตและอัตราการใช้กำลังการผลิต' },
    { key: 'stock', label: 'สินค้าคงคลัง' },
    { key: 'employment', label: 'การจ้างงาน' },
    { key: 'wages', label: 'ค่าจ้างแรงงาน' },
    { key: 'growth', label: 'อัตราการเจริญเติบโต' },
    { key: 'return', label: 'ผลตอบแทนจากการลงทุน' },
    { key: 'cash', label: 'กระแสเงินสด' },
    { key: 'funding', label: 'ความสามารถในการระดมทุนหรือการลงทุน' },
    { key: 'marginSize', label: 'ความมากน้อยของส่วนเหลื่อมการทุ่มตลาด' },
    { key: 'otherIndex', label: 'ปัจจัยและดัชนีทางเศรษฐกิจอื่น ๆ นอกจากที่ระบุมาข้างต้น' },
  ];
  protected sheets: Record<'import' | 'factor' | 'summary' | 'trend' | 'intent', DocFile[]> = {
    import: seedDoc(),
    factor: seedDoc(),
    summary: seedDoc(),
    trend: seedDoc(),
    intent: seedDoc(),
  };
  protected notes: Record<string, string> = {};
  protected submitOpen = false;
  protected ack = false;
  protected signer = '';
  protected roleTitle = '';
  protected signedOn = '';

  protected get onBehalf(): boolean {
    return this.filing !== 'self';
  }

  protected addRow(): void {
    if (this.onBehalf) {
      this.makers = [...this.makers, emptyParty()];
      return;
    }
    this.goods = [...this.goods, { producer: '', goods: '', made: '', sold: '', unit: '' }];
  }

  protected addParty(block: PartyBlock): void {
    block.rows = [...block.rows, emptyParty()];
  }

  protected get showDomestic(): boolean {
    return this.market === 'yes' || (this.market === 'no' && this.method === '451');
  }

  protected get showThird(): boolean {
    return this.market === 'yes';
  }

  protected get showOrigin(): boolean {
    return this.market === 'yes' || (this.market === 'no' && this.method === '452');
  }

  protected get showThaiCost(): boolean {
    return this.market === 'yes' || (this.market === 'no' && this.method === '453');
  }

  protected addCost(target: 'origin' | 'thai'): void {
    if (target === 'origin') {
      this.originCosts = [...this.originCosts, emptyCost()];
      return;
    }
    this.thaiCosts = [...this.thaiCosts, emptyCost()];
  }

  protected pick(key: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    this.files[key] = input.files?.[0]?.name ?? '';
  }

  protected passed(item: Section): boolean {
    if (item.id === '7' || item.id === '8') return false;
    const current = this.sections.findIndex((entry) => entry.id === this.section);
    const index = this.sections.findIndex((entry) => entry.id === item.id);
    return index < current;
  }

  protected sheetFiles(key: string): DocFile[] {
    if (key === 'import' || key === 'factor' || key === 'summary' || key === 'trend' || key === 'intent') {
      return this.sheets[key];
    }
    return [];
  }

  protected note(key: string): string {
    return this.notes[key] ?? '';
  }

  protected setNote(key: string, value: string): void {
    this.notes = { ...this.notes, [key]: value };
  }

  protected addDocs(list: FileList | null, target: DocTarget = 'goods'): void {
    if (!list?.length) return;
    const saved = this.today();
    const next = [...list].map((file) => ({ name: file.name, saved }));
    if (target === 'import' || target === 'factor' || target === 'summary' || target === 'trend' || target === 'intent') {
      this.sheets = { ...this.sheets, [target]: [...this.sheets[target], ...next] };
      return;
    }
    const lists = {
      goods: this.docs,
      export: this.exportDocs,
      margin: this.marginDocs,
      subsidy: this.subsidyDocs,
      explain: this.explainDocs,
    };
    const updated = [...lists[target], ...next];
    if (target === 'export') this.exportDocs = updated;
    else if (target === 'margin') this.marginDocs = updated;
    else if (target === 'subsidy') this.subsidyDocs = updated;
    else if (target === 'explain') this.explainDocs = updated;
    else this.docs = updated;
  }

  protected dropDocs(event: DragEvent, target: DocTarget = 'goods'): void {
    event.preventDefault();
    this.addDocs(event.dataTransfer?.files ?? null, target);
  }

  protected removeDoc(index: number, target: DocTarget = 'goods'): void {
    if (target === 'import' || target === 'factor' || target === 'summary' || target === 'trend' || target === 'intent') {
      this.sheets = { ...this.sheets, [target]: this.sheets[target].filter((_, item) => item !== index) };
      return;
    }
    const current = {
      goods: this.docs,
      export: this.exportDocs,
      margin: this.marginDocs,
      subsidy: this.subsidyDocs,
      explain: this.explainDocs,
    }[target].filter((_, item) => item !== index);
    if (target === 'export') this.exportDocs = current;
    else if (target === 'margin') this.marginDocs = current;
    else if (target === 'subsidy') this.subsidyDocs = current;
    else if (target === 'explain') this.explainDocs = current;
    else this.docs = current;
  }

  private today(): string {
    const date = new Date();
    const day = `${date.getDate()}`.padStart(2, '0');
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    return `${day}/${month}/${date.getFullYear() + 543}`;
  }
}
