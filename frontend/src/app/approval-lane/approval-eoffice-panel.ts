import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DftButton } from '../button/button';
import { InputField } from '../input-field/input-field';
import { StatusTag } from '../status-tag/status-tag';

/** ข้อมูลที่ส่งเข้า e-Office (แนวหนังสือรับ/ส่ง ตามจอ e-Office) */
export type ApprovalEofficePayload = {
  subject: string;
  from: string;
  to: string;
  ref: string;
  letterDate: string;
  speed: string;
  secrecy: string;
  fileCount: number;
  fileNames: string[];
  caseRef: string;
};

export type ApprovalEofficeLinkState = 'idle' | 'sent' | 'synced' | 'error' | 'manual';

@Component({
  selector: 'app-approval-eoffice-panel',
  imports: [DftButton, InputField, StatusTag],
  templateUrl: './approval-eoffice-panel.html',
  styleUrl: './approval-eoffice-panel.css',
})
export class ApprovalEofficePanel {
  @Input() payload: ApprovalEofficePayload = {
    subject: '',
    from: '',
    to: '',
    ref: '',
    letterDate: '',
    speed: 'ปกติ',
    secrecy: 'ปกติ',
    fileCount: 0,
    fileNames: [],
    caseRef: '',
  };
  @Input() linkState: ApprovalEofficeLinkState = 'idle';
  @Input() linkDetail = '';
  @Input() letterNo = '';
  @Input() locked = false;
  @Input() canAct = true;
  @Input() accept = '.pdf,.doc,.docx';

  @Output() sendAuto = new EventEmitter<void>();
  @Output() sendFail = new EventEmitter<void>();
  @Output() syncPull = new EventEmitter<void>();
  @Output() applyManual = new EventEmitter<{ letterNo: string; files: FileList | null }>();
  @Output() letterNoChange = new EventEmitter<string>();

  protected draftNo = '';
  protected pickedFiles: FileList | null = null;
  protected pickedNames: string[] = [];

  protected get stateLabel(): string {
    if (this.linkState === 'sent') return 'ส่ง e-Office แล้ว — รอ sync';
    if (this.linkState === 'synced') return 'sync จาก e-Office แล้ว';
    if (this.linkState === 'error') return 'เชื่อม e-Office ไม่ได้';
    if (this.linkState === 'manual') return 'กรอกเลข / แนบไฟล์เอง';
    return 'ยังไม่ส่ง e-Office';
  }

  protected get stateTone(): 'info' | 'success' | 'warning' | 'danger' | 'neutral' {
    if (this.linkState === 'synced' || this.linkState === 'manual') return 'success';
    if (this.linkState === 'sent') return 'info';
    if (this.linkState === 'error') return 'danger';
    return 'neutral';
  }

  protected get showSend(): boolean {
    return this.canAct && !this.locked && (this.linkState === 'idle' || this.linkState === 'error');
  }

  protected get showSync(): boolean {
    return this.canAct && !this.locked && (this.linkState === 'sent' || this.linkState === 'error');
  }

  protected get showManual(): boolean {
    return this.canAct && !this.locked && (this.linkState === 'error' || this.linkState === 'sent' || this.linkState === 'manual' || this.linkState === 'idle');
  }

  protected onFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.pickedFiles = input.files;
    this.pickedNames = input.files ? [...input.files].map((f) => f.name) : [];
  }

  protected submitManual(): void {
    const no = (this.draftNo || this.letterNo).trim();
    if (!no) return;
    this.applyManual.emit({ letterNo: no, files: this.pickedFiles });
  }

  protected onNoInput(value: string): void {
    this.draftNo = value;
    this.letterNoChange.emit(value);
  }
}
