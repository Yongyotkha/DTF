import { Component, Input } from '@angular/core';
import { VerticalStep, VerticalStepState } from '../vertical-stepper/vertical-step';

export interface StepperOneItem {
  state: VerticalStepState;
  label: string;
  number: string;
}

@Component({
  selector: 'app-stepper-1',
  imports: [VerticalStep],
  templateUrl: './stepper-1.html',
  styleUrl: './stepper-1.css',
})
export class StepperOne {
  @Input() current = 2;
  @Input() open = true;
  @Input() steps: StepperOneItem[] = [
    { state: 'success', label: 'text', number: '1' },
    { state: 'pending', label: 'text', number: '2' },
    { state: 'disabled', label: 'text', number: '3' },
    { state: 'disabled', label: 'text', number: '4' },
    { state: 'disabled', label: 'text', number: '5' },
    { state: 'disabled', label: 'text', number: '6' },
    { state: 'disabled', label: 'text', number: '7' },
    { state: 'disabled', label: 'text', number: '8' },
    { state: 'disabled', label: 'text', number: '9' },
    { state: 'disabled', label: 'text', number: '10' },
  ];

  toggle(): void {
    this.open = !this.open;
  }
}
