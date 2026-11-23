import { Component } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Accounts } from '../../accounts';
import { DftButton } from '../../button/button';
import { InputField } from '../../input-field/input-field';
import { AuthShell } from '../auth-shell/auth-shell';
import { acceptCofilerInvite, cofilerById, writeCofilerView } from './cofiler-invite';
import { writeActiveFilingRef } from './case-status';

@Component({
  selector: 'app-cofiler-join-page',
  imports: [AuthShell, InputField, DftButton, RouterLink],
  templateUrl: './cofiler-join-page.html',
  styleUrl: '../login/login-page.css',
})
export class CofilerJoinPage {
  protected readonly inviteId: string;
  protected name = '';
  protected taxId = '';
  protected password = '';
  protected error = '';

  constructor(
    private readonly accounts: Accounts,
    private readonly router: Router,
    route: ActivatedRoute,
  ) {
    const id = route.snapshot.paramMap.get('id') ?? '';
    this.inviteId = /^cf-[A-Za-z0-9]+$/u.test(id) ? id : '';
    this.name = this.invite?.makerName ?? '';
  }

  protected get invite() {
    return this.inviteId ? cofilerById(this.inviteId) : undefined;
  }

  protected get lead(): string {
    const invite = this.invite;
    if (!invite) return 'ไม่พบคำเชิญผู้ร่วมยื่น';
    return `${invite.makerName} ถูกเชิญให้กรอกส่วนของตนในคำขอ ${invite.filingRef}`;
  }

  protected get blocked(): string {
    const invite = this.invite;
    if (!invite) return '';
    if (invite.status === 'revoked') return 'คำเชิญนี้ถูกเพิกถอนแล้ว';
    return '';
  }

  protected submit(): void {
    const invite = this.invite;
    if (!invite || this.blocked) return;
    const taxId = this.taxId.trim();
    if (!/^\d{13}$/.test(taxId) || this.password.length < 8 || !(this.name || invite.makerName).trim()) {
      this.error = 'กรอกชื่อ เลข 13 หลัก และรหัสผ่านอย่างน้อย 8 ตัว';
      return;
    }
    const result = this.accounts.registerAgent(taxId, this.password, this.name || invite.makerName, invite.org);
    if (result === 'invalid') {
      this.error = 'กรอกชื่อ เลข 13 หลัก และรหัสผ่านอย่างน้อย 8 ตัว';
      return;
    }
    if (result === 'exists') {
      this.error = 'เลขนี้มีบัญชีแล้ว ให้เข้าสู่ระบบก่อน แล้วเปิดลิงก์นี้อีกครั้ง';
      return;
    }
    const accepted = acceptCofilerInvite(invite.id, taxId);
    if (accepted === 'taken') {
      this.error = 'คำเชิญนี้ผูกกับบัญชีอื่นแล้ว';
      return;
    }
    if (accepted === 'closed' || !accepted) {
      this.error = 'คำเชิญนี้ยังใช้ไม่ได้';
      return;
    }
    writeActiveFilingRef(invite.filingRef);
    writeCofilerView(invite.id);
    void this.router.navigate(['/requests/por1']);
  }
}
