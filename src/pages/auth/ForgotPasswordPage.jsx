import { useState } from 'react'
import { ArrowLeft, Leaf, Send, CheckCircle, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../../lib/api'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()

  const [email, setEmail]         = useState('')
  const [code, setCode]           = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [codeSent, setCodeSent]   = useState(false)
  const [sendingCode, setSendingCode] = useState(false)
  const [sendError, setSendError] = useState('')
  const [loading, setLoading]     = useState(false)
  const [verifyError, setVerifyError] = useState('')
  const [verified, setVerified]   = useState(false)
  const [cooldown, setCooldown]   = useState(0)

  // Countdown for resend button
  const startCooldown = () => {
    setCooldown(60)
    const tick = () => setCooldown(c => {
      if (c <= 1) return 0
      setTimeout(tick, 1000)
      return c - 1
    })
    setTimeout(tick, 1000)
  }

  const passwordsMatch = confirmPassword === '' || newPassword === confirmPassword

  const handleSendCode = async () => {
    if (!email.trim() || sendingCode) return
    setSendingCode(true)
    setSendError('')
    const { ok, data } = await authApi.forgotPassword(email.trim())
    if (ok) {
      setCodeSent(true)
      startCooldown()
    } else {
      setSendError(data?.error ?? data?.detail ?? 'Gagal mengirim kode. Pastikan email terdaftar.')
    }
    setSendingCode(false)
  }

  const handleResend = async () => {
    if (cooldown > 0 || sendingCode) return
    setSendingCode(true)
    setSendError('')
    const { ok, data } = await authApi.forgotPassword(email.trim())
    if (ok) startCooldown()
    else setSendError(data?.error ?? data?.detail ?? 'Gagal mengirim ulang kode.')
    setSendingCode(false)
  }

  const handleVerify = async (e) => {
    e.preventDefault()
    if (!code.trim() || !newPassword || !confirmPassword) return
    if (newPassword !== confirmPassword) {
      setVerifyError('Konfirmasi kata sandi tidak cocok.')
      return
    }
    if (newPassword.length < 8) {
      setVerifyError('Kata sandi minimal 8 karakter.')
      return
    }

    setLoading(true)
    setVerifyError('')
    const { ok, data } = await authApi.resetPassword(email.trim(), code.trim(), newPassword, confirmPassword)
    if (ok) {
      setVerified(true)
    } else {
      // Backend error format mapping
      const errMsg = Array.isArray(data?.errors) ? data.errors[0] : 
                    (data?.error ?? data?.detail ?? 'Kode OTP salah atau kata sandi tidak memenuhi syarat.')
      setVerifyError(errMsg)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-bone flex">

      {/* ── Left panel ───────────────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-5/12 relative overflow-hidden flex-col justify-between p-12"
        style={{ background: 'linear-gradient(160deg, #1A1814 0%, #1F3B2D 55%, #2A4F3C 100%)' }}
      >
        <div className="absolute inset-0 opacity-[0.05]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23F5EFE3' fill-opacity='1'%3E%3Cpath d='M30 30l-8-8 8-8 8 8-8 8zm0-16l-8-8 8-8 8 8-8 8zm0 32l-8-8 8-8 8 8-8 8zM14 30l-8-8 8-8 8 8-8 8zm32 0l-8-8 8-8 8 8-8 8z'/%3E%3C/g%3E%3C/svg%3E")`
        }} />
        <div className="relative flex items-center gap-3">
          <div className="w-9 h-9 rounded-sm bg-bone/10 flex items-center justify-center">
            <span className="text-bone font-serif font-semibold text-base">R</span>
          </div>
          <span className="font-serif font-semibold text-xl text-bone tracking-tight">RIMBAHARI</span>
        </div>
        <div className="relative">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-px w-8 bg-clay/50" />
            <span className="font-sans text-caption uppercase tracking-widest text-bone/50">Keamanan Akun</span>
          </div>
          <blockquote className="font-accent italic text-h2 text-bone leading-snug mb-5 max-w-xs">
            "Tenang — kami akan membantumu mendapatkan akses kembali."
          </blockquote>
          <div className="flex items-center gap-2 text-bone/40">
            <Leaf size={13} />
            <span className="font-sans text-caption uppercase tracking-widest">Pemulihan Akun</span>
          </div>
        </div>
      </div>

      {/* ── Right — form ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-16">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-ash hover:text-forest text-sm font-sans
            transition-colors duration-[240ms] mb-12 w-fit"
        >
          <ArrowLeft size={14} /> Kembali ke Masuk
        </Link>

        <div className="max-w-sm w-full mx-auto lg:mx-0">

          {/* ── Success state ─────────────────────────────── */}
          {verified ? (
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-moss/15 flex items-center justify-center mx-auto mb-5">
                <CheckCircle size={28} className="text-moss" />
              </div>
              <h1 className="font-serif text-h1 font-semibold text-ink mb-3">Kata Sandi Diperbarui</h1>
              <p className="font-sans text-body text-ash leading-relaxed mb-8">
                Kata sandi Anda berhasil diperbarui. Silakan masuk kembali menggunakan kata sandi yang baru.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="btn-primary w-full"
              >
                Masuk Sekarang
              </button>
            </div>

          ) : (
            <>
              {/* ── Header ──────────────────────────────── */}
              <div className="mb-8">
                <h1 className="font-serif text-h1 font-semibold text-ink mb-2">Lupa Kata Sandi?</h1>
                <p className="font-sans text-body text-ash leading-relaxed">
                  Masukkan surel akunmu. Kami akan mengirimkan kode verifikasi 6 digit.
                </p>
              </div>

              <div className="flex flex-col gap-5">

                {/* Email + send button */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-sans text-caption uppercase tracking-widest text-ash font-medium">
                    Surel
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={email}
                      onChange={e => { setEmail(e.target.value); setSendError('') }}
                      placeholder="nama@institusi.ac.id"
                      disabled={codeSent}
                      className={`flex-1 border rounded-lg px-4 py-3 font-sans text-sm text-ink
                        placeholder:text-ash/50 outline-none focus:ring-2 transition-all duration-[240ms] ${
                          codeSent
                            ? 'bg-sand/30 border-sand text-ash cursor-not-allowed focus:border-sand focus:ring-transparent'
                            : 'bg-bone border-sand focus:border-forest focus:ring-forest/15'
                        }`}
                    />
                    <button
                      type="button"
                      onClick={handleSendCode}
                      disabled={!email.trim() || sendingCode || codeSent}
                      className={`flex-shrink-0 inline-flex items-center gap-2 px-4 py-3 rounded-lg
                        font-sans text-sm font-medium transition-all duration-[240ms] disabled:cursor-not-allowed ${
                          codeSent
                            ? 'bg-moss/15 text-moss border border-moss/25'
                            : 'bg-forest text-bone hover:bg-moss active:scale-[0.98] disabled:opacity-40 disabled:hover:bg-forest disabled:active:scale-100'
                        }`}
                    >
                      {sendingCode
                        ? <Loader2 size={14} className="animate-spin" />
                        : codeSent
                        ? 'Terkirim'
                        : <><Send size={14} />Kirim</>
                      }
                    </button>
                  </div>

                  {sendError && (
                    <div className="flex items-start gap-2 mt-1">
                      <AlertCircle size={13} className="text-clay flex-shrink-0 mt-0.5" />
                      <p className="font-sans text-caption text-clay">{sendError}</p>
                    </div>
                  )}

                  {codeSent && !sendError && (
                    <p className="font-sans text-caption text-moss mt-1">
                      Kode dikirim ke <strong>{email}</strong>.{' '}
                      <button
                        type="button"
                        onClick={() => { setCodeSent(false); setCode(''); setVerifyError('') }}
                        className="text-forest underline underline-offset-4 hover:text-clay transition-colors duration-[240ms]"
                      >
                        Ganti surel
                      </button>
                    </p>
                  )}
                </div>

                {/* OTP input — slides in after code sent */}
                <div className={`flex flex-col gap-5 transition-all duration-[320ms] ${codeSent ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                  
                  {/* Kata Sandi Baru */}
                  <div className="flex flex-col gap-1.5">
                    <label className="font-sans text-caption uppercase tracking-widest text-ash font-medium">
                      Kata Sandi Baru
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={e => { setNewPassword(e.target.value); setVerifyError('') }}
                        placeholder="Minimal 8 karakter"
                        className="w-full bg-bone border border-sand rounded-lg px-4 py-3 pr-12 font-sans text-sm text-ink
                          placeholder:text-ash/30 outline-none focus:border-forest focus:ring-2 focus:ring-forest/15
                          transition-all duration-[240ms]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-ash hover:text-forest
                          transition-colors duration-[240ms]"
                        aria-label="Toggle password visibility"
                      >
                        {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Konfirmasi Kata Sandi */}
                  <div className="flex flex-col gap-1.5">
                    <label className="font-sans text-caption uppercase tracking-widest text-ash font-medium">
                      Konfirmasi Kata Sandi
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={e => { setConfirmPassword(e.target.value); setVerifyError('') }}
                        placeholder="Ulangi kata sandi"
                        className={`w-full bg-bone border rounded-lg px-4 py-3 pr-12 font-sans text-sm text-ink
                          placeholder:text-ash/30 outline-none focus:ring-2
                          transition-all duration-[240ms] ${
                            !passwordsMatch
                              ? 'border-clay focus:border-clay focus:ring-clay/15'
                              : 'border-sand focus:border-forest focus:ring-forest/15'
                          }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-ash hover:text-forest
                          transition-colors duration-[240ms]"
                        aria-label="Toggle confirm password visibility"
                      >
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {!passwordsMatch && (
                      <p className="font-sans text-caption text-clay mt-0.5">Kata sandi tidak cocok.</p>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-sans text-caption uppercase tracking-widest text-ash font-medium">
                      Kode Verifikasi (OTP)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={code}
                      onChange={e => { setCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setVerifyError('') }}
                      placeholder="_ _ _ _ _ _"
                      maxLength={6}
                      className="bg-bone border border-sand rounded-lg px-4 py-4 font-sans text-2xl text-ink
                        placeholder:text-ash/30 outline-none focus:border-forest focus:ring-2 focus:ring-forest/15
                        transition-all duration-[240ms] font-tabular tracking-[0.45em] text-center"
                    />
                    {verifyError && (
                      <div className="flex items-start gap-2 mt-1">
                        <AlertCircle size={13} className="text-clay flex-shrink-0 mt-0.5" />
                        <p className="font-sans text-caption text-clay">{verifyError}</p>
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="font-sans text-caption text-ash/60">Cek folder Spam jika tidak muncul.</p>
                      <button
                        type="button"
                        onClick={handleResend}
                        disabled={cooldown > 0 || sendingCode}
                        className="font-sans text-caption text-forest hover:text-clay underline underline-offset-4
                          transition-colors duration-[240ms] disabled:opacity-50 flex items-center gap-1"
                      >
                        {sendingCode
                          ? <><Loader2 size={11} className="animate-spin" /> Mengirim…</>
                          : cooldown > 0
                          ? `Kirim ulang (${cooldown}s)`
                          : 'Kirim ulang'
                        }
                      </button>
                    </div>
                  </div>
                </div>

                {/* Verify button */}
                <button
                  type="button"
                  onClick={handleVerify}
                  disabled={!codeSent || code.length !== 6 || !newPassword || !confirmPassword || !passwordsMatch || loading}
                  className="btn-primary flex items-center justify-center gap-2 mt-2
                    disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-forest disabled:active:scale-100"
                >
                  {loading
                    ? <><Loader2 size={15} className="animate-spin" /> Menyimpan Kata Sandi…</>
                    : 'Simpan Kata Sandi Baru'
                  }
                </button>
              </div>

              <div className="section-divider my-8">
                <span className="font-sans text-caption text-ash/60 px-2" />
              </div>

              <p className="font-sans text-body text-ash text-center">
                Ingat kata sandimu?{' '}
                <Link to="/login" className="text-forest font-medium underline underline-offset-4
                  hover:text-clay transition-colors duration-[240ms]">
                  Masuk di sini
                </Link>
              </p>
            </>
          )}

        </div>
      </div>
    </div>
  )
}
