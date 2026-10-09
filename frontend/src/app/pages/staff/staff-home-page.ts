import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SideNav } from '../../menu-bar/side-nav';
import { StatusTag, StatusTone } from '../../status-tag/status-tag';
import { TopHeader } from '../../top-header/top-header';

type Bucket = 'in' | 'pending' | 'out' | 'follow' | 'group';

type TaskCase = {
  code: string;
  product: string;
  sender: string;
  group: string;
  at: string;
  status: string;
  due: string;
  tone: StatusTone;
};

const buckets: { id: Bucket; label: string; count: number; icon: string; tone: string }[] = [
  { id: 'in', label: 'งานรับเข้า', count: 3, icon: 'assets/icons/task-in.svg', tone: 'var(--color-primary)' },
  { id: 'pending', label: 'งานค้าง', count: 0, icon: 'assets/icons/task-pending.svg', tone: 'var(--color-error-red)' },
  { id: 'out', label: 'งานออก', count: 3, icon: 'assets/icons/task-out.svg', tone: 'var(--color-success)' },
  { id: 'follow', label: 'งานที่ต้องติดตาม', count: 1, icon: 'assets/icons/task-follow.svg', tone: 'var(--color-selected-orange)' },
  { id: 'group', label: 'งานระหว่างดำเนินการของกลุ่ม', count: 1, icon: 'assets/icons/task-group.svg', tone: 'var(--color-link-hover)' },
];

const sample: TaskCase = {
  code: 'AD2601',
  product: 'เหล็กแผ่นรีดร้อน (Hot-Rolled Steel)',
  sender: 'บริษัท สยามสติลการค้า จำกัด',
  group: 'กลุ่มบท.ลงรับ',
  at: '24/09/2569 09:30:15',
  status: 'ยื่นคำขอ',
  due: '',
  tone: 'info',
};

@Component({
  selector: 'app-staff-home-page',
  imports: [TopHeader, SideNav, StatusTag],
  templateUrl: './staff-home-page.html',
  styleUrl: './staff-home-page.css',
})
export class StaffHomePage {
  protected readonly buckets = buckets;
  protected selected: Bucket = 'in';

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
  ) {}

  protected get role(): string {
    return this.route.snapshot.data['role'] ?? 'staff';
  }

  protected get styled(): boolean {
    return this.role === 'director' || this.role === 'head' || this.role === 'officer';
  }

  protected get current() {
    return buckets.find((item) => item.id === this.selected) ?? buckets[0];
  }

  protected get rows(): TaskCase[] {
    let group = sample.group;
    let status = sample.status;
    let tone: StatusTone = this.styled ? 'neutral' : 'info';
    let due = '';
    if (this.role === 'director') group = 'ผอ. มอบหมาย';
    if (this.role === 'head') {
      group = this.selected === 'group' ? 'ผอ. มอบหมาย' : 'หัวหน้ารายงานผลหรือส่งต่อ';
      if (this.selected === 'in') due = 'วันที่ครบกำหนดส่ง : 24/09/2569';
      if (this.selected === 'out') {
        status = 'กระบวนการไต่สวน';
        tone = 'success';
      }
    }
    if (this.role === 'officer') {
      group = 'เจ้าหน้าที่ดำเนินการ';
      if (this.selected === 'in') due = 'วันที่ครบกำหนดส่ง : 24/09/2569';
      if (this.selected === 'out') {
        status = 'กระบวนการไต่สวน';
        tone = 'success';
      }
    }
    return Array.from({ length: this.current.count }, () => ({ ...sample, group, status, due, tone }));
  }

  protected openMenu(label: string): void {
    if (label === 'หน้าหลัก') void this.router.navigate([this.home]);
  }

  protected openCase(code: string): void {
    const base = this.role === 'staff' ? '/staff/tasks' : `/${this.role}/tasks`;
    void this.router.navigate([base, code]);
  }

  private get home(): string {
    return this.role === 'staff' ? '/staff' : `/${this.role}`;
  }
}
