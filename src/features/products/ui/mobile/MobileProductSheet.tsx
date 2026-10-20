import type { ReactNode } from 'react';

type MobileProductSheetProps = {
  title: string;
  wishlist: ReactNode;
  priceRow: ReactNode;
  /** Fills the Figma gap between the heading and the price row (268:595). */
  children?: ReactNode;
  footer?: ReactNode;
  paddingBottomPx: number;
};

/**
 * Figma 268:595 — white PDP sheet: heading, wishlist, price, quantity.
 *
 * @see https://www.figma.com/design/zyLVZFDhohLYxwuohIrPDN/Pideh-Dev?node-id=268-595
 */
export function MobileProductSheet({
  title,
  wishlist,
  priceRow,
  children,
  footer,
  paddingBottomPx,
}: MobileProductSheetProps) {
  return (
    <div
      data-node-id="268:595"
      className="relative z-10 overflow-clip rounded-[30px] bg-white px-[22px] pt-7"
      style={{ paddingBottom: paddingBottomPx }}
    >
      <div className="flex flex-col">
        <div className="flex items-start justify-between gap-3">
          <h1 className="font-display min-w-0 text-[40px] !leading-[1.25] text-[#1e1e1e]">
            {title}
          </h1>
          <div className="shrink-0 pt-1">{wishlist}</div>
        </div>
        {children}
      </div>

      <div className="mt-3 flex min-w-0 items-center justify-between gap-2">{priceRow}</div>
      {footer}
    </div>
  );
}
