/**
 * Reusable recommendation templates for the View Detail report (section 05).
 *
 * Action items are picked based on which criteria contribute most to an area's
 * AHP score — the bigger a criterion's contribution, the more relevant its
 * remediation actions.
 */

const TEMPLATES = {
  energy: [
    'Pasang motion sensor pada area koridor & ruang non-tenant.',
    'Evaluasi penggantian lampu down-light ke LED hemat daya (9W).',
    'Aktifkan penjadwalan otomatis untuk mematikan beban saat off-peak.',
  ],
  cost: [
    'Tinjau ulang golongan tarif & daya tersambung PLN terhadap beban riil.',
    'Geser beban non-kritikal ke jam luar waktu beban puncak (LWBP).',
    'Pasang sub-metering untuk memantau kontribusi biaya per zona.',
  ],
  duration: [
    'Atur ulang setpoint AC dari 22°C → 24°C pada jam 10.00–14.00.',
    'Perpendek durasi operasional peralatan di luar jam kunjungan ramai.',
    'Variabelkan kecepatan exhaust fan berdasarkan kadar CO₂.',
  ],
  maintenance: [
    'Tingkatkan frekuensi maintenance dari 1x → 2x per bulan.',
    'Jadwalkan pembersihan filter AC & coil secara berkala.',
    'Lakukan audit kondisi peralatan untuk mencegah pemborosan energi.',
  ],
}

/** Estimated monthly saving band, scaled loosely to the area's AHP score. */
const savingBand = (score) => {
  if (score >= 0.3) return '~12–15% konsumsi bulanan'
  if (score >= 0.22) return '~8–10% konsumsi bulanan'
  if (score >= 0.15) return '~5–7% konsumsi bulanan'
  return '~3–5% konsumsi bulanan'
}

/**
 * Build a recommendation block for one ranked area.
 * @param {Object} entry  a `ranking[i]` item from runAHP() (has breakdown + score)
 * @returns {{ actions: string[], saving: string }}
 */
export const buildRecommendation = (entry) => {
  const breakdown = entry.breakdown || {}
  // Criteria ordered by contribution, strongest first.
  const ordered = Object.keys(breakdown).sort(
    (a, b) => (breakdown[b] || 0) - (breakdown[a] || 0),
  )

  const actions = []
  // One action from each of the top contributing criteria, until we have 3.
  for (const key of ordered) {
    const pool = TEMPLATES[key] || []
    const pick = pool[actions.length % pool.length]
    if (pick && !actions.includes(pick)) actions.push(pick)
    if (actions.length >= 3) break
  }
  // Always ensure maintenance advice appears for low-maintenance areas.
  if (!actions.some((a) => a.toLowerCase().includes('maintenance'))) {
    if (ordered.includes('maintenance')) actions[2] = TEMPLATES.maintenance[0]
  }

  return { actions: actions.slice(0, 3), saving: savingBand(entry.score) }
}
