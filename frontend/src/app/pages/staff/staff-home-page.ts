import { Component, OnDestroy, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Accounts } from '../../accounts';
import { DftButton } from '../../button/button';
import { SideNav } from '../../menu-bar/side-nav';
import { StatusTag, StatusTone } from '../../status-tag/status-tag';
import { TopHeader } from '../../top-header/top-header';
import { assignmentReachesOfficer, groupHead, groupMembers, staffPeople, workGroups } from './staff-roster';
import { listGrants, powerLabel, reviewGrant } from '../requests/proxy-grant';
import { archiveCases, findListedCase } from '../requests/request-cases';
import { acceptedAssignees, addThaiMonths, assignmentStepLabel, assignmentStepTone, caseStatusLabel, consultAwaitingDirector, consultChannelLabel, filingOfficer, filingRefId, filingUnit, firstFiledOn, readCaseStatus, readConsult, readConsultAssigned, readConsultGroup, readConsultPlan, readConsultStep, readFilingGate, readReceipt, readWorkAssignment, writeApprovedBy, writeCaseStatus, writeConsultAssigned, writeConsultGroup, writeConsultPlan, writeConsultStep, writeFilingGate, writeWorkAssignment, type ConsultChannel, type ConsultPlan, type ConsultStep, type FilingGate } from '../requests/case-status';

type Bucket = 'in' | 'pending' | 'out' | 'follow' | 'group';
type WorkKind = 'request' | 'job' | 'track';
type WorkBucket = 'in' | 'wait' | 'doing' | 'pending' | 'out' | 'follow' | 'group';
type DeskFilter = WorkKind | WorkBucket;

type FlowOfficer = { name: string; reply: 'pending' | 'accept' | 'return'; move?: string; result?: { at?: string } };
type FlowJob = {
  group: string;
  reply: 'pending' | 'accept' | 'return';
  result?: { at?: string };
  officers: FlowOfficer[];
  verdict?: string;
  handoff?: string;
  delivery?: string;
  dueOn?: string;
};

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
  caseId?: string;
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
  protected filingGate: FilingGate | null = readFilingGate();
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
    if (this.accounts.username === '1000000000126' && this.router.url.split('?')[0] === '/committee') {
      void this.router.navigateByUrl('/committee/other');
    }
    if (this.role === 'officer') this.deskFilter = 'in';
    else if (this.role === 'director') this.deskFilter = 'request';
    this.refreshConsult();
    if (route.snapshot.queryParamMap.get('queue') === 'proxy') {
      queueMicrotask(() => document.getElementById('proxy-queue')?.scrollIntoView({ block: 'start' }));
    }
    this.assignTimer = window.setInterval(() => this.refreshConsult(), 1000);
  }

  protected proxyTick = 0;

  protected get pendingProxies(): { id: string; person: string; org: string; powers: string; ref: string; goods: string }[] {
    void this.proxyTick;
    return listGrants().filter((grant) => grant.status === 'pending').map((grant) => {
      const item = findListedCase(grant.caseId);
      return {
        id: grant.id,
        person: grant.person,
        org: grant.org,
        powers: grant.powers.map((key) => powerLabel(key)).join(', '),
        ref: item?.ref ?? grant.caseId,
        goods: item?.goods ?? '',
      };
    });
  }

  protected reviewProxy(id: string, accept: boolean): void {
    reviewGrant(id, accept);
    this.proxyTick += 1;
  }

  protected get role(): string {
    return this.route.snapshot.data['role'] ?? 'staff';
  }

  protected get styled(): boolean {
    return this.role === 'director' || this.role === 'head' || this.role === 'officer';
  }

  protected get overview(): boolean {
    return this.role === 'director' || this.role === 'head' || this.role === 'officer' || this.role === 'bureau';
  }

  protected get overviewLead(): string {
    const role = this.accounts.roleName;
    return role ? `งานที่ ${role} ต้องดำเนินการ` : 'งานที่บัญชีนี้ต้องดำเนินการ';
  }

  protected get deskStats(): { id: DeskFilter; label: string; count: number }[] {
    if (this.role === 'officer') {
      const owned = this.consultOfficerAssignment();
      const consultOpen = readCaseStatus() === 'consult' && !!readConsult();
      const mine = owned
        ? 1
        : consultOpen
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

  protected taskKey(row: TaskCase): string {
    return `${row.caseId || row.code}:${row.title}`;
  }

  protected boardLane = '';
  protected groupFilter = '';
  protected boardView: 'board' | 'list' = 'board';
  protected searchOpen = false;

  protected toggleSearch(): void {
    this.searchOpen = !this.searchOpen;
    if (this.searchOpen) setTimeout(() => document.getElementById('desk-search')?.focus());
  }

  private taskRows(): TaskCase[] {
    const text = this.query.trim();
    const source = this.taskSource();
    const seen = new Set<string>();
    const rows: TaskCase[] = [];
    for (const row of source) {
      const key = this.taskKey(row);
      if (seen.has(key)) continue;
      seen.add(key);
      if (this.groupFilter && row.group !== this.groupFilter) continue;
      const haystack = `${row.code} ${row.title} ${row.sender} ${row.product} ${row.status} ${row.group}`;
      if (text && !haystack.includes(text)) continue;
      rows.push(row);
    }
    return rows;
  }

  protected get taskGroups(): string[] {
    return [...new Set(this.taskSource().map((row) => row.group).filter(Boolean))];
  }

  private taskSource(): TaskCase[] {
    return this.flowTasks();
  }

  private flowTasks(): TaskCase[] {
    const jobs = this.readFlowJobs();
    if (this.role === 'director') return this.directorFlow(jobs);
    if (this.role === 'head') return this.headFlow(jobs);
    if (this.role === 'officer') return this.officerFlow(jobs);
    if (this.role === 'bureau') return this.bureauFlow();
    return [];
  }

  private flowReply(value: string | undefined): FlowOfficer['reply'] {
    if (value === 'accept' || value === 'return') return value;
    return 'pending';
  }

  private readFlowJobs(): FlowJob[] {
    try {
      if (sessionStorage.getItem('dft-por1-consult-sample') === '1' || sessionStorage.getItem('dft-por1-consult-default') === '1') return [];
      const value = JSON.parse(sessionStorage.getItem('dft-por1-consult-jobs') || '[]') as {
        group?: string;
        reply?: string;
        result?: { at?: string };
        officers?: { name?: string; reply?: string; move?: string; result?: { at?: string } }[];
        verdict?: string;
        handoff?: string;
        delivery?: string;
        form?: { dueOn?: string };
      }[];
      if (!Array.isArray(value)) return [];
      return value.flatMap((job) => {
        if (!job || typeof job.group !== 'string' || !job.group) return [];
        const reply = this.flowReply(job.reply);
        const officers: FlowOfficer[] = Array.isArray(job.officers) ? job.officers.flatMap((officer) => {
          if (!officer || typeof officer.name !== 'string' || !officer.name) return [];
          return [{ name: officer.name, reply: this.flowReply(officer.reply), move: officer.move, result: officer.result }];
        }) : [];
        return [{
          group: job.group,
          reply,
          result: job.result,
          officers,
          verdict: job.verdict,
          handoff: job.handoff,
          delivery: job.delivery,
          dueOn: job.form?.dueOn || '',
        }];
      });
    } catch {
      return [];
    }
  }

  private stepCard(title: string, bucket: WorkBucket, status: string, tone: StatusTone, group: string, due = ''): TaskCase {
    return {
      code: this.filingRef,
      title,
      kind: 'job',
      bucket,
      product: 'เหล็กแผ่นรีดร้อนจากเวียดนามและอียิปต์',
      sender: this.applicantName,
      group,
      at: '16/05/2562',
      status,
      due: due || `ครบกำหนดแก้ไขเพิ่มเติม ${this.amendUntil}`,
      tone,
    };
  }

  private directorFlow(jobs: FlowJob[]): TaskCase[] {
    const cards: TaskCase[] = [];
    const status = readCaseStatus();
    const handedOff = jobs.length > 0 || readWorkAssignment().groupTasks.length > 0;
    if (status === 'approval' && this.canApprove) {
      const pending = this.filingGate?.state === 'pending';
      cards.push(this.stepCard(pending ? 'ตรวจสอบคำขอ' : 'อนุมัติการยื่นแบบ', 'in', pending ? 'ส่งมาขออนุมัติ' : 'รออนุมัติการยื่นแบบ', 'warning', 'ผู้อำนวยการ'));
    } else if ((status === 'official' || status === 'approval') && !handedOff) {
      cards.push(this.stepCard('ยื่นคำขอแบบ ปร.1', 'in', 'ยื่นแบบทางการแล้ว', 'info', 'ผู้อำนวยการ'));
    } else if (status === 'review' && !handedOff) {
      cards.push(this.stepCard('ยื่นคำขอแบบ ปร.1', 'in', 'อยู่ระหว่างตรวจสอบ', 'info', 'ผู้อำนวยการ'));
    } else if (status === 'revision' && !handedOff) {
      cards.push(this.stepCard('ยื่นคำขอแบบ ปร.1', 'follow', 'รอผู้ยื่นแก้ไข', 'warning', 'ผู้อำนวยการ'));
    }
    if (jobs.length) return [...cards, ...jobs.map((job) => this.directorJobCard(job))];
    const saved = readWorkAssignment();
    if (saved.groupTasks.length) {
      return [...cards, ...saved.groupTasks.map((task) => task.reply === 'return'
        ? this.stepCard(`ส่งคืนจาก ${task.head || task.group}`, 'in', 'หัวหน้ากลุ่มส่งคืน', 'danger', task.group)
        : this.stepCard(`มอบหมาย ${this.shortGroup(task.group)}`, 'out', 'ส่งมอบให้หัวหน้ากลุ่มแล้ว', 'success', task.group))];
    }
    if (status === 'consult' && this.consultStep === 'director') {
      cards.push(this.stepCard('มอบหมายกลุ่ม', 'in', 'รอมอบหมายกลุ่ม', 'warning', 'ผู้อำนวยการ'));
    }
    return cards;
  }

  private directorJobCard(job: FlowJob): TaskCase {
    const head = groupHead(job.group) || 'หัวหน้ากลุ่ม';
    const due = job.dueOn ? `ครบกำหนด ${job.dueOn}` : '';
    if (job.reply === 'return') return this.stepCard(`ส่งคืนจาก ${head}`, 'in', 'หัวหน้ากลุ่มส่งคืน', 'danger', job.group, due);
    if (job.result && job.verdict !== 'approve' && job.verdict !== 'rework') return this.stepCard(`รายงานจาก ${head}`, 'in', 'รอพิจารณาอนุมัติ', 'warning', job.group, due);
    if (job.verdict === 'approve' && !job.handoff) return this.stepCard('สถานะการส่งต่อ', 'follow', 'รอเลือกส่งต่อหรือไม่ส่งต่อ', 'warning', job.group, due);
    if (job.handoff === 'stop' && !job.delivery) return this.stepCard('สถานะการส่งมอบ', 'follow', 'รอเลือกปิดงาน ส่ง กธ. หรือส่งกลับตรวจสอบ', 'warning', job.group, due);
    if (job.handoff === 'more') return this.stepCard('ส่งต่องาน', 'out', 'ส่งต่อแล้ว', 'success', job.group, due);
    if (job.delivery === 'check') return this.stepCard('ส่งกลับตรวจสอบ', 'out', 'ส่งกลับตรวจสอบแล้ว', 'success', job.group, due);
    if (job.delivery === 'close') return this.stepCard('ปิดงาน', 'out', 'ส่งมอบแล้ว', 'success', job.group, due);
    if (job.delivery === 'board') return this.stepCard('ส่ง กธ. เพื่อพิจารณา', 'out', 'ส่งมอบแล้ว', 'success', job.group, due);
    return this.stepCard(`มอบหมาย ${this.shortGroup(job.group)}`, 'out', 'ส่งมอบให้กลุ่มแล้ว', 'success', job.group, due);
  }

  private headFlow(jobs: FlowJob[]): TaskCase[] {
    const group = this.myGroup();
    const job = jobs.find((item) => item.group === group);
    if (job) return [this.headJobCard(job)];
    const task = readWorkAssignment().groupTasks.find((item) => item.group === group);
    if (task?.reply === 'pending') return [this.stepCard('รับมอบหมายจากผู้อำนวยการ', 'in', 'รอรับเรื่อง', 'warning', group)];
    if (task?.reply === 'return') return [this.stepCard('ส่งคืนผู้อำนวยการ', 'out', 'ส่งคืนแล้ว', 'danger', group)];
    if (task?.reply === 'accept') {
      const hands = readWorkAssignment().hands.filter((hand) => hand.group === group);
      if (!hands.length) return [this.stepCard('มอบหมายเจ้าหน้าที่หรือรายงานผล', 'follow', 'รับเรื่องแล้ว', 'warning', group)];
      if (hands.some((hand) => hand.reply === 'return') && hands.every((hand) => hand.reply !== 'pending')) return [this.stepCard('เจ้าหน้าที่ส่งคืน', 'in', 'เลือกผู้รับคนใหม่', 'danger', group)];
      return [this.stepCard('งานของกลุ่ม', 'group', 'อยู่ระหว่างเจ้าหน้าที่ดำเนินการ', 'info', group)];
    }
    if (readCaseStatus() === 'consult' && this.consultStep === 'group' && this.headsThisGroup && readConsultGroup() === group) {
      return [this.stepCard('มอบหมายเจ้าหน้าที่ในกลุ่ม', 'in', 'รอเลือกเจ้าหน้าที่', 'warning', group)];
    }
    return [];
  }

  private headJobCard(job: FlowJob): TaskCase {
    const due = job.dueOn ? `ครบกำหนด ${job.dueOn}` : '';
    if (job.reply === 'return') return this.stepCard('ส่งคืนผู้อำนวยการ', 'out', 'ส่งคืนแล้ว', 'danger', job.group, due);
    if (job.reply === 'pending') return this.stepCard('รับมอบหมายจากผู้อำนวยการ', 'in', 'รอรับเรื่อง', 'warning', job.group, due);
    if (job.verdict === 'rework') return this.stepCard('รายงานผลใหม่', 'in', 'ผู้อำนวยการส่งกลับให้รายงานใหม่', 'warning', job.group, due);
    if (job.delivery === 'check') return this.stepCard('ส่งกลับตรวจสอบ', 'in', 'ผู้อำนวยการส่งกลับตรวจสอบ', 'warning', job.group, due);
    if (job.result || job.handoff === 'more' || job.delivery === 'close' || job.delivery === 'board') return this.stepCard('รายงานผลถึงผู้อำนวยการ', 'out', 'ส่งมอบรายงานแล้ว', 'success', job.group, due);
    const pending = job.officers.some((officer) => officer.reply === 'pending');
    const accepted = job.officers.filter((officer) => officer.reply === 'accept');
    const returned = job.officers.filter((officer) => officer.reply === 'return');
    if (returned.length && !pending && !accepted.some((officer) => !officer.result)) return this.stepCard('เจ้าหน้าที่ส่งคืน', 'in', 'เลือกผู้รับคนใหม่', 'danger', job.group, due);
    if (accepted.length && accepted.every((officer) => officer.result) && !pending) return this.stepCard('รวบรวมรายงานส่งผู้อำนวยการ', 'in', 'รอรายงานผล', 'warning', job.group, due);
    if (job.officers.length) return this.stepCard('งานของกลุ่ม', 'group', 'อยู่ระหว่างเจ้าหน้าที่ดำเนินการ', 'info', job.group, due);
    return this.stepCard('มอบหมายเจ้าหน้าที่หรือรายงานผล', 'follow', 'รับเรื่องแล้ว', 'warning', job.group, due);
  }

  private officerFlow(jobs: FlowJob[]): TaskCase[] {
    const me = this.accounts.personName;
    const cards = jobs.flatMap((job) => {
      const mine = job.officers.find((officer) => officer.name === me);
      if (!mine || job.reply === 'return') return [];
      return [this.officerJobCard(job, mine)];
    });
    if (cards.length || jobs.length) return cards;
    const hand = readWorkAssignment().hands.find((item) => item.name === me);
    if (!hand) return [];
    if (hand.reply === 'return') return [this.stepCard('ส่งคืนหัวหน้ากลุ่ม', 'out', 'ส่งคืนแล้ว', 'danger', hand.group)];
    if (hand.reply === 'pending') return [this.stepCard('รับมอบหมายจากหัวหน้ากลุ่ม', 'in', 'รอรับเรื่อง', 'warning', hand.group)];
    return [this.stepCard('ดำเนินงานตามที่มอบหมาย', 'follow', 'รับเรื่องแล้ว', 'info', hand.group)];
  }

  private officerJobCard(job: FlowJob, mine: FlowOfficer): TaskCase {
    const due = job.dueOn ? `ครบกำหนด ${job.dueOn}` : '';
    if (mine.reply === 'return') return this.stepCard('ส่งคืนหัวหน้ากลุ่ม', 'out', 'ส่งคืนแล้ว', 'danger', job.group, due);
    if (mine.reply === 'pending') return this.stepCard('รับมอบหมายจากหัวหน้ากลุ่ม', 'in', 'รอรับเรื่อง', 'warning', job.group, due);
    if (mine.move === 'forward' && !mine.result) return this.stepCard('ส่งต่อหัวหน้ากลุ่ม', 'out', 'ส่งต่อให้เลือกผู้รับใหม่', 'success', job.group, due);
    if (mine.result) return this.stepCard('รายงานผล', 'out', 'ส่งมอบรายงานแล้ว', 'success', job.group, due);
    return this.stepCard('ดำเนินงานตามที่มอบหมาย', 'follow', 'รับเรื่องแล้ว', 'info', job.group, due);
  }

  private bureauFlow(): TaskCase[] {
    const receipt = readReceipt();
    if (!receipt?.links?.length) return [];
    return [this.stepCard('ลงรับจากระบบสารบรรณ', 'out', 'ส่งมอบเลขรับแล้ว', 'success', 'กลุ่ม บท.')];
  }

  private shortGroup(group: string): string {
    if (group.includes('(AD)')) return 'กลุ่ม AD';
    if (group.includes('CVD')) return 'กลุ่ม CVD';
    if (group.includes('(SG)')) return 'กลุ่ม SG';
    if (group.includes('วิเคราะห์')) return 'กลุ่มวิเคราะห์';
    if (group.includes('บท')) return 'กลุ่ม บท.';
    return group;
  }

  private myGroup(): string {
    const me = this.accounts.personName;
    return staffPeople.find((person) => person.name === me)?.work ?? '';
  }

  private finishedTask(row: TaskCase): boolean {
    return /ประกาศ|ยุติ|ไม่เปิด/.test(row.status) || row.status === 'งานออก';
  }

  private etrLane(row: TaskCase): 'in' | 'pending' | 'out' | 'follow' | 'group' {
    if (row.bucket === 'out' || row.status === 'งานออก' || this.finishedTask(row)) return 'out';
    if (row.bucket === 'pending') return 'pending';
    if (row.bucket === 'follow') return 'follow';
    if (row.bucket === 'group' || row.bucket === 'doing') return 'group';
    if (/เปิดการไต่สวน|ร่างผลการ|รับฟังความคิดเห็น|ตรวจสอบข้อมูล|กำลังดำเนินการ|ผลการไต่สวน/.test(row.status)) return 'group';
    return 'in';
  }

  protected get summaryStats(): { id: 'in' | 'pending' | 'out' | 'follow' | 'group'; label: string; hint: string; tip: string; count: number }[] {
    const rows = this.taskRows();
    const count = (id: 'in' | 'pending' | 'out' | 'follow' | 'group') => rows.filter((row) => this.etrLane(row) === id).length;
    return [
      { id: 'in', label: 'งานรับเข้า', hint: 'งานใหม่ที่ยังไม่ส่งต่อ', tip: 'งานที่เข้ามาใหม่ของบัญชีนี้ ยังไม่ได้ส่งมอบต่อ', count: count('in') },
      { id: 'pending', label: 'งานค้าง', hint: 'ครบกำหนดแล้วยังไม่ส่งต่อ', tip: 'งานที่ครบกำหนดแล้ว แต่ยังไม่ได้ส่งมอบต่อ', count: count('pending') },
      { id: 'out', label: 'งานออก', hint: 'ส่งมอบไปแล้ว', tip: 'งานที่ส่งมอบไปแล้ว จึงออกจากงานที่กำลังรับ', count: count('out') },
      { id: 'follow', label: 'งานที่ต้องติดตาม (งานระหว่างดำเนินการ)', hint: 'ยังทำอยู่และต้องติดตาม', tip: 'งานที่ยังทำอยู่และต้องติดตามต่อ ยังไม่ใช่งานของทั้งกลุ่ม', count: count('follow') },
      { id: 'group', label: 'งานระหว่างดำเนินการของกลุ่ม', hint: 'กลุ่มกำลังทำอยู่', tip: 'งานที่กลุ่มกำลังทำอยู่ในกระบวนการไต่สวน', count: count('group') },
    ];
  }

  protected pickSummary(id: 'in' | 'pending' | 'out' | 'follow' | 'group'): void {
    this.boardLane = this.boardLane === id ? '' : id;
  }

  protected get boardColumns(): { id: string; label: string; rows: TaskCase[] }[] {
    const rows = this.taskRows();
    const columns = [
      { id: 'in', label: 'งานรับเข้า' },
      { id: 'pending', label: 'งานค้าง' },
      { id: 'out', label: 'งานออก' },
      { id: 'follow', label: 'งานที่ต้องติดตาม (งานระหว่างดำเนินการ)' },
      { id: 'group', label: 'งานระหว่างดำเนินการของกลุ่ม' },
    ];
    return columns
      .filter((column) => !this.boardLane || this.boardLane === column.id)
      .map((column) => ({
        ...column,
        rows: rows.filter((row) => this.etrLane(row) === column.id),
      }));
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

  private consultOfficerAssignment(): { reply?: string; result?: unknown } | undefined {
    const me = this.accounts.personName;
    if (!me) return undefined;
    try {
      const jobs = JSON.parse(sessionStorage.getItem('dft-por1-consult-jobs') || '[]') as { officers?: { name?: string; reply?: string; result?: unknown }[] }[];
      if (!Array.isArray(jobs)) return undefined;
      for (const job of jobs) {
        const mine = job.officers?.find((officer) => officer.name === me);
        if (mine) return mine;
      }
    } catch {
      return undefined;
    }
    return undefined;
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
    if (filter === 'in' && this.awaitingApproval && this.canApprove) return [{ ...this.liveJob('ส่งมาขออนุมัติ', 'warning'), title: 'ขอคำปรึกษา' }];
    const owned = this.consultOfficerAssignment();
    if (owned) {
      const status = owned.result ? 'รายงานผล' : owned.reply === 'accept' ? 'กำลังดำเนินงาน' : owned.reply === 'return' ? 'ส่งคืน' : 'งานรับใหม่';
      const tone = owned.result || owned.reply === 'accept' ? 'success' as const : owned.reply === 'return' ? 'danger' as const : 'warning' as const;
      return [{ ...this.liveJob(status, tone), title: 'ขอคำปรึกษา' }];
    }
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
    rows.push(
      {
        code: 'AC1002',
        title: 'หลบเลี่ยงมาตรการ',
        kind: 'request',
        bucket: 'in',
        product: 'หลอดหรือท่อทำด้วยเหล็ก จากจีน',
        sender: 'ผู้ผลิตในประเทศ',
        group: 'กลุ่มงานมาตรการตอบโต้การทุ่มตลาด (AD)',
        at: '21/10/2567',
        status: 'เปิดการไต่สวน',
        due: '',
        tone: 'success',
      },
      {
        code: 'AC1001',
        title: 'หลบเลี่ยงมาตรการ',
        kind: 'request',
        bucket: 'out',
        product: 'เหล็กแผ่นรีดร้อนเจือ จากจีน',
        sender: 'SSI, G Steel, GJS, SPM',
        group: 'กลุ่มงานมาตรการตอบโต้การทุ่มตลาด (AD)',
        at: '29/05/2566',
        status: 'ประกาศผลชั้นที่สุด',
        due: '',
        tone: 'success',
      },
      {
        code: 'SG1006',
        title: 'มาตรการปกป้อง',
        kind: 'request',
        bucket: 'doing',
        product: 'ฟอยล์อะลูมิเนียม',
        sender: 'อุตสาหกรรมภายใน',
        group: 'กลุ่มงานมาตรการป้องกัน (SG)',
        at: '02/06/2563',
        status: 'ร่างผลการไต่สวน',
        due: '',
        tone: 'warning',
      },
      {
        code: 'SG1003',
        title: 'ทบทวนมาตรการปกป้อง',
        kind: 'request',
        bucket: 'out',
        product: 'เหล็กแผ่นรีดร้อนเจืออื่น ครั้งที่ 2',
        sender: 'ผู้ผลิตในประเทศ',
        group: 'กลุ่มงานมาตรการป้องกัน (SG)',
        at: '03/07/2561',
        status: 'ประกาศผลการทบทวน',
        due: '',
        tone: 'success',
      },
      {
        code: 'SG1008',
        title: 'มาตรการปกป้อง',
        kind: 'request',
        bucket: 'in',
        product: 'สินค้าพอลิโพรพิลีน (PP)',
        sender: 'ผู้ผลิตในประเทศ',
        group: 'กลุ่มงานมาตรการป้องกัน (SG)',
        at: '01/03/2568',
        status: 'ยื่นคำขอ',
        due: '',
        tone: 'info',
      },
      {
        code: 'AD1022',
        title: 'ทบทวนมาตรา 56',
        kind: 'request',
        bucket: 'out',
        product: 'เหล็ก GL จากจีนและเกาหลี',
        sender: 'WCP',
        group: 'กลุ่มงานมาตรการตอบโต้การทุ่มตลาด (AD)',
        at: '24/03/2568',
        status: 'ประกาศผลการทบทวน',
        due: '',
        tone: 'success',
      },
      {
        code: 'AD1019',
        title: 'ทบทวนมาตรา 57',
        kind: 'request',
        bucket: 'out',
        product: 'ยางในรถจักรยานยนต์ จากจีน',
        sender: 'ดีรับเบอร์, วีรับเบอร์ และ เอ็น.ดี.รับเบอร์',
        group: 'กลุ่มงานมาตรการตอบโต้การทุ่มตลาด (AD)',
        at: '24/07/2566',
        status: 'ประกาศผลการทบทวน',
        due: '',
        tone: 'success',
      },
      {
        code: 'AD1022',
        caseId: 'ad102257',
        title: 'ทบทวนมาตรา 57',
        kind: 'request',
        bucket: 'out',
        product: 'เหล็ก GL จากจีน เกาหลี และไต้หวัน',
        sender: 'บริษัท เอ็นเอส บลูสโคป (ประเทศไทย) จำกัด',
        group: 'กลุ่มงานมาตรการตอบโต้การทุ่มตลาด (AD)',
        at: '11/09/2566',
        status: 'ประกาศผลการทบทวน',
        due: '',
        tone: 'success',
      },
    );
    const seenCodes = new Set(rows.filter((row) => row.code !== '—').map((row) => row.code));
    const seenIds = new Set(rows.map((row) => row.caseId || ''));
    for (const item of archiveCases) {
      if (/^POR/i.test(item.code)) continue;
      if (seenIds.has(item.id)) continue;
      if (item.code !== '—' && seenCodes.has(item.code)) continue;
      seenIds.add(item.id);
      if (item.code !== '—') seenCodes.add(item.code);
      const finished = /ประกาศ|ยุติ|ไม่เปิด/.test(item.status);
      const openWork = !finished && item.status !== 'ยื่นคำขอ' && item.status !== 'ร่าง';
      rows.push({
        code: item.code,
        caseId: item.id,
        title: item.kind,
        kind: 'request',
        bucket: finished ? 'out' : item.waiting ? 'pending' : openWork ? 'doing' : 'in',
        product: item.goods,
        sender: item.applicant || 'ผู้ยื่นคำขอ',
        group: item.measure.startsWith('SG') ? 'กลุ่มงานมาตรการป้องกัน (SG)' : 'กลุ่มงานมาตรการตอบโต้การทุ่มตลาด (AD)',
        at: item.created,
        status: item.status,
        due: '',
        tone: item.tone,
      });
    }
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
    if (this.filingGate?.state === 'pending' && this.filingGate.owners.length) return this.filingGate.owners;
    return acceptedAssignees(readWorkAssignment());
  }

  protected get canApprove(): boolean {
    const name = this.accounts.personName;
    return !!name && this.awaitingApproval && this.approverNames().includes(name);
  }

  protected jobLabel(row: TaskCase): string {
    if (row.code === this.filingRef && this.canApprove) return this.filingGate?.state === 'pending' ? 'ตรวจสอบคำขอ' : 'อนุมัติการยื่นแบบ';
    if (this.role === 'director' && this.awaitingConsult && row.title === 'ขอพบเจ้าหน้าที่') return 'มอบหมายกลุ่ม';
    if (row.code === this.filingRef && row.status === 'ยื่นแบบทางการแล้ว') return 'กำหนดผู้รับผิดชอบ';
    return 'ดูคำขอ';
  }

  protected jobClick(row: TaskCase): void {
    if (row.code === this.filingRef && this.canApprove && this.filingGate?.state === 'pending') {
      this.openFiling();
      return;
    }
    if (row.code === this.filingRef && this.canApprove) {
      this.approveFiling();
      return;
    }
    if (this.role === 'director' && this.awaitingConsult && row.title === 'ขอพบเจ้าหน้าที่') {
      this.openCode = this.taskKey(row);
      this.assignOpen = true;
      return;
    }
    if (row.code === this.filingRef && row.status === 'ยื่นแบบทางการแล้ว') {
      this.openFiling('', 'assign');
      return;
    }
    const key = row.caseId || row.code;
    this.openFiling(key !== this.filingRef && findListedCase(key) && !findListedCase(key)?.draft ? key : '');
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
    if (readCaseStatus() !== 'approval' || !this.canApprove || this.filingGate?.state === 'pending') return;
    writeApprovedBy(this.accounts.personName);
    writeFilingGate(null);
    this.filingGate = null;
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
    this.consultWhen = request?.channel === 'phone' ? 'โทรศัพท์' : request?.channel === 'online' ? 'Online' : request?.channel === 'onsite' ? 'OnSite' : (request?.when ?? '');
    this.awaitingApproval = readCaseStatus() === 'approval';
    this.filingGate = readFilingGate();
    if (!this.awaitingConsult) this.assignOpen = false;
  }

  protected openMenu(label: string): void {
    if (label === 'หน้าหลัก') void this.router.navigate([this.home]);
  }

  protected openCases(): void {
    void this.router.navigate(['/cases']);
  }

  protected openFiling(code = '', tab = ''): void {
    const filing = ({
      director: '/director/filing',
      head: '/head/filing',
      staff: '/staff/filing',
      officer: '/officer/filing',
      bureau: '/bureau/filing',
      committee: '/committee/filing',
      interest: '/interest/filing',
      external: '/external/filing',
    } as Record<string, string>)[this.role] ?? '/officer/filing';
    const queryParams: Record<string, string> = {};
    if (code) queryParams['case'] = code;
    if (tab) queryParams['tab'] = tab;
    void this.router.navigate([filing], { queryParams });
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
      if (this.role === 'head') void this.router.navigateByUrl('/head/filing');
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
