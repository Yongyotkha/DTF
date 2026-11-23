import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Accounts } from '../../accounts';
import { DftButton } from '../../button/button';
import { FileField } from '../../fields/file-field';
import { InputField } from '../../input-field/input-field';
import { SideNav } from '../../menu-bar/side-nav';
import { DftModal } from '../../modal/modal';
import { StatusTag } from '../../status-tag/status-tag';
import { TopHeader } from '../../top-header/top-header';

@Component({
  selector: 'app-profile-page',
  imports: [TopHeader, SideNav, InputField, DftButton, DftModal, RouterLink, StatusTag, FileField],
  templateUrl: './profile-page.html',
  styleUrl: './profile-page.css',
})
export class ProfilePage {
  private readonly accounts = inject(Accounts);

  protected readonly authority = 'นายสุรช ล่ำซำ ลงลายมือชื่อและประทับตราสำคัญของบริษัท';
  protected readonly directors = [
    ['1', 'สุรช', 'ล่ำซำ', 'กรรมการผู้จัดการ ลงลายมือชื่อและประทับตราสำคัญของบริษัท'],
  ];

  protected country = 'ประเทศไทย';
  protected delegate = 'ไม่มอบหมาย';
  protected stamp = 'แบบและแสดงตราประทับบริษัทและลายเซ็น';
  protected passwordOpen = false;
  protected saved = false;
  protected passwordTried = false;
  protected currentPassword = '';
  protected nextPassword = '';
  protected confirmPassword = '';
  protected foreignDoc = '';
  protected foreignAck = false;
  protected verifyBusy = false;
  protected verifyMessage = '';

  constructor(route: ActivatedRoute) {
    route.queryParamMap.subscribe((params) => {
      if (params.get('password') === '1') this.openPassword();
    });
    this.country = this.accounts.isThaiIdentity() ? 'ประเทศไทย' : 'ต่างประเทศ';
  }

  protected get identity() {
    return this.accounts.identityOf();
  }

  protected get nationalityLabel() {
    return this.accounts.nationalityLabel();
  }

  protected get verifyTone() {
    return this.accounts.identityStatusTone(this.identity.status);
  }

  protected get verifyLabel() {
    return this.accounts.identityStatusLabel(this.identity.status);
  }

  protected verifyThaiId(): void {
    this.verifyBusy = true;
    window.setTimeout(() => {
      this.accounts.verifyWithThaiId();
      this.verifyBusy = false;
      this.verifyMessage = 'ยืนยันตัวตนผ่าน ThaiID สำเร็จ — สามารถยื่นคำขอได้แล้ว';
    }, 600);
  }

  protected submitForeignDocs(): void {
    if (!this.foreignDoc.trim() || !this.foreignAck) {
      this.verifyMessage = 'โปรดแนบเอกสารบัตรและยืนยันความถูกต้อง';
      return;
    }
    this.accounts.submitForeignIdentity([this.foreignDoc.trim()]);
    this.verifyMessage = 'ส่งเอกสารให้เจ้าหน้าที่แล้ว — รอผลตรวจก่อนจึงยื่นคำขอได้';
  }

  protected demoStaffApprove(pass: boolean): void {
    this.accounts.resolveForeignIdentity(pass);
    this.verifyMessage = pass
      ? 'จำลองผลตรวจ: ผ่าน — สามารถยื่นคำขอได้แล้ว'
      : 'จำลองผลตรวจ: ไม่ผ่าน — โปรดแนบเอกสารใหม่';
    if (!pass) {
      this.foreignDoc = '';
      this.foreignAck = false;
    }
  }

  protected openPassword(): void {
    this.passwordOpen = true;
    this.passwordTried = false;
  }

  protected closePassword(): void {
    this.passwordOpen = false;
  }

  protected confirmPasswordChange(): void {
    this.passwordTried = true;
    if (!this.passwordsValid) return;
    this.passwordOpen = false;
    this.saved = true;
  }

  protected save(): void {
    this.saved = true;
  }

  protected closeSaved(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.modal__button')) return;
    this.saved = false;
  }

  protected get passwordsValid(): boolean {
    return Boolean(this.currentPassword.trim() && this.nextPassword.trim() && this.nextPassword === this.confirmPassword);
  }

  protected passwordState(value: string, confirm = false): 'default' | 'error' {
    if (!this.passwordTried) return 'default';
    if (!value.trim()) return 'error';
    if (confirm && value !== this.nextPassword) return 'error';
    return 'default';
  }
}
