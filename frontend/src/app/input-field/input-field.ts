import { Component, ElementRef, EventEmitter, HostListener, Input, Output, signal } from '@angular/core';
import { DateLimit, dateAllowed, parseThaiDate, startOfToday } from '../fields/field-rules';

export type InputKind = 'text' | 'date' | 'search' | 'dropdown' | 'multi' | 'textarea';
export type InputState =
  | 'default'
  | 'focus'
  | 'disabled'
  | 'hover'
  | 'filled'
  | 'error'
  | 'readonly'
  | 'loading'
  | 'success';
export type InputSize = 'sm' | 'md' | 'lg';

const placeholders: Record<InputKind, string> = {
  text: 'ระบุ',
  date: '22/09/2569',
  search: 'ค้นหา',
  dropdown: 'เลือก',
  multi: '',
  textarea: 'text',
};

@Component({
  selector: 'app-input-field',
  templateUrl: './input-field.html',
  styleUrl: './input-field.css',
})
export class InputField {
  @Input() kind: InputKind = 'text';
  @Input() state: InputState = 'default';
  @Input() size: InputSize = 'md';
  @Input() label = 'Label';
  @Input() required = false;
  @Input() optional = false;
  @Input() value = '';
  @Input() placeholder = '';
  @Input() editable = false;
  @Input() calendar = false;
  @Input() dateLimit: DateLimit = 'any';
  @Input() inputType: 'text' | 'password' | 'email' = 'text';
  @Output() valueChange = new EventEmitter<string>();
  @Output() blurred = new EventEmitter<void>();
  @Input() helper = '';
  @Input() digitsOnly = false;
  @Input() maxLength = 0;
  @Input() counter = '';
  @Input() font: 'thai' | 'inter' = 'thai';

  protected readonly calendarOpen = signal(false);
  protected readonly calendarMode = signal<'day' | 'month' | 'year'>('day');
  protected readonly viewMonth = signal(0);
  protected readonly viewYear = signal(new Date().getFullYear());
  protected readonly yearPage = signal(new Date().getFullYear() - 5);
  protected readonly weekdays = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
  protected readonly months = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
  ];
  protected readonly monthShort = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

  constructor(private readonly host: ElementRef<HTMLElement>) {}

  protected get shown(): string {
    if (this.value) return this.value;
    if (this.placeholder) return this.placeholder;
    return placeholders[this.kind];
  }

  protected get placeholdersHint(): string {
    return this.placeholder || placeholders[this.kind];
  }

  protected get isPlaceholder(): boolean {
    return !this.value;
  }

  protected get locked(): boolean {
    return this.state === 'disabled' || this.state === 'readonly' || this.state === 'loading';
  }

  protected changed(event: Event): void {
    const input = event.target as HTMLInputElement | HTMLTextAreaElement;
    let next = input.value;
    if (this.digitsOnly) {
      next = next.replace(/\D/g, '');
      if (this.maxLength > 0) next = next.slice(0, this.maxLength);
      if (input.value !== next) input.value = next;
    }
    this.valueChange.emit(next);
  }

  protected toggleCalendar(event: Event): void {
    if (!this.calendar || this.locked) return;
    const target = event.target;
    if (target instanceof Node && this.host.nativeElement.querySelector('.picker')?.contains(target)) return;
    if (this.calendarOpen()) {
      this.calendarOpen.set(false);
      return;
    }
    const parsed = parseThaiDate(this.value);
    const today = startOfToday();
    const base = parsed && dateAllowed(parsed, this.dateLimit) ? parsed : new Date();
    this.viewMonth.set(base.getMonth());
    this.viewYear.set(base.getFullYear());
    this.calendarMode.set('day');
    this.calendarOpen.set(true);
  }

  protected shiftCalendar(step: number): void {
    const currentYear = new Date().getFullYear();
    if (this.calendarMode() === 'year') {
      this.yearPage.update((year) => this.clampYearPage(year + step * 12, currentYear));
      return;
    }
    if (this.calendarMode() === 'month') {
      this.viewYear.update((year) => this.clampYear(year + step, currentYear));
      return;
    }
    const next = new Date(this.viewYear(), this.viewMonth() + step, 1);
    const currentMonth = new Date(currentYear, new Date().getMonth(), 1);
    if (this.dateLimit === 'fromToday' && next < currentMonth) return;
    if (this.dateLimit === 'untilToday' && next > currentMonth) return;
    this.viewYear.set(next.getFullYear());
    this.viewMonth.set(next.getMonth());
  }

  protected showMonths(): void {
    this.calendarMode.set('month');
  }

  protected showYears(): void {
    const now = new Date().getFullYear();
    if (this.dateLimit === 'fromToday') this.yearPage.set(Math.max(this.viewYear() - 5, now));
    else if (this.dateLimit === 'untilToday') this.yearPage.set(Math.min(this.viewYear() - 5, now - 11));
    else this.yearPage.set(this.viewYear() - 5);
    this.calendarMode.set('year');
  }

  protected chooseMonth(month: number): void {
    if (this.pastMonth(month)) return;
    this.viewMonth.set(month);
    this.calendarMode.set('day');
  }

  protected chooseYear(year: number): void {
    if (this.pastYear(year)) return;
    this.viewYear.set(year);
    this.calendarMode.set('month');
  }

  protected chooseDay(day: number | null): void {
    if (!day || this.pastDay(day)) return;
    const date = new Date(this.viewYear(), this.viewMonth(), day);
    const text = `${String(day).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear() + 543}`;
    this.valueChange.emit(text);
    this.calendarOpen.set(false);
  }

  protected blockedPrevious(): boolean {
    if (this.dateLimit !== 'fromToday') return false;
    const today = new Date();
    if (this.calendarMode() === 'year') return this.yearPage() <= today.getFullYear();
    if (this.calendarMode() === 'month') return this.viewYear() <= today.getFullYear();
    return this.viewYear() < today.getFullYear()
      || (this.viewYear() === today.getFullYear() && this.viewMonth() <= today.getMonth());
  }

  protected blockedNext(): boolean {
    if (this.dateLimit !== 'untilToday') return false;
    const today = new Date();
    if (this.calendarMode() === 'year') return this.yearPage() + 11 >= today.getFullYear();
    if (this.calendarMode() === 'month') return this.viewYear() >= today.getFullYear();
    return this.viewYear() > today.getFullYear()
      || (this.viewYear() === today.getFullYear() && this.viewMonth() >= today.getMonth());
  }

  protected pastDay(day: number): boolean {
    return !dateAllowed(new Date(this.viewYear(), this.viewMonth(), day), this.dateLimit);
  }

  protected pastMonth(month: number): boolean {
    const today = new Date();
    if (this.dateLimit === 'fromToday') {
      return this.viewYear() < today.getFullYear()
        || (this.viewYear() === today.getFullYear() && month < today.getMonth());
    }
    if (this.dateLimit === 'untilToday') {
      return this.viewYear() > today.getFullYear()
        || (this.viewYear() === today.getFullYear() && month > today.getMonth());
    }
    return false;
  }

  protected pastYear(year: number): boolean {
    const current = new Date().getFullYear();
    if (this.dateLimit === 'fromToday') return year < current;
    if (this.dateLimit === 'untilToday') return year > current;
    return false;
  }

  protected calendarDays(): { day: number | null; selected: boolean; past: boolean }[] {
    const year = this.viewYear();
    const month = this.viewMonth();
    const start = new Date(year, month, 1).getDay();
    const count = new Date(year, month + 1, 0).getDate();
    const parsed = parseThaiDate(this.value);
    const cells: { day: number | null; selected: boolean; past: boolean }[] = [];
    for (let index = 0; index < start; index += 1) cells.push({ day: null, selected: false, past: false });
    for (let day = 1; day <= count; day += 1) {
      const selected = !!parsed
        && parsed.getFullYear() === year
        && parsed.getMonth() === month
        && parsed.getDate() === day;
      cells.push({ day, selected, past: this.pastDay(day) });
    }
    return cells;
  }

  protected calendarYears(): number[] {
    const start = this.yearPage();
    return Array.from({ length: 12 }, (_, index) => start + index);
  }

  protected buddhist(year: number): number {
    return year + 543;
  }

  @HostListener('document:pointerdown', ['$event'])
  protected closeCalendar(event: PointerEvent): void {
    if (!this.calendarOpen()) return;
    const target = event.target;
    if (target instanceof Node && this.host.nativeElement.contains(target)) return;
    this.calendarOpen.set(false);
  }

  private clampYear(year: number, currentYear: number): number {
    if (this.dateLimit === 'fromToday') return Math.max(currentYear, year);
    if (this.dateLimit === 'untilToday') return Math.min(currentYear, year);
    return year;
  }

  private clampYearPage(year: number, currentYear: number): number {
    if (this.dateLimit === 'fromToday') return Math.max(currentYear, year);
    if (this.dateLimit === 'untilToday') return Math.min(year, currentYear - 11);
    return year;
  }
}
