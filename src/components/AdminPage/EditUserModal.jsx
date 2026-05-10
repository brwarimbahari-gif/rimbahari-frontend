import { useState, useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'

export default function EditUserModal({ isOpen, onClose, onConfirm, user }) {
  const [role, setRole] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (user) {
      setRole(user.role || '')
    }
  }, [user, isOpen])

  if (!isOpen || !user) return null

  const roles = [
    { value: 'ADMIN', label: 'Administrator', color: 'text-red-600' },
    { value: 'MODERATOR', label: 'Moderator', color: 'text-blue-600' },
    { value: 'REVIEWER', label: 'Reviewer', color: 'text-forest' },
    { value: 'MAHASISWA', label: 'Mahasiswa', color: 'text-ash' },
    { value: 'AKADEMISI', label: 'Akademisi', color: 'text-ash' },
    { value: 'PEMUDA_ADAT', label: 'Pemuda Adat', color: 'text-ash' },
    { value: 'AKTIVIS', label: 'Aktivis', color: 'text-ash' },
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    await onConfirm(user.id, { role })
    setSubmitting(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-white w-full max-w-md rounded-2xl shadow-elevated overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="p-6 border-b border-sand flex items-center justify-between bg-bone/30">
          <div className="flex items-center gap-3">
            <div>
              <h3 className="font-serif text-lg font-bold text-ink">Ubah Role Pengguna</h3>
              <p className="text-[10px] uppercase font-bold text-ash/40 tracking-widest">Update Akses Level</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-sand/50 rounded-full transition-colors text-ash">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-4">
            <div className="p-4 bg-bone/50 rounded-xl border border-sand">
              <p className="text-[10px] uppercase font-bold text-ash/60 tracking-widest mb-1">Pengguna</p>
              <p className="text-sm font-bold text-ink">{user.full_name}</p>
              <p className="text-xs text-ash">{user.email}</p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-ash/60 tracking-widest px-1">Pilih Role Baru</label>
              <div className="grid grid-cols-1 gap-2">
                {roles.map((r) => (
                  <label 
                    key={r.value}
                    className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      role === r.value 
                        ? 'border-forest bg-forest/5 shadow-sm' 
                        : 'border-sand bg-white hover:border-sand-dark'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-bold ${role === r.value ? 'text-forest' : 'text-ash'}`}>
                        {r.label}
                      </span>
                    </div>
                    <input 
                      type="radio" 
                      name="role" 
                      value={r.value}
                      checked={role === r.value}
                      onChange={(e) => setRole(e.target.value)}
                      className="hidden"
                    />
                    {role === r.value && (
                      <div className="w-2 h-2 rounded-full bg-forest animate-pulse" />
                    )}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3.5 rounded-xl border border-sand text-sm font-bold text-ash hover:bg-bone transition-all"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3.5 rounded-xl bg-forest text-bone text-sm font-bold shadow-warm hover:bg-forest/90 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Menyimpan...
                </>
              ) : (
                'Simpan Perubahan'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
