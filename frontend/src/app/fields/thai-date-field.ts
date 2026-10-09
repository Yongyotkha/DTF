import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DateLimit } from './field-rules';
import { InputField, InputState } from '../input-field/input-field';

@Component({
  selector: 'app-thai-date-field',
  imports: [InputField],
  template: `
    <app-input-field
      class="block"
      kind="date"
      [calendar]="true"
      [dateLimit]="limit"
      [label]="label"
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
export class ThaiDateField {
  @Input() label = 'วันที่';
  @Input() required = true;
  @Input() placeholder = '30/04/2538';
  @Input() limit: DateLimit = 'any';
  @Input() state: InputState = 'default';
  @Input() value = '';
  @Input() helper = '';
  @Output() valueChange = new EventEmitter<string>();
  @Output() blurred = new EventEmitter<void>();
}
