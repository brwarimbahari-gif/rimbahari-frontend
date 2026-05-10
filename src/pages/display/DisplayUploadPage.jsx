import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Upload, X, FileText, AlertCircle, CheckCircle2, Loader2, ExternalLink } from 'lucide-react'
import Navbar from '../../components/Navbar'
import { etalaseApi, session } from '../../lib/api'

const PUB_TYPES = [
  { value: 'EZINE_KEHATI',      label: 'E-zine Kehati'        },
  { value: 'EZINE_ETNOGRAFI',   label: 'Etnografi Multimedia' },
  { value: 'LAPORAN',           label: 'Laporan Program'      },
  { value: 'LAINNYA',           label: 'Lainnya'              },
]

const CURRENT_YEAR = new Date().getFullYear()

function FileDrop({ label, accept, hint, file, onFile, onRemove, existingUrl, existingLabel }) {
  const [drag, setDrag] = useState(false)
  const ref = useRef(null)

  const handleDrop = (e) => {
    e.preventDefault(); setDrag(false)
    const f = e.dataTransfer.files[0]
    if (f) onFile(f)
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-sans text-caption uppercase tracking-widest text-ash font-medium">{label}</label>

      {file ? (
        <div className="flex items-center gap-3 border rounded-lg px-4 py-3 bg-forest/5 border-forest/20">
          <div className="w-9 h-9 rounded-lg bg-forest/10 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 size={16} className="text-forest" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-sans text-sm font-medium text-ink truncate">{file.name}</p>
            <p className="font-sans text-caption text-moss">{(file.size / (1024*1024)).toFixed(1)} MB</p>
          </div>
          <button type="button" onClick={onRemove} className="text-ash/50 hover:text-clay transition-colors duration-[240ms]">
            <X size={15} />
          </button>
        </div>
      ) : existingUrl ? (
        <div className="flex items-center gap-3 border rounded-lg px-4 py-3 bg-sand/20 border-sand">
          <div className="w-9 h-9 rounded-lg bg-sand/60 flex items-center justify-center flex-shrink-0">
            <FileText size={16} className="text-ash" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-sans text-sm font-medium text-ink">{existingLabel ?? 'File tersedia'}</p>
            <a href={existingUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-sans text-caption text-forest hover:text-clay transition-colors duration-[240ms]">
              Lihat file <ExternalLink size={10} />
            </a>
          </div>
          <button type="button" onClick={() => ref.current?.click()}
            className="flex-shrink-0 px-3 py-1.5 rounded-lg border border-sand font-sans text-xs text-ash hover:text-forest hover:border-forest/40 transition-all duration-[240ms]">
            Ganti
          </button>
        </div>
      ) : (
        <div
          onClick={() => ref.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
          onDragLeave={() => setDrag(false)}
          onDrop={handleDrop}
          className={`flex items-center gap-4 px-5 py-4 rounded-lg border-2 border-dashed cursor-pointer transition-all duration-[240ms] ${
            drag ? 'border-forest bg-forest/5' : 'border-sand hover:border-forest/40 hover:bg-sand/20'
          }`}
        >
          <div className="w-9 h-9 rounded-lg bg-sand/60 flex items-center justify-center flex-shrink-0">
            <Upload size={16} className={drag ? 'text-forest' : 'text-ash'} />
          </div>
          <div>
            <p className="font-sans text-sm font-medium text-ink">
              Seret ke sini atau <span className="text-forest underline underline-offset-2">pilih file</span>
            </p>
            <p className="font-sans text-caption text-ash mt-0.5">{hint}</p>
          </div>
        </div>
      )}

      <input ref={ref} type="file" accept={accept} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f) }} />
    </div>
  )
}

export default function DisplayUploadPage() {
  const { pubId } = useParams()   // defined → edit mode
  const navigate   = useNavigate()
  const user       = session.getUser()
  const canManage  = user?.role === 'ADMIN' || user?.role === 'MODERATOR' || user?.is_staff || user?.is_superuser
  const isEdit     = Boolean(pubId)

  // ── Form fields ───────────────────────────────────────────────────────
  const [title, setTitle]       = useState('')
  const [pubType, setPubType]   = useState('')
  const [year, setYear]         = useState(String(CURRENT_YEAR))
  const [description, setDescription] = useState('')

  // ── Files ─────────────────────────────────────────────────────────────
  const [pdfFile, setPdfFile]     = useState(null)
  const [coverFile, setCoverFile] = useState(null)

  // ── Existing URLs (edit mode) ─────────────────────────────────────────
  const [existingFileUrl, setExistingFileUrl]   = useState('')
  const [existingCoverUrl, setExistingCoverUrl] = useState('')

  // ── State ─────────────────────────────────────────────────────────────
  const [loading, setLoading]     = useState(isEdit)
  const [submitting, setSubmitting] = useState(false)
  const [uploadStep, setUploadStep] = useState('') // '', 'INIT', 'PDF', 'COVER', 'CONFIRM'
  const [fieldErrors, setFieldErrors] = useState({})
  const [serverError, setServerError] = useState('')

  useEffect(() => {
    if (!session.getAccess()) { navigate('/login', { replace: true }); return }
    if (!canManage)           { navigate('/home',  { replace: true }); return }
    if (isEdit) loadExisting()
  }, [pubId])

  const loadExisting = async () => {
    setLoading(true)
    const { ok, data } = await etalaseApi.detail(pubId)
    if (ok) {
      setTitle(data.title ?? '')
      setPubType(data.pub_type ?? '')
      setYear(String(data.year ?? CURRENT_YEAR))
      setDescription(data.description ?? '')
      setExistingFileUrl(data.file_url ?? '')
      setExistingCoverUrl(data.cover_url ?? '')
    } else {
      setServerError('Gagal memuat data publikasi.')
    }
    setLoading(false)
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    if (submitting) return

    setSubmitting(true); setFieldErrors({}); setServerError(''); setUploadStep('INIT')

    try {
      // 1. Initiate Upload
      const initiateRes = await etalaseApi.initiateUpload({
        pdf_content_type: pdfFile.type || 'application/pdf',
        cover_content_type: coverFile ? (coverFile.type || 'image/jpeg') : null
      })

      if (!initiateRes.ok) {
        throw new Error(initiateRes.data?.error || initiateRes.data?.detail || 'Gagal menginisiasi upload.')
      }

      const { publication_id, pdf_upload_url, cover_upload_url, pdf_path, cover_path } = initiateRes.data

      // 2. Upload PDF
      setUploadStep('PDF')
      const pdfUploadRes = await etalaseApi.uploadToGcs(pdf_upload_url, pdfFile, pdfFile.type || 'application/pdf')
      if (!pdfUploadRes.ok) throw new Error('Gagal mengunggah file PDF ke storage.')

      // 3. Upload Cover (if any)
      if (coverFile && cover_upload_url) {
        setUploadStep('COVER')
        const coverUploadRes = await etalaseApi.uploadToGcs(cover_upload_url, coverFile, coverFile.type || 'image/jpeg')
        if (!coverUploadRes.ok) throw new Error('Gagal mengunggah file cover ke storage.')
      }

      // 4. Confirm Upload
      setUploadStep('CONFIRM')
      const confirmRes = await etalaseApi.confirmUpload({
        publication_id,
        title: title.trim(),
        pub_type: pubType,
        year: parseInt(year),
        description: description.trim(),
        pdf_path,
        cover_path
      })

      if (confirmRes.ok) {
        navigate('/display/manage')
      } else {
        throw new Error(confirmRes.data?.error || confirmRes.data?.detail || 'Gagal menyimpan publikasi ke database.')
      }

    } catch (err) {
      setServerError(err.message)
      setUploadStep('')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bone">
        <Navbar />
        <main className="pt-16">
          <div className="max-w-2xl mx-auto px-4 md:px-6 py-12 animate-pulse flex flex-col gap-6">
            <div className="h-8 bg-sand rounded w-1/2" />
            <div className="h-64 bg-sand/40 rounded-card" />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bone">
      <Navbar />

      <main className="pt-16">
        <div className="max-w-2xl mx-auto px-4 md:px-6 py-8 md:py-12">

          {/* Heading */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-3">
              <div className="h-px w-8 bg-clay/50" />
              <span className="tag">Etalase</span>
            </div>
            <h1 className="font-serif text-h1 font-semibold text-ink leading-tight">
              {isEdit ? 'Edit ' : 'Unggah '}
              <em className="font-accent italic text-clay">
                {isEdit ? 'Publikasi' : 'Publikasi Baru'}
              </em>
            </h1>
            {isEdit && title && (
              <p className="font-sans text-body text-ash mt-2 line-clamp-1">{title}</p>
            )}
          </div>

          {serverError && (
            <div className="flex items-start gap-3 bg-clay/8 border border-clay/20 rounded-lg px-4 py-3 mb-6">
              <AlertCircle size={16} className="text-clay flex-shrink-0 mt-0.5" />
              <p className="font-sans text-caption text-clay leading-relaxed">{serverError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">

            {/* ── Metadata ─────────────────────────────────────── */}
            <div className="bg-white rounded-card border border-sand shadow-subtle overflow-hidden">
              <div className="px-6 pt-5 pb-4 border-b border-sand">
                <div className="flex items-center gap-3 mb-1"><div className="h-px w-6 bg-clay/50" /></div>
                <h2 className="font-serif text-h3 font-semibold text-ink">Metadata</h2>
              </div>
              <div className="px-6 py-5 flex flex-col gap-5">

                {/* Title */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-sans text-caption uppercase tracking-widest text-ash font-medium">
                    Judul <span className="text-clay">*</span>
                  </label>
                  <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                    placeholder="Judul publikasi" required maxLength={300}
                    className={`bg-bone border rounded-lg px-4 py-3 font-sans text-sm text-ink placeholder:text-ash/40 outline-none focus:ring-2 transition-all duration-[240ms] ${
                      fieldErrors.title ? 'border-clay focus:border-clay focus:ring-clay/15' : 'border-sand focus:border-forest focus:ring-forest/15'
                    }`} />
                  {fieldErrors.title && <p className="font-sans text-caption text-clay">{fieldErrors.title[0]}</p>}
                </div>

                {/* pub_type + year (side by side) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-sans text-caption uppercase tracking-widest text-ash font-medium">
                      Tipe Publikasi <span className="text-clay">*</span>
                    </label>
                    <select value={pubType} onChange={(e) => setPubType(e.target.value)} required
                      className={`bg-bone border rounded-lg px-4 py-3 font-sans text-sm text-ink outline-none focus:ring-2 transition-all duration-[240ms] cursor-pointer ${
                        fieldErrors.pub_type ? 'border-clay focus:border-clay focus:ring-clay/15' : 'border-sand focus:border-forest focus:ring-forest/15'
                      }`}>
                      <option value="" disabled>Pilih tipe…</option>
                      {PUB_TYPES.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                    {fieldErrors.pub_type && <p className="font-sans text-caption text-clay">{fieldErrors.pub_type[0]}</p>}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-sans text-caption uppercase tracking-widest text-ash font-medium">
                      Tahun <span className="text-clay">*</span>
                    </label>
                    <input type="number" value={year} onChange={(e) => setYear(e.target.value)}
                      min={2000} max={CURRENT_YEAR + 1} required
                      className={`bg-bone border rounded-lg px-4 py-3 font-sans text-sm text-ink placeholder:text-ash/40 outline-none focus:ring-2 transition-all duration-[240ms] font-tabular ${
                        fieldErrors.year ? 'border-clay focus:border-clay focus:ring-clay/15' : 'border-sand focus:border-forest focus:ring-forest/15'
                      }`} />
                    {fieldErrors.year && <p className="font-sans text-caption text-clay">{fieldErrors.year[0]}</p>}
                  </div>
                </div>

                {/* Description */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-sans text-caption uppercase tracking-widest text-ash font-medium">
                    Deskripsi <span className="normal-case text-ash/50 ml-1">(opsional)</span>
                  </label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                    placeholder="Deskripsi singkat publikasi…" rows={3}
                    className="bg-bone border border-sand rounded-lg px-4 py-3 font-sans text-sm text-ink placeholder:text-ash/40 outline-none focus:border-forest focus:ring-2 focus:ring-forest/15 transition-all duration-[240ms] resize-none" />
                </div>

              </div>
            </div>

            {/* ── Files ────────────────────────────────────────── */}
            <div className="bg-white rounded-card border border-sand shadow-subtle overflow-hidden">
              <div className="px-6 pt-5 pb-4 border-b border-sand">
                <div className="flex items-center gap-3 mb-1"><div className="h-px w-6 bg-clay/50" /></div>
                <h2 className="font-serif text-h3 font-semibold text-ink">File</h2>
              </div>
              <div className="px-6 py-5 flex flex-col gap-5">

                {/* PDF (required for new, read-only hint for edit) */}
                {isEdit ? (
                  <div className="flex flex-col gap-1.5">
                    <label className="font-sans text-caption uppercase tracking-widest text-ash font-medium flex items-center gap-2">
                      File PDF
                      <span className="normal-case text-ash/50 font-normal">— tidak dapat diubah setelah upload</span>
                    </label>
                    {existingFileUrl ? (
                      <a href={existingFileUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-3 px-4 py-3 rounded-lg border border-sand bg-sand/20 hover:border-forest/40 transition-all duration-[240ms] group">
                        <FileText size={16} className="text-forest flex-shrink-0" />
                        <span className="font-sans text-sm text-ink group-hover:text-forest transition-colors duration-[240ms] flex-1 truncate">
                          Dokumen PDF tersedia
                        </span>
                        <ExternalLink size={13} className="text-ash/40 flex-shrink-0" />
                      </a>
                    ) : (
                      <p className="font-sans text-caption text-ash/60 italic">Tidak ada file PDF.</p>
                    )}
                    {fieldErrors.pdf_file && <p className="font-sans text-caption text-clay">{fieldErrors.pdf_file[0]}</p>}
                  </div>
                ) : (
                  <FileDrop
                    label={<>File PDF <span className="text-clay ml-0.5">*</span></>}
                    accept=".pdf,application/pdf"
                    hint="PDF, maksimal 50MB"
                    file={pdfFile}
                    onFile={setPdfFile}
                    onRemove={() => setPdfFile(null)}
                  />
                )}
                {!isEdit && fieldErrors.pdf_file && <p className="font-sans text-caption text-clay -mt-3">{fieldErrors.pdf_file[0]}</p>}

                {/* Cover (optional, editable) */}
                <FileDrop
                  label={<>Cover / Thumbnail <span className="font-normal text-ash/50 text-xs ml-1">(opsional)</span></>}
                  accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                  hint="JPG, PNG, atau WebP — ditampilkan sebagai thumbnail"
                  file={coverFile}
                  onFile={setCoverFile}
                  onRemove={() => setCoverFile(null)}
                  existingUrl={existingCoverUrl}
                  existingLabel="Cover tersedia"
                />
                {fieldErrors.cover_file && <p className="font-sans text-caption text-clay -mt-3">{fieldErrors.cover_file[0]}</p>}

              </div>
            </div>

            {/* ── Submit ───────────────────────────────────────── */}
            <div className="flex flex-col gap-2">
              <button type="submit" disabled={submitting || (!isEdit && !pdfFile) || !title.trim() || !pubType}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
                {submitting
                  ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      {uploadStep === 'INIT' && 'Menyiapkan...'}
                      {uploadStep === 'PDF' && 'Mengunggah PDF...'}
                      {uploadStep === 'COVER' && 'Mengunggah Cover...'}
                      {uploadStep === 'CONFIRM' && 'Menyimpan...'}
                      {!uploadStep && (isEdit ? 'Menyimpan...' : 'Mengunggah...')}
                    </>
                  )
                  : <><CheckCircle2 size={14} />{isEdit ? 'Simpan Perubahan' : 'Unggah Publikasi'}</>
                }
              </button>
              <button type="button" onClick={() => navigate('/display/manage')}
                className="w-full py-2 font-sans text-sm text-ash hover:text-ink transition-colors duration-[240ms] text-center">
                Batal
              </button>
            </div>

          </form>
        </div>
      </main>
    </div>
  )
}
