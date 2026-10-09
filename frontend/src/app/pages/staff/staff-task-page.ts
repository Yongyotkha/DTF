import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DftButton } from '../../button/button';
import { SideNav } from '../../menu-bar/side-nav';
import { StepperOne, StepperOneItem } from '../../stepper-1/stepper-1';
import { TopHeader } from '../../top-header/top-header';

@Component({
  selector: 'app-staff-task-page',
  imports: [TopHeader, SideNav, DftButton, StepperOne],
  templateUrl: './staff-task-page.html',
  styleUrl: './staff-task-page.css',
})
export class StaffTaskPage {
  protected open = true;
  protected reviseOpen = true;
  protected summaryOpen = true;
  protected noticeOpen = false;
  protected assistant = true;
  private readonly intakeSteps: StepperOneItem[] = [
    { state: 'success', label: 'รายละเอียดคำร้อง', number: '1' },
    { state: 'pending', label: 'กลุ่ม บท. รับเรื่อง', number: '2' },
    { state: 'disabled', label: 'ผอ. มอบหมาย', number: '3' },
    { state: 'disabled', label: 'หัวหน้ากลุ่มมอบหมาย', number: '4' },
    { state: 'disabled', label: 'ผอ. ตรวจสอบการรายงานผล', number: '5' },
  ];

  private readonly headSteps: StepperOneItem[] = [
    { state: 'success', label: 'รายละเอียดคำร้อง', number: '1' },
    { state: 'success', label: 'กลุ่ม บท. รับเรื่อง', number: '2' },
    { state: 'success', label: 'ผอ. มอบหมาย', number: '3' },
    { state: 'pending', label: 'หัวหน้ากลุ่มมอบหมาย', number: '4' },
    { state: 'disabled', label: 'ผอ. ตรวจสอบการรายงานผล', number: '5' },
  ];

  protected receive: 'accept' | 'return' = 'accept';
  protected stage = 0;
  protected readonly kinds = [
    'ยื่นคำขอเพื่อไต่สวนเป็นครั้งแรก',
    'ยื่นคำขอเพื่อเปิดทบทวนต่ออายุ',
    'ยื่นคำขอเพื่อเปิดทบทวนการเรียกเก็บอากร กับผู้ส่งออกรายใหม่',
    'ยื่นคำขอคืนอากร',
    'ยื่นคำขอเพื่อยุติการใช้มาตรการ',
    'ยืนคำขอเพื่อเปิดทบทวนอัตราอากร/ความเสียหาย',
  ];
  protected picked = new Set<string>();
  protected choice = '';
  protected paper: 'done' | 'missed' | '' = '';
  protected feeNotice: 'pay' | 'skip' = 'skip';
  protected outcome: 'report' | 'forward' = 'forward';
  protected attachment = '';

  private readonly officerLabels = [
    'ข้อมูลการยื่นคำขอ',
    'คต. รับแบบคำขอ',
    'คต. ลงรับเอกสารฉบับจริง',
    'คต. พิจารณาคำขอ',
    'ผปก. ส่งข้อมูลที่แก้ไขเพิ่มเติม',
    'คต. พิจารณาคำขอขยายเวลาในการส่งคำขอที่แก้ไขเพิ่มเติม',
    'คต. บันทึกผลการพิจารณาของคณะกรรมการฯ',
    'ผปก. บันทึกหลักฐานการชำระค่าธรรมเนียม',
    'คต. บันทึกผลการพิจารณาเปิดการไต่สวน',
    'คต. แจ้งประกาศเปิดการไต่สวน',
  ];

  private readonly directorSteps: StepperOneItem[] = [
    { state: 'success', label: 'รายละเอียดคำร้อง', number: '1' },
    { state: 'success', label: 'กลุ่ม บท. รับเรื่อง', number: '2' },
    { state: 'pending', label: 'ผอ. มอบหมาย', number: '3' },
    { state: 'disabled', label: 'หัวหน้ากลุ่มมอบหมาย', number: '4' },
    { state: 'disabled', label: 'ผอ. ตรวจสอบการรายงานผล', number: '5' },
  ];

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
  ) {}

  protected get director(): boolean {
    return this.route.snapshot.data['role'] === 'director';
  }

  protected get head(): boolean {
    return this.route.snapshot.data['role'] === 'head';
  }

  protected get officer(): boolean {
    return this.route.snapshot.data['role'] === 'officer';
  }

  protected get roleName(): string {
    if (this.officer) return this.officerLabels[this.officerCurrent - 1];
    if (this.head) return 'หัวหน้ากลุ่มมอบหมาย';
    if (this.director) return 'ผอ. มอบหมาย';
    return 'กลุ่มบท. ลงรับ';
  }

  protected get steps(): StepperOneItem[] {
    if (this.officer) return this.officerSteps;
    if (this.head) return this.headSteps;
    return this.director ? this.directorSteps : this.intakeSteps;
  }

  protected get stepIndex(): number {
    if (this.officer) return this.officerCurrent;
    if (this.head) return 4;
    return this.director ? 3 : 2;
  }

  private get officerCurrent(): number {
    const at = [2, 3, 4, 5, 6, 6, 7, 8, 9, 10];
    return at[this.stage] ?? 2;
  }

  private get officerSteps(): StepperOneItem[] {
    const current = this.officerCurrent;
    return this.officerLabels.map((label, index) => {
      const number = index + 1;
      const state = number < current ? 'success' : number === current ? 'pending' : 'disabled';
      return { state, label, number: String(number) };
    });
  }

  protected openMenu(label: string): void {
    if (label === 'หน้าหลัก') void this.router.navigate([this.home]);
  }

  protected back(): void {
    void this.router.navigate([this.home]);
  }

  protected pickFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.attachment = input.files?.[0]?.name ?? '';
  }

  protected toggleKind(kind: string): void {
    if (this.picked.has(kind)) this.picked.delete(kind);
    else this.picked.add(kind);
    this.picked = new Set(this.picked);
  }

  protected nextStage(): void {
    if (this.stage < 9) {
      this.stage += 1;
      this.choice = '';
      return;
    }
    this.back();
  }

  private get home(): string {
    if (this.officer) return '/officer';
    if (this.head) return '/head';
    return this.director ? '/director' : '/staff';
  }
}
