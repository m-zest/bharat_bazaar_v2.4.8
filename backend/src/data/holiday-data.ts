// Holiday and supplier data for Indian retail demand planning
// Combines Calendarific API data with static enrichment (Hindi names, traditions, categories)

import {
  fetchCalendarificHolidays,
  mapCalendarificType,
  generateHolidaySlug,
  inferCategories,
  estimateDemandMultiplier,
  extractRegions,
  CalendarificHoliday,
} from '../utils/calendarific-client';
import { getCache, setCache } from '../utils/redis-client';

export interface Holiday {
  id: string;
  name: string;
  nameHi: string;
  date: string; // YYYY-MM-DD
  month: number;
  type: 'national' | 'regional';
  description: string;
  regions: string[];
  categories: string[];
  demandMultiplier: number;
  traditions: string[];
  source: 'static' | 'calendarific' | 'enriched'; // tracks data origin
}

export interface Supplier {
  id: string;
  name: string;
  city: string;
  rating: number;
  categories: string[];
  minOrderQty: number;
  priceRange: string;
  deliveryDays: number;
  paymentTerms: string;
  contact: string;
}

// --- National Holidays (pan-India) ---

export const NATIONAL_HOLIDAYS: Omit<Holiday, 'source'>[] = [
  {
    id: 'makar-sankranti-2026',
    name: 'Makar Sankranti',
    nameHi: 'मकर संक्रांति',
    date: '2026-01-14',
    month: 1,
    type: 'national',
    description: 'Harvest festival celebrated across India. Kite flying in Gujarat, Pongal in Tamil Nadu, Lohri in Punjab.',
    regions: ['all'],
    categories: ['Groceries', 'Sports & Fitness', 'Fashion'],
    demandMultiplier: 1.8,
    traditions: ['Kite flying', 'Til-gur sweets', 'Sesame & jaggery products', 'New clothes'],
  },
  {
    id: 'republic-day-2026',
    name: 'Republic Day',
    nameHi: 'गणतंत्र दिवस',
    date: '2026-01-26',
    month: 1,
    type: 'national',
    description: 'National holiday celebrating the Constitution of India. Schools and offices organize events.',
    regions: ['all'],
    categories: ['Books & Stationery', 'Fashion'],
    demandMultiplier: 1.2,
    traditions: ['Flag hoisting', 'Patriotic events', 'School functions'],
  },
  {
    id: 'holi-2026',
    name: 'Holi',
    nameHi: 'होली',
    date: '2026-03-17',
    month: 3,
    type: 'national',
    description: 'Festival of colors. Massive demand for colors, sweets, water guns, and white clothing.',
    regions: ['all'],
    categories: ['Groceries', 'Beauty & Personal Care', 'Toys & Baby Products', 'Fashion'],
    demandMultiplier: 2.2,
    traditions: ['Color play', 'Gujiya & thandai', 'Water guns (pichkari)', 'White clothes', 'Bhang preparation'],
  },
  {
    id: 'eid-ul-fitr-2026',
    name: 'Eid ul-Fitr',
    nameHi: 'ईद उल-फ़ित्र',
    date: '2026-03-20',
    month: 3,
    type: 'national',
    description: 'Marks end of Ramadan. Major demand for clothing, perfumes, dry fruits, and sweets.',
    regions: ['all'],
    categories: ['Fashion', 'Groceries', 'Beauty & Personal Care'],
    demandMultiplier: 2.3,
    traditions: ['New clothes (especially kurta-pajama)', 'Attar/perfume', 'Sewaiyan', 'Dry fruits', 'Gift boxes'],
  },
  {
    id: 'raksha-bandhan-2026',
    name: 'Raksha Bandhan',
    nameHi: 'रक्षा बंधन',
    date: '2026-08-11',
    month: 8,
    type: 'national',
    description: 'Festival of sibling bond. Rakhis, sweets, and gifts drive massive retail demand.',
    regions: ['all'],
    categories: ['Fashion', 'Groceries', 'Beauty & Personal Care', 'Electronics'],
    demandMultiplier: 2.5,
    traditions: ['Rakhi threads', 'Mithai boxes', 'Gift sets', 'Chocolates', 'Sibling gifts'],
  },
  {
    id: 'independence-day-2026',
    name: 'Independence Day',
    nameHi: 'स्वतंत्रता दिवस',
    date: '2026-08-15',
    month: 8,
    type: 'national',
    description: 'National holiday. Demand for tricolor items, flags, and patriotic merchandise.',
    regions: ['all'],
    categories: ['Books & Stationery', 'Fashion'],
    demandMultiplier: 1.3,
    traditions: ['Flag hoisting', 'Tricolor merchandise', 'School events', 'Kite flying (some regions)'],
  },
  {
    id: 'ganesh-chaturthi-2026',
    name: 'Ganesh Chaturthi',
    nameHi: 'गणेश चतुर्थी',
    date: '2026-08-27',
    month: 8,
    type: 'national',
    description: '10-day festival for Lord Ganesha. Massive in Maharashtra, growing pan-India.',
    regions: ['all'],
    categories: ['Groceries', 'Home & Kitchen', 'Fashion'],
    demandMultiplier: 2.0,
    traditions: ['Ganesh idols', 'Modak & laddu', 'Pooja items', 'Flowers & decoration', 'Eco-friendly idols'],
  },
  {
    id: 'navratri-2026',
    name: 'Navratri',
    nameHi: 'नवरात्रि',
    date: '2026-10-08',
    month: 10,
    type: 'national',
    description: '9-night festival of dance and worship. Garba nights drive fashion and accessories demand.',
    regions: ['all'],
    categories: ['Fashion', 'Beauty & Personal Care', 'Groceries', 'Electronics'],
    demandMultiplier: 2.3,
    traditions: ['Garba/Dandiya nights', 'Chaniya choli', 'Dandiya sticks', 'Pooja items', '9 colors for 9 days'],
  },
  {
    id: 'dussehra-2026',
    name: 'Dussehra',
    nameHi: 'दशहरा',
    date: '2026-10-17',
    month: 10,
    type: 'national',
    description: 'Victory of good over evil. Marks beginning of wedding and festive shopping season.',
    regions: ['all'],
    categories: ['Fashion', 'Electronics', 'Home & Kitchen'],
    demandMultiplier: 2.0,
    traditions: ['Ravan dahan', 'New purchases (shubh muhurat)', 'Gold & vehicle buying', 'Weapon worship'],
  },
  {
    id: 'karva-chauth-2026',
    name: 'Karva Chauth',
    nameHi: 'करवा चौथ',
    date: '2026-10-24',
    month: 10,
    type: 'national',
    description: 'Fasting festival for married women. High demand for fashion, jewelry, and beauty products.',
    regions: ['all'],
    categories: ['Fashion', 'Beauty & Personal Care', 'Groceries'],
    demandMultiplier: 1.8,
    traditions: ['Mehndi/henna', 'Bangles & jewelry', 'Sargi thali', 'Karva (earthen pot)', 'Saree/suit shopping'],
  },
  {
    id: 'diwali-2026',
    name: 'Diwali',
    nameHi: 'दिवाली',
    date: '2026-11-05',
    month: 11,
    type: 'national',
    description: 'Festival of lights. Biggest retail event in India — electronics, fashion, home decor, sweets, firecrackers.',
    regions: ['all'],
    categories: ['Electronics', 'Fashion', 'Home & Kitchen', 'Groceries', 'Beauty & Personal Care'],
    demandMultiplier: 3.0,
    traditions: ['Diyas & candles', 'Rangoli', 'Lakshmi-Ganesh pooja', 'Sweets & dry fruits', 'Firecrackers', 'Home cleaning', 'New electronics', 'Gold buying'],
  },
  {
    id: 'bhai-dooj-2026',
    name: 'Bhai Dooj',
    nameHi: 'भाई दूज',
    date: '2026-11-07',
    month: 11,
    type: 'national',
    description: 'Sibling festival after Diwali. Gifts and sweets for brothers.',
    regions: ['all'],
    categories: ['Fashion', 'Electronics', 'Groceries'],
    demandMultiplier: 1.5,
    traditions: ['Tilak ceremony', 'Gifts for brothers', 'Sweets', 'Family gatherings'],
  },
  {
    id: 'christmas-2026',
    name: 'Christmas',
    nameHi: 'क्रिसमस',
    date: '2026-12-25',
    month: 12,
    type: 'national',
    description: 'Year-end celebrations. Growing retail event across India with gift exchanges and sales.',
    regions: ['all'],
    categories: ['Electronics', 'Fashion', 'Toys & Baby Products', 'Groceries'],
    demandMultiplier: 1.8,
    traditions: ['Gift exchanges', 'Christmas trees & decor', 'Cakes & plum pudding', 'Year-end sales', 'Secret Santa'],
  },
  {
    id: 'new-year-2027',
    name: 'New Year',
    nameHi: 'नया साल',
    date: '2027-01-01',
    month: 1,
    type: 'national',
    description: 'New Year celebrations. Demand for party supplies, fashion, and gift items.',
    regions: ['all'],
    categories: ['Fashion', 'Groceries', 'Electronics'],
    demandMultiplier: 1.5,
    traditions: ['Parties', 'New Year resolutions shopping', 'Calendars & diaries', 'Gift hampers'],
  },
];

// --- Regional Holidays ---

export const REGIONAL_HOLIDAYS: Omit<Holiday, 'source'>[] = [
  {
    id: 'pongal-2026',
    name: 'Pongal',
    nameHi: 'पोंगल',
    date: '2026-01-15',
    month: 1,
    type: 'regional',
    description: 'Tamil harvest festival. 4-day celebration with new clothes, sweets, and kolam.',
    regions: ['Tamil Nadu', 'Puducherry', 'Sri Lankan Tamils'],
    categories: ['Groceries', 'Home & Kitchen', 'Fashion', 'Electronics'],
    demandMultiplier: 2.5,
    traditions: ['Pongal pot', 'New rice & sugarcane', 'Kolam/Rangoli', 'New clothes', 'Cattle decoration'],
  },
  {
    id: 'lohri-2026',
    name: 'Lohri',
    nameHi: 'लोहड़ी',
    date: '2026-01-13',
    month: 1,
    type: 'regional',
    description: 'Punjabi bonfire festival. Celebrated with rewri, peanuts, popcorn, and bhangra.',
    regions: ['Punjab', 'Haryana', 'Himachal Pradesh', 'Delhi'],
    categories: ['Groceries', 'Fashion'],
    demandMultiplier: 1.8,
    traditions: ['Bonfire', 'Rewri & gajak', 'Peanuts & popcorn', 'Bhangra', 'New baby celebrations'],
  },
  {
    id: 'baisakhi-2026',
    name: 'Baisakhi',
    nameHi: 'बैसाखी',
    date: '2026-04-13',
    month: 4,
    type: 'regional',
    description: 'Punjabi New Year and harvest festival. Bhangra, new clothes, and festive food.',
    regions: ['Punjab', 'Haryana'],
    categories: ['Fashion', 'Groceries', 'Electronics'],
    demandMultiplier: 2.0,
    traditions: ['Bhangra & Gidda', 'New turbans', 'Festive food', 'Gurudwara visits', 'Fair & mela'],
  },
  {
    id: 'ugadi-2026',
    name: 'Ugadi / Gudi Padwa',
    nameHi: 'उगादी / गुड़ी पाड़वा',
    date: '2026-03-29',
    month: 3,
    type: 'regional',
    description: 'New Year for Karnataka, AP, Telangana (Ugadi) and Maharashtra (Gudi Padwa).',
    regions: ['Karnataka', 'Andhra Pradesh', 'Telangana', 'Maharashtra'],
    categories: ['Groceries', 'Home & Kitchen', 'Fashion'],
    demandMultiplier: 1.8,
    traditions: ['Ugadi pachadi', 'Gudi flag', 'Neem & jaggery', 'New clothes', 'Home decoration'],
  },
  {
    id: 'vishu-2026',
    name: 'Vishu',
    nameHi: 'विशु',
    date: '2026-04-14',
    month: 4,
    type: 'regional',
    description: 'Kerala New Year. Vishukkani arrangement at dawn with fruits, gold, and flowers.',
    regions: ['Kerala'],
    categories: ['Groceries', 'Fashion', 'Home & Kitchen'],
    demandMultiplier: 1.7,
    traditions: ['Vishukkani', 'Vishukaineetam (money gift)', 'New clothes', 'Sadhya feast', 'Firecrackers'],
  },
  {
    id: 'bihu-2026',
    name: 'Bihu (Rongali)',
    nameHi: 'बिहू',
    date: '2026-04-14',
    month: 4,
    type: 'regional',
    description: 'Assamese New Year. Week-long festival with dance, food, and traditional games.',
    regions: ['Assam', 'Northeast India'],
    categories: ['Fashion', 'Groceries', 'Home & Kitchen'],
    demandMultiplier: 2.0,
    traditions: ['Bihu dance', 'Gamosa (traditional cloth)', 'Pitha (rice cakes)', 'Buffalo fights', 'Traditional weaving'],
  },
  {
    id: 'rath-yatra-2026',
    name: 'Rath Yatra',
    nameHi: 'रथ यात्रा',
    date: '2026-06-27',
    month: 6,
    type: 'regional',
    description: 'Chariot festival of Lord Jagannath in Puri. Draws millions of devotees.',
    regions: ['Odisha', 'West Bengal', 'Gujarat'],
    categories: ['Groceries', 'Fashion', 'Home & Kitchen'],
    demandMultiplier: 1.6,
    traditions: ['Chariot pulling', 'Prasad & mahaprasad', 'Religious merchandise', 'Devotional items'],
  },
  {
    id: 'teej-2026',
    name: 'Teej',
    nameHi: 'तीज',
    date: '2026-08-13',
    month: 8,
    type: 'regional',
    description: 'Women\'s festival celebrated in Rajasthan, MP, UP. Mehendi, bangles, and swings.',
    regions: ['Rajasthan', 'Madhya Pradesh', 'Uttar Pradesh', 'Bihar'],
    categories: ['Fashion', 'Beauty & Personal Care', 'Groceries'],
    demandMultiplier: 1.9,
    traditions: ['Mehndi application', 'Green bangles & sarees', 'Ghewar sweet', 'Swing festivals', 'Fasting'],
  },
  {
    id: 'onam-2026',
    name: 'Onam',
    nameHi: 'ओणम',
    date: '2026-09-03',
    month: 9,
    type: 'regional',
    description: 'Kerala\'s biggest festival. 10-day celebration with boat races, Sadhya feast, and shopping.',
    regions: ['Kerala'],
    categories: ['Fashion', 'Electronics', 'Groceries', 'Home & Kitchen'],
    demandMultiplier: 2.5,
    traditions: ['Onam Sadhya (feast)', 'Pookalam (flower rangoli)', 'Boat races', 'Kasavu saree', 'Onakalikal (games)'],
  },
  {
    id: 'durga-puja-2026',
    name: 'Durga Puja',
    nameHi: 'दुर्गा पूजा',
    date: '2026-10-12',
    month: 10,
    type: 'regional',
    description: 'Bengal\'s grandest festival. 5 days of pandal hopping, fashion, and feasting.',
    regions: ['West Bengal', 'Odisha', 'Assam', 'Tripura', 'Jharkhand'],
    categories: ['Fashion', 'Electronics', 'Home & Kitchen', 'Groceries', 'Beauty & Personal Care'],
    demandMultiplier: 2.8,
    traditions: ['Pandal hopping', 'New sarees & kurtas', 'Dhunuchi dance', 'Bhog prasad', 'Sindoor khela'],
  },
  {
    id: 'chhath-puja-2026',
    name: 'Chhath Puja',
    nameHi: 'छठ पूजा',
    date: '2026-11-09',
    month: 11,
    type: 'regional',
    description: 'Sun worship festival in Bihar and eastern UP. Specific pooja items and fruits needed.',
    regions: ['Bihar', 'Jharkhand', 'Uttar Pradesh', 'Delhi'],
    categories: ['Groceries', 'Home & Kitchen', 'Fashion'],
    demandMultiplier: 2.0,
    traditions: ['Sunrise/sunset worship', 'Thekua (sweet)', 'Sugarcane & fruits', 'Bamboo baskets (soup)', 'River/ghat rituals'],
  },
  {
    id: 'guru-nanak-jayanti-2026',
    name: 'Guru Nanak Jayanti',
    nameHi: 'गुरु नानक जयंती',
    date: '2026-11-15',
    month: 11,
    type: 'regional',
    description: 'Birth anniversary of Guru Nanak. Langar (community kitchen) and processions.',
    regions: ['Punjab', 'Haryana', 'Delhi', 'Chandigarh'],
    categories: ['Groceries', 'Books & Stationery'],
    demandMultiplier: 1.5,
    traditions: ['Langar seva', 'Nagar kirtan', 'Gurudwara decoration', 'Sweets distribution'],
  },
  {
    id: 'uttarayan-2026',
    name: 'Uttarayan (Kite Festival)',
    nameHi: 'उत्तरायण',
    date: '2026-01-14',
    month: 1,
    type: 'regional',
    description: 'Gujarat\'s iconic kite festival. International kite flying event in Ahmedabad.',
    regions: ['Gujarat', 'Rajasthan'],
    categories: ['Sports & Fitness', 'Groceries', 'Fashion'],
    demandMultiplier: 2.2,
    traditions: ['Kite flying', 'Undhiyu & jalebi', 'Chikki & sweets', 'Rooftop parties', 'Manja (kite string)'],
  },
  {
    id: 'poila-boishakh-2026',
    name: 'Poila Boishakh',
    nameHi: 'पोइला बोइशाख',
    date: '2026-04-15',
    month: 4,
    type: 'regional',
    description: 'Bengali New Year. New clothes, sweets, and account book (halkhata) opening.',
    regions: ['West Bengal', 'Tripura', 'Assam'],
    categories: ['Fashion', 'Groceries', 'Books & Stationery'],
    demandMultiplier: 1.8,
    traditions: ['Halkhata (new ledger)', 'Mishti (sweets)', 'New clothes', 'Mangal Shobhajatra', 'Panta ilish'],
  },
  {
    id: 'bonalu-2026',
    name: 'Bonalu',
    nameHi: 'बोनालु',
    date: '2026-07-19',
    month: 7,
    type: 'regional',
    description: 'Telangana folk festival dedicated to Goddess Mahakali.',
    regions: ['Telangana', 'Andhra Pradesh'],
    categories: ['Groceries', 'Fashion', 'Home & Kitchen'],
    demandMultiplier: 1.5,
    traditions: ['Bonalu pot offering', 'Turmeric & vermillion', 'Saree shopping', 'Processions'],
  },
  {
    id: 'bathukamma-2026',
    name: 'Bathukamma',
    nameHi: 'बतुकम्मा',
    date: '2026-10-08',
    month: 10,
    type: 'regional',
    description: 'Telangana floral festival. 9-day celebration with flower arrangements.',
    regions: ['Telangana'],
    categories: ['Fashion', 'Groceries', 'Home & Kitchen'],
    demandMultiplier: 1.6,
    traditions: ['Flower arrangements', 'Traditional songs', 'Saree festivals', 'Turmeric water play'],
  },
];

// --- Suppliers / Wholesalers ---

export const SUPPLIERS: Supplier[] = [
  {
    id: 'gupta-traders',
    name: 'Gupta Traders & Sons',
    city: 'Delhi',
    rating: 4.6,
    categories: ['Electronics', 'Home & Kitchen'],
    minOrderQty: 50,
    priceRange: 'Budget to Premium',
    deliveryDays: 3,
    paymentTerms: '50% advance, 50% on delivery',
    contact: '+91 98XXX-XXXXX',
  },
  {
    id: 'mumbai-wholesale-mart',
    name: 'Mumbai Wholesale Mart',
    city: 'Mumbai',
    rating: 4.4,
    categories: ['Fashion', 'Beauty & Personal Care'],
    minOrderQty: 100,
    priceRange: 'Budget to Mid-range',
    deliveryDays: 4,
    paymentTerms: '30% advance',
    contact: '+91 99XXX-XXXXX',
  },
  {
    id: 'rajesh-electronics',
    name: 'Rajesh Electronics Wholesale',
    city: 'Delhi',
    rating: 4.7,
    categories: ['Electronics'],
    minOrderQty: 25,
    priceRange: 'Mid-range to Premium',
    deliveryDays: 2,
    paymentTerms: 'Net 15 days',
    contact: '+91 97XXX-XXXXX',
  },
  {
    id: 'chennai-wholesale',
    name: 'Chennai Wholesale Center',
    city: 'Chennai',
    rating: 4.3,
    categories: ['Groceries', 'Home & Kitchen'],
    minOrderQty: 200,
    priceRange: 'Budget',
    deliveryDays: 5,
    paymentTerms: '100% advance for new buyers',
    contact: '+91 96XXX-XXXXX',
  },
  {
    id: 'sharma-textiles',
    name: 'Sharma Textiles Pvt Ltd',
    city: 'Jaipur',
    rating: 4.5,
    categories: ['Fashion'],
    minOrderQty: 50,
    priceRange: 'Mid-range to Premium',
    deliveryDays: 4,
    paymentTerms: '40% advance',
    contact: '+91 94XXX-XXXXX',
  },
  {
    id: 'kolkata-sweet-suppliers',
    name: 'Kolkata Mithai Suppliers',
    city: 'Kolkata',
    rating: 4.8,
    categories: ['Groceries'],
    minOrderQty: 100,
    priceRange: 'Mid-range',
    deliveryDays: 2,
    paymentTerms: 'Cash on delivery',
    contact: '+91 98XXX-XXXXX',
  },
  {
    id: 'patel-general-store',
    name: 'Patel General Store Wholesale',
    city: 'Ahmedabad',
    rating: 4.2,
    categories: ['Groceries', 'Home & Kitchen', 'Beauty & Personal Care'],
    minOrderQty: 150,
    priceRange: 'Budget to Mid-range',
    deliveryDays: 3,
    paymentTerms: '50% advance',
    contact: '+91 93XXX-XXXXX',
  },
  {
    id: 'bangalore-tech-dist',
    name: 'Bangalore Tech Distributors',
    city: 'Bangalore',
    rating: 4.6,
    categories: ['Electronics', 'Toys & Baby Products'],
    minOrderQty: 30,
    priceRange: 'Mid-range to Premium',
    deliveryDays: 2,
    paymentTerms: 'Net 30 days',
    contact: '+91 95XXX-XXXXX',
  },
  {
    id: 'lucknow-chikan-house',
    name: 'Lucknow Chikan House',
    city: 'Lucknow',
    rating: 4.7,
    categories: ['Fashion'],
    minOrderQty: 25,
    priceRange: 'Mid-range to Premium',
    deliveryDays: 5,
    paymentTerms: '50% advance',
    contact: '+91 92XXX-XXXXX',
  },
  {
    id: 'indore-namkeen-traders',
    name: 'Indore Namkeen Traders',
    city: 'Indore',
    rating: 4.4,
    categories: ['Groceries'],
    minOrderQty: 200,
    priceRange: 'Budget',
    deliveryDays: 3,
    paymentTerms: 'Cash on delivery',
    contact: '+91 91XXX-XXXXX',
  },
  {
    id: 'pune-home-decor',
    name: 'Pune Home Decor Wholesale',
    city: 'Pune',
    rating: 4.3,
    categories: ['Home & Kitchen'],
    minOrderQty: 50,
    priceRange: 'Mid-range',
    deliveryDays: 4,
    paymentTerms: '30% advance',
    contact: '+91 90XXX-XXXXX',
  },
  {
    id: 'surat-textile-market',
    name: 'Surat Textile Market Hub',
    city: 'Surat',
    rating: 4.5,
    categories: ['Fashion'],
    minOrderQty: 200,
    priceRange: 'Budget to Mid-range',
    deliveryDays: 3,
    paymentTerms: '40% advance',
    contact: '+91 89XXX-XXXXX',
  },
  {
    id: 'hyderabad-pearl-traders',
    name: 'Hyderabad Pearl & Beauty Traders',
    city: 'Hyderabad',
    rating: 4.6,
    categories: ['Beauty & Personal Care', 'Fashion'],
    minOrderQty: 50,
    priceRange: 'Mid-range to Premium',
    deliveryDays: 3,
    paymentTerms: '50% advance',
    contact: '+91 88XXX-XXXXX',
  },
  {
    id: 'agra-sports-wholesale',
    name: 'Agra Sports & Fitness Wholesale',
    city: 'Agra',
    rating: 4.1,
    categories: ['Sports & Fitness', 'Toys & Baby Products'],
    minOrderQty: 100,
    priceRange: 'Budget to Mid-range',
    deliveryDays: 4,
    paymentTerms: '100% advance',
    contact: '+91 87XXX-XXXXX',
  },
  {
    id: 'patna-stationery-house',
    name: 'Patna Stationery House',
    city: 'Patna',
    rating: 4.0,
    categories: ['Books & Stationery'],
    minOrderQty: 100,
    priceRange: 'Budget',
    deliveryDays: 5,
    paymentTerms: 'Cash on delivery',
    contact: '+91 86XXX-XXXXX',
  },
];

// --- Static holidays as fallback + enrichment source ---

const STATIC_HOLIDAYS: Omit<Holiday, 'source'>[] = [...NATIONAL_HOLIDAYS, ...REGIONAL_HOLIDAYS];

// --- Hindi name & tradition enrichment map (keyed by lowercase holiday name keywords) ---
// Used to enrich Calendarific API results with data they don't provide

const ENRICHMENT_MAP: Record<string, { nameHi: string; traditions: string[]; demandMultiplier?: number; categories?: string[]; displayName?: string }> = {
  'makar sankranti': { nameHi: 'मकर संक्रांति', traditions: ['Kite flying', 'Til-gur sweets', 'Sesame & jaggery products', 'New clothes'], demandMultiplier: 1.8 },
  'republic day': { nameHi: 'गणतंत्र दिवस', traditions: ['Flag hoisting', 'Patriotic events', 'School functions'] },
  'holi': { nameHi: 'होली', traditions: ['Color play', 'Gujiya & thandai', 'Water guns (pichkari)', 'White clothes', 'Bhang preparation'], demandMultiplier: 2.2 },
  'ramzan id': { displayName: 'Eid ul-Fitr', nameHi: 'ईद उल-फ़ित्र', traditions: ['New clothes', 'Attar/perfume', 'Sewaiyan', 'Dry fruits', 'Gift boxes'], demandMultiplier: 2.3 },
  'eid ul-fitr': { nameHi: 'ईद उल-फ़ित्र', traditions: ['New clothes', 'Attar/perfume', 'Sewaiyan', 'Dry fruits', 'Gift boxes'], demandMultiplier: 2.3 },
  'eid': { nameHi: 'ईद', traditions: ['New clothes', 'Attar/perfume', 'Sewaiyan', 'Dry fruits', 'Gift boxes'], demandMultiplier: 2.3 },
  'eid al-fitr': { nameHi: 'ईद उल-फ़ित्र', traditions: ['New clothes', 'Attar/perfume', 'Sewaiyan', 'Dry fruits', 'Gift boxes'], demandMultiplier: 2.3 },
  'eid al-adha': { nameHi: 'ईद उल-अज़हा', traditions: ['Qurbani', 'New clothes', 'Biryani feast', 'Gift giving'], demandMultiplier: 2.0 },
  'raksha bandhan': { nameHi: 'रक्षा बंधन', traditions: ['Rakhi threads', 'Mithai boxes', 'Gift sets', 'Chocolates', 'Sibling gifts'], demandMultiplier: 2.5 },
  'independence day': { nameHi: 'स्वतंत्रता दिवस', traditions: ['Flag hoisting', 'Tricolor merchandise', 'School events', 'Kite flying'] },
  'ganesh chaturthi': { nameHi: 'गणेश चतुर्थी', traditions: ['Ganesh idols', 'Modak & laddu', 'Pooja items', 'Flowers & decoration', 'Eco-friendly idols'], demandMultiplier: 2.0 },
  'navratri': { nameHi: 'नवरात्रि', traditions: ['Garba/Dandiya nights', 'Chaniya choli', 'Dandiya sticks', 'Pooja items', '9 colors for 9 days'], demandMultiplier: 2.3 },
  'dussehra': { nameHi: 'दशहरा', traditions: ['Ravan dahan', 'New purchases', 'Gold buying', 'Weapon worship'], demandMultiplier: 2.0 },
  'vijayadashami': { nameHi: 'विजयादशमी', traditions: ['Ravan dahan', 'New purchases', 'Gold buying'], demandMultiplier: 2.0 },
  'karva chauth': { nameHi: 'करवा चौथ', traditions: ['Mehndi/henna', 'Bangles & jewelry', 'Sargi thali', 'Saree/suit shopping'], demandMultiplier: 1.8 },
  'diwali': { nameHi: 'दिवाली', traditions: ['Diyas & candles', 'Rangoli', 'Lakshmi-Ganesh pooja', 'Sweets & dry fruits', 'Firecrackers', 'New electronics', 'Gold buying'], demandMultiplier: 3.0 },
  'deepavali': { nameHi: 'दीपावली', traditions: ['Diyas & candles', 'Rangoli', 'Lakshmi-Ganesh pooja', 'Sweets & dry fruits', 'Firecrackers'], demandMultiplier: 3.0 },
  'bhai dooj': { nameHi: 'भाई दूज', traditions: ['Tilak ceremony', 'Gifts for brothers', 'Sweets', 'Family gatherings'] },
  'christmas': { nameHi: 'क्रिसमस', traditions: ['Gift exchanges', 'Christmas trees & decor', 'Cakes & plum pudding', 'Year-end sales'], demandMultiplier: 1.8 },
  'pongal': { nameHi: 'पोंगल', traditions: ['Pongal pot', 'New rice & sugarcane', 'Kolam/Rangoli', 'New clothes'], demandMultiplier: 2.5 },
  'lohri': { nameHi: 'लोहड़ी', traditions: ['Bonfire', 'Rewri & gajak', 'Peanuts & popcorn', 'Bhangra'], demandMultiplier: 1.8 },
  'baisakhi': { nameHi: 'बैसाखी', traditions: ['Bhangra & Gidda', 'New turbans', 'Festive food', 'Gurudwara visits'], demandMultiplier: 2.0 },
  'vaisakhi': { nameHi: 'बैसाखी', traditions: ['Bhangra & Gidda', 'New turbans', 'Festive food', 'Gurudwara visits'], demandMultiplier: 2.0 },
  'ugadi': { nameHi: 'उगादी', traditions: ['Ugadi pachadi', 'Neem & jaggery', 'New clothes', 'Home decoration'], demandMultiplier: 1.8 },
  'gudi padwa': { nameHi: 'गुड़ी पाड़वा', traditions: ['Gudi flag', 'Neem & jaggery', 'New clothes'], demandMultiplier: 1.8 },
  'vishu': { nameHi: 'विशु', traditions: ['Vishukkani', 'Vishukaineetam', 'New clothes', 'Sadhya feast'], demandMultiplier: 1.7 },
  'bihu': { nameHi: 'बिहू', traditions: ['Bihu dance', 'Gamosa', 'Pitha (rice cakes)', 'Traditional weaving'], demandMultiplier: 2.0 },
  'rath yatra': { nameHi: 'रथ यात्रा', traditions: ['Chariot pulling', 'Prasad & mahaprasad', 'Religious merchandise'], demandMultiplier: 1.6 },
  'teej': { nameHi: 'तीज', traditions: ['Mehndi application', 'Green bangles & sarees', 'Ghewar sweet', 'Swing festivals'], demandMultiplier: 1.9 },
  'onam': { nameHi: 'ओणम', traditions: ['Onam Sadhya', 'Pookalam', 'Boat races', 'Kasavu saree'], demandMultiplier: 2.5 },
  'durga puja': { nameHi: 'दुर्गा पूजा', traditions: ['Pandal hopping', 'New sarees & kurtas', 'Dhunuchi dance', 'Bhog prasad'], demandMultiplier: 2.8 },
  'chhath puja': { nameHi: 'छठ पूजा', traditions: ['Sunrise/sunset worship', 'Thekua', 'Sugarcane & fruits', 'Bamboo baskets'], demandMultiplier: 2.0 },
  'chhath': { nameHi: 'छठ पूजा', traditions: ['Sunrise/sunset worship', 'Thekua', 'Sugarcane & fruits'], demandMultiplier: 2.0 },
  'guru nanak': { nameHi: 'गुरु नानक जयंती', traditions: ['Langar seva', 'Nagar kirtan', 'Gurudwara decoration'], demandMultiplier: 1.5 },
  'maha shivaratri': { nameHi: 'महा शिवरात्रि', traditions: ['Shiva temple visits', 'Fasting', 'Bel patra offering', 'Night vigil'], demandMultiplier: 1.5 },
  'ram navami': { nameHi: 'राम नवमी', traditions: ['Ram temple visits', 'Bhajan/kirtan', 'Fasting', 'Processions'], demandMultiplier: 1.4 },
  'janmashtami': { nameHi: 'जन्माष्टमी', traditions: ['Dahi handi', 'Midnight celebration', 'Fasting', 'Krishna decoration'], demandMultiplier: 1.8 },
  'krishna janmashtami': { nameHi: 'जन्माष्टमी', traditions: ['Dahi handi', 'Midnight celebration', 'Fasting'], demandMultiplier: 1.8 },
  'buddha purnima': { nameHi: 'बुद्ध पूर्णिमा', traditions: ['Temple visits', 'Meditation', 'Charity'], demandMultiplier: 1.2 },
  'mahavir jayanti': { nameHi: 'महावीर जयंती', traditions: ['Jain temple visits', 'Processions', 'Charity'], demandMultiplier: 1.2 },
  'gandhi jayanti': { nameHi: 'गांधी जयंती', traditions: ['Prayer meetings', 'Cleanliness drives', 'Patriotic events'] },
  'muharram': { nameHi: 'मुहर्रम', traditions: ['Tazia processions', 'Mourning gatherings', 'Sherbet distribution'], demandMultiplier: 1.3 },
  'milad un-nabi': { nameHi: 'मीलाद-उन-नबी', traditions: ['Processions', 'Mosque gatherings', 'Charity'], demandMultiplier: 1.3 },
};

/**
 * Find enrichment data for a Calendarific holiday by matching name keywords
 */
function findEnrichment(name: string): { nameHi: string; traditions: string[]; demandMultiplier?: number; categories?: string[]; displayName?: string } | null {
  const nameLower = name.toLowerCase();
  // Try exact match first, then partial match
  for (const [key, value] of Object.entries(ENRICHMENT_MAP)) {
    if (nameLower.includes(key)) return value;
  }
  return null;
}

/**
 * Convert a Calendarific holiday to our Holiday interface
 */
function calendarificToHoliday(cal: CalendarificHoliday): Holiday {
  const enrichment = findEnrichment(cal.name);
  const type = mapCalendarificType(cal.type);
  const regions = extractRegions(cal.states);

  const displayName = enrichment?.displayName || cal.name;

  return {
    id: generateHolidaySlug(displayName, cal.date.iso),
    name: displayName,
    nameHi: enrichment?.nameHi || displayName, // fallback to English if no Hindi name
    date: cal.date.iso,
    month: cal.date.datetime.month,
    type,
    description: cal.description || `${cal.name} — ${cal.type.join(', ')}`,
    regions,
    categories: enrichment?.categories || inferCategories(cal.type, cal.name),
    demandMultiplier: enrichment?.demandMultiplier || estimateDemandMultiplier(cal.type, cal.name),
    traditions: enrichment?.traditions || [],
    source: enrichment ? 'enriched' : 'calendarific',
  };
}

// --- Cache key for Calendarific data ---
const CALENDARIFIC_CACHE_KEY = (year: number) => `CALENDARIFIC_HOLIDAYS:${year}`;
const CALENDARIFIC_CACHE_TTL = 86400 * 7; // 7 days — holidays don't change frequently

/**
 * Fetch holidays from Calendarific API with DynamoDB caching.
 * Falls back to static data if API is unavailable or API key is not set.
 */
export async function getHolidaysFromAPI(year?: number): Promise<Holiday[]> {
  const targetYear = year || new Date().getFullYear();

  // Check if API key is configured
  if (!process.env.CALENDARIFIC_API_KEY) {
    console.log('No CALENDARIFIC_API_KEY — using static holiday data');
    return STATIC_HOLIDAYS.map(h => ({ ...h, source: 'static' as const }));
  }

  // Try cache first
  const cacheKey = CALENDARIFIC_CACHE_KEY(targetYear);
  const cached = await getCache<Holiday[]>(cacheKey);
  if (cached) {
    console.log(`Using cached Calendarific data for ${targetYear}`);
    return cached;
  }

  // Fetch from Calendarific
  const apiHolidays = await fetchCalendarificHolidays({ year: targetYear });

  if (apiHolidays.length === 0) {
    console.log('Calendarific returned empty — falling back to static data');
    return STATIC_HOLIDAYS.map(h => ({ ...h, source: 'static' as const }));
  }

  // Convert API holidays to our format
  const converted = apiHolidays.map(calendarificToHoliday);

  // Deduplicate by date + similar name (Calendarific sometimes has duplicates)
  const seen = new Set<string>();
  const deduped = converted.filter(h => {
    const key = `${h.date}:${h.name.toLowerCase().replace(/[^a-z]/g, '').slice(0, 15)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Cache the result
  await setCache(cacheKey, deduped, CALENDARIFIC_CACHE_TTL);
  console.log(`Cached ${deduped.length} Calendarific holidays for ${targetYear}`);

  return deduped;
}

// --- Synchronous fallback (for backward compatibility) ---

export const ALL_HOLIDAYS: Holiday[] = STATIC_HOLIDAYS.map(h => ({ ...h, source: 'static' as const }));

// --- Helper Functions ---

export function getHolidayById(id: string): Holiday | undefined {
  return ALL_HOLIDAYS.find(h => h.id === id);
}

/**
 * Async version - looks up by ID from API data first, then static fallback
 */
export async function getHolidayByIdAsync(id: string, holidays?: Holiday[]): Promise<Holiday | undefined> {
  const source = holidays || await getHolidaysFromAPI();
  return source.find(h => h.id === id);
}

export function getUpcomingHolidays(options: {
  type?: 'national' | 'regional' | 'all';
  state?: string;
  months?: number;
  month?: number;
} = {}): (Holiday & { daysAway: number })[] {
  return filterAndSortHolidays(ALL_HOLIDAYS, options);
}

/**
 * Async version - fetches from Calendarific API with cache, then filters
 */
export async function getUpcomingHolidaysAsync(options: {
  type?: 'national' | 'regional' | 'all';
  state?: string;
  months?: number;
  month?: number;
} = {}): Promise<(Holiday & { daysAway: number })[]> {
  const holidays = await getHolidaysFromAPI();
  return filterAndSortHolidays(holidays, options);
}

function filterAndSortHolidays(
  allHolidays: Holiday[],
  options: { type?: 'national' | 'regional' | 'all'; state?: string; months?: number; month?: number }
): (Holiday & { daysAway: number })[] {
  const { type = 'all', state, months = 12, month } = options;
  const now = new Date();

  let holidays = allHolidays;

  // Filter by type
  if (type !== 'all') {
    holidays = holidays.filter(h => h.type === type);
  }

  // Filter by state/region
  if (state) {
    holidays = holidays.filter(h =>
      h.regions.includes('all') || h.regions.some(r => r.toLowerCase() === state.toLowerCase())
    );
  }

  // Filter by specific month
  if (month) {
    holidays = holidays.filter(h => h.month === month);
  }

  // Calculate days away and filter by window
  return holidays
    .map(h => {
      const holidayDate = new Date(h.date);
      const daysAway = Math.ceil((holidayDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return { ...h, daysAway };
    })
    .filter(h => h.daysAway <= months * 30 && h.daysAway >= -7)
    .sort((a, b) => a.daysAway - b.daysAway);
}

export function getSuppliersForCategories(categories: string[]): Supplier[] {
  return SUPPLIERS.filter(s =>
    s.categories.some(c => categories.includes(c))
  ).sort((a, b) => b.rating - a.rating);
}

// Map of Indian states for regional filter dropdown
export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chandigarh',
  'Chhattisgarh', 'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh',
  'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra',
  'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Northeast India', 'Odisha',
  'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
] as const;
