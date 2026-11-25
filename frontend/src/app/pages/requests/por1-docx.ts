/**
 * มติคณะอนุฯ / รายงานการประชุมอนุไต่สวน — ตัวช่วยอ่านและสร้างไฟล์ .docx
 *
 * อ่านย่อหน้าจากไฟล์ .docx ที่อัปโหลด เพื่อแสดงตัวอย่างและใส่ใน editor
 * (AI ร่างใช้ html ที่แปลงจากไฟล์ตัวอย่างจริง — ดู tools/docx-to-meeting-html.py)
 */
import JSZip from 'jszip';

const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

/** อ่านข้อความทุกย่อหน้าจากไฟล์ .docx (คืนค่าเป็นอาร์เรย์ข้อความ ว่างถูกตัดออก) */
export async function docxParagraphs(data: ArrayBuffer | Blob): Promise<string[]> {
  const zip = await JSZip.loadAsync(data);
  const file = zip.file('word/document.xml');
  if (!file) throw new Error('ไม่ใช่ไฟล์ .docx');
  const xml = new DOMParser().parseFromString(await file.async('string'), 'application/xml');
  const out: string[] = [];
  const paras = Array.from(xml.getElementsByTagNameNS(W_NS, 'p'));
  for (const p of paras) {
    let text = '';
    const walk = (node: Element) => {
      Array.from(node.childNodes).forEach((child) => {
        if (child.nodeType !== 1) return;
        const el = child as Element;
        if (el.namespaceURI !== W_NS) return;
        switch (el.localName) {
          case 't':
            text += el.textContent ?? '';
            break;
          case 'tab':
            text += '\t';
            break;
          case 'br':
          case 'cr':
            text += '\n';
            break;
          default:
            walk(el);
        }
      });
    };
    walk(p);
    const line = text.replace(/[ \u00a0]+$/g, '');
    if (line.trim()) out.push(line);
  }
  return out;
}
