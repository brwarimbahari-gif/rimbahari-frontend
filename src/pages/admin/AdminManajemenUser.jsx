import { useState, useEffect, useCallback } from 'react'
import { 
  Search, 
  ChevronRight, 
  Filter, 
  AlertCircle,
  Eye,
  EyeOff,
  Trash2,
  Loader2,
  Download,
  Users,
  CheckCircle2,
  XCircle,
  UserCheck,
  LogOut,
  Edit3
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { usersApi, session } from '../../lib/api'
import AdminSidebar from '../../components/AdminPage/AdminSidebar'
import ConfirmationModal from '../../components/AdminPage/ConfirmationModal'
import EditUserModal from '../../components/AdminPage/EditUserModal'

// ---------------------------------------------------------------------------
// Admin Manajemen User
// ---------------------------------------------------------------------------

export default function AdminManajemenUser() {
  const navigate = useNavigate()

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedRole, setSelectedRole] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [userToDelete, setUserToDelete] = useState(null)
  
  const [showEditModal, setShowEditModal] = useState(false)
  const [userToEdit, setUserToEdit] = useState(null)

  const [visibleColumns, setVisibleColumns] = useState({
    nama: true,
    email: true,
    role: true,
    status: true,
    bergabung: true
  })
  const [showColumnToggle, setShowColumnToggle] = useState(false)

  // ---------------------------------------------------------------------------
  // Auth Guard
  // ---------------------------------------------------------------------------
  const handleLogout = () => {
    session.clear()
    localStorage.removeItem('rh_admin_verified')
    navigate('/login', { replace: true })
  }

  // ---------------------------------------------------------------------------
  // Data Fetching
  // ---------------------------------------------------------------------------
  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError('')
    
    try {
      const { ok, data } = await usersApi.list({
        search: searchTerm,
        role: selectedRole,
        page_size: 100 
      })

      if (ok) {
        const results = Array.isArray(data) ? data : (data.results || [])
        setUsers(results)
      } else {
        setError('Gagal memuat data pengguna.')
      }
    } catch (err) {
      console.error(err)
      setError('Terjadi kesalahan koneksi.')
    } finally {
      setLoading(false)
    }
  }, [selectedRole, searchTerm])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const openDeleteModal = (user) => {
    setUserToDelete(user)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!userToDelete) return
    try {
      const isCurrentlyActive = userToDelete.is_active
      let res
      if (isCurrentlyActive) {
        res = await usersApi.delete(userToDelete.id) 
      } else {
        res = await usersApi.activate(userToDelete.id) 
      }

      if (res.ok) {
        fetchUsers()
      } else {
        alert(res.data.error || 'Gagal mengubah status pengguna.')
      }
    } catch (err) {
      alert('Terjadi kesalahan sistem.')
    } finally {
      setShowDeleteModal(false)
      setUserToDelete(null)
    }
  }

  const handleUpdateUser = async (userId, data) => {
    try {
      const { ok, data: resData } = await usersApi.update(userId, data)
      if (ok) {
        fetchUsers()
      } else {
        alert(resData.error || 'Gagal memperbarui data pengguna.')
      }
    } catch (err) {
      alert('Terjadi kesalahan sistem.')
    }
  }

  const toggleColumn = (col) => {
    setVisibleColumns(prev => ({ ...prev, [col]: !prev[col] }))
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return d.toLocaleString('id-ID', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric'
    })
  }

  const getRoleLabel = (role) => {
    const roles = {
      'ADMIN': 'Administrator',
      'MODERATOR': 'Moderator',
      'REVIEWER': 'Reviewer',
      'MAHASISWA': 'Mahasiswa',
      'AKADEMISI': 'Akademisi',
      'PEMUDA_ADAT': 'Pemuda Adat',
      'AKTIVIS': 'Aktivis'
    }
    return roles[role] || role
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="flex h-screen bg-[#FDFCF9]">
      <AdminSidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header Section */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-sand flex items-center justify-between px-10 z-10">
          <div className="flex items-center gap-4 flex-1">
            <p className="text-xs font-sans text-ash italic">Manajemen akun pengguna platform RIMBAHARI.</p>
          </div>

          <div className="flex items-center gap-8">
            <Link to="/home" className="font-sans text-[10px] font-bold text-ash hover:text-forest uppercase tracking-[0.2em] transition-colors">
              Lihat Website
            </Link>
            
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 font-sans text-[10px] font-bold text-clay hover:text-red-600 uppercase tracking-[0.2em] transition-colors"
            >
              <LogOut size={14} />
              Keluar
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-10">
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* Title & Stats */}
            <div className="flex items-end justify-between">
              <div>
                <h1 className="font-serif text-3xl font-bold text-ink mb-2">Manajemen User</h1>
                <div className="flex items-center gap-2 text-xs font-sans text-ash/60">
                  <span>Beranda</span>
                  <ChevronRight size={12} />
                  <span className="text-forest font-medium">User</span>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="bg-white border border-sand px-5 py-3 rounded-xl shadow-subtle flex items-center gap-4">
                  <div className="w-10 h-10 bg-forest/10 rounded-lg flex items-center justify-center text-forest">
                    <Users size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-ash/60 tracking-widest">Total User</p>
                    <p className="text-lg font-serif font-bold text-ink">{users.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg border border-sand p-6 shadow-subtle flex items-center justify-between">
              <div className="flex items-center gap-4">
                <select 
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="bg-bone/50 border border-sand rounded-lg px-4 py-2.5 text-sm font-sans focus:outline-none focus:border-forest"
                >
                  <option value="">Semua Role</option>
                  <option value="ADMIN">Administrator</option>
                  <option value="MODERATOR">Moderator</option>
                  <option value="REVIEWER">Reviewer</option>
                  <option value="MAHASISWA">Mahasiswa</option>
                  <option value="AKADEMISI">Akademisi</option>
                  <option value="PEMUDA_ADAT">Pemuda Adat</option>
                  <option value="AKTIVIS">Aktivis</option>
                </select>

                <div className="h-8 w-px bg-sand mx-2"></div>

                <div className="relative">
                  <button 
                    onClick={() => setShowColumnToggle(!showColumnToggle)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-sand text-ash hover:text-forest hover:border-forest transition-all text-sm font-medium"
                  >
                    <Filter size={16} />
                    Kolom
                  </button>
                  
                  {showColumnToggle && (
                    <div className="absolute left-0 mt-2 w-56 bg-white border border-sand rounded-lg shadow-elevated z-30 p-4 space-y-3">
                      <p className="text-[10px] uppercase font-bold text-ash/40 tracking-widest mb-2 px-1">Tampilkan Kolom</p>
                      {Object.keys(visibleColumns).map((col) => (
                        <label key={col} className="flex items-center justify-between cursor-pointer group">
                          <span className="text-sm text-ash group-hover:text-ink capitalize">{col}</span>
                          <button 
                            onClick={() => toggleColumn(col)}
                            className={`p-1.5 rounded-lg transition-colors ${visibleColumns[col] ? 'text-forest bg-forest/5' : 'text-ash/30 hover:text-ash/60'}`}
                          >
                            {visibleColumns[col] ? <Eye size={16} /> : <EyeOff size={16} />}
                          </button>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-bone/50 border border-sand rounded-lg px-4 py-2.5 flex items-center gap-2 focus-within:border-forest transition-colors">
                <Search size={14} className="text-ash" />
                <input 
                  type="text" 
                  placeholder="Cari nama atau email..." 
                  className="bg-transparent border-none focus:outline-none text-sm font-sans w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Table Area */}
            <div className="bg-white rounded-lg border border-sand shadow-subtle overflow-hidden min-h-[400px] flex flex-col">
              {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center p-20 text-ash">
                  <Loader2 size={40} className="animate-spin mb-4 text-forest opacity-20" />
                  <p className="text-sm font-medium animate-pulse">Memuat data pengguna...</p>
                </div>
              ) : error ? (
                <div className="flex-1 flex flex-col items-center justify-center p-20 text-center">
                  <AlertCircle size={40} className="text-red-200 mb-4" />
                  <p className="text-sm font-bold text-ink mb-1">Gagal Memuat Data</p>
                  <p className="text-xs text-ash mb-6">{error}</p>
                  <button onClick={fetchUsers} className="px-4 py-2 bg-forest text-bone rounded-lg text-xs font-bold">Coba Lagi</button>
                </div>
              ) : users.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-20 text-center">
                  <Users size={40} className="text-sand mb-4" />
                  <p className="text-sm font-bold text-ink mb-1">Tidak Ada User</p>
                  <p className="text-xs text-ash">Belum ada pengguna yang terdaftar atau sesuai filter.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-bone/30 border-b border-sand">
                      {visibleColumns.nama && <th className="py-5 px-8 font-serif font-bold text-ink text-sm">Nama Lengkap</th>}
                      {visibleColumns.email && <th className="py-5 px-6 font-serif font-bold text-ink text-sm">Email</th>}
                      {visibleColumns.role && <th className="py-5 px-6 font-serif font-bold text-ink text-sm">Role</th>}
                      {visibleColumns.status && <th className="py-5 px-6 font-serif font-bold text-ink text-sm">Status</th>}
                      {visibleColumns.bergabung && <th className="py-5 px-6 font-serif font-bold text-ink text-sm">Bergabung</th>}
                      <th className="py-5 px-8 font-serif font-bold text-ink text-sm text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sand">
                    {users.map((user) => (
                      <tr key={user.id} className={`hover:bg-bone/10 transition-all group border-b border-sand/50 ${!user.is_active ? 'bg-ash/[0.02] opacity-70' : ''}`}>
                        {visibleColumns.nama && (
                          <td className="py-4 px-8">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full border font-serif font-bold shadow-sm flex items-center justify-center ${user.is_active ? 'bg-bone border-sand text-forest' : 'bg-ash/10 border-ash/20 text-ash/40'}`}>
                                {user.full_name?.charAt(0) || '?'}
                              </div>
                              <div>
                                <p className={`text-sm font-bold transition-colors ${user.is_active ? 'text-ink group-hover:text-forest' : 'text-ash/60'}`}>{user.full_name}</p>
                                {!user.is_active && <span className="text-[9px] font-bold text-red-500 uppercase tracking-tighter">Nonaktif</span>}
                              </div>
                            </div>
                          </td>
                        )}
                        {visibleColumns.email && (
                          <td className={`py-4 px-6 text-sm font-medium ${user.is_active ? 'text-ash' : 'text-ash/40'}`}>{user.email}</td>
                        )}
                        {visibleColumns.role && (
                          <td className="py-4 px-6">
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                              !user.is_active ? 'bg-ash/5 text-ash/40 border border-ash/10' :
                              user.role === 'ADMIN' ? 'bg-red-50 text-red-700 border border-red-100' :
                              user.role === 'MODERATOR' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                              'bg-forest/5 text-forest border border-forest/10'
                            }`}>
                              {getRoleLabel(user.role)}
                            </span>
                          </td>
                        )}
                        {visibleColumns.status && (
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1.5" title="Email Verified">
                                {user.is_email_verified ? (
                                  <CheckCircle2 size={14} className={user.is_active ? "text-forest" : "text-ash/30"} />
                                ) : (
                                  <XCircle size={14} className="text-red-400" />
                                )}
                                <span className="text-[10px] font-bold text-ash/60 uppercase">Email</span>
                              </div>
                              <div className="flex items-center gap-1.5" title="Profile Completed">
                                {user.is_profile_complete ? (
                                  <UserCheck size={14} className={user.is_active ? "text-forest" : "text-ash/30"} />
                                ) : (
                                  <XCircle size={14} className="text-red-400" />
                                )}
                                <span className="text-[10px] font-bold text-ash/60 uppercase">Profil</span>
                              </div>
                            </div>
                          </td>
                        )}
                        {visibleColumns.bergabung && (
                          <td className={`py-4 px-6 text-[10px] font-medium ${user.is_active ? 'text-ash/70' : 'text-ash/30'}`}>{formatDate(user.date_joined)}</td>
                        )}
                        <td className="py-4 px-8 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button 
                              onClick={() => {
                                setUserToEdit(user)
                                setShowEditModal(true)
                              }}
                              className="p-2.5 text-ash hover:text-forest hover:bg-forest/5 rounded-xl transition-all" 
                              title="Edit Role"
                            >
                              <Edit3 size={18} />
                            </button>

                            {user.is_active ? (
                              <button 
                                onClick={() => openDeleteModal(user)}
                                className="p-2.5 text-ash hover:text-red-600 hover:bg-red-50 rounded-xl transition-all" 
                                title="Nonaktifkan Akun"
                              >
                                <EyeOff size={18} />
                              </button>
                            ) : (
                              <button 
                                onClick={() => openDeleteModal(user)}
                                className="p-2.5 text-forest hover:bg-forest/5 rounded-xl transition-all" 
                                title="Aktifkan Kembali"
                              >
                                <UserCheck size={18} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </main>

      <EditUserModal 
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        user={userToEdit}
        onConfirm={handleUpdateUser}
      />

      <ConfirmationModal 
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        variant={userToDelete?.is_active ? "danger" : "info"}
        title={userToDelete?.is_active ? "Nonaktifkan Akun" : "Aktifkan Akun"}
        message={userToDelete?.is_active 
          ? "Apakah Anda yakin ingin menonaktifkan akun ini? Pengguna tidak akan bisa login sampai akun diaktifkan kembali oleh admin."
          : "Apakah Anda yakin ingin mengaktifkan kembali akun ini? Pengguna akan dapat login kembali ke platform."
        }
        details={userToDelete ? {
          'Nama': userToDelete.full_name,
          'Email': userToDelete.email,
          'Status Saat Ini': userToDelete.is_active ? 'Aktif' : 'Nonaktif'
        } : null}
        confirmText={userToDelete?.is_active ? "Ya, Nonaktifkan" : "Ya, Aktifkan Kembali"}
      />
    </div>
  )
}
