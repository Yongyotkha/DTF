import { ChangeDetectorRef, Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DftButton } from '../../button/button';
import { DftModal } from '../../modal/modal';
import { SideNav } from '../../menu-bar/side-nav';
import { StatusTag, StatusTone } from '../../status-tag/status-tag';
import { TopHeader } from '../../top-header/top-header';
import { formOf } from './form-catalog';
import { readFilingIntent, saveFilingIntent } from './filing-intent';
import { findListedCase, stepLabel } from './request-cases';

@Component({
  selector: 'app-case-page',
  imports: [TopHeader, SideNav, RouterLink, DftButton, StatusTag, DftModal],
  templateUrl: './case-page.html',
  styleUrl: './case-page.css',
})
export class CasePage implements OnDestroy {
  protected readonly title: string;
  protected readonly code: string;
  protected readonly requestRef: string;
  protected readonly showcase: boolean;
  protected readonly reviewPassed: boolean;
  protected readonly reviewPending: boolean;
  protected readonly supplement: boolean;
  protected readonly fixesOnly: boolean;
  protected readonly statusNote: string;
  protected stepIndex = 1;
  protected readonly steps: { label: string; number: string }[];
  protected readonly facts: { label: string; value: string }[];
  protected readonly files: string[];
  protected readonly filingRound: number;
  protected readonly filedOn: string;
  protected readonly revisePath: string;
  protected reviseQuery: { revise: string; case: string } = { revise: '1', case: '' };
  private readonly selectedCodes: string[];
  private readonly selectedMeasure: string;
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
  protected readonly countries = ['ญี่ปุ่น', 'แอฟริกาใต้', 'รัสเซีย'];
  protected readonly history: { title: string; detail: string; when: string; docs: string[] }[];
  protected readonly reviewStats: { value: string; label: string; tone: StatusTone }[] = [
    { value: '6', label: 'ผ่านการตรวจสอบ', tone: 'success' },
    { value: '1', label: 'กำลังตรวจสอบ', tone: 'neutral' },
    { value: '1', label: 'ต้องแก้ไข', tone: 'danger' },
  ];
  protected readonly reviewItems = ['ความครบถ้วนของแบบฟอร์ม', 'หนังสือรับรองบริษัท', 'เอกสารประกอบคำขอ'];
  protected readonly supplementDue = '20 ก.พ. 2569';
  protected readonly supplementFacts: { label: string; value: string; due?: boolean }[] = [
    { label: 'เจ้าหน้าที่แจ้งเมื่อ', value: '10 ก.พ. 2569' },
    { label: 'กำหนดส่งข้อมูล', value: '20 ก.พ. 2569', due: true },
  ];
  protected readonly supplementTasks: {
    title: string;
    kind: string;
    ask: string;
    reason: string;
    steps: string[];
    file: string;
    accept: string;
  }[] = [
    {
      title: 'งบการเงินที่ผู้สอบบัญชีรับรอง',
      kind: 'ไฟล์เพิ่มเติม',
      ask: 'ขอให้แนบเอกสาร',
      reason: 'ต้องการไฟล์ประกอบเพิ่ม เพื่อตรวจตัวเลขปริมาณที่แจ้งไว้ ไฟล์นี้ไม่ได้อยู่ในแบบฟอร์ม',
      steps: ['แนบงบการเงินฉบับที่ผู้สอบบัญชีรับรอง', 'ให้ครอบคลุมช่วงเวลาเดียวกับปริมาณที่แจ้ง'],
      file: 'งบการเงิน',
      accept: 'PDF',
    },
    {
      title: 'เอกสารชี้แจงปริมาณการผลิต',
      kind: 'ไฟล์เพิ่มเติม',
      ask: 'ขอให้แนบเอกสาร',
      reason: 'ต้องการไฟล์ชี้แจงแยกต่างหาก ว่าตัวเลขปริมาณมาจากแหล่งใด',
      steps: ['แนบเอกสารชี้แจงตัวเลขปริมาณการผลิต', 'ระบุช่วงเวลาให้ตรงกับงบการเงิน'],
      file: 'เอกสารชี้แจง',
      accept: 'PDF หรือ Excel',
    },
    {
      title: 'ประกาศเปิดทบทวน',
      kind: 'ไฟล์เพิ่มเติม',
      ask: 'ขอให้แนบเอกสาร',
      reason: 'ยังไม่พบไฟล์ประกาศที่ใช้เป็นฐานของคำขอนี้',
      steps: ['แนบประกาศเปิดทบทวนฉบับที่ใช้บังคับ'],
      file: 'ประกาศเปิดทบทวน',
      accept: 'PDF',
    },
  ];
  protected readonly reviewFixCount = 3;
  protected readonly reviewFiledOn = '6/02/2569';
  protected reviewRef = '';
  protected reviewLeft = 10;
  protected readonly reviewPendingFiledOn = '15/05/2562';
  protected readonly reviewPendingUntil = '15/09/2562';
  protected readonly fixItems = [
    {
      place: 'ส่วนที่ 2 รายละเอียดสินค้า',
      title: 'เอกสารเปรียบเทียบสินค้ายังไม่ครบ',
      detail: 'รายการเอกสารที่ใช้เปรียบเทียบสินค้ายังไม่ครบตามที่แบบเรียก ให้แนบไฟล์เพิ่มในรอบถัดไป',
    },
    {
      place: 'ส่วนที่ 5 ปริมาณและมูลค่า',
      title: 'ข้อมูลปริมาณยังไม่สอดคล้องกับเอกสารประกอบ',
      detail: 'ตัวเลขปริมาณในแบบยังไม่ตรงกับไฟล์ที่แนบไว้ ให้ปรับข้อมูลในแบบให้ตรงกับเอกสาร',
    },
    {
      place: 'ส่วนที่ 1 เอกสารมอบอำนาจ',
      title: 'หนังสือมอบอำนาจยังแนบไม่ครบ',
      detail: 'กรณียื่นแทนผู้ผลิต ต้องแนบหนังสือมอบอำนาจให้ครบก่อนยื่นรอบถัดไป',
    },
  ];
  protected readonly reviewAmendUntil = '6/06/2569';
  protected readonly reviewAmendMonths = 4;
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
  fixesOpen = false;
  openFixTitle: string | null = null;
  supplementOpen: Record<string, boolean> = {};
  consultOpen = false;
  consultTopic = 'ขอปรึกษาการแก้ไขคำขอ';
  consultDetail = 'รายการที่ยังไม่ผ่านมีหลักฐานราคา ตัวชี้วัดความเสียหาย และรายชื่อผู้ผลิตในประเทศ ต้องการให้นัดหมายเพื่อชี้แจงก่อนส่งแบบคำร้องทางการ';
  consultChannel: 'phone' | 'online' | 'onsite' | '' = '';
  consultSent = false;
  sentConsult: { topic: string; detail: string; channel: 'phone' | 'online' | 'onsite'; filedOn: string } | null = null;
  filedOpen = false;
  officialReview = false;
  private reviewTimer = 0;

  constructor(
    private readonly router: Router,
    private readonly view: ChangeDetectorRef,
    route: ActivatedRoute,
  ) {
    const code = route.snapshot.paramMap.get('code') ?? '';
    this.fixesOnly = route.snapshot.data['view'] === 'fixes';
    const item = findListedCase(code);
    this.code = item?.code ?? code;
    this.requestRef = item?.ref || '—';
    this.reviewRef = this.requestRef;
    this.showcase = this.code === 'AD1039';
    this.reviewPassed = this.code === 'AD1024';
    this.reviewPending = this.code === 'AD1054';
    this.supplement = this.code === 'AD1005';
    this.title = this.showcase
      ? `${this.requestRef} เหล็กแผ่นรีดร้อนชนิดเป็นม้วนและไม่เป็นม้วน`
      : item
        ? `${item.ref} ${item.goods}`
        : this.requestRef;
    this.statusNote = item ? `${item.status} · ${item.kind}` : 'ไม่พบคำขอ';
    this.filingRound = item?.round ?? 1;
    this.filedOn = item?.created || '—';
    const picked = selectedFiling(item?.kind, this.filedForms.map((form) => form.code));
    this.selectedMeasure = picked.measure;
    this.selectedCodes = picked.codes;
    this.revisePath = picked.route;
    this.reviseQuery = { revise: '1', case: this.code };
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
          { label: 'เลขคำขอ', value: item.ref },
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
    if (this.reviewPending && !this.fixesOnly) this.startReviewClock();
  }

  ngOnDestroy(): void {
    window.clearInterval(this.reviewTimer);
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

  protected get officialLocked(): boolean {
    return this.currentLabel === 'ตรวจสอบข้อมูล';
  }

  protected get reviewWaiting(): boolean {
    return this.reviewPending && this.reviewLeft > 0;
  }

  protected get reviewClock(): string {
    return `0:${this.reviewLeft.toString().padStart(2, '0')}`;
  }

  protected get resultFiledOn(): string {
    return this.reviewPending ? this.reviewPendingFiledOn : this.reviewFiledOn;
  }

  protected get resultAmendUntil(): string {
    return this.reviewPending ? this.reviewPendingUntil : this.reviewAmendUntil;
  }

  private startReviewClock(): void {
    const until = Date.now() + 10_000;
    const tick = () => {
      this.reviewLeft = Math.max(0, Math.ceil((until - Date.now()) / 1000));
      if (this.reviewLeft <= 0) window.clearInterval(this.reviewTimer);
      this.view.detectChanges();
    };
    this.reviewTimer = window.setInterval(tick, 250);
  }

  shownFixes(): { place: string; title: string; detail: string }[] {
    if (this.reviewPending || this.fixesOpen) return this.fixItems;
    return this.fixItems.slice(0, 2);
  }

  showMoreFixes(): void {
    void this.router.navigate(['/requests', this.code, 'fixes']);
  }

  toggleFix(title: string): void {
    this.openFixTitle = this.openFixTitle === title ? null : title;
    this.view.detectChanges();
  }

  toggleSupplement(title: string): void {
    this.supplementOpen = { ...this.supplementOpen, [title]: !this.supplementOpen[title] };
    this.view.detectChanges();
  }

  protected openStep(index: number): void {
    if (index > this.stepIndex) return;
    this.viewStep = index;
    this.view.detectChanges();
  }

  protected openForm(url: string): void {
    void this.router.navigateByUrl(url);
  }

  protected openSupplement(): void {
    document.getElementById('supplement-tasks')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  submitOfficial(): void {
    this.filedOpen = true;
    this.view.detectChanges();
  }

  finishOfficial(): void {
    this.filedOpen = false;
    if (this.stepIndex < 2 && this.steps.length >= 2) {
      this.stepIndex = 2;
      this.viewStep = 2;
      this.officialReview = true;
    }
    this.view.detectChanges();
  }

  openConsult(): void {
    if (this.reviewPending) return;
    this.consultOpen = true;
    this.view.detectChanges();
  }

  closeConsult(): void {
    this.consultOpen = false;
    this.view.detectChanges();
  }

  pickConsultChannel(channel: 'phone' | 'online' | 'onsite'): void {
    this.consultChannel = channel;
    this.view.detectChanges();
  }

  get consultReady(): boolean {
    return !!this.consultTopic.trim() && !!this.consultDetail.trim() && !!this.consultChannel;
  }

  sendConsult(): void {
    if (!this.consultReady || !this.consultChannel) return;
    const filed = new Date();
    const filedOn = `${filed.getDate().toString().padStart(2, '0')}/${(filed.getMonth() + 1).toString().padStart(2, '0')}/${filed.getFullYear() + 543}`;
    this.sentConsult = {
      topic: this.consultTopic.trim(),
      detail: this.consultDetail.trim(),
      channel: this.consultChannel,
      filedOn,
    };
    this.consultOpen = false;
    this.consultSent = true;
    this.view.detectChanges();
  }

  closeConsultSent(): void {
    this.consultSent = false;
    this.view.detectChanges();
  }

  cancelConsult(): void {
    this.sentConsult = null;
    this.consultSent = false;
    this.view.detectChanges();
  }

  protected get consultChannelLabel(): string {
    if (this.sentConsult?.channel === 'phone') return 'โทรศัพท์';
    if (this.sentConsult?.channel === 'online') return 'Online';
    if (this.sentConsult?.channel === 'onsite') return 'OnSite';
    return '—';
  }

  reviseFiling(): void {
    saveFilingIntent({ measure: this.selectedMeasure, codes: this.selectedCodes });
    void this.router.navigate([this.revisePath], { queryParams: this.reviseQuery });
  }
}

function selectedFiling(kind: string | undefined, filed: string[]): { measure: string; codes: string[]; route: string } {
  const intent = readFilingIntent();
  const fromKind = formCodeFromKind(kind);
  const codes = uniqueCodes(fromKind ? [fromKind] : [...(intent?.codes ?? []), ...filed]);
  const first = codes.map((code) => formOf(code)).find((form) => form?.route);
  return {
    measure: intent?.measure || 'มาตราการ AD',
    codes: first ? codes.filter((code) => !!formOf(code)?.route) : ['ปร. 1'],
    route: first?.route ?? '/requests/por-1',
  };
}

function formCodeFromKind(kind: string | undefined): string | null {
  const match = kind?.match(/ปร\.?\s*([0-9]+[กข]?)/);
  return match ? `ปร. ${match[1]}` : null;
}

function uniqueCodes(codes: (string | null | undefined)[]): string[] {
  return [...new Set(codes.filter((code): code is string => !!code))];
}
