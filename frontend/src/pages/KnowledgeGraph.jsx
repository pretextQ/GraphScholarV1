import { useState, useEffect, useRef, useCallback } from 'react'
import api from '../api/client'
import { Search, Info, X, Loader2 } from 'lucide-react'

const mockGraph = {
  nodes: [
    { id: '1', name: 'FastAPI', type: '技术', val: 8 },
    { id: '2', name: 'Python', type: '语言', val: 7 },
    { id: '3', name: 'Pydantic', type: '库', val: 5 },
    { id: '4', name: 'Starlette', type: '框架', val: 5 },
    { id: '5', name: 'SQLAlchemy', type: '库', val: 6 },
    { id: '6', name: 'PostgreSQL', type: '数据库', val: 6 },
    { id: '7', name: 'Neo4j', type: '数据库', val: 5 },
    { id: '8', name: 'ChromaDB', type: '数据库', val: 5 },
    { id: '9', name: 'LangChain', type: '框架', val: 6 },
    { id: '10', name: 'FSRS', type: '算法', val: 4 },
    { id: '11', name: 'RAG', type: '概念', val: 6 },
    { id: '12', name: '知识图谱', type: '概念', val: 5 },
    { id: '13', name: '向量检索', type: '概念', val: 5 },
    { id: '14', name: 'Ollama', type: '工具', val: 4 },
    { id: '15', name: 'Embedding', type: '概念', val: 4 },
  ],
  relationships: [
    { source: '1', target: '2' }, { source: '1', target: '3' }, { source: '1', target: '4' },
    { source: '2', target: '5' }, { source: '5', target: '6' }, { source: '9', target: '2' },
    { source: '9', target: '11' }, { source: '11', target: '13' }, { source: '11', target: '12' },
    { source: '12', target: '7' }, { source: '13', target: '8' }, { source: '13', target: '15' },
    { source: '14', target: '2' }, { source: '14', target: '15' }, { source: '10', target: '1' },
    { source: '7', target: '12' }, { source: '8', target: '13' },
  ],
}

const typeColorMap = {
  '技术': '#14b8a6', '语言': '#34d399', '库': '#fbbf24', '框架': '#f472b6',
  '数据库': '#38bdf8', '算法': '#a78bfa', '概念': '#fb923c', '工具': '#818cf8',
}

export default function KnowledgeGraph() {
  const [graph, setGraph] = useState(null)
  const [search, setSearch] = useState('')
  const [selectedNode, setSelectedNode] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadGraph() }, [])

  const loadGraph = async () => {
    setLoading(true)
    try { const res = await api.get('/graph/query?entity_name=all&depth=2'); setGraph(res.data) }
    catch { setGraph(mockGraph) }
    finally { setLoading(false) }
  }

  const handleSearch = async () => {
    if (!search.trim()) { setGraph(mockGraph); return }
    try { const res = await api.get(`/graph/query?entity_name=${search}&depth=2`); setGraph(res.data) }
    catch {
      const filtered = mockGraph.nodes.filter((n) => n.name.toLowerCase().includes(search.toLowerCase()))
      const ids = new Set(filtered.map((n) => n.id))
      setGraph({ nodes: filtered, relationships: mockGraph.relationships.filter((l) => ids.has(String(l.source)) && ids.has(String(l.target))) })
    }
  }

  const getNodeColor = useCallback((node) => typeColorMap[node.type] || '#14b8a6', [])

  if (loading) return (
    <div className="flex items-center justify-center h-full min-h-[60vh]">
      <Loader2 className="w-6 h-6 text-brand-400 animate-spin" />
    </div>
  )

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 lg:mb-6 anim-fade-up gap-4">
        <div>
          <h1 className="text-[20px] lg:text-[22px] font-semibold text-white/90 tracking-tight">知识图谱</h1>
          <p className="text-[12px] lg:text-[13px] text-white/35 mt-1">探索概念之间的关联网络</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="搜索实体..." className="input-field pl-10 w-full sm:w-60 text-[13px]" />
          </div>
          <button onClick={handleSearch} className="btn-glow px-4 py-2.5 text-[13px] flex-shrink-0">搜索</button>
        </div>
      </div>

      <div className="flex-1 relative rounded-2xl overflow-hidden glass anim-fade-up min-h-[500px]" style={{ animationDelay: '100ms' }}>
        <div className="w-full h-full" style={{ background: 'linear-gradient(180deg, rgba(12,10,30,0.8), rgba(26,20,56,0.6))' }}>
          {graph && <GraphCanvas graph={graph} getNodeColor={getNodeColor} onNodeClick={setSelectedNode} />}
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 glass px-4 py-3 rounded-xl">
          <p className="text-[10px] text-white/30 mb-2 font-semibold uppercase tracking-wider">节点类型</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
            {Object.entries(typeColorMap).map(([type, color]) => (
              <div key={type} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                <span className="text-[10px] text-white/50">{type}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute top-4 right-4 glass px-3 py-2 rounded-lg text-[11px] text-white/40">
          {graph?.nodes?.length || 0} 节点 · {graph?.relationships?.length || 0} 关系
        </div>
      </div>

      {/* Detail Panel */}
      {selectedNode && (() => {
        const relatedRels = (graph?.relationships || []).filter(
          (l) => String(l.source) === String(selectedNode.id) || String(l.target) === String(selectedNode.id)
        )
        const relatedNodes = relatedRels.map((l) => {
          const isSource = String(l.source) === String(selectedNode.id)
          return {
            name: isSource ? l.target : l.source,
            relation: l.type || 'related_to',
            direction: isSource ? '→' : '←',
          }
        })
        return (
          <div className="fixed right-0 top-0 h-screen w-80 z-50 anim-fade-right overflow-y-auto"
            style={{ background: 'rgba(12,10,30,0.98)', borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
            <button onClick={() => setSelectedNode(null)}
              className="absolute top-5 right-5 p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white/70 transition-colors z-10">
              <X className="w-4 h-4" />
            </button>
            <div className="p-6 pt-20">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{ background: getNodeColor(selectedNode) + '15' }}>
                <Info className="w-5 h-5" style={{ color: getNodeColor(selectedNode) }} />
              </div>
              <h3 className="text-xl font-bold text-white/90">{selectedNode.name}</h3>
              <span className="inline-block mt-1 px-2 py-0.5 rounded text-[11px] font-medium"
                style={{ background: getNodeColor(selectedNode) + '18', color: getNodeColor(selectedNode) }}>
                {selectedNode.type}
              </span>

              {/* 统计 */}
              <div className="mt-5 flex gap-3">
                <div className="flex-1 px-3 py-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p className="text-[10px] text-white/30 mb-0.5">关联数</p>
                  <p className="text-[18px] font-bold text-white/80">{relatedRels.length}</p>
                </div>
                <div className="flex-1 px-3 py-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p className="text-[10px] text-white/30 mb-0.5">关系类型</p>
                  <p className="text-[18px] font-bold text-white/80">{new Set(relatedRels.map(r => r.type)).size}</p>
                </div>
              </div>

              {/* 关联节点列表 */}
              {relatedNodes.length > 0 && (
                <div className="mt-5">
                  <p className="text-[11px] text-white/30 font-semibold uppercase tracking-wider mb-3">关联节点</p>
                  <div className="space-y-1.5">
                    {relatedNodes.map((rn, i) => (
                      <div key={i}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-colors hover:bg-white/[0.04]"
                        onClick={() => {
                          const target = graph?.nodes?.find(n => String(n.id) === String(rn.name))
                          if (target) setSelectedNode(target)
                        }}>
                        <span className="text-[11px] text-white/20 w-4 text-center font-mono">{rn.direction}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] text-white/70 truncate">{rn.name}</p>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded text-white/30 flex-shrink-0"
                          style={{ background: 'rgba(99,102,241,0.08)' }}>
                          {rn.relation}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      })()}
    </div>
  )
}

function GraphCanvas({ graph, getNodeColor, onNodeClick }) {
  const canvasRef = useRef(null)
  const animRef = useRef(null)
  const dragRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const rect = canvas.parentElement.getBoundingClientRect()
    canvas.width = rect.width; canvas.height = rect.height
    const w = canvas.width, h = canvas.height, cx = w / 2, cy = h / 2

    const nodes = graph.nodes.map((n, i) => {
      const angle = (i / graph.nodes.length) * Math.PI * 2
      const r = 160 + Math.random() * 100
      return { ...n, x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r, vx: 0, vy: 0 }
    })
    const links = graph.relationships.map((l) => ({
      ...l,
      sourceNode: nodes.find((n) => String(n.id) === String(l.source)),
      targetNode: nodes.find((n) => String(n.id) === String(l.target)),
    }))

    function tick() {
      nodes.forEach((n) => { n.vx += (cx - n.x) * 0.0008; n.vy += (cy - n.y) * 0.0008 })
      links.forEach((l) => {
        if (!l.sourceNode || !l.targetNode) return
        const dx = l.targetNode.x - l.sourceNode.x, dy = l.targetNode.y - l.sourceNode.y
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        const force = (dist - 130) * 0.004
        l.sourceNode.vx += (dx / dist) * force; l.sourceNode.vy += (dy / dist) * force
        l.targetNode.vx -= (dx / dist) * force; l.targetNode.vy -= (dy / dist) * force
      })
      for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[j].x - nodes[i].x, dy = nodes[j].y - nodes[i].y
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        const f = 600 / (dist * dist)
        nodes[i].vx -= (dx / dist) * f; nodes[i].vy -= (dy / dist) * f
        nodes[j].vx += (dx / dist) * f; nodes[j].vy += (dy / dist) * f
      }
      nodes.forEach((n) => {
        if (dragRef.current === n) return
        n.vx *= 0.82; n.vy *= 0.82; n.x += n.vx; n.y += n.vy
        n.x = Math.max(50, Math.min(w - 50, n.x)); n.y = Math.max(50, Math.min(h - 50, n.y))
      })
    }

    function draw() {
      ctx.clearRect(0, 0, w, h)
      links.forEach((l) => {
        if (!l.sourceNode || !l.targetNode) return
        const sx = l.sourceNode.x, sy = l.sourceNode.y
        const tx = l.targetNode.x, ty = l.targetNode.y
        // 渐变连线：两端亮中间暗
        const grad = ctx.createLinearGradient(sx, sy, tx, ty)
        grad.addColorStop(0, 'rgba(20,184,166,0.35)')
        grad.addColorStop(0.5, 'rgba(99,102,241,0.15)')
        grad.addColorStop(1, 'rgba(20,184,166,0.35)')
        ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(tx, ty)
        ctx.strokeStyle = grad; ctx.lineWidth = 1.5; ctx.stroke()
      })
      nodes.forEach((n) => {
        const color = getNodeColor(n), r = 6 + (n.val || 3) * 1.8
        const grad = ctx.createRadialGradient(n.x, n.y, r, n.x, n.y, r + 12)
        grad.addColorStop(0, color + '18'); grad.addColorStop(1, 'transparent')
        ctx.beginPath(); ctx.arc(n.x, n.y, r + 12, 0, Math.PI * 2); ctx.fillStyle = grad; ctx.fill()
        ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, Math.PI * 2)
        ctx.fillStyle = color; ctx.fill()
        ctx.beginPath(); ctx.arc(n.x - r * 0.3, n.y - r * 0.3, r * 0.35, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fill()
        ctx.fillStyle = '#94a3b8'; ctx.font = '11px Outfit, sans-serif'; ctx.textAlign = 'center'
        ctx.fillText(n.name, n.x, n.y + r + 16)
      })
    }

    function animate() { tick(); draw(); animRef.current = requestAnimationFrame(animate) }
    animate()

    const getNode = (mx, my) => nodes.find((n) => Math.sqrt((n.x - mx) ** 2 + (n.y - my) ** 2) < 22)
    let mouseDownPos = null
    const onDown = (e) => { const r2 = canvas.getBoundingClientRect(); const mx = e.clientX - r2.left, my = e.clientY - r2.top; const n = getNode(mx, my); if (n) { dragRef.current = n; mouseDownPos = { x: mx, y: my } } }
    const onMove = (e) => { if (dragRef.current) { const r2 = canvas.getBoundingClientRect(); dragRef.current.x = e.clientX - r2.left; dragRef.current.y = e.clientY - r2.top; dragRef.current.vx = 0; dragRef.current.vy = 0 } }
    const onUp = (e) => {
      if (dragRef.current && mouseDownPos) { const r2 = canvas.getBoundingClientRect(); const mx = e.clientX - r2.left, my = e.clientY - r2.top; const m = Math.abs(mouseDownPos.x - mx) + Math.abs(mouseDownPos.y - my); if (m < 5) onNodeClick?.(dragRef.current) }
      dragRef.current = null; mouseDownPos = null
    }
    canvas.addEventListener('mousedown', onDown); canvas.addEventListener('mousemove', onMove); canvas.addEventListener('mouseup', onUp)
    return () => { cancelAnimationFrame(animRef.current); canvas.removeEventListener('mousedown', onDown); canvas.removeEventListener('mousemove', onMove); canvas.removeEventListener('mouseup', onUp) }
  }, [graph, getNodeColor, onNodeClick])

  return <canvas ref={canvasRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
}
