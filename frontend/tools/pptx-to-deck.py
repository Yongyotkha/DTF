#!/usr/bin/env python3
"""
แปลงไฟล์ .pptx จริงของเคส (เช่น "3. PowerPoint อนุ ทตอ 3 พย 63.pptx") เป็นไฟล์ข้อมูล JSON
ที่ใช้ให้ AI ช่วยร่าง PowerPoint ในหน้า "ส่งวาระ/PPT ให้ บท."

  - ดึงทุกสไลด์ตามลำดับการนำเสนอ: ข้อความ (รูปแบบตัวอักษร ขนาด สี จัดชิด บูลเล็ต) ตาราง รูปภาพ โน้ตผู้บรรยาย
  - แก้สีจากธีม (schemeClr + lumMod/lumOff/tint/shade) และสไตล์ตารางให้เป็นค่าสี hex จริง
  - ตำแหน่งและขนาดเป็นนิ้ว (สไลด์ 4:3 = 10 x 7.5 นิ้ว)
  - คัดลอกรูปที่ใช้ไปไว้ข้างไฟล์ JSON

วิธีใช้:
  python3 tools/pptx-to-deck.py "<path>.pptx" src/assets/samples/ad1046/agenda/sub/deck
"""
import colorsys
import json
import os
import re
import shutil
import sys
import zipfile
from xml.etree import ElementTree as ET

NS = {
    "a": "http://schemas.openxmlformats.org/drawingml/2006/main",
    "p": "http://schemas.openxmlformats.org/presentationml/2006/main",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
}
A = "{%s}" % NS["a"]
P = "{%s}" % NS["p"]
R = "{%s}" % NS["r"]
MATH = "{http://schemas.openxmlformats.org/officeDocument/2006/math}"
MC = "{http://schemas.openxmlformats.org/markup-compatibility/2006}"
EMU = 914400.0


def omml_text(el):
    """ข้อความในสมการ OMML (ต่อเฉพาะ m:t)"""
    if el is None:
        return ""
    return "".join((t.text or "") for t in el.iter(MATH + "t")).replace("\u00a0", " ").strip()


def inch(v):
    return round(int(v) / EMU, 4)


class Pkg:
    def __init__(self, path):
        self.z = zipfile.ZipFile(path)

    def xml(self, name):
        return ET.fromstring(self.z.read(name))

    def has(self, name):
        return name in self.z.namelist()

    def rels(self, part):
        folder, base = os.path.split(part)
        rel = "%s/_rels/%s.rels" % (folder, base)
        out = {}
        if self.has(rel):
            for r in self.xml(rel):
                tgt = r.get("Target")
                if r.get("TargetMode") != "External":
                    tgt = os.path.normpath(os.path.join(folder, tgt)).replace("\\", "/")
                out[r.get("Id")] = (r.get("Type").rsplit("/", 1)[-1], tgt)
        return out


# ---------------------------------------------------------------- colours
class Theme:
    def __init__(self, pkg):
        theme = pkg.xml("ppt/theme/theme1.xml")
        scheme = theme.find(".//a:clrScheme", NS)
        self.colors = {}
        for el in scheme:
            name = el.tag.replace(A, "")
            child = el[0]
            self.colors[name] = (child.get("lastClr") or child.get("val")).upper()
        master = pkg.xml("ppt/slideMasters/slideMaster1.xml")
        cmap = master.find("p:clrMap", NS)
        self.map = dict(cmap.attrib) if cmap is not None else {}
        fonts = theme.find(".//a:fontScheme", NS)
        self.major = fonts.find("a:majorFont/a:latin", NS).get("typeface")
        self.minor = fonts.find("a:minorFont/a:latin", NS).get("typeface")
        self.fills = list(theme.find(".//a:fillStyleLst", NS))
        self.lines = list(theme.find(".//a:lnStyleLst", NS))

    def scheme(self, name):
        name = self.map.get(name, name)
        return self.colors.get(name, "000000")


def clamp(v):
    return max(0, min(255, int(round(v))))


def hex_to_rgb(h):
    return int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)


def rgb_to_hex(r, g, b):
    return "%02X%02X%02X" % (clamp(r), clamp(g), clamp(b))


def apply_mods(hexv, mods):
    r, g, b = hex_to_rgb(hexv)
    for m in mods:
        tag = m.tag.replace(A, "")
        val = int(m.get("val", "0")) / 100000.0
        if tag in ("lumMod", "lumOff"):
            h, l, s = colorsys.rgb_to_hls(r / 255.0, g / 255.0, b / 255.0)
            if tag == "lumMod":
                l = l * val
            else:
                l = l + val
            l = max(0.0, min(1.0, l))
            r, g, b = [c * 255 for c in colorsys.hls_to_rgb(h, l, s)]
        elif tag == "tint":
            r, g, b = [c * val + 255 * (1 - val) for c in (r, g, b)]
        elif tag == "shade":
            r, g, b = [c * val for c in (r, g, b)]
    return rgb_to_hex(r, g, b)


def color_of(theme, parent, ph_color=None):
    """รับ element ที่มีลูกเป็นสี (solidFill / srgbClr / schemeClr) แล้วคืน (hex, alpha 0-100)"""
    if parent is None:
        return None
    node = parent
    # ตัวห่อ (solidFill / fillRef / lnRef / gs ...) -> ใช้ลูกตัวแรกที่เป็นสี
    for _ in range(2):
        if node.tag.replace(A, "") in ("srgbClr", "schemeClr", "sysClr", "prstClr"):
            break
        kids = [k for k in node if k.tag.replace(A, "") in ("srgbClr", "schemeClr", "sysClr", "prstClr")]
        if not kids:
            return None
        node = kids[0]
    tag = node.tag.replace(A, "")
    if tag == "srgbClr":
        base = node.get("val").upper()
    elif tag == "schemeClr":
        val = node.get("val")
        base = ph_color if val == "phClr" and ph_color else theme.scheme(val)
    elif tag == "sysClr":
        base = (node.get("lastClr") or "000000").upper()
    elif tag == "prstClr":
        base = {"black": "000000", "white": "FFFFFF"}.get(node.get("val"), "000000")
    else:
        return None
    mods = [m for m in node if m.tag.replace(A, "") in ("lumMod", "lumOff", "tint", "shade")]
    alpha = 100
    for m in node:
        if m.tag.replace(A, "") == "alpha":
            alpha = int(m.get("val")) / 1000.0
    return apply_mods(base, mods), alpha


def fill_of(theme, sppr, style):
    """คืน {'color','alpha'} หรือ None ถ้าไม่มีสี"""
    if sppr is not None:
        if sppr.find("a:noFill", NS) is not None:
            return None
        solid = sppr.find("a:solidFill", NS)
        if solid is not None:
            c = color_of(theme, solid)
            return {"color": c[0], "alpha": c[1]} if c else None
        grad = sppr.find("a:gradFill", NS)
        if grad is not None:
            stops = grad.findall("a:gsLst/a:gs", NS)
            if stops:
                c = color_of(theme, stops[len(stops) // 2])
                return {"color": c[0], "alpha": 100}
        if sppr.find("a:blipFill", NS) is not None:
            return None
    if style is not None:
        ref = style.find("a:fillRef", NS)
        if ref is not None and ref.get("idx") not in (None, "0"):
            base = color_of(theme, ref)
            if base is None:
                return None
            idx = int(ref.get("idx"))
            fills = theme.fills
            if 1 <= idx <= len(fills):
                tpl = fills[idx - 1]
                if tpl.tag.replace(A, "") == "gradFill":
                    stops = tpl.findall("a:gsLst/a:gs", NS)
                    c = color_of(theme, stops[len(stops) // 2], ph_color=base[0])
                    return {"color": c[0], "alpha": 100}
            return {"color": base[0], "alpha": base[1]}
    return None


def line_of(theme, sppr, style):
    if sppr is not None:
        ln = sppr.find("a:ln", NS)
        if ln is not None:
            if ln.find("a:noFill", NS) is not None:
                return None
            solid = ln.find("a:solidFill", NS)
            if solid is not None:
                c = color_of(theme, solid)
                w = int(ln.get("w", "12700")) / 12700.0
                dash = ln.find("a:prstDash", NS)
                out = {"color": c[0], "w": round(w, 2)}
                if dash is not None and dash.get("val") not in (None, "solid"):
                    out["dash"] = dash.get("val")
                return out
    if style is not None:
        ref = style.find("a:lnRef", NS)
        if ref is not None and ref.get("idx") not in (None, "0"):
            c = color_of(theme, ref)
            idx = int(ref.get("idx"))
            w = 9525
            if 1 <= idx <= len(theme.lines):
                w = int(theme.lines[idx - 1].get("w", "9525"))
            if c:
                return {"color": c[0], "w": round(w / 12700.0, 2)}
    return None


# ---------------------------------------------------------------- text styles
class TextStyles:
    """รวมสไตล์ข้อความจากมาสเตอร์ / presentation.xml"""

    def __init__(self, pkg):
        master = pkg.xml("ppt/slideMasters/slideMaster1.xml")
        tx = master.find("p:txStyles", NS)
        self.title = tx.find("p:titleStyle", NS)
        self.body = tx.find("p:bodyStyle", NS)
        self.other = tx.find("p:otherStyle", NS)
        pres = pkg.xml("ppt/presentation.xml")
        self.default = pres.find("p:defaultTextStyle", NS)

    @staticmethod
    def lvl(style, level):
        if style is None:
            return None
        return style.find("a:lvl%dpPr" % (level + 1), NS)


def attr_chain(chain, name):
    for el in chain:
        if el is not None and el.get(name) is not None:
            return el.get(name)
    return None


def child_chain(chain, path):
    for el in chain:
        if el is not None:
            found = el.find(path, NS)
            if found is not None:
                return found
    return None


# ---------------------------------------------------------------- extraction
class Extractor:
    def __init__(self, pkg):
        self.pkg = pkg
        self.theme = Theme(pkg)
        self.styles = TextStyles(pkg)
        self.table_styles = self.load_table_styles()
        self.media = {}
        self.layout_cache = {}
        pres = pkg.xml("ppt/presentation.xml")
        size = pres.find("p:sldSz", NS)
        self.width = inch(size.get("cx"))
        self.height = inch(size.get("cy"))

    # ---- placeholders ---------------------------------------------------
    def layout_info(self, layout_part):
        if layout_part in self.layout_cache:
            return self.layout_cache[layout_part]
        root = self.pkg.xml(layout_part)
        info = {"ph": {}, "deco": []}
        for sp in root.findall(".//p:sp", NS):
            ph = sp.find("p:nvSpPr/p:nvPr/p:ph", NS)
            if ph is not None:
                key = (ph.get("type") or "body", ph.get("idx"))
                xfrm = sp.find("p:spPr/a:xfrm", NS)
                info["ph"][key] = {
                    "xfrm": self.xfrm_of(xfrm),
                    "lst": sp.find("p:txBody/a:lstStyle", NS),
                }
        info["root"] = root
        self.layout_cache[layout_part] = info
        return info

    def master_ph(self, kind):
        master = self.pkg.xml("ppt/slideMasters/slideMaster1.xml")
        for sp in master.findall(".//p:sp", NS):
            ph = sp.find("p:nvSpPr/p:nvPr/p:ph", NS)
            if ph is None:
                continue
            if (ph.get("type") or "body") == kind:
                return self.xfrm_of(sp.find("p:spPr/a:xfrm", NS))
        return None

    @staticmethod
    def xfrm_of(xfrm):
        if xfrm is None:
            return None
        off = xfrm.find("a:off", NS)
        ext = xfrm.find("a:ext", NS)
        if off is None or ext is None:
            return None
        return {
            "x": inch(off.get("x")),
            "y": inch(off.get("y")),
            "w": inch(ext.get("cx")),
            "h": inch(ext.get("cy")),
        }

    # ---- table styles ---------------------------------------------------
    def load_table_styles(self):
        out = {}
        if not self.pkg.has("ppt/tableStyles.xml"):
            return out
        root = self.pkg.xml("ppt/tableStyles.xml")
        for st in root.findall("a:tblStyle", NS):
            out[st.get("styleId")] = st
        return out

    # ---- runs / paragraphs ----------------------------------------------
    def run_props(self, rpr, chain, default_color, scale):
        theme = self.theme
        full = [rpr] + chain
        size = attr_chain(full, "sz")
        size = float(size) / 100.0 if size else 18.0
        size = round(size * scale, 1)
        bold = attr_chain(full, "b") in ("1", "true")
        italic = attr_chain(full, "i") in ("1", "true")
        underline = (attr_chain(full, "u") or "none") not in ("none",)
        baseline = attr_chain(full, "baseline")
        color = None
        for el in full:
            if el is None:
                continue
            solid = el.find("a:solidFill", NS)
            if solid is not None:
                c = color_of(theme, solid)
                color = c[0] if c else None
                break
        if color is None:
            color = default_color
        face = None
        for el in full:
            if el is None:
                continue
            latin = el.find("a:latin", NS)
            if latin is not None and latin.get("typeface"):
                face = latin.get("typeface")
                break
        if face is None or face.startswith("+mn"):
            face = theme.minor if face is None or face == "+mn-lt" else face
        if face == "+mj-lt":
            face = theme.major
        cs_face = None
        for el in full:
            if el is None:
                continue
            cs = el.find("a:cs", NS)
            if cs is not None and cs.get("typeface"):
                cs_face = cs.get("typeface")
                break
        if cs_face and cs_face.startswith("+"):
            cs_face = None
        out = {"size": size, "bold": bold, "color": color, "font": face}
        if cs_face:
            out["cs"] = cs_face
        spc = attr_chain(full, "spc")
        if spc and spc != "0":
            out["spc"] = int(spc)
        if italic:
            out["italic"] = True
        if underline:
            out["underline"] = True
        if baseline and baseline != "0":
            out["sup" if int(baseline) > 0 else "sub"] = True
        return out

    def paragraphs(self, txbody, chain_for_level, default_color, scale, bullets_default):
        """chain_for_level(level) -> list ของ lvlNpPr ที่ใช้เป็นค่าตั้งต้น"""
        paras = []
        if txbody is None:
            return paras
        for p in txbody.findall("a:p", NS):
            ppr = p.find("a:pPr", NS)
            level = int(ppr.get("lvl")) if ppr is not None and ppr.get("lvl") else 0
            lvl_chain = chain_for_level(level)
            ppr_chain = [ppr] + lvl_chain
            def_rpr_chain = []
            for el in ppr_chain:
                if el is not None:
                    d = el.find("a:defRPr", NS)
                    if d is not None:
                        def_rpr_chain.append(d)
            algn = attr_chain(ppr_chain, "algn") or "l"
            mar_l = attr_chain(ppr_chain, "marL")
            indent = attr_chain(ppr_chain, "indent")
            bu_char = child_chain(ppr_chain, "a:buChar")
            bu_none = child_chain(ppr_chain, "a:buNone")
            bu_auto = child_chain(ppr_chain, "a:buAutoNum")
            bullet = None
            # ใช้ตัวที่อยู่ก่อนในสายสืบทอด
            for el in ppr_chain:
                if el is None:
                    continue
                if el.find("a:buNone", NS) is not None:
                    bullet = None
                    break
                if el.find("a:buChar", NS) is not None:
                    bullet = {"char": el.find("a:buChar", NS).get("char")}
                    break
                if el.find("a:buAutoNum", NS) is not None:
                    bullet = {"auto": el.find("a:buAutoNum", NS).get("type")}
                    break
            if bullet and not bullets_default and ppr is None:
                bullet = None
            if bullet:
                bu_font = child_chain(ppr_chain, "a:buFont")
                if bu_font is not None and bu_font.get("typeface") and not bu_font.get("typeface").startswith("+"):
                    bullet["font"] = bu_font.get("typeface")
                bu_clr = child_chain(ppr_chain, "a:buClr")
                if bu_clr is not None:
                    c = color_of(self.theme, bu_clr)
                    if c:
                        bullet["color"] = c[0]
                bu_sz = child_chain(ppr_chain, "a:buSzPct")
                if bu_sz is not None and bu_sz.get("val"):
                    bullet["sizePct"] = int(bu_sz.get("val")) / 1000.0
            spc_aft = None
            spc_bef = None
            ln_spc = None
            for el in ppr_chain:
                if el is None:
                    continue
                if spc_aft is None and el.find("a:spcAft", NS) is not None:
                    pts = el.find("a:spcAft/a:spcPts", NS)
                    spc_aft = int(pts.get("val")) / 100.0 if pts is not None else 0
                if spc_bef is None and el.find("a:spcBef", NS) is not None:
                    pts = el.find("a:spcBef/a:spcPts", NS)
                    spc_bef = int(pts.get("val")) / 100.0 if pts is not None else 0
                if ln_spc is None and el.find("a:lnSpc", NS) is not None:
                    pct = el.find("a:lnSpc/a:spcPct", NS)
                    if pct is not None:
                        ln_spc = int(pct.get("val")) / 1000.0
            runs = []
            extra_before = []  # ย่อหน้าที่เกิดจากสมการเศษส่วนก่อนข้อความที่ตามมา
            for child in p:
                tag = child.tag.replace(A, "")
                if child.tag.endswith("}m") and A not in child.tag:
                    # a14:m — สมการ (OMML) : เศษส่วนแสดงเป็น ตัวเศษ(ขีดเส้นใต้) / ตัวส่วน
                    for om in child.iter(MATH + "oMath"):
                        frac = om.find(".//" + MATH + "f")
                        rpr_math = om.find(".//" + A + "rPr")
                        base = self.run_props(rpr_math, def_rpr_chain, default_color, scale)
                        base.pop("italic", None)
                        if frac is not None:
                            num = omml_text(frac.find(MATH + "num"))
                            den = omml_text(frac.find(MATH + "den"))
                            for text, under in ((num, True), (den, False)):
                                run = dict(base)
                                run["text"] = text
                                if under:
                                    run["underline"] = True
                                extra_before.append({
                                    "align": "ctr",
                                    "level": level,
                                    "runs": [run],
                                    "endSize": base["size"],
                                })
                        else:
                            run = dict(base)
                            run["text"] = omml_text(om)
                            runs.append(run)
                    continue
                if tag in ("r", "fld"):
                    rpr = child.find("a:rPr", NS)
                    props = self.run_props(rpr, def_rpr_chain, default_color, scale)
                    text = child.findtext("a:t", default="", namespaces=NS)
                    if tag == "fld" and child.get("type") == "slidenum":
                        props["field"] = "slidenum"
                    props["text"] = text
                    runs.append(props)
                elif tag == "br":
                    props = self.run_props(child.find("a:rPr", NS), def_rpr_chain, default_color, scale)
                    props["br"] = True
                    props["text"] = ""
                    runs.append(props)
            end = p.find("a:endParaRPr", NS)
            end_props = self.run_props(end, def_rpr_chain, default_color, scale)
            para = {
                "align": algn,
                "level": level,
                "runs": runs,
                "endSize": end_props["size"],
            }
            if bullet:
                para["bullet"] = bullet
            if mar_l:
                para["marL"] = inch(mar_l)
            if indent:
                para["indent"] = inch(indent)
            if spc_aft:
                para["spaceAfter"] = spc_aft
            if spc_bef:
                para["spaceBefore"] = spc_bef
            if ln_spc and abs(ln_spc - 100) > 0.5:
                para["lineSpacingPct"] = ln_spc
            paras.extend(extra_before)
            if extra_before and not any(r["text"].strip() for r in runs):
                continue
            paras.append(para)
        return paras

    # ---- shapes ----------------------------------------------------------
    def autofit_scale(self, bodypr):
        if bodypr is None:
            return 1.0
        fit = bodypr.find("a:normAutofit", NS)
        if fit is not None and fit.get("fontScale"):
            return int(fit.get("fontScale")) / 100000.0
        return 1.0

    def shape(self, sp, slide_part, layout_info):
        theme = self.theme
        ph = sp.find("p:nvSpPr/p:nvPr/p:ph", NS)
        sppr = sp.find("p:spPr", NS)
        style = sp.find("p:style", NS)
        txbody = sp.find("p:txBody", NS)
        name = sp.find("p:nvSpPr/p:cNvPr", NS).get("name")
        kind = None
        key = None
        if ph is not None:
            kind = ph.get("type") or "body"
            key = (kind, ph.get("idx"))
        box = self.xfrm_of(sppr.find("a:xfrm", NS)) if sppr is not None else None
        layout_ph = None
        if ph is not None:
            layout_ph = layout_info["ph"].get(key)
            if layout_ph is None:
                for k, v in layout_info["ph"].items():
                    if k[0] == kind or (kind == "ctrTitle" and k[0] == "title"):
                        layout_ph = v
                        break
            if box is None and layout_ph and layout_ph["xfrm"]:
                box = layout_ph["xfrm"]
            if box is None:
                master_kind = "title" if kind in ("title", "ctrTitle") else kind if kind in ("sldNum", "dt", "ftr") else "body"
                box = self.master_ph(master_kind)
        if box is None:
            return None
        if kind in ("dt", "ftr"):
            return None

        geom = "rect"
        prst = sp.find("p:spPr/a:prstGeom", NS)
        if prst is not None:
            geom = prst.get("prst")

        # สไตล์ข้อความตั้งต้น
        if kind in ("title", "ctrTitle"):
            master_style = self.styles.title
            default_color = self.theme.scheme("tx2")
            bullets_default = False
        elif kind is not None:
            master_style = self.styles.body
            default_color = self.theme.scheme("tx1")
            bullets_default = True
        else:
            master_style = self.styles.other if self.styles.other is not None else self.styles.default
            default_color = None
            font_ref = style.find("a:fontRef", NS) if style is not None else None
            if font_ref is not None:
                c = color_of(theme, font_ref)
                default_color = c[0] if c else None
            if default_color is None:
                default_color = self.theme.scheme("tx1")
            bullets_default = False

        shape_lst = txbody.find("a:lstStyle", NS) if txbody is not None else None
        layout_lst = layout_ph["lst"] if layout_ph else None
        bodypr = txbody.find("a:bodyPr", NS) if txbody is not None else None
        scale = self.autofit_scale(bodypr)
        default_style = self.styles.default

        def chain_for_level(level):
            n = "a:lvl%dpPr" % (level + 1)
            out = []
            for src in (shape_lst, layout_lst):
                if src is not None:
                    el = src.find(n, NS)
                    if el is not None:
                        out.append(el)
            ms = self.styles.lvl(master_style, level)
            if ms is not None:
                out.append(ms)
            ds = self.styles.lvl(default_style, level)
            if ds is not None:
                out.append(ds)
            return out

        paragraphs = self.paragraphs(txbody, chain_for_level, default_color, scale, bullets_default)

        if kind == "sldNum":
            first = None
            for para in paragraphs:
                for run in para["runs"]:
                    first = run
                    break
                if first:
                    break
            size = first["size"] if first else 18.0
            return {
                "type": "slidenum",
                "x": box["x"],
                "y": box["y"],
                "w": box["w"],
                "h": box["h"],
                "size": size,
                "color": (first or {}).get("color") or "464646",
                "font": (first or {}).get("font"),
                "align": "r",
            }

        # ไม่มีข้อความและไม่มีสี/เส้น => ข้าม
        has_text = any(r["text"].strip() for para in paragraphs for r in para["runs"])
        fill = fill_of(theme, sppr, style)
        line = line_of(theme, sppr, style)
        if kind is not None and not has_text:
            return None
        if kind is None and not has_text and fill is None and line is None:
            return None

        insets = [0.1, 0.05, 0.1, 0.05]  # l t r b (นิ้ว)
        anchor = "t"
        wrap = True
        if bodypr is not None:
            for i, nm in enumerate(("lIns", "tIns", "rIns", "bIns")):
                if bodypr.get(nm) is not None:
                    insets[i] = inch(bodypr.get(nm))
            anchor = bodypr.get("anchor") or ("ctr" if kind in ("title", "ctrTitle") else "t")
            if bodypr.get("wrap") == "none":
                wrap = False
        elif kind in ("title", "ctrTitle"):
            anchor = "ctr"
        if kind == "subTitle":
            anchor = "t"
        out = {
            "type": "text",
            "name": name,
            "x": box["x"],
            "y": box["y"],
            "w": box["w"],
            "h": box["h"],
            "shape": geom,
            "anchor": anchor,
            "insets": insets,
            "paragraphs": paragraphs,
        }
        if kind:
            out["placeholder"] = kind
        if fill:
            out["fill"] = fill
        if line:
            out["line"] = line
        if not wrap:
            out["wrap"] = False
        return out

    def picture(self, pic, slide_rels):
        blip = pic.find("p:blipFill/a:blip", NS)
        rid = blip.get(R + "embed")
        rel = slide_rels.get(rid)
        if not rel:
            return None
        part = rel[1]
        fname = os.path.basename(part)
        self.media[fname] = part
        box = self.xfrm_of(pic.find("p:spPr/a:xfrm", NS))
        if box is None:
            return None
        out = {"type": "image", "src": fname, **box}
        src = pic.find("p:blipFill/a:srcRect", NS)
        if src is not None and any(src.get(k) for k in ("l", "t", "r", "b")):
            out["crop"] = {k: int(src.get(k, "0")) / 100000.0 for k in ("l", "t", "r", "b")}
        xfrm = pic.find("p:spPr/a:xfrm", NS)
        if xfrm is not None and xfrm.get("rot"):
            out["rotate"] = int(xfrm.get("rot")) / 60000.0
        desc = pic.find("p:nvPicPr/p:cNvPr", NS).get("descr")
        if desc:
            out["alt"] = desc
        return out

    # ---- tables ----------------------------------------------------------
    def table_style_info(self, style_id, tbl_pr):
        st = self.table_styles.get(style_id) if style_id else None
        return st

    def style_part(self, st, part_name):
        if st is None:
            return None
        return st.find("a:%s" % part_name, NS)

    def part_fill(self, part):
        if part is None:
            return None
        fill = part.find("a:tcStyle/a:fill/a:solidFill", NS)
        if fill is None:
            return None
        c = color_of(self.theme, fill)
        return c[0] if c else None

    def part_text(self, part):
        if part is None:
            return None, None
        tx = part.find("a:tcTxStyle", NS)
        if tx is None:
            return None, None
        bold = tx.get("b") == "on"
        c = None
        for kid in tx:
            if kid.tag.replace(A, "") in ("schemeClr", "srgbClr"):
                c = color_of(self.theme, kid)
        return bold or None, (c[0] if c else None)

    def part_borders(self, part):
        out = {}
        if part is None:
            return out
        bd = part.find("a:tcStyle/a:tcBdr", NS)
        if bd is None:
            return out
        for side in ("left", "right", "top", "bottom", "insideH", "insideV"):
            ln = bd.find("a:%s/a:ln" % side, NS)
            if ln is None:
                continue
            solid = ln.find("a:solidFill", NS)
            if solid is None:
                out[side] = None
                continue
            c = color_of(self.theme, solid)
            out[side] = {"color": c[0], "w": round(int(ln.get("w", "12700")) / 12700.0, 2)}
        return out

    def table(self, frame):
        theme = self.theme
        box = self.xfrm_of(frame.find("p:xfrm", NS))
        tbl = frame.find(".//a:tbl", NS)
        tbl_pr = tbl.find("a:tblPr", NS)
        sid = tbl_pr.findtext("a:tableStyleId", default="", namespaces=NS) if tbl_pr is not None else ""
        st = self.table_styles.get(sid) if sid else None
        first_row = tbl_pr is not None and tbl_pr.get("firstRow") == "1"
        first_col = tbl_pr is not None and tbl_pr.get("firstCol") == "1"
        band_row = tbl_pr is not None and tbl_pr.get("bandRow") == "1"
        cols = [inch(g.get("w")) for g in tbl.findall("a:tblGrid/a:gridCol", NS)]
        whole = self.style_part(st, "wholeTbl")
        whole_fill = self.part_fill(whole)
        whole_bold, whole_color = self.part_text(whole)
        whole_borders = self.part_borders(whole)
        rows = []
        trs = tbl.findall("a:tr", NS)
        for ri, tr in enumerate(trs):
            cells = []
            for ci, tc in enumerate(tr.findall("a:tc", NS)):
                tcpr = tc.find("a:tcPr", NS)
                # ค่าจากสไตล์ตาราง
                part = None
                fill_hex = whole_fill
                bold_style = whole_bold
                color_style = whole_color
                if first_row and ri == 0:
                    part = self.style_part(st, "firstRow")
                elif first_col and ci == 0:
                    part = self.style_part(st, "firstCol")
                elif band_row:
                    k = ri - (1 if first_row else 0)
                    part = self.style_part(st, "band1H" if k % 2 == 0 else "band2H")
                if part is not None:
                    pf = self.part_fill(part)
                    if pf:
                        fill_hex = pf
                    pb, pc = self.part_text(part)
                    if pb is not None:
                        bold_style = pb
                    if pc:
                        color_style = pc
                # ค่าที่ระบุในเซลล์
                cell_fill = None
                explicit_none = False
                if tcpr is not None:
                    if tcpr.find("a:noFill", NS) is not None:
                        explicit_none = True
                    solid = tcpr.find("a:solidFill", NS)
                    if solid is not None:
                        c = color_of(theme, solid)
                        cell_fill = c[0] if c else None
                if cell_fill:
                    fill_hex = cell_fill
                elif explicit_none:
                    fill_hex = None
                # เส้นขอบ
                borders = {}
                for side, tag in (("t", "lnT"), ("r", "lnR"), ("b", "lnB"), ("l", "lnL")):
                    ln = tcpr.find("a:%s" % tag, NS) if tcpr is not None else None
                    if ln is not None:
                        solid = ln.find("a:solidFill", NS)
                        if solid is not None:
                            c = color_of(theme, solid)
                            borders[side] = {"color": c[0], "w": round(int(ln.get("w", "12700")) / 12700.0, 2)}
                        else:
                            borders[side] = None
                    else:
                        # ใช้เส้นจากสไตล์ตาราง
                        key = {"t": "top", "b": "bottom", "l": "left", "r": "right"}[side]
                        inside = "insideH" if side in ("t", "b") else "insideV"
                        edge_row = (side == "t" and ri == 0) or (side == "b" and ri == len(trs) - 1)
                        edge_col = (side == "l" and ci == 0)
                        v = whole_borders.get(key if (edge_row or edge_col) else inside)
                        if v is None and (edge_row or edge_col):
                            v = whole_borders.get(inside)
                        if v:
                            borders[side] = v
                anchor = (tcpr.get("anchor") if tcpr is not None else None) or "t"
                mar = [0.1, 0.05, 0.1, 0.05]
                if tcpr is not None:
                    for i, nm in enumerate(("marL", "marT", "marR", "marB")):
                        if tcpr.get(nm) is not None:
                            mar[i] = inch(tcpr.get(nm))
                default_color = color_style or self.theme.scheme("tx1")

                def chain_for_level(level, bold=bold_style):
                    return []

                paras = self.paragraphs(tc.find("a:txBody", NS), chain_for_level, default_color, 1.0, False)
                if bold_style:
                    for para in paras:
                        for run in para["runs"]:
                            run["bold"] = run["bold"] or True
                cell = {
                    "paragraphs": paras,
                    "anchor": anchor,
                    "insets": mar,
                }
                if fill_hex:
                    cell["fill"] = fill_hex
                if borders:
                    cell["borders"] = borders
                if tc.get("gridSpan"):
                    cell["colSpan"] = int(tc.get("gridSpan"))
                if tc.get("rowSpan"):
                    cell["rowSpan"] = int(tc.get("rowSpan"))
                if tc.get("hMerge") == "1":
                    cell["hMerge"] = True
                if tc.get("vMerge") == "1":
                    cell["vMerge"] = True
                cells.append(cell)
            rows.append({"h": inch(tr.get("h")), "cells": cells})
        return {
            "type": "table",
            "x": box["x"],
            "y": box["y"],
            "w": box["w"],
            "h": box["h"],
            "colW": cols,
            "rows": rows,
        }

    # ---- layout decoration (หน้าปก) --------------------------------------
    def layout_decoration(self, layout_part):
        """รูปทรง freeform ตกแต่งของเลย์เอาต์หน้าปก — แปลงเป็นรูปหลายเหลี่ยมสีเรียบ"""
        info = self.layout_info(layout_part)
        root = info["root"]
        out = []
        for grp in root.findall("p:cSld/p:spTree/p:grpSp", NS):
            gx = grp.find("p:grpSpPr/a:xfrm", NS)
            off, ext = gx.find("a:off", NS), gx.find("a:ext", NS)
            choff, chext = gx.find("a:chOff", NS), gx.find("a:chExt", NS)
            sx = int(ext.get("cx")) / float(chext.get("cx"))
            sy = int(ext.get("cy")) / float(chext.get("cy"))
            for sp in grp.findall("p:sp", NS):
                path = sp.find(".//a:path", NS)
                xf = sp.find("p:spPr/a:xfrm", NS)
                if path is None or xf is None:
                    continue
                pw, ph = float(path.get("w")), float(path.get("h"))
                sox, soy = int(xf.find("a:off", NS).get("x")), int(xf.find("a:off", NS).get("y"))
                sw, sh = int(xf.find("a:ext", NS).get("cx")), int(xf.find("a:ext", NS).get("cy"))
                pts = []
                for el in path:
                    tag = el.tag.replace(A, "")
                    if tag in ("moveTo", "lnTo"):
                        pt = el.find("a:pt", NS)
                        px, py = float(pt.get("x")), float(pt.get("y"))
                        cx = sox + px / pw * sw
                        cy = soy + py / ph * sh
                        gxp = int(off.get("x")) + (cx - int(choff.get("x"))) * sx
                        gyp = int(off.get("y")) + (cy - int(choff.get("y"))) * sy
                        pts.append([round(gxp / EMU, 4), round(gyp / EMU, 4)])
                if len(pts) < 3:
                    continue
                sppr = sp.find("p:spPr", NS)
                solid = sppr.find("a:solidFill", NS)
                if solid is not None:
                    c = color_of(self.theme, solid)
                    fill = {"color": c[0], "alpha": c[1]}
                else:
                    # ภาพพื้นผิว + ไล่สี => ใช้เฉดน้ำเงินเข้มของธีม
                    fill = {"color": apply_mods(self.theme.scheme("accent1"), [ET.Element(A + "shade", {"val": "55000"})]), "alpha": 100}
                black = fill["color"] == "000000"
                if black:
                    continue
                # deco = ลวดลายของเลย์เอาต์ (ในไฟล์ .pptx ที่สร้างใหม่มาจากเลย์เอาต์ต้นฉบับอยู่แล้ว ใช้เฉพาะตอนแสดงตัวอย่าง)
                out.append({"type": "poly", "deco": True, "points": pts, "fill": fill})
        # ให้แถบหลักอยู่ล่างสุด (วาดก่อน) แล้วค่อยวาดสามเหลี่ยมโปร่งใส
        out.sort(key=lambda e: 0 if e["fill"]["alpha"] >= 100 else 1)
        return out

    # ---- notes -----------------------------------------------------------
    def notes_text(self, slide_rels):
        for rid, (kind, part) in slide_rels.items():
            if kind == "notesSlide":
                root = self.pkg.xml(part)
                texts = []
                for sp in root.findall(".//p:sp", NS):
                    ph = sp.find("p:nvSpPr/p:nvPr/p:ph", NS)
                    if ph is not None and ph.get("type") == "body":
                        for p in sp.findall(".//a:p", NS):
                            t = "".join(x.text or "" for x in p.iter(A + "t"))
                            texts.append(t)
                joined = "\n".join(texts).strip()
                return joined
        return ""

    # ---- slide -----------------------------------------------------------
    def slide(self, part, index):
        rels = self.pkg.rels(part)
        layout_part = None
        for rid, (kind, tgt) in rels.items():
            if kind == "slideLayout":
                layout_part = tgt
        layout_info = self.layout_info(layout_part)
        root = self.pkg.xml(part)
        elements = []
        if layout_part and layout_part.endswith("slideLayout1.xml"):
            elements.extend(self.layout_decoration(layout_part))
        tree = root.find("p:cSld/p:spTree", NS)
        nodes = []
        for node in tree:
            if node.tag == MC + "AlternateContent":
                # ใช้ตัวเลือกแรก (Choice) ซึ่งเป็นตารางจริงที่แก้ไขได้ ไม่ใช่ภาพสำรอง
                choice = node.find(MC + "Choice")
                if choice is not None:
                    nodes.extend(list(choice))
            else:
                nodes.append(node)
        for node in nodes:
            tag = node.tag.replace(P, "")
            if tag == "sp":
                el = self.shape(node, part, layout_info)
                if el:
                    elements.append(el)
            elif tag == "pic":
                el = self.picture(node, rels)
                if el:
                    elements.append(el)
            elif tag == "graphicFrame":
                if node.find(".//a:tbl", NS) is not None:
                    elements.append(self.table(node))
        slide = {"no": index, "layout": os.path.basename(layout_part or "slideLayout2.xml"), "elements": elements}
        notes = self.notes_text(rels)
        if notes:
            slide["notes"] = notes
        return slide


def main():
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(1)
    src, out_dir = sys.argv[1], sys.argv[2]
    pkg = Pkg(src)
    ex = Extractor(pkg)
    pres = pkg.xml("ppt/presentation.xml")
    rels = pkg.rels("ppt/presentation.xml")
    slides = []
    ids = pres.find("p:sldIdLst", NS)
    for i, sld in enumerate(ids, 1):
        part = rels[sld.get(R + "id")][1]
        slides.append(ex.slide(part, i))
    os.makedirs(out_dir, exist_ok=True)
    media_dir = os.path.join(out_dir, "media")
    os.makedirs(media_dir, exist_ok=True)
    for fname, part in ex.media.items():
        with open(os.path.join(media_dir, fname), "wb") as fh:
            fh.write(pkg.z.read(part))
    deck = {
        "source": os.path.basename(src),
        "slideWidth": ex.width,
        "slideHeight": ex.height,
        "font": ex.theme.minor,
        "slideCount": len(slides),
        "slides": slides,
    }
    with open(os.path.join(out_dir, "deck.json"), "w", encoding="utf-8") as fh:
        json.dump(deck, fh, ensure_ascii=False, indent=1)
    print("slides", len(slides), "media", sorted(ex.media))


if __name__ == "__main__":
    main()
