import { Component, Input } from '@angular/core';

export type StepsMenuState = 'default' | 'onclick' | 'success';

@Component({
  selector: 'app-steps-menu-item',
  templateUrl: './steps-menu-item.html',
  styleUrl: './steps-menu-item.css',
})
export class StepsMenuItem {
  @Input() label = 'text';
  @Input() state: StepsMenuState = 'default';
}
