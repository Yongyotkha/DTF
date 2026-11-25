/**
 * PowerPoint อนุไต่สวน — สร้างไฟล์ .pptx จาก "ไฟล์ข้อมูล" (deck.json)
 *
 * deck.json ถูกถอดจากไฟล์ตัวอย่างจริงด้วย tools/pptx-to-deck.py (ครบทุกสไลด์ ทุกตาราง ทุกรูป)
 * ตัวสร้างนี้ใช้ไฟล์ตัวอย่างเป็นเทมเพลต (theme / master / layout / รูปภาพ ใช้ของเดิม)
 * แล้วเขียนสไลด์ทั้งหมดใหม่จากไฟล์ข้อมูล จึงได้ไฟล์ .pptx ที่เปิดแก้ใน PowerPoint ได้จริง
 */
import JSZip from 'jszip';

export interface DeckRun {
  text: string;
  size: number;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  sup?: boolean;
  color?: string;
  font?: string;
  cs?: string;
  spc?: number;
  br?: boolean;
  field?: 'slidenum';
}

export interface DeckBullet {
  char?: string;
  auto?: string;
  font?: string;
  color?: string;
  sizePct?: number;
}

export interface DeckPara {
  align: string;
  level: number;
  runs: DeckRun[];
  endSize?: number;
  bullet?: DeckBullet;
  marL?: number;
  indent?: number;
  spaceAfter?: number;
  spaceBefore?: number;
  lineSpacingPct?: number;
}

export interface DeckFill {
  color: string;
  alpha?: number;
}

export interface DeckLine {
  color: string;
  w: number;
}

export interface DeckText {
  type: 'text';
  name?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  shape?: string;
  anchor?: string;
  insets?: [number, number, number, number];
  fill?: DeckFill | null;
  line?: DeckLine | null;
  placeholder?: string | null;
  paragraphs: DeckPara[];
}

export interface DeckSlideNumber {
  type: 'slidenum';
  x: number;
  y: number;
  w: number;
  h: number;
  size: number;
  color: string;
  font: string;
  align: string;
}

export interface DeckImage {
  type: 'image';
  src: string;
  x: number;
  y: number;
  w: number;
  h: number;
  alt?: string;
}

export interface DeckPoly {
  type: 'poly';
  deco?: boolean;
  points: [number, number][];
  fill: DeckFill;
}

export interface DeckCell {
  paragraphs: DeckPara[];
  anchor?: string;
  insets?: [number, number, number, number];
  fill?: string | null;
  borders?: Partial<Record<'t' | 'r' | 'b' | 'l', DeckLine | null>>;
  colSpan?: number;
  rowSpan?: number;
  hMerge?: boolean;
  vMerge?: boolean;
}

export interface DeckTable {
  type: 'table';
  x: number;
  y: number;
  w: number;
  h: number;
  colW: number[];
  rows: { h: number; cells: DeckCell[] }[];
}

export type DeckElement = DeckText | DeckSlideNumber | DeckImage | DeckPoly | DeckTable;

export interface DeckSlide {
  no: number;
  layout?: string;
  elements: DeckElement[];
}

export interface DeckData {
  source?: string;
  slideWidth: number;
  slideHeight: number;
  font?: string;
  slideCount: number;
  slides: DeckSlide[];
}

export const DECK_BASE = 'assets/samples/ad1046/agenda/sub/deck/';
export const DECK_JSON_URL = DECK_BASE + 'deck.json';
export const DECK_MEDIA_BASE = DECK_BASE + 'media/';
export const DECK_TEMPLATE_URL = 'assets/samples/ad1046/agenda/sub/3. PowerPoint อนุ ทตอ 3 พย 63.pptx';
export const PPTX_MIME = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';

// ───────────────────────────── helpers ─────────────────────────────

const NS_A = 'http://schemas.openxmlformats.org/drawingml/2006/main';
const NS_R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const NS_P = 'http://schemas.openxmlformats.org/presentationml/2006/main';
const REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const XML_HEAD = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';

// eslint-disable-next-line no-control-regex
const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g;

function esc(text: string): string {
  return String(text ?? '')
    .replace(CONTROL, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const emu = (inch: number) => Math.round((inch || 0) * 914400);
const hex = (c: string | undefined | null) => (c || '000000').replace('#', '').toUpperCase();

function solid(color: string, alpha?: number): string {
  const a = alpha != null && alpha < 100 ? `<a:alpha val="${Math.round(alpha * 1000)}"/>` : '';
  return `<a:solidFill><a:srgbClr val="${hex(color)}">${a}</a:srgbClr></a:solidFill>`;
}

function lineXml(tag: string, line: DeckLine | null | undefined): string {
  if (!line) return `<a:${tag} w="12700"><a:noFill/></a:${tag}>`;
  return `<a:${tag} w="${Math.round(line.w * 12700)}" cap="flat" cmpd="sng" algn="ctr">${solid(line.color)}<a:prstDash val="solid"/></a:${tag}>`;
}

const ANCHOR: Record<string, string> = { t: 't', ctr: 'ctr', b: 'b' };

function rPrXml(tag: 'a:rPr' | 'a:endParaRPr', run: Partial<DeckRun> & { size: number }): string {
  const attrs = [
    'lang="th-TH"',
    `sz="${Math.round(run.size * 100)}"`,
    `b="${run.bold ? 1 : 0}"`,
    run.italic ? 'i="1"' : '',
    run.underline ? 'u="sng"' : '',
    run.spc ? `spc="${run.spc}"` : '',
    run.sup ? 'baseline="30000"' : '',
    'dirty="0"',
  ]
    .filter(Boolean)
    .join(' ');
  const fill = run.color ? solid(run.color) : '';
  const latin = run.font ? `<a:latin typeface="${esc(run.font)}"/>` : '';
  const cs = run.cs ? `<a:cs typeface="${esc(run.cs)}"/>` : '';
  return `<${tag} ${attrs}>${fill}${latin}${cs}</${tag}>`;
}

function runXml(run: DeckRun): string {
  if (run.br) return `<a:br>${rPrXml('a:rPr', run)}</a:br>`;
  if (run.field === 'slidenum') {
    return `<a:fld id="{B6F15528-21DE-4FAA-801E-634DDDAF4B2B}" type="slidenum">${rPrXml('a:rPr', run)}<a:t>${esc(run.text)}</a:t></a:fld>`;
  }
  return `<a:r>${rPrXml('a:rPr', run)}<a:t>${esc(run.text)}</a:t></a:r>`;
}

const ALIGN: Record<string, string> = { l: 'l', ctr: 'ctr', r: 'r', just: 'just', thaiDist: 'thaiDist', dist: 'dist' };

function paraXml(p: DeckPara): string {
  // ค่าที่ไฟล์ข้อมูลไม่ระบุ = 0 / 100% จริง ต้องเขียนลงไปตรง ๆ ไม่ให้ไปสืบทอดค่าจาก master
  const attrs = [
    `marL="${emu(p.marL ?? 0)}"`,
    `indent="${emu(p.indent ?? 0)}"`,
    p.level ? `lvl="${p.level}"` : '',
    `algn="${ALIGN[p.align] ?? 'l'}"`,
  ]
    .filter(Boolean)
    .join(' ');
  let inner = `<a:lnSpc><a:spcPct val="${Math.round((p.lineSpacingPct ?? 100) * 1000)}"/></a:lnSpc>`;
  inner += `<a:spcBef><a:spcPts val="${Math.round((p.spaceBefore ?? 0) * 100)}"/></a:spcBef>`;
  inner += `<a:spcAft><a:spcPts val="${Math.round((p.spaceAfter ?? 0) * 100)}"/></a:spcAft>`;
  const b = p.bullet;
  if (b && (b.char || b.auto)) {
    if (b.color) inner += `<a:buClr><a:srgbClr val="${hex(b.color)}"/></a:buClr>`;
    if (b.sizePct) inner += `<a:buSzPct val="${Math.round(b.sizePct * 1000)}"/>`;
    if (b.font) inner += `<a:buFont typeface="${esc(b.font)}"/>`;
    inner += b.auto ? `<a:buAutoNum type="${esc(b.auto)}"/>` : `<a:buChar char="${esc(b.char || '•')}"/>`;
  } else {
    inner += '<a:buNone/>';
  }
  const pPr = `<a:pPr ${attrs}>${inner}</a:pPr>`;
  const runs = p.runs.map(runXml).join('');
  const lastSize = p.endSize ?? p.runs[p.runs.length - 1]?.size ?? 18;
  const lastFont = p.runs[p.runs.length - 1];
  const end = rPrXml('a:endParaRPr', { size: lastSize, font: lastFont?.font, cs: lastFont?.cs, color: lastFont?.color });
  return `<a:p>${pPr}${runs}${end}</a:p>`;
}

function parasXml(paras: DeckPara[]): string {
  if (!paras.length) return '<a:p><a:endParaRPr lang="th-TH"/></a:p>';
  return paras.map(paraXml).join('');
}

// ───────────────────────────── elements ─────────────────────────────

class SlideBuilder {
  private nextId = 2;
  private rels: { id: string; type: string; target: string }[] = [];
  private imageRel = new Map<string, string>();

  constructor(private readonly slide: DeckSlide, private readonly layout: string) {
    this.rels.push({ id: 'rId1', type: `${REL}/slideLayout`, target: `../slideLayouts/${layout}` });
  }

  private id(): number {
    return this.nextId++;
  }

  private rid(src: string): string {
    let id = this.imageRel.get(src);
    if (!id) {
      id = `rId${this.rels.length + 1}`;
      this.imageRel.set(src, id);
      this.rels.push({ id, type: `${REL}/image`, target: `../media/${src}` });
    }
    return id;
  }

  private xfrm(e: { x: number; y: number; w: number; h: number }, tag = 'a:xfrm'): string {
    return `<${tag}><a:off x="${emu(e.x)}" y="${emu(e.y)}"/><a:ext cx="${emu(e.w)}" cy="${emu(e.h)}"/></${tag}>`;
  }

  private text(e: DeckText): string {
    const ph = e.placeholder && ['title', 'ctrTitle', 'subTitle'].includes(e.placeholder) ? e.placeholder : '';
    const [l, t, r, b] = e.insets ?? [0.1, 0.05, 0.1, 0.05];
    const fill = e.fill ? solid(e.fill.color, e.fill.alpha) : '<a:noFill/>';
    const line = e.line ? lineXml('ln', e.line) : '<a:ln><a:noFill/></a:ln>';
    const geom = `<a:prstGeom prst="${esc(e.shape || 'rect')}"><a:avLst/></a:prstGeom>`;
    const cNv = ph ? '<p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr>' : '<p:cNvSpPr/>';
    const nvPr = ph ? `<p:nvPr><p:ph type="${ph}"/></p:nvPr>` : '<p:nvPr/>';
    return (
      `<p:sp><p:nvSpPr><p:cNvPr id="${this.id()}" name="${esc(e.name || 'ข้อความ')}"/>${cNv}${nvPr}</p:nvSpPr>` +
      `<p:spPr>${this.xfrm(e)}${geom}${fill}${line}</p:spPr>` +
      `<p:txBody><a:bodyPr wrap="square" lIns="${emu(l)}" tIns="${emu(t)}" rIns="${emu(r)}" bIns="${emu(b)}" ` +
      `rtlCol="0" anchor="${ANCHOR[e.anchor || 't'] ?? 't'}"><a:noAutofit/></a:bodyPr><a:lstStyle/>${parasXml(e.paragraphs)}</p:txBody></p:sp>`
    );
  }

  private slideNumber(e: DeckSlideNumber): string {
    const run: DeckRun = {
      text: String(this.slide.no),
      size: e.size,
      color: e.color,
      font: e.font,
      field: 'slidenum',
    };
    const para: DeckPara = { align: e.align || 'r', level: 0, runs: [run], endSize: e.size };
    return (
      `<p:sp><p:nvSpPr><p:cNvPr id="${this.id()}" name="หมายเลขสไลด์"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>` +
      `<p:spPr>${this.xfrm(e)}<a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/></p:spPr>` +
      `<p:txBody><a:bodyPr wrap="square" lIns="91440" tIns="45720" rIns="91440" bIns="45720" rtlCol="0" anchor="ctr"><a:noAutofit/></a:bodyPr><a:lstStyle/>${paraXml(para)}</p:txBody></p:sp>`
    );
  }

  private image(e: DeckImage): string {
    const rid = this.rid(e.src);
    return (
      `<p:pic><p:nvPicPr><p:cNvPr id="${this.id()}" name="${esc(e.alt || 'รูปภาพ')}" descr="${esc(e.alt || '')}"/>` +
      `<p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr/></p:nvPicPr>` +
      `<p:blipFill><a:blip r:embed="${rid}"/><a:stretch><a:fillRect/></a:stretch></p:blipFill>` +
      `<p:spPr>${this.xfrm(e)}<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:pic>`
    );
  }

  private table(e: DeckTable): string {
    const grid = e.colW.map((w) => `<a:gridCol w="${emu(w)}"/>`).join('');
    const rows = e.rows
      .map((row) => {
        const cells = row.cells
          .map((c) => {
            const attrs = [
              c.colSpan && c.colSpan > 1 ? `gridSpan="${c.colSpan}"` : '',
              c.rowSpan && c.rowSpan > 1 ? `rowSpan="${c.rowSpan}"` : '',
              c.hMerge ? 'hMerge="1"' : '',
              c.vMerge ? 'vMerge="1"' : '',
            ]
              .filter(Boolean)
              .join(' ');
            const [l, t, r, b] = c.insets ?? [0.1, 0.05, 0.1, 0.05];
            const bd = c.borders
              ? lineXml('lnL', c.borders.l) + lineXml('lnR', c.borders.r) + lineXml('lnT', c.borders.t) + lineXml('lnB', c.borders.b)
              : '';
            const fill = c.fill ? solid(c.fill) : '<a:noFill/>';
            return (
              `<a:tc${attrs ? ' ' + attrs : ''}><a:txBody><a:bodyPr/><a:lstStyle/>${parasXml(c.paragraphs)}</a:txBody>` +
              `<a:tcPr marL="${emu(l)}" marR="${emu(r)}" marT="${emu(t)}" marB="${emu(b)}" anchor="${ANCHOR[c.anchor || 't'] ?? 't'}">${bd}${fill}</a:tcPr></a:tc>`
            );
          })
          .join('');
        return `<a:tr h="${emu(row.h)}">${cells}</a:tr>`;
      })
      .join('');
    return (
      `<p:graphicFrame><p:nvGraphicFramePr><p:cNvPr id="${this.id()}" name="ตาราง"/>` +
      `<p:cNvGraphicFramePr><a:graphicFrameLocks noGrp="1"/></p:cNvGraphicFramePr><p:nvPr/></p:nvGraphicFramePr>` +
      this.xfrm(e, 'p:xfrm') +
      `<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/table"><a:tbl>` +
      `<a:tblPr/><a:tblGrid>${grid}</a:tblGrid>${rows}</a:tbl></a:graphicData></a:graphic></p:graphicFrame>`
    );
  }

  build(): { xml: string; rels: string } {
    const body = this.slide.elements
      .map((e) => {
        switch (e.type) {
          case 'text':
            return this.text(e);
          case 'slidenum':
            return this.slideNumber(e);
          case 'image':
            return this.image(e);
          case 'table':
            return this.table(e);
          default:
            return ''; // poly = ลวดลายของเลย์เอาต์ อยู่ในไฟล์เทมเพลตอยู่แล้ว
        }
      })
      .join('');
    const xml =
      XML_HEAD +
      `<p:sld xmlns:a="${NS_A}" xmlns:r="${NS_R}" xmlns:p="${NS_P}"><p:cSld><p:spTree>` +
      `<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>` +
      `<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>` +
      `${body}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>`;
    const rels =
      XML_HEAD +
      `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
      this.rels.map((r) => `<Relationship Id="${r.id}" Type="${r.type}" Target="${r.target}"/>`).join('') +
      `</Relationships>`;
    return { xml, rels };
  }
}

// ───────────────────────────── package ─────────────────────────────

export interface BuildDeckOptions {
  title?: string;
}

/** เขียนสไลด์ทั้งหมดจาก deck ลงบนแพ็กเกจเทมเพลต แล้วคืนไฟล์ .pptx */
export async function buildDeckPptx(
  deck: DeckData,
  template: ArrayBuffer | Uint8Array,
  options: BuildDeckOptions = {},
): Promise<Blob> {
  const zip = await JSZip.loadAsync(template);

  // 1) ลบสไลด์เดิมและโน้ตของสไลด์เดิม
  Object.keys(zip.files)
    .filter((p) => p.startsWith('ppt/slides/') || p.startsWith('ppt/notesSlides/'))
    .forEach((p) => zip.remove(p));

  // 2) เขียนสไลด์ใหม่
  deck.slides.forEach((slide, i) => {
    const n = i + 1;
    const built = new SlideBuilder(slide, slide.layout || 'slideLayout2.xml').build();
    zip.file(`ppt/slides/slide${n}.xml`, built.xml);
    zip.file(`ppt/slides/_rels/slide${n}.xml.rels`, built.rels);
  });

  // 3) [Content_Types].xml
  const ctFile = zip.file('[Content_Types].xml');
  if (!ctFile) throw new Error('ไม่พบ [Content_Types].xml ในไฟล์เทมเพลต');
  let ct = await ctFile.async('string');
  ct = ct.replace(/<Override [^>]*PartName="\/ppt\/(slides|notesSlides)\/[^"]*"[^>]*\/>/g, '');
  const slideOverrides = deck.slides
    .map(
      (_, i) =>
        `<Override PartName="/ppt/slides/slide${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`,
    )
    .join('');
  ct = ct.replace('</Types>', `${slideOverrides}</Types>`);
  zip.file('[Content_Types].xml', ct);

  // 4) ppt/_rels/presentation.xml.rels — ตัดความสัมพันธ์สไลด์เดิม ใส่ของใหม่
  const relPath = 'ppt/_rels/presentation.xml.rels';
  let rels = await zip.file(relPath)!.async('string');
  rels = rels.replace(/<Relationship [^>]*Type="[^"]*\/relationships\/slide"[^>]*\/>/g, '');
  const slideRels = deck.slides
    .map((_, i) => `<Relationship Id="rIdSlide${i + 1}" Type="${REL}/slide" Target="slides/slide${i + 1}.xml"/>`)
    .join('');
  rels = rels.replace('</Relationships>', `${slideRels}</Relationships>`);
  zip.file(relPath, rels);

  // 5) ppt/presentation.xml — รายการสไลด์
  let pres = await zip.file('ppt/presentation.xml')!.async('string');
  const idList =
    '<p:sldIdLst>' +
    deck.slides.map((_, i) => `<p:sldId id="${256 + i}" r:id="rIdSlide${i + 1}"/>`).join('') +
    '</p:sldIdLst>';
  if (!/<p:sldIdLst>[\s\S]*?<\/p:sldIdLst>/.test(pres)) throw new Error('ไม่พบ sldIdLst ในไฟล์เทมเพลต');
  pres = pres.replace(/<p:sldIdLst>[\s\S]*?<\/p:sldIdLst>/, idList);
  zip.file('ppt/presentation.xml', pres);

  // 6) docProps — จำนวนสไลด์ / ชื่อเรื่อง (ตัดรายการชื่อสไลด์เดิมที่ไม่ตรงแล้ว)
  zip.file(
    'docProps/app.xml',
    XML_HEAD +
      '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" ' +
      'xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">' +
      `<TotalTime>0</TotalTime><Application>Microsoft Office PowerPoint</Application><PresentationFormat>On-screen Show (4:3)</PresentationFormat>` +
      `<Slides>${deck.slides.length}</Slides><Notes>0</Notes><HiddenSlides>0</HiddenSlides></Properties>`,
  );
  if (options.title) {
    const core = zip.file('docProps/core.xml');
    if (core) {
      let c = await core.async('string');
      c = /<dc:title>[\s\S]*?<\/dc:title>|<dc:title\/>/.test(c)
        ? c.replace(/<dc:title>[\s\S]*?<\/dc:title>|<dc:title\/>/, `<dc:title>${esc(options.title)}</dc:title>`)
        : c.replace('</cp:coreProperties>', `<dc:title>${esc(options.title)}</dc:title></cp:coreProperties>`);
      zip.file('docProps/core.xml', c);
    }
  }

  return zip.generateAsync({ type: 'blob', mimeType: PPTX_MIME, compression: 'DEFLATE' });
}

// ───────────────────────────── preview (HTML) ─────────────────────────────

const PREVIEW_FONTS = `'Sarabun','Tahoma','Noto Sans Thai',sans-serif`;

/** ฟอนต์ไทยแบบ PSK/UPC ตัวเล็กกว่าฟอนต์ทั่วไปที่ขนาดเท่ากัน — ตัวอย่างในหน้าเว็บใช้ฟอนต์สำรอง จึงย่อให้ใกล้ของจริง */
const NARROW_THAI = /sarabun|angsana|cordia|browallia|dillenia|eucrosia|freesia|iris|jasmine|kodchiang|lilyup/i;

function narrowFactor(run: Pick<DeckRun, 'font' | 'cs'>): number {
  return NARROW_THAI.test(`${run.cs ?? ''} ${run.font ?? ''}`) ? 0.78 : 1;
}

function pt(size: number): string {
  // 720pt = ความกว้างสไลด์ 10 นิ้ว → ขยายตามความกว้างของกรอบด้วยหน่วย cqw
  return `calc(${size} * 100cqw / 720)`;
}

function bulletChar(b: DeckBullet, index: number): string {
  if (b.auto) return `${index}.`;
  const map: Record<string, string> = { Ø: '➢', '§': '▪', '\uf07d': '▶', '\uf0d8': '➢', '\uf0a7': '▪', '\uf0b7': '•' };
  return map[b.char || ''] ?? (b.char || '•');
}

function previewParas(paras: DeckPara[]): string {
  let autoIndex = 0;
  return paras
    .map((p) => {
      const first = p.runs.find((r) => !r.br);
      const factor = first ? narrowFactor(first) : 1;
      const size = (first?.size ?? p.endSize ?? 18) * factor;
      const style = [
        `text-align:${p.align === 'ctr' ? 'center' : p.align === 'r' ? 'right' : p.align === 'l' ? 'left' : 'justify'}`,
        `font-size:${pt(size)}`,
        `margin:0`,
        p.spaceBefore ? `padding-top:${pt(p.spaceBefore)}` : '',
        p.spaceAfter ? `padding-bottom:${pt(p.spaceAfter)}` : '',
        p.marL != null ? `padding-left:calc(${p.marL} * 100cqw / 10)` : '',
        p.indent ? `text-indent:calc(${p.indent} * 100cqw / 10)` : '',
        `line-height:${(p.lineSpacingPct ? p.lineSpacingPct / 100 : 1) * (factor < 1 ? 1.1 : 1.2)}`,
        'white-space:pre-wrap',
        'overflow-wrap:anywhere',
      ]
        .filter(Boolean)
        .join(';');
      let bullet = '';
      if (p.bullet && (p.bullet.char || p.bullet.auto)) {
        if (p.bullet.auto) autoIndex += 1;
        else autoIndex = 0;
        bullet = `<span style="color:#${hex(p.bullet.color || first?.color)}">${esc(bulletChar(p.bullet, autoIndex))}&nbsp;</span>`;
      } else {
        autoIndex = 0;
      }
      const runs = p.runs
        .map((r) => {
          if (r.br) return '<br>';
          if (r.field === 'slidenum') return esc(r.text);
          const css = [
            `font-size:${pt(r.size * narrowFactor(r))}`,
            `font-weight:${r.bold ? 700 : 400}`,
            r.italic ? 'font-style:italic' : '',
            r.underline ? 'text-decoration:underline' : '',
            r.color ? `color:#${hex(r.color)}` : '',
            r.sup ? `vertical-align:super;font-size:calc(${r.size * narrowFactor(r) * 0.65} * 100cqw / 720)` : '',
            `font-family:${r.cs ? `'${esc(r.cs)}',` : ''}${r.font ? `'${esc(r.font)}',` : ''}${PREVIEW_FONTS}`,
          ]
            .filter(Boolean)
            .join(';');
          return `<span style="${css}">${esc(r.text)}</span>`;
        })
        .join('');
      return `<p style="${style}">${bullet}${runs || '&nbsp;'}</p>`;
    })
    .join('');
}

function box(e: { x: number; y: number; w: number; h: number }, deck: DeckData): string {
  const pct = (v: number, total: number) => `${((v / total) * 100).toFixed(4)}%`;
  return `left:${pct(e.x, deck.slideWidth)};top:${pct(e.y, deck.slideHeight)};width:${pct(e.w, deck.slideWidth)};height:${pct(e.h, deck.slideHeight)}`;
}

/** HTML ของสไลด์เดียวสำหรับดูตัวอย่างในหน้าเว็บ (ข้อความทั้งหมดผ่าน esc แล้ว) */
export function deckSlidePreviewHtml(deck: DeckData, slide: DeckSlide): string {
  const k = (v: number) => `calc(${v} * 100cqw / ${deck.slideWidth})`;
  const parts: string[] = [];
  for (const e of slide.elements) {
    if (e.type === 'poly') {
      const w = deck.slideWidth;
      const h = deck.slideHeight;
      const pts = e.points.map(([x, y]) => `${((x / w) * 100).toFixed(3)}% ${((y / h) * 100).toFixed(3)}%`).join(',');
      parts.push(
        `<div style="position:absolute;inset:0;background:#${hex(e.fill.color)};clip-path:polygon(${pts})"></div>`,
      );
    } else if (e.type === 'image') {
      parts.push(
        `<img alt="${esc(e.alt || '')}" src="${DECK_MEDIA_BASE}${encodeURIComponent(e.src)}" style="position:absolute;${box(e, deck)};object-fit:fill">`,
      );
    } else if (e.type === 'slidenum') {
      parts.push(
        `<div style="position:absolute;${box(e, deck)};display:flex;align-items:center;justify-content:flex-end">${previewParas([
          { align: e.align || 'r', level: 0, runs: [{ text: String(slide.no), size: e.size, color: e.color, font: e.font }] },
        ])}</div>`,
      );
    } else if (e.type === 'text') {
      const [l, t, r, b] = e.insets ?? [0.1, 0.05, 0.1, 0.05];
      const style = [
        'position:absolute',
        box(e, deck),
        'box-sizing:border-box',
        'display:flex',
        'flex-direction:column',
        `justify-content:${e.anchor === 'ctr' ? 'center' : e.anchor === 'b' ? 'flex-end' : 'flex-start'}`,
        `padding:${k(t)} ${k(r)} ${k(b)} ${k(l)}`,
        e.fill ? `background:#${hex(e.fill.color)}` : '',
        e.line ? `border:calc(${e.line.w} * 100cqw / 720) solid #${hex(e.line.color)}` : '',
        e.shape === 'rightArrow' ? 'clip-path:polygon(0 25%,60% 25%,60% 0,100% 50%,60% 100%,60% 75%,0 75%)' : '',
        'overflow:hidden',
      ]
        .filter(Boolean)
        .join(';');
      parts.push(`<div style="${style}">${previewParas(e.paragraphs)}</div>`);
    } else if (e.type === 'table') {
      const cols = e.colW.map((w) => `<col style="width:${((w / e.w) * 100).toFixed(3)}%">`).join('');
      const bd = (line: DeckLine | null | undefined) =>
        line ? `calc(${Math.max(line.w, 0.5)} * 100cqw / 720) solid #${hex(line.color)}` : 'none';
      const rows = e.rows
        .map((row) => {
          const cells = row.cells
            .map((c) => {
              if (c.hMerge || c.vMerge) return '';
              const [l, t, r, b] = c.insets ?? [0.1, 0.05, 0.1, 0.05];
              const css = [
                `vertical-align:${c.anchor === 'ctr' ? 'middle' : c.anchor === 'b' ? 'bottom' : 'top'}`,
                `padding:${k(t)} ${k(r)} ${k(b)} ${k(l)}`,
                c.fill ? `background:#${hex(c.fill)}` : '',
                c.borders ? `border-top:${bd(c.borders.t)};border-right:${bd(c.borders.r)};border-bottom:${bd(c.borders.b)};border-left:${bd(c.borders.l)}` : '',
              ]
                .filter(Boolean)
                .join(';');
              return `<td${c.colSpan && c.colSpan > 1 ? ` colspan="${c.colSpan}"` : ''}${c.rowSpan && c.rowSpan > 1 ? ` rowspan="${c.rowSpan}"` : ''} style="${css}">${previewParas(c.paragraphs)}</td>`;
            })
            .join('');
          return `<tr style="height:${((row.h / e.h) * 100).toFixed(3)}%">${cells}</tr>`;
        })
        .join('');
      parts.push(
        `<table style="position:absolute;${box(e, deck)};border-collapse:collapse;table-layout:fixed"><colgroup>${cols}</colgroup>${rows}</table>`,
      );
    }
  }
  return parts.join('');
}

export function deckPlainText(slide: DeckSlide): string {
  const texts: string[] = [];
  const grab = (paras: DeckPara[]) =>
    paras.forEach((p) => {
      const line = p.runs.map((r) => (r.br ? '\n' : r.text)).join('');
      if (line.trim()) texts.push(line);
    });
  slide.elements.forEach((e) => {
    if (e.type === 'text') grab(e.paragraphs);
    if (e.type === 'table') e.rows.forEach((r) => r.cells.forEach((c) => grab(c.paragraphs)));
  });
  return texts.join('\n');
}
