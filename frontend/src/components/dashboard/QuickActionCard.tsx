import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

interface QuickActionCardProps {
  path: string
  label: string
  description: string
  icon: React.ElementType
  gradient: string
  index?: number
}

export default function QuickActionCard({
  path,
  label,
  description,
  icon: Icon,
  gradient,
  index = 0,
}: QuickActionCardProps) {
  return (
    <Link to={path}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.06 }}
        whileHover={{ scale: 1.03, y: -3 }}
        whileTap={{ scale: 0.97 }}
        className={`group relative bg-gradient-to-br ${gradient} rounded-xl p-4 text-white cursor-pointer shadow-lg hover:shadow-xl transition-all duration-200 overflow-hidden`}
      >
        {/* Subtle shine overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />

        <div className="relative z-10">
          <div className="w-10 h-10 rounded-lg bg-white/15 backdrop-blur-sm flex items-center justify-center mb-3">
            <Icon className="w-5 h-5 text-white" />
          </div>
          <p className="text-sm font-bold">{label}</p>
          <p className="text-[11px] text-white/70 mt-0.5">{description}</p>
          <div className="flex items-center gap-1 mt-2 text-[10px] font-semibold text-white/60 group-hover:text-white/90 transition-colors">
            Get started <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </motion.div>
    </Link>
  )
}
