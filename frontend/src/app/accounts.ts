import { Injectable } from '@angular/core';

const storageKey = 'dft-accounts';
const sessionKey = 'dft-session';
const lastKey = 'dft-last-account';
const trustKey = 'dft-trusted-device';
const trustSpan = 30 * 24 * 60 * 60 * 1000;

export type AccountRole = 'corporate' | 'individual' | 'association' | 'staff' | 'director' | 'head' | 'officer' | 'bureau' | 'committee' | 'interest' | 'external';

/** สถานะยืนยันตัวตน — สมัครใช้แค่ OTP อีเมล ยืนยันตัวตนตอนยื่น/ทำกระบวนการ */
export type IdentityVerifyStatus = 'none' | 'pending' | 'verified' | 'rejected';
export type IdentityVerifyPath = 'thaiid' | 'foreign';

export type IdentityVerify = {
  path: IdentityVerifyPath;
  status: IdentityVerifyStatus;
  docs?: string[];
  at?: string;
  note?: string;
};

type Account = {
  password: string;
  role: AccountRole;
  email?: string;
  person?: string;
  personTitle?: string;
  /** จากสมัคร — ใช้ตัดสินวิธียืนยันตัวตนอัตโนมัติ */
  nationality?: string;
  country?: string;
  idType?: string;
  identity?: IdentityVerify;
};

export type SavedLogin = { username: string; password: string; email: string };

const roles: AccountRole[] = ['corporate', 'individual', 'association', 'staff', 'director', 'head', 'officer', 'bureau', 'committee', 'interest', 'external'];

export const roleHome: Record<AccountRole, string> = {
  corporate: '/requests',
  individual: '/requests',
  association: '/requests',
  staff: '/staff',
  director: '/director',
  head: '/head',
  officer: '/officer',
  bureau: '/bureau',
  committee: '/committee',
  interest: '/requests/cases',
  external: '/external',
};

export type DemoLogin = { username: string; label: string; password: string; email: string; group: string };

export const secondApplicant = {
  username: '0105569012345',
  password: 'Ssi@2569',
  name: 'บริษัท สหวิริยาสตีลอินดัสตรี จำกัด (มหาชน)',
  email: 'kittikomp@ssi-steel.com',
};

const demoMenu: { username: string; group: string }[] = [
  { username: '0105538041238', group: 'ผู้ยื่นคำขอ' },
  { username: secondApplicant.username, group: 'ผู้ยื่นคำขอ' },
  { username: '1000000000125', group: 'ผู้ยื่นแทน' },
  { username: '1000000000123', group: 'ผู้มีส่วนได้เสีย' },
  { username: '1000000000102', group: 'ผู้อำนวยการ' },
  { username: '1000000000106', group: 'หัวหน้ากลุ่ม' },
  { username: '1000000000107', group: 'หัวหน้ากลุ่ม' },
  { username: '1000000000108', group: 'หัวหน้ากลุ่ม' },
  { username: '1000000000110', group: 'กลุ่มงานมาตรการตอบโต้การทุ่มตลาด (AD)' },
  { username: '1000000000111', group: 'กลุ่มงานมาตรการตอบโต้การทุ่มตลาดอุดหนุน (CVD)' },
  { username: '1000000000115', group: 'กลุ่มงานมาตรการป้องกัน (SG)' },
  { username: '1000000000121', group: 'เจ้าหน้าที่ บท.' },
  { username: '1000000000122', group: 'คณะกรรมการ' },
  { username: '1000000000126', group: 'คณะกรรมการอื่นๆ' },
  { username: '1000000000124', group: 'หน่วยงานที่เกี่ยวข้อง' },
];

export const roleLabel: Record<AccountRole, string> = {
  corporate: 'บริษัท ดาต้า มายนิ่ง จำกัด',
  individual: 'บุคคลธรรมดา',
  association: 'สมาคมการค้า',
  staff: 'เจ้าหน้าที่รับเรื่อง',
  director: 'ผู้อำนวยการ',
  head: 'หัวหน้ากลุ่ม',
  officer: 'เจ้าหน้าที่ คต.',
  bureau: 'เจ้าหน้าที่ บท.',
  committee: 'คณะกรรมการ ทตอ.',
  interest: 'ผู้มีส่วนได้เสีย',
  external: 'หน่วยงานภายนอก',
};

@Injectable({ providedIn: 'root' })
export class Accounts {
  private readonly users = new Map<string, Account>([
    ['0105538041238', { password: 'Dft@2569', role: 'corporate', email: 'support@datamining.co.th', country: 'ประเทศไทย', nationality: 'ไทย' }],
    [secondApplicant.username, { password: secondApplicant.password, role: 'corporate', email: secondApplicant.email, person: secondApplicant.name, personTitle: 'ผู้ยื่นคำขอ', country: 'ประเทศไทย', nationality: 'ไทย' }],
    ['0125544004802', { password: 'Dft@2569', role: 'corporate', country: 'ประเทศไทย', nationality: 'ไทย' }],
    ['1103700123456', { password: 'Person@2569', role: 'individual', nationality: 'ไทย', idType: 'บัตรประจำตัวประชาชน', country: 'ประเทศไทย' }],
    ['0994000167890', { password: 'Assoc@2569', role: 'association', country: 'ประเทศไทย', nationality: 'ไทย' }],
    ['1000000000102', { password: 'Director@2569', role: 'director', person: 'นางสาวเบญจมาภรณ์ พรมเพิ่ม', personTitle: 'ผู้อำนวยการ' }],
    ['1000000000103', { password: 'Head@2569', role: 'head' }],
    ['1000000000104', { password: 'Officer@2569', role: 'officer' }],
    ['1000000000105', { password: 'Bureau@2569', role: 'director', person: 'นางสาวเบญจมาภรณ์ พรมเพิ่ม', personTitle: 'ผู้อำนวยการ' }],
    ['1000000000106', { password: 'Scholar@2569', role: 'head', person: 'นางสาวพัชราวรรณ ไทยอาจ', personTitle: 'กลุ่ม AD' }],
    ['1000000000107', { password: 'Nuttaporn@2569', role: 'head', person: 'นางสาวณัฐพร สังข์แก้ว', personTitle: 'กลุ่ม CVD' }],
    ['1000000000108', { password: 'Kanokorn@2569', role: 'head', person: 'นางกนกอร ไทยรัก', personTitle: 'กลุ่ม SG' }],
    ['1000000000109', { password: 'Piyaporn@2569', role: 'head', person: 'นางสาวปิยาภรณ์ นิลชู', personTitle: 'กลุ่มวิเคราะห์' }],
    ['1000000000110', { password: 'Jareena@2569', role: 'officer', person: 'นางสาวจรีณา กิจส่งเสริมกุล', personTitle: 'นักวิชาการพาณิชย์ปฏิบัติการ' }],
    ['1000000000112', { password: 'Officer@2569', role: 'officer', person: 'นางสาวศศิธร พงษ์พิพัฒน์', personTitle: 'นักวิชาการพาณิชย์ปฏิบัติการ' }],
    ['1000000000111', { password: 'Kuljira@2569', role: 'officer', person: 'นางสาวกุลจิรา ปานทอง', personTitle: 'นักวิชาการพาณิชย์ปฏิบัติการ' }],
    ['1000000000113', { password: 'Officer@2569', role: 'officer', person: 'นางสาวมัลลิกา ทองคำ', personTitle: 'นักวิชาการพาณิชย์ปฏิบัติการ' }],
    ['1000000000114', { password: 'Officer@2569', role: 'officer', person: 'นายอนุชา ศรีเมือง', personTitle: 'นักวิชาการพาณิชย์ปฏิบัติการ' }],
    ['1000000000115', { password: 'Officer@2569', role: 'officer', person: 'นางสาวอรทัย บุญส่ง', personTitle: 'นักวิชาการพาณิชย์ปฏิบัติการ' }],
    ['1000000000116', { password: 'Officer@2569', role: 'officer', person: 'นางสาวพิมพ์ใจ สุขเจริญ', personTitle: 'นักวิชาการพาณิชย์ปฏิบัติการ' }],
    ['1000000000117', { password: 'Officer@2569', role: 'officer', person: 'นายธนพล แก้วกล้า', personTitle: 'นักวิชาการพาณิชย์ปฏิบัติการ' }],
    ['1000000000118', { password: 'Officer@2569', role: 'officer', person: 'นางสาวสุภาพร แสงอรุณ', personTitle: 'นักวิชาการพาณิชย์ปฏิบัติการ' }],
    ['1000000000119', { password: 'Officer@2569', role: 'officer', person: 'นางสาวชลธิชา วัฒนกิจ', personTitle: 'นักวิชาการพาณิชย์ปฏิบัติการ' }],
    ['1000000000120', { password: 'Officer@2569', role: 'officer', person: 'นายภูมิพัฒน์ อินทรสุข', personTitle: 'นักวิชาการพาณิชย์ปฏิบัติการ' }],
    ['1000000000121', { password: 'Bureau@2569', role: 'bureau', person: 'นางสาวจิราภรณ์ ศรีสุข', personTitle: 'กลุ่ม บท.' }],
    ['1000000000122', { password: 'Committee@2569', role: 'committee', person: 'นายประเสริฐ ธรรมรักษ์', personTitle: 'ประธานคณะกรรมการ ทตอ.' }],
    ['1000000000126', { password: 'Subcommittee@2569', role: 'committee', person: 'คณะกรรมการอื่นๆ', personTitle: 'คณะอนุกรรมการ' }],
    ['1000000000123', { password: 'Interest@2569', role: 'interest', person: 'บริษัท ไทยสตีล อิมปอร์ต จำกัด', personTitle: 'ผู้มีส่วนได้เสีย' }],
    ['1000000000127', { password: 'Interest@2569', role: 'interest', person: 'บริษัท สหวิริยาสตีลอินดัสตรี จำกัด (มหาชน)', personTitle: 'ผู้มีส่วนได้เสีย' }],
    ['1000000000124', { password: 'External@2569', role: 'external', person: 'กรมโรงงานอุตสาหกรรม', personTitle: 'หน่วยงานที่เกี่ยวข้อง' }],
    ['1000000000125', { password: 'Agent@2569', role: 'corporate', email: 'apisith.s@weerawongcp.com', person: 'นายอภิสิทธิ์ สุธัมม์', personTitle: 'บริษัท วีระวงค์, ชินวัฒน์ และพาร์ทเนอร์ส จำกัด' }],
  ]);
  private signedIn: AccountRole | '' = '';
  private person = '';
  private userId = '';

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
    const current = JSON.parse(session) as { username?: string; role?: string; person?: string };
    if (current.role && roles.includes(current.role as AccountRole)) this.signedIn = current.role as AccountRole;
    this.person = typeof current.person === 'string' ? current.person : '';
    this.userId = typeof current.username === 'string' ? current.username : '';
  }

  registerInterest(username: string, password: string, person: string, org: string): 'ok' | 'exists' | 'invalid' {
    const id = username.trim();
    const name = person.trim();
    if (!/^\d{13}$/.test(id) || password.length < 8 || !name) return 'invalid';
    const current = this.users.get(id);
    if (current && (current.password !== password || current.role !== 'interest')) return 'exists';
    const account: Account = {
      password,
      role: 'interest',
      person: name,
      personTitle: org.trim() || 'ผู้มีส่วนได้เสีย',
    };
    this.users.set(id, account);
    this.persist();
    this.signIn(id, password);
    return 'ok';
  }

  registerAgent(username: string, password: string, person: string, org: string): 'ok' | 'exists' | 'invalid' {
    const id = username.trim();
    const name = person.trim();
    if (!/^\d{13}$/.test(id) || password.length < 8 || !name) return 'invalid';
    const current = this.users.get(id);
    if (current && current.password !== password) return 'exists';
    if (current && current.role !== 'corporate' && current.role !== 'individual' && current.role !== 'association') return 'exists';
    const account: Account = {
      password,
      role: current?.role === 'individual' || current?.role === 'association' ? current.role : 'corporate',
      email: current?.email,
      person: current?.person || name,
      personTitle: current?.personTitle || org.trim() || 'ผู้กระทำการแทน',
    };
    this.users.set(id, account);
    this.persist();
    this.signIn(id, password);
    return 'ok';
  }

  save(
    username: string,
    password: string,
    role: AccountRole,
    email = '',
    profile: { nationality?: string; country?: string; idType?: string } = {},
  ): void {
    const id = username.trim();
    if (!id || !password) return;
    const previous = this.users.get(id);
    const nationality = (profile.nationality ?? previous?.nationality ?? '').trim();
    const country = (profile.country ?? previous?.country ?? '').trim();
    const idType = (profile.idType ?? previous?.idType ?? '').trim();
    const path = this.pathFromProfile({ nationality, country, idType, role });
    const previousIdentity = previous?.identity;
    const identity: IdentityVerify =
      previousIdentity && (previousIdentity.status === 'verified' || previousIdentity.status === 'pending')
        ? previousIdentity
        : { path, status: 'none' };
    const account: Account = {
      password,
      role,
      email: email.trim(),
      person: previous?.person,
      personTitle: previous?.personTitle,
      nationality: nationality || undefined,
      country: country || undefined,
      idType: idType || undefined,
      identity,
    };
    this.users.set(id, account);
    this.persist();
    sessionStorage.setItem(lastKey, JSON.stringify({ username: id, email: account.email }));
  }

  /** บัญชีปัจจุบันยืนยันตัวตนแล้วหรือยัง (พร้อมยื่น/ทำกระบวนการ) */
  isIdentityVerified(username = this.userId): boolean {
    return this.identityOf(username).status === 'verified';
  }

  /** สัญชาติ/ประเทศจากสมัคร — แสดงใน UI */
  nationalityLabel(username = this.userId): string {
    const account = this.users.get(username.trim());
    if (!account) return 'ไทย';
    if (account.nationality?.trim()) return account.nationality.trim();
    if (account.country === 'ต่างประเทศ') return 'ต่างชาติ';
    if (account.idType === 'หนังสือเดินทาง') return 'ต่างชาติ';
    return 'ไทย';
  }

  isThaiIdentity(username = this.userId): boolean {
    return this.resolveVerifyPath(username) === 'thaiid';
  }

  identityOf(username = this.userId): IdentityVerify {
    const account = this.users.get(username.trim());
    const path = this.resolveVerifyPath(username);
    if (!account) return { path, status: 'none' };
    const current = account.identity ?? { path, status: 'none' as IdentityVerifyStatus };
    // path ตามข้อมูลสมัครเสมอ ถ้ายังไม่ verified/pending
    if (current.status === 'verified' || current.status === 'pending') return current;
    if (current.path !== path) {
      account.identity = { path, status: 'none' };
      this.users.set(username.trim(), account);
      this.persist();
      return account.identity;
    }
    return { ...current, path };
  }

  private resolveVerifyPath(username = this.userId): IdentityVerifyPath {
    const account = this.users.get(username.trim());
    if (!account) return 'thaiid';
    return this.pathFromProfile(account);
  }

  private pathFromProfile(account: {
    nationality?: string;
    country?: string;
    idType?: string;
    role?: AccountRole;
  }): IdentityVerifyPath {
    const nationality = (account.nationality || '').trim().toLowerCase();
    const country = (account.country || '').trim();
    const idType = (account.idType || '').trim();
    if (idType === 'หนังสือเดินทาง') return 'foreign';
    if (country === 'ต่างประเทศ') return 'foreign';
    if (nationality && nationality !== 'ไทย' && nationality !== 'thai' && !nationality.includes('ไทย')) return 'foreign';
    return 'thaiid';
  }

  /** คนไทย — ยืนยันผ่าน ThaiID แล้วใช้งานได้ทันที */
  verifyWithThaiId(username = this.userId): boolean {
    const id = username.trim();
    const account = this.users.get(id);
    if (!account) return false;
    account.identity = {
      path: 'thaiid',
      status: 'verified',
      at: this.thaiStamp(),
      note: 'ยืนยันตัวตนผ่าน ThaiID',
    };
    this.users.set(id, account);
    this.persist();
    return true;
  }

  /** คนต่างชาติ — แนบเอกสารบัตร ส่งให้เจ้าหน้าที่ตรวจ */
  submitForeignIdentity(docs: string[], username = this.userId): boolean {
    const id = username.trim();
    const account = this.users.get(id);
    const files = docs.map((name) => name.trim()).filter(Boolean);
    if (!account || !files.length) return false;
    account.identity = {
      path: 'foreign',
      status: 'pending',
      docs: files,
      at: this.thaiStamp(),
      note: 'รอเจ้าหน้าที่ตรวจสอบเอกสารยืนยันตัวตน',
    };
    this.users.set(id, account);
    this.persist();
    return true;
  }

  /** จำลองผลตรวจของเจ้าหน้าที่ (ใช้ใน Profile ช่วง prototype) */
  resolveForeignIdentity(pass: boolean, username = this.userId): boolean {
    const id = username.trim();
    const account = this.users.get(id);
    if (!account?.identity || account.identity.path !== 'foreign' || account.identity.status !== 'pending') return false;
    account.identity = {
      ...account.identity,
      status: pass ? 'verified' : 'rejected',
      at: this.thaiStamp(),
      note: pass ? 'เจ้าหน้าที่ตรวจสอบเอกสารแล้ว ยืนยันตัวตนสำเร็จ' : 'เอกสารไม่ครบหรือไม่ชัดเจน กรุณาแนบใหม่',
    };
    this.users.set(id, account);
    this.persist();
    return true;
  }

  identityStatusLabel(status: IdentityVerifyStatus = this.identityOf().status): string {
    if (status === 'verified') return 'ยืนยันตัวตนแล้ว';
    if (status === 'pending') return 'รอเจ้าหน้าที่ตรวจสอบ';
    if (status === 'rejected') return 'ไม่ผ่านการตรวจสอบ';
    return 'ยังไม่ยืนยันตัวตน';
  }

  identityStatusTone(status: IdentityVerifyStatus = this.identityOf().status): 'success' | 'warning' | 'danger' | 'neutral' {
    if (status === 'verified') return 'success';
    if (status === 'pending') return 'warning';
    if (status === 'rejected') return 'danger';
    return 'neutral';
  }

  private thaiStamp(): string {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear() + 543;
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hour}:${minute}`;
  }

  private persist(): void {
    const stored: Record<string, Account> = {};
    for (const [name, item] of this.users) stored[name] = item;
    sessionStorage.setItem(storageKey, JSON.stringify(stored));
  }

  demoLogins(): DemoLogin[] {
    return demoMenu.flatMap((item) => {
      const account = this.users.get(item.username);
      if (!account) return [];
      const named = account.person ?? '';
      const label = item.group === 'หัวหน้ากลุ่ม'
        ? `${account.personTitle || item.group} · ${named}`
        : item.group === 'ผู้ยื่นแทน'
          ? `${item.group} · ${named}`
          : item.group === 'คณะกรรมการอื่นๆ'
            ? 'ตรวจและอนุมัติ'
          : named && item.group !== 'กลุ่มงานมาตรการตอบโต้การทุ่มตลาด (AD)' && item.group !== 'กลุ่มงานมาตรการตอบโต้การทุ่มตลาดอุดหนุน (CVD)' && item.group !== 'กลุ่มงานมาตรการป้องกัน (SG)'
            ? `${item.group} · ${named}`
            : named || (account.role === 'corporate' ? `ผู้ยื่นคำขอ · ${roleLabel.corporate}` : roleLabel[account.role]);
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
    this.userId = username.trim();
    sessionStorage.setItem(sessionKey, JSON.stringify({ username: this.userId, role: account.role, person: this.person }));
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
    if (this.person) return this.person;
    return this.signedIn ? roleLabel[this.signedIn] : roleLabel.corporate;
  }

  get roleName(): string {
    const item = demoMenu.find((row) => row.username === this.userId);
    if (item?.group === 'หัวหน้ากลุ่ม' || this.signedIn === 'head') {
      const title = this.users.get(this.userId)?.personTitle ?? '';
      const code = title.replace(/^กลุ่ม\s*/, '');
      return code ? `หัวหน้ากลุ่ม ${code}` : 'หัวหน้ากลุ่ม';
    }
    if (item?.group.endsWith('(AD)')) return 'เจ้าหน้าที่ AD';
    if (item?.group.endsWith('(CVD)')) return 'เจ้าหน้าที่ CVD';
    if (item?.group.endsWith('(SG)')) return 'เจ้าหน้าที่ SG';
    if (item?.group === 'คณะกรรมการ') return 'คณะกรรมการ ทตอ.';
    if (item) return item.group;
    const title = this.users.get(this.userId)?.personTitle ?? '';
    if (this.signedIn === 'officer') return roleLabel.officer;
    if (this.signedIn === 'corporate') return 'ผู้ยื่นคำขอ';
    if (title && title !== this.person) return title;
    return this.signedIn ? roleLabel[this.signedIn] : '';
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
    if (!roles.includes(value.role)) return null;
    return { ...value, identity: this.readIdentity(value.identity) };
  }

  private readIdentity(value: IdentityVerify | undefined): IdentityVerify | undefined {
    if (!value || (value.path !== 'thaiid' && value.path !== 'foreign')) return undefined;
    if (!['none', 'pending', 'verified', 'rejected'].includes(value.status)) return undefined;
    return {
      path: value.path,
      status: value.status,
      docs: Array.isArray(value.docs) ? value.docs.filter((name) => typeof name === 'string') : undefined,
      at: typeof value.at === 'string' ? value.at : undefined,
      note: typeof value.note === 'string' ? value.note : undefined,
    };
  }

  private readTrust(): Record<string, number> {
    const saved = localStorage.getItem(trustKey);
    if (!saved) return {};
    const parsed = JSON.parse(saved) as Record<string, number>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  }
}
