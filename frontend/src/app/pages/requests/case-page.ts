import { ChangeDetectorRef, Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Accounts } from '../../accounts';
import { DftButton } from '../../button/button';
import { InputField } from '../../input-field/input-field';
import { DftModal } from '../../modal/modal';
import { SideNav } from '../../menu-bar/side-nav';
import { StatusTag, StatusTone } from '../../status-tag/status-tag';
import { Tabs } from '../../tabs/tabs';
import { TopHeader } from '../../top-header/top-header';
import { formOf } from './form-catalog';
import { formCodeIn } from './case-form';
import { readFilingIntent, saveFilingIntent } from './filing-intent';
import { joinedCaseIds } from './interest-invite';
import { allows, isActingAgent, powersOnCase, powerLabel, ProxyPower } from './proxy-grant';
import { hearingStatus, readHearing, writeHearing } from './hearing-lane';
import { caseBrief, CaseParty, caseNumberLabel, documentsForStage, findListedCase, ListedCase, PartyAudience, partyDocuments, partyDocumentsForStage, stageResult, stepLabel } from './request-cases';

@Component({
  selector: 'app-case-page',
  imports: [TopHeader, SideNav, RouterLink, DftButton, StatusTag, DftModal, InputField, Tabs],
  templateUrl: './case-page.html',
  styleUrl: './case-page.css',
})
export class CasePage implements OnDestroy {
  protected get menuOpen(): string {
    return this.accounts.role === 'interest' ? 'กระบวนการไต่สวน' : 'คำขอ';
  }

  protected get menuActive(): string {
    return this.accounts.role === 'interest' ? 'Case ID' : 'รายการยื่นคำขอ';
  }

  protected actionNote = '';
  protected actionOpen = '';
  private actionState: Record<string, string> = {};

  protected get flowActions(): { id: string; label: string; hint: string }[] {
    if (this.accounts.role === 'interest' && this.interestLocked()) return [];
    const stage = this.stageNow();
    const rows = this.accounts.role === 'interest' ? this.interestActions(stage) : this.filerActions(stage);
    const powers = this.casePowers();
    if (!powers) return rows;
    return rows.filter((row) => allows(powers, row.id));
  }

  private filerActions(stage: string): { id: string; label: string; hint: string }[] {
    if (stage === 'closed' || stage === 'stopped') return [];
    const withdraw = { id: 'withdraw', label: 'ถอนคำขอ', hint: 'ผู้ยื่นถอนคำขอเองได้ก่อนเปิดไต่สวน หากเกิน 4 เดือนเจ้าหน้าที่จะตีคืนแล้วนับระยะใหม่' };
    if (stage === 'file') return [withdraw];
    if (stage === 'check') return [{ id: 'fee', label: 'บันทึกหลักฐานการชำระค่าธรรมเนียม', hint: 'เมื่อได้รับแจ้งให้ชำระค่าธรรมเนียมคำขอ ให้บันทึกหลักฐานในเคสนี้' }, withdraw];
    if (stage === 'open' || stage === 'question') {
      return [
        { id: 'qn', label: 'ส่งคำตอบแบบสอบถาม', hint: 'ส่งคำตอบแบบสอบถามของเคสนี้' },
        { id: 'extend', label: 'ขอขยายเวลา', hint: 'ขอขยายเวลาได้ก่อนวันครบกำหนด 7 วัน' },
        { id: 'exchange', label: 'รับ–ส่งข้อมูลอื่น', hint: 'ส่งเอกสารที่ไม่อยู่ในแบบคำขอหรือแบบสอบถาม' },
      ];
    }
    if (stage === 'prelim') {
      return [
        { id: 'facts', label: 'ขอทราบรายละเอียดข้อเท็จจริง', hint: 'ขอทราบรายละเอียดข้อเท็จจริงแล้วส่งความเห็นกลับ' },
        { id: 'hearing', label: 'ขอจัด hearing', hint: 'ส่งคำขอให้จัด hearing ภายใน 30 วันหลังประกาศผลขั้นต้น' },
        { id: 'exchange', label: 'รับ–ส่งข้อมูลอื่น', hint: 'ส่งเอกสารที่ไม่อยู่ในแบบคำขอหรือแบบสอบถาม' },
      ];
    }
    return [
      { id: 'object', label: 'ส่งความเห็นและข้อโต้แย้ง', hint: 'ส่งความเห็นและข้อโต้แย้งต่อร่างผลชั้นที่สุด' },
      { id: 'exchange', label: 'รับ–ส่งข้อมูลอื่น', hint: 'ส่งเอกสารที่ไม่อยู่ในแบบคำขอหรือแบบสอบถาม' },
    ];
  }

  private interestActions(stage: string): { id: string; label: string; hint: string }[] {
    if (stage === 'file' || stage === 'check' || stage === 'closed' || stage === 'stopped') return [];
    if (stage === 'open' || stage === 'question') {
      return [
        { id: 'qn', label: 'ส่งคำตอบแบบสอบถาม', hint: 'ส่งคำตอบและแบบสอบถามของผู้มีส่วนได้เสีย' },
        { id: 'extend', label: 'ขอขยายเวลา', hint: 'ขอขยายเวลาได้ก่อนวันครบกำหนด 7 วัน' },
        { id: 'opinion', label: 'ส่งความเห็น', hint: 'ส่งความเห็นต่อข้อมูลที่เปิดเผย' },
      ];
    }
    if (stage === 'prelim') {
      return [
        { id: 'hearing', label: 'ขอเข้า hearing', hint: 'ขอจัดหรือขอเข้าร่วมภายใน 30 วันนับจากวันประกาศ' },
        { id: 'join', label: 'ยืนยันเข้าร่วมรับฟังความคิดเห็น', hint: 'ยืนยันการเข้าร่วมตามนัด' },
        { id: 'opinion', label: 'ส่งความเห็น', hint: 'ส่งความเห็นต่อข้อมูลที่เปิดเผย' },
      ];
    }
    return [{ id: 'draft', label: 'ส่งความเห็นต่อร่างผล', hint: 'ส่งความเห็นและข้อโต้แย้งต่อร่างผลชั้นที่สุด' }];
  }

  protected get agentNote(): string {
    if (this.interestLocked()) return 'บัญชีนี้ไม่ได้ลงทะเบียนในเคสนี้';
    const powers = this.casePowers();
    if (!powers) return '';
    if (!powers.length) return 'บัญชีนี้ไม่ได้รับมอบอำนาจในเคสนี้';
    return `อำนาจที่ได้รับ: ${powers.map((key) => powerLabel(key)).join(' · ')}`;
  }

  protected get canOpenForm(): boolean {
    if (this.interestLocked()) return false;
    return allows(this.casePowers(), 'form');
  }

  private interestLocked(): boolean {
    if (this.accounts.role !== 'interest') return false;
    const joined = joinedCaseIds(this.accounts.username);
    if (!joined) return false;
    return !joined.has(this.listed?.id ?? '') && !joined.has(this.listed?.code ?? this.code) && !joined.has(this.routeKey);
  }

  private casePowers(): ProxyPower[] | null {
    return powersOnCase(this.accounts.username, this.listed?.id ?? '', this.listed?.code ?? this.code);
  }

  protected actionDone(id: string): string {
    return this.actionState[id] ?? '';
  }

  protected toggleAction(id: string): void {
    this.actionOpen = this.actionOpen === id ? '' : id;
    this.actionNote = '';
  }

  protected saveAction(id: string): void {
    const text = this.actionNote.trim();
    if (!text && id !== 'join') return;
    this.actionState = { ...this.actionState, [id]: text || 'ยืนยันแล้ว' };
    sessionStorage.setItem(this.actionKey, JSON.stringify(this.actionState));
    if (id === 'hearing') {
      writeHearing({ caseCode: this.code, by: this.accounts.displayName, ask: text, step: 'ask', when: '', place: '', summary: '' });
    }
    this.actionNote = '';
    this.actionOpen = '';
  }

  protected hearingLine(): string {
    const lane = readHearing();
    if (!lane || lane.caseCode !== this.code) return '';
    const base = hearingStatus(lane.step);
    if (lane.step === 'booked' || lane.step === 'approved') return `${base} ${lane.when} ${lane.place}`.trim();
    if (lane.step === 'done') return `${base} ${lane.summary}`.trim();
    return base;
  }

  protected joinLink(file: string): string {
    return file.includes('หนังสือพิมพ์') ? `/join/${this.routeKey}` : '';
  }

  protected get thaiTrUrl(): string {
    const numbered = /^[A-Z]{2}\d{3,4}$/u.test(this.code);
    return this.listed && numbered && this.listed.status.includes('ประกาศ') ? `https://thaitr.dft.go.th/th/search/${this.code}` : '';
  }

  private get actionKey(): string {
    return `dft-case-acts:${this.routeKey}`;
  }

  private readActions(): Record<string, string> {
    try {
      const value = JSON.parse(sessionStorage.getItem(`dft-case-acts:${this.routeKey}`) || '{}') as Record<string, string>;
      return value && typeof value === 'object' ? value : {};
    } catch {
      return {};
    }
  }

  protected readonly title: string;
  protected readonly code: string;
  protected readonly routeKey: string;
  protected readonly requestRef: string;
  protected readonly goodsName: string;
  protected readonly measureLabel: string;
  protected readonly caseApplicant: string;
  protected readonly caseOrigins: string[];
  protected readonly caseNote: string;
  protected readonly caseKind: string;
  protected readonly listed: ListedCase | undefined;
  protected historyOpen: Record<string, boolean> = {};
  protected detailTab = 0;
  protected partyAudience: 'staff' | PartyAudience | 'none' = 'filer';
  protected partyOpen = false;
  protected filesOnly = false;
  protected manageOpen = false;
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
    private readonly accounts: Accounts,
    route: ActivatedRoute,
  ) {
    const code = route.snapshot.paramMap.get('code') ?? '';
    this.fixesOnly = route.snapshot.data['view'] === 'fixes';
    const item = findListedCase(code);
    this.routeKey = code;
    this.code = item?.code ?? code;
    this.requestRef = item?.ref || '—';
    this.goodsName = item?.goods || 'เหล็กแผ่นรีดร้อนชนิดเป็นม้วนและไม่เป็นม้วน';
    this.measureLabel = item?.measure || 'AD (ตอบโต้การทุ่มตลาด)';
    this.caseApplicant = item?.applicant || '';
    this.caseOrigins = item?.origins ?? [];
    this.caseNote = item?.note || '';
    this.caseKind = item?.kind || '';
    this.listed = item;
    this.reviewRef = this.requestRef;
    this.reviewPassed = this.code === 'AD1024';
    this.reviewPending = this.code === 'AD1054';
    this.supplement = this.code === 'AD1005';
    this.title = item ? `${item.ref} ${item.goods}` : this.requestRef;
    this.statusNote = item ? `${item.status} · ${item.kind}` : 'ไม่พบคำขอ';
    this.filingRound = item?.round ?? 1;
    this.filedOn = item?.created || '—';
    const picked = selectedFiling(item?.kind, this.filedForms.map((form) => form.code));
    this.selectedMeasure = picked.measure;
    this.selectedCodes = picked.codes;
    this.revisePath = picked.route;
    this.reviseQuery = { revise: '1', case: this.routeKey };
    const current = item?.steps.findIndex((step) => step.state === 'current') ?? 0;
    this.stepIndex = current + 1;
    this.viewStep = this.stepIndex;
    this.steps = (item?.steps ?? []).map((step, index) => ({
      label: stepLabel(step.name),
      number: String(index + 1),
    }));
    this.actionState = this.readActions();
    this.facts = item
      ? [
          { label: 'ประเภทมาตรการ', value: item.measure },
          { label: 'เลขคำขอ', value: item.ref },
          { label: 'ชื่อสินค้า', value: item.goods },
          { label: 'ประเภทการยื่น', value: item.kind },
          { label: 'สถานะ', value: item.status },
        ]
      : [];
    this.partyAudience = this.readAudience(item);
    const audience = this.partyAudience;
    this.files = !item ? [] : audience === 'staff' ? item.documents : audience === 'none' ? [] : partyDocuments(item, audience);
    this.history = (item?.steps ?? [])
      .filter((step) => step.state !== 'todo')
      .map((step) => {
        const label = stepLabel(step.name);
        const docs = !item || audience === 'none'
          ? []
          : audience === 'staff'
            ? documentsForStage(item, label)
            : partyDocumentsForStage(item, label, audience);
        return {
          title: label,
          detail: item ? stageResult(item, label, step.state === 'done') : '',
          when: step.date ? `วันที่ ${step.date}` : '',
          docs,
        };
      });
    const currentTitle = item ? stepLabel(item.steps.find((step) => step.state === 'current')?.name ?? '') : '';
    this.historyOpen = currentTitle ? { [currentTitle]: true } : {};
    if (this.reviewPending && !this.fixesOnly) this.startReviewClock();
  }

  ngOnDestroy(): void {
    window.clearInterval(this.reviewTimer);
  }

  protected get nextStep(): string {
    const interest = this.accounts.role === 'interest';
    switch (this.stageNow()) {
      case 'file':
        return interest ? '' : 'ขั้นถัดไปคือเจ้าหน้าที่ลงรับและตรวจสอบคำขอ';
      case 'check':
        return interest ? '' : 'ขั้นถัดไปคือบันทึกหลักฐานค่าธรรมเนียมเมื่อได้รับแจ้ง แล้วรอเปิดไต่สวน';
      case 'open':
        return 'ขั้นถัดไปคือส่งคำตอบแบบสอบถาม';
      case 'question':
        return 'ขั้นถัดไปคือส่งคำตอบแบบสอบถาม แล้วรอผลขั้นต้น';
      case 'prelim': {
        const lane = readHearing();
        if (lane?.caseCode === this.code && (lane.step === 'done' || lane.step === 'skip')) return 'สรุป hearing ส่งกลับเข้าผลแล้ว';
        if (lane?.caseCode === this.code && lane.step === 'approved') return 'คณะกรรมการอนุมัติแล้ว รอเจ้าหน้าที่สรุปประเด็น';
        if (lane?.caseCode === this.code && lane.step === 'booked') return 'นัด hearing แล้ว รอคณะกรรมการอนุมัติ';
        if (lane?.caseCode === this.code && lane.step === 'ask') return 'ส่งคำขอ hearing แล้ว รอเจ้าหน้าที่พิจารณา';
        return 'ขั้นถัดไปคือขอทราบข้อเท็จจริงหรือขอจัด hearing ภายใน 30 วัน';
      }
      case 'draft':
        return 'ขั้นถัดไปคือส่งความเห็นต่อร่างผล';
      case 'stopped':
        return 'คดีนี้ไม่เดินต่อ';
      default:
        return 'ถึงผลที่แจ้งแล้ว';
    }
  }

  private stageNow(): 'file' | 'check' | 'open' | 'question' | 'prelim' | 'draft' | 'closed' | 'stopped' {
    const status = this.listed?.status ?? '';
    const current = this.currentLabel;
    if (status === 'ไม่เปิดการไต่สวน' || status === 'ยุติการไต่สวน') return 'stopped';
    if (status.includes('ประกาศ') || /ประกาศ/.test(current)) return 'closed';
    if (/ร่าง/.test(status) || /ร่าง/.test(current)) return 'draft';
    if (/ขั้นต้น|ชั้นต้น|รับฟัง/.test(status) || /ขั้นต้น|ชั้นต้น|รับฟัง/.test(current)) return 'prelim';
    if (/แบบสอบถาม/.test(status) || /แบบสอบถาม/.test(current)) return 'question';
    if (/เปิด/.test(status) || /เปิด/.test(current)) return 'open';
    if (/ตรวจสอบ/.test(status) || /ตรวจสอบ/.test(current)) return 'check';
    return 'file';
  }

  protected get currentLabel(): string {
    const step = this.steps[this.stepIndex - 1];
    return step ? step.label : '';
  }

  protected get shownCode(): string {
    return this.listed ? caseNumberLabel(this.listed) : this.code;
  }

  protected get caseAsk(): string {
    return this.listed ? caseBrief(this.listed) : this.goodsName;
  }

  protected get askLine(): string {
    const ask = this.caseAsk.trim();
    const goods = this.goodsName.trim();
    if (!ask || ask === goods) return '';
    return goods && ask.endsWith(goods) ? ask.slice(0, -goods.length).trim() : ask;
  }

  protected readingFile = '';
  protected readingStep = '';

  protected openRecord(file: string, step: string, event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.readingFile = file;
    this.readingStep = step;
  }

  protected closeRecord(): void {
    this.readingFile = '';
    this.readingStep = '';
  }

  protected get readingDetail(): string {
    if (!this.listed || !this.readingStep) return '';
    const step = this.listed.steps.find((entry) => stepLabel(entry.name) === this.readingStep);
    return stageResult(this.listed, this.readingStep, step?.state === 'done');
  }

  protected get petitionRoute(): string {
    const code = formCodeFromKind(this.listed?.kind);
    if (code) return formOf(code)?.route ?? '';
    if (this.listed?.measure.startsWith('SG')) return '/requests/sg';
    return '';
  }

  protected get stageFormRoute(): string {
    for (const file of this.stageFiles) {
      const route = this.formRoute(file);
      if (route) return route;
    }
    return '';
  }

  protected get caseClosed(): boolean {
    const status = this.listed?.status ?? '';
    return status.includes('ประกาศ') || status === 'ไม่เปิดการไต่สวน' || status === 'ยุติการไต่สวน';
  }

  protected get progressLine(): string {
    const status = this.listed?.status ?? '';
    if (status === 'ไม่เปิดการไต่สวน' || status === 'ยุติการไต่สวน') return `จบที่ขั้นตอน ${this.stepIndex} จาก ${this.steps.length} · ${status}`;
    if (this.caseClosed && this.stepIndex === this.steps.length) return `ครบ ${this.steps.length} ขั้นตอน · ${status}`;
    return `ขั้นตอน ${this.stepIndex} จาก ${this.steps.length} - อยู่ระหว่าง${this.currentLabel}`;
  }

  protected stepDone(index: number): boolean {
    return index < this.stepIndex || (this.caseClosed && index === this.stepIndex);
  }

  protected get applicantParties(): CaseParty[] {
    if (this.listed?.parties?.length) return this.listed.parties;
    if (this.caseApplicant) return [{ name: this.caseApplicant }];
    return [];
  }

  protected get partyDetail(): boolean {
    return this.applicantParties.some((party) => party.address || party.contact || party.phone || party.email || party.taxId);
  }

  protected get shownApplicants(): { name: string; address: string; phone: string; agent: string }[] {
    if (this.caseApplicant) return [{ name: this.caseApplicant, address: '', phone: '', agent: '' }];
    if (this.listed) return [];
    return this.applicants;
  }

  protected get shownCountries(): string[] {
    if (this.caseOrigins.length) return this.caseOrigins;
    if (this.listed) return [];
    return this.countries;
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

  protected get stageSummary(): string {
    if (!this.listed) return this.statusNote;
    return stageResult(this.listed, this.viewLabel, this.stageDone);
  }

  protected get stageFiles(): string[] {
    if (!this.listed) return this.files;
    if (this.partyAudience === 'staff') return documentsForStage(this.listed, this.viewLabel);
    if (this.partyAudience === 'none') return [];
    return partyDocumentsForStage(this.listed, this.viewLabel, this.partyAudience);
  }

  protected get shownNote(): string {
    if (this.partyAudience === 'interest' || this.partyAudience === 'notice' || this.partyAudience === 'none') return '';
    return this.caseNote;
  }

  protected get partyScope(): string {
    if (this.partyAudience === 'filer') return 'เอกสารของผู้ยื่น และเอกสารที่กรมแจ้งตามขั้นตอนที่ถึงแล้ว';
    if (this.partyAudience === 'interest') return 'เอกสารที่เปิดเผยและหนังสือที่แจ้งผู้มีส่วนได้เสีย';
    if (this.partyAudience === 'notice') return 'ประกาศและหนังสือแจ้งตามขั้นตอนที่ถึงแล้ว';
    if (this.partyAudience === 'none') return 'ไม่มีเอกสารที่บัญชีนี้เปิดดูได้';
    return '';
  }

  protected get docEmpty(): string {
    return this.partyAudience === 'staff' ? 'ไม่มีเอกสารในขั้นนี้' : 'ไม่มีเอกสารที่แจ้งในขั้นนี้';
  }

  private readAudience(item: ListedCase | undefined): 'staff' | PartyAudience | 'none' {
    const role = this.accounts.role;
    if (isActingAgent(this.accounts.username)) {
      const powers = powersOnCase(this.accounts.username, item?.id ?? '', item?.code ?? this.code);
      if (!powers?.length) return 'none';
      if (powers.includes('full') || powers.includes('file') || powers.includes('edit') || powers.includes('contact')) return 'filer';
      return 'notice';
    }
    if (role === 'interest') return this.interestLocked() ? 'none' : 'interest';
    if (role === 'corporate' || role === 'individual' || role === 'association' || !role) return 'filer';
    return 'staff';
  }

  protected get systemForms(): { code: string; title: string; route: string; file: string }[] {
    const seen = new Set<string>();
    const rows: { code: string; title: string; route: string; file: string }[] = [];
    for (const file of this.files) {
      const code = formCodeIn(file);
      if (!code || seen.has(code)) continue;
      const form = formOf(code);
      if (!form?.route) continue;
      seen.add(code);
      rows.push({ code, title: form.title, route: form.route, file });
    }
    return rows;
  }

  protected get plainFiles(): string[] {
    const codes = new Set(this.systemForms.map((form) => form.code));
    return this.files.filter((file) => {
      const code = formCodeIn(file);
      return !code || !codes.has(code);
    });
  }

  protected get caseFormRoute(): string {
    return this.systemForms[0]?.route || this.petitionRoute;
  }

  protected formRoute(file: string): string {
    if (this.interestLocked()) return '';
    const code = formCodeIn(file);
    if (code) return allows(this.casePowers(), 'form') ? formOf(code)?.route ?? '' : '';
    if (!this.petitionRoute || !file.includes('คำขอ') || /แก้ไข|แจ้ง|ปรับปรุง|หารือ/u.test(file)) return '';
    return allows(this.casePowers(), 'form') ? this.petitionRoute : '';
  }

  protected openFormView(route: string, event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    void this.router.navigate([route], { queryParams: { case: this.routeKey, view: '1' } });
  }

  protected get detailTabs(): string[] {
    return ['ข้อมูลคำขอ', `เอกสาร ${this.files.length}`, 'ประวัติการดำเนินการ'];
  }

  protected get shownHistory(): { title: string; detail: string; when: string; docs: string[] }[] {
    return this.filesOnly ? this.history.filter((item) => item.docs.length > 0) : this.history;
  }

  protected setDetailTab(index: number): void {
    this.detailTab = index;
    this.view.detectChanges();
  }

  protected toggleFilesOnly(): void {
    this.filesOnly = !this.filesOnly;
    this.view.detectChanges();
  }

  protected toggleManage(): void {
    this.manageOpen = !this.manageOpen;
    this.view.detectChanges();
  }

  protected printCase(): void {
    window.print();
  }

  protected get historyAnyOpen(): boolean {
    return this.history.some((item) => this.historyOpen[item.title]);
  }

  protected toggleHistoryList(): void {
    const open = !this.historyAnyOpen;
    this.historyOpen = Object.fromEntries(this.history.map((item) => [item.title, open]));
    this.view.detectChanges();
  }

  protected toggleHistory(title: string): void {
    this.historyOpen = { ...this.historyOpen, [title]: !this.historyOpen[title] };
    this.view.detectChanges();
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
    void this.router.navigate(['/requests', this.routeKey, 'fixes']);
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
