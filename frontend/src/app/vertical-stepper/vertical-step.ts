import { Component, Input } from '@angular/core';

export type VerticalStepState = 'success' | 'pending' | 'disabled';

@Component({
  selector: 'app-vertical-step',
  templateUrl: './vertical-step.html',
  styleUrl: './vertical-step.css',
})
export class VerticalStep {
  @Input() state: VerticalStepState = 'disabled';
  @Input() label = 'text';
  @Input() number = '1';
}
