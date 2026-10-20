import type { CSSProperties } from 'react';

import { MobileFeaturePath } from '@/features/home/ui/mobile/MobileFeaturePath';
import { MobileFrame440 } from '@/features/home/ui/mobile/MobileFrame440';
import { MOBILE_HOME_ASSETS } from '@/features/home/ui/mobile/mobile-assets';

type FeatureKey = 'delivery' | 'quality' | 'prep' | 'support';

type FeatureCrop = {
  /** CSS % for the cropped PNG inside the Figma overflow box. */
  top: string;
  left: string;
  width: string;
  height: string;
};

type FeatureLayoutItem = {
  key: FeatureKey;
  imageSrc: string;
  imageLeft: number;
  imageTop: number;
  imageWidth: number;
  imageHeight: number;
  crop: FeatureCrop;
  labelLeft: number;
  labelTop: number;
  labelWidth?: number;
  labelAlign?: 'left' | 'right';
  labelLeading: string;
  breakTitle?: boolean;
};

type FeatureVisual = FeatureLayoutItem & {
  title: string;
};

type MobileHomeFeaturesProps = {
  titleLine1: string;
  titleLine2: string;
  items: readonly FeatureVisual[];
};

/**
 * Figma Mobile frame y from title (1354) to branches (2320).
 * @see https://www.figma.com/design/zyLVZFDhohLYxwuohIrPDN/Pideh-Dev?node-id=266-424
 */
const FEATURES_BAND_HEIGHT = 966;

/**
 * Absolute layout relative to the features title (Figma y=1354 → local 0).
 * Image crops match Dev Mode overflow insets on nodes 266:448–266:454.
 */
export const MOBILE_FEATURE_LAYOUT: readonly FeatureLayoutItem[] = [
  {
    key: 'delivery',
    imageSrc: MOBILE_HOME_ASSETS.featureDelivery,
    imageLeft: 0,
    imageTop: 129,
    imageWidth: 209.916,
    imageHeight: 180.871,
    crop: { top: '-17.73%', left: '-7.55%', width: '115.09%', height: '133.7%' },
    labelLeft: 52,
    labelTop: 310,
    labelLeading: '0.87',
    breakTitle: true,
  },
  {
    key: 'quality',
    imageSrc: MOBILE_HOME_ASSETS.featureQuality,
    imageLeft: 273,
    imageTop: 223,
    imageWidth: 166.525,
    imageHeight: 173.737,
    crop: { top: '-18.18%', left: '-50%', width: '201.57%', height: '128.81%' },
    // Figma: left 411 + translateX(-100%) + w 213 → box left 198, text-right
    labelLeft: 198,
    labelTop: 397,
    labelWidth: 213,
    labelAlign: 'right',
    labelLeading: '0.95',
    breakTitle: true,
  },
  {
    key: 'prep',
    imageSrc: MOBILE_HOME_ASSETS.featurePrep,
    imageLeft: -14,
    imageTop: 452,
    imageWidth: 197,
    imageHeight: 231,
    crop: { top: '0', left: '-42.24%', width: '184.48%', height: '104.39%' },
    labelLeft: 144,
    labelTop: 573,
    labelWidth: 267,
    labelLeading: '1.04',
  },
  {
    key: 'support',
    imageSrc: MOBILE_HOME_ASSETS.featureSupport,
    imageLeft: 240,
    imageTop: 674,
    imageWidth: 192,
    imageHeight: 189,
    crop: { top: '0', left: '-22.47%', width: '148.1%', height: '100%' },
    labelLeft: 220,
    labelTop: 870,
    labelLeading: '0.85',
  },
] as const;

function FeatureLabel({
  title,
  breakTitle,
  className,
  style,
  dataNodeId,
}: {
  title: string;
  breakTitle?: boolean;
  className: string;
  style: CSSProperties;
  dataNodeId?: string;
}) {
  if (!breakTitle) {
    return (
      <p className={className} style={style} data-node-id={dataNodeId}>
        {title}
      </p>
    );
  }

  const parts = title.trim().split(/\s+/);
  const first = parts[0] ?? title;
  const rest = parts.slice(1).join(' ');

  return (
    <div className={className} style={style} data-node-id={dataNodeId}>
      <p className="mb-0 leading-[inherit]">{first}</p>
      {rest ? <p className="leading-[inherit]">{rest}</p> : null}
    </div>
  );
}

/**
 * Figma “Ընտրիր Փիդեն…” band (266:424–266:458) on the 440 mobile frame.
 */
export function MobileHomeFeatures({ titleLine1, titleLine2, items }: MobileHomeFeaturesProps) {
  return (
    <MobileFrame440 height={FEATURES_BAND_HEIGHT} className="relative z-10">
      <section data-node-id="266:424" className="relative h-full w-[440px] overflow-visible">
        <h2 className="font-display absolute top-0 left-[calc(50%-206px)] z-20 text-[50px] leading-[0.78] whitespace-nowrap text-white">
          <span className="mb-0 block">{titleLine1}</span>
          <span className="block">{titleLine2}</span>
        </h2>

        <MobileFeaturePath />

        {items.map((item) => (
          <div key={item.key} className="pointer-events-none absolute inset-0">
            <div
              className="absolute overflow-hidden"
              style={{
                left: item.imageLeft,
                top: item.imageTop,
                width: item.imageWidth,
                height: item.imageHeight,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.imageSrc}
                alt=""
                loading="lazy"
                decoding="async"
                className="pointer-events-none absolute max-w-none"
                style={{
                  top: item.crop.top,
                  left: item.crop.left,
                  width: item.crop.width,
                  height: item.crop.height,
                }}
              />
            </div>
            <FeatureLabel
              title={item.title}
              breakTitle={item.breakTitle}
              className={`font-montserrat-arm absolute z-10 text-[25px] font-black text-white ${
                item.labelAlign === 'right' ? 'text-right' : 'text-left'
              } ${item.breakTitle || item.labelWidth ? '' : 'whitespace-nowrap'}`}
              style={{
                left: item.labelLeft,
                top: item.labelTop,
                width: item.labelWidth,
                height: item.key === 'quality' ? 48 : undefined,
                lineHeight: item.labelLeading,
              }}
              dataNodeId={
                item.key === 'quality'
                  ? '266:457'
                  : item.key === 'delivery'
                    ? '266:455'
                    : item.key === 'prep'
                      ? '266:456'
                      : '266:458'
              }
            />
          </div>
        ))}
      </section>
    </MobileFrame440>
  );
}
