import { useEffect, useState } from 'react'
import { Eye, MessageCircle, ArrowUpRight, Users } from 'lucide-react'
import { useNavigate, Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import FeedProfileCard from '../components/FeedPage/FeedProfileCard'
import LeaderboardCard from '../components/FeedPage/LeaderboardCard'
import QuickActionCard from '../components/FeedPage/QuickActionCard'
import { articlesApi, homeApi, session } from '../lib/api'

const CONTENT_TYPES = [
  { value: '',         label: 'Semua' },
  { value: 'ARTIKEL',  label: 'Artikel' },
  { value: 'OPINION',  label: 'Opinion' },
  { value: 'VIGNETTE', label: 'Vignette' },
]

const typeStyle = {
  ARTIKEL:  { bg: 'bg-forest/10',  text: 'text-forest',  border: 'border-forest/20' },
  OPINION:  { bg: 'bg-clay/10',    text: 'text-clay',    border: 'border-clay/20' },
  VIGNETTE: { bg: 'bg-sienna/10',  text: 'text-sienna',  border: 'border-sienna/20' },
  CERITA:   { bg: 'bg-moss/10',    text: 'text-moss',    border: 'border-moss/20' },
}

const roleLabels = {
  MAHASISWA:   'Mahasiswa',
  AKADEMISI:   'Akademisi',
  PEMUDA_ADAT: 'Pemuda Adat',
  AKTIVIS:     'Aktivis',
}

function getInitials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (diff < 60)      return 'Baru saja'
  if (diff < 3600)    return `${Math.floor(diff / 60)} menit lalu`
  if (diff < 86400)   return `${Math.floor(diff / 3600)} jam lalu`
  if (diff < 2592000) return `${Math.floor(diff / 86400)} hari lalu`
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

function ArticleCard({ article, onClick }) {
  const { author } = article
  const style = typeStyle[article.content_type] ?? typeStyle['ARTIKEL']
  const typeLabel = CONTENT_TYPES.find((t) => t.value === article.content_type)?.label ?? article.content_type
  const initials = getInitials(author?.full_name)

  return (
    <article
      onClick={onClick}
      className="bg-white rounded-card border border-sand shadow-subtle overflow-hidden
        hover:shadow-elevated transition-shadow duration-[240ms] group cursor-pointer">

      <div className="p-5 md:p-6">
        {/* Author row — content type badge far right */}
        <div className="flex items-center gap-2.5 mb-4">
          <Link
            to={author?.id ? `/profile/${author.id}` : '#'}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-2.5 flex-1 min-w-0 group/author"
          >
            {author?.photo_url ? (
              <img
                src={author.photo_url}
                alt={author.full_name}
                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-forest/15 flex items-center justify-center flex-shrink-0">
                <span className="font-serif font-semibold text-[0.65rem] text-forest leading-none">{initials}</span>
              </div>
            )}
            <div className="min-w-0">
              <p className="font-sans text-xs font-medium text-ink group-hover/author:text-forest leading-snug truncate transition-colors duration-[200ms]">
                {author?.full_name}
              </p>
              <p className="font-sans text-[0.65rem] text-ash leading-snug">
                {roleLabels[author?.role_category] ?? author?.role_category}
                {' · '}
                {timeAgo(article.published_at ?? article.created_at)}
              </p>
            </div>
          </Link>
          <span className={`tag text-[0.65rem] py-0.5 flex-shrink-0 ${style.bg} ${style.text} border ${style.border}`}>
            {typeLabel}
          </span>
        </div>

        {/* Recommendation reason — only on personalized feed */}
        {article.recommendation_reason && (
          <div className="flex items-center gap-1.5 mb-3 -mt-1">
            <div className="w-1 h-1 rounded-full bg-moss flex-shrink-0" />
            <span className="font-sans text-[0.65rem] text-moss/70 italic">
              {article.recommendation_reason}
            </span>
          </div>
        )}

        {/* Thumbnail — between author and title; gradient fallback when no image */}
        <div className="w-full aspect-[16/9] overflow-hidden rounded-lg mb-4 flex-shrink-0">
          {article.thumbnail_url ? (
            <img
              src={article.thumbnail_url}
              alt={article.title}
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-[400ms]"
            />
          ) : (
            <div
              className="w-full h-full"
              style={{ background: 'linear-gradient(160deg, #1F3B2D 0%, #2A4F3C 55%, #162A20 100%)' }}
            />
          )}
        </div>

        {/* Title — large serif */}
        <h2 className="font-serif text-h2 font-semibold text-ink leading-tight mb-3 line-clamp-2
          group-hover:text-forest transition-colors duration-[240ms]">
          {article.title}
        </h2>

        {/* Abstract — italic accent */}
        <p className="font-accent italic text-body text-ash/80 leading-relaxed line-clamp-3 mb-5">
          {article.abstract}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-sand">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 font-sans text-caption text-ash">
              <Eye size={13} className="flex-shrink-0" />
              {(article.views_count ?? 0).toLocaleString('id-ID')}
            </span>
            <span className="flex items-center gap-1.5 font-sans text-caption text-ash">
              <MessageCircle size={13} className="flex-shrink-0" />
              {article.comments_count ?? 0}
            </span>
            {(article.contributor_count ?? 0) > 0 && (
              <span className="flex items-center gap-1.5 font-sans text-caption text-ash">
                <Users size={13} className="flex-shrink-0" />
                {article.contributor_count}
              </span>
            )}
          </div>

          <button className="inline-flex items-center gap-1 font-sans text-sm font-medium
            text-forest hover:text-clay transition-colors duration-[240ms] flex-shrink-0">
            Baca
            <ArrowUpRight size={14} />
          </button>
        </div>
      </div>
    </article>
  )
}

function CardSkeleton() {
  return (
    <div className="bg-white rounded-card border border-sand shadow-subtle p-5 md:p-6 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-full bg-sand flex-shrink-0" />
        <div className="flex-1 flex flex-col gap-1.5">
          <div className="h-3.5 bg-sand rounded w-36" />
          <div className="h-3 bg-sand/60 rounded w-52" />
        </div>
        <div className="h-5 w-16 bg-sand rounded-full" />
      </div>
      <div className="w-full aspect-[16/9] bg-sand rounded-lg mb-4" />
      <div className="h-5 bg-sand rounded w-4/5 mb-2" />
      <div className="h-5 bg-sand rounded w-3/5 mb-4" />
      <div className="flex flex-col gap-2 mb-5">
        <div className="h-3.5 bg-sand/60 rounded w-full" />
        <div className="h-3.5 bg-sand/60 rounded w-full" />
        <div className="h-3.5 bg-sand/60 rounded w-2/3" />
      </div>
      <div className="h-px bg-sand mb-4" />
      <div className="flex items-center justify-between">
        <div className="h-3.5 bg-sand/60 rounded w-24" />
        <div className="h-3.5 bg-sand/60 rounded w-14" />
      </div>
    </div>
  )
}

export default function FeedPage() {
  const navigate = useNavigate()
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeType, setActiveType] = useState('')

  useEffect(() => {
    if (!session.getAccess()) {
      navigate('/login', { replace: true })
      return
    }
    loadFeed('')
  }, [])

  const loadFeed = async (contentType) => {
    setLoading(true)
    // Default "Semua" tab uses personalized homeApi feed (includes recommendation_reason).
    // Filtered tabs fall back to articlesApi to keep content-type filtering working.
    const { ok, data } = contentType
      ? await articlesApi.feed(contentType)
      : await homeApi.feed()
    if (ok) {
      const raw = Array.isArray(data) ? data : (data.results ?? [])
      // homeApi returns [{article, recommendation_reason, relevance_score}]
      // articlesApi returns articles directly — handle both
      setArticles(raw.map(item =>
        item.article ? { ...item.article, recommendation_reason: item.recommendation_reason } : item
      ))
    }
    setLoading(false)
  }

  const handleFilter = (type) => {
    setActiveType(type)
    loadFeed(type)
  }

  return (
    <div className="min-h-screen bg-bone">
      <Navbar />

      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-10">
          <div className="flex gap-6 items-start">

            {/* ── Left sidebar ─────────────────────────────── */}
            <aside className="hidden lg:block w-60 flex-shrink-0 sticky top-24">
              <FeedProfileCard />
            </aside>

            {/* ── Center feed ──────────────────────────────── */}
            <div className="flex-1 min-w-0">

              {/* Page heading */}
              <div className="mb-7">
                <div className="flex items-center gap-4 mb-3">
                  <div className="h-px w-8 bg-clay/50" />
                  <span className="tag">Linimasa</span>
                </div>
                <h1 className="font-serif text-h1 font-semibold text-ink leading-tight">
                  Pengetahuan yang{' '}
                  <em className="font-accent italic text-clay">Hidup</em>
                </h1>
                <p className="font-sans text-body text-ash mt-2">
                  Artikel dan esai terbaru dari komunitas RIMBAHARI.
                </p>
              </div>

              {/* Content type filter */}
              <div className="flex flex-wrap items-center gap-2 mb-6">
                {CONTENT_TYPES.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => handleFilter(type.value)}
                    className={`font-sans text-sm font-medium px-4 py-1.5 rounded-full border
                      transition-all duration-[240ms] ${
                        activeType === type.value
                          ? 'bg-forest text-bone border-forest'
                          : 'bg-white text-ash border-sand hover:border-forest/40 hover:text-ink'
                      }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>

              {/* Feed cards */}
              <div className="flex flex-col gap-4">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)
                ) : articles.length === 0 ? (
                  <div className="bg-white rounded-card border border-sand shadow-subtle px-8 py-16 text-center">
                    <p className="font-serif text-h3 font-semibold text-ink mb-2">Belum ada artikel</p>
                    <p className="font-sans text-body text-ash">
                      {activeType
                        ? 'Tidak ada artikel dengan kategori ini.'
                        : 'Jadilah yang pertama berbagi pengetahuan.'}
                    </p>
                  </div>
                ) : (
                  articles.map((article) => (
                    <ArticleCard
                      key={article.id}
                      article={article}
                      onClick={() => navigate(`/articles/${article.id}`)}
                    />
                  ))
                )}
              </div>

            </div>

            {/* ── Right sidebar ────────────────────────────── */}
            <aside className="hidden lg:block w-60 flex-shrink-0 sticky top-24">
              <div className="flex flex-col gap-4">
                <LeaderboardCard />
                <QuickActionCard />
              </div>
            </aside>

          </div>
        </div>
      </main>
    </div>
  )
}
