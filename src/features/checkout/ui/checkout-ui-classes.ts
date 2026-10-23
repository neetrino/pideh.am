/** Storefront checkout surfaces — same orange, cream, and radius as the profile. */

export const CHECKOUT_PANEL =
  'rounded-[26px] border-t-[3px] border-t-[#ff6b00] bg-white p-5 sm:p-6';

export const CHECKOUT_INSET = 'rounded-[18px] border border-[#ff6b00]/15 bg-[#fff8e7]/70 p-4';

export const CHECKOUT_FIELD =
  'h-11 w-full rounded-[18px] border-[1.5px] border-[#1e1e1e]/12 bg-[#fff8e7] px-4 text-sm text-[#1e1e1e] outline-none transition placeholder:text-[#1e1e1e]/35 focus:border-[#ff6b00] focus:ring-2 focus:ring-[#ff6b00]/20 disabled:opacity-60';

export const CHECKOUT_LABEL = 'flex flex-col gap-1.5 text-sm font-bold text-[#1e1e1e]';

export const CHECKOUT_SECTION_TITLE =
  'mb-6 font-display text-2xl leading-none text-[#1e1e1e] uppercase';

export const CHECKOUT_PRIMARY_BTN =
  '!h-12 !w-full !rounded-full !bg-[#ff6b00] !font-bold !text-white !ring-2 !ring-[#ff6b00] !ring-offset-2 !ring-offset-white hover:!bg-[#e85f00] focus:!ring-[#ff6b00]';

export const CHECKOUT_APPLY_BTN =
  '!h-[37px] !shrink-0 !rounded-[13px] !border-transparent !bg-[#ff6b00] !px-4 !text-sm !font-bold !text-white hover:!bg-[#e85f00] focus:!ring-[#ff6b00] disabled:!bg-[#ff6b00]/45 disabled:!text-white/80 disabled:!opacity-100';

/** Native radio redrawn in orange, with no black ring or dot. */
export const CHECKOUT_RADIO =
  'size-4 shrink-0 appearance-none rounded-full border-2 border-[#ff6b00] bg-white bg-center bg-no-repeat outline-none checked:bg-[radial-gradient(circle,#ff6b00_45%,transparent_47%)] focus-visible:ring-2 focus-visible:ring-[#ff6b00]/35 disabled:cursor-not-allowed disabled:opacity-40';

export const CHECKOUT_RADIO_ON = 'border-[#ff6b00] bg-[#fff8e7]';

export const CHECKOUT_RADIO_OFF =
  'border-[#ff6b00]/20 bg-white hover:border-[#ff6b00]/45 hover:bg-[#fff8e7]/60';
