import { useEffect, useState } from 'react'
import { Database } from 'lucide-react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import MonthSelect from '../ui/MonthSelect'
import { TextField, SelectField } from '../ui/Field'
import { formatNumber } from '../../lib/format'

const blank = {
  area_id: '', month: '', energy: '', energy_area_m2: '', cost: '', duration: '', maintenance: '',
}

/**
 * Add/Edit form for a monthly energy record.
 * `areas` = the areas the user may pick from. `record` = row being edited (or null).
 */
const DataFormModal = ({ open, onClose, onSubmit, areas = [], record, defaultAreaId, defaultMonth }) => {
  const [form, setForm] = useState(blank)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    if (record) {
      setForm({
        area_id: record.area_id || '',
        month: record.month || '',
        energy: String(record.energy ?? ''),
        energy_area_m2: String(record.energy_area_m2 ?? ''),
        cost: String(record.cost ?? ''),
        duration: String(record.duration ?? ''),
        maintenance: String(record.maintenance ?? ''),
      })
    } else {
      setForm({ ...blank, area_id: defaultAreaId || '', month: defaultMonth || '' })
    }
    setErrors({})
  }, [open, record, defaultAreaId, defaultMonth])

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  // Numeric fields: keep digits only.
  const setNum = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value.replace(/[^\d]/g, '') }))

  const validate = () => {
    const e = {}
    if (!form.area_id) e.area_id = 'Pilih area.'
    if (!form.month) e.month = 'Pilih bulan.'
    if (form.energy === '') e.energy = 'Wajib diisi.'
    if (form.cost === '') e.cost = 'Wajib diisi.'
    if (form.duration === '') e.duration = 'Wajib diisi.'
    if (form.maintenance === '') e.maintenance = 'Wajib diisi.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      await onSubmit({
        area_id: form.area_id,
        month: form.month,
        energy: Number(form.energy) || 0,
        energy_area_m2: Number(form.energy_area_m2) || 0,
        cost: Number(form.cost) || 0,
        duration: Number(form.duration) || 0,
        maintenance: Number(form.maintenance) || 0,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => !saving && onClose()}
      loading={saving}
      title={record ? 'Edit Data Energi' : 'Tambah Data Energi'}
      description="Input data konsumsi energi per area per bulan."
      icon={Database}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Batal
          </Button>
          <Button variant="primary" onClick={submit} disabled={saving}>
            {saving ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <SelectField
          label="Area"
          value={form.area_id}
          onChange={set('area_id')}
          error={errors.area_id}
          placeholder="Pilih area"
          options={areas.map((a) => ({ value: a.id, label: a.name }))}
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-white/70 text-xs font-semibold tracking-wide">Bulan</label>
          <MonthSelect value={form.month} onChange={(m) => setForm((f) => ({ ...f, month: m }))} />
          {errors.month && <p className="text-red-400 text-[11px] font-medium">{errors.month}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <TextField
          label="Konsumsi Energi (kWh)"
          inputMode="numeric"
          value={form.energy === '' ? '' : formatNumber(form.energy)}
          onChange={setNum('energy')}
          error={errors.energy}
          placeholder="100.000"
        />
        <TextField
          label="Luasan Area (m²)"
          inputMode="numeric"
          value={form.energy_area_m2 === '' ? '' : formatNumber(form.energy_area_m2)}
          onChange={setNum('energy_area_m2')}
          placeholder="12.000"
          hint="Keterangan luasan untuk konteks konsumsi."
        />
      </div>

      <TextField
        label="Biaya Listrik (Rp)"
        inputMode="numeric"
        value={form.cost === '' ? '' : `Rp ${formatNumber(form.cost)}`}
        onChange={setNum('cost')}
        error={errors.cost}
        placeholder="Rp 0"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <TextField
          label="Durasi Operasional (jam)"
          inputMode="numeric"
          value={form.duration}
          onChange={setNum('duration')}
          error={errors.duration}
          placeholder="0"
        />
        <TextField
          label="Frekuensi Maintenance (x/bulan)"
          inputMode="numeric"
          value={form.maintenance}
          onChange={setNum('maintenance')}
          error={errors.maintenance}
          placeholder="0"
        />
      </div>
    </Modal>
  )
}

export default DataFormModal
