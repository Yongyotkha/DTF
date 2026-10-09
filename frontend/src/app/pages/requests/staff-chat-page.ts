import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SideNav } from '../../menu-bar/side-nav';
import { TopHeader } from '../../top-header/top-header';

@Component({
  selector: 'app-staff-chat-page',
  imports: [TopHeader, SideNav, RouterLink],
  templateUrl: './staff-chat-page.html',
  styleUrl: './staff-chat-page.css',
})
export class StaffChatPage {
  protected readonly prompts = ['เอกสารไม่ผ่าน', 'เอกสารส่วนของการทุ่มตลาดมีอะไรบ้าง', 'บังคับต้องลงนามไหม'];
  protected question = '';

  protected usePrompt(prompt: string): void {
    this.question = prompt;
  }
}
