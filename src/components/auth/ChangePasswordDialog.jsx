import { useState } from 'react'
import { KeyRound } from 'lucide-react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { PasswordField } from '../ui/Field'
import { changePassword } from '../../services/authService'
import useAuthStore from '../../stores/authStore'
import { toast } from '../../stores/toastStore'

/** Dialog letting any logged-in user change their own password. */
const ChangePasswordDialog = ({ open, onClose }) => {
  const user = useAuthStore((s) => s.user)
  const [form, setForm] = useState({ current: '', next: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const reset = () => {
    setForm({ current: '', next: '', confirm: '' })
    setError('')
  }

  const close = () => {
    if (loading) return
    reset()
    onClose?.()
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.next.length < 6) {
      setError('Password baru minimal 6 karakter.')
      return
    }
    if (form.next !== form.confirm) {
      setError('Konfirmasi password tidak cocok.')
      return
    }
    setLoading(true)
    try {
      await changePassword(user.id, form.current, form.next)
      toast.success('Password berhasil diperbarui.')
      reset()
      onClose?.()
    } catch (err) {
      setError(err.message || 'Gagal mengubah password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={close}
      loading={loading}
      title="Ubah Password"
      description="Masukkan password lama Anda, lalu password baru."
      icon={KeyRound}
      footer={
        <>
          <Button variant="ghost" onClick={close} disabled={loading}>
            Batal
          </Button>
          <Button variant="primary" onClick={submit} disabled={loading}>
            {loading ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-5">
        <PasswordField
          label="Password Saat Ini"
          value={form.current}
          onChange={set('current')}
          autoComplete="current-password"
        />
        <PasswordField
          label="Password Baru"
          value={form.next}
          onChange={set('next')}
          autoComplete="new-password"
          hint="Minimal 6 karakter."
        />
        <PasswordField
          label="Konfirmasi Password Baru"
          value={form.confirm}
          onChange={set('confirm')}
          autoComplete="new-password"
          error={error}
        />
        <button type="submit" className="hidden" aria-hidden />
      </form>
    </Modal>
  )
}

export default ChangePasswordDialog
