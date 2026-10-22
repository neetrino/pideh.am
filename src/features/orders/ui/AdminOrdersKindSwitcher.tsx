'use client';

import { LayoutGroup, motion, useReducedMotion } from 'motion/react';
import Link from 'next/link';

import {
  ADMIN_ORDER_LIST_KINDS,
  type AdminOrderListKind,
} from '@/features/orders/domain/admin-order-list-kind';

type AdminOrdersKindSwitcherProps = {
  locale: string;
  kind: AdminOrderListKind;
  labels: {
    aria: string;
    all: string;
    individual: string;
    group: string;
  };
};

function kindHref(locale: string, kind: AdminOrderListKind): string {
  const base = `/${locale}/admin/orders`;
  return kind === 'all' ? base : `${base}?kind=${kind}`;
}

export function AdminOrdersKindSwitcher({ locale, kind, labels }: AdminOrdersKindSwitcherProps) {
  const reduceMotion = useReducedMotion() ?? false;

  return (
    <nav
      aria-label={labels.aria}
      className="inline-flex items-center rounded-full bg-[#e8edf2] p-1"
    >
      <LayoutGroup id="admin-orders-kind">
        {ADMIN_ORDER_LIST_KINDS.map((value) => {
          const active = kind === value;
          return (
            <Link
              key={value}
              href={kindHref(locale, value)}
              aria-current={active ? 'page' : undefined}
              className={`relative rounded-full px-5 py-2 text-sm whitespace-nowrap transition-colors duration-300 ${
                active ? 'font-semibold text-[#1a5c3a]' : 'font-medium text-[#8b95a1] hover:text-[#5b6570]'
              }`}
            >
              {active ? (
                <motion.span
                  layoutId="admin-orders-kind-pill"
                  className="absolute inset-0 rounded-full bg-white shadow-[0_1px_3px_rgba(16,24,40,0.08)]"
                  transition={
                    reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 34 }
                  }
                />
              ) : null}
              <span className="relative z-[1]">{labels[value]}</span>
            </Link>
          );
        })}
      </LayoutGroup>
    </nav>
  );
}
