import { Component, Input } from '@angular/core';

export type HoverMenuTone = 'primary' | 'secondary';

@Component({
  selector: 'app-hover-menu',
  templateUrl: './hover-menu.html',
  styleUrl: './hover-menu.css',
})
export class HoverMenu {
  @Input() label = 'ชื่อเมนู';
  @Input() tone: HoverMenuTone = 'primary';
}
