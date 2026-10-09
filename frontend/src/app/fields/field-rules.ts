export type DateLimit = 'any' | 'fromToday' | 'untilToday';

export const prefixes = ['นาย', 'นาง', 'นางสาว'];

export function startOfToday(): Date {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), today.getDate());
}

export function parseThaiDate(value: string): Date | null {
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value.trim());
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]) > 2400 ? Number(match[3]) - 543 : Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
}

export function dateAllowed(date: Date, limit: DateLimit): boolean {
  const today = startOfToday();
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  if (limit === 'fromToday') return day >= today;
  if (limit === 'untilToday') return day <= today;
  return true;
}

export function thaiDateOk(value: string, limit: DateLimit): boolean {
  const date = parseThaiDate(value);
  return !!date && dateAllowed(date, limit);
}

export function emailOk(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

export function phoneOk(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  return /^0(?:2|3|4|5|7)\d{7}$/.test(digits) || /^0[689]\d{8}$/.test(digits);
}

export function thaiIdOk(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  if (!/^\d{13}$/.test(digits)) return false;
  let sum = 0;
  for (let index = 0; index < 12; index += 1) sum += Number(digits[index]) * (13 - index);
  return (11 - (sum % 11)) % 10 === Number(digits[12]);
}

export function fileOk(name: string, required: boolean): boolean {
  const text = name.trim();
  if (!text) return !required;
  return /\.(pdf|png|jpe?g)$/i.test(text);
}

export function prefixOk(value: string): boolean {
  return prefixes.includes(value);
}

export function personNameOk(value: string): boolean {
  const text = value.trim();
  return text.length >= 2 && /[\u0E00-\u0E7Fa-zA-Z]/.test(text);
}

export function textOk(value: string, min: number): boolean {
  return value.trim().length >= min;
}

export function usernameOk(value: string): boolean {
  return /^[A-Za-z0-9]{6,32}$/.test(value.trim());
}

export function passwordOk(value: string): boolean {
  return value.length >= 8 && value.length <= 16 && /[A-Z]/.test(value) && /[a-z]/.test(value) && /\d/.test(value) && /[^A-Za-z0-9]/.test(value);
}

const emptyMessage = 'โปรดกรอกข้อมูลให้ครบถ้วน';

export function fieldMessage(key: string, value: string, password = ''): string {
  const text = value.trim();
  if (!text) {
    if (key === 'cert' || key === 'consent' || key === 'signature') return 'โปรดเลือกไฟล์';
    if (key === 'prefix') return 'โปรดเลือกคำนำหน้า';
    if (key === 'province') return 'โปรดเลือกจังหวัด';
    if (key === 'district') return 'โปรดเลือกอำเภอ/เขต';
    if (key === 'subdistrict') return 'โปรดเลือกตำบล/แขวง';
    if (key === 'postcode') return 'โปรดเลือกรหัสไปรษณีย์';
    return emptyMessage;
  }
  switch (key) {
    case 'email':
      return 'อีเมลไม่ถูกต้อง';
    case 'phone':
      return 'หมายเลขโทรศัพท์ไม่ถูกต้อง';
    case 'regno':
      return 'เลขทะเบียนไม่ถูกต้อง';
    case 'registered':
      return parseThaiDate(text) ? 'เลือกวันที่ตั้งแต่วันนี้เป็นต้นไป' : 'วันที่ไม่ถูกต้อง';
    case 'birth':
      return parseThaiDate(text) ? 'เลือกวันที่ไม่เกินวันนี้' : 'วันที่ไม่ถูกต้อง';
    case 'cert':
    case 'consent':
    case 'signature':
      return 'รองรับเฉพาะไฟล์ PDF, PNG หรือ JPG';
    case 'prefix':
      return 'โปรดเลือกคำนำหน้า';
    case 'name':
      return 'โปรดกรอกชื่อให้ถูกต้อง';
    case 'surname':
      return 'โปรดกรอกนามสกุลให้ถูกต้อง';
    case 'middle':
      return 'โปรดกรอกชื่อกลางให้ถูกต้อง';
    case 'address':
    case 'place':
      return 'โปรดกรอกที่อยู่ให้ถูกต้อง';
    case 'username':
      return 'ชื่อผู้ใช้งานต้องเป็นตัวอักษรภาษาอังกฤษหรือตัวเลข 6-32 ตัว';
    case 'password':
      return 'รหัสผ่านต้องมีความยาว 8-16 ตัวอักษร และประกอบด้วยตัวพิมพ์ใหญ่ ตัวพิมพ์เล็ก ตัวเลข และอักขระพิเศษ';
    case 'confirm':
      return text !== password ? 'รหัสผ่านไม่ตรงกัน' : 'รหัสผ่านต้องมีความยาว 8-16 ตัวอักษร และประกอบด้วยตัวพิมพ์ใหญ่ ตัวพิมพ์เล็ก ตัวเลข และอักขระพิเศษ';
    case 'province':
    case 'district':
    case 'subdistrict':
    case 'postcode':
      return 'ข้อมูลที่อยู่ไม่ตรงกัน';
    default:
      return emptyMessage;
  }
}
