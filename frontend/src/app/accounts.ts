import { Injectable } from '@angular/core';

const storageKey = 'dft-accounts';
const sessionKey = 'dft-session';
const lastKey = 'dft-last-account';
const trustKey = 'dft-trusted-device';
const trustSpan = 7 * 24 * 60 * 60 * 1000;

export type AccountRole = 'corporate' | 'individual' | 'association' | 'staff' | 'director' | 'head' | 'officer';

type Account = { password: string; role: AccountRole; email?: string };

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

@Injectable({ providedIn: 'root' })
export class Accounts {
  private readonly users = new Map<string, Account>([
    ['0105538041238', { password: 'Dft@2569', role: 'corporate', email: 'support@datamining.co.th' }],
    ['0125544004802', { password: 'Dft@2569', role: 'corporate' }],
    ['1103700123456', { password: 'Person@2569', role: 'individual' }],
    ['0994000167890', { password: 'Assoc@2569', role: 'association' }],
    ['1000000000101', { password: 'Staff@2569', role: 'staff' }],
    ['1000000000102', { password: 'Director@2569', role: 'director' }],
    ['1000000000103', { password: 'Head@2569', role: 'head' }],
    ['1000000000104', { password: 'Officer@2569', role: 'officer' }],
  ]);
  private signedIn: AccountRole | '' = '';

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
    const current = JSON.parse(session) as { role?: string };
    if (current.role && roles.includes(current.role as AccountRole)) this.signedIn = current.role as AccountRole;
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
    sessionStorage.setItem(sessionKey, JSON.stringify({ username: username.trim(), role: account.role }));
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
    sessionStorage.removeItem(sessionKey);
  }

  get role(): AccountRole | '' {
    return this.signedIn;
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
