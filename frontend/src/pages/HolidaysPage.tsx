import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { CalendarDays, Search, MapPin, Tag, TrendingUp, ArrowRight } from 'lucide-react'
import { api } from '../utils/api'

const MONTHS = [
  { value: 0, label: 'All Months' },
  { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
  { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
  { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
  { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' },
]

export default function HolidaysPage() {
  const navigate = useNavigate()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [type, setType] = useState('all')
  const [state, setState] = useState('')
  const [month, setMonth] = useState(0)
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadHolidays()
  }, [type, state, month])

  async function loadHolidays() {
    setLoading(true)
    try {
      const params: any = {}
      if (type !== 'all') params.type = type
      if (state) params.state = state
      if (month) params.month = month
      const result = await api.getHolidays(params)
      setData(result)
    } catch (err) {
      console.error('Failed to load holidays:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredHolidays = data?.holidays?.filter((h: any) =>
    !search || h.name.toLowerCase().includes(search.toLowerCase()) || h.nameHi.includes(search)
  ) || []

  return (
    <div className="p-8 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-xl bg-saffron-100 flex items-center justify-center">
          <CalendarDays className="w-6 h-6 text-saffron-600" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Holiday Demand Intelligence</h1>
          <p className="text-gray-500 text-sm">
            <span className="font-hindi">त्योहार डिमांड</span> — Plan stock for upcoming festivals and holidays
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Search */}
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search holidays..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10"
            />
          </div>

          {/* Type filter */}
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="input-field"
          >
            <option value="all">All Holidays</option>
            <option value="national">National</option>
            <option value="regional">Regional</option>
          </select>

          {/* State filter */}
          <select
            value={state}
            onChange={(e) => setState(e.target.value)}
            className="input-field"
          >
            <option value="">All States</option>
            {(data?.states || []).map((s: string) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {/* Month filter */}
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="input-field"
          >
            {MONTHS.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-500 mb-4">
        {loading ? 'Loading...' : `${filteredHolidays.length} holidays found`}
      </p>

      {/* Holiday Grid */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="skeleton h-52 rounded-2xl" />
          ))}
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={`${type}-${state}-${month}-${search}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {filteredHolidays.map((holiday: any, i: number) => (
              <motion.div
                key={holiday.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => navigate(`/holidays/${holiday.id}`)}
                className="card group cursor-pointer hover:-translate-y-1 transition-all"
              >
                {/* Type badge + demand multiplier */}
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold uppercase tracking-wider ${
                    holiday.type === 'national'
                      ? 'bg-saffron-100 text-saffron-700'
                      : 'bg-bazaar-100 text-bazaar-700'
                  }`}>
                    {holiday.type}
                  </span>
                  <span className="flex items-center gap-1 text-xs font-medium text-green-600">
                    <TrendingUp className="w-3 h-3" />
                    {holiday.demandMultiplier}x demand
                  </span>
                </div>

                {/* Name */}
                <h3 className="font-display font-bold text-gray-900 text-lg">{holiday.name}</h3>
                <p className="text-sm font-hindi text-gray-400">{holiday.nameHi}</p>

                {/* Date + days away */}
                <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                  <CalendarDays className="w-4 h-4" />
                  <span>{new Date(holiday.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  <span className={`ml-auto text-xs font-medium px-2 py-0.5 rounded-full ${
                    holiday.daysAway <= 30 ? 'bg-clay-100 text-clay-600' :
                    holiday.daysAway <= 90 ? 'bg-saffron-100 text-saffron-600' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {holiday.daysAway <= 0 ? 'Today!' : `${holiday.daysAway}d away`}
                  </span>
                </div>

                {/* Regions */}
                {holiday.type === 'regional' && (
                  <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                    <MapPin className="w-3 h-3" />
                    {holiday.regions.slice(0, 3).join(', ')}
                    {holiday.regions.length > 3 && ` +${holiday.regions.length - 3}`}
                  </div>
                )}

                {/* Categories */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {holiday.categories.slice(0, 3).map((cat: string) => (
                    <span key={cat} className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full flex items-center gap-1">
                      <Tag className="w-2.5 h-2.5" />
                      {cat}
                    </span>
                  ))}
                  {holiday.categories.length > 3 && (
                    <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-400 rounded-full">
                      +{holiday.categories.length - 3}
                    </span>
                  )}
                </div>

                {/* CTA */}
                <div className="mt-4 flex items-center text-saffron-500 text-sm font-medium gap-1 group-hover:gap-2 transition-all">
                  View Demand Insights <ArrowRight className="w-4 h-4" />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      )}

      {!loading && filteredHolidays.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium">No holidays found</p>
          <p className="text-sm mt-1">Try adjusting your filters</p>
        </div>
      )}
    </div>
  )
}
