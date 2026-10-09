import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SideNav } from '../../menu-bar/side-nav';
import { TopHeader } from '../../top-header/top-header';

type DraftDoc = {
  name: string;
  state: 'pass' | 'wait' | 'fail';
};

@Component({
  selector: 'app-draft-page',
  imports: [TopHeader, SideNav, RouterLink],
  templateUrl: './draft-page.html',
  styleUrl: './draft-page.css',
})
export class DraftPage {
  protected readonly docs: DraftDoc[] = [
    { name: 'เอกสารการยื่นข้อความ  A1', state: 'pass' },
    { name: 'เอกสารการยื่นข้อความ  A2', state: 'pass' },
    { name: 'เอกสารการยื่นข้อความ  A3', state: 'wait' },
    { name: 'เอกสารการยื่นข้อความ  A4', state: 'fail' },
    { name: 'เอกสารการยื่นข้อความ  A4', state: 'fail' },
  ];
  protected readonly findings = [
    { title: 'ชื่อผู้ยื่นคำขอตรงกับหนังสือรับรอง', detail: 'รายละเอียด', tone: 'ok', page: 'หน้า 1' },
    { title: 'ลายมือผู้มีอำนาจลงนามไม่ถูกต้อง', detail: 'รายละเอียดข้อมูล', tone: 'issue', page: 'หน้า 15' },
    { title: 'วันที่ในเอกสาร', detail: 'รายละเอียดข้อมูล', tone: 'issue', page: 'หน้า 110' },
    { title: 'ข้อมูลผู้มอบหมายแทน', detail: 'รายละเอียดข้อมูล', tone: 'issue', page: 'หน้า 125' },
  ];
  protected selected = 4;

  protected pick(index: number): void {
    this.selected = index;
  }
}
