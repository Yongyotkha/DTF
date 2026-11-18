import { Component, DestroyRef, ElementRef, HostListener, Input, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Accounts, roleHome } from '../accounts';
import { Dropdown } from '../dropdown/dropdown';
import { SidebarState } from '../menu-bar/side-nav';
import { WorkspaceState } from '../workspace/workspace-state';

@Component({
  selector: 'app-top-header',
  imports: [Dropdown, RouterLink],
  templateUrl: './top-header.html',
  styleUrl: './top-header.css',
  host: {
    '[class.top-header--away]': 'away',
    '[class.top-header--fixed]': 'hideOnScroll',
  },
})
export class TopHeader {
  @Input() name = '';
  @Input() account = true;
  @Input() set hideOnScroll(value: boolean) {
    this._hideOnScroll = !!value;
    this.syncChrome();
  }
  get hideOnScroll(): boolean {
    return this._hideOnScroll;
  }

  protected menuOpen = false;
  protected away = false;
  private _hideOnScroll = false;
  private lastY = 0;
  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private readonly host: ElementRef<HTMLElement>,
    private readonly router: Router,
    private readonly accounts: Accounts,
    protected readonly sidebar: SidebarState,
    protected readonly workspace: WorkspaceState,
  ) {
    this.destroyRef.onDestroy(() => this.clearChrome());
  }

  protected get homePath(): string {
    const role = this.accounts.role;
    return role ? roleHome[role] : this.account ? '/home' : '/login';
  }

  protected accountName(): string {
    const name = this.name || this.accounts.displayName;
    const role = this.accounts.roleName;
    if (!role || name === role) return name;
    return `${name} (${role})`;
  }

  protected showMenu(): boolean {
    return this.account && this.sidebar.mounted() && this.sidebar.narrow();
  }

  protected toggleDrawer(): void {
    const next = !this.sidebar.drawer();
    this.sidebar.drawer.set(next);
    if (next) queueMicrotask(() => document.getElementById('sidebar-collapse')?.focus());
  }

  protected toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  protected pick(label: string): void {
    this.menuOpen = false;
    if (label === 'ข้อมูลโปรไฟล์') {
      void this.router.navigateByUrl('/profile');
      return;
    }
    if (label === 'เปลี่ยนรหัสผ่าน') {
      void this.router.navigate(['/profile'], { queryParams: { password: '1' } });
      return;
    }
    if (label === 'ออกจากระบบ') {
      this.accounts.signOut();
      void this.router.navigateByUrl('/login');
    }
  }

  @HostListener('document:click', ['$event'])
  protected closeMenu(event: MouseEvent): void {
    if (!this.host.nativeElement.contains(event.target as Node)) this.menuOpen = false;
  }

  @HostListener('window:scroll')
  protected onWindowScroll(): void {
    if (!this.hideOnScroll) return;
    const y = window.scrollY || document.documentElement.scrollTop || 0;
    if (y <= 8) {
      this.setAway(false);
    } else if (y > this.lastY + 8) {
      this.setAway(true);
    } else if (y < this.lastY - 8) {
      this.setAway(false);
    }
    this.lastY = y;
  }

  private setAway(next: boolean): void {
    if (this.away === next) return;
    this.away = next;
    if (next) this.menuOpen = false;
    this.syncChrome();
  }

  private syncChrome(): void {
    if (!this.hideOnScroll) {
      this.clearChrome();
      return;
    }
    document.body.classList.add('top-header-fixed');
    document.body.classList.toggle('top-header-away', this.away);
    document.body.style.setProperty('--top-header-offset', this.away ? '0px' : '65px');
  }

  private clearChrome(): void {
    this.away = false;
    document.body.classList.remove('top-header-fixed', 'top-header-away');
    document.body.style.removeProperty('--top-header-offset');
  }
}
