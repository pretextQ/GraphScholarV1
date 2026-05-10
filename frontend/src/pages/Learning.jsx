import { useState, useEffect, useCallback } from 'react'
import api from '../api/client'
import { GraduationCap, RotateCcw, ThumbsUp, Zap, Star, CheckCircle2, Loader2, ChevronLeft, ChevronRight, Brain, Flame, Target, TrendingUp } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const mockTasks = [
  { id: 1, title: 'FastAPI 依赖注入', content: 'FastAPI 使用 Python 类型提示实现依赖注入。Depends() 函数允许你声明依赖项，系统会自动解析并注入到路径操作函数中。', stability: 0.4, difficulty: 0.6, state: 'new' },
  { id: 2, title: 'SQLAlchemy 异步会话', content: 'SQLAlchemy 2.0 通过 AsyncSession 支持异步操作。使用 create_async_engine() 配合 asyncpg 驱动进行数据库操作。', stability: 0.8, difficulty: 0.4, state: 'learning' },
  { id: 3, title: 'FSRS 记忆模型', content: 'FSRS 使用稳定性 (S) 和难度 (D) 建模记忆。可检索性公式 R = (1 + t/(9S))^(-1) 预测回忆概率。', stability: 1.2, difficulty: 0.3, state: 'review' },
  { id: 4, title: '向量嵌入原理', content: '嵌入将文本映射到高维向量空间，语义相似的内容在空间中距离更近。余弦相似度衡量向量夹角。', stability: 0.6, difficulty: 0.5, state: 'new' },
  { id: 5, title: 'Neo4j MERGE 与 CREATE', content: 'CREATE 总是创建新节点。MERGE 是幂等的：匹配已有或创建新节点。对增量图谱构建至关重要。', stability: 1.0, difficulty: 0.35, state: 'review' },
]

const ratingConfig = [
  { value: 1, label: '忘了', icon: RotateCcw, bg: 'linear-gradient(135deg, #991b1b, #b91c1c)', glow: 'rgba(239,68,68,0.3)', desc: '完全不记得' },
  { value: 2, label: '模糊', icon: ThumbsUp, bg: 'linear-gradient(135deg, #92400e, #b45309)', glow: 'rgba(245,158,11,0.3)', desc: '有点印象' },
  { value: 3, label: '记得', icon: Zap, bg: 'linear-gradient(135deg, #065f46, #047857)', glow: 'rgba(16,185,129,0.3)', desc: '基本记住' },
  { value: 4, label: '秒答', icon: Star, bg: 'linear-gradient(135deg, #0d9488, #14b8a6)', glow: 'rgba(20,184,166,0.4)', desc: '非常熟练' },
]

export default function Learning() {
  const [tasks, setTasks] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [completed, setCompleted] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [allDone, setAllDone] = useState(false)
  const [ratings, setRatings] = useState([])

  useEffect(() => { loadTasks() }, [])

  const loadTasks = async () => {
    setLoading(true)
    try { const res = await api.get('/learn/tasks?limit=20'); setTasks(res.data.length > 0 ? res.data : mockTasks) }
    catch { setTasks(mockTasks) }
    finally { setLoading(false) }
  }

  const handleRate = useCallback(async (rating) => {
    if (submitting || allDone) return
    setSubmitting(true)
    try {
      await api.post('/learn/feedback', { learning_state_id: tasks[currentIndex].id, rating })
    } catch {
      // API 失败也继续推进，复习卡片本身是幂等的
    }
    setCompleted((c) => c + 1); setFlipped(false); setRatings((r) => [...r, rating])
    if (currentIndex + 1 >= tasks.length) setAllDone(true)
    else setCurrentIndex((i) => i + 1)
    setSubmitting(false)
  }, [submitting, allDone, tasks, currentIndex])

  // 键盘操作：Space 翻转，1-4 评分
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      if (e.code === 'Space') { e.preventDefault(); setFlipped((f) => !f) }
      if (flipped && !submitting && !allDone) {
        if (e.key >= '1' && e.key <= '4') handleRate(parseInt(e.key))
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [flipped, submitting, allDone, handleRate])

  if (loading) return (
    <div className="flex items-center justify-center h-full min-h-[60vh]">
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin mx-auto mb-3" />
        <p className="text-white/40 text-[13px]">加载卡片中...</p>
      </div>
    </div>
  )

  if (allDone) return (
    <div className="flex items-center justify-center h-full min-h-[60vh]">
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className="text-center relative">
        <div className="absolute inset-0 -m-20" style={{ background: 'radial-gradient(circle, rgba(20,184,166,0.08), transparent)' }} />
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center" style={{ background: 'rgba(20,184,166,0.12)', boxShadow: '0 0 60px rgba(20,184,166,0.15)' }}>
            <CheckCircle2 className="w-10 h-10 text-teal-400" />
          </div>
          <h2 className="text-[28px] font-bold text-white/90 mb-2">全部完成！</h2>
          <p className="text-white/40 text-[14px] mb-8">已复习完全部 {tasks.length} 张卡片，记忆强度正在提升</p>
          <button onClick={() => { setCurrentIndex(0); setCompleted(0); setAllDone(false); setRatings([]) }} className="btn-glow px-8 py-3.5 text-[14px]">
            再来一轮
          </button>
        </div>
      </motion.div>
    </div>
  )

  const task = tasks[currentIndex]
  const progress = tasks.length > 0 ? (completed / tasks.length) * 100 : 0
  const stateInfo = {
    new: { label: '新卡片', color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
    learning: { label: '学习中', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
    review: { label: '复习中', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  }
  const s = stateInfo[task.state] || stateInfo.new

  return (
    <div className="flex flex-col">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 lg:mb-6 gap-4">
        <div>
          <h1 className="text-[20px] lg:text-[22px] font-semibold text-white/90 tracking-tight">复习学习</h1>
          <p className="text-[12px] lg:text-[13px] text-white/35 mt-1">评估记忆程度，系统自动优化复习间隔</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <Brain className="w-3.5 h-3.5 text-brand-500" />
            <span className="text-[11px] lg:text-[12px] text-white/35">FSRS 自适应算法</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4 lg:gap-5 min-h-0">
        {/* Left: Flashcard */}
        <div className="flex flex-col min-h-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={task.id + '-' + flipped}
              initial={{ opacity: 0, rotateY: flipped ? -90 : 90 }}
              animate={{ opacity: 1, rotateY: 0 }}
              exit={{ opacity: 0, rotateY: flipped ? 90 : -90 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="flex-1 glass rounded-2xl p-8 lg:p-10 flex flex-col relative overflow-hidden cursor-pointer min-h-[360px]"
              onClick={() => setFlipped(!flipped)}
              style={{
                background: flipped
                  ? 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(99,102,241,0.03))'
                  : 'linear-gradient(135deg, rgba(255,255,255,0.02), rgba(6,182,212,0.02))',
                boxShadow: '0 8px 40px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.06)',
              }}
            >
              <div className="absolute top-0 right-0 w-64 h-64 pointer-events-none" style={{ background: 'radial-gradient(ellipse at top right, rgba(99,102,241,0.06), transparent 70%)' }} />

              <div className="flex items-center justify-between mb-6 relative">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold" style={{ background: s.bg, color: s.color }}>
                    {s.label}
                  </span>
                  <span className="text-[11px] text-white/30">
                    {currentIndex + 1} / {tasks.length}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-white/30">
                  <span>{flipped ? '点击查看问题' : '点击查看答案'}</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
                </div>
              </div>

              <div className="flex-1 flex flex-col items-center justify-center relative">
                {!flipped ? (
                  <>
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6" style={{ background: 'rgba(99,102,241,0.1)', boxShadow: '0 0 30px rgba(99,102,241,0.08)' }}>
                      <GraduationCap className="w-8 h-8 text-brand-500" />
                    </div>
                    <h2 className="text-[28px] lg:text-[32px] font-bold text-white/90 text-center leading-tight max-w-lg">{task.title}</h2>
                    <p className="text-[13px] text-white/30 mt-4 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
                      点击卡片或按空格翻转查看答案
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="text-[20px] font-semibold text-white/90 mb-5 self-start">{task.title}</h3>
                    <p className="text-[15px] text-white/50 leading-[1.8] self-start">{task.content}</p>
                    <div className="mt-8 pt-4 border-t border-white/[0.04] flex items-center gap-6 text-[12px] text-white/30 self-start">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: '#6366f1' }} />
                        <span>稳定性 {task.stability?.toFixed(1) || '1.0'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: '#f59e0b' }} />
                        <span>难度 {task.difficulty?.toFixed(1) || '0.5'}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center justify-center gap-2 text-[11px] text-white/30 mt-4">
                <kbd className="px-2 py-0.5 rounded text-[10px] font-mono" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>Space</kbd>
                <span>翻转</span>
                <span className="mx-2 text-white/10">|</span>
                <kbd className="px-2 py-0.5 rounded text-[10px] font-mono" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>1-4</kbd>
                <span>评分</span>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right: Stats + Controls */}
        <div className="flex flex-col gap-4 min-h-0">
          {/* Progress Card */}
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(20,184,166,0.1)' }}>
                <Target className="w-3.5 h-3.5 text-teal-400" />
              </div>
              <h3 className="text-[14px] font-semibold text-white/80">学习进度</h3>
            </div>
            <div className="flex items-end justify-between mb-3">
              <span className="text-[36px] font-bold text-white/80 leading-none">{completed}</span>
              <span className="text-[13px] text-white/30 mb-1">/ {tasks.length} 张</span>
            </div>
            <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #0d9488, #14b8a6)', boxShadow: '0 0 16px rgba(20,184,166,0.3)' }}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </div>

          {/* Today's Stats */}
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.1)' }}>
                <TrendingUp className="w-3.5 h-3.5 text-brand-500" />
              </div>
              <h3 className="text-[14px] font-semibold text-white/80">今日统计</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: '已复习', value: completed, color: '#10b981' },
                { label: '正确率', value: ratings.length > 0 ? Math.round(ratings.filter(r => r >= 3).length / ratings.length * 100) + '%' : '--', color: '#6366f1' },
                { label: '新卡片', value: tasks.filter(t => t.state === 'new').length, color: '#06b6d4' },
                { label: '待复习', value: tasks.length - completed, color: '#f59e0b' },
              ].map(({ label, value, color }) => (
                <div key={label} className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <span className="text-[22px] font-bold text-white/80 block">{value}</span>
                  <span className="text-[11px] text-white/30">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Rating Buttons */}
          <AnimatePresence>
            {flipped && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 16 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="glass rounded-2xl p-5"
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.1)' }}>
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <h3 className="text-[14px] font-semibold text-white/80">记忆评估</h3>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  {ratingConfig.map(({ value, label, icon: Icon, bg, glow, desc }) => (
                    <button
                      key={value}
                      onClick={() => handleRate(value)}
                      disabled={submitting}
                      className="flex flex-col items-center gap-1.5 py-4 rounded-xl font-medium transition-all duration-300 hover:scale-[1.03] hover:-translate-y-0.5 disabled:opacity-50 group"
                      style={{ background: bg, boxShadow: `0 4px 20px ${glow}` }}
                    >
                      <Icon className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
                      <span className="text-[13px] text-white font-semibold">{label}</span>
                      <span className="text-[10px] text-white/60">{desc}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => { if (currentIndex > 0) { setCurrentIndex(i => i - 1); setFlipped(false) } }}
              disabled={currentIndex === 0}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-medium text-white/40 transition-all duration-200 hover:text-white/70 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <ChevronLeft className="w-4 h-4" /> 上一张
            </button>
            <button
              onClick={() => { if (currentIndex < tasks.length - 1) { setCurrentIndex(i => i + 1); setFlipped(false) } }}
              disabled={currentIndex >= tasks.length - 1}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-medium text-white/40 transition-all duration-200 hover:text-white/70 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              下一张 <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
