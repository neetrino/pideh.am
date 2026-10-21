const AGENCY_NAME = 'Neetrino';
const AGENCY_URL = 'https://neetrino.com/?utm_source=pideh.am';

type MobileCopyrightProps = {
  /** Full copyright sentence, year already interpolated. */
  text: string;
  /** Orange pages use light type. Cream pages use ink. */
  tone?: 'onOrange' | 'onCream';
  className?: string;
};

/** Figma 366:560 — centered footer line with the agency credit linked. */
export function MobileCopyright({ text, tone = 'onOrange', className = '' }: MobileCopyrightProps) {
  const [lead, tail] = text.split(AGENCY_NAME);
  const ink = tone === 'onCream' ? 'text-[#1e1e1e]/55' : 'text-white/80';
  const link = tone === 'onCream' ? 'text-[#ff6b00]' : 'text-[#ffd54a]';

  return (
    <p
      className={`font-montserrat mx-auto max-w-[290px] px-4 text-center text-[13px] leading-[17px] font-medium tracking-[0.3px] ${ink} ${className}`}
    >
      <span>{lead}</span>
      <a
        href={AGENCY_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={`font-semibold underline-offset-2 hover:underline ${link}`}
      >
        {AGENCY_NAME}
      </a>
      {tail}
    </p>
  );
}
