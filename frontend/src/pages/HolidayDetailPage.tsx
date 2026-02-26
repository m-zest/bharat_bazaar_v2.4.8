import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CalendarDays, ArrowLeft, TrendingUp, Package, Truck, Star,
  MapPin, Tag, Sparkles, Clock, IndianRupee, ShoppingBag, Users
} from 'lucide-react'
import { api } from '../utils/api'

export default function HolidayDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [detail, setDetail] = useState<any>(null)
  const [recommendations, setRecommendations] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [recsLoading, setRecsLoading] = useState(false)
  const [selectedCity, setSelectedCity] = useState('Lucknow')
  const [error, setError] = useState('')

  const CITIES = ['Lucknow', 'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Ahmedabad', 'Pune', 'Jaipur', 'Indore']

  useEffect(() => {
    if (id) loadDetail()
  }, [id])

  async function loadDetail() {
    setLoading(true)
    try {
      const result = await api.getHolidayDetail(id!)
      setDetail(result)
      // Auto-load recommendations
      loadRecommendations()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function loadRecommendations(city?: string) {
    setRecsLoading(true)
    try {
      const result = await api.getHolidayRecommendations(id!, city || selectedCity)
      setRecommendations(result)
    } catch (err) {
      console.error('Failed to load recommendations:', err)
    } finally {
      setRecsLoading(false)
    }
  }

  function handleCityChange(city: string) {
    setSelectedCity(city)
    setRecommendations(null)
    loadRecommendations(city)
  }

  if (loading) {
    return (
      <div className="p-8 max-w-[1400px] space-y-6">
        <div className="skeleton h-8 w-48" />
        <div className="skeleton h-48 rounded-2xl" />
        <div className="grid md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-40 rounded-2xl" />)}
        </div>
      </div>
    )
  }

  if (error || !detail) {
    return (
      <div className="p-8 text-center">
        <p className="text-clay-500 font-medium">{error || 'Holiday not found'}</p>
        <Link to="/holidays" className="text-saffron-500 text-sm mt-2 inline-block">Back to holidays</Link>
      </div>
    )
  }

  const { holiday, suppliers } = detail

  return (
    <div className="p-8 max-w-[1400px]">
      {/* Back button */}
      <Link to="/holidays" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Holidays
      </Link>

      {/* Holiday Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-saffron-500 to-bazaar-500 rounded-2xl p-8 text-white mb-8"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className={`text-xs px-3 py-1 rounded-full font-semibold uppercase ${
                holiday.type === 'national' ? 'bg-white/20' : 'bg-white/20'
              }`}>
                {holiday.type}
              </span>
              <span className="flex items-center gap-1 text-sm bg-white/20 px-3 py-1 rounded-full">
                <TrendingUp className="w-3.5 h-3.5" />
                {holiday.demandMultiplier}x demand expected
              </span>
            </div>
            <h1 className="font-display text-3xl font-bold">{holiday.name}</h1>
            <p className="text-lg font-hindi text-white/80 mt-1">{holiday.nameHi}</p>
            <p className="text-white/70 mt-3 max-w-2xl">{holiday.description}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="flex items-center gap-2 text-white/80">
              <CalendarDays className="w-5 h-5" />
              <span className="text-lg font-semibold">
                {new Date(holiday.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
            <p className={`text-sm mt-1 font-medium ${holiday.daysAway <= 30 ? 'text-yellow-200' : 'text-white/60'}`}>
              {holiday.daysAway <= 0 ? 'Happening now!' : `${holiday.daysAway} days away`}
            </p>
          </div>
        </div>

        {/* Tags row */}
        <div className="flex flex-wrap gap-2 mt-6">
          {holiday.categories.map((cat: string) => (
            <span key={cat} className="text-xs px-3 py-1 bg-white/15 rounded-full flex items-center gap-1">
              <Tag className="w-3 h-3" /> {cat}
            </span>
          ))}
          {holiday.type === 'regional' && holiday.regions.map((r: string) => (
            <span key={r} className="text-xs px-3 py-1 bg-white/15 rounded-full flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {r}
            </span>
          ))}
        </div>

        {/* Traditions */}
        {holiday.traditions?.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/20">
            <p className="text-xs text-white/50 uppercase tracking-wider mb-2">Key Traditions</p>
            <div className="flex flex-wrap gap-2">
              {holiday.traditions.map((t: string) => (
                <span key={t} className="text-xs px-2.5 py-1 bg-white/10 rounded-lg">{t}</span>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* AI Recommendations Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-royal-100 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-royal-600" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg text-gray-900">Recommended Items to Stock</h2>
              <p className="text-xs text-gray-400">AI-powered demand predictions for this holiday</p>
            </div>
          </div>
          <select
            value={selectedCity}
            onChange={(e) => handleCityChange(e.target.value)}
            className="input-field w-auto text-sm"
          >
            {CITIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {recsLoading ? (
          <div className="grid md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="skeleton h-48 rounded-2xl" />
            ))}
          </div>
        ) : recommendations?.recommendations?.length > 0 ? (
          <AnimatePresence>
            <div className="grid md:grid-cols-2 gap-4">
              {recommendations.recommendations.map((rec: any, i: number) => (
                <motion.div
                  key={rec.itemName}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="card"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{rec.itemName}</h3>
                      <span className="text-xs text-gray-400">{rec.category}</span>
                    </div>
                    <span className="flex items-center gap-1 text-sm font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
                      <TrendingUp className="w-3.5 h-3.5" />
                      +{rec.expectedDemandIncrease}%
                    </span>
                  </div>

                  {/* Price range */}
                  <div className="flex items-center gap-4 mt-3 text-sm">
                    <span className="flex items-center gap-1 text-gray-600">
                      <IndianRupee className="w-3.5 h-3.5" />
                      {rec.priceRange?.min && rec.priceRange?.max
                        ? `₹${rec.priceRange.min} - ₹${rec.priceRange.max}`
                        : 'Price varies'}
                    </span>
                    <span className="flex items-center gap-1 text-gray-600">
                      <Clock className="w-3.5 h-3.5" />
                      Stock {rec.daysBeforeToStock}d before
                    </span>
                  </div>

                  {/* Stock advice */}
                  <p className="text-sm text-gray-500 mt-3 bg-gray-50 rounded-xl p-3">
                    <ShoppingBag className="w-3.5 h-3.5 inline mr-1 text-gray-400" />
                    {rec.stockAdvice}
                  </p>

                  {/* Trending variants */}
                  {rec.trendingVariants?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {rec.trendingVariants.map((v: string) => (
                        <span key={v} className="text-[10px] px-2 py-0.5 bg-royal-50 text-royal-600 rounded-full">
                          {v}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Reasoning */}
                  <p className="text-xs text-gray-400 mt-3 italic">{rec.reasoning}</p>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        ) : !recsLoading && (
          <div className="text-center py-12 text-gray-400 card">
            <Sparkles className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No recommendations available yet</p>
            <p className="text-sm mt-1">Select a city above to get AI-powered stock suggestions</p>
          </div>
        )}

        {recommendations?.fromCache && (
          <p className="text-xs text-gray-400 mt-2 text-right">Cached result — generated {recommendations.generatedAt ? new Date(recommendations.generatedAt).toLocaleDateString() : 'recently'}</p>
        )}
      </div>

      {/* Suppliers Section */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-bazaar-100 flex items-center justify-center">
            <Truck className="w-5 h-5 text-bazaar-600" />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg text-gray-900">Suppliers & Wholesalers</h2>
            <p className="text-xs text-gray-400">Verified suppliers for {holiday.categories.join(', ')}</p>
          </div>
        </div>

        {suppliers?.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suppliers.map((supplier: any, i: number) => (
              <motion.div
                key={supplier.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="card"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 text-sm">{supplier.name}</h3>
                  <span className="flex items-center gap-1 text-xs font-medium text-saffron-600">
                    <Star className="w-3 h-3 fill-saffron-500" />
                    {supplier.rating}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-xs text-gray-400 mb-3">
                  <MapPin className="w-3 h-3" /> {supplier.city}
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between text-gray-600">
                    <span className="flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-gray-400" /> Min Order
                    </span>
                    <span className="font-medium">{supplier.minOrderQty} units</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-600">
                    <span className="flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-gray-400" /> Delivery
                    </span>
                    <span className="font-medium">{supplier.deliveryDays} days</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-600">
                    <span className="flex items-center gap-1.5">
                      <IndianRupee className="w-3.5 h-3.5 text-gray-400" /> Price Range
                    </span>
                    <span className="font-medium">{supplier.priceRange}</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-600">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-gray-400" /> Payment
                    </span>
                    <span className="font-medium text-xs">{supplier.paymentTerms}</span>
                  </div>
                </div>

                {/* Categories */}
                <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t border-gray-100">
                  {supplier.categories.map((cat: string) => (
                    <span key={cat} className="text-[10px] px-2 py-0.5 bg-bazaar-50 text-bazaar-600 rounded-full">
                      {cat}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400 card">
            <Truck className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p>No suppliers found for these categories</p>
          </div>
        )}
      </div>
    </div>
  )
}
