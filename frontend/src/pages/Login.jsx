import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Sparkles, BookOpen, GitFork, Brain, Loader2, ArrowRight } from 'lucide-react'

export default function Login() {
  const [isLogin, setIsLogin] = useState(true)
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isLogin) await login(form.username, form.password)
      else await register(form.username, form.email, form.password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || '操作失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const features = [
    { icon: BookOpen, title: '智能文档', desc: '上传即向量化，自动构建知识库' },
    { icon: GitFork, title: '知识图谱', desc: '实体关系自动抽取与可视化' },
    { icon: Brain, title: '间隔重复', desc: 'FSRS 算法自适应复习计划' },
  ]

  return (
    <div className="min-h-screen flex">
      {/* Left brand area */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #06050f 0%, #0a0820 40%, #06050f 100%)' }}>

        <div className="bg-orb w-[400px] h-[400px] -top-20 -left-20" style={{ background: '#14b8a6' }} />
        <div className="bg-orb w-[300px] h-[300px] bottom-10 right-10" style={{ background: '#fbbf24' }} />

        <div className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `radial-gradient(circle, #14b8a6 1px, transparent 1px)`,
            backgroundSize: '32px 32px',
          }} />

        <div className="relative z-10 flex flex-col justify-center px-16 xl:px-20">
          <div className="mb-12 anim-fade-up">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #0d9488, #14b8a6)', boxShadow: '0 8px 40px rgba(20,184,166,0.3)' }}>
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white/90 tracking-tight">图谱学者</h1>
                <p className="text-xs text-white/35 tracking-widest uppercase">GraphScholar</p>
              </div>
            </div>
            <p className="text-lg text-white/45 leading-relaxed max-w-md">
              融合知识图谱、向量检索与间隔重复算法，<br />
              <span className="text-teal-400 font-medium">让学习像呼吸一样自然。</span>
            </p>
          </div>

          <div className="space-y-3">
            {features.map(({ icon: Icon, title, desc }, i) => (
              <div
                key={title}
                className="flex items-center gap-4 px-5 py-4 rounded-xl glass glass-hover anim-fade-up"
                style={{ animationDelay: `${200 + i * 100}ms` }}
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(20,184,166,0.08)' }}>
                  <Icon className="w-5 h-5 text-teal-400" />
                </div>
                <div>
                  <h3 className="text-[13px] font-semibold text-white/75">{title}</h3>
                  <p className="text-[12px] text-white/35 mt-0.5">{desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-white/15 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>

          <div className="mt-12 h-px w-48" style={{ background: 'linear-gradient(90deg, rgba(20,184,166,0.25), transparent)' }} />
        </div>
      </div>

      {/* Right form area */}
      <div className="flex-1 flex items-center justify-center px-8" style={{ background: '#06050f' }}>
        <div className="w-full max-w-[380px]">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10 anim-fade-up">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #0d9488, #14b8a6)' }}>
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white/90">图谱学者</h1>
          </div>

          <div className="anim-fade-up" style={{ animationDelay: '100ms' }}>
            <h2 className="text-[22px] font-bold text-white/90 mb-1.5">
              {isLogin ? '欢迎回来' : '创建账号'}
            </h2>
            <p className="text-[13px] text-white/35 mb-8">
              {isLogin ? '登录以继续你的学习之旅' : '开始你的智能学习之旅'}
            </p>
          </div>

          {/* Tab */}
          <div className="flex p-1 rounded-xl mb-7 anim-fade-up" style={{ background: 'rgba(255,255,255,0.03)', animationDelay: '150ms' }}>
            {['登录', '注册'].map((tab) => (
              <button
                key={tab}
                onClick={() => { setIsLogin(tab === '登录'); setError('') }}
                className="flex-1 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-400"
                style={{
                  background: (tab === '登录') === isLogin
                    ? 'linear-gradient(135deg, #0d9488, #14b8a6)'
                    : 'transparent',
                  color: (tab === '登录') === isLogin ? 'white' : '#565a74',
                  boxShadow: (tab === '登录') === isLogin ? '0 2px 16px rgba(20,184,166,0.25)' : 'none',
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl text-[13px] anim-scale-in"
              style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)', color: '#fb7185' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 anim-fade-up" style={{ animationDelay: '200ms' }}>
            <div>
              <label className="block text-[12px] font-medium text-white/40 mb-2">用户名</label>
              <input
                type="text"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="input-field"
                placeholder="请输入用户名"
                required
              />
            </div>

            {!isLogin && (
              <div>
                <label className="block text-[12px] font-medium text-white/40 mb-2">邮箱</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="input-field"
                  placeholder="请输入邮箱"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-[12px] font-medium text-white/40 mb-2">密码</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="input-field"
                placeholder="请输入密码"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-glow w-full py-3.5 text-[14px] flex items-center justify-center gap-2 mt-6"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLogin ? '登 录' : '注 册'}
            </button>
          </form>

          <p className="text-center text-[11px] text-white/30 mt-8 anim-fade-up" style={{ animationDelay: '300ms' }}>
            {isLogin ? '没有账号？' : '已有账号？'}
            <button onClick={() => setIsLogin(!isLogin)} className="text-teal-400 hover:text-teal-300 ml-1 transition-colors">
              {isLogin ? '立即注册' : '去登录'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
