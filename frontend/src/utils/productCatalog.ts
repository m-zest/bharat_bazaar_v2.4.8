/**
 * Product catalog — maps onboarding product names to full inventory items.
 * When a store owner selects "Basmati Rice" during onboarding,
 * this gives us real cost/selling prices, categories, and sell rates.
 *
 * This is how the app "knows what the shop sells."
 */

export interface CatalogProduct {
  name: string
  category: string
  costPrice: number
  sellingPrice: number
  dailySellRate: number
  reorderLevel: number
  defaultQuantity: number // starting stock
}

// Realistic kirana store pricing for Indian market
const CATALOG: Record<string, CatalogProduct> = {
  // ─── Groceries ───
  'Basmati Rice':       { name: 'Basmati Rice (5kg)', category: 'Groceries', costPrice: 280, sellingPrice: 380, dailySellRate: 3, reorderLevel: 10, defaultQuantity: 25 },
  'Atta (Flour)':       { name: 'Atta Flour (10kg)', category: 'Groceries', costPrice: 320, sellingPrice: 420, dailySellRate: 4, reorderLevel: 10, defaultQuantity: 30 },
  'Cooking Oil':        { name: 'Fortune Sunflower Oil (1L)', category: 'Groceries', costPrice: 130, sellingPrice: 165, dailySellRate: 3, reorderLevel: 10, defaultQuantity: 28 },
  'Toor Dal':           { name: 'Toor Dal (1kg)', category: 'Groceries', costPrice: 120, sellingPrice: 155, dailySellRate: 5, reorderLevel: 15, defaultQuantity: 45 },
  'Sugar':              { name: 'Sugar (5kg)', category: 'Groceries', costPrice: 195, sellingPrice: 250, dailySellRate: 4, reorderLevel: 10, defaultQuantity: 35 },
  'Salt':               { name: 'Tata Salt (1kg)', category: 'Groceries', costPrice: 18, sellingPrice: 25, dailySellRate: 6, reorderLevel: 20, defaultQuantity: 50 },
  'Spices':             { name: 'MDH Spice Combo (4 pack)', category: 'Groceries', costPrice: 180, sellingPrice: 240, dailySellRate: 2, reorderLevel: 8, defaultQuantity: 20 },
  'Tea/Coffee':         { name: 'Tata Tea Gold (500g)', category: 'Groceries', costPrice: 160, sellingPrice: 210, dailySellRate: 3, reorderLevel: 10, defaultQuantity: 22 },

  // ─── Fashion ───
  'Cotton Kurta':       { name: 'Cotton Kurta Set', category: 'Fashion', costPrice: 450, sellingPrice: 899, dailySellRate: 1, reorderLevel: 5, defaultQuantity: 15 },
  'Saree':              { name: 'Khadi Cotton Saree', category: 'Fashion', costPrice: 800, sellingPrice: 1499, dailySellRate: 1, reorderLevel: 3, defaultQuantity: 10 },
  'T-Shirt':            { name: 'Printed T-Shirt (M/L/XL)', category: 'Fashion', costPrice: 180, sellingPrice: 399, dailySellRate: 2, reorderLevel: 8, defaultQuantity: 20 },
  'Jeans':              { name: 'Denim Jeans (Men)', category: 'Fashion', costPrice: 550, sellingPrice: 999, dailySellRate: 1, reorderLevel: 5, defaultQuantity: 12 },
  'Dupatta':            { name: 'Chiffon Dupatta', category: 'Fashion', costPrice: 120, sellingPrice: 299, dailySellRate: 2, reorderLevel: 5, defaultQuantity: 18 },
  'Sandals':            { name: 'Leather Sandals (Unisex)', category: 'Fashion', costPrice: 350, sellingPrice: 699, dailySellRate: 1, reorderLevel: 5, defaultQuantity: 10 },
  'Watch':              { name: 'Analog Watch (Men/Women)', category: 'Fashion', costPrice: 400, sellingPrice: 899, dailySellRate: 1, reorderLevel: 3, defaultQuantity: 8 },

  // ─── Electronics ───
  'Bluetooth Earbuds':  { name: 'Wireless Bluetooth Earbuds', category: 'Electronics', costPrice: 450, sellingPrice: 899, dailySellRate: 2, reorderLevel: 5, defaultQuantity: 15 },
  'Power Bank':         { name: 'Power Bank 10000mAh', category: 'Electronics', costPrice: 500, sellingPrice: 999, dailySellRate: 1, reorderLevel: 5, defaultQuantity: 10 },
  'Phone Case':         { name: 'Phone Case (Universal)', category: 'Electronics', costPrice: 60, sellingPrice: 199, dailySellRate: 3, reorderLevel: 10, defaultQuantity: 30 },
  'USB Cable':          { name: 'USB-C Fast Charging Cable', category: 'Electronics', costPrice: 80, sellingPrice: 199, dailySellRate: 3, reorderLevel: 10, defaultQuantity: 25 },
  'LED Bulb':           { name: 'LED Bulb 9W (Pack of 2)', category: 'Electronics', costPrice: 90, sellingPrice: 179, dailySellRate: 2, reorderLevel: 8, defaultQuantity: 20 },
  'Extension Board':    { name: 'Extension Board 4-Socket', category: 'Electronics', costPrice: 250, sellingPrice: 499, dailySellRate: 1, reorderLevel: 5, defaultQuantity: 12 },

  // ─── Home & Kitchen ───
  'Pressure Cooker':    { name: 'Pressure Cooker 3L', category: 'Home & Kitchen', costPrice: 900, sellingPrice: 1599, dailySellRate: 1, reorderLevel: 3, defaultQuantity: 8 },
  'Water Bottle':       { name: 'Steel Water Bottle 1L', category: 'Home & Kitchen', costPrice: 150, sellingPrice: 349, dailySellRate: 2, reorderLevel: 5, defaultQuantity: 15 },
  'Tiffin Box':         { name: 'Stainless Steel Tiffin Box', category: 'Home & Kitchen', costPrice: 200, sellingPrice: 449, dailySellRate: 1, reorderLevel: 5, defaultQuantity: 12 },
  'Bedsheet':           { name: 'Cotton Bedsheet (Double)', category: 'Home & Kitchen', costPrice: 350, sellingPrice: 699, dailySellRate: 1, reorderLevel: 5, defaultQuantity: 10 },
  'Towel Set':          { name: 'Cotton Towel Set (2 pcs)', category: 'Home & Kitchen', costPrice: 220, sellingPrice: 449, dailySellRate: 1, reorderLevel: 5, defaultQuantity: 10 },

  // ─── Beauty & Personal Care ───
  'Shampoo':            { name: 'Clinic Plus Shampoo (340ml)', category: 'Beauty & Personal Care', costPrice: 155, sellingPrice: 199, dailySellRate: 2, reorderLevel: 5, defaultQuantity: 14 },
  'Face Wash':          { name: 'Himalaya Face Wash (150ml)', category: 'Beauty & Personal Care', costPrice: 110, sellingPrice: 159, dailySellRate: 2, reorderLevel: 5, defaultQuantity: 12 },
  'Hair Oil':           { name: 'Parachute Coconut Oil (200ml)', category: 'Beauty & Personal Care', costPrice: 75, sellingPrice: 110, dailySellRate: 3, reorderLevel: 8, defaultQuantity: 20 },
  'Soap':               { name: 'Lux Soap (Pack of 4)', category: 'Beauty & Personal Care', costPrice: 95, sellingPrice: 140, dailySellRate: 3, reorderLevel: 10, defaultQuantity: 25 },
  'Toothpaste':         { name: 'Colgate MaxFresh (150g)', category: 'Beauty & Personal Care', costPrice: 85, sellingPrice: 110, dailySellRate: 2, reorderLevel: 8, defaultQuantity: 20 },
  'Deodorant':          { name: 'Fogg Deo Spray (150ml)', category: 'Beauty & Personal Care', costPrice: 140, sellingPrice: 210, dailySellRate: 1, reorderLevel: 5, defaultQuantity: 10 },
}

// Common cross-category items that most kirana stores stock
const ALWAYS_STOCKED = ['Surf Excel (1kg)', 'Parle-G Biscuit (Pack of 12)', 'Maggi Noodles (Family Pack)', 'Amul Butter (500g)', 'Vim Dishwash Bar (3 pack)']
const ALWAYS_STOCKED_DATA: CatalogProduct[] = [
  { name: 'Surf Excel (1kg)', category: 'Home & Kitchen', costPrice: 180, sellingPrice: 220, dailySellRate: 4, reorderLevel: 12, defaultQuantity: 8 },
  { name: 'Parle-G Biscuit (Pack of 12)', category: 'Groceries', costPrice: 60, sellingPrice: 84, dailySellRate: 6, reorderLevel: 20, defaultQuantity: 5 },
  { name: 'Maggi Noodles (Family Pack)', category: 'Groceries', costPrice: 96, sellingPrice: 120, dailySellRate: 8, reorderLevel: 15, defaultQuantity: 0 },
  { name: 'Amul Butter (500g)', category: 'Groceries', costPrice: 220, sellingPrice: 275, dailySellRate: 3, reorderLevel: 8, defaultQuantity: 12 },
  { name: 'Vim Dishwash Bar (3 pack)', category: 'Home & Kitchen', costPrice: 55, sellingPrice: 72, dailySellRate: 2, reorderLevel: 8, defaultQuantity: 18 },
]

/**
 * Build a personalized inventory from onboarding selections.
 * Assigns varied sources to show data came from different channels.
 */
export function buildInventoryFromOnboarding(
  selectedProducts: string[],
  category: string,
): Array<CatalogProduct & { id: string; source: string }> {
  const sources = ['bill_scan', 'wholesale', 'manual', 'whatsapp'] as const
  const items: Array<CatalogProduct & { id: string; source: string }> = []

  // Add user-selected products
  selectedProducts.forEach((productKey, i) => {
    const product = CATALOG[productKey]
    if (product) {
      items.push({
        ...product,
        id: `onboard-${i + 1}`,
        source: sources[i % sources.length],
      })
    }
  })

  // If Groceries or general store, add common cross-category items
  if (category === 'Groceries' || items.length < 5) {
    ALWAYS_STOCKED_DATA.forEach((product, i) => {
      if (!items.find(it => it.name === product.name)) {
        items.push({
          ...product,
          id: `common-${i + 1}`,
          source: sources[(items.length + i) % sources.length],
        })
      }
    })
  }

  return items
}

/**
 * Get the full catalog for a category (for "discover new products" features)
 */
export function getCatalogForCategory(category: string): CatalogProduct[] {
  return Object.values(CATALOG).filter(p => p.category === category)
}

export default CATALOG
