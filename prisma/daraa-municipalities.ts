/**
 * بلديات ومراكز محافظة درعا (قائمة قابلة للتوسعة).
 * الترتيب للعرض في النماذج؛ التمييز الفعلي بالحقل `code`.
 */
export type DaraaMunicipalitySeed = {
  code: string;
  name: string;
  sortOrder: number;
};

export const DARAA_MUNICIPALITIES: DaraaMunicipalitySeed[] = [
  { code: "bosra-sham", name: "بصرى الشام", sortOrder: 10 },
  { code: "bosra-harir", name: "بصرى الحرير", sortOrder: 20 },
  { code: "daraa-city", name: "مدينة درعا", sortOrder: 30 },
  { code: "izraa", name: "إزرع", sortOrder: 40 },
  { code: "nawa", name: "نوى", sortOrder: 50 },
  { code: "tafas", name: "طفس", sortOrder: 60 },
  { code: "dael", name: "داعل", sortOrder: 70 },
  { code: "harak", name: "الحراك", sortOrder: 80 },
  { code: "muzayrib", name: "المزيريب", sortOrder: 90 },
  { code: "jasem", name: "جاسم", sortOrder: 100 },
  { code: "inkhel", name: "انخل", sortOrder: 110 },
  { code: "sanamein", name: "الصنمين", sortOrder: 120 },
  { code: "ghabagheb", name: "غباغب", sortOrder: 130 },
  { code: "khirbet-ghazaleh", name: "خربة غزالة", sortOrder: 140 },
  { code: "sheikh-miskeen", name: "الشيخ مسكين", sortOrder: 150 },
  { code: "tal-shihab", name: "تل شهاب", sortOrder: 160 },
  { code: "al-shajara", name: "الشجرة", sortOrder: 170 },
  { code: "kafr-shams", name: "كفر شمس", sortOrder: 180 },
  { code: "tall-ala", name: "طلعة", sortOrder: 190 },
  { code: "nimr", name: "نمر", sortOrder: 200 },
  { code: "sahm-jawlan", name: "سحم الجولان", sortOrder: 210 },
  { code: "al-arida", name: "العريضة", sortOrder: 220 },
  { code: "al-jiza", name: "الجيزة", sortOrder: 230 },
  { code: "kafr-nasej", name: "كفر ناسج", sortOrder: 240 },
  { code: "al-harra", name: "الحرّة", sortOrder: 250 },
  { code: "maliha-atash", name: "مليحة العطش", sortOrder: 260 },
  { code: "kaheel", name: "كحيل", sortOrder: 270 },
  { code: "om-walad", name: "أم ولد", sortOrder: 280 },
  { code: "mataa", name: "متاع", sortOrder: 290 },
  { code: "kafr-yusuf", name: "كفر يوسف", sortOrder: 300 },
  { code: "alma", name: "علما", sortOrder: 310 },
  { code: "muaraba", name: "معربة", sortOrder: 320 },
  { code: "taybeh", name: "الطيبة", sortOrder: 330 },
  { code: "sais", name: "سيس", sortOrder: 340 },
  { code: "deir", name: "ديل", sortOrder: 350 },
  { code: "al-masmiya", name: "المسمية", sortOrder: 360 },
  { code: "ghariya", name: "الغارية الشرقية", sortOrder: 370 },
  { code: "nahata", name: "نهيطة", sortOrder: 380 },
  { code: "jamlah", name: "جملة", sortOrder: 390 },
  { code: "abdah", name: "عبدة", sortOrder: 400 },
];
