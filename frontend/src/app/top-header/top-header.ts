import { Component, ElementRef, HostListener, Input } from '@angular/core';
import { Router } from '@angular/router';
import { Accounts } from '../accounts';
import { Dropdown } from '../dropdown/dropdown';
import { SidebarState } from '../menu-bar/side-nav';
import { WorkspaceState } from '../workspace/workspace-state';

@Component({
  selector: 'app-top-header',
  imports: [Dropdown],
  templateUrl: './top-header.html',
  styleUrl: './top-header.css',
})
export class TopHeader {
  @Input() name = '';
  @Input() account = true;
  protected menuOpen = false;

  constructor(
    private readonly host: ElementRef<HTMLElement>,
    private readonly router: Router,
    private readonly accounts: Accounts,
    protected readonly sidebar: SidebarState,
    protected readonly workspace: WorkspaceState,
  ) {}

  protected accountName(): string {
    return this.name || this.accounts.displayName;
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
      const officer = this.router.url.startsWith('/officer');
      this.accounts.signOut();
      void this.router.navigateByUrl(officer ? '/officer/login' : '/login');
    }
  }

  @HostListener('document:click', ['$event'])
  protected closeMenu(event: MouseEvent): void {
    if (!this.host.nativeElement.contains(event.target as Node)) this.menuOpen = false;
  }
}
