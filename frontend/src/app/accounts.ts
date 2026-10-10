import { Injectable } from '@angular/core';

const storageKey = 'dft-accounts';
const sessionKey = 'dft-session';

export type AccountRole = 'corporate' | 'individual' | 'association' | 'staff' | 'director' | 'head' | 'officer';

type Account = { password: string; role: AccountRole };

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

  save(username: string, password: string, role: AccountRole): void {
    const id = username.trim();
    if (!id || !password) return;
    this.users.set(id, { password, role });
    const stored: Record<string, Account> = {};
    for (const [name, account] of this.users) stored[name] = account;
    sessionStorage.setItem(storageKey, JSON.stringify(stored));
  }

  signIn(username: string, password: string): AccountRole | null {
    const account = this.users.get(username.trim());
    if (!account || account.password !== password) return null;
    this.signedIn = account.role;
    sessionStorage.setItem(sessionKey, JSON.stringify({ username: username.trim(), role: account.role }));
    return account.role;
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
}
