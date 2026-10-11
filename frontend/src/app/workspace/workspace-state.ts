import { Injectable, computed, effect, signal } from '@angular/core';

export type WorkspaceMode = 'normal' | 'focus' | 'split';
export type WorkspaceBand = 'desktop' | 'tablet' | 'mobile';

const modeKey = 'dft-workspace';

function readBase(): 'normal' | 'focus' {
  try {
    return sessionStorage.getItem(modeKey) === 'focus' ? 'focus' : 'normal';
  } catch {
    return 'normal';
  }
}

function bandOf(): WorkspaceBand {
  if (typeof matchMedia !== 'function') return 'desktop';
  if (matchMedia('(max-width: 700px)').matches) return 'mobile';
  if (matchMedia('(max-width: 1100px)').matches) return 'tablet';
  return 'desktop';
}

@Injectable({ providedIn: 'root' })
export class WorkspaceState {
  readonly mode = signal<WorkspaceMode>(readBase());
  readonly band = signal<WorkspaceBand>(bandOf());
  readonly splitWidth = signal(420);
  private readonly base = signal<'normal' | 'focus'>(readBase());

  readonly focus = computed(() => this.mode() === 'focus');
  readonly split = computed(() => this.mode() === 'split');

  constructor() {
    effect(() => {
      const mode = this.mode();
      document.body.classList.toggle('workspace-focus', mode === 'focus');
      document.body.classList.toggle('workspace-split', mode === 'split');
      document.body.style.setProperty('--ask-width', `${this.splitWidth()}px`);
      if (mode === 'normal' || mode === 'focus') {
        this.base.set(mode);
        try {
          sessionStorage.setItem(modeKey, mode);
        } catch {
          /* private browsing */
        }
      }
    });
    if (typeof matchMedia !== 'function') return;
    const mobile = matchMedia('(max-width: 700px)');
    const tablet = matchMedia('(max-width: 1100px)');
    const update = () => this.band.set(bandOf());
    mobile.addEventListener('change', update);
    tablet.addEventListener('change', update);
  }

  enterFocus(): void {
    this.mode.set('focus');
  }

  exitFocus(): void {
    if (this.mode() === 'focus') this.mode.set('normal');
  }

  openSplit(): void {
    if (this.mode() !== 'split') this.base.set(this.mode() === 'focus' ? 'focus' : 'normal');
    this.mode.set('split');
  }

  leaveSplit(): void {
    if (this.mode() === 'split') this.mode.set(this.base());
  }
}
