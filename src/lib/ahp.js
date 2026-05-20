/**
 * Analytical Hierarchy Process (AHP) engine for Enerlyze.
 *
 * Goal: rank mall areas by how badly they need energy optimisation.
 * A higher final score = a more wasteful / higher-priority area.
 *
 * Pipeline:
 *   1. Criteria pairwise matrix      ← derived from each criterion's rank
 *   2. Criteria weights              ← eigenvector (normalised row averages)
 *   3. Consistency Ratio (CR)        ← λmax → CI → CR (RI = 0.90 for n=4)
 *   4. Alternative local priorities  ← per-criterion, from monthly input data
 *   5. Final score per area          ← Σ (criterion weight × local priority)
 */
import { RANDOM_INDEX } from '../constants/criteria.js'

/**
 * Map a rank difference to a Saaty intensity.
 * diff 0 → 1 (equal), 1 → 3, 2 → 5, 3 → 7  (clamped to the 1–9 scale).
 */
export const saatyFromRankDiff = (diff) => {
  const abs = Math.abs(diff)
  const value = 1 + abs * 2
  return Math.min(9, value)
}

/** Build the n×n criteria pairwise matrix from criteria ranks. */
export const buildCriteriaMatrix = (criteria) => {
  const n = criteria.length
  const matrix = Array.from({ length: n }, () => Array(n).fill(1))
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) {
        matrix[i][j] = 1
        continue
      }
      // Smaller rank = higher priority. If criterion i outranks j, i dominates.
      const diff = criteria[j].rank - criteria[i].rank
      const saaty = saatyFromRankDiff(diff)
      matrix[i][j] = diff >= 0 ? saaty : 1 / saaty
    }
  }
  return matrix
}

/** Priority vector (eigenvector approx.) via column-normalisation + row average. */
export const priorityVector = (matrix) => {
  const n = matrix.length
  const colSums = Array(n).fill(0)
  for (let j = 0; j < n; j++)
    for (let i = 0; i < n; i++) colSums[j] += matrix[i][j]

  const weights = Array(n).fill(0)
  for (let i = 0; i < n; i++) {
    let rowSum = 0
    for (let j = 0; j < n; j++) rowSum += matrix[i][j] / colSums[j]
    weights[i] = rowSum / n
  }
  return weights
}

/** Consistency metrics for a pairwise matrix given its priority vector. */
export const consistency = (matrix, weights) => {
  const n = matrix.length
  if (n < 3) return { lambdaMax: n, ci: 0, cr: 0 } // n<3 is always consistent

  // Weighted-sum vector = matrix · weights
  const weightedSum = matrix.map((row) =>
    row.reduce((acc, val, j) => acc + val * weights[j], 0),
  )
  const lambdas = weightedSum.map((ws, i) => ws / weights[i])
  const lambdaMax = lambdas.reduce((a, b) => a + b, 0) / n
  const ci = (lambdaMax - n) / (n - 1)
  const ri = RANDOM_INDEX[n] ?? 1.12
  const cr = ri === 0 ? 0 : ci / ri
  return { lambdaMax, ci, cr }
}

/**
 * Per-criterion "priority value" for one area's raw input.
 * For benefit-of-priority criteria a higher value → higher pv.
 * Maintenance is inverted: a lower frequency → higher pv (less cared for).
 */
const priorityValue = (rawValue, higherIsWorse) => {
  const v = Number(rawValue) || 0
  if (higherIsWorse) return v
  return 1 / (v > 0 ? v : 0.5)
}

/**
 * Run the full AHP analysis.
 *
 * @param {Array}  criteria    [{ key, code, name, rank, higherIsWorse }]
 * @param {Array}  areas       [{ id, name, description }]
 * @param {Object} dataByArea  { [areaId]: { energy, cost, duration, maintenance } }
 * @returns full result object ready to persist in `ahp_results_enerlyze`.
 */
export const runAHP = ({ criteria, areas, dataByArea }) => {
  // ── Sort criteria by rank for a stable matrix order ──────────────────────
  const sortedCriteria = [...criteria].sort((a, b) => a.rank - b.rank)

  // ── 1 & 2: criteria matrix + weights ─────────────────────────────────────
  const criteriaMatrix = buildCriteriaMatrix(sortedCriteria)
  const criteriaWeights = priorityVector(criteriaMatrix)
  const { lambdaMax, ci, cr } = consistency(criteriaMatrix, criteriaWeights)

  const weightByKey = {}
  sortedCriteria.forEach((c, i) => (weightByKey[c.key] = criteriaWeights[i]))

  // ── 4: local priorities of each area per criterion ───────────────────────
  // localPriority[criterionKey][areaId]
  const localPriority = {}
  for (const c of sortedCriteria) {
    const pvByArea = {}
    let total = 0
    for (const area of areas) {
      const raw = dataByArea[area.id]?.[c.key]
      const pv = priorityValue(raw, c.higherIsWorse)
      pvByArea[area.id] = pv
      total += pv
    }
    localPriority[c.key] = {}
    for (const area of areas) {
      localPriority[c.key][area.id] =
        total > 0 ? pvByArea[area.id] / total : 1 / areas.length
    }
  }

  // ── 5: final score + per-criterion contribution breakdown ────────────────
  const results = areas.map((area) => {
    const breakdown = {}
    let score = 0
    for (const c of sortedCriteria) {
      const contribution = weightByKey[c.key] * localPriority[c.key][area.id]
      breakdown[c.key] = contribution
      score += contribution
    }
    return {
      area_id: area.id,
      area_name: area.name,
      area_description: area.description || '',
      score,
      breakdown,
    }
  })

  results.sort((a, b) => b.score - a.score)
  results.forEach((r, i) => (r.rank = i + 1))

  return {
    criteria: sortedCriteria.map((c) => ({
      key: c.key,
      code: c.code,
      name: c.name,
      rank: c.rank,
      weight: weightByKey[c.key],
    })),
    criteriaMatrix,
    criteriaWeights,
    consistency: { lambdaMax, ci, cr, isConsistent: cr < 0.1 },
    ranking: results,
  }
}
