import { Injectable, signal } from '@angular/core';

type Lang = 'th' | 'en';
type Named = { id: number; name: { th: string; en: string } };
type District = Named & { province_id: number };
type Subdistrict = Named & { district_id: number; zip_code: number };

const source = 'https://raw.githubusercontent.com/kongvut/thai-province-data/master/api/latest';

@Injectable({ providedIn: 'root' })
export class ThaiAddress {
  readonly provinces = signal<Named[]>([]);
  private readonly districts = signal<District[]>([]);
  private readonly subdistricts = signal<Subdistrict[]>([]);
  private request?: Promise<void>;

  load(): Promise<void> {
    this.request ??= Promise.all([
      fetch(`${source}/province.json`).then((response) => response.json()),
      fetch(`${source}/district.json`).then((response) => response.json()),
      fetch(`${source}/sub_district.json`).then((response) => response.json()),
    ]).then(([provinces, districts, subdistricts]: [Named[], District[], Subdistrict[]]) => {
      this.provinces.set(provinces);
      this.districts.set(districts);
      this.subdistricts.set(subdistricts);
    });
    return this.request;
  }

  districtOptions(provinceName: string, lang: Lang = 'th'): District[] {
    const province = this.provinces().find((item) => item.name[lang] === provinceName);
    if (!province) return [];
    return this.districts().filter((item) => item.province_id === province.id);
  }

  matches(provinceName: string, districtName: string, subdistrictName: string, postcode: string, lang: Lang = 'th'): boolean {
    const match = this.subdistrictOptions(provinceName, districtName, lang).find((item) => item.name[lang] === subdistrictName);
    return !!match && String(match.zip_code) === postcode;
  }

  subdistrictOptions(provinceName: string, districtName: string, lang: Lang = 'th'): Subdistrict[] {
    const district = this.districtOptions(provinceName, lang).find((item) => item.name[lang] === districtName);
    if (!district) return [];
    return this.subdistricts().filter((item) => item.district_id === district.id);
  }
}
