export interface HolidayRecommendationInput {
  holidayName: string;
  holidayDescription: string;
  traditions: string[];
  affectedCategories: string[];
  demandMultiplier: number;
  city?: string;
  retailerCategory?: string;
}

export function buildHolidayRecommendationPrompt(input: HolidayRecommendationInput): string {
  const cityContext = input.city
    ? `The retailer is based in ${input.city}. Consider local preferences, buying power, and regional variations.`
    : 'Provide general pan-India recommendations.';

  const categoryContext = input.retailerCategory
    ? `The retailer specializes in "${input.retailerCategory}" — prioritize items in this category but also suggest complementary items from other categories.`
    : 'Suggest items across all relevant categories.';

  return `
You are an Indian retail demand planning expert. Analyze the upcoming holiday and recommend specific products that a small/medium retailer should stock.

## Holiday Context
- **Holiday**: ${input.holidayName}
- **Description**: ${input.holidayDescription}
- **Traditions**: ${input.traditions.join(', ')}
- **Demand Multiplier**: ${input.demandMultiplier}x normal demand
- **Affected Categories**: ${input.affectedCategories.join(', ')}

## Retailer Context
${cityContext}
${categoryContext}

## Instructions
Recommend 6-10 specific products to stock for this holiday. For each item provide:
1. **itemName**: Specific product name (not generic — e.g., "Designer LED Rakhi Set of 5" not just "Rakhi")
2. **category**: Which product category it falls under
3. **expectedDemandIncrease**: Percentage increase vs normal days (50-500%)
4. **priceRange**: { min, max } in INR — realistic wholesale buying prices
5. **stockAdvice**: Practical stocking advice (when to buy, how much, storage tips)
6. **daysBeforeToStock**: How many days before the holiday to start stocking
7. **trendingVariants**: Array of 3-5 trending sub-variants or styles
8. **reasoning**: Why this item will sell well for this specific holiday

Focus on practical, actionable recommendations for small Indian retailers. Include both traditional items and trending modern alternatives. Prices should be realistic wholesale/bulk buying prices in Indian Rupees.

Respond in this exact JSON format:
{
  "recommendations": [
    {
      "itemName": "string",
      "category": "string",
      "expectedDemandIncrease": number,
      "priceRange": { "min": number, "max": number },
      "stockAdvice": "string",
      "daysBeforeToStock": number,
      "trendingVariants": ["string"],
      "reasoning": "string"
    }
  ]
}
`.trim();
}
