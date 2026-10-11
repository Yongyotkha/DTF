import { Injectable, Component, ElementRef, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output, computed, effect, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Accounts, roleHome } from '../accounts';
import { WorkspaceState } from '../workspace/workspace-state';
import { MenuGroup } from './menu-group';
import { MenuItem } from './menu-item';

const narrowQuery = '(max-width: 900px)';
const sidebarKey = 'dft-sidebar';

function readSidebar(): 'expanded' | 'collapsed' | null {
  try {
    const saved = sessionStorage.getItem(sidebarKey);
    return saved === 'expanded' || saved === 'collapsed' ? saved : null;
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class SidebarState {
  readonly preference = signal<'expanded' | 'collapsed' | null>(readSidebar());
  readonly narrow = signal(typeof matchMedia === 'function' && matchMedia(narrowQuery).matches);
  readonly drawer = signal(false);
  readonly mounted = signal(false);
  readonly collapsed = computed(() => !this.narrow() && this.preference() === 'collapsed');

  constructor() {
    effect(() => {
      const value = this.preference();
      if (!value) return;
      try {
        sessionStorage.setItem(sidebarKey, value);
      } catch {
        /* private browsing */
      }
    });
    effect(() => {
      document.body.classList.toggle('nav-drawer', this.narrow() && this.drawer());
    });
    if (typeof matchMedia !== 'function') return;
    const query = matchMedia(narrowQuery);
    query.addEventListener('change', () => {
      this.narrow.set(query.matches);
      if (!query.matches) this.drawer.set(false);
    });
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
    id: 'sidebar',
    role: 'navigation',
    '[class.side-nav--collapsed]': 'collapsed()',
    '[class.side-nav--open]': 'drawerOpen()',
    '[class.side-nav--quiet]': 'quiet()',
    'aria-label': 'เมนูหลัก',
  },
})
export class SideNav implements OnInit, OnDestroy {
  @Input() open = '';
  @Input() active = '';
  @Input() kind: 'applicant' | 'staff' = 'applicant';
  @Output() readonly chosen = new EventEmitter<string>();

  protected menuList() {
    return this.kind === 'staff' ? staffMenus : menus;
  }
  private readonly opened = signal<ReadonlySet<string>>(new Set());
  private readonly submenu = signal<string | null>(null);

  constructor(
    private readonly state: SidebarState,
    private readonly workspace: WorkspaceState,
    private readonly router: Router,
    private readonly accounts: Accounts,
    private readonly host: ElementRef<HTMLElement>,
  ) {}

  protected readonly version = '0.1.0';

  protected get collapsed() {
    return this.state.collapsed;
  }

  protected get narrow() {
    return this.state.narrow;
  }

  ngOnInit(): void {
    this.state.mounted.set(true);
    const titles = this.open === 'all' ? this.menuList().map((menu) => menu.title) : this.open ? [this.open] : [];
    this.opened.set(new Set(titles));
  }

  ngOnDestroy(): void {
    this.state.mounted.set(false);
    this.state.drawer.set(false);
  }

  protected drawerOpen(): boolean {
    return this.state.narrow() && this.state.drawer();
  }

  protected quiet(): boolean {
    const mode = this.workspace.mode();
    return !this.state.narrow() && mode === 'focus';
  }

  protected toggleLabel(): string {
    if (this.state.narrow()) return 'ปิดเมนู';
    return this.state.collapsed() ? 'ขยายเมนู' : 'ย่อเมนู';
  }

  protected toggleExpanded(): boolean {
    if (this.state.narrow()) return this.drawerOpen();
    return !this.state.collapsed();
  }

  protected isOpen(title: string): boolean {
    return this.opened().has(title);
  }

  protected toggleGroup(title: string): void {
    if (this.state.collapsed()) {
      this.submenu.update((current) => (current === title ? null : title));
      return;
    }
    this.submenu.set(null);
    this.opened.update((current) => {
      const next = new Set(current);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  }

  protected toggle(): void {
    if (this.state.narrow()) {
      this.closeDrawer();
      return;
    }
    this.submenu.set(null);
    this.state.preference.set(this.state.collapsed() ? 'expanded' : 'collapsed');
    queueMicrotask(() => document.getElementById('sidebar-collapse')?.focus());
  }

  protected closeDrawer(restoreFocus = true): void {
    this.state.drawer.set(false);
    if (restoreFocus) queueMicrotask(() => document.getElementById('sidebar-menu')?.focus());
  }

  protected pick(label: string): void {
    if (label === 'ยื่นคำขอ') void this.router.navigate(['/requests'], { queryParams: { choose: '1' } });
    if (label === 'รายการยื่นคำขอ') void this.router.navigate(['/requests']);
    if (label === 'หน้าหลัก' || label === 'หน้าแรก') {
      const role = this.accounts.role;
      void this.router.navigateByUrl(role ? roleHome[role] : '/home');
    }
    this.chosen.emit(label);
    this.submenu.set(null);
    if (this.state.narrow()) this.closeDrawer(false);
  }

  protected closeFlyouts(): void {
    if (this.submenu()) this.submenu.set(null);
  }

  @HostListener('document:click', ['$event'])
  protected closeFlyout(event: MouseEvent): void {
    if (!this.state.collapsed()) return;
    const target = event.target as HTMLElement | null;
    if (target?.closest('app-menu-group')) return;
    this.submenu.set(null);
  }

  @HostListener('document:keydown', ['$event'])
  protected onKey(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      if (this.submenu()) {
        this.submenu.set(null);
        return;
      }
      const assistantOpen = !!document.querySelector('.ask-panel') && this.workspace.band() !== 'desktop';
      if (assistantOpen) return;
      if (this.drawerOpen()) {
        event.preventDefault();
        this.closeDrawer();
      }
      return;
    }
    if (event.key !== 'Tab' || !this.drawerOpen()) return;
    const items = [...this.host.nativeElement.querySelectorAll<HTMLElement>('button, a, input, select, textarea')].filter((el) => !el.hasAttribute('disabled') && el.tabIndex !== -1);
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    if (event.shiftKey && (active === first || !this.host.nativeElement.contains(active))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }
}
