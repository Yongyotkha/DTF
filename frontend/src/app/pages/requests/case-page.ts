import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { SideNav } from '../../menu-bar/side-nav';
import { StepperOne, StepperOneItem } from '../../stepper-1/stepper-1';
import { TopHeader } from '../../top-header/top-header';

@Component({
  selector: 'app-case-page',
  imports: [TopHeader, SideNav, StepperOne, RouterLink],
  templateUrl: './case-page.html',
  styleUrl: './case-page.css',
})
export class CasePage {
  protected readonly sections = ['รายละเอียด', 'ผลการตรวจสอบ', 'การไต่สวน', 'ผู้มีส่วนได้เสีย', 'ประวัติ'];
  protected readonly steps: StepperOneItem[] = [
    { state: 'success', label: 'ยื่นคำขอ', number: '1' },
    { state: 'pending', label: 'ตรวจสอบข้อมูล', number: '2' },
    { state: 'disabled', label: 'เปิดการไต่สวน', number: '3' },
    { state: 'disabled', label: 'ผลการไต่สวนชั้นต้น', number: '4' },
    { state: 'disabled', label: 'ยื่นรับฟังความเห็น', number: '5' },
    { state: 'disabled', label: 'ร่างผลการไต่สวน', number: '6' },
    { state: 'disabled', label: 'ประกาศผลชั้นที่สุด', number: '7' },
    { state: 'disabled', label: 'text', number: '8' },
    { state: 'disabled', label: 'text', number: '9' },
    { state: 'disabled', label: 'text', number: '10' },
  ];
  protected readonly facts = [
    { label: 'ประเภทมาตรการ', value: 'AD (ตอบโต้การทุ่มตลาด)' },
    { label: 'Case ID', value: 'AD12005' },
    { label: 'ชื่อสินค้า', value: 'AD (ตอบโต้การทุ่มตลาด)' },
    { label: 'ประเภท', value: 'AD12005' },
    { label: 'พิกัดศุลกากร', value: '21452.12.0.000' },
  ];
  protected readonly files = ['เอกสารการยื่นข้อความ  A1', 'เอกสารการยื่นข้อความ  A2', 'เอกสารการยื่นข้อความ  A3'];
  protected readonly reviews = [
    { name: 'เอกสารการยื่นข้อความ  A1', passed: true },
    { name: 'เอกสารการยื่นข้อความ  A2', passed: true },
    { name: 'เอกสารการยื่นข้อความ  A4', passed: false },
    { name: 'เอกสารการยื่นข้อความ  A4', passed: false },
  ];
  protected readonly history = [
    { title: 'ยื่นคำขอ', detail: 'ผปก. ยื่นคำขอให้เจ้าหน้าที่ตรวจสอบ', when: 'วันที่ 22/09/2569 10:30', docs: [] as string[] },
    {
      title: 'ตรวจสอบพบข้อมูลผิดพลาด',
      detail: 'เรียนแจ้งว่า คำขอหมายเลข REQ-20240115-0001 เกิดข้อผิดพลาด',
      when: 'วันที่ 22/09/2569 10:30',
      docs: ['เอกสารการ A4', 'เอกสารการ  A2'],
    },
    { title: 'ยื่นคำขอ', detail: 'ผปก. ยื่นคำขอให้เจ้าหน้าที่ตรวจสอบ', when: 'วันที่ 22/09/2569 10:30', docs: [] as string[] },
  ];
  protected section = 'รายละเอียด';
  protected openHistory: number | null = null;

  constructor(private readonly router: Router) {}

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
