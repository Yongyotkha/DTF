import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-file-field',
  templateUrl: './file-field.html',
  styleUrl: './file-field.css',
})
export class FileField {
  @Input() label = 'เลือกไฟล์';
  @Input() required = false;
  @Input() error = false;
  @Input() message = '';
  @Input() value = '';
  @Input() accept = '.pdf,.png,.jpg,.jpeg';
  @Input() note = '';
  @Output() valueChange = new EventEmitter<string>();
  @Output() blurred = new EventEmitter<void>();

  protected picked(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    this.valueChange.emit(file ? file.name : '');
    this.blurred.emit();
  }
}
