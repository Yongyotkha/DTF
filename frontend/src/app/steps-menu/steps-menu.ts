import { Component, Input } from '@angular/core';
import { StepsMenuItem, StepsMenuState } from './steps-menu-item';

export interface StepsMenuEntry {
  label: string;
  state: StepsMenuState;
}

export interface StepsMenuSection {
  title: string;
  items: StepsMenuEntry[];
}

@Component({
  selector: 'app-steps-menu',
  imports: [StepsMenuItem],
  templateUrl: './steps-menu.html',
  styleUrl: './steps-menu.css',
})
export class StepsMenu {
  @Input() sections: StepsMenuSection[] = [
    {
      title: 'Header 1',
      items: [
        { label: 'text', state: 'onclick' },
        { label: 'text', state: 'default' },
      ],
    },
    {
      title: 'Header 2',
      items: [
        { label: 'text', state: 'default' },
        { label: 'text', state: 'default' },
      ],
    },
  ];

  select(sectionIndex: number, itemIndex: number): void {
    const item = this.sections[sectionIndex]?.items[itemIndex];
    if (!item) {
      return;
    }
    for (const section of this.sections) {
      for (const entry of section.items) {
        if (entry.state === 'onclick') {
          entry.state = 'default';
        }
      }
    }
    item.state = 'onclick';
  }

  isLast(sectionIndex: number, itemIndex: number): boolean {
    const lastSection = sectionIndex === this.sections.length - 1;
    const lastItem = itemIndex === this.sections[sectionIndex].items.length - 1;
    return lastSection && lastItem;
  }
}
