import { Component, ElementRef, HostListener, Input } from '@angular/core';
import { Router } from '@angular/router';
import { Accounts } from '../accounts';
import { Dropdown } from '../dropdown/dropdown';

@Component({
  selector: 'app-top-header',
  imports: [Dropdown],
  templateUrl: './top-header.html',
  styleUrl: './top-header.css',
})
export class TopHeader {
  @Input() name = '';
  protected menuOpen = false;

  constructor(
    private readonly accounts: Accounts,
    private readonly router: Router,
    private readonly host: ElementRef<HTMLElement>,
  ) {}

  protected get shown(): string {
    return this.name || this.accounts.displayName;
  }

  protected get signedIn(): boolean {
    return this.accounts.role !== '';
  }

  protected toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  protected pick(label: string): void {
    this.menuOpen = false;
    if (label === 'ข้อมูลโปรไฟล์') void this.router.navigateByUrl('/profile');
    if (label === 'เปลี่ยนรหัสผ่าน') void this.router.navigateByUrl('/profile?password=1');
    if (label === 'ออกจากระบบ') {
      this.accounts.signOut();
      void this.router.navigateByUrl('/login');
    }
  }

  @HostListener('document:click', ['$event'])
  protected closeMenu(event: MouseEvent): void {
    if (!this.menuOpen) return;
    if (this.host.nativeElement.contains(event.target as Node)) return;
    this.menuOpen = false;
  }
}
