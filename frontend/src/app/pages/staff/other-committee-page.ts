import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DftButton } from '../../button/button';
import { InputField } from '../../input-field/input-field';
import { SideNav } from '../../menu-bar/side-nav';
import { StatusTag } from '../../status-tag/status-tag';
import { TopHeader } from '../../top-header/top-header';

type TaskId = 'filing' | 'agenda' | 'hearing';

const tasks: { id: TaskId; label: string; hint: string }[] = [
  { id: 'filing', label: 'ตรวจสอบและอนุมัติ', hint: 'ตรวจสอบและอนุมัติการยื่นแบบคำร้องทางการ' },
  { id: 'agenda', label: 'ตรวจและปรับแก้วาระ', hint: 'ตรวจวาระที่เจ้าหน้าที่ร่างไว้ แล้วปรับแก้ก่อนอนุมัติ' },
  { id: 'hearing', label: 'อนุมัติ hearing', hint: 'อนุมัติการลงรับและพิจารณาการจัด hearing' },
];

@Component({
  selector: 'app-other-committee-page',
  imports: [TopHeader, SideNav, DftButton, StatusTag, InputField],
  templateUrl: './other-committee-page.html',
  styleUrl: '../requests/requests-page.css',
})
export class OtherCommitteePage {
  protected readonly tasks = tasks;
  protected readonly active: string;
  protected agenda = 'วาระพิจารณาคำขอ เปิดไต่สวน และกำหนดการรับฟังความคิดเห็น';
  private saved: Record<string, string> = {};

  constructor(route: ActivatedRoute) {
    this.active = route.snapshot.queryParamMap.get('task') ?? '';
    this.saved = this.read();
    if (this.saved['agenda-text']) this.agenda = this.saved['agenda-text'];
  }

  protected done(id: TaskId): boolean {
    return !!this.saved[id];
  }

  protected approve(id: TaskId): void {
    this.saved = { ...this.saved, [id]: 'อนุมัติแล้ว', 'agenda-text': this.agenda.trim() };
    sessionStorage.setItem('dft-other-committee', JSON.stringify(this.saved));
  }

  private read(): Record<string, string> {
    try {
      const value = JSON.parse(sessionStorage.getItem('dft-other-committee') || '{}') as Record<string, string>;
      return value && typeof value === 'object' ? value : {};
    } catch {
      return {};
    }
  }
}
