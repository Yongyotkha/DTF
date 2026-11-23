const storageKey = 'dft-cofiler-invites';
const privateKey = 'dft-cofiler-private';
const viewKey = 'dft-cofiler-view';

export type CofilerStatus = 'draft' | 'sent' | 'joined' | 'submitted' | 'revoked';

export type CofilerInvite = {
  id: string;
  filingRef: string;
  makerName: string;
  email: string;
  org: string;
  status: CofilerStatus;
  username?: string;
  sentAt?: string;
};

/** ข้อมูลส่วนตัวของผู้ร่วมยื่น — เห็นได้เฉพาะเจ้าของเท่านั้น รวมถึงคนหลักก็ไม่เห็น */
export type CofilerPrivate = {
  inviteId: string;
  address: string;
  phone: string;
  fax: string;
  volumeNote: string;
  docs: string[];
  updatedAt?: string;
};

export type CofilerView = 'main' | string;

const seed: CofilerInvite[] = [];

export function cofilerInvitePath(id: string): string {
  return `/cofile/${encodeURIComponent(id)}`;
}

export function listCofilerInvites(filingRef?: string): CofilerInvite[] {
  const rows = readInvites();
  if (!filingRef) return rows;
  return rows.filter((item) => item.filingRef === filingRef);
}

export function cofilerById(id: string): CofilerInvite | undefined {
  return readInvites().find((item) => item.id === id);
}

export function addCofilerInvite(input: {
  filingRef: string;
  makerName: string;
  email: string;
  org?: string;
}): CofilerInvite {
  const rows = readInvites();
  const invite: CofilerInvite = {
    id: `cf-${Date.now().toString(36)}`,
    filingRef: input.filingRef,
    makerName: input.makerName.trim(),
    email: input.email.trim(),
    org: (input.org || '').trim(),
    status: 'sent',
    sentAt: new Date().toISOString(),
  };
  rows.unshift(invite);
  writeInvites(rows);
  ensurePrivate(invite.id);
  return invite;
}

export function revokeCofilerInvite(id: string): CofilerInvite | null {
  const rows = readInvites();
  const invite = rows.find((item) => item.id === id);
  if (!invite || invite.status === 'revoked') return null;
  invite.status = 'revoked';
  writeInvites(rows);
  return invite;
}

export function resendCofilerInvite(id: string): CofilerInvite | null {
  const rows = readInvites();
  const invite = rows.find((item) => item.id === id);
  if (!invite || invite.status === 'revoked') return null;
  invite.status = 'sent';
  invite.sentAt = new Date().toISOString();
  writeInvites(rows);
  return invite;
}

export function acceptCofilerInvite(id: string, username: string): CofilerInvite | 'taken' | 'closed' | null {
  const rows = readInvites();
  const invite = rows.find((item) => item.id === id);
  if (!invite || !username) return null;
  if (invite.status === 'revoked') return 'closed';
  if (invite.username && invite.username !== username) return 'taken';
  invite.username = username;
  invite.status = 'joined';
  writeInvites(rows);
  ensurePrivate(invite.id);
  return invite;
}

export function markCofilerSubmitted(id: string): CofilerInvite | null {
  const rows = readInvites();
  const invite = rows.find((item) => item.id === id);
  if (!invite || invite.status === 'revoked') return null;
  invite.status = 'submitted';
  writeInvites(rows);
  return invite;
}

export function readCofilerPrivate(inviteId: string): CofilerPrivate {
  return ensurePrivate(inviteId);
}

export function saveCofilerPrivate(inviteId: string, patch: Partial<Omit<CofilerPrivate, 'inviteId'>>): CofilerPrivate {
  const map = readPrivateMap();
  const current = ensurePrivate(inviteId);
  const next: CofilerPrivate = {
    ...current,
    ...patch,
    inviteId,
    docs: patch.docs ? [...patch.docs] : [...current.docs],
    updatedAt: new Date().toISOString(),
  };
  map[inviteId] = next;
  writePrivateMap(map);
  return next;
}

/** คนหลักเห็นได้แค่สถานะ ไม่เห็นเนื้อหาส่วนตัว */
export function cofilerPrivateStatus(inviteId: string): 'empty' | 'draft' | 'ready' {
  const invite = cofilerById(inviteId);
  if (!invite) return 'empty';
  if (invite.status === 'submitted') return 'ready';
  const row = readPrivateMap()[inviteId];
  if (!row) return 'empty';
  const filled = !!(row.address.trim() || row.phone.trim() || row.volumeNote.trim() || row.docs.length);
  return filled ? 'draft' : 'empty';
}

export function readCofilerView(): CofilerView {
  try {
    const value = sessionStorage.getItem(viewKey) || 'main';
    return value === 'main' || /^cf-[a-z0-9]+$/i.test(value) ? value : 'main';
  } catch {
    return 'main';
  }
}

export function writeCofilerView(view: CofilerView): void {
  sessionStorage.setItem(viewKey, view);
}

export function cofilerStatusLabel(status: CofilerStatus): string {
  if (status === 'draft') return 'ร่าง';
  if (status === 'sent') return 'ส่งคำเชิญแล้ว';
  if (status === 'joined') return 'เข้าระบบแล้ว';
  if (status === 'submitted') return 'ส่งส่วนตัวแล้ว';
  return 'เพิกถอน';
}

export function cofilerStatusTone(status: CofilerStatus): 'neutral' | 'info' | 'success' | 'warning' | 'danger' {
  if (status === 'submitted') return 'success';
  if (status === 'joined') return 'info';
  if (status === 'sent') return 'warning';
  if (status === 'revoked') return 'danger';
  return 'neutral';
}

function ensurePrivate(inviteId: string): CofilerPrivate {
  const map = readPrivateMap();
  const existing = map[inviteId];
  if (existing) return { ...existing, docs: [...existing.docs] };
  const blank: CofilerPrivate = {
    inviteId,
    address: '',
    phone: '',
    fax: '',
    volumeNote: '',
    docs: [],
  };
  map[inviteId] = blank;
  writePrivateMap(map);
  return { ...blank, docs: [] };
}

function readInvites(): CofilerInvite[] {
  try {
    const value = JSON.parse(sessionStorage.getItem(storageKey) || '[]') as CofilerInvite[];
    if (Array.isArray(value) && value.length) {
      return value.filter((item) => item?.id && item.filingRef && item.makerName);
    }
  } catch {
    /* ignore */
  }
  if (seed.length) {
    sessionStorage.setItem(storageKey, JSON.stringify(seed));
    return seed.map((item) => ({ ...item }));
  }
  return [];
}

function writeInvites(rows: CofilerInvite[]): void {
  sessionStorage.setItem(storageKey, JSON.stringify(rows));
}

function readPrivateMap(): Record<string, CofilerPrivate> {
  try {
    const value = JSON.parse(sessionStorage.getItem(privateKey) || '{}') as Record<string, CofilerPrivate>;
    return value && typeof value === 'object' ? value : {};
  } catch {
    return {};
  }
}

function writePrivateMap(map: Record<string, CofilerPrivate>): void {
  sessionStorage.setItem(privateKey, JSON.stringify(map));
}
