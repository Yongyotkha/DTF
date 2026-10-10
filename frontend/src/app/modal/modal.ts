import { Component, EventEmitter, Input, Output } from '@angular/core';
import { OtpField } from '../fields/otp-field';
import { InputField, InputState } from '../input-field/input-field';

export type ModalKind =
  | 'confirm'
  | 'delete'
  | 'unsaved'
  | 'error'
  | 'warning'
  | 'loading'
  | 'success'
  | 'form'
  | 'email'
  | 'otp';

type ModalAction = { label: string; tone: 'primary' | 'outline' | 'danger' };

type ModalCopy = {
  title: string;
  message: string;
  closable: boolean;
  align: 'start' | 'center';
  icon: 'none' | 'error' | 'warning' | 'loading' | 'success' | 'email';
  actions: ModalAction[];
  form: boolean;
};

const copy: Record<ModalKind, ModalCopy> = {
  confirm: {
    title: 'ยืนยันการทำรายการ',
    message: 'คุณต้องการยืนยันการส่งข้อมูลใช่หรือไม่?',
    closable: true,
    align: 'start',
    icon: 'none',
    actions: [
      { label: 'ยกเลิก', tone: 'outline' },
      { label: 'ยืนยัน', tone: 'primary' },
    ],
    form: false,
  },
  delete: {
    title: 'ยืนยันการลบข้อมูล',
    message: 'คุณต้องการลบรายการที่เลือกใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้',
    closable: true,
    align: 'start',
    icon: 'none',
    actions: [
      { label: 'ยกเลิก', tone: 'outline' },
      { label: 'ลบข้อมูล', tone: 'danger' },
    ],
    form: false,
  },
  unsaved: {
    title: 'ละทิ้งการเปลี่ยนแปลง?',
    message: 'คุณมีข้อมูลที่ยังไม่ได้บันทึก คุณมีข้อมูลที่ยังไม่ได้บันทึก ทั้งหมดจะไม่ถูกบันทึก',
    closable: true,
    align: 'start',
    icon: 'none',
    actions: [
      { label: 'บันทึกเป็นร่าง', tone: 'outline' },
      { label: 'ออกไม่บันทึก', tone: 'danger' },
    ],
    form: false,
  },
  error: {
    title: 'เกิดข้อผิดพลาด',
    message: 'ไม่สามารถดำเนินการได้ในขณะนี้ กรุณาตรวจสอบข้อมูลและลองใหม่อีกครั้ง',
    closable: false,
    align: 'center',
    icon: 'error',
    actions: [{ label: 'ตกลง', tone: 'primary' }],
    form: false,
  },
  warning: {
    title: 'คำเตือน',
    message: 'การดำเนินการนี้อาจส่งผลกระทบต่อ ข้อมูลที่เกี่ยวข้อง กรุณายืนยันหากต้องการดำเนินการต่อ',
    closable: false,
    align: 'center',
    icon: 'warning',
    actions: [
      { label: 'ยกเลิก', tone: 'outline' },
      { label: 'ยืนยัน', tone: 'primary' },
    ],
    form: false,
  },
  loading: {
    title: 'กำลังดำเนินการ...',
    message: 'กรุณารอสักครู่ ระบบกำลังประมวลผล ข้อมูลของท่าน',
    closable: false,
    align: 'center',
    icon: 'loading',
    actions: [],
    form: false,
  },
  success: {
    title: 'ดำเนินการสำเร็จ',
    message: 'ระบบได้ทำการบันทึกข้อมูลเรียบร้อยแล้ว',
    closable: false,
    align: 'center',
    icon: 'success',
    actions: [{ label: 'ตกลง', tone: 'primary' }],
    form: false,
  },
  form: {
    title: 'Header',
    message: '',
    closable: true,
    align: 'start',
    icon: 'none',
    actions: [
      { label: 'ยกเลิก', tone: 'outline' },
      { label: 'ยืนยัน', tone: 'primary' },
    ],
    form: true,
  },
  email: {
    title: 'ส่งลิงก์ยืนยันตัวตนเรียบร้อยแล้ว',
    message: 'ระบบได้ส่งลิงก์สำหรับเปิดใช้งานบัญชี\nไปยังอีเมล support@datamining.co.th เรียบร้อยแล้ว',
    closable: false,
    align: 'center',
    icon: 'email',
    actions: [{ label: 'ตกลง', tone: 'primary' }],
    form: false,
  },
  otp: {
    title: 'ส่งรหัส OTP เรียบร้อยแล้ว',
    message: '',
    closable: false,
    align: 'center',
    icon: 'email',
    actions: [{ label: 'ยืนยัน', tone: 'primary' }],
    form: false,
  },
};

@Component({
  selector: 'app-modal',
  imports: [InputField, OtpField],
  templateUrl: './modal.html',
  styleUrl: './modal.css',
})
export class DftModal {
  @Input() kind: ModalKind = 'confirm';
  @Input() email = '';
  @Input() heading = '';
  @Input() detail: string | null = null;
  @Input() actions = true;
  @Input() otp = '';
  @Input() otpState: InputState = 'default';
  @Input() otpHelper = '';
  @Input() otpLeft = 0;
  @Input() otpClock = '';
  @Input() otpResent = false;
  @Output() otpChange = new EventEmitter<string>();
  @Output() otpResend = new EventEmitter<void>();

  protected get content(): ModalCopy {
    const base = copy[this.kind];
    return {
      ...base,
      title: this.heading || base.title,
      message: this.detail === null ? base.message : this.detail,
      actions: this.actions ? base.actions : [],
    };
  }

  protected get emailAddress(): string {
    return this.email.trim() || 'support@datamining.co.th';
  }
}
