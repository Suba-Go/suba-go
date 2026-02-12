export type BidValidationFailureReason = 'BELOW_MIN' | 'NOT_MULTIPLE';

export type BidValidationResult =
  | { ok: true; nextValid: number }
  | { ok: false; reason: BidValidationFailureReason; nextValid: number };

export type BidConstraints = {
  /** Base price used for step alignment (starting bid when no bids, otherwise current max). */
  base: number;
  /** Minimum accepted bid amount right now (starting bid when no bids, otherwise max + increment). */
  minimumBid: number;
  /** Step/increment enforced for bids (>= 1). */
  bidIncrement: number;
};

/**
 * Compute bidding constraints using the SAME rule used in the backend.
 *
 * Business rule (do NOT change):
 * - If there is a previous bid, next minimum is base + bidIncrement.
 * - Otherwise, first minimum is base (startingBid).
 */
export function computeBidConstraints(params: {
  base: number;
  bidIncrement: number;
  hasPreviousBid: boolean;
}): BidConstraints {
  const base = Number(params.base) || 0;
  const bidIncrement = Math.max(1, Number(params.bidIncrement) || 1);
  const minimumBid = params.hasPreviousBid ? base + bidIncrement : base;
  return { base, bidIncrement, minimumBid };
}

/**
 * Validate a proposed bid amount against the constraints.
 *
 * This helper is designed to be shared by frontend and backend to keep
 * increment/minimum calculations consistent.
 */
export function validateBidAmount(params: {
  amount: number;
  base: number;
  minimumBid: number;
  bidIncrement: number;
}): BidValidationResult {
  const amount = Number(params.amount);
  const base = Number(params.base) || 0;
  const bidIncrement = Math.max(1, Number(params.bidIncrement) || 1);
  const minimumBid = Number(params.minimumBid) || 0;

  if (!Number.isFinite(amount)) {
    return { ok: false, reason: 'BELOW_MIN', nextValid: minimumBid };
  }

  if (amount < minimumBid) {
    return { ok: false, reason: 'BELOW_MIN', nextValid: minimumBid };
  }

  const diff = amount - base;
  // diff can be 0 only when there was no previous bid (first bid equals startingBid)
  if (diff % bidIncrement !== 0) {
    const nextValid = base + Math.ceil(diff / bidIncrement) * bidIncrement;
    return { ok: false, reason: 'NOT_MULTIPLE', nextValid };
  }

  return { ok: true, nextValid: amount };
}
