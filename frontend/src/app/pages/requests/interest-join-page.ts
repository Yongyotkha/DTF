import { Component } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Accounts } from '../../accounts';
import { DftButton } from '../../button/button';
import { InputField } from '../../input-field/input-field';
import { AuthShell } from '../auth-shell/auth-shell';
import { InterestKind, saveInterestFiling } from './interest-invite';
import { archiveCases, findListedCase } from './request-cases';

@Component({
  selector: 'app-interest-join-page',
  imports: [AuthShell, InputField, DftButton, RouterLink],
  templateUrl: './interest-join-page.html',
  styleUrl: '../login/login-page.css',
})
export class InterestJoinPage {
  protected caseId: string;
  protected step: 'window' | 'person' | 'company' | 'sent' = 'window';
  protected window: 'open' | 'late' = 'open';
  protected name = '';
  protected taxId = '';
  protected password = '';
  protected kinds: InterestKind[] = [];
  protected acceptDocs = false;
  protected signed = false;
  protected acting = false;
  protected company = '';
  protected companyKinds: InterestKind[] = [];
  protected companySigned = false;
  protected receipt = '';
  protected companyReceipt = '';
  protected error = '';
  protected readonly kindChoices: InterestKind[] = ['importer', 'domestic', 'exporter', 'agency'];

  constructor(
    private readonly accounts: Accounts,
    route: ActivatedRoute,
  ) {
    const code = route.snapshot.paramMap.get('code') ?? '';
    this.caseId = /^[A-Za-z0-9-]+$/u.test(code) ? code : '';
  }

  protected get openCases() {
    return archiveCases.filter((item) => !item.draft && item.steps.some((step) => step.state !== 'todo' && (step.name.includes('เปิด') || step.name.includes('ไต่สวน') || step.name.includes('ทบทวน'))));
  }

  protected caseLabel(id: string): string {
    const item = findListedCase(id);
    return item ? `${item.ref} ${item.goods}` : id;
  }

  protected kindLabel(kind: InterestKind): string {
    if (kind === 'importer') return 'ผู้นำเข้า';
    if (kind === 'domestic') return 'อุตสาหกรรมภายใน';
    if (kind === 'exporter') return 'ผู้ส่งออก';
    return 'หน่วยงานที่เกี่ยวข้อง';
  }

  protected toggleKind(kind: InterestKind, company = false): void {
    const list = company ? this.companyKinds : this.kinds;
    const next = list.includes(kind) ? list.filter((item) => item !== kind) : [...list, kind];
    if (company) this.companyKinds = next;
    else this.kinds = next;
  }

  protected chooseWindow(value: 'open' | 'late'): void {
    if (!this.caseId) {
      this.error = 'เลือกเคสก่อน';
      return;
    }
    this.window = value;
    this.error = '';
    this.step = 'person';
  }

  protected get lead(): string {
    if (!this.caseId) return 'เลือกเคสที่ต้องการลงทะเบียน';
    const item = findListedCase(this.caseId);
    const ref = item?.ref ? `${item.ref} ` : '';
    return `เคส ${ref}${item?.goods ?? this.caseId} เปิดไต่สวนแล้ว ลงทะเบียนเพื่อเข้าสู่ระบบ`;
  }

  protected continuePerson(): void {
    if (!this.name.trim() || this.taxId.trim().length !== 13 || this.password.trim().length < 8 || !this.kinds.length || !this.acceptDocs || !this.signed) {
      this.error = 'กรอกชื่อ เลข 13 หลัก รหัสผ่าน เลือกประเภท แล้วยืนยันการรับเอกสารและลงนาม';
      return;
    }
    this.error = '';
    this.receipt = `RN${Date.now().toString().slice(-6)}`;
    if (this.acting) {
      this.step = 'company';
      return;
    }
    this.finish();
  }

  protected finish(): void {
    if (this.acting && (!this.company.trim() || !this.companyKinds.length || !this.companySigned)) {
      this.error = 'กรอกหน่วยงานที่ทำการแทน เลือกประเภท แล้วลงนาม';
      return;
    }
    const result = this.accounts.registerInterest(this.taxId, this.password, this.name, this.company);
    if (result === 'invalid') {
      this.error = 'กรอกชื่อ เลข 13 หลัก และรหัสผ่านอย่างน้อย 8 ตัว';
      return;
    }
    if (result === 'exists') {
      this.error = 'เลขนี้มีบัญชีแล้ว ให้เข้าสู่ระบบจากลิงก์ด้านล่าง';
      return;
    }
    if (this.acting && !this.companyReceipt) this.companyReceipt = `RN${Date.now().toString().slice(-6)}`;
    const item = findListedCase(this.caseId);
    saveInterestFiling({
      id: `if-${Date.now()}`,
      caseId: item?.id ?? this.caseId,
      window: this.window,
      name: this.name.trim(),
      taxId: this.taxId.trim(),
      kinds: this.kinds,
      acceptDocs: true,
      signed: true,
      receipt: this.receipt,
      acting: this.acting,
      company: this.company.trim(),
      companyKinds: this.companyKinds,
      companyReceipt: this.companyReceipt,
      status: 'pending',
      group: '',
      fixNote: '',
      fixDue: '',
    });
    this.error = '';
    this.step = 'sent';
  }
}
