import { Injectable, Component, ElementRef, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output, computed, effect, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Accounts, roleHome } from '../accounts';
import { isActingAgent, powersOf, ProxyPower } from '../pages/requests/proxy-grant';
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
  readonly preference = signal<'expanded' | 'collapsed' | null>(readSidebar() ?? 'collapsed');
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

type NavMenu = { title: string; items: string[] };

const applicantMenus: NavMenu[] = [
  { title: 'คำขอ', items: ['รายการยื่นคำขอ', 'มอบหมายผู้กระทำการแทน', 'รับ–ส่งข้อมูลอื่น ๆ'] },
  { title: 'คำร้อง', items: ['ขอพบเจ้าหน้าที่', 'ขอข้อมูลข่าวสาร'] },
];

const otherCommitteeMenus: NavMenu[] = [
  { title: 'คณะกรรมการอื่นๆ', items: ['ตรวจสอบและอนุมัติ', 'ตรวจและปรับแก้วาระ', 'อนุมัติ hearing'] },
];

const interestMenus: NavMenu[] = [
  { title: 'กระบวนการไต่สวน', items: ['ลงทะเบียนผู้มีส่วนได้ส่วนเสีย', 'Case ID', 'รับ–ส่งข้อมูลอื่น ๆ'] },
  { title: 'คำร้อง', items: ['ขอข้อมูลข่าวสาร'] },
];

const directorMenus: NavMenu[] = [
  { title: 'งาน', items: ['มอบหมายงาน', 'รายการยื่นคำขอ'] },
  { title: 'กระบวนการไต่สวน', items: ['อนุมัติผู้กระทำการแทน', 'อนุมัติผู้มีส่วนได้เสีย', 'Case ID'] },
  { title: 'รายงาน', items: ['รายงานผล'] },
];

const headMenus: NavMenu[] = [
  { title: 'งาน', items: ['รายงานผลหรือส่งต่อ', 'รายการยื่นคำขอ'] },
  { title: 'กระบวนการไต่สวน', items: ['อนุมัติเอกสารฉบับเปิดเผย', 'Case ID'] },
  { title: 'รายงาน', items: ['ตรวจสอบการรายงานผล'] },
];

const officerMenus: NavMenu[] = [
  { title: 'งาน', items: ['ติดตามกระบวนงานยื่นคำขอ', 'บันทึกรับเรื่อง', 'รายการยื่นคำขอ'] },
  { title: 'กระบวนการไต่สวน', items: ['แจ้งผู้มีส่วนได้เสีย', 'Case ID', 'รับ–ส่งข้อมูลอื่น ๆ', 'แบบสอบถาม'] },
  { title: 'คำร้อง', items: ['คำร้องขอพบเจ้าหน้าที่', 'คำร้องขอข้อมูลข่าวสาร'] },
];

const bureauMenus: NavMenu[] = [
  { title: 'งาน', items: ['บันทึกข้อมูลลงรับ', 'รายการยื่นคำขอ'] },
];

const committeeMenus: NavMenu[] = [
  { title: 'งาน', items: ['ผลการพิจารณา', 'รายการยื่นคำขอ'] },
];

const externalMenus: NavMenu[] = [
  { title: 'งาน', items: ['หนังสือที่ได้รับ', 'Case ID'] },
];

function agentMenus(powers: ProxyPower[]): NavMenu[] {
  const talk = powers.includes('contact') || powers.includes('edit') || powers.includes('full');
  const menus: NavMenu[] = [
    { title: 'คำขอ', items: talk ? ['รายการยื่นคำขอ', 'รับ–ส่งข้อมูลอื่น ๆ'] : ['รายการยื่นคำขอ'] },
  ];
  if (powers.includes('full') || powers.includes('contact')) {
    menus.push({ title: 'คำร้อง', items: ['ขอพบเจ้าหน้าที่', 'ขอข้อมูลข่าวสาร'] });
  }
  return menus;
}

@Component({
  selector: 'app-side-nav',
  imports: [MenuGroup, MenuItem],
  templateUrl: './side-nav.html',
  styleUrl: './side-nav.css',
  host: {
    id: 'sidebar',
    role: 'navigation',
    '[class.side-nav--collapsed]': 'collapsed()',
    '[class.side-nav--icons]': 'layoutCompact()',
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

  protected menuList(): NavMenu[] {
    const role = this.accounts.role;
    if (this.accounts.username === '1000000000126') return otherCommitteeMenus;
    if (role === 'interest') return interestMenus;
    if (isActingAgent(this.accounts.username)) return agentMenus(powersOf(this.accounts.username));
    if (role === 'director') return directorMenus;
    if (role === 'head') return headMenus;
    if (role === 'officer') return officerMenus;
    if (role === 'bureau') return bureauMenus;
    if (role === 'committee') return committeeMenus;
    if (role === 'external') return externalMenus;
    if (role === 'staff') return officerMenus;
    return applicantMenus;
  }
  private readonly opened = signal<ReadonlySet<string>>(new Set());
  private readonly submenu = signal<string | null>(null);
  protected readonly layoutCompact = signal(false);
  private compactTimer = 0;
  private compactReady = false;

  constructor(
    private readonly state: SidebarState,
    private readonly workspace: WorkspaceState,
    private readonly router: Router,
    private readonly accounts: Accounts,
    private readonly host: ElementRef<HTMLElement>,
  ) {
    effect(() => {
      const collapsed = this.state.collapsed();
      window.clearTimeout(this.compactTimer);
      if (!this.compactReady) {
        this.compactReady = true;
        this.layoutCompact.set(collapsed);
        return;
      }
      const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!collapsed || reduce) {
        this.layoutCompact.set(collapsed);
        return;
      }
      this.compactTimer = window.setTimeout(() => this.layoutCompact.set(true), 180);
    });
  }

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
    window.clearTimeout(this.compactTimer);
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
    const role = this.accounts.role;
    const internal = role === 'staff' || role === 'director' || role === 'head' || role === 'officer' || role === 'bureau' || role === 'committee' || role === 'external';
    const home = role ? roleHome[role] : '/home';
    const filing = role === 'director' ? '/director/filing'
      : role === 'head' ? '/head/filing'
      : role === 'officer' || role === 'staff' ? '/officer/filing'
      : role === 'bureau' ? '/bureau/filing'
      : role === 'committee' ? '/committee/filing'
      : home;
    if (label === 'ตรวจสอบและอนุมัติ' || label === 'ตรวจและปรับแก้วาระ' || label === 'อนุมัติ hearing') {
      void this.router.navigate(['/committee/other'], { queryParams: { task: label } });
    } else if (label === 'หน้าหลัก' || label === 'หน้าแรก' || label === 'มอบหมายงาน' || label === 'รายงานผลหรือส่งต่อ' || label === 'รายงานผล' || label === 'ตรวจสอบการรายงานผล' || label === 'บันทึกข้อมูลลงรับ' || label === 'บันทึกรับเรื่อง' || label === 'ผลการพิจารณา' || label === 'หนังสือที่ได้รับ' || label === 'อนุมัติเอกสารฉบับเปิดเผย') {
      void this.router.navigateByUrl(home);
    } else if (label === 'อนุมัติผู้กระทำการแทน') {
      void this.router.navigate([home], { queryParams: { queue: 'proxy' } });
    } else if (label === 'ติดตามกระบวนงานยื่นคำขอ' || label === 'แบบสอบถาม') {
      void this.router.navigateByUrl(internal ? filing : '/requests');
    } else if (label === 'ยื่นคำขอ' && !internal) {
      void this.router.navigate(['/requests']);
    } else if (label === 'รายการยื่นคำขอ') {
      void this.router.navigate(internal ? ['/cases'] : ['/requests']);
    } else if (label === 'ยื่นคำร้องขอพบเจ้าหน้าที่' || label === 'รายการยื่นคำร้องขอพบเจ้าหน้าที่' || label === 'คำร้องขอพบเจ้าหน้าที่' || label === 'ขอพบเจ้าหน้าที่') {
      if (internal) void this.router.navigateByUrl(filing);
      else void this.router.navigate(['/requests/por-1'], { queryParams: { consult: '1' } });
    } else if (!internal && label === 'มอบหมายผู้กระทำการแทน') {
      void this.router.navigateByUrl('/requests/proxy');
    } else if (label === 'ลงทะเบียนผู้มีส่วนได้ส่วนเสีย' || label === 'แจ้งผู้มีส่วนได้เสีย' || label === 'อนุมัติผู้มีส่วนได้เสีย') {
      void this.router.navigateByUrl('/requests/interest');
    } else if (label === 'Case ID') {
      void this.router.navigateByUrl(internal ? '/cases' : '/requests/cases');
    } else if (label === 'รับ–ส่งข้อมูลอื่น ๆ') {
      void this.router.navigateByUrl(internal ? filing : '/requests/exchange');
    } else if (label === 'ยื่นคำร้องขอข้อมูลข่าวสาร' || label === 'คำร้องขอข้อมูลข่าวสาร' || label === 'ขอข้อมูลข่าวสาร' || label === 'รายการยื่นคำร้องขอข้อมูลข่าวสาร') {
      if (internal) void this.router.navigateByUrl(filing);
      else void this.router.navigateByUrl('/requests/info');
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
