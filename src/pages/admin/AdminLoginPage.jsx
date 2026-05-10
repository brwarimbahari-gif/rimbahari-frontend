import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { authApi, session } from '../../lib/api'

// ---------------------------------------------------------------------------
// Admin Login Page
// ---------------------------------------------------------------------------

export default function AdminLoginPage() {
  const navigate = useNavigate()

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      const { ok, data } = await authApi.login(email, password)
      
      if (!ok) {
        setError(data.error || 'Surel atau kata sandi salah.')
        setLoading(false)
        return
      }

      const { tokens, user } = data
      const isAuthorized = user.role === 'ADMIN' || user.is_staff || user.is_superuser
      
      if (isAuthorized) {
        session.save(tokens.access, tokens.refresh, user)
        localStorage.setItem('rh_admin_verified', 'true')
        navigate('/4Dm1n_d4Shb04Rd/')
      } else {
        setError('Akses ditolak. Anda bukan administrator.')
        setLoading(false)
      }
    } catch (err) {
      setError('Terjadi kesalahan koneksi.')
      setLoading(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#F2EDE4] flex items-center justify-center p-6 font-sans">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-[360px] p-8 md:p-10">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#1F3B2D] rounded-md flex items-center justify-center">
              <span className="text-[#F5EFE3] font-serif font-bold text-lg leading-none">R</span>
            </div>
            <span className="font-serif font-bold text-lg tracking-tight text-[#1F3B2D]">
              RIMBAHARI
            </span>
          </div>
          <div className="px-2.5 py-0.5 rounded-full border border-[#D9CFC1] bg-[#F5EFE3]/50">
            <span className="text-[9px] font-bold text-[#5C7A4A] tracking-widest uppercase">Admin</span>
          </div>
        </div>

        {/* Welcome */}
        <div className="mb-4">
          <h1 className="font-serif text-[24px] font-semibold text-[#1F3B2D] leading-tight mb-1.5">
            Selamat Datang
          </h1>
          <p className="text-[#8C8475] text-sm">
            Masuk ke panel administrasi.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="p-3 rounded-md bg-red-50 text-red-600 text-xs font-medium border border-red-100">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-[#8C8475] uppercase tracking-wider ml-1">
              Surel
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@institusi.ac.id"
              className="w-full bg-[#F5EFE3] border border-[#E5DFD3] rounded-md py-3.5 px-4 text-sm text-[#1F3B2D]
                placeholder:text-[#C5BDB0] focus:outline-none focus:ring-2 focus:ring-[#1F3B2D]/5 focus:border-[#1F3B2D] transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-[#8C8475] uppercase tracking-wider ml-1">
              Kata Sandi
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#F5EFE3] border border-[#E5DFD3] rounded-md py-3.5 px-4 text-sm text-[#1F3B2D]
                placeholder:text-[#C5BDB0] focus:outline-none focus:ring-2 focus:ring-[#1F3B2D]/5 focus:border-[#1F3B2D] transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1F3B2D] text-[#F5EFE3] font-bold py-3.5 rounded-md shadow-lg shadow-[#1F3B2D]/10
              hover:bg-[#2A4D3B] active:scale-[0.98] transition-all disabled:opacity-50 mt-2 text-sm"
          >
            {loading ? 'Memproses...' : 'Masuk'}
          </button>

          <div className="pt-4 flex justify-center">
            <Link 
              to="/home" 
              className="flex items-center gap-2 text-xs font-bold text-[#8C8475] hover:text-[#1F3B2D] uppercase tracking-widest transition-colors"
            >
              <ArrowLeft size={14} />
              Kembali ke Beranda
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
