import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Accounts } from '../../accounts';
import { DftButton } from '../../button/button';
import { InputField, InputState } from '../../input-field/input-field';
import { AuthShell } from '../auth-shell/auth-shell';

@Component({
  selector: 'app-officer-login-page',
  imports: [AuthShell, InputField, DftButton, RouterLink],
  templateUrl: './officer-login-page.html',
  styleUrl: '../login/login-page.css',
})
export class OfficerLoginPage {
  protected loginName = '';
  protected password = '';
  protected rolePick = '';
  protected submitted = false;

  constructor(
    private readonly router: Router,
    private readonly accounts: Accounts,
  ) {
    const first = this.roles[0];
    this.rolePick = first?.username ?? '';
    this.loginName = first?.loginName ?? '';
    this.password = first?.password ?? '';
  }

  protected get roles() {
    return this.accounts.adminLogins();
  }

  protected pickRole(username: string): void {
    const account = this.roles.find((item) => item.username === username);
    if (!account) return;
    this.rolePick = account.username;
    this.loginName = account.loginName ?? '';
    this.password = account.password;
    this.submitted = false;
  }

  protected get nameState(): InputState {
    if (!this.submitted) return 'default';
    return this.loginName.trim() ? 'default' : 'error';
  }

  protected get nameHelp(): string {
    return this.nameState === 'error' ? 'โปรดกรอกชื่อผู้ใช้งาน' : '';
  }

  protected get passwordState(): InputState {
    if (!this.submitted || this.nameState === 'error') return 'default';
    if (!this.password.trim()) return 'error';
    return this.canEnter() ? 'default' : 'error';
  }

  protected get passwordHelp(): string {
    if (this.passwordState !== 'error') return '';
    if (!this.password.trim()) return 'โปรดกรอกรหัสผ่าน';
    if (this.turnedOff()) return 'บัญชีนี้ถูกปิดการใช้งาน';
    return 'รหัสผ่านไม่ถูกต้อง';
  }

  protected enter(): void {
    this.submitted = true;
    const id = this.accountId();
    if (!this.canEnter() || !id) return;
    if (!this.accounts.signIn(id, this.password)) return;
    void this.router.navigateByUrl('/officer/groups');
  }

  private accountId(): string | null {
    const id = this.accounts.idByLogin(this.loginName);
    return id && this.roles.some((item) => item.username === id) ? id : null;
  }

  private canEnter(): boolean {
    const id = this.accountId();
    return !!id && this.accounts.matches(id, this.password) && this.accounts.isActive(id);
  }

  private turnedOff(): boolean {
    const id = this.accountId();
    return !!id && this.accounts.matches(id, this.password) && !this.accounts.isActive(id);
  }
}
