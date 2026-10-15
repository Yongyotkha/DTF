import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DftButton } from '../../button/button';
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
  imports: [TopHeader, RouterLink, DftButton],
  templateUrl: './register-page.html',
  styleUrl: './register-page.css',
})
export class RegisterPage {
  constructor(private readonly router: Router) {}

  protected goLogin(): void {
    void this.router.navigateByUrl('/login');
  }
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
