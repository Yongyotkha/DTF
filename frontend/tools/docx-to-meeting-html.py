#!/usr/bin/env python3
"""แปลงไฟล์ .docx (มติ / รายงานการประชุมอนุไต่สวน) เป็น html ตัวเนื้อหา สำหรับ editor ในหน้า POR1

ขั้นตอน: textutil (macOS) แปลง docx -> html แล้วย้ายสไตล์จาก <style> ไปเป็น inline style
เพื่อให้วางใน contenteditable ได้โดยไม่รั่วสไตล์ไปหน้าอื่น

usage: python3 tools/docx-to-meeting-html.py <input.docx> <output.html>
"""
import html as htmllib
import os
import re
import subprocess
import sys
import tempfile


def css_rules(style_text: str) -> dict:
    rules = {}
    for sel, body in re.findall(r'((?:p|span|li|ul)\.[\w-]+)\s*\{([^}]*)\}', style_text):
        rules[sel] = body
    return rules


def decl_to_inline(body: str) -> str:
    out = []
    for part in body.split(';'):
        if ':' not in part:
            continue
        key, value = [x.strip() for x in part.split(':', 1)]
        if key == 'margin':
            out.append(f'margin:{value}')
        elif key == 'text-align':
            out.append(f'text-align:{value}')
        elif key == 'color':
            out.append(f'color:{value}')
        elif key == 'letter-spacing':
            out.append(f'letter-spacing:{value}')
        elif key == 'min-height':
            out.append(f'min-height:{value}')
        elif key == 'list-style-type':
            out.append(f'list-style-type:{value}')
        elif key == 'font':
            # เช่น "17.0px Times" -> ขนาดตัวอักษรเท่านั้น (ฟอนต์ใช้ของ editor)
            m = re.search(r'([\d.]+px)', value)
            if m:
                out.append(f'font-size:{m.group(1)}')
            if re.search(r'\bbold\b', value):
                out.append('font-weight:bold')
    return ';'.join(out)


def convert(docx: str, out_html: str) -> None:
    with tempfile.TemporaryDirectory() as tmp:
        src = os.path.join(tmp, 'in.docx')
        with open(docx, 'rb') as f, open(src, 'wb') as g:
            g.write(f.read())
        subprocess.run(['textutil', '-convert', 'html', '-output', os.path.join(tmp, 'out.html'), src], check=True)
        raw = open(os.path.join(tmp, 'out.html'), encoding='utf8', errors='ignore').read()

    style = '\n'.join(re.findall(r'<style[^>]*>(.*?)</style>', raw, re.S))
    rules = css_rules(style)
    body = re.search(r'<body[^>]*>(.*)</body>', raw, re.S).group(1)

    # ตัวคั่นช่องว่างของ Cocoa (Apple-*) -> ข้อความธรรมดา
    body = re.sub(r'<span class="Apple-(?:tab|converted)-space[^"]*">(.*?)</span>', r'\1', body, flags=re.S)

    def fix_tag(match: re.Match) -> str:
        tag, attrs = match.group(1), match.group(2)
        classes = re.findall(r'class="([^"]*)"', attrs)
        styles = []
        for cls in (classes[0].split() if classes else []):
            rule = rules.get(f'{tag}.{cls}')
            if rule:
                styles.append(decl_to_inline(rule))
        keep = re.sub(r'\s*class="[^"]*"', '', attrs)
        keep = re.sub(r'\s*style="[^"]*"', '', keep)
        inline = ';'.join(s for s in styles if s)
        if inline:
            keep += f' style="{inline}"'
        return f'<{tag}{keep}>'

    body = re.sub(r'<(p|span|li|ul)((?:\s[^>]*)?)>', fix_tag, body)
    body = re.sub(r'\s*\n\s*', ' ', body).strip()
    with open(out_html, 'w', encoding='utf8') as f:
        f.write(body)
    print(out_html, len(body), 'bytes')


if __name__ == '__main__':
    if len(sys.argv) != 3:
        print(__doc__)
        sys.exit(1)
    convert(sys.argv[1], sys.argv[2])
