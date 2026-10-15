import { ChangeDetectorRef, Component } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DftButton } from '../../button/button';
import { SideNav } from '../../menu-bar/side-nav';
import { StatusTag, StatusTone } from '../../status-tag/status-tag';
import { TopHeader } from '../../top-header/top-header';
import { findListedCase, stepLabel } from './request-cases';

@Component({
  selector: 'app-case-page',
  imports: [TopHeader, SideNav, RouterLink, DftButton, StatusTag],
  templateUrl: './case-page.html',
  styleUrl: './case-page.css',
})
export class CasePage {
  protected readonly title: string;
  protected readonly code: string;
  protected readonly showcase: boolean;
  protected readonly statusNote: string;
  protected readonly stepIndex: number;
  protected readonly steps: { label: string; number: string }[];
  protected readonly facts: { label: string; value: string }[];
  protected readonly files: string[];
  protected readonly filedForms: {
    code: string;
    label: string;
    title: string;
    route: string;
    meta: string;
    status: string;
    tone: StatusTone;
    topic: string;
    facts: { label: string; value: string }[];
    reason: string;
  }[] = [
    {
      code: 'ปร. 3',
      label: 'แบบ ปร. 3',
      title: 'ขอทบทวนการใช้อากรตอบโต้ต่อไป',
      route: '/requests/por-3',
      meta: 'ยื่นเมื่อ 6 ก.พ. 2569',
      status: 'อยู่ระหว่างตรวจสอบ',
      tone: 'info',
      topic: 'การเรียกเก็บอากรตอบโต้การทุ่มตลาด (ใช้ต่อไป)',
      facts: [
        { label: 'ประเภทที่อ้างอิง', value: 'ผลการพิจารณาทบทวนความจำเป็นในการใช้มาตรการ พ.ศ. 2564' },
        { label: 'สถานะผู้ยื่น', value: 'เป็นผู้ยื่นคำขอเดิม' },
        { label: 'ลักษณะการยื่น', value: 'ในนามตนเอง' },
        { label: 'ผู้ลงนาม', value: 'นายประกิจ กาญจนากร และนายภาสกร สิริกานต์โชติ' },
        { label: 'วันที่ลงนาม', value: '6 กุมภาพันธ์ 2569' },
      ],
      reason:
        'อุตสาหกรรมเหล็กแผ่นรีดร้อนเป็นอุตสาหกรรมต้นน้ำสำคัญของประเทศ มีส่วนแบ่งการนำเข้าสูงถึงร้อยละ 30 หากยุติมาตรการตอบโต้การทุ่มตลาดที่มีอยู่ จะกระทบผู้ผลิตในประเทศ ทำให้เกิดความเสียหายต่อเนื่องในวงกว้าง จึงขอให้ทบทวนการเรียกเก็บอากรตอบโต้ต่อไป โดยไม่เพิ่มเติม',
    },
    {
      code: 'ปร. 4',
      label: 'แบบ ปร. 4',
      title: 'ผู้ส่งออกหรือผู้ผลิตรายใหม่ขอทบทวนอากร',
      route: '/requests/por-4',
      meta: 'ยื่นเมื่อ 6 ก.พ. 2569 · ข้อมูลค้างส่ง',
      status: 'รอเอกสารเพิ่มเติม',
      tone: 'warning',
      topic: 'การทบทวนอากรสำหรับผู้ส่งออกหรือผู้ผลิตรายใหม่',
      facts: [
        { label: 'ประเภทที่อ้างอิง', value: 'มาตรการตอบโต้การทุ่มตลาดที่ใช้บังคับอยู่' },
        { label: 'สถานะผู้ยื่น', value: 'ผู้ส่งออกรายใหม่' },
        { label: 'ลักษณะการยื่น', value: 'ในนามตนเอง' },
        { label: 'ผู้ลงนาม', value: 'นายประกิจ กาญจนากร และนายภาสกร สิริกานต์โชติ' },
        { label: 'วันที่ลงนาม', value: '6 กุมภาพันธ์ 2569' },
      ],
      reason: 'ยังมีเอกสารประกอบที่ต้องแนบเพิ่มเติม จึงยังไม่สามารถตรวจรายการให้ครบได้',
    },
  ];
  protected readonly countries = ['ญี่ปุ่น', 'แอฟริกาใต้', 'รัสเซีย', 'คาซัคสถาน', 'อินเดีย', 'จีน', 'เกาหลีใต้', 'ไต้หวัน', 'ยูเครน', 'บราซิล', 'ตุรกี', 'มาเลเซีย', 'เวียดนาม', 'ออสเตรเลีย'];
  protected readonly history: { title: string; detail: string; when: string; docs: string[] }[];
  protected readonly reviewStats: { value: string; label: string; tone: StatusTone }[] = [
    { value: '6', label: 'ผ่านการตรวจสอบ', tone: 'success' },
    { value: '1', label: 'กำลังตรวจสอบ', tone: 'neutral' },
    { value: '1', label: 'ต้องแก้ไข', tone: 'danger' },
  ];
  protected readonly reviewItems = ['ความครบถ้วนของแบบฟอร์ม', 'หนังสือรับรองบริษัท', 'เอกสารประกอบคำขอ'];
  protected readonly applicants = [
    {
      name: 'บริษัท สหวิริยาสตีลอินดัสตรี จำกัด (มหาชน)',
      address: '28/1 อาคารประภาวิทย์ ชั้น 2-3 ถนนสุรศักดิ์ แขวงสีลม เขตบางรัก กรุงเทพฯ',
      phone: '02-238-3063',
      agent: 'นายประกิจ กาญจนากร',
    },
    {
      name: 'บริษัท จี สตีล จำกัด (มหาชน)',
      address: '88 อาคารเวอร์โซ่ ชั้น 18 ถนนสาทร แขวงสีลม เขตบางรัก กรุงเทพฯ 10500',
      phone: '02-634-2222',
      agent: 'นายภาสกร สิริกานต์โชติ',
    },
  ];
  protected readonly refDocs = [
    {
      group: 'ปร. 3',
      files: [
        'แบบ ปร. 3 ขอทบทวนการใช้อากรตอบโต้ต่อไป',
        'หนังสือรับรองบริษัท',
        'งบการเงินที่ผู้สอบบัญชีรับรอง',
        'หนังสือมอบอำนาจ',
        'รายการและปริมาณสินค้าที่ผลิตและ/หรือจำหน่าย',
      ],
    },
    {
      group: 'ปร. 4',
      files: ['แบบ ปร. 4 ผู้ส่งออกหรือผู้ผลิตรายใหม่ขอทบทวนอากร', 'หนังสือคำร้องเพิ่มเติม', 'เอกสารประกอบการยื่น'],
    },
  ];
  protected viewStep = 1;
  protected openFormIndex: number | null = null;
  protected countriesOpen = false;

  constructor(
    private readonly router: Router,
    private readonly view: ChangeDetectorRef,
    route: ActivatedRoute,
  ) {
    const code = route.snapshot.paramMap.get('code') ?? '';
    const item = findListedCase(code);
    this.code = item?.code ?? code;
    this.showcase = this.code === 'AD1039';
    this.title = this.showcase
      ? `${this.code} เหล็กแผ่นรีดร้อนชนิดเป็นม้วนและไม่เป็นม้วน`
      : item
        ? `${item.code} ${item.goods}`
        : code;
    this.statusNote = item ? `${item.status} · ${item.kind}` : 'ไม่พบคำขอ';
    const current = item?.steps.findIndex((step) => step.state === 'current') ?? 0;
    this.stepIndex = current + 1;
    this.viewStep = this.stepIndex;
    this.steps = (item?.steps ?? []).map((step, index) => ({
      label: stepLabel(step.name),
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

  protected get currentLabel(): string {
    const step = this.steps[this.stepIndex - 1];
    return step ? step.label : '';
  }

  protected get viewLabel(): string {
    const step = this.steps[this.viewStep - 1];
    return step ? step.label : '';
  }

  protected get refCount(): number {
    return this.refDocs.reduce((sum, group) => sum + group.files.length, 0);
  }

  protected get stageDone(): boolean {
    return this.viewStep < this.stepIndex;
  }

  protected get stageStatus(): string {
    if (this.stageDone && this.viewLabel === 'ยื่นคำขอ') return 'ยื่นคำขอสำเร็จ';
    return this.stageDone ? 'เสร็จสิ้น' : 'กำลังดำเนินการ';
  }

  protected shownCountries(): string[] {
    return this.countriesOpen ? this.countries : this.countries.slice(0, 5);
  }

  protected openStep(index: number): void {
    if (index > this.stepIndex) return;
    this.viewStep = index;
    this.view.detectChanges();
  }

  protected showAllCountries(): void {
    this.countriesOpen = true;
    this.view.detectChanges();
  }

  protected toggleForm(index: number): void {
    this.openFormIndex = this.openFormIndex === index ? null : index;
    this.view.detectChanges();
  }

  protected openForm(url: string): void {
    void this.router.navigateByUrl(url);
  }
}
