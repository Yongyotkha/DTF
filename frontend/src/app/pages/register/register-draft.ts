import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class RegisterDraft {
  accepted: Record<string, boolean> = {};
  read: Record<string, boolean> = {};
  values: Record<string, string> = {};
}
