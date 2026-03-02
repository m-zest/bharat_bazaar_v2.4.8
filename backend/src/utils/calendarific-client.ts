// Calendarific API client for fetching Indian holidays
// Free tier: 1000 requests/day
// Docs: https://calendarific.com/api-documentation

const CALENDARIFIC_BASE_URL = 'https://calendarific.com/api/v2/holidays';

export interface CalendarificHoliday {
  name: string;
  description: string;
  country: { id: string; name: string };
  date: {
    iso: string; // "2026-01-26"
    datetime: { year: number; month: number; day: number };
  };
  type: string[]; // ["National holiday"], ["Observance"], ["Hindu"], etc.
  primary_type: string;
  canonical_url: string;
  urlid: string;
  locations: string; // "All" or specific states
  states: { id: number; abbrev: string; name: string; exception: string; iso: string }[] | 'All';
}

export interface CalendarificResponse {
  meta: { code: number };
  response: {
    holidays: CalendarificHoliday[];
  };
}

export interface FetchHolidaysOptions {
  year?: number;
  month?: number;
  type?: string; // "national", "local", "religious", "observance"
}

/**
 * Fetch holidays from Calendarific API for India
 */
export async function fetchCalendarificHolidays(options: FetchHolidaysOptions = {}): Promise<CalendarificHoliday[]> {
  const apiKey = process.env.CALENDARIFIC_API_KEY;
  if (!apiKey) {
    console.warn('CALENDARIFIC_API_KEY not set — skipping API fetch');
    return [];
  }

  const year = options.year || new Date().getFullYear();
  const params = new URLSearchParams({
    api_key: apiKey,
    country: 'IN',
    year: year.toString(),
  });

  if (options.month) params.set('month', options.month.toString());
  if (options.type) params.set('type', options.type);

  const url = `${CALENDARIFIC_BASE_URL}?${params.toString()}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Calendarific API error: ${response.status} ${response.statusText}`);
      return [];
    }

    const data = (await response.json()) as CalendarificResponse;
    if (data.meta?.code !== 200) {
      console.error('Calendarific API returned error code:', data.meta?.code);
      return [];
    }

    return data.response?.holidays || [];
  } catch (err: any) {
    console.error('Calendarific fetch failed:', err.message);
    return [];
  }
}

/**
 * Map Calendarific holiday type strings to our type system
 */
export function mapCalendarificType(types: string[]): 'national' | 'regional' {
  const typeStr = types.map(t => t.toLowerCase()).join(' ');
  if (typeStr.includes('national') || typeStr.includes('gazetted')) {
    return 'national';
  }
  return 'regional';
}

/**
 * Generate a URL-friendly slug from a holiday name and date
 */
export function generateHolidaySlug(name: string, dateIso: string): string {
  const year = dateIso.split('-')[0];
  const slug = name
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return `${slug}-${year}`;
}

/**
 * Map Calendarific types to product categories that may see demand changes
 */
export function inferCategories(types: string[], name: string): string[] {
  const categories: string[] = [];
  const nameLower = name.toLowerCase();
  const typeStr = types.map(t => t.toLowerCase()).join(' ');

  // Religious / festival holidays generally boost these
  if (typeStr.includes('hindu') || typeStr.includes('religious') || typeStr.includes('muslim') || typeStr.includes('sikh') || typeStr.includes('christian') || typeStr.includes('jain') || typeStr.includes('buddhist')) {
    categories.push('Groceries', 'Fashion');
  }

  // National holidays
  if (typeStr.includes('national') || typeStr.includes('gazetted')) {
    categories.push('Books & Stationery');
  }

  // Specific keyword-based category inference
  if (nameLower.includes('diwali') || nameLower.includes('deepavali')) {
    categories.push('Electronics', 'Home & Kitchen', 'Beauty & Personal Care');
  }
  if (nameLower.includes('holi')) {
    categories.push('Beauty & Personal Care', 'Toys & Baby Products');
  }
  if (nameLower.includes('eid')) {
    categories.push('Beauty & Personal Care');
  }
  if (nameLower.includes('raksha') || nameLower.includes('rakhi')) {
    categories.push('Beauty & Personal Care', 'Electronics');
  }
  if (nameLower.includes('navratri') || nameLower.includes('durga') || nameLower.includes('ganesh')) {
    categories.push('Home & Kitchen');
  }
  if (nameLower.includes('christmas') || nameLower.includes('new year')) {
    categories.push('Electronics', 'Toys & Baby Products');
  }
  if (nameLower.includes('onam') || nameLower.includes('pongal') || nameLower.includes('bihu') || nameLower.includes('baisakhi')) {
    categories.push('Electronics', 'Home & Kitchen');
  }

  // Default fallback
  if (categories.length === 0) {
    categories.push('Groceries', 'Fashion');
  }

  // Deduplicate
  return [...new Set(categories)];
}

/**
 * Estimate demand multiplier based on holiday type and importance
 */
export function estimateDemandMultiplier(types: string[], name: string): number {
  const nameLower = name.toLowerCase();

  // Major festivals with very high retail impact
  if (nameLower.includes('diwali') || nameLower.includes('deepavali')) return 3.0;
  if (nameLower.includes('durga puja')) return 2.8;
  if (nameLower.includes('raksha bandhan') || nameLower.includes('rakhi')) return 2.5;
  if (nameLower.includes('onam') || nameLower.includes('pongal')) return 2.5;
  if (nameLower.includes('navratri')) return 2.3;
  if (nameLower.includes('eid')) return 2.3;
  if (nameLower.includes('holi')) return 2.2;
  if (nameLower.includes('ganesh chaturthi')) return 2.0;
  if (nameLower.includes('dussehra') || nameLower.includes('vijayadashami')) return 2.0;
  if (nameLower.includes('bihu') || nameLower.includes('baisakhi')) return 2.0;
  if (nameLower.includes('christmas')) return 1.8;
  if (nameLower.includes('karva chauth')) return 1.8;
  if (nameLower.includes('chhath')) return 2.0;

  // General category based
  const typeStr = types.map(t => t.toLowerCase()).join(' ');
  if (typeStr.includes('national') || typeStr.includes('gazetted')) return 1.3;
  if (typeStr.includes('religious') || typeStr.includes('hindu') || typeStr.includes('muslim')) return 1.5;

  return 1.2; // default for observances
}

/**
 * Extract regions from Calendarific states field
 */
export function extractRegions(states: CalendarificHoliday['states']): string[] {
  if (states === 'All' || !Array.isArray(states)) {
    return ['all'];
  }
  return states.map(s => s.name);
}
