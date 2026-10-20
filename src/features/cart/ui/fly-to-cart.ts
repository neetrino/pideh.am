/** Marks the cart icon that add-to-cart animations fly into. */
export const CART_TARGET_ATTR = 'data-cart-target';

const FLY_DURATION_MS = 520;
const BUMP_DURATION_MS = 380;
/** Height of the arc the image rises through before dropping into the cart. */
const ARC_LIFT_PX = 90;
/** Curve resolution — more steps keep the sampled path from looking angular. */
const FLIGHT_STEPS = 14;
/** Progress at which the image starts fading into the cart icon. */
const FADE_FROM = 0.8;

function createClone(image: HTMLImageElement, from: DOMRect): HTMLImageElement {
  const clone = image.cloneNode(true) as HTMLImageElement;
  clone.removeAttribute('class');
  clone.removeAttribute('sizes');
  clone.setAttribute('aria-hidden', 'true');
  clone.style.cssText = [
    'position:fixed',
    `left:${from.left}px`,
    `top:${from.top}px`,
    `width:${from.width}px`,
    `height:${from.height}px`,
    'object-fit:contain',
    'pointer-events:none',
    'z-index:200',
  ].join(';');

  return clone;
}

function visibleCartTarget(): HTMLElement | null {
  const targets = document.querySelectorAll<HTMLElement>(`[${CART_TARGET_ATTR}]`);
  for (const target of targets) {
    const box = target.getBoundingClientRect();
    if (box.width > 0 && box.height > 0) return target;
  }
  return null;
}

function bumpCartIcon(target: HTMLElement): void {
  target.animate(
    [
      { transform: 'scale(1)' },
      { transform: 'scale(1.3) rotate(-8deg)' },
      { transform: 'scale(0.94) rotate(4deg)' },
      { transform: 'scale(1) rotate(0deg)' },
    ],
    {
      duration: BUMP_DURATION_MS,
      delay: FLY_DURATION_MS * 0.8,
      easing: 'ease-out',
    },
  );
}

/**
 * Samples a quadratic curve so the image sweeps to the cart in one unbroken
 * move. Every step is linear — a per-step easing would read as a mid-air stop.
 */
function flightKeyframes(dx: number, dy: number, scale: number): Keyframe[] {
  const controlX = dx * 0.35;
  const controlY = dy * 0.35 - ARC_LIFT_PX;

  return Array.from({ length: FLIGHT_STEPS + 1 }, (_unused, step) => {
    const t = step / FLIGHT_STEPS;
    const x = 2 * (1 - t) * t * controlX + t * t * dx;
    const y = 2 * (1 - t) * t * controlY + t * t * dy;
    const stepScale = 1 + (scale - 1) * t;
    const fadeProgress = Math.max(t - FADE_FROM, 0) / (1 - FADE_FROM);

    return {
      offset: t,
      transform: `translate(${x}px, ${y}px) scale(${stepScale}) rotate(${t * 24}deg)`,
      opacity: 1 - fadeProgress * 0.85,
      easing: 'linear',
    };
  });
}

/**
 * Animates a copy of the product image into the header cart icon so adding to
 * the cart is visible without a status message. No-ops when the image or the
 * cart icon is missing, or when the visitor asked for reduced motion.
 */
export function flyToCart(source: HTMLElement | null): void {
  if (typeof window === 'undefined' || source == null) {
    return;
  }
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  const image = source.querySelector('img');
  const target = visibleCartTarget();
  if (image == null || target == null) {
    return;
  }

  const from = image.getBoundingClientRect();
  const to = target.getBoundingClientRect();
  if (from.width === 0 || to.width === 0) {
    return;
  }

  const dx = to.left + to.width / 2 - (from.left + from.width / 2);
  const dy = to.top + to.height / 2 - (from.top + from.height / 2);
  const scale = to.width / from.width;
  const clone = createClone(image, from);
  document.body.appendChild(clone);

  const animation = clone.animate(flightKeyframes(dx, dy, scale), {
    duration: FLY_DURATION_MS,
    easing: 'cubic-bezier(0.3, 0, 0.7, 1)',
    fill: 'forwards',
  });

  animation.onfinish = () => clone.remove();
  animation.oncancel = () => clone.remove();
  bumpCartIcon(target);
}
