import { Component } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DftButton } from '../../button/button';
import { InputField } from '../../input-field/input-field';
import { SideNav } from '../../menu-bar/side-nav';
import { DftModal } from '../../modal/modal';
import { TopHeader } from '../../top-header/top-header';

@Component({
  selector: 'app-profile-page',
  imports: [TopHeader, SideNav, InputField, DftButton, DftModal, RouterLink],
  templateUrl: './profile-page.html',
  styleUrl: './profile-page.css',
})
export class ProfilePage {
  protected readonly directors = [
    ['1', 'กิตติภณ', 'วรโชติเมธี'],
    ['2', 'ณัฏฐ์ธนัน', 'ศิริวัฒนากุล'],
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

  constructor(route: ActivatedRoute) {
    route.queryParamMap.subscribe((params) => {
      if (params.get('password') === '1') this.openPassword();
    });
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
