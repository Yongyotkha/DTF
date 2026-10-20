import { ListedCase } from './request-cases';

export function formCodeIn(file: string): string | null {
  const match = file.match(/แบบ\s*ปร\.?\s*([0-9]+)\s*(ก)?/u);
  if (!match) return null;
  return `ปร. ${match[1]}${match[2] ?? ''}`;
}

export type CaseFormExtra = {
  notice: string;
  exporters: string[];
  power: boolean;
  files: { catalog: string[]; trade: string[]; goods: string[]; power: string[]; inquiry: string[] };
};

const namedExporters: Record<string, string[]> = {
  AC1002: ['Tianjin Youfa', 'TYT'],
  AC1001: ['Baosteel', 'Bengang', 'Jiangsu Shagang', 'Rizhao Steel'],
  AD1022: ['Dongbu', 'Yieh Phui', 'Dongkok', 'Shandong'],
};

export function caseFormExtra(item: ListedCase): CaseFormExtra {
  const pick = (keys: string[]) => item.documents.filter((file) => keys.some((key) => file.includes(key)));
  return {
    notice: item.documents.find((file) => file.includes('ประกาศผลตอบโต้')) ?? '',
    exporters: namedExporters[item.code] ?? [],
    power: item.documents.some((file) => file.includes('มอบอำนาจ')),
    files: {
      catalog: pick(['Catalogue', 'แคตตาล็อก']),
      trade: pick(['นำเข้า']),
      goods: pick(['กำลังการผลิต']),
      power: pick(['มอบอำนาจ']),
      inquiry: pick(['วาระ', 'แบบสอบถาม']),
    },
  };
}
