import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, KeyRound, UserCog, ShieldCheck } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import Spinner from '../../../components/ui/Spinner'
import Modal from '../../../components/ui/Modal'
import ConfirmDialog from '../../../components/ui/ConfirmDialog'
import Button from '../../../components/ui/Button'
import { TextField, PasswordField, SelectField } from '../../../components/ui/Field'
import {
  getUsers, createUser, updateUser, deleteUser, resetUserPassword,
} from '../../../services/userService'
import { DEFAULT_PASSWORD } from '../../../lib/crypto'
import { formatDate } from '../../../lib/format'
import { toast } from '../../../stores/toastStore'

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'staff', label: 'Staff' },
]

const emptyForm = { name: '', email: '', password: '', role: 'staff' }

const UserPage = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const [deleting, setDeleting] = useState(null)
  const [resetting, setResetting] = useState(null)
  const [busy, setBusy] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      setUsers(await getUsers())
    } catch (err) {
      toast.error(err.message || 'Gagal memuat user.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setErrors({})
    setFormOpen(true)
  }

  const openEdit = (u) => {
    setEditingId(u.id)
    setForm({ name: u.name, email: u.email, password: '', role: u.role })
    setErrors({})
    setFormOpen(true)
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Nama wajib diisi.'
    if (!form.email.trim()) e.email = 'Email wajib diisi.'
    if (!editingId && form.password.length < 6) e.password = 'Password minimal 6 karakter.'
    if (editingId && form.password && form.password.length < 6)
      e.password = 'Password minimal 6 karakter.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      if (editingId) {
        await updateUser(editingId, {
          name: form.name.trim(),
          email: form.email.trim(),
          role: form.role,
          password: form.password || undefined,
        })
        toast.success('User diperbarui.')
      } else {
        await createUser({
          name: form.name.trim(),
          email: form.email.trim(),
          role: form.role,
          password: form.password,
        })
        toast.success('User ditambahkan.')
      }
      setFormOpen(false)
      await load()
    } catch (err) {
      toast.error(err.message || 'Gagal menyimpan user.')
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    setBusy(true)
    try {
      await deleteUser(deleting.id)
      toast.success('User dihapus.')
      setDeleting(null)
      await load()
    } catch (err) {
      toast.error(err.message || 'Gagal menghapus user.')
    } finally {
      setBusy(false)
    }
  }

  const confirmReset = async () => {
    setBusy(true)
    try {
      await resetUserPassword(resetting.id)
      toast.success(`Password "${resetting.name}" direset ke ${DEFAULT_PASSWORD}.`)
      setResetting(null)
    } catch (err) {
      toast.error(err.message || 'Gagal reset password.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-10">
      <PageHeader
        title="Master User"
        subtitle="Manajemen akun pengguna sistem"
        actions={
          <Button variant="primary" onClick={openCreate}>
            <Plus size={15} strokeWidth={2.5} />
            Tambah User
          </Button>
        }
      />

      <div className="bg-[#111111] border border-white/6 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-white/2 border-b border-white/6">
                {['No', 'Nama', 'Email', 'Role', 'Password', 'Updated', 'Action'].map((c) => (
                  <th
                    key={c}
                    className="py-4 px-6 text-white/40 font-semibold text-[11px] uppercase tracking-wider text-left whitespace-nowrap"
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7}>
                    <Spinner />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-white/40 text-sm">
                    Belum ada user.
                  </td>
                </tr>
              ) : (
                users.map((u, i) => (
                  <tr key={u.id} className="border-b border-white/4 last:border-0 hover:bg-white/2">
                    <td className="py-4 px-6 text-white/40 text-sm">{i + 1}</td>
                    <td className="py-4 px-6 text-white text-sm font-medium">{u.name}</td>
                    <td className="py-4 px-6 text-white/60 text-sm">{u.email}</td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded capitalize ${
                          u.role === 'admin'
                            ? 'bg-white text-black'
                            : 'bg-white/8 text-white/70'
                        }`}
                      >
                        {u.role === 'admin' && <ShieldCheck size={11} />}
                        {u.role}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-white/30 tracking-widest text-sm">••••••••</td>
                    <td className="py-4 px-6 text-white/40 text-xs">{formatDate(u.updated_at)}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5">
                        <IconBtn icon={Pencil} label="Edit" onClick={() => openEdit(u)} />
                        <IconBtn icon={KeyRound} label="Reset Password" onClick={() => setResetting(u)} />
                        <IconBtn icon={Trash2} label="Hapus" danger onClick={() => setDeleting(u)} />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit modal */}
      <Modal
        open={formOpen}
        onClose={() => !saving && setFormOpen(false)}
        loading={saving}
        title={editingId ? 'Edit User' : 'Tambah User'}
        description="Lengkapi data akun pengguna."
        icon={UserCog}
        footer={
          <>
            <Button variant="ghost" onClick={() => setFormOpen(false)} disabled={saving}>
              Batal
            </Button>
            <Button variant="primary" onClick={submit} disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </>
        }
      >
        <TextField
          label="Nama"
          value={form.name}
          onChange={set('name')}
          error={errors.name}
          placeholder="Nama lengkap"
        />
        <TextField
          label="Email"
          type="email"
          value={form.email}
          onChange={set('email')}
          error={errors.email}
          placeholder="email@lippomall.com"
        />
        <PasswordField
          label={editingId ? 'Password Baru (opsional)' : 'Password'}
          value={form.password}
          onChange={set('password')}
          error={errors.password}
          hint={editingId ? 'Kosongkan bila tidak ingin mengubah password.' : 'Minimal 6 karakter.'}
          autoComplete="new-password"
        />
        <SelectField
          label="Role"
          value={form.role}
          onChange={set('role')}
          options={ROLE_OPTIONS}
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        loading={busy}
        title="Hapus User"
        description={`Yakin menghapus user "${deleting?.name}"? User yang masih ditugaskan pada area tidak dapat dihapus.`}
        confirmText="Hapus"
        variant="danger"
        icon={Trash2}
      />

      <ConfirmDialog
        open={Boolean(resetting)}
        onClose={() => setResetting(null)}
        onConfirm={confirmReset}
        loading={busy}
        title="Reset Password"
        description={`Password "${resetting?.name}" akan direset ke default: ${DEFAULT_PASSWORD}. Mohon informasikan ke user terkait.`}
        confirmText="Reset Password"
        variant="primary"
        icon={KeyRound}
      />
    </div>
  )
}

const IconBtn = ({ icon: Icon, label, onClick, danger }) => (
  <button
    type="button"
    onClick={onClick}
    title={label}
    aria-label={label}
    className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors cursor-pointer ${
      danger
        ? 'text-white/45 hover:text-red-400 hover:bg-red-500/10'
        : 'text-white/45 hover:text-white hover:bg-white/8'
    }`}
  >
    <Icon size={14} />
  </button>
)

export default UserPage
