import { Component, HostListener } from '@angular/core';
import { Accounts } from '../../accounts';
import { DftButton } from '../../button/button';
import { parseThaiDate, thaiDateOk } from '../../fields/field-rules';
import { FileField } from '../../fields/file-field';
import { ThaiDateField } from '../../fields/thai-date-field';
import { InputField } from '../../input-field/input-field';
import { SideNav } from '../../menu-bar/side-nav';
import { StatusTag } from '../../status-tag/status-tag';
import { TopHeader } from '../../top-header/top-header';
import { qnAct, qnAddDays, qnForUser, qnFormRoot, qnPartyLabel, qnState, qnStateLabel, qnStateTone, qnStepLabel, qnToday, qnViaLabel, qnWho, type QnEvent, type QnState, type QnThread } from './qn-exchange';

/** มุมมองผู้มีส่วนได้เสีย: รับแจ้ง ตอบกลับ และขอขยายเวลาแบบสอบถามในระบบ */
@Component({
  selector: 'app-qn-reply-page',
  imports: [TopHeader, SideNav, StatusTag, DftButton, InputField, ThaiDateField, FileField],
  templateUrl: './qn-reply-page.html',
  styleUrls: ['./requests-page.css', './qn-reply-page.css'],
})
export class QnReplyPage {
  protected rows: QnThread[] = [];
  protected openId = '';
  protected mode: 'reply' | 'extend' | '' = '';
  protected on = '';
  protected due = '';
  protected note = '';
  protected files: string[] = [];
  protected error = '';
  protected readonly stepLabel = qnStepLabel;
  protected readonly viaLabel = qnViaLabel;
  protected readonly who = qnWho;

  constructor(private readonly accounts: Accounts) {
    this.reload();
  }

  @HostListener('window:storage')
  protected reload(): void {
    this.rows = qnForUser(this.accounts.username);
  }

  protected get waitingCount(): number {
    return this.rows.filter((row) => ['waiting', 'revise'].includes(qnState(row))).length;
  }

  protected stateOf(row: QnThread): QnState {
    return qnState(row);
  }

  protected labelOf(row: QnThread): string {
    return qnStateLabel(qnState(row));
  }

  protected toneOf(row: QnThread): 'success' | 'warning' | 'info' | 'neutral' {
    return qnStateTone(qnState(row));
  }

  protected partyOf(row: QnThread): string {
    return qnPartyLabel[row.party];
  }

  protected sentOn(row: QnThread): string {
    return row.events.find((event) => event.step === 'send')?.at ?? '-';
  }

  protected round(row: QnThread): number {
    return row.events.filter((event) => event.step === 'send' || event.step === 'revise').length;
  }

  /** ข้อความล่าสุดจากเจ้าหน้าที่ที่ผู้ตอบต้องอ่าน */
  protected officerNote(row: QnThread): QnEvent | null {
    return [...row.events].reverse().find((event) => event.by === 'officer') ?? null;
  }

  protected forms(row: QnThread): string[] {
    return row.events.find((event) => event.step === 'send')?.files ?? [];
  }

  protected open(row: QnThread, mode: 'reply' | 'extend'): void {
    if (this.openId === row.id && this.mode === mode) {
      this.close();
      return;
    }
    this.openId = row.id;
    this.mode = mode;
    this.on = qnToday();
    this.note = '';
    this.files = [];
    this.error = '';
    this.due = qnAddDays(row.dueOn, 30);
  }

  protected close(): void {
    this.openId = '';
    this.mode = '';
    this.error = '';
  }

  protected addFile(name: string): void {
    if (name && !this.files.includes(name)) this.files = [...this.files, name];
  }

  protected removeFile(name: string): void {
    this.files = this.files.filter((item) => item !== name);
  }

  protected sendReply(row: QnThread): void {
    if (!['waiting', 'revise'].includes(qnState(row)) || this.mode !== 'reply') return;
    if (!thaiDateOk(this.on, 'any')) {
      this.error = 'กรอกวันที่ให้ถูกต้อง';
      return;
    }
    if (!this.files.length) {
      this.error = 'แนบไฟล์คำตอบอย่างน้อย 1 ไฟล์';
      return;
    }
    qnAct(row.id, { step: 'reply', by: 'stakeholder', via: 'system', at: this.on, note: this.note.trim() || 'ส่งคำตอบแบบสอบถาม', files: this.files });
    this.afterAct();
  }

  protected sendExtend(row: QnThread): void {
    if (!['waiting', 'revise'].includes(qnState(row)) || this.mode !== 'extend') return;
    const limit = qnAddDays(row.dueOn, 30);
    const due = parseThaiDate(this.due);
    const from = parseThaiDate(row.dueOn);
    const max = parseThaiDate(limit);
    if (!thaiDateOk(this.on, 'any') || !this.note.trim()) {
      this.error = 'กรอกวันที่และเหตุผลที่ขอขยายเวลา';
      return;
    }
    if (!due || !from || !max || due <= from || due > max) {
      this.error = `ขอขยายได้ถึงวันหลัง ${row.dueOn} และไม่เกิน ${limit} (ครั้งละไม่เกิน 30 วัน)`;
      return;
    }
    qnAct(row.id, { step: 'extend-ask', by: 'stakeholder', via: 'system', at: this.on, note: this.note.trim(), due: this.due });
    this.afterAct();
  }

  private afterAct(): void {
    this.close();
    this.reload();
  }

  protected href(name: string): string {
    return `${qnFormRoot}${name}`;
  }

  protected view(name: string): void {
    const href = this.href(name);
    window.open(encodeURI(/\.docx?$/i.test(href) ? `${href}.html` : href), '_blank', 'noopener');
  }

  protected download(name: string): void {
    const link = document.createElement('a');
    link.href = encodeURI(this.href(name));
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
}
