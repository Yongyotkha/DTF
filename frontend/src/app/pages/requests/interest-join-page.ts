import { Component } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Accounts } from '../../accounts';
import { DftButton } from '../../button/button';
import { InputField } from '../../input-field/input-field';
import { AuthShell } from '../auth-shell/auth-shell';
import { rememberJoined } from './interest-invite';
import { caseKey, findListedCase } from './request-cases';

@Component({
  selector: 'app-interest-join-page',
  imports: [AuthShell, InputField, DftButton, RouterLink],
  templateUrl: './interest-join-page.html',
  styleUrl: '../login/login-page.css',
})
export class InterestJoinPage {
  protected readonly caseId: string;
  protected name = '';
  protected org = '';
  protected taxId = '';
  protected password = '';
  protected error = '';

  constructor(
    private readonly accounts: Accounts,
    private readonly router: Router,
    route: ActivatedRoute,
  ) {
    const code = route.snapshot.paramMap.get('code') ?? '';
    this.caseId = /^[A-Za-z0-9-]+$/u.test(code) ? code : '';
  }

  protected get lead(): string {
    if (!this.caseId) return 'ลิงก์เชิญไม่ถูกต้อง';
    const item = findListedCase(this.caseId);
    const ref = item?.ref ? `${item.ref} ` : '';
    return `เคส ${ref}${item?.goods ?? this.caseId} เปิดไต่สวนแล้ว ลงทะเบียนเพื่อเข้าสู่ระบบ`;
  }

  protected submit(): void {
    if (!this.caseId) return;
    const result = this.accounts.registerInterest(this.taxId, this.password, this.name, this.org);
    if (result === 'invalid') {
      this.error = 'กรอกชื่อ เลข 13 หลัก และรหัสผ่านอย่างน้อย 8 ตัว';
      return;
    }
    if (result === 'exists') {
      this.error = 'เลขนี้มีบัญชีแล้ว ให้เข้าสู่ระบบจากลิงก์ด้านล่าง';
      return;
    }
    const item = findListedCase(this.caseId);
    rememberJoined({ caseId: item?.id ?? this.caseId, name: this.name.trim(), org: this.org.trim(), username: this.taxId.trim() });
    void this.router.navigate(item ? ['/requests', caseKey(item)] : ['/requests/cases']);
  }
}
