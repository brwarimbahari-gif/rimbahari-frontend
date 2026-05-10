import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { 
  ChevronLeft, 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  Save, 
  Send, 
  X, 
  Search,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  AlignLeft,
  Users,
  MessageSquare
} from 'lucide-react'
import { articlesApi } from '../../lib/api'
import AdminSidebar from '../../components/AdminPage/AdminSidebar'
import ConfirmationModal from '../../components/AdminPage/ConfirmationModal'

// ---------------------------------------------------------------------------
// Admin Detail Artikel (Create/Edit)
// ---------------------------------------------------------------------------

export default function AdminDetailArtikel() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = Boolean(id)

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  const [formData, setFormData] = useState({
    title: '',
    abstract: '',
    content: '',
    content_type: 'ARTIKEL',
    status: 'DRAFT',
    reviewer_note: '',
    file: null,
    thumbnail_file: null,
    current_file_url: '',
    current_thumbnail_url: '',
    author: null,
    contributor_ids: []
  })

  const [loading, setLoading] = useState(isEditMode)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [contributorSearch, setContributorSearch] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [selectedContributors, setSelectedContributors] = useState([])
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [newlyCreatedId, setNewlyCreatedId] = useState(null)

  // ---------------------------------------------------------------------------
  // Data Fetching
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (isEditMode) {
      const fetchDetail = async () => {
        setLoading(true)
        const { ok, data } = await articlesApi.detail(id)
        if (ok) {
          setFormData({
            title: data.title || '',
            abstract: data.abstract || '',
            content: data.content || '',
            content_type: data.content_type || 'ARTIKEL',
            status: data.status || 'DRAFT',
            reviewer_note: data.reviewer_note || '',
            file: null,
            thumbnail_file: null,
            current_file_url: data.original_file_url || '',
            current_thumbnail_url: data.thumbnail_url || '',
            author: data.author || null,
            contributor_ids: data.contributors?.map(c => c.user.id) || []
          })
          setSelectedContributors(data.contributors?.map(c => c.user) || [])
        } else {
          setError('Gagal memuat detail artikel.')
        }
        setLoading(false)
      }
      fetchDetail()
    }
  }, [id, isEditMode])

  useEffect(() => {
    if (contributorSearch.length >= 2) {
      const search = async () => {
        const { ok, data } = await articlesApi.searchContributors(contributorSearch)
        if (ok) setSearchResults(data.filter(u => {
          const cid = u.profile_id || u.user_id
          return !formData.contributor_ids.includes(cid)
        }))
      }
      search()
    } else {
      setSearchResults([])
    }
  }, [contributorSearch, formData.contributor_ids])

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const [parsing, setParsing] = useState(false)
  const [parseError, setParseError] = useState('')

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e) => {
    const { name, files } = e.target
    if (files[0]) {
      setFormData(prev => ({ ...prev, [name]: files[0] }))
      // Reset error parsing saat file baru dipilih
      setParseError('')
    }
  }

  const handleParse = async () => {
    if (!formData.file || parsing) return
    
    setParsing(true)
    setParseError('')
    
    try {
      const fd = new FormData()
      fd.append('content_type', formData.content_type || 'ARTIKEL')
      fd.append('file', formData.file)
      
      // Gunakan endpoint create untuk parsing (sama seperti di ArticleUploadPage)
      const result = await articlesApi.create(fd)
      
      if (result.ok) {
        const art = result.data.article || result.data
        setFormData(prev => ({
          ...prev,
          title: art.title || prev.title,
          abstract: art.abstract || prev.abstract,
          content: art.content || prev.content
        }))
        
        // Jika sedang mode EDIT, hapus draf sementara yang baru saja dibuat oleh API create
        if (isEditMode) {
          const tempId = art.id
          if (tempId) {
            // Jalankan di background
            articlesApi.deleteArticle(tempId).catch(err => console.error('Gagal menghapus draf sementara:', err))
          }
        } else {
          const newId = art.id
          if (newId) {
            navigate(`/4Dm1n_d4Shb04Rd/articles/${newId}/edit`, { replace: true })
          }
        }
      } else {
        setParseError(result.data?.detail || result.data?.error || 'Gagal menganalisis dokumen.')
      }
    } catch (err) {
      setParseError('Terjadi kesalahan saat menghubungi server.')
    } finally {
      setParsing(false)
    }
  }

  const addContributor = (user) => {
    const id = user.profile_id || user.user_id
    setSelectedContributors(prev => [...prev, { ...user, id }])
    setFormData(prev => ({ 
      ...prev, 
      contributor_ids: [...prev.contributor_ids, id] 
    }))
    setContributorSearch('')
    setSearchResults([])
  }

  const removeContributor = (contributorId) => {
    setSelectedContributors(prev => prev.filter(u => u.id !== contributorId))
    setFormData(prev => ({ 
      ...prev, 
      contributor_ids: prev.contributor_ids.filter(id => id !== contributorId) 
    }))
  }

  const handleSaveClick = (e) => {
    if (e) e.preventDefault()
    setShowConfirmModal(true)
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    if (submitting) return

    setShowConfirmModal(false)
    setSubmitting(true)
    setError('')
    setSuccess('')

    const payload = new FormData()
    payload.append('title', formData.title)
    payload.append('abstract', formData.abstract)
    payload.append('content_type', formData.content_type)
    
    // Hanya kirim field ini jika dalam mode EDIT, karena CREATE akan ditolak backend (Error 400)
    if (isEditMode) {
      payload.append('status', formData.status)
      payload.append('reviewer_note', formData.reviewer_note)
      payload.append('content', formData.content)
    }
    
    if (formData.file) payload.append('file', formData.file)
    if (formData.thumbnail_file) payload.append('thumbnail_file', formData.thumbnail_file)
    
    formData.contributor_ids.forEach(id => {
      payload.append('contributor_ids', id)
    })

    try {
      let result
      if (isEditMode) {
        result = await articlesApi.update(id, payload)
        if (result.ok) {
          setSuccess('Artikel berhasil diperbarui.')
        }
      } else {
        result = await articlesApi.create(payload)
        
        if (result.ok) {
          const newArt = result.data.article || result.data
          const newId = newArt.id
          setNewlyCreatedId(newId)
          setShowSuccessModal(true)
        }
      }

      if (result && !result.ok) {
        const msg = result.data.detail || result.data.message || result.data.error || 'Gagal menyimpan artikel.'
        setError(msg)
      }
    } catch (err) {
      setError('Terjadi kesalahan sistem.')
    } finally {
      setSubmitting(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Loading State
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="flex h-screen bg-[#FDFCF9]">
        <AdminSidebar />
        <main className="flex-1 flex flex-col items-center justify-center">
          <Loader2 size={40} className="animate-spin text-forest opacity-20 mb-4" />
          <p className="text-sm font-medium text-ash">Memuat data artikel...</p>
        </main>
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
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/4Dm1n_d4Shb04Rd/articles')}
              className="p-2 hover:bg-bone rounded-full transition-colors text-ash"
            >
              <ChevronLeft size={20} />
            </button>
            <div>
              <h1 className="font-serif text-xl font-bold text-ink">
                {isEditMode ? 'Edit Artikel' : 'Tambah Artikel Baru'}
              </h1>
              <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-ash/40 tracking-widest">
                <span>Admin</span>
                <span className="text-[8px] opacity-30">/</span>
                <span>Artikel</span>
                <span className="text-[8px] opacity-30">/</span>
                <span className="text-forest">{isEditMode ? 'Edit' : 'Tambah'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={handleSaveClick}
              disabled={submitting}
              className="px-8 py-2.5 bg-forest text-bone rounded-md text-sm font-bold shadow-warm hover:bg-forest/90 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {isEditMode ? 'Simpan' : 'Unggah'}
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-10 bg-[#FDFCF9]">
          <div className="max-w-4xl mx-auto pb-20">
            
            {error && (
              <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-lg flex items-center gap-3 text-red-600 animate-in fade-in slide-in-from-top-2">
                <AlertCircle size={20} />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-8 p-4 bg-green-50 border border-green-100 rounded-lg flex items-center gap-3 text-forest animate-in fade-in slide-in-from-top-2">
                <CheckCircle2 size={20} />
                <p className="text-sm font-medium">{success}</p>
              </div>
            )}

            <form className="space-y-8" onSubmit={handleSubmit}>
              
              {/* Primary Content Stack */}
              <div className="space-y-8">
                
                {/* Informasi Artikel Section */}
                <section className="bg-white rounded-lg border border-sand p-8 shadow-subtle space-y-6">
                  <div className="flex items-center gap-3 pb-6 border-b border-sand/30 mb-2">
                    <div className="p-2.5 text-forest">
                      <FileText size={20} />
                    </div>
                    <div>
                      <h3 className="font-serif font-bold text-ink">Informasi Artikel</h3>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-ash tracking-widest px-1">Judul Artikel</label>
                      <input 
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        placeholder="Masukkan judul artikel yang bermartabat..."
                        className="w-full bg-bone/30 border border-sand rounded-lg px-6 py-4 text-sm font-serif focus:outline-none focus:border-forest focus:ring-4 focus:ring-forest/5 transition-all placeholder:text-ash/30"
                      />
                    </div>

                    <div className={`grid ${isEditMode ? 'grid-cols-2' : 'grid-cols-1'} gap-6`}>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold text-ash tracking-widest px-1">Tipe Konten</label>
                        <select 
                          name="content_type"
                          value={formData.content_type}
                          onChange={handleInputChange}
                          className="w-full bg-bone/30 border border-sand rounded-lg px-4 py-3 text-sm font-sans focus:outline-none focus:border-forest transition-all"
                        >
                          <option value="ARTIKEL">Artikel</option>
                          <option value="OPINION">Opini</option>
                          <option value="VIGNETTE">Vignette</option>
                        </select>
                      </div>

                      {isEditMode && (
                        <div className="space-y-2">
                          <label className="text-[10px] uppercase font-bold text-ash tracking-widest px-1">Status Publikasi</label>
                          <select 
                            name="status"
                            value={formData.status}
                            onChange={handleInputChange}
                            className="w-full bg-bone/30 border border-sand rounded-lg px-4 py-3 text-sm font-sans focus:outline-none focus:border-forest transition-all"
                          >
                            <option value="DRAFT">Draft</option>
                            <option value="IN_REVIEW">Dalam Review</option>
                            <option value="REVISION">Perlu Revisi</option>
                            <option value="PUBLISHED">Diterbitkan</option>
                            <option value="REJECTED">Ditolak</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                </section>

                {/* Abstract Section */}
                <section className="bg-white rounded-lg border border-sand p-8 shadow-subtle space-y-4">
                  <div className="flex items-center gap-3 pb-4 mb-2">
                    <div className="p-2 text-forest">
                      <AlignLeft size={20} />
                    </div>
                    <label className="text-[10px] uppercase font-bold text-ash tracking-widest">Abstrak / Ringkasan</label>
                  </div>
                  <textarea 
                    name="abstract"
                    value={formData.abstract}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder="Tuliskan ringkasan singkat artikel di sini..."
                    className="w-full bg-bone/30 border border-sand rounded-lg px-6 py-4 text-sm font-sans leading-relaxed focus:outline-none focus:border-forest focus:ring-4 focus:ring-forest/5 transition-all"
                  />
                  <p className="text-[10px] text-ash/60 px-1 italic">Maksimal 500 karakter untuk ringkasan di halaman feed.</p>
                </section>

                {isEditMode && (
                  <>
                    {/* Reviewer Note Section */}
                    <section className="bg-white rounded-lg border border-sand p-8 shadow-subtle space-y-4">
                      <div className="flex items-center justify-between pb-4 mb-2">
                        <div className="flex items-center gap-3">
                          <div className="p-2 text-forest">
                            <MessageSquare size={20} />
                          </div>
                          <label className="text-[10px] uppercase font-bold text-ash tracking-widest">Catatan Reviewer</label>
                        </div>
                      </div>
                      <textarea 
                        name="reviewer_note"
                        value={formData.reviewer_note}
                        onChange={handleInputChange}
                        rows={4}
                        placeholder="Berikan masukan atau alasan jika artikel memerlukan revisi atau ditolak..."
                        className="w-full bg-bone/30 border border-sand rounded-lg px-6 py-4 text-sm font-sans leading-relaxed focus:outline-none focus:border-forest focus:ring-4 focus:ring-forest/5 transition-all italic text-ash/80"
                      />
                      <p className="text-[10px] text-ash/60 px-1">Catatan ini akan terlihat oleh penulis jika status diatur ke REVISI atau DITOLAK.</p>
                    </section>

                    {/* Content Section */}
                    <section className="bg-white rounded-lg border border-sand p-8 shadow-subtle space-y-4">
                      <div className="flex items-center justify-between pb-4 mb-2">
                        <div className="flex items-center gap-3">
                          <div className="p-2 text-forest">
                            <FileText size={20} />
                          </div>
                          <label className="text-[10px] uppercase font-bold text-ash tracking-widest">Isi Artikel (Konten)</label>
                        </div>
                        <span className="text-[10px] text-forest font-bold bg-forest/5 px-2 py-1 rounded">Auto-parsed</span>
                      </div>
                      <textarea 
                        name="content"
                        value={formData.content}
                        onChange={handleInputChange}
                        rows={12}
                        placeholder="Konten artikel akan muncul di sini setelah file diunggah dan diproses..."
                        className="w-full bg-bone/30 border border-sand rounded-lg px-6 py-4 text-sm font-sans leading-relaxed focus:outline-none focus:border-forest focus:ring-4 focus:ring-forest/5 transition-all"
                      />
                      <p className="text-[10px] text-ash/60 px-1 italic">Anda dapat mengedit hasil parsing manual jika diperlukan.</p>
                    </section>
                  </>
                )}

                {/* File Upload Section */}
                <section className="bg-white rounded-lg border border-sand p-8 shadow-subtle space-y-6">
                  <div className="flex items-center justify-between pb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 text-forest">
                        <Upload size={20} />
                      </div>
                      <div>
                        <h3 className="font-serif font-bold text-ink">File Dokumen Utama</h3>
                        <p className="text-[10px] text-ash uppercase tracking-wider font-bold opacity-60">PDF / DOCX Wajib</p>
                      </div>
                    </div>
                    {formData.current_file_url && !formData.file && (
                      <div className="flex items-center gap-2">
                        <a 
                          href={formData.current_file_url} 
                          download
                          className="flex items-center gap-2 px-3 py-1.5 bg-forest/5 text-forest rounded-md text-[10px] font-bold hover:bg-forest/10 transition-colors"
                        >
                          <Save size={12} />
                          Unduh
                        </a>
                      </div>
                    )}
                  </div>
                  
                  <div className="relative group cursor-pointer">
                    <input 
                      type="file" 
                      name="file"
                      onChange={handleFileChange}
                      accept=".pdf,.docx"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                    />
                    <div className="border-2 border-sand group-hover:border-forest rounded-lg p-10 flex flex-col items-center justify-center gap-4 transition-all bg-bone/10 group-hover:bg-forest/[0.02]">
                      <div className="w-16 h-16 rounded-full bg-bone/50 flex items-center justify-center text-ash group-hover:text-forest transition-colors">
                        {formData.file || formData.current_file_url ? <FileText size={32} className="text-forest" /> : <Upload size={32} />}
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-ink mb-1">
                          {formData.file ? formData.file.name : (formData.current_file_url ? 'Ganti dokumen saat ini' : 'Pilih file dokumen artikel')}
                        </p>
                        <p className="text-xs text-ash mt-1">Tarik dan lepas file ke sini atau klik untuk memilih</p>
                      </div>
                    </div>
                  </div>

                  {formData.file && (
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handleParse}
                        disabled={parsing}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-sans text-xs font-bold border transition-all duration-300 ${
                          parsing 
                            ? 'bg-sand text-ash border-sand cursor-not-allowed'
                            : 'bg-forest/5 text-forest border-forest/20 hover:bg-forest hover:text-white'
                        }`}
                      >
                        {parsing ? (
                          <><Loader2 size={14} className="animate-spin" /> Menganalisis...</>
                        ) : (
                          <>Analisis Dokumen</>
                        )}
                      </button>
                      <span className="text-[10px] text-ash">Ekstrak judul & konten otomatis</span>
                    </div>
                  )}

                  {parseError && (
                    <div className="flex items-center gap-2 text-clay p-3 bg-clay/5 rounded-lg border border-clay/10">
                      <AlertCircle size={14} />
                      <p className="text-xs font-medium">{parseError}</p>
                    </div>
                  )}

                  {isEditMode && (
                    <div className="pt-6 border-t border-sand/30">
                      <h4 className="text-[10px] uppercase font-bold text-ash tracking-widest mb-4">Informasi Sistem</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-bone/30 rounded-lg border border-sand/50">
                          <span className="text-[8px] uppercase font-bold text-ash/60 block mb-1">ID Artikel</span>
                          <span className="text-xs font-mono text-ink font-bold break-all">{id}</span>
                        </div>
                        {formData.author && (
                          <div className="p-4 bg-bone/30 rounded-lg border border-sand/50 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-forest/10 flex items-center justify-center text-forest text-xs font-bold">
                              {formData.author.full_name?.charAt(0)}
                            </div>
                            <div>
                              <span className="text-[8px] uppercase font-bold text-ash/60 block mb-0.5">Penulis Utama</span>
                              <span className="text-xs font-bold text-ink">{formData.author.full_name}</span>
                            </div>
                          </div>
                        )}
                      </div>
                      <p className="text-[10px] text-ash/40 mt-4 italic">* Informasi peninjau (reviewer) saat ini belum tersedia di API dan memerlukan update pada backend serializers.</p>
                    </div>
                  )}
                </section>

                <div className="space-y-8">
                  {/* Thumbnail Section */}
                <section className="bg-white rounded-lg border border-sand p-8 shadow-subtle space-y-4">
                  <div className="flex items-center justify-between pb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 text-forest">
                        <ImageIcon size={20} />
                      </div>
                      <label className="text-[10px] uppercase font-bold text-ash tracking-widest">Thumbnail Cover</label>
                    </div>
                    {formData.current_thumbnail_url && !formData.thumbnail_file && (
                      <a 
                        href={formData.current_thumbnail_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-1.5 bg-forest/5 text-forest rounded-md text-[10px] font-bold hover:bg-forest/10 transition-colors"
                      >
                        <Upload size={12} className="rotate-180" />
                        Lihat
                      </a>
                    )}
                  </div>
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-bone border border-sand flex items-center justify-center group">
                    {formData.thumbnail_file ? (
                      <img 
                        src={URL.createObjectURL(formData.thumbnail_file)} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                      />
                    ) : formData.current_thumbnail_url ? (
                      <img 
                        src={formData.current_thumbnail_url} 
                        alt="Current Thumbnail" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-ash/40">
                        <ImageIcon size={32} />
                        <span className="text-[10px] font-bold">16:9 Recommended</span>
                      </div>
                    )}
                    <input 
                      type="file" 
                      name="thumbnail_file"
                      onChange={handleFileChange}
                      accept="image/*"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                    />
                    <div className="absolute inset-0 bg-ink/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button type="button" className="text-white text-xs font-bold flex items-center gap-2">
                        <Upload size={16} />
                        Ganti Thumbnail
                      </button>
                    </div>
                  </div>
                  <p className="text-[10px] text-ash/60 text-center italic">Format: JPG, PNG, atau WebP. Maksimal 5MB.</p>
                </section>

                {/* Contributors Section */}
                <section className="bg-white rounded-lg border border-sand p-8 shadow-subtle space-y-6">
                  <div className="flex items-center gap-3 pb-4">
                    <div className="p-2 text-forest">
                      <Users size={20} />
                    </div>
                    <label className="text-[10px] uppercase font-bold text-ash tracking-widest">Kontributor Tambahan</label>
                  </div>
                  
                  {/* Search Contributor */}
                  <div className="relative">
                    <div className="flex items-center gap-2 bg-bone/30 border border-sand rounded-lg px-4 py-2.5 focus-within:border-forest transition-colors">
                      <Search size={16} className="text-ash" />
                      <input 
                        type="text"
                        placeholder="Cari nama kontributor..."
                        value={contributorSearch}
                        onChange={(e) => setContributorSearch(e.target.value)}
                        className="bg-transparent border-none focus:outline-none text-xs font-sans w-full"
                      />
                    </div>

                    {/* Search Results Dropdown */}
                    {searchResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-sand rounded-lg shadow-elevated z-30 overflow-hidden animate-in fade-in slide-in-from-top-2">
                        <div className="max-h-60 overflow-y-auto">
                          {searchResults.map(user => {
                            const cid = user.profile_id || user.user_id
                            return (
                              <button
                                key={cid}
                                type="button"
                                onClick={() => addContributor(user)}
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-bone transition-colors text-left group"
                              >
                              <div className="w-8 h-8 rounded-full bg-forest/10 flex items-center justify-center text-forest text-xs font-bold">
                                {user.full_name.charAt(0)}
                              </div>
                              <div>
                                <p className="text-xs font-bold text-ink">{user.full_name}</p>
                                <p className="text-[10px] text-ash italic">{user.role_category || 'Kontributor'}</p>
                              </div>
                              <Plus size={14} className="ml-auto text-ash group-hover:text-forest" />
                            </button>
                          )})}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Selected Contributors List */}
                  <div className="space-y-2">
                    {selectedContributors.map(user => (
                      <div key={user.id} className="flex items-center gap-3 p-3 bg-bone/50 rounded-lg border border-sand/50 group">
                        <div className="w-8 h-8 rounded-full bg-forest/10 flex items-center justify-center text-forest text-xs font-bold">
                          {user.full_name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-bold text-ink">{user.full_name}</p>
                          <p className="text-[10px] text-ash italic">{user.role_category || 'Kontributor'}</p>
                        </div>
                        <button 
                          type="button"
                          onClick={() => removeContributor(user.id)}
                          className="p-1.5 text-ash hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                    {selectedContributors.length === 0 && (
                      <div className="py-8 text-center border-2 border-sand/50 rounded-lg">
                        <p className="text-[10px] text-ash font-medium">Belum ada kontributor tambahan</p>
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </div>

            </form>
          </div>
        </div>
      </main>

      <ConfirmationModal 
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleSubmit}
        title={isEditMode ? "Konfirmasi Perubahan" : "Konfirmasi Unggah"}
        message={isEditMode 
          ? "Apakah Anda yakin ingin menyimpan perubahan pada artikel ini? Pastikan data yang dimasukkan sudah sesuai."
          : "Apakah Anda yakin ingin menerbitkan artikel baru ini? Artikel akan langsung tersedia di sistem sesuai status yang dipilih."
        }
        details={!isEditMode ? {
          judul: formData.title || '(Tanpa Judul)',
          penulis: 'Admin',
          tipe: formData.content_type
        } : null}
        confirmText={isEditMode ? "Simpan Sekarang" : "Unggah"}
        variant="info"
        loading={submitting}
      />

      {/* ── Success Modal ────────────────────────────────────────── */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl border border-sand shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="relative p-8 text-center">
              <div className="mx-auto w-20 h-20 rounded-full bg-forest/10 flex items-center justify-center mb-6">
                <CheckCircle2 size={40} className="text-forest" />
              </div>
              
              <h2 className="font-serif text-2xl font-bold text-ink mb-2">Artikel Berhasil Dibuat</h2>
              <p className="text-sm text-ash mb-8 leading-relaxed">
                Dokumen telah berhasil diunggah dan disimpan sebagai draf. Apa yang ingin Anda lakukan selanjutnya?
              </p>

              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={() => {
                    setShowSuccessModal(false)
                    navigate(`/4Dm1n_d4Shb04Rd/articles/${newlyCreatedId}/edit`)
                    window.location.reload() // Force reload to enter edit mode properly
                  }}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-forest text-white rounded-xl font-bold text-sm hover:bg-forest/90 transition-all shadow-lg shadow-forest/20 active:scale-[0.98]"
                >
                  <Save size={18} />
                  Lanjut Edit (Atur Status & Konten)
                </button>
                
                <button
                  onClick={() => navigate('/4Dm1n_d4Shb04Rd/articles')}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-bone border border-sand text-ink rounded-xl font-bold text-sm hover:bg-sand/30 transition-all active:scale-[0.98]"
                >
                  <AlignLeft size={18} />
                  Kembali ke Daftar Artikel
                </button>
              </div>
            </div>
            
            <div className="px-8 py-4 bg-bone/50 border-t border-sand/30 flex justify-center">
              <p className="text-[10px] text-ash uppercase font-bold tracking-widest opacity-60">Rimbahari Editorial System</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
