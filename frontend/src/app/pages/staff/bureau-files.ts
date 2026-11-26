import { DeskDoc, getUploaded } from './bureau-store';
import { wordHtml } from './bureau-draft';

/** เปิด/ดาวน์โหลดไฟล์ของ บท. — ไฟล์ตัวอย่างใน assets, ไฟล์ที่อัปโหลดเก็บใน IndexedDB (idb:) และเอกสารที่ร่างในระบบ (HTML) */

export function saveBlob(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** ไฟล์ Word ใน assets มีฉบับ .html ไว้เปิดดูในเบราว์เซอร์ */
export async function viewHref(href: string, name = ''): Promise<void> {
  if (!href) return;
  if (href.startsWith('idb:')) {
    const blob = await getUploaded(href.slice(4));
    if (!blob) return;
    if (/\.(pdf|png|jpe?g|gif|txt|html?)$/i.test(name) || /^(application\/pdf|image\/|text\/)/.test(blob.type)) {
      window.open(URL.createObjectURL(blob), '_blank');
      return;
    }
    saveBlob(blob, name || 'ไฟล์ที่อัปโหลด');
    return;
  }
  window.open(encodeURI(/\.docx?$/i.test(href) ? `${href}.html` : href), '_blank', 'noopener');
}

export async function downloadHref(href: string, name: string): Promise<void> {
  if (!href) return;
  if (href.startsWith('idb:')) {
    const blob = await getUploaded(href.slice(4));
    if (blob) saveBlob(blob, name);
    return;
  }
  try {
    const res = await fetch(encodeURI(href));
    if (!res.ok) throw new Error(String(res.status));
    saveBlob(await res.blob(), name);
  } catch {
    void viewHref(href, name);
  }
}

function docFileName(doc: DeskDoc): string {
  return `${(doc.fileName || doc.title).replace(/\.[^.]+$/, '')}.doc`;
}

/** เอกสารที่ร่างในระบบ: เปิดเป็นหน้าเอกสารในแท็บใหม่ ส่วนไฟล์แนบเปิดตามชนิดไฟล์ */
export function viewDeskDoc(doc: DeskDoc): void {
  if (doc.source === 'created' || doc.source === 'ai') {
    window.open(URL.createObjectURL(new Blob([wordHtml(doc.title, doc.html)], { type: 'text/html;charset=utf-8' })), '_blank');
    return;
  }
  void viewHref(doc.href, doc.fileName);
}

export function downloadDeskDoc(doc: DeskDoc): void {
  if (doc.source === 'created' || doc.source === 'ai') {
    saveBlob(new Blob(['\ufeff', wordHtml(doc.title, doc.html)], { type: 'application/msword;charset=utf-8' }), docFileName(doc));
    return;
  }
  void downloadHref(doc.href, doc.fileName || doc.title);
}
