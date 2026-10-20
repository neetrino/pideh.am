'use client';

import { SideSheet } from '@/components/ui/SideSheet';
import { BuyGiftCardForm } from '@/features/gift-cards/ui/BuyGiftCardForm';
import type { GiftCardSettings } from '@/features/gift-cards/domain/gift-card-rules';
import type { Locale } from '@/lib/i18n/config';

type BuyGiftCardDrawerCopy = {
  title: string;
  description: string;
  amount: string;
  customAmount: string;
  recipientName: string;
  recipientEmail: string;
  recipientPhone: string;
  purchaserName: string;
  message: string;
  sendDate: string;
  paymentMethod: string;
  cashOnDelivery: string;
  cashOnDeliveryDescription: string;
  idram: string;
  idramDescription: string;
  arca: string;
  arcaDescription: string;
  terminal: string;
  terminalDescription: string;
  submit: string;
  submitting: string;
  successPending: string;
};

type BuyGiftCardDrawerProps = {
  locale: Locale;
  open: boolean;
  onClose: () => void;
  settings: GiftCardSettings;
  defaultPurchaserName: string;
  copy: BuyGiftCardDrawerCopy;
};

export function BuyGiftCardDrawer({
  locale,
  open,
  onClose,
  settings,
  defaultPurchaserName,
  copy,
}: BuyGiftCardDrawerProps) {
  return (
    <SideSheet
      open={open}
      onClose={onClose}
      ariaLabel={copy.title}
      panelClassName="w-[87%] max-w-[420px]"
      panelInnerClassName="rounded-l-[20px] bg-white shadow-2xl"
      zIndexClassName="z-[200]"
      backdropBlur
      closeClassName="bg-[#ff6b00] text-white hover:bg-[#e85f00]"
    >
      <div className="flex h-full min-h-0 flex-col">
        <div className="shrink-0 border-b border-gray-100 px-6 py-5">
          <h2 className="font-display text-xl leading-none tracking-wide text-[#1e1e1e] uppercase">
            {copy.title}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">{copy.description}</p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          <BuyGiftCardForm
            locale={locale}
            settings={settings}
            defaultPurchaserName={defaultPurchaserName}
            copy={{
              title: copy.title,
              amount: copy.amount,
              customAmount: copy.customAmount,
              recipientName: copy.recipientName,
              recipientEmail: copy.recipientEmail,
              recipientPhone: copy.recipientPhone,
              purchaserName: copy.purchaserName,
              message: copy.message,
              sendDate: copy.sendDate,
              paymentMethod: copy.paymentMethod,
              cashOnDelivery: copy.cashOnDelivery,
              cashOnDeliveryDescription: copy.cashOnDeliveryDescription,
              idram: copy.idram,
              idramDescription: copy.idramDescription,
              arca: copy.arca,
              arcaDescription: copy.arcaDescription,
              terminal: copy.terminal,
              terminalDescription: copy.terminalDescription,
              submit: copy.submit,
              submitting: copy.submitting,
              successPending: copy.successPending,
            }}
          />
        </div>
      </div>
    </SideSheet>
  );
}
