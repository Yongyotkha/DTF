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
    return !/^\/(login|forgot-password|register|design-system|officer\/login)(\/|$)/.test(path);
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
      if (!this.shown() && /^\/(login|forgot-password|register|officer\/login)(\/|$)/.test(this.path()) && this.workspace.split()) {
        this.workspace.leaveSplit();
        this.chat.close();
      }
    });
  }

  protected readonly place = signal<{ x: number; y: number } | null>(null);
  protected readonly dragging = signal(false);

  protected resizable(): boolean {
    return this.workspace.band() === 'desktop' && this.chat.mode() === 'expanded';
  }

  protected movable(): boolean {
    return this.chat.mode() === 'floating' && this.workspace.band() !== 'mobile';
  }

  protected dragStart(event: PointerEvent): void {
    if (!this.movable()) return;
    const target = event.target as HTMLElement | null;
    if (target?.closest('button')) return;
    const header = event.currentTarget as HTMLElement;
    const panel = header.closest('.ask-panel') as HTMLElement | null;
    if (!panel) return;
    event.preventDefault();
    header.setPointerCapture(event.pointerId);
    const rect = panel.getBoundingClientRect();
    const originX = event.clientX;
    const originY = event.clientY;
    const startX = rect.left;
    const startY = rect.top;
    const width = rect.width;
    const height = rect.height;
    this.dragging.set(true);
    const move = (ev: PointerEvent) => {
      if (ev.pointerId !== event.pointerId) return;
      const maxX = Math.max(0, window.innerWidth - width);
      const maxY = Math.max(0, window.innerHeight - height);
      this.place.set({
        x: Math.min(maxX, Math.max(0, startX + ev.clientX - originX)),
        y: Math.min(maxY, Math.max(0, startY + ev.clientY - originY)),
      });
    };
    const stop = (ev: PointerEvent) => {
      if (ev.pointerId !== event.pointerId) return;
      this.dragging.set(false);
      header.removeEventListener('pointermove', move);
      header.removeEventListener('pointerup', stop);
      header.removeEventListener('pointercancel', stop);
    };
    header.addEventListener('pointermove', move);
    header.addEventListener('pointerup', stop);
    header.addEventListener('pointercancel', stop);
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
}
