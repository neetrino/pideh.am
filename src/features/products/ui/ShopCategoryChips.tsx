import { StaggerGroup, StaggerItem } from '@/components/motion/StaggerGroup';
import { orbitPop } from '@/components/motion/presets';
import { AppLink } from '@/components/ui/AppLink';
import { catalogHref } from '@/features/products/application/catalog-search-params';
import type { CatalogFilters } from '@/features/products/schemas/catalog-list';
import { shopCategoryIcon } from '@/features/products/ui/shop-category-icon';

type ShopCategoryOption = {
  slug: string;
  title: string;
};

/**
 * `onCream` — desktop shop page (cream background, orange active chip).
 * `onOrange` — mobile menu (orange page background, yellow active chip).
 */
export type ShopCategoryChipsTone = 'onCream' | 'onOrange';

const BASE_CHIP =
  'inline-flex h-14 shrink-0 items-center gap-2 rounded-[40px] pr-5 pl-4 font-montserrat-arm text-base font-semibold whitespace-nowrap outline-none transition duration-200 focus-visible:ring-2 focus-visible:ring-[#ffcf48] focus-visible:ring-offset-2';

/**
 * Every chip flattens its glyph to the chip's own label colour, so icon and
 * label always read as one tone (Figma Shop page chips). The source SVGs are
 * filled `#FFCF48`, which matches neither state on its own.
 */
type ChipStyle = {
  chip: string;
  iconColor: string;
};

const INACTIVE_CHIP: ChipStyle = {
  chip: 'bg-white text-[#ff6b00] shadow-none hover:scale-[1.04] hover:bg-white',
  iconColor: '#ff6b00',
};

const ACTIVE_CHIP: Record<ShopCategoryChipsTone, ChipStyle> = {
  onCream: {
    chip: 'bg-[#ff6b00] text-[#ffd255] hover:brightness-105',
    iconColor: '#ffd255',
  },
  onOrange: {
    chip: 'bg-[#ffcf48] text-[#ff6900] hover:brightness-105',
    iconColor: '#ff6900',
  },
};

type ShopCategoryChipsProps = {
  locale: string;
  filters: CatalogFilters;
  categories: readonly ShopCategoryOption[];
  allLabel: string;
  tone?: ShopCategoryChipsTone;
  className?: string;
};

export function ShopCategoryChips({
  locale,
  filters,
  categories,
  allLabel,
  tone = 'onCream',
  className = 'min-w-0 flex-1 overflow-x-auto pb-1',
}: ShopCategoryChipsProps) {
  const allActive = !filters.category;

  return (
    <div role="tablist" aria-label={allLabel} className={className}>
      <StaggerGroup className="flex items-center gap-2.5" stagger={0.06} delayChildren={0.08}>
        <StaggerItem variants={orbitPop}>
          <CategoryChip
            href={catalogHref(locale, filters, { category: undefined, page: 1 })}
            label={allLabel}
            icon={shopCategoryIcon('all')}
            active={allActive}
            tone={tone}
          />
        </StaggerItem>
        {categories.map((category) => {
          const active = filters.category === category.slug;
          return (
            <StaggerItem key={category.slug} variants={orbitPop}>
              <CategoryChip
                href={catalogHref(locale, filters, {
                  category: category.slug,
                  page: 1,
                })}
                label={category.title}
                icon={shopCategoryIcon(category.slug)}
                active={active}
                tone={tone}
              />
            </StaggerItem>
          );
        })}
      </StaggerGroup>
    </div>
  );
}

type CategoryChipProps = {
  href: string;
  label: string;
  icon: ReturnType<typeof shopCategoryIcon>;
  active: boolean;
  tone: ShopCategoryChipsTone;
};

function CategoryChip({ href, label, icon, active, tone }: CategoryChipProps) {
  const style = active ? ACTIVE_CHIP[tone] : INACTIVE_CHIP;

  return (
    <AppLink
      href={href}
      prefetchPolicy="intent"
      scroll={false}
      role="tab"
      aria-selected={active}
      className={`${BASE_CHIP} ${style.chip}`}
    >
      {icon.plain && !active ? (
        // Decorative category mark; the link name is the visible label.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={icon.src}
          alt=""
          width={icon.width}
          height={icon.height}
          className="-ml-1.5 shrink-0 scale-110 object-contain"
        />
      ) : (
        <span
          aria-hidden
          className="shrink-0"
          style={{
            width: icon.width,
            height: icon.height,
            backgroundColor: style.iconColor,
            maskImage: `url(${icon.src})`,
            maskRepeat: 'no-repeat',
            maskPosition: 'center',
            maskSize: 'contain',
            WebkitMaskImage: `url(${icon.src})`,
            WebkitMaskRepeat: 'no-repeat',
            WebkitMaskPosition: 'center',
            WebkitMaskSize: 'contain',
          }}
        />
      )}
      {label}
    </AppLink>
  );
}
