import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import StatCard from '../components/StatCard'
import {
  BookOpen, FileText, GitFork, RotateCcw, MessageSquare,
  ArrowRight, CheckCircle2, TrendingUp, Upload,
  BarChart3, Brain, Zap, Target, Clock, Search,
} from 'lucide-react'

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
}

export default function Dashboard() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState([])
  const [stats, setStats] = useState({ due: 0, nodes: 0, docs: 0, graphNodes: 0, todayReview: 0, reviewed: 0, weekTrend: [0,0,0,0,0,0,0], completionRate: 0 })

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    // 并行请求统计和任务
    const [statsRes, tasksRes] = await Promise.allSettled([
      api.get('/dashboard/stats'),
      api.get('/learn/tasks?limit=5'),
    ])

    if (statsRes.status === 'fulfilled') {
      setStats(statsRes.value.data)
    }

    if (tasksRes.status === 'fulfilled') {
      setTasks(tasksRes.value.data)
    } else {
      setTasks([
        { id: 1, title: 'FastAPI 基础入门', content: 'FastAPI 是一个现代、高性能的 Python Web 框架...', state: 'new' },
        { id: 2, title: 'SQLAlchemy 异步编程', content: 'SQLAlchemy 2.0 异步 ORM 实践...', state: 'learning' },
        { id: 3, title: 'FSRS 间隔重复算法', content: '自由间隔重复调度器核心原理...', state: 'review' },
      ])
    }
  }

  const stateMap = {
    new: { label: '新卡片', color: '#818cf8', bg: 'rgba(129,140,248,0.1)' },
    learning: { label: '学习中', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
    review: { label: '复习中', color: '#34d399', bg: 'rgba(52,211,153,0.1)' },
    relearning: { label: '重学中', color: '#fb7185', bg: 'rgba(251,113,133,0.1)' },
  }

  const quickActions = [
    { to: '/documents', icon: Upload, label: '上传文档', gradient: 'linear-gradient(135deg, #4f46e5, #6366f1)' },
    { to: '/chat', icon: MessageSquare, label: '智能问答', gradient: 'linear-gradient(135deg, #06b6d4, #22d3ee)' },
    { to: '/graph', icon: GitFork, label: '探索图谱', gradient: 'linear-gradient(135deg, #8b5cf6, #a78bfa)' },
    { to: '/learning', icon: RotateCcw, label: '开始复习', gradient: 'linear-gradient(135deg, #14b8a6, #2dd4bf)' },
    { to: '/documents', icon: Search, label: '搜索知识', gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)' },
    { to: '/graph', icon: BarChart3, label: '学习统计', gradient: 'linear-gradient(135deg, #f43f5e, #fb7185)' },
  ]

  const weekData = stats.weekTrend
  const weekDays = ['一', '二', '三', '四', '五', '六', '日']
  const maxVal = Math.max(...weekData, 1)
  const completionRate = stats.completionRate
  const circumference = 2 * Math.PI * 40
  const dashOffset = circumference - (completionRate / 100) * circumference

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">
      {/* Header Bar */}
      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 lg:mb-8 gap-4">
        <div>
          <h1 className="text-[20px] lg:text-[22px] font-semibold text-white/90 tracking-tight">
            欢迎回来，<span className="text-gradient">{user?.username || '同学'}</span>
          </h1>
          <p className="text-[12px] lg:text-[13px] text-white/35 mt-1 font-normal">
            今天有 {stats.todayReview} 个知识点等待复习
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <Clock className="w-3.5 h-3.5 text-white/25" />
            <span className="text-[11px] lg:text-[12px] text-white/35 font-medium">
              {new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid — auto-fit + minmax */}
      <motion.div variants={fadeUp} className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3 lg:gap-4 mb-5 lg:mb-6">
        <StatCard icon={BookOpen} label="知识节点" value={stats.nodes} gradient="linear-gradient(135deg, rgba(99,102,241,0.1), rgba(99,102,241,0.02))" delay={0} />
        <StatCard icon={FileText} label="文档数量" value={stats.docs} gradient="linear-gradient(135deg, rgba(6,182,212,0.1), rgba(6,182,212,0.02))" delay={1} />
        <StatCard icon={GitFork} label="图谱节点" value={stats.graphNodes} gradient="linear-gradient(135deg, rgba(139,92,246,0.1), rgba(139,92,246,0.02))" delay={2} />
        <StatCard icon={RotateCcw} label="今日复习" value={stats.todayReview} gradient="linear-gradient(135deg, rgba(20,184,166,0.1), rgba(20,184,166,0.02))" delay={3} />
        <StatCard icon={MessageSquare} label="AI 问答" value="--" gradient="linear-gradient(135deg, rgba(245,158,11,0.1), rgba(245,158,11,0.02))" delay={4} />
      </motion.div>

      {/* Primary Row: Task List + Quick Actions */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-[repeat(auto-fit,minmax(380px,1fr))] gap-4 mb-5 lg:mb-6">
        {/* Today's Tasks */}
        <div className="glass-primary p-6 relative overflow-hidden min-w-0">
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.3), rgba(6,182,212,0.3), transparent)' }} />

          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.1)', boxShadow: '0 0 16px rgba(99,102,241,0.08)' }}>
                <TrendingUp className="w-4 h-4 text-brand-400" />
              </div>
              <div>
                <h2 className="text-[15px] font-medium text-white/80">今日复习任务</h2>
                <p className="text-[11px] text-white/30 mt-0.5">基于 FSRS 算法智能调度</p>
              </div>
            </div>
            <Link to="/learning" className="text-[12px] flex items-center gap-1 text-brand-400 hover:text-brand-300 transition-colors font-medium">
              查看全部 <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {tasks.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(52,211,153,0.08)' }}>
                <CheckCircle2 className="w-7 h-7 text-teal-400" />
              </div>
              <p className="text-[13px] text-white/40">太棒了！今天没有待复习的内容。</p>
            </div>
          ) : (
            <div className="space-y-2">
              {tasks.map((task, i) => {
                const s = stateMap[task.state] || stateMap.new
                return (
                  <motion.div
                    key={task.id || i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.04 }}
                    className="flex items-center gap-3.5 p-3.5 rounded-xl cursor-pointer transition-all duration-200 group"
                    style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.03)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.035)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.015)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.03)' }}
                  >
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: s.bg }}>
                      <BookOpen className="w-4 h-4" style={{ color: s.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[13px] font-medium text-white/80 truncate">{task.title}</h3>
                      <p className="text-[11px] text-white/25 truncate mt-0.5">{task.content}</p>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium" style={{ background: s.bg, color: s.color }}>
                      {s.label}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-white/15 group-hover:text-white/30 transition-colors" />
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="glass p-6 min-w-0">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(6,182,212,0.08)' }}>
              <Zap className="w-4 h-4 text-accent-400" />
            </div>
            <h2 className="text-[15px] font-medium text-white/70">快速操作</h2>
          </div>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-2.5">
            {quickActions.map(({ to, icon: Icon, label, gradient }, i) => (
              <motion.div key={label} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 + i * 0.04 }}>
                <Link
                  to={to}
                  className="flex flex-col items-center gap-2.5 p-4 rounded-xl transition-all duration-300 hover:scale-[1.03] group"
                  style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.03)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.015)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.03)' }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-shadow duration-300 group-hover:shadow-lg" style={{ background: gradient }}>
                    <Icon className="w-4.5 h-4.5 text-white" />
                  </div>
                  <span className="text-[11px] font-medium text-white/50 group-hover:text-white/70 transition-colors">{label}</span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Data Viz Row */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Trend Chart */}
        <div className="glass-primary p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(6,182,212,0.3), rgba(99,102,241,0.3), transparent)' }} />

          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(6,182,212,0.1)', boxShadow: '0 0 16px rgba(6,182,212,0.08)' }}>
                <TrendingUp className="w-4 h-4 text-accent-400" />
              </div>
              <div>
                <h2 className="text-[15px] font-medium text-white/80">本周趋势</h2>
                <p className="text-[11px] text-white/30 mt-0.5">学习次数统计</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[20px] font-semibold text-white/80">{weekData.reduce((a, b) => a + b, 0)}</span>
              <span className="text-[12px] text-white/30 ml-1">次</span>
            </div>
          </div>

          <div className="flex items-end gap-3 h-[180px]">
            {weekData.map((h, i) => {
              const height = (h / maxVal) * 100
              const isToday = i === 4
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-[11px] font-medium" style={{ color: isToday ? '#22d3ee' : 'rgba(255,255,255,0.2)' }}>{h}</span>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ duration: 0.7, delay: 0.5 + i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                    className="w-full rounded-lg relative"
                    style={{
                      background: isToday
                        ? 'linear-gradient(to top, #06b6d4, #22d3ee)'
                        : 'linear-gradient(to top, rgba(6,182,212,0.15), rgba(6,182,212,0.35))',
                      boxShadow: isToday ? '0 0 24px rgba(6,182,212,0.25), 0 0 48px rgba(6,182,212,0.1)' : 'none',
                      minHeight: '6px',
                    }}
                  />
                  <span className="text-[11px] font-medium" style={{ color: isToday ? '#22d3ee' : 'rgba(255,255,255,0.25)' }}>
                    {weekDays[i]}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Completion Ring */}
        <div className="glass p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(20,184,166,0.06)' }}>
              <Target className="w-3.5 h-3.5 text-teal-400/60" />
            </div>
            <h2 className="text-[13px] font-medium text-white/50">完成率</h2>
          </div>

          <div className="flex items-center justify-center">
            <div className="relative w-[110px] h-[110px]">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="6" />
                <motion.circle
                  cx="50" cy="50" r="40" fill="none" stroke="url(#ring-grad)" strokeWidth="6" strokeLinecap="round"
                  strokeDasharray={circumference} initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset: dashOffset }}
                  transition={{ duration: 1.2, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
                />
                <defs>
                  <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#4f46e5" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span className="text-[26px] font-semibold text-white/80" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
                  {completionRate}%
                </motion.span>
                <span className="text-[10px] text-white/25">本周目标</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 mt-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: '#4f46e5' }} />
              <span className="text-[10px] text-white/25">已完成</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} />
              <span className="text-[10px] text-white/25">待完成</span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
