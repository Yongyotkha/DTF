import { Component, EventEmitter, Input, Output } from '@angular/core';
import { prefixes } from './field-rules';

@Component({
  selector: 'app-prefix-field',
  templateUrl: './prefix-field.html',
  styleUrl: './prefix-field.css',
})
export class PrefixField {
  @Input() error = false;
  @Input() message = '';
  @Input() value = '';
  @Output() valueChange = new EventEmitter<string>();
  @Output() blurred = new EventEmitter<void>();
  protected readonly options = prefixes;

  protected choose(value: string): void {
    this.valueChange.emit(value);
  }
}
