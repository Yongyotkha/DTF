import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DftButton } from '../button/button';
import type { ApprovalLaneStage } from '../pages/requests/case-status';

export type ApprovalLaneActor = 'officer' | 'head' | 'director' | 'viewer';

export type ApprovalLaneActionId =
  | 'save-draft'
  | 'send-head'
  | 'return-officer'
  | 'approve-head'
  | 'approve-director'
  | 'send-eoffice'
  | 'mark-stamped'
  | 'pull-number'
  | 'attach-numbered'
  | 'finish'
  | 'cancel';

@Component({
  selector: 'app-approval-lane-actions',
  imports: [DftButton],
  templateUrl: './approval-lane-actions.html',
  styleUrl: './approval-lane-actions.css',
})
export class ApprovalLaneActions {
  @Input() stage: ApprovalLaneStage = 'draft';
  @Input() actor: ApprovalLaneActor = 'officer';
  @Input() canPrimary = true;
  /** ปุ่มจัดเก็บ/ส่งต่อ — ต้องมีเลขสารบรรณก่อน */
  @Input() canFinish = true;
  @Input() finishLabel = 'จัดเก็บ / ส่งต่อ';
  @Input() waitingText = '';
  /** ซ่อนปุ่มส่ง e-Office เมื่อมีแผง payload/fallback แยกแล้ว */
  @Input() hideEofficeSend = false;

  @Output() action = new EventEmitter<ApprovalLaneActionId>();

  private get canRunEofficeSteps(): boolean {
    return this.actor === 'officer' || this.actor === 'director';
  }

  protected get waiting(): string {
    if (this.waitingText) return this.waitingText;
    if (this.stage === 'to-head' && this.actor === 'officer') return 'รอหัวหน้ากลุ่มพิจารณา';
    if (this.stage === 'to-director' && this.actor !== 'director') return 'รอผู้อำนวยการพิจารณา';
    if (this.stage === 'eoffice' && !this.canRunEofficeSteps) {
      return 'รอเจ้าหน้าที่หรือผู้อำนวยการส่ง e-Office (หรือกรอกเลข/แนบไฟล์เอง)';
    }
    if ((this.stage === 'stamped' || this.stage === 'numbered') && !this.canRunEofficeSteps) {
      return 'รอลงเลขสารบรรณจาก e-Office หรือกรอกเลขเองในระบบ';
    }
    if (this.stage === 'attach' && !this.canRunEofficeSteps) {
      return 'รอแนบไฟล์ที่ออกเลขแล้ว (เจ้าหน้าที่หรือผู้อำนวยการ)';
    }
    if (this.stage === 'done') return 'อนุมัติแล้ว — แนบไฟล์สมบูรณ์แล้วกดส่งให้ผู้ยื่น';
    if (this.stage === 'delivered') return 'ส่งฉบับสมบูรณ์ให้ผู้ยื่นแล้ว';
    if (this.stage === 'cancelled') return 'รายการนี้ถูกยกเลิกแล้ว';
    return '';
  }

  protected get showSaveDraft(): boolean {
    return this.stage === 'draft' && this.actor === 'officer';
  }

  protected get showSendHead(): boolean {
    return this.stage === 'draft' && this.actor === 'officer';
  }

  protected get showHeadActs(): boolean {
    return this.stage === 'to-head' && this.actor === 'head';
  }

  protected get showDirectorActs(): boolean {
    return this.stage === 'to-director' && this.actor === 'director';
  }

  protected get showSendEoffice(): boolean {
    return this.stage === 'eoffice' && this.canRunEofficeSteps && !this.hideEofficeSend;
  }

  protected get showMarkStamped(): boolean {
    return this.stage === 'stamped' && this.canRunEofficeSteps;
  }

  protected get showPullNumber(): boolean {
    return this.stage === 'numbered' && this.canRunEofficeSteps;
  }

  protected get showAttach(): boolean {
    return this.stage === 'attach' && this.canRunEofficeSteps;
  }

  protected get showFinish(): boolean {
    return this.stage === 'attach' && this.canRunEofficeSteps;
  }

  protected emit(id: ApprovalLaneActionId): void {
    this.action.emit(id);
  }
}
