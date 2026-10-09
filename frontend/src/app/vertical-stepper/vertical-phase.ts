import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-vertical-phase',
  templateUrl: './vertical-phase.html',
  styleUrl: './vertical-phase.css',
})
export class VerticalPhase {
  @Input() label = 'ระยะที่ 1 : เปิดไต่สวน';
  @Input() count = '7/7';
  @Input() expanded = false;

  toggle(): void {
    this.expanded = !this.expanded;
  }
}
