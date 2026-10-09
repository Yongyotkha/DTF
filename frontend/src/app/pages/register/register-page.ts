import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TopHeader } from '../../top-header/top-header';

type RegisterCard = {
  kind: 'corporate' | 'individual' | 'association';
  title: string;
  audience: string;
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
      audience: 'บริษัทจำกัด • ห้างหุ้นส่วน • นิติบุคคลต่างชาติ',
      body: 'สำหรับนิติบุคคลที่จดทะเบียนพาณิชย์ใน\nประเทศไทย รองรับการเชื่อมโยงข้อมูล\nอัตโนมัติจากกรมพัฒนาธุรกิจการค้า\n(DBD)',
      action: 'เลือกลงทะเบียนนิติบุคคล',
      icon: 'assets/auth/icon-corporate.svg',
    },
    {
      kind: 'individual',
      title: 'บุคคลธรรมดา',
      audience: 'ประชาชนทั่วไป • ผู้ประกอบการรายบุคคล • ผู้รับมอบอำนาจ',
      body: 'สำหรับผู้ประกอบการบุคคลธรรมดา\nตัวแทนอิสระ หรือประชาชนที่ต้องการ\nขอรับสิทธิประโยชน์และใบรับรองทางการ\nค้า',
      action: 'เลือกลงทะเบียนบุคคลธรรมดา',
      icon: 'assets/auth/icon-individual.svg',
    },
    {
      kind: 'association',
      title: 'สมาคมการค้า',
      audience: 'สมาคมการค้า • สภาหอการค้า • สภาอุตสาหกรรม',
      body: 'สำหรับสมาคมการค้า องค์กรวิชาชีพ หรือ\nหอการค้าที่มีความประสงค์ยื่นขอรับรอง\nโควตา และกำกับดูแลข้อมูลสมาชิก',
      action: 'เลือกลงทะเบียนสมาคมการค้า',
      icon: 'assets/auth/icon-association.svg',
    },
  ];
}
