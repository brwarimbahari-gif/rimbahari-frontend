import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Plus, Edit3, Trash2, Eye, Download, RefreshCw, AlertCircle, BookOpen, Compass, FileText, Star } from 'lucide-react'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import { etalaseApi, session } from '../../lib/api'

const CATEGORIES = {
  EZINE_KEHATI:      { label: 'E-zine Kehati',        bg: 'bg-forest/10', text: 'text-forest', border: 'border-forest/20', icon: BookOpen },
  EZINE_ETNOGRAFI:   { label: 'Etnografi Multimedia', bg: 'bg-moss/10',   text: 'text-moss',   border: 'border-moss/20',   icon: Compass  },
  LAPORAN:           { label: 'Laporan Program',      bg: 'bg-clay/10',   text: 'text-clay',   border: 'border-clay/20',   icon: FileText },
  LAINNYA:           { label: 'Lainnya',              bg: 'bg-sand',      text: 'text-ash',    border: 'border-sand',      icon: BookOpen },
}

const BATIK = `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23F5EFE3' fill-opacity='1'%3E%3Cpath d='M30 30l-8-8 8-8 8 8-8 8zm0-16l-8-8 8-8 8 8-8 8zm0 32l-8-8 8-8 8 8-8 8zM14 30l-8-8 8-8 8 8-8 8zm32 0l-8-8 8-8 8 8-8 8z'/%3E%3C/g%3E%3C/svg%3E")`

function RowSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-sand animate-pulse last:border-0">
      <div className="w-16 h-12 bg-sand rounded-lg flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-sand rounded w-3/4" />
        <div className="h-3 bg-sand/60 rounded w-1/3" />
      </div>
      <div className="h-6 w-20 bg-sand rounded flex-shrink-0" />
      <div className="flex gap-2">
        <div className="h-8 w-16 bg-sand rounded-lg" />
        <div className="h-8 w-16 bg-sand rounded-lg" />
      </div>
    </div>
  )
}

export default function DisplayManagementPage() {
  const navigate = useNavigate()
  const user = session.getUser()
  const canManage = user?.role === 'ADMIN' || user?.role === 'MODERATOR' || user?.is_staff || user?.is_superuser

  const [publications, setPublications] = useState([])
  const [loading, setLoading]           = useState(true)
  const [filterType, setFilterType]     = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)  // id of pub being deleted
  const [deleting, setDeleting]         = useState(false)
  const [deleteError, setDeleteError]   = useState('')

  useEffect(() => {
    if (!session.getAccess()) { navigate('/login', { replace: true }); return }
    if (!canManage)           { navigate('/home',  { replace: true }); return }
    load()
  }, [])

  const load = async () => {
    setLoading(true)
    const { ok, data } = await etalaseApi.list({})
    if (ok) setPublications(Array.isArray(data) ? data : (data.results ?? []))
    setLoading(false)
  }

  const handleDelete = async (id) => {
    setDeleting(true); setDeleteError('')
    const { ok, data } = await etalaseApi.delete(id)
    if (ok) {
      setPublications(prev => prev.filter(p => p.id !== id))
      setDeleteTarget(null)
    } else {
      setDeleteError(data?.error ?? data?.detail ?? 'Gagal menghapus publikasi.')
    }
    setDeleting(false)
  }

  const filtered = filterType ? publications.filter(p => p.pub_type === filterType) : publications

  return (
    <div className="min-h-screen bg-bone">
      <Navbar />

      <main className="pt-16">
        {/* ── Hero ──────────────────────────────────────────── */}
        <section className="relative min-h-[40vh] flex flex-col justify-end overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-b from-forest/90 via-forest/70 to-ink/90 z-10" />
            <div className="absolute inset-0 z-0" style={{ background: 'radial-gradient(ellipse at 30% 40%, #2A4F3C 0%, transparent 60%), linear-gradient(160deg, #1F3B2D 0%, #2A4F3C 55%, #162A20 100%)' }} />
            <div className="absolute inset-0 z-20 opacity-[0.05]" style={{ backgroundImage: BATIK }} />
          </div>
          <div className="relative z-30 max-w-content mx-auto px-6 lg:px-12 pb-12 pt-24 w-full">
            <div className="flex items-end justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-4 mb-3">
                  <div className="h-px w-8 bg-clay/60" />
                  <span className="font-sans text-caption uppercase tracking-widest text-bone/60 font-medium">Manajemen</span>
                </div>
                <h1 className="font-serif text-display font-semibold text-bone leading-[1.05]">
                  Etalase <em className="font-accent italic text-sand/90">Publikasi</em>
                </h1>
              </div>
              <Link to="/display/manage/new"
                className="flex items-center gap-2 px-5 py-2.5 bg-clay text-bone rounded-lg font-sans text-sm font-medium
                  hover:bg-clay/90 transition-all duration-[240ms] flex-shrink-0 shadow-subtle">
                <Plus size={15} />
                Unggah Publikasi
              </Link>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-bone to-transparent z-30" />
        </section>

        {/* ── Content ───────────────────────────────────────── */}
        <div className="max-w-content mx-auto px-6 lg:px-12 py-10">

          {/* Stats + filter bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8 p-4 bg-white rounded-card border border-sand shadow-subtle">
            <div className="flex items-center gap-2">
              {!loading && (
                <>
                  <span className="font-serif text-h3 font-semibold text-forest font-tabular">{filtered.length}</span>
                  <span className="font-sans text-caption text-ash">publikasi{filterType ? ` (${CATEGORIES[filterType]?.label})` : ''}</span>
                </>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={() => setFilterType('')}
                className={`font-sans text-xs font-medium px-3 py-1.5 rounded-full border transition-all duration-[240ms] ${
                  filterType === '' ? 'bg-forest text-bone border-forest' : 'bg-white text-ash border-sand hover:border-forest/40 hover:text-ink'
                }`}>
                Semua
              </button>
              {Object.entries(CATEGORIES).map(([key, cat]) => (
                <button key={key} onClick={() => setFilterType(key === filterType ? '' : key)}
                  className={`font-sans text-xs font-medium px-3 py-1.5 rounded-full border transition-all duration-[240ms] ${
                    filterType === key ? `${cat.bg} ${cat.text} border-current` : 'bg-white text-ash border-sand hover:border-forest/40 hover:text-ink'
                  }`}>
                  {cat.label}
                </button>
              ))}
              <button onClick={load}
                className="p-1.5 rounded-lg border border-sand text-ash hover:text-forest hover:border-forest/40 transition-all duration-[240ms] ml-1">
                <RefreshCw size={14} />
              </button>
            </div>
          </div>

          {/* Delete confirmation modal */}
          {deleteTarget && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm px-4">
              <div className="bg-white rounded-card border border-sand shadow-elevated p-6 max-w-sm w-full">
                <h3 className="font-serif text-h3 font-semibold text-ink mb-2">Hapus publikasi?</h3>
                <p className="font-sans text-body text-ash mb-1">
                  {publications.find(p => p.id === deleteTarget)?.title}
                </p>
                <p className="font-sans text-caption text-clay mb-5">Tindakan ini tidak dapat dibatalkan. File di Supabase juga akan dihapus.</p>
                {deleteError && (
                  <div className="flex items-start gap-2 mb-4">
                    <AlertCircle size={14} className="text-clay flex-shrink-0 mt-0.5" />
                    <p className="font-sans text-caption text-clay">{deleteError}</p>
                  </div>
                )}
                <div className="flex gap-2">
                  <button onClick={() => { setDeleteTarget(null); setDeleteError('') }}
                    disabled={deleting}
                    className="flex-1 py-2 rounded-lg border border-sand font-sans text-sm text-ash hover:text-ink transition-colors duration-[240ms] disabled:opacity-50">
                    Batal
                  </button>
                  <button onClick={() => handleDelete(deleteTarget)} disabled={deleting}
                    className="flex-1 py-2 rounded-lg bg-clay text-bone font-sans text-sm font-medium hover:bg-clay/90 transition-colors duration-[240ms] disabled:opacity-50 flex items-center justify-center gap-2">
                    {deleting ? <><span className="w-3 h-3 border-2 border-bone/30 border-t-bone rounded-full animate-spin" />Menghapus…</> : 'Ya, Hapus'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Publications list */}
          <div className="bg-white rounded-card border border-sand shadow-subtle overflow-hidden">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <RowSkeleton key={i} />)
            ) : filtered.length === 0 ? (
              <div className="px-8 py-16 text-center">
                <FileText size={32} className="text-ash/30 mx-auto mb-4" />
                <p className="font-serif text-h3 font-semibold text-ink mb-2">Belum ada publikasi</p>
                <p className="font-sans text-body text-ash mb-6">
                  {filterType ? 'Tidak ada publikasi dengan kategori ini.' : 'Mulai dengan mengunggah publikasi pertama.'}
                </p>
                <Link to="/display/manage/new" className="btn-primary inline-flex items-center gap-2">
                  <Plus size={14} /> Unggah Sekarang
                </Link>
              </div>
            ) : (
              filtered.map(pub => {
                const cat = CATEGORIES[pub.pub_type] ?? CATEGORIES['LAINNYA']
                const Icon = cat.icon
                return (
                  <div key={pub.id} className="flex items-center gap-4 p-4 border-b border-sand last:border-0 hover:bg-sand/20 transition-colors duration-[240ms]">
                    {/* Thumbnail */}
                    <div className="w-16 h-12 rounded-lg overflow-hidden flex-shrink-0">
                      {pub.cover_url ? (
                        <img src={pub.cover_url} alt={pub.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"
                          style={{ background: 'linear-gradient(160deg, #1F3B2D 0%, #2A4F3C 55%, #162A20 100%)' }}>
                          <Icon size={14} className="text-bone/30" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-serif text-sm font-semibold text-ink leading-snug line-clamp-1 mb-1">
                        {pub.title}
                      </p>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className={`tag text-[0.55rem] py-0.5 ${cat.bg} ${cat.text} border ${cat.border}`}>
                          {cat.label}
                        </span>
                        <span className="font-sans text-caption text-ash font-tabular">{pub.year}</span>
                        <span className="flex items-center gap-1 font-sans text-caption text-ash">
                          <Eye size={10} />{(pub.views_count ?? 0).toLocaleString('id-ID')}
                        </span>
                        <span className="flex items-center gap-1 font-sans text-caption text-ash">
                          <Download size={10} />{(pub.downloads_count ?? 0).toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Link to={`/display/manage/${pub.id}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-sand bg-white text-ash font-sans text-xs font-medium hover:text-forest hover:border-forest/40 transition-all duration-[240ms]">
                        <Edit3 size={12} /> Edit
                      </Link>
                      <button onClick={() => { setDeleteTarget(pub.id); setDeleteError('') }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-sand bg-white text-ash font-sans text-xs font-medium hover:text-clay hover:border-clay/30 transition-all duration-[240ms]">
                        <Trash2 size={12} /> Hapus
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>

        </div>
      </main>

      <Footer />
    </div>
  )
}
