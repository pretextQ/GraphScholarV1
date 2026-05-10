import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { motion } from 'framer-motion'
import { LogOut } from 'lucide-react'

export default function TopNav() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <motion.nav
      initial={{ y: -12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="h-14 flex items-center px-4 lg:px-6 flex-shrink-0 relative z-20"
      style={{
        background: 'linear-gradient(180deg, rgba(10, 8, 22, 0.6) 0%, rgba(6, 5, 15, 0.4) 100%)',
        backdropFilter: 'blur(24px) saturate(1.5)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
      }}
    >
      {/* Spacer */}
      <div className="flex-1" />

      {/* Right side: User */}
      <div className="flex items-center gap-3">
        {/* User Avatar + Logout */}
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #4f46e5, #6366f1)' }}
          >
            {user?.username?.[0]?.toUpperCase() || 'U'}
          </div>
          <span className="text-[12px] text-white/40 font-medium hidden sm:block">
            {user?.username || '用户'}
          </span>
          <button
            onClick={handleLogout}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white/25 hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-300"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.nav>
  )
}
