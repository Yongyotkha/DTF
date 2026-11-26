import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectorRef, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { DftButton } from '../../button/button';
import { ThaiDateField } from '../../fields/thai-date-field';
import { InputField } from '../../input-field/input-field';
import { SideNav } from '../../menu-bar/side-nav';
import { StatusTag, StatusTone } from '../../status-tag/status-tag';
import { TopHeader } from '../../top-header/top-header';
import { BureauDocDesk, DeskMaker } from './bureau-desk';
import {
  BriefText, DocCtx, MinuteText, REF_REPORTS, SEAT_LAYOUTS, STEP_DOCS, SeatGeometry, StepDocDef, VISIT_DOCS, aiBrief, aiGazetteDoc, aiMeetingDoc, aiMinute, aiSeat, aiVisitDoc,
  gazetteDocs, money, onlineAttendees, seatAttendees, seatGeometry, templateBrief, templateMinute,
} from './bureau-draft';
import { downloadHref, viewHref } from './bureau-files';
import {
  AgendaItem, BODY_LABEL, BureauStore, CommentRow, DESK_TODAY, GZ_NOTICE, GazetteRow, InviteChannel, Invitee, ItemFile, Meeting, MeetingWork, POST_STEPS, PREP_STEPS, Rsvp, STEP_AFTER, SeatLayout, StepDef,
  VISIT_STEPS, VisitRow, attendeesOf, daysFromToday, shortDate, validDate, workOf,
} from './bureau-store';

type Area = 'meeting' | 'minutes' | 'gazette' | 'visit';
type TocEntry = { id: string; no: number; label: string; done: string; block: string };
type TocGroup = { label: string; entries: TocEntry[] };

const CHANNEL_LABEL: Record<InviteChannel, string> = { email: 'อีเมล', paper: 'ฉบับจริง (e-Office)', both: 'อีเมลและฉบับจริง' };
const RSVP_LABEL: Record<Rsvp, string> = { wait: 'รอตอบรับ', come: 'มา', no: 'ไม่มา', proxy: 'ส่งผู้แทน' };

const NAV: Record<Area, { open: string; active: string; title: string }> = {
  meeting: { open: 'การประชุม', active: 'เตรียมประชุม', title: 'เตรียมประชุม' },
  minutes: { open: 'การประชุม', active: 'มติและรายงานการประชุม', title: 'มติและรายงานการประชุม' },
  gazette: { open: 'เบิกจ่ายและประกาศ', active: 'ส่งราชกิจจานุเบกษา', title: 'ส่งราชกิจจานุเบกษา' },
  visit: { open: 'เบิกจ่ายและประกาศ', active: 'เบี้ยประชุมและเคลียร์เบรก', title: 'เบิกคลังและเคลียร์ค่าใช้จ่าย (Visit)' },
};

/**
 * หน้าทำงานรายขั้นของ บท. — รูปแบบเดียวกับหน้าร่างเอกสารฝั่งเจ้าหน้าที่
 * ซ้าย: รายการขั้น  ขวา: เครื่องมือของขั้น + พื้นที่เอกสาร (สร้าง / AI ช่วยร่าง / อัปเดตไฟล์ / ร่างหรือสมบูรณ์)
 * ใช้กับขั้นเตรียมประชุม งานหลังประชุม (มติ รายงาน) การส่งราชกิจจานุเบกษา และการเบิกคลัง Visit
 */
@Component({
  selector: 'app-bureau-step-page',
  imports: [TopHeader, SideNav, StatusTag, DftButton, InputField, ThaiDateField, BureauDocDesk, NgTemplateOutlet],
  templateUrl: './bureau-step.html',
  styleUrls: ['./staff-home-page.css', './bureau-page.css', './bureau-work.css', './bureau-desk.css', './bureau-step.css'],
})
export class BureauStepPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  protected readonly store = inject(BureauStore);

  protected readonly shortDate = shortDate;
  protected readonly money = money;
  protected readonly gzNotice = GZ_NOTICE;
  protected readonly layouts = SEAT_LAYOUTS;
  protected readonly refReports = REF_REPORTS;
  protected readonly bodyLabel = BODY_LABEL;
  protected readonly channels = Object.entries(CHANNEL_LABEL).map(([id, label]) => ({ id, label }));

  protected area: Area = 'meeting';
  protected rowId = '';
  protected stepId = '';
  protected info = '';
  protected error = '';
  protected notes: string[] = [];
  protected busy = false;
  protected briefId = '';
  protected minuteId = '';
  protected inviteRole = '';
  protected room = { on: '', time: '', place: '' };
  protected clear = { spent: '', left: '', attach: '' };
  private makers = new Map<string, DeskMaker>();

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed(inject(DestroyRef))).subscribe((params) => this.load(params));
  }

  private load(params: ParamMap): void {
    this.area = (this.route.snapshot.data['area'] as Area | undefined) ?? 'meeting';
    this.rowId = params.get('id') ?? '';
    this.stepId = params.get('step') ?? '';
    this.info = '';
    this.error = '';
    this.notes = [];
    this.makers = new Map();
    const meeting = this.meeting;
    if (meeting) {
      this.room = { on: meeting.on, time: meeting.time, place: meeting.place };
      const items = this.items;
      this.briefId = items[0]?.id ?? '';
      this.minuteId = items[0]?.id ?? '';
      if (this.stepId === 'brief') for (const row of items) if (!this.work.briefs[row.id]) this.work.briefs[row.id] = templateBrief(row);
      if (this.stepId === 'circulate' && !this.work.replyDays) this.work.replyDays = '7';
    }
    const visit = this.visit;
    if (visit) this.clear = { spent: visit.spent, left: visit.left, attach: visit.attach };
    this.cdr.markForCheck();
  }

  // ───────────────────────── ข้อมูลของหน้า ─────────────────────────

  protected get nav() {
    return NAV[this.area];
  }

  protected get meeting(): Meeting | undefined {
    return this.area === 'meeting' || this.area === 'minutes' ? this.store.meetingById(this.rowId) : undefined;
  }

  protected get gazette(): GazetteRow | undefined {
    return this.area === 'gazette' ? this.store.gazetteById(this.rowId) : undefined;
  }

  protected get visit(): VisitRow | undefined {
    return this.area === 'visit' ? this.store.visitById(this.rowId) : undefined;
  }

  protected get found(): boolean {
    if (this.meeting) return [...PREP_STEPS, ...POST_STEPS].some((row) => row.id === this.stepId);
    if (this.gazette) return this.gazIndex >= 0 && this.gazIndex < this.gazette.steps.length;
    if (this.visit) return VISIT_STEPS.some((row) => row.id === this.stepId);
    return false;
  }

  protected get lead(): string {
    const meeting = this.meeting;
    if (meeting) return `${meeting.name} · ${this.bodyLabel[meeting.body]}${meeting.sector ? ` (${meeting.sector})` : ''}`;
    const gz = this.gazette;
    if (gz) return `${gz.kind} · ${gz.title}`;
    const visit = this.visit;
    if (visit) return `${visit.title} · ${visit.group}`;
    return '';
  }

  protected get work(): MeetingWork {
    return workOf(this.meeting as Meeting);
  }

  protected get items(): AgendaItem[] {
    return this.meeting ? this.store.itemsOf(this.meeting.id) : [];
  }

  private get isPost(): boolean {
    return POST_STEPS.some((row) => row.id === this.stepId);
  }

  protected get isPostStep(): boolean {
    return this.isPost;
  }

  protected get rate(): number {
    return this.meeting ? Number(this.work.rate) || 0 : 0;
  }

  protected get step(): StepDef | undefined {
    return [...PREP_STEPS, ...POST_STEPS].find((row) => row.id === this.stepId);
  }

  private get gazIndex(): number {
    return Number(this.stepId) - 1;
  }

  // ───────────────────────── รายการขั้น (ซ้าย) ─────────────────────────

  protected get toc(): TocGroup[] {
    const meeting = this.meeting;
    if (meeting) {
      const entry = (row: StepDef, index: number): TocEntry => ({ id: row.id, no: index + 1, label: row.label, done: meeting.steps[row.id] ?? '', block: this.meetingBlock(meeting, row.id) });
      return [
        { label: `ก่อนประชุม (${this.store.prepDone(meeting)}/${PREP_STEPS.length})`, entries: PREP_STEPS.map(entry) },
        { label: `หลังประชุม (${this.store.postDone(meeting)}/${POST_STEPS.length})`, entries: POST_STEPS.map(entry) },
      ];
    }
    const gz = this.gazette;
    if (gz) {
      return [{ label: `${gz.kind} (${gz.steps.filter((row) => !!row.at).length}/${gz.steps.length})`, entries: gz.steps.map((row, index) => ({ id: String(index + 1), no: index + 1, label: row.label, done: row.at, block: this.gazBlockAt(gz, index) })) }];
    }
    const visit = this.visit;
    if (visit) {
      return [{ label: `การ Visit (${this.store.visitDone(visit)}/${VISIT_STEPS.length})`, entries: VISIT_STEPS.map((row, index) => ({ id: row.id, no: index + 1, label: row.label, done: this.store.visitAt(visit, row.id), block: this.visitBlockAt(visit, index) })) }];
    }
    return [];
  }

  protected dot(entry: TocEntry): string {
    if (entry.done) return 'assets/icons/por1-dot-done.svg';
    if (entry.block) return 'assets/icons/por1-dot-wait.svg';
    return 'assets/icons/por1-dot.svg';
  }

  protected entryTone(entry: TocEntry): StatusTone {
    return entry.done ? 'success' : entry.block ? 'warning' : 'info';
  }

  private get entries(): TocEntry[] {
    return this.toc.flatMap((group) => group.entries);
  }

  protected get current(): TocEntry | undefined {
    return this.entries.find((row) => row.id === this.stepId);
  }

  protected get nextEntry(): TocEntry | undefined {
    const list = this.entries;
    return list[list.findIndex((row) => row.id === this.stepId) + 1];
  }

  protected get prevEntry(): TocEntry | undefined {
    const list = this.entries;
    const at = list.findIndex((row) => row.id === this.stepId);
    return at > 0 ? list[at - 1] : undefined;
  }

  protected go(id: string): void {
    const base = this.area === 'gazette' ? '/bureau/gazette' : this.area === 'visit' ? '/bureau/finance/visit' : PREP_STEPS.some((row) => row.id === id) ? '/bureau/meetings' : '/bureau/minutes';
    void this.router.navigate([base, this.rowId, id]);
  }

  protected back(): void {
    if (this.area === 'gazette') { void this.router.navigateByUrl('/bureau/gazette'); return; }
    if (this.area === 'visit') { void this.router.navigateByUrl('/bureau/finance'); return; }
    void this.router.navigate([this.isPost ? '/bureau/minutes' : '/bureau/meetings'], { queryParams: { m: this.rowId } });
  }

  // ───────────────────────── สถานะของขั้น ─────────────────────────

  private meetingBlock(meeting: Meeting, stepId: string): string {
    if (meeting.steps[stepId]) return '';
    const post = POST_STEPS.some((row) => row.id === stepId);
    if (!post && meeting.state === 'plan') return 'การประชุมยังอยู่ในแผน กดเริ่มเตรียมประชุมที่หน้าเตรียมประชุมก่อน';
    if (post && (meeting.state === 'plan' || meeting.state === 'prep')) return 'ทำได้หลังบันทึกว่าประชุมแล้ว';
    const all = [...PREP_STEPS, ...POST_STEPS];
    const need = (STEP_AFTER[stepId] ?? []).map((id) => all.find((row) => row.id === id)).find((row) => !!row && !meeting.steps[row.id]);
    return need ? `ต้องทำขั้น “${need.label}” ก่อน` : '';
  }

  private gazBlockAt(row: GazetteRow, index: number): string {
    if (row.steps[index]?.at) return '';
    if (row.steps.slice(0, index).some((step) => !step.at)) return 'ต้องทำขั้นก่อนหน้าให้เสร็จก่อน';
    if (this.askDept) return 'ตอบก่อนว่ามีประกาศกรมตามมาไหม';
    return this.store.gazetteBlock(row);
  }

  private visitBlockAt(row: VisitRow, index: number): string {
    return !this.store.visitAt(row, VISIT_STEPS[index]?.id ?? '') && this.store.visitDone(row) < index ? 'ต้องทำขั้นก่อนหน้าให้เสร็จก่อน' : '';
  }

  protected get done(): string {
    return this.current?.done ?? '';
  }

  protected get block(): string {
    return this.current?.block ?? '';
  }

  /** แก้ไขเอกสารและเครื่องมือได้เมื่อขั้นยังไม่เสร็จและไม่ติดขั้นก่อนหน้า */
  protected get locked(): boolean {
    const meeting = this.meeting;
    if (meeting && (meeting.state === 'closed' || (!this.isPost && meeting.state !== 'prep'))) return true;
    return !!this.done || !!this.block;
  }

  protected get canUndo(): boolean {
    const meeting = this.meeting;
    if (meeting) return !!this.done && (this.isPost ? meeting.state === 'held' : meeting.state === 'prep');
    const gz = this.gazette;
    if (gz) return !!this.done && gz.steps.findIndex((row) => !row.at) !== 0;
    return !!this.done;
  }

  protected get statusLabel(): string {
    if (this.done) return `เสร็จ ${this.done}`;
    if (this.block) return 'รอขั้นก่อนหน้า';
    return 'กำลังทำ';
  }

  protected get statusTone(): StatusTone {
    return this.done ? 'success' : this.block ? 'warning' : 'info';
  }

  protected get hint(): string {
    const step = this.step;
    if (step) return step.hint;
    if (this.area === 'visit') return VISIT_STEPS.find((row) => row.id === this.stepId)?.hint ?? '';
    const gz = this.gazette;
    if (gz) return gz.kind === GZ_NOTICE ? 'ประกาศ ทตอ. ที่ลงนามแล้ว ส่ง กม. ตรวจ ให้ผู้มีอำนาจลงนาม แล้วออกเลขหนังสือส่งลงราชกิจจานุเบกษา' : 'ประกาศกรมตามมติ ส่ง กม. ตรวจ เสนออธิบดีลงนาม ส่งราชกิจจาฯ และแจ้งผู้มีส่วนได้เสีย';
    return '';
  }

  // ───────────────────────── เอกสารของขั้น ─────────────────────────

  protected get docs(): StepDocDef[] {
    if (this.meeting) return STEP_DOCS[this.stepId] ?? [];
    const gz = this.gazette;
    if (gz) return gazetteDocs(gz.kind, this.gazIndex);
    if (this.visit) return VISIT_DOCS[this.stepId] ?? [];
    return [];
  }

  protected deskKey(def: StepDocDef): string {
    if (this.area === 'gazette') return `gz:${this.rowId}:${this.gazIndex}:${def.key}`;
    if (this.area === 'visit') return `visit:${this.rowId}:${this.stepId}:${def.key}`;
    return `${this.rowId}:${def.key}`;
  }

  /** ตัวสร้างเอกสารต่อชนิด — เก็บไว้ไม่สร้างใหม่ทุกรอบ change detection */
  protected maker(def: StepDocDef): DeskMaker | undefined {
    if (def.upload) return undefined;
    let made = this.makers.get(def.key);
    if (!made) {
      const key = def.key;
      if (this.area === 'gazette') made = { ai: () => aiGazetteDoc(key, this.gazette as GazetteRow), busyText: 'กำลังดึงข้อมูลประกาศและรูปแบบจากแฟ้มเคส AD1046 กรุณารอสักครู่…' };
      else if (this.area === 'visit') made = { ai: () => aiVisitDoc(key, this.visit as VisitRow), busyText: 'กำลังดึงข้อมูลการเบิกจาก e-Office และรูปแบบเอกสาร กรุณารอสักครู่…' };
      else made = { ai: () => aiMeetingDoc(key, this.ctx()), busyText: 'กำลังดึงข้อมูลการประชุม วาระ ผู้เข้าร่วม และรูปแบบจากเอกสารฉบับจริง กรุณารอสักครู่…' };
      this.makers.set(def.key, made);
    }
    return made;
  }

  protected deskDetail(def: StepDocDef): string {
    return def.optional ? 'ไม่บังคับ' : '';
  }

  private ctx(): DocCtx {
    const meeting = this.meeting as Meeting;
    const view = this.stepId === 'room' ? { ...meeting, on: this.room.on, time: this.room.time, place: this.room.place } : meeting;
    return { meeting: view, items: this.items, prev: this.store.prevMeetingOf(meeting), next: this.store.nextMeetingOf(meeting), work: this.work, comments: this.store.commentsOf(meeting.id) };
  }

  protected onDesk(): void {
    this.error = '';
  }

  // ───────────────────────── บันทึกว่าขั้นเสร็จ ─────────────────────────

  private missingDoc(): string {
    const def = this.docs.find((entry) => !entry.optional && !this.store.deskFinal(this.deskKey(entry)));
    return def ? `“${def.label}” ยังไม่มีฉบับสมบูรณ์ — กดบันทึกเอกสาร หรือกดสถานะในตารางให้เป็นสมบูรณ์` : '';
  }

  private validate(): string {
    if (this.block) return this.block;
    const missing = this.missingDoc();
    if (missing) return missing;
    const meeting = this.meeting;
    if (meeting) {
      const rule = this.store.stepBlock(meeting, this.stepId);
      if (rule) return rule;
      switch (this.stepId) {
        case 'agenda': return this.items.length ? '' : 'ยังไม่มีวาระที่รับเข้า';
        case 'room': return this.roomError();
        case 'invite': return meeting.invitees.length ? '' : 'ยังไม่มีรายชื่อผู้รับหนังสือเชิญ';
        case 'brief': {
          const gap = this.items.findIndex((row) => !this.briefDone(row));
          return gap >= 0 ? `วาระ 3.${gap + 1} ยังไม่มี Chairman’s note หรือร่างมติ` : '';
        }
        case 'allow': return !(Number(this.work.rate) > 0) ? 'ระบุอัตราเบี้ยประชุมต่อคนตามระเบียบ' : !this.payable ? 'ยังไม่มีผู้มีสิทธิ์รับเบี้ยประชุม' : '';
        case 'seat': return this.seatRows.length ? '' : 'ยังไม่มีผู้เข้าร่วมที่ต้องจัดที่นั่ง';
        case 'transcript': {
          const gap = this.items.findIndex((row) => !this.minute(row.id).resolution.trim());
          return gap >= 0 ? `วาระ 3.${gap + 1} ยังไม่มีมติที่ประชุม` : '';
        }
        case 'circulate': {
          const days = Number(this.work.replyDays);
          return days >= 3 && days <= 7 ? '' : 'กำหนดวันให้กรรมการแจ้งแก้ไขภายใน 3–7 วันทำการ';
        }
        case 'clearbreak': return Number(this.work.snackRate) > 0 ? '' : 'ระบุค่าอาหารว่างต่อคน';
        case 'claim': return Number(this.work.rate) > 0 ? '' : 'ยังไม่มีอัตราเบี้ยประชุม (ระบุที่ขั้นทำเอกสารขออนุมัติเบี้ยประชุม)';
      }
      return '';
    }
    if (this.visit && this.stepId === 'cleared') {
      if (!this.clear.spent.trim() || !this.clear.left.trim()) return 'ระบุจำนวนที่ใช้ไปและเงินเหลือคืน';
    }
    return '';
  }

  protected finish(): void {
    this.info = '';
    this.error = '';
    if (this.done) return;
    const bad = this.validate();
    if (bad) { this.error = bad; return; }
    const meeting = this.meeting;
    if (meeting) {
      if (this.stepId === 'room') this.applyRoom();
      if (this.stepId === 'invite') {
        meeting.invitees.forEach((row) => {
          if (row.sentAt) return;
          row.channel ??= 'email';
          row.sentAt = DESK_TODAY;
        });
      }
      meeting.steps = { ...meeting.steps, [this.stepId]: DESK_TODAY };
      this.store.save();
    }
    const gz = this.gazette;
    if (gz && !this.store.gazetteNext(gz)) { this.error = this.store.gazetteBlock(gz) || 'บันทึกไม่ได้'; return; }
    const visit = this.visit;
    if (visit) {
      const attach = this.clear.attach.trim() || this.proofNames || 'ใบเสร็จและหลักฐานการจ่ายเงิน';
      if (!this.store.visitNext(visit, this.stepId === 'cleared' ? { spent: this.clear.spent.trim(), left: this.clear.left.trim(), attach } : undefined)) { this.error = 'บันทึกไม่ได้'; return; }
    }
    this.info = this.nextEntry ? `บันทึกว่าขั้นนี้เสร็จแล้ว ไปต่อที่ขั้น “${this.nextEntry.label}”` : 'บันทึกว่าขั้นนี้เสร็จแล้ว';
    if (gz && gz.no && this.gazIndex === gz.steps.findIndex((row) => row.label.startsWith('ทำหนังสือส่งราชกิจจานุเบกษา'))) this.info = `ออกเลขหนังสือ e-Office ${gz.no} แล้ว`;
    if (visit && this.stepId === 'no') this.info = `ออกเลขเอกสารเบิกคลัง ${visit.no} แล้ว`;
  }

  protected undo(): void {
    this.info = '';
    this.error = '';
    const meeting = this.meeting;
    if (meeting) this.store.undoStep(meeting, this.stepId);
    const gz = this.gazette;
    if (gz) this.store.gazetteUndo(gz, this.gazIndex);
    const visit = this.visit;
    if (visit) this.store.visitUndo(visit, this.stepId);
    this.info = 'ยกเลิกแล้ว แก้ไขเอกสารแล้วบันทึกว่าเสร็จอีกครั้ง';
  }

  protected goNext(): void {
    const next = this.nextEntry;
    if (next) this.go(next.id);
  }

  protected goPrev(): void {
    const prev = this.prevEntry;
    if (prev) this.go(prev.id);
  }

  protected get prepReady(): boolean {
    const meeting = this.meeting;
    return !!meeting && meeting.state === 'prep' && PREP_STEPS.every((row) => !!meeting.steps[row.id]);
  }

  protected get postReady(): boolean {
    const meeting = this.meeting;
    return !!meeting && meeting.state === 'held' && POST_STEPS.every((row) => !!meeting.steps[row.id]);
  }

  protected markHeld(): void {
    const meeting = this.meeting;
    if (!meeting || !this.store.markHeld(meeting)) return;
    void this.router.navigate(['/bureau/minutes', meeting.id, POST_STEPS[0]?.id ?? 'transcript']);
  }

  protected closeMeeting(): void {
    const meeting = this.meeting;
    if (!meeting || !this.store.closeMeeting(meeting)) return;
    this.info = 'ปิดงานประชุมแล้ว เรื่องย้ายไปอยู่ในช่องงานออก';
  }

  // ───────────────────────── ขั้นรับวาระ / ระเบียบวาระ ─────────────────────────

  protected goInbox(): void {
    void this.router.navigateByUrl('/bureau/inbox');
  }

  protected itemLabel(row: AgendaItem): string {
    return { plan: 'อยู่ในแผน', sent: 'ส่งเข้ามาแล้ว', queued: 'รับเข้าวาระแล้ว', done: 'พิจารณาแล้ว' }[row.status];
  }

  protected itemTone(row: AgendaItem): StatusTone {
    return ({ plan: 'neutral', sent: 'warning', queued: 'info', done: 'success' } as Record<string, StatusTone>)[row.status] ?? 'neutral';
  }

  protected moveItem(row: AgendaItem, delta: number): void {
    if (this.locked || !this.meeting) return;
    this.store.move(this.meeting.id, row.id, delta);
  }

  protected sortByDue(): void {
    if (this.locked) return;
    const gap = (row: AgendaItem) => (row.due ? (daysFromToday(row.due) ?? 99999) : 99999);
    [...this.items].sort((a, b) => gap(a) - gap(b)).forEach((row, index) => { row.slot = index + 1; });
    this.store.save();
    this.info = 'จัดลำดับตามวันครบกำหนดตามกฎหมายแล้ว (เรื่องที่ไม่มีวันครบกำหนดอยู่ท้าย) กด AI ช่วยร่างระเบียบวาระเพื่อสร้างเวอร์ชันตามลำดับใหม่';
  }

  protected viewFile(file: ItemFile): void {
    void viewHref(file.href, file.name);
  }

  protected downloadFile(file: ItemFile): void {
    void downloadHref(file.href, file.name);
  }

  protected dueLabel(row: AgendaItem): string {
    if (!row.due) return '—';
    const days = daysFromToday(row.due);
    return `${shortDate(row.due)}${days === null ? '' : days >= 0 ? ` (อีก ${days} วัน)` : ` (เลย ${-days} วัน)`}`;
  }

  // ───────────────────────── ขั้นห้องประชุม ─────────────────────────

  protected setRoom(field: 'on' | 'time' | 'place', value: string): void {
    this.room = { ...this.room, [field]: value };
  }

  protected setGuests(value: string): void {
    this.work.guests = value;
    this.store.save();
  }

  protected setSnack(value: boolean): void {
    this.work.snack = value;
    this.store.save();
  }

  private roomError(): string {
    if (!validDate(this.room.on)) return 'วันที่ประชุมต้องเป็นรูปแบบ วว/ดด/ปปปป (พ.ศ.)';
    if (!this.room.time.trim() || !this.room.place.trim()) return 'ระบุเวลาและสถานที่ประชุม';
    return '';
  }

  private applyRoom(): void {
    const meeting = this.meeting as Meeting;
    this.store.updateMeeting(meeting.id, { name: meeting.name, on: this.room.on, time: this.room.time, place: this.room.place, chair: meeting.chair, signer: meeting.signer, sector: meeting.sector });
  }

  protected confirmRoom(): void {
    if (this.locked) return;
    const bad = this.roomError();
    if (bad) { this.error = bad; return; }
    this.applyRoom();
    this.error = '';
    this.info = `ยืนยันแล้ว ${shortDate(this.room.on)} ${this.room.time} ${this.room.place}`;
  }

  // ───────────────────────── ขั้นหนังสือเชิญ ─────────────────────────

  protected channelOf(row: Invitee): InviteChannel {
    return row.channel ?? 'email';
  }

  protected channelLabel(id: string): string {
    return CHANNEL_LABEL[id as InviteChannel] ?? id;
  }

  protected setChannel(row: Invitee, value: string): void {
    if (this.locked) return;
    row.channel = value as InviteChannel;
    this.store.save();
  }

  protected setAllChannel(value: string): void {
    if (this.locked || !this.meeting) return;
    this.meeting.invitees.forEach((row) => { if (!row.sentAt) row.channel = value as InviteChannel; });
    this.store.save();
  }

  // ───────────────────────── ขั้นบรีฟประธาน ─────────────────────────

  protected get briefRow(): AgendaItem | undefined {
    return this.items.find((row) => row.id === this.briefId) ?? this.items[0];
  }

  protected brief(id: string): BriefText {
    const row = this.items.find((entry) => entry.id === id);
    return this.work.briefs[id] ?? (row ? templateBrief(row) : { note: '', resolution: '' });
  }

  protected setBrief(id: string, field: 'note' | 'resolution', value: string): void {
    if (this.locked) return;
    this.work.briefs[id] = { ...this.brief(id), [field]: value };
    this.store.save();
  }

  protected briefDone(row: AgendaItem): boolean {
    const brief = this.brief(row.id);
    return !!brief.note.trim() && !!brief.resolution.trim();
  }

  protected async aiBriefs(all: boolean): Promise<void> {
    if (this.busy || this.locked) return;
    const rows = all ? this.items : this.briefRow ? [this.briefRow] : [];
    this.busy = true;
    this.info = '';
    try {
      for (const row of rows) this.work.briefs[row.id] = await aiBrief(row);
      this.info = rows.length > 1 ? `AI ช่วยร่าง Chairman’s note ครบ ${rows.length} วาระแล้ว กด AI ช่วยร่างในเอกสารด้านล่างเพื่อรวมเป็นชุดบรีฟ` : 'AI ช่วยร่างวาระนี้แล้ว ตรวจและแก้ไขก่อนบันทึก';
      this.store.save();
    } finally {
      this.busy = false;
      this.cdr.markForCheck();
    }
  }

  // ───────────────────────── ขั้นเล่มวาระ ─────────────────────────

  private fileKey(row: AgendaItem, file: ItemFile): string {
    return `${row.id}:${file.role}`;
  }

  protected included(row: AgendaItem, file: ItemFile): boolean {
    return !this.work.bookSkip.includes(this.fileKey(row, file));
  }

  protected toggleFile(row: AgendaItem, file: ItemFile): void {
    if (this.locked) return;
    const key = this.fileKey(row, file);
    this.work.bookSkip = this.work.bookSkip.includes(key) ? this.work.bookSkip.filter((value) => value !== key) : [...this.work.bookSkip, key];
    this.store.save();
  }

  protected refOn(name: string): boolean {
    return this.work.bookRefs.includes(name);
  }

  protected toggleRef(name: string): void {
    if (this.locked) return;
    this.work.bookRefs = this.refOn(name) ? this.work.bookRefs.filter((value) => value !== name) : [...this.work.bookRefs, name];
    this.store.save();
  }

  protected viewRef(href: string, name: string): void {
    void viewHref(href, name);
  }

  // ───────────────────────── ขั้นเบี้ยประชุม ─────────────────────────

  protected setWork(field: 'rate' | 'snackRate' | 'replyDays', value: string): void {
    if (this.locked) return;
    this.work[field] = value;
    this.store.save();
  }

  protected paid(row: Invitee): boolean {
    return !this.work.skipPay.includes(row.id);
  }

  protected togglePay(row: Invitee): void {
    if (this.locked) return;
    this.work.skipPay = this.paid(row) ? [...this.work.skipPay, row.id] : this.work.skipPay.filter((value) => value !== row.id);
    this.store.save();
  }

  protected get payable(): number {
    return (this.meeting?.invitees ?? []).filter((row) => this.paid(row)).length;
  }

  protected get total(): number {
    return (Number(this.work.rate) || 0) * this.payable;
  }

  // ───────────────────────── ขั้นตอบรับ ─────────────────────────

  protected rsvpLabel(value: Rsvp): string {
    return RSVP_LABEL[value];
  }

  protected rsvpTone(value: Rsvp): StatusTone {
    return value === 'come' ? 'success' : value === 'wait' ? 'neutral' : 'warning';
  }

  protected count(value: Rsvp): number {
    return (this.meeting?.invitees ?? []).filter((row) => row.rsvp === value).length;
  }

  protected setRsvp(row: Invitee, value: Rsvp): void {
    if (this.locked) return;
    row.rsvp = value;
    row.by = value === 'wait' ? '' : 'กลุ่ม บท. กดสถานะ';
    this.store.save();
  }

  protected allCome(): void {
    if (this.locked) return;
    this.meeting?.invitees.forEach((row) => { if (row.rsvp === 'wait') { row.rsvp = 'come'; row.by = 'กลุ่ม บท. กดสถานะ'; } });
    this.store.save();
  }

  protected addInvitee(): void {
    const role = this.inviteRole.trim();
    const meeting = this.meeting;
    if (!role || !meeting || this.locked) return;
    meeting.invitees = [...meeting.invitees, { id: `x${Date.now()}`, role, rsvp: 'wait', by: '' }];
    this.inviteRole = '';
    this.store.save();
  }

  // ───────────────────────── ผังที่นั่ง ─────────────────────────

  protected get layout(): SeatLayout {
    return this.work.seat?.layout ?? 'u';
  }

  protected get seatBy(): string {
    return { list: 'เรียงตามรายชื่อ', ai: 'AI จัดให้', manual: 'ปรับเอง' }[this.work.seat?.by ?? 'list'];
  }

  private orderIds(): string[] {
    const ids = seatAttendees(this.meeting?.invitees ?? []).map((row) => row.id);
    const old = this.work.seat?.order ?? [];
    return [...old.filter((id) => ids.includes(id)), ...ids.filter((id) => !old.includes(id))];
  }

  protected get seatRows(): Invitee[] {
    const rows = new Map((this.meeting?.invitees ?? []).map((row) => [row.id, row]));
    return this.orderIds().map((id) => rows.get(id)).filter((row): row is Invitee => !!row);
  }

  protected get online(): Invitee[] {
    return onlineAttendees(this.meeting?.invitees ?? []);
  }

  protected get absent(): number {
    return this.count('no');
  }

  protected get geo(): SeatGeometry {
    return seatGeometry(this.layout, this.seatRows.length);
  }

  protected setLayout(layout: SeatLayout): void {
    if (this.locked) return;
    this.work.seat = { layout, order: this.orderIds(), by: this.work.seat?.by ?? 'list' };
    this.store.save();
  }

  protected arrangeList(): void {
    if (this.locked) return;
    this.work.seat = { layout: this.layout, order: seatAttendees(this.meeting?.invitees ?? []).map((row) => row.id), by: 'list' };
    this.notes = [];
    this.info = 'เรียงตามลำดับรายชื่อแล้ว';
    this.store.save();
  }

  protected async arrangeAi(): Promise<void> {
    if (this.busy || this.locked) return;
    this.busy = true;
    this.info = '';
    try {
      const result = await aiSeat(this.meeting?.invitees ?? []);
      this.work.seat = { layout: this.layout, order: result.order, by: 'ai' };
      this.notes = result.notes;
      this.info = 'AI จัดผังให้แล้ว สลับที่นั่งเองได้ด้วยปุ่มขึ้น/ลง แล้วกด AI ช่วยร่างในเอกสารด้านล่างเพื่อสร้างผังฉบับพิมพ์';
      this.store.save();
    } finally {
      this.busy = false;
      this.cdr.markForCheck();
    }
  }

  protected moveSeat(index: number, delta: number): void {
    if (this.locked) return;
    const order = this.orderIds();
    const other = index + delta;
    if (other < 0 || other >= order.length) return;
    [order[index], order[other]] = [order[other] as string, order[index] as string];
    this.work.seat = { layout: this.layout, order, by: 'manual' };
    this.store.save();
  }

  // ───────────────────────── ขั้นถอดเทป (มติ) ─────────────────────────

  protected get minuteRow(): AgendaItem | undefined {
    return this.items.find((row) => row.id === this.minuteId) ?? this.items[0];
  }

  protected minute(id: string): MinuteText {
    const row = this.items.find((entry) => entry.id === id);
    return this.work.minutes?.[id] ?? (row ? templateMinute(row, this.work.briefs[id]) : { chair: '', resolution: '' });
  }

  protected minuteDone(row: AgendaItem): boolean {
    const text = this.work.minutes?.[row.id];
    return !!text?.chair.trim() && !!text.resolution.trim();
  }

  protected setMinute(id: string, field: 'chair' | 'resolution', value: string): void {
    if (this.locked) return;
    this.work.minutes = { ...(this.work.minutes ?? {}), [id]: { ...this.minute(id), [field]: value } };
    this.store.save();
  }

  protected async aiMinutes(all: boolean): Promise<void> {
    if (this.busy || this.locked) return;
    const rows = all ? this.items : this.minuteRow ? [this.minuteRow] : [];
    this.busy = true;
    this.info = '';
    try {
      const next = { ...(this.work.minutes ?? {}) };
      for (const row of rows) next[row.id] = await aiMinute(row, this.work.briefs[row.id]);
      this.work.minutes = next;
      this.info = rows.length > 1 ? `AI ถอดถ้อยคำประธานและมติครบ ${rows.length} วาระแล้ว ตรวจกับเทปบันทึกการประชุม แล้วกด AI ช่วยร่างในเอกสารด้านล่าง` : 'AI ช่วยร่างวาระนี้แล้ว ตรวจกับเทปบันทึกการประชุมก่อนบันทึก';
      this.store.save();
    } finally {
      this.busy = false;
      this.cdr.markForCheck();
    }
  }

  protected setTime(field: 'startAt' | 'endAt', value: string): void {
    if (this.locked) return;
    this.work[field] = value;
    this.store.save();
  }

  // ───────────────────────── ขั้นความเห็นกรรมการ ─────────────────────────

  protected get comments(): CommentRow[] {
    return this.meeting ? this.store.commentsOf(this.meeting.id) : [];
  }

  protected get nextMeeting(): Meeting | undefined {
    return this.meeting ? this.store.nextMeetingOf(this.meeting) : undefined;
  }

  protected commentLabel(row: CommentRow): string {
    return { new: 'รอส่งให้กลุ่ม', sent: 'ส่งกลุ่มแก้แล้ว รอกลุ่มส่งกลับ', fixed: 'กลุ่มส่งกลับแล้ว รอลงวาระ', carried: 'ลงวาระรับรองรายงานครั้งถัดไปแล้ว' }[row.status];
  }

  protected commentTone(row: CommentRow): StatusTone {
    return ({ new: 'warning', sent: 'info', fixed: 'info', carried: 'success' } as Record<string, StatusTone>)[row.status] ?? 'neutral';
  }

  protected advanceLabel(row: CommentRow): string {
    return { new: 'ส่งให้กลุ่มแก้ไข', sent: 'บันทึกว่ากลุ่มส่งกลับแล้ว', fixed: 'ลงวาระที่ 2 ครั้งถัดไป', carried: '' }[row.status];
  }

  protected advanceComment(row: CommentRow): void {
    if (this.locked) return;
    this.store.advanceComment(row);
  }

  protected setNotify(row: CommentRow, value: boolean): void {
    if (this.locked) return;
    row.notify = value;
    this.store.save();
  }

  protected setAfter(row: CommentRow, value: string): void {
    if (this.locked) return;
    row.after = value;
    this.store.save();
  }

  // ───────────────────────── เคลียร์เบรกและเบิกตามจริง ─────────────────────────

  protected get invitees(): Invitee[] {
    return this.meeting?.invitees ?? [];
  }

  protected get attendees(): Invitee[] {
    return this.meeting ? attendeesOf(this.meeting) : [];
  }

  protected confirmed(row: Invitee): boolean {
    return row.rsvp === 'come' || row.rsvp === 'proxy';
  }

  protected present(row: Invitee): boolean {
    return this.confirmed(row) && !(this.work.noShow ?? []).includes(row.id);
  }

  protected togglePresent(row: Invitee): void {
    if (this.locked || !this.confirmed(row)) return;
    const list = this.work.noShow ?? [];
    this.work.noShow = list.includes(row.id) ? list.filter((id) => id !== row.id) : [...list, row.id];
    this.store.save();
  }

  protected get snackTotal(): number {
    return (Number(this.work.snackRate) || 0) * this.attendees.length;
  }

  protected get claimRows(): Invitee[] {
    return this.attendees.filter((row) => this.paid(row));
  }

  protected get claimTotal(): number {
    return (Number(this.work.rate) || 0) * this.claimRows.length;
  }

  // ───────────────────────── ประกาศ ─────────────────────────

  protected get askDept(): boolean {
    const gz = this.gazette;
    return !!gz && gz.kind === GZ_NOTICE && !gz.hasDept && !!gz.steps[2]?.at;
  }

  protected answerDept(yes: boolean): void {
    const gz = this.gazette;
    if (!gz) return;
    this.store.answerDept(gz, yes);
    this.info = yes ? 'เปิดรายการประกาศกรมของเคสนี้แล้ว (ดูที่หน้าส่งราชกิจจานุเบกษา)' : 'บันทึกว่าไม่มีประกาศกรมตามมา';
  }

  protected get deptRow(): GazetteRow | undefined {
    const gz = this.gazette;
    return gz?.deptId ? this.store.gazetteById(gz.deptId) : undefined;
  }

  protected get deptDone(): number {
    return this.deptRow?.steps.filter((row) => !!row.at).length ?? 0;
  }

  protected openDept(): void {
    const dept = this.deptRow;
    if (dept) void this.router.navigate(['/bureau/gazette', dept.id, String(Math.min(dept.steps.length, dept.steps.findIndex((row) => !row.at) + 1 || dept.steps.length))]);
  }

  protected viewCaseFile(href: string, name: string): void {
    void viewHref(href, name);
  }

  protected downloadCaseFile(href: string, name: string): void {
    void downloadHref(href, name);
  }

  // ───────────────────────── Visit ─────────────────────────

  protected setClear(field: 'spent' | 'left' | 'attach', value: string): void {
    this.clear = { ...this.clear, [field]: value };
    const visit = this.visit;
    if (visit && !this.locked) {
      visit[field] = value;
      this.store.save();
    }
  }

  protected get proofNames(): string {
    return this.store.desk(`visit:${this.rowId}:cleared:visit-proof`).map((row) => row.fileName).join(', ');
  }

  protected get visitAction(): string {
    return ({ pulled: 'ดึงข้อมูลจาก e-Office และบันทึกว่าเสร็จ', no: 'ออกเลข e-Office และบันทึกว่าเสร็จ', sent: 'บันทึกว่าส่งเข้ากรมคลังแล้ว', cleared: 'บันทึกการเคลียร์ค่าใช้จ่าย' } as Record<string, string>)[this.stepId] ?? 'บันทึกว่าขั้นนี้เสร็จ';
  }

  protected get finishLabel(): string {
    if (this.area === 'visit') return this.visitAction;
    if (this.area === 'gazette' && this.gazette?.steps[this.gazIndex]?.label.startsWith('ทำหนังสือส่งราชกิจจานุเบกษา')) return 'ออกเลขหนังสือและบันทึกว่าเสร็จ';
    if (this.stepId === 'invite') return 'บันทึกว่าส่งหนังสือเชิญแล้ว';
    return 'บันทึกว่าขั้นนี้เสร็จ';
  }
}
