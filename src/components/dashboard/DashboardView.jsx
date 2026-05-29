import { useEffect, useMemo, useState } from 'react'
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { Building2, Zap, DollarSign, Gauge, CalendarRange, X } from 'lucide-react'
import PageHeader from '../ui/PageHeader'
import Spinner from '../ui/Spinner'
import Dropdown from '../ui/Dropdown'
import { getAreas } from '../../services/areaService'
import { getDataByMonths } from '../../services/dataService'
import { getAllAhpResults } from '../../services/ahpService'
import {
  prevMonthKey, monthKeyRange, formatMonthShort, formatMonthKey,
  formatRupiah, formatRupiahCompact, formatNumber,
} from '../../lib/format'
import { toast } from '../../stores/toastStore'

/* Grayscale palette for the area series (monochrome theme). */
const SHADES = ['#ffffff', '#c4c4c8', '#9a9aa0', '#76767c', '#5a5a60', '#444448', '#34343a', '#26262a']

const RANGE_OPTIONS = [3, 6, 9, 12, 15, 18, 20].map((n) => ({
  value: String(n),
  label: `${n} bulan terakhir`,
}))

const CRIT_LABEL = { energy: 'Energi', cost: 'Biaya', duration: 'Durasi', maintenance: 'Maintenance' }

/* Recharts passes click args with differing shapes; dig out the month key. */
const pickMonthKey = (...args) => {
  for (const a of args) {
    if (a?.payload?._key) return a.payload._key
    if (a?._key) return a._key
  }
  return null
}

/* Hover tooltip: one row per area (bar + line share a dataKey → dedupe). */
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  const seen = new Set()
  const rows = payload
    .filter((p) => p.value != null && !seen.has(p.dataKey) && seen.add(p.dataKey))
    .sort((a, b) => b.value - a.value)
  if (!rows.length) return null
  return (
    <div style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '10px 12px', minWidth: 168 }}>
      <div style={{ color: '#fff', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>{label}</div>
      {rows.map((r) => (
        <div key={r.dataKey} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, marginTop: 3 }}>
          <span style={{ width: 9, height: 9, borderRadius: 2, background: r.color, flexShrink: 0 }} />
          <span style={{ color: 'rgba(255,255,255,0.7)', flex: 1 }}>{r.dataKey}</span>
          <span style={{ color: '#fff', fontFamily: 'monospace', fontWeight: 600 }}>{r.value.toFixed(3)}</span>
        </div>
      ))}
      <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, marginTop: 8 }}>Klik bar / titik untuk detail</div>
    </div>
  )
}

const Stat = ({ label, value }) => (
  <div className="bg-white/5 rounded-lg px-3 py-2.5">
    <p className="text-white/40 text-[10px] font-medium">{label}</p>
    <p className="text-white text-[13px] font-semibold mt-0.5">{value}</p>
  </div>
)

const DashboardView = ({ subtitle }) => {
  const [range, setRange] = useState('3')
  const [areas, setAreas] = useState([])
  const [data, setData] = useState([])
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeArea, setActiveArea] = useState(null) // highlighted area name
  const [selected, setSelected] = useState(null) // pinned point: { areaId, areaName, monthKey }

  // Range starts from the previous completed month (current month excluded).
  const months = useMemo(() => monthKeyRange(prevMonthKey(), Number(range)), [range])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const [a, d, r] = await Promise.all([
          getAreas(),
          getDataByMonths(months),
          getAllAhpResults(),
        ])
        if (cancelled) return
        setAreas(a)
        setData(d)
        setResults(r)
      } catch (err) {
        if (!cancelled) toast.error(err.message || 'Gagal memuat dashboard.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [months])

  // ── KPI cards ────────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const totalEnergy = data.reduce((s, d) => s + (d.energy || 0), 0)
    const totalCost = data.reduce((s, d) => s + (d.cost || 0), 0)
    const scores = results
      .filter((r) => months.includes(r.month))
      .flatMap((r) => (r.ranking || []).map((x) => x.score))
    const avgScore = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
    return { totalArea: areas.length, totalEnergy, totalCost, avgScore }
  }, [data, results, areas, months])

  // ── Chart data: one row per month, one key per area = AHP score ──────────
  const chartData = useMemo(() => {
    const byMonth = {}
    results.forEach((r) => (byMonth[r.month] = r))
    return months.map((m) => {
      const row = { month: formatMonthShort(m), _key: m }
      const ranking = byMonth[m]?.ranking || []
      areas.forEach((a) => {
        const found = ranking.find((x) => x.area_id === a.id)
        row[a.name] = found ? Number(found.score.toFixed(3)) : null
      })
      return row
    })
  }, [months, results, areas])

  // Lookups for the pinned-point detail panel.
  const dataIndex = useMemo(() => {
    const map = {}
    data.forEach((d) => (map[`${d.area_id}__${d.month}`] = d))
    return map
  }, [data])

  const ahpByMonth = useMemo(() => {
    const map = {}
    results.forEach((r) => (map[r.month] = r))
    return map
  }, [results])

  const detail = useMemo(() => {
    if (!selected) return null
    const rec = dataIndex[`${selected.areaId}__${selected.monthKey}`] || null
    const ahpRow =
      ahpByMonth[selected.monthKey]?.ranking?.find((x) => x.area_id === selected.areaId) || null
    return { rec, ahpRow }
  }, [selected, dataIndex, ahpByMonth])

  const selectPoint = (areaId, areaName) => (...args) => {
    const monthKey = pickMonthKey(...args)
    if (monthKey) setSelected({ areaId, areaName, monthKey })
  }

  const colorFor = (idx) => SHADES[idx % SHADES.length]

  if (loading) {
    return (
      <div className="space-y-10">
        <PageHeader title="Dashboard" subtitle={subtitle} />
        <Spinner />
      </div>
    )
  }

  const cards = [
    { label: 'Total Area', value: formatNumber(kpis.totalArea), icon: Building2 },
    { label: 'Total Konsumsi', value: `${formatNumber(kpis.totalEnergy)} kWh`, icon: Zap },
    { label: 'Total Biaya', value: formatRupiahCompact(kpis.totalCost), icon: DollarSign },
    { label: 'Rata-rata Skor AHP', value: kpis.avgScore.toFixed(3), icon: Gauge },
  ]

  return (
    <div className="space-y-10">
      <PageHeader
        title="Dashboard"
        subtitle={subtitle}
        actions={
          <Dropdown
            icon={CalendarRange}
            value={range}
            onChange={setRange}
            options={RANGE_OPTIONS}
          />
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="bg-[#111111] border border-white/6 rounded-2xl p-6 hover:border-white/10 transition-colors"
          >
            <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center mb-5">
              <Icon size={16} className="text-white/60" strokeWidth={2} />
            </div>
            <p className="text-white/45 text-xs font-medium mb-1">{label}</p>
            <p className="text-white text-2xl font-semibold tracking-tight">{value}</p>
          </div>
        ))}
      </div>

      <div className="bg-[#111111] border border-white/6 rounded-2xl p-8">
        <div className="mb-6">
          <h3 className="text-white font-semibold text-base">Skor AHP per Area</h3>
          <p className="text-white/40 text-xs mt-1">
            Perbandingan skor prioritas tiap area antar bulan · garis menghubungkan area yang sama
          </p>
        </div>

        {areas.length === 0 ? (
          <div className="py-20 text-center text-white/40 text-sm">Belum ada area terdaftar.</div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={360}>
              <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  content={<ChartTooltip />}
                  cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                />
                {areas.map((a, i) => {
                  const dim = activeArea && activeArea !== a.name
                  return (
                    <Bar
                      key={`bar-${a.id}`}
                      dataKey={a.name}
                      fill={colorFor(i)}
                      fillOpacity={dim ? 0.15 : 0.9}
                      radius={[3, 3, 0, 0]}
                      maxBarSize={26}
                      cursor="pointer"
                      onClick={selectPoint(a.id, a.name)}
                    />
                  )
                })}
                {areas.map((a, i) => {
                  const dim = activeArea && activeArea !== a.name
                  return (
                    <Line
                      key={`line-${a.id}`}
                      type="monotone"
                      dataKey={a.name}
                      stroke={colorFor(i)}
                      strokeWidth={activeArea === a.name ? 2.5 : 1.5}
                      strokeOpacity={dim ? 0.12 : 1}
                      dot={{ r: 2.5, fill: colorFor(i) }}
                      activeDot={{ r: 5, cursor: 'pointer', onClick: selectPoint(a.id, a.name) }}
                      connectNulls
                      legendType="none"
                    />
                  )
                })}
              </ComposedChart>
            </ResponsiveContainer>

            {/* Custom legend — click to highlight an area across months */}
            <div className="flex flex-wrap gap-2 mt-6">
              {areas.map((a, i) => {
                const isActive = activeArea === a.name
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setActiveArea(isActive ? null : a.name)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
                      isActive
                        ? 'bg-white/10 border-white/20 text-white'
                        : activeArea
                          ? 'bg-white/3 border-white/6 text-white/35'
                          : 'bg-white/5 border-white/8 text-white/65 hover:bg-white/8'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-sm"
                      style={{ background: colorFor(i) }}
                    />
                    {a.name}
                  </button>
                )
              })}
              {activeArea && (
                <button
                  type="button"
                  onClick={() => setActiveArea(null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-white/40 hover:text-white transition-colors cursor-pointer"
                >
                  Reset highlight
                </button>
              )}
            </div>

            {/* Pinned point detail — appears when a bar/point is clicked */}
            {detail && (
              <div className="mt-6 bg-[#161616] border border-white/10 rounded-xl p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-white font-semibold text-sm">{selected.areaName}</p>
                    <p className="text-white/40 text-xs mt-0.5">{formatMonthKey(selected.monthKey)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelected(null)}
                    aria-label="Tutup detail"
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <X size={15} />
                  </button>
                </div>

                {detail.ahpRow ? (
                  <div className="flex items-center gap-8 mt-4">
                    <div>
                      <p className="text-white/40 text-[11px]">Skor AHP</p>
                      <p className="text-white text-lg font-semibold font-mono">{detail.ahpRow.score.toFixed(3)}</p>
                    </div>
                    <div>
                      <p className="text-white/40 text-[11px]">Peringkat Prioritas</p>
                      <p className="text-white text-lg font-semibold">#{detail.ahpRow.rank}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-white/35 text-xs mt-4">AHP belum dijalankan untuk bulan ini.</p>
                )}

                {detail.rec ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                    <Stat label="Konsumsi" value={`${formatNumber(detail.rec.energy)} kWh`} />
                    <Stat label="Biaya Listrik" value={formatRupiah(detail.rec.cost)} />
                    <Stat label="Durasi" value={`${formatNumber(detail.rec.duration)} jam`} />
                    <Stat label="Maintenance" value={`${formatNumber(detail.rec.maintenance)}x`} />
                  </div>
                ) : (
                  <p className="text-white/35 text-xs mt-3">Tidak ada data input energi untuk titik ini.</p>
                )}

                {detail.ahpRow?.breakdown && (
                  <div className="mt-5">
                    <p className="text-white/40 text-[11px] mb-2">Kontribusi per kriteria terhadap skor</p>
                    <div className="flex flex-col gap-2">
                      {Object.keys(CRIT_LABEL).map((k) => {
                        const v = detail.ahpRow.breakdown[k] || 0
                        const pct = detail.ahpRow.score ? (v / detail.ahpRow.score) * 100 : 0
                        return (
                          <div key={k} className="flex items-center gap-3 text-xs">
                            <span className="text-white/55 w-20 shrink-0">{CRIT_LABEL[k]}</span>
                            <div className="flex-1 h-1.5 rounded-full bg-white/8 overflow-hidden">
                              <div className="h-full bg-white/55 rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-white/60 font-mono w-14 text-right">{v.toFixed(3)}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default DashboardView
