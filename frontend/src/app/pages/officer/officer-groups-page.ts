import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { accessRoles, Accounts, AccountRole, GroupMember } from '../../accounts';
import { DftButton } from '../../button/button';
import { InputField } from '../../input-field/input-field';
import { SideNav, systemMenus, loginPermissionMenus, menusForLoginRole } from '../../menu-bar/side-nav';
import { DftModal } from '../../modal/modal';
import { Tabs } from '../../tabs/tabs';
import { TopHeader } from '../../top-header/top-header';

@Component({
  selector: 'app-officer-groups-page',
  imports: [TopHeader, SideNav, Tabs, DftButton, InputField, DftModal],
  templateUrl: './officer-groups-page.html',
  styleUrl: './officer-groups-page.css',
})
export class OfficerGroupsPage {
  protected selected = 0;
  protected panelTab = 0;
  protected query = '';
  protected page = 1;
  protected readonly pageSize = 10;
  protected adding = false;
  protected saved = false;
  protected removing = '';
  protected removingGroup = false;
  protected groupNameError = '';
  protected newGroupName = '';
  protected draftName = '';
  protected pickedMenus = new Set<string>();
  protected readonly panelTabs = ['ผู้ใช้งานในกลุ่ม', 'ตั้งค่ากลุ่มและสิทธิ์'];
  protected readonly settingMenus = systemMenus;

  constructor(
    private readonly accounts: Accounts,
    private readonly router: Router,
  ) {}

  protected addUser(): void {
    const group = this.catalog[this.selected];
    void this.router.navigate(['/officer/users/new'], { queryParams: { group: group?.id ?? '' } });
  }

  protected editUser(username: string): void {
    const group = this.catalog[this.selected];
    void this.router.navigate(['/officer/users/edit'], { queryParams: { user: username, group: group?.id ?? '' } });
  }

  protected askDelete(username: string): void {
    this.removing = username;
  }

  protected finishDelete(action: string): void {
    const group = this.catalog[this.selected];
    if (action === 'ลบข้อมูล' && group) this.accounts.removeGroupUser(group.id, this.removing);
    if (this.page > this.pageCount) this.page = this.pageCount;
    this.removing = '';
  }

  protected get tabs(): string[] {
    return this.catalog.map((group) => group.name);
  }

  protected get members(): GroupMember[] {
    const group = this.catalog[this.selected];
    if (!group) return [];
    const query = this.query.trim();
    return this.accounts.groupMembers(group.id).filter((member) => !query || `${member.username} ${member.name} ${member.title}`.includes(query));
  }

  protected get pageCount(): number {
    return Math.max(1, Math.ceil(this.listed.length / this.pageSize));
  }

  protected get safePage(): number {
    return Math.min(this.page, this.pageCount);
  }

  protected get pageNumbers(): number[] {
    return Array.from({ length: this.pageCount }, (_, index) => index + 1);
  }

  protected get visibleMembers(): GroupMember[] {
    const start = (this.safePage - 1) * this.pageSize;
    return this.listed.slice(start, start + this.pageSize);
  }

  protected openAddGroup(): void {
    this.newGroupName = '';
    this.groupNameError = '';
    this.adding = true;
  }

  protected typeGroupName(value: string): void {
    this.newGroupName = value;
    this.groupNameError = '';
  }

  protected finishAddGroup(action: string): void {
    if (action !== 'ยืนยัน') {
      this.adding = false;
      this.groupNameError = '';
      return;
    }
    if (!this.newGroupName.trim()) {
      this.groupNameError = 'โปรดกรอกชื่อกลุ่ม';
      return;
    }
    const id = this.accounts.addGroup(this.newGroupName);
    if (!id) return;
    const index = this.catalog.findIndex((group) => group.id === id);
    this.selected = index < 0 ? 0 : index;
    this.query = '';
    this.page = 1;
    this.panelTab = 0;
    this.adding = false;
    this.groupNameError = '';
    this.saved = true;
  }

  protected search(value: string): void {
    this.query = value;
    this.page = 1;
  }

  protected goPage(page: number): void {
    this.page = Math.min(Math.max(page, 1), this.pageCount);
  }

  protected active(username: string): boolean {
    return this.accounts.isActive(username);
  }

  protected toggleActive(username: string): void {
    this.accounts.setActive(username, !this.accounts.isActive(username));
  }

  protected pickGroup(index: number): void {
    this.selected = index;
    this.query = '';
    this.page = 1;
    if (this.panelTab === 1) this.loadDraft();
  }

  protected pickPanel(index: number): void {
    this.panelTab = index;
    if (index === 1) this.loadDraft();
  }

  protected roleName(role: AccountRole): string {
    return accessRoles.find((item) => item.role === role)?.label ?? role;
  }

  protected get menuSections() {
    return loginPermissionMenus;
  }

  protected closeSaved(): void {
    this.saved = false;
  }

  protected get canDeleteGroup(): boolean {
    return this.catalog[this.selected]?.id.startsWith('group-') ?? false;
  }

  protected askDeleteGroup(): void {
    if (this.canDeleteGroup) this.removingGroup = true;
  }

  protected finishDeleteGroup(action: string): void {
    const group = this.catalog[this.selected];
    if (action === 'ลบข้อมูล' && group && this.accounts.removeGroup(group.id)) {
      const last = Math.max(this.catalog.length - 1, 0);
      this.selected = Math.min(this.selected, last);
      this.query = '';
      this.page = 1;
      if (this.panelTab === 1) this.loadDraft();
    }
    this.removingGroup = false;
  }

  protected hasMenu(id: string): boolean {
    return this.pickedMenus.has(id);
  }

  protected toggleMenu(id: string): void {
    const next = new Set(this.pickedMenus);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    this.pickedMenus = next;
  }

  protected save(): void {
    const group = this.catalog[this.selected];
    if (!group) return;
    const members = this.accounts.groupMembers(group.id).map(({ username, role }) => ({ username, role }));
    this.accounts.saveGroup(group.id, this.draftName, members, [...this.pickedMenus]);
    this.saved = true;
  }

  private get catalog() {
    return this.accounts.groupCatalog().filter((group) => group.id !== 'applicant' && group.id !== 'admin');
  }

  private get listed(): GroupMember[] {
    return this.members;
  }

  private loadDraft(): void {
    const group = this.catalog[this.selected];
    if (!group) return;
    this.draftName = group.name;
    const real = this.menuSections.flatMap((section) => section.items);
    const saved = this.accounts.groupMenus(group.id).filter((item) => real.includes(item));
    const defaults = menusForLoginRole(this.roleOf(group.id)).flatMap((section) => section.items);
    this.pickedMenus = new Set(this.accounts.menusChosen(group.id) ? saved : defaults);
  }

  private roleOf(groupId: string): AccountRole {
    if (groupId === 'applicant') return 'corporate';
    if (groupId === 'intake') return 'staff';
    if (groupId === 'director') return 'director';
    if (groupId === 'head') return 'head';
    return 'officer';
  }
}
