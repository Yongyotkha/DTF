import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AccountRole, Accounts } from '../../accounts';
import { SideNav } from '../../menu-bar/side-nav';
import { StatusTag } from '../../status-tag/status-tag';
import { TopHeader } from '../../top-header/top-header';

const roleNames: Record<AccountRole, string> = {
  corporate: 'นิติบุคคล',
  individual: 'บุคคลธรรมดา',
  association: 'สมาคมการค้า',
};

@Component({
  selector: 'app-home-page',
  imports: [TopHeader, SideNav, StatusTag],
  templateUrl: './home-page.html',
  styleUrl: './home-page.css',
})
export class HomePage {
  constructor(
    private readonly accounts: Accounts,
    private readonly router: Router,
  ) {}

  protected openMenu(label: string): void {
    if (label === 'ยื่นคำขอ') void this.router.navigate(['/requests'], { queryParams: { choose: '1' } });
    if (label === 'รายการยื่นคำขอ') void this.router.navigate(['/requests']);
  }

  protected get roleName(): string {
    return this.accounts.role ? roleNames[this.accounts.role] : 'ผู้ใช้งาน';
  }
}
