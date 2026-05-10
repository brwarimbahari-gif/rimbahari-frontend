import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  ShoppingBag, 
  Globe, 
  UserCircle, 
  Shield, 
  Lock, 
  Database,
  History,
  Circle
} from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

export default function AdminSidebar() {
  const location = useLocation()

  const sections = [
    {
      title: null,
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/4Dm1n_d4Shb04Rd/' },
      ]
    },
    {
      title: 'Konten',
      items: [
        { id: 'articles', label: 'Manajemen Artikel', icon: FileText, path: '/4Dm1n_d4Shb04Rd/articles' },
        { id: 'publications', label: 'Manajemen Etalase', icon: ShoppingBag, path: '/4Dm1n_d4Shb04Rd/display' },
      ]
    },
    {
      title: 'Akses',
      items: [
        { id: 'users', label: 'Manajemen User', icon: Users, path: '/4Dm1n_d4Shb04Rd/users' },
      ]
    }
  ]

  const isActive = (path) => location.pathname === path

  return (
    <aside className="w-[280px] bg-[#16291F] text-[#E5DFD3] flex flex-col h-screen overflow-y-auto scrollbar-hide py-8 px-5 border-r border-white/5">
      {/* Sidebar Header */}
      <div className="flex items-center gap-3 px-2 mb-10">
        <div className="w-9 h-9 bg-white/10 rounded-md flex items-center justify-center border border-white/10">
          <span className="text-white font-serif font-bold text-lg leading-none">R</span>
        </div>
        <div className="flex flex-col">
          <span className="font-serif font-bold text-lg tracking-tight text-white leading-none">
            RIMBAHARI
          </span>
          <span className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em] mt-1">
            Admin Panel
          </span>
        </div>
      </div>

      <nav className="space-y-5">
        {sections.map((section, idx) => (
          <div key={idx} className="space-y-1.5">
            {section.title && (
              <h3 className="px-2 text-[10px] font-serif font-bold text-[#E5DFD3]/90 uppercase tracking-[0.1em] mb-3">
                {section.title}
              </h3>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(item.path)
                return (
                  <Link
                    key={item.id}
                    to={item.path}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group
                      ${active 
                        ? 'bg-white/10 text-white font-medium shadow-sm' 
                        : 'hover:bg-white/5 text-[#E5DFD3]/60 hover:text-white'}`}
                  >
                    <item.icon 
                      size={17} 
                      className={`transition-colors ${active ? 'text-white' : 'text-[#E5DFD3]/30 group-hover:text-white'}`}
                      fill={item.icon === Circle ? (active ? 'white' : 'transparent') : 'none'}
                    />
                    <span className="text-[13px] font-sans tracking-tight">
                      {item.label}
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  )
}
