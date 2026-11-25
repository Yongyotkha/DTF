const joinedKey = 'dft-interest-joined';

export type JoinedInterest = { caseId: string; name: string; org: string; username?: string };
export type InterestKind = 'importer' | 'domestic' | 'exporter' | 'agency';
export type InterestFilingStatus = 'pending' | 'fix' | 'conditional' | 'approved';
export type InterestFiling = {
  id: string;
  caseId: string;
  window: 'open' | 'late';
  name: string;
  taxId: string;
  kinds: InterestKind[];
  acceptDocs: boolean;
  signed: boolean;
  receipt: string;
  acting: boolean;
  company: string;
  companyKinds: InterestKind[];
  companyReceipt: string;
  status: InterestFilingStatus;
  group: InterestKind | '';
  fixNote: string;
  fixDue: string;
};

// เก็บใน localStorage เพื่อให้หน้าลงทะเบียนของผู้มีส่วนได้เสียกับหน้าเจ้าหน้าที่ใช้ข้อมูลชุดเดียวกันข้ามแท็บ
const filingKey = 'dft-interest-filings';

export function interestKindLabel(kind: InterestKind): string {
  if (kind === 'importer') return 'ผู้นำเข้า';
  if (kind === 'domestic') return 'อุตสาหกรรมภายใน';
  if (kind === 'exporter') return 'ผู้ส่งออก';
  return 'หน่วยงานที่เกี่ยวข้อง';
}

export function readInterestFilings(): InterestFiling[] {
  try {
    const value = JSON.parse(localStorage.getItem(filingKey) || '[]') as InterestFiling[];
    return Array.isArray(value) ? value.filter((item) => item?.id && item.caseId && item.name) : [];
  } catch {
    return [];
  }
}

export function saveInterestFiling(row: InterestFiling): void {
  const rows = readInterestFilings().filter((item) => item.id !== row.id);
  rows.push(row);
  localStorage.setItem(filingKey, JSON.stringify(rows));
}

export function updateInterestFiling(id: string, patch: Partial<InterestFiling>): void {
  const rows = readInterestFilings().map((item) => (item.id === id ? { ...item, ...patch } : item));
  localStorage.setItem(filingKey, JSON.stringify(rows));
}

export function removeInterestFilings(idPrefix: string): void {
  const rows = readInterestFilings().filter((item) => !item.id.startsWith(idPrefix));
  localStorage.setItem(filingKey, JSON.stringify(rows));
}

export function filingsFor(caseId: string): InterestFiling[] {
  return readInterestFilings().filter((item) => item.caseId === caseId);
}

export function invitePath(caseId: string): string {
  return `/join/${encodeURIComponent(caseId)}`;
}

export function rememberJoined(party: JoinedInterest): void {
  const rows = readJoined().filter((item) => !(item.caseId === party.caseId && item.name === party.name));
  rows.push(party);
  localStorage.setItem(joinedKey, JSON.stringify(rows));
}

export function joinedFor(caseId: string): JoinedInterest[] {
  return readJoined().filter((item) => item.caseId === caseId);
}

export function joinedCaseIds(username: string): Set<string> | null {
  if (!username) return null;
  const rows = readJoined().filter((item) => item.username === username);
  if (!rows.length) return null;
  return new Set(rows.map((item) => item.caseId));
}

function readJoined(): JoinedInterest[] {
  try {
    const value = JSON.parse(localStorage.getItem(joinedKey) || '[]') as JoinedInterest[];
    return Array.isArray(value) ? value.filter((item) => item?.caseId && item?.name) : [];
  } catch {
    return [];
  }
}
