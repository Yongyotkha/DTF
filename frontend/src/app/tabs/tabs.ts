import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.html',
  styleUrl: './tabs.css',
})
export class Tabs {
  @Input() labels: string[] = ['Button'];
  @Input() marks: number[] = [];
  @Output() activeChange = new EventEmitter<number>();
  protected active = 0;

  protected select(index: number): void {
    this.active = index;
    this.activeChange.emit(index);
  }
}
