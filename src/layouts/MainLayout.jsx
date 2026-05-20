import { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import Sidebar from '../components/layout/Sidebar'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import useAuthStore from '../stores/authStore'
import { clearNotifications } from '../services/notificationService'

const getInitialSidebarOpen = () => {
  if (typeof window === 'undefined') return true
  return window.innerWidth >= 768
}

const MainLayout = () => {
  const logout = useAuthStore((s) => s.logout)
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(getInitialSidebarOpen)
  const [logoutOpen, setLogoutOpen] = useState(false)

  const requestLogout = () => setLogoutOpen(true)
  const confirmLogout = () => {
    setLogoutOpen(false)
    // Notifications are wiped on logout.
    if (user?.id) clearNotifications(user.id).catch(() => {})
    logout()
    navigate('/')
  }

  const closeSidebar = () => setSidebarOpen(false)
  const toggleSidebar = () => setSidebarOpen((o) => !o)

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Sidebar open={sidebarOpen} onClose={closeSidebar} />

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          onClick={closeSidebar}
          className="fixed inset-0 bg-black/60 z-30 md:hidden"
          aria-hidden="true"
        />
      )}

      <div
        className={`flex flex-col min-h-screen transition-[margin] duration-300 ${
          sidebarOpen ? 'md:ml-64' : 'ml-0'
        }`}
      >
        <Header onLogout={requestLogout} onToggleSidebar={toggleSidebar} />
        <main className="flex-1 px-6 md:px-12 py-12">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
        <Footer />
      </div>

      <ConfirmDialog
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        onConfirm={confirmLogout}
        title="Logout dari Enerlyze"
        description="Sesi Anda akan diakhiri dan Anda akan diarahkan kembali ke halaman login."
        confirmText="Logout"
        cancelText="Batal"
        variant="danger"
        icon={LogOut}
      />
    </div>
  )
}

export default MainLayout
