import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Accounts } from '../../accounts';
import { DftButton } from '../../button/button';
import { SideNav } from '../../menu-bar/side-nav';
import { SearchOption } from '../../search-frame/search-frame';
import { StatusTag, StatusTone } from '../../status-tag/status-tag';
import { TopHeader } from '../../top-header/top-header';
import { caseStatusLabel, caseStatusTone, filingRefId, readCaseStatus } from '../requests/case-status';
import { thaitrMeasures } from './thaitr-measures';

type Band = 'all' | 'measure' | 'doing' | 'wait' | 'cancel';

type RegistryCase = {
  code: string;
  goods: string;
  origin: string;
  measure: string;
  side: 'ใช้' | 'ถูก';
  hs: string;
  year: string;
  date: string;
  status: string;
  tone: StatusTone;
  live: boolean;
};

const measureCodes: SearchOption[] = [
  { value: 'AD', label: 'AD' },
  { value: 'CVD', label: 'CVD' },
  { value: 'SG', label: 'SG' },
  { value: 'AC', label: 'AC' },
];

const countryNames = [
  'เครือรัฐออสเตรเลีย', 'แคนาดา', 'ญี่ปุ่น', 'ไต้หวัน', 'มาเลเซีย', 'ไม่ระบุประเทศ', 'ยูเครน',
  'ราชอาณาจักรบาห์เรน', 'ราชอาณาจักรโมร็อกโก', 'ราชอาณาจักรฮัชไมต์จอร์แดน', 'โรมาเนีย',
  'สหพันธรัฐรัสเซีย', 'สหพันธ์สาธารณรัฐบราซิล', 'สหภาพยุโรป', 'สหรัฐเม็กซิโก', 'สหรัฐอเมริกา',
  'สหราชอาณาจักรบริเตนใหญ่ และไอร์แลนด์เหนือ', 'สาธารณรัฐเกาหลี', 'สาธารณรัฐคาซัคสถาน',
  'สาธารณรัฐเช็ก', 'สาธารณรัฐแซมเบีย', 'สาธารณรัฐโดมินิกัน', 'สาธารณรัฐตุรกี', 'สาธารณรัฐตูนิเซีย',
  'สาธารณรัฐประชาชนจีน', 'สาธารณรัฐประชาธิปไตยประชาชนแอลจีเรีย', 'สาธารณรัฐเปรู', 'สาธารณรัฐโปแลนด์',
  'สาธารณรัฐฟิลิปปินส์', 'สาธารณรัฐมาดากัสการ์', 'สาธารณรัฐเวเนซุเอลา', 'สาธารณรัฐสโลวัก',
  'สาธารณรัฐสังคมนิยมเวียดนาม', 'สาธารณรัฐอาร์เจนตินา', 'สาธารณรัฐอาหรับอียิปต์', 'สาธารณรัฐอินเดีย',
  'สาธารณรัฐอินโดนีเซีย', 'สาธารณรัฐอิสลามปากีสถาน', 'สาธารณรัฐอิสลามอิหร่าน', 'สาธารณรัฐแอฟริกาใต้',
];

const years: SearchOption[] = Array.from({ length: 2569 - 2533 + 1 }, (_, index) => {
  const year = String(2533 + index);
  return { value: year, label: year };
});

const catalog: RegistryCase[] = thaitrMeasures.map((item) => ({
  code: item.code,
  goods: item.goods,
  origin: item.origin,
  measure: item.measure,
  side: item.side,
  hs: item.hs,
  year: item.date.slice(-4),
  date: item.date,
  status: item.status,
  tone: toneOf(item.status),
  live: false,
}));

function toneOf(status: string): StatusTone {
  if (status === 'ใช้มาตรการ' || status === 'ยื่นแบบ') return 'success';
  if (status === 'ใช้มาตรการและอยู่ระหว่างการทบทวน') return 'warning';
  if (status === 'ยุติ' || status === 'ยกเลิก') return 'neutral';
  if (status === 'ร่าง' || status === 'กรุณาแก้ไขข้อมูล') return 'warning';
  return 'info';
}

function bandOf(status: string): Band | '' {
  if (status === 'ใช้มาตรการ' || status === 'ใช้มาตรการและอยู่ระหว่างการทบทวน') return 'measure';
  if (status === 'ยุติ' || status === 'ยกเลิก') return 'cancel';
  if (status === 'ร่าง') return 'wait';
  if (!status) return '';
  return 'doing';
}

function stamp(date: string): number {
  const [day, month, year] = date.split('/').map(Number);
  if (!year) return 0;
  return year * 10000 + month * 100 + day;
}

@Component({
  selector: 'app-case-registry-page',
  imports: [TopHeader, SideNav, StatusTag, DftButton],
  templateUrl: './case-registry-page.html',
  styleUrl: './case-registry-page.css',
})
export class CaseRegistryPage {
  constructor(
    private readonly router: Router,
    private readonly accounts: Accounts,
  ) {
    if (this.accounts.role === 'officer') void this.router.navigateByUrl('/officer');
  }

  protected chip: Band = 'all';
  protected query = '';
  protected measure = '';
  protected status = '';
  protected country = '';
  protected fromYear = '';
  protected toYear = '';
  protected sort = 'ref-new';
  protected filtersOpen = false;
  protected page = 1;
  protected pageSize = 10;
  protected picked = new Set<string>();
  protected readonly pageSizes = [10, 20, 50];
  protected readonly measures = measureCodes;
  protected readonly countries = countryNames;
  protected readonly years = years;
  protected readonly sorts: SearchOption[] = [
    { value: 'ref-new', label: 'เลขอ้างอิง (ล่าสุด)' },
    { value: 'ref-old', label: 'เลขอ้างอิง (เก่าสุด)' },
    { value: 'date-new', label: 'วันที่ยื่น (ล่าสุด)' },
    { value: 'date-old', label: 'วันที่ยื่น (เก่าสุด)' },
  ];

  protected get rows(): RegistryCase[] {
    const status = caseStatusLabel(readCaseStatus());
    const live: RegistryCase = {
      code: filingRefId,
      goods: 'เหล็กแผ่นรีดร้อนชนิดเป็นม้วนและไม่เป็นม้วน',
      origin: 'เวียดนามและอียิปต์',
      measure: 'AD',
      side: 'ใช้',
      hs: '',
      year: '2562',
      date: '16/05/2562',
      status,
      tone: caseStatusTone(readCaseStatus()),
      live: true,
    };
    return [live, ...catalog];
  }

  protected get statuses(): string[] {
    return [...new Set(this.rows.map((row) => row.status).filter(Boolean))];
  }

  protected get visible(): RegistryCase[] {
    const rows = this.rows.filter((row) => this.matches(row));
    return [...rows].sort((a, b) => {
      if (a.live !== b.live) return a.live ? -1 : 1;
      if (this.sort.startsWith('date')) {
        const diff = stamp(a.date) - stamp(b.date);
        return this.sort.endsWith('new') ? -diff : diff;
      }
      const diff = a.code.localeCompare(b.code, 'en', { numeric: true });
      return this.sort.endsWith('new') ? -diff : diff;
    });
  }

  protected get pageCount(): number {
    return Math.max(1, Math.ceil(this.visible.length / this.pageSize));
  }

  protected get safePage(): number {
    return Math.min(this.page, this.pageCount);
  }

  protected get paged(): RegistryCase[] {
    const start = (this.safePage - 1) * this.pageSize;
    return this.visible.slice(start, start + this.pageSize);
  }

  protected get pageLabel(): string {
    if (!this.visible.length) return 'แสดง 0 จาก 0 รายการ';
    const start = (this.safePage - 1) * this.pageSize + 1;
    const end = Math.min(this.safePage * this.pageSize, this.visible.length);
    return `แสดง ${start}–${end} จาก ${this.visible.length} รายการ`;
  }

  protected get chips(): { id: Band; label: string; count: number }[] {
    const rows = this.rows;
    return [
      { id: 'all', label: 'ทั้งหมด', count: rows.length },
      { id: 'measure', label: 'ใช้มาตรการ', count: rows.filter((row) => bandOf(row.status) === 'measure').length },
      { id: 'doing', label: 'ระหว่างดำเนินการ', count: rows.filter((row) => bandOf(row.status) === 'doing').length },
      { id: 'wait', label: 'รอดำเนินการ', count: rows.filter((row) => bandOf(row.status) === 'wait').length },
      { id: 'cancel', label: 'ยกเลิก', count: rows.filter((row) => bandOf(row.status) === 'cancel').length },
    ];
  }

  protected get pageChecked(): boolean {
    return this.paged.length > 0 && this.paged.every((row) => this.picked.has(row.code));
  }

  protected published(row: RegistryCase): boolean {
    return !row.live;
  }

  protected publicUrl(row: RegistryCase): string {
    return `https://thaitr.dft.go.th/th/search/${row.code}`;
  }

  protected sideLabel(row: RegistryCase): string {
    return row.side === 'ถูก' ? 'ไทยถูกใช้มาตรการ' : 'ไทยใช้มาตรการ';
  }

  protected pickChip(id: Band): void {
    this.chip = id;
    this.page = 1;
  }

  protected pickSort(value: string): void {
    this.sort = value;
    this.page = 1;
  }

  protected sortBy(kind: 'ref' | 'date'): void {
    const newest = `${kind}-new`;
    this.pickSort(this.sort === newest ? `${kind}-old` : newest);
  }

  protected changed(): void {
    this.page = 1;
  }

  protected setPageSize(value: string): void {
    this.pageSize = Number(value) || 10;
    this.page = 1;
  }

  protected clearFilters(): void {
    this.query = '';
    this.measure = '';
    this.status = '';
    this.country = '';
    this.fromYear = '';
    this.toYear = '';
    this.sort = 'ref-new';
    this.chip = 'all';
    this.page = 1;
  }

  protected shiftPage(step: number): void {
    const next = this.safePage + step;
    if (next < 1 || next > this.pageCount) return;
    this.page = next;
  }

  protected goPage(page: number): void {
    if (page < 1 || page > this.pageCount) return;
    this.page = page;
  }

  protected toggle(code: string): void {
    const next = new Set(this.picked);
    if (next.has(code)) next.delete(code);
    else next.add(code);
    this.picked = next;
  }

  protected togglePage(): void {
    const next = new Set(this.picked);
    const codes = this.paged.map((row) => row.code);
    if (this.pageChecked) codes.forEach((code) => next.delete(code));
    else codes.forEach((code) => next.add(code));
    this.picked = next;
  }

  protected open(row: RegistryCase): void {
    if (!row.live) return;
    const role = this.accounts.role;
    if (role === 'staff') {
      void this.router.navigateByUrl('/staff/filing');
      return;
    }
    if (role === 'head' || role === 'officer') {
      void this.router.navigateByUrl('/officer/filing');
      return;
    }
    void this.router.navigateByUrl('/director/filing');
  }

  protected exportRows(): void {
    const source = this.picked.size ? this.visible.filter((row) => this.picked.has(row.code)) : this.visible;
    const header = ['เลขอ้างอิงคำขอ', 'เลขคดี', 'สินค้า', 'ประเทศ', 'มาตรการ', 'สถานะ', 'วันที่ยื่น', 'ลิงก์ thaitr'];
    const lines = source.map((row) => [
      row.live ? row.code : '',
      row.live ? '' : row.code,
      row.goods,
      row.origin,
      row.measure,
      row.status,
      row.date,
      row.live ? '' : this.publicUrl(row),
    ].map(csvCell).join(','));
    const blob = new Blob([`\uFEFF${header.join(',')}\n${lines.join('\n')}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'คำขอทั้งหมด.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  private matches(row: RegistryCase): boolean {
    const band = bandOf(row.status);
    if (this.chip !== 'all' && band !== this.chip) return false;
    if (this.measure && row.measure !== this.measure) return false;
    if (this.status && row.status !== this.status) return false;
    if (this.country && !this.originHit(row, this.country)) return false;
    const year = Number(row.year);
    if (this.fromYear && (!year || year < Number(this.fromYear))) return false;
    if (this.toYear && (!year || year > Number(this.toYear))) return false;
    const text = this.query.trim().toLowerCase();
    if (!text) return true;
    const bag = `${row.code} ${row.goods} ${row.origin} ${row.measure} ${row.status} ${this.sideLabel(row)}`.toLowerCase();
    if (bag.includes(text)) return true;
    const compact = text.replace(/\s/g, '');
    return /^\d{4,}$/.test(compact) && row.hs.replace(/\D/g, '').includes(compact);
  }

  private originHit(row: RegistryCase, country: string): boolean {
    if (row.origin.includes(country)) return true;
    return row.live && (country.includes('เวียดนาม') || country.includes('อียิปต์'));
  }
}

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}
