import { useState, useEffect, useRef } from 'react'
import { 
  ChevronLeft, 
  Save, 
  Upload, 
  FileText, 
  Image as ImageIcon,
  X,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Layers,
  Download
} from 'lucide-react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { etalaseApi } from '../../lib/api'
import AdminSidebar from '../../components/AdminPage/AdminSidebar'
import ConfirmationModal from '../../components/AdminPage/ConfirmationModal'

// ---------------------------------------------------------------------------
// Admin Detail Etalase (Create/Edit)
// ---------------------------------------------------------------------------

export default function AdminDetailEtalase() {
  const { id } = useParams()
  const isEditMode = Boolean(id)
  const navigate = useNavigate()

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  const [formData, setFormData] = useState({
    title: '',
    pub_type: 'EZINE_KEHATI',
    year: new Date().getFullYear().toString(),
    description: '',
    file: null,
    cover_file: null
  })

  const [previews, setPreviews] = useState({
    cover: null,
    fileName: '',
    fileUrl: null
  })

  const [loading, setLoading] = useState(isEditMode)
  const [saving, setSaving] = useState(false)
  const [uploadStep, setUploadStep] = useState('') // '', 'INIT', 'PDF', 'COVER', 'CONFIRM'
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  const lastFetchedId = useRef(null)

  // ---------------------------------------------------------------------------
  // Data Fetching
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (isEditMode && lastFetchedId.current !== id) {
      fetchDetail()
      lastFetchedId.current = id
    }
  }, [id])

  const fetchDetail = async () => {
    try {
      const { ok, data } = await etalaseApi.detail(id)
      if (ok) {
        setFormData({
          title: data.title || '',
          pub_type: data.pub_type || 'EZINE_KEHATI',
          year: data.year?.toString() || new Date().getFullYear().toString(),
          description: data.description || '',
          file: null,
          cover_file: null
        })
        if (data.cover_url) {
          setPreviews(prev => ({ ...prev, cover: data.cover_url }))
        }
        if (data.file_url) {
           setPreviews(prev => ({ 
             ...prev, 
             fileName: data.file_url.split('/').pop(),
             fileUrl: data.file_url
           }))
        }
      } else {
        setError('Gagal memuat detail publikasi.')
      }
    } catch (err) {
      setError('Terjadi kesalahan koneksi.')
    } finally {
      setLoading(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e, type) => {
    const file = e.target.files[0]
    if (!file) return

    if (type === 'cover') {
      setFormData(prev => ({ ...prev, cover_file: file }))
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviews(prev => ({ ...prev, cover: reader.result }))
      }
      reader.readAsDataURL(file)
    } else {
      setFormData(prev => ({ ...prev, file: file }))
      setPreviews(prev => ({ ...prev, fileName: file.name }))
    }
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    if (saving) return

    setShowConfirmModal(false)
    setSaving(true)
    setUploadStep('INIT')
    setError('')
    setSuccess('')

    try {
      if (isEditMode) {
        // ── Edit Mode: Standard Multipart (Metadata & Cover only) ─────────────
        const payload = new FormData()
        payload.append('title', formData.title)
        payload.append('pub_type', formData.pub_type)
        payload.append('year', formData.year)
        payload.append('description', formData.description)
        if (formData.cover_file) payload.append('cover_file', formData.cover_file)
        
        const result = await etalaseApi.update(id, payload)
        if (!result.ok) throw result
      } else {
        // ── Create Mode: 4-Step GCP Handshake ────────────────────────────────
        if (!formData.file) {
          throw { data: { detail: 'File PDF wajib dipilih.' } }
        }

        // Step 1: Initiate
        const initRes = await etalaseApi.initiateUpload({
          pdf_content_type: formData.file.type,
          cover_content_type: formData.cover_file?.type || null
        })
        if (!initRes.ok) throw initRes
        const { publication_id, pdf_upload_url, pdf_path, cover_upload_url, cover_path } = initRes.data

        // Step 2: Upload PDF Binary
        setUploadStep('PDF')
        const pdfUp = await etalaseApi.uploadToGcs(pdf_upload_url, formData.file)
        if (!pdfUp.ok) throw pdfUp

        // Step 3: Upload Cover Binary (if any)
        if (formData.cover_file && cover_upload_url) {
          setUploadStep('COVER')
          const coverUp = await etalaseApi.uploadToGcs(cover_upload_url, formData.cover_file)
          if (!coverUp.ok) throw coverUp
        }

        // Step 4: Confirm
        setUploadStep('CONFIRM')
        const confirmRes = await etalaseApi.confirmUpload({
          publication_id,
          title: formData.title,
          pub_type: formData.pub_type,
          year: parseInt(formData.year),
          description: formData.description,
          pdf_path,
          cover_path: cover_path || null
        })
        if (!confirmRes.ok) throw confirmRes
      }

      setSuccess(isEditMode ? 'Publikasi berhasil diperbarui.' : 'Publikasi berhasil diunggah.')
      setTimeout(() => navigate('/4Dm1n_d4Shb04Rd/display'), 1500)
    } catch (result) {
      let msg = 'Gagal menyimpan publikasi.'
      if (result && result.data) {
        if (typeof result.data === 'string') {
          msg = result.data
        } else if (result.data.detail) {
          msg = result.data.detail
        } else if (result.data.message) {
          msg = result.data.message
        } else if (result.data.errors) {
          const firstKey = Object.keys(result.data.errors)[0]
          msg = `${firstKey}: ${result.data.errors[firstKey][0]}`
        } else {
          const keys = Object.keys(result.data)
          if (keys.length > 0) {
            const firstKey = keys[0]
            const errorVal = result.data[firstKey]
            msg = Array.isArray(errorVal) ? `${firstKey}: ${errorVal[0]}` : `${firstKey}: ${errorVal}`
          }
        }
      } else if (result instanceof Error) {
        msg = result.message
      }
      setError(msg)
    } finally {
      setSaving(false)
      setUploadStep('')
    }
  }

  // ---------------------------------------------------------------------------
  // Loading State
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="flex h-screen bg-[#FDFCF9]">
        <AdminSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-forest border-t-transparent rounded-full animate-spin" />
            <p className="text-ash font-medium animate-pulse">Memuat data publikasi...</p>
          </div>
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
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/4Dm1n_d4Shb04Rd/display')}
              className="p-2 hover:bg-bone rounded-full transition-colors text-ash"
            >
              <ChevronLeft size={20} />
            </button>
            <div>
              <h1 className="font-serif text-xl font-bold text-ink">
                {isEditMode ? 'Edit Publikasi' : 'Unggah Publikasi Baru'}
              </h1>
              <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-ash/40 tracking-widest">
                <span>Admin</span>
                <span className="text-[8px] opacity-30">/</span>
                <span>Etalase</span>
                <span className="text-[8px] opacity-30">/</span>
                <span className="text-forest">{isEditMode ? 'Edit' : 'Tambah'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowConfirmModal(true)}
              disabled={saving}
              className="px-8 py-2.5 bg-forest text-bone rounded-md text-sm font-bold shadow-warm hover:bg-forest/90 transition-all disabled:opacity-50 flex items-center gap-2 min-w-[140px] justify-center"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-bone border-t-transparent rounded-full animate-spin" />
                  <span>
                    {uploadStep === 'INIT' && 'Menyiapkan...'}
                    {uploadStep === 'PDF' && 'Unggah PDF...'}
                    {uploadStep === 'COVER' && 'Unggah Cover...'}
                    {uploadStep === 'CONFIRM' && 'Menyimpan...'}
                    {!uploadStep && 'Proses...'}
                  </span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>{isEditMode ? 'Simpan' : 'Unggah'}</span>
                </>
              )}
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-10 bg-[#FDFCF9]">
          <div className="max-w-4xl mx-auto pb-20">
            {/* Status Messages */}
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

            <form className="space-y-8" onSubmit={(e) => { e.preventDefault(); setShowConfirmModal(true); }}>
              {/* Basic Info Section */}
              <section className="bg-white rounded-lg border border-sand p-8 shadow-subtle space-y-6">
                <div className="flex items-center gap-3 pb-6 mb-2">
                  <div className="p-2.5 text-forest rounded-xl">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-ink">Informasi Publikasi</h3>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-ash tracking-widest px-1">Judul Publikasi</label>
                    <input 
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="Masukkan judul publikasi yang menarik..."
                      className="w-full bg-bone/30 border border-sand rounded-lg px-6 py-4 text-sm font-sans focus:outline-none focus:border-forest focus:ring-4 focus:ring-forest/5 transition-all placeholder:text-ash/30"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-ash tracking-widest px-1">Tipe Publikasi</label>
                      <select 
                        name="pub_type"
                        value={formData.pub_type}
                        onChange={handleInputChange}
                        className="w-full bg-bone/30 border border-sand rounded-lg px-4 py-3 text-sm font-sans focus:outline-none focus:border-forest transition-all"
                      >
                        <option value="EZINE_KEHATI">E-Zine Kehati</option>
                        <option value="EZINE_ETNOGRAFI">E-Zine Etnografi</option>
                        <option value="LAPORAN">Laporan Program</option>
                        <option value="LAINNYA">Lainnya</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-ash tracking-widest px-1">Tahun Terbit</label>
                      <input 
                        type="number"
                        name="year"
                        value={formData.year}
                        onChange={handleInputChange}
                        className="w-full bg-bone/30 border border-sand rounded-lg px-4 py-3 text-sm font-sans focus:outline-none focus:border-forest transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-ash tracking-widest px-1">Deskripsi Singkat</label>
                    <textarea 
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={4}
                      placeholder="Tuliskan deskripsi publikasi di sini..."
                      className="w-full bg-bone/30 border border-sand rounded-lg px-6 py-4 text-sm font-sans leading-relaxed focus:outline-none focus:border-forest focus:ring-4 focus:ring-forest/5 transition-all placeholder:text-ash/30"
                    />
                  </div>
                </div>
              </section>

              <div className="space-y-8">
                {/* Cover Preview Section */}
                <section className="bg-white rounded-lg border border-sand p-8 shadow-subtle space-y-4">
                  <label className="text-[10px] uppercase font-bold text-ash tracking-widest px-1">Cover Publikasi</label>
                  <div className="relative aspect-[16/11] w-full bg-bone rounded-2xl border-2 border-dashed border-sand overflow-hidden group">
                    {previews.cover ? (
                      <img src={previews.cover} alt="Cover Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                        <ImageIcon size={40} className="text-sand mb-4" />
                        <p className="text-xs font-bold text-ash mb-1">Upload Gambar Cover</p>
                        <p className="text-[10px] text-ash/40">Rasio 16:11 disarankan (PNG/JPG)</p>
                      </div>
                    )}
                    <input 
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'cover')}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    {previews.cover && (
                      <div className="absolute inset-0 bg-ink/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button type="button" className="text-white text-xs font-bold flex items-center gap-2">
                          <Upload size={16} />
                          Ganti Cover
                        </button>
                      </div>
                    )}
                  </div>
                </section>

                {/* File Upload Section */}
                <section className="bg-white rounded-lg border border-sand p-8 shadow-subtle space-y-6">
                  <div className="flex items-center justify-between pb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 text-forest rounded-xl">
                        <Upload size={20} />
                      </div>
                      <div>
                        <h3 className="font-serif font-bold text-ink">Dokumen Publikasi</h3>
                        <p className="text-[10px] text-ash uppercase tracking-wider font-bold opacity-60">Upload PDF Wajib</p>
                      </div>
                    </div>

                    {previews.fileUrl && (
                      <a 
                        href={previews.fileUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-bone rounded-xl text-[10px] uppercase font-bold text-ash hover:text-forest transition-all"
                      >
                        <Download size={14} />
                        Download File
                      </a>
                    )}
                  </div>

                  <div className="relative group">
                    <input 
                      type="file"
                      accept=".pdf"
                      onChange={(e) => handleFileChange(e, 'pdf')}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="border border-sand group-hover:border-forest group-hover:bg-forest/[0.02] rounded-lg p-10 transition-all flex flex-col items-center text-center">
                      <div className="w-16 h-16 bg-bone rounded-lg flex items-center justify-center text-ash mb-4">
                        <FileText size={32} />
                      </div>
                      <p className="text-sm font-bold text-ink mb-1">
                        {previews.fileName || 'Pilih atau drop file PDF'}
                      </p>
                      <p className="text-xs text-ash/60">Maksimal 50MB.</p>
                    </div>
                  </div>

                  {isEditMode && (
                    <div className="pt-6 border-t border-sand/30">
                      <h4 className="text-[10px] uppercase font-bold text-ash tracking-widest mb-4">Informasi Sistem</h4>
                      <div className="grid grid-cols-1 gap-4">
                        <div className="p-4 bg-bone/30 rounded-xl border border-sand/50">
                          <span className="text-[8px] uppercase font-bold text-ash/60 block mb-1">ID Publikasi</span>
                          <span className="text-xs font-mono text-ink font-bold break-all">{id}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </section>
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
          ? "Apakah Anda yakin ingin menyimpan perubahan pada publikasi ini? Perubahan akan langsung terlihat oleh pengguna."
          : "Apakah Anda yakin ingin mengunggah publikasi baru ini ke Etalase? Publikasi akan langsung dapat diakses oleh pengguna."
        }
        variant="success"
        details={!isEditMode ? {
          'Judul': formData.title || '(Tanpa Judul)',
          'Tipe': formData.pub_type,
          'Tahun': formData.year
        } : null}
        confirmText={isEditMode ? "Simpan Sekarang" : "Unggah Sekarang"}
        loading={saving}
      />
    </div>
  )
}
