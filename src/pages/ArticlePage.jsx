import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CheckCircle2, RotateCcw, XCircle, Clock, FileText,
  Loader2, AlertCircle, RefreshCw, ExternalLink, History,
  ClipboardList, UserCheck, BarChart2,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import { articlesApi, session } from '../lib/api'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CONTENT_TYPE_LABEL = {
  ARTIKEL: 'Artikel', OPINION: 'Opini', VIGNETTE: 'Vignette', CERITA: 'Cerita',
}

const CONTENT_TYPE_STYLE = {
  ARTIKEL:  { bg: 'bg-forest/10', text: 'text-forest', border: 'border-forest/20' },
  OPINION:  { bg: 'bg-clay/10',   text: 'text-clay',   border: 'border-clay/20'   },
  VIGNETTE: { bg: 'bg-sienna/10', text: 'text-sienna', border: 'border-sienna/20' },
  CERITA:   { bg: 'bg-moss/10',   text: 'text-moss',   border: 'border-moss/20'   },
}

const HISTORY_STATUS_STYLE = {
  PUBLISHED: { label: 'Diterbitkan',  bg: 'bg-moss/10',   text: 'text-moss',   border: 'border-moss/20'   },
  REVISION:  { label: 'Perlu Revisi', bg: 'bg-clay/10',   text: 'text-clay',   border: 'border-clay/20'   },
  REJECTED:  { label: 'Ditolak',      bg: 'bg-sand',      text: 'text-ash',    border: 'border-sand'      },
}

function getInitials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function CardSkeleton() {
  return (
    <div className="bg-white rounded-card border border-sand p-5 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-9 h-9 rounded-full bg-sand flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-sand rounded w-16" />
          <div className="h-5 bg-sand rounded w-3/4" />
          <div className="flex gap-3 pt-1">
            <div className="h-3 bg-sand/60 rounded w-28" />
            <div className="h-3 bg-sand/60 rounded w-20" />
          </div>
        </div>
        <div className="h-8 w-24 bg-sand rounded-lg flex-shrink-0" />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ArticlePage() {
  const navigate   = useNavigate()
  const user       = session.getUser()
  const isReviewer = user?.role === 'ADMIN' || user?.role === 'REVIEWER' || user?.is_staff || user?.is_superuser
  const isAdmin    = user?.role === 'ADMIN' || user?.is_staff || user?.is_superuser

  // ── State ──────────────────────────────────────────────────────────────────
  const [tab, setTab]               = useState('queue')       // 'queue' | 'history'
  const [articles, setArticles]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [history, setHistory]       = useState([])
  const [histLoading, setHistLoading] = useState(false)
  const [histLoaded, setHistLoaded] = useState(false)

  // Claim: local set of article IDs this reviewer has claimed in this session.
  // A proper backend /claim/ endpoint would persist this to DB (prevents double review).
  const [claimedIds, setClaimedIds] = useState(new Set())

  // Per-article review form state keyed by article ID
  const [notes, setNotes]           = useState({})       // { [id]: string }
  const [reviewing, setReviewing]   = useState(null)     // id being submitted
  const [errors, setErrors]         = useState({})       // { [id]: string }
  const [successMsg, setSuccessMsg] = useState('')

  // Confirmation modal
  const [confirmAction, setConfirmAction]   = useState(null) // { articleId, action }
  const [modalNote, setModalNote]           = useState('')
  const [modalNoteError, setModalNoteError] = useState('')

  // ── Guards & initial load ──────────────────────────────────────────────────
  useEffect(() => {
    if (!session.getAccess()) { navigate('/login', { replace: true }); return }
    if (!isReviewer)          { navigate('/home',  { replace: true }); return }
    loadQueue()
  }, [])

  // ── Helpers ────────────────────────────────────────────────────────────────
  const loadQueue = async () => {
    setLoading(true)
    const { ok, data } = await articlesApi.reviewQueue()
    if (ok) setArticles(Array.isArray(data) ? data : (data.results ?? []))
    setLoading(false)
  }

  const loadHistory = async () => {
    if (histLoaded) return
    setHistLoading(true)
    const { ok, data } = await articlesApi.reviewHistory()
    if (ok) {
      const all = Array.isArray(data) ? data : (data.results ?? [])
      setHistory(all.filter(a => ['PUBLISHED', 'REVISION', 'REJECTED'].includes(a.status)))
    }
    setHistLoaded(true)
    setHistLoading(false)
  }

  const handleTabChange = (t) => {
    setTab(t)
    if (t === 'history' && !histLoaded) loadHistory()
  }

  const claim = (id) => setClaimedIds(prev => new Set([...prev, id]))
  const unclaim = (id) => {
    setClaimedIds(prev => { const s = new Set(prev); s.delete(id); return s })
    setNotes(prev => { const n = { ...prev }; delete n[id]; return n })
    setErrors(prev => { const e = { ...prev }; delete e[id]; return e })
  }

  const openConfirm = (articleId, action) => {
    setModalNote(notes[articleId] ?? '')
    setModalNoteError('')
    setConfirmAction({ articleId, action })
  }

  const closeConfirm = () => {
    setConfirmAction(null)
    setModalNote('')
    setModalNoteError('')
  }

  const handleConfirmedReview = async () => {
    const { articleId, action } = confirmAction
    const needsNote = action === 'REVISION' || action === 'REJECT'
    if (needsNote && !modalNote.trim()) {
      setModalNoteError('Catatan reviewer wajib diisi untuk revisi atau penolakan.')
      return
    }
    closeConfirm()
    await handleReview(articleId, action, modalNote)
  }

  const handleReview = async (articleId, action, noteOverride) => {
    const note = noteOverride ?? notes[articleId] ?? ''
    if ((action === 'REVISION' || action === 'REJECT') && !note.trim()) {
      setErrors(prev => ({ ...prev, [articleId]: 'Catatan reviewer wajib diisi untuk revisi atau penolakan.' }))
      return
    }
    setReviewing(articleId)
    setErrors(prev => ({ ...prev, [articleId]: '' }))
    const { ok, data } = await articlesApi.review(articleId, action, note)
    if (ok) {
      setArticles(prev => prev.filter(a => a.id !== articleId))
      unclaim(articleId)
      const labels = { PUBLISH: 'diterbitkan', REVISION: 'dikembalikan untuk revisi', REJECT: 'ditolak' }
      setSuccessMsg(`Artikel berhasil ${labels[action] ?? 'diproses'}.`)
      setTimeout(() => setSuccessMsg(''), 4000)
    } else {
      setErrors(prev => ({
        ...prev,
        [articleId]: data?.error ?? data?.errors?.action?.[0] ?? data?.detail ?? 'Gagal memproses review.',
      }))
    }
    setReviewing(null)
  }

  // ── Derived ────────────────────────────────────────────────────────────────
  const claimedCount = [...claimedIds].filter(id => articles.some(a => a.id === id)).length

  const histStats = {
    total:     history.length,
    published: history.filter(a => a.status === 'PUBLISHED').length,
    revision:  history.filter(a => a.status === 'REVISION').length,
    rejected:  history.filter(a => a.status === 'REJECTED').length,
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-bone">
      <Navbar />

      <main className="pt-16">
        <div className="max-w-content mx-auto px-6 lg:px-12 py-8 md:py-12">

          {/* ── Header ────────────────────────────────────────────── */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-3">
              <div className="h-px w-8 bg-clay/50" />
              <span className="tag">Editorial</span>
            </div>
            <div className="flex items-end justify-between gap-4 flex-wrap">
              <div>
                <h1 className="font-serif text-h1 font-semibold text-ink leading-tight">
                  Antrian{' '}
                  <em className="font-accent italic text-clay">Review Artikel</em>
                </h1>
                <p className="font-sans text-body text-ash mt-1">
                  Klaim artikel, tinjau isinya, lalu berikan keputusan editorial.
                </p>
              </div>
              <button
                onClick={loadQueue}
                className="flex items-center gap-1.5 p-2 rounded-lg border border-sand bg-white text-ash
                  hover:text-forest hover:border-forest/40 transition-all duration-[240ms] flex-shrink-0"
                title="Muat ulang antrian"
              >
                <RefreshCw size={15} />
              </button>
            </div>
          </div>

          {/* ── Stats bar ─────────────────────────────────────────── */}
          {!loading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
              <div className="bg-white rounded-card border border-sand shadow-subtle px-5 py-4">
                <div className="flex items-center gap-2 mb-1">
                  <ClipboardList size={13} className="text-ash/50" />
                  <span className="font-sans text-caption text-ash uppercase tracking-widest">Antrian</span>
                </div>
                <span className="font-serif text-display font-semibold text-forest font-tabular leading-none">
                  {articles.length}
                </span>
              </div>
              {isAdmin && (
                <div className="bg-white rounded-card border border-sand shadow-subtle px-5 py-4">
                  <div className="flex items-center gap-2 mb-1">
                    <BarChart2 size={13} className="text-ash/50" />
                    <span className="font-sans text-caption text-ash uppercase tracking-widest">Riwayat</span>
                  </div>
                  <span className="font-serif text-display font-semibold text-moss font-tabular leading-none">
                    {histLoaded ? histStats.total : '—'}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ── Success flash ─────────────────────────────────────── */}
          {successMsg && (
            <div className="flex items-center gap-3 bg-moss/10 border border-moss/25 rounded-lg px-4 py-3 mb-6">
              <CheckCircle2 size={15} className="text-moss flex-shrink-0" />
              <p className="font-sans text-sm text-moss">{successMsg}</p>
            </div>
          )}

          {/* ── Tabs ──────────────────────────────────────────────── */}
          <div className="flex gap-1 p-1 bg-sand/30 rounded-lg border border-sand w-fit mb-8">
            {[
              { key: 'queue',   label: 'Antrian',  icon: ClipboardList },
              isAdmin && { key: 'history', label: 'Riwayat',  icon: History },
            ].filter(Boolean).map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => handleTabChange(key)}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md font-sans text-sm font-medium transition-all duration-[240ms] ${
                  tab === key ? 'bg-white text-forest shadow-subtle' : 'text-ash hover:text-ink'
                }`}
              >
                <Icon size={13} />
                {label}
              </button>
            ))}
          </div>

          {/* ════════════════════════════════════════════════════════ */}
          {/* ANTRIAN TAB                                             */}
          {/* ════════════════════════════════════════════════════════ */}
          {tab === 'queue' && (
            <>
              {loading ? (
                <div className="flex flex-col gap-3">
                  {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
                </div>
              ) : articles.length === 0 ? (
                <div className="bg-white rounded-card border border-sand shadow-subtle px-8 py-16 text-center">
                  <CheckCircle2 size={36} className="text-moss/40 mx-auto mb-4" />
                  <p className="font-serif text-h3 font-semibold text-ink mb-2">Antrian kosong</p>
                  <p className="font-sans text-body text-ash">
                    Tidak ada artikel yang menunggu review saat ini.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {articles.map(article => {
                    const isClaimed   = claimedIds.has(article.id)
                    const isReviewing = reviewing === article.id
                    const style       = CONTENT_TYPE_STYLE[article.content_type] ?? CONTENT_TYPE_STYLE['ARTIKEL']
                    const label       = CONTENT_TYPE_LABEL[article.content_type]  ?? article.content_type
                    const initials    = getInitials(article.author?.full_name)
                    const note        = notes[article.id] ?? ''
                    const error       = errors[article.id] ?? ''
                    const waitDisplay = article.waiting_since?.display ?? '—'

                    return (
                      <div key={article.id} className="bg-white rounded-card border border-sand shadow-subtle overflow-hidden">

                        {/* ── Article summary row ────────────────── */}
                        <div className="p-5 flex items-start gap-4">
                          {/* Avatar */}
                          {article.author?.photo_url ? (
                            <img src={article.author.photo_url} alt={article.author.full_name}
                              className="w-9 h-9 rounded-full object-cover flex-shrink-0 mt-0.5" />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-forest/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="font-serif font-semibold text-[0.6rem] text-forest leading-none">
                                {initials}
                              </span>
                            </div>
                          )}

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              <span className={`tag text-[0.6rem] py-0.5 ${style.bg} ${style.text} border ${style.border}`}>
                                {label}
                              </span>
                            </div>
                            <h3 className="font-serif text-h3 font-semibold text-ink leading-snug line-clamp-1 mb-1">
                              {article.title}
                            </h3>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
                              <span className="font-sans text-caption text-ash">
                                {article.author?.full_name ?? '—'}
                              </span>
                              <span className="text-ash/30">·</span>
                              <span className="flex items-center gap-1 font-sans text-caption text-ash">
                                <Clock size={10} className="flex-shrink-0" />
                                {waitDisplay}
                              </span>
                              {(article.original_file_url || article.pdf_url) && (
                                <>
                                  <span className="text-ash/30">·</span>
                                  <span className="flex items-center gap-1 font-sans text-caption text-ash">
                                    <FileText size={10} className="flex-shrink-0" />
                                    Dokumen tersedia
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Claim / unclaim button */}
                          {isClaimed ? (
                            <button
                              onClick={() => unclaim(article.id)}
                              className="flex-shrink-0 px-3 py-1.5 rounded-lg font-sans text-sm font-medium border
                                border-sand text-ash hover:border-clay/40 hover:text-clay
                                transition-all duration-[240ms]"
                            >
                              Tutup
                            </button>
                          ) : (
                            <button
                              onClick={() => claim(article.id)}
                              className="flex-shrink-0 px-3 py-1.5 rounded-lg font-sans text-sm font-medium border
                                border-forest/40 text-forest bg-white hover:bg-forest hover:text-bone
                                transition-all duration-[240ms]"
                            >
                              Review
                            </button>
                          )}
                        </div>

                        {/* ── Review panel (only when claimed) ───── */}
                        {isClaimed && (
                          <div className="border-t border-sand bg-sand/10 p-5 flex flex-col gap-4">

                            {/* Abstract */}
                            {article.abstract && (
                              <div className="p-4 bg-white rounded-lg border border-sand">
                                <p className="font-sans text-[0.65rem] uppercase tracking-widest text-ash/60 mb-2">
                                  Abstrak
                                </p>
                                <p className="font-sans italic text-body text-ash/80 leading-relaxed">
                                  {article.abstract}
                                </p>
                              </div>
                            )}

                            {/* Article metadata */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              {[
                                { label: 'Diunggah',    value: formatDate(article.created_at)      },
                                { label: 'Penulis',     value: article.author?.full_name ?? '—'    },
                                { label: 'Kontributor', value: article.contributors?.length ?? 0   },
                              ].map(({ label, value }) => (
                                <div key={label} className="bg-white rounded-lg border border-sand px-3 py-2">
                                  <p className="font-sans text-[0.6rem] uppercase tracking-widest text-ash/60 mb-0.5">{label}</p>
                                  <p className="font-sans text-sm text-ink font-medium truncate">{String(value)}</p>
                                </div>
                              ))}

                              {/* File download */}
                              <div className="bg-white rounded-lg border border-sand px-3 py-2">
                                <p className="font-sans text-[0.6rem] uppercase tracking-widest text-ash/60 mb-1">
                                  Unduh File
                                </p>
                                {article.original_file_url ? (
                                  <a
                                    href={article.original_file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 font-sans text-sm font-medium text-forest
                                      hover:text-clay transition-colors duration-[240ms] truncate"
                                    title={article.original_file_url}
                                  >
                                    <FileText size={12} className="flex-shrink-0" />
                                    {article.original_file_type ?? 'File'}
                                    <ExternalLink size={10} className="text-ash/40 flex-shrink-0" />
                                  </a>
                                ) : (
                                  <p className="font-sans text-sm text-ash/40 italic">Tidak ada file</p>
                                )}
                              </div>
                            </div>

                            {/* Reviewer note */}
                            <div>
                              <label className="font-sans text-caption uppercase tracking-widest text-ash font-medium block mb-1.5">
                                Catatan Reviewer
                                <span className="normal-case ml-1 text-ash/50">(wajib untuk Revisi &amp; Tolak)</span>
                              </label>
                              <textarea
                                value={note}
                                onChange={e => {
                                  setNotes(prev => ({ ...prev, [article.id]: e.target.value }))
                                  if (errors[article.id]) setErrors(prev => ({ ...prev, [article.id]: '' }))
                                }}
                                placeholder="Tuliskan catatan yang akan dikirim ke penulis…"
                                rows={3}
                                className="w-full bg-white border border-sand rounded-lg px-4 py-3 font-sans text-sm text-ink
                                  placeholder:text-ash/40 outline-none focus:border-forest focus:ring-2 focus:ring-forest/15
                                  transition-all duration-[240ms] resize-none"
                              />
                            </div>

                            {/* Error */}
                            {error && (
                              <div className="flex items-start gap-2">
                                <AlertCircle size={14} className="text-clay flex-shrink-0 mt-0.5" />
                                <p className="font-sans text-caption text-clay">{error}</p>
                              </div>
                            )}

                            {/* Action buttons */}
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                              <button
                                onClick={() => openConfirm(article.id, 'PUBLISH')}
                                disabled={!!reviewing}
                                className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg font-sans text-sm font-medium
                                  bg-moss text-bone hover:bg-moss/90 disabled:opacity-50 disabled:cursor-not-allowed
                                  transition-all duration-[240ms]"
                              >
                                {isReviewing ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                                Terbitkan
                              </button>

                              <button
                                onClick={() => openConfirm(article.id, 'REVISION')}
                                disabled={!!reviewing}
                                className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg font-sans text-sm font-medium
                                  bg-clay/15 text-clay border border-clay/30 hover:bg-clay/25
                                  disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-[240ms]"
                              >
                                {isReviewing ? <Loader2 size={13} className="animate-spin" /> : <RotateCcw size={13} />}
                                Minta Revisi
                              </button>

                              <button
                                onClick={() => openConfirm(article.id, 'REJECT')}
                                disabled={!!reviewing}
                                className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg font-sans text-sm font-medium
                                  bg-sand text-ash border border-sand/80 hover:bg-ash/10 hover:text-ink
                                  disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-[240ms]"
                              >
                                {isReviewing ? <Loader2 size={13} className="animate-spin" /> : <XCircle size={13} />}
                                Tolak
                              </button>

                              <p className="font-sans text-[0.65rem] text-ash/50 ml-1">
                                Revisi &amp; Tolak wajib disertai catatan
                              </p>
                            </div>

                          </div>
                        )}

                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}

          {/* ════════════════════════════════════════════════════════ */}
          {/* RIWAYAT TAB                                             */}
          {/* ════════════════════════════════════════════════════════ */}
          {tab === 'history' && (
            <>
              {!isAdmin ? (
                <div className="bg-white rounded-card border border-sand shadow-subtle px-8 py-12 text-center">
                  <History size={32} className="text-ash/30 mx-auto mb-4" />
                  <p className="font-serif text-h3 font-semibold text-ink mb-2">Riwayat Admin Only</p>
                  <p className="font-sans text-body text-ash max-w-xs mx-auto leading-relaxed">
                    Halaman riwayat saat ini hanya tersedia untuk Admin.
                    Endpoint reviewer history akan ditambahkan oleh tim backend.
                  </p>
                </div>
              ) : histLoading ? (
                <div className="flex flex-col gap-3">
                  {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
                </div>
              ) : (
                <>
                  {/* Stats grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                    {[
                      { label: 'Total Diproses',  value: histStats.total,     color: 'text-ink'    },
                      { label: 'Diterbitkan',     value: histStats.published, color: 'text-moss'   },
                      { label: 'Revisi',          value: histStats.revision,  color: 'text-clay'   },
                      { label: 'Ditolak',         value: histStats.rejected,  color: 'text-ash'    },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="bg-white rounded-card border border-sand shadow-subtle px-5 py-4">
                        <p className="font-sans text-caption text-ash uppercase tracking-widest mb-1">{label}</p>
                        <span className={`font-serif text-display font-semibold font-tabular leading-none ${color}`}>
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>

                  {history.length === 0 ? (
                    <div className="bg-white rounded-card border border-sand shadow-subtle px-8 py-12 text-center">
                      <History size={32} className="text-ash/30 mx-auto mb-4" />
                      <p className="font-serif text-h3 font-semibold text-ink mb-2">Belum ada riwayat</p>
                      <p className="font-sans text-body text-ash">Artikel yang sudah diproses akan muncul di sini.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {history.map(article => {
                        const statusCfg = HISTORY_STATUS_STYLE[article.status] ?? HISTORY_STATUS_STYLE['REJECTED']
                        const style     = CONTENT_TYPE_STYLE[article.content_type] ?? CONTENT_TYPE_STYLE['ARTIKEL']
                        const label     = CONTENT_TYPE_LABEL[article.content_type]  ?? article.content_type
                        const initials  = getInitials(article.author?.full_name)

                        return (
                          <div key={article.id} className="bg-white rounded-card border border-sand shadow-subtle p-5 flex items-start gap-4">
                            {article.author?.photo_url ? (
                              <img src={article.author.photo_url} alt={article.author.full_name}
                                className="w-9 h-9 rounded-full object-cover flex-shrink-0 mt-0.5" />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-forest/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="font-serif font-semibold text-[0.6rem] text-forest leading-none">{initials}</span>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                <span className={`tag text-[0.6rem] py-0.5 ${style.bg} ${style.text} border ${style.border}`}>
                                  {label}
                                </span>
                                <span className={`tag text-[0.6rem] py-0.5 ${statusCfg.bg} ${statusCfg.text} border ${statusCfg.border}`}>
                                  {statusCfg.label}
                                </span>
                              </div>
                              <h3 className="font-serif text-h3 font-semibold text-ink leading-snug line-clamp-1 mb-1">
                                {article.title}
                              </h3>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
                                <span className="font-sans text-caption text-ash">{article.author?.full_name ?? '—'}</span>
                                {article.reviewed_at && (
                                  <>
                                    <span className="text-ash/30">·</span>
                                    <span className="font-sans text-caption text-ash">
                                      Diproses {formatDate(article.reviewed_at)}
                                    </span>
                                  </>
                                )}
                              </div>
                              {article.reviewer_note && (
                                <p className="font-sans text-caption text-ash/70 mt-1.5 line-clamp-2 italic">
                                  "{article.reviewer_note}"
                                </p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </>
              )}
            </>
          )}

        </div>
      </main>

      {/* ── Review confirmation modal ────────────────────────────────────── */}
      {confirmAction && (() => {
        const article = articles.find(a => a.id === confirmAction.articleId)
        if (!article) return null
        const { action } = confirmAction
        const needsNote  = action === 'REVISION' || action === 'REJECT'
        const style      = CONTENT_TYPE_STYLE[article.content_type] ?? CONTENT_TYPE_STYLE['ARTIKEL']
        const typeLabel  = CONTENT_TYPE_LABEL[article.content_type]  ?? article.content_type
        const isSubmitting = reviewing === confirmAction.articleId

        const ACTION_CFG = {
          PUBLISH:  { heading: 'Terbitkan Artikel?',  btn: 'Terbitkan',    btnCls: 'bg-moss text-bone hover:bg-moss/90' },
          REVISION: { heading: 'Minta Revisi?',       btn: 'Minta Revisi', btnCls: 'bg-clay/15 text-clay border border-clay/30 hover:bg-clay/25' },
          REJECT:   { heading: 'Tolak Artikel?',      btn: 'Tolak',        btnCls: 'bg-sand text-ash border border-sand/80 hover:bg-ash/10 hover:text-ink' },
        }
        const cfg = ACTION_CFG[action]

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/30 backdrop-blur-sm"
            onKeyDown={e => e.key === 'Escape' && !isSubmitting && closeConfirm()}
            tabIndex={-1}
          >
            <div className="bg-white rounded-card border border-sand shadow-elevated w-full max-w-sm">
              <div className="p-6 flex flex-col gap-5">

                {/* Heading */}
                <div>
                  <h2 className="font-serif text-h2 font-semibold text-ink mb-1">{cfg.heading}</h2>
                  {action === 'PUBLISH' && (
                    <p className="font-sans text-caption text-ash">
                      Artikel akan diterbitkan dan dapat diakses oleh publik.
                    </p>
                  )}
                  {action === 'REVISION' && (
                    <p className="font-sans text-caption text-ash">
                      Artikel akan dikembalikan ke penulis dengan catatan revisi.
                    </p>
                  )}
                  {action === 'REJECT' && (
                    <p className="font-sans text-caption text-ash">
                      Artikel akan ditolak dan penulis akan menerima pemberitahuan.
                    </p>
                  )}
                </div>

                {/* Article info */}
                <div className="p-3 bg-bone rounded-lg border border-sand">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`tag text-[0.6rem] py-0.5 ${style.bg} ${style.text} border ${style.border}`}>
                      {typeLabel}
                    </span>
                  </div>
                  <p className="font-serif text-sm font-semibold text-ink leading-snug line-clamp-2 mb-1">
                    {article.title}
                  </p>
                  <p className="font-sans text-caption text-ash">
                    {article.author?.full_name ?? '—'}
                  </p>
                </div>

                {/* Reviewer note — only for REVISION & REJECT */}
                {needsNote && (
                  <div>
                    <label className="font-sans text-caption uppercase tracking-widest text-ash font-medium block mb-1.5">
                      Catatan Reviewer <span className="text-clay normal-case">*</span>
                    </label>
                    <textarea
                      value={modalNote}
                      onChange={e => { setModalNote(e.target.value); setModalNoteError('') }}
                      placeholder="Tuliskan catatan yang akan dikirim ke penulis…"
                      rows={3}
                      className="w-full bg-bone border border-sand rounded-lg px-4 py-3 font-sans text-sm text-ink
                        placeholder:text-ash/40 outline-none focus:border-forest focus:ring-2 focus:ring-forest/15
                        transition-all duration-[240ms] resize-none"
                    />
                    {modalNoteError && (
                      <div className="flex items-start gap-1.5 mt-1.5">
                        <AlertCircle size={12} className="text-clay flex-shrink-0 mt-0.5" />
                        <p className="font-sans text-caption text-clay">{modalNoteError}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Buttons */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={closeConfirm}
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 rounded-lg border border-sand font-sans text-sm font-medium text-ash
                      hover:border-clay/40 hover:text-clay disabled:opacity-50
                      transition-all duration-[240ms]"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmedReview}
                    disabled={isSubmitting}
                    className={`flex-1 py-2.5 rounded-lg font-sans text-sm font-medium
                      disabled:opacity-50 transition-all duration-[240ms]
                      flex items-center justify-center gap-1.5 ${cfg.btnCls}`}
                  >
                    {isSubmitting
                      ? <><Loader2 size={13} className="animate-spin" />Memproses…</>
                      : cfg.btn
                    }
                  </button>
                </div>

              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
