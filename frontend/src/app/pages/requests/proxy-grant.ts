const storageKey = 'dft-proxy-grants';

export type ProxyPower = 'file' | 'edit' | 'contact' | 'full' | 'other';

export type ProxyGrant = {
  id: string;
  caseId: string;
  grantor: string;
  person: string;
  org: string;
  username: string;
  powers: ProxyPower[];
  status: 'pending' | 'invited' | 'active' | 'suspended' | 'rejected';
};

export type AcceptResult = ProxyGrant | 'wait' | 'closed' | 'taken';

export const proxyPowerChoices: { key: ProxyPower; label: string }[] = [
  { key: 'file', label: 'ยื่นคำขอและเอกสารประกอบคำขอ' },
  { key: 'edit', label: 'เปลี่ยนแปลงหรือแก้ไขข้อความหรือเอกสารตามคำขอ' },
  { key: 'contact', label: 'ให้ข้อมูลเพิ่มเติมและติดต่อประสานงานกับเจ้าหน้าที่' },
  { key: 'full', label: 'ดำเนินการแทนตลอดกระบวนการยื่นคำขอจนเสร็จ' },
  { key: 'other', label: 'อื่น ๆ' },
];

const seed: ProxyGrant[] = [
  {
    id: 'ad1019-agent',
    caseId: 'ad1019-57',
    grantor: '0105538041238',
    person: 'นายอภิสิทธิ์ สุธัมม์',
    org: 'บริษัท วีระวงค์, ชินวัฒน์ และพาร์ทเนอร์ส จำกัด',
    username: '1000000000125',
    powers: ['full'],
    status: 'active',
  },
];

export function powerLabel(key: ProxyPower): string {
  return proxyPowerChoices.find((item) => item.key === key)?.label ?? key;
}

export function invitePath(id: string): string {
  return `/act/${encodeURIComponent(id)}`;
}

export function listGrants(): ProxyGrant[] {
  const rows = read();
  if (rows.length) return rows;
  sessionStorage.setItem(storageKey, JSON.stringify(seed));
  return seed.map((item) => ({ ...item, powers: [...item.powers] }));
}

export function grantById(id: string): ProxyGrant | undefined {
  return listGrants().find((item) => item.id === id);
}

export function addGrant(input: Omit<ProxyGrant, 'id' | 'username' | 'status'> & { username?: string }): ProxyGrant {
  const rows = listGrants();
  const grant: ProxyGrant = {
    ...input,
    id: `px-${Date.now().toString(36)}`,
    username: input.username ?? '',
    status: 'pending',
    powers: [...input.powers],
  };
  rows.unshift(grant);
  write(rows);
  return grant;
}

export function reviewGrant(id: string, accept: boolean): ProxyGrant | null {
  const rows = listGrants();
  const grant = rows.find((item) => item.id === id);
  if (!grant || grant.status !== 'pending') return null;
  grant.status = accept ? 'invited' : 'rejected';
  write(rows);
  return grant;
}

export function setGrantUse(id: string, allow: boolean): ProxyGrant | null {
  const rows = listGrants();
  const grant = rows.find((item) => item.id === id);
  if (!grant) return null;
  if (allow) {
    if (grant.status !== 'suspended' || !grant.username) return null;
    grant.status = 'active';
  } else if (grant.status === 'active') {
    grant.status = 'suspended';
  } else {
    return null;
  }
  write(rows);
  return grant;
}

export function acceptGrant(id: string, username: string): AcceptResult {
  const rows = listGrants();
  const grant = rows.find((item) => item.id === id);
  if (!grant || !username) return 'closed';
  if (grant.status === 'pending') return 'wait';
  if (grant.status === 'rejected' || grant.status === 'suspended') return 'closed';
  if (grant.status !== 'invited' && grant.status !== 'active') return 'closed';
  if (grant.username && grant.username !== username) return 'taken';
  grant.username = username;
  grant.status = 'active';
  write(rows);
  return grant;
}

export function powersOf(username: string): ProxyPower[] {
  const set = new Set<ProxyPower>();
  for (const grant of activeFor(username)) grant.powers.forEach((key) => set.add(key));
  return [...set];
}

export function isActingAgent(username: string): boolean {
  return !!username && username !== '0105538041238' && activeFor(username).length > 0;
}

export function allowedCaseIds(username: string): Set<string> | null {
  if (!isActingAgent(username)) return null;
  return new Set(activeFor(username).map((item) => item.caseId));
}

export function powersOnCase(username: string, caseId: string, code = ''): ProxyPower[] | null {
  if (!isActingAgent(username)) return null;
  const hit = activeFor(username).find((item) => item.caseId === caseId || item.caseId === code);
  return hit?.powers ?? [];
}

export function allows(powers: ProxyPower[] | null, action: string): boolean {
  if (!powers) return true;
  if (powers.includes('full')) return true;
  if (action === 'withdraw') return false;
  if (action === 'facts' || action === 'hearing' || action === 'object' || action === 'qn' || action === 'exchange') return powers.includes('contact') || powers.includes('edit');
  if (action === 'form' || action === 'fee') return powers.includes('file') || powers.includes('edit');
  return powers.includes('other');
}

function activeFor(username: string): ProxyGrant[] {
  return listGrants().filter((item) => item.status === 'active' && item.username === username);
}

function write(rows: ProxyGrant[]): void {
  sessionStorage.setItem(storageKey, JSON.stringify(rows));
}

function read(): ProxyGrant[] {
  try {
    const value = JSON.parse(sessionStorage.getItem(storageKey) || '[]') as ProxyGrant[];
    return Array.isArray(value) ? value.filter((item) => item?.id && item.caseId && item.person) : [];
  } catch {
    return [];
  }
}
