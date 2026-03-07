import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sparkles, Bell, Calendar, Zap } from 'lucide-react'
import { useTheme } from '../../utils/ThemeContext'

const ALERT_SEVERITY_STYLES: Record<string, { card: string; icon: string }> = {
  high:   { card: 'bg-red-500/5 border-red-500/15',    icon: 'bg-red-500/15 text-red-400' },
  medium: { card: 'bg-saffron-500/5 border-saffron-500/15', icon: 'bg-saffron-500/15 text-saffron-400' },
  low:    { card: 'bg-white/[0.02] border-[#2a2a2d]',  icon: 'bg-white/[0.06] text-gray-400' },
}

interface InsightsPanelProps {
  quickInsight: string
  alerts: any[]
  festivals: any[]
  selectedCity: string
}

export default function InsightsPanel({ quickInsight, alerts, festivals, selectedCity }: InsightsPanelProps) {
  const { theme } = useTheme()
  const dk = theme === 'dark'

  return (
    <div className="grid lg:grid-cols-3 gap-3 mb-6">
      {/* AI Insight + Alert Summary */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-[#1E1B4B] via-[#312e81] to-[#1E1B4B] rounded-xl p-4 text-white relative overflow-hidden"
      >
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-40 h-40 bg-saffron-500 rounded-full blur-[80px]" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-white/15 backdrop-blur-sm rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-saffron-300" />
            </div>
            <div>
              <p className="text-[9px] text-white/40 uppercase tracking-wider font-semibold">AI Insight</p>
              <p className="text-[10px] text-white/60">Powered by Bedrock + Gemini</p>
            </div>
          </div>
          <p className="text-xs font-medium leading-relaxed text-white/90 mb-3">{quickInsight}</p>
          <Link to="/chat">
            <motion.div whileHover={{ scale: 1.05 }} className="inline-flex bg-saffron-500 text-white text-[10px] font-semibold px-3 py-1.5 rounded-lg items-center gap-1 shadow-lg shadow-saffron-500/30">
              <Zap className="w-3 h-3" /> Ask Munim-ji
            </motion.div>
          </Link>
        </div>
      </motion.div>

      {/* Smart Alerts */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className={`rounded-xl p-4 border ${dk ? 'bg-[#1a1a1d] border-[#2a2a2d]' : 'bg-white border-gray-200'}`}
      >
        <h3 className={`text-xs font-semibold mb-2.5 flex items-center gap-1.5 ${dk ? 'text-gray-300' : 'text-gray-700'}`}>
          <Bell className="w-3.5 h-3.5 text-saffron-500" />
          Smart Alerts
        </h3>
        <div className="space-y-1.5 max-h-[160px] overflow-y-auto">
          {alerts?.slice(0, 4).map((alert: any, i: number) => {
            const styles = ALERT_SEVERITY_STYLES[alert.severity] || ALERT_SEVERITY_STYLES.low
            return (
              <Link key={alert.id} to={alert.actionRoute}>
                <motion.div
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`flex items-start gap-2 p-2 rounded-lg border transition-all hover:shadow-sm ${styles.card}`}
                >
                  <div className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${styles.icon}`}>
                    <Bell className="w-3 h-3" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[11px] font-medium truncate ${dk ? 'text-gray-200' : 'text-gray-800'}`}>{alert.title}</p>
                    <p className={`text-[10px] truncate ${dk ? 'text-gray-500' : 'text-gray-400'}`}>{alert.message}</p>
                  </div>
                </motion.div>
              </Link>
            )
          })}
        </div>
      </motion.div>

      {/* Upcoming Festivals */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`rounded-xl p-4 border ${dk ? 'bg-[#1a1a1d] border-[#2a2a2d]' : 'bg-white border-gray-200'}`}
      >
        <h3 className={`text-xs font-semibold mb-2.5 flex items-center gap-1.5 ${dk ? 'text-gray-300' : 'text-gray-700'}`}>
          <Calendar className="w-3.5 h-3.5 text-saffron-500" />
          Festival Trends — {selectedCity}
        </h3>
        <div className="space-y-1.5 max-h-[160px] overflow-y-auto">
          {festivals.length > 0 ? festivals.map((f: any, i: number) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex items-center justify-between p-2 rounded-lg transition-colors ${dk ? 'bg-white/[0.03] hover:bg-white/[0.06]' : 'bg-gray-50 hover:bg-gray-100'}`}
            >
              <div>
                <p className={`text-xs font-medium ${dk ? 'text-gray-200' : 'text-gray-800'}`}>{f.name}</p>
                <p className={`text-[10px] ${dk ? 'text-gray-500' : 'text-gray-400'}`}>{f.daysAway} days away</p>
              </div>
              <span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold ${
                f.impact === 'very_high' ? 'bg-red-500/10 text-red-400' :
                f.impact === 'high' ? 'bg-saffron-500/10 text-saffron-400' :
                'bg-white/[0.06] text-gray-400'
              }`}>
                {f.impact.replace('_', ' ')}
              </span>
            </motion.div>
          )) : (
            <p className="text-gray-400 text-xs py-4 text-center">No major festivals upcoming</p>
          )}
        </div>
      </motion.div>
    </div>
  )
}
