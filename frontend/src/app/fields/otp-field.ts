import { Component, ElementRef, EventEmitter, Input, Output, QueryList, ViewChildren } from '@angular/core';
import { InputState } from '../input-field/input-field';

@Component({
  selector: 'app-otp-field',
  templateUrl: './otp-field.html',
  styleUrl: './otp-field.css',
})
export class OtpField {
  @Input() label = 'รหัส OTP';
  @Input() required = true;
  @Input() length = 6;
  @Input() value = '';
  @Input() state: InputState = 'default';
  @Input() helper = '';
  @Output() valueChange = new EventEmitter<string>();

  @ViewChildren('box') private boxes?: QueryList<ElementRef<HTMLInputElement>>;

  protected get slots(): string[] {
    const digits = this.value.replace(/\D/g, '').slice(0, this.length);
    return Array.from({ length: this.length }, (_, index) => digits[index] ?? '');
  }

  protected type(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const digit = input.value.replace(/\D/g, '').slice(-1);
    input.value = digit;
    const next = this.slots.slice();
    next[index] = digit;
    this.valueChange.emit(next.join(''));
    if (digit) this.focus(index + 1);
  }

  protected key(index: number, event: KeyboardEvent): void {
    if (event.key === 'Backspace' && !this.slots[index]) {
      const next = this.slots.slice();
      next[index - 1] = '';
      this.valueChange.emit(next.join(''));
      this.focus(index - 1);
    }
    if (event.key === 'ArrowLeft') this.focus(index - 1);
    if (event.key === 'ArrowRight') this.focus(index + 1);
  }

  protected paste(event: ClipboardEvent): void {
    event.preventDefault();
    const digits = (event.clipboardData?.getData('text') ?? '').replace(/\D/g, '').slice(0, this.length);
    this.valueChange.emit(digits);
    this.focus(Math.max(0, digits.length - 1));
  }

  private focus(index: number): void {
    const box = this.boxes?.get(index)?.nativeElement;
    if (!box) return;
    box.focus();
    box.select();
  }
}
