import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { DftButton } from '../../button/button';
import { SideNav } from '../../menu-bar/side-nav';
import { DftModal } from '../../modal/modal';
import { StatusTag } from '../../status-tag/status-tag';
import { TopHeader } from '../../top-header/top-header';
import { FilingAiContext, type FilingSnapshot, type GuideAttachment, type GuideField } from '../../ask-ai/filing-context';
import { caseStatusLabel, caseStatusTone, filingOfficer, filingRefId, filingUnit, readApprovalUntil, readCaseStatus, readConsult, readConsultThread, readReviewUntil, readRounds, reviewWaitMs, writeApprovalUntil, writeCaseStatus, writeConsult, writeConsultThread, writeReviewUntil, writeRounds, type CaseStatus, type ConsultNote, type ConsultRequest, type FilingRound, type RoundFile, type RoundFinding } from './case-status';

type TocLink = { id: string; label: string; anchor?: string };
type TocGroup = { label: string; items: TocLink[] };
type HistoryItem = { phase: string; title: string; when: string; detail: string; label: string; tone: 'neutral' | 'info' | 'warning' | 'success' };

type GoodsRow = { producer: string; goods: string; made: string; sold: string; unit: string };
type MakerRow = { name: string; address: string; phone: string; fax: string; web: string; email: string };
type PartyBlock = { key: string; title: string; nameLabel: string; addLabel: string; wrapped: boolean; rows: MakerRow[] };

function emptyParty(): MakerRow {
  return { name: '', address: '', phone: '', fax: '', web: '', email: '' };
}

function party(name: string, address = '', phone = '', fax = ''): MakerRow {
  return { name, address, phone, fax, web: '', email: '' };
}
type DocFile = { name: string; saved: string };
type DocTarget = 'goods' | 'export' | 'margin' | 'subsidy' | 'explain' | 'other' | 'import' | 'factor' | 'summary' | 'trend' | 'intent';

type CostRow = { item: string; amount: string; percent: string };

function emptyCost(): CostRow {
  return { item: '', amount: '', percent: '' };
}

const toc: TocGroup[] = [
  {
    label: 'ส่วนที่ 1 ข้อมูลทั่วไป',
    items: [
      { id: '1', label: '1.1 ผู้ยื่นคำขอ', anchor: 'part-1-1' },
      { id: '1', label: '1.2 ความเกี่ยวข้องกับผู้นำเข้าหรือผู้ส่งออก', anchor: 'part-1-2' },
      { id: '1', label: '1.3 คำขอมาตรการช่วยเหลือ', anchor: 'part-1-3' },
    ],
  },
  {
    label: 'ส่วนที่ 2 รายละเอียดของสินค้า',
    items: [{ id: '2', label: 'เปรียบเทียบสินค้าที่ถูกพิจารณา', anchor: 'part-2' }],
  },
  {
    label: 'ส่วนที่ 3 ข้อมูลเกี่ยวกับผู้ผลิตและ/หรือผู้ส่งออกและผู้นำเข้า',
    items: [
      { id: '3', label: '3.1 ผู้ผลิตสินค้าที่ถูกพิจารณา', anchor: 'part-producers' },
      { id: '3', label: '3.2 ผู้ส่งออกสินค้าที่ถูกพิจารณา', anchor: 'part-exporters' },
      { id: '3', label: '3.3 ผู้นำเข้าสินค้าที่ถูกพิจารณา', anchor: 'part-importers' },
      { id: '3', label: '3.4 สมาคมหรือกลุ่มอุตสาหกรรมผู้ใช้', anchor: 'part-users' },
    ],
  },
  {
    label: 'ส่วนที่ 4 มูลค่าปกติ',
    items: [
      { id: '4', label: '4.1 ราคาจำหน่ายในประเทศผู้ส่งออก', anchor: 'part-4-1' },
      { id: '4', label: '4.2 ราคาส่งออกไปประเทศที่สาม', anchor: 'part-4-2' },
      { id: '4', label: '4.3.1 ต้นทุนในประเทศแหล่งกำเนิด', anchor: 'part-4-3-1' },
      { id: '4', label: '4.3.2 ต้นทุนในประเทศไทย', anchor: 'part-4-3-2' },
      { id: '4', label: '4.4 ตลาดมีลักษณะเฉพาะ', anchor: 'part-4-4' },
      { id: '4', label: '4.5 ประเทศที่ไม่ใช้ระบบกลไกตลาด', anchor: 'part-4-5' },
    ],
  },
  {
    label: 'ส่วนที่ 5 ราคาส่งออก',
    items: [{ id: '5', label: '5.1 ราคาส่งออก', anchor: 'part-5' }],
  },
  {
    label: 'ส่วนที่ 6 ส่วนเหลื่อมการทุ่มตลาด',
    items: [{ id: '6', label: 'เปรียบเทียบมูลค่าปกติและราคาส่งออก', anchor: 'part-6' }],
  },
  {
    label: 'ส่วนที่ 7 การอุดหนุน',
    items: [
      { id: '7.1', label: '7.1 เอกสารเกี่ยวกับโครงการอุดหนุน' },
      { id: '7.2', label: '7.2 อธิบายการอุดหนุน' },
      { id: '7.3', label: '7.3 การอุดหนุนเจาะจง' },
      { id: '7.4', label: '7.4 ประโยชน์ที่ผู้ส่งออกได้รับ' },
    ],
  },
  {
    label: 'ส่วนที่ 8 การประเมินความเสียหายของอุตสาหกรรมภายใน',
    items: [
      { id: '8.1', label: '8.1 ข้อมูลการนำเข้าสินค้าที่ถูกพิจารณา' },
      { id: '8.2', label: '8.2 ผลกระทบด้านราคา' },
      { id: '8.3', label: '8.3 สภาวะของผู้ยื่นคำขอ' },
      { id: '8.4', label: '8.4 ปัจจัยอื่น ๆ' },
      { id: '8.5', label: '8.5 สรุปความเสียหาย' },
      { id: '8.6', label: '8.6 ข้อมูลผู้ซื้อ' },
      { id: '8.7', label: '8.7 ความเสียหายที่อาจเกิดขึ้น' },
      { id: '8.8', label: '8.8 อุปสรรคต่อการก่อตั้งหรือพัฒนา' },
    ],
  },
  {
    label: 'ส่วนที่ 9 คำรับรองและลงนาม',
    items: [{ id: '9', label: 'คำรับรองและลงนาม' }],
  },
  {
    label: 'เอกสารอื่น ๆ ที่แนบประกอบ',
    items: [{ id: 'other', label: 'ภาคผนวก และเอกสารประกอบอื่น' }],
  },
];

@Component({
  selector: 'app-por1-page',
  imports: [TopHeader, SideNav, DftButton, NgTemplateOutlet, StatusTag, DftModal],
  templateUrl: './por1-page.html',
  styleUrl: './por1-page.css',
})
export class Por1Page {
  private readonly guide = inject(FilingAiContext);
  private readonly view = inject(ChangeDetectorRef);
  private guideField = '';
  protected readonly toc = toc;
  protected readonly refId = filingRefId;
  protected section = '1';
  protected anchor = 'part-1-1';
  protected measure = 'dumping';
  protected filing: 'self' | 'all' | 'part' = 'part';
  protected nationality = 'ไทย';
  protected readonly nationalities = ['ไทย'];
  protected readonly countries = ['เวียดนาม', 'อียิปต์'];
  protected company = 'บมจ. สหวิริยาสตีลอินดัสตรี';
  protected address = '28/1 อาคารประภาวิทย์ ชั้น 2-3 ถนนสุรวงศ์ แขวงสีลม เขตบางรัก กรุงเทพฯ 10500';
  protected phone = '(02) 238-3063-82';
  protected fax = '(02) 236-8890, (02) 236-8892';
  protected email = '';
  protected agent = 'นายประกิต กาญจนการไกร';
  protected agentPhone = '';
  protected agentFax = '';
  protected agentEmail = '';
  protected relatedImport = 'ไม่มี';
  protected priorAid = '5 มิถุนายน 2562 อุตสาหกรรมภายในผู้ผลิตเหล็กแผ่นรีดร้อนยื่นแบบคำขอให้กระทรวงพาณิชย์ขยายระยะเวลาการบังคับใช้มาตรการปกป้องการนำเข้าสินค้าเหล็กแผ่นรีดร้อนไม่เจือที่เพิ่มขึ้น และอยู่ในกระบวนการไต่สวน';
  protected outsideProducer = 'บมจ. แอล พี เอ็น เพลทมิล 199/9 หมู่ 4 ถนนสุขสวัสดิ์ ตำบลปากคลองบางปลากด อำเภอพระสมุทรเจดีย์ สมุทรปราการ 10900 โทรศัพท์ 02-815-6400-9 โทรสาร 02-815-6427-29';
  protected goodsDetail = 'เหล็กแผ่นรีดร้อนชนิดม้วนและไม่เป็นม้วน (Flat Hot Rolled Steel) หนา 0.9–100.0 มม. กว้าง 100–3,200 มม. อัตราอากร 0–5% แหล่งกำเนิดและผู้ส่งออกคือเวียดนามและอียิปต์ สินค้าในประเทศเหมือนกัน';
  protected channelDetail = 'จำหน่ายโดยตรงแก่ผู้ใช้และศูนย์บริการเหล็ก (Service Center) และจำหน่ายผ่าน Trading Company ผู้ใช้สุดท้ายคืออุตสาหกรรมท่อเหล็ก ตู้คอนเทนเนอร์ ถังแก๊ส ก่อสร้าง เฟอร์นิเจอร์ และต่อเรือ';
  protected goods: GoodsRow[] = [{ producer: '', goods: '', made: '', sold: '', unit: '' }];
  protected makers: MakerRow[] = [
    party('บมจ. จี สตีล', '88 ปาโซ่ ทาวเวอร์ ชั้น 18 ถนนสีลม แขวงสุริยวงศ์ เขตบางรัก กรุงเทพฯ 10500', '(02) 634-2222', '(02) 634-4114'),
    party('บมจ. จี เจ สตีล', '88 ปาโซ่ ทาวเวอร์ ชั้น 24 ถนนสีลม แขวงสุริยวงศ์ เขตบางรัก กรุงเทพฯ 10500', '(02) 267-8222', '(02) 267-9048'),
    party('บมจ. สหวิริยาเพลทมิลล์', '28/1 อาคารประภาวิทย์ ชั้น 4 ถนนสุรวงศ์ แขวงสีลม เขตบางรัก กรุงเทพฯ 10500', '(02) 630-0257-61', '(02) 630-0267'),
  ];
  protected readonly parties: PartyBlock[] = [
    {
      key: 'producers',
      title: 'รายชื่อผู้ผลิต',
      nameLabel: 'รายชื่อผู้ผลิต',
      addLabel: 'เพิ่มผู้ผลิต',
      wrapped: false,
      rows: [
        party('Formosa Ha Tinh Steel Corporation', 'Crescent Plaza, Unit 2 7F, 105 Ton Dat Tien, Tan Phu Ward, District 7, Ho Chi Minh City', '+84-2854 138 688', '+84-2854 138 689'),
        party('Ezz El Dekheila Steel Company', 'Four Seasons Nile Plaza, 1089 Corniche El-Nil, Garden City, Cairo, Egypt', '+2 (02) 27989800', '+2 (02) 27931954'),
      ],
    },
    { key: 'exporters', title: 'รายชื่อผู้ส่งออก', nameLabel: 'รายชื่อผู้ส่งออก', addLabel: 'เพิ่มผู้ส่งออก', wrapped: false, rows: [party('ไม่มี')] },
    {
      key: 'importers',
      title: 'รายชื่อผู้นำเข้า',
      nameLabel: 'รายชื่อผู้นำเข้า',
      addLabel: 'เพิ่มผู้นำเข้า',
      wrapped: false,
      rows: [
        party('บมจ. ค้าเหล็กไทย', '179 บางกอกซิตี้ ทาวเวอร์ ชั้น 22 ถนนสาทรใต้ แขวงทุ่งมหาเมฆ เขตสาทร กรุงเทพฯ', '02-6854000'),
        party('บจก. สตาร์คอร์', '78 ถนนนราธิวาสราชนครินทร์ แขวงสีลม เขตบางรัก กรุงเทพฯ', '02-2353309'),
        party('บจก. ซี.เอ็น. สตีล อิมปอร์ต', '109 หมู่ 5 ตำบลกระทุ่มล้ม อำเภอสามพราน จังหวัดนครปฐม', '02-8130690-2'),
        party('บจก. เพนต้า ทิก อินดัสทรีส์ (ไทยแลนด์)', '86/1 หมู่ 3 ตำบลแสนภูดาษ อำเภอบ้านโพธิ์ จังหวัดฉะเชิงเทรา', '038-577624'),
        party('บมจ. แปซิฟิกไพพ์', '298, 298/2 หมู่ 1 ซอยกลับเจริญ ถนนสุขสวัสดิ์ ตำบลปากคลองบางปลากด อำเภอพระสมุทรเจดีย์ จังหวัดสมุทรปราการ', '02-6799000'),
        party('บจก. ศุภกิจ โปรดักส์', '601 หมู่ 2 ถนนสุขุมวิท ตำบลบางปูใหม่ อำเภอเมือง จังหวัดสมุทรปราการ', '02-3230924'),
        party('บจก. บลูสโคป สตีล (ประเทศไทย)', '2 ซอยจี 9 ถนนปกรณ์สงเคราะห์ราษฎร์ ตำบลมาบตาพุด อำเภอเมือง จังหวัดระยอง', '038-918300'),
        party('บจก. เหล็กสยามพาณิชย์', '68/45 หมู่ 8 ถนนบางขุนเทียน-ชายทะเล แขวงท่าข้าม เขตบางขุนเทียน กรุงเทพฯ', '02-8973731'),
        party('บมจ. เหล็กแผ่นรีดเย็นไทย', '28/1 อาคารประภาวิทย์ ชั้น 5 ถนนสุรวงศ์ แขวงสีลม เขตบางรัก กรุงเทพฯ', '02-6300300'),
        party('บมจ. สหไทยสตีลไพพ์', '78 หมู่ 3 ถนนปู่เจ้าสมิงพราย ตำบลบางหญ้าแพรก อำเภอพระประแดง จังหวัดสมุทรปราการ', '02-3859023'),
        party('บจก. ไทยพรีเมียมไพพ์', '45 หมู่ 2 ตำบลชัยมงคล อำเภอเมือง จังหวัดสมุทรปราการ', '034-8454438'),
        party('บจก. เอทีที เมทอล', '8/88 ซอยพหลโยธิน 54/1 แยก 6-6 แขวงคลองถนน เขตสายไหม กรุงเทพฯ', '02-0071188'),
        party('บจก. นิปปอน สตีล แอนด์ ซูมิคิน กัลวาไนซิง (ประเทศไทย)', '12 ซอยจี 2 ถนนปกรณ์สงเคราะห์ราษฎร์ ตำบลมาบตาพุด อำเภอเมือง จังหวัดระยอง', '038-687079-80'),
        party('บจก. โอเชียนไพพ์', '299 หมู่ 10 ถนนเศรษฐกิจ ตำบลคลองมะเดื่อ อำเภอกระทุ่มแบน จังหวัดสมุทรสาคร', '034-877261'),
        party('บมจ. เพิ่มสินสตีลเวิคส์', '4, 95-96 หมู่ 6 ถนนพระราม 2 ตำบลโคกขาม อำเภอเมือง จังหวัดสมุทรสาคร', '034-825090'),
        party('บจก. ตะวันออกรุ่งเรือง', '638 ซอยสุขสวัสดิ์ 35 ถนนสุขสวัสดิ์ แขวงราษฎร์บูรณะ เขตราษฎร์บูรณะ กรุงเทพฯ', '02-4630029'),
        party('บจก. มิตรสตีล', '1/6 หมู่ 11 ตำบลบางโฉลง อำเภอบางพลี จังหวัดสมุทรปราการ', '02-3372594-5'),
        party('บจก. ทีเอ็นที เอ็กซเพรส เวิลด์ไวด์ (ประเทศไทย)', '1768 ไทยซัมมิท ทาวเวอร์ ถนนเพชรบุรีตัดใหม่ แขวงบางกะปิ เขตห้วยขวาง กรุงเทพฯ', '02-257655'),
        party('บจก. ดานีลี', '64/210 หมู่ 4 ตำบลปลวกแดง อำเภอปลวกแดง จังหวัดระยอง', '038-955888'),
        party('บจก. ซัมซุง ซี แอนด์ ที (ประเทศไทย)', '193/90 เลครัชดา ชั้น 21 ถนนรัชดาภิเษก แขวงคลองเตย เขตคลองเตย กรุงเทพฯ', '02-5475994'),
        party('บจก. โมโน่สตีล เทรด', '99/766 หมู่ 4 แขวงบางพลีใหญ่ เขตบางพลี', '084-3143798'),
        party('บจก. ทวีโชค พาณิช', '55/5, 55/55 หมู่ 2 ซอยวัดหนามแดง ถนนศรีนครินทร์ ตำบลบางแก้ว อำเภอบางพลี จังหวัดสมุทรปราการ'),
      ],
    },
    {
      key: 'users',
      title: 'รายชื่อสมาคมหรือกลุ่มอุตสาหกรรมผู้ใช้',
      nameLabel: 'รายชื่อสมาคม/กลุ่มอุตสาหกรรมผู้ใช้',
      addLabel: 'เพิ่มกลุ่ม',
      wrapped: true,
      rows: [
        party('กลุ่มอุตสาหกรรมเหล็ก สภาอุตสาหกรรมแห่งประเทศไทย', 'ชั้น 8 อาคารปฏิบัติการเทคโนโลยีเชิงสร้างสรรค์ เลขที่ 2 ถนนนางลิ้นจี่ แขวงทุ่งมหาเมฆ เขตสาทร กรุงเทพฯ 10120', '02-345-1000', '02-345-1295-9'),
        party('สมาคมเหล็กแผ่นรีดร้อนไทย', '28/1 อาคารประภาวิทย์ ชั้น 3 ถนนสุรวงศ์ แขวงสีลม เขตบางรัก กรุงเทพฯ 10500', '02-238-3063', '02-236-8892'),
        party('สมาคมผู้ผลิตท่อโลหะและแปรรูปเหล็กแผ่น', 'อาคารสำนักพัฒนาอุตสาหกรรมรายสาขา ชั้น 1 ซอยตรีมิตร ถนนพระราม 4 แขวงพระโขนง เขตคลองเตย กรุงเทพฯ 10110', '02-712-1179', '02-712-1179'),
        party('สมาคมอุตสาหกรรมยานยนต์ไทย', 'อาคารปฏิบัติการเทคโนโลยีเชิงสร้างสรรค์ ถนนนางลิ้นจี่ แขวงทุ่งมหาเมฆ เขตสาทร กรุงเทพฯ', '02-712-1179', '02-712-1179'),
        party('สมาคมต่อเรือและซ่อมเรือไทย', 'ถนนพระราม 2 แขวงบางมด เขตจอมทอง กรุงเทพฯ', '02-452-1266, 02-840-2110', '02-452-1267'),
      ],
    },
  ];
  protected readonly files: Record<string, string> = {
    volume: 'AD VN-EG_Table 8.4-ALL_rev.01_15.05.20.xlsx',
    unitCost: 'AD VN-EG_Table 8.3-ALL rev.01_15.05.20.xlsx',
  };
  protected groups: Record<string, string[]> = {
    cert: [
      'SSI หนังสือรับรอง.pdf',
      'G steel หนังสือรับรอง.pdf',
      'GJ หนังสือรับรอง.pdf',
      'SPM หนังสือรับรอง.pdf',
    ],
    finance: [
      'SSI-2562.pdf',
      'SSI-2561.pdf',
      'SSI-2560.pdf',
      'SSI-2559.pdf',
      'SSI-2558.pdf',
      'GST-FS2019.pdf',
      'GST-FS2018.pdf',
      'GST-FS2017.pdf',
      'GST-FS2016.pdf',
      'GST-FS2015.pdf',
      'GJS-2562.pdf',
      'GJS-2561.pdf',
      'GJS-2560.pdf',
      'GJS-2559.pdf',
      'GJS-2558.pdf',
      'SPM FS 2562.pdf',
      'SPM FS 2561.pdf',
      'SPM FS 2560.pdf',
      'SPM FS 2559.pdf',
      'SPM FS 2558.pdf',
    ],
    power: [
      'SSI มอบบุคคลธรรมดา.pdf',
      'G steel มอบบุคคลธรรมดา.pdf',
      'G steel มอบนิติบุคคล.pdf',
      'G Steel มอบอำนาจช่วง.pdf',
      'GJ มอบบุคคลธรรมดา.pdf',
      'GJ มอบนิติบุคคล.pdf',
      'SPM มอบบุคลลธรรมดา.pdf',
      'SPM มอบนิติบุคคล.pdf',
    ],
    otherDoc: [
      'สิ่งที่ส่งมาด้วย 7 ราคาจำหน่ายในประเทศเวียดนาม เม.ย. 62.pdf',
      'สิ่งที่ส่งมาด้วย 8 ราคาจำหน่ายในประเทศอียิปต์ เม.ย. 62.pdf',
    ],
  };
  protected readonly filedOn = '15/05/2562';
  protected docKey = 'cert';
  protected readonly supportDocs: { key: string; label: string; accept: string; hint: string; behalf: boolean }[] = [
    { key: 'cert', label: 'หนังสือรับรองบริษัท', accept: '.png,.jpg,.jpeg,.pdf', hint: 'เฉพาะนามสกุล png, jpg, jpeg, pdf', behalf: false },
    { key: 'finance', label: 'งบการเงินที่ผู้สอบบัญชีรับอนุญาตรับรอง', accept: '.png,.jpg,.jpeg,.pdf,.doc,.docx', hint: 'เฉพาะนามสกุล png, jpg, jpeg, pdf, doc, docx', behalf: false },
    { key: 'power', label: 'หนังสือมอบอำนาจ', accept: '.png,.jpg,.jpeg,.pdf,.doc,.docx', hint: 'เฉพาะนามสกุล png, jpg, jpeg, pdf, doc, docx', behalf: true },
    { key: 'volume', label: 'รายการและปริมาณสินค้าที่ผลิตและ/หรือจำหน่ายของผู้ผลิตทุกราย', accept: '.png,.jpg,.jpeg,.pdf,.doc,.docx', hint: 'เฉพาะนามสกุล png, jpg, jpeg, pdf, doc, docx', behalf: true },
  ];
  protected editingKey = '';
  protected exampleOpen = false;
  protected market = 'yes';
  protected trade = 'other';
  protected special = 'no';
  protected method = '';
  protected exportCountry = 'เวียดนาม';
  protected compareCountry = 'ไทย';
  protected currency = 'บาท';
  protected factoryNote = 'เวียดนาม CFR 566 ดอลลาร์/ตัน หักค่าเรือ 200 บาท ได้หน้าโรงงาน 17,514 บาท/ตัน อียิปต์ 601 ดอลลาร์ เป็น 19,418 บาท/ตัน อัตรา 31.8596 บาทต่อดอลลาร์ เม.ย. 2562';
  protected thirdReason = 'ไม่มี';
  protected originDetail = 'ไม่มี';
  protected thaiDetail = 'ไม่มี';
  protected specialDetail = 'ไม่มี';
  protected compareReason = 'ไม่มี ประเทศผู้ส่งออกใช้ระบบเศรษฐกิจแบบกลไกตลาด จึงไม่ใช้ข้อ 4.5';
  protected originPeriod = 'ไม่มี';
  protected thaiPeriod = 'ไม่มี';
  protected originCosts: CostRow[] = [{ item: 'ไม่มี', amount: '-', percent: '-' }];
  protected thaiCosts: CostRow[] = [{ item: 'ไม่มี', amount: '-', percent: '-' }];
  protected docs: DocFile[] = [
    { name: 'สิ่งที่ส่งมาด้วย 1 พิกัดอัตราศุลกากรสินค้าที่ถูกพิจารณา.pdf', saved: '15/05/2562' },
    { name: 'สิ่งที่ส่งมาด้วย 2.1 พระราชกำหนดพิกัดอัตราศุลกากร.pdf', saved: '15/05/2562' },
    { name: 'สิ่งที่ส่งมาด้วย 2.2 ประกาศลดอัตราอากร ม.12.pdf', saved: '15/05/2562' },
    { name: 'สิ่งที่ส่งมาด้วย 2.3 ประกาศลดอัตราอากร ASEAN FTA.pdf', saved: '15/05/2562' },
    { name: 'สิ่งที่สงมาด้วย 4 มาตรฐานและชั้นคุณภาพ.pdf', saved: '15/05/2562' },
    { name: 'สิ่งที่ส่งมาด้วย 5 กระบวนการผลิต rev.01.pdf', saved: '15/05/2562' },
    { name: 'แผนภาพกระบวนการผลิต.pdf', saved: '15/05/2562' },
  ];
  protected exportDetail = 'เวียดนามหน้าโรงงาน 16,761 บาท/ตัน CIF 17,238 ส่วนเหลื่อม 753 บาท (4.36%) อียิปต์หน้าโรงงาน 17,349 CIF 19,026 ส่วนเหลื่อม 2,069 บาท (10.87%) เม.ย. 2562';
  protected exportDocs: DocFile[] = [
    { name: 'สิ่งที่ส่งมาด้วย 9 สถิตินำเข้าเดือนเมษายน 2562.pdf', saved: '15/05/2562' },
    { name: 'สิ่งที่ส่งมาด้วย 9 สถิตินำเข้าเดือนเมษายน 2562 เวียดนาม.pdf', saved: '15/05/2562' },
    { name: 'สิ่งที่ส่งมาด้วย 9 สถิตินำเข้าเดือนเมษายน 2562 อียิปต์.pdf', saved: '15/05/2562' },
    { name: 'สิ่งที่ส่งมาด้วย 11 ค่าขนส่งทางเรือระหว่างประเทศ.pdf', saved: '15/05/2562' },
    { name: 'สิ่งที่ส่งมาด้วย 12 ค่าขนส่งในประเทศ บางสะพาน-กรุงเทพฯ.pdf', saved: '15/05/2562' },
    { name: 'สิ่งที่ส่งมาด้วย 13 ค่าประกันภัยการเดินเรือ.pdf', saved: '15/05/2562' },
  ];
  protected marginDocs: DocFile[] = [{ name: 'สิ่งที่ส่งมาด้วย 10 อัตราแลกเปลี่ยนรายเดือน 2562.pdf', saved: '15/05/2562' }];
  protected subsidyDocs: DocFile[] = [];
  protected explainDetail = 'ไม่มีข้อมูลการอุดหนุน เคสนี้ขอให้ไต่สวนการทุ่มตลาด';
  protected explainDocs: DocFile[] = [];
  protected docView: 'letter' | 'pledge' | null = null;
  protected signatureName = 'ลายเซ็น.png';
  protected signatureUrl =
    'data:image/svg+xml,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="180" height="72" viewBox="0 0 180 72"><path d="M12 46c16-30 22 6 34-2 10-6 4 20 16 14 14-8 2-28 18-22 18 6 6 26 22 14 12-8 8 10 20 4 14-8 22 2 36-12" fill="none" stroke="#0E2346" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    );
  protected letterNo = '01/492-019/2562';
  protected letterDate = '15/05/2562';
  protected letterSubject = 'ขอให้พิจารณาดำเนินการใช้มาตรการตอบโต้การทุ่มตลาดสินค้าเหล็กแผ่นรีดร้อน ชนิดเป็นม้วนและไม่เป็นม้วน ที่มีแหล่งกำเนิดจากสาธารณรัฐสังคมนิยมเวียดนามและสาธารณรัฐอาหรับอียิปต์';
  protected letterTo = 'อธิบดีกรมการค้าต่างประเทศ';
  protected letterRef = '-';
  protected letterEnclosed = 'แบบ ปร.1 แบบคำขอให้ดำเนินการพิจารณาตอบโต้การทุ่มตลาดหรือการอุดหนุน จำนวน 1 ฉบับ';
  protected letterBody = 'บริษัท สหวิริยาสตีลอินดัสตรี จำกัด (มหาชน) ในฐานะผู้ผลิตภายในประเทศ และผู้ยื่นคำขอแทนผู้ผลิตบางส่วนในอุตสาหกรรม สินค้าเหล็กแผ่นรีดร้อน ชนิดเป็นม้วนและไม่เป็นม้วน จึงขอนำส่งแบบคำขอพร้อมเอกสารประกอบต่อกรมการค้าต่างประเทศไว้เป็นหลักฐานในการพิจารณาใช้มาตรการตอบโต้การทุ่มตลาด';
  protected letterPurpose = 'ขอให้พิจารณาใช้มาตรการตอบโต้การทุ่มตลาดสินค้าเหล็กแผ่นรีดร้อนจากเวียดนามและอียิปต์';
  protected sealName = '';
  protected sealUrl = '';
  protected letterFileName = '';
  protected readonly pledgeDefault = 'ข้าพเจ้าขอรับรองว่า ข้อความข้างต้นนี้ตลอดจนข้อความในเอกสารผนวกที่แนบและเอกสารหลักฐานที่นำมาประกอบคำขอฉบับนี้เป็นความจริงและถูกต้องทุกประการ และหากข้อมูลและเอกสารหลักฐานที่ปรากฏในคำขอฉบับนี้เป็นข้อมูลเท็จ ข้าพเจ้าขอรับผิดตามกฎหมายแต่เพียงผู้เดียวและขอรับรองว่าข้าพเจ้าได้รับมอบหมายให้ดำเนินการแทนผู้ร้องเรียนรายอื่นดังกล่าวในฐานะผู้ยื่นคำขอ';
  protected pledgeText = this.pledgeDefault;
  protected pledgeSource: 'default' | 'draft' = 'default';
  protected otherDocs: DocFile[] = [
    { name: 'ภาคผนวก ก.pdf', saved: '15/05/2562' },
    { name: 'เอกสารผนวก ข-2 (LPN).pdf', saved: '15/05/2562' },
    { name: 'สิ่งที่ส่งมาด้วย 6 รายชื่อผู้นำเข้า.pdf', saved: '15/05/2562' },
  ];
  protected readonly conditions = [
    { key: 'sales', label: 'ยอดจำหน่ายภายในประเทศ' },
    { key: 'priceFactors', label: 'ปัจจัยที่มีผลกระทบต่อราคา' },
    { key: 'profit', label: 'กำไร (ขาดทุน) จากการขายในประเทศ' },
    { key: 'output', label: 'ผลผลิต' },
    { key: 'share', label: 'ส่วนแบ่งตลาด' },
    { key: 'productivity', label: 'ผลิตภาพ' },
    { key: 'capacity', label: 'กำลังการผลิตและอัตราการใช้กำลังการผลิต' },
    { key: 'stock', label: 'สินค้าคงคลัง' },
    { key: 'employment', label: 'การจ้างงาน' },
    { key: 'wages', label: 'ค่าจ้างแรงงาน' },
    { key: 'growth', label: 'อัตราการเจริญเติบโต' },
    { key: 'return', label: 'ผลตอบแทนจากการลงทุน' },
    { key: 'cash', label: 'กระแสเงินสด' },
    { key: 'funding', label: 'ความสามารถในการระดมทุนหรือการลงทุน' },
    { key: 'marginSize', label: 'ความมากน้อยของส่วนเหลื่อมการทุ่มตลาด' },
    { key: 'otherIndex', label: 'ปัจจัยและดัชนีทางเศรษฐกิจอื่น ๆ นอกจากที่ระบุมาข้างต้น' },
  ];
  protected sheets: Record<'import' | 'factor' | 'summary' | 'trend' | 'intent', DocFile[]> = {
    import: [{ name: 'AD VN-EG_Table 8.1, 8.2, 8.7-ALL rev.01_15.05.20.xlsx', saved: '15/05/2562' }],
    factor: [
      { name: 'AD VN-EG_Table 8.4-ALL_rev.01_15.05.20.xlsx', saved: '15/05/2562' },
      { name: 'สิ่งที่ส่งมาด้วย 14 SEAISI Pro.-Cap..pdf', saved: '15/05/2562' },
    ],
    summary: [{ name: 'AD VN-EG_Table 8.5-ALL_rev.01_15.05.20.xlsx', saved: '15/05/2562' }],
    trend: [{ name: 'AD VN-EG_Table 8.8-ALL rev.01_15.05.20.xlsx', saved: '15/05/2562' }],
    intent: [{ name: 'AD VN-EG_Table 8.6-ALL_rev.01_15.05.20.xlsx', saved: '15/05/2562' }],
  };
  protected notes: Record<string, string> = {
    importDetail: 'ปี 2562 นำเข้าจากเวียดนามและอียิปต์ 115,737 ตัน จาก 17,257 ตันในปี 2561 เพิ่มร้อยละ 571',
    priceEffect: 'เวียดนามตัดราคาปี 2559–2562 ที่ 991, 2,627, 448 และ 2,440 บาท/ตัน ปี 2562 สูงถึงร้อยละ 13 อียิปต์ตัดราคาปี 2559–2560 ที่ 1,701 และ 328 บาท/ตัน',
    costEffect: 'ขายต่ำกว่าต้นทุนตั้งแต่ปี 2559 ปี 2562 ต่ำกว่าต้นทุน 2,357 บาท/ตัน ใกล้เคียงการตัดราคาของเวียดนามที่ 2,440 บาท/ตัน',
    sales: 'ปริมาณขายในประเทศลดจาก 2.74 ล้านตันในปี 2561 เหลือ 2.12 ล้านตันในปี 2562 ลดลง 0.623 ล้านตัน',
    priceFactors: 'สินค้านำเข้าตัดราคาและกดราคา ทำให้ราคาขายในประเทศต่ำกว่าต้นทุนตั้งแต่ปี 2559',
    profit: 'อุตสาหกรรมภายในขาดทุนต่อเนื่องตั้งแต่ปี 2558 เพราะขายต่ำกว่าต้นทุน',
    output: 'ปริมาณผลิตปี 2562 เท่ากับ 2.242 ล้านตัน ลดลง 0.752 ล้านตันจากปี 2561',
    share: 'ปี 2560–2561 ส่วนแบ่งตลาดร้อยละ 80.68 และ 84.58 ปี 2562 เหลือร้อยละ 72.68 ลดลงร้อยละ 12.16',
    productivity: 'ประสิทธิภาพการผลิตสูง แต่อัตราการใช้กำลังการผลิตต่ำกว่าร้อยละ 50 จึงไม่เกิดการประหยัดต่อขนาด',
    capacity: 'กำลังการผลิต 7.95 ล้านตันทุกปี อัตราการใช้ปี 2562 ประมาณร้อยละ 29',
    stock: 'สินค้าคงคลังสิ้นปี 2558–2562 เท่ากับ 94,629, 136,640, 177,878, 166,248 และ 126,290 ตัน',
    employment: 'การนำเข้าทำให้ต้องหยุดผลิตเป็นระยะ ลดจำนวนแรงงานและชั่วโมงการผลิตเพื่อลดต้นทุน',
    wages: 'มูลค่าจ้างงานปี 2558–2562 เท่ากับ 556.99, 649.91, 701.08, 759.66 และ 730.43 ล้านบาท',
    growth: 'ปริมาณจำหน่ายและส่วนแบ่งตลาดลดลงในปี 2562 หลังจากเพิ่มขึ้นในช่วงปี 2558–2561',
    return: 'ผลตอบแทนจากการลงทุนติดลบ เพราะขาดทุนต่อเนื่องตั้งแต่ปี 2558',
    cash: 'ขาดทุนต่อเนื่องจนกระทบสภาพคล่อง และการลงทุนของอุตสาหกรรมภายใน',
    funding: 'ความเสียหายด้านราคาทำให้ระดมทุนหรือลงทุนเพิ่มได้ยากขึ้น',
    marginSize: 'ส่วนเหลื่อมการทุ่มตลาดเวียดนาม 4.36% และอียิปต์ 10.87%',
    otherIndex: 'ปัจจัยอื่นไม่ได้ก่อให้เกิดความเสียหาย การบริโภคและเทคโนโลยีของสินค้าอุตสาหกรรมเปลี่ยนอย่างช้า',
    factorDetail: 'การนำเข้าสินค้าที่ถูกพิจารณาเป็นปัจจัยหลักของความเสียหาย ปัจจัยอื่นไม่ได้ก่อให้เกิดความเสียหาย',
    summaryDetail: 'ความเสียหายอยู่ที่การผลิตที่อัตราใช้กำลังการผลิตต่ำกว่าร้อยละ 50 การจำหน่ายที่ต่ำกว่าต้นทุน ราคาที่ถูกตัดและกด และการจ้างงาน',
    buyerDetail: 'ไม่มีข้อมูลรายชื่อผู้ซื้อที่สูญเสียยอดขาย และไม่มีหลักฐานการลดราคาเพื่อรักษาตลาด',
    trendCapacity: 'กำลังการผลิตต่างประเทศยังพร้อมส่งออกหากความต้องการในไทยฟื้น',
    trendPrice: 'สินค้านำเข้ากดราคาและทำให้ขึ้นราคาตามต้นทุนไม่ได้',
    trendSubsidy: 'ไม่มี เคสนี้ขอให้ไต่สวนการทุ่มตลาด',
    trendOther: 'หากไม่ดำเนินมาตรการ อุตสาหกรรมภายในอาจถึงขั้นหยุดกิจการ',
    intentDetail: 'ไม่มีข้อมูล',
  };
  protected submitOpen = false;
  protected historyOpen = false;
  protected historyFull = false;
  protected historyTab: 'activity' | 'version' = 'activity';
  protected notice: 'draft' | 'submitted' | null = null;
  protected submitting = false;
  private submitTimer = 0;
  private reviewTimer = 0;
  protected reviewLeft = 60;
  protected approvalLeft = 60;
  protected consultOpen = false;
  protected readonly officerName = filingOfficer;
  protected readonly officerUnit = filingUnit;
  protected officialOpen = false;
  protected consult: ConsultRequest | null = readConsult();
  protected consultTopic = 'ขอพบเจ้าหน้าที่เพื่อปรึกษาการแก้ไขคำขอ';
  protected consultDetail = 'รายการที่ยังไม่ผ่านมีหลักฐานราคา ตัวชี้วัดความเสียหาย และรายชื่อผู้ผลิตในประเทศ ต้องการให้นัดหมายเพื่อชี้แจงก่อนส่งแบบคำร้องทางการ';
  protected consultWhen = '16/05/2562 10:00';
  protected consultNotes: ConsultNote[] = readConsultThread();
  protected consultDraft = '';
  protected pendingFiles: { name: string; image?: string }[] = [];
  protected caseStatus: CaseStatus = readCaseStatus();
  protected viewingForm = false;
  protected revising = false;
  protected openedRound: FilingRound | null = null;
  protected rounds: FilingRound[] = readRounds();
  private readonly revisionFindings: RoundFinding[] = [
    { place: 'ส่วนที่ 2 รายละเอียดสินค้า', title: 'เอกสารเปรียบเทียบสินค้ายังไม่ครบ', detail: 'รายการเอกสารที่ใช้เปรียบเทียบสินค้ายังไม่ครบตามที่แบบเรียก ให้แนบไฟล์เพิ่มในรอบถัดไป', action: 'เพิ่มเอกสาร' },
    { place: 'ส่วนที่ 5 ปริมาณและมูลค่า', title: 'ข้อมูลปริมาณยังไม่สอดคล้องกับเอกสารประกอบ', detail: 'ตัวเลขปริมาณในแบบยังไม่ตรงกับไฟล์ที่แนบไว้ ให้ปรับข้อมูลในแบบให้ตรงกับเอกสาร', action: 'ปรับข้อมูล' },
    { place: 'ส่วนที่ 1 เอกสารมอบอำนาจ', title: 'หนังสือมอบอำนาจยังแนบไม่ครบ', detail: 'กรณียื่นแทนผู้ผลิต ต้องแนบหนังสือมอบอำนาจให้ครบก่อนยื่นรอบถัดไป', action: 'เพิ่มเอกสาร' },
  ];
  private readonly secondFindings: RoundFinding[] = [
    { place: 'ส่วนที่ 4 ราคา', title: 'หลักฐานราคาส่งออกยังไม่ครอบคลุมช่วงเวลา', detail: 'เอกสารราคาที่แนบยังไม่ครอบคลุมช่วงที่ขอให้ไต่สวน ให้เพิ่มหลักฐานราคาหรือปรับช่วงข้อมูล', action: 'เพิ่มเอกสาร' },
    { place: 'ส่วนที่ 6 ความเสียหาย', title: 'ตัวชี้วัดความเสียหายยังไม่สอดคล้องกับปริมาณนำเข้า', detail: 'ข้อมูลความเสียหายในแบบยังอธิบายไม่ครบว่าเชื่อมกับปริมาณนำเข้าอย่างไร', action: 'ปรับข้อมูล' },
    { place: 'ส่วนที่ 3 ผู้ผลิตในประเทศ', title: 'รายชื่อผู้ผลิตที่ร่วมยื่นยังไม่ครบ', detail: 'สัดส่วนผู้ผลิตในประเทศที่ร่วมยื่นยังขาดเอกสารยืนยัน', action: 'เพิ่มเอกสาร' },
  ];
  private readonly router = inject(Router);
  protected ack = true;
  protected signer = 'นายประกิต กาญจนการไกร';
  protected roleTitle = 'ผู้จัดการสำนักรัฐกิจสัมพันธ์ ผู้รับมอบอำนาจ';
  protected signedOn = '15/05/2562';

  protected closeHistory(): void {
    this.historyOpen = false;
    this.historyFull = false;
  }

  protected get historyItems(): HistoryItem[] {
    return this.historyTab === 'activity' ? this.historyActivity : this.historyVersions;
  }

  private readonly historyActivity: HistoryItem[] = [
    { phase: 'การจัดทำคำขอ', title: 'สร้างคำขอ', when: '15/05/2562 · 09:30 น.', detail: 'ผู้ยื่นสร้างคำขอและเริ่มกรอกข้อมูล', label: 'ร่าง', tone: 'neutral' },
    { phase: 'การจัดทำคำขอ', title: 'บันทึกข้อมูล', when: '15/05/2562 · 10:15 น.', detail: 'ปรับปรุงข้อมูลผู้ยื่นและรายละเอียดสินค้า', label: 'ร่าง', tone: 'neutral' },
    { phase: 'การจัดทำคำขอ', title: 'แนบเอกสาร', when: '15/05/2562 · 11:00 น.', detail: 'แนบเอกสารประกอบคำขอ', label: 'ร่าง', tone: 'neutral' },
    { phase: 'การจัดทำคำขอ', title: 'ยื่นครั้งแรก', when: '15/05/2562 · 16:00 น.', detail: 'นำส่งแบบ ปร.1 พร้อมหนังสือนำส่ง', label: 'ยื่นแล้ว', tone: 'info' },
    { phase: 'รอบแก้ไขแบบคำขอ', title: 'แก้ไขครั้งที่ 1', when: '22/07/2562', detail: 'ส่งแบบคำขอที่แก้ไขรอบที่ 1', label: 'แก้ไข', tone: 'warning' },
    { phase: 'รอบแก้ไขแบบคำขอ', title: 'แก้ไขครั้งที่ 2', when: '28/08/2562', detail: 'ส่งแบบคำขอที่แก้ไขรอบที่ 2', label: 'แก้ไข', tone: 'warning' },
    { phase: 'รอบแก้ไขแบบคำขอ', title: 'แก้ไขครั้งที่ 3', when: '09/10/2562', detail: 'ส่งแบบคำขอที่แก้ไขรอบที่ 3', label: 'แก้ไข', tone: 'warning' },
    { phase: 'รอบแก้ไขแบบคำขอ', title: 'แก้ไขครั้งที่ 4', when: '16/10/2562', detail: 'ส่งแบบคำขอที่แก้ไขรอบที่ 4', label: 'แก้ไข', tone: 'warning' },
    { phase: 'รอบแก้ไขแบบคำขอ', title: 'ส่งเอกสารเพิ่ม', when: '22/10/2562', detail: 'ส่งเอกสารเพิ่มเติมทางไปรษณีย์อิเล็กทรอนิกส์', label: 'แก้ไข', tone: 'warning' },
    { phase: 'รอบแก้ไขแบบคำขอ', title: 'ฉบับไม่เปิดเผย', when: '05/12/2562', detail: 'จัดทำคำขอฉบับไม่เปิดเผย แยกจากฉบับที่เปิดเผย', label: 'แก้ไข', tone: 'warning' },
    { phase: 'เอกสารที่ยื่นเพิ่ม', title: 'ฉบับเปิดเผย', when: '12/12/2562', detail: 'แบบคำขอฉบับที่เปิดเผยได้', label: 'ยื่นแล้ว', tone: 'info' },
    { phase: 'เอกสารที่ยื่นเพิ่ม', title: 'ไฟล์จากแผ่นบันทึก', when: '16/10/2562', detail: 'ไฟล์ประกอบที่ส่งมาพร้อมรอบแก้ไข', label: 'ยื่นแล้ว', tone: 'info' },
    { phase: 'เอกสารที่ยื่นเพิ่ม', title: 'ไฟล์จากแผ่นบันทึก รอบถัดไป', when: '27/11/2562', detail: 'ไฟล์ประกอบอีกชุดหลังรอบแก้ไข', label: 'ยื่นแล้ว', tone: 'info' },
    { phase: 'เปิดไต่สวน', title: 'วาระเปิดไต่สวน', when: '20/01/2563', detail: 'จัดวาระพิจารณาเปิดไต่สวน', label: 'ดำเนินการ', tone: 'info' },
    { phase: 'เปิดไต่สวน', title: 'ความเห็นต่อการเปิดไต่สวน', when: '10/02/2563', detail: 'ความเห็นประกอบการพิจารณาเปิดไต่สวน', label: 'ดำเนินการ', tone: 'info' },
    { phase: 'แบบสอบถาม', title: 'จัดส่งแบบสอบถาม', when: '03/03/2563', detail: 'ส่งแบบสอบถามให้ผู้มีส่วนได้เสีย', label: 'ดำเนินการ', tone: 'info' },
    { phase: 'แบบสอบถาม', title: 'รับคำตอบแบบสอบถาม', when: '28/04/2563', detail: 'รับคำตอบแบบสอบถามกลับเข้าเคส', label: 'ดำเนินการ', tone: 'info' },
    { phase: 'ตรวจสอบข้อเท็จจริง', title: 'เอกสารตรวจสอบข้อเท็จจริง', when: '15/06/2563', detail: 'ชุดเอกสารที่ใช้ตรวจสอบข้อเท็จจริง', label: 'ดำเนินการ', tone: 'info' },
    { phase: 'ผลการพิจารณา', title: 'ร่างผลขั้นที่สุด', when: '20/08/2563', detail: 'ร่างผลการพิจารณาขั้นที่สุด', label: 'ดำเนินการ', tone: 'info' },
    { phase: 'ผลการพิจารณา', title: 'ความเห็นต่อร่างผล', when: '25/09/2563', detail: 'ความเห็นต่อร่างผลการพิจารณา', label: 'ดำเนินการ', tone: 'info' },
    { phase: 'ผลการพิจารณา', title: 'ผลขั้นที่สุด', when: '30/10/2563', detail: 'ผลการพิจารณาขั้นที่สุด', label: 'เสร็จสิ้น', tone: 'success' },
    { phase: 'หลังจากผลขั้นที่สุด', title: 'เอกสารตามมาตรา 19 (2)', when: '15/01/2564', detail: 'เอกสารในขั้นหลังจากผลพิจารณา', label: 'ดำเนินการ', tone: 'info' },
  ];

  private readonly historyVersions: HistoryItem[] = [
    { phase: 'แบบคำขอ', title: 'เวอร์ชัน 1 ยื่นครั้งแรก', when: '15/05/2562', detail: 'แบบ ปร.1 พร้อมหนังสือนำส่งและเอกสารประกอบ', label: 'ยื่นแล้ว', tone: 'info' },
    { phase: 'แบบคำขอ', title: 'เวอร์ชัน 2 แก้ไขครั้งที่ 1', when: '22/07/2562', detail: 'แบบคำขอที่แก้ไขรอบที่ 1', label: 'แก้ไข', tone: 'warning' },
    { phase: 'แบบคำขอ', title: 'เวอร์ชัน 3 แก้ไขครั้งที่ 2', when: '28/08/2562', detail: 'แบบคำขอที่แก้ไขรอบที่ 2', label: 'แก้ไข', tone: 'warning' },
    { phase: 'แบบคำขอ', title: 'เวอร์ชัน 4 แก้ไขครั้งที่ 3', when: '09/10/2562', detail: 'แบบคำขอที่แก้ไขรอบที่ 3', label: 'แก้ไข', tone: 'warning' },
    { phase: 'แบบคำขอ', title: 'เวอร์ชัน 5 แก้ไขครั้งที่ 4', when: '16/10/2562', detail: 'แบบคำขอที่แก้ไขรอบที่ 4', label: 'แก้ไข', tone: 'warning' },
    { phase: 'แบบคำขอ', title: 'เวอร์ชัน 6 ส่งทางไปรษณีย์อิเล็กทรอนิกส์', when: '22/10/2562', detail: 'เอกสารเพิ่มเติมที่ส่งทางไปรษณีย์อิเล็กทรอนิกส์', label: 'แก้ไข', tone: 'warning' },
    { phase: 'แบบคำขอ', title: 'เวอร์ชัน 7 ฉบับไม่เปิดเผย', when: '05/12/2562', detail: 'คำขอฉบับไม่เปิดเผยต่อสาธารณะ', label: 'แก้ไข', tone: 'warning' },
    { phase: 'เอกสารที่ยื่นเพิ่ม', title: 'เวอร์ชัน 8 ฉบับเปิดเผย', when: '12/12/2562', detail: 'แบบคำขอฉบับที่เปิดเผยได้', label: 'ยื่นแล้ว', tone: 'info' },
    { phase: 'เอกสารที่ยื่นเพิ่ม', title: 'เวอร์ชัน 9 ไฟล์จากแผ่นบันทึก', when: '16/10/2562', detail: 'ไฟล์ประกอบที่ส่งมาพร้อมรอบแก้ไข', label: 'ยื่นแล้ว', tone: 'info' },
    { phase: 'เอกสารที่ยื่นเพิ่ม', title: 'เวอร์ชัน 10 ไฟล์จากแผ่นบันทึก รอบถัดไป', when: '27/11/2562', detail: 'ไฟล์ประกอบอีกชุดหลังรอบแก้ไข', label: 'ยื่นแล้ว', tone: 'info' },
    { phase: 'เปิดไต่สวน', title: 'เวอร์ชัน 11 วาระเปิดไต่สวน', when: '20/01/2563', detail: 'เอกสารวาระพิจารณาเปิดไต่สวน', label: 'ดำเนินการ', tone: 'info' },
    { phase: 'เปิดไต่สวน', title: 'เวอร์ชัน 12 ความเห็นต่อการเปิดไต่สวน', when: '10/02/2563', detail: 'ความเห็นประกอบการพิจารณาเปิดไต่สวน', label: 'ดำเนินการ', tone: 'info' },
    { phase: 'แบบสอบถาม', title: 'เวอร์ชัน 13 แบบสอบถาม', when: '03/03/2563', detail: 'แบบสอบถามที่จัดส่งในเคสนี้', label: 'ดำเนินการ', tone: 'info' },
    { phase: 'แบบสอบถาม', title: 'เวอร์ชัน 14 คำตอบแบบสอบถาม', when: '28/04/2563', detail: 'คำตอบแบบสอบถามที่รับกลับเข้าเคส', label: 'ดำเนินการ', tone: 'info' },
    { phase: 'ตรวจสอบข้อเท็จจริง', title: 'เวอร์ชัน 15 เอกสารตรวจสอบข้อเท็จจริง', when: '15/06/2563', detail: 'ชุดเอกสารที่ใช้ตรวจสอบข้อเท็จจริง', label: 'ดำเนินการ', tone: 'info' },
    { phase: 'ผลการพิจารณา', title: 'เวอร์ชัน 16 ร่างผลขั้นที่สุด', when: '20/08/2563', detail: 'ร่างผลการพิจารณาขั้นที่สุด', label: 'ดำเนินการ', tone: 'info' },
    { phase: 'ผลการพิจารณา', title: 'เวอร์ชัน 17 ความเห็นต่อร่างผล', when: '25/09/2563', detail: 'ความเห็นต่อร่างผลการพิจารณา', label: 'ดำเนินการ', tone: 'info' },
    { phase: 'ผลการพิจารณา', title: 'เวอร์ชัน 18 ผลขั้นที่สุด', when: '30/10/2563', detail: 'ผลการพิจารณาขั้นที่สุด', label: 'เสร็จสิ้น', tone: 'success' },
    { phase: 'หลังจากผลขั้นที่สุด', title: 'เวอร์ชัน 19 เอกสารตามมาตรา 19 (2)', when: '15/01/2564', detail: 'เอกสารในขั้นหลังจากผลพิจารณา', label: 'ดำเนินการ', tone: 'info' },
  ];

  protected get letterWhen(): string {
    return this.thaiDate(this.letterDate);
  }

  protected get signedWhen(): string {
    return this.thaiDate(this.signedOn);
  }

  private thaiDate(value: string): string {
    const months = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
    const [day, month, year] = value.split('/');
    const index = Number(month) - 1;
    if (!day || index < 0 || index > 11 || !year) return value || this.filedOn;
    return `${Number(day)} ${months[index]} ${year}`;
  }

  protected get consultDate(): string {
    return this.thaiDate((this.consult?.when || '').split(' ')[0] || '');
  }

  protected noteClock(at: string): string {
    const time = at.split(' ')[1];
    return time ? `${time} น.` : at;
  }

  protected get measureName(): string {
    return this.measure === 'subsidy' ? 'ตอบโต้การอุดหนุน' : 'ตอบโต้การทุ่มตลาด';
  }

  protected resetPledge(): void {
    this.pledgeText = this.pledgeDefault;
    this.pledgeSource = 'default';
    this.publishGuide();
  }

  protected draftPledge(): void {
    const who = this.signer.trim() || 'ผู้ลงนาม';
    const role = this.roleTitle.trim();
    const roleLine = role ? ` ตำแหน่ง${role}` : '';
    const behalf = this.onBehalf
      ? 'และขอรับรองว่าข้าพเจ้าได้รับมอบหมายให้ดำเนินการแทนผู้ร้องเรียนรายอื่นในฐานะผู้ยื่นคำขอ'
      : 'และขอยื่นคำขอนี้ในนามของผู้ยื่นเอง';
    this.pledgeText = `ข้าพเจ้า ${who}${roleLine} ของ${this.company} ขอรับรองว่าข้อความในแบบ ปร.1 เลขที่อ้างอิง ${filingRefId} เรื่องมาตรการ${this.measureName} ตลอดจนเอกสารผนวกและเอกสารหลักฐานที่นำมาประกอบคำขอ เป็นความจริงและถูกต้องทุกประการ หากข้อมูลและเอกสารหลักฐานเป็นเท็จ ข้าพเจ้าขอรับผิดตามกฎหมายแต่เพียงผู้เดียว ${behalf}`;
    this.pledgeSource = 'draft';
    this.publishGuide();
  }

  protected setSignature(event: Event): void {
    this.readImage(event, (url, name) => {
      this.signatureUrl = url;
      this.signatureName = name;
    });
  }

  protected setSeal(event: Event): void {
    this.readImage(event, (url, name) => {
      this.sealUrl = url;
      this.sealName = name;
    });
  }

  protected setLetterFile(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.letterFileName = file.name;
  }

  private readImage(event: Event, apply: (url: string, name: string) => void): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      apply(typeof reader.result === 'string' ? reader.result : '', file.name);
      this.view.detectChanges();
    };
    reader.readAsDataURL(file);
  }

  protected printDocument(kind: 'letter' | 'pledge'): void {
    document.body.dataset['printDoc'] = kind;
    const done = () => {
      delete document.body.dataset['printDoc'];
      window.removeEventListener('afterprint', done);
    };
    window.addEventListener('afterprint', done);
    window.print();
  }

  protected downloadDocument(kind: 'letter' | 'pledge'): void {
    const node = document.querySelector(`.print-root [data-doc="${kind}"]`);
    if (!(node instanceof HTMLElement)) return;
    const title = kind === 'letter' ? 'หนังสือนำส่ง' : 'คำรับรองและลงนาม';
    const html = `<!DOCTYPE html><html lang="th"><head><meta charset="utf-8"><title>${title} ${filingRefId}</title><style>body{margin:32px 48px;color:#0E2346;font-family:Thonburi,Sarabun,sans-serif;font-size:16px;line-height:28px}h3{margin:0 0 16px;text-align:center;font-size:18px;font-weight:500}.letter__top{display:flex;justify-content:space-between;gap:24px}.letter__date{margin-left:auto;text-align:right;white-space:nowrap}.letter__body{margin:20px 0;text-indent:48px}.letter__sign{margin-top:28px;text-align:center}img{display:block;max-height:88px;margin:0 auto}p{margin:0 0 8px}</style></head><body>${node.innerHTML}</body></html>`;
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title}-${filingRefId}.html`;
    link.click();
    URL.revokeObjectURL(url);
  }

  protected get formLocked(): boolean {
    return this.caseStatus === 'review' || this.caseStatus === 'approval' || this.caseStatus === 'official' || ((this.caseStatus === 'consult' || this.caseStatus === 'revision') && !this.revising);
  }

  protected get showForm(): boolean {
    return this.caseStatus === 'draft' || this.caseStatus === 'cancelled' || this.viewingForm || this.revising;
  }

  protected get tracking(): boolean {
    return this.caseStatus === 'review' || this.caseStatus === 'revision' || this.caseStatus === 'consult' || this.caseStatus === 'approval' || this.caseStatus === 'official';
  }

  protected get showStatus(): boolean {
    return this.tracking && !this.viewingForm && !this.revising && !this.openedRound;
  }

  protected get laterRound(): boolean {
    return this.rounds.length >= 2;
  }

  protected get reviewClock(): string {
    return this.clock(this.reviewLeft);
  }

  protected get approvalClock(): string {
    return this.clock(this.approvalLeft);
  }

  private clock(total: number): string {
    const minutes = Math.floor(total / 60);
    const seconds = total % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  protected get filingRound(): number {
    if (this.revising) return this.rounds.length + 1;
    return this.rounds.at(-1)?.round ?? 1;
  }

  protected get roundGroups(): string[] {
    return [...new Set((this.openedRound?.files ?? []).map((file) => file.group))];
  }

  protected filesIn(group: string): RoundFile[] {
    return this.openedRound?.files.filter((file) => file.group === group) ?? [];
  }

  protected closeRoundView(): void {
    this.viewingForm = false;
    this.openedRound = null;
  }

  protected flowStep: 'edit' | 'consult' = 'edit';

  protected get revisionCount(): number {
    return this.rounds.filter((round) => round.state === 'revision').length;
  }

  protected get uploadPercent(): number {
    const keys = ['cert', 'finance', 'power', 'volume', 'goods', 'export', 'margin', 'import', 'summary'];
    const filled = keys.filter((key) => this.hasDoc(key)).length;
    return Math.round((filled / keys.length) * 100);
  }

  protected get consultGate(): boolean {
    return this.revisionCount > 3 && this.uploadPercent > 80;
  }

  protected chooseEdit(): void {
    if (this.consultGate) {
      this.flowStep = 'consult';
      return;
    }
    this.startRevise();
  }

  private hasDoc(key: string): boolean {
    if ((this.groups[key] ?? []).length || this.files[key]) return true;
    const packs: Record<string, { name: string }[]> = {
      goods: this.docs,
      export: this.exportDocs,
      margin: this.marginDocs,
      import: this.sheets.import,
      summary: this.sheets.summary,
    };
    return (packs[key] ?? []).length > 0;
  }

  protected startRevise(): void {
    this.flowStep = 'edit';
    this.revising = true;
    this.viewingForm = false;
    this.openedRound = null;
  }

  protected openStored(round: FilingRound): void {
    this.openedRound = round;
    this.viewingForm = false;
    this.revising = false;
  }

  protected get caseLabel(): string {
    return caseStatusLabel(this.caseStatus);
  }

  protected get caseTone() {
    return caseStatusTone(this.caseStatus);
  }

  private captureRound(round: number): FilingRound {
    const packs: [string, { name: string; saved: string }[]][] = [
      ['เอกสารประกอบสินค้า', this.docs],
      ['ราคาส่งออก', this.exportDocs],
      ['ส่วนเหลื่อมการทุ่มตลาด', this.marginDocs],
      ['การนำเข้า', this.sheets.import],
      ['ปัจจัยอื่น', this.sheets.factor],
      ['สรุปความเสียหาย', this.sheets.summary],
      ['ปริมาณการนำเข้า', this.sheets.trend],
      ['อุปสรรคอุตสาหกรรม', this.sheets.intent],
      ['เอกสารอื่น', this.otherDocs],
      ['ลายเซ็น', [{ name: this.signatureName, saved: this.signedOn }]],
    ];
    if (this.sealName) packs.push(['ตราประทับบริษัท', [{ name: this.sealName, saved: this.letterDate }]]);
    if (this.letterFileName) packs.push(['หนังสือนำส่งฉบับจริง', [{ name: this.letterFileName, saved: this.letterDate }]]);
    return {
      round,
      submittedOn: this.filedOn,
      state: 'review',
      company: this.company,
      measure: this.measureName,
      signer: this.signer,
      files: packs.flatMap(([group, files]) => files.map((file) => ({ group, name: file.name, saved: file.saved }))),
      findings: [],
    };
  }

  protected saveDraft(): void {
    if (this.caseStatus === 'cancelled' || this.caseStatus === 'review' || this.caseStatus === 'approval' || this.caseStatus === 'official') return;
    if (this.caseStatus === 'consult' && !this.revising) return;
    if (!this.revising) {
      writeCaseStatus('draft');
      this.caseStatus = 'draft';
    }
    this.submitOpen = false;
    this.notice = 'draft';
    this.publishGuide();
  }

  protected submitAck = false;

  protected get requestReady(): boolean {
    return !!(this.company.trim() && this.letterNo.trim() && this.letterDate.trim());
  }

  protected get signReady(): boolean {
    return !!(this.signer.trim() && this.signedOn.trim() && this.signatureUrl);
  }

  protected get pledgeReady(): boolean {
    return this.ack;
  }

  protected get submitReady(): boolean {
    return this.requestReady && this.signReady && this.pledgeReady;
  }

  protected get canConfirm(): boolean {
    return this.submitReady && this.submitAck;
  }

  protected openSubmit(): void {
    this.submitAck = false;
    this.submitOpen = true;
  }

  protected scrollConfirm(): void {
    document.getElementById('check-confirm')?.scrollIntoView({ block: 'nearest' });
  }

  protected confirmSubmit(): void {
    const canSend = this.caseStatus === 'draft' || ((this.caseStatus === 'revision' || this.caseStatus === 'consult') && this.revising);
    if (!canSend || !this.canConfirm || this.submitting) return;
    this.submitting = true;
    this.submitOpen = false;
    window.clearTimeout(this.submitTimer);
    this.submitTimer = window.setTimeout(() => {
      const round = this.captureRound(this.rounds.length + 1);
      this.rounds = [...this.rounds, round];
      writeRounds(this.rounds);
      writeCaseStatus('review');
      this.caseStatus = 'review';
      this.revising = false;
      this.viewingForm = false;
      this.openedRound = null;
      this.submitting = false;
      this.notice = null;
      writeReviewUntil(Date.now() + reviewWaitMs);
      this.armReview();
      this.publishGuide();
      this.view.markForCheck();
    }, 1400);
  }

  protected sendConsult(): void {
    const topic = this.consultTopic.trim();
    const detail = this.consultDetail.trim();
    const when = this.consultWhen.trim();
    if (!topic || !detail || !when) return;
    const request = { topic, detail, when };
    writeConsult(request);
    this.consult = request;
    this.consultNotes = this.sampleTalk();
    writeConsultThread(this.consultNotes);
    writeCaseStatus('consult');
    this.caseStatus = 'consult';
    this.consultOpen = false;
    this.revising = false;
    this.viewingForm = false;
    this.openTalk();
    this.publishGuide();
  }

  protected talkReady = false;
  protected talkLoading = false;
  protected shownCount = 0;
  private talkTimer = 0;

  protected get shownNotes(): ConsultNote[] {
    return this.consultNotes.slice(Math.max(0, this.consultNotes.length - this.shownCount));
  }

  protected get talkHasMore(): boolean {
    return this.shownCount < this.consultNotes.length;
  }

  protected noteDay(at: string): string {
    return this.thaiDate(at.split(' ')[0] || '');
  }

  protected showDay(index: number): boolean {
    const notes = this.shownNotes;
    if (index === 0) return true;
    return this.noteDay(notes[index].at) !== this.noteDay(notes[index - 1].at);
  }

  protected onTalkScroll(event: Event): void {
    const node = event.target as HTMLElement;
    if (!this.talkReady || this.talkLoading || !this.talkHasMore || node.scrollTop > 24) return;
    this.talkLoading = true;
    const previous = node.scrollHeight;
    window.clearTimeout(this.talkTimer);
    this.talkTimer = window.setTimeout(() => {
      this.shownCount = Math.min(this.consultNotes.length, this.shownCount + 6);
      this.talkLoading = false;
      this.view.detectChanges();
      node.scrollTop = Math.max(40, node.scrollHeight - previous);
    }, 700);
  }

  private openTalk(): void {
    const sample = this.sampleTalk();
    const known = new Set(sample.map((note) => note.text));
    const seed = `รับเรื่องแล้ว ${filingUnit} จะติดต่อกลับตามเวลาที่แจ้ง`;
    const extra = this.consultNotes.filter((note) => note.text && !known.has(note.text) && note.text !== seed && note.text !== this.consult?.detail);
    if (!this.consultNotes.some((note) => known.has(note.text))) {
      this.consultNotes = [...sample, ...extra];
      writeConsultThread(this.consultNotes);
    }
    this.talkReady = false;
    this.shownCount = 0;
    window.clearTimeout(this.talkTimer);
    this.talkTimer = window.setTimeout(() => {
      this.shownCount = Math.min(6, this.consultNotes.length);
      this.talkReady = true;
      this.view.detectChanges();
      this.scrollTalkEnd();
    }, 700);
  }

  private scrollTalkEnd(): void {
    const node = document.querySelector('.talk-scroll');
    if (node) node.scrollTop = node.scrollHeight;
  }

  private sampleTalk(): ConsultNote[] {
    const unit = filingUnit;
    return [
      { from: 'applicant', text: 'ขอพบเพื่อชี้แจงหลักฐานราคา ตัวชี้วัดความเสียหาย และรายชื่อผู้ผลิตที่ร่วมยื่น', at: '15/05/2562 10:05' },
      { from: 'officer', text: `รับเรื่องแล้ว ${unit} จะนัดตามเวลาที่สะดวก`, at: '15/05/2562 10:18' },
      { from: 'applicant', text: 'สะดวกวันที่ 16 พฤษภาคม 2562 เวลา 10:00 น.', at: '15/05/2562 10:22' },
      { from: 'officer', text: 'รับทราบ จะนัดที่กรมการค้าต่างประเทศ ห้องประชุมของหน่วยงานผู้รับผิดชอบ', at: '15/05/2562 10:40' },
      { from: 'applicant', text: 'ขอส่งตารางเปรียบเทียบราคาเพิ่มในวันนัดได้หรือไม่', at: '15/05/2562 11:05' },
      { from: 'officer', text: 'ได้ นำมาในวันนัด หรือแนบในช่องนี้ก่อนเวลานัด', at: '15/05/2562 11:20' },
      { from: 'applicant', text: 'แนบตารางเปรียบเทียบราคาช่วงที่ขอให้ไต่สวน', at: '15/05/2562 14:10', files: [{ name: 'ตารางเปรียบเทียบราคา.pdf' }] },
      { from: 'officer', text: 'ได้รับไฟล์แล้ว จะตรวจความครบของช่วงเวลาก่อนวันนัด', at: '15/05/2562 14:32' },
      { from: 'applicant', text: 'ช่วงที่ยังขาดคือปลายปี 2561 ถึงต้นปี 2562', at: '15/05/2562 16:00' },
      { from: 'officer', text: 'ช่วยเพิ่มหลักฐานช่วงนั้น และตัวเลขปริมาณนำเข้าที่เชื่อมกับความเสียหาย', at: '15/05/2562 16:15' },
      { from: 'officer', text: 'วันนี้พบกันเวลา 10:00 น. ตามที่นัดไว้', at: '16/05/2562 09:10' },
      { from: 'applicant', text: 'รับทราบ จะนำรายชื่อผู้ผลิตที่ร่วมยื่นไปด้วย', at: '16/05/2562 09:20' },
      { from: 'officer', text: 'เริ่มการปรึกษาแล้ว ขอให้ชี้แจงหลักฐานราคาที่ไม่ครอบคลุมช่วงเวลา', at: '16/05/2562 10:05' },
      { from: 'applicant', text: 'ราคาที่แนบยังไม่ครบช่วงปลายปี 2561 จะส่งเพิ่มภายในวันนี้', at: '16/05/2562 10:18' },
      { from: 'officer', text: 'ตัวชี้วัดความเสียหายยังอธิบายไม่ครบว่าเชื่อมกับปริมาณนำเข้าอย่างไร', at: '16/05/2562 10:40' },
      { from: 'applicant', text: 'จะปรับคำอธิบายในแบบส่วนที่ 6 ให้ตรงกับตารางปริมาณ', at: '16/05/2562 10:55' },
      { from: 'officer', text: 'รายชื่อผู้ผลิตที่ร่วมยื่นยังไม่ครบตามหนังสือมอบอำนาจ', at: '16/05/2562 11:10' },
      { from: 'applicant', text: 'จะตรวจรายชื่อและแนบหนังสือที่ขาดก่อนส่งรอบถัดไป', at: '16/05/2562 11:25' },
      { from: 'officer', text: 'หากไม่แก้ไขเพิ่ม สามารถยืนยันส่งแบบยื่นทางการได้ ระบบจะส่งให้ผู้ดูแลอนุมัติก่อน', at: '16/05/2562 11:40' },
    ];
  }

  protected sendConsultNote(): void {
    const text = this.consultDraft.trim();
    if ((!text && !this.pendingFiles.length) || this.caseStatus !== 'consult') return;
    this.consultNotes = [...this.consultNotes, { from: 'applicant', text, at: '16/05/2562 11:55', files: this.pendingFiles }];
    writeConsultThread(this.consultNotes);
    this.shownCount = Math.min(this.consultNotes.length, this.shownCount + 1);
    this.consultDraft = '';
    this.pendingFiles = [];
    this.view.detectChanges();
    this.scrollTalkEnd();
  }

  protected addTalkFiles(event: Event): void {
    const input = event.target as HTMLInputElement;
    const next = [...(input.files ?? [])].map((file) => ({ name: file.name }));
    this.pendingFiles = [...this.pendingFiles, ...next];
    input.value = '';
  }

  protected async captureTalk(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      const video = document.createElement('video');
      video.srcObject = stream;
      await video.play();
      const width = video.videoWidth || 960;
      const height = video.videoHeight || 540;
      const scale = Math.min(1, 960 / width);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
      stream.getTracks().forEach((track) => track.stop());
      this.pendingFiles = [...this.pendingFiles, { name: 'ภาพหน้าจอ.jpg', image: canvas.toDataURL('image/jpeg', 0.7) }];
      this.view.markForCheck();
    } catch {
      /* ผู้ใช้ปิดตัวเลือกจับภาพ */
    }
  }

  protected dropPending(index: number): void {
    this.pendingFiles = this.pendingFiles.filter((_, item) => item !== index);
  }

  protected confirmOfficial(): void {
    const next = this.caseStatus === 'consult' ? 'approval' : 'official';
    writeCaseStatus(next);
    this.caseStatus = next;
    this.officialOpen = false;
    this.consultOpen = false;
    this.revising = false;
    this.viewingForm = false;
    this.openedRound = null;
    if (next === 'approval') {
      writeApprovalUntil(Date.now() + reviewWaitMs);
      this.watchApproval();
    }
    this.publishGuide();
  }

  private armReview(): void {
    window.clearInterval(this.reviewTimer);
    if (this.caseStatus !== 'review') return;
    let until = readReviewUntil();
    if (!until) {
      until = Date.now() + reviewWaitMs;
      writeReviewUntil(until);
    }
    const tick = () => {
      const left = until - Date.now();
      this.reviewLeft = Math.max(0, Math.ceil(left / 1000));
      if (left <= 0) this.finishReview();
      else this.view.markForCheck();
    };
    tick();
    if (this.caseStatus === 'review') this.reviewTimer = window.setInterval(tick, 250);
  }

  private finishReview(): void {
    window.clearInterval(this.reviewTimer);
    this.reviewTimer = 0;
    writeReviewUntil(0);
    if (this.caseStatus !== 'review' || !this.rounds.length) return;
    const last = this.rounds.length - 1;
    this.rounds = this.rounds.map((round, index) => {
      if (index !== last || round.state === 'revision') return round;
      return { ...round, state: 'revision', findings: round.round <= 1 ? this.revisionFindings : this.secondFindings };
    });
    writeRounds(this.rounds);
    writeCaseStatus('revision');
    this.caseStatus = 'revision';
    this.reviewLeft = 0;
    this.publishGuide();
    this.view.markForCheck();
  }

  protected finishNotice(): void {
    const draft = this.notice === 'draft';
    const stay = this.revising;
    this.notice = null;
    if (draft && !stay) void this.router.navigate(['/requests'], { queryParams: { tab: 'draft' } });
  }

  protected get onBehalf(): boolean {
    return this.filing !== 'self';
  }

  protected get visibleDocs(): { key: string; label: string; accept: string; hint: string; behalf: boolean }[] {
    return this.supportDocs.filter((item) => !item.behalf || this.onBehalf);
  }

  protected get activeDoc(): { key: string; label: string; accept: string; hint: string; behalf: boolean } {
    return this.visibleDocs.find((item) => item.key === this.docKey) ?? this.visibleDocs[0];
  }

  protected openDoc(key: string): void {
    this.docKey = key;
  }

  protected addRow(): void {
    if (this.onBehalf) {
      this.makers = [...this.makers, emptyParty()];
      this.editingKey = `maker:${this.makers.length - 1}`;
      return;
    }
    this.goods = [...this.goods, { producer: '', goods: '', made: '', sold: '', unit: '' }];
  }

  protected addParty(block: PartyBlock): void {
    block.rows = [...block.rows, emptyParty()];
    this.editingKey = `${block.key}:${block.rows.length - 1}`;
  }

  protected toggleEdit(key: string): void {
    this.editingKey = this.editingKey === key ? '' : key;
  }

  protected addCost(target: 'origin' | 'thai'): void {
    if (target === 'origin') {
      this.originCosts = [...this.originCosts, emptyCost()];
      return;
    }
    this.thaiCosts = [...this.thaiCosts, emptyCost()];
  }

  protected removeMaker(index: number): void {
    this.makers = this.makers.filter((_, item) => item !== index);
    if (!this.makers.length) this.makers = [emptyParty()];
    this.editingKey = '';
  }

  protected removeGood(index: number): void {
    this.goods = this.goods.filter((_, item) => item !== index);
    if (!this.goods.length) this.goods = [{ producer: '', goods: '', made: '', sold: '', unit: '' }];
  }

  protected removeParty(block: PartyBlock, index: number): void {
    block.rows = block.rows.filter((_, item) => item !== index);
    if (!block.rows.length) block.rows = [emptyParty()];
    this.editingKey = '';
  }

  protected removeCost(target: 'origin' | 'thai', index: number): void {
    if (target === 'origin') {
      this.originCosts = this.originCosts.filter((_, item) => item !== index);
      if (!this.originCosts.length) this.originCosts = [emptyCost()];
      return;
    }
    this.thaiCosts = this.thaiCosts.filter((_, item) => item !== index);
    if (!this.thaiCosts.length) this.thaiCosts = [emptyCost()];
  }

  private readonly previews = new Map<string, string>();

  protected isPdf(name: string): boolean {
    return name.toLowerCase().endsWith('.pdf');
  }

  protected preview(name: string, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    const url = this.previews.get(name);
    if (url) window.open(url, '_blank', 'noopener');
  }

  protected namesOf(key: string): string[] {
    return this.groups[key] ?? (this.files[key] ? [this.files[key]] : []);
  }

  protected pick(key: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.keepPreview(file);
    const grouped = this.groups[key];
    if (grouped) {
      if (!grouped.includes(file.name)) this.groups = { ...this.groups, [key]: [...grouped, file.name] };
      return;
    }
    this.files[key] = file.name;
  }

  protected removeListed(key: string, name: string, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    const grouped = this.groups[key];
    if (grouped) {
      this.groups = { ...this.groups, [key]: grouped.filter((item) => item !== name) };
      return;
    }
    this.clearFile(key, event);
  }

  protected clearFile(key: string, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    delete this.files[key];
    const input = (event.currentTarget as HTMLElement).closest('label')?.querySelector('input[type="file"]');
    if (input instanceof HTMLInputElement) input.value = '';
  }

  protected open(item: TocLink): void {
    this.section = item.id;
    this.anchor = item.anchor ?? '';
    this.guideField = '';
    this.publishGuide();
    setTimeout(() => document.querySelector('.form')?.scrollIntoView({ block: 'start' }));
  }

  protected current(item: TocLink): boolean {
    return this.section === item.id && this.anchor === (item.anchor ?? '');
  }

  protected filled(item: TocLink): boolean {
    return item.id !== '7.3' && item.id !== '7.4' && item.anchor !== 'part-4-5';
  }

  protected failed(item: TocLink): boolean {
    return this.issueFor(item) !== '';
  }

  protected groupFailed(group: TocGroup): boolean {
    return group.items.some((item) => this.failed(item));
  }

  protected issueFor(item: TocLink): string {
    return this.failSpots().find((spot) => this.spotHits(spot, item))?.reason ?? '';
  }

  protected get sectionIssue(): string {
    const item = this.toc.flatMap((group) => group.items).find((entry) => this.current(entry));
    return item ? this.issueFor(item) : '';
  }

  protected docIssue(key: string): string {
    return this.failSpots().find((spot) => spot.docs.includes(key))?.reason ?? '';
  }

  private get activeFindings(): RoundFinding[] {
    if (this.caseStatus === 'draft' || this.caseStatus === 'review' || this.caseStatus === 'cancelled') return [];
    return this.rounds.at(-1)?.findings ?? [];
  }

  private failSpots(): { ids: string[]; anchors: string[]; docs: string[]; reason: string }[] {
    return this.activeFindings.map((finding) => ({ ...this.spotOf(finding), reason: finding.detail }));
  }

  private spotOf(finding: RoundFinding): { ids: string[]; anchors: string[]; docs: string[] } {
    if (finding.place.includes('ส่วนที่ 1')) return { ids: ['1'], anchors: ['part-1-1'], docs: ['power'] };
    if (finding.place.includes('ส่วนที่ 2')) return { ids: ['2'], anchors: ['part-2'], docs: ['goods'] };
    if (finding.place.includes('ส่วนที่ 5')) return { ids: ['5', '8.1'], anchors: ['part-5'], docs: ['export', 'import'] };
    if (finding.place.includes('ส่วนที่ 4')) return { ids: ['4', '5'], anchors: ['part-4-1', 'part-4-2', 'part-5'], docs: ['export'] };
    if (finding.place.includes('ส่วนที่ 6')) return { ids: ['6', '8.1', '8.5'], anchors: ['part-6'], docs: ['margin', 'summary', 'import'] };
    if (finding.place.includes('ส่วนที่ 3')) return { ids: ['3'], anchors: ['part-producers'], docs: [] };
    return { ids: [], anchors: [], docs: [] };
  }

  private spotHits(spot: { ids: string[]; anchors: string[] }, item: TocLink): boolean {
    if (item.anchor) return spot.anchors.includes(item.anchor);
    return spot.ids.includes(item.id);
  }

  protected heading(id: string): string {
    for (const group of this.toc) {
      const item = group.items.find((entry) => entry.id === id);
      if (item) return item.label;
    }
    return '';
  }

  protected docsOf(target: DocTarget): DocFile[] {
    if (target === 'import' || target === 'factor' || target === 'summary' || target === 'trend' || target === 'intent') {
      return this.sheets[target];
    }
    return {
      goods: this.docs,
      export: this.exportDocs,
      margin: this.marginDocs,
      subsidy: this.subsidyDocs,
      explain: this.explainDocs,
      other: this.otherDocs,
    }[target];
  }

  protected note(key: string): string {
    return this.notes[key] ?? '';
  }

  protected setNote(key: string, value: string): void {
    this.notes = { ...this.notes, [key]: value };
  }

  protected addDocs(list: FileList | null, target: DocTarget = 'goods'): void {
    if (!list?.length) return;
    const saved = this.today();
    const next = [...list].map((file) => {
      this.keepPreview(file);
      return { name: file.name, saved };
    });
    if (target === 'import' || target === 'factor' || target === 'summary' || target === 'trend' || target === 'intent') {
      this.sheets = { ...this.sheets, [target]: [...this.sheets[target], ...next] };
      return;
    }
    const lists = {
      goods: this.docs,
      export: this.exportDocs,
      margin: this.marginDocs,
      subsidy: this.subsidyDocs,
      explain: this.explainDocs,
      other: this.otherDocs,
    };
    const updated = [...lists[target], ...next];
    if (target === 'export') this.exportDocs = updated;
    else if (target === 'margin') this.marginDocs = updated;
    else if (target === 'subsidy') this.subsidyDocs = updated;
    else if (target === 'explain') this.explainDocs = updated;
    else if (target === 'other') this.otherDocs = updated;
    else this.docs = updated;
  }

  protected dropDocs(event: DragEvent, target: DocTarget = 'goods'): void {
    event.preventDefault();
    this.addDocs(event.dataTransfer?.files ?? null, target);
  }

  protected removeDoc(index: number, target: DocTarget = 'goods'): void {
    if (target === 'import' || target === 'factor' || target === 'summary' || target === 'trend' || target === 'intent') {
      this.sheets = { ...this.sheets, [target]: this.sheets[target].filter((_, item) => item !== index) };
      return;
    }
    const current = {
      goods: this.docs,
      export: this.exportDocs,
      margin: this.marginDocs,
      subsidy: this.subsidyDocs,
      explain: this.explainDocs,
      other: this.otherDocs,
    }[target].filter((_, item) => item !== index);
    if (target === 'export') this.exportDocs = current;
    else if (target === 'margin') this.marginDocs = current;
    else if (target === 'subsidy') this.subsidyDocs = current;
    else if (target === 'explain') this.explainDocs = current;
    else if (target === 'other') this.otherDocs = current;
    else this.docs = current;
  }

  private keepPreview(file: File): void {
    const current = this.previews.get(file.name);
    if (current) URL.revokeObjectURL(current);
    this.previews.set(file.name, URL.createObjectURL(file));
  }

  ngOnInit(): void {
    this.caseStatus = readCaseStatus();
    this.rounds = readRounds();
    this.consult = readConsult();
    this.consultNotes = readConsultThread();
    if (this.caseStatus === 'approval' && !this.consult) {
      writeCaseStatus('official');
      this.caseStatus = 'official';
    }
    if (this.caseStatus === 'review' && this.rounds.length === 0) {
      this.rounds = [this.captureRound(1)];
      writeRounds(this.rounds);
    }
    if (this.caseStatus === 'review') this.armReview();
    if (this.caseStatus === 'consult') this.openTalk();
    this.watchApproval();
    this.publishGuide();
  }

  private approvalTimer = 0;

  private watchApproval(): void {
    window.clearInterval(this.approvalTimer);
    if (this.caseStatus !== 'approval') return;
    let until = readApprovalUntil();
    if (!until) {
      until = Date.now() + reviewWaitMs;
      writeApprovalUntil(until);
    }
    const tick = () => {
      const stored = readCaseStatus();
      if (stored !== 'approval') {
        this.caseStatus = stored;
        window.clearInterval(this.approvalTimer);
        writeApprovalUntil(0);
        this.view.markForCheck();
        return;
      }
      const left = until - Date.now();
      this.approvalLeft = Math.max(0, Math.ceil(left / 1000));
      if (left <= 0) this.finishApproval();
      else this.view.markForCheck();
    };
    tick();
    if (this.caseStatus === 'approval') this.approvalTimer = window.setInterval(tick, 250);
  }

  private finishApproval(): void {
    window.clearInterval(this.approvalTimer);
    this.approvalTimer = 0;
    writeApprovalUntil(0);
    if (this.caseStatus !== 'approval') return;
    writeCaseStatus('official');
    this.caseStatus = 'official';
    this.publishGuide();
    this.view.markForCheck();
  }

  ngOnDestroy(): void {
    window.clearTimeout(this.submitTimer);
    window.clearTimeout(this.talkTimer);
    window.clearInterval(this.reviewTimer);
    window.clearInterval(this.approvalTimer);
    this.guide.clear();
  }

  protected publishGuide(): void {
    this.guide.set(this.guideSnapshot(), (id) => this.jumpGuide(id));
  }

  protected noteField(event: FocusEvent): void {
    const target = event.target;
    if (!(target instanceof HTMLElement) || target.tagName === 'BUTTON') return;
    const host = target.closest('label, fieldset');
    const raw = host?.querySelector('legend')?.textContent || host?.childNodes[0]?.textContent || target.getAttribute('aria-label') || '';
    const name = raw.replace(/\*/g, '').replace(/\s+/g, ' ').trim().slice(0, 80);
    if (!name || name === this.guideField) return;
    this.guideField = name;
    this.publishGuide();
  }

  private jumpGuide(id: string): void {
    const [nav, label = ''] = id.split('::');
    if (nav.startsWith('nav:')) {
      const [section, anchor = ''] = nav.slice(4).split('|');
      const item = this.toc.flatMap((group) => group.items).find((entry) => entry.id === section && (entry.anchor ?? '') === anchor);
      if (item) this.open(item);
    }
    const name = label.replace(/\s+/g, '');
    if (!name) return;
    setTimeout(() => {
      const nodes = document.querySelectorAll('.form label, .form fieldset, .form h3, .form h4, .form .table-head p');
      const hit = [...nodes].find((node) => (node.textContent ?? '').replace(/\s+/g, '').includes(name));
      hit?.scrollIntoView({ block: 'center' });
    }, 120);
  }

  private guideTitle(): string {
    if (this.section === '2') return 'ส่วนที่ 2 รายละเอียดสินค้า';
    if (this.section === '1' && this.anchor === 'part-1-1') return 'ส่วนที่ 1 ข้อมูลผู้ยื่น';
    const current = this.toc.flatMap((group) => group.items.map((item) => ({ group: group.label, item }))).find((entry) => entry.item.id === this.section && (entry.item.anchor ?? '') === this.anchor);
    if (!current) return 'แบบคำขอ';
    return current.item.label === current.group ? current.group : `${current.group} · ${current.item.label}`;
  }

  private guideFocus(): string {
    if (this.section === '2') return 'รายละเอียดสินค้า';
    if (this.section === '1') return 'ข้อมูลผู้ยื่น';
    if (this.section === '5') return 'ราคาส่งออก';
    if (this.section === '9') return 'คำรับรองและหนังสือนำส่ง';
    return 'ส่วนนี้';
  }

  private fileMeta(label: string, required: boolean, files: { name: string }[] | string[]): GuideAttachment {
    const names = files.map((file) => (typeof file === 'string' ? file : file.name));
    return { label, required, count: names.length, names: names.slice(0, 6) };
  }

  private watch(checked: string[], missing: GuideField[], label: string, value: string): void {
    checked.push(label);
    if (!value.trim()) missing.push({ id: `nav:${this.section}|${this.anchor}::${label}`, label });
  }

  private guideSnapshot(): FilingSnapshot {
    const checked: string[] = [];
    const missing: GuideField[] = [];
    const errors: GuideField[] = [];
    const attachments: GuideAttachment[] = [];
    let fieldsChecked = false;
    let sectionRequired = true;
    const section = this.section;
    const anchor = this.anchor;
    const see = (label: string, value: string) => this.watch(checked, missing, label, value);

    if (section === '1' && anchor === 'part-1-1') {
      fieldsChecked = true;
      see('ชื่อบริษัท', this.company);
      see('สัญชาติ', this.nationality);
      see('ที่อยู่', this.address);
      see('โทรศัพท์', this.phone);
      if (this.onBehalf) {
        see('ผู้รับมอบอำนาจ', this.agent);
        see('ผู้ผลิตที่มิได้ขอให้กระทำการแทน', this.outsideProducer);
        see('รายชื่อผู้ผลิตที่ไม่ใช่บริษัทเดียวกัน', this.makers.some((row) => !row.name.trim()) ? '' : 'มี');
      } else {
        see('รายการสินค้าที่ผลิตและ/หรือจำหน่าย', this.goods.some((row) => !row.producer.trim()) ? '' : 'มี');
      }
      for (const doc of this.visibleDocs) attachments.push(this.fileMeta(doc.label, true, this.namesOf(doc.key)));
      if (this.email.trim() && !this.email.includes('@')) errors.push({ id: `nav:${section}|${anchor}::อีเมล`, label: 'อีเมล', hint: 'รูปแบบอีเมลยังไม่ครบ' });
    } else if (section === '1' && anchor === 'part-1-2') {
      fieldsChecked = true;
      see('ความเกี่ยวข้องกับผู้นำเข้าหรือผู้ส่งออก', this.relatedImport);
    } else if (section === '1' && anchor === 'part-1-3') {
      fieldsChecked = true;
      see('คำขอมาตรการช่วยเหลือ', this.priorAid);
    } else if (section === '2') {
      fieldsChecked = true;
      see('ชื่อและลักษณะสินค้า', this.goodsDetail);
      see('ช่องทางจำหน่ายและผู้ใช้สินค้า', this.channelDetail);
      attachments.push(this.fileMeta('เอกสารรายละเอียดสินค้าที่ถูกพิจารณา', true, this.docsOf('goods')));
    } else if (section === '3') {
      fieldsChecked = true;
      const block = this.parties.find((item) => anchor === `part-${item.key}`);
      if (block) see(block.nameLabel, block.rows.some((row) => !row.name.trim()) ? '' : 'มี');
    } else if (section === '4' && anchor === 'part-4-1') {
      fieldsChecked = true;
      see('ประเทศผู้ส่งออก', this.exportCountry);
      see('ราคาหน้าโรงงาน', this.factoryNote);
      see('สกุลเงิน', this.currency);
    } else if (section === '4' && anchor === 'part-4-2') {
      fieldsChecked = true;
      see('เหตุผลที่ใช้ราคาส่งออกไปประเทศที่สาม', this.thirdReason);
    } else if (section === '4' && anchor === 'part-4-3-1') {
      fieldsChecked = true;
      see('ช่วงเวลาต้นทุนในประเทศแหล่งกำเนิด', this.originPeriod);
      see('รายละเอียดต้นทุนในประเทศแหล่งกำเนิด', this.originDetail);
      see('รายการต้นทุนในประเทศแหล่งกำเนิด', this.originCosts.some((row) => !row.item.trim()) ? '' : 'มี');
    } else if (section === '4' && anchor === 'part-4-3-2') {
      fieldsChecked = true;
      see('ช่วงเวลาต้นทุนในประเทศไทย', this.thaiPeriod);
      see('รายละเอียดต้นทุนในประเทศไทย', this.thaiDetail);
      see('รายการต้นทุนในประเทศไทย', this.thaiCosts.some((row) => !row.item.trim()) ? '' : 'มี');
    } else if (section === '4' && anchor === 'part-4-4') {
      fieldsChecked = true;
      see('ตลาดมีลักษณะเฉพาะ', this.specialDetail);
    } else if (section === '4' && anchor === 'part-4-5') {
      fieldsChecked = true;
      see('เหตุผลข้อ 4.5', this.compareReason);
      if (this.market !== 'yes') see('วิธีคำนวณมูลค่าปกติ', this.method);
    } else if (section === '5') {
      fieldsChecked = true;
      see('รายละเอียดราคาส่งออก', this.exportDetail);
      attachments.push(this.fileMeta('เอกสารราคาส่งออก', true, this.docsOf('export')));
    } else if (section === '6') {
      fieldsChecked = true;
      attachments.push(this.fileMeta('เอกสารส่วนเหลื่อมการทุ่มตลาด', true, this.docsOf('margin')));
    } else if (section.startsWith('7')) {
      sectionRequired = this.measure === 'subsidy';
      fieldsChecked = section === '7.1' || section === '7.2';
      if (section === '7.2') see('รายละเอียดการอุดหนุน', this.explainDetail);
      const key = section === '7.2' ? 'explain' : 'subsidy';
      if (section === '7.1' || section === '7.2') attachments.push(this.fileMeta(section === '7.1' ? 'เอกสารโครงการอุดหนุน' : 'เอกสารอธิบายการอุดหนุน', sectionRequired, this.docsOf(key)));
    } else if (section === '8.1') {
      fieldsChecked = true;
      see('รายละเอียดการนำเข้า', this.note('importDetail'));
      attachments.push(this.fileMeta('ข้อมูลการนำเข้าสินค้าที่ถูกพิจารณา', true, this.docsOf('import')));
    } else if (section === '8.2') {
      fieldsChecked = true;
      see('ผลกระทบด้านราคา', this.note('priceEffect'));
      see('ผลกระทบต่อต้นทุน', this.note('costEffect'));
      attachments.push(this.fileMeta('หลักฐานเปรียบเทียบราคา', false, this.namesOf('priceCompare')));
      attachments.push(this.fileMeta('ต้นทุนสินค้าชนิดเดียวกันต่อหน่วย', false, this.namesOf('unitCost')));
    } else if (section === '8.3') {
      fieldsChecked = true;
      for (const item of this.conditions) see(item.label, this.note(item.key));
      attachments.push(this.fileMeta('ข้อมูลสินค้าชนิดเดียวกันรายปี', false, this.namesOf('yearly')));
      for (const item of this.conditions) attachments.push(this.fileMeta(item.label, false, this.namesOf(item.key)));
    } else if (section === '8.4') {
      fieldsChecked = true;
      see('ปัจจัยอื่น', this.note('factorDetail'));
      attachments.push(this.fileMeta('เอกสารปัจจัยอื่น', false, this.docsOf('factor')));
    } else if (section === '8.5') {
      fieldsChecked = true;
      see('สรุปความเสียหาย', this.note('summaryDetail'));
      attachments.push(this.fileMeta('เอกสารสรุปความเสียหาย', false, this.docsOf('summary')));
    } else if (section === '8.6') {
      fieldsChecked = true;
      see('ข้อมูลผู้ซื้อ', this.note('buyerDetail'));
      attachments.push(this.fileMeta('หลักฐานผู้ซื้อ', false, this.namesOf('buyerProof')));
      attachments.push(this.fileMeta('จดหมายหรือรายงานจากลูกค้า', false, this.namesOf('buyerLetter')));
    } else if (section === '8.7') {
      fieldsChecked = true;
      see('ขีดความสามารถของผู้ส่งออก', this.note('trendCapacity'));
      see('ผลของราคาสินค้าที่ถูกพิจารณา', this.note('trendPrice'));
      see('ปัจจัยอื่น', this.note('trendOther'));
      attachments.push(this.fileMeta('ข้อมูลปริมาณการนำเข้า', false, this.docsOf('trend')));
    } else if (section === '8.8') {
      fieldsChecked = true;
      see('อุปสรรคต่อการก่อตั้งหรือพัฒนา', this.note('intentDetail'));
      attachments.push(this.fileMeta('หลักฐานอุปสรรคอุตสาหกรรม', false, this.docsOf('intent')));
    } else if (section === '9') {
      fieldsChecked = true;
      see('ข้อความคำรับรอง', this.pledgeText);
      see('คำรับรอง', this.ack ? 'รับรอง' : '');
      see('ผู้ลงนาม', this.signer);
      see('ตำแหน่ง', this.roleTitle);
      see('วันที่ลงนาม', this.signedOn);
      see('รูปลายเซ็น', this.signatureUrl);
      see('วันที่หนังสือ', this.letterDate);
      see('เลขที่หนังสือ', this.letterNo);
      see('เรื่อง', this.letterSubject);
      see('เรียน', this.letterTo);
      see('อ้างถึง', this.letterRef);
      see('สิ่งที่แนบมาด้วย', this.letterEnclosed);
      see('รายละเอียดหนังสือนำส่ง', this.letterBody);
      see('ความประสงค์ให้พิจารณา', this.letterPurpose);
      if (this.letterDate.trim() && !/^\d{2}\/\d{2}\/\d{4}$/.test(this.letterDate.trim())) {
        errors.push({ id: 'nav:9|::วันที่หนังสือ', label: 'วันที่หนังสือ', hint: 'ใช้รูปแบบ วัน/เดือน/ปี' });
      }
      if (this.signedOn.trim() && !/^\d{2}\/\d{2}\/\d{4}$/.test(this.signedOn.trim())) {
        errors.push({ id: 'nav:9|::วันที่ลงนาม', label: 'วันที่ลงนาม', hint: 'ใช้รูปแบบ วัน/เดือน/ปี' });
      }
      checked.push('หนังสือนำส่ง');
    } else if (section === 'other') {
      fieldsChecked = true;
      attachments.push(this.fileMeta('เอกสารอื่นที่แนบประกอบ', false, this.docsOf('other')));
    }

    const flat = this.toc.flatMap((group) => group.items.map((item) => ({ group: group.label, item })));
    const index = flat.findIndex((entry) => entry.item.id === section && (entry.item.anchor ?? '') === anchor);
    const upcoming = flat[index + 1];
    const formData: Record<string, string> = { publicCase: `${filingRefId} เหล็กแผ่นรีดร้อน` };
    if (section === '1') formData['filingMode'] = this.onBehalf ? 'ยื่นแทนผู้ผลิตรายอื่น' : 'ยื่นในนามตนเอง';
    if (section === '4' && anchor === 'part-4-5' && this.market === 'yes') formData['marketEconomy'] = 'ใช้กลไกตลาด';

    return {
      measureType: this.measure === 'subsidy' ? 'CVD' : 'AD',
      formType: 'ปร.1',
      requestId: filingRefId,
      currentSection: section,
      anchor,
      promptKey: anchor ? `${section}:${anchor}` : section,
      currentField: this.guideField,
      currentSectionTitle: this.guideTitle(),
      focus: this.guideFocus(),
      nextSectionTitle: upcoming ? `${upcoming.group} · ${upcoming.item.label}` : '',
      nextJump: upcoming ? `nav:${upcoming.item.id}|${upcoming.item.anchor ?? ''}` : '',
      formData,
      validationErrors: errors,
      missingRequiredFields: sectionRequired ? missing : [],
      checkedFields: checked,
      fieldsChecked,
      sectionRequired,
      attachmentMetadata: attachments,
      completionStatus: caseStatusLabel(this.caseStatus),
    };
  }

  private today(): string {
    const date = new Date();
    const day = `${date.getDate()}`.padStart(2, '0');
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    return `${day}/${month}/${date.getFullYear() + 543}`;
  }
}
