import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DftButton } from '../button/button';
import { StatusTag } from '../status-tag/status-tag';
import type { ApprovalLaneDoc } from '../pages/requests/case-status';

@Component({
  selector: 'app-approval-doc-panel',
  imports: [DftButton, StatusTag],
  templateUrl: './approval-doc-panel.html',
  styleUrl: './approval-doc-panel.css',
})
export class ApprovalDocPanel {
  @Input() title = 'เอกสารขออนุมัติ';
  @Input() detail = 'สร้างในระบบ / AI ช่วยร่าง / อัปโหลด';
  @Input() docs: ApprovalLaneDoc[] = [];
  @Input() locked = false;
  @Input() aiBusy = false;
  @Input() required = true;
  @Input() createLabel = 'สร้างเอกสาร';
  @Input() aiLabel = 'AI ช่วยร่าง';
  @Input() uploadLabel = 'อัปเดตไฟล์';
  @Input() emptyText = 'ยังไม่มีไฟล์ — กดสร้างเอกสาร AI ช่วยร่าง หรืออัปเดตไฟล์';
  @Input() accept = '.png,.jpg,.jpeg,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.tiff';

  @Output() create = new EventEmitter<void>();
  @Output() askAi = new EventEmitter<void>();
  @Output() upload = new EventEmitter<FileList>();
  @Output() openDoc = new EventEmitter<ApprovalLaneDoc>();
  @Output() downloadDoc = new EventEmitter<ApprovalLaneDoc>();
  @Output() removeDoc = new EventEmitter<ApprovalLaneDoc>();
  @Output() renameDoc = new EventEmitter<{ doc: ApprovalLaneDoc; title: string }>();

  protected sourceLabel(source: ApprovalLaneDoc['source']): string {
    if (source === 'ai') return 'AI ช่วยร่าง';
    if (source === 'upload') return 'อัปโหลด';
    if (source === 'numbered') return 'ไฟล์ออกเลขแล้ว';
    return 'สร้างในระบบ';
  }

  protected sourceTone(source: ApprovalLaneDoc['source']): 'info' | 'warning' | 'neutral' | 'success' {
    if (source === 'ai') return 'info';
    if (source === 'upload') return 'warning';
    if (source === 'numbered') return 'success';
    return 'neutral';
  }

  protected onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) this.upload.emit(input.files);
    input.value = '';
  }
}
