#!/usr/bin/env python3
"""ดึงรายการมาตรการสาธารณะจากเว็บไซต์กอง แล้วเขียน TypeScript catalog สำหรับต้นแบบ."""

import json
import re
import subprocess
from pathlib import Path

# แหล่งข้อมูลสาธารณะของกอง (ใช้เฉพาะตอนสร้างแคตตาล็อก ไม่แสดงชื่อแหล่งใน UI)
BASE = "https://www.dft.go.th/"
OUT = Path(__file__).resolve().parents[1] / "src/app/pages/staff/measure-catalog.ts"

# หมายเหตุ: สคริปต์นี้เก็บโครงเดิมไว้ให้สร้างไฟล์ measure-catalog.ts
# หากต้องดึงข้อมูลใหม่ ให้ปรับแหล่งและตัวแยกข้อมูลตามหน้าเว็บไซต์กองที่ใช้จริง


def main() -> None:
    if OUT.exists():
        print(f"มีแคตตาล็อกอยู่แล้ว: {OUT}")
        print("ถ้าต้องการสร้างใหม่ ให้ปรับแหล่งข้อมูลในสคริปต์นี้ก่อน")
        return
    body = "[]"
    OUT.write_text(
        "export type MeasureCatalogItem = {\n"
        "  code: string;\n"
        "  goods: string;\n"
        "  origin: string;\n"
        "  measure: string;\n"
        "  side: 'ใช้' | 'ถูก';\n"
        "  status: string;\n"
        "  date: string;\n"
        "  hs: string;\n"
        "};\n\n"
        f"export const measureCatalog: MeasureCatalogItem[] = {body};\n",
        encoding="utf-8",
    )
    print("wrote", OUT)


if __name__ == "__main__":
    main()
