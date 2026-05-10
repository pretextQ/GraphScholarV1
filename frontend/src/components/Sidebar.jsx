import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, FileText, GitFork, GraduationCap,
  MessageSquare, Sparkles, LogOut, PanelLeftClose, PanelLeftOpen,
} from 'lucide-react'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: '概览' },
  { to: '/documents', icon: FileText, label: '文档' },
  { to: '/graph', icon: GitFork, label: '图谱' },
  { to: '/learning', icon: GraduationCap, label: '学习' },
  { to: '/chat', icon: MessageSquare, label: '问答' },
]

export default function Sidebar({ collapsed, onToggle }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="flex-shrink-0 flex flex-col py-5 relative z-30"
      style={{
        width: collapsed ? 64 : 200,
        background: 'linear-gradient(180deg, rgba(8, 7, 26, 0.95) 0%, rgba(6, 5, 15, 0.98) 100%)',
        backdropFilter: 'blur(32px) saturate(1.3)',
        borderRight: '1px solid rgba(255, 255, 255, 0.03)',
        transition: 'width 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
      }}
    >
      {/* Logo */}
      <div className={`mb-6 flex items-center ${collapsed ? 'justify-center' : 'px-4 gap-3'}`}>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
            boxShadow: '0 4px 20px rgba(99, 102, 241, 0.3)',
          }}
        >
          <Sparkles className="w-4.5 h-4.5 text-white" />
        </div>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-[14px] font-bold text-white/90 tracking-tight whitespace-nowrap"
          >
            GraphScholar
          </motion.span>
        )}
      </div>

      {/* Nav Items */}
      <nav className={`flex-1 flex flex-col ${collapsed ? 'items-center' : 'px-3'} gap-1`}>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className="relative group w-full"
          >
            {({ isActive }) => (
              <div
                className={`relative flex items-center rounded-xl transition-all duration-400 ${
                  collapsed ? 'w-11 h-11 justify-center' : 'w-full h-10 px-3 gap-3'
                }`}
                style={{
                  background: isActive ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                  boxShadow: isActive ? '0 0 24px rgba(99, 102, 241, 0.12), inset 0 0 24px rgba(99, 102, 241, 0.04)' : 'none',
                }}
              >
                <Icon
                  className="w-[18px] h-[18px] transition-colors duration-300 flex-shrink-0"
                  style={{ color: isActive ? '#a5b4fc' : '#565a74' }}
                />
                {!collapsed && (
                  <span
                    className="text-[13px] font-medium transition-colors duration-300 whitespace-nowrap"
                    style={{ color: isActive ? '#a5b4fc' : '#565a74' }}
                  >
                    {label}
                  </span>
                )}
                {/* Active indicator bar */}
                {isActive && (
                  <motion.div
                    layoutId="sidebar-indicator"
                    className="absolute -left-[17px] w-[3px] h-5 rounded-r-full"
                    style={{
                      background: 'linear-gradient(to bottom, #6366f1, #06b6d4)',
                      boxShadow: '0 0 12px rgba(99, 102, 241, 0.5)',
                    }}
                    transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                  />
                )}
                {/* Tooltip — only when collapsed */}
                {collapsed && (
                  <div
                    className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg text-[12px] font-medium text-text-primary opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 whitespace-nowrap -translate-x-1 group-hover:translate-x-0"
                    style={{
                      background: 'rgba(20, 17, 37, 0.98)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
                      backdropFilter: 'blur(16px)',
                    }}
                  >
                    {label}
                  </div>
                )}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom: User + Toggle + Logout */}
      <div className={`flex flex-col items-center gap-2 mt-auto ${collapsed ? '' : 'px-3'}`}>
        <div className="w-6 h-px mb-2" style={{ background: 'rgba(255,255,255,0.06)' }} />

        {/* User Avatar */}
        <div
          className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3 w-full px-3'}`}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold text-white cursor-default flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #4f46e5, #6366f1)' }}
            title={user?.username || '用户'}
          >
            {user?.username?.[0]?.toUpperCase() || 'U'}
          </div>
          {!collapsed && (
            <span className="text-[12px] text-white/50 font-medium truncate">
              {user?.username || '用户'}
            </span>
          )}
        </div>

        {/* Toggle + Logout row */}
        <div className={`flex items-center ${collapsed ? 'flex-col gap-1' : 'w-full gap-1'}`}>
          <button
            onClick={onToggle}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 hover:bg-white/[0.05] group"
            title={collapsed ? '展开侧边栏' : '折叠侧边栏'}
          >
            {collapsed ? (
              <PanelLeftOpen className="w-3.5 h-3.5 text-white/30 group-hover:text-white/60 transition-colors" />
            ) : (
              <PanelLeftClose className="w-3.5 h-3.5 text-white/30 group-hover:text-white/60 transition-colors" />
            )}
          </button>

          <button
            onClick={handleLogout}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 hover:bg-white/[0.05] group"
            title="退出登录"
          >
            <LogOut className="w-3.5 h-3.5 text-white/30 group-hover:text-rose-400 transition-colors" />
          </button>
        </div>
      </div>
    </motion.aside>
  )
}
