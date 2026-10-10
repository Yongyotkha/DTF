import { Injectable, Component, EventEmitter, Input, OnInit, Output, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Accounts, roleHome } from '../accounts';
import { MenuGroup } from './menu-group';
import { MenuItem } from './menu-item';

const narrowQuery = '(max-width: 900px)';

@Injectable({ providedIn: 'root' })
export class SidebarState {
  readonly preference = signal<'expanded' | 'collapsed' | null>(null);
  readonly narrow = signal(typeof matchMedia === 'function' && matchMedia(narrowQuery).matches);
  readonly collapsed = computed(() => this.preference() === 'collapsed' || (this.preference() === null && this.narrow()));

  constructor() {
    if (typeof matchMedia !== 'function') return;
    const query = matchMedia(narrowQuery);
    query.addEventListener('change', () => this.narrow.set(query.matches));
  }
}

const menus = [
  { title: 'คำขอ', items: ['ยื่นคำขอ', 'รายการยื่นคำขอ', 'แก้ไขผู้กระทำแทน'] },
  { title: 'กระบวนการไต่สวน', items: ['ลงทะเบียนผู้มีส่วนได้เสีย', 'รับ-ส่งข้อมูลอื่นๆ'] },
  { title: 'คำร้อง', items: ['ยื่นคำร้องขอพบเจ้าหน้าที่', 'รายการยื่นคำร้องขอพบเจ้าหน้าที่', 'ยื่นคำร้องขอข้อมูลข่าวสาร', 'รายการยื่นคำร้องขอข้อมูลข่าวสาร'] },
];

const staffMenus = [
  { title: 'คำขอ', items: ['ยื่นคำขอ', 'รายการยื่นคำขอ', 'แก้ไขผู้กระทำแทน'] },
  { title: 'กระบวนการไต่สวน', items: ['ลงทะเบียนผู้มีส่วนได้เสีย', 'รับ-ส่งข้อมูลอื่นๆ', 'รายงาน'] },
  {
    title: 'ระบบ Task Management',
    items: ['ยื่นคำร้องขอพบเจ้าหน้าที่', 'รายการยื่นคำร้องขอพบเจ้าหน้าที่', 'ยื่นคำร้องขอข้อมูลข่าวสาร', 'รายการยื่นคำร้องขอข้อมูลข่าวสาร'],
  },
  { title: 'คำร้อง', items: ['ยื่นคำร้องขอพบเจ้าหน้าที่', 'รายการยื่นคำร้องขอพบเจ้าหน้าที่', 'ยื่นคำร้องขอข้อมูลข่าวสาร', 'รายการยื่นคำร้องขอข้อมูลข่าวสาร'] },
  { title: 'จัดเก็บเอกสารอิเล็กทรอนิกส์', items: [] },
  { title: 'ตั้งค่าระบบ', items: ['ตั้งค่าผู้ใช้งานและสิทธิ์เข้าใช้งาน'] },
];

@Component({
  selector: 'app-side-nav',
  imports: [MenuGroup, MenuItem],
  templateUrl: './side-nav.html',
  styleUrl: './side-nav.css',
  host: {
    '[class.side-nav--collapsed]': 'collapsed()',
    'aria-label': 'เมนูหลัก',
  },
})
export class SideNav implements OnInit {
  @Input() open = '';
  @Input() active = '';
  @Input() kind: 'applicant' | 'staff' = 'applicant';
  @Output() readonly chosen = new EventEmitter<string>();

  protected menuList() {
    return this.kind === 'staff' ? staffMenus : menus;
  }
  private readonly opened = signal<ReadonlySet<string>>(new Set());

  constructor(
    private readonly state: SidebarState,
    private readonly router: Router,
    private readonly accounts: Accounts,
  ) {}

  protected readonly version = '0.1.0';

  protected get collapsed() {
    return this.state.collapsed;
  }

  ngOnInit(): void {
    const titles = this.open === 'all' ? this.menuList().map((menu) => menu.title) : this.open ? [this.open] : [];
    this.opened.set(new Set(titles));
  }

  protected isOpen(title: string): boolean {
    return this.opened().has(title);
  }

  protected toggleGroup(title: string): void {
    const collapsed = this.state.collapsed();
    if (collapsed) this.expand();
    this.opened.update((current) => {
      const next = new Set(current);
      if (collapsed || !next.has(title)) next.add(title);
      else next.delete(title);
      return next;
    });
  }

  protected toggle(): void {
    this.state.preference.set(this.state.collapsed() ? 'expanded' : 'collapsed');
  }

  protected expand(): void {
    this.state.preference.set('expanded');
  }

  protected pick(label: string): void {
    if (label === 'ยื่นคำขอ') void this.router.navigate(['/requests'], { queryParams: { choose: '1' } });
    if (label === 'รายการยื่นคำขอ') void this.router.navigate(['/requests']);
    if (label === 'หน้าหลัก' || label === 'หน้าแรก') {
      const role = this.accounts.role;
      void this.router.navigateByUrl(role ? roleHome[role] : '/home');
    }
    this.chosen.emit(label);
    if (this.state.narrow()) this.state.preference.set('collapsed');
  }
}
