import { notFound, redirect } from 'next/navigation';

import {
  getGiftCardDetail,
  listCustomerGiftCards,
} from '@/features/gift-cards/application/queries';
import { MyGiftCardsView } from '@/features/gift-cards/ui/MyGiftCardsView';
import { getStoreGiftCardSettings } from '@/features/settings/application/queries';
import { getCurrentUser } from '@/lib/auth/session';
import { isLocale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/get-dictionary';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function MyGiftCardsPage({ params }: PageProps) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) {
    notFound();
  }

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/${rawLocale}/login`);
  }

  const dictionary = getDictionary(rawLocale);
  const copy = dictionary.profile.giftCardsPage;
  const buyCopy = dictionary.profile.giftCardsBuyPage;
  const [cards, settings] = await Promise.all([
    listCustomerGiftCards(user.id, user.email),
    getStoreGiftCardSettings(),
  ]);
  const details = await Promise.all(
    cards.map(async (card) => ({
      card,
      detail: await getGiftCardDetail(card.id),
    })),
  );

  return (
    <MyGiftCardsView
      locale={rawLocale}
      settings={settings}
      defaultPurchaserName={`${user.firstName} ${user.lastName}`.trim()}
      details={details}
      copy={{
        title: dictionary.profile.giftCards,
        buy: copy.buy,
        empty: copy.empty,
        history: copy.history,
        balance: copy.balance,
        initial: copy.initial,
        recipient: copy.recipient,
        created: copy.created,
        expires: copy.expires,
        filters: copy.filters,
        sectionsSwitcher: copy.sectionsSwitcher,
        statuses: copy.statuses,
        buyDrawer: {
          title: buyCopy.title,
          description: buyCopy.description,
          amount: buyCopy.amount,
          customAmount: buyCopy.customAmount,
          recipientName: buyCopy.recipientName,
          recipientEmail: buyCopy.recipientEmail,
          recipientPhone: buyCopy.recipientPhone,
          purchaserName: buyCopy.purchaserName,
          message: buyCopy.message,
          sendDate: buyCopy.sendDate,
          paymentMethod: buyCopy.paymentMethod,
          cashOnDelivery: buyCopy.cashOnDelivery,
          cashOnDeliveryDescription: buyCopy.cashOnDeliveryDescription,
          idram: buyCopy.idram,
          idramDescription: buyCopy.idramDescription,
          arca: buyCopy.arca,
          arcaDescription: buyCopy.arcaDescription,
          terminal: buyCopy.terminal,
          terminalDescription: buyCopy.terminalDescription,
          submit: buyCopy.submit,
          submitting: buyCopy.submitting,
          successPending: buyCopy.successPending,
        },
      }}
    />
  );
}
