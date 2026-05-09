import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { LogIn, ShieldAlert } from 'lucide-react'

export default function SessionExpiredModal() {
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const handleExpired = () => {
      // Don't show if already on login page
      if (window.location.pathname.startsWith('/login')) return
      setIsOpen(true)
    }

    window.addEventListener('auth-expired', handleExpired)
    return () => window.removeEventListener('auth-expired', handleExpired)
  }, [])

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

  const handleLogin = () => {
    setIsOpen(false)
    navigate('/login', { state: { from: location.pathname } })
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-ink/60 backdrop-blur-sm animate-in fade-in duration-300" />
      
      {/* Modal Card */}
      <div className="relative w-full max-w-md bg-bone rounded-card shadow-elevated overflow-hidden animate-in zoom-in-95 fade-in duration-300">
        {/* Pattern Header */}
        <div 
          className="h-24 w-full flex items-center justify-center"
          style={{ background: 'linear-gradient(160deg, #1F3B2D 0%, #2A4F3C 55%, #162A20 100%)' }}
        >
           <div className="w-16 h-16 rounded-full bg-bone/10 flex items-center justify-center border border-bone/20">
             <ShieldAlert size={32} className="text-bone" />
           </div>
        </div>

        <div className="p-8 text-center">
          <h2 className="font-serif text-h2 font-semibold text-ink mb-3">
            Sesi Berakhir
          </h2>
          <p className="font-sans text-body text-ash leading-relaxed mb-8">
            Sesi login Anda telah habis demi keamanan. Silakan login kembali untuk melanjutkan aktivitas Anda di Rimbahari.
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleLogin}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3"
            >
              <LogIn size={18} />
              Halaman Login
            </button>
            <button
              onClick={() => {
                setIsOpen(false)
                navigate('/')
              }}
              className="font-sans text-sm text-ash hover:text-ink transition-colors"
            >
              Kembali ke Beranda
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
