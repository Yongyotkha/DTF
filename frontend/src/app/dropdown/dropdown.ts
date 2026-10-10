import { Component, EventEmitter, Input, Output } from '@angular/core';

export type DropdownIcon = 'edit' | 'chevron';

export interface DropdownItem {
  label: string;
  icon: DropdownIcon;
}

@Component({
  selector: 'app-dropdown',
  templateUrl: './dropdown.html',
  styleUrl: './dropdown.css',
})
export class Dropdown {
  @Input() items: DropdownItem[] = [
    { label: 'ข้อมูลโปรไฟล์', icon: 'edit' },
    { label: 'เปลี่ยนรหัสผ่าน', icon: 'chevron' },
    { label: 'ออกจากระบบ', icon: 'chevron' },
  ];
  @Output() pick = new EventEmitter<string>();
}
