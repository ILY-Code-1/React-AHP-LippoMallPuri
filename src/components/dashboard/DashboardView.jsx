import { useEffect, useMemo, useState } from 'react'
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { Building2, Zap, DollarSign, Gauge, CalendarRange } from 'lucide-react'
import PageHeader from '../ui/PageHeader'
import Spinner from '../ui/Spinner'
import Dropdown from '../ui/Dropdown'
import { getAreas } from '../../services/areaService'
import { getDataByMonths } from '../../services/dataService'
import { getAllAhpResults } from '../../services/ahpService'
import {
  toMonthKey, monthKeyRange, formatMonthShort, formatRupiahCompact, formatNumber,
} from '../../lib/format'
import { toast } from '../../stores/toastStore'

/* Grayscale palette for the area series (monochrome theme). */
const SHADES = ['#ffffff', '#c4c4c8', '#9a9aa0', '#76767c', '#5a5a60', '#444448', '#34343a', '#26262a']

const RANGE_OPTIONS = [3, 6, 9, 12, 15, 18, 20].map((n) => ({
  value: String(n),
  label: `${n} bulan terakhir`,
}))

const DashboardView = ({ subtitle }) => {
  const [range, setRange] = useState('3')
  const [areas, setAreas] = useState([])
  const [data, setData] = useState([])
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeArea, setActiveArea] = useState(null) // highlighted area name

  const months = useMemo(() => monthKeyRange(toMonthKey(), Number(range)), [range])

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
      const row = { month: formatMonthShort(m) }
      const ranking = byMonth[m]?.ranking || []
      areas.forEach((a) => {
        const found = ranking.find((x) => x.area_id === a.id)
        row[a.name] = found ? Number(found.score.toFixed(3)) : null
      })
      return row
    })
  }, [months, results, areas])

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
                  contentStyle={{
                    background: '#0a0a0a',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 10,
                    color: '#fff',
                    fontSize: 12,
                  }}
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
          </>
        )}
      </div>
    </div>
  )
}

export default DashboardView
