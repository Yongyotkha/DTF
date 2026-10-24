const joinedKey = 'dft-interest-joined';

export type JoinedInterest = { caseId: string; name: string; org: string; username?: string };

export function invitePath(caseId: string): string {
  return `/join/${encodeURIComponent(caseId)}`;
}

export function rememberJoined(party: JoinedInterest): void {
  const rows = readJoined().filter((item) => !(item.caseId === party.caseId && item.name === party.name));
  rows.push(party);
  sessionStorage.setItem(joinedKey, JSON.stringify(rows));
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
    const value = JSON.parse(sessionStorage.getItem(joinedKey) || '[]') as JoinedInterest[];
    return Array.isArray(value) ? value.filter((item) => item?.caseId && item?.name) : [];
  } catch {
    return [];
  }
}
