import { MOBILE_HOME_ASSETS } from '@/features/home/ui/mobile/mobile-assets';

type MobileBranchCardProps = {
  address: string;
  phoneHref: string;
  contactLabel: string;
};

/**
 * Figma branch card (268:541) — pin bleeds past the white card onto orange.
 *
 * @see https://www.figma.com/design/zyLVZFDhohLYxwuohIrPDN/Pideh-Dev?node-id=268-541
 */
export function MobileBranchCard({ address, phoneHref, contactLabel }: MobileBranchCardProps) {
  return (
    <div
      data-node-id="268:541"
      className="relative h-[148px] w-full shrink-0 overflow-visible rounded-[20px] bg-white text-left text-[18px] text-[#1e1e1e]"
    >
      <p
        data-node-id="268:542"
        className="absolute top-[calc(50%-49px)] right-[13.17%] left-[41.22%] text-[18px] leading-[22px] font-semibold"
      >
        {address}
      </p>

      {/* eslint-disable-next-line @next/next/no-img-element -- Figma pin with object-cover */}
      <img
        data-node-id="268:543"
        src={MOBILE_HOME_ASSETS.branchPin}
        alt=""
        width={173}
        height={181}
        className="pointer-events-none absolute top-[-22px] left-[-14px] z-[1] h-[181px] w-[173px] shrink-0 object-cover"
      />

      <a
        data-node-id="268:549"
        href={phoneHref}
        className="absolute top-[92px] left-[169px] z-[2] h-12 w-[228px] shrink-0 overflow-hidden rounded-[30px] bg-[#ffd54a] text-[16px] text-[#101828]"
      >
        <span
          data-node-id="268:550"
          className="absolute top-[calc(50%-8px)] left-[calc(50%-22px)] leading-[17px] font-bold whitespace-nowrap"
        >
          {contactLabel}
        </span>
        {/* eslint-disable-next-line @next/next/no-img-element -- Figma phone badge SVG */}
        <img
          data-node-id="268:544"
          src={MOBILE_HOME_ASSETS.phone}
          alt=""
          width={44}
          height={44}
          className="absolute top-[2px] left-[181px] size-11 max-w-none"
        />
      </a>
    </div>
  );
}
