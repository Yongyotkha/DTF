import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TopHeader } from '../../top-header/top-header';

type RegisterCard = {
  kind: 'corporate' | 'individual' | 'association';
  title: string;
  body: string;
  action: string;
  icon: string;
};

@Component({
  selector: 'app-register-page',
  imports: [TopHeader, RouterLink],
  templateUrl: './register-page.html',
  styleUrl: './register-page.css',
})
export class RegisterPage {
  protected readonly cards: RegisterCard[] = [
    {
      kind: 'corporate',
      title: 'นิติบุคคล',
      body: 'สำหรับนิติบุคคลที่จดทะเบียนพาณิชย์ในประเทศไทย',
      action: 'เลือกลงทะเบียนนิติบุคคล',
      icon: 'assets/auth/icon-corporate.svg',
    },
    {
      kind: 'individual',
      title: 'บุคคลธรรมดา',
      body: 'สำหรับผู้ประกอบการบุคคลธรรมดา',
      action: 'เลือกลงทะเบียนบุคคลธรรมดา',
      icon: 'assets/auth/icon-individual.svg',
    },
    {
      kind: 'association',
      title: 'สมาคมการค้า',
      body: 'สำหรับสมาคมการค้าและหอการค้า',
      action: 'เลือกลงทะเบียนสมาคมการค้า',
      icon: 'assets/auth/icon-association.svg',
    },
  ];
}
