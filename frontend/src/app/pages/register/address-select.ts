import { Component, Input, OnChanges, OnInit, Output, EventEmitter, signal } from '@angular/core';
import { ThaiAddress } from './thai-address';

type Field = 'province' | 'district' | 'subdistrict' | 'postcode';

@Component({
  selector: 'app-address-select',
  templateUrl: './address-select.html',
  styleUrl: './address-select.css',
})
export class AddressSelect implements OnInit, OnChanges {
  @Input() province = '';
  @Input() district = '';
  @Input() subdistrict = '';
  @Input() postcode = '';
  @Input() provinceError = false;
  @Input() districtError = false;
  @Input() subdistrictError = false;
  @Input() postcodeError = false;
  @Input() provinceMessage = '';
  @Input() districtMessage = '';
  @Input() subdistrictMessage = '';
  @Input() postcodeMessage = '';
  @Output() provinceChange = new EventEmitter<string>();
  @Output() districtChange = new EventEmitter<string>();
  @Output() subdistrictChange = new EventEmitter<string>();
  @Output() postcodeChange = new EventEmitter<string>();
  @Output() fieldBlur = new EventEmitter<Field>();

  protected readonly failed = signal(false);
  protected readonly open = signal<Field | null>(null);
  protected readonly filtering = signal(false);
  protected readonly active = signal(0);
  protected readonly provinceQuery = signal('');
  protected readonly districtQuery = signal('');
  protected readonly subdistrictQuery = signal('');
  protected readonly postcodeQuery = signal('');

  private readonly committed = {
    province: '',
    district: '',
    subdistrict: '',
    postcode: '',
  };

  constructor(protected readonly address: ThaiAddress) {}

  ngOnInit(): void {
    void this.address.load().then(
      () => undefined,
      () => this.failed.set(true),
    );
  }

  ngOnChanges(): void {
    this.sync('province', this.province);
    this.sync('district', this.district);
    this.sync('subdistrict', this.subdistrict);
    this.sync('postcode', this.postcode);
  }

  protected provinceNames(): string[] {
    return this.shown(this.address.provinces().map((item) => item.name.th), this.provinceQuery());
  }

  protected districtNames(): string[] {
    return this.shown(
      this.address.districtOptions(this.province).map((item) => item.name.th),
      this.districtQuery(),
    );
  }

  protected subdistrictNames(): string[] {
    return this.shown(
      this.address.subdistrictOptions(this.province, this.district).map((item) => item.name.th),
      this.subdistrictQuery(),
    );
  }

  protected postcodeNames(): string[] {
    const zips = this.address
      .subdistrictOptions(this.province, this.district)
      .map((item) => String(item.zip_code));
    return this.shown([...new Set(zips)], this.postcodeQuery());
  }

  protected show(field: Field): void {
    if (this.locked(field)) return;
    this.open.set(field);
    this.filtering.set(false);
    this.active.set(0);
  }

  protected type(field: Field, value: string): void {
    this.query(field).set(value);
    this.open.set(field);
    this.filtering.set(true);
    this.active.set(0);
  }

  protected key(field: Field, event: KeyboardEvent): void {
    const names = this.names(field);
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.open.set(field);
      this.active.update((index) => Math.min(index + 1, Math.max(names.length - 1, 0)));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.active.update((index) => Math.max(index - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const name = names[this.active()];
      if (name) this.pick(field, name);
    } else if (event.key === 'Escape') {
      this.query(field).set(this.committed[field]);
      this.open.set(null);
      this.filtering.set(false);
    }
  }

  protected leave(event: FocusEvent, field: Field): void {
    const next = event.relatedTarget;
    if (next instanceof Node && event.currentTarget instanceof Node && event.currentTarget.contains(next)) return;
    this.finish(field);
    this.fieldBlur.emit(field);
  }

  protected finish(field: Field): void {
    const typed = this.query(field)().trim();
    if (typed === this.committed[field]) {
      this.open.set(null);
      this.filtering.set(false);
      return;
    }
    const exact = this.allNames(field).find((name) => name === typed);
    if (exact) this.pick(field, exact);
    else {
      this.query(field).set(this.committed[field]);
      this.open.set(null);
      this.filtering.set(false);
    }
  }

  protected pick(field: Field, value: string): void {
    this.query(field).set(value);
    this.open.set(null);
    this.filtering.set(false);
    if (field === 'province') this.chooseProvince(value);
    else if (field === 'district') this.chooseDistrict(value);
    else if (field === 'subdistrict') this.chooseSubdistrict(value);
    else this.choosePostcode(value);
  }

  protected locked(field: Field): boolean {
    if (this.failed() || this.address.provinces().length === 0) return true;
    if (field === 'district') return !this.isProvince(this.province);
    if (field === 'subdistrict' || field === 'postcode') return !this.isDistrict(this.district);
    return false;
  }

  private chooseProvince(value: string): void {
    if (value === this.province) return;
    this.provinceChange.emit(value);
    this.districtChange.emit('');
    this.subdistrictChange.emit('');
    this.postcodeChange.emit('');
  }

  private chooseDistrict(value: string): void {
    if (value === this.district) return;
    this.districtChange.emit(value);
    this.subdistrictChange.emit('');
    this.postcodeChange.emit('');
  }

  private chooseSubdistrict(value: string): void {
    if (value === this.subdistrict) return;
    this.subdistrictChange.emit(value);
    const match = this.address.subdistrictOptions(this.province, this.district).find((item) => item.name.th === value);
    this.postcodeChange.emit(match ? String(match.zip_code) : '');
  }

  private choosePostcode(value: string): void {
    if (value === this.postcode && this.subdistrict) return;
    this.postcodeChange.emit(value);
    const matches = this.address
      .subdistrictOptions(this.province, this.district)
      .filter((item) => String(item.zip_code) === value);
    if (matches.length === 1) this.subdistrictChange.emit(matches[0].name.th);
    else if (!matches.some((item) => item.name.th === this.subdistrict)) this.subdistrictChange.emit('');
  }

  private sync(field: Field, value: string): void {
    if (value === this.committed[field]) return;
    this.committed[field] = value;
    this.query(field).set(value);
    if (this.open() === field) this.filtering.set(false);
  }

  private shown(names: string[], query: string): string[] {
    if (this.filtering() === false) return names;
    const text = query.trim();
    if (!text) return names;
    const starts = names.filter((name) => name.startsWith(text));
    const rest = names.filter((name) => !name.startsWith(text) && name.includes(text));
    return [...starts, ...rest];
  }

  private names(field: Field): string[] {
    if (field === 'province') return this.provinceNames();
    if (field === 'district') return this.districtNames();
    if (field === 'subdistrict') return this.subdistrictNames();
    return this.postcodeNames();
  }

  private allNames(field: Field): string[] {
    const filtering = this.filtering();
    this.filtering.set(false);
    const names = this.names(field);
    this.filtering.set(filtering);
    return names;
  }

  private query(field: Field) {
    if (field === 'province') return this.provinceQuery;
    if (field === 'district') return this.districtQuery;
    if (field === 'subdistrict') return this.subdistrictQuery;
    return this.postcodeQuery;
  }

  private isProvince(value: string): boolean {
    return this.address.provinces().some((item) => item.name.th === value);
  }

  private isDistrict(value: string): boolean {
    return this.address.districtOptions(this.province).some((item) => item.name.th === value);
  }
}
