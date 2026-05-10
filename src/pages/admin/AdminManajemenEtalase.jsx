import { useState, useEffect, useCallback } from 'react'
import { 
  Search, 
  Plus, 
  ChevronRight, 
  Filter, 
  MoreVertical, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Eye,
  EyeOff,
  Trash2,
  Edit3,
  Loader2,
  Download,
  X,
  ChevronDown,
  FileText,
  LogOut
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { etalaseApi, session } from '../../lib/api'
import AdminSidebar from '../../components/AdminPage/AdminSidebar'
import ConfirmationModal from '../../components/AdminPage/ConfirmationModal'
import Pagination from '../../components/AdminPage/Pagination'

// ---------------------------------------------------------------------------
// Admin Manajemen Etalase
// ---------------------------------------------------------------------------

export default function AdminManajemenEtalase() {
  const navigate = useNavigate()

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  const [publications, setPublications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [selectedYear, setSelectedYear] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedIds, setSelectedIds] = useState([])
  const [bulkAction, setBulkAction] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [pubToDelete, setPubToDelete] = useState(null)
  const [isBulkDelete, setIsBulkDelete] = useState(false)

  // Pagination State
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [paginationData, setPaginationData] = useState({
    total: 0,
    totalPages: 1
  })
  const [visibleColumns, setVisibleColumns] = useState({
    judul: true,
    tipe: true,
    tahun: true,
    statistik: true,
    pengunggah: false,
    dibuat: true
  })
  const [showColumnToggle, setShowColumnToggle] = useState(false)

  // ---------------------------------------------------------------------------
  // Auth Guard
  // ---------------------------------------------------------------------------
  const handleLogout = () => {
    session.clear()
    localStorage.removeItem('rh_admin_verified')
    navigate('/login', { replace: true })
  }

  // ---------------------------------------------------------------------------
  // Data Fetching
  // ---------------------------------------------------------------------------
  const fetchPublications = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const filters = {
        page,
        page_size: pageSize
      }
      if (selectedType && selectedType !== 'Semua Tipe') {
        filters.pub_type = selectedType
      }
      if (selectedYear && selectedYear !== 'Semua Tahun') {
        filters.year = selectedYear
      }
      // Note: Backend etalase doesn't have 'q' filter yet in the view, 
      // but we'll use local search for now as before.

      const { ok, data } = await etalaseApi.list(filters)
      if (ok) {
        let results = data.results || []
        if (searchTerm) {
          const q = searchTerm.toLowerCase()
          results = results.filter(p => 
            p.title?.toLowerCase().includes(q) || 
            p.description?.toLowerCase().includes(q)
          )
        }
        setPublications(results)
        setPaginationData({
          total: data.pagination?.total || results.length,
          totalPages: data.pagination?.total_pages || 1
        })
      } else {
        setError('Gagal memuat data etalase.')
      }
    } catch (err) {
      setError('Terjadi kesalahan koneksi.')
    } finally {
      setLoading(false)
    }
  }, [selectedType, selectedYear, searchTerm, page, pageSize])

  useEffect(() => {
    fetchPublications()
  }, [fetchPublications])

  // Reset to page 1 when filters or search changes
  useEffect(() => {
    setPage(1)
  }, [selectedType, selectedYear, searchTerm])

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      fetchPublications()
    }
  }

  const toggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === publications.length && publications.length > 0) {
      setSelectedIds([])
    } else {
      setSelectedIds(publications.map(p => p.id))
    }
  }

  const handleBulkGo = () => {
    if (bulkAction === 'delete' && selectedIds.length > 0) {
      setIsBulkDelete(true)
      setShowDeleteModal(true)
    }
  }

  const openDeleteModal = (pub = null) => {
    if (pub) {
      setPubToDelete(pub)
      setIsBulkDelete(false)
      setShowDeleteModal(true)
    }
  }

  const confirmDelete = async () => {
    try {
      if (isBulkDelete) {
        for (const id of selectedIds) {
          await etalaseApi.delete(id)
        }
        setPublications(prev => prev.filter(p => !selectedIds.includes(p.id)))
        setSelectedIds([])
        setBulkAction('')
      } else if (pubToDelete) {
        const { ok } = await etalaseApi.delete(pubToDelete.id)
        if (ok) {
          setPublications(prev => prev.filter(p => p.id !== pubToDelete.id))
        }
      }
    } catch (err) {
      alert('Terjadi kesalahan saat menghapus.')
    } finally {
      setShowDeleteModal(false)
      setPubToDelete(null)
    }
  }

  const toggleColumn = (col) => {
    setVisibleColumns(prev => ({ ...prev, [col]: !prev[col] }))
  }

  const formatPubType = (type) => {
    const map = {
      'EZINE_KEHATI': 'E-Zine Kehati',
      'EZINE_ETNOGRAFI': 'E-Zine Etnografi',
      'LAPORAN': 'Laporan',
      'LAINNYA': 'Lainnya'
    }
    return map[type] || type
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return d.toLocaleString('id-ID', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric'
    })
  }

  const currentYear = new Date().getFullYear()
  const years = []
  for (let y = currentYear; y >= 2000; y--) {
    years.push(y.toString())
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="flex h-screen bg-[#FDFCF9]">
      <AdminSidebar />
      <ConfirmationModal 
        isOpen={showDeleteModal} 
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Hapus Publikasi"
        message={`Apakah Anda yakin ingin menghapus ${isBulkDelete ? selectedIds.length + ' publikasi' : 'publikasi ini'}?`}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header Section */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-sand flex items-center justify-between px-10 z-10">
          <div className="flex items-center gap-4 flex-1">
            <p className="text-xs font-sans text-ash italic">Manajemen publikasi dan produk digital RIMBAHARI.</p>
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

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-10">
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* Breadcrumbs & Title */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-serif text-3xl font-bold text-ink mb-2">Etalase</h1>
                <div className="flex items-center gap-2 text-xs font-sans text-ash/60">
                  <span>Beranda</span>
                  <ChevronRight size={12} />
                  <span className="text-forest font-medium">Etalase</span>
                </div>
              </div>
              <Link 
                to="/4Dm1n_d4Shb04Rd/display/new"
                className="bg-forest text-bone px-6 py-3 rounded-lg font-sans text-sm font-bold shadow-warm flex items-center gap-2 hover:bg-forest/90 transition-all active:scale-95"
              >
                <Plus size={18} />
                Tambah Publikasi
              </Link>
            </div>

            {/* Filters & Column Toggle */}
            <div className="bg-white rounded-lg border border-sand p-6 shadow-subtle space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <select 
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="bg-bone/50 border border-sand rounded-lg px-4 py-2.5 text-sm font-sans focus:outline-none focus:border-forest"
                  >
                    <option value="">Semua Tipe</option>
                    <option value="EZINE_KEHATI">E-Zine Kehati</option>
                    <option value="EZINE_ETNOGRAFI">E-Zine Etnografi</option>
                    <option value="LAPORAN">Laporan</option>
                    <option value="LAINNYA">Lainnya</option>
                  </select>

                  <select 
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="bg-bone/50 border border-sand rounded-lg px-4 py-2.5 text-sm font-sans focus:outline-none focus:border-forest"
                  >
                    <option value="">Semua Tahun</option>
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>

                  <div className="h-8 w-px bg-sand mx-2"></div>

                  <div className="relative">
                    <button 
                      onClick={() => setShowColumnToggle(!showColumnToggle)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-sand text-ash hover:text-forest hover:border-forest transition-all text-sm font-medium"
                    >
                      <Filter size={16} />
                      Kolom Tabel
                    </button>
                    
                    {showColumnToggle && (
                      <div className="absolute left-0 mt-2 w-56 bg-white border border-sand rounded-lg shadow-elevated z-30 p-4 space-y-3">
                        <p className="text-[10px] uppercase font-bold text-ash/40 tracking-widest mb-2 px-1">Tampilkan Kolom</p>
                        {Object.keys(visibleColumns).map((col) => (
                          <label key={col} className="flex items-center justify-between cursor-pointer group">
                            <span className="text-sm text-ash group-hover:text-ink capitalize">{col}</span>
                            <button 
                              onClick={() => toggleColumn(col)}
                              className={`p-1.5 rounded-lg transition-colors ${visibleColumns[col] ? 'text-forest bg-forest/5' : 'text-ash/30 hover:text-ash/60'}`}
                            >
                              {visibleColumns[col] ? <Eye size={16} /> : <EyeOff size={16} />}
                            </button>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Bulk Actions UI */}
                  {selectedIds.length > 0 && (
                    <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-4 duration-300">
                      <div className="relative group">
                        <select 
                          className="appearance-none bg-white border border-forest rounded-lg px-4 py-2.5 pr-10 text-sm font-sans font-bold text-forest focus:outline-none focus:ring-2 focus:ring-forest/10 cursor-pointer transition-all"
                          value={bulkAction}
                          onChange={(e) => setBulkAction(e.target.value)}
                        >
                          <option value="">Aksi Massal</option>
                          <option value="delete">Hapus Terpilih</option>
                        </select>
                        <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-forest pointer-events-none" />
                      </div>
                      <button 
                        onClick={handleBulkGo}
                        className="bg-forest text-bone px-5 py-2.5 rounded-lg font-sans text-sm font-bold shadow-warm hover:bg-forest/90 transition-all active:scale-95 flex items-center gap-2"
                      >
                        Jalankan
                      </button>
                      <div className="h-8 w-px bg-sand mx-1"></div>
                      <p className="text-xs font-bold text-forest tracking-tight bg-forest/5 px-3 py-2 rounded-lg">
                        {selectedIds.length} terpilih
                      </p>
                    </div>
                  )}

                  <div className="bg-bone/50 border border-sand rounded-lg px-4 py-2.5 flex items-center gap-2 focus-within:border-forest transition-colors">
                    <Search size={14} className="text-ash" />
                    <input 
                      type="text" 
                      placeholder="Cari publikasi..." 
                      className="bg-transparent border-none focus:outline-none text-sm font-sans w-48"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={handleSearch}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Table Area */}
            <div className="bg-white rounded-lg border border-sand shadow-subtle overflow-hidden min-h-[400px] flex flex-col">
              {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center p-20 text-ash">
                  <Loader2 size={40} className="animate-spin mb-4 text-forest opacity-20" />
                  <p className="text-sm font-medium animate-pulse">Memuat data etalase...</p>
                </div>
              ) : error ? (
                <div className="flex-1 flex flex-col items-center justify-center p-20 text-center">
                  <AlertCircle size={40} className="text-red-200 mb-4" />
                  <p className="text-sm font-bold text-ink mb-1">Gagal Memuat Data</p>
                  <p className="text-xs text-ash mb-6">{error}</p>
                  <button 
                    onClick={fetchPublications}
                    className="px-4 py-2 bg-forest text-bone rounded-lg text-xs font-bold"
                  >
                    Coba Lagi
                  </button>
                </div>
              ) : publications.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-20 text-center">
                  <Download size={40} className="text-sand mb-4" />
                  <p className="text-sm font-bold text-ink mb-1">Etalase Kosong</p>
                  <p className="text-xs text-ash">Belum ada publikasi yang sesuai dengan filter saat ini.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-bone/30 border-b border-sand">
                      <th className="py-5 px-6 w-12">
                        <input 
                          type="checkbox" 
                          className="rounded border-sand text-forest focus:ring-forest cursor-pointer" 
                          checked={selectedIds.length === publications.length && publications.length > 0}
                          onChange={toggleSelectAll}
                        />
                      </th>
                      {visibleColumns.judul && <th className="py-5 px-6 font-serif font-bold text-ink text-sm">Judul Publikasi</th>}
                      {visibleColumns.tipe && <th className="py-5 px-6 font-serif font-bold text-ink text-sm">Tipe</th>}
                      {visibleColumns.tahun && <th className="py-5 px-6 font-serif font-bold text-ink text-sm text-center">Tahun</th>}
                      {visibleColumns.statistik && <th className="py-5 px-6 font-serif font-bold text-ink text-sm">Statistik</th>}
                      {visibleColumns.pengunggah && <th className="py-5 px-6 font-serif font-bold text-ink text-sm">Admin</th>}
                      {visibleColumns.dibuat && <th className="py-5 px-6 font-serif font-bold text-ink text-sm">Dibuat</th>}
                      <th className="py-5 px-6 font-serif font-bold text-ink text-sm text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sand">
                    {publications.map((pub) => (
                      <tr 
                        key={pub.id} 
                        className={`hover:bg-bone/10 transition-all group border-b border-sand/50 ${selectedIds.includes(pub.id) ? 'bg-forest/[0.03]' : ''}`}
                      >
                        <td className="py-4 px-6">
                          <input 
                            type="checkbox" 
                            className="rounded border-sand text-forest focus:ring-forest cursor-pointer transition-transform active:scale-90" 
                            checked={selectedIds.includes(pub.id)}
                            onChange={() => toggleSelect(pub.id)}
                          />
                        </td>
                        {visibleColumns.judul && (
                          <td className="py-4 px-6 max-w-md">
                            <div className="flex items-center gap-3">
                              <div className="w-16 h-11 rounded-md bg-bone border border-sand flex-shrink-0 overflow-hidden shadow-sm">
                                {pub.cover_url ? (
                                  <img src={pub.cover_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-ash/20">
                                    <FileText size={16} />
                                  </div>
                                )}
                              </div>
                              <p className="text-sm font-medium text-ink leading-relaxed line-clamp-2 group-hover:text-forest transition-colors cursor-pointer" title={pub.title}>
                                {pub.title}
                              </p>
                            </div>
                          </td>
                        )}
                        {visibleColumns.tipe && (
                          <td className="py-4 px-6 text-[10px] text-ash font-bold uppercase tracking-widest">
                            {formatPubType(pub.pub_type)}
                          </td>
                        )}
                        {visibleColumns.tahun && (
                          <td className="py-4 px-6 text-sm text-ink font-medium text-center">
                            {pub.year}
                          </td>
                        )}
                        {visibleColumns.statistik && (
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3 text-ash">
                              <div className="flex items-center gap-1" title="Views">
                                <Eye size={12} className="opacity-40" />
                                <span className="text-[11px] font-bold">{pub.views_count || 0}</span>
                              </div>
                              <div className="flex items-center gap-1" title="Downloads">
                                <Download size={12} className="opacity-40" />
                                <span className="text-[11px] font-bold">{pub.downloads_count || 0}</span>
                              </div>
                            </div>
                          </td>
                        )}
                        {visibleColumns.pengunggah && (
                          <td className="py-4 px-6 text-xs text-ink font-medium">
                            {pub.uploaded_by?.full_name || 'Admin'}
                          </td>
                        )}
                        {visibleColumns.dibuat && (
                          <td className="py-4 px-6 text-[10px] text-ash/70 font-medium">
                            {formatDate(pub.created_at)}
                          </td>
                        )}
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Link 
                              to={`/4Dm1n_d4Shb04Rd/display/${pub.id}/edit`}
                              className="p-2 text-ash hover:text-forest hover:bg-forest/5 rounded-lg transition-all" 
                              title="Edit"
                            >
                              <Edit3 size={16} />
                            </Link>
                            <button 
                              onClick={() => openDeleteModal(pub)}
                              className="p-2 text-ash hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Hapus"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <Pagination 
              total={paginationData.total}
              page={page}
              pageSize={pageSize}
              totalPages={paginationData.totalPages}
              onPageChange={setPage}
            />

          </div>
        </div>
      </main>

      <ConfirmationModal 
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Konfirmasi Penghapusan"
        message={isBulkDelete 
          ? `Apakah Anda yakin ingin menghapus ${selectedIds.length} publikasi etalase yang dipilih secara permanen? Tindakan ini tidak dapat dibatalkan.`
          : `Apakah Anda yakin ingin menghapus publikasi ini secara permanen? Tindakan ini tidak dapat dibatalkan.`
        }
        details={!isBulkDelete && pubToDelete ? {
          judul: pubToDelete.title,
          tipe: formatPubType(pubToDelete.pub_type),
          tahun: pubToDelete.year
        } : null}
        confirmText="Hapus Permanen"
        variant="danger"
      />
    </div>
  )
}
