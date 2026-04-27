/**
 * Player Normalization Service
 *
 * Converts raw ranking data from heterogeneous sources (UTR, ITF, ATP)
 * into a single normalized Player Strength Score (0–1).
 *
 * Weights:
 *   UTR  → 50%  (primary performance signal)
 *   ITF  → 30%  (junior circuit performance)
 *   ATP  → 20%  (professional circuit performance)
 *
 * When a ranking source is absent, its weight is redistributed proportionally
 * across the available sources so the output remains on a 0–1 scale.
 */

const UTR_MAX = 16;
const ITF_RANK_MAX = 1500;
const ATP_RANK_MAX = 1000;

const BASE_WEIGHTS = { utr: 0.5, itf: 0.3, atp: 0.2 };

/**
 * @param {number} utr            - UTR rating (0–16)
 * @param {number|null} itf_rank  - ITF junior ranking (lower = better)
 * @param {number|null} atp_rank  - ATP ranking (lower = better)
 * @returns {{ score: number, components: object }}
 */
function normalizePlayer(utr, itf_rank, atp_rank) {
  const utr_norm = Math.min(1, Math.max(0, utr / UTR_MAX));

  const itf_norm =
    itf_rank != null
      ? Math.min(1, Math.max(0, (ITF_RANK_MAX - itf_rank) / ITF_RANK_MAX))
      : null;

  const atp_norm =
    atp_rank != null
      ? Math.min(1, Math.max(0, (ATP_RANK_MAX - atp_rank) / ATP_RANK_MAX))
      : null;

  // Collect active weights
  const active = [{ key: 'utr', norm: utr_norm, weight: BASE_WEIGHTS.utr }];
  if (itf_norm !== null) active.push({ key: 'itf', norm: itf_norm, weight: BASE_WEIGHTS.itf });
  if (atp_norm !== null) active.push({ key: 'atp', norm: atp_norm, weight: BASE_WEIGHTS.atp });

  const totalWeight = active.reduce((sum, s) => sum + s.weight, 0);
  const weightedSum = active.reduce((sum, s) => sum + s.norm * s.weight, 0);

  const score = weightedSum / totalWeight;

  return {
    score: parseFloat(score.toFixed(4)),
    components: {
      utr_normalized: parseFloat(utr_norm.toFixed(4)),
      itf_normalized: itf_norm !== null ? parseFloat(itf_norm.toFixed(4)) : null,
      atp_normalized: atp_norm !== null ? parseFloat(atp_norm.toFixed(4)) : null,
      effective_weights: {
        utr: parseFloat((BASE_WEIGHTS.utr / totalWeight).toFixed(4)),
        itf: itf_norm !== null ? parseFloat((BASE_WEIGHTS.itf / totalWeight).toFixed(4)) : 0,
        atp: atp_norm !== null ? parseFloat((BASE_WEIGHTS.atp / totalWeight).toFixed(4)) : 0,
      },
    },
  };
}

module.exports = { normalizePlayer };
