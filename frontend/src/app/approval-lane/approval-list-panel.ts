import { Component, ElementRef, EventEmitter, Input, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { DftButton } from '../button/button';
import { StatusTag } from '../status-tag/status-tag';
import {
  canCreateApprovalItem,
  isApprovalItemOpen,
  type ApprovalKeptFile,
  type ApprovalListRow,
} from '../pages/requests/case-status';

@Component({
  selector: 'app-approval-list-panel',
  imports: [DftButton, StatusTag],
  templateUrl: './approval-list-panel.html',
  styleUrl: './approval-list-panel.css',
  encapsulation: ViewEncapsulation.None,
})
export class ApprovalListPanel {
  @Input() title = 'รายการอนุมัติ';
  @Input() subtitle = 'ทำทีละรายการ — ต้องอนุมัติหรือปฏิเสธก่อนสร้างใหม่';
  @Input() createLabel = 'สร้างรายการอนุมัติ';
  @Input() canCreate = true;
  @Input() createBlockedReason = 'รออนุมัติหรือปฏิเสธรายการปัจจุบันก่อนสร้างใหม่';
  @Input() showCreate = true;
  @Input() emptyText = 'ยังไม่มีรายการอนุมัติ';
  @Input() rows: ApprovalListRow[] = [];

  @Output() create = new EventEmitter<void>();
  @Output() open = new EventEmitter<ApprovalListRow>();
  @Output() history = new EventEmitter<ApprovalListRow>();
  @Output() edit = new EventEmitter<ApprovalListRow>();
  @Output() review = new EventEmitter<ApprovalListRow>();
  @Output() cancel = new EventEmitter<ApprovalListRow>();
  @Output() uploadFiles = new EventEmitter<{ row: ApprovalListRow; files: FileList }>();
  @Output() removeKeptFile = new EventEmitter<{ row: ApprovalListRow; file: ApprovalKeptFile }>();
  @Output() openKeptFile = new EventEmitter<{ row: ApprovalListRow; file: ApprovalKeptFile }>();
  @Output() downloadKeptFile = new EventEmitter<{ row: ApprovalListRow; file: ApprovalKeptFile }>();
  @Output() deliver = new EventEmitter<ApprovalListRow>();

  @ViewChild('keptFileInput') private keptFileInput?: ElementRef<HTMLInputElement>;

  private uploadTarget: ApprovalListRow | null = null;

  /** ล็อกจากทั้งสิทธิ์ที่ parent ส่งมา และสถานะจริงในตาราง */
  protected get allowCreate(): boolean {
    if (!this.canCreate) return false;
    return canCreateApprovalItem(this.rows.map((row) => row.stage));
  }

  protected get blockedReason(): string {
    if (this.allowCreate) return '';
    if (!this.canCreate && this.createBlockedReason) return this.createBlockedReason;
    if (this.rows.some((row) => isApprovalItemOpen(row.stage))) {
      return 'รออนุมัติหรือปฏิเสธรายการปัจจุบันก่อนสร้างใหม่';
    }
    return this.createBlockedReason;
  }

  protected isOpen(row: ApprovalListRow): boolean {
    return isApprovalItemOpen(row.stage);
  }

  protected canUpload(row: ApprovalListRow): boolean {
    return row.canUpload === true;
  }

  protected canDeliver(row: ApprovalListRow): boolean {
    return row.canDeliver === true;
  }

  protected keptFiles(row: ApprovalListRow): ApprovalKeptFile[] {
    return row.keptFiles || [];
  }

  protected onCreate(): void {
    if (!this.allowCreate) return;
    this.create.emit();
  }

  protected pickKeptFiles(row: ApprovalListRow): void {
    if (!this.canUpload(row)) return;
    this.uploadTarget = row;
    const input = this.keptFileInput?.nativeElement;
    if (!input) return;
    input.value = '';
    input.click();
  }

  protected onKeptFilesPicked(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    const row = this.uploadTarget;
    this.uploadTarget = null;
    input.value = '';
    if (!row || !files?.length) return;
    this.uploadFiles.emit({ row, files });
  }
}
