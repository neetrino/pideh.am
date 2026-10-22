/** Status pill classes — Pideh kitchen-ops tones. */
export function orderStatusBadgeClass(status: string): string {
  const normalized = status.toUpperCase();
  if (normalized === 'PENDING' || normalized === 'CONFIRMED') {
    return 'bg-[#ffd54a]/70 text-[#1e1e1e]';
  }
  if (normalized === 'PROCESSING' || normalized === 'SHIPPED') {
    return 'bg-[#fff8e7] text-[#ff6b00] ring-1 ring-[#ff6b00]/25';
  }
  if (normalized === 'DELIVERED') {
    return 'bg-emerald-700 text-white';
  }
  if (normalized === 'CANCELLED' || normalized === 'FAILED') {
    return 'bg-red-600 text-white';
  }
  if (normalized === 'REFUNDED') {
    return 'bg-[#ff6b00]/15 text-[#c2410c]';
  }
  return 'bg-[#1e1e1e]/8 text-[#1e1e1e]';
}

export function paymentStatusBadgeClass(status: string): string {
  const normalized = status.toUpperCase();
  if (normalized === 'PAID' || normalized === 'CAPTURED') {
    return 'bg-emerald-700 text-white';
  }
  if (normalized === 'PENDING' || normalized === 'AUTHORIZED') {
    return 'bg-[#ffd54a]/70 text-[#1e1e1e]';
  }
  if (normalized === 'CANCELLED' || normalized === 'FAILED') {
    return 'bg-red-600 text-white';
  }
  if (normalized === 'REFUNDED') {
    return 'bg-[#ff6b00]/15 text-[#c2410c]';
  }
  return 'bg-[#1e1e1e]/8 text-[#1e1e1e]';
}

/** Group-order lifecycle pills — soft semantic tones for the admin list. */
export function groupOrderStatusBadgeClass(status: string): string {
  const normalized = status.toUpperCase();
  if (normalized === 'PAID' || normalized === 'COMPLETED') {
    return 'bg-emerald-50 text-emerald-800';
  }
  if (normalized === 'CANCELLED' || normalized === 'EXPIRED') {
    return 'bg-red-50 text-red-700';
  }
  if (normalized === 'OPEN') {
    return 'bg-amber-50 text-amber-800';
  }
  if (
    normalized === 'LOCKED' ||
    normalized === 'AWAITING_PAYMENTS' ||
    normalized === 'CHECKOUT' ||
    normalized === 'PREPARING'
  ) {
    return 'bg-[#ffd54a]/70 text-[#1e1e1e]';
  }
  return 'bg-[#1e1e1e]/8 text-[#1e1e1e]';
}

/** Coupon effective-status pills for the admin list. */
export function couponAdminStatusBadgeClass(status: string): string {
  const normalized = status.toUpperCase();
  if (normalized === 'ACTIVE') {
    return 'bg-emerald-50 text-emerald-800';
  }
  if (normalized === 'SCHEDULED') {
    return 'bg-amber-50 text-amber-800';
  }
  if (normalized === 'EXPIRED' || normalized === 'USED_UP') {
    return 'bg-red-50 text-red-700';
  }
  if (normalized === 'INACTIVE') {
    return 'bg-[#1e1e1e]/8 text-[#1e1e1e]';
  }
  return 'bg-[#1e1e1e]/8 text-[#1e1e1e]';
}

export const ADMIN_BADGE = 'inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold';
