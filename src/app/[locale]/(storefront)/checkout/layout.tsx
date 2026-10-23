import { TidioAdminSuppress } from '@/components/layout/TidioAdminSuppress';

type CheckoutLayoutProps = {
  children: React.ReactNode;
};

/** Checkout has no live chat. The widget returns on other storefront pages. */
export default function CheckoutLayout({ children }: CheckoutLayoutProps) {
  return (
    <>
      <TidioAdminSuppress />
      {children}
    </>
  );
}
