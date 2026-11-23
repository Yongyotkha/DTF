import { Component, Input } from '@angular/core';
import { VerticalStep, VerticalStepState } from '../vertical-stepper/vertical-step';
import {
  approvalLaneStageLabel,
  type ApprovalLaneStage,
} from '../pages/requests/case-status';

export type ApprovalLaneStepperItem = {
  stage: ApprovalLaneStage;
  label?: string;
  note?: string;
};

@Component({
  selector: 'app-approval-lane-stepper',
  imports: [VerticalStep],
  templateUrl: './approval-lane-stepper.html',
  styleUrl: './approval-lane-stepper.css',
})
export class ApprovalLaneStepper {
  @Input() stages: ApprovalLaneStage[] = [];
  @Input() current: ApprovalLaneStage = 'draft';
  @Input() ariaLabel = 'ท่ออนุมัติ';
  /** แนวนอนสำหรับแถบในฟอร์ม · แนวตั้งเมื่อพื้นที่แคบ */
  @Input() layout: 'row' | 'column' = 'row';

  protected items(): { stage: ApprovalLaneStage; state: VerticalStepState; label: string; number: string; note: string }[] {
    const flow = this.stages.filter((s) => s !== 'returned' && s !== 'cancelled');
    const returned = this.current === 'returned';
    const cancelled = this.current === 'cancelled';
    const flowCurrent = returned || cancelled ? -1 : flow.findIndex((s) => s === this.current);
    const at = Math.max(0, flowCurrent);
    return flow.map((stage, index) => {
      let state: VerticalStepState = 'disabled';
      if (cancelled) state = 'disabled';
      else if (returned) state = 'disabled';
      else if (index < at) state = 'success';
      else if (index === at) state = 'pending';
      return {
        stage,
        state,
        label: approvalLaneStageLabel(stage),
        number: String(index + 1),
        note: index === at && !cancelled && !returned ? 'ปัจจุบัน' : '',
      };
    });
  }
}
