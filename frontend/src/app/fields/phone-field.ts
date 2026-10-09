import { Component, EventEmitter, Input, Output } from '@angular/core';
import { InputField, InputState } from '../input-field/input-field';

@Component({
  selector: 'app-phone-field',
  imports: [InputField],
  template: `
    <app-input-field
      class="block"
      [label]="label"
      [required]="required"
      [editable]="true"
      [placeholder]="placeholder"
      [digitsOnly]="true"
      [maxLength]="10"
      [state]="state"
      [helper]="helper"
      [value]="value"
      (valueChange)="valueChange.emit($event)"
      (blurred)="blurred.emit()"
    />
  `,
  styles: `:host { display: block; width: 100%; min-width: 0; }`,
})
export class PhoneField {
  @Input() label = 'หมายเลขโทรศัพท์';
  @Input() required = true;
  @Input() placeholder = '02-348-8700';
  @Input() state: InputState = 'default';
  @Input() value = '';
  @Input() helper = '';
  @Output() valueChange = new EventEmitter<string>();
  @Output() blurred = new EventEmitter<void>();
}
