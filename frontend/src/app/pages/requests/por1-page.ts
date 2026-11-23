import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectorRef, Component, ElementRef, HostListener, ViewChild, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Accounts, roleLabel } from '../../accounts';
import { ApprovalLaneActions, type ApprovalLaneActionId, type ApprovalLaneActor } from '../../approval-lane/approval-lane-actions';
import { ApprovalHistoryPanel } from '../../approval-lane/approval-history-panel';
import { ApprovalListPanel } from '../../approval-lane/approval-list-panel';
import {
  ApprovalEofficePanel,
  type ApprovalEofficeLinkState,
  type ApprovalEofficePayload,
} from '../../approval-lane/approval-eoffice-panel';
import { DftButton } from '../../button/button';
import { ThaiDateField } from '../../fields/thai-date-field';
import { InputField } from '../../input-field/input-field';
import { phoneOk, thaiDateOk } from '../../fields/field-rules';
import { SideNav } from '../../menu-bar/side-nav';
import { DftModal } from '../../modal/modal';
import { FileField } from '../../fields/file-field';
import { StatusTag } from '../../status-tag/status-tag';
import { TopHeader } from '../../top-header/top-header';
import { FilingAiContext, type FilingSnapshot, type GuideAttachment, type GuideField } from '../../ask-ai/filing-context';
import { groupHead, groupMembers, peopleInGroup, staffGroups, staffPeople, workGroups } from '../staff/staff-roster';
import { acceptedAssignees, addThaiMonths, assignmentReplyLabel, assignmentReplyTone, assignmentStepLabel, assignmentStepTone, caseStatusLabel, caseStatusTone, consultChannelLabel, filingOfficer, filingRefId, filingUnit, firstFiledOn, ensureFilingRefSeqAtLeast, parseFilingRefSeq, readActiveFilingRef, writeActiveFilingRef, readOfficialOn, writeOfficialOn, readApprovalUntil, readApprovedBy, readApplicantNotices, readCaseStatus, readConsult, readConsultAssigned, readConsultPlan, readConsultStep, readConsultThread, consultFilingOwners, defaultConsultSlots, maxConsultSlots, minConsultSlots, nextConsultSlot, readFilingFiler, readFilingGate, releaseFilingToDirector, readEofficeDirectorHandoff, sendDirectorWorkToEoffice, pullDirectorAssignFromEoffice, directorWorkNeedsEoffice, writeEofficeDirectorHandoff, type EofficeDirectorHandoff, writeFilingFiler, writeFilingGate, defaultInquiryQuestions, readCaseNotes, readLaterPhase, readNoteReads, readDocNotice, readEtrLink, readMadeDocs, readWorkDrafts, readFlowFile, readReceipt, readReviewUntil, readRounds, readSystemLinks, readWorkAssignment, reviewWaitMs, writeApprovalUntil, writeApprovedBy, writeApplicantNotices, writeCaseStatus, writeFlowFile, writeConsult, writeConsultAssigned, writeConsultGroup, writeConsultPlan, writeConsultStep, writeConsultThread, writeCaseNotes, writeLaterPhase, writeNoteReads, writeDocNotice, writeEtrLink, writeMadeDocs, writeWorkDrafts, writeReceipt, writeReviewUntil, writeRounds, writeSystemLinks, writeWorkAssignment, upsertConsultRound, patchConsultRound, closeActiveConsultRound, readConsultRounds, openConsultRound as findOpenConsultRound, approvalLaneStageLabel, approvalLaneStageTone, approvalListStatusLabel, canCreateApprovalItem, toApprovalListRow, type ApprovalListRow, type ApprovalLaneHistoryEntry, type ApplicantNotice, type AssignFile, type AssignReply, type AssignSlip, type ApprovalLaneDoc, type ApprovalLaneStage, type CaseNote, type CaseNoteFile, type CaseStatus, type LaterPhase, type ConsultNote, type ConsultPlan, type ConsultPrivateNote, type ConsultRequest, type ConsultRound, type FilingGate, type DocAction, type DocNotice, type NoticeHistoryEntry, type NoticeItem, type NoticePipe, type DocFile as NoticeFile, type ApplicantReply, type ReplyFile, type NoticePass, type DocGap, type CommitteeRecord, type InquiryAgendaFile, type DraftAgendaVersion, type ApprovalSubmitRound, type ApprovalSubmitAttachment, type NoticeLetterVersion, type InquiryRecord, type InquiryPayFile, type InquiryQuestion, type InquiryIssued, type InquiryLoopKind, type FilingRound, type GroupTask, type OfficeLink, type PersonHand, type ReceiptRecord, type RoundFile, type RoundFinding, type RoundAnswer, type SystemLink, type MadeDoc, type WorkAssignment, type WorkDraft } from './case-status';
import { FilingTabs } from './filing-tabs';
import { readHearing, writeHearing } from './hearing-lane';
import { FilledUpload } from './filled-upload';
import { caseFormExtra } from './case-form';
import { cvdChosen, readFilingIntent } from './filing-intent';
import { downloadFormTemplate } from './form-template';
import { requestForms } from './form-catalog';
import { caseKey, findListedCase, type ListedCase } from './request-cases';
import { invitePath, joinedFor } from './interest-invite';
import { TextEditorToolbar } from '../../text-editor-toolbar/text-editor-toolbar';
import {
  addCofilerInvite,
  acceptCofilerInvite,
  cofilerById,
  cofilerInvitePath,
  cofilerPrivateStatus,
  cofilerStatusLabel,
  cofilerStatusTone,
  listCofilerInvites,
  markCofilerSubmitted,
  readCofilerPrivate,
  readCofilerView,
  resendCofilerInvite,
  revokeCofilerInvite,
  saveCofilerPrivate,
  writeCofilerView,
  type CofilerInvite,
  type CofilerPrivate,
} from './cofiler-invite';
import { readParty, readText, valueIsWrong, wrongHint } from './form-extract';
import { scrollFormToTop } from './form-scroll';

type InquiryStep = 'prepare' | 'draftAgenda' | 'subAgenda' | 'agenda' | 'decide' | 'letter' | 'prenotify' | 'fee' | 'proof' | 'vote' | 'notice' | 'sign' | 'letters' | 'news' | 'hearing' | 'questions' | 'visit';
type AgendaLane = 'draft' | 'sub' | 'tdc';
type OpenPrep = { ask: boolean; analyze: boolean; summary: boolean; report: boolean; pulled: boolean; revised: boolean; aiSummary: string; aiDraft: string; aiReview: string; sent: boolean; approved: boolean; prenotify: boolean; office: string[] };
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
    { id: 'final-publish', label: 'เผยแพร่', detail: 'เก็บข้อมูล เผยแพร่บนเว็บไซต์กอง และอัปเดตสถานะในระบบ' },
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
    { label: 'เลขอ้างอิงเผยแพร่สาธารณะ' },
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
type ConsultOfficerJob = {
  name: string;
  reply: 'pending' | 'accept' | 'return';
  move: DutyMove;
  repliedAt?: string;
  note?: string;
  noteFiles?: AssignFile[];
  result?: ConsultResult;
  form?: ConsultSlip;
};
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
type GoodsCompareRow = { item: string; subject: string; like: string };
type MarginCountry = { name: string; normal: string; exportPrice: string; margin: string; cif: string; rate: string };
type FormGuide = { title: string; lead: string; tips: string[] };
type BundleComment = { id: string; target: string; text: string; at: string; author: string; resolved?: boolean };

/** Comment แบบ Word บนข้อความแก้ไขคำขอ — ไฮไลต์ + กล้องปักจุด + กล่องข้างเอกสาร */
type AmendWordComment = {
  id: string;
  quote: string;
  text: string;
  author: string;
  initials: string;
  at: string;
  hue: number;
  parentId?: string;
  resolved?: boolean;
  /** text = ไฮไลต์ช่วงข้อความ, point = ปักกล้องชี้จุด/แถว */
  anchor?: 'text' | 'point';
};

type AmendWordPinLayout = {
  id: string;
  index: number;
  top: number;
  left: number;
  hue: number;
  active: boolean;
  anchor: 'text' | 'point';
};
type BundlePage = {
  id: string;
  kind: 'cover' | 'text' | 'file';
  chapter: string;
  title: string;
  heading?: string;
  fields?: { label: string; value: string }[];
  body?: string;
  group?: string;
  fileName?: string;
  saved?: string;
};

/** บล็อกแสดงผลแบบ Word ปร.1 จาก document/แบบฟอร์ม/มาตรการ AD */
type PorWordBlock =
  | { kind: 'head'; title: string; lines: string[] }
  | { kind: 'measure'; ad: boolean; cvd: boolean }
  | { kind: 'toc'; items: string[] }
  | { kind: 'hint'; text: string }
  | { kind: 'section'; text: string }
  | { kind: 'item'; text: string }
  | { kind: 'prompt'; text: string }
  | { kind: 'fill'; label: string; value: string }
  | { kind: 'check'; on: boolean; label: string; detail?: string }
  | { kind: 'para'; text: string }
  | { kind: 'table'; headers: string[]; rows: string[][] }
  | { kind: 'sign'; name: string; role: string; date: string };

function field(label: string, value: string, long = false): WorkDraft['fields'][number] {
  return { label, value, long };
}

function defaultWorkDrafts(): WorkDraft[] {
  return [
    {
      title: 'หนังสือขอข้อมูลหน่วยงานที่เกี่ยวข้อง',
      file: 'หนังสือขอข้อมูล-4-หน่วยงาน.pdf',
      fields: [
        field('ที่', 'พณ 0308/ว 128'),
        field('วันที่', '20/05/2562'),
        field('เรื่อง', 'ขอความอนุเคราะห์ข้อมูลรายชื่อและปริมาณการผลิตของผู้ผลิตสินค้าเหล็กแผ่นรีดร้อนในประเทศ'),
        field(
          'เรียน',
          '1. อธิบดีกรมโรงงานอุตสาหกรรม\n2. ผู้อำนวยการสถาบันเหล็กและเหล็กกล้าแห่งประเทศไทย\n3. ประธานกลุ่มอุตสาหกรรมเหล็ก สภาอุตสาหกรรมแห่งประเทศไทย\n4. ผู้อำนวยการสำนักงานเศรษฐกิจอุตสาหกรรม',
          true,
        ),
        field('อ้างถึง', 'คำขอเลขที่อ้างอิง R6201 บริษัท สหวิริยาสตีลอินดัสตรี จำกัด ลงวันที่ 15/05/2562'),
        field(
          'สิ่งที่ส่งมาด้วย',
          '1. แบบแสดงรายชื่อผู้ผลิต พร้อมสถานที่ตั้งโรงงาน\n2. แบบแสดงกำลังการผลิตและปริมาณการผลิต ปี 2560–2561 และไตรมาส 1 ปี 2562\n3. แบบแสดงปริมาณความต้องการใช้ภายในประเทศในช่วงเวลาเดียวกัน',
          true,
        ),
        field(
          'เนื้อความ',
          'ด้วยกรมการค้าต่างประเทศได้รับคำขอให้พิจารณาตอบโต้การทุ่มตลาดสินค้าเหล็กแผ่นรีดร้อนที่มีแหล่งกำเนิดจากประเทศเวียดนามและสาธารณรัฐอาหรับอียิปต์ ตามคำขอเลขที่อ้างอิง R6201 จากบริษัท สหวิริยาสตีลอินดัสตรี จำกัด\n\nเพื่อประกอบการตรวจสอบสถานะอุตสาหกรรมภายในและความครบถ้วนของคำขอ จึงขอความอนุเคราะห์ข้อมูลผู้ผลิตสินค้าดังกล่าวในประเทศ ได้แก่ รายชื่อและที่ตั้งโรงงาน กำลังการผลิต ปริมาณการผลิต และปริมาณความต้องการใช้ภายในประเทศ ตามแบบที่แนบมาด้วยนี้\n\nทั้งนี้ ขอความกรุณาส่งข้อมูลกลับภายใน 20/06/2562 หากมีข้อสงสัยประการใด กรุณาติดต่อกลุ่มงานมาตรการตอบโต้การทุ่มตลาด กองปกป้องและตอบโต้ทางการค้า',
          true,
        ),
        field('กำหนดส่งข้อมูล', '20/06/2562'),
        field('โทรศัพท์', '0 2547 4739'),
        field('โทรสาร', '0 2547 4740'),
        field('ลงชื่อ', '(นายประกิจ พรหมมา)'),
        field('ตำแหน่ง', 'ผู้อำนวยการกองปกป้องและตอบโต้ทางการค้า\nปฏิบัติราชการแทนอธิบดีกรมการค้าต่างประเทศ'),
      ],
    },
    {
      title: 'สรุปข้อมูลจากหน่วยงานที่เกี่ยวข้อง',
      file: 'สรุปข้อมูลจากหน่วยงานที่เกี่ยวข้อง-R6201.xlsx',
      fields: [
        field('ชื่อรายงาน', 'สรุปข้อมูลผู้ผลิตจากหน่วยงานที่เกี่ยวข้อง — คำขอ R6201'),
        field('วันที่จัดทำ', '28/05/2562'),
        field('ผู้จัดทำ', 'กลุ่มงานมาตรการตอบโต้การทุ่มตลาด (AD)'),
        field(
          'วัตถุประสงค์',
          'รวบรวมรายชื่อผู้ผลิต กำลังการผลิต และปริมาณการผลิตจากหน่วยงานที่เกี่ยวข้อง เพื่อใช้เป็นรายชื่อหลักสำหรับส่งแบบสอบถามเบื้องต้น และตรวจสอบฐานะอุตสาหกรรมภายในตามคำขอ R6201',
          true,
        ),
        field(
          'หน่วยงานที่ขอข้อมูล',
          '1. กรมโรงงานอุตสาหกรรม\n2. สถาบันเหล็กและเหล็กกล้าแห่งประเทศไทย\n3. สภาอุตสาหกรรมแห่งประเทศไทย (กลุ่มอุตสาหกรรมเหล็ก)\n4. สำนักงานเศรษฐกิจอุตสาหกรรม',
          true,
        ),
        field(
          'เลขที่หนังสือตอบกลับ',
          'กรมโรงงานอุตสาหกรรม อก 0307/1234 ลงวันที่ 24/05/2562\nสถาบันเหล็กและเหล็กกล้า เหล็ก 88/2562 ลงวันที่ 25/05/2562\nสภาอุตสาหกรรมแห่งประเทศไทย ส.อ.ท. 56/2562 ลงวันที่ 27/05/2562\nสำนักงานเศรษฐกิจอุตสาหกรรม ศก 0704/210 ลงวันที่ 28/05/2562',
          true,
        ),
        field(
          'วิธีจัดทำ',
          '1. รวมรายชื่อผู้ผลิตจากทั้ง 4 หน่วยงาน\n2. เทียบยอดกำลังการผลิตและปริมาณการผลิตของแต่ละราย\n3. ใช้ชุดข้อมูลที่ครบถ้วนและมียอดสูงสุดเป็นรายชื่อหลัก\n4. ตัดชื่อซ้ำจากการสะกดต่างกัน หรือบริษัทเดียวกันแต่คนละที่อยู่',
          true,
        ),
        field(
          'รายชื่อผู้ผลิตหลัก',
          '1. บริษัท สหวิริยาสตีลอินดัสตรี จำกัด (มหาชน) — ประจวบคีรีขันธ์ · กำลังการผลิต 1,800,000 ตัน/ปี\n2. บริษัท จี สตีล จำกัด (มหาชน) — ระยอง · กำลังการผลิต 1,800,000 ตัน/ปี\n3. บริษัท จี เจ สตีล จำกัด (มหาชน) — ระยอง · กำลังการผลิต 1,500,000 ตัน/ปี\n4. บริษัท สหมิตรเหล็กและเหล็กกล้า จำกัด — สมุทรปราการ · กำลังการผลิต 120,000 ตัน/ปี\n\nยืนยันจากกรมโรงงาน / สถาบันเหล็กฯ / ส.อ.ท. / ศก. (ตัดชื่อซ้ำและโรงงานแปรรูปที่ไม่ใช่ผู้ผลิต HRC หลัก)',
          true,
        ),
        field(
          'กำลังการผลิตและปริมาณการผลิต',
          'กำลังการผลิตรวมรายชื่อหลัก 4 ราย = 5,220,000 ตัน/ปี\nปริมาณการผลิต (ฐานกรมโรงงานอุตสาหกรรม)\n- ปี 2560: 3,235,000 ตัน\n- ปี 2561: 3,058,000 ตัน\n- ไตรมาส 1 ปี 2562: 728,000 ตัน\nอัตราใช้กำลังการผลิตโดยประมาณ 45–76% ตามราย เทียบกับสถาบันเหล็กฯ แล้วส่วนต่างไม่เกิน 3%',
          true,
        ),
        field(
          'ปริมาณความต้องการใช้ภายในประเทศ',
          'ค่ากลางจากสถาบันเหล็กฯ / ส.อ.ท. / ศก.\n- ปี 2560: 5,276,667 ตัน\n- ปี 2561: 5,085,000 ตัน\n- ไตรมาส 1 ปี 2562: 1,195,000 ตัน\nส่วนต่างอุปสงค์–การผลิตในประเทศประมาณ 2.0–2.1 ล้านตัน/ปี ซึ่งสอดคล้องกับการพึ่งพาการนำเข้าในช่วงคำขอ',
          true,
        ),
        field(
          'จุดที่ข้อมูลยังไม่ครบ',
          '1. หลักฐานราคาช่วงปลายปี 2561 ถึงต้นปี 2562 จากผู้ผลิตบางราย (โดยเฉพาะผู้ผลิตรอง)\n2. ปริมาณนำเข้าที่เชื่อมกับความเสียหายโดยตรง แยกตามแหล่งเวียดนามและอียิปต์\n3. รายชื่อผู้ผลิตที่ร่วมยื่นตามหนังสือมอบอำนาจให้ครบทุกฉบับ\n4. ยอดกำลังการผลิตของบางรายในทะเบียนโรงงานเป็นยอดรวมหลายผลิตภัณฑ์ ต้องยืนยันสัดส่วน HRC ตอนส่ง Pre-questionnaire',
          true,
        ),
        field(
          'สรุปที่นำไปใช้',
          '1. ใช้รายชื่อหลัก 4 รายเป็นฐานอุตสาหกรรมภายในสำหรับคำขอ R6201\n2. จัดทำและส่ง Pre-questionnaire ไปยังผู้ผลิตในรายชื่อหลัก\n3. ใช้ยอดกำลังการผลิต/ปริมาณการผลิต/อุปสงค์ประกอบการตรวจสถานะอุตสาหกรรมและความเสียหาย\n4. เก็บไฟล์ตอบกลับจาก 4 หน่วยงานไว้เป็นหลักฐานประกอบสรุป',
          true,
        ),
      ],
    },
    {
      title: 'Pre-questionnaire กลุ่มที่เกี่ยวข้อง',
      file: 'แบบสอบถามเบื้องต้น.docx',
      fields: [
        field('ชื่อแบบ', 'แบบสอบถามเบื้องต้น กลุ่มงานมาตรการตอบโต้การทุ่มตลาด (AD)'),
        field('คำขอ', 'R6201 สินค้าเหล็กแผ่นรีดร้อนจากเวียดนามและอียิปต์'),
        field('วันที่จัดทำ', '28/05/2562'),
        field('กำหนดส่งคำตอบ', '20/06/2562'),
        field(
          'กลุ่มผู้รับแบบ',
          'ผู้ผลิตเหล็กแผ่นรีดร้อนในประเทศตามรายชื่อหลักจากสรุปข้อมูล 4 หน่วยงาน (SSI, G Steel, G J Steel, Sahamit)',
          true,
        ),
        field(
          'ส่วนที่ 1 ฐานะผู้มีส่วนได้เสีย',
          'ระบุว่าเป็นผู้ผลิตในประเทศ ผู้ยื่นคำขอ หรือผู้ที่เกี่ยวข้องอย่างอื่น พร้อมหลักฐานประกอบ',
          true,
        ),
        field(
          'ส่วนที่ 2 กำลังการผลิตและปริมาณการผลิต',
          'กรอกกำลังการผลิตและปริมาณการผลิต ปี 2560–2561 และไตรมาส 1 ปี 2562 ตามแบบที่กำหนด',
          true,
        ),
        field(
          'ส่วนที่ 3 ราคา',
          'แนบหลักฐานราคาช่วงปลายปี 2561 ถึงต้นปี 2562 และระบุช่วงเวลาที่ครอบคลุม',
          true,
        ),
        field(
          'ส่วนที่ 4 ความเสียหาย',
          'อธิบายว่าปริมาณนำเข้าเชื่อมกับตัวชี้วัดความเสียหายของอุตสาหกรรมภายในอย่างไร',
          true,
        ),
        field(
          'ส่วนที่ 5 ผู้ผลิตที่ร่วมยื่น',
          'ยืนยันรายชื่อผู้ผลิตที่ร่วมยื่นครบตามหนังสือมอบอำนาจหรือไม่',
          true,
        ),
        field('ช่องทางส่งคำตอบ', 'ส่งกลับกองปกป้องและตอบโต้ทางการค้า พร้อมไฟล์แบบที่กรอกแล้ว และภาคผนวกตาราง'),
        field('ผู้จัดทำ', 'กลุ่มงานมาตรการตอบโต้การทุ่มตลาด (AD)'),
      ],
    },
  ];
}

const defaultNoticeGaps: DocGap[] = [
  { place: 'ส่วนที่ 4 ราคา', title: 'หลักฐานราคายังไม่ครอบคลุมช่วงเวลา', detail: 'ยังขาดราคาช่วงปลายปี 2561 ถึงต้นปี 2562' },
  { place: 'ส่วนที่ 5 ปริมาณและมูลค่า', title: 'ปริมาณนำเข้ายังไม่เชื่อมกับความเสียหาย', detail: 'ตัวเลขปริมาณนำเข้ายังอธิบายไม่ครบว่าเชื่อมกับความเสียหายอย่างไร' },
  { place: 'ส่วนที่ 3 ผู้ผลิตในประเทศ', title: 'รายชื่อผู้ผลิตที่ร่วมยื่นยังไม่ครบ', detail: 'รายชื่อยังไม่ครบตามหนังสือมอบอำนาจ' },
];

/** ส่วนถัดจากแจ้งผลการตรวจ — รวมเล่มแบบคำขอฉบับเปิดเผย / แบบคำขอฉบับปกปิด เหมือนแบบคำขอ */
const OPEN_EDITION_KIND = 'แบบคำขอฉบับเปิดเผย';
const CLOSED_EDITION_KIND = 'แบบคำขอฉบับปกปิด';
/** ชื่อ kind เก่าใน localStorage — ย้ายมา kind ใหม่เมื่อ seed */
const OPEN_EDITION_ALIASES = [OPEN_EDITION_KIND, 'ฉบับเปิดเผย', 'แบบคำขอ ฉบับเปิดเผยสมบูรณ์', 'แบบคำขอ ฉบับเปิดเผย'];
const CLOSED_EDITION_ALIASES = [CLOSED_EDITION_KIND, 'ฉบับปกปิด', 'ฉบับปกปิดสมบูรณ์', 'แบบคำขอ ฉบับปกปิด'];
/** ไฟล์ตัวอย่างตามโฟลเดอร์จริง — ชื่อแยกตามฉบับ */
const OPEN_EDITION_FILES: { name: string; title: string }[] = [
  { name: 'คำขอ ปร.1 Noncon final ฉบับเปิดเผย.pdf', title: 'คำขอ ปร.1 Noncon final ฉบับเปิดเผย' },
  { name: 'คำขอ ปร.1 Noncon final ฉบับเปิดเผย.docx', title: 'คำขอ ปร.1 Noncon final ฉบับเปิดเผย' },
  { name: 'คำถามเพิ่มเติม Noncon final ฉบับเปิดเผย.pdf', title: 'คำถามเพิ่มเติม Noncon final ฉบับเปิดเผย' },
  { name: 'คำถามเพิ่มเติม Noncon final ฉบับเปิดเผย.docx', title: 'คำถามเพิ่มเติม Noncon final ฉบับเปิดเผย' },
  { name: 'สิ่งที่ส่งมาด้วย - บัญชีรายการ ฉบับเปิดเผย.pdf', title: 'สิ่งที่ส่งมาด้วย - บัญชีรายการ ฉบับเปิดเผย' },
];
const CLOSED_EDITION_FILES: { name: string; title: string }[] = [
  { name: 'คำขอ ปร.1 Noncon final ฉบับปกปิด.pdf', title: 'คำขอ ปร.1 Noncon final ฉบับปกปิด' },
  { name: 'คำขอ ปร.1 Noncon final ฉบับปกปิด.docx', title: 'คำขอ ปร.1 Noncon final ฉบับปกปิด' },
  { name: 'คำถามเพิ่มเติม Noncon final ฉบับปกปิด.pdf', title: 'คำถามเพิ่มเติม Noncon final ฉบับปกปิด' },
  { name: 'คำถามเพิ่มเติม Noncon final ฉบับปกปิด.docx', title: 'คำถามเพิ่มเติม Noncon final ฉบับปกปิด' },
  { name: 'สิ่งที่ส่งมาด้วย - บัญชีรายการ ฉบับปกปิด.pdf', title: 'สิ่งที่ส่งมาด้วย - บัญชีรายการ ฉบับปกปิด' },
];

function gapSentence(gap: DocGap): string {
  const place = gap.place.trim();
  const rest = [gap.title.trim(), gap.detail.trim()].filter(Boolean).join(' ');
  if (place && rest) return `${place}: ${rest}`;
  return place || rest;
}

function noticeBody(action: DocAction, dueOn: string, gaps: DocGap[]): string {
  if (action === 'complete') return 'ด้วยกรมการค้าต่างประเทศได้ตรวจสอบคำขอเลขที่อ้างอิง R6201 ของบริษัท สหวิริยาสตีลอินดัสตรี จำกัด แล้ว เห็นว่าคำขอและเอกสารประกอบครบถ้วนถูกต้อง';
  const lines = gaps.map((gap, index) => `${index + 1}. ${gapSentence(gap)}`).filter((line) => !line.endsWith('. ')).join('\n');
  if (action === 'late') return `ด้วยครบกำหนดแก้ไขเพิ่มเติมคำขอเมื่อ 15/09/2562 แล้วยังไม่ครบถ้วนถูกต้องในเรื่องดังนี้\n${lines}`;
  return `ด้วยกรมการค้าต่างประเทศได้ตรวจสอบคำขอเลขที่อ้างอิง R6201 แล้ว ยังไม่ครบถ้วนดังนี้ จึงขอให้ส่งข้อมูลเพิ่มภายใน ${dueOn}\n${lines}`;
}

function noticeLetterFields(action: DocAction, noticedOn: string, dueOn: string, signer: string): WorkDraft['fields'] {
  const subject = action === 'complete'
    ? 'แจ้งผลการตรวจคำขอครบถ้วนถูกต้อง'
    : action === 'late'
      ? 'แจ้งคำขอไม่ครบถ้วนถูกต้องภายใน 4 เดือน'
      : 'แจ้งให้แก้ไขปรับปรุงข้อมูลคำขอให้ดำเนินการพิจารณาตอบโต้การทุ่มตลาด';
  const body = noticeBody(action, dueOn, defaultNoticeGaps);
  return [
    // เว้นว่าง — ออกจากระบบยังไม่มีเลข ต้องไปลงเลขที่ e-Office
    field('ที่', ''),
    field('วันที่', noticedOn),
    field('เรื่อง', subject),
    field('เรียน', 'บริษัท สหวิริยาสตีลอินดัสตรี จำกัด (มหาชน)'),
    field('อ้างถึง', 'คำขอเลขที่อ้างอิง R6201 ลงวันที่ 15/05/2563 เลขสารบรรณ สบ.1605/2562'),
    field('สิ่งที่ส่งมาด้วย', 'รายการแก้ไขปรับปรุงข้อมูลคำขอ (แบบปร. 1)'),
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
    field('อ้างถึง', 'คำขอเลขที่อ้างอิง R6201 เลขสารบรรณ สบ.1605/2562'),
    field('สิ่งที่ส่งมาด้วย', '-'),
    field('เนื้อความ', 'ด้วยคณะกรรมการได้พิจารณารับคำขอเลขที่อ้างอิง R6201 ของบริษัท สหวิริยาสตีลอินดัสตรี จำกัด ให้ไต่สวนการทุ่มตลาดสินค้าเหล็กแผ่นรีดร้อนจากเวียดนามและอียิปต์ จึงขอแจ้งรัฐบาลประเทศผู้ส่งออกเพื่อทราบ หนังสือนี้เก็บไว้ในระบบและไม่ส่งให้ผู้ยื่นคำขอ', true),
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

const inquiryPack: { step: 'draftAgenda' | 'subAgenda' | 'agenda' | 'notice' | 'sign' | 'letters' | 'news' | 'hearing' | 'visit'; group: string; kind: string }[] = [
  { step: 'draftAgenda', group: 'วาระเปิดไต่สวน', kind: 'วาระพิจารณาคำขอเปิดไต่สวน' },
  { step: 'draftAgenda', group: 'วาระเปิดไต่สวน', kind: 'ตารางปริมาณนำเข้าและความเสียหาย' },
  { step: 'draftAgenda', group: 'วาระเปิดไต่สวน', kind: 'ข้อพิจารณา (ตัวเลือก)' },
  { step: 'subAgenda', group: 'วาระอนุไต่สวน', kind: 'บันทึกเสนอ อธ. เข้าอนุฯ พิจารณาคำขอ' },
  { step: 'subAgenda', group: 'วาระอนุไต่สวน', kind: 'วาระพิจารณาคำขอเปิดไต่สวน (อนุ)' },
  { step: 'subAgenda', group: 'วาระอนุไต่สวน', kind: 'PowerPoint อนุไต่สวน' },
  { step: 'subAgenda', group: 'วาระอนุไต่สวน', kind: 'มติคณะอนุฯ ไต่สวน' },
  { step: 'subAgenda', group: 'วาระอนุไต่สวน', kind: 'รายงานการประชุมอนุไต่สวน' },
  { step: 'agenda', group: 'วาระ ทตอ. เปิดไต่สวน', kind: 'บันทึกเสนอวาระ ทตอ. เปิดไต่สวน' },
  { step: 'agenda', group: 'วาระ ทตอ. เปิดไต่สวน', kind: 'วาระพิจารณาคำขอเปิดไต่สวน (ทตอ.)' },
  { step: 'agenda', group: 'วาระ ทตอ. เปิดไต่สวน', kind: 'Chairman’s Note เปิดไต่สวน' },
  { step: 'agenda', group: 'วาระ ทตอ. เปิดไต่สวน', kind: 'PowerPoint ทตอ. เปิดไต่สวน' },
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
    field('วันที่ยื่นคำขอ', '15/05/2563'),
    field('วันที่คำขอครบถ้วน', '28/07/2563'),
    field('วันครบกำหนด 4 เดือน', '15/09/2563'),
    field('สาระสำคัญ', 'ผู้ยื่นขอดำเนินการตอบโต้การทุ่มตลาดสินค้าเหล็กแผ่นรีดร้อนชนิดเป็นม้วนและไม่เป็นม้วน จากเวียดนามและอียิปต์', true),
    field('ผลการตรวจสอบความครบถ้วน', 'คำขอครบถ้วนถูกต้องเมื่อ 28/07/2563 อยู่ภายในกำหนด 4 เดือนซึ่งครบวันที่ 15/09/2563', true),
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
    items: [
      { id: '5', label: '5.1 ราคาส่งออก', anchor: 'part-5' },
      { id: '5', label: '5.2 ราคาส่งออกที่คำนวณขึ้น', anchor: 'part-5-2' },
    ],
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
    label: 'ส่วนที่ 9 คำรับรองและหนังสือนำส่ง',
    items: [
      { id: '9', label: 'คำรับรองและลงนาม', anchor: 'part-9-pledge' },
      { id: '9', label: 'หนังสือนำส่ง', anchor: 'part-9-letter' },
    ],
  },
  {
    label: 'เอกสารผนวก',
    items: [
      { id: 'annex-a', label: 'เอกสารผนวก ก. ผู้ผลิตทั้งหมด' },
      { id: 'annex-b', label: 'เอกสารผนวก ข. ผู้ผลิตบางส่วน' },
      { id: 'annex-c', label: 'เอกสารผนวก ค. หนังสือมอบอำนาจ' },
      { id: 'other', label: 'เอกสารประกอบอื่น' },
    ],
  },
];

const defaultApplicantNoticeText =
  'กรมการค้าต่างประเทศได้พิจารณาคำขอปรึกษาของท่านแล้ว เห็นว่าสามารถแก้ไขแบบคำขอได้ตามประเด็นที่ปรึกษา จึงขอให้ดำเนินการแก้ไขภายในกำหนด 4 เดือนนับแต่วันที่ยื่นคำขอ';

@Component({
  selector: 'app-por1-page',
  imports: [TopHeader, SideNav, DftButton, NgTemplateOutlet, StatusTag, DftModal, ThaiDateField, InputField, FileField, FilledUpload, FilingTabs, TextEditorToolbar, ApprovalLaneActions, ApprovalEofficePanel, ApprovalListPanel, ApprovalHistoryPanel],
  templateUrl: './por1-page.html',
  styleUrl: './por1-page.css',
})
export class Por1Page {
  private readonly guide = inject(FilingAiContext);
  private readonly accounts = inject(Accounts);
  private readonly view = inject(ChangeDetectorRef);
  private guideField = '';
  protected readonly toc = toc;
  protected get formToc(): TocGroup[] {
    return this.toc.filter((group) => {
      const dumpOnly = group.items.some((item) => item.id === '4' || item.id === '5' || item.id === '6');
      const subOnly = group.items.some((item) => item.id.startsWith('7'));
      if (dumpOnly) return this.wantDumping;
      if (subOnly) return this.wantSubsidy;
      return true;
    });
  }
  protected refId = readActiveFilingRef();
  protected section = '1';
  protected anchor = 'part-1-1';
  protected wantDumping = !cvdChosen();
  protected wantSubsidy = cvdChosen();
  protected sectionHelpOpen = false;
  private skipHelpClose = false;

  protected get measure(): 'dumping' | 'subsidy' | 'both' {
    if (this.wantDumping && this.wantSubsidy) return 'both';
    return this.wantSubsidy ? 'subsidy' : 'dumping';
  }

  protected get measureLocked(): boolean {
    return true;
  }

  protected get filingLead(): string {
    if (this.wantSubsidy) return 'แบบคำขอให้ดำเนินการพิจารณาตอบโต้การอุดหนุน';
    return 'แบบคำขอให้ดำเนินการพิจารณาตอบโต้การทุ่มตลาด';
  }

  protected toggleSectionHelp(event?: Event): void {
    event?.stopPropagation();
    this.skipHelpClose = true;
    this.sectionHelpOpen = !this.sectionHelpOpen;
  }

  @HostListener('document:click')
  protected closeSectionHelpOnOutside(): void {
    if (this.skipHelpClose) {
      this.skipHelpClose = false;
      return;
    }
    this.sectionHelpOpen = false;
  }

  @HostListener('document:keydown.escape')
  protected closeSectionHelpOnEsc(): void {
    this.sectionHelpOpen = false;
    if (this.bundleViewerFull) this.bundleViewerFull = false;
  }

  protected get currentGuide(): FormGuide {
    const id = this.section;
    const anchor = this.anchor;
    if (id === '1' && anchor === 'part-1-1') {
      return {
        title: '1.1 ผู้ยื่นคำขอ',
        lead: 'กรอกข้อมูลผู้ยื่นเหมือนหน้าแรกของแบบกระดาษ ปร.1 ผู้ยื่นต้องเป็นผู้ผลิตสินค้าชนิดเดียวกันกับสินค้านำเข้าที่กล่าวหา',
        tips: [
          this.wantSubsidy
            ? 'มาตรการนี้เป็นตอบโต้การอุดหนุน — กรอกส่วนที่ 1–3 ส่วนที่ 7 และส่วนที่ 8'
            : 'มาตรการนี้เป็นตอบโต้การทุ่มตลาด — กรอกส่วนที่ 1–6 และส่วนที่ 8',
          'เริ่มจากหนังสือมอบอำนาจ — ขอบเขตและอำนาจในเอกสารจะกำหนดรูปแบบการยื่น ผนวก ก./ข./ค. และการกระทำที่ทำได้',
          'ข้อมูลติดต่อและผู้มีอำนาจลงนามต้องกรอกให้ครบเพื่อใช้ในคำรับรองท้ายแบบ',
        ],
      };
    }
    if (id === '1' && anchor === 'part-1-2') {
      return {
        title: '1.2 ความเกี่ยวข้องกับผู้นำเข้าหรือผู้ส่งออก',
        lead: 'บอกว่ารายผู้ผลิตสินค้าชนิดเดียวกันมีความเกี่ยวข้องกับผู้นำเข้าหรือผู้ส่งออกหรือไม่',
        tips: ['ถ้ามี ให้ระบุชื่อ ที่อยู่ ช่องทางติดต่อ ความเกี่ยวข้อง และปริมาณนำเข้า', 'ถ้าไม่มี ให้พิมพ์ว่า “ไม่มี”'],
      };
    }
    if (id === '1' && anchor === 'part-1-3') {
      return {
        title: '1.3 คำขอมาตรการช่วยเหลือ',
        lead: 'ในช่วง 1 ปีก่อนหน้า เคยขอให้รัฐบาลช่วยเหลือการผลิตหรือไม่ เช่น ภาษี โควตา หรือค่าธรรมเนียมพิเศษ',
        tips: ['ถ้ามี ระบุวันที่ยื่น หน่วยงาน มาตรการที่ขอ ผลที่ได้รับ และสถานะล่าสุด', 'ถ้าไม่มี ให้พิมพ์ว่า “ไม่มี”'],
      };
    }
    if (id === '2') {
      return {
        title: 'ส่วนที่ 2 รายละเอียดของสินค้า',
        lead: 'กรอกตารางเปรียบเทียบ 2.1.1–2.1.10 ในแบบ และแนบสิ่งที่ส่งมาด้วยที่อ้างอิงในแต่ละช่อง (พิกัด มาตรฐาน กระบวนการผลิต ฯลฯ)',
        tips: [
          'กรอกข้อความสั้นในตารางให้ครบทั้งสองคอลัมน์',
          'รายการยาว เช่น พิกัดศุลกากรเต็ม ให้สรุปในตารางแล้วแนบไฟล์สิ่งที่ส่งมาด้วย',
          'ช่องที่แบบระบุ “โปรดดูสิ่งที่ส่งมาด้วย …” ต้องมีไฟล์แนบคู่กัน',
        ],
      };
    }
    if (id === '3') {
      return {
        title: 'ส่วนที่ 3 ผู้ผลิต ผู้ส่งออก ผู้นำเข้า และผู้ใช้',
        lead: 'ใส่รายชื่อและช่องทางติดต่อล่าสุดของคู่ค้าที่เกี่ยวข้องกับสินค้าที่ถูกพิจารณา',
        tips: ['กรอกชื่อ ที่อยู่ โทรศัพท์ โทรสาร เว็บไซต์ และอีเมล', 'ถ้าไม่มีรายการนั้น ให้พิมพ์ว่า “ไม่มี”'],
      };
    }
    if (id === '4') {
      return {
        title: 'ส่วนที่ 4 มูลค่าปกติ',
        lead: 'หาว่าราคาปกติของสินค้าชนิดเดียวกันในประเทศผู้ส่งออกคือเท่าใด เพื่อเทียบกับราคาส่งเข้าไทย',
        tips: [
          'ประเทศที่ใช้กลไกตลาด: กรอก 4.1–4.3 (และ 4.4 ถ้าตลาดมีลักษณะเฉพาะ)',
          'ประเทศที่ไม่ใช้กลไกตลาด: กรอกเฉพาะ 4.5',
          'ใช้สกุลเงินเดียวกันทั้งส่วนที่ 4–6 และระบุอัตราแลกเปลี่ยน',
        ],
      };
    }
    if (id === '5' && anchor === 'part-5-2') {
      return {
        title: '5.2 ราคาส่งออกที่คำนวณขึ้น',
        lead: 'ใช้เมื่อหาราคาตาม 5.1 ไม่ได้ หรือผู้ส่งออกกับผู้นำเข้าเกี่ยวข้องกันจนราคาไม่น่าเชื่อถือ',
        tips: ['คำนวณกลับไปหาราคาหน้าโรงงาน โดยหักภาษี กำไร ค่านายหน้า ค่าขนส่ง และค่าใช้จ่ายอื่น', 'แนบหลักฐานการคำนวณ'],
      };
    }
    if (id === '5') {
      return {
        title: '5.1 ราคาส่งออก',
        lead: 'ใส่ราคาส่งออกที่ขายให้ผู้ซื้ออิสระทอดแรกในไทย แล้วหักกลับไปหาราคาหน้าโรงงาน',
        tips: ['แยกราคาตามขนาด แบบ หรือรุ่น', 'แนบหลักฐาน เช่น สถิตินำเข้า ค่าขนส่ง ค่าประกัน'],
      };
    }
    if (id === '6') {
      return {
        title: 'ส่วนที่ 6 ส่วนเหลื่อมการทุ่มตลาด',
        lead: 'เทียบมูลค่าปกติกับราคาส่งออกที่ระดับการค้าเดียวกัน (ปกติที่หน้าโรงงาน) แยกเป็นรายประเทศ',
        tips: [
          'ส่วนเหลื่อม = มูลค่าปกติ − ราคาส่งออก',
          'อัตราการทุ่มตลาด = (ส่วนเหลื่อม ÷ ราคา CIF) × 100',
          'ถ้าไม่ได้อยู่ระดับการค้าเดียวกัน ให้ปรับเงื่อนไขที่ต่างกันก่อนเทียบ',
        ],
      };
    }
    if (id.startsWith('7')) {
      return {
        title: 'ส่วนที่ 7 การอุดหนุน',
        lead: 'อธิบายโครงการอุดหนุนของรัฐบาลประเทศผู้ส่งออกที่ทำให้สินค้านำเข้าได้เปรียบ',
        tips: [
          '7.1 แนบกฎหมายหรือประกาศโครงการ',
          '7.2 อธิบายประโยชน์ที่ได้รับแยกโครงการ',
          '7.3 บอกว่าเจาะจงรายใด พื้นที่ใด หรือมีเงื่อนไขอย่างไร',
          '7.4 คำนวณมูลค่าประโยชน์ที่ผู้ส่งออกได้รับ',
        ],
      };
    }
    if (id.startsWith('8')) {
      return {
        title: 'ส่วนที่ 8 ความเสียหายของอุตสาหกรรมภายใน',
        lead: 'แสดงหลักฐานว่าอุตสาหกรรมในประเทศเสียหาย หรืออาจเสียหาย หรือตั้งตัวได้ยาก เพราะสินค้านำเข้า',
        tips: [
          'เสียหายที่เกิดแล้ว: กรอก 8.1–8.6',
          'เสียหายที่อาจเกิด: กรอก 8.1–8.7',
          'อุปสรรคต่อการก่อตั้ง/พัฒนา: กรอก 8.8',
          'ใช้ข้อมูลปัจจุบันและย้อนหลัง 3 ปี หน่วยเงินเป็นบาท',
        ],
      };
    }
    if (id === '9' && anchor === 'part-9-letter') {
      return {
        title: 'หนังสือนำส่ง',
        lead: 'กรอกหนังสือนำส่งในระบบ แนบรูปลายเซ็นและตราประทับ แล้วบันทึกหรือดาวน์โหลดแบบราชการ',
        tips: [
          `มาตรการ${this.measureName} — ระบุแบบ ปร.1 และเอกสารประกอบในรายละเอียดหนังสือ`,
          'แนบรูปลายเซ็นผู้มีอำนาจลงนาม',
          'กดบันทึกเมื่อกรอกครบ เพื่อให้ออกเอกสารในระบบ',
        ],
      };
    }
    if (id === '9') {
      return {
        title: 'คำรับรองและลงนาม',
        lead: 'ข้อความท้ายแบบ ปร.1 ตามแบบราชการ ใช้ได้ทั้งทุ่มตลาดและอุดหนุน กรอกและลงนามในระบบ',
        tips: [
          'อ่านคำรับรองให้ครบก่อนติ๊กยืนยัน',
          'กรอกชื่อ ตำแหน่ง วันที่ ให้ตรงผู้มีอำนาจ',
          'แนบรูปลายเซ็นผู้มีอำนาจลงนาม',
        ],
      };
    }
    if (id.startsWith('annex') || id === 'other') {
      return {
        title: 'เอกสารผนวก',
        lead: 'แนบรายชื่อผู้ผลิตและหนังสือมอบอำนาจตามท้ายแบบ ปร.1',
        tips: ['ผนวก ก. = แทนผู้ผลิตทั้งหมด', 'ผนวก ข. = แทนผู้ผลิตบางส่วน', 'ผนวก ค. = หนังสือมอบอำนาจ พร้อมอากรแสตมป์และสำเนาเอกสาร'],
      };
    }
    return { title: 'แนะนำการกรอก', lead: 'กรอกข้อมูลตามแบบ ปร.1 ในระบบแทนการยื่นกระดาษ', tips: [] };
  }

  protected addMarginCountry(): void {
    this.marginCountries = [...this.marginCountries, { name: '', normal: '', exportPrice: '', margin: '', cif: '', rate: '' }];
  }

  protected removeMarginCountry(index: number): void {
    this.marginCountries = this.marginCountries.filter((_, i) => i !== index);
  }

  private pickedMeasure(): 'ad' | 'cvd' | '' {
    const query = this.router.parseUrl(this.router.url).queryParams['measure'];
    if (query === 'cvd') return 'cvd';
    if (query === 'ad') return 'ad';
    const intent = readFilingIntent()?.measure;
    if (intent === 'มาตรการ CVD') return 'cvd';
    if (intent === 'มาตรการ AD') return 'ad';
    return '';
  }
  protected filing: 'self' | 'all' | 'part' = 'part';
  /** หนังสือมอบอำนาจเป็นหลัก — รูปแบบการยื่น/ผนวก/การกระทำตามเอกสารนี้ */
  protected poaAttached = true;
  protected poaKind: 'person' | 'juristic' | 'sub' = 'person';
  protected readonly poaKindOptions = [
    { key: 'person' as const, label: 'มอบให้บุคคลธรรมดา', hint: 'เช่น ทนายความหรือผู้แทนบุคคล' },
    { key: 'juristic' as const, label: 'มอบให้นิติบุคคล', hint: 'บริษัทหรือสำนักงานกฎหมาย' },
    { key: 'sub' as const, label: 'มอบอำนาจช่วง', hint: 'ผู้รับมอบมอบต่อให้ผู้อื่นอีกทอด' },
  ];
  protected readonly poaPowerOptions = [
    { key: 'file' as const, label: 'ยื่นคำขอและเอกสารประกอบคำขอ' },
    { key: 'edit' as const, label: 'เปลี่ยนแปลง/แก้ไขข้อความหรือเอกสารตามคำขอ' },
    { key: 'contact' as const, label: 'ให้ข้อมูลเพิ่มเติมและติดต่อประสานงานกับเจ้าหน้าที่' },
    { key: 'full' as const, label: 'ดำเนินการใด ๆ แทนผู้มอบอำนาจตลอดกระบวนการ' },
  ];
  /** ตัวอย่างจากเคสจริง AD1046 — ดาวน์โหลด/ใช้แนบในระบบได้ทันที */
  protected readonly poaSamples: {
    kind: 'person' | 'juristic' | 'sub';
    label: string;
    name: string;
    href: string;
    caseId: string;
  }[] = [
    { kind: 'person', label: 'SSI มอบบุคคลธรรมดา', name: 'SSI มอบบุคคลธรรมดา.pdf', href: 'assets/samples/poa/SSI มอบบุคคลธรรมดา.pdf', caseId: 'AD1046' },
    { kind: 'person', label: 'G Steel มอบบุคคลธรรมดา', name: 'G steel มอบบุคคลธรรมดา.pdf', href: 'assets/samples/poa/G steel มอบบุคคลธรรมดา.pdf', caseId: 'AD1046' },
    { kind: 'person', label: 'GJ มอบบุคคลธรรมดา', name: 'GJ มอบบุคคลธรรมดา.pdf', href: 'assets/samples/poa/GJ มอบบุคคลธรรมดา.pdf', caseId: 'AD1046' },
    { kind: 'person', label: 'SPM มอบบุคคลธรรมดา', name: 'SPM มอบบุคลลธรรมดา.pdf', href: 'assets/samples/poa/SPM มอบบุคลลธรรมดา.pdf', caseId: 'AD1046' },
    { kind: 'juristic', label: 'G Steel มอบนิติบุคคล', name: 'G steel มอบนิติบุคคล.pdf', href: 'assets/samples/poa/G steel มอบนิติบุคคล.pdf', caseId: 'AD1046' },
    { kind: 'juristic', label: 'GJ มอบนิติบุคคล', name: 'GJ มอบนิติบุคคล.pdf', href: 'assets/samples/poa/GJ มอบนิติบุคคล.pdf', caseId: 'AD1046' },
    { kind: 'juristic', label: 'SPM มอบนิติบุคคล', name: 'SPM มอบนิติบุคคล.pdf', href: 'assets/samples/poa/SPM มอบนิติบุคคล.pdf', caseId: 'AD1046' },
    { kind: 'sub', label: 'G Steel มอบอำนาจช่วง', name: 'G Steel มอบอำนาจช่วง.pdf', href: 'assets/samples/poa/G Steel มอบอำนาจช่วง.pdf', caseId: 'AD1046' },
  ];
  protected poaPowers: Record<'file' | 'edit' | 'contact' | 'full', boolean> = {
    file: true,
    edit: true,
    contact: true,
    full: false,
  };
  /** solo = คนหลักกรอกครบเอง · invite = เชิญผู้ผลิตร่วมกรอกส่วนของตน */
  protected cofilerMode: 'solo' | 'invite' = 'invite';
  protected formDeskTab: 'form' | 'invite' = 'form';
  protected cofilerView = readCofilerView();
  protected cofilerInviteName = '';
  protected cofilerInviteEmail = '';
  protected cofilerInviteOrg = '';
  protected cofilerCopied = '';
  protected cofilerPrivateDraft: CofilerPrivate = {
    inviteId: '',
    address: '',
    phone: '',
    fax: '',
    volumeNote: '',
    docs: [],
  };
  protected nationality = 'ไทย';
  protected readonly nationalities = ['ไทย'];
  protected readonly countries = ['เวียดนาม', 'อียิปต์'];
  protected company = 'บมจ. สหวิริยาสตีลอินดัสตรี';
  protected address = '28/1 อาคารประภาวิทย์ ชั้น 2-3 ถนนสุรศักดิ์ แขวงสีลม เขตบางรัก กรุงเทพฯ 10500';
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
  protected goodsDetail =
    'เหล็กแผ่นรีดร้อนชนิดเป็นม้วนและไม่เป็นม้วน (Flat Hot Rolled Steel in Coils and not in Coils) ความหนา 0.9–100.0 มม. ความกว้าง 100–3,200 มม. พิกัดอัตราศุลกากร พ.ศ. 2555 และ พ.ศ. 2560 กลุ่ม 7208 / 7211 / 7225 / 7226 อัตราอากรขาเข้า ร้อยละ 0–5% แหล่งกำเนิดและผู้ส่งออกคือสาธารณรัฐสังคมนิยมเวียดนามและสาธารณรัฐอาหรับอียิปต์ สินค้าชนิดเดียวกันที่ผลิตในประเทศมีลักษณะเหมือนกับสินค้าที่ถูกพิจารณา';
  protected channelDetail =
    'จำหน่ายโดยตรงแก่ผู้ใช้และศูนย์บริการเหล็ก (Service Center) และจำหน่ายผ่าน Trading Company ผู้ใช้ขั้นสุดท้ายอยู่ในอุตสาหกรรมผลิตท่อเหล็ก ตู้คอนเทนเนอร์ ถังแก๊ส ก่อสร้าง เฟอร์นิเจอร์ และต่อเรือ';
  /** ส่วนที่ 2 จากต้นแบบ Sub1 (ปร.1 AD เวียดนาม–อียิปต์) — กรอกตารางครบ + แนบสิ่งที่ส่งมาด้วย */
  protected goodsCompare: GoodsCompareRow[] = [
    {
      item: '2.1.1 ชื่อสินค้า — ชื่อทางการค้า',
      subject: 'เหล็กแผ่นรีดร้อนชนิดเป็นม้วนและไม่เป็นม้วน (Flat Hot Rolled Steel in Coils and not in Coils)',
      like: 'เหมือนกับสินค้าที่ถูกพิจารณา',
    },
    {
      item: '2.1.1 ชื่อสินค้า — ชื่อทางวิทยาศาสตร์',
      subject: '—',
      like: 'เหมือนกับสินค้าที่ถูกพิจารณา',
    },
    {
      item: '2.1.1 ชื่อสินค้า — พิกัดอัตราศุลกากร',
      subject:
        'พิกัดอัตราศุลกากร พ.ศ. 2555\n72081000020,72081000030,72081000040,72081000090\n72083600011,72083600012,72083600013,72083600021\n72083600022,72083600023,72083600031,72083600032\n72083600033,72083600041,72083600042,72083600043\n72083600090,72083700041,72083700042,72083700043\n72083700051,72083700052,72083700053,72083700071\n72083700072,72083700073,72083700090,72083800041\n72083800042,72083800043,72083800051,72083800052\n72083800053,72083800071,72083800072,72083800073\n72083800090,72083900041,72083900042,72083900043\n72083900051,72083900052,72083900053,72083900071\n72083900072,72083900073,72083900081,72083900082\n72083900083,72083900090,72084000020,72084000030\n72084000040,72084000090,72085100011,72085100012\n72085100013,72085100021,72085100022,72085100023\n72085100031,72085100032,72085100033,72085100041\n72085100042,72085100043,72085100051,72085100052\n72085100053,72085100090,72085200011,72085200012\n72085200013,72085200021,72085200022,72085200023\n72085200031,72085200032,72085200033,72085200090\n72085300011,72085300012,72085300013,72085300021\n72085300022,72085300023,72085300090,72085400011\n72085400012,72085400013,72085400021,72085400022\n72085400023,72085400041,72085400042,72085400043\n72085400051,72085400052,72085400053,72085400090\n72089000090,72111310000,72111390000,72111411020\n72111411030,72111411090,72111419020,72111419030\n72111419090,72111421020,72111421030,72111421090\n72111429020,72111429030,72111429090,72111911020\n72111911030,72111911090,72111919000,72111921020\n72111921030,72111921090,72111929000,72253090011\n72253090012,72253090013,72253090014,72253090021\n72253090022,72253090023,72253090024,72254090011\n72254090012,72254090013,72254090014,72254090021\n72254090022,72254090023,72254090024,72269110011\n72269110012,72269110013,72269110014,72269110021\n72269110022,72269110023,72269110024,72269190011\n72269190012,72269190013,72269190014,72269190021\n72269190022,72269190023,72269190024\n\nพิกัดอัตราศุลกากร พ.ศ. 2560\n72081000020,72081000030,72081000040,72081000090\n72083600011,72083600012,72083600013,72083600021\n72083600022,72083600023,72083600031,72083600032\n72083600033,72083600041,72083600042,72083600043\n72083600090,72083700041,72083700042,72083700043\n72083700051,72083700052,72083700053,72083700071\n72083700072,72083700073,72083700090,72083800041\n72083800042,72083800043,72083800051,72083800052\n72083800053,72083800071,72083800072,72083800073\n72083800090,72083990041,72083990042,72083990043\n72083990051,72083990052,72083990053,72083990071\n72083990072,72083990073,72083990081,72083990082\n72083990083,72083990090,72084000020,72084000030\n72084000040,72084000090,72085100011,72085100012\n72085100013,72085100021,72085100022,72085100023\n72085100031,72085100032,72085100033,72085100041\n72085100042,72085100043,72085100051,72085100052\n72085100053,72085100090,72085200011,72085200012\n72085200013,72085200021,72085200022,72085200023\n72085200031,72085200032,72085200033,72085200090\n72085300011,72085300012,72085300013,72085300021\n72085300022,72085300023,72085300090,72085490011\n72085490012,72085490013,72085490021,72085490022\n72085490023,72085490041,72085490042,72085490043\n72085490051,72085490052,72085490053,72085490090\n72089090090,72111311000,72111319000,72111413020\n72111413030,72111413090,72111419020,72111419030\n72111419090,72111913020,72111913030,72111913090\n72111919020,72111919030,72111919090,72253090031\n72253090032,72253090041,72253090042,72254090021\n72254090022,72254090023,72254090024,72254090031\n72254090032,72254090041,72254090042,72269110031\n72269110032,72269110041,72269110042,72269190031\n72269190032,72269190041,72269190042\n\n(โปรดดูสิ่งที่ส่งมาด้วย 1)',
      like: 'เหมือนกับสินค้าที่ถูกพิจารณา\n(โปรดดูสิ่งที่ส่งมาด้วย 1)',
    },
    {
      item: '2.1.1 ชื่อสินค้า — อัตราอากรขาเข้า',
      subject: 'ร้อยละ 0–5%\n(โปรดดูสิ่งที่ส่งมาด้วย 2.1–2.3)',
      like: 'เหมือนกับสินค้าที่ถูกพิจารณา\n(โปรดดูสิ่งที่ส่งมาด้วย 2.1–2.3)',
    },
    {
      item: '2.1.2 ลักษณะทางกายภาพ ลักษณะทางเคมีและโครงสร้างของสินค้า',
      subject: 'เหล็กแผ่นรีดร้อน ชนิดเป็นม้วนและไม่เป็นม้วน ความหนา 0.9–100.0 มม. และความกว้าง 100–3,200 มม.',
      like: 'เหมือนกับสินค้าที่ถูกพิจารณา\n(โปรดดูสิ่งที่ส่งมาด้วย 3)',
    },
    {
      item: '2.1.3 มาตรฐานทางอุตสาหกรรม',
      subject: '(โปรดดูสิ่งที่ส่งมาด้วย 4)',
      like: '(โปรดดูสิ่งที่ส่งมาด้วย 4)',
    },
    {
      item: '2.1.4 ขั้นตอนและกระบวนการผลิต',
      subject:
        'ผู้ผลิตส่วนใหญ่ใช้ขบวนการถลุงและหล่อเหล็กจนได้เหล็กแท่งแบนนำมาผลิตเป็นเหล็กแผ่นรีดร้อนต่อไป ผู้ผลิตบางรายใช้กระบวนการผลิตด้วยเตาอาร์คไฟฟ้า และผ่านเครื่องรีดเป็นเหล็กแผ่นรีดร้อนต่อไป',
      like: 'เหมือนกับสินค้าที่ถูกพิจารณา\n(โปรดดูสิ่งที่ส่งมาด้วย 5)',
    },
    {
      item: '2.1.5 ช่องทางการจัดจำหน่าย',
      subject: 'จำหน่ายโดยตรงแก่ผู้ใช้และศูนย์บริการเหล็ก (Service Center) และจำหน่ายผ่าน Trading Company',
      like: 'เหมือนกับสินค้าที่ถูกพิจารณา',
    },
    {
      item: '2.1.6 ผู้ใช้สินค้าขั้นสุดท้าย',
      subject: 'อุตสาหกรรมผลิตท่อเหล็ก ตู้คอนเทนเนอร์ ถังแก๊ส ก่อสร้าง เฟอร์นิเจอร์ ต่อเรือ',
      like: 'เหมือนกับสินค้าที่ถูกพิจารณา\n(โปรดดูสิ่งที่ส่งมาด้วย 5)',
    },
    {
      item: '2.1.7 มาตรการในการนำเข้าประเทศไทยซึ่งมิใช่มาตรการทางภาษี',
      subject: '—',
      like: '—',
    },
    {
      item: '2.1.8 ประเทศแหล่งกำเนิด',
      subject: 'สาธารณรัฐสังคมนิยมเวียดนาม, สาธารณรัฐอาหรับอียิปต์',
      like: '—',
    },
    {
      item: '2.1.9 ประเทศผู้ส่งออก',
      subject: 'สาธารณรัฐสังคมนิยมเวียดนาม, สาธารณรัฐอาหรับอียิปต์',
      like: '—',
    },
    {
      item: '2.1.10 ข้อเปรียบเทียบอื่น ๆ — ในส่วนที่เหมือนกัน / ในส่วนที่แตกต่างกัน',
      subject: 'ไม่มี',
      like: '—',
    },
  ];
  protected goods: GoodsRow[] = [{ producer: '', goods: '', made: '', sold: '', unit: '' }];
  protected makers: MakerRow[] = [
    party('บมจ. จี สตีล', '88 ปาโซ่ ทาวเวอร์ ชั้น 18 ถนนสีลม แขวงสุริยวงศ์ เขตบางรัก กรุงเทพฯ 10500', '(02) 634-2222', '(02) 634-4114'),
    party('บมจ. จี เจ สตีล', '88 ปาโซ่ ทาวเวอร์ ชั้น 24 ถนนสีลม แขวงสุริยวงศ์ เขตบางรัก กรุงเทพฯ 10500', '(02) 267-8222', '(02) 267-9048'),
    party('บมจ. สหวิริยาเพลทมิลล์', '28/1 อาคารประภาวิทย์ ชั้น 4 ถนนสุรศักดิ์ แขวงสีลม เขตบางรัก กรุงเทพฯ 10500', '(02) 630-0257-61', '(02) 630-0267'),
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
        party('สมาคมเหล็กแผ่นรีดร้อนไทย', '28/1 อาคารประภาวิทย์ ชั้น 3 ถนนสุรศักดิ์ แขวงสีลม เขตบางรัก กรุงเทพฯ 10500', '02-238-3063', '02-236-8892'),
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
  protected filedOn = firstFiledOn;
  /** วันที่ยื่นแบบทางการ — จุดเริ่มนับกำหนด 4 เดือน */
  protected officialOn = readOfficialOn() || firstFiledOn;
  protected amendUntil = addThaiMonths(this.officialOn, 4);
  protected docKey = 'power';
  protected readonly supportDocs: { key: string; label: string; accept: string; hint: string; behalf: boolean }[] = [
    { key: 'power', label: 'หนังสือมอบอำนาจ', accept: '.png,.jpg,.jpeg,.pdf,.doc,.docx', hint: 'ผนวก ค. · png, jpg, jpeg, pdf, doc, docx', behalf: true },
    { key: 'cert', label: 'หนังสือรับรองบริษัท', accept: '.png,.jpg,.jpeg,.pdf', hint: 'เฉพาะนามสกุล png, jpg, jpeg, pdf', behalf: false },
    { key: 'finance', label: 'งบการเงินที่ผู้สอบบัญชีรับอนุญาตรับรอง', accept: '.png,.jpg,.jpeg,.pdf,.doc,.docx', hint: 'เฉพาะนามสกุล png, jpg, jpeg, pdf, doc, docx', behalf: false },
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
  protected factoryNote = 'อ้างอิงราคาจาก http://www.metalexpert.com เดือนเมษายน 2562 อัตราแลกเปลี่ยน ธปท. 31.8596 บาท/ดอลลาร์สหรัฐ (สิ่งที่ส่งมาด้วย 7, 8, 10)\nเวียดนาม: ราคา CFR 566 ดอลลาร์/ตัน = 17,714 บาท/ตัน หักค่าขนส่งทางเรือในประเทศ 200 บาท/ตัน (บางสะพาน–กรุงเทพฯ) ได้มูลค่าปกติหน้าโรงงาน 17,514 บาท/ตัน\nอียิปต์: ราคาหน้าโรงงาน (ex-work) 601 ดอลลาร์/ตัน = 19,418 บาท/ตัน';
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
    { name: 'สิ่งที่ส่งมาด้วย 1 พิกัดอัตราศุลกากรสินค้าที่ถูกพิจารณา.pdf', saved: '15/05/2563' },
    { name: 'สิ่งที่ส่งมาด้วย 2.1 พระราชกำหนดพิกัดอัตราศุลกากร.pdf', saved: '15/05/2563' },
    { name: 'สิ่งที่ส่งมาด้วย 2.2 ประกาศลดอัตราอากร ม.12.pdf', saved: '15/05/2563' },
    { name: 'สิ่งที่ส่งมาด้วย 2.3 ประกาศลดอัตราอากร ASEAN FTA.pdf', saved: '15/05/2563' },
    { name: 'สิ่งที่ส่งมาด้วย 3 แค็ตตาล็อกและลักษณะสินค้า.pdf', saved: '15/05/2563' },
    { name: 'สิ่งที่ส่งมาด้วย 4 มาตรฐานและชั้นคุณภาพ.pdf', saved: '15/05/2563' },
    { name: 'สิ่งที่ส่งมาด้วย 5 กระบวนการผลิต rev.01.pdf', saved: '15/05/2563' },
    { name: 'แผนภาพกระบวนการผลิต.pdf', saved: '15/05/2563' },
  ];
  protected exportDetail = 'ใช้ราคานำเข้า C.I.F. จากสถิติกรมศุลกากรตามพิกัดข้อ 2.1.1 เดือนเมษายน 2562 (สิ่งที่ส่งมาด้วย 9)\nเวียดนาม: ปริมาณ 5,061 ตัน มูลค่า 87,246,040 บาท → CIF 17,238 บาท/ตัน หักประกันภัย 0.015% (≈3 บาท) และค่าระวาง 15 ดอลลาร์ (=477 บาท ไม่มีค่าขนส่งในประเทศเพราะ FHS ริมทะเล) ได้ราคาส่งออกหน้าโรงงาน 16,761 บาท/ตัน\nอียิปต์: ปริมาณ 118 ตัน มูลค่า 2,239,666 บาท → CIF 19,026 บาท/ตัน หักประกัน ≈3 บาท ค่าระวาง 40 ดอลลาร์ (=1,274 บาท) และค่าขนส่งในประเทศ 400 บาท ได้หน้าโรงงาน 17,349 บาท/ตัน';
  protected exportConstructed = 'ไม่มี';
  protected marginUnit = 'บาท/ตัน';
  protected marginCountries: MarginCountry[] = [
    { name: 'เวียดนาม', normal: '17,514', exportPrice: '16,761', margin: '753', cif: '17,238', rate: '4.36' },
    { name: 'อียิปต์', normal: '19,418', exportPrice: '17,349', margin: '2,069', cif: '19,026', rate: '10.87' },
  ];
  protected subsidySpecific = '';
  protected subsidyBenefit = '';
  protected exportDocs: DocFile[] = [
    { name: 'สิ่งที่ส่งมาด้วย 9 สถิตินำเข้าเดือนเมษายน 2562.pdf', saved: '15/05/2563' },
    { name: 'สิ่งที่ส่งมาด้วย 9 สถิตินำเข้าเดือนเมษายน 2562 เวียดนาม.pdf', saved: '15/05/2563' },
    { name: 'สิ่งที่ส่งมาด้วย 9 สถิตินำเข้าเดือนเมษายน 2562 อียิปต์.pdf', saved: '15/05/2563' },
    { name: 'สิ่งที่ส่งมาด้วย 11 ค่าขนส่งทางเรือระหว่างประเทศ.pdf', saved: '15/05/2563' },
    { name: 'สิ่งที่ส่งมาด้วย 12 ค่าขนส่งในประเทศ บางสะพาน-กรุงเทพฯ.pdf', saved: '15/05/2563' },
    { name: 'สิ่งที่ส่งมาด้วย 13 ค่าประกันภัยการเดินเรือ.pdf', saved: '15/05/2563' },
  ];
  protected marginDocs: DocFile[] = [{ name: 'สิ่งที่ส่งมาด้วย 10 อัตราแลกเปลี่ยนรายเดือน 2562.pdf', saved: '15/05/2563' }];
  protected subsidyDocs: DocFile[] = [];
  protected explainDetail = 'ไม่มีข้อมูลการอุดหนุน เคสนี้ขอให้ไต่สวนการทุ่มตลาด';
  protected explainDocs: DocFile[] = [];
  protected docView: 'letter' | 'pledge' | null = null;
  protected docViewFull = false;
  protected issuedDocs: { kind: 'letter' | 'pledge'; title: string; code: string; at: string }[] = [];
  protected signatureName = 'ลายเซ็น-ประกิต.png';
  /** ลายเซ็นจำลองผู้ลงนามต้นแบบ AD1046 */
  protected signatureUrl = 'assets/samples/ad1046/por1-sign-prakit.jpg';
  protected letterNo = '01/492-019/2563';
  protected letterDate = '15/05/2563';
  protected letterSubject =
    'ขอให้พิจารณาดำเนินการใช้มาตรการตอบโต้การทุ่มตลาดสินค้าเหล็กกล้าทรงแบนรีดร้อน ชนิดเป็นม้วนและไม่เป็นม้วน ที่มีแหล่งกำเนิดจากสาธารณรัฐสังคมนิยมเวียดนามและสาธารณรัฐอาหรับอียิปต์';
  protected letterTo = 'อธิบดีกรมการค้าต่างประเทศ';
  protected letterRef = '';
  protected letterBody =
    'บริษัท สหวิริยาสตีลอินดัสตรี จำกัด (มหาชน) ในฐานะผู้ผลิตภายในประเทศ และผู้ยื่นคำขอแทนผู้ผลิตบางส่วนในอุตสาหกรรม สินค้าเหล็กแผ่นรีดร้อน ชนิดเป็นม้วนและไม่เป็นม้วน จึงขอนำส่งแบบคำขอพร้อมเอกสารประกอบต่อกรมการค้าต่างประเทศไว้เป็นหลักฐานในการพิจารณา\n\nสิ่งที่ส่งมาด้วย\n1. แบบคำขอให้ดำเนินการพิจารณาตอบโต้การทุ่มตลาดหรือการอุดหนุน\n2. CD บันทึกข้อมูล 1 แผ่น';
  protected letterPurpose = 'ขอให้พิจารณาใช้มาตรการตอบโต้การทุ่มตลาดสินค้าเหล็กแผ่นรีดร้อนจากเวียดนามและอียิปต์';
  protected sealName = '';
  protected sealUrl = '';
  /** ชื่อไฟล์หนังสือนำส่งตามเคสจริง AD1046 */
  protected letterFileName = 'หนังสือนำส่ง.pdf';
  protected pledgeSignedName = '';
  /** ข้อความท้ายแบบ ปร.1 ตามแบบราชการ (ใช้ได้ทั้ง AD และ CVD) */
  protected readonly pledgeDefault =
    'ข้าพเจ้าขอรับรองว่า ข้อความข้างต้นนี้ตลอดจนข้อความในเอกสารภาคผนวกที่แนบและเอกสารหลักฐานที่นำมาประกอบคำขอฉบับนี้เป็นความจริงและถูกต้องทุกประการ และหากข้อมูลและเอกสารหลักฐานที่ปรากฏในคำขอฉบับนี้เป็นข้อมูลเท็จ ข้าพเจ้าขอรับผิดตามกฎหมายแต่เพียงผู้เดียวและขอรับรองว่าข้าพเจ้าได้รับมอบหมายให้ดำเนินการแทนผู้ร้องเรียนรายอื่นดังกล่าวในฐานะผู้ยื่นคำขอ';
  protected pledgeText = this.pledgeDefault;
  protected pledgeSource: 'default' | 'draft' = 'default';
  protected otherDocs: DocFile[] = [
    { name: 'เอกสารผนวก ข. ส่วนที่ 1 ผู้ผลิตที่กระทำการแทน.pdf', saved: '15/05/2563' },
    { name: 'เอกสารผนวก ข. ส่วนที่ 2 ผู้ผลิตที่มิได้ขอให้กระทำการแทน.pdf', saved: '15/05/2563' },
    { name: 'สิ่งที่ส่งมาด้วย 6 รายชื่อผู้นำเข้า.pdf', saved: '15/05/2563' },
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
    import: [{ name: 'AD VN-EG_Table 8.1, 8.2, 8.7-ALL rev.01_15.05.20.xlsx', saved: '15/05/2563' }],
    factor: [
      { name: 'AD VN-EG_Table 8.4-ALL_rev.01_15.05.20.xlsx', saved: '15/05/2563' },
      { name: 'สิ่งที่ส่งมาด้วย 14 SEAISI Pro.-Cap..pdf', saved: '15/05/2563' },
    ],
    summary: [{ name: 'AD VN-EG_Table 8.5-ALL_rev.01_15.05.20.xlsx', saved: '15/05/2563' }],
    trend: [{ name: 'AD VN-EG_Table 8.8-ALL rev.01_15.05.20.xlsx', saved: '15/05/2563' }],
    intent: [{ name: 'AD VN-EG_Table 8.6-ALL_rev.01_15.05.20.xlsx', saved: '15/05/2563' }],
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
    summaryDetail: 'ผลจากการทุ่มตลาดก่อให้เกิดความเสียหายแก่อุตสาหกรรมภายในดังนี้ (1) การผลิตและอัตราการใช้กำลังการผลิตต่ำกว่าร้อยละ 50 ทำให้ไม่เกิดการประหยัดต่อขนาด (2) ปริมาณจำหน่ายลดลง ถูกตัดราคา กดราคา และชะลอการขึ้นราคา ต้องขายต่ำกว่าต้นทุน (3) ต้องหยุดผลิตเป็นระยะ ลดแรงงานและชั่วโมงการผลิต (4) หากไม่ดำเนินมาตรการ อุตสาหกรรมภายในอาจหยุดกิจการ',
    buyerDetail: 'ไม่มีข้อมูลรายชื่อผู้ซื้อที่สูญเสียยอดขาย และไม่มีหลักฐานการลดราคาเพื่อรักษาตลาด',
    trendCapacity: 'กำลังการผลิตต่างประเทศยังพร้อมส่งออกหากความต้องการในไทยฟื้น',
    trendPrice: 'สินค้านำเข้ากดราคาและทำให้ขึ้นราคาตามต้นทุนไม่ได้',
    trendSubsidy: 'ไม่มี เคสนี้ขอให้ไต่สวนการทุ่มตลาด',
    trendOther: 'หากไม่ดำเนินมาตรการ อุตสาหกรรมภายในอาจถึงขั้นหยุดกิจการ',
    intentDetail: 'ไม่มีข้อมูล',
  };
  protected submitOpen = false;
  protected verifyOpen = false;
  protected verifyBusy = false;
  protected verifyMessage = '';
  protected foreignDoc = '';
  protected foreignAck = false;
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
  protected consultLimitOpen = false;
  protected consultPanelOpen = false;
  protected consultPanelFull = false;
  protected consultPanelTab: 'talk' | 'private' | 'summary' = 'talk';
  protected consultRoundId = '';
  protected consultPrivateDraft = '';
  protected consultRounds: ConsultRound[] = readConsultRounds();
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
  protected consultSlots = defaultConsultSlots();
  protected consultChannel: 'phone' | 'online' | 'onsite' | '' = 'phone';
  protected consultContactName = 'นายประกิต กาญจนการไกร';
  protected consultContactPhone = '081-234-5678';
  protected consultNotes: ConsultNote[] = readConsultThread();
  protected consultAssigned = readConsultAssigned();
  private readonly consultJobKey = 'dft-por1-consult-jobs';
  private readonly needConsultKey = 'dft-por1-need-consult';
  protected needConsultAfterReject = sessionStorage.getItem('dft-por1-need-consult') === '1';
  protected consultClosed: { at: string } | null = this.readConsultClosed();
  protected consultJobs: ConsultGroupJob[] = this.readConsultJobs();
  protected eofficeDirector: EofficeDirectorHandoff = readEofficeDirectorHandoff();
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
  protected resultSigned = true;
  protected consultOrder = this.defaultConsultOrder();
  protected consultAssignedOn = this.thaiToday();
  protected consultDueOn = this.thaiShift(14);
  protected consultDueTime = '14:28';
  protected consultRemind = false;
  protected consultFiles: AssignFile[] = [];
  protected resultDetail = this.defaultResultDetail();
  protected applicantNoticeText = defaultApplicantNoticeText;
  protected printNotice = false;
  protected resultFiles: AssignFile[] = [];
  protected acceptNote = '';
  protected acceptNotes: string[] = [];
  protected acceptFiles: AssignFile[] = [];
  protected applicantNotices: ApplicantNotice[] = readApplicantNotices();
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
    { place: 'ส่วนที่ 1 ผนวก ข.', title: 'รายการปริมาณของ LPN ยังไม่ครบ', detail: 'กรณีกระทำการแทนผู้ผลิตบางส่วน ให้แนบรายการและปริมาณสินค้าที่ผลิต/จำหน่ายของ บมจ. แอล พี เอ็น เพลทมิล ในผนวก ข. ส่วนที่ 2', action: 'เพิ่มเอกสาร' },
    { place: 'ส่วนที่ 2 พิกัดศุลกากร', title: 'พิกัดศุลกากรต้องตรวจสอบ', detail: 'ตรวจพิกัด พ.ศ. 2555/2560 ตามสิ่งที่ส่งมาด้วย 1 และแก้รหัสที่ระบุในหนังสือแก้ไขครั้งที่ 1', action: 'ปรับข้อมูล' },
    { place: 'ส่วนที่ 3 ผู้ผลิตต่างประเทศ', title: 'ยังไม่ได้ระบุ Al Ezz Flat Steel (EFS)', detail: 'ให้เพิ่มผู้ผลิตอียิปต์ Al Ezz Flat Steel (EFS) ตามข้อ 1.6 ของหนังสือแก้ไขคำขอ ครั้งที่ 1', action: 'ปรับข้อมูล' },
  ];
  private readonly secondFindings: RoundFinding[] = [
    { place: 'ส่วนที่ 4 มูลค่าปกติ', title: 'ตรวจตาราง 4.1.2 ระดับราคา', detail: 'ให้ตรวจสอบว่าราคาในตาราง 4.1.2 เป็นราคาหน้าโรงงานหรือราคารวมค่าขนส่งทางเรือ', action: 'ปรับข้อมูล' },
    { place: 'ส่วนที่ 8 ตาราง 8.1–8.8', title: 'ตัวเลขตารางความเสียหายยังไม่สอดคล้อง', detail: 'ตรวจ utilization ปี 2562, %yield, ส่วนแบ่งตลาด และปริมาณขายโดยไม่รวมส่งออก ให้สอดคล้องตาราง 8.8', action: 'ปรับข้อมูล' },
    { place: 'ส่วนที่ 2 ข้อ 2.1.10', title: 'ยังไม่ระบุส่วนเหมือน/ต่าง', detail: 'ให้ระบุข้อเปรียบเทียบระหว่างสินค้าที่ถูกพิจารณาและสินค้าชนิดเดียวกันทั้งส่วนที่เหมือนกันและแตกต่างกัน', action: 'ปรับข้อมูล' },
  ];
  private readonly thirdFindings: RoundFinding[] = [
    { place: 'ส่วนที่ 8 ตาราง 8.3–8.8', title: 'ข้อมูลรายบริษัทยังต้องปรับ', detail: 'ตรวจตาราง 8.3–8.8 ของ SSI / G Steel / GJ Steel ให้สอดคล้องงบการเงินและกันเองตามหนังสือแก้ไข', action: 'ปรับข้อมูล' },
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
  /** ท่อ: ร่าง → รายงานหัวหน้ากอง → เห็นชอบ → e-Office → ลงนาม/ออกเลข → ส่งผู้ยื่น */
  protected noticePipe: NoticePipe = 'draft';
  protected noticePipeAt = '';
  /** เจ้าหน้าที่ผู้รายงานผลถึงหัวหน้ากลุ่ม */
  protected noticeReportBy = '';
  protected noticeHeadBy = '';
  protected noticeOfficeRef = '';
  /** สถานะเชื่อม e-Office ของรายการแจ้งผลที่เปิดอยู่ */
  protected noticeEofficeLink: ApprovalEofficeLinkState = 'idle';
  /** timeline การกระทำของรายการแจ้งผลการตรวจ */
  protected noticeHistory: NoticeHistoryEntry[] = [];
  protected noticeHistoryOpen = false;
  /** รายการแจ้งผลทั้งหมด — สร้างได้เรื่อยๆ ไม่ต้องรอรายการก่อนหน้า */
  protected noticeItems: NoticeItem[] = [];
  protected activeNoticeId = '';

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
  protected replyLetterSubject = 'ส่งคำขอที่แก้ไขเพิ่มเติม เลขที่อ้างอิง R6201';
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
  protected inquiryAgendaAt = '09/11/2563';
  protected inquirySubAgendaAt = '03/11/2563';
  protected inquiryDraftAgendaAt = '02/10/2563';
  protected inquiryAgenda = '';
  protected inquiryFields = agendaFieldList();
  protected readonly agendaSections = agendaSections;
  protected agendaPart = 0;
  protected inquiryAgendaFiles: InquiryAgendaFile[] = [];
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
  protected inquiryDraftAgendaDone = false;
  protected inquirySubAgendaDone = false;
  protected inquiryAgendaDone = false;
  protected inquiryReturned = false;
  protected inquirySentBy = '';
  protected inquiryPart: InquiryStep = 'draftAgenda';
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
  protected docFiles: NoticeFile[] = [{ name: 'หนังสือแจ้งขอข้อมูลเพิ่มเติม.pdf', title: 'หนังสือแจ้งขอข้อมูลเพิ่มเติม', sentOn: '20/05/2562' }];
  protected docSent = false;
  protected docSentBy = '';
  protected links: SystemLink[] = readSystemLinks();
  protected linkLog: SystemLink | null = null;
  protected linkLogError = false;
  protected readonly filingSaraban = 'สบ.1605/2562';
  protected readonly etrRefNo = 'ETR256205170001';
  protected assignMode: 'group' | 'person' = 'group';
  protected assignOpen = false;
  /** หัวหน้ากลุ่มเปิดดูคิวงานที่ยังไม่มีการมอบหมาย (เมื่อดึง e-Office ไม่ได้) */
  protected pendingAssignOpen = false;
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
  protected signerPrint = 'นายประกิต กาญจนการไกร';
  protected roleTitle = 'ผู้จัดการสำนักรัฐกิจสัมพันธ์ ผู้รับมอบอำนาจ';
  protected signedOn = '15/05/2563';

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
      when: slip.assignedOn || '16/05/2563',
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
    const consults = this.consultRounds.map((round) => ({
      phase: 'การขอปรึกษา',
      title: round.status === 'closed' ? `ปิดรอบปรึกษา #${round.no}` : `เปิดรอบปรึกษา #${round.no}`,
      when: round.status === 'closed' ? (round.closedAt || round.request.at || '') : (round.request.at || ''),
      detail: round.request.topic + (round.request.detail ? ` · ${round.request.detail}` : ''),
      label: round.status === 'closed' ? 'ปิดรอบ' : 'เปิดรอบ',
      tone: round.status === 'closed' ? 'success' as const : 'info' as const,
    }));
    return [...items, ...work, ...sent, ...checked, ...consults];
  }

  private readonly historyActivity: HistoryItem[] = [
    { phase: 'การจัดทำคำขอ', title: 'สร้างคำขอ', when: '15/05/2563 · 09:30 น.', detail: 'ผู้ยื่นสร้างคำขอและเริ่มกรอกข้อมูล', label: 'ร่าง', tone: 'neutral' },
    { phase: 'การจัดทำคำขอ', title: 'บันทึกข้อมูล', when: '15/05/2563 · 10:15 น.', detail: 'ปรับปรุงข้อมูลผู้ยื่นและรายละเอียดสินค้า', label: 'ร่าง', tone: 'neutral' },
    { phase: 'การจัดทำคำขอ', title: 'แนบเอกสาร', when: '15/05/2563 · 11:00 น.', detail: 'แนบเอกสารประกอบคำขอ', label: 'ร่าง', tone: 'neutral' },
    { phase: 'การจัดทำคำขอ', title: 'ยื่นครั้งแรก', when: '15/05/2563 · 16:00 น.', detail: 'นำส่งแบบ ปร.1 พร้อมหนังสือนำส่ง', label: 'ยื่นแล้ว', tone: 'info' },
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
    { phase: 'แบบคำขอ', title: 'เวอร์ชัน 1 ยื่นครั้งแรก', when: '15/05/2563', detail: 'แบบ ปร.1 พร้อมหนังสือนำส่งและเอกสารประกอบ', label: 'ยื่นแล้ว', tone: 'info' },
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
    const first = this.consult?.slots?.[0]?.date || (this.consult?.when || '').split(' ')[0] || '';
    return this.thaiDate(first);
  }

  protected consultSlotLabel(slot: { date: string; time: string; endTime?: string } | undefined): string {
    if (!slot?.date?.trim()) return '—';
    const start = slot.time.trim();
    const end = (slot.endTime || '').trim();
    if (start && end) return `${slot.date} ${start}–${end} น.`;
    if (start) return `${slot.date} ${start} น.`;
    return slot.date;
  }

  protected get consultSlotRows(): { date: string; time: string; endTime: string }[] {
    if (this.consult?.slots?.length) return this.consult.slots;
    return this.parseConsultWhen(this.consult?.when || '');
  }

  protected get consultSlotSummary(): string {
    const slots = this.consultSlotRows;
    if (!slots.length) return this.consult?.when || '—';
    return slots.map((slot) => this.consultSlotLabel(slot)).join(' · ');
  }

  protected readonly minConsultSlots = minConsultSlots;
  protected readonly maxConsultSlots = maxConsultSlots;

  protected setConsultSlotDate(index: number, value: string): void {
    this.consultSlots = this.consultSlots.map((slot, item) => (item === index ? { ...slot, date: value } : slot));
  }

  protected setConsultSlotTime(index: number, value: string): void {
    this.consultSlots = this.consultSlots.map((slot, item) => (item === index ? { ...slot, time: value } : slot));
  }

  protected setConsultSlotEndTime(index: number, value: string): void {
    this.consultSlots = this.consultSlots.map((slot, item) => (item === index ? { ...slot, endTime: value } : slot));
  }

  protected addConsultSlot(): void {
    if (this.consultSlots.length >= maxConsultSlots) return;
    this.consultSlots = [...this.consultSlots, nextConsultSlot(this.consultSlots)];
  }

  protected removeConsultSlot(index: number): void {
    if (index < minConsultSlots || this.consultSlots.length <= minConsultSlots) return;
    this.consultSlots = this.consultSlots.filter((_, item) => item !== index);
  }

  protected canRemoveConsultSlot(index: number): boolean {
    return index >= minConsultSlots && this.consultSlots.length > minConsultSlots;
  }

  protected get canAddConsultSlot(): boolean {
    return this.consultSlots.length < maxConsultSlots;
  }

  protected noteClock(at: string): string {
    const time = at.split(' ')[1];
    return time ? `${time} น.` : at;
  }

  protected get measureName(): string {
    if (this.wantDumping && this.wantSubsidy) return 'ตอบโต้การทุ่มตลาดและการอุดหนุน';
    if (this.wantSubsidy) return 'ตอบโต้การอุดหนุน';
    return 'ตอบโต้การทุ่มตลาด';
  }

  protected get formCodeName(): string {
    return 'ปร.1';
  }

  protected get pledgeStatusLabel(): string {
    if (this.issuedDocs.some((row) => row.kind === 'pledge')) return 'บันทึกแล้ว';
    return 'ยังไม่ออกเอกสาร';
  }

  protected get letterStatusLabel(): string {
    if (this.issuedDocs.some((row) => row.kind === 'letter')) return 'บันทึกแล้ว';
    return 'ยังไม่ออกเอกสาร';
  }

  protected syncCertForMeasure(): void {
    if (!this.letterPurpose.includes(this.measureName)) {
      this.letterPurpose = `ขอให้พิจารณาใช้มาตรการ${this.measureName}`;
    }
    if (!this.letterSubject.includes(this.measureName) && (this.wantSubsidy || this.wantDumping)) {
      this.letterSubject = `ขอให้พิจารณาดำเนินการใช้มาตรการ${this.measureName}`;
    }
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

  protected draftLetter(): void {
    const who = this.company.trim() || 'ผู้ยื่นคำขอ';
    const goods = this.caseGoods || 'สินค้าที่ถูกพิจารณา';
    const measure = this.measureName;
    this.letterTo = this.letterTo.trim() || 'อธิบดีกรมการค้าต่างประเทศ';
    this.letterSubject = `ขอให้พิจารณาดำเนินการใช้มาตรการ${measure}สินค้า${goods}`;
    this.letterBody = `${who} ในฐานะผู้ผลิตภายในประเทศ จึงขอนำส่งแบบ ${this.formCodeName} เลขที่อ้างอิง ${this.refId} พร้อมเอกสารประกอบต่อกรมการค้าต่างประเทศ เพื่อพิจารณาใช้มาตรการ${measure}สินค้า${goods}\n\nสิ่งที่ส่งมาด้วย\n1. แบบคำขอให้ดำเนินการพิจารณา${measure}\n2. CD บันทึกข้อมูล 1 แผ่น`;
    this.letterPurpose = `ขอให้พิจารณาใช้มาตรการ${measure}สินค้า${goods}`;
    this.syncCertForMeasure();
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
    this.publishGuide();
  }

  protected setPledgeSigned(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.pledgeSignedName = file.name;
    this.publishGuide();
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

  protected previewDocument(kind: 'letter' | 'pledge' = 'pledge'): void {
    this.docViewFull = false;
    this.docView = kind;
  }

  protected closeDocView(): void {
    this.docView = null;
    this.docViewFull = false;
  }

  protected saveCertForm(kind: 'letter' | 'pledge' = 'pledge'): void {
    this.saveDraft();
    const title = kind === 'letter' ? 'หนังสือนำส่ง' : 'คำรับรองและลงนาม';
    const code = kind === 'letter'
      ? `หนังสือนำส่ง-${this.refId}`
      : `คำรับรองและลงนาม-${this.refId}`;
    const at = this.replyStamp();
    const next = this.issuedDocs.filter((row) => row.kind !== kind);
    next.unshift({ kind, title, code, at });
    this.issuedDocs = next;
    this.view.detectChanges();
  }

  protected issuedOf(kind: 'letter' | 'pledge'): { kind: 'letter' | 'pledge'; title: string; code: string; at: string }[] {
    return this.issuedDocs.filter((row) => row.kind === kind);
  }

  protected printDocument(kind: 'letter' | 'pledge'): void {
    if (!this.docView) this.docView = kind;
    this.view.detectChanges();
    document.body.dataset['printDoc'] = kind;
    const done = () => {
      delete document.body.dataset['printDoc'];
      window.removeEventListener('afterprint', done);
    };
    window.addEventListener('afterprint', done);
    window.setTimeout(() => window.print(), 50);
  }

  protected downloadDocument(kind: 'letter' | 'pledge'): void {
    const node = document.querySelector(`.print-root [data-doc="${kind}"]`);
    if (!(node instanceof HTMLElement)) return;
    const title = kind === 'letter' ? 'หนังสือนำส่ง' : 'คำรับรองและลงนาม';
    const html = `<!DOCTYPE html><html lang="th"><head><meta charset="utf-8"><title>${title} ${filingRefId}</title><style>@page{size:A4;margin:18mm 16mm}body{margin:0;color:#0E2346;font-family:Thonburi,Sarabun,sans-serif;font-size:16px;line-height:28px}h3{margin:0 0 16px;text-align:center;font-size:18px;font-weight:500}.letter{padding:8px 0}.letter__top{display:flex;justify-content:space-between;gap:24px}.letter__date{margin-left:auto;text-align:right;white-space:nowrap}.letter__row{white-space:pre-wrap}.letter__body{margin:20px 0;text-indent:48px;white-space:pre-wrap}.letter__body--pledge{text-indent:0;text-align:justify;white-space:pre-wrap}.letter__sign{margin-top:28px;text-align:center}.letter__meta,.letter__ack{text-align:center}img{display:block;max-height:88px;margin:0 auto}p{margin:0 0 8px}</style></head><body>${node.innerHTML}<script>window.onload=function(){window.print()}<\/script></body></html>`;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.open();
    win.document.write(html);
    win.document.close();
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

  /** แนะนำขอปรึกษาใหม่หลังไม่อนุมัติ — ไม่ล็อกการยื่น/แก้แบบ */
  protected get needsNewConsult(): boolean {
    return this.needConsultAfterReject || (this.filingGate?.state === 'rejected' && !findOpenConsultRound(this.consultRounds));
  }

  /** สถานะชั้นปรึกษา (แยกจากสถานะคำขอ) */
  protected get consultOptionLabel(): string | null {
    if (this.needsNewConsult) return 'แนะนำขอปรึกษาใหม่';
    if (this.openConsultRound) {
      return this.consultAssigned || this.openConsultRound.assigned
        ? `ปรึกษา รอบ #${this.openConsultRound.no}`
        : `รอรับปรึกษา #${this.openConsultRound.no}`;
    }
    if (this.consultClosed) return 'ปิดปรึกษาแล้ว';
    return null;
  }

  protected get consultOptionTone(): 'info' | 'warning' | 'success' {
    if (this.needsNewConsult) return 'warning';
    if (this.openConsultRound) return 'info';
    return 'success';
  }

  /** ปุ่มขอปรึกษาข้างประวัติคำขอ — ใช้ได้ระหว่างกระบวนการ */
  protected get showConsultHeaderAction(): boolean {
    return !this.reviewRole && this.tracking && this.caseStatus !== 'cancelled';
  }

  protected get hasConsultRounds(): boolean {
    return this.consultRounds.length > 0;
  }

  /** รอบล่าสุดอยู่บน */
  protected get consultRoundList(): ConsultRound[] {
    return [...this.consultRounds].reverse();
  }

  protected get openConsultRound(): ConsultRound | null {
    return findOpenConsultRound(this.consultRounds);
  }

  protected roundSlotRows(round: ConsultRound): { date: string; time: string; endTime: string }[] {
    if (round.request.slots?.length) return round.request.slots;
    return this.parseConsultWhen(round.request.when || '');
  }

  protected get selectedConsultRound(): ConsultRound | null {
    return this.consultRounds.find((round) => round.id === this.consultRoundId) || this.openConsultRound || this.consultRounds.at(-1) || null;
  }

  protected get selectedRoundNotes(): ConsultNote[] {
    return this.selectedConsultRound?.notes || [];
  }

  protected get selectedPrivateNotes(): ConsultPrivateNote[] {
    const mine = this.accounts.username;
    return (this.selectedConsultRound?.privateNotes || []).filter((note) => note.authorId === mine);
  }

  protected get consultRoundLive(): boolean {
    return this.selectedConsultRound?.status === 'open';
  }

  /** ผู้ยื่นยังแก้แบบ / ยื่นทางการได้ระหว่างมีรอบปรึกษา */
  protected get canActDuringConsult(): boolean {
    return !this.reviewRole && !this.needsNewConsult && (!!this.openConsultRound || this.caseStatus === 'consult' || this.awaitingOfficialFiling || this.consultClosed !== null);
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
      if (this.assignPendingInSystem || this.consultWaiting()) return true;
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
      if (sessionStorage.getItem('dft-por1-consult-sample') === '1' || sessionStorage.getItem('dft-por1-consult-default') === '1') {
        sessionStorage.removeItem(this.consultJobKey);
        sessionStorage.removeItem('dft-por1-consult-sample');
        sessionStorage.removeItem('dft-por1-consult-default');
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
    sessionStorage.setItem('dft-por1-await-official', '1');
    this.consultClosed = closed;
    this.consultRounds = closeActiveConsultRound(closed.at);
    const summary = this.consultJobs
      .filter((job) => job.result?.detail)
      .map((job) => `${this.groupLabel(job.group)}: ${job.result!.detail}`)
      .join('\n');
    if (summary) this.publishApplicantNotice(`ผลการปิดงานขอคำปรึกษา\n${summary}`, 'ขอคำปรึกษา');
  }

  /** เจ้าหน้าที่ปิดรอบปรึกษาจากแผงได้เลย */
  protected closeConsultRoundFromPanel(): void {
    if (!this.reviewRole) return;
    const round = this.openConsultRound || (this.selectedConsultRound?.status === 'open' ? this.selectedConsultRound : null);
    if (!round) return;
    const at = this.replyStamp();
    const notes = [...round.notes, { from: 'officer' as const, text: `ปิดงานปรึกษารอบ #${round.no}`, at }];
    this.consultRounds = patchConsultRound(round.id, { status: 'closed', closedAt: at, notes, assigned: true });
    writeConsultAssigned(true);
    sessionStorage.setItem('dft-por1-consult-closed', JSON.stringify({ at }));
    sessionStorage.setItem('dft-por1-await-official', '1');
    this.consultClosed = { at };
    this.consultAssigned = true;
    this.consultNotes = notes;
    this.consultRoundId = round.id;
    this.publishApplicantNotice(`ปิดงานขอคำปรึกษารอบ #${round.no} แล้ว ผู้ยื่นสามารถยื่นแบบทางการได้`, 'ขอคำปรึกษา');
    this.consultPanelTab = 'summary';
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
    if (this.officialAssign) {
      const filed = sessionStorage.getItem('dft-por1-action-on') || this.filedOn;
      return [{
        title: 'แบบคำขอ ปร.1',
        place: 'ยื่นแบบทางการ',
        detail: `คำขอเลขที่อ้างอิง ${this.refId} สินค้าเหล็กแผ่นรีดร้อนจากเวียดนามและอียิปต์`,
        by: this.consultSubmitter,
        at: this.consult?.at || `${filed} 09:00`,
      }];
    }
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

  private consultSlotsText(): string {
    const slots = this.consult?.slots?.length ? this.consult.slots : this.parseConsultWhen(this.consult?.when || '');
    if (!slots.length) return this.consult?.when?.trim() || '—';
    return slots.map((slot, index) => `ช่วงที่ ${index + 1}  ${this.consultSlotLabel(slot)}`).join('\n');
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
        { label: 'ชื่อผู้ติดต่อ', value: this.consult?.contactName?.trim() || '—' },
        { label: 'เบอร์โทรติดต่อ', value: this.consult?.contactPhone?.trim() || '—' },
        { label: 'ชื่อผู้ยื่น', value: doc.by },
        { label: 'วันที่ยื่นคำร้อง', value: doc.at },
        { label: 'วันและเวลาที่สะดวกให้ติดต่อ', value: this.consultSlotsText() },
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
    if (kind === 'groups') this.consultPickGroups = ['กลุ่มงานมาตรการตอบโต้การทุ่มตลาด (AD)'];
  }

  /** หัวหน้ากลุ่ม / ผู้อำนวยการ — ดูงานที่ยังไม่ถูกมอบหมายในระบบนี้ */
  protected get canViewPendingAssign(): boolean {
    return this.reviewRole === 'head' || this.reviewRole === 'director' || this.isMyGroupHead();
  }

  protected get assignPendingInSystem(): boolean {
    return !this.consultClosed && !this.consultJobs.length && (this.filingReturned || this.eofficeDirector.state === 'sent' || this.eofficeDirector.state === 'error' || this.eofficeDirector.state === 'idle');
  }

  protected get pendingAssignItems(): {
    ref: string;
    title: string;
    applicant: string;
    reason: string;
    at: string;
    groupHint: string;
  }[] {
    if (!this.assignPendingInSystem && this.consultJobs.length) return [];
    const eofficeNote =
      this.eofficeDirector.state === 'error'
        ? 'ดึงจาก e-Office ไม่สำเร็จ'
        : this.eofficeDirector.state === 'sent'
          ? 'มอบใน e-Office แล้ว แต่ระบบยังดึงผลไม่ได้'
          : 'ยังไม่มีการมอบหมายในระบบนี้';
    const mine = this.myWorkGroup();
    return [
      {
        ref: this.refId,
        title: this.caseGoods || 'คำขอยื่นแบบ',
        applicant: this.company,
        reason: eofficeNote,
        at: this.eofficeDirector.sentAt || this.filedOn || this.replyStamp(),
        groupHint: mine || 'กลุ่มงานที่เกี่ยวข้อง',
      },
    ];
  }

  protected openPendingAssignQueue(): void {
    if (!this.canViewPendingAssign) return;
    this.pendingAssignOpen = true;
    this.reviewTab = 'assign';
  }

  protected closePendingAssignQueue(): void {
    this.pendingAssignOpen = false;
  }

  /**
   * เมื่อรู้ว่ามอบหมายใน e-Office/นอกระบบแล้ว แต่ดึงเข้ามาไม่ได้ —
   * หัวหน้ากลุ่มบันทึกรับงานของกลุ่มตนในระบบนี้ได้เลย
   */
  protected claimPendingAssignForMyGroup(): void {
    if (!this.canViewPendingAssign) return;
    const group = this.myWorkGroup() || this.assignableGroups[0]?.name || '';
    if (!group) return;
    if (this.reviewRole === 'director') {
      this.consultPickGroups = [group];
      this.openConsultForm('groups');
      this.pendingAssignOpen = false;
      return;
    }
    if (!this.isMyGroupHead() && this.reviewRole !== 'head') return;
    const at = this.replyStamp();
    const day = at.split(' ')[0] || this.thaiToday();
    const form: ConsultSlip = {
      assignedOn: day,
      dueOn: this.thaiShift(5),
      dueTime: '16:00',
      remind: true,
      order: `บันทึกรับมอบหมายนอกระบบ/e-Office — กลุ่ม ${group} (ดึงเข้าสู่ระบบไม่ได้ จึงบันทึกในระบบนี้)`,
      signed: true,
      files: [],
    };
    const existing = this.consultJobs.find((job) => job.group === group);
    this.consultJobs = existing
      ? this.consultJobs.map((job) => (job.group === group ? { ...job, reply: 'pending', form, repliedAt: '' } : job))
      : [...this.consultJobs, { group, reply: 'pending' as const, officers: [], form }];
    this.writeConsultJobs();
    writeConsultStep('group');
    writeConsultGroup(group);
    writeConsultAssigned(true);
    this.eofficeDirector = {
      ...this.eofficeDirector,
      state: 'assigned',
      mode: 'manual',
      pulledAt: at,
      groups: [...new Set([...(this.eofficeDirector.groups || []), group])],
      detail: `หัวหน้ากลุ่มบันทึกรับมอบหมายในระบบ: ${group}`,
      error: '',
    };
    writeEofficeDirectorHandoff(this.eofficeDirector);
    this.pendingAssignOpen = false;
    this.notice = 'saved';
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
    this.consultOrder = this.defaultConsultOrder();
    this.consultFiles = [];
    this.consultPickGroups = [];
    this.consultPickOfficers = [];
    this.consultReceipt = 'accept';
    this.consultMove = 'report';
    this.consultRemind = true;
    this.consultSigned = true;
    this.officerListOpen = false;
    this.officerQuery = '';
  }

  protected assignConsultGroups(): void {
    if (this.reviewRole !== 'director' || !this.consultPickGroups.length || !this.consultFormReady) return;
    const form = this.consultSlip();
    const fresh = sessionStorage.getItem('dft-por1-filing-assign') === 'wait';
    const next = fresh ? [] : [...this.consultJobs];
    for (const group of this.consultPickGroups) {
      const found = next.find((job) => job.group === group);
      if (found && !fresh) {
        found.form = form;
        if (found.reply === 'return') {
          found.reply = 'pending';
          found.repliedAt = undefined;
        }
        found.result = undefined;
        found.verdict = '';
        found.handoff = '';
        found.delivery = '';
      } else {
        next.push({ group, reply: 'pending', officers: [], form });
      }
    }
    this.consultJobs = next;
    sessionStorage.setItem('dft-por1-filing-assign', 'open');
    writeConsultStep('group');
    writeConsultAssigned(false);
    if (this.consultPickGroups[0]) writeConsultGroup(this.consultPickGroups[0]);
    this.closeConsultForm();
    this.writeConsultJobs();
    this.notice = 'saved';
  }

  protected removeConsultGroup(group: string): void {
    if (this.reviewRole !== 'director') return;
    this.consultJobs = this.consultJobs.filter((job) => job.group !== group);
    this.writeConsultJobs();
  }

  /** ต้องมอบหมายเจ้าหน้าที่ใหม่ (ผอ.ส่งต่อ / เจ้าหน้าที่ส่งต่อ / ส่งกลับรายงานใหม่) */
  protected headNeedsReassign(job = this.consultGroupJob()): boolean {
    if (!job || job.reply === 'return') return false;
    return job.handoff === 'more' || this.officerForwarded(job) || (job.verdict === 'rework' && !job.result && !!job.officers.length);
  }

  protected get headWorkCanSend(): boolean {
    if (!this.isMyGroupHead()) return false;
    const job = this.consultGroupJob();
    if (!job || job.reply === 'return') return false;
    if (job.reply === 'pending' && this.consultReceipt === 'return') return true;
    // หลังรายงานผลแล้ว / ส่งต่อ / ต้องมอบหมายใหม่ — ใช้แบบฟอร์มมอบหมายเจ้าหน้าที่
    if (this.headNeedsReassign(job) || this.consultMove === 'forward' || !!job.result) {
      return this.consultPickOfficers.length > 0 && this.consultFormReady;
    }
    return this.resultCanSend;
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
    // มีผลรายงานแล้ว หรือเลือกส่งต่อ = มอบหมายเจ้าหน้าที่ (ปุ่มไม่หายหลังรายงานผล)
    const forward = this.headNeedsReassign(job) || this.consultMove === 'forward' || !!job.result;
    if (!forward) {
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
    const notice = this.applicantNoticeText.trim() || detail;
    const mine = this.myConsultOfficer();
    if (!detail || !notice || !this.resultSigned || !mine || mine.reply !== 'accept' || mine.result || mine.move === 'forward') return;
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
    this.publishApplicantNotice(notice, 'ขอคำปรึกษา');
    this.clearResultDraft();
  }

  protected submitGroupResult(): void {
    this.saveGroupResult();
    this.clearResultDraft();
  }

  private saveGroupResult(): void {
    const detail = this.resultDetail.trim();
    const notice = this.applicantNoticeText.trim() || detail;
    if (!detail || !notice) return;
    const group = this.myWorkGroup();
    const result: ConsultResult = {
      at: this.replyStamp(),
      detail,
      signed: this.resultSigned,
      files: this.resultFiles.map((file) => ({ name: file.name, title: file.title.trim() || file.name })),
    };
    this.consultJobs = this.consultJobs.map((job) => job.group === group ? { ...job, result, verdict: '', handoff: '', delivery: '' } : job);
    this.writeConsultJobs();
    this.publishApplicantNotice(notice, 'ขอคำปรึกษา');
  }

  private clearResultDraft(): void {
    this.resultDetail = this.defaultResultDetail();
    this.applicantNoticeText = defaultApplicantNoticeText;
    this.printNotice = false;
    this.resultFiles = [];
    this.resultSigned = true;
  }

  protected get resultCanSend(): boolean {
    return !!this.resultDetail.trim() && !!this.applicantNoticeText.trim() && this.resultSigned;
  }

  private publishApplicantNotice(text: string, kind = 'ขอคำปรึกษา'): void {
    const body = text.trim();
    if (!body) return;
    const at = this.replyStamp();
    const by = this.signedPerson || this.officerName || 'เจ้าหน้าที่';
    const notice: ApplicantNotice = {
      id: `notice-${Date.now()}`,
      kind,
      text: body,
      by,
      at,
    };
    this.applicantNotices = [...readApplicantNotices(), notice];
    writeApplicantNotices(this.applicantNotices);
    this.consultNotes = [...readConsultThread(), { from: 'officer', text: body, at }];
    writeConsultThread(this.consultNotes);
    this.shownCount = Math.min(this.consultNotes.length, Math.max(this.shownCount, 6));
    if (this.printNotice) this.openApplicantNotice(notice);
  }

  protected openApplicantNotice(notice: ApplicantNotice): void {
    this.viewingMade = {
      id: notice.id,
      kind: `หนังสือแจ้งผล${notice.kind}`,
      at: `${notice.at} น.`,
      fields: [
        { label: 'ประเภท', value: notice.kind },
        { label: 'ผู้แจ้ง', value: notice.by },
        { label: 'วันเวลา', value: `${notice.at} น.` },
        { label: 'ข้อความแจ้งผู้ยื่น/ผู้ขอ', value: notice.text },
        { label: 'เลขที่อ้างอิง', value: this.refId },
      ],
    };
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
          found.reply = 'pending';
          found.move = '';
          found.repliedAt = undefined;
          found.result = undefined;
          found.note = undefined;
          found.noteFiles = undefined;
        } else {
          officers.push({ name, reply: 'pending', move: '', form });
        }
      }
      // รีเซ็ตท่อหลังผอ.ส่งต่อ / ส่งกลับ — เริ่มรอบมอบหมายใหม่
      return {
        ...job,
        officers,
        result: undefined,
        verdict: '',
        handoff: '',
        delivery: '',
      };
    });
    writeConsultStep('member');
    writeConsultAssigned(true);
    this.closeConsultForm();
    this.writeConsultJobs();
    this.notice = 'saved';
  }

  /** หัวหน้ากลุ่มส่งกลับให้เจ้าหน้าที่รายงานผลใหม่ (ขั้น 12) */
  protected returnOfficerResult(name: string): void {
    if (!this.isMyGroupHead()) return;
    const group = this.myWorkGroup();
    this.consultJobs = this.consultJobs.map((job) => {
      if (job.group !== group) return job;
      return {
        ...job,
        officers: job.officers.map((officer) =>
          officer.name === name ? { ...officer, result: undefined, move: '' } : officer
        ),
        result: undefined,
        verdict: '',
        handoff: '',
        delivery: '',
      };
    });
    this.writeConsultJobs();
    this.notice = 'saved';
  }

  /** หัวหน้ากลุ่มปิดงานเองหลังตรวจผล (ขั้น 13) — ไม่ส่งผอ. */
  protected closeHeadJob(): void {
    if (!this.isMyGroupHead()) return;
    const group = this.myWorkGroup();
    const job = this.consultGroupJob();
    if (!job || job.reply === 'return') return;
    this.consultJobs = this.consultJobs.map((item) =>
      item.group === group
        ? { ...item, verdict: 'approve', handoff: 'stop', delivery: 'close' }
        : item
    );
    this.writeConsultJobs();
    const live = this.consultJobs.filter((item) => item.reply !== 'return');
    if (live.length && live.every((item) => item.delivery === 'close' || item.delivery === 'board')) {
      this.closeConsultWork();
    }
    this.notice = 'saved';
  }

  protected removeConsultOfficer(name: string): void {
    const group = this.myWorkGroup();
    this.consultJobs = this.consultJobs.map((job) => job.group === group ? { ...job, officers: job.officers.filter((officer) => officer.name !== name) } : job);
    this.writeConsultJobs();
  }

  protected replyConsultOfficer(reply: 'accept' | 'return'): void {
    const mine = this.myConsultOfficer();
    if (!mine || mine.reply !== 'pending') return;
    this.queueAcceptNote();
    if (reply === 'return' && !this.acceptNotes.length) return;
    if (reply === 'accept' && !this.acceptNotes.length) return;
    const note = this.acceptNotes.join('\n');
    const noteFiles = this.acceptFiles.map((file) => ({ name: file.name, title: file.title.trim() || file.name }));
    this.consultJobs = this.consultJobs.map((job) => ({
      ...job,
      officers: job.officers.map((officer) =>
        officer.name === this.signedPerson && officer.reply === 'pending'
          ? { ...officer, reply, move: '', repliedAt: this.replyStamp(), note, noteFiles }
          : officer,
      ),
    }));
    this.writeConsultJobs();
    for (const text of this.acceptNotes) {
      this.publishApplicantNotice(text, reply === 'return' ? 'ส่งคืนงานปรึกษา' : 'รับทราบคำปรึกษา');
    }
    this.clearAcceptDraft();
    if (reply === 'accept') this.seedResultDraft();
  }

  protected queueAcceptNote(): void {
    const text = this.acceptNote.trim();
    if (!text) return;
    this.acceptNotes = [...this.acceptNotes, text];
    this.acceptNote = '';
  }

  protected removeAcceptNote(index: number): void {
    this.acceptNotes = this.acceptNotes.filter((_, item) => item !== index);
  }

  protected addAcceptFiles(event: Event): void {
    const input = event.target as HTMLInputElement;
    const next = [...this.acceptFiles];
    for (const file of input.files ?? []) next.push({ name: file.name, title: file.name });
    this.acceptFiles = next;
    input.value = '';
  }

  protected removeAcceptFile(index: number): void {
    this.acceptFiles = this.acceptFiles.filter((_, item) => item !== index);
  }

  private clearAcceptDraft(): void {
    this.acceptNote = '';
    this.acceptNotes = [];
    this.acceptFiles = [];
  }

  protected get replyCanSend(): boolean {
    const pending = this.acceptNote.trim() ? this.acceptNotes.length + 1 : this.acceptNotes.length;
    return pending > 0;
  }

  protected sendMoreApplicantNotes(): void {
    this.queueAcceptNote();
    if (!this.acceptNotes.length) return;
    for (const text of this.acceptNotes) this.publishApplicantNotice(text, 'ข้อความถึงผู้ยื่น');
    const files = this.acceptFiles.map((file) => ({ name: file.name, title: file.title.trim() || file.name }));
    if (files.length) {
      const mine = this.myConsultOfficer();
      if (mine) {
        this.consultJobs = this.consultJobs.map((job) => ({
          ...job,
          officers: job.officers.map((officer) =>
            officer.name === this.signedPerson
              ? { ...officer, noteFiles: [...(officer.noteFiles ?? []), ...files] }
              : officer,
          ),
        }));
        this.writeConsultJobs();
      }
    }
    this.clearAcceptDraft();
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
      {
        title: '2. ผู้อำนวยการ',
        detail: tasks.length || this.consultJobs.length
          ? `มอบหมาย ${(tasks.length || this.consultJobs.length)} กลุ่มผ่าน e-Office`
          : this.eofficeDirector.state === 'sent'
            ? 'มอบหมายใน e-Office'
            : 'ส่งเข้า e-Office',
        state: tasks.length || this.consultJobs.length ? 'done' : intakeDone ? 'now' : '',
      },
      {
        title: '3. กลุ่ม',
        detail: tasks.map((task) => task.head).join(' · ') || this.consultJobs.map((job) => this.jobHead(job.group)).join(' · ') || 'รอมอบหมายกลุ่มในระบบ',
        state: headBack ? 'back' : headDone ? 'done' : tasks.length || this.consultJobs.length ? 'now' : '',
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
  /** -1 = แบบคำขอ */
  protected docPart = -1;

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
    this.syncFilingUrl();
  }

  private filingUrlReady = false;

  private isReviewTab(value: string): value is ReviewTab {
    return (this.phaseOrder as string[]).includes(value);
  }

  private currentDocKey(): string {
    if (this.completeBundle === 'open') return 'edition-open';
    if (this.completeBundle === 'closed') return 'edition-closed';
    if (this.docPart === this.draftAgendaPart) return 'draft-agenda';
    if (this.docPart === this.approvalSubmitPart) return 'approval-submit';
    if (this.docPart === this.subAgendaPart) return 'sub-agenda';
    if (this.docPart === this.meetingPackPart) return 'meeting-pack';
    if (this.docPart === this.meetingResolutionPart) return 'meeting-resolution';
    if (this.docPart === this.extendPart) return 'extend';
    if (this.docPart === this.committeePart) return 'committee';
    if (this.docPart < 0) return 'bundle';
    const title = this.workDocs[this.docPart]?.title || '';
    return this.docSlugFromTitle(title) || `doc-${this.docPart}`;
  }

  private docSlugFromTitle(title: string): string {
    if (title === 'หนังสือขอข้อมูลหน่วยงานที่เกี่ยวข้อง') return 'agency-letter';
    if (title === 'สรุปข้อมูลจากหน่วยงานที่เกี่ยวข้อง') return 'agency-summary';
    if (title.startsWith('Pre-questionnaire')) return 'preqn';
    if (title === this.openEditionKind || title.includes('ฉบับเปิดเผย')) return 'edition-open';
    if (title === this.closedEditionKind || title.includes('ฉบับปกปิด')) return 'edition-closed';
    return '';
  }

  private applyDocKey(key: string): void {
    if (key === 'draft-agenda') {
      this.pickDraftAgenda();
      return;
    }
    if (key === 'approval-submit') {
      this.pickApprovalSubmit();
      return;
    }
    if (key === 'sub-agenda') {
      this.pickSubAgenda();
      return;
    }
    if (key === 'meeting-pack' || key === 'meeting-resolution') {
      if (!this.meetingBureauFlowEnabled) {
        this.pickSubAgenda();
        return;
      }
      if (key === 'meeting-pack') this.pickMeetingPack();
      else this.pickMeetingResolution();
      return;
    }
    if (key === 'extend') {
      this.pickExtend();
      return;
    }
    if (key === 'edition-open') {
      this.pickCompleteBundle('open');
      return;
    }
    if (key === 'edition-closed') {
      this.pickCompleteBundle('closed');
      return;
    }
    if (key === 'bundle' || key === 'filing') {
      this.pickFilingBundle();
      return;
    }
    if (key === 'committee') {
      this.pickDoc(this.committeePart);
      return;
    }
    const bySlug =
      key === 'agency-letter'
        ? this.workDocs.findIndex((doc) => doc.title === 'หนังสือขอข้อมูลหน่วยงานที่เกี่ยวข้อง')
        : key === 'agency-summary'
          ? this.workDocs.findIndex((doc) => doc.title === 'สรุปข้อมูลจากหน่วยงานที่เกี่ยวข้อง')
          : key === 'preqn'
            ? this.workDocs.findIndex((doc) => this.isPreQnWorkDoc(doc.title))
            : -1;
    if (bySlug >= 0) {
      this.pickDoc(bySlug);
      return;
    }
    const match = /^doc-(\d+)$/.exec(key);
    if (match) {
      const index = Number(match[1]);
      if (index >= 0 && index < this.workDocs.length) this.pickDoc(index);
    }
  }

  /** เขียนแท็บ/หัวข้อลง URL เพื่อ refresh แล้วยังอยู่จุดเดิม */
  private syncFilingUrl(): void {
    if (!this.filingUrlReady || !this.reviewRole) return;
    const tab = this.reviewTab;
    const queryParams: Record<string, string | null> = {
      tab,
      doc: tab === 'docs' ? this.currentDocKey() : null,
      view:
        tab === 'docs' && this.docPart === this.draftAgendaPart
          ? this.draftAgendaTab
          : tab === 'docs' && this.docPart === this.approvalSubmitPart
            ? this.approvalTab
            : null,
      step: tab === 'inquiry' ? this.inquiryPart : null,
    };
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  /** อ่าน tab/doc/step จาก URL หลังโหลดเคส */
  private restoreFilingUrl(): void {
    if (!this.reviewRole) return;
    const asked = this.route.snapshot.queryParamMap.get('tab') || '';
    const askedDoc = this.route.snapshot.queryParamMap.get('doc') || '';
    const askedStep = this.route.snapshot.queryParamMap.get('step') || '';
    if (asked && this.isReviewTab(asked) && this.showReviewTab(asked) && !this.reviewLocked(asked)) {
      this.reviewTab = asked;
    }
    if (this.reviewTab === 'docs' && askedDoc) {
      this.applyDocKey(askedDoc);
    }
    if (this.reviewTab === 'inquiry') {
      this.placeInquiry();
      if (askedStep && (this.inquiryNav.some((step) => step.id === askedStep))) {
        this.openInquiryStep(askedStep as InquiryStep);
      }
    }
  }

  protected get docsPassed(): boolean {
    return this.docSent && this.docAction === 'complete' && this.committeeSent && this.committeeResult === 'take';
  }

  protected reviewLocked(tab: ReviewTab): boolean {
    if (!this.returnCase && !this.docsPassed && (this.awaitingOfficialFiling || this.filingGate?.state === 'pending') && this.phaseOrder.indexOf(tab) > this.phaseOrder.indexOf('assign')) return true;
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

  protected get filingReturned(): boolean {
    return sessionStorage.getItem('dft-por1-filing-assign') === 'wait';
  }

  protected get awaitingOfficialFiling(): boolean {
    return sessionStorage.getItem('dft-por1-await-official') === '1';
  }

  private keepOfficialWait(): void {
    if (!this.consultClosed) return;
    if (sessionStorage.getItem('dft-por1-await-official') === '0') return;
    sessionStorage.setItem('dft-por1-await-official', '1');
  }

  protected get officialAssign(): boolean {
    const mark = sessionStorage.getItem('dft-por1-filing-assign');
    if (mark === 'open') return true;
    if (mark === 'wait') return false;
    if (sessionStorage.getItem('dft-por1-await-official') === '1') return false;
    if (this.caseStatus !== 'official' && this.caseStatus !== 'revision') return false;
    const accepted = this.consultJobs.some((job) => job.officers.some((officer) => officer.reply === 'accept'));
    if (!accepted) return false;
    sessionStorage.setItem('dft-por1-filing-assign', 'open');
    return true;
  }

  private officerAcceptedFiling(): boolean {
    return this.officialAssign && this.consultJobs.some((job) => job.officers.some((officer) => officer.reply === 'accept'));
  }

  private consultStillOpen(): boolean {
    if (sessionStorage.getItem('dft-por1-filing-assign') === 'wait') return true;
    if (this.officerAcceptedFiling()) return false;
    if (this.caseStatus === 'draft' || this.caseStatus === 'review' || this.caseStatus === 'revision') return false;
    if (!this.consultJobs.length) return this.caseStatus === 'official' || this.caseStatus === 'approval' || this.caseStatus === 'consult';
    return this.consultJobs.some((job) => job.delivery !== 'close' && job.delivery !== 'board');
  }

  private liveCursor(): ReviewTab {
    if (this.docsPassed) {
      if (!(this.inquiryOpen === 'close' || this.inquiryReturned || (this.inquiryOpen === 'open' && this.laterPhase.visit))) return 'inquiry';
      if (!this.laterPhase.prelim) return 'prelim';
      if (!this.laterPhase.draftFinal) return 'draftFinal';
      if (!this.laterPhase.finalResult) return 'finalResult';
      if (!this.laterPhase.measures) return 'measures';
      return 'link';
    }
    if (this.officerAcceptedFiling()) return 'docs';
    if (this.caseStatus === 'draft' || this.caseStatus === 'review' || this.caseStatus === 'revision') return 'form';
    if (this.consultStillOpen()) return 'assign';
    return 'docs';
  }

  private liveAhead(tab: ReviewTab): boolean {
    return this.phaseOrder.indexOf(tab) > this.phaseOrder.indexOf(this.liveCursor());
  }

  protected reviewMark(tab: ReviewTab): 'done' | 'now' | 'work' | 'lock' {
    if (!this.returnCase && (this.awaitingOfficialFiling || this.filingGate?.state === 'pending')) {
      if (tab === 'form' || tab === 'assign') return 'done';
      return 'lock';
    }
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
    if (!this.returnCase && this.filingGate?.state === 'pending' && tab === 'docs') return 'รอเจ้าหน้าที่อนุมัติการยื่นแบบ';
    if (!this.returnCase && this.awaitingOfficialFiling && tab === 'docs') return 'รอผู้ยื่นยื่นแบบทางการ';
    if (!this.returnCase && mark === 'now' && tab === 'assign' && sessionStorage.getItem('dft-por1-filing-assign') === 'wait') return 'รอมอบหมายผู้รับผิดชอบ';
    if (!this.returnCase && mark === 'now' && tab === 'assign' && this.officialAssign) return 'รอเจ้าหน้าที่รับเรื่อง';
    if (!this.returnCase && mark === 'now' && tab === 'assign' && this.consultJobs.some((job) => job.result && !job.verdict)) return 'รอพิจารณาอนุมัติ';
    if (!this.returnCase && mark === 'now' && tab === 'assign' && this.consultJobs.some((job) => job.verdict === 'approve' && !job.handoff)) return 'รอเลือกส่งต่อ';
    if (!this.returnCase && mark === 'now' && tab === 'assign' && this.consultJobs.some((job) => job.handoff === 'stop' && !job.delivery)) return 'รอเลือกสถานะการส่งมอบ';
    if (!this.returnCase && mark === 'now' && tab === 'assign' && this.consultJobs.some((job) => job.reply === 'accept' && !job.result)) return 'รอตอบคำปรึกษา';
    if (!this.returnCase && mark === 'now' && tab === 'assign' && this.consultJobs.length) return 'รอหัวหน้ากลุ่มรับเรื่อง';
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

  protected get openPrep(): OpenPrep {
    const empty = { ask: false, analyze: false, summary: false, report: false, pulled: false, revised: false, aiSummary: '', aiDraft: '', aiReview: '', sent: false, approved: false, prenotify: false, office: [] as string[] };
    try {
      const value = JSON.parse(this.laterPhase.notes['open-prep'] || 'null') as Partial<typeof empty> | null;
      if (!value || typeof value !== 'object') return empty;
      return {
        ...empty,
        ...value,
        office: Array.isArray(value.office) ? value.office.filter((item): item is string => typeof item === 'string') : [],
      };
    } catch {
      return empty;
    }
  }

  private savePrep(next: OpenPrep): void {
    this.keepNote('open-prep', JSON.stringify(next));
  }

  protected advancePrep(step: 'ask' | 'analyze' | 'summary' | 'report' | 'pulled' | 'revised'): void {
    const prep = this.openPrep;
    const order = ['ask', 'analyze', 'summary', 'report', 'pulled', 'revised'] as const;
    if (order.slice(0, order.indexOf(step)).some((key) => !prep[key])) return;
    const title = {
      ask: 'หนังสือขอข้อมูลเพิ่มเติมก่อนเปิดไต่สวน',
      analyze: 'บันทึกรวบรวมและวิเคราะห์ก่อนเปิดไต่สวน',
      summary: 'บันทึกรวบรวมและสรุปก่อนเปิดไต่สวน',
      report: 'รายงานก่อนเปิดไต่สวน',
      pulled: 'รายงานที่ดึงกลับเข้าระบบก่อนเปิดไต่สวน',
      revised: 'ร่างที่ตรวจแก้ก่อนเปิดไต่สวน',
    }[step];
    const at = this.thaiToday();
    const stamp = `${at} 09:00`;
    if (step === 'analyze' || step === 'summary' || step === 'report') {
      this.pushLink('e-Office', title, `เลขสารบรรณ ${this.filingSaraban} ของคำขอ ${this.refId} บันทึกส่งเข้า e-Office บนจอ`, this.filingSaraban, stamp);
    }
    this.keepPrepDoc(title, at, `คำขอเลขที่อ้างอิง ${this.refId} สินค้าเหล็กแผ่นรีดร้อนจากเวียดนามและอียิปต์ ${title}`);
    this.savePrep({ ...prep, [step]: true });
  }

  protected runOpenAi(kind: 'summary' | 'draft' | 'review'): void {
    const prep = this.openPrep;
    if (!prep.revised) return;
    const title = kind === 'summary' ? 'AI สรุปคำขอ' : kind === 'draft' ? 'AI ร่างเอกสาร' : 'AI พิจารณาให้เจ้าหน้าที่';
    const text = kind === 'summary'
      ? `สรุปคำขอเลขที่อ้างอิง ${this.refId} ของบริษัท สหวิริยาสตีลอินดัสตรี จำกัด สินค้าเหล็กแผ่นรีดร้อนจากเวียดนามและอียิปต์ เพื่อประกอบการเปิดไต่สวน`
      : kind === 'draft'
        ? `ร่างหนังสือประกอบคำขอเลขที่อ้างอิง ${this.refId} สินค้าเหล็กแผ่นรีดร้อนจากเวียดนามและอียิปต์ ให้เจ้าหน้าที่ตรวจก่อนใช้`
        : `ตรวจคำขอเลขที่อ้างอิง ${this.refId} แล้ว เห็นควรให้เจ้าหน้าที่พิจารณารับหรือไม่รับคำขอต่อ`;
    this.keepPrepDoc(title, this.thaiToday(), text);
    const key = kind === 'summary' ? 'aiSummary' : kind === 'draft' ? 'aiDraft' : 'aiReview';
    this.savePrep({ ...prep, [key]: text });
  }

  protected sendOpenSummary(): void {
    const prep = this.openPrep;
    if (!prep.revised || !prep.aiSummary || !prep.aiDraft || !prep.aiReview || prep.sent) return;
    const at = this.thaiToday();
    this.keepPrepDoc('สรุปส่งข้อมูลก่อนเปิดไต่สวน', at, `ส่งสรุปคำขอเลขที่อ้างอิง ${this.refId} ให้ผู้อนุมัติ เลขสารบรรณ ${this.filingSaraban}`);
    this.pushLink('e-Office', 'สรุปส่งข้อมูลก่อนเปิดไต่สวน', `เลขสารบรรณ ${this.filingSaraban} ของคำขอ ${this.refId}`, this.filingSaraban, `${at} 10:00`);
    this.savePrep({ ...prep, sent: true });
  }

  protected approveOpenSummary(): void {
    const prep = this.openPrep;
    if (!prep.sent || prep.approved) return;
    this.keepPrepDoc('อนุมัติสรุปก่อนเปิดไต่สวน', this.thaiToday(), `อนุมัติสรุปคำขอเลขที่อ้างอิง ${this.refId} แล้ว จึงไปจัดทำวาระพิจารณาคำขอเปิดไต่สวน`);
    this.savePrep({ ...prep, approved: true });
    this.inquiryPart = 'draftAgenda';
  }

  private keepPrepDoc(kind: string, at: string, body: string): void {
    const fields = [
      field('ที่', this.filingSaraban),
      field('วันที่', at),
      field('เรื่อง', kind),
      field('เนื้อความ', body, true),
      field('ลงชื่อ', this.signedPerson || 'นางสาวจรีณา กิจส่งเสริมกุล'),
    ];
    const existing = this.madeOf(kind).at(-1);
    if (existing) this.madeDocs = this.madeDocs.map((item) => item.id === existing.id ? { ...item, at, fields } : item);
    else this.madeDocs = [...this.madeDocs, { id: `prep-${kind}`, kind, at, fields }];
    writeMadeDocs(this.madeDocs);
  }

  protected openPrepDoc(kind: string): void {
    const doc = this.madeOf(kind).at(-1);
    if (doc) this.viewingMade = doc;
  }

  protected get prepRows(): { kind: string; title: string; done: boolean; current: boolean; office: boolean; action: string; step?: 'ask' | 'analyze' | 'summary' | 'report' | 'pulled' | 'revised'; ai?: 'summary' | 'draft' | 'review'; finish?: 'send' | 'approve' }[] {
    const prep = this.openPrep;
    const rows: { kind: string; title: string; done: boolean; office: boolean; action: string; step?: 'ask' | 'analyze' | 'summary' | 'report' | 'pulled' | 'revised'; ai?: 'summary' | 'draft' | 'review'; finish?: 'send' | 'approve' }[] = [
      { kind: 'หนังสือขอข้อมูลเพิ่มเติมก่อนเปิดไต่สวน', title: 'ขอข้อมูลเพิ่มเติม', done: prep.ask, office: false, action: 'บันทึก', step: 'ask' },
      { kind: 'บันทึกรวบรวมและวิเคราะห์ก่อนเปิดไต่สวน', title: 'รวบรวมและวิเคราะห์', done: prep.analyze, office: true, action: 'ส่ง e-Office', step: 'analyze' },
      { kind: 'บันทึกรวบรวมและสรุปก่อนเปิดไต่สวน', title: 'รวบรวมและสรุป', done: prep.summary, office: true, action: 'ส่ง e-Office', step: 'summary' },
      { kind: 'รายงานก่อนเปิดไต่สวน', title: 'ทำรายงาน', done: prep.report, office: true, action: 'ส่ง e-Office', step: 'report' },
      { kind: 'รายงานที่ดึงกลับเข้าระบบก่อนเปิดไต่สวน', title: 'ดึงรายงานกลับเข้าระบบ', done: prep.pulled, office: false, action: 'ดึงกลับ', step: 'pulled' },
      { kind: 'ร่างที่ตรวจแก้ก่อนเปิดไต่สวน', title: 'ตรวจและปรับแก้ร่าง', done: prep.revised, office: false, action: 'บันทึกฉบับแก้', step: 'revised' },
      { kind: 'AI สรุปคำขอ', title: 'AI สรุปคำขอ', done: !!prep.aiSummary, office: false, action: 'สรุป', ai: 'summary' },
      { kind: 'AI ร่างเอกสาร', title: 'AI ร่างเอกสาร', done: !!prep.aiDraft, office: false, action: 'ร่าง', ai: 'draft' },
      { kind: 'AI พิจารณาให้เจ้าหน้าที่', title: 'AI พิจารณาให้เจ้าหน้าที่', done: !!prep.aiReview, office: false, action: 'พิจารณา', ai: 'review' },
      { kind: 'สรุปส่งข้อมูลก่อนเปิดไต่สวน', title: 'สรุปส่งข้อมูล', done: prep.sent, office: true, action: 'ส่ง', finish: 'send' },
      { kind: 'อนุมัติสรุปก่อนเปิดไต่สวน', title: 'อนุมัติสรุป', done: prep.approved, office: false, action: 'อนุมัติ', finish: 'approve' },
    ];
    const current = rows.findIndex((row) => !row.done);
    return rows.map((row, index) => ({ ...row, current: index === current }));
  }

  protected savePrenotify(): void {
    const prep = this.openPrep;
    if (this.inquiryDecide !== 'take' || prep.prenotify) return;
    this.savePrep({ ...prep, prenotify: true, office: [...prep.office, `${this.thaiToday()} บันทึก pre-notify แจ้งผู้เกี่ยวข้องกับคำขอ`] });
    this.inquiryPart = 'fee';
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

  /** จุดสถานะรายการเอกสาร — ผ่านแล้วใช้วงกลมเขียวทึบเดียวกับสารบัญแบบฟอร์ม (por1-dot-done) */
  protected noticeDot(): string {
    const completePassed = this.noticeItems.some(
      (item) => item.action === 'complete' && (item.pipe === 'done' || item.sent || item.pipe === 'attach' || item.pipe === 'numbered'),
    );
    if ((this.docAction === 'complete' && this.docSent) || completePassed) {
      return 'assets/icons/por1-dot-done.svg';
    }
    if (this.docSent || this.madeOf('แจ้งผลการตรวจ').length || this.docFiles.length) return 'assets/icons/por1-dot-wait.svg';
    return 'assets/icons/por1-dot.svg';
  }

  protected docActionLabel(action: DocAction): string {
    if (action === 'complete') return 'แจ้งคำขอครบถ้วนถูกต้อง';
    if (action === 'late') return 'แจ้งคำขอไม่ครบถ้วนถูกต้องภายใน 4 เดือน';
    return 'แจ้งแก้ไขเพิ่มเติม';
  }

  /** สลับการดำเนินการแล้วจำลองข้อความ / วันที่ / ไฟล์ตัวอย่างให้ครบทุก option */
  protected setDocAction(action: DocAction): void {
    if (this.noticePipeLocked || this.docAction === action) return;
    this.docAction = action;
    this.applyDocActionSample(action);
    if (!this.docSent) writeDocNotice(this.docPayload(false));
  }

  private applyDocActionSample(action: DocAction): void {
    const noticed = this.docNoticedOn || '20/05/2562';
    if (action === 'amend') {
      this.docDueOn = this.docDueOn || '20/06/2562';
      this.docNote =
        'ตรวจคำขอแล้วยังไม่ครบ จึงเสนอแจ้งแก้ไขเพิ่มเติม — ขอหลักฐานราคาช่วงปลายปี 2561–ต้นปี 2562 ปริมาณนำเข้าที่เชื่อมความเสียหาย และรายชื่อผู้ผลิตที่ร่วมยื่น ตามแก้ไขคำขอครั้งที่ 1';
      this.docGaps = defaultNoticeGaps.map((gap) => ({ ...gap }));
      this.docFiles = [{ name: 'หนังสือแจ้งขอข้อมูลเพิ่มเติม.pdf', title: 'หนังสือแจ้งขอข้อมูลเพิ่มเติม', sentOn: noticed }];
      this.noticeLetter = noticeLetterFields('amend', noticed, this.docDueOn, this.signedPerson);
      this.applyGapBody();
      return;
    }
    if (action === 'late') {
      this.docDueOn = this.amendUntil || '15/09/2562';
      this.docNote =
        `ครบกำหนดแก้ไขเพิ่มเติม 4 เดือนเมื่อ ${this.amendUntil || '15/09/2562'} แล้วยังไม่ครบถ้วนถูกต้อง — เสนอแจ้งผู้ยื่นว่าคำขอไม่ครบภายในกำหนด และปิดรอบแก้ไขเพิ่มเติม`;
      this.docGaps = defaultNoticeGaps.map((gap) => ({ ...gap }));
      this.docFiles = [{ name: 'หนังสือแจ้งไม่ครบภายใน4เดือน.pdf', title: 'หนังสือแจ้งคำขอไม่ครบถ้วนถูกต้องภายใน 4 เดือน', sentOn: noticed }];
      this.noticeLetter = noticeLetterFields('late', noticed, this.docDueOn, this.signedPerson);
      this.applyGapBody();
      return;
    }
    this.docNote =
      'ตรวจคำขอและเอกสารประกอบครบถ้วนถูกต้องแล้ว — เสนอแจ้งผู้ยื่นว่าคำขอครบถ้วนถูกต้อง พร้อมจัดทำแบบคำขอฉบับเปิดเผย';
    this.docGaps = [];
    this.docFiles = [{ name: 'หนังสือแจ้งคำขอครบถ้วนถูกต้อง.pdf', title: 'หนังสือแจ้งคำขอครบถ้วนถูกต้อง', sentOn: noticed }];
    this.noticeLetter = noticeLetterFields('complete', noticed, '-', this.signedPerson);
    this.ensureOpenEditionFiles();
    this.ensureClosedEditionFiles();
  }

  /** จำนวนครั้งที่แจ้งผลการตรวจ (รอบที่ผ่านมา + รอบปัจจุบันถ้ามี) */
  protected get noticeTimes(): number {
    return Math.max(this.noticeItems.length, this.noticePasses.length + (this.docSent || this.docFiles.length ? 1 : 0));
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
  protected noticeViewRows: { label: string; value: string }[] = [];

  /** ชื่อแสดงโดยไม่มีนามสกุลไฟล์ */
  protected noticeDisplayName(name = this.viewingNotice): string {
    const file = this.docFiles.find((item) => item.name === name);
    const raw = (file?.title || name || '').trim();
    return raw.replace(/\.[^.]+$/, '') || raw || 'หนังสือแจ้งผล';
  }

  private buildNoticeViewRows(fileName: string): { label: string; value: string }[] {
    const rows: { label: string; value: string }[] = [
      { label: 'การดำเนินการ', value: this.docActionLabel(this.docAction) },
      { label: 'วันที่แจ้ง', value: this.docNoticedOn || '—' },
    ];
    if (this.docAction !== 'complete') {
      rows.push({ label: 'วันที่ครบกำหนด', value: this.docDueOn || '—' });
    }
    rows.push({ label: 'ข้อความ', value: this.docNote.trim() || '—' });
    return rows;
  }

  protected noticeReportRows(): { label: string; value: string }[] {
    return this.noticeViewRows.filter((item) =>
      item.label === 'การดำเนินการ' || item.label === 'วันที่แจ้ง' || item.label === 'วันที่ครบกำหนด' || item.label === 'ข้อความ');
  }

  protected openNoticeFile(name: string): void {
    const href = this.docFiles.find((item) => item.name === name)?.href
      || this.noticeItems.find((item) => item.id === this.activeNoticeId)?.files.find((file) => file.name === name)?.href
      || '';
    if (href) {
      window.open(href, '_blank', 'noopener');
      return;
    }
    this.noticeViewRows = this.buildNoticeViewRows(name);
    this.viewingNotice = name;
  }

  protected downloadNoticeFile(name: string): void {
    const file = this.docFiles.find((item) => item.name === name);
    const href = file?.href
      || this.noticeItems.find((item) => item.id === this.activeNoticeId)?.files.find((row) => row.name === name)?.href
      || '';
    if (href) {
      void this.downloadAssetFile(href, name);
      return;
    }
    const title = this.noticeDisplayName(name);
    const rows = this.viewingNotice === name && this.noticeViewRows.length
      ? this.noticeViewRows
      : this.buildNoticeViewRows(name);
    const fileLines = (this.docFiles.length ? this.docFiles : [{ name, title: file?.title || name, sentOn: file?.sentOn || this.docNoticedOn || '' }])
      .map((item, index) => `<p><strong>ไฟล์ ${index + 1}</strong><br>ชื่อเอกสาร ${this.escapeHtml(this.noticeDisplayName(item.name))}<br>ชื่อไฟล์ ${this.escapeHtml(item.name)}<br>วันที่แนบ ${this.escapeHtml(item.sentOn || this.docNoticedOn || '—')}</p>`)
      .join('');
    const body = rows
      .map((item) => `<p><strong>${this.escapeHtml(item.label)}</strong><br>${this.escapeHtml(item.value).replaceAll('\n', '<br>')}</p>`)
      .join('') + `<h2>ไฟล์หนังสือแจ้งผล</h2>${fileLines}`;
    const html = `<!DOCTYPE html><html lang="th"><head><meta charset="utf-8"><title>${this.escapeHtml(title)}</title><style>body{margin:32px 48px;color:#0E2346;font-family:Thonburi,Sarabun,sans-serif;font-size:16px;line-height:28px}h1{margin:0 0 8px;font-size:20px;font-weight:500}h2{margin:24px 0 8px;font-size:16px;font-weight:600}p{margin:0 0 12px}</style></head><body><h1>${this.escapeHtml(title)}</h1><h2>รายงานผลถึงหัวหน้ากลุ่ม</h2>${body}</body></html>`;
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title}-${filingRefId}.html`;
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
    if (this.noticePipe === 'cancelled') return false;
    if (this.docSent || this.noticePipe !== 'draft') return false;
    return this.canHandleCase;
  }

  protected get noticeEvidenceReady(): boolean {
    return this.noticeLetterVersions.length > 0 || this.docFiles.length > 0;
  }

  protected get docCanSend(): boolean {
    const dueOk = this.docAction === 'complete' || thaiDateOk(this.docDueOn, 'any');
    // หมายเหตุไม่บังคับ — ต้องแนบไฟล์หนังสืออย่างน้อย 1 ไฟล์
    return this.canReviewDocs && this.noticeEvidenceReady && thaiDateOk(this.docNoticedOn, 'any') && dueOk;
  }

  protected get noticePipeLocked(): boolean {
    return this.noticePipe !== 'draft' || this.docSent;
  }

  protected noticePipeLabel(pipe = this.noticePipe): string {
    if (pipe === 'delivered') {
      return this.noticeSaraban ? `ส่งให้ผู้ยื่นแล้ว · ${this.noticeSaraban}` : 'ส่งให้ผู้ยื่นแล้ว';
    }
    if (pipe === 'done') return 'อนุมัติแล้ว — รอแนบไฟล์สมบูรณ์และยืนยันส่ง';
    if (pipe === 'numbered' && this.noticeSaraban) return `ได้เลข ${this.noticeSaraban} — รอแนบไฟล์`;
    return approvalLaneStageLabel(pipe);
  }

  protected noticePipeTone(pipe = this.noticePipe): 'info' | 'warning' | 'success' | 'danger' | 'neutral' {
    return approvalLaneStageTone(pipe);
  }

  protected get noticeStatusVisible(): boolean {
    return this.noticeItems.some((item) => item.pipe !== 'draft' || item.files.length > 0 || item.sent)
      || this.docSent || this.noticePipe !== 'draft' || !!this.docFiles.length;
  }

  /** สถานะรวมในเมนูซ้าย — รายการที่ยังเดินท่ออยู่ก่อน */
  protected get noticeSidebarPipe(): NoticePipe {
    const open = this.noticeItems.find((item) =>
      item.pipe === 'to-head' ||
      item.pipe === 'to-director' ||
      item.pipe === 'eoffice' ||
      item.pipe === 'stamped' ||
      item.pipe === 'numbered' ||
      item.pipe === 'attach',
    );
    if (open) return open.pipe;
    const latest = this.noticeItems.at(-1);
    return latest?.pipe || this.noticePipe;
  }

  private get isNoticeHeadActor(): boolean {
    return this.reviewRole === 'head' || this.isMyGroupHead();
  }

  private get isNoticeDirectorActor(): boolean {
    return this.reviewRole === 'director' || this.reviewRole === 'staff';
  }

  protected get isNoticeOfficerActor(): boolean {
    return this.reviewRole === 'officer' && this.canHandleCase;
  }

  protected markNoticeStampedRow(item: NoticeItem): void {
    this.activateNoticeItem(item.id);
    this.markNoticeStamped();
  }

  private get isNoticeEofficeStage(): boolean {
    return (
      this.noticePipe === 'eoffice' ||
      this.noticePipe === 'stamped' ||
      this.noticePipe === 'numbered' ||
      this.noticePipe === 'attach'
    );
  }

  protected get noticeLaneActor(): ApprovalLaneActor {
    if (this.canHeadApproveNotice) return 'head';
    if (this.canDirectorApproveNotice) return 'director';
    if (this.isNoticeDirectorActor && this.isNoticeEofficeStage) return 'director';
    if (this.isNoticeOfficerActor) return 'officer';
    return 'viewer';
  }

  protected get canCreateNotice(): boolean {
    if (!(this.reviewRole === 'officer' && this.canHandleCase)) return false;
    return canCreateApprovalItem(this.noticeItems.map((item) => item.pipe));
  }

  protected get noticeCreateBlockedReason(): string {
    if (!(this.reviewRole === 'officer' && this.canHandleCase)) return '';
    if (this.canCreateNotice) return '';
    return 'รออนุมัติหรือปฏิเสธรายการปัจจุบันก่อนสร้างใหม่';
  }

  protected get noticeApprovalListRows(): ApprovalListRow[] {
    const canStore = this.reviewRole === 'officer' && this.canHandleCase;
    return this.noticeItems.map((item) =>
      toApprovalListRow({
        id: item.id,
        title: item.title || this.noticeDisplayName(item.files[0]?.name || '') || 'หนังสือแจ้งผลการตรวจ',
        date: item.noticedOn || item.pipeAt || '',
        stage: item.pipe,
        meta: this.docActionLabel(item.action),
        statusLabel: approvalListStatusLabel(item.pipe),
        statusTone: this.noticePipeTone(item.pipe),
        canEdit: this.canEditNoticeRow(item),
        canReview: this.canHeadApproveRow(item) || this.canDirectorApproveRow(item),
        canCancel: this.canCancelNoticeRow(item),
        canUpload: canStore && item.pipe === 'done',
        canDeliver: canStore && item.pipe === 'done' && (item.keptFiles || []).length > 0,
        keptFiles: (item.keptFiles || []).map((file, index) => {
          const edition = file.edition || 'final';
          const delivery = item.pipe === 'delivered' ? 'sent' : file.delivery || 'pending';
          return {
            id: `${item.id}-kept-${index}-${file.name}`,
            name: file.name,
            title: file.title || file.name,
            at: file.sentOn,
            href: file.href,
            edition,
            delivery,
          };
        }),
      }),
    );
  }

  protected onNoticeApprovalCreate(): void {
    if (!this.canCreateNotice) return;
    this.openNoticeForm();
  }

  protected onNoticeApprovalOpen(row: ApprovalListRow): void {
    this.openNoticeForm(row.id);
  }

  protected onNoticeApprovalHistory(row: ApprovalListRow): void {
    this.openNoticeHistory(row.id);
  }

  protected onNoticeApprovalEdit(row: ApprovalListRow): void {
    this.openNoticeForm(row.id);
  }

  protected onNoticeApprovalReview(row: ApprovalListRow): void {
    this.openNoticeForm(row.id);
  }

  protected onNoticeApprovalCancel(row: ApprovalListRow): void {
    const item = this.noticeItems.find((entry) => entry.id === row.id);
    if (item) this.cancelNoticeStatus(item);
  }

  protected onNoticeApprovalUpload(event: { row: ApprovalListRow; files: FileList }): void {
    if (!(this.reviewRole === 'officer' && this.canHandleCase)) return;
    const item = this.noticeItems.find((entry) => entry.id === event.row.id);
    if (!item || item.pipe !== 'done' || !event.files.length) return;
    const at = this.thaiToday();
    const added = [...event.files].map((file) => ({
      name: file.name,
      title: file.name.replace(/\.[^.]+$/, ''),
      sentOn: at,
      edition: 'final' as const,
      delivery: 'pending' as const,
    }));
    const historyAction = added.length === 1
      ? `แนบไฟล์สมบูรณ์ ${added[0].title || added[0].name}`
      : `แนบไฟล์สมบูรณ์ ${added.length} ฉบับ`;
    const historyEntry = {
      at: this.noticeStampNow(),
      by: this.noticeActorLabel(),
      action: historyAction,
    };
    this.noticeItems = this.noticeItems.map((entry) =>
      entry.id === item.id
        ? {
            ...entry,
            keptFiles: [...(entry.keptFiles || []), ...added],
            history: [...entry.history, historyEntry],
          }
        : entry,
    );
    if (this.activeNoticeId === item.id) {
      this.noticeHistory = [...this.noticeHistory, historyEntry];
    }
    writeDocNotice(this.docPayload(this.docSent));
    this.notice = 'saved';
    this.view.markForCheck();
  }

  protected onNoticeApprovalRemoveKept(event: { row: ApprovalListRow; file: { id: string; name: string } }): void {
    if (!(this.reviewRole === 'officer' && this.canHandleCase)) return;
    const item = this.noticeItems.find((entry) => entry.id === event.row.id);
    if (!item || item.pipe !== 'done') return;
    let next = (item.keptFiles || []).filter((file, index) => `${item.id}-kept-${index}-${file.name}` !== event.file.id);
    if (next.length === (item.keptFiles || []).length) {
      next = (item.keptFiles || []).filter((file) => file.name !== event.file.name);
    }
    const historyEntry = {
      at: this.noticeStampNow(),
      by: this.noticeActorLabel(),
      action: `ลบไฟล์สมบูรณ์ ${event.file.name}`,
    };
    this.noticeItems = this.noticeItems.map((entry) =>
      entry.id === item.id
        ? { ...entry, keptFiles: next, history: [...entry.history, historyEntry] }
        : entry,
    );
    if (this.activeNoticeId === item.id) {
      this.noticeHistory = [...this.noticeHistory, historyEntry];
    }
    writeDocNotice(this.docPayload(this.docSent));
    this.notice = 'saved';
    this.view.markForCheck();
  }

  protected onNoticeApprovalOpenKept(event: {
    row: ApprovalListRow;
    file: { name: string; title: string; at?: string; href?: string };
  }): void {
    const href = event.file.href || this.noticeKeptHref(event.row.id, event.file.name);
    if (href) {
      window.open(href, '_blank', 'noopener');
      return;
    }
    this.viewingMade = {
      id: `notice-kept-${event.row.id}-${event.file.name}`,
      kind: event.file.title || event.file.name,
      at: event.file.at || this.thaiToday(),
      fields: [
        { label: 'ไฟล์แนบ', value: event.file.name },
        { label: 'ชื่อเอกสาร', value: event.file.title || event.file.name },
        { label: 'รายการ', value: event.row.title },
      ],
    };
  }

  protected onNoticeApprovalDownloadKept(event: {
    row: ApprovalListRow;
    file: { name: string; title: string; at?: string; href?: string };
  }): void {
    const href = event.file.href || this.noticeKeptHref(event.row.id, event.file.name);
    if (href) {
      void this.downloadAssetFile(href, event.file.name);
      return;
    }
    this.onNoticeApprovalOpenKept(event);
  }

  /** เจ้าหน้าที่ยืนยันส่งฉบับสมบูรณ์ให้ผู้ยื่นแล้ว */
  protected onNoticeApprovalDeliver(row: ApprovalListRow): void {
    if (!(this.reviewRole === 'officer' && this.canHandleCase)) return;
    const item = this.noticeItems.find((entry) => entry.id === row.id);
    if (!item || item.pipe !== 'done' || !(item.keptFiles || []).length) return;
    const at = this.thaiToday();
    const by = this.signedPerson || this.officerName || 'เจ้าหน้าที่';
    const historyEntry = { at: `${at} · —`, by, action: 'ส่งฉบับสมบูรณ์ให้ผู้ยื่นแล้ว' };
    this.noticeItems = this.noticeItems.map((entry) =>
      entry.id === item.id
        ? {
            ...entry,
            pipe: 'delivered',
            pipeAt: at,
            sent: true,
            sentBy: by,
            history: [...entry.history, historyEntry],
            keptFiles: (entry.keptFiles || []).map((file) => ({ ...file, delivery: 'sent' as const })),
          }
        : entry,
    );
    if (this.activeNoticeId === item.id) {
      this.noticePipe = 'delivered';
      this.noticePipeAt = at;
      this.docSent = true;
      this.docSentBy = by;
      this.noticeHistory = [...this.noticeHistory, historyEntry];
    }
    writeDocNotice(this.docPayload(true));
    this.notice = 'saved';
    this.view.markForCheck();
  }

  private noticeKeptHref(itemId: string, fileName: string): string {
    const item = this.noticeItems.find((row) => row.id === itemId);
    const kept = (item?.keptFiles || []).find((file) => file.name === fileName);
    if (kept?.href) return kept.href;
    const file = (item?.files || []).find((row) => row.name === fileName);
    return file?.href || '';
  }

  protected get canReportNoticeToHead(): boolean {
    return this.docCanSend && this.noticePipe === 'draft' && this.reviewRole === 'officer';
  }

  protected get noticeWaitingHead(): boolean {
    return this.noticePipe === 'to-head' && !this.isNoticeHeadActor;
  }

  protected get canHeadApproveNotice(): boolean {
    return this.noticePipe === 'to-head' && this.isNoticeHeadActor;
  }

  protected get canDirectorApproveNotice(): boolean {
    return this.noticePipe === 'to-director' && this.isNoticeDirectorActor;
  }

  protected get canContinueNoticePipe(): boolean {
    return this.isNoticeOfficerActor || (this.isNoticeDirectorActor && this.isNoticeEofficeStage);
  }

  protected get canSendNoticeEoffice(): boolean {
    return this.noticePipe === 'eoffice' && this.canContinueNoticePipe;
  }

  protected get canMarkNoticeStamped(): boolean {
    return this.noticePipe === 'stamped' && this.canContinueNoticePipe;
  }

  protected get canPullNoticeSaraban(): boolean {
    return this.noticePipe === 'numbered' && this.canContinueNoticePipe;
  }

  protected get canAttachNumberedNotice(): boolean {
    return this.noticePipe === 'attach' && this.canContinueNoticePipe;
  }

  protected get canFinishNoticeLane(): boolean {
    return this.noticePipe === 'attach' && this.canContinueNoticePipe && !!this.noticeSaraban.trim();
  }

  protected get showNoticeEofficePanel(): boolean {
    return this.isNoticeEofficeStage && this.canContinueNoticePipe;
  }

  protected get noticeEofficePayload(): ApprovalEofficePayload {
    const subject =
      this.noticeLetter.find((field) => field.label === 'เรื่อง')?.value?.trim() ||
      this.docActionLabel(this.docAction);
    const to =
      this.noticeLetter.find((field) => field.label === 'เรียน')?.value?.trim() ||
      'ผู้ยื่นคำขอ';
    const ref =
      this.noticeLetter.find((field) => field.label === 'อ้างถึง')?.value?.trim() ||
      `คำขอเลขที่อ้างอิง ${this.refId}`;
    const letterDate =
      this.noticeLetter.find((field) => field.label === 'วันที่')?.value?.trim() ||
      this.docNoticedOn ||
      this.thaiToday();
    const fileNames = [
      ...this.noticeLetterVersions.map((row) => row.fileName || row.title),
      ...this.docFiles.map((file) => file.name),
    ].filter((name, index, all) => name && all.indexOf(name) === index);
    return {
      subject,
      from: 'กองปกป้องและตอบโต้ทางการค้า กรมการค้าต่างประเทศ',
      to,
      ref,
      letterDate,
      speed: 'ปกติ',
      secrecy: 'ปกติ',
      fileCount: fileNames.length,
      fileNames,
      caseRef: this.refId,
    };
  }

  protected get noticeEofficeLinkDetail(): string {
    if (this.noticeEofficeLink === 'sent') return this.noticeOfficeRef || 'ส่งเข้า e-Office แล้ว — รอ sync เลข';
    if (this.noticeEofficeLink === 'synced') return this.noticeOfficeRef || `sync แล้ว · ${this.noticeSaraban || '—'}`;
    if (this.noticeEofficeLink === 'error') return this.noticeOfficeRef || 'เชื่อม e-Office ไม่ได้ — กรอกเลขและแนบไฟล์เองได้';
    if (this.noticeEofficeLink === 'manual') return this.noticeOfficeRef || `ทำเองในระบบ · ${this.noticeSaraban || '—'}`;
    return 'ยังไม่ส่ง — กดส่ง Auto หรือกรอกเลขเองเมื่อเชื่อมไม่ได้';
  }

  /** @deprecated ใช้ท่อ eoffice แทน */
  protected get canConfirmNoticeFiles(): boolean {
    return this.canSendNoticeEoffice;
  }

  protected get canIssueNoticeNumber(): boolean {
    return this.canFinishNoticeLane;
  }

  protected canConfirmNoticeRow(item: NoticeItem): boolean {
    return item.pipe === 'eoffice' && (this.isNoticeOfficerActor || this.isNoticeDirectorActor);
  }

  protected canIssueNoticeRow(item: NoticeItem): boolean {
    return item.pipe === 'attach' && (this.isNoticeOfficerActor || this.isNoticeDirectorActor) && !!item.sarabanNo.trim();
  }

  protected canPullNoticeSarabanRow(item: NoticeItem): boolean {
    return item.pipe === 'numbered' && (this.isNoticeOfficerActor || this.isNoticeDirectorActor);
  }

  protected canMarkNoticeStampedRow(item: NoticeItem): boolean {
    return item.pipe === 'stamped' && (this.isNoticeOfficerActor || this.isNoticeDirectorActor);
  }

  protected canHeadApproveRow(item: NoticeItem): boolean {
    return item.pipe === 'to-head' && this.isNoticeHeadActor;
  }

  protected canDirectorApproveRow(item: NoticeItem): boolean {
    return item.pipe === 'to-director' && this.isNoticeDirectorActor;
  }

  protected canEditNoticeRow(item: NoticeItem): boolean {
    return item.pipe === 'draft' && !item.sent && this.isNoticeOfficerActor;
  }

  protected canCancelNoticeRow(item: NoticeItem): boolean {
    if (item.pipe === 'cancelled' || item.pipe === 'done' || item.pipe === 'delivered') return false;
    // ร่างค้างก็ยกเลิกได้ เพื่อปลดล็อกสร้างรายการใหม่
    if (item.pipe === 'draft') return this.isNoticeOfficerActor;
    return this.isNoticeOfficerActor || this.isNoticeHeadActor || this.isNoticeDirectorActor;
  }

  protected get noticeLaneDocs(): ApprovalLaneDoc[] {
    return this.noticeLetterVersions.map((row) => ({
      version: row.version,
      title: row.title,
      at: row.at,
      source: row.source,
      html: row.html,
      fileName: row.fileName,
    }));
  }

  protected onNoticeLaneAction(id: ApprovalLaneActionId): void {
    if (id === 'save-draft') this.saveNoticeForm();
    else if (id === 'send-head') this.reportNoticeToHead();
    else if (id === 'return-officer') this.returnNoticeToOfficer();
    else if (id === 'approve-head') this.approveNoticeByHead();
    else if (id === 'approve-director') this.approveNoticeByDirector();
    else if (id === 'send-eoffice') this.sendNoticeToEoffice();
    else if (id === 'mark-stamped') this.markNoticeStamped();
    else if (id === 'pull-number') this.pullNoticeSarabanFromEoffice();
    else if (id === 'attach-numbered') this.promptAttachNumberedNotice();
    else if (id === 'finish') this.finishNoticeLane();
  }

  protected reportNoticeToHead(): void {
    if (!this.canReportNoticeToHead) return;
    if (this.noticeLetterWordOpen) {
      this.captureNoticeLetterEditor();
      this.syncNoticeLetterFiles();
    } else {
      this.syncNoticeLetterFiles();
    }
    this.noticePipe = 'to-head';
    this.noticeReportBy = this.signedPerson || this.officerName || '';
    this.noticePipeAt = this.clockToday() || this.thaiToday();
    this.pushNoticeHistory('ส่งหัวหน้ากลุ่ม');
    this.persistActiveNotice(false);
    this.notice = 'saved';
    this.noticeFormOpen = false;
    this.noticeLetterWordOpen = false;
    this.noticeLetterTab = 'files';
  }

  protected approveNoticeByHead(): void {
    if (!this.canHeadApproveNotice) return;
    this.noticePipe = 'to-director';
    this.noticeHeadBy = this.signedPerson || this.officerName;
    this.noticePipeAt = this.thaiToday();
    this.pushNoticeHistory('หัวหน้ากลุ่มเห็นชอบ → ส่งผู้อำนวยการ');
    this.persistActiveNotice(false);
    this.noticeFormOpen = false;
    this.notice = 'saved';
  }

  protected approveNoticeByDirector(): void {
    if (!this.canDirectorApproveNotice) return;
    this.noticePipe = 'eoffice';
    this.noticeEofficeLink = 'idle';
    this.noticeOfficeRef = '';
    this.noticePipeAt = this.thaiToday();
    this.pushNoticeHistory('ผู้อำนวยการเห็นชอบ → รอส่ง e-Office');
    this.persistActiveNotice(false);
    // คงฟอร์มเปิดไว้ — ผอ. ส่ง e-Office / กรอกเลขเองต่อได้ทันที
    this.noticeFormOpen = true;
    this.notice = 'saved';
  }

  protected returnNoticeToOfficer(): void {
    if (!this.canHeadApproveNotice && !this.canDirectorApproveNotice) return;
    const from = this.noticePipe === 'to-director' ? 'ผู้อำนวยการ' : 'หัวหน้ากลุ่ม';
    this.noticePipe = 'draft';
    this.noticeReportBy = '';
    this.noticeHeadBy = '';
    this.noticeOfficeRef = '';
    this.noticeEofficeLink = 'idle';
    this.noticePipeAt = this.thaiToday();
    this.pushNoticeHistory(`${from}ส่งกลับเจ้าหน้าที่`);
    this.persistActiveNotice(false);
    this.noticeFormOpen = false;
    this.notice = 'saved';
  }

  /** บันทึกส่งออก e-Office — ยังไม่มีเลขในระบบ */
  protected sendNoticeToEoffice(): void {
    if (!this.canSendNoticeEoffice) return;
    this.noticePipe = 'stamped';
    this.noticeEofficeLink = 'sent';
    this.noticeOfficeRef = 'ส่ง e-Office แล้ว — รอประทับตรา/ลงนาม';
    this.noticeSaraban = '';
    this.noticePipeAt = this.thaiToday();
    this.pushNoticeHistory('ส่ง Auto เข้า e-Office แล้ว (ยังไม่มีเลข)');
    this.persistActiveNotice(false);
    this.notice = 'saved';
  }

  /** จำลองกรณีเชื่อม e-Office ไม่ได้ — เปิดช่องกรอกเลข/แนบไฟล์ */
  protected failNoticeEofficeLink(): void {
    if (!this.canContinueNoticePipe || !this.isNoticeEofficeStage) return;
    this.noticeEofficeLink = 'error';
    this.noticeOfficeRef = 'เชื่อม e-Office ไม่ได้ — กรอกเลขและแนบไฟล์เองได้';
    this.noticePipeAt = this.thaiToday();
    this.pushNoticeHistory('เชื่อม e-Office ไม่ได้ — ใช้โหมดกรอกเอง');
    this.persistActiveNotice(false);
    this.notice = 'saved';
  }

  /** ดึงเลข / sync จาก e-Office (หรือจำลอง sync สำเร็จ) */
  protected syncNoticeFromEoffice(): void {
    if (!this.canContinueNoticePipe) return;
    if (this.noticePipe === 'eoffice' || this.noticePipe === 'stamped') {
      this.noticePipe = 'numbered';
    }
    const no = this.noticeSaraban.trim() || this.filingSaraban || 'สบ.1605/2562';
    this.noticeSaraban = no;
    this.stampNoticeLetterSaraban(no);
    this.noticeEofficeLink = 'synced';
    this.noticeOfficeRef = `sync จาก e-Office · ${no}`;
    this.noticePipe = 'attach';
    this.noticePipeAt = this.thaiToday();
    this.pushNoticeHistory(`sync เลขสารบรรณ ${no} จาก e-Office — รอแนบไฟล์กลับระบบ`);
    this.persistActiveNotice(false);
    this.notice = 'saved';
  }

  /** กรอกเลข + แนบไฟล์เองเมื่อเชื่อมไม่ได้ หรือทำแทน sync */
  protected applyManualNoticeEoffice(payload: { letterNo: string; files: FileList | null }): void {
    if (!this.canContinueNoticePipe) return;
    const no = payload.letterNo.trim();
    if (!no) return;
    this.noticeSaraban = no;
    this.stampNoticeLetterSaraban(no);
    this.noticeEofficeLink = 'manual';
    this.noticeOfficeRef = `ทำเองในระบบ · ${no}`;
    if (payload.files?.length) {
      const sentOn = this.docNoticedOn || this.thaiToday();
      const files = [...payload.files].map((file) => ({
        name: file.name,
        title: file.name.replace(/\.[^.]+$/, '') || 'หนังสือแจ้งผล',
        sentOn,
      }));
      this.docFiles = [...this.docFiles, ...files];
      files.forEach((file, index) => {
        this.noticeLetterVersions = [
          ...this.noticeLetterVersions,
          {
            version: this.noticeLetterLatestVersion + index + 1,
            title: `${file.title} · ออกเลขแล้ว`,
            at: sentOn,
            html: '',
            source: 'upload',
            fileName: file.name,
          },
        ];
      });
    }
    this.noticePipe = 'attach';
    this.noticePipeAt = this.thaiToday();
    this.pushNoticeHistory(`กรอกเลข ${no} และแนบไฟล์เอง — รอจัดเก็บ/ส่งถึงผู้ยื่น`);
    this.persistActiveNotice(false);
    this.notice = 'saved';
  }

  protected markNoticeStamped(): void {
    if (!this.canMarkNoticeStamped) return;
    this.noticePipe = 'numbered';
    if (this.noticeEofficeLink === 'idle') this.noticeEofficeLink = 'sent';
    this.noticeOfficeRef = 'ประทับตรา/ลงนามแล้ว — รอออกเลข';
    this.noticePipeAt = this.thaiToday();
    this.pushNoticeHistory('ประทับตรา / ลงนามแล้ว — รอออกเลขสารบรรณ');
    this.persistActiveNotice(false);
    this.notice = 'saved';
  }

  protected attachSignedNoticeFiles(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!this.canAttachNumberedNotice && !this.canSendNoticeEoffice) return;
    const list = input.files;
    if (list?.length) {
      const sentOn = this.docNoticedOn || this.thaiToday();
      const files = [...list].map((file) => ({
        name: file.name,
        title: file.name.replace(/\.[^.]+$/, '') || 'หนังสือแจ้งผล',
        sentOn,
      }));
      this.docFiles = [...this.docFiles, ...files];
      if (this.canAttachNumberedNotice) {
        files.forEach((file, index) => {
          this.noticeLetterVersions = [
            ...this.noticeLetterVersions,
            {
              version: this.noticeLetterLatestVersion + index + 1,
              title: `${file.title} · ออกเลขแล้ว`,
              at: sentOn,
              html: '',
              source: 'upload',
              fileName: file.name,
            },
          ];
        });
      }
    }
    input.value = '';
    if (this.canAttachNumberedNotice && this.docFiles.length) {
      this.pushNoticeHistory('แนบไฟล์ที่ออกเลขแล้ว');
      this.persistActiveNotice(false);
    }
  }

  protected continueNoticeWithFiles(): void {
    if (this.canSendNoticeEoffice) this.sendNoticeToEoffice();
  }

  protected promptAttachNumberedNotice(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.doc,.docx';
    input.multiple = true;
    input.onchange = () => this.attachSignedNoticeFiles({ target: input } as unknown as Event);
    input.click();
  }

  protected pullNoticeSarabanFromEoffice(): void {
    if (!this.canPullNoticeSaraban && this.noticePipe !== 'numbered' && this.noticePipe !== 'stamped' && this.noticePipe !== 'eoffice') {
      return;
    }
    if (!this.canContinueNoticePipe) return;
    const no = this.noticeSaraban.trim() || this.filingSaraban || 'สบ.1605/2562';
    this.noticeSaraban = no;
    this.noticeEofficeLink = this.noticeEofficeLink === 'manual' ? 'manual' : 'synced';
    this.noticeOfficeRef = `e-Office · ${no}`;
    this.stampNoticeLetterSaraban(no);
    this.noticePipe = 'attach';
    this.noticePipeAt = this.thaiToday();
    this.pushNoticeHistory(`ออกเลขสารบรรณ ${no} — รอแนบไฟล์กลับระบบ`);
    this.persistActiveNotice(false);
    this.notice = 'saved';
  }

  protected pullNoticeSarabanRow(item: NoticeItem): void {
    this.activateNoticeItem(item.id);
    this.pullNoticeSarabanFromEoffice();
  }

  private stampNoticeLetterSaraban(no: string): void {
    this.noticeLetter = this.noticeLetter.map((field) =>
      field.label === 'ที่' ? { ...field, value: no } : field,
    );
    if (!this.noticeLetterHtml) return;
    const stamped = this.noticeLetterHtml.replace(
      /(<strong>\s*ที่\s*<\/strong>)([^<]*)/i,
      `$1 ${no}`,
    );
    this.noticeLetterHtml = stamped;
    const version = this.noticeLetterActiveVersion || this.noticeLetterLatestVersion;
    if (version) {
      this.noticeLetterVersions = this.noticeLetterVersions.map((row) =>
        row.version === version ? { ...row, html: stamped } : row,
      );
    }
  }

  /** จัดเก็บ / ส่งถึงผู้ยื่น หลังแนบไฟล์ออกเลขแล้ว */
  protected finishNoticeLane(): void {
    if (!this.canFinishNoticeLane) return;
    this.pushNoticeHistory(`จัดเก็บและส่งถึงผู้ยื่น · เลขสารบรรณ ${this.noticeSaraban}`);
    this.saveDocs(true);
    this.noticePipe = 'done';
    this.noticePipeAt = this.thaiToday();
    this.persistActiveNotice(true);
  }

  protected issueNoticeAndSend(): void {
    if (this.canPullNoticeSaraban) this.pullNoticeSarabanFromEoffice();
    this.finishNoticeLane();
  }

  protected openNoticeHistory(id = ''): void {
    if (id && id !== this.activeNoticeId) this.activateNoticeItem(id);
    this.noticeHistoryOpen = true;
  }

  protected closeNoticeHistory(): void {
    this.noticeHistoryOpen = false;
  }

  /** รายการ timeline สำหรับแสดงประวัติละเอียด */
  protected get noticeHistoryItems(): NoticeHistoryEntry[] {
    return this.noticeHistory.map((item) => ({ ...item }));
  }

  protected get noticeHistoryDetail(): string {
    const title = this.noticeItems.find((item) => item.id === this.activeNoticeId)?.title
      || this.noticeItemTitle()
      || 'แจ้งผลการตรวจ';
    return `${title} · ${this.noticeHistoryItems.length} รายการ`;
  }

  protected continueNoticeRow(item: NoticeItem): void {
    // เปิดฟอร์มให้ใช้แผง e-Office (auto / sync / กรอกเลข+แนบเอง) ไม่ส่งทันทีจากแถว
    this.openNoticeForm(item.id);
  }

  protected issueNoticeRow(item: NoticeItem): void {
    this.activateNoticeItem(item.id);
    this.issueNoticeAndSend();
  }

  /** ยกเลิกสถานะรายการ — หลังส่งแล้วอัปเดตสถานะให้ผู้ที่มีสิทธิ์เห็นด้วย */
  protected cancelNoticeStatus(item: NoticeItem): void {
    if (!this.canCancelNoticeRow(item)) return;
    this.activateNoticeItem(item.id);
    const wasSent = this.noticePipe === 'done' || this.docSent;
    const action = this.docAction;
    this.noticePipe = 'cancelled';
    this.docSent = false;
    this.noticePipeAt = this.thaiToday();
    this.pushNoticeHistory('ยกเลิกสถานะการแจ้งผล');
    this.persistActiveNotice(false);
    if (wasSent) {
      this.publishApplicantNotice(
        `ยกเลิกหนังสือแจ้งผลการตรวจ (${this.docActionLabel(action)}) เลขที่อ้างอิง ${this.refId}`
          + (this.noticeSaraban ? ` · เลขรับสารบรรณ ${this.noticeSaraban}` : '')
          + '\nสถานะรายการนี้เป็น «ยกเลิกแล้ว»',
        'แจ้งผลการตรวจ',
      );
      if (action === 'amend' && this.caseStatus === 'revision' && !this.noticeItems.some((row) => row.id !== item.id && row.sent && row.pipe === 'done' && row.action === 'amend')) {
        writeCaseStatus('official');
        this.caseStatus = 'official';
      }
    }
    this.noticeFormOpen = false;
    this.notice = 'saved';
  }

  private noticeActorLabel(): string {
    return this.accounts.displayName || this.signedPerson || this.officerName || 'เจ้าหน้าที่';
  }

  private noticeStampNow(): string {
    const now = new Date();
    const day = this.clockToday() || this.thaiToday();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    return `${day} · ${hh}:${mm} น.`;
  }

  private pushNoticeHistory(action: string): void {
    const text = action.trim();
    if (!text) return;
    this.noticeHistory = [...this.noticeHistory, {
      at: this.noticeStampNow(),
      by: this.noticeActorLabel(),
      action: text,
    }];
  }

  private noticeItemTitle(): string {
    return this.docFiles[0]?.title
      || this.noticeLetter.find((field) => field.label === 'เรื่อง')?.value
      || this.noticeFileTitle();
  }

  private snapshotActiveNotice(): NoticeItem {
    const id = this.activeNoticeId || `notice-${Date.now()}`;
    if (!this.activeNoticeId) this.activeNoticeId = id;
    return {
      id,
      title: this.noticeItemTitle(),
      action: this.docAction,
      noticedOn: this.docNoticedOn,
      dueOn: this.docDueOn,
      note: this.docNote,
      files: this.docFiles.map((file) => ({ ...file })),
      letter: this.noticeLetter.map((field) => ({ ...field })),
      letterVersions: this.noticeLetterVersions.map((row) => ({ ...row })),
      gaps: this.docGaps.map((gap) => ({ ...gap })),
      sarabanNo: this.noticeSaraban,
      pipe: this.noticePipe,
      pipeAt: this.noticePipeAt,
      reportBy: this.noticeReportBy,
      headBy: this.noticeHeadBy,
      officeRef: this.noticeOfficeRef,
      eofficeLink: this.noticeEofficeLink,
      history: this.noticeHistory.map((item) => ({ ...item })),
      sent: this.docSent || this.noticePipe === 'done',
      sentBy: this.docSentBy,
      keptFiles: (this.noticeItems.find((item) => item.id === id)?.keptFiles || []).map((file) => ({ ...file })),
    };
  }

  private flushActiveIntoItems(): void {
    if (!this.activeNoticeId && !this.docFiles.length && this.noticePipe === 'draft' && !this.noticeHistory.length) return;
    const snap = this.snapshotActiveNotice();
    const index = this.noticeItems.findIndex((item) => item.id === snap.id);
    this.noticeItems = index >= 0
      ? this.noticeItems.map((item, i) => (i === index ? snap : item))
      : [...this.noticeItems, snap];
  }

  private persistActiveNotice(sent: boolean): void {
    if (sent) {
      this.docSent = true;
      this.noticePipe = 'done';
    }
    this.flushActiveIntoItems();
    writeDocNotice(this.docPayload(sent || this.docSent));
  }

  private applyNoticeItem(item: NoticeItem): void {
    this.activeNoticeId = item.id;
    this.docAction = item.action;
    this.docNoticedOn = item.noticedOn || this.docNoticedOn;
    this.docDueOn = item.dueOn || this.docDueOn;
    this.docNote = item.note;
    this.docFiles = item.files.map((file) => ({ ...file }));
    if (item.letter.length) this.noticeLetter = item.letter.map((field) => ({ ...field }));
    this.noticeLetterVersions = (item.letterVersions || []).map((row) => ({ ...row }));
    this.noticeLetterActiveVersion = this.noticeLetterLatestVersion;
    const current = this.noticeLetterVersions.find((row) => row.version === this.noticeLetterActiveVersion);
    this.noticeLetterHtml = current?.html || '';
    this.noticeLetterWordOpen = false;
    this.noticeLetterTab = 'files';
    this.docGaps = item.gaps.map((gap) => ({ ...gap }));
    this.noticeSaraban = item.sarabanNo;
    this.noticePipe = item.pipe;
    this.noticePipeAt = item.pipeAt;
    this.noticeReportBy = item.reportBy;
    this.noticeHeadBy = item.headBy;
    this.noticeOfficeRef = item.officeRef;
    this.noticeEofficeLink = item.eofficeLink || this.deriveNoticeEofficeLink(item);
    this.noticeHistory = item.history.map((row) => ({ ...row }));
    this.docSent = item.sent || item.pipe === 'done' || item.pipe === 'delivered';
    this.docSentBy = item.sentBy;
  }

  private deriveNoticeEofficeLink(item: NoticeItem): ApprovalEofficeLinkState {
    if (item.eofficeLink) return item.eofficeLink;
    const ref = item.officeRef || '';
    if (ref.includes('ทำเอง') || ref.includes('กรอก')) return 'manual';
    if (ref.includes('ไม่ได้') || ref.includes('ไม่สำเร็จ')) return 'error';
    if (ref.includes('sync') || (item.sarabanNo && (item.pipe === 'attach' || item.pipe === 'done' || item.pipe === 'numbered'))) {
      return 'synced';
    }
    if (ref.includes('ส่ง e-Office') || item.pipe === 'stamped' || item.pipe === 'numbered' || item.pipe === 'attach') {
      return 'sent';
    }
    return 'idle';
  }

  protected activateNoticeItem(id: string): void {
    if (id === this.activeNoticeId) return;
    this.flushActiveIntoItems();
    const found = this.noticeItems.find((item) => item.id === id);
    if (found) this.applyNoticeItem(found);
  }

  private startNewNoticeDraft(): void {
    this.flushActiveIntoItems();
    const id = `notice-${Date.now()}`;
    this.activeNoticeId = id;
    this.docAction = 'amend';
    this.docNoticedOn = this.clockToday() || this.thaiToday();
    this.docDueOn = this.thaiShift(14);
    this.docNote = '';
    this.docFiles = [];
    this.noticeLetterVersions = [];
    this.noticeLetterActiveVersion = 0;
    this.noticeLetterHtml = '';
    this.noticeLetterWordOpen = false;
    this.noticeLetterTab = 'files';
    this.docGaps = defaultNoticeGaps.map((gap) => ({ ...gap }));
    this.noticeLetter = noticeLetterFields(this.docAction, this.docNoticedOn, this.docDueOn, this.signedPerson);
    this.noticeSaraban = '';
    this.noticePipe = 'draft';
    this.noticePipeAt = '';
    this.noticeReportBy = '';
    this.noticeHeadBy = '';
    this.noticeOfficeRef = '';
    this.noticeEofficeLink = 'idle';
    this.noticeHistory = [];
    this.docSent = false;
    this.docSentBy = '';
    this.pushNoticeHistory('สร้างรายการแจ้งผลการตรวจ');
    this.flushActiveIntoItems();
    writeDocNotice(this.docPayload(false));
  }

  /** เติม timeline จากสถานะเก่าที่ยังไม่มีประวัติ */
  private seedNoticeHistory(saved: DocNotice): NoticeHistoryEntry[] {
    if (saved.history.length) return saved.history.map((item) => ({ ...item }));
    const seeded: NoticeHistoryEntry[] = [];
    const stamp = (day: string) => (day ? `${day} · —` : '—');
    if (saved.files.length || saved.pipe !== 'draft' || saved.sent) {
      seeded.push({
        at: stamp(saved.noticedOn || saved.pipeAt),
        by: saved.reportBy || saved.sentBy || 'เจ้าหน้าที่',
        action: 'บันทึกร่างแจ้งผลการตรวจ',
      });
    }
    if (saved.pipe === 'to-head' || saved.pipe === 'to-director' || saved.pipe === 'eoffice' || saved.pipe === 'stamped' || saved.pipe === 'numbered' || saved.pipe === 'attach' || saved.pipe === 'done' || saved.sent) {
      seeded.push({
        at: stamp(saved.pipeAt || saved.noticedOn),
        by: saved.reportBy || 'เจ้าหน้าที่',
        action: 'ส่งหัวหน้ากลุ่ม',
      });
    }
    if (saved.pipe === 'to-director' || saved.pipe === 'eoffice' || saved.pipe === 'stamped' || saved.pipe === 'numbered' || saved.pipe === 'attach' || saved.pipe === 'done' || saved.sent) {
      seeded.push({
        at: stamp(saved.pipeAt),
        by: saved.headBy || 'หัวหน้ากลุ่ม',
        action: 'หัวหน้ากลุ่มเห็นชอบ',
      });
    }
    if (saved.pipe === 'eoffice' || saved.pipe === 'stamped' || saved.pipe === 'numbered' || saved.pipe === 'attach' || saved.pipe === 'done' || saved.sent) {
      seeded.push({
        at: stamp(saved.pipeAt),
        by: saved.reportBy || saved.sentBy || 'เจ้าหน้าที่',
        action: 'ผู้อำนวยการเห็นชอบ / ส่ง e-Office',
      });
    }
    if (saved.pipe === 'done' || saved.sent) {
      seeded.push({
        at: stamp(saved.pipeAt || saved.noticedOn),
        by: saved.sentBy || saved.reportBy || 'เจ้าหน้าที่',
        action: 'จัดเก็บและส่งถึงผู้ยื่น',
      });
    }
    return seeded;
  }

  /**
   * ตัวอย่างแจ้งแก้ไขเพิ่มเติมครบตามรอบ AD1046 (ครั้งที่ 1–3)
   * ลบรายการที่ไม่เกี่ยว (ครบถ้วน / ร่างทดสอบ) แล้วแนบเอกสารทางการจริงให้ดู/โหลดได้
   */
  private ensureAmendNoticeSamples(force = false): void {
    const samples = this.buildAmendNoticeSamples();
    const ids = new Set(samples.map((item) => item.id));
    const hasAll = samples.every((sample) => this.noticeItems.some((item) => item.id === sample.id));
    const hasHref = this.noticeItems
      .filter((item) => ids.has(item.id))
      .every((item) => (item.keptFiles || []).some((file) => !!file.href));
    const pipesMatch = samples.every((sample) =>
      this.noticeItems.some((item) => item.id === sample.id && item.pipe === sample.pipe),
    );
    const hasFileStatus = this.noticeItems
      .filter((item) => ids.has(item.id))
      .every((item) => {
        const kept = item.keptFiles || [];
        const versions = item.letterVersions || [];
        const hasDraft = versions.some((row) => row.edition === 'draft');
        const hasFinal = versions.some((row) => row.edition === 'final');
        return (
          kept.length === 1 &&
          !!kept[0]?.edition &&
          !!kept[0]?.delivery &&
          !!kept[0]?.href &&
          versions.length >= 2 &&
          hasDraft &&
          hasFinal
        );
      });
    const hasUnrelated = this.noticeItems.some((item) => !ids.has(item.id));
    if (!force && hasAll && hasHref && pipesMatch && hasFileStatus && !hasUnrelated && this.noticeItems.length === samples.length) {
      // แต่ละครั้งเป็นรายการในตารางแล้ว — ไม่โชว์ซ้ำใน noticePasses
      if (this.noticePasses.length) {
        this.noticePasses = [];
        writeDocNotice(this.docPayload(true));
      }
      return;
    }

    const keepId = this.activeNoticeId && ids.has(this.activeNoticeId) ? this.activeNoticeId : samples[samples.length - 1]?.id;
    this.noticeItems = samples;
    const active = samples.find((item) => item.id === keepId) || samples[samples.length - 1];
    this.activeNoticeId = active.id;
    this.applyNoticeItem(active);
    // แต่ละครั้งเป็นรายการในตารางแล้ว — ไม่เก็บซ้ำใน noticePasses
    this.noticePasses = [];
    writeDocNotice(this.docPayload(true));
  }

  /** รอบแจ้งแก้ไข AD1046 — วันที่และไฟล์จากโฟลเดอร์เคสจริง */
  private buildAmendNoticeSamples(): NoticeItem[] {
    const officer = this.signedPerson || this.officerName || 'นางสาวจรีณา กิจส่งเสริมกุล';
    const rounds: Array<{
      pass: number;
      noticedOn: string;
      dueOn: string;
      letterName: string;
      letterHref: string;
      note: string;
    }> = [
      {
        pass: 1,
        noticedOn: '09/06/2563',
        dueOn: '09/07/2563',
        letterName: 'หนังสือแก้ไขคำขอ-ครั้งที่-1.pdf',
        letterHref: 'assets/samples/ad1046/notice/หนังสือแก้ไขคำขอ-ครั้งที่-1.pdf',
        note: 'ตรวจคำขอแล้วยังไม่ครบ — แจ้งแก้ไขเพิ่มเติมครั้งที่ 1 ตามหนังสือกรม 9 มิ.ย. 2563',
      },
      {
        pass: 2,
        noticedOn: '11/08/2563',
        dueOn: '11/09/2563',
        letterName: 'หนังสือแก้ไขคำขอ-ครั้งที่-2.pdf',
        letterHref: 'assets/samples/ad1046/notice/หนังสือแก้ไขคำขอ-ครั้งที่-2.pdf',
        note: 'ตรวจคำขอที่แก้ไขครั้งที่ 1 แล้วยังไม่ครบ — แจ้งแก้ไขเพิ่มเติมครั้งที่ 2 ตามหนังสือกรม 11 ส.ค. 2563',
      },
      {
        pass: 3,
        noticedOn: '29/09/2563',
        dueOn: '29/10/2563',
        letterName: 'แก้ไขข้อมูลคำขอ-ครั้งที่-3.pdf',
        letterHref: 'assets/samples/ad1046/notice/แก้ไขข้อมูลคำขอ-ครั้งที่-3.pdf',
        note: 'ตรวจคำขอที่แก้ไขครั้งที่ 2 แล้วยังไม่ครบ — แจ้งแก้ไขเพิ่มเติมครั้งที่ 3 ตามหนังสือกรม 29 ก.ย. 2563',
      },
    ];

    return rounds.map((round) => {
      const id = `sample-amend-${round.pass}`;
      const title = `หนังสือแจ้งแก้ไขปรับปรุงข้อมูลคำขอ ครั้งที่ ${round.pass}`;
      const letter = noticeLetterFields('amend', round.noticedOn, round.dueOn, officer).map((field) =>
        field.label === 'เรื่อง'
          ? { ...field, value: `แจ้งให้แก้ไขปรับปรุงข้อมูลคำขอให้ดำเนินการพิจารณาตอบโต้การทุ่มตลาด ครั้งที่ ${round.pass}` }
          : field.label === 'สิ่งที่ส่งมาด้วย'
            ? { ...field, value: `รายการแก้ไขปรับปรุงข้อมูลคำขอ (แบบปร. 1) ครั้งที่ ${round.pass}` }
            : field,
      );
      // ครั้งที่ 1–2 ส่งให้ผู้ยื่นแล้ว · ครั้งที่ 3 อนุมัติแล้วรอเจ้าหน้าที่ยืนยันส่ง
      const delivered = round.pass < 3;
      const delivery = delivered ? ('sent' as const) : ('pending' as const);
      // ฉบับร่าง = ไฟล์ที่ส่งขออนุมัติ · ฉบับสมบูรณ์ = ไฟล์เก็บหลังอนุมัติ (ครั้งละ 1)
      const draftName = `หนังสือแจ้งแก้ไขปรับปรุงข้อมูลคำขอ-ครั้งที่-${round.pass}-ร่าง.pdf`;
      const draftFile = {
        name: draftName,
        title: `${title} · ฉบับร่าง`,
        sentOn: round.noticedOn,
        href: round.letterHref,
        edition: 'draft' as const,
        delivery: 'pending' as const,
      };
      const letterFile = {
        name: round.letterName,
        title,
        sentOn: round.noticedOn,
        href: round.letterHref,
        edition: 'final' as const,
        delivery,
      };
      const history: NoticeHistoryEntry[] = [
        { at: `${round.noticedOn} · —`, by: officer, action: 'สร้าง/แนบฉบับร่างหนังสือแจ้งผล' },
        { at: `${round.noticedOn} · —`, by: officer, action: 'ส่งหัวหน้ากลุ่ม — ขออนุมัติฉบับร่าง' },
        { at: `${round.noticedOn} · —`, by: 'หัวหน้ากลุ่ม', action: 'หัวหน้ากลุ่มเห็นชอบ' },
        { at: `${round.noticedOn} · —`, by: officer, action: 'ผู้อำนวยการเห็นชอบ / ส่ง e-Office' },
        { at: `${round.noticedOn} · —`, by: officer, action: 'อนุมัติแล้ว — แนบไฟล์ฉบับสมบูรณ์' },
        ...(delivered
          ? [{ at: `${round.noticedOn} · —`, by: officer, action: 'ส่งฉบับสมบูรณ์ให้ผู้ยื่นแล้ว' }]
          : []),
      ];
      return {
        id,
        title,
        action: 'amend' as const,
        noticedOn: round.noticedOn,
        dueOn: round.dueOn,
        note: round.note,
        files: [draftFile, letterFile],
        letter,
        letterVersions: [
          {
            version: 1,
            title: `${title} · ฉบับร่าง`,
            at: `${round.noticedOn} · 08:30 น.`,
            html: '',
            source: 'upload' as const,
            fileName: draftName,
            edition: 'draft' as const,
          },
          {
            version: 2,
            title: `${title} · ฉบับสมบูรณ์`,
            at: `${round.noticedOn} · 09:00 น.`,
            html: '',
            source: 'upload' as const,
            fileName: round.letterName,
            edition: 'final' as const,
          },
        ],
        gaps: defaultNoticeGaps.map((gap) => ({ ...gap })),
        sarabanNo: `สบ.16${round.pass}0/2563`,
        pipe: (delivered ? 'delivered' : 'done') as NoticeItem['pipe'],
        pipeAt: round.noticedOn,
        reportBy: officer,
        headBy: 'หัวหน้ากลุ่ม',
        officeRef: `sync e-Office · สบ.16${round.pass}0/2563`,
        eofficeLink: 'synced' as const,
        history,
        sent: true,
        sentBy: officer,
        keptFiles: [letterFile],
      };
    });
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
    if (this.docSent || this.noticePipeLocked) return;
    this.docGaps = [...this.docGaps, { place: '', title: '', detail: '' }];
    if (!this.docSent) writeDocNotice(this.docPayload(false));
  }

  protected setGap(index: number, key: keyof DocGap, value: string): void {
    if (this.noticePipeLocked) return;
    this.docGaps = this.docGaps.map((gap, item) => item === index ? { ...gap, [key]: value } : gap);
    if (this.docAction !== 'complete') this.applyGapBody();
    if (!this.docSent) writeDocNotice(this.docPayload(false));
  }

  protected removeGap(index: number): void {
    if (this.docSent || this.noticePipeLocked) return;
    this.docGaps = this.docGaps.filter((_, item) => item !== index);
    if (this.docAction !== 'complete') this.applyGapBody();
    if (!this.docSent) writeDocNotice(this.docPayload(false));
  }

  /**
   * ครั้งแก้ไขที่แจ้งผลต้องยึด — เสมอใช้ครั้งล่าสุดที่ผู้ยื่นยื่นเข้ามา
   * (รอบยื่น 1 = แบบคำขอ, รอบ 2+ = แก้ไขครั้งที่ round-1)
   */
  protected noticeSourceRound(): number {
    return this.latestAmendPassNo();
  }

  /** ครั้งที่แก้ไขล่าสุดจากรอบยื่น (เช่น รอบยื่น 4 = แก้ไขครั้งที่ 3) */
  protected latestAmendPassNo(): number {
    const latestFiling = Math.max(
      1,
      this.bundleRoundNo,
      ...this.rounds.map((round) => round.round),
      ...this.bundleRoundOptions.map((row) => row.round),
    );
    return Math.max(1, latestFiling <= 1 ? 1 : latestFiling - 1);
  }

  /** ลำดับครั้งแจ้งผลครั้งนี้ (ไม่ใช่ครั้งแก้ไข) */
  protected noticeIssueNo(): number {
    return Math.max(1, this.noticePasses.length + 1);
  }

  private amendHtmlForRound(round: number): string {
    try {
      const raw = sessionStorage.getItem(`${this.bundleAmendKey}-${round}`) || '';
      if (raw && !this.amendHtmlIsEmpty(raw)) {
        if (/<[a-z][\s\S]*>/i.test(raw)) return raw;
        return raw
          .split('\n')
          .map((line) => `<p>${this.escapeHtml(line) || '<br>'}</p>`)
          .join('');
      }
    } catch {
      /* ignore */
    }
    if (round === this.bundleRoundNo && this.bundleAmendText && !this.amendHtmlIsEmpty(this.bundleAmendText)) {
      return this.bundleAmendText;
    }
    if (round === 1) return this.amendSampleHtml();
    return '';
  }

  /** สรุปประเด็นจากเนื้อหาแก้ไขคำขอของรอบนั้น (เน้นรายการที่มีป้ายเพิ่ม/แก้ไข หรือ AI แนะนำ) */
  private gapsFromAmendHtml(html: string): DocGap[] {
    if (!html || this.amendHtmlIsEmpty(html)) return [];
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const gaps: DocGap[] = [];
    const seen = new Set<string>();
    for (const node of Array.from(doc.body.querySelectorAll('p, li'))) {
      const el = node as HTMLElement;
      const raw = (el.textContent || '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
      if (!raw) continue;
      if (/^(รายละเอียด|อ้างอิง|กองปกป้อง)/.test(raw)) continue;
      if (/^\d+\.\s+ข้อมูล/.test(raw) && raw.length < 80) continue;
      const marked =
        el.hasAttribute('data-amend-by') ||
        el.hasAttribute('data-amend-edit-by') ||
        el.getAttribute('data-ai-suggest') === '1';
      const actionable = /(ให้|ขอให้|แก้ไข|ตรวจสอบ|ชี้แจง|เพิ่ม|แนบ|ปรับปรุง)/.test(raw);
      const numbered = /^(?:\d+(?:\.\d+)*)\b/.test(raw) || !!el.querySelector('strong');
      if (!marked && !(actionable && numbered)) continue;

      const strong = (el.querySelector('strong')?.textContent || '').replace(/\s+/g, ' ').trim();
      let body = raw;
      if (strong && body.startsWith(strong)) body = body.slice(strong.length).trim();
      body = body.replace(/^[:：]\s*/, '');
      if (!body) continue;

      const place = strong || (raw.match(/^(\d+(?:\.\d+)*(?:\s*ข้อ\s*[\d.]+)?)/)?.[1] || '').trim();
      const title = body.length > 140 ? `${body.slice(0, 137).trim()}…` : body;
      const detailBits: string[] = [];
      if (el.getAttribute('data-ai-suggest') === '1') {
        const hint = (el.getAttribute('title') || '').trim();
        if (hint && !hint.startsWith('เพิ่มโดย') && !hint.startsWith('แก้ไขโดย')) detailBits.push(hint);
      }
      const by = el.dataset['amendBy'] || '';
      const at = el.dataset['amendAt'] || '';
      const editBy = el.dataset['amendEditBy'] || '';
      const editAt = el.dataset['amendEditAt'] || '';
      if (by) detailBits.push(`เพิ่มโดย ${by}${at ? ` · ${at}` : ''}`);
      if (editBy) detailBits.push(`แก้ไขโดย ${editBy}${editAt ? ` · ${editAt}` : ''}`);
      if (!detailBits.length && body.length > 140) detailBits.push(body);

      const key = `${place}|${title}`;
      if (seen.has(key)) continue;
      seen.add(key);
      gaps.push({ place, title, detail: detailBits.join(' · ') });
    }
    const preferred = gaps.filter((gap) => /AI|เพิ่มโดย|แก้ไขโดย/.test(gap.detail) || gap.detail.includes('AI'));
    // รายการที่มีป้ายในแก้ไขคำขอมาก่อน แล้วเติมรายการอื่นให้พอสำหรับหนังสือ
    const ranked = [
      ...gaps.filter((gap) => preferred.includes(gap)),
      ...gaps.filter((gap) => !preferred.includes(gap)),
    ];
    return ranked.slice(0, 12);
  }

  protected assistNotice(): void {
    if (this.docSent || this.noticePipeLocked) return;
    this.prepareNoticeLetterAiSource();
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
      'รายชื่อผู้ผลิต': 4,
      'รายชื่อผู้ผลิตหลัก': 6,
      'กำลังการผลิตและปริมาณการผลิต': 6,
      'ปริมาณความต้องการใช้ภายในประเทศ': 5,
      'จุดที่ข้อมูลยังไม่ครบ': 5,
      'สรุปที่นำไปใช้': 5,
    };
    const written = field.value ? field.value.split('\n').length : 0;
    return Math.min(10, Math.max(room[field.label] ?? 3, written));
  }

  protected agencyLead(item: MadeDoc): string {
    const topic = item.fields.find((field) => field.label === 'เรื่อง' || field.label === 'ชื่อแบบ' || field.label === 'วัตถุประสงค์' || field.label === 'ชื่อรายงาน');
    return topic?.value.split('\n')[0] || item.kind;
  }

  /** อ่านค่าฟิลด์จากเอกสารที่สร้างในระบบ */
  protected madeField(item: MadeDoc | null | undefined, label: string): string {
    return item?.fields.find((field) => field.label === label)?.value.trim() || '';
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

  protected noticeFormFull = false;
  /** หนังสือแจ้งผล — แนวเดียวกับร่างวาระ */
  protected noticeLetterVersions: NoticeLetterVersion[] = [];
  protected noticeLetterActiveVersion = 0;
  protected noticeLetterHtml = '';
  protected noticeLetterEmpty = true;
  protected noticeLetterWordOpen = false;
  protected noticeLetterTab: 'files' | 'editor' = 'files';
  protected noticeLetterAiBusy = false;
  protected noticeLetterZoom = 100;
  protected noticeLetterFitScale = 1.25;
  protected noticeLetterPageFrames: { n: number; top: number; height: number }[] = [{ n: 1, top: 0, height: 1123 }];
  private noticeLetterLayoutRaf = 0;
  private readonly noticeLetterZoomBase = 1.25;
  private readonly noticeLetterZoomSteps = [50, 75, 100, 125, 150, 200];
  @ViewChild('noticeLetterEditor') private noticeLetterEditorRef?: ElementRef<HTMLElement>;
  @ViewChild('noticeLetterStage') private noticeLetterStageRef?: ElementRef<HTMLElement>;

  protected openNoticeForm(id = ''): void {
    if (id) {
      // เปิดรายการตัวอย่าง — ให้มีฉบับร่าง + ฉบับสมบูรณ์ครบก่อนแสดง
      if (id.startsWith('sample-amend-')) {
        this.activeNoticeId = id;
        this.ensureAmendNoticeSamples(true);
      }
      const row = this.noticeItems.find((item) => item.id === id);
      if (row) {
        this.activateNoticeItem(id);
        this.editingId = id;
      } else {
        const found = this.madeDocs.find((item) => item.id === id);
        if (!found) return;
        this.editingId = id;
        const fresh = noticeLetterFields(this.docAction, this.docNoticedOn, this.docDueOn, this.signedPerson);
        this.noticeLetter = fresh.map((field) => ({ ...field, value: found.fields.find((item) => item.label === field.label)?.value ?? '' }));
      }
    } else {
      if (!this.canCreateNotice) return;
      this.startNewNoticeDraft();
      this.editingId = this.activeNoticeId;
    }
    this.noticeLetterWordOpen = false;
    this.noticeLetterTab = 'files';
    this.noticeFormFull = false;
    this.noticeFormOpen = true;
    this.view.markForCheck();
  }

  protected toggleNoticeFormFull(): void {
    this.noticeFormFull = !this.noticeFormFull;
  }

  protected closeNoticeForm(): void {
    if (this.noticeLetterWordOpen) {
      this.captureNoticeLetterEditor();
      this.syncNoticeLetterFiles();
    }
    this.noticeLetterWordOpen = false;
    this.noticeLetterTab = 'files';
    this.noticeFormOpen = false;
    this.noticeFormFull = false;
    this.editingId = '';
  }

  protected saveNoticeForm(): void {
    if (!this.canReviewDocs || !this.noticeEvidenceReady) return;
    if (this.noticeLetterWordOpen) {
      this.captureNoticeLetterEditor();
      this.syncNoticeLetterFiles();
    } else {
      this.syncNoticeLetterFiles();
    }
    if (!this.docSent) {
      this.pushNoticeHistory(this.editingId ? 'แก้ไขร่างแจ้งผลการตรวจ' : 'บันทึกร่างแจ้งผลการตรวจ');
      this.persistActiveNotice(false);
    }
    this.noticeLetterWordOpen = false;
    this.noticeLetterTab = 'files';
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
    this.pushNoticeHistory(files.length === 1 ? `แนบไฟล์ ${files[0].title || files[0].name}` : `แนบไฟล์ ${files.length} ฉบับ`);
    writeDocNotice(this.docPayload(this.docSent));
  }

  private pushExtraFiles(list: FileList | null | undefined): void {
    const kind = this.filePop === 'committee' ? 'พิจารณาของคณะกรรมการ'
      : this.filePop === 'inquiry' ? 'เปิดไต่สวน'
      : this.filePop === 'prelim' ? 'ผลขั้นต้น'
      : this.filePop === 'draft' ? 'ร่างผลสิ้นสุด'
      : this.filePop === 'final' ? 'ผลสิ้นสุด'
      : this.editionKindAt() || this.workDocs[this.docPart]?.title;
    if (!kind || !list?.length) return;
    const sentOn = this.filePop === 'committee' ? (this.committeeAt || '05/06/2562')
      : this.filePop === 'inquiry' ? (this.inquiryNoticeOn || '10/06/2562')
      : this.filePop === 'prelim' ? (this.prelimOn || '20/08/2562')
      : this.filePop === 'draft' ? (this.draftOn || '15/10/2562')
      : this.filePop === 'final' ? (this.finalOn || '20/12/2562')
      : kind === 'สรุปข้อมูลจากหน่วยงานที่เกี่ยวข้อง' ? '28/05/2562'
      : (this.docNoticedOn || '20/05/2562');
    const files = [...list].map((file) => ({ kind, name: file.name, title: file.name.replace(/\.[^.]+$/, ''), sentOn }));
    this.extraFiles = [...this.extraFiles, ...files];
    this.writeExtraFiles();
  }

  protected openExtraFile(file: { name: string; title: string; sentOn: string }): void {
    this.viewingMade = {
      id: `extra-${file.name}`,
      kind: file.title || file.name,
      at: file.sentOn,
      fields: [
        { label: 'ชื่อเอกสาร', value: file.title || file.name },
        { label: 'ชื่อไฟล์', value: file.name },
        { label: 'วันที่บันทึก', value: file.sentOn },
        { label: 'เนื้อความ', value: `เอกสาร${file.title || file.name} ของคำขอเลขที่อ้างอิง ${this.refId}`, long: true },
      ],
    };
  }

  protected seedOpenEditionSamples(): void {
    this.ensureOpenEditionFiles();
  }

  protected seedClosedEditionSamples(): void {
    this.ensureClosedEditionFiles();
  }

  protected seedEditionSamples(): void {
    if (this.completeBundle === 'closed' || this.docPart === this.closedEditionPart) {
      this.ensureClosedEditionFiles();
      return;
    }
    this.ensureOpenEditionFiles();
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
    const sample =
      this.agencySummaryReplies.find((item) => item.name === file.name) ||
      this.agencySummarySamples.find((item) => item.name === file.name) ||
      this.agencyLetterSamples.find((item) => item.name === file.name) ||
      this.preSamples.find((item) => item.name === file.name);
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
  /** หดรายการเอกสารคล้ายเมนูหลัก เพื่อขยายพื้นที่เนื้อหา */
  protected docListCollapsed = false;
  /** หดสารบัญส่วนของแบบในเล่มรวม */
  protected bundleTocCollapsed = false;
  /** หดสารบัญหน้าแบบฟอร์ม ปร. */
  protected formTocCollapsed = false;

  protected toggleDocSearch(): void {
    this.docSearchOpen = !this.docSearchOpen;
    if (!this.docSearchOpen) this.docQuery = '';
  }

  protected toggleDocList(): void {
    this.docListCollapsed = !this.docListCollapsed;
    if (this.docListCollapsed) {
      this.docSearchOpen = false;
      this.docQuery = '';
    }
  }

  protected toggleBundleToc(): void {
    this.bundleTocCollapsed = !this.bundleTocCollapsed;
  }

  protected toggleFormToc(): void {
    this.formTocCollapsed = !this.formTocCollapsed;
  }

  protected toggleBundleViewerFull(): void {
    this.bundleViewerFull = !this.bundleViewerFull;
    if (this.bundleViewerFull) {
      this.docListCollapsed = true;
      this.bundleTocCollapsed = true;
    }
    window.setTimeout(() => {
      this.syncBundleFitScale();
      this.scheduleAmendWordLayout();
    }, 0);
  }

  protected zoomBundle(dir: 1 | -1): void {
    const at = this.bundleZoomSteps.indexOf(this.bundleZoom);
    const index = at < 0 ? this.bundleZoomSteps.indexOf(100) : at;
    const next = this.bundleZoomSteps[Math.min(this.bundleZoomSteps.length - 1, Math.max(0, index + dir))];
    this.bundleZoom = next ?? 100;
    this.syncBundleFitScale();
    this.scheduleAmendWordLayout();
  }

  /** 100% = กระดาษกว้างเต็มพื้นที่อ่าน (เหมือนหน้าร่างวาระ) */
  protected get bundleZoomCss(): number {
    return (this.bundleZoom / 100) * Math.max(this.bundleFitScale, this.bundleZoomBase);
  }

  protected get canZoomBundleIn(): boolean {
    return this.bundleZoom < this.bundleZoomSteps[this.bundleZoomSteps.length - 1];
  }

  protected get canZoomBundleOut(): boolean {
    return this.bundleZoom > this.bundleZoomSteps[0];
  }

  private syncBundleFitScale(): void {
    const stage =
      this.amendCommentStageRef?.nativeElement ||
      (document.querySelector(
        '.bundle-viewer .bundle-reader--comments, .bundle-viewer .bundle-reader, .bundle-viewer .word-print-canvas',
      ) as HTMLElement | null);
    if (!stage) return;
    // clientWidth ถูก CSS zoom ย่อ — ใช้ความกว้าง layout จริงก่อนซูม
    const layoutW = stage.offsetWidth || stage.clientWidth;
    const paperW = this.measureMmAsPx(210);
    const avail = Math.max(320, layoutW - 56);
    this.bundleFitScale = Math.max(1.25, avail / paperW);
  }

  protected docMatches(title: string): boolean {
    const query = this.docQuery.trim();
    return !query || title.includes(query);
  }

  /** ดัชนีส่วนแบบคำขอฉบับเปิดเผย (ถัดจากแจ้งผลการตรวจ) */
  protected get openEditionPart(): number {
    return this.workDocs.length + 1;
  }

  /** ดัชนีส่วนแบบคำขอฉบับปกปิด */
  protected get closedEditionPart(): number {
    return this.workDocs.length + 2;
  }

  /** ดัชนีพิจารณาของคณะกรรมการฯ */
  protected get committeePart(): number {
    return this.workDocs.length + 3;
  }

  /** ดัชนีขอขยายเวลาในรายการเอกสาร (กลุ่มคำขอผู้ยื่น) */
  protected get extendPart(): number {
    return this.workDocs.length + 4;
  }

  /** ดัชนีร่างวาระในรายการเอกสาร (คู่ขนานตอนตรวจเอกสาร) */
  protected get draftAgendaPart(): number {
    return this.workDocs.length + 5;
  }

  /** ดัชนีเสนออนุมัติ (บันทึกเสนอ อธ.) ในรายการเอกสาร */
  protected get approvalSubmitPart(): number {
    return this.workDocs.length + 6;
  }

  /** ดัชนีวาระพิจารณาคำขอเปิดไต่สวน (อนุ) — content แบบวาระหลัก หลังเสนออนุมัติ */
  protected get subAgendaPart(): number {
    return this.workDocs.length + 7;
  }

  /**
   * ฝั่งเจ้าหน้าที่: ส่งวาระ/PPT ให้ บท. + มติที่ประชุม — เปิดใช้
   * หน้าแสดงผลฝั่งกลุ่ม บท. (inbox/รับไฟล์) ยังไม่ทำ — ค่อยทำทีหลัง
   */
  protected readonly meetingBureauFlowEnabled = true;

  /** ดัชนีส่งวาระอนุ + PPT ให้กลุ่ม บท. — หลังมีวาระอนุ ก่อนวันประชุม */
  protected get meetingPackPart(): number {
    return this.workDocs.length + 8;
  }

  /** ดัชนีมติที่ประชุมอนุ — หลังส่งแพ็กให้ บท. (ยังไม่ไป ทตอ. / pre-notify / ค่าธรรมเนียม) */
  protected get meetingResolutionPart(): number {
    return this.workDocs.length + 9;
  }

  protected isAgencyWorkDoc(title: string): boolean {
    return (
      title === 'หนังสือขอข้อมูลหน่วยงานที่เกี่ยวข้อง' ||
      title === 'สรุปข้อมูลจากหน่วยงานที่เกี่ยวข้อง'
    );
  }

  protected isPreQnWorkDoc(title: string): boolean {
    return title.startsWith('Pre-questionnaire');
  }

  /** แสดงหัวกลุ่ม TOC เมื่อมีรายการในกลุ่มผ่านตัวกรองค้นหา */
  protected docGroupVisible(group: 'applicant' | 'agency' | 'preqn' | 'agenda'): boolean {
    if (group === 'applicant') {
      return (
        this.docMatches(this.bundleDocTitle) ||
        this.docMatches('แบบคำขอ') ||
        this.docMatches('แบบคำขอรวมเล่ม') ||
        this.docMatches('แบบยื่นคำขอรวมเล่ม') ||
        this.docMatches('แจ้งผลการตรวจ') ||
        this.docMatches('ขอขยายเวลา') ||
        this.docMatches('ขยายเวลา') ||
        this.docMatches(this.openEditionKind) ||
        this.docMatches('ฉบับเปิดเผย') ||
        this.docMatches('แบบคำขอฉบับเปิดเผย') ||
        this.docMatches(this.closedEditionKind) ||
        this.docMatches('ฉบับปกปิด') ||
        this.docMatches('แบบคำขอฉบับปกปิด')
      );
    }
    if (group === 'agency') {
      return this.workDocs.some((doc) => this.isAgencyWorkDoc(doc.title) && this.docMatches(doc.title));
    }
    if (group === 'agenda') {
      return (
        this.docMatches('วาระพิจารณาคำขอเปิดไต่สวน') ||
        this.docMatches('ร่างวาระ') ||
        this.docMatches('วาระเปิด') ||
        this.docMatches('วาระ') ||
        this.docMatches('เสนออนุมัติ') ||
        this.docMatches('บันทึกเสนอ') ||
        this.docMatches('เอกสารขออนุมัติ') ||
        this.docMatches('วาระอนุ') ||
        this.docMatches('(อนุ)') ||
        this.docMatches('ส่งวาระ') ||
        this.docMatches('ส่ง PPT') ||
        this.docMatches('กลุ่ม บท') ||
        this.docMatches('มติที่ประชุม') ||
        this.docMatches('มติคณะอนุ') ||
        this.docMatches('รายงานการประชุม')
      );
    }
    return this.workDocs.some((doc) => this.isPreQnWorkDoc(doc.title) && this.docMatches(doc.title));
  }

  private draftAgendaWorkspaceReady = false;

  /** เปิดวาระพิจารณาคำขอเปิดไต่สวนในหน้าตรวจเอกสาร — ไม่สลับแท็บ */
  protected pickDraftAgenda(): void {
    if (this.agencyWordOpen) {
      this.captureAgencySummaryEditor();
      this.agencyWordOpen = false;
    }
    if (this.approvalWordOpen) {
      this.captureApprovalEditor();
      this.writeApprovalComments();
      this.approvalWordOpen = false;
      this.approvalTab = 'files';
      this.restoreParkedAmendComments();
    }
    this.completeBundle = '';
    this.editingId = '';
    this.docShelf = 'files';
    this.docPart = this.draftAgendaPart;
    this.notice = null;
    if (!this.draftAgendaWorkspaceReady) {
      this.resetDraftAgendaWorkspace();
      this.draftAgendaWorkspaceReady = true;
    } else {
      this.loadDraftAgendaVersions();
    }
    const view = this.route.snapshot.queryParamMap.get('view');
    if (view === 'editor' && (this.draftAgendaVersions.length || this.draftAgendaWordOpen)) {
      this.pickDraftAgendaTab('editor');
    } else {
      this.draftAgendaTab = 'files';
      this.draftAgendaWordOpen = false;
    }
    this.syncFilingUrl();
  }

  protected get canOpenDraftAgendaEditor(): boolean {
    return this.draftAgendaWordOpen || this.draftAgendaVersions.some((row) => row.source === 'created' || row.source === 'ai');
  }

  protected pickDraftAgendaTab(tab: 'files' | 'editor'): void {
    if (tab === 'editor') {
      if (this.draftAgendaWordOpen) {
        this.draftAgendaTab = 'editor';
        this.syncFilingUrl();
        return;
      }
      const editable = [...this.draftAgendaVersions].reverse().find((row) => row.source === 'created' || row.source === 'ai');
      if (editable) {
        this.openDraftAgendaVersion(editable.version);
        return;
      }
      return;
    }
    this.captureDraftAgendaEditor();
    this.writeDraftAgendaComments();
    this.draftAgendaWordOpen = false;
    this.draftAgendaTab = 'files';
    this.draftAgendaViewerFull = false;
    this.commentPinMode = false;
    this.restoreParkedAmendComments();
    this.syncFilingUrl();
  }

  /** ตัดแฟ้มตัวอย่างออก — คงเวอร์ชันที่ผู้ใช้สร้าง/อัปเดตไว้ */
  private resetDraftAgendaWorkspace(): void {
    this.draftAgendaWordOpen = false;
    this.draftAgendaTab = 'files';
    this.draftAgendaVersionConfirm = null;
    const samples = new Set(this.agendaSampleCatalog.draft.map((file) => file.name));
    this.inquiryAgendaFiles = this.inquiryAgendaFiles.filter(
      (file) => (file.lane || 'tdc') !== 'draft' || (!samples.has(file.name) && file.source !== 'sample'),
    );
    this.loadDraftAgendaVersions();
    this.writeInquiry(true);
  }

  /** ไฟล์ที่สร้างหรืออัปเดตเอง — ไม่โชว์แฟ้มตัวอย่าง */
  protected get draftAgendaOwnFiles(): InquiryAgendaFile[] {
    return this.agendaLaneFiles('draft').filter((file) => file.source === 'upload' || file.source === 'created' || file.source === 'ai');
  }

  /** ไฟล์อัปโหลดที่ยังไม่ผูกเวอร์ชันในตารางร่างวาระ */
  protected get draftAgendaOrphanFiles(): InquiryAgendaFile[] {
    return this.draftAgendaOwnFiles.filter((file) => !file.version);
  }

  protected openDraftAgendaUpload(row: DraftAgendaVersion): void {
    if (row.source === 'created' || row.source === 'ai') {
      this.openDraftAgendaVersion(row.version);
      return;
    }
    const file =
      this.inquiryAgendaFiles.find((item) => item.lane === 'draft' && item.version === row.version) ||
      this.inquiryAgendaFiles.find((item) => item.lane === 'draft' && item.name === row.fileName);
    if (file) this.openEmbassyFile(file);
    this.draftAgendaTab = 'files';
    this.syncFilingUrl();
  }

  protected get draftAgendaNavOn(): boolean {
    return this.reviewTab === 'docs' && this.docPart === this.draftAgendaPart;
  }

  protected draftAgendaDot(): string {
    if (this.inquiryDraftAgendaDone) return 'assets/icons/por1-dot-done.svg';
    if (this.draftAgendaNavOn) return 'assets/icons/por1-dot-wait.svg';
    return 'assets/icons/por1-dot.svg';
  }

  protected fillDraftAgendaPack(): void {
    this.inquiryPart = 'draftAgenda';
    this.fillInquiryPack();
  }

  protected saveDraftAgendaFromDocs(): void {
    this.inquiryPart = 'draftAgenda';
    this.saveInquiryAgenda();
  }

  protected get draftAgendaLatestVersion(): number {
    return this.draftAgendaVersions.reduce((max, row) => Math.max(max, row.version), 0);
  }

  protected get draftAgendaVersionConfirmDetail(): string {
    const next = this.draftAgendaLatestVersion + 1;
    const mode =
      this.draftAgendaVersionConfirm === 'ai'
        ? 'AI ช่วยร่างตามรูปแบบตัวอย่างวาระพิจารณาคำขอเปิดไต่สวน'
        : 'สร้างเอกสารวาระพิจารณาคำขอเปิดไต่สวนใหม่ (หน้าว่าง)';
    return `มีเอกสารวาระพิจารณาคำขอเปิดไต่สวนเวอร์ชัน ${this.draftAgendaLatestVersion} อยู่แล้ว การ${mode}จะบันทึกเป็นเวอร์ชัน ${next} โดยเก็บเวอร์ชันเดิมไว้ครบ`;
  }

  protected requestCreateDraftAgendaDoc(): void {
    if (this.draftAgendaVersions.length) {
      this.draftAgendaVersionConfirm = 'create';
      return;
    }
    this.commitDraftAgendaVersion('created');
  }

  /** AI ช่วยร่าง — ถ้ายังไม่มีเอกสารให้สร้างหน้าว่างก่อน แล้วหมุนโหลด ~10 วิ ดึงรูปแบบจากตัวอย่าง */
  protected requestAiDraftAgenda(): void {
    if (this.draftAgendaAiBusy) return;
    if (this.draftAgendaWordOpen && this.draftAgendaActiveVersion) {
      this.startAiDraftAgendaFill();
      return;
    }
    if (this.draftAgendaVersions.length) {
      this.draftAgendaVersionConfirm = 'ai';
      return;
    }
    this.commitDraftAgendaVersion('created');
    this.startAiDraftAgendaFill();
  }

  protected onDraftAgendaVersionConfirm(action: string): void {
    const mode = this.draftAgendaVersionConfirm;
    this.draftAgendaVersionConfirm = null;
    if (action !== 'ยืนยัน' || !mode) return;
    this.commitDraftAgendaVersion('created');
    if (mode === 'ai') this.startAiDraftAgendaFill();
  }

  protected cancelDraftAgendaVersion(): void {
    this.draftAgendaVersionConfirm = null;
  }

  private commitDraftAgendaVersion(source: 'created' | 'ai'): void {
    this.inquiryPart = 'draftAgenda';
    const at = this.draftAgendaStamp();
    this.inquiryDraftAgendaAt = at;
    const version = this.draftAgendaLatestVersion + 1;
    const html = this.buildDraftAgendaBlankHtml();
    const title = `วาระพิจารณาคำขอเปิดไต่สวน · เวอร์ชัน ${version}`;
    const fileName = `วาระพิจารณาคำขอเปิดไต่สวน-v${version}.docx`;
    const entry: DraftAgendaVersion = { version, title, at, html, source, fileName };
    this.draftAgendaVersions = [...this.draftAgendaVersions, entry];
    this.writeDraftAgendaVersions();
    this.draftAgendaActiveVersion = version;
    this.draftAgendaHtml = html;
    this.parkAmendCommentsForDraft();
    this.draftAgendaEmpty = true;
    this.draftAgendaWordOpen = true;
    this.draftAgendaTab = 'editor';
    this.draftAgendaZoom = 100;
    this.loadDraftAgendaComments();
    this.inquiryAgendaFiles = [
      ...this.inquiryAgendaFiles,
      {
        name: fileName,
        title,
        sentOn: at,
        docId: `draft-agenda-v${version}`,
        lane: 'draft',
        version,
        source,
      },
    ];
    this.writeInquiry(true);
    this.notice = null;
    this.syncFilingUrl();
    window.setTimeout(() => this.fillDraftAgendaEditor(), 0);
  }

  /** โหลดตัวอย่างวาระจริง รออย่างน้อย 10 วิ แล้วใส่ใน editor */
  private startAiDraftAgendaFill(): void {
    if (this.draftAgendaAiBusy) return;
    if (!this.draftAgendaActiveVersion) {
      this.commitDraftAgendaVersion('created');
    }
    this.draftAgendaAiBusy = true;
    this.view.markForCheck();
    const minWait = new Promise<void>((resolve) => {
      window.setTimeout(resolve, 10000);
    });
    const fetchSample = fetch(this.draftAgendaSampleUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`sample ${res.status}`);
        return res.text();
      })
      .catch(() => this.buildDraftAgendaAiHtml(this.inquiryDraftAgendaAt.trim() || this.thaiToday()));
    Promise.all([fetchSample, minWait]).then(([html]) => {
      this.applyAiDraftAgendaHtml(typeof html === 'string' ? html : String(html));
      this.draftAgendaAiBusy = false;
      this.view.markForCheck();
    });
  }

  private applyAiDraftAgendaHtml(html: string): void {
    const version = this.draftAgendaActiveVersion || this.draftAgendaLatestVersion;
    const at = this.draftAgendaStamp();
    this.inquiryDraftAgendaAt = at;
    this.draftAgendaHtml = html;
    this.draftAgendaEmpty = this.amendHtmlIsEmpty(html);
    if (version) {
      this.draftAgendaVersions = this.draftAgendaVersions.map((row) =>
        row.version === version ? { ...row, html, at, source: 'ai' } : row,
      );
      this.writeDraftAgendaVersions();
      this.inquiryAgendaFiles = this.inquiryAgendaFiles.map((file) =>
        file.version === version && file.lane === 'draft' ? { ...file, source: 'ai', sentOn: at } : file,
      );
    }
    this.writeInquiry(true);
    this.notice = null;
    this.draftAgendaWordOpen = true;
    this.draftAgendaTab = 'editor';
    this.syncFilingUrl();
    window.setTimeout(() => this.fillDraftAgendaEditor(), 0);
  }

  protected uploadDraftAgendaFiles(event: Event): void {
    const input = event.target as HTMLInputElement;
    const list = input.files;
    if (!list?.length) return;
    const at = this.draftAgendaStamp();
    this.inquiryDraftAgendaAt = at;
    const added: InquiryAgendaFile[] = [];
    const versions: DraftAgendaVersion[] = [];
    [...list].forEach((file) => {
      const version = this.draftAgendaLatestVersion + versions.length + 1;
      const title = file.name.replace(/\.[^.]+$/, '');
      added.push({
        name: file.name,
        title: `${title} · เวอร์ชัน ${version}`,
        sentOn: at,
        docId: `draft-upload-${Date.now()}-${version}`,
        lane: 'draft',
        version,
        source: 'upload',
      });
      versions.push({
        version,
        title: `${title} · เวอร์ชัน ${version}`,
        at,
        html: `<p><strong>ไฟล์อัปโหลด</strong> ${file.name}</p><p>อัปโหลดเมื่อ ${at} — เปิดหรือดาวน์โหลดจากรายการเอกสาร</p>`,
        source: 'upload',
        fileName: file.name,
      });
    });
    this.draftAgendaVersions = [...this.draftAgendaVersions, ...versions];
    this.writeDraftAgendaVersions();
    this.inquiryAgendaFiles = [...this.inquiryAgendaFiles, ...added];
    this.draftAgendaActiveVersion = this.draftAgendaLatestVersion;
    this.inquiryDraftAgendaAt = at;
    this.inquiryDraftAgendaDone = true;
    input.value = '';
    this.writeInquiry(true);
    this.notice = null;
    this.draftAgendaTab = 'files';
    this.syncFilingUrl();
  }

  protected openDraftAgendaVersion(version: number): void {
    const row = this.draftAgendaVersions.find((item) => item.version === version);
    if (!row) return;
    this.parkAmendCommentsForDraft();
    this.draftAgendaActiveVersion = version;
    this.draftAgendaHtml = row.html;
    this.draftAgendaWordOpen = true;
    this.draftAgendaTab = 'editor';
    this.draftAgendaZoom = 100;
    this.loadDraftAgendaComments();
    this.syncFilingUrl();
    window.setTimeout(() => {
      this.fillDraftAgendaEditor();
      this.scheduleAmendWordLayout();
    }, 0);
  }

  protected closeDraftAgendaWord(): void {
    this.captureDraftAgendaEditor();
    this.writeDraftAgendaComments();
    this.draftAgendaWordOpen = false;
    this.draftAgendaTab = 'files';
    this.draftAgendaViewerFull = false;
    this.commentPinMode = false;
    this.restoreParkedAmendComments();
    this.syncFilingUrl();
  }

  protected zoomDraftAgenda(dir: 1 | -1): void {
    const at = this.draftAgendaZoomSteps.indexOf(this.draftAgendaZoom);
    const index = at < 0 ? this.draftAgendaZoomSteps.indexOf(100) : at;
    const next = this.draftAgendaZoomSteps[Math.min(this.draftAgendaZoomSteps.length - 1, Math.max(0, index + dir))];
    this.draftAgendaZoom = next ?? 100;
    this.scheduleAmendWordLayout();
  }

  /** 100% = กระดาษกว้างเต็มพื้นที่อ่าน (ชัดกว่าซูมเดิมมาก) */
  protected get draftAgendaZoomCss(): number {
    return (this.draftAgendaZoom / 100) * Math.max(this.draftAgendaFitScale, this.draftAgendaZoomBase);
  }

  protected get canZoomDraftAgendaIn(): boolean {
    return this.draftAgendaZoom < this.draftAgendaZoomSteps[this.draftAgendaZoomSteps.length - 1];
  }

  protected get canZoomDraftAgendaOut(): boolean {
    return this.draftAgendaZoom > this.draftAgendaZoomSteps[0];
  }

  protected toggleDraftAgendaViewerFull(): void {
    this.draftAgendaViewerFull = !this.draftAgendaViewerFull;
    if (this.draftAgendaViewerFull) {
      this.docListCollapsed = true;
    }
    this.scheduleDraftAgendaPageFrames();
  }

  private syncDraftAgendaFitScale(): void {
    const stage = this.draftAgendaStageRef?.nativeElement;
    if (!stage) return;
    const paperW = this.measureMmAsPx(210);
    const layoutW = stage.offsetWidth || stage.clientWidth;
    const avail = Math.max(320, layoutW - 56);
    // เต็มความกว้างพื้นที่อ่านที่ 100%
    this.draftAgendaFitScale = Math.max(1.25, avail / paperW);
  }

  /** บันทึกร่าง — เก็บไว้แก้ต่อ ไม่ปิด editor */
  protected saveDraftAgendaDraft(): void {
    this.persistDraftAgendaWord(false);
  }

  /** บันทึกเอกสาร — เก็บแล้วกลับแท็บไฟล์ */
  protected saveDraftAgendaWord(): void {
    this.persistDraftAgendaWord(true);
  }

  /** ดาวน์โหลดวาระพิจารณาคำขอเปิดไต่สวนจาก editor (เปิดด้วย Word ได้) */
  protected downloadDraftAgendaWord(): void {
    this.captureDraftAgendaEditor();
    const version = this.draftAgendaActiveVersion || this.draftAgendaLatestVersion || 1;
    const title = `วาระพิจารณาคำขอเปิดไต่สวน · เวอร์ชัน ${version}`;
    const fileName = `วาระพิจารณาคำขอเปิดไต่สวน-v${version}-${this.refId || filingRefId}.doc`;
    this.downloadEditorHtmlAsWord(fileName, title, this.draftAgendaHtml || '<p><br></p>');
  }

  /** แก้ชื่อเอกสารจากแถวที่มาจากการอัปเดตไฟล์ */
  protected renameDraftAgendaVersion(version: number, title: string): void {
    const next = title.trim() || `วาระพิจารณาคำขอเปิดไต่สวน · เวอร์ชัน ${version}`;
    this.draftAgendaVersions = this.draftAgendaVersions.map((row) =>
      row.version === version ? { ...row, title: next } : row,
    );
    this.writeDraftAgendaVersions();
    this.inquiryAgendaFiles = this.inquiryAgendaFiles.map((file) =>
      file.lane === 'draft' && file.version === version ? { ...file, title: next } : file,
    );
    this.writeInquiry(true);
  }

  /** แก้ชื่อไฟล์อัปโหลดที่ยังไม่ผูกเวอร์ชัน */
  protected renameDraftAgendaOrphanFile(file: InquiryAgendaFile, title: string): void {
    const next = title.trim() || file.name;
    this.inquiryAgendaFiles = this.inquiryAgendaFiles.map((item) => {
      if (file.docId && item.docId === file.docId) return { ...item, title: next };
      if (!file.docId && item.lane === 'draft' && !item.version && item.name === file.name) {
        return { ...item, title: next };
      }
      return item;
    });
    this.writeInquiry(true);
  }

  /** โหลดไฟล์จากแถวในตารางประวัติร่างวาระ */
  protected downloadDraftAgendaVersion(row: DraftAgendaVersion): void {
    if (this.draftAgendaWordOpen && this.draftAgendaActiveVersion === row.version) {
      this.downloadDraftAgendaWord();
      return;
    }
    const title = row.title || `วาระพิจารณาคำขอเปิดไต่สวน · เวอร์ชัน ${row.version}`;
    const base = (row.fileName || `วาระพิจารณาคำขอเปิดไต่สวน-v${row.version}`).replace(/\.[^.]+$/, '');
    const fileName = `${base}-${this.refId || filingRefId}.doc`;
    this.downloadEditorHtmlAsWord(fileName, title, row.html || '<p><br></p>');
  }

  /** แสดงวันที่พร้อมเวลา (เช่น 02/10/2563 09:00 น.) */
  protected draftAgendaAtLabel(at: string): string {
    const raw = (at || '').trim();
    if (!raw) return '—';
    if (/\d{1,2}:\d{2}/.test(raw)) return /น\./.test(raw) ? raw : `${raw} น.`;
    return `${raw} 09:00 น.`;
  }

  private draftAgendaStamp(): string {
    return this.replyStamp();
  }

  private persistDraftAgendaWord(closeToFiles: boolean): void {
    this.captureDraftAgendaEditor();
    const version = this.draftAgendaActiveVersion || this.draftAgendaLatestVersion;
    if (!version) return;
    const at = this.draftAgendaStamp();
    this.inquiryDraftAgendaAt = at;
    this.draftAgendaVersions = this.draftAgendaVersions.map((row) =>
      row.version === version ? { ...row, html: this.draftAgendaHtml, at } : row,
    );
    this.writeDraftAgendaVersions();
    const kind = 'วาระพิจารณาคำขอเปิดไต่สวน';
    const fields = [
      field('ชื่อเอกสาร', `วาระพิจารณาคำขอเปิดไต่สวน · เวอร์ชัน ${version}`),
      field('วันที่', at),
      field('เวอร์ชัน', String(version)),
      field('เนื้อหาเอกสาร', this.draftAgendaHtml, true),
    ];
    const existing = this.madeDocs.find((item) => item.kind === kind && item.fields.some((row) => row.label === 'เวอร์ชัน' && row.value === String(version)));
    if (existing) {
      this.madeDocs = this.madeDocs.map((item) => (item.id === existing.id ? { ...item, at, fields } : item));
    } else {
      this.madeDocs = [...this.madeDocs, { id: `draft-agenda-doc-v${version}`, kind, at, fields }];
    }
    writeMadeDocs(this.madeDocs);
    this.inquiryPart = 'draftAgenda';
    this.inquiryDraftAgendaAt = at;
    if (closeToFiles) this.inquiryDraftAgendaDone = true;
    this.writeInquiry(true);
    this.notice = null;
    if (closeToFiles) {
      this.draftAgendaTab = 'files';
      this.draftAgendaWordOpen = false;
      this.syncFilingUrl();
    }
  }

  protected draftAgendaFormat(command: string, value?: string): void {
    document.execCommand('styleWithCSS', false, 'true');
    document.execCommand(command, false, value);
    this.lockOfficialFontOnSelection();
    this.captureDraftAgendaEditor();
    this.refreshAmendToolbar();
    this.draftAgendaEditorRef?.nativeElement.focus();
  }

  protected applyDraftAgendaFontSize(size: string): void {
    this.amendFontSize = size;
    document.execCommand('styleWithCSS', false, 'true');
    document.execCommand('fontSize', false, '3');
    const root = this.draftAgendaEditorRef?.nativeElement;
    root?.querySelectorAll('font[size="3"]').forEach((node) => {
      const span = document.createElement('span');
      span.style.fontSize = size;
      span.style.fontFamily = this.officialFontName;
      span.innerHTML = node.innerHTML;
      node.replaceWith(span);
    });
    this.lockOfficialFontOnSelection();
    this.captureDraftAgendaEditor();
    this.draftAgendaEditorRef?.nativeElement.focus();
  }

  protected applyDraftAgendaColor(color: string): void {
    this.amendColor = color;
    document.execCommand('styleWithCSS', false, 'true');
    document.execCommand('foreColor', false, color);
    this.lockOfficialFontOnSelection();
    this.captureDraftAgendaEditor();
    this.refreshAmendToolbar();
    this.draftAgendaEditorRef?.nativeElement.focus();
  }

  protected applyDraftAgendaHighlight(color: string): void {
    this.amendHighlight = color;
    document.execCommand('styleWithCSS', false, 'true');
    document.execCommand('hiliteColor', false, color === 'transparent' ? 'transparent' : color);
    this.lockOfficialFontOnSelection();
    this.captureDraftAgendaEditor();
    this.refreshAmendToolbar();
    this.draftAgendaEditorRef?.nativeElement.focus();
  }

  protected onDraftAgendaEditorInput(): void {
    this.captureDraftAgendaEditor();
    this.refreshAmendToolbar();
    this.scheduleDraftAgendaPageFrames();
  }

  protected insertDraftAgendaPageBreak(): void {
    const pageH = this.measureMmAsPx(297);
    const editor = this.draftAgendaEditorRef?.nativeElement;
    const sheet = editor?.closest('.word-print-sheet') as HTMLElement | null;
    const stage = this.draftAgendaStageRef?.nativeElement;
    let remain = Math.round(pageH * 0.35);
    const sel = window.getSelection();
    const node = sel?.anchorNode;
    const el = node instanceof Element ? node : node?.parentElement;
    if (el && sheet && stage && sheet.contains(el)) {
      const rect = (el as HTMLElement).getBoundingClientRect();
      const sheetTop = sheet.getBoundingClientRect().top - stage.getBoundingClientRect().top + stage.scrollTop;
      const y = rect.bottom - sheet.getBoundingClientRect().top + stage.scrollTop - sheetTop;
      const offsetInPage = ((y % pageH) + pageH) % pageH;
      remain = Math.max(28, Math.ceil(pageH - offsetInPage));
    }
    const breakHtml =
      `<div class="word-page-break" data-page-break="1" contenteditable="false" style="height:${remain}px" aria-hidden="true"></div>` +
      `<p style="font-family:${this.officialFontName};font-size:16pt;line-height:1.15;margin:0"><br></p>`;
    this.textEditorFormat('insertHTML', breakHtml);
    this.scheduleDraftAgendaPageFrames();
  }

  protected scheduleDraftAgendaPageFrames(): void {
    if (this.draftAgendaLayoutRaf) cancelAnimationFrame(this.draftAgendaLayoutRaf);
    this.draftAgendaLayoutRaf = requestAnimationFrame(() => {
      this.draftAgendaLayoutRaf = 0;
      this.syncDraftAgendaPageFrames();
    });
  }

  private syncDraftAgendaPageFrames(): void {
    const sheet = this.draftAgendaEditorRef?.nativeElement?.closest('.word-print-sheet') as HTMLElement | null;
    const stage = this.draftAgendaStageRef?.nativeElement;
    if (!stage) return;
    this.syncDraftAgendaFitScale();
    const pageH = this.measureMmAsPx(297);
    const sheetTop = sheet
      ? sheet.getBoundingClientRect().top - stage.getBoundingClientRect().top + stage.scrollTop
      : 0;
    const contentH = Math.max(pageH, sheet?.offsetHeight || pageH);
    const count = Math.max(1, Math.ceil(contentH / pageH));
    this.draftAgendaPageFrames = Array.from({ length: count }, (_, i) => ({
      n: i + 1,
      top: sheetTop + i * pageH,
      height: pageH,
    }));
    this.view.markForCheck();
  }

  private captureDraftAgendaEditor(): void {
    const el = this.draftAgendaEditorRef?.nativeElement;
    if (!el) return;
    const empty = !el.textContent?.replace(/\u00a0/g, ' ').replace(/\u200b/g, '').trim();
    this.draftAgendaEmpty = empty;
    this.draftAgendaHtml = empty ? '' : el.innerHTML;
    const version = this.draftAgendaActiveVersion;
    if (version) {
      this.draftAgendaVersions = this.draftAgendaVersions.map((row) =>
        row.version === version ? { ...row, html: this.draftAgendaHtml } : row,
      );
      this.writeDraftAgendaVersions();
    }
  }

  private fillDraftAgendaEditor(tries = 0): void {
    const run = () => {
      const el = this.draftAgendaEditorRef?.nativeElement;
      if (!el) {
        if (tries < 8) window.setTimeout(() => this.fillDraftAgendaEditor(tries + 1), 50);
        return;
      }
      el.innerHTML = this.draftAgendaHtml;
      this.draftAgendaEmpty = this.amendHtmlIsEmpty(this.draftAgendaHtml);
      this.refreshAmendToolbar();
      this.scheduleAmendWordLayout();
      window.setTimeout(() => this.scheduleAmendWordLayout(), 120);
      this.view.markForCheck();
    };
    window.setTimeout(run, tries === 0 ? 0 : 50);
  }

  /** สร้างเอกสาร = หน้าว่าง ให้พิมพ์เอง หรือกด AI ช่วยร่าง */
  private buildDraftAgendaBlankHtml(): string {
    return `<p style="font-family:${this.officialFontName}"><br></p>`;
  }

  /** fallback ถ้าโหลดตัวอย่างไม่ได้ */
  private buildDraftAgendaAiHtml(at: string): string {
    const lines = this.inquiryAgendaText().split('\n');
    const facts = this.inquiryFacts
      .map((item) => `<tr><td>${item.label}</td><td>${item.value}</td></tr>`)
      .join('');
    return [
      `<p style="text-align:center;font-family:${this.officialFontName}"><strong>กรมการค้าต่างประเทศ</strong></p>`,
      `<p style="text-align:center;font-family:${this.officialFontName}"><strong>วาระพิจารณาคำขอเปิดไต่สวน</strong></p>`,
      `<p style="font-family:${this.officialFontName}">เลขที่อ้างอิง ${this.refId || 'R6201'} · วันที่ร่าง ${at}</p>`,
      `<p style="font-family:${this.officialFontName}"><span style="background:#e6f1f9;color:#0e2346">AI ช่วยร่าง · ข้อมูลตั้งต้นจากเคส</span></p>`,
      `<table class="amend-table"><tbody>${facts}</tbody></table>`,
      ...lines.map((line) => `<p style="font-family:${this.officialFontName}">${line}</p>`),
      `<p style="font-family:${this.officialFontName}"><strong>ข้อเสนอฝ่ายเลขานุการ</strong> เห็นควรเปิดไต่สวนตามมาตรา 39</p>`,
    ].join('');
  }

  private loadDraftAgendaVersions(): void {
    try {
      const raw = sessionStorage.getItem(this.draftAgendaVersionsKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as DraftAgendaVersion[];
      if (!Array.isArray(parsed)) return;
      this.draftAgendaVersions = parsed.filter((row) => row && typeof row.version === 'number' && typeof row.html === 'string');
      this.draftAgendaActiveVersion = this.draftAgendaLatestVersion;
      const current = this.draftAgendaVersions.find((row) => row.version === this.draftAgendaActiveVersion);
      if (current) this.draftAgendaHtml = current.html;
    } catch {
      /* ignore */
    }
  }

  private writeDraftAgendaVersions(): void {
    try {
      sessionStorage.setItem(this.draftAgendaVersionsKey, JSON.stringify(this.draftAgendaVersions));
    } catch {
      /* ignore */
    }
  }

  protected draftAgendaSourceLabel(source: DraftAgendaVersion['source'] | InquiryAgendaFile['source'] | ApprovalSubmitRound['source']): string {
    if (source === 'ai') return 'AI ช่วยร่าง';
    if (source === 'upload') return 'อัปเดตไฟล์';
    if (source === 'created') return 'สร้างในระบบ';
    if (source === 'sample') return 'แฟ้มเคส';
    return 'เอกสาร';
  }

  private approvalWorkspaceReady = false;

  protected pickApprovalSubmit(): void {
    if (this.agencyWordOpen) {
      this.captureAgencySummaryEditor();
      this.agencyWordOpen = false;
    }
    if (this.draftAgendaWordOpen) {
      this.captureDraftAgendaEditor();
      this.writeDraftAgendaComments();
      this.draftAgendaWordOpen = false;
      this.draftAgendaTab = 'files';
      this.restoreParkedAmendComments();
    }
    this.completeBundle = '';
    this.editingId = '';
    this.docShelf = 'files';
    this.docPart = this.approvalSubmitPart;
    this.notice = null;
    this.loadDraftAgendaVersions();
    if (!this.approvalWorkspaceReady) {
      this.resetApprovalWorkspace();
      this.approvalWorkspaceReady = true;
    } else {
      this.loadApprovalRounds();
    }
    const view = this.route.snapshot.queryParamMap.get('view');
    if (view === 'editor' && (this.approvalRounds.length || this.approvalWordOpen)) {
      this.pickApprovalTab('editor');
    } else {
      this.approvalTab = 'files';
      this.approvalWordOpen = false;
    }
    this.syncFilingUrl();
  }

  protected get canOpenApprovalEditor(): boolean {
    return this.approvalWordOpen || this.approvalRounds.some((row) => row.source === 'created' || row.source === 'ai');
  }

  protected pickApprovalTab(tab: 'files' | 'editor'): void {
    if (tab === 'editor') {
      if (this.approvalWordOpen) {
        this.approvalTab = 'editor';
        this.syncFilingUrl();
        return;
      }
      const editable = [...this.approvalRounds].reverse().find((row) => row.source === 'created' || row.source === 'ai');
      if (editable) {
        this.openApprovalRound(editable.round);
        return;
      }
      return;
    }
    this.captureApprovalEditor();
    this.writeApprovalComments();
    this.approvalWordOpen = false;
    this.approvalTab = 'files';
    this.approvalViewerFull = false;
    this.commentPinMode = false;
    this.restoreParkedAmendComments();
    this.syncFilingUrl();
  }

  private resetApprovalWorkspace(): void {
    this.approvalWordOpen = false;
    this.approvalTab = 'files';
    this.approvalAgendaPickerOpen = false;
    this.approvalAgendaPickerMode = null;
    this.approvalNeedAgendaOpen = false;
    this.approvalPendingFiles = null;
    this.loadApprovalRounds();
  }

  protected get approvalNavOn(): boolean {
    return this.reviewTab === 'docs' && this.docPart === this.approvalSubmitPart;
  }

  protected approvalDot(): string {
    if (this.approvalRounds.some((row) => row.source === 'ai' || row.source === 'created' || row.source === 'upload')) {
      return 'assets/icons/por1-dot-done.svg';
    }
    if (this.approvalNavOn) return 'assets/icons/por1-dot-wait.svg';
    return 'assets/icons/por1-dot.svg';
  }

  /** วาระพิจารณาคำขอเปิดไต่สวน (อนุ) — content แบบวาระหลัก (ไม่ใช่ท่ออนุมัติ) */
  protected subAgendaVersions: DraftAgendaVersion[] = [];
  protected subAgendaActiveVersion = 0;
  protected subAgendaTab: 'files' | 'editor' = 'files';
  protected subAgendaWordOpen = false;
  protected subAgendaHtml = '';
  protected subAgendaEmpty = true;
  protected subAgendaZoom = 100;
  protected subAgendaViewerFull = false;
  protected subAgendaFitScale = 1.5;
  protected subAgendaPageFrames: { n: number; top: number; height: number }[] = [{ n: 1, top: 0, height: 1123 }];
  private subAgendaLayoutRaf = 0;
  private readonly subAgendaZoomBase = 1.5;
  private readonly subAgendaZoomSteps = [50, 75, 100, 125, 150, 200];
  private readonly subAgendaVersionsKey = 'dft-por1-sub-agenda-versions';
  private readonly subAgendaCommentsKey = 'dft-por1-sub-agenda-comments';
  private readonly subAgendaSampleUrl = 'assets/samples/ad1046/agenda/sub/2-วาระพิจารณาคำขอเปิดไต่สวน.html';
  private readonly subAgendaSampleHref = 'assets/samples/ad1046/agenda/sub/2. วาระพิจารณาคำขอเปิดไต่สวน.docx';
  @ViewChild('subAgendaEditor') private subAgendaEditorRef?: ElementRef<HTMLElement>;
  @ViewChild('subAgendaStage') private subAgendaStageRef?: ElementRef<HTMLElement>;
  @ViewChild('subAgendaUpload') private subAgendaUploadInput?: ElementRef<HTMLInputElement>;
  protected subAgendaPickerOpen = false;
  protected subAgendaNeedDraftOpen = false;
  protected subAgendaPick: Record<number, boolean> = {};

  /** แพ็กวาระอนุ + PPT ส่งให้กลุ่ม บท. ก่อนวันประชุม */
  protected meetingPackFiles: Array<{
    id: string;
    name: string;
    title: string;
    at: string;
    href: string;
    role: 'agenda' | 'ppt' | 'other';
    source?: 'sample' | 'pick' | 'upload';
    subVersion?: number;
  }> = [];
  protected meetingPackSent = false;
  protected meetingPackSentAt = '';
  protected meetingPackSentBy = '';
  protected meetingPackPickerOpen = false;
  protected meetingPackNeedAgendaOpen = false;
  protected meetingPackPick: Record<number, boolean> = {};
  private readonly meetingPackKey = 'dft-por1-meeting-pack';
  private readonly meetingPackSentKey = 'dft-por1-meeting-pack-sent';

  /** ไฟล์มติ / รายงานการประชุมอนุหลังส่งแพ็กให้ บท. */
  protected meetingResolutionFiles: Array<{
    id: string;
    name: string;
    title: string;
    at: string;
    href: string;
    role: 'resolution' | 'minutes' | 'agenda' | 'ppt' | 'other';
  }> = [];
  /** รับคำขอตามมติอนุ — ยังไม่เดินไป pre-notify / ค่าธรรมเนียม */
  protected meetingAccept: '' | 'accept' | 'return' = '';
  private readonly meetingResolutionKey = 'dft-por1-meeting-resolution';
  private readonly meetingAcceptKey = 'dft-por1-meeting-accept';

  private closeMeetingEditors(): void {
    if (this.agencyWordOpen) {
      this.captureAgencySummaryEditor();
      this.agencyWordOpen = false;
    }
    if (this.draftAgendaWordOpen) {
      this.captureDraftAgendaEditor();
      this.writeDraftAgendaComments();
      this.draftAgendaWordOpen = false;
      this.draftAgendaTab = 'files';
      this.restoreParkedAmendComments();
    }
    if (this.approvalWordOpen) {
      this.captureApprovalEditor();
      this.writeApprovalComments();
      this.approvalWordOpen = false;
      this.approvalTab = 'files';
      this.restoreParkedAmendComments();
    }
    if (this.subAgendaWordOpen) {
      this.captureSubAgendaEditor();
      this.writeSubAgendaComments();
      this.subAgendaWordOpen = false;
      this.subAgendaTab = 'files';
      this.subAgendaViewerFull = false;
      this.restoreParkedAmendComments();
    }
  }

  protected pickSubAgenda(): void {
    this.closeMeetingEditors();
    this.completeBundle = '';
    this.editingId = '';
    this.docShelf = 'files';
    this.docPart = this.subAgendaPart;
    this.notice = null;
    this.loadSubAgendaVersions();
    this.subAgendaTab = 'files';
    this.subAgendaWordOpen = false;
    this.subAgendaViewerFull = false;
    this.syncFilingUrl();
  }

  protected get subAgendaNavOn(): boolean {
    return this.reviewTab === 'docs' && this.docPart === this.subAgendaPart;
  }

  protected subAgendaDot(): string {
    if (this.subAgendaVersions.some((row) => !!row.html || row.source === 'upload' || row.source === 'created' || row.source === 'ai')) {
      return 'assets/icons/por1-dot-done.svg';
    }
    if (this.subAgendaNavOn) return 'assets/icons/por1-dot-wait.svg';
    return 'assets/icons/por1-dot.svg';
  }

  protected get subAgendaLatestVersion(): number {
    return this.subAgendaVersions.reduce((max, row) => Math.max(max, row.version), 0);
  }

  protected draftAgendaSourceLabelForSub(source: DraftAgendaVersion['source']): string {
    return this.draftAgendaSourceLabel(source);
  }

  protected openSubAgendaVersion(version: number): void {
    const row = this.subAgendaVersions.find((item) => item.version === version);
    if (!row) return;
    this.parkAmendCommentsForDraft();
    this.subAgendaActiveVersion = version;
    this.subAgendaHtml = row.html || '';
    this.subAgendaEmpty = this.amendHtmlIsEmpty(this.subAgendaHtml);
    this.subAgendaWordOpen = true;
    this.subAgendaTab = 'editor';
    this.subAgendaZoom = 100;
    this.loadSubAgendaComments();
    this.syncFilingUrl();
    if (!this.subAgendaHtml) {
      void this.seedSubAgendaHtml(version);
    } else {
      window.setTimeout(() => this.fillSubAgendaEditor(), 0);
    }
  }

  protected closeSubAgendaWord(): void {
    this.captureSubAgendaEditor();
    this.writeSubAgendaComments();
    this.subAgendaWordOpen = false;
    this.subAgendaTab = 'files';
    this.subAgendaViewerFull = false;
    this.restoreParkedAmendComments();
    this.syncFilingUrl();
  }

  protected pickSubAgendaTab(tab: 'files' | 'editor'): void {
    if (tab === 'editor') {
      const editable = [...this.subAgendaVersions].reverse().find((row) => !!row.html || row.source === 'created' || row.source === 'ai' || row.source === 'upload');
      if (editable) {
        this.openSubAgendaVersion(editable.version);
        return;
      }
      return;
    }
    this.closeSubAgendaWord();
  }

  /** เพิ่มวาระอนุจากวาระหลัก — เลือกไฟล์เหมือนหน้าเสนออนุมัติ */
  protected requestAddSubAgendaFromDraft(): void {
    this.loadDraftAgendaVersions();
    if (!this.draftAgendaVersions.length) {
      this.subAgendaNeedDraftOpen = true;
      return;
    }
    this.subAgendaPick = {};
    const latest = this.draftAgendaLatestVersion;
    if (latest) this.subAgendaPick = { [latest]: true };
    this.subAgendaPickerOpen = true;
  }

  protected dismissSubAgendaNeedDraft(): void {
    this.subAgendaNeedDraftOpen = false;
  }

  protected onSubAgendaNeedDraft(action: string): void {
    this.subAgendaNeedDraftOpen = false;
    if (action === 'ยืนยัน') this.pickDraftAgenda();
  }

  protected cancelSubAgendaPicker(): void {
    this.subAgendaPickerOpen = false;
    this.subAgendaPick = {};
  }

  protected toggleSubAgendaPick(version: number, checked: boolean): void {
    this.subAgendaPick = { ...this.subAgendaPick, [version]: checked };
  }

  protected get subAgendaPickCount(): number {
    return this.draftAgendaVersions.filter((row) => this.subAgendaPick[row.version]).length;
  }

  protected get canConfirmSubAgendaPick(): boolean {
    return this.subAgendaPickCount >= 1;
  }

  protected confirmSubAgendaPicker(): void {
    if (!this.canConfirmSubAgendaPick) return;
    const picked = this.draftAgendaVersions.filter((row) => this.subAgendaPick[row.version]);
    this.subAgendaPickerOpen = false;
    this.subAgendaPick = {};
    if (!picked.length) return;
    const at = this.replyStamp();
    const added: DraftAgendaVersion[] = picked.map((row, index) => {
      const version = this.subAgendaLatestVersion + index + 1;
      const baseTitle = (row.title || 'วาระพิจารณาคำขอเปิดไต่สวน').replace(/\s*·\s*เวอร์ชัน\s*\d+\s*$/, '').trim();
      const title = / \(อนุ\)\s*$/.test(baseTitle) ? baseTitle : `${baseTitle} (อนุ)`;
      return {
        version,
        title,
        at,
        html: row.html || '',
        source: 'created' as const,
        fileName: row.fileName || `วาระพิจารณาคำขอเปิดไต่สวน-อนุ-v${version}.docx`,
      };
    });
    this.subAgendaVersions = [...this.subAgendaVersions, ...added];
    this.writeSubAgendaVersions();
    this.subAgendaActiveVersion = added[added.length - 1]?.version || this.subAgendaLatestVersion;
    this.subAgendaTab = 'files';
    this.notice = 'saved';
    this.view.markForCheck();
  }

  protected uploadSubAgendaFiles(event: Event): void {
    const input = event.target as HTMLInputElement;
    const list = input.files;
    if (!list?.length) return;
    const at = this.replyStamp();
    const versions: DraftAgendaVersion[] = [];
    [...list].forEach((file) => {
      const version = this.subAgendaLatestVersion + versions.length + 1;
      const title = file.name.replace(/\.[^.]+$/, '') || `วาระพิจารณาคำขอเปิดไต่สวน (อนุ) · เวอร์ชัน ${version}`;
      versions.push({
        version,
        title,
        at,
        html: `<p><strong>ไฟล์อัปโหลด</strong> ${file.name}</p><p>อัปโหลดเมื่อ ${at} — เปิดหรือดาวน์โหลดจากรายการเอกสาร</p>`,
        source: 'upload',
        fileName: file.name,
      });
    });
    this.subAgendaVersions = [...this.subAgendaVersions, ...versions];
    this.writeSubAgendaVersions();
    this.subAgendaActiveVersion = this.subAgendaLatestVersion;
    input.value = '';
    this.subAgendaTab = 'files';
    this.notice = null;
    this.view.markForCheck();
  }

  protected renameSubAgendaVersion(version: number, title: string): void {
    const next = title.trim() || `วาระพิจารณาคำขอเปิดไต่สวน (อนุ) · เวอร์ชัน ${version}`;
    this.subAgendaVersions = this.subAgendaVersions.map((row) =>
      row.version === version ? { ...row, title: next } : row,
    );
    this.writeSubAgendaVersions();
  }

  /** ลบวาระอนุออกจากรายการ — ยังไม่เดินไปขั้น บท. */
  protected removeSubAgendaVersion(version: number): void {
    if (!version) return;
    const wasOpen = this.subAgendaWordOpen && this.subAgendaActiveVersion === version;
    this.subAgendaVersions = this.subAgendaVersions.filter((row) => row.version !== version);
    this.writeSubAgendaVersions();
    try {
      sessionStorage.removeItem(this.subAgendaCommentsStorageKey(version));
    } catch {
      /* ignore */
    }
    if (wasOpen) {
      this.subAgendaWordOpen = false;
      this.subAgendaTab = 'files';
      this.subAgendaViewerFull = false;
      this.subAgendaActiveVersion = 0;
      this.subAgendaHtml = '';
      this.restoreParkedAmendComments();
      this.syncFilingUrl();
    } else if (this.subAgendaActiveVersion === version) {
      this.subAgendaActiveVersion = this.subAgendaLatestVersion;
    }
    this.view.markForCheck();
  }

  protected zoomSubAgenda(dir: 1 | -1): void {
    const at = this.subAgendaZoomSteps.indexOf(this.subAgendaZoom);
    const index = at < 0 ? this.subAgendaZoomSteps.indexOf(100) : at;
    const next = this.subAgendaZoomSteps[Math.min(this.subAgendaZoomSteps.length - 1, Math.max(0, index + dir))];
    this.subAgendaZoom = next ?? 100;
    this.scheduleAmendWordLayout();
  }

  protected get subAgendaZoomCss(): number {
    return (this.subAgendaZoom / 100) * Math.max(this.subAgendaFitScale, this.subAgendaZoomBase);
  }

  protected get canZoomSubAgendaIn(): boolean {
    return this.subAgendaZoom < this.subAgendaZoomSteps[this.subAgendaZoomSteps.length - 1];
  }

  protected get canZoomSubAgendaOut(): boolean {
    return this.subAgendaZoom > this.subAgendaZoomSteps[0];
  }

  protected toggleSubAgendaViewerFull(): void {
    this.subAgendaViewerFull = !this.subAgendaViewerFull;
    if (this.subAgendaViewerFull) this.docListCollapsed = true;
    this.scheduleSubAgendaPageFrames();
  }

  protected saveSubAgendaDraft(): void {
    this.persistSubAgendaWord(false);
  }

  protected saveSubAgendaWord(): void {
    this.persistSubAgendaWord(true);
  }

  protected downloadSubAgendaWord(): void {
    this.captureSubAgendaEditor();
    const version = this.subAgendaActiveVersion || this.subAgendaLatestVersion || 1;
    const title = `วาระพิจารณาคำขอเปิดไต่สวน (อนุ) · เวอร์ชัน ${version}`;
    const fileName = `วาระพิจารณาคำขอเปิดไต่สวน-อนุ-v${version}-${this.refId || filingRefId}.doc`;
    this.downloadEditorHtmlAsWord(fileName, title, this.subAgendaHtml || '<p><br></p>');
  }

  protected downloadSubAgendaVersion(row: DraftAgendaVersion): void {
    if (this.subAgendaWordOpen && this.subAgendaActiveVersion === row.version) {
      this.downloadSubAgendaWord();
      return;
    }
    if (row.html) {
      const title = row.title || `วาระพิจารณาคำขอเปิดไต่สวน (อนุ) · เวอร์ชัน ${row.version}`;
      const base = (row.fileName || `วาระพิจารณาคำขอเปิดไต่สวน-อนุ-v${row.version}`).replace(/\.[^.]+$/, '');
      this.downloadEditorHtmlAsWord(`${base}-${this.refId || filingRefId}.doc`, title, row.html);
      return;
    }
    void this.downloadAssetFile(this.subAgendaSampleHref, row.fileName || row.title || 'วาระอนุ.docx');
  }

  protected onSubAgendaEditorInput(): void {
    this.captureSubAgendaEditor();
    this.refreshAmendToolbar();
    this.scheduleSubAgendaPageFrames();
  }

  protected subAgendaFormat(command: string, value?: string): void {
    document.execCommand('styleWithCSS', false, 'true');
    document.execCommand(command, false, value);
    this.lockOfficialFontOnSelection();
    this.captureSubAgendaEditor();
    this.refreshAmendToolbar();
    this.subAgendaEditorRef?.nativeElement.focus();
  }

  protected applySubAgendaFontSize(size: string): void {
    this.amendFontSize = size;
    document.execCommand('styleWithCSS', false, 'true');
    document.execCommand('fontSize', false, '3');
    const root = this.subAgendaEditorRef?.nativeElement;
    root?.querySelectorAll('font[size="3"]').forEach((node) => {
      const span = document.createElement('span');
      span.style.fontSize = size;
      span.style.fontFamily = this.officialFontName;
      span.innerHTML = node.innerHTML;
      node.replaceWith(span);
    });
    this.lockOfficialFontOnSelection();
    this.captureSubAgendaEditor();
    this.subAgendaEditorRef?.nativeElement.focus();
  }

  protected applySubAgendaColor(color: string): void {
    this.amendColor = color;
    document.execCommand('styleWithCSS', false, 'true');
    document.execCommand('foreColor', false, color);
    this.lockOfficialFontOnSelection();
    this.captureSubAgendaEditor();
    this.refreshAmendToolbar();
    this.subAgendaEditorRef?.nativeElement.focus();
  }

  protected applySubAgendaHighlight(color: string): void {
    this.amendHighlight = color;
    document.execCommand('styleWithCSS', false, 'true');
    document.execCommand('hiliteColor', false, color === 'transparent' ? 'transparent' : color);
    this.lockOfficialFontOnSelection();
    this.captureSubAgendaEditor();
    this.refreshAmendToolbar();
    this.subAgendaEditorRef?.nativeElement.focus();
  }

  protected insertSubAgendaPageBreak(): void {
    const pageH = this.measureMmAsPx(297);
    const editor = this.subAgendaEditorRef?.nativeElement;
    const sheet = editor?.closest('.word-print-sheet') as HTMLElement | null;
    const stage = this.subAgendaStageRef?.nativeElement;
    let remain = Math.round(pageH * 0.35);
    const sel = window.getSelection();
    const node = sel?.anchorNode;
    const el = node instanceof Element ? node : node?.parentElement;
    if (el && sheet && stage && sheet.contains(el)) {
      const rect = (el as HTMLElement).getBoundingClientRect();
      const sheetTop = sheet.getBoundingClientRect().top - stage.getBoundingClientRect().top + stage.scrollTop;
      const y = rect.bottom - sheet.getBoundingClientRect().top + stage.scrollTop - sheetTop;
      const offsetInPage = ((y % pageH) + pageH) % pageH;
      remain = Math.max(28, Math.ceil(pageH - offsetInPage));
    }
    const breakHtml =
      `<div class="word-page-break" data-page-break="1" contenteditable="false" style="height:${remain}px" aria-hidden="true"></div>` +
      `<p style="font-family:${this.officialFontName};font-size:16pt;line-height:1.15;margin:0"><br></p>`;
    this.textEditorFormat('insertHTML', breakHtml);
    this.scheduleSubAgendaPageFrames();
  }

  protected scheduleSubAgendaPageFrames(): void {
    if (this.subAgendaLayoutRaf) cancelAnimationFrame(this.subAgendaLayoutRaf);
    this.subAgendaLayoutRaf = requestAnimationFrame(() => {
      this.subAgendaLayoutRaf = 0;
      this.syncSubAgendaPageFrames();
    });
  }

  private syncSubAgendaFitScale(): void {
    const stage = this.subAgendaStageRef?.nativeElement;
    if (!stage) return;
    const paperW = this.measureMmAsPx(210);
    const layoutW = stage.offsetWidth || stage.clientWidth;
    const avail = Math.max(320, layoutW - 56);
    this.subAgendaFitScale = Math.max(1.25, avail / paperW);
  }

  private syncSubAgendaPageFrames(): void {
    const sheet = this.subAgendaEditorRef?.nativeElement?.closest('.word-print-sheet') as HTMLElement | null;
    const stage = this.subAgendaStageRef?.nativeElement;
    if (!stage) return;
    this.syncSubAgendaFitScale();
    const pageH = this.measureMmAsPx(297);
    const sheetTop = sheet
      ? sheet.getBoundingClientRect().top - stage.getBoundingClientRect().top + stage.scrollTop
      : 0;
    const contentH = Math.max(pageH, sheet?.offsetHeight || pageH);
    const count = Math.max(1, Math.ceil(contentH / pageH));
    this.subAgendaPageFrames = Array.from({ length: count }, (_, i) => ({
      n: i + 1,
      top: sheetTop + i * pageH,
      height: pageH,
    }));
    this.view.markForCheck();
  }

  private persistSubAgendaWord(closeToFiles: boolean): void {
    this.captureSubAgendaEditor();
    this.writeSubAgendaComments();
    const version = this.subAgendaActiveVersion || this.subAgendaLatestVersion;
    if (!version) return;
    const at = this.replyStamp();
    this.subAgendaVersions = this.subAgendaVersions.map((row) =>
      row.version === version ? { ...row, html: this.subAgendaHtml, at } : row,
    );
    this.writeSubAgendaVersions();
    this.notice = 'saved';
    if (closeToFiles) {
      this.subAgendaTab = 'files';
      this.subAgendaWordOpen = false;
      this.subAgendaViewerFull = false;
      this.restoreParkedAmendComments();
      this.syncFilingUrl();
    }
  }

  private captureSubAgendaEditor(): void {
    const el = this.subAgendaEditorRef?.nativeElement;
    if (!el) return;
    const empty = !el.textContent?.replace(/\u00a0/g, ' ').replace(/\u200b/g, '').trim();
    this.subAgendaEmpty = empty;
    this.subAgendaHtml = empty ? '' : el.innerHTML;
    const version = this.subAgendaActiveVersion;
    if (!version) return;
    this.subAgendaVersions = this.subAgendaVersions.map((row) =>
      row.version === version ? { ...row, html: this.subAgendaHtml } : row,
    );
    this.writeSubAgendaVersions();
  }

  private fillSubAgendaEditor(tries = 0): void {
    const run = () => {
      const el = this.subAgendaEditorRef?.nativeElement;
      if (!el) {
        if (tries < 8) window.setTimeout(() => this.fillSubAgendaEditor(tries + 1), 50);
        return;
      }
      el.innerHTML = this.subAgendaHtml || '';
      this.subAgendaEmpty = this.amendHtmlIsEmpty(this.subAgendaHtml);
      this.refreshAmendToolbar();
      this.scheduleAmendWordLayout();
      this.scheduleSubAgendaPageFrames();
      window.setTimeout(() => this.scheduleAmendWordLayout(), 120);
      this.view.markForCheck();
    };
    window.setTimeout(run, tries === 0 ? 0 : 50);
  }

  private async seedSubAgendaHtml(version: number): Promise<void> {
    try {
      const res = await fetch(this.subAgendaSampleUrl);
      if (!res.ok) throw new Error(`sample ${res.status}`);
      const html = await res.text();
      if (this.subAgendaActiveVersion !== version) return;
      this.subAgendaHtml = html;
      this.subAgendaEmpty = false;
      this.subAgendaVersions = this.subAgendaVersions.map((row) =>
        row.version === version ? { ...row, html, source: row.source === 'upload' ? 'upload' : 'created' } : row,
      );
      this.writeSubAgendaVersions();
      window.setTimeout(() => this.fillSubAgendaEditor(), 0);
      this.view.markForCheck();
    } catch {
      /* keep blank */
    }
  }

  private subAgendaCommentsStorageKey(version = this.subAgendaActiveVersion): string {
    return `${this.subAgendaCommentsKey}-v${version || 0}`;
  }

  private loadSubAgendaComments(): void {
    try {
      const raw = sessionStorage.getItem(this.subAgendaCommentsStorageKey());
      const parsed = raw ? (JSON.parse(raw) as AmendWordComment[]) : [];
      this.amendWordComments = Array.isArray(parsed) ? parsed : [];
    } catch {
      this.amendWordComments = [];
    }
    this.amendWordActiveId = '';
    this.amendWordDraftId = '';
    this.commentPinMode = false;
  }

  private writeSubAgendaComments(): void {
    try {
      const key = this.subAgendaCommentsStorageKey();
      if (!this.amendWordComments.length) sessionStorage.removeItem(key);
      else sessionStorage.setItem(key, JSON.stringify(this.amendWordComments));
    } catch {
      /* ignore */
    }
  }

  private loadSubAgendaVersions(): void {
    try {
      const raw = sessionStorage.getItem(this.subAgendaVersionsKey);
      if (raw) {
        const parsed = JSON.parse(raw) as DraftAgendaVersion[];
        if (Array.isArray(parsed) && parsed.length) {
          this.subAgendaVersions = parsed.map((row) => ({ ...row }));
        }
      }
    } catch {
      /* ignore */
    }
    this.ensureSubAgendaSamples();
  }

  private writeSubAgendaVersions(): void {
    try {
      sessionStorage.setItem(this.subAgendaVersionsKey, JSON.stringify(this.subAgendaVersions));
    } catch {
      /* ignore */
    }
  }

  private ensureSubAgendaSamples(): void {
    if (this.subAgendaVersions.length) {
      const needHtml = this.subAgendaVersions.find((row) => !row.html);
      if (needHtml) void this.seedSubAgendaHtml(needHtml.version);
      return;
    }
    const at = '02/11/2563 · 10:00 น.';
    this.subAgendaVersions = [
      {
        version: 1,
        title: 'วาระพิจารณาคำขอเปิดไต่สวน (อนุ)',
        at,
        html: '',
        source: 'created',
        fileName: '2. วาระพิจารณาคำขอเปิดไต่สวน.docx',
      },
    ];
    this.subAgendaActiveVersion = 1;
    this.writeSubAgendaVersions();
    void this.seedSubAgendaHtml(1);
  }

  protected pickMeetingPack(): void {
    if (!this.meetingBureauFlowEnabled) {
      this.pickSubAgenda();
      return;
    }
    this.closeMeetingEditors();
    this.completeBundle = '';
    this.editingId = '';
    this.docShelf = 'files';
    this.docPart = this.meetingPackPart;
    this.notice = null;
    this.loadSubAgendaVersions();
    this.loadMeetingPack();
    this.syncFilingUrl();
  }

  protected get meetingPackNavOn(): boolean {
    return this.reviewTab === 'docs' && this.docPart === this.meetingPackPart;
  }

  protected meetingPackDot(): string {
    if (this.meetingPackSent) return 'assets/icons/por1-dot-done.svg';
    if (this.meetingPackNavOn) return 'assets/icons/por1-dot-wait.svg';
    return 'assets/icons/por1-dot.svg';
  }

  protected meetingPackRoleLabel(role: string): string {
    if (role === 'agenda') return 'วาระอนุ';
    if (role === 'ppt') return 'PowerPoint · ส่ง บท.';
    return 'เอกสารประกอบ';
  }

  protected get canSendMeetingPack(): boolean {
    if (this.meetingPackSent) return false;
    if (this.reviewRole && this.reviewRole !== 'officer') return false;
    return this.meetingPackFiles.some((file) => file.role === 'ppt')
      && this.meetingPackFiles.some((file) => file.role === 'agenda');
  }

  protected sendMeetingPackToBureau(): void {
    if (!this.canSendMeetingPack) return;
    const officer = this.signedPerson || this.officerName || 'เจ้าหน้าที่กลุ่ม';
    this.meetingPackSent = true;
    this.meetingPackSentAt = `${this.thaiToday()} · ${new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.`;
    this.meetingPackSentBy = officer;
    this.writeMeetingPackSent();
    this.notice = 'saved';
  }

  /** เลือกวาระอนุจากรายการวาระอนุ — เหมือนเพิ่มวาระในเสนออนุมัติ */
  protected requestAddMeetingPackAgenda(): void {
    this.loadSubAgendaVersions();
    if (!this.subAgendaVersions.length) {
      this.meetingPackNeedAgendaOpen = true;
      return;
    }
    this.meetingPackPick = {};
    this.meetingPackFiles
      .filter((file) => file.role === 'agenda' && file.subVersion)
      .forEach((file) => {
        if (file.subVersion) this.meetingPackPick[file.subVersion] = true;
      });
    if (!Object.keys(this.meetingPackPick).length) {
      const latest = this.subAgendaLatestVersion;
      if (latest) this.meetingPackPick = { [latest]: true };
    }
    this.meetingPackPickerOpen = true;
  }

  protected dismissMeetingPackNeedAgenda(): void {
    this.meetingPackNeedAgendaOpen = false;
  }

  protected onMeetingPackNeedAgenda(action: string): void {
    this.meetingPackNeedAgendaOpen = false;
    if (action === 'ยืนยัน') this.pickSubAgenda();
  }

  protected cancelMeetingPackPicker(): void {
    this.meetingPackPickerOpen = false;
    this.meetingPackPick = {};
  }

  protected toggleMeetingPackPick(version: number, checked: boolean): void {
    this.meetingPackPick = { ...this.meetingPackPick, [version]: checked };
  }

  protected get canConfirmMeetingPackPick(): boolean {
    return this.subAgendaVersions.some((row) => this.meetingPackPick[row.version]);
  }

  protected confirmMeetingPackPicker(): void {
    if (!this.canConfirmMeetingPackPick) return;
    const picked = this.subAgendaVersions.filter((row) => this.meetingPackPick[row.version]);
    this.meetingPackPickerOpen = false;
    this.meetingPackPick = {};
    if (!picked.length) return;
    const at = this.thaiToday();
    const keep = this.meetingPackFiles.filter(
      (file) => !(file.role === 'agenda' && file.source === 'pick') && !(file.role === 'agenda' && file.source === 'sample'),
    );
    const added = picked.map((row) => ({
      id: `pack-agenda-v${row.version}`,
      name: row.fileName || `วาระอนุ-v${row.version}.docx`,
      title: row.title || 'วาระพิจารณาคำขอเปิดไต่สวน (อนุ)',
      at: (row.at || at).split('·')[0]?.trim() || at,
      href: this.subAgendaSampleHref,
      role: 'agenda' as const,
      source: 'pick' as const,
      subVersion: row.version,
    }));
    this.meetingPackFiles = [...keep, ...added];
    this.markMeetingPackDirty();
    this.writeMeetingPack();
    this.view.markForCheck();
  }

  protected uploadMeetingPackFiles(event: Event): void {
    const input = event.target as HTMLInputElement;
    const list = input.files;
    if (!list?.length) return;
    const at = this.thaiToday();
    const added = [...list].map((file, index) => {
      const ext = (file.name.split('.').pop() || '').toLowerCase();
      const isPpt = ext === 'ppt' || ext === 'pptx';
      const title = file.name.replace(/\.[^.]+$/, '') || file.name;
      return {
        id: `pack-upload-${Date.now()}-${index}`,
        name: file.name,
        title,
        at,
        href: '',
        role: (isPpt ? 'ppt' : 'agenda') as 'agenda' | 'ppt',
        source: 'upload' as const,
      };
    });
    this.meetingPackFiles = [...this.meetingPackFiles, ...added];
    this.markMeetingPackDirty();
    this.writeMeetingPack();
    input.value = '';
    this.view.markForCheck();
  }

  protected renameMeetingPackFile(id: string, title: string): void {
    const next = title.trim() || 'เอกสารประกอบ';
    this.meetingPackFiles = this.meetingPackFiles.map((file) =>
      file.id === id ? { ...file, title: next } : file,
    );
    this.writeMeetingPack();
  }

  protected removeMeetingPackFile(id: string): void {
    this.meetingPackFiles = this.meetingPackFiles.filter((file) => file.id !== id);
    this.markMeetingPackDirty();
    this.writeMeetingPack();
    this.view.markForCheck();
  }

  protected openMeetingPackFile(file: {
    id?: string;
    name: string;
    title?: string;
    at?: string;
    href?: string;
    subVersion?: number;
  }): void {
    if (file.subVersion) {
      this.pickSubAgenda();
      this.openSubAgendaVersion(file.subVersion);
      return;
    }
    this.openMeetingResolutionFile(file);
  }

  protected downloadMeetingPackFile(file: {
    id?: string;
    name: string;
    title?: string;
    at?: string;
    href?: string;
  }): void {
    this.downloadMeetingResolutionFile(file);
  }

  private markMeetingPackDirty(): void {
    if (!this.meetingPackSent) return;
    this.meetingPackSent = false;
    this.meetingPackSentAt = '';
    this.meetingPackSentBy = '';
    try {
      sessionStorage.removeItem(this.meetingPackSentKey);
    } catch {
      /* ignore */
    }
  }

  private writeMeetingPack(): void {
    try {
      sessionStorage.setItem(this.meetingPackKey, JSON.stringify(this.meetingPackFiles));
    } catch {
      /* ignore */
    }
  }

  private writeMeetingPackSent(): void {
    try {
      sessionStorage.setItem(
        this.meetingPackSentKey,
        JSON.stringify({
          sent: this.meetingPackSent,
          at: this.meetingPackSentAt,
          by: this.meetingPackSentBy,
        }),
      );
    } catch {
      /* ignore */
    }
  }

  private loadMeetingPack(): void {
    try {
      const raw = sessionStorage.getItem(this.meetingPackKey);
      if (raw) {
        const parsed = JSON.parse(raw) as typeof this.meetingPackFiles;
        if (Array.isArray(parsed) && parsed.length) {
          this.meetingPackFiles = parsed.map((file) => ({ ...file }));
        }
      }
      const sentRaw = sessionStorage.getItem(this.meetingPackSentKey);
      if (sentRaw) {
        const sent = JSON.parse(sentRaw) as { sent?: boolean; at?: string; by?: string };
        this.meetingPackSent = sent.sent === true;
        this.meetingPackSentAt = sent.at || '';
        this.meetingPackSentBy = sent.by || '';
      }
    } catch {
      /* ignore */
    }
    this.ensureMeetingPackSamples();
  }

  private ensureMeetingPackSamples(): void {
    if (this.meetingPackFiles.length) return;
    this.meetingPackFiles = this.buildMeetingPackSamples();
    this.writeMeetingPack();
    this.ensureMeetingPackSentSample();
  }

  /** ตัวอย่าง: แนบวาระ+PPT และส่งให้ บท. ไว้แล้วตามเคส — เฉพาะตอนยังไม่มีสถานะส่ง */
  private ensureMeetingPackSentSample(): void {
    if (this.meetingPackSent) return;
    const officer = this.signedPerson || this.officerName || 'นางสาวจรีณา กิจส่งเสริมกุล';
    this.meetingPackSent = true;
    this.meetingPackSentAt = '02/11/2563 · 16:00 น.';
    this.meetingPackSentBy = officer;
    this.writeMeetingPackSent();
  }

  private buildMeetingPackSamples(): typeof this.meetingPackFiles {
    const at = '02/11/2563';
    const agenda = this.subAgendaVersions[this.subAgendaVersions.length - 1];
    return [
      {
        id: agenda?.version ? `pack-agenda-v${agenda.version}` : 'pack-agenda',
        name: agenda?.fileName || '2. วาระพิจารณาคำขอเปิดไต่สวน.docx',
        title: agenda?.title || 'วาระพิจารณาคำขอเปิดไต่สวน (อนุ)',
        at: (agenda?.at || at).split('·')[0]?.trim() || at,
        href: this.subAgendaSampleHref,
        role: 'agenda',
        source: 'sample',
        subVersion: agenda?.version,
      },
      {
        id: 'pack-ppt',
        name: '3. PowerPoint อนุ ทตอ 3 พย 63 ส่ง บท.pptx',
        title: 'PowerPoint อนุไต่สวน · ส่งกลุ่ม บท.',
        at,
        href: 'assets/samples/ad1046/agenda/sub/3. PowerPoint อนุ ทตอ 3 พย 63.pptx',
        role: 'ppt',
        source: 'sample',
      },
    ];
  }

  protected pickMeetingResolution(): void {
    if (!this.meetingBureauFlowEnabled) {
      this.pickSubAgenda();
      return;
    }
    this.closeMeetingEditors();
    this.completeBundle = '';
    this.editingId = '';
    this.docShelf = 'files';
    this.docPart = this.meetingResolutionPart;
    this.notice = null;
    this.loadMeetingResolution();
    this.syncFilingUrl();
  }

  protected get meetingResolutionNavOn(): boolean {
    return this.reviewTab === 'docs' && this.docPart === this.meetingResolutionPart;
  }

  protected meetingResolutionDot(): string {
    if (this.meetingResolutionFiles.some((file) => file.role === 'resolution' && !!file.href)) {
      return 'assets/icons/por1-dot-done.svg';
    }
    if (this.meetingResolutionNavOn) return 'assets/icons/por1-dot-wait.svg';
    return 'assets/icons/por1-dot.svg';
  }

  protected meetingRoleLabel(role: string): string {
    if (role === 'resolution') return 'มติที่ประชุม';
    if (role === 'minutes') return 'รายงานการประชุม';
    if (role === 'agenda') return 'วาระอนุ';
    if (role === 'ppt') return 'PowerPoint';
    return 'เอกสารประกอบ';
  }

  protected openMeetingResolutionFile(file: {
    id?: string;
    name: string;
    title?: string;
    at?: string;
    href?: string;
    role?: string;
  }): void {
    if (file.href) {
      window.open(file.href, '_blank', 'noopener');
      return;
    }
    this.viewingMade = {
      id: `meeting-${file.id || file.name}`,
      kind: file.title || file.name,
      at: file.at || this.thaiToday(),
      fields: [
        { label: 'ไฟล์', value: file.name },
        { label: 'ชื่อเอกสาร', value: file.title || file.name },
      ],
    };
  }

  protected downloadMeetingResolutionFile(file: {
    id?: string;
    name: string;
    title?: string;
    at?: string;
    href?: string;
    role?: string;
  }): void {
    if (file.href) {
      void this.downloadAssetFile(file.href, file.name);
      return;
    }
    this.openMeetingResolutionFile(file);
  }

  protected setMeetingAccept(value: 'accept' | 'return'): void {
    this.meetingAccept = value;
    try {
      sessionStorage.setItem(this.meetingAcceptKey, value);
    } catch {
      /* ignore */
    }
    this.notice = 'saved';
  }

  private loadMeetingResolution(): void {
    try {
      const raw = sessionStorage.getItem(this.meetingResolutionKey);
      if (raw) {
        const parsed = JSON.parse(raw) as typeof this.meetingResolutionFiles;
        if (Array.isArray(parsed) && parsed.length) {
          this.meetingResolutionFiles = parsed.map((file) => ({ ...file }));
        }
      }
      const accept = sessionStorage.getItem(this.meetingAcceptKey);
      if (accept === 'accept' || accept === 'return') this.meetingAccept = accept;
    } catch {
      /* ignore */
    }
    this.ensureMeetingResolutionSamples(true);
  }

  private ensureMeetingResolutionSamples(force = false): void {
    const samples = this.buildMeetingResolutionSamples();
    const hasAll =
      samples.length === this.meetingResolutionFiles.length &&
      samples.every((sample) =>
        this.meetingResolutionFiles.some((file) => file.id === sample.id && !!file.href && file.role === sample.role),
      );
    if (!force && hasAll) return;
    this.meetingResolutionFiles = samples;
    try {
      sessionStorage.setItem(this.meetingResolutionKey, JSON.stringify(this.meetingResolutionFiles));
    } catch {
      /* ignore */
    }
  }

  private buildMeetingResolutionSamples(): typeof this.meetingResolutionFiles {
    const at = '03/11/2563';
    return [
      {
        id: 'meeting-resolution',
        name: '4. มติคณะอนุฯ ไต่สวน HR 3 พย 63.docx',
        title: 'มติคณะอนุฯ ไต่สวน',
        at,
        href: 'assets/samples/ad1046/agenda/sub/4. มติคณะอนุฯ ไต่สวน HR 3 พย 63.docx',
        role: 'resolution',
      },
      {
        id: 'meeting-minutes',
        name: '5. รายงานการประชุม HR 3 พย 63.docx',
        title: 'รายงานการประชุมอนุไต่สวน',
        at,
        href: 'assets/samples/ad1046/agenda/sub/5. รายงานการประชุม HR 3 พย 63.docx',
        role: 'minutes',
      },
    ];
  }

  protected get approvalLatestRound(): number {
    return this.approvalRounds.reduce((max, row) => Math.max(max, row.round), 0);
  }

  protected get approvalSelectableAgendas(): DraftAgendaVersion[] {
    return this.draftAgendaVersions;
  }

  protected get approvalAgendaPickCount(): number {
    return this.approvalSelectableAgendas.filter((row) => this.approvalAgendaPick[row.version]).length;
  }

  protected get canConfirmApprovalAgendaPick(): boolean {
    return this.approvalAgendaPickCount >= 1;
  }

  protected approvalFileCount(row: ApprovalSubmitRound): number {
    return (row.agendaVersions?.length || 0) + (row.attachments?.length || 0);
  }

  protected approvalFileCountLabel(row: ApprovalSubmitRound): string {
    const count = this.approvalFileCount(row);
    return count ? `${count} ไฟล์` : '—';
  }

  protected toggleApprovalAgendaPick(version: number, checked: boolean): void {
    this.approvalAgendaPick = { ...this.approvalAgendaPick, [version]: checked };
  }

  protected get canCreateApprovalRound(): boolean {
    if (this.reviewRole && this.reviewRole !== 'officer') return false;
    return canCreateApprovalItem(this.approvalRounds.map((row) => row.laneStage || 'draft'));
  }

  protected get approvalCreateBlockedReason(): string {
    if (this.canCreateApprovalRound) return '';
    return 'รออนุมัติหรือปฏิเสธรายการปัจจุบันก่อนสร้างใหม่';
  }

  protected get approvalListRows(): ApprovalListRow[] {
    return this.approvalRounds.map((row) => {
      const stage = row.laneStage || 'draft';
      const officer = !this.reviewRole || this.reviewRole === 'officer';
      return toApprovalListRow({
        id: String(row.round),
        title: row.title || `เอกสารขออนุมัติ บันทึกเสนอ · รอบ ${row.round}`,
        date: (row.at || '').split('·')[0]?.trim() || row.at || '',
        stage,
        meta: this.draftAgendaSourceLabel(row.source),
        statusLabel: approvalListStatusLabel(stage),
        canEdit: stage === 'draft' && officer,
        canReview:
          (stage === 'to-head' && (this.reviewRole === 'head' || this.isMyGroupHead())) ||
          (stage === 'to-director' && (this.reviewRole === 'director' || this.reviewRole === 'staff')),
        canCancel: officer && stage !== 'done' && stage !== 'cancelled' && stage !== 'delivered',
        // เสนออนุมัติไม่มีการส่งฉบับสมบูรณ์ให้ผู้ยื่น — ไม่เปิดอัปโหลด/ส่งแล้วหลังอนุมัติ
        canUpload: false,
        canDeliver: false,
        keptFiles: (row.attachments || []).map((file) => ({
          id: file.id,
          name: file.name,
          title: file.title || file.name,
          at: file.at,
          href: file.href,
          edition: file.edition || 'draft',
        })),
      });
    });
  }

  protected approvalHistoryOpen = false;
  protected approvalHistoryRound = 0;

  protected get approvalHistoryEntries(): ApprovalLaneHistoryEntry[] {
    const row = this.approvalRounds.find((item) => item.round === this.approvalHistoryRound);
    return row?.laneHistory || [];
  }

  protected get approvalHistoryDetail(): string {
    const row = this.approvalRounds.find((item) => item.round === this.approvalHistoryRound);
    if (!row) return '';
    return `${row.title} · ${this.approvalHistoryEntries.length} รายการ`;
  }

  protected requestCreateApprovalRound(): void {
    if (!this.canCreateApprovalRound) return;
    this.beginApprovalAgendaPicker('create');
  }

  protected onApprovalListCreate(): void {
    this.requestCreateApprovalRound();
  }

  protected onApprovalListOpen(row: ApprovalListRow): void {
    const round = Number(row.id);
    this.approvalActiveRound = round;
    const found = this.approvalRounds.find((item) => item.round === round);
    if (found && (found.source === 'created' || found.source === 'ai')) {
      this.openApprovalRound(round);
      return;
    }
    this.approvalTab = 'files';
  }

  protected onApprovalListHistory(row: ApprovalListRow): void {
    this.approvalHistoryRound = Number(row.id);
    this.approvalHistoryOpen = true;
  }

  protected closeApprovalHistory(): void {
    this.approvalHistoryOpen = false;
  }

  protected onApprovalListEdit(row: ApprovalListRow): void {
    this.onApprovalListOpen(row);
  }

  protected onApprovalListReview(row: ApprovalListRow): void {
    this.approvalActiveRound = Number(row.id);
    this.approvalTab = 'files';
    this.approvalWordOpen = false;
  }

  protected onApprovalListCancel(row: ApprovalListRow): void {
    const round = Number(row.id);
    const found = this.approvalRounds.find((item) => item.round === round);
    if (!found) return;
    const stage = found.laneStage || 'draft';
    if (stage === 'done' || stage === 'cancelled') return;
    this.approvalActiveRound = round;
    this.patchActiveApprovalLane('cancelled', 'ยกเลิก / ปฏิเสธรายการเสนอ');
    this.patchActiveApprovalEofficeLink('idle');
    this.approvalWordOpen = false;
    this.approvalTab = 'files';
    this.notice = 'saved';
  }

  protected onApprovalListUpload(_event: { row: ApprovalListRow; files: FileList }): void {
    // เสนออนุมัติไม่แนบฉบับสมบูรณ์หลังอนุมัติ — ไม่ใช้
  }

  protected onApprovalListRemoveKept(event: { row: ApprovalListRow; file: { id: string; name: string } }): void {
    const officer = !this.reviewRole || this.reviewRole === 'officer';
    if (!officer) return;
    const round = Number(event.row.id);
    const found = this.approvalRounds.find((item) => item.round === round);
    if (!found || (found.laneStage || 'draft') === 'done' || (found.laneStage || 'draft') === 'cancelled') return;
    this.approvalActiveRound = round;
    this.removeApprovalAttachment(event.file.id);
  }

  protected onApprovalListOpenKept(event: {
    row: ApprovalListRow;
    file: { name: string; title: string; at?: string; href?: string };
  }): void {
    const href = event.file.href || this.approvalKeptHref(Number(event.row.id), event.file.name);
    if (href) {
      window.open(href, '_blank', 'noopener');
      return;
    }
    this.viewingMade = {
      id: `approval-kept-${event.row.id}-${event.file.name}`,
      kind: event.file.title || event.file.name,
      at: event.file.at || this.thaiToday(),
      fields: [
        { label: 'ไฟล์แนบ', value: event.file.name },
        { label: 'ชื่อเอกสาร', value: event.file.title || event.file.name },
        { label: 'รายการ', value: event.row.title },
      ],
    };
  }

  protected onApprovalListDownloadKept(event: {
    row: ApprovalListRow;
    file: { name: string; title: string; at?: string; href?: string };
  }): void {
    const href = event.file.href || this.approvalKeptHref(Number(event.row.id), event.file.name);
    if (href) {
      void this.downloadAssetFile(href, event.file.name);
      return;
    }
    this.onApprovalListOpenKept(event);
  }

  private approvalKeptHref(round: number, fileName: string): string {
    const row = this.approvalRounds.find((item) => item.round === round);
    return (row?.attachments || []).find((file) => file.name === fileName)?.href || '';
  }

  protected requestAiApproval(): void {
    if (this.approvalAiBusy) return;
    if (this.approvalWordOpen && this.approvalActiveRound) {
      this.startAiApprovalFill();
      return;
    }
    if (!this.canCreateApprovalRound) return;
    this.beginApprovalAgendaPicker('ai');
  }

  protected requestUploadApproval(): void {
    if (!this.canCreateApprovalRound) return;
    this.beginApprovalAgendaPicker('upload');
  }

  private beginApprovalAgendaPicker(mode: 'create' | 'ai' | 'upload' | 'add'): void {
    if ((mode === 'create' || mode === 'ai' || mode === 'upload') && !this.canCreateApprovalRound) return;
    this.loadDraftAgendaVersions();
    if (!this.draftAgendaVersions.length) {
      this.approvalNeedAgendaOpen = true;
      return;
    }
    this.approvalAgendaPickerMode = mode;
    this.approvalAgendaPick = {};
    if (mode === 'add' && this.approvalActiveRound) {
      const current = this.approvalRounds.find((row) => row.round === this.approvalActiveRound);
      (current?.agendaVersions || []).forEach((version) => {
        this.approvalAgendaPick[version] = true;
      });
    } else {
      const latest = this.draftAgendaLatestVersion;
      if (latest) this.approvalAgendaPick = { [latest]: true };
    }
    this.approvalAgendaPickerOpen = true;
    this.approvalPendingFiles = null;
  }

  protected cancelApprovalAgendaPicker(): void {
    this.approvalAgendaPickerOpen = false;
    this.approvalAgendaPickerMode = null;
    this.approvalPendingFiles = null;
  }

  protected dismissApprovalNeedAgenda(): void {
    this.approvalNeedAgendaOpen = false;
  }

  protected onApprovalNeedAgenda(action: string): void {
    this.approvalNeedAgendaOpen = false;
    if (action === 'ยืนยัน') this.pickDraftAgenda();
  }

  protected confirmApprovalAgendaPicker(): void {
    if (!this.canConfirmApprovalAgendaPick || !this.approvalAgendaPickerMode) return;
    const agendaVersions = this.approvalSelectableAgendas
      .filter((row) => this.approvalAgendaPick[row.version])
      .map((row) => row.version);
    const mode = this.approvalAgendaPickerMode;
    this.approvalAgendaPickerOpen = false;
    this.approvalAgendaPickerMode = null;
    if (mode === 'add') {
      this.setApprovalAgendaVersions(agendaVersions);
      return;
    }
    if (mode === 'upload') {
      if (this.approvalPendingFiles?.length) {
        this.commitApprovalUpload(this.approvalPendingFiles, agendaVersions);
        this.approvalPendingFiles = null;
        return;
      }
      this.approvalPendingAgendaVersions = agendaVersions;
      window.setTimeout(() => this.approvalUploadInput?.nativeElement.click(), 0);
      return;
    }
    this.commitApprovalRound('created', agendaVersions, { seedForm: mode !== 'ai' });
    if (mode === 'ai') this.startAiApprovalFill();
  }

  protected onApprovalUploadPicked(event: Event): void {
    const input = event.target as HTMLInputElement;
    const list = input.files;
    if (!list?.length) return;
    if (this.approvalPendingAgendaVersions.length) {
      this.commitApprovalUpload(list, this.approvalPendingAgendaVersions);
      this.approvalPendingAgendaVersions = [];
      input.value = '';
      return;
    }
    this.approvalPendingFiles = list;
    this.beginApprovalAgendaPicker('upload');
    input.value = '';
  }

  private commitApprovalRound(
    source: 'created' | 'ai',
    agendaVersions: number[],
    opts?: { seedForm?: boolean },
  ): void {
    const at = this.approvalStamp();
    const round = this.approvalLatestRound + 1;
    const html = this.buildApprovalFormHtml();
    const title = `เอกสารขออนุมัติ บันทึกเสนอ · รอบ ${round}`;
    const fileName = `เอกสารขออนุมัติ บันทึกเสนอ-รอบ${round}.docx`;
    const entry: ApprovalSubmitRound = {
      round,
      title,
      at,
      html,
      source,
      fileName,
      agendaVersions: [...agendaVersions],
      laneStage: 'draft',
      sarabanNo: '',
      laneHistory: [{ at, by: this.signedPerson || this.officerName || 'เจ้าหน้าที่', action: 'สร้างรายการเสนออนุมัติ' }],
    };
    this.approvalRounds = [...this.approvalRounds, entry];
    this.writeApprovalRounds();
    this.approvalActiveRound = round;
    this.approvalHtml = html;
    this.parkAmendCommentsForDraft();
    this.approvalEmpty = this.amendHtmlIsEmpty(html);
    this.approvalWordOpen = true;
    this.approvalTab = 'editor';
    this.approvalZoom = 100;
    this.loadApprovalComments();
    this.notice = null;
    this.syncFilingUrl();
    window.setTimeout(() => this.fillApprovalEditor(), 0);
    if (opts?.seedForm !== false && source === 'created') {
      this.seedApprovalFormFromSample();
    }
  }

  private commitApprovalUpload(list: FileList | File[], agendaVersions: number[]): void {
    const at = this.approvalStamp();
    const files = [...list];
    const added: ApprovalSubmitRound[] = files.map((file, index) => {
      const round = this.approvalLatestRound + index + 1;
      const title = `${file.name.replace(/\.[^.]+$/, '')} · รอบ ${round}`;
      return {
        round,
        title,
        at,
        html: `<p><strong>ไฟล์อัปโหลด</strong> ${file.name}</p><p>อัปโหลดเมื่อ ${at} — เปิดหรือดาวน์โหลดจากรายการ</p>`,
        source: 'upload' as const,
        fileName: file.name,
        agendaVersions: [...agendaVersions],
        laneStage: 'draft' as const,
        sarabanNo: '',
        laneHistory: [{ at, by: this.signedPerson || this.officerName || 'เจ้าหน้าที่', action: 'อัปโหลดรายการเสนออนุมัติ' }],
      };
    });
    this.approvalRounds = [...this.approvalRounds, ...added];
    this.writeApprovalRounds();
    this.approvalActiveRound = this.approvalLatestRound;
    this.approvalTab = 'files';
    this.approvalWordOpen = false;
    this.notice = null;
    this.syncFilingUrl();
  }

  private startAiApprovalFill(): void {
    if (this.approvalAiBusy) return;
    if (!this.approvalActiveRound) {
      const latestAgenda = this.draftAgendaLatestVersion;
      this.commitApprovalRound('created', latestAgenda ? [latestAgenda] : [], { seedForm: false });
    }
    this.approvalAiBusy = true;
    this.view.markForCheck();
    const minWait = new Promise<void>((resolve) => {
      window.setTimeout(resolve, 10000);
    });
    const fetchSample = fetch(this.approvalSampleUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`sample ${res.status}`);
        return res.text();
      })
      .catch(() => this.buildApprovalFallbackHtml());
    Promise.all([fetchSample, minWait]).then(([html]) => {
      this.applyAiApprovalHtml(typeof html === 'string' ? html : String(html));
      this.approvalAiBusy = false;
      this.view.markForCheck();
    });
  }

  private applyAiApprovalHtml(html: string): void {
    const round = this.approvalActiveRound || this.approvalLatestRound;
    const at = this.approvalStamp();
    this.approvalHtml = html;
    this.approvalEmpty = this.amendHtmlIsEmpty(html);
    if (round) {
      this.approvalRounds = this.approvalRounds.map((row) =>
        row.round === round ? { ...row, html, at, source: 'ai' } : row,
      );
      this.writeApprovalRounds();
    }
    this.notice = null;
    this.approvalWordOpen = true;
    this.approvalTab = 'editor';
    this.syncFilingUrl();
    window.setTimeout(() => this.fillApprovalEditor(), 0);
  }

  protected openApprovalRound(round: number): void {
    const row = this.approvalRounds.find((item) => item.round === round);
    if (!row) return;
    this.parkAmendCommentsForDraft();
    this.approvalActiveRound = round;
    const needsTemplate = this.approvalHtmlNeedsTemplate(row.html);
    this.approvalHtml = needsTemplate ? this.buildApprovalFormHtml() : row.html;
    this.approvalWordOpen = true;
    this.approvalTab = 'editor';
    this.approvalZoom = 100;
    this.loadApprovalComments();
    this.syncFilingUrl();
    window.setTimeout(() => {
      this.fillApprovalEditor();
      this.scheduleAmendWordLayout();
    }, 0);
    if (needsTemplate) this.seedApprovalFormFromSample();
  }

  /** ไฟล์วาระที่ผูกกับรอบที่เปิดอยู่ */
  protected get approvalLinkedAgendas(): DraftAgendaVersion[] {
    const round = this.approvalRounds.find((row) => row.round === this.approvalActiveRound);
    if (!round?.agendaVersions?.length) return [];
    return round.agendaVersions
      .map((version) => this.draftAgendaVersions.find((row) => row.version === version))
      .filter((row): row is DraftAgendaVersion => !!row);
  }

  /** ไฟล์แนบเพิ่มของรอบที่เปิดอยู่ */
  protected get approvalLinkedAttachments(): ApprovalSubmitAttachment[] {
    const round = this.approvalRounds.find((row) => row.round === this.approvalActiveRound);
    return round?.attachments || [];
  }

  protected requestAddApprovalAgenda(): void {
    if (!this.approvalActiveRound) return;
    this.beginApprovalAgendaPicker('add');
  }

  protected removeApprovalAgendaLink(version: number): void {
    const round = this.approvalActiveRound;
    if (!round) return;
    const current = this.approvalRounds.find((row) => row.round === round);
    if (!current) return;
    const next = current.agendaVersions.filter((item) => item !== version);
    if (!next.length) return; // ต้องเหลือวาระอย่างน้อย 1 ไฟล์
    this.setApprovalAgendaVersions(next);
  }

  protected viewApprovalAgendaLink(version: number): void {
    this.captureApprovalEditor();
    this.writeApprovalComments();
    this.approvalWordOpen = false;
    this.approvalTab = 'files';
    this.pickDraftAgenda();
    this.openDraftAgendaVersion(version);
  }

  protected downloadApprovalAgendaLink(row: DraftAgendaVersion): void {
    this.downloadDraftAgendaVersion(row);
  }

  private setApprovalAgendaVersions(versions: number[]): void {
    const round = this.approvalActiveRound;
    if (!round) return;
    this.approvalRounds = this.approvalRounds.map((row) =>
      row.round === round ? { ...row, agendaVersions: [...versions] } : row,
    );
    this.writeApprovalRounds();
    this.view.markForCheck();
  }

  protected requestAddApprovalAttachment(): void {
    this.approvalAttachUploadInput?.nativeElement.click();
  }

  protected onApprovalAttachPicked(event: Event): void {
    const input = event.target as HTMLInputElement;
    const list = input.files;
    if (!list?.length || !this.approvalActiveRound) return;
    const at = this.approvalStamp();
    const added: ApprovalSubmitAttachment[] = [...list].map((file, index) => ({
      id: `apr-att-${Date.now()}-${index}`,
      name: file.name,
      title: file.name.replace(/\.[^.]+$/, ''),
      at,
    }));
    this.approvalRounds = this.approvalRounds.map((row) =>
      row.round === this.approvalActiveRound
        ? { ...row, attachments: [...(row.attachments || []), ...added] }
        : row,
    );
    this.writeApprovalRounds();
    input.value = '';
    this.view.markForCheck();
  }

  protected removeApprovalAttachment(id: string): void {
    const round = this.approvalActiveRound;
    if (!round) return;
    this.approvalRounds = this.approvalRounds.map((row) =>
      row.round === round
        ? { ...row, attachments: (row.attachments || []).filter((item) => item.id !== id) }
        : row,
    );
    this.writeApprovalRounds();
  }

  protected openApprovalUpload(row: ApprovalSubmitRound): void {
    if (row.source === 'created' || row.source === 'ai') {
      this.openApprovalRound(row.round);
      return;
    }
    this.approvalTab = 'files';
    this.syncFilingUrl();
  }

  protected closeApprovalWord(): void {
    this.captureApprovalEditor();
    this.writeApprovalComments();
    this.approvalWordOpen = false;
    this.approvalTab = 'files';
    this.approvalViewerFull = false;
    this.commentPinMode = false;
    this.restoreParkedAmendComments();
    this.syncFilingUrl();
  }

  protected zoomApproval(dir: 1 | -1): void {
    const at = this.approvalZoomSteps.indexOf(this.approvalZoom);
    const index = at < 0 ? this.approvalZoomSteps.indexOf(100) : at;
    const next = this.approvalZoomSteps[Math.min(this.approvalZoomSteps.length - 1, Math.max(0, index + dir))];
    this.approvalZoom = next ?? 100;
    this.scheduleAmendWordLayout();
  }

  protected get approvalZoomCss(): number {
    return (this.approvalZoom / 100) * Math.max(this.approvalFitScale, this.approvalZoomBase);
  }

  protected get canZoomApprovalIn(): boolean {
    return this.approvalZoom < this.approvalZoomSteps[this.approvalZoomSteps.length - 1];
  }

  protected get canZoomApprovalOut(): boolean {
    return this.approvalZoom > this.approvalZoomSteps[0];
  }

  protected toggleApprovalViewerFull(): void {
    this.approvalViewerFull = !this.approvalViewerFull;
    if (this.approvalViewerFull) this.docListCollapsed = true;
    this.scheduleApprovalPageFrames();
  }

  private syncApprovalFitScale(): void {
    const stage = this.approvalStageRef?.nativeElement;
    if (!stage) return;
    const paperW = this.measureMmAsPx(210);
    const layoutW = stage.offsetWidth || stage.clientWidth;
    const avail = Math.max(320, layoutW - 56);
    this.approvalFitScale = Math.max(1.25, avail / paperW);
  }

  protected saveApprovalDraft(): void {
    this.persistApprovalWord(false);
  }

  protected saveApprovalWord(): void {
    this.persistApprovalWord(true);
  }

  protected downloadApprovalWord(): void {
    this.captureApprovalEditor();
    const round = this.approvalActiveRound || this.approvalLatestRound || 1;
    const title = `เอกสารขออนุมัติ บันทึกเสนอ · รอบ ${round}`;
    const fileName = `เอกสารขออนุมัติ บันทึกเสนอ-รอบ${round}-${this.refId || filingRefId}.doc`;
    this.downloadEditorHtmlAsWord(fileName, title, this.approvalHtml || '<p><br></p>');
  }

  protected downloadApprovalRound(row: ApprovalSubmitRound): void {
    if (this.approvalWordOpen && this.approvalActiveRound === row.round) {
      this.downloadApprovalWord();
      return;
    }
    const title = row.title || `เอกสารขออนุมัติ บันทึกเสนอ · รอบ ${row.round}`;
    const base = (row.fileName || `เอกสารขออนุมัติ บันทึกเสนอ-รอบ${row.round}`).replace(/\.[^.]+$/, '');
    const fileName = `${base}-${this.refId || filingRefId}.doc`;
    this.downloadEditorHtmlAsWord(fileName, title, row.html || '<p><br></p>');
  }

  protected renameApprovalRound(round: number, title: string): void {
    const next = title.trim() || `เอกสารขออนุมัติ บันทึกเสนอ · รอบ ${round}`;
    this.approvalRounds = this.approvalRounds.map((row) => (row.round === round ? { ...row, title: next } : row));
    this.writeApprovalRounds();
  }

  protected approvalAtLabel(at: string): string {
    return this.draftAgendaAtLabel(at);
  }

  protected get approvalLaneStage(): ApprovalLaneStage {
    const row = this.approvalRounds.find((item) => item.round === this.approvalActiveRound);
    return row?.laneStage || 'draft';
  }

  /** เสนออนุมัติไม่มีขั้นส่งให้ผู้ยื่น — ข้อความรอหลังอนุมัติต่างจากแจ้งผลการตรวจ */
  protected get approvalLaneWaitingText(): string {
    const stage = this.approvalLaneStage;
    if (stage === 'done') return 'อนุมัติแล้ว — มีฉบับสมบูรณ์ในรายการ (ไม่ส่งให้ผู้ยื่น)';
    if (stage === 'cancelled') return 'รายการนี้ถูกยกเลิกแล้ว';
    return '';
  }

  protected get approvalLaneActor(): ApprovalLaneActor {
    const stage = this.approvalLaneStage;
    const eofficeStage =
      stage === 'eoffice' || stage === 'stamped' || stage === 'numbered' || stage === 'attach';
    if (stage === 'to-head' && (this.reviewRole === 'head' || this.isMyGroupHead())) return 'head';
    if (stage === 'to-director' && (this.reviewRole === 'director' || this.reviewRole === 'staff')) {
      return 'director';
    }
    if (eofficeStage && (this.reviewRole === 'director' || this.reviewRole === 'staff')) return 'director';
    if (this.reviewRole === 'officer' || !this.reviewRole) return 'officer';
    return 'viewer';
  }

  protected get showApprovalEofficePanel(): boolean {
    const stage = this.approvalLaneStage;
    if (stage !== 'eoffice' && stage !== 'stamped' && stage !== 'numbered' && stage !== 'attach') return false;
    return this.approvalLaneActor === 'officer' || this.approvalLaneActor === 'director';
  }

  protected get canFinishApprovalLane(): boolean {
    return this.approvalLaneStage === 'attach' && !!this.approvalEofficeLetterNo.trim();
  }

  protected get approvalEofficePayload(): ApprovalEofficePayload {
    const row = this.approvalRounds.find((item) => item.round === this.approvalActiveRound);
    const fileNames = [
      ...(row?.agendaVersions || []).map((version) => {
        const agenda = this.draftAgendaVersions.find((item) => item.version === version);
        return agenda?.fileName || agenda?.title || `วาระ · เวอร์ชัน ${version}`;
      }),
      ...(row?.attachments || []).map((file) => file.name),
      row?.fileName || '',
    ].filter((name, index, all) => !!name && all.indexOf(name) === index);
    return {
      subject: row?.title || 'เอกสารขออนุมัติ บันทึกเสนอ',
      from: 'กองปกป้องและตอบโต้ทางการค้า กรมการค้าต่างประเทศ',
      to: 'อธิบดีกรมการค้าต่างประเทศ',
      ref: `คำขอเลขที่อ้างอิง ${this.refId}`,
      letterDate: row?.at?.split('·')[0]?.trim() || this.thaiToday(),
      speed: 'ปกติ',
      secrecy: 'ปกติ',
      fileCount: fileNames.length,
      fileNames,
      caseRef: this.refId,
    };
  }

  protected get approvalEofficeLink(): ApprovalEofficeLinkState {
    const row = this.approvalRounds.find((item) => item.round === this.approvalActiveRound);
    return row?.eofficeLink || 'idle';
  }

  protected get approvalEofficeLetterNo(): string {
    return this.approvalRounds.find((item) => item.round === this.approvalActiveRound)?.sarabanNo || '';
  }

  protected get approvalEofficeLinkDetail(): string {
    const link = this.approvalEofficeLink;
    const no = this.approvalEofficeLetterNo;
    if (link === 'sent') return 'ส่งเข้า e-Office แล้ว — รอ sync เลข';
    if (link === 'synced') return `sync แล้ว · ${no || '—'}`;
    if (link === 'error') return 'เชื่อม e-Office ไม่ได้ — กรอกเลขและแนบไฟล์เองได้';
    if (link === 'manual') return `ทำเองในระบบ · ${no || '—'}`;
    return 'ยังไม่ส่ง — กดส่ง Auto หรือกรอกเลขเองเมื่อเชื่อมไม่ได้';
  }

  private patchActiveApprovalEofficeLink(link: ApprovalEofficeLinkState): void {
    const round = this.approvalActiveRound || this.approvalLatestRound;
    if (!round) return;
    this.approvalRounds = this.approvalRounds.map((row) =>
      row.round === round ? { ...row, eofficeLink: link } : row,
    );
    this.writeApprovalRounds();
  }

  protected approvalLaneLabel(stage = this.approvalLaneStage): string {
    const no = this.approvalRounds.find((row) => row.round === this.approvalActiveRound)?.sarabanNo;
    if (stage === 'done' && no) return `จัดเก็บแล้ว · ${no}`;
    if (stage === 'numbered' && no) return `ได้เลข ${no}`;
    return approvalLaneStageLabel(stage);
  }

  protected approvalLaneStageLabel = approvalLaneStageLabel;
  protected approvalLaneStageTone = approvalLaneStageTone;

  private patchActiveApprovalLane(
    stage: ApprovalLaneStage,
    action: string,
    extra?: Partial<Pick<ApprovalSubmitRound, 'sarabanNo'>>,
  ): void {
    const round = this.approvalActiveRound || this.approvalLatestRound;
    if (!round) return;
    const at = this.approvalStamp();
    const by = this.signedPerson || this.officerName || 'เจ้าหน้าที่';
    this.approvalRounds = this.approvalRounds.map((row) => {
      if (row.round !== round) return row;
      return {
        ...row,
        laneStage: stage,
        sarabanNo: extra?.sarabanNo ?? row.sarabanNo ?? '',
        laneHistory: [...(row.laneHistory || []), { at, by, action }],
        ...extra,
      };
    });
    this.writeApprovalRounds();
  }

  protected onApprovalLaneAction(id: ApprovalLaneActionId): void {
    if (id === 'save-draft') {
      this.saveApprovalDraft();
      return;
    }
    if (id === 'send-head') {
      this.patchActiveApprovalLane('to-head', 'ส่งหัวหน้ากลุ่ม');
      this.approvalTab = 'files';
      this.approvalWordOpen = false;
      this.notice = 'saved';
      return;
    }
    if (id === 'return-officer') {
      this.patchActiveApprovalLane('draft', 'ส่งกลับเจ้าหน้าที่');
      this.notice = 'saved';
      return;
    }
    if (id === 'approve-head') {
      this.patchActiveApprovalLane('to-director', 'หัวหน้ากลุ่มเห็นชอบ → ส่งผู้อำนวยการ');
      this.notice = 'saved';
      return;
    }
    if (id === 'approve-director') {
      this.patchActiveApprovalLane('eoffice', 'ผู้อำนวยการเห็นชอบ → รอส่ง e-Office');
      this.patchActiveApprovalEofficeLink('idle');
      this.notice = 'saved';
      return;
    }
    if (id === 'send-eoffice') {
      this.patchActiveApprovalLane('stamped', 'ส่ง Auto เข้า e-Office แล้ว (ยังไม่มีเลข)');
      this.patchActiveApprovalEofficeLink('sent');
      this.notice = 'saved';
      return;
    }
    if (id === 'mark-stamped') {
      this.patchActiveApprovalLane('numbered', 'ประทับตรา / ลงนามแล้ว — รอออกเลข');
      if (this.approvalEofficeLink === 'idle') this.patchActiveApprovalEofficeLink('sent');
      this.notice = 'saved';
      return;
    }
    if (id === 'pull-number') {
      const no = this.filingSaraban || 'สบ.1605/2562';
      this.patchActiveApprovalLane('attach', `ออกเลขสารบรรณ ${no}`, { sarabanNo: no });
      this.patchActiveApprovalEofficeLink('synced');
      this.notice = 'saved';
      return;
    }
    if (id === 'attach-numbered') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.pdf,.doc,.docx';
      input.onchange = () => {
        const list = input.files;
        if (list?.length) this.onApprovalAttachPicked({ target: input } as unknown as Event);
        this.patchActiveApprovalLane('attach', 'แนบไฟล์ที่ออกเลขแล้ว');
        this.notice = 'saved';
      };
      input.click();
      return;
    }
    if (id === 'finish') {
      const no =
        this.approvalRounds.find((row) => row.round === this.approvalActiveRound)?.sarabanNo ||
        this.filingSaraban ||
        'สบ.1605/2562';
      this.patchActiveApprovalLane('done', `จัดเก็บ / ส่งต่อ · ${no}`, { sarabanNo: no });
      this.approvalTab = 'files';
      this.approvalWordOpen = false;
      this.notice = 'saved';
    }
  }

  protected failApprovalEofficeLink(): void {
    if (!this.showApprovalEofficePanel) return;
    this.patchActiveApprovalEofficeLink('error');
    this.patchActiveApprovalLane(this.approvalLaneStage, 'เชื่อม e-Office ไม่ได้ — ใช้โหมดกรอกเอง');
    this.notice = 'saved';
  }

  protected syncApprovalFromEoffice(): void {
    if (!this.showApprovalEofficePanel) return;
    const no = this.approvalEofficeLetterNo || this.filingSaraban || 'สบ.1605/2562';
    this.patchActiveApprovalLane('attach', `sync เลขสารบรรณ ${no} จาก e-Office`, { sarabanNo: no });
    this.patchActiveApprovalEofficeLink('synced');
    this.notice = 'saved';
  }

  protected applyManualApprovalEoffice(payload: { letterNo: string; files: FileList | null }): void {
    if (!this.showApprovalEofficePanel) return;
    const no = payload.letterNo.trim();
    if (!no) return;
    if (payload.files?.length) {
      this.onApprovalAttachPicked({ target: { files: payload.files } } as unknown as Event);
    }
    this.patchActiveApprovalLane('attach', `กรอกเลข ${no} และแนบไฟล์เอง`, { sarabanNo: no });
    this.patchActiveApprovalEofficeLink('manual');
    this.notice = 'saved';
  }

  private approvalStamp(): string {
    return this.replyStamp();
  }

  private persistApprovalWord(closeToFiles: boolean): void {
    this.captureApprovalEditor();
    const round = this.approvalActiveRound || this.approvalLatestRound;
    if (!round) return;
    const at = this.approvalStamp();
    this.approvalRounds = this.approvalRounds.map((row) =>
      row.round === round ? { ...row, html: this.approvalHtml, at } : row,
    );
    this.writeApprovalRounds();
    const kind = 'เอกสารขออนุมัติ บันทึกเสนอ';
    const current = this.approvalRounds.find((row) => row.round === round);
    const fields = [
      field('ชื่อเอกสาร', current?.title || `เอกสารขออนุมัติ บันทึกเสนอ · รอบ ${round}`),
      field('วันที่', at),
      field('รอบ', String(round)),
      field('วาระที่ผูก', (current?.agendaVersions || []).join(', ')),
      field('เนื้อหาเอกสาร', this.approvalHtml, true),
    ];
    const existing = this.madeDocs.find(
      (item) => item.kind === kind && item.fields.some((row) => row.label === 'รอบ' && row.value === String(round)),
    );
    if (existing) {
      this.madeDocs = this.madeDocs.map((item) => (item.id === existing.id ? { ...item, at, fields } : item));
    } else {
      this.madeDocs = [...this.madeDocs, { id: `approval-submit-r${round}`, kind, at, fields }];
    }
    writeMadeDocs(this.madeDocs);
    this.notice = null;
    if (closeToFiles) {
      this.approvalTab = 'files';
      this.approvalWordOpen = false;
      this.syncFilingUrl();
    }
  }

  protected approvalFormat(command: string, value?: string): void {
    document.execCommand('styleWithCSS', false, 'true');
    document.execCommand(command, false, value);
    this.lockOfficialFontOnSelection();
    this.captureApprovalEditor();
    this.refreshAmendToolbar();
    this.approvalEditorRef?.nativeElement.focus();
  }

  protected applyApprovalFontSize(size: string): void {
    this.amendFontSize = size;
    document.execCommand('styleWithCSS', false, 'true');
    document.execCommand('fontSize', false, '3');
    const root = this.approvalEditorRef?.nativeElement;
    root?.querySelectorAll('font[size="3"]').forEach((node) => {
      const span = document.createElement('span');
      span.style.fontSize = size;
      span.style.fontFamily = this.officialFontName;
      span.innerHTML = node.innerHTML;
      node.replaceWith(span);
    });
    this.lockOfficialFontOnSelection();
    this.captureApprovalEditor();
    this.approvalEditorRef?.nativeElement.focus();
  }

  protected applyApprovalColor(color: string): void {
    this.amendColor = color;
    document.execCommand('styleWithCSS', false, 'true');
    document.execCommand('foreColor', false, color);
    this.lockOfficialFontOnSelection();
    this.captureApprovalEditor();
    this.refreshAmendToolbar();
    this.approvalEditorRef?.nativeElement.focus();
  }

  protected applyApprovalHighlight(color: string): void {
    this.amendHighlight = color;
    document.execCommand('styleWithCSS', false, 'true');
    document.execCommand('hiliteColor', false, color === 'transparent' ? 'transparent' : color);
    this.lockOfficialFontOnSelection();
    this.captureApprovalEditor();
    this.refreshAmendToolbar();
    this.approvalEditorRef?.nativeElement.focus();
  }

  protected onApprovalEditorInput(): void {
    this.captureApprovalEditor();
    this.refreshAmendToolbar();
    this.scheduleApprovalPageFrames();
  }

  protected insertApprovalPageBreak(): void {
    const pageH = this.measureMmAsPx(297);
    const editor = this.approvalEditorRef?.nativeElement;
    const sheet = editor?.closest('.word-print-sheet') as HTMLElement | null;
    const stage = this.approvalStageRef?.nativeElement;
    let remain = Math.round(pageH * 0.35);
    const sel = window.getSelection();
    const node = sel?.anchorNode;
    const el = node instanceof Element ? node : node?.parentElement;
    if (el && sheet && stage && sheet.contains(el)) {
      const rect = (el as HTMLElement).getBoundingClientRect();
      const sheetTop = sheet.getBoundingClientRect().top - stage.getBoundingClientRect().top + stage.scrollTop;
      const y = rect.bottom - sheet.getBoundingClientRect().top + stage.scrollTop - sheetTop;
      const offsetInPage = ((y % pageH) + pageH) % pageH;
      remain = Math.max(28, Math.ceil(pageH - offsetInPage));
    }
    const breakHtml =
      `<div class="word-page-break" data-page-break="1" contenteditable="false" style="height:${remain}px" aria-hidden="true"></div>` +
      `<p style="font-family:${this.officialFontName};font-size:16pt;line-height:1.15;margin:0"><br></p>`;
    this.textEditorFormat('insertHTML', breakHtml);
    this.scheduleApprovalPageFrames();
  }

  protected scheduleApprovalPageFrames(): void {
    if (this.approvalLayoutRaf) cancelAnimationFrame(this.approvalLayoutRaf);
    this.approvalLayoutRaf = requestAnimationFrame(() => {
      this.approvalLayoutRaf = 0;
      this.syncApprovalPageFrames();
    });
  }

  private syncApprovalPageFrames(): void {
    const sheet = this.approvalEditorRef?.nativeElement?.closest('.word-print-sheet') as HTMLElement | null;
    const stage = this.approvalStageRef?.nativeElement;
    if (!stage) return;
    this.syncApprovalFitScale();
    const pageH = this.measureMmAsPx(297);
    const sheetTop = sheet
      ? sheet.getBoundingClientRect().top - stage.getBoundingClientRect().top + stage.scrollTop
      : 0;
    const contentH = Math.max(pageH, sheet?.offsetHeight || pageH);
    const count = Math.max(1, Math.ceil(contentH / pageH));
    this.approvalPageFrames = Array.from({ length: count }, (_, i) => ({
      n: i + 1,
      top: sheetTop + i * pageH,
      height: pageH,
    }));
    this.view.markForCheck();
  }

  private captureApprovalEditor(): void {
    const el = this.approvalEditorRef?.nativeElement;
    if (!el) return;
    const empty = !el.textContent?.replace(/\u00a0/g, ' ').replace(/\u200b/g, '').trim();
    this.approvalEmpty = empty;
    this.approvalHtml = empty ? '' : el.innerHTML;
    const round = this.approvalActiveRound;
    if (round) {
      this.approvalRounds = this.approvalRounds.map((row) =>
        row.round === round ? { ...row, html: this.approvalHtml } : row,
      );
      this.writeApprovalRounds();
    }
  }

  private fillApprovalEditor(tries = 0): void {
    const run = () => {
      const el = this.approvalEditorRef?.nativeElement;
      if (!el) {
        if (tries < 8) window.setTimeout(() => this.fillApprovalEditor(tries + 1), 50);
        return;
      }
      if (this.approvalHtmlNeedsTemplate(this.approvalHtml)) {
        this.approvalHtml = this.buildApprovalFormHtml();
        this.seedApprovalFormFromSample();
      }
      el.innerHTML = this.approvalHtml;
      this.approvalEmpty = this.amendHtmlIsEmpty(this.approvalHtml);
      this.refreshAmendToolbar();
      this.scheduleAmendWordLayout();
      window.setTimeout(() => this.scheduleAmendWordLayout(), 120);
      this.view.markForCheck();
    };
    window.setTimeout(run, tries === 0 ? 0 : 50);
  }

  private approvalHtmlNeedsTemplate(html: string): boolean {
    if (!html || this.amendHtmlIsEmpty(html)) return true;
    return !/บันทึกข้อความ/.test(html);
  }

  /** โครงแบบฟอร์มบันทึกข้อความ (ครุฑ + หัวเรื่อง) — ใช้ตอนเปิดหน้าสร้างทันที */
  private buildApprovalFormHtml(): string {
    const font = this.officialFontName;
    return [
      `<div class="approval-memo-sample" data-source="form" style="font-family:${font};font-size:16pt;line-height:1.15;color:#0E2346">`,
      `<p class="approval-memo-head" style="font-family:${font};font-size:16pt;line-height:1.15;margin:0 0 8pt;color:#0E2346;position:relative;min-height:80px;text-align:center">`,
      `<img src="assets/samples/ad1046/agenda/approval/garuda.png" alt="ตราครุฑ" width="78" height="88" style="position:absolute;left:0;top:0;width:78px;height:88px;object-fit:contain" />`,
      `<span style="font-family:${font};font-size:28pt;font-weight:700;display:inline-block;margin-top:28px"><strong>บันทึกข้อความ</strong></span>`,
      `</p>`,
      `<p style="font-family:${font};font-size:16pt;line-height:1.15;margin:0;color:#0E2346;text-align:justify"><strong style="font-size:20pt">ส่วนราชการ</strong> กองปกป้องและตอบโต้ทางการค้า กลุ่ม 1 โทร. ๔๘๕๗, ๔๘๖๕</p>`,
      `<p style="font-family:${font};font-size:16pt;line-height:1.15;margin:0;color:#0E2346;text-align:justify"><strong style="font-size:20pt">ที่</strong> ปค&emsp;<strong style="font-size:20pt">วันที่</strong> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ตุลาคม ๒๕๖๓</p>`,
      `<p style="font-family:${font};font-size:16pt;line-height:1.15;margin:0;color:#0E2346;text-align:justify"><strong style="font-size:20pt">เรื่อง</strong> การพิจารณาคำขอให้ดำเนินการพิจารณาตอบโต้การทุ่มตลาด</p>`,
      `<p style="font-family:${font};font-size:16pt;line-height:1.15;margin:0;color:#0E2346;text-align:justify"><strong style="font-size:20pt">เรียน</strong> อธิบดี</p>`,
      `<p style="font-family:${font};font-size:16pt;line-height:1.15;margin:12pt 0 0;color:#0E2346"><br></p>`,
      `</div>`,
    ].join('');
  }

  /** โหลดต้นฉบับบันทึกเสนอใส่ editor ทันทีหลังสร้าง (ไม่รอ AI) */
  private approvalSeedInFlight = false;
  private seedApprovalFormFromSample(): void {
    if (this.approvalSeedInFlight) return;
    const round = this.approvalActiveRound;
    if (!round) return;
    this.approvalSeedInFlight = true;
    fetch(this.approvalSampleUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`sample ${res.status}`);
        return res.text();
      })
      .then((html) => {
        if (this.approvalActiveRound !== round) return;
        this.approvalHtml = html;
        this.approvalEmpty = this.amendHtmlIsEmpty(html);
        this.approvalRounds = this.approvalRounds.map((row) =>
          row.round === round ? { ...row, html, source: row.source === 'ai' ? 'ai' : 'created' } : row,
        );
        this.writeApprovalRounds();
        const el = this.approvalEditorRef?.nativeElement;
        if (el) {
          el.innerHTML = html;
          this.approvalEmpty = false;
        } else {
          this.fillApprovalEditor();
        }
        this.scheduleAmendWordLayout();
        this.view.markForCheck();
      })
      .catch(() => {
        /* คงโครงแบบฟอร์มที่เปิดไว้แล้ว */
      })
      .finally(() => {
        this.approvalSeedInFlight = false;
      });
  }

  private buildApprovalFallbackHtml(): string {
    return this.buildApprovalFormHtml();
  }

  private loadApprovalRounds(): void {
    try {
      const raw = sessionStorage.getItem(this.approvalRoundsKey);
      if (raw) {
        const parsed = JSON.parse(raw) as ApprovalSubmitRound[];
        if (Array.isArray(parsed)) {
          this.approvalRounds = parsed
            .filter(
              (row) => row && typeof row.round === 'number' && typeof row.html === 'string' && Array.isArray(row.agendaVersions),
            )
            .map((row) => ({
              ...row,
              title: (row.title || '').replaceAll('เอกสารขออนุมัติ_บันทึกเสนอ', 'เอกสารขออนุมัติ บันทึกเสนอ'),
              fileName: row.fileName
                ? row.fileName.replaceAll('เอกสารขออนุมัติ_บันทึกเสนอ', 'เอกสารขออนุมัติ บันทึกเสนอ')
                : row.fileName,
              attachments: Array.isArray(row.attachments)
                ? row.attachments.map((file) => ({ ...file }))
                : [],
              laneStage: row.laneStage || 'draft',
              sarabanNo: row.sarabanNo || '',
              laneHistory: Array.isArray(row.laneHistory) ? row.laneHistory : [],
              html: this.approvalHtmlNeedsTemplate(row.html) ? this.buildApprovalFormHtml() : row.html,
            }));
        }
      }
    } catch {
      /* ignore */
    }
    if (this.reviewRole) this.ensureApprovalSubmitSamples(true);
    this.approvalActiveRound = this.approvalLatestRound;
    const current = this.approvalRounds.find((row) => row.round === this.approvalActiveRound);
    if (current) this.approvalHtml = current.html;
    this.writeApprovalRounds();
  }

  /**
   * ตัวอย่างเสนออนุมัติตามเคส AD1046 (บันทึกเสนอ อธ.)
   * แนบไฟล์เก็บในรายการ — ฉบับร่างทุกครั้ง · รอบอนุมัติแล้วมีฉบับสมบูรณ์ด้วย (ไม่ส่งให้ผู้ยื่น)
   */
  private ensureApprovalSubmitSamples(force = false): void {
    const samples = this.buildApprovalSubmitSamples();
    const ids = new Set(samples.map((row) => `sample-approval-${row.round}`));
    const tagged = this.approvalRounds.filter((row) => (row.fileName || '').startsWith('sample-approval-') || ids.has(`sample-approval-${row.round}`));
    const hasEditionFiles = samples.every((sample) => {
      const current = this.approvalRounds.find((row) => row.round === sample.round);
      if (!current || current.laneStage !== sample.laneStage) return false;
      const files = current.attachments || [];
      const hasDraft = files.some((file) => file.edition === 'draft' && !!file.href);
      if (sample.laneStage === 'done') {
        return hasDraft && files.some((file) => file.edition === 'final' && !!file.href);
      }
      return hasDraft;
    });
    const onlySamples =
      this.approvalRounds.length === samples.length &&
      this.approvalRounds.every((row) => samples.some((sample) => sample.round === row.round));
    if (!force && onlySamples && hasEditionFiles && tagged.length === samples.length) return;

    this.approvalRounds = samples;
    this.approvalActiveRound = samples[samples.length - 1]?.round || 0;
    const current = this.approvalRounds.find((row) => row.round === this.approvalActiveRound);
    if (current) this.approvalHtml = current.html;
    this.writeApprovalRounds();
  }

  private buildApprovalSubmitSamples(): ApprovalSubmitRound[] {
    const officer = this.signedPerson || this.officerName || 'นางสาวจรีณา กิจส่งเสริมกุล';
    const draftHref = 'assets/samples/ad1046/agenda/approval/1-บันทึกเสนอ-อธ-เข้าอนุฯ-พิจารณาคำขอ.html';
    const finalHref = 'assets/samples/ad1046/agenda/approval/1-บันทึกเสนอ-อธ-เข้าอนุฯ-พิจารณาคำขอ-ฉบับสมบูรณ์.html';
    const rounds: Array<{
      round: number;
      at: string;
      source: ApprovalSubmitRound['source'];
      stage: ApprovalLaneStage;
      detail: string;
    }> = [
      {
        round: 1,
        at: '02/10/2563 · 09:20 น.',
        source: 'ai',
        stage: 'cancelled',
        detail: 'ร่างบันทึกเสนอรอบแรก — ส่งกลับแก้ไขประเด็น Causal Link',
      },
      {
        round: 2,
        at: '15/10/2563 · 11:05 น.',
        source: 'ai',
        stage: 'cancelled',
        detail: 'ร่างรอบสองหลังแก้ตามความเห็น — ยังไม่ครบตามข้อพิจารณาอนุฯ',
      },
      {
        round: 3,
        at: '28/10/2563 · 14:30 น.',
        source: 'created',
        stage: 'done',
        detail: 'บันทึกเสนอฉบับสมบูรณ์ตามเคส AD1046 — เก็บในท่อ ไม่ส่งให้ผู้ยื่น',
      },
    ];

    const formHtml = this.buildApprovalFormHtml();
    return rounds.map((row) => {
      const title = `เอกสารขออนุมัติ บันทึกเสนอ · รอบ ${row.round}`;
      const date = row.at.split('·')[0]?.trim() || row.at;
      const draftName = `บันทึกเสนอ-อธ-เข้าอนุฯ-รอบ-${row.round}-ร่าง.html`;
      const finalName = `บันทึกเสนอ-อธ-เข้าอนุฯ-รอบ-${row.round}-ฉบับสมบูรณ์.html`;
      const history: ApprovalLaneHistoryEntry[] = [
        { at: row.at, by: officer, action: 'สร้าง/แนบฉบับร่างบันทึกเสนอ' },
        { at: row.at, by: officer, action: 'ส่งหัวหน้ากลุ่ม — ขออนุมัติฉบับร่าง' },
        { at: row.at, by: 'หัวหน้ากลุ่ม', action: row.stage === 'cancelled' ? 'หัวหน้ากลุ่มส่งกลับแก้ไข' : 'หัวหน้ากลุ่มเห็นชอบ' },
      ];
      if (row.stage === 'cancelled') {
        history.push({ at: row.at, by: officer, action: `ปฏิเสธ / ยกเลิกรอบ ${row.round} — ${row.detail}` });
      } else {
        history.push(
          { at: row.at, by: officer, action: 'ผู้อำนวยการเห็นชอบ' },
          { at: row.at, by: officer, action: 'อนุมัติแล้ว — แนบไฟล์ฉบับสมบูรณ์เก็บในรายการ' },
        );
      }
      const attachments: NonNullable<ApprovalSubmitRound['attachments']> = [
        {
          id: `sample-approval-draft-${row.round}`,
          name: draftName,
          title: `บันทึกเสนอ อธ. เข้าอนุฯ พิจารณาคำขอ · ฉบับร่าง (รอบ ${row.round})`,
          at: date,
          href: draftHref,
          edition: 'draft',
        },
      ];
      if (row.stage === 'done') {
        attachments.push({
          id: `sample-approval-final-${row.round}`,
          name: finalName,
          title: `บันทึกเสนอ อธ. เข้าอนุฯ พิจารณาคำขอ · ฉบับสมบูรณ์ (รอบ ${row.round})`,
          at: date,
          href: finalHref,
          edition: 'final',
        });
      }
      return {
        round: row.round,
        title,
        at: row.at,
        html: formHtml,
        source: row.source,
        fileName: `sample-approval-${row.round}`,
        agendaVersions: [1],
        attachments,
        laneStage: row.stage,
        sarabanNo: row.stage === 'done' ? 'สบ.1840/2563' : '',
        laneHistory: history,
        eofficeLink: row.stage === 'done' ? 'synced' : 'idle',
      };
    });
  }

  private writeApprovalRounds(): void {
    try {
      sessionStorage.setItem(this.approvalRoundsKey, JSON.stringify(this.approvalRounds));
    } catch {
      /* ignore */
    }
  }

  private approvalCommentsStorageKey(round = this.approvalActiveRound): string {
    return `${this.approvalCommentsKey}-r${round || 0}`;
  }

  private loadApprovalComments(): void {
    try {
      const raw = sessionStorage.getItem(this.approvalCommentsStorageKey());
      const parsed = raw ? (JSON.parse(raw) as AmendWordComment[]) : [];
      this.amendWordComments = Array.isArray(parsed) ? parsed : [];
    } catch {
      this.amendWordComments = [];
    }
    this.amendWordActiveId = '';
    this.amendWordDraftId = '';
    this.commentPinMode = false;
  }

  private writeApprovalComments(): void {
    try {
      const key = this.approvalCommentsStorageKey();
      if (!this.amendWordComments.length) sessionStorage.removeItem(key);
      else sessionStorage.setItem(key, JSON.stringify(this.amendWordComments));
    } catch {
      /* ignore */
    }
  }

  protected pickExtend(): void {
    if (this.agencyWordOpen) {
      this.captureAgencySummaryEditor();
      this.agencyWordOpen = false;
    }
    this.completeBundle = '';
    this.docPart = this.extendPart;
    this.editingId = '';
    this.docShelf = 'files';
    this.syncFilingUrl();
  }

  protected extendDot(): string {
    if (!this.extendRoundCount) return 'assets/icons/por1-dot.svg';
    if (this.extendStatusLabel === 'รอพิจารณา') return 'assets/icons/por1-dot-wait.svg';
    return 'assets/icons/por1-dot-done.svg';
  }

  protected get extendRoundCount(): number {
    return this.extendRounds.length;
  }

  protected get extendStatusLabel(): string {
    return this.extendRounds[0]?.status || 'ยังไม่มีคำขอ';
  }

  protected get extendRounds(): {
    at: string;
    due: string;
    reason: string;
    status: string;
    tone: 'success' | 'info' | 'warning' | 'danger' | 'neutral';
  }[] {
    const rows: {
      at: string;
      due: string;
      reason: string;
      status: string;
      tone: 'success' | 'info' | 'warning' | 'danger' | 'neutral';
    }[] = [];
    if (this.replySent && this.replyKind === 'extend') {
      rows.push({
        at: this.replyAt || '—',
        due: this.replyNewDue || '—',
        reason: this.amendReason || '—',
        status: 'รอพิจารณา',
        tone: 'warning',
      });
    }
    for (const pass of this.noticePasses) {
      const reply = pass.reply;
      if (!reply || reply.kind !== 'extend') continue;
      rows.push({
        at: reply.at || pass.noticedOn || '—',
        due: reply.newDue || '—',
        reason: reply.reason || pass.note || '—',
        status: 'บันทึกแล้ว',
        tone: 'info',
      });
    }
    return rows;
  }

  protected get extendFiles(): ReplyFile[] {
    const fromReply = this.replyFilesOf('extend');
    if (fromReply.length) return fromReply;
    const fromPasses = this.noticePasses.flatMap((pass) =>
      pass.reply?.kind === 'extend' ? pass.reply.files?.filter((file) => file.group === 'extend') || [] : [],
    );
    return fromPasses;
  }

  protected get openEditionKind(): string {
    return OPEN_EDITION_KIND;
  }

  protected get closedEditionKind(): string {
    return CLOSED_EDITION_KIND;
  }

  protected editionKindAt(part = this.docPart): string {
    if (part === this.openEditionPart) return OPEN_EDITION_KIND;
    if (part === this.closedEditionPart) return CLOSED_EDITION_KIND;
    return '';
  }

  protected openDocShelf(shelf: 'files' | 'committee'): void {
    // แท็บคณะกรรมการซ่อนไว้ก่อน — บังคับอยู่ที่รายการเอกสาร
    this.docShelf = 'files';
    if (shelf === 'committee' || this.docPart === this.committeePart) this.pickDoc(-1);
  }

  protected pickDoc(index: number): void {
    // ฉบับสมบูรณ์เปิดเป็นรวมเล่ม — คณะกรรมการยังซ่อนในรายการนี้
    if (index === this.openEditionPart) {
      this.pickCompleteBundle('open');
      return;
    }
    if (index === this.closedEditionPart) {
      this.pickCompleteBundle('closed');
      return;
    }
    if (index === this.extendPart) {
      this.pickExtend();
      return;
    }
    if (index === this.draftAgendaPart) {
      this.pickDraftAgenda();
      return;
    }
    if (index === this.approvalSubmitPart) {
      this.pickApprovalSubmit();
      return;
    }
    if (index === this.subAgendaPart) {
      this.pickSubAgenda();
      return;
    }
    if (index === this.meetingPackPart || index === this.meetingResolutionPart) {
      if (!this.meetingBureauFlowEnabled) {
        this.pickSubAgenda();
        return;
      }
      if (index === this.meetingPackPart) this.pickMeetingPack();
      else this.pickMeetingResolution();
      return;
    }
    this.completeBundle = '';
    const next = index === this.committeePart || index > this.extendPart ? -1 : index;
    if (this.agencyWordOpen && this.workDocs[next]?.title !== 'สรุปข้อมูลจากหน่วยงานที่เกี่ยวข้อง') {
      this.captureAgencySummaryEditor();
      this.agencyWordOpen = false;
    }
    this.docPart = next;
    this.editingId = '';
    this.docShelf = 'files';
    if (next >= 0 && next < this.workDocs.length) {
      this.ensureAgencyDocForms(this.workDocs[next].title);
    }
    this.syncFilingUrl();
  }

  /** โหมดรวมเล่มฉบับสมบูรณ์หลังแจ้งครบถ้วน — แยกเปิดเผย / ปกปิด */
  protected completeBundle: '' | 'open' | 'closed' = '';

  /** เลือกแบบคำขอ — เปิดเล่มรอบยื่นครั้งแรกตาม Prototype */
  protected pickFilingBundle(): void {
    this.completeBundle = '';
    this.ensureRoundFolders();
    this.pickDoc(-1);
    this.bundleEdition = 'original';
    this.bundleComments = this.readBundleComments();
    this.bundleReviewNotes = this.readBundleReviewNotes();
    this.bundleFormCode = this.caseForms[0]?.code || 'ปร. 1';
    this.bundleRoundNo = this.bundleRoundOptions.at(-1)?.round || this.bundleRoundOptions[0]?.round || 1;
    this.placeBundleItem(this.bundleToc[0]?.items[0] || null);
  }

  /** เปิดรวมเล่มฉบับเปิดเผยสมบูรณ์ / ฉบับปกปิดสมบูรณ์ — UI เดียวกับแบบคำขอ */
  protected pickCompleteBundle(kind: 'open' | 'closed'): void {
    this.ensureRoundFolders();
    this.completeBundle = kind;
    this.docPart = kind === 'open' ? this.openEditionPart : this.closedEditionPart;
    this.editingId = '';
    this.docShelf = 'files';
    this.ensureOpenEditionFiles();
    this.ensureClosedEditionFiles();
    this.bundleEdition = 'original';
    this.bundleComments = this.readBundleComments();
    this.bundleReviewNotes = this.readBundleReviewNotes();
    this.bundleFormCode = this.caseForms[0]?.code || 'ปร. 1';
    this.bundleRoundNo = this.bundleRoundOptions.at(-1)?.round || this.bundleRoundOptions[0]?.round || 1;
    this.placeBundleItem(this.bundleToc[0]?.items[0] || null);
    this.syncFilingUrl();
  }

  protected get showFilingBundle(): boolean {
    return this.docPart < 0 || !!this.completeBundle;
  }

  protected get showCompleteBundle(): boolean {
    return !!this.completeBundle;
  }

  /** ชื่อหัวเล่ม — แบบคำขอ หรือฉบับสมบูรณ์ */
  protected get activeBundleTitle(): string {
    if (this.completeBundle === 'open') return OPEN_EDITION_KIND;
    if (this.completeBundle === 'closed') return CLOSED_EDITION_KIND;
    return this.bundleDocTitle;
  }

  protected get completeBundleKind(): string {
    return this.completeBundle === 'closed' ? CLOSED_EDITION_KIND : OPEN_EDITION_KIND;
  }

  protected get completeBundleFiles(): { kind: string; name: string; title: string; sentOn: string }[] {
    if (!this.completeBundle) return [];
    return this.extrasOf(this.completeBundleKind);
  }

  /** รอบที่เปิดดูเล่ม (หนึ่งรอบ = หนึ่งโฟลเดอร์ เช่น 1. 15 พค 62) */
  protected bundleRoundNo = 1;

  protected get bundleRoundOptions(): { round: number; folder: string; on: string }[] {
    const source = this.rounds.length ? this.rounds : this.ad1046SampleRounds();
    // แสดงทุกรอบที่ยื่น — แบบคำขอ + แก้ไขที่ยื่นเข้ามาใหม่ (ยึดครั้งล่าสุดตอนแจ้งผล)
    return source.map((round) => ({
      round: round.round,
      folder: round.folder || this.roundFolderName(round.round, round.submittedOn),
      on: round.submittedOn,
    }));
  }

  /** จำนวนครั้งที่ยื่น — โชว์ท้ายชื่อ เช่น แบบคำขอ (2) */
  protected get bundleRoundCount(): number {
    return Math.max(1, this.bundleRoundOptions.length);
  }

  /** ชื่อในรายการเอกสาร + หัวหน้าเล่ม */
  protected get bundleDocTitle(): string {
    return `แบบคำขอ (${this.bundleRoundCount})`;
  }

  protected get filingBundleRound(): FilingRound | null {
    return this.rounds.find((round) => round.round === this.bundleRoundNo) || this.rounds.at(-1) || null;
  }

  protected get bundleRoundFolder(): string {
    const picked = this.bundleRoundOptions.find((row) => row.round === this.bundleRoundNo);
    if (picked) return picked.folder;
    return this.roundFolderName(this.bundleRoundNo, this.filingBundleRound?.submittedOn || this.filedOn);
  }

  protected pickBundleRound(round: number): void {
    if (!this.bundleRoundOptions.some((row) => row.round === round)) return;
    const wasAmend = this.bundleEdition === 'amend';
    this.bundleRoundNo = round;
    if (wasAmend) {
      this.loadAmendWorkspace();
      this.fillAmendEditor();
    } else {
      const current = this.bundleToc.flatMap((group) => group.items).find((item) => this.bundleItemCurrent(item));
      this.placeBundleItem(current || this.bundleToc[0]?.items[0] || null);
    }
  }

  /** ตารางส่วนที่ 2 ตามรอบยื่น — รอบแก้ไขเติมข้อ 2.1.10 ตามหนังสือกรม */
  protected get goodsCompareForRound(): GoodsCompareRow[] {
    if (this.bundleRoundNo < 2) return this.goodsCompare;
    return this.goodsCompare.map((row) => {
      if (!row.item.includes('2.1.10')) return row;
      return {
        ...row,
        subject:
          'ส่วนที่เหมือนกัน: ลักษณะทางกายภาพ เคมี มาตรฐาน และกระบวนการผลิตใช้ทดแทนกันได้\nส่วนที่แตกต่างกัน: แหล่งกำเนิดและช่องทางจำหน่ายต่างกันตามข้อ 2.1.5–2.1.9',
        like: 'เหมือนกันในส่วนที่ใช้ทดแทนกันได้ในตลาดเดียวกัน',
      };
    });
  }

  /** เติมชื่อโฟลเดอร์รอบยื่น — รวมครั้งแก้ไขที่ยื่นเข้ามาใหม่ */
  private ensureRoundFolders(): void {
    const sample = this.ad1046SampleRounds();
    const needsSeed =
      this.reviewRole ||
      !this.rounds.length ||
      this.rounds.length < sample.length ||
      !this.rounds.some((round) => round.round === sample[sample.length - 1]?.round);
    if (needsSeed) {
      this.rounds = sample;
      writeRounds(this.rounds);
      this.bundleRoundNo = sample[sample.length - 1]?.round || 1;
      return;
    }
    let changed = false;
    this.rounds = this.rounds.map((round) => {
      const folder = this.roundFolderName(round.round, round.submittedOn);
      if (round.folder === folder) return round;
      changed = true;
      return { ...round, folder };
    });
    if (changed) writeRounds(this.rounds);
  }

  /**
   * รอบยื่น AD1046 — แบบคำขอ + แก้ไขที่ยื่นเข้ามาใหม่ 3 ครั้ง
   * ครั้งล่าสุด = แก้ไขคำขอครั้งที่ 3 (9 ตค 63)
   */
  private ad1046SampleRounds(): FilingRound[] {
    const annex = this.realFilingAnnex();
    const firstOn = this.prototypeActionDay();
    const baseAnswers = this.formAnswers();
    const amendOns = [
      { round: 2, on: '22/07/2563' },
      { round: 3, on: '15/09/2563' },
      { round: 4, on: '09/10/2563' },
    ];
    const first: FilingRound = {
      round: 1,
      submittedOn: firstOn,
      folder: this.roundFolderName(1, firstOn),
      state: 'revision',
      company: this.company,
      measure: this.measureName,
      signer: this.signer,
      files: annex,
      findings: this.revisionFindings,
      answers: baseAnswers,
    };
    const amends: FilingRound[] = amendOns.map((row, index) => ({
      round: row.round,
      submittedOn: row.on,
      folder: this.roundFolderName(row.round, row.on),
      state: index === amendOns.length - 1 ? 'review' : 'revision',
      company: this.company,
      measure: this.measureName,
      signer: this.signer,
      files: annex,
      findings: this.revisionFindings,
      answers: baseAnswers,
    }));
    return [first, ...amends];
  }

  /** วันที่ยื่น/กระทำสำหรับ Prototype — ใช้วันปัจจุบัน (หรือวันที่ action ที่บันทึกไว้) */
  private prototypeActionDay(): string {
    const saved = (sessionStorage.getItem('dft-por1-action-on') || '').split(' ')[0];
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(saved)) return saved;
    return this.thaiToday() || this.clockToday() || this.filedOn || firstFiledOn;
  }

  /** ชื่อโฟลเดอร์รอบยื่น — เช่น 1. แบบคำขอครั้งที่ 1 (23พย69) */
  private roundFolderName(round: number, submittedOn: string): string {
    const short = this.thaiFolderDate(submittedOn);
    const compact = short.replace(/\s+/g, '');
    if (round <= 1) return `1. แบบคำขอครั้งที่ 1 (${compact})`;
    if (round === 2) return `2. คำขอแก้ไขครั้งที่ 1 (${compact})`;
    return `${round}. แก้ไขคำขอครั้งที่ ${round - 1} (${compact})`;
  }

  private thaiFolderDate(value: string): string {
    const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value.trim());
    if (!match) return value;
    const months = ['มค', 'กพ', 'มีค', 'เมย', 'พค', 'มิย', 'กค', 'สค', 'กย', 'ตค', 'พย', 'ธค'];
    const day = Number(match[1]);
    const month = months[Number(match[2]) - 1] || match[2];
    const year = Number(match[3]);
    const shortYear = String(year > 2400 ? year - 2500 : year % 100).padStart(2, '0');
    return `${day} ${month} ${shortYear}`;
  }

  protected get filingBundleReady(): boolean {
    return this.caseForms.length > 0 && (this.caseStatus === 'official' || this.caseStatus === 'approval' || this.rounds.length > 0 || !!this.reviewRole);
  }

  /** ต้นฉบับ = อ่านเล่ม · แก้ไขคำขอ = กระดาษว่างให้เจ้าหน้าที่พิมพ์ · ฉบับตรวจซ่อนไว้ก่อน */
  protected bundleEdition: 'original' | 'review' | 'amend' = 'original';
  protected bundleComments: BundleComment[] = [];
  protected bundleCommentTarget = '';
  protected bundleCommentDraft = '';
  protected bundleReviewNotes: Record<string, string> = {};
  /** ข้อความแก้ไขคำขอต่อรอบยื่น (HTML จาก text editor) */
  protected bundleAmendText = '';
  protected amendEditorEmpty = true;
  protected amendMarks: Record<string, boolean> = {};
  protected amendFontSize = '16pt';
  protected amendColor = '#0E2346';
  protected amendHighlight = 'transparent';
  /** ฟอนต์เอกสารราชการ — ล็อกเหลือ TH SarabunPSK เท่านั้น */
  protected readonly officialFontName = 'TH SarabunPSK';
  /** ขนาดตัวอักษรแบบราชการ (pt) */
  protected readonly amendFontSizes = [
    { label: '14', value: '14pt' },
    { label: '16', value: '16pt' },
    { label: '18', value: '18pt' },
    { label: '20', value: '20pt' },
    { label: '22', value: '22pt' },
    { label: '24', value: '24pt' },
    { label: '28', value: '28pt' },
    { label: '36', value: '36pt' },
  ] as const;
  /** สีตัวอักษรจาก design-system/colors.ts เท่านั้น */
  protected readonly amendColors = [
    { label: 'หลัก', value: '#0E2346' },
    { label: 'รอง', value: '#5B6785' },
    { label: 'ลิงก์', value: '#2F73B0' },
    { label: 'ฟ้า', value: '#5CA4D9' },
    { label: 'เขียว', value: '#1E7F4F' },
    { label: 'ส้ม', value: '#E8801E' },
    { label: 'เหลือง', value: '#B7791F' },
    { label: 'แดง', value: '#C0182B' },
  ] as const;
  /** สีเน้นข้อความ (ไฮไลต์) จาก design tokens */
  protected readonly amendHighlights = [
    { label: 'ไม่มี', value: 'transparent' },
    { label: 'เหลือง', value: '#FDF3E1' },
    { label: 'เขียว', value: '#E8F4EE' },
    { label: 'ฟ้า', value: '#E6F1F9' },
    { label: 'ชมพู', value: '#FAECEE' },
    { label: 'เทา', value: '#F2F2F3' },
  ] as const;
  /** Tree โฟลเดอร์แนบไฟล์ตอนแก้ไขคำขอ */
  protected amendFolders: { id: string; name: string; open: boolean }[] = [];
  protected amendFiles: { id: string; folderId: string; name: string; saved: string }[] = [];
  protected amendFolderId = '';
  protected amendFolderEditId = '';
  protected amendFolderDraft = '';
  protected amendTreeCollapsed = true;
  @ViewChild('amendEditor') private amendEditorRef?: ElementRef<HTMLElement>;
  @ViewChild('agencySummaryEditor') private agencySummaryEditorRef?: ElementRef<HTMLElement>;
  @ViewChild('draftAgendaEditor') private draftAgendaEditorRef?: ElementRef<HTMLElement>;
  @ViewChild('draftAgendaStage') private draftAgendaStageRef?: ElementRef<HTMLElement>;
  @ViewChild('approvalEditor') private approvalEditorRef?: ElementRef<HTMLElement>;
  @ViewChild('approvalStage') private approvalStageRef?: ElementRef<HTMLElement>;
  @ViewChild('approvalUpload') private approvalUploadInput?: ElementRef<HTMLInputElement>;
  @ViewChild('approvalAttachUpload') private approvalAttachUploadInput?: ElementRef<HTMLInputElement>;
  protected agencyWordOpen = false;
  protected agencySummaryHtml = '';
  protected agencySummaryEmpty = true;
  protected agencyReplyPick: Record<string, boolean> = {};
  private readonly agencySummaryHtmlKey = 'dft-por1-agency-summary-html';
  protected draftAgendaWordOpen = false;
  protected draftAgendaHtml = '';
  protected draftAgendaEmpty = true;
  protected draftAgendaVersions: DraftAgendaVersion[] = [];
  protected draftAgendaActiveVersion = 0;
  /** แท็บหน้าวาระ — ไฟล์ (หน้าแรก) | editor (ร่าง text) */
  protected draftAgendaTab: 'files' | 'editor' = 'files';
  /** รอ confirm ก่อนสร้างเวอร์ชันใหม่ — create | ai */
  protected draftAgendaVersionConfirm: 'create' | 'ai' | null = null;
  /** AI กำลังดึงรูปแบบจากตัวอย่างวาระ */
  protected draftAgendaAiBusy = false;
  /** ซูมกระดาษวาระ — 100% = เต็มความกว้างพื้นที่อ่าน */
  protected draftAgendaZoom = 100;
  protected draftAgendaViewerFull = false;
  /** สเกลให้กระดาษกว้างเท่าพื้นที่ editor */
  protected draftAgendaFitScale = 1.5;
  /** กรอบหน้า A4 + เลขหน้า แบบ Word Print Layout */
  protected draftAgendaPageFrames: { n: number; top: number; height: number }[] = [{ n: 1, top: 0, height: 1123 }];
  private draftAgendaLayoutRaf = 0;
  private readonly draftAgendaZoomBase = 1.5;
  private readonly draftAgendaZoomSteps = [50, 75, 100, 125, 150, 200];
  private readonly draftAgendaSampleUrl =
    'assets/samples/ad1046/agenda/sub/2-วาระพิจารณาคำขอเปิดไต่สวน.html';
  private readonly draftAgendaVersionsKey = 'dft-por1-draft-agenda-versions';
  protected approvalWordOpen = false;
  protected approvalHtml = '';
  protected approvalEmpty = true;
  protected approvalRounds: ApprovalSubmitRound[] = [];
  protected approvalActiveRound = 0;
  protected approvalTab: 'files' | 'editor' = 'files';
  protected approvalAiBusy = false;
  protected approvalZoom = 100;
  protected approvalViewerFull = false;
  protected approvalFitScale = 1.5;
  protected approvalPageFrames: { n: number; top: number; height: number }[] = [{ n: 1, top: 0, height: 1123 }];
  private approvalLayoutRaf = 0;
  private readonly approvalZoomBase = 1.5;
  private readonly approvalZoomSteps = [50, 75, 100, 125, 150, 200];
  private readonly approvalSampleUrl =
    'assets/samples/ad1046/agenda/approval/1-บันทึกเสนอ-อธ-เข้าอนุฯ-พิจารณาคำขอ.html';
  private readonly approvalRoundsKey = 'dft-por1-approval-submit-rounds';
  private readonly approvalCommentsKey = 'dft-por1-approval-submit-comments';
  protected approvalAgendaPickerOpen = false;
  protected approvalAgendaPickerMode: 'create' | 'ai' | 'upload' | 'add' | null = null;
  protected approvalAgendaPick: Record<number, boolean> = {};
  protected approvalNeedAgendaOpen = false;
  protected approvalPendingAgendaVersions: number[] = [];
  private approvalPendingFiles: FileList | File[] | null = null;
  /** ระบบสร้างฉบับเปิดเผยจากฉบับปกปิดแล้ว (ตามประชุม 19/11) */
  protected openEditionBuilt = false;
  /** รายชื่อผู้ผลิตที่ติ๊กส่ง Pre-questionnaire */
  protected agencyProducerPick: Record<string, boolean> = {
    ssi: true,
    gsteel: true,
    gj: true,
    sahamit: true,
  };
  /** สถานะส่งอนุมัติ Pre-questionnaire: ร่าง → หัวหน้ากลุ่ม → ผอ. → ส่งแล้ว */
  protected preQnPipe: 'draft' | 'head' | 'director' | 'sent' = 'draft';
  /** Comment แบบ Word บนเล่มแก้ไขคำขอ */
  protected amendWordComments: AmendWordComment[] = [];
  protected amendWordDraftId = '';
  protected amendWordDraftQuote = '';
  protected amendWordDraftText = '';
  protected amendWordReplyTo = '';
  protected amendWordActiveId = '';
  /** โหมดปักกล้อง — คลิกหรือลากวางบนแถว/จุดในเล่ม */
  protected commentPinMode = false;
  protected amendWordPinLayout: AmendWordPinLayout[] = [];
  protected amendWordCardTops: Record<string, number> = {};
  protected amendWordCardLefts: Record<string, number> = {};
  /** กรอบหน้ากระดาษ A4 แนวตั้งแบบ Word Print Layout */
  protected amendPageFrames: { n: number; top: number; height: number }[] = [{ n: 1, top: 0, height: 1123 }];
  /** ฟอง Comment ลอยเมื่อเลือกข้อความ (แบบ Word Online) */
  protected amendSelBubble = { show: false, x: 0, y: 0 };
  @ViewChild('amendCommentDraft') private amendCommentDraftRef?: ElementRef<HTMLTextAreaElement>;
  protected amendLineHeight = '1.5';
  protected readonly amendLineHeights = [
    { label: '1.0', value: '1' },
    { label: '1.15', value: '1.15' },
    { label: '1.5', value: '1.5' },
    { label: '2.0', value: '2' },
    { label: '2.5', value: '2.5' },
    { label: '3.0', value: '3' },
  ] as const;
  private pinDragId = '';
  private pinDragMoved = false;
  private pinDraggingNew = false;
  private pinDragUnlisten: (() => void) | null = null;
  private amendLayoutRaf = 0;
  private readonly amendWordCommentKey = 'dft-por1-amend-word-comments';
  @ViewChild('amendCommentStage') private amendCommentStageRef?: ElementRef<HTMLElement>;
  protected bundleFormCode = 'ปร. 1';
  protected bundleItemId = '';
  protected bundleItemLabel = '';
  protected bundleFilePick: Record<string, boolean> = {};
  protected bundleViewerFull = false;
  protected bundleZoom = 100;
  protected bundleFitScale = 1.5;
  private readonly bundleZoomBase = 1.5;
  private readonly bundleZoomSteps = [50, 75, 100, 125, 150, 200];
  private parkingAmendComments: AmendWordComment[] | null = null;
  private readonly draftAgendaCommentsKey = 'dft-por1-draft-agenda-comments';

  private readonly bundleCommentKey = 'dft-por1-bundle-comments';
  private readonly bundleReviewKey = 'dft-por1-bundle-review';
  private readonly bundleAmendKey = 'dft-por1-bundle-amend-v4';
  private readonly bundleAmendFilesKey = 'dft-por1-bundle-amend-files';

  private readonly por2BundleToc: TocGroup[] = [
    {
      label: '1. ผู้ยื่นคำขอและมาตรการ',
      items: [
        { id: 'p2-1a', label: 'มาตรการและประเภทการยื่น' },
        { id: 'p2-1b', label: 'ข้อมูลและเอกสารประกอบ' },
      ],
    },
    {
      label: '2. รายการที่ขอให้ทบทวน',
      items: [{ id: 'p2-2', label: 'สินค้า ประกาศ และเหตุที่เปลี่ยนแปลง' }],
    },
    {
      label: '3. วัตถุประสงค์การทบทวน',
      items: [{ id: 'p2-3', label: 'วัตถุประสงค์และพยานหลักฐาน' }],
    },
    {
      label: '4. คำรับรอง',
      items: [{ id: 'p2-4', label: 'คำรับรองและลงนาม' }],
    },
  ];

  protected setBundleEdition(edition: 'original' | 'review' | 'amend'): void {
    this.bundleEdition = edition;
    if (edition === 'review') {
      this.bundleComments = this.readBundleComments();
      this.bundleReviewNotes = this.readBundleReviewNotes();
    }
    if (edition === 'amend') {
      this.loadAmendWorkspace();
      this.amendWordComments = this.readAmendWordComments();
      this.fillAmendEditor();
      window.setTimeout(() => this.scheduleAmendWordLayout(), 0);
    }
  }

  protected get bundleIsReview(): boolean {
    return this.bundleEdition === 'review';
  }

  protected get bundleIsAmend(): boolean {
    return this.bundleEdition === 'amend';
  }

  protected setBundleAmendText(value: string): void {
    this.bundleAmendText = value;
    this.writeBundleAmend(value);
  }

  /** ชื่อย่อผู้เขียน comment — เหมือน Word Comment [XX1] */
  protected commentInitials(name = this.accounts.displayName || this.signedPerson || 'เจ้าหน้าที่'): string {
    const parts = name.replace(/[()]/g, ' ').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return 'OF';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  protected get amendWordRoots(): AmendWordComment[] {
    return this.amendWordComments.filter((item) => !item.parentId && !item.resolved);
  }

  /** การ์ดลอยที่เปิดอยู่ (ไม่มีแถบ Comments ค้างด้านขวา) */
  protected get activeAmendWordRoot(): AmendWordComment | null {
    if (this.amendWordDraftId) return null;
    return this.amendWordRoots.find((item) => item.id === this.amendWordActiveId) || null;
  }

  protected clearAmendWordFocus(): void {
    this.amendWordActiveId = '';
    const root = this.activeWordCommentEditor();
    root?.querySelectorAll('mark.word-cmt-mark.is-active').forEach((node) => node.classList.remove('is-active'));
    this.scheduleAmendWordLayout();
  }

  protected amendWordReplies(parentId: string): AmendWordComment[] {
    return this.amendWordComments.filter((item) => item.parentId === parentId && !item.resolved);
  }

  protected amendWordLabel(item: AmendWordComment): string {
    const roots = this.amendWordComments.filter((row) => !row.parentId);
    const index = roots.findIndex((row) => row.id === (item.parentId || item.id)) + 1;
    return `Comment [${item.initials}${Math.max(1, index)}]`;
  }

  protected get canAddAmendWordComment(): boolean {
    return !!this.reviewRole && this.bundleIsAmend && !this.showCompleteBundle;
  }

  /** Comment บนหน้าร่างวาระ — แสดงปุ่มเหมือนหน้าแก้ไขคำขอ */
  protected get canAddDraftAgendaComment(): boolean {
    return !!this.reviewRole && this.draftAgendaWordOpen;
  }

  protected get canAddApprovalComment(): boolean {
    return !!this.reviewRole && this.approvalWordOpen;
  }

  protected get canAddSubAgendaComment(): boolean {
    return !!this.reviewRole && this.subAgendaWordOpen;
  }

  protected get canAddWordComment(): boolean {
    return this.canAddDraftAgendaComment || this.canAddApprovalComment || this.canAddSubAgendaComment || this.canAddAmendWordComment;
  }

  private activeWordCommentEditor(): HTMLElement | undefined {
    if (this.approvalWordOpen) return this.approvalEditorRef?.nativeElement;
    if (this.subAgendaWordOpen) return this.subAgendaEditorRef?.nativeElement;
    if (this.draftAgendaWordOpen) return this.draftAgendaEditorRef?.nativeElement;
    return this.amendEditorRef?.nativeElement;
  }

  private activeWordCommentStage(): HTMLElement | undefined {
    if (this.approvalWordOpen) return this.approvalStageRef?.nativeElement;
    if (this.subAgendaWordOpen) return this.subAgendaStageRef?.nativeElement;
    if (this.draftAgendaWordOpen) return this.draftAgendaStageRef?.nativeElement;
    return this.amendCommentStageRef?.nativeElement;
  }

  private captureActiveWordEditor(): void {
    if (this.approvalWordOpen) {
      this.captureApprovalEditor();
      this.writeApprovalComments();
      return;
    }
    if (this.subAgendaWordOpen) {
      this.captureSubAgendaEditor();
      this.writeSubAgendaComments();
      return;
    }
    if (this.draftAgendaWordOpen) {
      this.captureDraftAgendaEditor();
      this.writeDraftAgendaComments();
      return;
    }
    this.captureAmendEditor();
  }

  /**
   * Comment ปุ่มเดียว: มีข้อความที่เลือก → ไฮไลต์ + เปิดกล่อง
   * ไม่ได้เลือก → เข้า/ออกโหมดคลิกแถวในเล่ม (หรือลากปุ่มไปวาง)
   */
  protected beginAmendWordComment(): void {
    if (!this.canAddWordComment) return;
    this.hideAmendSelBubble();
    const root = this.activeWordCommentEditor();
    if (!root) return;
    root.focus();
    const sel = window.getSelection();
    if (sel && sel.rangeCount && !sel.isCollapsed && root.contains(sel.getRangeAt(0).commonAncestorContainer)) {
      const quote = sel.toString().replace(/\s+/g, ' ').trim();
      if (quote) {
        this.commentPinMode = false;
        this.openAmendWordDraftFromRange(sel.getRangeAt(0), quote, 'text');
        return;
      }
    }
    this.commentPinMode = !this.commentPinMode;
    this.view.markForCheck();
  }

  /** เปิดโหมดปักกล้อง — คลิกหรือลากวางบนแถว/จุดในเอกสาร */
  protected toggleCommentPinMode(): void {
    if (!this.canAddWordComment) return;
    this.commentPinMode = !this.commentPinMode;
    this.hideAmendSelBubble();
    this.view.markForCheck();
  }

  protected onAmendCommentDraftKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.cancelAmendWordDraft();
      return;
    }
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      this.saveAmendWordComment();
    }
  }

  private focusAmendCommentDraft(): void {
    window.setTimeout(() => {
      const el =
        this.amendCommentDraftRef?.nativeElement ||
        this.activeWordCommentStage()?.querySelector<HTMLTextAreaElement>('.word-cmt-card--draft textarea');
      el?.focus();
      el?.select();
    }, 30);
  }

  protected cancelAmendWordDraft(): void {
    if (this.amendWordDraftId && !this.amendWordComments.some((item) => item.id === this.amendWordDraftId)) {
      this.unwrapAmendWordMark(this.amendWordDraftId);
      this.captureActiveWordEditor();
    }
    this.amendWordDraftId = '';
    this.amendWordDraftQuote = '';
    this.amendWordDraftText = '';
    this.amendWordReplyTo = '';
    this.scheduleAmendWordLayout();
  }

  protected saveAmendWordComment(): void {
    const text = this.amendWordDraftText.trim();
    if (!text || !this.amendWordDraftId) return;
    const author = this.accounts.displayName || this.signedPerson || 'เจ้าหน้าที่';
    const mark = this.activeWordCommentEditor()?.querySelector<HTMLElement>(
      `mark.word-cmt-mark[data-comment-id="${this.amendWordDraftId}"]`,
    );
    const anchor = (mark?.dataset?.['cmtAnchor'] as 'text' | 'point' | undefined) || 'text';
    const next: AmendWordComment = {
      id: this.amendWordDraftId,
      quote: this.amendWordDraftQuote,
      text,
      author,
      initials: this.commentInitials(author),
      at: this.replyStamp(),
      hue: this.amendWordRoots.length % 3,
      parentId: this.amendWordReplyTo || undefined,
      anchor,
    };
    this.amendWordComments = [...this.amendWordComments, next];
    if (this.approvalWordOpen) this.writeApprovalComments();
    else if (this.subAgendaWordOpen) this.writeSubAgendaComments();
    else if (this.draftAgendaWordOpen) this.writeDraftAgendaComments();
    else this.writeAmendWordComments();
    this.amendWordActiveId = next.id;
    this.amendWordDraftId = '';
    this.amendWordDraftQuote = '';
    this.amendWordDraftText = '';
    this.amendWordReplyTo = '';
    this.captureActiveWordEditor();
    this.scheduleAmendWordLayout();
    this.notice = null;
  }

  protected startAmendWordReply(parentId: string): void {
    const parent = this.amendWordComments.find((item) => item.id === parentId);
    if (!parent || !this.canAddWordComment) return;
    this.amendWordDraftId = `awc-${Date.now()}`;
    this.amendWordDraftQuote = parent.quote;
    this.amendWordDraftText = '';
    this.amendWordReplyTo = parentId;
    this.amendWordActiveId = parentId;
    this.scheduleAmendWordLayout();
    this.focusAmendCommentDraft();
  }

  protected focusAmendWordComment(id: string): void {
    this.amendWordActiveId = id;
    const root = this.amendEditorRef?.nativeElement;
    const mark = root?.querySelector<HTMLElement>(`mark.word-cmt-mark[data-comment-id="${id}"]`);
    mark?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    root?.querySelectorAll('mark.word-cmt-mark.is-active').forEach((node) => node.classList.remove('is-active'));
    mark?.classList.add('is-active');
    this.scheduleAmendWordLayout();
  }

  protected onAmendEditorClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    const mark = target?.closest?.('mark.word-cmt-mark') as HTMLElement | null;
    const id = mark?.dataset?.['commentId'];
    if (id) {
      this.focusAmendWordComment(id);
      this.refreshAmendToolbar();
      return;
    }
    if (this.commentPinMode && this.canAddWordComment) {
      event.preventDefault();
      this.placeCommentPinAtPoint(event.clientX, event.clientY);
      return;
    }
    if (this.amendWordActiveId && !this.amendWordDraftId) this.clearAmendWordFocus();
    this.refreshAmendToolbar();
  }

  protected onAmendEditorMouseUp(event: MouseEvent): void {
    this.refreshAmendToolbar();
    if (!this.canAddWordComment || this.commentPinMode || this.pinDragId) {
      this.hideAmendSelBubble();
      return;
    }
    const root = this.activeWordCommentEditor();
    const sel = window.getSelection();
    if (!root || !sel || sel.isCollapsed || !sel.rangeCount) {
      this.hideAmendSelBubble();
      return;
    }
    const range = sel.getRangeAt(0);
    if (!root.contains(range.commonAncestorContainer)) {
      this.hideAmendSelBubble();
      return;
    }
    const quote = sel.toString().replace(/\s+/g, ' ').trim();
    if (!quote) {
      this.hideAmendSelBubble();
      return;
    }
    const rect = range.getBoundingClientRect();
    const stage = this.activeWordCommentStage();
    const box = stage?.getBoundingClientRect();
    this.amendSelBubble = {
      show: true,
      x: Math.max(8, rect.left - (box?.left || 0) + rect.width / 2),
      y: Math.max(8, rect.top - (box?.top || 0) - 40),
    };
    this.view.markForCheck();
  }

  protected hideAmendSelBubble(): void {
    if (!this.amendSelBubble.show) return;
    this.amendSelBubble = { ...this.amendSelBubble, show: false };
  }

  /** เริ่มลากกล้อง comment เพื่อย้ายจุดชี้ */
  protected onCommentPinPointerDown(event: PointerEvent, id: string): void {
    if (!this.canAddWordComment || event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    this.pinDragId = id;
    this.pinDragMoved = false;
    this.focusAmendWordComment(id);
    const move = (ev: PointerEvent) => {
      if (!this.pinDragId) return;
      this.pinDragMoved = true;
      const stage = this.amendCommentStageRef?.nativeElement;
      if (!stage) return;
      const box = stage.getBoundingClientRect();
      const top = ev.clientY - box.top + stage.scrollTop - 12;
      const left = ev.clientX - box.left - 16;
      this.amendWordPinLayout = this.amendWordPinLayout.map((pin) =>
        pin.id === this.pinDragId ? { ...pin, top: Math.max(0, top), left: Math.max(0, left) } : pin,
      );
      this.view.markForCheck();
    };
    const up = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      this.pinDragUnlisten = null;
      const dragId = this.pinDragId;
      this.pinDragId = '';
      if (!dragId) return;
      if (this.pinDragMoved) {
        this.reanchorCommentPin(dragId, ev.clientX, ev.clientY);
      } else {
        this.focusAmendWordComment(dragId);
      }
      this.scheduleAmendWordLayout();
    };
    this.pinDragUnlisten = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }

  /** ลากกล้องใหม่จากแถบเครื่องมือมาวางบนเอกสาร */
  protected onNewPinDragStart(event: DragEvent): void {
    if (!this.canAddWordComment) {
      event.preventDefault();
      return;
    }
    this.commentPinMode = true;
    this.pinDraggingNew = true;
    event.dataTransfer?.setData('text/plain', 'dft-comment-pin');
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'copy';
    const end = () => {
      this.pinDraggingNew = false;
      window.removeEventListener('dragend', end);
    };
    window.addEventListener('dragend', end);
  }

  protected onAmendEditorDragOver(event: DragEvent): void {
    if (!this.pinDraggingNew && !this.commentPinMode) return;
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
  }

  protected onAmendEditorDrop(event: DragEvent): void {
    if (!this.pinDraggingNew && !this.commentPinMode) return;
    const payload = event.dataTransfer?.getData('text/plain') || '';
    if (payload && payload !== 'dft-comment-pin') return;
    event.preventDefault();
    this.pinDraggingNew = false;
    this.placeCommentPinAtPoint(event.clientX, event.clientY);
  }

  protected resolveAmendWordComment(id: string): void {
    const ids = new Set([id, ...this.amendWordComments.filter((item) => item.parentId === id).map((item) => item.id)]);
    this.amendWordComments = this.amendWordComments.map((item) => (ids.has(item.id) ? { ...item, resolved: true } : item));
    if (this.approvalWordOpen) this.writeApprovalComments();
    else if (this.subAgendaWordOpen) this.writeSubAgendaComments();
    else if (this.draftAgendaWordOpen) this.writeDraftAgendaComments();
    else this.writeAmendWordComments();
    ids.forEach((markId) => this.unwrapAmendWordMark(markId));
    this.captureActiveWordEditor();
    if (this.amendWordActiveId === id) this.amendWordActiveId = '';
    this.scheduleAmendWordLayout();
  }

  protected removeAmendWordComment(id: string): void {
    const ids = new Set([id, ...this.amendWordComments.filter((item) => item.parentId === id).map((item) => item.id)]);
    this.amendWordComments = this.amendWordComments.filter((item) => !ids.has(item.id));
    if (this.approvalWordOpen) this.writeApprovalComments();
    else if (this.subAgendaWordOpen) this.writeSubAgendaComments();
    else if (this.draftAgendaWordOpen) this.writeDraftAgendaComments();
    else this.writeAmendWordComments();
    ids.forEach((markId) => this.unwrapAmendWordMark(markId));
    this.captureActiveWordEditor();
    if (this.amendWordActiveId === id) this.amendWordActiveId = '';
    if (this.amendWordDraftId === id) this.cancelAmendWordDraft();
    this.scheduleAmendWordLayout();
  }

  protected cardTopFor(id: string): number {
    return this.amendWordCardTops[id] ?? 0;
  }

  protected cardLeftFor(id: string): number {
    return this.amendWordCardLefts[id] ?? 0;
  }

  /** editor ที่เปิดอยู่ — ให้ toolbar ชุดเดียวกันยิงไปที่เป้าหมายถูก */
  private activeTextEditor(): 'notice' | 'approval' | 'sub' | 'draft' | 'agency' | 'amend' {
    if (this.noticeLetterWordOpen) return 'notice';
    if (this.approvalWordOpen) return 'approval';
    if (this.subAgendaWordOpen) return 'sub';
    if (this.draftAgendaWordOpen) return 'draft';
    if (this.agencyWordOpen) return 'agency';
    return 'amend';
  }

  protected textEditorFormat(command: string, value?: string): void {
    const target = this.activeTextEditor();
    if (target === 'notice') this.noticeLetterFormat(command, value);
    else if (target === 'approval') this.approvalFormat(command, value);
    else if (target === 'sub') this.subAgendaFormat(command, value);
    else if (target === 'draft') this.draftAgendaFormat(command, value);
    else if (target === 'agency') this.agencySummaryFormat(command, value);
    else this.amendFormat(command, value);
  }

  protected textEditorFontSize(size: string): void {
    const target = this.activeTextEditor();
    if (target === 'notice') this.applyNoticeLetterFontSize(size);
    else if (target === 'approval') this.applyApprovalFontSize(size);
    else if (target === 'sub') this.applySubAgendaFontSize(size);
    else if (target === 'draft') this.applyDraftAgendaFontSize(size);
    else if (target === 'agency') this.applyAgencySummaryFontSize(size);
    else this.applyAmendFontSize(size);
  }

  protected textEditorColor(color: string): void {
    const target = this.activeTextEditor();
    if (target === 'notice') this.applyNoticeLetterColor(color);
    else if (target === 'approval') this.applyApprovalColor(color);
    else if (target === 'sub') this.applySubAgendaColor(color);
    else if (target === 'draft') this.applyDraftAgendaColor(color);
    else if (target === 'agency') this.applyAgencySummaryColor(color);
    else this.applyAmendColor(color);
  }

  protected textEditorHighlight(color: string): void {
    const target = this.activeTextEditor();
    if (target === 'notice') this.applyNoticeLetterHighlight(color);
    else if (target === 'approval') this.applyApprovalHighlight(color);
    else if (target === 'sub') this.applySubAgendaHighlight(color);
    else if (target === 'draft') this.applyDraftAgendaHighlight(color);
    else if (target === 'agency') this.applyAgencySummaryHighlight(color);
    else this.applyAmendHighlight(color);
  }

  protected insertAmendTable(): void {
    const table =
      '<table class="amend-table"><tbody>' +
      '<tr><td>หัวข้อ</td><td>รายละเอียด</td></tr>' +
      '<tr><td>&nbsp;</td><td>&nbsp;</td></tr>' +
      '</tbody></table><p><br></p>';
    this.textEditorFormat('insertHTML', table);
  }

  protected insertAmendHr(): void {
    this.textEditorFormat('insertHorizontalRule');
  }

  protected insertTextEditorPageBreak(): void {
    if (this.approvalWordOpen) {
      this.insertApprovalPageBreak();
      return;
    }
    if (this.subAgendaWordOpen) {
      this.insertSubAgendaPageBreak();
      return;
    }
    if (this.draftAgendaWordOpen) {
      this.insertDraftAgendaPageBreak();
      return;
    }
    const breakHtml =
      '<div class="word-page-break" data-page-break="1" contenteditable="false"></div><p style="font-family:TH SarabunPSK;font-size:16pt;line-height:1.15;margin:0"><br></p>';
    this.textEditorFormat('insertHTML', breakHtml);
    if (this.agencyWordOpen) return;
    this.scheduleAmendWordLayout();
  }

  protected applyAmendLineHeight(value: string): void {
    this.amendLineHeight = value;
    const target = this.activeTextEditor();
    if (target === 'notice' || target === 'approval' || target === 'sub' || target === 'draft' || target === 'agency') {
      document.execCommand('styleWithCSS', false, 'true');
      this.textEditorFormat('formatBlock', 'p');
      const root =
        target === 'notice'
          ? this.noticeLetterEditorRef?.nativeElement
          : target === 'approval'
            ? this.approvalEditorRef?.nativeElement
            : target === 'sub'
              ? this.subAgendaEditorRef?.nativeElement
              : target === 'draft'
                ? this.draftAgendaEditorRef?.nativeElement
                : this.agencySummaryEditorRef?.nativeElement;
      const sel = window.getSelection();
      const node = sel?.anchorNode;
      const el = node instanceof Element ? node : node?.parentElement;
      const block = el?.closest('p, h1, h2, h3, li, td') as HTMLElement | null;
      if (block && root?.contains(block)) block.style.lineHeight = value;
      if (target === 'notice') this.captureNoticeLetterEditor();
      else if (target === 'approval') this.captureApprovalEditor();
      else if (target === 'sub') this.captureSubAgendaEditor();
      else if (target === 'draft') this.captureDraftAgendaEditor();
      else this.captureAgencySummaryEditor();
      return;
    }
    this.amendWrapSelection({ lineHeight: value, fontFamily: this.officialFontName });
  }

  private openAmendWordDraftFromRange(range: Range, quote: string, anchor: 'text' | 'point'): void {
    const id = `awc-${Date.now()}`;
    const mark = document.createElement('mark');
    mark.className = 'word-cmt-mark' + (anchor === 'point' ? ' word-cmt-mark--point' : '');
    mark.dataset['commentId'] = id;
    mark.dataset['cmtHue'] = String(this.amendWordRoots.length % 3);
    mark.dataset['cmtAnchor'] = anchor;
    try {
      range.surroundContents(mark);
    } catch {
      const frag = range.extractContents();
      mark.appendChild(frag);
      range.insertNode(mark);
    }
    window.getSelection()?.removeAllRanges();
    this.amendWordDraftId = id;
    this.amendWordDraftQuote = quote;
    this.amendWordDraftText = '';
    this.amendWordReplyTo = '';
    this.amendWordActiveId = id;
    this.commentPinMode = false;
    this.hideAmendSelBubble();
    this.captureActiveWordEditor();
    this.scheduleAmendWordLayout();
    this.focusAmendCommentDraft();
    this.view.markForCheck();
  }

  protected placeCommentPinAtPoint(clientX: number, clientY: number): void {
    const root = this.activeWordCommentEditor();
    if (!root) return;
    const range = this.rangeFromPoint(clientX, clientY, root);
    if (!range) {
      this.notice = 'suggest';
      return;
    }
    const block = this.blockFromNode(range.startContainer);
    let quote = '';
    let useRange = range;
    if (block) {
      quote = (block.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 120);
      useRange = document.createRange();
      useRange.selectNodeContents(block);
    } else {
      // ขยายเป็นคำ/ช่วงสั้นรอบ caret
      useRange = range.cloneRange();
      try {
        (useRange as Range & { expand?: (unit: string) => void }).expand?.('word');
      } catch {
        /* expand ไม่รองรับบางเบราว์เซอร์ */
      }
      quote = useRange.toString().replace(/\s+/g, ' ').trim().slice(0, 120) || 'จุดที่ปักกล้อง';
    }
    if (!quote) quote = 'จุดที่ปักกล้อง';
    this.openAmendWordDraftFromRange(useRange, quote, 'point');
  }

  private reanchorCommentPin(id: string, clientX: number, clientY: number): void {
    const root = this.activeWordCommentEditor();
    if (!root) return;
    const range = this.rangeFromPoint(clientX, clientY, root);
    if (!range) {
      this.scheduleAmendWordLayout();
      return;
    }
    const block = this.blockFromNode(range.startContainer);
    let quote = '';
    let useRange = range.cloneRange();
    if (block) {
      quote = (block.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 120);
      useRange = document.createRange();
      useRange.selectNodeContents(block);
    } else {
      quote = useRange.toString().replace(/\s+/g, ' ').trim().slice(0, 120) || 'จุดที่ปักกล้อง';
    }
    const prev = root.querySelector<HTMLElement>(`mark.word-cmt-mark[data-comment-id="${id}"]`);
    const hue = prev?.dataset?.['cmtHue'] || '0';
    this.unwrapAmendWordMark(id);
    const mark = document.createElement('mark');
    mark.className = 'word-cmt-mark word-cmt-mark--point';
    mark.dataset['commentId'] = id;
    mark.dataset['cmtHue'] = hue;
    mark.dataset['cmtAnchor'] = 'point';
    try {
      useRange.surroundContents(mark);
    } catch {
      const frag = useRange.extractContents();
      mark.appendChild(frag);
      useRange.insertNode(mark);
    }
    this.amendWordComments = this.amendWordComments.map((item) =>
      item.id === id ? { ...item, quote: quote || item.quote, anchor: 'point' } : item,
    );
    if (this.amendWordDraftId === id) this.amendWordDraftQuote = quote || this.amendWordDraftQuote;
    if (this.approvalWordOpen) this.writeApprovalComments();
    else if (this.subAgendaWordOpen) this.writeSubAgendaComments();
    else if (this.draftAgendaWordOpen) this.writeDraftAgendaComments();
    else this.writeAmendWordComments();
    this.captureActiveWordEditor();
    this.focusAmendWordComment(id);
  }

  private rangeFromPoint(clientX: number, clientY: number, root: HTMLElement): Range | null {
    const doc = document as Document & {
      caretRangeFromPoint?: (x: number, y: number) => Range | null;
      caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null;
    };
    let range: Range | null = null;
    if (typeof doc.caretRangeFromPoint === 'function') {
      range = doc.caretRangeFromPoint(clientX, clientY);
    } else if (typeof doc.caretPositionFromPoint === 'function') {
      const pos = doc.caretPositionFromPoint(clientX, clientY);
      if (pos) {
        range = document.createRange();
        range.setStart(pos.offsetNode, pos.offset);
        range.collapse(true);
      }
    }
    if (!range || !root.contains(range.commonAncestorContainer)) return null;
    return range;
  }

  private blockFromNode(node: Node): HTMLElement | null {
    const el = node instanceof Element ? node : node.parentElement;
    return el?.closest?.('p, li, h1, h2, h3, h4, td, th, div.bundle-amend-editor > *') as HTMLElement | null;
  }

  private unwrapAmendWordMark(id: string): void {
    const root = this.activeWordCommentEditor();
    root?.querySelectorAll(`mark.word-cmt-mark[data-comment-id="${id}"]`).forEach((node) => {
      const parent = node.parentNode;
      if (!parent) return;
      while (node.firstChild) parent.insertBefore(node.firstChild, node);
      parent.removeChild(node);
    });
  }

  /** จัดตำแหน่งกล้อง + การ์ดให้ชิดแถวที่ชี้ (แบบ Word Online) */
  protected scheduleAmendWordLayout(): void {
    if (this.amendLayoutRaf) cancelAnimationFrame(this.amendLayoutRaf);
    this.amendLayoutRaf = requestAnimationFrame(() => {
      this.amendLayoutRaf = 0;
      this.syncAmendWordLayout();
    });
  }

  private syncAmendWordLayout(): void {
    const onDraft = this.draftAgendaWordOpen;
    const onApproval = this.approvalWordOpen;
    const onAmend = this.bundleIsAmend && !this.showCompleteBundle;
    if (!onDraft && !onApproval && !onAmend) {
      this.amendWordPinLayout = [];
      this.amendWordCardTops = {};
      this.amendWordCardLefts = {};
      return;
    }
    if (onAmend && !onDraft && !onApproval) this.syncBundleFitScale();
    const stage = this.activeWordCommentStage();
    const editor = this.activeWordCommentEditor();
    const sheet = stage?.querySelector<HTMLElement>('.bundle-amend-sheet, .word-print-sheet');
    if (!stage || !editor) return;
    const stageBox = stage.getBoundingClientRect();
    const sheetBox = sheet?.getBoundingClientRect();
    const pins: AmendWordPinLayout[] = [];
    const tops: Record<string, number> = {};
    const lefts: Record<string, number> = {};
    const pinLeftBase = sheetBox
      ? Math.min(stage.clientWidth - 44, Math.max(8, sheetBox.right - stageBox.left - 28))
      : Math.max(8, stage.clientWidth - 48);
    const cardLeftBase = sheetBox
      ? Math.min(stage.clientWidth - 300, Math.max(8, sheetBox.right - stageBox.left + 8))
      : Math.max(8, stage.clientWidth - 320);
    const place = (id: string, index: number, hue: number, active: boolean, anchor: 'text' | 'point', mark: HTMLElement | null) => {
      let top = 24 + index * 36;
      let left = pinLeftBase;
      if (mark) {
        const markBox = mark.getBoundingClientRect();
        top = Math.max(8, markBox.top - stageBox.top + stage.scrollTop);
        left = Math.min(stage.clientWidth - 40, Math.max(8, markBox.right - stageBox.left + 6));
      }
      pins.push({ id, index, top, left, hue, active, anchor });
      tops[id] = top;
      lefts[id] = Math.min(stage.clientWidth - 292, Math.max(left + 36, cardLeftBase));
    };
    this.amendWordRoots.forEach((note, index) => {
      const mark = editor.querySelector<HTMLElement>(`mark.word-cmt-mark[data-comment-id="${note.id}"]`);
      place(
        note.id,
        index + 1,
        note.hue,
        this.amendWordActiveId === note.id || this.amendWordDraftId === note.id,
        note.anchor || (mark?.dataset?.['cmtAnchor'] as 'text' | 'point') || 'text',
        mark,
      );
    });
    if (this.amendWordDraftId && !this.amendWordComments.some((item) => item.id === this.amendWordDraftId)) {
      const mark = editor.querySelector<HTMLElement>(`mark.word-cmt-mark[data-comment-id="${this.amendWordDraftId}"]`);
      place(
        this.amendWordDraftId,
        pins.length + 1,
        0,
        true,
        (mark?.dataset?.['cmtAnchor'] as 'text' | 'point') || 'point',
        mark,
      );
    }
    this.amendWordPinLayout = pins;
    this.amendWordCardTops = tops;
    this.amendWordCardLefts = lefts;
    if (onApproval) this.syncApprovalPageFrames();
    else if (onDraft) this.syncDraftAgendaPageFrames();
    else this.syncAmendPageFrames(sheet, stage);
    this.view.markForCheck();
  }

  private draftAgendaCommentsStorageKey(version = this.draftAgendaActiveVersion): string {
    return `${this.draftAgendaCommentsKey}-v${version || 0}`;
  }

  private loadDraftAgendaComments(): void {
    try {
      const raw = sessionStorage.getItem(this.draftAgendaCommentsStorageKey());
      const parsed = raw ? (JSON.parse(raw) as AmendWordComment[]) : [];
      this.amendWordComments = Array.isArray(parsed) ? parsed : [];
    } catch {
      this.amendWordComments = [];
    }
    this.amendWordActiveId = '';
    this.amendWordDraftId = '';
    this.commentPinMode = false;
  }

  private writeDraftAgendaComments(): void {
    try {
      const key = this.draftAgendaCommentsStorageKey();
      if (!this.amendWordComments.length) sessionStorage.removeItem(key);
      else sessionStorage.setItem(key, JSON.stringify(this.amendWordComments));
    } catch {
      /* ignore */
    }
  }

  private parkAmendCommentsForDraft(): void {
    if (this.parkingAmendComments) return;
    this.parkingAmendComments = [...this.amendWordComments];
  }

  private restoreParkedAmendComments(): void {
    if (!this.parkingAmendComments) return;
    this.amendWordComments = this.parkingAmendComments;
    this.parkingAmendComments = null;
    this.amendWordActiveId = '';
    this.amendWordDraftId = '';
    this.commentPinMode = false;
  }

  /** นับหน้า A4 แนวตั้ง + เลขหน้ามุมขวาบนแบบ Word */
  private syncAmendPageFrames(sheet: HTMLElement | null | undefined, stage: HTMLElement): void {
    const pageH = this.measureMmAsPx(297);
    const sheetTop = sheet
      ? sheet.getBoundingClientRect().top - stage.getBoundingClientRect().top + stage.scrollTop
      : 0;
    const contentH = Math.max(pageH, sheet?.offsetHeight || pageH);
    const count = Math.max(1, Math.ceil(contentH / pageH));
    this.amendPageFrames = Array.from({ length: count }, (_, i) => ({
      n: i + 1,
      top: sheetTop + i * pageH,
      height: pageH,
    }));
  }

  private measureMmAsPx(mm: number): number {
    const probe = document.createElement('div');
    probe.style.cssText = `position:absolute;visibility:hidden;height:${mm}mm;`;
    document.body.appendChild(probe);
    const px = probe.offsetHeight || Math.round((mm * 96) / 25.4);
    probe.remove();
    return px;
  }

  @HostListener('window:resize')
  protected onWindowResizeForComments(): void {
    this.syncBundleFitScale();
    this.scheduleAmendWordLayout();
    if (this.approvalWordOpen) this.scheduleApprovalPageFrames();
    if (this.subAgendaWordOpen) this.scheduleSubAgendaPageFrames();
    if (this.draftAgendaWordOpen) this.scheduleDraftAgendaPageFrames();
  }

  private readAmendWordComments(): AmendWordComment[] {
    try {
      const raw = JSON.parse(sessionStorage.getItem(`${this.amendWordCommentKey}-${this.bundleRoundNo}`) || '[]') as AmendWordComment[];
      return Array.isArray(raw) ? raw : [];
    } catch {
      return [];
    }
  }

  private writeAmendWordComments(): void {
    const key = `${this.amendWordCommentKey}-${this.bundleRoundNo}`;
    try {
      if (!this.amendWordComments.length) sessionStorage.removeItem(key);
      else sessionStorage.setItem(key, JSON.stringify(this.amendWordComments));
    } catch {
      /* ignore */
    }
  }

  private seedAmendWordCommentsIfEmpty(): void {
    if (this.amendWordComments.length || !this.reviewRole) return;
    const root = this.amendEditorRef?.nativeElement;
    if (!root) return;
    const sample = root.querySelector<HTMLElement>('[data-ai-suggest]') || root.querySelector('p');
    if (!sample) return;
    const quote = (sample.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80);
    if (!quote) return;
    const id = `awc-sample-${this.bundleRoundNo}`;
    if (root.querySelector(`mark.word-cmt-mark[data-comment-id="${id}"]`)) return;
    const mark = document.createElement('mark');
    mark.className = 'word-cmt-mark';
    mark.dataset['commentId'] = id;
    mark.dataset['cmtHue'] = '0';
    mark.dataset['cmtAnchor'] = 'text';
    while (sample.firstChild) mark.appendChild(sample.firstChild);
    sample.appendChild(mark);
    const author = this.accounts.displayName || 'เจ้าหน้าที่ AD';
    this.amendWordComments = [
      {
        id,
        quote,
        text: 'ขอให้ตรวจสอบและแก้ไขตามรายการนี้ให้ครบก่อนแจ้งผล',
        author,
        initials: this.commentInitials(author),
        at: this.replyStamp(),
        hue: 0,
        anchor: 'text',
      },
    ];
    this.writeAmendWordComments();
    this.captureAmendEditor();
    this.scheduleAmendWordLayout();
  }

  protected amendFormat(command: string, value?: string): void {
    document.execCommand('styleWithCSS', false, 'true');
    document.execCommand(command, false, value);
    this.lockOfficialFontOnSelection();
    this.captureAmendEditor();
    this.refreshAmendToolbar();
    this.amendEditorRef?.nativeElement.focus();
  }

  protected applyAmendFontSize(size: string): void {
    this.amendFontSize = size;
    this.amendWrapSelection({ fontSize: size, fontFamily: this.officialFontName });
  }

  protected applyAmendColor(color: string): void {
    this.amendColor = color;
    document.execCommand('styleWithCSS', false, 'true');
    document.execCommand('foreColor', false, color);
    this.lockOfficialFontOnSelection();
    this.captureAmendEditor();
    this.refreshAmendToolbar();
    this.amendEditorRef?.nativeElement.focus();
  }

  protected applyAmendHighlight(color: string): void {
    this.amendHighlight = color;
    document.execCommand('styleWithCSS', false, 'true');
    document.execCommand('hiliteColor', false, color === 'transparent' ? 'transparent' : color);
    this.lockOfficialFontOnSelection();
    this.captureAmendEditor();
    this.refreshAmendToolbar();
    this.amendEditorRef?.nativeElement.focus();
  }

  protected amendCmdOn(command: string): boolean {
    return !!this.amendMarks[command];
  }

  protected refreshAmendToolbar(): void {
    const cmds = [
      'bold',
      'italic',
      'underline',
      'strikeThrough',
      'subscript',
      'superscript',
      'insertUnorderedList',
      'insertOrderedList',
      'justifyLeft',
      'justifyCenter',
      'justifyRight',
      'justifyFull',
    ];
    const next: Record<string, boolean> = {};
    for (const cmd of cmds) {
      try {
        next[cmd] = document.queryCommandState(cmd);
      } catch {
        next[cmd] = false;
      }
    }
    this.amendMarks = next;
    const node = window.getSelection()?.anchorNode;
    const el = node instanceof Element ? node : node?.parentElement;
    const root =
      this.subAgendaWordOpen
        ? this.subAgendaEditorRef?.nativeElement
        : this.draftAgendaWordOpen
          ? this.draftAgendaEditorRef?.nativeElement
          : this.agencyWordOpen
            ? this.agencySummaryEditorRef?.nativeElement
            : this.amendEditorRef?.nativeElement;
    if (el && root?.contains(el)) {
      const style = getComputedStyle(el);
      const hex = this.cssColorToHex(style.color);
      if (hex) this.amendColor = hex.toUpperCase();
      const bgRaw = style.backgroundColor;
      const bgHex = this.cssColorToHex(bgRaw);
      if (!bgHex || bgHex.toUpperCase() === '#FFFFFF' || bgRaw === 'transparent' || bgRaw.startsWith('rgba(0, 0, 0, 0)')) {
        this.amendHighlight = 'transparent';
      } else {
        const hit = this.amendHighlights.find((h) => h.value.toUpperCase() === bgHex.toUpperCase());
        this.amendHighlight = hit?.value ?? bgHex.toUpperCase();
      }
      if (style.fontSize) {
        const px = parseFloat(style.fontSize);
        if (!Number.isNaN(px)) {
          const pt = Math.round((px * 72) / 96);
          const match = this.amendFontSizes.find((s) => s.value === `${pt}pt`);
          this.amendFontSize = match?.value ?? `${pt}pt`;
        }
      }
    }
  }

  /** บังคับฟอนต์ TH SarabunPSK บน selection ที่เพิ่งจัดรูปแบบ */
  private lockOfficialFontOnSelection(): void {
    try {
      document.execCommand('fontName', false, this.officialFontName);
    } catch {
      /* ignore */
    }
  }

  /** วางข้อความแล้วล้างฟอนต์อื่น — คงเหลือ TH SarabunPSK เท่านั้น */
  protected onOfficialEditorPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const html = event.clipboardData?.getData('text/html') || '';
    const text = event.clipboardData?.getData('text/plain') || '';
    if (html) {
      const box = document.createElement('div');
      box.innerHTML = html;
      box.querySelectorAll('*').forEach((node) => {
        const el = node as HTMLElement;
        el.style.fontFamily = this.officialFontName;
        el.removeAttribute('face');
      });
      document.execCommand('insertHTML', false, box.innerHTML);
    } else if (text) {
      document.execCommand('insertHTML', false, text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>'));
    }
    this.lockOfficialFontOnSelection();
    if (this.agencyWordOpen) this.captureAgencySummaryEditor();
    else if (this.subAgendaWordOpen) this.captureSubAgendaEditor();
    else if (this.draftAgendaWordOpen) this.captureDraftAgendaEditor();
    else if (this.approvalWordOpen) this.captureApprovalEditor();
    else this.captureAmendEditor();
    this.refreshAmendToolbar();
  }

  protected onAmendEditorInput(): void {
    this.touchAmendNoteOnBlock();
    this.captureAmendEditor();
    this.refreshAmendToolbar();
  }

  private get amendActorName(): string {
    return this.signedPerson || this.officerName || 'เจ้าหน้าที่';
  }

  private amendShortName(name: string): string {
    const clean = name.replace(/^(นาย|นางสาว|นาง|ดร\.)\s*/u, '').trim();
    return clean.split(/\s+/)[0] || name;
  }

  private amendStampDateTime(day = ''): string {
    const date = day || this.clockToday() || this.thaiToday() || '';
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    return date ? `${date} ${hh}:${mm}` : `${hh}:${mm}`;
  }

  /** ป้ายรู้ผู้กระทำ — แสดงด้วย CSS ไม่ใช่ข้อความในเอกสาร */
  private composeAmendBadgeLabel(block: HTMLElement): string {
    const by = block.dataset['amendBy'] || '';
    const at = block.dataset['amendAt'] || '';
    const editBy = block.dataset['amendEditBy'] || '';
    const editAt = block.dataset['amendEditAt'] || '';
    const parts: string[] = [];
    if (by) parts.push(`(เพิ่ม:${this.amendShortName(by)}${at ? ` ${at}` : ''})`);
    if (editBy) parts.push(`(แก้ไข:${this.amendShortName(editBy)}${editAt ? ` ${editAt}` : ''})`);
    return parts.join(' ');
  }

  private paintAmendBadge(block: HTMLElement): void {
    this.stripAmendNoteSpans(block);
    const label = this.composeAmendBadgeLabel(block);
    if (!label) {
      delete block.dataset['amendLabel'];
      block.removeAttribute('title');
      return;
    }
    block.dataset['amendLabel'] = label;
    const by = block.dataset['amendBy'] || '';
    const editBy = block.dataset['amendEditBy'] || '';
    block.setAttribute(
      'title',
      [by ? `เพิ่มโดย ${by}${block.dataset['amendAt'] ? ` · ${block.dataset['amendAt']}` : ''}` : '', editBy ? `แก้ไขโดย ${editBy}${block.dataset['amendEditAt'] ? ` · ${block.dataset['amendEditAt']}` : ''}` : '']
        .filter(Boolean)
        .join('\n'),
    );
  }

  private stripAmendNoteSpans(root: HTMLElement): void {
    root.querySelectorAll('.amend-note').forEach((node) => node.remove());
    // ตัดข้อความป้ายเก่าที่เคยฝังในเนื้อหา — ป้ายจริงแสดงด้วย CSS จาก data-amend-label
    const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const drop: Text[] = [];
    let node = walk.nextNode();
    while (node) {
      const text = node as Text;
      const next = text.textContent?.replace(/\s*\((?:เพิ่ม|แก้ไข):[^)]*\)\s*/g, ' ').replace(/\s{2,}/g, ' ') ?? '';
      if (next !== text.textContent) {
        if (!next.trim()) drop.push(text);
        else text.textContent = next;
      }
      node = walk.nextNode();
    }
    drop.forEach((row) => row.remove());
  }

  /** ติดป้ายผู้กระทำบนย่อหน้า (metadata) — ไม่แทรกข้อความลงเอกสาร */
  private touchAmendNoteOnBlock(): void {
    const root = this.amendEditorRef?.nativeElement;
    const sel = window.getSelection();
    if (!root || !sel?.rangeCount) return;
    const range = sel.getRangeAt(0);
    if (!root.contains(range.commonAncestorContainer)) return;
    const node: Element | null =
      range.startContainer instanceof Element ? range.startContainer : range.startContainer.parentElement;
    const block = node?.closest('p, li, h3, div') as HTMLElement | null;
    if (!block || block === root || !root.contains(block)) return;
    const plain = (block.textContent || '').replace(/\u200b/g, '').trim();
    if (!plain) return;

    const me = this.amendActorName;
    const stamp = this.amendStampDateTime();
    const owner = block.dataset['amendBy'] || '';

    if (!owner) {
      block.dataset['amendBy'] = me;
      block.dataset['amendAt'] = stamp;
      delete block.dataset['amendEditBy'];
      delete block.dataset['amendEditAt'];
    } else if (owner === me) {
      block.dataset['amendAt'] = stamp;
      delete block.dataset['amendEditBy'];
      delete block.dataset['amendEditAt'];
    } else {
      // คนอื่นมาแก้ของเดิม — ป้ายแก้ไขแยกจากป้ายเพิ่ม
      block.dataset['amendEditBy'] = me;
      block.dataset['amendEditAt'] = stamp;
    }
    this.paintAmendBadge(block);
  }

  private amendWrapSelection(styles: Record<string, string>): void {
    const sel = window.getSelection();
    const root = this.amendEditorRef?.nativeElement;
    if (!sel || !sel.rangeCount || !root) return;
    const range = sel.getRangeAt(0);
    if (!root.contains(range.commonAncestorContainer)) {
      root.focus();
      return;
    }
    const span = document.createElement('span');
    Object.assign(span.style, styles);
    if (range.collapsed) {
      span.appendChild(document.createTextNode('\u200b'));
      range.insertNode(span);
      const caret = document.createRange();
      caret.selectNodeContents(span);
      caret.collapse(false);
      sel.removeAllRanges();
      sel.addRange(caret);
    } else {
      span.appendChild(range.extractContents());
      range.insertNode(span);
      const cover = document.createRange();
      cover.selectNodeContents(span);
      sel.removeAllRanges();
      sel.addRange(cover);
    }
    this.captureAmendEditor();
    this.refreshAmendToolbar();
    root.focus();
  }

  private cssColorToHex(value: string): string | null {
    const match = /^rgba?\((\d+),\s*(\d+),\s*(\d+)/i.exec(value.trim());
    if (!match) {
      if (/^#[0-9a-f]{6}$/i.test(value.trim())) return value.trim();
      return null;
    }
    const hex = (n: string) => Number(n).toString(16).padStart(2, '0');
    return `#${hex(match[1])}${hex(match[2])}${hex(match[3])}`;
  }

  private captureAmendEditor(): void {
    const el = this.amendEditorRef?.nativeElement;
    if (!el) return;
    this.stripAmendNoteSpans(el);
    const empty = !el.textContent?.replace(/\u00a0/g, ' ').replace(/\u200b/g, '').trim();
    this.amendEditorEmpty = empty;
    this.setBundleAmendText(empty ? '' : el.innerHTML);
  }

  private fillAmendEditor(tries = 0): void {
    const run = () => {
      const el = this.amendEditorRef?.nativeElement;
      if (!el) {
        if (tries < 8) window.setTimeout(() => this.fillAmendEditor(tries + 1), 50);
        return;
      }
      const html = this.bundleAmendText || this.amendSampleHtml();
      if (!this.bundleAmendText) {
        this.bundleAmendText = html;
        this.writeBundleAmend(html);
      }
      el.innerHTML = html;
      this.stripAmendNoteSpans(el);
      el.querySelectorAll<HTMLElement>('[data-amend-by]').forEach((block) => this.paintAmendBadge(block));
      this.amendEditorEmpty = !el.textContent?.replace(/\u00a0/g, ' ').replace(/\u200b/g, '').trim();
      this.refreshAmendToolbar();
      if (!this.amendWordComments.length) this.amendWordComments = this.readAmendWordComments();
      if (!this.amendWordComments.length) this.seedAmendWordCommentsIfEmpty();
      this.scheduleAmendWordLayout();
      this.view.markForCheck();
    };
    window.setTimeout(run, tries === 0 ? 0 : 50);
  }

  private amendHtmlIsEmpty(value: string): boolean {
    const text = value
      .replace(/<br\s*\/?>/gi, '')
      .replace(/&nbsp;/gi, ' ')
      .replace(/<[^>]+>/g, '')
      .replace(/\u200b/g, '')
      .trim();
    return !text;
  }

  private readBundleAmend(): string {
    try {
      const raw = sessionStorage.getItem(`${this.bundleAmendKey}-${this.bundleRoundNo}`) || '';
      if (!raw || this.amendHtmlIsEmpty(raw)) return '';
      if (/<[a-z][\s\S]*>/i.test(raw)) return raw;
      return raw
        .split('\n')
        .map((line) => `<p>${this.escapeHtml(line) || '<br>'}</p>`)
        .join('');
    } catch {
      return '';
    }
  }

  private writeBundleAmend(value: string): void {
    const key = `${this.bundleAmendKey}-${this.bundleRoundNo}`;
    try {
      if (!value.trim()) sessionStorage.removeItem(key);
      else sessionStorage.setItem(key, value);
    } catch {
      /* ignore quota */
    }
  }

  private loadAmendWorkspace(): void {
    const saved = this.readBundleAmend();
    // คีย์ v3 ตัดของเก่า; ถ้ายังมีป้ายฝังเป็นข้อความให้ใช้ตัวอย่างใหม่
    const useSaved =
      !!saved && /data-ai-suggest=/.test(saved) && /data-amend-label=/.test(saved) && !/class="amend-note"/.test(saved);
    this.bundleAmendText = useSaved ? saved : this.amendSampleHtml();
    if (!useSaved) this.writeBundleAmend(this.bundleAmendText);
    this.amendEditorEmpty = this.amendHtmlIsEmpty(this.bundleAmendText);
    this.readAmendTree();
  }

  /**
   * ตัวอย่างข้อความที่ต้องแก้ไข — จาก หนังสือแก้ไขคำขอ ครั้งที่ 1.pdf (แผ่นที่ 2 เป็นต้นไป)
   * เคส AD1046 เหล็กแผ่นรีดร้อน VN/EG
   */
  private amendSampleHtml(): string {
    return [
      '<h3>รายละเอียดข้อมูล/เอกสารหลักฐานที่ขอให้ปรับปรุงแก้ไขและเพิ่มเติม</h3>',
      '<p><strong>อ้างอิง</strong> หนังสือกรม ที่ พณ 0309.09/460 ลงวันที่ 9 มิถุนายน 2563 อ้างถึงหนังสือ SSI ลงวันที่ 15 พฤษภาคม 2563 · กำหนดส่งแก้ภายใน 7 กรกฎาคม 2563 เวลา 16:30 น.</p>',
      '<p><strong>1. ข้อมูลบริษัท สหวิริยาสตีลอินดัสตรี จำกัด (มหาชน)</strong></p>',
      '<p data-amend-by="นางสาวจรีณา กิจส่งเสริมกุล" data-amend-at="9/6/2563 10:15" data-amend-label="(เพิ่ม:จรีณา 9/6/2563 10:15)" title="เพิ่มโดย นางสาวจรีณา กิจส่งเสริมกุล · 9/6/2563 10:15"><strong>1.1.1</strong> กรณีการยื่นคำขอโดยกระทำการแทนผู้ผลิตบางส่วนในอุตสาหกรรมภายใน ให้แนบรายชื่อผู้ผลิตที่ผู้ยื่นคำขอกระทำการแทนในภาคผนวก ข. ส่วนที่ 1</p>',
      '<p><strong>1.1.2</strong> ส่วนที่ 2 ให้แนบรายการและปริมาณสินค้าที่ผลิตและ/หรือจำหน่าย ของ บมจ. แอล พี เอ็น เพลทมิล</p>',
      '<p><strong>1.2 ข้อ 1.3</strong> ให้เพิ่มข้อมูลที่เกี่ยวข้องกับการใช้มาตรการตอบโต้การทุ่มตลาดสินค้าเหล็กแผ่นรีดร้อนชนิดเป็นม้วนและไม่เป็นม้วน ที่มีแหล่งกำเนิดจาก 14 ประเทศ</p>',
      '<p data-ai-suggest="1" data-ai-label="AI แนะนำ" title="AI ช่วยตรวจพบพิกัดที่อาจไม่ถูกต้อง"><strong>1.3 ข้อ 2.1.1</strong> ให้ตรวจสอบพิกัดศุลกากร พ.ศ. 2555 ที่ 7225.30.90.011 ให้ถูกต้อง</p>',
      '<p data-ai-suggest="1" data-ai-label="AI แนะนำ" title="AI ช่วยจับคู่พิกัดศุลกากรปี 2560 ที่ต้องแก้"><strong>1.4 สิ่งที่ส่งมาด้วย 1</strong> ให้ตรวจสอบและแก้ไขพิกัดศุลกากรของปี 2560 ให้ครบถ้วนถูกต้อง ดังนี้</p>',
      '<p data-ai-suggest="1">เดิม → ให้ตรวจสอบเป็น<br>',
      '7208.39 → เพิ่มแถวบรรทัดล่าง 1 แถว โดยระบุ 7208.39.90 — อื่นๆ<br>',
      '7208.54.00 → 7208.54<br>',
      '7208.90.00 → 7208.90.90<br>',
      '7211.13.1 → ตัดเลขพิกัดศุลกากรในบรรทัดนี้ออก เหลือไว้เพียงคำบรรยายเท่านั้น<br>',
      '7211.14.10 → ตัดตัวเลขพิกัดศุลกากรในบรรทัดนี้ออก เหลือไว้เพียงคำบรรยายเท่านั้น<br>',
      '7211.19.1 → ตัดตัวเลขพิกัดศุลกากรในบรรทัดนี้ออก เหลือไว้เพียงคำบรรยายเท่านั้น<br>',
      '7225.3 → 7225.30</p>',
      '<p><strong>1.5 ข้อ 2.1.10</strong> ให้ระบุข้อเปรียบเทียบระหว่างสินค้าที่ถูกพิจารณาและสินค้าที่ผลิตภายในประเทศ ทั้งในส่วนที่เหมือนกันและในส่วนที่แตกต่างกัน</p>',
      '<p data-amend-by="นายอนุชา ศรีเมือง" data-amend-at="22/6/2563 14:20" data-amend-edit-by="นางสาวจรีณา กิจส่งเสริมกุล" data-amend-edit-at="7/7/2563 11:05" data-amend-label="(เพิ่ม:อนุชา 22/6/2563 14:20) (แก้ไข:จรีณา 7/7/2563 11:05)" title="เพิ่มโดย นายอนุชา ศรีเมือง · 22/6/2563 14:20&#10;แก้ไขโดย นางสาวจรีณา กิจส่งเสริมกุล · 7/7/2563 11:05"><strong>1.6 ข้อ 3.1</strong> ให้แสดงรายละเอียดข้อมูลของบริษัทผู้ผลิตจากสาธารณรัฐอียิปต์เพิ่มเติม คือ บริษัท Al Ezz Flat Steel (EFS) ซึ่งเป็นผู้ผลิตที่เข้าร่วมกระบวนการในการไต่สวนการทุ่มตลาดสินค้าเหล็กแผ่นรีดร้อน ชนิดม้วนและไม่เป็นม้วน ที่มีแหล่งกำเนิดจากสาธารณรัฐอียิปต์ ครั้งก่อนด้วย</p>',
      '<p><strong>1.7 ตาราง 4.1.2</strong> ให้ตรวจสอบว่าราคาที่แสดงในตารางเป็นราคาสินค้า ณ หน้าโรงงาน หรือราคาสินค้ารวมค่าขนส่งทางเรือ</p>',
      '<p><strong>1.11</strong> ให้ชี้แจงว่าราคาขายสินค้าชนิดเดียวกันที่ผู้นำเข้าซื้อจากผู้ผลิตเป็นราคาสินค้า ณ ระดับใด ทั้งนี้ การเปรียบเทียบราคาของสินค้าที่ถูกพิจารณาและราคาสินค้าชนิดเดียวกัน ให้เปรียบเทียบ ณ ระดับการซื้อขายเดียวกัน (เช่น ราคาที่ผู้นำเข้า/ผู้ใช้ ซื้อซึ่งเป็นราคารวมค่าขนส่งถึงผู้นำเข้า/ผู้ใช้)</p>',
      '<p data-ai-suggest="1" data-ai-label="AI แนะนำ" title="AI พบข้อมูลตัดราคาอียิปต์ปี 2558 ไม่สอดคล้องตาราง 8.2"><strong>1.11.3</strong> ให้แก้ไข/ปรับปรุงข้อมูลการตัดราคาของอียิปต์ ปี 2558 ให้สอดคล้องกับตาราง 8.2</p>',
      '<p><strong>1.12 ตาราง 8.3</strong></p>',
      '<p><strong>1.12.1</strong> ให้ตรวจสอบต้นทุนรวมรายปี (ล้านบาท)</p>',
      '<p><strong>1.12.2</strong> ให้เพิ่มเติมข้อมูล ข. ค่าใช้จ่ายในการจัดการ การขายและอื่นๆ เป็น ข.1 ค่าใช้จ่ายในการจัดการ การขาย และ ข.2 ต้นทุนทางการเงิน</p>',
      '<p><strong>1.13 ตาราง 8.4</strong> ให้ตรวจสอบอัตราการใช้กำลังการผลิตรวมสำหรับปี 2562</p>',
      '<p><strong>1.14 ตาราง 8.6</strong></p>',
      '<p><strong>1.14.1</strong> ให้ตรวจสอบต้นทุนสินค้าที่ขายได้สำหรับปี 2560</p>',
      '<p><strong>1.14.2</strong> ให้ตรวจสอบ 5. ค่าใช้จ่ายการจัดการ การขายและอื่นๆ และ 6. ต้นทุนทางการเงิน ให้สอดคล้องกับตาราง 8.3</p>',
      '<p><strong>1.15 ตาราง 8.7</strong> ให้แก้ไข/ปรับปรุงข้อมูลปริมาณขาย โดยไม่รวมปริมาณการขายส่งออก</p>',
      '<p><strong>1.16 ตาราง 8.8 ข้อมูลสินค้าที่ถูกพิจารณา</strong></p>',
      '<p><strong>1.16.1</strong> ให้ชี้แจงรายละเอียดข้อมูลค่าใช้จ่ายในการขายและบริหาร (บาท/ตัน) ปี 2562 ที่เพิ่มสูงขึ้น</p>',
      '<p data-ai-suggest="1" data-ai-label="AI แนะนำ" title="AI พบผลิตภาพ (%yield) ปี 2562 สูงเกิน 100%"><strong>1.16.2</strong> ให้ตรวจสอบรายละเอียดข้อมูลผลิตภาพ (%yield) ปี 2562 เนื่องจากมีมูลค่าสูงเกิน 100%</p>',
      '<p><strong>1.16.3</strong> ให้ตรวจสอบ/ชี้แจงข้อมูลส่วนแบ่งตลาด ปี 2560 ที่เพิ่มขึ้นมากจากปี 2559</p>',
      '<p><strong>1.16.4</strong> ให้ตรวจสอบ/ชี้แจงปริมาณความต้องการใช้ในประเทศที่ลดลงอย่างมากตั้งแต่ปี 2560 เป็นต้นมา</p>',
      '<p><strong>2. ข้อมูลบริษัท จี เจ สตีล จำกัด (มหาชน) / กลุ่มที่เกี่ยวข้อง</strong></p>',
      '<p><strong>2.1 ตาราง 8.3</strong></p>',
      '<p><strong>2.1.1</strong> ให้ตรวจสอบมูลค่ารายไตรมาส ให้มูลค่ารวมทั้ง 4 ไตรมาส สอดคล้องกับข้อมูลรายปี เช่น ค่าใช้จ่ายในการจัดการขายอื่นๆ</p>',
      '<p><strong>2.1.2</strong> ให้แก้ไข/ปรับปรุงปริมาณการขาย ปี 2560 โดยไม่รวมปริมาณการขายส่งออก พร้อมทั้งให้แก้ไขต้นทุนค่าใช้จ่ายในการจัดการการขายและอื่นๆ ให้ถูกต้อง</p>',
      '<p><strong>2.1.3</strong> ให้ชี้แจงค่าใช้จ่ายในการขาย บริหารและอื่นๆ ที่สูงมากในปี 2558–2559</p>',
      '<p><strong>2.2 ตาราง 8.5</strong> ให้ตรวจสอบค่าจ้างแรงงาน ปี 2558 ให้สอดคล้องกับตาราง 8.8</p>',
      '<p><strong>2.3 ตาราง 8.7</strong> ให้ตรวจสอบข้อมูลปริมาณขายปี 2562 เนื่องจากไม่สอดคล้องกับตาราง 8.8.1</p>',
      '<p><strong>2.4 ตาราง 8.8</strong></p>',
      '<p data-ai-suggest="1" data-ai-label="AI แนะนำ" title="AI พบผลิตภาพ (%yield) ปี 2562 เกิน 100%"><strong>2.4.1</strong> ให้ตรวจสอบรายละเอียดข้อมูลผลิตภาพ (%yield) ปี 2562 เนื่องจากเกิน 100%</p>',
      '<p><strong>2.4.2</strong> ให้ชี้แจงสาเหตุที่กระแสเงินสดจากการดำเนินงานมีภาพรวมที่ดีขึ้น</p>',
      '<p><strong>2.4.3</strong> ให้ตรวจสอบรายได้ทั้งหมดของกิจการ ปี 2561 ให้สอดคล้องกับงบการเงินปรับปรุงใหม่ในปี 2562</p>',
      '<p><strong>2.4.4</strong> ให้ตรวจสอบหนี้สิน ปี 2560 และ 2561 ให้สอดคล้องกับงบการเงินปรับปรุงใหม่ในปี 2562</p>',
      '<p><strong>2.4.5</strong> ให้ตรวจสอบการคำนวณผลตอบแทนจากการลงทุน (ROA)</p>',
      '<p><strong>3. ข้อมูลบริษัท จีสตีล จำกัด (มหาชน)</strong></p>',
      '<p><strong>3.1 ตาราง 8.3.3</strong> ให้ตรวจสอบค่าใช้จ่ายในการขาย บริหาร และอื่นๆ ต่อหน่วย สำหรับปี 2561–2562</p>',
      '<p><strong>3.2 ตาราง 8.4.3</strong> ให้ตรวจสอบปริมาณสินค้าคงคลังในเดือนธันวาคม 2562 กับข้อมูลรวมสำหรับปี 2562 ให้สอดคล้องกัน</p>',
      '<p><strong>3.3 ตาราง 8.5</strong> ให้ตรวจสอบจำนวนการจ้างงานในการผลิต ปี 2558 และ 2559 ให้สอดคล้องกับตาราง 8.8</p>',
      '<p><strong>3.4 ตาราง 8.7</strong></p>',
      '<p><strong>3.4.1</strong> ให้ตรวจสอบส่วนแบ่งตลาด ปี 2561 และ 2562 ให้สอดคล้องกับตาราง 8.8</p>',
      '<p><strong>3.4.2</strong> ให้ตรวจสอบข้อมูลปริมาณขายปี 2562 ให้สอดคล้องกับตาราง 8.8.3</p>',
      '<p><strong>5. ประเด็นเพิ่มเติมตาราง 8</strong></p>',
      '<p><strong>5.1 ตาราง 8.3</strong></p>',
      '<p><strong>5.1.1</strong> ให้ตรวจสอบส่วนแบ่งตลาดปี 2561 และ 2562 ให้สอดคล้องกับตาราง 8.8</p>',
      '<p><strong>5.1.2</strong> ให้แก้ไข/ปรับปรุงปริมาณการขาย ปี 2562 โดยไม่รวมปริมาณการขายส่งออก พร้อมทั้งแก้ไขต้นทุนค่าใช้จ่ายในการจัดการการขายและอื่นๆ ให้ถูกต้อง</p>',
      '<p><strong>5.2 ตาราง 8.7</strong></p>',
      '<p><strong>5.2.1</strong> ให้ตรวจสอบปริมาณการผลิตปี 2562 ให้สอดคล้องกับตาราง 8.8</p>',
      '<p><strong>5.2.2</strong> ให้ตรวจสอบข้อมูลปริมาณขายปี 2562 ให้สอดคล้องกับตาราง 8.8.4</p>',
      '<p><strong>5.3 ตาราง 8.8</strong></p>',
      '<p><strong>5.3.1</strong> ให้ตรวจสอบกำไร (ขาดทุน) สุทธิ หนี้สิน และส่วนของผู้ถือหุ้นปี 2559 ให้สอดคล้องกับงบการเงินปรับปรุงใหม่ ปี 2560</p>',
      '<p><strong>5.3.2</strong> ให้ตรวจสอบกระแสเงินสดปี 2562 ให้สอดคล้องกับงบการเงินปี 2562</p>',
      '<p><strong>5.3.3</strong> ให้ตรวจสอบข้อมูลรวมต้นทุนการผลิตต่อหน่วย (บาท/ตัน) ให้สอดคล้องกับข้อมูลต้นทุนผลิตรวมกับค่าใช้จ่ายในการขายและบริหาร</p>',
      '<p>กองปกป้องและตอบโต้ทางการค้า · กรมการค้าต่างประเทศ · มิถุนายน 2563</p>',
    ].join('');
  }

  private seedAmendSampleTree(): void {
    const amendPass = this.latestAmendPassNo();
    const folderId = this.newAmendId('folder');
    this.amendFolders = [{ id: folderId, name: `รายการแก้ไขครั้งที่ ${amendPass}`, open: true }];
    this.amendFiles =
      amendPass >= 3
        ? [
            {
              id: this.newAmendId('file'),
              folderId,
              name: 'รายการแก้ไขปรับปรุงข้อมูลคำขอ ครั้งที่ 3.docx',
              saved: '09/10/2563',
            },
            {
              id: this.newAmendId('file'),
              folderId,
              name: 'สิ่งที่ส่งมาด้วย 12 ค่าขนส่งไปยังตลาด บางสะพาน-กรุงเทพฯ.pdf',
              saved: '09/10/2563',
            },
            {
              id: this.newAmendId('file'),
              folderId,
              name: 'AD VN-EG_Table 8.1-8.8 SSI.xlsx',
              saved: '09/10/2563',
            },
            {
              id: this.newAmendId('file'),
              folderId,
              name: 'AD VN-EG_Table 8.1-8.8 GJS.xlsx',
              saved: '09/10/2563',
            },
            {
              id: this.newAmendId('file'),
              folderId,
              name: 'AD VN-EG_Table 8.1-8.8 GST.xlsx',
              saved: '09/10/2563',
            },
            {
              id: this.newAmendId('file'),
              folderId,
              name: 'AD VN-EG_Table 8.1-8.8 SPM.xlsx',
              saved: '09/10/2563',
            },
          ]
        : [
            {
              id: this.newAmendId('file'),
              folderId,
              name: `1 หนังสือแก้ไขคำขอ ครั้งที่ ${amendPass}.pdf`,
              saved: this.clockToday() || '22/07/2563',
            },
          ];
    this.amendFolderId = folderId;
    this.writeAmendTree();
  }

  private amendTreeKey(): string {
    return `${this.bundleAmendFilesKey}-${this.bundleRoundNo}`;
  }

  private readAmendTree(): void {
    try {
      const raw = JSON.parse(sessionStorage.getItem(this.amendTreeKey()) || 'null') as {
        folders?: { id: string; name: string; open?: boolean }[];
        files?: { id: string; folderId: string; name: string; saved: string }[];
        selected?: string;
      } | null;
      this.amendFolders = (raw?.folders || []).map((folder) => ({
        id: folder.id,
        name: folder.name,
        open: folder.open !== false,
      }));
      this.amendFiles = raw?.files || [];
      this.amendFolderId = raw?.selected && this.amendFolders.some((folder) => folder.id === raw.selected)
        ? raw.selected
        : this.amendFolders[0]?.id || '';
      this.amendFolderEditId = '';
      this.amendFolderDraft = '';
    } catch {
      this.amendFolders = [];
      this.amendFiles = [];
      this.amendFolderId = '';
      this.amendFolderEditId = '';
      this.amendFolderDraft = '';
    }
  }

  private writeAmendTree(): void {
    try {
      if (!this.amendFolders.length && !this.amendFiles.length) {
        sessionStorage.removeItem(this.amendTreeKey());
        return;
      }
      sessionStorage.setItem(
        this.amendTreeKey(),
        JSON.stringify({
          folders: this.amendFolders,
          files: this.amendFiles,
          selected: this.amendFolderId,
        }),
      );
    } catch {
      /* ignore quota */
    }
  }

  private newAmendId(prefix: string): string {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  }

  protected amendFilesOf(folderId: string): { id: string; folderId: string; name: string; saved: string }[] {
    return this.amendFiles.filter((file) => file.folderId === folderId);
  }

  protected amendFileCount(folderId: string): number {
    return this.amendFilesOf(folderId).length;
  }

  protected toggleAmendTree(): void {
    this.amendTreeCollapsed = !this.amendTreeCollapsed;
  }

  protected selectAmendFolder(id: string): void {
    this.amendFolderId = id;
    this.writeAmendTree();
  }

  protected toggleAmendFolder(id: string): void {
    this.amendFolders = this.amendFolders.map((folder) =>
      folder.id === id ? { ...folder, open: !folder.open } : folder,
    );
    this.writeAmendTree();
  }

  protected addAmendFolder(): void {
    const id = this.newAmendId('folder');
    const name = `โฟลเดอร์ใหม่ ${this.amendFolders.length + 1}`;
    this.amendFolders = [...this.amendFolders, { id, name, open: true }];
    this.amendFolderId = id;
    this.amendFolderEditId = id;
    this.amendFolderDraft = name;
    this.writeAmendTree();
  }

  protected startRenameAmendFolder(id: string): void {
    const folder = this.amendFolders.find((row) => row.id === id);
    if (!folder) return;
    this.amendFolderEditId = id;
    this.amendFolderDraft = folder.name;
    this.amendFolderId = id;
  }

  protected setAmendFolderDraft(value: string): void {
    this.amendFolderDraft = value;
  }

  protected commitAmendFolderName(id: string): void {
    const name = this.amendFolderDraft.trim() || 'โฟลเดอร์ไม่มีชื่อ';
    this.amendFolders = this.amendFolders.map((folder) =>
      folder.id === id ? { ...folder, name } : folder,
    );
    this.amendFolderEditId = '';
    this.amendFolderDraft = '';
    this.writeAmendTree();
  }

  protected cancelAmendFolderRename(): void {
    this.amendFolderEditId = '';
    this.amendFolderDraft = '';
  }

  protected removeAmendFolder(id: string): void {
    this.amendFolders = this.amendFolders.filter((folder) => folder.id !== id);
    this.amendFiles = this.amendFiles.filter((file) => file.folderId !== id);
    if (this.amendFolderId === id) this.amendFolderId = this.amendFolders[0]?.id || '';
    if (this.amendFolderEditId === id) this.cancelAmendFolderRename();
    this.writeAmendTree();
  }

  protected addAmendFolderFiles(folderId: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    const saved = this.clockToday() || this.filedOn || '15/05/2563';
    const next = [...(input.files ?? [])].map((file) => ({
      id: this.newAmendId('file'),
      folderId,
      name: file.name,
      saved,
    }));
    if (next.length) {
      this.amendFiles = [...this.amendFiles, ...next];
      this.amendFolderId = folderId;
      this.amendFolders = this.amendFolders.map((folder) =>
        folder.id === folderId ? { ...folder, open: true } : folder,
      );
      this.writeAmendTree();
    }
    input.value = '';
  }

  protected removeAmendFile(id: string): void {
    this.amendFiles = this.amendFiles.filter((file) => file.id !== id);
    this.writeAmendTree();
  }

  protected downloadAmendFile(file: { id: string; folderId: string; name: string; saved: string }): void {
    const folder = this.amendFolders.find((row) => row.id === file.folderId);
    this.downloadBundleFile({
      group: folder?.name || 'แก้ไขคำขอ',
      name: file.name,
      saved: file.saved,
    });
  }

  protected get bundleFormInfo(): { code: string; measure: string; title: string; summary: string } {
    const catalog = requestForms.find((form) => form.code === this.bundleFormCode);
    const caseForm = this.caseForms.find((form) => form.code === this.bundleFormCode);
    return {
      code: this.bundleFormCode,
      measure: caseForm?.measure || this.measureLabel,
      title: catalog?.title || catalog?.label || `แบบ ${this.bundleFormCode}`,
      summary: catalog?.summary || '',
    };
  }

  /** รายการหัวข้อในแบบคำขอ ปร.1 — ส่วนที่ 1–8 + คำรับรอง */
  private get bundleFormItems(): TocLink[] {
    if (this.bundleFormCode !== 'ปร. 1') {
      return this.por2BundleToc.flatMap((group) => group.items);
    }
    const items: TocLink[] = [{ id: 'cover', label: 'หน้าปกแบบ ปร. 1', anchor: 'cover' }];
    for (const group of toc) {
      if (group.label.startsWith('เอกสารผนวก')) continue;
      if (group.label.includes('คำรับรอง')) {
        items.push(...group.items.filter((item) => item.anchor === 'part-9-pledge' || item.label.includes('คำรับรอง')));
        continue;
      }
      items.push(...group.items);
    }
    return items;
  }

  /**
   * สารบัญในรอบยื่น — ตามโฟลเดอร์จริง (ไม่ใส่เลข 1. 2. 3. หน้าชื่อ)
   * หนังสือนำส่ง → แบบคำขอ ปร.1 → มอบอำนาจ → งบ → ตาราง 8.1–8.8 → ภาคผนวก → สิ่งที่ส่งมาด้วย
   * เลขรอบอยู่ที่แถบโฟลเดอร์ด้านบน เช่น 1. 15 พค 63
   * โหมดฉบับสมบูรณ์: เพิ่มกลุ่มเล่มเปิดเผย/ปกปิด ด้านบน
   */
  protected get bundleToc(): TocGroup[] {
    const letterName = this.letterFileName || 'หนังสือนำส่ง.pdf';
    const annexOrder = ['หนังสือมอบอำนาจ', 'งบการเงิน', 'ตารางข้อมูล 8.1–8.8', 'ภาคผนวก', 'สิ่งที่ส่งมาด้วย'];
    /** กลุ่มไฟล์ — สารบัญเหลือชื่อกลุ่มอย่างเดียว (รายการไฟล์อยู่ในตารางรวมแล้ว) */
    const annexLabels = new Set(this.filingBundleAnnex.map((file) => file.group).filter(Boolean));
    const annexToc = [
      ...annexOrder.filter((label) => annexLabels.has(label)).map((label) => ({
        label,
        items: [{ id: 'annex', label, anchor: `file-group-${label}` }],
      })),
      ...[...annexLabels]
        .filter((label) => !annexOrder.includes(label))
        .map((label) => ({
          label,
          items: [{ id: 'annex', label, anchor: `file-group-${label}` }],
        })),
    ];
    const base: TocGroup[] = [
      {
        label: 'หนังสือนำส่ง',
        items: [{ id: 'letter-file', label: 'หนังสือนำส่ง', anchor: `file-letter-${letterName}` }],
      },
      {
        label: 'แบบคำขอ ปร. 1',
        items: this.bundleFormItems,
      },
      ...annexToc,
    ];
    // ฉบับเปิดเผย/ปกปิดใช้สารบัญเดียวกับแบบคำขอ — ไม่ซ้ำหัวข้อพร้อมจำนวนไฟล์
    return base;
  }

  /** รวมเล่มผ่านแล้ว — มีไฟล์ตัวอย่างครบ */
  protected editionBundleReady(kind: 'open' | 'closed'): boolean {
    const label = kind === 'closed' ? CLOSED_EDITION_KIND : OPEN_EDITION_KIND;
    return this.extrasOf(label).length > 0;
  }

  /** จุดสถานะในรายการเอกสาร — ผ่านแล้ววงกลมเขียวทึบแบบสารบัญแบบฟอร์ม ไม่ใช้แท็ก/สีรอ */
  protected editionDot(kind: 'open' | 'closed'): string {
    if (kind === 'closed') {
      if ((this.docAction === 'complete' && this.docSent) || this.editionBundleReady('closed')) {
        return 'assets/icons/por1-dot-done.svg';
      }
      return 'assets/icons/por1-dot.svg';
    }
    if (this.openEditionBuilt) return 'assets/icons/por1-dot-done.svg';
    if (this.docAction === 'complete' && this.docSent) return 'assets/icons/por1-dot-wait.svg';
    return 'assets/icons/por1-dot.svg';
  }

  /** หลังแจ้งครบถ้วน — เปิดฉบับปกปิดสมบูรณ์ก่อน แล้วค่อยให้ระบบสร้างฉบับเปิดเผย */
  protected get canBuildOpenEdition(): boolean {
    return this.docAction === 'complete' && this.docSent && this.editionBundleReady('closed') && !this.openEditionBuilt;
  }

  /**
   * ระบบสร้างฉบับเปิดเผยจากฉบับปกปิด — คัดลอกแล้วปกปิดค่าตัวเลขอ่อนไหว
   * (ตามประชุม: ระบบเป็นคนทำ ไม่ให้ผู้ยื่นทำตอนข้อมูลยังไม่นิ่ง)
   */
  protected generateOpenEditionFromClosed(): void {
    this.ensureClosedEditionFiles();
    this.ensureOpenEditionFiles();
    this.openEditionBuilt = true;
    const indexNote = [
      field('เรื่อง', 'ดัชนีการเปิดเผยจากฉบับปกปิดสมบูรณ์'),
      field('วันที่สร้าง', this.thaiToday()),
      field('วิธีทำ', 'ระบบคัดลอกฉบับปกปิดสมบูรณ์ แล้วแทนค่าอ่อนไหวด้วย [ข้อมูลปกปิด] ตามมาร์กในแบบ', true),
      field(
        'รายการที่ปกปิด',
        [
          'ข้อ 1.2 ความเกี่ยวข้องกับผู้นำเข้า/ผู้ส่งออก — รายละเอียดความสัมพันธ์',
          'ข้อ 4 มูลค่าปกติ — ตัวเลขราคาและต้นทุน',
          'ข้อ 5 ราคาส่งออก — ตัวเลขราคา',
          'ข้อ 6 ดัชนีการทุ่มตลาด — ผลคำนวณเปอร์เซ็นต์',
        ].join('\n'),
        true,
      ),
      field('หมายเหตุ', 'เจ้าหน้าที่ตรวจทานดัชนีก่อนส่งเข้าวาระ — การประสานขอฉบับเปิดเผยจากผู้ยื่นเป็นนอกรอบเมื่อจำเป็นเท่านั้น', true),
    ];
    const existing = this.madeDocs.find((item) => item.kind === OPEN_EDITION_KIND && item.fields.some((row) => row.label === 'รายการที่ปกปิด'));
    if (existing) {
      this.madeDocs = this.madeDocs.map((item) => (item.id === existing.id ? { ...item, at: this.thaiToday(), fields: indexNote } : item));
    } else {
      this.madeDocs = [...this.madeDocs, { id: `open-index-${Date.now()}`, kind: OPEN_EDITION_KIND, at: this.thaiToday(), fields: indexNote }];
    }
    writeMadeDocs(this.madeDocs);
    this.pickCompleteBundle('open');
    this.notice = 'assist';
  }

  /** จุดสถานะเอกสารหน่วยงาน — มีไฟล์/แบบฟอร์มแล้วเขียว ไม่ผ่านวางเทาให้ layout เท่ากัน */
  protected workDocDot(title: string): string {
    if (this.madeOf(title).length || this.extrasOf(title).length) return 'assets/icons/por1-dot-done.svg';
    return 'assets/icons/por1-dot.svg';
  }

  /** กลุ่มในสารบัญที่เป็นไฟล์รวม — คลิกชื่อกลุ่มพอ ไม่ไล่ทีละไฟล์ */
  protected isBundleFileTocGroup(group: TocGroup): boolean {
    return group.items.length > 0 && group.items.every((item) => item.id === 'annex' || item.id === 'letter-file');
  }

  /** จำนวนไฟล์ในกลุ่ม — โชว์ท้ายชื่อสารบัญ เช่น หนังสือมอบอำนาจ (8) */
  protected bundleFileGroupCount(group: TocGroup): number {
    if (group.items.some((item) => item.id === 'letter-file')) return 1;
    return this.filingBundleAnnex.filter((file) => file.group === group.label).length;
  }

  /** ใช้จัดหน้าในเล่ม — กลุ่มส่วนของแบบ ปร. */
  private get bundleFormSections(): TocGroup[] {
    if (this.bundleFormCode !== 'ปร. 1') return this.por2BundleToc;
    return toc
      .filter((group) => !group.label.startsWith('เอกสารผนวก'))
      .map((group) => {
        if (!group.label.includes('คำรับรอง')) return group;
        return {
          label: 'คำรับรองและลงนาม',
          items: group.items.filter((item) => item.anchor === 'part-9-pledge' || item.label.includes('คำรับรอง')),
        };
      });
  }

  protected pickBundleForm(code: string): void {
    if (!this.caseForms.some((form) => form.code === code)) return;
    this.bundleFormCode = code;
    this.placeBundleItem(this.bundleToc[0]?.items[0] || null);
  }

  protected openBundleItem(item: TocLink): void {
    this.placeBundleItem(item);
    const id = this.bundlePageId(this.bundleItemId, this.bundleItemLabel);
    queueMicrotask(() => {
      document.getElementById(`bundle-${id}`)?.scrollIntoView({ block: 'start', behavior: 'smooth' });
    });
  }

  /** หาไฟล์แนบจากชื่อที่อ้างในแบบ ปร. */
  protected findAnnexFile(name: string): { group: string; name: string; saved: string } | null {
    const needle = name.trim();
    if (!needle || needle === '—') return null;
    const letter = this.letterFileName || 'หนังสือนำส่ง.pdf';
    if (needle === letter || (needle.includes('หนังสือนำส่ง') && /\.pdf$/i.test(needle))) {
      return { group: 'หนังสือนำส่ง', name: letter, saved: this.letterDate || this.filedOn };
    }
    const exact = this.filingBundleAnnex.find((file) => file.name === needle);
    if (exact) return exact;
    const contained = this.filingBundleAnnex.find((file) => needle.includes(file.name));
    if (contained) return contained;
    const byPrefix = this.filingBundleAnnex.find((file) => file.name.includes(needle) || needle.replace(/\s+/g, '') === file.name.replace(/\s+/g, ''));
    return byPrefix || null;
  }

  /** จำนวนแถว textarea ของตารางส่วนที่ 2 ตามความยาวข้อความ */
  protected goodsCompareRows(value: string): number {
    const lines = (value || '').split('\n').length;
    return Math.min(18, Math.max(3, lines + (value.length > 180 ? 2 : 0)));
  }

  /** แยกข้อความช่องกรอกเป็นส่วนข้อความธรรมดา / ลิงก์ไฟล์ */
  protected fillValueParts(value: string): { text: string; fileName: string | null }[] {
    const raw = (value || '').trim() || '—';
    if (raw === '—') return [{ text: '—', fileName: null }];
    const letter = this.letterFileName || 'หนังสือนำส่ง.pdf';
    const annex = this.filingBundleAnnex;
    const names = [letter, ...annex.map((file) => file.name)].sort((a, b) => b.length - a.length);
    const hits: { start: number; end: number; name: string }[] = [];
    const pushHit = (start: number, end: number, name: string) => {
      if (hits.some((hit) => start < hit.end && hit.start < end)) return;
      hits.push({ start, end, name });
    };
    for (const name of names) {
      let from = 0;
      while (from < raw.length) {
        const at = raw.indexOf(name, from);
        if (at < 0) break;
        pushHit(at, at + name.length, name);
        from = at + name.length;
      }
    }
    // จับอ้างอิงสั้นในแบบ เช่น “สิ่งที่ส่งมาด้วย 1” / “สิ่งที่ส่งมาด้วย 2.1–2.3”
    const shortRe = /สิ่งที่ส[่ง]{1,2}มาด้วย\s*([0-9]+(?:\.[0-9]+)?)(?:\s*[–\-]\s*([0-9]+(?:\.[0-9]+)?))?/gu;
    let match: RegExpExecArray | null;
    while ((match = shortRe.exec(raw))) {
      const fromNo = match[1];
      const toNo = match[2] || fromNo;
      const file =
        annex.find((row) => {
          const hit = /(?:สิ่งที่ส[่ง]{1,2}มาด้วย|ส่งมาด้วย)\s*([0-9]+(?:\.[0-9]+)?)/u.exec(row.name);
          if (!hit) return false;
          const n = Number(hit[1]);
          return n >= Number(fromNo) && n <= Number(toNo);
        }) || annex.find((row) => row.name.includes(`สิ่งที่ส่งมาด้วย ${fromNo}`));
      if (file) pushHit(match.index, match.index + match[0].length, file.name);
    }
    if (!hits.length) {
      const file = this.findAnnexFile(raw);
      return [{ text: raw, fileName: file?.name || null }];
    }
    hits.sort((a, b) => a.start - b.start || b.end - a.end);
    const parts: { text: string; fileName: string | null }[] = [];
    let cursor = 0;
    for (const hit of hits) {
      if (hit.start > cursor) parts.push({ text: raw.slice(cursor, hit.start), fileName: null });
      parts.push({ text: raw.slice(hit.start, hit.end), fileName: hit.name });
      cursor = hit.end;
    }
    if (cursor < raw.length) parts.push({ text: raw.slice(cursor), fileName: null });
    return parts.length ? parts : [{ text: raw, fileName: null }];
  }

  protected openAnnexFile(name: string, event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    const file = this.findAnnexFile(name);
    if (!file) return;
    if (file.group === 'หนังสือนำส่ง') {
      this.openBundleItem({ id: 'letter-file', label: 'หนังสือนำส่ง', anchor: `file-letter-${file.name}` });
      return;
    }
    this.openBundleItem({ id: 'annex', label: file.group, anchor: `file-group-${file.group}` });
  }

  protected bundleItemCurrent(item: TocLink): boolean {
    return this.bundleItemLabel === item.label && this.bundleItemId === (item.anchor || item.id || item.label);
  }

  protected bundlePageIdMatch(pageId: string): boolean {
    return this.bundlePageId(this.bundleItemId, this.bundleItemLabel) === pageId;
  }

  protected bundleChapterBreak(index: number): boolean {
    const pages = this.activeBundlePages;
    if (index <= 0) return true;
    return pages[index]?.chapter !== pages[index - 1]?.chapter;
  }

  /** หาสารบัญกลุ่มเดียวกับหัวข้อที่เลือก */
  private findBundleTocGroup(itemId: string, label: string): TocGroup | null {
    const id = this.bundlePageId(itemId, label);
    for (const group of this.bundleToc) {
      const hit = group.items.some((item) => {
        const itemKey = this.bundlePageId(item.anchor || item.id || item.label, item.label);
        return itemKey === id || item.label === label || item.anchor === itemId;
      });
      if (hit) return group;
      if (this.isBundleFileTocGroup(group) && (group.label === label || itemId === `file-group-${group.label}`)) {
        return group;
      }
    }
    const annex = this.filingBundleAnnex.find((file) => file.name === label || `file-${file.group}-${file.name}` === itemId);
    if (annex) return this.bundleToc.find((group) => group.label === annex.group) || null;
    return null;
  }

  private pagesForTocGroup(group: TocGroup, pages: BundlePage[]): BundlePage[] {
    const ids = new Set(group.items.map((item) => this.bundlePageId(item.anchor || item.id || item.label, item.label)));
    const labels = new Set(group.items.map((item) => item.label));
    const fileGroup = this.isBundleFileTocGroup(group);
    return pages.filter((page) => {
      if (fileGroup && page.kind === 'file' && page.group && (labels.has(page.group) || page.group === group.label)) {
        return true;
      }
      if (ids.has(page.id) || labels.has(page.title)) return true;
      if (page.heading && labels.has(page.heading)) return true;
      if (page.fileName && labels.has(page.fileName)) return true;
      return false;
    });
  }

  /** แสดงทั้งกลุ่มต่อกันยาว — ไม่ตัดเป็นหน้าละหัวข้อ */
  protected get activeBundlePages(): BundlePage[] {
    const pages = this.filingBundlePages;
    if (!pages.length) return [];
    if (!this.bundleItemId && !this.bundleItemLabel) {
      const firstGroup = this.bundleToc[0];
      if (firstGroup) {
        const groupPages = this.pagesForTocGroup(firstGroup, pages);
        if (groupPages.length) return groupPages.every((page) => page.kind === 'file') ? [groupPages[0]] : groupPages;
      }
      return [pages[0]];
    }
    const group = this.findBundleTocGroup(this.bundleItemId, this.bundleItemLabel);
    if (group) {
      const groupPages = this.pagesForTocGroup(group, pages);
      if (groupPages.length) {
        // กลุ่มไฟล์ใช้ตารางรวมอยู่แล้ว — โชว์หน้าเดียวในกลุ่ม
        if (groupPages.every((page) => page.kind === 'file')) {
          const id = this.bundlePageId(this.bundleItemId, this.bundleItemLabel);
          return [groupPages.find((page) => page.id === id) || groupPages[0]];
        }
        return groupPages;
      }
    }
    const id = this.bundlePageId(this.bundleItemId, this.bundleItemLabel);
    const byId = pages.filter((page) => page.id === id);
    if (byId.length) return byId;
    const byLabel = pages.filter((page) => page.title === this.bundleItemLabel || page.heading === this.bundleItemLabel || page.fileName === this.bundleItemLabel);
    return byLabel.length ? byLabel : [pages[0]];
  }

  protected get activeBundlePage(): BundlePage | null {
    return this.activeBundlePages[0] || null;
  }

  /** ไฟล์ในกลุ่มเดียวกับหัวข้อที่เลือก — สำหรับติ๊กโหลด */
  protected get activeBundleFileRows(): { id: string; group: string; name: string; saved: string }[] {
    const page = this.activeBundlePage;
    if (!page || page.kind !== 'file') return [];
    const group = page.group || '';
    return this.filingBundlePages
      .filter((row) => row.kind === 'file' && (row.group || '') === group)
      .map((row) => ({
        id: row.id,
        group: row.group || '',
        name: row.fileName || row.title,
        saved: row.saved || this.filedOn,
      }));
  }

  protected get bundleFilePickCount(): number {
    return this.activeBundleFileRows.filter((row) => this.bundleFilePick[row.id]).length;
  }

  protected get allBundleFilesPicked(): boolean {
    const rows = this.activeBundleFileRows;
    return !!rows.length && rows.every((row) => this.bundleFilePick[row.id]);
  }

  protected toggleBundleFilePick(id: string): void {
    this.bundleFilePick = { ...this.bundleFilePick, [id]: !this.bundleFilePick[id] };
  }

  protected toggleAllBundleFilePick(): void {
    const on = !this.allBundleFilesPicked;
    const next = { ...this.bundleFilePick };
    for (const row of this.activeBundleFileRows) next[row.id] = on;
    this.bundleFilePick = next;
  }

  protected downloadPickedBundleFiles(): void {
    const picked = this.activeBundleFileRows.filter((row) => this.bundleFilePick[row.id]);
    if (!picked.length) return;
    for (const file of picked) this.downloadBundleFile(file);
  }

  private placeBundleItem(item: TocLink | null): void {
    if (!item) {
      this.bundleItemId = '';
      this.bundleItemLabel = '';
      this.bundleFilePick = {};
      return;
    }
    this.bundleItemId = item.anchor || item.id || item.label;
    this.bundleItemLabel = item.label;
    this.bundleCommentTarget = '';
    this.bundleFilePick = {};
  }

  private bundlePageId(itemId: string, label: string): string {
    if (itemId === 'cover' || label.startsWith('หน้าปก') || label.startsWith('สรุปเล่ม') || label.startsWith('ใบปก')) {
      return `cover-${this.bundleFormCode}`;
    }
    if (itemId.startsWith('file-') || label.match(/\.(pdf|docx?|xlsx?)$/i) || label === 'หนังสือนำส่ง' || label.includes('หนังสือนำส่ง')) {
      const letterName = this.letterFileName || 'หนังสือนำส่ง.pdf';
      if (itemId.startsWith('file-letter-') || label === 'หนังสือนำส่ง' || label === letterName || label.includes('หนังสือนำส่ง')) {
        return `file-letter-${letterName}`;
      }
      if (itemId.startsWith('file-group-')) {
        const groupName = itemId.slice('file-group-'.length);
        const first = this.filingBundleAnnex.find((row) => row.group === groupName);
        return first ? `file-${first.group}-${first.name}` : itemId;
      }
      const byGroup = this.filingBundleAnnex.find((row) => row.group === label);
      if (byGroup && !label.match(/\.(pdf|docx?|xlsx?)$/i)) {
        return `file-${byGroup.group}-${byGroup.name}`;
      }
      const file = this.filingBundleAnnex.find((row) => row.name === label || `file-${row.group}-${row.name}` === itemId);
      if (file) return `file-${file.group}-${file.name}`;
    }
    return `${this.bundleFormCode}-${label}`;
  }

  /**
   * ลำดับเล่ม: หนังสือนำส่ง → แบบ ปร. ส่วนที่ 1–8 + คำรับรอง → เอกสารแนบ
   * (ฉบับเปิดเผย/ปกปิดใช้โครงเดียวกับแบบคำขอ)
   */
  protected get filingBundlePages(): BundlePage[] {
    const info = this.bundleFormInfo;
    const letterName = this.letterFileName || 'หนังสือนำส่ง.pdf';
    const pages: BundlePage[] = [
      {
        id: `file-letter-${letterName}`,
        kind: 'file',
        chapter: 'หนังสือนำส่ง',
        title: letterName,
        heading: letterName,
        group: 'หนังสือนำส่ง',
        fileName: letterName,
        saved: this.letterDate || this.filedOn,
        fields: [
          { label: 'กลุ่มเอกสาร', value: 'หนังสือนำส่ง' },
          { label: 'ชื่อไฟล์', value: letterName },
          { label: 'วันที่บันทึก', value: this.letterDate || this.filedOn },
        ],
      },
      {
        id: `cover-${info.code}`,
        kind: 'cover',
        chapter: 'แบบ ปร. 1',
        title: 'หน้าปกแบบ ปร. 1',
        heading: 'แบบ ปร. 1',
        body: '',
        fields: [],
      },
    ];
    for (const group of this.bundleFormSections) {
      for (const item of group.items) {
        const fields = info.code === 'ปร. 1'
          ? this.bundleFieldsForItem(item, group.label)
          : this.bundleFieldsForPor2(item.label, group.label);
        pages.push({
          id: `${info.code}-${item.label}`,
          kind: 'text',
          chapter: group.label,
          title: item.label,
          heading: item.label,
          body: fields.find((row) => row.label === '__body')?.value,
          fields: fields.filter((row) => row.label !== '__body'),
        });
      }
    }
    for (const file of this.filingBundleAnnex) {
      pages.push({
        id: `file-${file.group}-${file.name}`,
        kind: 'file',
        chapter: file.group || 'เอกสารแนบ',
        title: file.name,
        heading: file.name,
        group: file.group,
        fileName: file.name,
        saved: file.saved,
        fields: [
          { label: 'กลุ่มเอกสาร', value: file.group },
          { label: 'ชื่อไฟล์', value: file.name },
          { label: 'วันที่บันทึก', value: file.saved },
        ],
      });
    }
    return pages;
  }

  private partyLines(key: string, limit = 0): string {
    const block = this.parties.find((row) => row.key === key);
    const rows = block?.rows ?? [];
    const list = limit > 0 ? rows.slice(0, limit) : rows;
    if (!list.length) return 'ไม่มี';
    return list
      .map((row, index) => {
        const contact = [row.address, row.phone && `โทร. ${row.phone}`, row.fax && `โทรสาร ${row.fax}`].filter(Boolean).join(' · ');
        return `${index + 1}) ${row.name}${contact ? `\n   ${contact}` : ''}`;
      })
      .join('\n');
  }

  private bundleFieldsForItem(item: TocLink, _group: string): { label: string; value: string }[] {
    const anchor = item.anchor || '';
    const label = item.label;
    const id = item.id;

    if (anchor === 'part-1-1' || label.includes('1.1')) {
      return [
        { label: 'มาตรการที่ขอให้ดำเนินการพิจารณา', value: this.measureName },
        { label: 'ชื่อผู้ยื่นคำขอ', value: this.company },
        { label: 'สัญชาติ', value: this.nationality },
        { label: 'ที่อยู่', value: this.address },
        { label: 'โทรศัพท์', value: this.phone },
        { label: 'โทรสาร', value: this.fax || '—' },
        { label: 'ประเภทการยื่น', value: 'ยื่นคำขอโดยกระทำการแทนผู้ผลิตบางส่วนในอุตสาหกรรมภายใน' },
        { label: 'ผู้ผลิตที่มอบอำนาจให้ยื่นแทน', value: this.makers.map((row, i) => `${i + 1}) ${row.name}\n   ${row.address}\n   โทร. ${row.phone} · โทรสาร ${row.fax || '—'}`).join('\n') },
        { label: 'ผู้ผลิตที่ไม่ได้ร่วมยื่น', value: this.outsideProducer || '—' },
        { label: 'ผู้รับมอบอำนาจ / ผู้ลงนาม', value: `${this.agent || this.signerPrint} · ${this.roleTitle}` },
      ];
    }
    if (anchor === 'part-1-2' || label.includes('1.2')) {
      return [{ label: 'ความเกี่ยวข้องกับผู้นำเข้าหรือผู้ส่งออก', value: this.relatedImport || 'ไม่มี' }];
    }
    if (anchor === 'part-1-3' || label.includes('1.3')) {
      return [{ label: 'คำขอมาตรการช่วยเหลือในช่วง 1 ปีก่อนหน้า', value: this.priorAid || 'ไม่มี' }];
    }
    if (id === '2' || anchor === 'part-2' || label.includes('เปรียบเทียบสินค้า')) {
      return [
        { label: 'สรุปสินค้า', value: this.goodsDetail || '—' },
        { label: 'ช่องทางการจำหน่าย / ผู้ใช้ขั้นสุดท้าย', value: this.channelDetail || '—' },
        ...this.goodsCompareForRound.map((row) => ({
          label: row.item,
          value: `สินค้าที่ถูกพิจารณา: ${row.subject}\nสินค้าชนิดเดียวกันในประเทศ: ${row.like}`,
        })),
        {
          label: 'เอกสารแนบประกอบส่วนที่ 2',
          value: this.docs.map((file) => file.name).join('\n') || '—',
        },
      ];
    }
    if (anchor === 'part-producers' || label.includes('3.1')) {
      const producers =
        this.bundleRoundNo >= 2
          ? `${this.partyLines('producers')}\nAl Ezz Flat Steel (EFS) · สาธารณรัฐอาหรับอียิปต์ (เพิ่มตามหนังสือแก้ไขครั้งที่ 1)`
          : this.partyLines('producers');
      return [
        { label: 'ผู้ผลิตสินค้าที่ถูกพิจารณา', value: producers },
        { label: 'หมายเหตุ', value: 'แบบคำขระบุว่าไม่มีผู้ส่งออกแยกต่างหากจากผู้ผลิต' },
      ];
    }
    if (anchor === 'part-exporters' || label.includes('3.2')) {
      return [{ label: 'ผู้ส่งออกสินค้าที่ถูกพิจารณา', value: this.partyLines('exporters') }];
    }
    if (anchor === 'part-importers' || label.includes('3.3')) {
      return [
        { label: 'ที่มาของรายชื่อ', value: 'ศูนย์เทคโนโลยีสารสนเทศและการสื่อสาร สำนักงานปลัดกระทรวงพาณิชย์ (โปรดดูสิ่งที่ส่งมาด้วย 6)' },
        { label: 'ผู้นำเข้าสินค้าที่ถูกพิจารณา', value: this.partyLines('importers', 12) },
      ];
    }
    if (anchor === 'part-users' || label.includes('3.4')) {
      return [{ label: 'สมาคมหรือกลุ่มอุตสาหกรรมผู้ใช้', value: this.partyLines('users') }];
    }
    if (anchor === 'part-4-1' || label.includes('4.1')) {
      return [
        { label: 'ช่วงเวลาที่ใช้คำนวณ', value: 'เมษายน 2562' },
        { label: 'อัตราแลกเปลี่ยน', value: '31.8596 บาทต่อดอลลาร์สหรัฐ (ธนาคารแห่งประเทศไทย)' },
        { label: 'วิธีหามูลค่าปกติ', value: this.factoryNote || '—' },
        { label: 'มูลค่าปกติหน้าโรงงาน · เวียดนาม', value: '17,514 บาท/ตัน (จากราคา CFR/Metal Expert หักค่าขนส่ง)' },
        { label: 'มูลค่าปกติหน้าโรงงาน · อียิปต์', value: '19,418 บาท/ตัน (ราคาหน้าโรงงานจากแหล่งเดียวกัน)' },
        { label: 'เอกสารอ้างอิง', value: 'สิ่งที่ส่งมาด้วย 7–8 และ 10' },
      ];
    }
    if (anchor === 'part-4-2' || label.includes('4.2')) {
      return [{ label: 'ราคาส่งออกไปประเทศที่สาม', value: this.thirdReason || 'ไม่มี — ใช้ราคาจำหน่ายในประเทศผู้ส่งออกตามข้อ 4.1' }];
    }
    if (anchor.includes('part-4-3') || label.includes('4.3')) {
      return [
        { label: 'ต้นทุนในประเทศแหล่งกำเนิด / ประเทศไทย', value: 'ไม่ใช้ข้อ 4.3 เพราะสามารถหาราคาตามข้อ 4.1 ได้' },
        { label: 'รายละเอียด', value: this.originDetail || this.thaiDetail || 'ไม่มี' },
      ];
    }
    if (anchor === 'part-4-4' || label.includes('4.4')) {
      return [{ label: 'ตลาดมีลักษณะเฉพาะ', value: this.specialDetail || 'ไม่มี' }];
    }
    if (anchor === 'part-4-5' || label.includes('4.5')) {
      return [{ label: 'ประเทศที่ไม่ใช้ระบบกลไกตลาด', value: this.compareReason || 'ไม่มี ประเทศผู้ส่งออกใช้ระบบเศรษฐกิจแบบกลไกตลาด จึงไม่ใช้ข้อ 4.5' }];
    }
    if (anchor === 'part-5-2' || label.includes('5.2')) {
      return [{ label: 'ราคาส่งออกที่คำนวณขึ้น', value: this.exportConstructed || 'ไม่มี — ใช้ราคาส่งออกตามข้อ 5.1 จากสถิตินำเข้ากรมศุลกากร' }];
    }
    if (anchor === 'part-5' || label.includes('5.1') || id === '5') {
      return [
        { label: 'วิธีหาราคาส่งออก', value: this.exportDetail || '—' },
        { label: 'ราคาส่งออกหน้าโรงงาน · เวียดนาม', value: '16,761 บาท/ตัน (CIF 17,238 บาท/ตัน หักค่าระวาง ค่าประกัน และค่าขนส่งในประเทศ)' },
        { label: 'ราคาส่งออกหน้าโรงงาน · อียิปต์', value: '17,349 บาท/ตัน (CIF 19,026 บาท/ตัน)' },
        { label: 'ค่าระวางเรือ', value: 'เวียดนาม 15 ดอลลาร์/ตัน · อียิปต์ 40 ดอลลาร์/ตัน' },
        { label: 'เอกสารอ้างอิง', value: 'สิ่งที่ส่งมาด้วย 9, 11, 12, 13' },
      ];
    }
    if (anchor === 'part-6' || id === '6' || label.includes('ส่วนเหลื่อม')) {
      return [
        { label: '__body', value: 'เปรียบเทียบมูลค่าปกติและราคาส่งออก ณ ระดับหน้าโรงงาน ตามตารางส่วนที่ 6 ของแบบคำขอ' },
        ...this.marginCountries.map((row) => ({
          label: row.name,
          value: `มูลค่าปกติ ${row.normal} บาท/ตัน\nราคาส่งออกหน้าโรงงาน ${row.exportPrice} บาท/ตัน\nส่วนเหลื่อม ${row.margin} บาท/ตัน\nราคา CIF ${row.cif} บาท/ตัน\nอัตราการทุ่มตลาด ${row.rate}%`,
        })),
        { label: 'หน่วย', value: this.marginUnit },
        { label: 'เอกสารอ้างอิง', value: 'สิ่งที่ส่งมาด้วย 10 อัตราแลกเปลี่ยนรายเดือน 2562.pdf' },
      ];
    }
    if (id === '7.1' || label.includes('7.1')) {
      return [
        { label: '__body', value: this.explainDetail || 'ไม่มีข้อมูลการอุดหนุน เคสนี้ขอให้ไต่สวนการทุ่มตลาด' },
        { label: 'เอกสาร / โครงการอุดหนุน', value: 'ไม่มี' },
      ];
    }
    if (id === '7.2' || label.includes('7.2')) {
      return [{ label: 'คำอธิบายการอุดหนุน', value: 'ไม่มี' }];
    }
    if (id === '7.3' || label.includes('7.3')) {
      return [{ label: 'การอุดหนุนเจาะจง', value: this.subsidySpecific || 'ไม่มี' }];
    }
    if (id === '7.4' || label.includes('7.4') || (id.startsWith('7') && label.includes('อุดหนุน'))) {
      return [{ label: 'ประโยชน์ที่ผู้ส่งออกได้รับ', value: this.subsidyBenefit || 'ไม่มี' }];
    }
    if (id === '8.1' || label.includes('8.1')) {
      return [
        { label: 'ปริมาณนำเข้า', value: this.notes['importDetail'] },
        { label: 'เอกสารตาราง', value: 'AD VN-EG_Table 8.1, 8.2, 8.7-ALL rev.01_15.05.20.xlsx' },
      ];
    }
    if (id === '8.2' || label.includes('8.2')) {
      return [
        { label: 'ผลกระทบด้านราคา', value: this.notes['priceEffect'] },
        { label: 'ผลต่อต้นทุน', value: this.notes['costEffect'] },
      ];
    }
    if (id === '8.3' || label.includes('8.3')) {
      return [
        { label: 'ยอดจำหน่ายภายในประเทศ', value: this.notes['sales'] },
        { label: 'ผลผลิต', value: this.notes['output'] },
        { label: 'ส่วนแบ่งตลาด', value: this.notes['share'] },
        { label: 'กำลังการผลิต', value: this.notes['capacity'] },
        { label: 'สินค้าคงคลัง', value: this.notes['stock'] },
        { label: 'กำไร (ขาดทุน)', value: this.notes['profit'] },
        { label: 'เอกสารตาราง', value: 'Table 8.3, 8.4, 8.5, 8.8' },
      ];
    }
    if (id === '8.4' || label.includes('8.4')) {
      return [
        { label: 'ปัจจัยอื่น ๆ', value: this.notes['factorDetail'] },
        { label: 'เอกสารอ้างอิง', value: 'สิ่งที่ส่งมาด้วย 14 SEAISI Pro.-Cap..pdf' },
      ];
    }
    if (id === '8.5' || label.includes('8.5')) {
      return [{ label: 'สรุปความเสียหาย', value: this.notes['summaryDetail'] }];
    }
    if (id === '8.6' || label.includes('8.6')) {
      return [{ label: 'ข้อมูลผู้ซื้อ', value: this.notes['buyerDetail'] }];
    }
    if (id === '8.7' || label.includes('8.7')) {
      return [
        { label: 'แนวโน้มกำลังการผลิตต่างประเทศ', value: this.notes['trendCapacity'] },
        { label: 'แนวโน้มราคา', value: this.notes['trendPrice'] },
        { label: 'แนวโน้มอื่น', value: this.notes['trendOther'] },
      ];
    }
    if (id === '8.8' || label.includes('8.8')) {
      return [
        { label: 'อุปสรรคต่อการก่อตั้งหรือพัฒนา', value: this.notes['intentDetail'] },
        { label: 'เอกสารตาราง', value: 'AD VN-EG_Table 8.6-ALL_rev.01_15.05.20.xlsx' },
      ];
    }
    if (anchor === 'part-9-pledge' || label.includes('คำรับรอง')) {
      return [
        { label: 'คำรับรอง', value: this.pledgeText || this.pledgeDefault },
        { label: 'ผู้ลงนาม', value: this.signerPrint || this.signer },
        { label: 'ตำแหน่ง', value: this.roleTitle },
        { label: 'วันที่ลงนาม', value: this.signedOn },
      ];
    }
    if (anchor === 'part-9-letter' || label.includes('หนังสือนำส่ง')) {
      return [
        { label: 'ที่', value: this.letterNo || '—' },
        { label: 'วันที่', value: this.letterDate || '—' },
        { label: 'เรื่อง', value: this.letterSubject || '—' },
        { label: 'เรียน', value: this.letterTo || '—' },
        { label: 'วัตถุประสงค์', value: this.letterPurpose || '—' },
        { label: 'ข้อความหนังสือ', value: this.letterBody || '—' },
      ];
    }
    return [{ label: label, value: '—' }];
  }

  private bundleFieldsForPor2(label: string, group: string): { label: string; value: string }[] {
    if (label.includes('มาตรการ')) {
      return [
        { label: 'แบบ', value: 'ปร. 2' },
        { label: 'มาตรการ', value: this.measureName },
        { label: 'ประเภทการยื่น', value: 'ทบทวนความจำเป็นในการใช้บังคับอากรตอบโต้' },
      ];
    }
    if (label.includes('ข้อมูล')) {
      return [
        { label: 'ผู้ยื่นคำขอ', value: this.company },
        { label: 'เลขที่อ้างอิง', value: this.refId },
        { label: 'วันที่ยื่น', value: this.filedOn },
      ];
    }
    if (label.includes('สินค้า')) {
      return [
        { label: 'สินค้าที่ร้อง', value: this.caseGoods },
        { label: 'ประเทศ', value: 'เวียดนาม, อียิปต์' },
        { label: group, value: 'ตามประกาศและเหตุที่เปลี่ยนแปลงในคำขอ' },
      ];
    }
    if (label.includes('วัตถุประสงค์')) {
      return [{ label: 'วัตถุประสงค์และพยานหลักฐาน', value: 'ขอให้ทบทวนความจำเป็นในการใช้บังคับอากรตอบโต้ตามแบบ ปร. 2' }];
    }
    if (label.includes('คำรับรอง')) {
      return [
        { label: 'คำรับรอง', value: this.pledgeText || '—' },
        { label: 'ผู้ลงนาม', value: this.signer || '—' },
      ];
    }
    return [{ label, value: '—' }];
  }

  private bundleAnswersFor(section: string, itemLabel = ''): { label: string; value: string }[] {
    const round = this.filingBundleRound;
    const answers = round?.answers?.length ? round.answers : this.formAnswers();
    const key = section.replace(/^ส่วนที่ \d+\s*/u, '').trim();
    const matched = answers.filter((row) => {
      const groupKey = row.group.replace(/^ส่วนที่ \d+\s*/u, '').trim();
      return row.group.includes(key) || key.includes(groupKey) || section.includes(row.group) || (!!itemLabel && row.label.includes(itemLabel.slice(0, 8)));
    });
    return matched.map((row) => ({ label: row.label, value: row.value }));
  }

  protected get filingBundleAnnex(): { group: string; name: string; saved: string }[] {
    const round = this.filingBundleRound;
    if (round?.files?.length) {
      return round.files.map((file) => ({ group: file.group, name: file.name, saved: file.saved }));
    }
    return this.realFilingAnnex();
  }

  /**
   * เอกสารแนบหลังแบบ ปร. — มอบอำนาจ → งบ → ตาราง 8.1–8.8 → ภาคผนวก → สิ่งที่ส่งมาด้วย
   * (หนังสือนำส่งแยกหัวข้อต่างหาก ไม่รวมในนี้)
   */
  private realFilingAnnex(): { group: string; name: string; saved: string }[] {
    const day = this.filedOn;
    const row = (group: string, name: string, saved = day) => ({ group, name, saved });
    const fromNames = (group: string, names: string[]) => names.map((name) => row(group, name));
    const fromDocs = (group: string, files: DocFile[]) => files.map((file) => row(group, file.name, file.saved));
    const support = this.sortSupportDocs([
      ...this.docs,
      ...this.otherDocs.filter((file) => !/ภาคผนวก|ผนวก/.test(file.name)),
      ...this.groups['otherDoc'].map((name) => ({ name, saved: day })),
      ...this.exportDocs,
      ...this.marginDocs,
      ...this.sheets.factor.filter((file) => !file.name.endsWith('.xlsx')),
    ]);
    const tables = [
      ...this.sheets.import,
      { name: this.files['unitCost'], saved: day },
      ...this.sheets.factor.filter((file) => file.name.endsWith('.xlsx')),
      ...this.sheets.summary,
      ...this.sheets.intent,
      ...this.sheets.trend,
    ];
    return [
      ...fromNames('หนังสือมอบอำนาจ', this.groups['power']),
      ...fromNames('งบการเงิน', this.groups['finance']),
      ...fromDocs('ตารางข้อมูล 8.1–8.8', tables),
      ...fromDocs('ภาคผนวก', this.otherDocs.filter((file) => /ภาคผนวก|ผนวก/.test(file.name))),
      ...fromDocs('สิ่งที่ส่งมาด้วย', support),
    ];
  }

  /** เรียงสิ่งที่ส่งมาด้วยตามเลขในชื่อไฟล์ (1, 2.1, 2.2 … 14) */
  private sortSupportDocs(files: DocFile[]): DocFile[] {
    const rank = (name: string): number => {
      const hit = /(?:สิ่งที่ส[่ง]{1,2}มาด้วย|ส่งมาด้วย)\s*([0-9]+(?:\.[0-9]+)?)/u.exec(name);
      if (hit) return Number(hit[1]);
      if (/แผนภาพ/.test(name)) return 5.5;
      return 99;
    };
    const seen = new Set<string>();
    return files
      .filter((file) => {
        if (seen.has(file.name)) return false;
        seen.add(file.name);
        return true;
      })
      .sort((a, b) => rank(a.name) - rank(b.name) || a.name.localeCompare(b.name, 'th'));
  }

  protected commentsFor(pageId: string): BundleComment[] {
    return this.bundleComments.filter((item) => item.target === pageId && !item.resolved);
  }

  protected startBundleComment(pageId: string): void {
    if (!this.bundleIsReview || !this.reviewRole) return;
    this.bundleCommentTarget = pageId;
    this.bundleCommentDraft = '';
  }

  protected cancelBundleComment(): void {
    this.bundleCommentTarget = '';
    this.bundleCommentDraft = '';
  }

  protected saveBundleComment(): void {
    const text = this.bundleCommentDraft.trim();
    if (!this.bundleIsReview || !this.reviewRole || !this.bundleCommentTarget || !text) return;
    const next: BundleComment = {
      id: `bc-${Date.now()}`,
      target: this.bundleCommentTarget,
      text,
      at: this.replyStamp(),
      author: this.accounts.displayName || this.signedPerson || 'เจ้าหน้าที่',
    };
    this.bundleComments = [next, ...this.bundleComments];
    this.writeBundleComments(this.bundleComments);
    this.bundleCommentTarget = '';
    this.bundleCommentDraft = '';
  }

  protected resolveBundleComment(id: string): void {
    this.bundleComments = this.bundleComments.map((item) => (item.id === id ? { ...item, resolved: true } : item));
    this.writeBundleComments(this.bundleComments);
  }

  protected removeBundleComment(id: string): void {
    this.bundleComments = this.bundleComments.filter((item) => item.id !== id);
    this.writeBundleComments(this.bundleComments);
  }

  protected reviewNoteOf(pageId: string): string {
    return this.bundleReviewNotes[pageId] || '';
  }

  protected setReviewNote(pageId: string, value: string): void {
    if (!this.bundleIsReview || !this.reviewRole) return;
    this.bundleReviewNotes = { ...this.bundleReviewNotes, [pageId]: value };
    this.writeBundleReviewNotes(this.bundleReviewNotes);
  }

  /** แสดงผลแบบ Word ปร.1 — ใช้รูปแบบจาก document/แบบฟอร์ม/มาตรการ AD */
  protected porWordBlocks(page: BundlePage): PorWordBlock[] {
    if (page.kind === 'cover') return this.porWordCover();
    if (page.kind === 'file') return [];
    const head = page.heading || page.title;
    if (head.includes('1.1')) return this.porWordPart11();
    if (head.includes('1.2')) {
      return [
        { kind: 'section', text: 'ส่วนที่ 1  ข้อมูลทั่วไป' },
        { kind: 'item', text: '1.2 ผู้ผลิตสินค้าชนิดเดียวกันรายใดเป็นผู้นำเข้าสินค้าที่ถูกพิจารณาหรือมีความเกี่ยวข้องกับผู้นำเข้า/ผู้ส่งออก' },
        { kind: 'prompt', text: 'ให้แจ้งชื่อ ที่อยู่ หมายเลขโทรศัพท์ โทรสาร เว็บไซต์ และไปรษณีย์อิเล็กทรอนิกส์ของผู้ผลิต ผู้นำเข้า ผู้ส่งออก และความเกี่ยวข้อง รวมทั้งปริมาณการนำเข้า' },
        { kind: 'para', text: this.relatedImport || 'ไม่มี' },
      ];
    }
    if (head.includes('1.3')) {
      return [
        { kind: 'section', text: 'ส่วนที่ 1  ข้อมูลทั่วไป' },
        { kind: 'item', text: '1.3 คำขอมาตรการช่วยเหลือในช่วง 1 ปีก่อนหน้า' },
        { kind: 'prompt', text: 'ผู้ยื่นคำขอหรือผู้ผลิตรายอื่นที่ให้ผู้ยื่นคำขอกระทำการแทนได้ยื่นคำขอให้รัฐบาลกำหนดมาตรการช่วยเหลือหรือไม่ อย่างไร' },
        { kind: 'para', text: this.priorAid || 'ไม่มี' },
      ];
    }
    if (head.includes('เปรียบเทียบสินค้า') || page.chapter.includes('ส่วนที่ 2')) {
      return [
        { kind: 'section', text: 'ส่วนที่ 2  รายละเอียดของสินค้า' },
        {
          kind: 'prompt',
          text: 'ให้เปรียบเทียบสินค้าที่ถูกพิจารณากับสินค้าชนิดเดียวกัน ที่ผู้ยื่นคำขอผลิตได้ในประเทศและได้รับผลกระทบตามรายการต่อไปนี้ — กรอกข้อความในตาราง และแนบสิ่งที่ส่งมาด้วยที่อ้างอิงในแต่ละช่อง',
        },
        {
          kind: 'table',
          headers: ['รายการ', 'สินค้าที่ถูกพิจารณา', 'สินค้าชนิดเดียวกัน'],
          rows: this.goodsCompareForRound.map((row) => [row.item, row.subject || '—', row.like || '—']),
        },
        { kind: 'fill', label: 'สรุปสินค้า', value: this.goodsDetail || '—' },
        { kind: 'fill', label: 'ช่องทางการจำหน่าย / ผู้ใช้ขั้นสุดท้าย', value: this.channelDetail || '—' },
        {
          kind: 'fill',
          label: 'เอกสารแนบประกอบส่วนที่ 2',
          value: this.docs.map((file) => file.name).join('\n') || '—',
        },
      ];
    }
    if (head.includes('3.1') || head.includes('ผู้ผลิตสินค้าที่ถูกพิจารณา')) {
      const blocks = this.porWordParty('ส่วนที่ 3  ข้อมูลเกี่ยวกับผู้ผลิตและ/หรือผู้ส่งออกและผู้นำเข้า', '3.1 ให้แจ้งรายชื่อ ที่อยู่ หมายเลขโทรศัพท์ โทรสาร เว็บไซต์ และไปรษณีย์อิเล็กทรอนิกส์ของผู้ผลิตสินค้าที่ถูกพิจารณา', 'producers');
      if (this.bundleRoundNo >= 2) {
        blocks.push({
          kind: 'fill',
          label: 'ผู้ผลิตเพิ่มตามหนังสือแก้ไขครั้งที่ 1',
          value: 'Al Ezz Flat Steel (EFS) · สาธารณรัฐอาหรับอียิปต์ — เพิ่มตามข้อ 1.6 ของหนังสือแก้ไขคำขอ ครั้งที่ 1',
        });
      }
      return blocks;
    }
    if (head.includes('3.2') || head.includes('ผู้ส่งออก')) {
      return this.porWordParty('ส่วนที่ 3  ข้อมูลเกี่ยวกับผู้ผลิตและ/หรือผู้ส่งออกและผู้นำเข้า', '3.2 ให้แจ้งรายชื่อ ที่อยู่ หมายเลขโทรศัพท์ โทรสาร เว็บไซต์ และไปรษณีย์อิเล็กทรอนิกส์ของผู้ส่งออกสินค้าที่ถูกพิจารณา', 'exporters');
    }
    if (head.includes('3.3') || head.includes('ผู้นำเข้า')) {
      return this.porWordParty('ส่วนที่ 3  ข้อมูลเกี่ยวกับผู้ผลิตและ/หรือผู้ส่งออกและผู้นำเข้า', '3.3 ให้แจ้งรายชื่อ ที่อยู่ หมายเลขโทรศัพท์ โทรสาร เว็บไซต์ และไปรษณีย์อิเล็กทรอนิกส์ของผู้นำเข้าสินค้าที่ถูกพิจารณาในประเทศ', 'importers', 12);
    }
    if (head.includes('3.4') || head.includes('สมาคม')) {
      return this.porWordParty('ส่วนที่ 3  ข้อมูลเกี่ยวกับผู้ผลิตและ/หรือผู้ส่งออกและผู้นำเข้า', '3.4 ให้แจ้งรายชื่อ ที่อยู่ หมายเลขโทรศัพท์ โทรสาร เว็บไซต์ และไปรษณีย์อิเล็กทรอนิกส์ของสมาคม หรือกลุ่มอุตสาหกรรมผู้ใช้สินค้าที่ถูกพิจารณาในประเทศ', 'users');
    }
    if (head.includes('4.1') || head.includes('ราคาจำหน่ายในประเทศผู้ส่งออก')) {
      return [
        { kind: 'section', text: 'ส่วนที่ 4  มูลค่าปกติ' },
        { kind: 'item', text: '4.1 มูลค่าปกติของสินค้าชนิดเดียวกันที่จำหน่ายในตลาดประเทศผู้ส่งออก' },
        { kind: 'para', text: this.factoryNote || '—' },
        {
          kind: 'table',
          headers: ['รายการ', 'เวียดนาม', 'อียิปต์'],
          rows: [
            ['ราคาอ้างอิง (เม.ย. 2562)', 'CFR 566 USD/ตัน', 'ex-work 601 USD/ตัน'],
            ['อัตราแลกเปลี่ยน (ธปท.)', '31.8596 บาท/USD', '31.8596 บาท/USD'],
            ['ราคาเป็นบาท', '17,714 บาท/ตัน', '19,418 บาท/ตัน'],
            ['หักค่าขนส่งในประเทศ', '200 บาท/ตัน', '—'],
            ['มูลค่าปกติหน้าโรงงาน', '17,514 บาท/ตัน', '19,418 บาท/ตัน'],
          ],
        },
        { kind: 'fill', label: 'เอกสารอ้างอิง', value: 'สิ่งที่ส่งมาด้วย 7, 8 และ 10' },
      ];
    }
    if (head.includes('5.1') || (head.includes('ราคาส่งออก') && !head.includes('5.2') && !head.includes('คำนวณ'))) {
      return [
        { kind: 'section', text: 'ส่วนที่ 5  ราคาส่งออก (Export Price)' },
        { kind: 'item', text: '5.1 ราคาส่งออกสินค้าที่ถูกพิจารณา' },
        { kind: 'para', text: this.exportDetail || '—' },
        {
          kind: 'table',
          headers: ['รายการ', 'เวียดนาม', 'อียิปต์'],
          rows: [
            ['ปริมาณนำเข้า (เม.ย. 2562)', '5,061 ตัน', '118 ตัน'],
            ['มูลค่านำเข้า', '87,246,040 บาท', '2,239,666 บาท'],
            ['ราคา CIF', '17,238 บาท/ตัน', '19,026 บาท/ตัน'],
            ['ค่าประกันภัย', '≈3 บาท/ตัน', '≈3 บาท/ตัน'],
            ['ค่าระวางเรือ', '15 USD = 477 บาท/ตัน', '40 USD = 1,274 บาท/ตัน'],
            ['ค่าขนส่งในประเทศ', 'ไม่มี (FHS ริมทะเล)', '400 บาท/ตัน'],
            ['ราคาส่งออกหน้าโรงงาน', '16,761 บาท/ตัน', '17,349 บาท/ตัน'],
          ],
        },
        { kind: 'fill', label: 'เอกสารอ้างอิง', value: 'สิ่งที่ส่งมาด้วย 9, 10, 11, 12 และ 13' },
      ];
    }
    if (head.includes('ส่วนเหลื่อม') || (page.chapter.includes('ส่วนที่ 6') && (head.includes('6') || head.includes('เปรียบเทียบมูลค่าปกติ')))) {
      return [
        { kind: 'section', text: 'ส่วนที่ 6  ส่วนเหลื่อมการทุ่มตลาด' },
        { kind: 'prompt', text: 'เปรียบเทียบมูลค่าปกติและราคาส่งออก ณ ระดับหน้าโรงงาน' },
        {
          kind: 'table',
          headers: ['รายการ', 'เวียดนาม', 'อียิปต์'],
          rows: [
            ['(1) มูลค่าปกติ', '17,514', '19,418'],
            ['(2) ราคาส่งออกหน้าโรงงาน', '16,761', '17,349'],
            ['(3) ส่วนเหลื่อมการทุ่มตลาด', '753', '2,069'],
            ['(4) ราคา CIF', '17,238', '19,026'],
            ['(5) อัตราการทุ่มตลาด (%)', '4.36', '10.87'],
          ],
        },
        { kind: 'fill', label: 'หน่วย', value: this.marginUnit || 'บาท/ตัน' },
        { kind: 'fill', label: 'หมายเหตุ', value: 'ส่วนเหลื่อม = (1)−(2) · อัตรา = (3)/(4)×100%' },
      ];
    }
    if (head.includes('คำรับรอง')) {
      return [
        { kind: 'section', text: 'คำรับรองและลงนาม' },
        { kind: 'para', text: this.pledgeText || this.pledgeDefault },
        { kind: 'sign', name: this.signerPrint || this.signer, role: this.roleTitle, date: this.signedOn || this.filedOn },
      ];
    }
    return [
      { kind: 'section', text: page.chapter },
      { kind: 'item', text: head },
      ...(page.body ? [{ kind: 'prompt' as const, text: page.body }] : []),
      ...(page.fields || []).map((row) => ({ kind: 'fill' as const, label: row.label, value: row.value || '—' })),
    ];
  }

  private porWordCover(): PorWordBlock[] {
    const ad = this.measureName.includes('AD') || this.measureName.includes('ทุ่มตลาด') || !this.measureName.includes('CVD');
    const cvd = this.measureName.includes('CVD') || this.measureName.includes('อุดหนุน');
    return [
      {
        kind: 'head',
        title: this.bundleFormCode === 'ปร. 1' ? 'แบบ ปร. 1' : `แบบ ${this.bundleFormCode}`,
        lines: [
          'แบบคำขอให้ดำเนินการพิจารณาตอบโต้การทุ่มตลาดหรือการอุดหนุน',
          'ตามมาตรา 33 วรรคหนึ่ง และมาตรา 70',
          'แนบท้ายประกาศกระทรวงพาณิชย์',
          'เรื่อง การยื่นคำขอให้พิจารณาตอบโต้การทุ่มตลาดหรือการอุดหนุน ตอบโต้การหลบเลี่ยง',
          'มาตรการตอบโต้ ทบทวนมาตรการ และขอคืนอากร พ.ศ. 2564',
        ],
      },
      { kind: 'hint', text: 'กรอกข้อความหรือทำเครื่องหมาย ✓ ลงในช่อง □ ตามที่เป็นจริง' },
      { kind: 'measure', ad, cvd },
      {
        kind: 'toc',
        items: [
          'ส่วนที่ 1      ข้อมูลทั่วไป',
          'ส่วนที่ 2      รายละเอียดของสินค้า',
          'ส่วนที่ 3      ข้อมูลเกี่ยวกับผู้ผลิตและ/หรือผู้ส่งออกและผู้นำเข้า',
          'ส่วนที่ 4     มูลค่าปกติ',
          'ส่วนที่ 5      ราคาส่งออก',
          'ส่วนที่ 6      ส่วนเหลื่อมการทุ่มตลาด',
          'ส่วนที่ 7      การอุดหนุน',
          'ส่วนที่ 8      การประเมินความเสียหายของอุตสาหกรรมภายใน',
          'เอกสารผนวก ก.กรณีเป็นการยื่นคำขอ โดยกระทำการแทนผู้ผลิตทั้งหมด',
          'เอกสารผนวก ข.กรณีเป็นการยื่นคำขอ โดยกระทำการแทนผู้ผลิตบางส่วน',
          'เอกสารผนวก ค. หนังสือมอบอำนาจ',
        ],
      },
      { kind: 'item', text: 'วิธีการกรอกคำขอ' },
      { kind: 'para', text: 'ก. ในกรณีที่ขอให้พิจารณาตอบโต้การทุ่มตลาด ให้กรอกข้อมูลในส่วนที่ 1 ถึงส่วนที่ 6 และส่วนที่ 8' },
      { kind: 'para', text: 'ข. ในกรณีที่ขอให้พิจารณาตอบโต้การอุดหนุน ให้กรอกข้อมูลในส่วนที่ 1 ถึงส่วนที่ 3 ส่วนที่ 7 และส่วนที่ 8' },
      { kind: 'para', text: 'ค. ในส่วนที่ 4 ถึงส่วนที่ 6 ให้ระบุสกุลเงินเป็นหน่วยเดียวกันพร้อมแสดงอัตราแลกเปลี่ยนและที่มาของข้อมูล สำหรับข้อมูลในส่วนที่ 8 ให้ระบุสกุลเงินเป็นบาท' },
      { kind: 'para', text: 'ง. ให้ผู้ยื่นคำขอแสดงข้อมูลของอุตสาหกรรมและให้แยกข้อมูลเป็นรายผู้ผลิตด้วย' },
      { kind: 'para', text: 'จ. ให้แนบสำเนางบการเงินของผู้ยื่นคำขอในปีปัจจุบันและย้อนหลัง 3 ปี ที่ได้รับการตรวจสอบแล้ว พร้อมกับรับรองสำเนาถูกต้องจำนวน 1 ชุด' },
      { kind: 'para', text: 'ฉ. ข้อมูลข่าวสารใดที่ระบุว่าเป็นข้อมูลข่าวสารที่ต้องปกปิด ต้องเป็นไปตามมาตรา 26 แห่งพระราชบัญญัติการตอบโต้การทุ่มตลาดและการอุดหนุนซึ่งสินค้าจากต่างประเทศ พ.ศ. 2542 ให้ผู้ยื่นคำขอยื่นแบบคำขอฉบับที่ปกปิด 1 ชุด และฉบับที่เปิดเผยได้ 1 ชุด' },
      { kind: 'para', text: 'ช. หากมีการร้องขอให้ดำเนินการไต่สวนผู้ส่งออกมากกว่า 1 ประเทศ ให้ระบุรายละเอียดข้อมูลพร้อมหลักฐานเป็นรายประเทศด้วย' },
      { kind: 'para', text: 'ซ. หากผู้ยื่นคำขอไม่สามารถให้ข้อมูลตามที่ระบุในแบบคำขอ ขอให้แสดงเหตุผลด้วย' },
      { kind: 'para', text: 'ฌ. ในการกรอกข้อมูล ขอให้ดูคำอธิบายรายละเอียดในแต่ละส่วนประกอบด้วย' },
      { kind: 'para', text: 'ญ. ให้ผู้ยื่นคำขอหรือผู้รับมอบอำนาจลงนามกำกับเอกสารหลักฐานทุกหน้า' },
    ];
  }

  private porWordPart11(): PorWordBlock[] {
    return [
      { kind: 'section', text: 'ส่วนที่ 1  ข้อมูลทั่วไป' },
      {
        kind: 'prompt',
        text: 'ผู้ยื่นคำขอจะต้องเป็นผู้ผลิตสินค้าชนิดเดียวกันกับสินค้านำเข้าที่ผู้ยื่นคำขอกล่าวหาว่ามีการทุ่มตลาดหรือได้รับการอุดหนุน (ซึ่งต่อไปนี้เรียกว่า สินค้าที่ถูกพิจารณา)',
      },
      { kind: 'item', text: '1.1 ผู้ยื่นคำขอ' },
      { kind: 'fill', label: 'ชื่อ/บริษัท/สมาคม', value: this.company },
      { kind: 'fill', label: 'สัญชาติ', value: this.nationality },
      { kind: 'fill', label: 'ที่อยู่', value: this.address },
      { kind: 'fill', label: 'โทรศัพท์', value: this.phone },
      { kind: 'fill', label: 'โทรสาร', value: this.fax || '—' },
      { kind: 'fill', label: 'ไปรษณีย์อิเล็กทรอนิกส์', value: this.email || '—' },
      { kind: 'fill', label: 'โดย (ผู้มีอำนาจกระทำการแทน/ผู้รับมอบอำนาจ)', value: this.agent || this.signerPrint },
      { kind: 'fill', label: 'โทรศัพท์ผู้รับมอบอำนาจ', value: this.agentPhone || '—' },
      { kind: 'fill', label: 'โทรสารผู้รับมอบอำนาจ', value: this.agentFax || '—' },
      { kind: 'fill', label: 'ไปรษณีย์อิเล็กทรอนิกส์ผู้รับมอบอำนาจ', value: this.agentEmail || '—' },
      {
        kind: 'check',
        on: this.filing === 'self',
        label: 'ยื่นคำขอในนามของตนเอง',
        detail: 'ให้แสดง (1) หนังสือรับรองบริษัท (2) งบการเงินที่ผู้สอบบัญชีรับอนุญาตรับรอง (3) รายการสินค้าที่ผลิตและ/หรือจำหน่าย',
      },
      {
        kind: 'check',
        on: this.filing === 'all',
        label: 'ยื่นคำขอ โดยกระทำการแทนผู้ผลิตทั้งหมด',
        detail: 'ระบุรายชื่อในเอกสารผนวก ก. และแนบหนังสือรับรอง งบการเงิน หนังสือมอบอำนาจ และรายการปริมาณสินค้าของผู้ผลิตทุกราย',
      },
      {
        kind: 'check',
        on: this.filing === 'part',
        label: 'ยื่นคำขอ โดยกระทำการแทนผู้ผลิตบางส่วน',
        detail: 'ระบุรายชื่อในเอกสารผนวก ข. ส่วนที่ 1 และส่วนที่ 2 พร้อมเอกสารประกอบ',
      },
      {
        kind: 'para',
        text: this.makers.length
          ? `ผู้ผลิตที่มอบอำนาจให้ยื่นแทน\n${this.makers.map((row, i) => `${i + 1}) ${row.name}\n   ${row.address}\n   โทร. ${row.phone} · โทรสาร ${row.fax || '—'}`).join('\n')}`
          : '',
      },
      { kind: 'fill', label: 'ผู้ผลิตที่มิได้ขอให้กระทำการแทน', value: this.outsideProducer || '—' },
    ];
  }

  private porWordParty(section: string, item: string, key: string, limit = 0): PorWordBlock[] {
    return [
      { kind: 'section', text: section },
      { kind: 'item', text: item },
      { kind: 'para', text: this.partyLines(key, limit) },
    ];
  }

  protected downloadBundleFile(file: { group: string; name: string; saved: string }): void {
    const body = [
      `เอกสารผนวกในแบบคำขอ`,
      `เลขที่อ้างอิง ${filingRefId}`,
      `กลุ่ม ${file.group}`,
      `ชื่อไฟล์ ${file.name}`,
      `วันที่ ${file.saved}`,
      '',
      'ไฟล์นี้เป็นส่วนหนึ่งของแบบคำขอ',
    ].join('\n');
    const url = URL.createObjectURL(new Blob([body], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name.includes('.') ? file.name : `${file.name}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }

  /** ชื่อไฟล์ตามตัวอย่าง AD1046 เช่น แบบคำขอ ปร.1 AD เวียดนาม อียิปต์_Sub1_15.05.20 1.pdf */
  protected por1ExportPdfName(): string {
    const round = this.bundleRoundNo || 1;
    const on = this.filingBundleRound?.submittedOn || this.filedOn;
    const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(on.trim());
    let stamp = '15.05.62';
    if (match) {
      const year = Number(match[3]);
      const yy = String(year > 2400 ? year - 2500 : year % 100).padStart(2, '0');
      stamp = `${String(Number(match[1])).padStart(2, '0')}.${String(Number(match[2])).padStart(2, '0')}.${yy}`;
    }
    return `แบบคำขอ ปร.1 AD เวียดนาม อียิปต์_Sub${round}_${stamp} 1.pdf`;
  }

  /** ดาวน์โหลดเอกสารที่เปิดอยู่บนหน้าแบบคำขอ — ต้นฉบับ/ฉบับปกปิดเป็น PDF · แก้ไขคำขอเป็นไฟล์ Word */
  protected downloadActiveFilingDoc(): void {
    if (this.bundleIsAmend) {
      this.downloadAmendWordDoc();
      return;
    }
    this.downloadFilingBundle();
  }

  /** ดาวน์โหลดข้อความแก้ไขคำขอจาก editor */
  protected downloadAmendWordDoc(): void {
    this.captureAmendEditor();
    const round = this.bundleRoundNo || 1;
    const title = `แก้ไขคำขอ ปร.1 · รอบ ${round}`;
    const fileName = `แก้ไขคำขอ-ปร1-รอบ${round}-${this.refId || filingRefId}.doc`;
    this.downloadEditorHtmlAsWord(fileName, title, this.bundleAmendText || '<p><br></p>');
  }

  /** Export PDF จัดเรียงตามแบบคำขอ ปร.1 ตัวอย่าง AD1046 Sub1 */
  protected downloadFilingBundle(edition: 'original' | 'review' | 'amend' = this.bundleEdition): void {
    const fileName = this.por1ExportPdfName();
    const pdfEdition: 'original' | 'review' = edition === 'review' ? 'review' : 'original';
    if (pdfEdition === 'original' && this.bundleRoundNo <= 1) {
      void this.downloadAssetFile('assets/samples/ad1046/por1-ad-vn-eg-sub1.pdf', fileName);
      return;
    }
    this.printPor1FormPdf(pdfEdition, fileName);
  }

  /** HTML จาก contenteditable → .doc ให้เปิดใน Word ได้ */
  private downloadEditorHtmlAsWord(fileName: string, title: string, bodyHtml: string): void {
    const safeTitle = this.escapeHtml(title);
    const html = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" lang="th">
<head>
<meta charset="utf-8">
<title>${safeTitle}</title>
<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View></w:WordDocument></xml><![endif]-->
<style>
  @page { size: A4; margin: 2.54cm; }
  body { margin: 0; color: #0E2346; font-family: 'TH SarabunPSK', 'TH Sarabun New', Sarabun, sans-serif; font-size: 16pt; line-height: 1.15; }
  p { margin: 0 0 0.35em; }
  table { border-collapse: collapse; width: 100%; }
  td, th { border: 1px solid #0E2346; padding: 4px 8px; vertical-align: top; }
  mark.word-cmt-mark { background: transparent; }
</style>
</head>
<body>
<p><strong>${safeTitle}</strong></p>
<p>เลขที่อ้างอิง ${this.escapeHtml(this.refId || filingRefId)}</p>
<hr>
${bodyHtml || '<p><br></p>'}
</body>
</html>`;
    const blob = new Blob(['\ufeff', html], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName.endsWith('.doc') ? fileName : `${fileName}.doc`;
    link.click();
    URL.revokeObjectURL(url);
  }

  /** Export All — แบบคำขอ + หนังสือนำส่ง + ไฟล์แนบทั้งหมดในรอบนี้ */
  protected exportAllFilingBundle(): void {
    const letterName = this.letterFileName || 'หนังสือนำส่ง.pdf';
    const letter = {
      group: 'หนังสือนำส่ง',
      name: letterName,
      saved: this.letterDate || this.filedOn,
    };
    const annex = this.filingBundleAnnex.map((file) => ({
      group: file.group,
      name: file.name,
      saved: file.saved,
    }));
    const files = [letter, ...annex];
    this.downloadFilingBundle();
    files.forEach((file, index) => {
      window.setTimeout(() => this.downloadBundleFile(file), 350 * (index + 1));
    });
  }

  private async downloadAssetFile(href: string, fileName: string): Promise<void> {
    try {
      const res = await fetch(href);
      if (!res.ok) throw new Error(String(res.status));
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      this.printPor1FormPdf(this.bundleEdition === 'review' ? 'review' : 'original', fileName);
    }
  }

  /** พิมพ์/บันทึกเป็น PDF — รูปแบบ Word ปร.1 + ข้อมูลที่กรอก */
  private printPor1FormPdf(edition: 'original' | 'review', fileName: string): void {
    const comments = edition === 'review' ? this.bundleComments.filter((item) => !item.resolved) : [];
    const formPages = this.filingBundlePages.filter((page) => page.kind !== 'file');
    const pages = formPages
      .map((page) => {
        const note = edition === 'review' ? (this.bundleReviewNotes[page.id] || '').trim() : '';
        const pageComments = comments.filter((item) => item.target === page.id);
        const commentHtml = pageComments.length
          ? `<aside class="note"><strong>Comments</strong>${pageComments.map((item) => `<p><em>${this.escapeHtml(item.author)} · ${this.escapeHtml(item.at)}</em><br>${this.escapeHtml(item.text)}</p>`).join('')}</aside>`
          : '';
        const noteHtml = note
          ? `<p class="note"><strong>บันทึกแก้ไขในฉบับตรวจ</strong><br>${this.escapeHtml(note).replaceAll('\n', '<br>')}</p>`
          : '';
        const body = this.porWordBlocks(page)
          .map((block) => this.porWordBlockHtml(block))
          .join('');
        return `<section class="block">${body}${noteHtml}${commentHtml}</section>`;
      })
      .join('');
    const stamp = edition === 'review' ? 'ฉบับตรวจ' : 'เอกสารฉบับปกปิด';
    const html = `<!DOCTYPE html><html lang="th"><head><meta charset="utf-8"><title>${this.escapeHtml(fileName)}</title><style>
@page{size:A4;margin:16mm 14mm}
body{margin:0;color:#0E2346;font-family:Thonburi,"Sarabun",sans-serif;font-size:14px;line-height:22px}
.mark{margin:0 0 8px;font-size:12px;font-weight:700}.meta{margin:0 0 18px;font-size:12px;color:#52637A}
.block{break-inside:avoid;margin:0 0 22px;padding-top:10px}
.cover{margin:0 0 12px}.cover .code{margin:0 0 10px;font-size:16px;font-weight:700;text-align:right}
.title-box{margin:0;padding:14px 18px;border:1px solid #0E2346;text-align:center}.title-box p{margin:0 0 2px;font-size:15px;font-weight:700;line-height:24px}
.hint{margin:4px 0 8px}.measure-box{margin:4px 0 12px;padding:12px 14px;border:1px solid #0E2346}.measure-label{margin:0 0 8px;font-weight:700}.measure-box p{margin:0 0 4px}
.toc{margin:8px 0 12px;padding:0;list-style:none}.toc li{margin:0;line-height:24px}
.section{margin:14px 0 6px;font-size:16px;font-weight:700}.item{margin:8px 0 4px;font-size:15px;font-weight:700}
.prompt,.hint,.detail{margin:0 0 6px;font-size:14px}.fill{display:grid;grid-template-columns:max-content 1fr;gap:4px 8px;margin:0 0 6px}
.fill .value{border-bottom:1px dotted #0E2346;white-space:pre-wrap}
.check{margin:2px 0 6px}.para{margin:0 0 4px;white-space:pre-wrap;text-align:justify}
table{width:100%;border-collapse:collapse;margin:8px 0}th,td{border:1px solid #0E2346;padding:6px 8px;vertical-align:top;text-align:left;white-space:pre-wrap}th{text-align:center;font-weight:700}
.sign{margin:24px 0;text-align:center}.note{margin:10px 0 0;padding:10px 12px;border-left:3px solid #C9A227;background:#FFF8E8}
@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style></head><body>
<p class="mark">${stamp}</p>
<p class="meta">${this.escapeHtml(this.bundleRoundFolder)} · ${this.escapeHtml(fileName)} · ${filingRefId}</p>
${pages}
<script>
window.onload=function(){
  document.title=${JSON.stringify(fileName.replace(/\.pdf$/i, ''))};
  window.focus();
  window.print();
};
<\/script>
</body></html>`;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.open();
    win.document.write(html);
    win.document.close();
  }

  private porWordBlockHtml(block: PorWordBlock): string {
    switch (block.kind) {
      case 'head':
        return `<header class="cover"><p class="code">${this.escapeHtml(block.title)}</p><div class="title-box">${block.lines.map((line) => `<p>${this.escapeHtml(line)}</p>`).join('')}</div></header>`;
      case 'measure':
        return `<div class="measure-box"><p class="measure-label">ระบุมาตรการที่ขอให้ดำเนินการพิจารณา</p><p>${block.ad ? '☑' : '☐'} ตอบโต้การทุ่มตลาด</p><p>${block.cvd ? '☑' : '☐'} ตอบโต้การอุดหนุน</p></div>`;
      case 'toc':
        return `<ul class="toc">${block.items.map((item) => `<li>${this.escapeHtml(item)}</li>`).join('')}</ul>`;
      case 'hint':
        return `<p class="hint">${this.escapeHtml(block.text)}</p>`;
      case 'section':
        return `<h2 class="section">${this.escapeHtml(block.text)}</h2>`;
      case 'item':
        return `<h3 class="item">${this.escapeHtml(block.text)}</h3>`;
      case 'prompt':
        return `<p class="prompt">${this.escapeHtml(block.text)}</p>`;
      case 'fill':
        return `<p class="fill"><span class="label">${this.escapeHtml(block.label)}</span><span class="value">${this.escapeHtml(block.value || '—').replaceAll('\n', '<br>')}</span></p>`;
      case 'check':
        return `<div class="check"><p>${block.on ? '☑' : '☐'} ${this.escapeHtml(block.label)}</p>${block.detail ? `<p class="detail">${this.escapeHtml(block.detail)}</p>` : ''}</div>`;
      case 'para':
        return block.text ? `<p class="para">${this.escapeHtml(block.text).replaceAll('\n', '<br>')}</p>` : '';
      case 'table':
        return `<table><thead><tr>${block.headers.map((col) => `<th>${this.escapeHtml(col)}</th>`).join('')}</tr></thead><tbody>${block.rows.map((row) => `<tr>${row.map((cell) => `<td>${this.escapeHtml(cell).replaceAll('\n', '<br>')}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
      case 'sign':
        return `<div class="sign"><p>.............................................................</p><p>(${this.escapeHtml(block.name)})</p><p>${this.escapeHtml(block.role)}</p><p>วันที่ ${this.escapeHtml(block.date)}</p></div>`;
      default:
        return '';
    }
  }

  private readBundleComments(): BundleComment[] {
    try {
      const value = JSON.parse(sessionStorage.getItem(this.bundleCommentKey) || '[]') as BundleComment[];
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  }

  private writeBundleComments(rows: BundleComment[]): void {
    if (!rows.length) sessionStorage.removeItem(this.bundleCommentKey);
    else sessionStorage.setItem(this.bundleCommentKey, JSON.stringify(rows));
  }

  private readBundleReviewNotes(): Record<string, string> {
    try {
      const value = JSON.parse(sessionStorage.getItem(this.bundleReviewKey) || '{}') as Record<string, string>;
      return value && typeof value === 'object' ? value : {};
    } catch {
      return {};
    }
  }

  private writeBundleReviewNotes(notes: Record<string, string>): void {
    const entries = Object.entries(notes).filter(([, value]) => value.trim());
    if (!entries.length) sessionStorage.removeItem(this.bundleReviewKey);
    else sessionStorage.setItem(this.bundleReviewKey, JSON.stringify(Object.fromEntries(entries)));
  }

  /** ไฟล์ตัวอย่างจากเคสจริง (AD1022 / AD1019 / AD1042) */
  protected readonly agencyLetterSamples = [
    { name: 'หนังสือขอข้อมูล-4-หน่วยงาน.pdf', title: 'หนังสือขอข้อมูลผู้ผลิตจาก 4 หน่วยงาน', href: 'assets/samples/agency/หนังสือขอข้อมูล-4-หน่วยงาน.pdf' },
    { name: 'ใบปะหน้า-ขอข้อมูลผู้ผลิต-4-หน่วยงาน.docx', title: 'ใบปะหน้าหนังสือขอข้อมูลผู้ผลิต 4 หน่วยงาน', href: 'assets/samples/agency/ใบปะหน้า-ขอข้อมูลผู้ผลิต-4-หน่วยงาน.docx' },
  ];

  /** สิ่งที่ส่งมาด้วย 1–3 ของหนังสือขอข้อมูลหน่วยงาน — แบบฟอร์มว่างให้ดาวน์โหลด */
  protected readonly agencyLetterEnclosures = [
    {
      no: 1,
      title: 'แบบแสดงรายชื่อผู้ผลิต พร้อมสถานที่ตั้งโรงงาน',
      name: '1-แบบแสดงรายชื่อผู้ผลิต-พร้อมสถานที่ตั้ง.xlsx',
      href: 'assets/samples/agency/enclosures/1-แบบแสดงรายชื่อผู้ผลิต-พร้อมสถานที่ตั้ง.xlsx',
    },
    {
      no: 2,
      title: 'แบบแสดงกำลังการผลิตและปริมาณการผลิต ปี 2560–2561 และไตรมาส 1 ปี 2562',
      name: '2-แบบแสดงกำลังการผลิตและปริมาณการผลิต.xlsx',
      href: 'assets/samples/agency/enclosures/2-แบบแสดงกำลังการผลิตและปริมาณการผลิต.xlsx',
    },
    {
      no: 3,
      title: 'แบบแสดงปริมาณความต้องการใช้ภายในประเทศในช่วงเวลาเดียวกัน',
      name: '3-แบบแสดงปริมาณความต้องการใช้ภายในประเทศ.xlsx',
      href: 'assets/samples/agency/enclosures/3-แบบแสดงปริมาณความต้องการใช้ภายในประเทศ.xlsx',
    },
  ];

  protected downloadAgencyEnclosure(file: { name: string; href: string }): void {
    const link = document.createElement('a');
    link.href = file.href;
    link.download = file.name;
    link.click();
  }

  protected get agencyLetterDoc(): boolean {
    return this.workDocs[this.docPart]?.title === 'หนังสือขอข้อมูลหน่วยงานที่เกี่ยวข้อง';
  }

  protected readonly agencySummarySamples = [
    { name: 'สรุปข้อมูลจากหน่วยงานที่เกี่ยวข้อง-R6201.xlsx', title: 'สรุปข้อมูลจากหน่วยงานที่เกี่ยวข้อง (R6201)', href: 'assets/samples/agency/replies/สรุปข้อมูลจากหน่วยงานที่เกี่ยวข้อง-R6201.xlsx' },
    { name: 'สรุปข้อมูลจากหน่วยงานที่เกี่ยวข้อง.xlsx', title: 'สรุปข้อมูลจากหน่วยงานที่เกี่ยวข้อง', href: 'assets/samples/agency/สรุปข้อมูลจากหน่วยงานที่เกี่ยวข้อง.xlsx' },
    { name: 'รายชื่อผู้ผลิตจากหน่วยงาน.xlsx', title: 'รายชื่อและที่อยู่ผู้ผลิตจากหน่วยงาน', href: 'assets/samples/agency/รายชื่อผู้ผลิตจากหน่วยงาน.xlsx' },
    { name: 'สรุปความเห็นจากหน่วยงาน.docx', title: 'สรุปความเห็นจากหน่วยงานที่เกี่ยวข้อง', href: 'assets/samples/agency/สรุปความเห็นจากหน่วยงาน.docx' },
  ];

  /** ไฟล์ที่หน่วยงานส่งกลับ — แนบกับหัวข้อสรุปข้อมูล */
  protected readonly agencySummaryReplies = [
    {
      name: 'กรมโรงงาน-รายชื่อโรงงานประเภท59-เหล็กแผ่น.xlsx',
      title: 'กรมโรงงานอุตสาหกรรม — รายชื่อโรงงานประเภท 59 เหล็กแผ่น (ไฟล์จริง)',
      href: 'assets/samples/agency/replies/กรมโรงงาน-รายชื่อโรงงานประเภท59-เหล็กแผ่น.xlsx',
      sentOn: '24/05/2562',
    },
    {
      name: 'กรมโรงงาน-แบบแสดงรายชื่อและกำลังการผลิต-ส่งกลับ.xlsx',
      title: 'กรมโรงงานอุตสาหกรรม — แบบแสดงรายชื่อและกำลังการผลิต (ส่งกลับ)',
      href: 'assets/samples/agency/replies/กรมโรงงาน-แบบแสดงรายชื่อและกำลังการผลิต-ส่งกลับ.xlsx',
      sentOn: '24/05/2562',
    },
    {
      name: 'สถาบันเหล็ก-ข้อมูลผู้ผลิตและอุปสงค์-ส่งกลับ.xlsx',
      title: 'สถาบันเหล็กและเหล็กกล้าแห่งประเทศไทย — ผู้ผลิตและอุปสงค์ (ส่งกลับ)',
      href: 'assets/samples/agency/replies/สถาบันเหล็ก-ข้อมูลผู้ผลิตและอุปสงค์-ส่งกลับ.xlsx',
      sentOn: '25/05/2562',
    },
    {
      name: 'สภาอุตสาหกรรม-รายชื่อผู้ผลิตและอุปสงค์-ส่งกลับ.xlsx',
      title: 'สภาอุตสาหกรรมแห่งประเทศไทย — รายชื่อผู้ผลิตและอุปสงค์ (ส่งกลับ)',
      href: 'assets/samples/agency/replies/สภาอุตสาหกรรม-รายชื่อผู้ผลิตและอุปสงค์-ส่งกลับ.xlsx',
      sentOn: '27/05/2562',
    },
    {
      name: 'สำนักงานเศรษฐกิจอุตสาหกรรม-กำลังผลิตและอุปสงค์-ส่งกลับ.xlsx',
      title: 'สำนักงานเศรษฐกิจอุตสาหกรรม — กำลังผลิตและอุปสงค์ (ส่งกลับ)',
      href: 'assets/samples/agency/replies/สำนักงานเศรษฐกิจอุตสาหกรรม-กำลังผลิตและอุปสงค์-ส่งกลับ.xlsx',
      sentOn: '28/05/2562',
    },
    {
      name: 'สรุปข้อมูลจากหน่วยงานที่เกี่ยวข้อง-R6201.xlsx',
      title: 'สรุปรวมจากหน่วยงานที่เกี่ยวข้อง — R6201',
      href: 'assets/samples/agency/replies/สรุปข้อมูลจากหน่วยงานที่เกี่ยวข้อง-R6201.xlsx',
      sentOn: '28/05/2562',
    },
  ];

  protected get agencySummaryDoc(): boolean {
    return this.workDocs[this.docPart]?.title === 'สรุปข้อมูลจากหน่วยงานที่เกี่ยวข้อง';
  }

  private seedAgencySummaryReplies(): boolean {
    const kind = 'สรุปข้อมูลจากหน่วยงานที่เกี่ยวข้อง';
    const existing = new Set(this.extrasOf(kind).map((file) => file.name));
    const add = this.agencySummaryReplies
      .filter((file) => !existing.has(file.name))
      .map((file) => ({ kind, name: file.name, title: file.title, sentOn: file.sentOn }));
    if (!add.length) return false;
    this.extraFiles = [...this.extraFiles, ...add];
    this.writeExtraFiles();
    return true;
  }

  protected readonly preSamples = [
    { name: 'แบบสอบถามเบื้องต้น.docx', title: 'แบบสอบถามเบื้องต้น', href: 'assets/samples/pre-qn/แบบสอบถามเบื้องต้น.docx' },
    { name: 'หนังสือขอความร่วมมือตอบแบบสอบถามเบื้องต้น.docx', title: 'หนังสือขอความร่วมมือตอบแบบสอบถามเบื้องต้น', href: 'assets/samples/pre-qn/หนังสือขอความร่วมมือตอบแบบสอบถามเบื้องต้น.docx' },
    { name: 'หนังสือส่งแบบสอบถามเบื้องต้น.pdf', title: 'หนังสือส่งแบบสอบถามเบื้องต้น', href: 'assets/samples/pre-qn/หนังสือส่งแบบสอบถามเบื้องต้น.pdf' },
    { name: 'แบบสอบถามเบื้องต้น-17.01.66.docx', title: 'แบบสอบถามเบื้องต้นถึงผู้ผลิตในประเทศ', href: 'assets/samples/pre-qn/แบบสอบถามเบื้องต้น-17.01.66.docx' },
    { name: 'Pre-Qn_Exporter.docx', title: 'Pre-questionnaire ผู้ส่งออก', href: 'assets/samples/pre-qn/Pre-Qn_Exporter.docx' },
    { name: 'Appendix_Pre-Qn_Exporter.xlsx', title: 'ภาคผนวก Pre-questionnaire', href: 'assets/samples/pre-qn/Appendix_Pre-Qn_Exporter.xlsx' },
    { name: 'Pre-QN-Summary.xlsx', title: 'สรุปการเก็บข้อมูล Pre-questionnaire', href: 'assets/samples/pre-qn/Pre-QN-Summary.xlsx' },
  ];

  protected get preQuestionnaire(): boolean {
    return this.workDocs[this.docPart]?.title === 'Pre-questionnaire กลุ่มที่เกี่ยวข้อง';
  }

  /** คำขอมีข้อ 1.2 — แบบสอบถามจะถามละเอียดกว่า (ตามประชุม 19/11) */
  protected get hasApplicantSection12(): boolean {
    return toc.some((group) => group.items.some((item) => item.anchor === 'part-1-2' || item.label.includes('1.2')));
  }

  /** ช่วงเวลาในแบบสอบถามต้องสอดคล้องกับช่วงในแบบคำขอ */
  protected get filingPeriodLabel(): string {
    return 'ปี 2560–2561 และไตรมาส 1 ปี 2562';
  }

  protected get preQnPipeLabel(): string {
    if (this.preQnPipe === 'head') return 'รอหัวหน้ากลุ่ม';
    if (this.preQnPipe === 'director') return 'รอ ผอ.';
    if (this.preQnPipe === 'sent') return 'ส่งแบบแล้ว';
    return 'ร่าง';
  }

  protected get preQnPipeTone(): 'success' | 'info' | 'warning' | 'neutral' {
    if (this.preQnPipe === 'sent') return 'success';
    if (this.preQnPipe === 'draft') return 'neutral';
    return 'warning';
  }

  protected get canSendPreQnUp(): boolean {
    return this.preQuestionnaire && this.preQnPipe !== 'sent' && this.agencyProducerSelected.length > 0;
  }

  /** ส่ง Pre-questionnaire ขึ้นสายอนุมัติ: ร่าง → หัวหน้ากลุ่ม → ผอ. → ส่งออก */
  protected sendPreQnForApproval(): void {
    if (!this.canSendPreQnUp) return;
    if (this.preQnPipe === 'draft') this.preQnPipe = 'head';
    else if (this.preQnPipe === 'head') this.preQnPipe = 'director';
    else if (this.preQnPipe === 'director') this.preQnPipe = 'sent';
    this.notice = 'saved';
  }

  /** ตารางเทียบผู้ผลิตข้ามหน่วยงาน (ตามประชุม — ไม่สรุปข้อความอย่างเดียว) */
  protected readonly agencyCompareRows: {
    id: string;
    name: string;
    diw: string;
    iron: string;
    fti: string;
    oie: string;
    capacity: string;
  }[] = [
    {
      id: 'ssi',
      name: 'บมจ. สหวิริยาสตีลอินดัสตรี',
      diw: '1,800,000',
      iron: '1,800,000',
      fti: '1,800,000',
      oie: '1,750,000',
      capacity: '1,800,000',
    },
    {
      id: 'gsteel',
      name: 'บมจ. จี สตีล',
      diw: '1,800,000',
      iron: '1,780,000',
      fti: '1,800,000',
      oie: '1,800,000',
      capacity: '1,800,000',
    },
    {
      id: 'gj',
      name: 'บมจ. จี เจ สตีล',
      diw: '1,500,000',
      iron: '1,500,000',
      fti: '1,480,000',
      oie: '1,500,000',
      capacity: '1,500,000',
    },
    {
      id: 'sahamit',
      name: 'บจ. สหมิตรเหล็กและเหล็กกล้า',
      diw: '120,000',
      iron: '110,000',
      fti: '120,000',
      oie: '—',
      capacity: '120,000',
    },
  ];

  protected toggleAgencyProducer(id: string): void {
    this.agencyProducerPick = { ...this.agencyProducerPick, [id]: !this.agencyProducerPick[id] };
  }

  protected get agencyProducerSelected(): typeof this.agencyCompareRows {
    return this.agencyCompareRows.filter((row) => this.agencyProducerPick[row.id]);
  }

  protected get agencyProducerPickCount(): number {
    return this.agencyProducerSelected.length;
  }

  /** นำรายชื่อที่ติ๊กไปเติมกลุ่มผู้รับใน Pre-questionnaire */
  protected applyProducersToPreQn(): void {
    const picked = this.agencyProducerSelected;
    if (!picked.length) return;
    const names = picked.map((row) => row.name).join(', ');
    const period = this.filingPeriodLabel;
    const detail = this.hasApplicantSection12
      ? `สอบถามละเอียด (มีข้อ 1.2 ในแบบคำขอ) · ช่วงเวลา ${period} · ผู้รับ ${picked.length} ราย: ${names}`
      : `สอบถามแบบมาตรฐาน (ไม่มีข้อ 1.2) · ช่วงเวลา ${period} · ผู้รับ ${picked.length} ราย: ${names}`;
    this.workDocs = this.workDocs.map((doc) => {
      if (doc.title !== 'Pre-questionnaire กลุ่มที่เกี่ยวข้อง') return doc;
      return {
        ...doc,
        fields: doc.fields.map((row) => {
          if (row.label === 'กลุ่มผู้รับแบบ') return { ...row, value: `${names}\n(${detail})` };
          if (row.label === 'กำหนดส่งคำตอบ') return row;
          if (row.label.includes('กำลังการผลิต') || row.label.includes('ส่วนที่ 2')) {
            return { ...row, value: `กรอกกำลังการผลิตและปริมาณการผลิต ${period} ตามแบบที่กำหนด` };
          }
          return row;
        }),
      };
    });
    writeWorkDrafts(this.workDocs);
    const preIndex = this.workDocs.findIndex((doc) => doc.title === 'Pre-questionnaire กลุ่มที่เกี่ยวข้อง');
    if (preIndex >= 0) this.pickDoc(preIndex);
    this.notice = 'saved';
  }

  /** คำอธิบายตาม Flow หลังตรวจพบประเด็น */
  protected agencyFlowHint(title: string): string {
    if (title === 'หนังสือขอข้อมูลหน่วยงานที่เกี่ยวข้อง') {
      return 'ตาม Flow — จัดทำหนังสือขอข้อมูลหน่วยงานที่เกี่ยวข้อง หลังตรวจ Required / Related / Recheck แล้วพบประเด็น เจ้าหน้าที่ตรวจสอบความถูกต้องก่อนส่ง';
    }
    if (title === 'สรุปข้อมูลจากหน่วยงานที่เกี่ยวข้อง') {
      return 'ตามประชุม — เทียบข้อมูลรายผู้ผลิตข้ามหน่วยงานเป็นตาราง ติ๊กเลือกรายที่จะส่ง Pre-questionnaire แล้วค่อยสรุป';
    }
    if (title === 'Pre-questionnaire กลุ่มที่เกี่ยวข้อง') {
      const mode = this.hasApplicantSection12 ? 'แบบละเอียด (มีข้อ 1.2)' : 'แบบมาตรฐาน';
      return `ตามประชุม — ${mode} · ช่วงเวลาต้องตรงกับแบบคำขอ (${this.filingPeriodLabel}) · ส่งอนุมัติหัวหน้ากลุ่ม → ผอ. ก่อนส่งออก`;
    }
    return 'เอกสารที่สร้างในระบบตามขั้นตอนยื่นคำขอและตรวจสอบ';
  }

  /** สร้างแบบฟอร์มจริงทั้ง 3 หัวข้อตาม Flow (ไม่ใช่แค่ไฟล์แนบ) */
  protected seedAllAgencySamples(): void {
    this.ensureAiAgencyForms();
  }

  /** เมื่อเปิดหัวข้อหน่วยงาน — ให้มีแบบฟอร์ม AI พร้อมตรวจ */
  protected ensureAgencyDocForms(title = this.workDocs[this.docPart]?.title || ''): void {
    if (!title || !this.agencyDoc(title)) return;
    this.ensureAiAgencyForms(title);
  }

  private ensureAiAgencyForms(only?: string): void {
    const targets = only
      ? this.workDocs.filter((doc) => doc.title === only)
      : this.workDocs.filter((doc) => this.agencyDoc(doc.title));
    let changed = false;
    let extrasChanged = false;
    for (const doc of targets) {
      if (doc.title === 'สรุปข้อมูลจากหน่วยงานที่เกี่ยวข้อง') {
        // รีเฟรชแบบฟอร์ม AI เก่าที่ยังไม่มีตัวเลขสมจริง + แนบไฟล์ที่หน่วยงานส่งกลับ
        const stale = this.madeOf(doc.title).some(
          (item) =>
            String(item.id).startsWith('ai-') &&
            !`${this.madeField(item, 'รายชื่อผู้ผลิตหลัก')}${this.madeField(item, 'กำลังการผลิตและปริมาณการผลิต')}`.includes('1,800,000'),
        );
        if (stale) {
          const beforeMade = this.madeDocs.length;
          this.madeDocs = this.madeDocs.filter((item) => item.kind !== doc.title || !String(item.id).startsWith('ai-'));
          if (this.madeDocs.length !== beforeMade) changed = true;
        }
        if (this.seedAgencySummaryReplies()) extrasChanged = true;
      } else {
        // เอกสารหน่วยงานอื่นใช้แบบฟอร์มในระบบ — ล้างไฟล์แนบเก่าที่ไม่ใช้แล้ว
        const before = this.extraFiles.length;
        this.extraFiles = this.extraFiles.filter((file) => file.kind !== doc.title);
        if (this.extraFiles.length !== before) extrasChanged = true;
      }
      const added = this.buildAiFormsFor(doc.title);
      if (added.length) {
        this.madeDocs = [...this.madeDocs, ...added];
        changed = true;
      }
    }
    if (changed) writeMadeDocs(this.madeDocs);
    if (extrasChanged) this.writeExtraFiles();
  }

  /** สร้างแบบฟอร์มตามหัวข้อ — เนื้อหาสมจริงจากเคส AD */
  private buildAiFormsFor(kind: string): MadeDoc[] {
    if (this.madeOf(kind).length) return [];
    const ref = this.refId || 'R6201';
    if (kind === 'หนังสือขอข้อมูลหน่วยงานที่เกี่ยวข้อง') {
      const template = defaultWorkDrafts().find((item) => item.title === kind);
      return [{
        id: `ai-letter-${Date.now()}`,
        kind,
        at: '20/05/2562',
        fields: (template?.fields || []).map((row) => ({
          ...row,
          value: row.label === 'อ้างถึง' ? `คำขอเลขที่อ้างอิง ${ref} บริษัท สหวิริยาสตีลอินดัสตรี จำกัด ลงวันที่ 15/05/2562` : row.value,
        })),
      }];
    }
    if (kind === 'สรุปข้อมูลจากหน่วยงานที่เกี่ยวข้อง') {
      const template = defaultWorkDrafts().find((item) => item.title === kind);
      const master = {
        id: `ai-summary-${Date.now()}`,
        kind,
        at: '28/05/2562',
        fields: (template?.fields || []).map((row) => ({
          ...row,
          value: row.label === 'ชื่อรายงาน' ? `สรุปข้อมูลผู้ผลิตจากหน่วยงานที่เกี่ยวข้อง — คำขอ ${ref}` : row.value,
        })),
      };
      const replies: MadeDoc[] = [
        {
          id: `ai-reply-diw-${Date.now()}`,
          kind,
          at: '24/05/2562',
          fields: [
            field('ชื่อรายงาน', 'คำตอบจากกรมโรงงานอุตสาหกรรม'),
            field('หน่วยงาน', 'กรมโรงงานอุตสาหกรรม'),
            field('เลขที่หนังสือตอบกลับ', 'อก 0307/1234 ลงวันที่ 24/05/2562'),
            field('วันที่ได้รับข้อมูล', '24/05/2562'),
            field(
              'รายชื่อผู้ผลิต',
              '1. บริษัท สหวิริยาสตีลอินดัสตรี จำกัด (มหาชน) — ประจวบคีรีขันธ์\n2. บริษัท จี สตีล จำกัด (มหาชน) — ระยอง · กำลังผลิต 1,800,000 ตัน/ปี\n3. บริษัท จี เจ สตีล จำกัด (มหาชน) — ระยอง\n4. บริษัท สหมิตรเหล็กและเหล็กกล้า จำกัด — สมุทรปราการ\n(อ้างอิงทะเบียนโรงงานประเภท 59 และแบบแสดงรายชื่อที่ส่งกลับ)',
              true,
            ),
            field(
              'กำลังการผลิตและปริมาณการผลิต',
              'SSI 1,800,000 ตัน/ปี · ผลิต 2560/2561/Q1-62 = 1,450,000 / 1,380,000 / 340,000 ตัน\nG Steel 1,800,000 ตัน/ปี · 980,000 / 920,000 / 210,000 ตัน\nGJ Steel 1,500,000 ตัน/ปี · 720,000 / 680,000 / 160,000 ตัน\nสหมิตร 120,000 ตัน/ปี · 85,000 / 78,000 / 18,000 ตัน',
              true,
            ),
            field('สรุปที่นำไปใช้', 'ใช้เป็นฐานรายชื่อหลักและยอดกำลังการผลิตในรายงานสรุปรวม — ไฟล์แนบกรมโรงงาน', true),
          ],
        },
        {
          id: `ai-reply-isi-${Date.now() + 1}`,
          kind,
          at: '25/05/2562',
          fields: [
            field('ชื่อรายงาน', 'คำตอบจากสถาบันเหล็กและเหล็กกล้าแห่งประเทศไทย'),
            field('หน่วยงาน', 'สถาบันเหล็กและเหล็กกล้าแห่งประเทศไทย'),
            field('เลขที่หนังสือตอบกลับ', 'เหล็ก 88/2562 ลงวันที่ 25/05/2562'),
            field('วันที่ได้รับข้อมูล', '25/05/2562'),
            field('รายชื่อผู้ผลิต', 'ยืนยันรายชื่อผู้ผลิต HRC 4 รายหลักสอดคล้องฐานข้อมูลสถาบัน ยอดผลิตใกล้เคียงกรมโรงงาน (ส่วนต่าง ≤ 3%)', true),
            field(
              'ปริมาณความต้องการใช้ภายในประเทศ',
              'ปี 2560: 5,200,000 ตัน\nปี 2561: 5,050,000 ตัน\nไตรมาส 1 ปี 2562: 1,180,000 ตัน',
              true,
            ),
            field('สรุปที่นำไปใช้', 'ใช้เทียบยอดผลิตกับกรมโรงงาน และเป็นหนึ่งในสามแหล่งคำนวณค่ากลางอุปสงค์', true),
          ],
        },
        {
          id: `ai-reply-fti-${Date.now() + 2}`,
          kind,
          at: '27/05/2562',
          fields: [
            field('ชื่อรายงาน', 'คำตอบจากสภาอุตสาหกรรมแห่งประเทศไทย (กลุ่มอุตสาหกรรมเหล็ก)'),
            field('หน่วยงาน', 'สภาอุตสาหกรรมแห่งประเทศไทย'),
            field('เลขที่หนังสือตอบกลับ', 'ส.อ.ท. 56/2562 ลงวันที่ 27/05/2562'),
            field('วันที่ได้รับข้อมูล', '27/05/2562'),
            field('รายชื่อผู้ผลิต', 'ยืนยัน SSI / G Steel / GJ Steel เป็นสมาชิกกลุ่มอุตสาหกรรมเหล็ก และระบุสหมิตรเป็นผู้ผลิตรอง/แปรรูป', true),
            field(
              'ปริมาณความต้องการใช้ภายในประเทศ',
              'ปี 2560: 5,350,000 ตัน\nปี 2561: 5,120,000 ตัน\nไตรมาส 1 ปี 2562: 1,210,000 ตัน\n(รวมการใช้ในอุตสาหกรรมต่อเนื่อง)',
              true,
            ),
            field('สรุปที่นำไปใช้', 'ใช้ประกอบการประเมินอุปสงค์ในประเทศและยืนยันขอบเขตผู้ผลิตหลัก', true),
          ],
        },
        {
          id: `ai-reply-oie-${Date.now() + 3}`,
          kind,
          at: '28/05/2562',
          fields: [
            field('ชื่อรายงาน', 'คำตอบจากสำนักงานเศรษฐกิจอุตสาหกรรม'),
            field('หน่วยงาน', 'สำนักงานเศรษฐกิจอุตสาหกรรม'),
            field('เลขที่หนังสือตอบกลับ', 'ศก 0704/210 ลงวันที่ 28/05/2562'),
            field('วันที่ได้รับข้อมูล', '28/05/2562'),
            field(
              'กำลังการผลิตและปริมาณการผลิต',
              'ยืนยันยอดกำลังการผลิตและปริมาณการผลิตช่วง 2560–Q1/2562 สอดคล้องกรมโรงงาน สำหรับรายชื่อหลัก 4 ราย',
              true,
            ),
            field(
              'ปริมาณความต้องการใช้ภายในประเทศ',
              'ปี 2560: 5,280,000 ตัน\nปี 2561: 5,085,000 ตัน\nไตรมาส 1 ปี 2562: 1,195,000 ตัน',
              true,
            ),
            field('สรุปที่นำไปใช้', 'ใช้เป็นแหล่งที่สามสำหรับค่ากลางอุปสงค์ และยืนยันช่องว่างอุปสงค์–การผลิตในประเทศ', true),
          ],
        },
      ];
      return [master, ...replies];
    }
    if (kind === 'Pre-questionnaire กลุ่มที่เกี่ยวข้อง') {
      const template = defaultWorkDrafts().find((item) => item.title === kind);
      const form = {
        id: `ai-preqn-${Date.now()}`,
        kind,
        at: '28/05/2562',
        fields: (template?.fields || []).map((row) => ({
          ...row,
          value: row.label === 'คำขอ' ? `${ref} สินค้าเหล็กแผ่นรีดร้อนจากเวียดนามและอียิปต์` : row.value,
        })),
      };
      const answers: MadeDoc[] = [
        {
          id: `ai-preqn-ssi-${Date.now() + 2}`,
          kind,
          at: '10/06/2562',
          fields: [
            field('ชื่อแบบ', 'คำตอบ Pre-questionnaire — บริษัท สหวิริยาสตีลอินดัสตรี จำกัด'),
            field('กลุ่มผู้รับแบบ', 'ผู้ผลิตในประเทศ / ผู้ยื่นคำขอ'),
            field('คำขอ', `${ref} สินค้าเหล็กแผ่นรีดร้อนจากเวียดนามและอียิปต์`),
            field('วันที่จัดทำ', '10/06/2562'),
            field('ส่วนที่ 1 ฐานะผู้มีส่วนได้เสีย', 'เป็นผู้ยื่นคำขอและผู้ผลิตเหล็กแผ่นรีดร้อนในประเทศ', true),
            field('ส่วนที่ 2 กำลังการผลิตและปริมาณการผลิต', 'ส่งข้อมูลกำลังการผลิตและปริมาณการผลิตปี 2560–2561 และไตรมาส 1 ปี 2562 ครบตามแบบ', true),
            field('ส่วนที่ 3 ราคา', 'แนบหลักฐานราคาช่วงปลายปี 2561 ถึงต้นปี 2562', true),
            field('ส่วนที่ 4 ความเสียหาย', 'ปริมาณนำเข้าจากเวียดนามและอียิปต์เพิ่มขึ้น ส่งผลต่อราคาและส่วนแบ่งตลาดภายใน', true),
            field('ส่วนที่ 5 ผู้ผลิตที่ร่วมยื่น', 'มีหนังสือมอบอำนาจจากผู้ผลิตร่วมยื่นครบตามรายชื่อ', true),
            field('ผู้จัดทำ', 'บริษัท สหวิริยาสตีลอินดัสตรี จำกัด'),
          ],
        },
        {
          id: `ai-preqn-gsteel-${Date.now() + 3}`,
          kind,
          at: '12/06/2562',
          fields: [
            field('ชื่อแบบ', 'คำตอบ Pre-questionnaire — บริษัท จี สตีล จำกัด (มหาชน)'),
            field('กลุ่มผู้รับแบบ', 'ผู้ผลิตในประเทศ'),
            field('คำขอ', `${ref} สินค้าเหล็กแผ่นรีดร้อนจากเวียดนามและอียิปต์`),
            field('วันที่จัดทำ', '12/06/2562'),
            field('ส่วนที่ 1 ฐานะผู้มีส่วนได้เสีย', 'เป็นผู้ผลิตในประเทศที่เกี่ยวข้องกับสินค้าในคำขอ', true),
            field('ส่วนที่ 2 กำลังการผลิตและปริมาณการผลิต', 'กรอกกำลังการผลิตและปริมาณการผลิตตามแบบสอบถามเบื้องต้น', true),
            field('ส่วนที่ 3 ราคา', 'ส่งหลักฐานราคาช่วงเวลาที่ร้องขอ', true),
            field('ส่วนที่ 4 ความเสียหาย', 'เห็นผลกระทบต่อราคาขายในประเทศในช่วงเวลาเดียวกัน', true),
            field('ส่วนที่ 5 ผู้ผลิตที่ร่วมยื่น', 'ไม่ใช่ผู้ร่วมยื่นคำขอ แต่ตอบแบบสอบถามในฐานะผู้ผลิตในประเทศ', true),
            field('ผู้จัดทำ', 'บริษัท จี สตีล จำกัด (มหาชน)'),
          ],
        },
      ];
      return [form, ...answers];
    }
    return [];
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

  protected toggleAgencyReplyPick(name: string): void {
    this.agencyReplyPick = { ...this.agencyReplyPick, [name]: !this.agencyReplyPick[name] };
  }

  protected get agencyReplyPickCount(): number {
    const kind = 'สรุปข้อมูลจากหน่วยงานที่เกี่ยวข้อง';
    const files = this.extrasOf(kind);
    const picked = files.filter((file) => this.agencyReplyPick[file.name]);
    return picked.length || files.length;
  }

  /** AI สรุปไฟล์ที่หน่วยงานส่งกลับ — เปิดเอกสารแบบ Word เหมือนหน้าแก้คำขอ */
  protected summarizeAgencyReplies(): void {
    const kind = 'สรุปข้อมูลจากหน่วยงานที่เกี่ยวข้อง';
    const all = this.extrasOf(kind);
    if (!all.length) return;
    const picked = all.filter((file) => this.agencyReplyPick[file.name]);
    const sources = (picked.length ? picked : all).map((file) => ({ title: file.title || file.name, name: file.name, sentOn: file.sentOn }));
    const html = this.buildAgencySummaryHtml(sources);
    this.agencySummaryHtml = html;
    this.writeAgencySummaryHtml(html);
    this.agencyWordOpen = true;
    const fields = [
      field('ชื่อรายงาน', `สรุปข้อมูลจากหน่วยงานที่เกี่ยวข้อง — คำขอ ${this.refId || 'R6201'}`),
      field('วันที่จัดทำ', '28/05/2562'),
      field('ผู้จัดทำ', 'กลุ่มงานมาตรการตอบโต้การทุ่มตลาด (AD)'),
      field('รายการไฟล์ที่สรุป', sources.map((file, i) => `${i + 1}. ${file.title}`).join('\n'), true),
      field('เนื้อหาเอกสาร', html, true),
      field('สรุปผลการวิเคราะห์', 'สรุปจากไฟล์ที่หน่วยงานส่งกลับ รายชื่อหลัก 4 ราย กำลังผลิตรวม 5.22 ล้านตัน/ปี และอุปสงค์ในประเทศช่วง 2560–Q1/2562', true),
    ];
    const existing = this.madeDocs.find((item) => item.kind === kind && item.fields.some((row) => row.label === 'เนื้อหาเอกสาร'));
    if (existing) {
      this.madeDocs = this.madeDocs.map((item) => item.id === existing.id ? { ...item, fields, at: '28/05/2562' } : item);
    } else {
      this.madeDocs = [...this.madeDocs, { id: `ai-summary-word-${Date.now()}`, kind, at: '28/05/2562', fields }];
    }
    writeMadeDocs(this.madeDocs);
    this.agencyReplyPick = {};
    this.notice = 'assist';
    window.setTimeout(() => this.fillAgencySummaryEditor(), 0);
  }

  protected openAgencySummaryWord(item?: MadeDoc): void {
    const html = item ? (this.madeField(item, 'เนื้อหาเอกสาร') || this.agencySummaryHtml || this.readAgencySummaryHtml()) : (this.agencySummaryHtml || this.readAgencySummaryHtml() || this.buildAgencySummaryHtml(
      this.extrasOf('สรุปข้อมูลจากหน่วยงานที่เกี่ยวข้อง').map((file) => ({ title: file.title || file.name, name: file.name, sentOn: file.sentOn })),
    ));
    if (!html.trim()) return;
    this.agencySummaryHtml = html;
    this.agencyWordOpen = true;
    window.setTimeout(() => this.fillAgencySummaryEditor(), 0);
  }

  protected viewAgencyMade(item: MadeDoc): void {
    if (this.madeField(item, 'เนื้อหาเอกสาร')) this.openAgencySummaryWord(item);
    else this.viewingMade = item;
  }

  protected editAgencyMade(item: MadeDoc): void {
    if (this.madeField(item, 'เนื้อหาเอกสาร')) this.openAgencySummaryWord(item);
    else this.openAgencyForm(item.id);
  }

  protected closeAgencySummaryWord(): void {
    this.captureAgencySummaryEditor();
    this.agencyWordOpen = false;
  }

  protected saveAgencySummaryWord(): void {
    this.captureAgencySummaryEditor();
    const kind = 'สรุปข้อมูลจากหน่วยงานที่เกี่ยวข้อง';
    const html = this.agencySummaryHtml;
    const fields = [
      field('ชื่อรายงาน', `สรุปข้อมูลจากหน่วยงานที่เกี่ยวข้อง — คำขอ ${this.refId || 'R6201'}`),
      field('วันที่จัดทำ', '28/05/2562'),
      field('ผู้จัดทำ', 'กลุ่มงานมาตรการตอบโต้การทุ่มตลาด (AD)'),
      field('เนื้อหาเอกสาร', html, true),
      field('สรุปผลการวิเคราะห์', 'บันทึกเอกสารสรุปแบบ Word จากไฟล์ที่หน่วยงานส่งกลับ', true),
    ];
    const existing = this.madeDocs.find((item) => item.kind === kind && item.fields.some((row) => row.label === 'เนื้อหาเอกสาร'));
    if (existing) {
      this.madeDocs = this.madeDocs.map((item) => item.id === existing.id ? { ...item, fields, at: '28/05/2562' } : item);
    } else {
      this.madeDocs = [...this.madeDocs, { id: `ai-summary-word-${Date.now()}`, kind, at: '28/05/2562', fields }];
    }
    writeMadeDocs(this.madeDocs);
    this.writeAgencySummaryHtml(html);
    this.notice = 'saved';
  }

  protected agencySummaryFormat(command: string, value?: string): void {
    document.execCommand('styleWithCSS', false, 'true');
    document.execCommand(command, false, value);
    this.lockOfficialFontOnSelection();
    this.captureAgencySummaryEditor();
    this.refreshAmendToolbar();
    this.agencySummaryEditorRef?.nativeElement.focus();
  }

  protected applyAgencySummaryFontSize(size: string): void {
    this.amendFontSize = size;
    document.execCommand('styleWithCSS', false, 'true');
    document.execCommand('fontSize', false, '3');
    const root = this.agencySummaryEditorRef?.nativeElement;
    root?.querySelectorAll('font[size="3"]').forEach((node) => {
      const span = document.createElement('span');
      span.style.fontSize = size;
      span.style.fontFamily = this.officialFontName;
      span.innerHTML = node.innerHTML;
      node.replaceWith(span);
    });
    this.lockOfficialFontOnSelection();
    this.captureAgencySummaryEditor();
    this.agencySummaryEditorRef?.nativeElement.focus();
  }

  protected applyAgencySummaryColor(color: string): void {
    this.amendColor = color;
    document.execCommand('styleWithCSS', false, 'true');
    document.execCommand('foreColor', false, color);
    this.lockOfficialFontOnSelection();
    this.captureAgencySummaryEditor();
    this.refreshAmendToolbar();
    this.agencySummaryEditorRef?.nativeElement.focus();
  }

  protected applyAgencySummaryHighlight(color: string): void {
    this.amendHighlight = color;
    document.execCommand('styleWithCSS', false, 'true');
    document.execCommand('hiliteColor', false, color === 'transparent' ? 'transparent' : color);
    this.lockOfficialFontOnSelection();
    this.captureAgencySummaryEditor();
    this.refreshAmendToolbar();
    this.agencySummaryEditorRef?.nativeElement.focus();
  }

  protected onAgencySummaryEditorInput(): void {
    this.captureAgencySummaryEditor();
    this.refreshAmendToolbar();
  }

  private captureAgencySummaryEditor(): void {
    const el = this.agencySummaryEditorRef?.nativeElement;
    if (!el) return;
    const empty = !el.textContent?.replace(/\u00a0/g, ' ').replace(/\u200b/g, '').trim();
    this.agencySummaryEmpty = empty;
    this.agencySummaryHtml = empty ? '' : el.innerHTML;
    this.writeAgencySummaryHtml(this.agencySummaryHtml);
  }

  private fillAgencySummaryEditor(tries = 0): void {
    const run = () => {
      const el = this.agencySummaryEditorRef?.nativeElement;
      if (!el) {
        if (tries < 8) window.setTimeout(() => this.fillAgencySummaryEditor(tries + 1), 50);
        return;
      }
      const html = this.agencySummaryHtml || this.readAgencySummaryHtml();
      el.innerHTML = html;
      this.agencySummaryEmpty = this.amendHtmlIsEmpty(html);
      this.refreshAmendToolbar();
      this.view.markForCheck();
    };
    window.setTimeout(run, tries === 0 ? 0 : 50);
  }

  protected get hasAgencySummaryWord(): boolean {
    return !!(this.agencySummaryHtml || this.readAgencySummaryHtml() || this.madeOf('สรุปข้อมูลจากหน่วยงานที่เกี่ยวข้อง').some((item) => this.madeField(item, 'เนื้อหาเอกสาร')));
  }

  private readAgencySummaryHtml(): string {
    try {
      return sessionStorage.getItem(this.agencySummaryHtmlKey) || '';
    } catch {
      return '';
    }
  }

  private writeAgencySummaryHtml(value: string): void {
    try {
      if (!value.trim()) sessionStorage.removeItem(this.agencySummaryHtmlKey);
      else sessionStorage.setItem(this.agencySummaryHtmlKey, value);
    } catch {
      /* ignore */
    }
  }

  private buildAgencySummaryHtml(sources: { title: string; name: string; sentOn: string }[]): string {
    const ref = this.refId || 'R6201';
    const list = sources.length
      ? sources.map((file) => `<li>${this.escapeHtml(file.title)} <small>(${this.escapeHtml(file.sentOn)} · ${this.escapeHtml(file.name)})</small></li>`).join('')
      : '<li>ยังไม่มีไฟล์แนบ</li>';
    const picked = this.agencyProducerSelected;
    const rows = (picked.length ? picked : this.agencyCompareRows)
      .map(
        (row) =>
          `<tr><td>${this.escapeHtml(row.name)}</td><td>${row.diw}</td><td>${row.iron}</td><td>${row.fti}</td><td>${row.oie}</td><td><strong>${row.capacity}</strong></td></tr>`,
      )
      .join('');
    const pickLine = picked.length
      ? picked.map((row) => row.name).join(' · ')
      : 'ยังไม่ได้ติ๊ก — ใช้รายชื่อหลักทั้งชุด';
    return [
      '<h3>สรุปข้อมูลจากหน่วยงานที่เกี่ยวข้อง</h3>',
      `<p><strong>คำขอ</strong> เลขที่อ้างอิง ${this.escapeHtml(ref)} · สินค้าเหล็กแผ่นรีดร้อนจากเวียดนามและสาธารณรัฐอาหรับอียิปต์</p>`,
      '<p><strong>วันที่จัดทำ</strong> 28/05/2562 · <strong>ผู้จัดทำ</strong> กลุ่มงานมาตรการตอบโต้การทุ่มตลาด (AD)</p>',
      '<p><strong>1. ไฟล์ที่หน่วยงานส่งกลับ (ที่ใช้สรุป)</strong></p>',
      `<ol>${list}</ol>`,
      '<p data-ai-suggest="1" data-ai-label="AI สรุป" title="ตารางเทียบข้ามหน่วยงานตามที่ประชุม"><strong>2. ตารางเปรียบเทียบกำลังการผลิต (ตัน/ปี)</strong></p>',
      '<table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;width:100%;font-size:13px">',
      '<thead><tr><th>ผู้ผลิต</th><th>กรมโรงงาน</th><th>สถาบันเหล็ก</th><th>ส.อ.ท.</th><th>ศก.</th><th>ใช้เป็นหลัก</th></tr></thead>',
      `<tbody>${rows}</tbody>`,
      '</table>',
      `<p><strong>รายที่เลือกส่ง Pre-questionnaire:</strong> ${this.escapeHtml(pickLine)}</p>`,
      '<p data-ai-suggest="1" data-ai-label="AI สรุป"><strong>3. กำลังการผลิตและปริมาณการผลิต</strong></p>',
      '<p>ใช้ค่าสูงสุดที่ครบถ้วนจากตารางเทียบ — กำลังการผลิตรวมรายชื่อหลัก = <strong>5,220,000 ตัน/ปี</strong></p>',
      '<ul>',
      '<li>ปี 2560: ปริมาณการผลิต 3,235,000 ตัน</li>',
      '<li>ปี 2561: ปริมาณการผลิต 3,058,000 ตัน</li>',
      '<li>ไตรมาส 1 ปี 2562: ปริมาณการผลิต 728,000 ตัน</li>',
      '</ul>',
      '<p>อัตราใช้กำลังการผลิตโดยประมาณ 45–76% ตามราย ส่วนต่างระหว่างหน่วยงานไม่เกิน 3%</p>',
      '<p data-ai-suggest="1" data-ai-label="AI สรุป"><strong>4. ปริมาณความต้องการใช้ภายในประเทศ</strong></p>',
      '<p>ค่ากลางจากสถาบันเหล็กฯ / ส.อ.ท. / ศก. · ปี 2560: 5,276,667 · ปี 2561: 5,085,000 · Q1/2562: 1,195,000 ตัน</p>',
      '<p><strong>5. จุดที่ข้อมูลยังไม่ครบ</strong></p>',
      '<ol>',
      '<li>หลักฐานราคาช่วงปลายปี 2561 ถึงต้นปี 2562 จากผู้ผลิตบางราย</li>',
      '<li>ปริมาณนำเข้าที่เชื่อมกับความเสียหายโดยตรง แยกตามแหล่งเวียดนามและอียิปต์</li>',
      '<li>รายชื่อผู้ผลิตที่ร่วมยื่นตามหนังสือมอบอำนาจให้ครบทุกฉบับ</li>',
      '</ol>',
      '<p data-ai-suggest="1" data-ai-label="AI สรุป"><strong>6. สรุปที่นำไปใช้</strong></p>',
      '<ol>',
      `<li>ส่ง Pre-questionnaire เฉพาะรายที่ติ๊ก (${picked.length || this.agencyCompareRows.length} ราย)</li>`,
      `<li>ช่วงเวลาในแบบสอบถามต้องตรงกับแบบคำขอ (${this.escapeHtml(this.filingPeriodLabel)})</li>`,
      '<li>เก็บไฟล์ตอบกลับจากหน่วยงานไว้เป็นหลักฐานประกอบสรุป</li>',
      '</ol>',
    ].join('');
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

  protected printMade(): void {
    if (!this.viewingMade) return;
    window.setTimeout(() => window.print(), 0);
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
    if (!saved) {
      if (this.reviewRole) this.ensureAmendNoticeSamples(true);
      return;
    }
    this.noticeItems = saved.items.map((item) => ({
      ...item,
      files: item.files.map((file) => ({ ...file })),
      letter: item.letter.map((field) => ({ ...field })),
      letterVersions: (item.letterVersions || []).map((row) => ({ ...row })),
      gaps: item.gaps.map((gap) => ({ ...gap })),
      history: item.history.length ? item.history.map((row) => ({ ...row })) : this.seedNoticeHistory({ ...saved, ...item, history: [] }),
      keptFiles: (item.keptFiles || []).map((file) => ({ ...file })),
    }));
    this.activeNoticeId = saved.activeId || this.noticeItems.at(-1)?.id || '';
    const active = this.noticeItems.find((item) => item.id === this.activeNoticeId) || this.noticeItems.at(-1);
    if (active) this.applyNoticeItem(active);
    else {
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
      this.docSent = saved.sent;
      this.docSentBy = saved.sentBy;
      this.noticePipe = saved.pipe || (saved.sent ? 'done' : 'draft');
      this.noticePipeAt = saved.pipeAt || '';
      this.noticeReportBy = saved.reportBy || '';
      this.noticeHeadBy = saved.headBy || '';
      this.noticeOfficeRef = saved.officeRef || '';
      this.noticeHistory = this.seedNoticeHistory(saved);
    }
    if (saved.committee) this.applyCommittee(saved.committee);
    if (saved.inquiry) this.applyInquiry(saved.inquiry);
    if (!saved.items.length && this.noticeItems.length) writeDocNotice(this.docPayload(this.docSent));
    this.noticePasses = saved.passes.map((pass) => ({ ...pass, reply: pass.reply ? { ...pass.reply, files: pass.reply.files.map((file) => ({ ...file })) } : null }));
    if (saved.reply) this.applyReply(saved.reply);
    else if (saved.action === 'complete') {
      const kept = [...saved.passes].reverse().find((pass) => pass.reply);
      if (kept?.reply) this.applyReply(kept.reply);
    }
    // บังคับ seed ใหม่เมื่อยังไม่มีฉบับร่างในรายละเอียด
    if (this.reviewRole) this.ensureAmendNoticeSamples(true);
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

  private seedCommitteePack(): void {
    if (!(this.docSent && this.docAction === 'complete') || this.committeeSent) return;
    if (!this.committeeAt || this.committeeAt === '05/06/2562') this.committeeAt = this.thaiToday();
    if (!this.committeeFee) this.committeeFee = 'pay';
    const at = this.committeeAt;
    const body = `ตามคำขอเลขที่อ้างอิง ${this.refId} ของบริษัท สหวิริยาสตีลอินดัสตรี จำกัด สินค้าเหล็กแผ่นรีดร้อนจากเวียดนามและอียิปต์`;
    let changed = false;
    for (const item of this.committeeForms) {
      if (this.committeeFormDone(item.kind)) continue;
      const meeting = /วาระ|มติ|รายงาน/.test(item.kind);
      const fields = meeting
        ? [
            field('ครั้งที่', '1/2569'),
            field('วันที่ประชุม', at),
            field('ระเบียบวาระ', `พิจารณารับคำขอเลขที่อ้างอิง ${this.refId}`, true),
            field('มติที่ประชุม', 'รับคำขอและแจ้งชำระค่าธรรมเนียม', true),
            field('รายงานการประชุม', `${body} ที่ประชุมมีมติรับคำขอ`, true),
          ]
        : [
            field('ที่', 'กพ. / กองปกป้องและตอบโต้ทางการค้า'),
            field('วันที่', at),
            field('เรื่อง', item.kind),
            field('เรียน', this.packAddressee(item.kind)),
            field('เนื้อความ', `${body} จึงแจ้งผลการรับคำขอ`, true),
            field('ลงชื่อ', this.signedPerson || 'นางสาวจรีณา กิจส่งเสริมกุล'),
          ];
      this.madeDocs = [...this.madeDocs, { id: `committee-seed-${this.madeDocs.length}`, kind: item.kind, at, fields }];
      changed = true;
    }
    if (changed) writeMadeDocs(this.madeDocs);
  }

  private inquiryCaseBody(kind: string): string {
    if (this.sampleCase) {
      const item = this.sampleCase;
      const base = `ตามคำขอเลขที่อ้างอิง ${item.ref} ของ${item.applicant || 'ผู้ยื่นคำขอ'} ยื่นเมื่อ ${item.created} เรื่อง${item.kind} สินค้า${item.goods}`;
      if (kind.includes('อังกฤษ')) return `${item.ref} ${item.goods}. Filed on ${item.created}.`;
      return `${base}\nจึงจัดทำ${kind}`;
    }
    const base = `ตามคำขอเลขที่อ้างอิง ${this.refId} ของบริษัท สหวิริยาสตีลอินดัสตรี จำกัด ยื่นเมื่อ 15/05/2563 และครบถ้วนถูกต้องเมื่อ 28/07/2563 ซึ่งอยู่ภายในกำหนด 4 เดือนที่ครบวันที่ 15/09/2563 ขอให้ไต่สวนการทุ่มตลาดเหล็กแผ่นรีดร้อนชนิดเป็นม้วนและไม่เป็นม้วน ที่มีแหล่งกำเนิดจากเวียดนามและอียิปต์ ผู้ยื่นและผู้ผลิตที่สนับสนุนมีปริมาณการผลิตรวมมากกว่าร้อยละ 25 ของสินค้าชนิดเดียวกันในประเทศ และมีหลักฐานเบื้องต้นเรื่องส่วนเหลื่อมการทุ่มตลาดและความเสียหายเพียงพอให้พิจารณาเปิดไต่สวน`;
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
    if (kind.includes('เอกสารแนบ')) return `${base}\nเอกสารแนบวาระ\n1. คำขอฉบับสมบูรณ์ ฉบับเปิดเผยและฉบับปกปิด\n2. ผลการตรวจสอบความครบถ้วนวันที่ 28/07/2563\n3. ผลการตรวจสอบสถานะอุตสาหกรรมภายใน\n4. หลักฐานเบื้องต้นเรื่องการทุ่มตลาดและความเสียหาย`;
    if (kind.includes('เรียกเก็บอากร')) return `${base}\nจึงจัดทำประกาศเรียกเก็บหลักประกันอากรต่อไปตามมติคณะกรรมการพิจารณาการทุ่มตลาดและการอุดหนุน อัตราเป็นไปตามมติที่ประชุม`;
    if (kind.includes('อังกฤษ')) return 'The Department of Foreign Trade has opened an anti-dumping investigation on hot-rolled steel in coils and not in coils originating in Vietnam and Egypt. Application R6201 was filed on 15 May 2019 and found complete on 28 May 2019.';
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
      'วันที่ยื่นคำขอ 15/05/2563 วันที่คำขอครบถ้วน 28/07/2563 วันครบกำหนด 4 เดือน 15/09/2563',
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
    { label: 'วันที่ยื่นคำขอ', value: '15/05/2563' },
    { label: 'วันที่ครบถ้วน', value: '28/07/2563' },
    { label: 'ครบกำหนด 4 เดือน', value: '15/09/2562' },
    { label: 'ข้อกฎหมาย', value: 'พระราชบัญญัติการตอบโต้การทุ่มตลาดและการอุดหนุนซึ่งสินค้าจากต่างประเทศ พ.ศ. 2542 มาตรา 39', wide: true },
  ];

  protected inquiryFormsOf(step: string): { group: string; kind: string }[] {
    return inquiryPack.filter((item) => item.step === step);
  }

  protected get inquiryDocStep(): boolean {
    return this.inquiryPart === 'draftAgenda' || this.inquiryPart === 'subAgenda' || this.inquiryPart === 'agenda'
      || this.inquiryPart === 'notice' || this.inquiryPart === 'sign' || this.inquiryPart === 'letters' || this.inquiryPart === 'news';
  }

  protected get inquiryAgendaLane(): AgendaLane | null {
    if (this.inquiryPart === 'draftAgenda') return 'draft';
    if (this.inquiryPart === 'subAgenda') return 'sub';
    if (this.inquiryPart === 'agenda') return 'tdc';
    return null;
  }

  protected agendaLaneFiles(lane: AgendaLane): InquiryAgendaFile[] {
    return this.inquiryAgendaFiles.filter((file) => (file.lane || 'tdc') === lane);
  }

  protected inquiryStepTitle(): string {
    return this.inquiryNav.find((step) => step.id === this.inquiryPart)?.label ?? 'แบบฟอร์มเปิดไต่สวน';
  }

  protected inquiryStepHint(): string {
    if (this.inquiryPart === 'draftAgenda') return 'วาระพิจารณาคำขอเปิดไต่สวนและตารางประกอบก่อนเสนออนุ';
    if (this.inquiryPart === 'subAgenda') return 'บันทึก · วาระ · PPT · มติ · รายงานอนุไต่สวน';
    if (this.inquiryPart === 'agenda') return 'บันทึก · วาระ · Chairman’s Note · PPT · มติ · รายงาน ทตอ.';
    if (this.inquiryPart === 'notice') return 'ร่างประกาศกรมและส่งกองกฎหมายตรวจร่าง';
    if (this.inquiryPart === 'sign') return 'ลงนามและส่งราชกิจจานุเบกษา';
    if (this.inquiryPart === 'letters') return 'หนังสือแจ้งผู้เกี่ยวข้อง';
    return 'ข่าวหลังประกาศเปิดไต่สวน';
  }

  protected inquiryAgendaDateLabel(): string {
    if (this.inquiryPart === 'draftAgenda') return 'วันที่ร่าง';
    if (this.inquiryPart === 'subAgenda') return 'วันที่ประชุมอนุ';
    return 'วันที่ประชุม ทตอ.';
  }

  protected get inquiryAgendaDateValue(): string {
    if (this.inquiryPart === 'draftAgenda') return this.inquiryDraftAgendaAt;
    if (this.inquiryPart === 'subAgenda') return this.inquirySubAgendaAt;
    return this.inquiryAgendaAt;
  }

  protected setInquiryAgendaDate(value: string): void {
    if (this.inquiryPart === 'draftAgenda') this.inquiryDraftAgendaAt = value;
    else if (this.inquiryPart === 'subAgenda') this.inquirySubAgendaAt = value;
    else this.inquiryAgendaAt = value;
  }

  protected get inquiryAgendaStepDone(): boolean {
    if (this.inquiryPart === 'draftAgenda') return this.inquiryDraftAgendaDone;
    if (this.inquiryPart === 'subAgenda') return this.inquirySubAgendaDone;
    return this.inquiryAgendaDone;
  }

  private readonly agendaSampleCatalog: Record<AgendaLane, InquiryAgendaFile[]> = {
    draft: [
      { name: 'วาระเปิด-ก่อนปรับปรุง.docx', title: 'วาระพิจารณาคำขอเปิดไต่สวน (ก่อนปรับปรุง)', sentOn: '02/10/2563', docId: '', href: 'assets/samples/ad1046/agenda/draft/วาระเปิด-ก่อนปรับปรุง.docx', lane: 'draft', source: 'sample' },
      { name: '2. วาระพิจารณาคำขอเปิดไต่สวน-ร่าง.doc', title: 'วาระพิจารณาคำขอเปิดไต่สวน', sentOn: '02/10/2563', docId: '', href: 'assets/samples/ad1046/agenda/draft/2. วาระพิจารณาคำขอเปิดไต่สวน-ร่าง.doc', lane: 'draft', source: 'sample' },
      { name: 'ปริมาณนำเข้า PJ.xlsx', title: 'ตารางปริมาณนำเข้า', sentOn: '02/10/2563', docId: '', href: 'assets/samples/ad1046/agenda/tables/ปริมาณนำเข้า PJ.xlsx', lane: 'draft', source: 'sample' },
      { name: 'ตารางผลกระทบ Sup3 เทียบ Sup2.xlsx', title: 'ตารางผลกระทบ Sup3 เทียบ Sup2', sentOn: '02/10/2563', docId: '', href: 'assets/samples/ad1046/agenda/tables/ตารางผลกระทบ Sup3 เทียบ Sup2.xlsx', lane: 'draft', source: 'sample' },
    ],
    sub: [
      { name: '1 บันทึกเสนอ อธ เข้าอนุฯ พิจารณาคำขอ.docx', title: 'บันทึกเสนอ อธ. เข้าอนุฯ', sentOn: '03/11/2563', docId: '', href: 'assets/samples/ad1046/agenda/sub/1 บันทึกเสนอ อธ เข้าอนุฯ พิจารณาคำขอ.docx', lane: 'sub' },
      { name: '2. วาระพิจารณาคำขอเปิดไต่สวน.docx', title: 'วาระพิจารณาคำขอเปิดไต่สวน (อนุ)', sentOn: '03/11/2563', docId: '', href: 'assets/samples/ad1046/agenda/sub/2. วาระพิจารณาคำขอเปิดไต่สวน.docx', lane: 'sub' },
      { name: '3. PowerPoint อนุ ทตอ 3 พย 63.pptx', title: 'PowerPoint อนุไต่สวน', sentOn: '03/11/2563', docId: '', href: 'assets/samples/ad1046/agenda/sub/3. PowerPoint อนุ ทตอ 3 พย 63.pptx', lane: 'sub' },
      { name: '4. มติคณะอนุฯ ไต่สวน HR 3 พย 63.docx', title: 'มติคณะอนุฯ ไต่สวน', sentOn: '03/11/2563', docId: '', href: 'assets/samples/ad1046/agenda/sub/4. มติคณะอนุฯ ไต่สวน HR 3 พย 63.docx', lane: 'sub' },
      { name: '5. รายงานการประชุม HR 3 พย 63.docx', title: 'รายงานการประชุมอนุ', sentOn: '03/11/2563', docId: '', href: 'assets/samples/ad1046/agenda/sub/5. รายงานการประชุม HR 3 พย 63.docx', lane: 'sub' },
      { name: 'ข้อพิจารณา (ตัวเลือก).docx', title: 'ข้อพิจารณา (ตัวเลือก)', sentOn: '03/11/2563', docId: '', href: 'assets/samples/ad1046/agenda/sub/ข้อพิจารณา (ตัวเลือก).docx', lane: 'sub' },
    ],
    tdc: [
      { name: '1 บันทึกเสนอวาระ ทตอ เปิดไต่สวน HR 9 พย 63.docx', title: 'บันทึกเสนอวาระ ทตอ.', sentOn: '09/11/2563', docId: '', href: 'assets/samples/ad1046/agenda/tdc/1 บันทึกเสนอวาระ ทตอ เปิดไต่สวน HR 9 พย 63.docx', lane: 'tdc' },
      { name: '2. วาระพิจารณาคำขอเปิดไต่สวน ทตอ.docx', title: 'วาระพิจารณาคำขอเปิดไต่สวน (ทตอ.)', sentOn: '09/11/2563', docId: '', href: 'assets/samples/ad1046/agenda/tdc/2. วาระพิจารณาคำขอเปิดไต่สวน ทตอ.docx', lane: 'tdc' },
      { name: '3. Chairman ทตอ HR 9 พย 63.docx', title: 'Chairman’s Note', sentOn: '09/11/2563', docId: '', href: 'assets/samples/ad1046/agenda/tdc/3. Chairman ทตอ HR 9 พย 63.docx', lane: 'tdc' },
      { name: '4. ทตอ PowerPoint ฉบับจริง.pptx', title: 'PowerPoint ทตอ.', sentOn: '09/11/2563', docId: '', href: 'assets/samples/ad1046/agenda/tdc/4. ทตอ PowerPoint ฉบับจริง.pptx', lane: 'tdc' },
      { name: '5. มติคณะกรรมการ ทตอ.docx', title: 'มติคณะกรรมการ ทตอ.', sentOn: '09/11/2563', docId: '', href: 'assets/samples/ad1046/agenda/tdc/5. มติคณะกรรมการ ทตอ.docx', lane: 'tdc' },
    ],
  };

  private ensureAgendaSampleFiles(lane: AgendaLane): void {
    const samples = this.agendaSampleCatalog[lane];
    const have = new Set(this.inquiryAgendaFiles.filter((file) => (file.lane || 'tdc') === lane).map((file) => file.name));
    const missing = samples.filter((file) => !have.has(file.name));
    if (!missing.length) return;
    this.inquiryAgendaFiles = [...this.inquiryAgendaFiles, ...missing.map((file) => ({ ...file }))];
    this.writeInquiry(lane === 'draft' || this.draftAgendaNavOn);
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
    const lane = this.inquiryAgendaLane;
    const at = lane
      ? this.inquiryAgendaDateValue
      : this.inquiryPart === 'hearing' || this.inquiryPart === 'visit'
        ? (this.inquiryAgendaAt || '09/11/2563')
        : (this.inquiryNoticeOn || '25/06/2562');
    rows.forEach((row, index) => {
      if (this.committeeFormDone(row.kind)) return;
      const fields = this.inquiryDraft(row.kind);
      if (!fields) return;
      this.madeDocs = [...this.madeDocs, { id: `inquiry-${Date.now()}-${index}`, kind: row.kind, at, fields }];
    });
    writeMadeDocs(this.madeDocs);
    if (lane) {
      if (lane !== 'draft') this.ensureAgendaSampleFiles(lane);
      this.inquiryFields = agendaFieldList();
    }
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
    this.pushLink('เว็บไซต์กอง', 'เผยแพร่ผลบนเว็บไซต์กอง', `เผยแพร่ผลคดี ${code} บนเว็บไซต์กองแล้ว`, code, at);
    this.keepNote('published', at);
    this.closeFinal();
  }

  protected draftHearingTranscript(): void {
    this.hearingMemo = 'ร่างสรุปจากการถอดเสียง ยังต้องให้เจ้าหน้าที่ตรวจก่อนนำไปใช้ ประเด็นที่ได้ยินคือคำขอเข้าฟังความคิดเห็น วันนัด และรายชื่อผู้ขอเข้าร่วม';
  }

  protected draftAgencyLetter(): void {
    const kind = this.workDocs[this.docPart]?.title || 'หนังสือขอข้อมูลหน่วยงานที่เกี่ยวข้อง';
    const at = kind === 'หนังสือขอข้อมูลหน่วยงานที่เกี่ยวข้อง' ? '20/05/2562' : '28/05/2562';
    const template = defaultWorkDrafts().find((item) => item.title === kind);
    const fields = template
      ? template.fields.map((row) => ({ ...row }))
      : [
          { label: 'เรียน', value: 'หน่วยงานที่เกี่ยวข้อง' },
          { label: 'เรื่อง', value: 'ขอข้อมูลเพื่อประกอบการไต่สวน' },
          { label: 'เนื้อความ', value: `ด้วยกรมการค้าต่างประเทศอยู่ระหว่างพิจารณาคำขอเลขที่อ้างอิง ${this.refId} จึงขอความอนุเคราะห์ข้อมูลที่เกี่ยวข้องกับสินค้าในคำขอ เพื่อใช้ประกอบการพิจารณา`, long: true },
        ];
    this.madeDocs = [
      ...this.madeDocs,
      {
        id: `agency-letter-${Date.now()}`,
        kind,
        at,
        fields,
      },
    ];
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

  protected openEmbassyFile(file: { name: string; title: string; sentOn: string; docId: string; href?: string }): void {
    if (file.href) {
      window.open(file.href, '_blank', 'noopener');
      return;
    }
    const made = this.madeDocs.find((item) => item.id === file.docId);
    this.viewingMade = made ?? { id: file.name, kind: file.title, at: file.sentOn, fields: [{ label: 'ไฟล์แนบ', value: file.name }, { label: 'ชื่อเอกสาร', value: file.title }] };
  }

  protected downloadEmbassyFile(file: { name: string; title: string; sentOn: string; docId: string; href?: string }): void {
    if (file.href) {
      const link = document.createElement('a');
      link.href = file.href;
      link.download = file.name;
      link.target = '_blank';
      link.rel = 'noopener';
      link.click();
      return;
    }
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
    this.inquiryDraftAgendaDone = record.draftAgendaDone;
    this.inquirySubAgendaDone = record.subAgendaDone;
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
      draftAgendaDone: this.inquiryDraftAgendaDone,
      subAgendaDone: this.inquirySubAgendaDone,
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

  private writeInquiry(silent = false): void {
    this.inquirySentBy = this.signedPerson || this.directorName;
    writeDocNotice(this.docPayload(this.docSent));
    // หน้าวาระพิจารณาคำขอเปิดไต่สวน — ไม่ขึ้น modal สำเร็จ
    if (!silent && !this.draftAgendaNavOn) this.notice = 'saved';
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

  private backfillPrepDocs(): void {
    const prep = this.openPrep;
    const rows: [boolean, string][] = [
      [prep.ask, 'หนังสือขอข้อมูลเพิ่มเติมก่อนเปิดไต่สวน'],
      [prep.analyze, 'บันทึกรวบรวมและวิเคราะห์ก่อนเปิดไต่สวน'],
      [prep.summary, 'บันทึกรวบรวมและสรุปก่อนเปิดไต่สวน'],
      [prep.report, 'รายงานก่อนเปิดไต่สวน'],
      [prep.pulled, 'รายงานที่ดึงกลับเข้าระบบก่อนเปิดไต่สวน'],
      [prep.revised, 'ร่างที่ตรวจแก้ก่อนเปิดไต่สวน'],
      [!!prep.aiSummary, 'AI สรุปคำขอ'],
      [!!prep.aiDraft, 'AI ร่างเอกสาร'],
      [!!prep.aiReview, 'AI พิจารณาให้เจ้าหน้าที่'],
      [prep.sent, 'สรุปส่งข้อมูลก่อนเปิดไต่สวน'],
      [prep.approved, 'อนุมัติสรุปก่อนเปิดไต่สวน'],
    ];
    let changed = false;
    for (const [done, kind] of rows) {
      if (!done || this.madeOf(kind).length) continue;
      const text = kind === 'AI สรุปคำขอ' ? prep.aiSummary : kind === 'AI ร่างเอกสาร' ? prep.aiDraft : kind === 'AI พิจารณาให้เจ้าหน้าที่' ? prep.aiReview : `คำขอเลขที่อ้างอิง ${this.refId} สินค้าเหล็กแผ่นรีดร้อนจากเวียดนามและอียิปต์ ${kind}`;
      this.madeDocs = [...this.madeDocs, {
        id: `prep-${kind}`,
        kind,
        at: this.thaiToday(),
        fields: [
          field('ที่', this.filingSaraban),
          field('วันที่', this.thaiToday()),
          field('เรื่อง', kind),
          field('เนื้อความ', text, true),
          field('ลงชื่อ', this.signedPerson || 'นางสาวจรีณา กิจส่งเสริมกุล'),
        ],
      }];
      changed = true;
    }
    if (changed) writeMadeDocs(this.madeDocs);
  }

  private placeInquiry(): void {
    this.backfillPrepDocs();
    const prep = this.openPrep;
    if (!prep.approved) this.inquiryPart = 'prepare';
    else if (this.inquiryDecide === 'return' && !this.inquiryReturned) this.inquiryPart = 'letter';
    else if (!this.inquiryDraftAgendaDone) this.inquiryPart = 'draftAgenda';
    else if (!this.inquirySubAgendaDone) this.inquiryPart = 'subAgenda';
    else if (!this.inquiryAgendaDone) this.inquiryPart = 'agenda';
    else if (!this.inquiryDecide) this.inquiryPart = 'decide';
    else if (this.inquiryDecide === 'take' && !prep.prenotify) this.inquiryPart = 'prenotify';
    else if (this.inquiryDecide === 'take' && !this.inquiryFeeSent) this.inquiryPart = 'fee';
    else if (this.inquiryDecide === 'take' && !this.inquiryPayAck) this.inquiryPart = 'proof';
    else if (!this.inquiryOpen) this.inquiryPart = 'vote';
    else if (this.inquiryOpen === 'close') this.inquiryPart = 'vote';
    else if (!this.inquiryNoticeSent) this.inquiryPart = 'notice';
    else if (!this.inquiryHearing) this.inquiryPart = 'hearing';
    else if (!this.inquiryQuestionsDone) this.inquiryPart = 'questions';
    else this.inquiryPart = 'visit';
  }

  protected get inquiryNav(): { id: InquiryStep; label: string; done: boolean; group: string }[] {
    const prep = this.openPrep;
    const steps: { id: InquiryStep; label: string; done: boolean; group: string }[] = [
      { id: 'prepare', label: 'เตรียมข้อมูล', done: prep.approved, group: 'เปิดไต่สวน' },
      { id: 'draftAgenda', label: 'วาระพิจารณาคำขอเปิดไต่สวน', done: this.inquiryDraftAgendaDone, group: 'เปิดไต่สวน' },
      { id: 'subAgenda', label: 'วาระอนุ', done: this.inquirySubAgendaDone, group: 'เปิดไต่สวน' },
      { id: 'agenda', label: 'วาระ ทตอ.', done: this.inquiryAgendaDone, group: 'เปิดไต่สวน' },
      { id: 'decide', label: 'รับหรือไม่รับคำขอ', done: this.inquiryDecide !== '', group: 'เปิดไต่สวน' },
    ];
    if (this.inquiryDecide === 'return') steps.push({ id: 'letter', label: 'หนังสือคืนคำขอ', done: this.inquiryReturned, group: 'เปิดไต่สวน' });
    if (this.inquiryDecide === 'take') {
      steps.push(
        { id: 'prenotify', label: 'pre-notify', done: prep.prenotify, group: 'เปิดไต่สวน' },
        { id: 'fee', label: 'แจ้งชำระค่าธรรมเนียม', done: this.inquiryFeeSent, group: 'เปิดไต่สวน' },
        { id: 'proof', label: 'หลักฐานการชำระ', done: this.inquiryPayAck, group: 'เปิดไต่สวน' },
      );
    }
    steps.push({ id: 'vote', label: 'มติเปิดไต่สวน', done: this.inquiryOpen !== '', group: 'เปิดไต่สวน' });
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

  protected inquiryStepLocked(id: InquiryStep): boolean {
    if (id === 'prepare') return false;
    if (!this.openPrep.approved && id !== 'draftAgenda') return true;
    // ร่างวาระทำคู่ขนานจากตรวจเอกสารได้ — ในแท็บเปิดไต่สวนเข้าได้หลังอนุมัติเตรียมข้อมูล หรือมีร่างแล้ว
    if (id === 'draftAgenda') return !this.openPrep.approved && !this.inquiryDraftAgendaDone;
    if (id === 'subAgenda' && !this.inquiryDraftAgendaDone) return true;
    if (id === 'agenda' && !this.inquirySubAgendaDone) return true;
    if (id === 'decide' && !this.inquiryAgendaDone) return true;
    if ((id === 'prenotify' || id === 'fee' || id === 'proof') && this.inquiryDecide !== 'take') return true;
    if (id === 'letter' && this.inquiryDecide !== 'return') return true;
    return false;
  }

  protected openInquiryStep(id: InquiryStep): void {
    if (!this.inquiryNav.some((step) => step.id === id)) return;
    if (this.inquiryStepLocked(id)) return;
    if (id === 'subAgenda') this.ensureAgendaSampleFiles('sub');
    if (id === 'agenda') this.ensureAgendaSampleFiles('tdc');
    this.inquiryPart = id;
    this.syncFilingUrl();
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
    const lane = this.inquiryAgendaLane;
    if (!lane) return;
    if (lane !== 'draft' && !this.inquiryReached) return;
    if (lane !== 'draft') this.ensureAgendaSampleFiles(lane);
    const at = this.inquiryAgendaDateValue.trim();
    if (!thaiDateOk(at, 'any')) return;
    if (lane === 'tdc' && !this.agendaReady) return;
    const kind = lane === 'draft' ? 'วาระพิจารณาคำขอเปิดไต่สวน' : lane === 'sub' ? 'วาระอนุไต่สวน' : 'วาระ ทตอ. เปิดไต่สวน';
    const id = `agenda-${lane}-${Date.now()}`;
    const fields = [
      { label: 'หน่วยงาน', value: 'กระทรวงพาณิชย์ กรมการค้าต่างประเทศ' },
      { label: 'ชื่อวาระ', value: kind },
      { label: 'วันที่', value: at },
      ...this.inquiryFields.map((item) => item.label === 'มติที่ประชุม' && !item.value.trim() ? { ...item, value: lane === 'draft' ? 'อยู่ระหว่างจัดทำร่าง' : 'รอที่ประชุมบันทึกมติ' } : { ...item }),
    ];
    this.madeDocs = [...this.madeDocs, { id, kind, at, fields }];
    writeMadeDocs(this.madeDocs);
    if (lane === 'draft') {
      this.inquiryDraftAgendaDone = true;
      if (this.docsPassed) {
        this.inquiryPart = 'subAgenda';
        this.ensureAgendaSampleFiles('sub');
      } else {
        this.docPart = this.draftAgendaPart;
        this.reviewTab = 'docs';
      }
    } else if (lane === 'sub') {
      this.inquirySubAgendaDone = true;
      this.inquiryPart = 'agenda';
      this.ensureAgendaSampleFiles('tdc');
    } else {
      this.inquiryAgendaDone = true;
      this.inquiryPart = 'decide';
    }
    this.writeInquiry();
  }

  protected addAgendaFiles(event: Event): void {
    if (this.inquiryDecide) return;
    const input = event.target as HTMLInputElement;
    const lane = this.inquiryAgendaLane || (this.draftAgendaNavOn ? 'draft' : 'tdc');
    const sentOn =
      lane === 'draft'
        ? this.inquiryDraftAgendaAt.trim() || this.thaiToday()
        : lane === 'sub'
          ? this.inquirySubAgendaAt.trim() || this.thaiToday()
          : this.inquiryAgendaAt.trim() || '10/06/2562';
    const files = [...(input.files ?? [])].map((file) => ({
      name: file.name,
      title: file.name.replace(/\.[^.]+$/, ''),
      sentOn,
      docId: '',
      lane,
      source: 'upload' as const,
    }));
    this.inquiryAgendaFiles = [...this.inquiryAgendaFiles, ...files];
    if (lane === 'tdc') this.inquiryAgendaDone = this.inquiryAgendaFiles.some((file) => (file.lane || 'tdc') === 'tdc');
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
    if (this.committeeResult === 'take') {
      this.becomeOfficial();
      this.pickReviewTab('inquiry');
    }
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

  private docPayload(sent: boolean): DocNotice {
    this.flushActiveIntoItems();
    const pipe = this.noticePipe === 'cancelled' ? 'cancelled' : (sent ? 'done' : this.noticePipe);
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
      sent: pipe === 'done' || pipe === 'delivered',
      sentBy: pipe === 'done' || pipe === 'delivered'
        ? (this.signedPerson || this.directorName || this.docSentBy)
        : this.docSentBy,
      pipe,
      pipeAt: this.noticePipeAt,
      reportBy: this.noticeReportBy || '',
      headBy: this.noticeHeadBy || '',
      officeRef: this.noticeOfficeRef || '',
      history: this.noticeHistory.map((item) => ({ ...item })),
      items: this.noticeItems.map((item) => ({
        ...item,
        files: item.files.map((file) => ({ ...file })),
        letter: item.letter.map((field) => ({ ...field })),
        gaps: item.gaps.map((gap) => ({ ...gap })),
        history: item.history.map((row) => ({ ...row })),
        keptFiles: (item.keptFiles || []).map((file) => ({ ...file })),
      })),
      activeId: this.activeNoticeId,
    };
  }

  protected saveDocs(send: boolean): void {
    if (send) {
      if (this.noticePipe !== 'attach' && this.noticePipe !== 'done' && this.noticePipe !== 'numbered') return;
    } else if (this.docSent || !this.canReviewDocs) {
      return;
    }
    if (!send && this.noticeLetter.every((item) => item.value.trim())) this.placeNoticeFile();
    if (send) {
      this.replySent = false;
      this.issueNotice();
      this.noticePipe = 'done';
    }
    const payload = this.docPayload(send);
    writeDocNotice(payload);
    this.docSent = payload.sent;
    this.docSentBy = payload.sentBy;
    if (send && this.docAction === 'amend') {
      writeCaseStatus('revision');
      this.caseStatus = 'revision';
    }
    if (send && this.docAction === 'complete') this.becomeOfficial();
    if (send && this.docAction === 'late') {
      writeCaseStatus('official');
      this.caseStatus = 'official';
    }
    this.notice = send ? 'docs' : 'saved';
    if (send) {
      this.noticeFormOpen = false;
      this.editingId = '';
    }
  }

  private issueNotice(): void {
    // เลขต้องมาจาก e-Office เท่านั้น — ไม่สร้างเลขในระบบนี้
    const no = this.noticeSaraban.trim() || this.filingSaraban || 'สบ.1605/2562';
    this.noticeSaraban = no;
    this.stampNoticeLetterSaraban(no);
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
        { at, text: `ลงเลขที่ e-Office แล้วส่ง${title}` },
        { at, text: `ได้รับเลขรับ ${no}` },
      ],
    };
    this.receipt = { ...this.receipt, links: [link, ...this.receipt.links.filter((item) => item.no !== no)] };
    writeReceipt(this.receipt);
  }

  private noticeFileTitle(): string {
    if (this.docAction === 'complete') return 'หนังสือแจ้งคำขอครบถ้วนถูกต้อง';
    if (this.docAction === 'late') return 'หนังสือแจ้งคำขอไม่ครบถ้วนถูกต้องภายใน 4 เดือน';
    return `หนังสือแจ้งแก้ไขปรับปรุงข้อมูลคำขอ ครั้งที่ ${this.latestAmendPassNo()}`;
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
    return this.canHandleCase;
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
    this.startNewNoticeDraft();
    this.suggestGaps();
    this.noticeFormOpen = true;
    this.docPart = this.workDocs.length;
    writeCaseStatus('revision');
    this.caseStatus = 'revision';
    this.notice = 'suggest';
  }

  protected markComplete(): void {
    if (!this.canDecideReply) return;
    this.noticePasses = [...this.noticePasses, this.passNow()];
    this.docAction = 'complete';
    this.docNoticedOn = this.thaiToday();
    this.docNote = 'ตรวจคำขอที่แก้ไขแล้ว ได้รับเอกสารครบถ้วนแล้ว';
    this.noticeLetter = noticeLetterFields(this.docAction, this.docNoticedOn, this.docDueOn, this.signedPerson);
    this.issueNotice();
    this.docSent = true;
    this.docSentBy = this.signedPerson || this.directorName;
    this.noticePipe = 'done';
    this.noticePipeAt = this.thaiToday();
    this.pushNoticeHistory('จัดเก็บและส่งถึงผู้ยื่น — แจ้งคำขอครบถ้วนถูกต้อง');
    this.ensureClosedEditionFiles();
    this.openEditionBuilt = false;
    this.seedAllAgencySamples();
    writeDocNotice(this.docPayload(true));
    this.becomeOfficial();
    this.reviewTab = 'docs';
    this.pickCompleteBundle('closed');
    this.seedCommitteePack();
    this.notice = 'docs';
  }

  /** ข้าม flow มาที่ตรวจเอกสาร — seed แจ้งแก้ไขเพิ่มเติมครบรอบ + ฉบับปกปิดพร้อมใช้ */
  protected jumpToCompleteOpenEdition(): void {
    this.ensureClosedEditionFiles();
    this.openEditionBuilt = false;
    this.seedAllAgencySamples();
    this.ensureAmendNoticeSamples(true);
    if (this.caseStatus !== 'official' && this.caseStatus !== 'approval') this.becomeOfficial();
    this.reviewTab = 'docs';
    this.pickDoc(this.workDocs.length);
    this.notice = 'docs';
  }

  /** แนบไฟล์ฉบับเปิดเผย (คำขอ + คำถามเพิ่มเติม + สิ่งที่ส่งมาด้วย) */
  private ensureOpenEditionFiles(): void {
    this.ensureEditionFiles(OPEN_EDITION_KIND, OPEN_EDITION_FILES, OPEN_EDITION_ALIASES);
  }

  /** แนบไฟล์ฉบับปกปิด (คำขอ + คำถามเพิ่มเติม + สิ่งที่ส่งมาด้วย) */
  private ensureClosedEditionFiles(): void {
    this.ensureEditionFiles(CLOSED_EDITION_KIND, CLOSED_EDITION_FILES, CLOSED_EDITION_ALIASES);
  }

  /** seed ไฟล์ตัวอย่างครบ — ย้าย kind เก่า และแทนที่ชื่อไฟล์ตัวอย่างเดิม */
  private ensureEditionFiles(kind: string, files: { name: string; title: string }[], aliases: string[]): void {
    const sentOn = this.docNoticedOn || this.thaiToday();
    const aliasSet = new Set(aliases);
    const sampleNames = new Set(files.map((file) => file.name));
    const legacySample = /AD เวียดนาม|ฉบับเปิดเผยสมบูรณ์|ฉบับปกปิดสมบูรณ์|Final\.docx$/i;
    const others = this.extraFiles.filter((file) => !aliasSet.has(file.kind));
    const underAlias = this.extraFiles.filter((file) => aliasSet.has(file.kind));
    const custom = underAlias
      .filter((file) => !sampleNames.has(file.name) && !legacySample.test(file.name))
      .map((file) => ({ ...file, kind }));
    const seeded = files.map((file) => ({
      kind,
      name: file.name,
      title: file.title,
      sentOn: underAlias.find((row) => row.name === file.name)?.sentOn || sentOn,
    }));
    const next = [...others, ...seeded, ...custom];
    const same =
      next.length === this.extraFiles.length &&
      next.every((file, index) => {
        const cur = this.extraFiles[index];
        return cur && cur.kind === file.kind && cur.name === file.name && cur.title === file.title;
      });
    if (same) return;
    this.extraFiles = next;
    this.writeExtraFiles();
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
    this.uploadNoticeLetterFiles(input.files);
    input.value = '';
  }

  protected renameDocFile(index: number, title: string): void {
    this.docFiles = this.docFiles.map((file, item) => (item === index ? { ...file, title } : file));
    if (!this.docSent) writeDocNotice(this.docPayload(false));
  }

  protected removeDocFile(index: number): void {
    const removed = this.docFiles[index];
    this.docFiles = this.docFiles.filter((_, item) => item !== index);
    if (removed) {
      this.noticeLetterVersions = this.noticeLetterVersions.filter((row) => row.fileName !== removed.name);
    }
    if (!this.docSent) {
      this.persistActiveNotice(false);
    }
  }

  protected get noticeLetterLatestVersion(): number {
    return this.noticeLetterVersions.reduce((max, row) => Math.max(max, row.version), 0);
  }

  /** ไฟล์อัปโหลดเก่าที่ยังไม่อยู่ในตารางเวอร์ชัน */
  protected get noticeLetterOrphanFiles(): { file: NoticeFile; index: number }[] {
    const linked = new Set(this.noticeLetterVersions.map((row) => row.fileName).filter(Boolean));
    return this.docFiles
      .map((file, index) => ({ file, index }))
      .filter((row) => !linked.has(row.file.name));
  }

  protected get canOpenNoticeLetterEditor(): boolean {
    return this.noticeLetterWordOpen || this.noticeLetterVersions.some((row) => row.source === 'created' || row.source === 'ai');
  }

  protected noticeLetterSourceLabel(source: NoticeLetterVersion['source']): string {
    return this.draftAgendaSourceLabel(source);
  }

  protected noticeLetterAtLabel(at: string): string {
    return this.draftAgendaAtLabel(at);
  }

  protected noticeLetterEditionLabel(edition: NoticeLetterVersion['edition'] | undefined): string {
    return edition === 'final' ? 'สมบูรณ์' : 'ร่าง';
  }

  protected noticeLetterEditionTone(edition: NoticeLetterVersion['edition'] | undefined): 'success' | 'neutral' {
    return edition === 'final' ? 'success' : 'neutral';
  }

  /** อัปโหลด/ปรับฉบับได้ตอนร่าง หรือหลังอนุมัติแล้ว (แนบไฟล์สมบูรณ์) */
  protected get canUploadNoticeLetter(): boolean {
    if (this.reviewRole && this.reviewRole !== 'officer') return false;
    if (!this.canHandleCase) return false;
    return !this.noticePipeLocked || this.noticePipe === 'done';
  }

  protected get canEditNoticeLetterEdition(): boolean {
    return this.canUploadNoticeLetter;
  }

  protected setNoticeLetterEdition(version: number, edition: 'draft' | 'final'): void {
    if (!this.canEditNoticeLetterEdition) return;
    const row = this.noticeLetterVersions.find((item) => item.version === version);
    if (!row || (row.edition || 'draft') === edition) return;
    this.noticeLetterVersions = this.noticeLetterVersions.map((item) =>
      item.version === version ? { ...item, edition } : item,
    );
    this.pushNoticeHistory(
      `ตั้ง${row.title} เป็นฉบับ${edition === 'final' ? 'สมบูรณ์' : 'ร่าง'}`,
    );
    this.persistActiveNotice(this.docSent || this.noticePipe === 'done');
    this.view.markForCheck();
  }

  protected toggleNoticeLetterEdition(version: number): void {
    const row = this.noticeLetterVersions.find((item) => item.version === version);
    if (!row) return;
    this.setNoticeLetterEdition(version, (row.edition || 'draft') === 'final' ? 'draft' : 'final');
  }

  protected requestCreateNoticeLetter(): void {
    if (this.noticePipeLocked) return;
    this.commitNoticeLetterVersion('created');
  }

  protected requestAiNoticeLetter(): void {
    if (this.noticePipeLocked || this.noticeLetterAiBusy) return;
    if (!this.noticeLetterActiveVersion || !this.noticeLetterWordOpen) {
      this.commitNoticeLetterVersion('created');
    }
    this.startAiNoticeLetterFill();
  }

  protected uploadNoticeLetterFiles(list: FileList | File[] | null | undefined): void {
    if (!list?.length || !this.canUploadNoticeLetter) return;
    const at = this.replyStamp();
    const files = [...list];
    const addedFiles: NoticeFile[] = [];
    const versions: NoticeLetterVersion[] = [];
    const asFinal = this.noticePipe === 'done';
    files.forEach((file, index) => {
      const version = this.noticeLetterLatestVersion + index + 1;
      const title = file.name.replace(/\.[^.]+$/, '');
      addedFiles.push({ name: file.name, title, sentOn: at });
      versions.push({
        version,
        title: `${title} · เวอร์ชัน ${version}`,
        at,
        html: `<p><strong>ไฟล์อัปโหลด</strong> ${file.name}</p><p>อัปโหลดเมื่อ ${at}</p>`,
        source: 'upload',
        fileName: file.name,
        edition: asFinal ? 'final' : 'draft',
      });
    });
    this.docFiles = [...this.docFiles, ...addedFiles];
    this.noticeLetterVersions = [...this.noticeLetterVersions, ...versions];
    this.noticeLetterActiveVersion = this.noticeLetterLatestVersion;
    this.noticeLetterTab = 'files';
    this.noticeLetterWordOpen = false;
    this.pushNoticeHistory(
      asFinal
        ? (files.length === 1 ? `แนบไฟล์สมบูรณ์ ${addedFiles[0].title}` : `แนบไฟล์สมบูรณ์ ${files.length} ฉบับ`)
        : (files.length === 1 ? `แนบไฟล์ ${addedFiles[0].title}` : `แนบไฟล์ ${files.length} ฉบับ`),
    );
    this.persistActiveNotice(this.docSent || this.noticePipe === 'done');
    this.view.markForCheck();
  }

  private commitNoticeLetterVersion(source: 'created' | 'ai'): void {
    const at = this.replyStamp();
    const version = this.noticeLetterLatestVersion + 1;
    const html = this.buildNoticeLetterBlankHtml();
    const title = `หนังสือแจ้งผล · เวอร์ชัน ${version}`;
    const fileName = `หนังสือแจ้งผล-v${version}.docx`;
    const entry: NoticeLetterVersion = { version, title, at, html, source, fileName, edition: 'draft' };
    this.noticeLetterVersions = [...this.noticeLetterVersions, entry];
    this.noticeLetterActiveVersion = version;
    this.noticeLetterHtml = html;
    this.noticeLetterEmpty = true;
    this.noticeLetterWordOpen = true;
    this.noticeLetterTab = 'editor';
    this.noticeLetterZoom = 100;
    this.noticeFormFull = true;
    this.upsertNoticeLetterDocFile(entry);
    this.persistActiveNotice(false);
    window.setTimeout(() => this.fillNoticeLetterEditor(), 0);
  }

  private startAiNoticeLetterFill(): void {
    if (this.noticeLetterAiBusy) return;
    if (!this.noticeLetterActiveVersion) this.commitNoticeLetterVersion('created');
    this.noticeLetterAiBusy = true;
    this.view.markForCheck();
    this.prepareNoticeLetterAiSource();
    const minWait = new Promise<void>((resolve) => window.setTimeout(resolve, 10000));
    // ดึงต้นฉบับ 100% จากรายการแก้ไขครั้งล่าสุด (AD1046 ครั้งที่ 3)
    const fetchSample = fetch(this.noticeLetterSampleUrl(this.latestAmendPassNo()))
      .then((res) => {
        if (!res.ok) throw new Error(`sample ${res.status}`);
        return res.text();
      })
      .catch(() => this.buildNoticeLetterAiHtml());
    Promise.all([fetchSample, minWait]).then(([html]) => {
      this.applyAiNoticeLetterHtml(typeof html === 'string' ? html : String(html));
      this.noticeLetterAiBusy = false;
      this.view.markForCheck();
    });
  }

  /** เติมฟิลด์/ช่องว่างจากแก้ไขคำขอครั้งล่าสุด — ไม่เปิดโมดัล (ใช้ตอน AI) */
  private prepareNoticeLetterAiSource(): void {
    if (this.docSent || this.noticePipeLocked) return;
    const amendPass = this.latestAmendPassNo();
    // รอบยื่นที่ผูกกับครั้งแก้ไขล่าสุด (แก้ไขครั้งที่ N = รอบยื่น N+1)
    const filingRound = Math.max(1, amendPass + 1);
    const amendHtml =
      this.amendHtmlForRound(filingRound) ||
      this.amendHtmlForRound(amendPass) ||
      this.amendHtmlForRound(this.bundleRoundNo) ||
      this.amendSampleHtml();
    const fromAmend = this.docAction === 'complete' ? [] : this.gapsFromAmendHtml(amendHtml);
    this.noticeLetter = noticeLetterFields(this.docAction, this.docNoticedOn, this.docDueOn, this.signedPerson).map((field) =>
      field.label === 'เรื่อง' && this.docAction === 'amend'
        ? { ...field, value: `แจ้งให้แก้ไขปรับปรุงข้อมูลคำขอให้ดำเนินการพิจารณาตอบโต้การทุ่มตลาด ครั้งที่ ${amendPass}` }
        : field,
    );
    if (this.docAction === 'amend') {
      this.docGaps = fromAmend.length ? fromAmend : defaultNoticeGaps.map((gap) => ({ ...gap }));
      this.applyGapBody();
      const titles = this.docGaps.map((gap) => gap.title).filter(Boolean);
      this.docNote = `ยึดแก้ไขครั้งที่ ${amendPass} (ล่าสุด) · ${titles.length} รายการ — ${titles.slice(0, 3).join(' · ')}${titles.length > 3 ? ' …' : ''}`;
    } else if (this.docAction === 'late') {
      this.docGaps = fromAmend.length ? fromAmend : defaultNoticeGaps.map((gap) => ({ ...gap }));
      this.applyGapBody();
      this.docNote = `ครบกำหนด 4 เดือนเมื่อ ${this.amendUntil || '15/09/2562'} แล้วยังไม่ครบถ้วนถูกต้อง · ยึดแก้ไขครั้งที่ ${amendPass}`;
    } else {
      this.docGaps = [];
      this.docNote = 'ตรวจแล้วคำขอและเอกสารประกอบครบถ้วนถูกต้อง — เสนอแจ้งผู้ยื่นและดำเนินการขั้นต่อไป';
    }
    writeDocNotice(this.docPayload(false));
  }

  private applyAiNoticeLetterHtml(html: string): void {
    const version = this.noticeLetterActiveVersion || this.noticeLetterLatestVersion;
    const at = this.replyStamp();
    this.noticeLetterHtml = html;
    this.noticeLetterEmpty = this.amendHtmlIsEmpty(html);
    if (version) {
      this.noticeLetterVersions = this.noticeLetterVersions.map((row) =>
        row.version === version ? { ...row, html, at, source: 'ai' } : row,
      );
      const current = this.noticeLetterVersions.find((row) => row.version === version);
      if (current) this.upsertNoticeLetterDocFile(current);
    }
    this.noticeLetterWordOpen = true;
    this.noticeLetterTab = 'editor';
    this.noticeFormFull = true;
    this.persistActiveNotice(false);
    window.setTimeout(() => this.fillNoticeLetterEditor(), 0);
  }

  protected openNoticeLetterVersion(version: number): void {
    const row = this.noticeLetterVersions.find((item) => item.version === version);
    if (!row) return;
    if (row.source === 'upload' && row.fileName) {
      this.openNoticeFile(row.fileName);
      return;
    }
    this.noticeLetterActiveVersion = version;
    this.noticeLetterHtml = row.html;
    this.noticeLetterWordOpen = true;
    this.noticeLetterTab = 'editor';
    this.noticeLetterZoom = 100;
    this.noticeFormOpen = true;
    this.noticeFormFull = true;
    window.setTimeout(() => this.fillNoticeLetterEditor(), 0);
  }

  protected closeNoticeLetterWord(): void {
    this.captureNoticeLetterEditor();
    this.syncNoticeLetterFiles();
    this.noticeLetterWordOpen = false;
    this.noticeLetterTab = 'files';
    this.persistActiveNotice(false);
  }

  protected saveNoticeLetterDraft(): void {
    this.captureNoticeLetterEditor();
    this.syncNoticeLetterFiles();
    this.persistActiveNotice(false);
    this.notice = 'saved';
  }

  protected saveNoticeLetterWord(): void {
    this.captureNoticeLetterEditor();
    this.syncNoticeLetterFiles();
    this.persistActiveNotice(false);
    this.noticeLetterWordOpen = false;
    this.noticeLetterTab = 'files';
    this.notice = 'saved';
  }

  protected downloadNoticeLetterWord(): void {
    this.captureNoticeLetterEditor();
    const version = this.noticeLetterActiveVersion || this.noticeLetterLatestVersion || 1;
    const title = `หนังสือแจ้งผล · เวอร์ชัน ${version}`;
    const fileName = `หนังสือแจ้งผล-v${version}-${this.refId || filingRefId}.doc`;
    this.downloadEditorHtmlAsWord(fileName, title, this.noticeLetterHtml || '<p><br></p>');
  }

  protected downloadNoticeLetterVersion(row: NoticeLetterVersion): void {
    if (this.noticeLetterWordOpen && this.noticeLetterActiveVersion === row.version) {
      this.downloadNoticeLetterWord();
      return;
    }
    if (row.source === 'upload' && row.fileName) {
      this.downloadNoticeFile(row.fileName);
      return;
    }
    const title = row.title || `หนังสือแจ้งผล · เวอร์ชัน ${row.version}`;
    const base = (row.fileName || `หนังสือแจ้งผล-v${row.version}`).replace(/\.[^.]+$/, '');
    this.downloadEditorHtmlAsWord(`${base}-${this.refId || filingRefId}.doc`, title, row.html || '<p><br></p>');
  }

  protected renameNoticeLetterVersion(version: number, title: string): void {
    const next = title.trim() || `หนังสือแจ้งผล · เวอร์ชัน ${version}`;
    this.noticeLetterVersions = this.noticeLetterVersions.map((row) =>
      row.version === version ? { ...row, title: next } : row,
    );
    const current = this.noticeLetterVersions.find((row) => row.version === version);
    if (current) this.upsertNoticeLetterDocFile(current);
    this.persistActiveNotice(false);
  }

  protected removeNoticeLetterVersion(version: number): void {
    const row = this.noticeLetterVersions.find((item) => item.version === version);
    if (!row) return;
    if (this.noticePipeLocked && !(this.canUploadNoticeLetter && row.source === 'upload')) return;
    this.noticeLetterVersions = this.noticeLetterVersions.filter((item) => item.version !== version);
    if (row.fileName) {
      this.docFiles = this.docFiles.filter((file) => file.name !== row.fileName);
    }
    if (this.noticeLetterActiveVersion === version) {
      this.noticeLetterActiveVersion = this.noticeLetterLatestVersion;
      this.noticeLetterWordOpen = false;
      this.noticeLetterTab = 'files';
    }
    this.persistActiveNotice(this.docSent || this.noticePipe === 'done');
  }

  protected zoomNoticeLetter(dir: 1 | -1): void {
    const at = this.noticeLetterZoomSteps.indexOf(this.noticeLetterZoom);
    const index = at < 0 ? this.noticeLetterZoomSteps.indexOf(100) : at;
    const next = this.noticeLetterZoomSteps[Math.min(this.noticeLetterZoomSteps.length - 1, Math.max(0, index + dir))];
    this.noticeLetterZoom = next ?? 100;
  }

  protected get noticeLetterZoomCss(): number {
    return (this.noticeLetterZoom / 100) * Math.max(this.noticeLetterFitScale, this.noticeLetterZoomBase);
  }

  protected get canZoomNoticeLetterIn(): boolean {
    return this.noticeLetterZoom < this.noticeLetterZoomSteps[this.noticeLetterZoomSteps.length - 1];
  }

  protected get canZoomNoticeLetterOut(): boolean {
    return this.noticeLetterZoom > this.noticeLetterZoomSteps[0];
  }

  protected onNoticeLetterEditorInput(): void {
    this.captureNoticeLetterEditor();
  }

  protected noticeLetterFormat(command: string, value?: string): void {
    document.execCommand('styleWithCSS', false, 'true');
    document.execCommand(command, false, value);
    this.lockOfficialFontOnSelection();
    this.captureNoticeLetterEditor();
    this.refreshAmendToolbar();
    this.noticeLetterEditorRef?.nativeElement.focus();
  }

  protected applyNoticeLetterFontSize(size: string): void {
    this.amendFontSize = size;
    document.execCommand('styleWithCSS', false, 'true');
    document.execCommand('fontSize', false, '3');
    const root = this.noticeLetterEditorRef?.nativeElement;
    root?.querySelectorAll('font[size="3"]').forEach((node) => {
      const span = document.createElement('span');
      span.style.fontSize = size;
      span.style.fontFamily = this.officialFontName;
      span.innerHTML = node.innerHTML;
      node.replaceWith(span);
    });
    this.lockOfficialFontOnSelection();
    this.captureNoticeLetterEditor();
    this.noticeLetterEditorRef?.nativeElement.focus();
  }

  protected applyNoticeLetterColor(color: string): void {
    this.amendColor = color;
    document.execCommand('styleWithCSS', false, 'true');
    document.execCommand('foreColor', false, color);
    this.lockOfficialFontOnSelection();
    this.captureNoticeLetterEditor();
    this.refreshAmendToolbar();
    this.noticeLetterEditorRef?.nativeElement.focus();
  }

  protected applyNoticeLetterHighlight(color: string): void {
    this.amendHighlight = color;
    document.execCommand('styleWithCSS', false, 'true');
    document.execCommand('hiliteColor', false, color === 'transparent' ? 'transparent' : color);
    this.lockOfficialFontOnSelection();
    this.captureNoticeLetterEditor();
    this.refreshAmendToolbar();
    this.noticeLetterEditorRef?.nativeElement.focus();
  }

  private captureNoticeLetterEditor(): void {
    const el = this.noticeLetterEditorRef?.nativeElement;
    if (!el) return;
    const empty = !el.textContent?.replace(/\u00a0/g, ' ').replace(/\u200b/g, '').trim();
    this.noticeLetterEmpty = empty;
    this.noticeLetterHtml = empty ? '' : el.innerHTML;
    const version = this.noticeLetterActiveVersion;
    if (version) {
      this.noticeLetterVersions = this.noticeLetterVersions.map((row) =>
        row.version === version ? { ...row, html: this.noticeLetterHtml } : row,
      );
    }
  }

  private fillNoticeLetterEditor(tries = 0): void {
    const run = () => {
      const el = this.noticeLetterEditorRef?.nativeElement;
      if (!el) {
        if (tries < 8) window.setTimeout(() => this.fillNoticeLetterEditor(tries + 1), 50);
        return;
      }
      el.innerHTML = this.noticeLetterHtml;
      this.noticeLetterEmpty = this.amendHtmlIsEmpty(this.noticeLetterHtml);
      this.refreshAmendToolbar();
      this.view.markForCheck();
    };
    window.setTimeout(run, tries === 0 ? 0 : 50);
  }

  /** ต้นฉบับรายการแก้ไข — ตามครั้งที่ (AD1046 มีครั้งที่ 1–3) */
  private noticeLetterSampleUrl(amendPass = this.latestAmendPassNo()): string {
    const pass = Math.min(3, Math.max(1, amendPass));
    return `assets/samples/ad1046/notice/รายการแก้ไขปรับปรุงข้อมูลคำขอ-ครั้งที่-${pass}.html`;
  }

  private buildNoticeLetterBlankHtml(): string {
    const font = this.officialFontName;
    const amendPass = this.latestAmendPassNo();
    const subject =
      this.noticeLetter.find((f) => f.label === 'เรื่อง')?.value ||
      `แจ้งให้แก้ไขปรับปรุงข้อมูลคำขอให้ดำเนินการพิจารณาตอบโต้การทุ่มตลาด ครั้งที่ ${amendPass}`;
    const to = this.noticeLetter.find((f) => f.label === 'เรียน')?.value || 'บริษัท สหวิริยาสตีลอินดัสตรี จำกัด (มหาชน)';
    return [
      `<div class="notice-letter-sample" data-source="form" style="font-family:${font};font-size:16pt;line-height:1.15;color:#0E2346">`,
      `<p class="notice-letter-head" style="font-family:${font};font-size:16pt;line-height:1.15;margin:0 0 12pt;color:#0E2346;text-align:center">`,
      `<img src="assets/samples/ad1046/agenda/approval/garuda.png" alt="ตราครุฑ" width="78" height="88" style="display:block;margin:0 auto 4pt;width:78px;height:88px;object-fit:contain" />`,
      `</p>`,
      `<p style="font-family:${font};font-size:16pt;margin:0;color:#0E2346"><strong>ที่</strong> &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;</p>`,
      `<p style="font-family:${font};font-size:16pt;margin:0;color:#0E2346;text-align:right"><strong>วันที่</strong> ${this.docNoticedOn || ''}</p>`,
      `<p style="font-family:${font};font-size:16pt;margin:8pt 0 0;color:#0E2346"><strong>เรื่อง</strong> ${subject}</p>`,
      `<p style="font-family:${font};font-size:16pt;margin:0;color:#0E2346"><strong>เรียน</strong> ${to}</p>`,
      `<p style="font-family:${font};font-size:16pt;margin:8pt 0 0;color:#0E2346"><strong>อ้างถึง</strong> คำขอเลขที่อ้างอิง R6201 ลงวันที่ 15/05/2563 เลขสารบรรณ สบ.1605/2562</p>`,
      `<p style="font-family:${font};font-size:16pt;margin:0;color:#0E2346"><strong>สิ่งที่ส่งมาด้วย</strong> รายการแก้ไขปรับปรุงข้อมูลคำขอ (แบบปร. 1) ครั้งที่ ${amendPass}</p>`,
      `<p style="font-family:${font};font-size:16pt;margin:12pt 0 0;text-indent:2em;color:#0E2346">ด้วยกรมการค้าต่างประเทศได้ตรวจสอบคำขอแล้ว เห็นควรให้แก้ไขปรับปรุงตามรายการที่ส่งมาด้วย</p>`,
      `<p style="font-family:${font};font-size:16pt;margin:12pt 0 0;text-indent:2em;color:#0E2346"><br></p>`,
      `</div>`,
    ].join('');
  }

  private buildNoticeLetterAiHtml(): string {
    const font = this.officialFontName;
    const amendPass = this.latestAmendPassNo();
    const get = (label: string) => this.noticeLetter.find((f) => f.label === label)?.value || '';
    const body = get('เนื้อความ')
      .split('\n')
      .map((line) => `<p style="font-family:${font};font-size:16pt;margin:0 0 6pt;text-align:justify;text-indent:2em;color:#0E2346">${line || '<br>'}</p>`)
      .join('');
    const due = get('กำหนดส่งข้อมูล');
    const signer = get('ลงชื่อ');
    return [
      `<div class="notice-letter-sample" data-source="ai-fallback" style="font-family:${font};font-size:16pt;line-height:1.15;color:#0E2346">`,
      `<p class="notice-letter-head" style="font-family:${font};font-size:16pt;line-height:1.15;margin:0 0 12pt;color:#0E2346;text-align:center">`,
      `<img src="assets/samples/ad1046/agenda/approval/garuda.png" alt="ตราครุฑ" width="78" height="88" style="display:block;margin:0 auto 4pt;width:78px;height:88px;object-fit:contain" />`,
      `</p>`,
      `<p style="font-family:${font};font-size:16pt;margin:0;color:#0E2346"><strong>ที่</strong> &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;</p>`,
      `<p style="font-family:${font};font-size:16pt;margin:0;color:#0E2346;text-align:right"><strong>วันที่</strong> ${get('วันที่') || this.docNoticedOn || ''}</p>`,
      `<p style="font-family:${font};font-size:16pt;margin:8pt 0 0;color:#0E2346"><strong>เรื่อง</strong> ${get('เรื่อง') || `แจ้งให้แก้ไขปรับปรุงข้อมูลคำขอ ครั้งที่ ${amendPass}`}</p>`,
      `<p style="font-family:${font};font-size:16pt;margin:0;color:#0E2346"><strong>เรียน</strong> ${get('เรียน')}</p>`,
      `<p style="font-family:${font};font-size:16pt;margin:8pt 0 0;color:#0E2346"><strong>อ้างถึง</strong> ${get('อ้างถึง') || 'คำขอเลขที่อ้างอิง R6201 เลขสารบรรณ สบ.1605/2562'}</p>`,
      get('สิ่งที่ส่งมาด้วย') && get('สิ่งที่ส่งมาด้วย') !== '-'
        ? `<p style="font-family:${font};font-size:16pt;margin:0;color:#0E2346"><strong>สิ่งที่ส่งมาด้วย</strong> ${get('สิ่งที่ส่งมาด้วย')}</p>`
        : '',
      `<p style="font-family:${font};font-size:16pt;margin:12pt 0 0;color:#0E2346"><br></p>`,
      body,
      due && due !== '-'
        ? `<p style="font-family:${font};font-size:16pt;margin:12pt 0 0;text-indent:2em;color:#0E2346">ทั้งนี้ ขอให้จัดส่งข้อมูลภายในวันที่ ${due}</p>`
        : '',
      `<p style="font-family:${font};font-size:16pt;margin:24pt 0 0;text-align:center;color:#0E2346">ขอแสดงความนับถือ</p>`,
      `<p style="font-family:${font};font-size:16pt;margin:36pt 0 0;text-align:center;color:#0E2346">${signer || '&nbsp;'}</p>`,
      `</div>`,
    ].join('');
  }

  private upsertNoticeLetterDocFile(row: NoticeLetterVersion): void {
    const name = row.fileName || `หนังสือแจ้งผล-v${row.version}.docx`;
    const title = row.title;
    const sentOn = row.at || this.docNoticedOn || this.thaiToday();
    const exists = this.docFiles.some((file) => file.name === name);
    this.docFiles = exists
      ? this.docFiles.map((file) => (file.name === name ? { ...file, title, sentOn } : file))
      : [...this.docFiles, { name, title, sentOn }];
  }

  private syncNoticeLetterFiles(): void {
    this.noticeLetterVersions
      .filter((row) => row.source === 'created' || row.source === 'ai')
      .forEach((row) => this.upsertNoticeLetterDocFile(row));
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
    this.assignedOn = this.thaiToday();
    this.dueOn = this.thaiShift(14);
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
    if (!this.slipAssignedOn || this.slipAssignedOn === '16/05/2562') this.slipAssignedOn = this.assignedOn === '16/05/2562' ? this.thaiToday() : (this.assignedOn || this.thaiToday());
    if (!this.slipDueOn || this.slipDueOn === '30/05/2562') this.slipDueOn = this.dueOn === '30/05/2562' ? this.thaiShift(14) : (this.dueOn || this.thaiShift(14));
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
    sessionStorage.setItem('dft-por1-filing-assign', 'wait');
    writeConsultStep('director');
    writeConsultGroup('');
    writeConsultAssigned(false);
    this.notice = 'saved';
  }

  protected get eofficeDirectorLabel(): string {
    if (this.eofficeDirector.state === 'sent') return this.eofficeDirector.mode === 'auto' ? 'Auto ส่ง e-Office แล้ว' : 'ส่ง e-Office แล้ว';
    if (this.eofficeDirector.state === 'assigned') return 'ดึงผลมอบหมายแล้ว';
    if (this.eofficeDirector.state === 'error') return 'ส่ง e-Office ไม่สำเร็จ';
    return 'ยังไม่ส่ง e-Office';
  }

  protected get eofficeDirectorTone(): 'success' | 'info' | 'warning' | 'danger' | 'neutral' {
    if (this.eofficeDirector.state === 'assigned') return 'success';
    if (this.eofficeDirector.state === 'sent') return 'info';
    if (this.eofficeDirector.state === 'error') return 'danger';
    return 'warning';
  }

  protected sendDirectorToEoffice(mode: 'auto' | 'manual' = 'auto'): void {
    const at = this.replyStamp();
    const reason = this.filingReturned
      ? `ส่งกลับผู้อำนวยการเพื่อมอบหมายผู้รับผิดชอบคำขอ ${this.refId}`
      : `ส่งคำขอ ${this.refId} ให้ผู้อำนวยการมอบหมายใน e-Office`;
    this.eofficeDirector = sendDirectorWorkToEoffice({ at, mode, reason });
    const row: SystemLink = {
      id: `e-Office-dir-${Date.now()}`,
      at,
      system: 'e-Office',
      title: 'ส่งมอบหมายผู้อำนวยการ',
      detail: this.eofficeDirector.detail,
      state: 'success',
      mode: mode === 'auto' ? 'auto' : 'manual',
      refNo: this.eofficeDirector.refNo,
      error: '',
      log: [{ at, text: `${mode === 'auto' ? 'Auto' : 'กดส่ง'} ยิงงานมอบหมายผู้อำนวยการเข้า e-Office` }],
    };
    this.links = [row, ...this.links.filter((item) => item.title !== 'ส่งมอบหมายผู้อำนวยการ' || item.state === 'error')];
    writeSystemLinks(this.links);
    this.notice = 'saved';
  }

  protected pullDirectorFromEoffice(): void {
    if (this.eofficeDirector.state !== 'sent' && this.eofficeDirector.state !== 'assigned' && this.eofficeDirector.state !== 'error') return;
    const at = this.replyStamp();
    const handoff = pullDirectorAssignFromEoffice(at);
    this.eofficeDirector = handoff;
    if (handoff.state !== 'assigned') {
      this.notice = 'saved';
      return;
    }
    const day = at.split(' ')[0] || this.thaiToday();
    const form: ConsultSlip = {
      assignedOn: day,
      dueOn: this.thaiShift(5),
      dueTime: '16:00',
      remind: true,
      order: handoff.detail || this.defaultConsultOrder(),
      signed: true,
      files: [],
    };
    this.consultJobs = handoff.groups.map((group) => ({ group, reply: 'pending' as const, officers: [], form }));
    this.writeConsultJobs();
    const row: SystemLink = {
      id: `e-Office-pull-${Date.now()}`,
      at,
      system: 'e-Office',
      title: 'ดึงผลการมอบหมายผู้อำนวยการ',
      detail: handoff.detail,
      state: 'success',
      mode: 'manual',
      refNo: handoff.refNo,
      error: '',
      log: [{ at, text: `ดึงผลมอบหมายจาก e-Office: ${handoff.groups.join(', ')}` }],
    };
    this.links = [row, ...this.links];
    writeSystemLinks(this.links);
    this.notice = 'saved';
  }

  private ensureDirectorEoffice(): void {
    // ตัด e-Office ชั่วคราว — ผอมอบหมายในระบบตาม Task Management
    this.eofficeDirector = readEofficeDirectorHandoff();
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
    const left = this.daysUntil(this.amendUntil);
    return left > 0 ? left : 0;
  }

  private defaultConsultOrder(): string {
    return 'ให้กลุ่มงานมาตรการตอบโต้การทุ่มตลาด (AD) พิจารณาขอปรึกษาการแก้ไขคำขอ เลขที่อ้างอิง R6201 สินค้าเหล็กแผ่นรีดร้อนจากเวียดนามและอียิปต์ แล้วแจ้งผลการปรึกษากลับภายในวันกำหนดส่ง';
  }

  private defaultResultDetail(): string {
    return 'ตรวจสอบคำขอปรึกษาการแก้ไขคำขอเลขที่อ้างอิง R6201 สินค้าเหล็กแผ่นรีดร้อนจากเวียดนามและอียิปต์แล้ว เอกสารที่ผู้ยื่นปรึกษามาสามารถแก้ไขในแบบคำขอได้ เห็นควรแจ้งผู้ยื่นให้แก้ไขภายในกำหนด 4 เดือน';
  }

  private thaiToday(): string {
    return this.thaiShift(0);
  }

  private thaiShift(days: number): string {
    const now = new Date();
    now.setDate(now.getDate() + days);
    return `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear() + 543}`;
  }

  private useClickDate(stamp = ''): void {
    if (this.returnCase) return;
    // โหมดเจ้าหน้าที่คงวันที่ยื่นแบบตาม Prototype ไม่ดึงวันปัจจุบัน
    if (this.reviewRole && !stamp) {
      this.syncAmendClock(readOfficialOn() || firstFiledOn, false);
      return;
    }
    const saved = sessionStorage.getItem('dft-por1-action-on') || '';
    const day = (stamp || saved || '').split(' ')[0];
    if (!day || !/^\d{2}\/\d{2}\/\d{4}$/.test(day)) return;
    if (stamp || !saved) sessionStorage.setItem('dft-por1-action-on', day);
    if (this.caseStatus === 'official' || readOfficialOn()) this.syncAmendClock(readOfficialOn() || day, false);
    else {
      this.filedOn = day;
      this.amendUntil = addThaiMonths(day, 4);
    }
    if (this.consult?.at?.startsWith('15/05/2563')) {
      const clock = stamp || this.replyStamp();
      this.consult = { ...this.consult, at: clock };
      writeConsult(this.consult);
    }
  }

  /** ตั้งวันที่ยื่นแบบทางการแล้วคำนวณครบ 4 เดือนจากวันนั้น */
  private syncAmendClock(officialOn: string, persist = true): void {
    const day = (officialOn || firstFiledOn).split(' ')[0];
    if (!/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(day)) return;
    this.officialOn = day;
    if (!this.filedOn || this.filedOn === firstFiledOn) this.filedOn = day;
    this.amendUntil = addThaiMonths(day, 4);
    if (persist) writeOfficialOn(day);
  }

  /** เปลี่ยนเป็นสถานะยื่นแบบ และเริ่มนับกำหนด 4 เดือน */
  private becomeOfficial(on = ''): void {
    const day = (on || this.replyStamp() || this.thaiToday() || firstFiledOn).split(' ')[0];
    writeCaseStatus('official');
    this.caseStatus = 'official';
    this.syncAmendClock(day);
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
    // นาฬิกา 4 เดือนเริ่มเมื่อมีสถานะยื่นแบบทางการ
    if (this.caseStatus !== 'official' && !readOfficialOn() && !this.reviewRole) return null;
    if (this.caseStatus !== 'official' && this.reviewRole && !readOfficialOn() && this.caseStatus !== 'approval') return null;
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

  /** วันอ้างอิงของนาฬิกาเคส — โหมด Prototype/เจ้าหน้าที่ใช้นับจากวันที่ยื่นแบบ */
  private clockToday(): string {
    const saved = (sessionStorage.getItem('dft-por1-action-on') || '').split(' ')[0];
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(saved)) return saved;
    if (this.reviewRole) return this.officialOn || this.filedOn || firstFiledOn;
    return this.thaiToday();
  }

  private parseThaiDay(value: string): Date | null {
    const [day, month, year] = value.split('/').map(Number);
    if (!day || !month || !year) return null;
    const date = new Date(year - 543, month - 1, day);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  private daysUntil(value: string): number {
    const due = this.parseThaiDay(value);
    const today = this.parseThaiDay(this.clockToday());
    if (!due || !today) return 0;
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
      writeActiveFilingRef(this.refId);
      this.filedOn = item.created || this.filedOn;
      if (this.caseStatus === 'official') this.syncAmendClock(readOfficialOn() || this.filedOn);
      else this.amendUntil = addThaiMonths(this.filedOn, 4);
      this.filing = 'self';
      this.poaAttached = false;
      this.docKey = 'cert';
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
    this.goodsDetail = goods.length > 2000 ? goods.slice(0, 2000) : goods;
    this.relatedImport = '';
    this.priorAid = '';
    this.outsideProducer = '';
    this.channelDetail = '';
    this.exportConstructed = '';
    this.goodsCompare = this.goodsCompare.map((row) => ({ ...row, subject: '', like: '' }));
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
    const marginText = this.marginCountries
      .map((row) => `${row.name}: มูลค่าปกติ ${row.normal} · ส่งออก ${row.exportPrice} · ส่วนเหลื่อม ${row.margin} (${row.rate}%)`)
      .join('\n');
    const rows = [
      { group: 'ส่วนที่ 1 ผู้ยื่นคำขอ', label: 'ชื่อ', value: this.company },
      { group: 'ส่วนที่ 1 ผู้ยื่นคำขอ', label: 'สัญชาติ', value: this.nationality },
      { group: 'ส่วนที่ 1 ผู้ยื่นคำขอ', label: 'ที่อยู่', value: this.address },
      { group: 'ส่วนที่ 1 ผู้ยื่นคำขอ', label: 'โทรศัพท์', value: this.phone },
      { group: 'ส่วนที่ 1 ผู้ยื่นคำขอ', label: 'โทรสาร', value: this.fax },
      { group: 'ส่วนที่ 1 ผู้ยื่นคำขอ', label: 'ประเภทการยื่น', value: 'ยื่นแทนผู้ผลิตบางส่วนในอุตสาหกรรมภายใน' },
      { group: 'ส่วนที่ 1 ผู้ยื่นคำขอ', label: 'ความเกี่ยวข้องกับผู้นำเข้าหรือผู้ส่งออก', value: this.relatedImport || 'ไม่มี' },
      { group: 'ส่วนที่ 1 ผู้ยื่นคำขอ', label: 'ที่', value: this.letterNo },
      { group: 'ส่วนที่ 1 ผู้ยื่นคำขอ', label: 'วันที่หนังสือ', value: this.letterDate },
      { group: 'ส่วนที่ 1 ผู้ยื่นคำขอ', label: 'ผู้ลงนาม', value: this.signer },
      { group: 'ส่วนที่ 2 สินค้า', label: 'รายละเอียดสินค้า', value: this.goodsDetail },
      { group: 'ส่วนที่ 2 สินค้า', label: 'ช่องทางการจำหน่าย', value: this.channelDetail },
      ...this.goodsCompare.map((row) => ({
        group: 'ส่วนที่ 2 สินค้า',
        label: row.item,
        value: `สินค้าที่ถูกพิจารณา: ${row.subject}\nสินค้าชนิดเดียวกัน: ${row.like}`,
      })),
      {
        group: 'ส่วนที่ 2 สินค้า',
        label: 'เอกสารแนบประกอบส่วนที่ 2',
        value: this.docs.map((file) => file.name).join('\n'),
      },
      { group: 'ส่วนที่ 3 ผู้ผลิต ผู้ส่งออก ผู้นำเข้า', label: 'ผู้ผลิตต่างประเทศ', value: 'Formosa Ha Tinh Steel Corporation (เวียดนาม); Ezz El Dekheila Steel Company (อียิปต์)' },
      { group: 'ส่วนที่ 3 ผู้ผลิต ผู้ส่งออก ผู้นำเข้า', label: 'ผู้ส่งออกแยกต่างหาก', value: 'ไม่มี' },
      { group: 'ส่วนที่ 4 มูลค่าปกติ', label: 'วิธีคำนวณ', value: this.factoryNote },
      { group: 'ส่วนที่ 5 ราคาส่งออก', label: 'ราคาส่งออก', value: this.exportDetail },
      { group: 'ส่วนที่ 6 ส่วนเหลื่อมการทุ่มตลาด', label: 'ตารางส่วนเหลื่อม', value: marginText },
      { group: 'ส่วนที่ 7 การอุดหนุน', label: 'ข้อมูลการอุดหนุน', value: this.explainDetail },
      { group: 'ส่วนที่ 8 ความเสียหาย', label: 'ปริมาณนำเข้า', value: this.notes['importDetail'] },
      { group: 'ส่วนที่ 8 ความเสียหาย', label: 'สรุปความเสียหาย', value: this.notes['summaryDetail'] },
      { group: 'มาตรการ', label: 'มาตรการ', value: this.measureName },
    ];
    return rows.filter((row) => row.value.trim());
  }

  /** แบบในเล่มยื่นนี้ — เคสตัวอย่าง AD1046 ใช้แบบ ปร. 1 */
  protected readonly caseForms: { code: string; measure: string }[] = [
    { code: 'ปร. 1', measure: 'มาตรการ AD' },
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
    // ยื่นแบบ/รออนุมัติแล้ว ไม่ให้ผลตรวจเก่าทับเป็น "ให้แก้ไข"
    if (this.caseStatus === 'official') {
      if (this.awaitingOfficialFiling) return 'รอผู้ยื่นยื่นแบบทางการ';
      return caseStatusLabel(this.caseStatus);
    }
    if (this.caseStatus === 'approval') return caseStatusLabel(this.caseStatus);
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
    if (this.caseStatus === 'official') return this.awaitingOfficialFiling ? 'warning' as const : caseStatusTone(this.caseStatus);
    if (this.caseStatus === 'approval') return caseStatusTone(this.caseStatus);
    if (this.checkReturned) return 'warning' as const;
    return caseStatusTone(this.caseStatus);
  }

  private captureRound(round: number): FilingRound {
    const submittedOn = round <= 1 ? (this.filedOn || this.thaiToday()) : (this.thaiToday() || this.filedOn);
    return {
      round,
      submittedOn,
      folder: this.roundFolderName(round, submittedOn),
      state: 'review',
      company: this.company,
      measure: this.measureName,
      signer: this.signer,
      files: this.realFilingAnnex(),
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
    return !!(
      this.company.trim() &&
      this.letterNo.trim() &&
      this.letterDate.trim() &&
      this.letterSubject.trim() &&
      this.letterTo.trim() &&
      this.letterBody.trim() &&
      this.letterPurpose.trim() &&
      this.signatureUrl
    );
  }

  protected get signReady(): boolean {
    return !!(this.signer.trim() && this.signerPrint.trim() && this.roleTitle.trim() && this.signedOn.trim());
  }

  protected get pledgeReady(): boolean {
    return this.ack && !!this.signatureUrl;
  }

  protected get submitReady(): boolean {
    return this.sectionsReady && this.requestReady && this.signReady && this.pledgeReady;
  }

  protected get canConfirm(): boolean {
    return !this.submitting;
  }

  protected uploadOpen = false;
  protected readOn = false;

  protected openFilledUpload(): void {
    this.uploadOpen = true;
  }

  protected downloadBlankForm(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    downloadFormTemplate('ปร. 1');
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
    this.requireIdentityThen(() => {
      this.submitAck = false;
      this.submitOpen = true;
    });
  }

  protected openOfficial(): void {
    this.requireIdentityThen(() => {
      this.officialOpen = true;
    });
  }

  protected get identityVerify() {
    return this.accounts.identityOf();
  }

  protected get identityVerifyTone() {
    return this.accounts.identityStatusTone(this.identityVerify.status);
  }

  protected get identityVerifyLabel() {
    return this.accounts.identityStatusLabel(this.identityVerify.status);
  }

  protected get identityNationality() {
    return this.accounts.nationalityLabel();
  }

  /** เปิดกระบวนการที่ต้องยืนยันตัวตนก่อน (ยื่น / ยื่นแบบทางการ ฯลฯ) */
  protected requireIdentityThen(action: () => void): void {
    if (!this.accounts.isIdentityVerified()) {
      this.verifyMessage = '';
      this.foreignDoc = '';
      this.foreignAck = false;
      this.verifyOpen = true;
      return;
    }
    action();
  }

  protected verifyThaiIdForSubmit(): void {
    this.verifyBusy = true;
    window.setTimeout(() => {
      this.accounts.verifyWithThaiId();
      this.verifyBusy = false;
      this.verifyOpen = false;
      this.verifyMessage = '';
      this.submitAck = false;
      this.submitOpen = true;
      this.view.markForCheck();
    }, 600);
  }

  protected submitForeignDocsForGate(): void {
    if (!this.foreignDoc.trim() || !this.foreignAck) {
      this.verifyMessage = 'โปรดแนบเอกสารบัตรและยืนยันความถูกต้อง';
      return;
    }
    this.accounts.submitForeignIdentity([this.foreignDoc.trim()]);
    this.verifyMessage = 'ส่งเอกสารให้เจ้าหน้าที่แล้ว — รอผลตรวจที่ Profile ก่อนจึงยื่นได้';
  }

  protected goProfileVerify(): void {
    this.verifyOpen = false;
    void this.router.navigate(['/profile'], { queryParams: { verify: '1' } });
  }

  protected confirmSubmit(): void {
    if (!this.accounts.isIdentityVerified()) {
      this.submitOpen = false;
      this.verifyOpen = true;
      return;
    }
    if (!this.canConfirm || this.submitting) return;
    this.useClickDate(this.replyStamp());
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
    return (
      !!this.consultTopic.trim() &&
      !!this.consultDetail.trim() &&
      !!this.consultChannel &&
      !!this.consultContactName.trim() &&
      phoneOk(this.consultContactPhone) &&
      this.consultSlotsReady
    );
  }

  private get consultSlotsReady(): boolean {
    return (
      this.consultSlots.length >= minConsultSlots &&
      this.consultSlots.every((slot) => thaiDateOk(slot.date, 'any') && this.slotTimeOk(slot.time) && this.slotTimeOk(slot.endTime))
    );
  }

  private slotTimeOk(value: string): boolean {
    return /^([01]\d|2[0-3]):[0-5]\d$/.test(value.trim());
  }

  private parseConsultWhen(when: string): { date: string; time: string; endTime: string }[] {
    return when
      .split('·')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const cleaned = part.replace(/\s*น\.\s*$/, '').trim();
        const [date = '', range = ''] = cleaned.split(/\s+/);
        const [time = '', endTime = ''] = range.split(/[–-]/);
        return { date, time, endTime };
      })
      .filter((slot) => !!slot.date);
  }

  private formatConsultWhen(slots: { date: string; time: string; endTime: string }[]): string {
    return slots.map((slot) => `${slot.date.trim()} ${slot.time.trim()}–${slot.endTime.trim()}`).join(' · ');
  }

  protected sendConsult(): void {
    if (this.openConsultRound) {
      this.consultOpen = false;
      this.showConsultLimit();
      return;
    }
    const topic = this.consultTopic.trim();
    const detail = this.consultDetail.trim();
    const contactName = this.consultContactName.trim();
    const contactPhone = this.consultContactPhone.trim();
    if (!topic || !detail || !this.consultChannel || !contactName || !phoneOk(contactPhone) || !this.consultSlotsReady) return;
    const at = this.replyStamp();
    this.useClickDate(at);
    const slots = this.consultSlots.map((slot) => ({
      date: slot.date.trim(),
      time: slot.time.trim(),
      endTime: slot.endTime.trim(),
    }));
    const request = {
      topic,
      detail,
      when: this.formatConsultWhen(slots),
      slots,
      channel: this.consultChannel,
      contactName,
      contactPhone,
      by: this.accounts.displayName,
      at,
    };
    // ชั้นปรึกษาแยกจากสถานะคำขอ — ไม่เปลี่ยน caseStatus ไม่ล็อกยื่น/แก้
    if (this.caseStatus === 'consult') {
      writeCaseStatus('revision');
      this.caseStatus = 'revision';
    }
    const assigned = !this.consultFormal && this.approverNames().length > 0;
    const round = upsertConsultRound({ request, notes: [], assigned });
    this.consultRounds = readConsultRounds();
    this.consultRoundId = round.id;
    this.consult = request;
    this.consultNotes = [];
    this.applicantNotices = [];
    this.consultPlan = null;
    writeApplicantNotices([]);
    writeConsultPlan(null);
    sessionStorage.removeItem(this.needConsultKey);
    this.needConsultAfterReject = false;
    if (this.filingGate?.state === 'rejected') {
      writeFilingGate(null);
      this.filingGate = null;
    }
    writeConsultAssigned(assigned);
    this.consultAssigned = assigned;
    sessionStorage.removeItem('dft-por1-consult-closed');
    sessionStorage.removeItem(this.consultJobKey);
    this.consultClosed = null;
    this.consultJobs = [];
    writeEofficeDirectorHandoff(null);
    this.eofficeDirector = readEofficeDirectorHandoff();
    writeConsultStep('receive');
    writeConsultGroup('');
    this.sideTalk = false;
    this.revising = false;
    this.viewingForm = false;
    this.watchAssign();
    this.openConsultPanel(round.id, this.consultFormal ? 'summary' : 'talk');
    this.consultOpen = false;
    this.consultFormal = false;
    this.publishGuide();
  }

  protected get consultWaitText(): string {
    const step = readConsultStep();
    if (step === 'receive' || step === 'forward') return 'รอเจ้าหน้าที่รับเรื่องมอบหมายให้ผู้อำนวยการ';
    if (step === 'director' || this.filingReturned) {
      return this.consultJobs.length ? 'รอหัวหน้ากลุ่มรับเรื่อง' : 'รอผู้อำนวยการมอบหมายกลุ่มในระบบ';
    }
    if (step === 'group') return 'รอหัวหน้ากลุ่มมอบหมายเจ้าหน้าที่ในกลุ่ม';
    return 'รอผู้ดูแล';
  }

  protected get consultWaitTag(): string {
    const step = readConsultStep();
    if (step === 'director' || this.filingReturned) return this.consultJobs.length ? 'รอหัวหน้ากลุ่ม' : 'รอผู้อำนวยการ';
    if (step === 'group') return 'รอหัวหน้ากลุ่ม';
    return 'รอเจ้าหน้าที่รับเรื่อง';
  }

  protected get consultLimitDetail(): string {
    const round = this.openConsultRound;
    if (!round) return 'ขอปรึกษาได้ทีละ 1 รอบ กรุณารอให้ปิดรอบปัจจุบันก่อน จึงขอรอบใหม่ได้';
    return `รอบ #${round.no} ยังเปิดอยู่ กรุณารอให้เจ้าหน้าที่ปิดรอบนี้ก่อน จึงจะขอปรึกษารอบใหม่ได้`;
  }

  /** แจ้งว่าขอปรึกษาได้ทีละ 1 รอบ — แล้วเปิดรอบปัจจุบันให้ดู */
  protected showConsultLimit(): void {
    this.consultOpen = false;
    this.consultLimitOpen = true;
  }

  protected dismissConsultLimit(openCurrent = false): void {
    this.consultLimitOpen = false;
    if (openCurrent && this.openConsultRound) this.openConsultPanel(this.openConsultRound.id, 'talk');
  }

  protected openConsult(): void {
    this.consultRounds = readConsultRounds();
    if (this.openConsultRound) {
      this.showConsultLimit();
      return;
    }
    this.consultFormal = true;
    if (this.needsNewConsult) {
      if (!this.consultTopic.trim() || this.consultTopic === 'ขอปรึกษาการแก้ไขคำขอ') {
        this.consultTopic = 'ขอปรึกษาใหม่หลังยื่นแบบไม่ผ่าน';
      }
      if (!this.consultDetail.trim() || this.consultDetail.includes('ต้องการให้นัดหมาย')) {
        const reason = this.filingGate?.reason?.trim();
        this.consultDetail = reason
          ? `ยื่นแบบทางการไม่ผ่าน: ${reason}\nต้องการปรึกษาเจ้าหน้าที่ก่อนยื่นใหม่`
          : 'ยื่นแบบทางการไม่ผ่าน ต้องการปรึกษาเจ้าหน้าที่ก่อนยื่นใหม่';
      }
    }
    this.consultOpen = true;
  }

  /** ปุ่มข้างประวัติคำขอ — เจ้าหน้าที่เข้าแผงได้เสมอ / ผู้ยื่นมีรอบเปิดแล้วเข้าแผง */
  protected requestConsultFromHeader(): void {
    if (this.reviewRole) {
      this.openConsultPanel(this.openConsultRound?.id || '', this.openConsultRound ? 'talk' : 'summary');
      return;
    }
    if (this.openConsultRound) {
      this.openConsultPanel(this.openConsultRound.id, 'talk');
      return;
    }
    this.openConsult();
  }

  protected openConsultPanel(roundId = '', tab: 'talk' | 'private' | 'summary' = 'talk'): void {
    this.consultRounds = readConsultRounds();
    const round = this.consultRounds.find((item) => item.id === roundId) || this.openConsultRound || this.consultRounds.at(-1) || null;
    this.consultRoundId = round?.id || '';
    this.consultPanelTab = tab;
    this.consultPrivateDraft = '';
    this.consultDraft = '';
    this.pendingFiles = [];
    if (round) {
      this.consult = round.request;
      this.consultNotes = round.notes;
      this.consultAssigned = round.assigned;
      this.shownCount = Math.min(12, round.notes.length);
      this.talkReady = true;
      this.talkLoading = false;
    }
    this.sideTalk = false;
    this.consultPanelOpen = true;
  }

  protected closeConsultPanel(): void {
    this.consultPanelOpen = false;
    this.consultPanelFull = false;
    this.consultPrivateDraft = '';
  }

  protected selectConsultRound(id: string): void {
    const round = this.consultRounds.find((item) => item.id === id);
    if (!round) return;
    this.consultRoundId = id;
    this.consult = round.request;
    this.consultNotes = round.notes;
    this.consultAssigned = round.assigned;
    this.shownCount = Math.min(12, round.notes.length);
    this.talkReady = true;
    this.consultDraft = '';
    this.consultPrivateDraft = '';
    this.pendingFiles = [];
  }

  protected saveConsultPrivateNote(): void {
    const round = this.selectedConsultRound;
    const text = this.consultPrivateDraft.trim();
    if (!round || !text) return;
    const note: ConsultPrivateNote = {
      id: `cnote-${Date.now()}`,
      at: this.replyStamp(),
      authorId: this.accounts.username,
      author: this.accounts.displayName,
      text,
    };
    this.consultRounds = patchConsultRound(round.id, { privateNotes: [note, ...round.privateNotes] });
    this.consultPrivateDraft = '';
  }

  protected removeConsultPrivateNote(id: string): void {
    const round = this.selectedConsultRound;
    if (!round) return;
    this.consultRounds = patchConsultRound(round.id, {
      privateNotes: round.privateNotes.filter((note) => note.id !== id || note.authorId !== this.accounts.username),
    });
  }

  protected openApplicantMenu(label: string): void {
    if (label === 'ยื่นคำร้องขอพบเจ้าหน้าที่' || label === 'รายการยื่นคำร้องขอพบเจ้าหน้าที่') {
      if (this.openConsultRound) this.openConsultPanel(this.openConsultRound.id, 'talk');
      else this.openConsult();
    }
  }

  protected openSideTalk(): void {
    if (this.openConsultRound) {
      this.openConsultPanel(this.openConsultRound.id, 'talk');
      return;
    }
    if (!this.consult && !this.hasConsultRounds) {
      this.consultFormal = false;
      this.consultTopic = this.caseStatus === 'revision' ? 'สอบถามการส่งข้อมูลเพิ่ม' : 'สอบถามระหว่างยื่นคำขอ';
      this.consultDetail = `คำขอเลขที่อ้างอิง ${this.refId}`;
      this.consultSlots = defaultConsultSlots();
      this.consultOpen = true;
      return;
    }
    this.openConsult();
  }

  protected talkReady = false;
  protected talkLoading = false;
  protected shownCount = 0;
  private talkTimer = 0;

  protected get shownNotes(): ConsultNote[] {
    const notes = this.consultPanelOpen ? this.selectedRoundNotes : this.consultNotes;
    return notes.slice(Math.max(0, notes.length - this.shownCount));
  }

  protected get talkHasMore(): boolean {
    const notes = this.consultPanelOpen ? this.selectedRoundNotes : this.consultNotes;
    return this.shownCount < notes.length;
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
      { from: 'applicant', text: 'ขอพบเพื่อชี้แจงหลักฐานราคา ตัวชี้วัดความเสียหาย และรายชื่อผู้ผลิตที่ร่วมยื่น', at: '15/05/2563 10:05' },
      { from: 'officer', text: `รับเรื่องแล้ว ${unit} จะนัดตามเวลาที่สะดวก`, at: '15/05/2563 10:18' },
      { from: 'applicant', text: 'สะดวกวันที่ 16 พฤษภาคม 2562 เวลา 10:00 น.', at: '15/05/2563 10:22' },
      { from: 'officer', text: 'รับทราบ จะนัดที่กรมการค้าต่างประเทศ ห้องประชุมของหน่วยงานผู้รับผิดชอบ', at: '15/05/2563 10:40' },
      { from: 'applicant', text: 'ขอส่งตารางเปรียบเทียบราคาเพิ่มในวันนัดได้หรือไม่', at: '15/05/2563 11:05' },
      { from: 'officer', text: 'ได้ นำมาในวันนัด หรือแนบในช่องนี้ก่อนเวลานัด', at: '15/05/2563 11:20' },
      { from: 'applicant', text: 'แนบตารางเปรียบเทียบราคาช่วงที่ขอให้ไต่สวน', at: '15/05/2563 14:10', files: [{ name: 'ตารางเปรียบเทียบราคา.pdf' }] },
      { from: 'officer', text: 'ได้รับไฟล์แล้ว จะตรวจความครบของช่วงเวลาก่อนวันนัด', at: '15/05/2563 14:32' },
      { from: 'applicant', text: 'ช่วงที่ยังขาดคือปลายปี 2561 ถึงต้นปี 2562', at: '15/05/2563 16:00' },
      { from: 'officer', text: 'ช่วยเพิ่มหลักฐานช่วงนั้น และตัวเลขปริมาณนำเข้าที่เชื่อมกับความเสียหาย', at: '15/05/2563 16:15' },
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
    const staff = !!this.reviewRole;
    const round = this.selectedConsultRound || this.openConsultRound;
    if ((!text && !this.pendingFiles.length) || !round || round.status !== 'open') return;
    const note: ConsultNote = {
      from: staff ? 'officer' : 'applicant',
      text,
      at: this.replyStamp(),
      files: this.pendingFiles.length ? this.pendingFiles : undefined,
    };
    const notes = [...round.notes, note];
    const assigned = round.assigned || staff;
    this.consultRounds = patchConsultRound(round.id, { notes, assigned });
    this.consultNotes = notes;
    this.consultAssigned = assigned;
    this.shownCount = Math.min(notes.length, this.shownCount + 1);
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
    writeFlowFile(null);
    this.becomeOfficial();
    sessionStorage.setItem('dft-por1-await-official', '0');
    sessionStorage.removeItem('dft-por1-consult-closed');
    sessionStorage.removeItem(this.consultJobKey);
    sessionStorage.setItem('dft-por1-filing-assign', 'wait');
    this.consultClosed = null;
    this.consultJobs = [];
    this.consultRounds = closeActiveConsultRound(this.replyStamp());
    writeEofficeDirectorHandoff(null);
    this.eofficeDirector = readEofficeDirectorHandoff();
    this.sendDirectorToEoffice('auto');
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
    // loop: ไม่อนุมัติ → ต้องขอปรึกษาใหม่ก่อนยื่นแบบอีกครั้ง
    sessionStorage.setItem(this.needConsultKey, '1');
    this.needConsultAfterReject = true;
    const open = findOpenConsultRound(this.consultRounds);
    if (open) {
      this.consultRounds = patchConsultRound(open.id, {
        status: 'closed',
        closedAt: gate.at,
        notes: [...open.notes, { from: 'officer', text: `ไม่อนุมัติยื่นแบบทางการ: ${gate.reason}`, at: gate.at }],
      });
    } else {
      this.consultRounds = closeActiveConsultRound(gate.at);
    }
    writeConsult(null);
    this.consult = null;
    writeConsultAssigned(false);
    this.consultAssigned = false;
    writeConsultPlan(null);
    this.consultPlan = null;
    this.consultNotes = [];
    sessionStorage.removeItem('dft-por1-consult-closed');
    sessionStorage.removeItem(this.consultJobKey);
    sessionStorage.setItem('dft-por1-await-official', '0');
    this.consultClosed = null;
    this.consultJobs = [];
    writeConsultStep('receive');
    writeConsultGroup('');
    writeEofficeDirectorHandoff(null);
    this.eofficeDirector = readEofficeDirectorHandoff();
    // สถานะคำขอแยกจากปรึกษา — กลับไปสถานะแก้ไข ไม่บังคับรอปรึกษา
    writeCaseStatus('revision');
    this.caseStatus = 'revision';
    this.publishGuide();
  }

  protected confirmOfficial(): void {
    const owners = consultFilingOwners();
    const needsApproval = owners.length > 0 && (this.awaitingOfficialFiling || this.hasConsultRounds || this.caseStatus === 'consult');
    sessionStorage.setItem('dft-por1-await-official', '0');
    this.useClickDate(this.replyStamp());
    this.officialOpen = false;
    this.consultOpen = false;
    this.revising = false;
    this.viewingForm = false;
    this.openedRound = null;
    writeFlowFile(null);
    if (needsApproval) {
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
      this.becomeOfficial();
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
        assignedOn: saved.assignedOn && saved.assignedOn !== '16/05/2562' ? saved.assignedOn : this.thaiToday(),
        dueOn: saved.dueOn && saved.dueOn !== '30/05/2562' ? saved.dueOn : this.thaiShift(14),
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
        assignedOn: this.thaiToday(),
        dueOn: this.thaiShift(14),
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

  /** ต้องมี tab เชิญเมื่อไม่ได้ยื่นครบเอง และมีผู้ร่วมตามมอบอำนาจ */
  protected get needsCofilerInvite(): boolean {
    return this.onBehalf && this.cofilerMode === 'invite';
  }

  protected get isCofilerMain(): boolean {
    return !this.needsCofilerInvite || this.cofilerView === 'main';
  }

  protected get activeCofilerInvite(): CofilerInvite | null {
    if (this.cofilerView === 'main') return null;
    return cofilerById(this.cofilerView) || null;
  }

  protected get canEditShared(): boolean {
    if (!this.needsCofilerInvite) return this.poaAllows('edit');
    return this.isCofilerMain && this.poaAllows('edit');
  }

  protected get cofilerInvites(): CofilerInvite[] {
    return listCofilerInvites(this.refId || this.formRef || filingRefId);
  }

  protected get cofilerPrivateVisible(): boolean {
    return !!this.activeCofilerInvite;
  }

  protected get poaKindLabel(): string {
    return this.poaKindOptions.find((item) => item.key === this.poaKind)?.label || '—';
  }

  protected get poaSamplesVisible(): {
    kind: 'person' | 'juristic' | 'sub';
    label: string;
    name: string;
    href: string;
    caseId: string;
  }[] {
    if (!this.poaAttached) return this.poaSamples;
    const matched = this.poaSamples.filter((item) => item.kind === this.poaKind);
    return matched.length ? matched : this.poaSamples;
  }

  protected poaSampleKindLabel(kind: 'person' | 'juristic' | 'sub'): string {
    return this.poaKindOptions.find((item) => item.key === kind)?.label || kind;
  }

  protected poaSampleOf(name: string): { name: string; href: string } | null {
    return this.poaSamples.find((item) => item.name === name) || null;
  }

  protected downloadPoaSample(file: { name: string; href: string }): void {
    void this.downloadAssetFile(file.href, file.name);
  }

  protected usePoaSample(file: {
    kind: 'person' | 'juristic' | 'sub';
    name: string;
    href: string;
  }): void {
    this.setPoaKind(file.kind);
    const grouped = this.groups['power'] ?? [];
    if (!grouped.includes(file.name)) {
      this.groups = { ...this.groups, power: [...grouped, file.name] };
    }
    this.docKey = 'power';
  }

  protected get poaFilingLabel(): string {
    if (this.filing === 'self') return 'ยื่นคำขอในนามของตนเอง';
    if (this.filing === 'all') return 'ยื่นคำขอ โดยกระทำการแทนผู้ผลิตทั้งหมด';
    return 'ยื่นคำขอ โดยกระทำการแทนผู้ผลิตบางส่วน';
  }

  protected get poaAnnexLabel(): string {
    if (this.filing === 'self') return 'ไม่ใช้ผนวก ก./ข. — ไม่บังคับผนวก ค.';
    if (this.filing === 'all') return 'ผนวก ก. รายชื่อผู้ผลิตทั้งหมด + ผนวก ค. หนังสือมอบอำนาจ';
    return 'ผนวก ข. ส่วนที่ 1–2 + ผนวก ค. หนังสือมอบอำนาจ';
  }

  protected get poaPowerSummary(): string {
    if (!this.poaAttached) return 'ยื่นเอง — ดำเนินการได้ครบในนามตนเอง';
    if (this.poaPowers.full) return 'ได้รับอำนาจเต็มตลอดกระบวนการ';
    const picked = this.poaPowerOptions.filter((item) => item.key !== 'full' && this.poaPowers[item.key]).map((item) => item.label);
    return picked.length ? picked.join(' · ') : 'ยังไม่ได้ระบุอำนาจตามเอกสาร';
  }

  protected poaAllows(power: 'file' | 'edit' | 'contact' | 'full'): boolean {
    if (!this.poaAttached) return true;
    if (this.poaPowers.full) return true;
    return !!this.poaPowers[power];
  }

  protected setPoaAttached(on: boolean): void {
    this.poaAttached = on;
    if (!on) {
      this.filing = 'self';
      this.docKey = 'cert';
      this.editingKey = '';
      return;
    }
    if (this.filing === 'self') this.filing = 'part';
    this.docKey = 'power';
  }

  protected setPoaScope(scope: 'all' | 'part'): void {
    this.poaAttached = true;
    this.filing = scope;
    this.docKey = 'power';
  }

  protected setPoaKind(kind: 'person' | 'juristic' | 'sub'): void {
    this.poaKind = kind;
    this.poaAttached = true;
    if (this.filing === 'self') this.filing = 'part';
    this.docKey = 'power';
  }

  protected togglePoaPower(key: 'file' | 'edit' | 'contact' | 'full'): void {
    if (key === 'full') {
      const next = !this.poaPowers.full;
      this.poaPowers = { file: next, edit: next, contact: next, full: next };
      return;
    }
    const next = {
      file: key === 'file' ? !this.poaPowers.file : this.poaPowers.file,
      edit: key === 'edit' ? !this.poaPowers.edit : this.poaPowers.edit,
      contact: key === 'contact' ? !this.poaPowers.contact : this.poaPowers.contact,
      full: false,
    };
    next.full = next.file && next.edit && next.contact;
    this.poaPowers = next;
  }

  protected setCofilerMode(mode: 'solo' | 'invite'): void {
    this.cofilerMode = mode;
    if (mode === 'solo') {
      this.formDeskTab = 'form';
      this.setCofilerView('main');
      return;
    }
    this.formDeskTab = 'invite';
  }

  protected openFormDesk(tab: 'form' | 'invite'): void {
    if (tab === 'invite' && !this.needsCofilerInvite) return;
    this.formDeskTab = tab;
    if (tab === 'invite' && this.isCofilerMain && !this.cofilerInvites.length) {
      this.seedCofilerFromMakers();
    }
  }

  protected setCofilerView(view: string): void {
    this.cofilerView = view === 'main' ? 'main' : view;
    writeCofilerView(this.cofilerView);
    if (this.cofilerView !== 'main') {
      const invite = cofilerById(this.cofilerView);
      if (invite && invite.status === 'sent') acceptCofilerInvite(invite.id, invite.email || invite.id);
      this.cofilerPrivateDraft = readCofilerPrivate(this.cofilerView);
      this.formDeskTab = 'form';
    }
  }

  protected seedCofilerFromMakers(): void {
    const ref = this.refId || this.formRef || filingRefId;
    const existing = new Set(listCofilerInvites(ref).map((item) => item.makerName));
    for (const row of this.makers) {
      const name = row.name.trim();
      if (!name || existing.has(name)) continue;
      addCofilerInvite({
        filingRef: ref,
        makerName: name,
        email: `${name.slice(0, 8).replace(/\s+/g, '').toLowerCase() || 'maker'}@example.com`,
        org: name,
      });
      existing.add(name);
    }
  }

  protected createCofilerInvite(): void {
    if (!this.isCofilerMain) return;
    const name = this.cofilerInviteName.trim();
    const email = this.cofilerInviteEmail.trim();
    if (!name || !email.includes('@')) return;
    const invite = addCofilerInvite({
      filingRef: this.refId || this.formRef || filingRefId,
      makerName: name,
      email,
      org: this.cofilerInviteOrg.trim() || name,
    });
    this.cofilerInviteName = '';
    this.cofilerInviteEmail = '';
    this.cofilerInviteOrg = '';
    this.copyCofilerLink(invite);
  }

  protected cofilerLinkOf(invite: CofilerInvite): string {
    return `${location.origin}${cofilerInvitePath(invite.id)}`;
  }

  protected copyCofilerLink(invite: CofilerInvite): void {
    const link = this.cofilerLinkOf(invite);
    void navigator.clipboard?.writeText(link).then(() => {
      this.cofilerCopied = link;
      window.setTimeout(() => {
        if (this.cofilerCopied === link) this.cofilerCopied = '';
      }, 2000);
    });
  }

  protected resendCofiler(invite: CofilerInvite): void {
    if (!this.isCofilerMain) return;
    resendCofilerInvite(invite.id);
    this.copyCofilerLink(invite);
  }

  protected revokeCofiler(invite: CofilerInvite): void {
    if (!this.isCofilerMain) return;
    revokeCofilerInvite(invite.id);
    if (this.cofilerView === invite.id) this.setCofilerView('main');
  }

  protected inviteStatusLabel(invite: CofilerInvite): string {
    return cofilerStatusLabel(invite.status);
  }

  protected inviteStatusTone(invite: CofilerInvite): 'neutral' | 'info' | 'success' | 'warning' | 'danger' {
    return cofilerStatusTone(invite.status);
  }

  protected invitePrivateLabel(invite: CofilerInvite): string {
    const status = cofilerPrivateStatus(invite.id);
    if (status === 'ready') return 'ส่งส่วนตัวแล้ว';
    if (status === 'draft') return 'กำลังกรอก (เนื้อหาลับ)';
    return 'ยังไม่มีข้อมูลส่วนตัว';
  }

  protected canSeeCofilerPrivate(inviteId: string): boolean {
    return this.cofilerView === inviteId;
  }

  protected saveActiveCofilerPrivate(): void {
    const invite = this.activeCofilerInvite;
    if (!invite) return;
    saveCofilerPrivate(invite.id, this.cofilerPrivateDraft);
    this.cofilerPrivateDraft = readCofilerPrivate(invite.id);
  }

  protected submitActiveCofilerPrivate(): void {
    const invite = this.activeCofilerInvite;
    if (!invite) return;
    this.saveActiveCofilerPrivate();
    markCofilerSubmitted(invite.id);
  }

  protected makerRowVisible(row: { name: string }): boolean {
    if (this.isCofilerMain || !this.needsCofilerInvite) return true;
    const invite = this.activeCofilerInvite;
    if (!invite) return false;
    return row.name.trim() === invite.makerName.trim();
  }

  protected makerContactVisible(row: { name: string }): boolean {
    if (!this.needsCofilerInvite) return true;
    if (this.isCofilerMain) return false;
    return !!this.activeCofilerInvite && row.name.trim() === this.activeCofilerInvite.makerName.trim();
  }

  protected get visibleDocs(): { key: string; label: string; accept: string; hint: string; behalf: boolean }[] {
    return this.supportDocs.filter((item) => !item.behalf || this.onBehalf);
  }

  protected get activeDoc(): { key: string; label: string; accept: string; hint: string; behalf: boolean } {
    return this.visibleDocs.find((item) => item.key === this.docKey) ?? this.visibleDocs[0];
  }

  protected openDoc(key: string): void {
    if (key === 'power' && !this.poaAllows('file')) return;
    this.docKey = key;
  }

  protected addRow(): void {
    if (!this.canEditShared) return;
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
    if (!this.canEditShared) return;
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
    if (!this.canEditShared) return;
    this.makers = this.makers.filter((_, item) => item !== index);
    if (!this.makers.length) this.makers = [emptyParty()];
    this.editingKey = '';
  }

  protected removeGood(index: number): void {
    if (!this.canEditShared) return;
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
    if ((key === 'power' || key === 'excel') && !this.poaAllows(key === 'excel' ? 'edit' : 'file')) {
      (event.target as HTMLInputElement).value = '';
      return;
    }
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
    if (key === 'power' && !this.poaAllows('file')) return;
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
    this.sectionHelpOpen = false;
    this.guideField = '';
    this.persistFormNav();
    this.publishGuide();
    this.view.detectChanges();
    scrollFormToTop(event);
  }

  private persistFormNav(): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        sec: this.section || null,
        nav: this.anchor || null,
      },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  private restoreFormNav(): void {
    const sec = this.route.snapshot.queryParamMap.get('sec');
    const nav = this.route.snapshot.queryParamMap.get('nav') ?? '';
    if (!sec && !nav) return;
    const links = this.formToc.flatMap((group) => group.items);
    const hit =
      links.find((item) => item.id === (sec || item.id) && (item.anchor ?? '') === nav) ||
      (nav ? links.find((item) => (item.anchor ?? '') === nav) : undefined) ||
      (sec ? links.find((item) => item.id === sec) : undefined);
    if (!hit) return;
    this.section = hit.id;
    this.anchor = hit.anchor ?? '';
  }

  protected current(item: TocLink): boolean {
    return this.section === item.id && this.anchor === (item.anchor ?? '');
  }

  protected filled(item: TocLink): boolean {
    return item.anchor !== 'part-4-5';
  }

  protected failed(item: TocLink): boolean {
    return this.issueFor(item) !== '';
  }

  protected groupFailed(group: TocGroup): boolean {
    return group.items.some((item) => this.failed(item));
  }

  protected get sectionNeedsFix(): boolean {
    return this.formToc.some((group) => group.items.some((item) => item.id === this.section && (!item.anchor || item.anchor === this.anchor) && this.failed(item)));
  }

  protected get checkForms(): { code: string; groups: TocGroup[] }[] {
    return [{ code: 'ปร. 1', groups: this.formToc }];
  }

  protected groupComplete(group: TocGroup): boolean {
    return group.items.every((item) => this.itemComplete(item));
  }

  protected get sectionsReady(): boolean {
    return this.formToc.every((group) => this.groupComplete(group));
  }

  protected itemComplete(item: TocLink): boolean {
    if (this.failed(item)) return false;
    const id = item.id;
    const anchor = item.anchor ?? '';
    if (id.startsWith('7') && !this.wantSubsidy) return !this.formView;
    if ((id === '4' || id === '5' || id === '6') && !this.wantDumping) return !this.formView;
    if (id === 'annex-a') return this.filing !== 'all' || this.makers.every((row) => this.hasText(row.name));
    if (id === 'annex-b') return this.filing !== 'part' || (this.makers.every((row) => this.hasText(row.name)) && this.hasText(this.outsideProducer));
    if (id === 'annex-c') return !this.onBehalf || this.namesOf('power').length > 0;
    if (id === 'other') return this.formView ? this.otherDocs.length > 0 : true;
    if (id === '1' && anchor === 'part-1-1') {
      if (!this.hasText(this.company) || !this.hasText(this.nationality) || !this.hasText(this.address) || !this.hasText(this.phone)) return false;
      return !this.onBehalf || (this.hasText(this.agent) && this.makers.every((row) => this.hasText(row.name)));
    }
    if (id === '1' && anchor === 'part-1-2') return this.hasText(this.relatedImport);
    if (id === '1' && anchor === 'part-1-3') return this.hasText(this.priorAid);
    if (id === '2') {
      return this.goodsCompare.every((row) => this.hasText(row.subject) || this.hasText(row.like)) && this.hasText(this.goodsDetail) && this.hasText(this.channelDetail);
    }
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
    if (id === '5' && anchor === 'part-5-2') return !this.hasText(this.relatedImport) || this.relatedImport.includes('ไม่') || this.hasText(this.exportConstructed);
    if (id === '5') return this.hasText(this.exportDetail);
    if (id === '6') {
      return this.marginCountries.some((row) => this.hasText(row.name) && this.hasText(row.normal) && this.hasText(row.exportPrice) && this.hasText(row.margin));
    }
    if (id === '7.1') return this.docsOf('subsidy').length > 0;
    if (id === '7.2') return this.hasText(this.explainDetail);
    if (id === '7.3') return this.hasText(this.subsidySpecific);
    if (id === '7.4') return this.hasText(this.subsidyBenefit);
    if (id === '8.1') return this.hasText(this.note('importDetail'));
    if (id === '8.2') return this.hasText(this.note('priceEffect')) && this.hasText(this.note('costEffect'));
    if (id === '8.3') return this.conditions.every((entry) => this.hasText(this.note(entry.key)));
    if (id === '8.4') return this.hasText(this.note('factorDetail'));
    if (id === '8.5') return this.hasText(this.note('summaryDetail'));
    if (id === '8.6') return this.hasText(this.note('buyerDetail'));
    if (id === '8.7') return this.hasText(this.note('trendCapacity')) && this.hasText(this.note('trendPrice')) && this.hasText(this.note('trendOther'));
    if (id === '8.8') return this.hasText(this.note('intentDetail'));
    if (id === '9' && anchor === 'part-9-letter') {
      return (
        this.hasText(this.letterNo) &&
        this.hasText(this.letterDate) &&
        this.hasText(this.letterSubject) &&
        this.hasText(this.letterTo) &&
        this.hasText(this.letterBody) &&
        this.hasText(this.letterPurpose) &&
        !!this.signatureUrl
      );
    }
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
    this.refId = filingRefId;
    writeActiveFilingRef(this.refId);
    if (this.caseStatus === 'official' || !readOfficialOn()) {
      this.syncAmendClock(readOfficialOn() || firstFiledOn);
    }
    const early = this.caseStatus === 'draft' || this.caseStatus === 'review' || this.caseStatus === 'revision' || this.caseStatus === 'consult' || this.caseStatus === 'approval' || this.caseStatus === 'official';
    if (!early || this.consultJobs.length) return;
    this.docSent = false;
    this.docAction = 'amend';
    this.committeeSent = false;
    this.inquiryOpen = '';
    this.inquiryNoticeSent = false;
    this.laterPhase = { ...this.laterPhase, visit: false, prelim: false, draftFinal: false, finalResult: false, measures: false };
    writeLaterPhase(this.laterPhase);
    writeDocNotice(null);
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
    this.refId = item.ref || filingRefId;
    writeActiveFilingRef(this.refId);
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
    if (mine && (mine.reply !== 'accept' || mine.result)) return;
    this.resultDetail = this.defaultResultDetail();
    this.resultSigned = true;
  }

  ngOnInit(): void {
    const picked = this.pickedMeasure();
    if (!this.reviewRole && picked === 'cvd') {
      this.wantDumping = false;
      this.wantSubsidy = true;
    } else if (!this.reviewRole && picked === 'ad') {
      this.wantDumping = true;
      this.wantSubsidy = false;
    }
    if (!this.reviewRole && this.accounts.username && !readFilingFiler()) {
      writeFilingFiler(this.accounts.username);
    }
    this.loadDraftAgendaVersions();
    this.syncCertForMeasure();
    this.caseStatus = readCaseStatus();
    // แยกชั้นปรึกษาออกจากสถานะคำขอ — ค่าเก่า consult ย้ายเป็น revision
    if (!this.reviewRole && this.caseStatus === 'consult') {
      writeCaseStatus('revision');
      this.caseStatus = 'revision';
    }
    // ยื่นแบบแล้วแต่ผลตรวจเก่ายังค้าง → ล้างให้แท็กตรงกับสถานะคำขอ
    if ((this.caseStatus === 'official' || this.caseStatus === 'approval') && readFlowFile()?.state === 'fix') {
      writeFlowFile(null);
    }
    this.filingGate = readFilingGate();
    this.needConsultAfterReject = sessionStorage.getItem(this.needConsultKey) === '1';
    this.caseNotes = readCaseNotes();
    this.noteReads = readNoteReads(this.accounts.username);
    this.laterPhase = readLaterPhase();
    this.inviteSent = !!this.laterPhase.notes['invite-sent'];
    this.restoreWorkNotes();
    this.loadDocNotice();
    this.loadWorkDrafts();
    this.loadMadeDocs();
    this.seedCommitteePack();
    this.rounds = readRounds();
    if (this.reviewRole) {
      this.ensureRoundFolders();
    } else if (this.rounds.length) {
      const today = this.prototypeActionDay();
      let folderFixed = false;
      this.rounds = this.rounds.map((round) => {
        const on = round.round <= 1 ? today : round.submittedOn;
        const folder = this.roundFolderName(round.round, on);
        if (round.folder === folder && round.submittedOn === on) return round;
        folderFixed = true;
        return { ...round, submittedOn: on, folder };
      });
      if (folderFixed) writeRounds(this.rounds);
    } else {
      this.ensureRoundFolders();
    }
    this.consultRounds = readConsultRounds();
    this.consult = readConsult() || this.openConsultRound?.request || this.consultRounds.at(-1)?.request || null;
    this.consultRoundId = this.openConsultRound?.id || this.consultRounds.at(-1)?.id || '';
    if (this.consult?.channel) this.consultChannel = this.consult.channel;
    if (this.consult?.contactName) this.consultContactName = this.consult.contactName;
    if (this.consult?.contactPhone) this.consultContactPhone = this.consult.contactPhone;
    if (this.consult?.slots?.length) this.consultSlots = this.consult.slots.map((slot) => ({ ...slot }));
    this.consultNotes = this.openConsultRound?.notes || readConsultThread();
    this.consultAssigned = this.openConsultRound?.assigned ?? readConsultAssigned();
    this.consultPlan = readConsultPlan();
    if (this.reviewRole) {
      if (releaseFilingToDirector()) {
        this.consultJobs = [];
        this.consultClosed = null;
        this.eofficeDirector = readEofficeDirectorHandoff();
      }
      this.viewingForm = true;
      this.ensureAssignment();
      this.ensureDirectorEoffice();
      const asked = this.route.snapshot.queryParamMap.get('tab');
      const assignNow = this.reviewRole === 'director' && (this.caseStatus === 'official' || this.caseStatus === 'approval') && !this.consultJobs.length;
      const noticeAwaitingHead = this.noticePipe === 'to-head' && !this.docSent;
      const docsNow = (asked === 'docs' || noticeAwaitingHead) && !this.docsPassed && this.showReviewTab('docs') && !this.reviewLocked('docs');
      this.reviewTab = asked === 'assign' && this.showReviewTab('assign')
        ? 'assign'
        : docsNow
          ? 'docs'
          : assignNow
          ? 'assign'
          : this.reviewRole === 'external' ? 'docs' : this.reviewRole === 'bureau' || this.reviewRole === 'committee' || this.reviewRole === 'interest' ? 'inquiry' : this.docsPassed ? 'inquiry' : this.officerAcceptedFiling() ? 'docs' : 'form';
      if (this.reviewTab === 'assign' && this.route.snapshot.queryParamMap.get('pending') === '1' && this.canViewPendingAssign) {
        this.pendingAssignOpen = true;
      }
      if (this.reviewTab === 'docs' && (asked === 'docs' || noticeAwaitingHead)) {
        // ข้ามมาที่แจ้งคำขอครบถ้วนถูกต้อง + ส่วนแบบคำขอฉบับเปิดเผย (เจ้าหน้าที่ /docs)
        if (this.reviewRole === 'officer' && (asked === 'docs' || this.route.snapshot.queryParamMap.get('jump') === 'complete')) {
          this.jumpToCompleteOpenEdition();
        } else {
          this.pickDoc(this.workDocs.length);
          if (noticeAwaitingHead && this.reviewRole === 'head') this.openNoticeForm();
        }
      }
      if (this.reviewTab === 'inquiry') this.placeInquiry();
      this.ensureReceipt();
      this.seedConsultDraft();
      this.seedResultDraft();
    }
    if (this.caseStatus === 'approval' && !this.consult) {
      this.becomeOfficial(readOfficialOn() || firstFiledOn);
    }
    if (this.reviewRole) this.ensureLinks();
    if (this.caseStatus === 'review' && this.rounds.length === 0) {
      this.ensureRoundFolders();
    }
    if (this.caseStatus === 'review' && !readFlowFile()) this.armReview();
    this.keepOfficialWait();
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
    this.restoreFormNav();
    this.publishGuide();
    this.useClickDate();
    if (this.reviewRole) this.restoreFilingUrl();
    this.filingUrlReady = true;
    this.syncFilingUrl();
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
    this.becomeOfficial();
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
    if (this.amendLayoutRaf) cancelAnimationFrame(this.amendLayoutRaf);
    this.pinDragUnlisten?.();
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
      for (const row of this.goodsCompare) {
        see(row.item + ' (สินค้าที่ถูกพิจารณา)', row.subject);
        see(row.item + ' (สินค้าชนิดเดียวกัน)', row.like);
      }
      see('สรุปชื่อและลักษณะสินค้า', this.goodsDetail);
      see('สรุปช่องทางจำหน่ายและผู้ใช้สินค้า', this.channelDetail);
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
    } else if (section === '5' && anchor === 'part-5-2') {
      fieldsChecked = true;
      see('ราคาส่งออกที่คำนวณขึ้น', this.exportConstructed);
      attachments.push(this.fileMeta('เอกสารราคาส่งออกที่คำนวณขึ้น', false, this.docsOf('export')));
    } else if (section === '5') {
      fieldsChecked = true;
      see('รายละเอียดราคาส่งออก', this.exportDetail);
      attachments.push(this.fileMeta('เอกสารราคาส่งออก', true, this.docsOf('export')));
    } else if (section === '6') {
      fieldsChecked = true;
      see('หน่วยราคา', this.marginUnit);
      for (const col of this.marginCountries) {
        see(`ประเทศ ${col.name || '(ยังไม่ระบุ)'}`, col.name);
        see(`มูลค่าปกติ ${col.name}`, col.normal);
        see(`ราคาส่งออก ${col.name}`, col.exportPrice);
        see(`ส่วนเหลื่อม ${col.name}`, col.margin);
      }
      attachments.push(this.fileMeta('เอกสารส่วนเหลื่อมการทุ่มตลาด', false, this.docsOf('margin')));
    } else if (section.startsWith('7')) {
      sectionRequired = this.wantSubsidy;
      fieldsChecked = section === '7.1' || section === '7.2' || section === '7.3' || section === '7.4';
      if (section === '7.2') see('รายละเอียดการอุดหนุน', this.explainDetail);
      if (section === '7.3') see('การอุดหนุนเจาะจง', this.subsidySpecific);
      if (section === '7.4') see('ประโยชน์ที่ผู้ส่งออกได้รับ', this.subsidyBenefit);
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
      if (anchor === 'part-9-letter') {
        see('วันที่หนังสือ', this.letterDate);
        see('ที่', this.letterNo);
        see('เรื่อง', this.letterSubject);
        see('เรียน', this.letterTo);
        see('อ้างถึง', this.letterRef);
        see('รายละเอียดหนังสือนำส่ง', this.letterBody);
        see('ความประสงค์ให้พิจารณา', this.letterPurpose);
        see('รูปลายเซ็นหนังสือนำส่ง', this.signatureUrl);
        see('ตราประทับบริษัท', this.sealUrl);
        if (this.letterDate.trim() && !/^\d{2}\/\d{2}\/\d{4}$/.test(this.letterDate.trim())) {
          errors.push({ id: 'nav:9|part-9-letter::วันที่หนังสือ', label: 'วันที่หนังสือ', hint: 'ใช้รูปแบบ วัน/เดือน/ปี' });
        }
        checked.push('หนังสือนำส่ง');
      } else {
        see('ข้อความคำรับรอง', this.pledgeText);
        see('คำรับรอง', this.ack ? 'รับรอง' : '');
        see('ผู้ลงนาม', this.signer);
        see('ชื่อตัวบรรจง', this.signerPrint);
        see('ตำแหน่ง', this.roleTitle);
        see('วันที่ลงนาม', this.signedOn);
        see('รูปลายเซ็น', this.signatureUrl);
        if (this.signedOn.trim() && !/^\d{2}\/\d{2}\/\d{4}$/.test(this.signedOn.trim())) {
          errors.push({ id: 'nav:9|part-9-pledge::วันที่ลงนาม', label: 'วันที่ลงนาม', hint: 'ใช้รูปแบบ วัน/เดือน/ปี' });
        }
        checked.push('คำรับรองและลงนาม');
      }
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
      measureType: this.wantDumping && this.wantSubsidy ? 'AD+CVD' : this.wantSubsidy ? 'CVD' : 'AD',
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
