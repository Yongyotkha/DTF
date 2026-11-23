import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DftButton } from '../button/button';
import type { ApprovalLaneHistoryEntry } from '../pages/requests/case-status';

@Component({
  selector: 'app-approval-history-panel',
  imports: [DftButton],
  templateUrl: './approval-history-panel.html',
  styleUrl: './approval-history-panel.css',
})
export class ApprovalHistoryPanel {
  @Input() open = false;
  @Input() title = 'ประวัติละเอียด';
  @Input() detail = '';
  @Input() entries: ApprovalLaneHistoryEntry[] = [];
  @Input() emptyText = 'ยังไม่มีประวัติการกระทำ';

  @Output() closed = new EventEmitter<void>();

  protected get items(): ApprovalLaneHistoryEntry[] {
    return [...this.entries].reverse();
  }

  protected close(): void {
    this.closed.emit();
  }
}
