import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-data-table',
  templateUrl: './data-table.html',
  styleUrl: './data-table.css',
})
export class DataTable {
  @Input() columns: string[] = [];
  @Input() rows: string[][] = [];
  @Input() pages: number[] = [];
  @Input() page = 1;
}
