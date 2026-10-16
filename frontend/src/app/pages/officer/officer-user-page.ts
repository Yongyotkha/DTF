import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { accessRoles, Accounts, roleLabel } from '../../accounts';
import { DftButton } from '../../button/button';
import { PrefixField } from '../../fields/prefix-field';
import { InputField, InputState } from '../../input-field/input-field';
import { SideNav, systemMenus } from '../../menu-bar/side-nav';
import { DftModal } from '../../modal/modal';
import { staffGroups, staffPeople } from '../staff/staff-roster';
import { TopHeader } from '../../top-header/top-header';

@Component({
  selector: 'app-officer-user-page',
  imports: [TopHeader, SideNav, DftButton, InputField, PrefixField, DftModal],
  templateUrl: './officer-user-page.html',
  styleUrls: ['./officer-groups-page.css', './officer-user-page.css'],
})
export class OfficerUserPage {
  protected editing = false;
  protected admin = false;
  protected sourceId = '';
  protected fullName = '';
  protected phone = '';
  protected email = '';
  protected unit = '';
  protected title = '';
  protected userType = '';
  protected accessGroupId = '';
  protected staffCode = '';
  protected loginName = '';
  protected password = '';
  protected confirmPassword = '';
  protected submitted = false;
  protected saved = false;
  protected staffHelp = '';
  protected readonly settingMenus = systemMenus;
  protected readonly units = staffGroups;
  protected readonly titles = [...new Set(staffPeople.map((person) => person.title))];

  protected get userTypes(): string[] {
    return this.admin ? ['ผู้ดูแลระบบ'] : accessRoles.map((item) => item.label);
  }

  protected get accessGroups() {
    return this.accounts.groupCatalog().filter((group) => group.id !== 'admin');
  }

  protected get accessGroupNames(): string[] {
    return this.accessGroups.map((group) => group.name);
  }

  protected get accessGroupName(): string {
    return this.accessGroups.find((group) => group.id === this.accessGroupId)?.name ?? '';
  }

  protected pickAccessGroup(name: string): void {
    this.accessGroupId = this.accessGroups.find((group) => group.name === name)?.id ?? '';
  }

  constructor(
    private readonly router: Router,
    route: ActivatedRoute,
    private readonly accounts: Accounts,
  ) {
    this.editing = route.snapshot.data['edit'] === true;
    this.admin = route.snapshot.data['admin'] === true;
    if (!this.editing) {
      if (this.admin) {
        this.userType = 'ผู้ดูแลระบบ';
        return;
      }
      const requested = route.snapshot.queryParamMap.get('group') ?? '';
      const groups = this.accessGroups;
      this.accessGroupId = groups.some((group) => group.id === requested) ? requested : (groups.find((group) => group.id === 'intake')?.id ?? groups[0]?.id ?? '');
      this.userType = this.roleLabelFor(this.accessGroupId);
      return;
    }
    const username = route.snapshot.queryParamMap.get('user') ?? '';
    const account = accounts.accountOf(username);
    if (!account) return;
    this.sourceId = username;
    const roster = staffPeople.find((person) => person.name === account.person);
    const position = roster?.title && this.titles.includes(roster.title)
      ? roster.title
      : this.titles.includes(account.personTitle) ? account.personTitle : '';
    this.fullName = account.person || roleLabel[account.role];
    this.phone = account.phone;
    this.email = account.email;
    this.unit = account.unit && this.units.includes(account.unit)
      ? account.unit
      : roster && this.units.includes(roster.unit) ? roster.unit : '';
    this.title = position;
    this.accessGroupId = this.admin ? '' : (accounts.groupIdOf(username) || route.snapshot.queryParamMap.get('group') || '');
    this.userType = this.admin ? 'ผู้ดูแลระบบ' : (accessRoles.find((item) => item.role === account.role)?.label ?? this.roleLabelFor(this.accessGroupId));
    this.staffCode = account.staffCode || (this.admin && /^\d{13}$/.test(username) ? username : '');
    this.loginName = account.loginName || (!this.admin && /^\d{13}$/.test(username) ? username : (this.staffCode ? '' : username));
    this.password = account.password;
    this.confirmPassword = account.password;
  }

  protected back(): void {
    void this.router.navigateByUrl(this.admin ? '/officer/admins' : '/officer/groups');
  }

  protected save(): void {
    this.submitted = true;
    this.staffHelp = '';
    if (!this.canSave()) return;
    const loginTaken = !this.admin && this.loginOwnedBySomeoneElse();
    if (!this.admin && this.loginName.trim() && !/^\d{13}$/.test(this.loginName.trim())) return;
    if (loginTaken) return;
    const role = this.admin
      ? (accessRoles.find((item) => item.label === this.userType)?.role ?? 'officer')
      : (accessRoles.find((item) => item.label === this.userType)?.role ?? 'staff');
    const profile = {
      password: this.password,
      role,
      email: this.email.trim(),
      person: this.fullName.trim(),
      personTitle: this.title.trim() || (this.admin ? 'ผู้ดูแลระบบ' : ''),
      phone: this.phone.trim(),
      unit: this.unit.trim(),
      loginName: this.loginName.trim(),
      staffCode: this.staffCode.trim(),
    };
    if (this.editing) {
      if (!this.accounts.updateGroupUser(this.sourceId, profile)) return;
      if (!this.admin && !this.accounts.placeInGroup(this.sourceId, this.accessGroupId)) return;
      this.saved = true;
      return;
    }
    const username = this.admin
      ? (this.staffCode.trim() || this.loginName.trim())
      : this.loginName.trim();
    const created = this.accounts.createGroupUser({
      groupId: this.admin ? 'admin' : this.accessGroupId,
      username,
      ...profile,
    });
    if (!created) {
      this.staffHelp = this.admin ? 'รหัสเจ้าหน้าที่นี้มีอยู่แล้ว' : '';
      return;
    }
    this.saved = true;
  }

  protected closeSaved(): void {
    this.saved = false;
    this.back();
  }

  protected get nameState(): InputState {
    if (!this.submitted) return 'default';
    if (!this.loginName.trim()) return 'error';
    if (!this.admin && !/^\d{13}$/.test(this.loginName.trim())) return 'error';
    if (!this.admin && this.loginOwnedBySomeoneElse()) return 'error';
    return 'default';
  }

  protected get nameHelp(): string {
    if (this.nameState !== 'error') return '';
    if (!this.loginName.trim()) return 'โปรดกรอกชื่อผู้ใช้งาน';
    if (!this.admin && !/^\d{13}$/.test(this.loginName.trim())) return 'โปรดกรอกชื่อผู้ใช้งาน 13 หลัก';
    return 'ชื่อผู้ใช้งานนี้มีอยู่แล้ว';
  }

  protected fieldState(value: string): InputState {
    return this.submitted && !value.trim() ? 'error' : 'default';
  }

  protected get accessGroupError(): boolean {
    return !this.admin && this.submitted && !this.accessGroupId;
  }

  protected get confirmState(): InputState {
    if (!this.submitted) return 'default';
    return this.password && this.confirmPassword === this.password ? 'default' : 'error';
  }

  protected get confirmHelp(): string {
    if (this.confirmState !== 'error') return '';
    return this.confirmPassword ? 'รหัสผ่านไม่ตรงกัน' : 'โปรดกรอกรหัสผ่าน';
  }

  private canSave(): boolean {
    return !!this.fullName.trim()
      && (this.editing || !!this.phone.trim())
      && !!this.email.trim()
      && !!this.loginName.trim()
      && (this.admin || /^\d{13}$/.test(this.loginName.trim()))
      && (this.admin || !!this.accessGroupId)
      && !!this.password
      && this.confirmPassword === this.password;
  }

  private loginOwnedBySomeoneElse(): boolean {
    const owner = this.accounts.signInId(this.loginName);
    return !!owner && owner !== this.sourceId;
  }

  private roleLabelFor(groupId: string): string {
    const role = groupId === 'applicant' ? 'corporate'
      : groupId === 'intake' ? 'staff'
        : groupId === 'director' ? 'director'
          : groupId === 'head' ? 'head'
            : 'officer';
    return accessRoles.find((item) => item.role === role)?.label ?? 'เจ้าหน้าที่รับเรื่อง';
  }
}
