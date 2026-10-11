import { Component, HostListener, computed, effect, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { WorkspaceState } from '../workspace/workspace-state';
import { AiThread } from './ai-thread';
import { AskAiState } from './ai-state';

export { AskAiState, formatSize, guidePrompts, sourceKind } from './ai-state';

@Component({
  selector: 'app-ask-ai',
  imports: [AiThread],
  templateUrl: './ask-ai.html',
  styleUrl: './ask-ai.css',
})
export class AskAi {
  private readonly path = signal('');
  protected readonly shown = computed(() => {
    const path = this.path();
    if (path === '/requests/chat' || path.startsWith('/ai-workspace')) return false;
    return !/^\/(login|forgot-password|register|design-system)(\/|$)/.test(path);
  });
  constructor(
    private readonly router: Router,
    protected readonly chat: AskAiState,
    protected readonly workspace: WorkspaceState,
  ) {
    this.path.set(this.router.url.split('?')[0]);
    this.chat.setPage(this.path());
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      const path = this.router.url.split('?')[0];
      this.path.set(path);
      this.chat.setPage(path);
    });
    effect(() => {
      const docked = this.shown() && this.chat.mode() === 'expanded' && this.workspace.band() === 'desktop';
      document.body.classList.toggle('ask-docked', docked);
      if (docked) document.body.style.setProperty('--ask-width', `${this.workspace.splitWidth()}px`);
      if (!this.shown() && /^\/(login|forgot-password|register)(\/|$)/.test(this.path()) && this.workspace.split()) {
        this.workspace.leaveSplit();
        this.chat.close();
      }
    });
  }

  protected resizable(): boolean {
    return this.workspace.band() === 'desktop' && this.chat.mode() === 'expanded';
  }

  protected grow(): void {
    this.workspace.openSplit();
    this.chat.expand();
  }

  protected shrink(): void {
    this.chat.minimize();
    this.workspace.leaveSplit();
  }

  protected dismiss(): void {
    this.chat.close();
    this.workspace.leaveSplit();
    queueMicrotask(() => document.getElementById('workspace-split')?.focus());
  }

  protected resizeStart(event: PointerEvent): void {
    if (!this.resizable()) return;
    event.preventDefault();
    const move = (ev: PointerEvent) => {
      const width = Math.min(560, Math.max(320, window.innerWidth - ev.clientX));
      this.workspace.splitWidth.set(width);
      document.body.style.setProperty('--ask-width', `${width}px`);
    };
    const stop = () => {
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', stop);
    };
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', stop);
  }

  protected resizeKey(event: KeyboardEvent): void {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const delta = event.key === 'ArrowLeft' ? 24 : -24;
    const width = Math.min(560, Math.max(320, this.workspace.splitWidth() + delta));
    this.workspace.splitWidth.set(width);
    document.body.style.setProperty('--ask-width', `${width}px`);
  }

  @HostListener('document:dft-split-open')
  protected onSplitOpen(): void {
    this.chat.expand();
  }

  @HostListener('document:dft-split-close')
  protected onSplitClose(): void {
    this.chat.close();
  }

  @HostListener('document:keydown', ['$event'])
  protected onEscape(event: KeyboardEvent): void {
    if (event.key !== 'Escape' || !this.shown() || this.chat.mode() === 'closed') return;
    if (this.workspace.band() === 'desktop') return;
    event.preventDefault();
    this.dismiss();
  }

  protected openWorkspace(): void {
    const path = this.path();
    if (!path.startsWith('/ai-workspace')) this.chat.returnPath.set(path || '/requests');
    this.workspace.leaveSplit();
    this.chat.mode.set('closed');
    void this.router.navigate(['/ai-workspace']);
  }
}
