import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import { etalaseApi, session } from '../../lib/api'
import { CATEGORIES, DisplayCard, CardSkeleton, BATIK } from '../../components/DisplayPage/DisplayShared'
import FlipbookViewer from '../../components/FlipbookViewer'

export default function DisplayCategoryPage() {
  const { pubType } = useParams()
  const navigate    = useNavigate()

  const category = CATEGORIES.find(c => c.id === pubType)

  const [publications, setPublications] = useState([])
  const [loading, setLoading]           = useState(true)
  const [yearFilter, setYearFilter] = useState('')
  const [page, setPage]             = useState(1)
  const [flipItem, setFlipItem]         = useState(null)
  const [flipLoading, setFlipLoading]   = useState(null)

  const handleBaca = async (item) => {
    setFlipLoading(item.id)
    const { ok, data } = await etalaseApi.detail(item.id)
    setFlipItem(ok ? data : item)
    setFlipLoading(null)
  }

  const handleDownload = async (item) => {
    if (flipLoading) return
    setFlipLoading(item.id)
    try {
      const { ok, data } = await etalaseApi.detail(item.id)
      const detail = ok ? data : item
      const pdfUrl = detail.file_url || detail.pdf_url
      
      if (!pdfUrl) {
        alert('File tidak tersedia.')
        return
      }

      // Increment count on backend
      etalaseApi.download(detail.id).catch(() => {})

      // Trigger actual download
      const res = await fetch(pdfUrl)
      const blob = await res.blob()
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = `${detail.title.replace(/[/\\]/g, '-')}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000)
    } catch (err) {
      console.error(err)
    } finally {
      setFlipLoading(null)
    }
  }

  useEffect(() => {
    if (!session.getAccess()) {
      navigate('/login', { replace: true })
      return
    }
    if (!category) {
      navigate('/display', { replace: true })
      return
    }
    setLoading(true)
    etalaseApi.list({ pub_type: pubType }).then(({ ok, data }) => {
      if (ok) setPublications(Array.isArray(data) ? data : (data.results ?? []))
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [pubType])

  if (!category) return null

  const filtered = yearFilter
    ? publications.filter(p => String(p.year) === String(yearFilter))
    : publications

  const ITEMS_PER_PAGE = 9
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const safePage   = Math.min(page, totalPages)
  const pageItems  = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE)

  const years = [...new Set(publications.map(p => p.year))].sort((a, b) => b - a)

  const handleYearChange = (y) => { setYearFilter(y); setPage(1) }

  return (
    <div className="min-h-screen bg-bone">
      <Navbar />

      <main className="pt-16">

        {/* ── Hero ──────────────────────────────────────────────────── */}
        <section className="relative min-h-[32vh] flex flex-col justify-end overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-b from-forest/90 via-forest/70 to-ink/90 z-10" />
            <div
              className="absolute inset-0 z-0"
              style={{ background: 'radial-gradient(ellipse at 30% 40%, #2A4F3C 0%, transparent 60%), radial-gradient(ellipse at 70% 60%, #4A6238 0%, transparent 50%), linear-gradient(160deg, #1F3B2D 0%, #2A4F3C 55%, #162A20 100%)' }}
            />
            <div className="absolute inset-0 z-20 opacity-[0.05]" style={{ backgroundImage: BATIK }} />
          </div>

          <div className="relative z-30 max-w-content mx-auto px-6 lg:px-12 pb-14 pt-24 w-full">
            <div className="max-w-2xl">
              <div className="flex items-center gap-4 mb-5">
                <div className="h-px w-8 bg-clay/60" />
                <span className="font-sans text-caption uppercase tracking-widest text-bone/60 font-medium">
                  {category.label}
                </span>
              </div>
              <h1 className="font-serif text-display font-semibold text-bone leading-[1.05]">
                Koleksi{' '}
                <em className="font-accent italic text-sand/90">{category.headingAccent}</em>
              </h1>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-bone to-transparent z-30" />
        </section>

        {/* ── Content ───────────────────────────────────────────────── */}
        <div className="max-w-content mx-auto px-6 lg:px-12 py-12 md:py-16">

          {/* Back */}
          <button
            onClick={() => navigate('/display')}
            className="flex items-center gap-2 font-sans text-sm text-ash hover:text-forest
              transition-colors duration-[240ms] mb-10"
          >
            <ArrowLeft size={15} />
            Kembali ke Etalase
          </button>

          {/* Filter + count bar */}
          <div className="flex flex-wrap items-center gap-3 mb-10 p-4 bg-white rounded-card border border-sand shadow-subtle">
            <div className="flex items-center gap-2 px-3 py-2 bg-sand/20 rounded-lg border border-sand">
              <Calendar size={13} className="text-forest flex-shrink-0" />
              <select
                value={yearFilter}
                onChange={(e) => handleYearChange(e.target.value)}
                className="bg-transparent font-sans text-sm text-ink outline-none cursor-pointer"
              >
                <option value="">Semua Tahun</option>
                {years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            {!loading && (
              <div className="flex items-center gap-2 ml-auto">
                <span className="font-serif text-h3 font-semibold text-forest font-tabular">
                  {filtered.length}
                </span>
                <span className="font-sans text-caption text-ash">publikasi</span>
              </div>
            )}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {loading
              ? Array.from({ length: 9 }).map((_, i) => <CardSkeleton key={i} />)
              : pageItems.map((item) => (
                  <DisplayCard 
                    key={item.id} 
                    item={item} 
                    onBaca={handleBaca} 
                    onDownload={handleDownload}
                    loadingId={flipLoading} 
                  />
                ))
            }
          </div>

          {/* Pagination */}
          {!loading && (
            <div className="flex items-center justify-center gap-4 mt-10">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="p-2 rounded-lg border border-sand bg-white text-ash
                  hover:text-forest hover:border-forest/40 disabled:opacity-40 disabled:cursor-not-allowed
                  transition-all duration-[240ms]"
              >
                <ChevronLeft size={16} />
              </button>

              <div className="flex items-center gap-1.5">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i + 1)}
                    className={`rounded-full transition-all duration-[240ms] ${
                      safePage === i + 1
                        ? 'w-5 h-1 bg-forest'
                        : 'w-2 h-1 bg-sand hover:bg-ash/40'
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="p-2 rounded-lg border border-sand bg-white text-ash
                  hover:text-forest hover:border-forest/40 disabled:opacity-40 disabled:cursor-not-allowed
                  transition-all duration-[240ms]"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* Empty state */}
          {!loading && filtered.length === 0 && (
            <div className="bg-white rounded-card border border-sand shadow-subtle px-8 py-16 text-center">
              <p className="font-serif text-h3 font-semibold text-ink mb-2">Belum ada publikasi</p>
              <p className="font-sans text-body text-ash">
                {yearFilter
                  ? `Tidak ada publikasi untuk tahun ${yearFilter}.`
                  : 'Publikasi akan muncul di sini setelah diunggah oleh admin.'}
              </p>
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
