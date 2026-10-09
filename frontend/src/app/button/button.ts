import { Component, Input } from '@angular/core';

export type ButtonType =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'pill'
  | 'danger'
  | 'danger-outline'
  | 'link';

export type ButtonState = 'default' | 'hover' | 'pressed' | 'focus' | 'disabled';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-button',
  templateUrl: './button.html',
  styleUrl: './button.css',
})
export class DftButton {
  @Input() type: ButtonType = 'primary';
  @Input() state: ButtonState = 'default';
  @Input() size: ButtonSize = 'md';
  @Input() label = 'Button';
  @Input() loading = false;
  @Input() full = false;
  @Input() inverse = false;
}
