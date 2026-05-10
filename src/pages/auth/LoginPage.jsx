import { useState, useEffect } from 'react'
import { Eye, EyeOff, ArrowLeft, Leaf, AlertCircle, MailCheck } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi, session } from '../../lib/api'

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

export default function LoginPage() {
  const navigate = useNavigate()

  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [emailNotVerified, setEmailNotVerified] = useState(false)

  // ── Handle Google Callback ──────────────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')

    if (code) {
      handleGoogleCallback(code)
    }
  }, [])

  const handleGoogleCallback = async (code) => {
    setGoogleLoading(true)
    setError('')
    
    // Hilangkan code dari URL agar bersih
    window.history.replaceState({}, document.title, window.location.pathname)

    const redirectUri = window.location.origin + '/login'
    const { ok, data } = await authApi.googleAuth(code, redirectUri)

    if (ok) {
      session.save(data.tokens.access, data.tokens.refresh, data.user)
      navigate(data.user.is_profile_complete ? '/home' : '/activate')
    } else {
      setError(data.error || 'Gagal masuk dengan Google. Coba lagi.')
    }
    setGoogleLoading(false)
  }

  const handleGoogleLogin = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    const redirectUri = window.location.origin + '/login'
    
    console.log('Initiating Google Login:', { clientId, redirectUri })

    if (!clientId) {
      setError('Konfigurasi Google Client ID tidak ditemukan. Periksa file .env atau Vercel Environment Variables.')
      console.error('VITE_GOOGLE_CLIENT_ID is missing!')
      return
    }

    const scope = encodeURIComponent('openid email profile')
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`
    
    window.location.href = googleAuthUrl
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setEmailNotVerified(false)

    const { ok, status, data } = await authApi.login(form.email, form.password)

    if (ok) {
      session.save(data.tokens.access, data.tokens.refresh, data.user)
      navigate(data.user.is_profile_complete ? '/home' : '/activate')
    } else if (status === 403 && data.email_verified === false) {
      if (session.getAccess()) {
        // Tokens from an earlier registration still exist — go straight to activation
        navigate('/activate', { replace: true })
      } else {
        setEmailNotVerified(true)
      }
    } else {
      setError(data.error || 'Terjadi kesalahan. Coba lagi.')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-bone flex">
      {/* Left — decorative panel */}
      <div className="hidden lg:flex lg:w-5/12 relative overflow-hidden flex-col justify-between p-12"
        style={{
          background: 'linear-gradient(160deg, #1F3B2D 0%, #2d5a3e 50%, #1A1814 100%)',
        }}
      >
        {/* Batik overlay */}
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23F5EFE3' fill-opacity='1'%3E%3Cpath d='M30 30l-8-8 8-8 8 8-8 8zm0-16l-8-8 8-8 8 8-8 8zm0 32l-8-8 8-8 8 8-8 8zM14 30l-8-8 8-8 8 8-8 8zm32 0l-8-8 8-8 8 8-8 8z'/%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="w-9 h-9 rounded-sm bg-bone/10 flex items-center justify-center">
            <span className="text-bone font-serif font-semibold text-base">R</span>
          </div>
          <span className="font-serif font-semibold text-xl text-bone tracking-tight">RIMBAHARI</span>
        </div>

        {/* Quote */}
        <div className="relative">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px w-8 bg-clay/50" />
            <span className="font-sans text-caption uppercase tracking-widest text-bone/50">
              Living Knowledge Hub
            </span>
          </div>
          <blockquote className="font-accent italic text-h2 text-bone leading-snug mb-6 max-w-sm">
            "Dari hutan, untuk semua — merawat warisan, menghidupkan pengetahuan."
          </blockquote>
          <div className="flex items-center gap-2 text-bone/40">
            <Leaf size={13} />
            <span className="font-sans text-caption uppercase tracking-widest">
              Pengetahuan Biokultural Nusantara
            </span>
          </div>
        </div>
      </div>

      {/* Right — login form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-16">
        {/* Back link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-ash hover:text-forest text-sm font-sans
            transition-colors duration-[240ms] mb-12 w-fit"
        >
          <ArrowLeft size={14} />
          Kembali ke Beranda
        </Link>

        <div className="max-w-sm w-full mx-auto lg:mx-0">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-serif text-h1 font-semibold text-ink mb-2">
              Selamat Datang
            </h1>
            <p className="font-sans text-body text-ash">
              Masuk ke akun RIMBAHARI-mu untuk mulai berkontribusi.
            </p>
          </div>

          {/* Email not verified banner */}
          {emailNotVerified && (
            <div className="flex items-start gap-3 bg-forest/8 border border-forest/20 rounded-lg px-4 py-3 mb-5">
              <MailCheck size={16} className="text-forest flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-sans text-caption text-forest leading-relaxed mb-1">
                  Email Anda belum diverifikasi. Daftar ulang untuk mendapatkan kode baru.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/register')}
                  className="font-sans text-caption text-forest underline underline-offset-4 hover:text-clay transition-colors duration-[240ms]"
                >
                  Daftar ulang →
                </button>
              </div>
            </div>
          )}

          {/* Error banner */}
          {error && (
            <div className="flex items-start gap-3 bg-clay/8 border border-clay/20 rounded-lg px-4 py-3 mb-5">
              <AlertCircle size={16} className="text-clay flex-shrink-0 mt-0.5" />
              <p className="font-sans text-caption text-clay leading-relaxed">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="font-sans text-caption uppercase tracking-widest text-ash font-medium">
                Surel
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="nama@institusi.ac.id"
                required
                className="bg-bone border border-sand rounded-lg px-4 py-3 font-sans text-sm text-ink
                  placeholder:text-ash/50 outline-none
                  focus:border-forest focus:ring-2 focus:ring-forest/15
                  transition-all duration-[240ms]"
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="font-sans text-caption uppercase tracking-widest text-ash font-medium">
                  Kata Sandi
                </label>
                <Link
                  to="/forgot-password"
                  className="font-sans text-caption text-forest hover:text-clay
                    transition-colors duration-[240ms] underline underline-offset-4"
                >
                  Lupa kata sandi?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  required
                  className="w-full bg-bone border border-sand rounded-lg px-4 py-3 pr-12 font-sans text-sm text-ink
                    placeholder:text-ash/50 outline-none
                    focus:border-forest focus:ring-2 focus:ring-forest/15
                    transition-all duration-[240ms]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-ash hover:text-forest
                    transition-colors duration-[240ms]"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary mt-2 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-bone/30 border-t-bone rounded-full animate-spin" />
                  Memproses…
                </span>
              ) : (
                'Masuk'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="section-divider my-8">
            <span className="font-sans text-caption text-ash/60 px-2">atau</span>
          </div>

          {/* Google login */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading || googleLoading}
            className="w-full flex items-center justify-center gap-3 bg-bone border border-sand
              rounded-lg px-4 py-3 font-sans text-sm font-medium text-ink
              hover:bg-sand/50 hover:border-ash/40
              transition-all duration-[240ms] active:scale-[0.98]
              disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {googleLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-forest/30 border-t-forest rounded-full animate-spin" />
                Menghubungkan…
              </span>
            ) : (
              <>
                <GoogleIcon />
                Masuk dengan Google
              </>
            )}
          </button>

          {/* Register link */}
          <p className="font-sans text-body text-ash text-center mt-6">
            Belum punya akun?{' '}
            <Link
              to="/register"
              className="text-forest font-medium underline underline-offset-4
                hover:text-clay transition-colors duration-[240ms]"
            >
              Daftar Sekarang
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
