import { StatusTone } from '../../status-tag/status-tag';

export type RequestStep = {
  name: string;
  state: 'done' | 'current' | 'todo';
  date?: string;
};

export type ListedCase = {
  id: string;
  code: string;
  ref: string;
  goods: string;
  countries: string[];
  kind: string;
  status: string;
  tone: StatusTone;
  created: string;
  round: number | null;
  waiting: boolean;
  draft: boolean;
  steps: RequestStep[];
  documents: string[];
};

const investigation = ['ยื่นคำขอ', 'ตรวจสอบข้อมูล', 'เปิดการไต่สวน', 'ผลการไต่สวนชั้นต้น', 'รับฟังความคิดเห็น', 'ร่างผลการไต่สวน', 'ประกาศผลชั้นที่สุด'];
const review = ['ยื่นคำขอทบทวน', 'ตรวจสอบคำขอ', 'เปิดการทบทวน', 'แบบสอบถาม', 'รับฟังความคิดเห็น', 'ร่างผลการทบทวน', 'ประกาศผลการทบทวน'];

function steps(names: string[], current: number, dates: Partial<Record<number, string>> = {}): RequestStep[] {
  return names.map((name, index) => ({
    name,
    state: index < current ? 'done' : index === current ? 'current' : 'todo',
    date: dates[index],
  }));
}

/** เคสจากโฟลเดอร์เอกสารจริง คนละช่วงสถานะ สำหรับเดินนำเสนอ */
export const archiveCases: ListedCase[] = [
  {
    id: 'ad1039',
    code: 'AD1039',
    ref: 'REF256902060001',
    goods: 'หลอดหรือท่อทำด้วยเหล็ก จากเวียดนาม',
    countries: ['เวียดนาม'],
    kind: 'แบบ ปร.1',
    status: 'ยื่นคำขอ',
    tone: 'info',
    created: '06/02/2569',
    round: 3,
    waiting: false,
    draft: false,
    steps: steps(investigation, 0),
    documents: ['แบบ ปร.1 คำขอสินค้าหลอดหรือท่อทำด้วยเหล็ก จากเวียดนาม'],
  },
  {
    id: 'ad1024',
    code: 'AD1024',
    ref: 'REF256708010001',
    goods: 'เหล็กกล้าไร้สนิมรีดเย็น',
    countries: ['จีน'],
    kind: 'คำขอหลบเลี่ยงมาตรการ',
    status: 'อยู่ระหว่างตรวจสอบ',
    tone: 'info',
    created: '01/08/2567',
    round: 1,
    waiting: false,
    draft: false,
    steps: steps(investigation, 1, { 0: '01/08/2567', 1: '11/10/2567' }),
    documents: ['หารือก่อนยื่นคำขอ', 'คำขอครั้งที่ 1 วันที่ 01/08/2567', 'แก้ไขครั้งที่ 1', 'แก้ไขครั้งที่ 2', 'คำขอฉบับไม่เปิดเผย'],
  },
  {
    id: 'ad1054',
    code: 'AD1054',
    ref: 'REF256205150001',
    goods: 'พอลิเอทิลีนเทเรฟทาเลต (PET) จากจีน',
    countries: ['จีน'],
    kind: 'แบบ ปร.1',
    status: 'ยื่นคำขอ',
    tone: 'info',
    created: '15/05/2562',
    round: 1,
    waiting: false,
    draft: false,
    steps: steps(investigation, 0),
    documents: ['ร่างคำขอ วันที่ 02/05/2568', 'คำขอ', 'อนุกรรมการเปิดไต่สวน', 'ประกาศกรมการค้าต่างประเทศเปิดการไต่สวน', 'แบบสอบถาม'],
  },
  {
    id: 'ad1005',
    code: 'AD1005',
    ref: 'REF256902060002',
    goods: 'เหล็กแผ่นรีดร้อนชนิดเป็นม้วนและไม่เป็นม้วน',
    countries: ['ญี่ปุ่น', 'แอฟริกาใต้', 'รัสเซีย'],
    kind: 'ทบทวนมาตรการ ครั้งที่ 4',
    status: 'ตรวจสอบข้อมูล',
    tone: 'info',
    created: '06/02/2569',
    round: 3,
    waiting: true,
    draft: false,
    steps: steps(review, 1, { 0: '06/02/2569', 1: '03/04/2569' }).map((step) =>
      step.name === 'ตรวจสอบคำขอ' ? { ...step, name: 'ตรวจสอบข้อมูล' } : step,
    ),
    documents: ['คำขอทบทวน ยื่นครั้งแรก 06/02/2569', 'แจ้งให้ปรับปรุงแก้ไขคำขอ', 'คำขอฉบับเปิดเผย', 'ประกาศเปิดทบทวน', 'แบบสอบถาม'],
  },
  {
    id: 'ad1020',
    code: 'AD1020',
    ref: 'REF256608100001',
    goods: 'เหล็กแผ่นรีดร้อนเจือโบรอน',
    countries: ['จีน'],
    kind: 'แบบ ปร.1',
    status: 'รับฟังความคิดเห็น',
    tone: 'warning',
    created: '10/08/2566',
    round: 1,
    waiting: true,
    draft: false,
    steps: steps(investigation, 4, { 0: '10/08/2566' }),
    documents: ['คำขอครั้งที่ 1 วันที่ 10/08/2566', 'แบบสอบถาม', 'ตรวจสอบข้อเท็จจริง', 'เปิดเผยข้อมูลและรับฟังความคิดเห็น'],
  },
  {
    id: 'ad1004',
    code: 'AD1004',
    ref: 'REF256903090001',
    goods: 'เหล็กกล้าไร้สนิมรีดเย็น จากญี่ปุ่น เกาหลี และไต้หวัน',
    countries: ['ญี่ปุ่น', 'เกาหลี', 'ไต้หวัน'],
    kind: 'ทบทวนมาตรการ',
    status: 'ร่างผลการทบทวน',
    tone: 'warning',
    created: '09/03/2569',
    round: 1,
    waiting: true,
    draft: false,
    steps: steps(review, 5),
    documents: ['คำขอเปิดทบทวน', 'แบบสอบถาม', 'ตรวจสอบข้อเท็จจริง', 'เปิดเผยข้อมูล', 'การรับฟังความคิดเห็น', 'ร่างผลการพิจารณา'],
  },
];

export const draftCases: ListedCase[] = [
  {
    id: 'por3-2569',
    code: 'ปร.3',
    ref: 'REF256900000001',
    goods: 'ต่ออายุมาตรการตอบโต้การทุ่มตลาด 14 ประเทศ',
    countries: ['14 ประเทศ'],
    kind: 'แบบ ปร.3',
    status: 'ร่าง',
    tone: 'neutral',
    created: '',
    round: null,
    waiting: false,
    draft: true,
    steps: steps(review, 0),
    documents: ['แบบ ปร.3 ต่ออายุมาตรการ 14 ประเทศ ปี 2569', 'เอกสารประกอบแบบ ปร.3'],
  },
];

export function findListedCase(code: string): ListedCase | undefined {
  return [...archiveCases, ...draftCases].find((item) => item.code === code || item.id === code);
}

export function stepLabel(name: string): string {
  if (name === 'ผลการไต่สวนชั้นต้น') return 'ผลการไต่สวนขั้นต้น';
  if (name === 'ประกาศผลชั้นที่สุด') return 'ประกาศผลฉบับที่สุด';
  return name;
}
