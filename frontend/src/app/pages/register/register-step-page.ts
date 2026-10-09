import { Component, ElementRef, OnDestroy, OnInit, ViewChild, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { DftButton } from '../../button/button';
import { DataTable } from '../../data-table/data-table';
import { InputField, InputKind, InputState } from '../../input-field/input-field';
import { DftModal } from '../../modal/modal';
import { Steps } from '../../steps/steps';
import { Tabs } from '../../tabs/tabs';
import { TopHeader } from '../../top-header/top-header';
import { EmailField } from '../../fields/email-field';
import { FileField } from '../../fields/file-field';
import { emailOk, fieldMessage, fileOk, passwordOk, personNameOk, phoneOk, prefixOk, textOk, thaiDateOk, thaiIdOk, usernameOk } from '../../fields/field-rules';
import { IdNumberField } from '../../fields/id-number-field';
import { PhoneField } from '../../fields/phone-field';
import { PrefixField } from '../../fields/prefix-field';
import { ThaiDateField } from '../../fields/thai-date-field';
import { Accounts } from '../../accounts';
import { AddressSelect } from './address-select';
import { agreementText } from './agreement';
import { RegisterDraft } from './register-draft';
import { ThaiAddress } from './thai-address';

type Kind = 'corporate' | 'individual' | 'association';

type Director = {
  name: string;
  surname: string;
  action: string;
};

const emptyDirector = (): Director => ({ name: '', surname: '', action: '' });

type Field = {
  key: string;
  label: string;
  kind?: InputKind;
  required?: boolean;
  inputType?: 'text' | 'password';
  placeholder?: string;
};

const titles: Record<Kind, string> = {
  corporate: 'ข้อมูลนิติบุคคล',
  individual: 'ข้อมูลบุคคลธรรมดา',
  association: 'ข้อมูลสมาคมการค้า',
};

const details: Record<Kind, Field[]> = {
  corporate: [
    { key: 'country', label: 'ประเทศ', required: true, placeholder: 'ประเทศไทย' },
    { key: 'regno', label: 'เลขทะเบียนนิติบุคคล', required: true, placeholder: '0105538041238' },
    { key: 'name', label: 'ชื่อนิติบุคคล', required: true, placeholder: 'บริษัท ดาต้า มายนิ่ง จำกัด' },
    { key: 'cert', label: 'หนังสือรับรองนิติบุคคล', required: true },
    { key: 'registered', label: 'วันที่จดทะเบียน', kind: 'date', required: true, placeholder: '30/04/2538' },
    { key: 'phone', label: 'หมายเลขโทรศัพท์', required: true, placeholder: '02-348-8700' },
    { key: 'email', label: 'อีเมล', required: true, placeholder: 'support@datamining.co.th' },
    { key: 'address', label: 'ที่อยู่', required: true, placeholder: 'เลขที่ 102 ถนน ณ ระนอง' },
    { key: 'province', label: 'จังหวัด', kind: 'dropdown', required: true, placeholder: 'กรุงเทพมหานคร' },
    { key: 'district', label: 'อำเภอ/เขต', kind: 'dropdown', required: true, placeholder: 'คลองเตย' },
    { key: 'subdistrict', label: 'ตำบล/แขวง', kind: 'dropdown', required: true, placeholder: 'คลองเตย' },
    { key: 'postcode', label: 'รหัสไปรษณีย์', required: true, placeholder: '10110' },
    { key: 'consent', label: 'หนังสือยินยอมให้ใช้ข้อมูล', required: true },
  ],
  individual: [
    { key: 'identity', label: 'ยืนยันตัวตน', required: true, placeholder: 'บัตรประจำตัวประชาชน' },
    { key: 'prefix', label: 'คำนำหน้า', kind: 'dropdown', required: true, placeholder: 'เลือก' },
    { key: 'name', label: 'ชื่อ', required: true, placeholder: 'ระบุ' },
    { key: 'middle', label: 'ชื่อกลาง', placeholder: 'ระบุ' },
    { key: 'surname', label: 'นามสกุล', required: true, placeholder: 'ระบุ' },
    { key: 'birth', label: 'วัน/เดือน/ปี เกิด', kind: 'date', required: true, placeholder: '22/09/2569' },
    { key: 'phone', label: 'หมายเลขโทรศัพท์', required: true, placeholder: 'ระบุ' },
    { key: 'email', label: 'อีเมล', required: true, placeholder: 'ระบุ' },
    { key: 'address', label: 'ที่อยู่', required: true, placeholder: 'เลขที่, อาคาร/หมู่บ้าน, ซอย, ถนน' },
    { key: 'province', label: 'จังหวัด', kind: 'dropdown', required: true, placeholder: 'เลือก' },
    { key: 'district', label: 'อำเภอ/เขต', kind: 'dropdown', required: true, placeholder: 'เลือก' },
    { key: 'subdistrict', label: 'ตำบล/แขวง', kind: 'dropdown', required: true, placeholder: 'เลือก' },
    { key: 'postcode', label: 'รหัสไปรษณีย์', required: true, placeholder: 'รหัสไปรษณีย์' },
  ],
  association: [
    { key: 'country', label: 'ประเทศ', required: true, placeholder: 'ประเทศไทย' },
    { key: 'regno', label: 'เลขทะเบียนสมาคมการค้า', required: true, placeholder: 'ระบุ' },
    { key: 'name', label: 'ชื่อสมาคมการค้า', required: true, placeholder: 'ระบุ' },
    { key: 'place', label: 'สถานที่จดทะเบียน', required: true, placeholder: 'ระบุ' },
    { key: 'registered', label: 'วันที่จดทะเบียน', kind: 'date', required: true, placeholder: '22/09/2569' },
    { key: 'cert', label: 'หนังสือรับรองสมาคมการค้า', required: true },
    { key: 'signature', label: 'แนบลายเซ็น' },
    { key: 'phone', label: 'หมายเลขโทรศัพท์', required: true, placeholder: 'ระบุ' },
    { key: 'email', label: 'อีเมล', required: true, placeholder: 'ระบุ' },
    { key: 'address', label: 'ที่อยู่', required: true, placeholder: 'เลขที่, อาคาร/หมู่บ้าน, ซอย, ถนน' },
    { key: 'province', label: 'จังหวัด', kind: 'dropdown', required: true, placeholder: 'เลือก' },
    { key: 'district', label: 'อำเภอ/เขต', kind: 'dropdown', required: true, placeholder: 'เลือก' },
    { key: 'subdistrict', label: 'ตำบล/แขวง', kind: 'dropdown', required: true, placeholder: 'เลือก' },
    { key: 'postcode', label: 'รหัสไปรษณีย์', required: true, placeholder: 'รหัสไปรษณีย์' },
    { key: 'consent', label: 'หนังสือยินยอมให้ใช้ข้อมูล', required: true },
  ],
};

const access: Field[] = [
  { key: 'username', label: 'ชื่อผู้ใช้งาน', required: true },
  { key: 'password', label: 'รหัสผ่าน', required: true, inputType: 'password', placeholder: '123456' },
  { key: 'confirm', label: 'ยืนยันรหัสผ่าน', required: true, inputType: 'password', placeholder: '123456' },
];

@Component({
  selector: 'app-register-step',
  imports: [TopHeader, Steps, Tabs, InputField, DftButton, DataTable, DftModal, RouterLink, AddressSelect, EmailField, PhoneField, IdNumberField, ThaiDateField, FileField, PrefixField],
  templateUrl: './register-step-page.html',
  styleUrl: './register-step-page.css',
})
export class RegisterStepPage implements OnInit, OnDestroy {
  protected readonly agreement = agreementText;
  protected kind: Kind = 'corporate';
  protected step = 1;
  protected readonly tried = signal(false);
  protected readonly addingDirector = signal(false);
  protected readonly directorTab = signal(0);
  protected readonly directors = signal<Director[]>([]);
  protected readonly directorDraft = signal<Director[]>([emptyDirector()]);
  protected readonly dropOver = signal(false);
  protected readonly importName = signal('');
  protected readonly importPreview = signal('');
  protected readonly importKind = signal<'image' | 'pdf' | ''>('');
  protected readonly importRows = signal<Director[]>([]);
  protected readonly importNote = signal('');
  private directorTried = false;
  protected readonly checkingRegno = signal(false);
  protected readonly regnoCheck = signal<'idle' | 'success' | 'error'>('idle');
  private regnoTimer?: ReturnType<typeof setTimeout>;
  private importUrl = '';
  private readonly touched = signal<Readonly<Record<string, boolean>>>({});
  protected failed = false;
  protected readToEnd = false;
  private sub?: Subscription;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    protected readonly draft: RegisterDraft,
    private readonly places: ThaiAddress,
    private readonly accounts: Accounts,
  ) {}

  ngOnInit(): void {
    this.sub = this.route.paramMap.subscribe((params) => {
      const kind = params.get('kind');
      const step = Number(params.get('step'));
      if (kind !== 'corporate' && kind !== 'individual' && kind !== 'association') {
        void this.router.navigateByUrl('/register');
        return;
      }
      if (step < 1 || step > 4) {
        void this.router.navigate(['/register', kind, 1]);
        return;
      }
      this.kind = kind;
      this.step = step;
      this.readToEnd = !!this.draft.read[kind];
      this.tried.set(false);
      queueMicrotask(() => {
        const box = this.terms?.nativeElement;
        if (box && this.step === 1 && !this.draft.read[kind]) box.scrollTop = 0;
      });
      this.touched.set({});
      this.failed = false;
      this.directors.set([]);
      this.addingDirector.set(false);
      if ((kind === 'corporate' || kind === 'association') && !this.draft.values['country']) {
        this.draft.values['country'] = 'ประเทศไทย';
      }
      if (kind === 'individual' && !this.draft.values['identity']) {
        this.draft.values['identity'] = 'บัตรประจำตัวประชาชน';
      }
      if (step >= 3) this.assignUsername();
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.clearImport();
    clearTimeout(this.regnoTimer);
  }

  protected get title(): string {
    return titles[this.kind];
  }

  @ViewChild('terms') private terms?: ElementRef<HTMLElement>;

  protected get accepted(): boolean {
    return !!this.draft.accepted[this.kind];
  }

  protected get canAccept(): boolean {
    return this.readToEnd || this.accepted;
  }

  protected accept(checked: boolean): void {
    this.draft.accepted[this.kind] = checked;
  }

  protected onTermsScroll(box: HTMLElement): void {
    if (box.scrollTop + box.clientHeight >= box.scrollHeight - 2) {
      this.readToEnd = true;
      this.draft.read[this.kind] = true;
    }
  }

  protected get fields(): Field[] {
    if (this.step === 2) return details[this.kind];
    if (this.step === 3 || this.step === 4) return access;
    return [];
  }

  protected get nextLabel(): string {
    if (this.step === 2) return 'บันทึก';
    if (this.step === 3) return 'ยืนยันการลงทะเบียน';
    return 'ถัดไป';
  }

  protected get proceedState(): 'default' | 'disabled' {
    if (this.step === 1 && !this.accepted) return 'disabled';
    if (this.step === 3 && this.fields.some((field) => !this.fieldOk(field.key))) return 'disabled';
    return 'default';
  }

  protected get isCorporateForm(): boolean {
    return this.step === 2 && this.kind === 'corporate';
  }

  protected get isIndividualForm(): boolean {
    return this.step === 2 && this.kind === 'individual';
  }

  protected get isAssociationForm(): boolean {
    return this.step === 2 && this.kind === 'association';
  }

  protected get isAccessForm(): boolean {
    return this.step === 3 || this.step === 4;
  }

  protected get showFormChrome(): boolean {
    return this.step > 1;
  }

  protected fieldBy(key: string): Field {
    return this.fields.find((field) => field.key === key) ?? { key, label: key, required: true };
  }

  protected value(key: string): string {
    return this.draft.values[key] ?? '';
  }

  protected setValue(key: string, value: string): void {
    if (key === 'username') return;
    if (key === 'regno') this.regnoCheck.set('idle');
    this.draft.values[key] = value;
    if (key === 'regno' && this.step >= 3) this.assignUsername();
  }

  protected usernameState(): InputState {
    if (this.value('username')) return 'readonly';
    return this.stateOf(this.fieldBy('username'));
  }

  private assignUsername(): void {
    const regno = (this.draft.values['regno'] ?? '').replace(/[^A-Za-z0-9]/g, '').slice(0, 32);
    if (regno) {
      this.draft.values['username'] = regno;
      return;
    }
    if (usernameOk(this.draft.values['username'] ?? '')) return;
    const digits = new Uint32Array(2);
    crypto.getRandomValues(digits);
    this.draft.values['username'] = `${digits[0]}${digits[1]}`.replace(/\D/g, '').padStart(13, '0').slice(0, 13);
  }

  protected regnoState(): InputState {
    if (this.checkingRegno()) return 'loading';
    if (this.regnoCheck() === 'success') return 'success';
    if (this.regnoCheck() === 'error') return 'error';
    return this.stateOf(this.fieldBy('regno'));
  }

  protected regnoHelper(): string {
    if (this.checkingRegno()) return 'กำลังตรวจสอบข้อมูล';
    if (this.regnoCheck() === 'success') return 'ตรวจสอบข้อมูลแล้ว';
    if (this.regnoCheck() === 'error') return this.value('regno').trim() ? 'เลขทะเบียนไม่ถูกต้อง' : 'โปรดกรอกข้อมูลให้ครบถ้วน';
    return this.message('regno');
  }

  protected checkRegno(): void {
    this.touch('regno');
    const value = this.value('regno').trim();
    if (!value) {
      this.checkingRegno.set(false);
      this.regnoCheck.set('error');
      return;
    }
    this.regnoCheck.set('idle');
    this.checkingRegno.set(true);
    clearTimeout(this.regnoTimer);
    this.regnoTimer = setTimeout(() => {
      const current = this.value('regno').trim();
      const ok = this.value('country') === 'ต่างประเทศ' ? current.length >= 3 : thaiIdOk(current);
      this.checkingRegno.set(false);
      this.regnoCheck.set(current ? (ok ? 'success' : 'error') : 'idle');
    }, 1200);
  }

  protected invalid(key: string): boolean {
    return this.stateOf(this.fieldBy(key)) === 'error';
  }

  protected touch(key: string): void {
    this.touched.update((current) => ({ ...current, [key]: true }));
  }

  protected directorRows(): string[][] {
    return this.directors().map((item, index) => [String(index + 1), item.name, item.surname, item.action]);
  }

  protected importTable(): string[][] {
    return this.importRows().map((item, index) => [String(index + 1), item.name, item.surname, item.action]);
  }

  protected openDirector(): void {
    this.directorTried = false;
    this.directorTab.set(0);
    this.directorDraft.set([emptyDirector()]);
    this.clearImport();
    this.addingDirector.set(true);
  }

  protected closeDirector(event: Event): void {
    if ((event.target as HTMLElement).closest('.director')) return;
    this.addingDirector.set(false);
  }

  protected addDirectorRow(): void {
    this.directorDraft.update((rows) => [...rows, emptyDirector()]);
  }

  protected setDirectorCell(index: number, key: keyof Director, value: string): void {
    this.directorDraft.update((rows) => rows.map((row, item) => item === index ? { ...row, [key]: value } : row));
  }

  protected saveDirector(): void {
    this.directorTried = true;
    const source = this.directorTab() === 1 ? this.importRows() : this.directorDraft().filter((row) => !this.directorBlank(row));
    if (!source.length || source.some((row) => !this.directorReady(row))) return;
    const next = source.map((row) => ({ name: row.name.trim(), surname: row.surname.trim(), action: row.action.trim() }));
    this.directors.update((current) => [...current, ...next]);
    this.addingDirector.set(false);
  }

  protected directorState(index: number, key: keyof Director): 'default' | 'error' {
    const row = this.directorDraft()[index];
    if (!this.directorTried || !row) return 'default';
    const filled = this.directorDraft().some((item) => !this.directorBlank(item));
    if (this.directorBlank(row) && (filled || index !== 0)) return 'default';
    const value = row[key];
    if (key === 'action') return value.trim() ? 'default' : 'error';
    return personNameOk(value) ? 'default' : 'error';
  }

  protected directorMessage(index: number, key: keyof Director): string {
    if (this.directorState(index, key) !== 'error') return '';
    const value = this.directorDraft()[index][key];
    return key === 'action' ? 'โปรดกรอกข้อมูลให้ครบถ้วน' : fieldMessage(key, value);
  }

  protected allowDrop(event: DragEvent): void {
    event.preventDefault();
    this.dropOver.set(true);
  }

  protected importDropped(event: DragEvent): void {
    event.preventDefault();
    this.dropOver.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) void this.readImport(file);
  }

  protected importPicked(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) void this.readImport(file);
  }

  private directorBlank(row: Director): boolean {
    return !row.name.trim() && !row.surname.trim() && !row.action.trim();
  }

  private directorReady(row: Director): boolean {
    return personNameOk(row.name) && personNameOk(row.surname) && row.action.trim().length > 0;
  }

  private clearImport(): void {
    if (this.importUrl) URL.revokeObjectURL(this.importUrl);
    this.importUrl = '';
    this.importName.set('');
    this.importPreview.set('');
    this.importKind.set('');
    this.importRows.set([]);
    this.importNote.set('');
    this.dropOver.set(false);
  }

  private async readImport(file: File): Promise<void> {
    this.clearImport();
    this.importName.set(file.name);
    if (/\.(png|jpe?g)$/i.test(file.name) || file.type.startsWith('image/') || /\.pdf$/i.test(file.name)) {
      this.importUrl = URL.createObjectURL(file);
      this.importPreview.set(this.importUrl);
      this.importKind.set(file.type.startsWith('image/') || /\.(png|jpe?g)$/i.test(file.name) ? 'image' : 'pdf');
      this.importNote.set('ไฟล์นี้แสดงเป็นตัวอย่าง รายการกรรมการใช้ไฟล์ CSV');
      return;
    }
    const text = await file.text();
    const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const cells = lines.map((line) => line.split(/,|\t/).map((cell) => cell.trim().replace(/^"|"$/g, '')));
    const start = cells[0] && /ชื่อ/.test(cells[0][0] ?? '') ? 1 : 0;
    const rows = cells.slice(start).map((cell) => ({ name: cell[0] ?? '', surname: cell[1] ?? '', action: cell[2] ?? '' })).filter((row) => !this.directorBlank(row));
    this.importRows.set(rows);
    this.importNote.set(rows.length ? '' : 'ไม่พบรายการในไฟล์ ใช้รูปแบบ ชื่อ, นามสกุล, กระทำ');
  }

  protected message(key: string): string {
    if (this.stateOf(this.fieldBy(key)) !== 'error') return '';
    return fieldMessage(key, this.value(key), this.value('password'));
  }

  protected stateOf(field: Field): 'default' | 'error' {
    if (!this.tried() && !this.touched()[field.key]) return 'default';
    return this.fieldOk(field.key) ? 'default' : 'error';
  }

  private fieldOk(key: string): boolean {
    const value = this.value(key).trim();
    if (key === 'middle' || key === 'signature') return !value || (key === 'middle' ? personNameOk(value) : fileOk(value, false));
    const field = this.fields.find((item) => item.key === key);
    if (field && !field.required && !value) return true;
    if (!value && key !== 'province' && key !== 'district' && key !== 'subdistrict' && key !== 'postcode') return false;
    switch (key) {
      case 'email':
        return emailOk(value);
      case 'phone':
        return phoneOk(value);
      case 'regno':
        return this.value('country') === 'ต่างประเทศ' ? value.length >= 3 : thaiIdOk(value);
      case 'registered':
        return thaiDateOk(value, 'fromToday');
      case 'birth':
        return thaiDateOk(value, 'untilToday');
      case 'cert':
      case 'consent':
        return fileOk(value, true);
      case 'prefix':
        return prefixOk(value);
      case 'name':
      case 'surname':
        return personNameOk(value);
      case 'address':
      case 'place':
        return textOk(value, 5);
      case 'username':
        return usernameOk(value);
      case 'password':
        return passwordOk(value);
      case 'confirm':
        return value === this.value('password') && passwordOk(this.value('password'));
      case 'province':
      case 'district':
      case 'subdistrict':
      case 'postcode':
        return this.places.matches(this.value('province'), this.value('district'), this.value('subdistrict'), this.value('postcode'));
      default:
        return value.length > 0;
    }
  }

  protected back(): void {
    if (this.step === 1) {
      void this.router.navigateByUrl('/register');
      return;
    }
    void this.router.navigate(['/register', this.kind, this.step - 1]);
  }

  protected next(): void {
    this.tried.set(true);
    this.failed = false;
    if (this.proceedState === 'disabled') return;
    if (this.fields.some((field) => this.stateOf(field) === 'error')) {
      if (this.step === 3) this.failed = true;
      queueMicrotask(() => document.querySelector('.field--error, .upload--error, label.error')?.scrollIntoView({ block: 'center' }));
      return;
    }
    if (this.step === 3) this.accounts.save(this.value('username'), this.value('password'), this.kind);
    void this.router.navigate(['/register', this.kind, this.step + 1]);
  }

  protected closeFailed(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.modal__button')) return;
    this.failed = false;
  }

  protected finish(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.modal__button')) return;
    void this.router.navigateByUrl('/login');
  }
}
