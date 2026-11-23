import { Component, EventEmitter, Input, Output } from '@angular/core';

export type TextEditorTone = { label: string; value: string };
export type TextEditorOption = { label: string; value: string };

/** แถบเครื่องมือ text editor มาตรฐาน — ใช้ชุดเดียวกันทุกหน้า */
@Component({
  selector: 'app-text-editor-toolbar',
  templateUrl: './text-editor-toolbar.html',
  styleUrl: './text-editor-toolbar.css',
})
export class TextEditorToolbar {
  @Input() ariaLabel = 'เครื่องมือแก้ไขข้อความ';
  @Input() fontName = 'TH SarabunPSK';
  @Input() fontSize = '16pt';
  @Input() fontSizes: readonly TextEditorOption[] = [
    { label: '14', value: '14pt' },
    { label: '16', value: '16pt' },
    { label: '18', value: '18pt' },
    { label: '20', value: '20pt' },
    { label: '22', value: '22pt' },
    { label: '24', value: '24pt' },
    { label: '28', value: '28pt' },
    { label: '36', value: '36pt' },
  ];
  @Input() lineHeight = '1.5';
  @Input() lineHeights: readonly TextEditorOption[] = [
    { label: '1.0', value: '1' },
    { label: '1.15', value: '1.15' },
    { label: '1.5', value: '1.5' },
    { label: '2.0', value: '2' },
    { label: '2.5', value: '2.5' },
    { label: '3.0', value: '3' },
  ];
  @Input() color = '#0E2346';
  @Input() colors: readonly TextEditorTone[] = [
    { label: 'หลัก', value: '#0E2346' },
    { label: 'รอง', value: '#5B6785' },
    { label: 'ลิงก์', value: '#2F73B0' },
    { label: 'ฟ้า', value: '#5CA4D9' },
    { label: 'เขียว', value: '#1E7F4F' },
    { label: 'ส้ม', value: '#E8801E' },
    { label: 'เหลือง', value: '#B7791F' },
    { label: 'แดง', value: '#C0182B' },
  ];
  @Input() highlight = 'transparent';
  @Input() highlights: readonly TextEditorTone[] = [
    { label: 'ไม่มี', value: 'transparent' },
    { label: 'เหลือง', value: '#FDF3E1' },
    { label: 'เขียว', value: '#E8F4EE' },
    { label: 'ฟ้า', value: '#E6F1F9' },
    { label: 'ชมพู', value: '#FAECEE' },
    { label: 'เทา', value: '#F2F2F3' },
  ];
  @Input() marks: Record<string, boolean> = {};
  @Input() showComment = false;
  @Input() commentOn = false;

  @Output() format = new EventEmitter<{ command: string; value?: string }>();
  @Output() fontSizeChange = new EventEmitter<string>();
  @Output() colorChange = new EventEmitter<string>();
  @Output() highlightChange = new EventEmitter<string>();
  @Output() lineHeightChange = new EventEmitter<string>();
  @Output() insertTable = new EventEmitter<void>();
  @Output() insertHr = new EventEmitter<void>();
  @Output() insertPageBreak = new EventEmitter<void>();
  @Output() comment = new EventEmitter<void>();
  @Output() commentDragStart = new EventEmitter<DragEvent>();

  protected cmdOn(command: string): boolean {
    return !!this.marks[command];
  }

  protected run(command: string, value?: string): void {
    this.format.emit({ command, value });
  }
}
