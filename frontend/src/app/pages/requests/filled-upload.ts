import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DftButton } from '../../button/button';

const maxBytes = 20 * 1024 * 1024;
const accept = /\.(pdf|docx?|png|jpe?g)$/i;

@Component({
  selector: 'app-filled-upload',
  imports: [DftButton],
  templateUrl: './filled-upload.html',
  styleUrl: './filled-upload.css',
})
export class FilledUpload {
  @Input({ required: true }) code = '';
  @Output() closed = new EventEmitter<void>();
  protected over = false;
  protected picked = '';
  protected error = '';

  protected close(): void {
    this.closed.emit();
  }

  protected allowDrop(event: DragEvent): void {
    event.preventDefault();
    this.over = true;
  }

  protected take(list: FileList | null): void {
    this.over = false;
    const file = list?.[0];
    if (!file) return;
    if (!accept.test(file.name) || file.size > maxBytes) {
      this.error = 'รองรับ PDF, DOCX, JPG/PNG ไม่เกิน 20 MB';
      return;
    }
    this.error = '';
    this.picked = file.name;
  }
}
