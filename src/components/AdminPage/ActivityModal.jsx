import { X, Clock, CheckCircle2 } from 'lucide-react'

export default function ActivityModal({ isOpen, onClose, activities }) {
  if (!isOpen) return null

  const formatDate = (dateStr) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('id-ID', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative bg-[#FDFCF9] w-full max-w-2xl max-h-[80vh] rounded-3xl shadow-elevated border border-sand flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-8 border-b border-sand flex items-center justify-between bg-white">
          <div>
            <h2 className="font-serif text-2xl font-bold text-ink">Riwayat Aktivitas Konten</h2>
            <p className="text-xs text-ash mt-1 italic">Menampilkan seluruh riwayat unggahan artikel di platform.</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-bone rounded-full text-ash transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {activities.length > 0 ? activities.map((art) => (
            <div key={art.id} className="flex items-start gap-5 group">
              <div className="mt-1 w-10 h-10 rounded-full bg-bone flex items-center justify-center border border-sand text-ash group-hover:bg-forest group-hover:text-bone transition-all">
                <CheckCircle2 size={18} />
              </div>
              <div className="flex-1 pb-6 border-b border-sand group-last:border-0 group-last:pb-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-bold text-ink truncate max-w-[60%]">
                    {art.author?.full_name || 'Admin'} mengunggah artikel
                  </p>
                  <div className="flex items-center gap-1.5 text-ash text-[10px] uppercase font-bold tracking-widest whitespace-nowrap">
                    <Clock size={12} />
                    {formatDate(art.created_at)}
                  </div>
                </div>
                <p className="text-xs text-ash leading-relaxed break-words">
                  {art.title}
                </p>
              </div>
            </div>
          )) : (
            <div className="text-center py-20">
              <Clock size={40} className="mx-auto text-sand mb-4" />
              <p className="text-sm font-medium text-ash">Belum ada riwayat aktivitas yang tercatat.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-white border-t border-sand text-center">
          <button 
            onClick={onClose}
            className="px-8 py-2.5 bg-forest text-bone rounded-full text-xs font-bold shadow-warm hover:bg-forest/90 transition-all"
          >
            Tutup Riwayat
          </button>
        </div>
      </div>
    </div>
  )
}
