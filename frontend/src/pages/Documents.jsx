import { useState, useRef, useCallback } from 'react'
import api from '../api/client'
import { Upload, FileText, File, CheckCircle2, Loader2, AlertCircle, X, CloudUpload, FileCode, Zap } from 'lucide-react'

export default function Documents() {
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [uploadResult, setUploadResult] = useState(null)
  const fileInputRef = useRef(null)

  const handleDragOver = useCallback((e) => { e.preventDefault(); setDragOver(true) }, [])
  const handleDragLeave = useCallback((e) => { e.preventDefault(); setDragOver(false) }, [])
  const handleDrop = useCallback((e) => {
    e.preventDefault(); setDragOver(false)
    addFiles(Array.from(e.dataTransfer.files))
  }, [])

  const handleFileSelect = (e) => addFiles(Array.from(e.target.files))

  const addFiles = (newFiles) => {
    const valid = newFiles.filter((f) => ['pdf', 'md', 'txt'].includes(f.name.split('.').pop().toLowerCase()))
    setFiles((prev) => [...prev, ...valid.map((f) => ({
      file: f, id: Math.random().toString(36).slice(2), name: f.name,
      size: f.size < 1048576 ? (f.size / 1024).toFixed(1) + ' KB' : (f.size / 1048576).toFixed(1) + ' MB',
      type: f.name.split('.').pop().toUpperCase(), status: 'pending',
    }))])
  }

  const removeFile = (id) => setFiles((prev) => prev.filter((f) => f.id !== id))

  const uploadFiles = async () => {
    setUploading(true); setUploadResult(null)
    let success = 0, fail = 0
    for (const f of files) {
      if (f.status === 'done') continue
      setFiles((prev) => prev.map((item) => item.id === f.id ? { ...item, status: 'uploading' } : item))
      try {
        const formData = new FormData(); formData.append('file', f.file)
        await api.post('/document/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 120000 })
        setFiles((prev) => prev.map((item) => item.id === f.id ? { ...item, status: 'done' } : item)); success++
      } catch {
        setFiles((prev) => prev.map((item) => item.id === f.id ? { ...item, status: 'error' } : item)); fail++
      }
    }
    setUploading(false); setUploadResult({ success, fail })
  }

  const statusIcon = {
    pending: <File className="w-4 h-4 text-white/30" />,
    uploading: <Loader2 className="w-4 h-4 text-brand-400 animate-spin" />,
    done: <CheckCircle2 className="w-4 h-4 text-teal-400" />,
    error: <AlertCircle className="w-4 h-4 text-rose-400" />,
  }
  const typeBadge = { PDF: 'bg-rose-500/10 text-rose-400', MD: 'bg-sky-500/10 text-sky-400', TXT: 'bg-brand-500/10 text-brand-400' }

  return (
    <div className="flex flex-col">
      <div className="mb-6 lg:mb-8">
        <h1 className="text-[20px] lg:text-[22px] font-semibold text-white/90 tracking-tight">文档管理</h1>
        <p className="text-[12px] lg:text-[13px] text-white/35 mt-1">上传学习材料，自动构建你的专属知识库。</p>
      </div>

      {/* Upload Area */}
      <div
        onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className="relative rounded-2xl h-[180px] lg:h-[220px] flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-400"
        style={{
          background: dragOver ? 'rgba(16,185,129,0.05)' : 'rgba(255,255,255,0.015)',
          border: `2px dashed ${dragOver ? '#10b981' : 'rgba(255,255,255,0.06)'}`,
          transform: dragOver ? 'scale(1.01)' : 'none',
        }}
      >
        <input ref={fileInputRef} type="file" accept=".pdf,.md,.txt" multiple onChange={handleFileSelect} className="hidden" />
        <CloudUpload className="w-10 h-10 lg:w-12 lg:h-12 mx-auto mb-4 text-teal-400" />
        <h3 className="text-[16px] lg:text-[18px] font-semibold mb-1.5 text-white/75">
          {dragOver ? '松开即可上传' : '拖拽文件到此处'}
        </h3>
        <p className="text-[12px] lg:text-[13px] text-white/35">支持 PDF、Markdown、TXT 格式</p>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-6 anim-fade-up">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[13px] text-white/50 font-medium">已选择 {files.length} 个文件</span>
            <button onClick={uploadFiles} disabled={uploading || files.every((f) => f.status === 'done')}
              className="btn-glow px-5 py-2.5 text-[13px] flex items-center gap-2">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {uploading ? '上传中...' : '全部上传'}
            </button>
          </div>
          <div className="space-y-2">
            {files.map((f) => (
              <div key={f.id} className="flex items-center gap-4 p-4 rounded-xl glass anim-fade-right">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-[10px] font-bold ${typeBadge[f.type] || 'bg-white/5 text-white/40'}`}>
                  {f.type}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-white/80 truncate">{f.name}</p>
                  <p className="text-[11px] text-white/35">{f.size}</p>
                </div>
                <div className="flex items-center gap-3">
                  {statusIcon[f.status]}
                  {f.status === 'pending' && (
                    <button onClick={(e) => { e.stopPropagation(); removeFile(f.id) }}
                      className="p-1.5 rounded-lg hover:bg-rose-500/10 text-white/30 hover:text-rose-400 transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Result */}
      {uploadResult && (
        <div className={`mt-5 px-4 py-3 rounded-xl text-[13px] flex items-center gap-2 anim-scale-in ${
          uploadResult.fail > 0 ? 'bg-rose-500/8 border border-rose-500/20 text-rose-400' : 'bg-teal-500/8 border border-teal-500/20 text-teal-400'
        }`}>
          {uploadResult.fail > 0 ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          {uploadResult.success} 个文件上传成功{uploadResult.fail > 0 && `，${uploadResult.fail} 个失败`}
        </div>
      )}

      {/* Feature Cards */}
      <div className="mt-8 grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
        {[
          { icon: FileText, title: 'PDF 解析', desc: '从论文和书籍提取文本' },
          { icon: FileCode, title: 'Markdown', desc: '导入笔记和文档' },
          { icon: Zap, title: '自动向量化', desc: '分块 + 嵌入一步到位' },
        ].map(({ icon: Icon, title, desc }, i) => (
          <div
            key={title}
            className="glass p-4 anim-fade-up hover:scale-[1.02] transition-all duration-300 cursor-pointer"
            style={{ animationDelay: `${300 + i * 80}ms` }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
              style={{ background: 'rgba(16,185,129,0.1)' }}>
              <Icon className="w-5 h-5 text-teal-400" />
            </div>
            <h4 className="text-[13px] font-semibold text-white/80">{title}</h4>
            <p className="text-[11px] mt-0.5 text-white/40">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
