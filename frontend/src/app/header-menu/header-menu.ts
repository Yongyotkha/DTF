import { Component, Input } from '@angular/core';
import { HoverMenu } from '../hover-menu/hover-menu';

@Component({
  selector: 'app-header-menu',
  imports: [HoverMenu],
  templateUrl: './header-menu.html',
  styleUrl: './header-menu.css',
})
export class HeaderMenu {
  @Input() label = 'คำขอ';
  @Input() items = ['ยื่นคำขอ'];
  @Input() open = false;

  toggle(): void {
    this.open = !this.open;
  }
}
