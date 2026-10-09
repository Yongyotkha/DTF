import { Component, ElementRef, EventEmitter, Input, OnDestroy, Output, ViewChild, signal } from '@angular/core';
import { fileOk } from './field-rules';

@Component({
  selector: 'app-file-field',
  templateUrl: './file-field.html',
  styleUrl: './file-field.css',
})
export class FileField implements OnDestroy {
  @Input() label = 'เลือกไฟล์';
  @Input() required = false;
  @Input() error = false;
  @Input() message = '';
  @Input() value = '';
  @Output() valueChange = new EventEmitter<string>();
  @Output() blurred = new EventEmitter<void>();
  @ViewChild('picker') private picker?: ElementRef<HTMLInputElement>;
  protected readonly preview = signal('');
  protected readonly previewKind = signal<'image' | 'pdf' | ''>('');
  private previewUrl = '';

  ngOnDestroy(): void {
    this.clearPreview();
  }

  protected picked(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    this.clearPreview();
    this.valueChange.emit(file ? file.name : '');
    if (!file || !fileOk(file.name, true)) return;
    this.previewUrl = URL.createObjectURL(file);
    this.preview.set(this.previewUrl);
    this.previewKind.set(file.type.startsWith('image/') ? 'image' : 'pdf');
  }

  protected remove(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.clearPreview();
    if (this.picker) this.picker.nativeElement.value = '';
    this.valueChange.emit('');
    this.blurred.emit();
  }

  private clearPreview(): void {
    if (this.previewUrl) URL.revokeObjectURL(this.previewUrl);
    this.previewUrl = '';
    this.preview.set('');
    this.previewKind.set('');
  }
}
