import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Building2 } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import Spinner from '../../../components/ui/Spinner'
import Modal from '../../../components/ui/Modal'
import ConfirmDialog from '../../../components/ui/ConfirmDialog'
import Button from '../../../components/ui/Button'
import { TextField, TextAreaField, SelectField } from '../../../components/ui/Field'
import { getAreas, createArea, updateArea, deleteArea } from '../../../services/areaService'
import { getUsers } from '../../../services/userService'
import { formatDate } from '../../../lib/format'
import { toast } from '../../../stores/toastStore'

const emptyForm = { name: '', description: '', user_id: '' }

const AreaPage = () => {
  const [areas, setAreas] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const [deleting, setDeleting] = useState(null)
  const [busy, setBusy] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [a, u] = await Promise.all([getAreas(), getUsers()])
      setAreas(a)
      setUsers(u)
    } catch (err) {
      toast.error(err.message || 'Gagal memuat area.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  const userName = (id) => users.find((u) => u.id === id)?.name || '—'

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setErrors({})
    setFormOpen(true)
  }

  const openEdit = (a) => {
    setEditingId(a.id)
    setForm({ name: a.name, description: a.description || '', user_id: a.user_id || '' })
    setErrors({})
    setFormOpen(true)
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Nama area wajib diisi.'
    if (!form.user_id) e.user_id = 'Pilih user penanggung jawab.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        user_id: form.user_id,
      }
      if (editingId) {
        await updateArea(editingId, payload)
        toast.success('Area diperbarui.')
      } else {
        await createArea(payload)
        toast.success('Area ditambahkan.')
      }
      setFormOpen(false)
      await load()
    } catch (err) {
      toast.error(err.message || 'Gagal menyimpan area.')
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    setBusy(true)
    try {
      await deleteArea(deleting.id)
      toast.success('Area dihapus.')
      setDeleting(null)
      await load()
    } catch (err) {
      toast.error(err.message || 'Gagal menghapus area.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-10">
      <PageHeader
        title="Master Area"
        subtitle="Manajemen area gedung & penanggung jawab"
        actions={
          <Button variant="primary" onClick={openCreate}>
            <Plus size={15} strokeWidth={2.5} />
            Tambah Area
          </Button>
        }
      />

      <div className="bg-[#111111] border border-white/6 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-white/2 border-b border-white/6">
                {['No', 'Area', 'Deskripsi', 'Penanggung Jawab', 'Updated', 'Action'].map((c) => (
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
                  <td colSpan={6}>
                    <Spinner />
                  </td>
                </tr>
              ) : areas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-white/40 text-sm">
                    Belum ada area.
                  </td>
                </tr>
              ) : (
                areas.map((a, i) => (
                  <tr key={a.id} className="border-b border-white/4 last:border-0 hover:bg-white/2">
                    <td className="py-4 px-6 text-white/40 text-sm">{i + 1}</td>
                    <td className="py-4 px-6 text-white text-sm font-medium">{a.name}</td>
                    <td className="py-4 px-6 text-white/55 text-sm max-w-xs">
                      {a.description || '—'}
                    </td>
                    <td className="py-4 px-6 text-white/60 text-sm">{userName(a.user_id)}</td>
                    <td className="py-4 px-6 text-white/40 text-xs">{formatDate(a.updated_at)}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEdit(a)}
                          title="Edit"
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-white/45 hover:text-white hover:bg-white/8 transition-colors cursor-pointer"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleting(a)}
                          title="Hapus"
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-white/45 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={formOpen}
        onClose={() => !saving && setFormOpen(false)}
        loading={saving}
        title={editingId ? 'Edit Area' : 'Tambah Area'}
        description="Setiap area wajib memiliki satu user penanggung jawab."
        icon={Building2}
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
          label="Nama Area"
          value={form.name}
          onChange={set('name')}
          error={errors.name}
          placeholder="Contoh: Lantai 1"
        />
        <TextAreaField
          label="Deskripsi / Detail"
          value={form.description}
          onChange={set('description')}
          placeholder="Contoh: Lobby, Food Court, Anchor Tenant"
        />
        <SelectField
          label="User Penanggung Jawab"
          value={form.user_id}
          onChange={set('user_id')}
          error={errors.user_id}
          placeholder="Pilih user"
          options={users.map((u) => ({
            value: u.id,
            label: `${u.name} (${u.role})`,
          }))}
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        loading={busy}
        title="Hapus Area"
        description={`Yakin menghapus area "${deleting?.name}"? Area yang masih memiliki catatan data energi tidak dapat dihapus.`}
        confirmText="Hapus"
        variant="danger"
        icon={Trash2}
      />
    </div>
  )
}

export default AreaPage
