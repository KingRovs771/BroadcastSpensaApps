export interface AcademicSemester {
  semester: 'ganjil' | 'genap';
  tahunAjaran: string; // e.g. "2026/2027"
  label: string;       // e.g. "Semester Ganjil 2026/2027"
}

/**
 * Menghitung semester akademik Spensa berdasarkan aturan:
 * 1. Bulan Juli (7) -> Semester Ganjil tahun ajaran baru (year/year+1)
 * 2. Bulan Desember (12) -> Semester Genap tahun ajaran berjalan (year/year+1)
 * 3. Bulan Agustus - November (8-11) -> Semester Ganjil normal (year/year+1)
 * 4. Bulan Januari - Juni (1-6) -> Semester Genap normal (year-1/year)
 */
export function getAcademicSemester(dateInput: Date | string): AcademicSemester {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const month = date.getMonth() + 1; // 1 - 12
  const year = date.getFullYear();

  // RULE 1: Bulan Juli (7) -> Masuk Semester Ganjil tahun ajaran baru (year/year+1)
  if (month === 7) {
    return {
      semester: 'ganjil',
      tahunAjaran: `${year}/${year + 1}`,
      label: `Semester Ganjil ${year}/${year + 1}`
    };
  }

  // RULE 2: Bulan Desember (12) -> Masuk Semester Genap tahun ajaran berjalan (year/year+1)
  if (month === 12) {
    return {
      semester: 'genap',
      tahunAjaran: `${year}/${year + 1}`,
      label: `Semester Genap ${year}/${year + 1}`
    };
  }

  // RULE 3: Agustus - November (8-11) -> Semester Ganjil normal
  if (month >= 8 && month <= 11) {
    return {
      semester: 'ganjil',
      tahunAjaran: `${year}/${year + 1}`,
      label: `Semester Ganjil ${year}/${year + 1}`
    };
  }

  // RULE 4: Januari - Juni (1-6) -> Semester Genap normal (year-1/year)
  return {
    semester: 'genap',
    tahunAjaran: `${year - 1}/${year}`,
    label: `Semester Genap ${year - 1}/${year}`
  };
}
