import { Injectable } from '@angular/core';

const storageKey = 'dft-accounts';
const sessionKey = 'dft-session';
const lastKey = 'dft-last-account';
const trustKey = 'dft-trusted-device';
const groupsKey = 'dft-login-groups';
const trustSpan = 30 * 24 * 60 * 60 * 1000;

export type AccountRole = 'corporate' | 'individual' | 'association' | 'staff' | 'director' | 'head' | 'officer';

type Account = { password: string; role: AccountRole; email?: string; person?: string; personTitle?: string; lastLogin?: string; active?: boolean; phone?: string; unit?: string; loginName?: string; staffCode?: string };

export type SavedLogin = { username: string; password: string; email: string };

const roles: AccountRole[] = ['corporate', 'individual', 'association', 'staff', 'director', 'head', 'officer'];

export const roleHome: Record<AccountRole, string> = {
  corporate: '/requests',
  individual: '/requests',
  association: '/requests',
  staff: '/staff',
  director: '/director',
  head: '/head',
  officer: '/officer',
};

export type DemoLogin = { username: string; label: string; password: string; email: string; group: string; loginName?: string };

export type LoginGroup = { id: string; name: string };

export type GroupMember = {
  username: string;
  name: string;
  title: string;
  role: AccountRole;
};

type StoredGroup = { id: string; name: string; usernames: string[]; menus?: string[]; menusChosen?: boolean };
type StoredGroups = { groups: StoredGroup[]; roles: Record<string, AccountRole> };

const adminGroupId = 'admin';
const adminUserId = '1000000000199';
const adminSeed: StoredGroup = {
  id: adminGroupId,
  name: 'ผู้ดูแลระบบ',
  usernames: [adminUserId],
};

const seedGroups: StoredGroup[] = [
  { id: 'applicant', name: 'ผู้ยื่นคำขอ', usernames: ['0105538041238'] },
  { id: 'intake', name: 'เจ้าหน้าที่รับเรื่อง', usernames: ['1000000000101'] },
  { id: 'director', name: 'ผู้อำนวยการ', usernames: ['1000000000102'] },
  { id: 'head', name: 'หัวหน้ากลุ่ม', usernames: ['1000000000106', '1000000000107', '1000000000108', '1000000000109'] },
  { id: 'ad', name: 'กลุ่มงานมาตรการตอบโต้การทุ่มตลาด (AD)', usernames: ['1000000000110'] },
  { id: 'cvd', name: 'กลุ่มงานมาตรการตอบโต้การทุ่มตลาดอุดหนุน (CVD)', usernames: ['1000000000111'] },
];

export const accessRoles: { role: AccountRole; label: string }[] = [
  { role: 'corporate', label: 'ผู้ยื่นคำขอ' },
  { role: 'staff', label: 'เจ้าหน้าที่รับเรื่อง' },
  { role: 'director', label: 'ผู้อำนวยการ' },
  { role: 'head', label: 'หัวหน้ากลุ่ม' },
  { role: 'officer', label: 'เจ้าหน้าที่ คต.' },
];

export const roleLabel: Record<AccountRole, string> = {
  corporate: 'บริษัท ดาต้า มายนิ่ง จำกัด',
  individual: 'บุคคลธรรมดา',
  association: 'สมาคมการค้า',
  staff: 'เจ้าหน้าที่รับเรื่อง',
  director: 'ผู้อำนวยการ',
  head: 'หัวหน้ากลุ่ม',
  officer: 'เจ้าหน้าที่ คต.',
};

@Injectable({ providedIn: 'root' })
export class Accounts {
  private readonly users = new Map<string, Account>([
    ['0105538041238', { password: 'Dft@2569', role: 'corporate', email: 'support@datamining.co.th' }],
    ['0125544004802', { password: 'Dft@2569', role: 'corporate' }],
    ['1103700123456', { password: 'Person@2569', role: 'individual' }],
    ['0994000167890', { password: 'Assoc@2569', role: 'association' }],
    ['1000000000101', { password: 'Staff@2569', role: 'staff', email: 'intake@dft.go.th' }],
    ['1000000000102', { password: 'Director@2569', role: 'director', person: 'นางสาวเบญจมาภรณ์ พรมเพิ่ม', personTitle: 'ผู้อำนวยการ' }],
    ['1000000000103', { password: 'Head@2569', role: 'head' }],
    ['1000000000104', { password: 'Officer@2569', role: 'officer' }],
    ['1000000000105', { password: 'Bureau@2569', role: 'director', person: 'นางสาวเบญจมาภรณ์ พรมเพิ่ม', personTitle: 'ผู้อำนวยการ' }],
    ['1000000000106', { password: 'Scholar@2569', role: 'head', person: 'นางสาวพัชราวรรณ ไทยอาจ', personTitle: 'กลุ่ม AD' }],
    ['1000000000107', { password: 'Nuttaporn@2569', role: 'head', person: 'นางสาวณัฐพร สังข์แก้ว', personTitle: 'กลุ่ม CVD' }],
    ['1000000000108', { password: 'Kanokorn@2569', role: 'head', person: 'นางกนกอร ไทยรัก', personTitle: 'กลุ่ม SG' }],
    ['1000000000109', { password: 'Piyaporn@2569', role: 'head', person: 'นางสาวปิยาภรณ์ นิลชู', personTitle: 'กลุ่มวิเคราะห์' }],
    ['1000000000110', { password: 'Jareena@2569', role: 'officer', person: 'นางสาวจรีณา กิจส่งเสริมกุล', personTitle: 'นักวิชาการพาณิชย์ปฏิบัติการ' }],
    ['1000000000111', { password: 'Kuljira@2569', role: 'officer', person: 'นางสาวกุลจิรา ปานทอง', personTitle: 'นักวิชาการพาณิชย์ปฏิบัติการ' }],
    [adminUserId, { password: 'Admin@2569', role: 'officer', email: 'super_admin@dft.go.th', person: 'super admin', personTitle: 'ผู้ดูแลระบบ', loginName: 'super_admin' }],
  ]);
  private signedIn: AccountRole | '' = '';
  private person = '';
  private userId = '';
  private loginGroups: StoredGroup[] = seedGroups.map((group) => ({ ...group, usernames: [...group.usernames], menus: [...(group.menus ?? [])] }));

  constructor() {
    const saved = sessionStorage.getItem(storageKey);
    if (saved) {
      const parsed = JSON.parse(saved) as Record<string, string | Account>;
      for (const [username, value] of Object.entries(parsed)) {
        const account = this.readAccount(value);
        if (username && account) this.users.set(username, account);
      }
    }
    const session = sessionStorage.getItem(sessionKey);
    if (session) {
      const current = JSON.parse(session) as { username?: string; role?: string; person?: string };
      if (current.role && roles.includes(current.role as AccountRole)) this.signedIn = current.role as AccountRole;
      this.person = typeof current.person === 'string' ? current.person : '';
      this.userId = typeof current.username === 'string' ? current.username : '';
    }
    this.readLoginGroups();
    this.ensureAdminGroup();
    this.ensureAdminLoginName();
    this.ensureIntakePerson();
  }

  save(username: string, password: string, role: AccountRole, email = ''): void {
    const id = username.trim();
    if (!id || !password) return;
    const account = { password, role, email: email.trim() };
    this.users.set(id, account);
    this.writeUsers();
    sessionStorage.setItem(lastKey, JSON.stringify({ username: id, email: account.email }));
  }

  createGroupUser(input: {
    groupId: string;
    username: string;
    password: string;
    role: AccountRole;
    email: string;
    person: string;
    personTitle: string;
    phone?: string;
    unit?: string;
    loginName?: string;
    staffCode?: string;
  }): string | null {
    const group = this.loginGroups.find((item) => item.id === input.groupId);
    const person = input.person.trim();
    const email = input.email.trim();
    if (!group || !input.password || !person || !email) return null;
    const id = input.username.trim() || this.nextStaffId();
    if (this.users.has(id) || group.usernames.includes(id)) return null;
    this.users.set(id, {
      password: input.password,
      role: input.role,
      email,
      person,
      personTitle: input.personTitle.trim(),
      phone: input.phone?.trim() ?? '',
      unit: input.unit?.trim() ?? '',
      loginName: input.loginName?.trim() ?? '',
      staffCode: input.staffCode?.trim() ?? '',
    });
    group.usernames.push(id);
    this.writeUsers();
    this.writeLoginGroups();
    return id;
  }

  updateGroupUser(id: string, input: {
    password: string;
    role: AccountRole;
    email: string;
    person: string;
    personTitle: string;
    phone?: string;
    unit?: string;
    loginName?: string;
    staffCode?: string;
  }): boolean {
    const username = id.trim();
    const account = this.users.get(username);
    const group = this.loginGroups.find((item) => item.usernames.includes(username));
    if (!account || !group || !input.password || !input.person.trim() || !input.email.trim()) return false;
    this.users.set(username, {
      ...account,
      password: input.password,
      role: input.role,
      email: input.email.trim(),
      person: input.person.trim(),
      personTitle: input.personTitle.trim(),
      phone: input.phone?.trim() ?? '',
      unit: input.unit?.trim() ?? '',
      loginName: input.loginName?.trim() ?? '',
      staffCode: input.staffCode?.trim() ?? '',
    });
    this.writeUsers();
    return true;
  }

  removeGroupUser(groupId: string, username: string): boolean {
    const id = username.trim();
    const group = this.loginGroups.find((item) => item.id === groupId);
    if (!group || id === adminUserId || !group.usernames.includes(id)) return false;
    group.usernames = group.usernames.filter((item) => item !== id);
    this.users.delete(id);
    this.writeUsers();
    this.writeLoginGroups();
    return true;
  }

  adminLogins(): DemoLogin[] {
    const group = this.loginGroups.find((item) => item.id === adminGroupId);
    if (!group) return [];
    return group.usernames.flatMap((username) => {
      const account = this.users.get(username);
      if (!account) return [];
      const label = account.person
        ? `${account.personTitle || roleLabel[account.role]} · ${account.person}`
        : this.memberLabel(account, group.id);
      return [{ username, label, password: account.password, email: account.email ?? '', group: group.name, loginName: account.loginName?.trim() || '' }];
    });
  }

  demoLogins(): DemoLogin[] {
    return this.loginGroups.filter((group) => group.id !== adminGroupId).flatMap((group) => group.usernames.flatMap((username) => {
      const account = this.users.get(username);
      if (!account) return [];
      return [{ username, label: this.memberLabel(account, group.id), password: account.password, email: account.email ?? '', group: group.name, loginName: account.loginName?.trim() || username }];
    }));
  }

  groupCatalog(): LoginGroup[] {
    return this.loginGroups.map(({ id, name }) => ({ id, name }));
  }

  groupMembers(id: string): GroupMember[] {
    const group = this.loginGroups.find((item) => item.id === id);
    if (!group) return [];
    return group.usernames.flatMap((username) => {
      const account = this.users.get(username);
      if (!account) return [];
      const access = accessRoles.find((item) => item.role === account.role);
      return [{
        username,
        name: account.person || this.memberLabel(account, group.id),
        title: account.personTitle || access?.label || roleLabel[account.role],
        role: account.role,
      }];
    });
  }

  groupIdOf(username: string): string {
    const id = username.trim();
    return this.loginGroups.find((group) => group.id !== adminGroupId && group.usernames.includes(id))?.id ?? '';
  }

  placeInGroup(username: string, groupId: string): boolean {
    const id = username.trim();
    const target = this.loginGroups.find((group) => group.id === groupId);
    if (!id || !target || target.id === adminGroupId || id === adminUserId || !this.users.has(id)) return false;
    for (const group of this.loginGroups) {
      if (group.id === adminGroupId) continue;
      group.usernames = group.usernames.filter((item) => item !== id);
    }
    if (!target.usernames.includes(id)) target.usernames.push(id);
    this.writeLoginGroups();
    return true;
  }

  groupMenus(id: string): string[] {
    return [...(this.loginGroups.find((item) => item.id === id)?.menus ?? [])];
  }

  addGroup(name: string): string | null {
    const nextName = name.trim();
    if (!nextName) return null;
    const id = `group-${Date.now()}`;
    this.loginGroups.push({ id, name: nextName, usernames: [], menus: [] });
    this.writeLoginGroups();
    return id;
  }

  removeGroup(id: string): boolean {
    if (!id.startsWith('group-')) return false;
    const index = this.loginGroups.findIndex((group) => group.id === id);
    if (index < 0) return false;
    this.loginGroups.splice(index, 1);
    this.writeLoginGroups();
    return true;
  }

  saveGroup(id: string, name: string, members: { username: string; role: AccountRole }[], menus?: string[]): void {
    const group = this.loginGroups.find((item) => item.id === id);
    if (!group) return;
    const nextName = name.trim();
    if (nextName) group.name = nextName;
    for (const member of members) {
      if (!group.usernames.includes(member.username) || !roles.includes(member.role)) continue;
      const account = this.users.get(member.username);
      if (!account) continue;
      this.users.set(member.username, { ...account, role: member.role });
    }
    if (menus) {
      group.menus = menus.filter((item) => typeof item === 'string');
      group.menusChosen = true;
    }
    this.writeLoginGroups();
  }

  menusChosen(id: string): boolean {
    return this.loginGroups.find((item) => item.id === id)?.menusChosen === true;
  }

  grantedMenus(): string[] | null {
    if (!this.userId) return null;
    const group = this.loginGroups.find((item) => item.id !== adminGroupId && item.usernames.includes(this.userId));
    if (!group?.menusChosen) return null;
    return [...(group.menus ?? [])];
  }

  last(): SavedLogin | null {
    const saved = sessionStorage.getItem(lastKey);
    if (!saved) return null;
    const parsed = JSON.parse(saved) as { username?: string; email?: string };
    const username = parsed.username?.trim() ?? '';
    const account = username ? this.users.get(username) : undefined;
    if (!account) return null;
    return { username, password: account.password, email: parsed.email || account.email || '' };
  }

  trust(username: string): void {
    const id = username.trim();
    if (!id) return;
    const trusted = this.readTrust();
    trusted[id] = Date.now() + trustSpan;
    localStorage.setItem(trustKey, JSON.stringify(trusted));
  }

  isTrusted(username: string): boolean {
    const until = this.readTrust()[username.trim()];
    return typeof until === 'number' && until > Date.now();
  }

  signIn(username: string, password: string): AccountRole | null {
    const id = username.trim();
    const account = this.users.get(id);
    if (!account || account.password !== password || account.active === false) return null;
    this.signedIn = account.role;
    this.person = account.person ?? '';
    this.userId = id;
    this.users.set(id, { ...account, lastLogin: new Date().toISOString() });
    this.writeUsers();
    sessionStorage.setItem(sessionKey, JSON.stringify({ username: this.userId, role: account.role, person: this.person }));
    return account.role;
  }

  isActive(username: string): boolean {
    return this.users.get(username.trim())?.active !== false;
  }

  setActive(username: string, active: boolean): void {
    const id = username.trim();
    const account = this.users.get(id);
    if (!account || id === adminUserId || this.isActive(id) === active) return;
    this.users.set(id, { ...account, active });
    this.writeUsers();
  }

  isProtectedAdmin(username: string): boolean {
    return username.trim() === adminUserId;
  }

  lastLoginOf(username: string): string {
    const at = this.users.get(username.trim())?.lastLogin;
    if (!at) return '—';
    const date = new Date(at);
    if (Number.isNaN(date.getTime())) return '—';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear() + 543;
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hour}:${minute}`;
  }

  emailOf(username: string): string {
    return this.users.get(username.trim())?.email ?? '';
  }

  accountOf(username: string): { password: string; email: string; role: AccountRole; person: string; personTitle: string; phone: string; unit: string; loginName: string; staffCode: string } | null {
    const account = this.users.get(username.trim());
    if (!account) return null;
    return {
      password: account.password,
      email: account.email ?? '',
      role: account.role,
      person: account.person ?? '',
      personTitle: account.personTitle ?? '',
      phone: account.phone ?? '',
      unit: account.unit ?? '',
      loginName: account.loginName ?? '',
      staffCode: account.staffCode ?? '',
    };
  }

  idByLogin(loginName: string): string | null {
    const typed = loginName.trim();
    if (!typed) return null;
    for (const [id, account] of this.users) {
      if ((account.loginName || '').trim() === typed) return id;
    }
    return null;
  }

  signInId(loginName: string): string | null {
    const typed = loginName.trim();
    if (!typed) return null;
    return this.idByLogin(typed) || (this.users.has(typed) ? typed : null);
  }

  matches(username: string, password: string): boolean {
    const account = this.users.get(username.trim());
    return !!account && account.password === password;
  }

  signOut(): void {
    this.signedIn = '';
    this.person = '';
    this.userId = '';
    sessionStorage.removeItem(sessionKey);
  }

  get role(): AccountRole | '' {
    return this.signedIn;
  }

  get personName(): string {
    return this.person;
  }

  get username(): string {
    return this.userId;
  }

  get displayName(): string {
    if (this.userId === '1000000000101') return 'เจ้าหน้าที่กลุ่ม บท';
    if (this.person) return this.person;
    return this.signedIn ? roleLabel[this.signedIn] : roleLabel.corporate;
  }

  namedPeople(): { name: string; role: AccountRole; title: string }[] {
    const seen = new Set<string>();
    const rows: { name: string; role: AccountRole; title: string }[] = [];
    for (const account of this.users.values()) {
      if (!account.person || seen.has(account.person)) continue;
      seen.add(account.person);
      rows.push({ name: account.person, role: account.role, title: account.personTitle || '' });
    }
    return rows;
  }

  private memberLabel(account: Account, groupId: string): string {
    if (account.person && (groupId === 'director' || groupId === 'head')) {
      return `${account.personTitle || roleLabel[account.role]} · ${account.person}`;
    }
    if (account.person) return account.person;
    if (account.role === 'corporate') return `ผู้ยื่นคำขอ · ${roleLabel.corporate}`;
    return roleLabel[account.role];
  }

  private ensureIntakePerson(): void {
    const account = this.users.get('1000000000101');
    if (!account || account.person?.trim()) return;
    this.users.set('1000000000101', { ...account, person: 'เจ้าหน้าที่กลุ่ม บท' });
    this.writeUsers();
  }

  private ensureAdminLoginName(): void {
    const account = this.users.get(adminUserId);
    if (!account || account.loginName?.trim()) return;
    this.users.set(adminUserId, { ...account, loginName: 'super_admin' });
    this.writeUsers();
  }

  private ensureAdminGroup(): void {
    const borrowed = ['0105538041238', '1000000000101', '1000000000102', '1000000000106'];
    const group = this.loginGroups.find((item) => item.id === adminGroupId);
    if (!group) {
      this.loginGroups.push({ ...adminSeed, usernames: [...adminSeed.usernames], menus: [] });
    } else if (group.usernames.length === borrowed.length && borrowed.every((id) => group.usernames.includes(id))) {
      group.usernames = [...adminSeed.usernames];
    } else if (!group.usernames.includes(adminUserId)) {
      group.usernames = [adminUserId, ...group.usernames];
    } else {
      return;
    }
    this.writeLoginGroups();
  }

  private readLoginGroups(): void {
    const saved = sessionStorage.getItem(groupsKey);
    if (!saved) return;
    const parsed = JSON.parse(saved) as StoredGroups;
    if (!Array.isArray(parsed.groups)) return;
    const rows = parsed.groups.filter((group) => group && typeof group.id === 'string' && typeof group.name === 'string');
    if (seedGroups.some((seed) => !rows.some((group) => group.id === seed.id))) return;
    const known = new Set(seedGroups.map((group) => group.id));
    const extras = rows.filter((group) => !known.has(group.id) && group.name.trim() && Array.isArray(group.usernames));
    const merged = [...seedGroups.map((seed) => rows.find((group) => group.id === seed.id)!), ...extras];
    this.loginGroups = merged.map((group) => ({
      id: group.id,
      name: group.name,
      usernames: [...group.usernames],
      menus: Array.isArray(group.menus) ? group.menus.filter((item) => typeof item === 'string') : [],
      menusChosen: group.menusChosen === true,
    }));
    for (const [username, role] of Object.entries(parsed.roles ?? {})) {
      const account = this.users.get(username);
      if (account && roles.includes(role)) this.users.set(username, { ...account, role });
    }
  }

  private nextStaffId(): string {
    let number = 1000000000200;
    while (this.users.has(String(number))) number += 1;
    return String(number);
  }

  private writeUsers(): void {
    const stored: Record<string, Account> = {};
    for (const [name, item] of this.users) stored[name] = item;
    sessionStorage.setItem(storageKey, JSON.stringify(stored));
  }

  private writeLoginGroups(): void {
    const rolesByUser: Record<string, AccountRole> = {};
    for (const group of this.loginGroups) {
      for (const username of group.usernames) {
        const account = this.users.get(username);
        if (account) rolesByUser[username] = account.role;
      }
    }
    sessionStorage.setItem(groupsKey, JSON.stringify({ groups: this.loginGroups, roles: rolesByUser }));
  }

  private readAccount(value: string | Account): Account | null {
    if (typeof value === 'string') return value ? { password: value, role: 'corporate' } : null;
    return roles.includes(value.role) ? value : null;
  }

  private readTrust(): Record<string, number> {
    const saved = localStorage.getItem(trustKey);
    if (!saved) return {};
    const parsed = JSON.parse(saved) as Record<string, number>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  }
}
