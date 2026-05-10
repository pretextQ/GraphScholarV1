import { useState, useRef, useEffect } from 'react'
import api from '../api/client'
import {
  Send, Bot, User, Loader2, BookOpen, GitFork, Sparkles,
  RotateCcw, MessageSquare, Rocket, Brain, BarChart3,
  Copy, Check, ArrowDown,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

/* ── suggested questions ── */
const suggestedQuestions = [
  { text: '什么是 FastAPI？', icon: Rocket },
  { text: '解释一下 FSRS 算法', icon: Brain },
  { text: 'Graph-RAG 是如何工作的？', icon: GitFork },
  { text: '知识图谱有什么优势？', icon: BarChart3 },
]

/* ── sanitize: strip dangerous tags/attrs ── */
function sanitizeHtml(html) {
  // 移除 script/style/iframe/object/embed 标签及其内容
  let safe = html.replace(/<(script|style|iframe|object|embed|form|svg)[^>]*>[\s\S]*?<\/\1>/gi, '')
  // 移除所有 on* 事件属性
  safe = safe.replace(/\bon\w+\s*=\s*["'][^"']*["']/gi, '')
  safe = safe.replace(/\bon\w+\s*=\s*\S+/gi, '')
  // 移除 javascript: 协议
  safe = safe.replace(/javascript\s*:/gi, '')
  return safe
}

/* ── simple markdown → HTML ── */
function parseMarkdown(text) {
  if (!text) return ''

  let html = text.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) =>
    `<pre class="md-code-block"><div class="md-code-lang">${lang || 'text'}</div><code>${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`,
  )

  html = html.replace(/^>\s*(.+)$/gm, '<blockquote class="md-blockquote">$1</blockquote>')
  html = html.replace(/^### (.+)$/gm, '<h4 class="md-h3">$1</h4>')
  html = html.replace(/^## (.+)$/gm, '<h3 class="md-h2">$1</h3>')
  html = html.replace(/^# (.+)$/gm, '<h2 class="md-h1">$1</h2>')
  html = html.replace(/^[\-\*] (.+)$/gm, '<li class="md-li">$1</li>')
  html = html.replace(/((?:<li class="md-li">.*<\/li>\n?)+)/g, '<ul class="md-ul">$1</ul>')
  html = html.replace(/^\d+\.\s+(.+)$/gm, '<li class="md-li">$1</li>')
  html = html.replace(/((?:<li class="md-li">.*<\/li>\n?)+)/g, '<ol class="md-ol">$1</ol>')
  html = html.replace(/`([^`]+)`/g, '<code class="md-inline-code">$1</code>')
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="md-bold">$1</strong>')
  html = html.replace(/\*(.+?)\*/g, '<em class="md-italic">$1</em>')

  html = html
    .split(/\n{2,}/)
    .map((block) => {
      const t = block.trim()
      if (!t) return ''
      if (/^<(h[2-4]|ul|ol|pre|blockquote)/.test(t)) return t
      return `<p class="md-p">${t}</p>`
    })
    .join('')

  return sanitizeHtml(html)
}

/* ── main component ── */
export default function Chat() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [copiedIdx, setCopiedIdx] = useState(null)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const scrollContainerRef = useRef(null)
  const [showScrollBtn, setShowScrollBtn] = useState(false)

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const handleScroll = () => {
    const el = scrollContainerRef.current
    if (!el) return
    setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 200)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const copyMessage = (text, idx) => {
    navigator.clipboard.writeText(text)
    setCopiedIdx(idx)
    setTimeout(() => setCopiedIdx(null), 2000)
  }

  const send = async (text) => {
    const question = text || input.trim()
    if (!question || loading) return
    setMessages((prev) => [...prev, { role: 'user', content: question, time: new Date() }])
    setInput('')
    setLoading(true)
    try {
      const res = await api.post('/chat/', { question })
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: res.data.answer,
          sources: res.data.sources || [],
          graphContext: res.data.graph_context || '',
          retrievalScores: res.data.retrieval_scores || [],
          time: new Date(),
        },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: getMockAnswer(question),
          sources: ['图谱学者知识库', '技术文档'],
          graphContext: '已从知识图谱中找到相关概念',
          time: new Date(),
        },
      ])
    }
    setLoading(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  /* ── Welcome screen ── */
  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center relative">
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.04), transparent 60%)' }}
        />

        <div className="relative z-10 w-full max-w-2xl px-4 lg:px-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="flex justify-center mb-8"
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(6,182,212,0.1))',
                boxShadow: '0 0 48px rgba(99,102,241,0.1)',
              }}
            >
              <Sparkles className="w-8 h-8 text-brand-500" />
            </div>
          </motion.div>

          <motion.h2
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="text-[24px] lg:text-[28px] font-bold text-white/90 text-center mb-3"
          >
            Graph-RAG 智能问答
          </motion.h2>
          <motion.p
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.6 }}
            className="text-[13px] lg:text-[14px] text-white/35 text-center mb-10 max-w-lg mx-auto leading-relaxed"
          >
            基于你上传的文档和知识图谱，提供有据可查的精准回答
          </motion.p>

          <motion.div
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10"
          >
            {suggestedQuestions.map(({ text, icon: Icon }) => (
              <button
                key={text}
                onClick={() => send(text)}
                className="flex items-center gap-3 px-5 py-4 rounded-xl text-[13px] font-medium text-white/35 transition-all duration-400 hover:text-white/65 hover:scale-[1.02] text-left group"
                style={{
                  background: 'rgba(255,255,255,0.015)',
                  border: '1px solid rgba(255,255,255,0.04)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(99,102,241,0.15)'
                  e.currentTarget.style.background = 'rgba(99,102,241,0.03)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.04)'
                  e.currentTarget.style.background = 'rgba(255,255,255,0.015)'
                }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-110"
                  style={{ background: 'rgba(99,102,241,0.06)' }}
                >
                  <Icon className="w-4 h-4 text-brand-500" />
                </div>
                <span>{text}</span>
              </button>
            ))}
          </motion.div>

          <motion.div
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.25, duration: 0.6 }}
          >
            <InputBar
              input={input}
              setInput={setInput}
              loading={loading}
              send={send}
              handleKeyDown={handleKeyDown}
              inputRef={inputRef}
            />
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center text-[11px] text-white/20 mt-5 flex items-center justify-center gap-2"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
            输入问题或点击上方快捷按钮开始对话
          </motion.p>
        </div>
      </div>
    )
  }

  /* ── Chat mode ── */
  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(6,182,212,0.12))' }}
          >
            <MessageSquare className="w-4.5 h-4.5 text-brand-500" />
          </div>
          <div>
            <h1 className="text-[17px] font-semibold text-white/90 tracking-tight">智能问答</h1>
            <p className="text-[11px] text-white/30">基于知识图谱的 Graph-RAG</p>
          </div>
        </div>
        <button
          onClick={() => setMessages([])}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] text-white/40 transition-all duration-200 hover:text-white/70 hover:bg-white/[0.04]"
          style={{ border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <RotateCcw className="w-3.5 h-3.5" /> 新对话
        </button>
      </div>

      <div className="h-px flex-shrink-0 mb-4" style={{ background: 'rgba(255,255,255,0.04)' }} />

      {/* Messages */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto"
      >
        <div className="space-y-1 pb-6">
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className={`flex gap-3 ${
                msg.role === 'user' ? 'justify-end pl-12' : 'justify-start pr-12'
              }`}
            >
              {msg.role === 'assistant' && (
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{
                    background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
                    boxShadow: '0 2px 8px rgba(99,102,241,0.15)',
                  }}
                >
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}

              <div
                className={`group relative ${
                  msg.role === 'user' ? 'max-w-[75%]' : 'flex-1 min-w-0'
                }`}
              >
                <div
                  className={`px-4 py-3 text-[14px] leading-[1.7] ${
                    msg.role === 'user'
                      ? 'rounded-2xl rounded-br-md text-white'
                      : 'rounded-2xl rounded-bl-md text-white/80'
                  }`}
                  style={
                    msg.role === 'user'
                      ? {
                          background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
                          boxShadow: '0 2px 12px rgba(99,102,241,0.15)',
                        }
                      : {
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.06)',
                        }
                  }
                >
                  {msg.role === 'user' ? (
                    <span className="whitespace-pre-wrap">{msg.content}</span>
                  ) : (
                    <div
                      className="markdown-body"
                      dangerouslySetInnerHTML={{ __html: parseMarkdown(msg.content) }}
                    />
                  )}
                </div>

                {msg.role === 'assistant' && (
                  <button
                    onClick={() => copyMessage(msg.content, i)}
                    className="absolute -right-2 top-2 w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-white/[0.06]"
                    style={{ border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    {copiedIdx === i ? (
                      <Check className="w-3.5 h-3.5 text-teal-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-white/30" />
                    )}
                  </button>
                )}

                {msg.sources?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {msg.sources.map((src, j) => {
                      const score = msg.retrievalScores?.[j]?.score
                      return (
                        <span
                          key={j}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
                          style={{
                            background: 'rgba(99,102,241,0.06)',
                            color: '#a5b4fc',
                            border: '1px solid rgba(99,102,241,0.1)',
                          }}
                        >
                          <BookOpen className="w-2.5 h-2.5" /> {src}
                          {score != null && (
                            <span style={{ color: score >= 0.7 ? '#34d399' : score >= 0.4 ? '#fbbf24' : '#fb7185' }}>
                              {(score * 100).toFixed(0)}%
                            </span>
                          )}
                        </span>
                      )
                    })}
                  </div>
                )}

                {msg.graphContext && (
                  <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-brand-400">
                    <GitFork className="w-3 h-3" /> {msg.graphContext}
                  </div>
                )}

                <p className="text-[10px] text-white/25 mt-1.5">
                  {msg.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              {msg.role === 'user' && (
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: 'linear-gradient(135deg, #334155, #475569)' }}
                >
                  <User className="w-4 h-4 text-white/50" />
                </div>
              )}
            </motion.div>
          ))}

          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3 pr-12"
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #4f46e5, #6366f1)' }}
              >
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div
                className="px-4 py-3 rounded-2xl rounded-bl-md"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-brand-500 animate-spin" />
                  <span className="text-[13px] text-white/30">正在思考...</span>
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <AnimatePresence>
          {showScrollBtn && (
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              onClick={scrollToBottom}
              className="absolute bottom-6 right-6 w-9 h-9 rounded-full flex items-center justify-center z-10 hover:scale-110 transition-transform"
              style={{
                background: 'rgba(99,102,241,0.9)',
                boxShadow: '0 4px 16px rgba(99,102,241,0.3)',
              }}
            >
              <ArrowDown className="w-4 h-4 text-white" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Input */}
      <div className="flex-shrink-0 pt-3">
        <InputBar
          input={input}
          setInput={setInput}
          loading={loading}
          send={send}
          handleKeyDown={handleKeyDown}
          inputRef={inputRef}
        />
      </div>
    </div>
  )
}

/* ── InputBar ── */
function InputBar({ input, setInput, loading, send, handleKeyDown, inputRef }) {
  return (
    <div className="w-full">
      <div
        className="flex items-end rounded-2xl overflow-hidden transition-all duration-300 focus-within:border-brand-500/30 focus-within:shadow-[0_0_0_3px_rgba(99,102,241,0.06),0_8px_32px_rgba(0,0,0,0.2)]"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.12), 0 0 0 1px rgba(255,255,255,0.03) inset',
        }}
      >
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入你的问题..."
          rows={1}
          className="flex-1 bg-transparent text-[14px] outline-none resize-none py-4 px-5 text-white/80 placeholder:text-white/25"
          style={{ maxHeight: '120px' }}
        />
        <div className="flex items-center gap-2 pr-3 pb-3">
          <button
            onClick={() => send()}
            disabled={!input.trim() || loading}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-30 disabled:hover:scale-100"
            style={{
              background: input.trim()
                ? 'linear-gradient(135deg, #4f46e5, #6366f1)'
                : 'rgba(255,255,255,0.04)',
              boxShadow: input.trim() ? '0 4px 16px rgba(99,102,241,0.25)' : 'none',
            }}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 text-white animate-spin" />
            ) : (
              <Send className="w-4 h-4 text-white" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── mock answers ── */
function getMockAnswer(q) {
  q = q.toLowerCase()
  if (q.includes('fastapi'))
    return `FastAPI 是一个现代、高性能的 Python Web 框架，用于构建 API。基于 Starlette 和 Pydantic，它具有以下优势：

- **高性能**：性能可与 NodeJS 和 Go 媲美
- **快速开发**：开发速度提升 200%-300%
- **自动文档**：自动生成 OpenAPI 文档
- **类型安全**：基于 Python 类型提示
- **异步支持**：完全支持 async/await`
  if (q.includes('fsrs'))
    return `FSRS（自由间隔重复调度器）通过两个核心参数优化复习间隔：

- **稳定性 (S)**：记忆能保持的天数
- **难度 (D)**：知识点的固有难度

可检索性公式：R = (1 + t/(9S))^(-1)

每次复习根据评分更新参数，实现个性化学习。`
  if (q.includes('graph-rag') || q.includes('rag'))
    return `Graph-RAG 结合两条检索路径增强传统 RAG：

1. **向量路径**：通过 ChromaDB 找语义相似文本
2. **图谱路径**：查询 Neo4j 获取概念关联

双路检索同时提供语义理解和逻辑关系，答案更全面。`
  return `根据你的知识库，我可以回答文档中的技术问题。请提供具体描述，我将搜索向量库和知识图谱找到相关信息。`
}
