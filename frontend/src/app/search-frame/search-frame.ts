import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DftButton } from '../button/button';

export type SearchOption = { value: string; label: string };

export type SearchField = {
  id: string;
  label: string;
  kind: 'text' | 'select' | 'readonly';
  placeholder?: string;
  options?: SearchOption[];
  value?: string;
  digits?: boolean;
  maxLength?: number;
};

@Component({
  selector: 'app-search-frame',
  imports: [DftButton],
  templateUrl: './search-frame.html',
  styleUrl: './search-frame.css',
})
export class SearchFrame {
  @Input() fields: SearchField[] = [];
  @Input() sorts: SearchOption[] = [];
  @Input() sort = '';
  @Output() sortChange = new EventEmitter<string>();
  @Output() search = new EventEmitter<Record<string, string>>();
  @Output() clear = new EventEmitter<void>();

  protected values: Record<string, string> = {};

  protected textOf(id: string): string {
    return this.values[id] ?? '';
  }

  protected setText(id: string, raw: string, field: SearchField): void {
    let value = raw;
    if (field.digits) {
      value = value.replace(/\D/g, '');
      if (field.maxLength && field.maxLength > 0) value = value.slice(0, field.maxLength);
    }
    this.values = { ...this.values, [id]: value };
  }

  protected setSelect(id: string, value: string): void {
    this.values = { ...this.values, [id]: value };
  }

  protected onEnter(event: Event): void {
    if (!(event.target instanceof HTMLInputElement) || event.target.readOnly) return;
    event.preventDefault();
    this.run();
  }

  protected run(): void {
    const next: Record<string, string> = {};
    for (const field of this.fields) {
      if (field.kind === 'readonly') continue;
      const value = (this.values[field.id] ?? '').trim();
      if (value) next[field.id] = value;
    }
    this.search.emit(next);
  }

  protected wipe(): void {
    this.values = {};
    if (this.sorts.length) this.sortChange.emit(this.sorts[0].value);
    this.clear.emit();
  }
}
