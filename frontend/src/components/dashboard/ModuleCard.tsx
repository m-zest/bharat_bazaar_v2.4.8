import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { useTheme } from '../../utils/ThemeContext'

interface ModuleCardProps {
  path: string
  label: string
  labelHi?: string
  description: string
  icon: React.ElementType
  color: string
  bg: string
  index?: number
  badge?: string
}

export default function ModuleCard({
  path,
  label,
  labelHi,
  description,
  icon: Icon,
  color,
  bg,
  index = 0,
  badge,
}: ModuleCardProps) {
  const { theme } = useTheme()
  const dk = theme === 'dark'

  return (
    <Link to={path}>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.04 }}
        whileHover={{ y: -3, scale: 1.015 }}
        whileTap={{ scale: 0.97 }}
        className={`group relative rounded-xl p-3.5 border cursor-pointer transition-all duration-200 ${
          dk
            ? 'bg-[#1a1a1d] border-[#2a2a2d] hover:border-orange-500/25 hover:shadow-lg hover:shadow-orange-500/5'
            : 'bg-white border-gray-200 hover:border-orange-500/30 hover:shadow-md'
        }`}
      >
        {/* Glow effect on hover */}
        <div className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
          dk ? 'bg-gradient-to-br from-orange-500/[0.03] to-transparent' : ''
        }`} />

        <div className="relative z-10">
          <div className="flex items-start justify-between mb-2.5">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${bg} transition-transform group-hover:scale-110`}>
              <Icon className={`w-4.5 h-4.5 ${color}`} />
            </div>
            {badge && (
              <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wider ${
                dk ? 'bg-saffron-500/10 text-saffron-400' : 'bg-saffron-50 text-saffron-600'
              }`}>
                {badge}
              </span>
            )}
          </div>
          <h4 className={`text-[12px] font-semibold leading-tight ${dk ? 'text-gray-200' : 'text-gray-800'}`}>{label}</h4>
          {labelHi && <p className={`text-[9px] font-hindi ${dk ? 'text-gray-600' : 'text-gray-400'}`}>{labelHi}</p>}
          <p className={`text-[10px] mt-1 leading-relaxed ${dk ? 'text-gray-500' : 'text-gray-400'}`}>{description}</p>

          <div className={`flex items-center gap-1 mt-2 text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity ${color}`}>
            Open <ArrowRight className="w-3 h-3" />
          </div>
        </div>
      </motion.div>
    </Link>
  )
}
