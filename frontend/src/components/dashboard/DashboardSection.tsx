import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import { useTheme } from '../../utils/ThemeContext'

interface DashboardSectionProps {
  title: string
  titleHi?: string
  description?: string
  icon?: React.ElementType
  iconColor?: string
  children: React.ReactNode
  columns?: 2 | 3 | 4
  className?: string
  collapsible?: boolean
  defaultOpen?: boolean
}

export default function DashboardSection({
  title,
  titleHi,
  description,
  icon: Icon,
  iconColor = 'text-saffron-500',
  children,
  columns = 3,
  className = '',
  collapsible = false,
  defaultOpen = true,
}: DashboardSectionProps) {
  const { theme } = useTheme()
  const dk = theme === 'dark'

  const gridClass =
    columns === 2 ? 'grid-cols-1 sm:grid-cols-2' :
    columns === 4 ? 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-4' :
    'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mb-6 ${className}`}
    >
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${dk ? 'bg-white/[0.06]' : 'bg-gray-100'}`}>
              <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
            </div>
          )}
          <div>
            <h3 className={`text-sm font-semibold ${dk ? 'text-gray-200' : 'text-gray-800'}`}>
              {title}
              {titleHi && <span className={`ml-2 text-[10px] font-hindi font-normal ${dk ? 'text-gray-500' : 'text-gray-400'}`}>{titleHi}</span>}
            </h3>
            {description && (
              <p className={`text-[11px] mt-0.5 ${dk ? 'text-gray-500' : 'text-gray-400'}`}>{description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Section Content */}
      <div className={`grid ${gridClass} gap-2.5`}>
        {children}
      </div>
    </motion.section>
  )
}
