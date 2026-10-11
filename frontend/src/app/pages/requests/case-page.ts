import { Component } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SideNav } from '../../menu-bar/side-nav';
import { StepperOne, StepperOneItem } from '../../stepper-1/stepper-1';
import { TopHeader } from '../../top-header/top-header';
import { findListedCase } from './request-cases';

@Component({
  selector: 'app-case-page',
  imports: [TopHeader, SideNav, StepperOne, RouterLink],
  templateUrl: './case-page.html',
  styleUrl: './case-page.css',
})
export class CasePage {
  protected readonly sections = ['รายละเอียด', 'ผลการตรวจสอบ', 'การไต่สวน', 'ผู้มีส่วนได้เสีย', 'ประวัติ'];
  protected readonly title: string;
  protected readonly statusNote: string;
  protected readonly stepIndex: number;
  protected readonly steps: StepperOneItem[];
  protected readonly facts: { label: string; value: string }[];
  protected readonly files: string[];
  protected readonly history: { title: string; detail: string; when: string; docs: string[] }[];
  protected section = 'รายละเอียด';
  protected openHistory: number | null = null;

  constructor(
    private readonly router: Router,
    route: ActivatedRoute,
  ) {
    const code = route.snapshot.paramMap.get('code') ?? '';
    const item = findListedCase(code);
    this.title = item ? `${item.code} ${item.goods}` : code;
    this.statusNote = item ? `${item.status} · ${item.kind}` : 'ไม่พบคำขอ';
    const current = item?.steps.findIndex((step) => step.state === 'current') ?? 0;
    this.stepIndex = current + 1;
    this.steps = (item?.steps ?? []).map((step, index) => ({
      state: step.state === 'done' ? 'success' : step.state === 'current' ? 'pending' : 'disabled',
      label: step.name,
      number: String(index + 1),
    }));
    this.facts = item
      ? [
          { label: 'ประเภทมาตรการ', value: 'AD (ตอบโต้การทุ่มตลาด)' },
          { label: 'เลขคำขอ', value: item.code },
          { label: 'ชื่อสินค้า', value: item.goods },
          { label: 'ประเภทการยื่น', value: item.kind },
          { label: 'สถานะ', value: item.status },
        ]
      : [];
    this.files = item?.documents ?? [];
    this.history = (item?.steps ?? [])
      .filter((step) => step.state !== 'todo')
      .map((step) => ({
        title: step.name,
        detail: item?.goods ?? '',
        when: step.date ? `วันที่ ${step.date}` : '',
        docs: [],
      }));
  }

  protected openFailed(): void {
    void this.router.navigate(['/requests', 'draft', 'A4']);
  }

  protected openChat(): void {
    void this.router.navigate(['/requests', 'chat']);
  }

  protected toggleHistory(index: number): void {
    this.openHistory = this.openHistory === index ? null : index;
  }
}
