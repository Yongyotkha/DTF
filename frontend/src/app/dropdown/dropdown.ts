import { Component, EventEmitter, Input, Output } from '@angular/core';

export type DropdownIcon = 'profile' | 'password' | 'logout';

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
    { label: 'ข้อมูลโปรไฟล์', icon: 'profile' },
    { label: 'เปลี่ยนรหัสผ่าน', icon: 'password' },
    { label: 'ออกจากระบบ', icon: 'logout' },
  ];
  @Output() pick = new EventEmitter<string>();
}
