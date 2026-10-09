import { Component } from '@angular/core';
import { ButtonState, ButtonType, DftButton } from '../../button/button';
import { DataTable } from '../../data-table/data-table';
import { Dropdown } from '../../dropdown/dropdown';
import { HeaderMenu } from '../../header-menu/header-menu';
import { HoverMenu } from '../../hover-menu/hover-menu';
import { InputField, InputKind, InputState } from '../../input-field/input-field';
import { MenuGroup } from '../../menu-bar/menu-group';
import { MenuItem } from '../../menu-bar/menu-item';
import { DftModal, ModalKind } from '../../modal/modal';
import { StatusTag, StatusTone, StatusVariant } from '../../status-tag/status-tag';
import { Steps } from '../../steps/steps';
import { StepperOne } from '../../stepper-1/stepper-1';
import { StepsMenu } from '../../steps-menu/steps-menu';
import { StepsMenuItem } from '../../steps-menu/steps-menu-item';
import { Tabs } from '../../tabs/tabs';
import { TopHeader } from '../../top-header/top-header';
import { VerticalPhase } from '../../vertical-stepper/vertical-phase';
import { VerticalStep } from '../../vertical-stepper/vertical-step';

@Component({
  selector: 'app-design-system',
  imports: [StatusTag, InputField, DftButton, DataTable, DftModal, MenuItem, MenuGroup, Tabs, Steps, TopHeader, Dropdown, HoverMenu, HeaderMenu, StepsMenuItem, StepsMenu, VerticalStep, VerticalPhase, StepperOne],
  templateUrl: './design-system.html',
  styleUrl: './design-system.css',
})
export class DesignSystemPage {
  protected readonly tones: StatusTone[] = ['success', 'info', 'warning', 'danger', 'neutral'];
  protected readonly variants: StatusVariant[] = ['soft', 'solid', 'outline'];
  protected readonly inputKinds: InputKind[] = ['text', 'date', 'search', 'dropdown', 'multi'];
  protected readonly inputColumns: InputState[] = ['default', 'focus', 'disabled'];
  protected readonly buttonTypes: { type: ButtonType; label: string }[] = [
    { type: 'primary', label: 'Button' },
    { type: 'secondary', label: 'Button' },
    { type: 'outline', label: 'Button' },
    { type: 'ghost', label: 'Button' },
    { type: 'pill', label: 'Continue with ThaiD' },
    { type: 'danger', label: 'Button' },
    { type: 'danger-outline', label: 'Button' },
    { type: 'link', label: 'Text link' },
  ];
  protected readonly buttonStates: ButtonState[] = ['default', 'hover', 'pressed', 'focus', 'disabled'];
  protected readonly tableColumns = Array.from({ length: 8 }, () => 'header');
  protected readonly tableRows = Array.from({ length: 5 }, () => Array.from({ length: 8 }, () => 'text'));
  protected readonly modalKinds: ModalKind[] = ['confirm', 'delete', 'unsaved', 'form', 'loading', 'success', 'error', 'warning', 'email'];
  protected readonly businessMenus = [
    { title: 'คำขอ', items: ['ยื่นคำขอ', 'รายการยื่นคำขอ', 'แก้ไขผู้กระทำแทน'] },
    { title: 'กระบวนการไต่สวน', items: ['Case ID', 'ลงทะเบียนผู้มีส่วนได้เสีย', 'รับ-ส่งข้อมูลอื่นๆ', 'รายงาน'] },
    { title: 'คำร้อง', items: ['ยื่นคำร้องขอพบเจ้าหน้าที่', 'รายการยื่นคำร้องขอพบเจ้าหน้าที่', 'ยื่นคำร้องขอข้อมูลข่าวสาร', 'รายการยื่นคำร้องขอข้อมูลข่าวสาร'] },
  ];
  protected readonly officerMenus = [
    { title: 'คำขอ', items: ['ยื่นคำขอ', 'รายการยื่นคำขอ', 'แก้ไขผู้กระทำแทน'] },
    { title: 'กระบวนการไต่สวน', items: ['Case ID', 'ลงทะเบียนผู้มีส่วนได้เสีย', 'รับ-ส่งข้อมูลอื่นๆ', 'รายงาน'] },
    { title: 'คำร้อง', items: ['ยื่นคำร้องขอพบเจ้าหน้าที่', 'รายการยื่นคำร้องขอพบเจ้าหน้าที่', 'ยื่นคำร้องขอข้อมูลข่าวสาร', 'รายการยื่นคำร้องขอข้อมูลข่าวสาร'] },
    { title: 'ระบบ Task Management', items: ['ยื่นคำร้องขอพบเจ้าหน้าที่', 'รายการยื่นคำร้องขอพบเจ้าหน้าที่', 'ยื่นคำร้องขอข้อมูลข่าวสาร', 'รายการยื่นคำร้องขอข้อมูลข่าวสาร'] },
    { title: 'จัดเก็บเอกสารอิเล็กทรอนิกส์', items: ['ยื่นคำร้องขอพบเจ้าหน้าที่', 'รายการยื่นคำร้องขอพบเจ้าหน้าที่', 'ยื่นคำร้องขอข้อมูลข่าวสาร', 'รายการยื่นคำร้องขอข้อมูลข่าวสาร'] },
    { title: 'ตั้งค่าระบบ', items: ['ตั้งค่าผู้ใช้งานและสิทธิ์เข้าใช้งาน'] },
  ];
}
