import { useEffect } from 'react'
import { X, AlertCircle, Trash2, CheckCircle2 } from 'lucide-react'

export default function ConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Konfirmasi", 
  message = "Apakah Anda yakin ingin melanjutkan?", 
  confirmText = "Konfirmasi",
  cancelText = "Batalkan",
  variant = "danger", // danger | warning | info | success
  details = null, // { judul, penulis, tipe }
  loading = false,
  confirmDisabled = false
}) {
  
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  const theme = {
    danger: {
      bg: 'bg-[#A83E3E]',
      text: 'text-[#A83E3E]',
      btn: 'bg-[#A83E3E] hover:bg-[#8B3434]',
      icon: <Trash2 size={32} className="text-white" />
    },
    warning: {
      bg: 'bg-[#C48A3E]',
      text: 'text-[#C48A3E]',
      btn: 'bg-[#C48A3E] hover:bg-[#A67534]',
      icon: <AlertCircle size={32} className="text-white" />
    },
    info: {
      bg: 'bg-[#1F3B2D]',
      text: 'text-[#1F3B2D]',
      btn: 'bg-[#1F3B2D] hover:bg-[#5C7A4A]',
      icon: <CheckCircle2 size={32} className="text-white" />
    },
    success: {
      bg: 'bg-[#2A4F3C]',
      text: 'text-[#2A4F3C]',
      btn: 'bg-[#2A4F3C] hover:bg-[#1F3B2D]',
      icon: <CheckCircle2 size={32} className="text-white" />
    }
  }[variant] || theme.info

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#1A1814]/60 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={onClose}
      />
      
      {/* Modal Card */}
      <div className="relative w-full max-w-md bg-[#F5EFE3] rounded-3xl shadow-elevated overflow-hidden animate-in zoom-in-95 fade-in duration-300 border border-[#E8DCC4]">
        {/* Header Icon Section */}
        <div className={`h-24 w-full flex items-center justify-center relative ${theme.bg}`}>
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/60 hover:text-white transition-colors z-10"
          >
            <X size={20} />
          </button>
          
          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center border border-white/20 backdrop-blur-sm">
            {theme.icon}
          </div>
        </div>

        <div className="p-8">
          <h2 className="font-serif text-2xl font-bold text-[#1A1814] text-center mb-4">
            {title}
          </h2>
          
          <p className="font-sans text-sm text-[#6B665E] text-center leading-relaxed mb-6">
            {message}
          </p>

          {details && (
            <div className="bg-[#E8DCC4]/30 rounded-2xl p-5 mb-8 border border-[#E8DCC4]/50 space-y-3">
              {Object.entries(details).map(([key, value]) => (
                <div key={key} className="flex gap-4">
                  <span className="text-[10px] uppercase font-bold text-[#6B665E] tracking-widest w-20 pt-0.5">{key}</span>
                  <span className="text-sm font-medium text-[#1A1814] leading-relaxed flex-1">{value}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-[#E8DCC4] rounded-xl font-sans text-sm font-bold text-[#6B665E] hover:bg-[#E8DCC4]/50 transition-all"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={loading || confirmDisabled}
              className={`flex-1 px-6 py-3 rounded-xl font-sans text-sm font-bold text-white shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${theme.btn} disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100`}
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  {variant === 'danger' && <Trash2 size={18} />}
                  {(variant === 'success' || variant === 'info') && <CheckCircle2 size={18} />}
                  {variant === 'warning' && <AlertCircle size={18} />}
                </>
              )}
              {loading ? 'Memproses...' : confirmText}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
