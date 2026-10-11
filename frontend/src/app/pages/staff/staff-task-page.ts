import { NgTemplateOutlet } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DftButton } from '../../button/button';
import { SideNav } from '../../menu-bar/side-nav';
import { StepperOne, StepperOneItem } from '../../stepper-1/stepper-1';
import { TopHeader } from '../../top-header/top-header';

type TaskFile = { name: string; saved: string; title: string; kind: string; due: string };

function taskFile(name: string, title = '', saved = '22/09/2569', kind = '', due = ''): TaskFile {
  return { name, saved, title, kind, due };
}

@Component({
  selector: 'app-staff-task-page',
  imports: [TopHeader, SideNav, DftButton, StepperOne, NgTemplateOutlet],
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
  protected readonly stakeOptions = [
    'ผู้ผลิตภายในประเทศ',
    'กลุ่มอุตสาหกรรมและสมาคมที่เกี่ยวข้อง (ผู้ผลิตในประเทศ)',
    'กลุ่มอุตสาหกรรมและสมาคมที่เกี่ยวข้อง (ผู้นำเข้า/ผู้ใช้)',
    'กลุ่มอุตสาหกรรมและสมาคมที่เกี่ยวข้อง',
  ];
  protected lists: Record<string, TaskFile[]> = {
    assign: [],
    paper: [],
    notice: [taskFile('หนังสือแจ้งแก้ไข.pdf')],
    noticeAgain: [taskFile('หนังสือแจ้งแก้ไข.pdf')],
    seal: [taskFile('ตราประทับบริษัท.png', '', '24/09/2569')],
    cover: [],
    closedForm: [taskFile('ไฟล์คำขอฉบับปกปิด.pdf', 'แบบ ปร.1', '24/09/2569')],
    extra: [],
    openForm: [],
    extend: [],
    embassy: [taskFile('ไฟล์แจ้งสถานทูต.pdf', 'แจ้งสถานทูต')],
    feeProof: [taskFile('หลักฐานการชำระค่าธรรมเนียม.pdf', 'หลักฐานการชำระค่าธรรมเนียม')],
    inquiry: [
      taskFile('ไฟล์ 1.pdf', 'ผู้ผลิตภายในประเทศ'),
      taskFile('ไฟล์ 2.pdf', 'กลุ่มอุตสาหกรรมและสมาคมที่เกี่ยวข้อง (ผู้ผลิตในประเทศ)'),
      taskFile('ไฟล์ 3.pdf', 'กลุ่มอุตสาหกรรมและสมาคมที่เกี่ยวข้อง (ผู้นำเข้า/ผู้ใช้)'),
    ],
    gazette: [taskFile('ไฟล์.pdf', 'ประกาศกรมฯ เปิดไต่สวน/ทบทวน')],
    committee: [
      taskFile('ไฟล์ 1.pdf', 'ผู้ผลิตภายในประเทศ'),
      taskFile('ไฟล์ 2.pdf', 'กลุ่มอุตสาหกรรมและสมาคมที่เกี่ยวข้อง (ผู้ผลิตในประเทศ)'),
      taskFile('ไฟล์ 3.pdf', 'ผู้ผลิตภายในประเทศกลุ่มอุตสาหกรรมและสมาคมที่เกี่ยวข้อง (ผู้นำเข้า/'),
    ],
    survey: [
      taskFile('file name.png', '', '22/09/2569', 'ผู้ผลิตภายในประเทศ', '22/09/2569'),
      taskFile('file name.png', '', '22/09/2569', 'กลุ่มอุตสาหกรรมและสมาคมที่เกี่ยวข้อง', '22/09/2569'),
      taskFile('file name.png', '', '22/09/2569', 'กลุ่มอุตสาหกรรมและสมาคมที่เกี่ยวข้อง', '22/09/2569'),
    ],
    feeLetter: [taskFile('ไฟล์.pdf', 'หนังสือชำระค่าธรรมเนียม')],
  };

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

  private readonly previews = new Map<string, string>();

  protected isPdf(name: string): boolean {
    return name.toLowerCase().endsWith('.pdf');
  }

  protected preview(name: string, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    const url = this.previews.get(name);
    if (url) window.open(url, '_blank', 'noopener');
  }

  protected filesOf(key: string): TaskFile[] {
    return this.lists[key] ?? [];
  }

  protected addFiles(key: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    this.pushFiles(key, input.files);
    input.value = '';
  }

  protected dropFiles(key: string, event: DragEvent): void {
    event.preventDefault();
    this.pushFiles(key, event.dataTransfer?.files ?? null);
  }

  protected nameFile(key: string, index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.keepPreview(file);
    const name = file.name;
    this.lists = {
      ...this.lists,
      [key]: this.filesOf(key).map((row, item) => (item === index ? { ...row, name, saved: row.saved || '22/09/2569' } : row)),
    };
    input.value = '';
  }

  protected removeFile(key: string, index: number): void {
    this.lists = { ...this.lists, [key]: this.filesOf(key).filter((_, item) => item !== index) };
  }

  protected addBlank(key: string): void {
    this.lists = {
      ...this.lists,
      [key]: [...this.filesOf(key), taskFile('', '', '', this.stakeOptions[0], '22/09/2569')],
    };
  }

  private keepPreview(file: File): void {
    const current = this.previews.get(file.name);
    if (current) URL.revokeObjectURL(current);
    this.previews.set(file.name, URL.createObjectURL(file));
  }

  private pushFiles(key: string, list: FileList | null): void {
    if (!list?.length) return;
    const next = [...list].map((file) => {
      this.keepPreview(file);
      return taskFile(file.name);
    });
    this.lists = { ...this.lists, [key]: [...this.filesOf(key), ...next] };
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
