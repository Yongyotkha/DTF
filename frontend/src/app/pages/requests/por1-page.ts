import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Accounts, roleLabel } from '../../accounts';
import { DftButton } from '../../button/button';
import { ThaiDateField } from '../../fields/thai-date-field';
import { InputField } from '../../input-field/input-field';
import { thaiDateOk } from '../../fields/field-rules';
import { SideNav } from '../../menu-bar/side-nav';
import { DftModal } from '../../modal/modal';
import { StatusTag } from '../../status-tag/status-tag';
import { TopHeader } from '../../top-header/top-header';
import { FilingAiContext, type FilingSnapshot, type GuideAttachment, type GuideField } from '../../ask-ai/filing-context';
import { groupHead, groupMembers, peopleInGroup, staffGroups, staffPeople, workGroups } from '../staff/staff-roster';
import { acceptedAssignees, addThaiMonths, assignmentReplyLabel, assignmentReplyTone, assignmentStepLabel, assignmentStepTone, caseStatusLabel, caseStatusTone, consultChannelLabel, filingOfficer, filingRefId, filingUnit, readApprovalUntil, readApprovedBy, readCaseStatus, readConsult, readConsultAssigned, readConsultPlan, readConsultStep, readConsultThread, consultFilingOwners, readFilingGate, writeFilingGate, defaultInquiryQuestions, readCaseNotes, readLaterPhase, readNoteReads, readDocNotice, readEtrLink, readMadeDocs, readWorkDrafts, readFlowFile, readReceipt, readReviewUntil, readRounds, readSystemLinks, readWorkAssignment, reviewWaitMs, writeApprovalUntil, writeApprovedBy, writeCaseStatus, writeFlowFile, writeConsult, writeConsultAssigned, writeConsultGroup, writeConsultPlan, writeConsultStep, writeConsultThread, writeCaseNotes, writeLaterPhase, writeNoteReads, writeDocNotice, writeEtrLink, writeMadeDocs, writeWorkDrafts, writeReceipt, writeReviewUntil, writeRounds, writeSystemLinks, writeWorkAssignment, type AssignFile, type AssignReply, type AssignSlip, type CaseNote, type CaseNoteFile, type CaseStatus, type LaterPhase, type ConsultNote, type ConsultPlan, type ConsultRequest, type FilingGate, type DocAction, type DocFile as NoticeFile, type ApplicantReply, type ReplyFile, type NoticePass, type DocGap, type CommitteeRecord, type InquiryRecord, type InquiryPayFile, type InquiryQuestion, type InquiryIssued, type InquiryLoopKind, type FilingRound, type GroupTask, type OfficeLink, type PersonHand, type ReceiptRecord, type RoundFile, type RoundFinding, type SystemLink, type MadeDoc, type WorkAssignment, type WorkDraft } from './case-status';
import { FilingTabs } from './filing-tabs';
import { readHearing, writeHearing } from './hearing-lane';
import { FilledUpload } from './filled-upload';
import { caseFormExtra } from './case-form';
import { cvdChosen, readFilingIntent } from './filing-intent';
import { caseKey, findListedCase, type ListedCase } from './request-cases';
import { invitePath, joinedFor } from './interest-invite';
import { readParty, readText, valueIsWrong, wrongHint } from './form-extract';
import { scrollFormToTop } from './form-scroll';

type InquiryStep = 'agenda' | 'decide' | 'letter' | 'fee' | 'proof' | 'vote' | 'notice' | 'sign' | 'letters' | 'news' | 'hearing' | 'questions' | 'visit';
type ReviewTab = 'form' | 'assign' | 'docs' | 'inquiry' | 'prelim' | 'draftFinal' | 'finalResult' | 'measures' | 'link';
type FlowStep = { id: string; label: string; detail: string; yes?: string; no?: string };
type FlowField = { label: string; long?: boolean; date?: boolean };

const flowCatalog: Record<'prelim' | 'draftFinal' | 'finalResult' | 'measures', FlowStep[]> = {
  prelim: [
    { id: 'prelim-analyse', label: 'ประมวลผลขั้นต้น', detail: 'เจ้าหน้าที่วิเคราะห์ข้อมูลการไต่สวน AI ช่วยสืบค้นและร่างสรุป' },
    { id: 'prelim-committee', label: 'วินิจฉัยผลขั้นต้น', detail: 'คณะกรรมการพิจารณาวินิจฉัยผลการไต่สวนขั้นต้น' },
    { id: 'prelim-announce', label: 'ออกประกาศ', detail: 'ออกประกาศผลการไต่สวนขั้นต้น งานสารบรรณลงทะเบียนรับเลข แล้วอัปเดต e-TR' },
    { id: 'prelim-notify', label: 'แจ้งผู้มีส่วนได้เสีย', detail: 'แจ้งอีเมลผู้มีส่วนได้เสียหลังประกาศผลขั้นต้น' },
    { id: 'prelim-hearing', label: 'Hearing', detail: 'ผู้มีส่วนได้เสียขอทราบข้อเท็จจริง ส่งความเห็น หรือขอจัด hearing ภายใน 30 วัน ถ้า e-Office ตีกลับ ให้แก้ในระบบนี้ก่อนส่งใหม่', yes: 'เข้า Hearing', no: 'ไม่เข้า' },
    { id: 'prelim-again', label: 'ส่งคณะกรรมการอีกครั้ง', detail: 'ถ้าส่งกลับ คณะกรรมการวินิจฉัยผลขั้นต้นใหม่ ถ้าไม่ส่งจึงไป Proposed Final', yes: 'ส่งอีกครั้ง', no: 'ไป Proposed Final' },
  ],
  draftFinal: [
    { id: 'draft-proposed', label: 'Proposed Final', detail: 'ส่งข้อเสนอผลการตัดสินชั้นที่สุดให้ผู้มีส่วนได้เสีย' },
    { id: 'draft-comments', label: 'รวบรวมความคิดเห็น', detail: 'รวบรวมความคิดเห็นและข้อโต้แย้งที่ส่งกลับมา' },
    { id: 'draft-sub', label: 'ประชุมอนุ', detail: 'ตัดสินว่าต้องจัดประชุมอนุที่เกี่ยวข้องหรือไม่', yes: 'จัดประชุม', no: 'ไม่จัด' },
    { id: 'draft-agenda', label: 'ร่างวาระและประชุมอนุ', detail: 'AI ช่วยร่างวาระ แล้วอนุที่เกี่ยวข้องประชุม' },
    { id: 'draft-substance', label: 'สาระสำคัญของร่าง', detail: 'ถ้าความเห็นเปลี่ยนสาระสำคัญ ให้ปรับร่างและเปิดรับฟังอีกครั้ง', yes: 'เปลี่ยนสาระสำคัญ', no: 'ไม่เปลี่ยน' },
    { id: 'draft-revise', label: 'ปรับร่าง', detail: 'ปรับ Draft ผลการตัดสินชั้นที่สุด แล้วเปิดรับฟังอีกครั้ง' },
    { id: 'draft-pack', label: 'เอกสารผลชั้นที่สุด', detail: 'จัดทำเอกสารเปิดเผยและไม่เปิดเผย พร้อมช่วงให้แสดงความเห็น' },
  ],
  finalResult: [
    { id: 'final-announce', label: 'ประกาศผลชั้นที่สุด', detail: 'ออกประกาศผลการตัดสินชั้นที่สุด' },
    { id: 'final-disclose', label: 'การเปิดเผย', detail: 'ถ้าเปิดเผยจึงแจ้งอีเมลผู้มีส่วนได้เสีย', yes: 'เปิดเผย', no: 'ไม่เปิดเผย' },
    { id: 'final-saraban', label: 'สารบรรณและ e-TR', detail: 'งานสารบรรณลงทะเบียนรับเลข แล้วอัปเดต e-TR' },
    { id: 'final-publish', label: 'เผยแพร่', detail: 'เก็บข้อมูล เผยแพร่บนเว็บไซต์กอง และส่งเข้า ThaiTR' },
  ],
  measures: [
    { id: 'm56', label: 'มาตรา 56', detail: 'ทบทวนความจำเป็นในการใช้บังคับอากร ถ้ามีเหตุจึงเสนอคณะกรรมการปรับอัตราหรือยุติ ถ้าไม่มีเหตุใช้มาตรการเดิมต่อ', yes: 'มีเหตุให้ทบทวน', no: 'ใช้มาตรการเดิม' },
    { id: 'm57', label: 'มาตรา 57', detail: 'ทบทวนก่อนครบกำหนด ถ้าเข้าเงื่อนไขจึงตรวจการทุ่มตลาดและความเสียหายที่อาจเกิดซ้ำ ถ้าไม่เข้าเงื่อนไขมาตรการสิ้นสุดตามกฎหมาย', yes: 'เข้าเงื่อนไข', no: 'สิ้นสุดตามกฎหมาย' },
    { id: 'm58', label: 'มาตรา 58', detail: 'ทบทวนผู้ส่งออกหรือผู้ผลิตรายใหม่ ถ้าเข้าเกณฑ์จึงตรวจความเกี่ยวข้องและพิจารณาหลักประกัน', yes: 'เข้าเกณฑ์', no: 'ไม่เข้าเกณฑ์' },
    { id: 'm59', label: 'มาตรา 59', detail: 'ขอคืนอากร ถ้าส่วนเหลื่อมต่ำกว่าอากรหรือไม่มีส่วนเหลื่อมจึงตรวจหลักฐานผู้นำเข้าและพิจารณาคืน', yes: 'เข้าเงื่อนไขคืนอากร', no: 'ไม่เข้าเงื่อนไข' },
  ],
};

const flowFields: Record<string, FlowField[]> = {
  'prelim-analyse': [
    { label: 'วันที่', date: true },
    { label: 'ปริมาณนำเข้า', long: true },
    { label: 'ผลกระทบด้านราคา', long: true },
    { label: 'ผลประกอบการ', long: true },
    { label: 'สรุปผลการไต่สวนขั้นต้น', long: true },
  ],
  'prelim-committee': [
    { label: 'วันที่ประชุม', date: true },
    { label: 'ระเบียบวาระ', long: true },
    { label: 'มติที่ประชุม', long: true },
    { label: 'รายงานการประชุม', long: true },
  ],
  'prelim-announce': [
    { label: 'ที่' },
    { label: 'วันที่', date: true },
    { label: 'เรื่อง' },
    { label: 'ผลการไต่สวนขั้นต้น', long: true },
    { label: 'เลขสารบรรณ' },
  ],
  'prelim-notify': [
    { label: 'วันที่', date: true },
    { label: 'เรียน' },
    { label: 'เรื่อง' },
    { label: 'เนื้อความ', long: true },
  ],
  'prelim-hearing': [
    { label: 'ผู้ขอ' },
    { label: 'วันที่ขอ', date: true },
    { label: 'ช่องทาง' },
  ],
  'prelim-again': [
    { label: 'เหตุผล', long: true },
  ],
  'draft-proposed': [
    { label: 'ที่' },
    { label: 'วันที่', date: true },
    { label: 'เรียน' },
    { label: 'เรื่อง' },
    { label: 'ข้อเสนอผลชั้นที่สุด', long: true },
    { label: 'วันเริ่มให้ความเห็น', date: true },
    { label: 'วันสิ้นสุดให้ความเห็น', date: true },
  ],
  'draft-comments': [
    { label: 'ผู้ส่งความเห็น' },
    { label: 'วันที่', date: true },
    { label: 'สรุปข้อโต้แย้ง', long: true },
  ],
  'draft-sub': [
    { label: 'วันที่ประชุม', date: true },
    { label: 'เหตุผล', long: true },
  ],
  'draft-agenda': [
    { label: 'ครั้งที่ประชุม' },
    { label: 'วันที่ประชุม', date: true },
    { label: 'ระเบียบวาระ', long: true },
    { label: 'มติที่ประชุม', long: true },
  ],
  'draft-substance': [
    { label: 'เหตุผล', long: true },
  ],
  'draft-revise': [
    { label: 'เรื่องที่ปรับ' },
    { label: 'ร่างใหม่', long: true },
  ],
  'draft-pack': [
    { label: 'ฉบับเปิดเผย', long: true },
    { label: 'ฉบับไม่เปิดเผย', long: true },
    { label: 'วันเริ่มให้ความเห็น', date: true },
    { label: 'วันสิ้นสุดให้ความเห็น', date: true },
  ],
  'final-announce': [
    { label: 'ที่' },
    { label: 'วันที่', date: true },
    { label: 'เรื่อง' },
    { label: 'ผลการตัดสินชั้นที่สุด', long: true },
  ],
  'final-disclose': [
    { label: 'เรียน' },
    { label: 'เนื้อหาที่แจ้ง', long: true },
  ],
  'final-saraban': [
    { label: 'เลขรับสารบรรณ' },
    { label: 'วันที่รับ', date: true },
    { label: 'เลข e-TR' },
  ],
  'final-publish': [
    { label: 'วันที่เผยแพร่', date: true },
    { label: 'เว็บไซต์กอง' },
    { label: 'เลข ThaiTR' },
  ],
  m56: [
    { label: 'วันที่', date: true },
    { label: 'เรื่อง' },
    { label: 'ผลการตรวจหลักฐาน', long: true },
    { label: 'ข้อเสนอต่อคณะกรรมการ', long: true },
  ],
  m57: [
    { label: 'วันที่', date: true },
    { label: 'เรื่อง' },
    { label: 'ผลการตรวจการทุ่มตลาดและความเสียหาย', long: true },
    { label: 'ข้อเสนอต่อคณะกรรมการ', long: true },
  ],
  m58: [
    { label: 'วันที่', date: true },
    { label: 'เรื่อง' },
    { label: 'ผลการตรวจความเกี่ยวข้อง', long: true },
    { label: 'หลักประกัน', long: true },
  ],
  m59: [
    { label: 'วันที่', date: true },
    { label: 'เรื่อง' },
    { label: 'ผลการตรวจส่วนเหลื่อม', long: true },
    { label: 'หลักฐานผู้นำเข้า', long: true },
  ],
};
type TocLink = { id: string; label: string; anchor?: string };
type TocGroup = { label: string; items: TocLink[] };
type HistoryItem = { phase: string; title: string; when: string; detail: string; label: string; tone: 'neutral' | 'info' | 'warning' | 'success' };
type DutyState = 'new' | 'accepted' | 'returned' | 'working';
type DutyMove = '' | 'report' | 'forward';
type ConsultSlip = { assignedOn: string; dueOn: string; dueTime: string; remind: boolean; order: string; files: AssignFile[]; signed?: boolean };
type ConsultResult = { at: string; detail: string; files: AssignFile[]; signed?: boolean };
type ConsultOfficerJob = { name: string; reply: 'pending' | 'accept' | 'return'; move: DutyMove; repliedAt?: string; result?: ConsultResult; form?: ConsultSlip };
type ConsultGroupJob = {
  group: string;
  reply: 'pending' | 'accept' | 'return';
  repliedAt?: string;
  result?: ConsultResult;
  officers: ConsultOfficerJob[];
  form?: ConsultSlip;
  verdict?: '' | 'approve' | 'rework';
  handoff?: '' | 'stop' | 'more';
  delivery?: '' | 'close' | 'board' | 'check';
};
type ConsultForm = '' | 'groups' | 'officers' | 'group-reply' | 'officer-reply';

type GoodsRow = { producer: string; goods: string; made: string; sold: string; unit: string };
type MakerRow = { name: string; address: string; phone: string; fax: string; web: string; email: string };
type PartyBlock = { key: string; title: string; nameLabel: string; addLabel: string; wrapped: boolean; rows: MakerRow[] };

function field(label: string, value: string, long = false): WorkDraft['fields'][number] {
  return { label, value, long };
}

function defaultWorkDrafts(): WorkDraft[] {
  return [
    {
      title: 'หนังสือขอข้อมูลหน่วยงานที่เกี่ยวข้อง',
      file: 'นส ถึง 4 หน่วยงาน (print).docx',
      fields: [
        field('ที่', 'กพ. / กองปกป้องและตอบโต้ทางการค้า'),
        field('วันที่', '20/05/2562'),
        field('เรื่อง', 'ขอความอนุเคราะห์ข้อมูลผู้ผลิตสินค้าเหล็กแผ่นรีดร้อน'),
        field('เรียน', 'ผู้อำนวยการศูนย์สารสนเทศโรงงานอุตสาหกรรม กรมโรงงานอุตสาหกรรม\nผู้อำนวยการสถาบันเหล็กและเหล็กกล้าแห่งประเทศไทย\nประธานกลุ่มอุตสาหกรรมเหล็ก สภาอุตสาหกรรมแห่งประเทศไทย\nผู้อำนวยการศูนย์สารสนเทศเศรษฐกิจอุตสาหกรรม สำนักงานเศรษฐกิจอุตสาหกรรม', true),
        field('อ้างถึง', 'คำขอเลขที่อ้างอิง REF256205150001 ลงวันที่ 15/05/2562'),
        field('สิ่งที่ส่งมาด้วย', '1. แบบแสดงรายชื่อผู้ผลิต พร้อมสถานที่ตั้ง\n2. แบบแสดงกำลังการผลิตและปริมาณการผลิต\n3. แบบแสดงปริมาณความต้องการใช้ภายในประเทศ', true),
        field('เนื้อความ', 'ด้วยกรมการค้าต่างประเทศได้รับคำขอเลขที่อ้างอิง REF256205150001 จากบริษัท สหวิริยาสตีลอินดัสตรี จำกัด ให้พิจารณาตอบโต้การทุ่มตลาดสินค้าเหล็กแผ่นรีดร้อนจากเวียดนามและอียิปต์ จึงขอข้อมูลผู้ผลิตในประเทศ ได้แก่ รายชื่อและสถานที่ตั้ง กำลังการผลิตและปริมาณการผลิตช่วงปี 2561 ถึงต้นปี 2562 และปริมาณความต้องการใช้ภายในประเทศในช่วงเวลาเดียวกัน', true),
        field('กำหนดส่งข้อมูล', '20/06/2562'),
        field('โทรศัพท์', ''),
        field('โทรสาร', ''),
        field('ลงชื่อ', 'กองปกป้องและตอบโต้ทางการค้า'),
        field('ตำแหน่ง', 'กองปกป้องและตอบโต้ทางการค้า กรมการค้าต่างประเทศ'),
      ],
    },
    {
      title: 'สรุปข้อมูลจากหน่วยงานที่เกี่ยวข้อง',
      file: 'Sum ข้อมูลจาก 4 หน่วยงาน_V2.xlsx',
      fields: [
        field('วัตถุประสงค์', 'รวมอุปสงค์และอุปทานให้สอดคล้องกับฐานะผู้ยื่นในคำขอ REF256205150001 และส่งหนังสือยืนยันไปยังผู้ผลิตเหล็กแผ่นรีดร้อน', true),
        field('วิธีจัดทำ', '1. รวมรายชื่อผู้ผลิตจาก 4 หน่วยงาน\n2. ดูยอดรวมของแต่ละรายการ\n3. ใช้รายการที่ใหญ่ที่สุดเป็นรายชื่อหลัก\n4. ตรวจชื่อซ้ำจากการพิมพ์หรือบริษัทเดียวกันแต่คนละที่อยู่', true),
        field('หน่วยงาน', 'กรมโรงงานอุตสาหกรรม\nสถาบันเหล็กและเหล็กกล้าแห่งประเทศไทย\nสภาอุตสาหกรรมแห่งประเทศไทย\nสำนักงานเศรษฐกิจอุตสาหกรรม', true),
        field('วันที่ได้รับข้อมูล', '28/05/2562'),
        field('เลขที่หนังสือตอบกลับ', 'กรมโรงงานอุตสาหกรรม อก 1234/2562\nสถาบันเหล็กและเหล็กกล้า เหล็ก 88/2562\nสภาอุตสาหกรรมแห่งประเทศไทย อก. 56/2562\nสำนักงานเศรษฐกิจอุตสาหกรรม ศก. 210/2562', true),
        field('รายชื่อผู้ผลิต', 'ใช้รายชื่อที่มียอดใหญ่ที่สุดจาก 4 หน่วยงานเป็นรายชื่อหลัก แล้วตัดชื่อซ้ำจากการพิมพ์คนละแบบหรือบริษัทเดียวกันแต่คนละที่อยู่', true),
        field('กำลังการผลิตและปริมาณการผลิต', 'รวมกำลังการผลิตและปริมาณการผลิตปี 2561 ถึงต้นปี 2562 จากแบบที่หน่วยงานส่งกลับ', true),
        field('ปริมาณความต้องการใช้ภายในประเทศ', 'รวมปริมาณความต้องการใช้ภายในประเทศช่วงเดียวกับคำขอ เพื่อเทียบกับฐานะผู้ยื่น', true),
        field('จุดที่ข้อมูลยังไม่ครบ', 'หลักฐานราคาช่วงปลายปี 2561 ถึงต้นปี 2562\nปริมาณนำเข้าที่เชื่อมกับความเสียหาย\nรายชื่อผู้ผลิตที่ร่วมยื่นตามหนังสือมอบอำนาจ', true),
        field('สรุปที่นำไปใช้', 'ใช้รายชื่อหลักและยอดรวมนี้จัดทำแบบสอบถามเบื้องต้น และส่งหนังสือยืนยันไปยังผู้ผลิตเหล็กแผ่นรีดร้อน', true),
      ],
    },
    {
      title: 'Pre-questionnaire กลุ่มที่เกี่ยวข้อง',
      file: 'แบบสอบถามเบื้องต้น จาก Sum ข้อมูลจาก 4 หน่วยงาน',
      fields: [
        field('ชื่อแบบ', 'แบบสอบถามเบื้องต้น กลุ่มงานมาตรการตอบโต้การทุ่มตลาด (AD)'),
        field('กลุ่มผู้รับแบบ', 'ผู้ผลิตเหล็กแผ่นรีดร้อนในประเทศที่อยู่ในรายชื่อหลักจาก 4 หน่วยงาน'),
        field('คำขอ', 'REF256205150001 สินค้าเหล็กแผ่นรีดร้อนจากเวียดนามและอียิปต์'),
        field('วันที่จัดทำ', '28/05/2562'),
        field('ส่วนที่ 1 ฐานะผู้มีส่วนได้เสีย', 'เป็นผู้ผลิตในประเทศ ผู้ยื่นคำขอ หรือผู้ที่เกี่ยวข้องอย่างอื่น', true),
        field('ส่วนที่ 2 กำลังการผลิตและปริมาณการผลิต', 'กำลังการผลิตและปริมาณการผลิต ปี 2561 ถึงต้นปี 2562', true),
        field('ส่วนที่ 3 ราคา', 'หลักฐานราคาช่วงปลายปี 2561 ถึงต้นปี 2562 และช่วงเวลาที่ครอบคลุม', true),
        field('ส่วนที่ 4 ความเสียหาย', 'ปริมาณนำเข้าเชื่อมกับตัวชี้วัดความเสียหายอย่างไร', true),
        field('ส่วนที่ 5 ผู้ผลิตที่ร่วมยื่น', 'รายชื่อผู้ผลิตที่ร่วมยื่นครบตามหนังสือมอบอำนาจหรือไม่', true),
        field('ช่องทางส่งคำตอบ', 'ส่งกลับกองปกป้องและตอบโต้ทางการค้า พร้อมไฟล์แบบที่กรอกแล้ว'),
        field('ผู้จัดทำ', 'กลุ่มงานมาตรการตอบโต้การทุ่มตลาด (AD)'),
        field('กำหนดส่งคำตอบ', '20/06/2562'),
      ],
    },
  ];
}

const defaultNoticeGaps: DocGap[] = [
  { place: 'ส่วนที่ 4 ราคา', title: 'หลักฐานราคายังไม่ครอบคลุมช่วงเวลา', detail: 'ยังขาดราคาช่วงปลายปี 2561 ถึงต้นปี 2562' },
  { place: 'ส่วนที่ 5 ปริมาณและมูลค่า', title: 'ปริมาณนำเข้ายังไม่เชื่อมกับความเสียหาย', detail: 'ตัวเลขปริมาณนำเข้ายังอธิบายไม่ครบว่าเชื่อมกับความเสียหายอย่างไร' },
  { place: 'ส่วนที่ 3 ผู้ผลิตในประเทศ', title: 'รายชื่อผู้ผลิตที่ร่วมยื่นยังไม่ครบ', detail: 'รายชื่อยังไม่ครบตามหนังสือมอบอำนาจ' },
];

function gapSentence(gap: DocGap): string {
  const place = gap.place.trim();
  const rest = [gap.title.trim(), gap.detail.trim()].filter(Boolean).join(' ');
  if (place && rest) return `${place}: ${rest}`;
  return place || rest;
}

function noticeBody(action: DocAction, dueOn: string, gaps: DocGap[]): string {
  if (action === 'complete') return 'ด้วยกรมการค้าต่างประเทศได้ตรวจสอบคำขอเลขที่อ้างอิง REF256205150001 ของบริษัท สหวิริยาสตีลอินดัสตรี จำกัด แล้ว เห็นว่าคำขอและเอกสารประกอบครบถ้วนถูกต้อง';
  const lines = gaps.map((gap, index) => `${index + 1}. ${gapSentence(gap)}`).filter((line) => !line.endsWith('. ')).join('\n');
  if (action === 'late') return `ด้วยครบกำหนดแก้ไขเพิ่มเติมคำขอเมื่อ 15/09/2562 แล้วยังไม่ครบถ้วนถูกต้องในเรื่องดังนี้\n${lines}`;
  return `ด้วยกรมการค้าต่างประเทศได้ตรวจสอบคำขอเลขที่อ้างอิง REF256205150001 แล้ว ยังไม่ครบถ้วนดังนี้ จึงขอให้ส่งข้อมูลเพิ่มภายใน ${dueOn}\n${lines}`;
}

function noticeLetterFields(action: DocAction, noticedOn: string, dueOn: string, signer: string): WorkDraft['fields'] {
  const subject = action === 'complete'
    ? 'แจ้งผลการตรวจคำขอครบถ้วนถูกต้อง'
    : action === 'late'
      ? 'แจ้งคำขอไม่ครบถ้วนถูกต้องภายใน 4 เดือน'
      : 'แจ้งให้ส่งข้อมูลเพิ่มเติมคำขอตอบโต้การทุ่มตลาด';
  const body = noticeBody(action, dueOn, defaultNoticeGaps);
  return [
    field('ที่', 'กพ. / กองปกป้องและตอบโต้ทางการค้า'),
    field('วันที่', noticedOn),
    field('เรื่อง', subject),
    field('เรียน', 'บริษัท สหวิริยาสตีลอินดัสตรี จำกัด'),
    field('อ้างถึง', 'คำขอเลขที่อ้างอิง REF256205150001 ลงวันที่ 15/05/2562 เลขสารบรรณ สบ.1605/2562'),
    field('สิ่งที่ส่งมาด้วย', '-'),
    field('เนื้อความ', body, true),
    field('กำหนดส่งข้อมูล', action === 'complete' ? '-' : dueOn),
    field('ลงชื่อ', signer || 'นางสาวจรีณา กิจส่งเสริมกุล'),
  ];
}

function embassyLetterFields(on: string, signer: string): WorkDraft['fields'] {
  return [
    field('ที่', 'กพ. / กองปกป้องและตอบโต้ทางการค้า'),
    field('วันที่แจ้งเรื่อง', on),
    field('เรื่อง', 'แจ้งการรับคำขอให้พิจารณาตอบโต้การทุ่มตลาด'),
    field('เรียน', 'สถานเอกอัครราชทูตเวียดนามประจำประเทศไทย และสถานเอกอัครราชทูตอาหรับรีพับลิกแห่งอียิปต์ประจำประเทศไทย'),
    field('อ้างถึง', 'คำขอเลขที่อ้างอิง REF256205150001 เลขสารบรรณ สบ.1605/2562'),
    field('สิ่งที่ส่งมาด้วย', '-'),
    field('เนื้อความ', 'ด้วยคณะกรรมการได้พิจารณารับคำขอเลขที่อ้างอิง REF256205150001 ของบริษัท สหวิริยาสตีลอินดัสตรี จำกัด ให้ไต่สวนการทุ่มตลาดสินค้าเหล็กแผ่นรีดร้อนจากเวียดนามและอียิปต์ จึงขอแจ้งรัฐบาลประเทศผู้ส่งออกเพื่อทราบ หนังสือนี้เก็บไว้ในระบบและไม่ส่งให้ผู้ยื่นคำขอ', true),
    field('ลงชื่อ', signer || 'นางสาวจรีณา กิจส่งเสริมกุล'),
  ];
}

const agendaSections: { id: string; label: string; labels: string[] }[] = [
  { id: 'meet', label: 'การประชุม', labels: ['ครั้งที่ประชุม', 'เวลา', 'สถานที่'] },
  { id: 'item', label: 'ระเบียบวาระ', labels: ['ระเบียบวาระที่', 'เรื่อง'] },
  { id: 'facts', label: 'ข้อเท็จจริง', labels: ['ผู้ยื่นคำขอ', 'สินค้าที่ถูกพิจารณา', 'ประเทศแหล่งกำเนิด', 'วันที่ยื่นคำขอ', 'วันที่คำขอครบถ้วน', 'วันครบกำหนด 4 เดือน', 'สาระสำคัญ'] },
  { id: 'check', label: 'ผลการตรวจสอบ', labels: ['ผลการตรวจสอบความครบถ้วน', 'สถานะอุตสาหกรรมภายใน', 'หลักฐานการทุ่มตลาดและความเสียหาย'] },
  { id: 'propose', label: 'ข้อเสนอ', labels: ['ข้อกฎหมาย', 'ข้อเสนอฝ่ายเลขานุการ'] },
  { id: 'resolution', label: 'มติที่ประชุม', labels: ['มติที่ประชุม'] },
];

const inquiryPack: { step: 'agenda' | 'notice' | 'sign' | 'letters' | 'news' | 'hearing' | 'visit'; group: string; kind: string }[] = [
  { step: 'agenda', group: 'วาระ ทตอ. เปิดไต่สวน', kind: 'บันทึกขออนุมัติวาระ ทตอ. เปิดไต่สวน' },
  { step: 'agenda', group: 'วาระ ทตอ. เปิดไต่สวน', kind: 'วาระการประชุม ทตอ. เปิดไต่สวน' },
  { step: 'agenda', group: 'วาระ ทตอ. เปิดไต่สวน', kind: 'เอกสารแนบวาระ ทตอ. เปิดไต่สวน' },
  { step: 'agenda', group: 'วาระ ทตอ. เปิดไต่สวน', kind: 'Chairman’s Note เปิดไต่สวน' },
  { step: 'agenda', group: 'วาระ ทตอ. เปิดไต่สวน', kind: 'มติที่ประชุม ทตอ. เปิดไต่สวน' },
  { step: 'agenda', group: 'วาระ ทตอ. เปิดไต่สวน', kind: 'รายงานการประชุม ทตอ. เปิดไต่สวน' },
  { step: 'notice', group: 'ประกาศเปิดไต่สวน', kind: 'บันทึกให้ กม. ตรวจร่างประกาศ' },
  { step: 'notice', group: 'ประกาศเปิดไต่สวน', kind: 'ร่างประกาศกรมเปิดไต่สวน' },
  { step: 'notice', group: 'ประกาศเปิดไต่สวน', kind: 'ร่างประกาศ ทตอ. เรียกเก็บอากร' },
  { step: 'notice', group: 'ประกาศเปิดไต่สวน', kind: 'บันทึก กม. แจ้งตรวจร่างประกาศแล้ว' },
  { step: 'notice', group: 'ประกาศเปิดไต่สวน', kind: 'ประกาศกรมเปิดไต่สวนที่ กม. ตรวจสอบแล้ว' },
  { step: 'notice', group: 'ประกาศเปิดไต่สวน', kind: 'ประกาศ ทตอ. เรียกเก็บอากรที่ กม. ตรวจสอบแล้ว' },
  { step: 'sign', group: 'ลงนามและราชกิจจานุเบกษา', kind: 'บันทึก อธ. ลงนามประกาศกรมเปิดไต่สวน' },
  { step: 'sign', group: 'ลงนามและราชกิจจานุเบกษา', kind: 'ประกาศกรมเปิดไต่สวนที่ลงนามแล้ว' },
  { step: 'sign', group: 'ลงนามและราชกิจจานุเบกษา', kind: 'บันทึกปลัดเรียน รมว. ลงนามประกาศ ทตอ.' },
  { step: 'sign', group: 'ลงนามและราชกิจจานุเบกษา', kind: 'ประกาศ ทตอ. เรียกเก็บอากรที่ลงนามแล้ว' },
  { step: 'sign', group: 'ลงนามและราชกิจจานุเบกษา', kind: 'บันทึก อธ. ส่งประกาศลงราชกิจจานุเบกษา' },
  { step: 'sign', group: 'ลงนามและราชกิจจานุเบกษา', kind: 'หนังสือส่งราชกิจจานุเบกษา' },
  { step: 'sign', group: 'ลงนามและราชกิจจานุเบกษา', kind: 'หนังสือราชกิจจานุเบกษาแจ้งลงประกาศแล้ว' },
  { step: 'letters', group: 'หนังสือแจ้งผู้เกี่ยวข้อง', kind: 'บันทึกเรียน อธ. แจ้งเปิดไต่สวน' },
  { step: 'letters', group: 'หนังสือแจ้งผู้เกี่ยวข้อง', kind: 'หนังสือถึงสถานทูตเปิดไต่สวน' },
  { step: 'letters', group: 'หนังสือแจ้งผู้เกี่ยวข้อง', kind: 'หนังสือถึงผู้ส่งออกเปิดไต่สวน' },
  { step: 'letters', group: 'หนังสือแจ้งผู้เกี่ยวข้อง', kind: 'หนังสือถึง สพต./สคต. เปิดไต่สวน' },
  { step: 'letters', group: 'หนังสือแจ้งผู้เกี่ยวข้อง', kind: 'หนังสือแจ้งกรมศุลกากรเปิดไต่สวน' },
  { step: 'letters', group: 'หนังสือแจ้งผู้เกี่ยวข้อง', kind: 'หนังสือแจ้งผู้นำเข้าเปิดไต่สวน' },
  { step: 'letters', group: 'หนังสือแจ้งผู้เกี่ยวข้อง', kind: 'หนังสือแจ้งอุตสาหกรรมภายในเปิดไต่สวน' },
  { step: 'letters', group: 'หนังสือแจ้งผู้เกี่ยวข้อง', kind: 'หนังสือแจ้งสมาคมเปิดไต่สวน' },
  { step: 'news', group: 'ข่าวหนังสือพิมพ์', kind: 'ข่าวหนังสือพิมพ์ภาษาไทย' },
  { step: 'news', group: 'ข่าวหนังสือพิมพ์', kind: 'ข่าวหนังสือพิมพ์ภาษาอังกฤษ' },
  { step: 'hearing', group: 'แถลงการณ์', kind: 'หนังสือขอให้จัดแถลงการณ์เปิดไต่สวน' },
  { step: 'hearing', group: 'แถลงการณ์', kind: 'บันทึกขออนุมัติจัดแถลงการณ์' },
  { step: 'hearing', group: 'แถลงการณ์', kind: 'หนังสือแจ้งผู้เข้าร่วมแถลงการณ์' },
  { step: 'hearing', group: 'แถลงการณ์', kind: 'บันทึกรายงานผลการแถลงการณ์' },
  { step: 'hearing', group: 'แถลงการณ์', kind: 'สรุปผลการแถลงการณ์และรายชื่อผู้เข้าร่วม' },
  { step: 'visit', group: 'ตรวจในประเทศ', kind: 'บันทึกขออนุมัติตรวจข้อมูลในประเทศ' },
  { step: 'visit', group: 'ตรวจในประเทศ', kind: 'หนังสือแจ้งขอตรวจข้อมูลในประเทศ' },
  { step: 'visit', group: 'ตรวจในประเทศ', kind: 'บันทึกถึง สล. ยกเว้นการสแกนเข้างาน' },
  { step: 'visit', group: 'ตรวจในประเทศ', kind: 'บันทึกรายงานผลการตรวจข้อมูลในประเทศ' },
  { step: 'visit', group: 'ตรวจต่างประเทศ', kind: 'หนังสือแจ้งขอตรวจข้อมูลผู้ส่งออก' },
  { step: 'visit', group: 'ตรวจต่างประเทศ', kind: 'หนังสือยินยอมตรวจข้อมูลจากผู้ส่งออก' },
  { step: 'visit', group: 'ตรวจต่างประเทศ', kind: 'บันทึกขออนุมัติเดินทางตรวจข้อมูลต่างประเทศ' },
  { step: 'visit', group: 'ตรวจต่างประเทศ', kind: 'บันทึกแจ้งรัฐบาลประเทศผู้ส่งออก' },
  { step: 'visit', group: 'ตรวจต่างประเทศ', kind: 'บันทึกแจ้ง สพต./สคต. วันตรวจข้อมูล' },
];

const prelimPack: { step: 'sub' | 'tdc' | 'bond' | 'bondLetters' | 'dept' | 'deptLetters' | 'hearing'; group: string; kind: string }[] = [
  { step: 'sub', group: 'วาระอนุผลขั้นต้น', kind: 'บันทึกขออนุมัติวาระอนุพิจารณาผลขั้นต้น' },
  { step: 'sub', group: 'วาระอนุผลขั้นต้น', kind: 'วาระการประชุมอนุพิจารณาผลขั้นต้น' },
  { step: 'sub', group: 'วาระอนุผลขั้นต้น', kind: 'เอกสารแนบวาระอนุผลขั้นต้น' },
  { step: 'sub', group: 'วาระอนุผลขั้นต้น', kind: 'มติที่ประชุมอนุพิจารณาผลขั้นต้น' },
  { step: 'sub', group: 'วาระอนุผลขั้นต้น', kind: 'รายงานการประชุมอนุพิจารณาผลขั้นต้น' },
  { step: 'tdc', group: 'วาระ ทตอ. ผลขั้นต้น', kind: 'บันทึกขออนุมัติวาระ ทตอ. พิจารณาผลขั้นต้น' },
  { step: 'tdc', group: 'วาระ ทตอ. ผลขั้นต้น', kind: 'วาระการประชุม ทตอ. พิจารณาผลขั้นต้น' },
  { step: 'tdc', group: 'วาระ ทตอ. ผลขั้นต้น', kind: 'เอกสารแนบวาระ ทตอ. ผลขั้นต้น' },
  { step: 'tdc', group: 'วาระ ทตอ. ผลขั้นต้น', kind: 'Chairman’s Note ผลขั้นต้น' },
  { step: 'tdc', group: 'วาระ ทตอ. ผลขั้นต้น', kind: 'มติที่ประชุม ทตอ. พิจารณาผลขั้นต้น' },
  { step: 'tdc', group: 'วาระ ทตอ. ผลขั้นต้น', kind: 'รายงานการประชุม ทตอ. พิจารณาผลขั้นต้น' },
  { step: 'bond', group: 'ประกาศหลักประกันอากร', kind: 'ร่างประกาศ ทตอ. เรียกเก็บหลักประกันอากร' },
  { step: 'bond', group: 'ประกาศหลักประกันอากร', kind: 'บันทึกให้ กม. ตรวจร่างประกาศหลักประกันอากร' },
  { step: 'bond', group: 'ประกาศหลักประกันอากร', kind: 'บันทึก กม. แจ้งตรวจร่างประกาศหลักประกันอากรแล้ว' },
  { step: 'bond', group: 'ประกาศหลักประกันอากร', kind: 'บันทึกปลัดเรียน รมว. ลงนามประกาศหลักประกันอากร' },
  { step: 'bond', group: 'ประกาศหลักประกันอากร', kind: 'ประกาศ ทตอ. เรียกเก็บหลักประกันอากรที่ลงนามแล้ว' },
  { step: 'bond', group: 'ประกาศหลักประกันอากร', kind: 'บันทึก อธ. ส่งประกาศหลักประกันอากรลงราชกิจจานุเบกษา' },
  { step: 'bond', group: 'ประกาศหลักประกันอากร', kind: 'หนังสือส่งราชกิจจานุเบกษาประกาศหลักประกันอากร' },
  { step: 'bond', group: 'ประกาศหลักประกันอากร', kind: 'หนังสือราชกิจจานุเบกษาแจ้งลงประกาศหลักประกันอากรแล้ว' },
  { step: 'bondLetters', group: 'หนังสือแจ้งหลักประกัน', kind: 'บันทึก อธ. ลงนามหนังสือแจ้งหลักประกันอากร' },
  { step: 'bondLetters', group: 'หนังสือแจ้งหลักประกัน', kind: 'หนังสือแจ้งสถานทูตเรียกเก็บหลักประกันอากร' },
  { step: 'bondLetters', group: 'หนังสือแจ้งหลักประกัน', kind: 'หนังสือแจ้งผู้ส่งออกเรียกเก็บหลักประกันอากร' },
  { step: 'bondLetters', group: 'หนังสือแจ้งหลักประกัน', kind: 'หนังสือแจ้ง สพต./สคต. เรียกเก็บหลักประกันอากร' },
  { step: 'bondLetters', group: 'หนังสือแจ้งหลักประกัน', kind: 'หนังสือแจ้งกรมศุลกากรเรียกเก็บหลักประกันอากร' },
  { step: 'bondLetters', group: 'หนังสือแจ้งหลักประกัน', kind: 'หนังสือแจ้งผู้นำเข้าเรียกเก็บหลักประกันอากร' },
  { step: 'bondLetters', group: 'หนังสือแจ้งหลักประกัน', kind: 'หนังสือแจ้งอุตสาหกรรมภายในเรียกเก็บหลักประกันอากร' },
  { step: 'bondLetters', group: 'หนังสือแจ้งหลักประกัน', kind: 'หนังสือแจ้งสมาคมเรียกเก็บหลักประกันอากร' },
  { step: 'dept', group: 'ประกาศกรมผลขั้นต้น', kind: 'ร่างประกาศกรมผลการไต่สวนขั้นต้น' },
  { step: 'dept', group: 'ประกาศกรมผลขั้นต้น', kind: 'บันทึกให้ กม. ตรวจร่างประกาศกรมผลขั้นต้น' },
  { step: 'dept', group: 'ประกาศกรมผลขั้นต้น', kind: 'บันทึก กม. แจ้งตรวจร่างประกาศกรมผลขั้นต้นแล้ว' },
  { step: 'dept', group: 'ประกาศกรมผลขั้นต้น', kind: 'บันทึก อธ. ลงนามประกาศกรมผลขั้นต้น' },
  { step: 'dept', group: 'ประกาศกรมผลขั้นต้น', kind: 'ประกาศกรมผลการไต่สวนขั้นต้นที่ลงนามแล้ว' },
  { step: 'dept', group: 'ประกาศกรมผลขั้นต้น', kind: 'หนังสือส่งราชกิจจานุเบกษาประกาศกรมผลขั้นต้น' },
  { step: 'dept', group: 'ประกาศกรมผลขั้นต้น', kind: 'หนังสือราชกิจจานุเบกษาแจ้งลงประกาศกรมผลขั้นต้นแล้ว' },
  { step: 'dept', group: 'ประกาศกรมผลขั้นต้น', kind: 'Disclosures ฉบับปกปิดผลขั้นต้น' },
  { step: 'dept', group: 'ประกาศกรมผลขั้นต้น', kind: 'Disclosures ฉบับเปิดเผยผลขั้นต้น' },
  { step: 'deptLetters', group: 'หนังสือแจ้งประกาศกรม', kind: 'บันทึก อธ. ลงนามหนังสือแจ้งประกาศกรมผลขั้นต้น' },
  { step: 'deptLetters', group: 'หนังสือแจ้งประกาศกรม', kind: 'หนังสือแจ้งสถานทูตผลขั้นต้น' },
  { step: 'deptLetters', group: 'หนังสือแจ้งประกาศกรม', kind: 'หนังสือแจ้งผู้ส่งออกผลขั้นต้น' },
  { step: 'deptLetters', group: 'หนังสือแจ้งประกาศกรม', kind: 'หนังสือแจ้งผู้นำเข้าผลขั้นต้น' },
  { step: 'deptLetters', group: 'หนังสือแจ้งประกาศกรม', kind: 'หนังสือแจ้งอุตสาหกรรมภายในผลขั้นต้น' },
  { step: 'deptLetters', group: 'หนังสือแจ้งประกาศกรม', kind: 'หนังสือแจ้งสมาคมผลขั้นต้น' },
  { step: 'hearing', group: 'แถลงการณ์ผลขั้นต้น', kind: 'หนังสือขอให้จัดแถลงการณ์ผลขั้นต้น' },
  { step: 'hearing', group: 'แถลงการณ์ผลขั้นต้น', kind: 'บันทึกขออนุมัติจัดแถลงการณ์ผลขั้นต้น' },
  { step: 'hearing', group: 'แถลงการณ์ผลขั้นต้น', kind: 'หนังสือแจ้งผู้เข้าร่วมแถลงการณ์ผลขั้นต้น' },
  { step: 'hearing', group: 'แถลงการณ์ผลขั้นต้น', kind: 'บันทึกรายงานผลการแถลงการณ์ผลขั้นต้น' },
  { step: 'hearing', group: 'แถลงการณ์ผลขั้นต้น', kind: 'สรุปผลการแถลงการณ์ผลขั้นต้น' },
];

const draftFinalPack: { step: 'sub' | 'tdc' | 'letters' | 'hearing'; group: string; kind: string }[] = [
  { step: 'sub', group: 'วาระอนุร่างผลสิ้นสุด', kind: 'บันทึกขออนุมัติวาระอนุพิจารณาร่างผลสิ้นสุด' },
  { step: 'sub', group: 'วาระอนุร่างผลสิ้นสุด', kind: 'วาระการประชุมอนุพิจารณาร่างผลสิ้นสุด' },
  { step: 'sub', group: 'วาระอนุร่างผลสิ้นสุด', kind: 'เอกสารแนบวาระอนุร่างผลสิ้นสุด' },
  { step: 'sub', group: 'วาระอนุร่างผลสิ้นสุด', kind: 'มติที่ประชุมอนุพิจารณาร่างผลสิ้นสุด' },
  { step: 'sub', group: 'วาระอนุร่างผลสิ้นสุด', kind: 'รายงานการประชุมอนุพิจารณาร่างผลสิ้นสุด' },
  { step: 'tdc', group: 'วาระ ทตอ. ร่างผลสิ้นสุด', kind: 'บันทึกขออนุมัติวาระ ทตอ. พิจารณาร่างผลสิ้นสุด' },
  { step: 'tdc', group: 'วาระ ทตอ. ร่างผลสิ้นสุด', kind: 'วาระการประชุม ทตอ. พิจารณาร่างผลสิ้นสุด' },
  { step: 'tdc', group: 'วาระ ทตอ. ร่างผลสิ้นสุด', kind: 'เอกสารแนบวาระ ทตอ. ร่างผลสิ้นสุด' },
  { step: 'tdc', group: 'วาระ ทตอ. ร่างผลสิ้นสุด', kind: 'มติที่ประชุม ทตอ. พิจารณาร่างผลสิ้นสุด' },
  { step: 'tdc', group: 'วาระ ทตอ. ร่างผลสิ้นสุด', kind: 'Chairman’s Note ร่างผลสิ้นสุด' },
  { step: 'tdc', group: 'วาระ ทตอ. ร่างผลสิ้นสุด', kind: 'รายงานการประชุม ทตอ. พิจารณาร่างผลสิ้นสุด' },
  { step: 'letters', group: 'แจ้งร่างผลสิ้นสุด', kind: 'บันทึก อธ. ขออนุมัติ Disclosures และลงนามหนังสือแจ้งร่างผลสิ้นสุด' },
  { step: 'letters', group: 'แจ้งร่างผลสิ้นสุด', kind: 'หนังสือแจ้งสถานทูตร่างผลสิ้นสุด' },
  { step: 'letters', group: 'แจ้งร่างผลสิ้นสุด', kind: 'หนังสือแจ้งผู้ส่งออกร่างผลสิ้นสุด' },
  { step: 'letters', group: 'แจ้งร่างผลสิ้นสุด', kind: 'Disclosures ฉบับปกปิดร่างผลสิ้นสุด' },
  { step: 'letters', group: 'แจ้งร่างผลสิ้นสุด', kind: 'Disclosures ฉบับเปิดเผยร่างผลสิ้นสุด' },
  { step: 'letters', group: 'แจ้งร่างผลสิ้นสุด', kind: 'หนังสือแจ้งผู้นำเข้าร่างผลสิ้นสุด' },
  { step: 'letters', group: 'แจ้งร่างผลสิ้นสุด', kind: 'หนังสือแจ้งอุตสาหกรรมภายในร่างผลสิ้นสุด' },
  { step: 'letters', group: 'แจ้งร่างผลสิ้นสุด', kind: 'หนังสือแจ้งสมาคมร่างผลสิ้นสุด' },
  { step: 'hearing', group: 'แถลงการณ์ร่างผลสิ้นสุด', kind: 'เอกสารความเห็นฉบับเปิดเผยจากผู้นำเข้า' },
  { step: 'hearing', group: 'แถลงการณ์ร่างผลสิ้นสุด', kind: 'เอกสารความเห็นฉบับเปิดเผยจากอุตสาหกรรมภายใน' },
  { step: 'hearing', group: 'แถลงการณ์ร่างผลสิ้นสุด', kind: 'เอกสารความเห็นฉบับเปิดเผยจากผู้ส่งออก' },
  { step: 'hearing', group: 'แถลงการณ์ร่างผลสิ้นสุด', kind: 'เอกสารความเห็นฉบับเปิดเผยจากสมาคม' },
  { step: 'hearing', group: 'แถลงการณ์ร่างผลสิ้นสุด', kind: 'เอกสารความเห็นฉบับเปิดเผยจากสถานทูต' },
  { step: 'hearing', group: 'แถลงการณ์ร่างผลสิ้นสุด', kind: 'เอกสารความเห็นฉบับปกปิดร่างผลสิ้นสุด' },
  { step: 'hearing', group: 'แถลงการณ์ร่างผลสิ้นสุด', kind: 'บันทึกรายงานผลการแถลงการณ์ร่างผลสิ้นสุด' },
  { step: 'hearing', group: 'แถลงการณ์ร่างผลสิ้นสุด', kind: 'สรุปผลการแถลงการณ์ร่างผลสิ้นสุด' },
];

const finalResultPack: { step: 'sub' | 'tdc' | 'duty' | 'dutyLetters' | 'dept' | 'deptLetters'; group: string; kind: string }[] = [
  { step: 'sub', group: 'วาระอนุผลสิ้นสุด', kind: 'บันทึกขออนุมัติวาระอนุพิจารณาผลสิ้นสุด' },
  { step: 'sub', group: 'วาระอนุผลสิ้นสุด', kind: 'วาระการประชุมอนุพิจารณาผลสิ้นสุด' },
  { step: 'sub', group: 'วาระอนุผลสิ้นสุด', kind: 'เอกสารแนบวาระอนุผลสิ้นสุด' },
  { step: 'sub', group: 'วาระอนุผลสิ้นสุด', kind: 'มติที่ประชุมอนุพิจารณาผลสิ้นสุด' },
  { step: 'sub', group: 'วาระอนุผลสิ้นสุด', kind: 'รายงานการประชุมอนุพิจารณาผลสิ้นสุด' },
  { step: 'tdc', group: 'วาระ ทตอ. ผลสิ้นสุด', kind: 'บันทึกขออนุมัติวาระ ทตอ. พิจารณาผลสิ้นสุด' },
  { step: 'tdc', group: 'วาระ ทตอ. ผลสิ้นสุด', kind: 'วาระการประชุม ทตอ. พิจารณาผลสิ้นสุด' },
  { step: 'tdc', group: 'วาระ ทตอ. ผลสิ้นสุด', kind: 'เอกสารแนบวาระ ทตอ. ผลสิ้นสุด' },
  { step: 'tdc', group: 'วาระ ทตอ. ผลสิ้นสุด', kind: 'มติที่ประชุม ทตอ. พิจารณาผลสิ้นสุด' },
  { step: 'tdc', group: 'วาระ ทตอ. ผลสิ้นสุด', kind: 'Chairman’s Note ผลสิ้นสุด' },
  { step: 'tdc', group: 'วาระ ทตอ. ผลสิ้นสุด', kind: 'รายงานการประชุม ทตอ. พิจารณาผลสิ้นสุด' },
  { step: 'duty', group: 'ประกาศเรียกเก็บอากร', kind: 'ร่างประกาศ ทตอ. เรียกเก็บอากรผลสิ้นสุด' },
  { step: 'duty', group: 'ประกาศเรียกเก็บอากร', kind: 'บันทึกให้ กม. ตรวจร่างประกาศเรียกเก็บอากรผลสิ้นสุด' },
  { step: 'duty', group: 'ประกาศเรียกเก็บอากร', kind: 'บันทึก กม. แจ้งตรวจร่างประกาศเรียกเก็บอากรผลสิ้นสุดแล้ว' },
  { step: 'duty', group: 'ประกาศเรียกเก็บอากร', kind: 'บันทึกปลัดเรียน รมว. ลงนามประกาศเรียกเก็บอากรผลสิ้นสุด' },
  { step: 'duty', group: 'ประกาศเรียกเก็บอากร', kind: 'ประกาศ ทตอ. เรียกเก็บอากรผลสิ้นสุดที่ลงนามแล้ว' },
  { step: 'duty', group: 'ประกาศเรียกเก็บอากร', kind: 'บันทึก อธ. ส่งประกาศเรียกเก็บอากรผลสิ้นสุดลงราชกิจจานุเบกษา' },
  { step: 'duty', group: 'ประกาศเรียกเก็บอากร', kind: 'หนังสือส่งราชกิจจานุเบกษาประกาศเรียกเก็บอากรผลสิ้นสุด' },
  { step: 'duty', group: 'ประกาศเรียกเก็บอากร', kind: 'หนังสือราชกิจจานุเบกษาแจ้งลงประกาศเรียกเก็บอากรผลสิ้นสุดแล้ว' },
  { step: 'dutyLetters', group: 'หนังสือแจ้งอากร', kind: 'บันทึก อธ. ลงนามหนังสือแจ้งเรียกเก็บอากรผลสิ้นสุด' },
  { step: 'dutyLetters', group: 'หนังสือแจ้งอากร', kind: 'หนังสือแจ้งสถานทูตเรียกเก็บอากรผลสิ้นสุด' },
  { step: 'dutyLetters', group: 'หนังสือแจ้งอากร', kind: 'หนังสือแจ้งผู้ส่งออกเรียกเก็บอากรผลสิ้นสุด' },
  { step: 'dutyLetters', group: 'หนังสือแจ้งอากร', kind: 'หนังสือแจ้งกรมศุลกากรเรียกเก็บอากรผลสิ้นสุด' },
  { step: 'dutyLetters', group: 'หนังสือแจ้งอากร', kind: 'หนังสือแจ้งสถานทูตไทยเรียกเก็บอากรผลสิ้นสุด' },
  { step: 'dutyLetters', group: 'หนังสือแจ้งอากร', kind: 'หนังสือแจ้งผู้นำเข้าเรียกเก็บอากรผลสิ้นสุด' },
  { step: 'dutyLetters', group: 'หนังสือแจ้งอากร', kind: 'หนังสือแจ้งอุตสาหกรรมภายในเรียกเก็บอากรผลสิ้นสุด' },
  { step: 'dutyLetters', group: 'หนังสือแจ้งอากร', kind: 'หนังสือแจ้งสมาคมเรียกเก็บอากรผลสิ้นสุด' },
  { step: 'dept', group: 'ประกาศกรมผลสิ้นสุด', kind: 'ร่างประกาศกรมผลการไต่สวนขั้นสุดท้าย' },
  { step: 'dept', group: 'ประกาศกรมผลสิ้นสุด', kind: 'บันทึกให้ กม. ตรวจร่างประกาศกรมผลสิ้นสุด' },
  { step: 'dept', group: 'ประกาศกรมผลสิ้นสุด', kind: 'บันทึก กม. แจ้งตรวจร่างประกาศกรมผลสิ้นสุดแล้ว' },
  { step: 'dept', group: 'ประกาศกรมผลสิ้นสุด', kind: 'บันทึก อธ. ลงนามประกาศกรมผลสิ้นสุด' },
  { step: 'dept', group: 'ประกาศกรมผลสิ้นสุด', kind: 'ประกาศกรมผลการไต่สวนขั้นสุดท้ายที่ลงนามแล้ว' },
  { step: 'dept', group: 'ประกาศกรมผลสิ้นสุด', kind: 'หนังสือส่งราชกิจจานุเบกษาประกาศกรมผลสิ้นสุด' },
  { step: 'dept', group: 'ประกาศกรมผลสิ้นสุด', kind: 'หนังสือราชกิจจานุเบกษาแจ้งลงประกาศกรมผลสิ้นสุดแล้ว' },
  { step: 'dept', group: 'ประกาศกรมผลสิ้นสุด', kind: 'Disclosures ฉบับปกปิดผลสิ้นสุด' },
  { step: 'dept', group: 'ประกาศกรมผลสิ้นสุด', kind: 'Disclosures ฉบับเปิดเผยผลสิ้นสุด' },
  { step: 'deptLetters', group: 'หนังสือแจ้งประกาศกรมผลสิ้นสุด', kind: 'บันทึก อธ. ลงนามหนังสือแจ้งประกาศกรมผลสิ้นสุด' },
  { step: 'deptLetters', group: 'หนังสือแจ้งประกาศกรมผลสิ้นสุด', kind: 'หนังสือแจ้งสถานทูตผลสิ้นสุด' },
  { step: 'deptLetters', group: 'หนังสือแจ้งประกาศกรมผลสิ้นสุด', kind: 'หนังสือแจ้งผู้ส่งออกผลสิ้นสุด' },
  { step: 'deptLetters', group: 'หนังสือแจ้งประกาศกรมผลสิ้นสุด', kind: 'หนังสือแจ้งผู้นำเข้าผลสิ้นสุด' },
  { step: 'deptLetters', group: 'หนังสือแจ้งประกาศกรมผลสิ้นสุด', kind: 'หนังสือแจ้งอุตสาหกรรมภายในผลสิ้นสุด' },
  { step: 'deptLetters', group: 'หนังสือแจ้งประกาศกรมผลสิ้นสุด', kind: 'หนังสือแจ้งสมาคมผลสิ้นสุด' },
];

const measurePack: { step: 'm56' | 'm57' | 'm58' | 'm59'; group: string; kind: string }[] = [
  { step: 'm56', group: 'มาตรา 56', kind: 'บันทึกขออนุมัติวาระทบทวนมาตรา 56' },
  { step: 'm56', group: 'มาตรา 56', kind: 'วาระการประชุม ทตอ. ทบทวนมาตรา 56' },
  { step: 'm56', group: 'มาตรา 56', kind: 'เอกสารแนบวาระมาตรา 56' },
  { step: 'm56', group: 'มาตรา 56', kind: 'มติที่ประชุม ทตอ. มาตรา 56' },
  { step: 'm56', group: 'มาตรา 56', kind: 'รายงานการประชุม ทตอ. มาตรา 56' },
  { step: 'm56', group: 'มาตรา 56', kind: 'หนังสือแจ้งผลการทบทวนมาตรา 56' },
  { step: 'm57', group: 'มาตรา 57', kind: 'บันทึกขออนุมัติวาระทบทวนมาตรา 57' },
  { step: 'm57', group: 'มาตรา 57', kind: 'วาระการประชุม ทตอ. ทบทวนมาตรา 57' },
  { step: 'm57', group: 'มาตรา 57', kind: 'เอกสารแนบวาระมาตรา 57' },
  { step: 'm57', group: 'มาตรา 57', kind: 'มติที่ประชุม ทตอ. มาตรา 57' },
  { step: 'm57', group: 'มาตรา 57', kind: 'รายงานการประชุม ทตอ. มาตรา 57' },
  { step: 'm57', group: 'มาตรา 57', kind: 'หนังสือแจ้งผลการทบทวนมาตรา 57' },
  { step: 'm58', group: 'มาตรา 58', kind: 'บันทึกขออนุมัติวาระทบทวนมาตรา 58' },
  { step: 'm58', group: 'มาตรา 58', kind: 'บันทึกตรวจความเกี่ยวข้องผู้ผลิตรายใหม่' },
  { step: 'm58', group: 'มาตรา 58', kind: 'วาระการประชุม ทตอ. ทบทวนมาตรา 58' },
  { step: 'm58', group: 'มาตรา 58', kind: 'มติที่ประชุม ทตอ. มาตรา 58' },
  { step: 'm58', group: 'มาตรา 58', kind: 'รายงานการประชุม ทตอ. มาตรา 58' },
  { step: 'm58', group: 'มาตรา 58', kind: 'หนังสือแจ้งผลการทบทวนมาตรา 58' },
  { step: 'm59', group: 'มาตรา 59', kind: 'บันทึกขออนุมัติวาระพิจารณาคืนอากร' },
  { step: 'm59', group: 'มาตรา 59', kind: 'บันทึกตรวจหลักฐานผู้นำเข้าขอคืนอากร' },
  { step: 'm59', group: 'มาตรา 59', kind: 'วาระการประชุม ทตอ. มาตรา 59' },
  { step: 'm59', group: 'มาตรา 59', kind: 'มติที่ประชุม ทตอ. มาตรา 59' },
  { step: 'm59', group: 'มาตรา 59', kind: 'รายงานการประชุม ทตอ. มาตรา 59' },
  { step: 'm59', group: 'มาตรา 59', kind: 'หนังสือแจ้งผลการคืนอากร' },
];

function agendaFieldList(): { label: string; value: string; long?: boolean }[] {
  return [
    field('ครั้งที่ประชุม', '1/2562'),
    field('เวลา', '09.30 น.'),
    field('สถานที่', 'ห้องประชุม กรมการค้าต่างประเทศ กระทรวงพาณิชย์'),
    field('ระเบียบวาระที่', '3.3'),
    field('เรื่อง', 'การพิจารณาคำขอให้เปิดไต่สวนตอบโต้การทุ่มตลาด กรณีสินค้าเหล็กแผ่นรีดร้อนชนิดเป็นม้วนและไม่เป็นม้วน ที่มีแหล่งกำเนิดจากเวียดนามและอียิปต์', true),
    field('ผู้ยื่นคำขอ', 'บริษัท สหวิริยาสตีลอินดัสตรี จำกัด'),
    field('สินค้าที่ถูกพิจารณา', 'เหล็กแผ่นรีดร้อนชนิดเป็นม้วนและไม่เป็นม้วน'),
    field('ประเทศแหล่งกำเนิด', 'เวียดนาม และอียิปต์'),
    field('วันที่ยื่นคำขอ', '15/05/2562'),
    field('วันที่คำขอครบถ้วน', '28/05/2562'),
    field('วันครบกำหนด 4 เดือน', '15/09/2562'),
    field('สาระสำคัญ', 'ผู้ยื่นขอดำเนินการตอบโต้การทุ่มตลาดสินค้าเหล็กแผ่นรีดร้อนชนิดเป็นม้วนและไม่เป็นม้วน จากเวียดนามและอียิปต์', true),
    field('ผลการตรวจสอบความครบถ้วน', 'คำขอครบถ้วนถูกต้องเมื่อ 28/05/2562 อยู่ภายในกำหนด 4 เดือนซึ่งครบวันที่ 15/09/2562', true),
    field('สถานะอุตสาหกรรมภายใน', 'ผู้ยื่นและผู้ผลิตที่สนับสนุนมีปริมาณการผลิตรวมมากกว่าร้อยละ 25 ของสินค้าชนิดเดียวกันในประเทศ', true),
    field('หลักฐานการทุ่มตลาดและความเสียหาย', 'มีหลักฐานเบื้องต้นเรื่องส่วนเหลื่อมการทุ่มตลาดและความเสียหายของอุตสาหกรรมภายในเพียงพอให้พิจารณาเปิดไต่สวน', true),
    field('ข้อกฎหมาย', 'พระราชบัญญัติการตอบโต้การทุ่มตลาดและการอุดหนุนซึ่งสินค้าจากต่างประเทศ พ.ศ. 2542 มาตรา 39', true),
    field('ข้อเสนอฝ่ายเลขานุการ', 'เห็นควรรับคำขอและเปิดไต่สวน', true),
    field('มติที่ประชุม', ''),
  ];
}

function defaultReplyFiles(): ReplyFile[] {
  return [
    { name: 'แบบปร1-ฉบับปกปิด-แก้ไข.pdf', title: 'แบบ ปร.1 ฉบับปกปิด (แก้ไข)', group: 'closed' },
    { name: 'หลักฐานราคา-2561-2562.pdf', title: 'หลักฐานราคาช่วงปลายปี 2561 ถึงต้นปี 2562', group: 'extra' },
    { name: 'แบบปร1-ฉบับเปิดเผย-แก้ไข.pdf', title: 'แบบ ปร.1 ฉบับเปิดเผย (แก้ไข)', group: 'open' },
    { name: 'หนังสือขอขยายเวลา.pdf', title: 'หนังสือขอขยายเวลา', group: 'extend' },
  ];
}

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
  imports: [TopHeader, SideNav, DftButton, NgTemplateOutlet, StatusTag, DftModal, ThaiDateField, InputField, FilledUpload, FilingTabs],
  templateUrl: './por1-page.html',
  styleUrl: './por1-page.css',
})
export class Por1Page {
  private readonly guide = inject(FilingAiContext);
  private readonly accounts = inject(Accounts);
  private readonly view = inject(ChangeDetectorRef);
  private guideField = '';
  protected readonly toc = toc;
  protected refId = filingRefId;
  protected section = '1';
  protected anchor = 'part-1-1';
  protected measure = cvdChosen() ? 'subsidy' : 'dumping';

  protected get measureLocked(): boolean {
    if (this.reviewRole) return false;
    return this.pickedMeasure() !== '';
  }

  protected get filingLead(): string {
    if (this.measureLocked && this.measure === 'subsidy') return 'แบบคำขอให้ดำเนินการพิจารณาตอบโต้การอุดหนุน';
    if (this.measureLocked) return 'แบบคำขอให้ดำเนินการพิจารณาตอบโต้การทุ่มตลาด';
    return 'แบบคำขอให้ดำเนินการพิจารณาตอบโต้การทุ่มตลาดหรือการอุดหนุน';
  }

  private pickedMeasure(): 'ad' | 'cvd' | '' {
    const query = this.router.parseUrl(this.router.url).queryParams['measure'];
    if (query === 'cvd') return 'cvd';
    if (query === 'ad') return 'ad';
    const intent = readFilingIntent()?.measure;
    if (intent === 'มาตราการ CVD') return 'cvd';
    if (intent === 'มาตราการ AD') return 'ad';
    return '';
  }
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
  protected filedOn = '15/05/2562';
  protected amendUntil = addThaiMonths(this.filedOn, 4);
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
  protected notice: 'draft' | 'submitted' | 'saved' | 'etr' | 'docs' | 'assist' | 'check' | 'reply' | 'suggest' | null = null;
  protected submitting = false;
  private submitTimer = 0;
  private reviewTimer = 0;
  protected reviewLeft = 10;
  protected approvalLeft = 10;
  protected consultOpen = false;
  protected consultFormal = false;
  protected sideTalk = false;
  protected readonly officerName = filingOfficer;

  protected get consultOfficerName(): string {
    return readWorkAssignment().hands.at(-1)?.name || this.officerName;
  }
  protected approvedBy = readApprovedBy();
  protected readonly officerUnit = filingUnit;
  protected officialOpen = false;
  protected filingGate: FilingGate | null = readFilingGate();
  protected filingDecision: 'approve' | 'reject' = 'approve';
  protected filingReason = '';
  protected consult: ConsultRequest | null = readConsult();
  protected consultTopic = 'ขอปรึกษาการแก้ไขคำขอ';
  protected consultDetail = 'รายการที่ยังไม่ผ่านมีหลักฐานราคา ตัวชี้วัดความเสียหาย และรายชื่อผู้ผลิตในประเทศ ต้องการให้นัดหมายเพื่อชี้แจงก่อนส่งแบบคำร้องทางการ';
  protected consultWhen = '16/05/2562 10:00';
  protected consultChannel: 'phone' | 'online' | 'onsite' | '' = '';
  protected consultNotes: ConsultNote[] = readConsultThread();
  protected consultAssigned = readConsultAssigned();
  private readonly consultJobKey = 'dft-por1-consult-jobs';
  protected consultClosed: { at: string } | null = this.readConsultClosed();
  protected consultJobs: ConsultGroupJob[] = this.readConsultJobs();
  protected consultForm: ConsultForm = '';
  protected consultPickGroups: string[] = [];
  protected consultPickOfficers: string[] = [];
  protected officerListOpen = false;
  protected officerQuery = '';

  protected filteredMembers(group: string) {
    const query = this.officerQuery.trim();
    return this.membersOf(group).filter((person) => !query || person.name.includes(query));
  }

  protected officerPickText(): string {
    if (!this.consultPickOfficers.length) return 'เลือกเจ้าหน้าที่';
    if (this.consultPickOfficers.length <= 2) return this.consultPickOfficers.join(', ');
    return `เลือกแล้ว ${this.consultPickOfficers.length} คน`;
  }
  protected consultReceipt: 'accept' | 'return' = 'accept';
  protected consultMove: DutyMove = 'report';
  protected consultSigned = false;
  protected resultSigned = false;
  protected consultOrder = '';
  protected consultAssignedOn = '16/05/2562';
  protected consultDueOn = '30/05/2562';
  protected consultDueTime = '14:28';
  protected consultRemind = false;
  protected consultFiles: AssignFile[] = [];
  protected resultDetail = '';
  protected resultFiles: AssignFile[] = [];
  protected consultPlan: ConsultPlan | null = readConsultPlan();

  protected get channelText(): string {
    return consultChannelLabel(this.consultPlan);
  }

  protected get consultByChat(): boolean {
    const channels = this.consultPlan?.channels;
    if (!channels?.length) return true;
    return channels.includes('chat');
  }
  protected consultDraft = '';
  protected pendingFiles: { name: string; image?: string }[] = [];
  protected caseStatus: CaseStatus = readCaseStatus();
  protected viewingForm = false;
  protected revising = false;
  protected openedRound: FilingRound | null = null;
  protected historyView: 'files' | 'form' | null = null;
  protected expandedRound = 0;
  protected fixesOpen = true;
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
  private readonly thirdFindings: RoundFinding[] = [
    { place: 'ส่วนที่ 8 ความเสียหาย', title: 'คำอธิบายความเสียหายยังไม่ครบเงื่อนไข', detail: 'ยังอธิบายไม่ครบว่าความเสียหายเชื่อมกับสินค้าที่ขอยื่นอย่างไร', action: 'ปรับข้อมูล' },
  ];
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  protected readonly reviewRole = (this.route.snapshot.data['review'] as string) || '';
  protected readonly staffGroups = staffGroups;
  protected reviewTab: ReviewTab = 'form';
  protected laterPhase: LaterPhase = { visit: false, prelim: false, draftFinal: false, finalResult: false, measures: false, marks: {}, notes: {} };
  protected flowPick: Record<string, '' | 'yes' | 'no'> = {};
  protected flowView = '';
  protected flowValues: Record<string, string> = {};
  protected partyName = '';
  protected partyOrg = '';
  protected partyCount = '';
  protected hearingMemo = '';
  protected hearingWhen = '';
  protected hearingPlaceLane = '';
  protected hearingSummary = '';
  protected hearingPeople = '';
  protected hearingOffice: '' | 'approve' | 'return' = '';
  protected visitDomestic = false;
  protected visitForeign = false;
  protected normalValue = '';
  protected exportPrice = '';
  protected dumpingMargin = '';
  protected visitRows: { name: string; normalValue: string; exportPrice: string; compare: string; margin: string }[] = [
    { name: 'ผู้ผลิตและผู้ส่งออกเวียดนาม', normalValue: '', exportPrice: '', compare: '', margin: '' },
    { name: 'ผู้ผลิตและผู้ส่งออกอียิปต์', normalValue: '', exportPrice: '', compare: '', margin: '' },
  ];
  protected injuryVolume = '';
  protected injuryPrice = '';
  protected injuryPerformance = '';
  protected injuryCustoms = '';
  protected injuryLink = '';
  protected visitDataOk: '' | 'yes' | 'no' = '';
  protected visitMoreNote = '';
  protected prelimPart: 'sub' | 'tdc' | 'bond' | 'bondLetters' | 'dept' | 'deptLetters' | 'hearing' | 'close' = 'sub';
  protected prelimOn = '20/08/2562';
  protected prelimHearing: '' | 'yes' | 'no' = '';
  protected prelimAgain: '' | 'yes' | 'no' = '';
  protected draftPart: 'sub' | 'tdc' | 'letters' | 'hearing' | 'close' = 'sub';
  protected draftOn = '15/10/2562';
  protected draftSubstance: '' | 'yes' | 'no' = '';
  protected finalPart: 'sub' | 'tdc' | 'duty' | 'dutyLetters' | 'dept' | 'deptLetters' | 'close' = 'sub';
  protected finalOn = '20/12/2562';
  protected measurePart: 'm56' | 'm57' | 'm58' | 'm59' | 'close' = 'm56';
  protected measureOn = '15/06/2563';
  protected measure56: '' | 'yes' | 'no' = '';
  protected measure57: '' | 'yes' | 'no' = '';
  protected measure58: '' | 'yes' | 'no' = '';
  protected measure59: '' | 'yes' | 'no' = '';
  protected workDocs: WorkDraft[] = defaultWorkDrafts();
  protected madeDocs: MadeDoc[] = [];
  protected editingId = '';
  protected viewingMade: MadeDoc | null = null;
  protected docGaps: DocGap[] = defaultNoticeGaps.map((gap) => ({ ...gap }));
  protected docAction: DocAction = 'amend';
  protected docNoticedOn = '20/05/2562';
  protected docDueOn = '20/06/2562';
  protected docNote = 'ขอเพิ่มหลักฐานราคาช่วงปลายปี 2561 ถึงต้นปี 2562 ปริมาณนำเข้าที่เชื่อมกับความเสียหาย และรายชื่อผู้ผลิตที่ร่วมยื่น';
  protected noticeLetter = noticeLetterFields('amend', '20/05/2562', '20/06/2562', '');
  protected replyKind: 'fix' | 'extend' = 'fix';
  protected amendReason = 'ต้องรวบรวมหลักฐานราคาช่วงปลายปี 2561 ถึงต้นปี 2562 จากผู้ผลิตที่ร่วมยื่น';
  protected replyNewDue = '20/07/2562';
  protected replyLetterDate = '22/05/2562';
  protected replyLetterNo = 'สห.2205/2562';
  protected replyLetterTo = 'อธิบดีกรมการค้าต่างประเทศ';
  protected replyLetterSubject = 'ส่งคำขอที่แก้ไขเพิ่มเติม เลขที่อ้างอิง REF256205150001';
  protected replyLetterBody = 'บริษัท สหวิริยาสตีลอินดัสตรี จำกัด ขอส่งคำขอที่แก้ไขเพิ่มเติม ตามหนังสือแจ้งลงวันที่ 20/05/2562 ได้แก่ หลักฐานราคา ปริมาณนำเข้าที่เชื่อมกับความเสียหาย และรายชื่อผู้ผลิตที่ร่วมยื่น';
  protected replyFiles: ReplyFile[] = defaultReplyFiles();
  protected replySent = false;
  protected replyAt = '';
  protected viewingReply: ReplyFile | null = null;
  protected noticePasses: NoticePass[] = [];
  protected noticeSaraban = '';
  protected committeeAt = '05/06/2562';
  protected committeeResult: 'take' | 'reject' = 'take';
  protected committeeFee: 'pay' | 'skip' | '' = 'pay';
  protected committeeNote = '';
  protected committeeEmbassyOn = '05/06/2562';
  protected embassyFiles: { name: string; title: string; sentOn: string; docId: string }[] = [];
  protected embassyLetter = embassyLetterFields('05/06/2562', '');
  protected embassyNotice = false;
  protected inquiryAgendaAt = '10/06/2562';
  protected inquiryAgenda = '';
  protected inquiryFields = agendaFieldList();
  protected readonly agendaSections = agendaSections;
  protected agendaPart = 0;
  protected inquiryAgendaFiles: { name: string; title: string; sentOn: string; docId: string }[] = [];
  protected inquiryDecide: 'take' | 'return' | '' = '';
  protected inquiryFeeAmount = '10,000';
  protected inquiryFeeDue = '24/06/2562';
  protected inquiryFeeSent = false;
  protected inquiryPayFiles: InquiryPayFile[] = [];
  protected inquiryPaySent = false;
  protected inquiryPayAck = false;
  protected inquiryOpen: 'open' | 'close' | '' = '';
  protected inquiryOpenAt = '10/06/2562';
  protected inquiryCaseId = '';
  protected inquiryCloseNote = '';
  protected inquiryAgendaDone = false;
  protected inquiryReturned = false;
  protected inquirySentBy = '';
  protected inquiryPart: InquiryStep = 'agenda';
  protected inquiryDecideDraft: 'take' | 'return' | '' = '';
  protected inquiryNoticeOn = '25/06/2562';
  protected inquiryNoticeSent = false;
  protected inquiryHearing: '' | 'hold' | 'skip' = '';
  protected inquiryHearingDraft: '' | 'hold' | 'skip' = '';
  protected inquiryHearingOn = '10/07/2562';
  protected inquiryHearingPlace = '';
  protected inquiryHearingDocId = '';
  protected inquiryNoticeFiles: InquiryIssued[] = [];
  protected inquiryLoop: InquiryLoopKind = 'form';
  protected inquiryPaperId: InquiryQuestion['id'] | '' = 'importer';
  protected inquiryPaperNote = '';
  protected inquiryPaperOn = '20/07/2562';
  protected inquiryPaperDue = '20/08/2562';
  protected inquiryQuestions: InquiryQuestion[] = defaultInquiryQuestions();
  protected readonly inquiryNotices = [
    { name: 'สถานทูตประเทศที่ถูกกล่าวหา', channel: 'หนังสือ' },
    { name: 'ผู้ส่งออก', channel: 'หนังสือ' },
    { name: 'สำนักงานส่งเสริมการค้าในต่างประเทศ', channel: 'หนังสือ' },
    { name: 'กรมศุลกากร', channel: 'หนังสือ' },
    { name: 'ผู้นำเข้า/ผู้ใช้', channel: 'หนังสือ ปค.' },
    { name: 'อุตสาหกรรมภายใน', channel: 'หนังสือ ปค.' },
    { name: 'สมาคม', channel: 'หนังสือ ปค.' },
    { name: 'หนังสือพิมพ์ภาษาไทย', channel: 'ประกาศ' },
    { name: 'หนังสือพิมพ์ภาษาอังกฤษ', channel: 'ประกาศ' },
    { name: 'ราชกิจจานุเบกษาและเว็บไซต์กอง', channel: 'เผยแพร่' },
  ];
  protected committeeSent = false;
  protected committeeSentBy = '';
  protected docFiles: NoticeFile[] = [{ name: 'หนังสือแจ้งแก้ไข.pdf', title: 'หนังสือแจ้งขอข้อมูลเพิ่ม', sentOn: '20/05/2562' }];
  protected docSent = false;
  protected docSentBy = '';
  protected links: SystemLink[] = readSystemLinks();
  protected linkLog: SystemLink | null = null;
  protected linkLogError = false;
  protected readonly filingSaraban = 'สบ.1605/2562';
  protected readonly etrRefNo = 'ETR256205170001';
  protected assignMode: 'group' | 'person' = 'group';
  protected assignOpen = false;
  protected bureau = 'กองปกป้องและตอบโต้ทางการค้า';
  protected pickedPeople: string[] = [];
  protected pickedGroups: string[] = [];
  protected draftPeople: string[] = [];
  protected draftGroups: string[] = [];
  protected personQuery = '';
  protected assignNote = '';
  protected assignOrder = '';
  protected assignedOn = '';
  protected dueOn = '';
  protected assignReply: AssignReply = 'pending';
  protected replyDraft: '' | 'accept' | 'return' = '';
  protected replyReason = '';
  protected groupTasks: GroupTask[] = [];
  protected groupReturning = '';
  protected groupReason = '';
  protected hands: PersonHand[] = [];
  protected slips: AssignSlip[] = [];
  protected slipReceipt: 'accept' | 'return' = 'accept';
  protected slipKind: 'report' | 'forward' = 'forward';
  protected slipAssignedOn = '';
  protected slipDueOn = '';
  protected slipDueTime = '';
  protected slipRemind = true;
  protected slipOrder = '';
  protected slipFiles: AssignFile[] = [];
  protected slipPeople: string[] = [];
  protected forwardPick: string[] = [];
  protected handReturning = '';
  protected handReason = '';
  protected receipt: ReceiptRecord | null = readReceipt();
  protected officeLink: OfficeLink | null = null;
  protected ack = true;
  protected signer = 'นายประกิต กาญจนการไกร';
  protected roleTitle = 'ผู้จัดการสำนักรัฐกิจสัมพันธ์ ผู้รับมอบอำนาจ';
  protected signedOn = '15/05/2562';

  protected closeHistory(): void {
    this.historyOpen = false;
    this.historyFull = false;
  }

  protected get historyItems(): HistoryItem[] {
    const base = this.historyTab === 'activity' ? this.historyActivity : this.historyVersions;
    if (this.historyTab !== 'activity') return base;
    const items = [...base];
    if (this.receipt) {
      const received: HistoryItem = {
        phase: 'การลงรับ',
        title: 'ลงรับจากระบบสารบรรณ',
        when: `${this.receipt.sarabanDate} · ${this.receipt.sarabanTime} น.`,
        detail: `เลขที่ลงรับ ${this.receipt.sarabanNo} เรื่อง${this.receipt.subject} เลขที่หนังสือ ${this.receipt.letterNo} วันที่หนังสือ ${this.receipt.letterDate}`,
        label: 'ลงรับ',
        tone: 'info',
      };
      const filed = items.findIndex((item) => item.title === 'ยื่นครั้งแรก');
      items.splice(filed + 1, 0, received);
    }
    return this.withWorkHistory(items);
  }

  private withWorkHistory(items: HistoryItem[]): HistoryItem[] {
    const work = this.slips.map((slip) => ({
      phase: 'การมอบหมาย',
      title: `${slip.from} มอบหมายให้ ${slip.to}`,
      when: slip.assignedOn || '16/05/2562',
      detail: `${this.receiptText(slip.receipt)} · ${this.kindText(slip.kind)} · กำหนดส่ง ${slip.dueOn}${slip.dueTime ? ` ${slip.dueTime} น.` : ''} · ${slip.order}`,
      label: slip.receipt === 'return' ? 'ส่งคืน' : 'มอบหมาย',
      tone: slip.receipt === 'return' ? 'warning' as const : 'info' as const,
    }));
    const linked = this.links.find((row) => row.system === 'eTR' && row.state === 'success');
    const sent = linked
      ? [{
          phase: 'การเชื่อมโยงระบบ',
          title: 'ได้รับ Ref Case ID (eTR)',
          when: linked.at,
          detail: linked.detail,
          label: 'เชื่อมแล้ว',
          tone: 'success' as const,
        }]
      : [];
    const checked = this.docSent
      ? [{
          phase: 'การตรวจสอบเอกสาร',
          title: this.docActionLabel(this.docAction),
          when: this.docNoticedOn,
          detail: `${this.docNote} ครบกำหนด ${this.docDueOn} ส่งทางอีเมลและ e-Office แล้ว${this.replySent ? ` · ผู้ยื่น${this.replyKind === 'extend' ? 'ขอขยายเวลาถึง ' + this.replyNewDue : 'ส่งคำขอที่แก้ไขแล้ว'} เมื่อ ${this.replyAt}` : ''}`,
          label: this.docAction === 'amend' ? 'ขอเพิ่ม' : 'ตรวจแล้ว',
          tone: this.docAction === 'amend' ? 'warning' as const : 'success' as const,
        }]
      : [];
    return [...items, ...work, ...sent, ...checked];
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
    return this.formView || !!this.reviewRole || this.caseStatus === 'review' || this.caseStatus === 'approval' || this.caseStatus === 'official' || ((this.caseStatus === 'consult' || this.caseStatus === 'revision') && !this.revising);
  }

  protected get showForm(): boolean {
    return this.formView || !!this.reviewRole || this.caseStatus === 'draft' || this.caseStatus === 'cancelled' || this.viewingForm || this.revising;
  }

  protected get tracking(): boolean {
    if (this.formView) return false;
    return this.caseStatus === 'review' || this.caseStatus === 'revision' || this.caseStatus === 'consult' || this.caseStatus === 'approval' || this.caseStatus === 'official';
  }

  protected get showStatus(): boolean {
    return !this.reviewRole && this.tracking && !this.viewingForm && !this.revising && !this.openedRound;
  }

  protected get bureauGroups() {
    const text = this.personQuery.trim();
    return workGroups.filter((group) => !text || `${group.name} ${group.detail}`.includes(text));
  }

  protected groupHeadName(group: string): string {
    return groupHead(group);
  }

  protected get bureauPeople() {
    const text = this.personQuery.trim();
    return staffPeople.filter((person) => person.unit === this.bureau && (!text || `${person.name} ${person.title}`.includes(text)));
  }

  protected get chosenGroups() {
    return this.pickedGroups.map((name) => {
      const found = workGroups.find((group) => group.name === name);
      if (found) return found;
      return { name, detail: '', unit: '', count: peopleInGroup(name).length };
    });
  }

  protected get assignFoot(): string {
    const parts: string[] = [];
    if (this.pickedGroups.length) {
      if (this.reviewRole === 'director') parts.push(`${this.pickedGroups.length} กลุ่ม`);
      else {
        const heads = this.chosenGroups.reduce((sum, group) => sum + group.count, 0);
        parts.push(`${this.pickedGroups.length} กลุ่ม (${heads} คน)`);
      }
    }
    if (this.pickedPeople.length) parts.push(`${this.pickedPeople.length} คน`);
    return parts.length ? parts.join(' · ') : 'ยังไม่ได้เลือก';
  }

  protected setAssignMode(mode: 'group' | 'person'): void {
    if (this.assignMode === mode) return;
    this.assignMode = mode;
    this.personQuery = '';
  }

  protected setBureau(group: string): void {
    this.bureau = group;
    this.personQuery = '';
  }

  protected get canAssignWork(): boolean {
    return this.reviewRole === 'staff' || this.reviewRole === 'director' || this.reviewRole === 'head';
  }

  protected get assignmentWaiting(): boolean {
    if (this.reviewRole === 'staff') return !this.directorAssigned;
    if (this.reviewRole === 'director') return this.consultWaiting();
    if (this.reviewRole === 'head') {
      if (this.consultWaiting()) return true;
      const mine = this.shownTasks.find((task) => task.head === this.signedPerson);
      return !!mine && (this.groupAct(mine) || this.showForward(mine));
    }
    if (this.reviewRole === 'officer') return this.consultWaiting() || this.handAct(this.signedPerson);
    return false;
  }

  protected get workButtonLabel(): string {
    if (this.canAssignWork) return this.assignmentWaiting ? 'มอบหมายงาน มีงานที่ต้องทำ' : 'มอบหมายงาน';
    return this.assignmentWaiting ? 'งาน มีงานที่ต้องรับ' : 'งาน';
  }

  protected showAssignment(): void {
    if (!this.reviewRole) return;
    this.reviewTab = 'assign';
  }

  protected openAssign(): void {
    if (this.reviewRole !== 'director') return;
    this.draftGroups = [...this.pickedGroups];
    this.draftPeople = [...this.pickedPeople];
    this.personQuery = '';
    this.assignOpen = true;
  }

  protected closeAssign(): void {
    this.assignOpen = false;
    this.personQuery = '';
  }

  protected applyAssign(): void {
    if (!this.draftGroups.length) return;
    this.pickedGroups = [...this.draftGroups];
    this.groupTasks = this.tasksFor(this.pickedGroups, false);
    this.hands = this.hands.filter((hand) => this.pickedGroups.includes(hand.group));
    this.syncSlipPeople(true);
    this.closeAssign();
  }

  protected toggleDraftGroup(group: string): void {
    this.draftGroups = this.draftGroups.includes(group) ? this.draftGroups.filter((item) => item !== group) : [...this.draftGroups, group];
  }

  protected toggleDraftPerson(name: string): void {
    this.draftPeople = this.draftPeople.includes(name) ? this.draftPeople.filter((item) => item !== name) : [...this.draftPeople, name];
  }

  protected toggleGroup(group: string): void {
    if (this.reviewRole !== 'director') return;
    this.pickedGroups = this.pickedGroups.filter((item) => item !== group);
    this.groupTasks = this.groupTasks.filter((task) => task.group !== group);
    this.hands = this.hands.filter((hand) => hand.group !== group);
    this.syncSlipPeople(true);
  }

  protected togglePerson(name: string): void {
    if (this.reviewRole !== 'director') return;
    this.pickedPeople = this.pickedPeople.filter((item) => item !== name);
  }

  protected clearAssign(): void {
    if (this.reviewRole !== 'director') return;
    this.pickedGroups = [];
    this.pickedPeople = [];
  }

  protected saveAssignment(): void {
    this.saveSlip();
  }

  protected get actorName(): string {
    if (this.signedPerson) return this.signedPerson;
    if (this.reviewRole === 'director') return this.directorName;
    return '';
  }

  protected get directorName(): string {
    return this.accounts.namedPeople().find((person) => person.role === 'director')?.name ?? '';
  }

  protected get slipPlace(): string {
    if (this.reviewRole === 'director' && this.shownTasks.length) return 'director';
    const task = this.shownTasks.find((item) => item.head === this.signedPerson && item.reply !== 'return');
    if (task) return task.group;
    const hand = this.hands.find((item) => item.name === this.signedPerson && item.reply !== 'return');
    return hand?.name ?? '';
  }

  protected get slipHint(): string {
    if (this.slipPlace === 'director') return 'ผู้อำนวยการมอบหมายได้เฉพาะกลุ่มงาน หัวหน้ากลุ่มจะเลือกเจ้าหน้าที่ในกลุ่มต่อ';
    if (this.shownTasks.some((task) => task.head === this.signedPerson)) return 'หัวหน้ากลุ่มส่งต่อรายบุคคลในกลุ่ม หรือรายงานผลและส่งคืนให้ผู้อำนวยการ';
    return 'รายงานผลหรือส่งคืนให้หัวหน้ากลุ่มของตนเอง';
  }

  protected get slipTargets(): { name: string; detail: string }[] {
    const named = new Set(this.accounts.namedPeople().map((person) => person.name));
    if (this.reviewRole === 'director') {
      return this.shownTasks.map((task) => ({ name: task.group, detail: 'กลุ่มงาน' }));
    }
    const task = this.shownTasks.find((item) => item.head === this.signedPerson);
    if (task) {
      if (this.slipReceipt === 'return' || this.slipKind === 'report') {
        const boss = this.slips.find((slip) => slip.to === this.signedPerson)?.from || this.directorName;
        return boss && named.has(boss) ? [{ name: boss, detail: 'ผู้อำนวยการ' }] : [];
      }
      return this.membersOf(task.group).filter((person) => named.has(person.name)).map((person) => ({ name: person.name, detail: person.title }));
    }
    const hand = this.hands.find((item) => item.name === this.signedPerson);
    if (!hand || (this.slipReceipt === 'accept' && this.slipKind === 'forward')) return [];
    const head = this.shownTasks.find((item) => item.group === hand.group)?.head ?? '';
    return head && named.has(head) ? [{ name: head, detail: 'หัวหน้ากลุ่ม' }] : [];
  }

  protected setSlipReceipt(value: 'accept' | 'return'): void {
    this.slipReceipt = value;
    this.syncSlipPeople(true);
  }

  protected setSlipKind(value: 'report' | 'forward'): void {
    this.slipKind = value;
    this.syncSlipPeople(true);
  }

  protected removeSlipPerson(name: string): void {
    if (name === this.directorName || this.slipPeople.length < 2) return;
    this.slipPeople = this.slipPeople.filter((item) => item !== name);
    if (this.reviewRole !== 'director') return;
    const task = this.shownTasks.find((item) => item.group === name || item.head === name);
    if (task) this.toggleGroup(task.group);
  }

  protected slipsTo(name: string): AssignSlip[] {
    return this.slips.filter((slip) => slip.to === name);
  }

  protected receiptText(value: 'accept' | 'return'): string {
    return value === 'return' ? 'ส่งคืน' : 'รับ';
  }

  protected kindText(value: 'report' | 'forward'): string {
    return value === 'report' ? 'รายงานผล' : 'ส่งต่อ';
  }

  protected addSlipFiles(event: Event): void {
    const input = event.target as HTMLInputElement;
    const next = [...this.slipFiles];
    for (const file of input.files ?? []) next.push({ name: file.name, title: file.name });
    this.slipFiles = next;
    input.value = '';
  }

  protected renameSlipFile(index: number, title: string): void {
    this.slipFiles = this.slipFiles.map((file, item) => (item === index ? { ...file, title } : file));
  }

  protected removeSlipFile(index: number): void {
    this.slipFiles = this.slipFiles.filter((_, item) => item !== index);
  }

  protected get slipReady(): boolean {
    return !!this.actorName && this.slipPeople.length > 0 && !!this.slipOrder.trim() && thaiDateOk(this.slipAssignedOn, 'any') && thaiDateOk(this.slipDueOn, 'any') && this.timeOk(this.slipDueTime);
  }

  protected saveSlip(): void {
    if (!this.slipReady) return;
    const from = this.actorName;
    const files = this.slipFiles.map((file) => ({ name: file.name, title: file.title.trim() || file.name }));
    const made: AssignSlip[] = this.slipPeople.map((name) => ({
      at: `${Date.now()}-${name}`,
      from,
      to: name,
      group: this.groupOfTarget(name),
      receipt: this.slipReceipt,
      kind: this.slipKind,
      assignedOn: this.slipAssignedOn.trim(),
      dueOn: this.slipDueOn.trim(),
      dueTime: this.slipDueTime.trim(),
      remind: this.slipRemind,
      order: this.slipOrder.trim(),
      files,
    }));
    const keys = new Set(made.map((slip) => `${slip.from}\0${slip.to}`));
    this.slips = [...this.slips.filter((slip) => !keys.has(`${slip.from}\0${slip.to}`)), ...made];
    if (this.reviewRole === 'director') {
      this.slipReceipt = 'accept';
      this.slipKind = 'forward';
      this.assignOrder = this.slipOrder.trim();
      this.assignedOn = this.slipAssignedOn.trim();
      this.dueOn = this.slipDueOn.trim();
      this.assignNote = this.assignNote.trim();
      this.groupTasks = this.tasksFor(this.pickedGroups, true);
      this.hands = [];
      this.assignReply = 'pending';
      this.replyReason = '';
      if (readCaseStatus() === 'consult' && readConsult()) {
        const group = this.pickedGroups[0] || this.groupOfTarget(this.slipPeople[0] || '');
        if (group) {
          writeConsultGroup(group);
          writeConsultStep('group');
        }
        writeConsultAssigned(false);
        this.consultAssigned = false;
      }
    } else {
      const task = this.shownTasks.find((item) => item.head === from);
      if (task) {
        if (this.slipReceipt === 'return') {
          this.groupTasks = this.groupTasks.map((item) => (item.group === task.group ? { ...item, reply: 'return', reason: this.slipOrder.trim() } : item));
          this.hands = this.hands.filter((hand) => hand.group !== task.group);
        } else if (this.slipKind === 'forward') {
          this.groupTasks = this.groupTasks.map((item) => (item.group === task.group ? { ...item, reply: 'accept', reason: '' } : item));
          const rest = this.hands.filter((hand) => hand.group !== task.group);
          this.hands = [...rest, ...this.slipPeople.map((name) => ({ name, group: task.group, reply: 'pending' as const, reason: '' }))];
          this.pickedPeople = this.hands.map((hand) => hand.name);
          if (readCaseStatus() === 'consult' && readConsult()) {
            writeConsultGroup(task.group);
            writeConsultStep('member');
            writeConsultPlan({ channels: ['chat'], phone: '', email: '', other: '' });
            writeConsultAssigned(true);
            this.consultAssigned = true;
          }
        } else {
          this.groupTasks = this.groupTasks.map((item) => (item.group === task.group ? { ...item, reply: 'accept', reason: '' } : item));
        }
      } else {
        const reply: AssignReply = this.slipReceipt === 'return' ? 'return' : 'accept';
        this.hands = this.hands.map((hand) => (hand.name === from ? { ...hand, reply, reason: reply === 'return' ? this.slipOrder.trim() : '' } : hand));
      }
      this.syncReply();
    }
    this.forwardPick = [];
    writeWorkAssignment(this.assignmentPayload());
    this.notice = 'saved';
  }

  protected get signedPerson(): string {
    return this.accounts.personName;
  }

  protected get stepLabel(): string {
    return assignmentStepLabel(this.assignmentPayload());
  }

  protected get stepTone() {
    return assignmentStepTone(this.assignmentPayload());
  }

  protected get shownTasks(): GroupTask[] {
    return this.pickedGroups.flatMap((group) => {
      const head = groupHead(group);
      if (!head) return [];
      return [this.groupTasks.find((task) => task.group === group) ?? { group, head, reply: 'pending' as const, reason: '' }];
    });
  }

  protected groupAct(task: GroupTask): boolean {
    return this.signedPerson === task.head && task.reply === 'pending';
  }

  protected handOf(name: string): PersonHand | undefined {
    return this.hands.find((hand) => hand.name === name);
  }

  protected handsIn(group: string): PersonHand[] {
    return this.hands.filter((hand) => hand.group === group);
  }

  protected visibleHands(group: string): PersonHand[] {
    const rows = this.handsIn(group);
    return this.canAssignWork ? rows : rows.filter((hand) => hand.name === this.signedPerson);
  }

  protected get visibleTasks(): GroupTask[] {
    if (this.canAssignWork) return this.shownTasks;
    return this.shownTasks.filter((task) => this.visibleHands(task.group).length > 0);
  }

  private dutyState: Record<string, { state: DutyState; move: DutyMove }> = {};

  protected dutyStatus(title: string, work: string, fallback: DutyState): DutyState {
    return this.dutyState[`${title}\0${work}`]?.state ?? fallback;
  }

  protected dutyMove(title: string, work: string, fallback: DutyMove): DutyMove {
    return this.dutyState[`${title}\0${work}`]?.move ?? fallback;
  }

  protected setDutyStatus(title: string, work: string, state: DutyState, move: DutyMove = ''): void {
    this.dutyState = { ...this.dutyState, [`${title}\0${work}`]: { state, move } };
  }

  protected dutyLabel(state: 'new' | 'accepted' | 'returned' | 'working'): string {
    if (state === 'new') return 'งานรับใหม่';
    if (state === 'accepted') return 'งานที่รับ';
    if (state === 'returned') return 'คืน';
    return 'งานกำลังดำเนินงาน';
  }

  protected dutyTone(state: 'new' | 'accepted' | 'returned' | 'working'): 'warning' | 'info' | 'danger' | 'success' {
    if (state === 'new') return 'warning';
    if (state === 'accepted') return 'info';
    if (state === 'returned') return 'danger';
    return 'success';
  }

  /** ตอนนี้เดินเฉพาะงานขอคำปรึกษา งานขั้นถัดไปยังไม่เปิดในเมนูนี้ */
  protected get dutyMatters(): { title: string; status: string; tone: 'success' | 'info' | 'warning' | 'danger' | 'neutral'; people: string[]; tasks: { work: string; person: string; state: DutyState; move: DutyMove }[] }[] {
    if (!this.consultCanSee()) return [];
    const status = this.consultFlowStatus();
    const tone = status === 'ส่งคืน' ? 'danger' as const : status === 'รอตรวจสอบการรายงานผล' || status === 'งานติดตาม' ? 'info' as const : status === 'รายงานผล' || status === 'กำลังดำเนินงาน' || status === 'ปิดงาน' ? 'success' as const : 'warning' as const;
    const filed = this.caseStatus === 'official' || this.caseStatus === 'approval';
    return [{
      title: filed ? 'กำหนดผู้รับผิดชอบ' : 'ขอคำปรึกษา',
      status,
      tone,
      people: [],
      tasks: [],
    }];
  }

  protected get dutyIsAssign(): boolean {
    const title = this.activeDuty?.title;
    return title === 'ขอคำปรึกษา' || title === 'กำหนดผู้รับผิดชอบ';
  }

  protected get activeDuty(): { title: string; status: string; tone: 'success' | 'info' | 'warning' | 'danger' | 'neutral'; people: string[]; tasks: { work: string; person: string; state: DutyState; move: DutyMove }[] } | null {
    const rows = this.dutyMatters;
    return rows.find((row) => row.title === this.dutyPick) ?? rows[0] ?? null;
  }

  protected officersReported(job: ConsultGroupJob): boolean {
    return job.officers.some((officer) => !!officer.result);
  }

  protected replyWhen(reply: string, at?: string): string {
    if (reply === 'pending' || !at) return '—';
    return `${at} น.`;
  }

  private fillReplyTimes(jobs: ConsultGroupJob[]): ConsultGroupJob[] {
    const stamp = this.replyStamp();
    let changed = false;
    const next = jobs.map((job) => {
      let repliedAt = job.repliedAt;
      if (job.reply !== 'pending' && !repliedAt) {
        repliedAt = stamp;
        changed = true;
      }
      const officers = job.officers.map((officer) => {
        if (officer.reply !== 'pending' && !officer.repliedAt) {
          changed = true;
          return { ...officer, repliedAt: stamp };
        }
        return officer;
      });
      return { ...job, repliedAt, officers };
    });
    if (changed) sessionStorage.setItem(this.consultJobKey, JSON.stringify(next));
    return next;
  }

  private readConsultJobs(): ConsultGroupJob[] {
    try {
      if (sessionStorage.getItem('dft-por1-consult-sample') === '1') {
        sessionStorage.removeItem(this.consultJobKey);
        sessionStorage.removeItem('dft-por1-consult-sample');
        return [];
      }
      const raw = sessionStorage.getItem(this.consultJobKey);
      if (!raw) return [];
      const value = JSON.parse(raw) as ConsultGroupJob[];
      if (!Array.isArray(value)) return [];
      return this.fillReplyTimes(value);
    } catch {
      return [];
    }
  }

  protected closeConsultWork(): void {
    if (this.reviewRole !== 'director' || !this.consultJobs.length || this.consultClosed) return;
    const closed = { at: this.replyStamp() };
    sessionStorage.setItem('dft-por1-consult-closed', JSON.stringify(closed));
    this.consultClosed = closed;
  }

  private readConsultClosed(): { at: string } | null {
    try {
      const value = JSON.parse(sessionStorage.getItem('dft-por1-consult-closed') || 'null') as { at?: string } | null;
      if (!value?.at) return null;
      return { at: value.at };
    } catch {
      return null;
    }
  }

  private writeConsultJobs(): void {
    sessionStorage.removeItem('dft-por1-consult-sample');
    sessionStorage.removeItem('dft-por1-consult-default');
    sessionStorage.setItem(this.consultJobKey, JSON.stringify(this.consultJobs));
  }

  protected readonly assignableGroups = workGroups;

  protected jobHead(group: string): string {
    return groupHead(group);
  }

  protected isMyGroupHead(): boolean {
    return staffPeople.some((person) => person.name === this.signedPerson && person.lead && person.work === this.myWorkGroup());
  }

  protected myConsultOfficer(): ConsultOfficerJob | undefined {
    return this.consultGroupJob()?.officers.find((officer) => officer.name === this.signedPerson);
  }

  protected myWorkGroup(): string {
    return staffPeople.find((person) => person.name === this.signedPerson)?.work ?? '';
  }

  protected consultGroupJob(): ConsultGroupJob | undefined {
    return this.consultJobs.find((job) => job.group === this.myWorkGroup());
  }

  protected consultCanSee(): boolean {
    if (this.reviewRole === 'director') return true;
    const group = this.myWorkGroup();
    if (!group) return false;
    const job = this.consultJobs.find((item) => item.group === group);
    const head = staffPeople.some((person) => person.name === this.signedPerson && person.lead);
    if (!this.consultJobs.length) return head;
    if (!job) return false;
    if (head) return true;
    if (!job.officers.length) return true;
    return job.officers.some((officer) => officer.name === this.signedPerson);
  }

  protected consultFlowStatus(): 'งานรับใหม่' | 'งานติดตาม' | 'ส่งคืน' | 'กำลังดำเนินงาน' | 'รายงานผล' | 'รอตรวจสอบการรายงานผล' | 'ปิดงาน' {
    if (this.consultClosed) return 'ปิดงาน';
    if (this.reviewRole === 'director') {
      if (!this.consultJobs.length) return 'งานรับใหม่';
      if (this.consultJobs.some((job) => job.reply === 'return')) return 'ส่งคืน';
      if (this.consultJobs.some((job) => job.result)) return 'รอตรวจสอบการรายงานผล';
      return 'งานติดตาม';
    }
    const job = this.consultGroupJob();
    if (this.isMyGroupHead() && job) {
      if (job.reply === 'return') return 'ส่งคืน';
      if (job.result) return 'รอตรวจสอบการรายงานผล';
      if (job.reply === 'pending' || !job.officers.length) return 'งานรับใหม่';
      if (job.officers.some((officer) => officer.reply === 'return')) return 'ส่งคืน';
      return 'งานติดตาม';
    }
    const mine = this.myConsultOfficer();
    if (mine?.result) return 'รายงานผล';
    if (mine?.reply === 'return') return 'ส่งคืน';
    if (!mine || mine.reply === 'pending') return 'งานรับใหม่';
    return 'กำลังดำเนินงาน';
  }

  protected consultWaiting(): boolean {
    const status = this.consultFlowStatus();
    return status === 'งานรับใหม่' || status === 'ส่งคืน';
  }

  protected consultDocs(): { title: string; place: string; detail: string; by: string; at: string }[] {
    const topic = (this.consult?.topic || this.consultTopic).trim();
    const detail = (this.consult?.detail || this.consultDetail).trim();
    if (!topic) return [];
    return [{
      title: topic,
      place: 'คำขอคำปรึกษา',
      detail,
      by: this.consultSubmitter,
      at: this.consult?.at || `${this.filedOn} 10:15`,
    }];
  }

  protected openConsultDoc(doc: { title: string; place: string; detail: string; by: string; at: string }): void {
    this.viewingMade = this.consultMade(doc);
  }

  protected downloadConsultDoc(doc: { title: string; place: string; detail: string; by: string; at: string }): void {
    this.downloadMade(this.consultMade(doc));
  }

  protected openConsultResult(who: string, result?: ConsultResult): void {
    if (!result) return;
    const files = result.files.length ? result.files.map((file) => file.title || file.name).join('\n') : '—';
    this.viewingMade = {
      id: who,
      kind: 'รายงานผล',
      at: `${result.at} น.`,
      fields: [
        { label: 'ผู้รายงาน', value: who },
        { label: 'วันเวลารายงานผล', value: `${result.at} น.` },
        { label: 'รายละเอียดผล', value: result.detail || '—' },
        { label: 'ลงนาม', value: result.signed ? 'ลงนามแล้ว' : '—' },
        { label: 'ไฟล์แนบ', value: files },
      ],
    };
  }

  protected openConsultSlip(who: string, form?: ConsultSlip): void {
    this.viewingMade = this.consultSlipDoc(who, form);
  }

  protected downloadConsultSlip(who: string, form?: ConsultSlip): void {
    this.downloadMade(this.consultSlipDoc(who, form));
  }

  private consultSlipDoc(who: string, form?: ConsultSlip): MadeDoc {
    const files = form?.files.length ? form.files.map((file) => file.title || file.name).join('\n') : '—';
    return {
      id: who,
      kind: 'แบบฟอร์มมอบหมายงาน',
      at: form?.assignedOn || '—',
      fields: [
        { label: 'มอบหมายให้', value: who },
        { label: 'วันที่มอบหมาย', value: form?.assignedOn || '—' },
        { label: 'วันที่กำหนดส่ง', value: form?.dueOn || '—' },
        { label: 'เวลาครบกำหนดส่ง', value: form?.dueTime ? `${form.dueTime} น.` : '—' },
        { label: 'แจ้งเตือน', value: form?.remind ? 'แจ้งเตือนก่อนถึงวันครบกำหนด' : 'ไม่แจ้งเตือน' },
        { label: 'คำสั่ง/การดำเนินการ', value: form?.order || '—' },
        { label: 'ลงนาม', value: form?.signed ? 'ลงนามแล้ว' : '—' },
        { label: 'ไฟล์แนบ', value: files },
      ],
    };
  }

  private consultMade(doc: { title: string; place: string; detail: string; by: string; at: string }): MadeDoc {
    const channel = this.consultWayText(this.consult?.channel || this.consultChannel);
    return {
      id: doc.title,
      kind: 'คำขอคำปรึกษา',
      at: doc.at,
      fields: [
        { label: 'เรื่อง', value: doc.title },
        { label: 'รายละเอียด', value: doc.detail },
        { label: 'ช่องทางการปรึกษา', value: channel || '—' },
        { label: 'ชื่อผู้ยื่น', value: doc.by },
        { label: 'วันที่เวลา', value: doc.at },
      ],
    };
  }

  protected groupLabel(name: string): string {
    return name.replace(/^กลุ่มงาน/, '');
  }

  protected toggleConsultGroup(group: string): void {
    this.consultPickGroups = this.consultPickGroups.includes(group) ? this.consultPickGroups.filter((item) => item !== group) : [...this.consultPickGroups, group];
  }

  protected toggleConsultOfficer(name: string): void {
    this.consultPickOfficers = this.consultPickOfficers.includes(name) ? this.consultPickOfficers.filter((item) => item !== name) : [...this.consultPickOfficers, name];
  }

  protected openConsultForm(kind: ConsultForm): void {
    this.clearConsultDraft();
    this.consultForm = kind;
  }

  protected openConsultReply(kind: 'group-reply' | 'officer-reply', receipt: 'accept' | 'return'): void {
    this.openConsultForm(kind);
    this.consultReceipt = receipt;
  }

  protected closeConsultForm(): void {
    this.consultForm = '';
    this.clearConsultDraft();
  }

  protected get consultFormTitle(): string {
    if (this.consultForm === 'groups') return 'มอบหมายงานให้กลุ่ม';
    if (this.consultForm === 'officers') return 'มอบหมายให้เจ้าหน้าที่ในกลุ่ม';
    return 'รับงาน';
  }

  protected get consultFormHint(): string {
    if (this.consultForm === 'groups') return 'เลือกได้มากกว่า 1 กลุ่ม และมอบหมายซ้ำได้เมื่อต้องการสั่งใหม่';
    if (this.consultForm === 'officers') return 'เลือกได้มากกว่า 1 คน เอาออกได้ตลอด แม้จะรับหรือไม่รับ';
    return 'ใช้แบบฟอร์มเดียวกับตอนมอบหมายงาน';
  }

  protected get consultFormCanSend(): boolean {
    if (!this.consultFormReady) return false;
    if (this.consultForm === 'groups') return this.consultPickGroups.length > 0;
    if (this.consultForm === 'officers') return this.consultPickOfficers.length > 0;
    return this.consultForm === 'group-reply' || this.consultForm === 'officer-reply';
  }

  protected submitConsultForm(): void {
    if (this.consultForm === 'groups') this.assignConsultGroups();
    else if (this.consultForm === 'officers') this.assignConsultOfficers();
    else if (this.consultForm === 'group-reply') this.replyConsultGroup(this.consultReceipt);
    else if (this.consultForm === 'officer-reply') this.replyConsultOfficer(this.consultReceipt);
  }

  protected get consultFormReady(): boolean {
    return !!this.consultOrder.trim() && this.consultSigned && thaiDateOk(this.consultAssignedOn, 'any') && thaiDateOk(this.consultDueOn, 'any') && this.timeOk(this.consultDueTime);
  }

  protected addConsultFiles(event: Event): void {
    const input = event.target as HTMLInputElement;
    const next = [...this.consultFiles];
    for (const file of input.files ?? []) next.push({ name: file.name, title: file.name });
    this.consultFiles = next;
    input.value = '';
  }

  protected renameConsultFile(index: number, title: string): void {
    this.consultFiles = this.consultFiles.map((file, item) => (item === index ? { ...file, title } : file));
  }

  protected removeConsultFile(index: number): void {
    this.consultFiles = this.consultFiles.filter((_, item) => item !== index);
  }

  private consultSlip(): ConsultSlip {
    return {
      assignedOn: this.consultAssignedOn.trim(),
      dueOn: this.consultDueOn.trim(),
      dueTime: this.consultDueTime.trim(),
      remind: this.consultRemind,
      order: this.consultOrder.trim(),
      signed: this.consultSigned,
      files: this.consultFiles.map((file) => ({ name: file.name, title: file.title.trim() || file.name })),
    };
  }

  private clearConsultDraft(): void {
    this.consultOrder = '';
    this.consultFiles = [];
    this.consultPickGroups = [];
    this.consultPickOfficers = [];
    this.consultReceipt = 'accept';
    this.consultMove = 'report';
    this.consultRemind = false;
    this.consultSigned = false;
    this.officerListOpen = false;
    this.officerQuery = '';
  }

  protected assignConsultGroups(): void {
    if (this.reviewRole !== 'director' || !this.consultPickGroups.length || !this.consultFormReady) return;
    const form = this.consultSlip();
    const next = [...this.consultJobs];
    for (const group of this.consultPickGroups) {
      const found = next.find((job) => job.group === group);
      if (found) {
        found.form = form;
        if (found.reply === 'return') {
          found.reply = 'pending';
          found.repliedAt = undefined;
        }
      } else {
        next.push({ group, reply: 'pending', officers: [], form });
      }
    }
    this.consultJobs = next;
    this.closeConsultForm();
    this.writeConsultJobs();
  }

  protected removeConsultGroup(group: string): void {
    if (this.reviewRole !== 'director') return;
    this.consultJobs = this.consultJobs.filter((job) => job.group !== group);
    this.writeConsultJobs();
  }

  protected get headWorkCanSend(): boolean {
    if (!this.isMyGroupHead()) return false;
    const job = this.consultGroupJob();
    if (!job || job.reply === 'return') return false;
    if (job.reply === 'pending' && this.consultReceipt === 'return') return true;
    if (this.consultMove !== 'forward') return !!this.resultDetail.trim() && this.resultSigned;
    return this.consultPickOfficers.length > 0 && this.consultFormReady;
  }

  protected submitHeadWork(): void {
    if (!this.headWorkCanSend) return;
    const job = this.consultGroupJob();
    if (!job) return;
    if (job.reply === 'pending' && this.consultReceipt === 'return') {
      this.markGroupReply('return');
      this.clearConsultDraft();
      return;
    }
    if (this.consultMove !== 'forward') {
      if (job.reply === 'pending' && this.consultReceipt === 'return') {
        this.markGroupReply('return');
        this.clearResultDraft();
        return;
      }
      if (job.reply === 'pending') this.markGroupReply('accept');
      this.saveGroupResult();
      this.clearResultDraft();
      return;
    }
    if (job.reply === 'pending') this.markGroupReply('accept');
    this.assignConsultOfficers();
  }

  protected addResultFiles(event: Event): void {
    const input = event.target as HTMLInputElement;
    const next = [...this.resultFiles];
    for (const file of input.files ?? []) next.push({ name: file.name, title: file.name });
    this.resultFiles = next;
    input.value = '';
  }

  protected removeResultFile(index: number): void {
    this.resultFiles = this.resultFiles.filter((_, item) => item !== index);
  }

  protected submitOfficerResult(): void {
    const detail = this.resultDetail.trim();
    const mine = this.myConsultOfficer();
    if (!detail || !this.resultSigned || !mine || mine.reply !== 'accept' || mine.result || mine.move === 'forward') return;
    const result: ConsultResult = {
      at: this.replyStamp(),
      detail,
      signed: true,
      files: this.resultFiles.map((file) => ({ name: file.name, title: file.title.trim() || file.name })),
    };
    this.consultJobs = this.consultJobs.map((job) => ({
      ...job,
      officers: job.officers.map((officer) => officer.name === this.signedPerson ? { ...officer, result } : officer),
    }));
    this.writeConsultJobs();
    this.clearResultDraft();
  }

  protected submitGroupResult(): void {
    this.saveGroupResult();
    this.clearResultDraft();
  }

  private saveGroupResult(): void {
    const detail = this.resultDetail.trim();
    if (!detail) return;
    const group = this.myWorkGroup();
    const result: ConsultResult = {
      at: this.replyStamp(),
      detail,
      signed: this.resultSigned,
      files: this.resultFiles.map((file) => ({ name: file.name, title: file.title.trim() || file.name })),
    };
    this.consultJobs = this.consultJobs.map((job) => job.group === group ? { ...job, result, verdict: '', handoff: '', delivery: '' } : job);
    this.writeConsultJobs();
  }

  private clearResultDraft(): void {
    this.resultDetail = '';
    this.resultFiles = [];
    this.resultSigned = false;
  }

  protected forwardMyWork(): void {
    const mine = this.myConsultOfficer();
    if (!mine || mine.reply !== 'accept' || mine.result) return;
    this.consultJobs = this.consultJobs.map((job) => ({
      ...job,
      officers: job.officers.map((officer) => officer.name === this.signedPerson ? { ...officer, move: 'forward' as const } : officer),
    }));
    this.writeConsultJobs();
  }

  protected decideJob(group: string, verdict: 'approve' | 'rework'): void {
    if (this.reviewRole !== 'director' || this.consultClosed) return;
    this.consultJobs = this.consultJobs.map((job) => {
      if (job.group !== group || !job.result) return job;
      if (verdict === 'rework') return { ...job, result: undefined, verdict: 'rework', handoff: '', delivery: '' };
      return { ...job, verdict: 'approve', handoff: '', delivery: '' };
    });
    this.writeConsultJobs();
  }

  protected setJobHandoff(group: string, handoff: 'stop' | 'more'): void {
    if (this.reviewRole !== 'director' || this.consultClosed) return;
    this.consultJobs = this.consultJobs.map((job) => job.group === group && job.verdict === 'approve' ? { ...job, handoff, delivery: '' } : job);
    this.writeConsultJobs();
  }

  protected setJobDelivery(group: string, delivery: 'close' | 'board' | 'check'): void {
    if (this.reviewRole !== 'director' || this.consultClosed) return;
    this.consultJobs = this.consultJobs.map((job) => job.group === group && job.handoff === 'stop' ? { ...job, delivery } : job);
    this.writeConsultJobs();
    const live = this.consultJobs.filter((job) => job.reply !== 'return');
    if (live.length && live.every((job) => job.delivery === 'close' || job.delivery === 'board')) this.closeConsultWork();
  }

  protected officerForwarded(job: ConsultGroupJob): boolean {
    return job.officers.some((officer) => officer.move === 'forward' && !officer.result);
  }

  protected reportersOf(job: ConsultGroupJob): string {
    const names = job.officers.filter((officer) => officer.result).map((officer) => officer.name);
    return names.length ? names.join(' · ') : this.jobHead(job.group);
  }

  private markGroupReply(reply: 'accept' | 'return'): void {
    const group = this.myWorkGroup();
    this.consultJobs = this.consultJobs.map((item) => item.group === group && item.reply === 'pending' ? { ...item, reply, repliedAt: this.replyStamp(), officers: reply === 'return' ? [] : item.officers } : item);
    this.writeConsultJobs();
  }

  private replyStamp(): string {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${now.getFullYear() + 543} ${hour}:${minute}`;
  }

  protected replyConsultGroup(reply: 'accept' | 'return'): void {
    if (!this.isMyGroupHead() || !this.consultFormReady) return;
    const group = this.myWorkGroup();
    this.consultJobs = this.consultJobs.map((job) => job.group === group && job.reply === 'pending' ? { ...job, reply, repliedAt: this.replyStamp(), officers: reply === 'return' ? [] : job.officers } : job);
    this.closeConsultForm();
    this.writeConsultJobs();
  }

  protected assignConsultOfficers(): void {
    if (!this.isMyGroupHead() || !this.consultPickOfficers.length || !this.consultFormReady) return;
    const group = this.myWorkGroup();
    const form = this.consultSlip();
    this.consultJobs = this.consultJobs.map((job) => {
      if (job.group !== group || job.reply !== 'accept') return job;
      const officers = [...job.officers];
      for (const name of this.consultPickOfficers) {
        const found = officers.find((officer) => officer.name === name);
        if (found) {
          found.form = form;
          if (found.reply === 'return') {
            found.reply = 'pending';
            found.move = '';
            found.repliedAt = undefined;
          }
        } else {
          officers.push({ name, reply: 'pending', move: '', form });
        }
      }
      return { ...job, officers };
    });
    this.closeConsultForm();
    this.writeConsultJobs();
  }

  protected removeConsultOfficer(name: string): void {
    const group = this.myWorkGroup();
    this.consultJobs = this.consultJobs.map((job) => job.group === group ? { ...job, officers: job.officers.filter((officer) => officer.name !== name) } : job);
    this.writeConsultJobs();
  }

  protected replyConsultOfficer(reply: 'accept' | 'return'): void {
    const mine = this.myConsultOfficer();
    if (!mine || mine.reply !== 'pending') return;
    this.consultJobs = this.consultJobs.map((job) => ({
      ...job,
      officers: job.officers.map((officer) => officer.name === this.signedPerson && officer.reply === 'pending' ? { ...officer, reply, move: '', repliedAt: this.replyStamp() } : officer),
    }));
    this.writeConsultJobs();
  }

  protected handAct(name: string): boolean {
    const hand = this.handOf(name);
    const task = this.groupTasks.find((item) => item.group === hand?.group);
    return !!hand && hand.reply === 'pending' && this.signedPerson === name && task?.reply === 'accept';
  }

  protected handLabel(name: string): string {
    return assignmentReplyLabel(this.handOf(name)?.reply ?? 'pending');
  }

  protected handTone(name: string) {
    return assignmentReplyTone(this.handOf(name)?.reply ?? 'pending');
  }

  protected membersOf(group: string) {
    return groupMembers(group);
  }

  protected showForward(task: GroupTask): boolean {
    if (this.signedPerson !== task.head || task.reply !== 'accept') return false;
    if (!this.membersOf(task.group).length) return false;
    const mine = this.handsIn(task.group);
    return !mine.length || mine.some((hand) => hand.reply === 'return');
  }

  protected slipsForTask(task: GroupTask): AssignSlip[] {
    return this.slips.filter((slip) => slip.to !== this.directorName && (slip.to === task.group || slip.to === task.head || slip.group === task.group));
  }

  protected get handoffSteps(): { title: string; detail: string; state: 'done' | 'now' | 'back' | '' }[] {
    const tasks = this.shownTasks;
    const headDone = tasks.length > 0 && tasks.every((task) => task.reply === 'accept');
    const headBack = tasks.some((task) => task.reply === 'return') && tasks.every((task) => task.reply !== 'pending');
    const peopleDone = this.hands.length > 0 && this.hands.every((hand) => hand.reply === 'accept') && headDone;
    const peopleNow = headDone && (!this.hands.length || this.hands.some((hand) => hand.reply !== 'accept'));
    const intakeDone = this.reviewRole !== 'staff' || this.directorAssigned || tasks.length > 0;
    return [
      { title: '1. เจ้าหน้าที่รับเรื่อง', detail: this.directorName ? `มอบหมายให้ ${this.directorName}` : 'มอบหมายให้ผู้อำนวยการ', state: intakeDone ? 'done' : 'now' },
      { title: '2. ผู้อำนวยการ', detail: tasks.length ? `มอบหมาย ${tasks.length} กลุ่ม` : 'มอบหมายให้กลุ่ม', state: tasks.length ? 'done' : intakeDone ? 'now' : '' },
      {
        title: '3. กลุ่ม',
        detail: tasks.map((task) => task.head).join(' · ') || 'รอผู้อำนวยการมอบหมาย',
        state: headBack ? 'back' : headDone ? 'done' : tasks.length ? 'now' : '',
      },
      {
        title: '4. เจ้าหน้าที่ในกลุ่ม',
        detail: this.hands.map((hand) => hand.name).join(' · ') || 'รอหัวหน้ากลุ่มมอบหมาย',
        state: peopleDone ? 'done' : peopleNow ? 'now' : '',
      },
    ];
  }

  protected acceptGroup(group: string): void {
    const task = this.groupTasks.find((item) => item.group === group);
    if (!task || !this.groupAct(task)) return;
    this.groupTasks = this.groupTasks.map((item) => (item.group === group ? { ...item, reply: 'accept', reason: '' } : item));
    this.groupReturning = '';
    this.forwardPick = this.membersOf(group).map((person) => person.name);
    this.syncReply();
    writeWorkAssignment(this.assignmentPayload());
  }

  protected confirmGroupReturn(group: string): void {
    const task = this.groupTasks.find((item) => item.group === group);
    if (!task || !this.groupAct(task) || !this.groupReason.trim()) return;
    this.groupTasks = this.groupTasks.map((item) => (item.group === group ? { ...item, reply: 'return', reason: this.groupReason.trim() } : item));
    this.hands = this.hands.filter((hand) => hand.group !== group);
    this.groupReturning = '';
    this.groupReason = '';
    this.syncReply();
    writeWorkAssignment(this.assignmentPayload());
  }

  protected toggleForward(name: string): void {
    this.forwardPick = this.forwardPick.includes(name) ? this.forwardPick.filter((item) => item !== name) : [...this.forwardPick, name];
  }

  protected sendForward(group: string): void {
    const task = this.groupTasks.find((item) => item.group === group);
    if (!task || this.signedPerson !== task.head || task.reply !== 'accept') return;
    const picked = this.forwardPick.filter((name) => this.membersOf(group).some((person) => person.name === name));
    if (!picked.length) return;
    const rest = this.hands.filter((hand) => hand.group !== group);
    this.hands = [...rest, ...picked.map((name) => ({ name, group, reply: 'pending' as const, reason: '' }))];
    this.pickedPeople = this.hands.map((hand) => hand.name);
    this.handReturning = '';
    this.syncReply();
    writeWorkAssignment(this.assignmentPayload());
  }

  protected acceptHand(name: string): void {
    if (!this.handAct(name)) return;
    this.hands = this.hands.map((hand) => (hand.name === name ? { ...hand, reply: 'accept', reason: '' } : hand));
    this.handReturning = '';
    this.syncReply();
    writeWorkAssignment(this.assignmentPayload());
  }

  protected confirmHandReturn(name: string): void {
    if (!this.handAct(name) || !this.handReason.trim()) return;
    this.hands = this.hands.map((hand) => (hand.name === name ? { ...hand, reply: 'return', reason: this.handReason.trim() } : hand));
    this.handReturning = '';
    this.handReason = '';
    this.syncReply();
    writeWorkAssignment(this.assignmentPayload());
  }

  private syncReply(): void {
    const step = assignmentStepLabel(this.assignmentPayload());
    this.assignReply = step === 'รับเรื่องแล้ว' ? 'accept' : step.includes('ส่งคืน') || step === 'มีการส่งคืน' ? 'return' : 'pending';
    this.replyReason = this.groupTasks.find((task) => task.reply === 'return')?.reason || this.hands.find((hand) => hand.reply === 'return')?.reason || '';
  }

  private tasksFor(groups: string[], reset: boolean): GroupTask[] {
    return groups.flatMap((group) => {
      const head = groupHead(group);
      if (!head) return [];
      if (!reset) {
        const current = this.groupTasks.find((task) => task.group === group);
        if (current) return [current];
      }
      return [{ group, head, reply: 'pending' as const, reason: '' }];
    });
  }

  protected saveReply(): void {
    if (this.reviewRole === 'director' || !this.replyReady || this.replyDraft === '') return;
    this.assignReply = this.replyDraft;
    if (this.assignReply !== 'return') this.replyReason = '';
    writeWorkAssignment(this.assignmentPayload());
  }

  protected get replyReady(): boolean {
    if (this.replyDraft === 'accept') return true;
    return this.replyDraft === 'return' && this.replyReason.trim().length > 0;
  }

  protected get replyLabel(): string {
    return assignmentReplyLabel(this.assignReply);
  }

  protected get replyTone() {
    return assignmentReplyTone(this.assignReply);
  }

  protected get assignComplete(): boolean {
    return this.peopleReady && !!this.assignOrder.trim() && thaiDateOk(this.assignedOn, 'any') && thaiDateOk(this.dueOn, 'any');
  }

  private groupOfTarget(name: string): string {
    if (this.shownTasks.some((item) => item.group === name)) return name;
    const task = this.shownTasks.find((item) => item.head === name);
    if (task) return task.group;
    const person = staffPeople.find((item) => item.name === name);
    if (person?.work) return person.work;
    return this.hands.find((hand) => hand.name === name)?.group || this.shownTasks.find((item) => item.head === this.signedPerson)?.group || '';
  }

  private timeOk(value: string): boolean {
    const text = value.trim();
    if (!text) return true;
    return /^([01]\d|2[0-3]):[0-5]\d$/.test(text);
  }

  private syncSlipPeople(force = false): void {
    const names = this.slipTargets.map((person) => person.name);
    if (force || !this.slipPeople.length) {
      this.slipPeople = names;
      return;
    }
    this.slipPeople = this.slipPeople.filter((name) => names.includes(name));
    if (!this.slipPeople.length) this.slipPeople = names;
  }

  private assignmentPayload(): WorkAssignment {
    return {
      people: this.pickedPeople,
      groups: this.pickedGroups,
      note: this.assignNote.trim(),
      order: this.assignOrder.trim(),
      assignedOn: this.assignedOn.trim(),
      dueOn: this.dueOn.trim(),
      reply: this.assignReply,
      reason: this.replyReason.trim(),
      groupTasks: this.groupTasks,
      hands: this.hands,
      slips: this.slips,
    };
  }

  protected assignPart: 'people' | 'receipt' = 'people';
  protected dutyPick = '';
  protected docPart = 0;

  protected get peopleReady(): boolean {
    return this.pickedGroups.length > 0 || this.pickedPeople.length > 0;
  }

  protected showReviewTab(tab: ReviewTab): boolean {
    if (!this.reviewRole) return false;
    if (this.reviewRole === 'bureau') return tab === 'form' || tab === 'docs' || tab === 'inquiry';
    if (this.reviewRole === 'committee') return tab === 'inquiry' || tab === 'prelim' || tab === 'draftFinal' || tab === 'finalResult' || tab === 'measures';
    if (this.reviewRole === 'interest') return tab === 'inquiry';
    if (this.reviewRole === 'external') return tab === 'docs' || tab === 'inquiry';
    if (tab === 'assign') {
      if (this.reviewRole === 'officer') return !!this.myConsultOfficer();
      return this.reviewRole === 'director' || this.reviewRole === 'head';
    }
    return true;
  }

  protected reviewTabs(): { id: ReviewTab; label: string }[] {
    const tabs: { id: ReviewTab; label: string }[] = [
      { id: 'form', label: 'แบบคำขอ' },
      { id: 'assign', label: 'มอบหมายงาน' },
      { id: 'docs', label: 'ตรวจสอบเอกสาร' },
      { id: 'inquiry', label: 'เปิดไต่สวน' },
      { id: 'prelim', label: 'ผลขั้นต้น' },
      { id: 'draftFinal', label: 'ร่างผลสิ้นสุด' },
      { id: 'finalResult', label: 'ผลสิ้นสุด' },
      { id: 'measures', label: 'ทบทวนและคืนอากร' },
      { id: 'link', label: 'เชื่อมโยงระบบ' },
    ];
    return tabs.filter((tab) => this.showReviewTab(tab.id));
  }

  protected pickReviewTab(tab: ReviewTab): void {
    if (!this.showReviewTab(tab) || this.reviewLocked(tab)) return;
    this.reviewTab = tab;
    this.flowView = '';
    if (tab === 'inquiry') this.placeInquiry();
    if (tab === 'prelim' && readHearing()) this.prelimPart = 'close';
  }

  protected get docsPassed(): boolean {
    return this.docSent && this.docAction === 'complete' && this.committeeSent && this.committeeResult === 'take';
  }

  protected reviewLocked(tab: ReviewTab): boolean {
    if (!this.returnCase && this.liveAhead(tab)) return true;
    if (this.reviewRole === 'bureau' || this.reviewRole === 'committee' || this.reviewRole === 'interest' || this.reviewRole === 'external') return false;
    if (tab === 'inquiry') return !this.docsPassed;
    if (tab === 'link') return this.inquiryOpen !== 'open';
    if (tab === 'prelim') return !this.laterPhase.visit && !readHearing();
    if (tab === 'draftFinal') return !this.laterPhase.prelim;
    if (tab === 'finalResult') return !this.laterPhase.draftFinal;
    if (tab === 'measures') return !this.laterPhase.finalResult;
    return false;
  }

  private readonly phaseOrder: ReviewTab[] = ['form', 'assign', 'docs', 'inquiry', 'prelim', 'draftFinal', 'finalResult', 'measures', 'link'];

  private liveCursor(): ReviewTab {
    if (this.caseStatus === 'draft' || this.caseStatus === 'review' || this.caseStatus === 'revision') return 'form';
    if (!this.assignPassed) return 'assign';
    if (!this.docsPassed) return 'docs';
    if (!(this.inquiryOpen === 'close' || this.inquiryReturned || (this.inquiryOpen === 'open' && this.laterPhase.visit))) return 'inquiry';
    if (!this.laterPhase.prelim) return 'prelim';
    if (!this.laterPhase.draftFinal) return 'draftFinal';
    if (!this.laterPhase.finalResult) return 'finalResult';
    if (!this.laterPhase.measures) return 'measures';
    return 'link';
  }

  private liveAhead(tab: ReviewTab): boolean {
    return this.phaseOrder.indexOf(tab) > this.phaseOrder.indexOf(this.liveCursor());
  }

  protected reviewMark(tab: ReviewTab): 'done' | 'now' | 'work' | 'lock' {
    if (!this.returnCase) {
      const at = this.phaseOrder.indexOf(tab);
      const now = this.phaseOrder.indexOf(this.liveCursor());
      if (at < now) return 'done';
      if (at === now) return 'now';
      return 'lock';
    }
    if (this.reviewLocked(tab)) return 'lock';
    if (tab === 'form') return 'done';
    if (tab === 'assign') return this.assignPassed ? 'done' : 'work';
    if (tab === 'docs') return this.docsPassed ? 'done' : 'work';
    if (tab === 'inquiry') return this.inquiryOpen === 'close' || this.inquiryReturned || (this.inquiryOpen === 'open' && this.laterPhase.visit) ? 'done' : 'work';
    if (tab === 'prelim') return this.laterPhase.prelim ? 'done' : 'work';
    if (tab === 'draftFinal') return this.laterPhase.draftFinal ? 'done' : 'work';
    if (tab === 'finalResult') return this.laterPhase.finalResult ? 'done' : 'work';
    if (tab === 'measures') return this.laterPhase.measures ? 'done' : 'work';
    return this.etrDone ? 'done' : 'work';
  }

  protected reviewHint(tab: ReviewTab): string {
    const mark = this.reviewMark(tab);
    if (!this.returnCase && mark === 'now') return 'กำลังดำเนินการ';
    if (!this.returnCase && mark === 'done') return 'ทำแล้ว';
    if (mark === 'lock') {
      if (!this.returnCase && tab === 'docs') return 'ยังไม่ถึง';
      if (tab === 'inquiry') return 'รอผลตรวจสอบ';
      if (tab === 'prelim') return 'รอตรวจสอบและประกาศ';
      if (tab === 'draftFinal') return 'รอผลขั้นต้น';
      if (tab === 'finalResult') return 'รอร่างผลสิ้นสุด';
      if (tab === 'measures') return 'รอผลชั้นที่สุด';
      if (tab === 'link') return 'ยังไม่เริ่มดำเนินการ';
    }
    return '';
  }

  protected phaseDocs(): string[] {
    if (this.reviewTab === 'prelim') {
      return [
        'วาระอนุกรรมการพิจารณาผลการไต่สวนขั้นต้น',
        'วาระคณะกรรมการพิจารณาผลการไต่สวนขั้นต้น',
        'ประกาศผลการไต่สวนขั้นต้น',
        'หนังสือแจ้งผู้มีส่วนได้เสีย',
      ];
    }
    if (this.reviewTab === 'draftFinal') {
      return [
        'ร่างวาระ',
        'ข้อเสนอผลการตัดสินชั้นที่สุด',
        'เอกสารเปิดเผยและไม่เปิดเผย',
        'กำหนดระยะเวลาแสดงความเห็น',
      ];
    }
    if (this.reviewTab === 'finalResult') {
      return [
        'ประกาศผลชั้นที่สุด',
        'งานสารบรรณลงทะเบียนรับเลข',
        'เผยแพร่บนเว็บไซต์กอง',
      ];
    }
    return [
      'บันทึกขออนุมัติการไปตรวจสอบข้อมูล',
      'หนังสือแจ้งการขอไปตรวจสอบและข้อมูลที่ให้เตรียม',
      'หนังสือยินยอมจากผู้ส่งออก',
      'บันทึกแจ้งรัฐบาลประเทศผู้ส่งออก',
      'รายงานผลการตรวจสอบข้อมูล',
    ];
  }

  protected passVisit(): void {
    if (!this.inquiryQuestionsDone || this.laterPhase.visit || !this.visitReady) return;
    const first = this.visitRows[0];
    this.laterPhase = {
      ...this.laterPhase,
      visit: true,
      notes: {
        ...this.laterPhase.notes,
        visit: JSON.stringify({
          domestic: true,
          foreign: this.visitForeign,
          normalValue: first?.normalValue.trim() || '',
          exportPrice: first?.exportPrice.trim() || '',
          margin: first?.margin.trim() || '',
          parties: this.visitRows,
          volume: this.injuryVolume.trim(),
          price: this.injuryPrice.trim(),
          performance: this.injuryPerformance.trim(),
          customs: this.injuryCustoms.trim(),
          link: this.injuryLink.trim(),
          complete: 'yes',
        }),
      },
    };
    writeLaterPhase(this.laterPhase);
  }

  protected saveVisitMore(): void {
    if (this.visitDataOk !== 'no' || !this.visitMoreNote.trim()) return;
    this.keepNote('visit-more', this.visitMoreNote.trim());
    this.notice = 'saved';
  }

  protected flowTab(tab: ReviewTab): tab is 'prelim' | 'draftFinal' | 'finalResult' | 'measures' {
    return tab === 'prelim' || tab === 'draftFinal' || tab === 'finalResult' || tab === 'measures';
  }

  protected flowSteps(tab: ReviewTab): FlowStep[] {
    return this.flowTab(tab) ? flowCatalog[tab] : [];
  }

  protected flowCursor(tab: ReviewTab): string {
    const steps = this.flowSteps(tab);
    return steps.find((step) => !this.laterPhase.marks[step.id])?.id ?? steps.at(-1)?.id ?? '';
  }

  protected flowShown(tab: ReviewTab): FlowStep | null {
    const steps = this.flowSteps(tab);
    const id = this.flowView && steps.some((step) => step.id === this.flowView) ? this.flowView : this.flowCursor(tab);
    return steps.find((step) => step.id === id) ?? null;
  }

  protected flowDot(tab: ReviewTab, id: string): string {
    if (this.laterPhase.marks[id]) return 'assets/icons/por1-dot-done.svg';
    if (this.flowCursor(tab) === id) return 'assets/icons/por1-dot-wait.svg';
    return 'assets/icons/por1-dot.svg';
  }

  protected flowMarkLabel(step: FlowStep): string {
    const mark = this.laterPhase.marks[step.id];
    if (mark === 'skip') return 'ข้ามขั้น';
    if (mark === 'yes') return step.yes || 'ใช่';
    if (mark === 'no') return step.no || 'ไม่';
    return 'บันทึกแล้ว';
  }

  protected openFlowStep(tab: ReviewTab, id: string): void {
    const steps = this.flowSteps(tab);
    const index = steps.findIndex((step) => step.id === id);
    const pending = steps.findIndex((step) => !this.laterPhase.marks[step.id]);
    if (index < 0 || (pending !== -1 && index > pending)) return;
    this.flowView = id;
    this.flowValues = Object.fromEntries(this.flowSaved(id).map((row) => [row.label, row.value]));
  }

  protected flowFieldsOf(id: string): FlowField[] {
    return flowFields[id] ?? [];
  }

  protected flowSaved(id: string): { label: string; value: string }[] {
    const raw = this.laterPhase.notes[id];
    if (!raw) return [];
    try {
      const value = JSON.parse(raw) as { label?: string; value?: string }[];
      if (Array.isArray(value)) return value.flatMap((item) => item?.label && item.value ? [{ label: item.label, value: item.value }] : []);
    } catch {
      return [{ label: 'เนื้อความ', value: raw }];
    }
    return [{ label: 'เนื้อความ', value: raw }];
  }

  protected flowReady(step: FlowStep): boolean {
    if (step.yes && !this.flowPick[step.id]) return false;
    return this.flowFieldsOf(step.id).every((field) => !!this.flowValues[field.label]?.trim());
  }

  protected setFlowValue(label: string, value: string): void {
    this.flowValues = { ...this.flowValues, [label]: value };
  }

  protected pickFlow(id: string, value: 'yes' | 'no'): void {
    this.flowPick = { ...this.flowPick, [id]: value };
  }

  protected saveFlowStep(tab: ReviewTab, id: string): void {
    if (!this.flowTab(tab) || this.flowCursor(tab) !== id) return;
    const step = this.flowSteps(tab).find((item) => item.id === id);
    if (!step) return;
    const choice = step.yes ? this.flowPick[id] : 'done';
    if (!choice || !this.flowReady(step)) return;
    const marks = { ...this.laterPhase.marks, [id]: choice };
    const packed = this.flowFieldsOf(id).map((field) => ({ label: field.label, value: this.flowValues[field.label].trim() }));
    const notes = { ...this.laterPhase.notes, [id]: JSON.stringify(packed) };
    if (id === 'prelim-again' && choice === 'yes') {
      for (const key of ['prelim-committee', 'prelim-announce', 'prelim-notify', 'prelim-hearing', 'prelim-again']) delete marks[key];
    }
    if (id === 'draft-sub' && choice === 'no') marks['draft-agenda'] = 'skip';
    if (id === 'draft-substance' && choice === 'no') marks['draft-revise'] = 'skip';
    const phase: LaterPhase = { ...this.laterPhase, marks, notes };
    if (id === 'prelim-again' && choice === 'no') phase.prelim = true;
    if (id === 'draft-pack') phase.draftFinal = true;
    if (id === 'final-publish') phase.finalResult = true;
    if (['m56', 'm57', 'm58', 'm59'].every((key) => marks[key])) phase.measures = true;
    this.laterPhase = phase;
    this.flowView = '';
    this.flowValues = {};
    writeLaterPhase(phase);
  }

  protected get aiChecks(): { label: string; pass: boolean; detail: string; note: string; place: string }[] {
    const required = this.submitReady;
    const related = !!this.company.trim() && !!this.goodsDetail.trim() && !!this.phone.trim() && !!this.measure && (!this.onBehalf || !!this.agent.trim());
    const recheck = !this.consultGate && this.ack;
    return [
      { label: 'ความครบถ้วน', pass: required, detail: required ? 'ฟิลด์และเอกสารบังคับครบ' : 'ฟิลด์หรือเอกสารบังคับยังไม่ครบ', note: 'กรอกข้อมูลและแนบเอกสารที่จำเป็นให้ครบ', place: 'แบบคำขอ' },
      { label: 'ความสอดคล้อง', pass: related, detail: related ? 'ข้อมูลที่อ้างอิงกันสอดคล้อง' : 'ชื่อผู้ยื่น สินค้า มาตรการ หรือโทรศัพท์ยังไม่สอดคล้อง', note: 'ตรวจชื่อผู้ยื่น สินค้า มาตรการ และโทรศัพท์ให้ตรงกัน', place: 'แบบคำขอ' },
      { label: 'ความถูกต้องตามเงื่อนไข', pass: recheck, detail: recheck ? 'เป็นไปตามเงื่อนไขการยื่น' : 'ยังไม่เป็นไปตามเงื่อนไขการยื่น', note: 'แก้ไขให้เป็นไปตามเงื่อนไขการยื่นก่อนส่งใหม่', place: 'แบบคำขอ' },
    ];
  }

  protected get aiReady(): boolean {
    return this.aiChecks.every((item) => item.pass);
  }

  private restoreWorkNotes(): void {
    const visit = this.laterPhase.notes['visit'];
    if (visit) {
      try {
        const parsed = JSON.parse(visit) as { domestic?: boolean; foreign?: boolean; normalValue?: string; exportPrice?: string; margin?: string; parties?: { name?: string; normalValue?: string; exportPrice?: string; compare?: string; margin?: string }[]; volume?: string; price?: string; performance?: string; customs?: string; link?: string; complete?: string };
        this.visitDomestic = parsed.domestic === true;
        this.visitForeign = parsed.foreign === true;
        this.normalValue = parsed.normalValue || '';
        this.exportPrice = parsed.exportPrice || '';
        this.dumpingMargin = parsed.margin || '';
        if (Array.isArray(parsed.parties) && parsed.parties.length) {
          this.visitRows = parsed.parties.flatMap((row) => {
            if (!row || typeof row.name !== 'string' || !row.name) return [];
            return [{ name: row.name, normalValue: row.normalValue || '', exportPrice: row.exportPrice || '', compare: row.compare || '', margin: row.margin || '' }];
          });
        } else if (parsed.normalValue || parsed.exportPrice || parsed.margin) {
          this.visitRows = [{ name: 'ผู้ผลิตและผู้ส่งออก', normalValue: parsed.normalValue || '', exportPrice: parsed.exportPrice || '', compare: '', margin: parsed.margin || '' }];
        }
        this.injuryVolume = parsed.volume || '';
        this.injuryPrice = parsed.price || '';
        this.injuryPerformance = parsed.performance || '';
        this.injuryCustoms = parsed.customs || '';
        this.injuryLink = parsed.link || '';
        this.visitDataOk = parsed.complete === 'yes' ? 'yes' : '';
        this.visitMoreNote = this.laterPhase.notes['visit-more'] || '';
      } catch {
        this.visitDomestic = this.laterPhase.visit;
      }
    }
    this.prelimOn = this.laterPhase.notes['prelim-on'] || this.prelimOn;
    this.draftOn = this.laterPhase.notes['draft-on'] || this.draftOn;
    this.finalOn = this.laterPhase.notes['final-on'] || this.finalOn;
    this.measureOn = this.laterPhase.notes['measure-on'] || this.measureOn;
    const mark = (id: string) => this.laterPhase.marks[id] === 'yes' || this.laterPhase.marks[id] === 'no' ? this.laterPhase.marks[id] : '';
    this.measure56 = mark('m56');
    this.measure57 = mark('m57');
    this.measure58 = mark('m58');
    this.measure59 = mark('m59');
    this.draftSubstance = this.laterPhase.notes['draft-substance'] === 'yes' || this.laterPhase.notes['draft-substance'] === 'no' ? this.laterPhase.notes['draft-substance'] : '';
    this.prelimHearing = this.laterPhase.notes['prelim-hearing'] === 'yes' || this.laterPhase.notes['prelim-hearing'] === 'no' ? this.laterPhase.notes['prelim-hearing'] : '';
    this.prelimAgain = this.laterPhase.notes['prelim-again'] === 'yes' || this.laterPhase.notes['prelim-again'] === 'no' ? this.laterPhase.notes['prelim-again'] : '';
    this.hearingMemo = this.laterPhase.notes['hearing-memo'] || '';
    this.hearingPeople = this.laterPhase.notes['hearing-people'] || '';
    const office = this.laterPhase.notes['hearing-office'];
    this.hearingOffice = office === 'approve' || office === 'return' ? office : '';
  }

  private keepNote(key: string, value: string): void {
    this.laterPhase = { ...this.laterPhase, notes: { ...this.laterPhase.notes, [key]: value } };
    writeLaterPhase(this.laterPhase);
  }

  protected saveCaseSplit(): void {
    this.keepNote('case-split', `แตกเคสจากสรุปประชุมรายเดือน เลขสารบรรณ ${this.filingSaraban} Ref e-TR ${this.etrRefNo}`);
  }

  protected get interestParties(): { name: string; org: string; count: string; joined: boolean }[] {
    const joined = new Set(joinedFor(this.inquiryCaseId).map((item) => item.name));
    let saved: { name: string; org: string; count: string }[] = [];
    try {
      const value = JSON.parse(this.laterPhase.notes['interest'] || '[]') as { name?: string; org?: string; count?: string }[];
      saved = Array.isArray(value) ? value.flatMap((item) => item?.name ? [{ name: item.name, org: item.org || '', count: item.count || '1' }] : []) : [];
    } catch {
      saved = [];
    }
    const names = new Set(saved.map((item) => item.name));
    const extra = joinedFor(this.inquiryCaseId).filter((item) => !names.has(item.name)).map((item) => ({ name: item.name, org: item.org, count: '1' }));
    return [...saved, ...extra].map((item) => ({ ...item, joined: joined.has(item.name) }));
  }

  protected addInterestParty(): void {
    if (!this.partyName.trim()) return;
    const rows = [...this.interestParties, { name: this.partyName.trim(), org: this.partyOrg.trim(), count: this.partyCount.trim() || '1' }];
    this.partyName = '';
    this.partyOrg = '';
    this.partyCount = '';
    this.keepNote('interest', JSON.stringify(rows));
  }

  protected saveHearingOffice(): void {
    if (!this.hearingMemo.trim() || !this.hearingOffice || !this.hearingPeople.trim()) return;
    this.keepNote('hearing-memo', this.hearingMemo.trim());
    this.keepNote('hearing-office', this.hearingOffice);
    this.keepNote('hearing-people', this.hearingPeople.trim());
  }

  protected reopenHearing(): void {
    this.inquiryHearing = '';
    this.inquiryHearingDraft = 'hold';
    this.hearingOffice = '';
    this.keepNote('hearing-office', '');
    this.writeInquiry();
  }

  protected passLaterPhase(): void {
    const tab = this.reviewTab;
    if (tab !== 'prelim' && tab !== 'draftFinal' && tab !== 'finalResult') return;
    if (this.reviewLocked(tab) || this.reviewMark(tab) === 'done') return;
    this.laterPhase = { ...this.laterPhase, [tab]: true };
    writeLaterPhase(this.laterPhase);
  }

  private get assignPassed(): boolean {
    if (this.reviewRole === 'staff') return this.directorAssigned;
    if (this.reviewRole === 'director' && !this.returnCase) {
      return this.consultJobs.length > 0 && sessionStorage.getItem('dft-por1-consult-default') !== '1';
    }
    if (this.reviewRole === 'director') return this.pickedGroups.length > 0 || this.consultJobs.length > 0;
    return this.pickedPeople.some((name) => name !== this.directorName);
  }

  protected get etrAccepted(): boolean {
    return this.approverNames().length > 0;
  }

  protected get etrDone(): boolean {
    return this.links.some((row) => row.system === 'eTR' && row.state === 'success');
  }

  protected linkMode(mode: SystemLink['mode']): string {
    if (mode === 'retry') return 'ส่งซ้ำอัตโนมัติ';
    if (mode === 'manual') return 'ผู้ใช้งานส่งใหม่';
    return 'อัตโนมัติ';
  }

  /** รายการที่ไม่สำเร็จและยังไม่มีการส่งใหม่สำเร็จตามมา */
  protected linkPending(row: SystemLink): boolean {
    if (row.state !== 'error') return false;
    const at = this.officeStamp(row.at);
    return !this.links.some((item) => item.system === row.system && item.state === 'success' && this.officeStamp(item.at) >= at);
  }

  protected get linkFailCount(): number {
    return this.links.filter((row) => this.linkPending(row)).length;
  }

  protected get linkSystems(): { name: string; ok: boolean; at: string }[] {
    const names = ['ระบบสารบรรณ', ...new Set(this.links.map((row) => row.system))];
    return names.map((name) => {
      const rows = this.linkRows.filter((row) => row.system === name);
      const latest = rows[0];
      return { name, ok: !rows.some((row) => this.linkPending(row)), at: latest?.at || '' };
    });
  }

  protected openLinkLog(row: SystemLink, focusError = false): void {
    this.linkLog = {
      ...row,
      log: [...row.log].sort((a, b) => this.officeStamp(b.at) - this.officeStamp(a.at)),
    };
    this.linkLogError = focusError;
  }

  protected linkState(state: SystemLink['state']): string {
    if (state === 'error') return 'ไม่สำเร็จ';
    if (state === 'wait') return 'รอส่ง';
    return 'สำเร็จ';
  }

  protected get linkRows(): SystemLink[] {
    const office = this.officeLinks.map((item): SystemLink => ({
      id: item.no,
      at: item.at,
      system: 'ระบบสารบรรณ',
      title: item.events[0]?.text || 'รับเลขที่ลงรับ',
      detail: `เลข ${item.no}${item.events[1] ? ` · ${item.events[1].text}` : ''}`,
      state: 'success' as const,
      mode: 'auto' as const,
      refNo: item.no,
      error: '',
      log: item.events,
    }));
    return [...this.links, ...office].sort((a, b) => this.officeStamp(b.at) - this.officeStamp(a.at));
  }

  private sampleLinks(): SystemLink[] {
    return [
      {
        id: 'etr-auto-error',
        at: '17/05/2562 09:10',
        system: 'eTR',
        title: 'ส่งข้อมูลคำขออัตโนมัติ',
        detail: 'ระบบ eTR ไม่ตอบกลับ จึงยังไม่ได้ Ref Case ID (eTR)',
        state: 'error',
        mode: 'auto',
        refNo: '',
        error: 'ETR-504 Gateway Timeout · ระบบ eTR ไม่ตอบกลับภายใน 30 วินาที หลังส่งซ้ำอัตโนมัติครบ 3 ครั้ง',
        log: [
          { at: '17/05/2562 09:10', text: `เตรียมข้อมูลคำขอ ${this.refId} พร้อมเลขสารบรรณ ${this.filingSaraban}` },
          { at: '17/05/2562 09:10', text: 'ส่งข้อมูลไประบบ eTR ครั้งที่ 1 · ไม่ตอบกลับภายใน 30 วินาที' },
          { at: '17/05/2562 09:11', text: 'ส่งซ้ำอัตโนมัติครั้งที่ 2 · ไม่ตอบกลับภายใน 30 วินาที' },
          { at: '17/05/2562 09:12', text: 'ส่งซ้ำอัตโนมัติครั้งที่ 3 · ไม่ตอบกลับ หยุดส่งและรอผู้ใช้งานส่งใหม่' },
        ],
      },
    ];
  }

  private ensureLinks(): void {
    let saved = readSystemLinks().filter((row) => row.system !== 'ระบบ e-Office' && row.system !== 'ไปรษณีย์อิเล็กทรอนิกส์');
    const old = readEtrLink();
    if (old && !saved.some((row) => row.system === 'eTR' && row.state === 'success')) {
      saved = [...saved, {
        id: 'etr-migrated',
        at: old.backAt || old.sentAt,
        system: 'eTR',
        title: 'ได้รับ Ref Case ID (eTR)',
        detail: `Ref Case ID (eTR) ${old.caseId} จากเลขสารบรรณ ${old.saraban}`,
        state: 'success',
        mode: 'auto',
        refNo: old.caseId,
        error: '',
        log: [{ at: old.backAt || old.sentAt, text: `ได้รับ Ref Case ID (eTR) ${old.caseId}` }],
      }];
      writeEtrLink(null);
    }
    for (const sample of this.sampleLinks()) {
      const found = saved.find((row) => row.id === sample.id);
      if (!found) saved = [...saved, sample];
      else if (!found.log.length) saved = saved.map((row) => (row.id === sample.id ? { ...row, error: sample.error, log: sample.log } : row));
    }
    writeSystemLinks(saved);
    this.links = saved;
  }

  protected resendLink(failed: SystemLink): void {
    if (!this.linkPending(failed)) return;
    const at = '17/05/2562 09:25';
    const by = this.signedPerson || 'ผู้ใช้งาน';
    const etr = failed.system === 'eTR';
    const row: SystemLink = {
      id: `${failed.id}-resend-${this.links.length}`,
      at,
      system: failed.system,
      title: `ส่งใหม่อีกครั้ง · ${failed.title}`,
      detail: etr
        ? `ได้ Ref Case ID (eTR) ${this.etrRefNo} จากเลขสารบรรณ ${this.filingSaraban} เชื่อมกับคำขอ ${this.refId} แล้ว`
        : `ระบบ ${failed.system} ตอบรับแล้ว`,
      state: 'success',
      mode: 'manual',
      refNo: etr ? this.etrRefNo : '',
      error: '',
      log: [
        { at, text: `${by} กดส่งใหม่อีกครั้งจากรายการที่ไม่สำเร็จเมื่อ ${failed.at} น.` },
        { at, text: `ส่งข้อมูลคำขอ ${this.refId} ไป${failed.system}` },
        { at, text: etr ? `ระบบ eTR ตอบกลับ Ref Case ID (eTR) ${this.etrRefNo}` : `ระบบ ${failed.system} ตอบรับแล้ว` },
      ],
    };
    this.links = [...this.links, row];
    writeSystemLinks(this.links);
    this.linkLog = null;
    this.notice = etr ? 'etr' : 'saved';
  }

  protected noticeDot(): string {
    if (this.docSent && this.docAction === 'complete') return 'assets/icons/por1-dot-done.svg';
    if (this.docSent || this.madeOf('แจ้งผลการตรวจ').length || this.docFiles.length) return 'assets/icons/por1-dot-wait.svg';
    return 'assets/icons/por1-dot.svg';
  }

  protected docActionLabel(action: DocAction): string {
    if (action === 'complete') return 'แจ้งคำขอครบถ้วนถูกต้อง';
    if (action === 'late') return 'แจ้งคำขอไม่ครบถ้วนถูกต้องภายใน 4 เดือน';
    return 'แจ้งแก้ไขเพิ่มเติม';
  }

  protected get noticeLead(): string {
    const base = this.docAction === 'complete'
      ? 'ตรวจร่างทั้ง 3 รายการแล้ว คำขอครบถ้วนถูกต้อง พร้อมแจ้งผลให้ผู้ยื่น'
      : this.docAction === 'late'
        ? `ครบกำหนด 4 เดือนเมื่อ ${this.amendUntil || '15/09/2562'} แล้วยังไม่ครบถ้วนถูกต้อง`
        : `ตรวจร่างทั้ง 3 รายการแล้ว ข้อมูลยังไม่ครบ จึงแจ้งผู้ยื่นให้ส่งเพิ่มภายใน ${this.docDueOn}`;
    return this.noticeSaraban ? `${base} เลขรับสารบรรณ ${this.noticeSaraban}` : base;
  }

  protected noticeDue(item?: MadeDoc): string {
    const saved = item?.fields.find((field) => field.label === 'กำหนดส่งข้อมูล')?.value.trim();
    if (saved && saved !== '-') return saved;
    if (this.docAction === 'complete') return '—';
    return this.docDueOn || '—';
  }

  protected viewingNotice = '';

  protected openNoticeFile(name: string): void {
    this.viewingNotice = name;
  }

  protected downloadNoticeFile(name: string): void {
    const file = this.docFiles.find((item) => item.name === name);
    const title = file?.title || name;
    const body = this.noticeLetter.map((item) => `<p><strong>${this.escapeHtml(item.label)}</strong><br>${this.escapeHtml(item.value).replaceAll('\n', '<br>')}</p>`).join('');
    const html = `<!DOCTYPE html><html lang="th"><head><meta charset="utf-8"><title>${this.escapeHtml(title)}</title><style>body{margin:32px 48px;color:#0E2346;font-family:Thonburi,Sarabun,sans-serif;font-size:16px;line-height:28px}h1{margin:0 0 8px;font-size:20px;font-weight:500}p{margin:0 0 12px}</style></head><body><h1>${this.escapeHtml(title)}</h1><p>เลขที่อ้างอิง ${filingRefId}</p>${body}</body></html>`;
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = name.replace(/\.[^.]+$/, '') + '.html';
    link.click();
    URL.revokeObjectURL(url);
  }

  protected get canHandleCase(): boolean {
    if (this.reviewRole === 'director' || this.reviewRole === 'staff' || this.reviewRole === 'committee') return true;
    if (this.approverNames().includes(this.signedPerson)) return true;
    if (this.myConsultOfficer()) return true;
    return this.isMyGroupHead() && !!this.consultGroupJob();
  }

  protected get canReviewDocs(): boolean {
    if (this.docSent) return false;
    return this.canHandleCase;
  }

  protected get docCanSend(): boolean {
    const dueOk = this.docAction === 'complete' || thaiDateOk(this.docDueOn, 'any');
    const letterOk = this.noticeLetter.every((item) => item.value.trim());
    return this.canReviewDocs && !!this.docNote.trim() && letterOk && thaiDateOk(this.docNoticedOn, 'any') && dueOk;
  }

  protected suggestGaps(): void {
    if (this.docSent) return;
    const suggested: DocGap[] = this.noticePasses.length
      ? [{ place: 'ส่วนที่ 3 ผู้ผลิตในประเทศ', title: 'รายชื่อผู้ผลิตที่ร่วมยื่นยังไม่ครบ', detail: 'รายชื่อยังไม่ครบตามหนังสือมอบอำนาจ' }]
      : defaultNoticeGaps.map((gap) => ({ ...gap }));
    this.docGaps = suggested.map((gap) => ({ ...gap }));
    this.docNote = this.docGaps.map((gap) => gap.title).join(' ');
    this.applyGapBody();
    writeDocNotice(this.docPayload(false));
    this.notice = 'suggest';
  }

  private applyGapBody(): void {
    const lines = this.docGaps.map((gap) => gapSentence(gap)).filter(Boolean).map((line, index) => `${index + 1}. ${line}`).join('\n');
    const value = this.docAction === 'late'
      ? `ด้วยครบกำหนดแก้ไขเพิ่มเติมคำขอเมื่อ ${this.amendUntil || '15/09/2562'} แล้วยังไม่ครบถ้วนถูกต้องในเรื่องดังนี้\n${lines}`
      : `ด้วยกรมการค้าต่างประเทศได้ตรวจสอบคำขอเลขที่อ้างอิง ${this.refId} แล้ว ยังไม่ครบถ้วนดังนี้ จึงขอให้ส่งข้อมูลเพิ่มภายใน ${this.docDueOn}\n${lines}`;
    this.noticeLetter = this.noticeLetter.map((field) => field.label === 'เนื้อความ' ? { ...field, value } : field);
  }

  private foldGapsIntoNotice(): void {
    if (this.docAction === 'complete' || this.docSent) return;
    const current = this.noticeLetter.find((field) => field.label === 'เนื้อความ')?.value ?? '';
    const covered = this.docGaps.every((gap) => !gap.place.trim() || current.includes(gap.place.trim()));
    if (current.trim() && covered) return;
    this.applyGapBody();
  }

  private syncGapsFromBody(value: string): void {
    const gaps = value.split('\n').flatMap((line) => {
      const match = line.trim().match(/^\d+\.\s+(.+)$/);
      if (!match) return [];
      const text = match[1].trim();
      const colon = text.indexOf(':');
      if (colon > 0) return [{ place: text.slice(0, colon).trim(), title: text.slice(colon + 1).trim(), detail: '' }];
      return [{ place: '', title: text, detail: '' }];
    });
    if (gaps.length) this.docGaps = gaps;
  }

  protected addGap(): void {
    if (this.docSent) return;
    this.docGaps = [...this.docGaps, { place: '', title: '', detail: '' }];
  }

  protected setGap(index: number, key: keyof DocGap, value: string): void {
    this.docGaps = this.docGaps.map((gap, item) => item === index ? { ...gap, [key]: value } : gap);
    if (!this.docSent) writeDocNotice(this.docPayload(false));
  }

  protected removeGap(index: number): void {
    this.docGaps = this.docGaps.filter((_, item) => item !== index);
    if (!this.docSent) writeDocNotice(this.docPayload(false));
  }

  protected assistNotice(): void {
    if (this.docSent) return;
    this.noticeLetter = noticeLetterFields(this.docAction, this.docNoticedOn, this.docDueOn, this.signedPerson);
    if (this.docAction !== 'complete') this.docGaps = defaultNoticeGaps.map((gap) => ({ ...gap }));
    this.docNote = this.docAction === 'complete'
      ? 'ตรวจแล้วคำขอและเอกสารประกอบครบถ้วนถูกต้อง'
      : this.docAction === 'late'
        ? 'ครบกำหนด 4 เดือนเมื่อ 15/09/2562 แล้วยังไม่ครบถ้วนถูกต้อง'
        : 'ขอเพิ่มหลักฐานราคาช่วงปลายปี 2561 ถึงต้นปี 2562 ปริมาณนำเข้าที่เชื่อมกับความเสียหาย และรายชื่อผู้ผลิตที่ร่วมยื่น';
    writeDocNotice(this.docPayload(false));
    this.notice = 'check';
  }

  protected setNoticeField(index: number, value: string): void {
    const label = this.noticeLetter[index]?.label;
    this.noticeLetter = this.noticeLetter.map((item, itemIndex) => itemIndex === index ? { ...item, value } : item);
    if (label === 'เนื้อความ' && this.docAction === 'amend') this.syncGapsFromBody(value);
    if (!this.docSent) writeDocNotice(this.docPayload(false));
  }

  protected agencyOpen = false;

  protected agencyDoc(title: string): boolean {
    return title === 'หนังสือขอข้อมูลหน่วยงานที่เกี่ยวข้อง' || title === 'สรุปข้อมูลจากหน่วยงานที่เกี่ยวข้อง' || title === 'Pre-questionnaire กลุ่มที่เกี่ยวข้อง';
  }

  protected agencyPreview = false;

  protected draftValue(label: string): string {
    return this.workDocs[this.docPart]?.fields.find((field) => field.label === label)?.value.trim() || '';
  }

  protected agencyDate(label: string): boolean {
    return label === 'วันที่' || label.startsWith('วันที่') || label.startsWith('กำหนดส่ง');
  }

  protected agencyFull(label: string): boolean {
    return !['ที่', 'วันที่', 'โทรศัพท์', 'โทรสาร', 'กำหนดส่งข้อมูล', 'วันที่ได้รับข้อมูล', 'วันที่จัดทำ', 'กำหนดส่งคำตอบ'].includes(label);
  }

  protected fieldRows(field: { label: string; value: string; long?: boolean }): number {
    const room: Record<string, number> = {
      'เรียน': 4,
      'สิ่งที่ส่งมาด้วย': 4,
      'เนื้อความ': 6,
      'หน่วยงาน': 4,
      'เลขที่หนังสือตอบกลับ': 4,
      'วิธีจัดทำ': 4,
      'วัตถุประสงค์': 3,
      'รายชื่อผู้ผลิต': 3,
      'กำลังการผลิตและปริมาณการผลิต': 3,
      'ปริมาณความต้องการใช้ภายในประเทศ': 3,
      'จุดที่ข้อมูลยังไม่ครบ': 3,
      'สรุปที่นำไปใช้': 3,
    };
    const written = field.value ? field.value.split('\n').length : 0;
    return Math.min(10, Math.max(room[field.label] ?? 3, written));
  }

  protected agencyLead(item: MadeDoc): string {
    const topic = item.fields.find((field) => field.label === 'เรื่อง' || field.label === 'ชื่อแบบ' || field.label === 'วัตถุประสงค์');
    return topic?.value.split('\n')[0] || item.kind;
  }

  protected openAgencyForm(id = ''): void {
    if (id) this.editMade(id);
    else {
      this.freshMade();
      this.workDocs = this.workDocs.map((item, index) => index === this.docPart ? { ...item, fields: item.fields.map((field) => ({ ...field, value: '' })) } : item);
      writeWorkDrafts(this.workDocs);
    }
    this.agencyOpen = true;
  }

  protected closeAgencyForm(): void {
    this.agencyOpen = false;
    this.editingId = '';
  }

  protected saveAgencyForm(): void {
    const creating = !this.editingId;
    this.saveMade(creating);
    this.agencyOpen = false;
  }

  protected madeOf(title: string): MadeDoc[] {
    return this.madeDocs.filter((item) => item.kind === title);
  }

  protected extraFiles: { kind: string; name: string; title: string; sentOn: string }[] = this.readExtraFiles();

  protected agencyFilesOpen = false;
  protected filePop: 'agency' | 'notice' | 'committee' | 'inquiry' | 'prelim' | 'draft' | 'final' | '' = '';
  protected noticeFormOpen = false;

  protected openAttach(target: 'agency' | 'notice' | 'committee' | 'inquiry' | 'prelim' | 'draft' | 'final'): void {
    this.filePop = target;
    this.agencyFilesOpen = true;
  }

  protected closeAttach(): void {
    this.agencyFilesOpen = false;
    this.filePop = '';
  }

  protected openNoticeForm(id = ''): void {
    const fresh = noticeLetterFields(this.docAction, this.docNoticedOn, this.docDueOn, this.signedPerson);
    if (id) {
      const found = this.madeDocs.find((item) => item.id === id);
      if (!found) return;
      this.editingId = id;
      this.noticeLetter = fresh.map((field) => ({ ...field, value: found.fields.find((item) => item.label === field.label)?.value ?? '' }));
    } else {
      this.editingId = '';
      this.noticeLetter = fresh.map((field) => ({ ...field }));
    }
    this.foldGapsIntoNotice();
    this.noticeFormOpen = true;
  }

  protected closeNoticeForm(): void {
    this.noticeFormOpen = false;
    this.editingId = '';
  }

  protected saveNoticeForm(): void {
    if (!this.canReviewDocs) return;
    const topic = this.noticeLetter.find((field) => field.label === 'เรื่อง')?.value.trim() || this.docActionLabel(this.docAction);
    const fields = this.noticeLetter.map((item) => item.label === 'เรื่อง' && !item.value.trim() ? { ...item, value: topic } : { ...item });
    this.noticeLetter = fields.map((item) => ({ ...item }));
    if (this.editingId) {
      this.madeDocs = this.madeDocs.map((item) => item.id === this.editingId ? { ...item, fields, at: this.docNoticedOn || '20/05/2562' } : item);
    } else {
      this.madeDocs = [...this.madeDocs, { id: `notice-${Date.now()}`, kind: 'แจ้งผลการตรวจ', at: this.docNoticedOn || '20/05/2562', fields }];
      this.editingId = '';
    }
    writeMadeDocs(this.madeDocs);
    if (!this.docSent) writeDocNotice(this.docPayload(false));
    this.noticeFormOpen = false;
  }

  protected previewNotice(): void {
    this.viewingMade = {
      id: 'notice-preview',
      kind: 'แจ้งผลการตรวจ',
      at: this.docNoticedOn,
      fields: this.noticeLetter.map((item) => ({ ...item })),
    };
  }

  protected dropAgencyFiles(event: DragEvent): void {
    event.preventDefault();
    if (this.filePop === 'notice') this.pushDocFiles(event.dataTransfer?.files);
    else this.pushExtraFiles(event.dataTransfer?.files);
  }

  protected extrasOf(kind: string): { kind: string; name: string; title: string; sentOn: string }[] {
    return this.extraFiles.filter((file) => file.kind === kind);
  }

  protected addExtraFiles(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (this.filePop === 'notice') this.pushDocFiles(input.files);
    else this.pushExtraFiles(input.files);
    input.value = '';
  }

  private pushDocFiles(list: FileList | null | undefined): void {
    if (!list?.length || this.docSent) return;
    const files = [...list].map((file) => ({ name: file.name, title: file.name.replace(/\.[^.]+$/, ''), sentOn: this.docNoticedOn || '20/05/2562' }));
    this.docFiles = [...this.docFiles, ...files];
    writeDocNotice(this.docPayload(this.docSent));
  }

  private pushExtraFiles(list: FileList | null | undefined): void {
    const kind = this.filePop === 'committee' ? 'พิจารณาของคณะกรรมการ' : this.filePop === 'inquiry' ? 'เปิดไต่สวน' : this.filePop === 'prelim' ? 'ผลขั้นต้น' : this.filePop === 'draft' ? 'ร่างผลสิ้นสุด' : this.filePop === 'final' ? 'ผลสิ้นสุด' : this.workDocs[this.docPart]?.title;
    if (!kind || !list?.length) return;
    const sentOn = this.filePop === 'committee' ? (this.committeeAt || '05/06/2562') : this.filePop === 'inquiry' ? (this.inquiryNoticeOn || '10/06/2562') : this.filePop === 'prelim' ? (this.prelimOn || '20/08/2562') : this.filePop === 'draft' ? (this.draftOn || '15/10/2562') : this.filePop === 'final' ? (this.finalOn || '20/12/2562') : '20/05/2562';
    const files = [...list].map((file) => ({ kind, name: file.name, title: file.name.replace(/\.[^.]+$/, ''), sentOn }));
    this.extraFiles = [...this.extraFiles, ...files];
    this.writeExtraFiles();
  }

  protected renameExtraFile(kind: string, index: number, title: string): void {
    let seen = -1;
    this.extraFiles = this.extraFiles.map((file) => {
      if (file.kind !== kind) return file;
      seen += 1;
      return seen === index ? { ...file, title } : file;
    });
    this.writeExtraFiles();
  }

  protected removeExtraFile(kind: string, index: number): void {
    let seen = -1;
    this.extraFiles = this.extraFiles.filter((file) => {
      if (file.kind !== kind) return true;
      seen += 1;
      return seen !== index;
    });
    this.writeExtraFiles();
  }

  protected downloadExtraFile(file: { name: string; title: string; sentOn: string }): void {
    const sample = this.preSamples.find((item) => item.name === file.name);
    if (sample) {
      const link = document.createElement('a');
      link.href = sample.href;
      link.download = sample.name;
      link.click();
      return;
    }
    const html = `<!DOCTYPE html><html lang="th"><head><meta charset="utf-8"><title>${this.escapeHtml(file.title)}</title><style>body{margin:32px 48px;color:#0E2346;font-family:Thonburi,Sarabun,sans-serif;font-size:16px;line-height:28px}h1{margin:0 0 8px;font-size:20px;font-weight:500}p{margin:0 0 12px}</style></head><body><h1>${this.escapeHtml(file.title)}</h1><p>เลขที่อ้างอิง ${filingRefId}</p><p>ไฟล์แนบ ${this.escapeHtml(file.name)}</p></body></html>`;
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name.replace(/\.[^.]+$/, '') + '.html';
    link.click();
    URL.revokeObjectURL(url);
  }

  private readExtraFiles(): { kind: string; name: string; title: string; sentOn: string }[] {
    try {
      const value = JSON.parse(sessionStorage.getItem('dft-por1-extra-files') || '[]') as { kind?: string; name?: string; title?: string; sentOn?: string }[];
      if (!Array.isArray(value)) return [];
      return value.flatMap((file) => file?.kind && file.name ? [{ kind: file.kind, name: file.name, title: file.title || file.name, sentOn: file.sentOn || '20/05/2562' }] : []);
    } catch {
      return [];
    }
  }

  private writeExtraFiles(): void {
    sessionStorage.setItem('dft-por1-extra-files', JSON.stringify(this.extraFiles));
  }

  protected docQuery = '';
  protected docSearchOpen = false;
  protected docShelf: 'files' | 'committee' = 'files';

  protected toggleDocSearch(): void {
    this.docSearchOpen = !this.docSearchOpen;
    if (!this.docSearchOpen) this.docQuery = '';
  }

  protected docMatches(title: string): boolean {
    const query = this.docQuery.trim();
    return !query || title.includes(query);
  }

  protected openDocShelf(shelf: 'files' | 'committee'): void {
    this.docShelf = shelf;
    if (shelf === 'committee') this.pickDoc(this.workDocs.length + 1);
    else if (this.docPart > this.workDocs.length) this.pickDoc(0);
  }

  protected pickDoc(index: number): void {
    this.docPart = index;
    this.editingId = '';
    this.docShelf = index > this.workDocs.length ? 'committee' : 'files';
  }

  protected readonly preSamples = [
    { name: 'แบบสอบถามเบื้องต้น-17.01.66.docx', title: 'แบบสอบถามเบื้องต้นถึงผู้ผลิตในประเทศ', href: 'assets/samples/pre-qn/แบบสอบถามเบื้องต้น-17.01.66.docx' },
    { name: 'Pre-Qn_Exporter.docx', title: 'Pre-questionnaire ผู้ส่งออก', href: 'assets/samples/pre-qn/Pre-Qn_Exporter.docx' },
    { name: 'Appendix_Pre-Qn_Exporter.xlsx', title: 'ภาคผนวก Pre-questionnaire', href: 'assets/samples/pre-qn/Appendix_Pre-Qn_Exporter.xlsx' },
    { name: 'Pre-QN-Summary.xlsx', title: 'สรุปการเก็บข้อมูล Pre-questionnaire', href: 'assets/samples/pre-qn/Pre-QN-Summary.xlsx' },
  ];

  protected get preQuestionnaire(): boolean {
    return this.workDocs[this.docPart]?.title === 'Pre-questionnaire กลุ่มที่เกี่ยวข้อง';
  }

  protected usePreSamples(): void {
    const kind = 'Pre-questionnaire กลุ่มที่เกี่ยวข้อง';
    const have = new Set(this.extrasOf(kind).map((file) => file.name));
    const next = this.preSamples.filter((sample) => !have.has(sample.name)).map((sample) => ({ kind, name: sample.name, title: sample.title, sentOn: '28/05/2562' }));
    if (!next.length) return;
    this.extraFiles = [...this.extraFiles, ...next];
    this.writeExtraFiles();
  }

  protected prePick: Record<string, boolean> = {};

  protected togglePrePick(key: string): void {
    this.prePick = { ...this.prePick, [key]: !this.prePick[key] };
  }

  protected get prePickedCount(): number {
    return Object.values(this.prePick).filter(Boolean).length;
  }

  protected summarizePreQuestionnaire(): void {
    const kind = 'Pre-questionnaire กลุ่มที่เกี่ยวข้อง';
    const forms = this.madeOf(kind).filter((item) => this.prePick[`form:${item.id}`] && !item.fields.some((field) => field.label === 'สรุปผลการวิเคราะห์'));
    const files = this.extrasOf(kind).filter((file) => this.prePick[`file:${file.name}`]);
    if (!forms.length && !files.length) return;
    const sources = [...forms.map((item) => this.agencyLead(item)), ...files.map((file) => file.title || file.name)];
    const fields = [
      field('ชื่อแบบ', 'สรุปผลการวิเคราะห์ Pre-questionnaire'),
      field('วันที่สรุป', '28/05/2562'),
      field('รายการที่เลือกวิเคราะห์', sources.join('\n'), true),
      field('ส่วนที่ 1 ฐานะผู้มีส่วนได้เสีย', 'ผู้ตอบเป็นผู้ผลิตเหล็กแผ่นรีดร้อนในประเทศที่อยู่ในรายชื่อหลักจาก 4 หน่วยงาน', true),
      field('ส่วนที่ 2 กำลังการผลิตและปริมาณการผลิต', 'มีข้อมูลกำลังการผลิตและปริมาณการผลิตปี 2561 ถึงต้นปี 2562 จากรายการที่เลือก', true),
      field('ส่วนที่ 3 ราคา', 'หลักฐานราคายังไม่ครอบคลุมช่วงปลายปี 2561 ถึงต้นปี 2562', true),
      field('ส่วนที่ 4 ความเสียหาย', 'ปริมาณนำเข้ายังอธิบายความเชื่อมกับความเสียหายไม่ครบ', true),
      field('ส่วนที่ 5 ผู้ผลิตที่ร่วมยื่น', 'รายชื่อผู้ผลิตที่ร่วมยื่นยังไม่ครบตามหนังสือมอบอำนาจ', true),
      field('สรุปผลการวิเคราะห์', `วิเคราะห์จาก ${sources.length} รายการที่เลือก จุดที่ต้องติดตามต่อคือหลักฐานราคา ปริมาณนำเข้าที่เชื่อมกับความเสียหาย และรายชื่อผู้ผลิตที่ร่วมยื่น`, true),
    ];
    this.madeDocs = [...this.madeDocs, { id: `pre-summary-${Date.now()}`, kind, at: '28/05/2562', fields }];
    writeMadeDocs(this.madeDocs);
    this.prePick = {};
    this.notice = 'assist';
  }

  protected assistDraft(): void {
    const fresh = defaultWorkDrafts()[this.docPart];
    if (!fresh) return;
    this.workDocs = this.workDocs.map((item, index) => index === this.docPart ? { ...fresh, fields: fresh.fields.map((field) => ({ ...field })) } : item);
    writeWorkDrafts(this.workDocs);
    this.notice = 'assist';
  }

  protected freshMade(): void {
    const fresh = defaultWorkDrafts()[this.docPart];
    if (!fresh) return;
    this.editingId = '';
    this.workDocs = this.workDocs.map((item, index) => index === this.docPart ? { ...fresh, fields: fresh.fields.map((field) => ({ ...field })) } : item);
    writeWorkDrafts(this.workDocs);
  }

  protected editMade(id: string): void {
    const found = this.madeDocs.find((item) => item.id === id);
    if (!found) return;
    const index = this.workDocs.findIndex((item) => item.title === found.kind);
    if (index < 0) return;
    this.docPart = index;
    this.editingId = id;
    const template = defaultWorkDrafts().find((item) => item.title === found.kind);
    const fields = template
      ? template.fields.map((field) => ({ ...field, value: found.fields.find((item) => item.label === field.label)?.value ?? field.value }))
      : found.fields.map((field) => ({ ...field }));
    this.workDocs = this.workDocs.map((item, itemIndex) => itemIndex === index ? { ...item, fields } : item);
  }

  protected downloadMade(item: MadeDoc): void {
    const body = item.fields.map((field) => `<p><strong>${this.escapeHtml(field.label)}</strong><br>${this.escapeHtml(field.value).replaceAll('\n', '<br>')}</p>`).join('');
    const html = `<!DOCTYPE html><html lang="th"><head><meta charset="utf-8"><title>${this.escapeHtml(item.kind)} ${filingRefId}</title><style>body{margin:32px 48px;color:#0E2346;font-family:Thonburi,Sarabun,sans-serif;font-size:16px;line-height:28px}h1{margin:0 0 8px;font-size:20px;font-weight:500}p{margin:0 0 12px}</style></head><body><h1>${this.escapeHtml(item.kind)}</h1><p>เลขที่อ้างอิง ${filingRefId} · บันทึกเมื่อ ${this.escapeHtml(item.at)}</p>${body}</body></html>`;
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${item.kind}-${filingRefId}.html`;
    link.click();
    URL.revokeObjectURL(url);
  }

  private escapeHtml(value: string): string {
    return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  }

  protected saveMade(asNew: boolean): void {
    const current = this.workDocs[this.docPart];
    if (!current) return;
    const fields = current.fields.map((field) => ({ ...field }));
    if (!asNew && this.editingId) {
      this.madeDocs = this.madeDocs.map((item) => item.id === this.editingId ? { ...item, fields, at: '20/05/2562' } : item);
    } else {
      this.madeDocs = [...this.madeDocs, { id: `doc-${Date.now()}`, kind: current.title, at: '20/05/2562', fields }];
      this.editingId = '';
    }
    writeMadeDocs(this.madeDocs);
    this.notice = 'saved';
  }

  private loadMadeDocs(): void {
    const saved = readMadeDocs();
    if (saved.length) {
      this.madeDocs = saved;
      return;
    }
    this.madeDocs = defaultWorkDrafts().map((doc, index) => ({
      id: `seed-${index}`,
      kind: doc.title,
      at: '20/05/2562',
      fields: doc.fields.map((field) => ({ ...field })),
    }));
    writeMadeDocs(this.madeDocs);
  }

  protected setDraft(doc: number, index: number, value: string): void {
    this.workDocs = this.workDocs.map((item, itemIndex) => itemIndex === doc
      ? { ...item, fields: item.fields.map((field, fieldIndex) => fieldIndex === index ? { ...field, value } : field) }
      : item);
    writeWorkDrafts(this.workDocs);
  }

  private loadWorkDrafts(): void {
    const saved = readWorkDrafts();
    if (saved.length !== this.workDocs.length) return;
    this.workDocs = this.workDocs.map((item, index) => {
      const current = saved[index];
      if (!current || current.title !== item.title || current.fields.length !== item.fields.length) return item;
      return { ...item, fields: item.fields.map((field, fieldIndex) => ({ ...field, value: current.fields[fieldIndex]?.value ?? field.value })) };
    });
  }

  private loadDocNotice(): void {
    const saved = readDocNotice();
    if (!saved) return;
    this.docAction = saved.action;
    this.docNoticedOn = saved.noticedOn || this.docNoticedOn;
    this.docDueOn = saved.dueOn || this.docDueOn;
    this.docNote = saved.note || this.docNote;
    if (saved.letter.length === this.noticeLetter.length && saved.letter.every((item, index) => item.label === this.noticeLetter[index]?.label)) {
      this.noticeLetter = saved.letter.map((item) => ({ ...item }));
    }
    if (saved.files.length) this.docFiles = saved.files;
    if (saved.gaps.length) this.docGaps = saved.gaps.map((gap) => ({ ...gap }));
    this.noticeSaraban = saved.sarabanNo;
    if (saved.committee) this.applyCommittee(saved.committee);
    if (saved.inquiry) this.applyInquiry(saved.inquiry);
    this.docSent = saved.sent;
    this.docSentBy = saved.sentBy;
    this.noticePasses = saved.passes.map((pass) => ({ ...pass, reply: pass.reply ? { ...pass.reply, files: pass.reply.files.map((file) => ({ ...file })) } : null }));
    if (saved.reply) this.applyReply(saved.reply);
    else if (saved.action === 'complete') {
      const kept = [...saved.passes].reverse().find((pass) => pass.reply);
      if (kept?.reply) this.applyReply(kept.reply);
    }
  }

  private applyCommittee(record: CommitteeRecord): void {
    this.committeeAt = record.at || this.committeeAt;
    this.committeeResult = record.result;
    this.committeeFee = record.fee;
    this.committeeNote = record.note;
    this.committeeEmbassyOn = record.embassyOn;
    this.embassyFiles = record.embassyFiles.length
      ? record.embassyFiles.map((file) => ({ name: file.name, title: file.title, sentOn: file.sentOn, docId: file.docId }))
      : (record.embassyFile ? [{ name: record.embassyFile, title: record.embassyFile, sentOn: record.embassyOn, docId: '' }] : []);
    if (record.embassyLetter.length === this.embassyLetter.length) {
      this.embassyLetter = record.embassyLetter.map((field) => ({ ...field }));
    }
    this.embassyNotice = record.embassyNotice;
    this.committeeSent = record.sent;
    this.committeeSentBy = record.sentBy;
  }

  private committeePayload(): CommitteeRecord {
    return {
      at: this.committeeAt.trim(),
      result: this.committeeResult,
      fee: this.committeeResult === 'take' ? this.committeeFee : '',
      note: this.committeeNote.trim(),
      embassyOn: this.committeeEmbassyOn.trim(),
      embassyFile: this.embassyFiles[0]?.name || '',
      embassyFiles: this.embassyFiles.map((file) => ({ ...file })),
      embassyLetter: this.embassyLetter.map((field) => ({ ...field })),
      embassyNotice: this.embassyNotice,
      sent: true,
      sentBy: this.signedPerson || this.directorName,
    };
  }

  protected get keptReply(): ApplicantReply | null {
    if (this.replySent) return this.currentReply();
    return [...this.noticePasses].reverse().find((pass) => pass.reply)?.reply ?? null;
  }

  protected get canRecordCommittee(): boolean {
    if (!(this.docSent && this.docAction === 'complete') || this.committeeSent) return false;
    return this.canHandleCase;
  }

  protected get committeeForms(): { group: string; kind: string }[] {
    if (this.committeeResult === 'reject') return [{ group: 'ไม่รับคำขอ', kind: 'หนังสือคืนคำขอ' }];
    const rows = [
      { group: 'วาระอนุคณะกรรมการเทคนิคเหล็กฯ', kind: 'บันทึกขออนุมัติวาระอนุคณะกรรมการเทคนิคเหล็กฯ' },
      { group: 'วาระอนุคณะกรรมการเทคนิคเหล็กฯ', kind: 'วาระการประชุมอนุคณะกรรมการเทคนิคเหล็กฯ' },
      { group: 'วาระอนุคณะกรรมการเทคนิคเหล็กฯ', kind: 'มติที่ประชุมอนุคณะกรรมการเทคนิคเหล็กฯ' },
      { group: 'วาระอนุคณะกรรมการเทคนิคเหล็กฯ', kind: 'รายงานการประชุมอนุคณะกรรมการเทคนิคเหล็กฯ' },
      { group: 'วาระคณะอนุกรรมการไต่สวน', kind: 'บันทึกขออนุมัติวาระคณะอนุกรรมการไต่สวน' },
      { group: 'วาระคณะอนุกรรมการไต่สวน', kind: 'วาระการประชุมคณะอนุกรรมการไต่สวน' },
      { group: 'วาระคณะอนุกรรมการไต่สวน', kind: 'มติที่ประชุมคณะอนุกรรมการไต่สวน' },
      { group: 'วาระคณะอนุกรรมการไต่สวน', kind: 'รายงานการประชุมคณะอนุกรรมการไต่สวน' },
      { group: 'แจ้งการรับคำขอ', kind: 'บันทึกแจ้งการรับคำขอ' },
    ];
    if (this.embassyNotice) rows.push({ group: 'แจ้งการรับคำขอ', kind: 'หนังสือแจ้งสถานทูตรับคำขอ' });
    if (this.committeeFee === 'pay') rows.push({ group: 'แจ้งการรับคำขอ', kind: 'บันทึกถึงกองคลังรับชำระค่าธรรมเนียม' });
    return rows;
  }

  protected committeeFormKind = '';
  protected committeeDraft: { label: string; value: string; long?: boolean }[] = [];

  protected committeeFormDone(kind: string): boolean {
    return this.madeOf(kind).length > 0;
  }

  protected get committeeFormsReady(): boolean {
    return this.committeeForms.every((item) => this.committeeFormDone(item.kind));
  }

  protected get committeeReady(): boolean {
    if (!thaiDateOk(this.committeeAt, 'any')) return false;
    if (!this.committeeFormsReady) return false;
    if (this.committeeResult === 'reject') return !!this.committeeNote.trim();
    if (this.embassyNotice && !this.embassyFiles.length && !this.committeeFormDone('หนังสือแจ้งสถานทูตรับคำขอ')) return false;
    if (this.committeeFee === 'skip') return !!this.committeeNote.trim();
    return this.committeeFee === 'pay';
  }

  private inquiryCaseBody(kind: string): string {
    if (this.sampleCase) {
      const item = this.sampleCase;
      const base = `ตามคำขอเลขที่อ้างอิง ${item.ref} ของ${item.applicant || 'ผู้ยื่นคำขอ'} ยื่นเมื่อ ${item.created} เรื่อง${item.kind} สินค้า${item.goods}`;
      if (kind.includes('อังกฤษ')) return `${item.ref} ${item.goods}. Filed on ${item.created}.`;
      return `${base}\nจึงจัดทำ${kind}`;
    }
    const base = `ตามคำขอเลขที่อ้างอิง ${this.refId} ของบริษัท สหวิริยาสตีลอินดัสตรี จำกัด ยื่นเมื่อ 15/05/2562 และครบถ้วนถูกต้องเมื่อ 28/05/2562 ซึ่งอยู่ภายในกำหนด 4 เดือนที่ครบวันที่ 15/09/2562 ขอให้ไต่สวนการทุ่มตลาดเหล็กแผ่นรีดร้อนชนิดเป็นม้วนและไม่เป็นม้วน ที่มีแหล่งกำเนิดจากเวียดนามและอียิปต์ ผู้ยื่นและผู้ผลิตที่สนับสนุนมีปริมาณการผลิตรวมมากกว่าร้อยละ 25 ของสินค้าชนิดเดียวกันในประเทศ และมีหลักฐานเบื้องต้นเรื่องส่วนเหลื่อมการทุ่มตลาดและความเสียหายเพียงพอให้พิจารณาเปิดไต่สวน`;
    if (measurePack.some((item) => item.kind === kind)) {
      if (kind.includes('56')) return `${base}\nทบทวนความจำเป็นในการใช้บังคับอากรตามมาตรา 56 เคสนี้ไม่มีเหตุให้ปรับอัตราหรือยุติ จึงใช้มาตรการเดิมต่อไป`;
      if (kind.includes('57')) return `${base}\nทบทวนก่อนครบกำหนดตามมาตรา 57 ตรวจว่าการทุ่มตลาดและความเสียหายอาจเกิดซ้ำหรือไม่`;
      if (kind.includes('58') || kind.includes('รายใหม่')) return `${base}\nทบทวนผู้ส่งออกหรือผู้ผลิตรายใหม่ตามมาตรา 58 ตรวจความเกี่ยวข้องกับผู้ถูกเรียกเก็บอากรเดิมและพิจารณาหลักประกัน`;
      if (kind.includes('59') || kind.includes('คืนอากร') || kind.includes('ผู้นำเข้าขอคืน')) return `${base}\nคำขอคืนอากรตามมาตรา 59 ตรวจหลักฐานว่าส่วนเหลื่อมต่ำกว่าอากรที่เรียกเก็บหรือไม่มีส่วนเหลื่อม`;
      return `${base}\nจึงจัดทำ${kind}`;
    }
    if (finalResultPack.some((item) => item.kind === kind)) {
      if (kind.includes('เอกสารแนบ')) return `${base}\nเอกสารแนบวาระผลสิ้นสุด\n1. ร่างผลสิ้นสุดและความเห็นของผู้มีส่วนได้เสีย\n2. ตาราง Normal Value, Export Price และ Dumping Margin ที่ใช้วินิจฉัย\n3. ผลการวิเคราะห์ความเสียหายและเหตุสัมพันธ์`;
      if (kind.includes('เรียกเก็บอากร')) return `${base}\nจึงเรียกเก็บอากรตอบโต้การทุ่มตลาดตามมติผลการไต่สวนขั้นสุดท้าย อัตราเป็นไปตามมติที่ประชุม`;
      if (kind.includes('Disclosures')) return `${base}\nเปิดเผยข้อเท็จจริงสำคัญของผลการไต่สวนขั้นสุดท้าย โดยแยกฉบับปกปิดและฉบับเปิดเผย`;
      return `${base}\nจึงจัดทำ${kind} สำหรับผลการไต่สวนขั้นสุดท้าย`;
    }
    if (draftFinalPack.some((item) => item.kind === kind)) {
      if (kind.includes('เอกสารแนบ')) return `${base}\nเอกสารแนบวาระร่างผลสิ้นสุด\n1. ผลการไต่สวนขั้นต้นและหลักประกันอากรชั่วคราว\n2. ความเห็นของผู้มีส่วนได้เสียหลังประกาศผลขั้นต้น\n3. ตาราง Normal Value, Export Price และ Dumping Margin ที่ปรับปรุงแล้ว`;
      if (kind.includes('Disclosures')) return `${base}\nเปิดเผยข้อเท็จจริงสำคัญของร่างผลการไต่สวนขั้นสุดท้าย โดยแยกฉบับปกปิดและฉบับเปิดเผย`;
      if (kind.includes('ความเห็น')) return `${base}\nความเห็นต่อร่างผลการไต่สวนขั้นสุดท้าย รับไว้ในเคสตามช่องทางที่ผู้มีส่วนได้เสียส่งมา`;
      if (kind.includes('แถลงการณ์')) return `${base}\nสรุปการแถลงการณ์ร่างผลสิ้นสุดและรายชื่อผู้เข้าร่วม`;
      return `${base}\nจึงจัดทำ${kind} สำหรับร่างผลการไต่สวนขั้นสุดท้าย และเปิดรับความเห็นจากผู้มีส่วนได้เสีย`;
    }
    if (prelimPack.some((item) => item.kind === kind)) {
      if (kind.includes('เอกสารแนบ')) return `${base}\nเอกสารแนบวาระผลขั้นต้น\n1. ตารางเปรียบเทียบ Normal Value, Export Price และ Dumping Margin ของผู้ส่งออกเวียดนามและอียิปต์\n2. ปริมาณนำเข้า ผลกระทบด้านราคา ผลประกอบการ และข้อมูลศุลกากร\n3. เหตุสัมพันธ์ระหว่างสินค้านำเข้ากับความเสียหาย`;
      if (kind.includes('หลักประกัน')) return `${base}\nจึงเรียกเก็บหลักประกันอากรชั่วคราวตามมติผลการไต่สวนขั้นต้น อัตราเป็นไปตามมติที่ประชุม และยังไม่ใช้อากรขั้นสุดท้าย`;
      if (kind.includes('Disclosures')) return `${base}\nเปิดเผยข้อเท็จจริงสำคัญที่ใช้ในการไต่สวนขั้นต้น โดยแยกฉบับปกปิดและฉบับเปิดเผย`;
      if (kind.includes('แถลงการณ์')) return `${base}\nผู้มีส่วนได้เสียขอจัดแถลงการณ์ผลขั้นต้นได้ภายใน 30 วันนับจากวันประกาศ`;
      return `${base}\nจึงจัดทำ${kind} สำหรับผลการไต่สวนขั้นต้น`;
    }
    if (kind.includes('เอกสารแนบ')) return `${base}\nเอกสารแนบวาระ\n1. คำขอฉบับสมบูรณ์ ฉบับเปิดเผยและฉบับปกปิด\n2. ผลการตรวจสอบความครบถ้วนวันที่ 28/05/2562\n3. ผลการตรวจสอบสถานะอุตสาหกรรมภายใน\n4. หลักฐานเบื้องต้นเรื่องการทุ่มตลาดและความเสียหาย`;
    if (kind.includes('เรียกเก็บอากร')) return `${base}\nจึงจัดทำประกาศเรียกเก็บหลักประกันอากรต่อไปตามมติคณะกรรมการพิจารณาการทุ่มตลาดและการอุดหนุน อัตราเป็นไปตามมติที่ประชุม`;
    if (kind.includes('อังกฤษ')) return 'The Department of Foreign Trade has opened an anti-dumping investigation on hot-rolled steel in coils and not in coils originating in Vietnam and Egypt. Application REF256205150001 was filed on 15 May 2019 and found complete on 28 May 2019.';
    if (kind.includes('ข่าว')) return `${base} กรมการค้าต่างประเทศจึงเปิดไต่สวน และแจ้งผู้มีส่วนได้เสียให้ทราบ`;
    if (kind.includes('แถลงการณ์') || kind.includes('ผู้เข้าร่วม')) return `${base}\nผู้มีส่วนได้เสียขอจัดแถลงการณ์ได้ภายใน 30 วันนับจากวันประกาศ`;
    if (kind.includes('ตรวจ') || kind.includes('สล.') || kind.includes('ยินยอม') || kind.includes('เดินทาง') || kind.includes('รัฐบาล')) return `${base}\nตรวจอุตสาหกรรมในประเทศก่อนเพื่อจัดทำ Normal Value, Export Price และ Dumping Margin การตรวจต่างประเทศทำเมื่อบริษัทและรัฐบาลประเทศผู้ส่งออกยินยอม`;
    return `${base} จึงจัดทำ${kind} ตามพระราชบัญญัติการตอบโต้การทุ่มตลาดและการอุดหนุนซึ่งสินค้าจากต่างประเทศ พ.ศ. 2542 มาตรา 39`;
  }

  private inquiryAgendaText(): string {
    return [
      'ระเบียบวาระที่ 3.3 การพิจารณาเปิดไต่สวนตอบโต้การทุ่มตลาด',
      'สินค้า เหล็กแผ่นรีดร้อนชนิดเป็นม้วนและไม่เป็นม้วน จากเวียดนามและอียิปต์',
      'ผู้ยื่นคำขอ บริษัท สหวิริยาสตีลอินดัสตรี จำกัด',
      'วันที่ยื่นคำขอ 15/05/2562 วันที่คำขอครบถ้วน 28/05/2562 วันครบกำหนด 4 เดือน 15/09/2562',
      'ข้อเสนอฝ่ายเลขานุการ เห็นควรเปิดไต่สวน',
    ].join('\n');
  }

  private prelimAgendaText(): string {
    return [
      'ระเบียบวาระพิจารณาผลการไต่สวนขั้นต้น',
      'สินค้า เหล็กแผ่นรีดร้อนชนิดเป็นม้วนและไม่เป็นม้วน จากเวียดนามและอียิปต์',
      'ผู้ยื่นคำขอ บริษัท สหวิริยาสตีลอินดัสตรี จำกัด',
      this.injuryVolume || 'ปริมาณนำเข้าจากเวียดนามและอียิปต์เพิ่มขึ้นในช่วงที่ขอไต่สวน',
      this.injuryPrice || 'ราคาขายในประเทศถูกกดจากสินค้านำเข้า',
      'ข้อเสนอฝ่ายเลขานุการ เห็นควรออกประกาศผลการไต่สวนขั้นต้นและเรียกเก็บหลักประกันอากรชั่วคราวตามอัตราที่ที่ประชุมกำหนด',
    ].join('\n');
  }

  private draftAgendaText(): string {
    return [
      'ระเบียบวาระพิจารณาร่างผลการไต่สวนขั้นสุดท้าย',
      'สินค้า เหล็กแผ่นรีดร้อนชนิดเป็นม้วนและไม่เป็นม้วน จากเวียดนามและอียิปต์',
      'ผู้ยื่นคำขอ บริษัท สหวิริยาสตีลอินดัสตรี จำกัด',
      'ต่อเนื่องจากผลการไต่สวนขั้นต้นเมื่อ 20/08/2562',
      'ข้อเสนอฝ่ายเลขานุการ เห็นชอบร่างผลสิ้นสุดและเปิดรับความเห็นจากผู้มีส่วนได้เสีย',
    ].join('\n');
  }

  private finalAgendaText(): string {
    return [
      'ระเบียบวาระพิจารณาผลการไต่สวนขั้นสุดท้าย',
      'สินค้า เหล็กแผ่นรีดร้อนชนิดเป็นม้วนและไม่เป็นม้วน จากเวียดนามและอียิปต์',
      'ผู้ยื่นคำขอ บริษัท สหวิริยาสตีลอินดัสตรี จำกัด',
      'ต่อเนื่องจากร่างผลสิ้นสุดเมื่อ 15/10/2562',
      'ข้อเสนอฝ่ายเลขานุการ เห็นชอบผลสิ้นสุดและเรียกเก็บอากรตามอัตราที่ที่ประชุมกำหนด',
    ].join('\n');
  }

  private inquiryDraft(kind: string): { label: string; value: string; long?: boolean }[] | null {
    const measure = measurePack.some((item) => item.kind === kind);
    const final = !measure && finalResultPack.some((item) => item.kind === kind);
    const draft = !measure && !final && draftFinalPack.some((item) => item.kind === kind);
    const prelim = !measure && !final && !draft && prelimPack.some((item) => item.kind === kind);
    if (!measure && !final && !draft && !prelim && !inquiryPack.some((item) => item.kind === kind)) return null;
    const signer = this.signedPerson || 'นางสาวจรีณา กิจส่งเสริมกุล';
    const meetOn = measure ? (this.measureOn || '15/06/2563') : final ? (this.finalOn || '20/12/2562') : draft ? (this.draftOn || '15/10/2562') : prelim ? (this.prelimOn || '20/08/2562') : (this.inquiryAgendaAt || '10/06/2562');
    const noticeOn = meetOn;
    const agenda = measure ? `ระเบียบวาระ${kind.includes('56') ? 'ทบทวนมาตรา 56' : kind.includes('57') ? 'ทบทวนมาตรา 57' : kind.includes('58') ? 'ทบทวนมาตรา 58' : 'พิจารณาคืนอากรมาตรา 59'}\nสินค้าเหล็กแผ่นรีดร้อนจากเวียดนามและอียิปต์\nผู้ยื่นคำขอ บริษัท สหวิริยาสตีลอินดัสตรี จำกัด` : final ? this.finalAgendaText() : draft ? this.draftAgendaText() : prelim ? this.prelimAgendaText() : this.inquiryAgendaText();
    const resolution = measure
      ? (kind.includes('56') ? 'ไม่มีเหตุให้ทบทวน ใช้มาตรการเดิมต่อไป' : kind.includes('57') ? 'เข้าเงื่อนไขการทบทวนก่อนครบกำหนด และให้ตรวจการทุ่มตลาดและความเสียหายที่อาจเกิดซ้ำ' : kind.includes('58') ? 'ไม่เข้าเกณฑ์ผู้ส่งออกหรือผู้ผลิตรายใหม่' : 'ไม่เข้าเงื่อนไขการคืนอากร')
      : final
        ? 'เห็นชอบผลการไต่สวนขั้นสุดท้าย และให้เรียกเก็บอากรตามอัตราที่ที่ประชุมกำหนด'
        : draft
          ? 'เห็นชอบร่างผลการไต่สวนขั้นสุดท้าย และให้เปิดรับความเห็นจากผู้มีส่วนได้เสีย'
          : prelim
            ? 'เห็นชอบผลการไต่สวนขั้นต้น และให้เรียกเก็บหลักประกันอากรชั่วคราวตามอัตราที่ที่ประชุมกำหนด'
            : 'เปิดไต่สวน ตามพระราชบัญญัติการตอบโต้การทุ่มตลาดและการอุดหนุนซึ่งสินค้าจากต่างประเทศ พ.ศ. 2542 มาตรา 39';
    const report = measure
      ? `ที่ประชุมเมื่อ ${meetOn} มีมติเกี่ยวกับ${kind}`
      : final
        ? `ที่ประชุมเมื่อ ${meetOn} มีมติเห็นชอบผลสิ้นสุดคำขอเลขที่อ้างอิง ${this.refId}`
        : draft
          ? `ที่ประชุมเมื่อ ${meetOn} มีมติเห็นชอบร่างผลสิ้นสุดคำขอเลขที่อ้างอิง ${this.refId}`
          : prelim
            ? `ที่ประชุมเมื่อ ${meetOn} มีมติเห็นชอบผลการไต่สวนขั้นต้นคำขอเลขที่อ้างอิง ${this.refId}`
            : `ที่ประชุมครั้งที่ 1/2562 เมื่อ ${meetOn} เวลา 09.30 น. ณ ห้องประชุม กรมการค้าต่างประเทศ มีมติเปิดไต่สวนคำขอเลขที่อ้างอิง ${this.refId}`;
    const body = this.inquiryCaseBody(kind);
    if (kind.includes('ข่าวหนังสือพิมพ์')) {
      return [
        field('วันที่', noticeOn),
        field('ภาษา', kind.includes('อังกฤษ') ? 'อังกฤษ' : 'ไทย'),
        field('หัวข่าว', kind.includes('อังกฤษ') ? 'DFT opens anti-dumping investigation on hot-rolled steel from Vietnam and Egypt' : 'กรมการค้าต่างประเทศเปิดไต่สวนการทุ่มตลาดเหล็กแผ่นรีดร้อนจากเวียดนามและอียิปต์'),
        field('เนื้อข่าว', body, true),
      ];
    }
    if (kind.startsWith('วาระการประชุม') || kind.startsWith('มติที่ประชุม') || kind.startsWith('รายงานการประชุม')) {
      return [
        field('ครั้งที่', '1/2562'),
        field('วันที่ประชุม', meetOn),
        field('ระเบียบวาระ', agenda, true),
        field('มติที่ประชุม', resolution, true),
        field('รายงานการประชุม', report, true),
      ];
    }
    if (kind.startsWith('Chairman')) {
      return [
        field('วันที่', meetOn),
        field('เรื่อง', final ? 'Chairman’s Note ผลสิ้นสุด' : draft ? 'Chairman’s Note ร่างผลสิ้นสุด' : prelim ? 'Chairman’s Note ผลขั้นต้น' : 'Chairman’s Note เปิดไต่สวน'),
        field('เนื้อความ', `${agenda}\n${body}`, true),
        field('ลงชื่อ', signer),
      ];
    }
    if (kind.includes('ประกาศ') && !kind.startsWith('บันทึก') && !kind.startsWith('หนังสือ')) {
      return [
        field('ที่', 'กพ. / กองปกป้องและตอบโต้ทางการค้า'),
        field('วันที่', noticeOn),
        field('เรื่อง', kind),
        field('เนื้อประกาศ', body, true),
        field('ลงชื่อ', signer),
      ];
    }
    return [
      field('ที่', 'กพ. / กองปกป้องและตอบโต้ทางการค้า'),
      field('วันที่', kind.includes('วาระ') || kind.includes('เอกสารแนบ') ? meetOn : noticeOn),
      field('เรื่อง', kind),
      field('เรียน', this.packAddressee(kind)),
      field('เนื้อความ', body, true),
      field('ลงชื่อ', signer),
    ];
  }

  protected openCommitteeForm(kind: string): void {
    const saved = this.madeOf(kind).at(-1);
    const meeting = kind.startsWith('วาระ') || kind.startsWith('มติ') || kind.startsWith('รายงาน');
    const news = kind.includes('ข่าวหนังสือพิมพ์');
    const announce = kind.includes('ประกาศ');
    const seeded = this.inquiryDraft(kind);
    const fresh = seeded ?? (meeting
      ? [
          field('ครั้งที่', '1/2562'),
          field('วันที่ประชุม', this.committeeAt || this.inquiryNoticeOn),
          field('ระเบียบวาระ', '', true),
          field('มติที่ประชุม', '', true),
          field('รายงานการประชุม', '', true),
        ]
      : news
      ? [
          field('วันที่', this.inquiryNoticeOn || this.committeeAt),
          field('ภาษา', kind.includes('อังกฤษ') ? 'อังกฤษ' : 'ไทย'),
          field('หัวข่าว', kind),
          field('เนื้อข่าว', '', true),
        ]
      : announce
      ? [
          field('ที่', 'กพ. / กองปกป้องและตอบโต้ทางการค้า'),
          field('วันที่', this.inquiryNoticeOn || this.committeeAt),
          field('เรื่อง', kind),
          field('เนื้อประกาศ', '', true),
          field('ลงชื่อ', this.signedPerson || 'นางสาวจรีณา กิจส่งเสริมกุล'),
        ]
      : [
          field('ที่', 'กพ. / กองปกป้องและตอบโต้ทางการค้า'),
          field('วันที่', this.committeeAt),
          field('เรื่อง', kind),
          field('เรียน', this.packAddressee(kind)),
          field('เนื้อความ', '', true),
          field('ลงชื่อ', this.signedPerson || 'นางสาวจรีณา กิจส่งเสริมกุล'),
        ]);
    this.committeeDraft = fresh.map((item) => ({ ...item, value: saved?.fields.find((field) => field.label === item.label)?.value ?? item.value }));
    this.committeeFormKind = kind;
  }

  protected assistCommitteeForm(): void {
    const kind = this.committeeFormKind;
    const seed = this.inquiryDraft(kind);
    if (seed) {
      this.committeeDraft = this.committeeDraft.map((item) => item.value.trim() ? item : { ...item, value: seed.find((row) => row.label === item.label)?.value ?? item.value });
      return;
    }
    this.committeeDraft = this.committeeDraft.map((item) => {
      if (item.value.trim()) return item;
      if (item.label === 'ระเบียบวาระ') return { ...item, value: `พิจารณารับคำขอเลขที่อ้างอิง ${this.refId}` };
      if (item.label === 'มติที่ประชุม') return { ...item, value: this.committeeResult === 'reject' ? 'ไม่รับคำขอ' : 'รับคำขอและแจ้งชำระค่าธรรมเนียม' };
      if (item.label === 'รายงานการประชุม') return { ...item, value: `ที่ประชุมมีมติเกี่ยวกับ${kind}` };
      if (item.label === 'เนื้อความ' || item.label === 'เนื้อประกาศ' || item.label === 'เนื้อข่าว') return { ...item, value: `ตามคำขอเลขที่อ้างอิง ${this.refId} จึงจัดทำ${kind}` };
      return item;
    });
  }

  protected setCommitteeDraft(index: number, value: string): void {
    this.committeeDraft = this.committeeDraft.map((item, itemIndex) => itemIndex === index ? { ...item, value } : item);
  }

  private packAddressee(kind: string): string {
    if (kind.includes('กม.')) return 'ผู้อำนวยการกองกฎหมาย';
    if (kind.includes('ราชกิจจา')) return 'ผู้อำนวยการสำนักพิมพ์คณะรัฐมนตรีและราชกิจจานุเบกษา';
    if (kind.includes('สล.')) return 'เลขานุการกรมการค้าต่างประเทศ';
    if (kind.includes('ปลัด') || kind.includes('รมว.')) return 'ปลัดกระทรวงพาณิชย์';
    if (kind.includes('อธ.')) return 'อธิบดีกรมการค้าต่างประเทศ';
    if (kind.includes('สถานทูตไทย')) return 'สถานเอกอัครราชทูตไทย';
    if (kind.includes('สถานทูต') || kind.includes('รัฐบาล')) return 'สถานเอกอัครราชทูตประเทศผู้ส่งออก';
    if (kind.includes('ผู้ส่งออก')) return 'ผู้ส่งออกที่ถูกกล่าวหา';
    if (kind.includes('สพต') || kind.includes('สคต')) return 'สำนักงานพาณิชย์ในต่างประเทศ';
    if (kind.includes('ศุลกากร')) return 'อธิบดีกรมศุลกากร';
    if (kind.includes('ผู้นำเข้า')) return 'ผู้นำเข้าและผู้ใช้';
    if (kind.includes('อุตสาหกรรมภายใน')) return 'ผู้ผลิตในประเทศ';
    if (kind.includes('สมาคม')) return 'สมาคมการค้า';
    if (kind.includes('ขออนุมัติ') || kind.includes('ในประเทศ')) return kind.includes('ในประเทศ') && !kind.includes('ขออนุมัติ') ? 'ผู้ผลิตในประเทศ' : 'อธิบดีกรมการค้าต่างประเทศ';
    if (kind.includes('ยินยอม')) return 'อธิบดีกรมการค้าต่างประเทศ';
    if (kind.includes('กองคลัง')) return 'ผู้อำนวยการกองคลัง';
    if (kind.includes('แถลงการณ์') || kind.includes('ผู้เข้าร่วม')) return 'ผู้มีส่วนได้เสียที่ขอแถลงการณ์';
    if (kind.includes('Disclosures')) return 'ผู้มีส่วนได้เสีย';
    return 'บริษัท สหวิริยาสตีลอินดัสตรี จำกัด';
  }

  protected readonly inquiryFacts: { label: string; value: string; wide?: boolean }[] = [
    { label: 'ผู้ยื่นคำขอ', value: 'บริษัท สหวิริยาสตีลอินดัสตรี จำกัด' },
    { label: 'สินค้า', value: 'เหล็กแผ่นรีดร้อนชนิดเป็นม้วนและไม่เป็นม้วน' },
    { label: 'แหล่งกำเนิด', value: 'เวียดนาม และอียิปต์' },
    { label: 'วันที่ยื่นคำขอ', value: '15/05/2562' },
    { label: 'วันที่ครบถ้วน', value: '28/05/2562' },
    { label: 'ครบกำหนด 4 เดือน', value: '15/09/2562' },
    { label: 'ข้อกฎหมาย', value: 'พระราชบัญญัติการตอบโต้การทุ่มตลาดและการอุดหนุนซึ่งสินค้าจากต่างประเทศ พ.ศ. 2542 มาตรา 39', wide: true },
  ];

  protected inquiryFormsOf(step: string): { group: string; kind: string }[] {
    return inquiryPack.filter((item) => item.step === step);
  }

  protected get inquiryDocStep(): boolean {
    return this.inquiryPart === 'agenda' || this.inquiryPart === 'notice' || this.inquiryPart === 'sign' || this.inquiryPart === 'letters' || this.inquiryPart === 'news';
  }

  protected inquiryStepTitle(): string {
    return this.inquiryNav.find((step) => step.id === this.inquiryPart)?.label ?? 'แบบฟอร์มเปิดไต่สวน';
  }

  protected inquiryStepHint(): string {
    if (this.inquiryPart === 'agenda') return 'บันทึกขออนุมัติวาระ วาระการประชุม เอกสารแนบ Chairman’s Note มติที่ประชุม และรายงานการประชุม';
    if (this.inquiryPart === 'notice') return 'ร่างประกาศกรม ร่างประกาศเรียกเก็บอากรต่อไป และบันทึกให้กองกฎหมายตรวจร่าง';
    if (this.inquiryPart === 'sign') return 'ลงนามประกาศ ส่งราชกิจจานุเบกษา และเก็บหนังสือแจ้งว่าลงประกาศแล้ว';
    if (this.inquiryPart === 'letters') return 'แจ้งสถานทูต ผู้ส่งออก สพต./สคต. กรมศุลกากร ผู้นำเข้า อุตสาหกรรมภายใน และสมาคม';
    return 'ข่าวภาษาไทยและภาษาอังกฤษหลังประกาศเปิดไต่สวน';
  }

  protected inquiryPackDone(step: string): boolean {
    const rows = this.inquiryFormsOf(step);
    return rows.length > 0 && rows.every((item) => this.committeeFormDone(item.kind));
  }

  protected fillInquiryPack(): void {
    if (this.reviewTab === 'prelim') {
      this.fillPrelimPack();
      this.notice = 'assist';
      return;
    }
    if (this.reviewTab === 'draftFinal') {
      this.fillDraftPack();
      this.notice = 'assist';
      return;
    }
    if (this.reviewTab === 'finalResult') {
      this.fillFinalPack();
      this.notice = 'assist';
      return;
    }
    if (this.reviewTab === 'measures') {
      this.fillMeasurePack();
      this.notice = 'assist';
      return;
    }
    const rows = this.inquiryFormsOf(this.inquiryPart);
    const at = this.inquiryPart === 'agenda' || this.inquiryPart === 'hearing' || this.inquiryPart === 'visit' ? (this.inquiryAgendaAt || '10/06/2562') : (this.inquiryNoticeOn || '25/06/2562');
    rows.forEach((row, index) => {
      if (this.committeeFormDone(row.kind)) return;
      const fields = this.inquiryDraft(row.kind);
      if (!fields) return;
      this.madeDocs = [...this.madeDocs, { id: `inquiry-${Date.now()}-${index}`, kind: row.kind, at, fields }];
    });
    writeMadeDocs(this.madeDocs);
    if (this.inquiryPart === 'agenda') this.inquiryFields = agendaFieldList();
    if (this.inquiryPart === 'visit') this.fillVisitData();
    this.notice = 'assist';
  }

  protected readonly prelimNav: { id: 'sub' | 'tdc' | 'bond' | 'bondLetters' | 'dept' | 'deptLetters' | 'hearing' | 'close'; label: string; group: string }[] = [
    { id: 'sub', label: 'วาระอนุ', group: 'ผลขั้นต้น' },
    { id: 'tdc', label: 'วาระ ทตอ.', group: 'ผลขั้นต้น' },
    { id: 'bond', label: 'ประกาศหลักประกันอากร', group: 'ผลขั้นต้น' },
    { id: 'bondLetters', label: 'หนังสือแจ้งหลักประกัน', group: 'ผลขั้นต้น' },
    { id: 'dept', label: 'ประกาศกรม', group: 'ผลขั้นต้น' },
    { id: 'deptLetters', label: 'หนังสือแจ้งประกาศ', group: 'ผลขั้นต้น' },
    { id: 'hearing', label: 'แถลงการณ์', group: 'หลังประกาศ' },
    { id: 'close', label: 'ไปร่างผลสิ้นสุด', group: 'หลังประกาศ' },
  ];

  protected prelimFormsOf(step: string): { group: string; kind: string }[] {
    return prelimPack.filter((item) => item.step === step);
  }

  protected prelimStepTitle(): string {
    return this.prelimNav.find((step) => step.id === this.prelimPart)?.label ?? 'ผลขั้นต้น';
  }

  protected prelimStepHint(): string {
    if (this.prelimPart === 'sub') return 'บันทึกขออนุมัติวาระ วาระ เอกสารแนบ มติ และรายงานของอนุคณะกรรมการไต่สวน';
    if (this.prelimPart === 'tdc') return 'บันทึกขออนุมัติวาระ วาระ เอกสารแนบ Chairman’s Note มติ และรายงานของ ทตอ.';
    if (this.prelimPart === 'bond') return 'ร่างประกาศเรียกเก็บหลักประกันอากร ตรวจร่าง ลงนาม และราชกิจจานุเบกษา';
    if (this.prelimPart === 'bondLetters') return 'แจ้งสถานทูต ผู้ส่งออก สพต./สคต. กรมศุลกากร ผู้นำเข้า อุตสาหกรรมภายใน และสมาคม';
    if (this.prelimPart === 'dept') return 'ร่างประกาศกรม ลงนาม ราชกิจจานุเบกษา และ Disclosures ฉบับปกปิดกับฉบับเปิดเผย';
    if (this.prelimPart === 'deptLetters') return 'แจ้งสถานทูต ผู้ส่งออก ผู้นำเข้า อุตสาหกรรมภายใน และสมาคม';
    return 'หนังสือขอจัด บันทึกอนุมัติ หนังสือแจ้งผู้เข้าร่วม และรายงานผลการแถลงการณ์';
  }

  protected prelimPackDone(step: string): boolean {
    const rows = this.prelimFormsOf(step);
    return rows.length > 0 && rows.every((item) => this.committeeFormDone(item.kind));
  }

  protected get prelimExtraForms(): MadeDoc[] {
    return this.madeDocs.filter((item) => item.fields.some((field) => field.label === 'ขั้นตอน' && field.value === 'ผลขั้นต้น'));
  }

  protected get prelimFiles(): { kind: string; name: string; title: string; sentOn: string }[] {
    return this.extrasOf('ผลขั้นต้น');
  }

  protected setPrelimOn(value: string): void {
    this.prelimOn = value;
    this.keepNote('prelim-on', value);
  }

  protected openNewPrelimForm(): void {
    this.committeeDraft = [
      field('ที่', 'กพ. / กองปกป้องและตอบโต้ทางการค้า'),
      field('วันที่', this.prelimOn),
      field('เรื่อง', ''),
      field('เรียน', ''),
      field('เนื้อความ', '', true),
      field('ลงชื่อ', this.signedPerson || 'นางสาวจรีณา กิจส่งเสริมกุล'),
      field('ขั้นตอน', 'ผลขั้นต้น'),
    ];
    this.committeeFormKind = 'สร้างแบบฟอร์มผลขั้นต้น';
  }

  private fillPrelimPack(): void {
    const rows = this.prelimFormsOf(this.prelimPart);
    rows.forEach((row, index) => {
      if (this.committeeFormDone(row.kind)) return;
      const fields = this.inquiryDraft(row.kind);
      if (!fields) return;
      this.madeDocs = [...this.madeDocs, { id: `prelim-${Date.now()}-${index}`, kind: row.kind, at: this.prelimOn || '20/08/2562', fields }];
    });
    writeMadeDocs(this.madeDocs);
  }

  protected get hearingLane() {
    return readHearing();
  }

  protected bookHearing(): void {
    const lane = readHearing();
    if (!lane || lane.step !== 'ask' || !thaiDateOk(this.hearingWhen, 'any') || !this.hearingPlaceLane.trim()) return;
    writeHearing({ ...lane, step: 'booked', when: this.hearingWhen.trim(), place: this.hearingPlaceLane.trim() });
    this.view.markForCheck();
  }

  protected skipHearing(): void {
    const lane = readHearing();
    if (!lane || lane.step !== 'ask') return;
    writeHearing({ ...lane, step: 'skip' });
    this.view.markForCheck();
  }

  protected saveHearingSummary(): void {
    const lane = readHearing();
    const summary = this.hearingSummary.trim();
    if (!lane || lane.step !== 'approved' || !summary) return;
    writeHearing({ ...lane, step: 'done', summary });
    this.view.markForCheck();
  }

  protected closePrelim(): void {
    if (this.prelimAgain !== 'yes' && this.prelimAgain !== 'no') return;
    const notes = { ...this.laterPhase.notes, 'prelim-hearing': this.prelimHearing, 'prelim-again': this.prelimAgain, 'prelim-on': this.prelimOn };
    if (this.prelimAgain === 'yes') {
      this.laterPhase = { ...this.laterPhase, prelim: false, notes };
      writeLaterPhase(this.laterPhase);
      this.notice = 'saved';
      return;
    }
    this.laterPhase = { ...this.laterPhase, prelim: true, notes };
    writeLaterPhase(this.laterPhase);
    this.notice = 'saved';
  }

  protected readonly draftNav: { id: 'sub' | 'tdc' | 'letters' | 'hearing' | 'close'; label: string; group: string }[] = [
    { id: 'sub', label: 'วาระอนุ', group: 'ร่างผลสิ้นสุด' },
    { id: 'tdc', label: 'วาระ ทตอ.', group: 'ร่างผลสิ้นสุด' },
    { id: 'letters', label: 'แจ้งผู้มีส่วนได้เสีย', group: 'ร่างผลสิ้นสุด' },
    { id: 'hearing', label: 'แถลงการณ์', group: 'หลังแจ้งร่าง' },
    { id: 'close', label: 'ไปผลสิ้นสุด', group: 'หลังแจ้งร่าง' },
  ];

  protected draftFormsOf(step: string): { group: string; kind: string }[] {
    return draftFinalPack.filter((item) => item.step === step);
  }

  protected draftStepTitle(): string {
    return this.draftNav.find((step) => step.id === this.draftPart)?.label ?? 'ร่างผลสิ้นสุด';
  }

  protected draftStepHint(): string {
    if (this.draftPart === 'sub') return 'บันทึกขออนุมัติวาระ วาระ เอกสารแนบ มติ และรายงานของอนุคณะกรรมการไต่สวน';
    if (this.draftPart === 'tdc') return 'บันทึกขออนุมัติวาระ วาระ เอกสารแนบ มติ Chairman’s Note และรายงานของ ทตอ.';
    if (this.draftPart === 'letters') return 'หนังสือแจ้งสถานทูตและผู้ส่งออก Disclosures ฉบับปกปิดกับฉบับเปิดเผย และหนังสือถึงผู้นำเข้า อุตสาหกรรมภายใน สมาคม';
    return 'ความเห็นฉบับเปิดเผยและฉบับปกปิด รายงานแถลงการณ์ และรายชื่อผู้เข้าร่วม';
  }

  protected draftPackDone(step: string): boolean {
    const rows = this.draftFormsOf(step);
    return rows.length > 0 && rows.every((item) => this.committeeFormDone(item.kind));
  }

  protected get draftExtraForms(): MadeDoc[] {
    return this.madeDocs.filter((item) => item.fields.some((field) => field.label === 'ขั้นตอน' && field.value === 'ร่างผลสิ้นสุด'));
  }

  protected get draftFiles(): { kind: string; name: string; title: string; sentOn: string }[] {
    return this.extrasOf('ร่างผลสิ้นสุด');
  }

  protected setDraftOn(value: string): void {
    this.draftOn = value;
    this.keepNote('draft-on', value);
  }

  protected openNewDraftForm(): void {
    this.committeeDraft = [
      field('ที่', 'กพ. / กองปกป้องและตอบโต้ทางการค้า'),
      field('วันที่', this.draftOn),
      field('เรื่อง', ''),
      field('เรียน', ''),
      field('เนื้อความ', '', true),
      field('ลงชื่อ', this.signedPerson || 'นางสาวจรีณา กิจส่งเสริมกุล'),
      field('ขั้นตอน', 'ร่างผลสิ้นสุด'),
    ];
    this.committeeFormKind = 'สร้างแบบฟอร์มร่างผลสิ้นสุด';
  }

  private fillDraftPack(): void {
    const rows = this.draftFormsOf(this.draftPart);
    rows.forEach((row, index) => {
      if (this.committeeFormDone(row.kind)) return;
      const fields = this.inquiryDraft(row.kind);
      if (!fields) return;
      this.madeDocs = [...this.madeDocs, { id: `draft-${Date.now()}-${index}`, kind: row.kind, at: this.draftOn || '15/10/2562', fields }];
    });
    writeMadeDocs(this.madeDocs);
  }

  protected closeDraft(): void {
    if (this.draftSubstance !== 'yes' && this.draftSubstance !== 'no') return;
    const notes = { ...this.laterPhase.notes, 'draft-substance': this.draftSubstance, 'draft-on': this.draftOn };
    if (this.draftSubstance === 'yes') {
      this.laterPhase = { ...this.laterPhase, draftFinal: false, notes };
      writeLaterPhase(this.laterPhase);
      this.notice = 'saved';
      return;
    }
    this.laterPhase = { ...this.laterPhase, draftFinal: true, notes };
    writeLaterPhase(this.laterPhase);
    this.notice = 'saved';
  }

  protected readonly finalNav: { id: 'sub' | 'tdc' | 'duty' | 'dutyLetters' | 'dept' | 'deptLetters' | 'close'; label: string; group: string }[] = [
    { id: 'sub', label: 'วาระอนุ', group: 'ผลสิ้นสุด' },
    { id: 'tdc', label: 'วาระ ทตอ.', group: 'ผลสิ้นสุด' },
    { id: 'duty', label: 'ประกาศเรียกเก็บอากร', group: 'ผลสิ้นสุด' },
    { id: 'dutyLetters', label: 'หนังสือแจ้งอากร', group: 'ผลสิ้นสุด' },
    { id: 'dept', label: 'ประกาศกรม', group: 'ผลสิ้นสุด' },
    { id: 'deptLetters', label: 'หนังสือแจ้งประกาศ', group: 'ผลสิ้นสุด' },
    { id: 'close', label: 'ปิดงาน', group: 'หลังประกาศ' },
  ];

  protected finalFormsOf(step: string): { group: string; kind: string }[] {
    return finalResultPack.filter((item) => item.step === step);
  }

  protected finalStepTitle(): string {
    return this.finalNav.find((step) => step.id === this.finalPart)?.label ?? 'ผลสิ้นสุด';
  }

  protected finalStepHint(): string {
    if (this.finalPart === 'sub') return 'บันทึกขออนุมัติวาระ วาระ เอกสารแนบ มติ และรายงานของอนุคณะกรรมการไต่สวน';
    if (this.finalPart === 'tdc') return 'บันทึกขออนุมัติวาระ วาระ เอกสารแนบ มติ Chairman’s Note และรายงานของ ทตอ.';
    if (this.finalPart === 'duty') return 'ร่างประกาศเรียกเก็บอากร ตรวจร่าง ลงนาม และราชกิจจานุเบกษา';
    if (this.finalPart === 'dutyLetters') return 'แจ้งสถานทูต ผู้ส่งออก กรมศุลกากร สถานทูตไทย ผู้นำเข้า อุตสาหกรรมภายใน และสมาคม';
    if (this.finalPart === 'dept') return 'ร่างประกาศกรม ลงนาม ราชกิจจานุเบกษา และ Disclosures ฉบับปกปิดกับฉบับเปิดเผย';
    return 'แจ้งสถานทูต ผู้ส่งออก ผู้นำเข้า อุตสาหกรรมภายใน และสมาคม';
  }

  protected finalPackDone(step: string): boolean {
    const rows = this.finalFormsOf(step);
    return rows.length > 0 && rows.every((item) => this.committeeFormDone(item.kind));
  }

  protected get finalExtraForms(): MadeDoc[] {
    return this.madeDocs.filter((item) => item.fields.some((field) => field.label === 'ขั้นตอน' && field.value === 'ผลสิ้นสุด'));
  }

  protected get finalFiles(): { kind: string; name: string; title: string; sentOn: string }[] {
    return this.extrasOf('ผลสิ้นสุด');
  }

  protected setFinalOn(value: string): void {
    this.finalOn = value;
    this.keepNote('final-on', value);
  }

  protected openNewFinalForm(): void {
    this.committeeDraft = [
      field('ที่', 'กพ. / กองปกป้องและตอบโต้ทางการค้า'),
      field('วันที่', this.finalOn),
      field('เรื่อง', ''),
      field('เรียน', ''),
      field('เนื้อความ', '', true),
      field('ลงชื่อ', this.signedPerson || 'นางสาวจรีณา กิจส่งเสริมกุล'),
      field('ขั้นตอน', 'ผลสิ้นสุด'),
    ];
    this.committeeFormKind = 'สร้างแบบฟอร์มผลสิ้นสุด';
  }

  private fillFinalPack(): void {
    const rows = this.finalFormsOf(this.finalPart);
    rows.forEach((row, index) => {
      if (this.committeeFormDone(row.kind)) return;
      const fields = this.inquiryDraft(row.kind);
      if (!fields) return;
      this.madeDocs = [...this.madeDocs, { id: `final-${Date.now()}-${index}`, kind: row.kind, at: this.finalOn || '20/12/2562', fields }];
    });
    writeMadeDocs(this.madeDocs);
  }

  protected closeFinal(): void {
    this.laterPhase = { ...this.laterPhase, finalResult: true, notes: { ...this.laterPhase.notes, 'final-on': this.finalOn } };
    writeLaterPhase(this.laterPhase);
    this.notice = 'saved';
  }

  protected get casePublished(): boolean {
    return !!this.laterPhase.notes['published'];
  }

  protected publishCase(): void {
    const at = this.finalOn || '20/12/2562';
    const code = this.sampleCase?.code || this.refId;
    this.pushLink('e-Office', 'ส่งเรื่องปิดคดี', `เลขสารบรรณ ${this.filingSaraban} ส่งเข้า e-Office แล้ว`, this.filingSaraban, at);
    this.pushLink('eTR', 'อัปเดตผลสิ้นสุด', `Ref Case ID (eTR) ${this.etrRefNo} อัปเดตผลของ ${this.refId} แล้ว`, this.etrRefNo, at);
    this.pushLink('ThaiTR', 'เผยแพร่ผลบน ThaiTR', `https://thaitr.dft.go.th/th/search/${code}`, code, at);
    this.keepNote('published', at);
    this.closeFinal();
  }

  protected draftHearingTranscript(): void {
    this.hearingMemo = 'ร่างสรุปจากการถอดเสียง ยังต้องให้เจ้าหน้าที่ตรวจก่อนนำไปใช้ ประเด็นที่ได้ยินคือคำขอเข้าฟังความคิดเห็น วันนัด และรายชื่อผู้ขอเข้าร่วม';
  }

  protected draftAgencyLetter(): void {
    const kind = this.workDocs[this.docPart]?.title || 'หนังสือขอข้อมูลหน่วยงานที่เกี่ยวข้อง';
    const at = '28/05/2562';
    this.madeDocs = [...this.madeDocs, {
      id: `agency-letter-${Date.now()}`,
      kind,
      at,
      fields: [
        { label: 'เรียน', value: 'หน่วยงานที่เกี่ยวข้อง' },
        { label: 'เรื่อง', value: 'ขอข้อมูลเพื่อประกอบการไต่สวน' },
        { label: 'เนื้อความ', value: `ด้วยกรมการค้าต่างประเทศอยู่ระหว่างพิจารณาคำขอเลขที่อ้างอิง ${this.refId} จึงขอความอนุเคราะห์ข้อมูลที่เกี่ยวข้องกับสินค้าในคำขอ เพื่อใช้ประกอบการพิจารณา`, long: true },
      ],
    }];
    writeMadeDocs(this.madeDocs);
    this.notice = 'assist';
  }

  private pushLink(system: string, title: string, detail: string, refNo: string, at: string): void {
    const row: SystemLink = {
      id: `${system}-${Date.now()}`,
      at,
      system,
      title,
      detail,
      state: 'success',
      mode: 'manual',
      refNo,
      error: '',
      log: [{ at, text: `${this.signedPerson || 'เจ้าหน้าที่'} ${title}` }],
    };
    this.links = [row, ...this.links];
    writeSystemLinks(this.links);
  }

  protected readonly measureNav: { id: 'm56' | 'm57' | 'm58' | 'm59' | 'close'; label: string; hint: string }[] = [
    { id: 'm56', label: 'มาตรา 56', hint: 'ทบทวนความจำเป็นในการใช้บังคับอากร ถ้าไม่มีเหตุให้ใช้มาตรการเดิมต่อ' },
    { id: 'm57', label: 'มาตรา 57', hint: 'ทบทวนก่อนครบกำหนด ถ้าเข้าเงื่อนไขจึงตรวจการทุ่มตลาดและความเสียหายที่อาจเกิดซ้ำ' },
    { id: 'm58', label: 'มาตรา 58', hint: 'ผู้ส่งออกหรือผู้ผลิตรายใหม่ ตรวจความเกี่ยวข้องและพิจารณาหลักประกัน' },
    { id: 'm59', label: 'มาตรา 59', hint: 'ขอคืนอากรเมื่อส่วนเหลื่อมต่ำกว่าอากรหรือไม่มีส่วนเหลื่อม' },
    { id: 'close', label: 'สรุปผล', hint: 'บันทึกผลทั้งสี่มาตรา' },
  ];

  protected measureFormsOf(step: string): { group: string; kind: string }[] {
    return measurePack.filter((item) => item.step === step);
  }

  protected measureChoice(step: 'm56' | 'm57' | 'm58' | 'm59'): '' | 'yes' | 'no' {
    if (step === 'm56') return this.measure56;
    if (step === 'm57') return this.measure57;
    if (step === 'm58') return this.measure58;
    return this.measure59;
  }

  protected setMeasureChoice(step: 'm56' | 'm57' | 'm58' | 'm59', value: 'yes' | 'no'): void {
    if (step === 'm56') this.measure56 = value;
    else if (step === 'm57') this.measure57 = value;
    else if (step === 'm58') this.measure58 = value;
    else this.measure59 = value;
  }

  protected measureYes(step: 'm56' | 'm57' | 'm58' | 'm59'): string {
    if (step === 'm56') return 'มีเหตุให้ทบทวน';
    if (step === 'm57') return 'เข้าเงื่อนไข';
    if (step === 'm58') return 'เข้าเกณฑ์รายใหม่';
    return 'เข้าเงื่อนไขคืนอากร';
  }

  protected measureNo(step: 'm56' | 'm57' | 'm58' | 'm59'): string {
    if (step === 'm56') return 'ใช้มาตรการเดิม';
    if (step === 'm57') return 'สิ้นสุดตามกฎหมาย';
    if (step === 'm58') return 'ไม่เข้าเกณฑ์';
    return 'ไม่เข้าเงื่อนไข';
  }

  protected measurePackDone(step: string): boolean {
    const rows = this.measureFormsOf(step);
    return rows.length > 0 && rows.every((item) => this.committeeFormDone(item.kind));
  }

  protected setMeasureOn(value: string): void {
    this.measureOn = value;
    this.keepNote('measure-on', value);
  }

  private fillMeasurePack(): void {
    const rows = this.measureFormsOf(this.measurePart);
    rows.forEach((row, index) => {
      if (this.committeeFormDone(row.kind)) return;
      const fields = this.inquiryDraft(row.kind);
      if (!fields) return;
      this.madeDocs = [...this.madeDocs, { id: `measure-${Date.now()}-${index}`, kind: row.kind, at: this.measureOn || '15/06/2563', fields }];
    });
    writeMadeDocs(this.madeDocs);
  }

  protected closeMeasures(): void {
    if (!this.measure56 || !this.measure57 || !this.measure58 || !this.measure59) return;
    const marks = { ...this.laterPhase.marks, m56: this.measure56, m57: this.measure57, m58: this.measure58, m59: this.measure59 };
    this.laterPhase = { ...this.laterPhase, measures: true, marks, notes: { ...this.laterPhase.notes, 'measure-on': this.measureOn } };
    writeLaterPhase(this.laterPhase);
    this.notice = 'saved';
  }

  protected setVisitRow(index: number, key: 'normalValue' | 'exportPrice' | 'compare' | 'margin', value: string): void {
    this.visitRows = this.visitRows.map((row, rowIndex) => rowIndex === index ? { ...row, [key]: value } : row);
    const first = this.visitRows[0];
    if (first) {
      this.normalValue = first.normalValue;
      this.exportPrice = first.exportPrice;
      this.dumpingMargin = first.margin;
    }
  }

  protected questionOpen(id: string): boolean {
    return (this.laterPhase.notes['qn-open'] || '').split(',').includes(id);
  }

  protected publishQuestion(id: string): void {
    const ids = new Set((this.laterPhase.notes['qn-open'] || '').split(',').filter(Boolean));
    ids.add(id);
    this.keepNote('qn-open', [...ids].join(','));
    this.notice = 'assist';
  }

  private fillVisitData(): void {
    this.visitDomestic = true;
    this.visitRows = [
      { name: 'ผู้ผลิตและผู้ส่งออกเวียดนาม', normalValue: 'ราคาขายเหล็กแผ่นรีดร้อนในประเทศเวียดนามตามคำตอบแบบสอบถาม', exportPrice: 'ราคาส่งออกมายังประเทศไทยตามคำตอบแบบสอบถาม', compare: 'ปรับระดับการค้าและเงื่อนไขการขายให้เทียบกันได้', margin: 'ส่วนเหลื่อมการทุ่มตลาดของผู้ส่งออกเวียดนามจากการเปรียบเทียบอย่างเป็นธรรม' },
      { name: 'ผู้ผลิตและผู้ส่งออกอียิปต์', normalValue: 'ราคาขายเหล็กแผ่นรีดร้อนในประเทศอียิปต์ตามคำตอบแบบสอบถาม', exportPrice: 'ราคาส่งออกมายังประเทศไทยตามคำตอบแบบสอบถาม', compare: 'ปรับระดับการค้าและเงื่อนไขการขายให้เทียบกันได้', margin: 'ส่วนเหลื่อมการทุ่มตลาดของผู้ส่งออกอียิปต์จากการเปรียบเทียบอย่างเป็นธรรม' },
    ];
    this.normalValue = this.visitRows[0].normalValue;
    this.exportPrice = this.visitRows[0].exportPrice;
    this.dumpingMargin = this.visitRows[0].margin;
    this.injuryVolume = 'ปริมาณนำเข้าเหล็กแผ่นรีดร้อนจากเวียดนามและอียิปต์ในช่วงที่ขอไต่สวนสูงกว่าช่วงก่อนยื่นคำขอ';
    this.injuryPrice = 'ราคาขายในประเทศของอุตสาหกรรมภายในถูกกดจากสินค้านำเข้า';
    this.injuryPerformance = 'ผลประกอบการของผู้ยื่น บริษัท สหวิริยาสตีลอินดัสตรี จำกัด และผู้ผลิตที่สนับสนุน ลดลงในช่วงเดียวกัน';
    this.injuryCustoms = 'ตรวจข้อมูลกรมศุลกากรทั้งปริมาณ มูลค่า พิกัดสินค้า และอากรขาเข้าแล้ว การใช้สิทธิ FTA ไม่ได้เปลี่ยนฐานการเปรียบเทียบของเคสนี้';
    this.injuryLink = 'ปริมาณนำเข้าที่เพิ่มขึ้นเกิดในช่วงเดียวกับราคาที่ถูกกดและความเสียหายของอุตสาหกรรมภายใน';
    this.visitDataOk = 'yes';
  }

  protected get visitReady(): boolean {
    const rowsReady = this.visitRows.every((row) => row.normalValue.trim() && row.exportPrice.trim() && row.compare.trim() && row.margin.trim());
    const injuryReady = !!this.injuryVolume.trim() && !!this.injuryPrice.trim() && !!this.injuryPerformance.trim() && !!this.injuryCustoms.trim() && !!this.injuryLink.trim();
    return this.visitDomestic && rowsReady && injuryReady && this.visitDataOk === 'yes';
  }

  protected get inquiryExtraForms(): MadeDoc[] {
    return this.madeDocs.filter((item) => item.fields.some((field) => field.label === 'ขั้นตอน' && field.value === 'เปิดไต่สวน'));
  }

  protected get inquiryFiles(): { kind: string; name: string; title: string; sentOn: string }[] {
    return this.extrasOf('เปิดไต่สวน');
  }

  protected openNewInquiryForm(): void {
    this.committeeDraft = [
      field('ที่', 'กพ. / กองปกป้องและตอบโต้ทางการค้า'),
      field('วันที่', this.inquiryNoticeOn || this.committeeAt),
      field('เรื่อง', ''),
      field('เรียน', ''),
      field('เนื้อความ', '', true),
      field('ลงชื่อ', this.signedPerson || 'นางสาวจรีณา กิจส่งเสริมกุล'),
      field('ขั้นตอน', 'เปิดไต่สวน'),
    ];
    this.committeeFormKind = 'สร้างแบบฟอร์มเปิดไต่สวน';
  }

  protected openNewCommitteeForm(): void {
    this.committeeDraft = [
      field('ที่', 'กพ. / กองปกป้องและตอบโต้ทางการค้า'),
      field('วันที่', this.committeeAt),
      field('เรื่อง', ''),
      field('เรียน', ''),
      field('เนื้อความ', '', true),
      field('ลงชื่อ', this.signedPerson || 'นางสาวจรีณา กิจส่งเสริมกุล'),
      field('ขั้นตอน', 'พิจารณาของคณะกรรมการ'),
    ];
    this.committeeFormKind = 'สร้างแบบฟอร์ม';
  }

  protected get committeeExtraForms(): MadeDoc[] {
    return this.madeDocs.filter((item) => item.fields.some((field) => field.label === 'ขั้นตอน' && field.value === 'พิจารณาของคณะกรรมการ'));
  }

  protected get committeeFiles(): { kind: string; name: string; title: string; sentOn: string }[] {
    return this.extrasOf('พิจารณาของคณะกรรมการ');
  }

  protected saveCommitteeForm(): void {
    const creating = this.committeeFormKind === 'สร้างแบบฟอร์ม' || this.committeeFormKind === 'สร้างแบบฟอร์มเปิดไต่สวน' || this.committeeFormKind === 'สร้างแบบฟอร์มผลขั้นต้น' || this.committeeFormKind === 'สร้างแบบฟอร์มร่างผลสิ้นสุด' || this.committeeFormKind === 'สร้างแบบฟอร์มผลสิ้นสุด';
    const stage = this.committeeFormKind === 'สร้างแบบฟอร์มเปิดไต่สวน' ? 'เปิดไต่สวน' : this.committeeFormKind === 'สร้างแบบฟอร์มผลขั้นต้น' ? 'ผลขั้นต้น' : this.committeeFormKind === 'สร้างแบบฟอร์มร่างผลสิ้นสุด' ? 'ร่างผลสิ้นสุด' : this.committeeFormKind === 'สร้างแบบฟอร์มผลสิ้นสุด' ? 'ผลสิ้นสุด' : 'พิจารณาของคณะกรรมการ';
    const kind = creating ? this.committeeDraft.find((item) => item.label === 'เรื่อง')?.value.trim() || '' : this.committeeFormKind;
    if (!kind || this.committeeDraft.some((item) => item.label !== 'ขั้นตอน' && !item.value.trim())) return;
    const fields = this.committeeDraft.map((item) => ({ ...item }));
    if (creating && !fields.some((item) => item.label === 'ขั้นตอน')) fields.push(field('ขั้นตอน', stage));
    const at = fields.find((item) => item.label === 'วันที่' || item.label === 'วันที่ประชุม')?.value || this.committeeAt;
    const existing = creating ? undefined : this.madeOf(kind).at(-1);
    if (existing) this.madeDocs = this.madeDocs.map((item) => item.id === existing.id ? { ...item, fields, at } : item);
    else this.madeDocs = [...this.madeDocs, { id: `committee-${Date.now()}`, kind, at, fields }];
    writeMadeDocs(this.madeDocs);
    this.committeeFormKind = '';
  }

  protected addEmbassyFiles(event: Event): void {
    const input = event.target as HTMLInputElement;
    const sentOn = this.committeeAt.trim() || '05/06/2562';
    const files = [...(input.files ?? [])].map((file) => ({ name: file.name, title: file.name.replace(/\.[^.]+$/, ''), sentOn, docId: '' }));
    this.embassyFiles = [...this.embassyFiles, ...files];
    input.value = '';
  }

  protected removeEmbassyFile(index: number): void {
    const file = this.embassyFiles[index];
    if (!file || this.committeeSent) return;
    this.embassyFiles = this.embassyFiles.filter((_, item) => item !== index);
    if (!file.docId) return;
    this.madeDocs = this.madeDocs.filter((item) => item.id !== file.docId);
    writeMadeDocs(this.madeDocs);
  }

  protected openEmbassyFile(file: { name: string; title: string; sentOn: string; docId: string }): void {
    const made = this.madeDocs.find((item) => item.id === file.docId);
    this.viewingMade = made ?? { id: file.name, kind: file.title, at: file.sentOn, fields: [{ label: 'ไฟล์แนบ', value: file.name }, { label: 'ชื่อเอกสาร', value: file.title }] };
  }

  protected downloadEmbassyFile(file: { name: string; title: string; sentOn: string; docId: string }): void {
    const made = this.madeDocs.find((item) => item.id === file.docId);
    if (made) {
      this.downloadMade(made);
      return;
    }
    const html = `<!DOCTYPE html><html lang="th"><head><meta charset="utf-8"><title>${this.escapeHtml(file.title)}</title><style>body{margin:32px 48px;color:#0E2346;font-family:Thonburi,Sarabun,sans-serif;font-size:16px;line-height:28px}h1{margin:0 0 8px;font-size:20px;font-weight:500}p{margin:0 0 12px}</style></head><body><h1>${this.escapeHtml(file.title)}</h1><p>เลขที่อ้างอิง ${filingRefId}</p><p>ไฟล์แนบ ${this.escapeHtml(file.name)}</p><p>วันที่ส่ง ${this.escapeHtml(file.sentOn)}</p></body></html>`;
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name.replace(/\.[^.]+$/, '') + '.html';
    link.click();
    URL.revokeObjectURL(url);
  }

  protected setEmbassyField(index: number, value: string): void {
    this.embassyLetter = this.embassyLetter.map((field, item) => item === index ? { ...field, value } : field);
    if (this.embassyLetter[index]?.label === 'วันที่แจ้งเรื่อง') this.committeeEmbassyOn = value;
  }

  protected fillEmbassyLetter(): void {
    this.embassyLetter = embassyLetterFields(this.committeeEmbassyOn || '05/06/2562', this.signedPerson);
    this.notice = 'assist';
  }

  protected saveEmbassyDoc(): void {
    if (!this.embassyLetter.every((field) => field.value.trim())) return;
    const dated = this.embassyLetter.find((field) => field.label === 'วันที่แจ้งเรื่อง')?.value || this.committeeEmbassyOn;
    this.committeeEmbassyOn = dated;
    const fields = this.embassyLetter.map((field) => ({ ...field }));
    const id = `embassy-${Date.now()}`;
    const doc = { id, kind: 'หนังสือแจ้งรัฐบาลประเทศผู้ส่งออก', at: dated, fields };
    this.madeDocs = [...this.madeDocs, doc];
    writeMadeDocs(this.madeDocs);
    const base = `หนังสือแจ้งรัฐบาล-${dated.replaceAll('/', '')}.pdf`;
    const name = this.embassyFiles.some((file) => file.name === base) ? `หนังสือแจ้งรัฐบาล-${dated.replaceAll('/', '')}-${this.embassyFiles.length + 1}.pdf` : base;
    this.embassyFiles = [...this.embassyFiles, { name, title: 'หนังสือแจ้งรัฐบาลประเทศผู้ส่งออก', sentOn: dated, docId: id }];
    this.notice = 'saved';
  }

  private applyInquiry(record: InquiryRecord): void {
    this.inquiryAgendaAt = record.agendaAt || this.inquiryAgendaAt;
    this.inquiryAgenda = record.agenda;
    if (record.agendaFields.length === this.inquiryFields.length && record.agendaFields.every((item, index) => item.label === this.inquiryFields[index]?.label)) {
      this.inquiryFields = record.agendaFields.map((item) => ({ ...item }));
    }
    this.inquiryAgendaFiles = record.agendaFiles.map((file) => ({ ...file }));
    this.inquiryDecide = record.decide;
    this.inquiryFeeAmount = record.feeAmount || this.inquiryFeeAmount;
    this.inquiryFeeDue = record.feeDue || this.inquiryFeeDue;
    this.inquiryFeeSent = record.feeSent;
    this.inquiryPayFiles = record.payFiles.map((file) => ({ ...file }));
    this.inquiryPaySent = record.paySent;
    this.inquiryPayAck = record.payAck;
    this.inquiryOpen = record.open;
    this.inquiryOpenAt = record.openAt || this.inquiryOpenAt;
    this.inquiryCaseId = record.caseId;
    this.inquiryCloseNote = record.closeNote;
    this.inquiryAgendaDone = record.agendaDone;
    this.inquiryReturned = record.returned;
    this.inquirySentBy = record.sentBy;
    this.inquiryDecideDraft = record.decide;
    this.inquiryNoticeOn = record.noticeOn || this.inquiryNoticeOn;
    this.inquiryNoticeSent = record.noticeSent;
    this.inquiryHearing = record.hearing;
    this.inquiryHearingDraft = record.hearing;
    this.inquiryHearingOn = record.hearingOn || this.inquiryHearingOn;
    this.inquiryHearingPlace = record.hearingPlace;
    this.inquiryHearingDocId = record.hearingDocId;
    this.inquiryNoticeFiles = record.noticeFiles.map((file) => ({ ...file }));
    this.inquiryQuestions = record.questions.map((item) => ({ ...item }));
    this.placeInquiry();
  }

  private inquiryPayload(): InquiryRecord | null {
    const agenda = this.inquiryFields.map((item) => `${item.label}: ${item.value.trim()}`).join('\n');
    if (!agenda.trim() && !this.inquiryDecide && !this.inquiryFeeSent && !this.inquiryOpen && !this.inquiryPayFiles.length) return null;
    return {
      agendaAt: this.inquiryAgendaAt.trim(),
      agenda,
      decide: this.inquiryDecide,
      feeAmount: this.inquiryFeeAmount.trim(),
      feeDue: this.inquiryFeeDue.trim(),
      feeSent: this.inquiryFeeSent,
      payFiles: this.inquiryPayFiles.map((file) => ({ ...file })),
      paySent: this.inquiryPaySent,
      payAck: this.inquiryPayAck,
      open: this.inquiryOpen,
      openAt: this.inquiryOpenAt.trim(),
      caseId: this.inquiryCaseId,
      closeNote: this.inquiryCloseNote.trim(),
      agendaDone: this.inquiryAgendaDone,
      agendaFields: this.inquiryFields.map((item) => ({ ...item })),
      agendaFiles: this.inquiryAgendaFiles.map((file) => ({ ...file })),
      returned: this.inquiryReturned,
      sentBy: this.inquirySentBy || this.signedPerson || this.directorName,
      noticeOn: this.inquiryNoticeOn.trim(),
      noticeSent: this.inquiryNoticeSent,
      hearing: this.inquiryHearing,
      hearingOn: this.inquiryHearingOn.trim(),
      hearingPlace: this.inquiryHearingPlace.trim(),
      hearingDocId: this.inquiryHearingDocId,
      noticeFiles: this.inquiryNoticeFiles.map((file) => ({ ...file })),
      questions: this.inquiryQuestions.map((item) => ({ ...item })),
    };
  }

  private writeInquiry(): void {
    this.inquirySentBy = this.signedPerson || this.directorName;
    writeDocNotice(this.docPayload(this.docSent));
    this.notice = 'saved';
  }

  protected get inquiryReached(): boolean {
    if (this.committeeSent && this.committeeResult === 'reject') return false;
    if (this.committeeSent && this.committeeResult === 'take') return true;
    return this.caseStatus === 'official';
  }

  protected fillInquiryAgenda(): void {
    this.inquiryFields = agendaFieldList();
    this.notice = 'assist';
  }

  protected setInquiryField(index: number, value: string): void {
    this.inquiryFields = this.inquiryFields.map((item, itemIndex) => itemIndex === index ? { ...item, value } : item);
  }

  private placeInquiry(): void {
    if (this.inquiryDecide === 'return' && !this.inquiryReturned) this.inquiryPart = 'letter';
    else if (!this.inquiryAgendaDone) this.inquiryPart = 'agenda';
    else if (!this.inquiryOpen) this.inquiryPart = 'vote';
    else if (this.inquiryOpen === 'close') this.inquiryPart = 'vote';
    else if (!this.inquiryNoticeSent) this.inquiryPart = 'notice';
    else if (!this.inquiryHearing) this.inquiryPart = 'hearing';
    else if (!this.inquiryQuestionsDone) this.inquiryPart = 'questions';
    else this.inquiryPart = 'visit';
  }

  protected get inquiryNav(): { id: InquiryStep; label: string; done: boolean; group: string }[] {
    const steps: { id: InquiryStep; label: string; done: boolean; group: string }[] = [
      { id: 'agenda', label: 'วาระ ทตอ.', done: this.inquiryAgendaDone, group: 'เปิดไต่สวน' },
      { id: 'vote', label: 'มติเปิดไต่สวน', done: this.inquiryOpen !== '', group: 'เปิดไต่สวน' },
    ];
    if (this.inquiryDecide === 'return') steps.push({ id: 'letter', label: 'หนังสือคืนคำขอ', done: this.inquiryReturned, group: 'เปิดไต่สวน' });
    if (this.inquiryOpen !== 'close') {
      steps.push(
        { id: 'notice', label: 'ประกาศเปิดไต่สวน', done: this.inquiryPackDone('notice'), group: 'เปิดไต่สวน' },
        { id: 'sign', label: 'ลงนามและราชกิจจานุเบกษา', done: this.inquiryPackDone('sign'), group: 'เปิดไต่สวน' },
        { id: 'letters', label: 'หนังสือแจ้งผู้เกี่ยวข้อง', done: this.inquiryPackDone('letters'), group: 'เปิดไต่สวน' },
        { id: 'news', label: 'ข่าวหนังสือพิมพ์', done: this.inquiryPackDone('news'), group: 'เปิดไต่สวน' },
      );
    }
    if (this.inquiryOpen === 'open') {
      steps.push(
        { id: 'hearing', label: 'แถลงการณ์', done: this.inquiryHearing !== '', group: 'ข้อมูลไต่สวน' },
        { id: 'questions', label: 'แบบสอบถาม', done: this.inquiryQuestionsDone, group: 'ข้อมูลไต่สวน' },
        { id: 'visit', label: 'ตรวจสถานประกอบการ', done: this.laterPhase.visit, group: 'ข้อมูลไต่สวน' },
      );
    }
    return steps;
  }

  protected openInquiryStep(id: InquiryStep): void {
    if (!this.inquiryNav.some((step) => step.id === id)) return;
    this.inquiryPart = id;
  }

  protected agendaFieldsOf(): { item: { label: string; value: string; long?: boolean }; index: number }[] {
    const labels = new Set(this.agendaSections[this.agendaPart]?.labels ?? []);
    return this.inquiryFields.map((item, index) => ({ item, index })).filter((row) => labels.has(row.item.label));
  }

  protected agendaSectionDone(index: number): boolean {
    const labels = this.agendaSections[index]?.labels ?? [];
    if (index === 0 && !this.inquiryAgendaAt.trim()) return false;
    return labels.every((label) => label === 'มติที่ประชุม' || this.inquiryFields.find((item) => item.label === label)?.value.trim());
  }

  protected get agendaReady(): boolean {
    return thaiDateOk(this.inquiryAgendaAt, 'any') && this.inquiryFields.every((item) => item.label === 'มติที่ประชุม' || item.value.trim());
  }

  protected saveInquiryAgenda(): void {
    if (!this.inquiryReached || !this.agendaReady) return;
    const id = `agenda-${Date.now()}`;
    const fields = [
      { label: 'หน่วยงาน', value: 'กระทรวงพาณิชย์ กรมการค้าต่างประเทศ' },
      { label: 'ชื่อวาระ', value: 'วาระการประชุมคณะกรรมการพิจารณาการทุ่มตลาดและการอุดหนุน' },
      { label: 'วันที่ประชุม', value: this.inquiryAgendaAt.trim() },
      ...this.inquiryFields.map((item) => item.label === 'มติที่ประชุม' && !item.value.trim() ? { ...item, value: 'รอที่ประชุมบันทึกมติ' } : { ...item }),
    ];
    this.madeDocs = [...this.madeDocs, { id, kind: 'วาระพิจารณาคำขอ', at: this.inquiryAgendaAt, fields }];
    writeMadeDocs(this.madeDocs);
    const base = `วาระพิจารณาคำขอ-${this.inquiryAgendaAt.replaceAll('/', '')}.pdf`;
    const name = this.inquiryAgendaFiles.some((file) => file.name === base) ? `วาระพิจารณาคำขอ-${this.inquiryAgendaAt.replaceAll('/', '')}-${this.inquiryAgendaFiles.length + 1}.pdf` : base;
    this.inquiryAgendaFiles = [...this.inquiryAgendaFiles, { name, title: 'วาระพิจารณาคำขอ', sentOn: this.inquiryAgendaAt, docId: id }];
    this.inquiryAgendaDone = true;
    this.writeInquiry();
  }

  protected addAgendaFiles(event: Event): void {
    if (this.inquiryDecide) return;
    const input = event.target as HTMLInputElement;
    const sentOn = this.inquiryAgendaAt.trim() || '10/06/2562';
    const files = [...(input.files ?? [])].map((file) => ({ name: file.name, title: file.name.replace(/\.[^.]+$/, ''), sentOn, docId: '' }));
    this.inquiryAgendaFiles = [...this.inquiryAgendaFiles, ...files];
    this.inquiryAgendaDone = this.inquiryAgendaFiles.length > 0;
    input.value = '';
    this.writeInquiry();
  }

  protected removeAgendaFile(index: number): void {
    const file = this.inquiryAgendaFiles[index];
    if (!file || this.inquiryDecide) return;
    this.inquiryAgendaFiles = this.inquiryAgendaFiles.filter((_, item) => item !== index);
    if (file.docId) {
      this.madeDocs = this.madeDocs.filter((item) => item.id !== file.docId);
      writeMadeDocs(this.madeDocs);
    }
    this.inquiryAgendaDone = this.inquiryAgendaFiles.length > 0;
    this.writeInquiry();
  }

  protected continueInquiryDecide(): void {
    if (!this.inquiryAgendaDone || this.inquiryFeeSent || this.inquiryReturned) return;
    if (this.inquiryDecideDraft !== 'take' && this.inquiryDecideDraft !== 'return') return;
    if (this.inquiryDecide) return;
    this.inquiryDecide = this.inquiryDecideDraft;
    this.writeInquiry();
    this.inquiryPart = this.inquiryDecide === 'take' ? 'fee' : 'letter';
  }

  protected saveInquiryReturn(): void {
    if (!this.inquiryReached || this.inquiryFeeSent || this.inquiryDecide !== 'return' || !this.inquiryCloseNote.trim()) return;
    if (this.madeDocs.some((item) => item.kind === 'หนังสือคืนคำขอ')) return;
    const doc = {
      id: `return-${Date.now()}`,
      kind: 'หนังสือคืนคำขอ',
      at: this.inquiryAgendaAt,
      fields: [
        { label: 'เรื่อง', value: 'คืนคำขอให้พิจารณาตอบโต้การทุ่มตลาด' },
        { label: 'เนื้อความ', value: this.inquiryCloseNote.trim() },
      ],
    };
    this.madeDocs = [...this.madeDocs, doc];
    writeMadeDocs(this.madeDocs);
    this.inquiryReturned = true;
    this.writeInquiry();
    this.inquiryPart = 'letter';
  }

  protected notifyInquiryFee(): void {
    if (!this.inquiryReached || this.inquiryDecide !== 'take' || this.inquiryFeeSent || !this.inquiryFeeAmount.trim() || !thaiDateOk(this.inquiryFeeDue, 'any')) return;
    this.issueDoc('หนังสือแจ้งชำระค่าธรรมเนียมคำขอ', this.inquiryFeeDue, [
      { label: 'เรียน', value: 'ผู้ยื่นคำขอ' },
      { label: 'ยอดค่าธรรมเนียม (บาท)', value: this.inquiryFeeAmount.trim() },
      { label: 'วันที่ครบกำหนดชำระ', value: this.inquiryFeeDue },
      { label: 'หมายเหตุ', value: 'ค่าธรรมเนียมคำขอ ไม่ใช่อากรตอบโต้การทุ่มตลาด', long: true },
    ]);
    this.inquiryFeeSent = true;
    this.writeInquiry();
    this.inquiryPart = 'proof';
  }

  protected addInquiryPayFiles(event: Event): void {
    if (this.inquiryPayAck) return;
    const input = event.target as HTMLInputElement;
    const sentOn = '12/06/2562';
    const files = [...(input.files ?? [])].map((file) => ({ name: file.name, title: file.name.replace(/\.[^.]+$/, ''), sentOn }));
    this.inquiryPayFiles = [...this.inquiryPayFiles, ...files];
    input.value = '';
    this.writeInquiry();
  }

  protected removeInquiryPayFile(index: number): void {
    if (this.inquiryPayAck) return;
    this.inquiryPayFiles = this.inquiryPayFiles.filter((_, item) => item !== index);
    if (!this.inquiryPayFiles.length) this.inquiryPaySent = false;
    this.writeInquiry();
  }

  protected sendInquiryPay(): void {
    if (!this.inquiryFeeSent || this.inquiryPayAck || !this.inquiryPayFiles.length) return;
    this.inquiryPaySent = true;
    this.writeInquiry();
  }

  protected ackInquiryPay(): void {
    if ((!this.inquiryPaySent && !this.inquiryFeeSent) || this.inquiryPayAck || !this.inquiryPayFiles.length) return;
    this.inquiryPaySent = true;
    this.issueDoc('บันทึกรับทราบหลักฐานการชำระค่าธรรมเนียม', this.inquiryFeeDue, [
      { label: 'ยอดค่าธรรมเนียม (บาท)', value: this.inquiryFeeAmount.trim() },
      { label: 'หลักฐานที่รับทราบ', value: this.inquiryPayFiles.map((file) => file.title).join('\n'), long: true },
    ]);
    this.inquiryPayAck = true;
    this.writeInquiry();
    this.inquiryPart = 'vote';
  }

  protected saveInquiryOpen(): void {
    if (this.inquiryOpen) return;
    if (!thaiDateOk(this.inquiryOpenAt, 'any')) return;
    const choice = this.inquiryOpenDraft;
    if (choice === 'close' && !this.inquiryCloseNote.trim()) return;
    if (choice !== 'open' && choice !== 'close') return;
    if (!this.inquiryDecide) this.inquiryDecide = 'take';
    this.inquiryOpen = choice;
    if (choice === 'open') {
      const [day, month, year] = this.inquiryOpenAt.split('/');
      this.inquiryCaseId = day && month && year ? `AD${year}${month}${day}0001` : 'AD256206100001';
    }
    this.writeInquiry();
    this.inquiryPart = choice === 'open' ? 'notice' : 'vote';
  }

  protected inviteCopied = false;
  protected inviteSent = false;

  protected get inquiryReferral(): string {
    return this.inquiryCaseId ? invitePath(this.inquiryCaseId) : '';
  }

  protected get inquiryInviteUrl(): string {
    return this.inquiryReferral ? `${location.origin}${this.inquiryReferral}` : '';
  }

  protected copyInvite(): void {
    const url = this.inquiryInviteUrl;
    if (!url) return;
    const done = () => {
      this.inviteCopied = true;
      window.setTimeout(() => {
        this.inviteCopied = false;
        this.view.markForCheck();
      }, 2000);
      this.view.markForCheck();
    };
    if (navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(url).then(done).catch(() => done());
      return;
    }
    done();
  }

  protected sendInvite(): void {
    if (!this.inquiryInviteUrl) return;
    this.inviteSent = true;
    this.keepNote('invite-sent', this.inquiryInviteUrl);
    const at = this.inquiryNoticeOn || '10/06/2562';
    this.pushLink('อีเมล', 'ส่งลิงก์เชิญผู้มีส่วนได้เสีย', this.inquiryInviteUrl, this.inquiryCaseId, at);
    this.pushLink('ไปรษณีย์', 'ส่งหนังสือเชิญผู้มีส่วนได้เสีย', this.inquiryInviteUrl, this.inquiryCaseId, at);
    this.copyInvite();
  }

  protected get inquiryQuestionsDone(): boolean {
    const open = this.inquiryQuestions.filter((item) => item.sent || item.papers.length);
    return open.length > 0 && open.every((item) => item.passed);
  }

  protected inquiryQuestionLabel(id: InquiryQuestion['id'] | ''): string {
    if (id === 'importer') return 'ผู้นำเข้า/ผู้ใช้';
    if (id === 'domestic') return 'อุตสาหกรรมภายใน';
    if (id === 'exporter') return 'ผู้ส่งออก';
    return '';
  }

  protected inquiryQuestionState(item: InquiryQuestion): string {
    if (item.passed) return 'ผ่านแล้ว';
    if (item.papers.some((paper) => paper.kind === 'answer' || paper.kind === 'revised')) return 'รอตรวจคำตอบ';
    if (item.papers.some((paper) => paper.kind === 'form')) return 'กำลังวนเอกสาร';
    return 'รอสร้างแบบ';
  }

  protected inquiryQuestionTone(item: InquiryQuestion): 'success' | 'warning' | 'info' {
    if (item.passed) return 'success';
    if (item.papers.length) return 'info';
    return 'warning';
  }

  protected inquiryLoopLabel(kind: InquiryLoopKind): string {
    if (kind === 'form') return 'แบบสอบถาม';
    if (kind === 'docs') return 'รับ-ส่งเอกสาร';
    if (kind === 'extend-ask') return 'หนังสือขอขยายเวลา';
    if (kind === 'extend-reply') return 'หนังสือตอบการขอขยาย';
    if (kind === 'answer') return 'คำตอบฉบับแรกและมอบอำนาจ';
    if (kind === 'revise') return 'หนังสือขอให้ปรับปรุง';
    return 'คำตอบที่ปรับปรุง';
  }

  private issueDoc(kind: string, at: string, fields: { label: string; value: string; long?: boolean }[], index = 0): InquiryIssued {
    const id = `issued-${Date.now()}-${index}`;
    this.madeDocs = [...this.madeDocs, { id, kind, at, fields }];
    writeMadeDocs(this.madeDocs);
    return { party: kind, name: `${kind}.pdf`, title: kind, sentOn: at, docId: id };
  }

  protected issuedDoc(id: string): { name: string; title: string; sentOn: string; docId: string } | null {
    const made = this.madeDocs.find((item) => item.id === id);
    if (!made) return null;
    return { name: `${made.kind}.pdf`, title: made.kind, sentOn: made.at, docId: made.id };
  }

  protected issuedByKind(kind: string): { name: string; title: string; sentOn: string; docId: string } | null {
    const made = [...this.madeDocs].reverse().find((item) => item.kind === kind);
    return made ? { name: `${made.kind}.pdf`, title: made.kind, sentOn: made.at, docId: made.id } : null;
  }

  protected noticeFile(party: string): InquiryIssued | null {
    return this.inquiryNoticeFiles.find((file) => file.party === party) ?? null;
  }

  private noticeKind(row: { name: string; channel: string }): string {
    if (row.channel === 'ประกาศ') return `ข่าวประกาศเปิดไต่สวน ${row.name}`;
    if (row.channel === 'เผยแพร่') return 'ประกาศกรมเปิดไต่สวน';
    return `หนังสือแจ้งเปิดไต่สวนถึง${row.name}`;
  }

  protected saveInquiryNotice(): void {
    if (this.inquiryOpen !== 'open' || this.inquiryNoticeSent || !thaiDateOk(this.inquiryNoticeOn, 'any')) return;
    const subject = this.inquiryFields.find((item) => item.label === 'เรื่อง')?.value.trim() || 'เปิดการไต่สวน';
    this.inquiryNoticeFiles = this.inquiryNotices.map((row, index) => {
      const kind = this.noticeKind(row);
      const file = this.issueDoc(kind, this.inquiryNoticeOn, [
        { label: 'เรื่อง', value: subject },
        { label: 'เรียน', value: row.name },
        { label: 'ช่องทาง', value: row.channel },
        { label: 'วันที่', value: this.inquiryNoticeOn },
        { label: 'Case ID', value: this.inquiryCaseId },
        { label: 'ลิงก์ผู้มีส่วนได้เสีย', value: this.inquiryReferral, long: true },
      ], index);
      return { ...file, party: row.name };
    });
    this.inquiryNoticeSent = true;
    this.writeInquiry();
    this.inquiryPart = 'news';
  }

  protected saveInquiryHearing(): void {
    if (this.inquiryOpen !== 'open' || !this.inquiryNoticeSent || this.inquiryHearing) return;
    const choice = this.inquiryHearingDraft;
    if (choice !== 'hold' && choice !== 'skip') return;
    if (choice === 'hold' && (!thaiDateOk(this.inquiryHearingOn, 'any') || !this.inquiryHearingPlace.trim())) return;
    const held = choice === 'hold';
    const file = this.issueDoc(held ? 'หนังสือแจ้งแถลงการณ์เปิดไต่สวน' : 'บันทึกไม่จัดแถลงการณ์', held ? this.inquiryHearingOn : this.inquiryNoticeOn, [
      { label: 'Case ID', value: this.inquiryCaseId },
      { label: 'ผลการพิจารณา', value: held ? 'จัดแถลงการณ์' : 'ไม่จัดแถลงการณ์' },
      { label: 'วันที่', value: held ? this.inquiryHearingOn : this.inquiryNoticeOn },
      { label: 'สถานที่หรือช่องทาง', value: held ? this.inquiryHearingPlace.trim() : 'ไม่มีการจัด' },
      { label: 'ลิงก์ผู้มีส่วนได้เสีย', value: this.inquiryReferral, long: true },
    ]);
    this.inquiryHearingDocId = file.docId;
    this.inquiryHearing = choice;
    this.writeInquiry();
    this.inquiryPart = 'questions';
  }

  protected readonly inquiryLoops: InquiryLoopKind[] = ['form', 'extend-ask', 'extend-reply', 'answer', 'revise', 'revised'];

  protected questionnaireParts(id: InquiryQuestion['id']): string[] {
    if (id === 'importer') {
      return [
        'ส่วนที่ 1 ข้อมูลทั่วไปของผู้นำเข้า/ผู้ซื้อ',
        'ส่วนที่ 2 รายละเอียดของสินค้าที่ถูกพิจารณาและสินค้าชนิดเดียวกัน',
        'ส่วนที่ 3 ข้อมูลการนำเข้า/ซื้อของผู้นำเข้า/ผู้ซื้อ',
        'ส่วนที่ 4 ข้อมูลทั่วไปเกี่ยวกับการซื้อขายสินค้าที่ถูกพิจารณา/สินค้าชนิดเดียวกัน',
        'ส่วนที่ 5 ประโยชน์สาธารณะ',
        'ส่วนที่ 6 การประมาณการ',
        'จัดทำทั้งฉบับปกปิดและฉบับเปิดเผย',
      ];
    }
    if (id === 'domestic') {
      return [
        'ส่วนที่ 1 ข้อมูลทั่วไปของผู้ผลิต',
        'ส่วนที่ 2 รายละเอียดของสินค้าชนิดเดียวกัน',
        'ส่วนที่ 3 ข้อมูลความเสียหายของอุตสาหกรรมภายใน',
        'ส่วนที่ 4 ข้อมูลการขายสินค้าชนิดเดียวกันภายในประเทศ',
        'ส่วนที่ 5 ต้นทุนการผลิต',
        'ส่วนที่ 6 ราคาขายที่ควรจะเป็นและการประมาณการ',
        'ส่วนที่ 7 ประโยชน์สาธารณะ',
        'จัดทำทั้งฉบับปกปิดและฉบับเปิดเผย',
      ];
    }
    return [
      'Section A ข้อมูลทั่วไปของบริษัท',
      'Section B รายละเอียดสินค้าที่ถูกพิจารณา',
      'Section C ยอดขายรวมของบริษัท',
      'Section D การขายสินค้าที่ถูกพิจารณา',
      'Section E การบริโภค การผลิต การซื้อ และสต็อก',
      'Section F การขายในประเทศ',
      'Section G การส่งออก',
      'Section H ต้นทุนการผลิต',
      'Section I การทบทวนเมื่อมาตรการสิ้นสุด',
      'จัดทำทั้งฉบับปกปิดและฉบับเปิดเผย',
    ];
  }

  protected questionCanPass(item: InquiryQuestion): boolean {
    return item.papers.some((paper) => paper.kind === 'answer' || paper.kind === 'revised');
  }

  protected pickInquiryParty(id: InquiryQuestion['id']): void {
    this.inquiryPaperId = id;
  }

  protected get activeQuestion(): InquiryQuestion | null {
    return this.inquiryQuestions.find((item) => item.id === this.inquiryPaperId) ?? this.inquiryQuestions[0] ?? null;
  }

  protected papersOf(item: InquiryQuestion, kind: InquiryLoopKind): InquiryQuestion['papers'] {
    return item.papers.filter((paper) => paper.kind === kind);
  }

  protected exchangeKind: 'form' | 'docs' = 'form';
  protected exchangeReply: 'yes' | 'no' = 'yes';
  protected readonly exchangeHeads = ['ประกาศเปิดไต่สวน', 'หนังสือแจ้งผู้มีส่วนได้เสีย', 'เอกสารเปิดเผย'];
  protected pickedHeads: string[] = [];

  protected toggleHead(name: string): void {
    this.pickedHeads = this.pickedHeads.includes(name) ? this.pickedHeads.filter((item) => item !== name) : [...this.pickedHeads, name];
  }

  protected exchangeStage(row: InquiryQuestion): 'prepare' | 'extend' | 'grant' | 'check' | 'done' {
    if (row.passed) return 'done';
    const papers = row.papers;
    const last = (kind: InquiryLoopKind) => papers.map((paper) => paper.kind).lastIndexOf(kind);
    const answerAt = Math.max(last('answer'), last('revised'));
    const reviseAt = last('revise');
    if (answerAt >= 0 && answerAt > reviseAt) return 'check';
    const askAt = last('extend-ask');
    const replyAt = last('extend-reply');
    if (askAt >= 0 && askAt > replyAt) return 'grant';
    if (papers.some((paper) => paper.kind === 'form' || paper.kind === 'docs')) return 'extend';
    return 'prepare';
  }

  protected sendExchange(): void {
    const row = this.activeQuestion;
    if (!row || row.passed || !thaiDateOk(this.inquiryPaperOn, 'any') || !this.inquiryPaperNote.trim()) return;
    if (this.exchangeKind === 'docs' && !this.pickedHeads.length) return;
    const note = this.inquiryPaperNote.trim();
    this.inquiryLoop = this.exchangeKind === 'docs' ? 'docs' : 'form';
    if (this.exchangeKind === 'docs') this.inquiryPaperNote = `${this.pickedHeads.join(' · ')}\n${note}`;
    this.saveInquiryLoop();
    if (this.exchangeReply === 'no') this.closeExchange(row.id);
  }

  protected recordExtensionAsk(): void {
    const row = this.activeQuestion;
    if (!row || this.exchangeStage(row) !== 'extend' || !thaiDateOk(this.inquiryPaperOn, 'any') || !this.inquiryPaperNote.trim()) return;
    this.inquiryLoop = 'extend-ask';
    this.saveInquiryLoop();
  }

  protected grantExtension(): void {
    const row = this.activeQuestion;
    if (!row || this.exchangeStage(row) !== 'grant' || !thaiDateOk(this.inquiryPaperOn, 'any') || !thaiDateOk(this.inquiryPaperDue, 'any') || !this.inquiryPaperNote.trim()) return;
    const note = this.inquiryPaperNote.trim();
    this.inquiryLoop = 'extend-reply';
    this.saveInquiryLoop();
    this.inquiryPaperNote = note;
    this.inquiryLoop = 'form';
    this.saveInquiryLoop();
  }

  protected recordAnswer(): void {
    const row = this.activeQuestion;
    if (!row || this.exchangeStage(row) !== 'extend' || !thaiDateOk(this.inquiryPaperOn, 'any') || !this.inquiryPaperNote.trim()) return;
    this.inquiryLoop = row.papers.some((paper) => paper.kind === 'revise') ? 'revised' : 'answer';
    this.saveInquiryLoop();
  }

  protected sendCorrection(): void {
    const row = this.activeQuestion;
    if (!row || this.exchangeStage(row) !== 'check' || !thaiDateOk(this.inquiryPaperOn, 'any') || !this.inquiryPaperNote.trim()) return;
    this.inquiryLoop = 'revise';
    this.saveInquiryLoop();
  }

  private closeExchange(id: InquiryQuestion['id']): void {
    this.inquiryQuestions = this.inquiryQuestions.map((item) => item.id === id ? { ...item, passed: true, received: true, revise: false } : item);
    this.writeInquiry();
  }

  protected inquiryLoopHint(kind: InquiryLoopKind): string {
    if (kind === 'form') return 'สร้างจากโครงสร้างแบบของกลุ่มนี้ ส่งซ้ำได้เมื่อต้องส่งอีกครั้ง';
    if (kind === 'docs') return 'เลือกหัวข้อเอกสารแล้วส่งให้ผู้มีส่วนได้เสีย';
    if (kind === 'extend-ask') return 'บันทึกหนังสือขอขยายเวลาที่ได้รับ แต่ละครั้งเป็นคนละฉบับ';
    if (kind === 'extend-reply') return 'สร้างหนังสือตอบการขอขยาย และระบุวันครบกำหนดใหม่';
    if (kind === 'answer') return 'บันทึกคำตอบฉบับแรกพร้อมหนังสือมอบอำนาจ';
    if (kind === 'revise') return 'สร้างหนังสือขอให้ปรับปรุงได้ทุกครั้งที่คำตอบยังไม่ครบ';
    return 'บันทึกคำตอบที่ปรับปรุงกลับเข้าเคส';
  }

  protected saveInquiryLoop(): void {
    const id = this.inquiryPaperId;
    if (id !== 'importer' && id !== 'domestic' && id !== 'exporter') return;
    const row = this.inquiryQuestions.find((item) => item.id === id);
    if (!row || row.passed || !thaiDateOk(this.inquiryPaperOn, 'any') || !this.inquiryPaperNote.trim()) return;
    if (this.inquiryLoop === 'extend-reply' && !thaiDateOk(this.inquiryPaperDue, 'any')) return;
    const label = this.inquiryQuestionLabel(id);
    const round = row.papers.filter((paper) => paper.kind === this.inquiryLoop).length + 1;
    const title = `${this.inquiryLoopLabel(this.inquiryLoop)}${label} ครั้งที่ ${round}`;
    const signer = this.signedPerson || this.directorName;
    const fields = this.inquiryLoop === 'form'
      ? [
          { label: 'ชื่อแบบ', value: `แบบสอบถามสำหรับ${label}` },
          { label: 'Case ID', value: this.inquiryCaseId },
          { label: 'ครั้งที่', value: String(round) },
          { label: 'โครงสร้างแบบ', value: this.questionnaireParts(id).join('\n'), long: true },
          { label: 'คำนำส่ง', value: this.inquiryPaperNote.trim(), long: true },
          { label: 'ลงชื่อ', value: signer },
        ]
      : [
          { label: 'ที่', value: 'กพ. / กองปกป้องและตอบโต้ทางการค้า' },
          { label: 'วันที่', value: this.inquiryPaperOn },
          { label: 'เรื่อง', value: `${this.inquiryLoopLabel(this.inquiryLoop)} ครั้งที่ ${round}` },
          { label: 'เรียน', value: label },
          { label: 'Case ID', value: this.inquiryCaseId },
          ...(this.inquiryLoop === 'extend-reply' ? [{ label: 'วันครบกำหนดใหม่', value: this.inquiryPaperDue }] : []),
          ...(this.inquiryLoop === 'answer' ? [{ label: 'หนังสือมอบอำนาจ', value: 'บันทึกพร้อมคำตอบฉบับแรก' }] : []),
          { label: 'เนื้อความ', value: this.inquiryPaperNote.trim(), long: true },
          { label: 'ลงชื่อ', value: signer },
        ];
    const file = this.issueDoc(title, this.inquiryPaperOn, fields, round);
    const paper = { kind: this.inquiryLoop, at: this.inquiryPaperOn, docId: file.docId, round };
    this.inquiryQuestions = this.inquiryQuestions.map((item) => item.id === id ? {
      ...item,
      papers: [...item.papers, paper],
      sent: item.sent || paper.kind === 'form',
      formDocId: paper.kind === 'form' ? file.docId : item.formDocId,
      answerDocId: paper.kind === 'answer' || paper.kind === 'revised' ? file.docId : item.answerDocId,
      reviseDocId: paper.kind === 'revise' ? file.docId : item.reviseDocId,
      revise: paper.kind === 'revise',
    } : item);
    this.inquiryPaperNote = '';
    this.writeInquiry();
  }

  protected passInquiryQuestion(id: InquiryQuestion['id']): void {
    const row = this.inquiryQuestions.find((item) => item.id === id);
    if (!row || row.passed || !this.questionCanPass(row)) return;
    this.inquiryQuestions = this.inquiryQuestions.map((item) => item.id === id ? { ...item, passed: true, received: true, revise: false } : item);
    const next = this.inquiryQuestions.find((item) => item.id !== id && !item.passed);
    if (next) this.inquiryPaperId = next.id;
    this.writeInquiry();
  }

  protected notesOpen = false;
  protected noteText = '';
  protected noteFiles: CaseNoteFile[] = [];
  protected caseNotes: CaseNote[] = [];
  protected noteReads: string[] = [];
  protected noteFresh: string[] = [];
  protected noteDeleteId = '';

  protected get visibleNotes(): CaseNote[] {
    const mine = this.accounts.username;
    return this.caseNotes.filter((note) => note.scope === 'case' || note.authorId === mine);
  }

  protected get unreadNoteCount(): number {
    const seen = new Set(this.noteReads);
    const mine = this.accounts.username;
    return this.visibleNotes.filter((note) => note.authorId !== mine && !seen.has(note.id)).length;
  }

  protected addNoteFiles(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = [...(input.files ?? [])].map((file) => ({ name: file.name, title: file.name.replace(/\.[^.]+$/, '') }));
    this.noteFiles = [...this.noteFiles, ...files];
    input.value = '';
  }

  protected removeNoteFile(index: number): void {
    this.noteFiles = this.noteFiles.filter((_, item) => item !== index);
  }

  protected saveCaseNote(): void {
    if (!this.reviewRole || !this.noteText.trim()) return;
    const now = new Date();
    const at = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear() + 543} · ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} น.`;
    const note: CaseNote = {
      id: `note-${Date.now()}`,
      at,
      authorId: this.accounts.username,
      author: this.accounts.displayName,
      scope: 'case',
      text: this.noteText.trim(),
      files: this.noteFiles.map((file) => ({ ...file })),
    };
    this.caseNotes = [note, ...this.caseNotes];
    writeCaseNotes(this.caseNotes);
    this.noteText = '';
    this.noteFiles = [];
  }

  protected openNotes(): void {
    const mine = this.accounts.username;
    const seen = new Set(this.noteReads);
    this.noteFresh = this.visibleNotes.filter((note) => note.authorId !== mine && !seen.has(note.id)).map((note) => note.id);
    for (const id of this.noteFresh) seen.add(id);
    this.noteReads = [...seen];
    writeNoteReads(mine, this.noteReads);
    this.noteDeleteId = '';
    this.notesOpen = true;
  }

  protected closeNotes(): void {
    this.notesOpen = false;
    this.noteText = '';
    this.noteFiles = [];
    this.noteDeleteId = '';
    this.noteFresh = [];
  }

  protected askDeleteNote(id: string): void {
    const note = this.caseNotes.find((item) => item.id === id);
    if (!note || !this.noteMine(note)) return;
    this.noteDeleteId = id;
  }

  protected noteMine(note: CaseNote): boolean {
    return note.authorId === this.accounts.username;
  }

  protected noteFileKind(name: string): string {
    const ext = name.split('.').pop()?.toLowerCase() ?? '';
    if (ext === 'png' || ext === 'jpg' || ext === 'jpeg' || ext === 'gif' || ext === 'webp') return 'ไฟล์รูปภาพ';
    if (ext === 'pdf') return 'ไฟล์ PDF';
    return 'ไฟล์เอกสาร';
  }

  protected removeCaseNote(id: string): void {
    const note = this.caseNotes.find((item) => item.id === id);
    if (!note || note.authorId !== this.accounts.username) return;
    this.caseNotes = this.caseNotes.filter((item) => item.id !== id);
    this.noteDeleteId = '';
    writeCaseNotes(this.caseNotes);
  }

  protected inquiryOpenDraft: 'open' | 'close' | '' = '';

  protected saveCommittee(): void {
    if (!this.canRecordCommittee || !this.committeeReady) return;
    this.committeeSent = true;
    this.committeeSentBy = this.signedPerson || this.directorName;
    writeDocNotice(this.docPayload(true));
    if (this.committeeResult === 'take') this.pickReviewTab('inquiry');
    this.notice = 'saved';
  }

  private applyReply(reply: ApplicantReply): void {
    this.replyKind = reply.kind;
    this.replyAt = reply.at;
    this.amendReason = reply.reason;
    this.replyNewDue = reply.newDue;
    this.replyLetterDate = reply.letterDate;
    this.replyLetterNo = reply.letterNo;
    this.replyLetterTo = reply.letterTo;
    this.replyLetterSubject = reply.letterSubject;
    this.replyLetterBody = reply.letterBody;
    if (reply.files.length) this.replyFiles = reply.files;
    this.replySent = true;
  }

  private currentReply(): ApplicantReply {
    return {
      kind: this.replyKind,
      at: this.replyAt || (this.noticePasses.length ? '05/06/2562' : '22/05/2562'),
      reason: this.amendReason.trim(),
      newDue: this.replyNewDue.trim(),
      letterDate: this.replyLetterDate.trim(),
      letterNo: this.replyLetterNo.trim(),
      letterTo: this.replyLetterTo.trim(),
      letterSubject: this.replyLetterSubject.trim(),
      letterBody: this.replyLetterBody.trim(),
      files: this.replyFiles
        .filter((file) => this.replyKind === 'extend' ? file.group === 'extend' : file.group !== 'extend')
        .map((file) => ({ ...file })),
    };
  }

  private docPayload(sent: boolean) {
    return {
      action: this.docAction,
      noticedOn: this.docNoticedOn.trim(),
      dueOn: this.docDueOn.trim(),
      note: this.docNote.trim(),
      files: this.docFiles,
      letter: this.noticeLetter.map((item) => ({ ...item })),
      gaps: this.docGaps.map((gap) => ({ ...gap })),
      sarabanNo: this.noticeSaraban,
      reply: this.replySent ? this.currentReply() : null,
      committee: this.committeeSent ? this.committeePayload() : null,
      inquiry: this.inquiryPayload(),
      passes: this.noticePasses.map((pass) => ({ ...pass, reply: pass.reply ? { ...pass.reply, files: pass.reply.files.map((file) => ({ ...file })) } : null })),
      sent,
      sentBy: sent ? (this.signedPerson || this.directorName) : this.docSentBy,
    };
  }

  protected saveDocs(send: boolean): void {
    if (send ? !this.docCanSend : this.docSent || !this.canReviewDocs) return;
    if (!send && this.noticeLetter.every((item) => item.value.trim())) this.placeNoticeFile();
    if (send) {
      this.replySent = false;
      this.issueNotice();
    }
    const payload = this.docPayload(send);
    writeDocNotice(payload);
    this.docSent = send;
    this.docSentBy = payload.sentBy;
    if (send && this.docAction === 'amend') {
      writeCaseStatus('revision');
      this.caseStatus = 'revision';
    }
    this.notice = send ? 'docs' : 'saved';
    if (send) {
      this.noticeFormOpen = false;
      this.editingId = '';
    }
  }

  private issueNotice(): void {
    const numbers = ['สบ.2005/2562', 'สบ.2805/2562', 'สบ.0506/2562', 'สบ.1006/2562'];
    const no = numbers[this.noticePasses.length] || `สบ.${this.noticePasses.length + 1}/2562`;
    this.noticeSaraban = no;
    const title = this.noticeFileTitle();
    const at = `${this.docNoticedOn} 10:30`;
    this.placeNoticeFile(no);
    this.madeDocs = [...this.madeDocs, {
      id: `notice-${no}`,
      kind: title,
      at: this.docNoticedOn,
      fields: [{ label: 'เลขรับสารบรรณ', value: no }, ...this.noticeLetter.map((field) => ({ ...field }))],
    }];
    writeMadeDocs(this.madeDocs);
    this.ensureReceipt();
    if (!this.receipt) return;
    const link = {
      no,
      at,
      events: [
        { at, text: `ส่ง${title}เข้าระบบสารบรรณ` },
        { at, text: `ได้รับเลขรับ ${no}` },
      ],
    };
    this.receipt = { ...this.receipt, links: [link, ...this.receipt.links.filter((item) => item.no !== no)] };
    writeReceipt(this.receipt);
  }

  private noticeFileTitle(): string {
    if (this.docAction === 'complete') return 'หนังสือแจ้งคำขอครบถ้วนถูกต้อง';
    if (this.docAction === 'late') return 'หนังสือแจ้งคำขอไม่ครบถ้วนถูกต้องภายใน 4 เดือน';
    return `หนังสือแจ้งขอข้อมูลเพิ่ม ครั้งที่ ${this.noticePasses.length + 1}`;
  }

  private placeNoticeFile(saraban = ''): void {
    const name = saraban ? `หนังสือแจ้ง-${saraban.replaceAll('/', '-')}.pdf` : 'หนังสือแจ้งแก้ไข.pdf';
    const row = { name, title: this.noticeFileTitle(), sentOn: this.docNoticedOn };
    const kept = this.docFiles.filter((file) => file.name !== name && file.name !== 'หนังสือแจ้งแก้ไข.pdf' && !/^หนังสือแจ้ง-สบ\./.test(file.name));
    this.docFiles = [row, ...kept];
  }

  protected get shownGaps() {
    return this.docGaps;
  }

  protected get canDecideReply(): boolean {
    if (!this.docSent || !this.replySent || this.docAction !== 'amend') return false;
    if (this.reviewRole === 'director') return true;
    return this.approverNames().includes(this.signedPerson);
  }

  private passNow(): NoticePass {
    return {
      action: this.docAction,
      noticedOn: this.docNoticedOn,
      dueOn: this.docDueOn,
      note: this.docNote,
      sentBy: this.docSentBy,
      sarabanNo: this.noticeSaraban,
      reply: this.replySent ? this.currentReply() : null,
    };
  }

  protected askAgain(): void {
    if (!this.canDecideReply) return;
    this.noticePasses = [...this.noticePasses, this.passNow()];
    this.replySent = false;
    this.docSent = false;
    this.docAction = 'amend';
    this.docNoticedOn = '28/05/2562';
    this.docDueOn = '20/06/2562';
    this.docFiles = [];
    this.noticeLetter = noticeLetterFields(this.docAction, this.docNoticedOn, this.docDueOn, this.signedPerson);
    this.suggestGaps();
    writeCaseStatus('revision');
    this.caseStatus = 'revision';
    this.notice = 'suggest';
  }

  protected markComplete(): void {
    if (!this.canDecideReply) return;
    this.noticePasses = [...this.noticePasses, this.passNow()];
    this.docAction = 'complete';
    this.docNoticedOn = '28/05/2562';
    this.docNote = 'ตรวจคำขอที่แก้ไขแล้ว ครบถ้วนถูกต้อง';
    this.noticeLetter = noticeLetterFields(this.docAction, this.docNoticedOn, this.docDueOn, this.signedPerson);
    this.issueNotice();
    this.docSent = true;
    this.docSentBy = this.signedPerson || this.directorName;
    writeDocNotice(this.docPayload(true));
    writeCaseStatus('official');
    this.caseStatus = 'official';
    this.reviewTab = 'docs';
    this.docPart = this.workDocs.length + 1;
    this.notice = 'docs';
  }

  protected get replyGroups(): { id: ReplyFile['group']; label: string; required: boolean }[] {
    if (this.replyKind === 'extend') return [{ id: 'extend', label: 'แนบไฟล์ประกอบการขอขยายเวลา', required: true }];
    return [
      { id: 'closed', label: 'แนบไฟล์คำขอฉบับปกปิด', required: true },
      { id: 'extra', label: 'แนบเอกสารประกอบ (ถ้ามี)', required: false },
      { id: 'open', label: 'แนบไฟล์คำขอฉบับเปิดเผย', required: true },
    ];
  }

  protected replyFilesOf(group: ReplyFile['group']): ReplyFile[] {
    return this.replyFiles.filter((file) => file.group === group);
  }

  protected get canSendReply(): boolean {
    const letterOk = !!this.replyLetterDate.trim() && !!this.replyLetterNo.trim() && !!this.replyLetterTo.trim() && !!this.replyLetterSubject.trim() && !!this.replyLetterBody.trim();
    if (!letterOk || this.replySent) return false;
    if (this.replyKind === 'extend') return !!this.amendReason.trim() && thaiDateOk(this.replyNewDue, 'any') && this.replyFilesOf('extend').length > 0;
    return this.replyFilesOf('closed').length > 0 && this.replyFilesOf('open').length > 0;
  }

  protected addReplyFiles(group: ReplyFile['group'], event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = [...(input.files ?? [])].map((file) => ({ name: file.name, title: file.name.replace(/\.[^.]+$/, ''), group }));
    this.replyFiles = [...this.replyFiles, ...files];
    input.value = '';
  }

  protected removeReplyFile(name: string): void {
    this.replyFiles = this.replyFiles.filter((file) => file.name !== name);
  }

  protected sendApplicantReply(): void {
    if (!this.canSendReply) return;
    this.replyAt = this.noticePasses.length ? '05/06/2562' : '22/05/2562';
    this.replySent = true;
    const payload = this.docPayload(this.docSent);
    payload.sentBy = this.docSentBy;
    writeDocNotice(payload);
    this.notice = 'reply';
  }

  protected downloadReplyFile(file: ReplyFile): void {
    const html = `<!DOCTYPE html><html lang="th"><head><meta charset="utf-8"><title>${this.escapeHtml(file.title)}</title><style>body{margin:32px 48px;color:#0E2346;font-family:Thonburi,Sarabun,sans-serif;font-size:16px;line-height:28px}h1{margin:0 0 8px;font-size:20px;font-weight:500}p{margin:0 0 12px}</style></head><body><h1>${this.escapeHtml(file.title)}</h1><p>เลขที่อ้างอิง ${filingRefId}</p><p>${this.escapeHtml(this.replyLetterSubject)}</p><p>${this.escapeHtml(this.replyLetterBody)}</p></body></html>`;
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name.replace(/\.[^.]+$/, '') + '.html';
    link.click();
    URL.revokeObjectURL(url);
  }

  protected addDocFiles(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = [...(input.files ?? [])].map((file) => ({ name: file.name, title: file.name.replace(/\.[^.]+$/, ''), sentOn: this.docNoticedOn || '20/05/2562' }));
    this.docFiles = [...this.docFiles, ...files];
    input.value = '';
  }

  protected renameDocFile(index: number, title: string): void {
    this.docFiles = this.docFiles.map((file, item) => (item === index ? { ...file, title } : file));
    if (!this.docSent) writeDocNotice(this.docPayload(false));
  }

  protected removeDocFile(index: number): void {
    this.docFiles = this.docFiles.filter((_, item) => item !== index);
    if (!this.docSent) writeDocNotice(this.docPayload(false));
  }

  protected get officeLinks(): OfficeLink[] {
    return [...(this.receipt?.links ?? [])].sort((a, b) => this.officeStamp(b.at) - this.officeStamp(a.at));
  }

  protected openOffice(link: OfficeLink): void {
    this.officeLink = {
      ...link,
      events: [...link.events].sort((a, b) => this.officeStamp(b.at) - this.officeStamp(a.at)),
    };
  }

  private officeStamp(at: string): number {
    const [date, time = '00:00'] = at.split(' ');
    const [day, month, year] = date.split('/').map(Number);
    const [hour, minute] = time.split(':').map(Number);
    return new Date(year || 0, (month || 1) - 1, day || 1, hour || 0, minute || 0).getTime();
  }

  private seedOfficeLinks(): OfficeLink[] {
    const ref = filingRefId;
    return [
      {
        no: 'สบ.1820/2562',
        at: '02/06/2562 11:05',
        events: [
          { at: '02/06/2562 11:05', text: 'ระบบสารบรรณส่งเลขที่ลงรับ' },
          { at: '02/06/2562 11:06', text: `เชื่อมกับคำขอ ${ref}` },
        ],
      },
      {
        no: 'สบ.1694/2562',
        at: '20/05/2562 13:20',
        events: [
          { at: '20/05/2562 13:20', text: 'ระบบสารบรรณส่งเลขที่ลงรับ' },
          { at: '20/05/2562 13:21', text: `เชื่อมกับคำขอ ${ref}` },
        ],
      },
      {
        no: 'สบ.1605/2562',
        at: '16/05/2562 10:00',
        events: [
          { at: '16/05/2562 10:00', text: 'ลงรับคำขอจากระบบสารบรรณ เรื่องยื่นคำขอ' },
          { at: '16/05/2562 10:01', text: `เชื่อมกับคำขอ ${ref}` },
        ],
      },
    ];
  }

  private ensureAssignment(): void {
    const saved = readWorkAssignment();
    if (this.reviewRole === 'staff') {
      const work = saved.groups.filter((group) => groupHead(group));
      this.pickedPeople = saved.people;
      this.pickedGroups = work;
      this.groupTasks = this.tasksFor(work, false);
      this.hands = saved.hands.filter((hand) => work.includes(hand.group));
      this.slips = saved.slips;
      this.assignOrder = saved.order;
      this.assignedOn = saved.assignedOn;
      this.dueOn = saved.dueOn;
      this.prepareSlip();
      return;
    }
    if (saved.people.length || saved.groups.length) {
      this.pickedPeople = saved.people;
      this.pickedGroups = saved.groups;
      this.assignNote = saved.note;
      this.assignOrder = saved.order;
      this.assignedOn = saved.assignedOn;
      this.dueOn = saved.dueOn;
      this.assignReply = saved.reply;
      this.replyReason = saved.reason;
      this.replyDraft = saved.reply === 'pending' ? '' : saved.reply;
      const work = saved.groups.filter((group) => groupHead(group));
      if (work.length < 2) {
        this.pickedGroups = work;
        this.groupTasks = this.tasksFor(work, false);
        this.hands = saved.hands.filter((hand) => work.includes(hand.group));
      } else {
        this.pickedGroups = work;
        this.groupTasks = saved.groupTasks.filter((task) => work.includes(task.group));
        if (this.groupTasks.length < 2) this.groupTasks = this.tasksFor(work, true);
        this.hands = saved.hands;
      }
      this.slips = saved.slips;
      this.forwardPick = [];
      if (saved.people.length && !saved.groups.length) this.assignMode = 'person';
      this.prepareSlip();
      return;
    }
    this.pickedGroups = ['กลุ่มงานมาตรการตอบโต้การทุ่มตลาด (AD)', 'กลุ่มงานมาตรการตอบโต้การทุ่มตลาดอุดหนุน (CVD)'];
    this.pickedPeople = [];
    this.groupTasks = this.tasksFor(this.pickedGroups, true);
    this.hands = [];
    this.forwardPick = [];
    this.assignOrder = 'รับผิดชอบคำขอทุ่มตลาดเหล็กแผ่นรีดร้อน';
    this.assignedOn = '16/05/2562';
    this.dueOn = '30/05/2562';
    this.slips = [];
    writeWorkAssignment(this.assignmentPayload());
    this.prepareSlip();
  }

  private prepareSlip(): void {
    if (this.reviewRole === 'director') {
      this.slipReceipt = 'accept';
      this.slipKind = 'forward';
    } else if (this.hands.some((hand) => hand.name === this.signedPerson)) {
      this.slipKind = 'report';
    }
    if (!this.slipOrder) this.slipOrder = this.assignOrder || 'รับผิดชอบคำขอทุ่มตลาดเหล็กแผ่นรีดร้อน';
    if (!this.slipAssignedOn) this.slipAssignedOn = this.assignedOn || '16/05/2562';
    if (!this.slipDueOn) this.slipDueOn = this.dueOn || '30/05/2562';
    if (!this.slipDueTime) this.slipDueTime = '14:28';
    this.syncSlipPeople(true);
  }

  protected personTitle(name: string): string {
    return staffPeople.find((person) => person.name === name)?.title || 'เจ้าหน้าที่รายบุคคล';
  }

  private ensureReceipt(): void {
    const links = this.seedOfficeLinks();
    if (!this.receipt) {
      this.receipt = {
        deptNo: '',
        deptDate: '',
        deptTime: '',
        sarabanNo: 'สบ.1605/2562',
        sarabanDate: '16/05/2562',
        sarabanTime: '10:00',
        letterNo: 'B1/2562',
        letterDate: '16/05/2562',
        subject: 'ยื่นคำขอ',
        links,
      };
      writeReceipt(this.receipt);
      return;
    }
    if (!this.receipt.links.length) {
      this.receipt = { ...this.receipt, links };
      writeReceipt(this.receipt);
    }
  }

  protected leaveReview(): void {
    const home: Record<string, string> = { staff: '/cases', director: '/director', head: '/head', officer: '/officer' };
    void this.router.navigateByUrl(home[this.reviewRole] ?? '/director');
  }

  protected get directorAssigned(): boolean {
    return !!this.directorName && this.pickedPeople.includes(this.directorName);
  }

  protected assignToDirector(): void {
    if (this.reviewRole !== 'staff' || !this.directorName || this.directorAssigned) return;
    const saved = readWorkAssignment();
    const people = saved.people.includes(this.directorName) ? saved.people : [...saved.people, this.directorName];
    writeWorkAssignment({ ...saved, people, groups: saved.groups.filter((group) => groupHead(group)) });
    this.pickedPeople = people;
    if (readCaseStatus() === 'consult' && readConsult()) {
      writeConsultGroup('');
      writeConsultStep('director');
    }
    this.notice = 'saved';
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
    if (this.screenCheck?.state === 'checking') return this.screenCheck.round;
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
    this.historyView = null;
  }

  protected answerGroups(round: FilingRound): string[] {
    return [...new Set((round.answers ?? []).map((row) => row.group))];
  }

  protected answersIn(round: FilingRound, group: string): { label: string; value: string }[] {
    return (round.answers ?? []).filter((row) => row.group === group);
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

  protected get fixItems(): RoundFinding[] {
    if (this.rounds.length) return this.rounds[this.rounds.length - 1].findings ?? [];
    if (this.docSent && this.docAction === 'amend') return this.docGaps.map((item) => ({ ...item, action: 'เพิ่มเอกสาร' as const }));
    return [];
  }

  protected get amendSpan(): number {
    const read = (value: string) => {
      const [day, month, year] = value.split('/').map(Number);
      if (!day || !month || !year) return 0;
      return new Date(year - 543, month - 1, day).getTime();
    };
    const from = read(this.filedOn);
    const to = read(this.amendUntil);
    if (!from || !to || to < from) return 0;
    return Math.round((to - from) / 86400000);
  }

  protected get caseClock(): { tone: 'info' | 'warning' | 'danger'; label: string; text: string } | null {
    if (!this.tracking && !this.reviewRole) return null;
    if (readFlowFile()) return null;
    if (this.docSent && this.docAction === 'complete') {
      if (this.inquiryFeeSent && !this.inquiryPayAck) return this.dueClock(this.inquiryFeeDue, 'ชำระค่าธรรมเนียม', 'หากเกินกำหนดต้องทำเรื่องขอขยายเวลา');
      return null;
    }
    if (this.docSent && this.docAction === 'late') {
      return { tone: 'danger', label: 'ถึงกำหนดแล้ว', text: `กระบวนการขอพิจารณาครบ 4 เดือนเมื่อ ${this.amendUntil} แล้วยังไม่ครบถ้วน ต้องทำเรื่องขอขยายเวลา` };
    }
    if (this.docSent && this.docAction === 'amend') {
      const extra = this.dueClock(this.docDueOn, 'ส่งข้อมูลเพิ่ม', 'หากเกินกำหนดต้องทำเรื่องขอขยายเวลา');
      if (extra?.tone === 'danger') return extra;
    }
    const left = this.daysUntil(this.amendUntil);
    if (left < 0) return { tone: 'danger', label: 'ถึงกำหนดแล้ว', text: `อยู่ในกระบวนการขอพิจารณา ครบกำหนด 4 เดือนเมื่อ ${this.amendUntil} ต้องทำเรื่องขอขยายเวลา` };
    return { tone: left <= 30 ? 'warning' : 'info', label: `เหลือ ${left} วัน`, text: `อยู่ในกระบวนการขอพิจารณา ครบกำหนด 4 เดือนเมื่อ ${this.amendUntil} หากเกินต้องทำเรื่องขอขยายเวลา` };
  }

  private dueClock(due: string, work: string, over: string): { tone: 'info' | 'warning' | 'danger'; label: string; text: string } | null {
    const left = this.daysUntil(due);
    if (!due) return null;
    if (left < 0) return { tone: 'danger', label: 'ถึงกำหนดแล้ว', text: `ครบกำหนด${work}เมื่อ ${due} ${over}` };
    return { tone: left <= 7 ? 'warning' : 'info', label: `เหลือ ${left} วัน`, text: `ครบกำหนด${work}เมื่อ ${due}` };
  }

  private daysUntil(value: string): number {
    const [day, month, year] = value.split('/').map(Number);
    if (!day || !month || !year) return 0;
    const due = new Date(year - 543, month - 1, day);
    const today = new Date();
    due.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return Math.round((due.getTime() - today.getTime()) / 86400000);
  }

  protected leaveFiling(): void {
    if (this.returnCase) {
      void this.router.navigate(['/requests', this.returnCase]);
      return;
    }
    void this.router.navigateByUrl('/requests');
  }

  private applyCaseForm(): void {
    const item = findListedCase(this.returnCase);
    if (!item) return;
    const extra = caseFormExtra(item);
    this.formRef = item.ref;
    if (item.filer) {
      this.refId = item.ref;
      this.filedOn = item.created || this.filedOn;
      this.amendUntil = addThaiMonths(this.filedOn, 4);
      this.filing = 'self';
    }
    this.company = item.applicant || this.company;
    this.address = '';
    this.phone = '';
    this.fax = '';
    this.email = '';
    this.agent = '';
    this.agentPhone = '';
    this.agentFax = '';
    this.agentEmail = '';
    if (item.applicant?.includes('ในประเทศ')) this.nationality = 'ไทย';
    const goods = item.goods.replace(/\s+/g, ' ').trim();
    this.goodsDetail = goods.length > 200 ? goods.slice(0, 200) : goods;
    this.relatedImport = '';
    this.priorAid = '';
    this.outsideProducer = '';
    this.channelDetail = '';
    this.originDetail = '';
    this.factoryNote = '';
    this.thirdReason = '';
    this.thaiDetail = '';
    this.specialDetail = '';
    this.compareReason = '';
    this.originPeriod = '';
    this.thaiPeriod = '';
    this.currency = '';
    this.exportDetail = '';
    this.explainDetail = '';
    this.originCosts = [emptyCost()];
    this.thaiCosts = [emptyCost()];
    this.docs = [];
    this.exportDocs = [];
    this.marginDocs = [];
    this.subsidyDocs = [];
    this.explainDocs = [];
    this.otherDocs = [];
    for (const key of Object.keys(this.sheets) as (keyof typeof this.sheets)[]) this.sheets[key] = [];
    this.notes = Object.fromEntries(Object.keys(this.notes).map((key) => [key, '']));
    for (const key of Object.keys(this.groups)) this.groups[key] = [];
    for (const key of Object.keys(this.files)) this.files[key] = '';
    this.ack = false;
    this.signer = '';
    this.signedOn = '';
    this.signatureName = '';
    this.signatureUrl = '';
    this.letterDate = item.created || this.letterDate;
    this.letterSubject = `ขอให้พิจารณาดำเนินการสินค้า${item.goods}`;
    this.letterBody = `${item.applicant || 'ผู้ยื่นคำขอ'} ขอนำส่งแบบ ปร. 1 สินค้า${item.goods} ต่อกรมการค้าต่างประเทศ`;
    this.letterPurpose = `ขอให้พิจารณา${item.kind} สินค้า${item.goods}`;
    this.replyLetterBody = this.letterBody;
    if (item.origins?.length) {
      this.countries.splice(0, this.countries.length, ...item.origins);
      this.exportCountry = item.origins[0];
    } else if (item.filer) {
      this.countries.splice(0, this.countries.length);
      this.exportCountry = '';
      this.nationality = 'ไทย';
    }
    this.makers = [party(item.applicant || 'ผู้ผลิตในประเทศ')];
    const known = extra.exporters;
    for (const block of this.parties) {
      if (block.key === 'exporters' || block.key === 'producers') block.rows = known.length ? known.map((name) => party(name)) : [emptyParty()];
      else block.rows = [emptyParty()];
    }
  }

  protected toggleRound(round: number): void {
    this.expandedRound = this.expandedRound === round ? 0 : round;
  }

  protected openStored(round: FilingRound): void {
    this.openedRound = round;
    this.historyView = 'files';
    this.viewingForm = false;
    this.revising = false;
  }

  protected openRoundForm(round: FilingRound): void {
    const saved = round.answers?.length ? round : { ...round, answers: this.formAnswers() };
    if (!round.answers?.length) {
      this.rounds = this.rounds.map((item) => (item.round === round.round ? saved : item));
      writeRounds(this.rounds);
    }
    this.openedRound = this.rounds.find((item) => item.round === round.round) ?? saved;
    this.historyView = 'form';
    this.viewingForm = false;
    this.revising = false;
  }

  private formAnswers(): { group: string; label: string; value: string }[] {
    const rows = [
      { group: 'ส่วนที่ 1 ผู้ยื่นคำขอ', label: 'ชื่อ', value: this.company },
      { group: 'ส่วนที่ 1 ผู้ยื่นคำขอ', label: 'สัญชาติ', value: this.nationality },
      { group: 'ส่วนที่ 1 ผู้ยื่นคำขอ', label: 'ที่อยู่', value: this.address },
      { group: 'ส่วนที่ 1 ผู้ยื่นคำขอ', label: 'โทรศัพท์', value: this.phone },
      { group: 'ส่วนที่ 1 ผู้ยื่นคำขอ', label: 'โทรสาร', value: this.fax },
      { group: 'ส่วนที่ 1 ผู้ยื่นคำขอ', label: 'เลขที่หนังสือ', value: this.letterNo },
      { group: 'ส่วนที่ 1 ผู้ยื่นคำขอ', label: 'วันที่หนังสือ', value: this.letterDate },
      { group: 'ส่วนที่ 1 ผู้ยื่นคำขอ', label: 'ผู้ลงนาม', value: this.signer },
      { group: 'ส่วนที่ 2 สินค้า', label: 'รายละเอียดสินค้า', value: this.goodsDetail },
      { group: 'ส่วนที่ 2 สินค้า', label: 'ช่องทางการจำหน่าย', value: this.channelDetail },
      { group: 'มาตรการ', label: 'มาตรการ', value: this.measureName },
    ];
    return rows.filter((row) => row.value.trim());
  }

  /** แบบที่ยื่นมาในคำขอเดียวกัน มีได้มากกว่าหนึ่งแบบ */
  protected readonly caseForms: { code: string; measure: string }[] = [
    { code: 'ปร. 1', measure: 'มาตรการ AD' },
    { code: 'ปร. 2', measure: 'มาตรการ AD' },
  ];

  protected get caseMeasures(): string[] {
    return [...new Set(this.caseForms.map((form) => form.measure))];
  }

  protected get measureLabel(): string {
    return this.caseMeasures[0] ?? 'มาตรการ AD';
  }

  protected get caseGoods(): string {
    return this.goodsDetail.split('(')[0]?.trim() || this.goodsDetail;
  }

  protected get caseLabel(): string {
    if (this.inquiryOpen === 'open') return 'เปิดการไต่สวน';
    if (this.inquiryOpen === 'close') return 'ปิดการไต่สวน';
    if (this.inquiryDecide === 'return') return 'คืนคำขอ';
    if (this.inquiryFeeSent && !this.inquiryPayAck) return this.inquiryPaySent ? 'รอรับทราบการชำระ' : 'รอชำระค่าธรรมเนียม';
    if (!this.reviewRole && this.docSent && this.docAction === 'complete' && this.committeeSent && this.committeeResult === 'take') return 'รับคำขอ';
    if (!this.reviewRole && this.docSent && this.docAction === 'complete' && this.committeeSent) return 'ไม่รับคำขอ';
    if (!this.reviewRole && this.docSent && this.docAction === 'complete') return 'รอคณะกรรมการพิจารณา';
    if (!this.reviewRole && this.docSent && this.docAction === 'late') return 'ไม่ครบภายใน 4 เดือน';
    if (!this.reviewRole && this.docSent && this.docAction === 'amend' && this.replySent) return 'ส่งข้อมูลเพิ่มแล้ว';
    if (!this.reviewRole && this.docSent && this.docAction === 'amend') return 'ขอข้อมูลเพิ่ม';
    if (this.checkReturned) return 'ให้แก้ไข';
    if (this.screenChecking || this.waitingReceipt) return 'ตรวจสอบคำขอ';
    return caseStatusLabel(this.caseStatus);
  }

  protected get caseTone() {
    if (this.inquiryOpen === 'close' || this.inquiryDecide === 'return') return 'danger' as const;
    if (this.inquiryOpen === 'open') return 'success' as const;
    if (this.inquiryFeeSent && !this.inquiryPayAck) return 'warning' as const;
    if (!this.reviewRole && this.docSent && this.docAction === 'complete' && this.committeeSent && this.committeeResult === 'reject') return 'danger' as const;
    if (!this.reviewRole && this.docSent && this.docAction === 'complete' && !this.committeeSent) return 'info' as const;
    if (!this.reviewRole && this.docSent && this.docAction === 'complete') return 'success' as const;
    if (!this.reviewRole && this.docSent && this.docAction === 'late') return 'danger' as const;
    if (!this.reviewRole && this.docSent && this.docAction === 'amend' && !this.replySent) return 'warning' as const;
    if (!this.reviewRole && this.docSent && this.docAction === 'amend') return 'info' as const;
    if (this.checkReturned) return 'warning' as const;
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
      answers: this.formAnswers(),
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
    return this.sectionsReady && this.requestReady && this.signReady && this.pledgeReady;
  }

  protected get canConfirm(): boolean {
    return this.submitReady;
  }

  protected uploadOpen = false;
  protected readOn = false;

  protected openFilledUpload(): void {
    this.uploadOpen = true;
  }

  protected applyRead(): void {
    this.phone = readParty.phone;
    this.email = readParty.email;
    this.agentPhone = readParty.agentPhone;
    if (!this.agentFax.trim()) this.agentFax = readParty.agentFax;
    if (!this.agentEmail.trim()) this.agentEmail = readParty.agentEmail;
    this.relatedImport = readText.related;
    this.readOn = true;
    this.publishGuide();
    this.view.detectChanges();
  }

  protected bad(key: string): boolean {
    if (!this.readOn) return false;
    const value = key === 'related' ? this.relatedImport : String((this as unknown as Record<string, string>)[key] ?? '');
    return valueIsWrong(key, value);
  }

  protected readHint(key: string): string {
    return this.bad(key) ? wrongHint(key) : '';
  }

  protected get screenCheck() {
    return readFlowFile();
  }

  protected get waitingReceipt(): boolean {
    return this.screenCheck?.state === 'receive';
  }

  protected get screenChecking(): boolean {
    return this.screenCheck?.state === 'checking';
  }

  protected get checkReturned(): boolean {
    return this.screenCheck?.state === 'fix';
  }

  protected get offerConsult(): boolean {
    return this.checkReturned && (this.screenCheck?.round ?? 0) >= 3;
  }

  protected get failedChecks() {
    return (this.screenCheck?.items ?? []).filter((item) => !item.pass && !!item.note);
  }

  protected openSubmit(): void {
    this.submitAck = false;
    this.submitOpen = true;
  }

  protected confirmSubmit(): void {
    if (!this.canConfirm || this.submitting) return;
    this.submitOpen = false;
    this.beginScreenCheck();
  }

  protected resubmitAfterCheck(): void {
    this.beginScreenCheck();
  }

  private beginScreenCheck(): void {
    const roundNo = this.rounds.filter((round) => round.state === 'revision').length + 1;
    writeCaseStatus('review');
    this.caseStatus = 'review';
    this.revising = false;
    this.viewingForm = false;
    this.openedRound = null;
    writeReviewUntil(0);
    window.clearInterval(this.reviewTimer);
    this.reviewTimer = 0;
    writeFlowFile({ state: 'checking', passed: false, items: [], round: roundNo, until: Date.now() + 5000 });
    this.armScreenCheck();
    this.publishGuide();
    this.view.markForCheck();
  }

  private armScreenCheck(): void {
    window.clearTimeout(this.submitTimer);
    const file = readFlowFile();
    if (!file || file.state !== 'checking') return;
    const wait = Math.max(0, (file.until ?? Date.now()) - Date.now());
    this.submitTimer = window.setTimeout(() => this.finishScreenCheck(), wait);
  }

  private finishScreenCheck(): void {
    const roundNo = readFlowFile()?.round || this.rounds.length + 1;
    const simulateFail = roundNo <= 3;
    const findings = roundNo === 1 ? this.revisionFindings : roundNo === 2 ? this.secondFindings : this.thirdFindings;
    const levels = ['ความครบถ้วน', 'ความสอดคล้อง', 'ความถูกต้องตามเงื่อนไข'];
    const items = simulateFail
      ? levels.map((label, index) => {
          const found = findings[index];
          return found
            ? { label, pass: false, detail: found.detail, note: found.title, place: found.place }
            : { label, pass: true, detail: 'ผ่านในระดับนี้', note: '', place: '' };
        })
      : this.aiChecks.map((item) => ({ ...item }));
    const passed = items.every((item) => item.pass);
    const round = this.captureRound(roundNo);
    if (!passed) {
      round.state = 'revision';
      round.findings = items.filter((item) => !item.pass).map((item) => ({ place: item.place || '', title: item.note, detail: item.detail, action: 'ปรับข้อมูล' as const }));
    }
    this.rounds = [...this.rounds, round];
    writeRounds(this.rounds);
    writeCaseStatus('review');
    this.caseStatus = 'review';
    writeFlowFile({ state: passed ? 'receive' : 'fix', passed, items, round: roundNo });
    this.submitting = false;
    this.publishGuide();
    this.view.markForCheck();
  }

  protected editAfterCheck(): void {
    this.revising = true;
    this.openedRound = null;
    this.viewingForm = false;
  }

  protected get consultSubmitter(): string {
    if (this.consult?.by) return this.consult.by;
    if (!this.reviewRole) return this.accounts.displayName;
    return roleLabel.corporate;
  }

  protected consultWayText(channel?: string): string {
    if (channel === 'phone') return 'โทรศัพท์';
    if (channel === 'online') return 'Online';
    if (channel === 'onsite') return 'OnSite';
    return '';
  }

  protected get consultReady(): boolean {
    return !!this.consultTopic.trim() && !!this.consultDetail.trim() && !!this.consultChannel;
  }

  protected sendConsult(): void {
    const topic = this.consultTopic.trim();
    const detail = this.consultDetail.trim();
    if (!topic || !detail || !this.consultChannel) return;
    const request = { topic, detail, when: '', channel: this.consultChannel, by: this.accounts.displayName, at: `${this.filedOn} 10:15` };
    writeConsult(request);
    this.consult = request;
    this.consultNotes = [];
    this.consultPlan = null;
    writeConsultThread([]);
    writeConsultPlan(null);
    const sideOnly = !this.consultFormal && (this.caseStatus === 'official' || this.caseStatus === 'revision');
    if (sideOnly && this.approverNames().length) {
      writeConsultAssigned(true);
      this.consultAssigned = true;
      this.sideTalk = true;
    } else if (sideOnly) {
      writeConsultAssigned(false);
      this.consultAssigned = false;
      this.sideTalk = true;
    } else {
      writeConsultAssigned(false);
      this.consultAssigned = false;
      writeCaseStatus('consult');
      this.caseStatus = 'consult';
      this.revising = false;
      this.viewingForm = false;
      this.sideTalk = false;
      writeConsultStep('receive');
      writeConsultGroup('');
      this.watchAssign();
    }
    this.consultOpen = false;
    this.consultFormal = false;
    if (this.consultAssigned && this.consultByChat) this.openTalk();
    this.publishGuide();
  }

  protected get consultWaitText(): string {
    const step = readConsultStep();
    if (step === 'receive' || step === 'forward') return 'รอเจ้าหน้าที่รับเรื่องมอบหมายให้ผู้อำนวยการ';
    if (step === 'director') return 'รอผู้อำนวยการมอบหมายกลุ่ม';
    if (step === 'group') return 'รอหัวหน้ากลุ่มมอบหมายเจ้าหน้าที่ในกลุ่ม';
    return 'รอผู้ดูแล';
  }

  protected get consultWaitTag(): string {
    const step = readConsultStep();
    if (step === 'director') return 'รอผู้อำนวยการ';
    if (step === 'group') return 'รอหัวหน้ากลุ่ม';
    return 'รอเจ้าหน้าที่รับเรื่อง';
  }

  protected openConsult(): void {
    this.consultFormal = true;
    this.consultOpen = true;
  }

  protected openApplicantMenu(label: string): void {
    if (label === 'ยื่นคำร้องขอพบเจ้าหน้าที่' || label === 'รายการยื่นคำร้องขอพบเจ้าหน้าที่') this.openConsult();
  }

  protected openSideTalk(): void {
    if (!this.consult) {
      this.consultFormal = false;
      this.consultTopic = this.caseStatus === 'revision' ? 'สอบถามการส่งข้อมูลเพิ่ม' : 'สอบถามระหว่างยื่นคำขอ';
      this.consultDetail = `คำขอเลขที่อ้างอิง ${this.refId}`;
      this.consultWhen = '20/05/2562 10:00';
      this.consultOpen = true;
      return;
    }
    this.sideTalk = true;
    if (this.approverNames().length && !this.consultAssigned) {
      writeConsultAssigned(true);
      this.consultAssigned = true;
    }
    if (this.consultAssigned && this.consultByChat) this.openTalk();
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
    const staff = this.reviewRole === 'officer';
    if ((!text && !this.pendingFiles.length) || (!staff && this.caseStatus !== 'consult')) return;
    this.consultNotes = [...this.consultNotes, { from: staff ? 'officer' : 'applicant', text, at: '16/05/2562 11:55', files: this.pendingFiles }];
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

  protected approverNames(): string[] {
    return acceptedAssignees(readWorkAssignment());
  }

  protected filingOwners(): string[] {
    return this.filingGate?.owners.length ? this.filingGate.owners : consultFilingOwners();
  }

  protected get consultDutyAssigned(): boolean {
    return consultFilingOwners().length > 0;
  }

  protected get filingDecisionReady(): boolean {
    return this.filingDecision === 'approve' || !!this.filingReason.trim();
  }

  protected get canApproveFiling(): boolean {
    if (!this.reviewRole || this.caseStatus !== 'approval') return false;
    if (this.filingGate?.state === 'pending') return this.filingGate.owners.includes(this.signedPerson);
    return this.approverNames().includes(this.signedPerson);
  }

  protected approveOfficial(): void {
    if (!this.canApproveFiling) return;
    writeApprovedBy(this.signedPerson);
    this.approvedBy = this.signedPerson;
    writeFilingGate(null);
    this.filingGate = null;
    writeApprovalUntil(0);
    window.clearInterval(this.approvalTimer);
    writeCaseStatus('official');
    this.caseStatus = 'official';
    this.notice = 'saved';
    this.publishGuide();
  }

  protected submitFilingDecision(): void {
    if (!this.canApproveFiling || !this.filingDecisionReady) return;
    if (this.filingDecision === 'approve') {
      this.approveOfficial();
      return;
    }
    const gate: FilingGate = {
      state: 'rejected',
      at: this.replyStamp(),
      owners: this.filingGate?.owners ?? [],
      by: this.signedPerson,
      reason: this.filingReason.trim(),
    };
    writeFilingGate(gate);
    this.filingGate = gate;
    this.filingDecision = 'approve';
    this.filingReason = '';
    writeApprovalUntil(0);
    window.clearInterval(this.approvalTimer);
    writeCaseStatus('consult');
    this.caseStatus = 'consult';
    this.publishGuide();
  }

  protected confirmOfficial(): void {
    if (!this.aiReady && !this.checkReturned) return;
    const fromConsult = this.caseStatus === 'consult';
    const owners = fromConsult ? consultFilingOwners() : [];
    this.officialOpen = false;
    this.consultOpen = false;
    this.revising = false;
    this.viewingForm = false;
    this.openedRound = null;
    if (fromConsult && owners.length) {
      const gate: FilingGate = { state: 'pending', at: this.replyStamp(), owners };
      writeFilingGate(gate);
      this.filingGate = gate;
      writeApprovalUntil(0);
      writeCaseStatus('approval');
      this.caseStatus = 'approval';
      const note: ConsultNote = {
        from: 'applicant',
        text: `ขอยื่นแบบทางการ ส่งให้${owners.join(' และ ')}ตรวจสอบอนุมัติ`,
        at: gate.at,
      };
      this.consultNotes = [...readConsultThread(), note];
      writeConsultThread(this.consultNotes);
      this.watchApproval();
    } else {
      writeFilingGate(null);
      this.filingGate = null;
      writeCaseStatus('official');
      this.caseStatus = 'official';
    }
    this.publishGuide();
  }

  private readyApprovers(): void {
    const saved = readWorkAssignment();
    if (acceptedAssignees(saved).length) return;
    const ad = 'กลุ่มงานมาตรการตอบโต้การทุ่มตลาด (AD)';
    const cvd = 'กลุ่มงานมาตรการตอบโต้การทุ่มตลาดอุดหนุน (CVD)';
    const groups = saved.groups.filter((group) => groupHead(group));
    const useGroups = groups.length >= 2 ? groups : [ad, cvd];
    let tasks = saved.groupTasks.filter((task) => useGroups.includes(task.group) && task.head);
    if (tasks.length < useGroups.length) {
      tasks = useGroups.map((group) => tasks.find((task) => task.group === group) || { group, head: groupHead(group), reply: 'pending' as const, reason: '' });
    }
    const first = tasks.find((task) => task.reply !== 'return') ?? tasks[0];
    if (!first?.head) return;
    tasks = tasks.map((task) => task.group === first.group ? { ...task, reply: 'accept' as const, reason: '' } : task);
    const member = groupMembers(first.group).find((person) => !saved.hands.some((hand) => hand.name === person.name && hand.reply === 'return'));
    const hands = member
      ? [{ name: member.name, group: first.group, reply: 'accept' as const, reason: '' }, ...saved.hands.filter((hand) => hand.name !== member.name)]
      : saved.hands;
    const slips = [...saved.slips];
    const order = saved.order || 'รับผิดชอบคำขอทุ่มตลาดเหล็กแผ่นรีดร้อน';
    if (!slips.some((slip) => slip.from === this.directorName && slip.to === first.head)) {
      slips.push({
        at: '16/05/2562 14:28',
        from: this.directorName,
        to: first.head,
        group: first.group,
        receipt: 'accept',
        kind: 'forward',
        assignedOn: saved.assignedOn || '16/05/2562',
        dueOn: saved.dueOn || '30/05/2562',
        dueTime: '14:28',
        remind: true,
        order,
        files: [{ name: 'คำสั่งมอบหมาย.pdf', title: 'คำสั่งมอบหมาย' }],
      });
    }
    if (member && !slips.some((slip) => slip.from === first.head && slip.to === member.name)) {
      slips.push({
        at: '16/05/2562 14:28',
        from: first.head,
        to: member.name,
        group: first.group,
        receipt: 'accept',
        kind: 'forward',
        assignedOn: '16/05/2562',
        dueOn: '30/05/2562',
        dueTime: '14:28',
        remind: true,
        order,
        files: [{ name: 'คำสั่งมอบหมาย.pdf', title: 'คำสั่งมอบหมาย' }],
      });
    }
    writeWorkAssignment({
      ...saved,
      groups: useGroups,
      groupTasks: tasks,
      hands,
      slips,
      order,
      assignedOn: saved.assignedOn || '16/05/2562',
      dueOn: saved.dueOn || '30/05/2562',
    });
    writeConsultAssigned(true);
  }

  private armReview(): void {
    window.clearInterval(this.reviewTimer);
    if (readFlowFile()) return;
    if (this.caseStatus !== 'review') return;
    let until = readReviewUntil();
    const cap = Date.now() + reviewWaitMs;
    if (!until || until > cap) {
      until = cap;
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

  protected get noticeHeading(): string {
    if (this.notice === 'draft') return 'บันทึกร่างแล้ว';
    if (this.notice === 'submitted') return 'ส่งคำขอสำเร็จ';
    if (this.notice === 'assist') return 'สร้างข้อมูลให้แล้ว';
    if (this.notice === 'check') return 'ตรวจให้แล้ว';
    if (this.notice === 'suggest') return 'แนะนำรายการแล้ว';
    if (this.notice === 'reply') return this.replyKind === 'extend' ? 'ส่งคำขอขยายเวลาแล้ว' : 'ส่งคำขอที่แก้ไขแล้ว';
    if (this.notice === 'docs') return this.docAction === 'amend' ? 'ส่งแจ้งขอข้อมูลเพิ่มแล้ว' : 'ส่งผลการตรวจแล้ว';
    if (this.notice === 'etr') return 'ได้รับ Ref Case ID (eTR) แล้ว';
    if (this.notice === 'saved') return 'ดำเนินการสำเร็จ';
    return 'ทำรายการสำเร็จ';
  }

  protected get noticeDetail(): string {
    if (this.notice === 'assist') return 'ระบบใส่ข้อมูลตั้งต้นของเอกสารนี้ให้แล้ว แก้ไขต่อได้ก่อนกดบันทึก';
    if (this.notice === 'check') return 'ระบบใส่ข้อมูลตั้งต้นของหนังสือแจ้งแก้ไขให้แล้ว แก้ไขต่อได้ก่อนกดบันทึก';
    if (this.notice === 'suggest') return 'ระบบใส่รายการที่ควรขอเพิ่มให้แล้ว แก้ไขหรือเพิ่มรายการได้ก่อนกดส่ง';
    if (this.notice === 'reply') return this.replyKind === 'extend' ? `ขอขยายเวลาส่งถึง ${this.replyNewDue} เจ้าหน้าที่จะพิจารณาคำขอขยายเวลาต่อ` : 'ส่งไฟล์คำขอที่แก้ไขและหนังสือนำส่งให้เจ้าหน้าที่แล้ว';
    if (this.notice === 'docs') return this.docAction === 'amend' ? `ส่งหนังสือแจ้งขอข้อมูลเพิ่มเข้าระบบสารบรรณแล้ว ได้เลขรับ ${this.noticeSaraban}` : `ส่งผลการตรวจเข้าระบบสารบรรณแล้ว ได้เลขรับ ${this.noticeSaraban}`;
    if (this.notice === 'etr') return `ระบบ eTR ส่ง Ref Case ID (eTR) ${this.etrRefNo} กลับมา และเชื่อมกับคำขอนี้แล้ว`;
    if (this.notice === 'saved') return 'ระบบได้ทำการบันทึกข้อมูลเรียบร้อยแล้ว';
    if (this.notice === 'draft') return `คำขอเลขที่อ้างอิง ${this.refId} อยู่ในสถานะร่าง`;
    if (this.notice === 'submitted') return this.checkReturned ? `ส่งคำขอเลขที่อ้างอิง ${this.refId} แล้ว มีประเด็นที่ต้องแก้ไขก่อนดำเนินการต่อ` : `ส่งคำขอเลขที่อ้างอิง ${this.refId} แล้ว อยู่ระหว่างตรวจสอบ`;
    return `ระบบได้รับคำขอเลขที่อ้างอิง ${this.refId} แล้ว ผลการตรวจสอบจะแจ้งภายใน 10 วินาที`;
  }

  protected finishNotice(): void {
    const submitted = this.notice === 'submitted';
    this.notice = null;
    if (submitted) {
      if (!readFlowFile()) void this.router.navigate(['/requests', 'AD1054']);
      return;
    }
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

  protected open(item: TocLink, event?: Event): void {
    this.section = item.id;
    this.anchor = item.anchor ?? '';
    this.guideField = '';
    this.publishGuide();
    this.view.detectChanges();
    scrollFormToTop(event);
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

  protected get sectionNeedsFix(): boolean {
    return this.toc.some((group) => group.items.some((item) => item.id === this.section && (!item.anchor || item.anchor === this.anchor) && this.failed(item)));
  }

  protected get checkForms(): { code: string; groups: TocGroup[] }[] {
    const groups = this.measure === 'subsidy'
      ? this.toc
      : this.toc.filter((group) => !group.items.some((item) => item.id.startsWith('7')));
    return [{ code: 'ปร. 1', groups }];
  }

  protected groupComplete(group: TocGroup): boolean {
    return group.items.every((item) => this.itemComplete(item));
  }

  protected get sectionsReady(): boolean {
    return this.toc.every((group) => this.groupComplete(group));
  }

  protected itemComplete(item: TocLink): boolean {
    if (this.failed(item)) return false;
    const id = item.id;
    const anchor = item.anchor ?? '';
    if (id.startsWith('7') && this.measure !== 'subsidy') return !this.formView;
    if (id === 'other') return this.formView ? this.otherDocs.length > 0 : true;
    if (id === '1' && anchor === 'part-1-1') {
      if (!this.hasText(this.company) || !this.hasText(this.nationality) || !this.hasText(this.address) || !this.hasText(this.phone)) return false;
      return !this.onBehalf || (this.hasText(this.agent) && this.makers.every((row) => this.hasText(row.name)));
    }
    if (id === '1' && anchor === 'part-1-2') return this.hasText(this.relatedImport);
    if (id === '1' && anchor === 'part-1-3') return this.hasText(this.priorAid);
    if (id === '2') return this.hasText(this.goodsDetail) && this.hasText(this.channelDetail);
    if (id === '3') {
      const block = this.parties.find((entry) => anchor === `part-${entry.key}`);
      return !!block && block.rows.some((row) => this.hasText(row.name));
    }
    if (id === '4' && anchor === 'part-4-1') return this.hasText(this.exportCountry) && this.hasText(this.factoryNote) && this.hasText(this.currency);
    if (id === '4' && anchor === 'part-4-2') return this.hasText(this.thirdReason);
    if (id === '4' && anchor === 'part-4-3-1') return this.hasText(this.originPeriod) && this.hasText(this.originDetail);
    if (id === '4' && anchor === 'part-4-3-2') return this.hasText(this.thaiPeriod) && this.hasText(this.thaiDetail);
    if (id === '4' && anchor === 'part-4-4') return this.hasText(this.specialDetail);
    if (id === '4' && anchor === 'part-4-5') return this.hasText(this.compareReason) && (this.market === 'yes' || this.hasText(this.method));
    if (id === '5') return this.hasText(this.exportDetail);
    if (id === '6') return this.docsOf('margin').length > 0;
    if (id === '7.1') return this.docsOf('subsidy').length > 0;
    if (id === '7.2') return this.hasText(this.explainDetail);
    if (id === '7.3' || id === '7.4') return false;
    if (id === '8.1') return this.hasText(this.note('importDetail'));
    if (id === '8.2') return this.hasText(this.note('priceEffect')) && this.hasText(this.note('costEffect'));
    if (id === '8.3') return this.conditions.every((entry) => this.hasText(this.note(entry.key)));
    if (id === '8.4') return this.hasText(this.note('factorDetail'));
    if (id === '8.5') return this.hasText(this.note('summaryDetail'));
    if (id === '8.6') return this.hasText(this.note('buyerDetail'));
    if (id === '8.7') return this.hasText(this.note('trendCapacity')) && this.hasText(this.note('trendPrice')) && this.hasText(this.note('trendOther'));
    if (id === '8.8') return this.hasText(this.note('intentDetail'));
    if (id === '9') return this.pledgeReady && this.signReady;
    return this.filled(item);
  }

  private hasText(value: string): boolean {
    return !!value.trim();
  }

  protected issueFor(item: TocLink): string {
    const read = this.readIssue(item);
    if (read) return read;
    return this.failSpots().find((spot) => this.spotHits(spot, item))?.reason ?? '';
  }

  private readIssue(item: TocLink): string {
    if (item.anchor === 'part-1-1' && (this.bad('phone') || this.bad('email') || this.bad('agentPhone'))) {
      return 'อ่านเบอร์โทรและอีเมลจากไฟล์ได้ไม่ถูกต้อง';
    }
    if (item.anchor === 'part-1-2' && this.bad('related')) return 'ข้อมูลส่วนนี้ไม่ตรงกับไฟล์ต้นฉบับ';
    return '';
  }

  protected get sectionIssue(): string {
    const item = this.toc.flatMap((group) => group.items).find((entry) => this.current(entry));
    if (!item) return '';
    return this.failSpots().find((spot) => this.spotHits(spot, item))?.reason ?? '';
  }

  protected docIssue(key: string): string {
    return this.failSpots().find((spot) => spot.docs.includes(key))?.reason ?? '';
  }

  private returnCase = '';
  protected formView = false;
  protected formRef = '';
  private sampleCase: ListedCase | null = null;

  protected get formCase(): string {
    return findListedCase(this.returnCase)?.code || this.returnCase;
  }

  protected fixReason(anchor: string): string {
    return this.failSpots().find((spot) => spot.anchors.includes(anchor))?.reason ?? '';
  }

  private get activeFindings(): RoundFinding[] {
    if (this.revising && this.returnCase) return this.revisionFindings;
    if (this.revising || this.checkReturned) return this.rounds.at(-1)?.findings ?? [];
    if (this.caseStatus === 'draft' || this.caseStatus === 'review' || this.caseStatus === 'cancelled' || this.caseStatus === 'official') return [];
    return this.rounds.at(-1)?.findings ?? [];
  }

  private failSpots(): { ids: string[]; anchors: string[]; docs: string[]; reason: string }[] {
    return this.activeFindings.map((finding) => ({ ...this.spotOf(finding), reason: finding.detail }));
  }

  private spotOf(finding: RoundFinding): { ids: string[]; anchors: string[]; docs: string[] } {
    if (finding.place.includes('ส่วนที่ 1')) return { ids: ['1'], anchors: ['part-1-1'], docs: ['power'] };
    if (finding.place.includes('ส่วนที่ 2')) return { ids: ['2'], anchors: ['part-2'], docs: ['goods'] };
    if (finding.place.includes('ส่วนที่ 5')) return { ids: ['5'], anchors: ['part-5'], docs: ['export', 'import'] };
    if (finding.place.includes('ส่วนที่ 4')) return { ids: ['4', '5'], anchors: ['part-4-1', 'part-4-2', 'part-5'], docs: ['export'] };
    if (finding.place.includes('ส่วนที่ 6')) return { ids: ['6', '8.1', '8.5'], anchors: ['part-6'], docs: ['margin', 'summary', 'import'] };
    if (finding.place.includes('ส่วนที่ 3')) return { ids: ['3'], anchors: ['part-producers'], docs: [] };
    if (finding.place.includes('ส่วนที่ 8')) return { ids: ['8.5'], anchors: [], docs: ['summary'] };
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

  private seedConsultDraft(): void {
    if (!this.isMyGroupHead()) return;
    this.consultReceipt = 'accept';
    this.consultPickOfficers = this.membersOf(this.myWorkGroup()).slice(0, 2).map((person) => person.name);
    this.consultOrder = 'ให้ตรวจสอบเอกสารคำขอที่ปรึกษา รวบรวมข้อเท็จจริง และรายงานผลภายในกำหนด';
    this.consultRemind = true;
    this.consultFiles = [{ name: 'คำสั่งมอบหมาย.pdf', title: 'คำสั่งมอบหมายงาน' }];
  }

  private calmLiveFiling(): void {
    const early = this.caseStatus === 'draft' || this.caseStatus === 'review' || this.caseStatus === 'revision' || this.caseStatus === 'consult' || this.caseStatus === 'approval' || this.caseStatus === 'official';
    const drafted = sessionStorage.getItem('dft-por1-consult-default') === '1';
    if (!early || (this.consultJobs.length && !drafted)) return;
    this.docSent = false;
    this.docAction = 'amend';
    this.committeeSent = false;
    this.inquiryOpen = '';
    this.inquiryNoticeSent = false;
    this.laterPhase = { ...this.laterPhase, visit: false, prelim: false, draftFinal: false, finalResult: false, measures: false };
    writeLaterPhase(this.laterPhase);
    writeDocNotice(null);
    if (!this.consultJobs.length || drafted) {
      this.consultJobs = this.defaultDuty();
      sessionStorage.setItem('dft-por1-consult-default', '1');
      sessionStorage.setItem(this.consultJobKey, JSON.stringify(this.consultJobs));
    }
  }

  private defaultDuty(): ConsultGroupJob[] {
    const form = (order: string): ConsultSlip => ({
      assignedOn: '16/05/2562',
      dueOn: '30/05/2562',
      dueTime: '14:28',
      remind: true,
      order,
      files: [],
    });
    return [
      { group: 'กลุ่มงานมาตรการตอบโต้การทุ่มตลาด (AD)', reply: 'pending', form: form('รับผิดชอบคำขอทุ่มตลาดเหล็กแผ่นรีดร้อนจากเวียดนามและอียิปต์'), officers: [] },
      { group: 'กลุ่มงานมาตรการตอบโต้การทุ่มตลาดอุดหนุน (CVD)', reply: 'pending', form: form('รับผิดชอบประเด็นการอุดหนุนในคำขอเดียวกัน'), officers: [] },
    ];
  }

  private presentCase(): void {
    const packs = [...inquiryPack, ...prelimPack, ...draftFinalPack, ...finalResultPack, ...measurePack];
    let changed = false;
    packs.forEach((item, index) => {
      if (this.committeeFormDone(item.kind)) return;
      const fields = this.inquiryDraft(item.kind);
      if (!fields) return;
      const measure = measurePack.some((row) => row.kind === item.kind);
      const final = !measure && finalResultPack.some((row) => row.kind === item.kind);
      const draft = !measure && !final && draftFinalPack.some((row) => row.kind === item.kind);
      const prelim = !measure && !final && !draft && prelimPack.some((row) => row.kind === item.kind);
      const at = measure ? (this.measureOn || '15/06/2563') : final ? (this.finalOn || '20/12/2562') : draft ? (this.draftOn || '15/10/2562') : prelim ? (this.prelimOn || '20/08/2562') : (item.step === 'agenda' || item.step === 'hearing' || item.step === 'visit' ? (this.inquiryAgendaAt || '10/06/2562') : (this.inquiryNoticeOn || '25/06/2562'));
      this.madeDocs = [...this.madeDocs, { id: `present-${index}`, kind: item.kind, at, fields }];
      changed = true;
    });
    this.inquiryQuestions = defaultInquiryQuestions().map((item) => {
      const label = this.inquiryQuestionLabel(item.id);
      const formId = `present-form-${item.id}`;
      const answerId = `present-answer-${item.id}`;
      for (const paper of [
        { id: formId, kind: `แบบสอบถาม${label}`, at: '01/07/2562' },
        { id: answerId, kind: `คำตอบแบบสอบถาม${label} ฉบับเปิดเผย`, at: '20/07/2562' },
      ]) {
        if (this.madeDocs.some((doc) => doc.id === paper.id)) continue;
        this.madeDocs = [...this.madeDocs, { id: paper.id, kind: paper.kind, at: paper.at, fields: [{ label: 'เรื่อง', value: paper.kind }, { label: 'วันที่', value: paper.at }, { label: 'เนื้อความ', value: `จำลองข้อมูล${paper.kind} ของคำขอเลขที่อ้างอิง ${this.refId}`, long: true }] }];
        changed = true;
      }
      return { ...item, sent: true, received: true, passed: true, formDocId: formId, answerDocId: answerId, papers: [{ kind: 'form' as const, at: '01/07/2562', docId: formId, round: 1 }, { kind: 'answer' as const, at: '20/07/2562', docId: answerId, round: 1 }] };
    });
    if (changed) writeMadeDocs(this.madeDocs);
    this.docAction = 'complete';
    this.docSent = true;
    this.docSentBy = this.docSentBy || this.signedPerson || 'นางสาวจรีณา กิจส่งเสริมกุล';
    if (this.committeeResult !== 'reject') {
      this.committeeResult = 'take';
      if (!this.committeeFee) this.committeeFee = 'pay';
      this.committeeSent = true;
      this.committeeSentBy = this.committeeSentBy || this.docSentBy;
    }
    this.inquiryAgendaDone = true;
    this.inquiryDecide = 'take';
    this.inquiryFeeSent = true;
    this.inquiryPaySent = true;
    this.inquiryPayAck = true;
    if (!this.inquiryPayFiles.length) this.inquiryPayFiles = [{ name: 'หลักฐานชำระค่าธรรมเนียม.pdf', title: 'หลักฐานชำระค่าธรรมเนียมคำขอ', sentOn: '18/06/2562' }];
    this.inquiryOpen = 'open';
    this.inquiryCaseId = this.inquiryCaseId || 'AD256206100001';
    this.inquiryNoticeSent = true;
    this.inquiryHearing = 'hold';
    this.inquiryHearingPlace = this.inquiryHearingPlace || 'ห้องประชุม กรมการค้าต่างประเทศ';
    this.hearingMemo = 'ผู้มีส่วนได้เสียเข้าฟังความคิดเห็นครบตามนัด';
    this.hearingPeople = '12';
    this.hearingOffice = 'approve';
    this.fillVisitData();
    this.visitForeign = true;
    this.prelimHearing = 'yes';
    this.prelimAgain = 'no';
    this.draftSubstance = 'no';
    this.measure56 = 'no';
    this.measure57 = 'yes';
    this.measure58 = 'no';
    this.measure59 = 'no';
    this.laterPhase = {
      ...this.laterPhase,
      visit: true,
      prelim: true,
      draftFinal: true,
      finalResult: true,
      measures: true,
      marks: { ...this.laterPhase.marks, m56: 'no', m57: 'yes', m58: 'no', m59: 'no' },
      notes: {
        ...this.laterPhase.notes,
        visit: JSON.stringify({
          domestic: true,
          foreign: true,
          normalValue: this.normalValue,
          exportPrice: this.exportPrice,
          margin: this.dumpingMargin,
          parties: this.visitRows,
          volume: this.injuryVolume,
          price: this.injuryPrice,
          performance: this.injuryPerformance,
          customs: this.injuryCustoms,
          link: this.injuryLink,
          complete: 'yes',
        }),
        'qn-open': 'importer,domestic,exporter',
        'prelim-on': this.prelimOn,
        'prelim-hearing': 'yes',
        'prelim-again': 'no',
        'draft-on': this.draftOn,
        'draft-substance': 'no',
        'final-on': this.finalOn,
        'measure-on': this.measureOn,
        'hearing-memo': this.hearingMemo,
        'hearing-office': 'approve',
        'hearing-people': this.hearingPeople,
      },
    };
    writeLaterPhase(this.laterPhase);
    this.inquirySentBy = this.signedPerson || this.directorName;
    writeDocNotice(this.docPayload(true));
    if (this.reviewTab === 'inquiry') this.placeInquiry();
  }

  private presentStaffCase(item: ListedCase): void {
    this.sampleCase = item;
    this.refId = item.ref;
    this.returnCase = caseKey(item);
    this.applyCaseForm();
    for (const form of this.caseForms) form.measure = this.staffMeasureLabel(item);
    const statutory = /56|57|58|59/.test(`${item.measure} ${item.kind}`);
    const packs = statutory
      ? [...inquiryPack, ...prelimPack, ...draftFinalPack, ...finalResultPack, ...measurePack]
      : [...inquiryPack, ...prelimPack, ...draftFinalPack, ...finalResultPack];
    this.madeDocs = packs.map((row, index) => ({
      id: `sample-${item.code}-${index}`,
      kind: row.kind,
      at: item.created,
      fields: this.inquiryDraft(row.kind) ?? [
        { label: 'เรื่อง', value: row.kind },
        { label: 'เนื้อความ', value: this.inquiryCaseBody(row.kind), long: true },
      ],
    }));
    this.docAction = 'complete';
    this.docSent = true;
    this.docSentBy = this.signedPerson || 'นางสาวจรีณา กิจส่งเสริมกุล';
    this.committeeResult = 'take';
    this.committeeFee = 'pay';
    this.committeeSent = true;
    this.committeeSentBy = this.docSentBy;
    this.inquiryAgendaDone = true;
    this.inquiryDecide = 'take';
    this.inquiryFeeSent = true;
    this.inquiryPaySent = true;
    this.inquiryPayAck = true;
    this.inquiryPayFiles = [{ name: 'หลักฐานชำระค่าธรรมเนียม.pdf', title: 'หลักฐานชำระค่าธรรมเนียมคำขอ', sentOn: item.created }];
    this.inquiryOpen = 'open';
    this.inquiryCaseId = item.code;
    this.inquiryNoticeSent = true;
    this.inquiryHearing = 'hold';
    this.inquiryHearingPlace = 'ห้องประชุม กรมการค้าต่างประเทศ';
    const exporters = caseFormExtra(item).exporters;
    this.visitRows = (exporters.length ? exporters : ['ผู้ส่งออกในแฟ้ม']).map((name) => ({
      name,
      normalValue: 'ราคาในประเทศตามแบบสอบถามในแฟ้ม',
      exportPrice: 'ราคาส่งออกตามแบบสอบถามในแฟ้ม',
      compare: 'ปรับระดับการค้าให้เทียบกันได้',
      margin: 'ส่วนเหลื่อมเป็นไปตามมติที่ประชุม',
    }));
    this.visitDomestic = true;
    this.normalValue = this.visitRows[0].normalValue;
    this.exportPrice = this.visitRows[0].exportPrice;
    this.dumpingMargin = this.visitRows[0].margin;
    this.injuryVolume = `ปริมาณนำเข้าสินค้า${item.goods} ตามสถิติในแฟ้ม`;
    this.injuryPrice = 'ราคาในประเทศถูกกดจากสินค้านำเข้าตามข้อเท็จจริงในแฟ้ม';
    this.injuryPerformance = `ผลประกอบการของ${item.applicant || 'ผู้ยื่นคำขอ'} ในช่วงเดียวกัน`;
    this.injuryCustoms = 'ตรวจข้อมูลกรมศุลกากรตามแฟ้มแล้ว';
    this.injuryLink = 'ปริมาณนำเข้าและความเสียหายเกิดในช่วงเดียวกันตามแฟ้ม';
    this.visitDataOk = 'yes';
    this.visitForeign = true;
    this.prelimHearing = 'yes';
    this.prelimAgain = 'no';
    this.draftSubstance = 'no';
    this.measure56 = item.measure.includes('56') || item.kind.includes('56') ? 'yes' : 'no';
    this.measure57 = item.measure.includes('57') || item.kind.includes('57') ? 'yes' : 'no';
    this.measure58 = 'no';
    this.measure59 = 'no';
    this.laterPhase = {
      visit: true,
      prelim: true,
      draftFinal: true,
      finalResult: true,
      measures: statutory,
      marks: statutory ? { m56: this.measure56, m57: this.measure57, m58: 'no', m59: 'no' } : {},
      notes: {
        'qn-open': 'importer,domestic,exporter',
        'prelim-hearing': 'yes',
        'prelim-again': 'no',
        'draft-substance': 'no',
      },
    };
    if (this.reviewTab === 'inquiry') this.placeInquiry();
  }

  private staffMeasureLabel(item: ListedCase): string {
    if (item.measure.startsWith('SG')) return 'มาตรการ SG';
    if (item.measure.startsWith('AC') || item.kind.includes('หลบเลี่ยง')) return 'มาตรการ AC';
    if (item.measure.includes('56')) return 'มาตรา 56';
    if (item.measure.includes('57')) return 'มาตรา 57';
    return 'มาตรการ AD';
  }

  private seedResultDraft(): void {
    const mine = this.myConsultOfficer();
    if (mine?.reply === 'accept' && !mine.result) {
      this.resultDetail = 'ตรวจสอบเอกสารคำขอที่ปรึกษาแล้ว สรุปข้อเท็จจริงตามที่ได้รับมอบหมาย';
    }
  }

  ngOnInit(): void {
    const picked = this.pickedMeasure();
    if (!this.reviewRole && picked) this.measure = picked === 'cvd' ? 'subsidy' : 'dumping';
    this.caseStatus = readCaseStatus();
    this.filingGate = readFilingGate();
    this.caseNotes = readCaseNotes();
    this.noteReads = readNoteReads(this.accounts.username);
    this.laterPhase = readLaterPhase();
    this.inviteSent = !!this.laterPhase.notes['invite-sent'];
    this.restoreWorkNotes();
    this.loadDocNotice();
    this.loadWorkDrafts();
    this.loadMadeDocs();
    this.rounds = readRounds();
    this.consult = readConsult();
    this.consultNotes = readConsultThread();
    this.consultAssigned = readConsultAssigned();
    this.consultPlan = readConsultPlan();
    if (this.reviewRole) {
      this.viewingForm = true;
      this.ensureAssignment();
      const asked = this.route.snapshot.queryParamMap.get('tab');
      const assignNow = this.reviewRole === 'director' && (this.caseStatus === 'official' || this.caseStatus === 'approval') && !this.consultJobs.length;
      this.reviewTab = asked === 'assign' && this.showReviewTab('assign')
        ? 'assign'
        : assignNow
          ? 'assign'
          : this.reviewRole === 'external' ? 'docs' : this.reviewRole === 'bureau' || this.reviewRole === 'committee' || this.reviewRole === 'interest' ? 'inquiry' : 'form';
      this.ensureReceipt();
      this.seedConsultDraft();
      this.seedResultDraft();
    }
    if (this.caseStatus === 'approval' && !this.consult) {
      writeCaseStatus('official');
      this.caseStatus = 'official';
    }
    if (this.reviewRole) this.ensureLinks();
    if (this.caseStatus === 'review' && this.rounds.length === 0) {
      this.rounds = [this.captureRound(1)];
      writeRounds(this.rounds);
    }
    if (this.caseStatus === 'review' && !readFlowFile()) this.armReview();
    this.armScreenCheck();
    if (!this.reviewRole && this.route.snapshot.queryParamMap.get('consult') === '1') this.openConsult();
    const caseCode = this.route.snapshot.queryParamMap.get('case') ?? '';
    if (/^[A-Za-z0-9]+$/.test(caseCode)) this.returnCase = caseCode;
    this.formView = this.route.snapshot.queryParamMap.get('view') === '1' && !!this.returnCase;
    const owned = findListedCase(this.returnCase);
    if (this.formView || (!this.reviewRole && owned?.filer === this.accounts.username)) this.applyCaseForm();
    if (!this.reviewRole && this.route.snapshot.queryParamMap.get('revise') === '1') this.startRevise();
    const staffCase = this.reviewRole && !this.formView ? findListedCase(this.returnCase) : undefined;
    if (staffCase && !staffCase.draft) this.presentStaffCase(staffCase);
    else if (this.reviewRole && !this.formView && this.returnCase) this.presentCase();
    else if (this.reviewRole && !this.returnCase) this.calmLiveFiling();
    if (this.reviewRole && this.inquiryFeeSent && !this.inquiryOpen) this.watchInquiry();
    if (this.caseStatus === 'consult' && this.consultAssigned && this.consultByChat) this.openTalk();
    if (this.caseStatus === 'consult' && !this.consultAssigned) this.watchAssign();
    this.watchApproval();
    this.publishGuide();
  }

  private approvalTimer = 0;
  private assignTimer = 0;
  private inquiryTimer = 0;

  private watchInquiry(): void {
    window.clearInterval(this.inquiryTimer);
    this.inquiryTimer = window.setInterval(() => {
      const saved = readDocNotice()?.inquiry;
      if (!saved) return;
      if (saved.paySent === this.inquiryPaySent && saved.payAck === this.inquiryPayAck && saved.payFiles.length === this.inquiryPayFiles.length && saved.open === this.inquiryOpen) return;
      this.applyInquiry(saved);
      this.view.markForCheck();
    }, 1000);
  }

  private watchAssign(): void {
    window.clearInterval(this.assignTimer);
    if (this.caseStatus !== 'consult' || this.consultAssigned) return;
    let step = readConsultStep();
    this.assignTimer = window.setInterval(() => {
      const next = readConsultStep();
      if (next !== step) {
        step = next;
        this.view.markForCheck();
      }
      if (!readConsultAssigned()) return;
      this.consultAssigned = true;
      this.consultPlan = readConsultPlan();
      this.consultNotes = readConsultThread();
      window.clearInterval(this.assignTimer);
      if (this.consultByChat) this.openTalk();
      this.publishGuide();
      this.view.markForCheck();
    }, 1000);
  }

  private watchApproval(): void {
    window.clearInterval(this.approvalTimer);
    if (this.caseStatus !== 'approval') return;
    if (this.consult) {
      this.approvalTimer = window.setInterval(() => {
        const stored = readCaseStatus();
        if (stored === 'approval') return;
        this.caseStatus = stored;
        this.filingGate = readFilingGate();
        this.approvedBy = readApprovedBy();
        window.clearInterval(this.approvalTimer);
        this.publishGuide();
        this.view.markForCheck();
      }, 1000);
      return;
    }
    let until = readApprovalUntil();
    const cap = Date.now() + reviewWaitMs;
    if (!until || until > cap) {
      until = cap;
      writeApprovalUntil(until);
    }
    const tick = () => {
      const stored = readCaseStatus();
      if (stored !== 'approval') {
        this.caseStatus = stored;
        this.filingGate = readFilingGate();
        this.approvedBy = readApprovedBy();
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
    window.clearInterval(this.assignTimer);
    window.clearInterval(this.inquiryTimer);
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
