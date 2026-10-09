import { Component, EventEmitter, Input, Output } from '@angular/core';
import { InputField, InputState } from '../input-field/input-field';

@Component({
  selector: 'app-email-field',
  imports: [InputField],
  template: `
    <app-input-field
      class="block"
      [label]="label"
      inputType="email"
      [required]="required"
      [editable]="true"
      [placeholder]="placeholder"
      [state]="state"
      [helper]="helper"
      [value]="value"
      (valueChange)="valueChange.emit($event)"
      (blurred)="blurred.emit()"
    />
  `,
  styles: `:host { display: block; width: 100%; min-width: 0; }`,
})
export class EmailField {
  @Input() label = 'อีเมล';
  @Input() required = true;
  @Input() placeholder = 'ระบุ';
  @Input() state: InputState = 'default';
  @Input() value = '';
  @Input() helper = '';
  @Output() valueChange = new EventEmitter<string>();
  @Output() blurred = new EventEmitter<void>();
}
