import { Component } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Accounts } from '../../accounts';
import { DftButton } from '../../button/button';
import { InputField } from '../../input-field/input-field';
import { AuthShell } from '../auth-shell/auth-shell';
import { acceptGrant, grantById, powerLabel } from './proxy-grant';
import { caseKey, findListedCase } from './request-cases';

@Component({
  selector: 'app-proxy-join-page',
  imports: [AuthShell, InputField, DftButton, RouterLink],
  templateUrl: './proxy-join-page.html',
  styleUrl: '../login/login-page.css',
})
export class ProxyJoinPage {
  protected readonly grantId: string;
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
    this.grantId = /^[A-Za-z0-9-]+$/u.test(id) ? id : '';
    this.name = this.grant?.person ?? '';
  }

  protected get grant() {
    return this.grantId ? grantById(this.grantId) : undefined;
  }

  protected get lead(): string {
    const grant = this.grant;
    if (!grant) return 'ไม่พบคำเชิญให้กระทำการแทน';
    const item = findListedCase(grant.caseId);
    const goods = item?.goods ?? grant.caseId;
    return `${grant.person} ได้รับมอบจากผู้ยื่นให้กระทำการแทนในเคส ${goods}`;
  }

  protected get powers(): string[] {
    return (this.grant?.powers ?? []).map((key) => powerLabel(key));
  }

  protected get blocked(): string {
    const grant = this.grant;
    if (!grant) return '';
    if (grant.status === 'pending') return 'เจ้าหน้าที่ยังไม่อนุมัติการมอบหมาย ผู้รับมอบยังเข้าเคสไม่ได้';
    if (grant.status === 'rejected') return 'เจ้าหน้าที่ไม่รับการมอบหมายนี้';
    if (grant.status === 'suspended') return 'ผู้มอบอำนาจระงับการใช้งานแล้ว';
    return '';
  }

  protected submit(): void {
    const grant = this.grant;
    if (!grant || this.blocked) return;
    const taxId = this.taxId.trim();
    if (!/^\d{13}$/.test(taxId) || this.password.length < 8 || !(this.name || grant.person).trim()) {
      this.error = 'กรอกชื่อ เลข 13 หลัก และรหัสผ่านอย่างน้อย 8 ตัว';
      return;
    }
    if (grant.username && grant.username !== taxId) {
      this.error = 'คำเชิญนี้ผูกกับบัญชีอื่นแล้ว';
      return;
    }
    const result = this.accounts.registerAgent(taxId, this.password, this.name || grant.person, grant.org);
    if (result === 'invalid') {
      this.error = 'กรอกชื่อ เลข 13 หลัก และรหัสผ่านอย่างน้อย 8 ตัว';
      return;
    }
    if (result === 'exists') {
      this.error = 'เลขนี้มีบัญชีแล้ว ให้เข้าสู่ระบบจากลิงก์ด้านล่าง';
      return;
    }
    const accepted = acceptGrant(grant.id, this.taxId.trim());
    if (accepted === 'wait') {
      this.error = 'เจ้าหน้าที่ยังไม่อนุมัติการมอบหมาย';
      return;
    }
    if (accepted === 'taken') {
      this.error = 'คำเชิญนี้ผูกกับบัญชีอื่นแล้ว';
      return;
    }
    if (accepted === 'closed') {
      this.error = 'คำเชิญนี้ยังใช้ไม่ได้';
      return;
    }
    const item = findListedCase(grant.caseId);
    void this.router.navigate(item ? ['/requests', caseKey(item)] : ['/requests']);
  }
}
