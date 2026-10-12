import { Injectable } from '@angular/core';

const storageKey = 'dft-accounts';
const sessionKey = 'dft-session';
const lastKey = 'dft-last-account';
const trustKey = 'dft-trusted-device';
const trustSpan = 30 * 24 * 60 * 60 * 1000;

export type AccountRole = 'corporate' | 'individual' | 'association' | 'staff' | 'director' | 'head' | 'officer';

type Account = { password: string; role: AccountRole; email?: string; person?: string; personTitle?: string };

export type SavedLogin = { username: string; password: string; email: string };

const roles: AccountRole[] = ['corporate', 'individual', 'association', 'staff', 'director', 'head', 'officer'];

export const roleHome: Record<AccountRole, string> = {
  corporate: '/home',
  individual: '/home',
  association: '/home',
  staff: '/staff',
  director: '/director',
  head: '/head',
  officer: '/officer',
};

export type DemoLogin = { username: string; label: string; password: string; email: string; group: string };

const demoMenu: { username: string; group: string }[] = [
  { username: '0105538041238', group: 'ผู้ยื่นคำขอ' },
  { username: '1000000000101', group: 'เจ้าหน้าที่รับเรื่อง' },
  { username: '1000000000102', group: 'ผู้อำนวยการ' },
  { username: '1000000000106', group: 'หัวหน้ากลุ่ม' },
  { username: '1000000000107', group: 'หัวหน้ากลุ่ม' },
  { username: '1000000000108', group: 'หัวหน้ากลุ่ม' },
  { username: '1000000000109', group: 'หัวหน้ากลุ่ม' },
  { username: '1000000000110', group: 'กลุ่มงานมาตรการตอบโต้การทุ่มตลาด (AD)' },
  { username: '1000000000111', group: 'กลุ่มงานมาตรการตอบโต้การทุ่มตลาดอุดหนุน (CVD)' },
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
  ]);
  private signedIn: AccountRole | '' = '';
  private person = '';

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
    if (!session) return;
    const current = JSON.parse(session) as { role?: string; person?: string };
    if (current.role && roles.includes(current.role as AccountRole)) this.signedIn = current.role as AccountRole;
    this.person = typeof current.person === 'string' ? current.person : '';
  }

  save(username: string, password: string, role: AccountRole, email = ''): void {
    const id = username.trim();
    if (!id || !password) return;
    const account = { password, role, email: email.trim() };
    this.users.set(id, account);
    const stored: Record<string, Account> = {};
    for (const [name, item] of this.users) stored[name] = item;
    sessionStorage.setItem(storageKey, JSON.stringify(stored));
    sessionStorage.setItem(lastKey, JSON.stringify({ username: id, email: account.email }));
  }

  demoLogins(): DemoLogin[] {
    return demoMenu.flatMap((item) => {
      const account = this.users.get(item.username);
      if (!account) return [];
      const label = account.person
        ? item.group === 'ผู้อำนวยการ' || item.group === 'หัวหน้ากลุ่ม'
          ? `${account.personTitle || item.group} · ${account.person}`
          : account.person
        : account.role === 'corporate'
          ? `ผู้ยื่นคำขอ · ${roleLabel.corporate}`
          : roleLabel[account.role];
      return [{ username: item.username, label, password: account.password, email: account.email ?? '', group: item.group }];
    });
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
    const account = this.users.get(username.trim());
    if (!account || account.password !== password) return null;
    this.signedIn = account.role;
    this.person = account.person ?? '';
    sessionStorage.setItem(sessionKey, JSON.stringify({ username: username.trim(), role: account.role, person: this.person }));
    return account.role;
  }

  emailOf(username: string): string {
    return this.users.get(username.trim())?.email ?? '';
  }

  matches(username: string, password: string): boolean {
    const account = this.users.get(username.trim());
    return !!account && account.password === password;
  }

  signOut(): void {
    this.signedIn = '';
    this.person = '';
    sessionStorage.removeItem(sessionKey);
  }

  get role(): AccountRole | '' {
    return this.signedIn;
  }

  get personName(): string {
    return this.person;
  }

  get displayName(): string {
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
