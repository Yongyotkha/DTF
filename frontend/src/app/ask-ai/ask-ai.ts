import { Component, computed, effect, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
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
  ) {
    this.path.set(this.router.url.split('?')[0]);
    this.chat.setPage(this.path());
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      const path = this.router.url.split('?')[0];
      this.path.set(path);
      this.chat.setPage(path);
    });
    effect(() => {
      const docked = this.shown() && this.chat.mode() === 'expanded';
      document.body.classList.toggle('ask-docked', docked);
    });
  }

  protected workspace(): void {
    const path = this.path();
    if (!path.startsWith('/ai-workspace')) this.chat.returnPath.set(path || '/requests');
    this.chat.mode.set('closed');
    void this.router.navigate(['/ai-workspace']);
  }
}
