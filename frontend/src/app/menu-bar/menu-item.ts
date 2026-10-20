import { AfterViewInit, Component, ElementRef, Input, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-menu-item',
  templateUrl: './menu-item.html',
  styleUrl: './menu-item.css',
})
export class MenuItem implements AfterViewInit, OnDestroy {
  @Input() label = 'main-menu';
  @Input() level: 'main' | 'sub' = 'main';
  @Input() state: 'default' | 'active' = 'default';
  @Input() expanded = false;
  @Input() icon: 'request' | 'investigate' | 'petition' | 'guide' | 'home' | 'tasks' | 'archive' | 'settings' | '' = '';
  @Input() chevron = false;
  @Input() compact = false;
  @Input() controls = '';

  protected tipShown = false;
  protected tipTop = 0;
  protected tipLeft = 0;
  private scrollParent: HTMLElement | null = null;
  private readonly onScroll = () => this.hideTip();

  constructor(private readonly host: ElementRef<HTMLElement>) {}

  protected get iconBox(): { src: string; width: number; height: number } | null {
    if (this.icon === 'home') return { src: 'assets/icons/menu-home.svg', width: 20, height: 20 };
    if (this.icon === 'request') return { src: 'assets/icons/menu-request.svg', width: 18, height: 22 };
    if (this.icon === 'investigate') return { src: 'assets/icons/menu-investigate.svg', width: 20, height: 20 };
    if (this.icon === 'petition') return { src: 'assets/icons/menu-petition.svg', width: 18, height: 22 };
    if (this.icon === 'guide') return { src: 'assets/icons/menu-guide.svg', width: 22, height: 20 };
    if (this.icon === 'tasks') return { src: 'assets/icons/menu-task-list.svg', width: 24, height: 24 };
    if (this.icon === 'archive') return { src: 'assets/icons/menu-folder.svg', width: 24, height: 24 };
    if (this.icon === 'settings') return { src: 'assets/icons/menu-settings.svg', width: 24, height: 24 };
    return null;
  }

  ngAfterViewInit(): void {
    this.scrollParent = this.host.nativeElement.closest('.side-nav__body');
    this.scrollParent?.addEventListener('scroll', this.onScroll, { passive: true });
  }

  ngOnDestroy(): void {
    this.scrollParent?.removeEventListener('scroll', this.onScroll);
  }

  protected showTip(event: Event): void {
    if (!this.compact || (this.chevron && this.expanded)) {
      this.tipShown = false;
      return;
    }
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    this.tipTop = rect.top + rect.height / 2;
    this.tipLeft = rect.right + 8;
    this.tipShown = true;
  }

  protected hideTip(): void {
    this.tipShown = false;
  }
}
