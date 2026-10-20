const AGENCY_NAME = 'Neetrino';
const AGENCY_URL = 'https://neetrino.com/?utm_source=pideh.am';

type MobileCopyrightProps = {
  /** Full copyright sentence, year already interpolated. */
  text: string;
  className?: string;
};

/** Figma 366:560 — centered footer line with the agency credit linked. */
export function MobileCopyright({ text, className = '' }: MobileCopyrightProps) {
  const [lead, tail] = text.split(AGENCY_NAME);

  return (
    <p
      className={`font-montserrat mx-auto max-w-[290px] px-4 text-center text-[13px] leading-[17px] font-medium tracking-[0.3px] text-white/80 ${className}`}
    >
      <span>{lead}</span>
      <a
        href={AGENCY_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="font-semibold text-[#ffd54a] underline-offset-2 hover:underline"
      >
        {AGENCY_NAME}
      </a>
      {tail}
    </p>
  );
}
