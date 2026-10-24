import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Accounts } from '../../accounts';
import { joinedCaseIds } from './interest-invite';
import { allows, isActingAgent, powersOf, powersOnCase } from './proxy-grant';
import { findListedCase } from './request-cases';

export const filingGuard: CanActivateFn = (route) => {
  const accounts = inject(Accounts);
  const router = inject(Router);
  if (accounts.role === 'interest') {
    if (route.queryParamMap.get('view') !== '1') return router.createUrlTree(['/requests/cases']);
    const joined = joinedCaseIds(accounts.username);
    if (!joined) return true;
    const key = route.queryParamMap.get('case') ?? '';
    const item = findListedCase(key);
    const allowed = joined.has(key) || (!!item && (joined.has(item.id) || joined.has(item.code)));
    return allowed ? true : router.createUrlTree(['/requests/cases']);
  }
  if (!isActingAgent(accounts.username)) return true;
  const key = route.queryParamMap.get('case') ?? '';
  if (!key) {
    const powers = powersOf(accounts.username);
    return powers.includes('file') || powers.includes('full') ? true : router.createUrlTree(['/requests']);
  }
  const item = findListedCase(key);
  const powers = powersOnCase(accounts.username, item?.id ?? key, item?.code ?? '');
  if (allows(powers, 'form')) return true;
  return router.createUrlTree(item ? ['/requests', key] : ['/requests']);
};
