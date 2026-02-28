import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'

interface DemoModeBadgeProps {
  visible: boolean
}

export default function DemoModeBadge({ visible }: DemoModeBadgeProps) {
  if (!visible) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-6 right-6 z-50 group"
    >
      <div className="relative flex items-center gap-1.5 px-3 py-1.5 bg-purple-600/80 backdrop-blur-sm text-white rounded-full text-[11px] font-medium shadow-lg shadow-purple-500/20 cursor-default">
        <Zap className="w-3 h-3" />
        AI Demo Mode
        {/* Tooltip */}
        <div className="absolute bottom-full right-0 mb-2 w-56 p-2.5 bg-gray-900 text-white text-[10px] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl leading-relaxed">
          AI features running in demo mode with smart simulated responses. Real AI analysis available when AWS Bedrock is connected.
        </div>
      </div>
    </motion.div>
  )
}
