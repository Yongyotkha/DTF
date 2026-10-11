#!/usr/bin/env python3
"""Download public measure cards from thaitr and write a TypeScript catalog."""

import json
import re
import subprocess
from pathlib import Path

BASE = "https://thaitr.dft.go.th/th/search?type=&coordinates=&country=&case_id=&measure=&keyword=&year_start=&year_end=2026&page={page}"
OUT = Path(__file__).resolve().parents[1] / "src/app/pages/staff/thaitr-measures.ts"
MONTHS = {
    "ม.ค.": "01", "ม.ค": "01", "ก.พ.": "02", "ก.พ": "02", "มี.ค.": "03", "มี.ค": "03",
    "เม.ย.": "04", "เม.ย": "04", "พ.ค.": "05", "พ.ค": "05", "มิ.ย.": "06", "มิ.ย": "06",
    "ก.ค.": "07", "ก.ค": "07", "ส.ค.": "08", "ส.ค": "08", "ก.ย.": "09", "ก.ย": "09",
    "ต.ค.": "10", "ต.ค": "10", "พ.ย.": "11", "พ.ย": "11", "ธ.ค.": "12", "ธ.ค": "12",
}


def fetch(page: int) -> str:
    result = subprocess.run(
        ["curl", "-fsSL", "-A", "Mozilla/5.0", BASE.format(page=page)],
        check=True,
        capture_output=True,
    )
    return result.stdout.decode("utf-8", "replace")


def clean(value: str) -> str:
    value = re.sub(r"<[^>]+>", " ", value)
    value = value.replace("&nbsp;", " ").replace("&amp;", "&").replace("&#039;", "'")
    return re.sub(r"\s+", " ", value).strip()


def thai_date(raw: str) -> str:
    match = re.search(r"(\d{1,2})\s+([^\s]+)\s+(\d{4})", raw)
    if not match:
        return ""
    day, month, year = match.groups()
    return f"{int(day):02d}/{MONTHS.get(month, '00')}/{year}"


def parse(html: str) -> list[dict]:
    rows = []
    cards = re.findall(r'class="box search-list accordion"[\s\S]*?class="accordion-content"[\s\S]*?</nav>', html)
    for card in cards:
        title = re.search(r'class="has-text-primary"[^>]*>(.*?)</p>', card, re.S)
        country = re.search(r'class="measure_country"[^>]*>(.*?)</p>', card, re.S)
        status = re.search(r"สถานะ\s*:\s*([^<]+)", card)
        kind = re.search(r'class="measure_type"[^>]*>\s*([^<|]+)\|\s*([^<]+)', card)
        dated = re.search(r"วันที่\s*:\s*([^<]+)", card)
        hs = re.search(r"พิกัดศุลกากร\s*:\s*([^<]+)", card)
        if not title:
            continue
        heading = clean(title.group(1))
        code_match = re.match(r"([A-Z]{2,3}\d{4})\s+(.*)", heading)
        if not code_match:
            continue
        measure = clean(kind.group(1)) if kind else code_match.group(1)[:2]
        if measure == "CV":
            measure = "CVD"
        side_label = clean(kind.group(2)) if kind else ""
        origin = clean(country.group(1)) if country else ""
        origin = re.sub(r"^(ที่มีแหล่งกำเนิดจาก|ประเทศผู้ใช้มาตรการ)\s*:\s*", "", origin)
        origin = origin.replace("ดูเพิ่มเติม", "").strip(" ,")
        rows.append({
            "code": code_match.group(1),
            "goods": code_match.group(2).strip(),
            "origin": origin,
            "measure": measure,
            "side": "ถูก" if "ถูก" in side_label else "ใช้",
            "status": clean(status.group(1)) if status else "",
            "date": thai_date(clean(dated.group(1))) if dated else "",
            "hs": clean(hs.group(1)) if hs else "",
        })
    return rows


def main() -> None:
    seen = {}
    for page in range(1, 9):
        html = fetch(page)
        batch = parse(html)
        print(f"page {page}: {len(batch)}")
        for row in batch:
            seen[row["code"]] = row
    rows = list(seen.values())
    body = json.dumps(rows, ensure_ascii=False, indent=2)
    OUT.write_text(
        "export type ThaitrMeasure = {\n"
        "  code: string;\n  goods: string;\n  origin: string;\n  measure: string;\n"
        "  side: 'ใช้' | 'ถูก';\n  status: string;\n  date: string;\n  hs: string;\n};\n\n"
        f"export const thaitrMeasures: ThaitrMeasure[] = {body};\n",
        encoding="utf-8",
    )
    print("unique", len(rows), "bytes", OUT.stat().st_size)


if __name__ == "__main__":
    main()
