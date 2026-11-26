import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DftButton } from '../../button/button';
import { DftModal } from '../../modal/modal';
import { ThaiDateField } from '../../fields/thai-date-field';
import { InputField } from '../../input-field/input-field';
import { FileField } from '../../fields/file-field';
import { SideNav } from '../../menu-bar/side-nav';
import { StatusTag, StatusTone } from '../../status-tag/status-tag';
import { TopHeader } from '../../top-header/top-header';
import { readReceipt } from '../requests/case-status';
import { StepDocDef, STEP_DOCS } from './bureau-draft';
import { downloadDeskDoc, viewDeskDoc } from './bureau-files';
import {
  AgendaItem, DeskDoc, getUploaded, putUploaded, TECH_SECTORS, techRoles, BODY_LABEL, BodyId, BureauStore, CommentRow, DESK_TODAY, FilingRow, GROUPS, GazetteRow, Invitee, ItemFile, KIT_ROOT, Meeting,
  POST_STEPS, PREP_STEPS, STEP_AFTER, VISIT_STEPS, GZ_NOTICE, Rsvp, SAMPLE_ROOT, StepDef, VisitRow, daysFromToday, monthKey, planMonths, shortDate, validDate, MONTHS_TH, PLAN_YEARS, monthLabelOf,
} from './bureau-store';

export type BureauView = 'home' | 'inbox' | 'plan' | 'meeting' | 'minutes' | 'finance' | 'gazette' | 'filing';
type Lane = 'in' | 'pending' | 'out' | 'follow' | 'group';
type CardKind = 'item' | 'meeting' | 'post' | 'gazette' | 'visit' | 'receipt' | 'filing';

type DeskCard = {
  key: string;
  lane: Lane;
  kind: CardKind;
  title: string;
  status: string;
  tone: StatusTone;
  at: string;
  ref: string;
  who: string;
  due: string;
  go: string;
  goLabel: string;
  meetingId: string;
  rows: [string, string][];
};

type MeetingForm = { id: string; month: string; body: BodyId; sector: string; name: string; on: string; time: string; place: string; chair: string; signer: string; touched: boolean };
type UploadForm = { mode: 'new' | 'files'; id: string; title: string; group: string; measure: string; product: string; stage: string; due: string; meetingId: string; agenda: File | null; agendaName: string; ppt: File | null; pptName: string };

const NEW_MEETING = '__new';

type MeetingGroup = 'prep' | 'plan' | 'done';

type ItemForm = { id: string; meetingId: string; title: string; group: string; measure: string; due: string; product: string; stage: string };

const MEASURES = ['AD ไต่สวน', 'AD ม.56', 'AD ม.57', 'AD ม.58', 'AD ม.59', 'CVD ไต่สวน', 'CVD ม.56', 'CVD ม.57', 'CVD ม.58', 'CVD ม.59', 'SG ไต่สวน', 'AC'];
const BODIES: { id: BodyId; label: string }[] = [
  { id: 'tech', label: 'อนุฯ เทคนิค (แยกตามกลุ่มสินค้า เช่น อนุเหล็ก)' },
  { id: 'sub', label: 'อนุฯ ไต่สวน (AD / CVD / AC / ทบทวน ม.56–59)' },
  { id: 'tdc', label: BODY_LABEL.tdc },
  { id: 'cpp', label: BODY_LABEL.cpp },
];

const VIEW_INFO: Record<BureauView, { title: string; lead: string; open: string; active: string }> = {
  home: { title: 'ภาพรวมงาน บท.', lead: 'วาระและเรื่องที่กลุ่มงานส่งเข้ามาจากหลายเคส เพื่อรวบรวมนำเข้าที่ประชุม', open: 'งาน', active: 'หน้าแรก' },
  inbox: { title: 'วาระที่ส่งเข้ามา', lead: 'วาระและ PowerPoint ที่เจ้าหน้าที่ส่งจากแต่ละเคส บท. เลือกรับเข้าระเบียบวาระของการประชุม', open: 'วางแผนและรับวาระ', active: 'วาระที่ส่งเข้ามา' },
  plan: { title: 'แผนวาระ', lead: 'แผนการจัดประชุม ทตอ. คปป. และคณะอนุกรรมการ ปี 2567 (ย้อนหลัง) 2568 (ปัจจุบัน) และ 2569 (ล่วงหน้า) แยกตามเดือนและกลุ่มเจ้าของเรื่อง', open: 'วางแผนและรับวาระ', active: 'แผนวาระ' },
  meeting: { title: 'เตรียมประชุม', lead: 'เตรียมการประชุมรายครั้ง ตั้งแต่ระเบียบวาระ หนังสือเชิญ จนถึงเอกสารบรีฟประธาน', open: 'การประชุม', active: 'เตรียมประชุม' },
  minutes: { title: 'มติและรายงานการประชุม', lead: 'งานหลังประชุม ถอดเทป ให้ประธานเห็นชอบ ส่งกรรมการรับรอง และรวบรวมความเห็น', open: 'การประชุม', active: 'มติและรายงานการประชุม' },
  finance: { title: 'เบี้ยประชุมและเคลียร์เบรก', lead: 'เอกสารเบิกจ่ายของการประชุม และเลขเอกสารเบิกคลังของการ Visit', open: 'เบิกจ่ายและประกาศ', active: 'เบี้ยประชุมและเคลียร์เบรก' },
  filing: { title: 'บันทึกข้อมูลลงรับ', lead: 'ลงรับหนังสือที่เข้ามาถึง บท. ออกเลขรับ แล้วส่งมอบให้กลุ่มเจ้าของเรื่อง', open: 'งาน', active: 'บันทึกข้อมูลลงรับ' },
  gazette: { title: 'ส่งราชกิจจานุเบกษา', lead: 'ประกาศ ทตอ. และประกาศกรมที่ลงนามแล้ว ออกเลขหนังสือและส่งลงราชกิจจานุเบกษา', open: 'เบิกจ่ายและประกาศ', active: 'ส่งราชกิจจานุเบกษา' },
};

const LANES: { id: Lane; label: string; hint: string; tip: string }[] = [
  { id: 'in', label: 'งานรับเข้า', hint: 'ส่งมาใหม่ ยังไม่ได้จัดการ', tip: 'วาระที่เจ้าหน้าที่เพิ่งส่งเข้ามา และเรื่องที่รอ บท. ดำเนินการต่อ' },
  { id: 'pending', label: 'งานค้าง', hint: 'ใกล้ครบกำหนด', tip: 'ใกล้วันประชุมหรือวันครบกำหนดตามกฎหมาย แต่เอกสารยังไม่ครบ' },
  { id: 'out', label: 'งานออก', hint: 'เสร็จและส่งต่อแล้ว', tip: 'การประชุมที่ปิดงานแล้ว ประกาศที่ลงราชกิจจาฯ แล้ว หรือเรื่องที่ส่งมอบเลขแล้ว' },
  { id: 'follow', label: 'งานที่ต้องติดตาม', hint: 'รอผู้อื่นหรือรอขั้นถัดไป', tip: 'วาระที่จัดเข้าประชุมแล้ว งานหลังประชุม และประกาศที่อยู่ระหว่างส่งราชกิจจาฯ' },
  { id: 'group', label: 'งานระหว่างดำเนินการของกลุ่ม', hint: 'กลุ่ม บท. กำลังทำ', tip: 'การประชุมที่กำลังเตรียม หนังสือเชิญ ห้องประชุม เล่มวาระ' },
];

const RSVP_LABEL: Record<Rsvp, string> = { wait: 'รอตอบรับ', come: 'มา', no: 'ไม่มา', proxy: 'ส่งผู้แทน' };

@Component({
  selector: 'app-bureau-page',
  imports: [TopHeader, SideNav, StatusTag, DftButton, InputField, ThaiDateField, FileField, NgTemplateOutlet, DftModal],
  templateUrl: './bureau-page.html',
  styleUrls: ['./staff-home-page.css', './bureau-page.css'],
})
export class BureauPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly store = inject(BureauStore);

  protected readonly lanes = LANES;
  protected readonly groups = GROUPS;
  protected readonly prepSteps = PREP_STEPS;
  protected readonly postSteps = POST_STEPS;
  protected readonly bodyLabel = BODY_LABEL;
  protected readonly shortDate = shortDate;

  protected view: BureauView = 'home';
  protected boardLane: Lane | '' = '';
  protected boardView: 'board' | 'list' = 'board';
  protected searchOpen = false;
  protected query = '';
  protected kindFilter: 'item' | 'meeting' | 'gazette' | 'visit' | '' = '';
  protected openKey = '';

  protected inboxChip: 'all' | 'sent' | 'queued' | 'plan' = 'all';
  protected pickMeeting: Record<string, string> = {};
  protected meetingId = '';
  protected stepNote = '';

  protected readonly measures = MEASURES;
  protected readonly bodies = BODIES;
  protected mForm: MeetingForm | null = null;
  protected iForm: ItemForm | null = null;
  protected moveId = '';
  protected moveTo = '';
  protected confirmKey = '';
  protected formError = '';
  protected toast = '';

  protected inviteRole = '';
  protected openComment = '';

  ngOnInit(): void {
    this.view = (this.route.snapshot.data['view'] as BureauView | undefined) ?? 'home';
    const wanted = this.route.snapshot.queryParamMap.get('m') ?? '';
    const list = this.view === 'minutes' ? this.afterMeetings : this.view === 'meeting' ? this.meetingTabs : [];
    this.meetingId = list.find((row) => row.id === wanted)?.id
      ?? (this.view === 'minutes' ? this.afterMeetings[0]?.id : this.meetingTabs.find((row) => row.state === 'prep')?.id ?? this.meetingTabs[0]?.id)
      ?? '';
  }

  protected get info() {
    return VIEW_INFO[this.view];
  }

  // ───────────────────────── บท. อัปโหลดวาระเอง ─────────────────────────

  private readonly cdr = inject(ChangeDetectorRef);
  protected uploadForm: UploadForm | null = null;
  protected uploadError = '';
  protected uploading = false;

  protected openUploadNew(): void {
    this.uploadError = '';
    this.uploadForm = { mode: 'new', id: '', title: '', group: GROUPS[0] ?? '', measure: 'AD ไต่สวน', product: '', stage: '', due: '', meetingId: '', agenda: null, agendaName: '', ppt: null, pptName: '' };
  }

  protected openUploadFiles(row: AgendaItem): void {
    this.uploadError = '';
    this.uploadForm = { mode: 'files', id: row.id, title: row.title, group: row.group, measure: row.measure, product: row.product, stage: row.stage, due: row.due, meetingId: '', agenda: null, agendaName: '', ppt: null, pptName: '' };
  }

  protected setUp(field: 'title' | 'group' | 'measure' | 'product' | 'stage' | 'due' | 'meetingId', value: string, select?: HTMLSelectElement): void {
    if (!this.uploadForm) return;
    if (field === 'meetingId' && value === NEW_MEETING) {
      if (select) select.value = this.uploadForm.meetingId;
      this.startNewMeeting({ upload: true }, this.uploadForm.measure);
      return;
    }
    const next = { ...this.uploadForm, [field]: value };
    if (field === 'measure' && !this.meetingOptionsFor(value).some((meeting) => meeting.id === next.meetingId)) next.meetingId = '';
    this.uploadForm = next;
  }

  protected setUpFile(role: 'agenda' | 'ppt', file: File | null): void {
    if (!this.uploadForm) return;
    this.uploadForm = role === 'agenda'
      ? { ...this.uploadForm, agenda: file, agendaName: file?.name ?? '' }
      : { ...this.uploadForm, ppt: file, pptName: file?.name ?? '' };
  }

  protected meetingOptionsFor(measure: string): Meeting[] {
    return this.itemMeetingOptions({ measure } as AgendaItem);
  }

  protected onUploadModal(choice: string): void {
    if (choice === 'ยืนยัน') {
      void this.saveUpload();
      return;
    }
    if (this.uploading) return;
    this.uploadForm = null;
    this.uploadError = '';
  }

  private async saveUpload(): Promise<void> {
    const form = this.uploadForm;
    if (!form || this.uploading) return;
    if (form.mode === 'new') {
      if (!form.title.trim()) { this.uploadError = 'ระบุเรื่องที่เสนอเข้าวาระ'; return; }
      if (!form.agenda) { this.uploadError = 'แนบไฟล์วาระ (ฉบับที่ ผอ. อนุมัติแล้ว)'; return; }
      if (form.due.trim() && !validDate(form.due)) { this.uploadError = 'วันครบกำหนดต้องเป็นรูปแบบ วว/ดด/ปปปป (พ.ศ.)'; return; }
    } else if (!form.agenda && !form.ppt) {
      this.uploadError = 'เลือกไฟล์ที่จะอัปโหลดอย่างน้อย 1 ไฟล์';
      return;
    }
    this.uploading = true;
    try {
      const files: ItemFile[] = [];
      for (const [role, file, title] of [['agenda', form.agenda, 'วาระที่ บท. อัปโหลด'], ['ppt', form.ppt, 'PowerPoint ที่ บท. อัปโหลด']] as const) {
        if (!file) continue;
        const key = `up-${Date.now().toString(36)}-${role}`;
        await putUploaded(key, file);
        files.push({ role, name: file.name, title, href: `idb:${key}`, at: DESK_TODAY });
      }
      if (form.mode === 'new') {
        this.store.addManualItem({ title: form.title, group: form.group, measure: form.measure, product: form.product, stage: form.stage, due: form.due, meetingId: form.meetingId, files });
        this.say(form.meetingId ? 'เพิ่มวาระและรับเข้าระเบียบวาระของประชุมแล้ว' : 'เพิ่มวาระแล้ว เลือกประชุมแล้วกดรับเข้าวาระได้เลย');
      } else {
        this.store.attachFiles(form.id, files);
        this.say(`อัปโหลดไฟล์แล้ว ${files.length} ไฟล์`);
      }
      this.uploadForm = null;
      this.uploadError = '';
    } catch {
      this.uploadError = 'อัปโหลดไม่สำเร็จ ลองใหม่อีกครั้ง';
    } finally {
      this.uploading = false;
      this.cdr.markForCheck();
    }
  }

  // ───────────────────────── บันทึกข้อมูลลงรับ ─────────────────────────

  protected filingOpen = false;
  protected filingForm = { at: DESK_TODAY, from: '', letterNo: '', letterDate: '', subject: '', group: GROUPS[0] ?? '', no: '' };
  protected filingError = '';
  protected manualId = '';
  protected manualNo = '';
  protected manualError = '';

  protected get filingWaiting(): number {
    return this.store.filings.filter((row) => row.saraban === 'wait').length;
  }

  protected openFiling(): void {
    this.filingError = '';
    this.filingForm = { at: DESK_TODAY, from: '', letterNo: '', letterDate: '', subject: '', group: GROUPS[0] ?? '', no: '' };
    this.filingOpen = true;
  }

  protected setFiling(field: 'at' | 'from' | 'letterNo' | 'letterDate' | 'subject' | 'group' | 'no', value: string): void {
    this.filingForm = { ...this.filingForm, [field]: value };
  }

  protected onFilingModal(choice: string): void {
    if (choice === 'ยืนยัน') {
      if (this.saveFiling()) this.filingOpen = false;
      return;
    }
    this.filingOpen = false;
    this.filingError = '';
  }

  protected saveFiling(): boolean {
    const form = this.filingForm;
    if (!validDate(form.at)) { this.filingError = 'วันที่รับต้องเป็นรูปแบบ วว/ดด/ปปปป (พ.ศ.)'; return false; }
    if (!form.from.trim()) { this.filingError = 'ระบุหนังสือจากใคร'; return false; }
    if (!form.subject.trim()) { this.filingError = 'ระบุเรื่องที่รับ'; return false; }
    if (form.letterDate.trim() && !validDate(form.letterDate)) { this.filingError = 'วันที่หนังสือต้องเป็นรูปแบบ วว/ดด/ปปปป (พ.ศ.)'; return false; }
    if (this.store.sarabanTaken(form.no)) { this.filingError = 'เลขรับนี้มีในรายการลงรับแล้ว'; return false; }
    this.store.addFiling(form);
    this.filingError = '';
    this.say(form.no.trim() ? `ลงรับแล้ว เลขรับ ${form.no.trim()} (กรอกเอง)` : 'ลงรับแล้ว รอ sync เลขจากระบบสารบรรณ');
    return true;
  }

  protected syncSaraban(id = ''): void {
    const count = this.store.syncSaraban(id || undefined);
    this.say(count ? `ดึงเลขรับจากระบบสารบรรณแล้ว ${count} รายการ` : 'ไม่มีรายการที่รอเลขจากระบบสารบรรณ');
  }

  protected openManual(id: string): void {
    this.manualId = id;
    this.manualNo = '';
    this.manualError = '';
  }

  protected onManualModal(choice: string): void {
    if (choice !== 'ยืนยัน') { this.manualId = ''; this.manualError = ''; return; }
    if (!this.manualNo.trim()) { this.manualError = 'ระบุเลขรับจากระบบสารบรรณ'; return; }
    if (this.store.sarabanTaken(this.manualNo, this.manualId)) { this.manualError = 'เลขรับนี้มีในรายการลงรับแล้ว'; return; }
    this.store.setSarabanNo(this.manualId, this.manualNo);
    this.manualId = '';
    this.manualError = '';
    this.say('บันทึกเลขรับสารบรรณแล้ว (กรอกเอง)');
  }

  protected sarabanLabel(row: FilingRow): string {
    return { wait: 'รอเลขจากสารบรรณ', synced: 'sync จากสารบรรณ', manual: 'กรอกเอง' }[row.saraban];
  }

  protected sarabanTone(row: FilingRow): StatusTone {
    return row.saraban === 'wait' ? 'warning' : 'success';
  }

  protected handFiling(row: FilingRow): void {
    if (!row.no) return;
    this.store.handFiling(row.id);
    this.say(`ส่งมอบให้ ${row.group} แล้ว`);
  }

  // ───────────────────────── หน้าแรก ─────────────────────────

  protected get cards(): DeskCard[] {
    const out: DeskCard[] = [];
    const meetingName = (id: string) => this.store.meetingById(id)?.name ?? '';
    for (const row of this.store.items) {
      if (row.status === 'done') continue;
      const names = row.meetingIds.map(meetingName).filter(Boolean).join(' · ') || 'ยังไม่จัดเข้าประชุม';
      const base = { kind: 'item' as CardKind, title: row.title, ref: `${row.caseCode || row.group} · ${row.measure}`, who: row.sentBy || row.group, due: row.due ? `ครบกำหนดตามกฎหมาย ${shortDate(row.due)}` : '', go: '/bureau/inbox', goLabel: 'ไปที่วาระที่ส่งเข้ามา', meetingId: row.meetingIds[0] ?? '' };
      const rows: [string, string][] = [['ผลิตภัณฑ์', row.product], ['ขั้นตอน', row.stage], ['กลุ่มเจ้าของเรื่อง', row.group], ['ประชุม', names], ['ไฟล์', row.files.length ? row.files.map((file) => file.title || file.name).join(' · ') : 'ยังไม่ได้ส่ง']];
      if (row.status === 'sent') out.push({ ...base, key: `i:${row.id}`, lane: 'in', status: 'รอรับเข้าวาระ', tone: 'info', at: row.sentAt, rows });
      else if (row.status === 'queued') out.push({ ...base, key: `i:${row.id}`, lane: 'follow', status: 'จัดเข้าวาระแล้ว', tone: 'success', at: row.sentAt, goLabel: 'ไปที่เตรียมประชุม', go: '/bureau/meetings', rows });
      else if (row.meetingIds.some((id) => this.store.meetingById(id)?.state === 'prep')) {
        const days = row.due ? daysFromToday(row.due) : null;
        if (days !== null && days <= 30) out.push({ ...base, key: `i:${row.id}`, lane: 'pending', status: 'ใกล้ครบกำหนด ยังไม่ส่งวาระ', tone: 'warning', at: `ครบกำหนดอีก ${days} วัน`, rows });
      }
    }
    for (const meeting of this.opMeetings) {
      const days = meeting.on ? daysFromToday(meeting.on) : null;
      const rows: [string, string][] = [['วันประชุม', meeting.on ? `${shortDate(meeting.on)} · ${meeting.time}` : 'รอกำหนดวัน'], ['สถานที่', meeting.place], ['ประธาน', meeting.chair], ['วาระ', `${this.store.itemsOf(meeting.id).length} เรื่อง`]];
      if (meeting.state === 'prep') {
        const done = this.store.prepDone(meeting);
        const late = days !== null && days <= 7 && done < 6;
        out.push({ key: `m:${meeting.id}`, lane: late ? 'pending' : 'group', kind: 'meeting', title: meeting.name, status: late ? `ใกล้วันประชุม เตรียมได้ ${done}/${PREP_STEPS.length}` : `เตรียมประชุม ${done}/${PREP_STEPS.length}`, tone: late ? 'warning' : 'info', at: meeting.on ? shortDate(meeting.on) : '', ref: BODY_LABEL[meeting.body], who: 'กลุ่ม บท.', due: days !== null ? `อีก ${days} วันถึงวันประชุม` : '', go: '/bureau/meetings', goLabel: 'ไปที่เตรียมประชุม', meetingId: meeting.id, rows });
      } else if (meeting.state === 'held') {
        const done = this.store.postDone(meeting);
        out.push({ key: `m:${meeting.id}`, lane: 'follow', kind: 'post', title: `${meeting.name} · งานหลังประชุม`, status: `มติและรายงาน ${done}/${POST_STEPS.length}`, tone: 'warning', at: shortDate(meeting.on), ref: BODY_LABEL[meeting.body], who: 'กลุ่ม บท.', due: '', go: '/bureau/minutes', goLabel: 'ไปที่มติและรายงาน', meetingId: meeting.id, rows });
      } else if (meeting.state === 'closed') {
        out.push({ key: `m:${meeting.id}`, lane: 'out', kind: 'post', title: `${meeting.name} · ปิดงานประชุม`, status: 'ส่งมติและรายงานแล้ว', tone: 'success', at: shortDate(meeting.on), ref: BODY_LABEL[meeting.body], who: 'กลุ่ม บท.', due: '', go: '/bureau/minutes', goLabel: 'ดูมติและรายงาน', meetingId: meeting.id, rows });
      }
    }
    for (const row of this.store.gazette) {
      const done = row.steps.filter((step) => !!step.at).length;
      const next = row.steps.find((step) => !step.at);
      const rows: [string, string][] = [['ประเภท', row.kind], ['กลุ่มเจ้าของเรื่อง', row.group], ['ความคืบหน้า', `${done}/${row.steps.length} ขั้น`], ['ขั้นถัดไป', next?.label ?? 'ลงประกาศแล้ว']];
      const lane: Lane = !next ? 'out' : done === 0 ? 'in' : 'follow';
      out.push({ key: `g:${row.id}`, lane, kind: 'gazette', title: row.title, status: next ? next.label : 'ลงราชกิจจานุเบกษาแล้ว', tone: !next ? 'success' : done === 0 ? 'info' : 'warning', at: row.steps.find((step) => !!step.at)?.at ?? '', ref: row.caseCode ? `${row.caseCode} · ${row.kind}` : row.kind, who: row.group, due: '', go: '/bureau/gazette', goLabel: 'ไปที่ส่งราชกิจจาฯ', meetingId: '', rows });
    }
    for (const row of this.store.visits) {
      const done = this.visitDone(row);
      const next = VISIT_STEPS[done];
      const rows: [string, string][] = [['เรื่อง', row.need], ['กลุ่มเจ้าของเรื่อง', row.group], ['เลข e-Office', row.no || 'ยังไม่ออกเลข'], ['ความคืบหน้า', `${done}/${VISIT_STEPS.length} ขั้น`]];
      const lane: Lane = !next ? 'out' : done === 0 ? 'in' : 'follow';
      out.push({ key: `v:${row.id}`, lane, kind: 'visit', title: row.title, status: next ? next.label : 'เคลียร์ค่าใช้จ่ายแล้ว', tone: !next ? 'success' : done === 0 ? 'info' : 'warning', at: row.at, ref: `${row.caseCode ? row.caseCode + ' · ' : ''}Visit${row.abroad ? ' ต่างประเทศ' : ''}`, who: row.group, due: '', go: '/bureau/finance', goLabel: 'ไปที่เบี้ยประชุมและการเงิน', meetingId: '', rows });
    }
    for (const row of this.store.filings) {
      const rows: [string, string][] = [['เลขรับสารบรรณ', row.no || 'รอเลขจากระบบสารบรรณ'], ['หนังสือจาก', row.from], ['เลขหนังสือ / วันที่', `${row.letterNo || '—'} · ${row.letterDate || '—'}`], ['กลุ่มเจ้าของเรื่อง', row.group]];
      const status = row.handedAt ? 'ส่งมอบให้กลุ่มแล้ว' : row.no ? 'รอส่งมอบให้กลุ่ม' : 'รอเลขจากระบบสารบรรณ';
      out.push({ key: `f:${row.id}`, lane: row.handedAt ? 'out' : 'in', kind: 'filing', title: row.subject, status, tone: row.handedAt ? 'success' : row.no ? 'info' : 'warning', at: row.at, ref: row.no || 'ลงรับ · รอเลขสารบรรณ', who: row.group, due: '', go: '/bureau/filing', goLabel: 'ไปที่บันทึกข้อมูลลงรับ', meetingId: '', rows });
    }
    const receipt = readReceipt();
    if (receipt?.links?.length) {
      out.push({ key: 'r:receipt', lane: 'out', kind: 'receipt', title: 'ลงรับจากระบบสารบรรณ', status: 'ส่งมอบเลขรับแล้ว', tone: 'success', at: receipt.links[receipt.links.length - 1]?.at ?? '', ref: `เลขรับ ${receipt.sarabanNo}`, who: 'กลุ่ม บท.', due: '', go: '/bureau/filing', goLabel: 'ไปที่บันทึกข้อมูลลงรับ', meetingId: '', rows: [['เลขที่ลงรับ', receipt.sarabanNo], ['เรื่อง', receipt.subject || '—']] });
    }
    return out;
  }

  private cardGroup(kind: CardKind): string {
    return kind === 'post' ? 'meeting' : kind === 'receipt' || kind === 'filing' ? 'visit' : kind;
  }

  private filteredCards(): DeskCard[] {
    const text = this.query.trim();
    return this.cards.filter((card) => {
      if (this.kindFilter && this.cardGroup(card.kind) !== this.kindFilter) return false;
      if (!text) return true;
      return `${card.title} ${card.ref} ${card.who} ${card.status}`.toLowerCase().includes(text.toLowerCase());
    });
  }

  protected get summaryStats() {
    const rows = this.filteredCards();
    return LANES.map((lane) => ({ ...lane, count: rows.filter((card) => card.lane === lane.id).length }));
  }

  protected get boardColumns(): { id: Lane; label: string; rows: DeskCard[] }[] {
    const rows = this.filteredCards();
    return LANES.filter((lane) => !this.boardLane || this.boardLane === lane.id).map((lane) => ({ id: lane.id, label: lane.label, rows: rows.filter((card) => card.lane === lane.id) }));
  }

  protected pickLane(id: Lane): void {
    this.boardLane = this.boardLane === id ? '' : id;
  }

  protected get q(): string {
    return this.query.trim().toLowerCase();
  }

  protected hit(...parts: (string | undefined)[]): boolean {
    const q = this.q;
    return !q || parts.join(' ').toLowerCase().includes(q);
  }

  protected get searchHint(): string {
    return {
      home: 'ค้นหาเรื่อง กลุ่ม ผลิตภัณฑ์ หรือสถานะ',
      filing: 'ค้นหาเลขรับ เรื่อง หนังสือจาก กลุ่ม หรือสถานะ',
      inbox: 'ค้นหาเรื่อง กลุ่ม ผลิตภัณฑ์ หรือมาตรการ',
      plan: 'ค้นหาประชุมหรือวาระ กลุ่ม ผลิตภัณฑ์ หรือมาตรการ',
      meeting: 'ค้นหาการประชุม',
      minutes: 'ค้นหาการประชุม',
      finance: 'ค้นหาการประชุม เคส กลุ่ม หรือเรื่อง Visit',
      gazette: 'ค้นหาประกาศ เคส กลุ่ม หรือเลขหนังสือ',
    }[this.view];
  }

  protected get filingRows(): FilingRow[] {
    return this.store.filings.filter((row) => this.hit(row.no, row.subject, row.from, row.letterNo, row.group, row.at, this.sarabanLabel(row), row.handedAt ? 'ส่งมอบแล้ว' : 'รอส่งมอบ'));
  }

  protected get gazetteRows(): GazetteRow[] {
    return this.store.gazette.filter((row) => this.hit(row.title, row.caseCode, row.kind, row.group, row.no));
  }

  protected get visitRows(): VisitRow[] {
    return this.store.visits.filter((row) => this.hit(row.title, row.caseCode, row.group, row.need, row.no));
  }

  protected get moneyRows(): Meeting[] {
    return this.moneyMeetings.filter((row) => this.hit(row.name, row.month, this.stateLabel(row)));
  }

  protected groupChoice: '' | MeetingGroup = '';

  private groupOf(meeting: Meeting): MeetingGroup {
    return meeting.state === 'prep' ? 'prep' : meeting.state === 'plan' ? 'plan' : 'done';
  }

  /** กลุ่มที่เลือกอยู่ — ถ้ายังไม่เลือก ใช้กลุ่มของประชุมที่เปิดอยู่ */
  protected get meetingGroup(): MeetingGroup {
    return this.groupChoice || (this.selected ? this.groupOf(this.selected) : 'prep');
  }

  protected get meetingGroups(): { id: MeetingGroup; label: string; count: number }[] {
    const count = (id: MeetingGroup) => this.meetingTabs.filter((row) => this.groupOf(row) === id).length;
    return [
      { id: 'prep', label: 'กำลังเตรียม', count: count('prep') },
      { id: 'plan', label: 'ตามแผน', count: count('plan') },
      { id: 'done', label: 'ประชุมแล้ว', count: count('done') },
    ];
  }

  protected pickMeetingGroup(id: MeetingGroup): void {
    this.groupChoice = id;
    const current = this.selected;
    if (current && this.groupOf(current) === id) return;
    const first = this.meetingTabs.find((row) => this.groupOf(row) === id);
    if (first) this.pickMeetingTab(first.id);
  }

  protected get meetingTabsShown(): Meeting[] {
    return this.meetingTabs.filter((row) => (this.q || this.groupOf(row) === this.meetingGroup) && this.hit(row.name, row.month, this.stateLabel(row)));
  }

  protected get afterTabsShown(): Meeting[] {
    return this.afterMeetings.filter((row) => this.hit(row.name, row.month, this.stateLabel(row)));
  }

  private itemHit(row: AgendaItem): boolean {
    return this.hit(row.title, row.group, row.product, row.measure, row.stage, row.caseCode);
  }

  private meetingHit(meeting: Meeting): boolean {
    return this.hit(meeting.name, meeting.place, meeting.chair);
  }

  /** วาระของประชุมในหน้าแผน — ค้นแล้วเหลือเฉพาะที่ตรง (ถ้าชื่อประชุมตรงแสดงทั้งหมด) */
  protected planItems(meeting: Meeting): AgendaItem[] {
    const rows = this.store.itemsOf(meeting.id);
    return !this.q || this.meetingHit(meeting) ? rows : rows.filter((row) => this.itemHit(row));
  }

  protected get hasPlanHit(): boolean {
    return this.months.some((month) => this.meetingsOfMonth(month).length > 0);
  }

  protected toggleSearch(): void {
    this.searchOpen = !this.searchOpen;
    if (this.searchOpen) setTimeout(() => document.getElementById('bz-search')?.focus());
  }

  protected toggleCard(key: string): void {
    this.openKey = this.openKey === key ? '' : key;
  }

  protected goCard(card: DeskCard): void {
    void this.router.navigate([card.go], { queryParams: card.meetingId ? { m: card.meetingId } : {} });
  }

  protected get caseCount(): number {
    return new Set(this.store.items.filter((row) => row.status === 'sent' || row.status === 'queued').map((row) => row.caseKey)).size;
  }

  protected get upcoming(): { meeting: Meeting; days: number | null; done: number; items: number }[] {
    return this.store.meetings
      .filter((row) => row.state === 'prep')
      .map((meeting) => ({ meeting, days: meeting.on ? daysFromToday(meeting.on) : null, done: this.store.prepDone(meeting), items: this.store.itemsOf(meeting.id).length }));
  }

  protected openMeeting(id: string, path: string): void {
    void this.router.navigate([path], { queryParams: { m: id } });
  }

  // ───────────────────────── วาระที่ส่งเข้ามา ─────────────────────────

  private get inboxBase(): AgendaItem[] {
    const prepIds = new Set(this.store.meetings.filter((row) => row.state === 'prep').map((row) => row.id));
    return this.store.items.filter((row) => row.status !== 'done' && (row.live || row.manual || row.meetingIds.some((id) => prepIds.has(id))) && this.itemHit(row));
  }

  protected get inboxRows(): AgendaItem[] {
    const rows = this.inboxBase;
    return this.inboxChip === 'all' ? rows : rows.filter((row) => row.status === this.inboxChip);
  }

  protected get inboxChips(): { id: 'all' | 'sent' | 'queued' | 'plan'; label: string; count: number }[] {
    const rows = this.inboxBase;
    const count = (status: string) => rows.filter((row) => row.status === status).length;
    return [
      { id: 'all', label: 'ทั้งหมด', count: rows.length },
      { id: 'sent', label: 'ส่งมาแล้ว รอรับเข้าวาระ', count: count('sent') },
      { id: 'queued', label: 'จัดเข้าวาระแล้ว', count: count('queued') },
      { id: 'plan', label: 'ในแผน ยังไม่ส่ง', count: count('plan') },
    ];
  }

  protected pickChip(id: 'all' | 'sent' | 'queued' | 'plan'): void {
    this.inboxChip = id;
  }

  protected itemMeetingOptions(row: AgendaItem): Meeting[] {
    return this.meetingTabs.filter((meeting) => meeting.state === 'prep' || meeting.state === 'plan').filter((meeting) => this.bodyFits(row.measure, meeting));
  }

  /** SG ไปคปป. ส่วนมาตรการอื่นไปอนุไต่สวน/ทตอ. — อนุเทคนิคใช้ได้ทุกมาตรการ */
  private bodyFits(measure: string, meeting: Meeting): boolean {
    if (meeting.body === 'tech') return true;
    return measure.startsWith('SG') ? meeting.body === 'cpp' : meeting.body !== 'cpp';
  }

  protected chosenMeeting(row: AgendaItem): string {
    return this.pickMeeting[row.id] || row.meetingIds.find((id) => this.itemMeetingOptions(row).some((meeting) => meeting.id === id)) || this.itemMeetingOptions(row)[0]?.id || '';
  }

  protected setMeeting(row: AgendaItem, value: string, select?: HTMLSelectElement): void {
    if (value === NEW_MEETING) {
      if (select) select.value = this.chosenMeeting(row);
      this.startNewMeeting({ row: row.id }, row.measure);
      return;
    }
    this.pickMeeting = { ...this.pickMeeting, [row.id]: value };
  }

  /** สร้างประชุมใหม่จากหน้านี้ — เลือกให้อัตโนมัติหลังบันทึก */
  private newMeetingFor: { row?: string; upload?: boolean } | null = null;
  protected readonly newMeeting = NEW_MEETING;

  private startNewMeeting(target: { row?: string; upload?: boolean }, measure: string): void {
    this.newMeetingFor = target;
    this.openAddMeeting(monthLabelOf(DESK_TODAY), measure.startsWith('SG') ? 'cpp' : 'tdc');
  }

  protected queueItem(row: AgendaItem): void {
    this.store.queue(row.id, this.chosenMeeting(row));
  }

  protected unqueueItem(row: AgendaItem): void {
    this.store.unqueue(row.id);
  }

  protected itemTone(row: AgendaItem): StatusTone {
    if (row.status === 'queued' || row.status === 'done') return 'success';
    if (row.status === 'sent') return 'info';
    const days = row.due ? daysFromToday(row.due) : null;
    return days !== null && days <= 30 ? 'warning' : 'neutral';
  }

  protected itemStatus(row: AgendaItem): string {
    if (row.status === 'queued') return 'จัดเข้าวาระแล้ว';
    if (row.status === 'done') return 'ประชุมแล้ว';
    if (row.status === 'sent') return 'รอรับเข้าวาระ';
    const days = row.due ? daysFromToday(row.due) : null;
    return days !== null && days <= 30 ? 'ใกล้ครบกำหนด ยังไม่ส่ง' : 'อยู่ในแผน ยังไม่ส่ง';
  }

  protected meetingNames(row: AgendaItem): string {
    return row.meetingIds.map((id) => this.store.meetingById(id)?.name ?? '').filter(Boolean).join(' · ') || '—';
  }

  protected dueText(row: AgendaItem): string {
    if (!row.due) return '—';
    const days = daysFromToday(row.due);
    return `${shortDate(row.due)}${days !== null ? ` (อีก ${days} วัน)` : ''}`;
  }

  // ───────────────────────── แผนวาระ ─────────────────────────

  protected readonly years = PLAN_YEARS;
  protected year = PLAN_YEARS[1] ?? 2568;

  protected get months(): string[] {
    return planMonths(this.year);
  }

  protected yearMeetings(year: number): number {
    return this.store.meetings.filter((row) => row.month.endsWith(` ${year}`)).length;
  }

  protected yearItems(year: number): number {
    return this.store.items.filter((row) => this.store.meetingById(row.meetingIds[0] ?? '')?.month.endsWith(` ${year}`)).length;
  }

  protected pickYear(year: number): void {
    this.year = year;
    this.mForm = null;
    this.iForm = null;
    this.formError = '';
    this.confirmKey = '';
  }

  protected meetingsOfMonth(month: string): Meeting[] {
    return this.store.meetings.filter((row) => row.month === month && (!this.q || this.meetingHit(row) || this.store.itemsOf(row.id).some((item) => this.itemHit(item))));
  }

  protected get matrixGroups(): string[] {
    return this.groups.filter((group) => this.store.items.some((row) => row.group === group));
  }

  protected matrixCount(month: string, group: string): number {
    return this.store.items.filter((row) => row.group === group && this.store.meetingById(row.meetingIds[0] ?? '')?.month === month).length;
  }

  protected get planNote(): string {
    return 'ปค. ได้รับการประสานจากผู้ผลิตในประเทศที่จะยื่นขอใช้มาตรการ AD อีก 2 รายการ คือ PET จากจีนและเวียดนาม (ปค./กลุ่ม 5) และฟีนอลิกเรซินจากจีน (ปค./กลุ่ม 4) อยู่ระหว่างพิจารณาร่างคำขอ';
  }

  protected say(text: string): void {
    this.toast = text;
    setTimeout(() => { if (this.toast === text) this.toast = ''; }, 2500);
  }

  protected meetingEditable(meeting: Meeting): boolean {
    return meeting.state === 'plan' || meeting.state === 'prep';
  }

  protected itemEditable(row: AgendaItem, meeting: Meeting): boolean {
    return this.meetingEditable(meeting) && !row.live && row.status !== 'done';
  }

  protected readonly sectors = TECH_SECTORS;

  protected openAddMeeting(month: string, body: BodyId = 'tdc'): void {
    this.iForm = null;
    this.formError = '';
    const sector = TECH_SECTORS[0]?.label ?? '';
    this.mForm = { id: '', month, body, sector, name: this.store.suggestName(body, month, sector), on: '', time: '', place: '', chair: '', signer: '', touched: false };
  }

  protected openEditMeeting(meeting: Meeting): void {
    this.iForm = null;
    this.formError = '';
    this.mForm = { id: meeting.id, month: meeting.month, body: meeting.body, sector: meeting.sector ?? '', name: meeting.name, on: meeting.on, time: meeting.time, place: meeting.place, chair: meeting.chair, signer: meeting.signer, touched: true };
  }

  protected setM(field: 'name' | 'on' | 'time' | 'place' | 'chair' | 'signer', value: string): void {
    if (!this.mForm) return;
    this.mForm = { ...this.mForm, [field]: value, touched: field === 'name' ? true : this.mForm.touched };
  }

  protected setMBody(body: string): void {
    if (!this.mForm) return;
    const next = body as BodyId;
    this.mForm = { ...this.mForm, body: next, name: this.mForm.touched ? this.mForm.name : this.store.suggestName(next, this.mForm.month, this.mForm.sector) };
  }

  protected setMSector(sector: string): void {
    if (!this.mForm) return;
    this.mForm = { ...this.mForm, sector, name: this.mForm.touched ? this.mForm.name : this.store.suggestName(this.mForm.body, this.mForm.month, sector) };
  }

  protected saveMeeting(): void {
    const form = this.mForm;
    if (!form) return;
    if (!form.name.trim()) { this.formError = 'ใส่ชื่อการประชุม'; return; }
    if (!form.id && this.newMeetingFor && !form.on.trim()) { this.formError = 'ระบุวันประชุม เพื่อให้เลือกเป็นประชุมที่เสนอได้'; return; }
    if (form.on.trim() && !validDate(form.on)) { this.formError = 'วันที่ต้องเป็นรูปแบบ วว/ดด/ปปปป (พ.ศ.)'; return; }
    const savedYear = Number(monthLabelOf(form.on).split(' ')[1] ?? 0);
    if (form.on.trim() && !PLAN_YEARS.includes(savedYear)) { this.formError = `แผนนี้ครอบคลุมปี ${PLAN_YEARS[0]} – ${PLAN_YEARS[PLAN_YEARS.length - 1]} เท่านั้น`; return; }
    const patch = { name: form.name, on: form.on, time: form.time, place: form.place, chair: form.chair, signer: form.signer, sector: form.sector };
    if (form.id) this.store.updateMeeting(form.id, patch);
    else {
      const created = this.store.addMeeting(form.body, form.month, patch);
      const target = this.newMeetingFor;
      if (target?.row) this.pickMeeting = { ...this.pickMeeting, [target.row]: created };
      else if (target?.upload && this.uploadForm) this.uploadForm = { ...this.uploadForm, meetingId: created };
    }
    this.newMeetingFor = null;
    if (savedYear && form.on.trim()) this.year = savedYear;
    this.say(form.id ? 'บันทึกการแก้ไขประชุมแล้ว' : 'เพิ่มประชุมเข้าแผนแล้ว');
    this.mForm = null;
    this.formError = '';
  }

  protected onMeetingModal(choice: string): void {
    if (choice === 'ยืนยัน') this.saveMeeting();
    else this.cancelMeetingForm();
  }

  protected onItemModal(choice: string): void {
    if (choice === 'ยืนยัน') this.saveItem();
    else this.cancelItemForm();
  }

  protected cancelMeetingForm(): void {
    this.newMeetingFor = null;
    this.mForm = null;
    this.formError = '';
  }

  protected deleteBlock(meeting: Meeting): string {
    return this.store.removeMeetingBlock(meeting.id);
  }

  protected askDelete(key: string): void {
    this.confirmKey = this.confirmKey === key ? '' : key;
  }

  protected deleteMeeting(meeting: Meeting): void {
    if (this.store.removeMeetingBlock(meeting.id)) return;
    this.store.removeMeeting(meeting.id);
    this.confirmKey = '';
    this.say('ลบประชุมออกจากแผนแล้ว');
  }

  protected openAddItem(meetingId: string): void {
    this.mForm = null;
    this.formError = '';
    this.iForm = { id: '', meetingId, title: '', group: GROUPS[0] ?? '', measure: 'AD ไต่สวน', due: '', product: '', stage: 'แผนวาระ' };
  }

  protected openEditItem(row: AgendaItem, meetingId: string): void {
    this.mForm = null;
    this.formError = '';
    this.iForm = { id: row.id, meetingId, title: row.title, group: row.group, measure: row.measure, due: row.due, product: row.product, stage: row.stage };
  }

  protected setI(field: 'title' | 'group' | 'measure' | 'due' | 'product' | 'stage', value: string): void {
    if (!this.iForm) return;
    this.iForm = { ...this.iForm, [field]: value };
  }

  protected saveItem(): void {
    const form = this.iForm;
    if (!form) return;
    if (!form.title.trim()) { this.formError = 'ใส่ชื่อเรื่องที่จะเสนอ'; return; }
    if (form.due.trim() && !validDate(form.due)) { this.formError = 'วันครบกำหนดต้องเป็นรูปแบบ วว/ดด/ปปปป (พ.ศ.)'; return; }
    const patch = { title: form.title, group: form.group, measure: form.measure, due: form.due, product: form.product, stage: form.stage };
    if (form.id) this.store.updateItem(form.id, patch);
    else this.store.addPlan({ title: form.title.trim(), group: form.group, meetingId: form.meetingId, due: form.due.trim(), product: form.product.trim(), measure: form.measure });
    this.say(form.id ? 'บันทึกการแก้ไขวาระแล้ว' : 'เพิ่มวาระเข้าแผนแล้ว');
    this.iForm = null;
    this.formError = '';
  }

  protected cancelItemForm(): void {
    this.iForm = null;
    this.formError = '';
  }

  protected deleteItem(row: AgendaItem): void {
    if (this.store.removeItemBlock(row.id)) return;
    this.store.removeItem(row.id);
    this.confirmKey = '';
    this.say('ลบวาระออกจากแผนแล้ว');
  }

  protected itemDeleteBlock(row: AgendaItem): string {
    return this.store.removeItemBlock(row.id);
  }

  protected startMove(row: AgendaItem, from: string): void {
    this.moveId = this.moveId === row.id ? '' : row.id;
    this.moveTo = this.moveTargets(row, from)[0]?.id ?? '';
  }

  protected moveTargets(row: AgendaItem, from: string): Meeting[] {
    return this.store.meetings.filter((meeting) => meeting.id !== from && this.meetingEditable(meeting) && this.bodyFits(row.measure, meeting));
  }

  protected doMove(row: AgendaItem, from: string): void {
    if (!this.moveTo) return;
    this.store.moveItemTo(row.id, from, this.moveTo);
    this.moveId = '';
    this.say('ย้ายวาระไปประชุมใหม่แล้ว');
  }

  // ───────────────────────── จัดประชุม ─────────────────────────

  protected get selected(): Meeting | undefined {
    return this.store.meetingById(this.meetingId);
  }

  /** ประชุมที่ใช้ทำงานจริง (ไม่รวมประวัติปี 2567) */
  private get opMeetings(): Meeting[] {
    const start = monthKey(`${MONTHS_TH[0]} ${PLAN_YEARS[1]}`);
    return this.store.meetings.filter((row) => monthKey(row.month) >= start);
  }

  /** แท็บประชุม — ตัดประชุมในแผนที่ยังว่าง (ไม่มีวัน ไม่มีวาระ) */
  protected get meetingTabs(): Meeting[] {
    return this.opMeetings.filter((row) => row.state !== 'plan' || !!row.on || this.store.itemsOf(row.id).length > 0);
  }

  protected get afterMeetings(): Meeting[] {
    return this.opMeetings.filter((row) => row.state === 'held' || row.state === 'closed');
  }

  protected pickMeetingTab(id: string): void {
    this.meetingId = id;
    this.stepNote = '';
    this.openComment = '';
  }

  protected stateLabel(meeting: Meeting): string {
    return { plan: 'ตามแผน', prep: 'กำลังเตรียม', held: 'ประชุมแล้ว', closed: 'ปิดงาน' }[meeting.state];
  }

  protected stateTone(meeting: Meeting): StatusTone {
    return ({ plan: 'neutral', prep: 'info', held: 'warning', closed: 'success' } as Record<string, StatusTone>)[meeting.state] ?? 'neutral';
  }

  protected startPrep(meeting: Meeting): void {
    meeting.state = 'prep';
    if (!meeting.invitees.length && meeting.body === 'tech') meeting.invitees = techRoles(meeting.sector ?? '').map((role, index) => ({ id: `n${index}`, role, rsvp: 'wait' as Rsvp, by: '' }));
    if (!meeting.invitees.length) meeting.invitees = ['ประธาน', 'ปลัดกระทรวงพาณิชย์', 'อธิบดีกรมการค้าต่างประเทศ (เลขานุการ)', 'รองอธิบดี (ผู้ช่วยเลขานุการ)', 'ผู้แทนสำนักงานเศรษฐกิจอุตสาหกรรม', 'ผู้แทนกรมศุลกากร', 'ผู้แทนกระทรวงการคลัง', 'ผู้ทรงคุณวุฒิ ด้านเศรษฐศาสตร์', 'ผู้ทรงคุณวุฒิ ด้านกฎหมาย'].map((role, index) => ({ id: `n${index}`, role, rsvp: 'wait' as Rsvp, by: '' }));
    this.store.save();
  }

  protected queuedCount(meeting: Meeting): number {
    return this.store.itemsOf(meeting.id).filter((row) => row.status === 'queued' || row.status === 'done').length;
  }

  protected stepDone(meeting: Meeting, step: StepDef): string {
    return meeting.steps[step.id] ?? '';
  }

  protected stepBlock(meeting: Meeting, step: StepDef): string {
    if (step.id === 'receive' && !this.queuedCount(meeting)) return 'ยังไม่มีวาระที่รับเข้า ไปรับจากเมนูวาระที่ส่งเข้ามาก่อน';
    const need = (STEP_AFTER[step.id] ?? []).map((id) => [...PREP_STEPS, ...POST_STEPS].find((row) => row.id === id)).find((row) => !!row && !meeting.steps[row.id]);
    if (need) return `ต้องทำขั้น “${need.label}” ก่อน`;
    if (step.id === 'rsvp' && meeting.invitees.some((row) => row.rsvp === 'wait')) return 'ยังมีผู้ที่รอตอบรับ';
    if (step.id === 'comments' && this.pendingComments(meeting)) return `ยังมีความเห็น ${this.pendingComments(meeting)} รายการที่ยังไม่ลงวาระครั้งถัดไป`;
    return '';
  }

  /** ยังติดขั้นที่ต้องทำก่อน (ต่างจากเงื่อนไขปิดขั้น เช่น ยังมีผู้รอตอบรับ) */
  protected needBefore(meeting: Meeting, step: StepDef): boolean {
    return (STEP_AFTER[step.id] ?? []).some((id) => !meeting.steps[id]);
  }

  /** เปิดหน้าทำงานของขั้น (แบบหน้าร่างเอกสารฝั่งเจ้าหน้าที่) */
  protected openStep(meeting: Meeting, step: StepDef): void {
    this.openStepId(meeting, step.id);
  }

  protected openStepId(meeting: Meeting, stepId: string): void {
    const base = PREP_STEPS.some((row) => row.id === stepId) ? '/bureau/meetings' : '/bureau/minutes';
    void this.router.navigate([base, meeting.id, stepId]);
  }

  /** เอกสารฉบับสมบูรณ์ของขั้น (ล่าสุดของแต่ละชนิด) */
  protected stepFinals(meeting: Meeting, step: StepDef): { key: string; label: string; doc: DeskDoc }[] {
    return (STEP_DOCS[step.id] ?? []).flatMap((def: StepDocDef) => {
      const doc = [...this.store.desk(`${meeting.id}:${def.key}`)].reverse().find((row) => row.final);
      return doc ? [{ key: def.key, label: def.label, doc }] : [];
    });
  }

  protected viewDesk(doc: DeskDoc): void {
    viewDeskDoc(doc);
  }

  protected downloadDesk(doc: DeskDoc): void {
    downloadDeskDoc(doc);
  }

  protected goInbox(): void {
    void this.router.navigateByUrl('/bureau/inbox');
  }

  protected undoStep(meeting: Meeting, step: StepDef): void {
    this.store.undoStep(meeting, step.id);
  }

  protected kitName(name: string): string {
    return name.replace(/^\d+\.\s*/, '').replace(/^9\.\s*/, '').replace(/\.(docx?|pdf)$/i, '');
  }

  protected get prepReady(): boolean {
    const meeting = this.selected;
    return !!meeting && PREP_STEPS.every((step) => !!meeting.steps[step.id]);
  }

  protected markHeld(meeting: Meeting): void {
    this.store.markHeld(meeting);
  }

  protected moveItem(meeting: Meeting, row: AgendaItem, delta: number): void {
    this.store.move(meeting.id, row.id, delta);
  }

  protected rsvpLabel(value: Rsvp): string {
    return RSVP_LABEL[value];
  }

  protected setRsvp(row: Invitee, value: Rsvp, meeting: Meeting): void {
    row.rsvp = value;
    row.by = value === 'wait' ? '' : 'กลุ่ม บท. กดสถานะ';
    if (value === 'wait' && meeting.steps['rsvp']) this.store.undoStep(meeting, 'rsvp');
    this.store.save();
  }

  protected allCome(meeting: Meeting): void {
    meeting.invitees.forEach((row) => { if (row.rsvp === 'wait') { row.rsvp = 'come'; row.by = 'กลุ่ม บท. กดสถานะ'; } });
    this.store.save();
  }

  protected addInvitee(meeting: Meeting): void {
    const role = this.inviteRole.trim();
    if (!role) return;
    meeting.invitees = [...meeting.invitees, { id: `x${Date.now()}`, role, rsvp: 'wait', by: '' }];
    this.inviteRole = '';
    this.store.save();
  }

  protected count(meeting: Meeting, value: Rsvp): number {
    return meeting.invitees.filter((row) => row.rsvp === value).length;
  }

  protected resetDemo(): void {
    this.store.reset();
    this.openKey = '';
    this.meetingId = this.view === 'minutes' ? this.afterMeetings[0]?.id ?? '' : this.meetingTabs.find((row) => row.state === 'prep')?.id ?? '';
  }

  // ───────────────────────── มติและรายงาน ─────────────────────────

  protected commentsOf(meeting: Meeting): CommentRow[] {
    return this.store.comments.filter((row) => row.meetingId === meeting.id);
  }

  protected pendingComments(meeting: Meeting): number {
    return this.commentsOf(meeting).filter((row) => row.status !== 'carried').length;
  }

  protected nextMeetingOf(meeting: Meeting): Meeting | undefined {
    const index = this.store.meetings.findIndex((row) => row.id === meeting.id);
    return this.store.meetings.slice(index + 1).find((row) => row.body === meeting.body && row.sector === meeting.sector && row.state !== 'closed' && row.state !== 'held');
  }

  protected commentLabel(row: CommentRow): string {
    return { new: 'รอส่งให้กลุ่ม', sent: 'ส่งกลุ่มแก้แล้ว รอกลุ่มส่งกลับ', fixed: 'กลุ่มส่งกลับแล้ว รอลงวาระ', carried: 'ลงวาระรับรองรายงานครั้งถัดไปแล้ว' }[row.status];
  }

  protected commentTone(row: CommentRow): StatusTone {
    return ({ new: 'warning', sent: 'info', fixed: 'info', carried: 'success' } as Record<string, StatusTone>)[row.status] ?? 'neutral';
  }

  protected advanceComment(row: CommentRow): void {
    this.store.advanceComment(row);
  }

  protected advanceLabel(row: CommentRow): string {
    return { new: 'ส่งให้กลุ่มแก้ไข', sent: 'บันทึกว่ากลุ่มส่งกลับแล้ว', fixed: 'ลงวาระที่ 2 ครั้งถัดไป', carried: '' }[row.status];
  }

  protected setNotify(row: CommentRow, value: boolean): void {
    row.notify = value;
    this.store.save();
  }

  protected closeMeeting(meeting: Meeting): void {
    this.store.closeMeeting(meeting);
  }

  protected get refReports(): { name: string; href: string; from: string }[] {
    return [
      { name: 'รายงานการประชุมอนุฯ ไต่สวน HR 3 พ.ย. 2563', href: `${SAMPLE_ROOT}agenda/sub/5. รายงานการประชุม HR 3 พย 63.docx`, from: 'AD1046 · อนุฯ ไต่สวน' },
      { name: 'รายงานการประชุม ทตอ. HR 9 พ.ย. 2563', href: `${SAMPLE_ROOT}agenda/tdc/6. รายงานการประชุม HR 9 พย 63.docx`, from: 'AD1046 · ทตอ.' },
      { name: 'มติ คปป. ครั้งที่ 4/2569', href: `${KIT_ROOT}11. มติ คปป 4-69.docx`, from: 'ตัวอย่างฉบับจริง · คปป.' },
      { name: 'รายงาน คปป. ครั้งที่ 4/2569', href: `${KIT_ROOT}12. รายงาน คปป. 4-69.docx`, from: 'ตัวอย่างฉบับจริง · คปป.' },
    ];
  }

  // ───────────────────────── เงินและประกาศ ─────────────────────────

  protected get moneyMeetings(): Meeting[] {
    return this.opMeetings.filter((row) => row.state !== 'plan');
  }

  protected attended(meeting: Meeting): string {
    const total = meeting.invitees.length;
    const come = this.count(meeting, 'come') + this.count(meeting, 'proxy');
    return total ? `${come}/${total}` : '—';
  }

  protected readonly visitSteps = VISIT_STEPS;
  protected visitAt(row: VisitRow, index: number): string {
    return [row.pulledAt, row.no ? `เลข ${row.no}` : '', row.sentAt, row.clearedAt][index] ?? '';
  }

  protected visitDone(row: VisitRow): number {
    return [row.pulledAt, row.no, row.sentAt, row.clearedAt].filter(Boolean).length;
  }

  protected visitLabel(row: VisitRow): string {
    return row.clearedAt ? 'เคลียร์แล้ว' : `${this.visitDone(row)}/${VISIT_STEPS.length} ขั้น`;
  }

  protected openVisit(row: VisitRow, index: number): void {
    void this.router.navigate(['/bureau/finance/visit', row.id, VISIT_STEPS[Math.min(index, VISIT_STEPS.length - 1)]?.id ?? 'pulled']);
  }

  protected gazetteDone(row: GazetteRow): number {
    return row.steps.filter((step) => !!step.at).length;
  }

  protected gazetteBlock(row: GazetteRow): string {
    const step = row.steps.find((entry) => !entry.at);
    if (!step || !step.label.startsWith('ทำหนังสือส่งราชกิจจานุเบกษา')) return '';
    if (row.kind === GZ_NOTICE) {
      if (!row.hasDept) return 'ตอบก่อนว่ามีประกาศกรมตามมาไหม';
      const dept = this.store.gazette.find((entry) => entry.id === row.deptId);
      if (row.hasDept === 'yes' && dept && !dept.steps[2]?.at) return 'รออธิบดีลงนามประกาศกรมที่ตามมา (ดูรายการประกาศกรมของเคสนี้)';
    }
    return '';
  }

  protected openGazette(row: GazetteRow, index: number): void {
    void this.router.navigate(['/bureau/gazette', row.id, String(Math.min(index, row.steps.length - 1) + 1)]);
  }

  /** ประกาศ ทตอ. ที่อัปโหลดฉบับลงนามแล้ว แต่ยังไม่ตอบว่ามีประกาศกรมไหม */
  protected askDept(row: GazetteRow): boolean {
    return row.kind === GZ_NOTICE && !row.hasDept && !!row.steps[2]?.at;
  }

  // ───────────────────────── ไฟล์ ─────────────────────────

  protected viewHref(href: string, name = ''): void {
    if (!href) return;
    if (href.startsWith('idb:')) {
      void this.openUploaded(href, name);
      return;
    }
    window.open(encodeURI(/\.docx?$/i.test(href) ? `${href}.html` : href), '_blank', 'noopener');
  }

  /** ไฟล์ที่ บท. อัปโหลดเอง: pdf/รูป เปิดดูในแท็บใหม่ ไฟล์ Office ที่เบราว์เซอร์เปิดไม่ได้ ให้ดาวน์โหลดแทน */
  private async openUploaded(href: string, name: string): Promise<void> {
    const blob = await getUploaded(href.slice(4));
    if (!blob) return;
    if (/\.(pdf|png|jpe?g|gif|txt)$/i.test(name) || /^(application\/pdf|image\/|text\/plain|text\/html)/.test(blob.type)) {
      window.open(URL.createObjectURL(blob), '_blank');
      return;
    }
    this.saveBlob(blob, name || 'ไฟล์ที่อัปโหลด');
  }

  private saveBlob(blob: Blob, name: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.click();
    URL.revokeObjectURL(url);
  }

  protected async downloadHref(href: string, name: string): Promise<void> {
    if (!href) return;
    if (href.startsWith('idb:')) {
      const blob = await getUploaded(href.slice(4));
      if (blob) this.saveBlob(blob, name);
      return;
    }
    try {
      const res = await fetch(encodeURI(href));
      if (!res.ok) throw new Error(String(res.status));
      const url = URL.createObjectURL(await res.blob());
      const link = document.createElement('a');
      link.href = url;
      link.download = name;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      this.viewHref(href);
    }
  }

  protected viewItemFile(row: AgendaItem, file: ItemFile): void {
    if (file.href) {
      this.viewHref(file.href, file.name);
      return;
    }
    const lines = [
      ['ไฟล์', file.name], ['ชนิดเอกสาร', file.title], ['ส่งโดย', row.sentBy], ['กลุ่มเจ้าของเรื่อง', row.group], ['วันที่ส่ง', file.at || row.sentAt],
      ['ผลิตภัณฑ์', row.product], ['ขั้นตอน', row.stage], ['วันครบกำหนดตามกฎหมาย', row.due || '—'],
    ];
    const html = `<!doctype html><meta charset="utf-8"><title>${file.name}</title><body style="font-family:'Sarabun','Noto Sans Thai',sans-serif;max-width:760px;margin:32px auto;line-height:1.7"><h2>${row.title}</h2><table style="border-collapse:collapse;width:100%">${lines.map(([k, v]) => `<tr><td style="border:1px solid #ddd;padding:8px;width:34%">${k}</td><td style="border:1px solid #ddd;padding:8px">${v}</td></tr>`).join('')}</table><p style="color:#666">ไฟล์ตัวอย่างจากเจ้าหน้าที่กลุ่ม แสดงเฉพาะข้อมูลสรุปของวาระ</p></body>`;
    window.open(URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' })), '_blank', 'noopener');
  }

  protected downloadItemFile(row: AgendaItem, file: ItemFile): void {
    if (file.href) {
      void this.downloadHref(file.href, file.name);
      return;
    }
    this.viewItemFile(row, file);
  }

  protected kit(name: string): string {
    return `${KIT_ROOT}${name}`;
  }

  protected roleLabel(role: string): string {
    return role === 'agenda' ? 'วาระอนุ' : 'PowerPoint';
  }
}
