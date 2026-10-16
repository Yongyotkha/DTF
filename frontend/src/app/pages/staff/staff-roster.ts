export type StaffPerson = { name: string; title: string; unit: string; work?: string; lead?: boolean };

export const staffGroups = ['กรมการค้าต่างประเทศ', 'กองปกป้องและตอบโต้ทางการค้า', 'กลุ่มงานไต่สวน', 'กลุ่ม บท.'];

export type WorkGroup = { name: string; detail: string; unit: string; count: number };

/** กลุ่มงานย่อยในกองปกป้อง ตามหน้ามอบหมายของเคสนี้ */
export const workGroups: WorkGroup[] = [
  { name: 'กลุ่มงานมาตรการตอบโต้การทุ่มตลาด (AD)', detail: 'รับผิดชอบการไต่สวนมาตรการทุ่มตลาด', unit: 'กองปกป้องและตอบโต้ทางการค้า', count: 12 },
  { name: 'กลุ่มงานมาตรการตอบโต้การทุ่มตลาดอุดหนุน (CVD)', detail: 'รับผิดชอบการไต่สวนมาตรการอุดหนุน', unit: 'กองปกป้องและตอบโต้ทางการค้า', count: 8 },
  { name: 'กลุ่มงานมาตรการป้องกัน (SG)', detail: 'รับผิดชอบการไต่สวนมาตรการป้องกัน', unit: 'กองปกป้องและตอบโต้ทางการค้า', count: 6 },
  { name: 'กลุ่มงานวิเคราะห์และการกำหนดมาตรการ', detail: 'สนับสนุนการวิเคราะห์ข้อมูลและเสนอแนะ', unit: 'กองปกป้องและตอบโต้ทางการค้า', count: 5 },
];

const adGroup = 'กลุ่มงานมาตรการตอบโต้การทุ่มตลาด (AD)';
const cvdGroup = 'กลุ่มงานมาตรการตอบโต้การทุ่มตลาดอุดหนุน (CVD)';
const sgGroup = 'กลุ่มงานมาตรการป้องกัน (SG)';
const studyGroup = 'กลุ่มงานวิเคราะห์และการกำหนดมาตรการ';

export const staffPeople: StaffPerson[] = [
  { name: 'นางชนินทร หริ่มเจริญ', title: 'รองอธิบดีกรมการค้าต่างประเทศ', unit: 'กรมการค้าต่างประเทศ' },
  { name: 'นางสาวเบญจมาภรณ์ พรมเพิ่ม', title: 'ผู้อำนวยการกองปกป้องและตอบโต้ทางการค้า', unit: 'กองปกป้องและตอบโต้ทางการค้า' },
  { name: 'นางสาวพัชราวรรณ ไทยอาจ', title: 'นักวิชาการพาณิชย์ชำนาญการพิเศษ', unit: 'กองปกป้องและตอบโต้ทางการค้า', work: adGroup, lead: true },
  { name: 'นางสาวจรีณา กิจส่งเสริมกุล', title: 'นักวิชาการพาณิชย์ปฏิบัติการ', unit: 'กองปกป้องและตอบโต้ทางการค้า', work: adGroup },
  { name: 'นางสาววรรณา ตั้งตรง', title: 'นักวิชาการพาณิชย์ปฏิบัติการ', unit: 'กองปกป้องและตอบโต้ทางการค้า', work: adGroup },
  { name: 'นางสาวศศิธร พงษ์พิพัฒน์', title: 'นักวิชาการพาณิชย์ปฏิบัติการ', unit: 'กองปกป้องและตอบโต้ทางการค้า', work: adGroup },
  { name: 'นางสาวณัฐพร สังข์แก้ว', title: 'นักวิชาการพาณิชย์ชำนาญการพิเศษ', unit: 'กองปกป้องและตอบโต้ทางการค้า', work: cvdGroup, lead: true },
  { name: 'นางสาวกุลจิรา ปานทอง', title: 'นักวิชาการพาณิชย์ปฏิบัติการ', unit: 'กองปกป้องและตอบโต้ทางการค้า', work: cvdGroup },
  { name: 'นางสาวมัลลิกา ทองคำ', title: 'นักวิชาการพาณิชย์ปฏิบัติการ', unit: 'กองปกป้องและตอบโต้ทางการค้า', work: cvdGroup },
  { name: 'นายอนุชา ศรีเมือง', title: 'นักวิชาการพาณิชย์ปฏิบัติการ', unit: 'กองปกป้องและตอบโต้ทางการค้า', work: cvdGroup },
  { name: 'นางกนกอร ไทยรัก', title: 'นักวิชาการพาณิชย์ชำนาญการพิเศษ', unit: 'กองปกป้องและตอบโต้ทางการค้า', work: sgGroup, lead: true },
  { name: 'นางสาวอรทัย บุญส่ง', title: 'นักวิชาการพาณิชย์ปฏิบัติการ', unit: 'กองปกป้องและตอบโต้ทางการค้า', work: sgGroup },
  { name: 'นางสาวพิมพ์ใจ สุขเจริญ', title: 'นักวิชาการพาณิชย์ปฏิบัติการ', unit: 'กองปกป้องและตอบโต้ทางการค้า', work: sgGroup },
  { name: 'นายธนพล แก้วกล้า', title: 'นักวิชาการพาณิชย์ปฏิบัติการ', unit: 'กองปกป้องและตอบโต้ทางการค้า', work: sgGroup },
  { name: 'นางสาวปิยาภรณ์ นิลชู', title: 'นักวิชาการพาณิชย์ชำนาญการ', unit: 'กองปกป้องและตอบโต้ทางการค้า', work: studyGroup, lead: true },
  { name: 'นางสาวสุภาพร แสงอรุณ', title: 'นักวิชาการพาณิชย์ปฏิบัติการ', unit: 'กองปกป้องและตอบโต้ทางการค้า', work: studyGroup },
  { name: 'นางสาวชลธิชา วัฒนกิจ', title: 'นักวิชาการพาณิชย์ปฏิบัติการ', unit: 'กองปกป้องและตอบโต้ทางการค้า', work: studyGroup },
  { name: 'นายภูมิพัฒน์ อินทรสุข', title: 'นักวิชาการพาณิชย์ปฏิบัติการ', unit: 'กองปกป้องและตอบโต้ทางการค้า', work: studyGroup },
];

export function groupHead(group: string): string {
  return staffPeople.find((person) => person.work === group && person.lead)?.name ?? '';
}

export function groupMembers(group: string): StaffPerson[] {
  return staffPeople.filter((person) => person.work === group && !person.lead);
}

export function peopleInGroup(group: string): StaffPerson[] {
  return staffPeople.filter((person) => person.unit === group);
}

export function assignmentReachesOfficer(value: { people: string[]; groups: string[] }, assigned: boolean): boolean {
  if (!assigned) return false;
  if (!value.people.length && !value.groups.length) return true;
  if (value.groups.some((group) => group !== 'กรมการค้าต่างประเทศ')) return true;
  return value.people.some((name) => staffPeople.find((person) => person.name === name)?.title.includes('นักวิชาการ'));
}
