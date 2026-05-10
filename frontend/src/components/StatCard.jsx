import { motion } from 'framer-motion'

export default function StatCard({ icon: Icon, label, value, gradient, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: delay * 0.06, ease: [0.22, 1, 0.36, 1] }}
      className="glass flex items-center gap-3.5 p-4 cursor-default group"
      style={{ minWidth: 0 }}
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-110"
        style={{
          background: gradient || 'rgba(99,102,241,0.06)',
        }}
      >
        {Icon && <Icon className="w-4 h-4 text-white/55" />}
      </div>

      <div className="flex flex-col min-w-0">
        <motion.span
          className="text-[20px] lg:text-[22px] font-semibold leading-none text-white/75"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: delay * 0.06 + 0.15, ease: [0.22, 1, 0.36, 1] }}
        >
          {value}
        </motion.span>
        <span className="text-[10px] lg:text-[11px] text-white/30 mt-1 font-medium">{label}</span>
      </div>
    </motion.div>
  )
}
