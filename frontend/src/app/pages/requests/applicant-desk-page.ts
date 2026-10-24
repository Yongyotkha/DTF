import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DftButton } from '../../button/button';
import { InputField } from '../../input-field/input-field';
import { SideNav } from '../../menu-bar/side-nav';
import { StatusTag, StatusTone } from '../../status-tag/status-tag';
import { Tabs } from '../../tabs/tabs';
import { TopHeader } from '../../top-header/top-header';
import { Accounts } from '../../accounts';
import { joinedCaseIds, joinedFor, invitePath as interestInvitePath } from './interest-invite';
import { addGrant, allowedCaseIds, invitePath, isActingAgent, listGrants, powerLabel, proxyPowerChoices, ProxyGrant, ProxyPower, setGrantUse } from './proxy-grant';
import { archiveCases, caseKey, caseNumberLabel, ListedCase } from './request-cases';

type Desk = 'proxy' | 'interest' | 'cases' | 'exchange' | 'info';
type Band = 'wait' | 'done' | 'late';

type Card = {
  key: string;
  ref: string;
  code: string;
  title: string;
  measure: string;
  kind: string;
  round: string;
  date: string;
  applicant: string;
  status: string;
  tone: StatusTone;
  result: string;
  band?: Band;
  openId?: string;
  invite?: string;
  grantId?: string;
  grantStatus?: ProxyGrant['status'];
};

@Component({
  selector: 'app-applicant-desk-page',
  imports: [TopHeader, SideNav, DftButton, StatusTag, Tabs, InputField],
  templateUrl: './applicant-desk-page.html',
  styleUrl: './requests-page.css',
})
export class ApplicantDeskPage implements OnDestroy {
  protected readonly desk: Desk;
  protected interestTab = 0;
  protected compose = false;
  protected proxyOpen = false;
  protected person = '';
  protected org = '';
  protected caseQuery = '';
  protected pickedId = '';
  protected readonly powerChoices = proxyPowerChoices;
  protected powers: Record<ProxyPower, boolean> = { file: true, edit: false, contact: false, full: false, other: false };
  protected inviteLink = '';
  protected copied = '';
  protected proxyError = '';
  protected topic = '';
  protected detail = '';
  private readonly addedInfo: Card[] = [];

  constructor(
    private readonly router: Router,
    private readonly accounts: Accounts,
    route: ActivatedRoute,
  ) {
    this.desk = (route.snapshot.data['desk'] as Desk) || 'cases';
    this.compose = route.snapshot.queryParamMap.get('compose') === '1';
    if (this.desk === 'interest' && this.accounts.role !== 'interest' && !this.staffNotice) {
      void this.router.navigateByUrl('/requests');
    }
  }

  protected get staffNotice(): boolean {
    return ['officer', 'director', 'head', 'bureau', 'staff'].includes(this.accounts.role);
  }

  protected get menuOpen(): string {
    if (this.desk === 'info') return 'คำร้อง';
    if (this.accounts.role === 'interest' || this.staffNotice) return 'กระบวนการไต่สวน';
    return 'คำขอ';
  }

  protected get menuActive(): string {
    if (this.desk === 'proxy') return 'มอบหมายผู้กระทำการแทน';
    if (this.desk === 'interest' && this.accounts.role === 'interest') return 'ลงทะเบียนผู้มีส่วนได้ส่วนเสีย';
    if (this.desk === 'interest' && this.accounts.role === 'director') return 'อนุมัติผู้มีส่วนได้เสีย';
    if (this.desk === 'interest') return 'แจ้งผู้มีส่วนได้เสีย';
    if (this.desk === 'cases') return 'Case ID';
    if (this.desk === 'exchange') return 'รับ–ส่งข้อมูลอื่น ๆ';
    return 'ขอข้อมูลข่าวสาร';
  }

  protected get title(): string {
    return this.menuActive;
  }

  protected get note(): string {
    if (this.desk === 'proxy') return 'มอบอำนาจให้ผู้อื่นดำเนินการแทนตลอดการยื่นคำขอและการไต่สวน';
    if (this.desk === 'interest' && this.accounts.role === 'interest') return 'ลงทะเบียนเองหลังได้รับแจ้งทางไปรษณีย์ อีเมล หรือหนังสือพิมพ์ แล้วเข้าคดีที่เปิดไต่สวน';
    if (this.desk === 'interest' && this.accounts.role === 'director') return 'ตรวจการลงทะเบียนของผู้มีส่วนได้เสียหลังเปิดไต่สวน';
    if (this.desk === 'interest') return 'หลังเปิดไต่สวน แจ้งผู้มีส่วนได้เสียทางไปรษณีย์ อีเมล และหนังสือพิมพ์ด้วยลิงก์เชิญ';
    if (this.desk === 'cases') return 'เข้าคดีเพื่อรับฟังความคิดเห็น ตอบแบบสอบถาม ยืนยันการตรวจสอบ และดูผล';
    if (this.desk === 'exchange') return 'รับและส่งข้อมูลอื่นที่ไม่อยู่ในแบบคำขอหรือแบบสอบถาม';
    return 'ขอข้อมูลข่าวสาร ชำระค่าธรรมเนียม และรับทราบเอกสารฉบับเปิดเผย';
  }

  protected get interestLabels(): string[] {
    const rows = this.interestRows;
    return [
      `รอลงทะเบียน (${rows.filter((row) => row.band === 'wait').length})`,
      `ลงทะเบียนแล้ว (${rows.filter((row) => row.band === 'done').length})`,
      `เกินระยะเวลาการลงทะเบียน (${rows.filter((row) => row.band === 'late').length})`,
    ];
  }

  protected get canGrant(): boolean {
    return !!this.accounts.username && !isActingAgent(this.accounts.username) && this.accounts.role !== 'interest';
  }

  protected get caseChoices(): ListedCase[] {
    const query = this.caseQuery.trim().toLowerCase();
    const rows = this.scopedCases();
    if (!query) return rows;
    return rows.filter((item) => [item.ref, item.code, item.goods].some((value) => value.toLowerCase().includes(query)));
  }

  protected caseLabel(item: ListedCase): string {
    return caseNumberLabel(item);
  }

  protected pickGrantCase(item: ListedCase): void {
    this.pickedId = item.id;
    this.proxyError = '';
  }

  protected get cards(): Card[] {
    if (this.desk === 'proxy') return this.proxyRows;
    if (this.desk === 'interest' && this.accounts.role === 'interest') return this.interestRows;
    if (this.desk === 'interest') return this.interestRows.filter((row) => row.band === (['wait', 'done', 'late'] as Band[])[this.interestTab]);
    if (this.desk === 'cases') return this.caseRows;
    if (this.desk === 'exchange') return this.exchangeRows;
    return [...this.infoRows, ...this.addedInfo];
  }

  protected setInterestTab(index: number): void {
    this.interestTab = index;
  }

  protected caseNo(card: Card): string {
    return caseNumberLabel(card);
  }

  protected canOpen(card: Card): boolean {
    return !!this.matchCase(card);
  }

  protected openCard(card: Card): void {
    const item = this.matchCase(card);
    if (!item) return;
    void this.router.navigate(['/requests', caseKey(item)]);
  }

  private matchCase(card: Card): ListedCase | undefined {
    const id = card.openId || card.key;
    const byId = archiveCases.find((row) => row.id === id);
    if (byId) return byId;
    const sameCode = card.code === '—' ? [] : archiveCases.filter((row) => row.code === card.code);
    return sameCode.length === 1 ? sameCode[0] : undefined;
  }

  protected togglePower(key: ProxyPower): void {
    this.powers = { ...this.powers, [key]: !this.powers[key] };
  }

  protected useGrant(id: string, allow: boolean, event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    setGrantUse(id, allow);
  }

  protected copyText(value: string, event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    if (!value) return;
    const text = value.startsWith('http') ? value : `${location.origin}${value}`;
    void navigator.clipboard?.writeText(text);
    this.copied = value;
  }

  protected saveProxy(): void {
    if (!this.canGrant) return;
    const person = this.person.trim();
    const org = this.org.trim();
    const powers = this.powerChoices.filter((item) => this.powers[item.key]).map((item) => item.key);
    const found = this.scopedCases().find((item) => item.id === this.pickedId);
    if (!person || !org) {
      this.proxyError = 'กรอกชื่อและหน่วยงาน';
      return;
    }
    if (!found) {
      this.proxyError = 'เลือกเคสที่ต้องการมอบหมาย';
      return;
    }
    if (!powers.length) {
      this.proxyError = 'เลือกอำนาจอย่างน้อย 1 ข้อ';
      return;
    }
    const grant = addGrant({ caseId: found.id, grantor: this.accounts.username, person, org, powers });
    this.inviteLink = `${location.origin}${invitePath(grant.id)}`;
    this.copied = '';
    this.proxyError = '';
    this.person = '';
    this.org = '';
    this.caseQuery = '';
    this.pickedId = '';
    this.powers = { file: true, edit: false, contact: false, full: false, other: false };
    this.closeProxy();
  }

  protected openProxy(): void {
    this.proxyError = '';
    this.proxyOpen = true;
    document.body.classList.add('chooser-open');
  }

  protected closeProxy(): void {
    this.proxyOpen = false;
    document.body.classList.remove('chooser-open');
  }

  ngOnDestroy(): void {
    document.body.classList.remove('chooser-open');
  }

  protected saveInfo(): void {
    const topic = this.topic.trim();
    if (!topic) return;
    this.addedInfo.unshift({
      ...this.blankCard(`info-${this.addedInfo.length}`, topic, this.detail.trim() || 'คำร้องขอข้อมูลข่าวสาร'),
      status: 'ส่งคำร้องแล้ว',
      tone: 'info',
    });
    this.topic = '';
    this.detail = '';
    this.compose = false;
  }

  private fromCase(item: ListedCase, patch: Partial<Card> = {}): Card {
    return {
      key: patch.key ?? item.id,
      ref: item.ref,
      code: item.code,
      title: item.goods,
      measure: item.measure,
      kind: item.kind,
      round: item.round ? `ครั้งที่ ${item.round}` : '—',
      date: item.created || '—',
      applicant: item.applicant || '',
      status: patch.status ?? item.status,
      tone: patch.tone ?? item.tone,
      result: patch.result ?? '',
      band: patch.band,
      openId: patch.openId,
      invite: patch.invite,
      grantId: patch.grantId,
      grantStatus: patch.grantStatus,
    };
  }

  private blankCard(key: string, title: string, result: string): Card {
    return {
      key,
      ref: '—',
      code: '—',
      title,
      measure: '—',
      kind: '—',
      round: '—',
      date: '—',
      applicant: '',
      status: 'ส่งคำร้องแล้ว',
      tone: 'info',
      result,
    };
  }

  private get proxyRows(): Card[] {
    const mine = this.accounts.username;
    return listGrants().flatMap((grant) => {
      if (mine && grant.grantor !== mine && grant.username !== mine) return [];
      const item = archiveCases.find((row) => row.id === grant.caseId || row.code === grant.caseId);
      if (!item) return [];
      const powers = grant.powers.map((key) => powerLabel(key)).join(', ');
      const link = grant.status === 'pending' || grant.status === 'invited' ? invitePath(grant.id) : '';
      const label = grant.status === 'pending' ? 'รอดำเนินการ' : grant.status === 'invited' ? 'อนุมัติแล้ว' : grant.status === 'active' ? 'รับมอบแล้ว' : grant.status === 'suspended' ? 'ระงับ' : 'ไม่รับ';
      const tone = grant.status === 'active' ? 'success' : grant.status === 'pending' || grant.status === 'suspended' ? 'warning' : grant.status === 'rejected' ? 'neutral' : 'info';
      return [this.fromCase(item, {
        key: grant.id,
        openId: item.id,
        invite: link,
        grantId: grant.id,
        grantStatus: grant.status,
        status: label,
        tone,
        result: link ? `${grant.person} · ${grant.org} · ${powers} · ${link}` : `${grant.person} · ${grant.org} · ${powers}`,
      })];
    });
  }

  private get interestRows(): Card[] {
    if (!this.canGrant && this.accounts.role !== 'interest') return [];
    if (this.accounts.role === 'interest') {
      const joined = joinedCaseIds(this.accounts.username);
      return this.scopedCases().filter((item) => this.opened(item)).map((item) => {
        const mine = !!joined && (joined.has(item.id) || joined.has(item.code));
        return this.fromCase(item, {
          status: mine ? 'ลงทะเบียนแล้ว' : item.status,
          tone: mine ? 'success' : item.tone,
          band: 'done',
          result: mine ? 'ลงทะเบียนจากลิงก์เชิญแล้ว' : item.note || item.kind,
        });
      });
    }
    return archiveCases.filter((item) => !item.draft && this.opened(item)).map((item) => {
      const joined = joinedFor(item.id);
      const late = item.status.includes('ประกาศ');
      const link = interestInvitePath(item.id);
      if (joined.length) {
        return this.fromCase(item, {
          status: 'ลงทะเบียนแล้ว',
          tone: 'success',
          band: 'done',
          invite: link,
          result: `${joined.map((row) => row.name).join(', ')} · ${link}`,
        });
      }
      return this.fromCase(item, {
        status: late ? 'เกินระยะเวลาการลงทะเบียน' : 'รอลงทะเบียน',
        tone: late ? 'neutral' : 'warning',
        band: late ? 'late' : 'wait',
        invite: late ? '' : link,
        result: late ? 'พ้นระยะลงทะเบียนผู้มีส่วนได้เสีย' : `ลิงก์เชิญ ${link}`,
      });
    });
  }

  private get caseRows(): Card[] {
    return this.scopedCases().map((item) => this.fromCase(item, { result: item.note || item.kind }));
  }

  private scopedCases(): ListedCase[] {
    const allow = allowedCaseIds(this.accounts.username);
    let rows = archiveCases.filter((item) => !item.draft);
    if (allow) rows = rows.filter((item) => allow.has(item.id) || allow.has(item.code));
    if (this.accounts.role !== 'interest') return rows;
    const joined = joinedCaseIds(this.accounts.username);
    if (!joined) return rows;
    return rows.filter((item) => joined.has(item.id) || joined.has(item.code));
  }

  private get exchangeRows(): Card[] {
    return this.scopedCases().flatMap((item) =>
      item.documents.filter((file) => file.includes('หนังสือ') || file.includes('รับฟัง')).slice(0, 1).map((file) =>
        this.fromCase(item, {
          key: `${item.id}-${file}`,
          status: item.status.includes('ประกาศ') ? 'ส่งแล้ว' : 'ระหว่างดำเนินการ',
          tone: item.status.includes('ประกาศ') ? 'success' : 'info',
          result: file,
        }),
      ),
    );
  }

  private get infoRows(): Card[] {
    return this.scopedCases().filter((item) => item.documents.some((file) => file.includes('เปิดเผย') || file.includes('แถลง'))).map((item) =>
      this.fromCase(item, {
        status: item.status.includes('ประกาศ') ? 'รับทราบเอกสารฉบับเปิดเผย' : 'รอรับเอกสาร',
        tone: item.status.includes('ประกาศ') ? 'success' : 'warning',
        result: item.documents.find((file) => file.includes('เปิดเผย') || file.includes('แถลง')) ?? item.goods,
      }),
    );
  }

  private opened(item: ListedCase): boolean {
    return item.steps.some((step) => step.state !== 'todo' && (step.name.includes('เปิด') || step.name.includes('ไต่สวน') || step.name.includes('ทบทวน')));
  }
}
