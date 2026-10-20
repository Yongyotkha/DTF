import { ApplicationRef, ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { DftButton } from '../../button/button';
import { downloadFormTemplate } from './form-template';

const maxBytes = 50 * 1024 * 1024;
const accept = /\.docx$/i;

@Component({
  selector: 'app-filled-upload',
  imports: [DftButton],
  templateUrl: './filled-upload.html',
  styleUrl: './filled-upload.css',
})
export class FilledUpload implements OnDestroy {
  @Input({ required: true }) code = '';
  @Output() closed = new EventEmitter<void>();
  @Output() filled = new EventEmitter<string>();
  protected over = false;
  protected picked = '';
  protected error = '';
  protected processing = false;
  protected active = 0;
  protected readonly steps = ['อัปโหลดไฟล์', 'อ่านและระบุประเภทเอกสาร', 'ดึงข้อมูลจากเนื้อหา', 'จับคู่กับช่องในแบบฟอร์ม'];
  private timer = 0;

  constructor(
    private readonly view: ChangeDetectorRef,
    private readonly app: ApplicationRef,
  ) {}

  ngOnDestroy(): void {
    this.clearTimer();
  }

  protected get progress(): number {
    return Math.round((this.active / this.steps.length) * 100);
  }

  protected close(): void {
    this.clearTimer();
    this.closed.emit();
  }

  protected downloadTemplate(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    downloadFormTemplate(this.code);
  }

  protected allowDrop(event: DragEvent): void {
    event.preventDefault();
    this.over = true;
  }

  protected take(list: FileList | null): void {
    this.over = false;
    const file = list?.[0];
    if (!file || this.processing) return;
    if (!accept.test(file.name) || file.size > maxBytes) {
      this.error = 'รองรับไฟล์ DOCX ไม่เกิน 50 MB';
      return;
    }
    this.error = '';
    this.picked = file.name;
    this.begin();
  }

  private begin(): void {
    this.clearTimer();
    this.processing = true;
    this.active = 1;
    this.timer = window.setInterval(() => this.advance(), 1000);
  }

  private advance(): void {
    if (this.active < this.steps.length) {
      this.active += 1;
      this.view.detectChanges();
      return;
    }
    this.clearTimer();
    this.filled.emit(this.picked);
    this.close();
    this.app.tick();
  }

  private clearTimer(): void {
    window.clearInterval(this.timer);
    this.timer = 0;
  }
}
