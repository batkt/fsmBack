// Барааны ангиллын (fsmTurul, zoriulalt: "baraa") нийтлэг туслахууд.
//
// Өмнө нь `baraa.turul`-д "tseverlegch", "ugaalgiin" гэх мэт хатуу түлхүүр
// бичигддэг байсан бол одоо ангиллын нэр өөрөө (жишээ нь "Цэвэрлэгээ")
// бичигдэнэ. Шилжүүлэх скрипт ажиллахаас өмнө ч, дараа нь ч зөв ажиллахын
// тулд хуучин түлхүүрийг нэг газраас л нэр рүү хөрвүүлнэ.

export const KHUUCHIN_ANGILAL: Record<string, string> = {
  tseverlegch: "Цэвэрлэгээ",
  "цэвэрлэгч": "Цэвэрлэгээ",
  ugaalgiin: "Угаалгын",
  ariutgagch: "Ариутгагч",
  bagaj: "Багаж",
  busad: "Бусад",
};

export const UNDSEN_ANGILAL = "Бусад";

// fsmTurul-ийг өмнө нь зөвхөн бараанд ашигладаг байсан тул `zoriulalt`
// талбаргүй хуучин бичлэгүүдийг бараанд хамааруулна.
export const BARAA_ZORIULALT_QUERY = { $in: ["baraa", null] };

/** Хуучин түлхүүрийг ангиллын нэр болгоно. Хоосон бол "". */
export function angilalNerAvakh(turul: any): string {
  const utga = String(turul ?? "").trim();
  if (!utga) return "";
  return KHUUCHIN_ANGILAL[utga] || KHUUCHIN_ANGILAL[utga.toLowerCase()] || utga;
}

/** Нэрийг харьцуулахад: trim, жижиг үсэг, давхар зай нэг болгоно. */
export function nerNormchlokh(ner: any): string {
  return String(ner ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

export function regexZugshruulakh(utga: string): string {
  return utga.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Нэрийг том жижиг үсэг ялгахгүй яг тааруулах regex. */
export function nerRegex(ner: string): RegExp {
  return new RegExp(`^\\s*${regexZugshruulakh(String(ner).trim())}\\s*$`, "i");
}

/**
 * Тухайн ангилалд хамаарах `baraa.turul`-ийн бүх боломжит утга — нэр өөрөө
 * болон шилжүүлэлт хийгдээгүй үед үлдсэн хуучин түлхүүрүүд.
 */
export function angilalTulkhuuruud(ner: string): string[] {
  const jagsaalt = new Set<string>([ner]);
  for (const [tulkhuur, utga] of Object.entries(KHUUCHIN_ANGILAL)) {
    if (nerNormchlokh(utga) === nerNormchlokh(ner)) {
      jagsaalt.add(tulkhuur);
      // "Цэвэрлэгч" гэх мэт кирилл түлхүүрийн анхны хэлбэр
      if (tulkhuur === "цэвэрлэгч") jagsaalt.add("Цэвэрлэгч");
    }
  }
  return Array.from(jagsaalt);
}
