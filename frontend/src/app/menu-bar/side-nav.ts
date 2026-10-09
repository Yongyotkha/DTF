import { Injectable, Component, EventEmitter, Input, OnInit, Output, computed, signal } from '@angular/core';
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
  { title: 'กระบวนการไต่สวน', items: ['Case ID', 'ลงทะเบียนผู้มีส่วนได้เสีย', 'รับ-ส่งข้อมูลอื่นๆ', 'รายงาน'] },
  { title: 'คำร้อง', items: ['ยื่นคำร้องขอพบเจ้าหน้าที่', 'รายการยื่นคำร้องขอพบเจ้าหน้าที่', 'ยื่นคำร้องขอข้อมูลข่าวสาร', 'รายการยื่นคำร้องขอข้อมูลข่าวสาร'] },
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
  @Input() open = 'all';
  @Input() active = '';
  @Output() readonly chosen = new EventEmitter<string>();

  protected readonly menus = menus;
  private readonly opened = signal<ReadonlySet<string>>(new Set());

  constructor(private readonly state: SidebarState) {}

  protected get collapsed() {
    return this.state.collapsed;
  }

  ngOnInit(): void {
    const titles = this.open === 'all' ? menus.map((menu) => menu.title) : [this.open];
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
    this.chosen.emit(label);
    if (this.state.narrow()) this.state.preference.set('collapsed');
  }
}
