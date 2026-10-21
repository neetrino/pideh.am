import { notFound } from 'next/navigation';

import { LoginScene } from '@/features/auth/ui/LoginScene';
import { RegisterForm } from '@/features/auth/ui/RegisterForm';
import { isLocale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/get-dictionary';

type RegisterPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function RegisterPage({ params }: RegisterPageProps) {
  const { locale: rawLocale } = await params;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const dictionary = getDictionary(rawLocale);
  const { auth } = dictionary;

  return (
    <LoginScene
      title={auth.registerTitle}
      mobileBackgroundSrc="/brand/pideh/register-food-bg-mobile.png"
      copyrightText={dictionary.footer.copyrightMobile.replace('{year}', String(new Date().getFullYear()))}
    >
      <RegisterForm locale={rawLocale} dictionary={auth} />
    </LoginScene>
  );
}
