// Section formatting utilities for English and Nepali Alphabetical & Number formats

export type SectionFormatType =
  | 'en-alpha' // A, B, C, D...
  | 'en-num' // 1, 2, 3, 4...
  | 'ne-alpha' // क, ख, ग, घ...
  | 'ne-num' // १, २, ३, ४...
  | 'bilingual-alpha' // A (क), B (ख)...
  | 'bilingual-num'; // 1 (१), 2 (२)...

export const SECTION_PRESETS = {
  'en-alpha': ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'],
  'en-num': ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
  'ne-alpha': ['क', 'ख', 'ग', 'घ', 'ङ', 'च', 'छ', 'ज', 'झ', 'ञ'],
  'ne-num': ['१', '२', '३', '४', '५', '६', '७', '८', '९', '१०'],
  'bilingual-alpha': ['A (क)', 'B (ख)', 'C (ग)', 'D (घ)', 'E (ङ)', 'F (च)'],
  'bilingual-num': ['1 (१)', '2 (२)', '3 (३)', '4 (४)', '5 (५)', '6 (६)'],
};

export const FORMAT_LABELS: Record<SectionFormatType, { title: string; subtitle: string; icon: string }> = {
  'en-alpha': {
    title: 'English Alphabet',
    subtitle: 'A, B, C, D...',
    icon: '🔤',
  },
  'en-num': {
    title: 'English Numbers',
    subtitle: '1, 2, 3, 4...',
    icon: '🔢',
  },
  'ne-alpha': {
    title: 'नेपाली वर्णमाला (Alphabet)',
    subtitle: 'क, ख, ग, घ...',
    icon: '🇳🇵',
  },
  'ne-num': {
    title: 'नेपाली अङ्क (Numbers)',
    subtitle: '१, २, ३, ४...',
    icon: '🇳🇵',
  },
  'bilingual-alpha': {
    title: 'Bilingual Letters (संयुक्त)',
    subtitle: 'A (क), B (ख)...',
    icon: '🌐',
  },
  'bilingual-num': {
    title: 'Bilingual Numbers (संयुक्त)',
    subtitle: '1 (१), 2 (२)...',
    icon: '🌐',
  },
};

// Character lookup lists for mapping between formats
const EN_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P'];
const EN_NUMBERS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16'];
const NE_LETTERS = ['क', 'ख', 'ग', 'घ', 'ङ', 'च', 'छ', 'ज', 'झ', 'ञ', 'ट', 'ठ', 'ड', 'ढ', 'ण', 'त'];
const NE_NUMBERS = ['१', '२', '३', '४', '५', '६', '७', '८', '९', '१०', '११', '१२', '१३', '१४', '१५', '१६'];

/**
 * Detect the likely format of a section string
 */
export const detectSectionFormat = (sec: string): SectionFormatType | 'custom' => {
  const trimmed = sec.trim();
  if (EN_LETTERS.includes(trimmed.toUpperCase())) return 'en-alpha';
  if (EN_NUMBERS.includes(trimmed)) return 'en-num';
  if (NE_LETTERS.includes(trimmed)) return 'ne-alpha';
  if (NE_NUMBERS.includes(trimmed)) return 'ne-num';
  if (/\([क-ह]\)/.test(trimmed)) return 'bilingual-alpha';
  if (/\([१-९०]\)/.test(trimmed)) return 'bilingual-num';
  return 'custom';
};

/**
 * Convert section from one standard format to another based on index position
 */
export const convertSectionFormat = (current: string, target: SectionFormatType): string => {
  const trimmed = current.trim();

  // Find index in any known list
  let index = -1;
  const upper = trimmed.toUpperCase();
  index = EN_LETTERS.indexOf(upper);
  if (index === -1) index = EN_NUMBERS.indexOf(trimmed);
  if (index === -1) index = NE_LETTERS.indexOf(trimmed);
  if (index === -1) index = NE_NUMBERS.indexOf(trimmed);

  // If not found in simple lists, try extracting first letter/number
  if (index === -1) {
    const matchEn = upper.match(/^[A-P]/);
    if (matchEn) index = EN_LETTERS.indexOf(matchEn[0]);
  }
  if (index === -1) {
    const matchNum = trimmed.match(/^\d+/);
    if (matchNum) index = parseInt(matchNum[0], 10) - 1;
  }
  if (index === -1) {
    for (let i = 0; i < NE_LETTERS.length; i++) {
      if (trimmed.includes(NE_LETTERS[i])) {
        index = i;
        break;
      }
    }
  }

  // Fallback to index 0 if unknown
  const safeIndex = index >= 0 && index < EN_LETTERS.length ? index : 0;

  switch (target) {
    case 'en-alpha':
      return EN_LETTERS[safeIndex] || 'A';
    case 'en-num':
      return EN_NUMBERS[safeIndex] || '1';
    case 'ne-alpha':
      return NE_LETTERS[safeIndex] || 'क';
    case 'ne-num':
      return NE_NUMBERS[safeIndex] || '१';
    case 'bilingual-alpha':
      return `${EN_LETTERS[safeIndex]} (${NE_LETTERS[safeIndex]})`;
    case 'bilingual-num':
      return `${EN_NUMBERS[safeIndex]} (${NE_NUMBERS[safeIndex]})`;
    default:
      return current;
  }
};

/**
 * Format section label with appropriate English / Nepali contextual phrasing
 */
export const formatSectionLabel = (section: string): { label: string; prefix: string; nepaliPrefix: string } => {
  const trimmed = (section || '').trim();
  const format = detectSectionFormat(trimmed);

  if (format === 'ne-alpha' || format === 'ne-num') {
    return {
      label: trimmed,
      prefix: 'Section',
      nepaliPrefix: 'खण्ड',
    };
  }

  if (format === 'en-num' || format === 'en-alpha') {
    return {
      label: trimmed,
      prefix: 'Section',
      nepaliPrefix: 'खण्ड',
    };
  }

  return {
    label: trimmed,
    prefix: 'Section',
    nepaliPrefix: 'खण्ड',
  };
};

/**
 * Clean and normalize a section name entered by user
 */
export const normalizeSectionInput = (input: string): string => {
  const trimmed = input.trim();
  if (/^[a-zA-Z]$/.test(trimmed)) {
    return trimmed.toUpperCase();
  }
  return trimmed;
};

/**
 * Quick character palette for on-screen typing assistance
 */
export const QUICK_CHARACTERS = {
  nepaliLetters: ['क', 'ख', 'ग', 'घ', 'ङ', 'च', 'छ', 'ज', 'झ', 'ञ'],
  nepaliNumbers: ['१', '२', '३', '४', '५', '६', '७', '८', '९', '१०'],
  englishLetters: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
  englishNumbers: ['1', '2', '3', '4', '5', '6', '7', '8'],
  prefixes: ['खण्ड ', 'Section ', 'Sec '],
};
