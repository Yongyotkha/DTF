import { Component, ElementRef, EventEmitter, Input, Output } from '@angular/core';
import { MenuItem } from './menu-item';

@Component({
  selector: 'app-menu-group',
  imports: [MenuItem],
  templateUrl: './menu-group.html',
  styleUrl: './menu-group.css',
})
export class MenuGroup {
  @Input() title = '';
  @Input() items: string[] = [];
  @Input() expanded = false;
  @Input() flyout = false;
  @Input() active = '';
  @Input() compact = false;
  @Output() readonly chosen = new EventEmitter<string>();
  @Output() readonly toggled = new EventEmitter<void>();

  protected flyoutTop = 8;

  constructor(private readonly host: ElementRef<HTMLElement>) {}

  protected get icon(): 'request' | 'investigate' | 'petition' | 'tasks' | 'archive' | 'settings' | '' {
    if (this.title === 'คำขอ') return 'request';
    if (this.title === 'กระบวนการไต่สวน') return 'investigate';
    if (this.title === 'คำร้อง') return 'petition';
    if (this.title === 'ระบบ Task Management') return 'tasks';
    if (this.title === 'จัดเก็บเอกสารอิเล็กทรอนิกส์') return 'archive';
    if (this.title === 'ตั้งค่าระบบ') return 'settings';
    return '';
  }

  protected get flyoutId(): string {
    return `menu-flyout-${this.title}`;
  }

  protected get groupActive(): boolean {
    return this.flyout || (!this.compact && this.expanded) || this.items.includes(this.active);
  }

  protected activate(): void {
    const top = this.host.nativeElement.getBoundingClientRect().top;
    const limit = Math.max(8, window.innerHeight - 160);
    this.flyoutTop = Math.max(8, Math.min(top, limit));
    this.toggled.emit();
  }
}
