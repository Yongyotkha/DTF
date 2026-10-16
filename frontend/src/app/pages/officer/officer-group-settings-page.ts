import { Component } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { accessRoles, AccountRole, Accounts } from '../../accounts';
import { DftButton } from '../../button/button';
import { InputField } from '../../input-field/input-field';
import { SideNav, systemMenus } from '../../menu-bar/side-nav';
import { TopHeader } from '../../top-header/top-header';

type DraftMember = { username: string; name: string; title: string; role: AccountRole };

@Component({
  selector: 'app-officer-group-settings-page',
  imports: [TopHeader, SideNav, DftButton, InputField, RouterLink],
  templateUrl: './officer-group-settings-page.html',
  styleUrls: ['./officer-groups-page.css', './officer-group-settings-page.css'],
})
export class OfficerGroupSettingsPage {
  protected readonly accessRoles = accessRoles;
  protected readonly settingMenus = systemMenus;
  protected groupId = '';
  protected name = '';
  protected members: DraftMember[] = [];
  protected saved = false;

  constructor(
    private readonly accounts: Accounts,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {
    const id = this.route.snapshot.paramMap.get('groupId') ?? '';
    const group = this.accounts.groupCatalog().find((item) => item.id === id);
    if (!group) {
      void this.router.navigateByUrl('/officer/groups');
      return;
    }
    this.groupId = group.id;
    this.name = group.name;
    this.members = this.accounts.groupMembers(group.id).map((member) => ({ ...member }));
  }

  protected setRole(username: string, role: string): void {
    const member = this.members.find((item) => item.username === username);
    if (!member || !accessRoles.some((item) => item.role === role)) return;
    member.role = role as AccountRole;
    this.saved = false;
  }

  protected save(): void {
    this.accounts.saveGroup(this.groupId, this.name, this.members.map(({ username, role }) => ({ username, role })));
    this.saved = true;
  }
}
