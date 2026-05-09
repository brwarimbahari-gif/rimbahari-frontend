import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, BookOpen, ArrowUpRight, Compass, FileText, Star, Eye, Download, Loader2 } from 'lucide-react'
import { useNavigate, Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { etalaseApi, session } from '../lib/api'
import FlipbookViewer from '../components/FlipbookViewer'


const BATIK = `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23F5EFE3' fill-opacity='1'%3E%3Cpath d='M30 30l-8-8 8-8 8 8-8 8zm0-16l-8-8 8-8 8 8-8 8zm0 32l-8-8 8-8 8 8-8 8zM14 30l-8-8 8-8 8 8-8 8zm32 0l-8-8 8-8 8 8-8 8z'/%3E%3C/g%3E%3C/svg%3E")`

export const CATEGORIES = [
  { id: 'EZINE_KEHATI',      label: 'E-zine Kehati',        headingAccent: 'Kehati',    icon: BookOpen },
  { id: 'EZINE_ETNOGRAFI',   label: 'Etnografi Multimedia', headingAccent: 'Etnografi', icon: Compass  },
  { id: 'LAPORAN',           label: 'Laporan Program',      headingAccent: 'Laporan',   icon: FileText },
  { id: 'LAINNYA',           label: 'Lainnya',              headingAccent: 'Lainnya',   icon: BookOpen },
]

export const typeStyle = {
  EZINE_KEHATI:      { bg: 'bg-forest/10',  text: 'text-forest',  border: 'border-forest/20' },
  EZINE_ETNOGRAFI:   { bg: 'bg-moss/10',    text: 'text-moss',    border: 'border-moss/20'   },
  LAPORAN:           { bg: 'bg-clay/10',    text: 'text-clay',    border: 'border-clay/20'   },
  LAINNYA:           { bg: 'bg-sand',       text: 'text-ash',     border: 'border-sand'      },
}


// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------
export function DisplayCard({ item, onBaca, loadingId }) {
  const style    = typeStyle[item.pub_type] ?? typeStyle['LAINNYA']
  const catLabel = CATEGORIES.find(c => c.id === item.pub_type)?.label ?? item.pub_type
  const CatIcon  = CATEGORIES.find(c => c.id === item.pub_type)?.icon ?? BookOpen
  const canBaca  = item.pub_type === 'EZINE_KEHATI' || item.pub_type === 'EZINE_ETNOGRAFI'

  return (
    <article className="group bg-white rounded-card border border-sand shadow-subtle
      hover:shadow-elevated transition-shadow duration-[240ms] overflow-hidden cursor-pointer flex flex-col">

      {/* Thumbnail */}
      <div className="relative aspect-[16/10] overflow-hidden flex-shrink-0">
        {item.cover_url ? (
          <img
            src={item.cover_url}
            alt={item.title}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-[400ms]"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: 'linear-gradient(160deg, #1F3B2D 0%, #2A4F3C 55%, #162A20 100%)' }}
          >
            <CatIcon size={28} className="text-bone/25" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-[240ms]" />
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-px w-5 bg-clay/40" />
          <span className={`tag text-[0.65rem] py-0.5 ${style.bg} ${style.text} border ${style.border}`}>
            {catLabel}
          </span>
        </div>

        <h3 className="font-serif text-h3 font-semibold text-ink leading-snug mb-2 line-clamp-2
          group-hover:text-forest transition-colors duration-[240ms]">
          {item.title}
        </h3>

        <p className="font-sans text-caption text-ash leading-snug mb-4 font-tabular">
          {item.year}
        </p>

        <div className="mt-auto pt-3 border-t border-sand flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 font-sans text-caption text-ash">
              <Eye size={12} className="flex-shrink-0" />
              {(item.views_count ?? 0).toLocaleString('id-ID')}
            </span>
            <span className="flex items-center gap-1 font-sans text-caption text-ash">
              <Download size={12} className="flex-shrink-0" />
              {(item.downloads_count ?? 0).toLocaleString('id-ID')}
            </span>
          </div>
          <button
            onClick={() => canBaca && !loadingId && onBaca?.(item)}
            disabled={!!loadingId}
            className={`inline-flex items-center gap-1 font-sans text-sm font-medium
              transition-colors duration-[240ms] flex-shrink-0 ${
                canBaca && !loadingId ? 'text-forest hover:text-clay cursor-pointer'
                : canBaca && loadingId === item.id ? 'text-forest/60 cursor-wait'
                : 'text-ash/30 cursor-default'
              }`}
          >
            {loadingId === item.id
              ? <><Loader2 size={13} className="animate-spin" />Memuat…</>
              : <>Baca<ArrowUpRight size={14} /></>
            }
          </button>
        </div>
      </div>
    </article>
  )
}

// ---------------------------------------------------------------------------
// Skeleton card
// ---------------------------------------------------------------------------
export function CardSkeleton() {
  return (
    <div className="bg-white rounded-card border border-sand shadow-subtle overflow-hidden animate-pulse">
      <div className="aspect-[16/10] bg-sand/40" />
      <div className="p-5 flex flex-col gap-3">
        <div className="h-3 bg-sand rounded w-24" />
        <div className="h-4 bg-sand rounded w-4/5" />
        <div className="h-4 bg-sand rounded w-3/5" />
        <div className="h-3 bg-sand/60 rounded w-12 mt-1" />
        <div className="h-px bg-sand mt-2" />
        <div className="flex items-center justify-between">
          <div className="h-3 bg-sand/60 rounded w-20" />
          <div className="h-3 bg-sand/60 rounded w-12" />
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Category row — shows up to MAX_PER_ROW items, 3 at a time with arrows
// ---------------------------------------------------------------------------
const MAX_PER_ROW = 9

function DisplayRow({ category, loading, onBaca, loadingId }) {
  const [startIndex, setStartIndex] = useState(0)
  const itemsPerPage = 3

  const visibleData = category.data.slice(0, MAX_PER_ROW)
  const totalItems  = visibleData.length

  const next = () => setStartIndex(
    startIndex + itemsPerPage < totalItems ? startIndex + itemsPerPage : 0
  )
  const prev = () => setStartIndex(
    startIndex - itemsPerPage >= 0 ? startIndex - itemsPerPage : Math.max(0, totalItems - itemsPerPage)
  )

  const currentItems = visibleData.slice(startIndex, startIndex + itemsPerPage)

  if (!loading && totalItems === 0) return null

  return (
    <section className="mb-16 md:mb-20">
      {/* Heading */}
      <div className="flex items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-4 mb-3">
            <div className="h-px w-8 bg-clay/50" />
            <span className="tag">{category.label}</span>
          </div>
          <h2 className="font-serif text-h1 font-semibold text-ink leading-tight">
            Koleksi{' '}
            <em className="font-accent italic text-clay">{category.headingAccent}</em>
          </h2>
        </div>

        {totalItems > itemsPerPage && (
          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="flex gap-1.5 items-center">
              {Array.from({ length: Math.ceil(totalItems / itemsPerPage) }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1 rounded-full transition-all duration-[240ms] ${
                    Math.floor(startIndex / itemsPerPage) === i ? 'w-5 bg-forest' : 'w-2 bg-sand'
                  }`}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={prev} className="p-2 rounded-lg border border-sand bg-white text-ash hover:text-forest hover:border-forest/40 transition-all duration-[240ms]">
                <ChevronLeft size={16} />
              </button>
              <button onClick={next} className="p-2 rounded-lg border border-sand bg-white text-ash hover:text-forest hover:border-forest/40 transition-all duration-[240ms]">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)
          : currentItems.map((item) => <DisplayCard key={item.id} item={item} onBaca={onBaca} loadingId={loadingId} />)
        }
      </div>

      {/* Lihat Lebih Banyak */}
      {!loading && totalItems > 0 && (
        <div className="mt-8 flex justify-center">
          <Link
            to={`/display/${category.id}`}
            className="inline-flex items-center gap-2 px-6 py-2.5 border border-sand bg-white rounded-lg
              font-sans text-sm font-medium text-ink hover:text-forest hover:border-forest/40
              transition-all duration-[240ms] shadow-subtle"
          >
            Lihat Lebih Banyak
            <ArrowUpRight size={14} />
          </Link>
        </div>
      )}
    </section>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function DisplayPage() {
  const navigate = useNavigate()
  const [publications, setPublications] = useState([])
  const [loading, setLoading]           = useState(true)
  const [flipItem, setFlipItem]   = useState(null)
  const [flipLoading, setFlipLoading] = useState(null)  // id being fetched

  const handleBaca = async (item) => {
    // List serializer omits file_url — fetch detail to get it before opening viewer
    setFlipLoading(item.id)
    const { ok, data } = await etalaseApi.detail(item.id)
    setFlipItem(ok ? data : item)
    setFlipLoading(null)
  }

  useEffect(() => {
    if (!session.getAccess()) {
      navigate('/login', { replace: true })
      return
    }
    // Try to load real data; keep mock if API returns empty
    load()
  }, [])

  const load = async () => {
    setLoading(true)
    const { ok, data } = await etalaseApi.list({})
    if (ok) setPublications(Array.isArray(data) ? data : (data.results ?? []))
    setLoading(false)
  }

  const categoriesWithData = CATEGORIES.map(cat => ({
    ...cat,
    data: publications.filter(p => p.pub_type === cat.id),
  }))

  return (
    <div className="min-h-screen bg-bone">
      <Navbar />

      <main className="pt-16">

        {/* ── Hero ──────────────────────────────────────────────────── */}
        <section className="relative min-h-[42vh] flex flex-col justify-end overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-b from-forest/90 via-forest/70 to-ink/90 z-10" />
            <div
              className="absolute inset-0 z-0"
              style={{ background: 'radial-gradient(ellipse at 30% 40%, #2A4F3C 0%, transparent 60%), radial-gradient(ellipse at 70% 60%, #4A6238 0%, transparent 50%), linear-gradient(160deg, #1F3B2D 0%, #2A4F3C 55%, #162A20 100%)' }}
            />
            <div className="absolute inset-0 z-20 opacity-[0.05]" style={{ backgroundImage: BATIK }} />
          </div>

          <div className="relative z-30 max-w-content mx-auto px-6 lg:px-12 pb-16 pt-28 w-full">
            <div className="max-w-2xl">
              <div className="flex items-center gap-4 mb-5">
                <div className="h-px w-8 bg-clay/60" />
                <span className="font-sans text-caption uppercase tracking-widest text-bone/60 font-medium">
                  Etalase Publikasi
                </span>
              </div>
              <h1 className="font-serif text-display font-semibold text-bone leading-[1.05] mb-4">
                Karya &amp;{' '}
                <em className="font-accent italic text-sand/90">Dokumentasi</em>
              </h1>
              <p className="font-sans text-body-lg text-bone/70 leading-relaxed">
                Koleksi resmi hasil riset, etnografi multimedia, dan laporan partisipatif oleh tim RIMBAHARI.
              </p>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-bone to-transparent z-30" />
        </section>

        {/* ── Content ───────────────────────────────────────────────── */}
        <div className="max-w-content mx-auto px-6 lg:px-12 py-12 md:py-16">

          {/* Filter bar */}
          <div className="flex flex-wrap items-center gap-3 mb-6 p-4">

            {!loading && (
              <div className="flex items-center gap-2 ml-auto">
                <span className="font-serif text-h3 font-semibold text-forest font-tabular">
                  {publications.length}
                </span>
                <span className="font-sans font-bold text-caption text-ash">publikasi terkurasi</span>
              </div>
            )}
          </div>

          {/* Category rows */}
          {categoriesWithData.map((cat) => (
            <DisplayRow key={cat.id} category={cat} loading={loading} onBaca={handleBaca} loadingId={flipLoading} />
          ))}

          {/* Empty state */}
          {!loading && publications.length === 0 && (
            <div className="bg-white rounded-card border border-sand shadow-subtle px-8 py-16 text-center">
              <p className="font-serif text-h3 font-semibold text-ink mb-2">Belum ada publikasi</p>
              <p className="font-sans text-body text-ash">Publikasi akan muncul di sini setelah diunggah oleh admin.</p>
            </div>
          )}

        </div>
      </main>

      <Footer />

      {flipItem && (
        <FlipbookViewer item={flipItem} onClose={() => setFlipItem(null)} />
      )}
    </div>
  )
}
