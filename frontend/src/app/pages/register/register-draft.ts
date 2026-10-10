import { Injectable } from '@angular/core';

export type DraftDirector = {
  name: string;
  surname: string;
  action: string;
};

export type DraftSsoProvider = 'thaiid' | 'google' | 'microsoft';

export type DraftSso = {
  provider: DraftSsoProvider;
  account: string;
};

@Injectable({ providedIn: 'root' })
export class RegisterDraft {
  accepted: Record<string, boolean> = {};
  read: Record<string, boolean> = {};
  values: Record<string, string> = {};
  directors: DraftDirector[] = [];
  directorsReady = false;
  sso: DraftSso[] = [];
}
