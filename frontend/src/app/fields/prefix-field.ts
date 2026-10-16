import { Component, EventEmitter, Input, Output } from '@angular/core';
import { prefixes } from './field-rules';

@Component({
  selector: 'app-prefix-field',
  templateUrl: './prefix-field.html',
  styleUrl: './prefix-field.css',
})
export class PrefixField {
  @Input() label = 'คำนำหน้า';
  @Input() required = true;
  @Input() error = false;
  @Input() message = '';
  @Input() value = '';
  @Input() options: readonly string[] = prefixes;
  @Input() bare = false;
  @Output() valueChange = new EventEmitter<string>();
  @Output() blurred = new EventEmitter<void>();

  protected choose(value: string): void {
    this.valueChange.emit(value);
  }
}
