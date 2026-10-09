import { Component, EventEmitter, Input, Output } from '@angular/core';
import { InputField, InputState } from '../input-field/input-field';

@Component({
  selector: 'app-id-number-field',
  imports: [InputField],
  template: `
    <app-input-field
      class="block"
      [label]="label"
      [required]="required"
      [editable]="true"
      [placeholder]="placeholder"
      [digitsOnly]="digitsOnly"
      [maxLength]="maxLength"
      [state]="state"
      [helper]="helper"
      [value]="value"
      (valueChange)="valueChange.emit($event)"
      (blurred)="blurred.emit()"
    />
  `,
  styles: `:host { display: block; width: 100%; min-width: 0; }`,
})
export class IdNumberField {
  @Input() label = 'เลขทะเบียนนิติบุคคล';
  @Input() required = true;
  @Input() placeholder = '0105538041238';
  @Input() digitsOnly = false;
  @Input() maxLength = 0;
  @Input() state: InputState = 'default';
  @Input() value = '';
  @Input() helper = '';
  @Output() valueChange = new EventEmitter<string>();
  @Output() blurred = new EventEmitter<void>();
}
