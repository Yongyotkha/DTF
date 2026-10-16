import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Accounts, GroupMember } from '../../accounts';
import { DftButton } from '../../button/button';
import { InputField } from '../../input-field/input-field';
import { SideNav, systemMenus } from '../../menu-bar/side-nav';
import { DftModal } from '../../modal/modal';
import { Tabs } from '../../tabs/tabs';
import { TopHeader } from '../../top-header/top-header';

type AdminRow = GroupMember & { email: string };

@Component({
  selector: 'app-officer-admins-page',
  imports: [TopHeader, SideNav, Tabs, DftButton, InputField, DftModal],
  templateUrl: './officer-admins-page.html',
  styleUrls: ['./officer-groups-page.css', './officer-admins-page.css'],
})
export class OfficerAdminsPage {
  protected selected = 0;
  protected panelTab = 0;
  protected query = '';
  protected adding = false;
  protected saved = false;
  protected removing = '';
  protected removingGroup = false;
  protected newGroupName = '';
  protected draftName = '';
  protected pickedMenus = new Set<string>();
  protected readonly settingMenus = systemMenus;
  protected readonly panelTabs = ['ผู้ใช้งานในกลุ่ม', 'ตั้งค่ากลุ่มและสิทธิ์'];
  protected readonly menuSections = systemMenus;

  constructor(
    private readonly accounts: Accounts,
    private readonly router: Router,
  ) {}

  protected addUser(): void {
    void this.router.navigateByUrl('/officer/admins/new');
  }

  protected editUser(username: string): void {
    void this.router.navigate(['/officer/admins/edit'], { queryParams: { user: username } });
  }

  protected askDelete(username: string): void {
    this.removing = username;
  }

  protected finishDelete(action: string): void {
    if (action === 'ลบข้อมูล') this.removeUser(this.removing);
    this.removing = '';
  }

  protected removeUser(username: string): void {
    const group = this.currentGroup;
    if (!group) return;
    this.accounts.removeGroupUser(group.id, username);
  }

  protected lastSeen(username: string): string {
    return this.accounts.lastLoginOf(username);
  }

  protected locked(username: string): boolean {
    return this.accounts.isProtectedAdmin(username);
  }

  protected get tabs(): string[] {
    return this.shownGroups.map((group) => group.name);
  }

  protected get rows(): AdminRow[] {
    const group = this.currentGroup;
    if (!group) return [];
    const query = this.query.trim().toLowerCase();
    return this.accounts.groupMembers(group.id)
      .map((member) => ({ ...member, email: this.accounts.emailOf(member.username) || '—' }))
      .filter((member) => !query || `${member.email} ${member.name}`.toLowerCase().includes(query));
  }

  protected pickGroup(index: number): void {
    this.selected = index;
    this.query = '';
    if (this.panelTab === 1) this.loadDraft();
  }

  protected pickPanel(index: number): void {
    this.panelTab = index;
    if (index === 1) this.loadDraft();
  }

  protected active(username: string): boolean {
    return this.accounts.isActive(username);
  }

  protected toggleActive(username: string): void {
    this.accounts.setActive(username, !this.accounts.isActive(username));
  }

  protected openAddGroup(): void {
    this.newGroupName = '';
    this.adding = true;
  }

  protected finishAddGroup(action: string): void {
    if (action !== 'ยืนยัน') {
      this.adding = false;
      return;
    }
    const id = this.accounts.addGroup(this.newGroupName);
    if (!id) return;
    const index = this.shownGroups.findIndex((group) => group.id === id);
    this.selected = index < 0 ? 0 : index;
    this.query = '';
    this.panelTab = 0;
    this.adding = false;
    this.saved = true;
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
    const group = this.currentGroup;
    if (!group) return;
    const members = this.accounts.groupMembers(group.id).map(({ username, role }) => ({ username, role }));
    this.accounts.saveGroup(group.id, this.draftName, members, [...this.pickedMenus]);
    this.saved = true;
  }

  protected closeSaved(): void {
    this.saved = false;
  }

  protected get canDeleteGroup(): boolean {
    return this.currentGroup?.id.startsWith('group-') ?? false;
  }

  protected askDeleteGroup(): void {
    if (this.canDeleteGroup) this.removingGroup = true;
  }

  protected finishDeleteGroup(action: string): void {
    const group = this.currentGroup;
    if (action === 'ลบข้อมูล' && group && this.accounts.removeGroup(group.id)) {
      const last = Math.max(this.shownGroups.length - 1, 0);
      this.selected = Math.min(this.selected, last);
      this.query = '';
      if (this.panelTab === 1) this.loadDraft();
    }
    this.removingGroup = false;
  }

  private get shownGroups() {
    const catalog = this.accounts.groupCatalog();
    const admin = catalog.find((group) => group.id === 'admin');
    const added = catalog.filter((group) => group.id.startsWith('group-'));
    return admin ? [admin, ...added] : added;
  }

  private get currentGroup() {
    return this.shownGroups[this.selected] ?? this.shownGroups[0];
  }

  private loadDraft(): void {
    const group = this.currentGroup;
    if (!group) return;
    this.draftName = group.name;
    const saved = this.accounts.groupMenus(group.id);
    const real = this.menuSections.flatMap((section) => section.items);
    this.pickedMenus = new Set(saved.length ? saved : real);
  }
}
