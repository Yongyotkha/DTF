import { Component, OnDestroy, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { roleHome, Accounts } from '../../accounts';
import { rememberJoined } from '../requests/interest-invite';
import { acceptGrant, grantById } from '../requests/proxy-grant';
import { caseKey, findListedCase } from '../requests/request-cases';
import { DftButton } from '../../button/button';
import { OtpField } from '../../fields/otp-field';
import { InputField, InputState } from '../../input-field/input-field';
import { DftModal } from '../../modal/modal';
import { AuthShell } from '../auth-shell/auth-shell';

@Component({
  selector: 'app-login-page',
  imports: [AuthShell, InputField, OtpField, DftButton, RouterLink, DftModal],
  templateUrl: './login-page.html',
  styleUrl: './login-page.css',
})
export class LoginPage implements OnDestroy {
  protected taxId = '';
  protected rolePick = '';
  protected password = '';
  protected mail = '';
  protected trustDevice = false;
  protected submitted = false;
  protected readonly phase = signal<'form' | 'otp' | 'loading' | 'success'>('form');
  protected readonly otp = signal('256901');
  protected readonly otpTried = signal(false);
  protected readonly otpLeft = signal(15 * 60);
  protected readonly otpResent = signal(false);
  private readonly sampleOtp = '256901';
  private timer = 0;
  private otpClock?: ReturnType<typeof setInterval>;
  private resentTimer?: ReturnType<typeof setTimeout>;
  private readonly inviteCase: string;
  private readonly actGrant: string;

  constructor(
    private readonly router: Router,
    private readonly accounts: Accounts,
    route: ActivatedRoute,
  ) {
    const invite = route.snapshot.queryParamMap.get('invite') ?? '';
    this.inviteCase = /^[A-Za-z0-9-]+$/u.test(invite) ? invite : '';
    const act = route.snapshot.queryParamMap.get('act') ?? '';
    this.actGrant = /^[A-Za-z0-9-]+$/u.test(act) ? act : '';
    const last = this.accounts.last();
    this.taxId = last?.username ?? '0105538041238';
    this.password = last?.password ?? 'Dft@2569';
    this.mail = last?.email || 'support@datamining.co.th';
    this.rolePick = this.roles.some((item) => item.username === this.taxId) ? this.taxId : this.roles[0]?.username ?? '';
  }

  protected get roles() {
    return this.accounts.demoLogins();
  }

  protected get roleGroups(): string[] {
    const groups: string[] = [];
    for (const item of this.roles) {
      if (!groups.includes(item.group)) groups.push(item.group);
    }
    return groups;
  }

  protected rolesIn(group: string) {
    return this.roles.filter((item) => item.group === group);
  }

  protected pickRole(username: string): void {
    const account = this.roles.find((item) => item.username === username);
    if (!account) return;
    this.rolePick = account.username;
    this.taxId = account.username;
    this.password = account.password;
    this.mail = account.email || 'support@datamining.co.th';
    this.submitted = false;
  }

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

  protected otpState(): InputState {
    if (this.otpTried() && this.otpLeft() === 0) return 'error';
    if (!this.otpTried() || this.otp().trim() === this.sampleOtp) return 'default';
    return 'error';
  }

  protected otpHelp(): string {
    if (this.otpTried() && this.otpLeft() === 0) return 'รหัสหมดอายุแล้ว กดส่งใหม่';
    if (this.otpState() === 'error') return 'รหัส OTP ไม่ถูกต้อง';
    return '';
  }

  protected otpClockLabel(): string {
    const left = this.otpLeft();
    const minute = Math.floor(left / 60);
    const second = left % 60;
    return `${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;
  }

  protected continueWithSso(): void {
    if (this.phase() !== 'form') return;
    const account = this.roles.find((item) => item.username === this.rolePick) ?? this.roles[0];
    if (!account) return;
    this.taxId = account.username;
    this.password = account.password;
    this.mail = account.email || this.mail;
    this.enter();
  }

  protected submit(): void {
    this.submitted = true;
    if (this.taxState === 'error' || this.passwordState === 'error' || this.phase() !== 'form') return;
    const email = this.accounts.emailOf(this.taxId);
    if (email) this.mail = email;
    if (this.accounts.isTrusted(this.taxId)) {
      this.enter();
      return;
    }
    this.otp.set(this.sampleOtp);
    this.otpTried.set(false);
    this.trustDevice = false;
    this.phase.set('otp');
    this.startClock();
  }

  protected confirmOtp(): void {
    this.otpTried.set(true);
    if (this.otpLeft() === 0 || this.otp().trim() !== this.sampleOtp) return;
    if (this.trustDevice) this.accounts.trust(this.taxId);
    this.enter();
  }

  protected resendOtp(): void {
    this.otp.set(this.sampleOtp);
    this.otpTried.set(false);
    this.otpResent.set(true);
    clearTimeout(this.resentTimer);
    this.resentTimer = window.setTimeout(() => this.otpResent.set(false), 3000);
    this.startClock();
  }

  protected backToForm(): void {
    clearInterval(this.otpClock);
    this.phase.set('form');
  }

  ngOnDestroy(): void {
    window.clearTimeout(this.timer);
    clearInterval(this.otpClock);
    clearTimeout(this.resentTimer);
  }

  private enter(): void {
    this.accounts.signIn(this.taxId, this.password);
    clearInterval(this.otpClock);
    this.phase.set('loading');
    this.timer = window.setTimeout(() => {
      this.phase.set('success');
      this.timer = window.setTimeout(() => {
        const role = this.accounts.role;
        const invited = this.inviteCase ? findListedCase(this.inviteCase) : undefined;
        if (this.inviteCase && role === 'interest') {
          rememberJoined({
            caseId: invited?.id ?? this.inviteCase,
            name: this.accounts.personName || this.accounts.displayName,
            org: '',
            username: this.accounts.username,
          });
        }
        const accepted = this.actGrant ? acceptGrant(this.actGrant, this.accounts.username) : null;
        const acted = accepted && typeof accepted === 'object' ? findListedCase(accepted.caseId) : undefined;
        const next = acted
          ? `/requests/${caseKey(acted)}`
          : this.actGrant && !grantById(this.actGrant)
            ? '/requests'
          : this.inviteCase && role === 'interest'
          ? invited ? `/requests/${caseKey(invited)}` : '/requests/cases'
          : role ? roleHome[role] : '/home';
        void this.router.navigateByUrl(next);
      }, 900);
    }, 900);
  }

  private startClock(): void {
    clearInterval(this.otpClock);
    this.otpLeft.set(15 * 60);
    this.otpClock = setInterval(() => {
      this.otpLeft.update((left) => Math.max(0, left - 1));
      if (this.otpLeft() === 0) clearInterval(this.otpClock);
    }, 1000);
  }
}
