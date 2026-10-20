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
  kind: string;
  measure: string;
  status: string;
  tone: StatusTone;
  created: string;
  round: number | null;
  waiting: boolean;
  draft: boolean;
  steps: RequestStep[];
  documents: string[];
  applicant?: string;
  origins?: string[];
  note?: string;
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
    kind: 'แบบ ปร.1',
    measure: 'AD (ตอบโต้การทุ่มตลาด)',
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
    kind: 'คำขอหลบเลี่ยงมาตรการ',
    measure: 'AC (การหลบเลี่ยงมาตรการ)',
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
    kind: 'แบบ ปร.1',
    measure: 'AD (ตอบโต้การทุ่มตลาด)',
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
    goods: 'เหล็กแผ่นรีดร้อน',
    kind: 'ทบทวนมาตรการ ครั้งที่ 4',
    measure: 'AD (ตอบโต้การทุ่มตลาด)',
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
    kind: 'แบบ ปร.1',
    measure: 'AD (ตอบโต้การทุ่มตลาด)',
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
    kind: 'ทบทวนมาตรการ',
    measure: 'AD (ตอบโต้การทุ่มตลาด)',
    status: 'ร่างผลการทบทวน',
    tone: 'warning',
    created: '09/03/2569',
    round: 1,
    waiting: true,
    draft: false,
    steps: steps(review, 5),
    documents: ['คำขอเปิดทบทวน', 'แบบสอบถาม', 'ตรวจสอบข้อเท็จจริง', 'เปิดเผยข้อมูล', 'การรับฟังความคิดเห็น', 'ร่างผลการพิจารณา'],
  },
  {
    id: 'ac1001',
    code: 'AC1001',
    ref: 'REF256605290001',
    goods: 'เหล็กแผ่นรีดร้อนเจือ การหลบเลี่ยงจากจีน',
    kind: 'คำขอหลบเลี่ยงมาตรการ',
    measure: 'AC (การหลบเลี่ยงมาตรการ)',
    status: 'ประกาศผลชั้นที่สุด',
    tone: 'success',
    created: '29/05/2566',
    round: 1,
    waiting: false,
    draft: false,
    steps: steps(investigation, 6, { 0: '29/05/2566' }),
    applicant: 'ผู้ผลิตเหล็กแผ่นรีดร้อนเจือในประเทศ SSI, G Steel, GJS และ SPM',
    origins: ['จีน'],
    note: 'คำขอหลบเลี่ยงมาตรการเหล็กแผ่นรีดร้อนเจือจากจีน แบบสอบถามระบุรูปแบบ slight modification ผู้ผลิตในประเทศที่แนบปริมาณการผลิตคือ SSI, G Steel, GJS และ SPM ผู้ถูกแจ้งผลคือ Baosteel, Bengang, Jiangsu Shagang และ Rizhao Steel มีประกาศเปิดไต่สวน ราชกิจจานุเบกษา ตรวจข้อเท็จจริง แถลงการณ์ และประกาศ ทตอ.',
    documents: [
      'แบบ ปร.6 คำขอหลบเลี่ยงเหล็กแผ่นรีดร้อนเจือ',
      'ปริมาณการผลิตประกอบคำขอของ SSI G Steel GJS และ SPM',
      'หนังสือแจ้งให้แก้ไขคำขอ',
      'ประกาศเปิดการไต่สวนและราชกิจจานุเบกษา',
      'แบบสอบถาม slight modification ของ Bao Bengang Jiangsu Shagang และ Rizhao',
      'รายงานตรวจข้อเท็จจริง',
      'แถลงการณ์และเปิดเผยข้อมูล',
      'วาระร่างผลการไต่สวน',
      'หนังสือแจ้งผล Baosteel Bengang Jiangsu Shagang และ Rizhao Steel',
      'ประกาศ ทตอ. เรื่องการตอบโต้การหลบเลี่ยง',
      'ประกาศกรมเรื่องการขยายการเรียกเก็บอากรร้อยละ 0',
    ],
  },
  {
    id: 'ac1002',
    code: 'AC1002',
    ref: 'REF256710210001',
    goods: 'หลอดหรือท่อทำด้วยเหล็ก การหลบเลี่ยงจากจีน',
    kind: 'คำขอหลบเลี่ยงมาตรการ',
    measure: 'AC (การหลบเลี่ยงมาตรการ)',
    status: 'เปิดการไต่สวน',
    tone: 'success',
    created: '21/10/2567',
    round: 1,
    waiting: false,
    draft: false,
    steps: steps(investigation, 2, { 0: '21/10/2567', 1: '16/10/2567', 2: '01/11/2567' }),
    applicant: 'ผู้ผลิตท่อเหล็กในประเทศ มีหนังสือมอบอำนาจของ CCM และสมาคม',
    origins: ['จีน'],
    note: 'คำขอหลบเลี่ยงมาตรการตอบโต้การทุ่มตลาดสินค้าหลอดหรือท่อทำด้วยเหล็กหรือเหล็กกล้าจากจีน แบบที่ใช้คือ ปร.6 อ้างมาตรการเดิมที่ใช้กับจีนและเกาหลี มีเอกสารนำเข้าจากจีน ผู้ส่งออกที่ปรากฏในแฟ้มคือ Tianjin Youfa และ TYT',
    documents: [
      'แบบ ปร.6 ท่อเหล็ก ปี 2566 ฉบับปกปิด',
      'แบบ ปร.1 ท่อเหล็ก ปี 2565 ฉบับปกปิด',
      'ประกาศผลตอบโต้หลอดและท่อจากจีนและเกาหลี ฉบับที่ 3 พ.ศ. 2560',
      'กำลังการผลิตและปริมาณความต้องการใช้ ปี 2563–2566',
      'เอกสารนำเข้าท่อเหล็กจากจีน',
      'Catalogue TYT และ Youfa Group',
      'หนังสือมอบอำนาจ CCM และสมาคม',
      'วาระเปิดไต่สวน แบบสอบถาม ตรวจข้อเท็จจริง และผลการไต่สวน',
    ],
  },
  {
    id: 'sg1006',
    code: 'SG1006',
    ref: 'REF256306020001',
    goods: 'ฟอยล์อะลูมิเนียม',
    kind: 'มาตรการปกป้อง',
    measure: 'SG (มาตรการปกป้อง)',
    status: 'ร่างผลการไต่สวน',
    tone: 'warning',
    created: '02/06/2563',
    round: 1,
    waiting: true,
    draft: false,
    steps: steps(investigation, 5, { 0: '02/06/2563', 2: '13/08/2563', 5: '17/05/2564' }),
    applicant: 'ผู้ผลิตฟอยล์อะลูมิเนียมในประเทศ',
    origins: ['ทุกแหล่งกำเนิด'],
    note: 'คปป. รับคำขอครั้งที่ 3/2563 เมื่อ 2 มิ.ย. 2563 วาระอนุเปิดไต่สวน 10 ส.ค. 2563 วาระ คปป. 13 ส.ค. 2563 วาระอนุร่างผล 6 พ.ค. 2564 และวาระ คปป. ร่างผล 17 พ.ค. 2564',
    documents: [
      'บันทึกพิจารณารับคำขอ คปป. ครั้งที่ 3/2563',
      'วาระที่ 3.2 คำขอเปิดการไต่สวน',
      'สรุปมติ คปป. 2 มิ.ย. 2563',
      'วาระอนุ คปป. เปิดไต่สวน 10 ส.ค. 2563',
      'วาระ คปป. เปิดไต่สวน 13 ส.ค. 2563',
      'วาระอนุร่างผลการไต่สวน 6 พ.ค. 2564',
      'วาระ คปป. ร่างผลการไต่สวน 17 พ.ค. 2564',
      'หนังสือแจ้งผลไต่สวน',
    ],
  },
  {
    id: 'sg1003',
    code: 'SG1003',
    ref: 'REF256107030001',
    goods: 'เหล็กแผ่นรีดร้อนเจืออื่น ทบทวนครั้งที่ 2',
    kind: 'ทบทวนมาตรการปกป้อง',
    measure: 'SG (มาตรการปกป้อง)',
    status: 'ประกาศผลการทบทวน',
    tone: 'success',
    created: '03/07/2561',
    round: 2,
    waiting: false,
    draft: false,
    steps: steps(review, 6, { 0: '03/07/2561' }),
    applicant: 'ผู้ผลิตเหล็กแผ่นรีดร้อนเจือในประเทศ',
    origins: ['ทุกแหล่งกำเนิด'],
    note: 'ทบทวนมาตรการปกป้องครั้งที่ 2 คำขอฉบับเปิดเผยแก้ไขครั้งที่ 2 ลงวันที่ 3 ก.ค. 2561 มีแผนปรับตัว แบบสอบถาม เปิดไต่สวน และชั้นที่สุด แฟ้มมีเรื่องถอนชื่ออียิปต์ออกจากรายชื่อประเทศกำลังพัฒนา ประกาศชั้นที่สุดแจ้งไปยัง Nippon Steel, JFE Steel, Kobe Steel, Nisshin Steel และ Erdemir รวมสถานทูตหลายประเทศ',
    documents: [
      'คำขอทบทวนครั้งที่ 2 ฉบับเปิดเผย แก้ไขครั้งที่ 2 วันที่ 03/07/2561',
      'แผนปรับตัว',
      'แบบสอบถาม',
      'ประกาศเปิดทบทวนและข่าวหนังสือพิมพ์',
      'ถอนชื่ออียิปต์ออกจากรายชื่อประเทศกำลังพัฒนา',
      'ร่างผลการทบทวนและแจ้ง WTO',
      'แถลงการณ์ Public Hearing',
      'หนังสือแจ้งผลชั้นที่สุดถึงผู้ส่งออก',
      'ประกาศกรมชั้นที่สุด',
    ],
  },
  {
    id: 'sg1008',
    code: 'SG1008',
    ref: 'REF256803010001',
    goods: 'สินค้าพอลิโพรพิลีน (PP)',
    kind: 'มาตรการปกป้อง',
    measure: 'SG (มาตรการปกป้อง)',
    status: 'ยื่นคำขอ',
    tone: 'info',
    created: '01/03/2568',
    round: 3,
    waiting: false,
    draft: false,
    steps: steps(investigation, 0, { 0: '01/03/2568' }),
    documents: ['คำขอครั้งที่ 1', 'คำขอแก้ไขครั้งที่ 1', 'คำขอแก้ไขครั้งที่ 2'],
  },
  {
    id: 'ad1022-56',
    code: 'AD1022',
    ref: 'REF256803240001',
    goods: 'เหล็กเคลือบสังกะสีผสมอะลูมิเนียม (GL) จากจีนและเกาหลี',
    kind: 'ทบทวนมาตรา 56',
    measure: 'มาตรา 56 (ทบทวนระหว่างใช้มาตรการ)',
    status: 'ประกาศผลการทบทวน',
    tone: 'success',
    created: '24/03/2568',
    round: 1,
    waiting: false,
    draft: false,
    steps: steps(review, 6, { 0: '24/03/2568', 2: '02/09/2568' }),
    documents: [
      'แบบ ปร.2 คำขอทบทวนอัตราอากร GL จีนและเกาหลี',
      'แบบ ปร.1 คำขอทบทวนอัตรา GL ฉบับปกปิด',
      'คำขอครั้งแรก 24/03/2568',
      'แก้ไขคำขอครั้งที่ 1 ถึง 3',
      'ประกาศกรมเปิดทบทวนมาตรา 56 จีนและเกาหลี 02/09/2568',
      'แบบสอบถามเพิ่มเติม Dongbu Yieh Phui Dongkok และ Shandong',
      'รายงานตรวจข้อเท็จจริงจีนและเกาหลี',
      'แถลงการณ์ Hearing',
      'ประกาศ ทตอ. ลงนามแล้ว',
      'ข้อมูลรายเดือนจาก NS Blue Scope',
      'สถิตินำเข้า GL ปี 2560–2568',
    ],
    applicant: 'ผู้ผลิตเหล็ก GL ในประเทศ แฟ้มระบุผู้ยื่นเป็น WCP',
    origins: ['จีน', 'เกาหลี'],
    note: 'ทบทวนมาตรา 56 อัตราอากรเหล็กเคลือบสังกะสีผสมอะลูมิเนียมจากจีนและเกาหลี ใช้แบบ ปร.2 และมีแบบ ปร.1 ฉบับปกปิด คำขอครั้งแรก 24 มี.ค. 2568 ประกาศกรมเปิดทบทวน 2 ก.ย. 2568 ผู้ส่งแบบสอบถามเพิ่มเติมคือ Dongbu, Yieh Phui, Dongkok และ Shandong มีตรวจข้อเท็จจริง แถลงการณ์ และประกาศ ทตอ. ที่ลงนามแล้ว',
  },
  {
    id: 'ad1019-57',
    code: 'AD1019',
    ref: 'REF256705310001',
    goods: 'ยางใน จากจีน',
    kind: 'ทบทวนมาตรา 57',
    measure: 'มาตรา 57 (ทบทวนก่อนครบกำหนด)',
    status: 'ประกาศผลการทบทวน',
    tone: 'success',
    created: '31/05/2567',
    round: 2,
    waiting: false,
    draft: false,
    steps: steps(review, 6, { 0: '31/05/2567', 2: '01/07/2567', 3: '01/08/2567', 6: '01/12/2567' }),
    applicant: 'ผู้ผลิตยางในในประเทศ',
    origins: ['จีน'],
    note: 'ทบทวนก่อนครบกำหนดมาตรา 57 สินค้ายางใน เคสเดิม AD1019 ผู้ส่งออกจากจีน มีคำขอ Pre-notify เปิดไต่สวน แบบสอบถาม คำตอบ ตรวจข้อเท็จจริง แถลงการณ์ และผลสิ้นสุด',
    documents: [
      'คำขอทบทวนมาตรา 57',
      'Pre-notify และหนังสือแจ้งสถานทูตรับคำขอ',
      'หนังสือแจ้งชำระค่าธรรมเนียม',
      'ประกาศเปิดการไต่สวนและหลักประกันอากร',
      'ร่างประกาศกรมและประกาศ ทตอ.',
      'แบบสอบถามและคำตอบ',
      'แบบสอบถามเพิ่มเติม',
      'รายชื่อผู้ผลิตและผู้ส่งออกยางในจากจีน',
      'ตรวจข้อเท็จจริง',
      'แถลงการณ์',
      'ผลสิ้นสุด',
    ],
  },
];

export const draftCases: ListedCase[] = [
  {
    id: 'por3-2569',
    code: 'ปร.3',
    ref: 'REF256900000001',
    goods: 'ต่ออายุมาตรการตอบโต้การทุ่มตลาด 14 ประเทศ',
    kind: 'แบบ ปร.3',
    measure: 'AD (ตอบโต้การทุ่มตลาด)',
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

const stageKeys: { label: string; keys: string[] }[] = [
  { label: 'ประกาศผลฉบับที่สุด', keys: ['ผลสิ้นสุด', 'ฉบับที่สุด', 'แจ้งผล'] },
  { label: 'ประกาศผลการทบทวน', keys: ['ผลสิ้นสุด', 'แจ้งผล'] },
  { label: 'ร่างผลการไต่สวน', keys: ['ร่างผล', 'ร่างผลการ'] },
  { label: 'ร่างผลการทบทวน', keys: ['ร่าง'] },
  { label: 'รับฟังความคิดเห็น', keys: ['รับฟัง', 'แถลง', 'เปิดเผย'] },
  { label: 'แบบสอบถาม', keys: ['แบบสอบถาม', 'รายชื่อ'] },
  { label: 'ผลการไต่สวนขั้นต้น', keys: ['ข้อเท็จจริง', 'ขั้นต้น', 'ชั้นต้น'] },
  { label: 'เปิดการไต่สวน', keys: ['เปิดไต่สวน', 'เปิดการไต่สวน', 'วาระ', 'Pre-notify', 'ค่าธรรมเนียม', 'สถานทูต', 'หลักประกัน'] },
  { label: 'เปิดการทบทวน', keys: ['เปิดทบทวน', 'เปิดการทบทวน', 'Pre-notify', 'ค่าธรรมเนียม', 'สถานทูต', 'หลักประกัน'] },
  { label: 'ตรวจสอบข้อมูล', keys: ['แก้ไข', 'ปรับปรุง'] },
  { label: 'ตรวจสอบคำขอ', keys: ['แก้ไข', 'ปรับปรุง'] },
  { label: 'ยื่นคำขอทบทวน', keys: ['คำขอ'] },
  { label: 'ยื่นคำขอ', keys: ['คำขอ', 'แบบ ปร', 'มอบอำนาจ', 'กำลังการผลิต', 'Catalogue', 'นำเข้า', 'หารือ', 'ประกาศผลตอบโต้'] },
];

function stageOf(file: string, reached: string[]): string {
  const filingFirst = file.includes('คำขอ');
  const rows = filingFirst
    ? [...stageKeys.filter((row) => row.label.startsWith('ยื่นคำขอ')), ...stageKeys.filter((row) => !row.label.startsWith('ยื่นคำขอ'))]
    : stageKeys;
  for (const row of rows) {
    if (!reached.includes(row.label)) continue;
    if (row.keys.some((key) => file.includes(key))) return row.label;
  }
  return '';
}

export function documentsForStage(item: ListedCase, label: string): string[] {
  const reached = item.steps.filter((step) => step.state !== 'todo').map((step) => stepLabel(step.name));
  const current = stepLabel(item.steps.find((step) => step.state === 'current')?.name ?? label);
  return item.documents.filter((file) => (stageOf(file, reached) || current) === label);
}

export function stageResult(item: ListedCase, label: string, done: boolean): string {
  const goods = item.goods;
  const step = item.steps.find((entry) => stepLabel(entry.name) === label);
  const date = step?.date ? ` เมื่อ ${step.date}` : item.created && (label === 'ยื่นคำขอ' || label === 'ยื่นคำขอทบทวน') ? ` เมื่อ ${item.created}` : '';
  switch (label) {
    case 'ยื่นคำขอ':
    case 'ยื่นคำขอทบทวน':
      return `ยื่น${item.kind} สินค้า${goods}${date}`;
    case 'ตรวจสอบข้อมูล':
    case 'ตรวจสอบคำขอ':
      return done ? `ตรวจสอบคำขอสินค้า${goods} แล้ว${date}` : `อยู่ระหว่างตรวจสอบคำขอสินค้า${goods}${date}`;
    case 'เปิดการไต่สวน':
      return `เปิดการไต่สวนสินค้า${goods}${date}`;
    case 'เปิดการทบทวน':
      return `เปิดการทบทวนสินค้า${goods}${date}`;
    case 'ผลการไต่สวนขั้นต้น':
      return done ? `มีผลการไต่สวนขั้นต้นสินค้า${goods}${date}` : `อยู่ระหว่างจัดทำผลการไต่สวนขั้นต้นสินค้า${goods}`;
    case 'แบบสอบถาม':
      return done ? `ส่งแบบสอบถามสินค้า${goods} แล้ว${date}` : `อยู่ระหว่างแบบสอบถามสินค้า${goods}${date}`;
    case 'รับฟังความคิดเห็น':
      return done ? `รับฟังความคิดเห็นสินค้า${goods} แล้ว${date}` : `อยู่ระหว่างรับฟังความคิดเห็นสินค้า${goods}${date}`;
    case 'ร่างผลการไต่สวน':
    case 'ร่างผลการทบทวน':
      return `มีร่างผลสินค้า${goods}${date}`;
    case 'ประกาศผลฉบับที่สุด':
    case 'ประกาศผลการทบทวน':
      return `ประกาศผลสินค้า${goods} แล้ว${date}`;
    default:
      return `${label} สินค้า${goods}${date}`;
  }
}

export function currentResult(item: ListedCase): string {
  const step = item.steps.find((entry) => entry.state === 'current') ?? item.steps[0];
  if (!step) return item.status;
  return stageResult(item, stepLabel(step.name), step.state === 'done');
}
