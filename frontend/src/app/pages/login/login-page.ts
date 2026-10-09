import { Component, OnDestroy, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Accounts } from '../../accounts';
import { DftButton } from '../../button/button';
import { InputField } from '../../input-field/input-field';
import { DftModal } from '../../modal/modal';
import { AuthShell } from '../auth-shell/auth-shell';

@Component({
  selector: 'app-login-page',
  imports: [AuthShell, InputField, DftButton, RouterLink, DftModal],
  templateUrl: './login-page.html',
  styleUrl: './login-page.css',
})
export class LoginPage implements OnDestroy {
  protected taxId = '';
  protected password = '';
  protected submitted = false;
  protected readonly phase = signal<'idle' | 'success' | 'enter'>('idle');
  private timer = 0;

  constructor(
    private readonly router: Router,
    private readonly accounts: Accounts,
  ) {}

  protected get taxState() {
    return this.submitted && this.taxId.trim().length !== 13 ? 'error' : 'default';
  }

  protected get passwordState() {
    if (!this.submitted) return 'default';
    if (!this.password.trim()) return 'error';
    if (this.taxState === 'error') return 'default';
    return this.accounts.matches(this.taxId, this.password) ? 'default' : 'error';
  }

  protected get passwordHelp(): string {
    if (this.passwordState !== 'error') return '';
    if (!this.password.trim()) return 'โปรดกรอกรหัสผ่าน';
    return 'รหัสผ่านไม่ถูกต้อง';
  }

  protected submit(): void {
    this.submitted = true;
    if (this.taxState === 'error' || this.passwordState === 'error' || this.phase() !== 'idle') return;
    this.accounts.signIn(this.taxId, this.password);
    this.phase.set('success');
    this.timer = window.setTimeout(() => {
      this.phase.set('enter');
      this.timer = window.setTimeout(() => {
        void this.router.navigateByUrl('/home');
      }, 900);
    }, 900);
  }

  ngOnDestroy(): void {
    window.clearTimeout(this.timer);
  }
}
