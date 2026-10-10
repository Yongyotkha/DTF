import { Component, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AskAiState } from '../../ask-ai/ask-ai';
import { DftButton } from '../../button/button';
import { SideNav } from '../../menu-bar/side-nav';
import { Tabs } from '../../tabs/tabs';
import { TopHeader } from '../../top-header/top-header';

type RequestStep = {
  name: string;
  state: 'done' | 'current' | 'todo';
  date?: string;
};

type RequestRow = {
  id: string;
  code: string;
  goods: string;
  kind: string;
  status: string;
  created: string;
  ready: boolean;
  steps: RequestStep[];
};

const stepNames = ['ยื่นคำขอ', 'ตรวจสอบข้อมูล', 'เปิดการไต่สวน', 'ผลการไต่สวนชั้นต้น', 'ยื่นรับฟังความคิดเห็น', 'ร่างผลการไต่สวน', 'ประกาศผลชั้นที่สุด'];
const stepDate = 'วันที่ 15 มกราคม 2567 เวลา 16:30';

function requestSteps(current: number): RequestStep[] {
  return stepNames.map((name, index) => ({
    name,
    state: index < current ? 'done' : index === current ? 'current' : 'todo',
    date: index <= current && index < 2 ? stepDate : undefined,
  }));
}

const forms = [
  { code: 'ปร. 1', title: 'แบบคำขอให้ดำเนินการพิจารณาตอบโต้การทุ่มตลาดหรือการอุดหนุน', detail: 'แบบคำขอให้ดำเนินการพิจารณาตอบโต้การทุ่มตลาดหรือการอุดหนุน ตามมาตรา 33 วรรคหนึ่ง และมาตรา 70' },
  { code: 'ปร. 2', title: 'แบบคำขอให้ดำเนินการพิจารณาตอบโต้การทุ่มตลาดหรือการอุดหนุน', detail: 'แบบคำขอให้พิจารณาทบทวนความจำเป็นในการใช้บังคับอากรตอบโต้ การทุ่มตลาดหรือการอุดหนุนตามมาตรา 56' },
  { code: 'ปร. 2ก', title: 'แบบคำขอให้ดำเนินการพิจารณาตอบโต้การทุ่มตลาดหรือการอุดหนุน', detail: 'แบบคำขอให้พิจารณาทบทวนความจำเป็นในการใช้บังคับความตกลงเพื่อระงับการทุ่มตลาดหรือการอุดหนุนตามมา' },
  { code: 'ปร. 3', title: 'แบบคำขอให้ดำเนินการพิจารณาตอบโต้การทุ่มตลาดหรือการอุดหนุน', detail: 'แบบคำขอให้พิจารณาทบทวนการเรียกเก็บอากรตอบโต้ การทุ่มตลาดหรือการอุดหนุนต่อไปตามมาตรา 57' },
  { code: 'ปร. 3ก', title: 'แบบคำขอให้ดำเนินการพิจารณาตอบโต้การทุ่มตลาดหรือการอุดหนุน', detail: 'แบบคำขอให้พิจารณาทบทวนการใช้บังคับความตกลงเพื่อระงับ การทุ่มตลาดหรือการอุดหนุนต่อไปตามมาตรา 48' },
  { code: 'ปร. 4', title: 'แบบคำขอให้ดำเนินการพิจารณาตอบโต้การทุ่มตลาดหรือการอุดหนุน', detail: 'แบบคำขอให้พิจารณาทบทวนการเรียกเก็บอากรตอบโต้การทุ่มตลาดหรือการอุดหนุนสำหรับผู้ส่งออกหรือผู้ผลิตรา' },
];

@Component({
  selector: 'app-requests-page',
  imports: [TopHeader, SideNav, DftButton, Tabs],
  templateUrl: './requests-page.html',
  styleUrl: './requests-page.css',
})
export class RequestsPage {
  protected readonly measures = ['มาตราการ AD', 'มาตราการ CVD', 'มาตราการ SG', 'มาตราการ AC'];
  protected readonly forms = forms;
  protected readonly tabs = ['รายการยื่นคำขอ', 'ฉบับร่าง'];
  protected measure = 'มาตราการ AD';
  protected choosing = false;
  protected listTab = 0;
  protected page = 1;
  protected readonly openRows = signal<ReadonlySet<string>>(new Set(['row-1', 'row-2']));
  private readonly rows: RequestRow[] = [
    { id: 'row-1', code: 'AD0012', goods: 'text', kind: 'ยื่นในนามของตนเอง', status: 'ยื่นคำขอ', created: '22/09/2569 10:20', ready: true, steps: requestSteps(0) },
    { id: 'row-2', code: 'AD0012', goods: 'text', kind: 'ยื่นในนามของตนเอง', status: 'ยื่นรับฟังความคิดเห็น', created: '22/09/2569 10:20', ready: false, steps: requestSteps(1) },
  ];

  constructor(
    private readonly router: Router,
    private readonly askAi: AskAiState,
    route: ActivatedRoute,
  ) {
    route.queryParamMap.subscribe((params) => {
      this.choosing = params.get('choose') === '1';
    });
  }

  protected get visibleRows(): RequestRow[] {
    if (this.page !== 1) return [];
    if (this.listTab === 1) return [this.rows[0]];
    return this.rows;
  }

  protected shiftPage(step: number): void {
    this.page = Math.min(2, Math.max(1, this.page + step));
  }

  protected toggleRow(id: string): void {
    this.openRows.update((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  protected openCase(): void {
    void this.router.navigate(['/requests', 'AD1120']);
  }

  protected openDraft(): void {
    void this.router.navigate(['/requests', 'draft', 'A4']);
  }

  protected openChooser(): void {
    this.choosing = true;
    void this.router.navigate(['/requests'], { queryParams: { choose: '1' } });
  }

  protected openForm(code: string): void {
    if (code === 'ปร. 1') {
      this.choosing = false;
      void this.router.navigate(['/requests', 'por-1']);
      return;
    }
    if (code === 'ปร. 2') {
      this.choosing = false;
      void this.router.navigate(['/requests', 'por-2']);
      return;
    }
    this.closeChooser();
  }

  protected closeChooser(): void {
    this.choosing = false;
    void this.router.navigate(['/requests']);
  }

  protected openAsk(): void {
    this.askAi.show();
  }

  protected openMenu(label: string): void {
    if (label === 'ยื่นคำขอ') {
      this.choosing = true;
      void this.router.navigate(['/requests'], { queryParams: { choose: '1' } });
      return;
    }
    if (label === 'รายการยื่นคำขอ') this.closeChooser();
  }
}
