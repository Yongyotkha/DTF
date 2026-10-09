import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-steps',
  templateUrl: './steps.html',
  styleUrl: './steps.css',
})
export class Steps {
  @Input() labels = ['ข้อตกลง', 'กรอกข้อมูล', 'การเข้าใช้งาน'];
  @Input() current = 1;
}
