import { useEffect, useMemo, useState } from 'react'
import { Plus, MapPin, Pencil, Trash2, Inbox } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import Spinner from '../../components/ui/Spinner'
import Button from '../../components/ui/Button'
import Dropdown from '../../components/ui/Dropdown'
import MonthSelect from '../../components/ui/MonthSelect'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import DataFormModal from '../../components/data/DataFormModal'
import useAuthStore from '../../stores/authStore'
import { getAreasByUser } from '../../services/areaService'
import {
  getDataByAreas, createData, updateData, deleteData,
} from '../../services/dataService'
import { toMonthKey, formatNumber, formatRupiah } from '../../lib/format'
import { toast } from '../../stores/toastStore'

const COLS = ['No', 'Area', 'kWh', 'Luasan', 'Biaya', 'Jam', 'Maintenance', 'Action']

const DataPage = () => {
  const user = useAuthStore((s) => s.user)
  const [areas, setAreas] = useState([])
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)

  const [selectedArea, setSelectedArea] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(toMonthKey())

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [busy, setBusy] = useState(false)

  const loadAll = async () => {
    setLoading(true)
    try {
      const myAreas = await getAreasByUser(user.id)
      setAreas(myAreas)
      if (myAreas.length) {
        setSelectedArea((prev) => prev || myAreas[0].id)
        const data = await getDataByAreas(myAreas.map((a) => a.id))
        setRecords(data)
      } else {
        setRecords([])
      }
    } catch (err) {
      toast.error(err.message || 'Gagal memuat data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // A staff record table shows at most one row (one area + one month).
  const row = useMemo(
    () => records.find((r) => r.area_id === selectedArea && r.month === selectedMonth) || null,
    [records, selectedArea, selectedMonth],
  )

  const areaName = (id) => areas.find((a) => a.id === id)?.name || '—'

  const handleSubmit = async (payload) => {
    try {
      if (editing) {
        await updateData(editing.id, payload)
        toast.success('Data diperbarui.')
      } else {
        await createData({ ...payload, created_by: user.id })
        toast.success('Data ditambahkan.')
      }
      setFormOpen(false)
      setEditing(null)
      await loadAll()
    } catch (err) {
      toast.error(err.message || 'Gagal menyimpan data.')
    }
  }

  const confirmDelete = async () => {
    setBusy(true)
    try {
      await deleteData(deleting.id)
      toast.success('Data dihapus.')
      setDeleting(null)
      await loadAll()
    } catch (err) {
      toast.error(err.message || 'Gagal menghapus data.')
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-10">
        <PageHeader title="Data" subtitle="Catatan konsumsi energi per area" />
        <Spinner />
      </div>
    )
  }

  // Staff with no assigned area.
  if (areas.length === 0) {
    return (
      <div className="space-y-10">
        <PageHeader title="Data" subtitle="Catatan konsumsi energi per area" />
        <div className="bg-[#111111] border border-white/6 rounded-2xl py-24 flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
            <Inbox size={22} className="text-white/30" />
          </div>
          <p className="text-white/55 text-sm font-medium">Anda tidak terdaftar di area mana pun</p>
          <p className="text-white/35 text-xs">Hubungi admin untuk penugasan area.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-10">
      <PageHeader
        title="Data"
        subtitle="Catatan konsumsi energi per area"
        actions={
          <Button
            variant="primary"
            onClick={() => {
              setEditing(null)
              setFormOpen(true)
            }}
          >
            <Plus size={15} strokeWidth={2.5} />
            Tambah Data
          </Button>
        }
      />

      <div className="flex items-center gap-3 flex-wrap">
        <Dropdown
          icon={MapPin}
          value={selectedArea}
          onChange={setSelectedArea}
          options={areas.map((a) => ({ value: a.id, label: a.name }))}
          placeholder="Pilih Area"
        />
        <MonthSelect value={selectedMonth} onChange={setSelectedMonth} />
      </div>

      <div className="bg-[#111111] border border-white/6 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-white/2 border-b border-white/6">
                {COLS.map((c) => (
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
              {row ? (
                <tr className="hover:bg-white/2">
                  <td className="py-4 px-6 text-white/40 text-sm">1</td>
                  <td className="py-4 px-6 text-white text-sm font-medium">{areaName(row.area_id)}</td>
                  <td className="py-4 px-6 text-white/70 text-sm">{formatNumber(row.energy)}</td>
                  <td className="py-4 px-6 text-white/50 text-sm">
                    {row.energy_area_m2 ? `${formatNumber(row.energy_area_m2)} m²` : '—'}
                  </td>
                  <td className="py-4 px-6 text-white/70 text-sm">{formatRupiah(row.cost)}</td>
                  <td className="py-4 px-6 text-white/70 text-sm">{formatNumber(row.duration)}</td>
                  <td className="py-4 px-6 text-white/70 text-sm">{formatNumber(row.maintenance)}x</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(row)
                          setFormOpen(true)
                        }}
                        title="Edit"
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-white/45 hover:text-white hover:bg-white/8 transition-colors cursor-pointer"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleting(row)}
                        title="Hapus"
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-white/45 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr>
                  <td colSpan={COLS.length} className="py-16 text-center">
                    <p className="text-white/45 text-sm">
                      Belum ada data untuk area &amp; bulan ini.
                    </p>
                    <p className="text-white/30 text-xs mt-1">
                      Klik "Tambah Data" untuk menginput.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <DataFormModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false)
          setEditing(null)
        }}
        onSubmit={handleSubmit}
        areas={areas}
        record={editing}
        defaultAreaId={selectedArea}
        defaultMonth={selectedMonth}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        loading={busy}
        title="Hapus Data"
        description="Yakin menghapus catatan data energi ini?"
        confirmText="Hapus"
        variant="danger"
        icon={Trash2}
      />
    </div>
  )
}

export default DataPage
