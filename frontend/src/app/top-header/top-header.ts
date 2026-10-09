import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-top-header',
  templateUrl: './top-header.html',
  styleUrl: './top-header.css',
})
export class TopHeader {
  @Input() name = 'บริษัท โนเนม จำกัด';
}
