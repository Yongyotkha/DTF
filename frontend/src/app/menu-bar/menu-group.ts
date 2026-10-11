import { Component, EventEmitter, Input, Output } from '@angular/core';
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
  @Input() active = '';
  @Input() compact = false;
  @Output() readonly chosen = new EventEmitter<string>();
  @Output() readonly toggled = new EventEmitter<void>();
  @Output() readonly opened = new EventEmitter<void>();

  protected get icon(): 'request' | 'investigate' | 'petition' | 'tasks' | 'archive' | 'settings' | '' {
    if (this.title === 'คำขอ') return 'request';
    if (this.title === 'กระบวนการไต่สวน') return 'investigate';
    if (this.title === 'คำร้อง') return 'petition';
    if (this.title === 'ระบบ Task Management') return 'tasks';
    if (this.title === 'จัดเก็บเอกสารอิเล็กทรอนิกส์') return 'archive';
    if (this.title === 'ตั้งค่าระบบ') return 'settings';
    return '';
  }

  protected activate(): void {
    this.toggled.emit();
    if (this.compact) this.opened.emit();
  }
}
