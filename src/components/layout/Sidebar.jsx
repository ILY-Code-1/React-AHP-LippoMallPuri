import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Database, X } from 'lucide-react'
import LippoLogo from './LippoLogo'

const userNavItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/dashboard/data', label: 'Data', icon: Database },
]

const NavItem = ({ to, label, icon: Icon, end, onClick }) => (
  <NavLink
    to={to}
    end={end}
    onClick={onClick}
    className={({ isActive }) =>
      `flex items-center gap-3 px-3.5 py-3 rounded-lg text-[13px] font-medium transition-all duration-150 ${
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

const Sidebar = ({ navItems = userNavItems, open = true, onClose }) => {
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
        {navItems.map((item) => (
          <NavItem key={item.to} {...item} onClick={onClose} />
        ))}
      </nav>
    </aside>
  )
}

export { NavItem }
export default Sidebar
