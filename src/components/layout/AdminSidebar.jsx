import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Database, PieChart, Building2, Users, ChevronDown, LayoutGrid, X } from 'lucide-react'
import LippoLogo from './LippoLogo'

const masterChildren = [
  { to: '/admin/master/ahp', label: 'AHP', icon: PieChart },
  { to: '/admin/master/area', label: 'Area', icon: Building2 },
  { to: '/admin/master/user', label: 'User', icon: Users },
]

const baseItemClass =
  'flex items-center gap-3 px-3.5 py-3 rounded-lg text-[13px] font-medium transition-all duration-150'

const NavItem = ({ to, label, icon: Icon, end, indent = false, onClick }) => (
  <NavLink
    to={to}
    end={end}
    onClick={onClick}
    className={({ isActive }) =>
      `${baseItemClass} ${indent ? 'pl-10' : ''} ${
        isActive
          ? 'bg-white text-black shadow-sm'
          : 'text-white/55 hover:text-white hover:bg-white/5'
      }`
    }
  >
    <Icon size={17} strokeWidth={2} />
    <span>{label}</span>
  </NavLink>
)

const AdminSidebar = ({ open = true, onClose }) => {
  const [masterOpen, setMasterOpen] = useState(true)

  return (
    <aside
      className={`fixed top-0 left-0 h-screen w-64 bg-[#070707] border-r border-white/6 flex flex-col z-40 transition-transform duration-300 ${
        open ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="px-6 py-7 flex items-center justify-between">
        <LippoLogo size="md" />
        <button
          type="button"
          onClick={onClose}
          className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          aria-label="Tutup menu"
        >
          <X size={18} strokeWidth={2} />
        </button>
      </div>

      <div className="h-px bg-white/6 mx-6" />

      <nav className="flex flex-col gap-1 px-4 py-6 flex-1 overflow-y-auto">
        <p className="text-white/30 text-[10px] font-semibold uppercase tracking-widest px-3.5 mb-3">
          Menu
        </p>

        <NavItem to="/admin/dashboard" label="Dashboard" icon={LayoutDashboard} end onClick={onClose} />
        <NavItem to="/admin/data" label="Data" icon={Database} onClick={onClose} />

        <p className="text-white/30 text-[10px] font-semibold uppercase tracking-widest px-3.5 mt-6 mb-3">
          Master Data
        </p>

        <button
          type="button"
          onClick={() => setMasterOpen((p) => !p)}
          className={`${baseItemClass} w-full text-white/55 hover:text-white hover:bg-white/5`}
        >
          <LayoutGrid size={17} strokeWidth={2} />
          <span className="flex-1 text-left">Master</span>
          <ChevronDown
            size={13}
            strokeWidth={2.5}
            className={`opacity-60 transition-transform duration-200 ${masterOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {masterOpen && (
          <div className="flex flex-col gap-1 mt-1">
            {masterChildren.map((item) => (
              <NavItem key={item.to} {...item} indent onClick={onClose} />
            ))}
          </div>
        )}
      </nav>
    </aside>
  )
}

export default AdminSidebar
