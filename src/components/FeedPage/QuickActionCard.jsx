import { PenLine } from 'lucide-react'
import { Link } from 'react-router-dom'

const BATIK = `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23F5EFE3' fill-opacity='1'%3E%3Cpath d='M30 30l-8-8 8-8 8 8-8 8zm0-16l-8-8 8-8 8 8-8 8zm0 32l-8-8 8-8 8 8-8 8zM14 30l-8-8 8-8 8 8-8 8zm32 0l-8-8 8-8 8 8-8 8z'/%3E%3C/g%3E%3C/svg%3E")`

export default function QuickActionCard() {
  return (
    <div className="bg-white rounded-card border border-sand shadow-subtle overflow-hidden">
      {/* Forest gradient header */}
      <div
        className="relative overflow-hidden px-5 py-5"
        style={{ background: 'linear-gradient(160deg, #1F3B2D 0%, #2A4F3C 60%, #5C7A4A 100%)' }}
      >
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-px w-6 bg-clay/60" />
            <span className="font-sans text-[0.6rem] uppercase tracking-widest text-bone/40">
              Kontribusi
            </span>
          </div>
          <h3 className="font-serif text-h3 font-semibold text-bone leading-tight">
            Bagikan{' '}
            <em className="font-accent italic text-clay/90">Pengetahuanmu</em>
          </h3>
          <p className="font-sans text-caption text-bone/50 mt-1 leading-snug">
            Jadilah bagian dari gerakan dokumentasi biokultural Indonesia.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 flex flex-col gap-2">
        <Link
          to="/articles/new"
          className="btn-primary text-sm flex items-center justify-center gap-2"
        >
          Tulis Artikel
        </Link>
        <Link
          to="/opinion/new"
          className="btn-primary text-sm flex items-center justify-center gap-2"
        >
          Tulis Opini Editorial
        </Link>
        <Link
          to="/vignette/new"
          className="btn-primary text-sm flex items-center justify-center gap-2"
        >
          Tulis Vignette
        </Link>

      </div>
    </div>
  )
}
