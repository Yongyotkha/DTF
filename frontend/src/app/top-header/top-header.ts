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

  protected showTools(): boolean {
    return this.account && this.sidebar.mounted();
  }

  protected splitLabel(): string {
    return this.workspace.band() === 'desktop' ? 'เปิดมุมมองคู่กับ AI' : 'เปิดผู้ช่วย AI';
  }

  protected toggleDrawer(): void {
    const next = !this.sidebar.drawer();
    this.sidebar.drawer.set(next);
    if (next) queueMicrotask(() => document.getElementById('sidebar-collapse')?.focus());
  }

  protected enterFocus(): void {
    this.workspace.enterFocus();
    queueMicrotask(() => document.getElementById('workspace-exit')?.focus());
  }

  protected exitFocus(): void {
    this.workspace.exitFocus();
    queueMicrotask(() => document.getElementById('workspace-focus')?.focus());
  }

  protected toggleSplit(): void {
    if (this.workspace.split()) {
      this.workspace.leaveSplit();
      document.dispatchEvent(new CustomEvent('dft-split-close'));
      queueMicrotask(() => document.getElementById('workspace-split')?.focus());
      return;
    }
    this.workspace.openSplit();
    document.dispatchEvent(new CustomEvent('dft-split-open'));
    queueMicrotask(() => document.querySelector<HTMLElement>('.ask-panel [aria-label="ปิดแชท"]')?.focus());
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
}
