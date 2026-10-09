import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DftButton } from '../../button/button';
import { InputField } from '../../input-field/input-field';
import { DftModal } from '../../modal/modal';
import { AuthShell } from '../auth-shell/auth-shell';

@Component({
  selector: 'app-forgot-page',
  imports: [AuthShell, InputField, DftButton, RouterLink, DftModal],
  templateUrl: './forgot-page.html',
  styleUrl: './forgot-page.css',
})
export class ForgotPage {
  protected email = '';
  protected submitted = false;
  protected sent = false;

  constructor(private readonly router: Router) {}

  protected get emailState() {
    return this.submitted && !this.email.includes('@') ? 'error' : 'default';
  }

  protected submit(): void {
    this.submitted = true;
    if (this.emailState === 'error') return;
    this.sent = true;
  }

  protected closeSent(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.modal__button')) return;
    void this.router.navigateByUrl('/login');
  }
}
