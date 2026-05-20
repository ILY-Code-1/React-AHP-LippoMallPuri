import { useEffect, useState } from 'react'
import { Zap, Banknote, Clock, Wrench, Pencil, SlidersHorizontal } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import Spinner from '../../../components/ui/Spinner'
import Modal from '../../../components/ui/Modal'
import Button from '../../../components/ui/Button'
import { SelectField } from '../../../components/ui/Field'
import { CRITERIA } from '../../../constants/criteria'
import { getCriteria, updateCriterionRank } from '../../../services/criteriaService'
import { toast } from '../../../stores/toastStore'

const ICONS = { energy: Zap, cost: Banknote, duration: Clock, maintenance: Wrench }

const AHPPage = () => {
  const [criteria, setCriteria] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null) // criterion being edited
  const [rank, setRank] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      setCriteria(await getCriteria())
    } catch (err) {
      toast.error(err.message || 'Gagal memuat kriteria.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const openEdit = (c) => {
    setEditing(c)
    setRank(String(c.rank))
  }

  const saveRank = async () => {
    setSaving(true)
    try {
      await updateCriterionRank(editing.key, Number(rank))
      toast.success('Rank kriteria diperbarui.')
      setEditing(null)
      await load()
    } catch (err) {
      toast.error(err.message || 'Gagal memperbarui rank.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-10">
      <PageHeader
        title="Master AHP — Kriteria"
        subtitle="Empat kriteria penilaian prioritas. Hanya rank yang dapat diubah."
      />

      {/* Criteria description cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {CRITERIA.map(({ key, name, description }) => {
          const Icon = ICONS[key]
          return (
            <div
              key={key}
              className="bg-[#111111] border border-white/6 rounded-2xl p-7 hover:border-white/10 transition-colors"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                  <Icon size={17} className="text-white/70" strokeWidth={2} />
                </div>
                <h3 className="text-white font-semibold text-sm">{name}</h3>
              </div>
              <p className="text-white/50 text-[13px] leading-relaxed">{description}</p>
            </div>
          )
        })}
      </div>

      {/* Rank table */}
      <div className="bg-[#111111] border border-white/6 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-white/2 border-b border-white/6">
                {['Rank', 'Kriteria', 'Kode', 'Action'].map((c) => (
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
                  <td colSpan={4}>
                    <Spinner />
                  </td>
                </tr>
              ) : (
                criteria.map((c) => (
                  <tr key={c.key} className="border-b border-white/4 last:border-0 hover:bg-white/2">
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white text-black text-sm font-bold">
                        {c.rank}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-white text-sm font-medium">{c.name}</td>
                    <td className="py-4 px-6">
                      <span className="text-white/50 text-xs font-mono bg-white/5 px-2 py-1 rounded">
                        {c.code}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <button
                        type="button"
                        onClick={() => openEdit(c)}
                        className="inline-flex items-center gap-1.5 text-white/55 hover:text-white text-xs font-medium bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                      >
                        <Pencil size={13} />
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={Boolean(editing)}
        onClose={() => !saving && setEditing(null)}
        loading={saving}
        title="Edit Rank Kriteria"
        description={editing ? `${editing.name} — atur tingkat prioritas.` : ''}
        icon={SlidersHorizontal}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)} disabled={saving}>
              Batal
            </Button>
            <Button variant="primary" onClick={saveRank} disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </>
        }
      >
        <SelectField
          label="Rank Prioritas"
          value={rank}
          onChange={(e) => setRank(e.target.value)}
          options={[1, 2, 3, 4].map((n) => ({ value: String(n), label: `Rank ${n}` }))}
          hint="Rank 1 = prioritas tertinggi. Rank akan ditukar otomatis bila sudah dipakai kriteria lain."
        />
      </Modal>
    </div>
  )
}

export default AHPPage
