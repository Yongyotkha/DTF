import { Component, Input } from '@angular/core';

export type StatusTone = 'success' | 'info' | 'warning' | 'danger' | 'neutral';
export type StatusVariant = 'soft' | 'solid' | 'outline';

const labels: Record<StatusTone, string> = {
  success: 'สำเร็จ',
  info: 'กำลังดำเนินการ',
  warning: 'รอตรวจสอบ',
  danger: 'ไม่สำเร็จ',
  neutral: 'ฉบับร่าง',
};

@Component({
  selector: 'app-status-tag',
  templateUrl: './status-tag.html',
  styleUrl: './status-tag.css',
})
export class StatusTag {
  @Input() tone: StatusTone = 'success';
  @Input() variant: StatusVariant = 'soft';
  @Input() label = '';

  protected get text(): string {
    return this.label || labels[this.tone];
  }
}
