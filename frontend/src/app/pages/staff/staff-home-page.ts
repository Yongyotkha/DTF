import { Component, OnDestroy, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Accounts } from '../../accounts';
import { DftButton } from '../../button/button';
import { SideNav } from '../../menu-bar/side-nav';
import { StatusTag, StatusTone } from '../../status-tag/status-tag';
import { TopHeader } from '../../top-header/top-header';
import { assignmentReachesOfficer, groupHead, groupMembers, staffPeople, workGroups } from './staff-roster';
import { acceptedAssignees, addThaiMonths, assignmentStepLabel, assignmentStepTone, caseStatusLabel, consultAwaitingDirector, consultChannelLabel, filingOfficer, filingRefId, filingUnit, firstFiledOn, readCaseStatus, readConsult, readConsultAssigned, readConsultGroup, readConsultPlan, readConsultStep, readWorkAssignment, writeApprovedBy, writeCaseStatus, writeConsultAssigned, writeConsultGroup, writeConsultPlan, writeConsultStep, writeWorkAssignment, type ConsultChannel, type ConsultPlan, type ConsultStep } from '../requests/case-status';

type Bucket = 'in' | 'pending' | 'out' | 'follow' | 'group';
type WorkKind = 'request' | 'job' | 'track';
type WorkBucket = 'in' | 'wait' | 'doing' | 'pending' | 'out' | 'follow' | 'group';
type DeskFilter = WorkKind | WorkBucket;

type TaskCase = {
  code: string;
  title: string;
  kind: WorkKind;
  bucket: WorkBucket;
  product: string;
  sender: string;
  group: string;
  at: string;
  status: string;
  due: string;
  tone: StatusTone;
};

const buckets: { id: Bucket; label: string; count: number; icon: string; tone: string }[] = [
  { id: 'in', label: 'งานรับเข้า', count: 3, icon: 'assets/icons/task-in.svg', tone: 'var(--color-primary)' },
  { id: 'pending', label: 'งานค้าง', count: 0, icon: 'assets/icons/task-pending.svg', tone: 'var(--color-error-red)' },
  { id: 'out', label: 'งานออก', count: 3, icon: 'assets/icons/task-out.svg', tone: 'var(--color-success)' },
  { id: 'follow', label: 'งานที่ต้องติดตาม', count: 1, icon: 'assets/icons/task-follow.svg', tone: 'var(--color-selected-orange)' },
  { id: 'group', label: 'งานระหว่างดำเนินการของกลุ่ม', count: 1, icon: 'assets/icons/task-group.svg', tone: 'var(--color-link-hover)' },
];

const sample: TaskCase = {
  code: 'AD2601',
  title: 'ยื่นคำขอ',
  kind: 'request',
  bucket: 'in',
  product: 'เหล็กแผ่นรีดร้อน (Hot-Rolled Steel)',
  sender: 'บริษัท สยามสติลการค้า จำกัด',
  group: 'กลุ่มบท.ลงรับ',
  at: '24/09/2569 09:30:15',
  status: 'ยื่นคำขอ',
  due: '',
  tone: 'info',
};

@Component({
  selector: 'app-staff-home-page',
  imports: [TopHeader, SideNav, StatusTag, DftButton],
  templateUrl: './staff-home-page.html',
  styleUrl: './staff-home-page.css',
})
export class StaffHomePage implements OnDestroy {
  protected readonly buckets = buckets;
  protected readonly filingRef = filingRefId;
  protected readonly firstFiled = firstFiledOn;
  protected readonly amendUntil = addThaiMonths(firstFiledOn, 4);
  protected readonly officerName = filingOfficer;
  protected readonly officerUnit = filingUnit;
  protected readonly applicantName = 'บมจ. สหวิริยาสตีลอินดัสตรี';
  protected awaitingApproval = readCaseStatus() === 'approval';
  protected awaitingConsult = false;
  protected consultAssigned = false;
  protected consultStep: ConsultStep = 'receive';
  protected consultMember = '';
  protected consultPlan: ConsultPlan | null = null;
  protected consultTopic = '';
  protected consultWhen = '';
  protected openCode = '';
  protected channelOn: Record<ConsultChannel, boolean> = { chat: true, phone: false, email: false, other: false };
  protected channelPhone = '';
  protected channelEmail = '';
  protected channelOther = '';
  private assignTimer = 0;
  protected selected: Bucket = 'in';
  protected deskFilter: DeskFilter = 'wait';
  protected query = '';
  protected assignOpen = false;
  protected readonly consultGroups = workGroups;
  protected consultGroup = workGroups[0]?.name ?? '';

  private readonly accounts = inject(Accounts);

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
  ) {
    if (this.role === 'officer') this.deskFilter = 'in';
    else if (this.role === 'director') this.deskFilter = 'request';
    this.refreshConsult();
    this.assignTimer = window.setInterval(() => this.refreshConsult(), 1000);
  }

  protected get role(): string {
    return this.route.snapshot.data['role'] ?? 'staff';
  }

  protected get styled(): boolean {
    return this.role === 'director' || this.role === 'head' || this.role === 'officer';
  }

  protected get deskStats(): { id: DeskFilter; label: string; count: number }[] {
    if (this.role === 'officer') {
      const consultOpen = readCaseStatus() === 'consult' && !!readConsult();
      const mine = consultOpen
        ? (this.officerOwnsConsult() ? 1 : 0)
        : (assignmentReachesOfficer(readWorkAssignment(), this.consultAssigned) ? 1 : 0);
      return [
        { id: 'in', label: 'งานรับเข้า', count: mine },
        { id: 'wait', label: 'รอมอบหมาย', count: 0 },
        { id: 'pending', label: 'งานค้าง', count: 0 },
        { id: 'out', label: 'งานออก', count: 0 },
        { id: 'follow', label: 'ต้องติดตาม', count: 0 },
        { id: 'group', label: 'งานของกลุ่ม', count: 0 },
      ];
    }
    const rows = this.directorCatalog();
    const count = (bucket: WorkBucket) => rows.filter((row) => row.bucket === bucket).length;
    return [
      { id: 'in', label: 'งานรับเข้า', count: rows.filter((row) => row.bucket === 'in' || row.bucket === 'wait').length },
      { id: 'wait', label: 'รอมอบหมาย', count: count('wait') },
      { id: 'pending', label: 'งานค้าง', count: count('pending') },
      { id: 'out', label: 'งานออก', count: count('out') },
      { id: 'follow', label: 'ต้องติดตาม', count: count('follow') },
      { id: 'group', label: 'งานของกลุ่ม', count: rows.filter((row) => row.bucket === 'group' || row.bucket === 'doing').length },
    ];
  }

  protected get listTitle(): string {
    if (this.deskFilter === 'request') return 'คำขอ';
    if (this.deskFilter === 'job') return 'งาน';
    if (this.deskFilter === 'track') return 'ติดตาม';
    return this.deskStats.find((item) => item.id === this.deskFilter)?.label ?? 'รายการงาน';
  }

  protected pickDesk(filter: DeskFilter): void {
    this.deskFilter = filter;
  }

  protected get channelText(): string {
    return this.consultPlan ? consultChannelLabel(this.consultPlan) : '';
  }

  protected toggleJob(code: string): void {
    this.openCode = this.openCode === code ? '' : code;
  }

  protected get deskRows(): TaskCase[] {
    const text = this.query.trim();
    const filters: DeskFilter[] = text ? ['in', 'wait', 'doing', 'pending', 'out', 'follow', 'group'] : [this.deskFilter];
    const seen = new Set<string>();
    const rows: TaskCase[] = [];
    for (const filter of filters) {
      const batch = this.role === 'officer' ? this.officerJobs(filter) : this.directorJobs(filter);
      for (const row of batch) {
        const key = row.code + row.status;
        if (seen.has(key)) continue;
        const haystack = `${row.code} ${row.title} ${row.sender} ${row.product} ${row.status} ${row.group} ${row.code === this.filingRef ? this.consultTopic : ''}`;
        if (text && !haystack.includes(text)) continue;
        seen.add(key);
        rows.push(row);
      }
    }
    return rows;
  }

  private liveJob(status: string, tone: StatusTone): TaskCase {
    return {
      code: this.filingRef,
      title: 'ขอพบเจ้าหน้าที่',
      kind: 'job',
      bucket: 'in',
      product: 'เหล็กแผ่นรีดร้อนจากเวียดนามและอียิปต์',
      sender: this.applicantName,
      group: this.officerName,
      at: this.consultWhen || '16/05/2562 10:00',
      status,
      due: `ครบกำหนดแก้ไขเพิ่มเติม ${this.amendUntil}`,
      tone,
    };
  }

  protected get consultIntakeOpen(): boolean {
    return readCaseStatus() === 'consult' && !!readConsult() && (this.consultStep === 'receive' || this.consultStep === 'forward');
  }

  private officerOwnsConsult(): boolean {
    if (readCaseStatus() !== 'consult' || !readConsult() || this.consultStep !== 'member' || !this.consultAssigned) return false;
    const me = this.accounts.personName;
    const saved = readWorkAssignment();
    if (!me) return saved.people.length > 0 || saved.hands.length > 0;
    return saved.people.includes(me) || saved.hands.some((hand) => hand.name === me);
  }

  private officerJobs(filter: DeskFilter): TaskCase[] {
    if (filter !== 'in' && filter !== 'doing') return [];
    if (readCaseStatus() === 'consult' && readConsult()) {
      return this.officerOwnsConsult() ? [this.liveJob(assignmentStepLabel(readWorkAssignment()), assignmentStepTone(readWorkAssignment()))] : [];
    }
    if (this.awaitingApproval) return [this.liveJob(this.canApprove ? 'รอคุณอนุมัติการยื่นแบบ' : 'รอผู้รับมอบหมายอนุมัติ', 'warning')];
    if (!assignmentReachesOfficer(readWorkAssignment(), this.consultAssigned)) return [];
    const saved = readWorkAssignment();
    return [this.liveJob(assignmentStepLabel(saved), assignmentStepTone(saved))];
  }

  private directorCatalog(): TaskCase[] {
    const saved = readWorkAssignment();
    const caretaker = saved.groups[0] || saved.people[0] || this.officerUnit;
    const filing: TaskCase = {
      code: this.filingRef,
      title: 'ยื่นคำขอแบบ ปร.1',
      kind: 'request',
      bucket: 'in',
      product: 'เหล็กแผ่นรีดร้อนจากเวียดนามและอียิปต์',
      sender: this.applicantName,
      group: this.officerUnit,
      at: '16/05/2562',
      status: caseStatusLabel(readCaseStatus()),
      due: `ครบกำหนดแก้ไขเพิ่มเติม ${this.amendUntil}`,
      tone: 'info',
    };
    const rows: TaskCase[] = [filing];
    if (readCaseStatus() === 'consult' && readConsult() && this.consultStep !== 'receive' && this.consultStep !== 'forward') {
      const waitingGroup = this.consultStep === 'director';
      rows.push({
        ...filing,
        title: 'ขอพบเจ้าหน้าที่',
        kind: this.consultStep === 'member' ? 'job' : 'request',
        bucket: this.consultStep === 'member' ? 'group' : 'wait',
        group: waitingGroup ? 'รอผู้อำนวยการมอบหมาย' : (readConsultGroup() || caretaker),
        at: this.consultWhen || '16/05/2562 10:00',
        status: waitingGroup ? 'รอมอบหมายกลุ่ม' : this.consultStep === 'group' ? 'รอหัวหน้ากลุ่มมอบหมายเจ้าหน้าที่' : assignmentStepLabel(saved),
        tone: this.consultStep === 'member' ? assignmentStepTone(saved) : 'warning',
      });
    }
    rows.push(
      {
        ...filing,
        title: 'พิจารณาคำขอ',
        kind: 'job',
        bucket: 'doing',
        group: 'กลุ่มงานมาตรการตอบโต้การทุ่มตลาด (AD)',
        at: '16/05/2562',
        status: 'กำลังดำเนินการ',
        due: 'ครบกำหนด 30/05/2562',
        tone: 'info',
      },
      {
        ...filing,
        title: 'ลงรับจากระบบสารบรรณ',
        kind: 'job',
        bucket: 'out',
        group: 'กลุ่ม บท.',
        at: '16/05/2562 10:00',
        status: 'งานออก',
        due: '',
        tone: 'success',
      },
      {
        ...filing,
        title: 'รายงานผลการพิจารณา',
        kind: 'track',
        bucket: 'follow',
        group: 'หัวหน้ากลุ่ม',
        at: '20/05/2562',
        status: 'รอตรวจสอบ',
        due: 'ครบกำหนด 23/05/2562',
        tone: 'warning',
      },
      {
        ...filing,
        title: 'แบบสอบถามรอคำตอบ',
        kind: 'track',
        bucket: 'pending',
        group: 'กลุ่มงานมาตรการตอบโต้การทุ่มตลาด (AD)',
        at: '16/05/2562',
        status: 'งานค้าง',
        due: 'ครบกำหนด 18/05/2562',
        tone: 'danger',
      },
    );
    return rows;
  }

  private directorJobs(filter: DeskFilter): TaskCase[] {
    const rows = this.directorCatalog();
    if (filter === 'request' || filter === 'job' || filter === 'track') return rows.filter((row) => row.kind === filter);
    if (filter === 'in') return rows.filter((row) => row.bucket === 'in' || row.bucket === 'wait');
    if (filter === 'group') return rows.filter((row) => row.bucket === 'group' || row.bucket === 'doing');
    return rows.filter((row) => row.bucket === filter);
  }

  protected get bucketView() {
    return buckets.map((item) => {
      const consultIn = item.id === 'in' && ((this.role === 'head' && this.headsThisGroup && (this.consultStep === 'group' || this.consultAssigned)) || (this.role === 'staff' && this.consultIntakeOpen));
      return consultIn ? { ...item, count: item.count + 1 } : item;
    });
  }

  protected get current() {
    const found = this.bucketView.find((item) => item.id === this.selected) ?? this.bucketView[0];
    return found;
  }

  protected get rows(): TaskCase[] {
    let group = sample.group;
    let status = sample.status;
    let tone: StatusTone = this.styled ? 'neutral' : 'info';
    let due = '';
    if (this.role === 'director') group = 'ผอ. มอบหมาย';
    if (this.role === 'head') {
      group = this.selected === 'group' ? 'ผอ. มอบหมาย' : 'หัวหน้ารายงานผลหรือส่งต่อ';
      if (this.selected === 'in') due = 'วันที่ครบกำหนดส่ง : 24/09/2569';
      if (this.selected === 'out') {
        status = 'กระบวนการไต่สวน';
        tone = 'success';
      }
    }
    if (this.role === 'officer') {
      group = 'เจ้าหน้าที่ดำเนินการ';
      if (this.selected === 'in') due = 'วันที่ครบกำหนดส่ง : 24/09/2569';
      if (this.selected === 'out') {
        status = 'กระบวนการไต่สวน';
        tone = 'success';
      }
    }
    const rows = Array.from({ length: buckets.find((item) => item.id === this.selected)?.count ?? 0 }, () => ({ ...sample, group, status, due, tone }));
    if (this.role === 'head' && this.headsThisGroup && this.selected === 'in' && readCaseStatus() === 'consult' && (this.consultStep === 'group' || this.consultAssigned)) {
      const saved = readWorkAssignment();
      return [this.assignedConsultJob(readConsultGroup() || saved.groups[0] || saved.people[0] || 'กลุ่มงานมาตรการตอบโต้การทุ่มตลาด (AD)'), ...rows];
    }
    if (this.role === 'staff' && this.selected === 'in' && this.consultIntakeOpen) {
      return [this.liveJob('รอมอบหมายให้ผู้อำนวยการ', 'warning'), ...rows];
    }
    if (this.selected !== 'in' || !this.awaitingConsult) return rows;
    return [
      {
        code: this.filingRef,
        title: 'ขอพบเจ้าหน้าที่',
        kind: 'request',
        bucket: 'wait',
        product: 'เหล็กแผ่นรีดร้อนจากเวียดนามและอียิปต์',
        sender: this.applicantName,
        group: 'ผอ. มอบหมาย',
        at: this.consultWhen,
        status: 'รอมอบหมายผู้ดูแล',
        due: '',
        tone: 'warning',
      },
      ...rows,
    ];
  }

  protected approverNames(): string[] {
    return acceptedAssignees(readWorkAssignment());
  }

  protected get canApprove(): boolean {
    const name = this.accounts.personName;
    return !!name && this.awaitingApproval && this.approverNames().includes(name);
  }

  protected jobLabel(row: TaskCase): string {
    if (row.code === this.filingRef && this.canApprove) return 'อนุมัติการยื่นแบบ';
    if (this.role === 'director' && this.awaitingConsult && row.title === 'ขอพบเจ้าหน้าที่') return 'มอบหมายกลุ่ม';
    return 'ดูคำขอ';
  }

  protected jobClick(row: TaskCase): void {
    if (row.code === this.filingRef && this.canApprove) {
      this.approveFiling();
      return;
    }
    if (this.role === 'director' && this.awaitingConsult && row.title === 'ขอพบเจ้าหน้าที่') {
      this.openCode = row.code + row.title;
      this.assignOpen = true;
      return;
    }
    this.openFiling();
  }

  protected get headsThisGroup(): boolean {
    if (this.role !== 'head') return false;
    const me = this.accounts.personName;
    const head = groupHead(readConsultGroup());
    return !me || !head || me === head;
  }

  protected get consultDirectorName(): string {
    return staffPeople.find((person) => person.title.includes('ผู้อำนวยการ'))?.name ?? 'ผู้อำนวยการ';
  }

  protected assignIntake(): void {
    if (this.role !== 'staff' || !this.consultIntakeOpen) return;
    const saved = readWorkAssignment();
    const people = saved.people.includes(this.consultDirectorName) ? saved.people : [...saved.people, this.consultDirectorName];
    writeWorkAssignment({ ...saved, people });
    writeConsultGroup('');
    writeConsultStep('director');
    this.refreshConsult();
  }

  protected advanceConsultIntake(): void {
    if (this.consultStep === 'receive') writeConsultStep('forward');
    else if (this.consultStep === 'forward') writeConsultStep('director');
    this.refreshConsult();
  }

  protected get consultMembers() {
    const group = readConsultGroup();
    const members = groupMembers(group);
    if (members.length) return members;
    return staffPeople.filter((person) => person.work === group && person.lead);
  }

  protected get consultGroupName(): string {
    return readConsultGroup();
  }

  protected get consultAssigneeText(): string {
    if (this.consultStep === 'member') {
      return readWorkAssignment().hands.at(-1)?.name || readConsultGroup() || 'มอบหมายแล้ว';
    }
    if (this.consultStep === 'group') return `${readConsultGroup() || 'กลุ่มงาน'} รอเลือกเจ้าหน้าที่`;
    if (this.consultStep === 'director') return 'รอผู้อำนวยการมอบหมายกลุ่ม';
    if (this.consultStep === 'forward' || this.consultStep === 'receive') return 'รอเจ้าหน้าที่รับเรื่องมอบหมายให้ผู้อำนวยการ';
    return 'รอเจ้าหน้าที่รับเรื่องมอบหมาย';
  }

  protected get consultTrackText(): string {
    if (this.role === 'officer' && this.consultStep === 'receive') return 'รอคุณรับเรื่อง แล้วส่งให้ผู้อำนวยการ';
    if (this.role === 'officer' && this.consultStep === 'forward') return 'รับเรื่องแล้ว ส่งให้ผู้อำนวยการกอง';
    if (this.role === 'director' && this.consultStep === 'director') return 'มอบหมายได้เฉพาะกลุ่มงาน';
    if (this.consultStep === 'group') return 'รอหัวหน้ากลุ่มมอบหมายเจ้าหน้าที่ในกลุ่ม';
    if (this.consultAssigned) return 'มอบหมายเจ้าหน้าที่ในกลุ่มแล้ว';
    return 'รอเจ้าหน้าที่รับเรื่อง';
  }

  protected assignConsultGroup(): void {
    if (!consultAwaitingDirector() || !this.consultGroup) return;
    const head = groupHead(this.consultGroup);
    if (!head) return;
    writeConsultPlan({ channels: ['chat'], phone: '', email: '', other: '' });
    const saved = readWorkAssignment();
    const groups = saved.groups.includes(this.consultGroup) ? saved.groups : [...saved.groups, this.consultGroup];
    const groupTasks = groups.flatMap((name) => {
      const current = saved.groupTasks.find((task) => task.group === name);
      if (current) return [current];
      const lead = groupHead(name);
      return lead ? [{ group: name, head: lead, reply: 'pending' as const, reason: '' }] : [];
    });
    writeWorkAssignment({
      people: saved.people,
      groups,
      note: saved.note,
      order: saved.order || 'ดูแลคำร้องขอพบเจ้าหน้าที่',
      assignedOn: saved.assignedOn || '16/05/2562',
      dueOn: saved.dueOn || '30/05/2562',
      reply: saved.reply,
      reason: saved.reason,
      groupTasks,
      hands: saved.hands,
      slips: saved.slips,
    });
    writeConsultGroup(this.consultGroup);
    writeConsultStep('group');
    const members = groupMembers(this.consultGroup);
    this.consultMember = members[0]?.name ?? groupHead(this.consultGroup);
    this.refreshConsult();
  }

  protected assignConsultMember(): void {
    if (readConsultStep() !== 'group' || !this.consultMember) return;
    const saved = readWorkAssignment();
    const group = readConsultGroup();
    const hands = saved.hands.some((hand) => hand.name === this.consultMember)
      ? saved.hands
      : [...saved.hands, { name: this.consultMember, group, reply: 'pending' as const, reason: '' }];
    const people = saved.people.includes(this.consultMember) ? saved.people : [...saved.people, this.consultMember];
    writeWorkAssignment({ ...saved, people, hands });
    writeConsultPlan({ channels: ['chat'], phone: '', email: '', other: '' });
    writeConsultStep('member');
    writeConsultAssigned(true);
    this.refreshConsult();
  }

  protected approveFiling(): void {
    if (readCaseStatus() !== 'approval' || !this.canApprove) return;
    writeApprovedBy(this.accounts.personName);
    writeCaseStatus('official');
    this.awaitingApproval = false;
  }

  protected toggleChannel(channel: ConsultChannel): void {
    this.channelOn = { ...this.channelOn, [channel]: !this.channelOn[channel] };
  }

  protected get canAssign(): boolean {
    const picked = this.channelOn.chat || this.channelOn.phone || this.channelOn.email || this.channelOn.other;
    return picked && (!this.channelOn.other || this.channelOther.trim().length > 0);
  }

  protected startAssign(): void {
    if (!this.assignOpen) {
      this.assignOpen = true;
      return;
    }
    this.assignConsult();
  }

  protected assignConsult(): void {
    if (readConsultStep() !== 'member' || !consultAwaitingDirector() || !this.canAssign) return;
    const channels = (['chat', 'phone', 'email', 'other'] as const).filter((channel) => this.channelOn[channel]);
    writeConsultPlan({
      channels,
      phone: this.channelOn.phone ? this.channelPhone.trim() : '',
      email: this.channelOn.email ? this.channelEmail.trim() : '',
      other: this.channelOn.other ? this.channelOther.trim() : '',
    });
    writeConsultAssigned(true);
    this.awaitingConsult = false;
    this.consultAssigned = true;
    this.assignOpen = false;
    this.deskFilter = 'group';
  }

  protected refreshConsult(): void {
    const request = readConsult();
    this.consultPlan = readConsultPlan();
    this.consultAssigned = !!request && readConsultAssigned();
    this.consultStep = request ? readConsultStep() : 'receive';
    this.awaitingConsult = this.role === 'director' && consultAwaitingDirector();
    const group = readConsultGroup();
    if (group) this.consultGroup = group;
    if (!this.consultMember) this.consultMember = this.consultMembers[0]?.name ?? '';
    this.consultTopic = request?.topic ?? '';
    this.consultWhen = request?.when ?? '';
    this.awaitingApproval = readCaseStatus() === 'approval';
    if (!this.awaitingConsult) this.assignOpen = false;
  }

  protected openMenu(label: string): void {
    if (label === 'หน้าหลัก') void this.router.navigate([this.home]);
  }

  protected openCases(): void {
    void this.router.navigate(['/cases']);
  }

  protected openFiling(): void {
    void this.router.navigate([this.role === 'director' ? '/director/filing' : '/officer/filing']);
  }

  private assignedConsultJob(group: string): TaskCase {
    const waiting = this.awaitingApproval;
    return {
      code: this.filingRef,
      title: waiting ? 'อนุมัติการยื่นแบบ' : 'ขอพบเจ้าหน้าที่',
      kind: 'job',
      bucket: 'in',
      product: 'เหล็กแผ่นรีดร้อนชนิดเป็นม้วนและไม่เป็นม้วน',
      sender: this.applicantName,
      group,
      at: this.consultWhen || '16/05/2562',
      status: this.consultStep === 'group' ? 'รอมอบหมายเจ้าหน้าที่ในกลุ่ม' : waiting ? (this.canApprove ? 'รอคุณอนุมัติการยื่นแบบ' : 'รอผู้รับมอบหมายอนุมัติ') : assignmentStepLabel(readWorkAssignment()),
      due: `ครบกำหนดแก้ไขเพิ่มเติม ${this.amendUntil}`,
      tone: waiting ? 'warning' : assignmentStepTone(readWorkAssignment()),
    };
  }

  protected openCase(code: string): void {
    if (code === this.filingRef) {
      if (this.role === 'staff' && this.consultIntakeOpen) return;
      if (this.role === 'head' && this.consultStep === 'group') return;
      if (this.role === 'head') void this.router.navigateByUrl('/officer/filing');
      return;
    }
    const base = this.role === 'staff' ? '/staff/tasks' : `/${this.role}/tasks`;
    void this.router.navigate([base, code]);
  }

  private get home(): string {
    return this.role === 'staff' ? '/staff' : `/${this.role}`;
  }

  ngOnDestroy(): void {
    window.clearInterval(this.assignTimer);
  }
}
