/**
 * Smart Demo Fallback — provides intelligent fallback responses
 * when AWS Bedrock is unavailable (quota = 0, throttled, etc.)
 *
 * All functions return data in the EXACT same JSON format the frontend expects,
 * with `demoMode: true` appended so the frontend can show a badge.
 */

// ── City Data ──

interface CityInfo {
  tier: 'metro' | 'tier1' | 'tier2';
  marginMultiplier: number;
  topCompetitors: string[];
  festivals: { month: number; name: string; demandBoost: number }[];
  language: string;
  purchasingPowerIndex: number;
}

const cityData: Record<string, CityInfo> = {
  Mumbai: {
    tier: 'metro', marginMultiplier: 1.35, purchasingPowerIndex: 82,
    topCompetitors: ['DMart', 'BigBasket', 'JioMart', 'Amazon', 'Flipkart'],
    festivals: [
      { month: 1, name: 'Makar Sankranti', demandBoost: 0.08 },
      { month: 3, name: 'Holi', demandBoost: 0.12 },
      { month: 8, name: 'Ganesh Chaturthi', demandBoost: 0.20 },
      { month: 10, name: 'Navratri', demandBoost: 0.15 },
      { month: 11, name: 'Diwali', demandBoost: 0.25 },
    ],
    language: 'Marathi',
  },
  Delhi: {
    tier: 'metro', marginMultiplier: 1.32, purchasingPowerIndex: 80,
    topCompetitors: ['Amazon', 'Flipkart', 'BigBasket', 'Blinkit', 'Grofers'],
    festivals: [
      { month: 3, name: 'Holi', demandBoost: 0.15 },
      { month: 10, name: 'Dussehra', demandBoost: 0.12 },
      { month: 11, name: 'Diwali', demandBoost: 0.25 },
      { month: 12, name: 'Christmas', demandBoost: 0.05 },
    ],
    language: 'Hindi',
  },
  Lucknow: {
    tier: 'tier1', marginMultiplier: 1.28, purchasingPowerIndex: 58,
    topCompetitors: ['Amazon', 'Flipkart', 'Local Wholesale', 'BigBasket'],
    festivals: [
      { month: 3, name: 'Holi', demandBoost: 0.15 },
      { month: 4, name: 'Ramadan/Eid', demandBoost: 0.18 },
      { month: 11, name: 'Diwali', demandBoost: 0.22 },
    ],
    language: 'Hindi',
  },
  Bangalore: {
    tier: 'metro', marginMultiplier: 1.30, purchasingPowerIndex: 78,
    topCompetitors: ['BigBasket', 'Swiggy Instamart', 'Blinkit', 'Amazon', 'Flipkart'],
    festivals: [
      { month: 1, name: 'Sankranti', demandBoost: 0.10 },
      { month: 10, name: 'Dasara', demandBoost: 0.15 },
      { month: 11, name: 'Diwali', demandBoost: 0.20 },
    ],
    language: 'Kannada',
  },
  Chennai: {
    tier: 'metro', marginMultiplier: 1.30, purchasingPowerIndex: 74,
    topCompetitors: ['BigBasket', 'Amazon', 'Flipkart', 'DMart', 'Reliance Fresh'],
    festivals: [
      { month: 1, name: 'Pongal', demandBoost: 0.18 },
      { month: 11, name: 'Diwali', demandBoost: 0.15 },
    ],
    language: 'Tamil',
  },
  Hyderabad: {
    tier: 'metro', marginMultiplier: 1.30, purchasingPowerIndex: 72,
    topCompetitors: ['Amazon', 'BigBasket', 'Flipkart', 'DMart', 'More'],
    festivals: [
      { month: 4, name: 'Ramadan/Eid', demandBoost: 0.20 },
      { month: 10, name: 'Bathukamma', demandBoost: 0.10 },
      { month: 11, name: 'Diwali', demandBoost: 0.20 },
    ],
    language: 'Telugu',
  },
  Kolkata: {
    tier: 'metro', marginMultiplier: 1.28, purchasingPowerIndex: 65,
    topCompetitors: ['Amazon', 'BigBasket', 'Flipkart', "Spencer's", 'More'],
    festivals: [
      { month: 10, name: 'Durga Puja', demandBoost: 0.25 },
      { month: 11, name: 'Diwali/Kali Puja', demandBoost: 0.18 },
    ],
    language: 'Bengali',
  },
  Pune: {
    tier: 'tier1', marginMultiplier: 1.30, purchasingPowerIndex: 72,
    topCompetitors: ['DMart', 'BigBasket', 'Amazon', 'Flipkart', 'JioMart'],
    festivals: [
      { month: 8, name: 'Ganesh Chaturthi', demandBoost: 0.22 },
      { month: 11, name: 'Diwali', demandBoost: 0.20 },
    ],
    language: 'Marathi',
  },
  Ahmedabad: {
    tier: 'tier1', marginMultiplier: 1.28, purchasingPowerIndex: 68,
    topCompetitors: ['DMart', 'Reliance Fresh', 'Amazon', 'Flipkart', 'BigBasket'],
    festivals: [
      { month: 1, name: 'Uttarayan', demandBoost: 0.15 },
      { month: 10, name: 'Navratri', demandBoost: 0.25 },
      { month: 11, name: 'Diwali', demandBoost: 0.22 },
    ],
    language: 'Gujarati',
  },
  Jaipur: {
    tier: 'tier1', marginMultiplier: 1.26, purchasingPowerIndex: 60,
    topCompetitors: ['Amazon', 'Flipkart', 'Local Wholesale', 'BigBasket'],
    festivals: [
      { month: 3, name: 'Holi', demandBoost: 0.18 },
      { month: 11, name: 'Diwali', demandBoost: 0.22 },
    ],
    language: 'Hindi',
  },
};

// ── Category Data ──

interface CategoryInfo {
  avgMargin: number;
  sentimentThemes: string[];
  contentKeywords: string[];
  shelfLife: string;
}

const categoryData: Record<string, CategoryInfo> = {
  Groceries: {
    avgMargin: 0.20,
    sentimentThemes: ['freshness', 'quality', 'taste', 'packaging', 'value for money'],
    contentKeywords: ['ताज़ा', 'शुद्ध', 'premium quality', 'family pack', 'daily essential'],
    shelfLife: '6-12 months',
  },
  FMCG: {
    avgMargin: 0.15,
    sentimentThemes: ['effectiveness', 'brand trust', 'value for money', 'fragrance', 'packaging'],
    contentKeywords: ['trusted brand', 'effective', 'value pack', 'long lasting', 'family favorite'],
    shelfLife: '12-24 months',
  },
  'Personal Care': {
    avgMargin: 0.25,
    sentimentThemes: ['skin feel', 'fragrance', 'results', 'price', 'natural ingredients'],
    contentKeywords: ['natural', 'gentle', 'dermatologist tested', 'daily care', 'glowing results'],
    shelfLife: '12-18 months',
  },
  'Beauty & Personal Care': {
    avgMargin: 0.25,
    sentimentThemes: ['skin feel', 'fragrance', 'results', 'price', 'natural ingredients'],
    contentKeywords: ['natural', 'gentle', 'dermatologist tested', 'daily care', 'glowing results'],
    shelfLife: '12-18 months',
  },
  Beverages: {
    avgMargin: 0.22,
    sentimentThemes: ['taste', 'refreshment', 'price', 'availability', 'packaging'],
    contentKeywords: ['refreshing', 'thirst quenching', 'chilled', 'party essential', 'family size'],
    shelfLife: '3-6 months',
  },
  Snacks: {
    avgMargin: 0.25,
    sentimentThemes: ['taste', 'crunchiness', 'spice level', 'quantity', 'freshness'],
    contentKeywords: ['crispy', 'masaledar', 'teatime snack', 'party pack', 'munchies'],
    shelfLife: '3-6 months',
  },
  Electronics: {
    avgMargin: 0.30,
    sentimentThemes: ['battery life', 'sound quality', 'build quality', 'value for money', 'durability'],
    contentKeywords: ['latest technology', 'premium build', 'long battery', 'wireless', 'smart'],
    shelfLife: '24+ months',
  },
  Fashion: {
    avgMargin: 0.45,
    sentimentThemes: ['fabric quality', 'fitting', 'color', 'stitching', 'comfort'],
    contentKeywords: ['handcrafted', 'premium fabric', 'comfortable', 'stylish', 'traditional'],
    shelfLife: 'N/A',
  },
  'Home & Kitchen': {
    avgMargin: 0.28,
    sentimentThemes: ['durability', 'design', 'material quality', 'ease of use', 'value'],
    contentKeywords: ['durable', 'modern design', 'easy to clean', 'premium material', 'space saving'],
    shelfLife: '12-36 months',
  },
};

// ── Helpers ──

function getCity(city?: string): CityInfo {
  return cityData[city || 'Lucknow'] || cityData['Lucknow'];
}

function getCategory(cat?: string): CategoryInfo {
  return categoryData[cat || 'Groceries'] || categoryData['Groceries'];
}

function getCurrentFestival(city: CityInfo): { name: string; demandBoost: number } | null {
  const now = new Date();
  const month = now.getMonth() + 1;
  return city.festivals.find(f => f.month === month) || null;
}

function detectCategory(name: string): string {
  const lower = name.toLowerCase();
  if (/rice|dal|atta|oil|sugar|salt|masala|spice|flour|ghee|paneer|milk|curd/.test(lower)) return 'Groceries';
  if (/surf|vim|detergent|soap|shampoo|toothpaste|cleanser/.test(lower)) return 'FMCG';
  if (/cream|lotion|moistur|serum|face|body|hair/.test(lower)) return 'Personal Care';
  if (/phone|earbuds|charger|speaker|cable|electronic|bluetooth|wireless/.test(lower)) return 'Electronics';
  if (/kurta|shirt|jeans|saree|dress|shoe|sandal/.test(lower)) return 'Fashion';
  if (/tea|coffee|juice|water|soda|drink|cola/.test(lower)) return 'Beverages';
  if (/chips|biscuit|namkeen|snack|cookies/.test(lower)) return 'Snacks';
  return 'Groceries';
}

// ── PRICING FALLBACK ──

export function getDemoPricingResponse(
  productName: string, category: string, costPrice: number, city: string
) {
  const c = getCity(city);
  const cat = getCategory(category);
  const festival = getCurrentFestival(c);

  let sellingPrice = costPrice * c.marginMultiplier;
  if (festival) {
    sellingPrice *= (1 + festival.demandBoost);
  }
  sellingPrice = Math.round(sellingPrice);

  const competitorPrices = c.topCompetitors.map(name => ({
    seller: name,
    price: Math.round(sellingPrice * (0.95 + Math.random() * 0.15)),
    rating: parseFloat((3.5 + Math.random() * 1.5).toFixed(1)),
  }));

  const avgCompPrice = Math.round(
    competitorPrices.reduce((s, cp) => s + cp.price, 0) / competitorPrices.length
  );
  const margin = Math.round(((sellingPrice - costPrice) / sellingPrice) * 100);

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    },
    body: JSON.stringify({
      success: true,
      data: {
        recommendations: [
          {
            strategy: 'competitive',
            suggestedPrice: Math.round(sellingPrice * 0.95),
            confidenceScore: 82 + Math.floor(Math.random() * 12),
            expectedImpact: {
              demandChange: '+15-20%',
              revenueChange: '+8-12%',
              monthlyProfitImpact: `+₹${Math.round((sellingPrice * 0.95 - costPrice) * 150)}`,
            },
            reasoning: `Match the lowest competitor pricing in ${city}. ${c.topCompetitors[0]} is at ₹${competitorPrices[0].price}. This strategy maximizes volume.`,
          },
          {
            strategy: 'premium',
            suggestedPrice: Math.round(sellingPrice * 1.08),
            confidenceScore: 82 + Math.floor(Math.random() * 10),
            expectedImpact: {
              demandChange: '-5-8%',
              revenueChange: '+10-15%',
              monthlyProfitImpact: `+₹${Math.round((sellingPrice * 1.08 - costPrice) * 100)}`,
            },
            reasoning: `Premium positioning in ${city} ${c.tier} market. Higher margin targets loyal, quality-conscious customers. Works well with brand trust.`,
          },
          {
            strategy: 'value',
            suggestedPrice: sellingPrice,
            confidenceScore: 85 + Math.floor(Math.random() * 8),
            expectedImpact: {
              demandChange: '+5-10%',
              revenueChange: '+5-8%',
              monthlyProfitImpact: `+₹${Math.round((sellingPrice - costPrice) * 120)}`,
            },
            reasoning: `Balanced approach for ${city}. Cost ₹${costPrice}, selling at ₹${sellingPrice} gives ${margin}% margin. ${festival ? festival.name + ' is approaching — demand expected to increase by ' + Math.round(festival.demandBoost * 100) + '%.' : 'Steady demand period. Focus on competitive pricing.'}`,
          },
        ],
        marketContext: {
          averageCompetitorPrice: avgCompPrice,
          priceRange: {
            min: Math.min(...competitorPrices.map(cp => cp.price)),
            max: Math.max(...competitorPrices.map(cp => cp.price)),
          },
          regionalPurchasingPower: c.purchasingPowerIndex,
        },
        festivalInsight: festival
          ? `${festival.name} is approaching in ${city}! Expect ${Math.round(festival.demandBoost * 100)}% demand surge for ${category}. Stock up and consider ${Math.round(festival.demandBoost * 100 / 2)}% markup. ${c.topCompetitors[0]} typically raises prices during festivals.`
          : `No major festival this month in ${city}. Focus on competitive pricing and building customer loyalty. Next festival season will bring demand spikes.`,
        keyTakeaway: `For ${productName} in ${city}: recommended price ₹${sellingPrice} (${margin}% margin). ${festival ? 'Festival demand will push volumes up.' : 'Steady market — compete on value and availability.'} Your ${c.tier} market positioning allows for ${c.tier === 'metro' ? 'premium pricing' : 'value-based strategies'}.`,
        productName,
        city,
        region: c.tier,
        generatedAt: new Date().toISOString(),
        demoMode: true,
      },
    }),
  };
}

// ── CONTENT FALLBACK ──

const langTemplates: Record<string, { name: string; template: (p: string, city: string, kw: string[]) => { title: string; description: string; bulletPoints: string[]; culturalNotes: string } }> = {
  en: {
    name: 'English',
    template: (p, city, kw) => ({
      title: `Premium ${p} — Best Price in ${city}`,
      description: `Premium ${p} available in ${city} at unbeatable prices. ${kw[0]} quality with ${kw[1]} guarantee. Perfect for your family. Special: Buy 2 & Save 5%!`,
      bulletPoints: [
        `${kw[0]} — Trusted quality for Indian families`,
        `Available across ${city} — Fast delivery`,
        `${kw[2]} — Value that matters`,
        `Special festival offers available`,
      ],
      culturalNotes: `Optimized for ${city} market preferences and local buying patterns.`,
    }),
  },
  hi: {
    name: 'Hindi',
    template: (p, city, kw) => ({
      title: `${p} — ${city} में सबसे बेहतरीन कीमत पर!`,
      description: `${p} — ${city} में सबसे बेहतरीन कीमत पर! ${kw[0]} और ${kw[1]} गुणवत्ता। अपने परिवार के लिए आज ही ऑर्डर करें। ✨ विशेष ऑफर: 2 खरीदें, 5% बचाएं!`,
      bulletPoints: [
        `${kw[0]} — भारतीय परिवारों के लिए भरोसेमंद गुणवत्ता`,
        `${city} में उपलब्ध — तेज़ डिलीवरी`,
        `${kw[2]} — सही कीमत, सही गुणवत्ता`,
        `त्योहार विशेष ऑफर उपलब्ध`,
      ],
      culturalNotes: `${city} की स्थानीय पसंद और खरीदारी के तरीकों के अनुसार अनुकूलित।`,
    }),
  },
  ta: {
    name: 'Tamil',
    template: (p, city, kw) => ({
      title: `${p} — ${city}-ல் சிறந்த விலையில்!`,
      description: `${p} — ${city}-ல் சிறந்த விலையில்! ${kw[0]} மற்றும் ${kw[1]} தரம். இன்றே ஆர்டர் செய்யுங்கள்!`,
      bulletPoints: [
        `${kw[0]} — நம்பகமான தரம்`,
        `${city} முழுவதும் கிடைக்கும்`,
        `${kw[2]} — சிறந்த மதிப்பு`,
      ],
      culturalNotes: `${city} சந்தை விருப்பங்களுக்கு ஏற்ப தகவமைக்கப்பட்டது.`,
    }),
  },
  bn: {
    name: 'Bengali',
    template: (p, city, kw) => ({
      title: `${p} — ${city}-তে সেরা দামে!`,
      description: `${p} — ${city}-তে সেরা দামে! ${kw[0]} এবং ${kw[1]} মানের। আজই অর্ডার করুন!`,
      bulletPoints: [
        `${kw[0]} — বিশ্বস্ত মান`,
        `${city} জুড়ে পাওয়া যায়`,
        `${kw[2]} — দুর্দান্ত মূল্য`,
      ],
      culturalNotes: `${city} বাজারের পছন্দ অনুযায়ী অপ্টিমাইজ করা হয়েছে।`,
    }),
  },
  gu: {
    name: 'Gujarati',
    template: (p, city, kw) => ({
      title: `${p} — ${city}માં શ્રેષ્ઠ ભાવે!`,
      description: `${p} — ${city}માં શ્રેષ્ઠ ભાવે! ${kw[0]} અને ${kw[1]} ગુણવત્તા. આજે જ ઓર્ડર કરો!`,
      bulletPoints: [
        `${kw[0]} — વિશ્વસનીય ગુણવત્તા`,
        `${city}માં ઉપલબ્ધ`,
        `${kw[2]} — શ્રેષ્ઠ મૂલ્ય`,
      ],
      culturalNotes: `${city} બજારની પસંદગી પ્રમાણે ઑપ્ટિમાઇઝ.`,
    }),
  },
  mr: {
    name: 'Marathi',
    template: (p, city, kw) => ({
      title: `${p} — ${city} मध्ये सर्वोत्तम किमतीत!`,
      description: `${p} — ${city} मध्ये सर्वोत्तम किमतीत! ${kw[0]} आणि ${kw[1]} गुणवत्ता. आजच ऑर्डर करा!`,
      bulletPoints: [
        `${kw[0]} — विश्वासार्ह गुणवत्ता`,
        `${city} मध्ये उपलब्ध`,
        `${kw[2]} — उत्तम मूल्य`,
      ],
      culturalNotes: `${city} बाजारपेठेच्या पसंतीनुसार अनुकूलित.`,
    }),
  },
};

export function getDemoContentResponse(
  productName: string, targetLanguages: string[], city: string, category: string
) {
  const cat = getCategory(category);
  const kw = cat.contentKeywords;
  const effectiveCity = city || 'Lucknow';

  const descriptions = targetLanguages.map(lang => {
    const t = langTemplates[lang] || langTemplates['en'];
    const content = t.template(productName, effectiveCity, kw);
    return {
      language: lang,
      languageName: t.name,
      ...content,
      localSearchTerms: [
        productName.toLowerCase(),
        `${productName} ${effectiveCity}`.toLowerCase(),
        `buy ${productName}`.toLowerCase(),
        `best ${productName} price`.toLowerCase(),
        ...kw.slice(0, 3),
      ],
    };
  });

  const seoKeywords = targetLanguages.map(lang => ({
    language: lang,
    keywords: [
      productName.toLowerCase(),
      `${productName} online`.toLowerCase(),
      `${productName} ${effectiveCity}`.toLowerCase(),
      `best ${category.toLowerCase()} ${effectiveCity}`,
      ...kw.slice(0, 2),
    ],
  }));

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    },
    body: JSON.stringify({
      success: true,
      data: {
        descriptions,
        seoKeywords,
        productName,
        generatedAt: new Date().toISOString(),
        demoMode: true,
      },
    }),
  };
}

// ── CHAT FALLBACK ──

export function getDemoChatResponse(message: string, city?: string) {
  const c = getCity(city);
  const cityName = city || 'Lucknow';
  const festival = getCurrentFestival(c);

  const lower = message.toLowerCase();
  const isHindi = /kya|hai|kaise|bhai|daam|kitna|mausam|tyohaar|karun|karu|bechun|kahan|accha|rakh|bata/.test(lower);

  let reply: string;

  if (/price|daam|kimat|cost|rate|kya rakh/.test(lower)) {
    reply = isHindi
      ? `${cityName} mein is product ka best selling price market ke hisaab se set karein. ${c.topCompetitors[0]} ₹415-₹449 ke range mein bech raha hai. Aap ₹435 rakhein — accha margin bhi milega aur customer bhi aayenge! 💰\n\nAction: Pricing page pe jaake detailed analysis karein.`
      : `In ${cityName}, price your products competitively. ${c.topCompetitors[0]} is selling similar products at ₹415-449 range. A price of ₹435 gives good margin while staying competitive. 💰\n\nAction: Check our Pricing Engine for detailed analysis.`;
  } else if (/stock|inventory|maal|saman/.test(lower)) {
    reply = isHindi
      ? `Apna inventory check karein! ${cityName} mein ${c.topCompetitors.slice(0, 2).join(' aur ')} se competition hai. Fast-moving items ka stock hamesha 2 week ka rakhein. 📦\n\nAction: Inventory page pe jaake stock levels check karein.`
      : `Keep your inventory optimized! In ${cityName}, you're competing with ${c.topCompetitors.slice(0, 2).join(' and ')}. Always maintain 2-week stock of fast-moving items. 📦\n\nAction: Check Inventory page for stock levels.`;
  } else if (/festival|tyohaar|diwali|holi|eid|navratri|puja|pongal/.test(lower)) {
    const festivalInfo = festival
      ? `${festival.name} aa rahi hai! 🪔 Demand ${Math.round(festival.demandBoost * 100)}% tak badh sakti hai. Abhi se stock karo:\n- Dry fruits, mithai, gift packs\n- Decorations (diyas, candles, lights)\n- Personal care products\n\nPichle saal ${cityName} mein ${festival.name} pe ${Math.round(festival.demandBoost * 100)}% extra bikri hui thi. Wholesaler se abhi order do — baad mein rate badhenge.`
      : `Abhi koi major festival nahi hai ${cityName} mein. Regular stock maintain karein. Next festival ki tayyari ab se shuru karein! 📋`;
    reply = isHindi ? festivalInfo : festivalInfo; // Festival advice works in Hinglish universally
  } else if (/weather|mausam|barish|rain|garmi|heat/.test(lower)) {
    reply = isHindi
      ? `${cityName} mein mausam ka dhyan rakhein! ☔ Barish ke season mein umbrella aur raincoat ka stock badhao — demand 40-60% tak badh sakti hai. Chai-pakoda ingredients bhi rakh lo, zyada bikenge!\n\nGarmi mein cold drinks, ice cream, aur cooling products ki demand 50%+ badhti hai.`
      : `Weather impacts sales significantly in ${cityName}! ☔ During rains, umbrella & raincoat demand increases 40-60%. In summer, cold drinks & cooling products see 50%+ demand spikes.\n\nAction: Check our Weather Intelligence on Dashboard.`;
  } else if (/competitor|pratiyogi|amazon|flipkart|dmart|bigbasket/.test(lower)) {
    reply = isHindi
      ? `${cityName} mein aapke main competitors: ${c.topCompetitors.join(', ')}. 🎯\n\nTip: ${c.topCompetitors[0]} se 5-8% sasta rakhein high-demand items pe. Unique service do — home delivery, credit, personal touch — ye online players nahi de sakte!\n\nAction: Competitors page pe detailed analysis dekhein.`
      : `Your main competitors in ${cityName}: ${c.topCompetitors.join(', ')}. 🎯\n\nTip: Price 5-8% below ${c.topCompetitors[0]} on high-demand items. Offer unique services — home delivery, credit, personal touch — that online players can't match!\n\nAction: Check Competitors page for detailed analysis.`;
  } else if (/wholesale|thok|supplier|order/.test(lower)) {
    reply = isHindi
      ? `${cityName} ke best wholesalers se order karo! 🏪 Smart Sourcing page pe jaake apne nearest wholesalers dekhein. Bulk order pe 10-15% tak bachao. MOQ (minimum order) ka dhyan rakhein.\n\nTip: Festival se 2-3 hafte pehle order do — best rates milte hain.`
      : `Connect with the best wholesalers in ${cityName}! 🏪 Check Smart Sourcing page for nearest suppliers. Save 10-15% on bulk orders. Watch for MOQ requirements.\n\nTip: Order 2-3 weeks before festivals for best rates.`;
  } else if (/profit|munafa|margin|kamai|earning/.test(lower)) {
    reply = isHindi
      ? `Profit badhane ke 3 tarike ${cityName} mein:\n\n1. 💰 Smart Pricing: AI se optimal price set karein (Pricing page)\n2. 📦 Bulk Buying: Wholesaler se 10-15% sasta khareedein (Sourcing page)\n3. 🎯 Festival Stocking: ${festival ? festival.name + ' ke liye abhi stock karein — ' + Math.round(festival.demandBoost * 100) + '% extra demand!' : 'Next festival ki tayyari shuru karein'}\n\nTarget: Monthly profit 20% tak badha sakte hain!`
      : `3 ways to increase profit in ${cityName}:\n\n1. 💰 Smart Pricing: Set optimal prices using AI (Pricing page)\n2. 📦 Bulk Buying: Save 10-15% from wholesalers (Sourcing page)\n3. 🎯 Festival Stocking: ${festival ? 'Stock up for ' + festival.name + ' — expect ' + Math.round(festival.demandBoost * 100) + '% demand increase!' : 'Prepare for next festival season'}\n\nTarget: Increase monthly profit by up to 20%!`;
  } else {
    // General business tip
    const tips = [
      `${cityName} mein aaj ka business tip: Apne top 5 products ka margin check karein. Agar kisi ka margin 15% se kam hai, toh pricing adjust karein ya wholesaler se better rate negotiate karein! 📊`,
      `Tip of the day for ${cityName}: Customer retention pe focus karein. Loyal customers ko 5% discount dein — wo 3x zyada khareedenge over time. Personal WhatsApp messages bhejein new stock ke baare mein! 🤝`,
      `${cityName} market insight: ${c.topCompetitors[0]} aur ${c.topCompetitors[1]} ke prices daily track karein. Competitor page pe automated monitoring available hai. Knowledge is power! 💪`,
    ];
    reply = tips[Math.floor(Math.random() * tips.length)];
  }

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    },
    body: JSON.stringify({
      success: true,
      data: {
        response: reply,
        city: cityName,
        timestamp: new Date().toISOString(),
        demoMode: true,
      },
    }),
  };
}

// ── SENTIMENT FALLBACK ──

export function getDemoSentimentResponse(
  productName: string, reviews?: { text: string }[]
) {
  const detectedCategory = detectCategory(productName);
  const cat = getCategory(detectedCategory);
  const overallScore = 68 + Math.floor(Math.random() * 24);

  const reviewTexts = reviews && reviews.length > 0
    ? reviews.map(r => r.text)
    : [
        'Product accha hai but delivery bahut slow thi.',
        'Bahut badhiya quality! Aroma zabardast tha.',
        'Price thoda zyada hai compared to local market.',
        'Excellent quality. Would buy again!',
        'Average product. Nothing special.',
      ];

  const positivePct = Math.round(overallScore * 0.8);
  const negativePct = Math.round((100 - overallScore) * 0.6);
  const neutralPct = 100 - positivePct - negativePct;

  const keyThemes = cat.sentimentThemes.map((theme, i) => ({
    theme,
    frequency: Math.max(1, Math.floor(reviewTexts.length * (0.8 - i * 0.15))),
    sentiment: i < 3 ? 30 + Math.floor(Math.random() * 50) : -10 + Math.floor(Math.random() * 40),
    exampleReviews: [reviewTexts[i % reviewTexts.length]],
  }));

  const productAttributes = cat.sentimentThemes.slice(0, 4).map((attr, i) => ({
    attribute: attr,
    sentiment: i < 2 ? 40 + Math.floor(Math.random() * 40) : -20 + Math.floor(Math.random() * 60),
    mentionCount: Math.floor(reviewTexts.length * (0.6 - i * 0.1)),
    keyPhrases: [`good ${attr}`, `excellent ${attr}`, `average ${attr}`],
  }));

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    },
    body: JSON.stringify({
      success: true,
      data: {
        overallSentiment: {
          score: overallScore,
          label: overallScore >= 60 ? 'Positive' : overallScore >= 40 ? 'Mixed' : 'Negative',
          distribution: { positive: positivePct, neutral: neutralPct, negative: negativePct },
        },
        keyThemes,
        productAttributes,
        actionableInsights: [
          {
            category: 'strength',
            priority: 'high',
            description: `${cat.sentimentThemes[0]} is consistently praised across reviews. This is your product's strongest attribute.`,
            affectedReviewCount: Math.ceil(reviewTexts.length * 0.6),
            suggestedAction: `Highlight ${cat.sentimentThemes[0]} in your product listings and marketing materials.`,
          },
          {
            category: 'improvement',
            priority: 'medium',
            description: `Some customers mentioned concerns about ${cat.sentimentThemes[3] || 'pricing'}. This is an area for improvement.`,
            affectedReviewCount: Math.ceil(reviewTexts.length * 0.25),
            suggestedAction: `Address ${cat.sentimentThemes[3] || 'pricing'} concerns by improving packaging or offering competitive bundles.`,
          },
          {
            category: 'opportunity',
            priority: 'low',
            description: `Customers appreciate the product. Consider requesting more reviews to boost visibility.`,
            affectedReviewCount: reviewTexts.length,
            suggestedAction: `Send WhatsApp follow-ups to recent buyers requesting reviews.`,
          },
        ],
        languageBreakdown: [
          { language: 'Hinglish', reviewCount: Math.ceil(reviewTexts.length * 0.5), avgSentiment: overallScore },
          { language: 'English', reviewCount: Math.ceil(reviewTexts.length * 0.3), avgSentiment: overallScore + 5 },
          { language: 'Hindi', reviewCount: Math.ceil(reviewTexts.length * 0.2), avgSentiment: overallScore - 3 },
        ],
        hinglishInsights: `Overall customer sentiment for ${productName} is ${overallScore >= 60 ? 'positive' : 'mixed'}. Customers especially like ${cat.sentimentThemes[0]} and ${cat.sentimentThemes[1]}. Main area for improvement: ${cat.sentimentThemes[3] || cat.sentimentThemes[2]}. Hinglish reviews show customers are comfortable mixing languages — consider using Hinglish in your product descriptions for better engagement.`,
        productName,
        reviewCount: reviewTexts.length,
        analyzedAt: new Date().toISOString(),
        demoMode: true,
      },
    }),
  };
}

// ── COMPARE FALLBACK ──

export function getDemoCompareResponse(products: any[], city?: string) {
  const c = getCity(city);
  const cityName = city || 'Lucknow';
  const festival = getCurrentFestival(c);

  const comparedProducts = products.map((p: any, idx: number) => {
    const margin = ((p.currentPrice - p.costPrice) / p.currentPrice * 100).toFixed(1);
    const compAvg = Math.round(p.currentPrice * (0.98 + Math.random() * 0.08));
    const sentimentScore = 55 + Math.floor(Math.random() * 35);
    const monthlyUnits = 80 + Math.floor(Math.random() * 200);
    const demandTrend = Math.random() > 0.3 ? `+${5 + Math.floor(Math.random() * 15)}%` : `-${3 + Math.floor(Math.random() * 8)}%`;

    return {
      name: p.name,
      category: p.category || detectCategory(p.name),
      costPrice: p.costPrice,
      currentPrice: p.currentPrice,
      margin: `${margin}%`,
      competitorAvg: compAvg,
      pricePosition: p.currentPrice < compAvg ? 'below_market' : p.currentPrice > compAvg * 1.05 ? 'above_market' : 'at_market',
      demandTrend,
      festivalImpact: festival
        ? `High (${festival.name} — +${Math.round(festival.demandBoost * 100)}%)`
        : 'Medium — Steady demand',
      sentiment: sentimentScore,
      avgMonthlyUnits: monthlyUnits,
      strengths: [
        `${parseFloat(margin) > 30 ? 'High' : 'Moderate'} margin at ${margin}%`,
        `${p.currentPrice < compAvg ? 'Below market average — competitive' : 'At market rate'}`,
        `Strong demand in ${cityName}`,
      ],
      risks: [
        `${c.topCompetitors[0]} competition in ${cityName}`,
        `${parseFloat(margin) > 40 ? 'High price may reduce volume' : 'Thin margin limits flexibility'}`,
      ],
    };
  });

  // Determine best in each category
  const bestMargin = comparedProducts.reduce((best: any, p: any) => parseFloat(p.margin) > parseFloat(best.margin) ? p : best);
  const bestDemand = comparedProducts.reduce((best: any, p: any) => p.avgMonthlyUnits > best.avgMonthlyUnits ? p : best);

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    },
    body: JSON.stringify({
      success: true,
      data: {
        products: comparedProducts,
        recommendation: {
          bestMargin: bestMargin.name,
          bestDemand: bestDemand.name,
          bestOverall: bestMargin.name,
          reasoning: `In ${cityName} (${c.tier} city), ${bestMargin.name} offers the best margin at ${bestMargin.margin} with competitive positioning. ${festival ? `With ${festival.name} approaching, demand for both products will increase. Stock up early.` : 'Focus on maintaining competitive pricing and volume.'} Consider running bundle offers across categories.`,
        },
        insights: [
          `${bestMargin.name} has the highest margin — maintain pricing and focus on volume.`,
          `In ${cityName}, ${c.topCompetitors[0]} and ${c.topCompetitors[1]} are your main competitors. Monitor their pricing weekly.`,
          festival
            ? `${festival.name} is approaching — expect ${Math.round(festival.demandBoost * 100)}% demand increase. Pre-order from wholesalers for better rates.`
            : `No major festivals this month. Good time to run loyalty promotions and clear slow-moving stock.`,
        ],
        demoMode: true,
      },
    }),
  };
}

// ── COMPETITOR FALLBACK ──

export function getDemoCompetitorResponse(products: any[], city?: string) {
  const c = getCity(city);
  const cityName = city || 'Lucknow';
  const festival = getCurrentFestival(c);
  const now = new Date();

  const analyzedProducts = products.map((p: any) => {
    const basePrice = p.yourPrice || p.sellingPrice || p.currentPrice || 400;
    const yourPrice = basePrice;
    const costPrice = p.costPrice || Math.round(basePrice * 0.7);

    const competitors = [
      { seller: 'Amazon', price: Math.round(basePrice * 1.05), prevPrice: Math.round(basePrice * 1.07), rating: 4.2, lastUpdated: '2h ago', inStock: true },
      { seller: 'Flipkart', price: Math.round(basePrice * 1.03), prevPrice: Math.round(basePrice * 1.01), rating: 4.0, lastUpdated: '3h ago', inStock: true },
      { seller: 'BigBasket', price: Math.round(basePrice * 1.02), prevPrice: Math.round(basePrice * 1.04), rating: 3.8, lastUpdated: '1h ago', inStock: true },
      { seller: 'DMart', price: Math.round(basePrice * 0.97), prevPrice: Math.round(basePrice * 0.97), rating: null, lastUpdated: '4h ago', inStock: Math.random() > 0.2 },
      { seller: 'JioMart', price: Math.round(basePrice * 0.99), prevPrice: Math.round(basePrice * 1.01), rating: 3.5, lastUpdated: '5h ago', inStock: true },
    ];

    // Generate 7-day price history
    const priceHistory = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayLabel = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
      const avgComp = Math.round(basePrice * (1.00 + (Math.random() - 0.5) * 0.06));
      priceHistory.push({
        date: dayLabel,
        yourPrice: yourPrice,
        avgCompetitor: avgComp,
      });
    }

    return {
      name: p.name,
      category: p.category || detectCategory(p.name),
      yourPrice,
      costPrice,
      competitors,
      priceHistory,
    };
  });

  const alerts = analyzedProducts.flatMap((p: any) => {
    const alerts: any[] = [];
    const cheapest = p.competitors.reduce((min: any, c: any) => c.price < min.price ? c : min);
    if (cheapest.price < p.yourPrice) {
      alerts.push({
        product: p.name,
        message: `${cheapest.seller} is selling ${p.name} at ₹${cheapest.price} — ₹${p.yourPrice - cheapest.price} cheaper than your price.`,
        severity: (p.yourPrice - cheapest.price) > p.yourPrice * 0.08 ? 'high' : 'medium',
        actionItem: `Consider matching or getting within ₹${Math.round((p.yourPrice - cheapest.price) / 2)} of ${cheapest.seller}'s price.`,
      });
    }
    return alerts;
  });

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    },
    body: JSON.stringify({
      success: true,
      data: {
        products: analyzedProducts,
        alerts,
        strategicInsights: {
          overallPosition: `Your pricing in ${cityName} is ${alerts.length === 0 ? 'competitively positioned' : 'slightly above market average for some products'}. ${c.tier === 'metro' ? 'Metro customers value convenience — your local presence is an advantage.' : 'Tier-1 customers are price-sensitive — stay competitive.'}`,
          recommendations: [
            `Monitor ${c.topCompetitors[0]} and ${c.topCompetitors[1]} prices weekly — they drive market pricing in ${cityName}.`,
            `Your advantage over online sellers: same-day availability, no delivery wait, personal service, and credit facility.`,
          ],
          festivalStrategy: festival
            ? `${festival.name} is approaching. Competitors will raise prices by 5-10% closer to the festival. Lock in wholesale prices now and undercut online sellers during peak demand.`
            : `No major festivals this month. Focus on building customer loyalty through competitive pricing and personal service.`,
        },
        demoMode: true,
      },
    }),
  };
}
