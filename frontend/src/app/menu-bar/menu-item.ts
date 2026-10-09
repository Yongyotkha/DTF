import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-menu-item',
  templateUrl: './menu-item.html',
  styleUrl: './menu-item.css',
})
export class MenuItem {
  @Input() label = 'main-menu';
  @Input() level: 'main' | 'sub' = 'main';
  @Input() state: 'default' | 'active' = 'default';
  @Input() expanded = false;
  @Input() icon: 'request' | 'investigate' | 'petition' | 'guide' | 'home' | '' = '';
  @Input() chevron = false;
  @Input() compact = false;

  protected get iconBox(): { src: string; width: number; height: number } | null {
    if (this.icon === 'request') return { src: 'assets/icons/menu-request.svg', width: 18, height: 22 };
    if (this.icon === 'investigate') return { src: 'assets/icons/menu-investigate.svg', width: 20, height: 20 };
    if (this.icon === 'petition') return { src: 'assets/icons/menu-petition.svg', width: 18, height: 22 };
    if (this.icon === 'guide') return { src: 'assets/icons/menu-guide.svg', width: 22, height: 20 };
    return null;
  }
}
