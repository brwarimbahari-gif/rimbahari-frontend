import { BookOpen, Compass, FileText, Eye, Download, Loader2 } from 'lucide-react'

export const BATIK = `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23F5EFE3' fill-opacity='1'%3E%3Cpath d='M30 30l-8-8 8-8 8 8-8 8zm0-16l-8-8 8-8 8 8-8 8zm0 32l-8-8 8-8 8 8-8 8zM14 30l-8-8 8-8 8 8-8 8zm32 0l-8-8 8-8 8 8-8 8z'/%3E%3C/g%3E%3C/svg%3E")`

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

export function DisplayCard({ item, onBaca, onDownload, loadingId }) {
  const style    = typeStyle[item.pub_type] ?? typeStyle['LAINNYA']
  const catLabel = CATEGORIES.find(c => c.id === item.pub_type)?.label ?? item.pub_type
  const CatIcon  = CATEGORIES.find(c => c.id === item.pub_type)?.icon ?? BookOpen
  const canBaca  = item.pub_type === 'EZINE_KEHATI' || item.pub_type === 'EZINE_ETNOGRAFI'

  return (
    <article className="group bg-white rounded-card border border-sand shadow-subtle
      hover:shadow-elevated transition-shadow duration-[240ms] overflow-hidden cursor-pointer flex flex-col">

      {/* Thumbnail */}
      <div className="relative aspect-[16/10] overflow-hidden flex-shrink-0" onClick={() => canBaca ? onBaca?.(item) : onDownload?.(item)}>
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
            {canBaca && (
              <span className="flex items-center gap-1 font-sans text-caption text-ash">
                <Eye size={12} className="flex-shrink-0" />
                {(item.views_count ?? 0).toLocaleString('id-ID')}
              </span>
            )}
            <span className="flex items-center gap-1 font-sans text-caption text-ash">
              <Download size={12} className="flex-shrink-0" />
              {(item.downloads_count ?? 0).toLocaleString('id-ID')}
            </span>
          </div>
          <button
            onClick={() => {
              if (loadingId) return
              if (canBaca) {
                onBaca?.(item)
              } else {
                onDownload?.(item)
              }
            }}
            disabled={!!loadingId}
            className={`inline-flex items-center gap-1 font-sans text-sm font-medium
              ${style.text} hover:opacity-70 transition-all`}
          >
            {loadingId === item.id ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                {canBaca ? 'Baca Sekarang' : 'Unduh Laporan'}
                <ArrowUpRight size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  )
}

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-card border border-sand overflow-hidden animate-pulse">
      <div className="aspect-[16/10] bg-bone" />
      <div className="p-5 space-y-4">
        <div className="h-3 bg-bone w-20 rounded" />
        <div className="space-y-2">
          <div className="h-5 bg-bone w-full rounded" />
          <div className="h-5 bg-bone w-2/3 rounded" />
        </div>
        <div className="pt-3 border-t border-sand flex justify-between">
          <div className="h-3 bg-bone w-16 rounded" />
          <div className="h-4 bg-bone w-24 rounded" />
        </div>
      </div>
    </div>
  )
}
