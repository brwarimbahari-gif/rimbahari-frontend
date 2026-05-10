import { useState, useEffect, useCallback } from 'react'
import { 
  FileText, 
  ShoppingBag, 
  Users, 
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  BookOpen,
  PieChart,
  LogOut
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { articlesApi, etalaseApi, usersApi, session } from '../lib/api'
import AdminSidebar from '../components/AdminPage/AdminSidebar'

import ActivityModal from '../components/AdminPage/ActivityModal'

// ---------------------------------------------------------------------------
// Admin Page Dashboard
// ---------------------------------------------------------------------------

export default function AdminPage() {
  const navigate = useNavigate()
  
  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    articles: { total: 0, byType: {} },
    etalase: { total: 0, byType: {} },
    users: { total: 0 }
  })
  const [allActivities, setAllActivities] = useState([])
  const [showActivityModal, setShowActivityModal] = useState(false)
  const [reviewQueue, setReviewQueue] = useState([])
  const [error, setError] = useState('')

  // ---------------------------------------------------------------------------
  // Auth Guard
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const user = session.getUser()
    const isAdmin = user && (user.role === 'ADMIN' || user.is_staff || user.is_superuser)
    const isAdminVerified = localStorage.getItem('rh_admin_verified') === 'true'
    
    if (!isAdmin || !isAdminVerified) {
      navigate('/4Dm1n_d4Shb04Rd/login', { replace: true })
    }
  }, [navigate])

  // ---------------------------------------------------------------------------
  // Data Fetching
  // ---------------------------------------------------------------------------
  const fetchDashboardData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [artRes, etalaseRes, statsRes, queueRes] = await Promise.all([
        articlesApi.adminList(),
        etalaseApi.list(),
        usersApi.stats(),
        articlesApi.reviewQueue()
      ])

      // 1. Articles
      if (artRes.ok) {
        const rawData = artRes.data
        const allArticles = Array.isArray(rawData) ? rawData : (rawData.results || [])
        
        const byType = { 'ARTIKEL': 0, 'OPINION': 0, 'VIGNETTE': 0 }
        allArticles.forEach(art => {
          byType[art.content_type] = (byType[art.content_type] || 0) + 1
        })
        
        setStats(prev => ({
          ...prev,
          articles: { total: allArticles.length, byType }
        }))

        const sorted = [...allArticles].sort((a, b) => 
          new Date(b.created_at) - new Date(a.created_at)
        )
        setAllActivities(sorted)
      }

      // 2. Etalase
      if (etalaseRes.ok) {
        const rawData = etalaseRes.data
        const allEtalase = Array.isArray(rawData) ? rawData : (rawData.results || [])
        
        const byType = {
          'EZINE_KEHATI': 0,
          'EZINE_ETNOGRAFI': 0,
          'LAPORAN': 0,
          'LAINNYA': 0
        }
        allEtalase.forEach(item => {
          byType[item.pub_type] = (byType[item.pub_type] || 0) + 1
        })
        
        setStats(prev => ({
          ...prev,
          etalase: { total: allEtalase.length, byType }
        }))
      }

      // 3. User Stats
      if (statsRes.ok) {
        setStats(prev => ({
          ...prev,
          users: { total: statsRes.data.total_users || 0 }
        }))
      }

      // 4. Review Queue
      if (queueRes.ok) {
        const rawQueue = queueRes.data
        const queue = (Array.isArray(rawQueue) ? rawQueue : (rawQueue.results || []))
          .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
        setReviewQueue(queue)
      }

    } catch (err) {
      console.error(err)
      setError('Gagal sinkronisasi data dashboard.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  // ---------------------------------------------------------------------------
  // Helpers & Handlers
  // ---------------------------------------------------------------------------
  const formatDate = (dateStr) => {
    const d = new Date(dateStr)
    const now = new Date()
    const diffMs = now - d
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60))
    
    if (diffHrs < 1) return 'Baru saja'
    if (diffHrs < 24) return `${diffHrs} Jam yang lalu`
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
  }

  const handleLogout = () => {
    session.clear()
    localStorage.removeItem('rh_admin_verified')
    navigate('/login', { replace: true })
  }

  const statCards = [
    { label: 'Total Artikel', value: stats.articles.total, icon: FileText, color: 'bg-forest/10 text-forest', link: '/4Dm1n_d4Shb04Rd/articles' },
    { label: 'Koleksi Etalase', value: stats.etalase.total, icon: ShoppingBag, color: 'bg-moss/10 text-moss', link: '/4Dm1n_d4Shb04Rd/display' },
    { label: 'User Terdaftar', value: stats.users.total, icon: Users, color: 'bg-clay/10 text-clay', link: '/4Dm1n_d4Shb04Rd/users' },
  ]

  // ---------------------------------------------------------------------------
  // Loading State
  // ---------------------------------------------------------------------------
  if (loading && stats.articles.total === 0) {
    return (
      <div className="flex h-screen bg-[#FDFCF9]">
        <AdminSidebar />
        <div className="flex-1 flex flex-col items-center justify-center">
          <Loader2 size={40} className="animate-spin text-forest opacity-20 mb-4" />
          <p className="text-sm font-medium text-ash animate-pulse">Menyiapkan Ringkasan Sistem...</p>
        </div>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="flex h-screen bg-[#FDFCF9]">
      <AdminSidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-sand flex items-center justify-between px-10 z-10">
          <div className="flex items-center gap-4 flex-1">
            <h2 className="font-serif text-xl font-bold text-ink">Dashboard</h2>
          </div>

          <div className="flex items-center gap-8">
            <Link to="/home" className="font-sans text-[10px] font-bold text-ash hover:text-forest uppercase tracking-[0.2em] transition-colors">
              Lihat Website
            </Link>
            
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 font-sans text-[10px] font-bold text-clay hover:text-red-600 uppercase tracking-[0.2em] transition-colors"
            >
              <LogOut size={14} />
              Keluar
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-10">
          <div className="max-w-7xl mx-auto space-y-10">
            
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600">
                <AlertCircle size={20} />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-8">
              {statCards.map((stat, idx) => (
                <Link key={idx} to={stat.link} className="bg-white rounded-3xl border border-sand p-8 shadow-subtle transition-all group">
                  <div className="flex items-start justify-between mb-6">
                    <div className={`p-4 rounded-2xl ${stat.color}`}>
                      <stat.icon size={24} />
                    </div>
                  </div>
                  <p className="text-ash font-sans text-sm font-medium mb-1">{stat.label}</p>
                  <p className="text-4xl font-serif font-bold text-ink tracking-tight">{stat.value.toLocaleString('id-ID')}</p>
                </Link>
              ))}
            </div>

            {/* Analytics Grid */}
            <div className="grid grid-cols-5 gap-8">
              <div className="col-span-2 bg-white rounded-3xl border border-sand p-8 shadow-subtle flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-bone rounded-lg text-forest"><PieChart size={18} /></div>
                    <h3 className="font-serif text-lg font-bold text-ink">Distribusi Artikel</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    {Object.entries(stats.articles.byType).map(([type, count]) => (
                      <div key={type} className="px-4 py-3 bg-bone/30 rounded-2xl border border-sand/50 flex items-center justify-between">
                        <p className="text-[10px] uppercase font-bold text-ash/60 tracking-wider">{type}</p>
                        <p className="text-lg font-bold text-ink">{count}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="col-span-3 bg-white rounded-3xl border border-sand p-8 shadow-subtle">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-bone rounded-lg text-moss"><BookOpen size={18} /></div>
                  <h3 className="font-serif text-lg font-bold text-ink">Distribusi Etalase</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(stats.etalase.byType).map(([type, count]) => (
                    <div key={type} className="px-4 py-4 bg-bone/30 rounded-2xl border border-sand/50 group hover:border-forest/30 transition-all">
                      <p className="text-[10px] uppercase font-bold text-ash/60 tracking-wider mb-1 truncate" title={type.replace('_', ' ')}>
                        {type.replace('_', ' ')}
                      </p>
                      <p className="text-2xl font-bold text-ink">{count}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Updates & Tasks */}
            <div className="grid grid-cols-5 gap-8">
              {/* Recent Activity */}
              <div className="col-span-3 bg-white rounded-3xl border border-sand p-8 shadow-subtle">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="font-serif text-xl font-semibold text-ink">Aktivitas Konten Terkini</h3>
                  {allActivities.length > 5 && (
                    <button 
                      onClick={() => setShowActivityModal(true)}
                      className="text-[10px] font-bold text-forest hover:text-forest/80 uppercase tracking-widest flex items-center gap-1 transition-all"
                    >
                      Lihat Semua
                      <ChevronRight size={12} />
                    </button>
                  )}
                </div>
                <div className="space-y-6">
                  {allActivities.length > 0 ? allActivities.slice(0, 5).map((art) => (
                    <div key={art.id} className="flex items-start gap-5 group">
                      <div className="mt-1 w-10 h-10 rounded-full bg-bone flex items-center justify-center border border-sand text-ash group-hover:bg-forest group-hover:text-bone transition-all">
                        <CheckCircle2 size={18} />
                      </div>
                      <div className="flex-1 pb-6 border-b border-sand group-last:border-0 group-last:pb-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-bold text-ink line-clamp-2 max-w-[70%]">{art.author?.full_name || 'Admin'} mengunggah artikel</p>
                          <div className="flex items-center gap-1.5 text-ash text-[10px] uppercase font-bold tracking-widest whitespace-nowrap">
                            <Clock size={12} />
                            {formatDate(art.created_at)}
                          </div>
                        </div>
                        <p className="text-xs text-ash leading-relaxed break-words line-clamp-2 pr-10">
                          {art.title}
                        </p>
                      </div>
                    </div>
                  )) : (
                    <p className="text-center py-10 text-ash text-sm italic">Belum ada aktivitas konten.</p>
                  )}
                </div>
              </div>

              {/* Review Queue */}
              <div className="col-span-2 space-y-8">
                <div className="bg-white rounded-3xl border border-sand p-8 shadow-subtle">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-serif text-lg font-semibold text-ink">Antrian Review</h3>
                    <span className="text-[10px] font-bold text-clay bg-clay/5 px-2 py-1 rounded tracking-widest uppercase">Oldest First</span>
                  </div>
                  <div className="space-y-4">
                    {reviewQueue.length > 0 ? reviewQueue.slice(0, 5).map((art) => (
                      <Link 
                        key={art.id} 
                        to={`/4Dm1n_d4Shb04Rd/articles/${art.id}/review`}
                        className="flex items-center gap-4 p-4 rounded-2xl bg-bone/50 border border-sand hover:border-forest/30 transition-colors group"
                      >
                        <div className="w-2 h-2 rounded-full bg-clay animate-pulse"></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-ink line-clamp-2 group-hover:text-forest transition-colors leading-relaxed">
                            {art.title}
                          </p>
                          <p className="text-[10px] text-ash font-medium mt-1">Oleh: {art.author?.full_name || 'Anonim'}</p>
                        </div>
                        <ChevronRight size={14} className="text-ash group-hover:text-forest group-hover:translate-x-1 transition-all flex-shrink-0" />
                      </Link>
                    )) : (
                      <div className="text-center py-8">
                        <CheckCircle2 size={24} className="mx-auto text-forest/20 mb-2" />
                        <p className="text-xs text-ash italic">Antrian kosong.</p>
                      </div>
                    )}
                  </div>
                  {reviewQueue.length > 0 && (
                    <Link to="/4Dm1n_d4Shb04Rd/articles" className="mt-6 block text-center text-[10px] font-bold text-ash hover:text-forest uppercase tracking-widest transition-colors">
                      Lihat Semua Antrian
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      <ActivityModal 
        isOpen={showActivityModal}
        onClose={() => setShowActivityModal(false)}
        activities={allActivities}
      />
    </div>
  )
}
